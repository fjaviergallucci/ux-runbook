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

test('a digits-only value with a leading zero or beyond the safe range is refused, naming the line', () => {
  refused(() => parse('---\nid: 007\n---\n'), /line 2/, /"id"/, /quote/);
  refused(() => parse('---\nstage: intent\nid: 12345678901234567890\n---\n'), /line 3/, /quote/);
  refused(() => parse('---\nid: 9007199254740992\n---\n'), /line 2/, /"id"/, /quote/);
  assert.deepEqual(parse('---\nid: "007"\n---\n').data, { id: '007' });
});

test('an unquoted list item holding a bracket is refused, naming the line; a quoted one may', () => {
  refused(() => parse('---\nstage: intent\ntitle: [a] and [b]\n---\n'), /line 3/, /bracket/);
  refused(() => parse('---\ntags: [a[b, c]\n---\n'), /line 2/, /bracket/);
  refused(() => parse('---\ntags: [a]b, c]\n---\n'), /line 2/, /bracket/);
  assert.deepEqual(parse('---\ntags: ["[a]", b]\n---\n').data, { tags: ['[a]', 'b'] });
});

test('serialize quotes a list item holding a closing bracket', () => {
  const data = { tags: ['a]', 'b'] };
  assert.equal(serialize(data, ''), '---\ntags: ["a]", b]\n---\n');
  assert.deepEqual(parse(serialize(data, '')).data, data);
});

test('a fence may carry trailing whitespace', () => {
  assert.deepEqual(parse('--- \nstage: intent\n---\t\nBody\n'), { data: { stage: 'intent' }, body: 'Body\n' });
});

// R170 of the dry run: a stamp wrote `words: "Approved. One remark: "right now" means …"`, which the kit read
// back and a YAML reader refused. What serialize writes is also YAML: two quoted forms, and no escapes in either.

test('serialize writes a value that holds a double quote in single quotes, each single quote inside it doubled', () => {
  const written = data => serialize(data, '').split('\n').slice(1, -2);
  assert.deepEqual(
    written({
      remark: 'Approved. One remark: "right now" means the next hour',
      both: 'She said "it\'s fine", twice',
      plain: 'say "hi" now',
      opens: '"quoted',
      wrapped: '"x"',
      alone: '"',
    }),
    [
      'remark: \'Approved. One remark: "right now" means the next hour\'',
      'both: \'She said "it\'\'s fine", twice\'',
      'plain: \'say "hi" now\'',
      'opens: \'"quoted\'',
      'wrapped: \'"x"\'',
      'alone: \'"\'',
    ],
  );
  // A backslash is an escape inside YAML's double quotes and plain text inside its single ones.
  assert.deepEqual(written({ path: 'C:\\rooms, today', free: 'a\\b' }), ["path: 'C:\\rooms, today'", 'free: a\\b']);
  // Without a double quote or a backslash, a value that needs quotes is wrapped in double quotes, as it always was.
  assert.deepEqual(written({ a: 'x: y', b: "it's here, now", c: '' }), ['a: "x: y"', 'b: "it\'s here, now"', 'c: ""']);
});

