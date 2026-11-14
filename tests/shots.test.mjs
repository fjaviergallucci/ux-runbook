import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inflateSync } from 'node:zlib';
import { CHROME_PATHS, ChromeError, findChrome } from '../scripts/lib/chrome.mjs';
import { renderProposal } from '../scripts/render.mjs';
import { ShotsError, nameOf, shoot } from '../scripts/shots.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'shots.mjs');
const chromeModule = pathToFileURL(join(here, '..', 'scripts', 'lib', 'chrome.mjs')).href;
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'shots-'));
after(() => rmSync(root, { recursive: true, force: true }));
const UNIX = process.platform !== 'win32';

// ---- the pages, made here and nowhere else

const load = name => JSON.parse(readFileSync(join(here, 'fixtures', 'proposals', `${name}.json`), 'utf8'));
const LETTERS = { A: 'unified-list', B: 'free-first', C: 'calendar' };
// A board: the three fixture proposals drawn in the grey kit, with its stylesheet beside them.
const drawBoard = dir => {
  mkdirSync(dir, { recursive: true });
  for (const [letter, name] of Object.entries(LETTERS)) writeFileSync(join(dir, `${letter}.html`), renderProposal(load(name), { letter }));
  copyFileSync(join(here, '..', 'kit', 'grey', 'kit.css'), join(dir, 'kit.css'));
  return dir;
};
const board = drawBoard(join(root, 'board'));
const boardPages = Object.keys(LETTERS).map(letter => join(board, `${letter}.html`));

let made = 0;
const fresh = () => {
  const dir = join(root, `run ${++made}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};
// One whole page, titled by its name unless its own script says otherwise.
const page = (dir, name, body, head = '') => {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, name);
  writeFileSync(file, `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${name}</title>\n${head}</head>\n<body>\n${body}\n</body>\n</html>\n`);
  return file;
};
// A PNG opens with its 8-byte signature and its IHDR chunk: length, type, then width and height.
const pngSize = file => {
  const bytes = readFileSync(file);
  assert.deepEqual([...bytes.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${file} is a PNG`);
  assert.equal(bytes.toString('latin1', 12, 16), 'IHDR', file);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};
// The colour of one pixel of a PNG, as "r,g,b": its rows are unfiltered down to the one asked for. A file that
// is no PNG (an older picture left where a new one should be) fails here.
const colourAt = (file, x = 3, y = 3) => {
  const { width } = pngSize(file);
  const bytes = readFileSync(file);
  const bpp = { 2: 3, 6: 4 }[bytes[25]];
  assert.ok(bytes[24] === 8 && bpp && bytes[28] === 0, `${file} is an 8-bit colour picture, not interlaced`);
  const data = [];
  for (let at = 8; at < bytes.length; at += 12 + bytes.readUInt32BE(at)) {
    if (bytes.toString('latin1', at + 4, at + 8) === 'IDAT') data.push(bytes.subarray(at + 8, at + 8 + bytes.readUInt32BE(at)));
  }
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * bpp;
  let above = Buffer.alloc(stride);
  for (let row = 0; row <= y; row++) {
    const filter = raw[row * (stride + 1)];
    const line = Buffer.from(raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const left = i >= bpp ? line[i - bpp] : 0;
      const up = above[i];
      const corner = i >= bpp ? above[i - bpp] : 0;
      // The five ways a PNG row is written: as it is, or as its difference from a neighbour.
      const paeth = () => {
        const [a, b, c] = [left, up, corner].map(value => Math.abs(left + up - corner - value));
        return a <= b && a <= c ? left : b <= c ? up : corner;
      };
      line[i] = (line[i] + [0, left, up, (left + up) >> 1, paeth()][filter]) & 255;
    }
    above = line;
  }
  return above.subarray(x * bpp, x * bpp + 3).join(',');
};
const [BLUE, RED, GREEN, YELLOW] = ['0,0,255', '255,0,0', '0,255,0', '255,255,0'];
// A page that paints one solid colour, so that a picture of it is told from a picture of any other by one
// pixel; `colour` is "r,g,b".
const painted = (dir, name, colour, body = '') => {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, name);
  writeFileSync(file, `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${name}</title>\n</head>\n<body style="background: rgb(${colour})">\n${body}\n</body>\n</html>\n`);
  return file;
};
const messagesOf = (result, file) => result.errors.filter(e => e.file === file).map(e => e.message);
// A one-pixel picture, for a server to answer with.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
// A server that never answers for /held.css, and answers nothing else; closing it drops what it held.
const holding = async () => {
  const server = createServer(() => {});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { at: `http://127.0.0.1:${server.address().port}`, close: () => (server.closeAllConnections(), server.close()) };
};
// The folder of the four page shapes that once ended a run: a resource addressed //host, a refresh to another
// page, a script that sends the page to another, and the good page they are sent to.
const strayPages = dir => ({
  fine: page(dir, 'fine.html', '<p>The page they are sent to.</p>'),
  host: page(dir, 'host.html', '<p>Fonts from a host.</p>', '<link rel="stylesheet" href="//fonts.example.invalid/x.css">\n'),
  meta: page(dir, 'redirect-meta.html', '<p>Refreshed away.</p>', '<meta http-equiv="refresh" content="0; url=fine.html">\n'),
  script: page(dir, 'redirect-script.html', '<script>location.href = "fine.html"</script>\n<p>Sent away.</p>'),
});

// A Chrome that writes its process id to a file and then becomes the real one. Playwright starts it as the
// leader of a process group of its own, so every process the launch started carries that id as its group.
const countingChrome = dir => {
  const file = join(dir, 'counting chrome.sh');
  const pids = join(dir, 'chrome.pids');
  writeFileSync(file, `#!/bin/sh\necho $$ >> '${pids}'\nexec '${findChrome()}' "$@"\n`);
  chmodSync(file, 0o755);
  return { file, pids: () => (existsSync(pids) ? readFileSync(pids, 'utf8').trim().split('\n').map(Number) : []) };
};
// The processes of one group still running: a zombie (state Z) has ended, and only waits for its parent,
// which may be a subreaper that reaps late, to collect it.
const inGroup = pgid =>
  spawnSync('ps', ['-A', '-o', 'pgid=,stat='], { encoding: 'utf8' })
    .stdout.split('\n')
    .map(line => line.trim().split(/\s+/))
    .filter(([group, state]) => Number(group) === pgid && !state.startsWith('Z')).length;
// The processes still alive in a group once it has had three seconds to wind down. Whatever is left is
// killed, so a failing test never leaves a browser behind either.
const leftIn = async pgid => {
  for (let i = 0; i < 30 && inGroup(pgid) > 0; i++) await sleep(100);
  const left = inGroup(pgid);
  try {
    process.kill(-pgid, 'SIGKILL');
  } catch {}
  return left;
};

// The processes left by every Chrome a run started. Each group is counted, and what is left of it stopped,
// before anything is asserted: a failing test leaves no browser behind.
const leftOf = async pids => {
  let left = 0;
  for (const pid of pids) left += await leftIn(pid);
  return left;
};

// A command of this run, given at most `ms` to end: stopped through its own handle when it does not.
const runFor = (args, ms, env = {}) =>
  new Promise(resolve => {
    const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, ...env } });
    let stdout = '';
    let stderr = '';
    const stop = setTimeout(() => child.kill('SIGKILL'), ms);
    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('close', status => {
      clearTimeout(stop);
      resolve({ status, stdout, stderr });
    });
  });
