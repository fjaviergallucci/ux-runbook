import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../scripts/lib/walkthrough.mjs';
import { MergeError, SealedError, mergeProposals, openMap } from '../scripts/lib/merge.mjs';
import { ProposalFileError, readProposalFile } from '../scripts/lib/proposal-file.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'merge.mjs');
const FIXTURES = join(here, 'fixtures', 'proposals');
// The three fixtures, in the order of their names.
const FIXTURE_FILES = ['calendar.json', 'free-first.json', 'unified-list.json'];
// Who made a proposal, and how: never in a letter copy. Written out here, not taken from the scripts.
const PROVENANCE = ['author', 'engine', 'track', 'model', 'source'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAP = 'MAP.sealed.json';
const PICK = 'PICK.md';
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'merge-'));
after(() => rmSync(root, { recursive: true, force: true }));

let made = 0;
// A fresh folder for one run, in a path with a space.
const fresh = () => join(root, `run ${++made}`);
const fixture = file => JSON.parse(readFileSync(join(FIXTURES, file), 'utf8'));
const strip = proposal => Object.fromEntries(Object.entries(proposal).filter(([key]) => !PROVENANCE.includes(key)));
const pretty = value => `${JSON.stringify(value, null, 2)}\n`;
const readText = (dir, name) => readFileSync(join(dir, name), 'utf8');
const readMap = board => JSON.parse(readText(board, MAP));
// Everything in a folder, by name, byte for byte, sub-folders included.
const snapshot = dir => {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  return Object.fromEntries(entries.map(e => [e.name, e.isDirectory() ? snapshot(join(dir, e.name)) : readFileSync(join(dir, e.name))]));
};
const quote = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A proposals folder: each entry a file name and a proposal, or the raw text of the file.
function writeProposals(dir, entries) {
  mkdirSync(dir, { recursive: true });
  for (const [name, proposal] of Object.entries(entries)) {
    writeFileSync(join(dir, name), typeof proposal === 'string' ? proposal : JSON.stringify(proposal, null, 2));
  }
  return dir;
}

// The three fixtures, each signed by its maker with all five keys of who made it, in places a maker might
// put them: first, between the text fields, last. Every signature, and every file name, holds "zq", which
// no proposal says. The third keeps its own key order, screens first.
const SIGNATURES = {
  'ada-zq.json': ['calendar.json', { author: 'zq-author-ada', engine: 'zq-engine-north', model: 'zq-model-one', track: 'system', source: 'zq-source-ada' }],
  'bo-zq.json': ['free-first.json', { author: 'zq-author-bo', engine: 'zq-engine-south', model: 'zq-model-two', track: 'fresh', source: 'zq-source-bo' }],
  'cy-zq.json': ['unified-list.json', { author: 'zq-author-cy', engine: 'zq-engine-east', model: 'zq-model-three', track: 'system', source: 'zq-source-cy' }],
};
const SIGNS = Object.values(SIGNATURES).flatMap(([, s]) => Object.values(s).filter(v => v.startsWith('zq-')));
const STEMS = Object.keys(SIGNATURES).map(name => name.replace(/\.json$/, ''));
function signed() {
  const [ada, bo, cy] = Object.values(SIGNATURES).map(([file, s]) => [fixture(file), s]);
  const sign = ([p, s]) => ({ author: s.author, name: p.name, bet: p.bet, engine: s.engine, cost: p.cost, absent: p.absent, hardest: p.hardest, model: s.model, firstIdea: p.firstIdea, screens: p.screens, track: s.track, source: s.source });
  const [p, s] = cy;
  return {
    'ada-zq.json': sign(ada),
    'bo-zq.json': sign(bo),
    'cy-zq.json': { screens: p.screens, source: s.source, firstIdea: p.firstIdea, hardest: p.hardest, track: s.track, absent: p.absent, cost: p.cost, model: s.model, bet: p.bet, engine: s.engine, name: p.name, author: s.author },
  };
}

// The command, run from the test's own folder, so that a path it should never take lands nowhere else.
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: root });
// The command with a CommonJS module required before it (Node 20.0 has no --import).
const runWith = ({ preload, env }, ...args) =>
  spawnSync(process.execPath, ['--require', preload, cli, ...args], { encoding: 'utf8', cwd: root, env: { ...process.env, ...env } });
