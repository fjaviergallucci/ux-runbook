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
// As a module: validateAcceptance(data) → string[]; acceptPrototype(data, { root, chrome, timeout,
// allowErrors }) → { results, errors }; validateResults(data, { joined }) → string[]; joinResults(data,
// sources) → results; reportOf(lists, { notRun }) → Markdown.
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

// acceptPrototype(data, { root, chrome, timeout, allowErrors }) → { results, errors }.
//   data         an acceptance file's content (see validateAcceptance)
//   root         the prototype folder each check's page is in
//   chrome       the Chrome to drive (lib/chrome.mjs finds one when not given)
//   timeout      how long a page is given to load, to settle, and for each step on it, in milliseconds
//   allowErrors  true: what a page reports as it runs is a warning, not a failure (false when not given)
// The checks are grouped by page, width and theme, and each group's page is opened once, through
// lib/browser.mjs: one context for each width and theme, in the order they first appear, its pages in the
// order they first appear. A page that does not open, does not settle, leaves for another document, or
// cannot be checked fails every check of its group with that fault, and the run goes on. So does a page
// that reports a script error, a console error or a resource that did not load, with what it reported,
// unless allowErrors: a page measured without its stylesheet proves nothing.
// results: one { id, pass, actual, message, criterion, state, page, width, theme } for each check, in the
// file's order. errors: the warnings, { page, message }, once a page whatever the width: a page that would
// not close (its checks were made), and with allowErrors what a page reported.
// Throws a TypeError for bad options, an AcceptError or a ChromeError for a refusal; never for one page.
export async function acceptPrototype(data, { root, chrome, timeout = TIMEOUT, allowErrors = false } = {}) {
  if (typeof root !== 'string' || root === '') throw new TypeError(`root must be the path of a folder; it is ${JSON.stringify(root)}`);
  if (!Number.isSafeInteger(timeout) || timeout < 1) throw new TypeError(`timeout must be a whole number of milliseconds from 1; it is ${JSON.stringify(timeout)}`);
  if (typeof allowErrors !== 'boolean') throw new TypeError(`allowErrors must be true or false; it is ${JSON.stringify(allowErrors)}`);
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
    // What the page reported fails its checks, after any fault of its own, unless errors are allowed.
    const reported = allowErrors || visit.lost ? '' : visit.reports.join('; ');
    const fault = visit.lost ? 'the browser stopped twice while opening this page' : visit.fault || reported;
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
    if (allowErrors) for (const message of visit.reports) report(page, message);
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

// validateResults(data, { joined }) → every fault of a results file, each as "<path>: <what>"; empty when it
// is a list of results as acceptPrototype writes them (other keys beside those are let be). joined: the
// results are to be joined to their checks (joinResults), so each needs no more than what
// window.__uxAccept gives: id, pass, actual and message.
export function validateResults(data, { joined = false } = {}) {
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
    if (joined) return;
    if (!isText(result.criterion)) fault('criterion', 'must be a non-empty string');
    for (const key of ['state', 'page']) {
      if (typeof result[key] !== 'string') fault(key, 'must be a string');
    }
    if (!Number.isSafeInteger(result.width) || result.width < 1) fault('width', 'must be a whole number from 1');
    if (typeof result.theme !== 'string') fault('theme', 'must be a string');
  });
  return errors;
}

// joinResults(data, sources, name) → one result for each check of the acceptance file, in its order: the
// id, pass, actual and message of its result, and the check's own criterion, state, page, width and theme
// (light when not given), which win over any a result carries. A check with no result is not run: its pass
// is null, its actual null, its message empty. sources: [{ file, results }], the results files read; name:
// what the acceptance file is called in a refusal.
// Throws an AcceptError for checks that are not valid, a result whose id no check has, and an id with two
// results, in one file or across them.
export function joinResults(data, sources, name = 'the acceptance checks') {
  const invalid = validateAcceptance(data);
  if (invalid.length > 0) throw new AcceptError(`the acceptance checks are not valid:\n${invalid.map(e => `  ${e}`).join('\n')}`);
  const ids = new Set(data.checks.map(check => check.id));
  const found = new Map();
  for (const { file, results } of sources) {
    for (const result of results) {
      const id = JSON.stringify(result.id);
      if (!ids.has(result.id)) throw new AcceptError(`${file} holds a result for ${id}, and ${name} has no check with that id`);
      if (found.has(result.id)) throw new AcceptError(`${id} has two results: in ${found.get(result.id).file} and in ${file}`);
      found.set(result.id, { file, result });
    }
  }
  return data.checks.map(check => {
    const result = found.get(check.id)?.result;
    const made = result ? { pass: result.pass, actual: result.actual, message: result.message } : { pass: null, actual: null, message: '' };
    return { id: check.id, ...made, criterion: check.criterion, state: check.state, page: check.page, width: check.width, theme: check.theme ?? 'light' };
  });
}

// The count line both the command and the report open with; with notRun, the checks that have no result
// (pass null) are counted too.
const counts = (results, notRun = false) => {
  const failed = results.filter(result => result.pass === false).length;
  const passed = results.filter(result => result.pass === true).length;
  return `${results.length} checks: ${failed} failed, ${notRun ? `${results.length - failed - passed} not run, ` : ''}${passed} passed`;
};

// A table cell: a | is escaped, a line break is a space.
const cell = value => String(value).replace(/\r?\n|\r/g, ' ').replaceAll('|', '\\|');

