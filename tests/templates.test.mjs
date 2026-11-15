import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES, validateAcceptance } from '../scripts/accept.mjs';
import { CHARACTERISTICS as PROFILE_CHARACTERISTICS, FIELDS as PROFILE_FIELDS, PERSON_KEYS, PERSON_SECTIONS, PROFILE_CLOSING, PROFILE_KEYS as PROFESSION_KEYS, traitsOf as profileTraits, validatePerson, validateProfile } from '../scripts/lib/card.mjs';
import { carryProblems } from '../scripts/lib/carry.mjs';
import { parse } from '../scripts/lib/frontmatter.mjs';
import { MAP, PICK, SealedError, mergeProposals, openMap } from '../scripts/lib/merge.mjs';
import { ARTEFACT, STAGES } from '../scripts/lib/state.mjs';
import { CONTAINERS, KEYS, ROLES, validate } from '../scripts/lib/walkthrough.mjs';
import { validateDecision } from '../scripts/page.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const kit = join(here, '..');
mkdirSync(join(here, '.tmp'), { recursive: true });
const tmp = mkdtempSync(join(here, '.tmp', 'templates-'));
after(() => rmSync(tmp, { recursive: true, force: true }));

// A file of the kit, by its path from the kit's root. One that is not written yet is said by its name.
const read = path => {
  assert.ok(existsSync(join(kit, path)), `${path} is not in the kit`);
  return readFileSync(join(kit, path), 'utf8');
};
const template = path => read(`templates/${path}`);
// Every file under a folder of the kit, by its path from that folder, sorted.
const filesUnder = (folder, inside = '') =>
  readdirSync(join(kit, folder, inside), { withFileTypes: true })
    .flatMap(entry => (entry.isDirectory() ? filesUnder(folder, `${inside}${entry.name}/`) : [`${inside}${entry.name}`]))
    .sort();

// ---- reading Markdown