const writePreload = (dir, name, lines) => {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, name);
  writeFileSync(file, [...lines, "require('node:module').syncBuiltinESMExports();"].join('\n'));
  return file;
};

// What the CLI says on success, and on each refusal.
const merged = (board, letters) =>
  `merged ${letters.length} proposal${letters.length === 1 ? '' : 's'} into ${board}: ${letters.join(', ')}\n` +
  `the author map is sealed in ${join(board, MAP)}; it opens only once ${join(board, PICK)} holds the founder's pick\n`;
const sealedBoard = board =>
  `cannot merge into ${board}: the board is sealed (it holds ${MAP}), and its letters may already have been read. ` +
  `Merging again would shuffle them anew; to rebuild the board, delete ${board} on purpose first.`;
const notEmpty = board =>
  `cannot merge into ${board}: the folder is not empty. A board is merged into a new or an empty folder, ` +
  'so that nothing but its letters and its sealed map is read beside them.';
const stillSealed = (board, problem) => `the author map is sealed until the founder's pick is written in ${join(board, PICK)}; that file ${problem}`;
const invalidMessage = (src, faults) =>
  `cannot merge ${src}: not every proposal is valid, so no letter is written\n` +
  faults.map(([file, errors]) => `${join(src, file)}: it is not a valid proposal\n${errors.join('\n')}`).join('\n');

// ---- the letters

test('three proposals merge to A, B, C: each letter is one proposal as written, minus who made it, pretty-printed with LF and a final newline', () => {
  const board = join(fresh(), 'the board');
  assert.deepEqual(mergeProposals(FIXTURES, board, { seed: 1 }), { letters: ['A', 'B', 'C'] });
  assert.deepEqual(readdirSync(board).sort(), ['A.json', 'B.json', 'C.json', MAP]);
  const texts = ['A', 'B', 'C'].map(letter => readText(board, `${letter}.json`));
  assert.deepEqual([...texts].sort(), FIXTURE_FILES.map(file => pretty(strip(fixture(file)))).sort(), 'one letter per proposal, byte for byte');
  for (const text of texts) {
    assert.ok(!text.includes('\r'), 'LF only');
    assert.ok(text.endsWith('}\n'), 'one final newline');
    assert.deepEqual(validate(JSON.parse(text)), [], 'a letter copy is still a valid proposal');
  }
});

test('the letter copies carry none of author, engine, track, model, source — not the key, not its value — and keep the proposal\'s own key order', () => {
  const dir = fresh();
  const sources = signed();
  const src = writeProposals(join(dir, 'the proposals'), sources);
  const board = join(dir, 'the board');
  mergeProposals(src, board, { seed: 2 });
  const texts = ['A', 'B', 'C'].map(letter => readText(board, `${letter}.json`));
  assert.deepEqual([...texts].sort(), Object.values(sources).map(p => pretty(strip(p))).sort());
  for (const text of texts) {
    const copy = JSON.parse(text);
    for (const key of PROVENANCE) assert.ok(!Object.hasOwn(copy, key), `no key ${key}`);
    for (const sign of [...SIGNS, ...STEMS]) assert.ok(!text.includes(sign), `no ${sign}`);
  }
  const orders = texts.map(text => Object.keys(JSON.parse(text)).join());
  assert.ok(orders.includes('screens,firstIdea,hardest,absent,cost,bet,name'), 'the order the maker wrote, not a canonical one');
  assert.ok(orders.includes('name,bet,cost,absent,hardest,firstIdea,screens'));
});

