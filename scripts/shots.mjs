#!/usr/bin/env node
// shots: photographs pages — a board's drawn proposals, a prototype, the final screens — headless, at each
// width and theme asked for, with reduced motion set on every context. Judges and simulated users read
// these pictures, so a picture of a broken page is reported, not passed: a script error, a console error,
// a resource or a navigation that fails is an error of its page; a page wider than the screen at a width
// is an overflow, reported but never an error.
//
// As a module: shoot(inputs, { out, widths, themes, chrome }) → { files, overflow, errors, titles }.
// As a command: see USAGE. Exit codes: 0 success · 1 a refusal (a page with an error, unless
// --allow-errors; an unreadable input; an unwritable output; no Chrome) · 2 bad usage.
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { ChromeError, findChrome } from './lib/chrome.mjs';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { reason } from './lib/proposal-file.mjs';

export const THEMES = Object.freeze(['light', 'dark']);
// Every picture is taken on a screen this high; a page taller than it is pictured whole.
const HEIGHT = 900;

// A refusal: an input that cannot be read, an output that cannot be written, a Chrome that does not start.
export class ShotsError extends Error {
  name = 'ShotsError';
}

// shoot(inputs, { out, widths, themes, chrome }) → { files, overflow, errors, titles }.
//   inputs  pages to photograph: an .html file, or a folder, which means every .html file directly in it
//   out     the folder the pictures go to, made when it is not there; each is <name>-<width>-<theme>.png,
//           <name> being the page's file name without its extension, pictured whole
//   widths  screen widths in CSS pixels; themes 'light' and/or 'dark' (light when not given)
//   chrome  the Chrome to drive (lib/chrome.mjs finds one when not given)
// One browser, one context per width and theme. Everything is read and checked before Chrome starts, and
// the browser is closed however shooting ends.
// files: the pictures taken, in the order taken. overflow: { file, width } for each page wider than the
// screen at a width, once whatever the theme. errors: { file, message } for each fault of a page, once
// however many pictures saw it; no picture is taken of a page that did not open. titles: each page's
// document title once loaded, from the first picture of it.
// Throws a TypeError for bad options, a ShotsError or a ChromeError for a refusal.
export async function shoot(inputs, { out, widths, themes = ['light'], chrome } = {}) {
  checkOptions(inputs, { out, widths, themes });
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
        for (const { file, name } of pages) await shootPage(context, file, join(out, `${name}-${width}-${theme}.png`), width, found);
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return found.result();
}

function checkOptions(inputs, { out, widths, themes }) {
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

// One picture of one page in one context. The page's faults are gathered while it opens and is pictured,
// then said, each once: a resource that failed is said once, and Chrome's own console line about the same
// resource is not said again.
async function shootPage(context, file, picture, width, found) {
  const page = await context.newPage();
  const target = pathToFileURL(resolve(file)).href;
  const folder = dirname(resolve(file));
  // A file beside the page is named by its path from the page's folder; anything else by its address.
  const nameOf = url => (url.startsWith('file:') ? relative(folder, fileURLToPath(url)).split(sep).join('/') : url);
  const scripts = [];
  const consoled = [];
  const failed = new Map();
  page.on('pageerror', error => scripts.push(`script error: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') consoled.push({ text: message.text(), url: message.location().url });
  });
  page.on('requestfailed', request => {
    // The page's own document failing to open is the navigation's failure, said once below.
    if (request.url() === target) return;
    const did = request.isNavigationRequest() ? 'open' : 'load';
    failed.set(request.url(), `${nameOf(request.url())} did not ${did}: ${request.failure()?.errorText}`);
  });
  page.on('response', response => {
    if (response.status() >= 400) failed.set(response.url(), `${nameOf(response.url())} did not load: HTTP ${response.status()}`);
  });
  let opened = true;
  try {
    await page.goto(target);
  } catch (e) {
    opened = false;
    found.error(file, `the page did not open: ${firstLine(e.message)}`);
  }
  if (opened) {
    if (!Object.hasOwn(found.titles, file)) found.titles[file] = await page.title();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) found.overflows(file, width);
    const png = await page.screenshot({ fullPage: true });
    try {
      writeFileSync(picture, png);
    } catch (e) {
      throw new ShotsError(`cannot write ${picture}: ${reason(e)}`);
    }
    found.files.push(picture);
  }
  for (const message of scripts) found.error(file, message);
  for (const message of failed.values()) found.error(file, message);
  for (const { text, url } of consoled) {
    if (!failed.has(url)) found.error(file, `console error: ${text}`);
  }
  await page.close();
}

// ---- the command line

const USAGE = `Usage: node scripts/shots.mjs <file or folder>... --out <folder> --widths <w,w...> [--themes light,dark] [--chrome <path>] [--allow-errors]

Photographs each page headless, in the machine's own Chrome, at each width and theme, with reduced motion
set: one full-page PNG per page, width and theme, named <name>-<width>-<theme>.png, <name> being the
page's file name without its extension. A folder means every .html file directly in it.

  --out <folder>       where the pictures go; made when it is not there
  --widths <w,w...>    screen widths in CSS pixels, whole numbers joined by commas, as 1280,390;
                       the screen is 900 px high, and a taller page is pictured whole
  --themes <t,t...>    light, dark or both, joined by a comma; light when not given
  --chrome <path>      the Chrome to drive; else UX_CHROME, else the first that exists of
                       /usr/bin/google-chrome, /usr/bin/chromium, and the macOS and Windows defaults
  --allow-errors       exit 0 even when a page has an error; the errors are still printed

A page has an error when a script throws, when it writes an error to the console, when a resource it asks
for (a stylesheet, an image) does not load, or when it does not open. Each is printed as one line,
"error: <page>: <what>", and exits 1 unless --allow-errors; the pictures that could be taken are taken.
A page wider than the screen at a width is printed as "overflow: <page> is wider than the screen at <w>
px" and does not change the exit code.
A script error raised after the picture is taken is not seen.
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
  const args = parseArgs(argv, { flags: ['out', 'widths', 'themes', 'chrome'], switches: ['allow-errors'] });
  if (args.help) return args;
  const { positional, flags } = args;
  if (positional.length === 0) throw new UsageError('shots takes at least one <file or folder>');
  for (const name of ['out', 'widths']) {
    if (!Object.hasOwn(flags, name)) throw new UsageError(`--${name} is missing`);
  }
  const widths = listFlag(flags, 'widths', WIDTHS, 'whole numbers from 1, joined by commas, as 1280,390', width => Number.isSafeInteger(Number(width))).map(Number);
  const themes = Object.hasOwn(flags, 'themes') ? listFlag(flags, 'themes', THEME_LIST, 'light, dark or both, joined by a comma') : ['light'];
  return { inputs: positional, out: flags.out, widths, themes, chrome: flags.chrome, allowErrors: flags['allow-errors'] === true };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

async function run({ inputs, out, widths, themes, chrome, allowErrors }) {
  const { files, overflow, errors } = await shoot(inputs, { out, widths, themes, chrome });
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
