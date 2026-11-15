// deal: letters for a blind comparison of pictures. Each version's pictures are copied into a new folder under a
// letter dealt at random, which letter is which is written to a sealed file beside the folder, and nothing the
// command prints, and nothing about the copies, says which version a letter holds.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DealError, deal, openSealed, sealedBeside } from '../scripts/deal.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'deal.mjs');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'deal-'));
after(() => rmSync(root, { recursive: true, force: true }));

// ---- what the tests are made of

let made = 0;
// A fresh folder of this run, with pictures in it: each a file whose content is its own name.
const fresh = (pictures = ['shots/today-1280-light.png', 'fresh/outside-openai-1280-light.png'], name = `run ${++made}`) => {
  const dir = join(root, name);
  for (const picture of pictures) {
    mkdirSync(dirname(join(dir, picture)), { recursive: true });
    writeFileSync(join(dir, picture), picture);
  }
  return dir;
};
const run = (cwd, ...args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
const visible = name => !name.startsWith('.fuse_hidden');
// Every file and folder under a folder, by its path from it, sorted: what a refusal must leave as it was.
const tree = (dir, inside = '') =>
  readdirSync(join(dir, inside), { withFileTypes: true }).filter(entry => visible(entry.name))
    .flatMap(entry => (entry.isDirectory() ? [`${inside}${entry.name}/`, ...tree(dir, `${inside}${entry.name}/`)] : [`${inside}${entry.name}`])).sort();
const sealedOf = (dir, name = 'BESIDE') => JSON.parse(readFileSync(join(dir, `${name}.sealed.json`), 'utf8'));
// A refusal: exit 1, one message on standard error, nothing on standard output, and the folder as it was.
const refused = (dir, args, message) => {
  const before = tree(dir);
  const r = run(dir, ...args);
  assert.deepEqual([r.status, r.stdout], [1, ''], r.stderr);
  assert.match(r.stderr, message);
  assert.doesNotMatch(r.stderr, /^Usage:/m, 'a refusal is not bad usage');
  assert.deepEqual(tree(dir), before, 'a refusal leaves nothing behind');
};
const badUsage = (dir, args, message) => {
  const before = tree(dir);
  const r = run(dir, ...args);
  assert.deepEqual([r.status, r.stdout], [2, ''], r.stderr);
  assert.match(r.stderr, message);
  assert.match(r.stderr, /^Usage: node scripts\/deal\.mjs /m);
  assert.deepEqual(tree(dir), before, 'bad usage writes nothing');
};
const TWO = ['shots/today-1280-light.png', 'fresh/outside-openai-1280-light.png'];

// ---- the command line

test('--help prints the usage and exits 0: the two forms, what is written where, and the exit codes', () => {
  for (const flag of ['--help', '-h']) {
    const r = run(root, flag);
    assert.deepEqual([r.status, r.stderr], [0, '']);
    assert.match(r.stdout, /^Usage: node scripts\/deal\.mjs <picture>\.\.\. --out <folder> \[--group <name>=<picture>,<picture>\]\n {7}node scripts\/deal\.mjs open <folder>\n\n/);
    assert.match(r.stdout, /Exit codes: 0 success · 1 a refusal .* · 2 bad usage\.\n$/s);
    assert.match(r.stdout, /A flag may also be written --flag=value\./);
  }
  // Help wins over what stands after it, a group at fault too, and is found after other words.
  assert.equal(run(root, 'a.png', '--help', '--nonsense').status, 0);
  assert.equal(run(root, '--help', '--group').status, 0);
  assert.equal(run(root, '--group', 'a=b.png', '-h', '--group', 'nonsense').status, 0);
  assert.equal(run(root, '--group', '--help').status, 2);
});

test('bad usage exits 2 with the message and the usage, and writes nothing', () => {
  const dir = fresh();
  badUsage(dir, [], /^--out is missing\n/);
  badUsage(dir, [...TWO], /^--out is missing\n/);
  badUsage(dir, [TWO[0], '--out', 'beside'], /^a comparison needs two versions or more; 1 was given\n/);
  badUsage(dir, ['--out', 'beside'], /^a comparison needs two versions or more; 0 were given\n/);
  badUsage(dir, [...TWO, '--out', 'beside', '--seed', '7'], /^unknown flag --seed\n/);
  badUsage(dir, [...TWO, '--out', 'beside', '--out', 'other'], /^--out is given twice\n/);
  badUsage(dir, [...TWO, '--out'], /^--out needs a value\n/);
  badUsage(dir, [...TWO, '--out', 'beside', '--group'], /^--group needs a value\n/);
  badUsage(dir, [...TWO, '--out', 'beside', '--group', '--out'], /^--group needs a value; "--out" is a flag\n/);
  badUsage(dir, [...TWO, '--out', 'beside', '--group', 'system'], /^--group is written <name>=<picture>,<picture>; it is "system"\n/);
  badUsage(dir, [...TWO, '--out', 'beside', '--group', '=a.png'], /^--group is written <name>=<picture>,<picture>; it is "=a\.png"\n/);
  badUsage(dir, [...TWO, '--out', 'beside', '--group', 'system=a.png,,b.png'], /^--group is written <name>=<picture>,<picture>; it is "system=a\.png,,b\.png"\n/);
  badUsage(dir, ['open'], /^open takes one <folder>, got 0\n/);
  badUsage(dir, ['open', 'beside', 'other'], /^open takes one <folder>, got 2\n/);
  badUsage(dir, ['open', 'beside', '--out', 'x'], /^unknown flag --out\n/);
});

// ---- a deal

test('each picture is copied under a letter, as <letter><its extension>; the sealed file lies beside the folder, never in it; and only the count and the letters are printed', () => {
  const dir = fresh();
  const r = run(dir, ...TWO, '--out', 'beside');
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.equal(r.stdout, 'dealt 2 versions into beside: A, B\n');
  assert.deepEqual(readdirSync(join(dir, 'beside')).filter(visible).sort(), ['A.png', 'B.png']);
  // The sealed file: the folder it belongs to, and each letter's source as it was written, in letter order.
  const sealed = sealedOf(dir);
  assert.deepEqual(Object.keys(sealed), ['folder', 'letters']);
  assert.equal(sealed.folder, 'beside');
  assert.deepEqual(Object.keys(sealed.letters), ['A', 'B']);
  assert.deepEqual(Object.values(sealed.letters).sort(), [...TWO].sort());
  for (const [letter, source] of Object.entries(sealed.letters)) assert.equal(readFileSync(join(dir, 'beside', `${letter}.png`), 'utf8'), source, letter);
  assert.ok(readFileSync(join(dir, 'BESIDE.sealed.json'), 'utf8').endsWith('\n'));
  // Nothing printed names a source, and nothing but the folder, the sealed file and the sources is there.
  for (const word of ['today', 'outside', 'openai', 'fresh', 'shots', 'sealed']) assert.ok(!r.stdout.includes(word), word);
  assert.deepEqual(tree(dir), ['BESIDE.sealed.json', 'beside/', 'beside/A.png', 'beside/B.png', 'fresh/', 'fresh/outside-openai-1280-light.png', 'shots/', 'shots/today-1280-light.png']);
});

test('the sealed file is named for the folder, in capitals, in the folder\'s parent; the folders above the folder are made; a path with a space works', () => {
  const dir = fresh(['the shots/today 1280.jpg', 'a fresh one/outside openai.jpg']);
  const r = run(dir, 'the shots/today 1280.jpg', 'a fresh one/outside openai.jpg', '--out=06 look/side by side');
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.equal(r.stdout, 'dealt 2 versions into 06 look/side by side: A, B\n');
  assert.equal(sealedBeside(join(dir, '06 look', 'side by side')), join(dir, '06 look', 'SIDE BY SIDE.sealed.json'));
  const sealed = sealedOf(join(dir, '06 look'), 'SIDE BY SIDE');
  assert.equal(sealed.folder, 'side by side');
  // Each copy keeps its picture's extension.
  assert.deepEqual(readdirSync(join(dir, '06 look', 'side by side')).filter(visible).sort(), ['A.jpg', 'B.jpg']);
  // An absolute folder is dealt into as well, and --out . is refused: the folder must not be there.
  const elsewhere = fresh();
  assert.equal(run(elsewhere, ...TWO, '--out', join(elsewhere, 'deep', 'er', 'beside')).status, 0);
  assert.ok(existsSync(join(elsewhere, 'deep', 'er', 'BESIDE.sealed.json')));
  refused(elsewhere, [...TWO, '--out', '.'], /^cannot deal into \S.*: it is already there\. /);
});

test('every copy has one and the same modification time, whatever the sources\' own, and the copies are made in letter order', () => {
  const pictures = ['a.png', 'b.png', 'c.png'];
  const dir = fresh(pictures);
  pictures.forEach((picture, i) => utimesSync(join(dir, picture), new Date(2020, i, 1), new Date(2020, i, 1)));
  assert.equal(run(dir, ...pictures, '--out', 'beside').status, 0);
  const times = ['A', 'B', 'C'].map(letter => statSync(join(dir, 'beside', `${letter}.png`)).mtimeMs);
  assert.equal(new Set(times).size, 1, `one modification time: ${times}`);
  assert.ok(times[0] > new Date(2021, 0, 1).getTime(), 'the time of the deal, not a source\'s');
  // The order the copies are made in is the letters', so no order on disk follows the order the pictures were named in.
  const copied = [];
  const out = join(dir, 'again');
  const { letters } = deal(pictures.map(picture => ({ pictures: [join(dir, picture)] })), out, { copy: (from, to) => { copied.push(to); copyFileSync(from, to); } });
  assert.deepEqual(letters, ['A', 'B', 'C']);
  assert.deepEqual(copied.map(to => to.slice(to.lastIndexOf('/') + 1)), ['A.png', 'B.png', 'C.png']);
});

test('the letters do not follow the order the pictures were named in: over forty deals of three, more than one order is dealt, and every picture is under each letter at some time', () => {
  const pictures = ['a.png', 'b.png', 'c.png'];
  const dir = fresh(pictures);
  const orders = new Set();
  const under = Object.fromEntries(pictures.map(picture => [picture, new Set()]));
  for (let i = 0; i < 40; i++) {
    deal(pictures.map(picture => ({ pictures: [join(dir, picture)] })), join(dir, `deal ${i}`, 'beside'));
    const { letters } = sealedOf(join(dir, `deal ${i}`));
    assert.deepEqual(Object.keys(letters), ['A', 'B', 'C']);
    orders.add(Object.values(letters).map(source => source.slice(-5)).join(' '));
    for (const [letter, source] of Object.entries(letters)) under[source.slice(-5)].add(letter);
  }
  assert.ok(orders.size >= 2, `more than one order: ${[...orders]}`);
  for (const picture of pictures) assert.deepEqual([...under[picture]].sort(), ['A', 'B', 'C'], picture);
  // And through the command itself, named in one order every time.
  const first = new Set();
  for (let i = 0; i < 12 && first.size < 2; i++) {
    assert.equal(run(dir, ...pictures, '--out', `cli ${i}/beside`).status, 0);
    first.add(sealedOf(join(dir, `cli ${i}`)).letters.A);
  }
  assert.ok(first.size >= 2, 'the picture named first is not always A');
});

// ---- several pictures to a version

test('a version with several pictures is one group under one letter: each copy is <letter>-<n><its extension>, in the order given, and --group may repeat', () => {
  const pictures = ['shots/today-390-light.png', 'shots/today-1280-light.png', 'fresh/one 390.png', 'fresh/one-1280.png'];
  const dir = fresh(pictures);
  const r = run(dir, '--group', `system=${pictures[0]},${pictures[1]}`, `--group=fresh-one=${pictures[2]},${pictures[3]}`, '--out', 'beside');
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.equal(r.stdout, 'dealt 2 versions into beside: A, B\n');
  assert.deepEqual(readdirSync(join(dir, 'beside')).filter(visible).sort(), ['A-1.png', 'A-2.png', 'B-1.png', 'B-2.png']);
  const { letters } = sealedOf(dir);
  assert.deepEqual(Object.values(letters).map(version => version.group).sort(), ['fresh-one', 'system']);
  for (const [letter, { group, pictures: sources }] of Object.entries(letters)) {
    assert.deepEqual(sources, group === 'system' ? pictures.slice(0, 2) : pictures.slice(2), group);
    sources.forEach((source, i) => assert.equal(readFileSync(join(dir, 'beside', `${letter}-${i + 1}.png`), 'utf8'), source, `${letter}-${i + 1}`));
  }
  // No name in the folder says which version it is, or which width a picture was taken at.
  for (const name of readdirSync(join(dir, 'beside'))) assert.match(name, /^[AB]-[12]\.png$/);
  // A lone picture and a group are each one version, when each has as many pictures as the other.
  const mixed = fresh(TWO);
  assert.equal(run(mixed, TWO[0], '--group', `fresh=${TWO[1]}`, '--out', 'beside').status, 0);
  assert.deepEqual(readdirSync(join(mixed, 'beside')).filter(visible).sort(), ['A.png', 'B.png']);
});

// ---- refusals: everything is checked before anything is written

test('a picture that is not a file, a picture named twice, versions of unequal size, a group name used twice and more than 26 versions are each refused, with nothing left behind', () => {
  const dir = fresh([...TWO, 'c.png']);
  mkdirSync(join(dir, 'a folder.png'));
  refused(dir, [TWO[0], 'gone.png', '--out', 'beside'], /^cannot deal: gone\.png is not there\n$/);
  // Every picture at fault is named, not the first alone.
  refused(dir, ['gone.png', TWO[0], 'a folder.png', '--out', 'beside'], /^cannot deal: gone\.png is not there\ncannot deal: a folder\.png is not a file\n$/);
  refused(dir, [TWO[0], `./${TWO[0]}`, '--out', 'beside'], /^cannot deal: shots\/today-1280-light\.png is named twice \(as \.\/shots\/today-1280-light\.png\): a version is dealt one letter\n$/);
  refused(dir, [TWO[0], '--group', `fresh=${TWO[1]},c.png`, '--out', 'beside'], /^cannot deal: every version must have as many pictures as the others, so that no letter stands out; they have 1, 2\n$/);
  refused(dir, ['--group', `one=${TWO[0]}`, '--group', `one=${TWO[1]}`, '--out', 'beside'], /^cannot deal: two groups are named "one"\n$/);
  const many = fresh(Array.from({ length: 27 }, (_, i) => `p${i}.png`));
  refused(many, [...Array.from({ length: 27 }, (_, i) => `p${i}.png`), '--out', 'beside'], /^cannot deal 27 versions: there are 26 letters\n$/);
  // The folder is not made by a deal that is refused, so the next one is not refused for it.
  assert.equal(run(dir, ...TWO, '--out', 'beside').status, 0);
});

test('versions whose pictures are of different types are refused before anything is written: A.png beside B.jpg would tell them apart', () => {
  const pictures = ['shots/today.png', 'fresh/one.jpg', 'fresh/two.PNG', 'shots/today-390.jpg', 'fresh/one-390.png', 'fresh/plain'];
  const dir = fresh(pictures);
  const differ = types => new RegExp(`^cannot deal: the pictures at the same place in every version must share one extension, so that no letter stands out; they have ${types}\\n$`);
  refused(dir, [pictures[0], pictures[1], '--out', 'beside'], differ('\\.jpg, \\.png'));
  // The case of an extension shows in a name too, and so does having none.
  refused(dir, [pictures[0], pictures[2], '--out', 'beside'], differ('\\.PNG, \\.png'));
  refused(dir, [pictures[0], pictures[5], '--out', 'beside'], differ('none, \\.png'));
  // In a group it is each place that must agree: the first pictures with each other, the second with each other.
  refused(dir, ['--group', `system=${pictures[0]},${pictures[3]}`, '--group', `one=${pictures[1]},${pictures[4]}`, '--out', 'beside'], differ('\\.jpg, \\.png'));
  refused(dir, ['--group', `system=${pictures[0]},${pictures[3]}`, '--group', `one=${pictures[4]},${pictures[2]}`, '--out', 'beside'], differ('\\.PNG, \\.jpg'));
  const r = run(dir, '--group', `system=${pictures[0]},${pictures[3]}`, '--group', `one=${pictures[4]},${pictures[1]}`, '--out', 'beside');
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.deepEqual(readdirSync(join(dir, 'beside')).filter(visible).sort(), ['A-1.png', 'A-2.jpg', 'B-1.png', 'B-2.jpg']);
  // And it is checked before the first copy.
  let copies = 0;
  assert.throws(() => deal([pictures[0], pictures[1]].map(picture => ({ pictures: [join(dir, picture)] })), join(dir, 'other'), { copy: () => copies++ }), DealError);
  assert.equal(copies, 0);
  assert.match(run(root, '--help').stdout, /A copy keeps its picture's extension, so the pictures at the same place in every version must share one:\nA\.png beside B\.jpg would tell the two apart, and is refused\./);
});

test('open passes over what a mount or a file browser leaves in a folder, and nothing else: the sealed file can still be read after someone has looked at the pictures', () => {
  const dir = fresh();
  assert.equal(run(dir, ...TWO, '--out', 'beside').status, 0);
  const { letters } = sealedOf(dir);
  for (const left of ['.DS_Store', 'Thumbs.db', 'desktop.ini', '.fuse_hidden0000a1b200000002']) {
    writeFileSync(join(dir, 'beside', left), '');
    const r = run(dir, 'open', 'beside');
    assert.deepEqual([r.status, r.stderr], [0, ''], left);
    assert.equal(r.stdout, `A  ${letters.A}\nB  ${letters.B}\n`, left);
  }
  // Any other name is something the deal did not put there: a note, a hidden file of another kind, a name that only looks alike.
  for (const stray of ['notes.txt', '.hidden', 'thumbs.db.png', 'Desktop.ini.bak', '.DS_Store2']) {
    writeFileSync(join(dir, 'beside', stray), '');
    const r = run(dir, 'open', 'beside');
    assert.deepEqual([r.status, r.stdout], [1, ''], stray);
    assert.match(r.stderr, /^cannot open beside: the folder holds /, stray);
    assert.ok(r.stderr.includes(stray) && !r.stderr.includes('.DS_Store,') && !r.stderr.includes('Thumbs.db,'), stray);
    rmSync(join(dir, 'beside', stray));
  }
  assert.match(run(root, '--help').stdout, /what a\nmount or a file browser leaves in a folder \(\.fuse_hidden\*, \.DS_Store, Thumbs\.db, desktop\.ini\) is passed\nover\./);
});

test('a folder that is already there, even empty, and a sealed file left beside it are refused before anything is copied: letters are dealt once', () => {
  const dir = fresh();
  mkdirSync(join(dir, 'beside'));
  refused(dir, [...TWO, '--out', 'beside'], /^cannot deal into beside: it is already there\. Letters are dealt once: a folder that was dealt is never dealt again\n$/);
  rmSync(join(dir, 'beside'), { recursive: true });
  writeFileSync(join(dir, 'BESIDE.sealed.json'), '{}\n');
  refused(dir, [...TWO, '--out', 'beside'], /^cannot deal into beside: \S*BESIDE\.sealed\.json lies beside it, the sealed file of an earlier deal\n$/);
  assert.equal(readFileSync(join(dir, 'BESIDE.sealed.json'), 'utf8'), '{}\n', 'a sealed file is never written over');
  // A second deal into a folder that was dealt is refused, and both the folder and its sealed file stay as they were.
  const again = fresh();
  assert.equal(run(again, ...TWO, '--out', 'beside').status, 0);
  const sealed = readFileSync(join(again, 'BESIDE.sealed.json'), 'utf8');
  refused(again, [...TWO, '--out', 'beside'], /it is already there/);
  assert.equal(readFileSync(join(again, 'BESIDE.sealed.json'), 'utf8'), sealed);
});

test('every check comes before the first copy: a deal that is refused has copied nothing and made no folder', () => {
  const dir = fresh([...TWO, 'c.png']);
  mkdirSync(join(dir, 'there'));
  writeFileSync(join(dir, 'SEALED-BEFORE.sealed.json'), '{}\n');
  const versions = TWO.map(picture => ({ pictures: [join(dir, picture)] }));
  const before = tree(dir);
  for (const [what, list, out] of [
    ['a folder that is there', versions, join(dir, 'there')], ['a sealed file beside it', versions, join(dir, 'sealed-before')], ['a picture that is not there', [...versions, { pictures: [join(dir, 'gone.png')] }], join(dir, 'new', 'beside')],
    ['a picture named twice', [...versions, versions[0]], join(dir, 'new', 'beside')], ['versions of unequal size', [versions[0], { group: 'two', pictures: [join(dir, TWO[1]), join(dir, 'c.png')] }], join(dir, 'new', 'beside')],
  ]) {
    let copies = 0;
    assert.throws(() => deal(list, out, { copy: () => copies++ }), DealError, what);
    assert.equal(copies, 0, `${what}: nothing is copied`);
    assert.deepEqual(tree(dir), before, what);
  }
});

test('a copy that fails part of the way leaves nothing: no folder, no sealed file, none of the folders made above it', () => {
  const dir = fresh();
  const before = tree(dir);
  let copies = 0;
  const failing = (from, to) => {
    if (++copies === 2) throw Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
    copyFileSync(from, to);
  };
  assert.throws(() => deal(TWO.map(picture => ({ pictures: [join(dir, picture)] })), join(dir, 'new', 'deeper', 'beside'), { copy: failing }),
    error => error instanceof DealError && /^cannot deal into \S.*beside: no permission$/.test(error.message));
  assert.equal(copies, 2);
  assert.deepEqual(tree(dir), before);
  // And when another deal seals the same name while this one copies: this one takes its folder back, and the other's
  // sealed file is neither written over nor removed.
  const racing = (from, to) => {
    copyFileSync(from, to);
    if (!existsSync(join(dir, 'BESIDE.sealed.json'))) writeFileSync(join(dir, 'BESIDE.sealed.json'), 'another deal\'s\n');
  };
  assert.throws(() => deal(TWO.map(picture => ({ pictures: [join(dir, picture)] })), join(dir, 'beside'), { copy: racing }),
    error => error instanceof DealError && /^cannot deal into \S.*beside: \S.*BESIDE\.sealed\.json lies beside it, the sealed file of an earlier deal$/.test(error.message));
  assert.equal(readFileSync(join(dir, 'BESIDE.sealed.json'), 'utf8'), 'another deal\'s\n');
  assert.deepEqual(tree(dir), [...before, 'BESIDE.sealed.json'].sort());
  // And when the folder itself appears while this deal copies: it is another's, and is neither filled nor removed.
  const other = fresh();
  const appearing = (from, to) => {
    copyFileSync(from, to);
    mkdirSync(join(other, 'beside'), { recursive: true });
  };
  assert.throws(() => deal(TWO.map(picture => ({ pictures: [join(other, picture)] })), join(other, 'beside'), { copy: appearing }), error => error instanceof DealError && /it is already there/.test(error.message));
  assert.deepEqual(tree(other), ['beside/', 'fresh/', 'fresh/outside-openai-1280-light.png', 'shots/', 'shots/today-1280-light.png']);
});

// ---- open

test('open prints each letter with its source, from the sealed file beside the folder, and is refused for a folder that is not the one it sealed', () => {
  const dir = fresh();
  assert.equal(run(dir, ...TWO, '--out', 'beside').status, 0);
  const { letters } = sealedOf(dir);
  const r = run(dir, 'open', 'beside');
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.equal(r.stdout, `A  ${letters.A}\nB  ${letters.B}\n`);
  assert.deepEqual(openSealed(join(dir, 'beside')), letters);
  // The folder is checked as a person lists it: a name a mount keeps for a file still open is passed over.
  writeFileSync(join(dir, 'beside', '.fuse_hidden0000a1b200000001'), '');
  assert.equal(run(dir, 'open', 'beside').status, 0);
  // A group is printed with its name and its pictures.
  const grouped = fresh(['a-1.png', 'a-2.png', 'b-1.png', 'b-2.png']);
  assert.equal(run(grouped, '--group', 'system=a-1.png,a-2.png', '--group', 'fresh=b-1.png,b-2.png', '--out', 'beside').status, 0);
  const lines = run(grouped, 'open', 'beside').stdout.trimEnd().split('\n');
  assert.deepEqual(lines.map(line => line.slice(0, 3)), ['A  ', 'B  ']);
  assert.deepEqual(lines.map(line => line.slice(3)).sort(), ['fresh: b-1.png, b-2.png', 'system: a-1.png, a-2.png']);
  // Refusals: no sealed file; a folder that is not there; a picture added, or taken away; a sealed file of another folder; one that is no sealed file.
  refused(dir, ['open', 'elsewhere'], /^cannot open elsewhere: \S*ELSEWHERE\.sealed\.json is not there\n$/);
  writeFileSync(join(dir, 'beside', 'C.png'), '');
  refused(dir, ['open', 'beside'], /^cannot open beside: the folder holds A\.png, B\.png, C\.png, and its sealed file dealt A\.png, B\.png\n$/);
  rmSync(join(dir, 'beside', 'C.png'));
  rmSync(join(dir, 'beside', 'B.png'));
  refused(dir, ['open', 'beside'], /^cannot open beside: the folder holds A\.png, and its sealed file dealt A\.png, B\.png\n$/);
  const other = fresh();
  assert.equal(run(other, ...TWO, '--out', 'beside').status, 0);
  copyFileSync(join(other, 'BESIDE.sealed.json'), join(other, 'COPY.sealed.json'));
  mkdirSync(join(other, 'copy'));
  refused(other, ['open', 'copy'], /^cannot open copy: \S*COPY\.sealed\.json is the sealed file of "beside"\n$/);
  writeFileSync(join(other, 'BESIDE.sealed.json'), 'not json');
  refused(other, ['open', 'beside'], /^cannot open beside: \S*BESIDE\.sealed\.json is not a sealed file\n$/);
  writeFileSync(join(other, 'BESIDE.sealed.json'), '{"folder":"beside","letters":{"a":"x.png"}}');
  refused(other, ['open', 'beside'], /is not a sealed file\n$/);
});