test('the sealed map holds, per letter, the source file, its track and its engine — every source exactly once — and nothing else', () => {
  const dir = fresh();
  const sources = signed();
  // Two more, distinct from the rest: one names no track or engine, one names them in something not text.
  const { track, ...unsigned } = fixture('calendar.json');
  sources['dee-zq.json'] = { ...unsigned, name: 'The day as a grid, unsigned' };
  sources['eve-zq.json'] = { ...fixture('free-first.json'), name: 'Free rooms first, odd tags', track: ['fresh'], engine: 7 };
  assert.ok(Object.values(sources).every(p => validate(p).length === 0));
  const expected = {
    'ada-zq.json': ['system', 'zq-engine-north'],
    'bo-zq.json': ['fresh', 'zq-engine-south'],
    'cy-zq.json': ['system', 'zq-engine-east'],
    'dee-zq.json': [null, null],
    'eve-zq.json': [null, null],
  };
  const src = writeProposals(join(dir, 'the proposals'), sources);
  const board = join(dir, 'the board');
  assert.deepEqual(mergeProposals(src, board, { seed: 3 }), { letters: ['A', 'B', 'C', 'D', 'E'] });
  const map = readMap(board);
  assert.deepEqual(Object.keys(map), ['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(Object.values(map).map(entry => entry.file).sort(), Object.keys(sources).sort(), 'every source exactly once');
  for (const [letter, entry] of Object.entries(map)) {
    assert.deepEqual(Object.keys(entry), ['file', 'track', 'engine'], letter);
    assert.deepEqual([entry.track, entry.engine], expected[entry.file], `${letter} is ${entry.file}`);
    assert.equal(readText(board, `${letter}.json`), pretty(strip(sources[entry.file])), `${letter} holds what ${entry.file} says`);
  }
  assert.equal(readText(board, MAP), pretty(map), 'pretty-printed, LF, one final newline');
});

// ---- the shuffle

test('with a seed the shuffle is repeatable, and at least one of three seeds is not the order of the files', () => {
  const orders = {};
  for (const seed of [1, 2, 3]) {
    const once = join(fresh(), 'board');
    const twice = join(fresh(), 'board');
    mergeProposals(FIXTURES, once, { seed });
    mergeProposals(FIXTURES, twice, { seed });
    assert.deepEqual(snapshot(twice), snapshot(once), `seed ${seed}: the same board, byte for byte`);
    orders[seed] = Object.values(readMap(once)).map(entry => entry.file);
    assert.deepEqual([...orders[seed]].sort(), FIXTURE_FILES, `seed ${seed}: a permutation`);
  }
  assert.ok(Object.values(orders).some(order => order.join() !== FIXTURE_FILES.join()), 'not always the file order');
  // The generator is mulberry32 under a Fisher–Yates shuffle; these pin it.
  assert.deepEqual(orders, {
    1: ['unified-list.json', 'calendar.json', 'free-first.json'],
    2: ['free-first.json', 'calendar.json', 'unified-list.json'],
    3: ['free-first.json', 'calendar.json', 'unified-list.json'],
  });
  // The seed's bounds: a whole number from 0 to 2^32 - 1.
  for (const seed of [0, 4294967295]) {
    assert.deepEqual(mergeProposals(FIXTURES, join(fresh(), 'board'), { seed }), { letters: ['A', 'B', 'C'] }, String(seed));
  }
  for (const seed of [-1, 1.5, 4294967296, '1', NaN]) {
    const board = join(fresh(), 'board');
    assert.throws(() => mergeProposals(FIXTURES, board, { seed }), e => e instanceof TypeError && /the seed must be a whole number from 0 to 4294967295/.test(e.message), String(seed));
    assert.ok(!existsSync(board), `${seed}: nothing is written`);
  }
});

test('without a seed the shuffle draws from crypto.randomInt, and with one it never does', () => {
  const dir = fresh();
  // randomInt always 0, and Math.random refused: a Fisher–Yates shuffle of calendar, free-first,
  // unified-list then swaps the last with the first, and the middle with the first.
  const zero = writePreload(dir, 'zero.cjs', [
    "const crypto = require('node:crypto');",
    "crypto.randomInt = max => { if (process.env.NO_CRYPTO) throw new Error('crypto.randomInt was used'); return 0; };",
    "Math.random = () => { throw new Error('Math.random was used'); };",
  ]);
  const board = join(dir, 'unseeded');
  let r = runWith({ preload: zero }, FIXTURES, '--out', board);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(Object.values(readMap(board)).map(entry => entry.file), ['free-first.json', 'unified-list.json', 'calendar.json']);
  // With a seed, crypto is never asked, and the board is the library's for that seed.
  const seeded = join(dir, 'seeded');
  r = runWith({ preload: zero, env: { NO_CRYPTO: '1' } }, FIXTURES, '--out', seeded, '--seed', '3');
  assert.equal(r.status, 0, r.stderr);
  const library = join(dir, 'library');
  mergeProposals(FIXTURES, library, { seed: 3 });
  assert.deepEqual(snapshot(seeded), snapshot(library));
  // Unseeded and untouched, it is still a permutation: every source once, under the letter that holds it.
  const real = join(dir, 'real');
  r = run(FIXTURES, '--out', real);
  assert.equal(r.status, 0, r.stderr);
  const map = readMap(real);
  assert.deepEqual(Object.values(map).map(entry => entry.file).sort(), FIXTURE_FILES);
  for (const [letter, entry] of Object.entries(map)) assert.equal(readText(real, `${letter}.json`), pretty(strip(fixture(entry.file))), letter);
});

test('the order the folder is listed in changes nothing: with a seed, the same board whichever way it is listed', () => {
  const dir = fresh();
  const src = writeProposals(join(dir, 'the proposals'), signed());
  const reverse = writePreload(dir, 'reverse.cjs', [
    "const fs = require('node:fs');",
    'const list = fs.readdirSync;',
    'fs.readdirSync = (...args) => list(...args).reverse();',
  ]);
  const listed = join(dir, 'listed');
  const reversed = join(dir, 'reversed');
  assert.equal(run(src, '--out', listed, '--seed', '5').status, 0);
  const r = runWith({ preload: reverse }, src, '--out', reversed, '--seed', '5');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(snapshot(reversed), snapshot(listed));
});

// ---- what the CLI prints

test('the CLI prints the count and the letters, never a source: no file name, no signature, nothing on standard error', () => {
  const dir = fresh();
  const src = writeProposals(join(dir, 'the proposals'), signed());
  const board = join(dir, 'the board');
  let r = run(src, '--out', board, '--seed', '1');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual([r.stdout, r.stderr], [merged(board, ['A', 'B', 'C']), '']);
  for (const sign of [...SIGNS, ...STEMS]) assert.ok(!r.stdout.includes(sign), sign);
  assert.deepEqual(readdirSync(board).sort(), ['A.json', 'B.json', 'C.json', MAP]);
  // The seed reaches the library: the same board as the library makes with it.
  const library = join(dir, 'library');
  mergeProposals(src, library, { seed: 1 });
  assert.deepEqual(snapshot(board), snapshot(library));
  // Without a seed, and written --out=…: the same words.
  const other = join(dir, 'other board');
  r = run(`--out=${other}`, src);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual([r.stdout, r.stderr], [merged(other, ['A', 'B', 'C']), '']);
  // One proposal is one letter.
  const one = writeProposals(join(dir, 'one'), { 'solo-zq.json': fixture('calendar.json') });
  r = run(one, '--out', join(dir, 'one board'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, merged(join(dir, 'one board'), ['A']), '']);
});

// ---- the map stays sealed until the pick

test('openMap refuses with SealedError while PICK.md is absent, empty or blank, and returns the map once it holds the pick', () => {
  const dir = fresh();
  const board = join(dir, 'the board');
  mergeProposals(FIXTURES, board, { seed: 1 });
  const sealed = problem => e => e instanceof SealedError && e instanceof MergeError && e.message === stillSealed(board, problem);
  assert.throws(() => openMap(board), sealed('cannot be read (not found)'));
  for (const blank of ['', ' \n\t\r\n', '﻿\n']) {
    writeFileSync(join(board, PICK), blank);
    assert.throws(() => openMap(board), sealed('is empty'), JSON.stringify(blank));
  }
  rmSync(join(board, PICK));
  mkdirSync(join(board, PICK));
  assert.throws(() => openMap(board), sealed('cannot be read (it is a folder, not a file)'));
  rmSync(join(board, PICK), { recursive: true });
  writeFileSync(join(board, PICK), 'B, with the filter row of A\n');
  assert.deepEqual(openMap(board), readMap(board));
  assert.deepEqual(Object.keys(openMap(board)), ['A', 'B', 'C']);
});

test('the CLI opens the map only after the pick: before, exit 1 and nothing printed; after, one line per letter', () => {
  const dir = fresh();
  const sources = signed();
  const { track, ...unsigned } = fixture('calendar.json');
  sources['dee-zq.json'] = { ...unsigned, name: 'The day as a grid, unsigned' };
  const src = writeProposals(join(dir, 'the proposals'), sources);
  const board = join(dir, 'the board');
  assert.equal(run(src, '--out', board).status, 0);
  let r = run('open', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${stillSealed(board, 'cannot be read (not found)')}\n`]);
  writeFileSync(join(board, PICK), '\n  \n');
  r = run('open', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${stillSealed(board, 'is empty')}\n`]);
  writeFileSync(join(board, PICK), 'C\n');
  r = run('open', board);
  assert.equal(r.status, 0, r.stderr);
  const map = readMap(board);
  const show = value => value ?? '-';
  const lines = Object.keys(map).sort().map(letter => `${letter}  ${map[letter].file}  ${show(map[letter].track)}  ${show(map[letter].engine)}`);
  assert.deepEqual([r.stdout, r.stderr], [`${lines.join('\n')}\n`, '']);
  const dee = Object.keys(map).find(letter => map[letter].file === 'dee-zq.json');
  assert.ok(lines.includes(`${dee}  dee-zq.json  -  -`), 'a dash where the proposal named none');
  assert.ok(lines.some(line => line.endsWith('  bo-zq.json  fresh  zq-engine-south')));
  // A pick beside no map: the map cannot be read.
  const empty = join(dir, 'no map');
  mkdirSync(empty);
  writeFileSync(join(empty, PICK), 'A\n');
  r = run('open', empty);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot read ${join(empty, MAP)}: not found\n`]);
});

// ---- the refusals

test('one invalid proposal refuses the whole merge before any letter is written, naming the file and listing its errors', () => {
  const dir = fresh();
  const bad = fixture('free-first.json');
  bad.screens[0].items[0].role = 'card';
  delete bad.bet;
  const worse = fixture('unified-list.json');
  worse.colour = 'grey';
  const src = writeProposals(join(dir, 'the proposals'), { 'a.json': fixture('calendar.json'), 'b.json': bad, 'c.json': fixture('free-first.json') });
  const board = join(dir, 'the board');
  const one = invalidMessage(src, [['b.json', validate(bad)]]);
  assert.equal(validate(bad).length, 2);
  assert.throws(() => mergeProposals(src, board, { seed: 1 }), e => e instanceof MergeError && !(e instanceof SealedError) && e.message === one);
  assert.ok(!existsSync(board), 'no board is made');
  let r = run(src, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${one}\n`]);
  assert.ok(!existsSync(board), 'no board is made');
  // Two invalid: both are named, each with its errors; an empty board folder stays empty.
  writeProposals(src, { 'd.json': worse });
  mkdirSync(board);
  r = run(src, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${invalidMessage(src, [['b.json', validate(bad)], ['d.json', validate(worse)]])}\n`]);
  assert.deepEqual(readdirSync(board), [], 'no letter is written');
});

test('more than 26 proposals are refused; 26 merge to A to Z, every source once', () => {
  const dir = fresh();
  const many = count => Object.fromEntries(Array.from({ length: count }, (_, i) => [`p${String(i + 1).padStart(2, '0')}.json`, fixture(FIXTURE_FILES[i % 3])]));
  const src26 = writeProposals(join(dir, 'twenty-six'), many(26));
  const board26 = join(dir, 'board 26');
  assert.deepEqual(mergeProposals(src26, board26, { seed: 1 }), { letters: LETTERS });
  assert.deepEqual(Object.values(readMap(board26)).map(entry => entry.file).sort(), Object.keys(many(26)).sort());
  const src27 = writeProposals(join(dir, 'twenty-seven'), many(27));
  const board27 = join(dir, 'board 27');
  const message = `cannot merge ${src27}: it holds 27 proposals, and a board holds 26 at most, one per letter from A to Z`;
  assert.throws(() => mergeProposals(src27, board27, { seed: 1 }), e => e instanceof MergeError && e.message === message);
  const r = run(src27, '--out', board27);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${message}\n`]);
  assert.ok(!existsSync(board27), 'nothing is written');
});

