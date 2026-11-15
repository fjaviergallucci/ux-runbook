// The one way every script of the kit opens pages in a browser: shots, to picture them; accept, to check
// them. Headless, in the machine's own Chrome, one browser at a time, one context per width and theme, with
// reduced motion set on every context. A page is judged by its document, never by its address: whatever is
// done with a page is kept only if the document that was loaded was still the one in the tab once it was
// done. Nothing about one page ends a run, and no run goes on for ever: every wait has a limit, and every
// retry a count.
//
// visitPages(chrome, runs, { timeout, act, Refusal }, done) opens each page of each run and hands what it
// found to `done`; the caller decides what a page's fault means for it.
//
// The kit's one dependency, playwright-core, is loaded where the first browser of a run is started, and
// nowhere else: a script that imports this file still prints its --help, and does whatever opens no page,
// in a kit whose dependency was never installed. There, starting a browser is refused in one line, which
// says where to run npm install.
import { randomBytes } from 'node:crypto';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The kit's root, where its package file is and its dependency is installed: two folders above this one.
const KIT_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

// Every page is opened on a screen this high.
export const HEIGHT = 900;
// How long a page is given to load, to settle, and for each step on it, when nobody says, in milliseconds.
export const TIMEOUT = 30000;
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
// How many times a page is opened when its browser stops before it can be: once more in a fresh browser.
const OPENINGS = 2;
// How many browsers are started in a row with no page opened in any of them before the run is given up.
const STARTS = 3;

// The context every page of a width and theme is opened in: the width by HEIGHT at scale 1, reduced motion.
export const contextOptions = (width, theme) => ({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: theme });

// visitPages(chrome, runs, { timeout, act, Refusal }, done) → nothing; `done` hears of every page.
//   chrome   the path of the Chrome to drive (lib/chrome.mjs finds it)
//   runs     [{ width, theme, files }]: each run is one context, its files opened in it in turn
//   timeout  how long a page is given to load, to settle, and for each step on it, in milliseconds
//   act      what is done with each page once it has settled and its document is known: { run(page,
//            timeout, file, run) → a promise of the value kept, failed: what is said when run fails ("the
//            picture could not be taken"), during: what is said of a page that left while it ran (" while it
//            was being pictured"), unread: what is said when the page cannot be read once run }
//   Refusal  the class of the error thrown when Chrome does not start, keeps stopping, or opens no page,
//            and when the kit's dependency is not installed
//   done     done(file, visit, run), awaited, for each file of each run in order, once it is done with:
//            visit is { fault, read, value, reports, closing } (see visitPage), or { lost: true } when its
//            browser stopped twice before the page could be opened in it
// One browser at a time. Nothing waits without a limit, and nothing is tried without a count: a page that
// will not close, or a browser that dies, is a fault of that page, and the run goes on in a fresh browser;
// a page whose browser stops before it can be opened is opened OPENINGS times, no more, and no more than
// STARTS browsers are started in a row with no page opened in any; every browser the run started is gone
// when it ends, however it ends (`done` throwing included).
export async function visitPages(chrome, runs, { timeout = TIMEOUT, act, Refusal }, done) {
  const browsers = new Browsers(chrome, Refusal);
  try {
    for (const run of runs) {
      const options = contextOptions(run.width, run.theme);
      let context = null;
      for (const file of run.files) {
        // A browser that died before the page could be opened in it is no fault of the page: the page is
        // opened again in a fresh browser, once. A second death is said of the page, and the run goes on.
        let visit = AGAIN_VISIT;
        for (let opening = 1; visit.next === AGAIN && opening <= OPENINGS; opening++) {
          context ??= await browsers.context(options);
          visit = context === null ? AGAIN_VISIT : await visitPage(context, file, { timeout, act, browsers, run });
          if (visit.next !== KEEP) {
            await browsers.stop();
            context = null;
          }
        }
        await done(file, visit.next === AGAIN ? { lost: true } : visit, run);
      }
      if (context && !(await closed(context.close()))) await browsers.stop();
    }
  } finally {
    await browsers.stop();
  }
}

