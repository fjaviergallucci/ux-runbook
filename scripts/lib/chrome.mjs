// Finding the machine's own Chrome, the one browser every check of the kit drives (through playwright-core,
// which brings none of its own). One way, for every script that opens a page.
import { existsSync } from 'node:fs';

// Where Chrome is found when nobody says: Linux, then Chromium, then macOS, then Windows.
export const CHROME_PATHS = Object.freeze([
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
]);

// No Chrome where one was named, or none at all: a refusal, whose message says what to do.
export class ChromeError extends Error {
  name = 'ChromeError';
}

// findChrome(explicit) → the path of the Chrome to drive: `explicit` when it is given, else UX_CHROME when
// it is set (an empty one is not), else the first of CHROME_PATHS that exists. A path given, by either way,
// that does not exist is refused rather than passed over. Throws a ChromeError.
export function findChrome(explicit) {
  if (explicit !== undefined) {
    if (!existsSync(explicit)) throw new ChromeError(`no Chrome at ${explicit}: the path given does not exist`);
    return explicit;
  }
  const named = process.env.UX_CHROME;
  if (named) {
    if (!existsSync(named)) throw new ChromeError(`no Chrome at ${named}: UX_CHROME names it, and it does not exist`);
    return named;
  }
  const found = CHROME_PATHS.find(path => existsSync(path));
  if (found) return found;
  throw new ChromeError(
    `no Chrome found: none of these exists:\n${CHROME_PATHS.map(path => `  ${path}\n`).join('')}give its path with --chrome <path>, or set UX_CHROME to it`,
  );
}
