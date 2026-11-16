import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { AcceptError, INPAGE, TYPES, acceptPrototype, joinResults, reportOf, validateAcceptance, validateResults } from '../scripts/accept.mjs';
import { contextOptions } from '../scripts/lib/browser.mjs';
import { findChrome } from '../scripts/lib/chrome.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'accept.mjs');
const prototype = join(here, 'fixtures', 'prototype');
const acceptanceFile = join(here, 'fixtures', 'acceptance.json');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'accept-'));
after(() => rmSync(root, { recursive: true, force: true }));
const UNIX = process.platform !== 'win32';

// ---- what the tests are made of

const fixture = () => JSON.parse(readFileSync(acceptanceFile, 'utf8'));
let made = 0;
const fresh = (name = `run ${++made}`) => {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  return dir;
};
// A prototype folder: the fixture's pages and kit, and pages of the test's own, each as a whole page.
const prototypeIn = (dir, pages = {}) => {
  cpSync(prototype, dir, { recursive: true });
  for (const [name, body] of Object.entries(pages)) writeFileSync(join(dir, name), whole(body));
  return dir;
};
const whole = (body, head = '') => `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>A page</title>\n<link rel="stylesheet" href="kit.css">\n${head}</head>\n<body>\n${body}\n</body>\n</html>\n`;
// A check on the fixture's default page at 390, with the fields given.
const check = fields => ({ criterion: 'A criterion she cares about.', state: 'default', page: 'today-default-en.html', width: 390, ...fields });
const byId = results => Object.fromEntries(results.map(result => [result.id, result]));

// A command of this run, given at most `ms` to end: stopped through its own handle when it does not.
const runFor = (args, ms = 60_000, env = {}) =>
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
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: root, timeout: 60_000 });
const writeJson = (dir, name, data) => {
  const file = join(dir, name);
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
};

// A Chrome that writes its process id to a file and then becomes the real one. Playwright starts it as the
// leader of a process group of its own, so every process the launch started carries that id as its group.
const countingChrome = dir => {
  const file = join(dir, 'counting chrome.sh');
  const pids = join(dir, 'chrome.pids');
  writeFileSync(file, `#!/bin/sh\necho $$ >> '${pids}'\nexec '${findChrome()}' "$@"\n`);
  chmodSync(file, 0o755);
  return { file, pids: () => (existsSync(pids) ? readFileSync(pids, 'utf8').trim().split('\n').map(Number) : []) };
};
// The processes of one group still running; a zombie has ended.
const inGroup = pgid =>
  spawnSync('ps', ['-A', '-o', 'pgid=,stat='], { encoding: 'utf8' })
    .stdout.split('\n')
    .map(line => line.trim().split(/\s+/))
    .filter(([group, state]) => Number(group) === pgid && !state.startsWith('Z')).length;
// The processes left in each group a run started, once each has had three seconds to wind down; whatever is
// left is stopped, by its group, so a failing test leaves no browser behind either.
const leftOf = async pids => {
  let left = 0;
  for (const pgid of pids) {
    for (let i = 0; i < 30 && inGroup(pgid) > 0; i++) await sleep(100);
    const still = inGroup(pgid);
    left += still;
    // Only a group that still has a process of its own: an emptied group's id may have been given again.
    if (still > 0) {
      try {
        process.kill(-pgid, 'SIGKILL');
      } catch {}
    }
  }
  return left;
};

// A preload that writes down each context and each page the command opens, through Playwright's own
// objects: "context <width> <theme>" and "page <file> <width> <theme>".
const counting = join(root, 'count-openings.cjs');
writeFileSync(counting, [
  "const { chromium } = require('playwright-core');",
  "const fs = require('node:fs');",
  'const log = line => fs.appendFileSync(process.env.OPENINGS_LOG, line + "\\n");',
  'const connect = chromium.connect.bind(chromium);',
  'chromium.connect = async (...args) => {',
  '  const browser = await connect(...args);',
  '  const newContext = browser.newContext.bind(browser);',
  '  browser.newContext = async options => {',
  '    const at = `${options.viewport.width} ${options.colorScheme}`;',
  '    log(`context ${at}`);',
  '    const context = await newContext(options);',
  '    const newPage = context.newPage.bind(context);',
  '    context.newPage = async (...a) => {',
  '      const page = await newPage(...a);',
  '      const goto = page.goto.bind(page);',
  "      page.goto = (url, ...b) => { log(`page ${decodeURIComponent(url.split('/').pop())} ${at}`); return goto(url, ...b); };",
  '      return page;',
  '    };',
  '    return context;',
  '  };',
  '  return browser;',
  '};',
].join('\n'));

// ---- the brief's seven

test('the fixture run returns eight results, all pass: true, in the order of the file, each with its criterion, state, page, width and theme', () => {
  const dir = fresh();
  const out = join(dir, 'results.json');
  const r = run('prototype', acceptanceFile, '--root', prototype, '--out', out);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
  assert.equal(r.stdout, `8 checks: 0 failed, 8 passed; results in ${out}\n`);
  const results = JSON.parse(readFileSync(out, 'utf8'));
  const checks = fixture().checks;
  assert.equal(results.length, 8);
  assert.deepEqual(results.map(result => result.id), checks.map(c => c.id));
  for (const [i, result] of results.entries()) {
    const c = checks[i];
    assert.deepEqual(Object.keys(result), ['id', 'pass', 'actual', 'message', 'criterion', 'state', 'page', 'width', 'theme'], c.id);
    assert.equal(result.pass, true, `${c.id}: ${result.message}`);
    assert.equal(result.message, '', c.id);
    assert.deepEqual([result.criterion, result.state, result.page, result.width, result.theme], [c.criterion, c.state, c.page, c.width, c.theme ?? 'light'], c.id);
  }
  const found = byId(results);
  assert.equal(found['count-in-spanish'].actual, '2 salas libres');
  assert.deepEqual(found['count-then-list-then-book'].actual, ['free-count', 'room-list', 'book-action']);
  assert.equal(found['two-free-rooms-listed'].actual, 2);
  assert.equal(found['no-booking-when-full'].actual, 0);
  assert.equal(found['list-contrast-dark'].theme, 'dark');
  // The grey kit's muted grey on its dark surface, #a6a6a6 on #1c1c1c: 7.0007 (the board change's R197 moved the kit's greys).
  assert.ok(found['list-contrast-dark'].actual >= 7 && found['list-contrast-dark'].actual < 7.1, `the muted grey on the dark surface: ${found['list-contrast-dark'].actual}`);
  const size = found['book-target-size'].actual;
  assert.ok(size.width >= 44 && size.height === 44, JSON.stringify(size));
});

test('a check whose target does not exist returns pass: false with "not found", and the run continues', async () => {
  const checks = fixture().checks;
  checks.splice(3, 0, check({ id: 'gone', type: 'visible', target: 'next-free-time' }));
  const { results } = await acceptPrototype({ design: 'today', checks }, { root: prototype });
  assert.equal(results.length, 9);
  assert.equal(results[3].id, 'gone');
  assert.equal(results[3].pass, false);
  assert.match(results[3].message, /not found/);
  assert.equal(results[3].message, 'data-ux="next-free-time" not found');
  assert.equal(results[3].actual, null);
  assert.deepEqual(results.filter(result => !result.pass).map(result => result.id), ['gone'], 'every other check passes');
});

test('a page holding the same data-ux twice makes visible fail with "found 2"', async () => {
  const dir = prototypeIn(fresh(), { 'twice.html': '<p data-ux="free-count">2 rooms free</p>\n<p data-ux="free-count">2 rooms free</p>' });
  const checks = [check({ id: 'twice', page: 'twice.html', type: 'visible', target: 'free-count' }), ...fixture().checks];
  const { results } = await acceptPrototype({ design: 'today', checks }, { root: dir });
  assert.equal(results[0].pass, false);
  assert.match(results[0].message, /found 2/);
  assert.equal(results[0].message, 'data-ux="free-count" found 2 times; it must be on exactly one element');
  assert.ok(results.slice(1).every(result => result.pass), 'the run goes on');
});

test('an unknown type returns pass: false with "unknown check type"', async () => {
  const checks = [check({ id: 'colour', type: 'colour', target: 'free-count', colour: 'grey' }), ...fixture().checks];
  assert.deepEqual(validateAcceptance({ design: 'today', checks }), [], 'an unknown type is no shape error');
  const { results } = await acceptPrototype({ design: 'today', checks }, { root: prototype });
  assert.deepEqual(results[0], { id: 'colour', pass: false, actual: null, message: 'unknown check type "colour"', criterion: 'A criterion she cares about.', state: 'default', page: 'today-default-en.html', width: 390, theme: 'light' });
  assert.ok(results.slice(1).every(result => result.pass));
});

test('contrast with min 21 on grey text fails, and reports the measured ratio in actual', async () => {
  const checks = [
    check({ id: 'grey-list', type: 'contrast', target: 'room-list', min: 21 }),
    check({ id: 'grey-action', type: 'contrast', target: 'book-action', min: 21 }),
  ];
  const { results } = await acceptPrototype({ design: 'today', checks }, { root: prototype });
  // The grey kit's own colours, as R197 of the board change left them: its muted grey #636363 on #ffffff is 6.008,
  // and #ffffff on its accent #3b5bdb is 5.668. Each is shown to two decimals, never rounded up past what was
  // measured: 5.66, not 5.67.
  assert.deepEqual(results.map(({ id, pass, actual, message }) => ({ id, pass, actual, message })), [
    { id: 'grey-list', pass: false, actual: 6, message: 'the contrast is 6, less than 21' },
    { id: 'grey-action', pass: false, actual: 5.66, message: 'the contrast is 5.66, less than 21' },
  ]);
});

test('--root, --out and the acceptance file each in a folder whose name holds a space: the run works', () => {
  const dir = fresh('two words');
  const spaced = prototypeIn(join(dir, 'the prototype'));
  // A page whose own name holds a space, in a folder whose name holds one.
  mkdirSync(join(spaced, 'by state'));
  cpSync(join(prototype, 'today-default-en.html'), join(spaced, 'by state', 'today default.html'));
  cpSync(join(prototype, 'kit.css'), join(spaced, 'by state', 'kit.css'));
  const data = fixture();
  data.checks.push(check({ id: 'spaced-page', page: 'by state/today default.html', type: 'text', target: 'free-count', equals: '2 rooms free' }));
  const file = writeJson(dir, 'the checks.json', data);
  const out = join(dir, 'the results', 'results.json');
  const r = run('prototype', file, '--root', spaced, '--out', out);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `9 checks: 0 failed, 9 passed; results in ${out}\n`);
  assert.ok(JSON.parse(readFileSync(out, 'utf8')).every(result => result.pass));
});

test('report lists failed checks first, prints the criterion beside each, and opens with the counts', () => {
  const dir = fresh();
  const results = [
    { id: 'a-passes', pass: true, actual: 2, message: '', criterion: 'Both free rooms are listed.', state: 'default', page: 'today-default-en.html', width: 1280, theme: 'light' },
    { id: 'b-fails', pass: false, actual: 7, message: 'the contrast is 7, less than 21', criterion: 'The list reads at 21.', state: 'default', page: 'today-default-en.html', width: 390, theme: 'light' },
    { id: 'c-passes', pass: true, actual: '2 salas libres', message: '', criterion: 'The count reads in Spanish.', state: 'default', page: 'today-default-es.html', width: 390, theme: 'light' },
    { id: 'd-fails', pass: false, actual: null, message: 'data-ux="next-free-time" not found', criterion: 'The next free time |\nis shown.', state: 'empty', page: 'today-empty-en.html', width: 390, theme: 'dark' },
  ];
  const file = writeJson(dir, 'results.json', results);
  const out = join(dir, 'the report', 'ACCEPTANCE-RESULTS.md');
  const r = run('report', file, '--out', out);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `4 checks: 2 failed, 2 passed; report in ${out}\n`);
  assert.equal(readFileSync(out, 'utf8'), [
    '4 checks: 2 failed, 2 passed.',
    '',
    '| Result | Check | Criterion | State | Page | Width | Theme | Actual | Message |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    '| FAIL | b-fails | The list reads at 21. | default | today-default-en.html | 390 | light | 7 | the contrast is 7, less than 21 |',
    '| FAIL | d-fails | The next free time \\| is shown. | empty | today-empty-en.html | 390 | dark |  | data-ux="next-free-time" not found |',
    '| pass | a-passes | Both free rooms are listed. | default | today-default-en.html | 1280 | light | 2 |  |',
    '| pass | c-passes | The count reads in Spanish. | default | today-default-es.html | 390 | light | "2 salas libres" |  |',
    '',
  ].join('\n'));
});

// ---- the shape of an acceptance file, checked before any browser

test('the fixture is a valid acceptance file; so is every type with exactly the keys it takes', () => {
  assert.deepEqual(validateAcceptance(fixture()), []);
  const checks = [
    check({ id: 'a', type: 'visible', target: 'x', theme: 'light', language: 'en', screen: 'today' }),
    check({ id: 'b', type: 'absent', target: 'x' }),
    check({ id: 'c', type: 'text', target: 'x', equals: '' }),
    check({ id: 'd', type: 'text', target: 'x', matches: '^\\d+ rooms? free$' }),
    check({ id: 'e', type: 'order', targets: ['x', 'y'] }),
    check({ id: 'f', type: 'in-viewport', target: 'x', theme: 'dark' }),
    check({ id: 'g', type: 'min-size', target: 'x', minWidth: 44, minHeight: 43.5 }),
    check({ id: 'h', type: 'contrast', target: 'x', min: 1 }),
    check({ id: 'i', type: 'contrast', target: 'x', min: 21 }),
    check({ id: 'j', type: 'count', target: 'x', equals: 0 }),
    check({ id: 'k', type: 'a type of tomorrow', target: 'x', anything: ['it', 'likes'] }),
    check({ id: 'm', type: 'style', target: 'x', property: 'font-size', equals: '16px' }),
    check({ id: 'n', type: 'style', target: 'x', property: '--gap-Wide', equals: '1rem' }),
    check({ id: 'o', type: 'style', target: 'x', property: '-webkit-line-clamp', equals: '2' }),
    check({ id: 'p', type: 'gap', targets: ['x', 'y'], axis: 'y', equals: 16 }),
    check({ id: 'q', type: 'gap', targets: ['x', 'y'], axis: 'x', equals: 0 }),
    check({ id: 'r', type: 'gap', targets: ['x', 'y'], axis: 'x', equals: -4.5 }),
    check({ id: 'l', type: 'visible', target: 'x', page: 'states/two words/día.html' }),
  ];
  assert.deepEqual(validateAcceptance({ design: 'today', checks }), []);
});

