// The rules every skill of the kit keeps, and the eleven skills held to them.
// A skill is skills/<name>/SKILL.md, read by a session at the moment it must act and followed literally,
// with the long form of anything in references/ beside it. Each rule is a function, proven first on samples
// that exist nowhere else. Then each skill that is written is held to the rules, and each that waits for
// its task is a `todo` naming the task: take its `waits` out of the table and its test is live.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from '../scripts/lib/frontmatter.mjs';
import { MAP, PICK } from '../scripts/lib/merge.mjs';
import { ARTEFACT, FOUNDATIONS, KINDS, SIZES, STAGES, routeFor } from '../scripts/lib/state.mjs';

const root = new URL('../', import.meta.url);
const at = path => new URL(path, root);
const read = path => readFileSync(at(path), 'utf8');

// ---- the eleven skills: each name, and its description word for word

// `stage`: one of the nine stage skills, which have the six sections. `waits`: the task that writes it.
const SKILLS = Object.freeze([
  {
    name: 'design',
    description: 'Use when the user wants an interface designed, redesigned, adjusted or corrected (a screen, a flow, a page, a component), wants to resume or check a design package, or names a stage of the interface design pipeline. Start here: it holds the order of the stages, the state and the gates.',
  },
  {
    name: 'setup', waits: 'Task 14',
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

// The six sections of a stage skill, in this order. A section of the skill's own may follow the last.
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
// in a sentence, in a code span, or in a command after the kit's root. A path that follows another folder
// (`<packages>/kit/kit.css`, `design/pool/persons`, an absolute path) starts elsewhere and is the project's.
// A placeholder ends a path: `pool/makers/<name>.md` names `pool/makers`.
const KIT_PATH = new RegExp(`(?:(?<=<kit root>/)|(?<=(?<![\\w.-])\\./)|(?<![\\w/.-]))(?:${KIT_FOLDERS.join('|')})/(?:[\\w.-]*\\w(?:/[\\w.-]*\\w)*)?`, 'g');
const kitPaths = text => [...new Set([...text.matchAll(KIT_PATH)].map(([path]) => path.replace(/\/$/, '')))];
// A file of the skill's own references, as one of its files names it.
const ownReferences = text => [...new Set([...text.matchAll(/(?<![\w/.-])references\/[\w.-]*\w/g)].map(([path]) => path))];

// The words of a command: a quoted string or a <placeholder> is part of one word, spaces and all.
const words = line => line.match(/(?:"[^"]*"|<[^>]*>|[^\s"<]+)+/g) ?? [];
// The commands a text gives: each line of a code fence, and each code span, that starts with `node`.
function commandsOf(text) {
  const lines = linesOf(text);
  const spans = [...lines.filter(({ fenced }) => !fenced).map(({ line }) => line).join('\n').matchAll(/`([^`]+)`/g)].map(([, span]) => span);
  return [...lines.filter(({ fenced }) => fenced).map(({ line }) => line), ...spans].map(line => flat(line).trim()).filter(line => /^node /.test(line));
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

// Every path of the kit a file names is in the kit, and every reference of its own is in its folder.
function pathFaults(file, text, files, kit) {
  return [
    ...kitPaths(text).filter(path => !kit.exists(path)).map(path => `${file}: names ${path}, which is not in the kit`),
    ...ownReferences(text).filter(path => !Object.hasOwn(files, path)).map(path => `${file}: names ${path}, which is not in the skill's folder`),
  ];
}

