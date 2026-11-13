import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { validate } from '../scripts/lib/walkthrough.mjs';
import { MergeError, SealedError, mergeProposals, openMap } from '../scripts/lib/merge.mjs';
import { ProposalFileError, readProposalFile } from '../scripts/lib/json-file.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'merge.mjs');
const FIXTURES = join(here, 'fixtures', 'proposals');
// The three fixtures, in the order of their names.
const FIXTURE_FILES = ['calendar.json', 'free-first.json', 'unified-list.json'];
// The maker's own first idea, and who made the proposal and how: never in a letter copy. Written out here,
// not taken from the scripts.
const SOURCE_ONLY = ['firstIdea', 'author', 'engine', 'track', 'model', 'source'];
// The format's own key order, in which every letter copy is written, as the ruling states it.
const FORMAT = {
  letter: ['name', 'bet', 'cost', 'absent', 'hardest', 'screens'],
  screen: ['id', 'title', 'container', 'over', 'note', 'items'],
  role: ['role', 'text', 'id', 'note', 'primary', 'options'],
  container: ['container', 'label', 'open', 'items'],
};
// The render fixture: every role and container, a dialog, notes, options, labels, provenance.
const EVERY = join(here, 'fixtures', 'render', 'every-part.json');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAP = 'MAP.sealed.json';
const PICK = 'PICK.md';
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'merge-'));
after(() => rmSync(root, { recursive: true, force: true }));