test('a malformed acceptance file is refused, every fault named by its path', () => {
  const ok = check({ id: 'ok', type: 'visible', target: 'free-count' });
  const one = (fields, without = []) => {
    const c = { ...ok, ...fields };
    for (const key of without) delete c[key];
    return { design: 'today', checks: [c] };
  };
  const cases = [
    [null, ['$: must be an object']],
    [[], ['$: must be an object']],
    ['today', ['$: must be an object']],
    [{ checks: [ok] }, ['$.design: must be a non-empty string']],
    [{ design: '', checks: [ok] }, ['$.design: must be a non-empty string']],
    [{ design: 7, checks: [ok] }, ['$.design: must be a non-empty string']],
    [{ design: 'today' }, ['$.checks: must be a list of at least one check']],
    [{ design: 'today', checks: [] }, ['$.checks: must be a list of at least one check']],
    [{ design: 'today', checks: ok }, ['$.checks: must be a list of at least one check']],
    [{ design: 'today', checks: [ok], colour: 'grey' }, ['$.colour: unknown key']],
    [{ design: 'today', checks: [ok, null, 'x', []] }, ['$.checks[1]: must be an object', '$.checks[2]: must be an object', '$.checks[3]: must be an object']],
    [one({}, ['id']), ['$.checks[0].id: must be a non-empty string']],
    [one({ id: '' }), ['$.checks[0].id: must be a non-empty string']],
    [one({ id: 3 }), ['$.checks[0].id: must be a non-empty string']],
    [{ design: 'today', checks: [ok, { ...ok, id: 'other' }, { ...ok }] }, ['$.checks[2].id: "ok" is also the id of $.checks[0]']],
    [one({}, ['criterion']), ['$.checks[0].criterion: must be a non-empty string']],
    [one({ criterion: ' ' }), ['$.checks[0].criterion: must be a non-empty string']],
    [one({}, ['state']), ['$.checks[0].state: must be a non-empty string']],
    [one({ state: '' }), ['$.checks[0].state: must be a non-empty string']],
    [one({}, ['page']), ['$.checks[0].page: must be a non-empty string']],
    [one({ page: '' }), ['$.checks[0].page: must be a non-empty string']],
    [one({ page: '/today.html' }), ['$.checks[0].page: must be a relative path; it is "/today.html"']],
    [one({ page: 'C:/today.html' }), ['$.checks[0].page: must be a relative path; it is "C:/today.html"']],
    [one({ page: 'file:today.html' }), ['$.checks[0].page: must be a relative path; it is "file:today.html"']],
    [one({ page: 'today.html#empty' }), ['$.checks[0].page: must hold no #, ?, % or backslash; it is "today.html#empty"']],
    [one({ page: 'today.html?state=empty' }), ['$.checks[0].page: must hold no #, ?, % or backslash; it is "today.html?state=empty"']],
    [one({ page: 'today%20empty.html' }), ['$.checks[0].page: must hold no #, ?, % or backslash; it is "today%20empty.html"']],
    [one({ page: 'states\\today.html' }), ['$.checks[0].page: must hold no #, ?, % or backslash; it is "states\\\\today.html"']],
    [one({ page: '../today.html' }), ['$.checks[0].page: must stay inside the prototype folder; it is "../today.html"']],
    [one({ page: 'states/../../today.html' }), ['$.checks[0].page: must stay inside the prototype folder; it is "states/../../today.html"']],
    [one({ page: 'states/../..' }), ['$.checks[0].page: must stay inside the prototype folder; it is "states/../.."']],
    [one({}, ['width']), ['$.checks[0].width: must be a whole number of CSS pixels from 1']],
    [one({ width: 0 }), ['$.checks[0].width: must be a whole number of CSS pixels from 1']],
    [one({ width: -390 }), ['$.checks[0].width: must be a whole number of CSS pixels from 1']],
    [one({ width: 390.5 }), ['$.checks[0].width: must be a whole number of CSS pixels from 1']],
    [one({ width: '390' }), ['$.checks[0].width: must be a whole number of CSS pixels from 1']],
    [one({ theme: 'sepia' }), ['$.checks[0].theme: must be light or dark']],
    [one({ theme: 'Light' }), ['$.checks[0].theme: must be light or dark']],
    [one({ theme: null }), ['$.checks[0].theme: must be light or dark']],
    [one({ language: '' }), ['$.checks[0].language: must be a non-empty string']],
    [one({ screen: 7 }), ['$.checks[0].screen: must be a non-empty string']],
    [one({}, ['type']), ['$.checks[0].type: must be a non-empty string']],
    [one({ type: '' }), ['$.checks[0].type: must be a non-empty string']],
    [one({ type: ['visible'] }), ['$.checks[0].type: must be a non-empty string']],
    [one({}, ['target']), ['$.checks[0].target: must be a non-empty string']],
    [one({ target: '' }), ['$.checks[0].target: must be a non-empty string']],
    [one({ target: ['free-count'] }), ['$.checks[0].target: must be a non-empty string']],
    [one({ colour: 'grey' }), ['$.checks[0].colour: unknown key for type visible']],
    [one({ 'two words': 1 }), ['$.checks[0]["two words"]: unknown key for type visible']],
    [one({ equals: 'x' }), ['$.checks[0].equals: unknown key for type visible']],
    [one({ targets: ['a', 'b'] }), ['$.checks[0].targets: unknown key for type visible']],
    [one({ type: 'absent', min: 3 }), ['$.checks[0].min: unknown key for type absent']],
    [one({ type: 'in-viewport', minWidth: 3 }), ['$.checks[0].minWidth: unknown key for type in-viewport']],
    // order names its ids in targets: a list of two or more, each once.
    [one({ type: 'order', targets: ['a', 'b'] }), ['$.checks[0].target: unknown key for type order']],
    [one({ type: 'order' }, ['target']), ['$.checks[0].targets: must be a list of at least two ids']],
    [one({ type: 'order', targets: ['a'] }, ['target']), ['$.checks[0].targets: must be a list of at least two ids']],
    [one({ type: 'order', targets: 'a,b' }, ['target']), ['$.checks[0].targets: must be a list of at least two ids']],
    [one({ type: 'order', targets: ['a', ''] }, ['target']), ['$.checks[0].targets[1]: must be a non-empty string']],
    [one({ type: 'order', targets: ['a', 7, 'b'] }, ['target']), ['$.checks[0].targets[1]: must be a non-empty string']],
    [one({ type: 'order', targets: ['a', 'b', 'a'] }, ['target']), ['$.checks[0].targets[2]: "a" is named twice']],
    // text takes exactly one of equals and matches.
    [one({ type: 'text' }), ['$.checks[0]: a text check takes exactly one of equals and matches']],
    [one({ type: 'text', equals: 'a', matches: 'a' }), ['$.checks[0]: a text check takes exactly one of equals and matches']],
    [one({ type: 'text', equals: 2 }), ['$.checks[0].equals: must be a string']],
    [one({ type: 'text', equals: null }), ['$.checks[0].equals: must be a string']],
    [one({ type: 'text', matches: '' }), ['$.checks[0].matches: must be a non-empty string']],
    [one({ type: 'text', matches: /rooms/ }), ['$.checks[0].matches: must be a non-empty string']],
    [one({ type: 'text', matches: '(rooms' }), ['$.checks[0].matches: is not a regular expression (Unterminated group)']],
    [one({ type: 'text', equals: 'a', min: 3 }), ['$.checks[0].min: unknown key for type text']],
    // min-size takes minWidth and minHeight, which are not the check's own width.
    [one({ type: 'min-size', minHeight: 44 }), ['$.checks[0].minWidth: must be a number above 0']],
    [one({ type: 'min-size', minWidth: 44 }), ['$.checks[0].minHeight: must be a number above 0']],
    [one({ type: 'min-size', minWidth: 0, minHeight: 44 }), ['$.checks[0].minWidth: must be a number above 0']],
    [one({ type: 'min-size', minWidth: 44, minHeight: -1 }), ['$.checks[0].minHeight: must be a number above 0']],
    [one({ type: 'min-size', minWidth: '44', minHeight: 44 }), ['$.checks[0].minWidth: must be a number above 0']],
    [one({ type: 'min-size', minWidth: Infinity, minHeight: 44 }), ['$.checks[0].minWidth: must be a number above 0']],
    [one({ type: 'min-size', minWidth: 44, minHeight: NaN }), ['$.checks[0].minHeight: must be a number above 0']],
    [one({ type: 'min-size', minWidth: 44, minHeight: 44, height: 44 }), ['$.checks[0].height: unknown key for type min-size']],
    // contrast takes a ratio from 1 to 21.
    [one({ type: 'contrast' }), ['$.checks[0].min: must be a number from 1 to 21']],
    [one({ type: 'contrast', min: 0.5 }), ['$.checks[0].min: must be a number from 1 to 21']],
    [one({ type: 'contrast', min: 21.5 }), ['$.checks[0].min: must be a number from 1 to 21']],
    [one({ type: 'contrast', min: '4.5' }), ['$.checks[0].min: must be a number from 1 to 21']],
    // count takes a whole number from 0.
    [one({ type: 'count' }), ['$.checks[0].equals: must be a whole number from 0']],
    [one({ type: 'count', equals: -1 }), ['$.checks[0].equals: must be a whole number from 0']],
    [one({ type: 'count', equals: 1.5 }), ['$.checks[0].equals: must be a whole number from 0']],
    [one({ type: 'count', equals: '2' }), ['$.checks[0].equals: must be a whole number from 0']],
    // style takes one property, by its CSS name, and the value as the browser gives it.
    [one({ type: 'style' }), ['$.checks[0].property: must be a CSS property name, as font-size', '$.checks[0].equals: must be a non-empty string']],
    [one({ type: 'style', property: 'fontSize', equals: '16px' }), ['$.checks[0].property: must be a CSS property name, as font-size']],
    [one({ type: 'style', property: 'font size', equals: '16px' }), ['$.checks[0].property: must be a CSS property name, as font-size']],
    [one({ type: 'style', property: ['font-size'], equals: '16px' }), ['$.checks[0].property: must be a CSS property name, as font-size']],
    [one({ type: 'style', property: 'font-size', equals: 16 }), ['$.checks[0].equals: must be a non-empty string']],
    [one({ type: 'style', property: 'font-size', equals: ' ' }), ['$.checks[0].equals: must be a non-empty string']],
    [one({ type: 'style', property: 'font-size', equals: '16px', min: 16 }), ['$.checks[0].min: unknown key for type style']],
    [one({ type: 'style', property: 'font-size', equals: '16px' }, ['target']), ['$.checks[0].target: must be a non-empty string']],
    // gap names its two ids in targets, an axis, and a number of CSS pixels.
    [one({ type: 'gap', targets: ['a', 'b'], axis: 'y', equals: 16 }), ['$.checks[0].target: unknown key for type gap']],
    [one({ type: 'gap', axis: 'y', equals: 16 }, ['target']), ['$.checks[0].targets: must be a list of exactly two ids']],
    [one({ type: 'gap', targets: ['a'], axis: 'y', equals: 16 }, ['target']), ['$.checks[0].targets: must be a list of exactly two ids']],
    [one({ type: 'gap', targets: ['a', 'b', 'c'], axis: 'y', equals: 16 }, ['target']), ['$.checks[0].targets: must be a list of exactly two ids']],
    [one({ type: 'gap', targets: ['a', 'a'], axis: 'y', equals: 16 }, ['target']), ['$.checks[0].targets[1]: "a" is named twice']],
    [one({ type: 'gap', targets: ['a', ''], axis: 'y', equals: 16 }, ['target']), ['$.checks[0].targets[1]: must be a non-empty string']],
    [one({ type: 'gap', targets: ['a', 'b'], equals: 16 }, ['target']), ['$.checks[0].axis: must be x or y']],
    [one({ type: 'gap', targets: ['a', 'b'], axis: 'down', equals: 16 }, ['target']), ['$.checks[0].axis: must be x or y']],
    [one({ type: 'gap', targets: ['a', 'b'], axis: 'y' }, ['target']), ['$.checks[0].equals: must be a number of CSS pixels']],
    [one({ type: 'gap', targets: ['a', 'b'], axis: 'y', equals: '16px' }, ['target']), ['$.checks[0].equals: must be a number of CSS pixels']],
    [one({ type: 'gap', targets: ['a', 'b'], axis: 'y', equals: Infinity }, ['target']), ['$.checks[0].equals: must be a number of CSS pixels']],
    [one({ type: 'gap', targets: ['a', 'b'], axis: 'y', equals: 16, min: 12 }, ['target']), ['$.checks[0].min: unknown key for type gap']],
    // A type it does not know still needs what every check needs.
    [one({ type: 'colour' }, ['state', 'width']), ['$.checks[0].state: must be a non-empty string', '$.checks[0].width: must be a whole number of CSS pixels from 1']],
  ];
  for (const [data, errors] of cases) assert.deepEqual(validateAcceptance(data), errors, JSON.stringify(data));
});

// ---- the command line

test('an invalid acceptance file is refused with exit 1 before Chrome starts: every fault printed, nothing written', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  const data = fixture();
  data.checks[1].width = 0;
  data.checks[4].page = '../today.html';
  const file = writeJson(dir, 'acceptance.json', data);
  const out = join(dir, 'not made', 'results.json');
  const r = await runFor([cli, 'prototype', file, '--root', prototype, '--out', out, '--chrome', chrome.file]);
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.equal(r.stderr, `${file} is not a valid acceptance file:\n  $.checks[1].width: must be a whole number of CSS pixels from 1\n  $.checks[4].page: must stay inside the prototype folder; it is "../today.html"\n`);
  assert.deepEqual(chrome.pids(), [], 'Chrome was never started');
  assert.ok(!existsSync(join(dir, 'not made')), 'nothing is made');
});

test('what else is refused with exit 1 before Chrome starts: an unreadable acceptance file, a root that is no folder, an out that cannot be written', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  const notJson = join(dir, 'not json.json');
  writeFileSync(notJson, '{ "design": ');
  const aFile = join(dir, 'a file');
  writeFileSync(aFile, 'x');
  // In a folder not made yet: a refusal makes nothing.
  const out = join(dir, 'not made', 'results.json');
  const cases = [
    [[join(dir, 'missing.json'), '--root', prototype, '--out', out], `cannot read ${join(dir, 'missing.json')}: not found\n`],
    [[notJson, '--root', prototype, '--out', out], new RegExp(`^cannot read ${notJson}: it is not JSON \\(`)],
    [[acceptanceFile, '--root', join(dir, 'no prototype'), '--out', out], `cannot read ${join(dir, 'no prototype')}: not found\n`],
    [[acceptanceFile, '--root', aFile, '--out', out], `cannot read ${aFile}: it is a file, not a folder\n`],
    [[acceptanceFile, '--root', prototype, '--out', join(aFile, 'results.json')], `cannot write ${join(aFile, 'results.json')}: part of the path is a file, not a folder\n`],
    [[acceptanceFile, '--root', prototype, '--out', dir], `cannot write ${dir}: it is a folder, not a file\n`],
  ];
  for (const [args, stderr] of cases) {
    const r = await runFor([cli, 'prototype', ...args, '--chrome', chrome.file]);
    assert.equal(r.status, 1, r.stderr);
    assert.equal(r.stdout, '');
    if (stderr instanceof RegExp) assert.match(r.stderr, stderr);
    else assert.equal(r.stderr, stderr);
  }
  assert.deepEqual(chrome.pids(), [], 'Chrome was never started');
  assert.ok(!existsSync(join(dir, 'not made')), 'nothing is made');
});

test('prototype exits 1 when any check failed: each failure printed, the results still written in full; and no browser of the run is left', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  const data = fixture();
  data.checks.push(check({ id: 'gone', type: 'visible', target: 'next-free-time' }), check({ id: 'grey', type: 'contrast', target: 'room-list', min: 21 }));
  const file = writeJson(dir, 'acceptance.json', data);
  const out = join(dir, 'results.json');
  const r = await runFor([cli, 'prototype', file, '--root', prototype, '--out', out, '--chrome', chrome.file]);
  const left = await leftOf(chrome.pids());
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.stdout, `10 checks: 2 failed, 8 passed; results in ${out}\n`);
  assert.equal(r.stderr, 'failed: gone: data-ux="next-free-time" not found\nfailed: grey: the contrast is 6, less than 21\n');
  assert.equal(JSON.parse(readFileSync(out, 'utf8')).length, 10);
  assert.equal(chrome.pids().length, 1, 'one browser for the run');
  assert.equal(left, 0, 'no process of it is left');
});

test('each page is opened once for each width and theme its checks name, in one context for each width and theme; reduced motion, 900 px high, scale 1', () => {
  const dir = fresh();
  const env = 'document.querySelector("[data-ux=env]").textContent = `${innerWidth}x${innerHeight}@${devicePixelRatio} ${matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"} ${matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "motion"}`';
  prototypeIn(dir, { 'env.html': `<p data-ux="env"></p>\n<script>${env}</script>` });
  const data = fixture();
  data.checks.push(
    check({ id: 'env-390', page: 'env.html', type: 'text', target: 'env', equals: '390x900@1 light reduce' }),
    check({ id: 'env-1280-dark', page: 'env.html', width: 1280, theme: 'dark', type: 'text', target: 'env', equals: '1280x900@1 dark reduce' }),
    check({ id: 'env-1280-light', page: 'env.html', width: 1280, theme: 'light', type: 'text', target: 'env', equals: '1280x900@1 light reduce' }),
  );
  const file = writeJson(dir, 'acceptance.json', data);
  const log = join(dir, 'openings.log');
  const out = join(dir, 'results.json');
  const r = spawnSync(process.execPath, ['--require', counting, cli, 'prototype', file, '--root', dir, '--out', out], { encoding: 'utf8', timeout: 60_000, env: { ...process.env, OPENINGS_LOG: log } });
  assert.equal(r.status, 0, r.stderr);
  const openings = readFileSync(log, 'utf8').trim().split('\n');
  // Grouped by width and theme in the order they first appear, each page once in each.
  assert.deepEqual(openings, [
    'context 390 light',
    'page today-empty-en.html 390 light',
    'page today-default-es.html 390 light',
    'page today-default-en.html 390 light',
    'page env.html 390 light',
    'context 1280 light',
    'page today-default-en.html 1280 light',
    'page env.html 1280 light',
    'context 1280 dark',
    'page today-default-en.html 1280 dark',
    'page env.html 1280 dark',
  ]);
});

test('a page that is not there, or is not a file, fails every check of its group, saying which, and is never opened; a page that leaves fails its group; the other groups run', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = prototypeIn(fresh(), { 'leaves.html': '<p data-ux="free-count">2 rooms free</p>\n<script>location.href = "today-empty-en.html"</script>' });
  // A folder would be opened as Chrome's listing of it, where nothing is found and an absent check passes.
  mkdirSync(join(dir, 'states'));
  symlinkSync('/dev/null', join(dir, 'null.html'));
  const checks = [
    check({ id: 'folder', page: 'states', type: 'absent', target: 'book-action' }),
    check({ id: 'device', page: 'null.html', type: 'count', target: 'room-', equals: 0 }),
    check({ id: 'missing-a', page: 'missing.html', type: 'visible', target: 'free-count' }),
    check({ id: 'fine', type: 'visible', target: 'free-count' }),
    check({ id: 'leaves-a', page: 'leaves.html', type: 'visible', target: 'free-count' }),
    check({ id: 'missing-b', page: 'missing.html', type: 'count', target: 'free-', equals: 1 }),
    check({ id: 'leaves-b', page: 'leaves.html', type: 'text', target: 'free-count', equals: '2 rooms free' }),
    check({ id: 'missing-other-width', page: 'missing.html', width: 1280, type: 'absent', target: 'book-action' }),
  ];
  const log = join(dir, 'openings.log');
  const r = spawnSync(process.execPath, ['--require', counting, cli, 'prototype', writeJson(dir, 'acceptance.json', { design: 'today', checks }), '--root', dir, '--out', join(dir, 'results.json')], { encoding: 'utf8', timeout: 60_000, env: { ...process.env, OPENINGS_LOG: log } });
  assert.equal(r.status, 1, r.stderr);
  const results = JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8'));
  const found = byId(results);
  assert.deepEqual(results.map(result => result.id), checks.map(c => c.id));
  const says = id => [found[id].pass, found[id].actual, found[id].message];
  assert.deepEqual(says('folder'), [false, null, 'cannot read the page states: it is a folder, not a file']);
  assert.deepEqual(says('device'), [false, null, 'cannot read the page null.html: it is not a file']);
  for (const id of ['missing-a', 'missing-b', 'missing-other-width']) assert.deepEqual(says(id), [false, null, 'cannot read the page missing.html: not found'], id);
  for (const id of ['leaves-a', 'leaves-b']) assert.deepEqual(says(id), [false, null, 'the page sent itself to today-empty-en.html'], id);
  assert.equal(found.fine.pass, true);
  // None of them was ever opened.
  const opened = readFileSync(log, 'utf8').trim().split('\n').filter(line => line.startsWith('page ')).map(line => line.split(' ')[1]);
  assert.deepEqual(opened, ['today-default-en.html', 'leaves.html']);
});

test('when no page of a run is a file, no browser is started', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  const dir = fresh();
  const chrome = countingChrome(dir);
  mkdirSync(join(dir, 'states'));
  const { results } = await acceptPrototype({ design: 'today', checks: [check({ id: 'a', page: 'states', type: 'visible', target: 'x' }), check({ id: 'b', page: 'gone.html', type: 'visible', target: 'x' })] }, { root: dir, chrome: chrome.file });
  assert.deepEqual(results.map(result => result.message), ['cannot read the page states: it is a folder, not a file', 'cannot read the page gone.html: not found']);
  assert.deepEqual(chrome.pids(), []);
});

// Faults put into the browsers a command starts, through Playwright's own objects. FAULT names one:
//   dead-page  the browser is stopped, by its own process handle, as a page is asked of it, at the calls
//              numbered in FAULT_AT (as "2,3"), counted over the whole run
//   hang       page.close() never returns for the page named FAULT_PAGE
//   leaves-as-checked  as the in-page file is evaluated in the page named FAULT_PAGE, the page has just
//                      left for away/elsewhere.html
//   unread-as-checked  the page named FAULT_PAGE can be read, and checked, and never read again
const faults = join(root, 'browser-faults.cjs');
writeFileSync(faults, [
  "const { chromium } = require('playwright-core');",
  'const fault = process.env.FAULT;',
  "const at = n => (process.env.FAULT_AT ?? '').split(',').map(Number).includes(n);",
  "const marked = url => String(url).endsWith('/' + process.env.FAULT_PAGE);",
  'const servers = [];',
  'let pages = 0;',
  "const stopOwn = async () => { const child = servers.at(-1).process(); if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await new Promise(resolve => child.once('exit', resolve)); } };",
  'const launchServer = chromium.launchServer.bind(chromium);',
  'chromium.launchServer = async (...args) => { const server = await launchServer(...args); servers.push(server); return server; };',
  'const connect = chromium.connect.bind(chromium);',
  'chromium.connect = async (...args) => {',
  '  const browser = await connect(...args);',
  '  const newContext = browser.newContext.bind(browser);',
  '  browser.newContext = async (...a) => {',
  '    const context = await newContext(...a);',
  '    const newPage = context.newPage.bind(context);',
  '    context.newPage = async (...b) => {',
  "      if (fault === 'dead-page' && at(++pages)) await stopOwn();",
  '      const page = await newPage(...b);',
  "      if (fault === 'hang') { const close = page.close.bind(page); page.close = (...c) => (marked(page.url()) ? new Promise(() => {}) : close(...c)); }",
  '      const evaluate = page.evaluate.bind(page);',
  "      if (fault === 'leaves-as-checked') page.evaluate = async (...c) => { if (typeof c[0] === 'string' && marked(page.url())) { const landed = page.waitForEvent('framenavigated'); await evaluate(() => { location.href = 'away/elsewhere.html'; }); await landed; } return evaluate(...c); };",
  "      let reads = 0;",
  "      if (fault === 'unread-as-checked') page.evaluate = async (...c) => { if (marked(page.url()) && ++reads > 3) throw new Error('page.evaluate: the page did not say'); return evaluate(...c); };",
  '      return page;',
  '    };',
  '    return context;',
  '  };',
  '  return browser;',
  '};',
].join('\n'));

test('a page whose browser stops twice before it can be opened fails each of its checks, and one that will not close is a warning; the run goes on in a fresh browser, and none is left', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  // The second page asked for is the Spanish one: its browser stops as it is asked, and again in the fresh one.
  let dir = fresh();
  let chrome = countingChrome(dir);
  let out = join(dir, 'results.json');
  let r = await runFor(['--require', faults, cli, 'prototype', acceptanceFile, '--root', prototype, '--out', out, '--chrome', chrome.file], 60_000, { FAULT: 'dead-page', FAULT_AT: '2,3' });
  let pids = chrome.pids();
  let left = await leftOf(pids);
  assert.deepEqual([r.status, r.stderr], [1, 'failed: count-in-spanish: the browser stopped twice while opening this page\n']);
  assert.deepEqual(JSON.parse(readFileSync(out, 'utf8')).map(result => result.pass), [true, true, false, true, true, true, true, true]);
  assert.equal(pids.length, 3, 'a fresh browser after each stop');
  assert.equal(left, 0, 'no process of any of them is left');
  // The empty page will not close: its checks stand, its browser is stopped by its own handle, and a fresh one goes on.
  dir = fresh();
  chrome = countingChrome(dir);
  out = join(dir, 'results.json');
  r = await runFor(['--require', faults, cli, 'prototype', acceptanceFile, '--root', prototype, '--out', out, '--chrome', chrome.file], 60_000, { FAULT: 'hang', FAULT_PAGE: 'today-empty-en.html' });
  pids = chrome.pids();
  left = await leftOf(pids);
  assert.deepEqual([r.status, r.stderr], [0, 'warning: today-empty-en.html: the page would not close; its browser was stopped\n']);
  assert.ok(JSON.parse(readFileSync(out, 'utf8')).every(result => result.pass));
  assert.equal(pids.length, 2);
  assert.equal(left, 0);
  // With --allow-errors, the same: a page that would not close is a warning either way.
  dir = fresh();
  chrome = countingChrome(dir);
  out = join(dir, 'results.json');
  r = await runFor(['--require', faults, cli, 'prototype', acceptanceFile, '--root', prototype, '--out', out, '--chrome', chrome.file, '--allow-errors'], 60_000, { FAULT: 'hang', FAULT_PAGE: 'today-empty-en.html' });
  left = await leftOf(chrome.pids());
  assert.deepEqual([r.status, r.stderr], [0, 'warning: today-empty-en.html: the page would not close; its browser was stopped\n']);
  assert.ok(JSON.parse(readFileSync(out, 'utf8')).every(result => result.pass));
  assert.equal(left, 0);
});

