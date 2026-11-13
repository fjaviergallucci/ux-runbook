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