test('only .json files directly in the folder are read, whatever the case of .json; other files and sub-folders are ignored', () => {
  const dir = fresh();
  const shouty = { ...fixture('calendar.json'), name: 'The day as a grid, saved in capitals' };
  const src = writeProposals(join(dir, 'the proposals'), {
    ...Object.fromEntries(FIXTURE_FILES.map(file => [file, fixture(file)])),
    'Shouty.JSON': shouty,
    'notes.txt': 'not a proposal\n',
    'old.json.bak': '{ not even JSON',
  });
  writeProposals(join(src, 'nested'), { 'deep.json': fixture('calendar.json') });
  writeProposals(join(src, 'folder.json'), { 'inside.json': fixture('calendar.json') });
  const board = join(dir, 'the board');
  assert.deepEqual(mergeProposals(src, board, { seed: 1 }), { letters: ['A', 'B', 'C', 'D'] });
  assert.deepEqual(Object.values(readMap(board)).map(entry => entry.file).sort(), ['Shouty.JSON', ...FIXTURE_FILES].sort());
});

test('a folder with no .json proposal is refused, and so is a proposals folder that cannot be read', () => {
  const dir = fresh();
  const empty = join(dir, 'empty');
  mkdirSync(empty, { recursive: true });
  const other = writeProposals(join(dir, 'other files'), { 'notes.txt': 'not a proposal\n' });
  writeProposals(join(other, 'nested'), { 'deep.json': fixture('calendar.json') });
  writeProposals(join(other, 'folder.json'), { 'inside.json': fixture('calendar.json') });
  const missing = join(dir, 'no such folder');
  const file = join(other, 'notes.txt');
  const cases = [
    [empty, `cannot merge ${empty}: it holds no proposal, no .json file directly in it`],
    [other, `cannot merge ${other}: it holds no proposal, no .json file directly in it`],
    [missing, `cannot read ${missing}: not found`],
    [file, `cannot read ${file}: part of the path is a file, not a folder`],
  ];
  for (const [src, message] of cases) {
    const board = join(dir, 'board');
    assert.throws(() => mergeProposals(src, board, { seed: 1 }), e => e instanceof MergeError && e.message === message, src);
    const r = run(src, '--out', board);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${message}\n`], src);
    assert.ok(!existsSync(board), `${src}: nothing is written`);
  }
});

test('a sealed board is not merged again: refused with SealedError, and nothing in it changes', () => {
  const dir = fresh();
  const board = join(dir, 'the board');
  mergeProposals(FIXTURES, board, { seed: 1 });
  const before = snapshot(board);
  const src = writeProposals(join(dir, 'the proposals'), signed());
  for (const [proposals, seed] of [[FIXTURES, 1], [FIXTURES, 2], [src, 1]]) {
    assert.throws(() => mergeProposals(proposals, board, { seed }), e => e instanceof SealedError && e.message === sealedBoard(board));
    assert.deepEqual(snapshot(board), before, 'unchanged');
  }
  let r = run(FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${sealedBoard(board)}\n`]);
  // Once picked, still sealed against a merge.
  writeFileSync(join(board, PICK), 'A\n');
  const picked = snapshot(board);
  r = run(src, '--out', board, '--seed', '9');
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${sealedBoard(board)}\n`]);
  assert.deepEqual(snapshot(board), picked, 'unchanged');
});

test('a board folder that holds anything is refused — an earlier letter, a pick, the proposals themselves — and an empty one is used', () => {
  const dir = fresh();
  const src = writeProposals(join(dir, 'the proposals'), signed());
  const letterOnly = writeProposals(join(dir, 'a letter left'), { 'D.json': fixture('calendar.json') });
  const pickOnly = join(dir, 'a pick left');
  mkdirSync(pickOnly);
  writeFileSync(join(pickOnly, PICK), 'B\n');
  // The proposals folder inside the board.
  const holding = join(dir, 'holding');
  writeProposals(join(holding, 'proposals'), signed());
  for (const [proposals, board] of [[src, letterOnly], [src, pickOnly], [src, src], [join(holding, 'proposals'), holding]]) {
    const before = snapshot(board);
    assert.throws(() => mergeProposals(proposals, board, { seed: 1 }), e => e instanceof MergeError && !(e instanceof SealedError) && e.message === notEmpty(board), board);
    const r = run(proposals, '--out', board);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${notEmpty(board)}\n`], board);
    assert.deepEqual(snapshot(board), before, `${board}: unchanged`);
  }
  // A board that is a file cannot be written.
  const file = join(dir, 'a file');
  writeFileSync(file, 'not a folder\n');
  assert.throws(() => mergeProposals(src, file, { seed: 1 }), e => e instanceof MergeError && e.message === `cannot write ${file}: part of the path is a file, not a folder`);
  // An empty folder is a new board.
  const empty = join(dir, 'empty');
  mkdirSync(empty);
  assert.deepEqual(mergeProposals(src, empty, { seed: 1 }), { letters: ['A', 'B', 'C'] });
});

