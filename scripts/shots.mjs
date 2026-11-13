#!/usr/bin/env node
// shots: photographs pages — a board's drawn proposals, a prototype, the final screens — headless, at each
// width and theme asked for, with reduced motion set on every context. Judges and simulated users read
// these pictures, so a picture of a broken page is reported, not passed: a script error, a console error,
// a resource or a navigation that fails, a page that sends itself to another page, is an error of its page;
// a page wider than the screen at a width is an overflow, reported but never an error. Nothing about one
// page ends the run.
//
// As a module: shoot(inputs, { out, widths, themes, chrome, timeout }) → { files, overflow, errors, titles }.
// As a command: see USAGE. Exit codes: 0 success · 1 a refusal (a page with an error, unless
// --allow-errors; an unreadable input; an unwritable output; no Chrome) · 2 bad usage.
import { mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, errors as playwright } from 'playwright-core';
import { ChromeError, findChrome } from './lib/chrome.mjs';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { reason } from './lib/json-file.mjs';

export const THEMES = Object.freeze(['light', 'dark']);
// Every picture is taken on a screen this high; a page taller than it is pictured whole.
const HEIGHT = 900;
// How long a page is given to load, and each step on it, when nobody says, in milliseconds.
export const TIMEOUT = 30000;

// A refusal, never about one page: an input that cannot be read, an output folder that cannot be made or
// cannot hold a picture, a Chrome that does not start.
export class ShotsError extends Error {
  name = 'ShotsError';
}

