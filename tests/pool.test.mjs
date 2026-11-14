import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CARD_KEYS, CHECK_COLUMNS, EFFORTS, ENGINE_FORMS, FOLDERS, JUDGE_SECTIONS, LOADED_WITH, MODELS, SECTIONS, SHELVES, validateCard,
} from '../scripts/lib/card.mjs';
import { parse } from '../scripts/lib/frontmatter.mjs';
import { SIZES, STAGES } from '../scripts/lib/state.mjs';
import { CONTAINERS, KEYS, ROLES } from '../scripts/lib/walkthrough.mjs';

const root = new URL('../', import.meta.url);
const at = path => new URL(path, root);
const read = path => readFileSync(at(path), 'utf8');

// ---- inline samples: every rule of a card is proven here, on cards that exist nowhere else

const HEADER = Object.freeze({
  id: 'maker.room-lister',
  shelf: 'maker',
  job: 'Which rooms are free right now?',
  'sits-at': '[structure, detail]',
  'cast-when': 'The screen lists rooms that change through the day.',
  presets: '[surface, flow]',
  'loaded-with': 'none',
  reads: '[brief, intent]',
  'never-reads': '[other-proposals]',
  engine: 'own',
  'suggested-model': 'sonnet',
  'suggested-effort': 'medium',
  verified: '2026-11-14',
});
const BODY = Object.freeze([
  ['Method', 'List the rooms, the free ones first.'],
  ['Output', 'One list, written where the brief says.'],
  ['Never', '- Never list a room the clinic does not have.'],
  ['Borrowed', 'Nothing.'],
]);
const TABLE = ['| id | trigger | method |', '|---|---|---|', '| overflow | any list of rooms | Read it with forty rooms. |'];
const CHECKS = Object.freeze([
  ['Core checks', '1. Every room shown exists.\n2. Every free room can be booked.'],
  ['Optional checks', TABLE.join('\n')],
]);
const FILE = Object.freeze({ maker: 'makers/room-lister.md', judge: 'judges/room-truth.md', audience: 'audiences/room-reader.md' });

// A card as text: the header as written, a title, and each section in the order given.
const write = (header, sections) =>
  `---\n${Object.entries(header).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n# A sample card\n\nOne line of what the seat is.\n\n${sections.map(([name, text]) => `## ${name}\n\n${text}\n`).join('\n')}`;

// Each sample takes one change to its header and one to its sections, and is checked as its own file.
const sample = (header, sections, file) => (changeHeader = {}, changeSections = s => s) => {
  const h = { ...header, ...changeHeader };
  for (const key of Object.keys(h)) if (h[key] === undefined) delete h[key];
  return validateCard(write(h, changeSections(sections.map(pair => [...pair]))), { file });
};
const maker = sample(HEADER, BODY, FILE.maker);
const judge = sample({ ...HEADER, id: 'judge.room-truth', shelf: 'judge' }, [...CHECKS, ...BODY], FILE.judge);
const audience = sample({ ...HEADER, id: 'audience.room-reader', shelf: 'audience', 'loaded-with': 'person' }, BODY, FILE.audience);

const setSection = (name, text) => sections => sections.map(([n, t]) => [n, n === name ? text : t]);
const without = name => sections => sections.filter(([n]) => n !== name);
const table = (...rows) => setSection('Optional checks', [TABLE[0], TABLE[1], ...rows].join('\n'));

// Exactly one error, saying everything in `patterns`.
function only(errors, ...patterns) {
  assert.equal(errors.length, 1, `expected one error, got:\n${errors.join('\n')}`);
  for (const pattern of patterns) assert.match(errors[0], pattern);
}

test('the lists a card is checked against', () => {
  assert.deepEqual(CARD_KEYS, [
    'id', 'shelf', 'job', 'sits-at', 'cast-when', 'presets', 'loaded-with', 'reads', 'never-reads', 'engine',
    'suggested-model', 'suggested-effort', 'verified',
  ]);
  assert.deepEqual(SHELVES, ['maker', 'judge', 'audience']);
  assert.deepEqual(FOLDERS, { makers: 'maker', judges: 'judge', audiences: 'audience' });
  assert.deepEqual(LOADED_WITH, ['profile', 'person', 'none']);
  assert.deepEqual(MODELS, ['fable', 'opus', 'sonnet', 'haiku', 'none']);
  assert.deepEqual(EFFORTS, ['low', 'medium', 'high', 'xhigh', 'max', 'none']);
  assert.deepEqual(ENGINE_FORMS, ['own', 'skill:<name>', 'model:any', 'tool:<name>']);
  assert.deepEqual(SECTIONS, ['Method', 'Output', 'Never', 'Borrowed']);
  assert.deepEqual(JUDGE_SECTIONS, ['Core checks', 'Optional checks']);
  assert.deepEqual(CHECK_COLUMNS, ['id', 'trigger', 'method']);
  for (const list of [CARD_KEYS, SHELVES, FOLDERS, LOADED_WITH, MODELS, EFFORTS, ENGINE_FORMS, SECTIONS, JUDGE_SECTIONS, CHECK_COLUMNS]) {
    assert.ok(Object.isFrozen(list));
  }
});

test('a good maker card, a good judge card and a good audience card are valid', () => {
  assert.deepEqual(maker(), []);
  assert.deepEqual(judge(), []);
  assert.deepEqual(audience(), []);
});

test('a card with CRLF line endings is valid', () => {
  for (const [header, sections, file] of [[HEADER, BODY, FILE.maker], [{ ...HEADER, id: 'judge.room-truth', shelf: 'judge' }, [...CHECKS, ...BODY], FILE.judge]]) {
    const text = write(header, sections).replace(/\n/g, '\r\n');
    assert.ok(text.includes('\r\n'));
    assert.deepEqual(validateCard(text, { file }), []);
  }
});

test('a card is valid without a file to check it against', () => {
  assert.deepEqual(validateCard(write(HEADER, BODY)), []);
  assert.deepEqual(validateCard(write(HEADER, BODY), {}), []);
});

test('a text that is not a string is the caller\'s mistake, thrown and never reported as a fault of a card', () => {
  assert.throws(() => validateCard(undefined, { file: FILE.maker }), TypeError);
  assert.throws(() => validateCard({ id: 'maker.room-lister' }), TypeError);
});

test('every header key is required', () => {
  for (const key of CARD_KEYS) only(maker({ [key]: undefined }), /^header: /, new RegExp(`"${key}" is missing`));
});