// What becomes of the browser after a page: kept, replaced, or replaced and the page opened again.
const KEEP = 'keep';
const REPLACE = 'replace';
const AGAIN = 'again';
const AGAIN_VISIT = Object.freeze({ next: AGAIN });

// The browsers a run starts, one at a time, each when a context is asked for and none is running. Each is
// started through Playwright's browser server, which gives the handle of its process: whether the browser
// died is known from that process, and a browser that stops answering is stopped by that handle, never by
// a name or a pattern; a fresh one takes its place. No more than STARTS are started in a row without a
// page being opened in one: a Chrome that keeps stopping ends the run.
class Browsers {
  #executablePath;
  #Refusal;
  // playwright-core, once the first browser has been asked for: { chromium, errors }.
  #library = null;
  // The browser of the moment: its server, the client connected to it, whether its process has ended, and
  // a promise kept when it ends.
  #session = null;
  // How many browsers were started in a row with no page opened in any of them.
  #unused = 0;

  constructor(executablePath, Refusal) {
    this.#executablePath = executablePath;
    this.#Refusal = Refusal;
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

  // A page was opened in the browser of the moment: it works.
  used() {
    this.#unused = 0;
  }

  // Whether an error is the library's own for a step that ran out of time; no browser was started when
  // the library was never loaded.
  timedOut(error) {
    return this.#library !== null && error instanceof this.#library.errors.TimeoutError;
  }

  // The library, loaded when the first browser is started. Not installed, it is a refusal that says what
  // to do; any other failure to load it is a fault of the kit, and is thrown as it is.
  async #load() {
    if (this.#library !== null) return this.#library;
    try {
      this.#library = await import('playwright-core');
    } catch (e) {
      if (e?.code !== 'ERR_MODULE_NOT_FOUND' || !String(e.message).includes('playwright-core')) throw e;
      throw new this.#Refusal(`playwright-core is not installed in ${KIT_ROOT}: run npm install there`);
    }
    return this.#library;
  }

  async start() {
    if (this.#unused === STARTS) {
      throw new this.#Refusal(`Chrome at ${this.#executablePath} keeps stopping: ${STARTS} browsers in a row were started, and none opened a page`);
    }
    const { chromium } = await this.#load();
    this.#unused++;
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
      throw new this.#Refusal(`Chrome at ${this.#executablePath} did not start: ${firstLine(e.message)}`);
    }
  }