test('a board that cannot be written is refused with the path and the reason, and is never sealed half-written', () => {
  const dir = fresh();
  const refuse = writePreload(dir, 'refuse.cjs', [
    "const fs = require('node:fs');",
    'const write = fs.writeFileSync;',
    'const make = fs.mkdirSync;',
    'const target = process.env.REFUSE_PATH;',
    "const refused = path => Object.assign(new Error(`EACCES: permission denied, open '${path}'`), { code: 'EACCES' });",
    'fs.writeFileSync = (path, ...rest) => { if (String(path) === target) throw refused(path); return write(path, ...rest); };',
    'fs.mkdirSync = (path, ...rest) => { if (String(path) === target) throw refused(path); return make(path, ...rest); };',
  ]);
  const board = join(dir, 'the board');
  let r = runWith({ preload: refuse, env: { REFUSE_PATH: board } }, FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${board}: no permission\n`]);
  assert.ok(!existsSync(board));
  // Seed 1 puts unified-list under A and calendar under B: the letters are written in letter order, not in
  // the order of the files, and the map last, so a half-written board is not sealed.
  r = runWith({ preload: refuse, env: { REFUSE_PATH: join(board, 'B.json') } }, FIXTURES, '--out', board, '--seed', '1');
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${join(board, 'B.json')}: no permission\n`]);
  assert.deepEqual(readdirSync(board), ['A.json']);
  assert.equal(readText(board, 'A.json'), pretty(strip(fixture('unified-list.json'))));
});