test('parse reads a value in single quotes, two single quotes inside it as one; nothing else is an escape', () => {
  const read = line => parse(`---\n${line}\n---\n`).data;
  assert.deepEqual(read('words: \'Approved. One remark: "right now" means the next hour\''), { words: 'Approved. One remark: "right now" means the next hour' });
  assert.deepEqual(read("words: 'She said \"it''s fine\"'"), { words: 'She said "it\'s fine"' });
  assert.deepEqual(read("words: ''"), { words: '' });
  assert.deepEqual(read("words: ''''"), { words: "'" });
  assert.deepEqual(read("words: 'a''''b'"), { words: "a''b" });
  assert.deepEqual(read("path: 'C:\\rooms\\n'"), { path: 'C:\\rooms\\n' });
  // What is inside quotes is text: not a number, not a list.
  assert.deepEqual(read("id: '007'"), { id: '007' });
  assert.deepEqual(read("id: '42'"), { id: '42' });
  assert.deepEqual(read("title: '[a, b]'"), { title: '[a, b]' });
  // A single quote that does not wrap the whole value, or is not doubled inside it, is no quoted form:
  // the value is read as it is written, as it was before there was one.
  assert.deepEqual(read("words: 'yes' and 'no'"), { words: "'yes' and 'no'" });
  assert.deepEqual(read("words: 'tis so"), { words: "'tis so" });
  assert.deepEqual(read("words: it's"), { words: "it's" });
  assert.deepEqual(read("words: '"), { words: "'" });
  assert.deepEqual(read("words: 'a'b'"), { words: "'a'b'" });
  assert.deepEqual(read("words: '''"), { words: "'''" });
  // What an earlier stamp wrote is still read as it was: double quotes wrap the value as it is.
  assert.deepEqual(read('words: "Approved. One remark: "right now" means the next hour"'), { words: 'Approved. One remark: "right now" means the next hour' });
  assert.deepEqual(read('words: ""quoted"'), { words: '"quoted' });
  assert.deepEqual(read('words: "it\'s here, now"'), { words: "it's here, now" });
});

test('serialize quotes a value that YAML would not read as plain text: one that opens with one of its marks', () => {
  const written = value => serialize({ words: value }, '').split('\n')[1].slice('words: '.length);
  // … or that a YAML reader keeps for itself (= and <<), or stumbles on (a tab).
  const quoted = ["'tis so", "'yes'", '*approved*', '&go', '!yes', '|go', '> go', '%go', '@desk says yes', '`npm test` passes', '{go}', '}go', ']go', '- yes', '? yes', '-', '?', '=', '<<', 'yes\tgo'];
  for (const value of quoted) assert.equal(written(value), `"${value}"`, value);
  for (const value of ['-yes', '?yes', 'a - b', 'yes?', "it's", 'a*b', 'a > b', 'go!', '50%', 'a@b', 'a{b}c', 'a]b', 'sí continúa', 'a = b', '==', '<', '<<<']) assert.equal(written(value), value, value);
  const all = Object.fromEntries([...quoted, 'say "hi"', "'say' \"hi\"", 'a\\b: c', "'"].map((value, i) => [`k${i}`, value]));
  assert.deepEqual(parse(serialize(all, '')).data, all);
});

test('a list item that opens with one of YAML\'s marks, or holds a brace or a question mark, is wrapped in double quotes, its one quoted form; one holding a double quote is still refused', () => {
  const data = { tags: ["'c", '*b', '- d', 'a{b}', '}', 'plain', "it's", 'free?', 'a\\b, c', 'a\\b'] };
  assert.equal(serialize(data, ''), '---\ntags: ["\'c", "*b", "- d", "a{b}", "}", plain, it\'s, "free?", "a\\b, c", a\\b]\n---\n');
  assert.deepEqual(parse(serialize(data, '')).data, data);
  refused(() => serialize({ tags: ['say "hi"'] }, ''), /"tags"/, /double quote/);
  // A list item has the one quoted form: single quotes are part of the item.
  assert.deepEqual(parse("---\ntags: ['a', b]\n---\n").data, { tags: ["'a'", 'b'] });
});

test('the header of the library says what the grammar is: a subset of YAML, and its two quoted forms', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../scripts/lib/frontmatter.mjs', import.meta.url), 'utf8');
  const header = source.slice(0, source.indexOf('\nexport ')).replace(/\n\/\/ ?/g, ' ').replace(/\s+/g, ' ');
  for (const said of ['a subset of YAML', 'in double quotes', 'in single quotes', 'each single quote inside it doubled', 'no escapes']) assert.ok(header.includes(said), said);
  assert.doesNotMatch(header, /quotes only wrap a value/);
});