// reportOf(lists, { notRun }) → the Markdown report of one or more lists of results: the counts, then one
// table row per check, the failed first, each in the order read, with its criterion beside it. notRun: the
// results were joined to their checks (joinResults), and the checks with no result are counted, and listed
// after the failed ones and before the passed.
export function reportOf(lists, { notRun = false } = {}) {
  const results = lists.flat();
  const order = [false, null, true];
  const rows = order.flatMap(pass => results.filter(result => result.pass === pass)).map(result =>
    [
      { false: 'FAIL', null: 'not run', true: 'pass' }[result.pass],
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
    `${counts(results, notRun)}.`,
    '',
    line(['Result', 'Check', 'Criterion', 'State', 'Page', 'Width', 'Theme', 'Actual', 'Message']),
    line(new Array(9).fill('---')),
    ...rows.map(line),
    '',
  ].join('\n');
}

// ---- the command line

const USAGE = `Usage: node scripts/accept.mjs prototype <acceptance.json> --root <folder> --out <results.json> [--chrome <path>] [--timeout <ms>] [--allow-errors]
       node scripts/accept.mjs report <results.json>... --out <file.md> [--checks <acceptance.json>]
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
              finish loading within the timeout, or leaves for another page, and of a page that reports
              an error of its own as it runs (a script error, a console error, a resource that did not
              load), unless --allow-errors. Prints each failed check, and each warning. Exits 1 when any
              check failed.
  report      writes one Markdown table of the results files given: the counts first, then one row for
              each check, the failed first, its criterion beside it. With --checks, each result needs
              only id, pass, actual and message, as window.__uxAccept gives them in a build, and is
              joined to its check by id; a check with no result is listed as not run, after the failed
              ones and before the passed, and counted. A result no check has, or two results for one
              check, is a refusal. A check not run does not change the exit code.
  inpage      prints the absolute path of the in-page file, for a build's own session: evaluate its text
              in the page through the project's driver, then call window.__uxAccept(checks).

  --root <folder>      the prototype folder the checks' pages are in
  --out <file>         where the results, or the report, are written; its folder is made when it is not there
  --chrome <path>      the Chrome to drive; else UX_CHROME, else the first that exists of
                       /usr/bin/google-chrome, /usr/bin/chromium, and the macOS and Windows defaults
  --timeout <ms>       how long a page is given to load, to settle, and for each step on it, in
                       milliseconds; 30000 when not given
  --allow-errors       a page's own errors are printed as warnings and do not fail its checks; a page
                       that would not close is a warning either way
  --checks <file>      the acceptance file the results of report are joined to

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
  prototype: { flags: ['root', 'out', 'chrome', 'timeout'], switches: ['allow-errors'] },
  report: { flags: ['out', 'checks'], switches: [] },
  inpage: { flags: [], switches: [] },
});

function readArgs(argv) {
  const [command, ...rest] = argv;
  if (command === undefined) throw new UsageError('accept takes a command: prototype, report or inpage');
  if (!Object.hasOwn(COMMANDS, command)) {
    if (parseArgs([command]).help) return { help: true };
    throw new UsageError(`unknown command ${JSON.stringify(command)}: it is prototype, report or inpage`);
  }
  const args = parseArgs(rest, COMMANDS[command]);
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
  if (command === 'report') return { command, inputs: positional, out: flags.out, checks: flags.checks };
  return { command, input: positional[0], root: flags.root, out: flags.out, chrome: flags.chrome, timeout: readTimeout(flags), allowErrors: flags['allow-errors'] === true };
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

// An acceptance file, read and valid; a refusal names the file.
function readChecks(input) {
  const data = readJsonFile(input);
  const invalid = validateAcceptance(data);
  if (invalid.length > 0) throw new AcceptError(`${input} is not a valid acceptance file:\n${invalid.map(e => `  ${e}\n`).join('')}`.trimEnd());
  return data;
}

async function prototype({ input, root, out, chrome, timeout, allowErrors }) {
  const data = readChecks(input);
  checkFolder(root);
  readyToWrite(out);
  const { results, errors } = await acceptPrototype(data, { root, chrome, timeout, allowErrors });
  write(out, `${JSON.stringify(results, null, 2)}\n`);
  process.stdout.write(`${counts(results)}; results in ${out}\n`);
  const lines = results.filter(result => !result.pass).map(result => `failed: ${result.id}: ${result.message}\n`);
  for (const { page, message } of errors) lines.push(`warning: ${page}: ${message}\n`);
  process.stderr.write(lines.join(''));
  if (results.some(result => !result.pass)) process.exitCode = 1;
}

function report({ inputs, out, checks }) {
  const data = checks === undefined ? null : readChecks(checks);
  const sources = inputs.map(file => {
    const results = readJsonFile(file);
    const invalid = validateResults(results, { joined: data !== null });
    if (invalid.length > 0) throw new AcceptError(`${file} is not a list of results:\n${invalid.map(e => `  ${e}\n`).join('')}`.trimEnd());
    return { file, results };
  });
  const lists = data === null ? sources.map(({ results }) => results) : [joinResults(data, sources, checks)];
  readyToWrite(out);
  write(out, reportOf(lists, { notRun: data !== null }));
  process.stdout.write(`${counts(lists.flat(), data !== null)}; report in ${out}\n`);
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