// Faults put into the browsers a command starts, through Playwright's own objects. FAULT names one:
//   hang                page.close() never returns for the page named FAULT_PAGE
//   crash               as that page opens, the browser is stopped by its own process handle, the one
//                       Playwright's server gives
//   die-after           the same, once that page has been closed
//   stuck               no browser server ever closes, and its kill stops the browser but never returns
//   context             the first context never closes
//   dead-page           the browser is stopped, by its own process handle, as a page is asked of it: at the
//                       calls numbered in FAULT_AT (as "2,3"), counted over the whole run, or at every
//                       call ("all")
//   dead-context        the same, as a context is asked of it
//   no-page             the page asked for at the calls numbered in FAULT_AT never comes
//   no-connect          the browser started never answers the one that started it
//   leaves-as-read      the first time the page named FAULT_PAGE is read, it has just left for
//                       away/elsewhere.html, and the reading fails as Playwright's does then
//   leaves-as-pictured  that page leaves for away/elsewhere.html just before its picture is taken
//   leaves-unpictured   that page leaves the same way, and the picture then fails as Playwright's does
//   unread-as-pictured  that page can be read once, before its picture, and never again
//   no-mark             the page asked for at the calls numbered in FAULT_AT can never be marked
//   report              the failure of the request named FAULT_PAGE cannot be read
const faults = join(root, 'browser-faults.cjs');
writeFileSync(faults, [
  "const { chromium } = require('playwright-core');",
  'const fault = process.env.FAULT;',
  "const at = n => process.env.FAULT_AT === 'all' || (process.env.FAULT_AT ?? '').split(',').map(Number).includes(n);",
  "const marked = url => (process.env.FAULT_PAGE ?? '').split(',').some(name => String(url).endsWith('/' + name));",
  'const never = () => new Promise(() => {});',
  'const servers = [];',
  'let contexts = 0;',
  'let pages = 0;',
  "const stopOwn = async () => { const child = servers.at(-1).process(); if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await new Promise(resolve => child.once('exit', resolve)); } };",
  'const launchServer = chromium.launchServer.bind(chromium);',
  'chromium.launchServer = async (...args) => {',
  '  const server = await launchServer(...args);',
  '  servers.push(server);',
  "  if (fault === 'stuck') { const kill = server.kill.bind(server); server.close = never; server.kill = async () => { await kill(); await never(); }; }",
  '  return server;',
  '};',
  'const connect = chromium.connect.bind(chromium);',
  'chromium.connect = async (...args) => {',
  "  if (fault === 'no-connect') await never();",
  '  const browser = await connect(...args);',
  '  const newContext = browser.newContext.bind(browser);',
  '  browser.newContext = async (...a) => {',
  "    if (fault === 'dead-context' && at(++contexts)) await stopOwn();",
  '    const context = await newContext(...a);',
  "    if (fault === 'context' && !globalThis.contextHung) { globalThis.contextHung = true; context.close = never; }",
  '    const newPage = context.newPage.bind(context);',
  '    context.newPage = async (...b) => {',
  '      pages++;',
  "      if (fault === 'dead-page' && at(pages)) await stopOwn();",
  "      if (fault === 'no-page' && at(pages)) await never();",
  '      const page = await newPage(...b);',
  '      const evaluate = page.evaluate.bind(page);',
  "      const leave = async () => { const landed = page.waitForEvent('framenavigated'); await evaluate(() => { location.href = 'away/elsewhere.html'; }); await landed; };",
  "      if (fault === 'hang') { const close = page.close.bind(page); page.close = (...c) => (marked(page.url()) ? never() : close(...c)); }",
  "      if (fault === 'crash') { const goto = page.goto.bind(page); page.goto = (url, ...c) => { if (marked(url)) servers.at(-1).process().kill('SIGKILL'); return goto(url, ...c); }; }",
  "      if (fault === 'die-after') { const close = page.close.bind(page); page.close = async (...c) => { const marks = marked(page.url()); await close(...c); if (marks) servers.at(-1).process().kill('SIGKILL'); }; }",
  "      if (fault === 'leaves-as-read') { let read = false; page.evaluate = async (...c) => { if (read || !marked(page.url())) return evaluate(...c); read = true; await leave(); throw new Error('page.evaluate: Execution context was destroyed, most likely because of a navigation'); }; }",
  "      if (fault === 'leaves-as-pictured') { const screenshot = page.screenshot.bind(page); page.screenshot = async (...c) => { if (marked(page.url())) await leave(); return screenshot(...c); }; }",
  "      if (fault === 'leaves-unpictured') { const screenshot = page.screenshot.bind(page); page.screenshot = async (...c) => { if (!marked(page.url())) return screenshot(...c); await leave(); throw new Error('page.screenshot: Timeout 30000ms exceeded.'); }; }",
  "      if (fault === 'no-mark' && at(pages)) page.exposeBinding = never;",
  "      if (fault === 'unread-as-pictured') { let reads = 0; page.evaluate = async (...c) => { if (marked(page.url()) && ++reads > 1) throw new Error('page.evaluate: the page did not say'); return evaluate(...c); }; }",
  "      if (fault === 'report') { const on = page.on.bind(page); page.on = (event, listener) => on(event, event !== 'requestfailed' ? listener : request => { if (marked(request.url())) request.failure = () => { throw new Error('a listener fault'); }; return listener(request); }); }",
  '      return page;',
  '    };',
  '    return context;',
  '  };',
  '  return browser;',
  '};',
].join('\n'));

// ---- shooting

test('shooting the board at 1280 and 390, light, writes six full-page PNGs, each as wide as its width', async () => {
  const out = join(fresh(), 'shots');
  const result = await shoot([board], { out, widths: [1280, 390], themes: ['light'] });
  const expected = [1280, 390].flatMap(width => Object.keys(LETTERS).map(letter => join(out, `${letter}-${width}-light.png`)));
  assert.deepEqual(result.files, expected);
  assert.deepEqual(readdirSync(out).sort(), expected.map(file => basename(file)).sort());
  for (const file of result.files) {
    const { width, height } = pngSize(file);
    assert.equal(width, file.includes('-1280-') ? 1280 : 390, file);
    assert.ok(height >= 900, `${file} is ${height} px high`);
  }
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.overflow, []);
  assert.deepEqual(result.titles, Object.fromEntries(boardPages.map(file => [file, `Option ${basename(file, '.html')}`])));
});

test('a page that throws in a script appears in errors, once, with its file; its pictures are still taken', async () => {
  const dir = fresh();
  const thrower = page(dir, 'throws.html', '<p>Drawn before the error.</p>\n<script>throw new Error("boom")</script>');
  const quiet = page(dir, 'quiet.html', '<p>Nothing wrong here.</p>');
  const out = join(dir, 'shots');
  const result = await shoot([thrower, quiet], { out, widths: [1280, 390] });
  // Seen at both widths, it is one fault.
  assert.deepEqual(result.errors, [{ file: thrower, message: 'script error: boom' }]);
  assert.deepEqual(result.files.map(file => basename(file)), ['throws-1280-light.png', 'quiet-1280-light.png', 'throws-390-light.png', 'quiet-390-light.png']);
  assert.equal(result.titles[thrower], 'throws.html');
});

test('an uncaught rejection, a console error, a missing stylesheet and a broken image are errors; a log or a warning is not', async () => {
  const dir = fresh();
  const files = {
    rejects: page(dir, 'rejects.html', '<script>Promise.reject(new Error("no answer"))</script>'),
    console: page(dir, 'console.html', '<script>console.error("the rooms did not load")</script>'),
    stylesheet: page(dir, 'no kit.html', '<p>Unstyled.</p>', '<link rel="stylesheet" href="kit.css">\n'),
    image: page(dir, 'no image.html', '<img src="pictures/room 2.png" alt="Room 2">'),
    logs: page(dir, 'logs.html', '<script>console.log("fine"); console.info("fine"); console.warn("a warning")</script>'),
  };
  const result = await shoot([dir], { out: join(dir, 'shots'), widths: [390, 1280] });
  assert.deepEqual(messagesOf(result, files.rejects), ['script error: no answer']);
  assert.deepEqual(messagesOf(result, files.console), ['console error: the rooms did not load']);
  // A resource that fails is said once: Chrome's own console line about it is not repeated.
  assert.deepEqual(messagesOf(result, files.stylesheet), ['kit.css did not load: net::ERR_FILE_NOT_FOUND']);
  assert.deepEqual(messagesOf(result, files.image), ['pictures/room 2.png did not load: net::ERR_FILE_NOT_FOUND']);
  assert.deepEqual(messagesOf(result, files.logs), []);
  assert.equal(result.errors.length, 4);
  assert.equal(result.files.length, 10, 'every picture is taken');
});

test('a resource answered with an HTTP status from 400 is a failed request; one answered 200 or 399 is not', async () => {
  // A picture answered with the status its path names.
  const server = createServer((request, response) => response.writeHead(Number(request.url.slice(1, 4)), { 'content-type': 'image/png' }).end(PNG));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const at = `http://127.0.0.1:${server.address().port}`;
    const dir = fresh();
    const file = page(dir, 'remote.html', ['200', '399', '400', '404'].map(code => `<img src="${at}/${code}.png" alt="${code}">`).join('\n'));
    const result = await shoot([file], { out: join(dir, 'shots'), widths: [390] });
    assert.deepEqual(result.errors, [
      { file, message: `${at}/400.png did not load: HTTP 400` },
      { file, message: `${at}/404.png did not load: HTTP 404` },
    ]);
  } finally {
    server.close();
  }
});

test('a navigation that fails is an error: a page that sends itself to a file that is not there, said once, and not pictured', async () => {
  const dir = fresh();
  const leaves = page(dir, 'leaves.html', '<script>location.href = "gone.html"</script>');
  const result = await shoot([leaves], { out: join(dir, 'shots'), widths: [390] });
  assert.deepEqual(result.errors, [{ file: leaves, message: 'the page sent itself to gone.html, which did not open: net::ERR_FILE_NOT_FOUND' }]);
  assert.deepEqual([result.files, result.titles], [[], {}]);
});

test('shoot never dies on a page: a //host resource, a refresh and a script that send the page away are errors of their own pages, and the run goes on', async () => {
  const dir = fresh();
  const pages = strayPages(dir);
  const out = join(dir, 'shots');
  // Older pictures under the names of the pages that leave: a judge must never read them.
  mkdirSync(out);
  for (const name of ['redirect-meta-390-light.png', 'redirect-script-1280-light.png']) writeFileSync(join(out, name), 'an older picture');
  // Four contexts: a page that leaves is closed four times while it moves, which once hung Chrome for good.
  let result;
  try {
    result = await shoot([dir], { out, widths: [1280, 390], themes: ['light', 'dark'] });
  } catch (e) {
    assert.fail(`shoot rejected: ${e.stack}`);
  }
  assert.deepEqual(result.errors, [
    { file: pages.host, message: 'file://fonts.example.invalid/x.css did not load: net::ERR_INVALID_URL' },
    { file: pages.meta, message: 'the page sent itself to fine.html' },
    { file: pages.script, message: 'the page sent itself to fine.html' },
  ]);
  const pictured = ['1280-light', '1280-dark', '390-light', '390-dark'].flatMap(at => [`fine-${at}.png`, `host-${at}.png`]);
  assert.deepEqual(result.files.map(file => basename(file)), pictured);
  assert.deepEqual(readdirSync(out).sort(), [...pictured].sort());
  assert.deepEqual(Object.keys(result.titles), [pages.fine, pages.host], 'a page that left has no title of its own');
});

test('a frame inside the page that goes nowhere is a resource that did not open; a frame that opens is nothing; neither moves the page', async () => {
  const dir = fresh();
  page(dir, 'inner.html', '<p>Inside.</p>');
  const framed = page(dir, 'framed.html', '<iframe src="inner.html"></iframe>\n<iframe src="missing.html"></iframe>');
  const result = await shoot([framed], { out: join(dir, 'shots'), widths: [390] });
  assert.deepEqual(result.errors, [{ file: framed, message: 'missing.html did not open: net::ERR_FILE_NOT_FOUND' }]);
  assert.deepEqual(result.files.map(file => basename(file)), ['framed-390-light.png']);
});