  // A context in the browser, which is started first when none is running; null when the browser died
  // before it gave one. A living browser that gives none in time is a refusal: a browser that opens no
  // context opens no page.
  async context(options) {
    if (this.#session === null) await this.start();
    try {
      return await answer(this.#session.browser.newContext(options), CLOSE_MS);
    } catch (e) {
      if (await this.died(DEATH_MS)) return null;
      throw new this.#Refusal(`Chrome at ${this.#executablePath} opens no page: ${firstLine(e.message)}`);
    }
  }

  // The browser is closed if it answers in time; if not, its process is stopped by its handle, and that is
  // given no more time than the close was.
  async stop() {
    const session = this.#session;
    this.#session = null;
    if (session && !(await closed(session.server.close()))) await closed(session.server.kill());
  }
}

export const firstLine = text => String(text).split('\n')[0].replace(/^[a-zA-Z]+\.[a-zA-Z]+: /, '');

// One visit of one page in one context. Nothing about one page ends the run, and nothing waits without a
// limit: each step (opening the page, letting it settle, reading it, acting on it, closing it) is raced
// against a time, and each report the page makes is guarded; what fails is a fault of the page asked for.
// A page is judged by its document, not by its address. The document the page loads is marked as it is
// made (see `marking`), and it alone: a page that loads another in its place, or its own file again, is in
// a document without the mark, whatever its address; a page that changes what follows the # of its
// address, or its query through its history, is still in the marked one. Once the page has settled (no
// move for QUIET_MS) the mark is asked for just before the page is acted on, and again just after: what was
// done is kept only if the mark was there both times, since a document that has left the tab never comes
// back to it. A page still moving after the timeout is not acted on either.
// Returns { next, fault, read, value, reports, closing }:
//   next     KEEP when the browser goes on; REPLACE when it had to be stopped, or died with the page open:
//            the run goes on in a fresh one; AGAIN when it had died before the page could be opened in it
//   fault    why nothing of the page can be kept, or null
//   read     what the loaded document said of itself: { title, wide }, wide when it is wider than the screen
//   value    what `act` gave, when there is no fault
//   reports  what went wrong as the page ran, each said once: script errors, console errors, resources that
//            did not load, reports that could not be read
//   closing  what is said when the page would not close, or null
async function visitPage(context, file, { timeout, act, browsers, run }) {
  const target = pathToFileURL(resolve(file)).href;
  const folder = dirname(resolve(file));
  let page;
  try {
    page = await answer(context.newPage(), CLOSE_MS);
  } catch (e) {
    if (await browsers.died(DEATH_MS)) return AGAIN_VISIT;
    return { next: REPLACE, fault: `no page could be opened for it (${firstLine(e.message)}); its browser was stopped`, read: null, reports: [], closing: null };
  }
  browsers.used();
  const scripts = [];
  const consoled = [];
  const failed = new Map();
  const unread = [];
  // The last address the page itself set off for (its opening, the first it asks for, is not one), why a
  // page it went to did not open, and when it last set off for another document or landed on one.
  let opening = true;
  let headed = null;
  const notOpened = new Map();
  let lastMove = Date.now();
  // A move of the page under way and not landed yet (committed, an error page included), and what to call
  // when it lands: Chrome can hang closing a page in that moment, so the page is closed only once it has
  // landed. Its opening is the first such move, under way from the moment it is asked for.
  let moving = false;
  let landed = () => {};
  const isPageNavigation = request => request.isNavigationRequest() && request.frame() === page.mainFrame();
  // Where the page last set off for, and why that did not open when it did not.
  const heading = () => `${nameOf(headed, folder)}${notOpened.has(headed) ? `, which did not open: ${notOpened.get(headed)}` : ''}`;
  // Where the page is: an error page is named by the address that did not open, and why.
  const where = () => {
    const url = page.url();
    return url.startsWith('chrome-error:') && headed !== null ? heading() : nameOf(url, folder);
  };
  // What to say of a page whose loaded document is no longer the one in the tab: where the tab is now. The
  // file asked for, loaded again, is another document too; its address only words the fault.
  const left = when => (pathOf(page.url()) === resolve(file) ? `the page reloaded itself${when}, as ${where()}` : `the page sent itself to ${where()}${when}`);
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
    if (opening) opening = false;
    else headed = request.url();
    moving = true;
    lastMove = Date.now();
  }));
  // A move under way has landed. A change of address that loads no document (what follows the #, the
  // page's history) is reported here too, with no move under way: it is no move.
  page.on('framenavigated', guarded(frame => {
    if (frame !== page.mainFrame()) return;
    if (moving) lastMove = Date.now();
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
    failed.set(url, `${nameOf(url, folder)} did not ${request.isNavigationRequest() ? 'open' : 'load'}: ${request.failure()?.errorText}`);
  }));
  page.on('response', guarded(response => {
    if (response.status() >= 400) failed.set(response.url(), `${nameOf(response.url(), folder)} did not load: HTTP ${response.status()}`);
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
  // The mark of the document the page loads: a property of its window, under a name of this visit's own,
  // that holds the token of this visit. Every document of the page, as it is made and before any script of
  // its own runs, asks for the token, and only the first to ask is given it: that is the document the
  // page's opening loads, the tab holding none before it. A document that takes its place has a window of
  // its own, and is given none.
  const mark = `ux${randomBytes(8).toString('hex')}`;
  const token = randomBytes(16).toString('hex');
  let given = false;
  const marking = async () => {
    await page.exposeBinding(`${mark}Asked`, ({ frame }) => {
      if (given || frame !== page.mainFrame()) return null;
      given = true;
      return token;
    });
    // What the document was given, as soon as it is answered: asking the mark waits for that answer.
    await page.addInitScript(mark => {
      window[mark] = window[`${mark}Asked`]();
    }, mark);
  };
  // What the loaded document says of itself (its title, whether it is wider than the screen), or null when
  // another document is in its place.
  const look = () =>
    answer(
      page.evaluate(async ([mark, token]) => ((await window[mark]) === token ? { title: document.title, wide: document.documentElement.scrollWidth > innerWidth } : null), [mark, token]),
      timeout,
    );
  // A document being replaced as it is asked gives no answer: the page is then let settle, and asked once
  // more. A page that gives none in time is not asked again.
  const ask = async () => {
    try {
      return await look();
    } catch (e) {
      if (e instanceof NoAnswer || !(await settle())) throw e;
      return look();
    }
  };
  let fault = null;
  let read = null;
  let value;
  try {
    await answer(marking(), CLOSE_MS);
    moving = true;
    await answer(page.goto(target, { timeout }), timeout + CLOSE_MS);
  } catch (e) {
    const unfinished = `${basename(file)} did not finish loading within ${timeout} ms${headed === null ? '' : `: it had set off for ${heading()}`}`;
    fault = browsers.timedOut(e) ? unfinished : `the page did not open: ${firstLine(e.message)}`;
  }
  if (!fault && !(await settle())) fault = `the page kept moving for ${timeout} ms, last to ${moving && headed !== null ? heading() : where()}`;
  if (!fault) {
    try {
      read = await ask();
      if (read === null) fault = left('');
    } catch (e) {
      fault = `the page could not be read: ${firstLine(e.message)}`;
    }
  }
  if (!fault) {
    try {
      value = await answer(act.run(page, timeout, file, run), timeout + CLOSE_MS);
    } catch (e) {
      fault = `${act.failed}: ${firstLine(e.message)}`;
    }
    // What was done shows the page only if its document was in the tab all the while: it is asked again,
    // and what was done is dropped when the document is gone or cannot say.
    try {
      if ((await ask()) === null) fault = left(act.during);
    } catch (e) {
      fault ??= `${act.unread}: ${firstLine(e.message)}`;
    }
  }
  // A browser that died is said as such, whichever step it broke: its process handle knows at once.
  const died = await browsers.died(0);
  if (died) fault = 'its browser stopped while the page was open; the run went on in a fresh browser';
  const reports = [...scripts, ...failed.values()];
  for (const { text, url } of consoled) {
    if (!failed.has(url)) reports.push(`console error: ${text}`);
  }
  reports.push(...unread);
  const visit = { next: KEEP, fault, read: fault ? null : read, value: fault ? undefined : value, reports, closing: null };
  if (died) return { ...visit, next: REPLACE };
  if (moving) await answer(new Promise(resolve => (landed = resolve)), LANDING_MS).catch(() => {});
  if (await closed(page.close())) return visit;
  return { ...visit, next: REPLACE, closing: 'the page would not close; its browser was stopped' };
}

// Whether a part of a path can be decoded: one with a bare %, or a byte that is no UTF-8, cannot.
const decodes = part => {
  try {
    decodeURIComponent(part);
    return true;
  } catch {
    return false;
  }
};

// The path a file address names on this machine, or null: for an address that is no file address, or one
// that names no path here (//host/x from a file page, an encoded /). Never throws: a part of the path that
// cannot be decoded is kept as it is written.
function pathOf(url) {
  if (!url.startsWith('file:')) return null;
  try {
    const address = new URL(url);
    address.pathname = address.pathname.split('/').map(part => (decodes(part) ? part : part.replaceAll('%', '%25'))).join('/');
    return fileURLToPath(address);
  } catch {
    return null;
  }
}

// nameOf(url, folder) → the name an address is given in a message: a file by its path from `folder`, the
// page's own, with its query; anything else by its address. Never throws.
export function nameOf(url, folder) {
  const path = pathOf(url);
  return path === null ? url : relative(folder, path).split(sep).join('/') + new URL(url).search;
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
