// The blind merge (design § 12): several makers each wrote one Structure proposal. Before anyone judges
// them, the merge shuffles them into letters and writes each as <letter>.json, a letter copy carrying no
// maker's fingerprint: none of who or what made it (author, engine, track, model, source), not the maker's
// firstIdea, and the keys in the format's own order with the format's own spacing, never the maker's. It
// seals the map from letter to source in MAP.sealed.json. Judges and the founder read by letter; the map
// opens only once the founder's pick is written in PICK.md beside it.
//
// The blind holds only if a board is made once: a board people may have read is never shuffled again, and
// a board is made in a folder that is empty or absent, so nothing beside the letters (an earlier board, a
// pick, the makers' files) can be read with them. Nothing here prints; the command (scripts/merge.mjs)
// prints no source.
import { randomInt } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readProposalFile, reason } from './proposal-file.mjs';
import { ORDER, validate } from './walkthrough.mjs';

export const MAP = 'MAP.sealed.json';
export const PICK = 'PICK.md';
export const MAX_SEED = 0xffffffff;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// A proposal is a .json file, whatever the case of its extension: one saved as .JSON is not lost.
const PROPOSAL_FILE = /\.json$/i;

// A refusal the merge explains in one message.
export class MergeError extends Error {}
// The seal holds: the map is not opened before the pick, and a sealed board is not merged again.
export class SealedError extends MergeError {}

// mergeProposals(srcDir, outDir, { seed }) → { letters }. Everything is checked before anything is
// written: the board folder, every proposal file, every proposal (in the source form) and every letter copy
// (in the sealed form). Throws a MergeError (a SealedError for a sealed board), a ProposalFileError for a
// file that cannot be read, a TypeError for a bad seed, and an Error for a letter copy that is not sealed,
// which is a bug in this file.
export function mergeProposals(srcDir, outDir, { seed } = {}) {
  const draw = drawing(seed);
  checkBoard(outDir);
  const files = proposalFiles(srcDir);
  const proposals = files.map(file => ({ file, proposal: readProposalFile(join(srcDir, file)) }));
  const faults = proposals.map(({ file, proposal }) => [file, validate(proposal)]).filter(([, errors]) => errors.length);
  if (faults.length) {
    const lines = faults.map(([file, errors]) => `${join(srcDir, file)}: it is not a valid proposal\n${errors.join('\n')}`);
    throw new MergeError(`cannot merge ${srcDir}: not every proposal is valid, so no letter is written\n${lines.join('\n')}`);
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
  try {
    mkdirSync(outDir, { recursive: true });
  } catch (e) {
    throw new MergeError(`cannot write ${outDir}: ${reason(e)}`);
  }
  // In letter order, so neither the order of the files on disk nor their times follow the sources; the map
  // last, so a board that could not be written whole is never sealed.
  letters.forEach((letter, i) => write(join(outDir, `${letter}.json`), texts[i]));
  write(join(outDir, MAP), pretty(map));
  return { letters };
}

// openMap(outDir) → { <letter>: { file, track, engine } }, once <outDir>/PICK.md holds the founder's pick.
// Throws a SealedError before then; a ProposalFileError when the map itself cannot be read.
export function openMap(outDir) {
  const pick = join(outDir, PICK);
  const sealed = problem => new SealedError(`the author map is sealed until the founder's pick is written in ${pick}; that file ${problem}`);
  let words;
  try {
    words = readFileSync(pick, 'utf8');
  } catch (e) {
    throw sealed(`cannot be read (${reason(e)})`);
  }
  if (words.trim() === '') throw sealed('is empty');
  // The map is read the way a proposal is: UTF-8 JSON, with the same worded refusals.
  return readProposalFile(join(outDir, MAP));
}

// A board is made once, in a folder that is empty or absent.
function checkBoard(outDir) {
  let names;
  try {
    names = readdirSync(outDir);
  } catch (e) {
    if (e.code === 'ENOENT') return;
    throw new MergeError(`cannot write ${outDir}: ${reason(e)}`);
  }
  if (names.includes(MAP)) {
    throw new SealedError(
      `cannot merge into ${outDir}: the board is sealed (it holds ${MAP}), and its letters may already have been read. ` +
        `Merging again would shuffle them anew; to rebuild the board, delete ${outDir} on purpose first.`,
    );
  }
  if (names.length > 0) {
    throw new MergeError(
      `cannot merge into ${outDir}: the folder is not empty. A board folder must be empty or absent, ` +
        'so that nothing but its letters and its sealed map is read beside them.',
    );
  }
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

function write(path, text) {
  try {
    writeFileSync(path, text);
  } catch (e) {
    throw new MergeError(`cannot write ${path}: ${reason(e)}`);
  }
}
