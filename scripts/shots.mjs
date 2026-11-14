#!/usr/bin/env node
// shots: photographs pages — a board's drawn proposals, a prototype, the final screens — headless, at each
// width and theme asked for, with reduced motion set on every context. Judges and simulated users read
// these pictures, so a picture of a broken page is reported, not passed: a script error, a console error,
// a resource or a navigation that fails, a page that puts another page in its place, is an error of its page;
// a page wider than the screen at a width is an overflow, reported but never an error. A page is judged by
// its document, never by its address: no picture is kept under a page's name unless the document that was
// loaded was still the one in the tab once the picture was taken. Nothing about one page ends the run, and
// no run goes on for ever: every wait has a limit, and every retry a count. The browser handling is
// lib/browser.mjs, shared with accept.
//
// As a module: shoot(inputs, { out, widths, themes, chrome, timeout }) → { files, overflow, errors, titles }.
// As a command: see USAGE. Exit codes: 0 success · 1 a refusal (a page with an error, unless
// --allow-errors; an unreadable input; an unwritable output; no Chrome) · 2 bad usage.
import { mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { CLOSE_MS, TIMEOUT, nameOf, visitPages } from './lib/browser.mjs';
import { ChromeError, findChrome } from './lib/chrome.mjs';
import { UsageError, isMain, parseArgs, readTimeout } from './lib/cli.mjs';
import { reason } from './lib/json-file.mjs';

export { CLOSE_MS, TIMEOUT, nameOf };
export const THEMES = Object.freeze(['light', 'dark']);

// A refusal, never about one page: an input that cannot be read, an output folder that cannot be made or
// cannot hold a picture, a Chrome that does not start, or that keeps stopping.
export class ShotsError extends Error {
  name = 'ShotsError';
}

// What is done with each page once it has settled: it is pictured whole, and the picture held in memory
// until its document is known to have stayed in the tab.
const PICTURE = Object.freeze({
  run: (page, timeout) => page.screenshot({ fullPage: true, timeout }),
  failed: 'the picture could not be taken',
  during: ' while it was being pictured',
  unread: 'the page could not be read again once pictured',
});

// shoot(inputs, { out, widths, themes, chrome, timeout }) → { files, overflow, errors, titles }.
//   inputs  pages to photograph: an .html file, or a folder, which means every .html file directly in it
//   out     the folder the pictures go to, made when it is not there; each is <name>-<width>-<theme>.png,
//           <name> being the page's file name without its extension, pictured whole
//   widths  screen widths in CSS pixels; themes 'light' and/or 'dark' (light when not given)
//   chrome  the Chrome to drive (lib/chrome.mjs finds one when not given)
//   timeout how long a page is given to load, to settle, and for each step on it, in milliseconds (TIMEOUT
//           when not given)
// One browser at a time, one context per width and theme (lib/browser.mjs). Everything is read and checked
// before Chrome starts. A page that will not close, or a browser that dies, is an error of that page, and
// the run goes on in a fresh browser; a page whose browser stops twice before it can be opened is an error
// of that page; every browser the run started is gone when it ends, however it ends.
// files: the pictures taken, in the order taken. overflow: { file, width } for each page wider than the
// screen at a width, once whatever the theme. errors: { file, message } for each fault of a page, once
// however many pictures saw it; no picture is kept of a page that did not open, did not settle, was no
// longer the document in the tab before or after its picture, or could not be read or pictured. titles:
// each page's document title once loaded, from the first picture of it.
// Throws a TypeError for bad options, a ShotsError or a ChromeError for a refusal; never for one page.
export async function shoot(inputs, { out, widths, themes = ['light'], chrome, timeout = TIMEOUT } = {}) {
  checkOptions(inputs, { out, widths, themes, timeout });
  const pages = pagesOf(inputs);
  const executablePath = findChrome(chrome);
  makeFolder(out);
  const found = new Found();
  const names = new Map(pages.map(({ file, name }) => [file, name]));
  const files = pages.map(({ file }) => file);
  const runs = widths.flatMap(width => themes.map(theme => ({ width, theme, files })));
  await visitPages(executablePath, runs, { timeout, act: PICTURE, Refusal: ShotsError }, (file, visit, { width, theme }) => {
    const picture = join(out, `${names.get(file)}-${width}-${theme}.png`);
    // Whenever no picture is written, an older one under the same name is removed, so that none is read in
    // its place.
    if (visit.lost) {
      found.error(file, 'the browser stopped twice while opening this page');
      removeOlder(picture);
      return;
    }
    if (visit.fault) {
      found.error(file, visit.fault);
    } else {
      if (!Object.hasOwn(found.titles, file)) found.titles[file] = visit.read.title;
      if (visit.read.wide) found.overflows(file, width);
      try {
        writeFileSync(picture, visit.value);
      } catch (e) {
        throw new ShotsError(`cannot write ${picture}: ${reason(e)}`);
      }
      found.files.push(picture);
    }
    for (const message of visit.reports) found.error(file, message);
    if (visit.fault) removeOlder(picture);
    if (visit.closing) found.error(file, visit.closing);
  });
  return found.result();
}

function checkOptions(inputs, { out, widths, themes, timeout }) {
  if (!Array.isArray(inputs) || inputs.length === 0 || !inputs.every(input => typeof input === 'string' && input !== '')) {
    throw new TypeError(`inputs must be a list of at least one path; it is ${JSON.stringify(inputs)}`);
  }
  if (typeof out !== 'string' || out === '') throw new TypeError(`out must be the path of a folder; it is ${JSON.stringify(out)}`);
  if (!Array.isArray(widths) || widths.length === 0 || !widths.every(width => Number.isSafeInteger(width) && width > 0)) {
    throw new TypeError(`widths must be a list of whole numbers from 1; it is ${JSON.stringify(widths)}`);
  }
  if (!Array.isArray(themes) || themes.length === 0 || !themes.every(theme => THEMES.includes(theme))) {
    throw new TypeError(`themes must be a list of ${THEMES.join(' and ')}; it is ${JSON.stringify(themes)}`);
  }
  if (!Number.isSafeInteger(timeout) || timeout < 1) {
    throw new TypeError(`timeout must be a whole number of milliseconds from 1; it is ${JSON.stringify(timeout)}`);
  }
  for (const list of [widths, themes]) {
    const twice = list.find((value, i) => list.indexOf(value) !== i);
    if (twice !== undefined) throw new TypeError(`${twice} is given twice`);
  }
}

// The pages the inputs name, each once, each with the name its pictures carry. Two pages whose pictures
// would carry one name, on a file system that may ignore case, are refused: one would overwrite the other.
function pagesOf(inputs) {
  const files = inputs.flatMap(input => {
    const stat = statOf(input);
    if (stat.isFile()) return [input];
    if (!stat.isDirectory()) throw new ShotsError(`cannot read ${input}: it is not a file or a folder`);
    const inFolder = listOf(input)
      .filter(name => /\.html$/i.test(name))
      .sort()
      .map(name => join(input, name))
      .filter(file => statOf(file).isFile());
    if (inFolder.length === 0) throw new ShotsError(`${input} holds no .html page`);
    return inFolder;
  });
  const seen = new Set();
  const named = new Map();
  const pages = [];
  for (const file of files) {
    const path = resolve(file);
    if (seen.has(path)) continue;
    seen.add(path);
    const name = basename(file, extname(file));
    const key = name.toLowerCase();
    if (named.has(key)) throw new ShotsError(`${named.get(key)} and ${file} would be pictured under one name: shoot them into different folders`);
    named.set(key, file);
    pages.push({ file, name });
  }
  return pages;
}

function statOf(path) {
  try {
    return statSync(path);
  } catch (e) {
    throw new ShotsError(`cannot read ${path}: ${reason(e)}`);
  }
}

function listOf(folder) {
  try {
    return readdirSync(folder);
  } catch (e) {
    throw new ShotsError(`cannot read ${folder}: ${reason(e)}`);
  }
}

function makeFolder(folder) {
  try {
    mkdirSync(folder, { recursive: true });
  } catch (e) {
    throw new ShotsError(`cannot write ${folder}: ${e.code === 'EEXIST' ? 'it is a file, not a folder' : reason(e)}`);
  }
}

// What the pictures found, each fault and each overflow once.
class Found {
  files = [];
  overflow = [];
  errors = [];
  titles = {};
  #seen = new Set();

  once(key, add) {
    if (this.#seen.has(key)) return;
    this.#seen.add(key);
    add();
  }

  error(file, message) {
    this.once(`error\n${file}\n${message}`, () => this.errors.push({ file, message }));
  }

  overflows(file, width) {
    this.once(`overflow\n${file}\n${width}`, () => this.overflow.push({ file, width }));
  }

  result() {
    return { files: this.files, overflow: this.overflow, errors: this.errors, titles: this.titles };
  }
}

// An older picture under a name that got none this time; a folder there is no picture and stays.
function removeOlder(picture) {
  try {
    unlinkSync(picture);
  } catch {}
}

// ---- the command line

const USAGE = `Usage: node scripts/shots.mjs <file or folder>... --out <folder> --widths <w,w...> [--themes light,dark] [--chrome <path>] [--timeout <ms>] [--allow-errors]

Photographs each page headless, in the machine's own Chrome, at each width and theme, with reduced motion
set: one full-page PNG per page, width and theme, named <name>-<width>-<theme>.png, <name> being the
page's file name without its extension. A folder means every .html file directly in it.

  --out <folder>       where the pictures go; made when it is not there
  --widths <w,w...>    screen widths in CSS pixels, whole numbers joined by commas, as 1280,390;
                       the screen is 900 px high, and a taller page is pictured whole
  --themes <t,t...>    light, dark or both, joined by a comma; light when not given
  --chrome <path>      the Chrome to drive; else UX_CHROME, else the first that exists of
                       /usr/bin/google-chrome, /usr/bin/chromium, and the macOS and Windows defaults
  --timeout <ms>       how long a page is given to load, to settle, and for each step on it, in
                       milliseconds; 30000 when not given
  --allow-errors       exit 0 even when a page has an error; the errors are still printed

A page has an error when a script throws, when it writes an error to the console, when a resource it asks
for (a stylesheet, an image) does not load, when it does not open or finish loading in time, when it
keeps moving from page to page, when it puts another page, or its own file loaded again, in its place,
or when it cannot be read, pictured or closed. Each is printed as one line, "error: <page>: <what>", and
exits 1 unless --allow-errors; the pictures that could be taken are taken, and none is kept under the
name of a page that got no picture this time.
A page is judged once it has settled: 100 ms without moving. It is judged by its document, not by its
address: a picture is kept only if the document that was loaded is still the one in the tab once the
picture is taken. A page that leaves before its picture, or while it is taken, has an error saying where
it went, and no picture. A change of what follows the # of its address, or of its query through its
history, keeps the document, and the page is pictured.
Nothing waits without a limit: a page that will not close, or a browser that dies, is an error of that
page, and the run goes on in a fresh browser; every browser the run started is gone when it ends.
A browser that stops twice before a page can be opened in it is an error of that page; three browsers
started in a row with no page opened end the run.
A page wider than the screen at a width is printed as "overflow: <page> is wider than the screen at <w>
px" and does not change the exit code.
A script error raised after the picture is taken is not seen.
A request Chrome cancels itself (net::ERR_ABORTED, as a video may) is reported as an error too.

A flag may also be written --flag=value.

Exit codes: 0 success · 1 a refusal (a page with an error, an unreadable input, an unwritable output,
no Chrome, a Chrome that does not start or keeps stopping) · 2 bad usage.
`;

const WIDTHS = /^[1-9]\d*(?:,[1-9]\d*)*$/;
const THEME_LIST = /^(?:light|dark)(?:,(?:light|dark))*$/;

// A list written with commas, each value once.
function listFlag(flags, name, pattern, what, ok = () => true) {
  const text = flags[name];
  const values = text.split(',');
  if (!pattern.test(text) || !values.every(ok)) throw new UsageError(`--${name} must be ${what}; it is "${text}"`);
  const twice = values.find((value, i) => values.indexOf(value) !== i);
  if (twice !== undefined) throw new UsageError(`--${name} names ${twice} twice`);
  return values;
}

function readArgs(argv) {
  const args = parseArgs(argv, { flags: ['out', 'widths', 'themes', 'chrome', 'timeout'], switches: ['allow-errors'] });
  if (args.help) return args;
  const { positional, flags } = args;
  if (positional.length === 0) throw new UsageError('shots takes at least one <file or folder>');
  for (const name of ['out', 'widths']) {
    if (!Object.hasOwn(flags, name)) throw new UsageError(`--${name} is missing`);
  }
  const widths = listFlag(flags, 'widths', WIDTHS, 'whole numbers from 1, joined by commas, as 1280,390', width => Number.isSafeInteger(Number(width))).map(Number);
  const themes = Object.hasOwn(flags, 'themes') ? listFlag(flags, 'themes', THEME_LIST, 'light, dark or both, joined by a comma') : ['light'];
  const timeout = readTimeout(flags);
  return { inputs: positional, out: flags.out, widths, themes, chrome: flags.chrome, timeout, allowErrors: flags['allow-errors'] === true };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

async function run({ inputs, out, widths, themes, chrome, timeout, allowErrors }) {
  const { files, overflow, errors } = await shoot(inputs, { out, widths, themes, chrome, timeout });
  const lines = [`shot ${plural(files.length, 'picture')} at ${widths.join(', ')} px, ${themes.join(' and ')}, into ${out}\n`];
  for (const { file, width } of overflow) lines.push(`overflow: ${file} is wider than the screen at ${width} px\n`);
  process.stdout.write(lines.join(''));
  process.stderr.write(errors.map(({ file, message }) => `error: ${file}: ${message}\n`).join(''));
  if (errors.length > 0 && !allowErrors) process.exitCode = 1;
}

async function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) process.stdout.write(USAGE);
    else await run(args);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof ShotsError || e instanceof ChromeError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) await main(process.argv.slice(2));