test('a page that goes to about:blank, from its script or once loaded, sent itself there: an error, and no picture', async () => {
  const dir = fresh();
  const loaded = painted(dir, 'blank-load.html', BLUE, '<script>addEventListener("load", () => (location.href = "about:blank"))</script>\n<p>Leaves.</p>');
  const script = painted(dir, 'blank-script.html', BLUE, '<script>location.href = "about:blank"</script>');
  painted(dir, 'good.html', GREEN, '<p>Good.</p>');
  const out = join(dir, 'shots');
  mkdirSync(out);
  writeFileSync(join(out, 'blank-load-390-light.png'), 'an older picture');
  const result = await shoot([dir], { out, widths: [390, 400] });
  assert.deepEqual(result.errors, [
    { file: loaded, message: 'the page sent itself to about:blank' },
    { file: script, message: 'the page sent itself to about:blank' },
  ]);
  assert.deepEqual(readdirSync(out).sort(), ['good-390-light.png', 'good-400-light.png']);
  for (const file of result.files) assert.equal(colourAt(file), GREEN, file);
});

test('a page that loads its own file again is no longer the document that was loaded: it reloaded itself, named with its query, and is not pictured', async () => {
  const dir = fresh();
  const reload = painted(dir, 'reload.html', BLUE, '<script>if (!location.search) location.search = "?again"</script>\n<p>Again.</p>');
  // It leaves, and the page it went to sends it back: the file asked for, in a document of its own.
  const returns = painted(dir, 'returns.html', BLUE, '<script>if (location.hash !== "#back") location.href = "away/back.html"</script>\n<p>Back.</p>');
  painted(join(dir, 'away'), 'back.html', RED, '<script>location.href = "../returns.html#back"</script>');
  painted(dir, 'good.html', GREEN, '<p>Good.</p>');
  const out = join(dir, 'shots');
  mkdirSync(out);
  writeFileSync(join(out, 'reload-390-light.png'), 'an older picture');
  const result = await shoot([dir], { out, widths: [390, 400] });
  assert.deepEqual(result.errors, [
    { file: reload, message: 'the page reloaded itself, as reload.html?again' },
    { file: returns, message: 'the page reloaded itself, as returns.html' },
  ]);
  assert.deepEqual(readdirSync(out).sort(), ['good-390-light.png', 'good-400-light.png']);
  for (const file of result.files) assert.equal(colourAt(file), GREEN, file);
});

test('a page that leaves just as it is pictured is never pictured as the page it left for: each picture kept shows the page asked for, and a page with none has an error', { timeout: 120_000 }, async t => {
  const later = (to, ms) => `<script>setTimeout(() => (location.href = ${to}), ${ms})</script>\n<p>Leaves.</p>`;
  const blob = `URL.createObjectURL(new Blob(['<body style="background: rgb(${RED})">blob'], { type: "text/html" }))`;
  // Each page paints a colour of its own, and leaves about when its picture is taken: a page is judged
  // settled 100 ms after it last moved. Where each goes paints another colour. The one that leaves after
  // 150 ms is sometimes pictured first: as itself.
  const leaving = {
    'file-110.html': [BLUE, later('"away/target.html"', 110)],
    'file-130.html': [BLUE, later('"away/target.html"', 130)],
    'file-150.html': [BLUE, later('"away/target.html"', 150)],
    'blank-120.html': [BLUE, later('"about:blank"', 120)],
    'blob-110.html': [BLUE, later(blob, 110)],
  };
  // A pair that send each other back and forth, and a ring of three, every 110 ms.
  const circling = {
    'pair-a.html': [BLUE, later('"pair-b.html"', 110)],
    'pair-b.html': [RED, later('"pair-a.html"', 110)],
    'ring-1.html': [BLUE, later('"ring-2.html"', 110)],
    'ring-2.html': [RED, later('"ring-3.html"', 110)],
    'ring-3.html': [YELLOW, later('"ring-1.html"', 110)],
  };
  // Each page is shot three times, one browser at a time, beside a good page, with an older picture under
  // every name. They are given little time: Chrome can take all it is given to picture a page that leaves
  // meanwhile, and does for one that goes round.
  const widths = [390, 400, 410];
  const tally = { pages: 0, shots: 0, kept: 0, during: 0 };
  for (const [pages, timeout] of [[leaving, 1000], [circling, 300]]) {
    const dir = fresh();
    const all = { ...pages, 'good.html': [GREEN, '<p>Good.</p>'] };
    for (const [name, [colour, body]] of Object.entries(all)) painted(dir, name, colour, body);
    painted(join(dir, 'away'), 'target.html', RED, '<p>The other page.</p>');
    const out = join(dir, 'shots');
    mkdirSync(out);
    const pictureOf = (name, width) => join(out, `${basename(name, '.html')}-${width}-light.png`);
    for (const name of Object.keys(all)) for (const width of widths) writeFileSync(pictureOf(name, width), 'an older picture');
    const result = await shoot([dir], { out, widths, timeout });
    for (const [name, [colour]] of Object.entries(all)) {
      const messages = messagesOf(result, join(dir, name));
      const kept = widths.filter(width => existsSync(pictureOf(name, width)));
      // A picture kept shows the page asked for, never an older one or another page; a page with a picture
      // missing has an error.
      for (const width of kept) assert.equal(colourAt(pictureOf(name, width)), colour, `${pictureOf(name, width)} shows the page asked for`);
      if (kept.length < widths.length) assert.ok(messages.length > 0, `${name} has a picture missing, and no error: ${JSON.stringify(result.errors)}`);
      assert.deepEqual(result.files.filter(file => basename(file).startsWith(`${basename(name, '.html')}-`)), kept.map(width => pictureOf(name, width)), `${name}: the pictures said are the pictures there`);
      if (name !== 'good.html') {
        tally.pages++;
        tally.shots += widths.length;
        tally.kept += kept.length;
        tally.during += messages.some(message => message.endsWith(' while it was being pictured'));
      }
    }
    assert.deepEqual(messagesOf(result, join(dir, 'good.html')), []);
    assert.equal(result.files.filter(file => basename(file).startsWith('good-')).length, widths.length, 'the good page is pictured each time');
    // A page that left once is said to have left, and where the tab is now: before its picture, or while it
    // was taken.
    if (pages !== leaving) continue;
    for (const name of Object.keys(leaving)) {
      const where = name.startsWith('file-') ? 'away/target\\.html' : name.startsWith('blank-') ? 'about:blank' : 'blob:\\S+';
      for (const message of messagesOf(result, join(dir, name))) assert.match(message, new RegExp(`^the page sent itself to ${where}( while it was being pictured)?$`), name);
    }
  }
  t.diagnostic(`${tally.shots} shots of ${tally.pages} pages that leave: ${tally.kept} pictured as themselves, the others not pictured; ${tally.during} of the ${tally.pages} pages were seen leaving while pictured`);
});

test('a page that leaves while its picture is taken, or as it is read, has an error saying where it went, and one that cannot say whether it left has an error too; the picture taken is not kept', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  for (const [fault, message] of [
    ['leaves-as-pictured', 'the page sent itself to away/elsewhere.html while it was being pictured'],
    ['leaves-unpictured', 'the page sent itself to away/elsewhere.html while it was being pictured'],
    ['leaves-as-read', 'the page sent itself to away/elsewhere.html'],
    ['unread-as-pictured', 'the page could not be read again once pictured: the page did not say'],
  ]) {
    const dir = fresh();
    const chrome = countingChrome(dir);
    painted(dir, 'a-good.html', GREEN, '<p>Good.</p>');
    const leaves = painted(dir, 'b-leaves.html', BLUE, '<p>Leaves at the worst moment.</p>');
    painted(dir, 'c-after.html', YELLOW, '<p>After.</p>');
    painted(join(dir, 'away'), 'elsewhere.html', RED, '<p>Elsewhere.</p>');
    const out = join(dir, 'shots');
    mkdirSync(out);
    writeFileSync(join(out, 'b-leaves-390-light.png'), 'an older picture');
    const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '390', '--chrome', chrome.file], 30_000, { FAULT: fault, FAULT_PAGE: 'b-leaves.html' });
    const left = await leftOf(chrome.pids());
    assert.deepEqual([r.status, r.stderr], [1, `error: ${leaves}: ${message}\n`], fault);
    // The picture taken is not kept under the page's name, nor the older one.
    assert.deepEqual(readdirSync(out).sort(), ['a-good-390-light.png', 'c-after-390-light.png'], fault);
    assert.deepEqual([colourAt(join(out, 'a-good-390-light.png')), colourAt(join(out, 'c-after-390-light.png'))], [GREEN, YELLOW]);
    assert.equal(left, 0, 'no process of its Chrome is left');
  }
});

test('a page that sends itself to an address that cannot be decoded is an error of its own, named as written; the run goes on', () => {
  const dir = fresh();
  const percent = painted(dir, 'a-percent.html', BLUE, '<script>location.href = "sub/x%zz.html"</script>');
  painted(dir, 'b-good.html', GREEN, '<p>Good.</p>');
  const out = join(dir, 'shots');
  mkdirSync(out);
  for (const name of ['a-percent', 'b-good']) writeFileSync(join(out, `${name}-390-light.png`), 'an older picture');
  const r = run(dir, '--out', out, '--widths', '390');
  assert.deepEqual([r.status, r.stderr], [1, `error: ${percent}: the page sent itself to sub/x%zz.html, which did not open: net::ERR_FILE_NOT_FOUND\n`]);
  assert.deepEqual(readdirSync(out), ['b-good-390-light.png']);
  assert.equal(colourAt(join(out, 'b-good-390-light.png')), GREEN);
});

test('naming an address never fails: a file beside the page by its path and query, a part that cannot be decoded as written, anything else by its address', () => {
  const folder = join(root, 'named pages');
  const at = rest => `${pathToFileURL(folder).href}${rest}`;
  assert.equal(nameOf(at('/plain.html'), folder), 'plain.html');
  assert.equal(nameOf(at('/two%20words/caf%C3%A9.html?step=2#here'), folder), 'two words/café.html?step=2');
  assert.equal(nameOf(pathToFileURL(join(root, 'beside.html')).href, folder), '../beside.html');
  // A bare %, and a byte that is no UTF-8, cannot be decoded: that part is shown as it is written.
  assert.equal(nameOf(at('/sub/x%zz.html'), folder), 'sub/x%zz.html');
  assert.equal(nameOf(at('/100%.html'), folder), '100%.html');
  assert.equal(nameOf(at('/two%20words/%ff%20x.html?q=%zz'), folder), 'two words/%ff%20x.html?q=%zz');
  // What names no path on this machine, or is no file address, or no address at all, is named by itself.
  for (const address of ['file://fonts.example.invalid/x.css', at('/a%2Fb.html'), 'about:blank', 'http://127.0.0.1:9/x%zz.html', 'blob:null/1-2-3', 'chrome-error://chromewebdata/', 'file://%zz/x.html', '']) {
    assert.equal(nameOf(address, folder), address, address);
  }
});

