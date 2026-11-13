#!/usr/bin/env node
// The command line over scripts/lib/state.mjs: it parses the arguments, calls the library, prints and sets
// the exit code (0 success, 1 a refusal or a problem found, 2 bad usage). All the logic is in the library.
import { STAGES, SIZES, FOUNDATIONS, KINDS, StateError, init, stamp, reopen, resize, validate, next, status } from './lib/state.mjs';

const USAGE = `Usage: node scripts/state.mjs <verb> <package> [stage] [flags]

The state of a design package. state.json is the record; STATE.md is generated from it on every write
and is never edited by hand.

  init <package> --design <name> --kind <kind> --foundation <foundation> --size <size> [--date <day>]
  stamp <package> <stage> --words "<the founder's words>" [--date <day>]
      approve the stage's output in the words the founder approved it with
  reopen <package> <stage> --reason "<why>" [--date <day>]
      give an approved or stale stage a new version; later outputs built from the old one turn stale
  resize <package> --size <size>      the size only moves up
  validate <package>                  prints ok, or one line per problem: <stage>: <code>: <message>
  next <package>                      prints the first stage on the route not approved, or none
  status <package>                    prints STATE.md as generated from state.json

Stages:      ${STAGES.join(', ')}
Sizes:       ${SIZES.join(', ')}
Foundations: ${FOUNDATIONS.join(', ')}
Kinds:       ${KINDS.join(', ')}, or any kebab-case kind the project adds

--words, --reason and --design are kept on one line: each line break in them becomes a single space.
--date is a day written YYYY-MM-DD and defaults to today. A flag may also be written --flag=value.

Exit codes: 0 success · 1 a refusal or a problem found · 2 bad usage.
`;

const VERBS = {
  init: { stage: false, required: ['design', 'kind', 'foundation', 'size'], optional: ['date'] },
  stamp: { stage: true, required: ['words'], optional: ['date'] },
  reopen: { stage: true, required: ['reason'], optional: ['date'] },
  resize: { stage: false, required: ['size'], optional: [] },
  validate: { stage: false, required: [], optional: [] },
  next: { stage: false, required: [], optional: [] },
  status: { stage: false, required: [], optional: [] },
};
const FLAGS = ['design', 'kind', 'foundation', 'size', 'words', 'reason', 'date'];
const HELP = ['--help', '-h'];

class UsageError extends Error {}

function read(argv) {
  const [verb, ...rest] = argv;
  if (HELP.includes(verb)) return { help: true };
  const spec = Object.hasOwn(VERBS, verb ?? '') ? VERBS[verb] : null;
  if (!spec) throw new UsageError(verb ? `unknown verb "${verb}"` : 'no verb given');
  const positional = [];
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (HELP.includes(arg)) return { help: true };
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    const name = arg.slice(2, eq === -1 ? undefined : eq);
    if (!FLAGS.includes(name)) throw new UsageError(`unknown flag --${name}`);
    if (![...spec.required, ...spec.optional].includes(name)) throw new UsageError(`--${name} does not apply to ${verb}`);
    if (Object.hasOwn(flags, name)) throw new UsageError(`--${name} is given twice`);
    const value = eq === -1 ? rest[++i] : arg.slice(eq + 1);
    if (value === undefined) throw new UsageError(`--${name} needs a value`);
    flags[name] = value;
  }
  const wanted = spec.stage ? ['<package>', '<stage>'] : ['<package>'];
  if (positional.length !== wanted.length) throw new UsageError(`${verb} takes ${wanted.join(' ')}, got ${positional.length} argument(s)`);
  const missing = spec.required.filter(name => !Object.hasOwn(flags, name));
  if (missing.length) throw new UsageError(`${verb} needs ${missing.map(name => `--${name}`).join(', ')}`);
  return { verb, pkg: positional[0], stage: positional[1], flags };
}

function today() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function run({ verb, pkg, stage, flags }) {
  const date = flags.date ?? today();
  switch (verb) {
    case 'init': {
      const { design, kind, foundation, size } = flags;
      init(pkg, { design, kind, foundation, size, date });
      console.log(`initialised ${pkg}: ${kind}, ${foundation}, ${size}; next: ${next(pkg)}`);
      break;
    }
    case 'stamp': {
      const { version } = stamp(pkg, stage, { words: flags.words, date });
      console.log(`stamped ${stage} approved at version ${version} on ${date}`);
      break;
    }
    case 'reopen': {
      const { version, stale } = reopen(pkg, stage, { reason: flags.reason, date });
      console.log(`reopened ${stage} at version ${version}; stale: ${stale.join(', ') || 'none'}`);
      break;
    }
    case 'resize':
      resize(pkg, flags.size);
      console.log(`resized ${pkg} to ${flags.size}`);
      break;
    case 'validate': {
      const { ok, problems } = validate(pkg);
      if (ok) console.log('ok');
      for (const p of problems) console.log(`${p.stage}: ${p.code}: ${p.message}`);
      if (!ok) process.exitCode = 1;
      break;
    }
    case 'next':
      console.log(next(pkg) ?? 'none');
      break;
    case 'status':
      process.stdout.write(status(pkg));
      break;
  }
}

try {
  const args = read(process.argv.slice(2));
  if (args.help) process.stdout.write(USAGE);
  else run(args);
} catch (e) {
  if (e instanceof UsageError) {
    process.stderr.write(`${e.message}\n\n${USAGE}`);
    process.exitCode = 2;
  } else if (e instanceof StateError) {
    process.stderr.write(`${e.message}\n`);
    process.exitCode = 1;
  } else {
    throw e;
  }
}
