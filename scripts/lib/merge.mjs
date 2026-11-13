// The blind merge (design § 12): several makers each wrote one Structure proposal. Before anyone judges
// them, the merge shuffles them into letters and writes each as <letter>.json, a letter copy carrying no
// maker's fingerprint: none of who or what made it (author, engine, track, model, source), not the maker's
// firstIdea, and the keys in the format's own order with the format's own spacing, never the maker's.
//
// The board folder holds the letters and nothing else. The map (MAP.sealed.json: the board it belongs to,
// and each letter's source) and the founder's pick (PICK.md) sit beside it, in its parent: one folder holds
// one board. The map opens only on a pick line, "Pick: <letter>" or "Pick: none", and only for the board it
// names, holding exactly its letters. A board is never made inside another board, nor among the proposals.
//
// The blind holds only if a board is made once, whole, at one place. Each path is read the way the system
// reads it, once, and every check and every write uses that one path, so no second way of writing it
// reaches the same board unseen. The letters are written into a new folder beside the board and renamed
// into place, which fails onto a folder that holds anything; the map is created, never written over. A
// failed merge leaves nothing behind. Nothing here prints; the command (scripts/merge.mjs) prints no source.
import { randomInt, randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, parse, relative, sep } from 'node:path';
import { readProposalFile, reason } from './proposal-file.mjs';
import { ORDER, validate } from './walkthrough.mjs';

// The author map and the founder's pick: file names in the board folder's parent, beside the board. The map
// is { "board": <the board folder's name>, "letters": { <letter>: { file, track, engine } } }.
export const MAP = 'MAP.sealed.json';
export const PICK = 'PICK.md';
export const MAX_SEED = 0xffffffff;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// A letter file: one capital letter, then .json. A folder that holds one is a board.
const LETTER_FILE = /^[A-Z]\.json$/;
// A proposal is a .json file, whatever the case of its extension: one saved as .JSON is not lost.
const PROPOSAL_FILE = /\.json$/i;
// The founder's pick, on a line of its own with nothing else but white space: one capital letter, or none.
const PICK_LINE = /^\s*Pick:\s*([A-Z]|none)\s*$/;
const SEPARATORS = sep === '\\' ? /[\\/]+/ : /\/+/;

// A refusal the merge explains in one message.
export class MergeError extends Error {}
// The seal holds: the map is not opened before a real pick, and a sealed board is not merged again.
export class SealedError extends MergeError {}

// onDisk(path) → the absolute path the system would read or make: every link in the part that exists is
// followed, and ".." after it leads where the system says, not where the text of the path says; the part
// that does not exist yet is added as written, as making it would.
function onDisk(path) {
  const absolute = isAbsolute(path) ? path : `${process.cwd()}${sep}${path}`;
  const { root } = parse(absolute);
  let at = root;
  for (const part of absolute.slice(root.length).split(SEPARATORS)) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      at = dirname(at);
      continue;
    }
    const next = join(at, part);
    try {
      at = realpathSync(next);
    } catch {
      at = next;
    }
  }
  return at;
}

