#!/usr/bin/env node
// card: a project's own cards and people, checked before they are cast. The checking is the library's
// (lib/card.mjs); this is the command over it. `check` holds each file to the format of the folder it is
// in, and prints one line for each file that is sound or passed over, and one for each fault of the others.
// It reads the files it is given and writes nothing.
// Exit codes: 0 every card is sound · 1 a fault found · 2 bad usage.
import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { FOLDERS, PERSON_FOLDER, validateCard, validatePerson } from './lib/card.mjs';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { reason } from './lib/json-file.mjs';

const SEATS = Object.keys(FOLDERS);
// The seats' folders as a sentence names them: makers, judges or audiences.
const SEAT_FOLDERS = `${SEATS.slice(0, -1).join(', ')} or ${SEATS.at(-1)}`;
// A pool folder's own page: setup writes one in each folder of a project's pool, and it is never a card.
const README = 'README.md';
const VERB = 'check';

const USAGE = `Usage: node scripts/card.mjs check <file>...

check holds each file to the card format (pool/CARD-FORMAT.md), by the folder it is in: a file in
${SEATS.slice(0, -1).map(folder => `${folder}/`).join(', ')} or ${SEATS.at(-1)}/ is a seat's card, and a file in ${PERSON_FOLDER}/ is a person's. The folder and the
file's name are part of the check: a card's shelf is its folder's, and its id is its file's name. A
project's own cards and people are checked with it before they are cast. Nothing is written.

It prints one line for each file, under the path as it was given: "<file>: ok" when the card is sound,
or one line for each of its faults, "<file>: <fault>". A file named ${README} is never a card: it is
passed over, and its line says so. A file in any other folder is no card to check, and is not opened:
that is a fault of the file, and so is a file that cannot be read.

Exit codes: 0 every card is sound · 1 a card has a fault, a file is in no folder of cards, or a file
cannot be read · 2 bad usage.
`;

function readArgs(argv) {
  const args = parseArgs(argv);
  if (args.help) return args;
  const [verb, ...files] = args.positional;
  if (verb === undefined) throw new UsageError(`no verb given: card.mjs takes ${VERB}`);
  if (verb !== VERB) throw new UsageError(`unknown verb "${verb}": card.mjs takes ${VERB}`);
  if (files.length === 0) throw new UsageError(`${VERB} takes at least one <file>`);
  return { files };
}

// The checker of a folder's files: a seat's card, a person's, or none when the folder holds neither.
function checkerOf(folder) {
  if (SEATS.includes(folder)) return validateCard;
  return folder === PERSON_FOLDER ? validatePerson : null;
}

// What is wrong with one file, each fault one line; none when its card is sound, and null when the file is
// passed over. The folder it is in says what it is held to, and is judged before the file is opened.
function faultsOf(path) {
  const name = basename(path);
  if (name === README) return null;
  const folder = basename(dirname(resolve(path)));
  const validate = checkerOf(folder);
  if (!validate) return [`file: a card is in a folder named ${SEAT_FOLDERS}, and a person in one named ${PERSON_FOLDER}; this file is in "${folder}"`];
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

function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) process.stdout.write(USAGE);
    else if (!check(args.files)) process.exitCode = 1;
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    process.stderr.write(`${e.message}\n\n${USAGE}`);
    process.exitCode = 2;
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) main(process.argv.slice(2));