let made = 0;
// A fresh folder for one run, in a path with a space.
const fresh = () => join(root, `run ${++made}`);
// A board in a folder of its own: one folder holds one board, and its map and pick beside it.
const newBoard = () => join(fresh(), 'board');
const mapOf = board => join(dirname(board), MAP);
const pickOf = board => join(dirname(board), PICK);
const fixture = file => JSON.parse(readFileSync(join(FIXTURES, file), 'utf8'));
// The keys of an object that are in `keys`, in that order.
const inFormat = (object, keys) => keys.filter(key => Object.hasOwn(object, key));
const formatOf = item => (Object.hasOwn(item, 'role') ? FORMAT.role : FORMAT.container);
// What a letter copy holds: the proposal without SOURCE_ONLY, every object in the format's key order.
const letterOf = proposal => {
  const put = (object, keys) =>
    Object.fromEntries(
      inFormat(object, keys).map(key => {
        if (key === 'screens') return [key, object.screens.map(screen => put(screen, FORMAT.screen))];
        if (key === 'items') return [key, object.items.map(item => put(item, formatOf(item)))];
        return [key, object[key]];
      }),
    );
  return put(proposal, FORMAT.letter);
};
// The same without the order: what the proposal says, minus SOURCE_ONLY (deepEqual ignores key order).
const without = proposal => Object.fromEntries(Object.entries(proposal).filter(([key]) => !SOURCE_ONLY.includes(key)));
// Every object of a letter holds its keys in the format's order, and no key beyond it.
function assertFormatOrder(letter, at) {
  const walk = (object, keys, path) => {
    assert.deepEqual(Object.keys(object), inFormat(object, keys), `${at} ${path}`);
    if (Object.hasOwn(object, 'screens')) object.screens.forEach((screen, i) => walk(screen, FORMAT.screen, `screens[${i}]`));
    if (Object.hasOwn(object, 'items')) object.items.forEach((item, i) => walk(item, formatOf(item), `${path}.items[${i}]`));
  };
  walk(letter, FORMAT.letter, 'proposal');
}
// Every object's keys in reverse, all the way down; lists keep their order.
const reversed = value => {
  if (Array.isArray(value)) return value.map(reversed);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).reverse().map(([key, v]) => [key, reversed(v)]));
  return value;
};
const pretty = value => `${JSON.stringify(value, null, 2)}\n`;
const readText = (dir, name) => readFileSync(join(dir, name), 'utf8');
// The map names its board and holds its letters: { board, letters }.
const readWholeMap = board => JSON.parse(readFileSync(mapOf(board), 'utf8'));
const readMap = board => readWholeMap(board).letters;
const lettersOn = board => readdirSync(board).sort();
// Everything in a folder, by name, byte for byte, sub-folders included; a link is recorded as where it points.
const snapshot = dir => {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  return Object.fromEntries(
    entries.map(e => {
      const path = join(dir, e.name);
      if (e.isSymbolicLink()) return [e.name, `-> ${readlinkSync(path)}`];
      return [e.name, e.isDirectory() ? snapshot(path) : readFileSync(path)];
    }),
  );
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

// The command, run from the test's own folder (or another), so that a path it should never take lands
// nowhere else.
const runWith = ({ preload, env, cwd = root } = {}, ...args) =>
  spawnSync(process.execPath, [...(preload ? ['--require', preload] : []), cli, ...args], { encoding: 'utf8', cwd, env: { ...process.env, ...env } });
const run = (...args) => runWith({}, ...args);
// The command started without waiting, so that two can run at once.
const start = ({ preload, env } = {}, ...args) =>
  new Promise(resolve => {
    const child = spawn(process.execPath, [...(preload ? ['--require', preload] : []), cli, ...args], { cwd: root, env: { ...process.env, ...env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
// A CommonJS module required before the command (Node 20.0 has no --import).
const writePreload = (dir, name, lines) => {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, name);
  writeFileSync(file, [...lines, "require('node:module').syncBuiltinESMExports();"].join('\n'));
  return file;
};
// Faults put in by hand. REFUSE_PATH or REFUSE_NAME refuses writing or making that path, or that file name
// wherever it is; PARTIAL_PATH writes one byte of that file and then fails; DIE_BEFORE_MAP kills the merge as
// it is about to write the map; REFUSE_RENAME refuses every rename; WINDOWS_RENAME refuses a rename onto anything that
// exists, as Windows does; FILL_BEFORE_RENAME puts another merge's letter in the board just before the
// rename; RENAME_DELAY_MS holds every rename back that long, so two merges overlap.
const writeFaults = dir =>
  writePreload(dir, 'faults.cjs', [
    "const fs = require('node:fs');",
    "const { basename, join } = require('node:path');",
    'const { writeFileSync: write, mkdirSync: make, renameSync: rename, existsSync: exists } = fs;',
    'const env = process.env;',
    'const refused = (code, path) => Object.assign(new Error(`${code}: refused, ${path}`), { code });',
    'const hit = path => String(path) === env.REFUSE_PATH || basename(String(path)) === env.REFUSE_NAME;',
    'fs.writeFileSync = (path, ...rest) => {',
    "  if (hit(path)) throw refused('EACCES', path);",
    "  if (String(path) === env.PARTIAL_PATH) { write(path, '{', ...rest.slice(1)); throw refused('ENOSPC', path); }",
    "  if (env.DIE_BEFORE_MAP && basename(String(path)) === 'MAP.sealed.json') process.kill(process.pid, 'SIGKILL');",
    '  return write(path, ...rest);',
    '};',
    "fs.mkdirSync = (path, ...rest) => { if (hit(path)) throw refused('EACCES', path); return make(path, ...rest); };",
    'fs.renameSync = (from, to) => {',
    '  const until = Date.now() + Number(env.RENAME_DELAY_MS || 0);',
    '  while (Date.now() < until);',
    "  if (env.REFUSE_RENAME) throw refused('EACCES', to);",
    "  if (env.FILL_BEFORE_RENAME) { make(to, { recursive: true }); write(join(to, 'A.json'), 'another merge got here first'); }",
    "  if (env.WINDOWS_RENAME && exists(to)) throw refused('EPERM', to);",
    '  return rename(from, to);',
    '};',
  ]);

// What the CLI says on success, and on each refusal.
const merged = (board, letters) => `merged ${letters.length} proposal${letters.length === 1 ? '' : 's'} into ${board}: ${letters.join(', ')}\n`;
const sealedBoard = board =>
  `cannot merge into ${board}: the board beside ${mapOf(board)} is sealed, and its letters may already have been read. ` +
  'One folder holds one board; merging again would shuffle the letters anew. To rebuild it, delete the map and the board on purpose first.';
const pickLeft = board => `cannot merge into ${board}: ${pickOf(board)} already exists, a pick made on another board; delete it on purpose first.`;
const notEmpty = (board, entry) =>
  `cannot merge into ${board}: the folder is not empty (it holds ${JSON.stringify(entry)}). ` +
  'A board folder must be empty or absent, so that nothing but its letters is read in it.';
const stillSealed = (board, problem) =>
  `the author map is sealed until the founder's pick is written in ${pickOf(board)} as a line "Pick: <letter>" naming a letter on the board, or "Pick: none"; ${problem}`;
const invalidMessage = (src, faults) =>
  `cannot merge ${src}: not every proposal is valid, so no letter is written\n` +
  faults.map(([file, errors]) => `${join(src, file)}: it is not a valid proposal\n${errors.join('\n')}`).join('\n');

// ---- the letters

test('three proposals merge to A, B, C: the board holds the letters only, each without its first idea or who made it, in the format\'s key order', () => {
  const board = newBoard();
  // The letters, and the board folder as the system reads it.
  assert.deepEqual(mergeProposals(FIXTURES, board, { seed: 1 }), { letters: ['A', 'B', 'C'], board });
  assert.deepEqual(lettersOn(board), ['A.json', 'B.json', 'C.json'], 'no map, no pick in the board folder');
  assert.deepEqual(readdirSync(dirname(board)).sort(), [MAP, 'board'], 'the map sits beside it');
  const texts = ['A', 'B', 'C'].map(letter => readText(board, `${letter}.json`));
  assert.deepEqual([...texts].sort(), FIXTURE_FILES.map(file => pretty(letterOf(fixture(file)))).sort(), 'one letter per proposal, byte for byte');
  for (const text of texts) {
    assert.ok(!text.includes('\r'), 'LF only');
    assert.ok(text.endsWith('}\n'), 'one final newline');
    assert.deepEqual(validate(JSON.parse(text), { sealed: true }), [], 'a letter copy is a valid proposal in the sealed form');
    assert.ok(FIXTURE_FILES.some(file => isDeepStrictEqual(JSON.parse(text), without(fixture(file)))), 'nothing but SOURCE_ONLY is taken out');
    assertFormatOrder(JSON.parse(text), 'letter');
  }
});

test('the letter copies carry none of firstIdea, author, engine, track, model, source — not the key, not its value — and every key is in the format\'s order', () => {
  const dir = fresh();
  const sources = signed();
  const src = writeProposals(join(dir, 'the proposals'), sources);
  const board = join(dir, 'the board');
  mergeProposals(src, board, { seed: 2 });
  const texts = ['A', 'B', 'C'].map(letter => readText(board, `${letter}.json`));
  assert.deepEqual([...texts].sort(), Object.values(sources).map(p => pretty(letterOf(p))).sort());
  for (const text of texts) {
    const copy = JSON.parse(text);
    for (const key of SOURCE_ONLY) assert.ok(!Object.hasOwn(copy, key), `no key ${key}`);
    for (const sign of [...SIGNS, ...STEMS]) assert.ok(!text.includes(sign), `no ${sign}`);
    for (const { firstIdea } of Object.values(sources)) assert.ok(!text.includes(firstIdea), 'no first idea');
    // The third source was written screens first and name last: its letter is in the format's order.
    assert.deepEqual(Object.keys(copy), FORMAT.letter);
    assertFormatOrder(copy, 'letter');
  }
});

test('the same proposal written with its keys in different orders, spacing and signatures gives byte-identical letters', () => {
  const dir = fresh();
  const every = JSON.parse(readFileSync(EVERY, 'utf8'));
  const backwards = reversed(every);
  // The reversal reaches every level: the proposal, a screen, an item, a container.
  assert.notDeepEqual(Object.keys(backwards), Object.keys(every));
  assert.notDeepEqual(Object.keys(backwards.screens[0]), Object.keys(every.screens[0]));
  assert.notDeepEqual(Object.keys(backwards.screens[0].items[0]), Object.keys(every.screens[0].items[0]));
  const container = every.screens[0].items.findIndex(item => Object.hasOwn(item, 'container'));
  assert.notDeepEqual(Object.keys(backwards.screens[0].items[container]), Object.keys(every.screens[0].items[container]));
  const resigned = { ...backwards, firstIdea: 'zq-another-first-idea', author: 'zq-author-other', engine: 'zq-engine-other', track: 'fresh', model: 'zq-model-other', source: 'zq-source-other' };
  const src = writeProposals(join(dir, 'the proposals'), {
    'one.json': every,
    'two.json': JSON.stringify(backwards, null, '\t'),
    'three.json': `\uFEFF${JSON.stringify(resigned, null, 4).replace(/\n/g, '\r\n')}\r\n`,
  });
  const board = join(dir, 'the board');
  mergeProposals(src, board, { seed: 1 });
  const texts = ['A', 'B', 'C'].map(letter => readText(board, `${letter}.json`));
  assert.equal(texts[1], texts[0], 'B is A, byte for byte');
  assert.equal(texts[2], texts[0], 'C is A, byte for byte');
  assert.equal(texts[0], pretty(letterOf(every)));
});

test('the sealed map beside the board holds, per letter, the source file, its track and its engine — every source exactly once — and nothing else', () => {
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
  assert.deepEqual(mergeProposals(src, board, { seed: 3 }).letters, ['A', 'B', 'C', 'D', 'E']);
  const map = readMap(board);
  assert.deepEqual(Object.keys(map), ['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(Object.values(map).map(entry => entry.file).sort(), Object.keys(sources).sort(), 'every source exactly once');
  for (const [letter, entry] of Object.entries(map)) {
    assert.deepEqual(Object.keys(entry), ['file', 'track', 'engine'], letter);
    assert.deepEqual([entry.track, entry.engine], expected[entry.file], `${letter} is ${entry.file}`);
    assert.equal(readText(board, `${letter}.json`), pretty(letterOf(sources[entry.file])), `${letter} holds what ${entry.file} says`);
  }
  // The map names the board it belongs to, by its folder's name, and then holds the letters.
  assert.deepEqual(Object.keys(readWholeMap(board)), ['board', 'letters']);
  assert.equal(readFileSync(mapOf(board), 'utf8'), pretty({ board: 'the board', letters: map }), 'pretty-printed, LF, one final newline');
});

// ---- the shuffle

test('with a seed the shuffle is repeatable, and at least one of three seeds is not the order of the files', () => {
  const orders = {};
  for (const seed of [1, 2, 3]) {
    const once = newBoard();
    const twice = newBoard();
    mergeProposals(FIXTURES, once, { seed });
    mergeProposals(FIXTURES, twice, { seed });
    assert.deepEqual(snapshot(dirname(twice)), snapshot(dirname(once)), `seed ${seed}: the same board and map, byte for byte`);
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
    assert.deepEqual(mergeProposals(FIXTURES, newBoard(), { seed }).letters, ['A', 'B', 'C'], String(seed));
  }
  for (const seed of [-1, 1.5, 4294967296, '1', NaN]) {
    const board = newBoard();
    assert.throws(() => mergeProposals(FIXTURES, board, { seed }), e => e instanceof TypeError && /the seed must be a whole number from 0 to 4294967295/.test(e.message), String(seed));
    assert.ok(!existsSync(dirname(board)), `${seed}: nothing is written`);
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
  const board = join(dir, 'unseeded', 'board');
  let r = runWith({ preload: zero }, FIXTURES, '--out', board);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(Object.values(readMap(board)).map(entry => entry.file), ['free-first.json', 'unified-list.json', 'calendar.json']);
  // With a seed, crypto is never asked, and the board is the library's for that seed.
  const seeded = join(dir, 'seeded', 'board');
  r = runWith({ preload: zero, env: { NO_CRYPTO: '1' } }, FIXTURES, '--out', seeded, '--seed', '3');
  assert.equal(r.status, 0, r.stderr);
  const library = join(dir, 'library', 'board');
  mergeProposals(FIXTURES, library, { seed: 3 });
  assert.deepEqual(snapshot(dirname(seeded)), snapshot(dirname(library)));
  // Unseeded and untouched, it is still a permutation: every source once, under the letter that holds it.
  const real = join(dir, 'real', 'board');
  r = run(FIXTURES, '--out', real);
  assert.equal(r.status, 0, r.stderr);
  const map = readMap(real);
  assert.deepEqual(Object.values(map).map(entry => entry.file).sort(), FIXTURE_FILES);
  for (const [letter, entry] of Object.entries(map)) assert.equal(readText(real, `${letter}.json`), pretty(letterOf(fixture(entry.file))), letter);
});

test('the order the folder is listed in changes nothing: with a seed, the same board whichever way it is listed', () => {
  const dir = fresh();
  const src = writeProposals(join(dir, 'the proposals'), signed());
  const reverse = writePreload(dir, 'reverse.cjs', [
    "const fs = require('node:fs');",
    'const list = fs.readdirSync;',
    'fs.readdirSync = (...args) => list(...args).reverse();',
  ]);
  const listed = join(dir, 'listed', 'board');
  const backwards = join(dir, 'reversed', 'board');
  assert.equal(run(src, '--out', listed, '--seed', '5').status, 0);
  let r = runWith({ preload: reverse }, src, '--out', backwards, '--seed', '5');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(snapshot(dirname(backwards)), snapshot(dirname(listed)));
  // The map opens however the board folder is listed: its letters are compared as a set.
  writeFileSync(pickOf(backwards), 'Pick: A\n');
  const opened = run('open', backwards);
  r = runWith({ preload: reverse }, 'open', backwards);
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, opened.stdout, '']);
  assert.equal(opened.stdout.split('\n').length, 4);
});

// ---- what the CLI prints

test('the CLI prints the count, the letters and the board folder: never a source, never where the map is', () => {
  const dir = fresh();
  const src = writeProposals(join(dir, 'the proposals'), signed());
  const board = join(dir, 'the board');
  let r = run(src, '--out', board, '--seed', '1');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual([r.stdout, r.stderr], [merged(board, ['A', 'B', 'C']), '']);
  // The board's own path aside (a checkout's path may hold any word), the line says nothing more.
  const said = r.stdout.replace(board, '<board>');
  assert.equal(said, 'merged 3 proposals into <board>: A, B, C\n');
  for (const sign of [...SIGNS, ...STEMS, MAP, PICK, 'open']) assert.ok(!said.includes(sign), sign);
  assert.deepEqual(lettersOn(board), ['A.json', 'B.json', 'C.json']);
  // The seed reaches the library: the same board as the library makes with it.
  const library = join(dir, 'library', 'board');
  mergeProposals(src, library, { seed: 1 });
  assert.deepEqual(snapshot(board), snapshot(library));
  assert.deepEqual(readMap(board), readMap(library), 'the same letters; each map names its own board');
  assert.deepEqual([readWholeMap(board).board, readWholeMap(library).board], ['the board', 'board']);
  // Without a seed, and written --out=…: the same words.
  const other = join(dir, 'other', 'the board');
  r = run(`--out=${other}`, src);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual([r.stdout, r.stderr], [merged(other, ['A', 'B', 'C']), '']);
  // One proposal is one letter.
  const one = writeProposals(join(dir, 'one', 'proposals'), { 'solo-zq.json': fixture('calendar.json') });
  r = run(one, '--out', join(dir, 'one', 'board'));
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, merged(join(dir, 'one', 'board'), ['A']), '']);
});

// ---- the map stays sealed until a real pick

test('openMap opens only on a line "Pick: <letter>" naming a letter on the board, or "Pick: none"; anything else is refused with SealedError', () => {
  const board = newBoard();
  mergeProposals(FIXTURES, board, { seed: 1 });
  const sealed = problem => e => e instanceof SealedError && e instanceof MergeError && e.message === stillSealed(board, problem);
  assert.throws(() => openMap(board), sealed('that file cannot be read (not found)'));
  const noLine = 'that file holds no such line';
  const refused = [
    ['', noLine],
    [' \n\t\r\n', noLine],
    ['\uFEFF\n', noLine],
    ['TBD\n', noLine],
    ['\u200B\n', noLine],
    ['Pick: B\u200B\n', noLine],
    ['Pick: \u00ADB\n', noLine],
    ['pick: B\n', noLine],
    ['PICK: B\n', noLine],
    ['Pick: b\n', noLine],
    ['Pick: BC\n', noLine],
    ['Pick: None\n', noLine],
    ['Pick:\nB\n', noLine],
    ['Pick: B, with the filter row of A\n', noLine],
    ['I pick B. Pick: B\n', noLine],
    ['Pick: Z\n', '"Pick: Z" names no letter on this board (A, B, C)'],
    ['Pick: D\n', '"Pick: D" names no letter on this board (A, B, C)'],
    ['Pick: A\nand then\nPick: B\n', 'that file names more than one pick (A, B)'],
    ['Pick: none\nPick: C\n', 'that file names more than one pick (none, C)'],
  ];
  for (const [words, problem] of refused) {
    writeFileSync(pickOf(board), words);
    assert.throws(() => openMap(board), sealed(problem), JSON.stringify(words));
  }
  rmSync(pickOf(board));
  mkdirSync(pickOf(board));
  assert.throws(() => openMap(board), sealed('that file cannot be read (it is a folder, not a file)'));
  rmSync(pickOf(board), { recursive: true });
  const opened = [
    'Pick: B',
    'Pick: none\n',
    'Pick:C\n',
    '\uFEFFPick: C\r\n',
    'We went through the three of them on Thursday.\n\n  Pick:\tA  \n\nThe filter row of B goes with it.\n',
    'Pick: B\nlater, again:\nPick: B\n',
  ];
  for (const words of opened) {
    writeFileSync(pickOf(board), words);
    assert.deepEqual(openMap(board), readMap(board), JSON.stringify(words));
  }
  assert.deepEqual(Object.keys(openMap(board)), ['A', 'B', 'C']);
});

test('the CLI opens the map only after a real pick: before, exit 1 and nothing printed; after, one line per letter', () => {
  const dir = fresh();
  const sources = signed();
  const { track, ...unsigned } = fixture('calendar.json');
  sources['dee-zq.json'] = { ...unsigned, name: 'The day as a grid, unsigned' };
  const src = writeProposals(join(dir, 'the proposals'), sources);
  const board = join(dir, 'the board');
  assert.equal(run(src, '--out', board).status, 0);
  let r = run('open', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${stillSealed(board, 'that file cannot be read (not found)')}\n`]);
  writeFileSync(pickOf(board), 'TBD\n');
  r = run('open', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${stillSealed(board, 'that file holds no such line')}\n`]);
  writeFileSync(pickOf(board), 'Pick: Z\n');
  r = run('open', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${stillSealed(board, '"Pick: Z" names no letter on this board (A, B, C, D)')}\n`]);
  writeFileSync(pickOf(board), 'The second one reads best.\nPick: C\n');
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
  const empty = newBoard();
  mkdirSync(dirname(empty), { recursive: true });
  writeFileSync(pickOf(empty), 'Pick: none\n');
  r = run('open', empty);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot read ${mapOf(empty)}: not found\n`]);
});

test('a map that is not an author map is refused with a MergeError, never printed half-read', () => {
  const board = newBoard();
  mkdirSync(board, { recursive: true });
  for (const letter of ['A', 'B']) writeFileSync(join(board, `${letter}.json`), '{}\n');
  writeFileSync(pickOf(board), 'Pick: none\n');
  const entry = { file: 'a.json', track: 'system', engine: null };
  const whole = letters => ({ board: 'board', letters });
  const cases = [
    [null, 'it must be an object holding "board" and "letters"'],
    [[entry], 'it must be an object holding "board" and "letters"'],
    ['A', 'it must be an object holding "board" and "letters"'],
    [{ letters: { A: entry } }, '"board" must name the board folder'],
    [{ board: '', letters: { A: entry } }, '"board" must name the board folder'],
    [{ board: 5, letters: { A: entry } }, '"board" must name the board folder'],
    [{ board: 'board' }, '"letters" must be an object of letters'],
    [whole(null), '"letters" must be an object of letters'],
    [whole([entry]), '"letters" must be an object of letters'],
    [whole('A'), '"letters" must be an object of letters'],
    [whole({}), 'it holds no letter'],
    [whole({ a: entry }), '"a" is not a letter'],
    [whole({ AB: entry }), '"AB" is not a letter'],
    [whole({ A: null }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: [entry] }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: 'a.json' }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: { track: null, engine: null } }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: { ...entry, file: '' } }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: { ...entry, file: 5 } }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: { file: 'a.json', engine: null } }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: { ...entry, track: 5 } }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: { file: 'a.json', track: null } }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: { ...entry, engine: ['e'] } }), 'the entry for A is not { file, track, engine }'],
    [whole({ A: entry, B: { ...entry, file: undefined } }), 'the entry for B is not { file, track, engine }'],
  ];
  for (const [map, what] of cases) {
    writeFileSync(mapOf(board), JSON.stringify(map));
    const message = `cannot open ${mapOf(board)}: it is not an author map; ${what}`;
    assert.throws(() => openMap(board), e => e instanceof MergeError && !(e instanceof SealedError) && e.message === message, JSON.stringify(map));
    const r = run('open', board);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${message}\n`], JSON.stringify(map));
  }
  writeFileSync(mapOf(board), JSON.stringify(whole({ A: entry, B: { file: 'b.json', track: null, engine: 'e' } })));
  assert.deepEqual(Object.keys(openMap(board)), ['A', 'B']);
});

test('the map opens only for the board it names, holding exactly its letters: an orphan board, a letter gone, a letter added are refused', () => {
  const dir = fresh();
  const faults = writeFaults(dir);
  // A merge stopped dead between putting its board in place and writing its map: a whole board, no map.
  const orphan = join(dir, 'run', 'one');
  let r = runWith({ preload: faults, env: { DIE_BEFORE_MAP: '1' } }, FIXTURES, '--out', orphan, '--seed', '1');
  assert.equal(r.signal, 'SIGKILL');
  assert.deepEqual(lettersOn(orphan), ['A.json', 'B.json', 'C.json']);
  assert.ok(!existsSync(mapOf(orphan)), 'no map');
  // A sibling board is merged beside it and gets the map; a pick is written.
  const sibling = join(dir, 'run', 'two');
  r = run(FIXTURES, '--out', sibling, '--seed', '2');
  assert.equal(r.status, 0, r.stderr);
  writeFileSync(pickOf(sibling), 'Pick: A\n');
  // The orphan is not the board the map names: refused, nothing printed.
  const another = `cannot open ${mapOf(orphan)}: it is the map of the board "two", not of ${orphan}`;
  assert.throws(() => openMap(orphan), e => e instanceof MergeError && !(e instanceof SealedError) && e.message === another);
  r = run('open', orphan);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${another}\n`]);
  // The sibling opens.
  r = run('open', sibling);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(Object.keys(openMap(sibling)), ['A', 'B', 'C']);
  // A letter file gone, or one more: the board is not the board the map was written for.
  const mismatch = (letters, mapped) => `cannot open ${mapOf(sibling)}: ${sibling} holds the letters ${letters}, and the map the letters ${mapped}`;
  rmSync(join(sibling, 'B.json'));
  assert.throws(() => openMap(sibling), e => e instanceof MergeError && e.message === mismatch('A, C', 'A, B, C'));
  r = run('open', sibling);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${mismatch('A, C', 'A, B, C')}\n`]);
  writeFileSync(join(sibling, 'B.json'), '{}\n');
  writeFileSync(join(sibling, 'D.json'), '{}\n');
  assert.throws(() => openMap(sibling), e => e instanceof MergeError && e.message === mismatch('A, B, C, D', 'A, B, C'));
  // Other files in the board folder (a drawn page, the kit's stylesheet) are not letters, and change nothing.
  rmSync(join(sibling, 'D.json'));
  writeFileSync(join(sibling, 'A.html'), '<!doctype html>\n');
  writeFileSync(join(sibling, 'kit.css'), '\n');
  assert.deepEqual(Object.keys(openMap(sibling)), ['A', 'B', 'C']);
  // With no board folder at all, there are no letters.
  rmSync(sibling, { recursive: true });
  assert.throws(() => openMap(sibling), e => e instanceof MergeError && e.message === mismatch('(none)', 'A, B, C'));
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
  assert.deepEqual(readdirSync(dir).sort(), ['the board', 'the proposals'], 'no map');
  // A source is checked in the source form, so it must carry its firstIdea: a letter copy dropped among the
  // proposals is refused, and its track is no fault there.
  const { firstIdea, ...copyLike } = fixture('calendar.json');
  const among = writeProposals(join(dir, 'a copy among them'), { 'a.json': fixture('free-first.json'), 'b.json': copyLike });
  const missing = invalidMessage(among, [['b.json', ['proposal: "firstIdea" is missing']]]);
  assert.throws(() => mergeProposals(among, join(dir, 'board 2'), { seed: 1 }), e => e instanceof MergeError && e.message === missing);
  assert.ok(!existsSync(join(dir, 'board 2')), 'no board is made');
});

test('a letter copy is checked in the sealed form as it will be written; one that fails is a bug, and nothing is written', () => {
  const dir = fresh();
  // A fault put in by hand where nothing else would see it: a first idea slips into one letter's text as it
  // is serialized. Under seed 1 that letter is B (calendar), so A would be written first if the letters were
  // checked one by one as they are written.
  const slip = writePreload(dir, 'slip.cjs', [
    'const stringify = JSON.stringify;',
    "const slips = value => value && value.screens && value.name === 'The day as a grid';",
    "JSON.stringify = (value, replacer, space) => stringify(slips(value) && space === 2 ? { firstIdea: 'zq-slipped', ...value } : value, replacer, space);",
  ]);
  const board = join(dir, 'out', 'the board');
  const r = runWith({ preload: slip }, FIXTURES, '--out', board, '--seed', '1');
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.match(
    r.stderr,
    /\nError: the letter copy B is not in the sealed form, a bug in the merge; nothing is written\nproposal: "firstIdea" stays in the source file; a letter copy does not carry it\n\s+at /,
  );
  assert.ok(!existsSync(join(dir, 'out')), 'nothing is written');
});

test('more than 26 proposals are refused; 26 merge to A to Z, every source once', () => {
  const dir = fresh();
  const many = count => Object.fromEntries(Array.from({ length: count }, (_, i) => [`p${String(i + 1).padStart(2, '0')}.json`, fixture(FIXTURE_FILES[i % 3])]));
  const src26 = writeProposals(join(dir, 'twenty-six'), many(26));
  const board26 = join(dir, 'board 26', 'board');
  assert.deepEqual(mergeProposals(src26, board26, { seed: 1 }).letters, LETTERS);
  assert.deepEqual(Object.values(readMap(board26)).map(entry => entry.file).sort(), Object.keys(many(26)).sort());
  const src27 = writeProposals(join(dir, 'twenty-seven'), many(27));
  const board27 = join(dir, 'board 27', 'board');
  const message = `cannot merge ${src27}: it holds 27 proposals, and a board holds 26 at most, one per letter from A to Z`;
  assert.throws(() => mergeProposals(src27, board27, { seed: 1 }), e => e instanceof MergeError && e.message === message);
  const r = run(src27, '--out', board27);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${message}\n`]);
  assert.ok(!existsSync(dirname(board27)), 'nothing is written');
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
  assert.deepEqual(mergeProposals(src, board, { seed: 1 }).letters, ['A', 'B', 'C', 'D']);
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