test('a page or a folder whose name holds ^ or | is the page asked for: pictured, exit 0', () => {
  const dir = join(fresh(), 'up^folder');
  page(dir, 'caret^.html', '<p>Caret.</p>');
  // Windows refuses | in a file name.
  if (UNIX) page(dir, 'pipe|.html', '<p>Pipe.</p>');
  const out = join(dir, 'shots');
  const r = run(dir, '--out', out, '--widths', '390');
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.deepEqual(readdirSync(out).sort(), UNIX ? ['caret^-390-light.png', 'pipe|-390-light.png'] : ['caret^-390-light.png']);
});

test('a page settles only with no move under way and once it has stayed on one document: a slow move is waited for, a move on arrival is followed, a ticking # is no move', async () => {
  const html = body => `<!doctype html><html><head><meta charset="utf-8"><title>t</title></head><body>${body}</body></html>`;
  const server = createServer((request, response) => {
    const send = body => response.writeHead(200, { 'content-type': 'text/html' }).end(html(body));
    if (request.url === '/slow') setTimeout(() => send('<p>Slow to come.</p>'), 600);
    else if (request.url === '/hop') setTimeout(() => send('<script>setTimeout(() => (location.href = "/end"), 50)</script>'), 400);
    else send('<p>The end.</p>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const at = `http://127.0.0.1:${server.address().port}`;
    const dir = fresh();
    // Once loaded it sets off on a move that takes 600 ms to land: it is judged where it lands, not
    // pictured as itself meanwhile.
    const slow = page(dir, 'a-slow.html', `<script>addEventListener("load", () => setTimeout(() => (location.href = "${at}/slow"), 10))</script>\n<p>Leaving.</p>`);
    // It lands after 400 ms on a page that moves on 50 ms later: it is judged where it ends.
    const hop = page(dir, 'b-hop.html', `<script>location.href = "${at}/hop"</script>\n<p>Leaving.</p>`);
    // Only the part after # changes, every 30 ms: it never leaves, and is pictured.
    page(dir, 'c-ticking.html', '<script>setInterval(() => (location.hash = String(Date.now())), 30)</script>\n<p>Ticking.</p>');
    const result = await shoot([dir], { out: join(dir, 'shots'), widths: [390], timeout: 5000 });
    assert.deepEqual(result.errors, [
      { file: slow, message: `the page sent itself to ${at}/slow` },
      { file: hop, message: `the page sent itself to ${at}/end` },
    ]);
    assert.deepEqual(result.files.map(file => basename(file)), ['c-ticking-390-light.png']);
  } finally {
    server.closeAllConnections();
    server.close();
  }
});

test('a page that changes its address and keeps its document stays the page asked for: what follows the #, a query pushed or replaced in its history; pictured, exit 0', () => {
  const dir = fresh();
  // On a file page Chrome lets a script change what follows the # of its address and its query, through its
  // history too; another path it refuses. None of these loads a document.
  const colours = {
    hash: [BLUE, 'history.replaceState(null, "", "#state"); location.hash = "later"'],
    pushed: [YELLOW, 'history.pushState(null, "", "?step=2")'],
    replaced: [RED, 'history.replaceState(null, "", "?step=2")'],
    ticking: [BLUE, 'setInterval(() => history.replaceState(null, "", "?tick=" + Date.now()), 30)'],
    good: [GREEN, ''],
  };
  for (const [name, [colour, script]] of Object.entries(colours)) painted(dir, `${name}.html`, colour, `<script>${script}</script>\n<p>Still here.</p>`);
  const out = join(dir, 'shots');
  const r = run(dir, '--out', out, '--widths', '390,400,410');
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.equal(r.stdout, `shot 15 pictures at 390, 400, 410 px, light, into ${out}\n`);
  for (const [name, [colour]] of Object.entries(colours)) {
    for (const width of [390, 400, 410]) assert.equal(colourAt(join(out, `${name}-${width}-light.png`)), colour, `${name} at ${width}`);
  }
});

test('a page that cannot be read, or cannot be pictured, is an error of its own, with no picture; the run goes on', async () => {
  const dir = fresh();
  const unread = page(dir, 'a-unread.html', '<script>document.documentElement.remove()</script>');
  const huge = page(dir, 'b-huge.html', '<div style="height: 100000000px">Taller than any picture.</div>', '<style>html, body { margin: 0 }</style>\n');
  const busy = page(dir, 'c-busy.html', '<script>addEventListener("load", () => setTimeout(() => { for (;;); }))</script>\n<p>Busy for ever.</p>');
  const fine = page(dir, 'd-fine.html', '<p>Fine.</p>');
  const out = join(dir, 'shots');
  const result = await shoot([dir], { out, widths: [390], timeout: 2000 });
  assert.equal(messagesOf(result, unread).length, 1, JSON.stringify(result.errors));
  assert.match(messagesOf(result, unread)[0], /^the page could not be read: .*scrollWidth/);
  assert.equal(messagesOf(result, huge).length, 1, JSON.stringify(result.errors));
  assert.match(messagesOf(result, huge)[0], /^the picture could not be taken: /);
  assert.deepEqual(messagesOf(result, busy), ['the page could not be read: it gave no answer within 2000 ms']);
  assert.deepEqual(result.files, [join(out, 'd-fine-390-light.png')]);
  assert.deepEqual(Object.keys(result.titles), [fine]);
});

test('a page that does not finish loading within the timeout is an error naming it; an older picture of it is removed', async () => {
  const server = await holding();
  try {
    const dir = fresh();
    const slow = page(dir, 'slow.html', '<p>Waits for its stylesheet.</p>', `<link rel="stylesheet" href="${server.at}/held.css">\n`);
    const fine = page(dir, 'fine.html', '<p>Fine.</p>');
    const out = join(dir, 'shots');
    mkdirSync(out);
    writeFileSync(join(out, 'slow-390-light.png'), 'an older picture');
    const result = await shoot([dir], { out, widths: [390], timeout: 1500 });
    assert.deepEqual(result.errors, [{ file: slow, message: 'slow.html did not finish loading within 1500 ms' }]);
    assert.deepEqual(readdirSync(out), ['fine-390-light.png']);
    assert.equal(result.titles[fine], 'fine.html');
  } finally {
    server.close();
  }
});

test('a page that sets off for an address that never opens is an error saying where it was going', async () => {
  // A server that answers 1.4 s after it is asked: by then the page has been given up, 1 s after it was
  // opened, and its move lands at last, so that closing it waits for nothing more.
  const server = createServer((request, response) => void setTimeout(() => response.end('late'), 1400));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const at = `http://127.0.0.1:${server.address().port}`;
    const dir = fresh();
    // One sets off as it loads, and so never finishes loading; one sets off once loaded.
    const loading = page(dir, 'a-loading.html', `<script>location.href = "${at}/held"</script>\n<p>Leaving.</p>`);
    const loaded = page(dir, 'b-loaded.html', `<script>addEventListener("load", () => setTimeout(() => (location.href = "${at}/held"), 20))</script>\n<p>Leaving.</p>`);
    page(dir, 'c-good.html', '<p>Good.</p>');
    const out = join(dir, 'shots');
    const result = await shoot([dir], { out, widths: [390], timeout: 1000 });
    assert.deepEqual(result.errors, [
      { file: loading, message: `a-loading.html did not finish loading within 1000 ms: it had set off for ${at}/held` },
      { file: loaded, message: `the page kept moving for 1000 ms, last to ${at}/held` },
    ]);
    assert.deepEqual(readdirSync(out), ['c-good-390-light.png']);
  } finally {
    server.closeAllConnections();
    server.close();
  }
});

test('a page Chrome may not open is an error, said once, and no picture is taken of it', async t => {
  // This checkout's file system grants every permission, so the page is put where one is kept.
  const dir = mkdtempSync(join(tmpdir(), 'ux-shots-'));
  const locked = page(dir, 'locked.html', '<p>Locked.</p>');
  try {
    chmodSync(locked, 0);
    try {
      readFileSync(locked);
      return t.skip('this user or file system ignores permissions');
    } catch {}
    const out = join(dir, 'shots');
    const result = await shoot([locked], { out, widths: [1280, 390] });
    assert.equal(result.errors.length, 1, JSON.stringify(result.errors));
    assert.equal(result.errors[0].file, locked);
    assert.match(result.errors[0].message, /^the page did not open: net::ERR_ACCESS_DENIED/);
    assert.deepEqual([result.files, readdirSync(out), result.titles], [[], [], {}]);
  } finally {
    chmodSync(locked, 0o644);
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a page 900 px wide by CSS overflows at 390 and not at 1280; overflow is reported, never an error', async () => {
  const dir = fresh();
  const wide = page(dir, 'wide.html', '<div style="width: 900px">Nine hundred pixels wide.</div>');
  page(dir, 'narrow.html', '<p>It fits.</p>');
  const result = await shoot([dir], { out: join(dir, 'shots'), widths: [1280, 390], themes: ['light', 'dark'] });
  // Seen in both themes, it is one overflow at that width.
  assert.deepEqual(result.overflow, [{ file: wide, width: 390 }]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.files.length, 8);
});

test('an input folder whose name holds a space is shot without error', async () => {
  const spaced = drawBoard(join(fresh(), 'two words'));
  const out = join(dirname(spaced), 'the shots');
  const result = await shoot([spaced], { out, widths: [390] });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.files, ['A', 'B', 'C'].map(letter => join(out, `${letter}-390-light.png`)));
  assert.equal(result.titles[join(spaced, 'B.html')], 'Option B');
});

test('every context is made with reduced motion: the page says so in its title, and never widens itself', async () => {
  const dir = fresh();
  const motion = page(
    dir,
    'motion.html',
    '<script>document.title = "reduce:" + matchMedia("(prefers-reduced-motion: reduce)").matches</script>',
    // Without reduced motion this page is wider than any screen, so a context made without it overflows.
    '<style>@media (prefers-reduced-motion: no-preference) { body { width: 5000px } }</style>\n',
  );
  const result = await shoot([motion], { out: join(dir, 'shots'), widths: [1280, 390], themes: ['light', 'dark'] });
  assert.deepEqual(result.titles, { [motion]: 'reduce:true' });
  assert.deepEqual(result.overflow, []);
  assert.equal(result.files.length, 4);
});

test('the screen is the width by 900 px at scale 1, and the picture is the whole page', async () => {
  const dir = fresh();
  const short = page(dir, 'short.html', '<script>document.title = `${innerWidth}x${innerHeight}@${devicePixelRatio}`</script>');
  page(dir, 'tall.html', '<div style="height: 3000px">Tall.</div>', '<style>html, body { margin: 0 }</style>\n');
  const out = join(dir, 'shots');
  const result = await shoot([dir], { out, widths: [390] });
  assert.equal(result.titles[short], '390x900@1');
  assert.deepEqual(pngSize(join(out, 'short-390-light.png')), { width: 390, height: 900 });
  assert.deepEqual(pngSize(join(out, 'tall-390-light.png')), { width: 390, height: 3000 });
});

test('each theme is its own colour scheme; light is the default, and dark is asked for by name', async () => {
  const dir = fresh();
  const themed = page(
    dir,
    'themed.html',
    '<script>document.title = "dark:" + matchMedia("(prefers-color-scheme: dark)").matches</script>',
    '<style>body { background: #ffffff } @media (prefers-color-scheme: dark) { body { background: #000000 } }</style>\n',
  );
  const out = join(dir, 'shots');
  let result = await shoot([themed], { out, widths: [390], themes: ['light', 'dark'] });
  assert.deepEqual(result.files, [join(out, 'themed-390-light.png'), join(out, 'themed-390-dark.png')]);
  assert.notDeepEqual(readFileSync(result.files[0]), readFileSync(result.files[1]), 'the two pictures differ');
  // The title is the one of the first picture taken, in the order the themes are given.
  assert.deepEqual(result.titles, { [themed]: 'dark:false' });
  result = await shoot([themed], { out: join(dir, 'dark first'), widths: [390], themes: ['dark', 'light'] });
  assert.deepEqual(result.titles, { [themed]: 'dark:true' });
  result = await shoot([themed], { out: join(dir, 'dark'), widths: [390], themes: ['dark'] });
  assert.deepEqual(result.titles, { [themed]: 'dark:true' });
  result = await shoot([themed], { out: join(dir, 'default'), widths: [390] });
  assert.deepEqual([result.files, result.titles], [[join(dir, 'default', 'themed-390-light.png')], { [themed]: 'dark:false' }]);
});

test('a folder means every .html file directly in it, in name order: no other file, no sub-folder, no folder named .html', async () => {
  const dir = fresh();
  page(dir, 'b.html', '<p>b</p>');
  page(dir, 'Shouty.HTML', '<p>Shouty</p>');
  page(dir, 'a.html', '<p>a</p>');
  page(join(dir, 'inner'), 'inner.html', '<p>inner</p>');
  mkdirSync(join(dir, 'folder.html'));
  writeFileSync(join(dir, 'notes.txt'), 'not a page');
  writeFileSync(join(dir, 'page.html.bak'), 'not a page');
  const out = join(dir, 'shots');
  const result = await shoot([dir], { out, widths: [390] });
  assert.deepEqual(result.files.map(file => basename(file)), ['Shouty-390-light.png', 'a-390-light.png', 'b-390-light.png']);
  assert.deepEqual(result.errors, []);
});

test('a page given twice is shot once; two pages that would be pictured under one name are refused', async () => {
  const dir = fresh();
  const result = await shoot([board, boardPages[1], join(board, '..', 'board', 'B.html')], { out: join(dir, 'shots'), widths: [390] });
  assert.deepEqual(result.files.map(file => basename(file)), ['A-390-light.png', 'B-390-light.png', 'C-390-light.png']);
  const other = page(join(dir, 'other'), 'B.html', '<p>Another B.</p>');
  const lower = page(join(dir, 'lower'), 'b.html', '<p>A lower-case b.</p>');
  for (const clash of [other, lower]) {
    await assert.rejects(
      shoot([board, clash], { out: join(dir, 'clash'), widths: [390] }),
      e => e instanceof ShotsError && e.message === `${boardPages[1]} and ${clash} would be pictured under one name: shoot them into different folders`,
    );
  }
  assert.ok(!existsSync(join(dir, 'clash')), 'nothing is made');
});

test('what is refused before Chrome starts: a missing input, a folder with no page, an input that is no file, an output that cannot be a folder', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  const empty = join(dir, 'empty');
  mkdirSync(empty);
  writeFileSync(join(empty, 'notes.txt'), 'no page');
  const file = join(dir, 'a file');
  writeFileSync(file, 'x');
  const refusals = [
    [[join(dir, 'missing.html')], join(dir, 'out'), `cannot read ${join(dir, 'missing.html')}: not found`],
    [[board, join(dir, 'missing')], join(dir, 'out'), `cannot read ${join(dir, 'missing')}: not found`],
    [[empty], join(dir, 'out'), `${empty} holds no .html page`],
    [['/dev/null'], join(dir, 'out'), 'cannot read /dev/null: it is not a file or a folder'],
    [[board], file, `cannot write ${file}: it is a file, not a folder`],
    [[board], join(file, 'shots'), `cannot write ${join(file, 'shots')}: part of the path is a file, not a folder`],
  ];
  for (const [inputs, out, message] of refusals) {
    await assert.rejects(shoot(inputs, { out, widths: [390], chrome: chrome.file }), e => e instanceof ShotsError && e.message === message, message);
  }
  await assert.rejects(shoot([board], { out: join(dir, 'out'), widths: [390], chrome: join(dir, 'no chrome') }), ChromeError);
  // A link named like a page that leads nowhere cannot be read.
  try {
    symlinkSync(join(dir, 'nowhere.html'), join(empty, 'broken.html'));
    await assert.rejects(shoot([empty], { out: join(dir, 'out'), widths: [390], chrome: chrome.file }), e => e instanceof ShotsError && e.message === `cannot read ${join(empty, 'broken.html')}: not found`);
  } catch (e) {
    if (e.code !== 'EPERM' && e.code !== 'ENOTSUP') throw e;
  }
  assert.deepEqual(chrome.pids(), [], 'Chrome was never started');
  assert.ok(!existsSync(join(dir, 'out')), 'nothing is made');
});

