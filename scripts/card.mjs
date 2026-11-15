#!/usr/bin/env node
// card: a project's own cards, people and professions, checked before they are cast, and the copy of a
// profession's profile an audience is handed. The checking and the copy are the library's (lib/card.mjs);
// this is the command over it. `check` holds each file to the format of the folder it is in, and prints one
// line for each file that is sound or passed over, and one for each fault of the others. A folder is never
// checked, and a path that cannot be reached is a file that cannot be read, whatever its name: only a
// README.md that is there is passed over. It reads the files it is given and writes nothing.
// `traits` writes one file, the audience's copy of one profile, and nothing when it refuses.
// Exit codes: 0 every card is sound, or the copy is written · 1 a fault found, or the copy refused · 2 bad
// usage.
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { CHARACTERISTICS, CRITERION, FIELDS, FOLDERS, PERSON_FOLDER, PROFILE_CLOSING, PROFILE_FOLDER, traitsOf, validateCard, validatePerson, validateProfile } from './lib/card.mjs';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { reason } from './lib/json-file.mjs';

const SEATS = Object.keys(FOLDERS);
// The seats' folders as a sentence names them: makers, judges or audiences.
const SEAT_FOLDERS = `${SEATS.slice(0, -1).join(', ')} or ${SEATS.at(-1)}`;
// A pool folder's own page: setup writes one in each folder of a project's pool, and it is never a card.
const README = 'README.md';
const VERBS = ['check', 'traits'];
const LABEL = `${CRITERION}:`;

const USAGE = `Usage: node scripts/card.mjs check <file>...
       node scripts/card.mjs traits <profile> --out <file>

check holds each file to its format, by the folder it is in: a file in
${SEATS.slice(0, -1).map(folder => `${folder}/`).join(', ')} or ${SEATS.at(-1)}/ is a seat's card, and a file in ${PERSON_FOLDER}/ is a person's,
each held to the card format (pool/CARD-FORMAT.md); a file in ${PROFILE_FOLDER}/ is a profession's profile,
held to the sections and the labels of templates/people/PROFILE-CARD.md. The folder and the file's
name are part of the check: a card's shelf is its folder's, and its id is its file's name. A
project's own cards, people and professions are checked with it before they are cast. Nothing is
written.

A profession's profile is sound when its id is profile.<name>, the name its file's, and its header
holds nothing else; when it has the template's sections, once each and in order:
  ${CHARACTERISTICS.slice(0, 4).join(', ')},
  ${CHARACTERISTICS.slice(4).join(', ')},
then any characteristic the project added, then ${PROFILE_CLOSING.join(' and ')}; when each
characteristic, and each "####" characteristic of a "###" specialty, has its four fields once each,
the label of each at the start of a line and after a blank line, so that a field is a block of its
own: ${FIELDS.slice(0, -1).map(field => `"${field}:"`).join(', ')}
and "${LABEL}"; and "${LABEL}" is written nowhere but at the start of a
line.

It prints one line for each file, under the path as it was given: "<file>: ok" when the card is sound,
or one line for each of its faults, "<file>: <fault>". A file named ${README} is never a card: it is
passed over, and its line says so. A path that cannot be reached, whatever its name, is a file that
cannot be read. A file in any other folder is no card to check, and is not opened. Each is a fault of
the file. A folder is not checked: files are named one by one, and a folder given is a fault.

traits writes the audience's copy of a profession's profile to --out: the profile as it is, without
each "${LABEL}" field, from its label to the next blank line, and without each
paragraph before the first section that speaks of the fields themselves (one that says "fourth field"
or "four fields"): the template's own account of the format, which is no trait. Nothing else is
changed. It prints one line, "wrote the traits of <profile> to <file>: …", with what it took out.
It refuses a profile that fails check, printing its faults as check does; a file that is not in a
folder named ${PROFILE_FOLDER}; and a copy in which the words "${CRITERION.toLowerCase()}" are still written, in
any case, naming each line: an audience is never handed what the interface must do. A copy that is
refused is not written, and what was at --out is left. --out is not the profile itself; its folder is
made when it is not there.

A flag may also be written --flag=value.

Exit codes: 0 every card is sound, or the copy is written · 1 a card has a fault, a file is in no
folder of cards, a file cannot be read, a folder was given, or the copy is refused or cannot be
written · 2 bad usage.
`;

// A failure the command expects and explains in one message: exit 1, without a stack.
class Failure extends Error {}

