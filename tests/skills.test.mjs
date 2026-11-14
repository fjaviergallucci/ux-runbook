// The rules every skill of the kit keeps, and the eleven skills held to them.
// A skill is skills/<name>/SKILL.md, read by a session at the moment it must act and followed literally,
// with the long form of anything in references/ beside it. Each rule is a function, proven first on samples
// that exist nowhere else. Then each skill that is written is held to the rules, and each that waits for
// its task is a `todo` naming the task: take its `waits` out of the table and its test is live.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../scripts/lib/frontmatter.mjs';
import { MAP, PICK } from '../scripts/lib/merge.mjs';
import { ARTEFACT, FOUNDATIONS, KINDS, SIZES, STAGES, routeFor, slug } from '../scripts/lib/state.mjs';
import { validate } from '../scripts/lib/walkthrough.mjs';

const root = new URL('../', import.meta.url);
const at = path => new URL(path, root);
const read = path => readFileSync(at(path), 'utf8');

// ---- the eleven skills: each name, and its description word for word

// `stage`: one of the nine stage skills, which have the six sections. `sections`: a skill that is no stage
// and has the six sections all the same, as its brief gives them. `waits`: the task that writes it.
const SKILLS = Object.freeze([
  {
    name: 'design',
    description: 'Use when the user wants an interface designed, redesigned, adjusted or corrected (a screen, a flow, a page, a component), wants to resume or check a design package, or names a stage of the interface design pipeline. Start here: it holds the order of the stages, the state and the gates.',
  },
  {
    name: 'setup', sections: true,
    description: 'Use when an interface design is about to start in a project that has no design profile, or when the user asks to set a project up for the interface design pipeline.',
  },
  {
    name: 'frame', stage: true,
    description: 'Use when the interface design pipeline reaches Frame: a new design request must be classified by kind, foundation and size, and its route chosen.',
  },
  {
    name: 'context', stage: true,
    description: 'Use when the interface design pipeline reaches Context: the facts a design must be true to are gathered and corrected by the founder before anyone has an idea.',
  },
  {
    name: 'intent', stage: true,
    description: 'Use when the interface design pipeline reaches Intent: the person, the job, the success criteria, the tasks and the states of a surface are written from the corrected context.',
  },
  {
    name: 'cast', stage: true,
    description: 'Use when the interface design pipeline reaches Cast: the makers, the judges with their checks, the audiences and any fresh pass are chosen for one design.',
  },
  {
    name: 'structure', stage: true,
    description: 'Use when the interface design pipeline reaches Structure: several ways of solving the problem are proposed blind, drawn in one shared kit and put in front of the founder to pick.',
  },
  {
    name: 'detail', stage: true, waits: 'Task 17',
    description: 'Use when the interface design pipeline reaches Detail: the chosen structure is completed in every state, rule and string, as a clickable prototype.',
  },
  {
    name: 'look', stage: true, waits: 'Task 17',
    description: "Use when the interface design pipeline reaches Look: the finished appearance is designed on the project's tokens, or a visual direction is chosen where no design system exists.",
  },
  {
    name: 'handoff', stage: true, waits: 'Task 18',
    description: 'Use when the interface design pipeline reaches Handoff: an approved design is packed into one folder another session can build from without asking.',
  },
  {
    name: 'acceptance', stage: true, waits: 'Task 18',
    description: 'Use when a design handed off by the interface design pipeline has been built and must be checked against what was approved.',
  },
]);

// The six sections of a stage skill, and of setup, in this order. A section of the skill's own may follow
// the last.
const STAGE_SECTIONS = Object.freeze(['Question', 'Reads', 'Writes', 'Steps', 'Gate', 'Never']);
// The sentence every skill carries, so that a session knows where the scripts are.
const KIT_ROOT = "The kit's root is two directories above this skill's own folder; run a script as `node <kit root>/scripts/<name>.mjs`.";
const MAX_LINES = 200;
// The folders of the kit a skill may name a path in.
const KIT_FOLDERS = Object.freeze(['scripts', 'pool', 'templates', 'kit', 'reference', 'skills']);
// What no skill passes: a stand-in address for an outside model, and a seed for a board people will read.
const NEVER_PASSED = Object.freeze(['--endpoint', '--seed']);
const NAMES = [/\bVerbato\b/i, /\bVersa\b/];

// ---- reading a skill