test('accept prototype reads a closed expansion as the kit draws it: its items are not rendered, its summary is', () => {
  const dir = prototypeIn(fresh(), {
    'expansion.html': [
      '<section class="ux-frame" data-screen="today"><header><h2>Today</h2></header><div class="ux-screen">',
      '<details class="ux-expansion"><summary data-ux="later-label">Later today</summary><p class="ux-text" data-ux="later-room">Room 1, free from 10:00</p></details>',
      '<details class="ux-expansion" open><summary data-ux="now-label">Free 9:40 to 11:15</summary><button class="ux-action" type="button" data-ux="book-jardin">Book Sala Jardín</button></details>',
      '</div></section>',
    ].join('\n'),
  });
  const on = fields => check({ page: 'expansion.html', screen: 'today', ...fields });
  const file = writeJson(dir, 'acceptance.json', {
    design: 'today',
    checks: [
      on({ id: 'later-hidden', type: 'visible', target: 'later-room' }),
      on({ id: 'later-absent', type: 'absent', target: 'later-room' }),
      on({ id: 'later-label', type: 'visible', target: 'later-label' }),
      on({ id: 'now-shown', type: 'visible', target: 'book-jardin' }),
    ],
  });
  const out = join(dir, 'results.json');
  const r = run('prototype', file, '--root', dir, '--out', out);
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.stderr, 'failed: later-hidden: not rendered: inside the closed <details class="ux-expansion">\n');
  assert.deepEqual(JSON.parse(readFileSync(out, 'utf8')).map(result => [result.id, result.pass]), [['later-hidden', false], ['later-absent', true], ['later-label', true], ['now-shown', true]]);
});

test('a page that leaves while it is checked, or cannot be read once checked, fails each of its checks, saying so; the run goes on and leaves no browser', { skip: !UNIX && 'needs a shell script for Chrome' }, async () => {
  for (const [fault, message] of [
    ['leaves-as-checked', 'the page sent itself to away/elsewhere.html while it was being checked'],
    ['unread-as-checked', 'the page could not be read again once checked: the page did not say'],
  ]) {
    const dir = prototypeIn(fresh());
    mkdirSync(join(dir, 'away'));
    writeFileSync(join(dir, 'away', 'elsewhere.html'), '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Elsewhere</title>\n</head>\n<body>\n<p data-ux="empty-message">Elsewhere.</p>\n</body>\n</html>\n');
    const chrome = countingChrome(dir);
    const out = join(dir, 'results.json');
    const r = await runFor(['--require', faults, cli, 'prototype', acceptanceFile, '--root', dir, '--out', out, '--chrome', chrome.file], 60_000, { FAULT: fault, FAULT_PAGE: 'today-empty-en.html' });
    const left = await leftOf(chrome.pids());
    assert.deepEqual([r.status, r.stderr], [1, `failed: empty-message-shown: ${message}\nfailed: no-booking-when-full: ${message}\n`], fault);
    assert.deepEqual(JSON.parse(readFileSync(out, 'utf8')).map(result => result.pass), [false, false, true, true, true, true, true, true], fault);
    assert.equal(left, 0, fault);
  }
});

test('a page whose in-page function cannot be put in place, or gives no result, fails each of its checks; the run goes on', async () => {
  const dir = prototypeIn(fresh(), {
    'locked.html': '<p data-ux="free-count">2 rooms free</p>\n<script>"use strict"; Object.defineProperty(window, "__uxAccept", { value: () => [], writable: false })</script>',
    'silent.html': '<p data-ux="free-count">2 rooms free</p>\n<script>Object.defineProperty(window, "__uxAccept", { set() {}, get: () => () => [] })</script>',
    'liar.html': '<script>Object.defineProperty(window, "__uxAccept", { set() {}, get: () => checks => checks.map(() => ({ id: "another", pass: true, actual: null, message: "" })) })</script>',
    'vague.html': '<script>Object.defineProperty(window, "__uxAccept", { set() {}, get: () => checks => checks.map(c => ({ id: c.id, pass: "yes", actual: null, message: "" })) })</script>',
    'terse.html': '<script>Object.defineProperty(window, "__uxAccept", { set() {}, get: () => checks => checks.map(c => ({ id: c.id, pass: true })) })</script>',
  });
  const checks = [
    check({ id: 'locked', page: 'locked.html', type: 'visible', target: 'free-count' }),
    check({ id: 'silent', page: 'silent.html', type: 'visible', target: 'free-count' }),
    check({ id: 'liar', page: 'liar.html', type: 'visible', target: 'free-count' }),
    check({ id: 'vague', page: 'vague.html', type: 'visible', target: 'free-count' }),
    check({ id: 'terse', page: 'terse.html', type: 'visible', target: 'free-count' }),
    check({ id: 'fine', type: 'visible', target: 'free-count' }),
  ];
  const { results } = await acceptPrototype({ design: 'today', checks }, { root: dir });
  assert.equal(results[0].pass, false);
  assert.match(results[0].message, /^the checks could not be run: .*__uxAccept/);
  // A result for another check, or one that does not say whether it passed, is no result.
  for (const result of results.slice(1, 4)) assert.deepEqual([result.pass, result.actual, result.message], [false, null, 'the page gave no result for this check'], result.id);
  // One that says no more than whether it passed has nothing measured, and nothing to say.
  assert.deepEqual([results[4].pass, results[4].actual, results[4].message], [true, null, '']);
  assert.equal(results[5].pass, true);
});

// A prototype folder with three pages that report errors of their own as they run: a stylesheet that does
// not load, a script that throws, and both; and an acceptance file with checks on them beside the fixture's.
const erring = () => {
  const dir = prototypeIn(fresh(), {
    'broken.html': '<p data-ux="free-count">2 rooms free</p>\n<script>throw new Error("the rooms did not load")</script>',
  });
  writeFileSync(join(dir, 'unstyled.html'), whole('<p data-ux="free-count">2 rooms free</p>', '<link rel="stylesheet" href="missing.css">\n'));
  writeFileSync(join(dir, 'both.html'), whole('<p data-ux="free-count">2 rooms free</p>\n<script>throw new Error("no rooms")</script>', '<link rel="stylesheet" href="gone.css">\n'));
  // It throws, and then leaves: its own fault is what is said.
  writeFileSync(join(dir, 'leaves.html'), whole('<script>setTimeout(() => (location.href = "today-empty-en.html"), 0); throw new Error("on its way")</script>'));
  const data = fixture();
  data.checks.splice(
    2,
    0,
    check({ id: 'unstyled', page: 'unstyled.html', type: 'visible', target: 'free-count' }),
    check({ id: 'unstyled-count', page: 'unstyled.html', type: 'text', target: 'free-count', equals: '2 rooms free' }),
    check({ id: 'unstyled-wide', page: 'unstyled.html', width: 1280, type: 'visible', target: 'free-count' }),
    check({ id: 'broken', page: 'broken.html', type: 'visible', target: 'free-count' }),
    check({ id: 'both', page: 'both.html', type: 'visible', target: 'free-count' }),
    check({ id: 'leaves', page: 'leaves.html', type: 'visible', target: 'free-count' }),
  );
  return { dir, file: writeJson(dir, 'acceptance.json', data) };
};
const MISSING = 'missing.css did not load: net::ERR_FILE_NOT_FOUND';
const THROWN = 'script error: the rooms did not load';

test('a page that reports an error of its own (a stylesheet that did not load, a script that throws) fails every check of its group with what it reported, and exits 1; the other groups still run', () => {
  const { dir, file } = erring();
  const out = join(dir, 'results.json');
  const r = run('prototype', file, '--root', dir, '--out', out);
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.stdout, `14 checks: 6 failed, 8 passed; results in ${out}\n`);
  // Each check of each group, with that page's own words; several are said together.
  assert.equal(r.stderr, [
    `failed: unstyled: ${MISSING}`,
    `failed: unstyled-count: ${MISSING}`,
    `failed: unstyled-wide: ${MISSING}`,
    `failed: broken: ${THROWN}`,
    'failed: both: script error: no rooms; gone.css did not load: net::ERR_FILE_NOT_FOUND',
    'failed: leaves: the page sent itself to today-empty-en.html',
    // What it reported is not the message of its checks, so it is a warning.
    'warning: leaves.html: script error: on its way',
    '',
  ].join('\n'));
  const results = byId(JSON.parse(readFileSync(out, 'utf8')));
  assert.deepEqual([results.unstyled.pass, results.unstyled.actual, results.unstyled.message], [false, null, MISSING]);
  for (const id of fixture().checks.map(c => c.id)) assert.equal(results[id].pass, true, id);
});

test('with --allow-errors, what a page reports is a warning, once a page, and its checks give their own results (exit 0 when they pass); the module takes it as allowErrors', async () => {
  const { dir, file } = erring();
  const out = join(dir, 'results.json');
  const r = run('prototype', file, '--root', dir, '--out', out, '--allow-errors');
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.stdout, `14 checks: 1 failed, 13 passed; results in ${out}\n`);
  // Said once a page, however many widths saw it; the page that left still failed, for leaving.
  assert.equal(r.stderr, [
    'failed: leaves: the page sent itself to today-empty-en.html',
    `warning: unstyled.html: ${MISSING}`,
    `warning: broken.html: ${THROWN}`,
    'warning: both.html: script error: no rooms',
    'warning: both.html: gone.css did not load: net::ERR_FILE_NOT_FOUND',
    'warning: leaves.html: script error: on its way',
    '',
  ].join('\n'));
  assert.equal(byId(JSON.parse(readFileSync(out, 'utf8')))['unstyled-count'].actual, '2 rooms free');
  // Without the page that leaves, every check passes: exit 0.
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const passing = writeJson(dir, 'passing.json', { ...data, checks: data.checks.filter(c => c.page !== 'leaves.html') });
  const all = run('prototype', passing, '--root', dir, '--out', out, '--allow-errors');
  assert.deepEqual([all.status, all.stdout], [0, `13 checks: 0 failed, 13 passed; results in ${out}\n`]);
  data.checks = data.checks.filter(c => c.page === 'broken.html');
  const allowed = await acceptPrototype(data, { root: dir, allowErrors: true });
  assert.deepEqual([allowed.results[0].pass, allowed.errors], [true, [{ page: 'broken.html', message: THROWN }]]);
  const refused = await acceptPrototype(data, { root: dir });
  assert.deepEqual([refused.results[0].pass, refused.results[0].message, refused.errors], [false, THROWN, []]);
});

test('--timeout limits how long a page is given: its checks fail saying so, soon', async () => {
  // A server that never answers: the stylesheet it is asked for never comes.
  const server = createServer(() => {});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const dir = fresh();
    prototypeIn(dir);
    writeFileSync(join(dir, 'slow.html'), whole('<p data-ux="free-count">2 rooms free</p>', `<link rel="stylesheet" href="http://127.0.0.1:${server.address().port}/held.css">\n`));
    const file = writeJson(dir, 'acceptance.json', { design: 'today', checks: [check({ id: 'slow', page: 'slow.html', type: 'visible', target: 'free-count' }), check({ id: 'fine', type: 'visible', target: 'free-count' })] });
    const out = join(dir, 'results.json');
    const started = Date.now();
    const r = await runFor([cli, 'prototype', file, '--root', dir, '--out', out, '--timeout', '1500'], 30_000);
    assert.equal(r.status, 1, r.stderr);
    // On a loaded machine a page given up while it loads may also not close in time: its browser is then
    // stopped, and that is said of the page too.
    const [first, ...rest] = r.stderr.trimEnd().split('\n');
    assert.equal(first, 'failed: slow: slow.html did not finish loading within 1500 ms');
    for (const line of rest) assert.equal(line, 'warning: slow.html: the page would not close; its browser was stopped');
    assert.ok(Date.now() - started < 15_000, `it took ${Date.now() - started} ms`);
    assert.deepEqual(JSON.parse(readFileSync(out, 'utf8')).map(result => result.pass), [false, true]);
  } finally {
    server.closeAllConnections();
    server.close();
  }
});