test('a sealed board is not merged again, nor is another beside its map: refused with SealedError, and nothing changes', () => {
  const dir = fresh();
  const board = join(dir, 'board');
  mergeProposals(FIXTURES, board, { seed: 1 });
  const before = snapshot(dir);
  const src = writeProposals(join(fresh(), 'the proposals'), signed());
  // The same board, and a fresh board name beside the same map: one folder holds one board.
  const another = join(dir, 'another board');
  for (const [proposals, out, seed] of [[FIXTURES, board, 1], [FIXTURES, board, 2], [src, board, 1], [FIXTURES, another, 1]]) {
    assert.throws(() => mergeProposals(proposals, out, { seed }), e => e instanceof SealedError && e.message === sealedBoard(out), out);
    assert.deepEqual(snapshot(dir), before, 'unchanged');
  }
  let r = run(FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${sealedBoard(board)}\n`]);
  r = run(FIXTURES, '--out', another);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${sealedBoard(another)}\n`]);
  // Once picked, still sealed against a merge, even with the board folder deleted.
  writeFileSync(pickOf(board), 'Pick: A\n');
  rmSync(board, { recursive: true });
  const picked = snapshot(dir);
  r = run(src, '--out', board, '--seed', '9');
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${sealedBoard(board)}\n`]);
  assert.deepEqual(snapshot(dir), picked, 'unchanged');
});

test('a pick left beside a board folder, from another board, is refused before anything is written', () => {
  const board = newBoard();
  mkdirSync(dirname(board), { recursive: true });
  writeFileSync(pickOf(board), 'Pick: B\n');
  assert.throws(() => mergeProposals(FIXTURES, board, { seed: 1 }), e => e instanceof MergeError && !(e instanceof SealedError) && e.message === pickLeft(board));
  const r = run(FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${pickLeft(board)}\n`]);
  assert.deepEqual(readdirSync(dirname(board)), [PICK], 'nothing is written');
});