test('bad options are refused as a TypeError: inputs, out, widths, themes', async () => {
  const out = join(fresh(), 'shots');
  const bad = [
    [undefined, { out, widths: [390] }, /^inputs must be a list/],
    [[], { out, widths: [390] }, /^inputs must be a list/],
    ['board', { out, widths: [390] }, /^inputs must be a list/],
    [[''], { out, widths: [390] }, /^inputs must be a list/],
    [[board, 7], { out, widths: [390] }, /^inputs must be a list/],
    [[board], { widths: [390] }, /^out must be/],
    [[board], { out: '', widths: [390] }, /^out must be/],
  ];
  for (const widths of [undefined, 390, [], [0], [-390], [390.5], ['390'], [Number.MAX_SAFE_INTEGER + 1]]) bad.push([[board], { out, widths }, /^widths must be/]);
  bad.push([[board], { out, widths: [390, 1280, 390] }, /^390 is given twice$/]);
  for (const themes of ['light', [], ['sepia'], ['Light'], [null]]) bad.push([[board], { out, widths: [390], themes }, /^themes must be/]);
  bad.push([[board], { out, widths: [390], themes: ['dark', 'dark'] }, /^dark is given twice$/]);
  for (const timeout of [0, -1, 1.5, '30000', null]) bad.push([[board], { out, widths: [390], timeout }, /^timeout must be a whole number of milliseconds from 1/]);
  for (const [inputs, options, message] of bad) {
    await assert.rejects(shoot(inputs, options), e => e instanceof TypeError && message.test(e.message), `${JSON.stringify(inputs)} ${JSON.stringify(options)}`);
  }
  assert.ok(!existsSync(out));
});

test('the browser is closed after a page error, and when shooting is refused part-way: no Chrome process is left', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  const thrower = page(join(dir, 'pages'), 'A.html', '<script>throw new Error("boom")</script>');
  page(join(dir, 'pages'), 'B.html', '<p>B</p>');
  const result = await shoot([thrower], { out: join(dir, 'shots'), widths: [390], chrome: chrome.file });
  assert.deepEqual(result.errors, [{ file: thrower, message: 'script error: boom' }]);
  // Refused part-way: a folder stands where the second picture goes.
  const blocked = join(dir, 'blocked');
  mkdirSync(join(blocked, 'B-390-light.png'), { recursive: true });
  await assert.rejects(
    shoot([join(dir, 'pages')], { out: blocked, widths: [390], chrome: chrome.file }),
    e => e instanceof ShotsError && e.message === `cannot write ${join(blocked, 'B-390-light.png')}: it is a folder, not a file`,
  );
  assert.ok(existsSync(join(blocked, 'A-390-light.png')), 'the picture before it was written');
  const pids = chrome.pids();
  assert.equal(pids.length, 2, 'one Chrome for each shoot');
  for (const pid of pids) assert.equal(await leftIn(pid), 0, `processes left from the Chrome started as ${pid}`);
});

// ---- finding Chrome