// Every command that runs a script of the kit runs it from the kit's root, in a form its usage gives.
function commandFaults(file, text, kit) {
  const faults = [];
  for (const command of commandsOf(text)) {
    const [, first = '', ...given] = words(command);
    const run = /^(.*?)scripts\/([\w-]+\.mjs)$/.exec(first);
    // Not a script of the kit: another program's command, or the sentence's own <name>.mjs.
    if (!run) continue;
    const script = `scripts/${run[2]}`;
    const say = what => faults.push(`${file}: \`${command}\` ${what}`);
    if (run[1] !== '<kit root>/') {
      say(`is run as node <kit root>/${script}: a session is not in the kit's folder`);
      continue;
    }
    // A script that is not there is the path rule's to say.
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
function skillFaults({ name, description, stage = false }, files, kit) {
  const text = files['SKILL.md'];
  if (text === undefined) return [`skills/${name}/SKILL.md is not written`];
  return [
    ...headerFaults(text, name, description),
    ...(lineCount(text) > MAX_LINES ? [`SKILL.md: it has ${lineCount(text)} lines, and a skill has ${MAX_LINES} at most: the long form goes in references/`] : []),
    ...(stage ? sectionFaults(text, STAGE_SECTIONS) : []),
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
const SAMPLE_PATHS = Object.freeze(['scripts', 'scripts/rooms.mjs', 'scripts/desk.mjs', 'scripts/silent.mjs', 'pool', 'pool/INDEX.md', 'pool/makers', 'templates/briefs/maker.md', 'kit/grey', 'scripts/lib/walkthrough.mjs']);
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

test('only a stage skill is held to the six sections', () => {
  const own = [['The order', TEXTS.Steps], ['Never', TEXTS.Never]];
  assert.deepEqual(faults({ sections: own }, {}, { ...ROOMS, stage: false }), []);
  assert.deepEqual(faults({ sections: own }, {}, { name: ROOMS.name, description: ROOMS.description }), []);
  assert.equal(faults({ sections: own }).length, 5);
});

test('a skill carries the sentence about the kit\'s root, word for word', () => {
  only(faults({ opening: 'The scripts are in the kit.' }), /^SKILL\.md: it says where the kit's root is, in these words: The kit's root is two directories above/);
  only(faults({ opening: KIT_ROOT.replace('two directories', 'two folders') }), /in these words/);
  only(faults({ opening: KIT_ROOT.replace('<kit root>', '<kit>') }), /in these words/);
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
  only(withStep('Read `templates/briefs/usher.md`.'), /^SKILL\.md: names templates\/briefs\/usher\.md, which is not in the kit$/);
  only(faults({}, { 'references/free.md': 'See `pool/judges/room-truth.md`.' }), /^references\/free\.md: names pool\/judges\/room-truth\.md, which is not in the kit$/);
  // A folder is a path too, and so is a script named in a command.
  only(withStep('The lessons are in `reference/`.'), /^SKILL\.md: names reference, which is not in the kit$/);
  only(withStep('Read the cards in `pool/ushers/<name>.md`.'), /names pool\/ushers, which/);
  only(withCommand('node <kit root>/scripts/floor.mjs <plan.json>'), /^SKILL\.md: names scripts\/floor\.mjs, which is not in the kit$/);
  // Named twice in one file, it is one fault; named in two files, one for each.
  only(withStep('Read `templates/briefs/usher.md`, and again templates/briefs/usher.md.'), /usher/);
  assert.equal(faults({ sections: setSection('Reads', '`kit/blue/kit.css`') }, { 'references/free.md': '`kit/blue/kit.css`' }).length, 2);
  // What the project holds is not looked for in the kit.
  assert.deepEqual(withStep('Her kit is `<packages>/kit/kit.css`, her people in `design/pool/persons/`.'), []);
});

test('a reference a skill points to is in its own folder', () => {
  only(withStep('See `references/booked.md`.'), /^SKILL\.md: names references\/booked\.md, which is not in the skill's folder$/);
  only(faults({}, { 'references/free.md': 'See also `references/booked.md`.' }), /^references\/free\.md: names references\/booked\.md/);
  assert.deepEqual(faults({}, { 'references/free.md': 'See also `references/booked.md`.', 'references/booked.md': 'Booked rooms.' }), []);
  only(skillFaults(ROOMS, { 'SKILL.md': skillText() }, SAMPLE_KIT), /names references\/free\.md, which is not in the skill's folder/);
});

test('the commands of a text are its code spans and fence lines that start with node', () => {
  const text = [
    'Run `node <kit root>/scripts/rooms.mjs free <day> --floor <n>`, then, with the plan, `node <kit root>/scripts/rooms.mjs',
    '<plan.json>`. Not `scripts/rooms.mjs`, not `nodes`, not `then node scripts/rooms.mjs`, not node scripts/rooms.mjs said in a sentence.',
    '', '```', '   node  <kit root>/scripts/desk.mjs closed <desk>', 'ls', '```',
  ].join('\n');
  assert.deepEqual(commandsOf(text), ['node <kit root>/scripts/desk.mjs closed <desk>', 'node <kit root>/scripts/rooms.mjs free <day> --floor <n>', 'node <kit root>/scripts/rooms.mjs <plan.json>']);
  assert.deepEqual(words('node <kit root>/scripts/desk.mjs open <the desk>/front --by "the one who opens" --date=2026-11-14'), [
    'node', '<kit root>/scripts/desk.mjs', 'open', '<the desk>/front', '--by', '"the one who opens"', '--date=2026-11-14',
  ]);
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
    // Another program's command is not the kit's to check.
    'node --version',
    'node --input-type=module -e "import { validate } from \'./scripts/lib/walkthrough.mjs\';" <the absolute path of your file>',
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
});

test('a command runs a script from the kit\'s root, and never passes what no skill passes', () => {
  for (const command of ['node scripts/rooms.mjs free <day> --floor <n>', 'node ./scripts/rooms.mjs free <day> --floor <n>', 'node <kit>/scripts/rooms.mjs free <day> --floor <n>', 'node ../../scripts/rooms.mjs free <day> --floor <n>']) {
    only(withCommand(command), /^SKILL\.md: `node /, /is run as node <kit root>\/scripts\/rooms\.mjs: a session is not in the kit's folder$/);
  }
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
    /^references\/free\.md: names pool\/NOWHERE\.md/, /^references\/free\.md: `node scripts\/desk\.mjs closed <desk>` is run as/, /^references\/free\.md: names a product/,
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
  for (const { name, description, waits } of SKILLS) {
    assert.match(description, /^Use when .+\.$/, name);
    // It is written in double quotes, so it holds none.
    assert.ok(!description.includes('"'), name);
    assert.equal(description, description.trim(), name);
    if (waits !== undefined) assert.match(waits, /^Task 1[4-8]$/, name);
  }
  assert.equal(new Set(SKILLS.map(skill => skill.description)).size, 11);
});

test('the scripts a skill may run print a usage the command rule reads', () => {
  const verbs = script => formsOf(KIT.usage(script)).map(form => words(form)[0]);
  assert.deepEqual(verbs('scripts/state.mjs'), ['init', 'begin', 'await', 'stamp', 'reopen', 'route', 'resize', 'validate', 'next', 'status', 'slug']);
  assert.deepEqual(formsOf(KIT.usage('scripts/merge.mjs')), ['<proposals dir> --out <board dir> [--seed <n>]', 'open <board dir>']);
  assert.deepEqual(verbs('scripts/accept.mjs'), ['prototype', 'report', 'inpage']);
  for (const script of ['scripts/render.mjs', 'scripts/shots.mjs', 'scripts/page.mjs', 'scripts/describe.mjs']) assert.equal(formsOf(KIT.usage(script)).length, 1, script);
  const required = script => Object.entries(specOf(formsOf(KIT.usage(script))[0]).flags).filter(([, flag]) => flag.required).map(([name]) => name);
  assert.deepEqual(required('scripts/describe.mjs'), ['--provider', '--model', '--brief', '--out', '--profile']);
  assert.deepEqual(required('scripts/render.mjs'), ['--kit', '--out']);
  assert.deepEqual(required('scripts/shots.mjs'), ['--out', '--widths']);
  assert.deepEqual(specOf(formsOf(KIT.usage('scripts/page.mjs'))[0]), { fixed: ['<decision.json>'], flags: { '--out': { value: '<decision.html>', required: true } } });
  // What no skill passes is a flag some script takes: the rule refuses something real.
  for (const [flag, script] of [['--endpoint', 'scripts/describe.mjs'], ['--seed', 'scripts/merge.mjs']]) assert.ok(Object.hasOwn(specOf(formsOf(KIT.usage(script))[0]).flags, flag), flag);
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

test('the conductor gives the nine stages in order, each with the skill to invoke, and setup first when the project has no profile', () => {
  const { name: plugin } = JSON.parse(read('.claude-plugin/plugin.json'));
  const order = section(conductor(), 'The order');
  const rows = tableRows(order).filter(row => /^\d+$/.test(row[0]));
  assert.deepEqual(rows.map(row => Number(row[0])), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(rows.map(row => row[1].toLowerCase()), STAGES);
  assert.deepEqual(rows.map(row => unspan(row[2])), STAGES.map(stage => `${plugin}:${stage}`));
  // Each stage's output is the file the state script stamps.
  assert.deepEqual(rows.map(row => unspan(row[4])), STAGES.map(stage => ARTEFACT[stage]));
  const before = flat(order.slice(0, order.indexOf('\n|')));
  assert.ok(before.includes(`has no profile, invoke \`${plugin}:setup\` first`), 'setup first, when the project has no profile');
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
  // Of an outside model, it passes the profile and nothing about a key.
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
  // An outside model is run with the profile, and nothing on the line says where a key is.
  for (const given of run('describe')) assert.ok(given.includes('--profile'), given.join(' '));
  for (const text of Object.values(folderOf('design'))) assert.doesNotMatch(text, /API_KEY|--keys?\b/, 'no key, and no way to one, in a command');
});

test('loop.md: one fix round and one re-read, the identity line, and the decision as one page with one question', () => {
  const loop = flat(reference('loop.md'));
  assert.match(loop, /One fix round and one re-read/);
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
});

test('loop.md: several ledgers are laid side by side, and an audience is handed a profile\'s traits, never the profile', () => {
  const loop = flat(reference('loop.md'));
  assert.match(loop, /blind to the others' ledgers/);
  assert.match(loop, /side by side/);
  assert.match(loop, /in their own words/);
  assert.match(loop, /never average(?:s)? (?:them )?(?:or|nor) settles? a disagreement/i);
  assert.match(loop, /`So the interface must:`/);
  assert.match(loop, /beside the brief/);
  assert.match(loop, /"Do not open"/);
  assert.match(loop, /Makers and judges are handed the profile whole/);
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

test('blind.md: the map and the pick sit beside the board, and readers are handed the board folder only', () => {
  const blind = reference('blind.md');
  const text = flat(blind);
  assert.equal(`${MAP} ${PICK}`, 'MAP.sealed.json PICK.md');
  for (const path of [`04-structure/${MAP}`, `04-structure/${PICK}`, '04-structure/board/']) assert.ok(blind.includes(`\`${path}\``), path);
  assert.doesNotMatch(blind, /board\/(?:MAP|PICK)/);
  assert.match(text, /beside the board(?: folder)?, never (?:inside|in) it/);
  assert.match(text, /the board folder only, never its parent/);
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
  assert.match(readers, /handed the board folder only, never its parent/);
  assert.match(readers, /list the map, the proposals folder and the makers' files under "Do not open"/);
  // The rules of the table, as rules.
  const rules = flat(section(reference('blind.md'), 'The rules'));
  for (const rule of [/one shared kit/, /grey kit/, /the founder reads it first/, /(?:do not|never) see each other/, /continuity maker/, /by letter/, /Nothing is (?:shortlisted|detailed)/, /sealed/, /handed the board folder only, never its parent/]) assert.match(rules, rule);
});

test('fresh-pass.md: offered, what a fresh maker is and is not given, shown twice at Structure, and three outcomes only', () => {
  const fresh = reference('fresh-pass.md');
  const text = flat(fresh);
  assert.match(text, /Offered, not automatic/);
  assert.match(text, /does not run at Detail|never runs at Detail/);
  for (const given of [/the person and her moment/, /the job/, /the tasks/, /the language/, /the device/, /what the product can show and do/]) assert.match(text, given);
  for (const held of [/the design system/, /the shared kit/, /today's screens and navigation/, /sibling surfaces/]) assert.match(text, held);
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