// mergeProposals(srcDir, outDir, { seed }) → { letters, board }: the letters, and the board folder as the
// system reads it. Before anything is written: what sits beside the board and above it, where it lies
// against the proposals folder, every proposal file, every proposal (in the source form) and every letter copy (in
// the sealed form). Whether the board folder is empty or absent is answered by the rename that puts the
// board in place, the one check no other merge can slip between. Throws a MergeError (a SealedError for a sealed board),
// a ProposalFileError for a file that cannot be read, a TypeError for a bad seed, and an Error for a letter
// copy that is not sealed, which is a bug in this file.
export function mergeProposals(srcDir, outDir, { seed } = {}) {
  const draw = drawing(seed);
  const board = onDisk(outDir);
  const src = onDisk(srcDir);
  const { map: mapFile, pick: pickFile } = beside(board);
  checkBoard(board, src, mapFile, pickFile);
  const files = proposalFiles(src);
  const proposals = files.map(file => ({ file, proposal: readProposalFile(join(src, file)) }));
  const faults = proposals.map(({ file, proposal }) => [file, validate(proposal)]).filter(([, errors]) => errors.length);
  if (faults.length) {
    const lines = faults.map(([file, errors]) => `${join(src, file)}: it is not a valid proposal\n${errors.join('\n')}`);
    throw new MergeError(`cannot merge ${src}: not every proposal is valid, so no letter is written\n${lines.join('\n')}`);
  }
  const order = shuffle(proposals, draw);
  const letters = order.map((_, i) => LETTERS[i]);
  const texts = order.map(({ proposal }) => pretty(letterCopy(proposal)));
  // Each letter is checked as it will be written, in the sealed form; one that fails is a bug, and nothing
  // is written.
  texts.forEach((text, i) => {
    const errors = validate(JSON.parse(text), { sealed: true });
    if (errors.length) throw new Error(`the letter copy ${letters[i]} is not in the sealed form, a bug in the merge; nothing is written\n${errors.join('\n')}`);
  });
  const map = {};
  order.forEach(({ file, proposal }, i) => {
    map[letters[i]] = { file, track: textOrNull(proposal.track), engine: textOrNull(proposal.engine) };
  });
  const made = writeBoard(board, letters, texts);
  seal(board, mapFile, pretty({ board: basename(board), letters: map }), made);
  return { letters, board };
}

// openMap(outDir) → { <letter>: { file, track, engine } }, once the pick beside the board names a letter on
// it, or none, and only for the board the map names, holding exactly the map's letters. Throws a
// SealedError before then; a MergeError for a map that is not an author map, or not this board's; a
// ProposalFileError when the map cannot be read.
export function openMap(outDir) {
  const board = onDisk(outDir);
  const { map: mapFile, pick: pickFile } = beside(board);
  const sealed = problem =>
    new SealedError(`the author map is sealed until the founder's pick is written in ${pickFile} as a line "Pick: <letter>" naming a letter on the board, or "Pick: none"; ${problem}`);
  let words;
  try {
    words = readFileSync(pickFile, 'utf8');
  } catch (e) {
    throw sealed(`that file cannot be read (${reason(e)})`);
  }
  const picks = [...new Set(words.split('\n').flatMap(line => PICK_LINE.exec(line)?.slice(1) ?? []))];
  if (picks.length === 0) throw sealed('that file holds no such line');
  if (picks.length > 1) throw sealed(`that file names more than one pick (${picks.join(', ')})`);
  const whole = authorMap(readProposalFile(mapFile), mapFile);
  // A board left whole without its map (its merge stopped dead) is not the board a sibling's map is for.
  if (whole.board !== basename(board)) throw new MergeError(`cannot open ${mapFile}: it is the map of the board ${JSON.stringify(whole.board)}, not of ${board}`);
  const map = whole.letters;
  const onBoard = entries(board).filter(name => LETTER_FILE.test(name)).map(name => name[0]).sort();
  const mapped = Object.keys(map).sort();
  if (onBoard.join() !== mapped.join()) {
    throw new MergeError(`cannot open ${mapFile}: ${board} holds the letters ${onBoard.join(', ') || '(none)'}, and the map the letters ${mapped.join(', ')}`);
  }
  const [pick] = picks;
  if (pick !== 'none' && !Object.hasOwn(map, pick)) throw sealed(`"Pick: ${pick}" names no letter on this board (${Object.keys(map).join(', ')})`);
  return map;
}

const beside = board => ({ map: join(dirname(board), MAP), pick: join(dirname(board), PICK) });

// A board is made once: no map beside it (that is a sealed board), no pick left from another board, never
// among the proposals, and never inside another board. The board folder itself must be empty or absent;
// writeBoard's rename refuses it otherwise.
function checkBoard(board, src, mapFile, pickFile) {
  if (exists(mapFile)) throw sealedBoard(board, mapFile);
  if (exists(pickFile)) throw new MergeError(`cannot merge into ${board}: ${pickFile} already exists, a pick made on another board; delete it on purpose first.`);
  // Compared part by part, never by the text alone: /x/proposals-2 is not inside /x/proposals.
  const apart = 'A board is made apart from the proposals, never among them.';
  if (relative(src, board) === '') throw new MergeError(`cannot merge into ${board}: it is the proposals folder. ${apart}`);
  if (within(board, src)) throw new MergeError(`cannot merge into ${board}: it lies inside the proposals folder ${src}. ${apart}`);
  if (within(src, board)) throw new MergeError(`cannot merge into ${board}: it holds the proposals folder ${src}. ${apart}`);
  // A folder above that holds letter files is a board: its map would sit inside it, or its letters beside
  // another board's.
  for (let folder = dirname(board); ; folder = dirname(folder)) {
    if (entries(folder).some(name => LETTER_FILE.test(name))) {
      throw new MergeError(`cannot merge into ${board}: ${folder} above it holds letter files, so it is a board; a board is never made inside another.`);
    }
    if (dirname(folder) === folder) return;
  }
}