test('the CLI exits 2 for bad usage, with the usage, and makes nothing', () => {
  const dir = fresh();
  const out = join(dir, 'out.json');
  const cases = [
    [[], 'accept takes a command: prototype, report or inpage'],
    [['check'], 'unknown command "check": it is prototype, report or inpage'],
    [['prototype', '--root', prototype, '--out', out], 'prototype takes one <acceptance.json>'],
    [['prototype', acceptanceFile, acceptanceFile, '--root', prototype, '--out', out], 'prototype takes one <acceptance.json>'],
    [['prototype', acceptanceFile, '--out', out], '--root is missing'],
    [['prototype', acceptanceFile, '--root', prototype], '--out is missing'],
    [['prototype', acceptanceFile, '--root', prototype, '--out', out, '--timeout', '0'], '--timeout must be a whole number of milliseconds from 1, as 30000; it is "0"'],
    [['prototype', acceptanceFile, '--root', prototype, '--out', out, '--widths', '390'], 'unknown flag --widths'],
    [['prototype', acceptanceFile, '--root', prototype, '--out', out, '--allow-errors=yes'], '--allow-errors takes no value'],
    [['prototype', acceptanceFile, '--root', prototype, '--out', out, '--checks', acceptanceFile], 'unknown flag --checks'],
    [['report', acceptanceFile, '--out', out, '--checks'], '--checks needs a value'],
    [['report', acceptanceFile, '--out', out, '--allow-errors'], 'unknown flag --allow-errors'],
    [['report', '--out', out], 'report takes at least one <results.json>'],
    [['report', acceptanceFile], '--out is missing'],
    [['report', acceptanceFile, '--out', out, '--root', prototype], 'unknown flag --root'],
    [['inpage', 'today'], 'inpage takes nothing more'],
    [['inpage', '--out', out], 'unknown flag --out'],
  ];
  for (const [args, message] of cases) {
    const r = run(...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.ok(r.stderr.startsWith(`${message}\n\nUsage: node scripts/accept.mjs`), r.stderr);
    assert.equal(r.stdout, '');
  }
  assert.ok(!existsSync(out), 'nothing is made');
});

test('the CLI prints its usage for --help and exits 0', () => {
  for (const args of [['--help'], ['prototype', '--help'], ['-h']]) {
    const r = run(...args);
    assert.equal(r.status, 0);
    assert.ok(r.stdout.startsWith('Usage: node scripts/accept.mjs prototype <acceptance.json> --root <folder> --out <results.json>'), r.stdout);
    for (const type of ['visible', 'absent', 'text', 'order', 'in-viewport', 'min-size', 'contrast', 'count', 'style', 'gap']) assert.match(r.stdout, new RegExp(`\\n  ${type} `), type);
    const said = r.stdout.replace(/\s+/g, ' ');
    // R108: what an in-viewport check may name.
    assert.ok(said.includes('in-viewport target: rendered, and its whole box inside the first viewport, without scrolling. The element that answers "without scrolling" is never a shape inside an <svg>: a drawing that is scaled is measured as if it were not.'), 'in-viewport');
    // R185: the two types that measure, and what stays a person\'s.
    assert.ok(said.includes('style target, property (a CSS property, as font-size), equals: the value the browser computes for that one property of the element, as it gives it (16px, 600, rgb(26, 26, 26)), is the string given'), 'style');
    assert.ok(said.includes('gap targets (two ids), axis (x or y), equals: both are rendered, and the distance from the first to the second along that axis (x: from its right edge to the other\'s left; y: from its bottom edge to the other\'s top) is that number of CSS pixels, half a pixel of play given'), 'gap');
    assert.ok(said.includes('No type measures the length of a line of text: that is measured by a person.'), 'the length of a line');
    assert.equal(r.stderr, '');
  }
});

test('inpage prints the absolute path of the in-page file and exits 0', () => {
  const r = run('inpage');
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.equal(r.stdout, `${INPAGE}\n`);
  assert.equal(INPAGE, join(here, '..', 'scripts', 'inpage', 'accept-inpage.js'));
  assert.ok(existsSync(INPAGE));
});

// ---- the report

test('report reads several results files into one table, failed first in the order read', () => {
  const dir = fresh();
  const result = (id, pass) => ({ id, pass, actual: null, message: pass ? '' : 'no', criterion: `Criterion ${id}.`, state: 'default', page: 'today.html', width: 390, theme: 'light' });
  const first = writeJson(dir, 'prototype.json', [result('a', true), result('b', false)]);
  const second = writeJson(dir, 'build.json', [result('c', false), result('d', true)]);
  const out = join(dir, 'report.md');
  const r = run('report', first, second, '--out', out);
  assert.equal(r.status, 0, r.stderr);
  const rows = readFileSync(out, 'utf8').split('\n').filter(line => line.startsWith('| FAIL') || line.startsWith('| pass'));
  assert.deepEqual(rows.map(row => row.split(' | ')[1]), ['b', 'c', 'a', 'd']);
  assert.ok(readFileSync(out, 'utf8').startsWith('4 checks: 2 failed, 2 passed.\n'));
  // The same, as a module.
  assert.equal(reportOf([[result('a', true)], [result('b', false)]]).split('\n')[0], '2 checks: 1 failed, 1 passed.');
});

// What window.__uxAccept gives in a build, and no more.
const bare = (id, pass, actual = null, message = pass ? '' : 'no') => ({ id, pass, actual, message });

test('report --checks joins results that carry only id, pass, actual and message to their checks; a check with no result is not run, listed after the failed and before the passed, and counted; exit 0', () => {
  const dir = fresh('joined report');
  const checksFile = writeJson(dir, 'the checks.json', fixture());
  const build = writeJson(dir, 'build 390.json', [
    bare('book-target-size', true, { width: 151.17, height: 44 }),
    bare('count-in-spanish', false, '2 salas', 'the text is "2 salas", not "2 salas libres"'),
    bare('empty-message-shown', true),
    bare('two-free-rooms-listed', false, 3, '3 elements have a data-ux starting with "free-room-"; the check wants 2'),
  ]);
  // A result in the runner's whole shape: the check's own criterion, state, page, width and theme win.
  const whole = writeJson(dir, 'build 1280.json', [
    { ...bare('list-contrast-dark', true, 6.84), criterion: 'Another criterion.', state: 'other', page: 'https://build.example/today', width: 1024, theme: 'light' },
    bare('count-then-list-then-book', true, ['free-count', 'room-list', 'book-action']),
  ]);
  const out = join(dir, 'report.md');
  const r = run('report', build, whole, '--checks', checksFile, '--out', out);
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.equal(r.stdout, `8 checks: 2 failed, 2 not run, 4 passed; report in ${out}\n`);
  const c = byId(fixture().checks);
  const row = (result, id, actual, message) => `| ${result} | ${id} | ${c[id].criterion} | ${c[id].state} | ${c[id].page} | ${c[id].width} | ${c[id].theme ?? 'light'} | ${actual} | ${message} |`;
  assert.equal(readFileSync(out, 'utf8'), [
    '8 checks: 2 failed, 2 not run, 4 passed.',
    '',
    '| Result | Check | Criterion | State | Page | Width | Theme | Actual | Message |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    // Each part in the order of the checks file.
    row('FAIL', 'count-in-spanish', '"2 salas"', 'the text is "2 salas", not "2 salas libres"'),
    row('FAIL', 'two-free-rooms-listed', '3', '3 elements have a data-ux starting with "free-room-"; the check wants 2'),
    row('not run', 'no-booking-when-full', '', ''),
    row('not run', 'book-in-first-screen', '', ''),
    row('pass', 'empty-message-shown', '', ''),
    row('pass', 'count-then-list-then-book', '["free-count","room-list","book-action"]', ''),
    row('pass', 'book-target-size', '{"width":151.17,"height":44}', ''),
    row('pass', 'list-contrast-dark', '6.84', ''),
    '',
  ].join('\n'));
  // The same, as a module.
  const joined = joinResults(fixture(), [{ file: 'a.json', results: [bare('book-target-size', true)] }]);
  assert.equal(joined.length, 8);
  assert.deepEqual(joined[0], { id: 'empty-message-shown', pass: null, actual: null, message: '', criterion: c['empty-message-shown'].criterion, state: 'empty', page: 'today-empty-en.html', width: 390, theme: 'light' });
  assert.equal(reportOf([joined], { notRun: true }).split('\n')[0], '8 checks: 0 failed, 7 not run, 1 passed.');
});

test('report --checks refuses with exit 1, writing nothing: a checks file that is not valid, a result no check has, an id with two results, a result without what __uxAccept gives', () => {
  const dir = fresh();
  const checksFile = writeJson(dir, 'checks.json', fixture());
  const out = join(dir, 'not made', 'report.md');
  const invalid = fixture();
  invalid.checks[0].width = 0;
  const badChecks = writeJson(dir, 'bad checks.json', invalid);
  const a = writeJson(dir, 'a.json', [bare('book-target-size', true), bare('count-in-spanish', true)]);
  const b = writeJson(dir, 'b.json', [bare('count-in-spanish', false)]);
  const twice = writeJson(dir, 'twice.json', [bare('book-target-size', true), bare('book-target-size', false)]);
  const ghost = writeJson(dir, 'ghost.json', [bare('book-target-size', true), bare('next-free-time', false)]);
  const noPass = writeJson(dir, 'no pass.json', [{ id: 'book-target-size', actual: null, message: '' }]);
  const cases = [
    [[a, '--checks', badChecks], `${badChecks} is not a valid acceptance file:\n  $.checks[0].width: must be a whole number of CSS pixels from 1\n`],
    [[a, '--checks', join(dir, 'missing.json')], `cannot read ${join(dir, 'missing.json')}: not found\n`],
    [[ghost, '--checks', checksFile], `${ghost} holds a result for "next-free-time", and ${checksFile} has no check with that id\n`],
    [[a, b, '--checks', checksFile], `"count-in-spanish" has two results: in ${a} and in ${b}\n`],
    [[twice, '--checks', checksFile], `"book-target-size" has two results: in ${twice} and in ${twice}\n`],
    [[noPass, '--checks', checksFile], `${noPass} is not a list of results:\n  $[0].pass: must be true or false\n`],
    // Without --checks, the whole shape is asked, as before.
    [[a], `${a} is not a list of results:\n${['0', '1'].flatMap(i => ['criterion: must be a non-empty string', 'state: must be a string', 'page: must be a string', 'width: must be a whole number from 1', 'theme: must be a string'].map(e => `  $[${i}].${e}\n`)).join('')}`],
  ];
  for (const [args, stderr] of cases) {
    const r = run('report', ...args, '--out', out);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', stderr], args.join(' '));
  }
  assert.ok(!existsSync(join(dir, 'not made')), 'nothing is made');
  // What a bare result needs, and no more.
  assert.deepEqual(validateResults([bare('a', true)], { joined: true }), []);
  assert.deepEqual(validateResults([{ id: '', pass: 1, message: null }], { joined: true }), ['$[0].id: must be a non-empty string', '$[0].pass: must be true or false', '$[0].actual: is missing', '$[0].message: must be a string']);
});

test('report refuses with exit 1 a results file that is not a list of results, and writes nothing', () => {
  const dir = fresh();
  const good = { id: 'a', pass: true, actual: 2, message: '', criterion: 'C.', state: 'default', page: 'p.html', width: 390, theme: 'light' };
  const out = join(dir, 'report.md');
  const cases = [
    [{ results: [good] }, ['$: must be a list of results']],
    [[good, null], ['$[1]: must be an object']],
    [[{ ...good, id: '' }], ['$[0].id: must be a non-empty string']],
    [[{ ...good, pass: 'yes' }], ['$[0].pass: must be true or false']],
    [[{ ...good, message: null }], ['$[0].message: must be a string']],
    [[{ ...good, criterion: '' }], ['$[0].criterion: must be a non-empty string']],
    [[{ ...good, state: 3 }], ['$[0].state: must be a string']],
    [[{ ...good, page: 3 }], ['$[0].page: must be a string']],
    [[{ ...good, width: '390' }], ['$[0].width: must be a whole number from 1']],
    [[{ ...good, theme: false }], ['$[0].theme: must be a string']],
    [[(({ actual, ...rest }) => rest)(good)], ['$[0].actual: is missing']],
  ];
  for (const [data, errors] of cases) {
    assert.deepEqual(validateResults(data), errors, JSON.stringify(data));
    const file = writeJson(dir, 'results.json', data);
    const r = run('report', file, '--out', out);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${file} is not a list of results:\n${errors.map(e => `  ${e}\n`).join('')}`]);
  }
  assert.deepEqual(validateResults([good]), []);
  assert.deepEqual(validateResults([]), []);
  const notJson = join(dir, 'not json.json');
  writeFileSync(notJson, '[');
  const r = run('report', notJson, '--out', out);
  assert.equal(r.status, 1);
  assert.match(r.stderr, new RegExp(`^cannot read ${notJson}: it is not JSON`));
  assert.ok(!existsSync(out));
});

// ---- in the page, as a build's own session evaluates it: one browser for all of these

describe('the in-page file, evaluated through a driver of its own', () => {
  let browser;
  let source;
  before(async () => {
    source = readFileSync(INPAGE, 'utf8');
    // Scroll bars shown, as a build's own session may show them: Playwright hides them by default.
    browser = await chromium.launch({ executablePath: findChrome(), headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
  });
  after(() => browser?.close());

  // The checks, evaluated on a page holding `body`, at a width and theme, as a build's session would: the
  // file's text through the driver's evaluate, then the function.
  const evaluate = async (body, checks, { width = 390, theme = 'light', head = '', then } = {}) => {
    const context = await browser.newContext(contextOptions(width, theme));
    try {
      const page = await context.newPage();
      await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>${STYLE}${head}</head><body>${body}</body></html>`);
      if (then) await page.evaluate(then);
      await page.evaluate(source);
      return await page.evaluate(checks => window.__uxAccept(checks), checks);
    } finally {
      await context.close();
    }
  };
  // The same, and for each check the page's own answer: whether elementFromPoint at the centre of the
  // element's box finds it, or something in it.
  const evaluateAndPoint = async (body, checks, { head = '', then } = {}) => {
    const context = await browser.newContext(contextOptions(390, 'light'));
    try {
      const page = await context.newPage();
      await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>${STYLE}${head}</head><body>${body}</body></html>`);
      if (then) await page.evaluate(then);
      await page.evaluate(source);
      const results = await page.evaluate(checks => window.__uxAccept(checks), checks);
      const painted = await page.evaluate(ids =>
        ids.map(id => {
          const element = document.querySelector(`[data-ux="${id}"]`);
          const box = element.getBoundingClientRect();
          const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return at !== null && element.contains(at);
        }),
      checks.map(check => check.target));
      return { results, painted };
    } finally {
      await context.close();
    }
  };
  // No margin round the page, and a line 18 px high, so that boxes can be said exactly.
  const STYLE = '<style>body { margin: 0 } p { line-height: 18px }</style>';
  const c = (id, type, fields = {}) => ({ id, type, target: id, ...fields });
  const shown = results => results.map(({ id, pass, actual, message }) => [id, pass, actual, message]);

  test('it is one script with no import, export or require and no name of its own: it can be evaluated again and again, and as the body of a function', async () => {
    assert.doesNotMatch(source, /^\s*(import|export)\b|\brequire\s*\(/m);
    const context = await browser.newContext(contextOptions(390, 'light'));
    try {
      const page = await context.newPage();
      await page.setContent('<p data-ux="free-count">2 rooms free</p>');
      const before = await page.evaluate(() => Object.keys(window));
      await page.evaluate(source);
      await page.evaluate(source);
      // Selenium's way: the text is the body of a function.
      await page.evaluate(text => new Function(text)(), source);
      const added = await page.evaluate(names => Object.keys(window).filter(name => !names.includes(name)), before);
      assert.deepEqual(added, ['__uxAccept']);
      const [result] = await page.evaluate(() => window.__uxAccept([{ id: 'n', type: 'visible', target: 'free-count' }]));
      assert.deepEqual([result.id, result.pass, result.message], ['n', true, '']);
    } finally {
      await context.close();
    }
  });

  test('it reads only: the page is the same before and after every type of check', async () => {
    const context = await browser.newContext(contextOptions(390, 'light'));
    try {
      const page = await context.newPage();
      await page.setContent(`${STYLE}<main data-screen="today"><p data-ux="free-count" style="color: oklch(0.4 0 0)">2 rooms free</p><ul><li data-ux="room-1">Room 1</li></ul><button data-ux="book-action" style="width: 60px; height: 30px">Book</button></main>`);
      await page.evaluate(() => {
        window.mutations = 0;
        new MutationObserver(list => (window.mutations += list.length)).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
      });
      const html = await page.evaluate(() => document.documentElement.outerHTML);
      await page.evaluate(source);
      const types = ['visible', 'absent', 'in-viewport', 'contrast'].map(type => ({ id: type, type, target: 'free-count', screen: 'today', min: 3 }));
      types.push({ id: 'text', type: 'text', target: 'free-count', matches: 'rooms' }, { id: 'order', type: 'order', targets: ['free-count', 'book-action'] }, { id: 'min-size', type: 'min-size', target: 'book-action', minWidth: 1, minHeight: 1 }, { id: 'count', type: 'count', target: 'room-', equals: 1 },
        { id: 'style', type: 'style', target: 'book-action', property: 'height', equals: '30px' }, { id: 'gap', type: 'gap', targets: ['free-count', 'room-1'], axis: 'y', equals: 16 });
      assert.deepEqual(types.map(check => check.type).sort(), Object.keys(TYPES).sort(), 'every type the script knows');
      const results = await page.evaluate(checks => window.__uxAccept(checks), types);
      assert.deepEqual(shown(results), [
        ['visible', true, { width: 390, height: 18 }, ''],
        ['absent', false, 1, 'data-ux="free-count" is rendered in data-screen="today"'],
        ['in-viewport', true, { x: 0, y: 0, width: 390, height: 18 }, ''],
        // oklch(0.4 0 0) is a grey of 72 in sRGB, on white.
        ['contrast', true, 9.14, ''],
        ['text', true, '2 rooms free', ''],
        ['order', true, ['free-count', 'book-action'], ''],
        ['min-size', true, { width: 60, height: 30 }, ''],
        ['count', true, 1, ''],
        ['style', true, '30px', ''],
        // The list's own margin: 16 px between the line and its first item.
        ['gap', true, 16, ''],
      ]);
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
      assert.equal(await page.evaluate(() => window.mutations), 0);
      assert.equal(await page.evaluate(() => document.documentElement.outerHTML), html);
    } finally {
      await context.close();
    }
  });

  test('it never throws: checks that are not a list, a check that is not one, a check that throws, an unknown type, each gives a failed result and the rest go on', async () => {
    const context = await browser.newContext(contextOptions(390, 'light'));
    try {
      const page = await context.newPage();
      await page.setContent(`${STYLE}<p data-ux="free-count">2 rooms free</p>`);
      await page.evaluate(source);
      for (const checks of [null, 'free-count', { id: 'a' }, undefined]) {
        assert.deepEqual(await page.evaluate(checks => window.__uxAccept(checks), checks), [{ id: null, pass: false, actual: null, message: 'the checks must be a list' }], String(checks));
      }
      const results = await page.evaluate(() =>
        window.__uxAccept([
          null,
          7,
          ['free-count'],
          { type: 'visible', target: 'free-count' },
          { id: '', type: 'visible', target: 'free-count' },
          { id: 'throws', get type() { throw new Error('a getter that throws'); } },
          { id: 'toString', type: 'toString', target: 'free-count' },
          { id: 'constructor', type: 'constructor', target: 'free-count' },
          { id: 'none', target: 'free-count' },
          { id: 'kind', type: 'Visible', target: 'free-count' },
          { id: 'object-type', type: { toString: () => 'visible' }, target: 'free-count' },
          { id: 'throws-words', get type() { throw 'plain words'; } },
          { id: 'throws-unreadable', get type() { throw { toString() { throw new Error('no'); } }; } },
          { id: 'after', type: 'visible', target: 'free-count' },
        ]),
      );
      assert.deepEqual(shown(results), [
        [null, false, null, 'the check is not an object'],
        [null, false, null, 'the check is not an object'],
        [null, false, null, 'the check is not an object'],
        [null, false, null, 'the check has no id'],
        [null, false, null, 'the check has no id'],
        ['throws', false, null, 'the check could not be made: a getter that throws'],
        ['toString', false, null, 'unknown check type "toString"'],
        ['constructor', false, null, 'unknown check type "constructor"'],
        ['none', false, null, 'unknown check type undefined'],
        ['kind', false, null, 'unknown check type "Visible"'],
        ['object-type', false, null, 'unknown check type {}'],
        ['throws-words', false, null, 'the check could not be made: plain words'],
        ['throws-unreadable', false, null, 'the check could not be made: an error that cannot be read'],
        ['after', true, { width: 390, height: 18 }, ''],
      ]);
      // A list that cannot even be counted.
      const uncounted = await page.evaluate(() => window.__uxAccept(new Proxy([], { get: (list, key) => { if (key === 'length') throw new Error('a list that cannot be counted'); return list[key]; } })));
      assert.deepEqual(uncounted, [{ id: null, pass: false, actual: null, message: 'the checks could not be read: a list that cannot be counted' }]);
    } finally {
      await context.close();
    }
  });

  test('an element is found by its data-ux, exactly once; with a screen, inside that screen alone', async () => {
    const body = [
      '<section data-screen="today"><p data-ux="free-count">2 rooms free</p><p data-ux="room-1">Room 1</p></section>',
      '<section data-screen="book"><p data-ux="free-count">Book a room</p></section>',
      '<section data-screen="twice"></section><section data-screen="twice"></section>',
      '<p data-ux=\'say "hi"\'>Quoted</p>',
      '<div id="host"></div>',
      '<section data-screen="own" data-ux="own-id"><p>Its own</p></section>',
    ].join('');
    const shadow = () => (document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = '<p data-ux="in-shadow">In a shadow root</p>');
    const results = await evaluate(body, [
      c('in-shadow', 'visible'),
      c('own-id', 'visible', { screen: 'own' }),
      c('own-id', 'visible'),
      c('free-count', 'visible'),
      c('free-count', 'visible', { screen: 'today' }),
      c('free-count', 'text', { screen: 'book', equals: 'Book a room' }),
      c('room-1', 'visible', { screen: 'book' }),
      c('room-1', 'visible', { screen: 'nowhere' }),
      c('room-1', 'visible', { screen: 'twice' }),
      c('room-1', 'visible', { screen: '' }),
      c('free', 'visible'),
      c('say "hi"', 'visible'),
      { id: 'no-target', type: 'visible' },
      { id: 'empty-target', type: 'visible', target: '' },
      { id: 'list-target', type: 'visible', target: ['room-1'] },
    ], { then: shadow });
    assert.deepEqual(shown(results), [
      // A shadow root is not searched.
      ['in-shadow', false, null, 'data-ux="in-shadow" not found'],
      // A screen element's own data-ux is not inside that screen; it is in the document.
      ['own-id', false, null, 'data-ux="own-id" not found in data-screen="own"'],
      ['own-id', true, { width: 390, height: 18 }, ''],
      ['free-count', false, null, 'data-ux="free-count" found 2 times; it must be on exactly one element'],
      ['free-count', true, { width: 390, height: 18 }, ''],
      ['free-count', true, 'Book a room', ''],
      ['room-1', false, null, 'data-ux="room-1" not found in data-screen="book"'],
      ['room-1', false, null, 'data-screen="nowhere" not found'],
      ['room-1', false, null, 'data-screen="twice" found 2 times; a screen must be on exactly one element'],
      ['room-1', false, null, 'screen must be a non-empty string'],
      ['free', false, null, 'data-ux="free" not found'],
      ['say "hi"', true, { width: 390, height: 18 }, ''],
      ['no-target', false, null, 'target must be a non-empty string'],
      ['empty-target', false, null, 'target must be a non-empty string'],
      ['list-target', false, null, 'target must be a non-empty string'],
    ]);
  });

  test('visible: not displayed, not visible, fully transparent, on itself or an element it is in, or with no width or no height, is not rendered', async () => {
    const body = [
      '<p data-ux="plain">Shown</p>',
      '<p data-ux="none" style="display: none">x</p>',
      '<div style="display: none"><p data-ux="in-none">x</p></div>',
      '<p data-ux="hidden" style="visibility: hidden">x</p>',
      '<div style="visibility: hidden"><p data-ux="in-hidden">x</p></div>',
      '<div style="visibility: hidden"><p data-ux="shown-again" style="visibility: visible">x</p></div>',
      '<p data-ux="collapsed" style="visibility: collapse">x</p>',
      '<p data-ux="clear" style="opacity: 0">x</p>',
      '<div class="faded" style="opacity: 0"><p data-ux="in-clear">x</p></div>',
      '<p data-ux="faint" style="opacity: 0.01">x</p>',
      '<p data-ux="flat" style="height: 0; overflow: hidden">x</p>',
      '<p data-ux="thin" style="width: 0; overflow: hidden">x</p>',
    ].join('');
    const ids = ['plain', 'none', 'in-none', 'hidden', 'in-hidden', 'shown-again', 'collapsed', 'clear', 'in-clear', 'faint', 'flat', 'thin'];
    const results = await evaluate(body, ids.map(id => c(id, 'visible')));
    assert.deepEqual(shown(results), [
      ['plain', true, { width: 390, height: 18 }, ''],
      ['none', false, { width: 0, height: 0 }, 'not rendered: display: none on data-ux="none"'],
      ['in-none', false, { width: 0, height: 0 }, 'not rendered: display: none on <div>'],
      ['hidden', false, { width: 390, height: 18 }, 'not rendered: visibility: hidden'],
      ['in-hidden', false, { width: 390, height: 18 }, 'not rendered: visibility: hidden'],
      ['shown-again', true, { width: 390, height: 18 }, ''],
      ['collapsed', false, { width: 390, height: 18 }, 'not rendered: visibility: collapse'],
      ['clear', false, { width: 390, height: 18 }, 'not rendered: opacity: 0 on data-ux="clear"'],
      ['in-clear', false, { width: 390, height: 18 }, 'not rendered: opacity: 0 on <div class="faded">'],
      ['faint', true, { width: 390, height: 18 }, ''],
      ['flat', false, { width: 390, height: 0 }, 'not rendered: its box is 390 × 0'],
      ['thin', false, { width: 0, height: 18 }, 'not rendered: its box is 0 × 18'],
    ]);
  });

  test('absent: no element has the id, or none that has it is rendered', async () => {
    const body = '<p data-ux="shown">x</p><p data-ux="hidden" hidden>x</p><p data-ux="half">x</p><p data-ux="half" hidden>x</p><p data-ux="both">x</p><p data-ux="both">x</p><p data-ux="gone-twice" hidden>x</p><p data-ux="gone-twice" style="opacity: 0">x</p><section data-screen="book"></section>';
    const results = await evaluate(body, [c('never', 'absent'), c('hidden', 'absent'), c('gone-twice', 'absent'), c('shown', 'absent'), c('half', 'absent'), c('both', 'absent'), c('shown', 'absent', { screen: 'book' })]);
    assert.deepEqual(shown(results), [
      ['never', true, 0, ''],
      ['hidden', true, 0, ''],
      ['gone-twice', true, 0, ''],
      ['shown', false, 1, 'data-ux="shown" is rendered'],
      ['half', false, 1, 'data-ux="half" is rendered'],
      ['both', false, 2, 'data-ux="both" is rendered, on 2 elements'],
      ['shown', true, 0, ''],
    ]);
  });

  test('text: the text with its runs of white space made one and trimmed, equal to equals or matched by matches; anything else is a malformed check', async () => {
    const body = '<p data-ux="count">\n   2  rooms\n\tfree  </p><p data-ux="nbsp">10:00&nbsp;a. m.</p><p data-ux="upper" style="text-transform: uppercase">Book</p>';
    const results = await evaluate(body, [
      c('count', 'text', { equals: '2 rooms free' }),
      c('count', 'text', { equals: '2 rooms' }),
      c('count', 'text', { matches: '^\\d+ rooms? free$' }),
      c('count', 'text', { matches: '^free' }),
      c('nbsp', 'text', { equals: '10:00\u00a0a. m.' }),
      c('upper', 'text', { equals: 'Book' }),
      c('count', 'text', {}),
      c('count', 'text', { equals: 'a', matches: 'a' }),
      c('count', 'text', { equals: 2 }),
      c('count', 'text', { matches: '(rooms' }),
      c('count', 'text', { matches: '' }),
    ]);
    assert.deepEqual(shown(results), [
      ['count', true, '2 rooms free', ''],
      ['count', false, '2 rooms free', 'the text is "2 rooms free", not "2 rooms"'],
      ['count', true, '2 rooms free', ''],
      ['count', false, '2 rooms free', 'the text "2 rooms free" does not match /^free/'],
      ['nbsp', true, '10:00\u00a0a. m.', ''],
      ['upper', true, 'Book', ''],
      ['count', false, null, 'a text check takes exactly one of equals and matches'],
      ['count', false, null, 'a text check takes exactly one of equals and matches'],
      ['count', false, null, 'equals must be a string'],
      ['count', false, null, 'matches is not a regular expression: Invalid regular expression: /(rooms/: Unterminated group'],
      ['count', false, null, 'matches must be a non-empty string'],
    ]);
  });

  // F96 of the dry run: a check written to what she sees ("Room 5 free") read "Room 5free" on the approved page.
  test('text: what the element shows, so two blocks, two lines, two cells and two items read with a space between them, and one line reads as written', async () => {
    const body = [
      '<div data-ux="blocks"><p>Room 5</p><p>free</p></div>',
      '<div data-ux="mixed">Longest free first<p>Room 5, free until 12:00</p>Room 1</div>',
      '<p data-ux="line">Room <b>5</b><span>, free</span></p>',
      '<p data-ux="break">Room 2<br>12<span>:</span>30</p>',
      '<ul data-ux="items"><li>Room 1</li><li>Room 2</li></ul>',
      '<table><tr data-ux="row"><td>Room 3</td><td>09:50</td></tr></table>',
      '<div data-ux="flex" style="display: flex"><span>Room 4</span><span>free</span></div>',
      '<p data-ux="atomic"><span style="display: inline-block">Room</span><span style="display: inline-block">6</span></p>',
      '<div data-ux="contents"><span>Room</span><div style="display: contents"><span>7</span></div></div>',
      '<div data-ux="closed"><p>Room 8</p><p hidden>closed</p><p>free</p></div>',
      '<div data-ux="nested"><section><h3>Free now</h3><div><p>Room 9</p></div></section><p>1 room</p></div>',
      '<p data-ux="hidden-break">Room<br hidden>10</p>',
    ].join('');
    const ids = ['blocks', 'mixed', 'line', 'break', 'items', 'row', 'flex', 'atomic', 'contents', 'closed', 'nested', 'hidden-break'];
    const results = await evaluate(body, [...ids.map(id => c(id, 'text', { matches: '.' })), c('blocks', 'text', { equals: 'Room 5 free' }), c('blocks', 'text', { equals: 'Room 5free' })]);
    assert.deepEqual(shown(results), [
      ['blocks', true, 'Room 5 free', ''],
      ['mixed', true, 'Longest free first Room 5, free until 12:00 Room 1', ''],
      ['line', true, 'Room 5, free', ''],
      ['break', true, 'Room 2 12:30', ''],
      ['items', true, 'Room 1 Room 2', ''],
      ['row', true, 'Room 3 09:50', ''],
      ['flex', true, 'Room 4 free', ''],
      ['atomic', true, 'Room6', ''],
      ['contents', true, 'Room7', ''],
      ['closed', true, 'Room 8 free', ''],
      ['nested', true, 'Free now Room 9 1 room', ''],
      ['hidden-break', true, 'Room10', ''],
      ['blocks', true, 'Room 5 free', ''],
      ['blocks', false, 'Room 5 free', 'the text is "Room 5 free", not "Room 5free"'],
    ]);
  });

  // S5 of the fix review: `<div>Room 5<hr>free</div>` read "Room 5free", and she sees two lines.
  test('text: an element that is not laid out in a line parts the texts on either side of it, even when it holds none: a rule, an empty block, a picture drawn as a block', async () => {
    const body = [
      '<div data-ux="rule">Room 5<hr>free</div>',
      '<div data-ux="empty">Ro<div></div>om</div>',
      '<div data-ux="picture">Room 6<img alt="" style="display: block">free</div>',
      '<div data-ux="unseen">Room 7<div style="visibility: hidden"></div>free</div>',
      // What takes no place in the page parts nothing; nor does what sits in the line, or has no box of its own.
      '<div data-ux="none">Ro<div hidden></div>om</div>',
      '<div data-ux="styled-none">Ro<hr style="display: none">om</div>',
      '<div data-ux="in-line">Ro<span></span><b style="display: inline-block"></b>om</div>',
      '<div data-ux="no-box">Ro<div style="display: contents"></div>om</div>',
      // Inside what is not shown, a block parts nothing: none of it is read.
      '<div data-ux="inside-hidden">Ro<span hidden><hr></span>om</div>',
      // One space however many stand between, and none at either end.
      '<div data-ux="several"><hr>Room 8<hr><div></div><hr>free<hr></div>',
      '<p data-ux="around">Room <span style="display: block"></span> 9</p>',
    ].join('');
    const ids = ['rule', 'empty', 'picture', 'unseen', 'none', 'styled-none', 'in-line', 'no-box', 'inside-hidden', 'several', 'around'];
    const results = await evaluate(body, ids.map(id => c(id, 'text', { matches: '.' })));
    assert.deepEqual(shown(results), [
      ['rule', true, 'Room 5 free', ''],
      ['empty', true, 'Ro om', ''],
      ['picture', true, 'Room 6 free', ''],
      ['unseen', true, 'Room 7 free', ''],
      ['none', true, 'Room', ''],
      ['styled-none', true, 'Room', ''],
      ['in-line', true, 'Room', ''],
      ['no-box', true, 'Room', ''],
      ['inside-hidden', true, 'Room', ''],
      ['several', true, 'Room 8 free', ''],
      ['around', true, 'Room 9', ''],
    ]);
    // The file says its rule where it says the rest of what `text` reads.
    const source = readFileSync(INPAGE, 'utf8');
    const header = source.slice(0, source.indexOf('\n(function')).replace(/\n\/\/ ?/g, ' ').replace(/\s+/g, ' ');
    assert.ok(header.includes('or an element that is not laid out in a line and takes its place in the page, even an empty one, as a rule or an empty block'), 'the header says so');
    assert.doesNotMatch(header, /An empty block between two texts of one block adds nothing/);
  });

  test('order: each id after the one before it in the document; a container comes before what it holds', async () => {
    const body = '<p data-ux="a">a</p><div data-ux="list"><p data-ux="b">b</p></div><p data-ux="c">c</p>';
    const results = await evaluate(body, [
      { id: 'in-order', type: 'order', targets: ['a', 'b', 'c'] },
      { id: 'held', type: 'order', targets: ['list', 'b'] },
      { id: 'swapped', type: 'order', targets: ['a', 'c', 'b'] },
      { id: 'reversed', type: 'order', targets: ['b', 'list'] },
      { id: 'missing', type: 'order', targets: ['a', 'z'] },
      { id: 'twice', type: 'order', targets: ['a', 'b', 'a'] },
      { id: 'one', type: 'order', targets: ['a'] },
      { id: 'text', type: 'order', targets: 'a,b' },
      { id: 'blank', type: 'order', targets: ['a', ''] },
    ]);
    assert.deepEqual(shown(results), [
      ['in-order', true, ['a', 'b', 'c'], ''],
      ['held', true, ['list', 'b'], ''],
      ['swapped', false, ['a', 'b', 'c'], 'data-ux="b" comes before data-ux="c"'],
      ['reversed', false, ['list', 'b'], 'data-ux="list" comes before data-ux="b"'],
      ['missing', false, null, 'data-ux="z" not found'],
      ['twice', false, null, 'targets names "a" twice'],
      ['one', false, null, 'targets must be a list of at least two ids'],
      ['text', false, null, 'targets must be a list of at least two ids'],
      ['blank', false, null, 'targets must be a list of at least two ids'],
    ]);
  });

  test('in-viewport: the whole box inside the first viewport, without scrolling; a page scrolled since is measured as it was first seen, a fixed element where it stays', async () => {
    const body = [
      '<p data-ux="top" style="height: 20px">top</p>',
      '<p data-ux="edge" style="width: 390px; height: 20px">edge</p>',
      '<p data-ux="wide" style="width: 391px; height: 20px">wide</p>',
      '<p data-ux="left" style="margin-left: -1px; width: 100px; height: 20px">left</p>',
      '<p data-ux="up" style="position: absolute; left: 0; top: -1px; width: 100px; height: 20px">up</p>',
      '<p data-ux="bottom-edge" style="position: absolute; left: 0; top: 880px; width: 100px; height: 20px">bottom edge</p>',
      '<p data-ux="below" style="position: absolute; left: 0; top: 881px; width: 100px; height: 20px">below</p>',
      '<p data-ux="far" style="position: absolute; left: 0; top: 2000px; width: 100px; height: 20px">far</p>',
      '<p data-ux="pinned" style="position: fixed; left: 0; bottom: 0; width: 100px; height: 20px">pinned</p>',
      '<div style="position: fixed; top: 0; right: 0"><p data-ux="in-pinned" style="height: 20px; width: 50px">in pinned</p></div>',
      '<p data-ux="gone" hidden>gone</p>',
      '<div style="width: 3000px; height: 3000px"></div>',
    ].join('');
    const ids = ['top', 'edge', 'wide', 'left', 'up', 'bottom-edge', 'below', 'far', 'pinned', 'in-pinned', 'gone'];
    const expected = [
      ['top', true, { x: 0, y: 0, width: 390, height: 20 }, ''],
      ['edge', true, { x: 0, y: 20, width: 390, height: 20 }, ''],
      ['wide', false, { x: 0, y: 40, width: 391, height: 20 }, 'it is not inside the first viewport, 390 × 900: its right edge is at 391'],
      ['left', false, { x: -1, y: 60, width: 100, height: 20 }, 'it is not inside the first viewport, 390 × 900: its left edge is at -1'],
      ['up', false, { x: 0, y: -1, width: 100, height: 20 }, 'it is not inside the first viewport, 390 × 900: its top edge is at -1'],
      ['bottom-edge', true, { x: 0, y: 880, width: 100, height: 20 }, ''],
      ['below', false, { x: 0, y: 881, width: 100, height: 20 }, 'it is not inside the first viewport, 390 × 900: its bottom edge is at 901'],
      ['far', false, { x: 0, y: 2000, width: 100, height: 20 }, 'it is not inside the first viewport, 390 × 900: its bottom edge is at 2020'],
      ['pinned', true, { x: 0, y: 880, width: 100, height: 20 }, ''],
      ['in-pinned', true, { x: 340, y: 0, width: 50, height: 20 }, ''],
      ['gone', false, null, 'not rendered: display: none on data-ux="gone"'],
    ];
    // The page's own scroll bar is hidden, so the viewport is the whole width at every scroll.
    const head = '<style>html { scrollbar-width: none } p { margin: 0 }</style>';
    assert.deepEqual(shown(await evaluate(body, ids.map(id => c(id, 'in-viewport')), { head })), expected);
    // Scrolled 100 px across and 1500 px down: the far one is in view now, and is still not in the first
    // viewport; the fixed ones are where they stay.
    assert.deepEqual(shown(await evaluate(body, ids.map(id => c(id, 'in-viewport')), { head, then: () => window.scrollTo(100, 1500) })), expected);
    // A scroll bar the page shows is not part of the viewport: here one down the side, and then one along
    // the bottom, since the element is now wider than what is left.
    const scrolled = await evaluate('<p data-ux="edge" style="margin: 0; width: 390px; height: 20px">edge</p><div style="height: 3000px"></div>', [c('edge', 'in-viewport')]);
    assert.equal(scrolled[0].pass, false);
    assert.match(scrolled[0].message, /^it is not inside the first viewport, 3\d\d × 8\d\d: its right edge is at 390$/);
  });

  test('min-size: the box at least minWidth by minHeight; its size is shown to two decimals, never rounded up', async () => {
    const body = '<button data-ux="exact" style="all: unset; display: block; width: 44px; height: 44px">x</button><button data-ux="narrow" style="all: unset; display: block; width: 43.996px; height: 44px">x</button><button data-ux="short" style="all: unset; display: block; width: 44px; height: 43px">x</button><button data-ux="gone" style="display: none">x</button>';
    const results = await evaluate(body, [
      c('exact', 'min-size', { minWidth: 44, minHeight: 44 }),
      c('narrow', 'min-size', { minWidth: 44, minHeight: 44 }),
      c('short', 'min-size', { minWidth: 44, minHeight: 44 }),
      c('gone', 'min-size', { minWidth: 44, minHeight: 44 }),
      c('exact', 'min-size', { minHeight: 44 }),
      c('exact', 'min-size', { minWidth: 44, minHeight: 0 }),
      c('exact', 'min-size', { minWidth: '44', minHeight: 44 }),
      // What JSON cannot carry, a driver can hand the function.
      c('exact', 'min-size', { minWidth: Infinity, minHeight: 44 }),
      c('exact', 'min-size', { minWidth: 44, minHeight: NaN }),
    ]);
    assert.deepEqual(shown(results), [
      ['exact', true, { width: 44, height: 44 }, ''],
      ['narrow', false, { width: 43.98, height: 44 }, 'its box is 43.98 × 44, less than 44 × 44'],
      ['short', false, { width: 44, height: 43 }, 'its box is 44 × 43, less than 44 × 44'],
      ['gone', false, { width: 0, height: 0 }, 'its box is 0 × 0, less than 44 × 44'],
      ['exact', false, null, 'minWidth must be a number above 0'],
      ['exact', false, null, 'minHeight must be a number above 0'],
      ['exact', false, null, 'minWidth must be a number above 0'],
      ['exact', false, null, 'minWidth must be a number above 0'],
      ['exact', false, null, 'minHeight must be a number above 0'],
    ]);
  });

  test('contrast: the text colour against the nearest background that is not transparent, translucent ones laid over what is behind them, the WCAG ratio', async () => {
    const body = [
      '<div style="background: #ffffff"><p data-ux="grey" style="color: #767676">grey</p></div>',
      '<div style="background: #ffffff"><p data-ux="half-ink" style="color: rgba(0, 0, 0, 0.5)">half ink</p></div>',
      '<div style="background: #000000"><div style="background: rgba(255, 255, 255, 0.5)"><p data-ux="veil" style="color: #000000">veil</p></div></div>',
      '<p data-ux="bare" style="color: #767676">bare</p>',
      '<div style="background: #000000"><button data-ux="own" style="background: #ffffff; color: #000000">own</button></div>',
      '<div style="background: #ffffff"><p data-ux="modern" style="color: oklch(0 0 0)">modern</p></div>',
      '<div style="background: #ffffff"><p data-ux="see-through" style="color: transparent">see-through</p></div>',
      '<div style="background: #ffffff"><p data-ux="red" style="color: #ff0000">red</p></div>',
      '<div style="background: #ffffff"><p data-ux="blue" style="color: #0000ff">blue</p></div>',
    ].join('');
    const ids = ['grey', 'half-ink', 'veil', 'bare', 'own', 'modern', 'see-through', 'red', 'blue'];
    const results = await evaluate(body, [...ids.map(id => c(id, 'contrast', { min: 4.5 })), c('grey', 'contrast', { min: 4.55 }), c('grey', 'contrast', {}), c('grey', 'contrast', { min: 22 }), c('grey', 'contrast', { min: 0.5 }), c('grey', 'contrast', { min: '4.5' }), c('see-through', 'contrast', { min: 1 })]);
    assert.deepEqual(shown(results), [
      // #767676 on white: 4.54.
      ['grey', true, 4.54, ''],
      // Half-black ink laid on white is a grey of 127.5 each way: 3.97.
      ['half-ink', false, 3.97, 'the contrast is 3.97, less than 4.5'],
      // Half-white over black is the same grey behind black text: 5.28, not the 21 of black on white.
      ['veil', true, 5.28, ''],
      // No background anywhere: the canvas, white in light.
      ['bare', true, 4.54, ''],
      // Its own background is the nearest.
      ['own', true, 21, ''],
      // A colour written in another space is read in sRGB.
      ['modern', true, 21, ''],
      ['see-through', false, 1, 'the contrast is 1, less than 4.5'],
      // Each channel weighs what WCAG says: red 0.2126, blue 0.0722 (and green the rest).
      ['red', false, 3.99, 'the contrast is 3.99, less than 4.5'],
      ['blue', true, 8.59, ''],
      ['grey', false, 4.54, 'the contrast is 4.54, less than 4.55'],
      ['grey', false, null, 'min must be a number from 1 to 21'],
      ['grey', false, null, 'min must be a number from 1 to 21'],
      ['grey', false, null, 'min must be a number from 1 to 21'],
      ['grey', false, null, 'min must be a number from 1 to 21'],
      // A ratio of exactly the minimum passes.
      ['see-through', true, 1, ''],
    ]);
  });

  test('contrast: the canvas is dark when the page asks for a dark scheme and the theme is dark, else white', async () => {
    const body = '<p data-ux="ink" style="color: #767676">ink</p>';
    const ratio = async (theme, head) => (await evaluate(body, [c('ink', 'contrast', { min: 1 })], { theme, head }))[0].actual;
    // #767676 on #121212, the dark canvas: 4.12.
    assert.equal(await ratio('dark', '<style>:root { color-scheme: light dark }</style>'), 4.12);
    assert.equal(await ratio('dark', '<meta name="color-scheme" content="dark light">'), 4.12);
    assert.equal(await ratio('light', '<style>:root { color-scheme: dark }</style>'), 4.12);
    assert.equal(await ratio('light', '<style>:root { color-scheme: light dark }</style>'), 4.54);
    assert.equal(await ratio('dark', ''), 4.54);
    assert.equal(await ratio('dark', '<style>:root { color-scheme: light }</style>'), 4.54);
  });

  test('count: the elements whose data-ux starts with the target, inside the screen when one is named', async () => {
    const body = '<section data-screen="today"><ul data-ux="rooms"><li data-ux="room-1">1</li><li data-ux="room-2" hidden>2</li></ul></section><section data-screen="book"><p data-ux="room-3">3</p></section><p data-ux="spare-room-4">4</p><div hidden><p data-ux="row-1">1</p><p data-ux="row-2">2</p></div><details><summary data-ux="later-label">Later</summary><p data-ux="later-1">1</p></details><p data-ux="tag-1" style="height: 0; margin: 0"></p>';
    const results = await evaluate(body, [
      c('room-', 'count', { equals: 2 }),
      c('room-', 'count', { equals: 1, screen: 'today' }),
      c('room-', 'count', { equals: 1, screen: 'book' }),
      c('room', 'count', { equals: 4 }),
      // Two rows there and hidden; one in a closed expansion, beside its label.
      c('row-', 'count', { equals: 2 }),
      c('later-', 'count', { equals: 1 }),
      // A box of no size is counted: its box is not asked about.
      c('tag-', 'count', { equals: 1 }),
      c('desk-', 'count', { equals: 0 }),
      c('room-', 'count', { equals: -1 }),
      c('room-', 'count', { equals: 1.5 }),
      c('room-', 'count', {}),
    ]);
    assert.deepEqual(shown(results), [
      ['room-', true, 2, ''],
      ['room-', true, 1, ''],
      ['room-', true, 1, ''],
      ['room', false, 3, '3 rendered elements have a data-ux starting with "room"; the check wants 4; 1 more is there and not rendered'],
      ['row-', false, 0, '0 rendered elements have a data-ux starting with "row-"; the check wants 2; 2 more are there and not rendered'],
      ['later-', true, 1, ''],
      ['tag-', true, 1, ''],
      ['desk-', true, 0, ''],
      ['room-', false, null, 'equals must be a whole number from 0'],
      ['room-', false, null, 'equals must be a whole number from 0'],
      ['room-', false, null, 'equals must be a whole number from 0'],
    ]);
  });

  test('rendered means painted: a closed expansion hides all but its summary, and so do hidden="until-found" and content-visibility: hidden, as the browser says; where it cannot say, a closed <details> still hides', async () => {
    const body = [
      '<details class="ux-expansion"><summary data-ux="closed-label">Later <span data-ux="in-label">today</span></summary><p data-ux="closed-item">Room 1, free from 10:00</p><summary data-ux="second-summary">Not its summary</summary></details>',
      '<details class="ux-expansion" open><summary data-ux="open-label">Free 9:40 to 11:15</summary><p data-ux="open-item">Book Sala Jardín</p></details>',
      '<div hidden="until-found"><p data-ux="found-later">Room 3</p></div>',
      '<div class="skipped" style="content-visibility: hidden"><p data-ux="skipped">Gym</p></div>',
    ].join('');
    const ids = ['closed-label', 'in-label', 'closed-item', 'second-summary', 'open-label', 'open-item', 'found-later', 'skipped'];
    const checks = [...ids.map(id => c(id, 'visible')), ...ids.map(id => ({ ...c(id, 'absent'), id: `${id}-absent` }))];
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    const closed = 'not rendered: inside the closed <details class="ux-expansion">';
    const absentFails = id => [`${id}-absent`, false, `data-ux="${id}" is rendered`];
    assert.deepEqual(said(await evaluate(body, checks)), [
      ['closed-label', true, ''],
      ['in-label', true, ''],
      ['closed-item', false, closed],
      ['second-summary', false, closed],
      ['open-label', true, ''],
      ['open-item', true, ''],
      ['found-later', false, 'not rendered: hidden="until-found" on <div>'],
      ['skipped', false, 'not rendered: content-visibility: hidden on <div class="skipped">'],
      absentFails('closed-label'),
      absentFails('in-label'),
      ['closed-item-absent', true, ''],
      ['second-summary-absent', true, ''],
      absentFails('open-label'),
      absentFails('open-item'),
      ['found-later-absent', true, ''],
      ['skipped-absent', true, ''],
    ]);
    // A browser with no checkVisibility: a closed <details> is still read; what only the browser knows is not.
    const without = await evaluate(body, checks, { then: () => delete Element.prototype.checkVisibility });
    assert.deepEqual(said(without).slice(0, 8), [
      ['closed-label', true, ''],
      ['in-label', true, ''],
      ['closed-item', false, closed],
      ['second-summary', false, closed],
      ['open-label', true, ''],
      ['open-item', true, ''],
      ['found-later', true, ''],
      ['skipped', true, ''],
    ]);
  });

  test('contrast is measured from declared colours alone, and refuses to guess over a background-image, an opacity, a filter, a backdrop-filter or a blend mode, on the element or an element it is in', async () => {
    const on = (id, style, text = 'color: #000000') => `<div style="background: #ffffff"><p data-ux="${id}" style="${text}; ${style}">${id}</p></div>`;
    const under = (id, style) => `<div class="under" style="background: #ffffff; ${style}"><p data-ux="${id}" style="color: #000000">${id}</p></div>`;
    const body = [
      on('image', 'background-image: linear-gradient(#111111, #222222)'),
      `<div style="background-color: transparent; background-image: linear-gradient(#111111, #222222)"><p data-ux="image-under" style="color: #ffffff">image under</p></div>`,
      // An image on the nearest opaque background is refused; one further behind it is hidden by it.
      under('image-on-opaque', 'background-image: linear-gradient(#111111, #222222)'),
      `<div style="background-image: linear-gradient(#111111, #222222)"><div style="background: #ffffff"><p data-ux="image-hidden" style="color: #000000">image hidden</p></div></div>`,
      on('faded', 'opacity: 0.2'),
      under('faded-under', 'opacity: 0.3'),
      `<div style="opacity: 0.5"><div style="background: #ffffff"><p data-ux="faded-far" style="color: #000000">faded far</p></div></div>`,
      on('blurred', 'filter: blur(1px)'),
      under('blurred-under', 'filter: grayscale(1)'),
      on('frosted', 'backdrop-filter: blur(4px)'),
      under('frosted-under', 'backdrop-filter: blur(4px)'),
      on('blended', 'mix-blend-mode: multiply'),
      under('blended-under', 'mix-blend-mode: difference'),
      // What it does measure, as before.
      '<div style="background: #ffffff"><p data-ux="black" style="color: #000000">black</p></div>',
      '<div style="background: #ffffff"><p data-ux="grey" style="color: #767676">grey</p></div>',
      '<div style="background: #ffffff"><div style="background: rgba(0, 0, 0, 0.5)"><p data-ux="translucent" style="color: rgba(0, 0, 0, 0.5)">translucent</p></div></div>',
    ].join('');
    const ids = ['image', 'image-under', 'image-on-opaque', 'image-hidden', 'faded', 'faded-under', 'faded-far', 'blurred', 'blurred-under', 'frosted', 'frosted-under', 'blended', 'blended-under', 'black', 'grey', 'translucent'];
    const refused = (property, element) => `cannot be measured: ${property} on ${element}`;
    assert.deepEqual(shown(await evaluate(body, ids.map(id => c(id, 'contrast', { min: 1 })))), [
      ['image', false, null, refused('background-image', '<p data-ux="image">')],
      ['image-under', false, null, refused('background-image', '<div>')],
      ['image-on-opaque', false, null, refused('background-image', '<div>')],
      ['image-hidden', true, 21, ''],
      ['faded', false, null, refused('opacity', '<p data-ux="faded">')],
      ['faded-under', false, null, refused('opacity', '<div>')],
      ['faded-far', false, null, refused('opacity', '<div>')],
      ['blurred', false, null, refused('filter', '<p data-ux="blurred">')],
      ['blurred-under', false, null, refused('filter', '<div>')],
      ['frosted', false, null, refused('backdrop-filter', '<p data-ux="frosted">')],
      ['frosted-under', false, null, refused('backdrop-filter', '<div>')],
      ['blended', false, null, refused('mix-blend-mode', '<p data-ux="blended">')],
      ['blended-under', false, null, refused('mix-blend-mode', '<div>')],
      ['black', true, 21, ''],
      ['grey', true, 4.54, ''],
      // Half-black text over half-black over white: 63.75 on 127.5.
      ['translucent', true, 2.61, ''],
    ]);
  });

  test("text is what is shown: a field's value, a select's chosen options, the text whose element is shown; an input that shows no text fails, naming its type", async () => {
    const body = [
      '<input data-ux="typed" value="Room 1">',
      '<input data-ux="named" value="Room 2">',
      '<input data-ux="empty" placeholder="Patient name">',
      '<textarea data-ux="note">first words</textarea>',
      '<select data-ux="room"><option>One</option><option selected>  Two\n rooms </option></select>',
      '<select data-ux="rooms" multiple><option selected>One</option><option>Two</option><option selected>Three</option></select>',
      ...['checkbox', 'radio', 'file', 'hidden', 'range', 'color', 'image', 'password'].map(type => `<input data-ux="${type}" type="${type}">`),
      '<p data-ux="partly">3 <span style="display: none">of 10 </span>free</p>',
      '<p data-ux="unseen">Free <span style="visibility: hidden">now</span></p>',
      '<p data-ux="seen-again" style="visibility: hidden">hidden <span style="visibility: visible">shown</span></p>',
      '<div data-ux="expansion"><details><summary>Later today</summary><p>Room 1</p></details></div>',
      '<div data-ux="blocks"><p>Room</p><p>2</p></div>',
      // A box of no height, its text hanging out of it, still shows that text.
      '<div data-ux="no-box"><div style="height: 0">hanging words</div></div>',
    ].join('');
    // Typed into, as a person would: the value changes, the markup does not.
    const typed = () => {
      document.querySelector('[data-ux=typed]').value = 'Sala Jardín';
      document.querySelector('[data-ux=note]').value = 'typed  over';
    };
    const checks = [
      c('typed', 'text', { equals: 'Sala Jardín' }),
      c('named', 'text', { equals: 'Room 2' }),
      c('empty', 'text', { equals: '' }),
      c('empty', 'text', { equals: 'Patient name' }),
      c('note', 'text', { equals: 'typed over' }),
      c('room', 'text', { equals: 'Two rooms' }),
      c('rooms', 'text', { equals: 'One, Three' }),
      ...['checkbox', 'radio', 'file', 'hidden', 'range', 'color', 'image', 'password'].map(type => c(type, 'text', { equals: '' })),
      c('partly', 'text', { equals: '3 free' }),
      c('unseen', 'text', { equals: 'Free' }),
      c('seen-again', 'text', { equals: 'shown' }),
      c('expansion', 'text', { equals: 'Later today' }),
      c('blocks', 'text', { equals: 'Room 2' }),
      c('no-box', 'text', { equals: 'hanging words' }),
    ];
    assert.deepEqual(shown(await evaluate(body, checks, { then: typed })), [
      ['typed', true, 'Sala Jardín', ''],
      ['named', true, 'Room 2', ''],
      ['empty', true, '', ''],
      ['empty', false, '', 'the text is "", not "Patient name"'],
      ['note', true, 'typed over', ''],
      ['room', true, 'Two rooms', ''],
      ['rooms', true, 'One, Three', ''],
      ...['checkbox', 'radio', 'file', 'hidden', 'range', 'color', 'image', 'password'].map(type => [type, false, null, `an <input type="${type}"> shows no text`]),
      ['partly', true, '3 free', ''],
      ['unseen', true, 'Free', ''],
      ['seen-again', true, 'shown', ''],
      ['expansion', true, 'Later today', ''],
      ['blocks', true, 'Room 2', ''],
      ['no-box', true, 'hanging words', ''],
    ]);
  });

  test('in-viewport: inside every element that clips it, as each is scrolled now, on the axes each clips', async () => {
    const body = [
      '<div class="scroller" style="height: 100px; overflow: auto"><p data-ux="inside" style="margin: 0; height: 20px">inside</p><p data-ux="beyond" style="margin: 480px 0 0; height: 20px">beyond</p></div>',
      '<div class="narrow" style="width: 100px; overflow-x: hidden"><p data-ux="aside" style="margin: 0 0 0 150px; width: 20px; height: 20px">aside</p></div>',
      // Clipped across only: what hangs below it is not cut.
      '<div class="flat" style="width: 100px; height: 10px; overflow-x: clip"><p data-ux="hanging" style="margin: 0; width: 20px; height: 40px">hanging</p></div>',
      // Clipped down only: what sticks out to the side is not cut.
      '<div class="short" style="width: 100px; height: 50px; overflow-y: clip"><p data-ux="sticking" style="margin: 0; width: 150px; height: 20px">sticking</p></div>',
      '<div class="offset" style="margin-left: 100px; width: 100px; overflow: hidden"><p data-ux="left-out" style="margin: 0 0 0 -50px; width: 20px; height: 20px">left out</p></div>',
      // The clip is the padding box: under a border is cut.
      '<div class="bordered" style="border: 10px solid #000000; width: 100px; overflow: hidden"><p data-ux="under-left" style="margin: 0 0 0 -5px; width: 20px; height: 20px">l</p></div>',
      '<div class="bordered" style="border: 10px solid #000000; width: 100px; height: 100px; overflow: hidden"><p data-ux="under-top" style="margin: -5px 0 0 30px; width: 20px; height: 20px">t</p></div>',
      '<div class="bordered" style="border: 10px solid #000000; width: 100px; height: 30px; overflow: hidden"><p data-ux="under-bottom" style="margin: 0; width: 20px; height: 35px">b</p></div>',
      // A scroll bar is not part of what shows.
      '<div class="barred" style="width: 100px; height: 50px; overflow-y: scroll; overflow-x: hidden"><p data-ux="under-bar" style="margin: 0; width: 100px; height: 20px">under the bar</p></div>',
    ].join('');
    const ids = ['inside', 'beyond', 'aside', 'hanging', 'sticking', 'left-out', 'under-left', 'under-top', 'under-bottom', 'under-bar'];
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    assert.deepEqual(said(await evaluate(body, ids.map(id => c(id, 'in-viewport')))), [
      ['inside', true, ''],
      ['beyond', false, 'it is clipped by <div class="scroller">'],
      ['aside', false, 'it is clipped by <div class="narrow">'],
      ['hanging', true, ''],
      ['sticking', true, ''],
      ['left-out', false, 'it is clipped by <div class="offset">'],
      ['under-left', false, 'it is clipped by <div class="bordered">'],
      ['under-top', false, 'it is clipped by <div class="bordered">'],
      ['under-bottom', false, 'it is clipped by <div class="bordered">'],
      ['under-bar', false, 'it is clipped by <div class="barred">'],
    ]);
    // The page's own overflow is the viewport's: a body that hides it clips nothing in the first viewport.
    const page = await evaluate('<div style="height: 500px"></div><p data-ux="low" style="margin: 0; height: 20px">low</p>', [c('low', 'in-viewport')], { head: '<style>body { overflow: hidden; height: 100px }</style>' });
    assert.deepEqual(said(page), [['low', true, '']]);
    // Scrolled down inside it: what was beyond is in its visible part now, and what was inside is not; it
    // has gone up past the top of the page's first viewport too, and both are said.
    const scrolled = await evaluate(body, ids.map(id => c(id, 'in-viewport')), { then: () => (document.querySelector('.scroller').scrollTop = 450) });
    assert.deepEqual(said(scrolled).slice(0, 2), [
      ['inside', false, 'it is not inside the first viewport, 390 × 900: its top edge is at -420; it is clipped by <div class="scroller">'],
      ['beyond', true, ''],
    ]);
  });

  test('in-viewport follows the containing blocks: a box clips what it holds, with a pixel of play; what escapes it (an absolute or a fixed element it does not hold) is not clipped by it', async () => {
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    const head = '<style>p { margin: 0 } .clip { width: 100px; height: 100px; overflow: hidden }</style>';
    const body = [
      // Boxes in fractions of a pixel, their client sizes in whole ones.
      '<div class="card-n" style="overflow: hidden"><p data-ux="line" style="font: 16px/1.4 sans-serif">Room 2, free until 10:30</p></div>',
      '<div style="width: 200.3px; overflow: hidden"><p data-ux="wide-line">Sala Jardín</p></div>',
      '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr"><div style="overflow: hidden"><p data-ux="cell">Room 1</p></div><div></div><div></div></div>',
      // An inline box clips nothing.
      '<p><span style="overflow: hidden"><b data-ux="in-inline">Room 3</b></span></p>',
      // Half a pixel over passes; a pixel and a half does not.
      '<div style="height: 20px; overflow: hidden"><p data-ux="half-over" style="height: 20.5px">a</p></div>',
      '<div class="over" style="height: 20px; overflow: hidden"><p data-ux="more-over" style="height: 21.5px">b</p></div>',
      // contain: paint clips with overflow visible.
      '<div class="painted" style="height: 100px; contain: paint"><p data-ux="painted-low" style="margin-top: 300px">low</p></div>',
      // A box with display: contents has none to clip with.
      '<div style="display: contents; overflow: hidden"><p data-ux="in-contents">Room 4</p></div>',
    ].join('');
    const ids = ['line', 'wide-line', 'cell', 'in-inline', 'half-over', 'more-over', 'painted-low', 'in-contents'];
    assert.deepEqual(said(await evaluate(body, ids.map(id => c(id, 'in-viewport')), { head })), [
      ['line', true, ''],
      ['wide-line', true, ''],
      ['cell', true, ''],
      ['in-inline', true, ''],
      ['half-over', true, ''],
      ['more-over', false, 'it is clipped by <div class="over">'],
      ['painted-low', false, 'it is clipped by <div class="painted">'],
      ['in-contents', true, ''],
    ]);
    // An absolute and a fixed element in a static clipping box escape it; once the box is positioned it
    // holds the absolute one, and once it holds all (a transform, and the like) it holds the fixed one.
    const escaping = clip => `<div class="clip" style="${clip}"><p data-ux="absolute" style="position: absolute; top: 150px; left: 0">a</p><p data-ux="fixed" style="position: fixed; top: 150px; left: 0">f</p></div>`;
    const both = [c('absolute', 'in-viewport'), c('fixed', 'in-viewport')];
    const cut = id => [id, false, 'it is clipped by <div class="clip">'];
    assert.deepEqual(said(await evaluate(escaping(''), both, { head })), [['absolute', true, ''], ['fixed', true, '']]);
    assert.deepEqual(said(await evaluate(escaping('position: relative'), both, { head })), [cut('absolute'), ['fixed', true, '']]);
    for (const holds of ['transform: translateX(0)', 'perspective: 100px', 'filter: blur(0)', 'backdrop-filter: blur(0)', 'contain: layout', 'contain: paint', 'contain: strict', 'contain: content', 'will-change: transform', 'will-change: perspective', 'will-change: filter', 'translate: 0px 0px', 'scale: 0.95', 'rotate: 0deg']) {
      assert.deepEqual(said(await evaluate(escaping(holds), both, { head })), [cut('absolute'), cut('fixed')], holds);
    }
    // A query container holds neither: both escape it, painted.
    assert.deepEqual(said(await evaluate(escaping('container-type: inline-size'), both, { head })), [['absolute', true, ''], ['fixed', true, '']]);
    // The walk goes on from the block it found: a box in between is passed over; the block's own block is not.
    const chain = [
      '<div class="clip outer" style="position: relative"><div class="between" style="width: 50px; height: 50px; overflow: hidden"><p data-ux="passed-over" style="position: absolute; top: 60px">p</p></div></div>',
      '<div class="clip wrapping"><div style="position: relative; height: 20px"><p data-ux="by-its-block" style="position: absolute; top: 150px">w</p></div></div>',
      // Its block escapes the clipping box in turn, so neither is clipped by it.
      '<div style="position: relative"><div class="clip escaped"><div style="position: absolute; top: 150px; left: 0; width: 50px; height: 50px"><p data-ux="nested-escape" style="position: absolute; top: 0">n</p></div></div></div>',
    ].join('');
    assert.deepEqual(said(await evaluate(chain, [c('passed-over', 'in-viewport'), c('by-its-block', 'in-viewport'), c('nested-escape', 'in-viewport')], { head })), [
      ['passed-over', true, ''],
      ['by-its-block', false, 'it is clipped by <div class="clip wrapping">'],
      ['nested-escape', true, ''],
    ]);
  });

  test("in-viewport: the page's body clips only when the page's own overflow is not visible; a clipping box drawn scaled is measured as drawn", async () => {
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    const low = '<div style="height: 500px"></div><p data-ux="low" style="margin: 0; height: 20px">low</p>';
    assert.deepEqual(said(await evaluate(low, [c('low', 'in-viewport')], { head: '<style>html { overflow: hidden } body { overflow: hidden; height: 100px }</style>' })), [['low', false, 'it is clipped by <body>']]);
    assert.deepEqual(said(await evaluate(low, [c('low', 'in-viewport')], { head: '<style>body { overflow: hidden; height: 100px }</style>' })), [['low', true, '']]);
    // The page's first box never clips: what is below the first viewport is said once, as that.
    const far = '<div style="height: 1000px"></div><p data-ux="far" style="margin: 0; height: 20px">far</p>';
    assert.deepEqual(said(await evaluate(far, [c('far', 'in-viewport')], { head: '<style>html { overflow: hidden }</style>' })), [['far', false, 'it is not inside the first viewport, 390 × 900: its bottom edge is at 1020']]);
    const scaled = [
      '<div style="transform: scale(0.5); transform-origin: 0 0"><div class="scaled" style="width: 600px; height: 200px; overflow: hidden"><p data-ux="drawn-in" style="margin: 0 0 0 500px; width: 90px">in</p><p data-ux="drawn-out" style="margin: 0 0 0 650px; width: 90px">out</p><p data-ux="drawn-below" style="margin: 250px 0 0; width: 90px">below</p></div></div>',
      '<div style="zoom: 2"><div class="zoomed" style="width: 150px; height: 40px; overflow: hidden"><p data-ux="zoomed-in" style="margin: 0 0 0 100px; width: 40px; height: 10px">in</p><p data-ux="zoomed-out" style="margin: 0 0 0 140px; width: 40px; height: 10px">out</p></div></div>',
    ].join('');
    assert.deepEqual(said(await evaluate(scaled, ['drawn-in', 'drawn-out', 'drawn-below', 'zoomed-in', 'zoomed-out'].map(id => c(id, 'in-viewport')))), [
      ['drawn-in', true, ''],
      ['drawn-out', false, 'it is clipped by <div class="scaled">'],
      ['drawn-below', false, 'it is clipped by <div class="scaled">'],
      ['zoomed-in', true, ''],
      ['zoomed-out', false, 'it is clipped by <div class="zoomed">'],
    ]);
  });

  test('display: contents: its content is painted when that of the nearest element with a box is; it has no box of its own for visible, min-size and in-viewport', async () => {
    const body = [
      '<div style="display: grid; grid-template-columns: 1fr 1fr"><div data-ux="row-1" style="display: contents"><span>Room 1</span><span>free</span></div><div data-ux="row-2" style="display: contents"><span>Room 2</span><span>busy</span></div></div>',
      '<p data-ux="greeting"><span style="display: contents">Hello</span> world</p>',
      '<div style="display: none"><div data-ux="gone-1" style="display: contents"><span>x</span></div></div>',
      '<div style="content-visibility: hidden"><div data-ux="skipped-1" style="display: contents"><span>y</span></div></div>',
    ].join('');
    const results = await evaluate(body, [
      c('row-', 'count', { equals: 2 }),
      c('greeting', 'text', { equals: 'Hello world' }),
      c('gone-', 'count', { equals: 0 }),
      c('skipped-', 'count', { equals: 0 }),
      c('row-1', 'text', { equals: 'Room 1 free' }),
      c('row-1', 'visible'),
      c('row-1', 'min-size', { minWidth: 1, minHeight: 1 }),
      c('row-1', 'in-viewport'),
      c('row-1', 'absent'),
      c('gone-1', 'absent'),
    ]);
    const noBox = 'data-ux="row-1" has no box of its own (display: contents): name an element inside it';
    assert.deepEqual(shown(results), [
      ['row-', true, 2, ''],
      ['greeting', true, 'Hello world', ''],
      ['gone-', true, 0, ''],
      ['skipped-', true, 0, ''],
      ['row-1', true, 'Room 1 free', ''],
      ['row-1', false, null, noBox],
      ['row-1', false, null, noBox],
      ['row-1', false, null, noBox],
      // Its content is shown: it is not absent.
      ['row-1', false, 1, 'data-ux="row-1" is rendered'],
      ['gone-1', true, 0, ''],
    ]);
  });

  test('a field that is not painted reads ""; an element whose own content-visibility is hidden shows none of its content', async () => {
    const body = [
      '<input data-ux="hidden-field" value="Room 2" style="display: none">',
      '<details><summary>Later</summary><input data-ux="closed-input" value="Room 3"><select data-ux="closed-select"><option selected>Sala Jardín</option></select><textarea data-ux="closed-note">Walk-in</textarea></details>',
      '<input data-ux="shown-field" value="Room 4">',
      '<p data-ux="until-found" hidden="until-found">Secret too</p>',
      '<p data-ux="own-hidden" style="content-visibility: hidden; padding: 4px">Secret</p>',
      '<div><p data-ux="slot-1">Room 1</p><p data-ux="slot-2" style="content-visibility: hidden">Room 2</p></div>',
    ].join('');
    const results = await evaluate(body, [
      c('hidden-field', 'text', { equals: '' }),
      c('closed-input', 'text', { equals: '' }),
      c('closed-select', 'text', { equals: '' }),
      c('closed-note', 'text', { equals: '' }),
      c('shown-field', 'text', { equals: 'Room 4' }),
      c('until-found', 'text', { equals: '' }),
      c('own-hidden', 'text', { equals: '' }),
      c('own-hidden', 'visible'),
      c('until-found', 'visible'),
      c('own-hidden', 'absent'),
      c('until-found', 'absent'),
      c('slot-', 'count', { equals: 2 }),
    ]);
    assert.deepEqual(shown(results), [
      ['hidden-field', true, '', ''],
      ['closed-input', true, '', ''],
      ['closed-select', true, '', ''],
      ['closed-note', true, '', ''],
      ['shown-field', true, 'Room 4', ''],
      ['until-found', true, '', ''],
      ['own-hidden', true, '', ''],
      ['own-hidden', false, { width: 390, height: 8 }, 'not rendered: content-visibility: hidden on data-ux="own-hidden"'],
      ['until-found', false, { width: 390, height: 0 }, 'not rendered: hidden="until-found" on data-ux="until-found"'],
      ['own-hidden', true, 0, ''],
      ['until-found', true, 0, ''],
      // One rendered element; the grammar agrees with the number.
      ['slot-', false, 1, '1 rendered element has a data-ux starting with "slot-"; the check wants 2; 1 more is there and not rendered'],
    ]);
  });

  test("a container's text leaves out the fields in it: a textarea's own text, typed over, is not a container's; a submit with no value and a date read their value", async () => {
    const body = '<fieldset data-ux="patient"><legend>Patient</legend> <label>Note <textarea>first words</textarea></label></fieldset><input data-ux="send" type="submit"><input data-ux="when" type="date" value="2026-11-14">';
    const typed = () => (document.querySelector('textarea').value = 'typed over');
    assert.deepEqual(shown(await evaluate(body, [c('patient', 'text', { equals: 'Patient Note' }), c('send', 'text', { equals: '' }), c('when', 'text', { equals: '2026-11-14' })], { then: typed })), [
      ['patient', true, 'Patient Note', ''],
      ['send', true, '', ''],
      ['when', true, '2026-11-14', ''],
    ]);
  });

  test('in-viewport asks the browser what it clipped, and agrees with what the page paints', async () => {
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    const cases = [
      // A toast fixed to the screen, written in a query container inside a scrolling main: painted.
      ['<main class="scroll" style="height: 300px; overflow: auto"><section style="container-type: inline-size"><div data-ux="toast" style="position: fixed; bottom: 16px; left: 16px; width: 100px; height: 30px">Saved</div></section></main>', 'toast', true, ''],
      // A menu in a query-container card that hides its overflow: the card holds it not.
      ['<div class="card" style="container-type: inline-size; overflow: hidden; height: 40px"><ul data-ux="menu" style="position: absolute; top: 400px; left: 0; margin: 0; width: 100px"><li>Room 1</li></ul></div>', 'menu', true, ''],
      // A drawer that translates holds the fixed flyout written in it, and cuts it.
      ['<div class="drawer" style="position: fixed; top: 0; left: 0; width: 200px; height: 300px; translate: 0px 0px; overflow: hidden"><div data-ux="flyout" style="position: fixed; top: 20px; left: 250px; width: 80px; height: 40px">Flyout</div></div>', 'flyout', false, 'it is clipped by <div class="drawer">'],
      // A card at scale 0.95 holds the absolute element written in it, and cuts it.
      ['<div class="scaled-card" style="scale: 0.95; overflow: hidden; width: 200px; height: 100px"><p data-ux="scaled-tail" style="position: absolute; top: 150px; margin: 0">tail</p></div>', 'scaled-tail', false, 'it is clipped by <div class="scaled-card">'],
      // content-visibility: auto cuts what overflows it.
      ['<div class="lazy" style="content-visibility: auto; height: 100px"><p data-ux="lazy-low" style="margin: 300px 0 0; height: 20px">low</p></div>', 'lazy-low', false, 'it is clipped by <div class="lazy">'],
      // An <svg> cuts a label written outside it, and not one inside it: left inline, as it is written.
      ['<svg class="chart" width="100" height="50" style="margin-left: 100px"><text data-ux="label-out" x="-50" y="20">Label out</text></svg>', 'label-out', false, 'it is clipped by <svg class="chart">'],
      ['<svg class="chart" width="100" height="50"><text data-ux="label-in" x="10" y="30">In</text></svg>', 'label-in', true, ''],
      // A clip-path cuts the absolute and the fixed element written in it, and what its own inset cuts.
      ['<div class="cp" style="clip-path: inset(0); width: 100px; height: 100px"><p data-ux="cp-absolute" style="position: absolute; top: 150px; margin: 0">a</p></div>', 'cp-absolute', false, 'it is clipped by <div class="cp">'],
      ['<div class="cp" style="clip-path: inset(0); width: 100px; height: 100px"><p data-ux="cp-fixed" style="position: fixed; top: 200px; left: 0; margin: 0">f</p></div>', 'cp-fixed', false, 'it is clipped by <div class="cp">'],
      // Its edges are cut and its centre is not: cut, though the page paints its centre.
      ['<div class="inset" style="clip-path: inset(10px); width: 100px; height: 100px"><p data-ux="cp-inner" style="margin: 0; height: 100px">i</p></div>', 'cp-inner', false, 'it is clipped by <div class="inset">', true],
      // Inside a clip-path that cuts nothing: the browser is asked, and finds it; a rule one pixel high too.
      ['<div class="whole" style="clip-path: inset(0); width: 100px; height: 100px"><p data-ux="cp-whole" style="margin: 0; height: 50px">w</p></div>', 'cp-whole', true, ''],
      ['<div class="whole" style="clip-path: inset(0); width: 100px; height: 100px"><div data-ux="rule" style="height: 1px; background: #000000"></div></div>', 'rule', true, ''],
      ['<div class="whole" style="clip-path: inset(0); width: 100px; height: 100px"><div data-ux="upright" style="width: 1px; height: 50px; background: #000000"></div></div>', 'upright', true, ''],
      // A link with an empty line in it: its empty line box is not pointed at. The centre of its whole box
      // falls on that empty line, where the page finds nothing of it: each line is pointed at instead.
      ['<div class="whole" style="clip-path: inset(0); width: 200px"><a data-ux="blank-line" href="#">Room 2<br><br>Sala Jardín</a></div>', 'blank-line', true, '', false],
      // Outside a box that hides its overflow, inside one with a clip-path: the first is named.
      ['<div class="outer-cp" style="clip-path: inset(0)"><div class="inner" style="width: 100px; height: 100px; overflow: hidden"><p data-ux="both-clips" style="margin: 0 0 0 150px; width: 50px">b</p></div></div>', 'both-clips', false, 'it is clipped by <div class="inner">'],
      // Clipped on one axis only, each way.
      ['<div class="across" style="width: 100px; overflow-x: clip"><p data-ux="clip-x" style="margin: 0 0 0 150px; width: 50px">x</p></div>', 'clip-x', false, 'it is clipped by <div class="across">'],
      ['<div class="down" style="height: 50px; overflow-y: clip"><div style="height: 100px"></div><p data-ux="clip-y" style="margin: 0; height: 20px">y</p></div>', 'clip-y', false, 'it is clipped by <div class="down">'],
      // contain: strict and contain: content hold paint containment too.
      ['<div class="strict" style="height: 100px; contain: strict"><p data-ux="strict-low" style="margin: 300px 0 0; height: 20px">s</p></div>', 'strict-low', false, 'it is clipped by <div class="strict">'],
      ['<div class="content" style="height: 100px; contain: content"><p data-ux="content-low" style="margin: 300px 0 0; height: 20px">c</p></div>', 'content-low', false, 'it is clipped by <div class="content">'],
    ];
    for (const [body, id, pass, message, centre = pass] of cases) {
      const { results, painted } = await evaluateAndPoint(body, [c(id, 'in-viewport')]);
      assert.deepEqual(said(results), [[id, pass, message]], id);
      // What the function says is what the page paints at the element's centre.
      assert.equal(painted[0], centre, `${id}: the page paints it at its centre: ${painted[0]}`);
    }
    // A modal dialog opened in a transformed clipping box is in the top layer, painted in full.
    const modal = await evaluateAndPoint('<div class="held" style="transform: translateX(0); overflow: hidden; width: 100px; height: 100px"><dialog><button data-ux="modal-ok">OK, book it</button></dialog></div>', [c('modal-ok', 'in-viewport')], { then: () => document.querySelector('dialog').showModal() });
    assert.deepEqual([said(modal.results), modal.painted], [[['modal-ok', true, '']], [true]]);
  });

  test('in-viewport says "cannot be told" where pointing cannot answer, and never asks for what lies inside every box', async () => {
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    const clip = (attributes, id, style) => `<div class="pc" ${attributes} style="width: 100px; height: 100px; overflow: hidden"><p data-ux="${id}" style="margin: 0; height: 20px; ${style}">x</p></div>`;
    const asked = ', and the browser is asked by pointing at it';
    assert.deepEqual(said(await evaluate(clip('', 'no-pointer', 'pointer-events: none; margin-left: 150px; width: 50px'), [c('no-pointer', 'in-viewport')])), [['no-pointer', false, `cannot be told: it has pointer-events: none${asked}`]]);
    assert.deepEqual(said(await evaluate(clip('', 'no-pointer-in', 'pointer-events: none; width: 50px'), [c('no-pointer-in', 'in-viewport')])), [['no-pointer-in', true, '']]);
    // Inside its box by a fraction of a pixel's rounding: inside, and never asked.
    assert.deepEqual(said(await evaluate('<div style="overflow: hidden"><p data-ux="no-pointer-fraction" style="margin: 0; pointer-events: none; font: 16px/1.4 sans-serif">Room 2, free until 10:30</p></div>', [c('no-pointer-fraction', 'in-viewport')])), [['no-pointer-fraction', true, '']]);
    // A bordered box of a fractional height: its sizes rounded apart, its edges come out a hair off, and the
    // pixel of play keeps what fits it inside.
    assert.deepEqual(said(await evaluate('<div style="border: 1.5px solid #000000; height: 30.3px; overflow: hidden"><p data-ux="bordered-fraction" style="margin: 0; height: 30.3px; pointer-events: none">x</p></div>', [c('bordered-fraction', 'in-viewport')])), [['bordered-fraction', true, '']]);
    assert.deepEqual(said(await evaluate(clip('inert', 'inert-out', 'margin-left: 150px; width: 50px'), [c('inert-out', 'in-viewport')])), [['inert-out', false, `cannot be told: it is inert${asked}`]]);
    // Behind an open modal dialog: outside a clipping box it cannot be told; inside every box it passes.
    const behind = clip('', 'behind-out', 'margin-left: 150px; width: 50px') + clip('', 'behind-in', 'width: 50px') + '<dialog><p>Book Room 2?</p></dialog>';
    assert.deepEqual(said(await evaluate(behind, [c('behind-out', 'in-viewport'), c('behind-in', 'in-viewport')], { then: () => document.querySelector('dialog').showModal() })), [
      ['behind-out', false, `cannot be told: a modal dialog is open and it is not inside it${asked}`],
      ['behind-in', true, ''],
    ]);
    // On a page scrolled since, out of the window now: measured at the top, it would have been told.
    const escaped = '<div class="pc" style="width: 100px; height: 100px; overflow: hidden"><p data-ux="escaped" style="position: absolute; top: 150px; left: 0; margin: 0">e</p></div><div style="height: 3000px"></div>';
    assert.deepEqual(said(await evaluate(escaped, [c('escaped', 'in-viewport')], { then: () => window.scrollTo(0, 1000) })), [['escaped', false, 'cannot be told: the page is scrolled and it is not in the window now; measure at the top of the page']]);
    assert.deepEqual(said(await evaluate(escaped, [c('escaped', 'in-viewport')])), [['escaped', true, '']]);
    // Scrolled across, the same.
    const across = '<div class="pc" style="width: 100px; height: 100px; overflow: hidden"><p data-ux="across" style="position: absolute; top: 150px; left: 150px; margin: 0">a</p></div><div style="width: 3000px; height: 10px"></div>';
    assert.deepEqual(said(await evaluate(across, [c('across', 'in-viewport')], { then: () => window.scrollTo(1000, 0) })), [['across', false, 'cannot be told: the page is scrolled and it is not in the window now; measure at the top of the page']]);
    // Scrolled, and still in the window: the browser is asked, and finds it.
    const near = '<div style="height: 1000px"></div><div class="pc" style="width: 100px; height: 100px; overflow: hidden"><p data-ux="near" style="position: absolute; top: 1150px; left: 0; margin: 0">n</p></div><div style="height: 3000px"></div>';
    assert.deepEqual(said(await evaluate(near, [c('near', 'in-viewport')], { then: () => window.scrollTo(0, 1000) })), [['near', false, 'it is not inside the first viewport, 375 × 900: its bottom edge is at 1168']]);
  });

  test('in-viewport: a link wrapped over three lines is pointed at by the centre of each line, and passes when all of it shows', async () => {
    const body = '<div class="column" style="width: 160px; height: 300px; overflow: auto; clip-path: inset(0)"><p style="margin: 0">Free right now at the desk: <a data-ux="wrapped" href="#">Room 2, Sala Jardín, Room 3 and the gym</a> and more</p></div>';
    const { results, painted } = await evaluateAndPoint(body, [c('wrapped', 'in-viewport')]);
    assert.deepEqual(results.map(({ id, pass, message }) => [id, pass, message]), [['wrapped', true, '']]);
    assert.deepEqual(painted, [true]);
    // It does wrap over three lines, the last stopping short of its box's middle, where the five points of a
    // single box would find nothing of it.
    const context = await browser.newContext(contextOptions(390, 'light'));
    try {
      const page = await context.newPage();
      await page.setContent(`${STYLE}${body}`);
      const boxes = await page.evaluate(() => {
        const link = document.querySelector('[data-ux=wrapped]');
        const box = link.getBoundingClientRect();
        const rects = link.getClientRects();
        return { lines: rects.length, lastStopsShort: rects[rects.length - 1].right < box.left + box.width / 2 };
      });
      assert.deepEqual(boxes, { lines: 3, lastStopsShort: true });
    } finally {
      await context.close();
    }
    // In a column two lines high that hides the rest, its third line is cut.
    const cut = body.replace('height: 300px; overflow: auto', 'height: 36px; overflow: hidden');
    assert.deepEqual((await evaluate(cut, [c('wrapped', 'in-viewport')])).map(({ pass, message }) => [pass, message]), [[false, 'it is clipped by <div class="column">']]);
  });

  test('in-viewport asks the browser where a box reaches a rounded corner of an element that might cut it, and nowhere else', async () => {
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    const asked = ', and the browser is asked by pointing at it';
    // A round avatar 40 px across; and a card 300 px wide: a heading 48 px high flush with its top, what a
    // case puts in it, and a footer 42 px high.
    const avatar = (inside, radius = '50%') => `<div class="avatar" style="position: relative; width: 40px; height: 40px; border-radius: ${radius}; overflow: hidden; background: #cccccc">${inside}</div>`;
    const dot = '<span data-ux="dot" style="position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #00aa00"></span>';
    const photo = '<img data-ux="photo" alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display: block; width: 40px; height: 40px">';
    const card = (inside = '', rounding = 'border-radius: 12px') => `<div class="card" style="position: relative; width: 300px; ${rounding}; overflow: hidden; background: #eeeeee"><h2 data-ux="card-head" style="margin: 0; padding: 12px 16px; font: 600 16px/24px sans-serif">Room 2</h2>${inside}<p style="margin: 0; padding: 12px 16px">Sala Jardín</p></div>`;
    const middle = style => `<p data-ux="card-middle" style="margin: 0; padding: 0 16px; ${style}">Free until 10:30</p>`;
    const badge = place => `<span data-ux="badge" style="position: absolute; ${place}; width: 4px; height: 4px; background: #cc0000"></span>`;
    const cases = [
      // A status dot at the top right of the avatar is cut away by its rounding; a photo that fills it is not.
      [avatar(dot), 'dot', false, 'it is clipped by <div class="avatar">'],
      [avatar(photo), 'photo', true, ''],
      // The heading reaches both top corners of the card, and the browser finds it.
      [card(), 'card-head', true, ''],
      [card(middle('')), 'card-middle', true, ''],
      // A badge far into a corner of the card is cut away: each corner, on a card rounded there alone.
      [card(badge('top: 0; right: 0')), 'badge', false, 'it is clipped by <div class="card">'],
      [card(badge('top: 0; left: 0'), 'border-top-left-radius: 12px'), 'badge', false, 'it is clipped by <div class="card">'],
      [card(badge('top: 0; right: 0'), 'border-top-right-radius: 12px'), 'badge', false, 'it is clipped by <div class="card">'],
      [card(badge('bottom: 0; right: 0'), 'border-bottom-right-radius: 12px'), 'badge', false, 'it is clipped by <div class="card">'],
      [card(badge('bottom: 0; left: 0'), 'border-bottom-left-radius: 12px'), 'badge', false, 'it is clipped by <div class="card">'],
      // A radius that cannot be read (here 20 px, as a sum) counts as the whole box.
      [avatar(dot, 'calc(10px + 25%)'), 'dot', false, 'it is clipped by <div class="avatar">'],
    ];
    for (const [body, id, pass, message] of cases) {
      const { results, painted } = await evaluateAndPoint(body, [c(id, 'in-viewport')]);
      assert.deepEqual(said(results), [[id, pass, message]], body);
      // What the function says is what the page paints at the element's centre.
      assert.equal(painted[0], pass, `${id}: the page paints it at its centre: ${painted[0]}`);
    }
    // The line in the middle of the card reaches no corner: nothing can cut it, and the browser is not
    // asked, which it could not be of an element that takes no pointer events.
    assert.deepEqual(said(await evaluate(card(middle('pointer-events: none')), [c('card-middle', 'in-viewport')])), [['card-middle', true, '']]);
    // Nor of one that lies between two corners and touches both: along the top, down the left side.
    const between = card('<span data-ux="along-top" style="position: absolute; top: 0; left: 12px; right: 12px; height: 8px; pointer-events: none"></span><span data-ux="down-side" style="position: absolute; top: 12px; bottom: 12px; left: 0; width: 8px; pointer-events: none"></span>');
    assert.deepEqual(said(await evaluate(between, [c('along-top', 'in-viewport'), c('down-side', 'in-viewport')])), [['along-top', true, ''], ['down-side', true, '']]);
    // Nor for a box with square corners, half a pixel over one of them; a corner with no width is square.
    const square = rounding => `<div style="margin: 10px; width: 100px; height: 100px; ${rounding}overflow: hidden"><p data-ux="square" style="margin: -0.5px 0 0 -0.5px; width: 50px; height: 20px; pointer-events: none">x</p></div>`;
    assert.deepEqual(said(await evaluate(square(''), [c('square', 'in-viewport')])), [['square', true, '']]);
    assert.deepEqual(said(await evaluate(square('border-radius: 0 / 5px; '), [c('square', 'in-viewport')])), [['square', true, '']]);
    // A radius in percent, across then down: on a box 300 by 100, 50% / 20% rounds 150 px across and 20 px
    // down at each corner. An element in the top band, 62 px along, is asked about, and its top is cut; one
    // in the middle band is not asked about, though it lies within 60 px of the side.
    const wide = '<div class="wide" style="position: relative; width: 300px; height: 100px; border-radius: 50% / 20%; overflow: hidden; background: #eeeeee"><span data-ux="in-band" style="position: absolute; top: 0; left: 62px; width: 20px; height: 20px; background: #cc0000"></span><span data-ux="in-middle" style="position: absolute; top: 40px; left: 10px; width: 40px; height: 20px; pointer-events: none">x</span></div>';
    const context = await browser.newContext(contextOptions(390, 'light'));
    try {
      const page = await context.newPage();
      await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>${STYLE}</head><body>${wide}</body></html>`);
      await page.evaluate(source);
      const results = await page.evaluate(checks => window.__uxAccept(checks), [c('in-band', 'in-viewport'), c('in-middle', 'in-viewport')]);
      // The page's own answer at the five points: the centre, and the middle of each edge one pixel in.
      const points = await page.evaluate(() => {
        const element = document.querySelector('[data-ux="in-band"]');
        const box = element.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        return [[cx, cy], [cx, box.top + 1], [cx, box.bottom - 1], [box.left + 1, cy], [box.right - 1, cy]].map(([x, y]) => {
          const at = document.elementFromPoint(x, y);
          return at !== null && element.contains(at);
        });
      });
      assert.deepEqual(points, [true, false, true, true, true]);
      assert.equal(results[0].pass, points.every(Boolean));
      assert.deepEqual(said(results), [
        ['in-band', false, 'it is clipped by <div class="wide">'],
        ['in-middle', true, ''],
      ]);
    } finally {
      await context.close();
    }
    // A rounded box drawn at twice its size: its corners are twice as large. One element 44 px down its
    // left side as drawn, one 44 px along its top, each cut where a corner of 80 px reaches and one of 40 px
    // would not.
    const scaled = '<div style="transform: scale(2); transform-origin: 0 0"><div class="twice" style="position: relative; width: 150px; height: 120px; border-radius: 40px; overflow: hidden; background: #eeeeee"><span data-ux="twice-down" style="position: absolute; top: 22px; left: 0; width: 4px; height: 4px; background: #cc0000"></span><span data-ux="twice-along" style="position: absolute; top: 0; left: 22px; width: 4px; height: 4px; background: #cc0000"></span></div></div>';
    const twice = await evaluateAndPoint(scaled, [c('twice-down', 'in-viewport'), c('twice-along', 'in-viewport')]);
    assert.deepEqual([said(twice.results), twice.painted], [[['twice-down', false, 'it is clipped by <div class="twice">'], ['twice-along', false, 'it is clipped by <div class="twice">']], [false, false]]);
    // What cannot be asked near a corner cannot be told.
    assert.deepEqual(said(await evaluate(avatar(dot.replace('background', 'pointer-events: none; background')), [c('dot', 'in-viewport')])), [['dot', false, `cannot be told: it has pointer-events: none${asked}`]]);
  });

  test('in-viewport: at a rounded corner the curve decides: what lies inside it, a pixel of play given, is never asked about', async () => {
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    const untold = id => [id, false, 'cannot be told: it has pointer-events: none, and the browser is asked by pointing at it'];
    const one = async (body, id) => said(await evaluate(body, [c(id, 'in-viewport')]));
    // No element here can be pointed at: one that passes was never asked about.
    // A card whose padding is its radius, 123.33 by 46.39: its corner comes out 12.03 by 12.10 as drawn,
    // and its one line starts 12 px in and 12 px down.
    const fractional = line => `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px"><div style="padding: 12px; border-radius: 12px; overflow: hidden"><p data-ux="line" ${line}>Room 2</p></div><div></div><div></div></div>`;
    assert.deepEqual(await one(fractional('style="margin: 0; font: 16px/1.4 sans-serif; pointer-events: none"'), 'line'), [['line', true, '']]);
    assert.deepEqual(await one(fractional('inert style="margin: 0; font: 16px/1.4 sans-serif"'), 'line'), [['line', true, '']]);
    // A line 8 px in and 8 px down in a card rounded 12 px: inside the curve.
    assert.deepEqual(await one('<div style="width: 300px; padding: 8px; border-radius: 12px; overflow: hidden"><p data-ux="flush" style="margin: 0; pointer-events: none">Room 2, free until 10:30</p></div>', 'flush'), [['flush', true, '']]);
    // In a card rounded 12 px: along its top, far past its corners; and deep in a corner, where it is cut.
    const card = inside => `<div style="position: relative; width: 300px; height: 100px; border-radius: 12px; overflow: hidden">${inside}</div>`;
    assert.deepEqual(await one(card('<span data-ux="top" style="position: absolute; top: 0; left: 100px; width: 100px; height: 8px; pointer-events: none"></span>'), 'top'), [['top', true, '']]);
    assert.deepEqual(await one(card('<span data-ux="deep" style="position: absolute; top: 0; right: 0; width: 4px; height: 4px; pointer-events: none"></span>'), 'deep'), [untold('deep')]);
    // Each corner of a box rounded 40 px across and 20 px down. The point of an element nearest to the
    // corner, a pixel in: from 4 px along and 10 px down it lies inside the curve (35² + 4 × 9² = 1549, to
    // 1600), from 4 px along and 9 px down outside it (35² + 4 × 10² = 1625).
    const oval = spans => `<div style="position: relative; width: 200px; height: 160px; border-radius: 40px / 20px; overflow: hidden">${spans}</div>`;
    const span = (id, place) => `<span data-ux="${id}" style="position: absolute; ${place}; width: 6px; height: 6px; pointer-events: none"></span>`;
    for (const [across, down] of [['left', 'top'], ['right', 'top'], ['right', 'bottom'], ['left', 'bottom']]) {
      const results = await evaluate(oval(span('inside', `${across}: 4px; ${down}: 10px`) + span('outside', `${across}: 4px; ${down}: 9px`)), [c('inside', 'in-viewport'), c('outside', 'in-viewport')]);
      assert.deepEqual(said(results), [['inside', true, ''], untold('outside')], `${down} ${across}`);
    }
    // On the curve is inside it: from 15 px along and 3 px down (24² + 4 × 16² = 1600).
    assert.deepEqual(await one(oval(span('on', 'left: 15px; top: 3px')), 'on'), [['on', true, '']]);
    // The nearest point is taken on the box's own edge: a line half a pixel over the corner of a box
    // rounded 3 px starts, a pixel in, inside the curve.
    assert.deepEqual(await one('<div style="margin: 10px; width: 100px; height: 100px; border-radius: 3px; overflow: hidden"><p data-ux="over" style="margin: -0.5px 0 0 -0.5px; width: 50px; height: 20px; pointer-events: none">x</p></div>', 'over'), [['over', true, '']]);
    // Radii larger than the box are made smaller as CSS makes them, all four by one factor, until those
    // that share a side fit it: a box 200 by 100 rounded 999 px has corners of 50 px, and what lies in the
    // middle is inside all four.
    assert.deepEqual(await one('<div style="position: relative; width: 200px; height: 100px; border-radius: 999px; overflow: hidden"><span data-ux="mid" style="position: absolute; top: 40px; left: 80px; width: 40px; height: 20px; pointer-events: none"></span></div>', 'mid'), [['mid', true, '']]);
  });

  test('in-viewport: a pill is rounded as CSS rounds it: radii that do not fit their side are made smaller, all four by one factor, so a label inside it is never asked about', async () => {
    const said = results => results.map(({ id, pass, message }) => [id, pass, message]);
    const untold = id => [id, false, 'cannot be told: it has pointer-events: none, and the browser is asked by pointing at it'];
    const one = async (body, id) => said(await evaluate(body, [c(id, 'in-viewport')]));
    // No label here can be pointed at: one that passes was never asked about.
    const label = (id, place) => `<span data-ux="${id}" style="position: absolute; ${place}; pointer-events: none">Free</span>`;
    const pill = (rounding, inside, size = 'width: 200px; height: 40px') => `<div class="pill" style="position: relative; ${size}; ${rounding}; overflow: hidden; background: #eeeeee">${inside}</div>`;
    // 200 by 40, rounded 999 px: each corner is 20 by 20 as drawn. A label 20 px in from the left stands
    // clear of both left corners, whatever its height.
    assert.deepEqual(await one(pill('border-radius: 999px', label('status', 'left: 20px; top: 10px; width: 60px; height: 20px')), 'status'), [['status', true, '']]);
    assert.deepEqual(await one(pill('border-radius: 999px', label('status', 'left: 20px; top: 0; width: 160px; height: 40px')), 'status'), [['status', true, '']]);
    // 120 by 40, rounded 100 px: the same corners, by the same factor.
    assert.deepEqual(await one(pill('border-radius: 100px', label('status', 'left: 20px; top: 0; width: 80px; height: 40px'), 'width: 120px; height: 40px'), 'status'), [['status', true, '']]);
    // A chip as a design system draws one: its padding holds the label clear of the round ends.
    const chip = '<span class="chip" style="display: inline-block; padding: 4px 14px; border-radius: 9999px; overflow: hidden; font: 14px/18px sans-serif; background: #eeeeee"><span data-ux="chip-label" style="pointer-events: none">Free until 10:30</span></span>';
    assert.deepEqual(await one(chip, 'chip-label'), [['chip-label', true, '']]);
    // Across and down apart: 300 px / 30 px on 200 by 40 is made a third, 100 px across and 10 px down.
    // From 70 px along and 2 px down a label lies inside that curve; an ellipse capped at the box would hold it out.
    assert.deepEqual(await one(pill('border-radius: 300px / 30px', label('status', 'left: 70px; top: 2px; width: 60px; height: 20px')), 'status'), [['status', true, '']]);
    // Rounded at one end only: the two left corners are 20 by 20, the right ones square.
    assert.deepEqual(await one(pill('border-radius: 999px 0 0 999px', label('status', 'left: 20px; top: 0; right: 0; height: 40px')), 'status'), [['status', true, '']]);
    // One factor for all four: 999 px at the top left and 40 px at the others, on 200 by 40. The left side
    // holds 1039 px of radii, so each is made 40/1039: the small corners come out under 2 px, and a label
    // 2 px in from the right stands clear of them.
    assert.deepEqual(await one(pill('border-radius: 999px 40px 40px 40px', label('status', 'right: 2px; top: 2px; width: 60px; height: 36px')), 'status'), [['status', true, '']]);
    // What a round end does cut is still asked about: in its corner, and at its very edge.
    assert.deepEqual(await one(pill('border-radius: 999px', label('status', 'left: 2px; top: 2px; width: 10px; height: 10px')), 'status'), [untold('status')]);
    assert.deepEqual(await one(pill('border-radius: 999px', label('status', 'left: 0; top: 0; width: 200px; height: 40px')), 'status'), [untold('status')]);
    // And where it can be asked, the answer is the browser's: a dot in the corner of a pill is cut away.
    const dot = '<span data-ux="dot" style="position: absolute; left: 0; top: 0; width: 5px; height: 5px; background: #cc0000"></span>';
    const { results, painted } = await evaluateAndPoint(pill('border-radius: 999px', dot), [c('dot', 'in-viewport')]);
    assert.deepEqual([said(results), painted], [[['dot', false, 'it is clipped by <div class="pill">']], [false]]);
    // A pill drawn at twice its size has corners twice as large: 40 by 40.
    const twice = inside => `<div style="transform: scale(2); transform-origin: 0 0">${pill('border-radius: 999px', inside)}</div>`;
    assert.deepEqual(await one(twice(label('status', 'left: 20px; top: 0; width: 60px; height: 40px')), 'status'), [['status', true, '']]);
    assert.deepEqual(await one(twice(label('status', 'left: 12px; top: 0; width: 60px; height: 40px')), 'status'), [untold('status')]);
  });

  test('style: the value the browser computes for one property of the one element is the string given; it asks neither whether the element is rendered nor how the value came about', async () => {
    const body = '<main data-screen="today"><h1 data-ux="title" style="margin: 0; font: 600 1.5rem/2 sans-serif; color: #1a1a1a; padding: 8px 16px; --gap-wide: 12px">Rooms</h1>'
      + '<p data-ux="count" style="font-size: 87.5%">2 rooms free</p><p data-ux="unseen" style="display: none; font-size: 20px">x</p>'
      + '<p data-ux="twice">a</p><p data-ux="twice">b</p></main>';
    const style = (id, target, property, equals, more = {}) => ({ id, type: 'style', target, property, equals, ...more });
    const results = await evaluate(body, [
      style('size', 'title', 'font-size', '24px'),
      style('weight', 'title', 'font-weight', '600'),
      style('leading', 'title', 'line-height', '48px'),
      style('colour', 'title', 'color', 'rgb(26, 26, 26)'),
      style('padding', 'title', 'padding-left', '16px'),
      style('short', 'title', 'padding', '8px 16px'),
      style('custom', 'title', '--gap-wide', '12px'),
      style('trimmed', 'title', 'font-size', ' 24px '),
      style('in-screen', 'count', 'font-size', '14px', { screen: 'today' }),
      style('unseen', 'unseen', 'font-size', '20px'),
      // What the build must hit and does not.
      style('wrong', 'title', 'font-size', '16px'),
      style('wrong-unit', 'title', 'font-size', '1.5rem'),
      // A check that cannot be made.
      style('no-such', 'title', 'font-sizes', '24px'),
      style('camel', 'title', 'fontSize', '24px'),
      { id: 'no-property', type: 'style', target: 'title', equals: '24px' },
      style('no-value', 'title', 'font-size', 24),
      style('missing', 'heading', 'font-size', '24px'),
      style('twice', 'twice', 'font-size', '16px'),
    ]);
    assert.deepEqual(shown(results), [
      ['size', true, '24px', ''],
      ['weight', true, '600', ''],
      ['leading', true, '48px', ''],
      ['colour', true, 'rgb(26, 26, 26)', ''],
      ['padding', true, '16px', ''],
      ['short', true, '8px 16px', ''],
      ['custom', true, '12px', ''],
      ['trimmed', true, '24px', ''],
      ['in-screen', true, '14px', ''],
      ['unseen', true, '20px', ''],
      ['wrong', false, '24px', 'its font-size is 24px, not 16px'],
      ['wrong-unit', false, '24px', 'its font-size is 24px, not 1.5rem'],
      ['no-such', false, null, 'the browser gives no value for the property "font-sizes"'],
      ['camel', false, null, 'property must be a CSS property name, as font-size'],
      ['no-property', false, null, 'property must be a CSS property name, as font-size'],
      ['no-value', false, null, 'equals must be a non-empty string'],
      ['missing', false, null, 'data-ux="heading" not found'],
      ['twice', false, null, 'data-ux="twice" found 2 times; it must be on exactly one element'],
    ]);
  });

  test('gap: the distance from the first element to the second along one axis, in CSS pixels, half a pixel of play given; below zero they overlap or the second comes first', async () => {
    const body = '<div style="display: flex; flex-direction: column; gap: 16px; width: 200px"><p data-ux="first" style="margin: 0; height: 20px">A</p><p data-ux="second" style="margin: 0; height: 20px">B</p></div>'
      + '<div style="display: flex; gap: 12.5px; margin-top: 8px"><span data-ux="left" style="width: 40px">C</span><span data-ux="right" style="width: 40px">D</span>'
      + '<span data-ux="unseen" style="display: none">E</span><span data-ux="boxless" style="display: contents"><b>F</b></span></div>';
    const gap = (id, targets, axis, equals, more = {}) => ({ id, type: 'gap', targets, axis, equals, ...more });
    const results = await evaluate(body, [
      gap('down', ['first', 'second'], 'y', 16),
      gap('across', ['left', 'right'], 'x', 12.5),
      // Half a pixel of play either way, and no more.
      gap('play', ['left', 'right'], 'x', 12),
      gap('play-up', ['left', 'right'], 'x', 13),
      gap('too-far', ['left', 'right'], 'x', 11.9),
      gap('too-far-up', ['left', 'right'], 'x', 13.1),
      gap('wrong', ['first', 'second'], 'y', 24),
      // The second before the first: from the bottom of the second up to the top of the first.
      gap('back', ['second', 'first'], 'y', 16),
      // The other axis is another distance: the two stand in one column, so across they overlap by their width.
      gap('other-axis', ['first', 'second'], 'x', 16),
      gap('to-the-next-row', ['second', 'left'], 'y', 8),
      // A check that cannot be made.
      gap('unseen', ['left', 'unseen'], 'x', 12),
      gap('boxless', ['left', 'boxless'], 'x', 12),
      gap('missing', ['left', 'nowhere'], 'x', 12),
      gap('one', ['left'], 'x', 12),
      gap('three', ['left', 'right', 'first'], 'x', 12),
      gap('same', ['left', 'left'], 'x', 0),
      gap('no-axis', ['left', 'right'], 'z', 12),
      gap('no-number', ['left', 'right'], 'x', '12px'),
    ]);
    assert.deepEqual(shown(results), [
      ['down', true, 16, ''],
      ['across', true, 12.5, ''],
      ['play', true, 12.5, ''],
      ['play-up', true, 12.5, ''],
      ['too-far', false, 12.5, 'the gap from data-ux="left" across to data-ux="right" is 12.5, not 11.9'],
      ['too-far-up', false, 12.5, 'the gap from data-ux="left" across to data-ux="right" is 12.5, not 13.1'],
      ['wrong', false, 16, 'the gap from data-ux="first" down to data-ux="second" is 16, not 24'],
      ['back', false, -56, 'the gap from data-ux="second" down to data-ux="first" is -56, not 16: below zero, the two overlap or the second comes first'],
      ['other-axis', false, -200, 'the gap from data-ux="first" across to data-ux="second" is -200, not 16: below zero, the two overlap or the second comes first'],
      ['to-the-next-row', true, 8, ''],
      ['unseen', false, null, 'data-ux="unseen" is not rendered: display: none on data-ux="unseen"'],
      ['boxless', false, null, 'data-ux="boxless" has no box of its own (display: contents): name an element inside it'],
      ['missing', false, null, 'data-ux="nowhere" not found'],
      ['one', false, null, 'targets must be a list of exactly two ids'],
      ['three', false, null, 'targets must be a list of exactly two ids'],
      ['same', false, null, 'targets names "left" twice'],
      ['no-axis', false, null, 'axis must be "x" or "y"'],
      ['no-number', false, null, 'equals must be a number of CSS pixels'],
    ]);
  });

  test('content-visibility on an inline box does nothing: a span hidden until found, or with content-visibility: hidden, is shown', async () => {
    const body = '<p data-ux="spans">Room <span data-ux="until" hidden="until-found">2</span> and <span data-ux="skips" style="content-visibility: hidden">Sala</span></p>';
    const results = await evaluate(body, [c('until', 'visible'), c('skips', 'visible'), c('until', 'absent'), c('skips', 'absent'), c('until', 'text', { equals: '2' }), c('skips', 'text', { equals: 'Sala' }), c('spans', 'text', { equals: 'Room 2 and Sala' })]);
    assert.deepEqual(results.map(({ id, pass, message }) => [id, pass, message]), [
      ['until', true, ''],
      ['skips', true, ''],
      ['until', false, 'data-ux="until" is rendered'],
      ['skips', false, 'data-ux="skips" is rendered'],
      ['until', true, ''],
      ['skips', true, ''],
      ['spans', true, ''],
    ]);
  });
});