test('a board folder that holds anything is refused, naming what it holds; a file is refused; an empty folder is used', () => {
  const dir = fresh();
  const src = writeProposals(join(dir, 'the proposals'), signed());
  const letterLeft = writeProposals(join(dir, 'a letter left', 'board'), { 'D.json': fixture('calendar.json') });
  const looksEmpty = join(dir, 'looks empty', 'board');
  mkdirSync(looksEmpty, { recursive: true });
  writeFileSync(join(looksEmpty, '.DS_Store'), '');
  const cases = [
    [src, letterLeft, 'D.json'],
    [src, looksEmpty, '.DS_Store'],
  ];
  for (const [proposals, board, entry] of cases) {
    const before = snapshot(dirname(board));
    assert.throws(() => mergeProposals(proposals, board, { seed: 1 }), e => e instanceof MergeError && !(e instanceof SealedError) && e.message === notEmpty(board, entry), board);
    const r = run(proposals, '--out', board);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${notEmpty(board, entry)}\n`], board);
    assert.deepEqual(snapshot(dirname(board)), before, `${board}: unchanged`);
  }
  // A board that is a file cannot be written.
  const file = join(dir, 'a file', 'board');
  mkdirSync(dirname(file));
  writeFileSync(file, 'not a folder\n');
  assert.throws(() => mergeProposals(src, file, { seed: 1 }), e => e instanceof MergeError && e.message === `cannot write ${file}: part of the path is a file, not a folder`);
  // An empty folder is a new board.
  const empty = join(dir, 'empty', 'board');
  mkdirSync(empty, { recursive: true });
  assert.deepEqual(mergeProposals(src, empty, { seed: 1 }).letters, ['A', 'B', 'C']);
  assert.deepEqual(lettersOn(empty), ['A.json', 'B.json', 'C.json']);
});

test('a board is never made inside another board: refused when any folder above it holds letter files, and nothing is written', () => {
  const dir = fresh();
  const outer = join(dir, 'run', 'board');
  let r = run(FIXTURES, '--out', outer, '--seed', '1');
  assert.equal(r.status, 0, r.stderr);
  const before = snapshot(dir);
  const inside = (board, folder) => `cannot merge into ${board}: ${folder} above it holds letter files, so it is a board; a board is never made inside another.`;
  for (const board of [join(outer, 'again'), join(outer, 'deeper', 'again'), join(outer, 'deeper', 'still', 'again')]) {
    assert.throws(() => mergeProposals(FIXTURES, board, { seed: 1 }), e => e instanceof MergeError && !(e instanceof SealedError) && e.message === inside(board, outer), board);
    r = run(FIXTURES, '--out', board, '--seed', '2');
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${inside(board, outer)}\n`], board);
    assert.deepEqual(snapshot(dir), before, `${board}: the outer board and its map, byte for byte, and nothing new`);
  }
  // A folder that holds files of other names is no board: a board may be made under it.
  const notes = join(dir, 'notes');
  writeProposals(notes, { 'a.json': '{}', 'AB.json': '{}', 'A.json.bak': '{}', 'A.JSON': '{}' });
  r = run(FIXTURES, '--out', join(notes, 'board'));
  assert.equal(r.status, 0, r.stderr);
});

