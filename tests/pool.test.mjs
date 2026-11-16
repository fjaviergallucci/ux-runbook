import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAcceptance } from '../scripts/accept.mjs';
import {
  CARD_KEYS, CHARACTERISTICS, CHECK_COLUMNS, CRITERION, EFFORTS, ENGINE_FORMS, EVIDENCE, FIELDS, FOLDERS, JUDGE_BLIND, JUDGE_SECTIONS, LOADED_WITH, MODELS, PERSON_FOLDER, PERSON_KEYS,
  PERSON_SECTIONS, PROFILE_CLOSING, PROFILE_FOLDER, PROFILE_KEYS, SECTIONS, SHELVES, traitsOf, validateCard, validatePerson, validateProfile,
} from '../scripts/lib/card.mjs';
import { parse } from '../scripts/lib/frontmatter.mjs';
import { SIZES, STAGES } from '../scripts/lib/state.mjs';
import { CONTAINERS, KEYS, PLACES, ROLES } from '../scripts/lib/walkthrough.mjs';

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
// A judge's header: what every judge is blind to, and the proposals beside them.
const JUDGE_HEADER = Object.freeze({
  ...HEADER, id: 'judge.room-truth', shelf: 'judge', 'never-reads': '[maker-notes, author-map, other-ledgers, other-proposals]',
});

// A card as text: the header as written, a title, and each section in the order given.
const write = (header, sections) =>
  `---\n${Object.entries(header).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n# A sample card\n\nOne line of what the seat is.\n\n${sections.map(([name, text]) => `## ${name}\n\n${text}\n`).join('\n')}`;

// Each sample takes one change to its header and one to its sections, and is checked as its own file, by
// the checker of its kind: a seat's card unless said.
const sample = (header, sections, file, validate = validateCard) => (changeHeader = {}, changeSections = s => s) => {
  const h = { ...header, ...changeHeader };
  for (const key of Object.keys(h)) if (h[key] === undefined) delete h[key];
  return validate(write(h, changeSections(sections.map(pair => [...pair]))), { file });
};
const maker = sample(HEADER, BODY, FILE.maker);
const judge = sample(JUDGE_HEADER, [...CHECKS, ...BODY], FILE.judge);
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
  assert.deepEqual(JUDGE_BLIND, ['maker-notes', 'author-map', 'other-ledgers']);
  for (const list of [CARD_KEYS, SHELVES, FOLDERS, LOADED_WITH, MODELS, EFFORTS, ENGINE_FORMS, SECTIONS, JUDGE_SECTIONS, CHECK_COLUMNS, JUDGE_BLIND]) {
    assert.ok(Object.isFrozen(list));
  }
});

test('a good maker card, a good judge card and a good audience card are valid', () => {
  assert.deepEqual(maker(), []);
  assert.deepEqual(judge(), []);
  assert.deepEqual(audience(), []);
});