const withEnv = (vars, fn) => {
  const saved = Object.fromEntries(Object.keys(vars).map(key => [key, process.env[key]]));
  const set = values => {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  set(vars);
  try {
    return fn();
  } finally {
    set(saved);
  }
};
// A file that stands for Chrome: findChrome asks only that it exists.
const standIn = () => {
  const file = join(fresh(), 'my chrome');
  writeFileSync(file, '');
  return file;
};

test('findChrome takes the path it is given first, and refuses one that does not exist', () => {
  const mine = standIn();
  const other = standIn();
  withEnv({ UX_CHROME: other }, () => assert.equal(findChrome(mine), mine));
  const missing = join(dirname(mine), 'no chrome');
  withEnv({ UX_CHROME: other }, () => {
    assert.throws(() => findChrome(missing), e => e instanceof ChromeError && e.message === `no Chrome at ${missing}: the path given does not exist`);
  });
});

test('findChrome takes UX_CHROME when no path is given, refuses it when it names nothing, and reads an empty one as unset', () => {
  const mine = standIn();
  withEnv({ UX_CHROME: mine }, () => assert.equal(findChrome(), mine));
  const missing = join(dirname(mine), 'no chrome');
  withEnv({ UX_CHROME: missing }, () => {
    assert.throws(() => findChrome(), e => e instanceof ChromeError && e.message === `no Chrome at ${missing}: UX_CHROME names it, and it does not exist`);
  });
  withEnv({ UX_CHROME: '' }, () => assert.equal(findChrome(), CHROME_PATHS.find(path => existsSync(path))));
});

// A child in which only the named ones of the four paths exist.
const hiding = join(root, 'hide-chrome.cjs');
writeFileSync(hiding, [
  "const fs = require('node:fs');",
  "const { syncBuiltinESMExports } = require('node:module');",
  `const FOUR = ${JSON.stringify(CHROME_PATHS)};`,
  "const shown = (process.env.SHOWN ?? '').split(',').filter(Boolean).map(Number);",
  'const exists = fs.existsSync;',
  'fs.existsSync = path => (FOUR.includes(String(path)) ? shown.includes(FOUR.indexOf(String(path))) : exists(path));',
  'syncBuiltinESMExports();',
].join('\n'));
const { UX_CHROME, ...unset } = process.env;
const findIn = shown =>
  spawnSync(process.execPath, ['--require', hiding, '--input-type=module', '-e', `import { findChrome } from '${chromeModule}'; console.log(findChrome());`], {
    encoding: 'utf8',
    env: { ...unset, SHOWN: shown },
  });

test('findChrome, with nothing given, takes the first of the four paths that exists, and names all four and both ways when none does', () => {
  assert.deepEqual(CHROME_PATHS, [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ]);
  for (const [shown, found] of [['0,1,2,3', 0], ['1,3', 1], ['2,3', 2], ['3', 3]]) {
    const r = findIn(shown);
    assert.deepEqual([r.status, r.stdout, r.stderr], [0, `${CHROME_PATHS[found]}\n`, ''], shown);
  }
  const r = findIn('');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /ChromeError: no Chrome found/);
  for (const path of CHROME_PATHS) assert.ok(r.stderr.includes(`  ${path}\n`), path);
  assert.ok(r.stderr.includes('give its path with --chrome <path>, or set UX_CHROME to it'), r.stderr);
});

// ---- the command line

// A command that leaves a browser open never ends: it is stopped after a minute, and the test fails.
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: root, timeout: 60_000 });

test('the CLI shoots a folder named with two words into another, prints one line, and exits 0', () => {
  const spaced = drawBoard(join(fresh(), 'the board'));
  const out = join(dirname(spaced), 'the shots');
  const r = run(spaced, '--out', out, '--widths', '1280,390', '--themes=light,dark');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
  assert.equal(r.stdout, `shot 12 pictures at 1280, 390 px, light and dark, into ${out}\n`);
  assert.equal(readdirSync(out).length, 12);
  assert.deepEqual(pngSize(join(out, 'C-390-dark.png')).width, 390);
});

test('the CLI prints one line per error and exits 1, unless --allow-errors; the pictures are taken either way', () => {
  const dir = fresh();
  const thrower = page(dir, 'throws.html', '<script>throw new Error("boom")</script>');
  const unstyled = page(dir, 'unstyled.html', '<p>x</p>', '<link rel="stylesheet" href="kit.css">\n');
  for (const [allow, status] of [[[], 1], [['--allow-errors'], 0]]) {
    const out = join(dir, `shots ${status}`);
    const r = run(dir, '--out', out, '--widths', '390', ...allow);
    assert.equal(r.status, status, r.stderr);
    assert.equal(r.stdout, `shot 2 pictures at 390 px, light, into ${out}\n`);
    assert.equal(r.stderr, `error: ${thrower}: script error: boom\nerror: ${unstyled}: kit.css did not load: net::ERR_FILE_NOT_FOUND\n`);
    assert.deepEqual(readdirSync(out).sort(), ['throws-390-light.png', 'unstyled-390-light.png']);
  }
});

test('the CLI reads a folder in name order, whatever order the file system lists it in', () => {
  const dir = fresh();
  const pages = ['a.html', 'B.html', 'c.html'].map(name => page(dir, name, `<script>throw new Error("${name}")</script>`));
  // The folder listed backwards from name order, on any file system.
  const backwards = join(dir, 'backwards.cjs');
  writeFileSync(backwards, [
    "const fs = require('node:fs');",
    "const { syncBuiltinESMExports } = require('node:module');",
    'const list = fs.readdirSync;',
    'fs.readdirSync = (...args) => list(...args).sort().reverse();',
    'syncBuiltinESMExports();',
  ].join('\n'));
  const out = join(dir, 'shots');
  const r = spawnSync(process.execPath, ['--require', backwards, cli, dir, '--out', out, '--widths', '390', '--allow-errors'], { encoding: 'utf8', timeout: 60_000 });
  assert.equal(r.status, 0, r.stderr);
  // B before a: the order of the names' characters, upper case first.
  assert.equal(r.stderr, [1, 0, 2].map(i => `error: ${pages[i]}: script error: ${basename(pages[i])}\n`).join(''));
});

test('the CLI prints each overflow and still exits 0', () => {
  const dir = fresh();
  const wide = page(dir, 'wide.html', '<div style="width: 900px">Wide.</div>');
  const out = join(dir, 'shots');
  const r = run(wide, '--out', out, '--widths', '390');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `shot 1 picture at 390 px, light, into ${out}\noverflow: ${wide} is wider than the screen at 390 px\n`);
  assert.equal(r.stderr, '');
});

test('the CLI exits 2 for bad usage, with the usage, and makes nothing', () => {
  const dir = fresh();
  const out = join(dir, 'shots');
  const cases = [
    [[], 'shots takes at least one <file or folder>'],
    [[board, '--widths', '390'], '--out is missing'],
    [[board, '--out', out], '--widths is missing'],
    [[board, '--out', out, '--widths', '0'], '--widths must be whole numbers from 1, joined by commas, as 1280,390; it is "0"'],
    [[board, '--out', out, '--widths', '390,'], '--widths must be whole numbers from 1, joined by commas, as 1280,390; it is "390,"'],
    [[board, '--out', out, '--widths', '390, 1280'], '--widths must be whole numbers from 1, joined by commas, as 1280,390; it is "390, 1280"'],
    [[board, '--out', out, '--widths', '12.5'], '--widths must be whole numbers from 1, joined by commas, as 1280,390; it is "12.5"'],
    [[board, '--out', out, '--widths', '99999999999999999999'], '--widths must be whole numbers from 1, joined by commas, as 1280,390; it is "99999999999999999999"'],
    [[board, '--out', out, '--widths', '390,390'], '--widths names 390 twice'],
    [[board, '--out', out, '--widths', '390', '--themes', 'sepia'], '--themes must be light, dark or both, joined by a comma; it is "sepia"'],
    [[board, '--out', out, '--widths', '390', '--themes', 'light,'], '--themes must be light, dark or both, joined by a comma; it is "light,"'],
    [[board, '--out', out, '--widths', '390', '--themes', 'dark,dark'], '--themes names dark twice'],
    [[board, '--out', out, '--widths', '390', '--allow-errors=yes'], '--allow-errors takes no value'],
    [[board, '--out', out, '--widths', '390', '--timeout', '0'], '--timeout must be a whole number of milliseconds from 1, as 30000; it is "0"'],
    [[board, '--out', out, '--widths', '390', '--timeout', '1.5'], '--timeout must be a whole number of milliseconds from 1, as 30000; it is "1.5"'],
    [[board, '--out', out, '--widths', '390', '--timeout', '2s'], '--timeout must be a whole number of milliseconds from 1, as 30000; it is "2s"'],
    [[board, '--out', out, '--widths', '390', '--timeout', '99999999999999999999'], '--timeout must be a whole number of milliseconds from 1, as 30000; it is "99999999999999999999"'],
    [[board, '--out', out, '--widths', '390', '--kit', 'grey'], 'unknown flag --kit'],
  ];
  for (const [args, message] of cases) {
    const r = run(...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.ok(r.stderr.startsWith(`${message}\n\nUsage: node scripts/shots.mjs`), r.stderr);
    assert.equal(r.stdout, '');
  }
  assert.ok(!existsSync(out), 'nothing is made');
});

test('the CLI exits 1 for an input it cannot read, for a Chrome that is not there, and when no Chrome is found', () => {
  const dir = fresh();
  const out = join(dir, 'shots');
  let r = run(join(dir, 'missing'), '--out', out, '--widths', '390');
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot read ${join(dir, 'missing')}: not found\n`]);
  r = run(board, '--out', out, '--widths', '390', '--chrome', join(dir, 'no chrome'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `no Chrome at ${join(dir, 'no chrome')}: the path given does not exist\n`]);
  r = spawnSync(process.execPath, ['--require', hiding, cli, board, '--out', out, '--widths', '390'], { encoding: 'utf8', env: { ...unset, SHOWN: '' }, timeout: 60_000 });
  assert.equal(r.status, 1, r.stderr);
  assert.ok(r.stderr.startsWith('no Chrome found: none of these exists:\n'), r.stderr);
  for (const path of CHROME_PATHS) assert.ok(r.stderr.includes(`  ${path}\n`), path);
  assert.ok(r.stderr.endsWith('give its path with --chrome <path>, or set UX_CHROME to it\n'), r.stderr);
  assert.ok(!existsSync(out), 'nothing is made');
});

test('the CLI closes the browser when it is refused part-way, and says so with exit 1', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  const out = join(dir, 'blocked');
  mkdirSync(join(out, 'B-390-light.png'), { recursive: true });
  const r = run(board, '--out', out, '--widths', '390', '--chrome', chrome.file);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${join(out, 'B-390-light.png')}: it is a folder, not a file\n`]);
  assert.ok(existsSync(join(out, 'A-390-light.png')));
  const pids = chrome.pids();
  assert.equal(pids.length, 1);
  assert.equal(await leftIn(pids[0]), 0, 'no process of that Chrome is left');
});