test('a board is never the proposals folder, inside it, or around it; a folder beside it with a longer name is not inside it', () => {
  const dir = fresh();
  const src = writeProposals(join(dir, 'x', 'proposals'), signed());
  const before = snapshot(dir);
  const apart = 'A board is made apart from the proposals, never among them.';
  const cases = [
    [src, src, `cannot merge into ${src}: it is the proposals folder. ${apart}`],
    [src, join(src, 'board'), `cannot merge into ${join(src, 'board')}: it lies inside the proposals folder ${src}. ${apart}`],
    [src, join(src, 'deeper', 'board'), `cannot merge into ${join(src, 'deeper', 'board')}: it lies inside the proposals folder ${src}. ${apart}`],
    // A name that only starts with ".." is a folder inside, not a step out.
    [src, join(src, '..board'), `cannot merge into ${join(src, '..board')}: it lies inside the proposals folder ${src}. ${apart}`],
    [src, join(dir, 'x'), `cannot merge into ${join(dir, 'x')}: it holds the proposals folder ${src}. ${apart}`],
    [src, dir, `cannot merge into ${dir}: it holds the proposals folder ${src}. ${apart}`],
  ];
  for (const [proposals, board, message] of cases) {
    assert.throws(() => mergeProposals(proposals, board, { seed: 1 }), e => e instanceof MergeError && !(e instanceof SealedError) && e.message === message, board);
    const r = run(proposals, '--out', board);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${message}\n`], board);
    for (const name of [...STEMS, ...Object.keys(SIGNATURES)]) assert.ok(!r.stderr.includes(name), `${board}: no source named`);
    assert.deepEqual(snapshot(dir), before, `${board}: nothing is written`);
  }
  // The same, reached through ".." from inside: one path, compared part by part.
  const roundabout = `${src}${sep}..${sep}proposals${sep}board`;
  assert.throws(() => mergeProposals(src, roundabout, { seed: 1 }), e => e.message.startsWith(`cannot merge into ${join(src, 'board')}: it lies inside the proposals folder`));
  // Beside it, a folder whose name starts the same is not inside it: the board is made.
  const sibling = join(dir, 'x', 'proposals-2');
  assert.deepEqual(mergeProposals(src, sibling, { seed: 1 }).letters, ['A', 'B', 'C']);
  assert.deepEqual(lettersOn(sibling), ['A.json', 'B.json', 'C.json']);
  assert.ok(existsSync(join(dir, 'x', MAP)));
});

// ---- one board, one path, written whole

test('a sealed board reached by another path is the same board: missing/../board is refused, and nothing is left behind', () => {
  const dir = fresh();
  mkdirSync(dir);
  const board = join(dir, 'board');
  let r = runWith({ cwd: dir }, FIXTURES, '--out', 'board', '--seed', '1');
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, merged(board, ['A', 'B', 'C']), '']);
  writeFileSync(pickOf(board), 'Pick: B\n');
  const before = snapshot(dir);
  r = runWith({ cwd: dir }, FIXTURES, '--out', `missing${sep}..${sep}board`, '--seed', '2');
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${sealedBoard(board)}\n`]);
  assert.throws(() => mergeProposals(FIXTURES, `${dir}${sep}missing${sep}..${sep}board`, { seed: 2 }), e => e instanceof SealedError && e.message === sealedBoard(board));
  assert.deepEqual(snapshot(dir), before, 'the first board, byte for byte, and no stray folder');
  // A new board reached that way is made where the path leads, and nothing else is made.
  const other = fresh();
  mkdirSync(other);
  r = runWith({ cwd: other }, FIXTURES, '--out', `missing${sep}..${sep}board`, '--seed', '1');
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, merged(join(other, 'board'), ['A', 'B', 'C']), '']);
  assert.deepEqual(readdirSync(other).sort(), [MAP, 'board']);
});

