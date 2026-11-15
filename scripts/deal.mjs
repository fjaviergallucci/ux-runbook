#!/usr/bin/env node
// deal: letters for a blind comparison of pictures. Several versions of one screen are to be read side by
// side by people who must not know which is which: each version's pictures are copied into a new folder
// under a letter dealt at random, and which letter is which is written to a sealed file beside the folder,
// never in it. On success deal prints how many versions it dealt, the folder and the letters: nothing that
// names a source. `open` prints the sealed file.
//
// Nothing about the copies follows the order the versions were named in: the list is shuffled first, the
// copies are made in letter order, and every copy is given one and the same modification time. Everything
// is checked before anything is written; the copies go into a new folder beside the one asked for, which is
// renamed into place; the sealed file is created, never written over. A deal that fails leaves nothing.
//
// As a module: deal(versions, out) → { letters } · openSealed(folder) → the sealed letters ·
// sealedBeside(folder) → the sealed file's path. Each throws a DealError.
// Exit codes: 0 success · 1 a refusal · 2 bad usage.
import { randomInt, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { HELP, UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { reason } from './lib/json-file.mjs';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SEALED = '.sealed.json';
// A name a mount keeps for a file that is still open: no part of what a folder holds.
const HIDDEN = /^\.fuse_hidden/;

const USAGE = `Usage: node scripts/deal.mjs <picture>... --out <folder> [--group <name>=<picture>,<picture>]
       node scripts/deal.mjs open <folder>

deal copies the pictures of two versions or more into <folder>, each version under a letter dealt at
random (A, B, C ..., at most 26), for people who must compare them without knowing which is which. Each
<picture> is one version, copied as <letter><its extension>: A.png, B.png. Which letter is which is
written to a sealed file beside <folder>, in its parent, named for the folder in capitals: for
06-look/beside that is 06-look/BESIDE.sealed.json, holding { "folder", "letters" }, each letter with
its source as it was written here. deal prints how many versions it dealt, the folder and the letters,
and never which is which.

The list is shuffled before a letter is given, the copies are made in letter order, and every copy gets
one and the same modification time: neither a name, nor a time, nor the order on disk follows the order
the versions were named in. Everything is checked before anything is written, and a deal that is refused
or fails leaves nothing behind.

  --out <folder>     the folder to make; it must not be there, and no sealed file of its name may lie
                     beside it: letters are dealt once. The folders above it are made when missing
  --group <name>=<picture>,<picture>
                     a version with several pictures (its widths, its themes): all of them under one
                     letter, each copied as <letter>-<n><its extension> in the order given, A-1.png,
                     A-2.png. Give every group its pictures in the same order. --group may repeat, once
                     for each such version; <name> is kept in the sealed file and nowhere else, and a
                     picture's path holds no comma. Every version has as many pictures as the others

open prints the sealed file of <folder>, one line per letter: the letter and its source, or its group's
name and pictures. It refuses a folder that does not hold exactly what its sealed file dealt.

A flag may also be written --flag=value.

Exit codes: 0 success · 1 a refusal (a picture that is not a file or is named twice, versions of unequal
size, more than 26, a folder that is there, a sealed file beside it, an output that cannot be written; for
open, no sealed file, one that is not a sealed file, or not this folder's) · 2 bad usage.
`;

// A refusal deal explains in one message.
export class DealError extends Error {}

// sealedBeside(folder) → where the folder's sealed file is: in its parent, named for it in capitals.
export function sealedBeside(folder) {
  return join(dirname(folder), `${basename(resolve(folder)).toUpperCase()}${SEALED}`);
}

// deal(versions, out) → { letters }: the letters dealt, in order. `versions` is a list of
// { pictures: [path, ...], group?: name }, each one version; `out` the folder to make. `copy` copies one
// file, for a test to watch or to fail.
export function deal(versions, out, { copy = copyFileSync } = {}) {
  const sealed = sealedBeside(out);
  check(versions, out, sealed);
  const dealt = shuffle(versions);
  const letters = dealt.map((_, i) => LETTERS[i]);
  // Each copy's name: the letter alone for a version of one picture, the letter and the picture's place in
  // its version otherwise. No name carries anything of its source but the extension.
  const names = dealt.map(({ pictures }, i) => pictures.map((picture, n) => `${letters[i]}${pictures.length === 1 ? '' : `-${n + 1}`}${extname(picture)}`));
  const record = { folder: basename(resolve(out)), letters: Object.fromEntries(dealt.map(({ group, pictures }, i) => [letters[i], group === undefined ? pictures[0] : { group, pictures }])) };
  const parent = dirname(resolve(out));
  // Found before anything is made, so that whatever is made can be taken away again.
  const made = firstMissing(parent);
  let staging;
  let placed = false;
  try {
    mkdirSync(parent, { recursive: true });
    staging = join(parent, `.${basename(resolve(out))}.dealing-${randomUUID()}`);
    mkdirSync(staging);
    // In letter order, so the order of the files on disk follows the letters and not the sources.
    dealt.forEach(({ pictures }, i) => pictures.forEach((picture, n) => copy(picture, join(staging, names[i][n]))));
    // One time for every copy: none is newer than another.
    const when = new Date();
    for (const name of names.flat()) utimesSync(join(staging, name), when, when);
    if (present(out)) throw alreadyThere(out);
    renameSync(staging, resolve(out));
    placed = true;
    // Created, never written over.
    writeFileSync(sealed, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  } catch (e) {
    if (staging) rmSync(staging, { recursive: true, force: true });
    if (placed) rmSync(resolve(out), { recursive: true, force: true });
    unmake(made, parent);
    if (e instanceof DealError) throw e;
    // Another deal sealed this folder's name first: its sealed file is not this deal's to touch.
    if (placed && e.code === 'EEXIST') throw sealedBefore(out, sealed);
    throw new DealError(`cannot deal into ${out}: ${reason(e)}`);
  }
  return { letters };
}

// openSealed(folder) → the sealed letters of a folder that was dealt, each with its source: a path, or
// { group, pictures }. Refused unless the folder holds exactly what its sealed file dealt.
export function openSealed(folder) {
  const sealed = sealedBeside(folder);
  const refuse = why => new DealError(`cannot open ${folder}: ${why}`);
  let text;
  try {
    text = readFileSync(sealed, 'utf8');
  } catch (e) {
    throw refuse(e.code === 'ENOENT' ? `${sealed} is not there` : `${sealed} cannot be read: ${reason(e)}`);
  }
  let record;
  try {
    record = JSON.parse(text);
  } catch {
    record = null;
  }
  if (!isRecord(record)) throw refuse(`${sealed} is not a sealed file`);
  if (record.folder !== basename(resolve(folder))) throw refuse(`${sealed} is the sealed file of ${JSON.stringify(record.folder)}`);
  const dealt = Object.entries(record.letters).flatMap(([letter, source]) => {
    const pictures = typeof source === 'string' ? [source] : source.pictures;
    return pictures.map((picture, n) => `${letter}${pictures.length === 1 ? '' : `-${n + 1}`}${extname(picture)}`);
  }).sort();
  let held;
  try {
    held = readdirSync(folder).filter(name => !HIDDEN.test(name)).sort();
  } catch (e) {
    throw refuse(`the folder cannot be read: ${reason(e)}`);
  }
  if (held.join('\n') !== dealt.join('\n')) throw refuse(`the folder holds ${held.join(', ') || 'nothing'}, and its sealed file dealt ${dealt.join(', ')}`);
  return record.letters;
}

// A sealed file as deal writes it: the folder's name, and each capital letter with a path or a group.
function isRecord(record) {
  if (record === null || typeof record !== 'object' || typeof record.folder !== 'string') return false;
  const { letters } = record;
  if (letters === null || typeof letters !== 'object' || Array.isArray(letters) || Object.keys(letters).length === 0) return false;
  const isPath = value => typeof value === 'string' && value !== '';
  return Object.entries(letters).every(([letter, source]) =>
    /^[A-Z]$/.test(letter) && (isPath(source) || (source !== null && typeof source === 'object' && isPath(source.group) && Array.isArray(source.pictures) && source.pictures.length > 0 && source.pictures.every(isPath))));
}

// Everything that can be refused is refused here, before a folder is made or a file copied.
function check(versions, out, sealed) {
  if (versions.length > LETTERS.length) throw new DealError(`cannot deal ${versions.length} versions: there are ${LETTERS.length} letters`);
  const faults = [];
  const seen = new Map();
  for (const picture of versions.flatMap(version => version.pictures)) {
    let stat;
    try {
      stat = statSync(picture);
    } catch (e) {
      faults.push(`cannot deal: ${picture} ${e.code === 'ENOENT' ? 'is not there' : `cannot be read: ${reason(e)}`}`);
      continue;
    }
    if (!stat.isFile()) {
      faults.push(`cannot deal: ${picture} is not a file`);
      continue;
    }
    const real = realpathSync(picture);
    if (seen.has(real)) faults.push(`cannot deal: ${seen.get(real)} is named twice (as ${picture}): a version is dealt one letter`);
    else seen.set(real, picture);
  }
  if (faults.length) throw new DealError(faults.join('\n'));
  const groups = versions.map(version => version.group).filter(group => group !== undefined);
  const twice = groups.find((group, i) => groups.indexOf(group) !== i);
  if (twice !== undefined) throw new DealError(`cannot deal: two groups are named ${JSON.stringify(twice)}`);
  const sizes = [...new Set(versions.map(version => version.pictures.length))].sort((a, b) => a - b);
  if (sizes.length > 1) throw new DealError(`cannot deal: every version must have as many pictures as the others, so that no letter stands out; they have ${sizes.join(', ')}`);
  if (present(out)) throw alreadyThere(out);
  if (present(sealed)) throw sealedBefore(out, sealed);
}

const sealedBefore = (out, sealed) => new DealError(`cannot deal into ${out}: ${sealed} lies beside it, the sealed file of an earlier deal`);
const alreadyThere = out => new DealError(`cannot deal into ${out}: it is already there. Letters are dealt once: a folder that was dealt is never dealt again`);

// Whether anything is at this path: a file, a folder, or a link to nothing.
function present(path) {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

// A copy of the list in an order drawn from crypto.randomInt, each order as likely as any other.
function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The first folder of this path, from the top, that is not there yet; nothing when the path is all there.
function firstMissing(folder) {
  let missing;
  for (let at = folder; !existsSync(at); at = dirname(at)) {
    missing = at;
    if (dirname(at) === at) break;
  }
  return missing;
}

// Takes away the folders this deal made above the folder, from the nearest up to the first it made, while
// they are empty; never one above it.
function unmake(made, parent) {
  if (!made) return;
  for (let folder = parent; folder.startsWith(made); folder = dirname(folder)) {
    try {
      rmdirSync(folder);
    } catch {
      return;
    }
    if (folder === made) return;
  }
}

// --group may repeat, which the kit's reader of a command line refuses of a flag: each is taken out here,
// with its value, and the rest is read as every script reads it.
function takeGroups(argv) {
  const groups = [];
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (HELP.includes(arg)) return { help: true };
    if (arg !== '--group' && !arg.startsWith('--group=')) {
      rest.push(arg);
      continue;
    }
    const value = arg === '--group' ? argv[++i] : arg.slice('--group='.length);
    if (value === undefined || value === '') throw new UsageError('--group needs a value');
    if (value.startsWith('--') || HELP.includes(value)) throw new UsageError(`--group needs a value; "${value}" is a flag`);
    const cut = value.indexOf('=');
    const pictures = cut === -1 ? [] : value.slice(cut + 1).split(',');
    if (cut < 1 || pictures.some(picture => picture === '')) throw new UsageError(`--group is written <name>=<picture>,<picture>; it is "${value}"`);
    groups.push({ group: value.slice(0, cut), pictures });
  }
  return { help: false, groups, rest };
}

function readArgs(argv) {
  if (argv[0] === 'open') {
    const args = parseArgs(argv.slice(1));
    if (args.help) return args;
    if (args.positional.length !== 1) throw new UsageError(`open takes one <folder>, got ${args.positional.length}`);
    return { open: true, folder: args.positional[0] };
  }
  const taken = takeGroups(argv);
  if (taken.help) return taken;
  const args = parseArgs(taken.rest, { flags: ['out'] });
  if (args.help) return args;
  if (!Object.hasOwn(args.flags, 'out')) throw new UsageError('--out is missing');
  const versions = [...args.positional.map(picture => ({ pictures: [picture] })), ...taken.groups];
  if (versions.length < 2) throw new UsageError(`a comparison needs two versions or more; ${versions.length} ${versions.length === 1 ? 'was' : 'were'} given`);
  return { versions, out: args.flags.out };
}

function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) {
      process.stdout.write(USAGE);
    } else if (args.open) {
      const letters = openSealed(args.folder);
      const show = source => (typeof source === 'string' ? source : `${source.group}: ${source.pictures.join(', ')}`);
      process.stdout.write(Object.keys(letters).sort().map(letter => `${letter}  ${show(letters[letter])}\n`).join(''));
    } else {
      // The count, the folder and the letters: no source, and not where the sealed file is.
      const { letters } = deal(args.versions, args.out);
      process.stdout.write(`dealt ${letters.length} versions into ${args.out}: ${letters.join(', ')}\n`);
    }
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof DealError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) main(process.argv.slice(2));