function readArgs(argv) {
  // --out is the flag of traits alone: check knows none.
  const args = parseArgs(argv, { flags: ['out'] });
  if (args.help) return args;
  const [verb, ...files] = args.positional;
  const given = Object.hasOwn(args.flags, 'out');
  if (verb === undefined) throw new UsageError(`no verb given: card.mjs takes ${VERBS.join(' or ')}`);
  if (!VERBS.includes(verb)) throw new UsageError(`unknown verb "${verb}": card.mjs takes ${VERBS.join(' or ')}`);
  if (verb === 'check') {
    if (given) throw new UsageError('unknown flag --out');
    if (files.length === 0) throw new UsageError('check takes at least one <file>');
    return { verb, files };
  }
  if (files.length !== 1) throw new UsageError(`traits takes one <profile>, got ${files.length}`);
  if (!given) throw new UsageError('--out is missing');
  return { verb, profile: files[0], out: args.flags.out };
}

// The checker of a folder's files: a seat's card, a person's, a profession's profile, or none when the
// folder holds none of them.
function checkerOf(folder) {
  if (SEATS.includes(folder)) return validateCard;
  if (folder === PERSON_FOLDER) return validatePerson;
  return folder === PROFILE_FOLDER ? validateProfile : null;
}

// What a path is, asked without opening it: a folder or not, and why it cannot be reached when it cannot.
function placeOf(path) {
  try {
    return { isFolder: statSync(path).isDirectory() };
  } catch (e) {
    return { isFolder: false, unreachable: reason(e) };
  }
}

// What is wrong with one file, each fault one line; none when its card is sound, and null when the file is
// passed over. A folder is no file, and a path that cannot be reached is said so, each whatever its name: a
// README is passed over only when it is there. The folder a file is in says what it is held to, and is
// judged before the file is opened.
function faultsOf(path) {
  const name = basename(path);
  const { isFolder, unreachable } = placeOf(path);
  if (isFolder) return ['file: this is a folder, and files are checked one by one: name each file in it'];
  if (unreachable !== undefined) return [`file: cannot be read: ${unreachable}`];
  if (name === README) return null;
  const folder = basename(dirname(resolve(path)));
  const validate = checkerOf(folder);
  if (!validate) return [`file: a card is in a folder named ${SEAT_FOLDERS}, a person in one named ${PERSON_FOLDER}, and a profession's profile in one named ${PROFILE_FOLDER}; this file is in "${folder}"`];
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    return [`file: cannot be read: ${reason(e)}`];
  }
  return validate(text, { file: `${folder}/${name}` });
}

// Prints the line or lines of each file, in the order given; true when none has a fault.
function check(files) {
  let sound = true;
  for (const file of files) {
    const faults = faultsOf(file);
    if (faults === null) process.stdout.write(`${file}: passed over: a ${README} is never a card\n`);
    else if (faults.length === 0) process.stdout.write(`${file}: ok\n`);
    else {
      sound = false;
      process.stdout.write(faults.map(fault => `${file}: ${fault}\n`).join(''));
    }
  }
  return sound;
}

// One file under two paths, whichever way each is written: the same device and the same file on it.
function sameFile(a, b) {
  try {
    const [x, y] = [statSync(a, { bigint: true }), statSync(b, { bigint: true })];
    return x.dev === y.dev && x.ino === y.ino;
  } catch {
    return false;
  }
}

// What keeps a path from being a profile whose traits can be taken, each fault one line; else its copy.
// The folder is judged before the file is opened, as check judges it.
function copyOf(path) {
  const name = basename(path);
  const { isFolder, unreachable } = placeOf(path);
  if (isFolder) return { faults: ['file: this is a folder: name the profile in it'] };
  if (unreachable !== undefined) return { faults: [`file: cannot be read: ${unreachable}`] };
  const folder = basename(dirname(resolve(path)));
  if (folder !== PROFILE_FOLDER) return { faults: [`file: traits are taken from a profession's profile, a file in a folder named ${PROFILE_FOLDER}; this file is in "${folder}"`] };
  if (name === README) return { faults: [`file: a ${README} is never a card: it has no traits`] };
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    return { faults: [`file: cannot be read: ${reason(e)}`] };
  }
  return traitsOf(text, { file: `${folder}/${name}` });
}

// Writes the audience's copy of one profile. Everything is read and judged before anything is written.
function traits({ profile, out }) {
  if (sameFile(out, profile)) throw new UsageError('--out is the profile itself: writing the copy would overwrite it');
  const { faults, copy, fields, paragraphs } = copyOf(profile);
  if (faults.length > 0) throw new Failure(`no copy of ${profile} is written:\n${faults.map(fault => `${profile}: ${fault}`).join('\n')}`);
  try {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, copy);
  } catch (e) {
    throw new Failure(`cannot write ${out}: ${reason(e)}`);
  }
  const about = paragraphs === 0 ? '' : `, and ${paragraphs} paragraph${paragraphs === 1 ? '' : 's'} about the fields`;
  process.stdout.write(`wrote the traits of ${profile} to ${out}: ${fields} "${LABEL}" fields taken out${about}\n`);
}

function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) process.stdout.write(USAGE);
    else if (args.verb === 'traits') traits(args);
    else if (!check(args.files)) process.exitCode = 1;
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof Failure) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) main(process.argv.slice(2));
