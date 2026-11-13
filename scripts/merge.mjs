#!/usr/bin/env node
// merge: the blind at Structure, as a command. It shuffles the proposals into letters and writes the
// author map without printing it (lib/merge.mjs); `open` prints the map, only once the founder's pick is
// written. On success merge prints the count and the letters, and nothing that names a source.
// Exit codes: 0 success · 1 a refusal · 2 bad usage.
import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAP, MAX_SEED, MergeError, PICK, mergeProposals, openMap } from './lib/merge.mjs';
import { ProposalFileError } from './lib/proposal-file.mjs';

const USAGE = `Usage: node scripts/merge.mjs <proposals dir> --out <board dir> [--seed <n>]
       node scripts/merge.mjs open <board dir>

merge shuffles the proposals in <proposals dir> (each .json file directly in it, at most 26; sub-folders
are not read) into letters A, B, C ... and writes each to <board dir>/<letter>.json as a letter copy:
without firstIdea, author, engine, track, model or source, its keys in the format's own order. It writes
the map from letter to source to <board dir>/${MAP} and never prints it. Every proposal must
be valid, or nothing is written.
<board dir> must be empty or absent. A sealed board is never merged again: delete it on purpose to rebuild it.

  --out <board dir>   the board to write; its folder is made when it does not exist
  --seed <n>          a whole number from 0 to ${MAX_SEED}: the same seed and proposals give the
                      same letters, for tests; a board people will read is merged without one

open prints the map, one line per letter: the letter, the source file, its track and its engine, a dash
where the proposal named none. It refuses until <board dir>/${PICK} holds the founder's pick.

A flag may also be written --flag=value.

Exit codes: 0 success · 1 a refusal (an invalid or unreadable proposal, no proposals, more than 26, a
board folder that is sealed, not empty or not writable, a map still sealed) · 2 bad usage.
`;
const HELP = ['--help', '-h'];

class UsageError extends Error {}

function readArgs(argv) {
  const open = argv[0] === 'open';
  const allowed = open ? [] : ['out', 'seed'];
  const positional = [];
  const flags = {};
  for (let i = open ? 1 : 0; i < argv.length; i++) {
    const arg = argv[i];
    if (HELP.includes(arg)) return { help: true };
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    const name = arg.slice(2, eq === -1 ? undefined : eq);
    if (open) throw new UsageError(`open takes no flag; --${name} is given`);
    if (!allowed.includes(name)) throw new UsageError(`unknown flag --${name}`);
    if (Object.hasOwn(flags, name)) throw new UsageError(`--${name} is given twice`);
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined || value === '') throw new UsageError(`--${name} needs a value`);
    // A flag never takes the next flag as its value.
    if (value.startsWith('--') || HELP.includes(value)) throw new UsageError(`--${name} needs a value; "${value}" is a flag`);
    flags[name] = value;
  }
  if (open) {
    if (positional.length !== 1) throw new UsageError(`open takes one <board dir>, got ${positional.length}`);
    return { open: true, board: positional[0] };
  }
  if (positional.length !== 1) throw new UsageError(`merge takes one <proposals dir>, got ${positional.length}`);
  if (!Object.hasOwn(flags, 'out')) throw new UsageError('--out is missing');
  let seed;
  if (Object.hasOwn(flags, 'seed')) {
    if (!/^\d+$/.test(flags.seed) || Number(flags.seed) > MAX_SEED) {
      throw new UsageError(`--seed must be a whole number from 0 to ${MAX_SEED}; it is "${flags.seed}"`);
    }
    seed = Number(flags.seed);
  }
  return { src: positional[0], out: flags.out, seed };
}

// Prints the count and the letters: no source file, no maker, no engine, no track.
function merge({ src, out, seed }) {
  const { letters } = mergeProposals(src, out, { seed });
  const count = `${letters.length} proposal${letters.length === 1 ? '' : 's'}`;
  process.stdout.write(
    `merged ${count} into ${out}: ${letters.join(', ')}\n` +
      `the author map is sealed in ${join(out, MAP)}; it opens only once ${join(out, PICK)} holds the founder's pick\n`,
  );
}

function open(board) {
  const map = openMap(board);
  const show = value => value ?? '-';
  // The map is written in letter order.
  const lines = Object.keys(map).map(letter => `${letter}  ${map[letter].file}  ${show(map[letter].track)}  ${show(map[letter].engine)}\n`);
  process.stdout.write(lines.join(''));
}

function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) process.stdout.write(USAGE);
    else if (args.open) open(args.board);
    else merge(args);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof MergeError || e instanceof ProposalFileError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
const realpath = file => {
  try {
    return realpathSync(file);
  } catch {
    return null;
  }
};
if (process.argv[1] && realpath(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
