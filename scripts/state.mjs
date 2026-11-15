#!/usr/bin/env node
// The command line over scripts/lib/state.mjs: it parses the arguments, calls the library, prints and sets
// the exit code (0 success, 1 a refusal or a problem found, 2 bad usage). All the logic is in the library.
import {
  STAGES, SIZES, FOUNDATIONS, KINDS, MODES, StateError,
  init, begin, awaitFounder, stamp, reopen, setRoute, resize, validate, next, status, slug,
} from './lib/state.mjs';

const USAGE = `Usage: node scripts/state.mjs <verb> <package> [stage] [mode] [flags]

The state of a design package. state.json is the record; STATE.md is generated from it on every write
and is never edited by hand.

  init <package> --design <name> --kind <kind> --foundation <foundation> --size <size> [--date <day>]
  begin <package> <stage> [--date <day>]
      mark the stage in work since the day; its output need not exist yet; closes its open question.
      Refused while a stage the route runs before it is not approved.
  await <package> <stage> --question "<the one question>" [--date <day>]
      mark the stage's output as awaiting the founder, with the one open question. Refused while a
      stage the route runs before it is not approved.
  stamp <package> <stage> --words "<the founder's words>" [--date <day>]
      approve the stage's output in the words the founder approved it with; closes its open question.
      The output must be built from the stage before it on the route. It must hold what he said
      under "## Reviewed by the founder", and nothing left of its template: not the opening comment,
      and no instruction in braces on lines of its own. Its carry list may only name stages it is
      built from, and sources that are there: a file or a folder, by its path from the folder this
      command is run in, which is the project's root. A stale stage redone with a different body
      gets a new version. Every file of the stage's folder (04-structure/ to 08-acceptance/) is
      recorded with the stamp, what a mount or a file browser leaves behind passed over.
  reopen <package> <stage> --reason "<why>" [--date <day>]
      give an approved or stale stage a new version; later stages stamped as built from it turn stale,
      and a later stage awaiting the founder goes back in work, its question closed. Prints both
      lists: "stale:", then "back in work:".
  route <package> <stage> <${MODES.join('|')}> --reason "<why>" [--date <day>]
      route one stage full, short or skipped, with the reason; an approved stage whose mode changes
      turns stale, and an approved or awaiting stage cannot be skipped
  resize <package> --size <size>
      the size only moves up; an approved stage whose mode changes turns stale
  validate <package>                  prints ok, or one line per problem: <stage>: <code>: <message>
      Of an approved stage it says what the stamp would refuse, an output that changed since, and a
      file of the stage's folder that changed, was removed or was added since (a text file's line
      endings aside). A stage stamped before folders were recorded is held to its output alone.
      Run it from the project's root, as stamp is: a carry list's sources are looked for from there.
  next <package>                      prints the first stage on the route not approved, or none
  status <package>                    prints STATE.md as generated from state.json
  slug "<heading text>"               prints the slug a carry entry uses for that heading

Stages:      ${STAGES.join(', ')}
Sizes:       ${SIZES.join(', ')}
Foundations: ${FOUNDATIONS.join(', ')}
Kinds:       ${KINDS.join(', ')}, or any kebab-case kind the project adds

--words, --question, --reason and --design are kept on one line: each line break in them becomes a single space.
--date is a day written YYYY-MM-DD and defaults to today. A flag may also be written --flag=value.

Exit codes: 0 success · 1 a refusal or a problem found · 2 bad usage.
`;

const PACKAGE = ['<package>'];
const STAGE = ['<package>', '<stage>'];
const VERBS = {
  init: { args: PACKAGE, required: ['design', 'kind', 'foundation', 'size'], optional: ['date'] },
  begin: { args: STAGE, required: [], optional: ['date'] },
  await: { args: STAGE, required: ['question'], optional: ['date'] },
  stamp: { args: STAGE, required: ['words'], optional: ['date'] },
  reopen: { args: STAGE, required: ['reason'], optional: ['date'] },
  route: { args: [...STAGE, '<mode>'], required: ['reason'], optional: ['date'] },
  resize: { args: PACKAGE, required: ['size'], optional: [] },
  validate: { args: PACKAGE, required: [], optional: [] },
  next: { args: PACKAGE, required: [], optional: [] },
  status: { args: PACKAGE, required: [], optional: [] },
  slug: { args: ['<heading text>'], required: [], optional: [] },
};
const FLAGS = ['design', 'kind', 'foundation', 'size', 'words', 'question', 'reason', 'date'];
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
  if (positional.length !== spec.args.length) throw new UsageError(`${verb} takes ${spec.args.join(' ')}, got ${positional.length} argument(s)`);
  const missing = spec.required.filter(name => !Object.hasOwn(flags, name));
  if (missing.length) throw new UsageError(`${verb} needs ${missing.map(name => `--${name}`).join(', ')}`);
  return { verb, positional, flags };
}

function today() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function run({ verb, positional, flags }) {
  const [pkg, stage, mode] = positional;
  const date = flags.date ?? today();
  switch (verb) {
    case 'init': {
      const { design, kind, foundation, size } = flags;
      init(pkg, { design, kind, foundation, size, date });
      console.log(`initialised ${pkg}: ${kind}, ${foundation}, ${size}; next: ${next(pkg)}`);
      break;
    }
    case 'begin':
      begin(pkg, stage, { date });
      console.log(`${stage} is in work`);
      break;
    case 'await':
      awaitFounder(pkg, stage, { question: flags.question, date });
      console.log(`${stage} awaits the founder`);
      break;
    case 'stamp': {
      const { version } = stamp(pkg, stage, { words: flags.words, date });
      console.log(`stamped ${stage} approved at version ${version} on ${date}`);
      break;
    }
    case 'reopen': {
      const { version, stale, recalled } = reopen(pkg, stage, { reason: flags.reason, date });
      console.log(`reopened ${stage} at version ${version}; stale: ${stale.join(', ') || 'none'}; back in work: ${recalled.join(', ') || 'none'}`);
      break;
    }
    case 'route':
      setRoute(pkg, stage, mode, { reason: flags.reason, date });
      console.log(`${stage} is routed ${mode}`);
      break;
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
    case 'slug':
      console.log(slug(positional[0]));
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
