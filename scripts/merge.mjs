#!/usr/bin/env node
// merge: the blind at Structure, as a command. It shuffles the proposals into letters and writes the
// author map beside the board without printing it (lib/merge.mjs); `open` prints the map, only once the
// founder's pick is written beside the board. On success merge prints the count, the letters and the board
// folder: nothing that names a source, and not where the map is.
// Exit codes: 0 success · 1 a refusal · 2 bad usage.
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { MAP, MAX_SEED, MergeError, PICK, mergeProposals, openMap } from './lib/merge.mjs';
import { ProposalFileError } from './lib/proposal-file.mjs';

const USAGE = `Usage: node scripts/merge.mjs <proposals dir> --out <board dir> [--seed <n>]
       node scripts/merge.mjs open <board dir>

merge shuffles the proposals in <proposals dir> (each .json file directly in it, at most 26; sub-folders
are not read) into letters A, B, C ... and writes each to <board dir>/<letter>.json as a letter copy:
without firstIdea, author, engine, track, model or source, its keys in the format's own order. Every
proposal must be valid, or nothing is written. The board folder holds the letters and nothing else, and
it is written whole or not at all. The map, naming the board it belongs to and each letter's source, is
written to ${MAP} beside the board folder, in its parent, and is never printed.
<board dir> must be empty or absent, and its parent must hold no ${MAP} and no ${PICK}:
one folder holds one board. A sealed board is never merged again: delete it and its map on purpose to
rebuild it. A board is never made inside another (a folder above it holding letter files), nor in, inside
or around <proposals dir>.

  --out <board dir>   the board to write; the folders above it are made when they do not exist
  --seed <n>          a whole number from 0 to ${MAX_SEED}: the same seed and proposals give the
                      same letters, for tests; a board people will read is merged without one

open prints the map, one line per letter: the letter, the source file, its track and its engine, a dash
where the proposal named none. It refuses until ${PICK}, beside the board folder, holds the founder's
pick on a line of its own: "Pick: <letter>" naming a letter on the board, or "Pick: none"; and it refuses
a map that names another board, or other letters than the board folder holds.

A flag may also be written --flag=value.

Exit codes: 0 success · 1 a refusal (an invalid or unreadable proposal, no proposals, more than 26, a
board that is sealed, not empty, not writable, inside another board or among the proposals, a pick left
from another board, a map still sealed, not a map or not this board's) · 2 bad usage.
`;

function readArgs(argv) {
  if (argv[0] === 'open') {
    const args = parseArgs(argv.slice(1));
    if (args.help) return args;
    if (args.positional.length !== 1) throw new UsageError(`open takes one <board dir>, got ${args.positional.length}`);
    return { open: true, board: args.positional[0] };
  }
  const args = parseArgs(argv, { flags: ['out', 'seed'] });
  if (args.help) return args;
  const { positional, flags } = args;
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

// Prints the count, the letters and the board folder: no source file, no maker, no engine, no track, and
// not the map.
function merge({ src, out, seed }) {
  const { letters, board } = mergeProposals(src, out, { seed });
  const count = `${letters.length} proposal${letters.length === 1 ? '' : 's'}`;
  process.stdout.write(`merged ${count} into ${board}: ${letters.join(', ')}\n`);
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
if (isMain(import.meta.url)) main(process.argv.slice(2));