// ---- the shared reader

test('a proposal file is read as UTF-8 JSON, one byte-order mark dropped; what cannot be read is refused naming the path', t => {
  const dir = fresh();
  const json = JSON.stringify(fixture('calendar.json'), null, 2);
  const files = writeProposals(join(dir, 'files'), {
    'plain.json': json,
    'marked.json': `﻿${json}`,
    'twice.json': `﻿﻿${json}`,
    'broken.json': '{ "name": "half a proposal",',
  });
  const latin = join(files, 'latin.json');
  writeFileSync(latin, Buffer.concat([Buffer.from('{"name": "Reuni'), Buffer.from([0xf3]), Buffer.from('n"}')]));
  assert.deepEqual(readProposalFile(join(files, 'plain.json')), fixture('calendar.json'));
  assert.deepEqual(readProposalFile(join(files, 'marked.json')), fixture('calendar.json'));
  const refused = (path, words) => e => e instanceof ProposalFileError && (typeof words === 'string' ? e.message === `cannot read ${path}: ${words}` : words.test(e.message));
  const at = name => join(files, name);
  const cases = [
    // V8 quotes the start of the text, newlines and all.
    [at('twice.json'), new RegExp(`^cannot read ${quote(at('twice.json'))}: it is not JSON \\([\\s\\S]+\\)$`)],
    [at('broken.json'), new RegExp(`^cannot read ${quote(at('broken.json'))}: it is not JSON \\([\\s\\S]+\\)$`)],
    [latin, 'it is not UTF-8'],
    [at('none.json'), 'not found'],
    [files, 'it is a folder, not a file'],
    [join(at('plain.json'), 'x.json'), 'part of the path is a file, not a folder'],
  ];
  for (const [path, words] of cases) assert.throws(() => readProposalFile(path), refused(path, words), path);
  // The merge reads through it: a marked file merges, its letter carries no mark; a broken one refuses.
  const board = join(dir, 'board');
  const marked = writeProposals(join(dir, 'marked'), { 'marked.json': `﻿${json}` });
  assert.deepEqual(mergeProposals(marked, board, { seed: 1 }), { letters: ['A'] });
  assert.equal(readFileSync(join(board, 'A.json'), 'utf8'), pretty(strip(fixture('calendar.json'))));
  for (const [name, text] of [['broken.json', '{ "name": "half a proposal",'], ['twice.json', `﻿﻿${json}`]]) {
    const src = writeProposals(join(dir, `with ${name}`), { 'calendar.json': json, [name]: text });
    const out = join(dir, `board for ${name}`);
    const r = run(src, '--out', out);
    assert.equal(r.status, 1, name);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, new RegExp(`^cannot read ${quote(join(src, name))}: it is not JSON \\([\\s\\S]+\\)\\n$`), name);
    assert.ok(!existsSync(out), `${name}: nothing is written`);
  }
  const notUtf8 = writeProposals(join(dir, 'with latin'), { 'calendar.json': json });
  writeFileSync(join(notUtf8, 'latin.json'), readFileSync(latin));
  let r = run(notUtf8, '--out', join(dir, 'latin board'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot read ${join(notUtf8, 'latin.json')}: it is not UTF-8\n`]);
  // A link to a proposal that is gone is not a folder: it is read, and refused, never silently left out.
  const gone = writeProposals(join(dir, 'with a link'), { 'calendar.json': json });
  try {
    symlinkSync(join(gone, 'nowhere.json'), join(gone, 'gone.json'));
  } catch {
    return t.skip('this system makes no symbolic links');
  }
  r = run(gone, '--out', join(dir, 'link board'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot read ${join(gone, 'gone.json')}: not found\n`]);
  assert.ok(!existsSync(join(dir, 'link board')), 'nothing is written');
});

