### Task 1: The flat frontmatter library

**Files:**
- Create: `scripts/lib/frontmatter.mjs`
- Test: `tests/frontmatter.test.mjs`

**Interfaces:**
- Produces: `parse(text: string): { data: Record<string, string | number | string[]>, body: string }` ·
  `serialize(data, body): string` · `class FrontmatterError extends Error` (its message names the line).

- [ ] **Step 1: Write the failing tests:**

```js
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
```

- [ ] **Step 2: Run them.** `node --test tests/frontmatter.test.mjs` → FAIL (module not found).
- [ ] **Step 3: Implement the three exports.** Keys match `^[a-z][a-z0-9-]*$`. A value of digits only is
  a number; `[…]` is a list split on commas with each item trimmed and unquoted; a double-quoted value is
  unquoted; anything else is the trimmed string. `serialize` quotes a string that contains `:`, `#`, `[`
  or a comma, and writes LF.
- [ ] **Step 4: Run them.** → PASS (6 tests).
- [ ] **Step 5: Commit.** `git commit -am "feat: flat frontmatter parser shared by cards, stage outputs and the profile"`
  (add the new files first).

