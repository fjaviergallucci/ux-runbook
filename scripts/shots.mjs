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
// How long a page is given to load, to settle, and for each step on it, when nobody says, in milliseconds.
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
//   timeout how long a page is given to load, to settle, and for each step on it, in milliseconds (TIMEOUT
//           when not given)
// One browser at a time, one context per width and theme. Everything is read and checked before Chrome
// starts. Nothing waits without a limit: a page that will not close, or a browser that dies, is an error of
// that page, and the run goes on in a fresh browser; every browser the run started is gone when it ends,
// however it ends.
// files: the pictures taken, in the order taken. overflow: { file, width } for each page wider than the
// screen at a width, once whatever the theme. errors: { file, message } for each fault of a page, once
// however many pictures saw it; no picture is taken of a page that did not open, did not settle, settled
// on another page, or could not be read or pictured. titles: each page's document title once loaded, from
// the first picture of it.
// Throws a TypeError for bad options, a ShotsError or a ChromeError for a refusal; never for one page.
export async function shoot(inputs, { out, widths, themes = ['light'], chrome, timeout = TIMEOUT } = {}) {
  checkOptions(inputs, { out, widths, themes, timeout });
  const pages = pagesOf(inputs);
  const browsers = new Browsers(findChrome(chrome));
  makeFolder(out);
  const found = new Found();
  try {
    await browsers.start();
    for (const width of widths) {
      for (const theme of themes) {
        const options = { viewport: { width, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: theme };
        let context = null;
        for (const { file, name } of pages) {
          const picture = join(out, `${name}-${width}-${theme}.png`);
          context ??= await browsers.context(options);
          let next = await shootPage(context, file, picture, width, found, timeout, browsers);
          // A browser that died before the page could be opened in it is no fault of the page: it is opened
          // again in a fresh browser.
          if (next === AGAIN) {
            await browsers.replace();
            context = await browsers.context(options);
            next = await shootPage(context, file, picture, width, found, timeout, browsers);
          }
          if (next !== KEEP) {
            await browsers.replace();
            context = null;
          }
        }
        if (context && !(await closed(context.close()))) await browsers.replace();
      }
    }
  } finally {
    await browsers.stop();
  }
  return found.result();
}

// The browsers a run starts, one at a time. Each is started through Playwright's browser server, which
// gives the handle of its process: whether the browser died is known from that process, and a browser that
// stops answering is stopped by that handle, never by a name or a pattern; a fresh one takes its place.
class Browsers {
  #executablePath;
  // The browser of the moment: its server, the client connected to it, whether its process has ended, and
  // a promise kept when it ends.
  #session = null;

  constructor(executablePath) {
    this.#executablePath = executablePath;
  }

  get connected() {
    return this.#session !== null && !this.#session.exited && this.#session.browser.isConnected();
  }

  // Whether the browser has died, waiting at most `ms` for the news.
  async died(ms) {
    if (!this.connected) return true;
    if (ms === 0) return false;
    return answer(this.#session.ended, ms).then(() => true, () => false);
  }

  async start() {
    let server;
    try {
      server = await chromium.launchServer({ executablePath: this.#executablePath, headless: true, host: '127.0.0.1' });
      let end;
      const session = { server, browser: null, exited: false, ended: new Promise(resolve => (end = resolve)) };
      server.process().once('exit', () => {
        session.exited = true;
        end();
      });
      this.#session = session;
      session.browser = await answer(chromium.connect(server.wsEndpoint()), CLOSE_MS);
    } catch (e) {
      await this.stop();
      throw new ShotsError(`Chrome at ${this.#executablePath} did not start: ${firstLine(e.message)}`);
    }
  }

  // A context in the browser; a browser that died first is replaced, and a living browser that gives none
  // in time is a refusal: a browser that opens no context opens no page.
  async context(options) {
    for (;;) {
      try {
        return await answer(this.#session.browser.newContext(options), CLOSE_MS);
      } catch (e) {
        if (!(await this.died(DEATH_MS))) throw new ShotsError(`Chrome at ${this.#executablePath} opens no page: ${firstLine(e.message)}`);
        await this.replace();
      }
    }
  }

  async replace() {
    await this.stop();
    await this.start();
  }

  // The browser is closed if it answers in time; if not, its process is stopped by its handle.
  async stop() {
    const session = this.#session;
    this.#session = null;
    if (session && !(await closed(session.server.close()))) await session.server.kill();
  }
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

// One picture of one page in one context. Nothing about one page ends the run, and nothing waits without a
// limit: each step (opening the page, letting it settle, reading its title and width, picturing it, closing
// it) is raced against a time, and each report the page makes is guarded; what fails is an error of the
// page asked for. A page is judged by where it settled (no move for QUIET_MS): a page still moving after
// the timeout, or settled on another page than the one asked for, is not pictured. Whenever no picture is
// written, an older one under the same name is removed, so that none is read in its place.
// Returns KEEP when the browser goes on; REPLACE when it had to be stopped, or died with the page open: the
// run goes on in a fresh one; AGAIN when it had died before the page could be opened in it.
async function shootPage(context, file, picture, width, found, timeout, browsers) {
  const target = pathToFileURL(resolve(file)).href;
  const folder = dirname(resolve(file));
  let page;
  try {
    page = await answer(context.newPage(), CLOSE_MS);
  } catch (e) {
    if (await browsers.died(DEATH_MS)) return AGAIN;
    found.error(file, `no page could be opened for it (${firstLine(e.message)}); its browser was stopped`);
    removeOlder(picture);
    return REPLACE;
  }
  const scripts = [];
  const consoled = [];
  const failed = new Map();
  const unread = [];
  // The address asked for in Chrome's own spelling (its first request), the last address the page asked
  // to go to, why a page it went to did not open, the document it is on, and when it last set off for
  // another or arrived on one (a change of only what follows the # keeps the document).
  let asked = null;
  let lastAsked = null;
  const notOpened = new Map();
  let current = null;
  let lastMove = Date.now();
  // A move of the page under way and not landed yet (committed, an error page included), and what to call
  // when it lands: Chrome can hang closing a page in that moment, so the page is closed only once it has
  // landed. Its opening is the first such move, under way from the start.
  let moving = true;
  let landed = () => {};
  const isPageNavigation = request => request.isNavigationRequest() && request.frame() === page.mainFrame();
  // A file beside the page is named by its path from the page's folder, with its query; anything else, and
  // a file address that is no path here (//host/x from a file page), by its address.
  const nameOf = url => {
    if (!url.startsWith('file:')) return url;
    let path;
    try {
      path = fileURLToPath(url);
    } catch (e) {
      if (NOT_A_PATH.includes(e.code)) return url;
      throw e;
    }
    return relative(folder, path).split(sep).join('/') + new URL(url).search;
  };
  // Where the page is: an error page is named by the address that did not open, and why.
  const where = () => {
    const url = page.url();
    if (!url.startsWith('chrome-error:') || lastAsked === null) return nameOf(url);
    return `${nameOf(lastAsked)}${notOpened.has(lastAsked) ? `, which did not open: ${notOpened.get(lastAsked)}` : ''}`;
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
    asked ??= request.url();
    lastAsked = request.url();
    moving = true;
    lastMove = Date.now();
  }));
  page.on('framenavigated', guarded(frame => {
    if (frame !== page.mainFrame()) return;
    if (current === null || !sameAddress(frame.url(), current)) {
      current = frame.url();
      lastMove = Date.now();
    }
    moving = false;
    landed();
  }));
  page.on('requestfailed', guarded(request => {
    const url = request.url();
    // The page's own document failing is the opening's failure; another page it went to, where it went.
    if (isPageNavigation(request)) {
      notOpened.set(url, request.failure()?.errorText);
      return;
    }
    failed.set(url, `${nameOf(url)} did not ${request.isNavigationRequest() ? 'open' : 'load'}: ${request.failure()?.errorText}`);
  }));
  page.on('response', guarded(response => {
    if (response.status() >= 400) failed.set(response.url(), `${nameOf(response.url())} did not load: HTTP ${response.status()}`);
  }));
  // Settled: no move under way, and QUIET_MS on one document since it last set off or arrived; false when
  // the page is still moving once the timeout has passed.
  const settle = async () => {
    const deadline = Date.now() + timeout;
    for (;;) {
      const quiet = Date.now() - lastMove;
      if (!moving && quiet >= QUIET_MS) return true;
      if (Date.now() >= deadline) return false;
      await sleep(Math.max(1, Math.min(QUIET_MS - quiet, deadline - Date.now())) + 1);
    }
  };
  let fault = null;
  let read;
  let png;
  try {
    await answer(page.goto(target, { timeout }), timeout + CLOSE_MS);
  } catch (e) {
    fault = e instanceof playwright.TimeoutError ? `${basename(file)} did not finish loading within ${timeout} ms` : `the page did not open: ${firstLine(e.message)}`;
  }
  if (!fault && !(await settle())) fault = `the page kept moving for ${timeout} ms, last to ${where()}`;
  if (!fault && !sameAddress(page.url(), asked ?? target)) fault = `the page sent itself to ${where()}`;
  if (!fault) {
    try {
      read = await answer(page.evaluate(() => ({ title: document.title, wide: document.documentElement.scrollWidth > innerWidth })), timeout);
    } catch (e) {
      fault = `the page could not be read: ${firstLine(e.message)}`;
    }
  }
  if (!fault) {
    try {
      png = await answer(page.screenshot({ fullPage: true, timeout }), timeout + CLOSE_MS);
    } catch (e) {
      fault = `the picture could not be taken: ${firstLine(e.message)}`;
    }
  }
  // A browser that died is said as such, whichever step it broke: its process handle knows at once.
  const died = await browsers.died(0);
  if (died) fault = 'its browser stopped while the page was open; the run went on in a fresh browser';
  let written = false;
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
  if (!written) removeOlder(picture);
  if (died) return REPLACE;
  if (moving) await answer(new Promise(resolve => (landed = resolve)), LANDING_MS).catch(() => {});
  if (await closed(page.close())) return KEEP;
  found.error(file, 'the page would not close; its browser was stopped');
  return REPLACE;
}

// What becomes of the browser after a page: kept, replaced, or replaced and the page opened again.
const KEEP = 'keep';
const REPLACE = 'replace';
const AGAIN = 'again';

// How long the browser is given to open or close a page, a context or itself before it is stopped, in
// milliseconds.
export const CLOSE_MS = 5000;
// How long a page or a context that could not be opened waits to learn whether its browser died, in
// milliseconds.
const DEATH_MS = 1000;
// How long a page must go without moving to count as settled, in milliseconds.
const QUIET_MS = 100;
// How long a page's move under way is given to land before the page is closed regardless, in milliseconds.
const LANDING_MS = 5000;

// The errors fileURLToPath gives for a file address that is no path on this machine.
const NOT_A_PATH = ['ERR_INVALID_FILE_URL_HOST', 'ERR_INVALID_FILE_URL_PATH'];

// Two addresses of one document, each in the spelling the URL standard gives it, but for what follows the
// #: Node and Chrome spell some characters of a file address differently (^, |), so only addresses that
// both come from Chrome are compared.
function sameAddress(a, b) {
  const plain = address => {
    try {
      const url = new URL(address);
      url.hash = '';
      return url.href;
    } catch {
      return address;
    }
  };
  return plain(a) === plain(b);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// No answer in time.
class NoAnswer extends Error {}

// The answer of `work`, or a NoAnswer when it gives none within `ms` (a page busy for ever never answers).
// An answer that comes too late is let go: the race already holds it, so it fails nowhere.
function answer(work, ms) {
  let timer;
  const late = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new NoAnswer(`it gave no answer within ${ms} ms`)), ms);
  });
  return Promise.race([work, late]).finally(() => clearTimeout(timer));
}

// Whether a close came back within CLOSE_MS; one that failed did come back.
const closed = work => answer(work, CLOSE_MS).then(() => true, e => !(e instanceof NoAnswer));

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
keeps moving from page to page, when it settles on another page than the one asked for, or when it
cannot be read, pictured or closed. Each is printed as one line, "error: <page>: <what>", and exits 1
unless --allow-errors; the pictures that could be taken are taken, and none is kept under the name of a
page that got no picture this time. A page is judged once it has settled: 100 ms without moving.
Nothing waits without a limit: a page that will not close, or a browser that dies, is an error of that
page, and the run goes on in a fresh browser; every browser the run started is gone when it ends.
A page wider than the screen at a width is printed as "overflow: <page> is wider than the screen at <w>
px" and does not change the exit code.
A script error raised after the picture is taken, or a move made after the page has settled, is not seen.
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