test('no other key is allowed', () => {
  only(maker({ owner: 'the front desk' }), /^header: unknown key "owner"/);
  assert.equal(maker({ owner: 'x', notes: 'y' }).length, 2);
});

test('a card with no header, or a header that cannot be read, is one error', () => {
  only(validateCard('# A card\n\n## Method\n\nText.\n', { file: FILE.maker }), /^header: /, /"---"/);
  only(validateCard('---\nid: maker.room-lister\njob:\n  nested: yes\n---\n', { file: FILE.maker }), /^header: line 3/);
  only(validateCard('---\nid: maker.room-lister\n', { file: FILE.maker }), /^header: line 1/, /never closed/);
  // One line each: a job that runs onto a second line is not flat frontmatter.
  only(validateCard(write(HEADER, BODY).replace('free right now?', 'free right now,\nand which are next?'), { file: FILE.maker }), /^header: line 5/);
  // A key written twice, whether or not the two agree.
  only(validateCard(write(HEADER, BODY).replace('shelf: maker\n', 'shelf: maker\nshelf: judge\n'), { file: FILE.maker }), /^header: line 4: "shelf" appears twice/);
  only(validateCard(write(HEADER, BODY).replace('engine: own\n', 'engine: own\nengine: own\n'), { file: FILE.maker }), /^header: line 12: "engine" appears twice/);
});

test('shelf is maker, judge or audience', () => {
  only(maker({ shelf: 'makers' }), /^header: "shelf" must be one of maker, judge, audience; it is "makers"/);
  only(maker({ shelf: '[maker]' }), /"shelf" must be one of/);
});

test('loaded-with is profile, person or none', () => {
  for (const value of LOADED_WITH) assert.deepEqual(maker({ 'loaded-with': value }), []);
  only(maker({ 'loaded-with': 'persona' }), /^header: "loaded-with" must be one of profile, person, none; it is "persona"/);
  only(maker({ 'loaded-with': '' }), /"loaded-with" must be one of/);
});

test('suggested-model is a family alias or none, never a version', () => {
  for (const value of MODELS) assert.deepEqual(maker({ 'suggested-model': value }), []);
  only(maker({ 'suggested-model': 'gpt' }), /^header: "suggested-model" must be one of fable, opus, sonnet, haiku, none; it is "gpt"/);
  only(maker({ 'suggested-model': 'opus-4' }), /"suggested-model" must be one of/);
  only(maker({ 'suggested-model': 'Opus' }), /"suggested-model" must be one of/);
});

test('suggested-effort is one of the six values', () => {
  for (const value of EFFORTS) assert.deepEqual(maker({ 'suggested-effort': value }), []);
  only(maker({ 'suggested-effort': 'extreme' }), /^header: "suggested-effort" must be one of low, medium, high, xhigh, max, none; it is "extreme"/);
});

test('engine is own, a skill, any outside model, or a tool', () => {
  const accepted = [
    'own', 'skill:frontend-design', 'skill:frontend-design:frontend-design', 'skill:my_skill2', 'skill:a', 'skill:2d:x_y-z', 'model:any',
    'tool:stitch', 'tool:screen-maker2',
  ];
  for (const value of accepted) assert.deepEqual(maker({ engine: value }), [], value);
  const refused = [
    'none', 'own:text', 'skill:', 'skill:Front-End', 'skill:front end', 'model:openai', 'model:gemini', 'model:', 'model:any:fast',
    'tool:', 'tool:Stitch', 'tool:stitch:pro', 'tool:screen_maker', 'xskill:a', 'skill:a b', '"own "', '"tool:stitch "', '[own]',
    // A skill is one name, or a plugin and a name: neither is empty, neither starts with a mark, and there is no third part.
    'skill:a:', 'skill::a', 'skill:a:b:c', 'skill:-a', 'skill:_a', 'skill:a:-b', 'skill:a:_b', 'skill:a::b',
  ];
  for (const value of refused) only(maker({ engine: value }), /^header: "engine" must be own, skill:<name>, model:any or tool:<name>; it is /);
});

test('id is the shelf and the name of the file', () => {
  only(maker({ id: 'maker.room-list' }), /^header: "id" /, /maker\.room-lister/, /makers\/room-lister\.md/);
  only(maker({ id: 'room-lister' }), /^header: "id" must be <shelf>\.<name>/, /it is "room-lister"/);
  only(maker({ id: 'maker.Room_Lister' }), /"id" must be <shelf>\.<name>/);
  only(maker({ id: 'maker.room-lister.v2' }), /"id" must be <shelf>\.<name>/);
  only(maker({ id: 'desk.room-lister' }), /"id" must be <shelf>\.<name>/);
  only(maker({ id: 'the-maker.room-lister' }), /"id" must be <shelf>\.<name>/);
  only(maker({ id: 'maker.room.lister' }), /"id" must be <shelf>\.<name>/);
  only(maker({ id: '[maker.room-lister]' }), /"id" must be <shelf>\.<name>/, /it is \["maker\.room-lister"\]/);
  only(maker({ id: 'judge.room-lister' }), /^header: "id" is on the judge shelf, but "shelf" is maker/);
});