// within(inner, outer) → whether inner is outer or lies inside it, part by part.
function within(inner, outer) {
  const path = relative(outer, inner);
  return !(path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path));
}

const sealedBoard = (board, mapFile) =>
  new SealedError(
    `cannot merge into ${board}: the board beside ${mapFile} is sealed, and its letters may already have been read. ` +
      'One folder holds one board; merging again would shuffle the letters anew. To rebuild it, delete the map and the board on purpose first.',
  );
// Names one thing the folder holds, so a folder that only looks empty is no mystery.
const notEmpty = (board, names) =>
  new MergeError(
    `cannot merge into ${board}: the folder is not empty (it holds ${JSON.stringify([...names].sort()[0])}). ` +
      'A board folder must be empty or absent, so that nothing but its letters is read in it.',
  );

// The board is written whole or not at all: its letters go into a new folder beside it, which is renamed
// into place. A rename fails onto a folder that holds anything, so no board is ever written over; when it
// fails, nothing is left behind: no letter, no new folder, none of the folders made above the board.
// → the first folder made above the board, if any.
function writeBoard(board, letters, texts) {
  const parent = dirname(board);
  // Found before anything is made, so that whatever is made can be taken away again, even when making the
  // folders stops part of the way.
  const made = firstMissing(parent);
  let staging;
  let emptied = false;
  try {
    mkdirSync(parent, { recursive: true });
    // A plain folder, so the board has the mode any folder has under the umask (a temporary folder's is
    // private to its maker), under a name no other merge will choose.
    const name = join(parent, `.${basename(board)}.merging-${randomUUID()}`);
    mkdirSync(name);
    staging = name;
    // In letter order, so neither the order of the files on disk nor their times follow the sources.
    letters.forEach((letter, i) => writeFileSync(join(staging, `${letter}.json`), texts[i]));
    // An empty board folder is taken away first: some systems (Windows) rename onto no folder at all. One
    // that holds anything stays, and the rename refuses it.
    emptied = removeIfEmpty(board);
    renameSync(staging, board);
    return made;
  } catch (e) {
    if (staging) rmSync(staging, { recursive: true, force: true });
    if (emptied) remake(board);
    const found = entries(board);
    unmake(made, parent);
    if (found.length) throw notEmpty(board, found);
    throw new MergeError(`cannot write ${board}: ${reason(e)}`);
  }
}

// The map is created, never written over. When it cannot be, the board is taken back with whatever was
// made for it, and only a map this merge created is removed.
function seal(board, mapFile, text, made) {
  try {
    writeFileSync(mapFile, text, { flag: 'wx' });
  } catch (e) {
    rmSync(board, { recursive: true, force: true });
    if (e.code !== 'EEXIST') rmSync(mapFile, { force: true });
    unmake(made, dirname(board));
    throw e.code === 'EEXIST' ? sealedBoard(board, mapFile) : new MergeError(`cannot write ${mapFile}: ${reason(e)}`);
  }
}

function removeIfEmpty(folder) {
  try {
    rmdirSync(folder);
    return true;
  } catch {
    return false;
  }
}

function remake(folder) {
  try {
    mkdirSync(folder);
  } catch {
    // Another merge's board is there now; it is not this merge's to touch.
  }
}

// The first folder of this path, from the top, that is not there yet; nothing when the path is all there.
function firstMissing(folder) {
  let missing;
  for (let at = folder; !exists(at); at = dirname(at)) {
    missing = at;
    if (dirname(at) === at) break;
  }
  return missing;
}