test('the fixture prototype carries the grey kit byte for byte', () => {
  assert.ok(readFileSync(join(prototype, 'kit.css')).equals(readFileSync(join(here, '..', 'kit', 'grey', 'kit.css'))));
});

test('no product name appears in the acceptance scripts or the shared browser library', () => {
  for (const file of [cli, INPAGE, join(here, '..', 'scripts', 'lib', 'browser.mjs'), acceptanceFile, ...['today-default-en', 'today-empty-en', 'today-default-es'].map(name => join(prototype, `${name}.html`))]) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\bVerbato\b/i, file);
    assert.doesNotMatch(text, /\bVersa\b/, file);
  }
});

test('an error of the module is an AcceptError, and options are checked', async () => {
  await assert.rejects(acceptPrototype({ design: 'today', checks: [] }, { root: prototype }), e => e instanceof AcceptError && e.message === 'the acceptance checks are not valid:\n  $.checks: must be a list of at least one check');
  await assert.rejects(acceptPrototype(fixture(), {}), e => e instanceof TypeError && /^root must be the path of a folder/.test(e.message));
  await assert.rejects(acceptPrototype(fixture(), { root: prototype, timeout: 0 }), e => e instanceof TypeError && /^timeout must be a whole number of milliseconds from 1/.test(e.message));
  await assert.rejects(acceptPrototype(fixture(), { root: prototype, allowErrors: 'yes' }), e => e instanceof TypeError && e.message === 'allowErrors must be true or false; it is "yes"');
  assert.throws(() => joinResults({ design: 'today', checks: [] }, []), e => e instanceof AcceptError && e.message === 'the acceptance checks are not valid:\n  $.checks: must be a list of at least one check');
});