test('a sealed board reached through a linked folder and .. is the same board: refused, the pick still points where it did', t => {
  const dir = fresh();
  const target = join(dir, 'elsewhere', 'stage target');
  mkdirSync(target, { recursive: true });
  mkdirSync(join(dir, 'work'));
  try {
    symlinkSync(target, join(dir, 'work', 'stage'));
  } catch {
    return t.skip('this system makes no symbolic links');
  }
  // work/stage/.. is the folder that holds the link's target, as the system reads it: elsewhere.
  const viaLink = `${dir}${sep}work${sep}stage${sep}..${sep}board`;
  const board = join(dir, 'elsewhere', 'board');
  let r = run(FIXTURES, '--out', board, '--seed', '1');
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, merged(board, ['A', 'B', 'C']), '']);
  writeFileSync(pickOf(board), 'Pick: A\n');
  const before = snapshot(dir);
  for (const seed of ['2', '3']) {
    r = run(FIXTURES, '--out', viaLink, '--seed', seed);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${sealedBoard(board)}\n`], seed);
    r = runWith({ cwd: join(dir, 'work') }, FIXTURES, '--out', `stage${sep}..${sep}board`, '--seed', seed);
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${sealedBoard(board)}\n`], seed);
  }
  assert.deepEqual(snapshot(dir), before, 'the first board and its pick, byte for byte; no work/board');
  // The map opens through the same path, from beside the same board.
  r = run('open', viaLink);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.split('\n')[0], `A  ${readMap(board).A.file}  system  -`);
  // A new board through the link is made where the system would put it, and named so.
  const fresher = join(fresh(), 'stage target');
  mkdirSync(fresher, { recursive: true });
  symlinkSync(fresher, join(dir, 'work', 'other stage'));
  r = run(FIXTURES, '--out', `${dir}${sep}work${sep}other stage${sep}..${sep}board`, '--seed', '1');
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, merged(join(dirname(fresher), 'board'), ['A', 'B', 'C']), '']);
  assert.ok(!existsSync(join(dir, 'work', 'board')));
});