// The lines of a text that are outside any code fence.
const prose = text => {
  let open = false;
  return text.split('\n').filter(line => {
    if (!/^\s*```/.test(line)) return !open;
    open = !open;
    return false;
  });
};
// The headings of one level, in order, as written after the hashes.
const headings = (text, level = 2) => {
  const mark = new RegExp(`^${'#'.repeat(level)} (.+?)\\s*$`);
  return prose(text).map(line => mark.exec(line)?.[1]).filter(Boolean);
};
// What is under one `## ` heading, to the next `## ` heading or to the end.
const section = (text, name) => {
  const lines = text.split('\n');
  const from = lines.indexOf(`## ${name}`);
  assert.notEqual(from, -1, `## ${name}`);
  const rest = lines.slice(from + 1);
  const to = rest.findIndex(line => /^## /.test(line));
  return rest.slice(0, to === -1 ? undefined : to).join('\n');
};
// A text as one line, so that a sentence is found however it is wrapped.
const flat = text => text.replace(/\s+/g, ' ');
const spans = text => [...text.matchAll(/`([^`]+)`/g)].map(([, span]) => span);
const unspan = cell => cell.replace(/^`(.*)`$/, '$1');
// A table row as its cells; a bar written \| stays in its cell.
const cells = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));
// The tables of a text: each a header row and its rows, the line of dashes left out.
const tables = text => {
  const found = [];
  let open = null;
  for (const line of [...prose(text), '']) {
    if (line.trim().startsWith('|')) {
      open ??= [];
      open.push(cells(line));
    } else if (open) {
      const [head, dashes, ...rows] = open;
      assert.ok(dashes?.every(cell => /^:?-+:?$/.test(cell)), `a line of dashes under the header row | ${head.join(' | ')} |`);
      found.push({ head, rows });
      open = null;
    }
  }
  return found;
};
// The one table of a text whose header row begins with `first`.
const tableOf = (text, first) => {
  const found = tables(text).filter(({ head }) => head[0] === first);
  assert.equal(found.length, 1, `one table headed "${first}"`);
  return found[0];
};
// One bullet of a list, whole: its first line, which begins with `start`, and the indented lines that continue it.
const bullet = (text, start) => {
  const lines = text.split('\n');
  const from = lines.findIndex(line => line.startsWith(start));
  assert.notEqual(from, -1, `a bullet that begins "${start}"`);
  const more = lines.slice(from + 1).findIndex(line => !/^ {2}\S/.test(line));
  return lines.slice(from, more === -1 ? undefined : from + 1 + more).join(' ');
};
const BRACES = /\{[^{}]*\}/g;

// ---- what the kit ships under templates/

const PACKAGE = [
  '00-frame.md', '01-context.md', '02-intent.md', '03-cast.md',
  '04-structure/BRIEF-fresh.md', '04-structure/BRIEF.md', '04-structure/CHOSEN.md',
  '05-detail/DETAIL.md', '05-detail/states.md', '05-detail/strings.json',
  '06-look/LOOK.md',
  '07-handoff/ACCEPTANCE.md', '07-handoff/COVERAGE.md', '07-handoff/DECISIONS.md', '07-handoff/HANDOFF.md', '07-handoff/PARTS.md',
  '07-handoff/SPEC.md', '07-handoff/acceptance.json',
  '08-acceptance/FIXES.md', '08-acceptance/REPORT.md',
  'DECISIONS.md',
  'build/BUILD.md', 'build/DEVIATIONS.md', 'build/STATES.md',
];
const OTHERS = [
  'briefs/audience.md', 'briefs/judge.md', 'briefs/maker.md',
  'outputs/LEDGER.md', 'outputs/PICK.md', 'outputs/TASK-READ.md', 'outputs/decision-approve.json', 'outputs/decision.json',
  'people/PERSON-CARD.md', 'people/PROFILE-CARD.md',
  'project/LESSONS.md', 'project/PROFILE.md',
];
const ALL = [...OTHERS, ...PACKAGE.map(file => `package/${file}`)].sort();
const MARKDOWN = ALL.filter(file => file.endsWith('.md'));
// The outputs a stage is stamped on. Seven end with a carry list; the handoff and the report need none.
const CARRIED = STAGES.slice(0, STAGES.indexOf('handoff'));
const stageFile = stage => `package/${ARTEFACT[stage]}`;

test('templates/ holds every file of the plan, and no other', () => {
  assert.deepEqual(filesUnder('templates'), ALL);
});

test('a package copied whole holds no pick and no author map, so a board can be merged into it', () => {
  const names = filesUnder('templates/package').map(file => file.split('/').at(-1));
  assert.ok(!names.includes(PICK), `${PICK} is written at the pick, from templates/outputs/`);
  assert.ok(!names.includes(MAP));
  assert.ok(ALL.includes(`outputs/${PICK}`));
});

test('every Markdown template says how it is read, and every template is plain text with LF endings', () => {
  for (const file of ALL) {
    const text = template(file);
    assert.ok(!text.includes('\r'), `${file} has LF line endings`);
    assert.ok(!text.includes('\t'), `${file} has no tab`);
    assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'), `${file} ends with one line break`);
    if (file.endsWith('.json')) assert.doesNotThrow(() => JSON.parse(text), `${file} is JSON`);
  }
  // What is structure, what is an instruction and what is an example: said once, in each file.
  for (const file of MARKDOWN) {
    const said = flat(template(file).match(/<!-- Template\.[\s\S]*?-->/)?.[0] ?? '');
    assert.match(said, /[Kk]eep the headings/, `${file}: what is kept`);
    assert.match(said, /\{instruction in braces\}/, `${file}: what is replaced`);
  }
});

test('an instruction in braces is at most two lines: what the filler must put there, and no lesson', () => {
  let read = 0;
  for (const file of MARKDOWN) {
    const text = template(file);
    for (const { 0: instruction, index } of text.matchAll(BRACES)) {
      read += 1;
      const at = `${file}:${text.slice(0, index).split('\n').length}`;
      assert.ok(instruction.split('\n').length <= 2, `${at} runs over ${instruction.split('\n').length} lines`);
      assert.ok(instruction.length <= 210, `${at} is ${instruction.length} characters, more than two lines hold`);
    }
  }
  assert.ok(read > 400, 'the instructions are read');
});

test('no template leaves a placeholder that is not an instruction, or anything that looks like a secret', () => {
  for (const file of ALL) {
    const text = template(file);
    assert.doesNotMatch(text, /\b(?:TODO|TBD|FIXME|Lorem ipsum)\b/, file);
    assert.doesNotMatch(text, /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{8,}|AIza[0-9A-Za-z_-]{10,}|(?:api[_-]?key|password|secret|token)\s*[:=]\s*["']?[A-Za-z0-9+/_-]{12,}/i, file);
  }
});

// ---- the stage outputs (design § 4, § 6)

test('each stage has its output where the state script looks for it, with the header a stamp needs', () => {
  for (const stage of STAGES) {
    const { data } = parse(template(stageFile(stage)));
    assert.deepEqual(data, { stage, version: 1, status: 'draft', 'built-from': [] }, stageFile(stage));
  }
});

test('the seven outputs from frame to look end with "## Carry", after "## Reviewed by the founder"', () => {
  assert.deepEqual(CARRIED, ['frame', 'context', 'intent', 'cast', 'structure', 'detail', 'look']);
  for (const stage of CARRIED) {
    const text = template(stageFile(stage));
    assert.deepEqual(headings(text).slice(-2), ['Reviewed by the founder', 'Carry'], stageFile(stage));
    assert.equal(section(text, 'Carry').trim(), '', `${stageFile(stage)}: nothing under "## Carry" until the stage fills it`);
    assert.equal(headings(text, 1).length, 1, `${stageFile(stage)} has one title`);
  }
  // The handoff folder points at nothing outside itself, and nothing follows the report.
  for (const stage of ['handoff', 'acceptance']) {
    const names = headings(template(stageFile(stage)));
    assert.ok(names.includes('Reviewed by the founder'), stageFile(stage));
    assert.ok(!names.includes('Carry'), `${stageFile(stage)} has no carry list`);
  }
});

// What the carry reader of the state script is given for a stage whose inputs do not matter here.
const carryContext = stage => ({
  stage,
  file: ARTEFACT[stage],
  required: true,
  earlier: () => true,
  inputs: [],
  earlierBody: () => ({ code: 'carry-unresolved', message: 'not read in this test' }),
});

test('a template\'s carry list is accepted as it is and with a real entry, and its instruction is never read as one', () => {
  const entry = /^- (?:[a-z]+@\d+#\S+|source:\s*\S.*)$/;
  for (const stage of CARRIED) {
    const file = stageFile(stage);
    const { body } = parse(template(file));
    const problems = text => carryProblems(text, carryContext(stage)).map(p => p.message);
    assert.deepEqual(problems(body), [], `${file}, as it is`);
    assert.deepEqual(problems(`${body}\n- source:README.md\n`), [], `${file}, with one entry`);
    // The reader passes over nothing below the heading: a line that is not an entry is refused there.
    assert.equal(problems(`${body}\nThe tokens file.\n`).length, 1, `${file}: a note under the heading is refused`);
    // So the instruction sits above the heading, in a comment, and gives both forms an entry takes.
    const above = body.slice(0, body.lastIndexOf('\n## Carry\n'));
    const comment = above.slice(above.lastIndexOf('<!--'));
    assert.ok(comment.trimEnd().endsWith('-->'), `${file}: the comment before "## Carry" is the last thing above it`);
    assert.ok(comment.includes('`- source:<path>`'), `${file}: how a project source is carried`);
    assert.ok(comment.includes('`- <stage>@<version>#<heading-slug>`'), `${file}: how a section is carried`);
    assert.equal(problems(`${body}\n${comment}\n`).length > 0, true, `${file}: the comment itself, under the heading, is refused`);
    // No line of the template could be taken for an entry, wherever it is moved.
    assert.deepEqual(body.split('\n').map(line => line.trim()).filter(line => entry.test(line)), [], file);
  }
});

test('01-context.md has one heading for each thing the context writes, and the project sources', () => {
  const names = headings(template('package/01-context.md'));
  assert.deepEqual(names, [
    'The problem, and why now', 'The people', 'What exists today', 'What the product can show and do', 'Constraints', 'Tried and rejected',
    'The angles considered', 'What it must not become', 'The founder\'s own words', 'Questions for the founder', 'Project sources',
    'Reviewed by the founder', 'Carry',
  ]);
  const text = template('package/01-context.md');
  // The inventory is a table whose rows a data map can name, each with its source.
  const inventory = tableOf(section(text, 'What the product can show and do'), 'Row');
  assert.deepEqual(inventory.head.at(-1), 'Source');
  assert.match(flat(section(text, 'The angles considered')), /At least three/);
  assert.match(flat(section(text, 'The founder\'s own words')), /verbatim/);
  assert.match(flat(section(text, 'Questions for the founder')), /recommendation/);
});

// The ten states of design § 4.2, in its order.
const STATES = [
  'Empty — first ever', 'Empty — filtered to nothing', 'Loading — first paint', 'Loading — refresh', 'Partial', 'Error — recoverable',
  'Error — terminal', 'No permission', 'Success', 'Overflow',
];

test('02-intent.md has the person, the job, the criteria, the tasks, the ten states and the measure', () => {
  const text = template('package/02-intent.md');
  const names = headings(text);
  for (const name of ['The person in the moment', 'The one job', 'Success criteria', 'Tasks for the audience', 'States', 'The measure']) {
    assert.ok(names.includes(name), `## ${name}`);
  }
  const states = tableOf(section(text, 'States'), 'State');
  assert.deepEqual(states.rows.map(([name]) => name), STATES);
  for (const [name, shows] of states.rows) assert.match(shows, /^\{.+\}$/, `${name}: what it shows is an instruction to replace`);
  assert.match(flat(section(text, 'States')), /cannot occur because/);
  // The test of a criterion, ported from version 1.
  assert.match(flat(section(text, 'Success criteria')), /could two people disagree about whether it was met\? Then sharpen it/i);
  assert.match(flat(section(text, 'Tasks for the audience')), /[Nn]ever the path/);
  // The optional read of the intent by the profile judge has its place, before the gate.
  assert.deepEqual(names.slice(-3), ['What the readers found', 'Reviewed by the founder', 'Carry']);
  assert.match(flat(section(text, 'What the readers found')), /[Oo]nly when[^.]*profile judge[^.]*cast/);
});

test('03-cast.md has a table for each stage from structure to acceptance, with model and effort as suggestions until he changes one', () => {
  const text = template('package/03-cast.md');
  const names = headings(text);
  const stages = STAGES.slice(STAGES.indexOf('structure'));
  assert.deepEqual(stages, ['structure', 'detail', 'look', 'handoff', 'acceptance']);
  for (const stage of stages) {
    const name = stage[0].toUpperCase() + stage.slice(1);
    const { head, rows } = tableOf(section(text, name), 'Seat');
    assert.deepEqual(head, ['Seat', 'Loaded with', 'Checks on · off', 'Engine', 'Model', 'Effort', 'Why it is here'], name);
    assert.ok(rows.length >= 1, `${name}: a row to fill`);
  }
  for (const name of ['Left out', 'Blind rules', 'Fresh pass', 'Cost']) assert.ok(names.includes(name), `## ${name}`);
  // Suggestions the founder may change, and a dash where a card suggests nothing.
  assert.match(flat(text), /suggestions[^.]*he may change/i);
  assert.match(flat(text), /Model and effort are the cards' suggestions until he changes one/);
  assert.match(flat(text), /\{One sentence: what you propose about the models, as suggestions he may change\.\}/);
  assert.match(tableOf(section(text, 'Structure'), 'Seat').rows[0][1], /^\{a lens · `profile\.<name>` · `person\.<name>` · —\}$/);
  assert.match(flat(text), /`none`[^.]*—/);
  const fresh = section(text, 'Fresh pass').split('\n');
  for (const stage of ['Structure', 'Look']) assert.equal(fresh.filter(line => line.startsWith(`- **${stage}:**`)).length, 1, `a line for ${stage}`);
  assert.match(flat(section(text, 'Cost')), /agents/);
});

// ---- the Structure briefs (design § 12)

const BRIEFS = ['package/04-structure/BRIEF.md', 'package/04-structure/BRIEF-fresh.md'];
// What a fresh maker is not given, each as a line would name it.
const WITHHELD = [/design system/i, /\bkit\b/i, /sibling/i, /today[’']s (?:screens?|navigation|interface)|current screens?/i];
const FRESH = BRIEFS[1];
// The fresh brief holds two forms, each opened by a comment of one line. At Structure the filler deletes
// the Look form, at Look the Structure form, and the comment of the one it keeps.
const FORM = { structure: /^<!-- Structure form[^\n]*-->\n/m, look: /^<!-- Look form[^\n]*-->\n/m };
const freshForms = () => {
  const text = template(FRESH);
  const from = text.search(FORM.structure);
  const to = text.search(FORM.look);
  assert.ok(from !== -1 && to > from, 'the Structure form is marked, then the Look form, which runs to the end');
  const kept = (block, mark) => block.replace(mark, '').replace(/^\n/, '');
  return {
    shared: text.slice(0, from),
    structure: text.slice(0, from) + kept(text.slice(from, to), FORM.structure).trimEnd() + '\n',
    look: text.slice(0, from) + kept(text.slice(to), FORM.look),
  };
};
// A brief as a describer is sent it: the fresh one in its Structure form.
const brief = file => (file === FRESH ? freshForms().structure : template(file));

test('both Structure briefs give the person, the job, the tasks and what the product can show and do, never the design', () => {
  for (const file of BRIEFS) {
    const text = brief(file);
    const names = headings(text);
    for (const name of ['The person', 'The job', 'The tasks', 'The hardest state', 'What the product can show and do', 'What to return']) {
      assert.ok(names.includes(name), `${file}: ## ${name}`);
    }
    assert.deepEqual(names.slice(-2), ['How to work', 'What to return'], `${file}: the method, then the format, last`);
    // The method an outside model gets from nowhere else. No lens: a seat's own brief gives that.
    const how = flat(section(text, 'How to work'));
    for (const step of [/no interface at all/i, /first idea[^.]*set it aside/i, /habit of the category/, /one way, whole/i, /real words she would read/, /worst rows/, /hardest state/]) {
      assert.match(how, step, `${file}: how to work`);
    }
    assert.doesNotMatch(section(text, 'How to work'), /\blens\b/i, `${file}: no lens in the brief`);
    assert.doesNotMatch(section(text, 'How to work'), BRACES, `${file}: the method is the brief's own, not an instruction to fill`);
    // True of both readers: an outside model has this page alone, a seat also has its card.
    const opening = flat(text.slice(0, text.indexOf('\n## ')));
    assert.match(opening, /This page is the whole brief/, file);
    assert.doesNotMatch(opening, /Everything you are given/, file);
  }
  assert.match(flat(template(BRIEFS[0])), /A describer started from a card is also given its card and a lens/);
  assert.ok(!headings(template(BRIEFS[0])).includes('What you are not given'));
});

// Every line of a text outside its "## What you are not given" section names nothing a fresh maker is not given.
const withholdsOnlyThere = (text, what) => {
  const withheld = section(text, 'What you are not given');
  for (const thing of WITHHELD) assert.match(withheld, thing, what);
  assert.match(flat(withheld), /what the product (?:does|can show and do)/, `${what}: no knowledge of form, not of what the product does`);
  const lines = text.split('\n');
  const from = lines.indexOf('## What you are not given');
  const length = withheld.split('\n').length + 1;
  const others = [...lines.slice(0, from), ...lines.slice(from + length)];
  assert.equal(others.length + length, lines.length);
  for (const line of others) for (const thing of WITHHELD) assert.doesNotMatch(line, thing, `${what}, outside the section: ${line}`);
};

test('BRIEF-fresh.md names what it withholds only under "## What you are not given", in the template and in each form', () => {
  // The template whole, its own instructions and both forms included; then each form as it is sent.
  withholdsOnlyThere(template(FRESH), 'the template');
  const { structure, look } = freshForms();
  withholdsOnlyThere(structure, 'the Structure form');
  withholdsOnlyThere(look, 'the Look form');
});

test('BRIEF-fresh.md holds a Structure form and a Look form, and says which sections are whose', () => {
  const text = template(FRESH);
  const { shared, structure, look } = freshForms();
  // Each form is opened by one comment, and the opening comment says what to keep at each stage.
  for (const mark of Object.values(FORM)) assert.equal(text.split('\n').filter(line => mark.test(`${line}\n`)).length, 1);
  const said = flat(text.match(/<!-- Template\.[\s\S]*?-->/)[0]);
  assert.match(said, /two forms/);
  assert.match(said, /At Structure, keep "The hardest state", "How to work" and "What to return"[^.]*delete "The one screen"/);
  assert.match(said, /At Look, keep "The one screen"[^.]*delete "The hardest state", "How to work" and[^.]*"What to return"/);
  assert.match(flat(text.match(FORM.structure)[0]), /At Look, delete all of it/);
  assert.match(flat(text.match(FORM.look)[0]), /At Structure, delete all of it/);
  // What both forms share says nothing of what is asked: the ask is the form's.
  assert.deepEqual(headings(shared), ['The person', 'The job', 'The tasks', 'What the product can show and do', 'Language and device', 'What you are not given']);
  assert.doesNotMatch(flat(shared.replace(/<!--[\s\S]*?-->/g, '')), /concept|propose|draw|screens that carry/i);
  // The Structure form: the hardest state, the method, the format.
  assert.deepEqual(headings(structure).slice(6), ['The hardest state', 'How to work', 'What to return']);
  assert.match(flat(section(structure, 'How to work')), /a concept of your own: the one or two screens that carry the idea, never the whole flow/);
  // The Look form: one approved screen, drawn as it is written, and only how it looks is chosen.
  assert.deepEqual(headings(look).slice(6), ['The one screen', 'What to return']);
  const screen = flat(section(look, 'The one screen'));
  for (const said of [/its structure and its words are decided/i, /these words exactly as written/, /add no element, drop none, rewrite no string/, /no other screen/, /choose only how it looks/i]) {
    assert.match(screen, said);
  }
  for (const given of [/\*\*The screen:\*\*/, /\*\*Its state:\*\*/, /\*\*Its items, in order, with their words:\*\*/]) assert.match(screen, given);
  const returned = flat(section(look, 'What to return'));
  assert.match(returned, /one self-contained page, and nothing else/);
  // Nothing in it invites a redesign, and it carries nothing of the walkthrough format.
  const sent = look.replace(/<!--[\s\S]*?-->/g, '');
  for (const invitation of [/no interface/i, /another kind/i, /propose one way/i, /first idea/i, /set it aside/i, /concept of your own/i, /hardest state/i]) {
    assert.doesNotMatch(sent, invitation, 'the Look form');
  }
  assert.ok(!look.includes(FORMAT) && !look.includes('```'), 'no format and no specimen at Look');
  for (const word of ['firstIdea', 'absent', 'expansion', 'JSON']) assert.ok(!sent.includes(word), `the Look form holds "${word}"`);
  // Either form, once its comment is gone, is one brief: no form mark left, and one thing to return.
  for (const form of [structure, look]) {
    assert.doesNotMatch(form, /<!-- (?:Structure|Look) form/);
    assert.equal(headings(form).filter(name => name === 'What to return').length, 1);
    assert.equal(headings(form).at(-1), 'What to return');
  }
});

// The format as a brief gives it: the part of "## What to return" from its own heading on.
const FORMAT = '### The walkthrough format';
const formatIn = file => {
  const returned = section(brief(file), 'What to return');
  const from = returned.indexOf(`${FORMAT}\n`);
  assert.notEqual(from, -1, `${file}: ${FORMAT}`);
  return returned.slice(from);
};
const exampleIn = format => {
  const fences = [...format.matchAll(/```json\n([\s\S]*?)\n```/g)];
  assert.equal(fences.length, 1, 'one example, in a json fence');
  return { words: format.slice(0, fences[0].index), example: JSON.parse(fences[0][1]) };
};

test('each Structure brief carries the walkthrough format whole: every key, role and container, and no other', () => {
  const format = new Set([...KEYS.proposal, ...KEYS.screen, ...KEYS.role, ...KEYS.container, ...ROLES, ...CONTAINERS, 'screen', 'dialog']);
  for (const file of BRIEFS) {
    const { words } = exampleIn(formatIn(file));
    const named = new Set(spans(words));
    assert.deepEqual([...format].filter(word => !named.has(word)), [], `${file} leaves out a word of the format`);
    assert.deepEqual([...named].filter(word => !format.has(word)), [], `${file} names a word the format lacks`);
    // The three lists, each whole and in the format's order.
    assert.deepEqual([...spans(bullet(words, '- **The proposal**')), ...spans(bullet(words, '- **Who made it**'))], KEYS.proposal, `${file}: the proposal's keys`);
    assert.deepEqual(spans(bullet(words, '- **A screen**')).filter(word => KEYS.screen.includes(word)), KEYS.screen, `${file}: a screen's keys`);
    assert.deepEqual(tableOf(words, '`role`').rows.map(([role]) => unspan(role)), ROLES, `${file}: the roles`);
    assert.deepEqual(tableOf(words, '`container`').rows.map(([container]) => unspan(container)), CONTAINERS, `${file}: the containers`);
    for (const { rows } of [tableOf(words, '`role`'), tableOf(words, '`container`')]) {
      for (const row of rows) assert.ok(row.length === 3 && row.every(cell => cell !== ''), `${file}: ${row[0]} says what it is and what it needs`);
    }
  }
  assert.equal(formatIn(BRIEFS[0]), formatIn(BRIEFS[1]), 'the two briefs give the format in the same words');
});

// Every string a proposal holds, wherever it is: its own texts, and those of its screens and items.
const stringsOf = value => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringsOf);
  return value !== null && typeof value === 'object' ? Object.values(value).flatMap(stringsOf) : [];
};
// The items of a proposal in reading order, a container before what it holds.
const itemsOf = holder => holder.items.flatMap(item => (item.items ? [item, ...itemsOf(item)] : [item]));
const keysOf = objects => [...new Set(objects.flatMap(Object.keys))];
const inOrderOf = (found, order) => order.filter(key => found.includes(key));

test('each Structure brief gives the rules a writer can break, and asks for one JSON object and nothing else', () => {
  for (const file of BRIEFS) {
    const returned = flat(section(brief(file), 'What to return'));
    assert.match(returned, /one JSON object[^.]*nothing else/i, file);
    const rules = flat(exampleIn(formatIn(file)).words);
    assert.match(rules, /one primary action/i, file);
    assert.match(rules, /expansion`? always has a `label`/, file);
    assert.match(rules, /`choice`[^.]*two[^.]*`list`[^.]*`nav`[^.]*one/, file);
    assert.match(rules, /no two screens share a `title`/i, file);
    assert.match(rules, /`over`/, file);
    assert.match(rules, /lower-case words joined by hyphens/, file);
    assert.match(rules, /no (?:other )?key for/i, `${file}: nothing but the format's keys`);
  }
});

test('each Structure brief shows a specimen of the syntax, never a design: every part once, named and not filled', () => {
  // What a writer does not write: who made the proposal.
  const WRITTEN_LATER = ['author', 'engine', 'track', 'model', 'source'];
  // Words of the kit's own example product, and of any product: a specimen holds none.
  const PRODUCT = /\b(?:rooms?|clinic|book(?:ing|ed|s)?|patients?|walk-ins?|desk|free|busy|today|calendar)\b/i;
  for (const file of BRIEFS) {
    const format = formatIn(file);
    const { words, example: specimen } = exampleIn(format);
    // It is valid as written, and stops being so when it breaks a rule: it is read, not passed over.
    assert.deepEqual(validate(specimen), [], `${file}: the specimen`);
    const twice = structuredClone(specimen);
    twice.screens[1].title = twice.screens[0].title;
    assert.equal(validate(twice).length, 1, `${file}: two screens with one title`);
    const unlabelled = structuredClone(specimen);
    delete itemsOf(unlabelled.screens.find(screen => itemsOf(screen).some(item => item.container === 'expansion'))).find(item => item.container === 'expansion').label;
    assert.equal(validate(unlabelled).length, 1, `${file}: an expansion without its label`);
    // Every key of every level, in the format's own order; who made it is left out, as the brief asks.
    assert.deepEqual(Object.keys(specimen), KEYS.proposal.filter(key => !WRITTEN_LATER.includes(key)), `${file}: the proposal's keys`);
    const items = specimen.screens.flatMap(itemsOf);
    const roles = items.filter(item => Object.hasOwn(item, 'role'));
    const containers = items.filter(item => Object.hasOwn(item, 'container'));
    assert.deepEqual(keysOf(specimen.screens).sort(), [...KEYS.screen].sort(), `${file}: every key of a screen`);
    assert.deepEqual(keysOf(roles).sort(), [...KEYS.role].sort(), `${file}: every key of a role`);
    assert.deepEqual(keysOf(containers).sort(), [...KEYS.container].sort(), `${file}: every key of a container`);
    for (const [objects, order] of [[specimen.screens, KEYS.screen], [roles, KEYS.role], [containers, KEYS.container]]) {
      for (const object of objects) assert.deepEqual(Object.keys(object), inOrderOf(Object.keys(object), order), `${file}: keys in the format's order`);
    }
    // Every role and every container exactly once, in the format's order; a screen, and a dialog over it.
    assert.deepEqual(roles.map(item => item.role), ROLES, `${file}: each role once`);
    assert.deepEqual(containers.map(item => item.container), CONTAINERS, `${file}: each container once`);
    assert.deepEqual(specimen.screens.map(screen => screen.container), ['screen', 'dialog'], file);
    assert.equal(roles.filter(item => item.primary === true).length, 1, `${file}: one primary action`);
    // Its words name the part and fill nothing: each is a phrase in brackets, or an id that says what it is.
    const texts = stringsOf(specimen).filter(text => ![...ROLES, ...CONTAINERS, 'screen', 'dialog'].includes(text));
    const ids = [...specimen.screens, ...roles].map(object => object.id).filter(Boolean);
    assert.ok(ids.length >= 3 && ids.every(id => /^an?-(?:screen|dialog|item)$/.test(id)), `${file}: ids that name the part`);
    for (const text of texts.filter(text => !ids.includes(text))) assert.match(text, /^\((?:an?|the|some|what|your|another) [^()]+\)$/, `${file}: "${text}" names a part`);
    assert.equal(new Set(texts.filter(text => !ids.includes(text))).size, texts.filter(text => !ids.includes(text)).length, `${file}: no phrase twice`);
    // Nothing of the kit's example product, or of any product.
    const fence = format.slice(format.indexOf('```json'));
    assert.doesNotMatch(fence, PRODUCT, `${file}: the specimen holds a word of a product`);
    // One sentence above it says what it is.
    const said = flat(words.trimEnd().split('\n\n').at(-1));
    assert.match(said, /specimen/i, file);
    assert.match(said, /every part once/i, file);
    assert.match(said, /no meaningful arrangement/, file);
    assert.match(said, /a proposal that resembles it has copied it/, file);
    assert.doesNotMatch(flat(format), /not a suggestion|another product/, file);
  }
});

test('CHOSEN.md writes the pick down exactly, with what was not chosen and what the gallery marks carry to Look', () => {
  const text = template('package/04-structure/CHOSEN.md');
  const names = headings(text);
  for (const name of ['The pick', 'The structure', 'Not chosen']) assert.ok(names.includes(name), `## ${name}`);
  // His words at the pick are written once, in PICK.md: the pick points there, and the gate keeps only
  // what he asked to change.
  const pick = flat(section(text, 'The pick'));
  assert.match(pick, /What he said at the pick is in `PICK\.md`[^.]*not repeated here/, 'the pick points at PICK.md');
  assert.match(pick, /graft/);
  assert.doesNotMatch(pick.replace(/What he said at the pick[^.]*\./, ''), /\bwords\b|\bsaid\b/, 'and asks for his words nowhere else');
  const gate = flat(section(text, 'Reviewed by the founder'));
  assert.match(gate, /asked to (?:be )?changed?/);
  assert.doesNotMatch(gate, /\bwords\b|\bsaid\b/, 'the gate keeps what he asked to change, not his words again');
  assert.match(flat(text), /carried to Look/);
});

test('outputs/PICK.md is sealed as the template leaves it, and opens the author map once its line names a letter or none', () => {
  const text = template('outputs/PICK.md');
  const lines = text.split('\n').filter(line => line.startsWith('Pick:'));
  assert.equal(lines.length, 1, 'one line that begins "Pick:"');
  assert.match(lines[0], /^Pick: \{[^{}]+\}$/, 'the letter is an instruction until he picks');
  assert.match(flat(text), /words/, 'his words go under it');
  assert.match(flat(section(text, 'In his words')), /"a bit of each" is not a pick/i);
  const run = join(tmp, 'pick');
  const board = join(run, 'board');
  const { letters } = mergeProposals(join(here, 'fixtures', 'proposals'), board, { seed: 1 });
  const write = pick => writeFileSync(join(run, PICK), pick);
  write(text);
  assert.throws(() => openMap(board), SealedError, 'the template as it is names no pick');
  for (const pick of [letters[0], 'none']) {
    write(text.replace(lines[0], `Pick: ${pick}`));
    assert.deepEqual(Object.keys(openMap(board)), letters, `Pick: ${pick}`);
  }
  // A letter that is not on the board stays sealed: the line is read, not only found.
  write(text.replace(lines[0], 'Pick: Z'));
  assert.throws(() => openMap(board), SealedError);
});

// ---- Detail and Look (design § 4.5, § 4.6)

const card = path => read(`pool/${path}`);
const output = text => section(text, 'Output');
const templatesIn = text => [...text.matchAll(/(?<![\w/-])templates\/[\w./-]*\.[a-z]+\b/g)].map(([path]) => path);

test('DETAIL.md holds the rules, the data map and the dependencies, and takes what its two makers return', () => {
  const text = template('package/05-detail/DETAIL.md');
  const names = headings(text);
  const wanted = ['Rules', 'Edge cases', 'Data map', 'Dependencies'];
  assert.deepEqual(names.filter(name => wanted.includes(name)), wanted, 'in this order');
  assert.ok(names.indexOf('Dependencies') < names.indexOf('Reviewed by the founder'));
  assert.deepEqual(tableOf(section(text, 'Data map'), 'Element id').head, ['Element id', 'What it shows or offers', 'Row of the context\'s inventory']);
  // The rules come under the five headings the interaction designer's card gives them.
  const RULES = ['Validation', 'Focus order', 'Keyboard', 'What changes without her asking', 'What cannot be undone'];
  assert.deepEqual(headings(section(text, 'Rules'), 3), RULES);
  const designer = card('makers/interaction-designer.md');
  for (const name of RULES) assert.ok(designer.includes(`*${name}*`), `the interaction designer writes "${name}"`);
  // Each list a maker's card names in quotes has its heading here.
  const all = [...names, ...headings(text, 3)];
  const lists = { 'makers/interaction-designer.md': 3, 'makers/interface-writer.md': 2 };
  for (const [file, count] of Object.entries(lists)) {
    const quoted = [...flat(output(card(file))).matchAll(/"([A-Z][^"]+)"/g)].map(([, name]) => name);
    assert.equal(quoted.length, count, `${file} names ${count} lists`);
    for (const name of quoted) assert.ok(all.includes(name), `${file} returns "${name}", and DETAIL.md has no heading for it`);
  }
});

test('the instructions cut to two lines kept what a filler cannot do without', () => {
  // The edges are the interaction designer's card's, all of them: the template lists none in part.
  const edges = flat(section(template('package/05-detail/DETAIL.md'), 'Edge cases'));
  assert.match(edges, /each of the edges the interaction designer's card names/);
  assert.doesNotMatch(edges, /longest|two hundred|second press|narrowest/);
  // The blind rules name the session's own idea among what the describers do not see (design § 12).
  assert.match(flat(section(template('package/03-cast.md'), 'Blind rules')), /the describers[^.;]*each other[^.;]*the session's own idea[^.;]*today's screen/);
  // The project sources keep the design's three examples.
  const sources = flat(section(template('package/01-context.md'), 'Project sources'));
  for (const example of [/the token files/, /the component source/, /the product-facts document/]) assert.match(sources, example);
  assert.match(sources, /entry of the carry list/);
  // What links a state's name across the states table, the prototype's pages and the checks survives filling.
  const kept = flat(template('package/05-detail/states.md').replace(/<!--[\s\S]*?-->/g, '').replace(BRACES, ''));
  assert.match(kept, /A state's name here is the one its pages and its acceptance checks use\./);
});

test('states.md is the states table as the interaction designer returns it', () => {
  const { head, rows } = tableOf(template('package/05-detail/states.md'), 'Screen');
  assert.deepEqual(head, ['Screen', 'State', 'What she sees', 'What she can do', 'Where the focus is']);
  assert.ok(rows.length >= 1);
  const said = flat(output(card('makers/interaction-designer.md')));
  assert.match(said, /the states table[^;]*: screen, state, what she sees, what she can do, where the focus is/);
  assert.match(flat(template('package/05-detail/states.md')), /cannot occur/);
});

test('strings.json keeps each string in every language, with its limit, its place and its why-line', () => {
  const strings = JSON.parse(template('package/05-detail/strings.json'));
  const entries = Object.entries(strings);
  assert.ok(entries.length >= 1);
  for (const [key, entry] of entries) {
    const { max, where, note, ...languages } = entry;
    assert.ok(max === null || Number.isSafeInteger(max), `${key}: max is a number or null`);
    for (const [name, value] of Object.entries({ where, note, ...languages })) assert.ok(typeof value === 'string' && value.trim() !== '', `${key}.${name} is text`);
    assert.ok(Object.keys(languages).length >= 1, `${key}: at least one language`);
    assert.match(note, /why-line/, `${key}: the note is the why-line`);
    assert.match(note, /never blank/, key);
  }
  // DETAIL.md says what the file's fields are, since JSON cannot.
  const said = flat(section(template('package/05-detail/DETAIL.md'), 'Strings'));
  for (const field of ['max', 'where', 'note']) assert.ok(spans(said).includes(field), `DETAIL.md explains ${field}`);
  assert.match(said, /`strings\.json`/);
});

test('LOOK.md takes the measured values, the variants, the fresh pass and the named extensions', () => {
  const text = template('package/06-look/LOOK.md');
  const names = headings(text);
  for (const name of ['Mode', 'Measured values', 'Variants', 'Fresh pass', 'Named extensions']) assert.ok(names.includes(name), `## ${name}`);
  assert.deepEqual(tableOf(section(text, 'Measured values'), 'Element').head, ['Element', 'What was measured', 'Value', 'Token', 'Width', 'Theme']);
  // The three outcomes of a fresh pass, and only three.
  const fresh = flat(section(text, 'Fresh pass'));
  for (const outcome of [/nothing to borrow/i, /borrow named things/i, /wins as a whole/i]) assert.match(fresh, outcome);
});

test('the maker cards name the templates their files take the shape of', () => {
  const named = file => templatesIn(output(card(file)));
  assert.deepEqual(named('makers/interaction-designer.md').sort(), ['templates/package/05-detail/DETAIL.md', 'templates/package/05-detail/states.md']);
  assert.deepEqual(named('makers/interface-writer.md'), ['templates/package/05-detail/strings.json']);
  assert.deepEqual(named('makers/visual-designer.md'), ['templates/package/06-look/LOOK.md']);
});

// ---- the handoff folder (design § 13)

test('HANDOFF.md is the entry: the brief shape, the slices, what is fixed, and what the builder writes back', () => {
  const text = template('package/07-handoff/HANDOFF.md');
  const names = headings(text);
  const wanted = ['Context', 'Task', 'Done when', 'Verify', 'Constraints', 'Slices', 'Out of scope', 'Must not change', 'Left to the builder', 'What you write back'];
  assert.deepEqual(names.filter(name => wanted.includes(name)), wanted, 'in this order');
  const back = section(text, 'What you write back');
  for (const file of ['BUILD.md', 'STATES.md', 'DEVIATIONS.md']) assert.ok(spans(back).includes(file), `it names ${file}`);
  assert.match(back, /`\.\.\/build\/`/, 'at a path it names, beside the handoff folder');
  // Every file of the folder, the implementer's guide among them, and nothing outside it.
  const folder = spans(section(text, 'What is in this folder'));
  for (const file of ['HANDOFF.md', 'IMPLEMENTER-GUIDE.md', 'prototype/', 'SPEC.md', 'PARTS.md', 'ACCEPTANCE.md', 'acceptance.json', 'DECISIONS.md', 'COVERAGE.md']) {
    assert.ok(folder.includes(file), `the folder holds ${file}`);
  }
  assert.match(flat(section(text, 'What is in this folder')), /strings/);
  // The three rules of the implementing session.
  const rules = flat(section(text, 'Constraints'));
  for (const rule of [/keep every stable id/i, /build every state/i, /do not redesign/i]) assert.match(rules, rule);
  assert.match(flat(text), /never to paste/, 'the prototype is the picture of record, to translate');
  // A page is a screen in a state and a language, and serves every theme: as Look makes them, and as a
  // check names them, a page and a theme apart.
  const pages = /one for each screen, state and language, each serving every theme/;
  assert.match(flat(text), pages);
  assert.match(flat(template('package/06-look/LOOK.md')), pages);
  assert.doesNotMatch(flat(text), /state, language and theme/);
});

test('SPEC.md carries the data map and the dependencies forward', () => {
  const names = headings(template('package/07-handoff/SPEC.md'), 3);
  assert.deepEqual(names, ['Its job', 'Regions, in priority order', 'States', 'Rules', 'Data map', 'Dependencies']);
});

// The dry run, F94: the spec's rows are the states table's rows, copied, so a builder is given every column of them.
test('SPEC.md\'s States table holds every column of the states table, and the page that draws each state', () => {
  const states = tableOf(template('package/05-detail/states.md'), 'Screen');
  const spec = tableOf(template('package/07-handoff/SPEC.md'), 'Screen');
  assert.deepEqual(spec.head, [...states.head, 'Its page']);
  assert.ok(spec.head.includes('Where the focus is') && spec.head.includes('Screen'), 'the two columns a builder was not given');
  // One row of instructions, a cell for each column, and a row that cannot occur has no page.
  assert.equal(spec.rows.length, 1);
  assert.equal(spec.rows[0].length, spec.head.length);
  assert.match(spec.rows[0].at(-1), /`prototype\/`[^}]*"cannot occur"/);
});

// The check types as the in-page file's header gives them: a line of its opening comment for each.
const inpageTypes = () => [...read('scripts/inpage/accept-inpage.js').matchAll(/^\/\/ {3}([a-z-]+) {2,}\S/gm)].map(([, type]) => type);

test('ACCEPTANCE.md names the eight check types and their parameters as the scripts define them, and what each does not ask', () => {
  assert.deepEqual(inpageTypes(), Object.keys(TYPES), 'the in-page file and accept.mjs know the same types');
  const text = template('package/07-handoff/ACCEPTANCE.md');
  const { head, rows } = tableOf(section(text, 'The check types'), 'Type');
  assert.deepEqual(head, ['Type', 'Parameters', 'Passes when', 'Does not ask']);
  assert.deepEqual(rows.map(([type]) => unspan(type)), Object.keys(TYPES));
  assert.equal(rows.length, 8);
  for (const [type, parameters, passes, not] of rows) {
    assert.deepEqual(spans(parameters), TYPES[unspan(type)], `${type}: its parameters`);
    assert.ok(passes.length > 20 && not.length > 20, `${type}: what it passes on, and what it does not ask`);
  }
  // The keys every check takes, and the ones that may be left out.
  const check = spans(section(text, 'A check'));
  for (const key of ['id', 'criterion', 'state', 'page', 'width', 'type', 'theme', 'language', 'screen', 'data-ux', 'data-screen']) assert.ok(check.includes(key), `a check's ${key}`);
  // And the two keys of the file itself.
  for (const key of ['design', 'checks']) assert.ok(check.includes(key), `the file's ${key}`);
  for (const name of ['Success criteria, as checks', 'States to drive', 'Measured values', 'Accessibility checks']) assert.ok(headings(text).includes(name), `## ${name}`);
  assert.match(flat(text), /against the prototype first/);
  assert.match(flat(text), /`acceptance\.json`[^.]*example[^.]*replace/i, 'the sample check is said to be one');
});

test('acceptance.json is a checks file accept.mjs takes, with one sample check of type visible', () => {
  const data = JSON.parse(template('package/07-handoff/acceptance.json'));
  assert.deepEqual(validateAcceptance(data), []);
  assert.equal(data.checks.length, 1);
  const [check] = data.checks;
  assert.deepEqual(Object.keys(check), ['id', 'criterion', 'state', 'page', 'width', 'language', 'screen', 'type', 'target']);
  assert.equal(check.type, 'visible');
  // Its state is named as the states table shows a name, for a row of the intent's table, and its page
  // as the prototype names one: the screen, the state, the language.
  const shown = spans(tableOf(template('package/05-detail/states.md'), 'Screen').rows[0][1]);
  assert.deepEqual(shown, [check.state], 'the name states.md gives as its example');
  const rows = tableOf(section(template('package/02-intent.md'), 'States'), 'State').rows.map(([name]) => name.toLowerCase());
  assert.equal(rows.filter(name => check.state.split('-').every(word => name.split(/[^a-z]+/).includes(word))).length, 1, 'one row of the intent\'s states');
  assert.equal(check.page, `${check.screen}-${check.state}-${check.language}.html`);
  assert.notEqual(data.design, check.screen, 'a design is not its screen: the sample tells the two apart');
  assert.ok(!check.page.includes(data.design));
  // The checker reads it: without its criterion the sample is refused.
  delete check.criterion;
  assert.equal(validateAcceptance(data).length, 1);
});

test('the handoff\'s decisions, parts and coverage hold what the builder needs and nothing that points back', () => {
  const decisions = template('package/07-handoff/DECISIONS.md');
  for (const label of ['**Decision.**', '**Why.**', '**Rejected.**', '**Forces on the build.**']) assert.ok(decisions.includes(label), label);
  const parts = template('package/07-handoff/PARTS.md');
  assert.match(flat(parts), /read from the installed source, never from memory/);
  assert.ok(headings(parts).includes('Changes to the system'));
  const coverage = template('package/07-handoff/COVERAGE.md');
  for (const name of ['Seats', 'Checks not run', 'Findings']) assert.ok(headings(coverage).includes(name), `## ${name}`);
  // Which checks ran, seat by seat: a builder cannot open the cast to find out.
  assert.deepEqual(tableOf(section(coverage, 'Seats'), 'Stage').head, ['Stage', 'Seat', 'Loaded with', 'What it read', 'Checks run', 'Ran on', 'Verdict']);
  assert.deepEqual(tableOf(section(coverage, 'Checks not run'), 'Seat').head, ['Seat', 'Check', 'Why it did not run']);
  assert.match(flat(coverage), /what became of it/i);
  // The folder stands alone: none of its files names a stage's file or folder of the package.
  for (const file of PACKAGE.filter(name => name.startsWith('07-handoff/') && name.endsWith('.md'))) {
    assert.doesNotMatch(template(`package/${file}`), /\b0[0-6]-[a-z]+|08-acceptance/, `${file} points into the package`);
  }
});

test('the package\'s decision log keeps version 1\'s entry: decision, why, rejected, cost and consequence', () => {
  const text = template('package/DECISIONS.md');
  for (const label of ['**Decision.**', '**Why.**', '**Rejected.**', '**Cost, accepted.**', '**Consequence.**']) assert.ok(text.includes(label), label);
  assert.match(flat(text), /[Aa]ppended, never edited/);
  assert.match(text, /^## D-\d+ · \{/m);
});

// ---- what the builder writes back, and Acceptance (design § 13, § 4.8)

test('build/ holds the three files the builder writes back, and the state map names an account by its role only', () => {
  assert.deepEqual(headings(template('package/build/BUILD.md')), ['What was built', 'Where it lives', 'How to run it']);
  const states = template('package/build/STATES.md');
  assert.deepEqual(tableOf(states, 'Screen').head, ['Screen', 'State', 'How to reach it']);
  const said = flat(states);
  assert.match(said, /an address, a seed step, a network condition/);
  assert.match(said, /an account by its role[^.]*where its (?:sign-in|credentials)/);
  assert.match(said, /No password, token or key is ever written/);
  const deviations = tableOf(template('package/build/DEVIATIONS.md'), '#');
  assert.deepEqual(deviations.head, ['#', 'Where', 'As drawn', 'As built', 'Why']);
  assert.match(flat(template('package/build/DEVIATIONS.md')), /founder decides each/);
});

test('the acceptance report says of each item that it matches or deviates, and a fix goes out as a slice', () => {
  const report = template('package/08-acceptance/REPORT.md');
  assert.match(flat(report), /matches · deviates/);
  for (const name of ['Item by item', 'Deviations accepted', 'Fixes sent out', 'Lessons']) assert.ok(headings(report).includes(name), `## ${name}`);
  const fixes = template('package/08-acceptance/FIXES.md');
  for (const label of ['**Context.**', '**Task.**', '**Done when.**', '**Verify.**']) assert.ok(fixes.includes(label), label);
});

// ---- the project's own files (design § 14, § 15)

const PROFILE_KEYS = [
  'product', 'packages', 'kit', 'tokens', 'components', 'facts', 'languages', 'strings-format', 'browser-check', 'decisions-log', 'pinned', 'banned',
  'engines-on', 'openai-model', 'gemini-model', 'keys-file',
];

test('project/PROFILE.md parses, has every header key, and turns nothing on', () => {
  const { data, body } = parse(template('project/PROFILE.md'));
  assert.deepEqual(Object.keys(data), PROFILE_KEYS);
  // The defaults: where packages and the project kit live, no engine on, and no keys file.
  const lists = ['languages', 'pinned', 'banned', 'engines-on'];
  for (const key of PROFILE_KEYS) {
    const wanted = lists.includes(key) ? [] : { packages: 'design', kit: 'design/kit' }[key] ?? '';
    assert.deepEqual(data[key], wanted, key);
  }
  assert.deepEqual(headings(body), [
    'How to fill the header', 'Kinds this project adds', 'Standing rules', 'How a browser check is run here', 'Design system', 'Engine check', 'Reviewed by the founder',
  ]);
  // What setup's check found: the day, his answers on the outside engines, then a row for each seat. And last, the founder's review, which is
  // empty until the gate: an empty one says the project is not set up yet.
  const check = flat(section(body, 'Engine check')).trim();
  assert.match(check, /^\{The day of the check\. His answers on the outside engines, in his words\. Then a table, Seat · Engine · What the check found, with one row for each seat[^{}]*\}$/);
  assert.match(check, /one line for the browser/);
  const reviewed = flat(section(body, 'Reviewed by the founder')).trim();
  assert.match(reviewed, /^\{What he corrected at the gate[^{}]*in his words[^{}]*\}$/);
  assert.match(reviewed, /Empty until the gate: until then, delete this instruction and write nothing in its place/);
  // No instruction sits in the header: each key is explained in the body.
  const how = section(body, 'How to fill the header');
  assert.deepEqual(tableOf(how, 'Key').rows.map(([key]) => unspan(key)), PROFILE_KEYS);
  const says = Object.fromEntries(tableOf(how, 'Key').rows.map(([key, what]) => [unspan(key), what]));
  for (const spelling of ['model:openai', 'model:gemini', 'tool:stitch']) assert.ok(spans(says['engines-on']).includes(spelling), spelling);
  assert.match(says['engines-on'], /receives the brief/);
  assert.match(says['engines-on'], /off until the founder turns it on/);
  assert.match(says['keys-file'], /dotenv file \*\*outside the repository\*\*/);
  assert.match(says['keys-file'], /[Nn]o key is ever written in (?:the|this) profile/);
  assert.match(flat(body), /outrank the kit/);
});

test('project/LESSONS.md is appended to after every design, with what § 14 asks of an entry', () => {
  const text = template('project/LESSONS.md');
  assert.match(flat(text), /[Aa]ppended[^.]*never rewritten/);
  for (const label of ['**What was tried.**', '**What happened.**', '**What the next design does differently.**', '**The founder\'s words.**', '**Cost.**']) {
    assert.ok(text.includes(label), label);
  }
  assert.deepEqual(tableOf(text, 'Seat').head, ['Seat', 'Model it ran on', 'The finding', 'The decision it changed']);
});

// ---- people (design § 8)

// A person card with each instruction in braces replaced: the header's by a value, the body's by a sentence.
const filledPerson = values => {
  const [, header, body] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(template('people/PERSON-CARD.md'));
  const lines = header.split('\n').map(line => {
    const key = line.slice(0, line.indexOf(':'));
    assert.equal(line.match(BRACES)?.length, 1, `the header's ${key} holds one instruction`);
    return line.replace(BRACES, values[key]);
  });
  return `---\n${lines.join('\n')}\n---\n${body.replace(BRACES, 'She has the phone at her ear and a man waiting at the desk.')}`;
};

test('people/PERSON-CARD.md, filled, is a person card the checker takes', () => {
  const { data, body } = parse(template('people/PERSON-CARD.md'));
  assert.deepEqual(Object.keys(data), PERSON_KEYS);
  assert.deepEqual(headings(body), PERSON_SECTIONS);
  const file = 'persons/front-desk-newcomer.md';
  const of = { id: 'front-desk-newcomer', profile: 'profile.front-desk-coordinator', specialty: 'physiotherapy', evidence: 'mixed' };
  const none = { ...of, profile: 'none', specialty: 'none', evidence: 'guess' };
  for (const values of [of, none]) {
    const text = filledPerson(values);
    assert.doesNotMatch(text, BRACES, 'every instruction is replaced');
    assert.deepEqual(validatePerson(text, { file }), []);
    assert.equal(parse(text).data.id, 'person.front-desk-newcomer');
  }
  // The checker is asked, not passed by: as the template stands, and with a profile's id misspelt.
  assert.notDeepEqual(validatePerson(template('people/PERSON-CARD.md'), { file }), []);
  assert.equal(validatePerson(filledPerson({ ...of, profile: 'front-desk-coordinator' }), { file }).length, 1);
  assert.match(flat(body), /does not force a design decision you would not have made anyway, it is not finished/);
});

// The seven characteristics every profile defines, and the four fields of each, by their fixed labels.
const CHARACTERISTICS = ['Scope', 'The work', 'Technological familiarity', 'Usage context', 'Time and attention', 'Error tolerance and stakes', 'Domain vocabulary'];
const FIELDS = ['What is true:', 'Who it does not hold for:', 'Evidence:', 'So the interface must:'];
const CRITERION = FIELDS.at(-1);
// A text as its blocks: what stands between blank lines.
const blocks = text => text.split(/\n{2,}/);
// The rule an audience's brief is built by: every block that begins with the fourth label is taken out.
const traitsOf = text => blocks(text).filter(block => !block.startsWith(CRITERION)).join('\n\n');
const count = (text, part) => text.split(part).length - 1;

test('people/PROFILE-CARD.md has the seven characteristics, each with its four fields, the specialties and the optional ones', () => {
  const { data, body } = parse(template('people/PROFILE-CARD.md'));
  assert.deepEqual(Object.keys(data), ['id']);
  assert.match(data.id, /^profile\.\{[^{}]+\}$/, 'its id is profile.<name>');
  assert.deepEqual(headings(body), [...CHARACTERISTICS, 'Specialties', 'Optional characteristics']);
  for (const name of CHARACTERISTICS) {
    const fields = blocks(section(body, name).trim());
    assert.deepEqual(fields.map(block => FIELDS.find(label => block.startsWith(label))), FIELDS, `${name}: the four fields, each a block that begins with its label`);
  }
  for (const evidence of ['fact', 'guess', 'unknown']) assert.match(body, new RegExp(`\\b${evidence}\\b`));
  // One example specialty, of the kit's own product, said to be an example.
  const specialties = section(body, 'Specialties');
  const [example, ...more] = headings(specialties, 3);
  assert.deepEqual(more, []);
  assert.match(example, /example/i);
  assert.match(specialties, /front[- ]desk/);
  assert.match(flat(specialties), /inherited/);
  assert.ok(FIELDS.every(label => specialties.includes(`\n${label}`)), 'the example fills the four fields');
  // The optional characteristics are the ones the profile judge has a check for, by the same names.
  const judge = card('judges/profile.md');
  const triggers = [...judge.matchAll(/The profile has the characteristic "([^"]+)"/g)].map(([, name]) => name);
  assert.equal(triggers.length, 8);
  const optional = section(body, 'Optional characteristics').split('\n').filter(line => line.startsWith('- ')).map(line => /^- \*\*(.+?)\*\*/.exec(line)?.[1].toLowerCase());
  assert.deepEqual(optional, triggers.map(name => name.toLowerCase()));
});

// R162: the checker and the copy of scripts/lib/card.mjs are held to the template, as the person's are.
test('people/PROFILE-CARD.md, with its id filled, is a profile the checker takes, and its copy for an audience holds no criterion', () => {
  const { data, body } = parse(template('people/PROFILE-CARD.md'));
  assert.deepEqual(Object.keys(data), PROFESSION_KEYS);
  assert.deepEqual(headings(body), [...PROFILE_CHARACTERISTICS, ...PROFILE_CLOSING]);
  assert.deepEqual(PROFILE_CHARACTERISTICS, CHARACTERISTICS);
  assert.deepEqual(PROFILE_FIELDS.map(field => `${field}:`), FIELDS);
  const file = 'profiles/front-desk-coordinator.md';
  const filled = template('people/PROFILE-CARD.md').replace(/^id: profile\.\{[^{}]+\}$/m, 'id: profile.front-desk-coordinator');
  assert.deepEqual(validateProfile(filled, { file }), []);
  // The checker is asked, not passed by: as the template stands its id is no id, and without a label a characteristic is faulty.
  assert.equal(validateProfile(template('people/PROFILE-CARD.md'), { file }).length, 1);
  assert.equal(validateProfile(filled.replace('\nSo the interface must: {', '\nSo it must: {'), { file }).length, 1);
  // The copy: the seven fields and the example's gone, with the two paragraphs of the opening that explain the fields.
  const made = profileTraits(filled, { file });
  assert.deepEqual([made.faults, made.fields, made.paragraphs], [[], CHARACTERISTICS.length + 1, 2]);
  assert.equal(count(made.copy.toLowerCase(), 'the interface must'), 0);
  const opening = made.copy.slice(0, made.copy.indexOf('\n## '));
  assert.doesNotMatch(opening, /fourth field|four fields|profile judge|An audience/);
  assert.match(flat(opening).trim(), /\{A line or two: the profession this card speaks for, and how much of it is known and how much guessed\.\}$/);
  assert.deepEqual(headings(made.copy), headings(filled), 'every heading stays');
  for (const label of FIELDS.slice(0, -1)) assert.equal(count(made.copy, `\n${label}`), count(filled, `\n${label}`), `${label} stays`);
  // Past the opening, it is what the rule of the audience's brief gives: every block that begins with the fourth label, and no other.
  const past = text => text.slice(text.indexOf('\n## '));
  assert.equal(past(made.copy), past(traitsOf(filled)));
});

test('a profile\'s "So the interface must" fields can be taken out by rule, leaving the traits and nothing of the criteria', () => {
  const text = template('people/PROFILE-CARD.md');
  const criteria = blocks(text).filter(block => block.startsWith(CRITERION));
  // Each of the seven and the example has one, and the label is written nowhere but at the start of its block.
  assert.equal(criteria.length, CHARACTERISTICS.length + 1);
  assert.equal(count(text, 'So the interface must'), criteria.length, 'the label opens a block wherever it is written');
  for (const block of criteria) assert.ok(!block.includes('\n#'), 'a field ends before the next heading');
  const traits = traitsOf(text);
  assert.equal(count(traits, 'So the interface must'), 0, 'none is left');
  assert.equal(count(traits.toLowerCase(), 'the interface must'), 0);
  for (const label of FIELDS.slice(0, -1)) assert.equal(count(traits, `\n${label}`), count(text, `\n${label}`), `${label} stays`);
  assert.deepEqual(headings(traits), headings(text), 'every heading stays');
  // The template says the rule, in the words the audience brief uses.
  assert.match(flat(text), /begins with its label and ends at the next blank line/);
});

// ---- the briefs (design § 7, § 12)

const SEATS = ['maker', 'judge', 'audience'];
const STANDING = /A seat that starts a browser stops only the one it started, through its own handle, and never stops a process by name or by pattern\./;

test('each brief opens by sending the seat to its card, by absolute path, and has what to read and what not to open', () => {
  for (const seat of SEATS) {
    const text = template(`briefs/${seat}.md`);
    const [first] = text.split('\n');
    assert.match(first, /^Read your card first/, `briefs/${seat}.md`);
    assert.match(first, /absolute path/, `briefs/${seat}.md`);
    assert.match(first, new RegExp(`\`\\{[^{}]*pool/${seat}s/[^{}]*\\}\``), `briefs/${seat}.md: the card's path is an instruction to replace`);
    const names = headings(text);
    assert.ok(names.indexOf('Read, in this order') !== -1 && names.indexOf('Read, in this order') < names.indexOf('Do not open'), `briefs/${seat}.md`);
    for (const name of ['Write', 'Reply']) assert.ok(names.includes(name), `briefs/${seat}.md: ## ${name}`);
    // The standing rule travels with every brief.
    assert.match(flat(section(text, 'Do not open')), STANDING, `briefs/${seat}.md`);
  }
});

test('the audience brief hands the person, the tasks and pictures, and a profile\'s traits only', () => {
  const text = template('briefs/audience.md');
  const hidden = flat(section(text, 'Do not open'));
  assert.match(hidden, /\bintent\b/);
  assert.match(hidden, /\bprofile\b/);
  for (const thing of [/package/, /handoff folder/, /ledger/, /source/]) assert.match(hidden, thing);
  // The pictures she is handed are in the package: all of it is closed to her but those.
  assert.match(hidden, /nothing in the package but the pictures listed above/);
  // The card says the same of the package, whose pictures she is handed.
  assert.match(flat(section(card('audiences/task-reader.md'), 'Never')), /nothing in the package but the pictures you are handed/);
  // Its title names the seat, and nothing of the design: a design's name can say what it means to do.
  assert.deepEqual(headings(text, 1), ['Brief · audience.task-reader']);
  assert.doesNotMatch(text, /the design['’]s name/);
  assert.doesNotMatch(headings(template('outputs/TASK-READ.md'), 1).join(), /design/, 'nor does the read she writes');
  const given = flat(section(text, 'Read, in this order'));
  assert.match(given, /traits/);
  assert.match(given, /every block that begins `So the interface must:`[^.]*taken out/);
  assert.match(given, /[Pp]ictures only/);
  // The tasks are copied, never the intent they came from.
  const tasks = flat(section(text, 'Where she starts, and her tasks'));
  assert.match(tasks, /never the path/i);
  assert.match(tasks, /never a success criterion/i);
  assert.ok(templatesIn(text).includes('templates/outputs/TASK-READ.md'));
});

test('the maker and the judge briefs hand the profile whole, and the judge brief hands the strings with their why-lines', () => {
  for (const seat of ['maker', 'judge']) {
    assert.match(flat(section(template(`briefs/${seat}.md`), 'Read, in this order')), /profile[^.]*whole/, `briefs/${seat}.md`);
  }
  const judge = template('briefs/judge.md');
  const given = flat(section(judge, 'Read, in this order'));
  assert.match(given, /strings[^.]*why-lines?/);
  assert.match(given, /earlier ledger[^.]*only after/i, 'on a re-read, cold first');
  const hidden = flat(section(judge, 'Do not open'));
  for (const thing of [/makers?['’] notes/, /author map/, /other judges?['’] ledgers?/]) assert.match(hidden, thing);
  assert.ok(templatesIn(judge).includes('templates/outputs/LEDGER.md'));
  // A maker is given context, never the design.
  assert.match(flat(template('briefs/maker.md')), /context, never the design/i);
});

// ---- what the seats return (design § 9, § 11)

const judges = readdirSync(join(kit, 'pool', 'judges')).filter(name => name.endsWith('.md')).sort().map(name => ({ name, text: card(`judges/${name}`) }));

test('outputs/LEDGER.md has the top line, the eight columns with the cold implementer\'s ninth, and the three closing sections every judge fills', () => {
  const text = template('outputs/LEDGER.md');
  const top = text.split('\n').find(line => line.startsWith('**Verdict:**'));
  assert.ok(top, 'the top line');
  assert.match(top, /\*\*First fix:\*\*/);
  assert.match(top, /seat['’]s own three words/, 'the words are the seat\'s, never the template\'s');
  const findings = tableOf(section(text, 'Findings'), '#');
  // Eight columns for every judge. The ninth, "Kind", is the cold implementer's: each of its items is a question or a guess.
  assert.deepEqual(findings.head, ['#', 'Check', 'Kind', 'Result', 'Where', 'Why it matters', 'Severity', 'Fix', 'Done when']);
  assert.equal(findings.head.filter(name => name !== 'Kind').length, 8);
  assert.match(findings.rows[0][2], /^\{the cold implementer only, question · guess: any other seat deletes this column\}$/);
  assert.match(flat(card('judges/cold-implementer.md')), /Its kind, \*question\* or \*guess\*, goes in the "Kind" column, and the counts of your reply are counted from that column/);
  assert.match(findings.rows[0][6], /blocks · should · note/);
  assert.match(findings.rows[0][7], /what it is → what it should be/);
  // The lines a card asks for before any finding have their place, above the sections.
  assert.match(flat(text), /\*\*Job first:\*\* \{The lines this seat's card asks for under "Answer the job first", written before any finding\./);
  for (const name of ['profile.md', 'usability.md']) assert.match(card(`judges/${name}`), /\*\*Answer the job first\.\*\*/, `${name} asks for them`);
  const names = headings(text);
  // On a re-read, each earlier finding's mark comes before any new finding.
  assert.deepEqual(names.slice(0, 4), ['On a re-read', 'Findings', 'Checks not run', 'Not looked at']);
  assert.deepEqual(tableOf(section(text, 'Checks not run'), 'Check').head, ['Check', 'What it looks for', 'Why it did not run']);
  const again = flat(section(text, 'On a re-read'));
  assert.match(again, /cold/);
  assert.match(again, /fixed · partly · still present/);
  assert.match(again, /[Oo]n a first read[^.]*"first read"/, 'on a first read it holds one line');
  assert.match(again, /findings below/, 'the findings come after it');
  // A judge reports. Nothing in the ledger has it approve or pass a design.
  assert.doesNotMatch(text, /\bapprov|(?<!fresh )\bpass(?:es|ed)?\b/i);
});

test('outputs/LEDGER.md has a section for everything a judge card says its ledger holds', () => {
  const text = template('outputs/LEDGER.md');
  const names = headings(text);
  // What an Output says, and the section of the template that takes it.
  const HOLDS = [
    [/one row for each (?:finding|item)/, 'Findings'],
    [/checks not run/, 'Checks not run'],
    [/what was not looked at/, 'Not looked at'],
    [/on a re-read/, 'On a re-read'],
    [/"cannot tell" list/, 'Cannot tell'],
    [/\branking\b/, 'Ranking'],
    [/borrow-list/, 'Borrow list'],
  ];
  const said = new Map(HOLDS.map(([, name]) => [name, []]));
  assert.equal(judges.length, 8);
  for (const { name, text: judge } of judges) {
    const holds = flat(output(judge)).toLowerCase();
    assert.deepEqual(templatesIn(output(judge)), ['templates/outputs/LEDGER.md'], `${name} returns a ledger in the template's shape`);
    for (const [phrase, heading] of HOLDS) {
      if (!phrase.test(holds)) continue;
      said.get(heading).push(name);
      assert.ok(names.includes(heading), `${name} returns "${heading}", and the template has no section for it`);
    }
  }
  for (const heading of ['Findings', 'Checks not run', 'Not looked at', 'On a re-read']) assert.equal(said.get(heading).length, 8, `every judge fills ${heading}`);
  assert.deepEqual(said.get('Cannot tell'), ['profile.md']);
  assert.deepEqual(said.get('Ranking'), ['profile.md']);
  assert.deepEqual(said.get('Borrow list'), ['system-fidelity.md']);
  // The sections only some seats fill say whose they are.
  assert.match(flat(section(text, 'Cannot tell')), /profile judge only/i);
  assert.match(flat(section(text, 'Ranking')), /profile judge[^.]*Structure/i);
  assert.match(flat(section(text, 'Ranking')), /clear · slight · tie/);
  assert.match(flat(section(text, 'Borrow list')), /system fidelity judge[^.]*fresh pass/i);
  assert.deepEqual(names.slice(4), ['Cannot tell', 'Ranking', 'Borrow list']);
});

test('outputs/TASK-READ.md opens with the caveat exactly as the audience card has it', () => {
  const reader = card('audiences/task-reader.md');
  const quoted = reader.split('\n').filter(line => line.trim().startsWith('> A simulated person agrees too easily'));
  assert.equal(quoted.length, 1, 'the card has the caveat once, on a line of its own');
  const caveat = quoted[0].trim().slice(2);
  assert.match(caveat, /only the ranking and the stuck points carry information\.$/);
  const text = template('outputs/TASK-READ.md');
  assert.equal(text.split('\n')[0], `> ${caveat}`, 'the first line of every read');
  assert.equal(count(text, caveat), 1);
});

test('outputs/TASK-READ.md has the six answers for each task, the stuck points and the ranking', () => {
  const reader = card('audiences/task-reader.md');
  const text = template('outputs/TASK-READ.md');
  // The six questions of the blind pass and the three of a public page, as the card asks them.
  const asked = [...section(reader, 'Method').matchAll(/^\s*- \*\*([^*]+)\*\*/gm)].map(([, question]) => question);
  assert.equal(asked.length, 9);
  const places = asked.map(question => text.indexOf(`**${question}**`));
  assert.deepEqual(asked.filter((_, i) => places[i] === -1), [], 'each question, in the card\'s words');
  assert.deepEqual(places, [...places].sort((a, b) => a - b), 'in the card\'s order');
  const names = headings(text);
  for (const name of ['Stuck points', 'What no picture could tell her', 'Ranking']) assert.ok(names.includes(name), `## ${name}`);
  assert.equal(names.at(-1), 'Ranking');
  const ranking = flat(section(text, 'Ranking'));
  assert.match(ranking, /clear · slight · tie/);
  assert.match(ranking, /"no ranking: one option"/);
  // Who read, and what she was shown.
  for (const said of [/person\.<name>/, /evidence/, /by letter/]) assert.match(flat(text), said);
});

test('the decision page templates are data the page script takes', () => {
  for (const file of ['outputs/decision.json', 'outputs/decision-approve.json']) {
    assert.deepEqual(validateDecision(JSON.parse(template(file))), [], file);
  }
});

// ---- what a template may name

// Every path of the kit a text names, under one of its folders.
const kitPaths = text => [...text.matchAll(/(?<![\w/-])(?:templates|scripts|kit|pool|skills|reference|tests)\/[\w./-]*\.[a-z]+\b/g)].map(([path]) => path);

test('a template names only files of the kit that exist, and nothing of the skills or the reference files', () => {
  const seen = new Set();
  for (const file of ALL) {
    for (const path of kitPaths(template(file))) {
      seen.add(path);
      assert.doesNotMatch(path, /^(?:skills|reference|tests)\//, `${file} names ${path}`);
      assert.ok(existsSync(join(kit, path)), `${file} names ${path}, which is not in the kit`);
    }
  }
  for (const path of ['scripts/state.mjs', 'scripts/accept.mjs', 'pool/INDEX.md', 'templates/outputs/LEDGER.md', 'templates/outputs/TASK-READ.md']) {
    assert.ok(seen.has(path), `${path} is named, so the check reads what it should`);
  }
});