// shoot(inputs, { out, widths, themes, chrome, timeout }) → { files, overflow, errors, titles }.
//   inputs  pages to photograph: an .html file, or a folder, which means every .html file directly in it
//   out     the folder the pictures go to, made when it is not there; each is <name>-<width>-<theme>.png,
//           <name> being the page's file name without its extension, pictured whole
//   widths  screen widths in CSS pixels; themes 'light' and/or 'dark' (light when not given)
//   chrome  the Chrome to drive (lib/chrome.mjs finds one when not given)
//   timeout how long a page is given to load, and each step on it, in milliseconds (TIMEOUT when not given)
// One browser, one context per width and theme. Everything is read and checked before Chrome starts, and
// the browser is closed however shooting ends.
// files: the pictures taken, in the order taken. overflow: { file, width } for each page wider than the
// screen at a width, once whatever the theme. errors: { file, message } for each fault of a page, once
// however many pictures saw it; no picture is taken of a page that did not open, could not be read or
// pictured, or sent itself to another page. titles: each page's document title once loaded, from the first
// picture of it.
// Throws a TypeError for bad options, a ShotsError or a ChromeError for a refusal; never for one page.
export async function shoot(inputs, { out, widths, themes = ['light'], chrome, timeout = TIMEOUT } = {}) {
  checkOptions(inputs, { out, widths, themes, timeout });
  const pages = pagesOf(inputs);
  const executablePath = findChrome(chrome);
  makeFolder(out);
  let browser;
  try {
    browser = await chromium.launch({ executablePath, headless: true });
  } catch (e) {
    throw new ShotsError(`Chrome at ${executablePath} did not start: ${firstLine(e.message)}`);
  }
  const found = new Found();
  try {
    for (const width of widths) {
      for (const theme of themes) {
        const context = await browser.newContext({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: theme });
        for (const { file, name } of pages) await shootPage(context, file, join(out, `${name}-${width}-${theme}.png`), width, found, timeout);
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
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

const firstLine = text => String(text).split('\n')[0].replace(/^[a-zA-Z]+\.[a-zA-Z]+: /, '');

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

// One picture of one page in one context. Nothing about one page ends the run: each step (opening it,
// reading its title and width, picturing it) and each report it makes is guarded, and what fails is an error
// of the page asked for. A page that sends itself to another page, at any moment until it is pictured, is
// not the page asked for: that is its error, whatever else failed, and it is not pictured. Whenever no
// picture is written, an older one under the same name is removed, so that none is read in its place.
// The page's faults are said after, each once: a resource that failed is said once, and Chrome's own console
// line about the same resource is not said again.
async function shootPage(context, file, picture, width, found, timeout) {
  const page = await context.newPage();
  const target = pathToFileURL(resolve(file)).href;
  const folder = dirname(resolve(file));
  const scripts = [];
  const consoled = [];
  const failed = new Map();
  const unread = [];
  // Where the page last sent itself, when that is another page, and why that page did not open, if it did not.
  let sentTo = null;
  const notOpened = new Map();
  // A move of the page under way and not landed yet (committed, an error page included), and what to call
  // when it lands:
  // Chrome can hang for good closing a page in that moment, so the page is closed only once it has landed.
  // Its opening is the first such move, under way from the start: an opening given up early (a timeout of
  // a millisecond) has often not landed yet.
  let moving = true;
  let landed = () => {};
  const isPageNavigation = request => request.isNavigationRequest() && request.frame() === page.mainFrame();
  // A file beside the page is named by its path from the page's folder; anything else, and a file address
  // that is no path here (//host/x from a file page), by its address.
  const nameOf = url => {
    if (!url.startsWith('file:')) return url;
    let path;
    try {
      path = fileURLToPath(url);
    } catch (e) {
      if (NOT_A_PATH.includes(e.code)) return url;
      throw e;
    }
    return relative(folder, path).split(sep).join('/');
  };
  // A report the page makes that cannot be read is said as such, never thrown where no one can catch it.
  const guarded = listener => (...args) => {
    try {
      listener(...args);
    } catch (e) {
      unread.push(`a report from the page could not be read: ${firstLine(e.message)}`);
    }
  };
  page.on('pageerror', guarded(error => scripts.push(`script error: ${error.message}`)));
  page.on('console', guarded(message => {
    if (message.type() === 'error') consoled.push({ text: message.text(), url: message.location().url });
  }));
  page.on('request', guarded(request => {
    if (!isPageNavigation(request)) return;
    moving = true;
    sentTo = request.url() === target ? null : request.url();
  }));
  page.on('framenavigated', guarded(frame => {
    if (frame !== page.mainFrame()) return;
    moving = false;
    landed();
  }));
  page.on('requestfailed', guarded(request => {
    const url = request.url();
    // The page's own document failing is the opening's failure; another page it went to, where it went.
    if (isPageNavigation(request)) {
      if (url !== target) notOpened.set(url, request.failure()?.errorText);
      return;
    }
    failed.set(url, `${nameOf(url)} did not ${request.isNavigationRequest() ? 'open' : 'load'}: ${request.failure()?.errorText}`);
  }));
  page.on('response', guarded(response => {
    if (response.status() >= 400) failed.set(response.url(), `${nameOf(response.url())} did not load: HTTP ${response.status()}`);
  }));
  let fault = null;
  let read;
  let png;
  try {
    await page.goto(target, { timeout });
  } catch (e) {
    fault = e instanceof playwright.TimeoutError ? `${basename(file)} did not finish loading within ${timeout} ms` : `the page did not open: ${firstLine(e.message)}`;
  }
  if (!fault) {
    try {
      read = await answer(page.evaluate(() => ({ title: document.title, wide: document.documentElement.scrollWidth > innerWidth })), timeout);
    } catch (e) {
      fault = `the page could not be read: ${firstLine(e.message)}`;
    }
  }
  if (!fault) {
    try {
      png = await page.screenshot({ fullPage: true, timeout });
    } catch (e) {
      fault = `the picture could not be taken: ${firstLine(e.message)}`;
    }
  }
  if (sentTo) fault = `the page sent itself to ${nameOf(sentTo)}${notOpened.has(sentTo) ? `, which did not open: ${notOpened.get(sentTo)}` : ''}`;
  let written = false;
  try {
    if (fault) {
      found.error(file, fault);
    } else {
      if (!Object.hasOwn(found.titles, file)) found.titles[file] = read.title;
      if (read.wide) found.overflows(file, width);
      try {
        writeFileSync(picture, png);
      } catch (e) {
        throw new ShotsError(`cannot write ${picture}: ${reason(e)}`);
      }
      written = true;
      found.files.push(picture);
    }
    for (const message of scripts) found.error(file, message);
    for (const message of failed.values()) found.error(file, message);
    for (const { text, url } of consoled) {
      if (!failed.has(url)) found.error(file, `console error: ${text}`);
    }
    for (const message of unread) found.error(file, message);
  } finally {
    if (!written) removeOlder(picture);
    if (moving) await answer(new Promise(resolve => (landed = resolve)), LANDING_MS).catch(() => {});
    await page.close().catch(() => {});
  }
}

// How long a page's move under way is given to land before the page is closed regardless, in milliseconds.
const LANDING_MS = 5000;

// The errors fileURLToPath gives for a file address that is no path on this machine.
const NOT_A_PATH = ['ERR_INVALID_FILE_URL_HOST', 'ERR_INVALID_FILE_URL_PATH'];

// The page's answer, or a failure when it gives none in time (a page busy for ever never answers). An
// answer that comes too late is let go: the race already holds it, so it fails nowhere.
function answer(work, timeout) {
  let timer;
  const late = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`it gave no answer within ${timeout} ms`)), timeout);
  });
  return Promise.race([work, late]).finally(() => clearTimeout(timer));
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
  --timeout <ms>       how long a page is given to load, in milliseconds; 30000 when not given
  --allow-errors       exit 0 even when a page has an error; the errors are still printed

A page has an error when a script throws, when it writes an error to the console, when a resource it asks
for (a stylesheet, an image) does not load, when it does not open or finish loading in time, when it
cannot be read or pictured, or when it sends itself to another page. Each is printed as one line,
"error: <page>: <what>", and exits 1 unless --allow-errors; the pictures that could be taken are taken,
and none is kept under the name of a page that got no picture this time.
A page wider than the screen at a width is printed as "overflow: <page> is wider than the screen at <w>
px" and does not change the exit code.
A script error, or a move to another page, raised after the picture is taken is not seen.
A request Chrome cancels itself (net::ERR_ABORTED, as a video may) is reported as an error too.

A flag may also be written --flag=value.

Exit codes: 0 success · 1 a refusal (a page with an error, an unreadable input, an unwritable output,
no Chrome, a Chrome that does not start) · 2 bad usage.
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
  let timeout = TIMEOUT;
  if (Object.hasOwn(flags, 'timeout')) {
    if (!/^[1-9]\d*$/.test(flags.timeout) || !Number.isSafeInteger(Number(flags.timeout))) {
      throw new UsageError(`--timeout must be a whole number of milliseconds from 1, as 30000; it is "${flags.timeout}"`);
    }
    timeout = Number(flags.timeout);
  }
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