// ---- usage

test('the CLI exits 2 on bad usage, printing the usage, and writes nothing; a flag never takes another flag as its value', () => {
  const dir = fresh();
  const board = join(dir, 'board');
  const usages = [
    [[], /^merge takes one <proposals dir>, got 0\n/],
    [[FIXTURES, FIXTURES, '--out', board], /^merge takes one <proposals dir>, got 2\n/],
    [[FIXTURES], /^--out is missing\n/],
    [[FIXTURES, '--out'], /^--out needs a value\n/],
    [[FIXTURES, '--out='], /^--out needs a value\n/],
    [[FIXTURES, '--out', board, '--out', board], /^--out is given twice\n/],
    [[FIXTURES, '--out', board, '--colour', 'grey'], /^unknown flag --colour\n/],
    [[FIXTURES, '--out', '--seed', '1'], /^--out needs a value; "--seed" is a flag\n/],
    [[FIXTURES, '--out', '-h'], /^--out needs a value; "-h" is a flag\n/],
    [[FIXTURES, '--out', board, '--seed', '--out'], /^--seed needs a value; "--out" is a flag\n/],
    [[FIXTURES, '--out', board, '--seed', 'x'], /^--seed must be a whole number from 0 to 4294967295; it is "x"\n/],
    [[FIXTURES, '--out', board, '--seed', '-1'], /^--seed must be a whole number from 0 to 4294967295; it is "-1"\n/],
    [[FIXTURES, '--out', board, '--seed', '1.5'], /^--seed must be a whole number from 0 to 4294967295; it is "1.5"\n/],
    [[FIXTURES, '--out', board, '--seed=4294967296'], /^--seed must be a whole number from 0 to 4294967295; it is "4294967296"\n/],
    [['open'], /^open takes one <board dir>, got 0\n/],
    [['open', board, board], /^open takes one <board dir>, got 2\n/],
    [['open', board, '--out', board], /^open takes no flag; --out is given\n/],
    [['open', board, '--seed=1'], /^open takes no flag; --seed is given\n/],
  ];
  for (const [args, pattern] of usages) {
    const r = run(...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.equal(r.stdout, '', args.join(' '));
    assert.match(r.stderr, pattern, args.join(' '));
    assert.match(r.stderr, /\n\nUsage: node scripts\/merge\.mjs <proposals dir> --out <board dir> \[--seed <n>\]\n/, args.join(' '));
    assert.ok(!existsSync(board), `${args.join(' ')}: nothing is written`);
  }
  // The highest seed is a seed.
  const r = run(FIXTURES, '--out', board, '--seed', '4294967295');
  assert.equal(r.status, 0, r.stderr);
});

test('the CLI --help prints the usage, naming both forms, every flag and the exit codes, and exits 0', () => {
  for (const args of [['--help'], ['-h'], ['open', '--help'], [FIXTURES, '--help']]) {
    const r = run(...args);
    assert.equal(r.status, 0, args.join(' '));
    assert.equal(r.stderr, '');
    assert.match(r.stdout, /^Usage: node scripts\/merge\.mjs <proposals dir> --out <board dir> \[--seed <n>\]\n {7}node scripts\/merge\.mjs open <board dir>\n/);
    for (const word of ['--out', '--seed', MAP, PICK, 'at most 26', 'new or empty', 'delete it on purpose', '--flag=value', '0 success', '1 a refusal', '2 bad usage']) {
      assert.ok(r.stdout.includes(word), word);
    }
  }
});

test('no product name appears in the merge scripts or the shared reader', () => {
  const scripts = join(here, '..', 'scripts');
  for (const file of [cli, join(scripts, 'lib', 'merge.mjs'), join(scripts, 'lib', 'proposal-file.mjs')]) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\bVerbato\b/i, file);
    assert.doesNotMatch(text, /\bVersa\b/, file);
  }
});