test('a Chrome that does not start is refused with exit 1, and nothing is left running', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const broken = join(dir, 'broken chrome.sh');
  const pids = join(dir, 'broken.pids');
  // It starts a child that would outlive it, then fails: the launch's whole process group must be gone.
  writeFileSync(broken, `#!/bin/sh\necho $$ >> '${pids}'\nsleep 30 </dev/null >/dev/null 2>&1 3>&- 4>&- &\necho "this is no browser" >&2\nexit 3\n`);
  chmodSync(broken, 0o755);
  const r = run(board, '--out', join(dir, 'shots'), '--widths', '390', '--chrome', broken);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, new RegExp(`^Chrome at ${broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} did not start: .+\n$`));
  assert.equal(r.stdout, '');
  const started = readFileSync(pids, 'utf8').trim().split('\n').map(Number);
  assert.equal(started.length, 1, 'it was started once');
  assert.equal(await leftIn(started[0]), 0, 'no process of that launch is left');
});

test('the CLI goes on past every page that once ended a run, says each, and exits 1', () => {
  const dir = fresh();
  const pages = strayPages(dir);
  const out = join(dir, 'shots');
  const r = run(dir, '--out', out, '--widths', '390');
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.stdout, `shot 2 pictures at 390 px, light, into ${out}\n`);
  assert.equal(r.stderr, [
    `error: ${pages.host}: file://fonts.example.invalid/x.css did not load: net::ERR_INVALID_URL\n`,
    `error: ${pages.meta}: the page sent itself to fine.html\n`,
    `error: ${pages.script}: the page sent itself to fine.html\n`,
  ].join(''));
  assert.deepEqual(readdirSync(out).sort(), ['fine-390-light.png', 'host-390-light.png']);
});

test('a report the page makes that cannot be read is an error of that page, and the run goes on', () => {
  const dir = fresh();
  const trapped = page(dir, 'a-trapped.html', '<img src="trap.png" alt="a picture that is not there">');
  page(dir, 'b-fine.html', '<p>Fine.</p>');
  // Why the trap did not load cannot be read: the report fails inside a listener, where no one could catch it.
  const out = join(dir, 'shots');
  const r = spawnSync(process.execPath, ['--require', faults, cli, dir, '--out', out, '--widths', '390'], { encoding: 'utf8', timeout: 60_000, env: { ...process.env, FAULT: 'report', FAULT_PAGE: 'trap.png' } });
  assert.equal(r.status, 1, r.stderr);
  // The failed request the listener could not record is not known as failed, so Chrome's own console line
  // about it is said too: the two reports the page made, each once.
  assert.equal(r.stderr, [
    `error: ${trapped}: console error: Failed to load resource: net::ERR_FILE_NOT_FOUND\n`,
    `error: ${trapped}: a report from the page could not be read: a listener fault\n`,
  ].join(''));
  assert.deepEqual(readdirSync(out).sort(), ['a-trapped-390-light.png', 'b-fine-390-light.png']);
});

test('--timeout limits how long a page is given: one error naming the page, soon', async () => {
  const server = await holding();
  try {
    const dir = fresh();
    const slow = page(dir, 'slow.html', '<p>Waits for its stylesheet.</p>', `<link rel="stylesheet" href="${server.at}/held.css">\n`);
    const started = Date.now();
    // Four pictures of the page: each opening given up after a millisecond is closed before it has landed,
    // the moment Chrome can hang in. A command that hangs is stopped, and fails.
    const r = await runFor([cli, slow, '--out', join(dir, 'shots'), '--widths', '1280,390', '--themes', 'light,dark', '--timeout', '1'], 30_000);
    assert.equal(r.status, 1, r.stderr);
    // One error names the page. On a loaded machine an opening given up this early may also not close in
    // time; its browser is then stopped, and that is said too, of the same page.
    const lines = r.stderr.trimEnd().split('\n');
    assert.equal(lines[0], `error: ${slow}: slow.html did not finish loading within 1 ms`);
    for (const line of lines.slice(1)) assert.equal(line, `error: ${slow}: the page would not close; its browser was stopped`);
    assert.ok(Date.now() - started < 30_000, `it took ${Date.now() - started} ms`);
  } finally {
    server.close();
  }
});

test('pages that send each other back and forth never hang a run: twelve runs, three at a time, each within 40 s, an error for each moving page, the good page pictured, nothing left', { skip: !UNIX && 'needs a shell script for Chrome', timeout: 180_000 }, async t => {
  // Each run: two pages that send each other back and forth (after 20 ms, or at once), and a good page.
  const once = async delay => {
    const dir = fresh();
    const chrome = countingChrome(dir);
    const send = to => (delay ? `<script>setTimeout(() => (location.href = "${to}"), ${delay})</script>` : `<script>location.href = "${to}"</script>`);
    const moving = [page(dir, 'a-there.html', send('b-back.html')), page(dir, 'b-back.html', send('a-there.html'))];
    page(dir, 'c-good.html', '<p>Good.</p>');
    const out = join(dir, 'shots');
    const started = Date.now();
    const r = await runFor([cli, dir, '--out', out, '--widths', '390', '--timeout', '700', '--chrome', chrome.file], 40_000);
    return { r, delay, took: Date.now() - started, moving, out, pids: chrome.pids() };
  };
  // Twelve runs, never more than three browsers at once: six sending after 20 ms, six at once.
  const delays = [20, 20, 20, 20, 20, 20, 0, 0, 0, 0, 0, 0];
  const runs = [];
  for (let i = 0; i < delays.length; i += 3) runs.push(...(await Promise.all(delays.slice(i, i + 3).map(once))));
  for (const { r, delay, took, moving, out, pids } of runs) {
    assert.equal(r.status, 1, `ended with ${r.status} after ${took} ms: ${r.stderr}`);
    const lines = r.stderr.trimEnd().split('\n');
    for (const file of moving) assert.ok(lines.some(line => line.startsWith(`error: ${file}: `)), `an error for ${file}: ${r.stderr}`);

    for (const line of lines) assert.ok(moving.some(file => line.startsWith(`error: ${file}: `)), `only the moving pages have errors: ${line}`);
    assert.equal(r.stdout, `shot 1 picture at 390 px, light, into ${out}\n`);
    assert.deepEqual(readdirSync(out), ['c-good-390-light.png']);
    assert.ok(pids.length >= 1);
    for (const pid of pids) assert.equal(await leftIn(pid), 0, `processes left from the Chrome started as ${pid}`);
  }
  // Pages that move every 20 ms open, and do not settle: they are said to keep moving. How each one reads
  // depends on the machine's load (a starved page may look settled, and fail its read instead), so this
  // is asked of the twelve together, not of each.
  const kept = runs.filter(run => run.delay).flatMap(run => run.r.stderr.split('\n')).filter(line => /: the page kept moving for 700 ms, last to (a-there|b-back)\.html$/.test(line));
  assert.ok(kept.length > 0, 'pages that never settle are said to keep moving');
  t.diagnostic(`12 runs; the longest took ${Math.max(...runs.map(run => run.took))} ms; ${kept.length} of 12 moving pages said to keep moving`);
});

test('a browser that dies while a page opens is an error of that page, and the run goes on in a fresh browser', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  page(dir, 'a-first.html', '<p>First.</p>');
  const crash = page(dir, 'b-crash.html', '<p>Its browser dies.</p>');
  page(dir, 'c-after.html', '<p>After.</p>');
  const out = join(dir, 'shots');
  const started = Date.now();
  const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '390', '--chrome', chrome.file], 30_000, { FAULT: 'crash', FAULT_PAGE: 'b-crash.html' });
  // A dead browser is not waited for: no page of it is closed, no move of it awaited.
  assert.ok(Date.now() - started < 4500, `it took ${Date.now() - started} ms`);
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.stderr, `error: ${crash}: its browser stopped while the page was open; the run went on in a fresh browser\n`);
  assert.deepEqual(readdirSync(out).sort(), ['a-first-390-light.png', 'c-after-390-light.png']);
  const pids = chrome.pids();
  assert.equal(pids.length, 2, 'a fresh browser was started');
  for (const pid of pids) assert.equal(await leftIn(pid), 0, `processes left from the Chrome started as ${pid}`);
});

test('a browser that dies between two pages, or between two widths, is replaced: no page is blamed for it', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  for (const name of ['a-first.html', 'b-next.html', 'c-last.html']) page(dir, name, `<p>${name}</p>`);
  const out = join(dir, 'shots');
  // The browser dies after the first page of each width, and after its last.
  const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '1280,390', '--chrome', chrome.file], 30_000, { FAULT: 'die-after', FAULT_PAGE: 'a-first.html,c-last.html' });
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.deepEqual(readdirSync(out).sort(), ['1280', '390'].flatMap(width => ['a-first', 'b-next', 'c-last'].map(name => `${name}-${width}-light.png`)).sort());
  const pids = chrome.pids();
  assert.equal(pids.length, 4, 'a fresh browser after each death but the last');
  for (const pid of pids) assert.equal(await leftIn(pid), 0, `processes left from the Chrome started as ${pid}`);
});