// A text as one line, so that a sentence is found however it is wrapped.
const flat = text => text.replace(/\s+/g, ' ');
// Each line of a text, with whether it is inside a code fence. A fence's own lines are left out.
function linesOf(text) {
  let fenced = false;
  return text.split('\n').flatMap(line => {
    if (!/^\s*(?:```|~~~)/.test(line)) return [{ line, fenced }];
    fenced = !fenced;
    return [];
  });
}
// The `## ` headings of a text, in order, outside any code fence.
const headings = text => linesOf(text).filter(({ fenced }) => !fenced).map(({ line }) => /^## (.+?)\s*$/.exec(line)?.[1]).filter(Boolean);
// What is under one `## ` heading, to the next one or to the end.
const section = (text, name) => {
  const lines = text.split('\n');
  const from = lines.indexOf(`## ${name}`);
  assert.notEqual(from, -1, `## ${name}`);
  const to = lines.findIndex((line, i) => i > from && /^## /.test(line));
  return lines.slice(from + 1, to === -1 ? undefined : to).join('\n');
};
// The lines of a file as an editor counts them: the last one need not end in a line break.
const lineCount = text => (text === '' ? 0 : text.replace(/\n$/, '').split('\n').length);
const named = text => NAMES.some(name => name.test(text));

// A path of the kit, as a text names it: one of the kit's folders and what is in it, wherever it is written:
// in a sentence, in a code span, in a code fence, or in a command after the kit's root. A bare `kit/…`,
// `pool/…`, `templates/…`, `scripts/…`, `reference/…` or `skills/…` is always the kit's, and must exist. A
// path of the project is written from its packages folder or its package, as `<packages>/kit/kit.css` or
// `<package>/04-structure/board`: what follows another folder is passed over, as an absolute path is.
// A placeholder ends a path: `pool/makers/<name>.md` names `pool/makers`.
const KIT_PATH = new RegExp(`(?:(?<=<kit root>/)|(?<=(?<![\\w.-])\\./)|(?<![\\w/.-]))(?:${KIT_FOLDERS.join('|')})/(?:[\\w.-]*\\w(?:/[\\w.-]*\\w)*)?`, 'g');
const kitPaths = text => [...new Set([...text.matchAll(KIT_PATH)].map(([path]) => path.replace(/\/$/, '')))];
// A file of the skill's own references, or a folder of them, as one of its files names it.
const ownReferences = text => [...new Set([...text.matchAll(/(?<![\w/.-])references\/[\w.-]*\w(?:\/[\w.-]*\w)*/g)].map(([path]) => path))];

// The words of a command: a quoted string or a <placeholder> is part of one word, spaces and all. A `<` that
// stands alone is a word of its own: the shell's sign for reading from a file.
const words = line => line.match(/(?:"[^"]*"|<[^\s<>][^<>]*>|[^\s"<]+)+|</g) ?? [];
// What ends a command on a line of shell and lets another begin: the command after it, or a pipe.
const SEPARATORS = Object.freeze(['&&', '||', '|', ';']);
// What may stand at the start of a line before its command.
const PROMPTS = Object.freeze(['$', '%', '>']);
// A setting of the environment, written before the command it is for: NAME=value.
const isAssignment = word => /^[A-Za-z_]\w*=/.test(word);
// What may stand between the start of a command and its `node`: a program that runs another, or the
// parenthesis that opens a command of its own. `timeout` takes its time first.
const WRAPPERS = Object.freeze(['env', 'time', 'exec', 'npx', '(', '$(']);
// A parenthesis outside double quotes is a word of its own, so that `(node …)` and `x=$(node …)` are read.
const apart = line => line.split(/("[^"]*")/).map((part, i) => (i % 2 ? part : part.replace(/\$\(|[()]/g, ' $& '))).join('');
// A redirection ends a command too: `>` or `>>`, alone or after a digit or `&`, with its target against it
// or not, and `<` alone.
const isRedirection = word => word === '<' || /^(?:[0-9]|&)?>/.test(word);
// The kit's scripts folder, as a word of a command names it: `scripts/` where a path starts, or after
// nothing but `./`, `../` or a <placeholder>. In `tests/scripts/x.mjs` and `myscripts/x.mjs` it is another
// folder's, and an absolute path is not judged.
const KIT_SCRIPTS = /(?<![\w./-])(?:(?:\.{1,2}|<[^<>]*>)\/)*scripts\//;
// The commands a text gives that run a script of the kit, from each line of its code fences and then from
// each of its code spans. A command starts at the word `node`, where a shell would start one: at the start of
// the line, after a prompt (`$ node …`), after the command before it (`cd … && node …`), after a setting of
// the environment (`UX_CHROME=… node …`), or after a program that runs it (`env … node …`, `time node …`,
// `timeout 60 node …`, `pnpm exec node …`, `npx node …`, `x=$(node …)`). So a line of prose in a fence, or a
// comment, is not a command. It runs to the end, or to what ends a command in a shell, a redirection or a
// closing parenthesis among them, and it is one of the kit's when a word of it names the kit's scripts
// folder: `node --version` is not the kit's to check. A command stays on one line: one that a backslash
// carries on is read as far as the backslash, and refused. In a table row a bar is written `\|`, and is read
// as the bar it stands for.
function commandsOf(text) {
  const lines = linesOf(text);
  const prose = lines.filter(({ fenced }) => !fenced).map(({ line }) => (/^\s*\|/.test(line) ? line.replace(/\\\|/g, '|') : line)).join('\n');
  const code = [...lines.filter(({ fenced }) => fenced).map(({ line }) => line), ...[...prose.matchAll(/`([^`]+)`/g)].map(([, span]) => span)];
  return code.flatMap(line => {
    const all = words(apart(line));
    const found = [];
    for (let from = all.indexOf('node'); from !== -1; from = all.indexOf('node', from + 1)) {
      // What leads up to it: settings of the environment, and before them nothing, a prompt, another command's
      // end, or a program that runs it.
      let lead = from;
      while (lead > 0 && isAssignment(all[lead - 1])) lead--;
      const before = all[lead - 1];
      const starts = lead === 0 || SEPARATORS.includes(before) || WRAPPERS.includes(before) || all[lead - 2] === 'timeout' || (lead === 1 && PROMPTS.includes(before));
      if (!starts) continue;
      const end = all.findIndex((word, i) => i > from && (SEPARATORS.includes(word) || isRedirection(word) || word === ')'));
      const command = all.slice(from, end === -1 ? undefined : end);
      if (command.some(word => KIT_SCRIPTS.test(word))) found.push(command.join(' '));
    }
    return found;
  });
}

// ---- a script's usage, as its --help prints it

// The forms a usage gives, each as what follows the script. A script with verbs gives one form to a line
// under its usage (state.mjs); the others give each form on a usage line of its own, which may run on.
function formsOf(help) {
  const lines = help.split('\n');
  const from = lines.findIndex(line => line.startsWith('Usage:'));
  if (from === -1) return [];
  const to = lines.findIndex((line, i) => i > from && line.trim() === '');
  const forms = flat(lines.slice(from, to === -1 ? undefined : to).join(' ')).split(/node scripts\/[\w-]+\.mjs/).slice(1).map(form => form.trim());
  if (forms.length !== 1 || !forms[0].startsWith('<verb>')) return forms;
  return lines.filter(line => /^ {2}[a-z]/.test(line)).map(line => line.trim().split(/\s{2,}/)[0]);
}

const isLiteral = word => /^[a-z][a-z-]*$/.test(word);
const isMany = slot => /\.\.\.$|…/.test(slot);
// A word fits a slot that offers a choice, as <full|short|skipped>, when it is the slot itself or one of them.
const fits = (word, slot) => {
  const choice = /^<([^<>]*\|[^<>]*)>$/.exec(slot);
  return !choice || word === slot || choice[1].split('|').includes(word);
};

// One form as what it takes: its words in order (a verb as written, or a slot), and its flags, each with the
// slot of its value (null when it takes none) and whether it is required. A flag in [brackets] is optional.
function specOf(form) {
  const flags = {};
  const rest = form.replace(/\[(--[a-z-]+)(?: ([^\]]+))?\]/g, (_, flag, value) => {
    flags[flag] = { value: value ?? null, required: false };
    return ' ';
  });
  const fixed = [];
  const given = words(rest);
  for (let i = 0; i < given.length; i++) {
    if (!given[i].startsWith('--')) fixed.push(given[i]);
    else flags[given[i]] = { value: given[i + 1] !== undefined && !given[i + 1].startsWith('--') ? given[++i] : null, required: true };
  }
  return { fixed, flags };
}

// Why the words after a script are not this form, or null when they are.
function mismatch(given, { fixed, flags }) {
  const plain = [];
  const seen = new Set();
  for (let i = 0; i < given.length; i++) {
    if (!given[i].startsWith('--')) {
      plain.push(given[i]);
      continue;
    }
    const cut = given[i].indexOf('=');
    const name = cut === -1 ? given[i] : given[i].slice(0, cut);
    const flag = flags[name];
    if (!flag) return `${name} is not a flag of it`;
    if (seen.has(name)) return `${name} is given twice`;
    seen.add(name);
    if (flag.value === null) {
      if (cut !== -1) return `${name} takes no value`;
      continue;
    }
    const value = cut === -1 ? given[++i] : given[i].slice(cut + 1);
    if (value === undefined || value === '' || value.startsWith('--')) return `${name} needs its value, ${flag.value}`;
    if (!fits(value, flag.value)) return `${name} takes ${flag.value}, not ${value}`;
  }
  let i = 0;
  for (const slot of fixed) {
    if (i >= plain.length) return `${slot} is missing`;
    if (isLiteral(slot) ? plain[i] !== slot : !fits(plain[i], slot)) return `${plain[i]} is where ${slot} goes`;
    // A slot that repeats is the last of its form, and takes every word left.
    i = isMany(slot) ? plain.length : i + 1;
  }
  if (i < plain.length) return `${plain[i]} is a word too many`;
  const missing = Object.keys(flags).find(name => flags[name].required && !seen.has(name));
  return missing ? `${missing} is missing` : null;
}

// ---- the rules

function headerFaults(text, name, description) {
  const lines = text.split('\n');
  const close = lines[0].trimEnd() === '---' ? lines.findIndex((line, i) => i > 0 && line.trimEnd() === '---') : -1;
  if (close === -1) return ['SKILL.md: it opens with its header, between two "---" lines'];
  let data;
  try {
    ({ data } = parse(text));
  } catch (e) {
    return [`SKILL.md: header: ${e.message}`];
  }
  const written = lines.slice(1, close).find(line => line.startsWith('description:'));
  return [
    ...(data.name === name ? [] : [`SKILL.md: header: name is ${JSON.stringify(data.name)}, and the skill's folder is "${name}"`]),
    ...(data.description === description ? [] : ['SKILL.md: header: the description is not the one this skill was given, word for word']),
    // A reader of YAML takes ": " inside an unquoted value for a mapping, and Claude Code reads the header as YAML.
    ...(written === undefined || /^description:\s+"[^"]*"\s*$/.test(written) ? [] : ['SKILL.md: header: the description is written in double quotes, as description: "…"']),
  ];
}

// The wanted sections are all there, once each, in their order, with no other section before the last.
function sectionFaults(text, wanted) {
  const found = headings(text);
  const times = name => found.filter(heading => heading === name).length;
  const faults = [
    ...wanted.filter(name => times(name) === 0).map(name => `SKILL.md: "## ${name}" is missing`),
    ...wanted.filter(name => times(name) > 1).map(name => `SKILL.md: "## ${name}" is there ${times(name)} times`),
  ];
  if (faults.length) return faults;
  const own = found.filter(heading => wanted.includes(heading));
  if (own.join('|') !== wanted.join('|')) return [`SKILL.md: its sections come in the order ${wanted.join(', ')}, not ${own.join(', ')}`];
  const last = wanted.at(-1);
  return found.slice(0, found.indexOf(last)).filter(heading => !wanted.includes(heading))
    .map(name => `SKILL.md: "## ${name}" comes before "## ${last}"; a section of the skill's own goes after it`);
}

// Every path of the kit a file names is in the kit, and every reference of its own is in its folder: a
// file of the folder, or a folder that holds one.
function pathFaults(file, text, files, kit) {
  const held = path => Object.keys(files).some(name => name === path || name.startsWith(`${path}/`));
  return [
    ...kitPaths(text).filter(path => !kit.exists(path))
      .map(path => `${file}: names ${path}, which is not in the kit; a path of the project is written <packages>/… or <package>/…`),
    ...ownReferences(text).filter(path => !held(path)).map(path => `${file}: names ${path}, which is not in the skill's folder`),
  ];
}

// Every command that runs a script of the kit is written `node <kit root>/scripts/<name>.mjs …`, on one line,
// in a form the script's usage gives. The script may be in quotes.
function commandFaults(file, text, kit) {
  const faults = [];
  for (const command of commandsOf(text)) {
    const [, first = '', ...given] = words(command);
    const say = what => faults.push(`${file}: \`${command}\` ${what}`);
    const run = /^<kit root>\/scripts\/(<[^>]+>|[\w-]+)\.mjs$/.exec(first.replace(/^(["'])(.*)\1$/, '$2'));
    if (!run) {
      say('runs a script of the kit, which is written node <kit root>/scripts/<name>.mjs: a session is in the project, not in the kit');
      continue;
    }
    const script = `scripts/${run[1]}.mjs`;
    if (given.at(-1) === '\\') {
      say('runs on to the next line, and a command stays on one line');
      continue;
    }
    // A script that is not there is the path rule's to say; a name left to fill in, as in the sentence about
    // the kit's root, is no script and has no usage to be held to.
    if (!kit.exists(script)) continue;
    const help = kit.usage(script);
    const forms = help === null ? [] : formsOf(help);
    if (forms.length === 0) {
      say(`cannot be checked: ${script} --help gives no usage`);
      continue;
    }
    const banned = given.map(word => word.split('=')[0]).find(word => NEVER_PASSED.includes(word));
    if (banned) {
      say(`passes ${banned}, which no skill does`);
      continue;
    }
    const reasons = forms.map(form => [form, mismatch(given, specOf(form))]);
    if (reasons.some(([, reason]) => reason === null)) continue;
    // Said against the forms of its verb when it has one, else against those that open with no verb.
    const verb = given.find(word => !word.startsWith('--'));
    const opens = form => words(form)[0] ?? '';
    const near = [reasons.filter(([form]) => opens(form) === verb), reasons.filter(([form]) => !isLiteral(opens(form))), reasons].find(list => list.length);
    say(`is not as ${script} takes it: ${near.map(([form, reason]) => `${reason} (${form})`).join('; ')}`);
  }
  return faults;
}

// The faults of one skill, each as one line; none when it keeps every rule. `files` is the skill's folder:
// each file's text by its path from the folder. `kit` says whether a path from the kit's root exists, and
// gives the usage a script prints, or null.
function skillFaults({ name, description, stage = false, sections = false }, files, kit) {
  const text = files['SKILL.md'];
  if (text === undefined) return [`skills/${name}/SKILL.md is not written`];
  return [
    ...headerFaults(text, name, description),
    ...(lineCount(text) > MAX_LINES ? [`SKILL.md: it has ${lineCount(text)} lines, and a skill has ${MAX_LINES} at most: the long form goes in references/`] : []),
    ...(stage || sections ? sectionFaults(text, STAGE_SECTIONS) : []),
    ...(flat(text).includes(KIT_ROOT) ? [] : [`SKILL.md: it says where the kit's root is, in these words: ${KIT_ROOT}`]),
    ...Object.entries(files).flatMap(([file, body]) => [
      ...pathFaults(file, body, files, kit),
      ...commandFaults(file, body, kit),
      ...(named(body) ? [`${file}: names a product, and the kit is generic`] : []),
    ]),
  ];
}

// ---- inline samples: every rule is proven here, on a skill and a kit that exist nowhere else

const ROOMS = Object.freeze({ name: 'rooms', stage: true, description: 'Use when the front desk asks which rooms are free: the rooms are listed, the free ones first.' });
const SAMPLE_USAGE = Object.freeze({
  'scripts/rooms.mjs': [
    'Usage: node scripts/rooms.mjs free <day> --floor <n> [--until <hour>] [--wing <east|west>] [--quiet]',
    '       node scripts/rooms.mjs book <room> <hour>... --for <patient>',
    '         [--note "<why>"] [--endpoint <url>]',
    '       node scripts/rooms.mjs <plan.json>',
    '',
    'Lists the free rooms of a day, books one, or draws a plan of the floor.',
    '',
    '  --floor <n>   the floor to list',
  ].join('\n'),
  'scripts/desk.mjs': [
    'Usage: node scripts/desk.mjs <verb> <desk> [mode] [flags]',
    '',
    'The state of one front desk.',
    '',
    '  open <desk> --by "<who>" [--date <day>]',
    '      mark the desk open since the day',
    '  staff <desk> <one|two|none> [--seed <n>]',
    '  lock <desk> --now',
    '  closed <desk>                  prints yes or no',
    '',
    'Desks:   front, back',
  ].join('\n'),
  'scripts/silent.mjs': 'Draws a plan of the floor, and has no usage.\nSome run it as node scripts/silent.mjs <plan.json>',
});
const SAMPLE_PATHS = Object.freeze(['scripts', 'scripts/rooms.mjs', 'scripts/desk.mjs', 'scripts/silent.mjs', 'scripts/lib/walkthrough.mjs', 'pool', 'pool/INDEX.md', 'pool/makers', 'templates/briefs/maker.md', 'kit', 'kit/grey']);
const SAMPLE_KIT = Object.freeze({ exists: path => SAMPLE_PATHS.includes(path), usage: script => SAMPLE_USAGE[script] ?? null });

const TEXTS = Object.freeze({
  Question: 'Which rooms are free right now?',
  Reads: 'The bookings of the day, and `pool/INDEX.md` for who can be cast.',
  Writes: 'One list of rooms, in the shape of `templates/briefs/maker.md`.',
  Steps: '1. Ask the kit, from the project\'s root:\n\n   ```\n   node <kit root>/scripts/rooms.mjs free <day> --floor <n>\n   ```\n\n2. Then `node <kit root>/scripts/desk.mjs closed <desk>`. The long form is in `references/free.md`.',
  Gate: 'She picks a room, and her pick is written down in her words.',
  Never: '- Never list a room the clinic does not have.',
});
const GOOD = Object.freeze(STAGE_SECTIONS.map(name => Object.freeze([name, TEXTS[name]])));
// A skill as text: its header as written, a title, the opening lines, and each section in the order given.
const skillText = ({ name = ROOMS.name, description = `"${ROOMS.description}"`, opening = KIT_ROOT, sections = GOOD } = {}) =>
  `---\nname: ${name}\ndescription: ${description}\n---\n# Rooms\n\n${opening}\n\n${sections.map(([heading, text]) => `## ${heading}\n\n${text}\n`).join('\n')}`;
const REFERENCE = 'The long form. A card is `pool/makers/<name>.md`; the grey kit is in `kit/grey/`.\n';
// The sample skill's faults, after one change to its SKILL.md and one to the files beside it.
const faults = (change = {}, others = {}, skill = ROOMS) => skillFaults(skill, { 'SKILL.md': skillText(change), 'references/free.md': REFERENCE, ...others }, SAMPLE_KIT);
// Its faults with a SKILL.md written another way, whole.
const faultsOf = text => skillFaults(ROOMS, { 'SKILL.md': text, 'references/free.md': REFERENCE }, SAMPLE_KIT);
const setSection = (name, text) => GOOD.map(([heading, body]) => [heading, heading === name ? text : body]);
// The sample with one more line of its Steps: a sentence, or a command in a code span.
const withStep = line => faults({ sections: setSection('Steps', `${TEXTS.Steps}\n3. ${line}`) });
const withCommand = command => withStep(`Then \`${command}\`.`);
// The ways a command may be run by another program, or inside a command of its own.
const WRAPPED = Object.freeze([
  command => `env UX_CHROME=/usr/bin/chromium ${command}`, command => `env ${command}`, command => `time ${command}`, command => `timeout 60 ${command}`,
  command => `pnpm exec ${command}`, command => `npx ${command}`, command => `(${command})`, command => `stage=$(${command})`,
]);
// The same, with other files beside the SKILL.md.
const withStepAnd = (line, others) => faults({ sections: setSection('Steps', `${TEXTS.Steps}\n3. ${line}`) }, others);

// Exactly one fault, saying everything in `patterns`.
function only(found, ...patterns) {
  assert.equal(found.length, 1, `expected one fault, got:\n${found.join('\n')}`);
  for (const pattern of patterns) assert.match(found[0], pattern);
}

test('a good stage skill has no fault', () => {
  assert.deepEqual(faults(), []);
  // With CRLF line endings too, and with the sentence about the kit's root wrapped.
  assert.deepEqual(faultsOf(skillText().replace(/\n/g, '\r\n')), []);
  assert.deepEqual(faults({ opening: KIT_ROOT.replace('folder; run', 'folder;\nrun').replace('as `node', 'as\n`node') }), []);
});

test('a skill whose SKILL.md is not written is one fault, and nothing else is looked at', () => {
  only(skillFaults(ROOMS, { 'references/free.md': 'In Verbato, see `pool/NOWHERE.md`.' }, SAMPLE_KIT), /^skills\/rooms\/SKILL\.md is not written$/);
});

test('the header\'s name is the name of the skill\'s folder', () => {
  only(faults({ name: 'room' }), /^SKILL\.md: header: name is "room"/, /folder is "rooms"/);
  only(faults({ name: 'Rooms' }), /header: name is "Rooms"/);
});

test('the description is the one the skill was given, word for word', () => {
  only(faults({ description: `"${ROOMS.description.replace('free:', 'free;')}"` }), /^SKILL\.md: header: the description is not the one/, /word for word/);
  only(faults({ description: `"${ROOMS.description.slice(0, -1)}"` }), /the description is not the one/);
  only(faults({ description: `"${ROOMS.description} "` }), /the description is not the one/);
});

test('the description is written in double quotes', () => {
  only(faults({ description: ROOMS.description }), /^SKILL\.md: header: the description is written in double quotes/, /description: "…"/);
  // Quoted another way, the quotes are part of what is read: both faults.
  assert.equal(faults({ description: `'${ROOMS.description}'` }).length, 2);
  // A description that holds a double quote cannot be written in them.
  assert.equal(faults({ description: '"Use when she asks for a "quiet" room."' }, {}, { ...ROOMS, description: 'Use when she asks for a "quiet" room.' }).length, 1);
});

test('a skill with no header, a header never closed or one that cannot be read is one fault', () => {
  only(faultsOf(skillText().replace(/^---\n[^]*?\n---\n/, '')), /^SKILL\.md: it opens with its header/);
  only(faultsOf(skillText().replace('\n---\n# Rooms', '\n# Rooms')), /^SKILL\.md: it opens with its header/);
  only(faults({ description: `>\n  ${ROOMS.description}` }), /^SKILL\.md: header: line 4/, /nothing nested/);
  only(faultsOf(skillText().replace('name: rooms\n', 'name: rooms\nname: rooms\n')), /header: line 3: "name" appears twice/);
  // A header with no description at all is the one fault of its description, whatever the text under it says.
  only(faultsOf(skillText().replace(/^description: .*\n/m, '')), /the description is not the one/);
  only(faultsOf(skillText().replace(/^description: .*\n/m, '').replace('# Rooms\n', '# Rooms\n\ndescription: of the rooms\n')), /the description is not the one/);
});

test('a skill has 200 lines at most', () => {
  const padded = lines => skillText() + '- Never book a room twice.\n'.repeat(lines - lineCount(skillText()));
  assert.equal(lineCount(padded(200)), 200);
  assert.deepEqual(faultsOf(padded(200)), []);
  only(faultsOf(padded(201)), /^SKILL\.md: it has 201 lines/, /200 at most/, /references\//);
  // The last line counts whether or not it ends in a line break; a reference may be as long as it needs.
  only(faultsOf(padded(201).replace(/\n$/, '')), /it has 201 lines/);
  assert.deepEqual(faultsOf(padded(200).replace(/\n$/, '')), []);
  assert.deepEqual(faults({}, { 'references/free.md': 'A long form.\n'.repeat(400) }), []);
  assert.deepEqual([lineCount(''), lineCount('a'), lineCount('a\n'), lineCount('a\nb'), lineCount('a\n\n')], [0, 1, 1, 2, 2]);
});

test('a stage skill has each of the six sections', () => {
  for (const name of STAGE_SECTIONS) {
    only(faults({ sections: GOOD.filter(([heading]) => heading !== name) }), new RegExp(`^SKILL\\.md: "## ${name}" is missing$`));
  }
  assert.equal(faults({ sections: GOOD.slice(0, 3) }).length, 3);
  // A heading of another level, or a ## line in a code fence, is not the section.
  const without = name => GOOD.filter(([heading]) => heading !== name);
  const add = (sections, name, more) => sections.map(([heading, text]) => [heading, heading === name ? `${text}\n\n${more}` : text]);
  only(faults({ sections: add(without('Gate'), 'Steps', '### Gate\n\nShe picks a room.') }), /"## Gate" is missing/);
  only(faults({ sections: add(without('Gate'), 'Steps', '```\n## Gate\n```') }), /"## Gate" is missing/);
  assert.deepEqual(faults({ sections: add(GOOD, 'Steps', '~~~\n## Gate\n~~~') }), []);
});

test('the six sections come in their order, once each', () => {
  const swapped = [GOOD[0], GOOD[2], GOOD[1], ...GOOD.slice(3)];
  only(faults({ sections: swapped }), /^SKILL\.md: its sections come in the order Question, Reads, Writes, Steps, Gate, Never, not Question, Writes, Reads, Steps, Gate, Never$/);
  only(faults({ sections: [...GOOD.slice(0, 4), GOOD[5], GOOD[4]] }), /its sections come in the order/, /not Question, Reads, Writes, Steps, Never, Gate$/);
  only(faults({ sections: [...GOOD, ['Steps', 'And once more.']] }), /^SKILL\.md: "## Steps" is there 2 times$/);
});

test('a section of the skill\'s own goes after the six, never among them', () => {
  assert.deepEqual(faults({ sections: [...GOOD, ['When the desk is closed', 'Nothing is listed.']] }), []);
  only(faults({ sections: [...GOOD.slice(0, 4), ['Notes', 'A note.'], ...GOOD.slice(4)] }), /^SKILL\.md: "## Notes" comes before "## Never"/, /goes after it/);
  only(faults({ sections: [['Before you start', 'Read this.'], ...GOOD] }), /"## Before you start" comes before "## Never"/);
});

test('a skill is held to the six sections when it is a stage skill, or when the table gives it them', () => {
  const own = [['The order', TEXTS.Steps], ['Never', TEXTS.Never]];
  assert.deepEqual(faults({ sections: own }, {}, { ...ROOMS, stage: false }), []);
  assert.deepEqual(faults({ sections: own }, {}, { name: ROOMS.name, description: ROOMS.description }), []);
  assert.deepEqual(faults({ sections: own }, {}, { ...ROOMS, stage: false, sections: false }), []);
  assert.equal(faults({ sections: own }).length, 5);
  // A skill that is no stage, and is given the six: held to each of them, to their order, and to nothing
  // of its own among them, as a stage skill is.
  const given = { name: ROOMS.name, description: ROOMS.description, sections: true };
  assert.deepEqual(faults({}, {}, given), []);
  assert.deepEqual(faults({ sections: [...GOOD, ['When the desk is closed', 'Nothing is listed.']] }, {}, given), []);
  assert.equal(faults({ sections: own }, {}, given).length, 5);
  for (const name of STAGE_SECTIONS) {
    only(faults({ sections: GOOD.filter(([heading]) => heading !== name) }, {}, given), new RegExp(`^SKILL\\.md: "## ${name}" is missing$`));
  }
  only(faults({ sections: [GOOD[0], GOOD[2], GOOD[1], ...GOOD.slice(3)] }, {}, given), /its sections come in the order Question, Reads, Writes, Steps, Gate, Never, not Question, Writes, Reads/);
  only(faults({ sections: [...GOOD.slice(0, 4), ['Notes', 'A note.'], ...GOOD.slice(4)] }, {}, given), /"## Notes" comes before "## Never"/);
  only(faults({ sections: [...GOOD, ['Gate', 'And once more.']] }, {}, given), /"## Gate" is there 2 times/);
});

test('a skill carries the sentence about the kit\'s root, word for word', () => {
  only(faults({ opening: 'The scripts are in the kit.' }), /^SKILL\.md: it says where the kit's root is, in these words: The kit's root is two directories above/);
  only(faults({ opening: KIT_ROOT.replace('two directories', 'two folders') }), /in these words/);
  only(faults({ opening: KIT_ROOT.replace('run a script', 'run each script') }), /in these words/);
  // Another name for the kit's root is also a command written another way: both faults.
  assert.equal(faults({ opening: KIT_ROOT.replace('<kit root>', '<kit>') }).length, 2);
  // It is the skill's to say, not a reference's.
  only(faults({ opening: 'See the reference.' }, { 'references/free.md': `${REFERENCE}\n${KIT_ROOT}\n` }), /in these words/);
});

test('the paths of the kit a text names are found wherever they are written', () => {
  const text = [
    'Read `kit/KIT-CONTRACT.md`, then templates/outputs/LEDGER.md. See pool/INDEX.md.',
    '```', 'node <kit root>/scripts/state.mjs next <package>', 'node ./scripts/merge.mjs open <board dir>', '```',
    'A card is `pool/makers/<name>.md`; the cards are in `pool/`, the briefs in templates/briefs/*.md.',
    'Later: `reference/ANTI-PATTERNS.md`, `skills/cast/references/presets.md`, and `reference/`.',
  ].join('\n');
  assert.deepEqual(kitPaths(text), [
    'kit/KIT-CONTRACT.md', 'templates/outputs/LEDGER.md', 'pool/INDEX.md', 'scripts/state.mjs', 'scripts/merge.mjs', 'pool/makers', 'pool',
    'templates/briefs', 'reference/ANTI-PATTERNS.md', 'skills/cast/references/presets.md', 'reference',
  ]);
  // A path that starts elsewhere is the project's, or another machine's, and is not the kit's.
  const elsewhere = 'The kit is `<packages>/kit/kit.css`; hers is `design/pool/persons/desk.md`, or /home/x/pool/makers/a.md; `../scripts/x.mjs`; my-kit/notes.md; toolkit/a.md; `04-structure/board/`; the references/loop.md of a skill.';
  assert.deepEqual(kitPaths(elsewhere), []);
  assert.deepEqual(ownReferences('See `references/loop.md`, then references/fresh-pass.md. Not skills/design/references/blind.md, nor reference/GUIDE.md.'), ['references/loop.md', 'references/fresh-pass.md']);
});

test('every path of the kit a skill names exists, in SKILL.md and in each of its references', () => {
  only(withStep('Read `templates/briefs/usher.md`.'), /^SKILL\.md: names templates\/briefs\/usher\.md, which is not in the kit; a path of the project is written <packages>\/… or <package>\/…$/);
  only(faults({}, { 'references/free.md': 'See `pool/judges/room-truth.md`.' }), /^references\/free\.md: names pool\/judges\/room-truth\.md, which is not in the kit/);
  // A folder is a path too, and so is a script named in a command.
  only(withStep('The lessons are in `reference/`.'), /^SKILL\.md: names reference, which is not in the kit/);
  only(withStep('Read the cards in `pool/ushers/<name>.md`.'), /names pool\/ushers, which/);
  only(withCommand('node <kit root>/scripts/floor.mjs <plan.json>'), /^SKILL\.md: names scripts\/floor\.mjs, which is not in the kit/);
  // Named twice in one file, it is one fault; named in two files, one for each.
  only(withStep('Read `templates/briefs/usher.md`, and again templates/briefs/usher.md.'), /usher/);
  assert.equal(faults({ sections: setSection('Reads', '`kit/blue/kit.css`') }, { 'references/free.md': '`kit/blue/kit.css`' }).length, 2);
});

test('a path of the project is written from its packages folder or its package, and is not looked for in the kit', () => {
  const tree = lines => ({ 'references/free.md': `What setup writes:\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n` });
  assert.deepEqual(faults({}, tree(['<packages>/kit/kit.css', '<packages>/pool/profiles/front-desk.md', '<package>/04-structure/board/'])), []);
  assert.deepEqual(withStep('Her kit is `<packages>/kit/kit.css`, her people in `design/pool/persons/`.'), []);
  // Written bare, the same paths are the kit's, on a line of a code fence as anywhere, and the fault says how to write them.
  const bare = faults({}, tree(['kit/kit.css', 'pool/profiles/front-desk.md']));
  assert.deepEqual(bare.map(fault => fault.replace(/^references\/free\.md: names (\S+), which is not in the kit; a path of the project is written <packages>\/… or <package>\/…$/, '$1')), ['kit/kit.css', 'pool/profiles/front-desk.md']);
  // A tree drawn by indenting is read line by line, and a line cannot say whose folder it is: a bare `kit/` is
  // the kit's own, which is there. Only a path written whole is known for the project's.
  assert.deepEqual(faults({}, tree(['<packages>/', '  kit/', '    kit.css'])), []);
  only(faults({}, tree(['<packages>/', '  kit/kit.css'])), /^references\/free\.md: names kit\/kit\.css, which is not in the kit; a path of the project is written/);
});

test('a reference a skill points to is in its own folder, or in a folder of it', () => {
  only(withStep('See `references/booked.md`.'), /^SKILL\.md: names references\/booked\.md, which is not in the skill's folder$/);
  only(faults({}, { 'references/free.md': 'See also `references/booked.md`.' }), /^references\/free\.md: names references\/booked\.md/);
  assert.deepEqual(faults({}, { 'references/free.md': 'See also `references/booked.md`.', 'references/booked.md': 'Booked rooms.' }), []);
  only(skillFaults(ROOMS, { 'SKILL.md': skillText() }, SAMPLE_KIT), /names references\/free\.md, which is not in the skill's folder/);
  // A reference may sit in a folder of its own: the file is named whole, and so may its folder be.
  const nested = { 'references/floors/ground.md': 'The ground floor.' };
  assert.deepEqual(ownReferences('See `references/floors/ground.md`, the others in `references/floors/`, and `references/free.md`.'), ['references/floors/ground.md', 'references/floors', 'references/free.md']);
  assert.deepEqual(withStepAnd('See `references/floors/ground.md`; the other floors are in `references/floors/`.', nested), []);
  only(withStepAnd('See `references/floors/first.md`.', nested), /^SKILL\.md: names references\/floors\/first\.md, which is not in the skill's folder$/);
  only(withStep('See `references/floors/ground.md`.'), /names references\/floors\/ground\.md, which is not in the skill's folder$/);
  // The start of a name is not a folder.
  only(withStepAnd('See `references/floor`.', nested), /names references\/floor, which is not in the skill's folder$/);
  only(withStepAnd('See `references/fre`.', nested), /names references\/fre, which/);
});

test('the commands of a text are those that run a script of the kit, in its code fences and its code spans', () => {
  const text = [
    'Run `node <kit root>/scripts/rooms.mjs free <day> --floor <n>`, then, with the plan, `node <kit root>/scripts/rooms.mjs',
    '<plan.json>`. Not `scripts/rooms.mjs`, not `nodes scripts/rooms.mjs`, not `node --version`, not `then node scripts/rooms.mjs`, not node',
    'scripts/rooms.mjs said in a sentence.',
    '',
    '| When | Command |', '|---|---|', '| Two at the desk | `node <kit root>/scripts/desk.mjs staff <desk> <one\\|two\\|none>` |',
    '',
    '```',
    '   node  <kit root>/scripts/desk.mjs closed <desk>',
    'ls scripts/',
    '$ node "<kit root>/scripts/desk.mjs" closed <desk>',
    'cd <project> && node ./scripts/rooms.mjs <plan.json> | tee plan.log',
    'node --version && node scripts/desk.mjs closed <desk> ; node <kit root>/scripts/desk.mjs lock <desk> --now || exit 1',
    'node <kit root>/scripts/rooms.mjs free <day> \\',
    '  --floor <n>',
    '```',
  ].join('\n');
  assert.deepEqual(commandsOf(text), [
    'node <kit root>/scripts/desk.mjs closed <desk>',
    'node "<kit root>/scripts/desk.mjs" closed <desk>',
    'node ./scripts/rooms.mjs <plan.json>',
    'node scripts/desk.mjs closed <desk>',
    'node <kit root>/scripts/desk.mjs lock <desk> --now',
    'node <kit root>/scripts/rooms.mjs free <day> \\',
    'node <kit root>/scripts/rooms.mjs free <day> --floor <n>',
    'node <kit root>/scripts/rooms.mjs <plan.json>',
    'node <kit root>/scripts/desk.mjs staff <desk> <one|two|none>',
  ]);
  // Outside a table row, a backslash before a bar stays as written.
  assert.deepEqual(commandsOf('Run `node <kit root>/scripts/desk.mjs staff <desk> <one\\|two\\|none>`.'), ['node <kit root>/scripts/desk.mjs staff <desk> <one\\|two\\|none>']);
  assert.deepEqual(words('node <kit root>/scripts/desk.mjs open <the desk>/front --by "the one who opens" --date=2026-11-14'), [
    'node', '<kit root>/scripts/desk.mjs', 'open', '<the desk>/front', '--by', '"the one who opens"', '--date=2026-11-14',
  ]);
  assert.deepEqual(words('node <kit root>/scripts/rooms.mjs <plan.json> < <package>/answers.txt'), ['node', '<kit root>/scripts/rooms.mjs', '<plan.json>', '<', '<package>/answers.txt']);
  assert.deepEqual(words('sort < rooms.txt > sorted.txt'), ['sort', '<', 'rooms.txt', '>', 'sorted.txt']);
  // A parenthesis is a word of its own, but not inside double quotes, where it is part of what is said.
  assert.deepEqual(words(apart('open=$(node x) && (node y --by "the one (who opens)")')), ['open=', '$(', 'node', 'x', ')', '&&', '(', 'node', 'y', '--by', '"the one (who opens)"', ')']);
  assert.deepEqual(commandsOf('Run `node <kit root>/scripts/desk.mjs open <desk> --by "the one (who opens)"`.'), ['node <kit root>/scripts/desk.mjs open <desk> --by "the one (who opens)"']);
});

test('a command starts where a shell would start one, and ends where a shell would end it', () => {
  const fence = (...lines) => commandsOf(`\`\`\`\n${lines.join('\n')}\n\`\`\`\n`);
  const CLOSED = 'node <kit root>/scripts/desk.mjs closed <desk>';
  // It starts at the start of the line, after a prompt, after the command before it, or after a setting of the environment.
  for (const line of [CLOSED, `$ ${CLOSED}`, `% ${CLOSED}`, `> ${CLOSED}`, `cd <project> && ${CLOSED}`, `ls ; ${CLOSED}`, `ls | ${CLOSED}`, `ls || ${CLOSED}`,
    `UX_FLOOR=2 ${CLOSED}`, `UX_FLOOR=2 UX_WING=east ${CLOSED}`, `$ UX_FLOOR=2 ${CLOSED}`, `cd <project> && UX_FLOOR=2 ${CLOSED}`]) assert.deepEqual(fence(line), [CLOSED], line);
  // Or after a program that runs it, and inside the parentheses that make a command of their own.
  for (const line of [`env ${CLOSED}`, `env UX_FLOOR=2 ${CLOSED}`, `time ${CLOSED}`, `pnpm exec ${CLOSED}`, `timeout 60 ${CLOSED}`, `npx ${CLOSED}`, `$ time env UX_FLOOR=2 ${CLOSED}`,
    `(${CLOSED})`, `( ${CLOSED} )`, `stage=$(${CLOSED})`, `(cd <project> && ${CLOSED}) | tee closed.txt`]) assert.deepEqual(fence(line), [CLOSED], line);
  // Anywhere else the word is a word: a line of prose in a fence, a comment, a word after another.
  for (const line of [
    'Every node in the tree is a screen; see scripts/ for how.', '// node scripts/ are the kit\'s', '# node scripts/desk.mjs closed <desk>', 'echo node scripts/desk.mjs',
    'then $ node scripts/desk.mjs closed <desk>', 'ls > node scripts/desk.mjs', 'floor=2 then node scripts/desk.mjs closed <desk>',
    '--floor=2 node scripts/desk.mjs closed <desk>', 'sleep 60 node scripts/desk.mjs closed <desk>', 'timeout node scripts/desk.mjs closed <desk>',
  ]) assert.deepEqual(fence(line), [], line);
  // It ends at a redirection, alone or with its target against it, as at the next command.
  for (const tail of ['> <package>/closed.txt', '>> <package>/closed.txt', '2> errors.txt', '2>/dev/null', '>/dev/null', '2>&1', '&>/dev/null', '&> all.txt', '1><package>/closed.txt', '< answers.txt', '| tee closed.txt']) {
    assert.deepEqual(fence(`${CLOSED} ${tail}`), [CLOSED], tail);
  }
  // It is the kit's when it names the kit's scripts folder: where a path starts, or after only ./, ../ or a placeholder.
  for (const path of ['scripts/desk.mjs', './scripts/desk.mjs', '../../scripts/desk.mjs', '<kit>/scripts/desk.mjs', '"<kit root>/scripts/desk.mjs"', '\'./scripts/desk.mjs\'']) {
    assert.deepEqual(fence(`node ${path} closed <desk>`), [`node ${path} closed <desk>`], path);
  }
  assert.deepEqual(fence('node --input-type=module -e "import { validate } from \'./scripts/lib/walkthrough.mjs\';" <file>').length, 1);
  for (const path of ['tests/scripts/desk.mjs', 'myscripts/desk.mjs', 'my-scripts/desk.mjs', 'my.scripts/desk.mjs', '/home/her/kit/scripts/desk.mjs', '<project>/tools/scripts/desk.mjs', 'desk.mjs']) {
    assert.deepEqual(fence(`node ${path} closed <desk>`), [], path);
  }
});

test('the forms of a usage are read from its usage lines, or one to a line when the script has verbs', () => {
  assert.deepEqual(formsOf(SAMPLE_USAGE['scripts/rooms.mjs']), [
    'free <day> --floor <n> [--until <hour>] [--wing <east|west>] [--quiet]', 'book <room> <hour>... --for <patient> [--note "<why>"] [--endpoint <url>]', '<plan.json>',
  ]);
  assert.deepEqual(formsOf(SAMPLE_USAGE['scripts/desk.mjs']), ['open <desk> --by "<who>" [--date <day>]', 'staff <desk> <one|two|none> [--seed <n>]', 'lock <desk> --now', 'closed <desk>']);
  assert.deepEqual(formsOf(SAMPLE_USAGE['scripts/silent.mjs']), []);
  assert.deepEqual(specOf('free <day> --floor <n> [--until <hour>] [--quiet]'), {
    fixed: ['free', '<day>'],
    flags: { '--until': { value: '<hour>', required: false }, '--quiet': { value: null, required: false }, '--floor': { value: '<n>', required: true } },
  });
  // A flag the form requires may take no value: the word after it is then the next flag, or nothing.
  assert.deepEqual(specOf('lock <desk> --now'), { fixed: ['lock', '<desk>'], flags: { '--now': { value: null, required: true } } });
  assert.deepEqual(specOf('lock --now --by "<who>" <desk>').flags, { '--now': { value: null, required: true }, '--by': { value: '"<who>"', required: true } });
});

test('a command that runs a script of the kit is written as its usage gives it', () => {
  for (const command of [
    'node <kit root>/scripts/rooms.mjs free <day> --floor <n>',
    'node <kit root>/scripts/rooms.mjs free 2026-11-14 --floor=2 --quiet --until <hour>',
    'node <kit root>/scripts/rooms.mjs free <day> --floor <n> --wing <east|west>',
    'node <kit root>/scripts/rooms.mjs free <day> --floor <n> --wing=west',
    'node <kit root>/scripts/desk.mjs lock <desk> --now',
    'node <kit root>/scripts/rooms.mjs book <room> <hour> --for <patient>',
    'node <kit root>/scripts/rooms.mjs book <room> 9 10 11 --for <patient> --note "<why>"',
    'node <kit root>/scripts/rooms.mjs <package>/plan.json',
    'node <kit root>/scripts/desk.mjs open <desk> --by "<who>"',
    'node <kit root>/scripts/desk.mjs open design/front --date <day> --by "the one who opens"',
    'node <kit root>/scripts/desk.mjs staff <desk> <one|two|none>',
    'node <kit root>/scripts/desk.mjs staff <desk> two',
    'node <kit root>/scripts/desk.mjs closed <desk>',
    // The script may be in quotes, a prompt or another command may come before it, and another may follow.
    'node "<kit root>/scripts/desk.mjs" closed <desk>',
    "node '<kit root>/scripts/desk.mjs' closed <desk>",
    '$ node <kit root>/scripts/desk.mjs closed <desk>',
    'cd <project> && node <kit root>/scripts/desk.mjs closed <desk> && node <kit root>/scripts/desk.mjs lock <desk> --now',
    // What it prints may be sent to a file, and a setting of the environment may come before it.
    'node <kit root>/scripts/desk.mjs closed <desk> > <package>/closed.txt',
    'node <kit root>/scripts/desk.mjs closed <desk> 2>/dev/null',
    'UX_FLOOR=2 node <kit root>/scripts/desk.mjs closed <desk>',
    // A script of another folder is not the kit's.
    'node tests/scripts/desk.mjs shut <desk>',
    // Whatever runs it, the command is read.
    ...WRAPPED.map(wrap => wrap('node <kit root>/scripts/desk.mjs closed <desk>')),
    'node <kit root>/scripts/desk.mjs closed <desk> &>/dev/null',
    'node <kit root>/scripts/desk.mjs closed <desk> 1><package>/closed.txt',
    // A name left to fill in has no usage to be held to, and another program's command is not the kit's to check.
    'node <kit root>/scripts/<name>.mjs --help',
    'node --version',
  ]) assert.deepEqual(withCommand(command), [], command);

  const refused = (command, ...patterns) => only(withCommand(command), /^SKILL\.md: `node /, ...patterns);
  refused('node <kit root>/scripts/rooms.mjs free <day>', /is not as scripts\/rooms\.mjs takes it: --floor is missing \(free <day> --floor <n> \[--until <hour>\] \[--wing <east\|west>\] \[--quiet\]\)$/);
  refused('node <kit root>/scripts/rooms.mjs free <day> --floor <n> --ceiling <n>', /--ceiling is not a flag of it/);
  refused('node <kit root>/scripts/rooms.mjs free <day> --floor', /--floor needs its value, <n>/);
  refused('node <kit root>/scripts/rooms.mjs free <day> --floor --quiet', /--floor needs its value/);
  refused('node <kit root>/scripts/rooms.mjs free <day> --floor=', /--floor needs its value/);
  refused('node <kit root>/scripts/rooms.mjs free <day> --floor <n> --floor <n>', /--floor is given twice/);
  refused('node <kit root>/scripts/rooms.mjs free <day> --floor <n> --quiet=yes', /--quiet takes no value/);
  refused('node <kit root>/scripts/rooms.mjs free <day> --floor <n> --wing north', /--wing takes <east\|west>, not north/);
  refused('node <kit root>/scripts/desk.mjs lock <desk>', /--now is missing \(lock <desk> --now\)$/);
  refused('node <kit root>/scripts/desk.mjs lock <desk> --now <day>', /<day> is a word too many \(lock <desk> --now\)$/);
  refused('node <kit root>/scripts/rooms.mjs free --floor <n>', /<day> is missing/);
  refused('node <kit root>/scripts/rooms.mjs free <day> <night> --floor <n>', /<night> is a word too many/);
  refused('node <kit root>/scripts/rooms.mjs book <room> --for <patient>', /<hour>\.\.\. is missing/);
  refused('node <kit root>/scripts/rooms.mjs', /is not as scripts\/rooms\.mjs takes it: <plan\.json> is missing \(<plan\.json>\)$/);
  refused('node <kit root>/scripts/desk.mjs shut <desk>', /is not as scripts\/desk\.mjs takes it/, /shut is where open goes/, /shut is where closed goes \(closed <desk>\)$/);
  refused('node <kit root>/scripts/desk.mjs staff <desk> three', /three is where <one\|two\|none> goes/);
  refused('node <kit root>/scripts/desk.mjs staff <desk>', /<one\|two\|none> is missing \(staff <desk> <one\|two\|none> \[--seed <n>\]\)$/);
  refused('node <kit root>/scripts/desk.mjs closed', /<desk> is missing \(closed <desk>\)$/);
  refused('node <kit root>/scripts/desk.mjs closed <desk> --by "<who>"', /--by is not a flag of it \(closed <desk>\)$/);
  // However it is led up to, a wrong command is read, and refused.
  refused('node "<kit root>/scripts/desk.mjs" shut <desk>', /^SKILL\.md: `node "<kit root>\/scripts\/desk\.mjs" shut <desk>` is not as scripts\/desk\.mjs takes it/);
  refused('$ node <kit root>/scripts/desk.mjs shut <desk>', /^SKILL\.md: `node <kit root>\/scripts\/desk\.mjs shut <desk>` is not as/);
  refused('cd <project> && node <kit root>/scripts/desk.mjs shut <desk>', /`node <kit root>\/scripts\/desk\.mjs shut <desk>` is not as/);
  refused('UX_FLOOR=2 node <kit root>/scripts/desk.mjs shut <desk>', /`node <kit root>\/scripts\/desk\.mjs shut <desk>` is not as/);
  refused('node <kit root>/scripts/desk.mjs shut <desk> > <package>/closed.txt', /`node <kit root>\/scripts\/desk\.mjs shut <desk>` is not as/);
  for (const wrap of WRAPPED) refused(wrap('node <kit root>/scripts/desk.mjs shut <desk>'), /^SKILL\.md: `node <kit root>\/scripts\/desk\.mjs shut <desk>` is not as scripts\/desk\.mjs takes it/);
  refused('node <kit root>/scripts/desk.mjs shut <desk> &>/dev/null', /`node <kit root>\/scripts\/desk\.mjs shut <desk>` is not as/);
  refused('node <kit root>/scripts/desk.mjs shut <desk> 1><package>/closed.txt', /`node <kit root>\/scripts\/desk\.mjs shut <desk>` is not as/);
  refused('node <kit root>/scripts/desk.mjs closed <desk> && node <kit root>/scripts/desk.mjs lock <desk>', /`node <kit root>\/scripts\/desk\.mjs lock <desk>` is not as/, /--now is missing/);
  // In a table a bar is written \|; anywhere else the backslash is part of the word.
  assert.deepEqual(withStep('See:\n\n| When | Command |\n|---|---|\n| Two at the desk | `node <kit root>/scripts/desk.mjs staff <desk> <one\\|two\\|none>` |'), []);
  refused('node <kit root>/scripts/desk.mjs staff <desk> <one\\|two\\|none>', /is where <one\|two\|none> goes/);
});

test('a command that runs a script of the kit is written node <kit root>/scripts/<name>.mjs, on one line', () => {
  const FORM = /runs a script of the kit, which is written node <kit root>\/scripts\/<name>\.mjs: a session is in the project, not in the kit$/;
  for (const command of [
    'node scripts/rooms.mjs free <day> --floor <n>', 'node ./scripts/rooms.mjs free <day> --floor <n>', 'node <kit>/scripts/rooms.mjs free <day> --floor <n>',
    'node ../../scripts/rooms.mjs free <day> --floor <n>', 'node "scripts/rooms.mjs" free <day> --floor <n>',
    // Run another way, the kit's code is still the kit's: the one-line check a card gives is run from the kit, not from here.
    'node --input-type=module -e "import { validate } from \'./scripts/lib/walkthrough.mjs\';" <the absolute path of your file>',
  ]) only(withCommand(command), /^SKILL\.md: `node /, FORM);
  // A script is named with its .mjs: without it, the name is no file of the kit either.
  const [path, form, ...more] = withCommand('node <kit root>/scripts/rooms free <day> --floor <n>');
  assert.match(path, /names scripts\/rooms, which is not in the kit/);
  assert.match(form, FORM);
  assert.deepEqual(more, []);
  // A line of a code fence that is not a command is not held to anything: prose, or a comment.
  const notes = { 'references/free.md': '```\nEvery node in the tree is a room; see scripts/ for how.\n// node scripts/ are the kit\'s\n```\n' };
  assert.deepEqual(faults({}, notes), []);
  // A command stays on one line: carried on by a backslash, it is refused, once, and says why.
  const wrapped = { 'references/free.md': '```\nnode <kit root>/scripts/rooms.mjs free <day> \\\n  --floor <n>\n```\n' };
  only(faults({}, wrapped), /^references\/free\.md: `node <kit root>\/scripts\/rooms\.mjs free <day> \\` runs on to the next line, and a command stays on one line$/);
});

test('a command never passes what no skill passes, and a script with no usage holds no command', () => {
  only(withCommand('node <kit root>/scripts/rooms.mjs book <room> <hour> --for <patient> --endpoint <url>'), /passes --endpoint, which no skill does$/);
  only(withCommand('node <kit root>/scripts/rooms.mjs book <room> <hour> --for <patient> --endpoint=http://127.0.0.1:1'), /passes --endpoint, which/);
  only(withCommand('node <kit root>/scripts/desk.mjs staff <desk> two --seed 7'), /passes --seed, which no skill does$/);
  // A script that says nothing of how it is run cannot hold a command to anything.
  only(withCommand('node <kit root>/scripts/silent.mjs <plan.json>'), /cannot be checked: scripts\/silent\.mjs --help gives no usage$/);
  // In a reference too, and in a code fence.
  only(faults({}, { 'references/free.md': '```\nnode <kit root>/scripts/desk.mjs closed\n```\n' }), /^references\/free\.md: `node <kit root>\/scripts\/desk\.mjs closed` is not as/);
});

test('the product-name check matches whole words only, in every file of a skill', () => {
  for (const text of ['Verbato', 'verbato', 'VERBATO', 'in Verbato.', 'Versa', 'Versa Studio', '(Versa)']) assert.ok(named(text), text);
  for (const text of ['a conversation', 'universal', 'vice versa', 'versa', 'Versailles', 'conVersa', 'verbatoes', 'verbatim']) assert.ok(!named(text), text);
  only(withStep('As in Verbato.'), /^SKILL\.md: names a product, and the kit is generic$/);
  only(faults({}, { 'references/free.md': `${REFERENCE}Versa Studio.\n` }), /^references\/free\.md: names a product/);
  assert.deepEqual(withStep('Copy her words verbatim, and vice versa.'), []);
});

test('every fault of a skill is reported', () => {
  const found = skillFaults(ROOMS, {
    'SKILL.md': skillText({ name: 'room', description: 'Use when she asks.', opening: 'No word of the kit.', sections: [GOOD[1], GOOD[0], ...GOOD.slice(2, 5)] }),
    'references/free.md': 'In Verbato, run `node scripts/desk.mjs closed <desk>` and read `pool/NOWHERE.md`.',
  }, SAMPLE_KIT);
  const expected = [
    /^SKILL\.md: header: name is "room"/, /^SKILL\.md: header: the description is not the one/, /^SKILL\.md: header: the description is written in double quotes/,
    /^SKILL\.md: "## Never" is missing$/, /^SKILL\.md: it says where the kit's root is/,
    /^references\/free\.md: names pool\/NOWHERE\.md/, /^references\/free\.md: `node scripts\/desk\.mjs closed <desk>` runs a script of the kit, which is written/, /^references\/free\.md: names a product/,
  ];
  assert.equal(found.length, expected.length, found.join('\n'));
  for (const [i, pattern] of expected.entries()) assert.match(found[i], pattern);
});

// ---- the kit as it is

const usageOf = new Map();
const KIT = Object.freeze({
  exists: path => existsSync(at(path)),
  // What the script prints for --help, or null when it is not there or prints none.
  usage(script) {
    if (!usageOf.has(script)) {
      const run = existsSync(at(script)) ? spawnSync(process.execPath, [fileURLToPath(at(script)), '--help'], { encoding: 'utf8' }) : null;
      usageOf.set(script, run?.status === 0 ? run.stdout : null);
    }
    return usageOf.get(script);
  },
});
// Every file under a folder of the kit, by its path from that folder, sorted; none when it is not there.
const filesUnder = (folder, inside = '') =>
  (existsSync(at(`${folder}${inside}`)) ? readdirSync(at(`${folder}${inside}`), { withFileTypes: true }) : [])
    .flatMap(entry => (entry.isDirectory() ? filesUnder(folder, `${inside}${entry.name}/`) : [`${inside}${entry.name}`]))
    .sort();
// One skill's folder, as the rules read it.
const folderOf = name => Object.fromEntries(filesUnder(`skills/${name}/`).map(file => [file, read(`skills/${name}/${file}`)]));

test('the table holds the eleven skills: the conductor, setup, and one for each stage in the pipeline\'s order', () => {
  assert.deepEqual(SKILLS.map(skill => skill.name), ['design', 'setup', ...STAGES]);
  assert.deepEqual(SKILLS.filter(skill => skill.stage).map(skill => skill.name), STAGES);
  // Setup is no stage and has the six sections too; the conductor alone has sections of its own.
  assert.deepEqual(SKILLS.filter(skill => skill.sections).map(skill => skill.name), ['setup']);
  assert.deepEqual(SKILLS.filter(skill => !skill.stage && !skill.sections).map(skill => skill.name), ['design']);
  for (const { name, description, waits } of SKILLS) {
    assert.match(description, /^Use when .+\.$/, name);
    // It is written in double quotes, so it holds none.
    assert.ok(!description.includes('"'), name);
    assert.equal(description, description.trim(), name);
    if (waits !== undefined) assert.match(waits, /^Task 1[4-8]$/, name);
  }
  assert.equal(new Set(SKILLS.map(skill => skill.description)).size, 11);
});

test('the usage of each script the conductor runs is read: the form it gives is taken, and a wrong one is not', () => {
  // Whether a script takes these words after its name, by any form of its usage. How many forms it has, and
  // which flags it may also take, are the script's own business.
  const takes = (script, given) => formsOf(KIT.usage(`scripts/${script}.mjs`)).some(form => mismatch(words(given), specOf(form)) === null);
  const verbs = formsOf(KIT.usage('scripts/state.mjs')).map(form => words(form)[0]);
  for (const verb of ['init', 'begin', 'await', 'stamp', 'reopen', 'route', 'resize', 'validate', 'next', 'status', 'slug']) assert.ok(verbs.includes(verb), `state.mjs ${verb}`);
  for (const [script, right, wrong] of [
    ['state', 'validate <package>', 'valdate <package>'],
    ['state', 'stamp <package> <stage> --words "<the founder\'s words>"', 'stamp <package> <stage>'],
    ['state', 'route <package> <stage> <full|short|skipped> --reason "<why>"', 'route <package> <stage> half --reason "<why>"'],
    ['merge', '<proposals dir> --out <board dir>', '<proposals dir>'],
    ['merge', 'open <board dir>', 'open'],
    ['render', '<board dir>/A.json --kit <kit dir> --out <board dir>/A.html --letter A', '<board dir>/A.json --out <board dir>/A.html --letter A'],
    ['shots', '<board dir> --out <board dir> --widths <w,w...>', '<board dir> --out <board dir>'],
    ['page', '<decision.json> --out <decision.html>', '<decision.json> --output <decision.html>'],
    ['describe', '--provider <openai|gemini> --model <id> --brief <file> --out <file.json> --profile <PROFILE.md>', '--provider <openai|gemini> --model <id> --brief <file> --out <file.json>'],
    // With --text it is a form of its own: the switch takes no value.
    ['describe', '--text --provider <openai|gemini> --model <id> --brief <file> --out <file.txt> --profile <PROFILE.md>', '--text=yes --provider <openai|gemini> --model <id> --brief <file> --out <file.txt> --profile <PROFILE.md>'],
  ]) {
    assert.ok(takes(script, right), `${script}.mjs takes: ${right}`);
    assert.ok(!takes(script, wrong), `${script}.mjs does not take: ${wrong}`);
  }
  // What no skill passes is something a script takes: the rule refuses something real.
  assert.ok(takes('describe', '--provider <openai|gemini> --model <id> --brief <file> --out <file.json> --profile <PROFILE.md> --endpoint <url>'));
  assert.ok(takes('merge', '<proposals dir> --out <board dir> --seed 7'));
  assert.equal(KIT.usage('scripts/nowhere.mjs'), null);
});

for (const skill of SKILLS) {
  const title = `the ${skill.name} skill keeps every rule of a skill`;
  if (skill.waits) test(`${title} (${skill.waits} writes it)`, { todo: `${skill.waits} writes skills/${skill.name}/SKILL.md` });
  else test(title, () => assert.deepEqual(skillFaults(skill, folderOf(skill.name), KIT), []));
}

test('a skill that waits for its task is not written yet, and skills/ holds no skill but the eleven', () => {
  for (const { name, waits } of SKILLS) {
    if (waits) assert.ok(!existsSync(at(`skills/${name}/SKILL.md`)), `skills/${name}/SKILL.md is written: take its "waits" out of the table, so that it is held to the rules`);
  }
  const folders = readdirSync(at('skills/'), { withFileTypes: true });
  assert.deepEqual(folders.filter(entry => !entry.isDirectory()).map(entry => entry.name), [], 'skills/ holds folders only');
  assert.deepEqual(folders.map(entry => entry.name).filter(name => !SKILLS.some(skill => skill.name === name)), [], 'a folder of skills/ that is not one of the eleven');
});

test('no product name appears in any file under skills/', () => {
  const files = filesUnder('skills/');
  assert.ok(files.includes('design/SKILL.md') && files.includes('design/references/loop.md'), 'the files of the conductor are read');
  for (const file of files) assert.ok(!named(read(`skills/${file}`)), `skills/${file} names a product`);
});

// ---- the conductor: what skills/design was written to say

const CONDUCTOR_SECTIONS = ['The order', 'Before a stage', 'The loop', 'Resuming', 'Never'];
const REFERENCES = ['blind.md', 'fresh-pass.md', 'lessons.md', 'loop.md', 'routes.md'];
const conductor = () => read('skills/design/SKILL.md');
const reference = name => read(`skills/design/references/${name}`);
// Every command the conductor and its references give, as written.
const conductorCommands = () => Object.values(folderOf('design')).flatMap(commandsOf);
// When a project is setup's: the conductor and setup say it in the same words.
const UNREVIEWED = 'no project profile, or one whose `## Reviewed by the founder` section is missing or holds none of his words';
// The numbered steps of a text that open with a name in bold: each name, in order.
const boldSteps = text => text.split('\n').map(line => /^(\d+)\. \*\*(.+?)\*\*/.exec(line)).filter(Boolean).map(([, n, name]) => [Number(n), name.replace(/\.$/, '')]);
// A Markdown table row as its cells.
const cells = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
const tableRows = text => text.split('\n').filter(line => line.startsWith('|')).map(cells);
const unspan = cell => cell.replace(/^`(.*)`$/, '$1');
// Each pattern is found, in the order given.
const inOrder = (text, patterns, what) => {
  let from = 0;
  for (const pattern of patterns) {
    const found = text.slice(from).search(pattern);
    assert.notEqual(found, -1, `${what}: ${pattern} is missing, or out of its place`);
    from += found + 1;
  }
};

test('the conductor has its five sections, and its five references, each pointed to from SKILL.md', () => {
  assert.deepEqual(headings(conductor()), CONDUCTOR_SECTIONS);
  assert.deepEqual(filesUnder('skills/design/'), ['SKILL.md', ...REFERENCES.map(name => `references/${name}`)]);
  for (const name of REFERENCES) assert.ok(ownReferences(conductor()).includes(`references/${name}`), `SKILL.md points to references/${name}`);
  // The kit's root is where the sentence says it is.
  assert.equal(new URL('../../', at('skills/design/')).href, root.href);
});

test('the conductor gives the nine stages in order, each with the skill to invoke, and setup first when the project has no project profile or one the founder never reviewed', () => {
  const { name: plugin } = JSON.parse(read('.claude-plugin/plugin.json'));
  const order = section(conductor(), 'The order');
  const rows = tableRows(order).filter(row => /^\d+$/.test(row[0]));
  assert.deepEqual(rows.map(row => Number(row[0])), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(rows.map(row => row[1].toLowerCase()), STAGES);
  assert.deepEqual(rows.map(row => unspan(row[2])), STAGES.map(stage => `${plugin}:${stage}`));
  // Each stage's output is the file the state script stamps.
  assert.deepEqual(rows.map(row => unspan(row[4])), STAGES.map(stage => ARTEFACT[stage]));
  const before = flat(order.slice(0, order.indexOf('\n|')));
  // A setup that stopped halfway leaves a project profile behind: the founder's review, not the file, says
  // that a project is set up.
  assert.ok(
    before.includes(`When the project has ${UNREVIEWED}, invoke \`${plugin}:setup\` first`),
    'setup first, when the project has no project profile, or one he never reviewed',
  );
  // "Empty" alone let two cases through to Frame: a heading that is not there, and a line a session put under it.
  assert.doesNotMatch(flat(conductor()), /section is empty/);
  assert.equal(headings(parse(read('templates/project/PROFILE.md')).body).at(-1), 'Reviewed by the founder', 'the section is the template\'s, and its last');
  assert.match(flat(order), /with the Skill tool/);
  assert.match(flat(order), /structure is chosen before look/i);
});

test('before any stage the conductor validates the package and asks what is next, and a stale or changed artefact goes to the founder first', () => {
  const before = section(conductor(), 'Before a stage');
  const fenced = linesOf(before).filter(({ fenced: inside }) => inside).map(({ line }) => line.trim());
  assert.deepEqual(fenced.slice(0, 2), ['node <kit root>/scripts/state.mjs validate <package>', 'node <kit root>/scripts/state.mjs next <package>']);
  assert.match(flat(before), /A stale or changed artefact is reported to the founder before anything else/);
  // The two words the state script says them with.
  for (const code of ['stale-input', 'changed-since-approval']) {
    assert.ok(read('scripts/lib/state.mjs').includes(`'${code}'`), `the state script reports ${code}`);
    assert.ok(before.includes(`\`${code}\``), `Before a stage names ${code}`);
  }
  assert.match(flat(before), /`<stage>: <code>: <message>`/);
  assert.match(flat(before), /`node <kit root>\/scripts\/state\.mjs status <package>`/);
});

test('the conductor opens with the words it uses, and tells the project profile from a profession\'s profile', () => {
  const opening = conductor().slice(0, conductor().indexOf('\n## '));
  const defined = [...opening.matchAll(/\*\*([^*]+)\*\*/g)].map(([, word]) => word.toLowerCase());
  for (const word of ['package', 'stages', 'seat', 'card', 'the founder', 'the project profile', 'a profession\'s profile', 'carry list', 'board']) assert.ok(defined.includes(word), `${word} is defined`);
  assert.match(flat(opening), /\*\*The project profile\*\* is `PROFILE\.md`/);
  assert.match(flat(opening), /\*\*A profession's profile\*\* is a profile card/);
  assert.match(flat(opening), /No seat is ever handed the project profile/);
  // Everywhere in the conductor the word is one of the two, the name of a judge, or the flag of a script.
  for (const [file, text] of Object.entries(folderOf('design'))) {
    const rest = flat(text).replace(/project profile|profession's profile|profile judges?|profile card|--profile|PROFILE\.md/g, '');
    assert.doesNotMatch(rest, /profile/i, `${file}: "profile" alone says neither the project profile nor a profession's profile`);
  }
});

test('the conductor proposes no design and judges none, except, in a design sized correction, to apply it after the nod', () => {
  const opening = flat(conductor().slice(0, conductor().indexOf('\n## ')));
  const EXCEPT = /, except, in a design sized `correction`, to apply it after his nod \(`references\/routes\.md`\)/;
  assert.match(opening, new RegExp(`You propose no design and you judge none${EXCEPT.source}`));
  assert.match(flat(section(conductor(), 'Never')), new RegExp(`\\*\\*Never let one agent make and judge\\.\\*\\* A maker never judges, a judge never fixes what it found, and you do neither${EXCEPT.source}`));
  // The exception is a size of design, as the state script names it, and is said no wider anywhere.
  assert.ok(SIZES.includes('correction'));
  assert.doesNotMatch(flat(conductor()), /except to apply/);
  // The reference it points to says the same.
  assert.match(flat(section(reference('routes.md'), 'A correction')), /the one size where the session that conducts may also do the work/);
});

test('an awaiting stage is not begun again, and Frame makes the package before it begins', () => {
  const step = flat(section(reference('loop.md'), '1. Check the state'));
  assert.match(step, /Two stages are not begun this way/);
  assert.match(step, /Frame makes it first, with `init` \(`references\/routes\.md`\), and only then begins/);
  assert.match(step, /A stage that is awaiting the founder\.\*\* Its output is already in front of him, and `begin` would put it back in work and its header back to draft/);
  assert.match(step, /On his answer, go on from step 8, without `begin`/);
  assert.match(flat(section(conductor(), 'The loop')), /Then mark the stage in work, unless it is awaiting the founder/);
  assert.match(flat(section(conductor(), 'Resuming')), /On his answer, invoke that stage's skill and go on from step 8 of the loop\. An awaiting stage is not begun again/);
});

test('the three rules are stated as rules for the session', () => {
  const text = flat(conductor().slice(0, conductor().indexOf('\n## ')));
  inOrder(text, [/1\. \*\*The chat is not an input\.\*\*/, /2\. \*\*What the founder says is written into the artefact before it counts\.\*\*/, /3\. \*\*A stage is run, or the route says why it is not\.\*\*/], 'the three rules');
  assert.match(text, /Stages hold procedure, seats hold opinion, the project holds facts/);
});

test('the loop has nine steps in SKILL.md, and the same nine in full in references/loop.md', () => {
  const steps = boldSteps(section(conductor(), 'The loop'));
  assert.deepEqual(steps.map(([n]) => n), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const long = headings(reference('loop.md')).map(heading => /^(\d+)\. (.+)$/.exec(heading)).filter(Boolean).map(([, n, name]) => [Number(n), name]);
  assert.deepEqual(long, steps);
  assert.match(flat(section(conductor(), 'The loop')), /`references\/loop\.md`/);
});

test('the Never list holds what the session must never do', () => {
  const never = section(conductor(), 'Never').split('\n').filter(line => line.startsWith('- '));
  for (const line of never) assert.match(line, /^- \*\*Never [^*]+\.\*\*/, line);
  const said = never.map(line => /^- \*\*(Never [^*]+)\.\*\*/.exec(line)[1]);
  assert.deepEqual(said.slice(0, 7), [
    'Never decide for the founder',
    'Never shortlist, detail or draw finished before the gate that precedes it',
    'Never let one agent make and judge',
    'Never ask more than one question on a page',
    'Never open the sealed map before `PICK.md` exists',
    'Never put a key or a key file\'s path on a command line',
    'Never read `work/` as an input',
  ]);
  const text = flat(section(conductor(), 'Never'));
  for (const rule of [/Never paste a card or an artefact into a brief/, /Never average or settle a disagreement between seats/, /Never stop a process by name or by pattern/, /Never edit `state\.json` or `STATE\.md`/]) assert.match(text, rule);
  // Of an outside model, it passes the project profile and nothing about a key.
  assert.match(text, /finds (?:its|the) key itself/);
  assert.match(text, /`--profile`/);
  assert.match(text, /never pass `--endpoint`/i);
});

test('every command the conductor gives is one the kit takes, with each verb of the state script among them', () => {
  const commands = conductorCommands().filter(command => command !== 'node <kit root>/scripts/<name>.mjs');
  for (const command of commands) assert.match(command, /^node <kit root>\/scripts\/[a-z]+\.mjs(?: |$)/, command);
  const run = script => commands.filter(command => command.startsWith(`node <kit root>/scripts/${script}.mjs`)).map(command => words(command).slice(2));
  assert.deepEqual([...new Set(run('state').map(([verb]) => verb))].sort(), ['await', 'begin', 'init', 'next', 'reopen', 'resize', 'route', 'slug', 'stamp', 'status', 'validate']);
  for (const script of ['merge', 'render', 'shots', 'page', 'describe']) assert.ok(run(script).length >= 1, `scripts/${script}.mjs is given`);
  assert.ok(run('merge').some(([verb]) => verb === 'open'), 'the command that opens the map');
  // An outside model is run with the project profile, and nothing on the line says where a key is.
  for (const given of run('describe')) assert.ok(given.includes('--profile'), given.join(' '));
  for (const text of Object.values(folderOf('design'))) assert.doesNotMatch(text, /API_KEY|--keys?\b/, 'no key, and no way to one, in a command');
});

test('loop.md: one fix round and one re-read, the identity line, and the decision as one page with one question', () => {
  const loop = flat(reference('loop.md'));
  assert.match(loop, /\*\*One fix round and one re-read,\*\* and no more/);
  assert.match(loop, /What is still open goes to the founder with the gate, as open findings, with a recommendation/);
  assert.doesNotMatch(loop, /by default|second round/);
  assert.match(loop, /\*fixed\*, \*partly\* or \*still present\*/);
  assert.match(loop, /A fresh judge in the same seat reads the artefact again/);
  assert.match(loop, /open findings,? with a recommendation/);
  assert.match(loop, /design · kind · size · stage n of m/);
  assert.ok(commandsOf(reference('loop.md')).includes('node <kit root>/scripts/page.mjs <decision.json> --out <decision.html>'));
  assert.match(loop, /`templates\/outputs\/decision\.json`/);
  assert.match(loop, /the only question on (?:it|the page)/);
  assert.match(loop, /One question about one thing at a time/);
  // His answer is in the artefact, in his words, before the stamp; his notes are calibration.
  assert.match(loop, /`## Reviewed by the founder`/);
  assert.match(loop, /calibration, not orders/);
  assert.match(loop, /`DECISIONS\.md`/);
});

test('loop.md: a seat is a fresh sub-agent started from a brief that names files, on the model its line of the cast sheet names', () => {
  const loop = flat(reference('loop.md'));
  assert.match(loop, /Agent tool/);
  assert.match(loop, /`general-purpose`/);
  assert.match(loop, /from the project's root directory/);
  for (const brief of ['maker', 'judge', 'audience']) assert.match(loop, new RegExp(`\`templates/briefs/${brief}\\.md\``));
  assert.match(loop, /by its absolute path/);
  assert.match(loop, /never paste a card or an artefact into a brief/i);
  assert.match(loop, /context(?: only)?, never the design/);
  // Which briefs he reads before they go out is said one way, here, in SKILL.md and in fresh-pass.md.
  assert.match(loop, /The founder reads the Structure brief before it goes out, always, and every fresh brief, at Structure or at Look:\*\* either may leave the machine/);
  assert.match(loop, /At the other stages a seat's brief is built from approved artefacts, and he reads it when he asks/);
  assert.match(flat(section(conductor(), 'The loop')), /The founder reads the Structure brief, and every fresh brief, before it goes out/);
  assert.match(flat(reference('fresh-pass.md')), /The founder reads every fresh brief before it goes out, at Structure and at Look: it may leave the machine/);
  for (const text of Object.values(folderOf('design'))) assert.doesNotMatch(flat(text), /like any brief|At Structure, always/);
  // Model and effort are suggestions: the cast sheet is the founder's, a dash is the session's model.
  assert.match(loop, /the model and the effort its line of the approved cast sheet names/);
  assert.match(loop, /`templates\/package\/03-cast\.md`|`03-cast\.md`/);
  assert.match(loop, /suggestions/);
  assert.match(loop, /a dash[^.]*runs on the session's model/);
  assert.match(loop, /Nothing in the conductor enforces a model/);
});

test('loop.md: the two standing rules of a shared machine', () => {
  const loop = flat(reference('loop.md'));
  assert.match(loop, /stops only a browser it started itself, through its own handle/);
  assert.match(loop, /never stops a process by name or by pattern/);
  assert.match(loop, /never (?:have|has) more than three browser-driving seats or scripts running at once/);
  // Where "in one message" and the limit meet, the limit wins.
  assert.match(loop, /That limit wins over "in one message": seats that drive a browser are started three at a time, the others in one message/);
});

test('loop.md: several ledgers are laid side by side, and an audience is handed the traits of her profession\'s profile, never the whole of it', () => {
  const loop = flat(reference('loop.md'));
  assert.match(loop, /blind to the others' ledgers/);
  assert.match(loop, /side by side/);
  assert.match(loop, /in their own words/);
  assert.match(loop, /never average(?:s)? (?:them )?(?:or|nor) settles? a disagreement/i);
  assert.match(loop, /`So the interface must:`/);
  assert.match(loop, /beside the brief/);
  assert.match(loop, /"Do not open"/);
  assert.match(loop, /An audience is handed the traits of her profession's profile, never the whole of it/);
  assert.match(loop, /List her profession's profile itself under "Do not open", with the intent/);
  // What a seat is handed is what its brief template gives it: the maker's template gives a describer neither.
  assert.match(loop, /A seat is handed what its brief template gives it, and no more/);
  assert.match(loop, /Where that is a profession's profile, a maker or a judge is handed it whole, and an audience only its traits/);
  assert.match(loop, /A describer and a fresh maker are handed neither the person nor her profession's profile, unless the template says so/);
  assert.ok(flat(read('templates/briefs/maker.md')).includes('A describer and a fresh maker get neither of these two'));
  assert.doesNotMatch(loop, /Makers and judges are handed/);
  // The label is the profile template's own, and the audience's brief asks for that copy.
  assert.ok(read('templates/people/PROFILE-CARD.md').includes('So the interface must:'));
  assert.ok(flat(read('templates/briefs/audience.md')).includes('`So the interface must:` taken out'));
});

test('routes.md: the kinds, the foundations and the sizes, and each size\'s route as the state script sets it', () => {
  const routes = reference('routes.md');
  const firstCells = name => tableRows(section(routes, name)).map(row => unspan(row[0]));
  assert.deepEqual(firstCells('Kind').slice(2), KINDS);
  assert.deepEqual(firstCells('Foundation').slice(2), FOUNDATIONS);
  assert.deepEqual(firstCells('Size').slice(2), SIZES);
  // The route table: a row for each stage, a column for each size.
  const [head, , ...rows] = tableRows(section(routes, 'The route of each size'));
  assert.deepEqual(head.slice(1).map(unspan), SIZES);
  assert.deepEqual(rows.map(row => unspan(row[0])), STAGES);
  for (const [i, size] of SIZES.entries()) {
    assert.deepEqual(Object.fromEntries(rows.map(row => [unspan(row[0]), row[i + 1]])), routeFor(size), size);
  }
  const text = flat(routes);
  assert.match(text, /The size only moves up/);
  assert.match(text, /Nothing moves down mid-run/);
  assert.ok(commandsOf(routes).includes('node <kit root>/scripts/state.mjs resize <package> --size <size>'));
});

test('routes.md: a correction costs one nod, and the same session may apply it', () => {
  const text = flat(section(reference('routes.md'), 'A correction'));
  assert.match(text, /the same session may apply it/i);
  assert.match(text, /after (?:the|his) nod/);
  assert.match(text, /one-paragraph record/);
  assert.match(text, /before-and-after picture/);
  assert.match(text, /No (?:pool|seat)/);
  assert.match(text, /touch(?:es)? more[^.]*stop/);
});

test('blind.md: the map and the pick sit beside the board; a judge is handed the board folder, an audience the pictures only', () => {
  const blind = reference('blind.md');
  const text = flat(blind);
  assert.equal(`${MAP} ${PICK}`, 'MAP.sealed.json PICK.md');
  for (const path of [`04-structure/${MAP}`, `04-structure/${PICK}`, '04-structure/board/']) assert.ok(blind.includes(`\`${path}\``), path);
  assert.doesNotMatch(blind, /board\/(?:MAP|PICK)/);
  assert.match(text, /beside the board(?: folder)?, never (?:inside|in) it/);
  assert.match(text, /Of `04-structure\/`, a judge is handed the board folder and nothing else; an audience is handed the pictures only/);
  assert.doesNotMatch(text, /board folder only|nothing above it/);
  // An audience's own brief gives it pictures, and pictures only.
  assert.ok(flat(read('templates/briefs/audience.md')).includes('The pictures, and pictures only'));
  assert.match(text, /`Pick: <letter \| none>`/);
  assert.match(text, /never saved (?:there|in the board) as a one-letter `\.json`/);
  assert.match(text, /`templates\/outputs\/PICK\.md`/);
  assert.match(text, /`kit\/KIT-CONTRACT\.md`/);
});

test('blind.md: a brief gives context, never the design, and says what it may not contain', () => {
  const brief = section(reference('blind.md'), 'Context, never the design');
  assert.match(flat(brief), /context, never the design/i);
  const banned = brief.split('\n').filter(line => /^- \*\*/.test(line)).map(line => /^- \*\*(.+?)\.?\*\*/.exec(line)[1].toLowerCase());
  assert.deepEqual(banned, ['component names', 'layout words', 'named visual styles', 'colours and fonts', 'the session\'s own idea']);
  assert.match(flat(brief), /`templates\/package\/04-structure\/BRIEF\.md`/);
});

test('blind.md: the order, from the brief to the map', () => {
  const order = section(reference('blind.md'), 'The order');
  const steps = boldSteps(order);
  assert.deepEqual(steps.map(([n]) => n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(steps.map(([, name]) => name), ['The brief', 'The founder reads it', 'The makers', 'The merge', 'The render', 'The shots', 'The readers', 'The decision page', 'The pick', '`PICK.md`', 'The map may be opened']);
  const commands = commandsOf(order);
  inOrder(commands.join('\n'), [/scripts\/describe\.mjs --provider/, /scripts\/merge\.mjs <proposals dir> --out <board dir>$/m, /scripts\/render\.mjs /, /scripts\/shots\.mjs /, /scripts\/page\.mjs /, /scripts\/merge\.mjs open <board dir>$/m], 'the commands of the order');
  // The readers of step 7 are handed the board, and told what beside it they do not open.
  const readers = flat(order.slice(order.indexOf('7. **The readers.**'), order.indexOf('8. **The decision page.**')));
  assert.match(readers, /Of `04-structure\/`, a judge is handed the board folder and nothing else: its letters, pages and pictures\. An audience is handed the pictures only, each by its path/);
  assert.match(readers, /What else a seat's brief template lists comes from the approved stages/);
  assert.match(readers, /list four things under "Do not open": the package's `work\/` folder, where the makers' briefs are, the map, the pick and the proposals folder/);
  // The kit every letter is drawn in is the project's kit folder, in the rule and in the step.
  assert.match(flat(order), /`<kit dir>` is always the project's kit folder, the one the project profile names/);
  // The rules of the table, as rules.
  const rules = flat(section(reference('blind.md'), 'The rules'));
  for (const rule of [/one shared kit/, /grey kit/, /the founder reads it first/, /(?:do not|never) see each other/, /continuity maker/, /by letter/, /Nothing is (?:shortlisted|detailed)/, /sealed/, /Of `04-structure\/`, a judge is handed the board folder and nothing else; an audience is handed the pictures only/]) assert.match(rules, rule);
  // What a judge is handed from outside the board is its brief template's to say, and the loop's.
  assert.match(rules, /What else a seat's brief template lists comes from the approved stages, as `references\/loop\.md` says/);
  assert.match(flat(reference('loop.md')), /A seat is handed what its brief template gives it, and no more/);
  assert.match(rules, /the project's kit folder, the one the project profile names\. Setup writes it in every project, and where the project has no design system it holds the grey kit \(`kit\/grey\/`\) unchanged/);
});

test('blind.md: what the board holds, and what never goes in it; a fresh concept reaches it only as a letter', () => {
  const sealed = flat(section(reference('blind.md'), 'What stays sealed, and what stays out of the board'));
  assert.match(sealed, /\*\*The board holds four things:\*\* the letters' files, the drawn pages, the kit's stylesheets that the render copies beside them, and the pictures/);
  assert.match(sealed, /\*\*Three things never go in the board:\*\* the decision page and its `decision\.json`; anything of a fresh pass as it came, its screens and its gallery; anything from `work\/`/);
  assert.match(sealed, /A fresh concept reaches the board only as its structure written into the walkthrough format, through the merge, like any other letter/);
  assert.match(sealed, /never saved there as a one-letter `\.json`/);
  // The two references agree: fresh-pass.md puts the concept's structure on the board, and every valid proposal reaches it.
  assert.match(flat(reference('fresh-pass.md')), /written into the walkthrough format, drawn in the shared kit, and joins the blind board as one more letter/);
  assert.match(flat(section(reference('blind.md'), 'The rules')), /Every valid proposal reaches the board/);
  assert.doesNotMatch(flat(reference('blind.md')), /anything of a fresh pass, its gallery|and nothing else\.\*\*/);
});

test('blind.md: nothing is deleted; a rejected round moves whole into earlier/, and nothing there is an input', () => {
  const sealed = flat(section(reference('blind.md'), 'What stays sealed, and what stays out of the board'));
  assert.match(sealed, /a board is never deleted/);
  assert.match(sealed, /the merge refuses while a map or a pick lies beside the board folder/);
  assert.match(sealed, /What is set aside is moved, into `04-structure\/earlier\/<n>\/`: `1` the first time, `2` the next/);
  assert.match(sealed, /Where the script's refusal says to delete, move/);
  // Not to a stage, and not to a seat: the lessons may read it, and both references say so in the same words.
  const EARLIER = /Nothing in `earlier\/` is ever an input to a stage or a seat/;
  assert.match(sealed, EARLIER);
  assert.match(sealed, /A lessons entry may read it, since what was set aside and why is part of what a design taught/);
  const lessons = flat(reference('lessons.md'));
  assert.match(lessons, EARLIER);
  assert.match(lessons, /Where a round was set aside, it lies in `04-structure\/earlier\/`/);
  assert.match(lessons, /but a lessons entry may read it, since what was set aside and why is part of what a design taught/);
  for (const text of Object.values(folderOf('design'))) assert.doesNotMatch(flat(text), /is ever an input(?! to a stage or a seat)/);
  // A round he rejected: everything, the proposals among it, so that the next merge does not deal them again.
  assert.match(sealed, /\*\*A round he rejected moves whole\.\*\* When he picks none and Intent or Context is reopened, everything in `04-structure\/` other than `earlier\/` is moved together, before the new round starts: the briefs, the proposals folder, the board, the map, the pick, the pictures, the reads, the decision page/);
  assert.match(sealed, /Intent or Context is reopened, and the round moves whole/);
  // A board made again within a round: the board, its map and its pick, and what was written about its letters.
  assert.match(sealed, /\*\*A board made again within a round\*\* \(a proposal arrived late\) moves with its map and its pick, and with what was written about its letters, the reads and the decision page/);
  assert.doesNotMatch(flat(reference('blind.md')), /deleted on purpose/);
});

test('fresh-pass.md: offered, what a fresh maker is and is not given, shown twice at Structure, and three outcomes only', () => {
  const fresh = reference('fresh-pass.md');
  const text = flat(fresh);
  assert.match(text, /Offered, not automatic/);
  assert.match(text, /does not run at Detail|never runs at Detail/);
  // What is given, by the form of the brief: what both forms hold, and what each adds.
  const given = Object.fromEntries([...fresh.matchAll(/^- \*\*((?:Given|Not given)[^*]*):\*\* ([^]*?)(?=\n- \*\*|\n\n)/gm)].map(([, label, list]) => [label, flat(list)]));
  assert.deepEqual(Object.keys(given), ['Given, in both forms', 'Given at Structure, besides', 'Given at Look, besides', 'Not given, in either form']);
  for (const part of [/the person and her moment/, /the job/, /the tasks/, /the language/, /the device/, /what the product can show and do/]) assert.match(given['Given, in both forms'], part);
  assert.match(given['Given at Structure, besides'], /the hardest state/);
  assert.match(given['Given at Look, besides'], /the one screen to draw, its state, and its approved items in order, with their words exactly as approved/);
  for (const held of [/the design system/, /the shared kit/, /today's screens and navigation/, /sibling surfaces/]) assert.match(given['Not given, in either form'], held);
  // The two forms are the template's own: each addition is a section of it.
  const template = read('templates/package/04-structure/BRIEF-fresh.md');
  for (const heading of ['The hardest state', 'The one screen']) assert.ok(headings(template).includes(heading), `BRIEF-fresh.md: ## ${heading}`);
  for (const label of ['**The screen:**', '**Its state:**', '**Its items, in order, with their words:**']) assert.ok(template.includes(label), label);
  assert.match(text, /no knowledge of form, not of what the product does/);
  assert.match(text, /one or two screens that carry the idea, never the whole flow/);
  assert.match(text, /The pick is made on the board/);
  assert.match(text, /gallery/);
  assert.match(text, /carried to Look/);
  assert.deepEqual(boldSteps(section(fresh, 'Three outcomes, and only three')), [[1, 'Nothing to borrow'], [2, 'Borrow named things'], [3, 'The fresh concept wins as a whole']]);
  assert.match(text, /named extension of the system/);
  assert.match(text, /`PARTS\.md`/);
  assert.match(text, /Never is a fresh screen handed off as it came/);
  assert.match(text, /`templates\/package\/04-structure\/BRIEF-fresh\.md`/);
});

test('lessons.md: two files, both appended, the entry\'s shape, and the seats whose findings changed a decision', () => {
  const lessons = reference('lessons.md');
  const text = flat(lessons);
  assert.match(text, /Two files, both appended, never rewritten/);
  assert.match(text, /which seats' findings changed a decision, and the model each ran on/);
  assert.match(text, /`templates\/project\/LESSONS\.md`/);
  // The entry has the template's own labels, in its order, and the template's table.
  const template = read('templates/project/LESSONS.md');
  const labels = [...template.matchAll(/^\*\*(.+?)\.\*\*/gm)].map(([, label]) => label);
  assert.equal(labels.length, 6);
  assert.deepEqual([...lessons.matchAll(/^- \*\*(.+?)\.\*\*/gm)].map(([, label]) => label), labels);
  const table = template.split('\n').find(line => line.startsWith('| Seat |'));
  assert.ok(lessons.includes(table), 'the table of the seats, as the template has it');
  // The kit's own file is proposed to the founder, never written by the session.
  assert.match(text, /only what is true of the process on any project/);
  assert.match(text, /propose/);
  assert.match(text, /by an ordinary change/);
});

// ---- setup: what skills/setup was written to say

const setup = () => read('skills/setup/SKILL.md');
const projectKit = () => read('skills/setup/references/project-kit.md');
// Every command setup and its reference give, as written, but the one in the sentence about the kit's root.
const setupCommands = () => Object.values(folderOf('setup')).flatMap(commandsOf).filter(command => command !== 'node <kit root>/scripts/<name>.mjs');
const setupRuns = script => setupCommands().filter(command => command.startsWith(`node <kit root>/scripts/${script}.mjs `));
// The header keys of the project profile, as its template has them.
const profileKeys = () => Object.keys(parse(read('templates/project/PROFILE.md')).data);
const spansOf = text => [...text.matchAll(/`([^`\n]+)`/g)].map(([, span]) => span);
// The rows of every table of a text, wherever it is indented.
const rowsOf = text => text.split('\n').map(line => line.trim()).filter(line => line.startsWith('|')).map(cells);

test('setup has the six sections and its one reference, pointed to from SKILL.md, and asks the question its brief gives', () => {
  assert.deepEqual(headings(setup()), STAGE_SECTIONS);
  assert.deepEqual(filesUnder('skills/setup/'), ['SKILL.md', 'references/project-kit.md']);
  assert.ok(ownReferences(setup()).includes('references/project-kit.md'), 'SKILL.md points to references/project-kit.md');
  assert.equal(new URL('../../', at('skills/setup/')).href, root.href);
  assert.equal(section(setup(), 'Question').trim(), 'What must be true of this project before its first design?');
  // It is run once for a project, by the conductor, in the conductor's words.
  const opening = flat(setup().slice(0, setup().indexOf('\n## ')));
  assert.match(opening, /once, before its first design/);
  assert.ok(opening.includes(`The conductor (\`ux:design\`) sends you here when a project has ${UNREVIEWED}.`), 'the conductor\'s own words for it');
  assert.ok(flat(conductor()).includes(UNREVIEWED), 'the same words in the conductor');
  assert.match(opening, /Run it from the project's root\. `<packages>` is the folder that holds the project's packages: `design` at the project's root, unless the founder names another/);
  assert.match(opening, /`<scratch>` is a folder you make outside the project/);
});

test('setup reads the project and the files of the kit it fills, and writes the profile, the lessons, the kit and the five pool folders', () => {
  const reads = section(setup(), 'Reads');
  for (const path of ['templates/project/PROFILE.md', 'templates/project/LESSONS.md', 'templates/people/PROFILE-CARD.md', 'kit/KIT-CONTRACT.md', 'kit/grey', 'pool/INDEX.md', 'pool/CARD-FORMAT.md']) {
    assert.ok(kitPaths(reads).includes(path), `Reads names ${path}`);
  }
  assert.match(flat(reads), /the token files, the component source, its documents/);
  assert.match(flat(reads), /\*\*Never\*\* a keys file, and never the environment\. A dotenv file, or any file of credentials, that you meet while reading the project is passed over, unopened/);
  const writes = flat(section(setup(), 'Writes'));
  for (const path of ['<packages>/PROFILE.md', '<packages>/LESSONS.md', '<packages>/kit/', '<packages>/pool/', '<packages>/pool/profiles/<name>.md', 'kit.css', 'parts.html', 'profiles/', 'persons/', 'makers/', 'judges/', 'audiences/']) {
    assert.ok(writes.includes(`\`${path}\``), `Writes names ${path}`);
  }
  // What is not an output of setup is written outside the project.
  assert.match(writes, /goes in `<scratch>`: never in the project/);
  // No path of the project is written as a path of the kit: each is from <packages> or <scratch>.
  for (const [file, text] of Object.entries(folderOf('setup'))) {
    assert.doesNotMatch(text, /(?<![\w<>/.-])design\/(?:PROFILE|LESSONS|kit|pool)/, `${file}: a path of the project is written from <packages>`);
  }
});

test('setup\'s steps come in the order of its brief: read, the profile, the questions, the kit, the stubs, the engine check', () => {
  assert.deepEqual(boldSteps(section(setup(), 'Steps')), [
    [1, 'See whether setup is due'],
    [2, 'Read the project'],
    [3, 'Start the project profile'],
    [4, 'Ask the founder what you could not read'],
    [5, 'Build the project kit'],
    [6, 'Make the project\'s pool'],
    [7, 'Check the engines, and record what each said'],
    [8, 'Write the lessons file'],
  ]);
  const steps = flat(section(setup(), 'Steps'));
  // A design system is read, never invented; a project without one says so.
  assert.match(steps, /Find its design system: the token files, the folder of the component source, its documents/);
  assert.match(steps, /you never guess a path or a fact/);
  assert.match(steps, /\*\*When the project has no design system, say so\.\*\* `tokens` and `components` stay empty, "Design system" says "None yet", the project kit is the grey kit as it is, and Look will run once as a direction/);
  assert.ok(flat(read('templates/project/PROFILE.md')).includes('"None yet" while there is none'), 'the template\'s own words for it');
  // A setup that was left unfinished is picked up, and a finished one is not run again.
  assert.match(steps, /It is due when `<packages>\/PROFILE\.md` is missing, and when its `## Reviewed by the founder` section is missing or holds none of his words: no such heading, or under it nothing, the template's instruction, or a line that is not his/);
  assert.match(steps, /With his words there, the project is set up: say so, and stop/);
  assert.match(steps, /Without them, a setup was left unfinished: go on from the first step whose output is missing/);
  // Where the packages go is asked before anything is written there.
  const start = steps.slice(steps.indexOf('3. **Start the project profile.**'), steps.indexOf('4. **Ask the founder'));
  inOrder(start, [/First, where it goes: if `design` at the project's root already holds something else, ask him where the packages go before you write anything/, /Then copy `templates\/project\/PROFILE\.md` to `<packages>\/PROFILE\.md`/], 'step 3');
  // With no design system the kit is still drawn and pictured: the gate shows the pictures.
  assert.match(steps, /With no design system: the copy, then the drawing and the pictures\./);
  assert.match(flat(projectKit()), /\*\*A project with no design system gets the grey kit as it is:\*\* the copy, then the drawing and the pictures, which are step 1 and steps 5 and 6/);
});

test('setup asks only what it could not read, one question at a time, and an answer counts once it is in the project profile', () => {
  const steps = flat(section(setup(), 'Steps'));
  assert.match(steps, /One question at a time, each about one thing/);
  assert.match(steps, /Write each answer into the project profile, in his words, before the next question: until it is written there, it does not count/);
  assert.match(steps, /Skip a question the project has already answered/);
  inOrder(steps, [
    /1\. The product in one sentence/, /2\. The languages it ships/, /3\. His standing rules for interfaces/, /4\. The professions it serves/,
    /5\. Whether a brief may be sent to an outside text model/, /6\. Only when the session lists a screen generator among its tools/,
  ], 'the questions');
  assert.match(flat(section(setup(), 'Never')), /\*\*Never ask two things at once,\*\* and never ask what the project already says/);
  // Each answer has its place. The languages are written as codes, which his words do not give; the
  // professions are written as their stubs, at once.
  assert.match(steps, /He names them; you write their codes as `languages`, as `\[es, en\]`, and show him the line/);
  assert.ok(read('templates/project/PROFILE.md').includes('as `[es, en]`'), 'the template\'s own example of the codes');
  assert.match(steps, /Each one he names gets its stub at once, written from the template as step 6 says: the stubs are where this answer lives/);
  assert.match(steps, /When he names none, no stub is written/);
  // The product's name, for the two titles, has a source.
  assert.match(steps, /Its title and the project profile's take the product's name from his sentence under `product`; when that sentence names none, ask him/);
  for (const file of ['PROFILE.md', 'LESSONS.md']) assert.match(read(`templates/project/${file}`), /^# \w+ · \{the product's name\}$/m, `${file}: its title holds the product's name`);
});

test('a key of the project profile that setup names is a key of the template, and the ones it fills by asking are all named', () => {
  const keys = profileKeys();
  for (const key of ['product', 'packages', 'kit', 'tokens', 'components', 'facts', 'languages', 'strings-format', 'browser-check', 'decisions-log', 'engines-on', 'openai-model', 'gemini-model', 'keys-file']) {
    assert.ok(keys.includes(key), `${key} is a key of the template`);
    assert.ok(spansOf(setup()).includes(key), `SKILL.md names ${key}`);
  }
  // A code span of lower-case words is a key of the template, a class of the kit, or one of these words.
  const OTHER = ['design', 'engine', 'own', 'guess', 'answers', 'installed', 'listed', 'missing', 'off'];
  for (const [file, text] of Object.entries(folderOf('setup'))) {
    const wordy = spansOf(text).filter(span => /^[a-z]+(?:-[a-z]+)*$/.test(span) && !span.startsWith('ux-'));
    assert.deepEqual(wordy.filter(span => !keys.includes(span) && !OTHER.includes(span)), [], `${file}: a span that reads as a key of the project profile, and is none`);
  }
  // The sections of the profile it names are the template's.
  const sections = headings(parse(read('templates/project/PROFILE.md')).body);
  for (const name of ['Standing rules', 'Design system']) {
    assert.ok(sections.includes(name), `${name} is a section of the template`);
    assert.ok(flat(setup()).includes(`"${name}"`), `SKILL.md names "${name}"`);
  }
  // The engine check and the founder's review are sections of the template too: setup fills them, and adds none.
  for (const name of ['Engine check', 'Reviewed by the founder']) {
    assert.ok(sections.includes(name), `${name} is a section of the template`);
    assert.ok(setup().includes(`\`## ${name}\``), `SKILL.md names ## ${name}`);
  }
  assert.deepEqual(sections.slice(-2), ['Engine check', 'Reviewed by the founder']);
  assert.match(flat(section(setup(), 'Writes')), /The engine check, and his review \| the last two sections of the project profile/);
  assert.match(flat(setup()), /Keep every key of the header and every heading/);
  for (const adds of [/after the template's sections/, /as the last section/]) assert.doesNotMatch(flat(setup()), adds, 'setup adds no section to the project profile');
});

test('an outside engine is the founder\'s to turn on: setup writes it only on his yes, in its card\'s spelling, with the model id he gives', () => {
  const steps = flat(section(setup(), 'Steps'));
  assert.match(steps, /Say what a yes means: the brief leaves this machine/);
  assert.match(steps, /\*\*Only on his yes\*\*, ask which provider, and add it to `engines-on` in its card's spelling: `model:openai`, `model:gemini`/);
  assert.match(steps, /ask the model's id, and write it as he gives it: `openai-model`, `gemini-model`/);
  assert.match(steps, /On his yes, add `tool:stitch` to `engines-on`/);
  assert.match(steps, /Three things wait for him: `engines-on` stays `\[\]` until his yes; `keys-file` stays empty until he gives a path, and a credentials file you came across while reading the project is never opened and never written here; and the last section, `## Reviewed by the founder`, stays empty until the gate/);
  // The rule for an instruction nobody can answer would put a line of the session's under his heading.
  inOrder(steps, [/an instruction in braces you cannot answer becomes "Not known yet\."/, /stays empty until the gate: the rule for an instruction you cannot answer does not apply to it, and nothing is written there before his words/], 'step 3');
  // The spellings are the card format's own, and the template's.
  for (const text of [read('pool/CARD-FORMAT.md'), read('templates/project/PROFILE.md')]) assert.ok(text.includes('`model:openai`, `model:gemini`, `tool:stitch`'));
  // The keys file is a path he gives, and the path is all setup has to do with it.
  assert.match(steps, /a dotenv file outside the repository; if in a file, he gives its path, and you write the path as `keys-file` and do nothing else with it/);
  assert.match(steps, /A path inside the repository is not taken: say so, and ask him for one outside it\. Comparing two paths opens nothing/);
  assert.match(read('templates/project/PROFILE.md'), /dotenv file \*\*outside the repository\*\*/, 'the template asks for one outside');
  assert.match(flat(section(setup(), 'Never')), /\*\*Never turn an engine on yourself\.\*\* `engines-on` holds what the founder said yes to, in his own answer, and nothing else\./);
});

test('the engine check covers every engine a card of the kit names, each its own way, and is recorded in the project profile', () => {
  const steps = section(setup(), 'Steps');
  const check = flat(steps.slice(steps.indexOf('7. **Check the engines')));
  // The engines the kit's cards name today, a skill by its kind.
  const engines = ['makers', 'judges', 'audiences'].flatMap(shelf => filesUnder(`pool/${shelf}/`).map(file => parse(read(`pool/${shelf}/${file}`)).data.engine));
  assert.deepEqual([...new Set(engines.map(engine => engine.replace(/^skill:.+$/, 'skill:<name>')))].sort(), ['model:any', 'own', 'skill:<name>', 'tool:stitch']);
  assert.match(check, /Read the `engine` line of every card in the kit's `pool\/makers\/`, `pool\/judges\/` and `pool\/audiences\/`/);
  assert.match(check, /An engine that is `own` needs no check/);
  for (const engine of ['skill:<name>', 'model:any', 'tool:stitch']) assert.ok(check.includes(`- **\`${engine}\`.**`), `the check for ${engine}`);
  assert.match(check, /- \*\*A browser,\*\*/);
  // A skill is looked for, never run; a tool is looked for, and generates nothing.
  assert.match(check, /Is that skill installed on this machine, under that name\? Look at the skills and the plugins the session lists, then in the project's `\.claude\/skills\/` and the user's `~\/\.claude\/skills\/`\. Do not run it/);
  assert.match(check, /Is the tool among those the session lists\? That is the whole check: nothing is generated/);
  // An outside model: one call that asks for text, with the project profile and nothing about a key.
  assert.deepEqual(setupRuns('describe'), [
    'node <kit root>/scripts/describe.mjs --text --provider <openai|gemini> --model <id> --brief <scratch>/engine-check.md --out <scratch>/engine-check.txt --profile <packages>/PROFILE.md --timeout 60000',
  ]);
  assert.match(check, /One call for each `model:` entry of `engines-on`.*with no entry, the engine is off and nothing is sent/);
  assert.match(check, /The script reads the project profile and finds the key itself/);
  assert.match(check, /Exit 0 and its one line \(the provider, the model, the characters, the seconds\) are the proof that the engine answers/);
  assert.match(check, /then remove `<scratch>\/engine-check\.txt`/);
  assert.match(check, /On a refusal, record what the script said, as it said it: it never shows a key/);
  assert.match(check, /Do not look for the cause in a keys file or in the environment/);
  // A browser: one run of the picture script on the kit's own specimen page.
  assert.ok(setupRuns('shots').includes('node <kit root>/scripts/shots.mjs <kit root>/kit/grey/parts.html --out <scratch>/browser --widths 1280'));
  assert.match(check, /The script starts its own browser and stops it/);
  assert.match(check, /Fill the `## Engine check` section of the project profile: the day, then a table `\| Seat \| Engine \| What the check found \|` with one row for each seat of the kit's pool, and under it one line for the browser/);
  assert.match(check, /What the check found is "nothing to check", for an engine that is `own`/);
  for (const result of ['answers', 'installed', 'listed', 'missing', 'off']) assert.ok(check.includes(`\`${result}\``), `the result ${result}`);
  // The columns are the template's own.
  assert.match(flat(section(parse(read('templates/project/PROFILE.md')).body, 'Engine check')), /Seat · Engine · What the check found/);
  assert.match(check, /Frame reads this section/);
});

test('setup never touches a key: each thing it must never do with a key or a keys file is said in Never', () => {
  const never = section(setup(), 'Never').split('\n').filter(line => line.startsWith('- '));
  for (const line of never) assert.match(line, /^- \*\*Never [^*]+[.,]\*\*/, line);
  const text = flat(section(setup(), 'Never'));
  for (const rule of [
    /\*\*Never open a keys file, and never list it\.\*\*/,
    /You write the path into the project profile and do nothing else with it/,
    /\*\*Never put a keys file's path, or a key, on a command line\.\*\*/,
    /`scripts\/describe\.mjs` finds its key itself: pass it `--profile` and nothing about a key, and never pass `--endpoint`/,
    /The shell is a command line too: write the path into the project profile with a file tool, never with a command/,
    /\*\*Never ask for a key, never print one, and never write one\.\*\*/,
    /Never print the environment/,
  ]) assert.match(text, rule);
  // Nothing in setup says by which name a key is found, or gives a way to hand one over.
  for (const [file, body] of Object.entries(folderOf('setup'))) assert.doesNotMatch(body, /API_KEY|--keys?\b/, `${file}: no key, and no way to one`);
  for (const command of setupCommands()) assert.doesNotMatch(command, /keys?\b|--endpoint/i, command);
  // And the rest of what it must never do.
  for (const rule of [
    /\*\*Never invent a design system\.\*\*/, /\*\*Never copy a real component into the project kit,\*\* and never run the project's own build or its components to draw the kit\./,
    /\*\*Never invent a trait of a profession\.\*\*/, /\*\*Never stop a process by name or by pattern\.\*\* The machine is shared\. A browser is started only through the kit's scripts/,
    /\*\*Never write a package, or anything outside `<packages>` and `<scratch>`\.\*\*/, /\*\*Never rewrite a project profile that the founder has reviewed\.\*\*/,
  ]) assert.match(text, rule);
});

test('the gate: the founder corrects the project profile once, hears that the stubs are guesses, and his words are written into it', () => {
  const gate = flat(section(setup(), 'Gate'));
  assert.match(gate, /\*\*The founder corrects the project profile, once\.\*\*/);
  assert.match(gate, /ask one question/);
  assert.match(gate, /each stub of a profession's profile is a guess, and stays one until someone of that profession has been heard/);
  assert.match(gate, /write under `## Reviewed by the founder`, the last section: the day, what he corrected, and the words he approved it with/);
  assert.match(gate, /An approval that is only in the chat is not one, and until his words are there the project is not set up/);
  assert.match(gate, /changed by the designs that change it \(a new direction, a new standing rule\), never rewritten from memory/);
  assert.match(gate, /go back to the conductor: the first design starts at Frame/);
});

test('the project\'s pool is five folders, each with a one-line README; a stub is written from the template with every characteristic marked a guess', () => {
  const steps = section(setup(), 'Steps');
  const rows = rowsOf(steps).filter(row => /^`[a-z]+\/`$/.test(row[0]));
  assert.deepEqual(rows.map(row => unspan(row[0])), ['profiles/', 'persons/', 'makers/', 'judges/', 'audiences/']);
  for (const [folder, says] of rows) {
    assert.match(says, /^[A-Z][^\n]*\.$/, `${folder}: one line`);
    if (folder === '`profiles/`') assert.match(says, /written from `templates\/people\/PROFILE-CARD\.md` of the kit/);
    else assert.match(says, /a card is written to (?:"The person card" in )?`pool\/CARD-FORMAT\.md` of the kit/, folder);
  }
  // The folders are the kit's own shelves, and the one for profiles.
  for (const folder of ['persons', 'makers', 'judges', 'audiences']) assert.ok(existsSync(at(`pool/${folder}/`)), `the kit has pool/${folder}/`);
  assert.ok(read('pool/CARD-FORMAT.md').includes('## The person card'));
  const said = flat(steps);
  assert.match(said, /each with a one-line `README\.md` and nothing else, but for the stubs in `profiles\/`/);
  assert.match(said, /A stub is one file for one profession, as `<packages>\/pool\/profiles\/front-desk-coordinator\.md`, written from `templates\/people\/PROFILE-CARD\.md`: its id `profile\.<name>`, every heading and all four labels kept, the example specialty deleted/);
  const persons = rows.find(([folder]) => folder === '`persons/`')[1];
  assert.match(persons, /^The people this product is designed for, each of a profession that has its file in `profiles\/`, or of none: /);
  assert.match(flat(read('templates/people/PERSON-CARD.md')), /as profile\.<name>, or none/);
  assert.match(said, /\*\*Mark the evidence of every characteristic `guess`\*\*: nobody of that profession has been heard/);
  assert.match(said, /write "Not known yet\." where they said nothing/);
  // The template's evidence field takes that word, and its id is written that way.
  const card = read('templates/people/PROFILE-CARD.md');
  assert.ok(card.includes('Evidence: {fact, with its source · guess · unknown}'));
  assert.match(card, /^id: profile\./m);
});

test('in setup the word profile is the project profile, a profession\'s profile, an id, a path or a flag, as in the conductor', () => {
  assert.deepEqual(Object.keys(folderOf('setup')), ['SKILL.md', 'references/project-kit.md'], 'both files of setup are read');
  for (const [file, text] of Object.entries(folderOf('setup'))) {
    const rest = flat(text)
      .replace(/^--- name: setup description: "[^"]*" ---/, '')
      .replace(/project profile|profession's profile|profile\.<name>|profiles\/|--profile|PROFILE\.md|PROFILE-CARD\.md/g, '');
    assert.doesNotMatch(rest, /profile/i, `${file}: "profile" alone says neither the project profile nor a profession's profile`);
  }
});

test('every command setup gives is one the kit takes: describe for text, shots, and render in its reference', () => {
  const commands = setupCommands();
  for (const command of commands) assert.match(command, /^node <kit root>\/scripts\/[a-z]+\.mjs /, command);
  // The check is named in the README lines of the project's pool, not run by setup.
  assert.deepEqual([...new Set(commands.map(command => /scripts\/([a-z]+)\.mjs/.exec(command)[1]))].sort(), ['card', 'describe', 'render', 'shots']);
  assert.deepEqual([...new Set(commands.filter(command => command.includes('/card.mjs')))], ['node <kit root>/scripts/card.mjs check <file>']);
  assert.deepEqual(commandsOf(setup()).filter(command => command.includes('/render.mjs')), [], 'the drawing is the reference\'s');
  // Each is a form its script's usage gives; the same words without what the form needs are not.
  const takes = (script, given) => formsOf(KIT.usage(`scripts/${script}.mjs`)).some(form => mismatch(words(given), specOf(form)) === null);
  for (const command of commands) {
    const [, script, given] = /scripts\/([a-z]+)\.mjs (.+)$/.exec(command);
    assert.ok(takes(script, given), command);
  }
  const [, engineCheck] = /describe\.mjs (.+)$/.exec(setupRuns('describe')[0]);
  assert.ok(!takes('describe', engineCheck.replace(' --profile <packages>/PROFILE.md', '')), 'without --profile it is not taken');
  assert.ok(!takes('describe', engineCheck.replace('--text ', '--text=yes ')), '--text takes no value');
});

test('project-kit.md: the tokens are one CSS file in the kit\'s own folder, with where they came from on its first line', () => {
  const text = flat(projectKit());
  assert.match(text, /You write it once, at setup, in `<packages>\/kit\/`, and it is rebuilt when the tokens change/);
  // Why: the drawing script copies the stylesheets of the kit's folder, and nothing else.
  assert.match(text, /`scripts\/render\.mjs` copies every `\.css` file that is directly in the kit's folder next to each page it draws, and nothing else/);
  assert.match(flat(read('scripts/render.mjs')), /copies every stylesheet directly in <kit dir> \(each \.css file, kit\.css among them\) beside it/);
  assert.match(text, /copy that file to `<packages>\/kit\/tokens\.css`/);
  assert.match(text, /export them into one file of custom properties, `<packages>\/kit\/tokens\.css`/);
  assert.match(text, /\*\*Its first line says where it came from\*\*: the source, by its path from the project's root, and the commit the source was read at/);
  const first = linesOf(projectKit()).filter(({ fenced }) => fenced).map(({ line }) => line.trim()).find(line => line.startsWith('/*'));
  assert.match(first, /^\/\* Copied from \S+\.css at [0-9a-f]{7}\. .*\*\/$/, 'the first line, as an example');
  assert.match(text, /An export says `Exported from`/);
  // The commit on that line is true of the file: a source with changes not committed is said to have them.
  assert.match(text, /Check first whether the source has changes that are not committed \(`git status --short <the file>` prints a line when it has\): the first line then says "with uncommitted changes" after the commit/);
  // A dark theme switched by a class or an attribute is exported, so that the dark pictures are dark.
  assert.match(text, /\*\*A dark theme the product switches by a class or an attribute\*\* does not survive a plain copy/);
  assert.match(text, /the dark set never applies under `prefers-color-scheme: dark`, which is what the picture script sets, and the dark pictures come out light/);
  assert.match(text, /The file is then an export: the dark set is placed under `@media \(prefers-color-scheme: dark\)`, and the first line says it was exported, from what, and how/);
  assert.match(read('scripts/lib/browser.mjs'), /colorScheme: theme/, 'the picture script sets the theme by that media query');
  // The contract says the same of where the tokens are: a file of the kit's own folder.
  const rule = flat(section(read('kit/KIT-CONTRACT.md'), 'The rule'));
  assert.match(rule, /It is one stylesheet that imports the project's tokens from a file of the kit's own folder: setup copies the project's token file there, or exports it when the tokens are not plain CSS, and records on its first line where it came from/);
  assert.doesNotMatch(rule, /links the project's real token file/);
  assert.match(text, /\*\*The copy goes stale when the tokens change\.\*\* Then it is copied or exported again, with the new commit on its first line/);
  // The stylesheet imports it by relative name, as the contract allows.
  assert.ok(linesOf(projectKit()).some(({ line, fenced }) => fenced && line.trim() === '@import "tokens.css";'));
  assert.ok(read('kit/KIT-CONTRACT.md').includes('`@import "tokens.css";`'));
  assert.match(text, /\*\*In the project profile:\*\* `tokens` is the project's own token file when it is plain CSS, and `<packages>\/kit\/tokens\.css` when you exported it/);
});

test('project-kit.md: each class of the contract is restyled on the project\'s tokens alone, none is added, and no component is copied', () => {
  const text = flat(projectKit());
  assert.match(text, /Copy `<kit root>\/kit\/grey\/kit\.css` and `<kit root>\/kit\/grey\/parts\.html` into `<packages>\/kit\/`/);
  // Every class the contract lists is named, and no other.
  const classes = [...section(read('kit/KIT-CONTRACT.md'), 'The classes').matchAll(/^- `(ux-[a-z]+(?:\.is-primary)?)`/gm)].map(([, name]) => name);
  assert.equal(classes.length, 19);
  const named = new Set(spansOf(projectKit()).filter(span => /^ux-/.test(span)));
  assert.deepEqual(classes.filter(name => !named.has(name)), [], 'a class of the contract the reference leaves out');
  assert.deepEqual([...named].filter(name => !classes.includes(name)), [], 'a class the contract does not have');
  assert.match(text, /\*\*Only the project's tokens\.\*\*/);
  assert.match(text, /\*\*No class renamed, dropped or added, and no markup changed\.\*\*/);
  assert.match(text, /\*\*Each class is styled once,\*\*/);
  assert.match(text, /\*\*You read the components, and copy none\.\*\*/);
  assert.match(text, /never drawn through the project's own toolchain/);
  // With no design system the kit is the grey kit, untouched.
  assert.match(text, /\*\*A project with no design system gets the grey kit as it is:\*\* the copy, then the drawing and the pictures/);
  const never = flat(section(projectKit(), 'Never'));
  for (const rule of [/Never import, copy or run a real component/, /Never link a token file outside `<packages>\/kit\/`/, /Never invent tokens for a project that has none/, /Never start or stop a browser yourself/]) assert.match(never, rule);
});

mkdirSync(fileURLToPath(at('tests/.tmp/')), { recursive: true });
const scratchRoot = mkdtempSync(join(fileURLToPath(at('tests/.tmp/')), 'skills-'));
after(() => rmSync(scratchRoot, { recursive: true, force: true }));

test('project-kit.md: its specimen proposal is valid, and its drawing command draws it with a kit that imports its tokens, the tokens beside the page', () => {
  const blocks = [...projectKit().matchAll(/```json\n([\s\S]*?)\n```/g)].map(([, json]) => json);
  assert.equal(blocks.length, 1, 'one proposal is given');
  const proposal = JSON.parse(blocks[0]);
  assert.deepEqual(validate(proposal, { sealed: true }), []);
  // A project kit as the reference builds it: the grey stylesheet, importing a token file of its own folder.
  const packages = join(scratchRoot, 'a project', 'design');
  const scratch = join(scratchRoot, 'a scratch folder');
  mkdirSync(join(packages, 'kit'), { recursive: true });
  mkdirSync(scratch, { recursive: true });
  writeFileSync(join(packages, 'kit', 'kit.css'), `@import "tokens.css";\n${read('kit/grey/kit.css')}`);
  writeFileSync(join(packages, 'kit', 'tokens.css'), '/* Copied from src/styles/tokens.css at 4f2a9c1. */\n:root { --color-action: #1f1f1f; }\n');
  copyFileSync(at('kit/grey/parts.html'), join(packages, 'kit', 'parts.html'));
  writeFileSync(join(scratch, 'kit-check.json'), blocks[0]);
  // The command, word for word, with its three placeholders filled.
  const [command] = setupRuns('render');
  assert.equal(command, 'node <kit root>/scripts/render.mjs <scratch>/kit-check.json --kit <packages>/kit --out <scratch>/drawn/kit-check.html');
  const fill = word => word.replace('<kit root>/', fileURLToPath(root)).replace('<scratch>', scratch).replace('<packages>', packages);
  const run = spawnSync(process.execPath, words(command).slice(1).map(fill), { encoding: 'utf8' });
  assert.deepEqual([run.status, run.stderr], [0, '']);
  const drawn = readdirSync(join(scratch, 'drawn')).filter(name => !name.startsWith('.fuse_hidden')).sort();
  assert.deepEqual(drawn, ['kit-check.html', 'kit.css', 'tokens.css']);
  const page = readFileSync(join(scratch, 'drawn', 'kit-check.html'), 'utf8');
  assert.match(page, /<link rel="stylesheet" href="kit\.css">/);
  assert.match(page, /class="ux-action is-primary"/);
  // Then the pictures: the specimen page and the drawn one, in one run of the picture script.
  assert.ok(setupRuns('shots').includes('node <kit root>/scripts/shots.mjs <packages>/kit/parts.html <scratch>/drawn/kit-check.html --out <scratch>/pictures --widths 1280,390 --themes light,dark'));
  assert.match(flat(projectKit()), /exits 1 and prints `error: <page>: <what>` when a stylesheet a page asks for does not load/);
});

// ---- the four opening stages: what skills/frame, context, intent and cast were written to say

const OPENING = Object.freeze(['frame', 'context', 'intent', 'cast']);
const stageSkill = name => read(`skills/${name}/SKILL.md`);
const presets = () => read('skills/cast/references/presets.md');
// The body of the template a stage fills.
const outputOf = name => parse(read(`templates/package/${ARTEFACT[name]}`)).body;
// Every command a stage's folder gives, as written, but the one in the sentence about the kit's root.
const stageCommands = name => Object.values(folderOf(name)).flatMap(commandsOf).filter(command => command !== 'node <kit root>/scripts/<name>.mjs');
// Whether a script takes these words after its name, by any form of its usage.
const takenBy = (script, given) => formsOf(KIT.usage(`scripts/${script}.mjs`)).some(form => mismatch(words(given), specOf(form)) === null);
// The header of every card the kit ships, by its id.
const kitCards = () => Object.fromEntries(['makers', 'judges', 'audiences']
  .flatMap(shelf => filesUnder(`pool/${shelf}/`).map(file => parse(read(`pool/${shelf}/${file}`)).data)).map(data => [data.id, data]));
const isSeat = span => /^(?:maker|judge|audience)\.[a-z-]+$/.test(span);
// The code spans of a text's prose: a code fence is left out, so that its marks are not read as spans.
const proseSpans = text => spansOf(linesOf(text).filter(({ fenced }) => !fenced).map(({ line }) => line).join('\n'));
// What a stage's Never list forbids, line by line, each without its closing mark.
const nevers = text => section(text, 'Never').split('\n').filter(line => line.startsWith('- ')).map(line => /^- \*\*(Never [^*]+?)[.,]?\*\*/.exec(line)?.[1]);
// The rows of the conductor's table of the stages: number, stage, skill, question, output, what the founder does.
const stageRows = () => tableRows(section(conductor(), 'The order')).filter(row => /^\d+$/.test(row[0]));

test('each opening stage has the six sections and no other, asks the question the conductor gives it, and points to the loop instead of repeating it', () => {
  for (const name of OPENING) {
    const text = stageSkill(name);
    assert.deepEqual(headings(text), STAGE_SECTIONS, name);
    const [, , , question] = stageRows().find(row => row[1].toLowerCase() === name);
    assert.equal(section(text, 'Question').trim(), question, `${name}: the conductor's question for it`);
    const opening = flat(text.slice(0, text.indexOf('\n## ')));
    assert.match(opening, /The conductor \(`ux:design`\) sent you, and its words are yours/, name);
    assert.match(opening, new RegExp(`Its loop is in \`skills/design/references/loop\\.md\`: this page says only what is ${name[0].toUpperCase()}${name.slice(1)}'s own\\.`), name);
    assert.match(opening, /Run it from the project's root\. `<packages>` is the folder that holds the project's packages: `design` at the project's root, unless the project profile names another under `packages`\. `<package>` is the folder of this design in it, as `design\/today`\./, name);
    // The long form of the loop is the conductor's: no stage copies it.
    assert.doesNotMatch(flat(text), /Every stage runs the same nine steps|\*\*One fix round and one re-read,\*\* and no more|A fresh sub-agent\.\*\* Start it with the Agent tool/, name);
    assert.equal(new URL('../../', at(`skills/${name}/`)).href, root.href, `${name}: the kit's root is where the sentence says`);
  }
  assert.ok(profileKeys().includes('packages'));
  // Cast alone has a reference: the default cast, which Frame reads too.
  for (const name of ['frame', 'context', 'intent']) assert.deepEqual(filesUnder(`skills/${name}/`), ['SKILL.md'], name);
  assert.deepEqual(filesUnder('skills/cast/'), ['SKILL.md', 'references/presets.md']);
  assert.ok(ownReferences(stageSkill('cast')).includes('references/presets.md'), 'cast points to references/presets.md');
  assert.ok(kitPaths(stageSkill('frame')).includes('skills/cast/references/presets.md'), 'frame reads the default cast');
});

test('each opening stage reads the output of the stage before it and what its carry list names, and Frame alone takes the request from the conversation', () => {
  const BEFORE = { context: 'frame', intent: 'context', cast: 'intent' };
  for (const [name, before] of Object.entries(BEFORE)) {
    const reads = flat(section(stageSkill(name), 'Reads'));
    assert.match(reads, new RegExp(`\\*\\*The ${before},\\*\\* \`<package>/${ARTEFACT[before].replace('.', '\\.')}\`, approved, and (?:exactly )?what its carry list names`), name);
  }
  const reads = flat(section(stageSkill('frame'), 'Reads'));
  assert.match(reads, /\*\*The request, as he wrote it\.\*\* Frame is the one stage that takes anything from the conversation: his request, and nothing else of it/);
  assert.match(reads, /\*\*Not the project's code, its screens or its data\.\*\* Reading the world is Context's/);
  // The kind, the size and the route are the state's to say: Context has them in the frame, Intent and Cast ask.
  assert.match(flat(section(stageSkill('intent'), 'Reads')), /\*\*The state:\*\* `node <kit root>\/scripts\/state\.mjs status <package>` prints the kind, and whether Intent is routed full or short/);
  assert.match(flat(section(stageSkill('cast'), 'Reads')), /\*\*The state:\*\* `node <kit root>\/scripts\/state\.mjs status <package>` prints the kind, the foundation, the size and the route\. You cast the stages still to run, and no other/);
  assert.doesNotMatch(flat(section(stageSkill('cast'), 'Reads')), /Nothing else of its header/);
  assert.match(KIT.usage('scripts/state.mjs'), /status <package>\s+prints STATE\.md as generated from state\.json/);
  // Intent and Cast read the package, never the world again.
  assert.match(flat(section(stageSkill('intent'), 'Reads')), /\*\*Not the world\.\*\* Context read it\. What the intent needs and the context lacks is missing from the package: say so, and ask to go back, as the conductor's "Resuming" says/);
  assert.ok(headings(conductor()).includes('Resuming') && headings(conductor()).includes('Before a stage'));
  // Each names the project profile by its path, and what it takes from it is a key or a section of the template.
  const keys = profileKeys();
  const sections = headings(parse(read('templates/project/PROFILE.md')).body);
  for (const [name, taken] of Object.entries({ frame: ['pinned', 'banned'], context: ['facts', 'tokens', 'components', 'languages'], cast: ['packages', 'pinned', 'banned', 'engines-on', 'openai-model', 'gemini-model'] })) {
    const said = section(stageSkill(name), 'Reads');
    assert.ok(said.includes('`<packages>/PROFILE.md`'), name);
    for (const key of taken) assert.ok(keys.includes(key) && spansOf(said).includes(key), `${name}: ${key}`);
  }
  for (const [name, taken] of Object.entries({ frame: ['Kinds this project adds', 'Design system'], context: ['Standing rules', 'Design system'] })) {
    for (const heading of taken) assert.ok(sections.includes(heading) && flat(section(stageSkill(name), 'Reads')).includes(`"${heading}"`), `${name}: "${heading}"`);
  }
  for (const name of ['frame', 'cast']) assert.ok(sections.includes('Engine check') && section(stageSkill(name), 'Reads').includes('`## Engine check`'), `${name} reads the engine check`);
});

test('each opening stage writes its output from its template: built from the stage before it, every section of the template named, and none the template lacks', () => {
  const BUILT = { frame: '`built-from` stays `[]`', context: '`built-from: [frame@1]`', intent: '`built-from: [context@1]`', cast: '`built-from: [intent@1, context@1]`' };
  const listed = {};
  for (const name of OPENING) {
    const text = stageSkill(name);
    const writes = flat(section(text, 'Writes'));
    assert.ok(writes.includes(`\`<package>/${ARTEFACT[name]}\``), `${name}: Writes names its output`);
    assert.ok(writes.includes(`from \`templates/package/${ARTEFACT[name]}\``), `${name}: Writes names its template`);
    assert.ok(writes.includes(BUILT[name]), `${name}: ${BUILT[name]}`);
    const held = headings(outputOf(name));
    assert.deepEqual(held.slice(-2), ['Reviewed by the founder', 'Carry'], name);
    // The cast sheet's tables, one for each stage, are named by their columns, below.
    const own = held.slice(0, -2).filter(heading => name !== 'cast' || !STAGES.includes(heading.toLowerCase()));
    for (const heading of own) assert.ok(flat(text).includes(`"${heading}"`), `${name}: names "${heading}"`);
    for (const heading of held.slice(-2)) assert.ok(text.includes(`\`## ${heading}\``), `${name}: names ## ${heading}`);
    // A list item that opens with a name in double quotes is a section of the stage's own template.
    listed[name] = [...text.matchAll(/^\s*- "([^"]+)"[:.]/gm)].map(([, heading]) => heading);
    assert.deepEqual(listed[name].filter(heading => !held.includes(heading)), [], `${name}: a section its template does not hold`);
  }
  // Context and Intent fill their template heading by heading, in its order; Cast, the four sections under its tables.
  for (const name of ['context', 'intent']) assert.deepEqual(listed[name], headings(outputOf(name)).slice(0, -2), name);
  assert.deepEqual(listed.cast, ['Left out', 'Blind rules', 'Fresh pass', 'Cost']);
  assert.deepEqual(headings(outputOf('cast')).slice(0, 5).map(heading => heading.toLowerCase()), STAGES.slice(4));
  const columns = tableRows(outputOf('cast'))[0];
  assert.equal(columns.length, 7);
  for (const column of columns) assert.ok(flat(section(stageSkill('cast'), 'Writes')).includes(`"${column}"`), `cast: the column "${column}"`);
  assert.match(flat(section(stageSkill('cast'), 'Writes')), /One table for each stage still to run.*The table of a stage the route skips is deleted\./);
  // Frame also starts the package's decision log, from its template.
  assert.match(flat(section(stageSkill('frame'), 'Writes')), /The package's `DECISIONS\.md`, started from `templates\/package\/DECISIONS\.md` with the frame as its first entry/);
});

test('every command an opening stage gives is one its script takes, on its own stage, and none reaches for an outside engine or a key', () => {
  const VERBS = { frame: ['begin', 'init', 'route', 'stamp', 'status'], context: ['await', 'begin', 'slug', 'stamp'], intent: ['await', 'begin', 'slug', 'stamp', 'status'], cast: ['await', 'begin', 'slug', 'stamp', 'status'] };
  const OTHER = { frame: [], context: ['card', 'shots'], intent: ['card'], cast: ['card'] };
  for (const name of OPENING) {
    const commands = stageCommands(name);
    for (const command of commands) {
      const [, script, given] = /^node <kit root>\/scripts\/([a-z]+)\.mjs (.+)$/.exec(command) ?? [];
      assert.ok(script, command);
      assert.ok(takenBy(script, given), command);
    }
    const state = commands.filter(command => command.startsWith('node <kit root>/scripts/state.mjs ')).map(command => words(command).slice(2));
    assert.deepEqual([...new Set(state.map(([verb]) => verb))].sort(), VERBS[name], name);
    for (const [verb, pkg, stage] of state.filter(([verb]) => ['begin', 'await', 'stamp'].includes(verb))) assert.deepEqual([pkg, stage], ['<package>', name], `${name}: ${verb}`);
    assert.deepEqual([...new Set(commands.map(command => /scripts\/([a-z]+)\.mjs/.exec(command)[1]))].filter(script => script !== 'state').sort(), OTHER[name], name);
    assert.ok(commands.includes(`node <kit root>/scripts/state.mjs begin <package> ${name}`), `${name}: begin`);
    assert.ok(commands.includes(`node <kit root>/scripts/state.mjs stamp <package> ${name} --words "<the founder's words>"`), `${name}: stamp`);
    assert.equal(commands.includes(`node <kit root>/scripts/state.mjs await <package> ${name} --question "<the one question>"`), name !== 'frame', `${name}: await`);
    for (const [file, text] of Object.entries(folderOf(name))) assert.doesNotMatch(text, /API_KEY|--keys?\b|--endpoint|describe\.mjs|keys-file/, `${name}/${file}: no key, no keys file, and no outside model run from here`);
  }
  assert.ok(stageCommands('frame').includes('node <kit root>/scripts/state.mjs init <package> --design <name> --kind <kind> --foundation <foundation> --size <size>'));
  // A project's own judge is checked by the stage that would seat it, before Cast as at Cast.
  for (const name of ['context', 'intent']) assert.ok(stageCommands(name).includes('node <kit root>/scripts/card.mjs check <packages>/pool/judges/<name>.md'), `${name}: a project's judge is checked`);
  assert.ok(stageCommands('frame').includes('node <kit root>/scripts/state.mjs route <package> <stage> <full|short|skipped> --reason "<why>"'));
  // The rule refuses something real: the same words without what the form needs are not taken.
  for (const [script, wrong] of [
    ['state', 'begin <package>'], ['state', 'init <package> --design <name> --kind <kind> --size <size>'], ['state', 'stamp <package> cast'], ['state', 'await <package> intent'],
    ['card', 'check'], ['card', 'validate <file>...'], ['shots', '<file or folder> --out <package>/work/as-is'],
  ]) assert.ok(!takenBy(script, wrong), `${script}.mjs does not take: ${wrong}`);
});

test('at each gate there is one question, and his answer is written under "Reviewed by the founder" before the carry list and the stamp', () => {
  for (const name of OPENING) {
    const text = stageSkill(name);
    const gate = flat(section(text, 'Gate'));
    // What the founder does at this gate, in the conductor's own word for it.
    const does = stageRows().find(row => row[1].toLowerCase() === name)[5];
    assert.ok(gate.startsWith(` **He ${does}`), `${name}: he ${does}`);
    assert.match(gate, /one question, about one thing: /i, name);
    inOrder(gate, [/`## Reviewed by the founder`/, /as he said them/, /`## Carry`/, new RegExp(`state\\.mjs stamp <package> ${name} --words`), /Then append the decision to the package's `DECISIONS\.md`, and ask the state what is next, as step 9 of the loop says/], `${name}: the gate`);
    assert.ok(nevers(text).includes('Never ask two things at once'), `${name}: never two things at once`);
    if (name === 'frame') continue;
    inOrder(gate, [/There is nothing to pick from, so no decision page is built/, new RegExp(`state\\.mjs await <package> ${name} --question`), /`## Reviewed by the founder`/], `${name}: the question is recorded before his answer`);
    assert.match(gate, /Record the one question, so that a session resuming tomorrow asks the same/, name);
    // A stage that is awaiting him is not begun again: the session that resumes goes to the gate.
    inOrder(flat(section(text, 'Steps')), [
      /1\. \*\*Begin\.\*\* Check the state as step 1 of the loop says\. A stage that is awaiting the founder is not begun again: go to "Gate", with his answer\. Otherwise mark it in work:/,
      new RegExp(`state\\.mjs begin <package> ${name}`),
      new RegExp(`2\\. \\*\\*Read the [a-z]+, and what its carry list names\\.\\*\\* Copy the template to \`<package>/${ARTEFACT[name].replace('.', '\\.')}\` and write \`built-from\`, unless the file is already there: then go on from what it holds\\.`),
    ], `${name}: begin, then read`);
  }
  assert.match(flat(reference('loop.md')), /A stage that is awaiting the founder\.\*\* Its output is already in front of him, and `begin` would put it back in work/);
  assert.match(flat(reference('loop.md')), /so that a session resuming tomorrow asks the same one/);
  // The loop says the same of these four gates: the output is what he reads, and the page is for any other decision.
  assert.match(flat(section(reference('loop.md'), '7. The decision page')), /^ At Frame, Context, Intent and Cast the gate is an approval of the stage's own output: that output is what he reads, and no page is built\. Any other decision goes to the founder as one page, built from a small data file:/);
  // The conductor's summary of the step says the same.
  assert.match(flat(section(conductor(), 'The loop')), /7\. \*\*The decision page\.\*\* At Frame, Context, Intent and Cast, the output is what he reads\. Any other decision is one page: the identity line, the options as pictures, one line for each seat, one recommendation, one question\./);
  assert.deepEqual(OPENING, STAGES.slice(0, 4));
  // The questions, each about one thing.
  for (const [name, question] of Object.entries({ frame: 'is this the right frame for it?', context: 'what is wrong or missing in this context?', intent: 'do you approve this intent?', cast: 'which seat, check, model or effort would you change?' })) {
    assert.ok(flat(section(stageSkill(name), 'Gate')).includes(`bout one thing: ${question}`), `${name}: ${question}`);
  }
});

test('each opening stage says in Never what that stage is tempted to do, first, and nothing is designed, listed short or drawn before its gate', () => {
  const FIRST = { frame: 'Never start designing', context: 'Never have an idea', intent: 'Never describe the interface', cast: 'Never remove a seat silently, here or later' };
  for (const name of OPENING) {
    const lines = section(stageSkill(name), 'Never').split('\n').filter(line => line.startsWith('- '));
    assert.ok(lines.length >= 8, name);
    for (const line of lines) assert.match(line, /^- \*\*Never [^*]+[.,]\*\*/, line);
    assert.equal(nevers(stageSkill(name))[0], FIRST[name], name);
  }
  const never = name => flat(section(stageSkill(name), 'Never'));
  assert.match(never('frame'), /A frame says what the request is, never what the answer is: no layout, no component, no "it could be a list of rooms"\. An idea you have is written nowhere/);
  assert.match(never('context'), /Not a solution, not a layout, not an "it should"\. An angle says what the problem is\. What you think the answer is goes nowhere: not into the context, not into a brief, not into the chat/);
  assert.match(never('intent'), /No screen, no component, no layout, no label\. "She can say which rooms are free now", never "a list of free rooms at the top"/);
  assert.match(never('cast'), /A seat that does not sit is under "Left out", with what is lost without it, before he approves\. After that, it leaves the sheet only through him/);
  assert.ok(nevers(stageSkill('intent')).includes('Never start Cast, a brief or a sketch before he has approved'));
  assert.ok(nevers(stageSkill('cast')).includes('Never start a seat, write a brief or sketch a structure here'));
  // Each is written to the session, with an example from the kit's own product: a room, never a real one.
  for (const name of OPENING) assert.match(stageSkill(name), /\brooms?\b/, `${name}: an example from the room-booking tool`);
});

test('in the four opening stages the word profile is the project profile, a profession\'s profile, the profile judge, an id or a path, as in the conductor', () => {
  for (const name of OPENING) {
    for (const [file, text] of Object.entries(folderOf(name))) {
      const rest = flat(text).replace(/project profile|profession's profile|profile judge|judge\.profile|profile\.<name>|profile\.[a-z]+(?:-[a-z]+)+|profiles\/|PROFILE\.md|PROFILE-CARD\.md/g, '');
      assert.doesNotMatch(rest, /profile/i, `${name}/${file}: "profile" alone says neither the project profile nor a profession's profile`);
    }
  }
});

test('frame: one exchange, the three values and the route, who it is for, and the preset seats whose engine the check shows missing or off', () => {
  const text = stageSkill('frame');
  const opening = flat(text.slice(0, text.indexOf('\n## ')));
  assert.match(opening, /In one exchange with the founder you name three things about his request \(its kind, its foundation and its size\) and with them its route/);
  assert.match(opening, /No maker sits here, and no judge/);
  const steps = flat(section(text, 'Steps'));
  assert.deepEqual(boldSteps(section(text, 'Steps')), [
    [1, 'See whether the design is new'], [2, 'Name the kind, the foundation and the size,'], [3, 'Read the route off the size:'], [4, 'Say who it is for:'],
    [5, 'Draw the provisional cast:'], [6, 'List the engines missing'],
  ]);
  assert.match(steps, /Steps 1 to 6 write nothing: the package is made at the gate, on his yes/);
  // The three values are the conductor's tables, and the names the skill gives are the state script's.
  assert.match(steps, /each from its table in `skills\/design\/references\/routes\.md`, each with one line of why/);
  for (const heading of ['Kind', 'Foundation', 'Size', 'The route of each size', 'A correction']) assert.ok(headings(reference('routes.md')).includes(heading), `routes.md: ## ${heading}`);
  for (const [list, value] of [[KINDS, 'working-surface'], [FOUNDATIONS, 'new-surface'], [FOUNDATIONS, 'no-system'], [SIZES, 'surface'], [SIZES, 'correction']]) {
    assert.ok(list.includes(value) && proseSpans(text).includes(value), value);
  }
  assert.match(steps, /It is `no-system` while the project profile says "None yet" under "Design system"/);
  assert.match(steps, /\*Size:\* why this size, and not the one below it/);
  assert.match(steps, /Where the request and the project profile do not settle a value, say that it is your reading: he corrects it in his answer/);
  assert.match(steps, /the mode of each stage, from "The route of each size"\. Change the mode of one stage only with a reason he can read: an adjustment that changes the structure runs Structure, and one that changes nothing she can see skips Look/);
  assert.match(flat(presets()), /When it touches nothing she can see, Frame routes Look `skipped`, with the reason, and nobody is cast there/);
  assert.ok(takenBy('state', 'route <package> look skipped --reason "<why>"'));
  // One profession, several, or everyone.
  assert.match(steps, /\*\*Say who it is for:\*\* one profession, several, or everyone\. Name each profession by the id of its profession's profile, as `profile\.front-desk-coordinator`\. Say which have a file in the project's pool, and which Context will have to draft/);
  // The provisional cast is the preset, with the project's own pinned and banned seats.
  assert.match(steps, /\*\*Draw the provisional cast:\*\* the preset for this kind and size, from `skills\/cast\/references\/presets\.md`, with what it adds by rule, the project's `pinned` seats added and its `banned` ones taken out\. One line for each seat\. It is a starting point: Cast decides/);
  // The engines: read from the check setup wrote, never checked again and never turned on.
  assert.match(steps, /In the `## Engine check` table of the project profile, find the row of each seat of the provisional cast, and of each maker the preset adds by rule/);
  assert.match(steps, /A row that says `missing` or `off`, or that holds a script's refusal, is a seat with no engine today\. List the seat, its engine, what the check found, and what the seat does without it, which the last table of `skills\/cast\/references\/presets\.md` gives/);
  assert.match(steps, /"None" when every engine answers\. You check nothing again here, and you turn nothing on/);
  for (const result of ['missing', 'off']) assert.ok(flat(setup()).includes(`\`${result}\``), `setup records ${result}`);
  assert.match(flat(setup()), /Frame reads this section/);
  assert.equal(headings(presets()).at(-1), 'A seat without its engine');
  assert.ok(nevers(text).includes('Never turn an engine on'));
  assert.match(flat(section(text, 'Never')), /`engines-on` is the founder's line in the project profile/);
});

test('frame: the package is made on his yes, with the three values he agreed, and a correction\'s frame is one line', () => {
  const text = stageSkill('frame');
  const gate = flat(section(text, 'Gate'));
  inOrder(gate, [
    /\*\*He confirms in one message\.\*\* Put the frame to him in one message/, /\*\*If he corrects a value,\*\* change it, say what moves with it/, /\*\*On his yes, and not before, make the package:\*\*/,
    /state\.mjs init <package> --design <name> --kind <kind> --foundation <foundation> --size <size>/, /state\.mjs begin <package> frame/,
    /`init` takes the three values as he agreed them, and it runs once: a package's kind and foundation are not changed afterwards, and its size only moves up/,
    /state\.mjs route <package> <stage> <full\|short\|skipped> --reason "<why>"/, /\*\*Write `00-frame\.md`\.\*\* Copy the template, unless the file is already there: then go on from what it holds\. "The request", word for word/, /state\.mjs status <package>/,
  ], 'the gate of Frame');
  // The conductor's loop says the same of the order: the package first, then begun.
  assert.match(flat(reference('loop.md')), /Frame makes it first, with `init` \(`references\/routes\.md`\), and only then begins/);
  assert.match(gate, /a name for the design \(a word or two in lower case, as `today`: it names the package's folder\)/);
  // What it carries: a profession's profile that exists, and nothing built from an earlier stage.
  assert.match(gate, /one `- source:<path>` line for each profession's profile the frame names that is in the project's pool, by its path from the project's root, as `- source:design\/pool\/profiles\/front-desk-coordinator\.md`\. Nothing else goes under that heading/);
  const never = nevers(text);
  for (const rule of [
    'Never make the package before he has agreed the three values', 'Never take the smaller size to save stages', 'Never skip a stage by leaving it out', 'Never summarise the request',
    'Never read the project\'s code or its screens to frame it', 'Never edit `state.json` or `STATE.md` by hand',
  ]) assert.ok(never.includes(rule), rule);
  // A half-framed package is picked up, and init is not run twice.
  const steps = flat(section(text, 'Steps'));
  assert.match(steps, /It is, unless the conductor sent you to a package that exists: a folder with a `state\.json`, whose next stage is `frame`\. That design was left half framed\. Its three values are in the state already: do not run `init` again\. Where `00-frame\.md` does not hold the request, ask him for it again, as he would write it: it is written from his answer, never from the chat\. Then go through steps 3 to 6, put the frame to him with the three values as they stand, and go on from "Write `00-frame\.md`", under "Gate"/);
  assert.match(gate, /- \*\*Write `00-frame\.md`\.\*\*/);
  // A correction: one line, and the rest is the conductor's.
  assert.match(steps, /\*\*Sized `correction`, Frame is one line:\*\* the request, the three values and the route\. Steps 4 to 6 are not run: a correction casts no seat\. He confirms the line, and it is written where the template's first instruction stands/);
  assert.match(steps, /What follows a correction's frame is in `skills\/design\/references\/routes\.md`, under "A correction"/);
  assert.match(gate, /If it refuses because a package of that name exists, that one is another design's: agree another name with him/);
  assert.match(read('scripts/lib/state.mjs'), /a package is initialised once/);
  assert.match(flat(read('templates/package/00-frame.md')), /A correction needs only the request, the three values and its route in one line/);
  assert.equal(routeFor('correction').frame, 'short');
});

test('context: the one stage that reads the world, every fact with its source, and careful what it copies', () => {
  const text = stageSkill('context');
  const opening = flat(text.slice(0, text.indexOf('\n## ')));
  assert.match(opening, /This is the one stage that reads the world: the project's code, its documents, its data and its analytics\. Reading is not implementing, and you change nothing there/);
  assert.match(opening, /Every later stage reads the package and the sources you list, and nothing else/);
  const steps = flat(section(text, 'Steps'));
  assert.match(steps, /\*\*Read the world, and write each fact with its source:\*\* a path from the project's root, with the name or the line in the file; an address; or a date, with who said it\. A fact with no source is not written: it becomes one of the "Questions for the founder"/);
  assert.match(steps, /A fact about configuration names the setting, never a secret value/);
  assert.match(steps, /Nothing private about a real person is copied into the package: no name, no contact detail, no record/);
  assert.match(steps, /Nothing of the project is sent to any service to gather context: no outside model, no hosted tool, no search that carries its content\. The product's own analytics are read through a connection the project already has, and only read: the fact names that source and the day/);
  assert.match(flat(section(text, 'Reads')), /the project's code, documents and data, as far as this design reaches; and the product's own analytics, through a connection the project already has/);
  // A keys file is passed over, in setup's own words.
  const PASSED = '**Never** a keys file, and never the environment. A dotenv file, or any file of credentials, that you meet while reading the project is passed over, unopened.';
  assert.ok(flat(section(text, 'Reads')).includes(PASSED));
  assert.ok(flat(section(setup(), 'Reads')).includes(PASSED), 'the same words in setup');
  const never = nevers(text);
  for (const rule of [
    'Never write a fact without its source', 'Never copy a secret value', 'Never copy anything private about a real person into the package',
    'Never send anything of the project to a service to gather context',
    'Never invent a trait of a profession', 'Never write the inventory as components', 'Never settle for one angle', 'Never change the project',
  ]) assert.ok(never.includes(rule), rule);
  assert.match(flat(section(text, 'Never')), /Name the setting\. Never open a keys file or a file of credentials, and never print the environment/);
  assert.match(flat(section(text, 'Writes')), /Nothing of the project outside `<packages>` is written/);
});

test('context: a surface that exists is read as it is first, from pictures the kit\'s script takes or the founder supplies, by the judges whose cards sit at context', () => {
  const text = stageSkill('context');
  const steps = section(text, 'Steps');
  const read3 = steps.slice(steps.indexOf('3. **When the surface exists'), steps.indexOf('4. **Read the world'));
  const asIs = flat(read3);
  assert.match(asIs, /\*\*When the surface exists, have it read as it is, first\.\*\* The frame says so: its foundation is `redesign` or `small-change`/);
  for (const foundation of ['redesign', 'small-change']) assert.ok(FOUNDATIONS.includes(foundation));
  assert.match(flat(reference('routes.md')), /Context opens with a read of the surface as it is/);
  // The pictures: the kit's script where the surface opens as a page from a file, the founder where it does not.
  assert.ok(stageCommands('context').includes('node <kit root>/scripts/shots.mjs <file or folder> --out <package>/work/as-is --widths <w,w...>'));
  assert.match(asIs, /Where the surface can be opened as a page from a file, photograph it/);
  assert.match(KIT.usage('scripts/shots.mjs'), /A folder means every \.html file directly in it/);
  assert.match(asIs, /The script starts its own browser and stops it\. Where the surface needs the running product or a sign-in, ask the founder for pictures of it, and put them in the same folder\. You start no browser yourself/);
  // The readers: every judge of the kit whose card sits at context, and no other seat.
  const sitting = Object.values(kitCards()).filter(card => card['sits-at'].includes('context')).map(card => card.id).sort();
  assert.deepEqual(sitting, ['judge.usability', 'judge.visual-craft']);
  assert.deepEqual(proseSpans(read3).filter(isSeat).sort(), sitting);
  assert.match(asIs, /The judges whose cards sit at `context`: `judge\.usability` and `judge\.visual-craft`, and any judge of the project's own that sits there/);
  assert.match(asIs, /Each is a fresh sub-agent, started as "Starting a seat" in the loop says, from a brief written from `templates\/briefs\/judge\.md`/);
  // A project's own judge is checked before it is read or seated, a faulty one reported and left out.
  inOrder(asIs, [
    /A project's card is checked before it is read or seated, each file of `<packages>\/pool\/judges\/` in turn:/, /card\.mjs check <packages>\/pool\/judges\/<name>\.md/,
    /A faulty one is reported to the founder, with what the command printed, and left out: where it carries the id of a kit card, the kit's card sits in its place, and you tell him so\. A sound one sits when its header says it sits at `context`, and one with the id of a kit card replaces it\./, /Each is a fresh sub-agent/,
  ], 'a project\'s judge is checked before it is seated');
  assert.match(flat(section(text, 'Reads')), /\*\*A judge of the project's own that sits at `context`,\*\* in `<packages>\/pool\/judges\/`: checked first, as step 3 says/);
  assert.ok(reference('loop.md').includes('\n### Starting a seat\n'));
  assert.ok(read('templates/briefs/judge.md').includes('At Context, where no intent exists yet: who she is and her tasks, in a few lines.'));
  assert.match(asIs, /The brief names the pictures by their paths and gives who she is and what she does there in a few lines\. It never says what is wrong/);
  assert.match(asIs, /No cast sheet exists yet: the brief says that no cut of the checks was made, and each judge runs on the model and the effort its card suggests \(`pool\/MODELS\.md`\), unless he says otherwise/);
  assert.match(flat(read('templates/briefs/judge.md')), /Cast's first cut of your optional checks\. Your core checks always run, and you test every trigger again on the artefact itself/);
  assert.match(asIs, /\*Their findings open "The problem, and why now",\* each with its seat\. A judge offers no fix here, and you add none/);
  // Where it is kept: beside the briefs, in the folder no seat is handed, and never read again.
  assert.match(flat(section(text, 'Writes')), /its pictures, the judges' briefs and their ledgers, in `<package>\/work\/as-is\/`\. What they found is written into the context\. The folder is never read again/);
  assert.match(flat(conductor()), /Never read `work\/` as an input/);
  // The shared machine.
  assert.match(flat(section(text, 'Never')), /\*\*Never start a browser yourself, and never stop a process by name or by pattern\.\*\* The machine is shared\. A browser is started only through the kit's scripts, which stop the one they started\./);
  assert.ok(nevers(text).includes('Never tell a judge of the surface as it is what to find'));
});

test('context: the inventory, at least three angles, the founder\'s own words, the project sources, and a profession\'s profile drafted as a guess', () => {
  const text = stageSkill('context');
  const steps = flat(section(text, 'Steps'));
  assert.match(steps, /"What the product can show and do": the inventory\. Every piece of data, every action and every state that really exists, one row each, with an id of its own \(`P1`\), its kind and its source/);
  assert.match(steps, /Written as data, never as components: "whether a room is free, busy, being cleaned or closed", never "a status badge"\. The truth judge holds every design to this table/);
  assert.match(steps, /"The angles considered": \*\*at least three\*\* ways of saying what the problem is, each with its risk\. Never one\. An angle frames the problem and does not solve it/);
  assert.match(flat(outputOf('context')), /At least three ways of framing the problem, each with its risk\. Never one\./);
  // His own words are asked for when the words will matter: the kinds whose words get their own review.
  assert.match(steps, /"The founder's own words": ask for them when the words will matter: the kind is `first-run`, `message` or `public-page`, or she must read in order to act\. One or two sentences, as he would say them, written verbatim/);
  for (const kind of ['first-run', 'message', 'public-page']) assert.ok(KINDS.includes(kind), kind);
  assert.match(steps, /Otherwise "Not asked", with the reason/);
  assert.match(steps, /"Project sources": the files a later stage may open directly, as the token files, the component source and the product-facts document\. One path to a line, from the project's root, with what it is\. A file you leave out is closed to every later stage/);
  // A profession's profile that is missing is drafted, every trait a guess, corrected by him, then saved.
  assert.match(steps, /One that is missing is drafted from `templates\/people\/PROFILE-CARD\.md`, \*\*with the evidence of every trait marked `guess`\*\*: fill a field only from what the project's documents and the founder have said of that profession, and invent nothing\. Write the draft at once to `<packages>\/pool\/profiles\/<name>\.md`, so that a session that resumes finds it\. He corrects it at the gate/);
  // Who it is for is copied from the frame into the section Cast will read, with each profession's profile by its path.
  assert.match(steps, /"The people": first, whether the design is for one profession, for several or for everyone, as the frame says it: Cast reads it here\. Then the roles that reach it, and each profession's profile involved, by its id and its path/);
  assert.match(flat(outputOf('frame')), /One profile, several, or everyone/);
  assert.ok(read('templates/people/PROFILE-CARD.md').includes('Evidence: {fact, with its source · guess · unknown}'));
  assert.match(flat(section(text, 'Writes')), /A profession's profile that was missing, drafted at `<packages>\/pool\/profiles\/<name>\.md`, where setup's stubs are, and corrected there at the gate/);
  assert.match(flat(setup()), /A stub is one file for one profession, as `<packages>\/pool\/profiles\/front-desk-coordinator\.md`/);
  const gate = flat(section(text, 'Gate'));
  assert.match(gate, /Put `01-context\.md` in front of him, whole, with any profession's profile you drafted, and say which of its traits are guesses/);
  // The questions are put before the gate, one at a time, each answer written as it comes: the gate is one message.
  assert.deepEqual(boldSteps(section(text, 'Steps')).at(-1), [6, 'Put the questions to him before the gate, one at a time']);
  assert.match(steps, /Each of the "Questions for the founder", with its recommendation\. Write each answer into the context as it comes, in his words, where it belongs and beside its question: a session that stops midway loses none/);
  assert.match(gate, /what is wrong or missing in this context\? The gate is that one message from him: the questions of step 6 were put before it/);
  assert.doesNotMatch(gate, /one at a time/);
  assert.match(gate, /\*\*Write each correction where it belongs in the context, and all of them under `## Reviewed by the founder`:\*\* what he corrected, and the words he approved it with, as he said them\. Where a correction meets a fact you read, say so at once, with the source: he decides/);
  assert.match(gate, /\*\*Write what he corrects of a profession's profile into its file,\*\* `<packages>\/pool\/profiles\/<name>\.md`/);
  // What it carries: the sources, each profession's profile, and a section of the frame by its slug.
  assert.match(gate, /a `- source:<path>` line for each of the "Project sources" and for each profession's profile, by its path from the project's root; and a section of the frame that Intent needs, as `- frame@1#who-it-is-for`/);
  assert.ok(headings(outputOf('frame')).map(slug).includes('who-it-is-for'));
  // The short form is what the route's table says of an adjustment.
  assert.match(steps, /\*\*Routed `short`\*\* \(an adjustment\), Context is two things: what exists, and what changes/);
  assert.match(flat(reference('routes.md')), /a short Context \(what exists, what changes\)/);
  assert.match(steps, /"The founder's own words" are still asked for when the kind is `first-run`, `message` or `public-page`\. No seat reads the surface, and every other heading says "Not gathered: an adjustment"\. Steps 4 and 6 hold as written/);
});

test('intent: written from the corrected context and nothing else, with her card on top of her profession\'s profile, checked before it is used', () => {
  const text = stageSkill('intent');
  const opening = flat(text.slice(0, text.indexOf('\n## ')));
  assert.match(opening, /You write it from the corrected context, and from nothing else\. It describes no interface: it says what she needs, never what a screen holds/);
  const steps = flat(section(text, 'Steps'));
  assert.deepEqual(boldSteps(section(text, 'Steps')), [
    [1, 'Begin'], [2, 'Read the context, and what its carry list names'], [3, 'Write her card, on top of her profession\'s profile'], [4, 'Fill the template, heading by heading'],
    [5, 'Optional, and cheap: the profile judge reads the intent'],
  ]);
  assert.match(steps, /Copy `templates\/people\/PERSON-CARD\.md` to `<packages>\/pool\/persons\/<name>\.md`, the name in lower-case words joined by hyphens/);
  assert.match(steps, /Its header names the profession's profile she inherits, by its id, as `profile\.front-desk-coordinator`, and her specialty as that card names it\. Both are `none` when the design is for everyone/);
  assert.match(steps, /The card holds only what her profession's profile does not: one person, in one moment, for this surface/);
  // The card's own keys and values, as the checker and the template have them.
  const card = parse(read('templates/people/PERSON-CARD.md')).data;
  assert.deepEqual(Object.keys(card), ['id', 'profile', 'specialty', 'evidence']);
  assert.match(steps, /`evidence` says what the card rests on: `fact`, `guess` or `mixed`\. A card that is a guess says so in its first lines/);
  // The old quality bar, kept on the person, in the format's own words.
  const BAR = 'if the card does not force a design decision you would not have made anyway, it is not finished';
  assert.ok(steps.includes(`Its test: ${BAR}.`));
  assert.ok(flat(read('pool/CARD-FORMAT.md')).includes(BAR));
  // Checked with the command, before the page is filled.
  assert.ok(stageCommands('intent').includes('node <kit root>/scripts/card.mjs check <packages>/pool/persons/<name>.md'));
  inOrder(steps, [/Write her card, on top of her profession's profile/, /Then check it, as you check a card of hers that you reuse, and mend each fault the command prints until it prints `ok`/, /card\.mjs check <packages>\/pool\/persons\/<name>\.md/, /Fill the template, heading by heading/], 'the card is checked before the page is filled');
  assert.match(KIT.usage('scripts/card.mjs'), /"<file>: ok" when the card is sound/);
  assert.ok(nevers(text).includes('Never go on with a card the checker refuses'));
  assert.match(flat(section(text, 'Writes')), /Her card, at `<packages>\/pool\/persons\/<name>\.md`, from `templates\/people\/PERSON-CARD\.md`/);
  // A card that is reused is checked again, by the same command.
  assert.match(flat(section(text, 'Reads')), /a person already written for this surface and this moment is used, not written again, once her card is checked again, as step 3 says/);
  assert.match(steps, /Then check it, as you check a card of hers that you reuse, and mend each fault the command prints until it prints `ok`/);
  assert.match(flat(section(text, 'Writes')), /A flow gets the page for the whole, then a short `### <surface>` under each heading that differs from one surface to the next/);
});

test('intent: the success-criteria test, tasks as a starting situation and a goal, the ten states each filled or said not to occur, and the optional read', () => {
  const text = stageSkill('intent');
  const steps = flat(section(text, 'Steps'));
  const template = outputOf('intent');
  // The test of a criterion, as version 1 had it and the template keeps it.
  const TEST = 'The test: could two people disagree about whether it was met? Then sharpen it.';
  assert.ok(flat(template).includes(TEST));
  assert.ok(steps.includes(`"Success criteria": two or three testable sentences, each one checkable by looking at a screen. **${TEST}**`));
  assert.match(steps, /"Booking is quick" fails it\. "She can say which rooms are free now without scrolling, at phone width" passes/);
  // A task: where she starts and what she wants. Never the path.
  assert.match(steps, /"Tasks for the audience": each task is \*\*a starting situation and a goal, in her words\. Never the path, and never a criterion\.\*\* It is all an audience will be given/);
  assert.ok(flat(template).includes('Never the path, and never a criterion.'));
  assert.match(steps, /On a public page, in place of the tasks: that it is a public page, and where she arrives from/);
  assert.ok(flat(read('templates/briefs/audience.md')).includes('On a public page, in place of the tasks: that the design is a public page, and where she arrives from.'));
  // The ten states: each filled, or said not to occur, with the reason.
  assert.equal(tableRows(section(template, 'States')).slice(2).length, 10);
  assert.match(steps, /"States": the ten rows of the template, \*\*each one filled, or reading "cannot occur because …"\*\* with the reason\. A row says what the state must tell her or let her do, never how it looks/);
  assert.ok(flat(template).includes('Every row is filled, or reads "cannot occur because …". A row left out cannot be told from one forgotten.'));
  assert.match(steps, /A row left out cannot be told from one forgotten/);
  // The optional read by the profile judge: offered, a fresh sub-agent for each profession, one fix round.
  const read5 = steps.slice(steps.indexOf('5. **Optional, and cheap'));
  assert.ok(kitCards()['judge.profile']['sits-at'].includes('intent'));
  assert.match(read5, /Offer it when the design is for one profession or several: it costs one agent for each\. On his yes, start one `judge\.profile` for each profession's profile, each a fresh sub-agent, started as "Starting a seat" in the loop says, from a brief written from `templates\/briefs\/judge\.md`/);
  assert.match(read5, /it answers one thing: is the job stated as this profession would state it\?/);
  // A profile judge of the project's own replaces the kit's, and is checked before it is seated.
  assert.match(read5, /A card of the project's own with that id replaces the kit's, and is checked before it is seated, with `node <kit root>\/scripts\/card\.mjs check <packages>\/pool\/judges\/<name>\.md`: a faulty one is reported to the founder, with what the command printed, and left out, and the kit's card sits in its place: tell him so/);
  assert.match(flat(section(text, 'Reads')), /\*\*A profile judge of the project's own,\*\* in `<packages>\/pool\/judges\/`, if it is to read the intent: checked first, as step 5 says/);
  assert.match(read5, /No cast sheet exists yet: the brief says that no cut of the checks was made, and the judge runs on the model and the effort its card suggests \(`pool\/MODELS\.md`\), unless he says otherwise/);
  assert.match(read5, /What it marks `blocks` you mend, since the intent is yours to write, and a fresh judge reads it once more: one fix round, one re-read/);
  assert.match(read5, /Then write its verdict under "What the readers found", and each finding, fixed or open with the reason\. Its brief and its ledger stay in the package's `work\/` folder/);
  assert.ok(nevers(text).includes('Never sit in the profile judge\'s seat yourself'));
  // The short form is what the route's table says of an adjustment.
  assert.match(steps, /\*\*Routed `short`\*\* \(an adjustment\), Intent is two sentences and its criteria/);
  assert.match(flat(reference('routes.md')), /Intent in two sentences, with its criteria/);
  // The gate, and what it carries on: her card, the sources, and the sections of the context later stages are written from.
  const gate = flat(section(text, 'Gate'));
  assert.match(gate, /\*\*He approves\.\*\* Put `02-intent\.md` in front of him, with her card/);
  assert.match(gate, /Findings of the profile judge that stayed open go with it, each with your recommendation/);
  const carried = /for each section of the context a later stage is written from: its ((?:"[^"]+"(?:, | and )?)+)\./.exec(gate);
  assert.ok(carried, 'the sections of the context it carries');
  assert.deepEqual([...carried[1].matchAll(/"([^"]+)"/g)].map(([, heading]) => heading), ['The people', 'What the product can show and do', 'Constraints', 'The founder\'s own words']);
  for (const [, heading] of carried[1].matchAll(/"([^"]+)"/g)) assert.ok(headings(outputOf('context')).includes(heading), `01-context.md: ## ${heading}`);
  assert.match(gate, /A `- source:<path>` line, from the project's root, for her card, for her profession's profile and for each project source of the context/);
  for (const rule of ['Never give the path in a task', 'Never leave a state out', 'Never write a criterion two people could disagree about', 'Never put in her card what is true of her whole profession', 'Never read the world again, and never take from the chat']) {
    assert.ok(nevers(text).includes(rule), rule);
  }
});

test('cast: a project\'s own cards are checked before one is read, a faulty one is reported and left out, and the two pools are laid side by side', () => {
  const text = stageSkill('cast');
  const steps = flat(section(text, 'Steps'));
  assert.deepEqual(boldSteps(section(text, 'Steps')), [
    [1, 'Begin'], [2, 'Read the intent, and what its carry list names'], [3, 'Check the project\'s own cards before you read one'], [4, 'Lay the two pools side by side'],
    [5, 'Start from the preset'], [6, 'Load each seat that is loaded'], [7, 'Make the first cut of each judge\'s optional checks,'], [8, 'Write each seat\'s engine, and turn none on'],
    [9, 'Show each seat\'s suggested model and effort, as its card has them'], [10, 'Say why each seat is here, in one line: what it catches, and what it costs'],
    [11, 'Fill the rest of the sheet'],
  ]);
  // The check: every file of the four folders, in one run, as the command takes them.
  assert.ok(stageCommands('cast').includes('node <kit root>/scripts/card.mjs check <file>...'));
  assert.match(steps, /Name every `\.md` file of the project's `makers\/`, `judges\/`, `audiences\/` and `persons\/` folders in one run, each by its path, as `<packages>\/pool\/judges\/booking-truth\.md`/);
  const usage = KIT.usage('scripts/card.mjs');
  for (const folder of ['makers/', 'judges/', 'audiences/', 'persons/']) assert.ok(usage.includes(folder), `card.mjs checks ${folder}`);
  assert.match(steps, /It prints one line for each file\. `ok`: the card is sound, and you may read it\. A file named `README\.md` is passed over: it is never a card/);
  assert.match(usage, /A file named README\.md is never a card: it is\s+passed over/);
  assert.match(flat(setup()), /each with a one-line `README\.md`/);
  assert.match(steps, /Any other line is a fault, and \*\*a faulty card is reported to the founder, with its lines, and left out\*\*: it is not cast and not mended by you, and it is never skipped in silence: it has its line under "Left out"/);
  // A faulty card that carried a kit card's id: the kit's card sits, and what is left out is the replacement.
  assert.match(steps, /it has its line under "Left out"\. Where it carries the id of a kit card, the kit's card sits in its place, and the cast sheet says so: the line under "Left out" then names the project's replacement, not the seat/);
  assert.match(steps, /A profession's profile has no checker, and is read as it is written/);
  assert.ok(nevers(text).includes('Never cast a faulty card, and never skip one in silence'));
  // Two pools: the kit's index, and the project's own cards, which replace a kit card of the same id.
  const reads = flat(section(text, 'Reads'));
  assert.match(reads, /\*\*The kit's pool, on one page:\*\* `pool\/INDEX\.md`, every seat and every person in a row\. You choose from the index, not from the cards/);
  assert.match(reads, /\*\*The project's pool,\*\* `<packages>\/pool\/`: its own cards in `makers\/`, `judges\/` and `audiences\/`, its people in `persons\/`, each profession's profile in `profiles\/`\. Checked first: step 3/);
  assert.match(flat(read('pool/INDEX.md')), /Cast reads this page to choose seats, not the cards, and then the checks table of each judge it seats/);
  assert.match(steps, /\*\*Lay the two pools side by side\.\*\* The kit's seats and people are the rows of `pool\/INDEX\.md`\. The project's are its sound cards: read each one's header/);
  assert.match(steps, /\*\*A project card with the same id as a kit card replaces it for this project, and the cast sheet says so\*\* on that seat's line\. The same holds for a person/);
  assert.ok(read('pool/CARD-FORMAT.md').includes('A project card with the same id as a kit card replaces it.'));
  // The format and the README of each folder of a project's pool name the check.
  assert.match(flat(read('pool/CARD-FORMAT.md')), /A project's own card is checked before it is cast, and a person's before she is seated, with `node <kit root>\/scripts\/card\.mjs check <file>`\./);
  const readmes = rowsOf(section(setup(), 'Steps')).filter(row => /^`[a-z]+\/`$/.test(row[0]));
  assert.deepEqual(readmes.filter(([, says]) => says.endsWith(', and checked with the kit\'s `scripts/card.mjs`.')).map(([folder]) => unspan(folder)), ['persons/', 'makers/', 'judges/', 'audiences/']);
  // A README is read in the project, where nothing says what <kit root> is: the full command is the skill's.
  for (const [folder, says] of readmes) assert.doesNotMatch(says, /<kit root>/, folder);
  assert.match(flat(section(setup(), 'Steps')), /The check those lines name is `node <kit root>\/scripts\/card\.mjs check <file>`\./);
  inOrder(steps, [/Check the project's own cards before you read one/, /card\.mjs check <file>\.\.\./, /Lay the two pools side by side/, /Start from the preset/], 'the check comes before the cards are read');
  // The preset, then the project's pinned and banned seats; a seat sits only where its card sits and the route runs.
  assert.match(steps, /\*\*Start from the preset\*\* for this kind and size, in `references\/presets\.md`: each seat at the stages its row gives, then what the page adds by rule\. A stage the route runs that the row leaves empty is cast from the surface row for that stage\. Add each seat the project profile lists under `pinned`\. Take out each one under `banned`, and name it under "Left out": only the truth judge on a public page is not the project's to ban, and you tell the founder when the two meet/);
  assert.match(steps, /A seat sits only at a stage its card sits at \(the page's table of the seats has the kit's\), and only at a stage the route runs/);
  assert.ok(nevers(text).includes('Never cast a seat at a stage its card does not sit at'));
  assert.ok(nevers(text).includes('Never choose from the cards'));
});

test('cast: an engine that is off is shown and never turned on, an outside describer is cast only with a provider on, and model and effort are suggestions', () => {
  const text = stageSkill('cast');
  const steps = flat(section(text, 'Steps'));
  assert.match(steps, /\*\*Write each seat's engine, and turn none on\.\*\* A kit seat's engine is in the `## Engine check` table of the project profile, with what the check found\. A project seat's is in its card's header/);
  assert.match(steps, /A seat whose engine is `missing` or `off` is shown all the same: what the engine would add, that it is off, and what the seat does without it \(the last table of `references\/presets\.md`\)\. `engines-on` is the founder's line: you never add to it/);
  assert.match(steps, /`maker\.outside-describer` is cast only when `engines-on` lists a provider\. Its line of the cast sheet names the provider as it is listed, `model:openai` or `model:gemini`, and the model id the project profile holds for it, under `openai-model` or `gemini-model`/);
  assert.ok(read('templates/project/PROFILE.md').includes('`model:openai`, `model:gemini`, `tool:stitch`'));
  assert.match(steps, /Where both are listed, it has a line for each one that runs/);
  assert.match(steps, /`maker\.transcriber` is cast whenever `maker\.screen-generator` is, and stands by whenever an outside describer is, for an answer that does not come in the format/);
  assert.match(flat(read('pool/makers/outside-describer.md')), /An answer that is not in the format\*\* leaves `<out>\.raw\.txt`.*Cast a transcriber on that file/);
  const never = flat(section(text, 'Never'));
  assert.match(never, /\*\*Never turn an engine on\.\*\* Show what is off, and what it would add\. Never open or list a keys file, and never print the environment/);
  // Model and effort: shown as the card has them, proposed as suggestions, and whatever he chooses stands.
  assert.match(steps, /\*\*Show each seat's suggested model and effort, as its card has them\.\*\* `pool\/MODELS\.md` has the kit's, and a project card's header has its own\. A card that says `none` shows a dash, —/);
  assert.match(flat(read('templates/package/03-cast.md')), /a seat whose card says `none` shows a dash, —/);
  assert.match(steps, /Then propose, in a sentence that says these are suggestions he may change: a judge or an audience on a different model from the maker it reads, and the describers spread across models\. Whatever he chooses is written as he chose it/);
  assert.match(flat(read('pool/MODELS.md')), /They are suggestions, never instructions, and nothing in the kit enforces them/);
  assert.match(flat(section(text, 'Gate')), /A model he names is written as he named it: nothing here refuses it, and nothing puts the suggestion back/);
  assert.match(never, /\*\*Never write a suggestion as a rule\.\*\* A model and an effort are the card's suggestions and the founder's to change\. Never refuse a model he chooses, and never rewrite it/);
  for (const file of Object.values(folderOf('cast'))) assert.doesNotMatch(flat(file), /must run on|has to run on|always runs on|is required to run/i, 'nothing enforces a model');
});

test('cast: each seat explained in one line, the checks on and off, the fresh pass offered and never added, the count of agents, and nothing removed silently', () => {
  const text = stageSkill('cast');
  const steps = flat(section(text, 'Steps'));
  assert.match(steps, /\*\*Say why each seat is here, in one line: what it catches, and what it costs\.\*\*/);
  // Who is loaded with what.
  assert.match(steps, /`judge\.profile` sits once for each profession's profile the preset seats, loaded with it: `profile\.<name>`\. `audience\.task-reader` sits once for each person it is seated as, `person\.<name>`: the primary person, the one the intent names, and, where the preset seats a second, a contrast person the makers are not briefed on, from the project's people or the kit's five/);
  // Who it is for reaches Cast through the context's section, which the intent carries on: each link.
  assert.match(steps, /\*\*Load each seat that is loaded\.\*\* Whether the design is for one profession, for several or for everyone is in "The people" of the context, with each profession's profile by its path: the intent carries it on, as `- context@1#the-people`/);
  assert.equal(slug('The people'), 'the-people');
  assert.ok(headings(outputOf('context')).includes('The people'));
  assert.match(flat(section(stageSkill('context'), 'Steps')), /"The people": first, whether the design is for one profession, for several or for everyone, as the frame says it: Cast reads it here/);
  assert.match(flat(section(stageSkill('intent'), 'Gate')), /a later stage is written from: its "The people",/);
  assert.match(flat(section(presets(), 'Added by rule')), /when the context's people section says the experience is for one profession or for several/);
  for (const file of Object.values(folderOf('cast'))) assert.doesNotMatch(flat(file), /when Frame says|the frame says/i, 'Cast cannot read the frame');
  assert.deepEqual(['judge.profile', 'audience.task-reader'].map(id => kitCards()[id]['loaded-with']), ['profile', 'person']);
  // The checks: Cast makes the first cut from the card's table, and the judge tests every trigger again.
  assert.match(steps, /\*\*Make the first cut of each judge's optional checks,\*\* from the `## Optional checks` table of its card\. A check is on when the intent says its trigger will be there, and off otherwise, with the reason\. The core checks always run, and are not listed/);
  assert.match(steps, /The judge tests every trigger again on the artefact itself, and a check whose trigger it sees runs even where you left it off/);
  assert.ok(read('pool/judges/usability.md').includes('\n## Optional checks\n'));
  assert.match(flat(section(text, 'Reads')), /\*\*Of the card of each judge that sits, one section:\*\* `## Optional checks`/);
  // The rest of the sheet.
  assert.match(steps, /"Left out": each seat of the preset that does not sit, and what is lost without it\. Banned, faulty, its engine off, or not called for by this design: say which\. "None" when the preset sits whole/);
  assert.match(steps, /"Blind rules": who does not see what in this design, as `skills\/design\/references\/blind\.md` has it/);
  assert.match(steps, /Then any continuity maker cast to see the current layout, and why: only where the surface exists\. Or "None"/);
  assert.match(flat(reference('blind.md')), /The one exception is a continuity maker the cast names, who sees the current layout/);
  assert.match(steps, /"Fresh pass": for Structure and for Look, whether one runs, with which makers, on which engines, and why \(`references\/presets\.md` says who can make one\)\. It never runs at Detail\. \*\*It is offered, never added:\*\* write "does not run" unless he has asked for one/);
  assert.match(steps, /An engine the project has not turned on is never used/);
  assert.match(flat(reference('fresh-pass.md')), /You never add one yourself\. It costs agents, and it is his to ask for/);
  assert.ok(nevers(text).includes('Never add a fresh pass yourself'));
  assert.match(steps, /"Cost": the number of agents each stage starts, with makers, judges and audiences counted apart, and the total\. Count the rows, one for each instance\. An outside describer is a call the session makes, not an agent, and a transcriber that stands by counts only when it runs: say so beside the count/);
  assert.match(flat(read('pool/makers/outside-describer.md')), /No sub-agent sits in this seat: the conducting session runs it with a script/);
  // The short form: only the row it starts from differs. Every step holds, so nothing is counted and no door is closed.
  const short = flat(section(text, 'Steps')).slice(flat(section(text, 'Steps')).indexOf('**Routed `short`**'));
  assert.equal(short.trim(), '**Routed `short`** (an adjustment), only the row you start from differs: the adjustment row of the preset. Every step holds as written. A stage the route runs that the row leaves empty takes the cell of the surface row, the project\'s `pinned` seats are added and its `banned` ones taken out, and the truth judge sits on a public page.');
  assert.doesNotMatch(short, /Steps? \d|no audience|no fresh pass|one maker|one or two judges|and no more/);
  // It agrees with step 5 and with the page it starts from, which give an adjustment that runs Structure the surface row's cell.
  assert.match(steps, /A stage the route runs that the row leaves empty is cast from the surface row for that stage/);
  assert.match(flat(presets()), /an adjustment routed to run Structure gets the Structure cell of the surface row/);
  assert.match(flat(reference('fresh-pass.md')), /The founder can ask for one at any decision page/);
  assert.match(flat(reference('routes.md')), /a preset cast of one or two judges/);
  // The gate: he edits by exception, and after it nothing leaves the sheet in silence.
  const gate = flat(section(text, 'Gate'));
  assert.match(gate, /\*\*He edits by exception\.\*\* Put `03-cast\.md` in front of him: each seat with its one line, what it catches and what it costs, and the cost of the whole/);
  assert.match(gate, /A seat he takes out moves to "Left out", in his words/);
  assert.match(gate, /\*\*After the gate the sheet is his\.\*\* A later stage may add a seat or a check when the artefact calls for it, and says so\. Nothing is removed silently: a seat on the approved sheet sits, or he is told why it cannot, and the sheet changes with his yes/);
  // What it carries on: the intent, section by section, and what the intent itself carried.
  assert.match(gate, /A `- intent@1#<slug>` line for each section of the intent but "What the readers found" and the two last\. The `- context@1#<slug>` and `- source:<path>` lines of the intent's own carry list, as they are/);
  assert.match(gate, /And a `- source:<path>` line for each profession's profile that is loaded into a seat, and for each card and each person of the project's own that sits: a card of the kit is found in the kit, by its id/);
});

// The default cast, as the plan fixes it: the three rows, word for word.
const PRESET_ROWS = Object.freeze([
  '| adjustment | — | interaction designer or interface writer (whichever the change touches) · usability | visual designer · system fidelity (only if visual) | cold implementer | the judges that read it before |',
  '| surface, flow | 3 structure describers (3 lenses) · usability, truth · task reader with the primary person and one contrast person | interaction designer, interface writer, prototype builder · usability, truth, words, accessibility · task reader | visual designer · visual craft, system fidelity, accessibility | cold implementer | usability, accessibility, system fidelity, visual craft · task reader |',
  '| system | as surface, plus a fourth describer | as surface | Direction: 3 directions; then as surface | as surface | as surface |',
]);

test('presets.md: the default cast by size, word for word, and every seat it names is a card that sits at that stage and is preset for that size', () => {
  const text = presets();
  assert.deepEqual(headings(text), ['By size', 'Added by rule', 'The seats', 'A seat without its engine']);
  const bySize = section(text, 'By size');
  const [head, , ...sized] = tableRows(bySize);
  assert.deepEqual(head, ['Size', 'Structure', 'Detail', 'Look', 'Handoff', 'Acceptance']);
  assert.deepEqual(bySize.split('\n').filter(line => line.startsWith('| ') && !line.startsWith('| Size')), PRESET_ROWS);
  const stages = head.slice(1).map(stage => stage.toLowerCase());
  assert.deepEqual(stages, STAGES.slice(4));
  assert.deepEqual(sized.flatMap(([sizes]) => sizes.split(', ')), SIZES.slice(1), 'every size but a correction has its row');
  assert.match(flat(bySize), /A design sized `correction` casts no seat/);
  assert.match(flat(section(reference('routes.md'), 'A correction')), /\*\*No pool\.\*\* No seat is cast/);
  // The table of the seats: one row for each card of the kit, with what its card says.
  const cards = kitCards();
  const rows = rowsOf(section(text, 'The seats')).filter(row => isSeat(unspan(row[1] ?? '')));
  assert.deepEqual(rows.map(row => unspan(row[1])).sort(), Object.keys(cards).sort());
  assert.ok(rows.length >= 17, 'the seventeen seats the kit ships, at least');
  const dash = value => (value === 'none' ? '—' : `\`${value}\``);
  for (const [said, seat, sits, sizes, engine, model, effort] of rows) {
    const card = cards[unspan(seat)];
    assert.deepEqual([sits, sizes, engine, model, effort], [card['sits-at'].join(', '), card.presets.join(', ') || '—', `\`${card.engine}\``, dash(card['suggested-model']), dash(card['suggested-effort'])], card.id);
    assert.equal(said, card.presets.length ? card.id.split('.')[1].replace(/-/g, ' ') : 'by rule', card.id);
  }
  // Each seat a cell names sits at that stage and is preset for that size; and each card preset for a size is in its row.
  const named = rows.filter(([said]) => said !== 'by rule').map(([said, seat]) => [new RegExp(`\\b${said}s?\\b`), cards[unspan(seat)]]);
  for (const [sizes, ...cellsOf] of sized.slice(0, 2)) {
    for (const size of sizes.split(', ')) {
      const seated = new Set();
      cellsOf.forEach((cell, i) => {
        for (const [name, card] of named.filter(([name]) => name.test(cell))) {
          assert.ok(card['sits-at'].includes(stages[i]), `${card.id} is named at ${stages[i]} for ${size}, where its card does not sit`);
          assert.ok(card.presets.includes(size), `${card.id} is named for ${size}, which its card is not preset for`);
          seated.add(card.id);
        }
      });
      assert.deepEqual([...seated].sort(), Object.values(cards).filter(card => card.presets.includes(size)).map(card => card.id).sort(), size);
    }
  }
  // A system is cast as a surface: the same cards are preset for both.
  const presetFor = size => Object.values(cards).filter(card => card.presets.includes(size)).map(card => card.id).sort();
  assert.deepEqual(presetFor('system'), presetFor('surface'));
  assert.deepEqual(presetFor('correction'), []);
  // Added by rule: the cards preset for no size, and the two judges the kind brings in.
  const ruled = [...new Set(spansOf(section(text, 'Added by rule')).filter(isSeat))];
  assert.deepEqual(ruled.filter(id => cards[id].presets.length === 0).sort(), Object.values(cards).filter(card => card.presets.length === 0).map(card => card.id).sort());
  assert.deepEqual(ruled.filter(id => cards[id].presets.length > 0).sort(), ['judge.truth', 'judge.words']);
});

test('presets.md: what is added by rule, how the table is read, and what a seat does without its engine', () => {
  const text = presets();
  const byRule = flat(section(text, 'Added by rule'));
  // The truth judge sits on a public page at every size (the design sets no limit); the other lines keep "from a surface up".
  inOrder(byRule, [
    /At every size, an adjustment's short cast included:/, /`judge\.truth` always sits on a public page, at each stage of the route its card sits at\. It is never left out there/,
    /At any size from a surface up:/, /`judge\.profile`, once for each profession's profile/, /`judge\.words` gets its own question/,
  ], 'added by rule');
  assert.equal(kitCards()['judge.truth']['cast-when'], 'The design shows data or offers actions the product must really have, and always when it is a public page.');
  assert.match(byRule, /`judge\.profile`, once for each profession's profile, when the context's people section says the experience is for one profession or for several: at Frame, where no context exists yet, by Frame's own "Who it is for"\. When it says everyone, the project's own sit: with one profession's profile in the project's pool, its judge; with two or more, two contrasting ones, the least comfortable with technology and the one with the highest stakes\. Never all of them/);
  // The project's pinned and banned seats, at every size, and the one seat a project cannot ban.
  const intro = flat(text.slice(0, text.indexOf('\n## ')));
  assert.match(intro, /On top of it, at every size, the project's `pinned` seats always sit and its `banned` seats never do, with one exception: a project cannot ban the truth judge on a public page, and Cast tells the founder when the two meet/);
  assert.match(byRule, /It reads at Structure, at Detail, which is its main read, and at Acceptance; at Look only when a criterion that fires is about legibility or about where she uses it/);
  assert.match(byRule, /`judge\.truth` always sits on a public page/);
  assert.match(byRule, /`judge\.words` gets its own question to the founder when the kind is `first-run`, `message` or `public-page`/);
  // The conductor's table of the kinds says the same of the three.
  const kinds = Object.fromEntries(tableRows(section(reference('routes.md'), 'Kind')).map(row => [unspan(row[0]), row[3]]));
  assert.deepEqual([kinds['first-run'], kinds.message, kinds['public-page']], ['the words get their own review', 'the words get their own review', 'the truth judge always sits']);
  // The three makers the ruling adds: none sits by default.
  assert.match(byRule, /Three makers sit by rule too, and none of them by default:/);
  assert.match(byRule, /`maker\.outside-describer`, only when the project profile lists a provider under `engines-on`: `model:openai` or `model:gemini`\. It is one more describer at Structure, and at Look it sits only inside a fresh pass\. Its line of the cast sheet names the provider and the model id/);
  assert.match(byRule, /`maker\.screen-generator`, when a fresh pass is cast, or when the founder wants one more kind of proposal at Structure/);
  assert.equal(kitCards()['maker.screen-generator']['cast-when'], 'A fresh pass is cast, or the founder wants one more kind of proposal at Structure.');
  assert.match(byRule, /`maker\.transcriber`, whenever a screen generator is cast: it writes that concept into the format the board takes\. And it stands by whenever an outside describer is cast, for an answer that does not come in the format/);
  assert.match(byRule, /A fresh pass is made by makers that return a whole concept: the screen generator, and the outside describer when a provider is on\. It is the founder's to ask for, never part of a preset/);
  // How the table is read.
  const bySize = flat(section(text, 'By size'));
  const lenses = [...read('pool/makers/structure-describer.md').matchAll(/^ {3}- \*([A-Z][a-z ]+)\*: /gm)].map(([, lens]) => lens.toLowerCase());
  assert.deepEqual(lenses, ['fewest steps', 'guided', 'defaults first', 'in place']);
  assert.ok(bySize.includes(`the four the structure describer's card gives: ${lenses.join(', ')}`));
  assert.match(bySize, /Three describers take three of them, chosen for this design, and a fourth describer takes the fourth\. Each describer's line of the cast sheet names its lens/);
  assert.match(bySize, /At Structure it sits twice: as the primary person, the one the intent names, and as one contrast person the makers are not briefed on\. Where the table says only "task reader", it sits once, as the primary person/);
  assert.match(bySize, /\*\*Only if visual:\*\* an adjustment seats the visual designer and the system fidelity judge at Look when the change can be seen\. When it touches nothing she can see, Frame routes Look `skipped`, with the reason, and nobody is cast there/);
  // A stage the route runs and the row leaves empty: the surface row's cell, as for an adjustment that changes the structure.
  assert.match(bySize, /\*\*A stage the route runs that the size's row leaves empty is cast from the surface row for that stage:\*\* an adjustment routed to run Structure gets the Structure cell of the surface row/);
  const [, , ...sized] = tableRows(section(text, 'By size'));
  const cellOf = (size, stage) => sized.find(([sizes]) => sizes.split(', ').includes(size))[['structure', 'detail', 'look', 'handoff', 'acceptance'].indexOf(stage) + 1];
  assert.equal(cellOf('adjustment', 'structure'), '—');
  assert.equal(routeFor('adjustment').structure, 'skipped');
  assert.match(cellOf('surface', 'structure'), /^3 structure describers/);
  assert.deepEqual(['detail', 'look', 'handoff', 'acceptance'].filter(stage => cellOf('adjustment', stage) === '—'), [], 'no other stage an adjustment runs is left empty');
  assert.match(bySize, /\*\*The judges that read it before:\*\* at Acceptance, an adjustment is read by the judges that read it at Detail and at Look/);
  // A direction is the visual designer's, as its card says; with no design system Look opens the same way.
  assert.match(bySize, /\*\*Direction:\*\* three directions, each drawn by one `maker\.visual-designer` cast for a direction, each with a lens of its own\. He picks one, and then Look is cast as for a surface/);
  assert.match(read('pool/makers/visual-designer.md'), /\*\*When you are cast for a direction\*\*/);
  assert.match(bySize, /Where the foundation is `no-system`, Look opens the same way whatever the size, from a surface up \(`skills\/design\/references\/routes\.md`\)/);
  assert.match(flat(section(reference('routes.md'), 'Foundation')), /`no-system` \| there is no design system \| Look runs once as a direction first/);
  // The seats with an engine of their own: every card whose engine is not its own text, and no other.
  const cards = kitCards();
  const engines = rowsOf(section(text, 'A seat without its engine')).filter(row => isSeat(unspan(row[0])));
  assert.deepEqual(Object.fromEntries(engines.map(([seat, engine]) => [unspan(seat), unspan(engine)])), Object.fromEntries(Object.values(cards).filter(card => card.engine !== 'own').map(card => [card.id, card.engine])));
  for (const [seat, , adds, without] of engines) assert.ok(/\.$/.test(adds) && /\.$/.test(without), `${seat}: what its engine adds, and what it does without it`);
  const without = Object.fromEntries(engines.map(([seat, , , said]) => [unspan(seat), said]));
  // What each does without it is its card's own word.
  for (const [id, file] of [['maker.visual-designer', 'pool/makers/visual-designer.md'], ['judge.visual-craft', 'pool/judges/visual-craft.md']]) {
    assert.equal(without[id], 'The seat runs on its card\'s own text.');
    assert.match(read(file), /Without it, this card is enough\./, file);
  }
  assert.equal(without['maker.outside-describer'], 'The seat is not cast.');
  assert.match(read('pool/makers/outside-describer.md'), /\*\*Without the engine\*\* the seat is not cast\./);
  assert.match(without['maker.screen-generator'], /^The seat still sits when it is cast: a Claude maker writes the same screens as free pages, with a taste skill as its lens\.$/);
  assert.match(read('pool/makers/screen-generator.md'), /### Without the tool\n\nThe seat still sits\. A Claude maker writes the same one or two screens as free HTML/);
  assert.match(flat(section(text, 'A seat without its engine')), /Every card works without its engine\. The project profile's `## Engine check` says what each engine answered on this machine: Frame lists the ones that are missing or off, and Cast shows them on the cast sheet\. Neither turns one on/);
  // The read of a surface as it is belongs to Context, and is no part of a cast.
  assert.match(flat(section(text, 'The seats')), /The two judges that sit at `context` read a surface that exists, as it is, before anything else: that read is Context's, not part of a cast/);
});

test('the four opening stages run as written: each state and card command with its placeholders filled, each output stamped on the built-from and the carry list its skill gives', () => {
  const project = join(scratchRoot, 'a clinic');
  const pool = join(project, 'design', 'pool');
  for (const folder of ['profiles', 'persons', 'makers', 'judges', 'audiences']) {
    mkdirSync(join(pool, folder), { recursive: true });
    writeFileSync(join(pool, folder, 'README.md'), 'This project\'s own.\n');
  }
  const FILL = {
    '<kit root>/': fileURLToPath(root), '<packages>': 'design', '<package>': 'design/today', '<name>': 'today', '<kind>': 'working-surface', '<foundation>': 'new-surface',
    '<size>': 'surface', '<stage>': 'look', '<full|short|skipped>': 'full', '<why>': 'he asked for the whole look', '<the founder\'s words>': 'sí, adelante', '<the one question>': 'Is it right?',
  };
  // A command as a skill writes it, run from the project's root with each placeholder filled.
  const exec = (command, more = {}, files = []) => {
    const fill = { ...FILL, ...more };
    const filled = word => Object.entries(fill).reduce((text, [slot, value]) => text.split(slot).join(value), word.replace(/^"(.*)"$/, '$1'));
    return spawnSync(process.execPath, words(command).slice(1).flatMap(word => (word === '<file>...' ? files : [filled(word)])), { cwd: project, encoding: 'utf8' });
  };
  // The same, for a command that must succeed: what it printed.
  const run = (command, more, files) => {
    const done = exec(command, more, files);
    assert.deepEqual([done.status, done.stderr], [0, ''], `${command}\n${done.stdout}`);
    return done.stdout.trim();
  };
  // The one command of a stage that starts with these words.
  const commandOf = (name, start) => {
    const found = [...new Set(stageCommands(name))].filter(command => command.startsWith(`node <kit root>/scripts/${start}`));
    assert.equal(found.length, 1, `${name}: one command that starts ${start}`);
    return found[0];
  };
  // A stage's output: its template, with the built-from its skill gives and the carry list it writes.
  const builtFrom = name => /`built-from: (\[[^\]]*\])`/.exec(section(stageSkill(name), 'Writes'))[1];
  const write = (name, carry, inputs = name === 'frame' ? '[]' : builtFrom(name)) => {
    const text = read(`templates/package/${ARTEFACT[name]}`);
    assert.ok(text.endsWith('\n## Carry\n') && text.includes('\nbuilt-from: []\n'), name);
    writeFileSync(join(project, 'design', 'today', ARTEFACT[name]), `${text.replace('built-from: []', `built-from: ${inputs}`)}\n${carry.join('\n')}\n`);
  };
  const STAMPED = name => new RegExp(`^stamped ${name} approved at version 1 on \\d{4}-\\d\\d-\\d\\d$`);
  const slugOf = (name, heading) => run(commandOf(name, 'state.mjs slug'), { '<heading text>': heading });
  const SOURCE = '- source:src/styles/tokens.css';

  // Frame: the package is made and begun, a stage is routed with its reason, and the frame is stamped.
  assert.equal(run(commandOf('frame', 'state.mjs init')), 'initialised design/today: working-surface, new-surface, surface; next: frame');
  assert.equal(run(commandOf('frame', 'state.mjs begin')), 'frame is in work');
  assert.equal(run(commandOf('frame', 'state.mjs route')), 'look is routed full');
  assert.match(run(commandOf('frame', 'state.mjs status')), /^\| look \| full \| not-started \| — \| — \| — \| `06-look\/LOOK\.md` \| he asked for the whole look \(set full on /m);
  const [, profileLine] = /as `(- source:design\/pool\/profiles\/[a-z-]+\.md)`/.exec(flat(section(stageSkill('frame'), 'Gate')));
  write('frame', [profileLine]);
  assert.match(run(commandOf('frame', 'state.mjs stamp')), STAMPED('frame'));

  // Context: begun, awaiting with its one question, and stamped carrying a section of the frame by its slug.
  assert.equal(run(commandOf('context', 'state.mjs begin')), 'context is in work');
  // A judge of the project's own is checked by the command Context gives, and by the one Intent gives: sound, then faulty.
  const judge = ['---', 'id: judge.booking-truth', 'shelf: judge', 'job: Is every room shown one the clinic has?', 'sits-at: [context, detail]', 'cast-when: The design shows rooms.',
    'presets: []', 'loaded-with: none', 'reads: [brief, pictures]', 'never-reads: [maker-notes, author-map, other-ledgers]', 'engine: own', 'suggested-model: opus', 'suggested-effort: high',
    'verified: 2026-11-14', '---', '# Booking truth', '', 'A judge of this clinic\'s own.', '', '## Core checks', '', '1. Every room shown exists.', '2. Every free room can be booked.', '',
    '## Optional checks', '', '| id | trigger | method |', '|---|---|---|', '', '## Method', '', 'Read the pictures, room by room.', '', '## Output', '', 'One ledger.', '',
    '## Never', '', '- Never list a room the clinic does not have.', '', '## Borrowed', '', 'Nothing.', ''].join('\n');
  writeFileSync(join(pool, 'judges', 'booking-truth.md'), judge);
  for (const name of ['context', 'intent']) {
    assert.equal(run(commandOf(name, 'card.mjs check <packages>/pool/judges'), { '<name>': 'booking-truth' }), 'design/pool/judges/booking-truth.md: ok', name);
  }
  writeFileSync(join(pool, 'judges', 'desk-privacy.md'), judge.replace('verified: 2026-11-14\n', ''));
  const faulty = exec(commandOf('context', 'card.mjs check <packages>/pool/judges'), { '<name>': 'desk-privacy' });
  assert.deepEqual([faulty.status, faulty.stderr], [1, '']);
  assert.match(faulty.stdout, /^design\/pool\/judges\/desk-privacy\.md: header: "id" names "booking-truth"/);
  rmSync(join(pool, 'judges', 'desk-privacy.md'));
  const [, frameLine] = /as `(- frame@1#[a-z-]+)`/.exec(flat(section(stageSkill('context'), 'Gate')));
  assert.equal(frameLine, `- frame@1#${slugOf('context', 'Who it is for')}`);
  write('context', [SOURCE, profileLine, frameLine]);
  assert.equal(run(commandOf('context', 'state.mjs await')), 'context awaits the founder');
  assert.match(run(commandOf('context', 'state.mjs stamp')), STAMPED('context'));

  // Intent: her card is checked, then the page is stamped carrying the sections of the context its skill names.
  const person = ['---', 'id: person.desk-cover', 'profile: none', 'specialty: none', 'evidence: guess', '---', '# Desk cover', '', 'A guess: nobody has been heard.', '',
    '## The moment', '', 'She is alone at the front desk, and the phone is ringing.', '', '## The job', '', 'Find the caller a free room before he rings off.', '',
    '## What she never does', '', '- Read a help page with someone waiting.', '', '## The check', '', 'Would she know what to press first?', ''].join('\n');
  writeFileSync(join(pool, 'persons', 'desk-cover.md'), person);
  assert.equal(run(commandOf('intent', 'card.mjs check <packages>/pool/persons'), { '<name>': 'desk-cover' }), 'design/pool/persons/desk-cover.md: ok');
  assert.equal(run(commandOf('intent', 'state.mjs begin')), 'intent is in work');
  const [, carried] = /a later stage is written from: its ((?:"[^"]+"(?:, | and )?)+)\./.exec(flat(section(stageSkill('intent'), 'Gate')));
  const contextLines = [...carried.matchAll(/"([^"]+)"/g)].map(([, heading]) => `- context@1#${slugOf('intent', heading)}`);
  assert.equal(contextLines.length, 4);
  assert.ok(contextLines.includes('- context@1#the-people'), 'who it is for goes on to Cast');
  const sources = ['- source:design/pool/persons/desk-cover.md', SOURCE];
  write('intent', [...sources, ...contextLines]);
  assert.equal(run(commandOf('intent', 'state.mjs await')), 'intent awaits the founder');
  assert.match(run(commandOf('intent', 'state.mjs stamp')), STAMPED('intent'));

  // Cast: the project's pool is checked in one run, READMEs and all, and the sheet is stamped on the intent and the context.
  const files = ['makers', 'judges', 'audiences', 'persons'].flatMap(folder => readdirSync(join(pool, folder)).sort().map(file => `design/pool/${folder}/${file}`));
  assert.deepEqual(run(commandOf('cast', 'card.mjs check'), {}, files).split('\n'), [
    ...['makers', 'judges', 'audiences', 'persons'].map(folder => `design/pool/${folder}/README.md: passed over: a README.md is never a card`), 'design/pool/persons/desk-cover.md: ok',
    'design/pool/judges/booking-truth.md: ok',
  ].sort((a, b) => files.indexOf(a.split(': ')[0]) - files.indexOf(b.split(': ')[0])));
  assert.equal(run(commandOf('cast', 'state.mjs begin')), 'cast is in work');
  assert.match(run(commandOf('cast', 'state.mjs status')), /^- Kind: working-surface\n- Foundation: new-surface\n- Size: surface$/m);
  const intentLines = headings(outputOf('intent')).slice(0, -2).filter(heading => heading !== 'What the readers found').map(heading => `- intent@1#${slugOf('cast', heading)}`);
  assert.equal(intentLines.length, 10);
  // Built from the intent alone, the sheet could not carry a section of the context: the stamp refuses it, and says why.
  write('cast', [...intentLines, ...contextLines, ...sources], '[intent@1]');
  const refused = exec(commandOf('cast', 'state.mjs stamp'));
  assert.deepEqual([refused.status, refused.stdout], [1, '']);
  assert.equal(refused.stderr.trimEnd().split('\n').length, 1 + contextLines.length, refused.stderr);
  assert.match(refused.stderr, /^cast cannot be stamped:\n- "- context@1#the-people" names context, which cast is not built from; add it to built-from\n/);
  assert.equal(builtFrom('cast'), '[intent@1, context@1]');
  // With a line for a profession's profile loaded into a seat, and one for the project's own judge that sits.
  write('cast', [...intentLines, ...contextLines, ...sources, profileLine, '- source:design/pool/judges/booking-truth.md']);
  assert.equal(run(commandOf('cast', 'state.mjs await')), 'cast awaits the founder');
  assert.match(run(commandOf('cast', 'state.mjs stamp')), STAMPED('cast'));

  // The package stands as the conductor asks it to: nothing stale, nothing unresolved, and Structure next.
  assert.equal(run('node <kit root>/scripts/state.mjs validate <package>'), 'ok');
  assert.equal(run('node <kit root>/scripts/state.mjs next <package>'), 'structure');
  assert.deepEqual(parse(readFileSync(join(project, 'design', 'today', ARTEFACT.cast), 'utf8')).data['built-from'], ['intent@1', 'context@1']);
});

// ---- Structure: what skills/structure was written to say

const structureRef = name => read(`skills/structure/references/${name}`);
// The numbered step of a text that opens with this name in bold: its words, to the next numbered step.
const stepOf = (text, name) => {
  const from = text.search(new RegExp(`^\\d+\\. \\*\\*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'));
  assert.notEqual(from, -1, name);
  const rest = text.slice(from + 1);
  const to = rest.search(/^\d+\. \*\*/m);
  return flat(text.slice(from, to === -1 ? undefined : from + 1 + to));
};
// What is under one `### ` heading, to the next heading.
const subsection = (text, name) => {
  const lines = text.split('\n');
  const from = lines.indexOf(`### ${name}`);
  assert.notEqual(from, -1, `### ${name}`);
  const to = lines.findIndex((line, i) => i > from && /^#{2,3} /.test(line));
  return lines.slice(from + 1, to === -1 ? undefined : to).join('\n');
};
// The bullets of a text that open with a lead in bold: what each says, as one line, by its lead.
const leads = text => Object.fromEntries(text.split(/\n(?=- )/).map(bullet => /^- \*\*(.+?)[.:,]?\*\*(.*)$/.exec(flat(bullet).trim())).filter(Boolean).map(([, lead, rest]) => [lead, rest.trim()]));
// The cards of the kit that sit at Structure, by id.
const structureCards = () => Object.fromEntries(Object.entries(kitCards()).filter(([, card]) => card['sits-at'].includes('structure')));
// What a card may name that no package holds while Structure runs: it comes with a later stage.
const AFTER_STRUCTURE = Object.freeze(['chosen-structure', 'states-and-rules', 'strings', 'prototype', 'final-screens', 'build', 'handoff-folder', 'earlier-ledger']);
// What a card's `reads` allows, as the seat's hand-over names it in this package.
const HANDED = Object.freeze({
  'walkthrough-format': /`kit\/KIT-CONTRACT\.md`/, 'source-screen': /`<package>\/04-structure\/fresh\/`/, intent: /`<package>\/02-intent\.md`/, context: /`<package>\/01-context\.md`/,
  'product-facts': /the project's facts document/, options: /`<package>\/04-structure\/board\/`, the board folder, whole/, pictures: /pictures|the board folder, whole/, profile: /Its profession's profile, whole/,
  person: /her card/, 'profile-traits': /Her profession's traits/,
});
// What a card's `never-reads` names, as the seat's brief lists it, or as the hand-over keeps it out.
const KEPT_OUT = Object.freeze({
  'other-proposals': /`<package>\/04-structure\/proposals\/`|no other proposal/, 'session-idea': /idea of yours/, 'current-screens': /today's screens?/, 'design-system': /design system/,
  kit: /the project's kit/, 'sibling-surfaces': /sibling surfaces/, 'describers-brief': /`<package>\/04-structure\/BRIEF\.md`/, 'generator-prompt': /the prompt kept beside a generated screen/,
  intent: /`<package>\/02-intent\.md`/, 'maker-notes': /`<package>\/work\/`/, 'author-map': /`<package>\/04-structure\/MAP\.sealed\.json`/, 'other-ledgers': /every file of `<package>\/04-structure\/reads\/` but its own/,
  'task-reads': /every file of `<package>\/04-structure\/reads\/` but its own/, package: /every other file of the package/, profile: /her profession's profile itself/,
});

test('structure: the six sections and no other, the question the conductor gives it, and the conductor\'s rules pointed to, never copied', () => {
  const text = stageSkill('structure');
  assert.deepEqual(headings(text), STAGE_SECTIONS);
  const [, , , question, output, does] = stageRows().find(row => row[1] === 'Structure');
  assert.equal(section(text, 'Question').trim(), question);
  assert.deepEqual([unspan(output), does], [ARTEFACT.structure, 'picks, from pictures']);
  assert.ok(flat(section(text, 'Gate')).startsWith(' **He picks, from pictures.**'));
  const opening = flat(text.slice(0, text.indexOf('\n## ')));
  assert.match(opening, /You propose none, mend none, drop none and choose none: the stage is its blinds and its two stops/);
  assert.match(opening, /The conductor \(`ux:design`\) sent you, and its words are yours\. Its loop is in `skills\/design\/references\/loop\.md`: this page says only what is Structure's own\./);
  assert.match(opening, /Read `skills\/design\/references\/blind\.md` and `skills\/design\/references\/fresh-pass\.md` before step 3/);
  assert.match(opening, /Run it from the project's root\. `<packages>` is the folder that holds the project's packages: `design` at the project's root, unless the project profile names another under `packages`\. `<package>` is the folder of this design in it, as `design\/today`\./);
  assert.match(opening, /`<kit dir>` is the project's kit folder, the one the project profile names under `kit`/);
  assert.ok(profileKeys().includes('kit'));
  assert.equal(new URL('../../', at('skills/structure/')).href, root.href);
  // Its long forms are two references of its own, each pointed to from SKILL.md, which stays within the limit.
  assert.deepEqual(filesUnder('skills/structure/'), ['SKILL.md', 'references/rounds.md', 'references/seats.md']);
  assert.deepEqual(ownReferences(text).sort(), ['references/rounds.md', 'references/seats.md']);
  assert.ok(lineCount(text) <= MAX_LINES);
  // The loop, the blind rules and the fresh pass are the conductor's: no file of Structure copies them.
  for (const [file, body] of Object.entries(folderOf('structure'))) {
    assert.doesNotMatch(flat(body), /Every stage runs the same nine steps|\*\*One fix round and one re-read,\*\* and no more|A fresh sub-agent\.\*\* Start it with the Agent tool|\*\*Component names\.\*\*|Letters by shuffle|Three outcomes, and only three/, file);
    // And the word profile is the project profile, a profession's profile, the profile judge, an id, a path or a flag, as in the conductor.
    const rest = flat(body).replace(/project profile|profession's profile|profile judge|judge\.profile|profile\.<name>|--profile|PROFILE\.md/g, '');
    assert.doesNotMatch(rest, /profile/i, `structure/${file}: "profile" alone says neither the project profile nor a profession's profile`);
  }
  // Its example is the kit's own product: a room, never a real one.
  assert.match(text, /\brooms?\b/);
});

test('structure: it reads the cast sheet and what its carry list names, and writes one round into 04-structure, its output built from the cast, the intent and the context', () => {
  const text = stageSkill('structure');
  const reads = flat(section(text, 'Reads'));
  assert.match(reads, /\*\*The cast sheet,\*\* `<package>\/03-cast\.md`, approved, and exactly what its carry list names/);
  assert.equal(ARTEFACT.cast, '03-cast.md');
  // The three sections of the cast sheet it reads are sections of the sheet.
  for (const name of ['Structure', 'Blind rules', 'Fresh pass']) {
    assert.ok(reads.includes(`"${name}`), name);
    assert.ok(headings(outputOf('cast')).includes(name), name);
  }
  assert.match(reads, /its suggested model and effort/);
  // Each key of the project profile it reads is a key of the template, and none of them is about a key.
  const keys = spansOf(section(text, 'Reads').split('\n- ').find(bullet => bullet.startsWith('**The project profile,**'))).filter(span => !span.includes('/'));
  assert.deepEqual(keys, ['kit', 'facts', 'engines-on', 'openai-model', 'gemini-model']);
  for (const key of keys) assert.ok(profileKeys().includes(key), key);
  assert.match(reads, /and nothing about a key/);
  assert.match(reads, /one card: `pool\/makers\/outside-describer\.md`, which speaks to you\. Every other card is read by its seat/);
  assert.match(read('pool/makers/outside-describer.md'), /This card speaks to that session/);
  assert.match(reads, /\*\*Never\*\* today's screen, the package's `work\/` folder, `<package>\/04-structure\/earlier\/`, or the chat/);
  // What it writes: everything the round holds, and each template it is written from.
  const writes = section(text, 'Writes');
  assert.match(flat(writes), /Everything below is in `<package>\/04-structure\/`, and the seats' briefs in `<package>\/work\/`/);
  const rows = tableRows(writes).slice(2);
  assert.deepEqual(rows.flatMap(([first]) => spansOf(first)), ['BRIEF.md', 'BRIEF-fresh.md', 'proposals/', 'fresh/', 'board/', MAP, PICK, 'reads/', 'decision.json', 'decision.html', 'chosen/', 'earlier/', 'CHOSEN.md']);
  assert.deepEqual(kitPaths(writes).sort(), ['templates/outputs/LEDGER.md', 'templates/outputs/PICK.md', 'templates/outputs/TASK-READ.md', 'templates/outputs/decision.json',
    'templates/package/04-structure/BRIEF-fresh.md', 'templates/package/04-structure/BRIEF.md', `templates/package/${ARTEFACT.structure}`]);
  assert.deepEqual(filesUnder('templates/package/04-structure/'), ['BRIEF-fresh.md', 'BRIEF.md', 'CHOSEN.md']);
  // The output carries sections of the cast, the intent and the context on, so it is built from all three.
  assert.match(flat(writes), /The output is built from the cast, the intent and the context, each at the version it was approved at/);
  assert.match(writes, /`CHOSEN\.md` \| the stage's output, with `built-from: \[cast@1, intent@1, context@1\]`/);
  assert.match(flat(stepOf(section(text, 'Steps'), 'Read the cast sheet')), /Copy the template to `<package>\/04-structure\/CHOSEN\.md` and write `built-from`, unless the file is already there: then go on from what it holds\./);
  // At the gate every heading of the template is filled, and none the template lacks.
  const gate = flat(section(text, 'Gate'));
  const fill = gate.slice(gate.indexOf('**Fill `CHOSEN.md`,**'), gate.indexOf('**Write the carry list,**'));
  const filled = [...fill.matchAll(/"([A-Z][^"]+)"|`## ([^`]+)`/g)].map(([, quoted, spanned]) => quoted ?? spanned).filter(name => name !== 'Nothing');
  assert.deepEqual([...filled, 'Carry'], headings(outputOf('structure')));
  inOrder(gate, [/Under `## Reviewed by the founder`, after his yes to the brief: what he asked to be changed on the way to Detail, as he said it, or "Nothing"/, /\*\*Write the carry list,\*\* `## Carry`: the lines of the cast sheet's own carry list, as they are/,
    /a `- cast@1#<slug>` line for the table of each stage still to run, for "Blind rules" and for "Fresh pass"/, /a `- source:<path>` line, from the project's root, for the chosen proposal's file, for each of its pictures and for `PICK\.md`/,
    /\*\*Stamp it,\*\* in the words he picked with/, /state\.mjs stamp <package> structure --words/, /Then append the decision to the package's `DECISIONS\.md`, and ask the state what is next, as step 9 of the loop says/], 'the gate, after the pick');
});

test('structure: the map and the pick sit beside the board and never in it, and the board holds the letters, the pages and the pictures', () => {
  const text = stageSkill('structure');
  assert.equal(`${MAP} ${PICK}`, 'MAP.sealed.json PICK.md');
  for (const path of [`\`<package>/04-structure/${MAP}\``, `\`<package>/04-structure/${PICK}\``, '<package>/04-structure/board ']) assert.ok(text.includes(path), path);
  // No file of the skill puts the map, the pick, the decision page or a redrawn pick in the board.
  for (const [file, body] of Object.entries(folderOf('structure'))) assert.doesNotMatch(body, /board\/(?:MAP|PICK|decision|chosen)/, file);
  const steps = section(text, 'Steps');
  const drawn = stepOf(steps, 'Merge, draw, photograph');
  assert.match(drawn, /writes the map to `<package>\/04-structure\/MAP\.sealed\.json`: beside the board, never in it/);
  assert.match(drawn, /The board holds the letters' files, the drawn pages with the kit's stylesheets, and the pictures: nothing else is ever put in it/);
  assert.match(drawn, /From here on an option is its letter, to you as to everyone/);
  // The pictures are taken into the board, where the conductor puts them, and the decision page is built beside it.
  const commands = stageCommands('structure');
  assert.ok(commands.includes('node <kit root>/scripts/shots.mjs <package>/04-structure/board --out <package>/04-structure/board --widths <primary>,<phone>'));
  assert.ok(commands.includes('node <kit root>/scripts/page.mjs <package>/04-structure/decision.json --out <package>/04-structure/decision.html'));
  assert.match(flat(reference('blind.md')), /scripts\/shots\.mjs <board dir> --out <board dir> --widths/);
  // The pick: from its template, beside the board, one line and his words under it.
  const gate = flat(section(text, 'Gate'));
  assert.match(gate, /\*\*Write `<package>\/04-structure\/PICK\.md`,\*\* from `templates\/outputs\/PICK\.md`: the line `Pick: <letter \| none>`, on a line of its own, and the founder's words under it, as he said them/);
  assert.match(read('templates/outputs/PICK.md'), /^Pick: \{[^}\n]+\}$/m);
  assert.match(gate, /A graft is written exactly, as "B, with A's status treatment", and the line still names one letter/);
  // A graft or a redrawn pick never goes in the board: it has a folder of its own.
  assert.match(gate, /\*\*A pick with a graft is redrawn once and read again once,\*\* in `<package>\/04-structure\/chosen\/`, never in the board/);
  assert.match(flat(structureRef('rounds.md')), /to `<package>\/04-structure\/chosen\/chosen\.json`\. Never to the board: a graft or a redrawn pick saved there as a one-letter `\.json` would no longer match the map, and the map would not open/);
  assert.ok(nevers(text).includes('Never put a decision page, a fresh screen or a graft in the board'));
});

test('structure: a judge is handed the board folder, an audience the pictures only, and each seat what its card reads and no more', () => {
  const text = stageSkill('structure');
  const readers = stepOf(section(text, 'Steps'), 'Start the readers, by letter');
  assert.match(readers, /The judges and the audiences of the cast sheet's "Structure" table, each a fresh sub-agent: the judges in one message, then the audiences/);
  // In the conductor's own words for it.
  const HANDS = /a judge is handed the board folder and nothing else; an audience is handed the pictures only/;
  assert.match(flat(reference('blind.md')), HANDS);
  assert.match(readers, new RegExp(`Of \`<package>/04-structure/\`, ${HANDS.source}, each by its path`));
  // The four things the conductor has every reader's brief list, then what Structure adds to them.
  assert.match(flat(reference('blind.md')), /list four things under "Do not open": the package's `work\/` folder, where the makers' briefs are, the map, the pick and the proposals folder/);
  assert.match(readers, /Every reader's brief lists under "Do not open": `<package>\/work\/`, where the makers' briefs are, `<package>\/04-structure\/MAP\.sealed\.json`, `<package>\/04-structure\/PICK\.md` and `<package>\/04-structure\/proposals\/`; then `<package>\/04-structure\/fresh\/`, the two briefs and every other reader's file/);
  assert.match(readers, /What else each is handed, from the approved stages, is in `references\/seats\.md`/);
  assert.ok(nevers(text).includes('Never hand a reader the folder above the board'));
  assert.ok(nevers(text).includes('Never say who made a letter'));

  // seats.md: one section for each card of the kit that sits at Structure, and for no other.
  const seats = structureRef('seats.md');
  assert.deepEqual(headings(seats), ['The makers', 'The readers']);
  const cards = structureCards();
  const sections = seats.split('\n').map(line => /^### `(.+)`$/.exec(line)?.[1]).filter(Boolean);
  assert.deepEqual([...sections].sort(), Object.keys(cards).sort());
  assert.deepEqual(sections, ['maker.structure-describer', 'maker.outside-describer', 'maker.screen-generator', 'maker.transcriber', 'judge.usability', 'judge.truth', 'judge.profile', 'audience.task-reader']);
  for (const shelf of ['maker', 'judge', 'audience']) assert.ok(existsSync(at(`templates/briefs/${shelf}.md`)), shelf);
  // What every reader's brief lists, said once for them all.
  const common = flat(section(seats, 'The readers').split('\n### ')[0]);
  for (const path of ['<package>/work/', `<package>/04-structure/${MAP}`, `<package>/04-structure/${PICK}`, '<package>/04-structure/proposals/', '<package>/04-structure/fresh/', '<package>/04-structure/BRIEF.md',
    '<package>/04-structure/BRIEF-fresh.md', '<package>/04-structure/earlier/']) assert.ok(common.includes(`\`${path}\``), path);
  assert.match(common, /the judges in one message, so that no ledger exists while another judge reads, then the audiences\. They read by letter/);

  for (const [id, card] of Object.entries(cards)) {
    const part = subsection(seats, `\`${id}\``);
    const said = leads(part);
    const reader = card.shelf !== 'maker';
    for (const lead of ['Handed', 'Do not open', 'Writes']) assert.ok(said[lead], `${id}: ${lead}`);
    // Every seat a sub-agent sits in has its brief from its shelf's template; the outside describer is a script.
    if (id === 'maker.outside-describer') assert.match(flat(part), /No sub-agent sits here\. You run the command of step 5/);
    else if (id !== 'maker.screen-generator' && id !== 'maker.transcriber') assert.ok(said['Its brief'].includes(`\`templates/briefs/${card.shelf}.md\``), `${id}: its brief`);
    // What its card reads, it is handed. Today's screens are the usability judge's at Context, and nobody's here.
    for (const token of card.reads) {
      if (token === 'brief' || AFTER_STRUCTURE.includes(token) || (id === 'judge.usability' && token === 'current-screens')) continue;
      assert.ok(HANDED[token], `${id}: ${token} has no hand-over the test knows`);
      assert.match(said.Handed, HANDED[token], `${id}: reads ${token}`);
    }
    // What its card does not read, it is not: the intent, the context and the format go only where a card allows them.
    for (const token of ['intent', 'context', 'walkthrough-format']) if (!card.reads.includes(token)) assert.doesNotMatch(said.Handed, HANDED[token], `${id}: is handed ${token}, which its card does not read`);
    // What its card never reads is listed in its brief, or kept out of what is sent.
    const closed = `${flat(part)}${reader ? ` ${common}` : ''}`;
    for (const token of card['never-reads']) {
      if (AFTER_STRUCTURE.includes(token)) continue;
      assert.ok(KEPT_OUT[token], `${id}: ${token} has no place the test knows`);
      assert.match(closed, KEPT_OUT[token], `${id}: never reads ${token}`);
    }
    // Of 04-structure a reader is handed the board, and nothing above it or beside it.
    if (reader) {
      assert.match(said['Do not open'], /^the list above/, id);
      for (const [path] of said.Handed.matchAll(/<package>\/04-structure\/[\w./<>-]*/g)) assert.ok(path.startsWith('<package>/04-structure/board/'), `${id} is handed ${path}`);
      assert.match(said.Writes, /`<package>\/04-structure\/reads\/<seat>(?:-<name>)?\.md`, in the shape of `templates\/outputs\/(?:LEDGER|TASK-READ)\.md`/, id);
    } else {
      assert.doesNotMatch(said.Handed, /04-structure\/(?:board|reads|MAP|PICK)/, `${id}: a maker is handed nothing of the board`);
    }
  }
  const audience = leads(subsection(seats, '`audience.task-reader`'));
  assert.match(audience.Handed, /the pictures of every letter at her width, each by its path, as `<package>\/04-structure\/board\/A-390-light\.png`\. The pictures, and pictures only\./);
  assert.match(audience['Do not open'], /her profession's profile itself; the pages and the letters' files of the board/);
  // The copy of her profession's traits lies beside her brief, as the loop has it: the one file of work/ she is handed.
  assert.match(audience.Handed, /with every `So the interface must:` field removed, written beside the brief as the loop says, and the one file of `<package>\/work\/` she opens/);
  assert.match(flat(reference('loop.md')), /write a copy of it beside the brief with every `So the interface must:` field removed/);
  assert.match(audience['Its brief'], /her tasks, copied word for word from "Tasks for the audience" of the intent/);
  assert.ok(headings(outputOf('intent')).includes('Tasks for the audience'));
  // Only a continuity maker the cast names sees today's screen, and a describer is handed neither the person nor her profession's profile.
  const describer = leads(subsection(seats, '`maker.structure-describer`'));
  assert.match(describer.Handed, /Neither the person nor her profession's profile/);
  assert.match(describer['A continuity maker'], /is the one describer the cast sheet's "Blind rules" may name\. Its brief says so, and hands it today's screen besides, by a path the carry list names\. No other maker sees it/);
  assert.match(leads(subsection(seats, '`maker.screen-generator`')).Handed, /^`<package>\/04-structure\/BRIEF-fresh\.md`, alone\./);
  assert.match(leads(subsection(seats, '`maker.transcriber`')).Writes, /You tag it with the track and the engine of the concept it wrote down, never with its own/);
  assert.match(flat(seats), /A card of the project's own that the cast sheet seats here is handed what its header's `reads` allows, by the same rule/);
});

test('structure: every command is one its script takes, in the order of the stage, and none passes an address, a seed or anything about a key', () => {
  const text = stageSkill('structure');
  const commands = stageCommands('structure');
  for (const command of commands) {
    const [, script, given] = /^node <kit root>\/scripts\/([a-z]+)\.mjs (.+)$/.exec(command) ?? [];
    assert.ok(script, command);
    assert.ok(takenBy(script, given), command);
  }
  assert.deepEqual([...new Set(commands.map(command => /scripts\/([a-z]+)\.mjs/.exec(command)[1]))].sort(), ['describe', 'merge', 'page', 'render', 'shots', 'state']);
  const state = commands.filter(command => command.startsWith('node <kit root>/scripts/state.mjs ')).map(command => words(command).slice(2));
  assert.deepEqual([...new Set(state.map(([verb]) => verb))].sort(), ['await', 'begin', 'next', 'reopen', 'slug', 'stamp', 'status', 'validate']);
  for (const [verb, pkg, stage] of state.filter(([verb]) => ['begin', 'await', 'stamp'].includes(verb))) assert.deepEqual([pkg, stage], ['<package>', 'structure'], verb);
  // The commands of SKILL.md's code fences, in the order the stage runs them: the map is opened last but for the stamp.
  assert.deepEqual(linesOf(text).filter(({ fenced }) => fenced).map(({ line }) => line.trim()), [
    'node <kit root>/scripts/state.mjs begin <package> structure',
    'node <kit root>/scripts/describe.mjs --provider <openai|gemini> --model <id> --brief <package>/04-structure/BRIEF.md --out <package>/04-structure/proposals/<name>.json --profile <packages>/PROFILE.md',
    'node <kit root>/scripts/merge.mjs <package>/04-structure/proposals --out <package>/04-structure/board',
    'node <kit root>/scripts/render.mjs <package>/04-structure/board/<letter>.json --kit <kit dir> --out <package>/04-structure/board/<letter>.html --letter <letter>',
    'node <kit root>/scripts/shots.mjs <package>/04-structure/board --out <package>/04-structure/board --widths <primary>,<phone>',
    'node <kit root>/scripts/page.mjs <package>/04-structure/decision.json --out <package>/04-structure/decision.html',
    'node <kit root>/scripts/state.mjs await <package> structure --question "<the one question>"',
    'node <kit root>/scripts/merge.mjs open <package>/04-structure/board',
    'node <kit root>/scripts/state.mjs stamp <package> structure --words "<the founder\'s words>"',
  ]);
  // The outside describer is run one way, with five flags and nothing else, in every file of the skill.
  const outside = commands.filter(command => command.includes('scripts/describe.mjs'));
  assert.equal(new Set(outside).size, 1);
  assert.deepEqual(words(outside[0]).filter(word => word.startsWith('--')), ['--provider', '--model', '--brief', '--out', '--profile']);
  for (const [file, body] of Object.entries(folderOf('structure'))) {
    assert.doesNotMatch(body, /--endpoint|--seed|--text|--timeout|--keys?\b|API_KEY|keys-file|\.env\b|https?:/, `${file}: no address, no seed, no key, no keys file`);
  }
  for (const flag of NEVER_PASSED) assert.ok(commands.every(command => !words(command).some(word => word.split('=')[0] === flag)), flag);
  // The map is opened in one place, the gate, by the one command, after the pick is written and before anything names a maker.
  assert.doesNotMatch(section(text, 'Steps'), /merge\.mjs open/);
  assert.equal(commands.filter(command => command.includes('merge.mjs open')).length, 1);
  inOrder(flat(section(text, 'Gate')), [/state\.mjs await <package> structure/, /\*\*Stop: you do not pick, and you go no further without his words\.\*\*/, /\*\*Write `<package>\/04-structure\/PICK\.md`,\*\*/,
    /\*\*Only now may the map be opened,\*\* after a graft's re-read, and only this way/, /refuses until `PICK\.md` holds his pick/, /merge\.mjs open <package>\/04-structure\/board/, /"Not chosen": each other letter, with who made it, from the map/,
    /state\.mjs stamp <package> structure/], 'the gate');
  assert.ok(nevers(text).includes('Never open, print, search or copy the map before `PICK.md` holds his pick'));
  // The rule refuses something real: the same words without what the form needs, or with what no skill passes, are not taken.
  for (const [script, wrong] of [
    ['merge', 'open'], ['merge', '<package>/04-structure/proposals'], ['render', '<package>/04-structure/board/<letter>.json --out <package>/04-structure/board/<letter>.html --letter <letter>'],
    ['shots', '<package>/04-structure/board --out <package>/04-structure/board'], ['page', '<package>/04-structure/decision.json'], ['state', 'await <package> structure'], ['state', 'reopen <package> <stage>'],
    ['describe', '--provider <openai|gemini> --model <id> --brief <package>/04-structure/BRIEF.md --out <package>/04-structure/proposals/<name>.json'],
  ]) assert.ok(!takenBy(script, wrong), `${script}.mjs does not take: ${wrong}`);
});

test('structure: two stops, the brief before anything is sent and the pick before anything goes on, and the brief carries the format', () => {
  const text = stageSkill('structure');
  const steps = section(text, 'Steps');
  assert.deepEqual(boldSteps(steps), [[1, 'Begin'], [2, 'Read the cast sheet, and what its carry list names'], [3, 'Write the brief,'], [4, 'Stop: the founder reads the brief'], [5, 'Start the makers, in one message'],
    [6, 'Tag each proposal, and mend none'], [7, 'Merge, draw, photograph, one command after another'], [8, 'Start the readers, by letter'], [9, 'Build the decision page']]);
  // The brief: context and nothing of a design, from its template, with the format left as the template has it.
  const brief = stepOf(steps, 'Write the brief,');
  assert.match(brief, /from the intent, at `<package>\/04-structure\/BRIEF\.md`: context, and nothing of a design/);
  assert.match(brief, /Read it sentence by sentence, as "Context, never the design" in `skills\/design\/references\/blind\.md` says, and cut whatever a describer could draw a screen from/);
  assert.ok(headings(reference('blind.md')).includes('Context, never the design'));
  assert.match(brief, /"How to work" and "What to return" stay as the template has them: the brief carries the format/);
  for (const file of ['BRIEF.md', 'BRIEF-fresh.md']) {
    const template = read(`templates/package/04-structure/${file}`);
    for (const heading of ['## How to work', '## What to return', '### The walkthrough format']) assert.ok(template.includes(`\n${heading}\n`), `${file}: ${heading}`);
  }
  assert.match(brief, /With a fresh pass, or a `maker\.screen-generator` cast, write `<package>\/04-structure\/BRIEF-fresh\.md` too, in its Structure form/);
  assert.match(read('templates/package/04-structure/BRIEF-fresh.md'), /<!-- Structure form/);
  // The first stop: he reads it, hears what would leave the machine and to whom, and nothing is sent before his yes is written.
  const stop = stepOf(steps, 'Stop: the founder reads the brief');
  inOrder(stop, [/Put it in front of him whole, and the fresh brief with it/, /Say in the same message which seats would send it off this machine, each with its provider: every `maker\.outside-describer` line, `model:openai` or `model:gemini`, and a `maker\.screen-generator` on `tool:stitch`/,
    /One question, about one thing: may this brief go out as it is\?/, /\*\*Nothing is sent before his yes: not to a sub-agent, and not off the machine\.\*\*/,
    /Write what he changes into the brief, then his yes under `## Reviewed by the founder` of `CHOSEN\.md`, as he said it, with the seats that send it out/, /A seat he holds back does not run/], 'the stop at the brief');
  assert.equal(kitCards()['maker.screen-generator'].engine, 'tool:stitch');
  assert.match(flat(read('templates/project/PROFILE.md')), /`model:openai`, `model:gemini`, `tool:stitch`/);
  assert.ok(headings(outputOf('structure')).includes('Reviewed by the founder'));
  // No seat is started, and no script sends, in a step before the stop; and a session that resumes stops there too.
  const before = steps.slice(0, steps.search(/^4\. \*\*/m));
  assert.deepEqual(commandsOf(before), ['node <kit root>/scripts/state.mjs begin <package> structure']);
  assert.doesNotMatch(before, /sub-agent|Start/);
  assert.match(stepOf(steps, 'Begin'), /A stage already in work goes on from the first step whose files are missing: step 4, until `CHOSEN\.md` holds his yes\. A board is never merged twice/);
  // The second stop: one page, one question, and nothing goes on without his words.
  const gate = flat(section(text, 'Gate'));
  inOrder(gate, [/^ \*\*He picks, from pictures\.\*\* Put `<package>\/04-structure\/decision\.html` in front of him\. Record the one question, so that a session resuming tomorrow asks the same/, /state\.mjs await <package> structure --question/,
    /One question, about one thing: which structure goes on to Detail\? \*\*Stop: you do not pick, and you go no further without his words\.\*\*/, /"A bit of each" is not a pick: say so, and ask him for one letter/], 'the stop at the pick');
  assert.match(stepOf(steps, 'Begin'), /A stage that is awaiting the founder is not begun again: go to "Gate", with his answer\. Otherwise mark it in work:/);
  // What the session must never do, each as a rule, with what this stage is tempted to do first.
  const lines = section(text, 'Never').split('\n').filter(line => line.startsWith('- '));
  for (const line of lines) assert.match(line, /^- \*\*Never [^*]+[.,]\*\*/, line);
  assert.deepEqual(nevers(text), ['Never send the brief before he has read it', 'Never pass the outside script anything about a key', 'Never mend, complete or improve a proposal', 'Never shortlist, rank or drop',
    'Never pick, and never go on without his words', 'Never say who made a letter', 'Never open, print, search or copy the map before `PICK.md` holds his pick', 'Never hand a reader the folder above the board',
    'Never put a decision page, a fresh screen or a graft in the board', 'Never delete a board or a round, and never merge a sealed board again', 'Never put a design in a brief', 'Never stop a process by name or by pattern',
    'Never ask two things at once']);
});

test('structure: makers start in one message on what the cast sheet names, a proposal is checked and never mended, and an outside answer is taken as it comes', () => {
  const text = stageSkill('structure');
  const steps = section(text, 'Steps');
  const makers = stepOf(steps, 'Start the makers, in one message');
  // Model and effort are the cast sheet's, and the skill enforces none.
  assert.match(makers, /Each is a fresh sub-agent, started as "Starting a seat" in the loop says, on the model and the effort its line of the approved cast sheet names: a dash means the session's model, and you enforce none/);
  assert.match(reference('loop.md'), /^### Starting a seat$/m);
  assert.match(makers, /Its brief is written from `templates\/briefs\/maker\.md`, and hands it what `references\/seats\.md` gives its seat, and no more/);
  assert.match(makers, /Each `maker\.structure-describer` has the lens its line names, a different one each, and writes one proposal, `<package>\/04-structure\/proposals\/<name>\.json`/);
  assert.match(makers, /With a fresh pass, its makers answer the fresh brief, and a `maker\.transcriber` writes each fresh concept into the format/);
  // The outside describer: a script, five flags, and three ways an answer can come.
  assert.match(makers, /An outside describer is no sub-agent: you run it, once for each of its lines, with these five flags and nothing else, since the script finds its key itself/);
  assert.match(makers, /A valid answer is a proposal like any other\. One that is not in the format leaves `<name>\.json\.raw\.txt` where the proposal would be, for a `maker\.transcriber`\. A refusal is reported to the founder as the script words it, and you go on with the seats you have/);
  assert.match(KIT.usage('scripts/describe.mjs'), /kept as it came in\n<file\.json>\.raw\.txt/);
  const outside = leads(subsection(structureRef('seats.md'), '`maker.outside-describer`'));
  assert.match(outside.Handed, /^the brief he approved, whole and unchanged: `<package>\/04-structure\/BRIEF\.md`, or `<package>\/04-structure\/BRIEF-fresh\.md` for a line that belongs to a fresh pass, which is then what `--brief` names\. The script sends that one file\. Add nothing to it/);
  assert.match(outside.Writes, /The script has written `engine` and `model` into it: add `track`, and nothing else/);
  assert.match(outside['An answer that is not in the format'], /leaves `<name>\.json\.raw\.txt` in the proposals folder, and the script exits 1 and says why\. Start one `maker\.transcriber` on that file\. You never write it into the format yourself/);
  assert.match(outside['A refusal leaves nothing'], /^Tell the founder what the script printed, as it printed it\. Try once more only after a timeout\. Never look for the reason in a file of keys or in the environment\. Then go on with the seats you have: the decision page says this seat did not answer/);
  const never = flat(section(text, 'Never'));
  assert.match(never, /and never send anything else off it\. A provider that `engines-on` does not list gets nothing: you turn no engine on/);
  assert.match(never, /or any flag but the five of step 5\. Never open, list or name a file of keys, and never print the environment/);
  // A proposal is tagged, checked by its maker and again by the merge, sent back once, then left out and said so: never repaired.
  const tag = stepOf(steps, 'Tag each proposal, and mend none');
  assert.match(tag, /Add two keys to each file, and touch nothing else: `track`, `system` or, for a fresh concept, `fresh`; and `engine`, as its seat's line of the cast sheet has it/);
  assert.match(tag, /Each maker checks its file with the command its card gives, and the merge holds every file to `validate` again: while one fails it writes nothing, and prints the file and the fault/);
  for (const file of ['pool/makers/structure-describer.md', 'pool/makers/transcriber.md']) assert.match(read(file), /\*\*Check it\*\* before you return it/, file);
  assert.match(KIT.usage('scripts/merge.mjs'), /Every\nproposal must be valid, or nothing is written/);
  assert.match(tag, /That proposal goes back to its maker once, a fresh sub-agent in the same seat\. One that fails again is moved to `<package>\/04-structure\/proposals\/left-out\/`, and the decision page says so\. You repair none: that would make you a maker/);
  assert.match(KIT.usage('scripts/merge.mjs'), /sub-folders\nare not read/);
  // A shared machine: one command after another, three browser-driving at most, and no process stopped by name.
  assert.match(stepOf(steps, 'Merge, draw, photograph'), /Run the render once for each letter, then the shots once, at the two widths of the brief\..*Never more than three browser-driving commands or seats at once\./);
  assert.match(flat(structureRef('seats.md')), /The makers are started in one message, after his yes to the brief and never before\. Those that drive a browser, the screen generators, are started three at a time at most\. A proposal the merge refuses goes back once: to a fresh sub-agent in the same seat, with the same brief, its own file and the fault as the merge printed it/);
  assert.match(never, /\*\*Never stop a process by name or by pattern,\*\* and never start a browser yourself/);
});

test('structure: the decision is one page: every letter, one line for each seat, one recommendation, one question, and a fresh gallery beneath and apart', () => {
  const text = stageSkill('structure');
  const page = stepOf(section(text, 'Steps'), 'Build the decision page');
  assert.match(page, /Write `<package>\/04-structure\/decision\.json` in the shape of `templates\/outputs\/decision\.json`: the options by letter, one line for each seat that read them, one recommendation, one question/);
  assert.match(page, /Its identity is the design's name, kind and size, as `node <kit root>\/scripts\/state\.mjs status <package>` prints them/);
  assert.match(page, /Every letter of the board is an option: the `name` in its file is the title, its `bet` the line, and its pictures are named from the page, the phone width first, as `board\/A-390-light\.png`/);
  assert.match(page, /A proposal left out, and a seat that did not answer or was held back, is one line under `findings`, by seat, never by letter/);
  assert.match(page, /With a fresh pass, its `gallery` sits beneath the options, labelled as fresh and never mixed into them: each screen as it came, by its picture in `fresh\/`, never saying which letter holds its structure/);
  // Each key it names is one the page takes, and the template is a Structure page: stage 5 of 9, a gallery, one question.
  const sample = JSON.parse(read('templates/outputs/decision.json'));
  for (const key of ['identity', 'options', 'gallery', 'seats', 'recommendation', 'question']) assert.ok(Object.hasOwn(sample, key), key);
  assert.ok(Object.hasOwn(JSON.parse(read('templates/outputs/decision-approve.json')), 'findings'));
  assert.deepEqual([sample.identity.stage, sample.identity.of], [STAGES.indexOf('structure') + 1, STAGES.length]);
  assert.deepEqual(Object.keys(sample.options[0]), ['letter', 'title', 'line', 'images']);
  assert.match(KIT.usage('scripts/shots.mjs'), /named <name>-<width>-<theme>\.png/);
  assert.match(flat(section(text, 'Never')), /\*\*Never pick, and never go on without his words\.\*\* You recommend one letter, in one sentence/);
  assert.match(flat(section(text, 'Never')), /\*\*Never shortlist, rank or drop\.\*\* Every valid proposal reaches the board, and every letter him/);
});

test('rounds.md: a graft is redrawn once and read again once, a rejected round moves whole and Structure starts clean, and a board made again takes its letters with it', () => {
  const text = stageSkill('structure');
  const rounds = structureRef('rounds.md');
  assert.deepEqual(headings(rounds), ['A pick with a graft', 'A round he rejected', 'A board made again within a round']);
  const top = flat(rounds.slice(0, rounds.indexOf('\n## ')));
  assert.match(top, /what is set aside is moved and never deleted, into `<package>\/04-structure\/earlier\/<n>\/`: `1` the first time, `2` the next/);
  // In the conductor's words: nothing set aside is ever an input.
  const EARLIER = /Nothing in `earlier\/` is ever an input to a stage or a seat/;
  assert.match(flat(reference('blind.md')), EARLIER);
  assert.match(top, EARLIER);
  for (const body of Object.values(folderOf('structure'))) assert.doesNotMatch(flat(body), /is ever an input(?! to a stage or a seat|\.)/);

  // A graft: redrawn once by a maker, in a folder of its own, read again once, and only then the map.
  const graft = section(rounds, 'A pick with a graft');
  assert.deepEqual(boldSteps(graft).map(([, name]) => name), ['It is redrawn once, by a maker, never by you', 'Draw it and photograph it,', 'It is read again once', 'Once means once', 'Then the map is opened,']);
  assert.match(flat(graft), /Start one fresh `maker\.structure-describer`, as step 5 of the skill says\. The blind between makers ended with the pick, so this one is handed the picked letter's file and the file of each letter he named, from the board, by letter, and his words, exactly\. It is not told who made them/);
  assert.deepEqual(commandsOf(graft), ['node <kit root>/scripts/render.mjs <package>/04-structure/chosen/chosen.json --kit <kit dir> --out <package>/04-structure/chosen/chosen.html --letter <letter>',
    'node <kit root>/scripts/shots.mjs <package>/04-structure/chosen --out <package>/04-structure/chosen --widths <primary>,<phone>']);
  assert.match(flat(graft), /A judge is handed `<package>\/04-structure\/chosen\/` in place of the board folder, and its seat's earlier ledger to open only after it has read cold, as step 6 of the loop says\. An audience is handed the new pictures only/);
  assert.match(flat(graft), /the map is still sealed while they read/);
  assert.match(flat(graft), /Nothing is redrawn a second time/);
  assert.match(flat(graft), /The render refuses a file that is not a valid proposal, and prints the fault: the file goes back to that maker once\. You do not mend it/);

  // A round he rejected: the pick, his marks, the reopening, the move, what the state shows, and a clean start.
  const rejected = flat(section(rounds, 'A round he rejected'));
  assert.match(rejected, /no further proposals are asked for against the same brief\. Intent or Context is reopened, and the round moves whole/);
  inOrder(rejected, [/1\. \*\*Write `<package>\/04-structure\/PICK\.md`:\*\* the line `Pick: none`/, /2\. \*\*Write the rejection into the package's `DECISIONS\.md`,\*\* as a new entry, in his words/,
    /What he marked in a fresh gallery is his words too, and survives the round: write each mark there with the rejection, as he said it/, /Look's fresh pass reads his marks from `DECISIONS\.md`, never from `earlier\/`/,
    /3\. \*\*Reopen the stage,\*\* with his yes\. `<stage>` is `intent` or `context`/, /state\.mjs reopen <package> <stage> --reason "<why>"/,
    /4\. \*\*Move the round whole\.\*\* Everything in `<package>\/04-structure\/` other than `earlier\/` goes together into `<package>\/04-structure\/earlier\/<n>\/`: the briefs, the proposals folder, the board, the map, the pick, the pictures, the reads, the decision page and its data, `fresh\/`, `chosen\/` and `CHOSEN\.md`/,
    /So no proposal of this round can reach the next board/, /5\. \*\*Say what the state shows meanwhile\.\*\* Structure stays awaiting, and its output has moved/, /state\.mjs validate <package>` prints a `structure: missing-artefact` line, and `status` still shows the pick's question/,
    /do not put that question again/, /6\. \*\*When Structure comes round again,\*\*/, /it starts clean, from step 1 of the skill/, /state\.mjs begin <package> structure/,
    /Copy a fresh `CHOSEN\.md` and the brief templates from `templates\/package\/04-structure\/`/, /Write a new brief from the new intent: he reads it before anything is sent, as he read the first/], 'a rejected round');
  // The conductor lists what moves in the same words, and the skill sends the session here for both.
  assert.match(flat(reference('blind.md')), /everything in `04-structure\/` other than `earlier\/` is moved together, before the new round starts: the briefs, the proposals folder, the board, the map, the pick, the pictures, the reads, the decision page/);
  assert.match(flat(section(text, 'Gate')), /\*\*`Pick: none` reopens Intent or Context:\*\* no further proposals are asked for against the same brief, and the round moves whole\. Both are in `references\/rounds\.md`/);
  assert.match(stepOf(section(text, 'Steps'), 'Begin'), /One awaiting stage is begun again: one whose `<package>\/04-structure\/` holds nothing but `earlier\/`, a round he rejected \(`references\/rounds\.md`\)/);
  assert.match(flat(section(text, 'Never')), /\*\*Never delete a board or a round, and never merge a sealed board again\.\*\* What is set aside is moved/);

  // A board made again within a round: his yes first, then the board and everything that speaks of its letters.
  const again = flat(section(rounds, 'A board made again within a round'));
  inOrder(again, [/The next merge deals the letters anew, so whatever speaks of the old letters goes with them/, /1\. \*\*Tell the founder first,\*\* and move nothing without his yes/,
    /2\. \*\*Move together\*\* into `<package>\/04-structure\/earlier\/<n>\/`: the board, the map, the pick if one was begun, the reads, and the decision page with its data\. The briefs, the proposals folder and `fresh\/` stay/,
    /3\. \*\*Go on from step 6 of the skill:\*\* tag, merge, draw, photograph, then readers who have read no earlier board/, /The merge refuses while a map or a pick lies beside the board folder: where its refusal says to delete, move/], 'a board made again');
  assert.match(KIT.usage('scripts/merge.mjs'), /delete it and its map on purpose/);
});

test('Structure runs as written: its own commands on the fixture proposals, the board and what lies beside it, the map shut until a pick is written, and a rejected round moved whole', () => {
  const project = join(scratchRoot, 'a clinic at structure');
  const pkg = join(project, 'design', 'today');
  const round = join(pkg, '04-structure');
  // The project's kit folder, as setup leaves it where there is no design system: the grey kit, unchanged.
  mkdirSync(join(project, 'design', 'kit'), { recursive: true });
  copyFileSync(at('kit/grey/kit.css'), join(project, 'design', 'kit', 'kit.css'));
  const FILL = {
    '<kit root>/': fileURLToPath(root), '<packages>': 'design', '<package>': 'design/today', '<kit dir>': 'design/kit', '<primary>': '1280', '<phone>': '390', '<stage>': 'intent',
    '<why>': 'he rejected every structure: the job was stated wrong', '<the founder\'s words>': 'la B, con el estado de la A', '<the one question>': 'Which structure goes on to Detail: A, B or C?',
  };
  // A command as the skill writes it, run from the project's root with each placeholder filled.
  const exec = (command, more = {}) => {
    const fill = { ...FILL, ...more };
    const filled = word => Object.entries(fill).reduce((text, [slot, value]) => text.split(slot).join(value), word.replace(/^"(.*)"$/, '$1'));
    return spawnSync(process.execPath, words(command).slice(1).map(filled), { cwd: project, encoding: 'utf8' });
  };
  const run = (command, more) => {
    const done = exec(command, more);
    assert.deepEqual([done.status, done.stderr], [0, ''], `${command}\n${done.stdout}`);
    return done.stdout.trim();
  };
  // The one command of the skill's folder that starts with these words.
  const commandOf = start => {
    const found = [...new Set(stageCommands('structure'))].filter(command => command.startsWith(`node <kit root>/scripts/${start}`));
    assert.equal(found.length, 1, `one command that starts ${start}`);
    return found[0];
  };
  const visible = name => !name.startsWith('.fuse_hidden');
  const STATE = 'node <kit root>/scripts/state.mjs';
  const slugOf = heading => run(commandOf('state.mjs slug'), { '<heading text>': heading });
  // An output of the package: its template, with what it is built from and its carry list.
  const write = (name, inputs, carry = []) => {
    const text = read(`templates/package/${ARTEFACT[name]}`);
    assert.ok(text.endsWith('\n## Carry\n') && text.includes('\nbuilt-from: []\n'), name);
    mkdirSync(round, { recursive: true });
    writeFileSync(join(pkg, ARTEFACT[name]), `${text.replace('built-from: []', `built-from: ${inputs}`)}\n${carry.join('\n')}\n`);
  };
  const STAMPED = (name, version) => new RegExp(`^stamped ${name} approved at version ${version} on \\d{4}-\\d\\d-\\d\\d$`);

  // The package as Cast leaves it: four outputs approved, the cast sheet carrying on a section of the intent and one of the context.
  run(`${STATE} init <package> --design today --kind working-surface --foundation new-surface --size surface`);
  const castCarry = version => [`- intent@${version}#${slug('The one job')}`, `- context@1#${slug('The people')}`, '- source:design/pool/persons/desk-cover.md'];
  for (const [name, inputs, carry] of [['frame', '[]'], ['context', '[frame@1]'], ['intent', '[context@1]'], ['cast', '[intent@1, context@1]', castCarry(1)]]) {
    run(`${STATE} begin <package> ${name}`);
    write(name, inputs, carry);
    assert.match(run(`${STATE} stamp <package> ${name} --words "sí, adelante"`), STAMPED(name, 1));
  }
  assert.equal(run(commandOf('state.mjs next')), 'structure');

  // Step 1 and step 2: begun, and the output copied from its template with the built-from the skill gives.
  assert.equal(run(commandOf('state.mjs begin')), 'structure is in work');
  const [, builtFrom] = /`built-from: (\[[^\]]*\])`/.exec(section(stageSkill('structure'), 'Writes'));
  write('structure', builtFrom);
  // Step 5 and step 6: three proposals come in, and each is tagged with its track and its engine, nothing else touched.
  const FIXTURES = ['calendar', 'free-first', 'unified-list'];
  const LETTERS = ['A', 'B', 'C'];
  const propose = () => {
    mkdirSync(join(round, 'proposals'));
    for (const [i, name] of FIXTURES.entries()) {
      const proposal = JSON.parse(read(`tests/fixtures/proposals/${name}.json`));
      assert.deepEqual(validate(proposal), [], name);
      writeFileSync(join(round, 'proposals', `${name}.json`), `${JSON.stringify({ ...proposal, track: i ? 'system' : 'fresh', engine: i ? 'own' : 'tool:stitch' }, null, 2)}\n`);
    }
  };
  propose();
  // A proposal that is not valid: the merge writes nothing and prints the file and the fault. Sent back once and still at
  // fault, it is moved where the skill says, and the merge reads no sub-folder.
  const { bet, ...noBet } = JSON.parse(read('tests/fixtures/proposals/calendar.json'));
  assert.equal(typeof bet, 'string');
  writeFileSync(join(round, 'proposals', 'late.json'), JSON.stringify(noBet));
  const invalid = exec(commandOf('merge.mjs <package>'));
  assert.deepEqual([invalid.status, invalid.stdout], [1, '']);
  assert.match(invalid.stderr, /not every proposal is valid, so no letter is written\n.*late\.json: it is not a valid proposal\nproposal: "bet" is missing\n$/);
  assert.ok(!existsSync(join(round, 'board')) && !existsSync(join(round, MAP)));
  const [, leftOut] = /is moved to `<package>\/04-structure\/(proposals\/left-out)\/`/.exec(flat(section(stageSkill('structure'), 'Steps')));
  mkdirSync(join(round, leftOut));
  renameSync(join(round, 'proposals', 'late.json'), join(round, leftOut, 'late.json'));

  // Step 7, on a round's proposals: the merge deals the letters and names no source, the map lies beside the board, each
  // letter is drawn in the project's kit under its letter, and the pictures stand in under the names the picture script gives.
  const inBoard = () => readdirSync(join(round, 'board')).filter(visible).sort();
  const letterFile = letter => JSON.parse(readFileSync(join(round, 'board', `${letter}.json`), 'utf8'));
  const board = () => {
    const merged = run(commandOf('merge.mjs <package>'));
    assert.match(merged, /^merged 3 proposals into \S.*04-structure.board: A, B, C$/);
    for (const name of FIXTURES) assert.ok(!merged.includes(name), name);
    assert.deepEqual(inBoard(), LETTERS.map(letter => `${letter}.json`));
    assert.ok(existsSync(join(round, MAP)) && !existsSync(join(round, 'board', MAP)), 'the map is beside the board, never in it');
    for (const letter of LETTERS) {
      assert.deepEqual(validate(letterFile(letter), { sealed: true }), [], letter);
      run(commandOf('render.mjs <package>/04-structure/board/'), { '<letter>': letter });
      const page = readFileSync(join(round, 'board', `${letter}.html`), 'utf8');
      assert.ok(page.includes(`<h1>Option ${letter}: `) && page.includes('<link rel="stylesheet" href="kit.css">'), letter);
      assert.doesNotMatch(page, /tool:stitch|calendar\.json|free-first|unified-list/, letter);
      // The pictures are the picture script's to take, and its own tests drive the browser: here each is a stand-in.
      for (const width of [FILL['<phone>'], FILL['<primary>']]) writeFileSync(join(round, 'board', `${letter}-${width}-light.png`), '');
    }
    assert.deepEqual(inBoard(), [...LETTERS.flatMap(letter => [`${letter}-1280-light.png`, `${letter}-390-light.png`, `${letter}.html`, `${letter}.json`]), 'kit.css'].sort());
  };
  board();
  assert.equal(commandOf('shots.mjs <package>/04-structure/board'), 'node <kit root>/scripts/shots.mjs <package>/04-structure/board --out <package>/04-structure/board --widths <primary>,<phone>');
  // A board is never merged twice, and its map is shut until a pick is written.
  const twice = exec(commandOf('merge.mjs <package>'));
  assert.deepEqual([twice.status, twice.stdout], [1, '']);
  assert.match(twice.stderr, /the board beside .*MAP\.sealed\.json is sealed/);
  const shut = exec(commandOf('merge.mjs open'));
  assert.deepEqual([shut.status, shut.stdout], [1, '']);
  assert.match(shut.stderr, /^the author map is sealed until the founder's pick is written in .*PICK\.md/);

  // Step 9: the page is built beside the board from the letters' own names and bets, with the pictures named from the page,
  // the phone width first, and the fresh gallery beneath the options. Then the one question is recorded.
  const decide = () => {
    mkdirSync(join(round, 'fresh'));
    writeFileSync(join(round, 'fresh', 'today-1.png'), '');
    const sample = JSON.parse(read('templates/outputs/decision.json'));
    assert.deepEqual(sample.gallery.items[0].images, ['fresh/today-1.png']);
    const options = LETTERS.map(letter => ({ letter, title: letterFile(letter).name, line: letterFile(letter).bet, images: [`board/${letter}-390-light.png`, `board/${letter}-1280-light.png`] }));
    writeFileSync(join(round, 'decision.json'), JSON.stringify({ ...sample, options }, null, 2));
    assert.match(run(commandOf('page.mjs')), /^built \S.*decision\.html: 3 options, a gallery of 1, 4 seats, one question$/);
    const page = readFileSync(join(round, 'decision.html'), 'utf8');
    assert.ok(page.indexOf('<section class="gallery">') > page.indexOf('<section class="options">'), 'the gallery is beneath the options');
    assert.ok(page.includes('href="board/A-390-light.png"') || page.includes('src="board/A-390-light.png"'));
    assert.equal(inBoard().length, 13, 'the decision page and the gallery are not in the board');
    assert.equal(run(commandOf('state.mjs await')), 'structure awaits the founder');
  };
  decide();
  // The gate: the pick is written from its template, beside the board. "A bit of each" is no pick, and the map stays shut.
  const pickTemplate = read('templates/outputs/PICK.md');
  const pick = (line, said) => writeFileSync(join(round, PICK), pickTemplate.replace(/^Pick: \{[^}\n]+\}$/m, `Pick: ${line}`).replace(/\{What the founder said[^}]+\}/, said));
  pick('a bit of each', 'Un poco de cada una.');
  const noPick = exec(commandOf('merge.mjs open'));
  assert.deepEqual([noPick.status, noPick.stdout], [1, '']);
  assert.match(noPick.stderr, /that file holds no such line$/m);

  // He rejects them all: the pick says none, Intent is reopened, and the round moves whole into earlier/1.
  pick('none', 'Ninguna: el trabajo está mal planteado.');
  assert.equal(run(commandOf('state.mjs reopen')), 'reopened intent at version 2; stale: cast');
  const held = readdirSync(round).filter(visible).sort();
  assert.deepEqual(held, ['CHOSEN.md', MAP, PICK, 'board', 'decision.html', 'decision.json', 'fresh', 'proposals'].sort());
  mkdirSync(join(round, 'earlier', '1'), { recursive: true });
  for (const name of held) renameSync(join(round, name), join(round, 'earlier', '1', name));
  assert.deepEqual(readdirSync(round).filter(visible), ['earlier']);
  // What the state shows meanwhile, as rounds.md says: the output is missing, the pick's question still stands, and the reopened stage is next.
  const meanwhile = exec(commandOf('state.mjs validate'));
  assert.deepEqual([meanwhile.status, meanwhile.stderr], [1, '']);
  assert.match(meanwhile.stdout, /^structure: missing-artefact: structure is awaiting, but 04-structure\/CHOSEN\.md does not exist$/m);
  assert.match(run(commandOf('state.mjs status')), /^## Open question\n\nstructure: Which structure goes on to Detail: A, B or C\?$/m);
  assert.equal(run(commandOf('state.mjs next')), 'intent');
  // The reopened stage is approved anew and the stale cast stamped again, on the new intent. Then Structure is next, and starts clean.
  assert.match(run(`${STATE} stamp <package> intent --words "ahora sí"`), STAMPED('intent', 2));
  write('cast', '[intent@2, context@1]', castCarry(2));
  assert.match(run(`${STATE} stamp <package> cast --words "sin cambios"`), STAMPED('cast', 2));
  assert.equal(run(commandOf('state.mjs next')), 'structure');
  assert.equal(run(commandOf('state.mjs begin')), 'structure is in work');
  assert.equal(run(commandOf('state.mjs validate')), 'ok');
  // No proposal of the earlier round can reach the new board: the proposals folder went with its round.
  const empty = exec(commandOf('merge.mjs <package>'));
  assert.deepEqual([empty.status, empty.stdout], [1, '']);
  assert.match(empty.stderr, /^cannot read \S.*proposals: /);

  // The new round, to the pick: a fresh output on the versions that now stand, new proposals, a new board beside the old round.
  write('structure', '[cast@2, intent@2, context@1]');
  propose();
  board();
  decide();
  // He picks B, with a graft. Redrawn in chosen/, under the picked letter, it leaves the board as it was, and the map opens.
  pick('B', 'La B, con el estado de la A.');
  mkdirSync(join(round, 'chosen'));
  writeFileSync(join(round, 'chosen', 'chosen.json'), JSON.stringify(letterFile('B')));
  run(commandOf('render.mjs <package>/04-structure/chosen/'), { '<letter>': 'B' });
  assert.ok(readFileSync(join(round, 'chosen', 'chosen.html'), 'utf8').includes('<h1>Option B: '));
  assert.equal(inBoard().length, 13);
  const opened = run(commandOf('merge.mjs open')).split('\n');
  assert.deepEqual(opened.map(line => line.split('  ')[0]), LETTERS);
  assert.deepEqual(opened.map(line => line.split('  ')[1]).sort(), FIXTURES.map(name => `${name}.json`));
  for (const line of opened) assert.match(line, /^[A-C] {2}(?:calendar\.json {2}fresh {2}tool:stitch|(?:free-first|unified-list)\.json {2}system {2}own)$/);
  // Saved in the board as a one-letter .json, the same graft would shut the map: the board would no longer be the one it names.
  writeFileSync(join(round, 'board', 'D.json'), JSON.stringify(letterFile('B')));
  const mismatched = exec(commandOf('merge.mjs open'));
  assert.deepEqual([mismatched.status, mismatched.stdout], [1, '']);
  assert.match(mismatched.stderr, /holds the letters A, B, C, D, and the map the letters A, B, C$/m);
  rmSync(join(round, 'board', 'D.json'));

  // The carry list the skill gives: the cast sheet's own lines, the tables of the stages still to run with "Blind rules" and
  // "Fresh pass", and the chosen file, its pictures and the pick. Built from the cast alone, the stamp refuses it.
  const carry = [...castCarry(2), ...['Detail', 'Look', 'Handoff', 'Acceptance', 'Blind rules', 'Fresh pass'].map(heading => `- cast@2#${slugOf(heading)}`),
    '- source:design/today/04-structure/chosen/chosen.json', '- source:design/today/04-structure/chosen/chosen-390-light.png', '- source:design/today/04-structure/chosen/chosen-1280-light.png', `- source:design/today/04-structure/${PICK}`];
  assert.ok(carry.includes('- cast@2#blind-rules') && carry.includes('- cast@2#fresh-pass'));
  write('structure', '[cast@2]', carry);
  const refused = exec(commandOf('state.mjs stamp'));
  assert.deepEqual([refused.status, refused.stdout], [1, '']);
  assert.match(refused.stderr, /^structure cannot be stamped:\n- "- intent@2#the-one-job" names intent, which structure is not built from; add it to built-from\n- "- context@1#the-people" names context, which structure is not built from; add it to built-from\n$/);
  write('structure', '[cast@2, intent@2, context@1]', carry);
  assert.match(run(commandOf('state.mjs stamp')), STAMPED('structure', 1));
  // The package stands: nothing stale, no question left open, Detail next, and the rejected round whole where it was moved.
  assert.equal(run(commandOf('state.mjs validate')), 'ok');
  assert.equal(run(commandOf('state.mjs next')), 'detail');
  assert.doesNotMatch(run(commandOf('state.mjs status')), /Which structure goes on/);
  assert.deepEqual(readdirSync(join(round, 'earlier', '1')).filter(visible).sort(), held);
  assert.deepEqual(parse(readFileSync(join(round, 'CHOSEN.md'), 'utf8')).data['built-from'], ['cast@2', 'intent@2', 'context@1']);
});
