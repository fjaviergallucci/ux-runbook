// The rules every skill of the kit keeps, and the eleven skills held to them.
// A skill is skills/<name>/SKILL.md, read by a session at the moment it must act and followed literally,
// with the long form of anything in references/ beside it. Each rule is a function, proven first on samples
// that exist nowhere else. Then each skill that is written is held to the rules, and each that waits for
// its task is a `todo` naming the task: take its `waits` out of the table and its test is live.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INPAGE, TYPES, validateAcceptance } from '../scripts/accept.mjs';
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
    name: 'detail', stage: true,
    description: 'Use when the interface design pipeline reaches Detail: the chosen structure is completed in every state, rule and string, as a clickable prototype.',
  },
  {
    name: 'look', stage: true,
    description: "Use when the interface design pipeline reaches Look: the finished appearance is designed on the project's tokens, or a visual direction is chosen where no design system exists.",
  },
  {
    name: 'handoff', stage: true,
    description: 'Use when the interface design pipeline reaches Handoff: an approved design is packed into one folder another session can build from without asking.',
  },
  {
    name: 'acceptance', stage: true,
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
  // In single quotes it reads as it is, since a header takes that form too (R170): the one fault is that a skill's is not written so.
  only(faults({ description: `'${ROOMS.description}'` }), /^SKILL\.md: header: the description is written in double quotes/);
  // Quoted another way, the quotes are part of what is read: both faults.
  assert.equal(faults({ description: `\`${ROOMS.description}\`` }).length, 2);
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
  // Everywhere in the conductor the word is one of the two, the name of a judge, or the flag or the slot of a script.
  for (const [file, text] of Object.entries(folderOf('design'))) {
    const rest = flat(text).replace(/project profile|profession's profile|profile judges?|profile card|--profile|traits <profile> --out|PROFILE\.md/g, '');
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
  // A stage may stop before its gate, on a page of its own: its own skill knows where that question was asked.
  assert.match(flat(section(conductor(), 'Resuming')), /An awaiting stage is not begun again\. A question a stage asked mid-way is put again by that stage's own skill, at the step that asked it\./);
});

test('the three rules are stated as rules for the session', () => {
  const text = flat(conductor().slice(0, conductor().indexOf('\n## ')));
  inOrder(text, [/1\. \*\*The chat is not an input\.\*\*/, /2\. \*\*What the founder says is written into the artefact before it counts\.\*\*/, /3\. \*\*A stage is run, or the route says why it is not\.\*\*/], 'the three rules');
  // What the first rule asks when a message contradicts the package: the fact's place, the one question, and a stop.
  inOrder(text, [/1\. \*\*The chat is not an input\.\*\*/, /When a message asserts something the package contradicts, it is not used: say at once which output and heading hold the package's fact, ask the one question, whether that stage is to be reopened, and do not go on with a stage that rests on the disputed fact until he answers\./, /2\. \*\*What the founder says/], 'a contradicted fact');
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
  for (const script of ['merge', 'page', 'describe']) assert.ok(run(script).length >= 1, `scripts/${script}.mjs is given`);
  // S7 of the fix review: the conductor keeps no copy of the commands that draw and picture a board. They are Structure's.
  for (const script of ['render', 'shots']) {
    assert.deepEqual(run(script), [], `scripts/${script}.mjs is given by the Structure skill alone`);
    assert.ok(stageCommands('structure').some(command => command.startsWith(`node <kit root>/scripts/${script}.mjs <package>/04-structure/board`)), script);
  }
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
  // Nor does a transcriber: its card reads neither, and it must not learn what the design is for.
  assert.ok(flat(read('templates/briefs/maker.md')).includes('A describer and a fresh maker get neither of these two, and nor does a transcriber: delete both lines.'));
  assert.ok(!kitCards()['maker.transcriber'].reads.includes('person') && !kitCards()['maker.transcriber'].reads.includes('profile') && kitCards()['maker.transcriber']['never-reads'].includes('intent'));
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
  // It is no procedure of its own: the skills run in their order, Frame first, and the one nod is on the picture.
  inOrder(text, [/A correction costs one nod\. It still goes through the skills, in their order, Frame first: `ux:frame` states its line and asks nothing, then `ux:detail` runs in its correction form, and Handoff and Acceptance in theirs\./,
    /This section says what is different about a correction: it is not a procedure to run by itself\./, /\*\*Frame in one line:\*\* the request, the three values, the route\. It is stated, and not put to him\./,
    /\*\*A before-and-after picture\*\* of the change, made at Detail\./,
    /\*\*The founder's nod\*\* is on that picture, with Frame's line beside it: the one question a correction asks\. If he disagrees with the line itself, that is not a nod: the design is framed again, at the size he names\./], 'a correction, in routes.md');
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
  inOrder(commands.join('\n'), [/scripts\/describe\.mjs --provider/, /scripts\/merge\.mjs <proposals dir> --out <board dir>$/m, /scripts\/page\.mjs /, /scripts\/merge\.mjs open <board dir>$/m], 'the commands of the order');
  // S7 of the fix review: the render and the shots keep no second copy of their commands here, which had fallen behind
  // Structure's own (one render, no first screen). The steps say what is drawn and pictured, twice each, and point to step 7.
  assert.ok(!commands.some(command => /scripts\/(?:render|shots)\.mjs/.test(command)), 'the render and the shots are given once, in the Structure skill');
  const drawn = flat(order.slice(order.indexOf('5. **The render.**'), order.indexOf('7. **The readers.**')));
  inOrder(drawn, [/5\. \*\*The render\.\*\* Each letter is drawn in the same kit, under its own letter, twice: with the makers' notes, for the judges, and without them, for the audiences/,
    /6\. \*\*The shots\.\*\* Every drawn page is photographed, at the primary width and at the phone width, twice: the whole page, and its first screen alone, as she meets it before any scrolling/,
    /The commands of both are step 7 of the Structure skill \(`skills\/structure\/SKILL\.md`\), and are given nowhere else/], 'blind.md: the render and the shots');
  assert.equal(boldSteps(section(stageSkill('structure'), 'Steps')).find(([, name]) => name.startsWith('Merge, draw, photograph'))[0], 7);
  for (const flag of ['--without-notes', '--first-screen']) assert.ok(commandsOf(stageSkill('structure')).some(command => command.includes('/04-structure/board') && command.endsWith(flag)), `step 7 of Structure gives ${flag}`);
  // The readers of step 7 are handed the board, and told what beside it they do not open.
  const readers = flat(order.slice(order.indexOf('7. **The readers.**'), order.indexOf('8. **The decision page.**')));
  assert.match(readers, /Of `04-structure\/`, a judge is handed the board folder and nothing else: its letters, pages and pictures\. An audience is handed the pictures only, each by its path: those of the pages drawn without the makers' notes, whole and first screen, and no other\. A picture of a page that carries the notes is never an audience's/);
  assert.match(readers, /What else a seat's brief template lists comes from the approved stages/);
  assert.match(readers, /list four things under "Do not open": the package's `work\/` folder, where the makers' briefs are, the map, the pick and the proposals folder/);
  // The kit every letter is drawn in is the project's kit folder, in the rule and in the step.
  assert.match(flat(order), /`<kit dir>` is always the project's kit folder, the one the project profile names/);
  // The rules of the table, as rules.
  const rules = flat(section(reference('blind.md'), 'The rules'));
  for (const rule of [/one shared kit/, /grey kit/, /the founder reads it first/, /(?:do not|never) see each other/, /continuity maker/, /by letter/, /Nothing is (?:shortlisted|detailed)/, /sealed/, /Of `04-structure\/`, a judge is handed the board folder and nothing else; an audience is handed the pictures only, those drawn without the makers' notes/]) assert.match(rules, rule);
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
  assert.match(steps, /Skip a question the project has already answered: write its answer from the project's document, and name that document by its path when you put the project profile to him/);
  inOrder(steps, [
    /1\. The product in one sentence/, /2\. The languages it ships/, /3\. His standing rules for interfaces/, /4\. The professions it serves/,
    /5\. Whether a brief may be sent to an outside text model/, /6\. Only when the session lists a screen generator among its tools/,
  ], 'the questions');
  assert.match(flat(section(setup(), 'Never')), /\*\*Never ask two things at once,\*\* and never ask what the project already says/);
  // Each answer has its place. The languages are written as codes, which his words do not give; the
  // professions are written as their stubs, at once.
  assert.match(steps, /He names them; you write their codes as `languages`, as `\[es, en\]`, and show him the line/);
  assert.ok(read('templates/project/PROFILE.md').includes('as `[es, en]`'), 'the template\'s own example of the codes');
  assert.match(steps, /Each one he or the project's documents name gets its stub at once, written from the template as step 6 says: the stubs are where this answer lives/);
  assert.match(steps, /When neither names one, no stub is written/);
  // The product's name, for the two titles, has a source.
  // It may be the project's own sentence, read and not asked.
  assert.match(steps, /Its title and the project profile's take the product's name from the sentence under `product`; when that sentence names none, ask him/);
  // What is asked beyond the six is named, and nothing else the template holds is a question.
  assert.match(steps, /Two more are asked when the project did not say them: the account a browser check uses, by its role, and where decisions are logged\. No more\./);
  // The kinds are not asked at setup: the template says what setup writes there, and Frame asks when a request fits none of the five.
  assert.match(flat(section(parse(read('templates/project/PROFILE.md')).body, 'Kinds this project adds')), /Setup writes "None while the five serve"; Frame asks when a request fits none\.\} $/);
  assert.match(flat(section(stageSkill('frame'), 'Steps')), /When the request fits none of them, ask him, before the frame, whether the project adds a kind: its name, what it is judged first on, its own rules\. What he adds is written under "Kinds this project adds" of the project profile, in his words/);
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
  assert.match(check, /Fill the `## Engine check` section of the project profile: the day, his answers to 5 and 6 of step 4, then a table `\| Seat \| Engine \| What the check found \|` with one row for each seat of the kit's pool, and under it one line for the browser/);
  // His no has a place too, a tool listed by name is listed, and a tool he refused is off.
  assert.match(flat(steps), /A no to 5 or to 6 is written too, under "Engine check"/);
  assert.match(flat(steps), /\(a tool it lists by name counts, loaded or not\)/);
  assert.match(check, /A tool listed by name counts, loaded or not; one he refused at step 4 is `off`\./);
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
    // S11 of the fix review: every folder's line names the check, the profiles' too, now that the card script takes a profile.
    assert.match(says, /, and checked with the kit's `scripts\/card\.mjs`\.$/, folder);
  }
  assert.match(KIT.usage('scripts/card.mjs'), /a file in profiles\/ is a profession's profile/);
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
    // Frame's cell goes on, after a semicolon, to say what a correction asks in its place.
    const [does, ...more] = stageRows().find(row => row[1].toLowerCase() === name)[5].split('; ');
    assert.ok(gate.startsWith(` **He ${does}`), `${name}: he ${does}`);
    assert.deepEqual(more, name === 'frame' ? ['at a correction, nods once, at Detail'] : [], name);
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
  assert.match(steps, /Steps 1 to 6 write nothing: the package is made at the gate, on his yes, but at size `correction`, where it is made at once\./);
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
  assert.match(steps, /In the `## Engine check` table of the project profile, find the row of each seat of the provisional cast, and of each maker that sits by rule, in this cast or not/);
  assert.match(flat(section(read('templates/package/00-frame.md'), 'Engines missing')), /Each seat of the provisional cast, and each maker that sits by rule, whose engine is missing or off/);
  assert.match(flat(presets()), /Three makers sit by rule too, and none of them by default/);
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
  assert.match(steps, /\*\*Sized `correction`, Frame is one line:\*\* the request, the three values and the route\. Steps 4 to 6 are not run: a correction casts no seat\. \*\*You state the line and ask nothing:\*\* a correction costs one nod, and it is asked at Detail, on the picture of before and after, beside this line\. So the package is made at once, by the commands of "Gate"\. The line is written where the template's first instruction stands/);
  assert.match(steps, /and `## Reviewed by the founder` holds his request, as he wrote it, and that the line waits for his nod at Detail\. It is stamped in the words of that request\./);
  assert.match(gate, /\*\*On his yes, and not before, make the package:\*\* but at size `correction`, where no yes is waited for and it is made at once\./);
  // The gate and the Never each say the exception, once.
  assert.match(gate, /- \*\*Sized `correction`, this gate asks nothing:\*\* the line is stated, the package is made at once and the frame is stamped in the words of his request, since the one nod of a correction is asked at Detail\. - \*\*If he corrects a value,\*\*/);
  assert.match(flat(section(text, 'Never')), /\*\*Never make the package before he has agreed the three values\.\*\* `init` runs once\. A correction is the one exception: its line is stated and not asked, and his nod at Detail is on it too\./);
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
  assert.match(flat(section(text, 'Reads')), /\*\*A judge of the project's own that sits at `context`,\*\* in `<packages>\/pool\/judges\/`: checked first, as step 3 says, and so only when the surface exists/);
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
  // Ruling R164: his words are asked here, once, at every design: what she calls these things, and any word she must never see.
  assert.match(steps, /"The founder's own words": asked here, once, at every design, as the last question of step 6: what she calls these things, and any word she must never see\. One or two sentences, as he says them, written verbatim: they go to the writer's brief later\. "None" is an answer: write it so\./);
  assert.doesNotMatch(flat(text), /she must read in order to act|Not asked/);
  assert.match(flat(section(outputOf('context'), 'The founder\'s own words')), /Asked here, once: what she calls these things, and any word she must never see\. One or two sentences as he said them, verbatim\. "None" is an answer\./);
  // A recommendation on a fact only he holds is never an opinion.
  assert.match(steps, /"Questions for the founder": each with a recommendation, or "None"\. For a fact only he holds, the recommendation says where his answer will be written and what the package already holds on it/);
  // What the product does not have is written under the inventory, and the project kit is no project source (R161).
  assert.match(steps, /The truth judge holds every design to this table\. Under it, what the product does not have that this design might reach for\./);
  assert.match(flat(section(outputOf('context'), 'What the product can show and do')), /\{What the product does not have, that this design might reach for: one line each, with its source\.\}/);
  assert.match(steps, /The project kit is not one, and never a source of facts about the product: the stages that draw reach it by `kit` of the project profile/);
  assert.match(steps, /"Project sources": the files a later stage may open directly, as the token files, the component source and the product-facts document\. One path to a line, from the project's root, with what it is: a file of the surface being redesigned, as it is, is "today's screen", one of another surface of the product "a sibling surface", and the file the inventory's example rows come from "the example data"\. A file you leave out is closed to every later stage/);
  // M1 of the fix review: the example data is marked where it is named, so that no later stage has to work out which source it is.
  assert.match(flat(section(outputOf('context'), 'Project sources')), /\{Beside the file the inventory's example rows come from: "the example data"\. With no such file, say so here\.\}/);
  assert.match(read('pool/CARD-FORMAT.md'), /\| `example-data` \| The project source the context names for the rows its inventory gives as examples/);
  assert.match(flat(read('pool/makers/prototype-builder.md')), /you make none up\. Where your brief hands you none and a page needs a row, leave it out and say so in your reply, with the pages that wait for it: the conductor asks the founder for the data, and it comes to you in a brief/);
  // A profession's profile that is missing is drafted, every trait a guess, corrected by him, then saved.
  assert.match(steps, /One that is missing is drafted from `templates\/people\/PROFILE-CARD\.md`, \*\*with the evidence of every trait marked `guess`\*\*: fill a field only from what the project's documents and the founder have said of that profession, and invent nothing\. Write the draft at once to `<packages>\/pool\/profiles\/<name>\.md`, so that a session that resumes finds it\. He corrects it at the gate/);
  // S11 of the fix review: a profile Context drafted or changed is held to its format here, before its gate and again after
  // his corrections, and not first at Cast, after Frame has named the profession and Intent's judge has read it.
  const profileCheck = 'node <kit root>/scripts/card.mjs check <packages>/pool/profiles/<name>.md';
  assert.ok(stageCommands('context').includes(profileCheck) && takenBy('card', words(profileCheck).slice(2).join(' ')), profileCheck);
  assert.match(steps, /Hold each such file you drafted or changed to its format before the gate, and again after his corrections: `node <kit root>\/scripts\/card\.mjs check <packages>\/pool\/profiles\/<name>\.md`\. A fault it prints is in how the file is written: mend its form, never a trait/);
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
  assert.match(steps, /Each of the "Questions for the founder", with its recommendation\. Write each answer into the context as it comes, in his words, where it belongs, and under its question say where: a session that stops midway loses none/);
  assert.match(gate, /what is wrong or missing in this context\? The gate is that one message from him: the questions of step 6 were put before it/);
  // What his correction itself raises is asked before the stamp: the questions of step 6 are not put again.
  assert.equal(gate.match(/one at a time/g).length, 1);
  assert.match(gate, /\*\*Write each correction where it belongs in the context, and all of them under `## Reviewed by the founder`:\*\* what he corrected, and the words he approved it with, as he said them\. After his correction, each fact it meets and each gap it opens is put to him, one at a time, with its source, before the stamp, as step 8 of the loop says: he decides each/);
  // Ruling R165: a source he has corrected is still carried, its line says so, and the stale fact is logged for Handoff.
  assert.match(gate, /\*\*A project source he has corrected is still carried\.\*\* Its line of "Project sources" says which point he corrected, and that the context holds\. The decision you append at the stamp names the stale fact and its file: Handoff gives the build a slice to mend the document/);
  assert.match(flat(section(outputOf('context'), 'Project sources')), /\{Beside a file he has corrected: which point, and that the context holds\.\}/);
  // Ruling R166: what he says of the profession reaches its profile, marked as his guess.
  assert.match(gate, /\*\*Write what he corrects of a profession's profile into its file,\*\* `<packages>\/pool\/profiles\/<name>\.md`\. What he says of the profession goes there too, under the characteristic it bears on, marked `guess \(the founder, <date>\)`, so that the profile judge has it\./);
  assert.match(flat(section(text, 'Never')), /A draft is a guess, and stays one until someone of that profession has been heard/);
  // What it carries: the sources, each profession's profile, and a section of the frame by its slug.
  assert.match(gate, /a `- source:<path>` line for each of the "Project sources" and for each profession's profile, by its path from the project's root; and the one section of the frame that Intent needs, "Who it is for", as `- frame@1#who-it-is-for`/);
  assert.ok(headings(outputOf('frame')).map(slug).includes('who-it-is-for'));
  // The short form is what the route's table says of an adjustment.
  assert.match(steps, /\*\*Routed `short`\*\* \(an adjustment\), Context is two things: what exists, and what changes/);
  assert.match(flat(reference('routes.md')), /a short Context \(what exists, what changes\)/);
  assert.match(steps, /"The founder's own words" are still asked for\. No seat reads the surface, and every other heading says "Not gathered: an adjustment"\. Steps 4 and 6 hold as written/);
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
  // Ruling R168: the offer says how much the judge has to judge by. His yes is written before the seat starts.
  assert.match(read5, /Offer it when the design is for one profession or several: it costs one agent for each, and the offer says how many "So the interface must" lines each profession's profile holds, since with few the judge has little to judge by\. On his yes, written under `## Reviewed by the founder` as he said it, start one `judge\.profile` for each profession's profile, each a fresh sub-agent, started as "Starting a seat" in the loop says, from a brief written from `templates\/briefs\/judge\.md`/);
  assert.ok(read('templates/people/PROFILE-CARD.md').includes('So the interface must:'));
  assert.match(read5, /it answers one thing: is the job stated as this profession would state it\?/);
  // Ruling R167: her card is not this read's, in the skill, in the brief and on the judge's card, and the gate says no seat read it.
  assert.match(read5, /Her card is not this read's: the brief lists it under "Do not open"/);
  assert.match(flat(section(read('templates/briefs/judge.md'), 'Do not open')), /\{A profile judge at Intent: the person's card, by its path\. It is not this read's\.\}/);
  assert.match(flat(read('pool/judges/profile.md')), /At \*Intent\* the artefact is the intent itself, and you answer one thing: is the job stated as this profession would state it\? Her person card is not this read's\./);
  assert.ok(!kitCards()['judge.profile'].reads.includes('person'));
  assert.match(flat(section(text, 'Gate')), /Put `02-intent\.md` in front of him, with her card, and say that her card was read by no seat: it is his to read/);
  // Ruling R169: only what blocks is mended before a gate, said once, in the loop.
  assert.match(flat(reference('loop.md')), /Only those: a `should` or a `note` is never mended before the gate, by a maker or by you, however small the fix and even on a page that is yours to write\. It goes to him open\./);
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
  // Ruling R151: with them, why it is built now, what exists today and what it must not become, so that the handoff's entry is written from the context and not from memory.
  assert.deepEqual([...carried[1].matchAll(/"([^"]+)"/g)].map(([, heading]) => heading), ['The people', 'What the product can show and do', 'Constraints', 'The founder\'s own words', 'The problem, and why now', 'What exists today', 'What it must not become']);
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
  // The check: every file of the five folders, in one run, as the command takes them (R162: a profession's profile is checked too).
  assert.ok(stageCommands('cast').includes('node <kit root>/scripts/card.mjs check <file>...'));
  assert.match(steps, /Name every `\.md` file of the project's `makers\/`, `judges\/`, `audiences\/`, `persons\/` and `profiles\/` folders in one run, each by its path, as `<packages>\/pool\/judges\/booking-truth\.md`/);
  const usage = KIT.usage('scripts/card.mjs');
  for (const folder of ['makers/', 'judges/', 'audiences/', 'persons/', 'profiles/']) assert.ok(usage.includes(folder), `card.mjs checks ${folder}`);
  assert.match(steps, /It prints one line for each file\. `ok`: the card is sound, and you may read it\. A file named `README\.md` is passed over: it is never a card/);
  assert.match(usage, /A file named README\.md is never a card: it is\s+passed over/);
  assert.match(flat(setup()), /each with a one-line `README\.md`/);
  assert.match(steps, /Any other line is a fault, and \*\*a faulty card is reported to the founder, with its lines, and left out\*\*: it is not cast and not mended by you, and it is never skipped in silence: it has its line under "Left out"/);
  // A faulty card that carried a kit card's id: the kit's card sits, and what is left out is the replacement.
  assert.match(steps, /it has its line under "Left out"\. Where it carries the id of a kit card, the kit's card sits in its place, and the cast sheet says so: the line under "Left out" then names the project's replacement, not the seat/);
  assert.match(steps, /A profession's profile, in the project's `profiles\/` folder, is checked in the same run: a faulty one is reported the same way, and no seat is loaded with it/);
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
  assert.deepEqual(readmes.filter(([, says]) => says.endsWith(', and checked with the kit\'s `scripts/card.mjs`.')).map(([folder]) => unspan(folder)), ['profiles/', 'persons/', 'makers/', 'judges/', 'audiences/']);
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
  // Ruling R151: the readers' findings of the intent go on too, and the read of the surface as it is travels in the context's first section.
  assert.match(gate, /A `- intent@<version>#<slug>` line for every section of the intent but "Reviewed by the founder" and "Carry", `<version>` being the version the intent stands at, as `status` prints it: "What the readers found" goes on too, so that the handoff covers every seat\. The `- context@<version>#<slug>` and `- source:<path>` lines of the intent's own carry list, as they are: the read of the surface as it is travels in "The problem, and why now"/);
  assert.deepEqual(headings(outputOf('intent')).slice(-3), ['What the readers found', 'Reviewed by the founder', 'Carry']);
  // No version of a carry line is written as a number, here or at Intent: after a reopening a remembered 1 is wrong.
  for (const name of ['intent', 'cast']) assert.doesNotMatch(leads(section(stageSkill(name), 'Gate'))['Write the carry list'], /@\d/, name);
  assert.match(leads(section(stageSkill('intent'), 'Gate'))['Write the carry list'], /And a `- context@<version>#<slug>` line for each section of the context a later stage is written from: .* `<version>` is the version the context stands at, as `status` prints it: after a reopening it is not 1/);
  for (const name of ['intent', 'cast']) assert.ok(stageCommands(name).includes('node <kit root>/scripts/state.mjs status <package>'), `${name} reads the state`);
  assert.match(flat(read('templates/package/01-context.md')), /## The problem, and why now \{What is wrong or missing today, for whom, and why it is worth doing now\. When the surface already exists: what the judges that read it as it is \(step 3\) found, from screenshots, each with its seat/);
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
  // Added by rule: the cards preset for no size, the two judges the kind brings in, and the reader a fresh pass at Look seats (ruling R144).
  const ruled = [...new Set(spansOf(section(text, 'Added by rule')).filter(isSeat))];
  assert.deepEqual(ruled.filter(id => cards[id].presets.length === 0).sort(), Object.values(cards).filter(card => card.presets.length === 0).map(card => card.id).sort());
  assert.deepEqual(ruled.filter(id => cards[id].presets.length > 0).sort(), ['audience.task-reader', 'judge.truth', 'judge.words']);
});

test('presets.md: what is added by rule, how the table is read, and what a seat does without its engine', () => {
  const text = presets();
  const byRule = flat(section(text, 'Added by rule'));
  // The truth judge sits on a public page at every size (the design sets no limit); the other lines keep "from a surface up".
  inOrder(byRule, [
    /At every size, an adjustment's short cast among them:/, /`judge\.truth` always sits on a public page, at each stage of the route its card sits at\. It is never left out there/,
    /At any size from a surface up:/, /`judge\.profile`, once for each profession's profile/, /`judge\.words` gets its own question/,
  ], 'added by rule');
  assert.equal(kitCards()['judge.truth']['cast-when'], 'The design shows data or offers actions the product must really have, and always when it is a public page.');
  assert.match(byRule, /`judge\.profile`, once for each profession's profile, when the context's people section says the experience is for one profession or for several: at Frame, where no context exists yet, by Frame's own "Who it is for"\. When it says everyone, the project's own sit: with one profession's profile in the project's pool, its judge; with two or more, two contrasting ones, the least comfortable with technology and the one with the highest stakes\. Never all of them/);
  // The project's pinned and banned seats, at every size, and the one seat a project cannot ban.
  const intro = flat(text.slice(0, text.indexOf('\n## ')));
  assert.match(intro, /On top of it, at every size, the project's `pinned` seats always sit and its `banned` seats never do, with one exception: a project cannot ban the truth judge on a public page, and Cast tells the founder when the two meet/);
  assert.match(byRule, /It reads at Structure, at Detail, which is its main read, and at Acceptance; at Look only when one of its optional checks about legibility \(`physical`\) is on, or the profession's profile has a "So the interface must" line under its usage context/);
  assert.ok(tableRows(section(read('pool/judges/profile.md'), 'Optional checks')).some(([id]) => id === 'physical'), 'the check it names is the card\'s');
  assert.ok(headings(read('templates/people/PROFILE-CARD.md')).includes('Usage context'));
  assert.match(byRule, /`judge\.truth` always sits on a public page/);
  assert.match(byRule, /`judge\.words` gets its own question to the founder when the kind is `first-run`, `message` or `public-page`/);
  // The conductor's table of the kinds says the same of the three.
  const kinds = Object.fromEntries(tableRows(section(reference('routes.md'), 'Kind')).map(row => [unspan(row[0]), row[3]]));
  assert.deepEqual([kinds['first-run'], kinds.message, kinds['public-page']], ['the words get their own review', 'the words get their own review', 'the truth judge always sits']);
  // Ruling R144: with a fresh pass at Look, Cast seats the three that read the beside comparison, so that each has a line, a model and an effort.
  assert.match(byRule, /With a fresh pass at Look, three seats read the beside comparison, the same screen in each version, by letter: `judge\.truth`; `judge\.profile`, once for each profession's profile, when the context's people section names one; and `audience\.task-reader`, once, as the primary person\. Each has its line in the "Look" table of the cast sheet, which says that it reads the beside comparison/);
  // It holds at every size at which a fresh pass runs at Look: the rule stands with those of every size, before those from a surface up.
  inOrder(byRule, [/At every size, an adjustment's short cast among them:/, /With a fresh pass at Look, three seats read the beside comparison/, /The rule holds at every size at which a fresh pass runs at Look, an adjustment's among them/, /At any size from a surface up:/], 'the beside readers, at every size');
  assert.match(read('templates/briefs/audience.md'), /^- \*\*Stage:\*\* \{Structure · Detail · Look · Acceptance\}$/m);
  for (const id of ['judge.truth', 'judge.profile', 'audience.task-reader']) assert.ok(kitCards()[id]['sits-at'].includes('look'), `${id} sits at look`);
  assert.match(flat(read('pool/audiences/task-reader.md')), /At Look you sit only in a fresh pass: the options are versions of one finished screen, each under a letter\. Rank them as any options, and never guess which was made how/);
  assert.match(flat(read('templates/outputs/LEDGER.md')), /The profile judge, at Structure and for a beside comparison at Look: delete it otherwise/);
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
  assert.equal(contextLines.length, 7);
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
  const intentLines = headings(outputOf('intent')).slice(0, -2).map(heading => `- intent@1#${slugOf('cast', heading)}`);
  assert.equal(intentLines.length, 11);
  assert.ok(intentLines.includes('- intent@1#what-the-readers-found'), 'the readers\' findings of the intent go on to the handoff');
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

// ---- what the dry run found in setup and the four opening stages (Task 20; rulings R160, R163 to R169)

test('the dry run, the loop: the carry list is a ceiling, await writes the header, Frame has no await, and the sheet\'s columns are Model and Effort', () => {
  const loop = flat(reference('loop.md'));
  // F25: a stage opens what it uses of what the carry list names, and a section under its heading only.
  assert.match(loop, /\*\*The carry list is a ceiling, not a reading list\.\*\* Of what it names, open what this stage uses: nothing else is open to it, and an entry this stage has no use for stays closed\. A section entry is read under its heading only\. Where a stage's skill says "exactly what its carry list names", it means this\./);
  assert.match(flat(section(conductor(), 'The loop')), /2\. \*\*Read the package, not the chat\.\*\* The output of the stage before and, of what its carry list names, what this stage uses: nothing else\./);
  // F1: the loop is the nine stages', and setup has its own steps.
  assert.match(flat(section(conductor(), 'The loop')), /read it before the first of the nine stages you conduct; setup has its own steps\./);
  assert.doesNotMatch(flat(setup()), /loop\.md/);
  // F37: a file written whole after `await` would put the old header back.
  assert.match(loop, /\*\*`await` writes that header,\*\* as `begin` and the stamp do: read the file again before you edit it, and of the header write `built-from` only\. A file written whole from what you held before `await` puts the old header back\./);
  // R163: nothing of a frame is on disk before his yes.
  assert.match(loop, /Frame is the one stage with no `await`\. It writes nothing before his yes, so there is no output to record a question on: a session that resumes and finds no package frames the request again\./);
  assert.match(flat(section(stageSkill('frame'), 'Steps')), /\*\*A frame he has not yet answered is nowhere on disk\.\*\* Frame writes nothing before his yes, so it is the one stage with no `await`: a session that resumes and finds no package frames the request again\./);
  assert.ok(!stageCommands('frame').some(command => command.includes(' await ')));
  // F43: the columns hold the cards' suggestions until he changes one, and the loop names them as the template does.
  assert.match(loop, /the columns "Model" and "Effort"\. They hold the cards' suggestions until he changes one, the cast sheet is the founder's, and he may have changed any of them at Cast: follow the sheet, not the card/);
  const columns = tableRows(outputOf('cast'))[0];
  for (const column of ['Model', 'Effort']) assert.ok(columns.includes(column), column);
  assert.match(flat(section(stageSkill('cast'), 'Steps')), /The sentence has its line at the top of the sheet, and the columns "Model" and "Effort" hold the cards' suggestions until he changes one\./);
});

test('the dry run, setup and Frame: a tokens choice is a proposal he decides, the grey kit\'s dark block goes, and a name or a fact in his answer has its place', () => {
  const kit = flat(projectKit());
  // R160: where the system has no part for a class's job, the conductor writes what it would take, marked, and he decides each.
  assert.match(kit, /\*\*Where the system has no part for a class's job,\*\* or its part cannot be styled once \(a status tag with a colour for each state\), which tokens the class wears is not yours to settle\. Give it the tokens you would take, and write each such choice into the project profile's "Design system", marked "the conductor's proposal", with the grey kit's own value beside it\. He decides each one at the gate, from the pictures\./);
  assert.match(kit, /Name each line marked "the conductor's proposal" with its picture: he decides each, and the mark comes off a line on his word alone\./);
  // F7: the grey kit's dark block would win over the mapping in dark, and its opening comment names the grey kit.
  assert.match(kit, /The grey kit's own `@media \(prefers-color-scheme: dark\)` block sets the same properties to greys, and in dark it would win over what you just gave them\. Take out of it each property that now reads a token whose file switches itself, and the block with the last one\. A property that keeps the grey kit's own value keeps its dark one there too\. Then rewrite the opening comment of `kit\.css`/);
  assert.match(read('kit/grey/kit.css'), /@media \(prefers-color-scheme: dark\) \{\s+:root \{\s+--ux-/);
  assert.match(read('kit/grey/kit.css'), /^\/\* The grey kit: [^\n]*for a project with no\s+design system/);
  // F13: a new name is no value, and a fact in his answer is quoted where it bears on a value.
  const gate = flat(section(stageSkill('frame'), 'Gate'));
  assert.match(gate, /A new name for the design is no value: it is taken as he gives it, and the frame is not put to him again for it\./);
  assert.match(gate, /A fact his answer holds \("the Today screen stays as it is"\) is written there with it and, where it bears on one of the three values, quoted in that value's why: nowhere else in the frame\./);
  // F15: Frame's own mode has its row, and a stage the size sets says so.
  assert.match(gate, /prints it, Frame's own first; the reason is "the size sets it", or why you and he changed it\./);
  const route = tableRows(section(outputOf('frame'), 'Route')).slice(2);
  assert.deepEqual(route.map(([stage]) => stage), STAGES);
  assert.match(route[0][1], /never skipped/);
  assert.match(flat(section(outputOf('frame'), 'Provisional cast')), /from the cast skill's `presets\.md`, with the seats of `pool\/INDEX\.md` and the project's own pool/);
  // F14: an instruction that applies at one size or in one mode says what to do with it elsewhere.
  assert.match(flat(outputOf('frame')), /At any other size, delete this line\.\}/);
  assert.match(flat(outputOf('intent')), /\{One page for a surface: then delete this paragraph\./);
  assert.match(flat(read('templates/package/06-look/LOOK.md')), /Inside a design system, delete this paragraph\.\}/);
  // F16: when a decision is also the project's to log is a test, not a judgement.
  assert.match(flat(read('templates/package/DECISIONS.md')), /The test, at every stage: it adds or changes a token, a part or a string the product already keeps, or it changes a fact the project's facts document states\./);
});

test('the dry run, Intent and Cast: what is not on record is said so, a remark is not a correction, and Cast is told what it cannot read off a card', () => {
  const intent = stageSkill('intent');
  const steps = flat(section(intent, 'Steps'));
  // F26, F27, F29.
  assert.match(steps, /she is named for her moment, as the kit's five are \(`first-timer`\), never by a first name nobody gave her/);
  assert.ok(existsSync(at('pool/persons/first-timer.md')));
  assert.match(steps, /A row, or a part of one, that rests on a fact the context does not hold says so: "not on record: <what is missing>; written again when <it is known>"\. So does a "cannot occur" whose reason rests on an unknown\./);
  assert.match(steps, /"The feeling": in her word, not a designer's\. With no word of hers in the package, "not on record", in the same form: a word is never made up for her\./);
  assert.match(flat(section(outputOf('intent'), 'States')), /\{What rests on a fact nobody has yet says so: "not on record: …; written again when …"\.\}/);
  assert.match(steps, /The start is told in the third person, and the goal is hers, quoted\. As: start, "A man has walked in with no booking and is waiting at the desk"; goal, "I need a room he can go into now\."/);
  assert.match(flat(section(outputOf('intent'), 'Tasks for the audience')), /\*\*Start:\*\* \{where she is, and what she has, in the third person\} \*\*Goal:\*\* \{what she wants, as she would say it, quoted\}/);
  // F28: when the intent needs a fact.
  assert.match(flat(section(intent, 'Reads')), /The intent needs a fact when a criterion, a task or a row of "States" cannot be written without it\. A fact only Detail needs is no reason to go back: it goes under "Constraints that will bite", as not on record\./);
  // R166, on her card: what only the founder said of her profession is a guess.
  assert.match(steps, /What only the founder has said of her profession is a guess too, marked as his, until someone of that profession has been heard\./);
  // F32, F24.
  const gate = flat(section(intent, 'Gate'));
  assert.match(gate, /A remark that changes what the page says is a correction; one that explains it is written here and nowhere else\./);
  assert.match(gate, /The frame's section that the context carried stops here: "The people" says who it is for\./);
  // F30: the profile is read first by a profile judge, and a profile with no specialty is its base alone.
  assert.match(flat(read('templates/briefs/judge.md')), /Of the lines under the list, keep those that apply: a profile judge's profile line becomes item 1\.\}/);
  for (const brief of ['judge', 'maker']) assert.match(flat(read(`templates/briefs/${brief}.md`)), /\}, or with no specialty its base alone: \{its absolute path\}/, brief);
  // Cast: F10, F39, F40, F41, F11, F44, F45.
  const cast = flat(section(stageSkill('cast'), 'Steps'));
  const bySize = flat(section(presets(), 'By size'));
  assert.match(bySize, /The rows are by size alone: the kind of the design enters only through "Added by rule"\./);
  const lenses = [...section(read('pool/makers/structure-describer.md'), 'Method').matchAll(/^ {3}- \*([A-Z][a-z ]+)\*: /gm)].map(([, lens]) => lens.toLowerCase());
  assert.deepEqual(lenses, ['fewest steps', 'guided', 'defaults first', 'in place']);
  for (const lens of lenses) assert.ok(section(presets(), 'By size').includes(`  - *${lens}*: `), `what ${lens} favours`);
  assert.match(bySize, /names its lens, under "Loaded with"\. What each favours, so that you can choose without opening the card:/);
  assert.match(cast, /the one whose moment the intent's tasks do not already cover, with the reason on its line\. A describer's lens goes under "Loaded with" too\./);
  assert.match(bySize, /The contrast person is the one whose moment the intent's tasks do not already cover: her line of the cast sheet says which moment that is\./);
  assert.match(cast, /The profile judge's checks are cut on the profession's profile it is loaded with, where their triggers are, and each row of the sheet is cut for its own stage\./);
  assert.match(flat(section(read('pool/judges/profile.md'), 'Optional checks')), /Its trigger is seen in the profile you were handed/);
  assert.match(cast, /A maker that sits by rule and is not cast, its engine being off, is shown under "Left out"\./);
  assert.match(cast, /"None" when the preset sits whole\. With them, each maker that sits by rule and has its engine off\./);
  assert.match(flat(section(outputOf('cast'), 'Left out')), /Each seat of the preset that does not sit, and each maker that sits by rule with its engine off, and what is lost without it/);
  assert.match(cast, /where you think one would earn its cost, say so in one sentence here, as a statement: the gate keeps its one question\./);
  assert.match(cast, /Say there too that it counts first reads: a stage whose judges block adds one maker and one judge for each\./);
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
  'product-facts': /the project's facts document/, 'example-data': /the data the brief's example rows came from, where "Project sources" of the context names such a file/, options: /`<package>\/04-structure\/board\/`, the board folder, whole/, pictures: /pictures|the board folder, whole/, profile: /Its profession's profile, whole/,
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
  // M2 of the fix review: the sheet's columns are "Model" and "Effort", and hold his choice once he has made one.
  assert.match(reads, /its engine and its model and effort/);
  assert.doesNotMatch(reads, /suggested model and effort/);
  // Each key of the project profile it reads is a key of the template, and none of them is about a key.
  const keys = spansOf(section(text, 'Reads').split('\n- ').find(bullet => bullet.startsWith('**The project profile,**'))).filter(span => !span.includes('/'));
  assert.deepEqual(keys, ['kit', 'facts', 'engines-on', 'openai-model', 'gemini-model']);
  for (const key of keys) assert.ok(profileKeys().includes(key), key);
  assert.match(reads, /and nothing about a key/);
  assert.match(reads, /one card, when the cast sheet names its seat: `pool\/makers\/outside-describer\.md`, which speaks to you\. Every other card is read by its seat: a brief is filled from `references\/seats\.md`, never from a card/);
  assert.match(read('pool/makers/outside-describer.md'), /This card speaks to that session/);
  assert.match(reads, /\*\*Never\*\* today's screen, the package's `work\/` folder, `<package>\/04-structure\/earlier\/`, or the chat/);
  // What it writes: everything the round holds, and each template it is written from.
  const writes = section(text, 'Writes');
  assert.match(flat(writes), /Everything below is in `<package>\/04-structure\/`, and the seats' briefs in `<package>\/work\/`/);
  const rows = tableRows(writes).slice(2);
  assert.deepEqual(rows.flatMap(([first]) => spansOf(first)), ['BRIEF.md', 'BRIEF-fresh.md', 'proposals/', 'fresh/', 'board/', MAP, PICK, 'reads/', 'decision.json', 'decision.html', 'chosen/', 'earlier/', 'CHOSEN.md']);
  assert.deepEqual(kitPaths(writes).filter(path => path.startsWith('templates/')).sort(), ['templates/outputs/LEDGER.md', 'templates/outputs/PICK.md', 'templates/outputs/TASK-READ.md', 'templates/outputs/decision.json',
    'templates/package/04-structure/BRIEF-fresh.md', 'templates/package/04-structure/BRIEF.md', `templates/package/${ARTEFACT.structure}`]);
  assert.deepEqual(filesUnder('templates/package/04-structure/'), ['BRIEF-fresh.md', 'BRIEF.md', 'CHOSEN.md']);
  // The output carries sections of the cast, the intent and the context on, so it is built from all three.
  assert.match(flat(writes), /The output is built from the cast, the intent and the context\. `<version>` is the version a stage stands at, as `node <kit root>\/scripts\/state\.mjs status <package>` prints it: after a rejected round it is not 1/);
  assert.match(writes, /`CHOSEN\.md` \| the stage's output, with `built-from: \[cast@<version>, intent@<version>, context@<version>\]`/);
  // No version is written as a number: after a rejected round a remembered 1 is wrong.
  for (const [file, body] of Object.entries(folderOf('structure'))) assert.doesNotMatch(body, /\b(?:frame|context|intent|cast)@\d/, file);
  assert.match(flat(stepOf(section(text, 'Steps'), 'Read the cast sheet')), /Copy the template to `<package>\/04-structure\/CHOSEN\.md` and write `built-from`, unless the file is already there: then go on from what it holds\./);
  // At the gate the output is filled heading by heading, as its template says, and the headings the skill names are the template's.
  const gate = flat(section(text, 'Gate'));
  assert.match(gate, /\*\*Fill `CHOSEN\.md`,\*\* heading by heading, as its template says: from `PICK\.md`, the picked letter's file, the reads and, for "Not chosen", the map\. "Marked in the fresh gallery" holds his marks, in his words, each with its picture/);
  for (const heading of ['Not chosen', 'Marked in the fresh gallery', 'Reviewed by the founder', 'Carry']) assert.ok(headings(outputOf('structure')).includes(heading), heading);
  assert.equal([...outputOf('structure').matchAll(/^\{/gm)].length >= headings(outputOf('structure')).length - 1, true, 'the template says what goes under each heading');
  inOrder(gate, [/Under `## Reviewed by the founder`, after his yes to the brief: what he asked to be changed on the way to Detail, as he said it, or "Nothing"/, /\*\*Write the carry list,\*\* `## Carry`: the lines of the cast sheet's own carry list, as they are/,
    /a `- cast@<version>#<slug>` line for the table of each stage still to run, for "Blind rules" and for "Fresh pass"/, /a `- source:<path>` line, from the project's root, for the chosen proposal's file, for each of its pictures, for `PICK\.md`, and for the picture of each mark he made in the fresh gallery/,
    /\*\*Stamp it,\*\* in the words he picked with/, /state\.mjs stamp <package> structure --words/, /Then append the decision to the package's `DECISIONS\.md`, his gallery marks with it as he said them, and ask the state what is next, as step 9 of the loop says/], 'the gate, after the pick');
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
  // The pictures are taken into the board, where the conductor puts them, and the decision page is built beside it.
  const commands = stageCommands('structure');
  assert.ok(commands.includes('node <kit root>/scripts/shots.mjs <package>/04-structure/board --out <package>/04-structure/board --widths <primary>,<phone> --first-screen'));
  assert.ok(commands.includes('node <kit root>/scripts/page.mjs <package>/04-structure/decision.json --out <package>/04-structure/decision.html'));
  assert.match(flat(reference('blind.md')), /\*\*The board holds four things:\*\* the letters' files, the drawn pages, the kit's stylesheets that the render copies beside them, and the pictures/);
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
  assert.match(readers, /Every reader's brief lists under "Do not open" the map, the pick, the proposals folder and the makers' files, then `CHOSEN\.md`, the cast sheet and, where a continuity maker is cast, today's screen: the whole list, and what else each is handed from the approved stages, is in `references\/seats\.md`/);
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
    '<package>/04-structure/BRIEF-fresh.md', '<package>/04-structure/earlier/', '<package>/03-cast.md', '<package>/04-structure/CHOSEN.md']) assert.ok(common.includes(`\`${path}\``), path);
  assert.match(common, /the judges in one message, so that no ledger exists while another judge reads, then the audiences\. They read by letter/);
  // What the cast sheet and the output would tell a reader, and today's screen where one maker saw it.
  assert.match(common, /`<package>\/03-cast\.md`, the cast sheet: it holds each maker's lens and engine; - `<package>\/04-structure\/CHOSEN\.md`: from step 4 it names the seats that send the brief out/);
  // Today's screen is closed to every reader, with no exception: the one reader whose card reads it reads it at Context.
  assert.match(common, /when a continuity maker is cast, today's screen, as a picture or as source: whoever has seen it can tell which letter kept its layout\. It is listed for every reader\. The usability judge's card reads `current-screens`, but at Context: at Structure it is handed the options and nothing of today/);
  assert.doesNotMatch(common, /every reader but/);
  assert.deepEqual(Object.values(cards).filter(card => card.shelf !== 'maker' && card.reads.includes('current-screens')).map(card => card.id), ['judge.usability']);
  assert.match(read('pool/judges/usability.md'), /\*Context\*: today's interface, before any intent exists/);
  assert.match(read('pool/judges/usability.md'), /\*Structure\*: each option your brief hands you, by its letter/);
  assert.doesNotMatch(leads(subsection(seats, '`judge.usability`')).Handed, /today/);
  // A proposal's file is named for its seat's line on the cast sheet, so that the opened map tells two describers apart.
  assert.match(flat(section(seats, 'The makers')), /`<name>`, in `<package>\/04-structure\/proposals\/<name>\.json`, is the seat's line on the cast sheet, made unique: `describer-fewest-steps`, `describer-guided`, `outside-openai`, `fresh-generator`\. No two files share one\. The name is what the map prints for a letter once it is opened/);
  // The project's kit is wherever the project profile says it is.
  assert.match(leads(subsection(seats, '`maker.screen-generator`'))['Do not open'], /the project's kit, `<kit dir>`, and the kit's own/);
  for (const [file, body] of Object.entries(folderOf('structure'))) assert.doesNotMatch(body, /<packages>\/kit/, file);

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
  assert.match(audience.Handed, /the pictures of every letter drawn without the makers' notes, at the width each task puts her at, each by its path in `<package>\/04-structure\/board\/`: the whole page, as `A-screens-390-light\.png`, and its first screen alone, as `A-screens-390-light-first\.png`\. The pictures, and pictures only\./);
  // The names are the ones the two scripts give: the page drawn without the notes, pictured whole and as its first screen.
  assert.match(KIT.usage('scripts/shots.mjs').replace(/\s+/g, ' '), /named <name>-<width>-<theme>-first\.png, beside the whole page/);
  assert.match(flat(seats), /`<letter>\.html` carries them, and `<letter>-screens\.html` does not\./);
  assert.match(flat(seats), /A picture of the first screen is the window's height, with no scrolling, and its name ends `-first\.png`\./);
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
    'node <kit root>/scripts/describe.mjs --provider <openai|gemini> --model <id> --brief <package>/04-structure/<brief> --out <package>/04-structure/proposals/<name>.json --profile <packages>/PROFILE.md',
    'node <kit root>/scripts/merge.mjs <package>/04-structure/proposals --out <package>/04-structure/board',
    'node <kit root>/scripts/render.mjs <package>/04-structure/board/<letter>.json --kit <kit dir> --out <package>/04-structure/board/<letter>.html --letter <letter>',
    'node <kit root>/scripts/render.mjs <package>/04-structure/board/<letter>.json --kit <kit dir> --out <package>/04-structure/board/<letter>-screens.html --letter <letter> --without-notes',
    'node <kit root>/scripts/shots.mjs <package>/04-structure/board --out <package>/04-structure/board --widths <primary>,<phone> --first-screen',
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
    /\*\*Only now may the map be opened,\*\* after a graft's re-read, and only this way/, /refuses until `PICK\.md` holds his pick/, /merge\.mjs open <package>\/04-structure\/board/, /for "Not chosen", the map/,
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
  // He may have said yes to one brief and not yet to another: a fresh brief written later has its own stop.
  assert.match(stepOf(steps, 'Begin'), /In work, it goes on from the first step with a file missing: step 4, until `CHOSEN\.md` holds his yes to every brief in the folder\./);
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
  assert.match(makers, /`<name>` is its line of the cast sheet, made unique, as `describer-fewest-steps` or `outside-openai`/);
  assert.match(makers, /An outside describer is no sub-agent: you run it, once for each of its lines, on the brief he approved for that line, `<brief>`, which is `BRIEF\.md` or, in a fresh pass, `BRIEF-fresh\.md`\. These five flags and nothing else, since the script finds its key itself/);
  assert.match(makers, /What comes back is a proposal like any other, an answer that is not in the format, or a refusal, which is reported to the founder as the script words it: `references\/seats\.md` says what follows/);
  assert.match(KIT.usage('scripts/describe.mjs'), /kept as it came in\n<file\.json>\.raw\.txt/);
  const outside = leads(subsection(structureRef('seats.md'), '`maker.outside-describer`'));
  assert.match(outside.Handed, /^the brief he approved, whole and unchanged: `<package>\/04-structure\/BRIEF\.md`, or `<package>\/04-structure\/BRIEF-fresh\.md` for a line that belongs to a fresh pass\. That file is the `<brief>` of the command\. The script sends that one file\. Add nothing to it/);
  // One truth in both files: the script writes the engine of an outside answer, and the session its track.
  assert.match(outside.Writes, /The script has written `engine` and `model` into it, so of the two keys of step 6 you add `track` alone/);
  assert.match(KIT.usage('scripts/describe.mjs'), /"engine": "model:<provider>" and "model": "<id>"/);
  assert.match(outside['An answer that is not in the format'], /leaves `<name>\.json\.raw\.txt` in the proposals folder, and the script exits 1 and says why\. Start one `maker\.transcriber` on that file\. You never write it into the format yourself/);
  assert.match(outside['A refusal leaves nothing'], /^Tell the founder what the script printed, as it printed it\. Try once more only after a timeout\. Never look for the reason in a file of keys or in the environment\. Then go on with the seats you have: the decision page says this seat did not answer/);
  const never = flat(section(text, 'Never'));
  assert.match(never, /and never send anything else off it\. A provider that `engines-on` does not list gets nothing: you turn no engine on/);
  assert.match(never, /or any flag but the five of step 5\. Never open, list or name a file of keys, and never print the environment/);
  // A proposal is tagged, checked by its maker and again by the merge, sent back once, then left out and said so: never repaired.
  const tag = stepOf(steps, 'Tag each proposal, and mend none');
  assert.match(tag, /Each file gets two keys, and a rewrite that keeps every value as its maker wrote it touches nothing else: `track`, `system` or, for a fresh concept, `fresh`; and `engine`, as its seat's line of the cast sheet has it, unless the outside script has written it already/);
  assert.match(tag, /Each maker checks its file with the command its card gives, and the merge holds every file to `validate` again: while one fails it writes nothing, and prints the file and the fault/);
  for (const file of ['pool/makers/structure-describer.md', 'pool/makers/transcriber.md']) assert.match(read(file), /\*\*Check it\*\* before you return it/, file);
  assert.match(KIT.usage('scripts/merge.mjs'), /Every\nproposal must be valid, or nothing is written/);
  assert.match(tag, /That proposal goes back to its maker once, a fresh sub-agent in the same seat\. One that fails again is moved to `<package>\/04-structure\/proposals\/left-out\/`, and the decision page says so\. You repair none: that would make you a maker/);
  assert.match(KIT.usage('scripts/merge.mjs'), /sub-folders\nare not read/);
  // A shared machine: one command after another, three browser-driving at most, and no process stopped by name.
  assert.match(stepOf(steps, 'Merge, draw, photograph'), /Render twice for each letter, the second time without the makers' notes, for the audiences; then the shots once, at the brief's two widths, every page pictured twice, whole and as its first screen alone: `references\/seats\.md` says who is handed which\..*Never more than three browser-driving commands or seats at once\./);
  assert.match(flat(structureRef('seats.md')), /The makers are started in one message, after his yes to the brief and never before\. Those that drive a browser, the screen generators, are started three at a time at most\. A proposal the merge refuses goes back once: to a fresh sub-agent in the same seat, with the same brief, its own file and the fault as the merge printed it/);
  assert.match(never, /\*\*Never stop a process by name or by pattern,\*\* or start a browser other than through the kit's scripts/);
});

test('structure: the decision is one page: every letter, one line for each seat, one recommendation, one question, and a fresh gallery beneath and apart', () => {
  const text = stageSkill('structure');
  const page = stepOf(section(text, 'Steps'), 'Build the decision page');
  assert.match(page, /Write `<package>\/04-structure\/decision\.json` in the shape of `templates\/outputs\/decision\.json`: the options by letter, one line for each seat that read them, one recommendation, one question/);
  assert.match(page, /Its identity is the design's name, kind and size, as `status` prints them/);
  // The one recommendation is seen to come from the readers: it rests on the reads, by letter, and names the seats it rests on.
  assert.match(page, /The recommendation rests on the reads, by letter, and its one sentence of reason names the seats it rests on: never what you think of a letter, or know of its maker/);
  assert.match(flat(reference('loop.md')), /You recommend, and never decide: one option, one sentence, resting on the reads/);
  assert.match(flat(reference('blind.md')), /Your recommendation rests on the reads, by letter/);
  assert.match(page, /Every letter of the board is an option: the `name` in its file is the title, its `bet` the line, and its pictures are named from the page, the phone width first, as `board\/A-390-light\.png`/);
  assert.match(page, /A proposal left out, and a seat that did not answer or was held back, is one line under `findings`, by seat, never by letter/);
  assert.match(page, /With a fresh pass, its `gallery` sits beneath the options, labelled as fresh and never mixed into them: the screens as they came, from `fresh\/`, none saying which letter holds its structure/);
  // Each key it names is one the page takes, and the template is a Structure page: stage 5 of 9, a gallery, one question.
  const sample = JSON.parse(read('templates/outputs/decision.json'));
  for (const key of ['identity', 'options', 'gallery', 'seats', 'recommendation', 'question']) assert.ok(Object.hasOwn(sample, key), key);
  assert.ok(Object.hasOwn(JSON.parse(read('templates/outputs/decision-approve.json')), 'findings'));
  assert.deepEqual([sample.identity.stage, sample.identity.of], [STAGES.indexOf('structure') + 1, STAGES.length]);
  assert.deepEqual(Object.keys(sample.options[0]), ['letter', 'title', 'line', 'images']);
  assert.match(KIT.usage('scripts/shots.mjs'), /named <name>-<width>-<theme>\.png/);
  assert.match(flat(section(text, 'Never')), /\*\*Never pick, and never go on without his words\.\*\* Your one recommendation rests on the reads alone/);
  assert.match(flat(section(text, 'Never')), /\*\*Never shortlist, rank or drop\.\*\* Every valid proposal reaches the board, and every letter him/);
});

test('rounds.md: a graft is redrawn once and read again once, a rejected round moves whole and Structure starts clean, and a board made again takes its letters with it', () => {
  const text = stageSkill('structure');
  const rounds = structureRef('rounds.md');
  assert.deepEqual(headings(rounds), ['A pick with a graft', 'A round he rejected', 'A board made again within a round', 'A fresh pass he asks for at the decision page']);
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
  // S2 and W2 of the fix review: the redrawn pick is drawn a second time without the makers' notes and pictured with its
  // first screen, as the board is, so that the audience re-reading it is handed no maker's note (R171, R154).
  assert.deepEqual(commandsOf(graft), ['node <kit root>/scripts/render.mjs <package>/04-structure/chosen/chosen.json --kit <kit dir> --out <package>/04-structure/chosen/chosen.html --letter <letter>',
    'node <kit root>/scripts/render.mjs <package>/04-structure/chosen/chosen.json --kit <kit dir> --out <package>/04-structure/chosen/chosen-screens.html --letter <letter> --without-notes',
    'node <kit root>/scripts/shots.mjs <package>/04-structure/chosen --out <package>/04-structure/chosen --widths <primary>,<phone> --first-screen']);
  for (const command of commandsOf(graft)) assert.ok(takenBy(/scripts\/(\w+)\.mjs/.exec(command)[1], words(command).slice(2).join(' ')), command);
  assert.match(flat(graft), /2\. \*\*Draw it and photograph it,\*\* one command after the other, under the picked letter, as step 7 of the skill does for the board: drawn twice, the second time without the makers' notes, for the audiences, and each page pictured whole and as its first screen alone/);
  assert.match(flat(graft), /A judge is handed `<package>\/04-structure\/chosen\/` in place of the board folder, and its seat's earlier ledger to open only after it has read cold, as step 6 of the loop says\. An audience is handed the new pictures drawn without the makers' notes, whole and first screen, and no other: those of `chosen-screens\.html`, as `chosen-screens-390-light\.png` and `chosen-screens-390-light-first\.png`\. A picture of `chosen\.html`, which carries the bet, the cost and the notes, is never an audience's/);
  assert.doesNotMatch(flat(graft), /An audience is handed the new pictures only/);
  // The re-read has a file of its own, never its seat's first read, and does not open the page that sums up the other seats.
  assert.match(flat(graft), /Each writes a file of its own, beside its seat's first read and never over it: that file's name with `-reread` before `\.md`, as `<package>\/04-structure\/reads\/<seat>-reread\.md`/);
  assert.match(flat(graft), /What they do not open is what the board's readers did not \(`references\/seats\.md`\), and with it `<package>\/04-structure\/decision\.html` and `<package>\/04-structure\/decision\.json`, which by now sum up what the other seats said\. The map is still sealed while they read/);
  assert.match(flat(graft), /Nothing is redrawn a second time/);
  assert.match(flat(graft), /The render refuses a file that is not a valid proposal, and prints the fault: the file goes back to that maker once\. You do not mend it/);

  // A round he rejected: the pick, his marks, the reopening, the move, what the state shows, and a clean start.
  const rejected = flat(section(rounds, 'A round he rejected'));
  assert.match(rejected, /no further proposals are asked for against the same brief\. Intent or Context is reopened, and the round moves whole/);
  inOrder(rejected, [/1\. \*\*Write `<package>\/04-structure\/PICK\.md`:\*\* the line `Pick: none`/, /2\. \*\*Write the rejection into the package's `DECISIONS\.md`,\*\* as a new entry, in his words/,
    /What he marked in a fresh gallery is his words too, and survives the round: write each mark there with the rejection, as he said it/, /Look's fresh pass reads his marks from `DECISIONS\.md`, never from `earlier\/`/,
    /3\. \*\*Reopen the stage,\*\* with his yes\. `<stage>` is `intent` or `context`/, /state\.mjs reopen <package> <stage> --reason "<why>"/,
    /The reopening takes Structure out of awaiting and closes the pick's question: it was asked of a board that no longer stands\. Structure is in work again, and nothing is left to put to him/,
    /4\. \*\*Move the round whole\.\*\* Everything in `<package>\/04-structure\/` other than `earlier\/` goes together into `<package>\/04-structure\/earlier\/<n>\/`: the briefs, the proposals folder, the board, the map, the pick, the pictures, the reads, the decision page and its data, `fresh\/`, `chosen\/` and `CHOSEN\.md`/,
    /So no proposal of this round can reach the next board/, /5\. \*\*Go to the stage the state names, and leave Structure alone until it names Structure\.\*\*/, /state\.mjs next <package>` prints the reopened stage/,
    /state\.mjs validate <package>` has nothing to say of Structure, which is in work and owes no output yet\. The script would let you begin it now\. Do not: a brief written before Intent or Context is approved again is written from what he rejected/,
    /6\. \*\*When `next` prints `structure`,\*\*/, /Structure starts clean, from step 1 of the skill/, /state\.mjs begin <package> structure/,
    /Copy a fresh `CHOSEN\.md` and the brief templates from `templates\/package\/04-structure\/`/, /Write a new brief from the new intent: he reads it before anything is sent, as he read the first/], 'a rejected round');
  // The conductor lists what moves in the same words, and the skill sends the session here for both.
  assert.match(flat(reference('blind.md')), /everything in `04-structure\/` other than `earlier\/` is moved together, before the new round starts: the briefs, the proposals folder, the board, the map, the pick, the pictures, the reads, the decision page/);
  assert.match(flat(section(text, 'Gate')), /\*\*`Pick: none` reopens Intent or Context:\*\* no further proposals are asked for against the same brief, and the round moves whole\. \*\*A fresh pass he asks for before he picks\*\* is made, and the board with it, before he is asked again\. All three are in `references\/rounds\.md`/);
  assert.match(stepOf(section(text, 'Steps'), 'Begin'), /After a round he rejected \(`references\/rounds\.md`\), `<package>\/04-structure\/` holds only `earlier\/`: Structure starts clean, from step 1, only once `next` prints `structure`/);
  // The clean start is said one way in both files, and the conductor says what the reopening does to a stage that was awaiting.
  for (const said of [stepOf(section(text, 'Steps'), 'Begin'), rejected]) assert.match(said, /Structure starts clean, from step 1/);
  assert.match(flat(section(conductor(), 'Resuming')), /\*\*`reopen` goes back\.\*\* Any stage may ask to, with its reason\. The stage gets a new version, and every later output built from the old one turns stale: each is redone or re-confirmed, then stamped again\. A later stage that was awaiting him goes back in work, its question closed\./);
  assert.match(flat(KIT.usage('scripts/state.mjs')), /later stages stamped as built from it turn stale, and a later stage awaiting the founder goes back in work, its question closed/);
  assert.match(flat(section(text, 'Never')), /\*\*Never delete a board or a round, and never merge a sealed board again\.\*\* What is set aside is moved/);

  // A board made again within a round: his yes first, then the board and everything that speaks of its letters.
  const again = flat(section(rounds, 'A board made again within a round'));
  inOrder(again, [/The next merge deals the letters anew, so whatever speaks of the old letters goes with them/, /1\. \*\*Tell the founder first,\*\* and move nothing without his yes\. If the decision page was already in front of him, put the stage back in work with the `begin` of step 1 of the skill: that closes its question, which is asked again on the new board/,
    /2\. \*\*Move together\*\* into `<package>\/04-structure\/earlier\/<n>\/`: the board, the map, the pick if one was begun, the reads, and the decision page with its data\. The briefs, the proposals folder and `fresh\/` stay/,
    /3\. \*\*Go on from step 6 of the skill:\*\* tag, merge, draw, photograph, then readers who have read no earlier board/, /The merge refuses while a map or a pick lies beside the board folder: where its refusal says to delete, move/], 'a board made again');
  assert.match(KIT.usage('scripts/merge.mjs'), /delete it and its map on purpose/);

  // A fresh pass he asks for at the decision page: recorded, its brief read by him at its own stop, then the board made again before he picks.
  const asked = flat(section(rounds, 'A fresh pass he asks for at the decision page'));
  assert.match(flat(reference('fresh-pass.md')), /The founder can ask for one at any decision page/);
  inOrder(asked, [/he may still ask for one at the decision page, before he picks \(`skills\/design\/references\/fresh-pass\.md`\)\. You never add one yourself/,
    /1\. \*\*Record his asking\.\*\* Write what he said, as he said it, under `## Reviewed by the founder` of `CHOSEN\.md`, with the makers it will run with: a `maker\.screen-generator`, and an outside describer only where `engines-on` of the project profile lists its provider\. No engine is turned on for it/,
    /Then put the stage back in work, with the `begin` of step 1 of the skill: the pick's question is closed, and is asked again on the new board/,
    /2\. \*\*Write the fresh brief, and stop,\*\* as steps 3 and 4 of the skill say, for `<package>\/04-structure\/BRIEF-fresh\.md`: he reads it whole, hears which seats would send it off this machine, and nothing is sent before his yes is written beside his asking/,
    /3\. \*\*The fresh makers run, and their concepts are transcribed and tagged,\*\* as steps 5 and 6 say/, /one `maker\.transcriber` for each concept, its proposal tagged `fresh`/,
    /4\. \*\*The board is made again within the round,\*\* as the section above says\. His asking is his yes to it: the board, the map, the pick if one was begun, the reads and the decision page with its data move together into `<package>\/04-structure\/earlier\/<n>\/`/,
    /Then steps 7 to 9 of the skill: every proposal merged anew, readers who have read no earlier board, and the gallery beneath the options/, /5\. \*\*Only then is he asked to pick,\*\* at the gate, on the new board/], 'a fresh pass he asks for');
  assert.match(flat(reference('blind.md')), /\*\*A board made again within a round\*\* \(a proposal arrived late\) moves with its map and its pick, and with what was written about its letters, the reads and the decision page/);
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
  assert.equal(builtFrom, '[cast@<version>, intent@<version>, context@<version>]');
  // `<version>` is the version each stage stands at, read from what `status` prints, as the skill says: never a remembered one.
  const standingAt = () => {
    const page = run(commandOf('state.mjs status'));
    return builtFrom.replace(/([a-z]+)@<version>/g, (_, stage) => `${stage}@${new RegExp(`^\\| ${stage} \\| \\w+ \\| [\\w-]+ \\| (\\d+) \\|`, 'm').exec(page)[1]}`);
  };
  assert.equal(standingAt(), '[cast@1, intent@1, context@1]');
  write('structure', standingAt());
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
      const [withNotes, withoutNotes] = stageCommands('structure').filter(command => command.includes('render.mjs <package>/04-structure/board/'));
      assert.ok(!withNotes.includes('--without-notes') && withoutNotes.endsWith('--letter <letter> --without-notes'), 'drawn with the notes, then without');
      run(withNotes, { '<letter>': letter });
      const page = readFileSync(join(round, 'board', `${letter}.html`), 'utf8');
      assert.ok(page.includes(`<h1>Option ${letter}: `) && page.includes('<link rel="stylesheet" href="kit.css">'), letter);
      assert.doesNotMatch(page, /tool:stitch|calendar\.json|free-first|unified-list/, letter);
      // R171 with R154: the page for the audiences carries the letter and the screens, and nothing a maker said of the design.
      assert.match(run(withoutNotes, { '<letter>': letter }), new RegExp(`^drew option ${letter} to \\S.*${letter}-screens\\.html, without the makers' notes, with `));
      const bare = readFileSync(join(round, 'board', `${letter}-screens.html`), 'utf8');
      assert.ok(bare.includes(`<h1>Option ${letter}</h1>`) && page.includes('class="ux-note"') && page.includes('<dt>Its bet</dt>'), letter);
      assert.doesNotMatch(bare, /ux-note|<dl>|Its bet|Deliberately bad at/, letter);
      for (const words of [letterFile(letter).name, letterFile(letter).bet, letterFile(letter).cost]) assert.ok(!bare.includes(words), `${letter}: ${words}`);
      // The pictures are the picture script's to take, and its own tests drive the browser: here each is a stand-in.
      for (const name of [letter, `${letter}-screens`]) for (const width of [FILL['<phone>'], FILL['<primary>']]) for (const end of ['', '-first']) writeFileSync(join(round, 'board', `${name}-${width}-light${end}.png`), '');
    }
    assert.deepEqual(inBoard(), [...LETTERS.flatMap(letter => [letter, `${letter}-screens`].flatMap(name => [`${name}-1280-light-first.png`, `${name}-1280-light.png`, `${name}-390-light-first.png`, `${name}-390-light.png`, `${name}.html`])), ...LETTERS.map(letter => `${letter}.json`), 'kit.css'].sort());
  };
  board();
  assert.equal(commandOf('shots.mjs <package>/04-structure/board'), 'node <kit root>/scripts/shots.mjs <package>/04-structure/board --out <package>/04-structure/board --widths <primary>,<phone> --first-screen');
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
    mkdirSync(join(round, 'fresh'), { recursive: true });
    writeFileSync(join(round, 'fresh', 'today-1.png'), '');
    const sample = JSON.parse(read('templates/outputs/decision.json'));
    assert.deepEqual(sample.gallery.items[0].images, ['fresh/today-1.png']);
    const options = LETTERS.map(letter => ({ letter, title: letterFile(letter).name, line: letterFile(letter).bet, images: [`board/${letter}-390-light.png`, `board/${letter}-1280-light.png`] }));
    writeFileSync(join(round, 'decision.json'), JSON.stringify({ ...sample, options }, null, 2));
    assert.match(run(commandOf('page.mjs')), /^built \S.*decision\.html: 3 options, a gallery of 1, 4 seats, one question$/);
    const page = readFileSync(join(round, 'decision.html'), 'utf8');
    assert.ok(page.indexOf('<section class="gallery">') > page.indexOf('<section class="options">'), 'the gallery is beneath the options');
    assert.ok(page.includes('href="board/A-390-light.png"') || page.includes('src="board/A-390-light.png"'));
    assert.equal(inBoard().length, LETTERS.length * 11 + 1, 'the decision page and the gallery are not in the board');
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
  // What the state shows meanwhile: the reopening took Structure out of awaiting and closed its question, so with its round
  // moved it is a stage in work that owes no output yet. Only the stale cast is left to say, and the reopened stage is next.
  const meanwhile = exec(commandOf('state.mjs validate'));
  assert.deepEqual([meanwhile.status, meanwhile.stderr], [1, '']);
  assert.match(meanwhile.stdout, /^cast: stale-input: cast is stale: intent went to version 2 on \d{4}-\d\d-\d\d; redo it or re-confirm it, then stamp it\n$/);
  const standing = run(commandOf('state.mjs status'));
  assert.match(standing, /^## Open question\n\nNone\.$/m);
  assert.match(standing, /^\| structure \| full \| in-work \| 1 \| \d{4}-\d\d-\d\d \| — \| `04-structure\/CHOSEN\.md` \| — \|$/m);
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
  assert.equal(standingAt(), '[cast@2, intent@2, context@1]', 'after a rejected round the versions are not 1');
  write('structure', standingAt());
  propose();
  board();
  decide();
  // He asks for a fresh pass at the decision page. The stage goes back in work, which closes the pick's question; the merge
  // refuses while the old map lies beside the board; the board, the map and the decision page move together into earlier/2;
  // and the board is made again, and read and put in front of him again, before he is asked to pick.
  assert.equal(run(commandOf('state.mjs begin')), 'structure is in work');
  assert.match(run(commandOf('state.mjs status')), /^## Open question\n\nNone\.$/m);
  const beside = exec(commandOf('merge.mjs <package>'));
  assert.deepEqual([beside.status, beside.stdout], [1, '']);
  mkdirSync(join(round, 'earlier', '2'));
  const again = ['board', MAP, 'decision.html', 'decision.json'];
  for (const name of again) renameSync(join(round, name), join(round, 'earlier', '2', name));
  board();
  decide();
  assert.match(run(commandOf('state.mjs status')), /^## Open question\n\nstructure: Which structure goes on to Detail: A, B or C\?$/m);
  // He picks B, with a graft. Redrawn in chosen/, under the picked letter, it leaves the board as it was, and the map opens.
  pick('B', 'La B, con el estado de la A.');
  mkdirSync(join(round, 'chosen'));
  writeFileSync(join(round, 'chosen', 'chosen.json'), JSON.stringify(letterFile('B')));
  const [graftWithNotes, graftWithout] = stageCommands('structure').filter(command => command.includes('render.mjs <package>/04-structure/chosen/'));
  assert.ok(!graftWithNotes.includes('--without-notes') && graftWithout.endsWith('--out <package>/04-structure/chosen/chosen-screens.html --letter <letter> --without-notes'), 'the redrawn pick is drawn with the notes, then without');
  run(graftWithNotes, { '<letter>': 'B' });
  assert.ok(readFileSync(join(round, 'chosen', 'chosen.html'), 'utf8').includes('<h1>Option B: '));
  // S2: the page its audience is pictured from carries the letter and the screens, and nothing a maker said of the design.
  assert.match(run(graftWithout, { '<letter>': 'B' }), /^drew option B to \S.*chosen-screens\.html, without the makers' notes, with /);
  const redrawn = readFileSync(join(round, 'chosen', 'chosen-screens.html'), 'utf8');
  assert.ok(redrawn.includes('<h1>Option B</h1>') && readFileSync(join(round, 'chosen', 'chosen.html'), 'utf8').includes('<dt>Its bet</dt>'));
  assert.doesNotMatch(redrawn, /ux-note|<dl>|Its bet|Deliberately bad at/);
  for (const said of [letterFile('B').name, letterFile('B').bet, letterFile('B').cost]) assert.ok(!redrawn.includes(said), said);
  assert.ok(stageCommands('structure').includes('node <kit root>/scripts/shots.mjs <package>/04-structure/chosen --out <package>/04-structure/chosen --widths <primary>,<phone> --first-screen'));
  assert.equal(inBoard().length, LETTERS.length * 11 + 1);
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
    '- source:design/today/04-structure/chosen/chosen.json', '- source:design/today/04-structure/chosen/chosen-390-light.png', '- source:design/today/04-structure/chosen/chosen-1280-light.png', `- source:design/today/04-structure/${PICK}`,
    '- source:design/today/04-structure/fresh/today-1.png'];
  assert.ok(carry.includes('- cast@2#blind-rules') && carry.includes('- cast@2#fresh-pass'));
  write('structure', '[cast@2]', carry);
  const refused = exec(commandOf('state.mjs stamp'));
  assert.deepEqual([refused.status, refused.stdout], [1, '']);
  assert.match(refused.stderr, /^structure cannot be stamped:\n- "- intent@2#the-one-job" names intent, which structure is not built from; add it to built-from\n- "- context@1#the-people" names context, which structure is not built from; add it to built-from\n$/);
  write('structure', standingAt(), carry);
  assert.match(run(commandOf('state.mjs stamp')), STAMPED('structure', 1));
  // The package stands: nothing stale, no question left open, Detail next, and the rejected round whole where it was moved.
  assert.equal(run(commandOf('state.mjs validate')), 'ok');
  assert.equal(run(commandOf('state.mjs next')), 'detail');
  assert.doesNotMatch(run(commandOf('state.mjs status')), /Which structure goes on/);
  assert.deepEqual(readdirSync(join(round, 'earlier', '1')).filter(visible).sort(), held);
  assert.deepEqual(readdirSync(join(round, 'earlier', '2')).filter(visible).sort(), [...again].sort());
  assert.deepEqual(parse(readFileSync(join(round, 'CHOSEN.md'), 'utf8')).data['built-from'], ['cast@2', 'intent@2', 'context@1']);
});

// ---- Detail and Look: what skills/detail and skills/look were written to say

const stageRef = (stage, name) => read(`skills/${stage}/references/${name}`);
// The cards of the kit that sit at a stage, by id.
const cardsAt = stage => Object.fromEntries(Object.entries(kitCards()).filter(([, card]) => card['sits-at'].includes(stage)));
// The seats a seats page has a section for, in its order.
const seatSections = text => text.split('\n').map(line => /^### `(.+)`$/.exec(line)?.[1]).filter(Boolean);
// What a section of a seats page says for all its seats: its words before the first seat's own.
const forAll = part => flat(part.split('\n### ')[0]);
// The lines of a file's code fences, as written.
const fencedLines = text => linesOf(text).filter(({ fenced }) => fenced).map(({ line }) => line.trim());
// What no stage's seat is handed at Detail or at Look: it belongs to another stage, or to a re-read alone.
const AT_ANOTHER_STAGE = Object.freeze(['options', 'current-screens', 'build', 'handoff-folder', 'earlier-ledger']);
const PROFILE_WORDS = /project profile|profession's profile|profile judge|judge\.profile|profile\.<name>|--profile|PROFILE\.md/g;
const CONDUCTORS_OWN = /Every stage runs the same nine steps|\*\*One fix round and one re-read,\*\* and no more|A fresh sub-agent\.\*\* Start it with the Agent tool|\*\*Component names\.\*\*|Letters by shuffle|Three outcomes, and only three|What exists is itself a bias/;

test('detail and look: the six sections and no other, the question the conductor gives each, and the conductor\'s rules pointed to, never copied', () => {
  for (const [name, title, does, gate, files] of [
    ['detail', 'Detail', 'approves', ' **He approves, on the prototype.**', ['SKILL.md', 'references/correction.md', 'references/forms.md', 'references/seats.md']],
    ['look', 'Look', 'picks or approves, from pictures', ' **He picks, or approves, from pictures.**', ['SKILL.md', 'references/direction.md', 'references/forms.md', 'references/fresh.md', 'references/seats.md']],
  ]) {
    const text = stageSkill(name);
    assert.deepEqual(headings(text), STAGE_SECTIONS, name);
    const [, , , question, output, founder] = stageRows().find(row => row[1] === title);
    assert.equal(section(text, 'Question').trim(), question, name);
    assert.deepEqual([unspan(output), founder], [ARTEFACT[name], does], name);
    assert.ok(flat(section(text, 'Gate')).startsWith(gate), name);
    const opening = flat(text.slice(0, text.indexOf('\n## ')));
    assert.ok(opening.includes(`The conductor (\`ux:design\`) sent you, and its words are yours. Its loop is in \`skills/design/references/loop.md\`: this page says only what is ${title}'s own.`), name);
    assert.match(opening, /Run it from the project's root\. `<packages>` is the folder that holds the project's packages: `design` at the project's root, unless the project profile names another under `packages`\. `<package>` is the folder of this design in it, as `design\/today`\./, name);
    assert.match(opening, /`<kit dir>` is the project's kit folder, the one the project profile names under `kit`/, name);
    // Its long forms are references of its own, each pointed to from SKILL.md, which stays within the limit.
    assert.deepEqual(filesUnder(`skills/${name}/`), files, name);
    assert.deepEqual(ownReferences(text).sort(), files.slice(1), name);
    assert.ok(lineCount(text) <= MAX_LINES, name);
    for (const [file, body] of Object.entries(folderOf(name))) {
      // The loop, the blind rules and the fresh pass are the conductor's: no file of the stage copies them.
      assert.doesNotMatch(flat(body), CONDUCTORS_OWN, `${name}/${file}`);
      // And the word profile is the project profile, a profession's profile, the profile judge, an id, a path or a flag.
      assert.doesNotMatch(flat(body).replace(PROFILE_WORDS, ''), /profile/i, `${name}/${file}: "profile" alone says neither the project profile nor a profession's profile`);
      // No version is written as a number: after a reopening a remembered 1 is wrong.
      assert.doesNotMatch(body, /\b(?:frame|context|intent|cast|structure|detail)@\d/, `${name}/${file}`);
    }
    // Its example is the kit's own product: a room, never a real one.
    assert.match(text, /\brooms?\b/, name);
    assert.equal(new URL('../../', at(`skills/${name}/`)).href, root.href);
  }
  // Each opens with what the session never does itself at that stage.
  const opens = name => flat(stageSkill(name).slice(0, stageSkill(name).indexOf('\n## ')));
  assert.match(opens('detail'), /Three makers do it, one after another; judges and an audience read it; what blocks is fixed once; and the founder approves on the prototype\. You write no rule, no string and no page, and you mend no finding: the stage is its order and its one fix round/);
  assert.match(opens('look'), /You draw no screen, choose no variant and no direction, write no measured value and borrow nothing yourself/);
  assert.match(opens('look'), /Read `skills\/design\/references\/fresh-pass\.md` before step 3/);
  // The project's token file is the one in the project kit folder, where setup put it.
  assert.match(opens('look'), /`<tokens>` is the project kit's copy of the token file, `<kit dir>\/tokens\.css`: the file it was copied from is the project profile's `tokens`, named with its commit in `PARTS\.md` at Handoff/);
  assert.match(flat(projectKit()), /`tokens\.css`: the project's tokens, as one CSS file\. `kit\.css` imports it/);
  for (const key of ['kit', 'tokens']) assert.ok(profileKeys().includes(key), key);
});

test('detail: it reads the chosen structure and what its carry list names, and writes 05-detail from its three templates, built from the structure, the cast, the intent and the context', () => {
  const text = stageSkill('detail');
  const reads = flat(section(text, 'Reads'));
  assert.match(reads, /\*\*The chosen structure,\*\* `<package>\/04-structure\/CHOSEN\.md`, approved, and exactly what its carry list names: the chosen proposal's file and its pictures, and the sections of the cast sheet, the intent and the context it carries on/);
  assert.equal(ARTEFACT.structure, '04-structure/CHOSEN.md');
  // Each section it names is one the stage before carried on to it.
  assert.match(reads, /Of the cast sheet: its "Detail" table, a line for each seat with what it is loaded with, its checks and its model and effort/);
  assert.ok(headings(outputOf('cast')).includes('Detail'));
  assert.match(reads, /Of the context: "What the product can show and do", "Constraints", for the two widths, and "The founder's own words"/);
  for (const heading of ['What the product can show and do', 'Constraints', 'The founder\'s own words']) {
    assert.ok(headings(outputOf('context')).includes(heading), heading);
    assert.ok(flat(section(stageSkill('intent'), 'Gate')).includes(`"${heading}"`), `the intent carries "${heading}" on`);
  }
  assert.match(flat(outputOf('context')), /the devices and their widths/);
  const keys = spansOf(section(text, 'Reads').split('\n- ').find(bullet => bullet.startsWith('**The project profile,**'))).filter(span => !span.includes('/'));
  assert.deepEqual(keys, ['kit', 'languages', 'facts', 'components']);
  for (const key of keys) assert.ok(profileKeys().includes(key), key);
  assert.match(reads, /Every card is read by its seat/);
  assert.match(reads, /\*\*Never\*\* a letter that was not chosen, `<package>\/04-structure\/earlier\/`, the package's `work\/` folder, or the chat/);
  // What it writes: every file of the stage, and each template it is written from.
  const writes = section(text, 'Writes');
  assert.match(flat(writes), /Everything below is in `<package>\/05-detail\/`, and the seats' briefs in `<package>\/work\/`\. `<version>` is the version a stage stands at, as `status` prints it: after a reopening it is not 1/);
  const rows = tableRows(writes).slice(2);
  assert.deepEqual(rows.flatMap(([first]) => spansOf(first)), ['DETAIL.md', 'states.md', 'strings.json', 'prototype/', 'shots/', 'reads/', 'words.json', 'words.html', 'decision.json', 'decision.html']);
  assert.deepEqual(kitPaths(writes).filter(path => path.startsWith('templates/')).sort(), ['templates/outputs/LEDGER.md', 'templates/outputs/TASK-READ.md', 'templates/outputs/decision-approve.json',
    'templates/package/05-detail/DETAIL.md', 'templates/package/05-detail/states.md', 'templates/package/05-detail/strings.json']);
  assert.deepEqual(filesUnder('templates/package/05-detail/'), ['DETAIL.md', 'states.md', 'strings.json']);
  // The output carries sections of the structure, the cast, the intent and the context on, so it is built from all four.
  assert.match(writes, /`DETAIL\.md` \| the stage's output, with `built-from: \[structure@<version>, cast@<version>, intent@<version>, context@<version>\]`: the rules, the edge cases, the data map, the dependencies/);
  // The output alone is copied at the start: the states table and the strings are their makers' to write, so that a file that
  // is there says its maker has run, and a session that resumes goes on from the first step whose file is missing.
  assert.match(stepOf(section(text, 'Steps'), 'Read the chosen structure'), /Copy the template to `<package>\/05-detail\/DETAIL\.md`, and write `built-from` and the title, unless the file is already there: then go on from what the folder holds, at the first step whose file is missing\. The template's comment stays until step 9\./);
  // Every heading of the output that a file of the skill names is a heading of the template.
  const template = read(`templates/package/${ARTEFACT.detail}`);
  for (const heading of ['What is in this folder', 'Rules', 'Edge cases', 'Data map', 'Dependencies', 'States the intent does not name', 'What the structure cannot hold', 'Strings', 'What the readers found', 'Reviewed by the founder', 'Carry']) {
    assert.ok(headings(template).includes(heading), heading);
  }
  for (const heading of ['Waiting for a fact', 'Nothing to say']) assert.ok(template.includes(`\n### ${heading}\n`), heading);
  assert.match(flat(template), /Where the words are the product, his answer on the words is written apart/);
  // The gate, after his answer: his words, the carry list, the stamp, the decision.
  const gate = flat(section(text, 'Gate'));
  inOrder(gate, [/\*\*Write what he says under `## Reviewed by the founder`:\*\* what he corrected, and the words he approved the prototype with, as he said them/,
    /A correction goes to the maker whose artefact it is on, a fresh sub-agent handed his words\. The pages are generated and photographed again, and he sees them before the stamp\. You change no rule, no string and no page yourself/,
    /\*\*Write the carry list,\*\* `## Carry`: the lines of `CHOSEN\.md`'s own carry list, as they are/,
    // The chosen structure carries the cast sheet's tables of the stages still to run: Structure's own is added here, so that every seat's line reaches the coverage page.
    /a `- cast@<version>#structure` line, so that the cast sheet's table for every stage travels on/,
    /a `- structure@<version>#<slug>` line for "The structure", for "What it is deliberately bad at" and for "What the readers found"/,
    /a `- source:<path>` line, from the project's root, for `<package>\/04-structure\/reads`, for `states\.md`, for `strings\.json`, for the prototype's folder, for the pictures' folder, for the reads' folder, and for the package's `DECISIONS\.md`/,
    /\*\*Stamp it,\*\* in the words he approved it with/, /state\.mjs stamp <package> detail --words/,
    /Then append the decision to the package's `DECISIONS\.md`, each dependency he settled and each accepted deviation with it, and ask the state what is next, as step 9 of the loop says/], 'the gate, after his answer');
  // What the handoff's coverage page needs travels on: what Structure's readers found, their ledgers, and each seat's line of the cast sheet.
  for (const heading of ['The structure', 'What it is deliberately bad at', 'What the readers found']) assert.ok(headings(outputOf('structure')).includes(heading), heading);
  assert.match(flat(section(stageSkill('structure'), 'Gate')), /a `- cast@<version>#<slug>` line for the table of each stage still to run, for "Blind rules" and for "Fresh pass"/);
  assert.ok(headings(outputOf('cast')).includes('Structure'));
  assert.match(flat(section(stageSkill('structure'), 'Writes')), /`reads\/` \| one ledger or one task read for each reader/);
  assert.match(read('templates/package/07-handoff/COVERAGE.md'), /\| Stage \| Seat \| Loaded with \| What it read \| Checks run \| Ran on \| Verdict \|/);
  // The other forms: an adjustment, a flow and a correction, each said in one line that points to its page.
  const short = flat(section(text, 'Steps')).slice(flat(section(text, 'Steps')).indexOf('**Routed `short`**'));
  assert.equal(short.trim(), '**Routed `short`** (an adjustment), Detail is what changes, and no more. **Sized `flow`,** it goes surface by surface, steps 3 to 8 once for each, and is approved and stamped once. `references/forms.md` has both. **Sized `correction`,** it is one change and one nod, and casts no seat: `references/correction.md`.');
  assert.ok(headings(reference('routes.md')).includes('A correction'));
  assert.match(flat(reference('routes.md')), /`flow` \| several surfaces that form one task \| Everything\. Structure treats the flow as one thing; Detail and Look go surface by surface/);
  assert.deepEqual([routeFor('adjustment').structure, routeFor('adjustment').detail, routeFor('correction').detail], ['skipped', 'short', 'short']);
});

test('detail: three makers one after another, each started on what the cast sheet names; the writer briefed with the founder\'s own lines; what a maker could not decide goes to the founder', () => {
  const text = stageSkill('detail');
  const steps = section(text, 'Steps');
  assert.deepEqual(boldSteps(steps), [[1, 'Begin'], [2, 'Read the chosen structure, and what its carry list names'], [3, 'Start the three makers, one after another'], [4, 'Put what a maker could not decide to the founder, one list at a time,'],
    [5, 'Photograph every page'], [6, 'Start the readers'], [7, 'One fix round'], [8, 'One re-read'], [9, 'Build the decision page']]);
  const makers = stepOf(steps, 'Start the three makers, one after another');
  // Model and effort are the cast sheet's, and the skill enforces none.
  assert.match(makers, /Each is a fresh sub-agent, started as "Starting a seat" in the loop says, on the model and the effort its line of the approved cast sheet names: a dash means the session's model, and you enforce none/);
  assert.match(makers, /Its brief is written from `templates\/briefs\/maker\.md`, and hands it what `references\/seats\.md` gives its seat, and no more\. Each waits for the one before it, since it reads what that one wrote/);
  // The order: the interaction designer, then the interface writer, then the prototype builder.
  inOrder(makers, [/\*\*`maker\.interaction-designer`\*\* writes `states\.md` and, in `DETAIL\.md`, the rules, the edge cases, the data map and the dependencies/,
    /Its reply counts three lists: read them first, and settle each entry with the founder, as step 4 says, before the next maker starts/,
    /\*\*`maker\.interface-writer`\*\* writes `strings\.json`: every string, each language written for itself, each with its why-line/,
    /Its brief carries the founder's own lines, copied word for word from "The founder's own words" of the context: they are the bar its lines must meet/,
    /\*\*`maker\.prototype-builder`\*\* generates `prototype\/` in the shared kit, `<kit dir>`: one page for each screen, state and language, and the index/], 'the makers, in order');
  assert.deepEqual(Object.values(cardsAt('detail')).filter(card => card.shelf === 'maker').map(card => card.id).sort(), ['maker.interaction-designer', 'maker.interface-writer', 'maker.prototype-builder']);
  // Each maker's card reads what the one before it wrote.
  assert.ok(kitCards()['maker.interface-writer'].reads.includes('states-and-rules') && kitCards()['maker.prototype-builder'].reads.includes('strings'));
  assert.match(flat(read('templates/briefs/maker.md')), /An interface writer: the founder's own lines, as he said them/);
  assert.match(flat(read('pool/makers/interface-writer.md')), /\*\*The founder's lines are the bar\.\*\*/);
  assert.match(read('pool/makers/interaction-designer.md'), /A count that is not zero is the first thing the\s+conductor reads/);
  // What a maker could not decide is the founder's: nothing is supplied by the session, and nothing dropped.
  const undecided = stepOf(steps, 'Put what a maker could not decide to the founder, one list at a time');
  inOrder(undecided, [/\*\*Put what a maker could not decide to the founder, one list at a time,\*\* as soon as its reply names it, and before the next maker starts: a list is one question, its entries answered by number, as step 7 of the loop says\. You supply none of it, and you drop nothing/, /\*\*A dependency:\*\* an element needs something the product cannot supply today, as a waiting list when no room is free\. It stays on its screen, and on its line under `## Dependencies`/,
    /Ask him: is it to be built with the design, or does the element go\? If it goes, the interaction designer takes it out, never you/,
    /\*\*A state the intent does not name, a fact a string waits for, a state the structure cannot hold:\*\* `references\/seats\.md` says what each asks of him, and which stage it may reopen/,
    /Record the question with the `await` of the gate, write his answers under `## Reviewed by the founder`, numbered, as he said them, and put the stage back in work with the `begin` of step 1\. An entry he leaves unanswered stays open: it is listed under `findings` on the decision page, and named in the gate's question\. A breach of a standing rule or of the intent that he accepts as a cost goes under `## Accepted deviations`: `references\/seats\.md`/], 'what a maker could not decide');
  const seats = stageRef('detail', 'seats.md');
  const lists = flat(subsection(seats, '`maker.interaction-designer`'));
  assert.match(lists, /A list that is not empty is the founder's, as one question, its entries numbered, before the interface writer starts/);
  assert.match(lists, /\*States the intent does not name\.\* Whether a state exists is his call: ask\. One he says exists is the intent's to name: ask to reopen Intent, as the conductor's "Resuming" says/);
  assert.match(lists, /\*What the structure cannot hold\.\* Detail completes the structure, and does not mend it: tell him which screen breaks\. He reopens Structure, or accepts it as a cost, in his words/);
  const writer = leads(subsection(seats, '`maker.interface-writer`'));
  assert.match(writer['Its brief'], /The founder's own lines, copied word for word from "The founder's own words" of the context: where that section holds none, the brief says so/);
  assert.match(writer['Its brief'], /The languages, as `languages` of the project profile lists them, the main one first/);
  assert.match(writer['Its two lists'], /\*Waiting for a fact:\* ask the founder for the facts, as one question, its entries numbered/);
  assert.match(writer['One fresh interface writer then writes the lines'], /^handed his facts and the settled entries together, as he said them and as the designer left them\. You write none/);
  // What the session must never do, each as a rule, with what this stage is tempted to do first.
  const lines = section(text, 'Never').split('\n').filter(line => line.startsWith('- '));
  for (const line of lines) assert.match(line, /^- \*\*Never [^*]+[.,]\*\*/, line);
  assert.deepEqual(nevers(text), ['Never write a state, a rule, a string or a page yourself', 'Never take an element out because the product cannot supply it', 'Never run a second fix round', 'Never start two makers together',
    'Never hand a maker a proposal that was not chosen', 'Never give the interface writer one language to write another from', 'Never add a state the intent does not name, or a screen the structure does not have',
    'Never run a fresh pass at Detail', 'Never hand an audience a page, its source or a ledger', 'Never tell a judge who made what it reads', 'Never decide a colour, a size or a token here',
    'Never approve, and never go on without his words', 'Never stop a process by name or by pattern', 'Never ask two things at once']);
  // A fresh pass does not run at Detail, and no outside engine or screen generator is used there.
  assert.match(flat(section(text, 'Never')), /\*\*Never run a fresh pass at Detail,\*\* and never an outside engine or a screen generator: the work is to complete a chosen structure, not to explore/);
  assert.match(flat(reference('fresh-pass.md')), /It does not run at Detail, where the work is to complete a chosen structure, not to explore/);
  assert.match(read('pool/makers/outside-describer.md'), /Never use it at Detail/);
});

// What a card's `reads` allows, as a seat's hand-over at Detail names it in this package.
const HANDED_AT_DETAIL = Object.freeze({
  'chosen-structure': /`<chosen>`/, intent: /`<package>\/02-intent\.md`/, context: /`<package>\/01-context\.md`/, 'states-and-rules': /The states and the rules/, strings: /`<package>\/05-detail\/strings\.json`/,
  prototype: /`<package>\/05-detail\/prototype\/`/, kit: /`<kit dir>`, the shared kit, and `kit\/KIT-CONTRACT\.md`, its contract/, 'product-facts': /The project's facts document/, 'example-data': /The data the example rows come from, where "Project sources" of the context names such a file, by the path the carry list gives it/, pictures: /`<package>\/05-detail\/shots\//,
  profile: /profession's profile, whole/, person: /\bher card\b/i, 'profile-traits': /Her profession's traits/,
});
// What a card's `never-reads` names, as the seat's brief lists it at Detail.
const KEPT_OUT_AT_DETAIL = Object.freeze({
  'other-proposals': /every proposal that was not chosen/, 'component-source': /the project's component source, the folder the project profile names under `components`/, 'maker-notes': /`<package>\/work\/`/,
  'author-map': /`<package>\/04-structure\/MAP\.sealed\.json`/, 'other-ledgers': /every file of `<package>\/05-detail\/reads\/` but its own/, 'task-reads': /every file of `<package>\/05-detail\/reads\/` but its own/,
  intent: /`<package>\/02-intent\.md`/, package: /every other file of the package/, profile: /her profession's profile itself/, 'describers-brief': /the rest of `<package>\/04-structure\/`/,
  'states-and-rules': /`<package>\/05-detail\/states\.md`, `<package>\/05-detail\/DETAIL\.md`/, strings: /`<package>\/05-detail\/strings\.json`/, prototype: /`<package>\/05-detail\/prototype\/`, the pages and their source/,
});

test('detail: each seat is handed what its card reads and no more, the words judge the strings with their why-lines, an audience pictures only', () => {
  const text = stageSkill('detail');
  const readers = stepOf(section(text, 'Steps'), 'Start the readers');
  assert.match(readers, /The judges and the audiences of the cast sheet's "Detail" table, each a fresh sub-agent on what its line names: the judges in one message, then the audiences, and those that drive a browser three at a time at most/);
  assert.match(readers, /A judge is handed the prototype, the states, the rules and the strings as its card reads them/);
  // Ruling R126: the why-line is part of the strings, and the words judge is handed the strings with it.
  assert.match(readers, /The words judge is handed the strings with their why-lines, which are part of the strings, and its brief carries the founder's own lines/);
  assert.match(flat(read('templates/briefs/judge.md')), /\*\*The strings, with their why-lines\*\*, which are part of the strings and not a maker's note/);
  assert.match(flat(read('pool/judges/words.md')), /The why-line is part of the strings table, not a maker's note: it is yours to read/);
  assert.match(readers, /An audience is handed pictures only, in one language\. What each is handed, and what its brief lists under "Do not open", is in `references\/seats\.md`\. Each writes one file in `reads\/`/);

  // seats.md: one section for each card of the kit that sits at Detail, and for no other, the makers in their order.
  const seats = stageRef('detail', 'seats.md');
  assert.deepEqual(headings(seats), ['The makers', 'The fix round', 'The readers']);
  const cards = cardsAt('detail');
  assert.deepEqual(seatSections(seats), ['maker.interaction-designer', 'maker.interface-writer', 'maker.prototype-builder', 'judge.usability', 'judge.truth', 'judge.words', 'judge.accessibility', 'judge.profile', 'audience.task-reader']);
  assert.deepEqual([...seatSections(seats)].sort(), Object.keys(cards).sort());
  const top = flat(seats.slice(0, seats.indexOf('\n## ')));
  assert.match(top, /A brief hands a seat what its card's `reads` allows and this page lists, each file by its absolute path, and lists under "Do not open" what its card's `never-reads` names, as this package holds it/);
  assert.match(top, /`<chosen>` is the chosen proposal's file, as the carry list of `CHOSEN\.md` names it: the picked letter's file on the board or, after a graft, `<package>\/04-structure\/chosen\/chosen\.json`/);
  assert.match(top, /"The states and the rules" are two files: `<package>\/05-detail\/states\.md`, and `<package>\/05-detail\/DETAIL\.md` for the rules, the edge cases, the data map and the dependencies/);
  assert.match(top, /A card of the project's own that the cast sheet seats here is handed what its header's `reads` allows, by the same rule/);
  const common = { maker: forAll(section(seats, 'The makers')), reader: forAll(section(seats, 'The readers')) };
  assert.match(common.maker, /One after another, never together: each reads what the one before it wrote/);
  // Ruling R143: each maker at Detail is handed her card and her profession's profile, whole, as the conductor and the maker's brief template say, and its card reads both.
  assert.match(common.maker, /Each is handed, besides what its own section lists, the two lines the maker's brief template keeps for them: her card, by the path the carry list names, and her profession's profile, whole, its base and then the section of her specialty\. Where she has no profession, the second line is deleted/);
  for (const card of Object.values(cards).filter(card => card.shelf === 'maker')) assert.ok(card.reads.includes('person') && card.reads.includes('profile'), card.id);
  assert.match(flat(read('templates/briefs/maker.md')), /- \*\*The person the design is for:\*\* \{her card's absolute path\} - \*\*Her profile, whole\*\*, its base and then the section of \{her specialty\}/);
  assert.match(flat(reference('loop.md')), /Where that is a profession's profile, a maker or a judge is handed it whole, and an audience only its traits\. A describer and a fresh maker are handed neither the person nor her profession's profile/);
  for (const path of ['<package>/04-structure/CHOSEN.md', '<package>/03-cast.md', '<package>/work/', '<package>/05-detail/reads/', '<package>/04-structure/earlier/']) assert.ok(common.maker.includes(`\`${path}\``), path);
  assert.match(common.reader, /the judges in one message, so that no ledger exists while another judge reads, then the audiences/);
  assert.match(common.reader, /What each reads is named by what it is, never by who made it/);
  for (const path of ['<package>/work/', `<package>/04-structure/${MAP}`, '<package>/04-structure/CHOSEN.md', '<package>/03-cast.md', '<package>/04-structure/reads/', '<package>/05-detail/decision.json', '<package>/05-detail/decision.html',
    '<package>/05-detail/words.json', '<package>/05-detail/words.html']) assert.ok(common.reader.includes(`\`${path}\``), path);

  for (const [id, card] of Object.entries(cards)) {
    const part = subsection(seats, `\`${id}\``);
    const said = leads(part);
    const reader = card.shelf !== 'maker';
    for (const lead of ['Its brief', 'Handed', 'Do not open', 'Writes']) assert.ok(said[lead], `${id}: ${lead}`);
    assert.ok(said['Its brief'].includes(`\`templates/briefs/${card.shelf}.md\``), `${id}: its brief`);
    // What its card reads, it is handed.
    for (const token of card.reads) {
      if (token === 'brief' || AT_ANOTHER_STAGE.includes(token) || token === 'final-screens') continue;
      assert.ok(HANDED_AT_DETAIL[token], `${id}: ${token} has no hand-over the test knows`);
      assert.match(said.Handed, HANDED_AT_DETAIL[token], `${id}: reads ${token}`);
    }
    // What its card does not read, it is not.
    for (const [token, handed] of Object.entries(HANDED_AT_DETAIL)) if (!card.reads.includes(token)) assert.doesNotMatch(said.Handed, handed, `${id}: is handed ${token}, which its card does not read`);
    // What its card never reads is listed in its brief.
    const closed = `${flat(part)} ${reader ? common.reader : common.maker}`;
    for (const token of card['never-reads']) {
      if (AT_ANOTHER_STAGE.includes(token)) continue;
      assert.ok(KEPT_OUT_AT_DETAIL[token], `${id}: ${token} has no place the test knows`);
      assert.match(closed, KEPT_OUT_AT_DETAIL[token], `${id}: never reads ${token}`);
    }
    assert.match(said['Do not open'], /^the list above/, id);
    // Everything a seat is handed or writes is in the package, the project's kit or the kit: no path is left bare.
    if (reader) assert.match(said.Writes, /`<package>\/05-detail\/reads\/<seat>\.md`, in the shape of `templates\/outputs\/(?:LEDGER|TASK-READ)\.md`/, id);
    else assert.match(said.Writes, /`<package>\/05-detail\//, id);
  }
  // The interaction designer writes the states, the rules, the data map and the dependencies where its card and the template say.
  const designer = leads(subsection(seats, '`maker.interaction-designer`'));
  assert.match(designer.Writes, /`<package>\/05-detail\/states\.md`, in the shape of its template, and in `<package>\/05-detail\/DETAIL\.md` the headings its card names: "Rules", "Edge cases", "Data map", "Dependencies", "States the intent does not name" and "What the structure cannot hold"\. Nothing else of that file is its to touch: not its header, and not another heading/);
  assert.match(read('pool/makers/interaction-designer.md'), /the states table takes the shape of\s+`templates\/package\/05-detail\/states\.md`; the rest goes under the headings of\s+`templates\/package\/05-detail\/DETAIL\.md`/);
  // The prototype builder is handed the project's kit and its contract, never a real component, and drives a browser.
  const builder = leads(subsection(seats, '`maker.prototype-builder`'));
  assert.match(builder['Its brief'], /gives the folder of the kit, `<kit dir>`, and the two widths of the context's "Constraints"/);
  assert.match(builder.Writes, /The pictures of its own check go in `<package>\/work\/prototype-check\/`: the pictures of record are yours to take, in step 5 of the skill/);
  assert.match(builder['It drives a browser'], /and counts among the three/);
  // The words judge's brief carries his lines, and its read is a question of its own where the words are the product.
  const wordsJudge = leads(subsection(seats, '`judge.words`'));
  assert.match(wordsJudge['Its brief'], /carries the founder's own lines, as he said them: the lines the interface writer was given, word for word/);
  assert.match(wordsJudge.Handed, /`<package>\/05-detail\/strings\.json`, the strings with their why-lines, which are part of the strings and not a maker's note/);
  assert.match(flat(read('templates/briefs/judge.md')), /A words judge: the founder's own lines, as he said them/);
  // The accessibility judge measures nothing at Detail, and the profile judge reads pictures and strings.
  assert.match(leads(subsection(seats, '`judge.accessibility`'))['Its brief'], /It says the prototype is plain: its colours and its sizes are the kit's, so neither is measured at Detail, while reflow and focus are\. And it names the folder for the seat's own checks and pictures, `<package>\/work\/<seat>-check\/`/);
  assert.match(flat(read('pool/judges/accessibility.md')), /Its colours and sizes are the kit's, so neither is measured there: reflow and focus are/);
  assert.match(flat(subsection(seats, '`judge.profile`')), /One for each profession's profile the cast sheet loads into this seat, as `profile\.<name>`\. Detail is its main read/);
  // The audience: one task read for each language, her tasks word for word, and pictures only.
  const audience = leads(subsection(seats, '`audience.task-reader`'));
  assert.match(flat(subsection(seats, '`audience.task-reader`')), /one task read for each language the product ships\. Where `languages` holds more than the sheet seats readers for, start one instance for each language, the same person, and tell the founder that the sheet's count grows by them/);
  assert.match(flat(section(stageSkill('cast'), 'Gate')), /A later stage may add a seat or a check when the artefact calls for it, and says so/);
  assert.match(audience['Its brief'], /her tasks, copied word for word from "Tasks for the audience" of the intent/);
  assert.match(audience.Handed, /with every `So the interface must:` field removed, written beside the brief as the loop says, and the one file of `<package>\/work\/` she opens/);
  assert.match(audience.Handed, /the pictures of every page in her language at the width each task puts her at, each by its path, as `<package>\/05-detail\/shots\/today-default-en-390-light\.png`\. The pictures, and pictures only\./);
  assert.ok(nevers(text).includes('Never hand an audience a page, its source or a ledger'));
  assert.ok(nevers(text).includes('Never tell a judge who made what it reads'));
});

test('detail: blocking findings are fixed in one round by the maker whose artefact it is on and re-read by a fresh judge, and a truth finding the product cannot meet becomes a dependency', () => {
  const text = stageSkill('detail');
  const steps = section(text, 'Steps');
  const fix = stepOf(steps, 'One fix round');
  inOrder(fix, [/Send each finding marked `blocks` to the maker whose artefact it is on: a state, a rule or the data map to the interaction designer, a string to the interface writer, a page to the prototype builder/,
    /Each is a fresh sub-agent in that seat, handed the findings and the artefact, in the makers' order\. Then the pages are generated again, and step 5 is run again/,
    /\*\*A truth finding that needs something the product lacks is never fixed by taking the element out:\*\* it becomes a line under `## Dependencies` and a question to the founder, as step 4 says/], 'the fix round');
  assert.match(flat(reference('loop.md')), /a fresh sub-agent in the seat whose work they are on, handed the findings and the artefact/);
  // The truth judge's own card offers taking the element out as a fix: the stage never takes that one silently.
  assert.match(flat(read('pool/judges/truth.md')), /list the dependency, or take the element out/);
  assert.match(flat(read('pool/makers/interaction-designer.md')), /An element that needs what the product lacks stays, shown, with its dependency: never hidden, never narrowed/);
  assert.ok(nevers(text).includes('Never take an element out because the product cannot supply it'));
  assert.match(flat(section(text, 'Never')), /\*\*Never take an element out because the product cannot supply it\.\*\* It is a dependency, and his/);
  // Ruling R127: the re-read is a fresh instance of the same judge, handed its seat's earlier ledger, cold first, three marks.
  const again = stepOf(steps, 'One re-read');
  inOrder(again, [/For each judge that marked a finding `blocks`, a fresh sub-agent in the same seat reads the prototype again/, /Its brief says it is a re-read, and names that seat's earlier ledger, to be opened only after it has read cold/,
    /it then marks each earlier finding \*fixed\*, \*partly\* or \*still present\*, in `<package>\/05-detail\/reads\/<seat>-reread\.md`/, /\*\*There is no second round:\*\* what is still open goes to the founder with the gate/], 'the re-read');
  assert.match(flat(reference('loop.md')), /It marks each earlier finding \*fixed\*, \*partly\* or \*still present\*/);
  assert.match(read('templates/outputs/LEDGER.md'), /fixed · partly · still\s+present/);
  assert.match(flat(section(text, 'Never')), /\*\*Never run a second fix round,\*\* and never let a judge that read once read again: a re-read is a fresh sub-agent, handed its seat's earlier ledger to open after it has read cold/);
  // seats.md: who fixes what, one round, each seat at most once, the builder last; and what a re-read opens.
  const seats = stageRef('detail', 'seats.md');
  const round = flat(section(seats, 'The fix round'));
  inOrder(round, [/One round, in the makers' order, and each seat at most once/, /A finding on a state, a rule, an edge case or the data map is the interaction designer's\. One on a string, in any language, is the interface writer's\. One on a page, its markup, a name or an order, is the prototype builder's/,
    /A finding on what the structure is, a screen too many or an item on the wrong screen, is nobody's to fix here: it goes to the founder with the gate, open/,
    /\*\*Each is a fresh sub-agent in that seat,\*\*/, /the findings that are its own: the ledger that holds each, by its path, and the finding's number in it/,
    /\*\*The prototype builder runs last, whenever a state or a string changed:\*\* no page is mended by hand, so every page is generated again\. Then step 5 of the skill is run again/,
    /\*\*A truth finding that needs something the product lacks\*\* is the interaction designer's, and its one fix is a line under "Dependencies", with the element that needs it and what is missing\. The element stays until the founder has answered/], 'who fixes what');
  assert.match(read('pool/makers/prototype-builder.md'), /No\s+page is written or mended by hand/);
  assert.match(forAll(section(seats, 'The readers')), /\*\*On a re-read\*\* the brief is the first read's, and says so\. It names one file more: that seat's earlier ledger, the one file of `<package>\/05-detail\/reads\/` it opens besides its own, and only after it has read cold and written its findings\. It writes its first read's name with `-reread` before `\.md`, as `judge\.usability-reread\.md` or `judge\.profile-<name>-reread\.md`, beside the first read and never over it/);
  // Two profile judges never share a file: a reader's file is named for its seat and for what the seat is loaded with.
  assert.match(forAll(section(seats, 'The readers')), /`<seat>`, in the name of a reader's file, is the seat's id, and a seat that is loaded adds what it is loaded with, so that no two readers share a file: `judge\.usability`, `judge\.profile-<name>` for each profession's profile, `audience\.task-reader-<name>-<language>` for each person and language/);
  assert.match(leads(subsection(seats, '`judge.profile`')).Writes, /`<package>\/05-detail\/reads\/<seat>\.md`, in the shape of `templates\/outputs\/LEDGER\.md`: `judge\.profile-<name>\.md`, so that two profile judges never share a file, in a first read or in a re-read/);
});

test('detail: every command is one its script takes, in the order of the stage; the pictures are taken one run at a time; the gate is on the prototype, and the words are a question of their own for three kinds', () => {
  const text = stageSkill('detail');
  const commands = stageCommands('detail');
  for (const command of commands) {
    const [, script, given] = /^node <kit root>\/scripts\/([a-z]+)\.mjs (.+)$/.exec(command) ?? [];
    assert.ok(script, command);
    assert.ok(takenBy(script, given), command);
  }
  // No outside engine, no merge and no drawing script at Detail: the state, the pictures and the page.
  assert.deepEqual([...new Set(commands.map(command => /scripts\/([a-z]+)\.mjs/.exec(command)[1]))].sort(), ['page', 'shots', 'state']);
  const state = commands.filter(command => command.startsWith('node <kit root>/scripts/state.mjs ')).map(command => words(command).slice(2));
  assert.deepEqual([...new Set(state.map(([verb]) => verb))].sort(), ['await', 'begin', 'reopen', 'slug', 'stamp', 'status']);
  for (const [verb, pkg, stage] of state.filter(([verb]) => ['begin', 'await', 'stamp'].includes(verb))) assert.deepEqual([pkg, stage], ['<package>', 'detail'], verb);
  // The one `reopen` is the correction's, and of Frame: when he disagrees with the frame's line, at the nod.
  assert.deepEqual(state.filter(([verb]) => verb === 'reopen').map(([, pkg, stage]) => [pkg, stage]), [['<package>', 'frame']]);
  assert.deepEqual(fencedLines(text), [
    'node <kit root>/scripts/state.mjs begin <package> detail',
    'node <kit root>/scripts/shots.mjs <package>/05-detail/prototype --out <package>/05-detail/shots --widths <primary>,<phone>',
    'node <kit root>/scripts/page.mjs <package>/05-detail/decision.json --out <package>/05-detail/decision.html',
    'node <kit root>/scripts/state.mjs await <package> detail --question "<the one question>"',
    'node <kit root>/scripts/page.mjs <package>/05-detail/words.json --out <package>/05-detail/words.html',
    'node <kit root>/scripts/state.mjs stamp <package> detail --words "<the founder\'s words>"',
  ]);
  for (const [file, body] of Object.entries(folderOf('detail'))) {
    assert.doesNotMatch(body, /--endpoint|--seed|--text|--timeout|--chrome|--allow-errors|--keys?\b|API_KEY|keys-file|\.env\b|https?:|describe\.mjs/, `${file}: no outside engine, no address, no key, no keys file`);
  }
  // The pictures: every page, at the two widths of the context, once the prototype is generated and after every change.
  const shots = stepOf(section(text, 'Steps'), 'Photograph every page');
  assert.match(shots, /Once the prototype is generated, and again after every change to it/);
  assert.match(shots, /The two widths are those of "Constraints"\. A line `error:` is the prototype builder's to fix: the page goes back to it, once\. A line `overflow:` goes to the readers as it is/);
  assert.match(KIT.usage('scripts/shots.mjs'), /"error: <page>: <what>"/);
  assert.match(KIT.usage('scripts/shots.mjs'), /"overflow: <page> is wider than the screen at <w>\s+px"/);
  // A shared machine: three browser-driving commands or seats at once at most, a seat stops only its own browser, and no process is stopped by name.
  assert.match(flat(section(text, 'Never')), /\*\*Never stop a process by name or by pattern,\*\* or start a browser other than through the kit's scripts and seats: three browser-driving commands or seats at once, at most/);
  for (const stage of ['detail', 'look']) assert.match(flat(stageRef(stage, 'seats.md')), /Every brief is written into `<package>\/work\/`, named as the loop says, and keeps the template's last line: a seat that starts a browser stops only the one it started/, stage);
  for (const shelf of ['maker', 'judge', 'audience']) assert.match(flat(read(`templates/briefs/${shelf}.md`)), /A seat that starts a browser stops only the one it started, through its own handle, and never stops a process by name or by pattern/, shelf);
  assert.match(flat(reference('loop.md')), /you never have more than three browser-driving seats or scripts running at once/);
  // The decision page: an approval, the prototype its one option, the findings that stayed open, one recommendation, one question.
  const page = stepOf(section(text, 'Steps'), 'Build the decision page');
  assert.match(page, /Fill the rest of `DETAIL\.md` as its template says: "What is in this folder", "Strings" with the writer's two lists, and "What the readers found", each finding fixed or open with the reason/);
  assert.match(page, /write `<package>\/05-detail\/decision\.json` in the shape of `templates\/outputs\/decision-approve\.json`: the prototype as its one option, its pictures named from the page, the phone width first, as `shots\/today-default-en-390-light\.png`/);
  assert.match(page, /one line for each seat that read it; each finding that stayed open under `findings`, by seat; one recommendation, resting on the reads; one question/);
  assert.match(page, /Its identity is the design's name, kind and size, as `status` prints them, at stage 6 of 9/);
  const sample = JSON.parse(read('templates/outputs/decision-approve.json'));
  assert.deepEqual([sample.identity.stage, sample.identity.of, sample.options.length], [STAGES.indexOf('detail') + 1, STAGES.length, 1]);
  for (const key of ['identity', 'options', 'seats', 'findings', 'recommendation', 'question']) assert.ok(Object.hasOwn(sample, key), key);
  assert.match(KIT.usage('scripts/shots.mjs'), /named <name>-<width>-<theme>\.png/);
  assert.match(read('pool/makers/prototype-builder.md'), /named `<screen>-<state>-<language>\.html`/);
  // The gate: on the prototype, which he clicks; one question; and nothing goes on without his words.
  const gate = flat(section(text, 'Gate'));
  inOrder(gate, [/^ \*\*He approves, on the prototype\.\*\* Where the kind is `first-run`, `message` or `public-page`, the words are a question of their own, asked first: the first point below\./,
    /Then put `<package>\/05-detail\/decision\.html` in front of him, and the prototype itself, `<package>\/05-detail\/prototype\/index\.html`, to open and click through/,
    /Record the one question, so that a session resuming tomorrow asks the same/, /state\.mjs await <package> detail --question/,
    /One question, about one thing: do you approve this prototype for Look\? \*\*Stop: you do not approve, and you go no further without his words\.\*\*/], 'the gate');
  // A question asked mid-way is recorded too, and a session that resumes takes his answer to the step that asked for it.
  assert.match(stepOf(section(text, 'Steps'), 'Begin'), /A stage that is awaiting the founder is not begun again: take his answer to "Gate", or to the step that asked for it\. Otherwise mark it in work:/);
  // The words are a separate question, asked first, for the three kinds whose words are the product.
  const [, kinds] = /Where the kind is ((?:`[a-z-]+`(?:, | or )?)+), the words are a question of their own, asked first/.exec(gate);
  assert.deepEqual(spansOf(kinds), ['first-run', 'message', 'public-page']);
  for (const kind of spansOf(kinds)) assert.ok(KINDS.includes(kind), kind);
  assert.match(flat(presets()), /`judge\.words` gets its own question to the founder when the kind is `first-run`, `message` or `public-page`/);
  inOrder(gate, [/\*\*The words, asked first, for those three kinds\.\*\* Write `<package>\/05-detail\/words\.json` in the shape of `templates\/outputs\/decision-approve\.json`: the strings in each language as its one option, the words judge's line, its findings that stayed open, one question: do you approve these words\?/,
    /Build it, put it in front of him with `strings\.json`, and record it with the same `await`\. His answer is written apart under `## Reviewed by the founder`\. Only then is the prototype's page put to him/,
    /page\.mjs <package>\/05-detail\/words\.json --out <package>\/05-detail\/words\.html/, /\*\*Write what he says under `## Reviewed by the founder`:\*\*/], 'the words, asked first');
  // The rule refuses something real: the same words without what the form needs are not taken.
  for (const [script, wrong] of [['shots', '<package>/05-detail/prototype --out <package>/05-detail/shots'], ['page', '<package>/05-detail/words.json'], ['state', 'await <package> detail'], ['state', 'stamp <package> detail']]) {
    assert.ok(!takenBy(script, wrong), `${script}.mjs does not take: ${wrong}`);
  }
});

test('look: it reads the detail and what its carry list names, his gallery marks from DECISIONS.md and never from earlier/, and writes 06-look built from the five stages it carries on', () => {
  const text = stageSkill('look');
  const reads = flat(section(text, 'Reads'));
  assert.match(reads, /\*\*The detail,\*\* `<package>\/05-detail\/DETAIL\.md`, approved, and exactly what its carry list names: the states, the strings, the prototype and its pictures, the chosen proposal's file, and the sections of the cast sheet, the intent and the context it carries on/);
  assert.equal(ARTEFACT.detail, '05-detail/DETAIL.md');
  assert.match(reads, /Of the cast sheet: its "Look" table, and "Fresh pass", for whether one runs at Look, and with which makers\. Of the context: "Constraints", for the two widths/);
  for (const heading of ['Look', 'Fresh pass']) assert.ok(headings(outputOf('cast')).includes(heading), heading);
  assert.match(outputOf('cast'), /^- \*\*Look:\*\* \{runs · does not run\}/m);
  // Task 16's ruling 15: what he marked in a fresh gallery at Structure reaches Look through DECISIONS.md, whichever round it was in.
  assert.match(reads, /\*\*What he marked in a fresh gallery at Structure,\*\* in the round he picked from or in one he rejected: in the package's `DECISIONS\.md`, which the carry list names\. Never in `<package>\/04-structure\/earlier\/`/);
  assert.match(flat(structureRef('rounds.md')), /Look's fresh pass reads his marks from `DECISIONS\.md`, never from `earlier\/`/);
  assert.match(flat(section(stageSkill('structure'), 'Gate')), /append the decision to the package's `DECISIONS\.md`, his gallery marks with it as he said them/);
  // Detail's carry list is what names that file for Look.
  assert.match(flat(section(stageSkill('detail'), 'Gate')), /and for the package's `DECISIONS\.md`: what he marked in a fresh gallery at Structure reaches Look through that file/);
  assert.ok(nevers(text).includes('Never read his gallery marks in `<package>/04-structure/earlier/`'));
  // Nothing of a round that was set aside is handed to a seat at Look.
  for (const id of seatSections(stageRef('look', 'seats.md'))) assert.doesNotMatch(leads(subsection(stageRef('look', 'seats.md'), `\`${id}\``)).Handed, /earlier\//, id);
  assert.match(reads, /\*\*The state:\*\* `node <kit root>\/scripts\/state\.mjs status <package>` prints the kind, the foundation, the size, the version each stage stands at, and whether Look is routed full or short/);
  // Each key of the project profile it reads is a key of the template, and none of them is about a key.
  const keys = spansOf(section(text, 'Reads').split('\n- ').find(bullet => bullet.startsWith('**The project profile,**'))).filter(span => !span.includes('/'));
  assert.deepEqual(keys, ['kit', 'tokens', 'components', 'facts', 'languages', 'engines-on', 'openai-model', 'gemini-model']);
  for (const key of keys) assert.ok(profileKeys().includes(key), key);
  assert.match(reads, /with its "Design system", and nothing about a key/);
  assert.match(read('templates/project/PROFILE.md'), /^## Design system$/m);
  assert.match(reads, /one card, when the cast sheet names its seat: `pool\/makers\/outside-describer\.md`, which speaks to you\. Every other card is read by its seat: a brief is filled from `references\/seats\.md`/);
  assert.match(reads, /\*\*Never\*\* the package's `work\/` folder, a letter that was not chosen, or the chat/);
  // What it writes: every file of the stage, and where each comes from.
  const writes = section(text, 'Writes');
  assert.match(flat(writes), /Everything below is in `<package>\/06-look\/`, and the seats' briefs in `<package>\/work\/`\. `<version>` is the version a stage stands at, as `status` prints it: after a reopening it is not 1/);
  const rows = tableRows(writes).slice(2);
  // Every file and folder the stage writes has its row: the surface's own token file, what was set aside, the lettered pictures and the sealed file among them.
  assert.deepEqual(rows.flatMap(([first]) => spansOf(first)), ['LOOK.md', 'screens/', 'variants/', 'checks.json', 'results.json', 'measures.md', 'measure/', 'shots/', 'reads/', 'directions/', 'tokens.css', 'earlier/', 'BRIEF-fresh.md', 'fresh/', 'beside/',
    'BESIDE.sealed.json', 'beside.json', 'beside.html', 'borrow.json', 'borrow.html', 'decision.json', 'decision.html']);
  assert.match(writes, /the versions' pictures under letters, and beside that folder the sealed file that says which is which; the two pages put to him/);
  assert.deepEqual(kitPaths(writes).filter(path => path.startsWith('templates/')).sort(), ['templates/outputs/LEDGER.md', 'templates/outputs/decision-approve.json', 'templates/outputs/decision.json',
    'templates/package/04-structure/BRIEF-fresh.md', 'templates/package/06-look/LOOK.md']);
  assert.deepEqual(filesUnder('templates/package/06-look/'), ['LOOK.md']);
  assert.match(writes, /`LOOK\.md` \| the stage's output, with `built-from: \[detail@<version>, structure@<version>, cast@<version>, intent@<version>, context@<version>\]`/);
  assert.match(writes, /`measures\.md` \| the table of measured values, and the named extensions \| "Measured values" and "Named extensions" of the template/);
  assert.match(writes, /`screens\/` \| the final screens: one page for each screen, state and language, each linking `<tokens>` \| the visual designer/);
  // Every heading of the output that a file of the skill names is a heading of the template.
  const template = read(`templates/package/${ARTEFACT.look}`);
  for (const heading of ['Mode', 'What is in this folder', 'What the look decides', 'Measured values', 'Variants', 'Fresh pass', 'Named extensions', 'What the readers found', 'Reviewed by the founder', 'Carry']) {
    assert.ok(headings(template).includes(heading), heading);
  }
  assert.match(flat(read('pool/CARD-FORMAT.md')), /`final-screens` \| What Look made: the finished screens as static pages on the project's tokens, with the table of measured values and the list of named extensions/);
  // The other forms: an adjustment and a flow, each said in one line that points to its page.
  assert.ok(flat(section(text, 'Steps')).trim().endsWith('**Routed `short`** (an adjustment), Look is what changes, and no more. **Sized `flow`,** it goes surface by surface, steps 4, 5, 7 and 8 once for each, and is picked or approved and stamped once. `references/forms.md` has both.'));
  assert.equal(routeFor('adjustment').look, 'short');
});

test('look: two modes; inside a system one visual designer on the project\'s token file, variants only on one named axis, and the measured values written from what accept and shots return', () => {
  const text = stageSkill('look');
  const steps = section(text, 'Steps');
  assert.deepEqual(boldSteps(steps), [[1, 'Begin'], [2, 'Read the detail, and what its carry list names. Then name the mode'], [3, 'With a fresh pass, write its brief and stop'], [4, 'Start the visual designer'],
    [5, 'Photograph and measure, one command after the other,'], [6, 'With a fresh pass, show the versions side by side, blind, and stop twice'], [7, 'Start the readers'], [8, 'One fix round, and one re-read'], [9, 'Build the decision page']]);
  // The two modes of the design, and what makes a design a direction first.
  const mode = stepOf(steps, 'Read the detail, and what its carry list names. Then name the mode');
  assert.match(mode, /Copy the template to `<package>\/06-look\/LOOK\.md` and write `built-from`, unless the file is already there: then go on from what it holds, at the first step whose file is missing\. Under "Mode", one of two:/);
  inOrder(mode, [/\*\*Direction,\*\* when `status` gives the foundation as `no-system` or the size as `system`, when `tokens` of the project profile is empty, or when the founder has said this surface leaves the design system/,
    /Two or three directions are drawn, he picks one, and his pick becomes the tokens: `references\/direction\.md`\. Then go on from step 3, on those tokens/,
    /\*\*Inside the design system,\*\* otherwise\. The palette, the typefaces and the shapes of the parts are the system's: one visual designer, and variants only on one named axis/], 'the two modes');
  assert.ok(FOUNDATIONS.includes('no-system') && SIZES.includes('system'));
  assert.match(flat(reference('routes.md')), /`no-system` \| there is no design system \| Look runs once as a direction first/);
  assert.match(flat(reference('routes.md')), /`system` \| a new product, or a rebrand \| Everything, and Look runs as a direction first/);
  assert.match(flat(read('templates/project/PROFILE.md')), /`tokens` \| The project's token file, as plain CSS\..*Empty while there is no design system/);
  // One visual designer, on what the cast sheet names, drawing static pages that link the project's token file in the project kit folder.
  const designer = stepOf(steps, 'Start the visual designer');
  assert.match(designer, /One `maker\.visual-designer`, a fresh sub-agent, started as "Starting a seat" in the loop says, on the model and the effort its line of the approved cast sheet names: a dash means the session's model, and you enforce none/);
  assert.match(designer, /Its brief is written from `templates\/briefs\/maker\.md`, and hands it what `references\/seats\.md` gives its seat\. It writes:/);
  assert.match(designer, /`screens\/`: static pages that link `<tokens>`, the project's token file in the project kit folder, by its path, and paste no value of it\. Every string and every id is the detail's/);
  assert.match(flat(read('pool/makers/visual-designer.md')), /\*\*Write static pages that link the project's token file:\*\* the real file, by its path, never its values pasted in/);
  // Variants only where the system leaves a real choice, and then on one named axis.
  assert.match(designer, /`variants\/`, only where the system leaves a real choice, and then on one named axis, as how dense the list of rooms is: one screen, the same content, two or three times, each with what it buys and what it costs\. Its reply names the axis, and the variant the screens are drawn in/);
  assert.match(flat(read('pool/makers/visual-designer.md')), /\*\*Offer variants only on one named axis\.\*\*/);
  assert.match(flat(section(text, 'Never')), /\*\*Never ask for variants where the system leaves no real choice,\*\* or on more than one named axis/);
  // R191: the designer also writes the `in-viewport` check of each criterion its brief gives that says "without scrolling".
  assert.match(designer, /`checks\.json`, one check for each contrast and each size its table states, and an `in-viewport` check for each criterion its brief gives that says "without scrolling", in a variant's own too, in the shape `scripts\/accept\.mjs` takes; and `measures\.md`, the table and the named extensions/);
  // The measured values are written from what the two scripts return, never by eye; the session writes no value.
  const measure = stepOf(steps, 'Photograph and measure, one command after the other,');
  assert.match(measure, /^5\. \*\*Photograph and measure, one command after the other,\*\* never both at once:/);
  inOrder(measure, [/shots\.mjs <package>\/06-look\/screens --out <package>\/06-look\/shots --widths <primary>,<phone> --themes <themes>/, /accept\.mjs prototype <package>\/06-look\/checks\.json --root <package>\/06-look\/screens --out <package>\/06-look\/results\.json/,
    /The widths are those of "Constraints"; `<themes>` is `light`, or `light,dark` when `<tokens>` defines a dark theme/, /With variants, both are run on `variants\/` too: `references\/seats\.md`/,
    /\*\*The table of `measures\.md` is written from what these two scripts return, never by eye,\*\* and this run is what you hold it to/,
    /Each contrast and each size is the `actual` of a result in `results\.json`, at its width and theme; any other value was read in the browser by a script of the visual designer's own, kept with its readings in `measure\/`/,
    /A row with neither behind it, a value that differs, a line `error:` or `overflow:`, a check that failed, or a criterion with no check goes back to a fresh visual designer, once for each run of this step, before the readers start, as facts: each row by its result id and its measured value, a criterion in its words\. You write no value and no check, and correct none/,
    /Both commands are run again after every change to the screens/], 'photograph and measure');
  assert.match(KIT.usage('scripts/accept.mjs'), /\{ id, pass, actual, message, criterion, state, page, width, theme \}/);
  // Variants are photographed, measured and read like the screens: a page named for its screen and its variant, checks of its own, and the same two commands on its folder.
  const variants = leads(subsection(stageRef('look', 'seats.md'), '`maker.visual-designer`'))['Variants are photographed, measured and read like the screens'];
  assert.match(variants, /^A variant's page is named for its screen and its variant, as `today-default-en-compact\.html`, so that no picture of one takes a screen's name; `variants\/` holds a `checks\.json` of its own; and each variant has its rows in `measures\.md`, which name it\. In step 5 of the skill, with variants, two more commands follow the two, one after the other:/);
  assert.deepEqual(commandsOf(subsection(stageRef('look', 'seats.md'), '`maker.visual-designer`')), ['node <kit root>/scripts/shots.mjs <package>/06-look/variants --out <package>/06-look/shots --widths <primary>,<phone> --themes <themes>',
    'node <kit root>/scripts/accept.mjs prototype <package>/06-look/variants/checks.json --root <package>/06-look/variants --out <package>/06-look/variants/results.json']);
  assert.match(flat(stageRef('look', 'seats.md')), /"The final screens" are `<package>\/06-look\/screens\/`, the pages, and `<package>\/06-look\/measures\.md`, the table of measured values and the named extensions; with variants, `<package>\/06-look\/variants\/` too/);
  assert.match(KIT.usage('scripts/page.mjs'), /when a picture it names is not a file in the folder of --out/);
  assert.match(KIT.usage('scripts/accept.mjs'), /contrast\s+target, min \(1 to 21\)/);
  assert.match(KIT.usage('scripts/accept.mjs'), /min-size\s+target, minWidth, minHeight/);
  assert.match(flat(read('pool/makers/visual-designer.md')), /`scripts\/accept\.mjs prototype` measures a contrast or a size by id: `--help` gives the form of a check, and a result's `actual` is the value\. For the rest, read the computed value in the browser with a script of your own/);
  assert.match(flat(read('pool/makers/visual-designer.md')), /Never write a value into the table that you did not measure/);
  assert.ok(nevers(text).includes('Never draw, redraw or restyle a screen yourself'));
  assert.match(flat(section(text, 'Never')), /\*\*Never draw, redraw or restyle a screen yourself,\*\* and never write or correct a measured value/);
  // One fix round and one re-read, as at Detail; what is the detail's is not Look's to fix.
  const fix = stepOf(steps, 'One fix round, and one re-read');
  inOrder(fix, [/The findings marked `blocks` go to a fresh visual designer, handed the ledgers that hold them\. Then step 5 again/, /for each judge whose blocking finding went to the fix round, a fresh sub-agent in the same seat reads again: its brief names that seat's earlier ledger, to be opened only after it has read cold/,
    /it marks each earlier finding \*fixed\*, \*partly\* or \*still present\*, in `<package>\/06-look\/reads\/<seat>-reread\.md`/, /\*\*There is no second round\*\* of fixes; the send-back of step 5 is not one\. A finding on a string, a state or a rule is not Look's to fix: it goes to the founder, open/], 'the fix round');
  assert.match(flat(read('pool/makers/visual-designer.md')), /Never change the structure, a state, a rule, a string or an id/);
  // The readers: the judges of the "Look" table, handed the final screens with their measures.
  assert.match(stepOf(steps, 'Start the readers'), /The judges of the cast sheet's "Look" table, each a fresh sub-agent on what its line names, in one message, and those that drive a browser three at a time at most\. Each is handed what `references\/seats\.md` gives its seat, the accepted deviations with it, and its "Do not open" list\. Each writes one ledger in `reads\/`: make that folder first/);
  // What the session must never do, each as a rule, with what this stage is tempted to do first.
  const lines = section(text, 'Never').split('\n').filter(line => line.startsWith('- '));
  for (const line of lines) assert.match(line, /^- \*\*Never [^*]+[.,]\*\*/, line);
  assert.deepEqual(nevers(text), ['Never draw, redraw or restyle a screen yourself', 'Never choose a variant or a direction', 'Never ask for variants where the system leaves no real choice',
    'Never let a palette, a typeface or a raw value into a screen inside a design system', 'Never send the fresh brief before he has read it', 'Never pass the outside script anything about a key',
    'Never give a fresh maker the design system, the kit, today\'s screens or the prototype', 'Never hand off a fresh screen, mend one, or copy its code or its values', 'Never change the project profile silently',
    'Never change a string, a state, a rule or an id', 'Never read his gallery marks in `<package>/04-structure/earlier/`', 'Never stop a process by name or by pattern', 'Never ask two things at once']);
  assert.match(flat(section(text, 'Never')), /\*\*Never change a string, a state, a rule or an id,\*\* and never run a second fix round/);
});

// What a card's `reads` allows, as a seat's hand-over at Look names it in this package.
const HANDED_AT_LOOK = Object.freeze({
  'chosen-structure': /`<chosen>`/, intent: /`<package>\/02-intent\.md`/, context: /`<package>\/01-context\.md`/, 'states-and-rules': /The states and the rules/, strings: /`<package>\/05-detail\/strings\.json`/,
  prototype: /`<package>\/05-detail\/prototype\/`/, tokens: /`<tokens>`/, 'design-system': /What the project says of its design system/i, 'fresh-marks': /his marks|what he marked in it/, 'final-screens': /The final screens/,
  pictures: /`<package>\/06-look\/(?:shots|beside)\/`/, 'component-source': /The component source: the folder the project profile names under `components`/, 'sibling-surfaces': /The sibling surfaces/, 'product-facts': /The project's facts document/,
  'example-data': /The data the example rows come from, where "Project sources" of the context names such a file/,
  profile: /profession's profile, whole/, person: /\bher card\b/i, 'profile-traits': /Her profession's traits/,
});
// What a card's `never-reads` names, as the seat's brief lists it at Look, or as the hand-over keeps it out.
const KEPT_OUT_AT_LOOK = Object.freeze({
  'design-system': /the design system/i, kit: /the project's kit/, 'current-screens': /today's screens?/, 'sibling-surfaces': /sibling surfaces/, 'other-proposals': /another fresh maker's files|no other proposal/,
  'session-idea': /idea of yours/, 'maker-notes': /`<package>\/work\/`/, 'author-map': /`<package>\/04-structure\/MAP\.sealed\.json`/, 'other-ledgers': /every file of `<package>\/06-look\/reads\/` but its own/,
  'task-reads': /an audience's read is in it|every file of `<package>\/06-look\/reads\/` but its own/, intent: /`<package>\/02-intent\.md`/, package: /every other file of the package/, profile: /her profession's profile itself/,
  'describers-brief': /everything in `<package>\/04-structure\/`/, 'states-and-rules': /`<package>\/05-detail\/states\.md`, `<package>\/05-detail\/DETAIL\.md`/, strings: /`<package>\/05-detail\/strings\.json`/,
  prototype: /`<package>\/05-detail\/prototype\/`/,
});

test('look: each seat is handed what its card reads and no more; a fresh maker the fresh brief alone, and nothing of the system, the kit or the prototype', () => {
  const seats = stageRef('look', 'seats.md');
  assert.deepEqual(headings(seats), ['The makers', 'The readers']);
  const cards = cardsAt('look');
  assert.deepEqual(seatSections(seats), ['maker.visual-designer', 'maker.screen-generator', 'maker.outside-describer', 'judge.visual-craft', 'judge.system-fidelity', 'judge.accessibility', 'judge.truth', 'judge.profile', 'audience.task-reader']);
  assert.deepEqual([...seatSections(seats)].sort(), Object.keys(cards).sort());
  const top = flat(seats.slice(0, seats.indexOf('\n## ')));
  assert.match(top, /A brief hands a seat what its card's `reads` allows and this page lists, each file by its absolute path, and lists under "Do not open" what its card's `never-reads` names, as this package holds it/);
  assert.match(top, /"The final screens" are `<package>\/06-look\/screens\/`, the pages, and `<package>\/06-look\/measures\.md`, the table of measured values and the named extensions/);
  // A reader's file is named for its seat and for what the seat is loaded with; a seat that read the beside comparison reads the main read as a fresh sub-agent, its earlier file closed.
  const naming = forAll(section(seats, 'The readers'));
  assert.match(naming, /`<seat>`, in the name of a reader's file, is the seat's id, and a seat that is loaded adds what it is loaded with, so that no two readers share a file: `judge\.visual-craft`, `judge\.profile-<name>` for each profession's profile, `audience\.task-reader-<name>`/);
  assert.match(naming, /Three seats read twice when a fresh pass ran, each time as a fresh sub-agent: the truth judge and the profile judge read the beside comparison first, and the system fidelity judge writes the borrow list first, as `references\/fresh\.md` gives them\. What this page gives is the main read, of step 7 of the skill/);
  assert.match(naming, /Its seat's read of the beside comparison, `<seat>-beside\.md`, and the borrow list are not its own: a main read opens neither/);
  assert.match(naming, /`<package>\/04-structure\/earlier\/`, and the board and the proposals folder beside it, but `<chosen>` where a seat is handed it/);
  assert.match(naming, /It writes its first read's name with `-reread` before `\.md`, as `judge\.visual-craft-reread\.md` or `judge\.profile-<name>-reread\.md`, beside the first read and never over it/);
  // No seat is ever handed the project profile: what the project says of its design system is the files that section names.
  assert.match(top, /"What the project says of its design system" is the documents that "Design system" of the project profile names, each by its path\. A seat is handed those files, and never the project profile/);
  assert.match(flat(conductor()), /No seat is ever handed the project profile/);
  const common = forAll(section(seats, 'The readers'));
  assert.match(common, /The readers are started once the screens are photographed and measured: in one message, so that no ledger exists while another judge reads, and those that drive a browser three at a time at most/);
  for (const path of ['<package>/work/', `<package>/04-structure/${MAP}`, '<package>/04-structure/CHOSEN.md', '<package>/03-cast.md', '<package>/05-detail/reads/', '<package>/04-structure/reads/', '<package>/06-look/LOOK.md',
    '<package>/06-look/decision.json', '<package>/06-look/decision.html', '<package>/06-look/beside.json', '<package>/06-look/beside.html', '<package>/06-look/borrow.json', '<package>/06-look/borrow.html', '<package>/06-look/BRIEF-fresh.md',
    '<package>/04-structure/earlier/']) assert.ok(common.includes(`\`${path}\``), path);
  assert.match(common, /\*\*On a re-read\*\* the brief is the first read's, and says so\. It names one file more: that seat's earlier ledger, the one file of `<package>\/06-look\/reads\/` it opens besides its own, and only after it has read cold and written its findings/);

  for (const [id, card] of Object.entries(cards)) {
    const part = subsection(seats, `\`${id}\``);
    const said = leads(part);
    const reader = card.shelf !== 'maker';
    for (const lead of ['Handed', 'Do not open', 'Writes']) assert.ok(said[lead], `${id}: ${lead}`);
    const fresh = id === 'maker.screen-generator' || id === 'maker.outside-describer';
    if (!fresh) assert.ok(said['Its brief'].includes(`\`templates/briefs/${card.shelf}.md\``), `${id}: its brief`);
    // What its card reads, it is handed: in its hand-over, or, for his marks, in its brief too.
    for (const token of card.reads) {
      // At Look the accessibility judge reads the final screens: the plain prototype was its read at Detail. And the visual
      // designer reads the kit only when it rebuilds it, after a direction is picked: direction.md hands it over there.
      if (AT_ANOTHER_STAGE.includes(token) || (id === 'judge.accessibility' && token === 'prototype') || (id === 'maker.visual-designer' && token === 'kit')) continue;
      if (token === 'brief') {
        if (fresh) assert.match(said.Handed, /^`<package>\/06-look\/BRIEF-fresh\.md`/, `${id}: the fresh brief`);
        continue;
      }
      assert.ok(HANDED_AT_LOOK[token], `${id}: ${token} has no hand-over the test knows`);
      assert.match(`${said['Its brief'] ?? ''} ${said.Handed}`, HANDED_AT_LOOK[token], `${id}: reads ${token}`);
    }
    // What its card does not read, it is not.
    for (const [token, handed] of Object.entries(HANDED_AT_LOOK)) if (!card.reads.includes(token)) assert.doesNotMatch(said.Handed, handed, `${id}: is handed ${token}, which its card does not read`);
    // What its card never reads is listed in its brief, or kept out of what is sent.
    const closed = `${flat(part)}${reader ? ` ${common}` : ''}`;
    for (const token of card['never-reads']) {
      if (AT_ANOTHER_STAGE.includes(token)) continue;
      assert.ok(KEPT_OUT_AT_LOOK[token], `${id}: ${token} has no place the test knows`);
      assert.match(closed, KEPT_OUT_AT_LOOK[token], `${id}: never reads ${token}`);
    }
    if (reader) {
      assert.match(said['Do not open'], /^the list above/, id);
      assert.match(said.Writes, /`<package>\/06-look\/reads\/<seat>(?:-<name>)?(?:-beside)?\.md`, in the shape of `templates\/outputs\/(?:LEDGER|TASK-READ)\.md`/, id);
    }
  }
  // What the visual designer's card reads, in full: the kit is the last of it, for the rebuild after a direction pick, where it is
  // handed the kit folder and its contract.
  assert.deepEqual(cards['maker.visual-designer'].reads, ['brief', 'chosen-structure', 'states-and-rules', 'strings', 'prototype', 'tokens', 'design-system', 'fresh-marks', 'person', 'profile', 'kit']);
  assert.match(flat(stageRef('look', 'direction.md')), /A fresh `maker\.visual-designer`, handed the token file, `<kit dir>` and `kit\/KIT-CONTRACT\.md`, restyles the kit's classes/);
  assert.doesNotMatch(leads(subsection(seats, '`maker.visual-designer`')).Handed, /`<kit dir>`|KIT-CONTRACT/, 'in its main hand-over the visual designer is free of the kit\'s parts, and is not handed them');
  assert.match(flat(read('pool/CARD-FORMAT.md')), /\| `kit` \| The shared kit, the project's or the grey one: its stylesheets, its parts and its contract\. \|/);
  // Ruling R143: the visual designer is handed her card and her profession's profile, whole; a fresh maker neither.
  assert.match(leads(subsection(seats, '`maker.visual-designer`')).Handed, /And the two lines the maker's brief template keeps for them: her card, by the path the carry list names, and her profession's profile, whole\. A fresh maker is handed neither/);
  for (const id of ['maker.screen-generator', 'maker.outside-describer']) assert.ok(!cards[id].reads.includes('person') && !cards[id].reads.includes('profile'), id);
  // Ruling R144: the task reader sits at Look only with a fresh pass, and reads the beside comparison by letter, as pictures.
  const audience = leads(subsection(seats, '`audience.task-reader`'));
  assert.match(flat(subsection(seats, '`audience.task-reader`')), /At Look it sits only with a fresh pass, once, as the primary person, `person\.<name>`: it reads the beside comparison, and nothing else of the stage/);
  assert.match(audience['Its brief'], /It says that the options are versions of one screen, each under a letter, and asks her to rank them/);
  assert.match(audience.Handed, /the pictures in `<package>\/06-look\/beside\/`, each by its path, as `<package>\/06-look\/beside\/A\.png`\. The pictures, and pictures only\./);
  assert.match(audience['Do not open'], /`<package>\/06-look\/screens\/`, `<package>\/06-look\/shots\/` and `<package>\/06-look\/fresh\/`, which say which version is which; `<package>\/06-look\/BESIDE\.sealed\.json`/);
  assert.match(audience.Writes, /`<package>\/06-look\/reads\/<seat>-beside\.md`, in the shape of `templates\/outputs\/TASK-READ\.md`, with her ranking of the letters: `audience\.task-reader-<name>-beside\.md`/);
  // The visual designer: its lens, whether motion is cast, his marks in his words; nothing of the fresh screens before he has said what he borrows.
  const designer = leads(subsection(seats, '`maker.visual-designer`'));
  assert.match(designer['Its brief'], /Its lens: the skill its line of the cast sheet names as its engine, to load if it is installed; inside a design system it shapes hierarchy and emphasis, not the palette/);
  assert.match(designer['Its brief'], /what the founder marked in a fresh gallery at Structure: his marks as he said them, copied word for word from the package's `DECISIONS\.md`, each with what on the screen it was about, or "Nothing marked"/);
  assert.match(read('templates/briefs/maker.md'), /A visual designer: the lens to load; whether motion is cast; what the founder marked in a fresh pass/);
  assert.match(designer['Do not open'], /until he has said what he borrows, `<package>\/06-look\/fresh\/` and `<package>\/06-look\/BRIEF-fresh\.md`: the system version is drawn without sight of the fresh one/);
  assert.match(designer.Writes, /`measures\.md`, under the two headings "Measured values" and "Named extensions", each in the shape `templates\/package\/06-look\/LOOK\.md` gives it/);
  assert.match(designer.Writes, /The pictures and the results of its own check go in `<package>\/work\/look-check\/`: those of record are yours to take, in step 5 of the skill/);
  assert.match(designer['What it could not draw as approved'], /It goes to the founder with the gate, open: a string is the interface writer's, and Detail's to reopen\. You change none/);
  assert.match(designer['When it is started again'], /For a thing he borrows it is also handed the fresh screen he marked it on, to understand what he liked: it copies none of its code or its values/);
  // A fresh maker at Look: the fresh brief alone, and everything of how the product looks closed to it, the prototype with it.
  const generator = leads(subsection(seats, '`maker.screen-generator`'));
  assert.match(flat(subsection(seats, '`maker.screen-generator`')), /At Look it sits only inside a fresh pass, and chooses only the paint/);
  assert.match(generator.Handed, /^`<package>\/06-look\/BRIEF-fresh\.md`, alone\./);
  for (const closed of ['`<tokens>`', '`<kit dir>`', '`<package>/06-look/screens/`', '`<package>/05-detail/prototype/` and `<package>/05-detail/shots/`, which wear the shared kit', 'everything else in the package']) assert.ok(generator['Do not open'].includes(closed), closed);
  assert.match(generator['Do not open'], /If any of this reaches the seat, its work is no longer fresh: say so, and start the seat again, clean/);
  assert.match(generator.Writes, /in `<package>\/06-look\/fresh\/`: the screen as it came, its picture, and the prompt that made it\. Its reply lists every difference between the screen and the brief/);
  const outside = leads(subsection(seats, '`maker.outside-describer`'));
  assert.match(flat(subsection(seats, '`maker.outside-describer`')), /No sub-agent sits here\. You run the command `references\/fresh\.md` gives, once for each line of the cast sheet that names this seat for Look/);
  assert.match(outside.Handed, /^`<package>\/06-look\/BRIEF-fresh\.md`, the fresh brief he approved, whole and unchanged\. The script sends that one file\. Add nothing to it/);
  assert.match(outside.Writes, /`<package>\/06-look\/fresh\/<name>\.html`: the answer, whole, as it came/);
  // The judges: the truth judge and the profile judge sit at Look only where the cast sheet seats them.
  assert.match(flat(subsection(seats, '`judge.truth`')), /It reads at Look where the cast sheet seats it: always on a public page, and with a fresh pass\. It looks for what Look could have added that the approved detail did not hold/);
  assert.match(flat(read('pool/judges/truth.md')), /\*Look\*: only what Look could have added/);
  assert.match(flat(subsection(seats, '`judge.profile`')), /It sits here only when one of its optional checks about legibility \(`physical`\) is on, or its profession's profile has a "So the interface must" line under its usage context, and with a fresh pass, to rank the two/);
  assert.match(flat(presets()), /at Look only when one of its optional checks about legibility \(`physical`\) is on, or the profession's profile has a "So the interface must" line under its usage context/);
  assert.match(leads(subsection(seats, '`judge.system-fidelity`')).Handed, /after a fresh pass, what he marked in it, as he said it, with the fresh screen each mark is on, by its path: it checks what was rebuilt against them/);
  assert.match(read('pool/judges/system-fidelity.md'), /\| borrow-list \| A fresh pass ran/);
  assert.match(leads(subsection(seats, '`judge.accessibility`'))['Its brief'], /It says the screens are drawn in their final colours and sizes: at Look its measured checks run/);
  for (const id of ['maker.visual-designer', 'maker.screen-generator', 'judge.accessibility']) assert.match(flat(subsection(seats, `\`${id}\``)), /\*\*It drives a browser[,*]/, id);
});

test('look: a fresh pass draws the one screen with its approved words, only the paint its own; his yes comes before anything is sent; the versions are compared blind; two questions, three outcomes; and nothing a fresh maker made is handed off', () => {
  const text = stageSkill('look');
  const steps = section(text, 'Steps');
  const fresh = stageRef('look', 'fresh.md');
  assert.deepEqual(headings(fresh), ['1. The one screen', '2. The fresh brief', '3. Stop: the founder reads it', '4. The fresh makers', '5. The letters', '6. The readers of the two', '7. The first question: what he would keep',
    '8. The second question: what is borrowed', '9. The three outcomes']);
  const top = flat(fresh.slice(0, fresh.indexOf('\n## ')));
  // Offered, never added: the conductor's rule, pointed to.
  assert.match(top, /What a fresh pass is, what a fresh maker is and is not given, and its three outcomes are the conductor's: `skills\/design\/references\/fresh-pass\.md`/);
  assert.match(top, /It runs when "Fresh pass" of the cast sheet says so for Look, or when the founder asks for one at Look's decision page\. You never add one yourself/);
  assert.match(flat(reference('fresh-pass.md')), /You never add one yourself/);
  // Ruling R121: the fresh brief names the one screen the visual designer is drawing, with its approved structure, states and strings.
  const brief = stepOf(steps, 'With a fresh pass, write its brief and stop');
  assert.match(brief, /"Fresh pass" of the cast sheet says whether one runs at Look\. Write `<package>\/06-look\/BRIEF-fresh\.md` in its Look form: the one screen that carries the idea, its state, and its approved items in order, their words exactly as approved/);
  // A brief that is there is not a brief he has said yes to: on any day, the stop holds until LOOK.md holds his yes.
  assert.match(brief, /He reads it whole\. \*\*Nothing is sent before his yes,\*\* to a sub-agent or off the machine: until `LOOK\.md` holds it, written, you are at this stop, on any day\. `references\/fresh\.md` has the rest/);
  const template = read('templates/package/04-structure/BRIEF-fresh.md');
  assert.match(template, /<!-- Look form: from here to the end/);
  assert.match(flat(template), /## The one screen You are asked to draw one screen, in one state\. Its structure and its words are decided\. Draw it with these items, in this order, and these words exactly as written/);
  const screen = flat(section(fresh, '1. The one screen'));
  assert.match(screen, /At Look a fresh pass is one screen, in one state, and it is a screen the visual designer is drawing too: the two are compared on the same content/);
  assert.match(screen, /\*\*Which one:\*\* the screen that carries the idea\. That is the screen of the chosen structure where the one job gets done, the one that holds its primary action, in its `default` state, in the product's main language\. The brief names it, and he may name another when he reads it/);
  assert.match(screen, /\*\*Nothing else is drawn fresh:\*\* no second state, no other screen, never the flow/);
  assert.match(read('templates/package/05-detail/states.md'), /named `default`/);
  const written = flat(section(fresh, '2. The fresh brief'));
  inOrder(written, [/Write `<package>\/06-look\/BRIEF-fresh\.md` from `templates\/package\/04-structure\/BRIEF-fresh\.md`, in its Look form: keep "The one screen" and the "What to return" after it, and delete the Structure form, as the template's first lines say/,
    /\*\*"The one screen":\*\* its title, and what it is for; its state, as its row of `<package>\/05-detail\/states\.md` has it; and its items in order, from the chosen proposal's file, each with its string exactly as `<package>\/05-detail\/strings\.json` has it in that language/,
    /Copy the words: retype none, shorten none, add none/, /\*\*Nothing of how the product looks\.\*\* Not the design system, `<tokens>`, the shared kit, today's screens or the sibling surfaces; no colour, no typeface, no component and no layout word/,
    /So a fresh maker draws that screen, with those words exactly, and chooses only the paint/], 'the fresh brief');
  for (const heading of ['The person', 'The job', 'The tasks', 'What the product can show and do', 'Language and device', 'The one screen']) {
    assert.ok(template.includes(`\n## ${heading}\n`), heading);
    assert.ok(written.includes(`"${heading}"`), `fresh.md names "${heading}"`);
  }
  assert.match(flat(read('pool/makers/screen-generator.md')), /\*\*At Look, choose only the paint\.\*\* Your brief names the one screen the visual designer is drawing, and its state, and carries that screen's approved structure and strings/);
  // The stop: he reads it whole, hears what leaves the machine, the question is recorded, and nothing is sent before his yes is written.
  const stop = flat(section(fresh, '3. Stop: the founder reads it'));
  inOrder(stop, [/Put the brief in front of him whole\. Say in the same message which seats would send it off this machine, each with its provider: every `maker\.outside-describer` line, `model:openai` or `model:gemini`, and a `maker\.screen-generator` on `tool:stitch`/,
    /One question, about one thing: may this brief go out as it is\? Record it with the `await` of the skill's gate\. \*\*Nothing is sent before his yes: not to a sub-agent, and not off the machine\.\*\*/,
    /Write what he changes into the brief, then his yes under `## Reviewed by the founder` of `LOOK\.md`, as he said it, with the seats that send it out, and put the stage back in work with the `begin` of step 1 of the skill\. A seat he holds back does not run/,
    /A provider that `engines-on` of the project profile does not list gets nothing, and you turn no engine on/,
    /\*\*Until `LOOK\.md` holds his yes to this brief, no fresh maker is started\.\*\* A session that resumes and finds `BRIEF-fresh\.md` with no yes to it written there is at this stop: it puts the brief to him again, whole, and sends nothing/,
    // Ruling R144: a fresh pass asked for at the gate has no line on the cast sheet, so its seats run on what their cards suggest, and he is told.
    /\*\*A fresh pass he asked for at the gate has no line on the cast sheet\.\*\* Then each of its seats, the makers of step 4 and the readers of step 6, runs on the model and the effort its card suggests\. Say so to him at this stop, seat by seat: he may name another/], 'the stop at the fresh brief');
  assert.match(flat(reference('loop.md')), /every fresh brief, at Structure or at Look:\*\* either may leave the machine\. Nothing is sent before his yes/);
  assert.match(flat(structureRef('rounds.md')), /A seat the cast sheet has no line for runs on the model and the effort its card suggests, unless he says otherwise/);
  // No seat is started and nothing is sent in a step of the skill before that stop.
  const before = steps.slice(0, steps.search(/^4\. \*\*/m));
  assert.deepEqual(commandsOf(before), ['node <kit root>/scripts/state.mjs begin <package> look']);
  assert.doesNotMatch(before.slice(before.search(/^3\. \*\*/m)), /Start |started/);
  // The fresh makers: after his yes; the outside model through describe --text, six flags and nothing else.
  const makers = flat(section(fresh, '4. The fresh makers'));
  assert.match(makers, /^ After his yes, and never before\. They may run while the visual designer of step 4 of the skill draws: neither sees the other's work/);
  assert.match(makers, /\*\*`maker\.outside-describer`\*\* is no sub-agent: you run it, once for each of its lines, on the brief he approved\. These six flags and nothing else, since the script finds its key itself/);
  const outside = stageCommands('look').filter(command => command.includes('scripts/describe.mjs'));
  assert.deepEqual(outside, ['node <kit root>/scripts/describe.mjs --text --provider <openai|gemini> --model <id> --brief <package>/06-look/BRIEF-fresh.md --out <package>/06-look/fresh/<name>.html --profile <packages>/PROFILE.md']);
  assert.deepEqual(words(outside[0]).filter(word => word.startsWith('--')), ['--text', '--provider', '--model', '--brief', '--out', '--profile']);
  assert.ok(takenBy('describe', words(outside[0]).slice(2).join(' ')));
  // Without --text the same answer would be held to the walkthrough format: at Look it is not a proposal.
  assert.match(makers, /With `--text` the answer is not a proposal: the script looks for none, writes the answer whole, as it came, to `--out`, and exits 0/);
  assert.match(flat(KIT.usage('scripts/describe.mjs')), /With --text the answer is not meant to be a proposal: a check that the engine answers, or a fresh pass at Look\. It is written whole, as it came, to --out, which then names a \.txt, \.md or \.html file/);
  assert.match(makers, /A refusal leaves nothing: tell the founder what the script printed, as it printed it, and try once more only after a timeout\. Never look for the reason in a file of keys or in the environment/);
  for (const [file, body] of Object.entries(folderOf('look'))) {
    assert.doesNotMatch(body, /--endpoint|--seed|--timeout|--chrome|--keys?\b|API_KEY|keys-file|\.env\b|https?:/, `${file}: no address, no seed, no key, no keys file`);
  }
  const never = flat(section(text, 'Never'));
  assert.match(never, /\*\*Never send the fresh brief before he has read it,\*\* to a sub-agent or off the machine\. A provider that `engines-on` does not list gets nothing: you turn no engine on/);
  assert.match(never, /\*\*Never pass the outside script anything about a key,\*\* or any flag but the six of `references\/fresh\.md`\. Never open, list or name a file of keys, and never print the environment/);
  assert.match(never, /\*\*Never give a fresh maker the design system, the kit, today's screens or the prototype\.\*\* The screen, its state and its words are approved: it chooses only the paint/);
  // Kept as they came, in 06-look/fresh/, and pictured as they came.
  assert.match(makers, /\*\*Everything in `<package>\/06-look\/fresh\/` stays as it came\.\*\* You mend nothing: not a label, not a mark left around the page/);
  assert.ok(stageCommands('look').includes('node <kit root>/scripts/shots.mjs <package>/06-look/fresh/<name>.html --out <package>/06-look/fresh --widths <primary> --allow-errors'));
  assert.match(flat(read('pool/makers/screen-generator.md')), /--widths <the device's width> --allow-errors/);

  // Rulings R142 and R147: the comparison is blind. The kit's own script deals the letters, so that neither a name, a time nor the
  // order of the files says which is which; the sealed file lies beside the folder, shut until his first answer is written.
  const letters = section(fresh, '5. The letters');
  inOrder(flat(letters), [/The versions of the one screen are compared blind/, /Their names say which is which, and which engine made it, so nobody reads them there\. The kit deals them letters/,
    /Name every version's picture, in any order\. The script shuffles them itself and copies each into `<package>\/06-look\/beside\/` under its letter, as `<package>\/06-look\/beside\/A\.png`, all with one time on them, so that neither a name, a time nor the order of the files says which is which/,
    /It writes that into `<package>\/06-look\/BESIDE\.sealed\.json`, beside the folder, and prints how many it dealt and the letters, nothing else/, /It checks everything before it writes, and refuses a `beside\/` that is already there: letters are dealt once/,
    /\*\*Until his first answer is written, the sealed file is not opened, printed, searched or copied,\*\* with any tool, and you do not work out a letter by setting two pictures side by side/], 'the letters');
  assert.deepEqual(fencedLines(letters), ['node <kit root>/scripts/deal.mjs <package>/06-look/shots/<page>-<primary>-light.png <package>/06-look/fresh/<name>-<primary>-light.png --out <package>/06-look/beside']);
  assert.deepEqual(commandsOf(letters), fencedLines(letters));
  // No file of the skill deals letters any other way, or says which picture to name first.
  for (const [file, body] of Object.entries(folderOf('look'))) assert.doesNotMatch(body, /node -e|randomInt|name the system's|system's (?:picture )?first, /i, file);
  assert.match(KIT.usage('scripts/deal.mjs'), /The list is shuffled before a letter is given, the copies are made in letter order, and every copy gets\none and the same modification time/);
  assert.match(KIT.usage('scripts/deal.mjs'), /for\n06-look\/beside that is 06-look\/BESIDE\.sealed\.json/);
  // The readers of the two are the seats Cast gave a line (ruling R144), handed the lettered folder and nothing else of 06-look.
  const readers = flat(section(fresh, '6. The readers of the two'));
  inOrder(readers, [/The seats the cast sheet's "Look" table says read the beside comparison: the truth judge, the profile judge for each profession's profile, and one task reader\. Each is a fresh sub-agent on what its line names/,
    /\*\*Of `<package>\/06-look\/`, each is handed `<package>\/06-look\/beside\/` and nothing else:\*\* the pictures, by letter\. Its brief says the letters are versions of one screen, and never which is the system's/,
    // What a seat's section hands it of 06-look is its main read's: for this read, only what comes from outside that folder holds.
    /What its section of `references\/seats\.md` hands it from outside `<package>\/06-look\/` still holds\. What that section hands it of `<package>\/06-look\/` does not: that is its main read's/,
    /\*\*Do not open, for this read:\*\* `<package>\/06-look\/BESIDE\.sealed\.json`, `<package>\/06-look\/fresh\/`, `<package>\/06-look\/shots\/` and `<package>\/06-look\/screens\/`, with the list `references\/seats\.md` gives every reader/,
    // The truth judge is held to what it can open: the inventory and the approved strings, never the fresh brief.
    /\*\*The truth judge\*\* flags, by letter, anything the product cannot do: an element, a label or a promise that neither the context's inventory nor the approved strings hold\. It is handed `<package>\/01-context\.md` and `<package>\/05-detail\/strings\.json` to hold the pictures to/,
    /\*\*The profile judge and the task reader rank the letters,\*\* best first, with the size of each gap/,
    /\*\*Each writes `<package>\/06-look\/reads\/<seat>-beside\.md`,\*\* a ledger or a task read\. That file is closed to the main read of step 7 of the skill/], 'the readers of the two');
  assert.doesNotMatch(readers, /the brief did not hold|What else each is handed is its section/);
  assert.match(flat(stageRef('look', 'seats.md')), /`<package>\/06-look\/BRIEF-fresh\.md`, and the prompt kept beside a fresh screen/);
  assert.match(flat(presets()), /With a fresh pass at Look, three seats read the beside comparison/);
  assert.match(flat(reference('fresh-pass.md')), /The profile judge, who reads with her profession's profile, and one audience rank the two\. The truth judge flags anything the product cannot do\. The system fidelity judge lists what the system lacks to make each thing he may want/);
  // The cards of the two judges say what they do in a fresh pass: the profile judge ranks the letters, the system fidelity judge reads twice.
  assert.match(flat(read('pool/judges/profile.md')), /At \*Structure\* you run the six on every option, by its letter, flag what blocks, then rank the options for this profession, with the size of each gap \(\*clear\*, \*slight\* or \*tie\*\) and one reason\. You rank the letters of a beside comparison at \*Look\* the same way, in a `-beside` ledger/);
  assert.match(flat(read('pool/judges/profile.md')), /the "Cannot tell" list; at Structure or in a `-beside` ledger, the ranking, each gap with a reason/);
  assert.match(read('pool/judges/system-fidelity.md'), /\| borrow-list \| A fresh pass ran[^|]+\| Two reads\. Between his two answers, your brief asks for the list alone, in a ledger of its own: for each thing he marked, what the system has for it and what it would need, a token, a part, a pattern, or nothing new\. In your main read, check that what was rebuilt uses only tokens and named extensions, with no value and no code taken from the fresh screen/);
  assert.match(flat(read('pool/judges/system-fidelity.md')), /With the `borrow-list` check the list has a ledger of its own, between the founder's two answers/);
  assert.match(read('templates/briefs/audience.md'), /^- \*\*Stage:\*\* \{Structure · Detail · Look · Acceptance\}$/m);
  // The skill's step: blind, and two stops.
  const side = stepOf(steps, 'With a fresh pass, show the versions side by side, blind, and stop twice');
  assert.match(side, /The system's picture of the one screen and each fresh one are copied under letters dealt at random into `beside\/`, read by letter, and put to him: what would he keep\? Then, with what each thing would cost the system on the page: which of the three outcomes\?/);
  assert.match(side, /What he borrows is rebuilt on the tokens by the visual designer and flagged in `LOOK\.md` as a named extension of the system: `references\/fresh\.md`\. Then step 5 again/);
  // Ruling R145, the first question: he marks what he would keep, by letter, as blind as the readers; only then is the sealed file opened,
  // and only by the script that sealed it.
  const first = flat(section(fresh, '7. The first question: what he would keep'));
  inOrder(first, [/Write `<package>\/06-look\/beside\.json` in the shape of `templates\/outputs\/decision\.json`, and build it/, /page\.mjs <package>\/06-look\/beside\.json --out <package>\/06-look\/beside\.html/,
    /\*\*The options are the letters,\*\* in their order, each with its picture named from the page, as `beside\/A\.png`\. No title and no line says which is the system's: he is as blind as the readers were/,
    /\*\*one question:\*\* what would you keep from each of these\?/, /record the question with the `await` of the skill's gate\. \*\*Stop\.\*\*/,
    /Write what he marks, letter by letter, as he said it, under "Fresh pass" of `LOOK\.md`, and put the stage back in work with the `begin` of step 1 of the skill/,
    /\*\*Only now is the sealed file opened,\*\* and only this way:/, /deal\.mjs open <package>\/06-look\/beside/, /It prints each letter with its source\. Write beside each mark which version it is on/,
    /If nothing he marked is on a fresh screen, the outcome is the first of step 9, and no second question is asked/], 'the first question');
  assert.deepEqual(stageCommands('look').filter(command => command.includes('deal.mjs open')), ['node <kit root>/scripts/deal.mjs open <package>/06-look/beside']);
  assert.ok(!flat(fresh).slice(0, flat(fresh).indexOf('## 7. The first question')).includes('deal.mjs open'), 'the sealed file is opened in no step before his first answer');
  // The second question: the borrow list first, so that he chooses with the cost in front of him; the cost of the third outcome on the page too.
  const second = flat(section(fresh, '8. The second question: what is borrowed'));
  inOrder(second, [/He chooses with the cost in front of him/, /\*\*The system fidelity judge writes the borrow list first\.\*\*/,
    /Its brief says this read is the borrow list alone: for each thing he marked, what the system has for it, and what it lacks, a token, a part, a pattern or nothing\. It writes `<package>\/06-look\/reads\/judge\.system-fidelity-borrow\.md`/,
    /\*\*Then the page,\*\* `<package>\/06-look\/borrow\.json`, in the shape of `templates\/outputs\/decision\.json`, built once the sealed file is opened and by what each version is: "The system version" first, then each fresh screen as it came, titled "Fresh" with its maker's line on the cast sheet, as "Fresh: outside-openai"/,
    // The page letters its own options: a line that was written by a beside letter is rewritten to name the version, with that letter after it.
    /\*\*This page's letters are not the beside letters\.\*\* The page letters its options in its own order, so the system version may be A here and have been B there/,
    /Every line carried onto it that was written by letter, his marks, the readers' lines and the truth judge's flags, is rewritten through the sealed file to name the version, with its beside letter after it, as "the system version \(was B\)"\. No line of this page names a beside letter alone/,
    /page\.mjs <package>\/06-look\/borrow\.json --out <package>\/06-look\/borrow\.html/, /\*\*The cost of each thing is on the page:\*\* under `findings`, by seat, one line of the borrow list for each thing he marked/,
    /\*\*The cost of the third outcome is on the page before he chooses:\*\* the line of each fresh option says that taking it whole is a change of direction for this surface/,
    /\*\*one question:\*\* which is it: nothing to borrow, named things to borrow, or the fresh concept as a whole\?/, /record the question with the `await` of the skill's gate\. \*\*Stop: you borrow nothing, and you go no further without his words\.\*\*/], 'the second question');
  assert.match(read('pool/judges/system-fidelity.md'), /\| borrow-list \| A fresh pass ran/);
  assert.match(read('templates/outputs/LEDGER.md'), /^## Borrow list$/m);
  // The three outcomes of the conductor, each with what Look does next; a borrowed thing is rebuilt and flagged as a named extension.
  const outcomes = section(fresh, '9. The three outcomes');
  assert.deepEqual(boldSteps(outcomes).map(([, name]) => name), ['Nothing to borrow', 'Borrow named things', 'The fresh concept wins as a whole']);
  assert.deepEqual(boldSteps(section(reference('fresh-pass.md'), 'Three outcomes, and only three')).map(([, name]) => name), ['Nothing to borrow', 'Borrow named things', 'The fresh concept wins as a whole']);
  assert.match(flat(outcomes), /There are three outcomes, and no fourth: "a bit of both" names nothing\. Ask him for the things, by name/);
  assert.match(flat(outcomes), /Each thing he names goes to a fresh visual designer, handed his words, the fresh screen each is on, and the screens as they stand\. It rebuilds each on `<tokens>`, and copies none of the fresh screen's code or its values/);
  assert.match(flat(outcomes), /\*\*What the system lacks enters as a named extension of the system:\*\* its name; what it is, a token, a part or a pattern; its values beside the system's own; where it is used; what it costs\. It is written in `measures\.md` and flagged in `LOOK\.md`, under "Named extensions" in both/);
  assert.match(flat(outcomes), /In its main read the system fidelity judge is handed his marks once more, and checks that what was rebuilt holds nothing taken from a fresh screen/);
  assert.match(flat(read('pool/makers/visual-designer.md')), /that enters as a \*\*named extension\*\*: its name, what it is \(a token, a part or a pattern\), its values beside the system's own, where it is used, and what it costs/);
  assert.match(flat(outcomes), /\*\*The fresh concept wins as a whole\.\*\* That is a change of direction for this surface: `references\/direction\.md`, under "When a fresh concept won as a whole"\. Even then the fresh screen is not handed off/);
  assert.ok(headings(stageRef('look', 'direction.md')).includes('When a fresh concept won as a whole'));
  // Nothing a fresh maker made is handed off: not copied into the screens, and never named by the carry list, as it came or under a letter.
  assert.match(flat(outcomes), /\*\*Never is a fresh screen handed off as it came\.\*\* Nothing of `<package>\/06-look\/fresh\/` is copied into `<package>\/06-look\/screens\/`, and no line of the carry list names it, or `<package>\/06-look\/beside\/`/);
  const gate = flat(section(text, 'Gate'));
  assert.match(gate, /the lines of the detail's own carry list, as they are, the cast sheet's tables among them, but any that names a file of a `fresh\/` folder/);
  assert.match(gate, /\*\*No line names `<package>\/06-look\/fresh\/`, or anything else a fresh maker made: none of it is handed off\.\*\*/);
  assert.match(never, /\*\*Never hand off a fresh screen, mend one, or copy its code or its values\.\*\*/);
  // He may still ask for one at the decision page: it is run before he is asked again.
  assert.match(gate, /\*\*A fresh pass he asks for here\*\* is run before he is asked again: write his asking under `## Reviewed by the founder`, put the stage back in work with the `begin` of step 1, go to step 3/);
  assert.match(flat(reference('fresh-pass.md')), /The founder can ask for one at any decision page/);
});

test('direction.md: two or three directions of different kinds, each named with a thesis and a stated cost, on the same detailed screen; the pick becomes the tokens, and the project profile changes only by a change he approves', () => {
  const text = stageSkill('look');
  const direction = stageRef('look', 'direction.md');
  assert.deepEqual(headings(direction), ['When', 'Two or three, of different kinds', 'The pictures, the readers, the page', 'The pick becomes the tokens', 'When a fresh concept won as a whole']);
  const top = flat(direction.slice(0, direction.indexOf('\n## ')));
  assert.match(top, /A direction is a committed visual point of view: named, with a thesis and a cost/);
  assert.match(top, /two or three are drawn on the same detailed screen, the founder picks one from pictures, and his pick becomes the tokens\. Then Look goes on as the skill gives it, on those tokens/);
  // When: the conditions of the skill's step 2, each said again with where it is read.
  const when = flat(section(direction, 'When'));
  inOrder(when, [/gives the foundation as `no-system`, whatever the size, or the size as `system`/, /`tokens` of the project profile is empty, and its "Design system" says there is none yet/,
    /The founder has said that this surface leaves the design system on purpose/, /A fresh concept won as a whole: the last section of this page/], 'when');
  assert.match(flat(presets()), /Where the foundation is `no-system`, Look opens the same way whatever the size, from a surface up/);
  // The rule ported from version 1's direction phase: three shades of one safe idea are not a choice.
  const kinds = flat(section(direction, 'Two or three, of different kinds'));
  assert.match(kinds, /^ \*\*Three shades of one safe idea are not a choice\. They are the illusion of one\.\*\* The test: with all of them drawn, could he tell them apart from across the room\?/);
  // Until a direction-maker card exists, the visual designer is cast once for each direction, each with a different lens.
  assert.match(kinds, /\*\*Who draws them\.\*\* Until the kit has a card for a direction maker, `maker\.visual-designer` is cast once for each direction, each with a different lens\. The cast sheet's "Look" table has a line for each, with its lens/);
  assert.match(flat(presets()), /three directions, each drawn by one `maker\.visual-designer` cast for a direction, each with a lens of its own/);
  assert.ok(!Object.keys(kitCards()).some(id => id.includes('direction')), 'the kit has no direction maker card yet');
  assert.match(kinds, /\*\*Read the lenses before you start a maker\.\*\* Two lines with one lens, or lenses that part only by a shade, a little warmer or a little denser, are not two kinds\. Say so to the founder, and ask him for another: the sheet is his, and you write no lens of your own/);
  // Every question the page asks mid-stage is recorded, his answer written, and the stage put back in work, before the next step.
  assert.match(top, /\*\*Every question this page puts to the founder is recorded before it is asked,\*\* with the `await` of the skill's gate, so that a session resuming tomorrow asks the same one\. His answer is written under `## Reviewed by the founder` of `LOOK\.md`, as he said it, and the stage is put back in work with the `begin` of step 1 of the skill, before the next step starts\. There are five such questions: a lens, the pick, a hybrid, the change to the project profile, and a fresh concept redrawn/);
  assert.match(kinds, /\*\*The same detailed screen for all:\*\* the screen of the chosen structure where the one job gets done, in its `default` state, in the product's main language, with every string exactly as `<package>\/05-detail\/strings\.json` has it\. A direction changes the paint, never the detail/);
  // Each named, with a thesis and a stated cost, and none shown without its cost.
  assert.match(kinds, /a \*\*name\*\* of two or three words that stick; a \*\*thesis\*\*, one sentence on what it is good at and for whom; and a \*\*stated cost\*\*, the weakness it accepts on purpose\. A direction with no stated cost goes back to its maker once, and is not shown without one\. You write none of the three/);
  assert.match(flat(read('pool/makers/visual-designer.md')), /\*\*When you are cast for a direction\*\* \(no design system, or a surface that leaves it on purpose\), your brief gives you a lens and one detailed screen\. Draw that screen in that direction, name the direction, and state its thesis and its cost/);
  // Palettes and pairings may be drawn from a design-data skill, as data.
  assert.match(kinds, /\*\*Palettes and pairings may be drawn from a design-data skill, when one is installed,\*\* as `ui-ux-pro-max`: the brief names it as a lookup\. It is data, never a verdict, and inside a design system it is not used/);
  assert.match(read('pool/makers/visual-designer.md'), /`ui-ux-pro-max`: palettes, pairings and styles as data\. Unused inside a design system/);
  assert.match(kinds, /Every value it chooses, a colour, a size, a space, a radius, a typeface, is kept as a custom property in one block at the top of the page: the pick becomes the token file from that block, and no value is ever read off a picture/);
  assert.match(kinds, /The makers are started in one message, each a fresh sub-agent on what its line of the cast sheet names, three at a time at most where they drive a browser\. None sees another's page/);
  // He picks from pictures, on one page with one question; the session picks none and draws none.
  const page = flat(section(direction, 'The pictures, the readers, the page'));
  assert.deepEqual(commandsOf(section(direction, 'The pictures, the readers, the page')), ['node <kit root>/scripts/shots.mjs <package>/06-look/directions --out <package>/06-look/directions --widths <primary>,<phone>',
    'node <kit root>/scripts/page.mjs <package>/06-look/directions.json --out <package>/06-look/directions.html']);
  inOrder(page, [/Every direction is an option, lettered in the alphabetical order of the names: its name is the title, its thesis and its cost the line/, /one question: which direction does this product take\?/,
    /\*\*If the readers could not tell them apart,\*\* that is a finding on the page, by seat\. You draw no further direction, and you mend none/, /record the question with the `await` of the skill's gate\. \*\*Stop: you do not pick\.\*\* He picks one, by its name/,
    /is drawn once more by a fresh maker of the picked direction\. He confirms it from its picture, one question, before anything becomes a token/,
    /If he takes none, no further direction is drawn on the same lenses: he names new ones, and the cast sheet changes with his yes/], 'the page of directions');
  assert.ok(nevers(text).includes('Never choose a variant or a direction'));
  // The pick becomes the tokens, written by a maker; the project profile is updated by a change he sees and approves, never silently.
  const pick = section(direction, 'The pick becomes the tokens');
  // Ruling R146: a maker writes the tokens; the change to the project profile is put to him first; the kit is rebuilt only after his yes.
  assert.deepEqual(boldSteps(pick).map(([, name]) => name), ['Write his pick', 'A maker writes the token file, never you', 'The project profile is updated by a change he sees and approves, never silently, and first',
    'Only after his yes is the project kit rebuilt on the new tokens,', 'Log it', 'Go on from step 3 of the skill']);
  assert.match(flat(pick), /A fresh `maker\.visual-designer`, handed the picked page, writes one CSS file of custom properties: every value of the page's block, none added and none rounded/);
  // A token file that is there is never written over: a rebrand writes a new file, and setup's copy of the real tokens stays.
  inOrder(flat(pick), [/That file is `<tokens>` for the rest of this design, and where it is written depends on what is there:/, /\*\*A project with no token file:\*\* `<kit dir>\/tokens\.css`/,
    /\*\*A project that has a design system, and takes a new direction:\*\* a new file beside it, named for the direction, as `<kit dir>\/tokens-quiet-ledger\.css`\. \*\*A token file that is there is never written over:\*\* setup's copy of the real tokens stays as it is/,
    /\*\*A surface that leaves the design system:\*\* `<package>\/06-look\/tokens\.css`/, /Show him the lines before you write one, and before the kit is touched/,
    // Who rebuilds it: a maker restyles the kit's classes from the direction's tokens, and the session draws and pictures it with the kit's scripts.
    /\*\*Only after his yes is the project kit rebuilt on the new tokens,\*\* by a maker and then by the kit's scripts\. A fresh `maker\.visual-designer`, handed the token file, `<kit dir>` and `kit\/KIT-CONTRACT\.md`, restyles the kit's classes from the picked direction's tokens: `<kit dir>\/kit\.css` imports the token file, each class of the contract takes its values from it, and none is added/,
    /Then you draw with the kit and take the pictures of `parts\.html`, by the two commands of steps 5 and 6 of `skills\/setup\/references\/project-kit\.md`\. He looks at the redrawn `parts\.html` as he did at setup's gate: what he corrects goes back to the maker, and is pictured again/], 'the tokens, the project profile, then the kit');
  assert.deepEqual(headings(projectKit()).filter(heading => /^[56]\./.test(heading)), ['5. Draw with it, once', '6. Picture it, for the founder\'s look']);
  assert.match(flat(projectKit()), /## 4\. Restyle each class to look like the project's default part/);
  assert.doesNotMatch(flat(pick), /steps 3 to 6/);
  assert.match(flat(projectKit()), /Then the pictures go to the founder with the project profile, at the gate/);
  assert.match(flat(projectKit()), /Look will choose a direction, and the kit is rebuilt on the tokens that direction brings/);
  inOrder(flat(pick), [/Show him the lines before you write one, and before the kit is touched: `tokens`, naming the token file; and, under `## Design system`, the direction's name, its thesis and its cost, the token file by its path, and the package and the day it was picked in/,
    /One question, about one thing: may the project profile be changed so\?/, /On his yes, write those lines into `<packages>\/PROFILE\.md`, and his words under `## Reviewed by the founder` of `LOOK\.md`/], 'the change to the project profile');
  assert.match(flat(read('templates/project/PROFILE.md')), /"None yet" while there is none: Look then runs once as a direction, and writes this section and `tokens`/);
  assert.match(flat(read(`templates/package/${ARTEFACT.look}`)), /For a direction: each one's name, thesis and stated cost; the one he picked; the token file the pick became/);
  assert.match(flat(section(text, 'Never')), /\*\*Never change the project profile silently\.\*\* He sees and approves each line first/);
  assert.match(flat(pick), /\*\*Go on from step 3 of the skill\.\*\* One visual designer now draws every screen on `<tokens>`\. The picked direction's page is a picture he chose from, never a screen of record/);
  // A fresh concept that won as a whole is the direction, already picked, and still not handed off.
  const won = flat(section(direction, 'When a fresh concept won as a whole'));
  assert.match(won, /The third outcome of a fresh pass is a change of direction for this surface, and its direction is already picked: no other is drawn/);
  assert.match(won, /copies none of the fresh screen's code or its values, names the direction and states its thesis and its cost/);
  assert.match(won, /He confirms it from the picture: one page, one question, recorded as every question of this page is/);
  assert.match(won, /The screens already drawn on the system are set aside, not deleted: move them, with their pictures and their measures, into `<package>\/06-look\/earlier\/`\. Nothing there is handed off/);
});

test('look: every command is one its script takes, in the order of the stage; the gate is on the finished screens beside their measures, one page and one question', () => {
  const text = stageSkill('look');
  const commands = stageCommands('look');
  for (const command of commands) {
    const [, script, given] = /^node <kit root>\/scripts\/([a-z]+)\.mjs (.+)$/.exec(command) ?? [];
    assert.ok(script, command);
    assert.ok(takenBy(script, given), command);
  }
  assert.deepEqual([...new Set(commands.map(command => /scripts\/([a-z]+)\.mjs/.exec(command)[1]))].sort(), ['accept', 'deal', 'describe', 'page', 'shots', 'state']);
  const state = commands.filter(command => command.startsWith('node <kit root>/scripts/state.mjs ')).map(command => words(command).slice(2));
  assert.deepEqual([...new Set(state.map(([verb]) => verb))].sort(), ['await', 'begin', 'stamp', 'status']);
  for (const [verb, pkg, stage] of state.filter(([verb]) => ['begin', 'await', 'stamp'].includes(verb))) assert.deepEqual([pkg, stage], ['<package>', 'look'], verb);
  assert.deepEqual(fencedLines(text), [
    'node <kit root>/scripts/state.mjs begin <package> look',
    'node <kit root>/scripts/shots.mjs <package>/06-look/screens --out <package>/06-look/shots --widths <primary>,<phone> --themes <themes>',
    'node <kit root>/scripts/accept.mjs prototype <package>/06-look/checks.json --root <package>/06-look/screens --out <package>/06-look/results.json',
    'node <kit root>/scripts/page.mjs <package>/06-look/decision.json --out <package>/06-look/decision.html',
    'node <kit root>/scripts/state.mjs await <package> look --question "<the one question>"',
    'node <kit root>/scripts/state.mjs stamp <package> look --words "<the founder\'s words>"',
  ]);
  // The outside engine is reached in one place, the fresh pass, and nowhere in SKILL.md is a command that sends anything.
  assert.ok(!fencedLines(text).some(line => line.includes('describe.mjs')));
  assert.deepEqual(Object.entries(folderOf('look')).filter(([, body]) => body.includes('describe.mjs')).map(([file]) => file), ['references/fresh.md']);
  for (const flag of NEVER_PASSED) assert.ok(commands.every(command => !words(command).some(word => word.split('=')[0] === flag)), flag);
  // A shared machine: shots and accept one after the other, three browser-driving commands or seats at most, no process stopped by name.
  assert.match(flat(section(text, 'Never')), /\*\*Never stop a process by name or by pattern,\*\* or start a browser other than through the kit's scripts and seats: three browser-driving commands or seats at once, at most/);
  assert.match(KIT.usage('scripts/shots.mjs'), /\[--themes light,dark\]/);
  // The decision page: a pick among variants, or an approval of one proposal; either way one page and one question.
  const page = stepOf(section(text, 'Steps'), 'Build the decision page');
  // What LOOK.md holds of the measures is what measures.md holds at the stamp: copied, and copied again after any later redraw.
  assert.match(page, /Fill `LOOK\.md` as its template says: "Measured values" and "Named extensions" are copied from `measures\.md`, each section whole, and copied again after any later redraw, before the stamp; "What the look decides" is copied from the visual designer's reply, never written by you/);
  assert.match(page, /With variants, in the shape of `templates\/outputs\/decision\.json`: each variant an option, by letter, its line what it buys and what it costs\. With one proposal, in the shape of `templates\/outputs\/decision-approve\.json`: the final screens as its one option/);
  assert.match(page, /the pictures of each screen's default state, named from the page, the phone width first, as `shots\/today-default-en-390-light\.png`; one line for each seat; each open finding under `findings`, by seat, with what the visual designer could not draw; one recommendation, resting on the reads; one question\. Its identity is as `status` prints it, at stage 7 of 9/);
  assert.equal(STAGES.indexOf('look') + 1, 7);
  // The gate: the finished screens beside their measures; he picks or approves; nothing goes on without his words.
  const gate = flat(section(text, 'Gate'));
  inOrder(gate, [/^ \*\*He picks, or approves, from pictures\.\*\* Put `<package>\/06-look\/decision\.html` in front of him, and `<package>\/06-look\/measures\.md` with it: the finished screens beside their measures/,
    /Record the one question, so that a session resuming tomorrow asks the same/, /state\.mjs await <package> look --question/,
    /One question, about one thing\. With variants: which variant goes on to Handoff\? With one proposal: do you approve these screens for Handoff\? \*\*Stop: you neither pick nor approve, and you go no further without his words\.\*\*/,
    /\*\*A variant he picks that the screens are not drawn in\*\* is drawn by a fresh visual designer, handed his pick\. Step 5 is run again, and he sees the pictures and the table before the stamp/,
    /\*\*Write what he says under `## Reviewed by the founder`:\*\* what he picked or corrected, and the words he approved it with, as he said them\. A correction goes to a fresh visual designer, handed his words, and step 5 is run again\. You redraw nothing yourself/,
    /\*\*Write the carry list,\*\* `## Carry`:/, /a `- detail@<version>#<slug>` line for "Rules", "Edge cases", "Data map", "Dependencies", "Strings", "What the readers found" and "Accepted deviations"/,
    /a `- source:<path>` line for the screens' folder, the pictures' folder, the reads' folder, `measures\.md`, `checks\.json`, `results\.json` and `<tokens>`/,
    /\*\*Stamp it,\*\* in the words he picked or approved with/, /state\.mjs stamp <package> look --words/, /Then append the decision to the package's `DECISIONS\.md`, each named extension and each accepted deviation with it, and ask the state what is next, as step 9 of the loop says/], 'the gate');
  // A page of the stage that is not its gate's records its question too: a session that resumes takes his answer where it was asked.
  assert.match(stepOf(section(text, 'Steps'), 'Begin'), /A stage that is awaiting the founder is not begun again: take his answer to "Gate", or to the reference that asked\. Otherwise mark it in work:/);
  for (const name of ['fresh.md', 'direction.md']) assert.match(flat(stageRef('look', name)), /record the question with the `await` of the skill's gate/, name);
  for (const name of ['fresh.md', 'direction.md']) assert.match(flat(stageRef('look', name)), /put the stage back in work with the `begin` of step 1 of the skill|Put the stage back in work with the `begin` of step 1 of the skill/, name);
  assert.match(flat(section(text, 'Never')), /\*\*Never choose a variant or a direction\.\*\* Your one recommendation rests on the reads/);
  // The rule refuses something real: the same words without what the form needs are not taken.
  for (const [script, wrong] of [['accept', 'prototype <package>/06-look/checks.json --out <package>/06-look/results.json'], ['accept', '<package>/06-look/checks.json --root <package>/06-look/screens --out <package>/06-look/results.json'],
    ['shots', '<package>/06-look/screens --out <package>/06-look/shots --themes <themes>'], ['describe', '--text --provider <openai|gemini> --model <id> --brief <package>/06-look/BRIEF-fresh.md --out <package>/06-look/fresh/<name>.html'],
    ['page', '<package>/06-look/beside.json']]) assert.ok(!takenBy(script, wrong), `${script}.mjs does not take: ${wrong}`);
});

test('detail and look: the other forms — an adjustment keeps what changes and no more, a flow goes surface by surface and is stamped once, and a correction is one change and one nod', () => {
  for (const [name, title, repeats, once] of [
    ['detail', 'Detail', /\*\*What repeats for each surface:\*\* steps 3 to 8 of the skill\. The three makers in their order, the pictures, the readers, the one fix round and the one re-read\. A surface is finished before the next one begins, and each has its one fix round/,
      /\*\*What is done once, for the whole flow:\*\* the questions of step 4 that touch more than one surface; the words' page, where the kind asks for one; the decision page, with the pictures of each surface among its option's and the open findings of all of them; the gate; the carry list; the stamp\. He approves the flow, not a surface/],
    ['look', 'Look', /\*\*What repeats for each surface:\*\* steps 4, 5, 7 and 8 of the skill\. One visual designer, a fresh sub-agent for each surface, handed the screens of the surfaces already drawn so that the flow reads as one; the pictures and the measures; the readers; the one fix round and the one re-read/,
      /\*\*What is done once, for the whole flow:\*\* the mode, and a direction when there is none; a fresh pass, on the one screen that carries the idea; the variants' axis, which holds on every surface; the decision page, with the pictures of each surface among its option's; the gate; the carry list; the stamp\. He picks or approves the flow, not a surface/],
  ]) {
    const forms = stageRef(name, 'forms.md');
    assert.deepEqual(headings(forms), ['Routed `short`: an adjustment', 'Sized `flow`: surface by surface'], name);
    const short = flat(section(forms, 'Routed `short`: an adjustment'));
    assert.match(short, new RegExp(`^ ${title} is what changes, and no more\\.`), name);
    assert.match(short, new RegExp(`\\*\\*Every other heading of \`${ARTEFACT[name].split('/')[1]}\` says "Unchanged by this adjustment"\\.\\*\\*`), name);
    assert.match(short, /\*\*A stage the route skips is left out of `built-from` and of the carry list[.,]\*\*/, name);
    // With Structure skipped there is no chosen proposal to hand over.
    assert.match(short, /\*\*With Structure skipped there is no chosen proposal, and no hand-over names `<chosen>`\.\*\* A seat takes the structure from what it is handed besides: the states and the rules/, name);
    // A flow: what repeats for each surface, what every surface writes into, and what is done and stamped once.
    const flow = flat(section(forms, 'Sized `flow`: surface by surface'));
    assert.match(flow, repeats, name);
    assert.match(flow, once, name);
    assert.match(flow, new RegExp(`\\*\\*A reader's file takes the surface's name\\*\\* after its seat, as \`<package>/${ARTEFACT[name].split('/')[0]}/reads/<seat>-<surface>\\.md\``), name);
  }
  assert.match(flat(reference('routes.md')), /Structure treats the flow as one thing; Detail and Look go surface by surface/);
  const detailShort = flat(section(stageRef('detail', 'forms.md'), 'Routed `short`: an adjustment'));
  assert.match(detailShort, /\*\*A stage the route skips is left out of `built-from` and of the carry list,\*\* and so is the cast sheet's table for it: the sheet has none\. Where it skips Structure, the stage before this one is Cast: you read `<package>\/03-cast\.md`, and what its carry list names/);
  assert.match(flat(read('templates/package/03-cast.md')), /Delete the table of a stage the route skips/);
  // With no prototype builder cast there is no prototype and no picture, and the carry list names neither.
  assert.match(detailShort, /\*\*With no prototype builder cast, no page is generated and none is photographed\.\*\* Step 5 of the skill is not run, the readers are handed the changed rows and strings, and the decision page gives each changed row and string as its option's line\. The carry list then has no line for the prototype's folder or the pictures' folder: neither exists/);
  assert.ok(!kitCards()['maker.prototype-builder'].presets.includes('adjustment'));
  assert.match(flat(section(stageRef('look', 'forms.md'), 'Routed `short`: an adjustment')), /\*\*With no prototype builder cast at Detail there is no prototype:\*\* no hand-over names its folder or its pictures/);
  assert.match(flat(section(stageRef('detail', 'forms.md'), 'Sized `flow`: surface by surface')), /\*\*What every surface writes into, and is one for the flow:\*\* `states\.md`, `strings\.json`, so that one word stays one thing across the surfaces, and `prototype\/` with its one index\. In `DETAIL\.md`, a `### <surface>` under each heading that differs from one surface to the next/);

  // A correction at Detail: no seat, the one thing changed as "is → becomes", the two pictures in their folder, one nod as the gate.
  const correction = stageRef('detail', 'correction.md');
  assert.deepEqual(headings(correction), ['What does not happen', 'Steps', 'The gate']);
  const top = flat(correction.slice(0, correction.indexOf('\n## ')));
  assert.match(top, /A design sized `correction` is one wrong thing put right: a label, a token or a spacing value\. Its route runs four stages, each in its short form, and this page is Detail's\. It costs one nod, and the nod is asked here: Frame stated its line and asked nothing\./);
  assert.match(top, /is the conductor's: `skills\/design\/references\/routes\.md`, under "A correction"/);
  assert.deepEqual(STAGES.filter(stage => routeFor('correction')[stage] === 'short'), ['frame', 'detail', 'handoff', 'acceptance']);
  const not = flat(section(correction, 'What does not happen'));
  assert.match(not, /\*\*No seat is cast\.\*\* No maker, no judge, no audience and no brief: none of the skill's steps 3 to 8 is run/);
  assert.match(not, /\*\*If it turns out to touch more\*\* than a label, a token or a spacing value \(a state, the structure, another surface\), stop, say so to the founder, and resize/);
  assert.match(flat(section(reference('routes.md'), 'A correction')), /\*\*If it turns out to touch more\*\* than a label, a token or a spacing value \(a state, the structure, another surface\), stop, say so, and resize/);
  const steps = section(correction, 'Steps');
  assert.deepEqual(boldSteps(steps).map(([, name]) => name), ['Begin,', 'Copy the template', 'Write the one thing changed, as "is → becomes",', 'Keep the before-and-after picture in `<package>/05-detail/correction/`', 'Build the page']);
  // Built from the frame alone: no other stage of its route ran before it.
  assert.match(flat(steps), /write `built-from` as the route gives it: the frame alone, `\[frame@<version>\]`, since no other stage ran before this one/);
  assert.match(flat(steps), /what it is today, what it becomes, and where, by its screen, its element and the file that holds it\. As: the booking action reads "Reserve" → "Book room", on today, in the free rooms list\. Every other heading says "Unchanged by this correction"/);
  assert.deepEqual(commandsOf(correction), ['node <kit root>/scripts/shots.mjs <package>/05-detail/correction/before.html <package>/05-detail/correction/after.html --out <package>/05-detail/correction --widths <primary>',
    'node <kit root>/scripts/state.mjs reopen <package> frame --reason "<his words>"']);
  // The one size where the session that conducts may also do the work, and only after his nod.
  assert.match(flat(steps), /You make these two yourself: a correction is the one size where the session that conducts may also do the work/);
  assert.match(flat(section(reference('routes.md'), 'A correction')), /It is the one size where the session that conducts may also do the work/);
  assert.match(flat(steps), /one option, its two pictures named from the page, the one before first, as `correction\/before-1280-light\.png`, and its line the "is → becomes" of step 3; `"seats": \[\]`, since no seat read it; one recommendation, with its one sentence of reason; one question\. Its identity is as `status` prints it, at the stage its route has it at: 2 of 4/);
  assert.match(KIT.usage('scripts/page.mjs'), /one line per\s+seat/);
  // The page's data keeps its list of seats, empty: without the key the page is refused.
  assert.match(read('scripts/page.mjs'), /'a list of seats, empty when no seat read'/);
  const gate = flat(section(correction, 'The gate'));
  inOrder(gate, [/^ \*\*One nod\.\*\* Put the page in front of him, and record the question with the `await` of the skill's gate\. One question, about one thing: may this be changed so\? \*\*Stop: nothing is changed in the product before his nod\.\*\* Frame's line goes beside the page, as `<package>\/00-frame\.md` has it: the request, the three values and the route\. His nod is on both\./,
    /\*\*If he disagrees with the line itself,\*\* that answer is not a nod: it is not a correction, or not of this kind\. Write what he said under `## Reviewed by the founder`\. If he names a larger size, resize the design to it, as the conductor's "Resuming" says\. Then reopen Frame, which closes this question and puts Detail back in work:/,
    /state\.mjs reopen <package> frame --reason "<his words>"/,
    /Then the design is framed again, by Frame's skill\. If what he disputes is which screen it is, or what kind of thing, this package is left as it stands, since its kind and its foundation were fixed when it was made, and the design is framed anew under a new name\. Nothing is changed in the product\./,
    /\*\*Write the one-paragraph record\*\* under `## Reviewed by the founder`: what was wrong, what it is now, where, and his words, as he said them/,
    /\*\*Write the carry list:\*\* the lines of the frame's own carry list, as they are, and a `- source:<path>` line, from the project's root, for each of the two pictures/,
    /\*\*Stamp it,\*\* with the `stamp` of the skill's gate, in the words of his nod/, /\*\*After his nod, the session that conducts may make the change itself\.\*\* That is the build: Handoff and Acceptance, each in its short form, say how it is handed over and checked/], 'the gate of a correction');
  // The skill's own Never keeps the exception: nothing is the session's to write but a correction, after his nod.
  assert.match(flat(section(stageSkill('detail'), 'Never')), /\*\*Never write a state, a rule, a string or a page yourself,\*\* and never mend one\. A maker does: only a design sized `correction` is yours to apply, after his nod/);
  assert.match(flat(conductor()), /except, in a design sized `correction`, to apply it after his nod/);
});

test('Detail and Look run as written: their own commands on a package Structure has stamped, the words asked before the prototype, the measures taken by the kit\'s script, each carry list as its skill gives it, and nothing of a fresh pass carried on', () => {
  const project = join(scratchRoot, 'a clinic at detail');
  const pkg = join(project, 'design', 'today');
  mkdirSync(project, { recursive: true });
  const FILL = {
    '<kit root>/': fileURLToPath(root), '<packages>': 'design', '<package>': 'design/today', '<kit dir>': 'design/kit', '<primary>': '1280', '<phone>': '390', '<themes>': 'light,dark',
    '<the founder\'s words>': 'aprobado, adelante', '<the one question>': 'Do you approve this prototype for Look?',
  };
  // A command as a skill writes it, run from the project's root with each placeholder filled.
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
  // The one command of a stage's folder that starts with these words.
  const commandOf = (name, start) => {
    const found = [...new Set(stageCommands(name))].filter(command => command.startsWith(`node <kit root>/scripts/${start}`));
    assert.equal(found.length, 1, `${name}: one command that starts ${start}`);
    return found[0];
  };
  const visible = name => !name.startsWith('.fuse_hidden');
  const STATE = 'node <kit root>/scripts/state.mjs';
  const slugOf = (name, heading) => run(commandOf(name, 'state.mjs slug'), { '<heading text>': heading });
  // An output of the package: its template, with what it is built from and its carry list.
  const write = (name, inputs, carry = [], base = pkg) => {
    const text = read(`templates/package/${ARTEFACT[name]}`);
    assert.ok(text.endsWith('\n## Carry\n') && text.includes('\nbuilt-from: []\n'), name);
    mkdirSync(join(base, ARTEFACT[name], '..'), { recursive: true });
    writeFileSync(join(base, ARTEFACT[name]), `${text.replace('built-from: []', `built-from: ${inputs}`)}\n${carry.join('\n')}\n`);
  };
  const STAMPED = name => new RegExp(`^stamped ${name} approved at version 1 on \\d{4}-\\d\\d-\\d\\d$`);
  // What a stage's output is built from, as its skill gives it, each stage at the version `status` prints.
  const standingAt = name => {
    const [, builtFrom] = /`built-from: (\[[^\]]*\])`/.exec(section(stageSkill(name), 'Writes'));
    const page = run(commandOf(name, 'state.mjs status'));
    return builtFrom.replace(/([a-z]+)@<version>/g, (_, stage) => `${stage}@${new RegExp(`^\\| ${stage} \\| \\w+ \\| [\\w-]+ \\| (\\d+) \\|`, 'm').exec(page)[1]}`);
  };
  const refusedFor = (name, stages) => {
    const refused = exec(commandOf(name, 'state.mjs stamp'));
    assert.deepEqual([refused.status, refused.stdout], [1, ''], name);
    assert.match(refused.stderr, new RegExp(`^${name} cannot be stamped:\\n`), name);
    for (const stage of stages) assert.match(refused.stderr, new RegExp(`^- "- ${stage}@1#[\\w-]+" names ${stage}, which ${name} is not built from; add it to built-from$`, 'm'), `${name}: ${stage}`);
    return refused.stderr.trimEnd().split('\n').length - 1;
  };

  // The package as Structure leaves it, for a design whose words are the product: five outputs approved, the chosen structure
  // carrying on what the cast sheet carried, the tables of the stages still to run, the chosen file, the pick and one fresh mark.
  run(`${STATE} init <package> --design today --kind first-run --foundation new-surface --size surface`);
  const castCarry = [`- intent@1#${slug('Tasks for the audience')}`, ...['What the product can show and do', 'Constraints', 'The founder\'s own words'].map(heading => `- context@1#${slug(heading)}`), '- source:design/pool/persons/desk-cover.md'];
  const chosenCarry = [...castCarry, ...['Detail', 'Look', 'Handoff', 'Acceptance', 'Blind rules', 'Fresh pass'].map(heading => `- cast@1#${slug(heading)}`),
    '- source:design/today/04-structure/board/B.json', '- source:design/today/04-structure/board/B-390-light.png', `- source:design/today/04-structure/${PICK}`, '- source:design/today/04-structure/fresh/today-1.png'];
  for (const [name, inputs, carry] of [['frame', '[]'], ['context', '[frame@1]'], ['intent', '[context@1]'], ['cast', '[intent@1, context@1]', castCarry], ['structure', '[cast@1, intent@1, context@1]', chosenCarry]]) {
    run(`${STATE} begin <package> ${name}`);
    write(name, inputs, carry);
    assert.match(run(`${STATE} stamp <package> ${name} --words "sí, adelante"`), STAMPED(name));
  }
  assert.equal(run(`${STATE} next <package>`), 'detail');

  // Detail, step 1 and step 2: begun, the three templates copied, the output built from the four stages its carry list names.
  assert.equal(run(commandOf('detail', 'state.mjs begin')), 'detail is in work');
  assert.match(run(commandOf('detail', 'state.mjs status')), /^- Kind: first-run$/m);
  assert.equal(standingAt('detail'), '[structure@1, cast@1, intent@1, context@1]');
  const detail = join(pkg, '05-detail');
  write('detail', standingAt('detail'));
  // Step 3, stood in for: the states table and the strings as their templates, and the prototype as its builder names its pages,
  // the fixture's, with the kit's stylesheet beside them.
  for (const file of ['states.md', 'strings.json']) copyFileSync(at(`templates/package/05-detail/${file}`), join(detail, file));
  const PAGES = ['today-default-en', 'today-default-es', 'today-empty-en'];
  const pagesInto = folder => {
    mkdirSync(folder);
    for (const file of [...PAGES.map(page => `${page}.html`), 'kit.css']) copyFileSync(at(`tests/fixtures/prototype/${file}`), join(folder, file));
  };
  pagesInto(join(detail, 'prototype'));
  // Step 5: the pictures are the picture script's to take, and its own tests drive the browser: here each is a stand-in, under
  // the name the script gives it. The picture the skill names as its example is one of them.
  assert.equal(commandOf('detail', 'shots.mjs <package>/05-detail/prototype'), 'node <kit root>/scripts/shots.mjs <package>/05-detail/prototype --out <package>/05-detail/shots --widths <primary>,<phone>');
  const picturesInto = (folder, themes) => {
    mkdirSync(folder);
    for (const page of PAGES) for (const width of [FILL['<phone>'], FILL['<primary>']]) for (const theme of themes) writeFileSync(join(folder, `${page}-${width}-${theme}.png`), '');
  };
  picturesInto(join(detail, 'shots'), ['light']);
  const exampleOf = name => /as `(shots\/[\w-]+\.png)`/.exec(flat(section(stageSkill(name), 'Steps')))[1];
  assert.ok(existsSync(join(detail, exampleOf('detail'))), exampleOf('detail'));
  // The gate of a first-run design: the words are asked first, on a page of their own; then the prototype's page. The second
  // question takes the place of the first, so that one question is open, and it is the one a resuming session must ask.
  const approve = JSON.parse(read('templates/outputs/decision-approve.json'));
  const identity = { ...approve.identity, kind: 'first-run' };
  const wordsPage = { identity, options: [{ letter: 'A', title: 'The words, after one fix round', line: 'Fourteen strings in each of English and Spanish, in strings.json.' }],
    seats: [{ seat: 'judge.words', line: 'Reads right with changes: the empty state still says "No availability", which nobody at a front desk says.', option: 'A' }],
    recommendation: { option: 'A', reason: 'Approve the words once the empty state says it as she would.' }, question: 'Do you approve these words?' };
  writeFileSync(join(detail, 'words.json'), JSON.stringify(wordsPage, null, 2));
  assert.match(run(commandOf('detail', 'page.mjs <package>/05-detail/words.json')), /^built \S.*words\.html: 1 option, .*one question$/);
  assert.equal(run(commandOf('detail', 'state.mjs await'), { '<the one question>': wordsPage.question }), 'detail awaits the founder');
  assert.match(run(commandOf('detail', 'state.mjs status')), /^## Open question\n\ndetail: Do you approve these words\?$/m);
  writeFileSync(join(detail, 'decision.json'), JSON.stringify({ ...approve, identity, options: [{ ...approve.options[0], images: [exampleOf('detail'), 'shots/today-default-en-1280-light.png'] }] }, null, 2));
  assert.match(run(commandOf('detail', 'page.mjs <package>/05-detail/decision.json')), /^built \S.*decision\.html: 1 option, 2 seats, 2 open findings, 1 accepted deviation, one question$/);
  assert.equal(run(commandOf('detail', 'state.mjs await')), 'detail awaits the founder');
  const asked = run(commandOf('detail', 'state.mjs status'));
  assert.match(asked, /^## Open question\n\ndetail: Do you approve this prototype for Look\?$/m);
  assert.doesNotMatch(asked, /these words/);
  // The carry list the skill gives: the chosen structure's own lines, two sections of it, the stage's files, and the package's
  // DECISIONS.md, where his gallery marks are. Built from the structure alone, the stamp refuses each line it cannot carry.
  const detailCarry = [...chosenCarry, `- cast@1#${slugOf('detail', 'Structure')}`, ...['The structure', 'What it is deliberately bad at', 'What the readers found'].map(heading => `- structure@1#${slugOf('detail', heading)}`), '- source:design/today/04-structure/reads',
    ...['states.md', 'strings.json', 'prototype', 'shots', 'reads'].map(file => `- source:design/today/05-detail/${file}`), '- source:design/today/DECISIONS.md'];
  assert.ok(detailCarry.includes('- structure@1#the-structure') && detailCarry.includes('- context@1#the-founder-s-own-words'));
  // What the handoff's coverage page needs is carried: what Structure's readers found, their ledgers, and the cast sheet's table for every stage.
  for (const line of ['- structure@1#what-the-readers-found', '- source:design/today/04-structure/reads', '- cast@1#structure', '- cast@1#detail', '- cast@1#look', '- cast@1#handoff', '- cast@1#acceptance']) assert.ok(detailCarry.includes(line), line);
  // The chosen structure itself carries the tables of the stages still to run, and not its own.
  assert.ok(!chosenCarry.includes('- cast@1#structure'));
  write('detail', '[structure@1]', detailCarry);
  assert.equal(refusedFor('detail', ['cast', 'intent', 'context']), detailCarry.filter(line => /^- (?:cast|intent|context)@/.test(line)).length);
  write('detail', standingAt('detail'), detailCarry);
  assert.match(run(commandOf('detail', 'state.mjs stamp')), STAMPED('detail'));
  assert.equal(run(`${STATE} validate <package>`), 'ok');
  assert.equal(run(`${STATE} next <package>`), 'look');
  assert.doesNotMatch(run(commandOf('detail', 'state.mjs status')), /Do you approve/);

  // Look, step 1 and step 2: begun, and built from the five stages its carry list names.
  assert.equal(run(commandOf('look', 'state.mjs begin')), 'look is in work');
  assert.match(run(commandOf('look', 'state.mjs status')), /^- Foundation: new-surface\n- Size: surface$/m);
  assert.equal(standingAt('look'), '[detail@1, structure@1, cast@1, intent@1, context@1]');
  const look = join(pkg, '06-look');
  write('look', standingAt('look'));
  // Step 4, stood in for: the final screens, and the checks the visual designer's table rests on.
  pagesInto(join(look, 'screens'));
  const { checks } = JSON.parse(read('tests/fixtures/acceptance.json'));
  copyFileSync(at('tests/fixtures/acceptance.json'), join(look, 'checks.json'));
  // Step 5: measured once, through the kit's own script, by the command the skill gives. The pictures stand in.
  assert.equal(commandOf('look', 'shots.mjs <package>/06-look/screens'), 'node <kit root>/scripts/shots.mjs <package>/06-look/screens --out <package>/06-look/shots --widths <primary>,<phone> --themes <themes>');
  picturesInto(join(look, 'shots'), FILL['<themes>'].split(','));
  assert.ok(existsSync(join(look, exampleOf('look'))), exampleOf('look'));
  assert.match(run(commandOf('look', 'accept.mjs prototype <package>/06-look/checks.json')), new RegExp(`^${checks.length} checks: 0 failed, ${checks.length} passed; results in \\S.*results\\.json$`));
  const results = JSON.parse(readFileSync(join(look, 'results.json'), 'utf8'));
  assert.deepEqual(results.map(result => result.id), checks.map(check => check.id));
  // The table of measured values is written from those results, never by eye: each contrast and each size is a result's `actual`,
  // at its width and in its theme.
  const measured = results.filter(result => ['contrast', 'min-size'].includes(checks.find(check => check.id === result.id).type));
  assert.deepEqual(measured.map(({ id, width, theme }) => [id, width, theme]), [['book-target-size', 390, 'light'], ['list-contrast-dark', 1280, 'dark']]);
  const [size, contrast] = measured.map(result => result.actual);
  assert.ok(size.width >= 44 && size.height >= 44 && contrast >= 4.5, JSON.stringify([size, contrast]));
  const rows = [`| \`book-action\` | its target | ${size.width} × ${size.height} | — | 390 | light |`, `| \`room-list\` | its contrast on its ground | ${contrast} | — | 1280 | dark |`];
  const [, tableHead] = /(\| Element \|[^\n]+\n\|[-|]+\n)/.exec(read(`templates/package/${ARTEFACT.look}`));
  writeFileSync(join(look, 'measures.md'), `## Measured values\n\n${tableHead}${rows.join('\n')}\n\n## Named extensions\n\nNone.\n`);
  // With a fresh pass: the fresh screen is kept in fresh/ as it came and pictured there. The outside engine's own command is
  // never run here: it would reach a provider.
  mkdirSync(join(look, 'fresh'));
  writeFileSync(join(look, 'fresh', 'outside-openai.html'), '<!doctype html>\n<title>Today</title>\n');
  writeFileSync(join(look, 'fresh', 'outside-openai-1280-light.png'), 'the fresh screen');
  const [, system, came] = /as `(shots\/[\w-]+\.png)` and `(fresh\/[\w-]+\.png)`/.exec(flat(stageRef('look', 'fresh.md')));
  writeFileSync(join(look, system), 'the system version');
  assert.ok(existsSync(join(look, came)), came);
  // Rulings R142 and R147: the comparison is blind. The kit's script, by the command fresh.md gives, deals the letters itself,
  // copies the two pictures into beside/ under them, writes which is which beside that folder and never in it, prints the count
  // and the letters alone, and deals once. Its own tests hold the shuffle, the one time on every copy and each refusal.
  const dealing = commandOf('look', 'deal.mjs <package>/06-look/shots');
  const pictures = { '<page>': 'today-default-en', '<name>': 'outside-openai' };
  assert.equal(run(dealing, pictures), 'dealt 2 versions into design/today/06-look/beside: A, B');
  assert.deepEqual(readdirSync(join(look, 'beside')).filter(visible).sort(), ['A.png', 'B.png']);
  assert.equal(new Set(['A', 'B'].map(letter => statSync(join(look, 'beside', `${letter}.png`)).mtimeMs)).size, 1, 'one time on both copies');
  assert.ok(existsSync(join(look, 'BESIDE.sealed.json')) && !existsSync(join(look, 'beside', 'BESIDE.sealed.json')), 'the sealed file is beside the folder, never in it');
  const twice = exec(dealing, pictures);
  assert.deepEqual([twice.status, twice.stdout], [1, '']);
  assert.match(twice.stderr, /^cannot deal into design\/today\/06-look\/beside: it is already there\. Letters are dealt once/);
  // The first question, ruling R145: the page shows the letters and nothing that says which is the system's; the question is
  // recorded, and his answer puts the stage back in work.
  const [, lettered] = /as `(beside\/[\w-]+\.png)`/.exec(flat(section(stageRef('look', 'fresh.md'), '7. The first question: what he would keep')));
  assert.ok(existsSync(join(look, lettered)), lettered);
  const beside = { identity: { ...identity, stage: STAGES.indexOf('look') + 1 },
    options: ['A', 'B'].map(letter => ({ letter, title: `Version ${letter}`, line: 'Today, free rooms first.', images: [`beside/${letter}.png`] })),
    seats: [{ seat: 'judge.truth', line: 'B offers a waiting list, which the product does not have.', option: 'B' }, { seat: 'audience.task-reader', line: 'She found a free room faster on A, by a slight gap.', option: 'A' }],
    recommendation: { option: 'A', reason: 'The task reader and the profile judge both rank A first.' }, question: 'What would you keep from each of these?' };
  assert.doesNotMatch(JSON.stringify(beside), /fresh|system|outside|shots\//);
  writeFileSync(join(look, 'beside.json'), JSON.stringify(beside, null, 2));
  assert.match(run(commandOf('look', 'page.mjs <package>/06-look/beside.json')), /^built \S.*beside\.html: 2 options, 2 seats, one question$/);
  assert.doesNotMatch(readFileSync(join(look, 'beside.html'), 'utf8'), /outside-openai|shots\//);
  assert.equal(run(commandOf('look', 'state.mjs await'), { '<the one question>': beside.question }), 'look awaits the founder');
  assert.equal(run(commandOf('look', 'state.mjs begin')), 'look is in work');
  // His first answer written, the sealed file is opened, by the one command that opens it: each letter with its source.
  const opened = run(commandOf('look', 'deal.mjs open')).split('\n').map(line => line.split('  '));
  assert.deepEqual(opened.map(([letter]) => letter), ['A', 'B']);
  assert.deepEqual(opened.map(([, source]) => source).sort(), [`design/today/06-look/${came}`, `design/today/06-look/${system}`].sort());
  for (const [letter, source] of opened) assert.equal(readFileSync(join(look, 'beside', `${letter}.png`), 'utf8'), readFileSync(join(project, source), 'utf8'), letter);
  const was = Object.fromEntries(opened.map(([letter, source]) => [source.endsWith(system) ? 'system' : 'fresh', letter]));
  // The second question: the page letters its own options, the system version first, whatever its beside letter was; each line
  // that was written by a beside letter names the version now, with that letter after it.
  const borrow = { identity: beside.identity,
    options: [{ letter: 'A', title: 'The system version', line: `Today, free rooms first, on the clinic's own tokens (was ${was.system}).`, images: [system] },
      { letter: 'B', title: 'Fresh: outside-openai', line: `Taking it whole is a change of direction for this surface: Look runs again as a direction, and the screens drawn on the system are set aside (was ${was.fresh}).`, images: [came] }],
    seats: [{ seat: 'judge.truth', line: `The fresh screen (was ${was.fresh}) offers a waiting list, which the product does not have.`, option: 'B' }],
    findings: [{ seat: 'judge.system-fidelity', line: `The amber edge on a room about to free up, which he marked on the fresh screen (was ${was.fresh}): the system has no token for it, and it would enter as one new colour token.` }],
    recommendation: { option: 'A', reason: 'The reads rank the system version first, and the one thing he marked costs one token.' }, question: 'Which is it: nothing to borrow, named things to borrow, or the fresh concept as a whole?' };
  for (const line of [...borrow.options, ...borrow.seats, ...borrow.findings].map(entry => entry.line)) assert.match(line, /\(was [AB]\)/, line);
  writeFileSync(join(look, 'borrow.json'), JSON.stringify(borrow, null, 2));
  assert.match(run(commandOf('look', 'page.mjs <package>/06-look/borrow.json')), /^built \S.*borrow\.html: 2 options, 1 seat, 1 open finding, one question$/);
  assert.equal(run(commandOf('look', 'state.mjs await'), { '<the one question>': borrow.question }), 'look awaits the founder');
  assert.match(run(commandOf('look', 'state.mjs status')), /^## Open question\n\nlook: Which is it: nothing to borrow, named things to borrow, or the fresh concept as a whole\?$/m);
  assert.equal(run(commandOf('look', 'state.mjs begin')), 'look is in work');
  assert.match(run(commandOf('look', 'state.mjs status')), /^## Open question\n\nNone\.$/m);
  // The gate: one page, the finished screens as its one option, one question.
  const final = { ...approve, identity: beside.identity, options: [{ letter: 'A', title: 'The final screens, after one fix round', line: 'Every state of today on the clinic\'s tokens, in both themes.', images: [exampleOf('look'), 'shots/today-default-en-1280-dark.png'] }],
    recommendation: { option: 'A', reason: 'Approve them for Handoff, since neither open finding changes a screen.' }, question: 'Do you approve these screens for Handoff?' };
  writeFileSync(join(look, 'decision.json'), JSON.stringify(final, null, 2));
  assert.match(run(commandOf('look', 'page.mjs <package>/06-look/decision.json')), /^built \S.*decision\.html: 1 option, 2 seats, 2 open findings, 1 accepted deviation, one question$/);
  assert.equal(run(commandOf('look', 'state.mjs await'), { '<the one question>': final.question }), 'look awaits the founder');
  // The carry list the skill gives: the detail's own lines but the one that names a file of a fresh folder, five sections of the
  // detail, the stage's files and the token file. Built from the detail alone, the stamp refuses each line it cannot carry.
  const lookCarry = [...detailCarry.filter(line => !line.includes('/fresh/')), ...['Rules', 'Edge cases', 'Data map', 'Dependencies', 'Strings', 'What the readers found'].map(heading => `- detail@1#${slugOf('detail', heading)}`),
    ...['screens', 'shots', 'reads', 'measures.md', 'checks.json', 'results.json'].map(file => `- source:design/today/06-look/${file}`), '- source:design/kit/tokens.css'];
  assert.deepEqual(detailCarry.filter(line => !lookCarry.includes(line)), ['- source:design/today/04-structure/fresh/today-1.png']);
  assert.ok(!lookCarry.some(line => /\/(?:fresh|beside)\/|BESIDE/.test(line)) && lookCarry.includes('- source:design/today/DECISIONS.md') && lookCarry.includes('- detail@1#data-map'));
  for (const line of ['- detail@1#what-the-readers-found', '- structure@1#what-the-readers-found', '- source:design/today/04-structure/reads', '- source:design/today/05-detail/reads', '- cast@1#structure', '- cast@1#look']) assert.ok(lookCarry.includes(line), line);
  write('look', '[detail@1]', lookCarry);
  assert.equal(refusedFor('look', ['structure', 'cast', 'intent', 'context']), lookCarry.filter(line => /^- (?:structure|cast|intent|context)@/.test(line)).length);
  write('look', standingAt('look'), lookCarry);
  assert.match(run(commandOf('look', 'state.mjs stamp')), STAMPED('look'));
  // The package stands: nothing stale, no question left open, Handoff next, and what the fresh maker made still where it came.
  assert.equal(run(`${STATE} validate <package>`), 'ok');
  assert.equal(run(`${STATE} next <package>`), 'handoff');
  assert.match(run(commandOf('look', 'state.mjs status')), /^## Open question\n\nNone\.$/m);
  assert.deepEqual(parse(readFileSync(join(pkg, ARTEFACT.look), 'utf8')).data['built-from'], ['detail@1', 'structure@1', 'cast@1', 'intent@1', 'context@1']);
  assert.deepEqual(readdirSync(join(look, 'fresh')).filter(visible).sort(), ['outside-openai-1280-light.png', 'outside-openai.html']);
  assert.ok(!readdirSync(join(look, 'screens')).some(name => name.includes('outside')));

  // A correction, as references/correction.md gives it: a second design of the same project, sized correction. Its route runs
  // Frame and then Detail; Detail is built from the frame alone, shows its one option with no seat, and one nod stamps it.
  const fix = { '<package>': 'design/label' };
  const small = join(project, 'design', 'label');
  run(`${STATE} init <package> --design label --kind working-surface --foundation small-change --size correction`, fix);
  run(`${STATE} begin <package> frame`, fix);
  write('frame', '[]', ['- source:src/today/rooms.html'], small);
  assert.match(run(`${STATE} stamp <package> frame --words "sí"`, fix), STAMPED('frame'));
  assert.equal(run(`${STATE} next <package>`, fix), 'detail');
  assert.equal(run(commandOf('detail', 'state.mjs begin'), fix), 'detail is in work');
  assert.match(run(commandOf('detail', 'state.mjs status'), fix), /^\| detail \| short \| in-work \|/m);
  const [correcting] = commandsOf(stageRef('detail', 'correction.md'));
  assert.ok(takenBy('shots', words(correcting).slice(2).join(' ')), correcting);
  mkdirSync(join(small, '05-detail', 'correction'), { recursive: true });
  const [, beforePicture] = /as `(correction\/before-[\w-]+\.png)`/.exec(flat(stageRef('detail', 'correction.md')));
  for (const picture of [beforePicture, beforePicture.replace('before', 'after')]) writeFileSync(join(small, '05-detail', picture), '');
  const nod = { identity: { design: 'label', kind: 'working-surface', size: 'correction', stage: 2, of: 4 },
    options: [{ letter: 'A', title: 'The booking action', line: '"Reserve" → "Book room", on today, in the free rooms list.', images: [beforePicture, beforePicture.replace('before', 'after')] }], seats: [],
    recommendation: { option: 'A', reason: 'It is one label, and nothing else on the screen moves.' }, question: 'May this be changed so?' };
  mkdirSync(join(small, '05-detail'), { recursive: true });
  writeFileSync(join(small, '05-detail', 'decision.json'), JSON.stringify(nod, null, 2));
  assert.match(run(commandOf('detail', 'page.mjs <package>/05-detail/decision.json'), fix), /^built \S.*decision\.html: 1 option, 0 seats, one question$/);
  const pictureLines = [beforePicture, beforePicture.replace('before', 'after')].map(picture => `- source:design/label/05-detail/${picture}`);
  // Built from nothing, it lacks the stage before it on its route; built from the frame, as the page says, it is stamped.
  write('detail', '[]', ['- source:src/today/rooms.html', ...pictureLines], small);
  assert.equal(run(commandOf('detail', 'state.mjs await'), { ...fix, '<the one question>': nod.question }), 'detail awaits the founder');
  const unbuilt = exec(commandOf('detail', 'state.mjs stamp'), fix);
  assert.deepEqual([unbuilt.status, unbuilt.stdout], [1, '']);
  assert.match(unbuilt.stderr, /^detail cannot be stamped:\n- it must be built from frame, the stage before it on the route: add frame@1 to built-from\n$/);
  const [, built] = /the frame alone, `(\[frame@<version>\])`/.exec(flat(stageRef('detail', 'correction.md')));
  write('detail', built.replace('<version>', '1'), ['- source:src/today/rooms.html', ...pictureLines], small);
  assert.match(run(commandOf('detail', 'state.mjs stamp'), fix), STAMPED('detail'));
  assert.equal(run(`${STATE} validate <package>`, fix), 'ok');
  assert.equal(run(`${STATE} next <package>`, fix), 'handoff');
});

// ---- Handoff and Acceptance: what skills/handoff and skills/acceptance were written to say, and the two reference documents

const guide = () => read('reference/IMPLEMENTER-GUIDE.md');
const antiPatterns = () => read('reference/ANTI-PATTERNS.md');
const LAST_TWO = Object.freeze(['handoff', 'acceptance']);
// What points back into a package, or out of a handoff folder: a stage's folder, the gate's folder, the scratch folder.
const INTO_THE_PACKAGE = /\b0[0-6]-[a-z]+|08-acceptance|07-handoff-gate|\bwork\/|design\/today/;

test('handoff and acceptance: the six sections and no other, the question the conductor gives each, and the conductor\'s rules pointed to, never copied', () => {
  for (const [name, title, does, gate, files] of [
    ['handoff', 'Handoff', 'gives one go', ' **He gives one go.**', ['SKILL.md', 'references/folder.md', 'references/forms.md', 'references/seats.md']],
    ['acceptance', 'Acceptance', 'accepts', ' **He accepts.**', ['SKILL.md', 'references/deviations.md', 'references/driving.md', 'references/forms.md', 'references/seats.md']],
  ]) {
    const text = stageSkill(name);
    assert.deepEqual(headings(text), STAGE_SECTIONS, name);
    const [, , , question, output, founder] = stageRows().find(row => row[1] === title);
    assert.equal(section(text, 'Question').trim(), question, name);
    assert.deepEqual([unspan(output), founder], [ARTEFACT[name], does], name);
    assert.ok(flat(section(text, 'Gate')).startsWith(gate), name);
    const opening = flat(text.slice(0, text.indexOf('\n## ')));
    assert.ok(opening.includes(`The conductor (\`ux:design\`) sent you, and its words are yours. Its loop is in \`skills/design/references/loop.md\`: this page says only what is ${title}'s own.`), name);
    assert.match(opening, /Run it from the project's root\. `<packages>` is the folder that holds the project's packages: `design` at the project's root, unless the project profile names another under `packages`\. `<package>` is the folder of this design in it, as `design\/today`\./, name);
    assert.deepEqual(filesUnder(`skills/${name}/`), files, name);
    assert.deepEqual(ownReferences(text).sort(), files.slice(1), name);
    assert.ok(lineCount(text) <= MAX_LINES, name);
    for (const [file, body] of Object.entries(folderOf(name))) {
      assert.doesNotMatch(flat(body), CONDUCTORS_OWN, `${name}/${file}`);
      assert.doesNotMatch(flat(body).replace(PROFILE_WORDS, ''), /profile/i, `${name}/${file}: "profile" alone says neither the project profile nor a profession's profile`);
      // No version is written as a number: after a reopening a remembered 1 is wrong.
      assert.doesNotMatch(body, /\b(?:frame|context|intent|cast|structure|detail|look|handoff)@\d/, `${name}/${file}`);
    }
    // Its example is the kit's own product: a room, never a real one.
    assert.match(text, /\brooms?\b/, name);
  }
  // Each opens with what the session never does itself at that stage.
  const opens = name => flat(stageSkill(name).slice(0, stageSkill(name).indexOf('\n## ')));
  assert.match(opens('handoff'), /You design nothing, and you change nothing that was approved: no string, no state, no rule, no id and no value/);
  assert.match(opens('handoff'), /a cold implementer, handed that folder and nothing else, lists what it would have to ask and to guess; and the founder gives one go/);
  // Two folders: the one a builder is given, and one beside it for what the gate needs.
  assert.match(opens('handoff'), /Two folders are yours: `<package>\/07-handoff\/`, the handoff folder, which is all a builder is given, and `<package>\/07-handoff-gate\/`, beside it and never in it, for what the gate needs and a builder does not/);
  assert.match(opens('handoff'), /`<tokens>` is the project kit's copy of the token file, as Look's carry list names it: the file it was copied from is the project profile's `tokens`, named with its commit in `PARTS\.md`/);
  // Acceptance is a session of its own, and implements nothing.
  assert.match(opens('acceptance'), /You are a session of your own, after the build: you did not design it and you did not build it, and you read the handoff folder as the builder did/);
  assert.match(opens('acceptance'), /report each item as \*matches\* or \*deviates\*\. You implement nothing, redesign nothing and settle no deviation: the founder decides each/);
  assert.match(opens('acceptance'), /"The driver" is the project's own way of driving a browser, as the project profile gives it under "How a browser check is run here"/);
  assert.match(read('templates/project/PROFILE.md'), /^## How a browser check is run here$/m);
});

test('handoff: it opens what Look\'s carry list names and nothing else; a gap is said, never filled from the package\'s history', () => {
  const text = stageSkill('handoff');
  const reads = flat(section(text, 'Reads'));
  // Ruling 11: each thing on Look's carry list, by name.
  assert.match(reads, /\*\*The look,\*\* `<package>\/06-look\/LOOK\.md`, approved, and exactly what its carry list names/);
  for (const carried of ['the cast sheet\'s table for every stage, with each seat\'s model and effort', 'the carried sections of the intent and the context',
    '"What the readers found" of the intent, the structure, the detail and the look, with the reads folders of the last three', 'the states, the strings with their why-lines, the rules, the edge cases, the data map and the dependencies',
    'the measured values and the named extensions', 'the final screens, their pictures, the plain prototype and `<tokens>`', 'the package\'s `DECISIONS.md`']) assert.ok(reads.includes(carried), carried);
  // What Look's own skill carries is what is named here: its gate, line by line.
  const lookCarry = leads(section(stageSkill('look'), 'Gate'))['Write the carry list'];
  for (const carried of ['the cast sheet\'s tables among them', '"Rules", "Edge cases", "Data map", "Dependencies", "Strings", "What the readers found" and "Accepted deviations"', 'the screens\' folder, the pictures\' folder, the reads\' folder, `measures.md`, `checks.json`, `results.json` and `<tokens>`']) assert.ok(lookCarry.includes(carried), carried);
  assert.match(lookCarry, /No line names `<package>\/06-look\/fresh\/`, or anything else a fresh maker made: none of it is handed off/);
  // The project's own facts come from the project profile and the source, read now; no key is read.
  assert.match(reads, /\*\*The project profile,\*\* `<packages>\/PROFILE\.md`: `product`, `tokens`, `components`, `strings-format` and `languages`, with its "Standing rules", and nothing about a key/);
  for (const key of ['product', 'components', 'strings-format', 'languages', 'tokens']) assert.ok(profileKeys().includes(key), key);
  assert.match(read('templates/project/PROFILE.md'), /^## Standing rules$/m);
  assert.match(reads, /\*\*The component source:\*\* the folder the project profile names under `components`, read now/);
  assert.match(reads, /`reference\/IMPLEMENTER-GUIDE\.md`, which you copy\. The cold implementer's card is read by its seat/);
  // Ruling 12: nothing a fresh maker made is opened, copied or named.
  assert.match(reads, /\*\*Never\*\* `<package>\/06-look\/fresh\/`, `<package>\/06-look\/beside\/` or the sealed file beside it; `<package>\/04-structure\/earlier\/`; a letter not chosen; the package's `work\/` folder; the chat\.\s*$/);
  assert.ok(nevers(text).includes('Never copy into the folder, or name in it, anything a fresh maker made:'));
  assert.ok(nevers(text).includes('Never open what is on no line of Look\'s carry list'));
  // A gap in the carry list stops the stage: it is said to him, and never filled from the package's history.
  assert.match(stepOf(section(text, 'Steps'), 'Read the look, and what its carry list names'), /\*\*When a file of the folder needs something that is on no line of the carry list, stop and tell the founder what is missing:\*\* you never reach into the package's history for it/);

  // folder.md: every line of the carry list, with the file of the folder it fills.
  const folder = stageRef('handoff', 'folder.md');
  assert.deepEqual(headings(folder), ['What the carry list hands you', '`prototype/`, and `tokens.css`', 'The folder stands alone, proved', '`IMPLEMENTER-GUIDE.md`, and `build/`', '`SPEC.md`', 'The strings', '`PARTS.md`', '`ACCEPTANCE.md` and `acceptance.json`', '`DECISIONS.md`', '`COVERAGE.md`', '`HANDOFF.md`']);
  const handed = tableRows(section(folder, 'What the carry list hands you')).slice(2);
  assert.equal(handed.length, 15);
  for (const [line] of handed) assert.match(line, /^`- (?:(?:intent|context|cast|structure|detail)@<version>#<slug>|source:)`/, line);
  // Each section it names is a heading of the stage's template, and one that stage's skill carries on.
  const carriedBy = { intent: stageSkill('cast'), context: stageSkill('intent'), structure: stageSkill('detail'), detail: stageSkill('look') };
  for (const [line] of handed) {
    const [, stage] = /^`- ([a-z]+)@/.exec(line) ?? [];
    if (!stage || stage === 'cast') continue;
    for (const [, heading] of line.matchAll(/"([^"]+)"/g)) {
      assert.ok(headings(outputOf(stage)).includes(heading), `${stage}: ${heading}`);
      if (stage !== 'intent') assert.ok(flat(section(carriedBy[stage], 'Gate')).includes(`"${heading}"`), `${stage}: "${heading}" is carried on`);
    }
  }
  // The intent's sections travel through the cast sheet's carry list: every one but the two last, its readers' findings among them.
  assert.match(flat(section(carriedBy.intent, 'Gate')), /A `- intent@<version>#<slug>` line for every section of the intent but "Reviewed by the founder" and "Carry", `<version>` being the version the intent stands at, as `status` prints it: "What the readers found" goes on too, so that the handoff covers every seat/);
  // And they are for the coverage page alone: Structure, which meets them first, puts them into no brief.
  assert.match(flat(stageRef('structure', 'seats.md')), /The intent's "What the readers found", which the cast sheet carries on, is for the handoff's coverage page: it is never put into a maker's brief, nor into a reader's/);
  // Ruling R151: why it is built now, what exists today and what it must not become reach the handoff, each by its line.
  const fromContext = handed.find(([line]) => line.includes('"The problem, and why now"'));
  assert.deepEqual(fromContext.slice(0, 1), ['`- context@<version>#<slug>` for "The problem, and why now", "What exists today", "What it must not become"']);
  assert.equal(fromContext[2], '`HANDOFF.md`, `COVERAGE.md`');
  assert.deepEqual(handed.find(([line]) => line.includes('intent@') && line.includes('"What the readers found"')).slice(2), ['`COVERAGE.md`']);
  assert.match(flat(section(folder, '`HANDOFF.md`')), /\*\*Context:\*\* the product in one sentence, `product` of the project profile; who it is for and her moment; her one job; and why now, from "The problem, and why now" of the context/);
  assert.match(flat(section(folder, '`HANDOFF.md`')), /What they replace is "What exists today" of the context/);
  assert.match(flat(section(folder, '`HANDOFF.md`')), /\*\*Out of scope:\*\* "What it must not become" of the context, "What it is deliberately bad at" of the structure, and each element a decision took out/);
  assert.doesNotMatch(folder, /not carried into this folder/);
  const top = flat(section(folder, 'What the carry list hands you'));
  assert.match(top, /`LOOK\.md` itself is yours whole/);
  assert.match(top, /A section or a file that is on no line, and is not in `LOOK\.md`, is not handed to you: you do not open it, and where a file of the folder cannot be written without it, that is the stop of step 2 of the skill/);
  assert.match(top, /A package stamped before the carry list named a section the table gives is such a case: say which line is missing, and never write the section from memory/);
  // Every seat is covered: those of Context and of Intent have a row too, from the two sections that hold what they found.
  assert.match(flat(section(folder, '`COVERAGE.md`')), /\*\*The seats of Context and of Intent\*\* read before there was a cast sheet, and have a row each all the same: the judges that read the surface as it is, from "The problem, and why now" of the context, and the profile judge that read the intent, from its "What the readers found"/);
  assert.match(flat(section(folder, '`COVERAGE.md`')), /Their ledgers are not carried: what such a section does not record of a seat reads "not recorded"/);
  for (const heading of ['The problem, and why now', 'What exists today', 'What it must not become']) assert.ok(headings(outputOf('context')).includes(heading), heading);
  const rules = flat(folder.slice(0, folder.indexOf('\n## ')));
  assert.match(rules, /\*\*Nothing points back into the package\.\*\* No path of a stage's folder, no letter of the board, no name of a seat's ledger file, no "as decided at Detail"/);
  assert.match(rules, /\*\*What she reads is copied, never retold\.\*\* A string, a state's name, an id and a measured value are written exactly as approved/);
});

test('handoff: the folder holds the eight files, the prototype, the token file and the guide, each from its template or copied; the parts are read in the source now', () => {
  const text = stageSkill('handoff');
  const rows = tableRows(section(text, 'Writes')).slice(2);
  assert.deepEqual(rows.map(([file]) => file), ['`07-handoff/HANDOFF.md`', '`07-handoff/IMPLEMENTER-GUIDE.md`', '`07-handoff/prototype/`', '`07-handoff/tokens.css`', '`07-handoff/SPEC.md`',
    '`07-handoff/strings.json`, and the strings in the project\'s own format', '`07-handoff/PARTS.md`', '`07-handoff/ACCEPTANCE.md`, `07-handoff/acceptance.json`', '`07-handoff/accept-inpage.js`', '`07-handoff/DECISIONS.md`', '`07-handoff/COVERAGE.md`',
    '`build/BUILD.md`, `build/STATES.md`, `build/DEVIATIONS.md`', '`07-handoff-gate/`']);
  // The eight files of the design, as the handoff's own template lists them, and every template of the folder is used.
  const listed = tableRows(section(read('templates/package/07-handoff/HANDOFF.md'), 'What is in this folder')).slice(2).map(([file]) => file);
  assert.deepEqual(listed, ['`HANDOFF.md`', '`IMPLEMENTER-GUIDE.md`', '`prototype/`', '`SPEC.md`', '`strings.*`', '`PARTS.md`', '`ACCEPTANCE.md`, `acceptance.json`', '`accept-inpage.js`', '`DECISIONS.md`', '`COVERAGE.md`']);
  // Ruling R159: the in-page file of the checks is copied in, so that a builder with no kit can run them.
  assert.ok(existsSync(at('scripts/inpage/accept-inpage.js')));
  assert.deepEqual(rows.find(([file]) => file === '`07-handoff/accept-inpage.js`').slice(1), ['what makes those checks in a page, so that a builder with no kit can run them', '`scripts/inpage/accept-inpage.js`, copied whole']);
  for (const file of filesUnder('templates/package/07-handoff/')) assert.ok(section(text, 'Writes').includes(`\`templates/package/07-handoff/${file}\``), file);
  assert.deepEqual(filesUnder('templates/package/build/'), ['BUILD.md', 'DEVIATIONS.md', 'STATES.md']);
  assert.match(rows[0][1], /`built-from: \[look@<version>, detail@<version>, structure@<version>, cast@<version>, intent@<version>, context@<version>\]`/);
  assert.match(flat(section(text, 'Writes')), /Each path is from `<package>\/`\. `<version>` is the version a stage stands at, as `status` prints it\./);
  // M12: the token file is in the folder, so the entry's own table says so.
  assert.equal(rows[3][1], 'the token file the screens were drawn on, with a row of its own added to the table of `HANDOFF.md`');
  assert.match(flat(section(stageRef('handoff', 'folder.md'), '`HANDOFF.md`')), /\*\*What is in this folder:\*\* the template's table, with one row more, for `tokens\.css`: the token file the prototype is drawn on, copied in, with what it loads/);
  assert.ok(!listed.includes('`tokens.css`'), 'the template has no row for it');
  assert.deepEqual(rows[1].slice(1), ['how a builder turns the prototype into the project\'s components', '`reference/IMPLEMENTER-GUIDE.md`, copied whole']);
  // Ruling 10: an output that is already there is not copied over.
  const steps = section(text, 'Steps');
  assert.deepEqual(boldSteps(steps).map(([, name]) => name), ['Begin', 'Read the look, and what its carry list names', 'Copy in what was approved, and prove the folder stands alone', 'Write `SPEC.md`, the strings and `DECISIONS.md`',
    'Write `PARTS.md` from the component source, read now', 'Write the checks, and run them on the prototype first', 'Write `COVERAGE.md`, and fill `HANDOFF.md`', 'Start the cold implementer', 'Answer every question and every guess in the folder', 'Build the decision page']);
  assert.match(stepOf(steps, 'Read the look'), /Copy the template to `<package>\/07-handoff\/HANDOFF\.md` and write `built-from`, unless the file is already there: then go on from what the folder holds, at the first step whose file is missing/);
  // The final screens, their pictures, the token file with where it came from, the one link, the index, the guide and the builder's pages.
  const copy = stepOf(steps, 'Copy in what was approved');
  inOrder(copy, [/every page of `<package>\/06-look\/screens\/` into `<package>\/07-handoff\/prototype\/`, and the pictures of those pages into `<package>\/07-handoff\/prototype\/shots\/`/,
    /`<tokens>` to `<package>\/07-handoff\/tokens\.css`, noting the path of the project's own token file, which it was copied from, and the commit that last changed it/, /in each copied page the one link to `<tokens>` then names that copy, as `\.\.\/tokens\.css`: a page changes there, and where an asset is copied in for it, and nowhere else/,
    /`<package>\/07-handoff\/prototype\/index\.html`: every page as a link, by screen, state, language/, /the guide, whole, and the in-page file of the checks, as `accept-inpage\.js`; and the three pages of `templates\/package\/build\/` into `<package>\/build\/`/,
    /``` node <kit root>\/scripts\/alone\.mjs <package>\/07-handoff ``` It must exit 0, with its one line: the folder stands alone\. What the token file loads from outside is copied in beside it, or taken out of the copy and listed in `HANDOFF\.md` for the builder to supply/,
    /What a page loads that cannot be copied in goes to the founder, open: no page is edited to pass/], 'what is copied in');
  // Ruling R148: the kit's own script proves the folder stands alone, after the copy and before the checks.
  const proving = 'node <kit root>/scripts/alone.mjs <package>/07-handoff';
  assert.ok(fencedLines(text).includes(proving) && fencedLines(stageRef('handoff', 'folder.md')).includes(proving), proving);
  assert.ok(takenBy('alone', words(proving).slice(2).join(' ')), proving);
  assert.ok(fencedLines(text).indexOf(proving) < fencedLines(text).findIndex(line => line.includes('accept.mjs prototype')), 'it is run before the checks');
  // S1 of the fix review: the proof that nothing points back is run once the folder's last file is written, after step 7 and
  // before the cold implementer starts. At step 3 it could not pass: the folder does not hold its own DECISIONS.md yet.
  const pointing = `${proving} --package <package>`;
  assert.ok(takenBy('alone', words(pointing).slice(2).join(' ')), pointing);
  assert.ok(!commandsOf(copy).includes(pointing) && commandsOf(copy).includes(proving), 'step 3 runs the address check alone');
  const written = stepOf(steps, 'Write `COVERAGE.md`, and fill `HANDOFF.md`');
  assert.ok(commandsOf(written).includes(pointing), 'step 7 ends with the proof');
  assert.deepEqual(boldSteps(steps).map(([, name]) => name).slice(6, 8), ['Write `COVERAGE.md`, and fill `HANDOFF.md`', 'Start the cold implementer']);
  inOrder(written, [/`HANDOFF\.md`: the slices in build order/, /\*\*Then prove that nothing points back,\*\* in a comment or a note: no text file of the folder names a file of the package that the folder does not hold\. Run it, and mend each place it prints, before any seat reads: `node <kit root>\/scripts\/alone\.mjs <package>\/07-handoff --package <package>`/,
    // S3: when it may still exit 1, so that "must exit 0" and "is not rewritten" do not meet.
    // S-N1 of the re-review: an approved file copied in is changed by step 3's rewrites, so "unchanged" alone left no page an allowed exit.
    /It may exit 1 only so: every place left is in a file approved earlier and copied in, unchanged or changed only by the rewrites of step 3, which is not rewritten, and `PARTS\.md` lists each without the name it points to\./], 'the proof that nothing points back');
  const proved = flat(section(stageRef('handoff', 'folder.md'), 'The folder stands alone, proved'));
  inOrder(proved, [/``` node <kit root>\/scripts\/alone\.mjs <package>\/07-handoff ```/, /\*\*Nothing points back, proved too\.\*\*/,
    /It is run once the folder's last file is written: after step 7 of the skill, before the cold implementer is started, and again when a file of the folder changes at step 9\. ``` node <kit root>\/scripts\/alone\.mjs <package>\/07-handoff --package <package> ```/,
    /Run at step 3 it could not pass: the entry and the guide name `DECISIONS\.md`, which the package holds from Frame on and the folder only from step 4/,
    /It never writes the name the pointer points to, which would be one more place for the command to print/,
    /\*\*A link\*\* the command prints is no file of the folder: copy in what it leads to, under the link's own name, or take the link out/,
    /\*\*When it may exit 1\.\*\* Only so: every place it prints is in a file approved at an earlier stage and copied in, unchanged or changed only by the rewrites of step 3, and each is listed in `PARTS\.md`, as above\. Then the stage goes on: the cold implementer is started, and those places are put to the founder with the gate, each as an open finding on the decision page and named in the gate's question/,
    // W-N3 and S-N4 of the re-review: such a finding's seat is the check that found it, in the form Acceptance uses.
    /On the page, the `seat` of each names the check that found it, as Acceptance names a finding a check found: `check: alone\.mjs --package`/,
    /Any other place is mended first, and the command run again/], 'folder.md: where the proof runs, and when it may exit 1');
  assert.match(flat(section(stageRef('handoff', 'folder.md'), '`PARTS.md`')), /Under it, each pointer an approved file still holds: where it is and what it stood for, never the name it points to/);
  assert.match(flat(section(stageSkill('frame'), 'Writes')), /The package's `DECISIONS\.md`, started from `templates\/package\/DECISIONS\.md`/, 'Frame starts the package\'s own DECISIONS.md');
  const stands = flat(section(stageRef('handoff', 'folder.md'), 'The folder stands alone, proved'));
  inOrder(stands, [/^ Once the pages, the token file and the index are in, and again after any of them changes/, /prints one line for each address that does not lead to a file inside it: the file, the address, and why\. It leaves the folder, it is remote, or the file is not there\. It exits 0 when there is none, and step 6 of the skill is not run before it does/,
    /\*\*What the token file loads,\*\* a font or a picture, by `url\(\)` or `@import`: copy the file into the folder, beside `tokens\.css`, and make the address in the copy of the token file lead to it: kept where the file sits at the same path from the copy, rewritten where it does not/,
    /\*\*What the token file loads that cannot be copied,\*\* .* take the line that loads it out of the folder's copy of the token file, which is a copy of the project's own file and no approved page, and list it in `HANDOFF\.md`, under "Left to the builder", as a file the builder must supply: its name, what loads it, and where the project gets it\. That address is written without its query: a key may ride there/,
    /\*\*Never leave one unsaid\.\*\* Every address the command printed is copied in; or, in the copy of the token file, taken out and listed; or, in a page, put to the founder\. None is left to load from outside, none is dropped in silence, and no page is edited to make the command pass/], 'the folder stands alone');
  // A page takes two changes and no other; what it loads that cannot be copied in is a fault in what was approved, and his.
  assert.match(stands, /Those are the two changes a copied page takes, and the only two: its link to the token file, and the address of an asset copied in/);
  assert.match(stands, /\*\*What a page loads that cannot be copied in,\*\* as a script or a picture from another host: the page is not edited to pass\. It is a fault in what was approved, and it goes to the founder, open, as a question, recorded with the `await` of the skill's gate\. Nothing goes on until he answers/);
  assert.doesNotMatch(stands, /or a second link the page carries|is copied in, or taken out and listed\./);
  assert.match(flat(section(text, 'Never')), /\*\*Never change what was approved:\*\* a string, a state, a rule, an id, a measured value or a page, but its link to the token file and the address of an asset copied in\. A fault goes to him, open/);
  // The command itself never prints a query: what it says of an address is its path.
  assert.match(KIT.usage('scripts/alone.mjs'), /An address is printed without its query and its fragment, and without a sign-in written into it/);
  for (const why of ['it leaves the folder', 'it is remote', 'the file is not there']) assert.ok(KIT.usage('scripts/alone.mjs').includes(why), why);
  assert.ok(headings(read('templates/package/07-handoff/HANDOFF.md')).includes('Left to the builder'));
  const folder = stageRef('handoff', 'folder.md');
  const proto = flat(section(folder, '`prototype/`, and `tokens.css`'));
  assert.match(proto, /The folder's `prototype\/` is the final screens\. The plain prototype of Detail is not copied: it wears the shared kit, and a builder would take its grey for the look/);
  assert.match(proto, /A variant he did not pick is not a screen, and nothing of `<package>\/06-look\/variants\/` is copied/);
  assert.match(proto, /Note two things for `PARTS\.md`, both of the project's own token file, `tokens` of the project profile, which the kit's copy was made from: its path, from the project's root, and the commit that last changed it, as the project's history gives it for that file\. A file with changes not yet committed, or a project with no history, is said so in place of a commit/);
  // The sentence that said the prototype run proves it is gone: a link left as it was still loads the project's file.
  assert.match(proto, /Change it by a script, in every page alike, and nothing else\. A link left as it was still loads the project's file from here, since the copy sits as deep as the page it was copied from: no check on the pages would notice/);
  assert.doesNotMatch(flat(stageRef('handoff', 'folder.md')), /then proves it, since a page whose stylesheet does not load/);
  assert.match(read('templates/package/07-handoff/PARTS.md'), /Token file: \{its path in this folder, beside the prototype; the path it was copied from in the project;\s+its version\}/);
  // The visual designer's pages link the real token file by its path: that is the one line a copy must change.
  assert.match(flat(read('pool/makers/visual-designer.md')), /\*\*Write static pages that link the project's token file:\*\* the real file, by its path, never its values pasted in/);
  const beside = flat(section(folder, '`IMPLEMENTER-GUIDE.md`, and `build/`'));
  assert.match(beside, /`reference\/IMPLEMENTER-GUIDE\.md` of the kit is copied whole, as it is, to `<package>\/07-handoff\/IMPLEMENTER-GUIDE\.md`: the builder has no kit, and the folder stands alone/);
  assert.match(beside, /The three pages of `templates\/package\/build\/` are copied to `<package>\/build\/`, as they are, unless they are already there\. They are the builder's to fill\. `HANDOFF\.md` names them as `\.\.\/build\/`, and that is the one path in the folder that leaves it/);
  assert.match(read('templates/package/07-handoff/HANDOFF.md'), /Three short files, in `\.\.\/build\/`, beside this folder\. Each is already there as a page to fill/);
  // The strings: the detail's file, copied; and the project's own format when the project profile names one.
  const strings = stepOf(steps, 'Write `SPEC.md`, the strings and `DECISIONS.md`');
  assert.match(strings, /whatever a builder needs is written out in full: nothing in the folder points back into the package\. `strings\.json` is the detail's, copied/);
  assert.match(strings, /\*\*When the project profile names a `strings-format`,\*\* the same keys and strings are also written in that format, by a script and never by hand, and counted against `strings\.json` by tool/);
  assert.match(flat(section(folder, 'The strings')), /With no format named, `strings\.json` is the strings file, and `HANDOFF\.md` says the project named none/);
  // PARTS.md: from the component source the project profile names, read in this session, never from memory; a named extension is a change to the system.
  const parts = stepOf(steps, 'Write `PARTS.md` from the component source, read now');
  assert.match(parts, /Open the folder the project profile names under `components`\. For each element id of the spec, write the component the project has for it, the file it is in as installed, and the tokens it takes: each a name and a path you opened and saw in this session, never one from memory or from a ledger/);
  assert.match(parts, /An element the system has no part for is never given the nearest name/);
  assert.match(parts, /\*\*Each named extension\*\* of `measures\.md` is written under "Changes to the system", with its definition: a change to the system, to be agreed as one/);
  assert.ok(headings(read('templates/package/07-handoff/PARTS.md')).includes('Changes to the system'));
  assert.ok(nevers(text).includes('Never write a part, a token or a path from memory'));
  // COVERAGE.md and HANDOFF.md, filled from what is carried.
  const coverage = flat(section(folder, '`COVERAGE.md`'));
  assert.match(coverage, /\*\*Seats:\*\* one row for each line of the cast sheet's tables for Structure, Detail, Look and Handoff\. What it read, its checks run and its verdict are taken from its ledger or its task read\. "Ran on" is the model its line names, or the session's where the line shows a dash/);
  assert.match(coverage, /\*\*Findings:\*\* every finding of every ledger and every stuck point of every task read, one row each, with what became of it: fixed, accepted by the founder in his words, carried as a dependency, or open with why/);
  assert.match(coverage, /A finding with no fate written anywhere is open, and is said to be/);
  assert.match(coverage, /No row names a ledger's file: the builder cannot open it/);
  // I1: the folder is told the counts and the day, never a command or a path that leaves it.
  assert.match(coverage, /Under the table, the checks of `acceptance\.json`: the day they last ran on the prototype, the counts, failed and passed, and each check taken out as one a person must look at\. No command and no path: neither is the folder's/);
  assert.match(stepOf(steps, 'Write `COVERAGE.md`, and fill `HANDOFF.md`'), /Coverage: every seat that read, from Context on, with what it read, the model it ran on and its checks run and not run; every finding with what became of it; and the counts step 6 printed, with the day: never a command, or a path out of the folder/);
  // M9: a read of a fresh pass is entered under its seat, its versions named by what they were.
  assert.match(coverage, /\*\*A read of a fresh pass,\*\* a file of Look's reads whose name ends `-beside\.md` or `-borrow\.md`, is entered under its seat like any other\. A version it names by a letter is written as what it was: "the version on the project's tokens", or "a fresh version, not handed off"\. Never the letter, never the maker, the engine or the model, and never where the fresh screen is/);
  // I3: the cold implementer's own row waits for its last read.
  assert.match(coverage, /\*\*The cold implementer's own row and its items are added only after its last read:\*\* after the re-read when there is one, never between the two, since a re-read reads the folder cold/);
  assert.deepEqual(headings(read('templates/package/07-handoff/COVERAGE.md')), ['Seats', 'Checks not run', 'Findings']);
  const entry = flat(section(folder, '`HANDOFF.md`'));
  assert.match(entry, /\*\*Slices:\*\* in build order\. Each is small enough to build, verify and commit alone, and names the screens and states it covers, a done-when someone can see, and the checks of `acceptance\.json` it must hold, by id\. Every check belongs to a slice, and every state to one/);
  assert.match(entry, /Where they live in the product is read now in the project sources the carry list names, never written from memory/);
  // M4: the project's own gates are read now, where the project writes them down, and a command not found there is asked, never guessed.
  assert.match(entry, /\*\*Verify:\*\* the project's own gates, by the commands the project uses\. No carried section holds them: read them now, in "Standing rules" of the project profile and in the project's own documents, as its contributor's guide or its package file\. A command you did not find written there is asked of the founder, at step 9 of the skill\. It is never guessed/);
  for (const heading of ['Context', 'Task', 'Done when', 'Verify', 'Constraints', 'Slices', 'Out of scope', 'Must not change', 'Left to the builder', 'What you write back', 'Reviewed by the founder']) assert.ok(headings(read('templates/package/07-handoff/HANDOFF.md')).includes(heading), heading);
  // No credential is ever written into the folder.
  assert.ok(nevers(text).includes('Never write a password, a token or a key into the folder'));
  assert.match(flat(section(text, 'Never')), /and never the path of a keys file: an account is named by its role, with where its sign-in is kept/);
});

test('handoff: the checks are written by stable id and run on the prototype first; a check that fails there is a wrong check', () => {
  const text = stageSkill('handoff');
  const step = stepOf(section(text, 'Steps'), 'Write the checks, and run them on the prototype first');
  assert.match(step, /`ACCEPTANCE\.md` and `acceptance\.json` are written from the intent's success criteria, the states and the measured values, each element by its stable id, its `data-ux`, with `screen` where an id repeats/);
  // Ruling 3: the command, as the script takes it, on the folder's own prototype, its results beside the folder.
  const command = 'node <kit root>/scripts/accept.mjs prototype <package>/07-handoff/acceptance.json --root <package>/07-handoff/prototype --out <package>/07-handoff-gate/results.json';
  assert.ok(fencedLines(text).includes(command), command);
  assert.ok(takenBy('accept', words(command).slice(2).join(' ')), command);
  inOrder(step, [/The script refuses a file that is not valid, and names each fault/, /\*\*A check that fails on the approved prototype is a wrong check:\*\* rewrite the check, never the page, and run it again until none fails/,
    // Round 2 of the fix: a check it cannot make, and --allow-errors, are said once, in folder.md, held below; the skill points there.
    /A check it cannot make, and `--allow-errors`, are as `references\/folder\.md` says/], 'the checks');
  assert.ok(nevers(text).includes('Never hand off a check that was not run on the prototype'));
  // The two answers the in-page file gives when it will not guess, word for word, and the switch the script takes.
  const inpage = readFileSync(INPAGE, 'utf8');
  for (const refusal of ['cannot be told: ', 'cannot be measured: ']) assert.ok(inpage.includes(`'${refusal}'`), refusal);
  assert.match(KIT.usage('scripts/accept.mjs'), /\[--allow-errors\]/);
  // folder.md: what a check is, in the script's own keys, and how each line the command prints is read.
  const checks = flat(section(stageRef('handoff', 'folder.md'), '`ACCEPTANCE.md` and `acceptance.json`'));
  assert.match(checks, /`acceptance\.json` is one object: `design`, the design's name, and `checks`\. Keep "A check" and "The check types" of the template whole/);
  assert.match(checks, /`<package>\/06-look\/checks\.json` is already in this shape: its checks are taken over, each with the criterion it holds/);
  assert.match(checks, /\*\*Every state is driven\.\*\* "States to drive" lists every row of `states\.md` with its page, and each state has at least one check/);
  assert.match(checks, /\*\*Every measured value is held\.\*\* Each row of `measures\.md` has its check: a `contrast` with its `min`, a `min-size` with its `minWidth` and `minHeight`, at the row's width and theme/);
  assert.match(checks, /Where two screens carry the same id, the check names its `screen`, and the element is looked for inside the one element whose `data-screen` is that screen/);
  assert.match(checks, /A check needed at both widths is two checks, each with its own `id`/);
  assert.match(checks, /\*\*`failed: <id>: <why>`:\*\* the check is wrong, or the id is\. Fix the check\. A page is never changed to make a check pass\. Where the check says what the criterion says and the approved screen still does not meet it, neither is yours to change: it goes to the founder, open/);
  assert.match(checks, /\*\*`cannot be told:`\*\* an `in-viewport` check where pointing cannot say\. \*\*`cannot be measured:`\*\* a `contrast` over a picture, an opacity, a filter or a blend/);
  assert.match(checks, /`--allow-errors` turns it into a warning: pass it only when the error is known and harmless, and write the reason in `COVERAGE\.md`, as a sentence: which page, which error, and why it is harmless/);
  assert.match(checks, /Neither is a guess to keep: rewrite the check on an element where it can be made, or take it out and list it as one a person must look at/);
  // I1: the last run is written as the day and the counts; what the command prints after them names the gate's folder, and is left out.
  assert.match(checks, /Write the last run into `ACCEPTANCE\.md`: the day and the counts, as "8 checks: 0 failed, 8 passed"\. The line the command prints goes on to say where its results are, in a folder the builder is never given: that part is left out, and so is the command/);
  assert.match(read('scripts/accept.mjs'), /process\.stdout\.write\(`\$\{counts\(results\)\}; results in \$\{out\}\\n`\)/);
  // M5: no check measures a gap, so such a row is listed for a person, with its value.
  assert.match(checks, /No check measures a gap, a size of text or the length of a line: such a row is listed in `ACCEPTANCE\.md`, under "Measured values", with its value and "measured by a person" where its check would be/);
  assert.match(flat(read('pool/makers/visual-designer.md')), /each level of text, the contrast of each pair of text and ground, each action's target, the space between the main regions, the length of a line of running text/);
  assert.match(read('scripts/accept.mjs'), /`failed: \$\{result\.id\}: \$\{result\.message\}\\n`/);
  // Every type and every key the page names is one the script takes.
  for (const [, span] of checks.matchAll(/`([a-zA-Z-]+)`/g)) {
    if (Object.hasOwn(TYPES, span) || ['design', 'checks', 'criterion', 'state', 'page', 'width', 'theme', 'screen', 'id', 'data-ux', 'data-screen', 'min', 'minWidth', 'minHeight', 'visible', 'absent', '--allow-errors'].includes(span)) continue;
    assert.fail(`folder.md names \`${span}\` among the checks, and the acceptance script takes no such key or type`);
  }
  for (const type of ['visible', 'absent', 'contrast', 'min-size', 'in-viewport']) assert.ok(Object.hasOwn(TYPES, type), type);
  // The template the folder's own copy is written from is valid as the script reads it, and names the same types.
  assert.deepEqual(validateAcceptance(JSON.parse(read('templates/package/07-handoff/acceptance.json'))), []);
  const typed = tableRows(section(read('templates/package/07-handoff/ACCEPTANCE.md'), 'The check types')).slice(2).map(([type]) => unspan(type));
  assert.deepEqual(typed, Object.keys(TYPES));
});

test('handoff: the cold implementer is handed the folder only, every item is closed in the folder or put to the founder, and one go stamps it', () => {
  const text = stageSkill('handoff');
  const steps = section(text, 'Steps');
  const start = stepOf(steps, 'Start the cold implementer');
  assert.match(start, /One `judge\.cold-implementer`, a fresh sub-agent, started as "Starting a seat" in the loop says, on the model and the effort its line of the cast sheet's "Handoff" table names: a dash means the session's model, and you enforce none/);
  assert.match(start, /Its brief, from `templates\/briefs\/judge\.md`, hands it `<package>\/07-handoff\/`, whole, and nothing else: `references\/seats\.md` has its "Do not open" list\. Its ledger is written in `<package>\/07-handoff-gate\/`, never in the folder it reads/);
  // seats.md, against the card: the one card of the kit that sits at Handoff.
  const seats = stageRef('handoff', 'seats.md');
  const cards = cardsAt('handoff');
  assert.deepEqual(Object.keys(cards), ['judge.cold-implementer']);
  assert.deepEqual(seatSections(seats), ['judge.cold-implementer']);
  assert.deepEqual(headings(seats), ['The reader', 'Closing its items', 'The re-read']);
  const card = cards['judge.cold-implementer'];
  assert.deepEqual([card.reads, card['never-reads']], [['brief', 'handoff-folder', 'earlier-ledger'], ['maker-notes', 'author-map', 'other-ledgers', 'package', 'component-source']]);
  const said = leads(subsection(seats, '`judge.cold-implementer`'));
  assert.ok(said['Its brief'].includes('`templates/briefs/judge.md`'));
  assert.equal(said.Handed, '`<package>/07-handoff/`, the handoff folder, whole, by its absolute path, and nothing else. `HANDOFF.md` in it is where it starts.');
  for (const [token, kept] of Object.entries({ 'maker-notes': /`<package>\/work\/`, where your notes and this brief's drafts are/, 'author-map': /`<package>\/04-structure\/MAP\.sealed\.json`, the author map/,
    'other-ledgers': /every reads folder, and `<package>\/07-handoff-gate\/`/, package: /^everything else in the package/, 'component-source': /the component source, with the rest of the project's own source/ })) {
    assert.ok(card['never-reads'].includes(token), token);
    assert.match(said['Do not open'], kept, token);
  }
  assert.ok(said['Do not open'].includes(`\`<package>/04-structure/${MAP}\``));
  for (const path of ['<package>/03-cast.md', '<package>/DECISIONS.md', '<package>/build/', '<package>/00-frame.md', '<package>/06-look/']) assert.ok(said['Do not open'].includes(`\`${path}\``), path);
  assert.match(said.Writes, /^its ledger, `<package>\/07-handoff-gate\/judge\.cold-implementer\.md`, in the shape of `templates\/outputs\/LEDGER\.md`: beside the folder, never in it, so that the folder a builder gets holds no ledger and a re-read finds none there/);
  // Its three words are the card's own.
  assert.match(said['Its reply'], /\(\*ready\*, \*ready with defaults\*, \*not ready\*\)/);
  for (const word of ['*Ready*', '*Ready with defaults*', '*Not ready*']) assert.ok(read('pool/judges/cold-implementer.md').includes(word), word);
  assert.match(flat(seats.slice(0, seats.indexOf('\n## '))), /You wrote the folder, so you are the one who answers what the seat finds in it, and you never read it for the gate yourself: the seat that tests the folder is one that was not here/);
  // Ruling 3: every question and every guess is answered in the folder or given a written default, and a question to him is recorded (ruling 10).
  const answer = stepOf(steps, 'Answer every question and every guess in the folder');
  inOrder(answer, [/\*\*The answer is in what the carry list hands you:\*\* write it in the folder/, /\*\*It is how something is built:\*\* write it under "Left to the builder", as the builder's/,
    /\*\*Nobody decided it:\*\* put such items to the founder as one question, numbered, each with the default you would take, marked "the conductor's proposal" and held first against the pages and the checks it touches\. One that changes what she sees or can do is put with its options, never with a blanket default/,
    /Record it with the `await` of the gate, write his answers under `## Reviewed by the founder` and into the folder, as he said them, and put the stage back in work with the `begin` of step 1/,
    // W3 of the fix review: Handoff never fills in an answer he did not give.
    /A default is written only where his answer takes it: one he leaves unanswered stays open, listed so under `findings`, and the gate's question names it/,
    /Run steps 3 and 6 again when a page or a check changed, and step 7's proof when any file did/,
    /\*\*One re-read, when an item blocked:\*\* a fresh sub-agent in the same seat reads the folder cold, then opens the earlier ledger\. No second round: an item closed after it is listed as "closed after the re-read, not read again"\. \*\*Its own row and items go into `COVERAGE\.md` only after its last read\.\*\*/], 'closing the items');
  // M8: one count, in the skill and in its reference: three ways.
  assert.match(answer, /Each item of its ledger is closed one of three ways, in the file its fix names: `references\/seats\.md` has them, and what every folder meets/);
  assert.equal(section(text, 'Steps').split('\n').filter(line => /^ {3}- \*\*(?:The answer|It is how|Nobody)/.test(line)).length, 3);
  assert.equal(tableRows(section(seats, 'Closing its items')).slice(2).length, 3);
  assert.deepEqual(tableRows(section(seats, 'Closing its items')).slice(2).map(([item]) => /^\*\*(.+?)[.:,]?\*\*/.exec(item)[1]), ['The answer is in what the carry list hands you', 'It is how something is built', 'Nobody decided it']);
  const closing = flat(section(seats, 'Closing its items'));
  assert.match(closing, /Every item of the ledger is closed in the folder, in the file its fix names, one of three ways\. Nothing is answered in your reply to the founder, in the chat or in the ledger: a builder gets none of those/);
  // M13: the one way out of the folder is meant, and the item it raises on every run is closed by saying so.
  assert.match(closing, /\*\*`\.\.\/build\/`\.\*\* It is the one way out of the folder, and it is meant: `HANDOFF\.md` names it, under "What you write back", as where the build writes its three pages\. See that the sentence says so plainly, and close the item with it\. It is never taken out/);
  assert.match(flat(read('pool/judges/cold-implementer.md')), /\*\*Every reference that points outside the folder\.\*\*/);
  // I3: its row waits for its last read.
  assert.match(closing, /\*\*Its row waits for its last read\.\*\* .* go into `COVERAGE\.md` once it will not read again: after the re-read when an item blocked, and otherwise once its items are closed\. A re-read that found its own first findings in the folder would not be reading cold/);
  assert.match(closing, /\*\*A page or a check that changed is proved again,\*\* by the commands of steps 3 and 6 of the skill, before the re-read/);
  assert.match(closing, /Where his answer for an entry says to take the default, write a default there, marked "Default:", with the line "nobody decided this: build it so, or write another way down as a deviation"\. An entry he leaves unanswered stays open: no default is written for it/);
  assert.match(closing, /\*\*You never fill in an answer he did not give\.\*\* An entry of the question that he leaves unanswered stays open, whatever default you proposed for it: it is written nowhere in the folder as decided, it is listed on the decision page under `findings`, as open, and the gate's question names it\. A default is written only where his answer for that entry says to take it/);
  for (const page of [flat(text), flat(seats)]) assert.doesNotMatch(page, /Where he leaves one open|the default is written, marked as one/);
  assert.match(flat(section(text, 'Never')), /\*\*Never settle a default in silence,\*\* fill in an answer he did not give, or run a second re-read/);
  assert.match(closing, /\*\*A default is his to see\.\*\* Each one is listed on the decision page under `findings`, so that his go covers it/);
  const reread = flat(section(seats, 'The re-read'));
  assert.match(reread, /Only when an item was marked \*blocks\*\. One fresh sub-agent in the same seat, with the first read's brief, which says it is a re-read\. It names one file more: the earlier ledger, `<package>\/07-handoff-gate\/judge\.cold-implementer\.md`, to be opened only after it has read the folder cold and written its lists/);
  assert.match(reread, /`<package>\/07-handoff-gate\/judge\.cold-implementer-reread\.md`, beside the first and never over it/);
  assert.match(reread, /There is no second round\. .* The handoff is ready when the lists are empty, or every item left has its answer or its default written in the folder\. An item he left unanswered has neither: it stays an open finding, and the gate's question names it/);
  assert.match(reread, /A pointer in an approved file is closed that way, by its line in `PARTS\.md`; the pointer itself still goes to him with the gate, as an open finding/);
  assert.ok(nevers(text).includes('Never give the cold implementer anything but the folder'));
  assert.match(flat(section(text, 'Never')), /\*\*Never let the folder point outside itself:\*\* no path into the package or the gate's folder, no command that names them, no "as discussed", and no address on the web but a source the builder must fetch, named without its query/);
  // W-N2 of the re-review: the Never line and the seats page carry the one exception step 7 and folder.md make, in their words.
  assert.match(flat(section(text, 'Never')), /named without its query\. A file approved at an earlier stage and copied in, unchanged or changed only by the rewrites of step 3, is not rewritten: step 7 says what is done with it\./);
  assert.match(closing, /\*\*A reference that points outside the folder\.\*\* In a file you wrote, write out what it pointed to, and take the reference out\. In a file approved at an earlier stage and copied in, unchanged or changed only by the rewrites of step 3 of the skill, the file is not rewritten: `references\/folder\.md` says what is done, under "When it may exit 1"\. A path into the project's source stays/);
  const exception = 'copied in, unchanged or changed only by the rewrites of step 3';
  for (const [where, said] of [['step 7', stepOf(steps, 'Write `COVERAGE.md`, and fill `HANDOFF.md`')], ['Never', flat(section(text, 'Never'))], ['seats.md', closing], ['folder.md', flat(section(stageRef('handoff', 'folder.md'), 'The folder stands alone, proved'))]]) {
    assert.ok(said.includes(exception), where);
    assert.doesNotMatch(said, /copied in unchanged|as a comment of a stylesheet or a row of the states/, where);
  }
  assert.ok(nevers(text).includes('Never settle a default in silence'));

  // The decision page, the one question, his go in the artefact, the stamp, and what he is told.
  // The tenth step: the helper reads a step's number as one digit, so this one is cut out by its own words.
  const page = flat(steps.slice(steps.indexOf('10. **Build the decision page.**'), steps.indexOf('**Routed `short`**')));
  assert.match(page, /Write `<package>\/07-handoff-gate\/decision\.json` in the shape of `templates\/outputs\/decision-approve\.json`: the folder as its one option, with two reference pictures named from the page, the phone width first, as `\.\.\/07-handoff\/prototype\/shots\/today-default-en-390-light\.png`/);
  assert.match(page, /under `findings`, each item still open and each default, by seat, and each pointer step 7 left open, its seat `check: alone\.mjs --package`; one recommendation; one question\. Its identity is as `status` prints it, at stage 8 of 9/);
  // The one form for a finding a check found, as Acceptance gives it: no second form is made for Handoff's.
  assert.match(flat(stepOf(section(stageSkill('acceptance'), 'Steps'), 'Build the decision page')), /each deviation under `findings`, by what found it, a seat, `check: <id>` or `by hand`/);
  assert.equal(STAGES.indexOf('handoff') + 1, 8);
  const gate = flat(section(text, 'Gate'));
  inOrder(gate, [/^ \*\*He gives one go\.\*\* Put `<package>\/07-handoff-gate\/decision\.html` in front of him, and the folder itself, `<package>\/07-handoff\/HANDOFF\.md` first/,
    /Record the one question, which names each item and each pointer still open, so that a session resuming tomorrow asks the same/, /state\.mjs await <package> handoff --question/,
    /One question, about one thing: may this folder go to the session that builds it\? \*\*Stop: nothing is handed to a builder before his go, and you do not give it\.\*\*/,
    /\*\*Write what he says under `## Reviewed by the founder`,\*\* in `HANDOFF\.md`: what he corrected, and the words of his go, as he said them/,
    /A correction that changes a string, a state, a rule, an id or a value is not Handoff's: ask him to reopen its stage, as the conductor's "Resuming" says/,
    /state\.mjs stamp <package> handoff --words/, /Then append the decision to the package's `DECISIONS\.md`/, /`HANDOFF\.md` has no carry list: Acceptance reads this folder, and `build\/`/,
    /\*\*Tell him what happens now\.\*\* The session that builds is given `<package>\/07-handoff\/` and nothing else, and writes back into `<package>\/build\/`\. Acceptance then runs in a session of its own/], 'the gate');
  assert.doesNotMatch(read('templates/package/07-handoff/HANDOFF.md'), /^## Carry$/m);
  // Every command it gives is one its script takes, in the order of the stage.
  // The fenced ones in the order of the stage, then the two a sentence gives: the state's page, and the proof that ends step 7.
  assert.deepEqual([...new Set(stageCommands('handoff'))].map(command => `${words(command).slice(1, 3).join(' ').replace('<kit root>/scripts/', '')}${command.includes(' --package ') ? ' --package' : ''}`),
    ['state.mjs begin', 'alone.mjs <package>/07-handoff', 'accept.mjs prototype', 'page.mjs <package>/07-handoff-gate/decision.json', 'state.mjs await', 'state.mjs stamp', 'state.mjs status', 'alone.mjs <package>/07-handoff --package']);
  // The other forms: an adjustment, a flow, a correction.
  const forms = stageRef('handoff', 'forms.md');
  assert.deepEqual(headings(forms), ['Routed `short`: an adjustment', 'Sized `flow`: one folder, surface by surface', 'Sized `correction`: one paragraph, and no seat']);
  assert.match(flat(section(text, 'Steps')), /\*\*Routed `short`\*\* \(an adjustment\), Handoff is what changes, and no more\. \*\*Sized `flow`,\*\* the folder is one, and `SPEC\.md` goes surface by surface\. \*\*Sized `correction`,\*\* it is one paragraph, and no seat\. `references\/forms\.md` has the three/);
  for (const size of ['adjustment', 'correction']) assert.equal(routeFor(size).handoff, 'short', size);
  const short = flat(section(forms, 'Routed `short`: an adjustment'));
  assert.match(short, /^ Handoff is what changes, and no more\./);
  assert.match(short, /every other heading says "Unchanged by this adjustment"/);
  assert.match(short, /\*\*A stage the route skips is left out of `built-from`,\*\*/);
  const flow = flat(section(forms, 'Sized `flow`: one folder, surface by surface'));
  assert.match(flow, /\*\*`SPEC\.md` repeats its block for each surface,\*\* in the order Detail went/);
  assert.match(flow, /\*\*One cold implementer, one decision page, one go, one stamp\.\*\*/);
  // A correction costs one nod, and he gave it at Detail: no seat, one paragraph, built from the detail, stamped in the words of that nod.
  const correction = flat(section(forms, 'Sized `correction`: one paragraph, and no seat'));
  assert.match(correction, /\*\*No seat is cast,\*\* so no cold implementer reads, and no brief is written\. Steps 3 to 10 of the skill are not run, and no folder is filled/);
  assert.match(correction, /write `built-from` as the route gives it: `\[detail@<version>, frame@<version>\]`, each at the version `status` prints/);
  assert.match(correction, /\*\*His nod is the go\.\*\* A correction costs one nod, and he gave it at Detail\. Write under `## Reviewed by the founder` that the go is his nod at Detail, with its words, copied as `DETAIL\.md` has them, and stamp with those words/);
  assert.match(correction, /\*\*After the stamp, the session that conducts applies the change,\*\* as the paragraph says, and nothing else\. That is the build\. The same session then accepts it, in Acceptance's short form: a correction is the one design where the session that built also accepts/);
  // Ruling R149: no script checks a correction, and no acceptance file is written for one.
  assert.match(correction, /\*\*No script checks a correction\.\*\* No `acceptance\.json` is written, and no command of the skill is run but those of the state: a correction has no page of a prototype for a check to open\. Its record is the picture of before and after, and the one-paragraph record Detail wrote\. "Verify" says so: the build is held to the picture after, by eye/);
  assert.doesNotMatch(correction, /write the one check/);
  // A check needs a page of the prototype: the script refuses one without.
  assert.ok(validateAcceptance({ design: 'label', checks: [{ id: 'label', criterion: 'The action reads Book room.', state: 'default', width: 1280, type: 'text', target: 'book-action', equals: 'Book room' }] }).some(fault => /\.page: must be a non-empty string/.test(fault)));
  assert.match(flat(reference('routes.md')), /A correction costs one nod\. It still goes through the skills, in their order, Frame first: .* It is the one size where the session that conducts may also do the work/);
  assert.match(flat(stageRef('detail', 'correction.md')), /That is the build: Handoff and Acceptance, each in its short form, say how it is handed over and checked/);
  assert.ok(!cards['judge.cold-implementer'].presets.includes('correction'));
});

test('acceptance: a separate session that reads the handoff folder and what the builder wrote back, drives each state with the project\'s own driver, and never reports a check not run and unexplained', () => {
  const text = stageSkill('acceptance');
  const reads = flat(section(text, 'Reads'));
  // Ruling 4: the handoff folder, build/, and nothing else of the package's history.
  inOrder(reads, [/\*\*The handoff folder,\*\* `<package>\/07-handoff\/`, approved, whole: `HANDOFF\.md` first, then in the order its guide gives/,
    /\*\*What the builder wrote back,\*\* in `<package>\/build\/`: `BUILD\.md`, what was built, where it lives and how to run it; `STATES\.md`, the state map; `DEVIATIONS\.md`, what could not be built as drawn/,
    /\*\*The running build,\*\* through the driver, and the files `BUILD\.md` lists as built or changed/,
    /\*\*Of the cast sheet,\*\* `<package>\/03-cast\.md`: its "Acceptance" table, and the lines of its carry list that name a person's card, a profession's profile and "Tasks for the audience" of the intent, with that one section\. They seat the readers, and you open nothing else of either/,
    /\*\*The project profile,\*\* `<packages>\/PROFILE\.md`: `browser-check`, `languages`, `components`, `facts` and `decisions-log`, with "How a browser check is run here" and "Design system"/,
    /\*\*Never\*\* anything else of the package's history: no earlier stage's folder, no reads folder of another stage, `<package>\/07-handoff-gate\/`, the package's `work\/` folder, or the chat\. A file of those that a seat is handed is named by its path, and you do not open it/], 'what Acceptance reads');
  for (const key of ['browser-check', 'languages', 'components', 'facts', 'decisions-log']) assert.ok(profileKeys().includes(key), key);
  assert.ok(headings(outputOf('cast')).includes('Acceptance') && headings(outputOf('intent')).includes('Tasks for the audience'));
  // Ruling R150: the conductor's loop says what Acceptance reads, in one sentence, and the skill's narrow reading is that sentence.
  assert.match(flat(section(reference('loop.md'), '2. Read the package, not the chat')), /Acceptance alone reads otherwise: it runs in a session of its own, after the build, and reads the handoff folder, what the build wrote back, and, of the package, only the cast sheet's "Acceptance" table with the lines for the person and her profession's profile that it names, the intent's tasks for the audience, and the last entry of the package's `DECISIONS\.md`, to number its own\. It may reopen and stamp Handoff for a deviation he accepts, and a correction is the one case where the session that conducts accepts its own change\.\s*$/);
  // Two sentences, and no more.
  assert.equal(flat(section(reference('loop.md'), '2. Read the package, not the chat')).split('Acceptance alone reads otherwise')[1].split(/\.(?:\s|$)/).filter(part => part.trim()).length, 2);
  // M10: a settings file, and anything else that holds a sign-in, is never opened. M11: the one entry of the package's decisions it reads.
  assert.match(reads, /the files `BUILD\.md` lists as built or changed, but a settings file and anything else that holds a sign-in: those are never opened/);
  assert.match(reads, /And of the package's `DECISIONS\.md`, its last entry alone, for the number of the one you append/);
  assert.ok(nevers(text).includes('Never open the package\'s history:'));
  // What it writes: the report built from the handoff, the results by state, the table, the pictures, the reads, the fixes, the page.
  const rows = tableRows(section(text, 'Writes')).slice(2);
  // W-N4 of the re-review: the two things it writes in the project, the driver and its line in the profile, each on his yes.
  assert.deepEqual(rows.map(([file]) => file), ['`REPORT.md`', '`results/<state>.json`', '`checks.md`', '`by-hand.md`', '`shots/`', '`reads/`', '`FIXES.md`', '`decision.json`, `decision.html`',
    'the driver, at the path of his answer', 'its line in `<packages>/PROFILE.md`']);
  assert.deepEqual(rows.slice(-2).map(([, holds]) => holds), ['for a build that opens as files, where the project profile names no script: one script in the project, only on his yes',
    'the driver\'s command, under "How a browser check is run here", only on his yes']);
  assert.match(flat(section(text, 'Writes')), /but the last two rows: they are the project's, and each is written only on his yes/);
  assert.match(rows[0][1], /`built-from: \[handoff@<version>\]`: each item, \*matches\* or \*deviates\*/);
  assert.deepEqual([rows[0][2], rows[6][2]], ['`templates/package/08-acceptance/REPORT.md`', '`templates/package/08-acceptance/FIXES.md`']);
  assert.deepEqual(filesUnder('templates/package/08-acceptance/'), ['FIXES.md', 'REPORT.md']);
  assert.match(flat(section(text, 'Writes')), /Everything below is in `<package>\/08-acceptance\/`, and the seats' briefs in `<package>\/work\/`/);
  const steps = section(text, 'Steps');
  assert.deepEqual(boldSteps(steps).map(([, name]) => name), ['Begin', 'Read the handoff folder, and what the builder wrote back', 'Start the build and sign in, the way the project says', 'Put each state on screen, check it there, and photograph it',
    'Build the table of the checks', 'Start the readers', 'Write the report, item by item', 'Build the decision page']);
  // Ruling 10: a report that is already there is not copied over; a build that is not written back, or a state with no way in, goes back to the builder.
  const read2 = stepOf(steps, 'Read the handoff folder, and what the builder wrote back');
  assert.match(read2, /Copy the template to `<package>\/08-acceptance\/REPORT\.md` and write `built-from`, unless the file is already there: then go on from what the folder holds, at the first step whose file is missing/);
  assert.match(read2, /\*\*A page of `<package>\/build\/` that is still to fill, or a state of `SPEC\.md` with no row in `STATES\.md`, goes back to the builder:\*\* tell the founder which, and stop\. You never work a state's way out yourself/);
  // The state is reached the way STATES.md and the project profile say, and the in-page file is evaluated through that driver.
  const drive = stepOf(steps, 'Put each state on screen, check it there, and photograph it');
  inOrder(drive, [/For each row of "States to drive" in `ACCEPTANCE\.md`, reach the state as its row of `STATES\.md` says, at the width and in the theme its checks name, and stay at the top of the page/,
    /The kit's in-page file makes the checks, and this prints its path: ``` node <kit root>\/scripts\/accept\.mjs inpage ```/, /Evaluate that file's text in the page through the driver, call `window\.__uxAccept\(checks\)` with that state's checks of `acceptance\.json`/,
    /have the driver write what comes back, as it came, to `<package>\/08-acceptance\/results\/<state>\.json`/, /Then take the state's picture\. One state at a time/,
    /A state that cannot be reached gets no file: its checks show as not run, and step 5 asks why/], 'driving a state');
  assert.ok(headings(read('templates/package/07-handoff/ACCEPTANCE.md')).includes('States to drive'));
  assert.ok(takenBy('accept', 'inpage'));
  // Ruling 4 (R92): the report is built with --checks, a check that never ran shows as not run, and none is left unexplained.
  const table = stepOf(steps, 'Build the table of the checks');
  const report = 'node <kit root>/scripts/accept.mjs report <package>/08-acceptance/results/<state>.json --checks <package>/07-handoff/acceptance.json --out <package>/08-acceptance/checks.md';
  assert.ok(fencedLines(text).includes(report) && fencedLines(stageRef('acceptance', 'driving.md')).includes(report), report);
  assert.ok(takenBy('accept', words(report).slice(2).join(' ')), report);
  assert.match(table, /Name every file of `results\/`, one after another/);
  assert.match(table, /It prints the count: failed, not run, passed\. A check with no result shows as \*\*not run\*\*\. \*\*Every check not run has its reason written in `REPORT\.md`,\*\* under "The checks", or it is run: you never report an acceptance with a check not run and unexplained/);
  assert.ok(nevers(text).includes('Never report an acceptance with a check not run and unexplained'));
  // M3: a state that cannot be driven is said, with its reason: what is never reported is one left out without a word.
  assert.match(flat(section(text, 'Never')), /\*\*Never report an acceptance with a check not run and unexplained,\*\* or with a state not driven and unexplained\./);
  assert.match(KIT.usage('scripts/accept.mjs'), /a check with no result is listed as not run, after the failed\s+ones and before the passed, and counted/);
  assert.ok(headings(read('templates/package/08-acceptance/REPORT.md')).includes('The checks'));

  // driving.md: the long form, each step as the in-page file and the script give it.
  const driving = stageRef('acceptance', 'driving.md');
  assert.deepEqual(headings(driving), ['Before the first state', 'When the project keeps no driver', 'Accounts, data and secrets', 'A state: reach it, check it, photograph it', 'The table of the checks', 'The checks made by hand']);
  const state = flat(section(driving, 'A state: reach it, check it, photograph it'));
  assert.deepEqual(boldSteps(section(driving, 'A state: reach it, check it, photograph it')).map(([, name]) => name), ['Group its checks by width and theme', 'Set the screen as the check was written:', 'Reach the state by its row of `STATES.md`,',
    'Stay at the top of the page', 'Evaluate the in-page file', 'Call `window.__uxAccept(checks)`', 'Have the driver write what came back,', 'Read the console,', 'Photograph the state,']);
  assert.match(state, /the group's width, 900 px high, as on the prototype; its theme, by the browser's colour scheme; reduced motion/);
  assert.match(KIT.usage('scripts/accept.mjs'), /with\s+reduced motion set, 900 px high/);
  assert.match(state, /\*\*Stay at the top of the page\.\*\* Do not scroll before the checks: `in-viewport` asks about the first screen, and an element that sticks is misjudged after a scroll/);
  assert.match(readFileSync(INPAGE, 'utf8'), /Measure at the top of the page: an element that sticks may be misjudged after a scroll/);
  assert.match(state, /It defines `window\.__uxAccept`, changes nothing on the page, and may be evaluated as often as you like/);
  assert.match(state, /It returns one result for each, in order: `id`, `pass`, `actual`, `message`\. It never throws: a check that cannot be made is a failed result that says why/);
  assert.match(readFileSync(INPAGE, 'utf8'), /window\.__uxAccept\(checks\) → \[\{ id, pass, actual, message \}\], one result per check, in order/);
  assert.match(state, /One file for each state: `<package>\/08-acceptance\/results\/<state>\.json`, one list, the results of each of its groups one after another\. Where two screens have a state of the same name, the file is `<screen>-<state>\.json`\. Nothing is retyped, and no result is corrected/);
  assert.match(state, /`<package>\/08-acceptance\/shots\/<page>-<width>-<theme>\.png`, `<page>` being the name of the state's page in `prototype\/` without its extension\. The build's picture and the reference picture of the same state then carry the same name, in two folders/);
  assert.match(state, /A check is run once\. When a state is driven again, after a fix or an accepted deviation, its file is written again, whole: two results for one check are a refusal of the report/);
  assert.match(KIT.usage('scripts/accept.mjs'), /A result no check has, or two results for one\s+check, is a refusal\. A check not run does not change the exit code/);
  const tabled = flat(section(driving, 'The table of the checks'));
  assert.match(tabled, /\*\*A check not run does not change the exit code,\*\* so read the count, not the code/);
  assert.match(tabled, /\*\*Every check not run is explained, or run\.\*\*/);
  assert.match(tabled, /\*\*`cannot be told:` and `cannot be measured:`\*\* in a result's message are not a pass and not a deviation/);
  // The checks no script makes are made through the driver, written down as what was done and seen; what no driver can make is said not run.
  const hand = flat(section(driving, 'The checks made by hand'));
  assert.match(hand, /you write down what you did and what you saw, never an opinion: `<package>\/08-acceptance\/by-hand\.md`/);
  assert.match(hand, /\*\*A screen reader,\*\* and anything else no driver can make, is listed as not run, with that reason\. It is his to make, or to waive in his words/);
  assert.match(flat(read('templates/package/07-handoff/ACCEPTANCE.md')), /Then those made by hand in the build, each with what holding looks like: keyboard alone, a screen reader, text at 200%, reduced motion/);
});

test('acceptance: an account is named by its role; no password, token or key is written or printed anywhere; pictures are of seeded data; the machine is shared', () => {
  const text = stageSkill('acceptance');
  const driving = stageRef('acceptance', 'driving.md');
  const start = stepOf(section(text, 'Steps'), 'Start the build and sign in, the way the project says');
  assert.match(start, /`STATES\.md` names an account by its role, and says where its sign-in is kept: the driver takes it from there\. Use seeded or test data, and nothing else/);
  assert.match(start, /"How a browser check is run here" how it is looked at: headless, reduced motion set/);
  assert.match(stepOf(section(text, 'Steps'), 'Read the handoff folder'), /\*\*If a file holds a password, a token or a key, say where, never what, and stop\.\*\*/);
  const never = flat(section(text, 'Never'));
  assert.match(never, /\*\*Never write, print or copy a password, a token or a key:\*\* not into the package, a results file, a picture's name, a brief or a command line\. An account is named by its role and where its sign-in is kept\. Never open a keys file, and never print the environment/);
  assert.match(never, /\*\*Never photograph a real person's data\.\*\* A picture that would show it is not taken, and the report says so/);
  const secrets = flat(section(driving, 'Accounts, data and secrets'));
  inOrder(secrets, [/\*\*An account is named by its role,\*\* as "the front-desk account of the test clinic", and `STATES\.md` or the project profile says where its sign-in is kept\. The project's own driver takes the sign-in from there: a driver you wrote opens files, and signs in nowhere\. You never read it out, type it on a command line, print it, or write it anywhere/,
    /\*\*Nothing that signs in is written down\.\*\* Not in a results file, a picture's name, a brief, the report or `by-hand\.md`/, /the address is written as its route, without the query, and the driver is not asked to print the address it opened/,
    /\*\*A credential found in a file\*\* .* is not copied and not repeated: tell the founder which file and which line, say that it is exposed and should be changed, and stop until the file no longer holds it/,
    /\*\*Seeded or test data only\.\*\* .* If a picture or a result would show a real person's data, it is not taken/, /\*\*Never open a keys file,\*\* and never print the environment, to find out why a sign-in failed/], 'accounts and secrets');
  // The templates the builder fills say the same: a role, where the sign-in is kept, and never the credential.
  for (const file of ['build/STATES.md', 'build/BUILD.md']) assert.match(flat(read(`templates/package/${file}`)), /No password, token or key is ever written/, file);
  assert.match(flat(read('templates/project/PROFILE.md')), /The account it uses, named by its role, with where its sign-in is kept/);
  // No file of either skill holds anything that looks like a credential, or a line that prints the environment.
  for (const name of LAST_TWO) {
    for (const [file, body] of Object.entries(folderOf(name))) {
      assert.doesNotMatch(body, /printenv|password\s*[:=]|token\s*[:=]|Bearer |\bsk-[A-Za-z0-9]{8}/, `${name}/${file}`);
      // No command of either skill takes a flag that could carry a secret.
      for (const command of commandsOf(body)) assert.doesNotMatch(command, /--(?:key|token|password|secret|endpoint)\b/, `${name}/${file}: ${command}`);
    }
  }
  // Ruling 5, a shared machine: a browser only through the kit's scripts or the project's own driver, three at most, nothing stopped by name.
  const before = flat(section(driving, 'Before the first state'));
  assert.match(before, /\*\*The driver is the project's\.\*\* Headless, with reduced motion set\. The kit's picture script and its `prototype` command open files: they are not for a build that needs a session or a server\. For a build that opens as files they are not forbidden/);
  assert.match(before, /\*\*One browser, one state at a time\.\*\* Never more than three browsers at once on the machine, the kit's scripts and the seats counted, and no process is ever stopped by its name or by a pattern/);
  assert.match(before, /What you start, you stop yourself, through your own handle, when the stage ends/);
  assert.match(never, /\*\*Never stop a process by name or by pattern,\*\* or start a browser other than through the kit's scripts or the project's own driver: three at once, at most/);
  assert.match(flat(section(stageSkill('handoff'), 'Never')), /\*\*Never stop a process by name or by pattern,\*\* or start a browser other than through the kit's scripts: three browser-driving commands or seats at once, at most/);
  assert.match(flat(reference('loop.md')), /you never have more than three browser-driving seats or scripts running at once/);
});

// What a card's `reads` allows, as a seat's hand-over names it at Acceptance: the approved design is the handoff folder's.
const HANDED_AT_ACCEPTANCE = Object.freeze({
  intent: /`<package>\/02-intent\.md`, the intent/, context: /`<package>\/01-context\.md`, the context/, 'product-facts': /The project's facts document/, 'states-and-rules': /`SPEC\.md`/, strings: /`strings\.json`/,
  'final-screens': /`prototype\/`/, tokens: /`tokens\.css`/, 'design-system': /What the project says of its design system/, pictures: /the pictures of the build/i,
  build: /What the builder wrote back/, 'component-source': /The component source: the folder the project profile names under `components`/, profile: /profession's profile, whole/, person: /\bher card\b/i, 'profile-traits': /Her profession's traits/,
});
// What a card may read that Acceptance does not hand it: it belongs to an earlier stage, or is named apart, for every judge. The
// plain prototype was Detail's read: at Acceptance the pages a seat may open are the final screens, in the folder's `prototype/`.
const NOT_AT_ACCEPTANCE = Object.freeze(['brief', 'options', 'current-screens', 'chosen-structure', 'prototype', 'sibling-surfaces', 'fresh-marks', 'earlier-ledger', 'example-data']);
const KEPT_OUT_AT_ACCEPTANCE = Object.freeze({
  'maker-notes': /`<package>\/work\/`/, 'author-map': /`<package>\/04-structure\/MAP\.sealed\.json` and `<package>\/06-look\/BESIDE\.sealed\.json`, the author maps/, 'other-ledgers': /every file of `<package>\/08-acceptance\/reads\/` but its own/,
  'task-reads': /the audience's read is in it|every file of `<package>\/08-acceptance\/reads\/` but its own/, intent: /`<package>\/02-intent\.md`/, package: /every other file of the package/, 'handoff-folder': /`<package>\/07-handoff\/`, the handoff folder, whole/,
  build: /`<package>\/build\/`, and the build itself, running or as source/, profile: /her profession's profile itself/, 'describers-brief': /the board and the proposals of `<package>\/04-structure\/`/, 'states-and-rules': /`<package>\/07-handoff\/`, the handoff folder, whole/,
  strings: /`<package>\/07-handoff\/`, the handoff folder, whole/, prototype: /`<package>\/07-handoff\/`, the handoff folder, whole/,
});

test('acceptance: the seats are the cast sheet\'s; a judge is handed pictures of the build and the results, reads cold, then opens its earlier ledger; the task reader is handed pictures only', () => {
  const text = stageSkill('acceptance');
  const readers = stepOf(section(text, 'Steps'), 'Start the readers');
  // Ruling 13.
  inOrder(readers, [/The judges of the cast sheet's "Acceptance" table, each a fresh sub-agent on what its line names, in one message; then one audience, the task reader that table seats/,
    /A judge is handed pictures of the build and the results, reads them cold, and only then opens its seat's earlier ledger/, /The task reader is handed pictures only, her card and her profession's traits/,
    /`references\/seats\.md` has each hand-over and each "Do not open" list\. Each writes one file in `<package>\/08-acceptance\/reads\/`\. No reader drives the build/], 'the readers');
  const seats = stageRef('acceptance', 'seats.md');
  assert.deepEqual(headings(seats), ['The judges', 'The audience']);
  const cards = cardsAt('acceptance');
  assert.deepEqual(seatSections(seats), ['judge.usability', 'judge.truth', 'judge.words', 'judge.accessibility', 'judge.visual-craft', 'judge.system-fidelity', 'judge.profile', 'audience.task-reader']);
  assert.deepEqual([...seatSections(seats)].sort(), Object.keys(cards).sort());
  assert.ok(!cards['judge.cold-implementer'] && Object.values(cards).every(card => card.shelf !== 'maker'), 'no maker and no cold implementer sits at Acceptance');
  const top = flat(seats.slice(0, seats.indexOf('\n## ')));
  assert.match(top, /A brief hands a seat what its card's `reads` allows and this page lists, each file by its absolute path, and lists under "Do not open" what its card's `never-reads` names, as this package holds it/);
  assert.match(top, /The seats are those of the cast sheet's "Acceptance" table, each on the model and the effort its line names: a dash means the session's model, and you enforce none/);
  assert.match(top, /\*\*You name a file you may not open\.\*\* The intent, the context and a seat's earlier ledger are handed over by their paths, as the package's layout gives them\. You do not read them to write a brief/);
  // The vocabulary's `build`: what the builder wrote back, pictures of each state, and the results of the checks run in it.
  assert.match(flat(read('pool/CARD-FORMAT.md')), /\| `build` \| The built interface at Acceptance: what the builder wrote back \(what was built and where, how to reach each state, what deviates\), the files it built or changed, pictures of each state, and the results of the acceptance checks run in it\. \|/);
  for (const named of [/"The pictures of the build" are `<package>\/08-acceptance\/shots\/`/, /"The approved pictures" are `<package>\/07-handoff\/prototype\/shots\/`: the reference picture of the same state carries the same name/,
    /"The results" are `<package>\/08-acceptance\/checks\.md`, the table of every check, failed, not run and passed, and `<package>\/08-acceptance\/by-hand\.md`, the checks made by hand/,
    /"What the builder wrote back" is `<package>\/build\/BUILD\.md`, `<package>\/build\/STATES\.md` and `<package>\/build\/DEVIATIONS\.md`/,
    /"The approved design" is, in `<package>\/07-handoff\/`: `SPEC\.md`, the states and the rules; `strings\.json`, the strings with their why-lines; `prototype\/`, the final screens, with the measured values in `ACCEPTANCE\.md` and the changes to the system in `PARTS\.md`; and `tokens\.css`/,
    /A seat is handed those files, and never the project profile/]) assert.match(top, named);
  const common = forAll(section(seats, 'The judges'));
  assert.match(common, /The judges are started in one message, once the table of the checks is built and every state is photographed, so that no ledger exists while another judge reads\. None drives the build/);
  assert.match(common, /`<seat>`, in the name of a reader's file, is the seat's id, and a seat that is loaded adds what it is loaded with, so that no two readers share a file: `judge\.usability`, `judge\.profile-<name>` for each profession's profile, `audience\.task-reader-<name>-<language>` for the person and her language/);
  // Named as Detail names its readers' files.
  assert.match(flat(stageRef('detail', 'seats.md')), /`judge\.usability`, `judge\.profile-<name>` for each profession's profile, `audience\.task-reader-<name>-<language>` for each person and language/);
  // Cold first, then the seat's earlier ledger, found without opening a reads folder: by the coverage page of the handoff folder.
  assert.match(common, /\*\*Each judge reads cold first, then opens its seat's earlier ledger\.\*\* Its brief says this is the seat's first read of the build, and names one file more: the ledger its seat wrote at the last stage it read at, in that stage's reads folder/);
  assert.match(common, /The "Seats" table of `<package>\/07-handoff\/COVERAGE\.md` shows which stage that is: `<package>\/06-look\/reads\/<seat>\.md`, `<package>\/05-detail\/reads\/<seat>\.md` or, for a seat that last read the options, `<package>\/04-structure\/reads\/<seat>\.md`, with its re-read beside it, `<seat>-reread\.md`, where there is one/);
  // M6: each seat that sits at Acceptance sat at one of those three stages before, or at none.
  for (const [id, card] of Object.entries(cards)) assert.ok(card['sits-at'].some(stage => ['structure', 'detail', 'look'].includes(stage)), id);
  assert.match(common, /It opens them only after it has read the build and written its findings, and then marks each earlier finding \*fixed\*, \*partly\* or \*still present\* in the build/);
  assert.match(common, /A seat that never read before has no earlier ledger, and its brief names none/);
  for (const path of ['<package>/work/', `<package>/04-structure/${MAP}`, '<package>/06-look/BESIDE.sealed.json', '<package>/04-structure/CHOSEN.md', '<package>/DECISIONS.md', '<package>/03-cast.md', '<package>/08-acceptance/reads/', '<package>/07-handoff-gate/',
    '<package>/07-handoff/COVERAGE.md', '<package>/08-acceptance/REPORT.md', '<package>/08-acceptance/FIXES.md', '<package>/08-acceptance/decision.json', '<package>/08-acceptance/decision.html', '<package>/04-structure/earlier/', '<package>/06-look/fresh/',
    '<package>/06-look/beside/']) assert.ok(common.includes(`\`${path}\``), path);

  for (const [id, card] of Object.entries(cards)) {
    const part = subsection(seats, `\`${id}\``);
    const said = leads(part);
    for (const lead of ['Its brief', 'Handed', 'Do not open', 'Writes']) assert.ok(said[lead], `${id}: ${lead}`);
    assert.ok(said['Its brief'].includes(`\`templates/briefs/${card.shelf}.md\``), `${id}: its brief`);
    // What its card reads and Acceptance has, it is handed.
    for (const token of card.reads) {
      if (NOT_AT_ACCEPTANCE.includes(token)) continue;
      assert.ok(HANDED_AT_ACCEPTANCE[token], `${id}: ${token} has no hand-over the test knows`);
      assert.match(said.Handed, HANDED_AT_ACCEPTANCE[token], `${id}: reads ${token}`);
    }
    // What its card does not read, it is not.
    for (const [token, handed] of Object.entries(HANDED_AT_ACCEPTANCE)) {
      if (card.reads.includes(token)) continue;
      assert.doesNotMatch(said.Handed, handed, `${id}: is handed ${token}, which its card does not read`);
    }
    // What its card never reads is listed in its brief.
    const closed = `${flat(part)} ${common}`;
    for (const token of card['never-reads']) {
      assert.ok(KEPT_OUT_AT_ACCEPTANCE[token], `${id}: ${token} has no place the test knows`);
      assert.match(closed, KEPT_OUT_AT_ACCEPTANCE[token], `${id}: never reads ${token}`);
    }
    assert.match(said['Do not open'], /^the list above/, id);
    assert.match(said.Writes, /`<package>\/08-acceptance\/reads\/<seat>\.md`, in the shape of `templates\/outputs\/(?:LEDGER|TASK-READ)\.md`/, id);
    // Every judge that reads the build is handed the results; the pictures go to those whose card reads pictures.
    if (card.reads.includes('build')) assert.match(said.Handed, /The results/, `${id}: the results`);
  }
  // The profile judge reads the build as pictures: its card reads neither the build nor the results.
  assert.ok(!cards['judge.profile'].reads.includes('build'));
  const profile = leads(subsection(seats, '`judge.profile`'));
  assert.doesNotMatch(profile.Handed, /The results|What the builder wrote back/);
  assert.match(profile['Do not open'], /And the build itself, its files, the results and what the builder wrote back: it reads the build as pictures/);
  assert.match(flat(read('pool/judges/profile.md')), /At \*Acceptance\* you read the build, as pictures/);
  // The accessibility judge does not drive the build, as its card says.
  assert.match(leads(subsection(seats, '`judge.accessibility`'))['Its brief'], /It says the seat is handed the pictures and the results, and does not drive the build/);
  assert.match(flat(read('pool/judges/accessibility.md')), /At \*Acceptance\* your brief hands you the build's pictures, its files as built, and the results of the checks and of what was done by hand: you do not drive it, and what nobody measured was not looked at/);
  // The system fidelity judge reads the files its brief lists as built or changed.
  assert.match(leads(subsection(seats, '`judge.system-fidelity`'))['Its brief'], /It lists the files of the build, each by its path, as "Where it lives" of `BUILD\.md` gives them: built or changed\. A settings file, and any other file that holds a sign-in, is left off the list, and the brief names it under "Do not open"/);
  assert.match(flat(read('pool/judges/system-fidelity.md')), /\*Acceptance\* you read the build: the files your brief lists as built or changed/);
  assert.ok(headings(read('templates/package/build/BUILD.md')).includes('Where it lives'));
  // One audience read: the task reader, pictures only, her card and her profession's traits; never the intent, the handoff folder or the build.
  const audience = forAll(section(seats, 'The audience'));
  assert.match(audience, /One read, after the judges: the task reader the cast sheet's "Acceptance" table seats, as the person its line is loaded with, `person\.<name>`\. Where the table seats none, nobody reads as her, and the report says so/);
  const reader = leads(subsection(seats, '`audience.task-reader`'));
  assert.match(reader['Its brief'], /her tasks, copied word for word from "Tasks for the audience" of the intent/);
  // M7: a person of the kit has no line on a carry list: her card is in the kit's own pool, by her id.
  assert.match(flat(section(stageSkill('cast'), 'Gate')), /for each card and each person of the project's own that sits: a card of the kit is found in the kit, by its id/);
  assert.ok(existsSync(at('pool/persons/first-timer.md')));
  assert.match(reader.Handed, /^her card, by the path the cast sheet's carry list names, or, for a person of the kit, who has no line there, in the kit's `pool\/persons\/`, by the id her line of the table gives\. Her profession's traits: a copy of her profession's profile with every `So the interface must:` field removed, written beside the brief as the loop says, and the one file of `<package>\/work\/` she opens/);
  assert.match(reader.Handed, /each by its path, as `<package>\/08-acceptance\/shots\/today-default-en-390-light\.png`\. The pictures, and pictures only/);
  assert.deepEqual(cards['audience.task-reader'].reads, ['brief', 'person', 'profile-traits', 'pictures']);
  for (const kept of ['intent', 'package', 'handoff-folder', 'build', 'profile']) assert.ok(cards['audience.task-reader']['never-reads'].includes(kept), kept);
  assert.match(reader.Writes, /`audience\.task-reader-<name>-<language>\.md`\. With one build to read, its ranking reads "no ranking: one option"/);
  assert.match(read('templates/outputs/TASK-READ.md'), /With one option: "no ranking: one option"/);
  assert.ok(nevers(text).includes('Never hand an audience a page, its source, a result or a ledger'));
});

test('acceptance: each item matches or deviates and he decides each; an accepted deviation is logged and the folder brought up to date; a fix goes out as a slice; the lessons are appended before the stamp', () => {
  const text = stageSkill('acceptance');
  const steps = section(text, 'Steps');
  const report = stepOf(steps, 'Write the report, item by item');
  assert.match(report, /One row for each success criterion, each state, each entry of `DEVIATIONS\.md`, and each difference a reader found: \*matches\* or \*deviates\*, with the check's id or the picture that shows it/);
  assert.match(report, /So does a deviation the builder wrote down, however reasonable\. Where two seats disagree, both are written, each in its words/);
  assert.deepEqual(headings(read('templates/package/08-acceptance/REPORT.md')), ['What was read', 'The checks', 'Item by item', 'What the readers found', 'Deviations accepted', 'Fixes sent out', 'Lessons', 'Reviewed by the founder']);
  const page = stepOf(steps, 'Build the decision page');
  assert.match(page, /the build as its one option, with two of its pictures named from the page, the phone width first, as `shots\/today-default-en-390-light\.png`; one line for each seat that read; each deviation under `findings`, by what found it, a seat, `check: <id>` or `by hand`; one recommendation, resting on the reads; one question: the list of the deviations, or, with none, whether he accepts the build\. The option's line gives the count of the checks, and says what they do not see: nothing is pressed, loaded, sent or focused, so the keyboard pass and the builder's deviations stand beside the count\. Its identity is as `status` prints it, at stage 9 of 9/);
  assert.equal(STAGES.indexOf('acceptance') + 1, STAGES.length);
  const gate = flat(section(text, 'Gate'));
  inOrder(gate, [/^ \*\*He accepts\.\*\* Put `<package>\/08-acceptance\/decision\.html` in front of him, with `checks\.md` and the pictures/, /\*\*Each deviation is his to decide: is it accepted as built, or fixed\?\*\* The list is one question: the deviations numbered, each with what follows from each answer, answered by number in one message/,
    /Record it, write his answers into `REPORT\.md` as he said them, and put the stage back in work with the `begin` of step 1\. One he leaves unanswered stays open, and is asked again/, /state\.mjs await <package> acceptance --question/,
    /\*\*A deviation he accepts\*\* is written under "Deviations accepted", in his words, and appended to the package's `DECISIONS\.md` and to the folder's own/,
    /Then the handoff folder is brought up to date, so that the design on disk is what shipped and no file of it contradicts another: the check is rewritten to hold the build as accepted, and run again/,
    /`references\/deviations\.md` has every file it touches, and how a stamped `HANDOFF\.md` is changed/,
    /\*\*A deviation to fix\*\* goes out in `<package>\/08-acceptance\/FIXES\.md`, written like a slice of the handoff: \*Context · Task · Done when · Verify\*, so that any session can take it knowing nothing else\. You do not build it\. \*\*The stage is not stamped while a fix is out:\*\*/,
    /\*\*A fix the size of a correction,\*\* a wrong label, token or spacing value, may be applied by you, after his nod on a picture of before and after, and never before\. Its state is then checked again/,
    /\*\*When no deviation is left undecided and no fix is out,\*\* ask the last question, with the same `await`: do you accept this build\? \*\*Stop: you do not accept it, and you go no further without his words\.\*\*/,
    /\*\*Append the lessons\*\* to `<packages>\/LESSONS\.md`, as `skills\/design\/references\/lessons\.md` says, with the row for each seat whose finding changed a decision, and the model it ran on/,
    /Write the entry from the handoff's `COVERAGE\.md` and `DECISIONS\.md`, this stage's reads and the state, never from memory\. Name it under "Lessons" of `REPORT\.md`, before the stamp/,
    /state\.mjs stamp <package> acceptance --words/, /Then append the decision to the package's `DECISIONS\.md`, and ask the state what is next, as step 9 of the loop says\. It prints `none`: the design is done/], 'the gate');
  for (const label of ['**Context.**', '**Task.**', '**Done when.**', '**Verify.**']) assert.ok(read('templates/package/08-acceptance/FIXES.md').includes(label), label);
  assert.match(flat(reference('lessons.md')), /\*\*Seats whose findings changed a decision\.\*\* One row for each, with the model it ran on/);
  assert.match(flat(reference('lessons.md')), /`LESSONS\.md`, in the folder that holds the project's packages, beside the project profile/);
  // What it must never do: build, decide, bend a check, or touch a stamped output.
  for (const never of ['Never implement, mend or restyle the build', 'Never settle a deviation yourself', 'Never edit a stamped output as it stands:', 'Never change a check to make a build pass', 'Never tell a judge what to find', 'Never ask two things at once']) {
    assert.ok(nevers(text).includes(never), never);
  }
  assert.match(flat(section(text, 'Never')), /\*\*Never edit a stamped output as it stands:\*\* `HANDOFF\.md`, or an earlier stage's\. Where an accepted deviation makes one false, it is reopened first: `references\/deviations\.md`/);
  // M2: deviations.md. An accepted deviation is logged in the package's decisions and in the folder's own, every file of the folder that
  // it makes false is brought to the build, the check is rewritten to hold the build as accepted, and a stamped HANDOFF.md is reopened.
  const deviations = stageRef('acceptance', 'deviations.md');
  assert.deepEqual(headings(deviations), ['He accepts it', 'He wants it fixed', 'A fix the size of a correction']);
  const accepted = section(deviations, 'He accepts it');
  assert.deepEqual(boldSteps(accepted).map(([, name]) => name), ['Write it in the report,', 'Log it, twice', 'Bring the folder\'s files up to date,', 'Run the changed check again,', 'A page of `prototype/` is never redrawn here']);
  inOrder(flat(accepted), [/after this, the handoff folder describes what shipped, and no file of it contradicts another/, /Append it to the package's `DECISIONS\.md`, in the shape of `templates\/package\/DECISIONS\.md`, numbered after the last entry, which is the one entry of that file you read/,
    /And append it to the folder's own, `<package>\/07-handoff\/DECISIONS\.md`, in that file's shape, written out in full/, /it is also logged where `decisions-log` of the project profile says/,
    /the check, in `acceptance\.json`: rewritten to hold the build as accepted, never deleted\. A check of 44 by 44 on a booking action he accepted at 40 by 40 becomes one of 40 by 40/,
    /the item in `ACCEPTANCE\.md`: its new value, and beside it the line "the build as accepted differs from the page this names", with what differs and the day he accepted it/,
    /"Must not change" of `HANDOFF\.md` may name the very thing he has just accepted as changed\. It then says so, beside that item: "the build as accepted differs from the page this names", with what differs/,
    /`HANDOFF\.md` is stamped, so it is reopened first, changed, and stamped again\. His accepting the deviation is the yes a reopening needs, and its reason/,
    /Handoff now stands at a new version\. Write that version into `built-from` of `REPORT\.md`, as `status` prints it: a report built from the old one is refused at its own stamp/], 'an accepted deviation');
  assert.deepEqual(fencedLines(deviations), ['node <kit root>/scripts/state.mjs reopen <package> handoff --reason "<why>"', 'node <kit root>/scripts/state.mjs stamp <package> handoff --words "<the founder\'s words>"']);
  assert.match(flat(conductor()), /Three commands change where a design stands\. Each needs the founder's yes first/);
  assert.match(flat(section(deviations, 'He wants it fixed')), /Any session can take it knowing nothing else: it is handed `FIXES\.md` and the handoff folder, and nothing of the package besides/);
  assert.match(flat(section(deviations, 'A fix the size of a correction')), /\*\*After his nod, and never before, make the change:\*\* that one thing, in the file `BUILD\.md` names, and nothing beside it/);
  assert.match(flat(section(text, 'Never')), /\*\*Never ask two things at once,\*\* and never stamp while a fix is out/);
  // Every command it gives is one its script takes, in the order of the stage.
  assert.deepEqual([...new Set(stageCommands('acceptance'))].map(command => words(command).slice(1, 3).join(' ').replace('<kit root>/scripts/', '')),
    ['state.mjs begin', 'accept.mjs inpage', 'accept.mjs report', 'page.mjs <package>/08-acceptance/decision.json', 'state.mjs await', 'state.mjs stamp', 'state.mjs status', 'state.mjs reopen', 'state.mjs stamp']);
  // The two stamps are of two stages: its own, and the handoff an accepted deviation reopened.
  assert.deepEqual([...new Set(stageCommands('acceptance'))].filter(command => command.includes('state.mjs stamp')).map(command => words(command)[4]), ['acceptance', 'handoff']);
  // The other forms.
  const forms = stageRef('acceptance', 'forms.md');
  assert.deepEqual(headings(forms), ['Routed `short`: an adjustment', 'Sized `flow`: every surface, accepted once', 'Sized `correction`: one picture beside another', 'A fix that comes back']);
  assert.match(flat(steps), /\*\*Routed `short`\*\* \(an adjustment\), Acceptance is what changed, and no more\. \*\*Sized `flow`,\*\* every surface is driven, and it is accepted once\. \*\*Sized `correction`,\*\* it is one picture beside another, and the session that applied it accepts it\. \*\*A fix that comes back\*\* is checked again where it was\. `references\/forms\.md` has the four/);
  for (const size of ['adjustment', 'correction']) assert.equal(routeFor(size).acceptance, 'short', size);
  const short = flat(section(forms, 'Routed `short`: an adjustment'));
  assert.match(short, /^ Acceptance is what changed, and no more\./);
  assert.match(short, /\*\*One more thing is looked at: what was not meant to change\.\*\*/);
  const correction = flat(section(forms, 'Sized `correction`: one picture beside another'));
  // Ruling R149: no script checks a correction; it is compared by eye with the picture he nodded at; and the session that applied it accepts it.
  assert.match(correction, /\*\*The session that applied it accepts it\.\*\* The skill opens by saying you did not build what you read\. A correction is the one case where that does not hold: the session that conducts made the change after his nod, and the same session checks it/);
  assert.match(correction, /\*\*No seat is cast,\*\* so nobody reads, and no brief is written\. \*\*No script checks a correction:\*\* the handoff wrote no `acceptance\.json`, and there is no page of a prototype for a check to open\. Steps 4 to 6 and 8 of the skill are not run/);
  assert.match(correction, /\*\*Compare it with the "becomes" side, by eye:\*\* the one thing reads, or measures, as the paragraph says it becomes, and nothing else on the screen moved from the picture he nodded at/);
  assert.match(correction, /\*\*One item in the report:\*\* the change, \*matches\* or \*deviates\*, with the two pictures that show it: the one he nodded at, and the one as built\. "The checks" says that no script checks a correction, and that it was compared by eye/);
  assert.doesNotMatch(correction, /run it as steps 4 and 5/);
  assert.match(correction, /\*\*When it matches, his nod covers it\.\*\* A correction costs one nod\. Write under `## Reviewed by the founder` that the build is what he nodded at, with the words of that nod as `HANDOFF\.md` has them, show him the picture as built, and stamp with those words/);
  assert.match(correction, /\*\*When it deviates, it is his to decide,\*\* by the one question of the skill's gate: accepted as built, or put right\? You put right only what the correction was/);
  const back = section(forms, 'A fix that comes back');
  assert.deepEqual(boldSteps(back).map(([, name]) => name), ['Read what changed in `<package>/build/`:', 'Drive the states the fix names, and no others,', 'Build the table again,', 'One re-read, by the seat that found it:', 'Bring the report up to date:']);
  assert.match(flat(back), /The stage was left in work, unstamped/);
  assert.match(flat(back), /It writes `<package>\/08-acceptance\/reads\/<seat>-reread\.md`, beside the first and never over it/);
  assert.match(flat(back), /A fix that did not hold is a deviation again, and his to decide again: you never send the same fix out twice without asking/);
});

test('the implementer\'s guide stands alone: what the folder is, the order to read it in, the three rules, the four rules of building, the measuring loop, the three files to write back, and never a credential', () => {
  const text = guide();
  assert.deepEqual(headings(text), ['Read it in this order', 'Three rules you keep', 'Four rules of building', 'Work the way the project works', 'The loop: look, measure, fix one thing', 'What you write back', 'Accounts, data and secrets', 'On a shared machine', 'When you are done']);
  const opening = flat(text.slice(0, text.indexOf('\n## ')));
  // Ruling 6: it is read by a session that has never seen the pipeline, and says what the folder is.
  assert.match(opening, /You have been handed one folder, and this page is in it\. The folder is a finished design/);
  assert.match(opening, /You were not there, and you do not need to have been: what you need is in this folder\. Your job is to build what it shows, in the project's own components, and to say plainly where you could not/);
  assert.match(opening, /Besides this folder you open the project's own source, which you build in, and nothing else/);
  // The order: every file the handoff's own table lists, each once, the entry first.
  const order = section(text, 'Read it in this order');
  const listed = tableRows(section(read('templates/package/07-handoff/HANDOFF.md'), 'What is in this folder')).slice(2).flatMap(([file]) => file.split(', ').map(unspan)).filter(file => file !== 'strings.*' && file !== 'IMPLEMENTER-GUIDE.md');
  let last = -1;
  for (const file of listed) {
    const found = order.indexOf(`\`${file}\``);
    assert.ok(found > last, `${file} is in the reading order, in the folder's own order`);
    last = found;
  }
  assert.match(flat(order), /1\. `HANDOFF\.md`: the entry\./);
  assert.match(flat(order), /5\. The strings file `HANDOFF\.md` names/);
  assert.match(flat(order), /Where two files disagree, or the folder is silent about something that is neither decided nor left to you, ask whoever handed you the folder\. Do not pick one, and do not carry on by assuming/);
  // The three rules of the design's § 13, as HANDOFF.md states them.
  const three = flat(section(text, 'Three rules you keep'));
  inOrder(three, [/1\. \*\*Keep the stable ids\.\*\* Every `data-ux` and `data-screen` of the prototype is on the same element of your build, with the same value/, /2\. \*\*Build every state\.\*\* Every row of every "States" table in `SPEC\.md`, not only the ordinary one/,
    /3\. \*\*Do not redesign\.\*\* .* What cannot be built as drawn is built as near as it can be, and written down in `DEVIATIONS\.md`\. It is decided afterwards, by the person who approved the design, and not by you/], 'the three rules');
  const constraints = flat(section(read('templates/package/07-handoff/HANDOFF.md'), 'Constraints'));
  for (const rule of [/Keep every stable id/, /Build every state in `SPEC\.md`/, /Do not redesign/]) assert.match(constraints, rule);
  // The four rules ported from version 1.
  assert.deepEqual(text.split('\n').filter(line => line.startsWith('### ')), ['### 1 · Never guess a component\'s interface', '### 2 · Tokens, never raw values', '### 3 · Build every state the spec lists', '### 4 · Translate the prototype, never paste it']);
  const four = flat(section(text, 'Four rules of building'));
  assert.match(four, /`PARTS\.md` names the component for each element and the file it was read in\. Before you write any use of a component you are not certain of, open that file, or the project's registry if it has one, and read the real interface/);
  assert.match(four, /If the design needs a value the system lacks, `PARTS\.md` lists it under "Changes to the system", with its definition: add it to the system as written there, then use it/);
  assert.match(four, /Empty for the first time, and empty because a filter left nothing: two states, with different words/);
  assert.match(four, /A row that reads "cannot occur" is honoured: build nothing for it\. A state you meet that the spec does not list is not yours to invent/);
  assert.match(four, /Read it for layout, order, spacing, emphasis and words\. Then build the same thing from the project's components and tokens\. Only the ids travel as they are/);
  // The loop: measure, do not trade adjectives; one fix, one look.
  const loop = section(text, 'The loop: look, measure, fix one thing');
  assert.equal(boldSteps(loop).length, 9);
  assert.match(flat(loop), /7\. \*\*Measure\. Do not trade adjectives\.\*\* "A bit tighter" and "closer to the picture" do not converge, because nobody named a number\. Read the computed values in the page, as below, and compare them with "Measured values" in `ACCEPTANCE\.md`/);
  assert.match(flat(loop), /8\. \*\*Fix one thing, then look again\.\*\*/);
  assert.ok(fencedLines(loop).includes('const el = document.querySelector(\'[data-ux="book-action"]\');'));
  assert.ok(headings(read('templates/package/07-handoff/ACCEPTANCE.md')).includes('Measured values'));
  assert.match(flat(loop), /A check you could not make hold is a deviation, written down\. It is never a check quietly left alone/);
  // The three files, each with what it holds, where HANDOFF.md says; and what comes after.
  const back = section(text, 'What you write back');
  assert.deepEqual(tableRows(back).slice(2).map(([file]) => file), ['`BUILD.md`', '`STATES.md`', '`DEVIATIONS.md`']);
  assert.match(flat(back), /Three short files, where `HANDOFF\.md` says, under "What you write back"\. Each is already there as a page to fill/);
  assert.match(flat(back), /A state with no row cannot be reached, and its checks cannot be run: a build with a state missing from the map is not finished/);
  assert.ok(headings(read('templates/package/07-handoff/HANDOFF.md')).includes('What you write back'));
  // Accounts by role, never their credentials; pictures on seeded data; a shared machine.
  const secrets = flat(section(text, 'Accounts, data and secrets'));
  inOrder(secrets, [/\*\*An account is named by its role,\*\* as "the front-desk account of the test clinic", with where its sign-in is kept\. No password, token or key is ever written: not in `STATES\.md` or `BUILD\.md`, not in a commit message, not in a picture's name, not on a command line you write down/,
    /\*\*An address is written without anything that signs in\.\*\*/, /\*\*Pictures are taken on seeded or test data\.\*\*/, /\*\*Never print the environment,\*\* and never open a file of keys to look for a reason/], 'accounts and secrets');
  assert.match(flat(section(text, 'On a shared machine')), /Stop only the server and the browser you started yourself, through your own handle\. Never stop a process by its name or by a pattern/);
  // It names no file outside the handoff folder: nothing of the kit, of the package or of the pipeline that made the design.
  assert.deepEqual(kitPaths(text), []);
  assert.doesNotMatch(text, INTO_THE_PACKAGE);
  assert.doesNotMatch(text, /\bux:|\bthe (?:kit|pipeline|conductor|cast)\b|\bStructure\b|\bLook\b|ledger/);
  // The one word of the pipeline it explains is the one the builder will meet on the pages it fills.
  assert.match(flat(text), /is decided by the person who approved the design: the pages you fill call him the founder/);
  assert.match(flat(read('templates/package/build/DEVIATIONS.md')), /the founder decides each at Acceptance/);
  assert.ok(!named(text) && !/profile/i.test(text));
  const inFolder = new Set(['HANDOFF.md', 'SPEC.md', 'PARTS.md', 'ACCEPTANCE.md', 'acceptance.json', 'DECISIONS.md', 'COVERAGE.md', 'prototype/', 'tokens.css', 'BUILD.md', 'STATES.md', 'DEVIATIONS.md']);
  for (const [, span] of text.matchAll(/`([\w./-]+\.(?:md|json|css)|[\w-]+\/)`/g)) assert.ok(inFolder.has(span), `the guide names \`${span}\`, which is not in the handoff folder`);
  // HANDOFF.md already points at it, and the handoff skill copies it in.
  assert.match(read('templates/package/07-handoff/HANDOFF.md'), /\| `IMPLEMENTER-GUIDE\.md` \| How to turn a prototype into the project's own components\. Read it before the first slice\. \|/);
});

test('the anti-patterns keep version 1\'s two lists, and add the six process failures this pipeline guards against, each with its rule', () => {
  const text = antiPatterns();
  assert.deepEqual(headings(text), ['Design anti-patterns', 'Process anti-patterns', 'What this pipeline guards against']);
  const names = name => tableRows(section(text, name)).slice(2).map(([first]) => /^\*\*(.+?)\*\*/.exec(first)[1]);
  // The two lists of version 1, entry for entry: fifteen and fourteen.
  assert.equal(names('Design anti-patterns').length, 15);
  assert.equal(names('Process anti-patterns').length, 14);
  for (const kept of ['Listing components in a brief', 'Specifying the layout', 'Designing the ordinary state only', 'Colour as the only signal', 'Two design systems']) assert.ok(names('Design anti-patterns').includes(kept), kept);
  for (const kept of ['Approval laundering', 'Gate inheritance', 'Confidence as evidence', 'Silent drift', 'The quiet re-decision', 'The dropped finding', 'Many fixes, one look']) assert.ok(names('Process anti-patterns').includes(kept), kept);
  // The six failures the brief names, each one row, with the rule that guards against it.
  const guarded = tableRows(section(text, 'What this pipeline guards against')).slice(2);
  assert.deepEqual(guarded.map(([first]) => /^\*\*(.+?)\*\*/.exec(first)[1]), ['A brief that prescribes the design.', 'A shortlist before the founder marks.', 'A judge that redraws.', 'A simulated read quoted as evidence.', 'A fresh screen handed off as it came.', 'A check skipped without a line saying so.']);
  for (const [failure, rule] of guarded) assert.ok(failure.length > 20 && rule.length > 40, failure);
  const rules = guarded.map(([, rule]) => rule);
  assert.match(rules[0], /A brief gives context, never the design/);
  assert.match(flat(reference('loop.md')), /A brief gives \*\*context, never the design\*\*/);
  assert.match(rules[1], /Every valid proposal reaches the board/);
  assert.match(flat(conductor()), /Every valid proposal reaches the board/);
  assert.match(rules[2], /A judge reports: .* It never fixes, redraws or approves/);
  assert.match(flat(reference('loop.md')), /A judge reports\. It does not fix, redraw or approve/);
  assert.match(rules[3], /Every task read opens with its caveat, word for word\. Only its ranking and its stuck points carry information, and a real person's read outranks it/);
  assert.match(read('templates/outputs/TASK-READ.md'), /only the ranking and the stuck points carry information/);
  assert.match(rules[4], /Nothing a fresh maker made is copied, carried on or handed off/);
  assert.match(rules[5], /Every ledger lists each check it did not run, with the reason\. The coverage page carries them to the builder, and a build is never reported accepted with a check not run and unexplained/);
  assert.ok(headings(read('templates/outputs/LEDGER.md')).includes('Checks not run'));
  // Version 1's own names for its phases and gates are gone: nothing here points at a file that no longer exists.
  assert.doesNotMatch(text, /\bG[0-4]\b|Phase \d|DESIGN-DECISIONS|surface brief/);
  assert.deepEqual(kitPaths(text), []);
  assert.ok(!named(text));
  assert.deepEqual(filesUnder('reference/'), ['ANTI-PATTERNS.md', 'IMPLEMENTER-GUIDE.md']);
});

test('Handoff and Acceptance run as written: the folder assembled from a package Look has stamped, its checks run on its own prototype by the kit\'s script, the cold implementer handed the folder alone, the build written back, and every check counted in the report', () => {
  const project = join(scratchRoot, 'a clinic at handoff');
  const pkg = join(project, 'design', 'today');
  mkdirSync(project, { recursive: true });
  const FILL = { '<kit root>/': fileURLToPath(root), '<packages>': 'design', '<package>': 'design/today', '<the founder\'s words>': 'adelante, a construir', '<the one question>': 'May this folder go to the session that builds it?' };
  const filled = (word, fill) => Object.entries(fill).reduce((text, [slot, value]) => text.split(slot).join(value), word.replace(/^"(.*)"$/, '$1'));
  // A command as a skill writes it, run from the project's root with each placeholder filled.
  const exec = (command, more = {}) => spawnSync(process.execPath, words(command).slice(1).map(word => filled(word, { ...FILL, ...more })), { cwd: project, encoding: 'utf8' });
  const run = (command, more) => {
    const done = exec(command, more);
    assert.deepEqual([done.status, done.stderr], [0, ''], `${command}\n${done.stdout}`);
    return done.stdout.trim();
  };
  // The one command of a stage's folder that starts with these words.
  const commandOf = (name, start) => {
    const found = [...new Set(stageCommands(name))].filter(command => command.startsWith(`node <kit root>/scripts/${start}`));
    assert.equal(found.length, 1, `${name}: one command that starts ${start}`);
    return found[0];
  };
  // Handoff's two proofs: the address check of step 3, alone, and the one that also reads for pointers back, which ends step 7.
  const ALONE = 'node <kit root>/scripts/alone.mjs <package>/07-handoff';
  const POINTERS = commandOf('handoff', 'alone.mjs <package>/07-handoff --package');
  assert.deepEqual([...new Set(stageCommands('handoff'))].filter(command => command.startsWith('node <kit root>/scripts/alone.mjs')).sort(), [ALONE, POINTERS]);
  const visible = name => !name.startsWith('.fuse_hidden');
  const list = folder => readdirSync(folder).filter(visible).sort();
  // Every file under a folder, by its path from it.
  const walk = (folder, inside = '') => readdirSync(join(folder, inside), { withFileTypes: true }).filter(entry => visible(entry.name))
    .flatMap(entry => (entry.isDirectory() ? walk(folder, join(inside, entry.name)) : [join(inside, entry.name)])).sort();
  const STATE = 'node <kit root>/scripts/state.mjs';
  // An output of a package: its template, with what it is built from, and its carry list where it has one.
  const write = (name, inputs, carry, base = pkg) => {
    const text = read(`templates/package/${ARTEFACT[name]}`);
    assert.ok(text.includes('\nbuilt-from: []\n'), name);
    mkdirSync(join(base, ARTEFACT[name], '..'), { recursive: true });
    writeFileSync(join(base, ARTEFACT[name]), `${text.replace('built-from: []', `built-from: ${inputs}`)}${carry ? `\n${carry.join('\n')}\n` : ''}`);
  };
  const STAMPED = name => new RegExp(`^stamped ${name} approved at version 1 on \\d{4}-\\d\\d-\\d\\d$`);
  // What a stage's output is built from, as its skill gives it, each stage at the version `status` prints.
  const standingAt = (name, more) => {
    const [, builtFrom] = /`built-from: (\[[^\]]*\])`/.exec(section(stageSkill(name), 'Writes'));
    const page = run(commandOf(name, 'state.mjs status'), more);
    return builtFrom.replace(/([a-z]+)@<version>/g, (_, stage) => `${stage}@${new RegExp(`^\\| ${stage} \\| \\w+ \\| [\\w-]+ \\| (\\d+) \\|`, 'm').exec(page)[1]}`);
  };

  // The package as Look leaves it: seven outputs approved, each carry list as its stage's skill gives it, so that Look's is what
  // the three stages before it carried on, five sections of the detail, the stage's own files and the token file.
  run(`${STATE} init <package> --design today --kind working-surface --foundation new-surface --size surface`);
  // S1 of the fix review: Frame starts the package's own DECISIONS.md, so a real package holds one at its root from the first stage on.
  copyFileSync(at('templates/package/DECISIONS.md'), join(pkg, 'DECISIONS.md'));
  const castCarry = [...['The person in the moment', 'The one job', 'Success criteria', 'Tasks for the audience', 'States', 'What the readers found'].map(heading => `- intent@1#${slug(heading)}`),
    ...['The people', 'What the product can show and do', 'Constraints', 'The founder\'s own words', 'The problem, and why now', 'What exists today', 'What it must not become'].map(heading => `- context@1#${slug(heading)}`),
    '- source:design/pool/persons/desk-cover.md', '- source:src/today/rooms.html'];
  const chosenCarry = [...castCarry, ...['Detail', 'Look', 'Handoff', 'Acceptance', 'Blind rules', 'Fresh pass'].map(heading => `- cast@1#${slug(heading)}`), '- source:design/today/04-structure/board/B.json', `- source:design/today/04-structure/${PICK}`];
  const detailCarry = [...chosenCarry, '- cast@1#structure', ...['The structure', 'What it is deliberately bad at', 'What the readers found'].map(heading => `- structure@1#${slug(heading)}`), '- source:design/today/04-structure/reads',
    ...['states.md', 'strings.json', 'prototype', 'shots', 'reads'].map(file => `- source:design/today/05-detail/${file}`), '- source:design/today/DECISIONS.md'];
  const lookCarry = [...detailCarry, ...['Rules', 'Edge cases', 'Data map', 'Dependencies', 'Strings', 'What the readers found'].map(heading => `- detail@1#${slug(heading)}`),
    ...['screens', 'shots', 'reads', 'measures.md', 'checks.json', 'results.json'].map(file => `- source:design/today/06-look/${file}`), '- source:design/kit/tokens.css'];
  for (const [name, inputs, carry] of [['frame', '[]', []], ['context', '[frame@1]', []], ['intent', '[context@1]', []], ['cast', '[intent@1, context@1]', castCarry], ['structure', '[cast@1, intent@1, context@1]', chosenCarry],
    ['detail', '[structure@1, cast@1, intent@1, context@1]', detailCarry], ['look', '[detail@1, structure@1, cast@1, intent@1, context@1]', lookCarry]]) {
    run(`${STATE} begin <package> ${name}`);
    write(name, inputs, carry);
    assert.match(run(`${STATE} stamp <package> ${name} --words "sí, adelante"`), STAMPED(name));
  }
  assert.equal(run(`${STATE} next <package>`), 'handoff');
  // Ruling 11: what the handoff's files need is on Look's carry list, line for line.
  for (const line of ['- intent@1#success-criteria', '- intent@1#states', '- context@1#constraints', '- cast@1#structure', '- cast@1#detail', '- cast@1#look', '- cast@1#handoff', '- cast@1#acceptance', '- structure@1#the-structure',
    '- structure@1#what-the-readers-found', '- detail@1#rules', '- detail@1#data-map', '- detail@1#dependencies', '- detail@1#what-the-readers-found', '- source:design/today/04-structure/reads', '- source:design/today/05-detail/reads',
    '- source:design/today/06-look/reads', '- source:design/today/05-detail/states.md', '- source:design/today/05-detail/strings.json', '- source:design/today/05-detail/prototype', '- source:design/today/06-look/screens', '- source:design/today/06-look/shots',
    '- source:design/today/06-look/measures.md', '- source:design/today/06-look/checks.json', '- source:design/kit/tokens.css', '- source:design/today/DECISIONS.md', '- source:src/today/rooms.html']) assert.ok(lookCarry.includes(line), line);
  // Ruling R151: why it is built now, what exists today, what it must not become, and what the readers of Context and of Intent
  // found reach the handoff too, carried on from Intent's gate and from Cast's as they are.
  for (const line of ['- context@1#the-problem-and-why-now', '- context@1#what-exists-today', '- context@1#what-it-must-not-become', '- intent@1#what-the-readers-found']) assert.ok(lookCarry.includes(line), line);
  const [, fromIntent] = /a later stage is written from: its ((?:"[^"]+"(?:, | and )?)+)\./.exec(flat(section(stageSkill('intent'), 'Gate')));
  for (const [, heading] of fromIntent.matchAll(/"([^"]+)"/g)) assert.ok(castCarry.includes(`- context@1#${slug(heading)}`), heading);

  // What Look left on disk: the final screens, each linking the project's token file by its path; their pictures, and one of a
  // variant he did not pick; the checks its measures rest on; the strings; and what a fresh maker made, with the sealed file.
  const PAGES = ['today-default-en', 'today-default-es', 'today-empty-en'];
  const [look, detail] = [join(pkg, '06-look'), join(pkg, '05-detail')];
  mkdirSync(join(project, 'design', 'kit'), { recursive: true });
  // The project's token file loads a font of its own, by a path from its own folder.
  mkdirSync(join(project, 'design', 'kit', 'fonts'));
  writeFileSync(join(project, 'design', 'kit', 'fonts', 'desk.woff2'), 'a font');
  writeFileSync(join(project, 'design', 'kit', 'tokens.css'), `${read('tests/fixtures/prototype/kit.css')}\n@font-face { font-family: Desk; src: url("fonts/desk.woff2") format("woff2"); }\n`);
  const TOKENS = '../../../kit/tokens.css';
  for (const folder of ['screens', 'shots', 'fresh', 'beside']) mkdirSync(join(look, folder));
  for (const page of PAGES) writeFileSync(join(look, 'screens', `${page}.html`), read(`tests/fixtures/prototype/${page}.html`).replace('href="kit.css"', `href="${TOKENS}"`));
  for (const page of PAGES) for (const width of [390, 1280]) for (const theme of ['light', 'dark']) writeFileSync(join(look, 'shots', `${page}-${width}-${theme}.png`), `${page} at ${width}, ${theme}`);
  writeFileSync(join(look, 'shots', 'today-default-en-compact-390-light.png'), 'a variant');
  writeFileSync(join(look, 'fresh', 'outside-openai.html'), '<!doctype html>\n<title>Today</title>\n');
  writeFileSync(join(look, 'beside', 'A.png'), 'a version');
  writeFileSync(join(look, 'BESIDE.sealed.json'), '{}\n');
  copyFileSync(at('tests/fixtures/acceptance.json'), join(look, 'checks.json'));
  for (const file of ['states.md', 'strings.json']) copyFileSync(at(`templates/package/05-detail/${file}`), join(detail, file));

  // Handoff, steps 1 and 2: begun, and built from the six stages its files are written from. Built from nothing, it is refused.
  assert.equal(run(commandOf('handoff', 'state.mjs begin')), 'handoff is in work');
  assert.match(run(commandOf('handoff', 'state.mjs status')), /^\| handoff \| full \| in-work \|/m);
  assert.equal(standingAt('handoff'), '[look@1, detail@1, structure@1, cast@1, intent@1, context@1]');
  write('handoff', '[]');
  const unbuilt = exec(commandOf('handoff', 'state.mjs stamp'));
  assert.deepEqual([unbuilt.status, unbuilt.stdout], [1, '']);
  assert.match(unbuilt.stderr, /^handoff cannot be stamped:\n- it must be built from look, the stage before it on the route: add look@1 to built-from\n$/);
  write('handoff', standingAt('handoff'));
  const [handoff, gate] = [join(pkg, '07-handoff'), join(pkg, '07-handoff-gate')];
  // Step 3: the final screens copied; the pictures of those pages and no other; the token file; the index; the guide, whole; and
  // the builder's three pages, still to fill.
  mkdirSync(join(handoff, 'prototype', 'shots'), { recursive: true });
  for (const file of list(join(look, 'screens'))) {
    copyFileSync(join(look, 'screens', file), join(handoff, 'prototype', file));
    const pictures = new RegExp(`^${file.replace(/\.html$/, '')}-\\d+-(?:light|dark)\\.png$`);
    for (const picture of list(join(look, 'shots')).filter(name => pictures.test(name))) copyFileSync(join(look, 'shots', picture), join(handoff, 'prototype', 'shots', picture));
  }
  copyFileSync(join(project, 'design', 'kit', 'tokens.css'), join(handoff, 'tokens.css'));
  writeFileSync(join(handoff, 'prototype', 'index.html'), `<!doctype html>\n<html lang="en">\n<title>Today: the prototype</title>\n<ul>\n${PAGES.map(page => `<li><a href="${page}.html">${page}</a></li>`).join('\n')}\n</ul>\n`);
  // Ruling R148: copied as they came, the pages still load the project's token file, which is there on this disk: the copy sits
  // as deep as the page it was copied from. Nothing but the kit's script sees it, and it sees what the token file loads too.
  const proving = exec(ALONE);
  assert.deepEqual([proving.status, proving.stdout], [1, '']);
  assert.ok(existsSync(join(handoff, 'prototype', TOKENS)), 'the link a copied page keeps still resolves');
  assert.deepEqual(proving.stderr.trimEnd().split('\n'), [...PAGES.map(page => `prototype/${page}.html: ${TOKENS}: it leaves the folder: ".." climbs above it`), 'tokens.css: fonts/desk.woff2: the file is not there',
    '4 references of design/today/07-handoff do not lead to a file inside it']);
  // The one link of each page is changed, by script, and nothing else of it; the font is copied in beside the token file, under
  // the path the token file loads it by. Then the folder stands alone.
  for (const file of list(join(look, 'screens'))) {
    const page = readFileSync(join(look, 'screens', file), 'utf8');
    const copy = page.split(TOKENS).join('../tokens.css');
    writeFileSync(join(handoff, 'prototype', file), copy);
    const [was, is] = [page.split('\n'), copy.split('\n')];
    assert.deepEqual(was.map((line, i) => (line === is[i] ? null : [line, is[i]])).filter(Boolean), [[`<link rel="stylesheet" href="${TOKENS}">`, '<link rel="stylesheet" href="../tokens.css">']], `${file}: one line changes`);
  }
  mkdirSync(join(handoff, 'fonts'));
  copyFileSync(join(project, 'design', 'kit', 'fonts', 'desk.woff2'), join(handoff, 'fonts', 'desk.woff2'));
  // The guide, whole; the in-page file of the checks, as the skill's table names it (S16); and the builder's three pages.
  copyFileSync(at('reference/IMPLEMENTER-GUIDE.md'), join(handoff, 'IMPLEMENTER-GUIDE.md'));
  assert.match(tableRows(section(stageSkill('handoff'), 'Writes')).find(([file]) => file === '`07-handoff/accept-inpage.js`')[2], /^`scripts\/inpage\/accept-inpage\.js`, copied whole$/);
  copyFileSync(INPAGE, join(handoff, 'accept-inpage.js'));
  mkdirSync(join(pkg, 'build'));
  for (const file of filesUnder('templates/package/build/')) copyFileSync(at(`templates/package/build/${file}`), join(pkg, 'build', file));
  // Step 3 ends on the address check alone, which now passes.
  const standsAlone = `design/today/07-handoff stands alone: ${PAGES.length * 2 + 1} references in ${PAGES.length + 2} files, each to a file inside it`;
  assert.equal(run(ALONE), standsAlone);
  // S1: the proof that nothing points back is not step 3's. As step 3 leaves the folder it could not pass: the entry and the
  // guide name DECISIONS.md, which the package holds from Frame on, and the folder does not hold its own until step 4.
  assert.ok(existsSync(join(pkg, 'DECISIONS.md')) && !existsSync(join(handoff, 'DECISIONS.md')));
  const early = exec(POINTERS);
  assert.deepEqual([early.status, early.stdout], [1, '']);
  const earlyPlaces = early.stderr.trimEnd().split('\n');
  assert.equal(earlyPlaces.at(-1), `${earlyPlaces.length - 1} places of design/today/07-handoff name a file or folder of design/today that it does not hold`);
  assert.ok(earlyPlaces.length - 1 >= 2 && earlyPlaces.slice(0, -1).every(place => /^(?:HANDOFF|IMPLEMENTER-GUIDE)\.md:\d+: DECISIONS\.md: it names DECISIONS\.md of the package, which the folder does not hold$/.test(place)), early.stderr);
  const under = folder => readdirSync(folder, { withFileTypes: true }).flatMap(entry => (entry.isDirectory() ? under(join(folder, entry.name)) : [join(folder, entry.name)]));
  assert.equal(list(join(handoff, 'prototype', 'shots')).length, PAGES.length * 4);
  assert.ok(!list(join(handoff, 'prototype', 'shots')).some(name => name.includes('compact')), 'a variant\'s picture is not copied');
  assert.equal(readFileSync(join(handoff, 'IMPLEMENTER-GUIDE.md'), 'utf8'), guide());
  assert.equal(readFileSync(join(handoff, 'accept-inpage.js'), 'utf8'), readFileSync(INPAGE, 'utf8'));
  // Steps 4, 5 and 7, stood in for: each file of the folder as its template, and the strings as the detail's, copied.
  copyFileSync(join(detail, 'strings.json'), join(handoff, 'strings.json'));
  for (const file of ['SPEC.md', 'PARTS.md', 'DECISIONS.md']) copyFileSync(at(`templates/package/07-handoff/${file}`), join(handoff, file));
  // M12: the entry's table gains the row of the token file, which the template does not have.
  const entry = readFileSync(join(handoff, 'HANDOFF.md'), 'utf8');
  const partsRow = '| `PARTS.md` | The token and the component each element uses, and anything new to the system. |\n';
  assert.ok(entry.includes(partsRow));
  // The template's own comment, which says to delete it, names the state script: it goes, as it does in a real folder.
  writeFileSync(join(handoff, 'HANDOFF.md'), entry.replace(/<!-- Template\.[^]*?-->\n/, '').replace(partsRow, `| \`tokens.css\` | The token file the prototype is drawn on, copied in, with the font it loads in \`fonts/\`. |\n${partsRow}`));
  // Step 6: Look's checks are taken over, the file is valid as the script reads it, and the checks are run on the folder's own
  // prototype first: once, through the kit's own script, by the command the skill gives. The results lie beside the folder.
  const data = JSON.parse(readFileSync(join(look, 'checks.json'), 'utf8'));
  assert.deepEqual(validateAcceptance(data), []);
  writeFileSync(join(handoff, 'acceptance.json'), `${JSON.stringify(data, null, 2)}\n`);
  const total = data.checks.length;
  const printed = run(commandOf('handoff', 'accept.mjs prototype'));
  assert.equal(printed, `${total} checks: 0 failed, ${total} passed; results in design/today/07-handoff-gate/results.json`);
  // I1: what goes into the folder is the day and the counts. What the command prints after them names the gate's folder, and the
  // command names the package: neither is written into ACCEPTANCE.md or COVERAGE.md.
  const [counts] = printed.split(';');
  assert.equal(counts, `${total} checks: 0 failed, ${total} passed`);
  const lastRun = /\{The one check in `acceptance\.json` is an example[^}]*\}/;
  assert.match(read('templates/package/07-handoff/ACCEPTANCE.md'), lastRun);
  writeFileSync(join(handoff, 'ACCEPTANCE.md'), read('templates/package/07-handoff/ACCEPTANCE.md').replace(lastRun, `Last run on the prototype on 2026-11-14: ${counts}.`));
  const coverageOf = rows => read('templates/package/07-handoff/COVERAGE.md').replace('\n## Findings\n', `\nThe checks of \`acceptance.json\` last ran on the prototype on 2026-11-14: ${counts}. None was taken out.\n\n## Findings\n`)
    .replace(/\| \{the stage\} \| \{the seat's id\}[^\n]*\n/, rows.join(''));
  const seatRows = ['| Context | `judge.usability` | — | today\'s screen, as pictures | not recorded | not recorded | The count is below the fold. |\n', '| Look | `judge.accessibility` | — | the final screens | contrast, target-size | `opus` | Passes. |\n'];
  writeFileSync(join(handoff, 'COVERAGE.md'), coverageOf(seatRows));
  assert.ok(readFileSync(join(handoff, 'COVERAGE.md'), 'utf8').includes(`last ran on the prototype on 2026-11-14: ${counts}.`));
  const came = JSON.parse(readFileSync(join(gate, 'results.json'), 'utf8'));
  assert.deepEqual(came.map(result => [result.id, result.pass]), data.checks.map(check => [check.id, true]));
  // The pages were measured on the copy of the token file: a page whose stylesheet did not load would have failed its checks,
  // and the dark contrast is a value of that file.
  assert.ok(came.find(result => result.id === 'list-contrast-dark').actual >= 4.5);
  // The folder is what the skill's table lists, and stands alone: no file of it names a stage's folder, the gate's folder, the
  // scratch folder or the package, and nothing a fresh maker made is in it or named in it (ruling 12).
  const FOLDER = ['ACCEPTANCE.md', 'COVERAGE.md', 'DECISIONS.md', 'HANDOFF.md', 'IMPLEMENTER-GUIDE.md', 'PARTS.md', 'SPEC.md', 'accept-inpage.js', 'acceptance.json', 'fonts', 'prototype', 'strings.json', 'tokens.css'];
  assert.deepEqual(list(handoff), FOLDER);
  // What the skill's table lists is what the folder holds: every file and folder of its "07-handoff/" rows (S16).
  const listed = tableRows(section(stageSkill('handoff'), 'Writes')).flatMap(([files]) => [...files.matchAll(/`07-handoff\/([\w.-]+)\/?`/g)].map(([, name]) => name));
  for (const name of listed) assert.ok(FOLDER.includes(name), `${name} is in the folder`);
  assert.deepEqual(FOLDER.filter(name => !listed.includes(name)), ['fonts'], 'and the folder holds nothing else, but what the token file loads');
  // The end of step 7, where the skill runs it (S1): every file of the folder is written, and by its --package the same
  // command reads each text file of it for a name of the package that it does not hold (R180). Here it passes.
  const textFiles = under(handoff).filter(file => !readFileSync(file).includes(0)).length;
  assert.equal(textFiles, 11 + 1 + PAGES.length + 1 + PAGES.length * 4, 'every file of the folder is read: here its font and its pictures are stand-ins made of text');
  const nothingPointsBack = `${standsAlone}; and none of its ${textFiles} text files names a file or folder of design/today that it does not hold`;
  assert.equal(run(POINTERS), nothingPointsBack);
  // A pointer back in a file the conductor wrote is found there, before any seat reads: a coverage row naming a file of Look's.
  assert.ok(existsSync(join(look, 'LOOK.md')) && !existsSync(join(handoff, 'LOOK.md')), 'the package holds LOOK.md, and the folder does not');
  const coverage = readFileSync(join(handoff, 'COVERAGE.md'), 'utf8');
  writeFileSync(join(handoff, 'COVERAGE.md'), `${coverage}\nThe look's own account is in LOOK.md.\n`);
  const written = exec(POINTERS);
  assert.deepEqual([written.status, written.stdout], [1, '']);
  assert.deepEqual(written.stderr.trimEnd().split('\n'), [`COVERAGE.md:${coverage.split('\n').length + 1}: LOOK.md: it names 06-look/LOOK.md of the package, which the folder does not hold`,
    '1 place of design/today/07-handoff names a file or folder of design/today that it does not hold']);
  writeFileSync(join(handoff, 'COVERAGE.md'), coverage);
  // S3: a pointer in a file that was approved, as a comment of a stylesheet, is not rewritten. PARTS.md says where it is and
  // what it stood for without the name it points to, so the one place left is the approved file's, and only so may it exit 1.
  writeFileSync(join(handoff, 'prototype', 'notes.css'), '/* Its changes are listed in LOOK.md. */\n');
  const approved = ['prototype/notes.css:1: LOOK.md: it names 06-look/LOOK.md of the package, which the folder does not hold', '1 place of design/today/07-handoff names a file or folder of design/today that it does not hold'];
  const parts = readFileSync(join(handoff, 'PARTS.md'), 'utf8');
  writeFileSync(join(handoff, 'PARTS.md'), `${parts}\nThe comment that opens \`prototype/notes.css\` points to the list of the look's changes: they are under "Changes to the system", above.\n`);
  const left = exec(POINTERS);
  assert.deepEqual([left.status, left.stdout, left.stderr.trimEnd().split('\n')], [1, '', approved]);
  // Written with the name, the line of PARTS.md would be one more place.
  writeFileSync(join(handoff, 'PARTS.md'), `${parts}\nThe comment that opens \`prototype/notes.css\` points to LOOK.md.\n`);
  assert.equal(exec(POINTERS).stderr.trimEnd().split('\n').length, 3);
  writeFileSync(join(handoff, 'PARTS.md'), parts);
  rmSync(join(handoff, 'prototype', 'notes.css'));
  assert.equal(run(POINTERS), nothingPointsBack);
  // No file of the folder names a path that leaves it, and nothing the gate keeps is in it: asked again each time the folder changes.
  const namesNothingOutside = () => {
    const inFolder = walk(handoff);
    assert.equal(inFolder.length, 11 + 1 + PAGES.length + 1 + PAGES.length * 4);
    for (const file of inFolder.filter(name => /\.(?:md|json|html|css)$/.test(name))) {
      const body = readFileSync(join(handoff, file), 'utf8');
      assert.doesNotMatch(body, INTO_THE_PACKAGE, file);
      assert.doesNotMatch(body, /scripts\/[a-z]+\.mjs|<kit root>|results\.json/, `${file} names a command of the kit, or the gate's results`);
      assert.doesNotMatch(body, /outside-openai|BESIDE|\bfresh\/|\bbeside\//, file);
    }
    assert.ok(!inFolder.some(name => /outside|sealed|compact|ledger|judge\.|decision\.(?:json|html)/i.test(name)));
    assert.equal(run(POINTERS), nothingPointsBack, 'the folder stands alone, and nothing in it points back');
  };
  namesNothingOutside();
  for (const page of PAGES) assert.doesNotMatch(readFileSync(join(handoff, 'prototype', `${page}.html`), 'utf8'), /kit\/tokens\.css/, page);
  // The one path that leaves the folder is the builder's own, and its three pages are there to fill.
  assert.match(readFileSync(join(handoff, 'HANDOFF.md'), 'utf8'), /in `\.\.\/build\/`, beside this folder/);
  assert.deepEqual(list(join(pkg, 'build')), ['BUILD.md', 'DEVIATIONS.md', 'STATES.md']);

  // Step 8: the cold implementer's brief hands it the folder, by its absolute path, and nothing else of the package; its ledger
  // is written beside the folder, never in it.
  const seat = leads(subsection(stageRef('handoff', 'seats.md'), '`judge.cold-implementer`'));
  const handedOver = [...seat.Handed.matchAll(/`(<package>\/[^`]*)`/g)].map(([, path]) => path);
  assert.deepEqual(handedOver, ['<package>/07-handoff/']);
  mkdirSync(join(pkg, 'work'));
  const brief = read('templates/briefs/judge.md').replace(/\{What the stage's skill, or its `references\/seats\.md`, hands this seat[^}]*\}\n\n1\. \{the absolute path\} — \{what it is\}/, `1. ${join(project, filled(handedOver[0], FILL))} — the handoff folder, whole`);
  writeFileSync(join(pkg, 'work', 'brief-cold-implementer.md'), brief);
  assert.ok(brief.includes(`1. ${handoff}/ — the handoff folder, whole`));
  const [, ledgerAt] = /^its ledger, `(<package>\/07-handoff-gate\/[\w.-]+\.md)`/.exec(seat.Writes);
  const ledger = join(project, filled(ledgerAt, FILL));
  // I3: while it reads, and until its last read, the folder says nothing of this seat: a re-read reads the folder cold.
  assert.doesNotMatch(readFileSync(join(handoff, 'COVERAGE.md'), 'utf8'), /cold-implementer/);
  writeFileSync(ledger, read('templates/outputs/LEDGER.md'));
  assert.ok(ledger.startsWith(`${gate}/`) && !ledger.startsWith(`${handoff}/`));
  assert.deepEqual(list(handoff), FOLDER, 'the folder a builder gets holds no ledger');
  // Nothing blocked, so it does not read again: its row goes in now, and the folder still names nothing outside itself.
  writeFileSync(join(handoff, 'COVERAGE.md'), coverageOf([...seatRows, '| Handoff | `judge.cold-implementer` | — | this folder | its four core checks | `opus` | Ready with defaults. |\n']));
  namesNothingOutside();
  // Step 10 and the gate: one page, beside the folder, its pictures the folder's own; one question, recorded; his go; the stamp.
  const approve = JSON.parse(read('templates/outputs/decision-approve.json'));
  const [, picture] = /as `(\.\.\/07-handoff\/prototype\/shots\/[\w-]+\.png)`/.exec(flat(stageSkill('handoff')));
  assert.ok(existsSync(join(gate, picture)), picture);
  const go = { identity: { ...approve.identity, stage: STAGES.indexOf('handoff') + 1 },
    options: [{ letter: 'A', title: 'The handoff folder', line: 'Today, in three slices: the list of free rooms, the empty state, the booking action.', images: [picture, picture.replace('-390-', '-1280-')] }],
    seats: [{ seat: 'judge.cold-implementer', line: 'Ready with defaults: nothing blocks, and one guess has a default written in the folder.', option: 'A' }],
    findings: [{ seat: 'judge.cold-implementer', line: 'Default: a room that frees up while the list is open moves to the top without a notice. Nobody decided this.' }],
    recommendation: { option: 'A', reason: 'Give the go, since the one default changes no screen.' }, question: FILL['<the one question>'] };
  writeFileSync(join(gate, 'decision.json'), JSON.stringify(go, null, 2));
  assert.match(run(commandOf('handoff', 'page.mjs')), /^built \S.*decision\.html: 1 option, 1 seat, 1 open finding, one question$/);
  assert.deepEqual(list(gate), ['decision.html', 'decision.json', 'judge.cold-implementer.md', 'results.json']);
  assert.equal(run(commandOf('handoff', 'state.mjs await')), 'handoff awaits the founder');
  assert.match(run(commandOf('handoff', 'state.mjs status')), /^## Open question\n\nhandoff: May this folder go to the session that builds it\?$/m);
  assert.match(run(commandOf('handoff', 'state.mjs stamp')), STAMPED('handoff'));
  assert.doesNotMatch(readFileSync(join(handoff, 'HANDOFF.md'), 'utf8'), /^## Carry$/m);
  assert.equal(run(`${STATE} validate <package>`), 'ok');
  assert.equal(run(`${STATE} next <package>`), 'acceptance');

  // The build, stood in for: the builder fills its three pages. The state map names an account by its role and where its
  // sign-in is kept, and nothing that signs in.
  const [, role] = /as "(the front-desk account of the test clinic)"/.exec(guide());
  const states = [...new Set(data.checks.map(check => check.state))];
  assert.deepEqual(states, ['empty', 'default']);
  const stateMap = read('templates/package/build/STATES.md').replace(/\| \{the screen's id\}[^\n]*/, states.map(state => `| today | ${state} | Sign in as ${role}, whose sign-in is kept in the project's test settings. Seed "${state}". Open the route of today. |`).join('\n'));
  writeFileSync(join(pkg, 'build', 'STATES.md'), stateMap);
  assert.doesNotMatch(stateMap, /password\s*[:=]|token\s*[:=]|\?[\w-]*(?:ticket|token|key)=/i);
  for (const state of states) assert.match(stateMap, new RegExp(`^\\| today \\| ${state} \\| Sign in as the front-desk account`, 'm'));

  // Acceptance, a session of its own. Steps 1 and 2: begun, its report built from the handoff at the version the state prints.
  const more = { '<the one question>': 'Is the booking action accepted as built, at 40 by 40, or fixed?', '<the founder\'s words>': 'aceptado' };
  assert.equal(run(commandOf('acceptance', 'state.mjs begin')), 'acceptance is in work');
  assert.equal(standingAt('acceptance'), '[handoff@1]');
  write('acceptance', standingAt('acceptance'));
  const acceptance = join(pkg, '08-acceptance');
  // Step 4: the command prints where the in-page file is; its text is what a driver evaluates, and it defines the one function.
  const inpage = run(commandOf('acceptance', 'accept.mjs inpage'));
  assert.equal(inpage, INPAGE);
  assert.match(readFileSync(inpage, 'utf8'), /^ {2}window\.__uxAccept = function \(checks\) \{$/m);
  // What came back in the build, stood in for by what the same checks returned on the prototype: one file for each state, each
  // result as window.__uxAccept gives it and no more. The build's booking action is too small; the empty state is not yet driven.
  const back = (state, change = result => result) => {
    mkdirSync(join(acceptance, 'results'), { recursive: true });
    writeFileSync(join(acceptance, 'results', `${state}.json`), `${JSON.stringify(came.filter(result => result.state === state).map(({ id, pass, actual, message }) => change({ id, pass, actual, message })), null, 2)}\n`);
  };
  const small = result => (result.id === 'book-target-size' ? { ...result, pass: false, actual: { width: 40, height: 40 }, message: 'the box is 40 by 40, under 44 by 44' } : result);
  back('default', small);
  // Step 5: the table, by the command the skill gives, with every file of results/ named as a word of its own.
  const reportCommand = commandOf('acceptance', 'accept.mjs report');
  const report = files => spawnSync(process.execPath, words(reportCommand).slice(1).flatMap(word => (word.includes('<state>') ? files.map(state => filled(word.replace('<state>', state), FILL)) : [filled(word, FILL)])), { cwd: project, encoding: 'utf8' });
  const emptyChecks = data.checks.filter(check => check.state === 'empty').length;
  const first = report(['default']);
  assert.deepEqual([first.status, first.stderr], [0, '']);
  assert.equal(first.stdout.trim(), `${total} checks: 1 failed, ${emptyChecks} not run, ${total - emptyChecks - 1} passed; report in design/today/08-acceptance/checks.md`);
  const table = () => readFileSync(join(acceptance, 'checks.md'), 'utf8').split('\n').filter(line => line.startsWith('| ')).slice(2).map(line => cells(line).slice(0, 2));
  // A check that never ran shows as not run, after the failed and before the passed: it is explained, or run.
  assert.deepEqual(table().slice(0, 1 + emptyChecks), [['FAIL', 'book-target-size'], ['not run', 'empty-message-shown'], ['not run', 'no-booking-when-full']]);
  back('empty');
  const second = report(states);
  assert.equal(second.stdout.trim(), `${total} checks: 1 failed, 0 not run, ${total - 1} passed; report in design/today/08-acceptance/checks.md`);
  // A failed check does not change the exit code of the report: the count is what is read. A file named twice is refused.
  assert.equal(second.status, 0);
  const twice = report(['default', 'default']);
  assert.deepEqual([twice.status, twice.stdout], [1, '']);
  assert.match(twice.stderr, /^"count-in-spanish" has two results: in design\/today\/08-acceptance\/results\/default\.json and in design\/today\/08-acceptance\/results\/default\.json$/m);
  // The pictures of the build, named as the reference pictures are, so that the two folders pair by name.
  mkdirSync(join(acceptance, 'shots'));
  for (const check of data.checks) writeFileSync(join(acceptance, 'shots', `${check.page.replace(/\.html$/, '')}-${check.width}-${check.theme ?? 'light'}.png`), 'the build');
  for (const name of list(join(acceptance, 'shots'))) assert.ok(existsSync(join(handoff, 'prototype', 'shots', name)), `${name} has its reference picture`);
  // Step 6: each reader writes one file in reads/, named for its seat.
  const [, readsAt] = /`(<package>\/08-acceptance\/reads\/)<seat>\.md`/.exec(flat(stageRef('acceptance', 'seats.md')));
  mkdirSync(join(project, filled(readsAt, FILL)));
  for (const name of ['judge.accessibility', 'judge.profile-front-desk-coordinator', 'audience.task-reader-desk-cover-en']) writeFileSync(join(acceptance, 'reads', `${name}.md`), '');
  // Step 8 and the gate: one page; the deviation is his to decide, one question recorded; a fix goes out, and nothing is stamped.
  const [, built] = /as `(shots\/[\w-]+\.png)`/.exec(stepOf(section(stageSkill('acceptance'), 'Steps'), 'Build the decision page'));
  assert.ok(existsSync(join(acceptance, built)), built);
  const accept = { identity: { ...approve.identity, stage: STAGES.length },
    options: [{ letter: 'A', title: 'The build of today', line: 'Seven of eight checks hold in the build, and every state was driven.', images: [built, built.replace('-390-', '-1280-')] }],
    seats: [{ seat: 'judge.accessibility', line: 'One target is under its bar at the phone width.', option: 'A' }, { seat: 'audience.task-reader', line: 'She booked the walk-in from the first screen.', option: 'A' }],
    findings: [{ seat: 'judge.accessibility', line: 'book-target-size: the booking action is 40 by 40 at 390 px, and 44 by 44 was approved.' }],
    recommendation: { option: 'A', reason: 'Have the booking action fixed, since a thumb does the pointing there.' }, question: more['<the one question>'] };
  writeFileSync(join(acceptance, 'decision.json'), JSON.stringify(accept, null, 2));
  assert.match(run(commandOf('acceptance', 'page.mjs')), /^built \S.*decision\.html: 1 option, 2 seats, 1 open finding, one question$/);
  assert.equal(run(commandOf('acceptance', 'state.mjs await'), more), 'acceptance awaits the founder');
  assert.match(run(commandOf('acceptance', 'state.mjs status')), /^## Open question\n\nacceptance: Is the booking action accepted as built, at 40 by 40, or fixed\?$/m);
  assert.equal(run(commandOf('acceptance', 'state.mjs begin')), 'acceptance is in work');
  copyFileSync(at('templates/package/08-acceptance/FIXES.md'), join(acceptance, 'FIXES.md'));
  assert.equal(run(`${STATE} next <package>`), 'acceptance');
  // The fix comes back: its state is driven again, its file written again, whole, and the table built again over every file.
  back('default');
  const third = report(states);
  assert.equal(third.stdout.trim(), `${total} checks: 0 failed, 0 not run, ${total} passed; report in design/today/08-acceptance/checks.md`);
  assert.ok(table().every(([result]) => result === 'pass'));
  // A second deviation, one the builder wrote down, and he accepts it: deviations.md. It is logged in the package's decisions and in
  // the folder's own, and the check that held the approved value is rewritten to hold the build as accepted, never taken out.
  const accepted = { '<the one question>': 'Is the list of rooms accepted as built, twelve to a page, or fixed?', '<the founder\'s words>': 'aceptado así, doce por página', '<why>': 'he accepted twelve rooms to a page, and "Must not change" names the list' };
  assert.equal(run(commandOf('acceptance', 'state.mjs await'), accepted), 'acceptance awaits the founder');
  assert.equal(run(commandOf('acceptance', 'state.mjs begin')), 'acceptance is in work');
  for (const file of [join(pkg, 'DECISIONS.md'), join(handoff, 'DECISIONS.md')]) {
    if (!existsSync(file)) copyFileSync(at('templates/package/DECISIONS.md'), file);
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n## The list of rooms shows twelve to a page\n\n**Decision.** Accepted as built at Acceptance.\n`);
  }
  const rewritten = { ...data, checks: data.checks.map(check => (check.id === 'two-free-rooms-listed' ? { ...check, criterion: 'The free rooms are listed, twelve to a page, as accepted.' } : check)) };
  assert.deepEqual(validateAcceptance(rewritten), []);
  assert.equal(rewritten.checks.length, total, 'the check is rewritten, never deleted');
  writeFileSync(join(handoff, 'acceptance.json'), `${JSON.stringify(rewritten, null, 2)}\n`);
  // "Must not change" names the list, and HANDOFF.md is stamped: it is reopened by the command the page gives, the line is written
  // beside the item, and it is stamped again in the words he accepted the deviation with. Handoff then stands at version 2.
  assert.match(run(commandOf('acceptance', 'state.mjs reopen'), accepted), /^reopened handoff at version 2; stale: none$/);
  const reopened = readFileSync(join(handoff, 'HANDOFF.md'), 'utf8');
  assert.match(reopened, /^version: 2\nstatus: draft$/m);
  writeFileSync(join(handoff, 'HANDOFF.md'), reopened.replace('\n## Left to the builder\n', '\nThe list of rooms: the build as accepted differs from the page this names. It shows twelve to a page.\n\n## Left to the builder\n'));
  assert.match(run(commandOf('acceptance', 'state.mjs stamp <package> handoff'), accepted), /^stamped handoff approved at version 2 on \d{4}-\d\d-\d\d$/);
  const third2 = report(states);
  assert.equal(third2.stdout.trim(), `${total} checks: 0 failed, 0 not run, ${total} passed; report in design/today/08-acceptance/checks.md`);
  // The last question, the lessons appended to the project's file, and the stamp: the design is done. A report still built from the
  // handoff as it stood before the reopening is refused at its own stamp; built from the version the state prints, it is stamped.
  const final = { ...more, '<the one question>': 'Do you accept this build?' };
  assert.equal(run(commandOf('acceptance', 'state.mjs await'), final), 'acceptance awaits the founder');
  const lessons = join(project, 'design', 'LESSONS.md');
  copyFileSync(at('templates/project/LESSONS.md'), lessons);
  writeFileSync(lessons, `${readFileSync(lessons, 'utf8')}\n## 2026-11-14 · today · working-surface, surface\n\n| \`judge.accessibility\` | \`opus\` | The booking action was 40 by 40 at 390 px. | The build was sent back once. |\n`);
  const stale = exec(commandOf('acceptance', 'state.mjs stamp <package> acceptance'), final);
  assert.deepEqual([stale.status, stale.stdout], [1, '']);
  assert.match(stale.stderr, /^acceptance cannot be stamped:\n- built from handoff@1, but handoff is at version 2: a stale input; rebuild on handoff@2 or re-confirm it\n$/);
  assert.equal(standingAt('acceptance'), '[handoff@2]');
  const reportText = readFileSync(join(acceptance, 'REPORT.md'), 'utf8');
  writeFileSync(join(acceptance, 'REPORT.md'), reportText.replace('built-from: [handoff@1]', `built-from: ${standingAt('acceptance')}`));
  assert.match(run(commandOf('acceptance', 'state.mjs stamp <package> acceptance'), final), STAMPED('acceptance'));
  assert.equal(run(`${STATE} validate <package>`), 'ok');
  assert.equal(run(`${STATE} next <package>`), 'none');
  assert.match(run(commandOf('acceptance', 'state.mjs status')), /^## Open question\n\nNone\.$/m);
  assert.deepEqual(list(acceptance), ['FIXES.md', 'REPORT.md', 'checks.md', 'decision.html', 'decision.json', 'reads', 'results', 'shots']);
  // The folder holds what it held, names nothing outside itself still, and no credential is in anything the stage wrote.
  assert.deepEqual(list(handoff), FOLDER);
  namesNothingOutside();
  for (const file of walk(acceptance).filter(name => /\.(?:md|json)$/.test(name))) assert.doesNotMatch(readFileSync(join(acceptance, file), 'utf8'), /password\s*[:=]|token\s*[:=]|\?[\w-]*(?:ticket|token|key)=/i, file);

  // A correction, as each skill's forms.md gives it: its route runs Frame, Detail, Handoff and Acceptance, each short. Handoff is
  // built from the detail and the frame, Acceptance from the handoff, and one nod stamps both: no seat, no page, no second question.
  const fix = { '<package>': 'design/label', '<the founder\'s words>': 'sí, cámbialo' };
  const small2 = join(project, 'design', 'label');
  run(`${STATE} init <package> --design label --kind working-surface --foundation small-change --size correction`, fix);
  for (const [name, inputs, carry] of [['frame', '[]', []], ['detail', '[frame@1]', ['- source:design/label/05-detail/correction/before-1280-light.png', '- source:design/label/05-detail/correction/after-1280-light.png']]]) {
    run(`${STATE} begin <package> ${name}`, fix);
    write(name, inputs, carry, small2);
    assert.match(run(`${STATE} stamp <package> ${name} --words "sí, cámbialo"`, fix), STAMPED(name));
  }
  assert.equal(run(`${STATE} next <package>`, fix), 'handoff');
  assert.equal(run(commandOf('handoff', 'state.mjs begin'), fix), 'handoff is in work');
  assert.match(run(commandOf('handoff', 'state.mjs status'), fix), /^\| handoff \| short \| in-work \|/m);
  const [, builtFrom] = /write `built-from` as the route gives it: `(\[detail@<version>, frame@<version>\])`/.exec(flat(stageRef('handoff', 'forms.md')));
  write('handoff', builtFrom.replaceAll('<version>', '1'), undefined, small2);
  assert.match(run(commandOf('handoff', 'state.mjs stamp'), fix), STAMPED('handoff'));
  assert.deepEqual(list(join(small2, '07-handoff')), ['HANDOFF.md'], 'no folder is filled for a correction');
  assert.equal(run(`${STATE} next <package>`, fix), 'acceptance');
  assert.equal(run(commandOf('acceptance', 'state.mjs begin'), fix), 'acceptance is in work');
  assert.equal(standingAt('acceptance', fix), '[handoff@1]');
  write('acceptance', standingAt('acceptance', fix), undefined, small2);
  assert.match(run(commandOf('acceptance', 'state.mjs stamp <package> acceptance'), fix), STAMPED('acceptance'));
  assert.equal(run(`${STATE} validate <package>`, fix), 'ok');
  assert.equal(run(`${STATE} next <package>`, fix), 'none');
});

// ---- what the dry run found in the five closing stages (Task 20, wave A2)

// Every sentence given is in the text, however it is wrapped.
const says = (text, ...sentences) => { for (const sentence of sentences) assert.ok(flat(text).includes(sentence), sentence); };

test('the dry run, the loop again: a list is one question, what he accepted is part of what was approved, and a seat is told which pictures come first', () => {
  const loop = reference('loop.md');
  // R174: one question about one thing stands, and a list is one thing.
  says(loop, 'One question about one thing at a time, on a page and in the chat. **A list is one thing.**',
    'is put to him as one question: the entries numbered, each with what follows from each answer, answered by number in one message, with one `await`. An entry he leaves unanswered stays open, and is listed so.',
    'What step 8 catches, an answer that meets a standing rule, a fact of the product or an output he approved, is still asked on its own, at once.',
    // M9 of the fix review: where an unanswered entry is listed.
    'An entry he leaves unanswered stays open, and is listed so. It goes under `findings` on the stage\'s decision page, as open, and the gate\'s question names it.');
  says(conductor(), '**Never ask more than one question on a page.** One question about one thing at a time, on a decision page and in the chat. A list a seat returns is one thing, asked as one question: `references/loop.md`.');
  says(stageRef('acceptance', 'deviations.md'), 'The deviations are put to him as one question, numbered, and he answers by number, as the gate of the skill says.');
  // R165: where the context and a source disagree, the context holds, in every brief of the truth judge.
  for (const stage of ['structure', 'detail', 'look', 'acceptance']) says(subsection(stageRef(stage, 'seats.md'), '`judge.truth`'), 'It carries one line: where the context and a source it is handed disagree, the context holds.');
  says(read('templates/briefs/judge.md'), 'A truth judge: "Where the context and a source you are handed disagree, the context holds."');
  // R175: an accepted deviation is written, carried, handed to every judge and never to an audience, and is not a finding again.
  says(loop, '**What he has accepted is part of what was approved.**', 'is written under "Accepted deviations" of the stage\'s output: what it is, what it breaks, his words, the day.',
    'handed to every judge from that stage on as part of what was approved, never to an audience.', 'it goes to no fix round and does not count as blocking',
    'Where only a part of a finding rests on an accepted deviation, split it into its parts, each quoted in the judge\'s words', 'At the stamp, the decision you append names each accepted deviation.');
  // R186: on the decision page it is a finding that carries the stage, under a heading of its own; the field is one the page script takes.
  says(loop, 'In the decision\'s data it goes under `findings` with that stage in `accepted`, as `"accepted": "detail"`, and the page lists it under a heading of its own, "Accepted deviations", apart from the open findings.');
  assert.doesNotMatch(loop, /its `seat` reading/);
  const acceptedSample = JSON.parse(read('templates/outputs/decision-approve.json')).findings.filter(finding => Object.hasOwn(finding, 'accepted'));
  assert.deepEqual(acceptedSample.map(finding => finding.accepted), ['detail'], 'the sample of an approval shows the field once');
  assert.match(KIT.usage('scripts/page.mjs').replace(/\s+/g, ' '), /carries "accepted", the stage it was accepted at, as "accepted": "detail" .* under a heading of their own, "Accepted deviations"/);
  // R173: a seat's line or a finding may quote a question; the page counts the marks of its question and its reason.
  says(loop, 'it counts the question marks of the question and of the recommendation\'s reason, and no others. A seat\'s line or a finding may quote a question she asks, as it was written.');
  assert.match(KIT.usage('scripts/page.mjs').replace(/\s+/g, ' '), /more than one question mark in the question and the reason of the recommendation together/);
  for (const stage of ['detail', 'look']) {
    const names = headings(outputOf(stage));
    assert.ok(names.indexOf('What the readers found') < names.indexOf('Accepted deviations') && names.indexOf('Accepted deviations') < names.indexOf('Reviewed by the founder'), stage);
    says(section(outputOf(stage), 'Accepted deviations'), 'Part of what was approved: every judge from this stage on is handed this section, and what it lists is not a finding again. An audience is never handed it.');
  }
  says(read('templates/briefs/judge.md'), '**The accepted deviations**, part of what was approved and not a finding again:');
  assert.doesNotMatch(read('templates/briefs/audience.md'), /deviation/);
  for (const [id, card] of Object.entries(kitCards()).filter(([, card]) => card.shelf === 'judge')) {
    assert.match(flat(section(read(`pool/judges/${id.split('.')[1]}.md`), 'Never')), /accepted deviation/, id);
    // M6 of the fix review: the line says what is written in place of a finding, so that it does not read as "none, then one".
    if (id !== 'judge.cold-implementer') says(section(read(`pool/judges/${id.split('.')[1]}.md`), 'Never'), 'Never make a finding of what your brief lists as an accepted deviation: write it once, as "accepted at <stage>", with no fix and no severity of its own.');
  }
  // F58, R172: at a pick nothing is mended, and a split between the seats is said in the one recommendation.
  says(loop, 'At a pick, a finding marked `blocks` stays in its seat\'s line beside its option: nothing is mended, and nothing read again.',
    'Where the seats rank the options differently it is one recommendation still, and its reason says that they rank them differently and that he settles it.');
  // R162: the copy of a profession\'s profile is made by the card script, never by hand.
  says(loop, 'The kit\'s card script, `scripts/card.mjs`, makes the copy, by its `traits` verb, from her profession\'s profile, at the path given after `--out`',
    'It takes out each field, from its label to the next blank line, with each paragraph of the opening that speaks of the fields. It refuses a profession\'s profile that fails its check, and a copy in which the words "so the interface must" are still written: then nothing is written, and what it printed goes to the founder.',
    'The copy is never made by hand.');
  // The command is given as the script takes it, and what the sentence says of it is what its usage says.
  assert.ok(commandsOf(reference('loop.md')).includes('node <kit root>/scripts/card.mjs traits <profile> --out <file>'));
  const cardUsage = KIT.usage('scripts/card.mjs').replace(/\s+/g, ' ');
  for (const said of ['from its label to the next blank line', 'each paragraph before the first section that speaks of the fields themselves', 'It refuses a profile that fails check', 'a copy in which the words "so the interface must" are still written']) assert.ok(cardUsage.includes(said), said);
  // F53, F77, R177, R171: a brief has a name, the reads folder is made first, and a seat is told which pictures come first.
  says(loop, 'Its name is `<stage>-<seat>-brief.md`', '**Make the stage\'s `reads/` folder before you start its readers.** A seat writes its own file there, and never lists the folder',
    '**A seat handed more pictures than one read opens is told which come first:**', 'which pictures show the first screen only, as she meets it before any scrolling, and which the whole page.');
  // R190: a first screen is pictured at Structure only. From Detail on "without scrolling" is a measured check's to answer.
  says(loop, 'At Structure, an audience\'s brief also says which pictures show the first screen only',
    '**A first screen is pictured at Structure only.** From Detail on, "without scrolling" is answered by a check, and never by reading a picture: the `in-viewport` type of the acceptance script, `scripts/accept.mjs`.',
    // R191: the check is the visual designer's to write, at Look: which element answers a criterion is a maker's judgement.
    'At Look the visual designer writes one for each success criterion that says it, which its brief carries, and Handoff takes it over: which element answers it is a maker\'s to choose. From Detail on a judge\'s brief points to that check, and an audience\'s brief says nothing of first screens.');
  assert.ok(Object.hasOwn(TYPES, 'in-viewport'));
  for (const stage of STAGES) {
    const takesFirst = stageCommands(stage).some(command => command.includes('--first-screen'));
    assert.equal(takesFirst, stage === 'structure', `${stage}: ${takesFirst ? 'takes' : 'takes no'} first-screen picture`);
  }
  says(read('templates/briefs/audience.md'), '{Which pictures her tasks need first, by name.}', '{At Structure: which pictures show the first screen only, as she meets it before any scrolling, and which the whole page: "without scrolling" is answered on the first. From Detail on, delete this.}');
  says(read('templates/briefs/judge.md'), '{From Detail on, for each success criterion that says "without scrolling": that a measured check answers it, the `in-viewport` check, with its id and its result where it has run; no picture does.}');
  says(stageRef('detail', 'seats.md'), '**No first screen is pictured here:** that is Structure\'s, and every picture of Detail is of a whole page.',
    'a judge\'s brief says that a measured check answers it, the `in-viewport` check the visual designer writes at Look, and that no picture of this stage does; an audience\'s brief says nothing of first screens.');
  says(stageRef('look', 'seats.md'), '**No first screen is pictured here:** that is Structure\'s.',
    'a judge\'s brief carries one line for it: the criterion, the id of the `in-viewport` check the visual designer wrote for it, and what the last run of step 5 returned for that check, as it came. That result answers the criterion, and no picture does.');
  // R191: the visual designer writes the check, in its own checks.json and a variant's, from a brief that carries each such
  // criterion word for word; the conductor sees that one is there, as it holds the table to its run, and writes none.
  const lookSteps = section(stageSkill('look'), 'Steps');
  says(stepOf(lookSteps, 'Photograph and measure'), 'and this run is what you hold it to. In the same way, see that `checks.json` holds an `in-viewport` check for each success criterion that says "without scrolling": the visual designer writes it, and you choose no element.',
    'a check that failed, or a criterion with no check goes back to a fresh visual designer', 'each row by its result id and its measured value, a criterion in its words. You write no value and no check, and correct none.');
  says(stepOf(lookSteps, 'Start the visual designer'), 'and an `in-viewport` check for each criterion its brief gives that says "without scrolling", in a variant\'s own too');
  assert.doesNotMatch(flat(stageSkill('look')), /add to `checks\.json`|`in-viewport` check (?:that step 5|Look adds)/);
  const lookDesigner = flat(subsection(stageRef('look', 'seats.md'), '`maker.visual-designer`'));
  says(lookDesigner, 'gives four things.', 'And each success criterion of the intent that says "without scrolling", copied word for word, since the seat is not handed the intent: for each, it writes an `in-viewport` check of the element that answers it, at the width the criterion names, in `checks.json` and in a variant\'s own. Which element answers it is the seat\'s to choose, never yours.',
    'and the checks that failed, as facts, each by its result id and its measured value, and each criterion that has no `in-viewport` check, in its words;',
    'A table that still does not hold after its send-back, or a criterion still with no check, goes to the founder, open. You write no value and no check.',
    '**An `in-viewport` check that fails** is a check of step 5 that failed: it goes back to the visual designer in that send-back, and nobody but the visual designer changes a screen for it. One that still fails after the send-back is handed to the judges in their briefs, as "The readers" below says, and is listed on the decision page as an open finding under `findings`, its seat `check: <id>`.');
  assert.ok(!kitCards()['maker.visual-designer'].reads.includes('intent'), 'the designer is not handed the intent: its brief carries the criteria');
  says(read('templates/briefs/maker.md'), 'what the founder marked in a fresh pass; each "without scrolling" criterion, word for word; for a direction');
  says(read('pool/makers/visual-designer.md'), 'For each success criterion your brief gives that says "without scrolling", write an `in-viewport` check of the element that answers it, at the width it names: in your checks, and a variant\'s too.');
  says(read('pool/audiences/task-reader.md'), 'At Structure a picture of the first screen shows what she meets before any scrolling', 'After Structure every picture is of a whole page, and says nothing of where a screen ends.');
  // M4: a judge's reply is its card's own, and the cold implementer's is not the others'.
  assert.ok(read('templates/briefs/judge.md').trimEnd().endsWith('\nWhat your card\'s Output says the reply is.'));
  // S15: the page's parts, the new heading among them.
  says(loop, 'the open findings when there are any, the accepted deviations under a heading of their own, "Accepted deviations", when there are any, one recommendation with one sentence of reason, and last the question.');
  // F48: a brief is filled from the stage\'s seats page, and the reply is the card\'s own.
  for (const shelf of ['maker', 'judge']) {
    says(read(`templates/briefs/${shelf}.md`), '`references/seats.md`', 'What your card\'s Output says the reply is');
    assert.doesNotMatch(read(`templates/briefs/${shelf}.md`), /the card's `(?:reads|never-reads)`/, shelf);
  }
  for (const stage of ['structure', 'detail', 'look', 'acceptance']) says(stageRef(stage, 'seats.md'), 'never from the seat\'s card, which you do not open');
});

test('the dry run, Structure and Detail: a rule selects what a maker is given, the audience sees no maker\'s note, and what a maker could not decide is one question for each list', () => {
  const structure = stageSkill('structure');
  // F47: today\'s screen is defined, and the blind on it ends at the pick.
  says(section(structure, 'Reads'), 'Today\'s screen is the surface being redesigned, as it is: the blind on it ends at his pick.');
  const seats = stageRef('structure', 'seats.md');
  says(seats, '"Today\'s screen" is the surface being redesigned, as it is, as a picture or as source. "A sibling surface" is another surface of the product. "Project sources" of the context says which a file is.');
  says(stageRef('look', 'seats.md'), 'A new surface has no screen of today, and the surface it sits beside is a sibling.');
  // R160: the hardest states and the worst rows are selected by a written rule, in both briefs and at Detail.
  for (const file of ['BRIEF.md', 'BRIEF-fresh.md']) {
    says(read(`templates/package/04-structure/${file}`), 'Every state the intent says she must be told about, one line each', 'The rule selects them: none is weighed, and none is left out.',
      'with every row that states a limit, a delay or a failure', 'A real label that names a screen of today is given as the facts it states, never in its own words.');
  }
  says(stageRef('detail', 'seats.md'), 'every row of the context\'s inventory that states a limit, a delay or a failure, as the context states it. The rule selects them: you weigh none, and leave none out.');
  // R171: each letter is drawn with the makers\' notes and without, each page pictured whole and as its first screen.
  says(stepOf(section(structure, 'Steps'), 'Merge, draw, photograph'), 'Render twice for each letter, the second time without the makers\' notes, for the audiences; then the shots once, at the brief\'s two widths, every page pictured twice, whole and as its first screen alone');
  says(stepOf(section(structure, 'Steps'), 'Start the readers, by letter'), 'then the audiences, once every judge has written its ledger', 'an audience is handed the pictures only, each by its path, those drawn without the makers\' notes');
  says(seats, 'The audiences are handed the pictures of the pages drawn without them, and no other.', 'A brief says which is which, and that "without scrolling" is answered on the first.',
    'An audience is started once every judge has written its ledger, and not before.', 'A judge\'s brief asks that the "Where" of each finding open with the letters it holds for');
  says(read('templates/briefs/audience.md'), '{the width each task puts her at}, in the light theme', '"without scrolling" is answered on the first.', 'There is one option: no ranking is asked.');
  // F58: a blocking finding at a pick.
  says(stepOf(section(structure, 'Steps'), 'Build the decision page'), 'A finding marked `blocks` stays in its seat\'s line beside its letter: at a pick nothing is mended.');
  // F55: the truth judge and the prototype builder are handed the data the example rows come from.
  for (const id of ['judge.truth', 'maker.prototype-builder']) assert.ok(kitCards()[id].reads.includes('example-data'), id);
  says(read('pool/CARD-FORMAT.md'), '| `example-data` | The project source the context names for the rows its inventory gives as examples');
  says(read('pool/makers/prototype-builder.md'), 'comes from the data your brief hands you: you make none up.');
  // W-N1 of the re-review: Detail's seats page does what the builder's card promises, before the gate.
  says(subsection(stageRef('detail', 'seats.md'), '`maker.prototype-builder`'),
    '**A page that waits for its example rows,** which its reply names when its brief handed it no data, goes to the founder first: ask him for the data, one question, as step 4 of the skill says, and write his answer under "Reviewed by the founder" of `DETAIL.md`.',
    'A fresh prototype builder is then handed it in a brief, as he gave it: his words, or the file he names, by its path. Only what it still could not build goes on the decision page. You write no row.');
  // Detail: F74, F77, F80, F63.
  const detail = stageSkill('detail');
  says(stepOf(section(detail, 'Steps'), 'Photograph every page'), 'Light only: the themes are Look\'s.');
  says(stepOf(section(detail, 'Steps'), 'Start the readers'), 'Make that folder first: a seat never lists it. Every judge is handed the accepted deviations, as approved.');
  says(stepOf(section(detail, 'Steps'), 'Build the decision page'), 'those Structure carried on the chosen structure among them, answered one by one. Delete the template\'s comment.');
  says(outputOf('structure'), 'Detail answers each, under its own "What the readers found".');
  says(outputOf('detail'), 'Then each finding Structure carried on the chosen structure: how Detail answered it, or open with why.');
  // F65, R175, F68, F69, R176: his answers are written once; the writer\'s round is run once.
  const at = stageRef('detail', 'seats.md');
  // M7 of the fix review: the line under the designer's list carries the outcome whole, since that heading is read without
  // the section his words are in; a number by itself is the pointer no maker may write.
  says(at, '**His answers are written once.** His words go under "Reviewed by the founder" of `DETAIL.md`, numbered, and under the list one line gives each outcome in full, the answer\'s number only beside it, as "A waiting list when no room is free: it does not exist, and the element goes (answer 12)".',
    'so the line must stand alone: a number, by itself, is a pointer. That line is the one thing you write under a heading of the designer\'s: you change no entry.',
    'Where an answer of his would accept one without naming it, as a blanket yes to a whole list, say so first, with the rule and its source, as step 8 of the loop says: he decides each.',
    'The file holds the template\'s keys and nothing else', 'An entry it settles as "no line owed" is closed.',
    '**One fresh interface writer then writes the lines,** handed his facts and the settled entries together', 'An entry he has already answered is not sent round again, and this round is run once',
    '**A line for an element the structure lacks,** which the writer names in its reply, is not written, by it or by you: it is a finding for the founder, with the gate.',
    'the rest of `<package>/04-structure/`: the board, the proposals folder, `earlier/`, but `<chosen>` where a seat is handed it.');
  says(read('pool/makers/interface-writer.md'), 'in your reply and never in the strings file', 'The file holds the template\'s keys and nothing else: no note of yours, and no list.');
  // R179, R180: every item that shows text has an id, and no maker writes a pointer to another file of the package.
  says(read('pool/makers/interaction-designer.md'), 'Every item that shows text or takes an action carries one, a status tag included: a check reaches an element only by its id.');
  for (const name of ['interaction-designer', 'interface-writer', 'prototype-builder', 'visual-designer']) assert.match(flat(section(read(`pool/makers/${name}.md`), 'Never')), /Never point from [^.]* to another file of the package/, name);
  // F73: a card gives a script of the kit from the kit\'s root, which is two folders above it.
  for (const [id, card] of Object.entries(kitCards())) {
    const text = read(`pool/${card.shelf}s/${id.split('.')[1]}.md`);
    assert.doesNotMatch(text, /^\s*node scripts\//m, `${id} gives a command from the kit's root as node <kit root>/scripts/…`);
    if (/node <kit root>\/scripts\//.test(text)) assert.match(text, /`<kit root>` is the kit, two folders\s+above this card/, id);
  }
});

test('the dry run, Look, Handoff and Acceptance: the table is held to the run, nothing points back, a default is held first, and a build with no driver gets one on his yes', () => {
  // Look: F81, F83, R178, F88, F86, F82, F90.
  const look = stageSkill('look');
  says(stepOf(section(look, 'Steps'), 'Photograph and measure'), 'kept with its readings in `measure/`', 'goes back to a fresh visual designer, once for each run of this step, before the readers start, as facts: each row by its result id and its measured value, a criterion in its words.');
  const lookSeats = stageRef('look', 'seats.md');
  says(lookSeats, 'It never writes `<package>/06-look/results.json`: that file is your run, and its brief says so.', '`<package>/06-look/measure/`, the visual designer\'s own tools;',
    '**The send-back of step 5 is run once for each run of that step,** before any reader starts or reads again, and it is no fix round: the fix round is the readers\', and there is one.',
    'says that "What the readers found" of that file is not the seat\'s to read: it quotes every ledger of Detail.', 'a decision log that section cites, as for a date, is not one, and is never handed.',
    '**No kit is handed here.**', 'A page of `screens/` is named as the prototype\'s page of the same screen, state and language.',
    '**What the look decides** is in its reply too, one line for each that this design settles. You copy those lines into `LOOK.md` as they came');
  says(read('pool/makers/visual-designer.md'), 'and what the look decides, one line for each that this design settles: hierarchy, spacing, emphasis, density, what each width does, the themes.', 'Never write over a results file that is not yours.');
  says(outputOf('look'), 'The visual designer\'s lines, copied as its reply gave them');
  // Handoff: R159, R180, F92, F95, F98, F80, R165, R175, F100, R181.
  const handoff = stageSkill('handoff');
  // S1: the proof is step 7's, once every file of the folder is written.
  says(stepOf(section(handoff, 'Steps'), 'Write `COVERAGE.md`, and fill `HANDOFF.md`'), '**Then prove that nothing points back,** in a comment or a note: no text file of the folder names a file of the package that the folder does not hold.');
  const folder = stageRef('handoff', 'folder.md');
  assert.ok(commandsOf(stepOf(section(handoff, 'Steps'), 'Write `COVERAGE.md`, and fill `HANDOFF.md`')).includes('node <kit root>/scripts/alone.mjs <package>/07-handoff --package <package>'));
  says(folder, 'An address is not the only way out, so the same command, by its `--package`, also reads every text file of the folder', 'It prints each place, by file and line, and exits 1.',
    'A folder\'s name is found where it is written as a path, with its slash; `../build/`, the builder\'s place, may be named.',
    'A pointer that names no file, as "answer 28" or "as decided at Detail", it does not see: the first rule of this page still holds for what you write, and the cold implementer reads for the rest.');
  const aloneUsage = KIT.usage('scripts/alone.mjs').replace(/\s+/g, ' ');
  for (const said of ['for the name of any file or folder of the package that the folder does not hold', 'the package\'s build/ folder, which is the builder\'s place', 'it is found only where it is written as a path, a slash before it or after it', 'A pointer that names no file, as "answer 28" or "as decided at Detail", is not seen']) assert.ok(aloneUsage.includes(said), said);
  says(folder, '**Nothing points back, proved too.**', 'the file is not rewritten: what was approved does not change here. `PARTS.md` says where the pointer is and what it stood for',
    // S-N1: a row of the states is in SPEC.md, a file the conductor writes, and is mended there; the example of an approved file is true.
    '**In a file you wrote,** write out what the pointer stood for, and take the pointer out. `SPEC.md` is one: a row of the states that reads "as answered" is written out there in full, as any file you wrote is mended.',
    '**In a file approved at an earlier stage and copied in, unchanged or changed only by the rewrites of step 3** of the skill, as the comment that opens a stylesheet of the screens, the file is not rewritten',
    '`scripts/inpage/accept-inpage.js` of the kit is copied whole, as it is, to `<package>/07-handoff/accept-inpage.js`', 'The builder still has no kit',
    'A stylesheet, a picture or a script a page loads from the project is an asset', 'On success it prints one line, that the folder stands alone, with its counts: that line is not a fault.',
    'and the languages by the codes `languages` of the project profile gives.', 'The `min` of a `contrast` is the standard the row is held to: the measured value stands beside it',
    'Who looks is a seat of the cast, the task reader for "a person trying her task", or the founder; where a criterion names a language, a reader of that language.',
    'those that hold only for a letter not chosen are counted in one line, and none is written out: a letter not chosen does not reach the folder.',
    'Where the context corrected a fact of a project document, one slice mends that document', 'Under "Must not change" go the accepted deviations of `LOOK.md`, each as approved');
  const handoffSeats = stageRef('handoff', 'seats.md');
  says(handoffSeats, '**A default is your proposal, and is held first.** Before it goes to him, hold it against the pages and the checks it touches', 'never under a blanket "use the written default".',
    'the decision page lists it under `findings`, by seat, as "closed after the re-read, not read again"', 'A case inside a row, as three kinds of room in one row of a dialog, is no state',
    'which is the project\'s code and not `<packages>`', '`<package>/07-handoff-gate/`, but its own earlier ledger there on a re-read');
  says(read('templates/package/07-handoff/HANDOFF.md'), '| `accept-inpage.js` | What makes those checks in a page', 'Each accepted deviation, as approved: what it is, the rule or the line it breaks, his words, the date.');
  says(guide(), '`accept-inpage.js` makes the checks, in your build as it did in the prototype.', 'The checks see what a page shows: they press nothing, load nothing and move no focus.',
    'One row for every row of the "States" tables of `SPEC.md`, those that cannot occur marked so', 'A row leads to the state\'s behaviour, not only to its picture.');
  // Acceptance: R159, R183, F104, F105, F107, F108, F110, R174.
  const acceptance = stageSkill('acceptance');
  // R189, which corrects R159: the kit writes a driver only for a build that opens as files, since its browser library opens
  // local files and nothing else. A build that needs a server or a sign-in has no driver the kit can write: he is told, and the
  // stage stops. No step has a session write code that fetches a sign-in.
  const start = stepOf(section(acceptance, 'Steps'), 'Start the build and sign in');
  says(start, '**Where the project profile names no script, there is no driver.** For a build that opens as files, say so to the founder and, on his yes, written under `## Reviewed by the founder` first, write the project\'s driver, one script in the project, on the kit\'s `scripts/lib/browser.mjs`, and write its command into the project profile.',
    'For a build that needs a server or a sign-in the kit can write none: say so to him, open, and stop, as step 2 stops on a credential.');
  assert.ok(existsSync(at('scripts/lib/browser.mjs')) && existsSync(at('scripts/lib/chrome.mjs')));
  // What the section rests on is true of the library: every page it opens is a local file.
  const library = read('scripts/lib/browser.mjs');
  assert.match(library, /pathToFileURL\(resolve\(file\)\)/);
  assert.doesNotMatch(library, /https?:\/\//);
  // M8: the library is among the skill's reads, for the case it is read in.
  says(section(acceptance, 'Reads'), '`scripts/lib/browser.mjs`, where step 3 has you write a driver.');
  const driving = stageRef('acceptance', 'driving.md');
  const noDriver = section(driving, 'When the project keeps no driver');
  assert.match(flat(noDriver), /^ The kit can write a driver only for a build that opens as files: its browser library, `scripts\/lib\/browser\.mjs`, opens local files and nothing else\. This section is for that case alone\./);
  says(noDriver, '**A build that needs a server or a sign-in has no driver the kit can write.** Say so to the founder, open',
    'Then stop, as step 2 of the skill stops on a credential. You write no script that starts a server, opens an address or signs in, and none that takes a sign-in from where it is kept.',
    // M8: one question, the path named in it; his yes in the artefact before anything is written.
    '**For a build that opens as files,** say so to the founder, and ask one thing: may you write the project\'s driver, at the path you name?',
    'Name the path in the question: where the project keeps its scripts, as its own documents show.',
    'His answer is written under "Reviewed by the founder" of `REPORT.md`, as he said it, before the driver is written. On his yes, and never before:',
    '**One script, in the project,** at the path of his answer.', 'Its header is its contract: read it, and use only what it gives.',
    '**For each state, the driver does five things:** it opens the state\'s file, as its row of `STATES.md` names it',
    '**It holds no sign-in, and makes none.** A build that opens as files asks for none: no password, token or key is written in it, read by it, printed by it, or passed to it on a command line.',
    '**Its command goes into the project profile,** under "How a browser check is run here", once he has seen the line');
  assert.doesNotMatch(flat(noDriver), /takes one from where it is kept|where he says the project keeps such scripts/);
  assert.match(flat(section(acceptance, 'Never')), /\*\*Never write a script that signs in,\*\* or one that takes a sign-in from where it is kept\./);
  assert.ok(headings(read('templates/package/08-acceptance/REPORT.md')).includes('Reviewed by the founder'));
  // The sign-in of a build that has one is the project's own driver's to take, never a script's that a session wrote.
  says(section(driving, 'Accounts, data and secrets'), 'The project\'s own driver takes the sign-in from there: a driver you wrote opens files, and signs in nowhere.');
  says(setup(), 'A project with no script for a browser check reads "no script": Acceptance then writes one, on his yes, for a build that opens as files.');
  says(read('templates/project/PROFILE.md'), '"No script" is an answer: Acceptance then writes one, on his yes, if the build opens as files.');
  says(driving, 'A row that says the build only draws the state, and cannot do what the state does, is not sent back', '`ACCEPTANCE.md` leaves three kinds of thing to a hand',
    'press Tab until focus leaves the last stop', 'Set the root font size to 200%, and say in the entry what was set', 'needs a sideways scroll, or breaks a word across lines.',
    'a seat of the cast, the task reader where it names a person trying her task, or the founder. Where it names a language, a reader of that language looks.');
  says(read('templates/package/build/STATES.md'), 'A row leads to the state\'s behaviour, not only to its picture', 'One row for every row of `SPEC.md`\'s States, those that cannot occur marked so');
  says(stepOf(section(acceptance, 'Steps'), 'Write the report, item by item'), 'What a reader found that the approved design already had is no deviation: the report has a place of its own for it.');
  assert.ok(read('templates/package/08-acceptance/REPORT.md').includes('\n### What the readers found that was approved as it is\n'));
  const acceptanceSeats = stageRef('acceptance', 'seats.md');
  says(acceptanceSeats, '**What he accepted is handed to every judge,** as part of what was approved: "Must not change" of `<package>/07-handoff/HANDOFF.md`', 'The files of the build its brief lists.',
    'at Acceptance a first read of the build fills that table too, and the brief\'s line for the file reads "Your seat\'s earlier ledger"', 'For a judge, a folder of pictures is named by its path and its naming rule',
    'start one instance more for that language, the same person', 'You make that copy without opening her profession\'s profile: the loop\'s command takes its path.');
  says(read('templates/outputs/LEDGER.md'), 'On a re-read, or at Acceptance with an earlier stage\'s ledger', 'At Structure, "Where" opens with the letters the finding holds for');
  says(read('templates/briefs/judge.md'), '**Your seat\'s earlier ledger**, on a re-read or at Acceptance');
  says(reference('lessons.md'), 'At Acceptance, which opens little of the package, that is the sources the Acceptance skill names');
  // F79: the sample of an approval names its pictures as the picture script does, with the language.
  const sample = JSON.parse(read('templates/outputs/decision-approve.json'));
  assert.deepEqual([sample.options[0].title, sample.options[0].images], ['The prototype', ['shots/today-default-en-390-light.png', 'shots/today-default-en-1280-light.png']]);
});