test('a page whose browser stops twice before it can be opened is an error of that page; its older picture is removed, and the run goes on', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  page(dir, 'a-first.html', '<p>First.</p>');
  const twice = page(dir, 'b-twice.html', '<p>Its browser stops twice.</p>');
  page(dir, 'c-after.html', '<p>After.</p>');
  const out = join(dir, 'shots');
  mkdirSync(out);
  writeFileSync(join(out, 'b-twice-390-light.png'), 'an older picture');
  // The browser stops as the second page is asked of it, and the fresh one as that page is asked again.
  const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '390', '--chrome', chrome.file], 30_000, { FAULT: 'dead-page', FAULT_AT: '2,3' });
  const pids = chrome.pids();
  const left = await leftOf(pids);
  assert.deepEqual([r.status, r.stderr], [1, `error: ${twice}: the browser stopped twice while opening this page\n`]);
  assert.equal(r.stdout, `shot 2 pictures at 390 px, light, into ${out}\n`);
  assert.deepEqual(readdirSync(out).sort(), ['a-first-390-light.png', 'c-after-390-light.png']);
  assert.equal(pids.length, 3, 'one browser, and a fresh one after each death');
  assert.equal(left, 0, 'no process of any of them is left');
});

test('a Chrome that stops each time a page, or a context, is asked of it ends the run: three browsers started, no more, and exit 1', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  for (const fault of ['dead-page', 'dead-context']) {
    const dir = fresh();
    const chrome = countingChrome(dir);
    for (const name of ['a-first.html', 'b-next.html', 'c-last.html']) page(dir, name, `<p>${name}</p>`);
    const out = join(dir, 'shots');
    const started = Date.now();
    const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '1280,390', '--chrome', chrome.file], 20_000, { FAULT: fault, FAULT_AT: 'all' });
    const took = Date.now() - started;
    const pids = chrome.pids();
    const left = await leftOf(pids);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `Chrome at ${chrome.file} keeps stopping: 3 browsers in a row were started, and none opened a page\n`], fault);
    assert.equal(pids.length, 3, `${fault}: it started ${pids.length} browsers`);
    assert.ok(took < 10_000, `${fault}: it took ${took} ms`);
    assert.deepEqual(readdirSync(out), [], fault);
    assert.equal(left, 0, 'no process of any of them is left');
  }
});

// Each of these waits CLOSE_MS, five seconds, for what never comes back, once or twice: they run three at a
// time, each with one browser at a time, the longest first.
describe('what never comes back is waited for no longer than its limit', { concurrency: 3 }, () => {
  test('a browser that will not close is stopped by its own handle, and the run ends even when stopping it never returns', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
    const dir = fresh();
    const chrome = countingChrome(dir);
    page(dir, 'only.html', '<p>Only.</p>');
    const out = join(dir, 'shots');
    const started = Date.now();
    // Its close never returns; stopping it by its handle stops it, and never returns either.
    const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '390', '--chrome', chrome.file], 40_000, { FAULT: 'stuck' });
    const took = Date.now() - started;
    const pids = chrome.pids();
    const left = await leftOf(pids);
    assert.deepEqual([r.status, r.stdout, r.stderr], [0, `shot 1 picture at 390 px, light, into ${out}\n`, '']);
    assert.deepEqual(readdirSync(out), ['only-390-light.png']);
    assert.ok(took < 20_000, `it took ${took} ms`);
    assert.equal(pids.length, 1);
    assert.equal(left, 0, 'the browser that would not close is gone');
  });

  test('a page whose close never returns is an error; its browser is stopped by its own handle, and the next page is pictured in a fresh one', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
    const dir = fresh();
    const chrome = countingChrome(dir);
    page(dir, 'a-first.html', '<p>First.</p>');
    const hang = page(dir, 'b-hang.html', '<p>Will not close.</p>');
    page(dir, 'c-after.html', '<p>After.</p>');
    const out = join(dir, 'shots');
    const started = Date.now();
    const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '390', '--chrome', chrome.file], 30_000, { FAULT: 'hang', FAULT_PAGE: 'b-hang.html' });
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.stderr, `error: ${hang}: the page would not close; its browser was stopped\n`);
    assert.deepEqual(readdirSync(out).sort(), ['a-first-390-light.png', 'b-hang-390-light.png', 'c-after-390-light.png']);
    assert.ok(Date.now() - started < 20_000, `it took ${Date.now() - started} ms`);
    const pids = chrome.pids();
    assert.equal(pids.length, 2, 'a fresh browser was started');
    for (const pid of pids) assert.equal(await leftIn(pid), 0, `processes left from the Chrome started as ${pid}`);
  });

  test('a page that is asked of the browser and never comes is an error of that page; its browser is stopped, and the run goes on in a fresh one', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
    const dir = fresh();
    const chrome = countingChrome(dir);
    page(dir, 'a-first.html', '<p>First.</p>');
    const never = page(dir, 'b-never.html', '<p>Never opened.</p>');
    page(dir, 'c-after.html', '<p>After.</p>');
    const out = join(dir, 'shots');
    mkdirSync(out);
    writeFileSync(join(out, 'b-never-390-light.png'), 'an older picture');
    const started = Date.now();
    const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '390', '--chrome', chrome.file], 30_000, { FAULT: 'no-page', FAULT_AT: '2' });
    const took = Date.now() - started;
    const pids = chrome.pids();
    const left = await leftOf(pids);
    assert.deepEqual([r.status, r.stderr], [1, `error: ${never}: no page could be opened for it (it gave no answer within 5000 ms); its browser was stopped\n`]);
    assert.deepEqual(readdirSync(out).sort(), ['a-first-390-light.png', 'c-after-390-light.png']);
    assert.ok(took < 20_000, `it took ${took} ms`);
    assert.equal(pids.length, 2, 'a fresh browser was started');
    assert.equal(left, 0, 'no process of either is left');
  });

  test('a browser that starts and never answers is a Chrome that did not start: refused with exit 1, and stopped', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
    const dir = fresh();
    const chrome = countingChrome(dir);
    page(dir, 'only.html', '<p>Only.</p>');
    const out = join(dir, 'shots');
    const started = Date.now();
    const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '390', '--chrome', chrome.file], 30_000, { FAULT: 'no-connect' });
    const took = Date.now() - started;
    const pids = chrome.pids();
    const left = await leftOf(pids);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `Chrome at ${chrome.file} did not start: it gave no answer within 5000 ms\n`]);
    assert.ok(took < 20_000, `it took ${took} ms`);
    assert.equal(pids.length, 1, 'it was started once');
    assert.equal(left, 0, 'the browser that never answered is gone');
  });

  test('a page that cannot be marked in time is an error of that page; nothing of it is waited for further, and the run goes on', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
    const dir = fresh();
    const chrome = countingChrome(dir);
    page(dir, 'a-first.html', '<p>First.</p>');
    const unmarked = page(dir, 'b-unmarked.html', '<p>Never marked.</p>');
    page(dir, 'c-after.html', '<p>After.</p>');
    const out = join(dir, 'shots');
    mkdirSync(out);
    writeFileSync(join(out, 'b-unmarked-390-light.png'), 'an older picture');
    const started = Date.now();
    const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '390', '--chrome', chrome.file], 30_000, { FAULT: 'no-mark', FAULT_AT: '2' });
    const took = Date.now() - started;
    const pids = chrome.pids();
    const left = await leftOf(pids);
    assert.deepEqual([r.status, r.stderr], [1, `error: ${unmarked}: the page did not open: it gave no answer within 5000 ms\n`]);
    assert.deepEqual(readdirSync(out).sort(), ['a-first-390-light.png', 'c-after-390-light.png']);
    assert.ok(took < 20_000, `it took ${took} ms`);
    assert.equal(pids.length, 1, 'its browser goes on');
    assert.equal(left, 0, 'no process of it is left');
  });

  test('a context that will not close: its browser is stopped, a fresh one goes on with the next width, and the run ends', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
    const dir = fresh();
    const chrome = countingChrome(dir);
    page(dir, 'only.html', '<p>Only.</p>');
    const out = join(dir, 'shots');
    const r = await runFor(['--require', faults, cli, dir, '--out', out, '--widths', '1280,390', '--chrome', chrome.file], 40_000, { FAULT: 'context' });
    assert.deepEqual([r.status, r.stderr], [0, '']);
    assert.deepEqual(readdirSync(out).sort(), ['only-1280-light.png', 'only-390-light.png']);
    const pids = chrome.pids();
    assert.equal(pids.length, 2, 'a fresh browser after the context that would not close');
    for (const pid of pids) assert.equal(await leftIn(pid), 0, `processes left from the Chrome started as ${pid}`);
  });
});

test('the CLI prints its usage for --help and exits 0', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  assert.ok(r.stdout.startsWith('Usage: node scripts/shots.mjs <file or folder>... --out <folder> --widths <w,w...>'), r.stdout);
  assert.match(r.stdout, /reduced motion/);
  // What a user could trip on, said where they look.
  assert.match(r.stdout, /A script error raised after the picture is taken is not seen\./);
  assert.doesNotMatch(r.stdout, /after the page has settled/);
  assert.match(r.stdout, /A page is judged once it has settled: 100 ms without moving\./);
  assert.match(r.stdout, /It is judged by its document, not by its\naddress: a picture is kept only if the document that was loaded is still the one in the tab once the\npicture is taken\./);
  assert.match(r.stdout, /A change of what follows the # of its address, or of its query through its\nhistory, keeps the document, and the page is pictured\./);
  assert.match(r.stdout, /a page that will not close, or a browser that dies, is an error of that\npage, and the run goes on in a fresh browser/);
  assert.match(r.stdout, /A browser that stops twice before a page can be opened in it is an error of that page; three browsers\nstarted in a row with no page opened end the run\./);
  assert.match(r.stdout, /--timeout <ms> +how long a page is given to load, to settle, and for each step on it, in\n +milliseconds; 30000 when not given/);
  assert.match(r.stdout, /A request Chrome cancels itself \(net::ERR_ABORTED, as a video may\) is reported as an error too\./);
  assert.equal(r.stderr, '');
});

test('no product name appears in the shots script or in finding Chrome', () => {
  for (const file of [cli, fileURLToPath(chromeModule)]) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\bVerbato\b/i, file);
    assert.doesNotMatch(text, /\bVersa\b/, file);
  }
});