test('the proposals folder is read through one path too: through a link and .., the proposals the system finds there are merged', t => {
  const dir = fresh();
  const target = join(dir, 'elsewhere', 'stage target');
  mkdirSync(target, { recursive: true });
  mkdirSync(join(dir, 'work'));
  try {
    symlinkSync(target, join(dir, 'work', 'stage'));
  } catch {
    return t.skip('this system makes no symbolic links');
  }
  // The same file names in two folders: the one the system reaches, and the one the text of the path names.
  writeProposals(join(dir, 'elsewhere', 'the proposals'), { 'a.json': fixture('calendar.json'), 'b.json': fixture('free-first.json') });
  writeProposals(join(dir, 'work', 'the proposals'), { 'a.json': fixture('unified-list.json'), 'b.json': fixture('unified-list.json') });
  const board = newBoard();
  mergeProposals(`${dir}${sep}work${sep}stage${sep}..${sep}the proposals`, board, { seed: 1 });
  const texts = ['A', 'B'].map(letter => readText(board, `${letter}.json`)).sort();
  assert.deepEqual(texts, ['calendar.json', 'free-first.json'].map(file => pretty(letterOf(fixture(file)))).sort());
  // A refusal names the folder the system reached.
  const nowhere = `${dir}${sep}work${sep}stage${sep}..${sep}nothing here`;
  assert.throws(() => mergeProposals(nowhere, newBoard(), { seed: 1 }), e => e instanceof MergeError && e.message === `cannot read ${join(dir, 'elsewhere', 'nothing here')}: not found`);
});

test('two merges started at once into one new board: exactly one succeeds, and the board is whole', async () => {
  const dir = fresh();
  const faults = writeFaults(dir);
  for (let round = 0; round < 20; round++) {
    const board = join(dir, `round ${round}`, 'board');
    // Each rename is held back, so both merges pass their checks before either puts its board in place.
    const runs = await Promise.all(['1', '2'].map(seed => start({ preload: faults, env: { RENAME_DELAY_MS: '150' } }, FIXTURES, '--out', board, '--seed', seed)));
    const won = runs.filter(r => r.status === 0);
    const lost = runs.filter(r => r.status !== 0);
    assert.equal(won.length, 1, `round ${round}: ${JSON.stringify(runs)}`);
    assert.equal(lost[0].status, 1, lost[0].stderr);
    assert.equal(lost[0].stdout, '');
    assert.match(lost[0].stderr, new RegExp(`^cannot merge into ${quote(board)}: (the folder is not empty \\(it holds "A\\.json"\\)|the board beside )`), lost[0].stderr);
    assert.deepEqual(readdirSync(dirname(board)).sort(), [MAP, 'board'], `round ${round}: nothing left behind`);
    const map = readMap(board);
    assert.deepEqual(lettersOn(board), ['A.json', 'B.json', 'C.json']);
    for (const [letter, entry] of Object.entries(map)) assert.equal(readText(board, `${letter}.json`), pretty(letterOf(fixture(entry.file))), `round ${round}: ${letter}`);
  }
});

test('two merges started at once into two boards beside each other: the map is created once, and the other board is taken back', async () => {
  const dir = fresh();
  const faults = writeFaults(dir);
  for (let round = 0; round < 10; round++) {
    const folder = join(dir, `round ${round}`);
    const boards = [join(folder, 'one'), join(folder, 'two')];
    const runs = await Promise.all(boards.map(board => start({ preload: faults, env: { RENAME_DELAY_MS: '150' } }, FIXTURES, '--out', board, '--seed', '1')));
    const winner = runs.findIndex(r => r.status === 0);
    assert.ok(winner !== -1 && runs[1 - winner].status === 1, `round ${round}: ${JSON.stringify(runs)}`);
    const [board, loser] = [boards[winner], boards[1 - winner]];
    assert.equal(runs[1 - winner].stderr, `${sealedBoard(loser)}\n`);
    assert.deepEqual(readdirSync(folder).sort(), [MAP, winner === 0 ? 'one' : 'two'], `round ${round}: the other board is gone`);
    for (const [letter, entry] of Object.entries(readMap(board))) assert.equal(readText(board, `${letter}.json`), pretty(letterOf(fixture(entry.file))), letter);
  }
});

test('the letters are written in letter order, A first, and the map last: neither file times nor creation order follow the sources', () => {
  const dir = fresh();
  const log = join(dir, 'writes.txt');
  const order = writePreload(dir, 'order.cjs', [
    "const fs = require('node:fs');",
    "const { basename } = require('node:path');",
    'const write = fs.writeFileSync;',
    'const seen = [];',
    'fs.writeFileSync = (path, ...rest) => { seen.push(basename(String(path))); return write(path, ...rest); };',
    "process.on('exit', () => write(process.env.WRITE_LOG, seen.join('\\n')));",
  ]);
  // Seed 1 puts unified-list under A, calendar under B and free-first under C: not the order of the files.
  const board = join(dir, 'out', 'board');
  const r = runWith({ preload: order, env: { WRITE_LOG: log } }, FIXTURES, '--out', board, '--seed', '1');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(Object.values(readMap(board)).map(entry => entry.file), ['unified-list.json', 'calendar.json', 'free-first.json']);
  assert.deepEqual(readFileSync(log, 'utf8').split('\n'), ['A.json', 'B.json', 'C.json', MAP]);
});

test('a board that cannot be written whole is not written at all: no letter, no map, no stray folder', () => {
  const dir = fresh();
  const faults = writeFaults(dir);
  // A letter that cannot be written, half-way, under folders the merge had to make: none of them is left,
  // and an empty folder it did not make is kept.
  mkdirSync(join(dir, 'empty above'));
  let board = join(dir, 'empty above', 'new', 'deeper', 'board');
  let r = runWith({ preload: faults, env: { REFUSE_NAME: 'B.json' } }, FIXTURES, '--out', board, '--seed', '1');
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${board}: no permission\n`]);
  assert.deepEqual(readdirSync(join(dir, 'empty above')), [], 'no board, no stray folder, and the folder above is still there');
  // The folders above the board can be made only part of the way: what was made is taken away.
  board = join(dir, 'new', 'deeper', 'n'.repeat(300), 'board');
  r = runWith({ preload: faults }, FIXTURES, '--out', board);
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.ok(r.stderr.startsWith(`cannot write ${board}: ENAMETOOLONG`), r.stderr);
  assert.ok(!existsSync(join(dir, 'new')), 'no stray folder');
  // The board's folder cannot be made.
  board = join(dir, 'unmade', 'board');
  r = runWith({ preload: faults, env: { REFUSE_PATH: dirname(board) } }, FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${board}: no permission\n`]);
  assert.ok(!existsSync(dirname(board)));
  // The board cannot be put in place: an empty board folder that was there is there again, empty.
  board = join(dir, 'kept', 'board');
  mkdirSync(board, { recursive: true });
  r = runWith({ preload: faults, env: { REFUSE_RENAME: '1' } }, FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${board}: no permission\n`]);
  assert.deepEqual(snapshot(dirname(board)), { board: {} });
  // And where there was no board folder, none is made.
  board = join(dir, 'never', 'board');
  r = runWith({ preload: faults, env: { REFUSE_RENAME: '1' } }, FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${board}: no permission\n`]);
  assert.ok(!existsSync(dirname(board)));
  // The map cannot be written: the board is taken back, and the folder made for it with it.
  board = join(dir, 'unsealed', 'board');
  r = runWith({ preload: faults, env: { REFUSE_PATH: mapOf(board) } }, FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${mapOf(board)}: no permission\n`]);
  assert.ok(!existsSync(dirname(board)));
  // The map is begun and cannot be finished: the part written is taken away too.
  board = join(dir, 'half sealed', 'board');
  r = runWith({ preload: faults, env: { PARTIAL_PATH: mapOf(board) } }, FIXTURES, '--out', board);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot write ${mapOf(board)}: ENOSPC: refused, ${mapOf(board)}\n`]);
  assert.ok(!existsSync(dirname(board)));
});

