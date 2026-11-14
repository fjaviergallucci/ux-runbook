// The rules every skill of the kit keeps, and the eleven skills held to them.
// A skill is skills/<name>/SKILL.md, read by a session at the moment it must act and followed literally,
// with the long form of anything in references/ beside it. Each rule is a function, proven first on samples
// that exist nowhere else. Then each skill that is written is held to the rules, and each that waits for
// its task is a `todo` naming the task: take its `waits` out of the table and its test is live.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../scripts/lib/frontmatter.mjs';
import { MAP, PICK } from '../scripts/lib/merge.mjs';
import { ARTEFACT, FOUNDATIONS, KINDS, SIZES, STAGES, routeFor } from '../scripts/lib/state.mjs';
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
    name: 'frame', stage: true, waits: 'Task 15',
    description: 'Use when the interface design pipeline reaches Frame: a new design request must be classified by kind, foundation and size, and its route chosen.',
  },
  {
    name: 'context', stage: true, waits: 'Task 15',
    description: 'Use when the interface design pipeline reaches Context: the facts a design must be true to are gathered and corrected by the founder before anyone has an idea.',
  },
  {
    name: 'intent', stage: true, waits: 'Task 15',
    description: 'Use when the interface design pipeline reaches Intent: the person, the job, the success criteria, the tasks and the states of a surface are written from the corrected context.',
  },
  {
    name: 'cast', stage: true, waits: 'Task 15',
    description: 'Use when the interface design pipeline reaches Cast: the makers, the judges with their checks, the audiences and any fresh pass are chosen for one design.',
  },
  {
    name: 'structure', stage: true, waits: 'Task 16',
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

test('the conductor gives the nine stages in order, each with the skill to invoke, and setup first when the project has no project profile', () => {
  const { name: plugin } = JSON.parse(read('.claude-plugin/plugin.json'));
  const order = section(conductor(), 'The order');
  const rows = tableRows(order).filter(row => /^\d+$/.test(row[0]));
  assert.deepEqual(rows.map(row => Number(row[0])), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(rows.map(row => row[1].toLowerCase()), STAGES);
  assert.deepEqual(rows.map(row => unspan(row[2])), STAGES.map(stage => `${plugin}:${stage}`));
  // Each stage's output is the file the state script stamps.
  assert.deepEqual(rows.map(row => unspan(row[4])), STAGES.map(stage => ARTEFACT[stage]));
  const before = flat(order.slice(0, order.indexOf('\n|')));
  assert.ok(before.includes(`has no project profile, invoke \`${plugin}:setup\` first`), 'setup first, when the project has no project profile');
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
  assert.match(steps, /If `<packages>\/PROFILE\.md` has a `## Reviewed by the founder` section, the project is set up: say so, and stop/);
  assert.match(steps, /go on from the first step whose output is missing/);
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
  // The two sections setup adds are none of the template's.
  for (const name of ['Engine check', 'Reviewed by the founder']) {
    assert.ok(!sections.includes(name), name);
    assert.ok(setup().includes(`\`## ${name}\``), `SKILL.md names ## ${name}`);
  }
});

test('an outside engine is the founder\'s to turn on: setup writes it only on his yes, in its card\'s spelling, with the model id he gives', () => {
  const steps = flat(section(setup(), 'Steps'));
  assert.match(steps, /Say what a yes means: the brief leaves this machine/);
  assert.match(steps, /\*\*Only on his yes\*\*, ask which provider, and add it to `engines-on` in its card's spelling: `model:openai`, `model:gemini`/);
  assert.match(steps, /ask the model's id, and write it as he gives it: `openai-model`, `gemini-model`/);
  assert.match(steps, /On his yes, add `tool:stitch` to `engines-on`/);
  assert.match(steps, /`engines-on` stays `\[\]`/);
  // The spellings are the card format's own, and the template's.
  for (const text of [read('pool/CARD-FORMAT.md'), read('templates/project/PROFILE.md')]) assert.ok(text.includes('`model:openai`, `model:gemini`, `tool:stitch`'));
  // The keys file is a path he gives, and the path is all setup has to do with it.
  assert.match(steps, /a dotenv file outside the repository; if in a file, he gives its path, and you write the path as `keys-file` and do nothing else with it/);
  assert.match(flat(section(setup(), 'Never')), /\*\*Never turn an engine on yourself\.\*\* `engines-on` holds what the founder said yes to/);
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
  assert.match(check, /Is that skill installed on this machine, under that name\?.*Do not run it/);
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
  assert.match(check, /Record it in the project profile under `## Engine check`, after the template's sections: the day, then a table `\| Engine \| Used by \| Result \|`, one row for each engine/);
  for (const result of ['answers', 'installed', 'listed', 'missing', 'off']) assert.ok(check.includes(`\`${result}\``), `the result ${result}`);
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
    /\*\*Never invent a design system\.\*\*/, /\*\*Never copy a real component into the project kit,\*\* and never run the project's own toolchain/,
    /\*\*Never invent a trait of a profession\.\*\*/, /\*\*Never stop a process by name or by pattern\.\*\* The machine is shared\. A browser is started only through the kit's scripts/,
    /\*\*Never write a package, or anything outside `<packages>` and `<scratch>`\.\*\*/, /\*\*Never rewrite a project profile that the founder has reviewed\.\*\*/,
  ]) assert.match(text, rule);
});

test('the gate: the founder corrects the project profile once, hears that the stubs are guesses, and his words are written into it', () => {
  const gate = flat(section(setup(), 'Gate'));
  assert.match(gate, /\*\*The founder corrects the project profile, once\.\*\*/);
  assert.match(gate, /ask one question/);
  assert.match(gate, /each stub of a profession's profile is a guess, and stays one until someone of that profession has been heard/);
  assert.match(gate, /write `## Reviewed by the founder` as the last section: the day, what he corrected, and the words he approved it with/);
  assert.match(gate, /An approval that is only in the chat is not one/);
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
  assert.match(said, /one stub for each profession he named/);
  assert.match(said, /from `templates\/people\/PROFILE-CARD\.md`: its id `profile\.<name>`, every heading and all four labels kept, the example specialty deleted/);
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
  assert.deepEqual([...new Set(commands.map(command => /scripts\/([a-z]+)\.mjs/.exec(command)[1]))].sort(), ['describe', 'render', 'shots']);
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
  assert.match(text, /\*\*A project with no design system gets the grey kit as it is\.\*\*/);
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
