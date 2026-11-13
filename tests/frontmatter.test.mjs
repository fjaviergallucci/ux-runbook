import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, serialize, FrontmatterError } from '../scripts/lib/frontmatter.mjs';

const doc = '---\nstage: intent\nversion: 2\nbuilt-from: [frame@1, context@3]\nwords: "sí, continúa"\n---\n# Title\n\nBody.\n';

test('parses scalars, integers, inline lists and quoted strings', () => {
  const { data, body } = parse(doc);
  assert.deepEqual(data, { stage: 'intent', version: 2, 'built-from': ['frame@1', 'context@3'], words: 'sí, continúa' });
  assert.equal(body, '# Title\n\nBody.\n');
});

test('round-trips', () => {
  const { data, body } = parse(doc);
  assert.deepEqual(parse(serialize(data, body)), { data, body });
});

test('a file with no frontmatter is all body', () => {
  assert.deepEqual(parse('# Only\n'), { data: {}, body: '# Only\n' });
});

test('CRLF input parses the same as LF', () => {
  assert.deepEqual(parse(doc.replace(/\n/g, '\r\n')), parse(doc));
});

test('nested values are refused, naming the line', () => {
  assert.throws(() => parse('---\nroute:\n  frame: full\n---\n'), e => e instanceof FrontmatterError && /line 2/.test(e.message));
});

test('an empty list parses as an empty array', () => {
  assert.deepEqual(parse('---\ncarry: []\n---\n').data, { carry: [] });
});

const refused = (fn, ...patterns) =>
  assert.throws(fn, e => e instanceof FrontmatterError && patterns.every(p => p.test(e.message)));

test('a key with nothing after the colon is the empty string', () => {
  assert.deepEqual(parse('---\nstage: intent\napproved:\nwords:\n---\n').data, { stage: 'intent', approved: '', words: '' });
});

test('a blank value with an indented line below it is refused, naming the key and its line', () => {
  refused(() => parse('---\nstage: intent\nroute:\n  frame: full\n---\n'), /line 3/, /"route"/);
});

test('a byte-order mark is ignored and never reaches the body', () => {
  assert.deepEqual(parse(`\uFEFF${doc}`), parse(doc));
  assert.deepEqual(parse('\uFEFF# Only\n'), { data: {}, body: '# Only\n' });
});

test('a byte-order mark with CRLF parses the same as plain LF', () => {
  assert.deepEqual(parse(`\uFEFF${doc.replace(/\n/g, '\r\n')}`), parse(doc));
});

test('a duplicate key is refused, naming the key and its line', () => {
  refused(() => parse('---\nstatus: draft\nstatus: approved\n---\n'), /line 3/, /"status"/);
});

test('a header that is never closed is refused, naming its opening line', () => {
  refused(() => parse('---\nstage: intent\n# Title\n'), /line 1/, /never closed/);
});

test('a line that is not key: value is refused, naming the line', () => {
  refused(() => parse('---\nStage: intent\n---\n'), /line 2/);
  refused(() => parse('---\nstage: intent\njust words\n---\n'), /line 3/);
  refused(() => parse('---\nstage: intent\n  frame: full\n---\n'), /line 3/);
  refused(() => parse('---\ncarry:\n- frame@1\n---\n'), /line 3/);
});

test('blank lines inside the header are skipped', () => {
  assert.deepEqual(parse('---\nstage: intent\n\nversion: 2\n---\n').data, { stage: 'intent', version: 2 });
});

test('a quoted list item may hold a comma', () => {
  const data = { tags: ['a, b', 'c'] };
  assert.deepEqual(parse('---\ntags: ["a, b", c]\n---\n').data, data);
  assert.deepEqual(parse(serialize(data, '')).data, data);
});

test('strings that need quoting come back as themselves', () => {
  const data = {
    colon: 'a: b', hash: 'x # y', bracket: '[not a list', comma: '1,2', digits: '42', empty: '',
    padded: ' padded ', quote: '"quoted', wrapped: '"x"', listlike: '[]',
  };
  const back = parse(serialize(data, '')).data;
  assert.deepEqual(back, data);
  assert.equal(typeof back.digits, 'string');
  assert.deepEqual(parse(serialize({ tags: [''] }, '')).data, { tags: [''] });
});

test('serialize quotes a string holding a colon, a hash, a bracket or a comma', () => {
  assert.equal(serialize({ a: 'x: y', b: 'x # y', c: '[x', d: '1,2' }, ''), '---\na: "x: y"\nb: "x # y"\nc: "[x"\nd: "1,2"\n---\n');
});

test('serialize writes LF and always writes both fences', () => {
  assert.equal(serialize({ stage: 'intent' }, 'a\r\nb\r\n'), '---\nstage: intent\n---\na\nb\n');
  assert.deepEqual(parse(serialize({}, '---\nrule\n')), { data: {}, body: '---\nrule\n' });
});

test('serialize refuses a value containing a line break, naming the key', () => {
  for (const words of ['yes\nand no', 'yes\rand no', 'yes\u2028and no', 'yes\u2029and no']) {
    refused(() => serialize({ words }, ''), /"words"/, /one line/);
  }
});

test('serialize refuses what flat frontmatter cannot hold, naming the key', () => {
  refused(() => serialize({ Stage: 'intent' }, ''), /"Stage"/);
  refused(() => serialize({ route: { frame: 'full' } }, ''), /"route"/);
  refused(() => serialize({ version: 1.5 }, ''), /"version"/, /whole number/);
  refused(() => serialize({ version: -1 }, ''), /"version"/, /whole number/);
  refused(() => serialize({ carry: [1] }, ''), /"carry"/);
});

test('serialize refuses a list item holding a double quote, naming the key', () => {
  refused(() => serialize({ carry: ['say "hi"'] }, ''), /"carry"/, /double quote/);
});

test('a blank value over a whitespace-only line is the empty string', () => {
  assert.deepEqual(parse('---\napproved:\n   \nstage: intent\n---\n').data, { approved: '', stage: 'intent' });
});

test('a list with a double quote that is never closed is refused, naming the line', () => {
  refused(() => parse('---\nstage: intent\ntags: ["a, b]\n---\n'), /line 3/, /never closed/);
});

test('a list item with a double quote that does not wrap it is refused, naming the line', () => {
  refused(() => parse('---\ntags: [a"b", c]\n---\n'), /line 2/, /a"b"/);
  refused(() => parse('---\ntags: ["a" "b"]\n---\n'), /line 2/);
});

test('a list with an empty item is refused, naming the line; [] and [""] stay valid', () => {
  refused(() => parse('---\ntags: [a, b,]\n---\n'), /line 2/, /empty item/);
  refused(() => parse('---\ntags: [a,,b]\n---\n'), /line 2/, /empty item/);
  assert.deepEqual(parse('---\ntags: []\n---\n').data, { tags: [] });
  assert.deepEqual(parse('---\ntags: [""]\n---\n').data, { tags: [''] });
});

test('a number that would not read back as itself is refused, naming the line', () => {
  refused(() => parse('---\nid: 007\n---\n'), /line 2/, /"id"/, /quote/);
  refused(() => parse('---\nstage: intent\nid: 12345678901234567890\n---\n'), /line 3/, /quote/);
  assert.deepEqual(parse('---\nid: "007"\n---\n').data, { id: '007' });
});

test('a fence may carry trailing whitespace', () => {
  assert.deepEqual(parse('--- \nstage: intent\n---\t\nBody\n'), { data: { stage: 'intent' }, body: 'Body\n' });
});
