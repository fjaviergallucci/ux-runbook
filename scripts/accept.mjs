#!/usr/bin/env node
// accept: runs a handoff's machine-readable acceptance checks (the copy of ACCEPTANCE.md a script reads),
// each against a state on screen and its elements named by their stable data-ux ids.
//   - On the prototype, before anyone builds: each check names the prototype page that draws its state, and
//     this script opens it at the check's width and theme, headless, through lib/browser.mjs (the session
//     shots uses), and checks it. A check that cannot be made fails with its reason, and the run goes on.
//   - In a build: the Acceptance session puts a state on screen with its project's own driver, evaluates the
//     in-page file (`accept inpage` prints where it is) and calls window.__uxAccept(checks).
//   - The results of either become one Markdown table with `accept report`.
//
// As a module: validateAcceptance(data) → string[]; acceptPrototype(data, { root, chrome, timeout }) →
// { results, errors }; validateResults(data) → string[]; reportOf(lists) → Markdown.
// As a command: see USAGE. Exit codes: 0 success · 1 a refusal, or a check that failed · 2 bad usage.
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIMEOUT, readTimeout, visitPages } from './lib/browser.mjs';
import { ChromeError, findChrome } from './lib/chrome.mjs';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { JsonFileError, readJsonFile, reason } from './lib/json-file.mjs';

// The in-page file: plain browser JavaScript that defines window.__uxAccept.
export const INPAGE = fileURLToPath(new URL('./inpage/accept-inpage.js', import.meta.url));

// The check types the in-page file knows, and the keys each takes beside the ones every check takes.
// order names its ids in `targets`; every other type names its one id in `target`.
export const TYPES = Object.freeze({
  visible: ['target'],
  absent: ['target'],
  text: ['target', 'equals', 'matches'],
  order: ['targets'],
  'in-viewport': ['target'],
  'min-size': ['target', 'minWidth', 'minHeight'],
  contrast: ['target', 'min'],
  count: ['target', 'equals'],
});
// The keys every check takes; theme, language and screen may be left out.
const COMMON = Object.freeze(['id', 'criterion', 'state', 'page', 'width', 'theme', 'language', 'screen', 'type']);
const THEMES = Object.freeze(['light', 'dark']);