// Takes away the folders this merge made above the board, from the nearest up to the first it made, while
// they are empty; never one above it. One it never got to make is passed over.
function unmake(made, parent) {
  if (!made) return;
  for (let folder = parent; within(folder, made); folder = dirname(folder)) {
    if (!exists(folder)) continue;
    try {
      rmdirSync(folder);
    } catch {
      return;
    }
  }
}

const exists = path => {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
};

const entries = folder => {
  try {
    return readdirSync(folder);
  } catch {
    return [];
  }
};

// A map is { board, letters }: the board folder's name, and an object of letters, each { file, track,
// engine }: a file name, and text or null for the others.
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isTextOrNull = value => value === null || typeof value === 'string';
function authorMap(map, mapFile) {
  const refuse = what => new MergeError(`cannot open ${mapFile}: it is not an author map; ${what}`);
  if (!isRecord(map)) throw refuse('it must be an object holding "board" and "letters"');
  if (typeof map.board !== 'string' || map.board === '') throw refuse('"board" must name the board folder');
  if (!isRecord(map.letters)) throw refuse('"letters" must be an object of letters');
  const letters = Object.keys(map.letters);
  if (letters.length === 0) throw refuse('it holds no letter');
  for (const letter of letters) {
    if (!/^[A-Z]$/.test(letter)) throw refuse(`${JSON.stringify(letter)} is not a letter`);
    const entry = map.letters[letter];
    const whole = isRecord(entry) && typeof entry.file === 'string' && entry.file !== '' && isTextOrNull(entry.track) && isTextOrNull(entry.engine);
    if (!whole) throw refuse(`the entry for ${letter} is not { file, track, engine }`);
  }
  return map;
}

// The proposal files directly in the folder, by name: the same order on every system, whatever order the
// folder is listed in. Sub-folders are not read; anything else named .json is read, and refused if it
// cannot be.
function proposalFiles(srcDir) {
  let names;
  try {
    names = readdirSync(srcDir);
  } catch (e) {
    throw new MergeError(`cannot read ${srcDir}: ${reason(e)}`);
  }
  const files = names.filter(name => PROPOSAL_FILE.test(name) && !isFolder(join(srcDir, name))).sort();
  if (files.length === 0) throw new MergeError(`cannot merge ${srcDir}: it holds no proposal, no .json file directly in it`);
  if (files.length > LETTERS.length) {
    throw new MergeError(`cannot merge ${srcDir}: it holds ${files.length} proposals, and a board holds ${LETTERS.length} at most, one per letter from A to Z`);
  }
  return files;
}

function isFolder(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// draw(n) → a whole number from 0 to n - 1. With a seed, from mulberry32, so the same seed gives the same
// letters; without one, from crypto.randomInt.
function drawing(seed) {
  if (seed === undefined) return n => randomInt(n);
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new TypeError(`the seed must be a whole number from 0 to ${MAX_SEED}`);
  }
  const next = mulberry32(seed);
  return n => Math.floor(next() * n);
}

// mulberry32: a small 32-bit generator, plenty for shuffling at most 26 letters repeatably. Each call gives
// a number in [0, 1).
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates: every order equally likely, given a fair draw.
function shuffle(items, draw) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = draw(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A letter copy: what the proposal says, in the format's own key order (walkthrough ORDER), holding only
// what is judged. firstIdea and who made it stay in the source; a key that is absent stays absent.
const letterCopy = proposal => inOrder(proposal, ORDER.letter);
// The keys whose values are lists of objects, and the order each entry is written in.
const NESTED = new Map([
  ['screens', () => ORDER.screen],
  ['items', item => (Object.hasOwn(item, 'role') ? ORDER.role : ORDER.container)],
]);
function inOrder(object, keys) {
  const copy = {};
  for (const key of keys) {
    if (!Object.hasOwn(object, key)) continue;
    const order = NESTED.get(key);
    copy[key] = order ? object[key].map(entry => inOrder(entry, order(entry))) : object[key];
  }
  return copy;
}
const textOrNull = value => (typeof value === 'string' ? value : null);
const pretty = value => `${JSON.stringify(value, null, 2)}\n`;