test('the board goes in place by one rename: an empty folder is used where a rename cannot replace one, and a folder filled first refuses it', () => {
  const dir = fresh();
  const faults = writeFaults(dir);
  // As on Windows, a rename onto anything that exists is refused: the empty board folder is taken away first.
  let board = join(dir, 'windows', 'board');
  mkdirSync(board, { recursive: true });
  let r = runWith({ preload: faults, env: { WINDOWS_RENAME: '1' } }, FIXTURES, '--out', board, '--seed', '1');
  assert.deepEqual([r.status, r.stdout, r.stderr], [0, merged(board, ['A', 'B', 'C']), '']);
  assert.deepEqual(lettersOn(board), ['A.json', 'B.json', 'C.json']);
  // Another merge puts its board in place first: the rename is refused, this one's letters go, the other's stay.
  for (const env of [{ FILL_BEFORE_RENAME: '1' }, { FILL_BEFORE_RENAME: '1', WINDOWS_RENAME: '1' }]) {
    board = join(fresh(), 'board');
    r = runWith({ preload: faults, env }, FIXTURES, '--out', board, '--seed', '1');
    assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `${notEmpty(board, 'A.json')}\n`], JSON.stringify(env));
    assert.deepEqual(snapshot(dirname(board)), { board: { 'A.json': Buffer.from('another merge got here first') } }, JSON.stringify(env));
  }
});

test('the board folder gets the mode a plain folder gets under the umask, not the private mode of a temporary folder', t => {
  if (process.platform === 'win32') return t.skip('Windows reports no folder modes');
  const dir = fresh();
  mkdirSync(dir);
  // Only a file system that keeps modes can tell them apart.
  const probe = join(dir, 'probe');
  mkdirSync(probe, { mode: 0o700 });
  if ((statSync(probe).mode & 0o777) !== 0o700) return t.skip('this file system keeps no folder modes');
  const old = process.umask(0o022);
  try {
    const board = join(dir, 'out', 'board');
    mergeProposals(FIXTURES, board, { seed: 1 });
    const plain = join(dir, 'plain');
    mkdirSync(plain);
    assert.equal(statSync(board).mode & 0o777, statSync(plain).mode & 0o777);
    assert.equal(statSync(board).mode & 0o777, 0o755);
  } finally {
    process.umask(old);
  }
});

// ---- the shared reader

test('a proposal file is read as UTF-8 JSON, one byte-order mark dropped; what cannot be read is refused naming the path', t => {
  const dir = fresh();
  const json = JSON.stringify(fixture('calendar.json'), null, 2);
  const files = writeProposals(join(dir, 'files'), {
    'plain.json': json,
    'marked.json': `\uFEFF${json}`,
    'twice.json': `\uFEFF\uFEFF${json}`,
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
  const board = newBoard();
  const marked = writeProposals(join(dir, 'marked'), { 'marked.json': `\uFEFF${json}` });
  assert.deepEqual(mergeProposals(marked, board, { seed: 1 }).letters, ['A']);
  assert.equal(readFileSync(join(board, 'A.json'), 'utf8'), pretty(letterOf(fixture('calendar.json'))));
  for (const [name, text] of [['broken.json', '{ "name": "half a proposal",'], ['twice.json', `\uFEFF\uFEFF${json}`]]) {
    const src = writeProposals(join(dir, `with ${name}`), { 'calendar.json': json, [name]: text });
    const out = newBoard();
    const r = run(src, '--out', out);
    assert.equal(r.status, 1, name);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, new RegExp(`^cannot read ${quote(join(src, name))}: it is not JSON \\([\\s\\S]+\\)\\n$`), name);
    assert.ok(!existsSync(dirname(out)), `${name}: nothing is written`);
  }
  const notUtf8 = writeProposals(join(dir, 'with latin'), { 'calendar.json': json });
  writeFileSync(join(notUtf8, 'latin.json'), readFileSync(latin));
  let r = run(notUtf8, '--out', newBoard());
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot read ${join(notUtf8, 'latin.json')}: it is not UTF-8\n`]);
  // A link to a proposal that is gone is not a folder: it is read, and refused, never silently left out.
  const gone = writeProposals(join(dir, 'with a link'), { 'calendar.json': json });
  try {
    symlinkSync(join(gone, 'nowhere.json'), join(gone, 'gone.json'));
  } catch {
    return t.skip('this system makes no symbolic links');
  }
  const linkBoard = newBoard();
  r = run(gone, '--out', linkBoard);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', `cannot read ${join(gone, 'gone.json')}: not found\n`]);
  assert.ok(!existsSync(dirname(linkBoard)), 'nothing is written');
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
    [['open', board, '--out', board], /^unknown flag --out\n/],
    [['open', board, '--seed=1'], /^unknown flag --seed\n/],
  ];
  for (const [args, pattern] of usages) {
    const r = run(...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stderr}`);
    assert.equal(r.stdout, '', args.join(' '));
    assert.match(r.stderr, pattern, args.join(' '));
    assert.match(r.stderr, /\n\nUsage: node scripts\/merge\.mjs <proposals dir> --out <board dir> \[--seed <n>\]\n/, args.join(' '));
    assert.ok(!existsSync(dir), `${args.join(' ')}: nothing is written`);
  }
  // The highest seed is a seed.
  const r = run(FIXTURES, '--out', board, '--seed', '4294967295');
  assert.equal(r.status, 0, r.stderr);
});

test('the CLI --help prints the usage, naming both forms, every flag, where the map and the pick sit, and the exit codes, and exits 0', () => {
  for (const args of [['--help'], ['-h'], ['open', '--help'], [FIXTURES, '--help']]) {
    const r = run(...args);
    assert.equal(r.status, 0, args.join(' '));
    assert.equal(r.stderr, '');
    assert.match(r.stdout, /^Usage: node scripts\/merge\.mjs <proposals dir> --out <board dir> \[--seed <n>\]\n {7}node scripts\/merge\.mjs open <board dir>\n/);
    const words = ['--out', '--seed', MAP, PICK, 'beside the board folder', 'the letters and nothing else', 'whole or not at all', 'at most 26', 'empty or absent', 'one folder holds one board', 'delete it and its map on purpose', '"Pick: <letter>"', '"Pick: none"', 'naming the board it belongs to', 'never made inside another', 'a map that names another board', '--flag=value', '0 success', '1 a refusal', '2 bad usage'];
    for (const word of words) assert.ok(r.stdout.includes(word), word);
  }
});

test('no product name appears in the merge scripts or the shared reader', () => {
  const scripts = join(here, '..', 'scripts');
  for (const file of [cli, join(scripts, 'lib', 'merge.mjs'), join(scripts, 'lib', 'json-file.mjs'), join(scripts, 'lib', 'cli.mjs')]) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\bVerbato\b/i, file);
    assert.doesNotMatch(text, /\bVersa\b/, file);
  }
});