// A refusal: checks that are not valid, a prototype folder that cannot be read, an output that cannot be
// written, a Chrome that does not start or keeps stopping.
export class AcceptError extends Error {
  name = 'AcceptError';
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim() !== '';
const keyPath = (path, key) => (/^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`);

// validateAcceptance(data) → every fault of an acceptance file, each as "<path>: <what>", in the file's
// order; empty when it is valid. A type it does not know is no fault: the in-page file fails that check,
// saying so, and an in-page file may be older than the checks it is handed.
export function validateAcceptance(data) {
  if (!isObject(data)) return ['$: must be an object'];
  const errors = [];
  if (!isText(data.design)) errors.push('$.design: must be a non-empty string');
  if (!Array.isArray(data.checks) || data.checks.length === 0) errors.push('$.checks: must be a list of at least one check');
  for (const key of Object.keys(data)) {
    if (key !== 'design' && key !== 'checks') errors.push(`${keyPath('$', key)}: unknown key`);
  }
  if (!Array.isArray(data.checks)) return errors;
  const ids = new Map();
  data.checks.forEach((check, i) => {
    const at = `$.checks[${i}]`;
    if (!isObject(check)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    const fault = (key, what) => errors.push(`${at}.${key}: ${what}`);
    const has = key => Object.hasOwn(check, key);
    if (!isText(check.id)) fault('id', 'must be a non-empty string');
    else if (ids.has(check.id)) fault('id', `${JSON.stringify(check.id)} is also the id of $.checks[${ids.get(check.id)}]`);
    else ids.set(check.id, i);
    for (const key of ['criterion', 'state']) {
      if (!isText(check[key])) fault(key, 'must be a non-empty string');
    }
    const page = pageFault(check.page);
    if (page) fault('page', page);
    if (!Number.isSafeInteger(check.width) || check.width < 1) fault('width', 'must be a whole number of CSS pixels from 1');
    if (has('theme') && !THEMES.includes(check.theme)) fault('theme', 'must be light or dark');
    for (const key of ['language', 'screen']) {
      if (has(key) && !isText(check[key])) fault(key, 'must be a non-empty string');
    }
    if (!isText(check.type)) {
      fault('type', 'must be a non-empty string');
      return;
    }
    // A type it does not know: what every check takes is checked, and anything else is let be.
    if (!Object.hasOwn(TYPES, check.type)) return;
    const takes = TYPES[check.type];
    if (takes.includes('target') && !isText(check.target)) fault('target', 'must be a non-empty string');
    if (check.type === 'order') {
      if (!Array.isArray(check.targets) || check.targets.length < 2) {
        fault('targets', 'must be a list of at least two ids');
      } else {
        check.targets.forEach((id, k) => {
          if (!isText(id)) fault(`targets[${k}]`, 'must be a non-empty string');
          else if (check.targets.indexOf(id) !== k) fault(`targets[${k}]`, `${JSON.stringify(id)} is named twice`);
        });
      }
    }
    if (check.type === 'text') {
      if (has('equals') === has('matches')) errors.push(`${at}: a text check takes exactly one of equals and matches`);
      else if (has('equals') && typeof check.equals !== 'string') fault('equals', 'must be a string');
      else if (has('matches')) {
        if (!isText(check.matches)) fault('matches', 'must be a non-empty string');
        else {
          try {
            new RegExp(check.matches);
          } catch (e) {
            fault('matches', `is not a regular expression (${e.message.replace(/^Invalid regular expression: \/.*\/[a-z]*: /s, '')})`);
          }
        }
      }
    }
    if (check.type === 'min-size') {
      for (const key of ['minWidth', 'minHeight']) {
        if (typeof check[key] !== 'number' || !Number.isFinite(check[key]) || check[key] <= 0) fault(key, 'must be a number above 0');
      }
    }
    if (check.type === 'contrast' && !(typeof check.min === 'number' && check.min >= 1 && check.min <= 21)) fault('min', 'must be a number from 1 to 21');
    if (check.type === 'count' && !(Number.isSafeInteger(check.equals) && check.equals >= 0)) fault('equals', 'must be a whole number from 0');
    for (const key of Object.keys(check)) {
      if (!COMMON.includes(key) && !takes.includes(key)) errors.push(`${keyPath(at, key)}: unknown key for type ${check.type}`);
    }
  });
  return errors;
}

// What is wrong with a check's page, or null: a path relative to the prototype folder, inside it, that
// needs no decoding (a #, ?, % or backslash would be read as something else in an address).
function pageFault(page) {
  if (!isText(page)) return 'must be a non-empty string';
  const said = JSON.stringify(page);
  if (page.startsWith('/') || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(page)) return `must be a relative path; it is ${said}`;
  if (/[#?%\\]/.test(page)) return `must hold no #, ?, % or backslash; it is ${said}`;
  const normal = posix.normalize(page);
  if (normal === '..' || normal.startsWith('../')) return `must stay inside the prototype folder; it is ${said}`;
  return null;
}

// What is done with each page: the in-page file is evaluated in it, and the checks of its group are made.
// Each group is the checks of one page at one width and theme.
const checking = (source, groups) => ({
  run: async (page, timeout, file, run) => {
    await page.evaluate(source);
    return page.evaluate(checks => window.__uxAccept(checks), groups.get(run).get(file).map(({ check }) => check));
  },
  failed: 'the checks could not be run',
  during: ' while it was being checked',
  unread: 'the page could not be read again once checked',
});

// acceptPrototype(data, { root, chrome, timeout }) → { results, errors }.
//   data     an acceptance file's content (see validateAcceptance)
//   root     the prototype folder each check's page is in
//   chrome   the Chrome to drive (lib/chrome.mjs finds one when not given)
//   timeout  how long a page is given to load, to settle, and for each step on it, in milliseconds
// The checks are grouped by page, width and theme, and each group's page is opened once, through
// lib/browser.mjs: one context for each width and theme, in the order they first appear, its pages in the
// order they first appear. A page that does not open, does not settle, leaves for another document, or
// cannot be checked fails every check of its group with that fault, and the run goes on.
// results: one { id, pass, actual, message, criterion, state, page, width, theme } for each check, in the
// file's order. errors: { page, message } for what a page reported as it ran (a script error, a console
// error, a resource that did not load, a page that would not close), once a page whatever the width; they
// do not decide whether a check passed.
// Throws a TypeError for bad options, an AcceptError or a ChromeError for a refusal; never for one page.
export async function acceptPrototype(data, { root, chrome, timeout = TIMEOUT } = {}) {
  if (typeof root !== 'string' || root === '') throw new TypeError(`root must be the path of a folder; it is ${JSON.stringify(root)}`);
  if (!Number.isSafeInteger(timeout) || timeout < 1) throw new TypeError(`timeout must be a whole number of milliseconds from 1; it is ${JSON.stringify(timeout)}`);
  const invalid = validateAcceptance(data);
  if (invalid.length > 0) throw new AcceptError(`the acceptance checks are not valid:\n${invalid.map(e => `  ${e}`).join('\n')}`);
  checkFolder(root);
  const source = readFileSync(INPAGE, 'utf8');
  const executablePath = findChrome(chrome);
  // Runs, by width and theme; in each, the checks of each page file, with their place in the file.
  const runs = [];
  const groups = new Map();
  data.checks.forEach((check, place) => {
    const theme = check.theme ?? 'light';
    let run = runs.find(r => r.width === check.width && r.theme === theme);
    if (!run) {
      run = { width: check.width, theme, files: [] };
      runs.push(run);
      groups.set(run, new Map());
    }
    const file = join(root, check.page);
    if (!groups.get(run).has(file)) {
      run.files.push(file);
      groups.get(run).set(file, []);
    }
    groups.get(run).get(file).push({ check, place });
  });
  const results = new Array(data.checks.length);
  const errors = [];
  const said = new Set();
  const report = (page, message) => {
    const key = `${page}\n${message}`;
    if (said.has(key)) return;
    said.add(key);
    errors.push({ page, message });
  };
  await visitPages(executablePath, runs, { timeout, act: checking(source, groups), Refusal: AcceptError }, (file, visit, run) => {
    const group = groups.get(run).get(file);
    const page = group[0].check.page;
    const fault = visit.lost ? 'the browser stopped twice while opening this page' : visit.fault;
    group.forEach(({ check, place }, i) => {
      const found = fault ? null : visit.value?.[i];
      const made = fault
        ? { pass: false, actual: null, message: fault }
        : isObject(found) && found.id === check.id && typeof found.pass === 'boolean'
          ? { pass: found.pass, actual: found.actual ?? null, message: String(found.message ?? '') }
          : { pass: false, actual: null, message: 'the page gave no result for this check' };
      results[place] = { id: check.id, ...made, criterion: check.criterion, state: check.state, page: check.page, width: check.width, theme: run.theme };
    });
    if (visit.lost) return;
    for (const message of visit.reports) report(page, message);
    if (visit.closing) report(page, visit.closing);
  });
  return { results, errors };
}

function checkFolder(folder) {
  let stat;
  try {
    stat = statSync(folder);
  } catch (e) {
    throw new AcceptError(`cannot read ${folder}: ${reason(e)}`);
  }
  if (!stat.isDirectory()) throw new AcceptError(`cannot read ${folder}: it is a file, not a folder`);
}

// validateResults(data) → every fault of a results file, each as "<path>: <what>"; empty when it is a list
// of results as acceptPrototype writes them (other keys beside those are let be).
export function validateResults(data) {
  if (!Array.isArray(data)) return ['$: must be a list of results'];
  const errors = [];
  data.forEach((result, i) => {
    const at = `$[${i}]`;
    if (!isObject(result)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    const fault = (key, what) => errors.push(`${at}.${key}: ${what}`);
    if (!isText(result.id)) fault('id', 'must be a non-empty string');
    if (typeof result.pass !== 'boolean') fault('pass', 'must be true or false');
    if (!Object.hasOwn(result, 'actual')) fault('actual', 'is missing');
    if (typeof result.message !== 'string') fault('message', 'must be a string');
    if (!isText(result.criterion)) fault('criterion', 'must be a non-empty string');
    for (const key of ['state', 'page']) {
      if (typeof result[key] !== 'string') fault(key, 'must be a string');
    }
    if (!Number.isSafeInteger(result.width) || result.width < 1) fault('width', 'must be a whole number from 1');
    if (typeof result.theme !== 'string') fault('theme', 'must be a string');
  });
  return errors;
}

// The count line both the command and the report open with.
const counts = results => {
  const failed = results.filter(result => !result.pass).length;
  return `${results.length} checks: ${failed} failed, ${results.length - failed} passed`;
};

// A table cell: a | is escaped, a line break is a space.
const cell = value => String(value).replace(/\r?\n|\r/g, ' ').replaceAll('|', '\\|');

// reportOf(lists) → the Markdown report of one or more lists of results: the counts, then one table row per
// check, the failed first, each in the order read, with its criterion beside it.
export function reportOf(lists) {
  const results = lists.flat();
  const rows = [...results.filter(result => !result.pass), ...results.filter(result => result.pass)].map(result =>
    [
      result.pass ? 'pass' : 'FAIL',
      result.id,
      result.criterion,
      result.state,
      result.page,
      result.width,
      result.theme,
      result.actual === null || result.actual === undefined ? '' : JSON.stringify(result.actual),
      result.message,
    ].map(cell),
  );
  const line = cells => `| ${cells.join(' | ')} |`;
  return [
    `${counts(results)}.`,
    '',
    line(['Result', 'Check', 'Criterion', 'State', 'Page', 'Width', 'Theme', 'Actual', 'Message']),
    line(new Array(9).fill('---')),
    ...rows.map(line),
    '',
  ].join('\n');
}

// ---- the command line

const USAGE = `Usage: node scripts/accept.mjs prototype <acceptance.json> --root <folder> --out <results.json> [--chrome <path>] [--timeout <ms>]
       node scripts/accept.mjs report <results.json>... --out <file.md>
       node scripts/accept.mjs inpage

Runs a handoff's machine-readable acceptance checks. Each check names a state, the prototype page that
draws it, a screen width in CSS pixels, a theme (light when not given), a type, and the element it is about
by its data-ux id, or, with "screen", by its data-ux inside the element whose data-screen is that screen.

  prototype   opens each check's page in the prototype folder, headless, at its width and theme, with
              reduced motion set, 900 px high, and makes its checks there: each page once for each width
              and theme its checks name. Writes one result for each check, in the file's order:
              { id, pass, actual, message, criterion, state, page, width, theme }. A check that cannot be
              made (its element missing, or there twice; a type the in-page file does not know) fails,
              saying why, and the run goes on; so do the checks of a page that does not open, does not
              finish loading within the timeout, or leaves for another page. Prints each failed check, and
              what a page reported as it ran (a script error, a resource that did not load) as a warning
              that does not decide anything. Exits 1 when any check failed.
  report      writes one Markdown table of the results files given: the counts first, then one row for
              each check, the failed first, its criterion beside it.
  inpage      prints the absolute path of the in-page file, for a build's own session: evaluate its text
              in the page through the project's driver, then call window.__uxAccept(checks).

  --root <folder>      the prototype folder the checks' pages are in
  --out <file>         where the results, or the report, are written; its folder is made when it is not there
  --chrome <path>      the Chrome to drive; else UX_CHROME, else the first that exists of
                       /usr/bin/google-chrome, /usr/bin/chromium, and the macOS and Windows defaults
  --timeout <ms>       how long a page is given to load, to settle, and for each step on it, in
                       milliseconds; 30000 when not given

The types, and the keys each takes:
  visible       target: exactly one element has it, and it is rendered (not display: none or opacity: 0,
                on itself or an element it is in; visibility: visible; a box of some width and height)
  absent        target: no element has it, or none that has it is rendered
  text          target, and equals (a string) or matches (a regular expression): the element's text, its
                white space made single spaces and trimmed
  order         targets (two or more ids): they come in that order in the document
  in-viewport   target: rendered, and its whole box inside the first viewport, without scrolling
  min-size      target, minWidth, minHeight: its box is at least minWidth by minHeight CSS pixels
  contrast      target, min (1 to 21): its text colour against the nearest background behind it that is
                not transparent, as a WCAG ratio
  count         target, equals: the number of elements whose data-ux starts with target

A flag may also be written --flag=value.

Exit codes: 0 success · 1 a refusal (a file that cannot be read, checks or results that are not valid, an
output that cannot be written, no Chrome), or a check that failed · 2 bad usage.
`;

const COMMANDS = Object.freeze({
  prototype: { flags: ['root', 'out', 'chrome', 'timeout'] },
  report: { flags: ['out'] },
  inpage: { flags: [] },
});

function readArgs(argv) {
  const [command, ...rest] = argv;
  if (command === undefined) throw new UsageError('accept takes a command: prototype, report or inpage');
  if (!Object.hasOwn(COMMANDS, command)) {
    if (parseArgs([command]).help) return { help: true };
    throw new UsageError(`unknown command ${JSON.stringify(command)}: it is prototype, report or inpage`);
  }
  const args = parseArgs(rest, { flags: COMMANDS[command].flags });
  if (args.help) return args;
  const { positional, flags } = args;
  if (command === 'inpage') {
    if (positional.length > 0) throw new UsageError('inpage takes nothing more');
    return { command };
  }
  if (command === 'prototype' && positional.length !== 1) throw new UsageError('prototype takes one <acceptance.json>');
  if (command === 'report' && positional.length === 0) throw new UsageError('report takes at least one <results.json>');
  for (const name of command === 'prototype' ? ['root', 'out'] : ['out']) {
    if (!Object.hasOwn(flags, name)) throw new UsageError(`--${name} is missing`);
  }
  if (command === 'report') return { command, inputs: positional, out: flags.out };
  return { command, input: positional[0], root: flags.root, out: flags.out, chrome: flags.chrome, timeout: readTimeout(flags) };
}

// An output file whose folder is made, and that is no folder itself; checked before any work is done.
function readyToWrite(out) {
  try {
    mkdirSync(dirname(out), { recursive: true });
  } catch (e) {
    throw new AcceptError(`cannot write ${out}: ${e.code === 'EEXIST' ? 'part of the path is a file, not a folder' : reason(e)}`);
  }
  let folder = false;
  try {
    folder = statSync(out).isDirectory();
  } catch {}
  if (folder) throw new AcceptError(`cannot write ${out}: it is a folder, not a file`);
}

function write(out, text) {
  try {
    writeFileSync(out, text);
  } catch (e) {
    throw new AcceptError(`cannot write ${out}: ${reason(e)}`);
  }
}

async function prototype({ input, root, out, chrome, timeout }) {
  const data = readJsonFile(input);
  const invalid = validateAcceptance(data);
  if (invalid.length > 0) throw new AcceptError(`${input} is not a valid acceptance file:\n${invalid.map(e => `  ${e}\n`).join('')}`.trimEnd());
  checkFolder(root);
  readyToWrite(out);
  const { results, errors } = await acceptPrototype(data, { root, chrome, timeout });
  write(out, `${JSON.stringify(results, null, 2)}\n`);
  process.stdout.write(`${counts(results)}; results in ${out}\n`);
  const lines = results.filter(result => !result.pass).map(result => `failed: ${result.id}: ${result.message}\n`);
  for (const { page, message } of errors) lines.push(`warning: ${page}: ${message}\n`);
  process.stderr.write(lines.join(''));
  if (results.some(result => !result.pass)) process.exitCode = 1;
}

function report({ inputs, out }) {
  const lists = inputs.map(input => {
    const data = readJsonFile(input);
    const invalid = validateResults(data);
    if (invalid.length > 0) throw new AcceptError(`${input} is not a list of results:\n${invalid.map(e => `  ${e}\n`).join('')}`.trimEnd());
    return data;
  });
  readyToWrite(out);
  write(out, reportOf(lists));
  process.stdout.write(`${counts(lists.flat())}; report in ${out}\n`);
}

async function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) process.stdout.write(USAGE);
    else if (args.command === 'inpage') process.stdout.write(`${INPAGE}\n`);
    else if (args.command === 'report') report(args);
    else await prototype(args);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof AcceptError || e instanceof ChromeError || e instanceof JsonFileError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) await main(process.argv.slice(2));
