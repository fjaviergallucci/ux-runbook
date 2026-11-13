import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME_PATHS, ChromeError, findChrome } from '../scripts/lib/chrome.mjs';
import { renderProposal } from '../scripts/render.mjs';
import { ShotsError, shoot } from '../scripts/shots.mjs';

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

test('a page that only changes the part of its address after # stays its own page, and is pictured', async () => {
  const dir = fresh();
  // On a file page Chrome lets a script change nothing of the address but what follows the #.
  const replaced = page(dir, 'replaced.html', '<script>history.replaceState(null, "", "#state"); location.hash = "later"</script>\n<p>Still here.</p>');
  const result = await shoot([replaced], { out: join(dir, 'shots'), widths: [390] });
  assert.deepEqual([result.errors, result.files.map(file => basename(file))], [[], ['replaced-390-light.png']]);
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
  // Reading a file address fails in a way it never does, for the trap only: inside a listener.
  const fault = join(dir, 'fault.cjs');
  writeFileSync(fault, [
    "const url = require('node:url');",
    "const { syncBuiltinESMExports } = require('node:module');",
    'const toPath = url.fileURLToPath;',
    "url.fileURLToPath = (address, ...rest) => { if (String(address).endsWith('/trap.png')) throw new Error('a listener fault'); return toPath(address, ...rest); };",
    'syncBuiltinESMExports();',
  ].join('\n'));
  const out = join(dir, 'shots');
  const r = spawnSync(process.execPath, ['--require', fault, cli, dir, '--out', out, '--widths', '390'], { encoding: 'utf8', timeout: 60_000 });
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
    const r = await new Promise(resolve => {
      const child = spawn(process.execPath, [cli, slow, '--out', join(dir, 'shots'), '--widths', '1280,390', '--themes', 'light,dark', '--timeout', '1'], { cwd: root });
      let stdout = '';
      let stderr = '';
      const stop = setTimeout(() => child.kill('SIGKILL'), 30_000);
      child.stdout.on('data', chunk => (stdout += chunk));
      child.stderr.on('data', chunk => (stderr += chunk));
      child.on('close', status => {
        clearTimeout(stop);
        resolve({ status, stdout, stderr });
      });
    });
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.stderr, `error: ${slow}: slow.html did not finish loading within 1 ms\n`);
    assert.ok(Date.now() - started < 15_000, `it took ${Date.now() - started} ms`);
  } finally {
    server.close();
  }
});

test('the CLI prints its usage for --help and exits 0', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  assert.ok(r.stdout.startsWith('Usage: node scripts/shots.mjs <file or folder>... --out <folder> --widths <w,w...>'), r.stdout);
  assert.match(r.stdout, /reduced motion/);
  // What a user could trip on, said where they look.
  assert.match(r.stdout, /A script error, or a move to another page, raised after the picture is taken is not seen\./);
  assert.match(r.stdout, /--timeout <ms> +how long a page is given to load, in milliseconds; 30000 when not given/);
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