test('shelf is the folder the card is in', () => {
  // A judge card, whole and right in itself, filed among the makers.
  const text = write({ ...HEADER, id: 'judge.room-lister', shelf: 'judge' }, [...CHECKS, ...BODY]);
  only(validateCard(text, { file: FILE.maker }), /^header: "shelf" is judge, but the card is in makers\//);
  assert.deepEqual(validateCard(text, { file: 'judges/room-lister.md' }), []);
  assert.deepEqual(validateCard(text, { file: 'judges\\room-lister.md' }), [], 'a path written with backslashes');
});

test('a card lives in makers/, judges/ or audiences/, under a kebab-case name', () => {
  const text = write(HEADER, BODY);
  for (const file of ['room-lister.md', 'notes/room-lister.md', 'makers/room-lister.txt', 'makers/more/room-lister.md', 'makers/Room_Lister.md', 'makers/room.lister.md', 'pool/makers/room-lister.md', 'makers/.md']) {
    only(validateCard(text, { file }), /^file: /, /makers\/<name>\.md/);
  }
});

test('sits-at is a list of at least one stage', () => {
  for (const stage of STAGES) assert.deepEqual(maker({ 'sits-at': `[${stage}]` }), [], stage);
  only(maker({ 'sits-at': '[structure, polish]' }), /^header: "sits-at" names "polish", which is not a stage \(frame, context, /);
  only(maker({ 'sits-at': '[]' }), /^header: "sits-at" must name at least one stage/);
  only(maker({ 'sits-at': 'structure' }), /^header: "sits-at" must be a list, as \[a, b\]; it is "structure"/);
  assert.equal(maker({ 'sits-at': '[polish, ship]' }).length, 2);
});

test('presets is a list of sizes, and may be empty', () => {
  assert.deepEqual(maker({ presets: '[]' }), []);
  assert.deepEqual(maker({ presets: `[${SIZES.join(', ')}]` }), []);
  only(maker({ presets: '[surface, huge]' }), /^header: "presets" names "huge", which is not a size \(correction, adjustment, /);
  only(maker({ presets: 'surface' }), /^header: "presets" must be a list/);
  only(maker({ presets: '[structure]' }), /"presets" names "structure"/);
});

test('verified is a real date written YYYY-MM-DD', () => {
  assert.deepEqual(maker({ verified: '2024-02-29' }), []);
  for (const value of ['14/11/2026', '2026-11', '2026-11-14T10:00', 'today', '20261114', '2026-02-30', '2026-13-01', '2026-00-10', '', '[2026-11-14]']) {
    only(maker({ verified: value }), /^header: "verified" must be a date written YYYY-MM-DD; it is /);
  }
});

test('job and cast-when are one line of text each', () => {
  for (const key of ['job', 'cast-when']) {
    only(maker({ [key]: '' }), new RegExp(`^header: "${key}" must be one line of text; it is ""`));
    only(maker({ [key]: '   ' }), new RegExp(`"${key}" must be one line of text`));
    only(maker({ [key]: '[one, two]' }), new RegExp(`"${key}" must be one line of text`));
    only(maker({ [key]: '42' }), new RegExp(`"${key}" must be one line of text; it is 42`));
    assert.deepEqual(maker({ [key]: '"Which rooms: the free ones, or all?"' }), []);
  }
});

test('reads names at least one thing; never-reads may name none', () => {
  only(maker({ reads: '[]' }), /^header: "reads" must name at least one thing/);
  only(maker({ reads: 'brief' }), /^header: "reads" must be a list/);
  only(maker({ reads: '[brief, ""]' }), /^header: "reads" has an empty item/);
  assert.deepEqual(maker({ 'never-reads': '[]' }), []);
  only(maker({ 'never-reads': 'nothing' }), /^header: "never-reads" must be a list/);
  only(maker({ 'never-reads': '["", intent]' }), /^header: "never-reads" has an empty item/);
  only(maker({ 'never-reads': '["  "]' }), /"never-reads" has an empty item/);
});

test('every section is required', () => {
  for (const name of SECTIONS) only(maker({}, without(name)), new RegExp(`^body: "## ${name}" is missing`));
  for (const name of [...JUDGE_SECTIONS, ...SECTIONS]) only(judge({}, without(name)), new RegExp(`^body: "## ${name}" is missing`));
});

test('the sections come in the format\'s order', () => {
  const swap = (a, b) => sections => {
    const out = [...sections];
    [out[a], out[b]] = [out[b], out[a]];
    return out;
  };
  only(maker({}, swap(0, 1)), /^body: the sections are out of order: Output, Method, Never, Borrowed; the order is Method, Output, Never, Borrowed/);
  only(maker({}, swap(2, 3)), /out of order/);
  only(judge({}, swap(0, 1)), /^body: the sections are out of order: Optional checks, Core checks, Method, /);
  // The checks come before the method.
  only(judge({}, sections => [...sections.slice(2), ...sections.slice(0, 2)]), /out of order: Method, Output, Never, Borrowed, Core checks, Optional checks; the order is Core checks, Optional checks, Method, /);
  // A missing section is one fault, not two: what is left is still in order.
  only(maker({}, without('Output')), /is missing/);
});

test('no other section is allowed, and none twice', () => {
  only(maker({}, sections => [...sections, ['Notes', 'More.']]), /^body: "## Notes" is not a section of a card/);
  only(maker({}, sections => [['Why', 'Because.'], ...sections]), /"## Why" is not a section of a card/);
  only(maker({}, setSection('Method', 'Text.\n\n## Method (in short)\n\nText.')), /"## Method \(in short\)" is not a section of a card/);
  only(maker({}, sections => [...sections.slice(0, 2), ['Method', 'Again.'], ...sections.slice(2)]), /^body: "## Method" appears twice/);
  only(maker({}, setSection('Method', 'Text.\n\n## method\n\nText.')), /"## method" is not a section of a card/);
});

test('every section has text under it', () => {
  for (const name of SECTIONS) only(maker({}, setSection(name, '')), new RegExp(`^body: "## ${name}" has nothing under it`));
  only(maker({}, setSection('Never', '   \n\t\n')), /"## Never" has nothing under it/);
  only(judge({}, setSection('Core checks', '')), /"## Core checks" has nothing under it/);
  only(judge({}, setSection('Optional checks', '')), /"## Optional checks" has nothing under it/);
  assert.deepEqual(maker({}, setSection('Borrowed', 'nothing')), []);
});

test('headings of other levels, and a ## line inside a code fence, are not sections', () => {
  assert.deepEqual(maker({}, setSection('Method', '### A step\n\nText.\n\n#### A detail\n\nText.\n\n##No space, so no heading.')), []);
  assert.deepEqual(maker({}, setSection('Output', 'The file looks like this:\n\n```markdown\n## Findings\n\n| a | b |\n```\n\nAnd then:\n\n~~~\n## Another\n~~~')), []);
  // After a fence closes, a section counts again.
  only(maker({}, setSection('Output', '```\n## Inside\n```\n\n## Outside\n\nText.')), /"## Outside" is not a section of a card/);
  // A fence may be indented, as one inside a list item is.
  assert.deepEqual(maker({}, setSection('Output', '1. Like this:\n\n   ```\n## Inside\n   ```')), []);
  // Spaces after the marks, or at the end of the line, change nothing.
  assert.deepEqual(validateCard(write(HEADER, BODY).replace('## Method\n', '##   Method  \n').replace('## Never\n', '## Never\t\n'), { file: FILE.maker }), []);
});

test('a code fence closes only on its own character, at least as long, with nothing after it', () => {
  const output = text => maker({}, setSection('Output', text));
  // A fence of the other character inside it does not close it.
  assert.deepEqual(output('~~~\n```\n## Inside\n~~~'), []);
  assert.deepEqual(output('```\n~~~\n## Inside\n```'), []);
  // Nor does a shorter one of its own.
  assert.deepEqual(output('````\n```\n## Inside\n````'), []);
  assert.deepEqual(output('~~~~~\n~~~\n~~~~\n## Inside\n~~~~~'), []);
  // Nor a line that opens a fence, with a language after the marks.
  assert.deepEqual(output('```\n```js\n## Inside\n```'), []);
  // A longer one of its own does, and so does one with spaces after it or up to three before it.
  only(output('```\n## Inside\n`````\n\n## Outside\n\nText.'), /"## Outside" is not a section of a card/);
  only(output('~~~\n## Inside\n~~~  \n\n## Outside\n\nText.'), /"## Outside" is not a section of a card/);
  only(output('```\n## Inside\n   ```\n\n## Outside\n\nText.'), /"## Outside" is not a section of a card/);
  // Four spaces before the marks is not a fence line: the fence stays open.
  assert.deepEqual(output('```\n## Inside\n    ```\n## Still inside\n```'), []);
  // Two marks are not a fence.
  only(output('``\n## Outside\n\nText.'), /"## Outside" is not a section of a card/);
});

test('a heading written another way is refused, and the error says how one is written', () => {
  const FORM = /a section's heading is two hashes, a space, the name, and nothing else on the line/;
  const never = heading => validateCard(write(HEADER, BODY).replace('## Never\n', `${heading}\n`), { file: FILE.maker });
  // Closing hashes: the name is read with them, so it is unknown, and the section is missing.
  const closed = never('## Never ##');
  assert.equal(closed.length, 2, closed.join('\n'));
  assert.match(closed[0], /^body: "## Never ##" is not a section of a card \(Method, Output, Never, Borrowed\)/);
  assert.match(closed[0], FORM);
  assert.match(closed[1], /^body: "## Never" is missing/);
  assert.match(closed[1], FORM);
  // A tab after the hashes: not a heading at all.
  only(never('##\tNever'), /^body: "## Never" is missing/, FORM);
  only(never('   ## Never'), /"## Never" is missing/, FORM);
});

test('only a judge has checks', () => {
  only(maker({}, sections => [CHECKS[0], ...sections]), /^body: "## Core checks" belongs to a judge card/);
  only(audience({}, sections => [CHECKS[1], ...sections]), /^body: "## Optional checks" belongs to a judge card/);
  assert.equal(maker({}, sections => [...CHECKS, ...sections]).length, 2);
  // A card in judges/ whose shelf is mistyped is still read as a judge: one fault, one error.
  only(judge({ shelf: 'judges' }), /"shelf" must be one of/);
  // And with no file to go by, a card whose shelf cannot be read is not held to a judge's sections.
  only(validateCard(write({ ...HEADER, shelf: 'desk' }, BODY)), /"shelf" must be one of/);
});

test('a judge has two to six core checks, numbered or bulleted', () => {
  const core = n => setSection('Core checks', Array.from({ length: n }, (_, i) => `${i + 1}. Check ${i + 1}.`).join('\n'));
  only(judge({}, core(1)), /^body: "## Core checks" has 1 check; a judge has two to six/);
  only(judge({}, core(7)), /^body: "## Core checks" has 7 checks; a judge has two to six/);
  for (const n of [2, 3, 6]) assert.deepEqual(judge({}, core(n)), [], `${n} checks`);
  only(judge({}, setSection('Core checks', 'It checks that every room exists and that every free room can be booked.')), /"## Core checks" has 0 checks/);
  assert.deepEqual(judge({}, setSection('Core checks', '- Every room shown exists.\n- Every free room can be booked.')), []);
  for (const marks of [['*', '*'], ['+', '+'], ['1)', '2)'], ['-', '10.']]) {
    assert.deepEqual(judge({}, setSection('Core checks', marks.map((mark, i) => `${mark} Check ${i + 1}.`).join('\n'))), [], marks.join(' '));
  }
  // A mark with nothing after it is not a check.
  only(judge({}, setSection('Core checks', '1. One.\n- \n2.')), /has 1 check;/);
  // Lines under a check, and a list nested in it, are part of that check.
  assert.deepEqual(judge({}, setSection('Core checks', 'Always:\n\n1. Every room shown exists.\n   - also the gym\n   - also the garden room\n   A second line.\n2. Every free room can be booked.')), []);
  only(judge({}, setSection('Core checks', '1. One.\n   - a\n   - b\n   - c')), /has 1 check;/);
  // A line of dashes or a number in a sentence is not a check.
  only(judge({}, setSection('Core checks', '1. One.\n\n---\n\n2026 was the year.\n-not a bullet')), /has 1 check;/);
});

test('a core check may be indented by up to three spaces, and a nested item is never one', () => {
  const core = text => judge({}, setSection('Core checks', text));
  for (const indent of [' ', '  ', '   ']) assert.deepEqual(core(`${indent}1. One.\n${indent}2. Two.`), [], `${indent.length} spaces`);
  assert.deepEqual(core('   - One.\n - Two.'), [], 'items of one list need not line up');
  // Four spaces is a code block, not a list.
  only(core('    1. One.\n    2. Two.'), /has 0 checks;/);
  only(core('1. One.\n    2. Two.'), /has 1 check;/);
  // An item is nested when it starts where the text of the check above it starts, or further in.
  only(core('- One.\n  - a\n  - b'), /has 1 check;/);
  only(core('- One.\n   - a\n   - b'), /has 1 check;/);
  only(core(' 1. One.\n    - a\n    - b'), /has 1 check;/);
  assert.deepEqual(core('- One.\n  - a\n - Two.'), []);
  // The text of "10. Ten." starts four in, so an item three in is not inside it.
  assert.deepEqual(core('10. Ten.\n   - Eleven.'), []);
  assert.deepEqual(core('1.  One.\n   - Two.'), [], 'two spaces after the mark');
  // Once back out, the next item is a check again.
  assert.deepEqual(core('1. One.\n   - a\n2. Two.\n   - b'), []);
  // Each item is measured against the check above it, not against the first of the list.
  assert.deepEqual(core('10. One.\n- Two.\n   - a\n   - b\n   - c\n   - d\n   - e'), []);
});

test('a second list after a paragraph is read at its own indentation', () => {
  const core = text => judge({}, setSection('Core checks', text));
  // The paragraph ended the first list, so the item two spaces in is a check, not a part of the first.
  assert.deepEqual(core('- One.\n\nAnd, when the screen lists rooms:\n\n  - Two.'), []);
  assert.deepEqual(core('1. One.\n\nAnd then:\n\n   1. Two.\n   2. Three.'), []);
  // And what is nested in the second list is still nested.
  assert.deepEqual(core('- One.\n\nAnd then:\n\n- Two.\n  - a\n  - b\n  - c\n  - d\n  - e'), []);
  // A line that runs on from a check, with no blank line before it, does not end the list.
  only(core('- One, which\nruns on.\n  - a\n  - b'), /has 1 check;/);
  // Nor does a paragraph that sits inside the check, where its text starts.
  only(core('- One.\n\n  More about one.\n\n  - a\n  - b'), /has 1 check;/);
  only(core('1. One.\n\n    More about one.\n\n   - a'), /has 1 check;/);
  // A blank line alone ends nothing, and nor do two.
  only(core('- One.\n\n  - a\n\n  - b'), /has 1 check;/);
  only(core('- One.\n\n\n  - a\n  - b'), /has 1 check;/);
});

test('inside a judge\'s checks, a line in a code fence is neither a check nor a row', () => {
  const core = text => judge({}, setSection('Core checks', text));
  const optional = text => judge({}, setSection('Optional checks', text));
  // A fenced list is an example, not two more checks.
  only(core('1. Every room shown exists.\n\n```\n- a room\n- another room\n```'), /^body: "## Core checks" has 1 check;/);
  only(core('1. One.\n   ~~~\n   2. not a check\n   ~~~'), /has 1 check;/);
  assert.deepEqual(core('1. One.\n\n   ```\n   - an example\n   ```\n2. Two.'), []);
  assert.deepEqual(core(`${Array.from({ length: 6 }, (_, i) => `${i + 1}. Check.`).join('\n')}\n\n\`\`\`\n7. Not a seventh.\n\`\`\``), []);
  // A fenced command may hold a pipe.
  assert.deepEqual(optional(`${TABLE.join('\n')}\n\nThe pictures:\n\n\`\`\`\nnode scripts/shots.mjs page.html --out shots --widths 390 | head\n\`\`\``), []);
  // A fenced table is an example: it is not the header, and its rows are not rows.
  assert.deepEqual(optional(`An entry reads like this:\n\n\`\`\`\n| check | seen |\n|---|---|\n| overflow |  |\n\`\`\`\n\n${TABLE.join('\n')}`), []);
  only(optional('```\n| id | trigger | method |\n|---|---|---|\n```'), /^body: "## Optional checks" needs a table/);
  // A section that holds only a fence still has text under it; what it lacks is its checks.
  only(core('```\n1. One.\n2. Two.\n```'), /has 0 checks;/);
  // Once the fence closes, a line counts again.
  only(optional(`\`\`\`\na | b\n\`\`\`\n\n${TABLE.join('\n')}\nd | e | f |`), /a table row begins and ends with a pipe/, /it has "d \| e \| f \|"/);
});

test('optional checks are a table of id, trigger and method', () => {
  assert.deepEqual(judge({}, table()), [], 'a table with no rows');
  assert.deepEqual(judge({}, table('| a | when b | do c |', '| d | when e | do f |')), []);
  assert.deepEqual(judge({}, setSection('Optional checks', `Each runs only when its trigger is seen.\n\n${TABLE.join('\n')}\n\nNothing else.`)), []);
  assert.deepEqual(judge({}, setSection('Optional checks', '|id|trigger|method|\n|:--|:-:|--:|\n|a|b|c|')), []);
  assert.deepEqual(judge({}, table('| a | a list \\| a table | do c |')), [], 'an escaped bar is part of its cell');
  assert.deepEqual(judge({}, setSection('Optional checks', TABLE.map(line => `  ${line}`).join('\n'))), [], 'an indented table');
  only(judge({}, setSection('Optional checks', 'None yet.')), /^body: "## Optional checks" needs a table with the columns id, trigger, method/, /\| id \| trigger \| method \|/);
  only(judge({}, setSection('Optional checks', '- overflow: any list of rooms')), /"## Optional checks" needs a table/);
});

test('a header cell of the optional checks may be written with or without backticks', () => {
  const header = line => judge({}, setSection('Optional checks', `${line}\n|---|---|---|\n| a | b | c |`));
  assert.deepEqual(header('| `id` | `trigger` | `method` |'), []);
  assert.deepEqual(header('| `id` | trigger | `method` |'), []);
  only(header('| `id | trigger | method |'), /must have the columns id, trigger, method; it has `id, trigger, method/);
  only(header('| id` | trigger | method |'), /must have the columns/);
  only(header('| ``id`` | trigger | method |'), /must have the columns/);
  only(header('| `when` | `trigger` | `method` |'), /must have the columns id, trigger, method; it has when, trigger, method/);
  // Only the header: a row's cells are the card's own words, backticks and all.
  assert.deepEqual(judge({}, table('| `overflow` | any `list` | `Read` it. |')), []);
});

test('a row of the optional checks begins and ends with a pipe', () => {
  const FORM = /a table row begins and ends with a pipe, as \| id \| trigger \| method \|/;
  const section = text => judge({}, setSection('Optional checks', text));
  // The whole table without its outer pipes, as Markdown allows and the format does not.
  only(section('id | trigger | method\n---|---|---\na | b | c'), /^body: "## Optional checks": /, FORM, /it has "id \| trigger \| method"/);
  // One row without its opening pipe, or without its closing one.
  only(section(`${TABLE.join('\n')}\nd | when e | do f |`), FORM, /it has "d \| when e \| do f \|"/);
  only(section(`${TABLE.join('\n')}\n| d | when e | do f`), FORM, /it has "\| d \| when e \| do f"/);
  only(section('| id | trigger | method\n|---|---|---|'), FORM, /it has "\| id \| trigger \| method"/);
  // A closing pipe written \| is part of the last cell, so the row is not closed.
  only(section(`${TABLE.join('\n')}\n| d | when e | do f \\|`), FORM);
  // A sentence beside the table may hold a pipe written \|, and no other.
  assert.deepEqual(section(`A trigger is seen or not: yes \\| no.\n\n${TABLE.join('\n')}`), []);
  only(section(`A trigger is seen or not: yes | no.\n\n${TABLE.join('\n')}`), FORM, /it has "A trigger is seen or not: yes \| no\."/);
  // The first line at fault is the one reported.
  only(section('id | trigger | method\n| a | b | c'), /it has "id \| trigger \| method"/);
});

test('the optional-checks table has exactly the three columns, in order', () => {
  const header = line => setSection('Optional checks', `${line}\n|---|---|---|\n| a | b | c |`);
  only(judge({}, header('| id | when | method |')), /^body: the table of "## Optional checks" must have the columns id, trigger, method; it has id, when, method/);
  only(judge({}, header('| trigger | id | method |')), /must have the columns id, trigger, method; it has trigger, id, method/);
  only(judge({}, header('| id | trigger |')), /must have the columns/);
  only(judge({}, header('| id | trigger | method | notes |')), /must have the columns/);
  only(judge({}, header('| Id | Trigger | Method |')), /must have the columns/);
  only(judge({}, setSection('Optional checks', '| id | trigger | method |\n| a | b | c |')), /^body: the table of "## Optional checks" needs a line of dashes under its header row/);
  only(judge({}, setSection('Optional checks', '| id | trigger | method |')), /needs a line of dashes/);
  only(judge({}, setSection('Optional checks', '| id | trigger | method |\n|---|---|\n| a | b | c |')), /needs a line of dashes/);
});

test('every optional-check row has an id, a trigger and a method', () => {
  only(judge({}, table('| a | when b | do c |', '| d |  | do f |')), /^body: "## Optional checks" row 2: the trigger is empty/);
  only(judge({}, table('|  | when b | do c |')), /"## Optional checks" row 1: the id is empty/);
  only(judge({}, table('| a | when b | |')), /row 1: the method is empty/);
  only(judge({}, table('| a | when b |')), /^body: "## Optional checks" row 1 has 2 cells; a row is id, trigger, method/);
  only(judge({}, table('| a | when b | do c | and d |')), /row 1 has 4 cells/);
  assert.equal(judge({}, table('| a |  |  |')).length, 2);
});

test('every fault of a card is reported, the header first', () => {
  const errors = judge({ shelf: 'judges', verified: 'today', owner: 'me' }, sections => table('| a |  | c |')(without('Never')(sections)));
  assert.equal(errors.length, 5, errors.join('\n'));
  assert.match(errors[0], /^header: "shelf"/);
  assert.match(errors[1], /^header: "verified"/);
  assert.match(errors[2], /^header: unknown key "owner"/);
  assert.match(errors[3], /^body: "## Never" is missing/);
  assert.match(errors[4], /^body: "## Optional checks" row 1/);
});

// ---- the kit's own pool

// A Markdown table row as its cells; a bar written \| stays in its cell.
const cells = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));
// The rows of the tables in a text, without header and dashes rows: those whose first cell is a code span.
const codeRows = text => text.split('\n').filter(line => /^\|\s*`/.test(line)).map(cells);
const spans = text => [...text.matchAll(/`([^`]+)`/g)].map(([, span]) => span);
const unspan = cell => cell.replace(/^`(.*)`$/, '$1');

// Every card of the kit: its path under pool/, its text, its header. A shelf folder not there yet holds none.
const cards = Object.keys(FOLDERS).flatMap(folder =>
  (existsSync(at(`pool/${folder}`)) ? readdirSync(at(`pool/${folder}`)) : [])
    .filter(name => name.endsWith('.md'))
    .sort()
    .map(name => {
      const file = `${folder}/${name}`;
      const text = read(`pool/${file}`);
      let data = {};
      try {
        ({ data } = parse(text));
      } catch {
        // validateCard says why, in the test below.
      }
      return { file, text, data };
    }));

test('every card in the pool keeps the card format', () => {
  assert.ok(cards.length >= 8, 'the pool holds cards');
  for (const { file, text } of cards) assert.deepEqual(validateCard(text, { file }), [], `pool/${file}`);
});

// The plan's table for the makers: the stages, the engine, the suggested model and effort.
const MAKERS = {
  'maker.structure-describer': [['structure'], 'own', 'fable', 'high'],
  'maker.outside-describer': [['structure', 'look'], 'model:any', 'none', 'none'],
  'maker.screen-generator': [['structure', 'look'], 'tool:stitch', 'none', 'none'],
  'maker.transcriber': [['structure'], 'own', 'sonnet', 'medium'],
  'maker.interaction-designer': [['detail'], 'own', 'fable', 'high'],
  'maker.interface-writer': [['detail'], 'own', 'fable', 'high'],
  'maker.prototype-builder': [['detail'], 'own', 'opus', 'medium'],
  'maker.visual-designer': [['look'], 'skill:frontend-design:frontend-design', 'fable', 'high'],
};

test('the eight maker cards hold the decisions they were written to', () => {
  const makers = cards.filter(card => card.file.startsWith('makers/'));
  assert.deepEqual(makers.map(card => card.data.id).sort(), Object.keys(MAKERS).sort());
  for (const { data } of makers) {
    const [stages, engine, model, effort] = MAKERS[data.id];
    assert.deepEqual([data['sits-at'], data.engine, data['suggested-model'], data['suggested-effort']], [stages, engine, model, effort], data.id);
  }
});

test('the outside describer never mentions a key', () => {
  const { text } = cards.find(card => card.data.id === 'maker.outside-describer');
  assert.doesNotMatch(text, /\bkeys?\b|secret|credential|password/i);
});

// Every path under one of `folders` that a text names, anywhere in it, a command in a code fence included.
const pathsUnder = (folders, text) => [...text.matchAll(new RegExp(`(?<![\\w-])(?:${folders.join('|')})/[\\w./-]*\\.[a-z]+\\b`, 'g'))].map(([path]) => path);
// The folders of the kit that exist today, and those later tasks write.
const LIVE = ['scripts', 'kit', 'pool', 'tests'];
const LATER = ['templates', 'skills', 'reference'];
// The pool's own texts: the two documents and every card, whatever its shelf.
const poolTexts = () => ['CARD-FORMAT.md', 'MODELS.md', ...cards.map(card => card.file)].map(file => [`pool/${file}`, read(`pool/${file}`)]);

test('the paths a text can name are found wherever they are written', () => {
  const text = 'Read `kit/KIT-CONTRACT.md`, then:\n\n```\nnode ./scripts/describe.mjs --out x.json\n```\n\nSee templates/outputs/LEDGER.md, pool/makers/<name>.md and my-kit/notes.md.';
  assert.deepEqual(pathsUnder(['scripts', 'kit', 'pool'], text), ['kit/KIT-CONTRACT.md', 'scripts/describe.mjs']);
  assert.deepEqual(pathsUnder(['templates'], text), ['templates/outputs/LEDGER.md']);
  assert.deepEqual(pathsUnder(LIVE, 'As `tests/fixtures/proposals/calendar.json` shows; see skills/cast/SKILL.md.'), ['tests/fixtures/proposals/calendar.json']);
  assert.deepEqual(pathsUnder(LATER, 'See skills/cast/SKILL.md, reference/ANTI-PATTERNS.md and `templates/briefs/maker.md`, not kit/grey/kit.css.'), ['skills/cast/SKILL.md', 'reference/ANTI-PATTERNS.md', 'templates/briefs/maker.md']);
});

test('a script, a kit file, a pool file or a test file named in the pool exists', () => {
  const seen = new Set();
  for (const [file, text] of poolTexts()) {
    for (const path of pathsUnder(LIVE, text)) {
      seen.add(path);
      assert.ok(existsSync(at(path)), `${file} names ${path}, which is not in the kit`);
    }
  }
  for (const path of ['scripts/lib/card.mjs', 'scripts/lib/walkthrough.mjs', 'scripts/describe.mjs', 'scripts/shots.mjs', 'scripts/accept.mjs', 'kit/KIT-CONTRACT.md', 'pool/MODELS.md']) {
    assert.ok(seen.has(path), `${path} is named, so the check reads what it should`);
  }
});

test('a template, a skill or a reference file named in the pool exists (Task 12 makes templates/ live; Tasks 13 to 18, skills/ and reference/)', { todo: 'Task 12 writes the templates; Tasks 13 to 18 write the skills and the reference files' }, () => {
  for (const [file, text] of poolTexts()) {
    for (const path of pathsUnder(LATER, text)) assert.ok(existsSync(at(path)), `${file} names ${path}, which is not in the kit`);
  }
});

// The walkthrough format as two cards say it, each under this heading, as a list.
const SUMMARY = '### The walkthrough format, in short';
const summaryOf = text => {
  const lines = text.split('\n');
  const from = lines.indexOf(SUMMARY);
  if (from === -1) return null;
  const rest = lines.slice(from + 1);
  const end = rest.findIndex(line => line !== '' && !/^(?:- |  )/.test(line));
  return rest.slice(0, end === -1 ? undefined : end).join('\n');
};

test('a card that sums up the walkthrough format names every key, role and container of it, and no other', () => {
  const format = new Set([...KEYS.proposal, ...KEYS.screen, ...KEYS.role, ...KEYS.container, ...ROLES, ...CONTAINERS, 'screen', 'dialog']);
  const summaries = cards.map(card => [card.data.id, summaryOf(card.text)]).filter(([, summary]) => summary !== null);
  assert.deepEqual(summaries.map(([id]) => id).sort(), ['maker.structure-describer', 'maker.transcriber']);
  for (const [id, summary] of summaries) {
    const named = new Set(spans(summary));
    assert.deepEqual([...format].filter(word => !named.has(word)), [], `${id} leaves out a word of the format`);
    assert.deepEqual([...named].filter(word => !format.has(word)), [], `${id} names a word the format lacks`);
    // An expansion is the one container that must have a label.
    assert.match(summary, /An expansion always has a\s+`label`/, id);
    assert.match(summary, /A region or a group may have a\s+`label`/, id);
  }
});

// The one command a card gives in a fence, by the words it starts with: the script between its double
// quotes, to run without a shell.
const scriptIn = (text, start) => {
  const line = text.split('\n').map(l => l.trim()).find(l => l.startsWith(start));
  assert.ok(line, `a command starting ${start}`);
  return { line, script: line.slice(line.indexOf('"') + 1, line.lastIndexOf('" ')) };
};
const node = (args, cwd) => spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });

test('the command a describer or a transcriber checks its proposal with runs from the kit\'s root', () => {
  const kit = fileURLToPath(root);
  const proposal = fileURLToPath(at('tests/fixtures/proposals/calendar.json'));
  for (const id of ['maker.structure-describer', 'maker.transcriber']) {
    const { text, file } = cards.find(card => card.data.id === id);
    const { line, script } = scriptIn(text, 'node --input-type=module -e "');
    assert.ok(line.endsWith('" <the absolute path of your file>'), id);
    const run = node(['--input-type=module', '-e', script, proposal], kit);
    assert.deepEqual([run.status, run.stdout.trim(), run.stderr], [0, '[]', ''], id);
    // The root it is run from is two folders above the card, as the card says.
    assert.match(text, /From the kit's root — two folders above this card —/, id);
    assert.equal(fileURLToPath(new URL('../../', at(`pool/${file}`))), kit);
  }
});

test('the interface writer counts what a reader sees, not how it is stored', () => {
  const { text } = cards.find(card => card.data.id === 'maker.interface-writer');
  const { script } = scriptIn(text, 'node -e "');
  const count = string => node(['-e', script, string]).stdout.trim();
  assert.equal(count('Caf\u00e9'), '4', 'one code point for the accented letter');
  assert.equal(count('Cafe\u0301'), '4', 'two code points for it');
  assert.equal(count('Reservar sala'), '13');
});

test('pool/MODELS.md is dated, says these are suggestions, and has every seat as its card suggests it', () => {
  const text = read('pool/MODELS.md');
  assert.match(text, /^Reviewed: \d{4}-\d{2}-\d{2}$/m);
  assert.match(text, /\bsuggestions?\b/);
  assert.match(text, /nothing in the kit enforces/i);
  const rows = codeRows(text).map(row => row.slice(0, 3).map(unspan));
  assert.deepEqual(rows.map(([id]) => id).sort(), cards.map(card => card.data.id).sort(), 'one row for each card, and no other');
  for (const { data } of cards) {
    assert.deepEqual(rows.find(([id]) => id === data.id), [data.id, data['suggested-model'], data['suggested-effort']], data.id);
  }
});

test('pool/CARD-FORMAT.md lists what the checker allows, and nothing else', () => {
  const text = read('pool/CARD-FORMAT.md');
  const section = name => {
    const from = text.indexOf(`\n## ${name}\n`);
    assert.notEqual(from, -1, `## ${name}`);
    const to = text.indexOf('\n## ', from + 1);
    return text.slice(from, to === -1 ? undefined : to);
  };
  // The header: one row for each key, in the checker's order, with the values the checker allows.
  const rows = codeRows(section('The header'));
  assert.deepEqual(rows.map(([key]) => unspan(key)), CARD_KEYS);
  const allowed = Object.fromEntries(rows.map(([key, values]) => [unspan(key), spans(values)]));
  assert.deepEqual(allowed.shelf, SHELVES);
  assert.deepEqual(allowed['sits-at'], STAGES);
  assert.deepEqual(allowed.presets, SIZES);
  assert.deepEqual(allowed['loaded-with'], LOADED_WITH);
  assert.deepEqual(allowed.engine, ENGINE_FORMS);
  assert.deepEqual(allowed['suggested-model'], MODELS);
  assert.deepEqual(allowed['suggested-effort'], EFFORTS);
  assert.deepEqual(allowed.id, ['<shelf>.<name>']);
  assert.deepEqual(allowed.verified, ['YYYY-MM-DD']);
  // The folders.
  for (const [folder, shelf] of Object.entries(FOLDERS)) assert.ok(text.includes(`\`pool/${folder}/<name>.md\``), `${shelf}: pool/${folder}/`);
  // The body: the sections in order, and the columns of the optional checks.
  const body = section('The body');
  assert.deepEqual(spans(body).filter(span => span.startsWith('## ')), [...JUDGE_SECTIONS, ...SECTIONS].map(name => `## ${name}`));
  const optional = body.split('\n').find(line => line.includes('`## Optional checks`'));
  assert.deepEqual(spans(optional).slice(1, 4), CHECK_COLUMNS);
  assert.match(body, /two to six/);
  // The engine rules, and how a profile writes an engine it turns on.
  const engines = section('Engines');
  for (const spelling of ['engines-on', 'model:openai', 'model:gemini', 'tool:stitch']) assert.ok(spans(engines).includes(spelling), spelling);
  assert.match(engines, /works without its engine/i);
  assert.match(engines, /\bFrame\b/);
  // Suggestions, never instructions.
  assert.match(text, /suggestions, never instructions/);
  // The written forms, and one reading order.
  const forms = section('What a machine checks, and what a reader must');
  for (const form of ['## Name', `| ${CHECK_COLUMNS.join(' | ')} |`]) assert.ok(spans(forms).includes(form), form);
  assert.match(forms, /with or without backticks/);
  assert.ok(spans(forms).includes('\\|'), 'a pipe that is not a row\'s is written \\|');
  assert.match(forms, /up to three spaces/);
  assert.match(forms, /at least as many of the same/);
  assert.match(forms, /A line inside a code fence is never a heading, a core check or a table row/);
  assert.match(forms, /after a paragraph[\s\S]*its own indentation/);
  assert.match(text, /names the seat's card by its absolute path and\s+says to read it first/);
  assert.doesNotMatch(text, /reads it first|neither can say more/);
});

test('every name a card reads, or is blind to, is explained in pool/CARD-FORMAT.md', () => {
  const text = read('pool/CARD-FORMAT.md');
  const from = text.indexOf('\n## The names in `reads` and `never-reads`\n');
  assert.notEqual(from, -1);
  const to = text.indexOf('\n## ', from + 1);
  const names = codeRows(text.slice(from, to === -1 ? undefined : to)).map(([name]) => unspan(name));
  assert.deepEqual(names, [...new Set(names)], 'no name twice');
  for (const { file, data } of cards) {
    for (const key of ['reads', 'never-reads']) {
      for (const name of data[key] ?? []) assert.ok(names.includes(name), `pool/${file} has "${name}" in ${key}; add its row to "The names" in pool/CARD-FORMAT.md`);
    }
  }
});

// ---- no product name anywhere in what the kit ships

const NAMES = [/\bVerbato\b/i, /\bVersa\b/];
const named = text => NAMES.some(name => name.test(text));
const TEXT_FILE = /\.(?:md|mjs|js|cjs|json|css|html|txt)$/;
// Every text file under a path of the kit, the path itself when it is a file; nothing when it is not there yet.
function textFiles(path) {
  if (!existsSync(at(path))) return [];
  if (!path.endsWith('/')) return TEXT_FILE.test(path) ? [path] : [];
  return readdirSync(at(path), { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? textFiles(`${path}${entry.name}/`) : textFiles(`${path}${entry.name}`));
}

test('the product-name check matches whole words only', () => {
  for (const text of ['Verbato', 'verbato', 'VERBATO', 'in Verbato.', 'Versa', 'Versa Studio', '(Versa)']) assert.ok(named(text), text);
  for (const text of ['a conversation', 'universal', 'vice versa', 'versa', 'Versailles', 'conVersa', 'verbatoes', 'verbatim']) assert.ok(!named(text), text);
});

test('no product name appears in what the kit ships', () => {
  const paths = ['pool/', 'templates/', 'skills/', 'kit/', 'reference/', 'scripts/', '.claude-plugin/', 'tests/fixtures/', 'README.md', 'LESSONS.md', 'package.json'];
  const files = paths.flatMap(textFiles);
  const known = [
    'pool/CARD-FORMAT.md', 'pool/makers/visual-designer.md', 'scripts/lib/card.mjs', 'scripts/inpage/accept-inpage.js', 'kit/grey/kit.css',
    'templates/outputs/decision.json', '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'tests/fixtures/proposals/calendar.json',
    'tests/fixtures/prototype/today-default-es.html', 'README.md', 'package.json',
  ];
  for (const expected of known) assert.ok(files.includes(expected), `${expected} is read`);
  // The tests themselves hold the two names, in the pattern above: only their fixtures are read.
  assert.deepEqual(files.filter(file => file.startsWith('tests/') && !file.startsWith('tests/fixtures/')), []);
  for (const file of files) assert.ok(!named(read(file)), `${file} names a product`);
});

// ---- the index (Task 11 writes it)

test('pool/INDEX.md has exactly one row for each card, with its id, job and cast-when', { todo: 'pool/INDEX.md is written with the audience card' }, () => {
  const rows = read('pool/INDEX.md').split('\n').filter(line => /^\|\s*`?(?:maker|judge|audience)\./.test(line)).map(cells);
  assert.deepEqual(rows.map(([id]) => unspan(id)).sort(), cards.map(card => card.data.id).sort());
  for (const { data } of cards) {
    assert.deepEqual(rows.find(([id]) => unspan(id) === data.id).slice(1), [data.job, data['cast-when']], data.id);
  }
});