test('a card with CRLF line endings is valid', () => {
  for (const [header, sections, file] of [[HEADER, BODY, FILE.maker], [JUDGE_HEADER, [...CHECKS, ...BODY], FILE.judge]]) {
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
  only(validateCard('# A card\n\n## Method\n\nText.\n', { file: FILE.maker }), /^header: a card opens with its header/, /"---"/);
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
  const text = write({ ...JUDGE_HEADER, id: 'judge.room-lister' }, [...CHECKS, ...BODY]);
  only(validateCard(text, { file: FILE.maker }), /^header: "shelf" is judge, but the card is in makers\//);
  assert.deepEqual(validateCard(text, { file: 'judges/room-lister.md' }), []);
  assert.deepEqual(validateCard(text, { file: 'judges\\room-lister.md' }), [], 'a path written with backslashes');
});

test('a card lives in makers/, judges/ or audiences/, under a kebab-case name', () => {
  const text = write(HEADER, BODY);
  for (const file of ['room-lister.md', 'notes/room-lister.md', 'makers/room-lister.txt', 'makers/more/room-lister.md', 'makers/Room_Lister.md', 'makers/room.lister.md', 'pool/makers/room-lister.md', 'makers/.md']) {
    only(validateCard(text, { file }), /^file: /, /makers\/<name>\.md/);
  }
  // The file's fault comes first, and a header that cannot be read is still said.
  const unread = validateCard('# A card\n', { file: 'room-lister.md' });
  assert.equal(unread.length, 2, unread.join('\n'));
  assert.match(unread[0], /^file: /);
  assert.match(unread[1], /^header: a card opens with its header/);
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

test('a judge\'s never-reads holds the three things every judge is blind to', () => {
  const lacks = name => new RegExp(`^header: "never-reads" of a judge must hold "${name}"`);
  // None of the three: one error for each, in their order, each saying the rule.
  const none = judge({ 'never-reads': '[other-proposals]' });
  assert.equal(none.length, 3, none.join('\n'));
  JUDGE_BLIND.forEach((name, i) => assert.match(none[i], lacks(name)));
  for (const error of none) assert.match(error, /every judge is blind to maker-notes, author-map, other-ledgers$/);
  assert.equal(judge({ 'never-reads': '[]' }).length, 3);
  // One missing: one error, naming it.
  for (const name of JUDGE_BLIND) {
    only(judge({ 'never-reads': `[${JUDGE_BLIND.filter(other => other !== name).join(', ')}]` }), lacks(name));
  }
  // All three, in any order, with others beside them.
  assert.deepEqual(judge({ 'never-reads': '[other-ledgers, task-reads, author-map, maker-notes]' }), []);
  assert.deepEqual(judge({ 'never-reads': `[${JUDGE_BLIND.join(', ')}]` }), []);
  // A name is exact.
  only(judge({ 'never-reads': '[maker-note, author-map, other-ledgers]' }), lacks('maker-notes'));
  only(judge({ 'never-reads': '[maker-notes, Author-Map, other-ledgers]' }), lacks('author-map'));
  only(judge({ 'never-reads': '[maker-notes, author-map, "other-ledgers, mine"]' }), lacks('other-ledgers'));
  // Only a judge: a maker or an audience may be blind to nothing, or to other things.
  assert.deepEqual(maker({ 'never-reads': '[]' }), []);
  assert.deepEqual(audience({ 'never-reads': '[intent]' }), []);
  // A list that cannot be read, or is not there, is one fault, not four.
  only(judge({ 'never-reads': 'nothing' }), /^header: "never-reads" must be a list/);
  only(judge({ 'never-reads': 'maker-notes author-map other-ledgers' }), /"never-reads" must be a list/);
  only(judge({ 'never-reads': undefined }), /^header: "never-reads" is missing/);
  // An empty item is said first, then what the list lacks.
  const empty = judge({ 'never-reads': '["", author-map, other-ledgers]' });
  assert.equal(empty.length, 2, empty.join('\n'));
  assert.match(empty[0], /"never-reads" has an empty item/);
  assert.match(empty[1], lacks('maker-notes'));
  // The errors come where the key's other faults come: after "reads", before "engine".
  const order = judge({ reads: '[]', 'never-reads': '[author-map, other-ledgers]', engine: 'none' });
  assert.deepEqual(order.map(error => /^header: "([a-z-]+)"/.exec(error)[1]), ['reads', 'never-reads', 'engine']);
  // A card in judges/ whose shelf is mistyped is a judge by its folder; with no file, by its header alone.
  assert.equal(judge({ shelf: 'judges', 'never-reads': '[]' }).length, 4);
  assert.equal(validateCard(write({ ...JUDGE_HEADER, 'never-reads': '[]' }, [...CHECKS, ...BODY])).length, 3);
  only(validateCard(write({ ...JUDGE_HEADER, shelf: 'desk', 'never-reads': '[]' }, BODY)), /"shelf" must be one of/);
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

// ---- a person card: every rule of it is proven here, on people who exist nowhere else

const PERSON_HEADER = Object.freeze({ id: 'person.desk-cover', profile: 'none', specialty: 'none', evidence: 'guess' });
const PERSON_BODY = Object.freeze([
  ['The moment', 'She is alone at the front desk. The phone is ringing, and the rooms screen has just opened.'],
  ['The job', 'Find the caller a free room before he rings off.'],
  ['What she never does', '- Read a help page with someone waiting.'],
  ['The check', 'Would she know what to press first?'],
]);
const PERSON_FILE = 'persons/desk-cover.md';
const PERSON_ORDER = 'The moment, The job, What she never does, The check';
const person = sample(PERSON_HEADER, PERSON_BODY, PERSON_FILE, validatePerson);
// One of a profession: its profile, a specialty of it, and some of her card heard from her.
const PROFILED = Object.freeze({ profile: 'profile.front-desk', specialty: 'weekend cover', evidence: 'mixed' });

test('the lists a person card is checked against', () => {
  assert.deepEqual(PERSON_KEYS, ['id', 'profile', 'specialty', 'evidence']);
  assert.deepEqual(EVIDENCE, ['fact', 'guess', 'mixed']);
  assert.deepEqual(PERSON_SECTIONS, ['The moment', 'The job', 'What she never does', 'The check']);
  assert.equal(PERSON_FOLDER, 'persons');
  for (const list of [PERSON_KEYS, EVIDENCE, PERSON_SECTIONS]) assert.ok(Object.isFrozen(list));
});

test('a good person card is valid, with a profession or with none', () => {
  assert.deepEqual(person(), []);
  assert.deepEqual(person(PROFILED), []);
  assert.deepEqual(person({ profile: 'profile.front-desk' }), [], 'a profile, and no specialty of it');
});

test('a person card with CRLF line endings is valid', () => {
  for (const header of [PERSON_HEADER, { ...PERSON_HEADER, ...PROFILED }]) {
    const text = write(header, PERSON_BODY).replace(/\n/g, '\r\n');
    assert.ok(text.includes('\r\n'));
    assert.deepEqual(validatePerson(text, { file: PERSON_FILE }), []);
  }
});

test('a person card is valid without a file to check it against', () => {
  assert.deepEqual(validatePerson(write(PERSON_HEADER, PERSON_BODY)), []);
  assert.deepEqual(validatePerson(write(PERSON_HEADER, PERSON_BODY), {}), []);
  // With no file, the id is held to its form alone.
  assert.deepEqual(validatePerson(write({ ...PERSON_HEADER, id: 'person.anyone' }, PERSON_BODY)), []);
  only(validatePerson(write({ ...PERSON_HEADER, id: 'anyone' }, PERSON_BODY)), /^header: "id" must be person\.<name>/);
});

test('a person text that is not a string is the caller\'s mistake, thrown and never reported as a fault of a card', () => {
  assert.throws(() => validatePerson(undefined, { file: PERSON_FILE }), TypeError);
  assert.throws(() => validatePerson({ id: 'person.desk-cover' }), TypeError);
});

test('every header key of a person is required', () => {
  for (const key of PERSON_KEYS) only(person({ [key]: undefined }), /^header: /, new RegExp(`"${key}" is missing$`));
  // One key, one fault: a specialty is not held to a profile that is not there.
  only(person({ ...PROFILED, profile: undefined }), /"profile" is missing/);
});

test('a person has no other key', () => {
  only(person({ age: '34' }), /^header: unknown key "age"$/);
  // A seat's key is not a person's.
  only(person({ shelf: 'audience' }), /^header: unknown key "shelf"$/);
  assert.equal(person({ age: '34', device: 'phone' }).length, 2);
});

test('a person card with no header, or a header that cannot be read, is one error', () => {
  only(validatePerson('# Someone\n\n## The moment\n\nText.\n', { file: PERSON_FILE }), /^header: a person card opens with its header/, /"---"/);
  only(validatePerson('---\n---\n# Someone\n', { file: PERSON_FILE }), /^header: a person card opens with its header/);
  only(validatePerson('---\nid: person.desk-cover\nprofile:\n  nested: yes\n---\n', { file: PERSON_FILE }), /^header: line 3/);
  only(validatePerson('---\nid: person.desk-cover\n', { file: PERSON_FILE }), /^header: line 1/, /never closed/);
  // A key written twice, whether or not the two agree.
  only(validatePerson(write(PERSON_HEADER, PERSON_BODY).replace('evidence: guess\n', 'evidence: guess\nevidence: fact\n'), { file: PERSON_FILE }), /^header: line 6: "evidence" appears twice/);
});

test('a person\'s id is "person" and the name of the file', () => {
  only(person({ id: 'person.desk-covers' }), /^header: "id" names "desk-covers", but the file is persons\/desk-cover\.md: it must be person\.desk-cover$/);
  const FORM = /^header: "id" must be person\.<name>, the name in lower-case words joined by hyphens, as person\.first-timer; it is /;
  const refused = [
    'desk-cover', 'persons.desk-cover', 'audience.desk-cover', 'Person.desk-cover', 'person.Desk_Cover', 'person.desk.cover', 'person.',
    'person.desk-cover.v2', 'person.-desk', 'person.desk-', 'xperson.desk-cover', '"person.desk-cover "', '', 'person-desk-cover',
    'person/desk-cover',
  ];
  for (const id of refused) only(person({ id }), FORM);
  only(person({ id: 'desk-cover' }), FORM, /it is "desk-cover"$/);
  only(person({ id: '[person.desk-cover]' }), FORM, /it is \["person\.desk-cover"\]$/);
  only(person({ id: '42' }), FORM, /it is 42$/);
});

test('a person lives in persons/, under a kebab-case name', () => {
  const text = write(PERSON_HEADER, PERSON_BODY);
  const refused = [
    'desk-cover.md', 'people/desk-cover.md', 'audiences/desk-cover.md', 'persons/desk-cover.txt', 'persons/more/desk-cover.md',
    'persons/Desk_Cover.md', 'persons/desk.cover.md', 'pool/persons/desk-cover.md', 'persons/.md', 'xpersons/desk-cover.md',
    'Persons/desk-cover.md', 'persons/desk-cover.md.txt', 'persons/desk-cover.mdx', 'persons/desk-cover-md', 'persons/desk-coverxmd',
  ];
  for (const file of refused) {
    only(validatePerson(text, { file }), /^file: a person card is persons\/<name>\.md, the name in lower-case words joined by hyphens; this is /, new RegExp(`${JSON.stringify(file).replace(/[.\\]/g, '\\$&')}$`));
  }
  assert.deepEqual(validatePerson(text, { file: 'persons\\desk-cover.md' }), [], 'a path written with backslashes');
  // The file's fault comes first, and the card is still read.
  const both = validatePerson(write({ ...PERSON_HEADER, evidence: 'hunch' }, PERSON_BODY), { file: 'desk-cover.md' });
  assert.equal(both.length, 2, both.join('\n'));
  assert.match(both[0], /^file: /);
  assert.match(both[1], /^header: "evidence"/);
  // And so does a header that cannot be read.
  const unread = validatePerson('# Someone\n', { file: 'desk-cover.md' });
  assert.equal(unread.length, 2, unread.join('\n'));
  assert.match(unread[0], /^file: /);
  assert.match(unread[1], /^header: a person card opens with its header/);
});

test('profile is a profile\'s id, or none', () => {
  for (const profile of ['none', 'profile.front-desk', 'profile.a', 'profile.ward-2']) assert.deepEqual(person({ profile }), [], profile);
  const FORM = /^header: "profile" must be a profile's id, as profile\.<name>, or none; it is /;
  const refused = [
    'front-desk', 'profile.', 'profile.Front_Desk', 'profile.front.desk', 'profiles.front-desk', 'person.front-desk', 'None', '', '"none "',
    'xprofile.front-desk', 'profile.front-desk.md', 'profile.-desk', 'profile-front-desk', 'profile/front-desk',
  ];
  for (const profile of refused) only(person({ profile }), FORM);
  only(person({ profile: 'front-desk' }), FORM, /it is "front-desk"$/);
  only(person({ profile: '[profile.front-desk]' }), FORM, /it is \["profile\.front-desk"\]$/);
  only(person({ profile: '7' }), FORM, /it is 7$/);
});

test('specialty is a name or none, and none when she has no profile', () => {
  const profiled = specialty => person({ profile: 'profile.front-desk', specialty });
  for (const specialty of ['none', 'mornings', 'weekend cover', '"Cover: weekends"']) assert.deepEqual(profiled(specialty), [], specialty);
  const NAME = /^header: "specialty" must be a name, or none; it is /;
  only(profiled(''), NAME, /it is ""$/);
  only(profiled('"   "'), NAME);
  only(profiled('[mornings, weekends]'), NAME, /it is \["mornings","weekends"\]$/);
  only(profiled('2'), NAME, /it is 2$/);
  // With no profile there is nothing to be a specialty of.
  only(person({ specialty: 'mornings' }), /^header: "specialty" must be none when "profile" is none: a person with no profession has no specialty; it is "mornings"$/);
  only(person({ specialty: 'None' }), /"specialty" must be none when "profile" is none/);
  // A specialty that cannot be read is one fault, with or without a profile.
  only(person({ specialty: '' }), NAME);
  only(person({ specialty: '[mornings]' }), NAME);
  // A profile that cannot be read is the one fault: the specialty is not held to it.
  only(person({ profile: 'front-desk', specialty: 'mornings' }), /^header: "profile" must be/);
});

test('evidence is fact, guess or mixed', () => {
  for (const evidence of EVIDENCE) assert.deepEqual(person({ evidence }), [], evidence);
  only(person({ evidence: 'hypothesis' }), /^header: "evidence" must be one of fact, guess, mixed; it is "hypothesis"$/);
  for (const evidence of ['unknown', 'Fact', 'none', '', '[fact]', '"fact, guess"']) only(person({ evidence }), /^header: "evidence" must be one of fact, guess, mixed; it is /);
});

test('every section of a person is required', () => {
  for (const name of PERSON_SECTIONS) only(person({}, without(name)), new RegExp(`^body: "## ${name}" is missing; a section's heading is two hashes`));
});

test('a person\'s sections come in the format\'s order', () => {
  const swap = (a, b) => sections => {
    const out = [...sections];
    [out[a], out[b]] = [out[b], out[a]];
    return out;
  };
  only(person({}, swap(0, 1)), new RegExp(`^body: the sections are out of order: The job, The moment, What she never does, The check; the order is ${PERSON_ORDER}$`));
  only(person({}, swap(1, 2)), /out of order: The moment, What she never does, The job, The check;/);
  only(person({}, swap(2, 3)), /out of order: The moment, The job, The check, What she never does;/);
  // A missing section is one fault, not two: what is left is still in order.
  only(person({}, without('The job')), /is missing/);
});

test('a person has no other section, and none twice', () => {
  const not = name => new RegExp(`^body: "## ${name}" is not a section of a person card \\(${PERSON_ORDER}\\); a section's heading is two hashes`);
  only(person({}, sections => [...sections, ['Traits', 'Careful.']]), not('Traits'));
  only(person({}, sections => [['Who she is', 'Someone.'], ...sections]), not('Who she is'));
  // A seat's section is not a person's, a judge's no more than another.
  only(person({}, sections => [...sections, ['Method', 'Be her.']]), not('Method'));
  only(person({}, sections => [...sections, ['Core checks', '1. One.\n2. Two.']]), not('Core checks'));
  // The names are exact, and the same whoever the person is.
  const he = person({}, sections => sections.map(([name, text]) => [name === 'What she never does' ? 'What he never does' : name, text]));
  assert.equal(he.length, 2, he.join('\n'));
  assert.match(he[0], not('What he never does'));
  assert.match(he[1], /^body: "## What she never does" is missing/);
  only(person({}, setSection('The job', 'Text.\n\n## the job\n\nText.')), not('the job'));
  only(person({}, sections => [...sections.slice(0, 2), ['The moment', 'Again.'], ...sections.slice(2)]), /^body: "## The moment" appears twice$/);
});

test('every section of a person has text under it', () => {
  for (const name of PERSON_SECTIONS) only(person({}, setSection(name, '')), new RegExp(`^body: "## ${name}" has nothing under it$`));
  only(person({}, setSection('The check', '   \n\t\n')), /"## The check" has nothing under it/);
});

test('in a person card too, a heading of another level, or a ## line inside a code fence, is not a section', () => {
  assert.deepEqual(person({}, setSection('The moment', '### Earlier that day\n\nText.\n\n```\n## Not a section\n```')), []);
  only(person({}, setSection('The moment', '```\n## Inside\n```\n\n## Outside\n\nText.')), /"## Outside" is not a section of a person card/);
});

test('every fault of a person card is reported, the header first', () => {
  const errors = person(
    { id: 'person.someone-else', specialty: 'mornings', evidence: 'hunch', age: '34' },
    sections => [...without('The job')(sections), ['Traits', 'Careful.']],
  );
  assert.equal(errors.length, 6, errors.join('\n'));
  assert.match(errors[0], /^header: "id" names "someone-else"/);
  assert.match(errors[1], /^header: "specialty" must be none/);
  assert.match(errors[2], /^header: "evidence"/);
  assert.match(errors[3], /^header: unknown key "age"/);
  assert.match(errors[4], /^body: "## Traits" is not a section of a person card/);
  assert.match(errors[5], /^body: "## The job" is missing/);
});

// ---- the kit's own pool

// A Markdown table row as its cells; a bar written \| stays in its cell.
const cells = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));
// The rows of the tables in a text, without header and dashes rows: those whose first cell is a code span.
const codeRows = text => text.split('\n').filter(line => /^\|\s*`/.test(line)).map(cells);
const spans = text => [...text.matchAll(/`([^`]+)`/g)].map(([, span]) => span);
const unspan = cell => cell.replace(/^`(.*)`$/, '$1');

// Every card in one folder of pool/: its path under pool/, its text, its header. A folder not there yet holds none.
const filesOf = folder =>
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
        // The checker says why, in the tests below.
      }
      return { file, text, data };
    });
// Every seat of the kit, shelf by shelf, and every person.
const cards = Object.keys(FOLDERS).flatMap(filesOf);
const persons = filesOf(PERSON_FOLDER);
// One `## ` section of a text, from its heading to the next one or to the end.
const sectionOf = (text, name) => {
  const from = text.indexOf(`\n## ${name}\n`);
  assert.notEqual(from, -1, `## ${name}`);
  const to = text.indexOf('\n## ', from + 1);
  return text.slice(from, to === -1 ? undefined : to);
};

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

// The plan's table for the judges, as the controller ruled it: the stages, what each is loaded with, the
// engine, the suggested model and effort.
const JUDGES = {
  'judge.usability': [['context', 'structure', 'detail', 'acceptance'], 'none', 'own', 'opus', 'high'],
  'judge.truth': [['structure', 'detail', 'look', 'acceptance'], 'none', 'own', 'opus', 'high'],
  'judge.words': [['detail', 'acceptance'], 'none', 'own', 'opus', 'high'],
  'judge.accessibility': [['detail', 'look', 'acceptance'], 'none', 'own', 'opus', 'high'],
  'judge.visual-craft': [['context', 'look', 'acceptance'], 'none', 'skill:design-audit:design-audit', 'opus', 'high'],
  'judge.system-fidelity': [['look', 'acceptance'], 'none', 'own', 'opus', 'medium'],
  'judge.profile': [['intent', 'structure', 'detail', 'look', 'acceptance'], 'profile', 'own', 'opus', 'high'],
  'judge.cold-implementer': [['handoff'], 'none', 'own', 'opus', 'high'],
};
const judges = cards.filter(card => card.file.startsWith('judges/'));

test('the eight judge cards hold the decisions they were written to', () => {
  assert.deepEqual(judges.map(card => card.data.id).sort(), Object.keys(JUDGES).sort());
  for (const { data } of judges) {
    const [stages, loaded, engine, model, effort] = JUDGES[data.id];
    assert.deepEqual(
      [data['sits-at'], data['loaded-with'], data.engine, data['suggested-model'], data['suggested-effort']],
      [stages, loaded, engine, model, effort],
      data.id,
    );
  }
});

test('every judge is blind to the makers\' notes, the author map and the other judges\' ledgers', () => {
  assert.ok(judges.length > 0, 'the pool holds judges');
  for (const { file, data } of judges) {
    for (const name of JUDGE_BLIND) assert.ok(data['never-reads']?.includes(name), `pool/${file} must have "${name}" in never-reads`);
  }
});

// The caveat of design § 11, as every task read opens with it.
const CAVEAT = 'A simulated person agrees too easily and understands what it was told to understand; this is a check on the makers\' blind spots, never evidence about real people; only the ranking and the stuck points carry information.';
// What a blind pass answers for each task, in the design's order, and what a public page is asked instead.
const ANSWERS = ['What do I think this is?', 'What do I do first?', 'Where do I hesitate, and at what?', 'What did I expect to happen?', 'Did I finish?', 'What would make me leave?'];
const PUBLIC = ['**Stop.**', '**Understand.**', '**Click.**'];
// A text as one line, so that a sentence is found however it is wrapped.
const flat = text => text.replace(/\s+/g, ' ');
// Each of `parts` is in the text, and they come in this order.
const inOrder = (text, parts, message) => {
  const places = parts.map(part => text.indexOf(part));
  assert.deepEqual(parts.filter((_, i) => places[i] === -1), [], `${message}: not there`);
  assert.deepEqual(places, [...places].sort((a, b) => a - b), `${message}: out of order`);
};

test('the task reader is the one audience card, and holds the decisions it was written to', () => {
  const audiences = cards.filter(card => card.file.startsWith('audiences/'));
  assert.deepEqual(audiences.map(card => card.data.id), ['audience.task-reader']);
  const [{ data }] = audiences;
  assert.deepEqual(
    [data['sits-at'], data.presets, data['loaded-with'], data.engine, data['suggested-model'], data['suggested-effort'], data.verified],
    [['structure', 'detail', 'look', 'acceptance'], ['surface', 'flow', 'system'], 'person', 'own', 'opus', 'medium', '2026-11-14'],
  );
});

test('the task reader is handed a person, her profile\'s traits and pictures, and nothing that says what the design means to do', () => {
  const { data, text } = cards.find(card => card.data.id === 'audience.task-reader');
  // The whole of what it may open: her card, what is true of her profession, and the screens as pictures.
  assert.deepEqual(data.reads, ['brief', 'person', 'profile-traits', 'pictures']);
  // The whole of its blind list, in any order: the intent the tasks came from, and each folder that holds it;
  // the profile, for the criteria in it; the makers' reasoning, in each place it is written; the page's code;
  // who made what, and what others found.
  const blind = [
    'intent', 'package', 'handoff-folder', 'build', 'profile', 'describers-brief', 'maker-notes', 'states-and-rules', 'strings', 'prototype',
    'author-map', 'other-ledgers', 'task-reads',
  ];
  assert.deepEqual([...data['never-reads']].sort(), [...blind].sort());
  assert.deepEqual(data.reads.filter(name => data['never-reads'].includes(name)), [], 'nothing is both read and never read');
  // A profile's traits are the profile without what a judge holds a design to (ruling R131).
  const names = Object.fromEntries(
    codeRows(sectionOf(read('pool/CARD-FORMAT.md'), 'The names in `reads` and `never-reads`')).map(([name, what]) => [unspan(name), what]),
  );
  assert.ok(names['profile-traits'], 'pool/CARD-FORMAT.md has a row for "profile-traits"');
  assert.match(names['profile-traits'], /every "So the interface must" line taken out/);
  assert.match(names['profile-traits'], /what an audience is handed/);
  const method = flat(sectionOf(text, 'Method'));
  assert.match(method, /never the intent the tasks came from/);
  assert.match(method, /handed its traits and no more/);
  assert.match(method, /What an interface should do about them is not hers to know/);
  assert.match(method, /a person cannot find a control by reading markup/);
  // A deferred minor of Task 11: three sentences a cut for length once removed from the method, pinned so that it cannot happen again.
  assert.ok(method.includes('The less you know of what the design means to do, the better.'), 'N3');
  assert.ok(method.includes('When your brief\'s product is another, keep her hands, her hurry, what she knows and what she refuses, and change only the setting.'), 'N2');
  assert.ok(method.includes('A task that needs any of it is not finished. Where she would stop, you stop: never work a step out with patience she lacks.'), 'N1');
});

test('the task reader answers six things for each task, ranks with the size of each gap, and has the other reading for a public page', () => {
  const { text } = cards.find(card => card.data.id === 'audience.task-reader');
  const method = sectionOf(text, 'Method');
  inOrder(method, ANSWERS, 'the six answers');
  assert.match(flat(method), /Every answer points at something on the screen/);
  // The tasks are the brief's, whatever job her own card gives her.
  assert.match(flat(method), /The tasks are the brief's; her job says what "done" means to her/);
  // No hesitation at all is where a simulated reader agrees too easily: the answer is sent back to the screen.
  assert.match(flat(method), /name the nearest thing she could have pressed instead, and what on the screen told the two apart/);
  assert.match(flat(method), /each task, on each option, in her language/);
  inOrder(method, ['*clear*', '*slight*', '*tie*'], 'the size of a gap');
  assert.match(flat(method), /with the size of each gap, .* one reason/);
  assert.match(flat(method), /"no ranking: one option"/);
  assert.match(flat(method), /a finding for the founder, never an average/);
  // The other reading is a part of the method, since a card has no fifth section.
  const page = method.indexOf('\n### On a public page\n');
  assert.notEqual(page, -1, '### On a public page');
  inOrder(method.slice(page), PUBLIC, 'stop, understand, click');
  assert.ok(method.indexOf(ANSWERS.at(-1)) < page, 'the task read comes first');
});

test('the task reader opens every read with the caveat, word for word, and gives way to a real person', () => {
  const { text } = cards.find(card => card.data.id === 'audience.task-reader');
  const method = sectionOf(text, 'Method');
  const output = sectionOf(text, 'Output');
  // The sentence of the design, whole and on a line of its own, so that it is copied and never retold.
  assert.equal(text.split('\n').filter(line => line.trim() === `> ${CAVEAT}`).length, 1, 'the caveat, verbatim, once');
  assert.ok(method.includes(CAVEAT), 'the caveat is in the method');
  assert.match(flat(method), /at the top of every read, word for word/);
  assert.match(flat(output), /the caveat, at the top, word for word/);
  assert.match(flat(text), /a real person's read, whenever there is one, takes this seat and outranks yours/);
  // What it returns: the kit's template for a task read, which Task 12 writes.
  assert.deepEqual(pathsUnder(['templates'], output), ['templates/outputs/TASK-READ.md']);
  for (const held of ['six answers', 'stuck points', 'ranking']) assert.ok(output.includes(held), `the read holds the ${held}`);
});

// The five people the kit ships, by their files.
const GENERIC = ['daily-expert', 'first-timer', 'hurried-on-a-phone', 'keyboard-user', 'second-language-reader'];

test('every person in the pool keeps the person format', () => {
  assert.deepEqual(persons.map(({ file }) => file), GENERIC.map(name => `${PERSON_FOLDER}/${name}.md`));
  for (const { file, text } of persons) assert.deepEqual(validatePerson(text, { file }), [], `pool/${file}`);
});

test('the kit\'s five persons are archetypes with no profession, and each says once that she is a guess', () => {
  assert.equal(persons.length, GENERIC.length);
  for (const { file, text, data } of persons) {
    assert.deepEqual([data.profile, data.specialty, data.evidence], ['none', 'none', 'guess'], file);
    const said = text.slice(0, text.indexOf('\n## ')).split('\n').filter(line => /\barchetype\b/i.test(line));
    assert.equal(said.length, 1, `${file} says in one line, before its sections, that she is an archetype`);
    assert.match(said[0], /\bguess\b/, file);
  }
});

test('each of the five is someone in a moment at the clinic\'s front desk, with one question to ask of a screen', () => {
  assert.equal(persons.length, GENERIC.length);
  for (const { file, text } of persons) {
    const moment = sectionOf(text, 'The moment');
    assert.doesNotMatch(moment, /^\s*(?:[-*+]|\d+[.)])\s|^\s*\|/m, `${file}: the moment is a scene, never a list of traits`);
    assert.match(moment, /\bclinic\b/, `${file}: the scene is in the kit's example product`);
    assert.match(moment, /\brooms?\b/, `${file}: the scene is in the kit's example product`);
    assert.equal(sectionOf(text, 'The check').match(/\?/g)?.length, 1, `${file}: the check is one question`);
  }
});

// G1 of the final review: the one seat a sub-agent sits in whose engine sends the brief off the machine is told, by its brief,
// whether its tool is on, and calls no outside tool unless it is told so.
test('the screen generator calls its tool only when its brief says it is on: a brief that does not say is off', () => {
  const { text } = cards.find(card => card.data.id === 'maker.screen-generator');
  const head = flat(text.slice(0, text.indexOf('\n## ')));
  assert.ok(head.includes('**Your brief says whether the tool is on. If it does not say, it is off.**'), 'the card says it before its method');
  assert.match(head, /When it is off, you call no outside tool, whatever tools your session lists: you work as "Without the tool" says/);
  assert.match(head, /you never read that profile/);
  assert.doesNotMatch(head, /the seat is off/, 'the tool is off; the seat still sits');
  assert.match(flat(sectionOf(text, 'Method')), /\*\*Read your brief, and only that\.\*\* It says whether the tool is on\./);
  const without = flat(sectionOf(text, 'Method').split('### Without the tool')[1]);
  assert.match(without, /This is the case whenever your brief says the tool is off, or says nothing of it: you call no outside tool, no screen generator and no model, and nothing of the brief leaves the machine/);
  assert.match(flat(sectionOf(text, 'Never')), /Never call the tool, or any outside tool, unless your brief says the tool is on: a tool your session lists is not one the project turned on/);
  // Its engine is the one setup turns on only on his yes, and the brief that tells it is a maker's brief.
  assert.equal(cards.find(card => card.data.id === 'maker.screen-generator').data.engine, 'tool:stitch');
  assert.match(flat(read('templates/briefs/maker.md')), /\{A screen generator, from `engines-on`: "Your tool is on in this project", or "Your tool is not turned on in this project: work as your card's 'Without the tool' says, and call no outside tool"\.\}/);
});

test('the outside describer never mentions a key', () => {
  const { text } = cards.find(card => card.data.id === 'maker.outside-describer');
  assert.doesNotMatch(text, /\bkeys?\b|secret|credential|password/i);
});

test('the outside describer runs the script for a proposal at Structure, and with --text at Look, where the answer is a concept', () => {
  const { text } = cards.find(card => card.data.id === 'maker.outside-describer');
  const commands = text.split('\n').map(line => line.trim()).filter(line => line.startsWith('node <kit root>/scripts/describe.mjs'));
  assert.equal(commands.length, 2, 'one command at Structure, one at Look');
  const [structure, look] = commands;
  assert.equal(structure, 'node <kit root>/scripts/describe.mjs --provider <openai|gemini> --model <id> --brief <the brief> --out <proposals folder>/<name>.json --profile <PROFILE.md>');
  // G19 of the final review: at Look the answer is the page the picture script opens, under the one name Look's pages give it.
  assert.equal(look, 'node <kit root>/scripts/describe.mjs --text --provider <openai|gemini> --model <id> --brief <the fresh brief> --out <fresh pass folder>/<name>.html --profile <PROFILE.md>');
  const fresh = readFileSync(at('skills/look/references/fresh.md'), 'utf8');
  assert.ok(fresh.includes('--out <package>/06-look/fresh/<name>.html') && fresh.includes('node <kit root>/scripts/shots.mjs <package>/06-look/fresh/<name>.html'), 'fresh.md writes and pictures the same file');
  assert.ok(readFileSync(at('skills/look/references/seats.md'), 'utf8').includes('`<package>/06-look/fresh/<name>.html`: the answer, whole, as it came.'));
  // Each is a form the script's own usage gives, flag for flag, and neither names a stand-in address.
  const help = spawnSync(process.execPath, [fileURLToPath(at('scripts/describe.mjs')), '--help'], { encoding: 'utf8' }).stdout;
  const usage = flat(help.slice(0, help.indexOf('\n\n')));
  const flagsOf = command => command.match(/--[a-z-]+/g);
  const forms = usage.split('node scripts/describe.mjs').slice(1).map(form => flagsOf(form.replace(/\[[^\]]*\]/g, '')));
  assert.deepEqual(forms, [flagsOf(structure), flagsOf(look)]);
  // The Look paragraph says why, and no longer leaves the concept in a raw file.
  const from = text.indexOf('**At Look**');
  const atLook = flat(text.slice(from, text.indexOf('**Without the engine**')));
  assert.ok(from !== -1 && text.indexOf(look) > from, 'the --text command is in the Look paragraph');
  assert.match(atLook, /not a proposal for the board, so the script is run with `--text`/);
  assert.match(atLook, /looks for no proposal/);
  assert.match(atLook, /`\.txt`, `\.md` or `\.html`/);
  assert.doesNotMatch(atLook, /raw\.txt/);
  assert.match(atLook, /never mended, and never handed off/);
});

// Every path under one of `folders` that a text names, anywhere in it, a command in a code fence included.
const pathsUnder = (folders, text) => [...text.matchAll(new RegExp(`(?<![\\w-])(?:${folders.join('|')})/[\\w./-]*\\.[a-z]+\\b`, 'g'))].map(([path]) => path);
// The folders of the kit the pool was written beside, and those later tasks wrote: all of them are there now.
const LIVE = ['scripts', 'kit', 'pool', 'tests'];
const LATER = ['templates', 'skills', 'reference'];
// The pool's own texts: its three documents, every card whatever its shelf, and every person.
const poolTexts = () =>
  ['CARD-FORMAT.md', 'MODELS.md', 'INDEX.md', ...[...cards, ...persons].map(card => card.file)].map(file => [`pool/${file}`, read(`pool/${file}`)]);

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

// Live for all three folders, and each of the three is written: `reference/` was the last, with Task 18. A card that
// names a skill's file or a reference document names one that exists, or this fails.
test('a template, a skill or a reference file named in the pool exists', () => {
  for (const folder of LATER) assert.ok(existsSync(at(`${folder}/`)), `${folder}/ is in the kit`);
  for (const path of ['skills/handoff/SKILL.md', 'skills/acceptance/SKILL.md', 'reference/IMPLEMENTER-GUIDE.md', 'reference/ANTI-PATTERNS.md']) assert.ok(existsSync(at(path)), path);
  const seen = new Set();
  for (const [file, text] of poolTexts()) {
    for (const path of pathsUnder(LATER, text)) {
      seen.add(path);
      assert.ok(existsSync(at(path)), `${file} names ${path}, which is not in the kit`);
    }
  }
  // What the seats return, and the files three makers write, each in the shape of its template.
  const named = [
    'templates/outputs/LEDGER.md', 'templates/outputs/TASK-READ.md', 'templates/package/05-detail/DETAIL.md', 'templates/package/05-detail/states.md',
    'templates/package/05-detail/strings.json', 'templates/package/06-look/LOOK.md',
  ];
  for (const path of named) assert.ok(seen.has(path), `${path} is named, so the check reads what it should`);
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

test('a card that sums up the walkthrough format names every key, role, container and area of it, and no other', () => {
  const format = new Set([...KEYS.proposal, ...KEYS.screen, ...KEYS.role, ...KEYS.container, ...ROLES, ...CONTAINERS, ...PLACES, 'screen', 'dialog']);
  const summaries = cards.map(card => [card.data.id, summaryOf(card.text)]).filter(([, summary]) => summary !== null);
  assert.deepEqual(summaries.map(([id]) => id).sort(), ['maker.structure-describer', 'maker.transcriber']);
  for (const [id, summary] of summaries) {
    const named = new Set(spans(summary));
    assert.deepEqual([...format].filter(word => !named.has(word)), [], `${id} leaves out a word of the format`);
    assert.deepEqual([...named].filter(word => !format.has(word)), [], `${id} names a word the format lacks`);
    // An expansion is the one container that must have a label.
    assert.match(summary, /An expansion always has a\s+`label`/, id);
    assert.match(summary, /A region or a group may have a\s+`label`/, id);
    // R194 of the board change: the one key that says where a region is, its four words in the format's order, and
    // where it may be written.
    const flat = summary.replace(/\s+/g, ' ');
    assert.match(flat, /A region that is a direct item of a screen may say in `place` which area of the page it is: `navigation`, `bar`, `main` or `beside`\./, id);
    assert.deepEqual(spans(summary).filter(word => PLACES.includes(word)), PLACES, id);
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

test('the interface writer and the words judge count what a reader sees, not how it is stored', () => {
  for (const id of ['maker.interface-writer', 'judge.words']) {
    const card = cards.find(({ data }) => data.id === id);
    assert.ok(card, `${id} is in the pool`);
    const { script } = scriptIn(card.text, 'node -e "');
    const count = string => node(['-e', script, string]).stdout.trim();
    assert.equal(count('Caf\u00e9'), '4', `${id}: one code point for the accented letter`);
    assert.equal(count('Cafe\u0301'), '4', `${id}: two code points for it`);
    assert.equal(count('Reservar sala'), '13', id);
  }
});

test('the checks file the accessibility judge shows is one accept.mjs takes', () => {
  const lines = cards.find(card => card.data.id === 'judge.accessibility').text.split('\n');
  const from = lines.findIndex(line => line.trim() === '```json');
  assert.notEqual(from, -1, 'the card shows a checks file in a json fence');
  const to = lines.findIndex((line, i) => i > from && line.trim() === '```');
  assert.ok(to - from - 1 <= 6, 'six lines at most');
  const example = JSON.parse(lines.slice(from + 1, to).join('\n'));
  assert.deepEqual(validateAcceptance(example), []);
  // The two measured checks the card's table names, one of each.
  assert.deepEqual(example.checks.map(check => check.type), ['contrast', 'min-size']);
  // A check that is not valid is caught: the example is read, not passed over.
  delete example.checks[0].criterion;
  assert.equal(validateAcceptance(example).length, 1);
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
  const section = name => sectionOf(text, name);
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
  // What every judge keeps: the three names the checker asks for, and which of the rules is a machine's.
  const kept = body.indexOf('\n### What every judge keeps\n');
  assert.notEqual(kept, -1, '### What every judge keeps');
  const rules = body.slice(kept);
  assert.deepEqual(spans(rules.split('\n').find(line => line.startsWith('1. '))), ['never-reads', ...JUDGE_BLIND]);
  assert.equal(rules.split('\n').filter(line => /^\d+\. /.test(line)).length, 5);
  assert.match(rules, /opens with the job before the craft/);
  assert.match(rules, /an optional check only when it sees the trigger in what it\s+was handed/);
  assert.match(rules, /never fixes, redesigns or approves/);
  assert.match(rules, /The checker holds a judge to the first of these\. The other four are a reader's to check\./);
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
  assert.match(forms, /to the three names it is blind to/);
  assert.ok(spans(forms).includes('\\|'), 'a pipe that is not a row\'s is written \\|');
  assert.match(forms, /up to three spaces/);
  assert.match(forms, /at least as many of the same/);
  assert.match(forms, /A line inside a code fence is never a heading, a core check or a table row/);
  assert.match(forms, /after a paragraph[\s\S]*its own indentation/);
  assert.match(text, /names the seat's card by its absolute path and\s+says to read it first/);
  assert.doesNotMatch(text, /reads it first|neither can say more/);
});

test('every name a card reads, or is blind to, is explained in pool/CARD-FORMAT.md', () => {
  const names = codeRows(sectionOf(read('pool/CARD-FORMAT.md'), 'The names in `reads` and `never-reads`')).map(([name]) => unspan(name));
  assert.deepEqual(names, [...new Set(names)], 'no name twice');
  for (const { file, data } of cards) {
    for (const key of ['reads', 'never-reads']) {
      for (const name of data[key] ?? []) assert.ok(names.includes(name), `pool/${file} has "${name}" in ${key}; add its row to "The names" in pool/CARD-FORMAT.md`);
    }
  }
});

test('pool/CARD-FORMAT.md says of a person card what the checker holds it to, and nothing else', () => {
  const format = read('pool/CARD-FORMAT.md');
  const text = sectionOf(format, 'The person card');
  // Where she lives, and what checks her.
  assert.ok(spans(text).includes(`pool/${PERSON_FOLDER}/<name>.md`));
  assert.ok(spans(text).includes('validatePerson(text, { file })'));
  assert.ok(sectionOf(format, 'Where a card lives').includes(`\`pool/${PERSON_FOLDER}/<name>.md\``), 'a person is listed where the cards are');
  // The header: one row for each key, in the checker's order, with the values the checker allows.
  const rows = codeRows(text);
  assert.deepEqual(rows.map(([key]) => unspan(key)), PERSON_KEYS);
  const allowed = Object.fromEntries(rows.map(([key, values]) => [unspan(key), spans(values)]));
  assert.deepEqual(allowed, { id: ['person.<name>'], profile: ['profile.<name>', 'none'], specialty: ['none'], evidence: EVIDENCE });
  const says = Object.fromEntries(rows.map(([key, , what]) => [unspan(key), what]));
  assert.match(says.specialty, /always when `profile` is `none`/);
  // What each value of `evidence` means.
  for (const value of EVIDENCE) assert.match(says.evidence, new RegExp(`\`${value}\`: `), value);
  assert.match(text, /Every key is required, and no other is allowed/);
  // The body: the four sections, in order, and no other.
  assert.deepEqual(spans(text).filter(span => span.startsWith('## ')), PERSON_SECTIONS.map(name => `## ${name}`));
  assert.match(text, /under these exact names, in this order, each with text under it/);
  assert.match(text, /no other `##` section/);
  // What is a reader's to check: the old quality bar, kept on the person.
  assert.match(flat(text), /does not force a design decision you would not have made anyway, it is not finished/);
});

// ---- no product name anywhere in what the kit ships

const NAMES = [/\bVerbato\b/i, /\bVersa\b/];
const named = text => NAMES.some(name => name.test(text));
const TEXT_FILE = /\.(?:md|mjs|js|cjs|json|css|html|txt|yaml|yml)$/;
// What a run of the evaluation suite leaves behind: it is not shipped, and git ignores it.
const NOT_SHIPPED = Object.freeze(['evals/results/']);
// Every text file under a path of the kit, the path itself when it is a file; nothing when it is not there yet.
function textFiles(path) {
  if (!existsSync(at(path)) || NOT_SHIPPED.includes(path)) return [];
  if (!path.endsWith('/')) return TEXT_FILE.test(path) ? [path] : [];
  return readdirSync(at(path), { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? textFiles(`${path}${entry.name}/`) : textFiles(`${path}${entry.name}`));
}

test('the product-name check matches whole words only', () => {
  for (const text of ['Verbato', 'verbato', 'VERBATO', 'in Verbato.', 'Versa', 'Versa Studio', '(Versa)']) assert.ok(named(text), text);
  for (const text of ['a conversation', 'universal', 'vice versa', 'versa', 'Versailles', 'conVersa', 'verbatoes', 'verbatim']) assert.ok(!named(text), text);
});

test('no product name appears in what the kit ships', () => {
  const paths = ['pool/', 'templates/', 'skills/', 'kit/', 'reference/', 'scripts/', '.claude-plugin/', 'tests/fixtures/', 'evals/', 'README.md', 'LESSONS.md', 'package.json'];
  const files = paths.flatMap(textFiles);
  const known = [
    'pool/CARD-FORMAT.md', 'pool/INDEX.md', 'pool/makers/visual-designer.md', 'pool/audiences/task-reader.md', 'pool/persons/first-timer.md',
    'scripts/lib/card.mjs', 'scripts/inpage/accept-inpage.js', 'kit/grey/kit.css',
    'templates/outputs/decision.json', 'templates/outputs/LEDGER.md', 'templates/package/00-frame.md', 'templates/package/04-structure/BRIEF.md',
    'templates/package/05-detail/strings.json', 'templates/people/PROFILE-CARD.md', 'templates/project/PROFILE.md', 'templates/briefs/judge.md',
    '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'tests/fixtures/proposals/calendar.json',
    'tests/fixtures/prototype/today-default-es.html', 'README.md', 'LESSONS.md', 'package.json',
    // The evaluation suite: a case's prompt, its declaration, a grader, and files of its fixture.
    'evals/brief-has-no-design/prompt.md', 'evals/brief-has-no-design/case.yaml', 'evals/brief-has-no-design/graders/criteria.md',
    'evals/no-pick-without-the-founder/fixture/design/PROFILE.md', 'evals/no-pick-without-the-founder/fixture/design/today/04-structure/board/A.json',
    'evals/cold-implementer-finds-the-gap/fixture/design/today/07-handoff/prototype/today-booked-en.html',
  ];
  assert.deepEqual(files.filter(file => file.startsWith('evals/results/')), [], 'what a run leaves is not read');
  for (const expected of known) assert.ok(files.includes(expected), `${expected} is read`);
  // The tests themselves hold the two names, in the pattern above: only their fixtures are read.
  assert.deepEqual(files.filter(file => file.startsWith('tests/') && !file.startsWith('tests/fixtures/')), []);
  for (const file of files) assert.ok(!named(read(file)), `${file} names a product`);
});

// ---- the index: what Cast reads in place of the cards

// The tables of a text, as rows of cells: a header row, its dashes, then the rows.
const tableRows = text => text.split('\n').filter(line => line.startsWith('|')).map(cells);
const isDashes = row => row.every(cell => /^:?-+:?$/.test(cell));
const indexParts = () => {
  const text = read('pool/INDEX.md');
  const people = text.indexOf('\n## People\n');
  assert.notEqual(people, -1, '## People');
  return { seats: text.slice(0, people), people: sectionOf(text, 'People') };
};

test('pool/INDEX.md has exactly one row for each card, with its id, job and cast-when, in shelf order', () => {
  const [head, dashes, ...rows] = tableRows(indexParts().seats);
  assert.deepEqual(head, ['id', 'job', 'cast-when']);
  assert.ok(isDashes(dashes), 'a line of dashes under the header row');
  assert.deepEqual(rows.map(([id]) => unspan(id)).sort(), cards.map(card => card.data.id).sort(), 'one row for each card, and no row without a card');
  for (const { data } of cards) {
    assert.deepEqual(rows.find(([id]) => unspan(id) === data.id).slice(1), [data.job, data['cast-when']], data.id);
  }
  // The makers, then the judges, then the audiences.
  const shelves = rows.map(([id]) => SHELVES.indexOf(unspan(id).split('.')[0]));
  assert.deepEqual(shelves, [...shelves].sort((a, b) => a - b), 'in shelf order');
});

test('pool/INDEX.md lists the people too: exactly one row for each person, with one line of her moment', () => {
  const [head, dashes, ...rows] = tableRows(indexParts().people);
  assert.deepEqual(head, ['id', 'the moment']);
  assert.ok(isDashes(dashes), 'a line of dashes under the header row');
  assert.deepEqual(rows.map(([id]) => unspan(id)).sort(), persons.map(person => person.data.id).sort(), 'one row for each person, and no row without a file');
  for (const [id, moment, ...more] of rows) {
    assert.deepEqual(more, [], `${id} has two cells`);
    assert.match(moment, /\S.*[.?]$/, `${id} has a line for her moment`);
  }
});

// ---- a profession's profile: every rule of it is proven here, on a profession that exists nowhere else (R162)

const PROFILE_FILE = 'profiles/front-desk.md';
// What is said of a block of a characteristic that opens with no label, the block named by the line it opens at (S4).
const noLabel = line => `line ${line} opens a block with none of the four labels ("What is true:", "Who it does not hold for:", "Evidence:", "So the interface must:"): a field is one block, from its label to the next blank line, and what stands apart from it would stay in an audience's copy`;
// The four fields of one characteristic, each a block of its own.
const TRAITS = 'What is true: She stands at a counter, the phone at her ear.\n\nWho it does not hold for: The coordinator in a back office.\n\nEvidence: guess\n';
const fieldsOf = (must = 'Be read at arm\'s length, standing.\nNever show a full name.') => `${TRAITS}\nSo the interface must: ${must}\n`;
const DESCRIBED = 'The person who runs the front desk of a small clinic. Every characteristic below is a guess.\n';
const EXPLAINED = [
  'A profile is what is true of a profession. Every characteristic\nhas four fields, and the fourth is what a profile judge holds a design to.\n',
  'No trait is invented. When an audience gets stuck where no fourth field predicted, a\ncharacteristic is missing here, and it is added.\n',
];
const SPECIALTIES = 'One `###` section for each specialty, each characteristic under a `####` heading with its four fields.\n\nNone yet.\n';
const OPTIONAL = 'Those listed here are not defined yet.\n\n- **Physical conditions** — gloves, a dim room, eyesight.\n';
const profileSections = (characteristic = fieldsOf()) => [...CHARACTERISTICS.map(name => [name, characteristic]), ['Specialties', SPECIALTIES], ['Optional characteristics', OPTIONAL]];
// A profile as text: its header, its title, what its opening says, and each section in the order given.
const profileText = ({ id = 'profile.front-desk', opening = [DESCRIBED, ...EXPLAINED], sections = profileSections() } = {}) =>
  `---\nid: ${id}\n---\n\n# Front desk\n\n${opening.join('\n')}\n${sections.map(([name, text]) => `## ${name}\n\n${text}`).join('\n')}`;
const profile = (change = {}) => validateProfile(profileText(change), { file: PROFILE_FILE });
const withSection = (name, text) => profileSections().map(([n, t]) => [n, n === name ? text : t]);
// The number of the one line of a text that holds these words, counted from 1 as an editor counts.
const lineOf = (text, words) => {
  const at = text.split('\n').flatMap((line, i) => (line.includes(words) ? [i + 1] : []));
  assert.equal(at.length, 1, `one line holds ${JSON.stringify(words)}`);
  return at[0];
};
// The faults of a profile text, checked as the file it is.
const faultsIn = text => validateProfile(text, { file: PROFILE_FILE });
// No fault quotes the profile: none holds a run of words of any line under a heading of it (S13).
const quotesNothing = (faults, text) => {
  const body = text.slice(text.indexOf('\n## '));
  for (const line of body.split('\n').map(line => line.trim()).filter(line => line !== '' && !line.startsWith('#'))) {
    const said = line.replace(/^[^:]*: ?/, '').replace(/^[-*] /, '');
    if (said.length < 12) continue;
    for (const fault of faults) assert.ok(!fault.includes(said) && !fault.includes(said.slice(0, 24)), `${fault}\nquotes: ${line}`);
  }
};

test('the lists a profession\'s profile is checked against', () => {
  assert.equal(PROFILE_FOLDER, 'profiles');
  assert.deepEqual(PROFILE_KEYS, ['id']);
  assert.deepEqual(CHARACTERISTICS, ['Scope', 'The work', 'Technological familiarity', 'Usage context', 'Time and attention', 'Error tolerance and stakes', 'Domain vocabulary']);
  assert.deepEqual(PROFILE_CLOSING, ['Specialties', 'Optional characteristics']);
  assert.deepEqual(FIELDS, ['What is true', 'Who it does not hold for', 'Evidence', 'So the interface must']);
  assert.equal(CRITERION, 'So the interface must');
  for (const list of [PROFILE_KEYS, CHARACTERISTICS, PROFILE_CLOSING, FIELDS]) assert.ok(Object.isFrozen(list));
});

test('a good profile is valid: its id the file\'s, the template\'s sections in order, the four fields of each characteristic', () => {
  assert.deepEqual(profile(), []);
  assert.deepEqual(validateProfile(profileText()), [], 'without a file, the id is any profile\'s');
  assert.deepEqual(validateProfile(profileText().replace(/\n/g, '\r\n'), { file: PROFILE_FILE }), [], 'CRLF');
  assert.deepEqual(validateProfile(profileText(), { file: 'profiles\\front-desk.md' }), [], 'a path written with backslashes');
  // A field may run over several lines, and a characteristic may say "Not known yet."
  assert.deepEqual(profile({ sections: withSection('Scope', 'What is true: Not known yet.\n\nWho it does not hold for: Not known yet.\n\nEvidence: guess (the founder, 2026-11-14)\n\nSo the interface must: Not known yet.\n') }), []);
  // Every profile the kit holds as a fixture is sound.
  const fixtures = readdirSync(at('evals/')).flatMap(name => {
    const folder = `evals/${name}/fixture/design/pool/profiles/`;
    return existsSync(at(folder)) ? readdirSync(at(folder)).filter(file => file !== 'README.md').map(file => [`${folder}${file}`, `profiles/${file}`]) : [];
  });
  assert.ok(fixtures.length >= 7, `${fixtures.length} profiles among the fixtures`);
  for (const [path, file] of fixtures) assert.deepEqual(validateProfile(read(path), { file }), [], path);
});

test('a profile\'s file is profiles/<name>.md, and its id is profile.<name>, the name the file\'s', () => {
  only(validateProfile(profileText(), { file: 'profiles/front-office.md' }), /^header: "id" names "front-desk", but the file is profiles\/front-office\.md: it must be profile\.front-office$/);
  for (const id of ['front-desk', 'person.front-desk', 'profile.Front-Desk', 'profile.', '""']) {
    only(profile({ id }), /^header: "id" must be profile\.<name>, the name in lower-case words joined by hyphens, as profile\.front-desk-coordinator; it is /);
  }
  for (const file of ['front-desk.md', 'persons/front-desk.md', 'profiles/Front Desk.md', 'profiles/more/front-desk.md', 'profiles/front-desk.txt']) {
    only(validateProfile(profileText(), { file }), /^file: a profession's profile is profiles\/<name>\.md, the name in lower-case words joined by hyphens; this is /);
  }
  // The header holds the id and nothing else, and without one the file is no profile yet.
  only(validateProfile(profileText().replace('id: profile.front-desk\n', 'id: profile.front-desk\nevidence: guess\n'), { file: PROFILE_FILE }), /^header: unknown key "evidence"$/);
  only(validateProfile(profileText().replace('id: profile.front-desk\n', 'name: front-desk\n'), { file: PROFILE_FILE }).slice(0, 1), /^header: "id" is missing$/);
  only(validateProfile('# Front desk\n\n## Scope\n', { file: PROFILE_FILE }), /^header: a profession's profile opens with its header/);
  assert.throws(() => validateProfile(undefined, { file: PROFILE_FILE }), TypeError);
});

test('a profile has the template\'s sections, once each, in order; a characteristic the project adds goes above "Specialties"', () => {
  const order = 'Scope, The work, Technological familiarity, Usage context, Time and attention, Error tolerance and stakes, Domain vocabulary, Specialties, Optional characteristics';
  for (const name of [...CHARACTERISTICS, ...PROFILE_CLOSING]) {
    only(profile({ sections: profileSections().filter(([n]) => n !== name) }), new RegExp(`^body: "## ${name}" is missing`));
  }
  const swapped = profileSections();
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  only(profile({ sections: swapped }), /^body: the sections are out of order: The work, Scope, /, new RegExp(`the order is ${order}$`));
  only(profile({ sections: [...profileSections(), ['Scope', fieldsOf()]] }), /^body: "## Scope" appears twice$/);
  // An added characteristic: above "Specialties" it is one more, held to the four fields; anywhere else it is out of order.
  const added = ['Physical conditions', fieldsOf()];
  const at7 = sections => [...sections.slice(0, 7), added, ...sections.slice(7)];
  assert.deepEqual(profile({ sections: at7(profileSections()) }), []);
  only(profile({ sections: [...profileSections(), added] }), /^body: the sections are out of order: .*Optional characteristics, Physical conditions; the order is .*Domain vocabulary, Physical conditions, Specialties, Optional characteristics$/);
  only(profile({ sections: [added, ...profileSections()] }), /^body: the sections are out of order: Physical conditions, Scope/);
  only(profile({ sections: at7(profileSections()).map(([n, t]) => [n, n === 'Physical conditions' ? TRAITS : t]) }), /^body: "## Physical conditions" lacks its field "So the interface must:"/);
  // A heading misspelt is a section missing, and one that is not in its place.
  const errors = profile({ sections: profileSections().map(([n, t]) => [n === 'Usage context' ? 'Usage Context' : n, t]) });
  assert.equal(errors.length, 2, errors.join('\n'));
  assert.match(errors[0], /^body: "## Usage context" is missing/);
  assert.match(errors[1], /^body: the sections are out of order/);
  only(profile({ sections: withSection('Specialties', '') }), /^body: "## Specialties" has nothing under it$/);
});

test('each characteristic has its four fields once each, the label of each at the start of its line, after a blank line', () => {
  for (const label of FIELDS) {
    const lacking = fieldsOf().split('\n\n').filter(block => !block.startsWith(`${label}:`)).join('\n\n');
    only(profile({ sections: withSection('The work', lacking) }), new RegExp(`^body: "## The work" lacks its field "${label}:", the label at the start of a line$`));
    only(profile({ sections: withSection('The work', `${fieldsOf()}\n${label}: again.\n`) }), new RegExp(`^body: "## The work" has the field "${label}:" 2 times; a characteristic has each field once$`));
  }
  // The label is the words and the colon, as written: another spelling is no label.
  // Its block then opens with no label, which is said too, by its line (S4).
  for (const spelt of ['evidence:', 'Evidence -', '  Evidence:']) {
    const text = profileText({ sections: withSection('Scope', fieldsOf().replace('Evidence:', spelt)) });
    assert.deepEqual(faultsIn(text), ['body: "## Scope" lacks its field "Evidence:", the label at the start of a line', `body: "## Scope": ${noLabel(lineOf(text, `${spelt} guess`))}`], spelt);
  }
  // A field is a block of its own: its label follows a blank line, or the heading.
  for (const label of FIELDS.slice(1)) {
    only(profile({ sections: withSection('Scope', fieldsOf().replace(`\n\n${label}:`, `\n${label}:`)) }), new RegExp(`^body: "## Scope": the field "${label}:" is not a block of its own: a field begins after a blank line and ends at the next$`));
  }
  assert.deepEqual(validateProfile(profileText().replace('## Scope\n\nWhat is true:', '## Scope\nWhat is true:'), { file: PROFILE_FILE }), [], 'the first field may follow its heading');
  // Every fault of a profile is said, each once.
  const errors = profile({ sections: profileSections().map(([n, t]) => [n, n === 'Scope' ? TRAITS : n === 'The work' ? t.replace('\n\nEvidence:', '\nEvidence:') : t]) });
  assert.deepEqual(errors, ['body: "## Scope" lacks its field "So the interface must:", the label at the start of a line', 'body: "## The work": the field "Evidence:" is not a block of its own: a field begins after a blank line and ends at the next']);
});

test('"So the interface must:" is written nowhere but at the start of a line: the field is taken out by that rule', () => {
  const inside = text => profileText({ sections: withSection('Scope', text) });
  // S13: the line is named by its number, and never quoted: what it says is not printed.
  const notAtStart = line => `body: line ${line}: "So the interface must:" is not at the start of its line: the field would stay in an audience's copy`;
  const within = inside(fieldsOf().replace('Evidence: guess', 'Evidence: guess. So the interface must: say so.'));
  assert.deepEqual(faultsIn(within), [notAtStart(lineOf(within, 'Evidence: guess. So the interface must: say so.'))]);
  const twice = inside(fieldsOf('Say it. So the interface must: say it twice.'));
  assert.deepEqual(faultsIn(twice), [notAtStart(lineOf(twice, 'say it twice'))]);
  // Indented, it is not at the start of its line either: the characteristic lacks its field, and its block opens with no label.
  const indented = inside(fieldsOf().replace('So the interface must:', '  So the interface must:'));
  const at = lineOf(indented, '  So the interface must:');
  assert.deepEqual(faultsIn(indented), ['body: "## Scope" lacks its field "So the interface must:", the label at the start of a line', `body: "## Scope": ${noLabel(at)}`, notAtStart(at)]);
  // In the opening, or under a closing section, the same.
  const opening = profileText({ opening: [DESCRIBED, 'Each ends with So the interface must: and what follows.\n'] });
  assert.deepEqual(faultsIn(opening), [notAtStart(lineOf(opening, 'Each ends with'))]);
  const closing = profileText({ sections: withSection('Optional characteristics', `${OPTIONAL}\nSee So the interface must: above.\n`) });
  assert.deepEqual(faultsIn(closing), [notAtStart(lineOf(closing, 'See So the interface must'))]);
  for (const text of [within, twice, indented, closing]) quotesNothing(faultsIn(text), text);
  // With CRLF the line is the same one.
  assert.deepEqual(validateProfile(within.replace(/\n/g, '\r\n'), { file: PROFILE_FILE }), faultsIn(within));
});

test('a specialty\'s characteristics, each under a "####" heading, are held to the four fields too', () => {
  const specialty = (...characteristics) => `${SPECIALTIES.replace('None yet.\n', '')}### Physiotherapy\n\nWhat differs at a physiotherapy clinic.\n\n${characteristics.map(([name, text]) => `#### ${name}\n\n${text}`).join('\n')}`;
  assert.deepEqual(profile({ sections: withSection('Specialties', specialty(['Usage context', fieldsOf()], ['Time and attention', fieldsOf()])) }), []);
  only(profile({ sections: withSection('Specialties', specialty(['Usage context', TRAITS])) }), /^body: "#### Usage context" of "### Physiotherapy" lacks its field "So the interface must:", the label at the start of a line$/);
  only(profile({ sections: withSection('Specialties', specialty(['Usage context', fieldsOf()], ['Time and attention', fieldsOf().replace('\n\nEvidence:', '\nEvidence:')])) }),
    /^body: "#### Time and attention" of "### Physiotherapy": the field "Evidence:" is not a block of its own/);
  only(profile({ sections: withSection('Specialties', `${specialty(['Usage context', TRAITS])}\n### Dentistry\n\n#### Usage context\n\n${fieldsOf()}`) }), /^body: "#### Usage context" of "### Physiotherapy" lacks its field "So the interface must:"/);
  // Two specialties may override the same characteristic: each is its own.
  const two = `${specialty(['Usage context', fieldsOf()])}\n### Dentistry\n\n#### Usage context\n\n${TRAITS}`;
  only(profile({ sections: withSection('Specialties', two) }), /^body: "#### Usage context" of "### Dentistry" lacks its field "So the interface must:"/);
});

// S4 of the fix review: a criterion written over two blocks (its label, a blank line, then a list) passed the check, and
// the list reached the audience's copy. A field is one block, so a characteristic holds no block that opens with no label.
test('a characteristic holds no block that opens with none of the four labels: a field written over two blocks is refused, by its line and never in its words', () => {
  const LIST = '- Say what is free now, in words.\n- Call a room by the name on its door.\n';
  const over = `${TRAITS}\nSo the interface must:\n\n${LIST}`;
  const text = profileText({ sections: withSection('Usage context', over) });
  assert.deepEqual(faultsIn(text), [`body: "## Usage context": ${noLabel(lineOf(text, '- Say what is free now'))}`]);
  // The copy is refused with it: nothing of the list reaches her.
  assert.deepEqual(traitsOf(text, { file: PROFILE_FILE }), { faults: faultsIn(text), copy: null, fields: 0, paragraphs: 0 });
  // A paragraph, a second paragraph of a trait, a table and a comment are blocks too; each is said once, by its own line.
  for (const stray of ['It must also be read at arm\'s length, standing.\n', '| Room | Free |\n|---|---|\n| Room 2 | yes |\n', '<!-- to check with the clinic -->\n']) {
    const after = profileText({ sections: withSection('Scope', `${fieldsOf()}\n${stray}`) });
    assert.deepEqual(faultsIn(after), [`body: "## Scope": ${noLabel(lineOf(after, stray.split('\n')[0]))}`], stray);
    const before = profileText({ sections: withSection('Scope', `${stray}\n${fieldsOf()}`) });
    assert.deepEqual(faultsIn(before), [`body: "## Scope": ${noLabel(lineOf(before, stray.split('\n')[0]))}`], stray);
  }
  // Straight under the heading, with no blank line between, it is a block all the same.
  const under = text.replace('## The work\n\nWhat is true:', '## The work\nTo check with the clinic.\n\nWhat is true:');
  assert.deepEqual(faultsIn(under), [`body: "## The work": ${noLabel(lineOf(under, 'To check with the clinic.'))}`, `body: "## Usage context": ${noLabel(lineOf(under, '- Say what is free now'))}`]);
  const twice = profileText({ sections: withSection('Scope', `${TRAITS}\nA note.\n\nSo the interface must:\n\n${LIST}\nAnd one more thing.\n`) });
  assert.deepEqual(faultsIn(twice), ['A note.', '- Say what is free now', 'And one more thing.'].map(words => `body: "## Scope": ${noLabel(lineOf(twice, words))}`));
  // A field may run over several lines, a list among them, as long as no blank line parts it: that is one block.
  assert.deepEqual(profile({ sections: withSection('Usage context', `${TRAITS}\nSo the interface must:\n${LIST}`) }), []);
  assert.deepEqual(profile({ sections: withSection('Usage context', fieldsOf('Be read standing.\nNever show a full name.\n- And say what is free.')) }), []);
  // In a specialty, a "####" characteristic is held the same way; what stands between "###" and the first "####" is the specialty's own.
  const specialty = body => `### Physiotherapy\n\nWhat differs at a physiotherapy clinic.\n\n- One list of the specialty's own.\n\n#### Usage context\n\n${body}`;
  assert.deepEqual(profile({ sections: withSection('Specialties', specialty(fieldsOf())) }), []);
  const special = profileText({ sections: withSection('Specialties', specialty(over)) });
  assert.deepEqual(faultsIn(special), [`body: "#### Usage context" of "### Physiotherapy": ${noLabel(lineOf(special, '- Say what is free now'))}`]);
  // The closing sections and the opening are held to no label: their lists and paragraphs stand.
  assert.deepEqual(profile({ sections: withSection('Optional characteristics', `${OPTIONAL}\nA last paragraph.\n`) }), []);
  // With CRLF, and with a header of more lines than one, the line is still the file's own.
  assert.deepEqual(validateProfile(text.replace(/\n/g, '\r\n'), { file: PROFILE_FILE }), faultsIn(text));
  const longer = text.replace('---\nid: profile.front-desk\n---\n', '---\n\nid: profile.front-desk\n\n---\n');
  assert.deepEqual(faultsIn(longer), [`body: "## Usage context": ${noLabel(lineOf(text, '- Say what is free now') + 2)}`]);
  for (const faulty of [text, twice, special]) quotesNothing(faultsIn(faulty), faulty);
});

// S-N2 of the re-review: a criterion written in a fence with a blank line inside it passed the check, which reads no fenced
// line, and its copy kept what follows the blank, the fence's close with it. A field is prose, a list or both, with no blank
// line inside it: a characteristic holds no fence, and the copy is refused through the check.
const inFence = line => `line ${line} opens a code fence: a field is prose, a list or both, from its label to the next blank line, and a blank line inside a fence would end the field there, leaving the rest in an audience's copy`;
test('a characteristic holds no code fence: a field is prose, a list or both, with no blank line inside it, and the copy is refused', () => {
  const FENCED = '```\nSay what is free now.\n\nCall a room by the name on its door.\n```\n';
  const over = `${TRAITS}\nSo the interface must:\n${FENCED}`;
  const text = profileText({ sections: withSection('Usage context', over) });
  const opens = lineOf(text, 'Say what is free now.') - 1;
  assert.deepEqual(faultsIn(text), [`body: "## Usage context": ${inFence(opens)}`]);
  // traits is refused through the check: no copy, and nothing of the fence reaches her.
  assert.deepEqual(traitsOf(text, { file: PROFILE_FILE }), { faults: faultsIn(text), copy: null, fields: 0, paragraphs: 0 });
  // A fence with no blank line inside it is refused all the same, of either character, indented or with a language; and a
  // fence that opens a block of its own is said once, as a fence.
  for (const fence of ['```\nSay what is free now.\n```\n', '~~~\nSay what is free now.\n~~~\n', '   ```text\nSay what is free now.\n   ```\n']) {
    const tight = profileText({ sections: withSection('Scope', `${TRAITS}\nSo the interface must:\n${fence}`) });
    assert.deepEqual(faultsIn(tight), [`body: "## Scope": ${inFence(lineOf(tight, 'Say what is free now.') - 1)}`], fence);
    const apart = profileText({ sections: withSection('Scope', `${fieldsOf()}\n${fence}`) });
    assert.deepEqual(faultsIn(apart), [`body: "## Scope": ${inFence(lineOf(apart, 'Say what is free now.') - 1)}`], fence);
    // Under a trait's label too: whatever the field, it holds no fence.
    const trait = profileText({ sections: withSection('Scope', fieldsOf().replace('What is true: She stands at a counter, the phone at her ear.\n', `What is true:\n${fence}`)) });
    assert.deepEqual(faultsIn(trait), [`body: "## Scope": ${inFence(lineOf(trait, 'Say what is free now.') - 1)}`], fence);
  }
  // In a specialty, a "####" characteristic is held the same way.
  const special = profileText({ sections: withSection('Specialties', `### Physiotherapy\n\n#### Usage context\n\n${over}`) });
  assert.deepEqual(faultsIn(special), [`body: "#### Usage context" of "### Physiotherapy": ${inFence(lineOf(special, 'Say what is free now.') - 1)}`]);
  // The closing sections are held to no field, and a fence stands there, as it does in a specialty's own words.
  assert.deepEqual(profile({ sections: withSection('Optional characteristics', `${OPTIONAL}\n\`\`\`\nA note.\n\n\`\`\`\n`) }), []);
  assert.deepEqual(profile({ sections: withSection('Specialties', `### Physiotherapy\n\n\`\`\`\nA note.\n\n\`\`\`\n\n#### Usage context\n\n${fieldsOf()}`) }), []);
  // With CRLF the faults are the same; none quotes the profile.
  assert.deepEqual(validateProfile(text.replace(/\n/g, '\r\n'), { file: PROFILE_FILE }), faultsIn(text));
  for (const faulty of [text, special]) quotesNothing(faultsIn(faulty), faulty);
});

// ---- the audience's copy of a profile: its traits (R162)

// What is said of a line of a profile that would carry a criterion into the copy: its number, and where it stands (S13).
const stillWritten = (line, where) => `line ${line} of the profile, ${where}, still says "so the interface must": an audience is never handed what the interface must do`;
// What the copy of the sample is: no fourth field, and no paragraph of the opening that speaks of the fields.
const TRAITS_COPY = profileText({ opening: [DESCRIBED], sections: profileSections(TRAITS) });

test('traitsOf takes out each "So the interface must:" field, to the next blank line, and each paragraph of the opening that speaks of the fields; nothing else changes', () => {
  const made = traitsOf(profileText(), { file: PROFILE_FILE });
  assert.deepEqual(made, { faults: [], copy: TRAITS_COPY, fields: 7, paragraphs: 2 });
  assert.doesNotMatch(made.copy, /interface must|fourth field|profile judge|an audience/);
  // What it keeps: the header, the title, what the opening says of the profession, every heading, the three other fields, and the closing sections whole.
  for (const kept of ['---\nid: profile.front-desk\n---\n', '# Front desk\n', DESCRIBED, SPECIALTIES, OPTIONAL, ...CHARACTERISTICS.map(name => `## ${name}\n\n${TRAITS}`)]) assert.ok(made.copy.includes(kept), kept);
  assert.doesNotMatch(made.copy, /\n\n\n/, 'no hole is left where a field was');
  // Pure: the same profile gives the same copy, and CRLF is read as LF.
  assert.deepEqual(traitsOf(profileText(), { file: PROFILE_FILE }), made);
  assert.equal(traitsOf(profileText().replace(/\n/g, '\r\n'), { file: PROFILE_FILE }).copy, TRAITS_COPY);
  // A field that ends at a heading, with no blank line after it, takes nothing of the heading with it.
  const tight = profileText().replace('Never show a full name.\n\n## The work', 'Never show a full name.\n## The work');
  assert.equal(traitsOf(tight, { file: PROFILE_FILE }).copy, TRAITS_COPY.replace('Evidence: guess\n\n## The work', 'Evidence: guess\n## The work'));
  // A field that is the last thing of the file, and one that is the first of its section.
  const last = traitsOf(`${profileText()}\nSo the interface must: Keep this list short.\n`, { file: PROFILE_FILE });
  assert.deepEqual([last.copy, last.fields], [TRAITS_COPY, 8]);
  const first = profileText({ sections: withSection('Scope', `So the interface must: Say so.\n\n${TRAITS}`) });
  assert.equal(traitsOf(first, { file: PROFILE_FILE }).copy, TRAITS_COPY);
  // A specialty's fields go the same way.
  const special = withSection('Specialties', `### Physiotherapy\n\n#### Usage context\n\n${fieldsOf('Say whether a room is free in words.')}`);
  const specialCopy = traitsOf(profileText({ sections: special }), { file: PROFILE_FILE });
  assert.deepEqual([specialCopy.fields, specialCopy.paragraphs], [8, 2]);
  assert.ok(specialCopy.copy.includes(`### Physiotherapy\n\n#### Usage context\n\n${TRAITS}\n## Optional characteristics`));
  // Only the opening's paragraphs go: "four fields" under a section is the section's own, and stays.
  assert.ok(made.copy.includes('each characteristic under a `####` heading with its four fields.'));
  // A paragraph of the opening that speaks of no field stays, and so does an opening with none to take out.
  const plain = traitsOf(profileText({ opening: [DESCRIBED, 'Heard so far: nobody.\n'] }), { file: PROFILE_FILE });
  assert.deepEqual([plain.fields, plain.paragraphs], [7, 0]);
  assert.ok(plain.copy.includes(`${DESCRIBED}\nHeard so far: nobody.\n\n## Scope`));
  // A field written in the opening is taken out as a field, whatever its lines say, and is not counted as a paragraph too.
  const early = traitsOf(profileText({ opening: [DESCRIBED, 'So the interface must: Keep to the\nfour fields.\n', ...EXPLAINED] }), { file: PROFILE_FILE });
  assert.deepEqual([early.copy, early.fields, early.paragraphs], [TRAITS_COPY, 8, 2]);
  // The title is no paragraph, whatever stands under it.
  const under = traitsOf(profileText().replace(`# Front desk\n\n${DESCRIBED}\n`, `# Front desk\n${EXPLAINED[0]}\n${DESCRIBED}\n`), { file: PROFILE_FILE });
  assert.deepEqual([under.copy, under.paragraphs], [TRAITS_COPY, 3]);
  for (const words of ['The Fourth Field is the judge\'s.\n', 'Each has four\nfields.\n']) {
    assert.deepEqual(traitsOf(profileText({ opening: [DESCRIBED, words] }), { file: PROFILE_FILE }).paragraphs, 1, words);
  }
});

test('traitsOf refuses a profile that fails its check, and a copy in which the words are still written', () => {
  const faulty = profileText({ sections: withSection('Scope', TRAITS) });
  assert.deepEqual(traitsOf(faulty, { file: PROFILE_FILE }), { faults: validateProfile(faulty, { file: PROFILE_FILE }), copy: null, fields: 0, paragraphs: 0 });
  assert.equal(traitsOf(profileText(), { file: 'persons/front-desk.md' }).copy, null);
  // The label written another way, inside a trait, passes the check and would reach her: the copy is refused, naming each line.
  const leaking = profileText({ sections: withSection('Usage context', fieldsOf().replace('the phone at her ear.', 'the phone at her ear, so the interface must be read standing.')) });
  assert.deepEqual(validateProfile(leaking, { file: PROFILE_FILE }), []);
  // S13: by the line's number in the profile and the label of its field, never in the line's own words.
  assert.deepEqual(traitsOf(leaking, { file: PROFILE_FILE }), {
    faults: [`copy: ${stillWritten(lineOf(leaking, 'be read standing.'), 'in the field "What is true:"')}`],
    copy: null, fields: 0, paragraphs: 0,
  });
  quotesNothing(traitsOf(leaking, { file: PROFILE_FILE }).faults, leaking);
  // On a later line of its field the label is still the field's; outside every field, that is said.
  const later = profileText({ sections: withSection('Time and attention', fieldsOf().replace('The coordinator in a back office.', 'The coordinator in a back office,\nwhere SO THE INTERFACE MUST stay plain.')) });
  assert.deepEqual(traitsOf(later, { file: PROFILE_FILE }).faults, [`copy: ${stillWritten(lineOf(later, 'SO THE INTERFACE MUST stay plain'), 'in the field "Who it does not hold for:"')}`]);
  const shouting = profileText({ opening: [DESCRIBED, 'SO THE INTERFACE MUST stay plain.\n'] });
  assert.deepEqual(traitsOf(shouting, { file: PROFILE_FILE }).faults, [`copy: ${stillWritten(lineOf(shouting, 'SO THE INTERFACE MUST stay plain'), 'in no field')}`]);
  const closing = profileText({ sections: withSection('Optional characteristics', `${OPTIONAL}\nEach says what, so the interface must follow.\n`) });
  assert.deepEqual(traitsOf(closing, { file: PROFILE_FILE }).faults, [`copy: ${stillWritten(lineOf(closing, 'Each says what'), 'in no field')}`]);
  // A field that follows its heading with no blank line is still that field; and a heading is in no field, whatever stands above it.
  const tight = leaking.replace('## Usage context\n\nWhat is true:', '## Usage context\nWhat is true:');
  assert.deepEqual(traitsOf(tight, { file: PROFILE_FILE }).faults, [`copy: ${stillWritten(lineOf(tight, 'be read standing.'), 'in the field "What is true:"')}`]);
  const heading = profileText({ sections: withSection('Specialties', `### Physiotherapy\n\n#### Usage context\n\n${fieldsOf()}### Clinics where SO THE INTERFACE MUST differ\n\nNone yet.\n`) });
  assert.deepEqual(validateProfile(heading, { file: PROFILE_FILE }), []);
  assert.deepEqual(traitsOf(heading, { file: PROFILE_FILE }).faults, [`copy: ${stillWritten(lineOf(heading, '### Clinics where'), 'in no field')}`]);
  // Two lines are two faults, in the order of the profile.
  const two = profileText({ opening: [DESCRIBED, 'SO THE INTERFACE MUST stay plain.\n'], sections: withSection('Scope', fieldsOf().replace('Evidence: guess', 'Evidence: guess, so the interface must wait')) });
  assert.deepEqual(traitsOf(two, { file: PROFILE_FILE }).faults, [`copy: ${stillWritten(lineOf(two, 'SO THE INTERFACE MUST stay plain'), 'in no field')}`, `copy: ${stillWritten(lineOf(two, 'so the interface must wait'), 'in the field "Evidence:"')}`]);
});

// ---- card.mjs check: a project's own cards, people and professions, checked before they are cast

const cli = fileURLToPath(at('scripts/card.mjs'));
mkdirSync(fileURLToPath(at('tests/.tmp/')), { recursive: true });
const scratch = mkdtempSync(join(fileURLToPath(at('tests/.tmp/')), 'pool-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

const POOL_FOLDERS = ['profiles', 'persons', 'makers', 'judges', 'audiences'];
const README_LINE = 'This project\'s own cards: each is written to the card format of the kit.\n';
// A project's pool as setup leaves it, in a path with a space: the five folders, each with its README.
let pools = 0;
function projectPool() {
  const pool = join(scratch, `a project ${++pools}`, 'design', 'pool');
  for (const folder of POOL_FOLDERS) {
    mkdirSync(join(pool, folder), { recursive: true });
    writeFileSync(join(pool, folder, 'README.md'), README_LINE);
  }
  return pool;
}
// One file of a pool, written at its path under it; the path it was written at.
const put = (pool, file, text) => {
  const path = join(pool, ...file.split('/'));
  writeFileSync(path, text);
  return path;
};
// One run of the command: its exit code, what it printed, and what it said was wrong with the run.
const check = (args, cwd) => {
  const run = node([cli, ...args], cwd);
  return [run.status, run.stdout, run.stderr];
};
const USAGE = node([cli, '--help']).stdout;
const MAKER_CARD = write(HEADER, BODY);
const JUDGE_CARD = write(JUDGE_HEADER, [...CHECKS, ...BODY]);
const AUDIENCE_CARD = write({ ...HEADER, id: 'audience.room-reader', shelf: 'audience', 'loaded-with': 'person' }, BODY);
const PERSON_CARD = write(PERSON_HEADER, PERSON_BODY);
// What the command says of each file: a sound one, one passed over, one in no folder of cards, one unread.
const ok = file => `${file}: ok\n`;
const passedOver = file => `${file}: passed over: a README.md is never a card\n`;
const noFolder = (file, folder) => `${file}: file: a card is in a folder named makers, judges or audiences, a person in one named persons, and a profession's profile in one named profiles; this file is in "${folder}"\n`;
const PROFILE_CARD = profileText();
const unread = (file, why) => `${file}: file: cannot be read: ${why}\n`;
const isFolder = file => `${file}: file: this is a folder, and files are checked one by one: name each file in it\n`;
const faultsOf = (file, faults) => faults.map(fault => `${file}: ${fault}\n`).join('');

test('card.mjs prints its usage for --help and -h, and the usage gives the two forms it takes', () => {
  assert.match(USAGE, /^Usage: node scripts\/card\.mjs check <file>\.\.\.\n {7}node scripts\/card\.mjs traits <profile> --out <file>\n\n/);
  for (const args of [['--help'], ['-h'], ['check', '--help'], ['check', 'makers/room-lister.md', '-h'], ['traits', '--help'], ['traits', 'profiles/front-desk.md', '--out', 'x.md', '-h']]) assert.deepEqual(check(args), [0, USAGE, ''], args.join(' '));
  // What it says of itself is what it does: the folders, the README, the three exit codes.
  for (const folder of [...Object.keys(FOLDERS), PERSON_FOLDER, PROFILE_FOLDER]) assert.ok(USAGE.includes(`${folder}/`), folder);
  const usage = USAGE.replace(/\s+/g, ' ');
  // R162: what a profession's profile is held to, and what its copy for an audience is.
  assert.ok(usage.includes('a file in profiles/ is a profession\'s profile, held to the sections and the labels of templates/people/PROFILE-CARD.md'));
  assert.ok(existsSync(at('templates/people/PROFILE-CARD.md')));
  for (const said of [`its id is profile.<name>, the name its file's`, ...CHARACTERISTICS, ...PROFILE_CLOSING, ...FIELDS.map(field => `"${field}:"`),
    'and "So the interface must:" is written nowhere but at the start of a line',
    'when no block of a characteristic opens without one of the four labels: a field written over two blocks, as its label, a blank line and a list, is refused',
    // S-N2 of the re-review.
    'when a characteristic holds no code fence: a field is prose, a list or both, with no blank line inside it',
    'A fault names a line of a profile by its number, and a field by its label: nothing a profile says is printed',
    'traits writes the audience\'s copy of a profession\'s profile to --out', 'without each "So the interface must:" field, from its label to the next blank line',
    'and without each paragraph before the first section that speaks of the fields themselves (one that says "fourth field" or "four fields")',
    'It refuses a profile that fails check', 'and a copy in which the words "so the interface must" are still written, in any case, naming each line by its number and the label of its field',
    '--out is not the profile itself; its folder is made when it is not there']) assert.ok(usage.includes(said), said);
  assert.match(USAGE, /A file named README\.md is never a card: it is\npassed over, and its line says so\. A path that cannot be reached, whatever its name, is a file that\ncannot be read/);
  assert.match(USAGE, /A folder is not checked: files are named one by one/);
  assert.match(USAGE, /pool\/CARD-FORMAT\.md/);
  assert.match(USAGE, /\nExit codes: 0 [^·]+ · 1 [^·]+ · 2 bad usage\.\n$/);
  // S-N3 of the re-review: the usage is wrapped as the kit's prose is, no line past 105 characters.
  for (const line of USAGE.split('\n')) assert.ok(line.length <= 105, `${line.length}: ${line}`);
});

test('card.mjs check: a sound card of each shelf and a sound person are ok, each held to the format of the folder it is in', () => {
  const pool = projectPool();
  const files = [put(pool, FILE.maker, MAKER_CARD), put(pool, FILE.judge, JUDGE_CARD), put(pool, FILE.audience, AUDIENCE_CARD), put(pool, PERSON_FILE, PERSON_CARD)];
  assert.match(pool, / /, 'the path has a space in it');
  for (const file of files) assert.deepEqual(check(['check', file]), [0, ok(file), '']);
  assert.deepEqual(check(['check', ...files]), [0, files.map(ok).join(''), '']);
  // With CRLF line endings too.
  const crlf = put(pool, 'makers/room-lister.md', MAKER_CARD.replace(/\n/g, '\r\n'));
  assert.deepEqual(check(['check', crlf]), [0, ok(crlf), '']);
});

test('card.mjs check: each fault of a card is printed on a line of its own, with its file, and the exit code is 1', () => {
  const pool = projectPool();
  const { verified, ...header } = HEADER;
  const text = write(header, BODY.filter(([name]) => name !== 'Never'));
  const file = put(pool, FILE.maker, text);
  const [status, printed, said] = check(['check', file]);
  assert.deepEqual([status, said], [1, '']);
  const lines = printed.split('\n');
  assert.equal(lines.length, 3, printed);
  assert.equal(lines[0], `${file}: header: "verified" is missing`);
  assert.ok(lines[1].startsWith(`${file}: body: "## Never" is missing`), lines[1]);
  assert.equal(lines[2], '');
  // They are the checker's own faults, all of them and no other, and the file is left as it was.
  assert.equal(verified, HEADER.verified);
  assert.equal(printed, faultsOf(file, validateCard(text, { file: FILE.maker })));
  assert.equal(readFileSync(file, 'utf8'), text);
  assert.deepEqual(readdirSync(join(pool, 'makers')).sort(), ['README.md', 'room-lister.md']);
});

test('card.mjs check: a faulty person is reported the same way, by the person checker', () => {
  const pool = projectPool();
  const text = write({ ...PERSON_HEADER, evidence: 'hunch' }, PERSON_BODY.filter(([name]) => name !== 'The check'));
  const file = put(pool, PERSON_FILE, text);
  const [status, printed, said] = check(['check', file]);
  assert.deepEqual([status, said], [1, '']);
  assert.equal(printed, faultsOf(file, validatePerson(text, { file: PERSON_FILE })));
  assert.match(printed, /: header: "evidence" must be one of fact, guess, mixed; it is "hunch"\n/);
  assert.match(printed, /: body: "## The check" is missing/);
  assert.equal(printed.trimEnd().split('\n').length, 2);
});

test('card.mjs check: the folder says what a file is: a seat in makers/, judges/ or audiences/, a person in persons/', () => {
  const pool = projectPool();
  // A judge's card put in makers/ is on the wrong shelf.
  const judge = put(pool, 'makers/room-truth.md', JUDGE_CARD);
  let [status, printed, said] = check(['check', judge]);
  assert.deepEqual([status, said], [1, '']);
  assert.equal(printed, faultsOf(judge, validateCard(JUDGE_CARD, { file: 'makers/room-truth.md' })));
  assert.match(printed, /: header: "shelf" is judge, but the card is in makers\/, the maker shelf\n/);
  // The file's name is part of the check: the id is the file's.
  const renamed = put(pool, 'judges/room-facts.md', JUDGE_CARD);
  [status, printed, said] = check(['check', renamed]);
  assert.deepEqual([status, said], [1, '']);
  assert.equal(printed, `${renamed}: header: "id" names "room-truth", but the file is judges/room-facts.md: it must be judge.room-facts\n`);
  // A person put among the audiences is held to a seat's card, and a seat's card among the persons to a person's.
  const person = put(pool, 'audiences/desk-cover.md', PERSON_CARD);
  [status, printed, said] = check(['check', person]);
  assert.deepEqual([status, said], [1, '']);
  assert.equal(printed, faultsOf(person, validateCard(PERSON_CARD, { file: 'audiences/desk-cover.md' })));
  assert.match(printed, /: header: "shelf" is missing\n/);
  const seat = put(pool, 'persons/room-lister.md', MAKER_CARD);
  [status, printed, said] = check(['check', seat]);
  assert.deepEqual([status, said], [1, '']);
  assert.equal(printed, faultsOf(seat, validatePerson(MAKER_CARD, { file: 'persons/room-lister.md' })));
  assert.match(printed, /: header: "id" must be person\.<name>/);
});

test('card.mjs check: a file in any other folder is no card to check, which is a fault', () => {
  const pool = projectPool();
  mkdirSync(join(pool, 'work'));
  const outside = [
    [put(pool, 'work/front-desk.md', PROFILE_CARD), 'work'],
    // A sound card beside the folders, and one a folder too deep.
    [put(pool, 'room-lister.md', MAKER_CARD), 'pool'],
    [(mkdirSync(join(pool, 'makers', 'more')), put(pool, 'makers/more/room-lister.md', MAKER_CARD)), 'more'],
  ];
  for (const [file, folder] of outside) assert.deepEqual(check(['check', file]), [1, noFolder(file, folder), ''], file);
  // One that is not there is a file that cannot be read, here as in a folder of cards.
  const nowhere = join(pool, 'profiles', 'nowhere.md');
  assert.deepEqual(check(['check', nowhere]), [1, unread(nowhere, 'not found'), '']);
  // A folder named like one of the five, with a prefix, is another folder.
  mkdirSync(join(pool, 'my-makers'));
  const near = put(pool, 'my-makers/room-lister.md', MAKER_CARD);
  assert.deepEqual(check(['check', near]), [1, noFolder(near, 'my-makers'), '']);
});

test('card.mjs check: a path is read from where the command is run, and the folder is the one the file is in', () => {
  const pool = projectPool();
  put(pool, FILE.judge, JUDGE_CARD);
  put(pool, PERSON_FILE, PERSON_CARD);
  // From the pool, from the card's own folder, and from the folder beside it: the line names the path as given.
  assert.deepEqual(check(['check', 'judges/room-truth.md', 'persons/desk-cover.md'], pool), [0, `${ok('judges/room-truth.md')}${ok('persons/desk-cover.md')}`, '']);
  assert.deepEqual(check(['check', 'room-truth.md'], join(pool, 'judges')), [0, ok('room-truth.md'), '']);
  assert.deepEqual(check(['check', './room-truth.md'], join(pool, 'judges')), [0, ok('./room-truth.md'), '']);
  assert.deepEqual(check(['check', '../judges/room-truth.md'], join(pool, 'makers')), [0, ok('../judges/room-truth.md'), '']);
  assert.deepEqual(check(['check', 'README.md'], join(pool, 'judges')), [0, passedOver('README.md'), '']);
  assert.deepEqual(check(['check', 'desk-cover.md'], join(pool, 'persons')), [0, ok('desk-cover.md'), '']);
});

test('card.mjs check: a file named README.md is never a card: it is passed over in every folder, and is no fault', () => {
  const pool = projectPool();
  const readmes = POOL_FOLDERS.map(folder => join(pool, folder, 'README.md'));
  // A pool with no card of its own yet: every folder's README, and nothing to refuse.
  assert.deepEqual(check(['check', ...readmes]), [0, readmes.map(passedOver).join(''), '']);
  for (const file of readmes) assert.deepEqual(check(['check', file]), [0, passedOver(file), '']);
  // Beside a sound card it changes nothing, and beside a faulty one it does not hide the fault.
  const sound = put(pool, FILE.judge, JUDGE_CARD);
  assert.deepEqual(check(['check', readmes[3], sound]), [0, `${passedOver(readmes[3])}${ok(sound)}`, '']);
  const faulty = put(pool, FILE.maker, MAKER_CARD.replace('shelf: maker\n', ''));
  const [status, printed, said] = check(['check', readmes[2], faulty]);
  assert.deepEqual([status, said], [1, '']);
  assert.equal(printed, `${passedOver(readmes[2])}${faulty}: header: "shelf" is missing\n`);
  // Only that name: written another way, a file of a card folder is held to the card format.
  const lower = put(pool, 'makers/readme.md', README_LINE);
  assert.deepEqual(check(['check', lower]), [1, faultsOf(lower, validateCard(README_LINE, { file: 'makers/readme.md' })), '']);
  assert.match(check(['check', lower])[1], /: header: a card opens with its header/);
});

test('card.mjs check: only a README.md that is there is passed over: one that is missing, or is a folder, is a fault', () => {
  const pool = projectPool();
  const sound = put(pool, FILE.judge, JUDGE_CARD);
  // A README that is not there: a slip in the path would otherwise pass as a pool with nothing to refuse.
  const missing = join(pool, 'judgse', 'README.md');
  assert.deepEqual(check(['check', missing]), [1, unread(missing, 'not found'), '']);
  rmSync(join(pool, 'makers', 'README.md'));
  const gone = join(pool, 'makers', 'README.md');
  assert.deepEqual(check(['check', gone, sound]), [1, `${unread(gone, 'not found')}${ok(sound)}`, '']);
  // Under a file where a folder should be, it cannot be reached either.
  const under = join(sound, 'README.md');
  assert.deepEqual(check(['check', under]), [1, unread(under, 'part of the path is a file, not a folder'), '']);
  // A folder of that name is a folder.
  const folder = join(pool, 'audiences', 'more', 'README.md');
  mkdirSync(folder, { recursive: true });
  assert.deepEqual(check(['check', folder]), [1, isFolder(folder), '']);
  // The one that is there is still passed over, from wherever it is named.
  assert.deepEqual(check(['check', 'README.md'], join(pool, 'judges')), [0, passedOver('README.md'), '']);
});

test('card.mjs check: a folder is not checked, whatever it is named: the line says that files are named one by one', () => {
  const pool = projectPool();
  const sound = put(pool, FILE.judge, JUDGE_CARD);
  // The pool, a folder of cards, with a slash after it and from inside it: none is read as a file in the folder above.
  for (const folder of [pool, join(pool, 'makers'), `${join(pool, 'judges')}/`]) assert.deepEqual(check(['check', folder]), [1, isFolder(folder), ''], folder);
  assert.deepEqual(check(['check', '.'], join(pool, 'judges')), [1, isFolder('.'), '']);
  assert.deepEqual(check(['check', 'judges'], pool), [1, isFolder('judges'), '']);
  // A folder named as a card would be, in a folder of cards.
  const named = join(pool, 'makers', 'a-folder.md');
  mkdirSync(named);
  assert.deepEqual(check(['check', named]), [1, isFolder(named), '']);
  // The files beside it are still checked, and nothing in the folder is.
  assert.deepEqual(check(['check', join(pool, 'judges'), sound]), [1, `${isFolder(join(pool, 'judges'))}${ok(sound)}`, '']);
});

test('card.mjs check: several files in one run are reported in the order given, and one fault among them makes the exit code 1', () => {
  const pool = projectPool();
  const judge = put(pool, FILE.judge, JUDGE_CARD);
  const person = put(pool, PERSON_FILE, PERSON_CARD);
  const faulty = put(pool, FILE.maker, MAKER_CARD.replace('engine: own\n', 'engine: magic\n'));
  const profile = put(pool, 'profiles/front-desk.md', PROFILE_CARD);
  const stray = put(pool, 'front-desk.md', PROFILE_CARD);
  const readme = join(pool, 'audiences', 'README.md');
  const fault = `${faulty}: header: "engine" must be own, skill:<name>, model:any or tool:<name>; it is "magic"\n`;
  assert.deepEqual(check(['check', judge, faulty, readme, person, profile, stray]), [1, `${ok(judge)}${fault}${passedOver(readme)}${ok(person)}${ok(profile)}${noFolder(stray, 'pool')}`, '']);
  assert.deepEqual(check(['check', person, readme, judge, profile]), [0, `${ok(person)}${passedOver(readme)}${ok(judge)}${ok(profile)}`, '']);
  // A file named twice is checked twice: the command keeps no list of its own.
  assert.deepEqual(check(['check', judge, judge]), [0, `${ok(judge)}${ok(judge)}`, '']);
});

test('card.mjs check: a file that cannot be read is a fault of that file, and the others are still checked', () => {
  const pool = projectPool();
  const judge = put(pool, FILE.judge, JUDGE_CARD);
  const missing = join(pool, 'judges', 'nowhere.md');
  const under = join(judge, 'room-facts.md');
  assert.deepEqual(check(['check', missing]), [1, unread(missing, 'not found'), '']);
  // A path under a file cannot be reached: one message for it, whatever the file is named, a README among them.
  const WHY = 'part of the path is a file, not a folder';
  assert.deepEqual(check(['check', missing, judge, under]), [1, `${unread(missing, 'not found')}${ok(judge)}${unread(under, WHY)}`, '']);
  const readme = join(judge, 'README.md');
  assert.deepEqual(check(['check', under, readme]), [1, `${unread(under, WHY)}${unread(readme, WHY)}`, '']);
  assert.equal(unread(under, WHY).replace(under, ''), unread(readme, WHY).replace(readme, ''));
});

test('card.mjs: bad usage says what is wrong, then prints the usage, and exits 2 with nothing checked', () => {
  const pool = projectPool();
  const faulty = put(pool, FILE.maker, '# Not a card\n');
  for (const [args, message] of [
    [[], 'no verb given: card.mjs takes check or traits'],
    [['validate', faulty], 'unknown verb "validate": card.mjs takes check or traits'],
    [[faulty], `unknown verb "${faulty}": card.mjs takes check or traits`],
    [['check'], 'check takes at least one <file>'],
    [['check', faulty, '--fix'], 'unknown flag --fix'],
    [['--strict', 'check', faulty], 'unknown flag --strict'],
    [['check', '--out=report.txt', faulty], 'unknown flag --out'],
  ]) assert.deepEqual(check(args), [2, '', `${message}\n\n${USAGE}`], args.join(' '));
});

test('card.mjs check: a file in profiles/ is a profession\'s profile, held to the profile checker, its faults printed as a card\'s are', () => {
  const pool = projectPool();
  const sound = put(pool, PROFILE_FILE, PROFILE_CARD);
  assert.deepEqual(check(['check', sound]), [0, ok(sound), '']);
  assert.deepEqual(check(['check', 'front-desk.md'], join(pool, 'profiles')), [0, ok('front-desk.md'), '']);
  // The file's name is part of the check, and so is each characteristic's fourth label.
  const renamed = put(pool, 'profiles/front-office.md', PROFILE_CARD);
  assert.deepEqual(check(['check', renamed]), [1, `${renamed}: header: "id" names "front-desk", but the file is profiles/front-office.md: it must be profile.front-office\n`, '']);
  const text = profileText({ sections: withSection('Scope', TRAITS).filter(([name]) => name !== 'Specialties') });
  const faulty = put(pool, PROFILE_FILE, text);
  const [status, printed, said] = check(['check', faulty]);
  assert.deepEqual([status, said], [1, '']);
  assert.equal(printed, faultsOf(faulty, validateProfile(text, { file: PROFILE_FILE })));
  assert.equal(printed.trimEnd().split('\n').length, 2);
  assert.match(printed, /: body: "## Specialties" is missing/);
  assert.match(printed, /: body: "## Scope" lacks its field "So the interface must:", the label at the start of a line\n/);
  assert.equal(readFileSync(faulty, 'utf8'), text, 'the file is left as it was');
  // A person put among the profiles is held to a profile, and a profile among the persons to a person.
  const person = put(pool, 'profiles/desk-cover.md', PERSON_CARD);
  assert.equal(check(['check', person])[1], faultsOf(person, validateProfile(PERSON_CARD, { file: 'profiles/desk-cover.md' })));
  const misplaced = put(pool, 'persons/front-desk.md', PROFILE_CARD);
  assert.equal(check(['check', misplaced])[1], faultsOf(misplaced, validatePerson(PROFILE_CARD, { file: 'persons/front-desk.md' })));
  // The README of profiles/ is passed over, as every folder's is.
  assert.deepEqual(check(['check', join(pool, 'profiles', 'README.md')]), [0, passedOver(join(pool, 'profiles', 'README.md')), '']);
});

// ---- card.mjs traits: the audience's copy of a profession's profile (R162)

const wrote = (file, out, fields = 7, paragraphs = ', and 2 paragraphs about the fields') => `wrote the traits of ${file} to ${out}: ${fields} "So the interface must:" fields taken out${paragraphs}\n`;
const notWritten = (file, faults) => `no copy of ${file} is written:\n${faults.map(fault => `${file}: ${fault}\n`).join('')}`;

test('card.mjs traits writes the copy of a sound profile to --out, in a folder it makes, and says what it took out', () => {
  const pool = projectPool();
  const file = put(pool, PROFILE_FILE, PROFILE_CARD);
  const out = join(pool, '..', 'today', 'work', 'the traits.md');
  assert.deepEqual(check(['traits', file, '--out', out]), [0, wrote(file, out), '']);
  assert.equal(readFileSync(out, 'utf8'), TRAITS_COPY);
  assert.equal(readFileSync(out, 'utf8'), traitsOf(PROFILE_CARD, { file: PROFILE_FILE }).copy);
  assert.equal(readFileSync(file, 'utf8'), PROFILE_CARD, 'the profile is left as it was');
  // Run again it writes the same copy over the first; --out=value is the same; a path is read from where it is run.
  assert.deepEqual(check(['traits', `--out=${out}`, file]), [0, wrote(file, out), '']);
  assert.deepEqual(check(['traits', 'profiles/front-desk.md', '--out', 'traits.md'], pool), [0, wrote('profiles/front-desk.md', 'traits.md'), '']);
  assert.equal(readFileSync(join(pool, 'traits.md'), 'utf8'), TRAITS_COPY);
  // One paragraph is said as one, and none is not said; an added characteristic's field is counted with the seven.
  const one = put(pool, 'profiles/night-desk.md', profileText({ id: 'profile.night-desk', opening: [DESCRIBED, EXPLAINED[0]] }));
  assert.deepEqual(check(['traits', one, '--out', join(pool, 'one.md')]), [0, wrote(one, join(pool, 'one.md'), 7, ', and 1 paragraph about the fields'), '']);
  const sections = profileSections();
  const none = put(pool, 'profiles/day-desk.md', profileText({ id: 'profile.day-desk', opening: [DESCRIBED], sections: [...sections.slice(0, 7), ['Physical conditions', fieldsOf()], ...sections.slice(7)] }));
  assert.deepEqual(check(['traits', none, '--out', join(pool, 'none.md')]), [0, wrote(none, join(pool, 'none.md'), 8, ''), '']);
  assert.doesNotMatch(readFileSync(join(pool, 'none.md'), 'utf8'), /interface must/);
  // Every profile the kit holds as a fixture gives a copy with no criterion left, and with its seven fields gone.
  const fixture = fileURLToPath(at('evals/audience-stays-blind/fixture/design/pool/profiles/front-desk-coordinator.md'));
  const copy = join(pool, 'fixture-traits.md');
  assert.deepEqual(check(['traits', fixture, '--out', copy]), [0, wrote(fixture, copy), '']);
  const written = readFileSync(copy, 'utf8');
  assert.doesNotMatch(written, /interface must|fourth field|profile judge|An audience/i);
  assert.match(written, /^---\nid: profile\.front-desk-coordinator\n---\n\n# Front-desk coordinator\n\nThe person who runs the front desk of a small clinic\.[^\n]*\n\n## Scope\n\nWhat is true: /);
  assert.equal(written.split('\nEvidence: guess\n').length - 1, 7);
});

test('card.mjs traits refuses a profile that fails its check, printing its faults as check does, and writes nothing', () => {
  const pool = projectPool();
  const text = profileText({ sections: withSection('Scope', TRAITS) });
  const faulty = put(pool, PROFILE_FILE, text);
  const out = join(pool, 'traits.md');
  writeFileSync(out, 'An earlier copy.\n');
  const faults = validateProfile(text, { file: PROFILE_FILE });
  assert.equal(faults.length, 1);
  assert.deepEqual(check(['traits', faulty, '--out', out]), [1, '', notWritten(faulty, faults)]);
  assert.equal(readFileSync(out, 'utf8'), 'An earlier copy.\n', 'what was there is left');
  assert.deepEqual(check(['traits', faulty, '--out', join(pool, 'none', 'traits.md')])[0], 1);
  assert.ok(!existsSync(join(pool, 'none')), 'no folder is made for a copy that is not written');
  // What is no profile: a file of another folder, a README, a folder, a file that is not there.
  const person = put(pool, PERSON_FILE, PERSON_CARD);
  const not = folder => `file: traits are taken from a profession's profile, a file in a folder named profiles; this file is in "${folder}"`;
  assert.deepEqual(check(['traits', person, '--out', out]), [1, '', notWritten(person, [not('persons')])]);
  const stray = put(pool, 'front-desk.md', PROFILE_CARD);
  assert.deepEqual(check(['traits', stray, '--out', out]), [1, '', notWritten(stray, [not('pool')])]);
  const readme = join(pool, 'profiles', 'README.md');
  assert.deepEqual(check(['traits', readme, '--out', out]), [1, '', notWritten(readme, ['file: a README.md is never a card: it has no traits'])]);
  const folder = join(pool, 'profiles');
  assert.deepEqual(check(['traits', folder, '--out', out]), [1, '', notWritten(folder, ['file: this is a folder: name the profile in it'])]);
  const nowhere = join(pool, 'profiles', 'nowhere.md');
  assert.deepEqual(check(['traits', nowhere, '--out', out]), [1, '', notWritten(nowhere, ['file: cannot be read: not found'])]);
  assert.equal(readFileSync(out, 'utf8'), 'An earlier copy.\n');
});

test('card.mjs traits refuses a copy in which the words are still written, naming the line, and writes nothing', () => {
  const pool = projectPool();
  const leaking = put(pool, PROFILE_FILE, profileText({ sections: withSection('Usage context', fieldsOf().replace('the phone at her ear.', 'the phone at her ear, so the interface must be read standing.')) }));
  const out = join(pool, 'traits.md');
  assert.deepEqual(check(['check', leaking]), [0, ok(leaking), ''], 'the profile is sound');
  const text = readFileSync(leaking, 'utf8');
  const refusedCopy = check(['traits', leaking, '--out', out]);
  assert.deepEqual(refusedCopy, [1, '', notWritten(leaking, [`copy: ${stillWritten(lineOf(text, 'be read standing.'), 'in the field "What is true:"')}`])]);
  assert.ok(!existsSync(out));
  // S13: a refusal names a line by its number and its label. None of the profile's own words is printed: the session that
  // makes the copy does not open the profile, and must not be shown it.
  assert.ok(!refusedCopy[2].includes('counter') && !refusedCopy[2].includes('read standing'));
  // S4: a criterion written over two blocks is refused by check, so by traits, and its lines are not printed either.
  const over = put(pool, 'profiles/night-desk.md', profileText({ id: 'profile.night-desk', sections: withSection('Usage context', `${TRAITS}\nSo the interface must:\n\n- Say what is free now, in words.\n- Call a room by the name on its door.\n`) }));
  const overText = readFileSync(over, 'utf8');
  const fault = `body: "## Usage context": ${noLabel(lineOf(overText, '- Say what is free now'))}`;
  assert.deepEqual(check(['check', over]), [1, `${over}: ${fault}\n`, '']);
  assert.deepEqual(check(['traits', over, '--out', out]), [1, '', notWritten(over, [fault])]);
  assert.ok(!existsSync(out));
  // S-N2: so is a criterion written in a fence with a blank line inside it, the reviewer's form.
  const fenced = put(pool, 'profiles/day-desk.md', profileText({ id: 'profile.day-desk', sections: withSection('Usage context', `${TRAITS}\nSo the interface must:\n\`\`\`\nSay what is free now.\n\nCall a room by its door name LEAK.\n\`\`\`\n`) }));
  const fencedText = readFileSync(fenced, 'utf8');
  const inside = `body: "## Usage context": ${inFence(lineOf(fencedText, 'Say what is free now.') - 1)}`;
  assert.deepEqual(check(['check', fenced]), [1, `${fenced}: ${inside}\n`, '']);
  const refusedFence = check(['traits', fenced, '--out', out]);
  assert.deepEqual(refusedFence, [1, '', notWritten(fenced, [inside])]);
  assert.ok(!existsSync(out) && !refusedFence[2].includes('LEAK'));
});

test('card.mjs traits: bad usage, and a copy that cannot be written', () => {
  const pool = projectPool();
  const file = put(pool, PROFILE_FILE, PROFILE_CARD);
  const out = join(pool, 'traits.md');
  for (const [args, message, cwd] of [
    [['traits'], 'traits takes one <profile>, got 0'],
    [['traits', file, file, '--out', out], 'traits takes one <profile>, got 2'],
    [['traits', file], '--out is missing'],
    [['traits', file, '--out'], '--out needs a value'],
    [['traits', file, '--out', file], '--out is the profile itself: writing the copy would overwrite it'],
    [['traits', 'front-desk.md', '--out', './front-desk.md'], '--out is the profile itself: writing the copy would overwrite it', join(pool, 'profiles')],
    [['traits', file, '--out', out, '--force'], 'unknown flag --force'],
    [['check', file, '--out', out], 'unknown flag --out'],
  ]) assert.deepEqual(check(args, cwd), [2, '', `${message}\n\n${USAGE}`], args.join(' '));
  assert.ok(!existsSync(out));
  assert.equal(readFileSync(file, 'utf8'), PROFILE_CARD);
  // --out under a file cannot be written: a refusal of the run, with the reason.
  const under = join(file, 'traits.md');
  const [status, printed, said] = check(['traits', file, '--out', under]);
  assert.deepEqual([status, printed], [1, '']);
  assert.match(said, /^cannot write .*traits\.md: /);
});

test('card.mjs check: every card and every person of the kit\'s own pool is sound, in one run from the kit\'s root', () => {
  const kit = fileURLToPath(root);
  const files = [...cards, ...persons].map(({ file }) => `pool/${file}`);
  assert.equal(files.length, 22);
  assert.deepEqual(check(['check', ...files], kit), [0, files.map(ok).join(''), '']);
  // The pages beside the folders are no cards.
  for (const page of ['pool/INDEX.md', 'pool/CARD-FORMAT.md', 'pool/MODELS.md']) assert.deepEqual(check(['check', page], kit), [1, noFolder(page, 'pool'), ''], page);
});
