# Task 1 report: the flat frontmatter library

**Status:** DONE_WITH_CONCERNS (minor: three small behaviours added on top of the brief, listed below)
**Commit:** `ee467c4 feat: flat frontmatter parser shared by cards, stage outputs and the profile` on
`v2-pipeline` (parent `59f2c81`). Staged by explicit path. Not pushed.

## What I implemented

`scripts/lib/frontmatter.mjs` (103 lines), with the three exports the brief names:

- `parse(text) -> { data, body }`
  - CRLF is turned into LF first, so `data` **and** `body` come out identical for CRLF and LF input
    (Task 2 hashes the body, so the body has to be normalised too).
  - Frontmatter exists only if line 1 is exactly `---`. Otherwise the whole text is body and `data` is `{}`.
  - It closes at the next line that is exactly `---`. Everything after that line is the body.
  - Each header line must match `^([a-z][a-z0-9-]*):(.*)$`. Blank lines inside the header are skipped.
  - Values follow the brief's order:
    - `[...]` is a list: split on commas outside double quotes, each item trimmed and unquoted. `[]` and
      `[ ]` give `[]`.
    - A value wrapped in double quotes is unquoted (only the outer pair comes off).
    - A value of digits only becomes a `Number`.
    - Anything else is the trimmed string.
  - Refusals, all `FrontmatterError`, each message starting `line N:`:
    - a line that is not `key: value` (an indented or nested line, a missing colon, a bad key);
    - **a key with no value.** This is what makes `route:` + `  frame: full` fail at **line 2**, as the
      test requires. In YAML a bare `key:` opens a nested map or block list. The message tells the
      writer to use `key: ""` for an empty string.
    - a key that appears twice;
    - a header opened on line 1 that is never closed (named as line 1).
- `serialize(data, body = '')`
  - Writes `---`, then one `key: value` per entry in insertion order, then `---`, then the body.
  - LF only: a CRLF body is converted.
  - The fences are always written, even for `{}`, so a body that itself starts with `---` round-trips.
  - Lists are written as `[a, b]`.
  - It quotes a string that contains `:`, `#`, `[` or `,` (the brief's rule). It also quotes any string
    that would not read back as itself unquoted: an empty string, digits only, leading or trailing
    space, or a leading `"`.
  - Refuses with `FrontmatterError` (naming the key) anything it cannot write flat:
    - a key that fails `^[a-z][a-z0-9-]*$`;
    - a value that is not a string, a whole number of zero or more, or a list of strings (so nested
      objects are refused);
    - a value containing a newline;
    - a list item containing `"`.
- `class FrontmatterError extends Error` (sets `name = 'FrontmatterError'`).

`tests/frontmatter.test.mjs` holds the brief's six tests, copied verbatim.

## Tests and results

- Focused: `node --test tests/frontmatter.test.mjs` gives 6 tests, 6 pass, 0 fail.
- Full suite: `npm test` gives 11 tests (6 here plus the 5 skeleton tests), 11 pass, 0 fail.
- Extra edge probes were not committed, because the brief fixes the count at 6 tests. They ran as a
  scratch script against the module: 26 probes, all passed. They cover:
  - round-trips of `'123'`, `''`, `'  x '`, `'"x'`, `'say "hi"'`, `'[a, b]'`, dates, `a#b`, `k: v`;
  - list items that hold commas, digits or are empty;
  - `{}`, and a body that opens with `---`;
  - a CRLF body written back as LF;
  - `"2"` staying a string;
  - blank header lines;
  - a closing fence at end of file with no newline;
  - refusals (with the line named) for an indented line (line 3), a block list (`carry:` then `- a`,
    line 2), a bad key, a duplicate key, an unclosed header, and CRLF input (same line numbers as LF);
  - serialize refusals for a bad key, a newline, a nested object, `1.5` and `-1`, a non-string list
    item, and a quote in a list item.
- Running `serialize(parse(doc))` on the brief's `doc` gives back the original text byte for byte.
- Both new files contain 0 CR bytes.

## TDD evidence

**RED.** `node --test tests/frontmatter.test.mjs` failed with exit 1, which was expected because the
module did not exist yet:

```
# Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/lib/frontmatter.mjs' imported from /mnt/data/Downloads/Proyectos/ux-runbook-v2/tests/frontmatter.test.mjs
not ok 1 - /mnt/data/Downloads/Proyectos/ux-runbook-v2/tests/frontmatter.test.mjs
# tests 1
```

**GREEN.** `node --test tests/frontmatter.test.mjs` passed with exit 0:

```
ok 1 - parses scalars, integers, inline lists and quoted strings
ok 2 - round-trips
ok 3 - a file with no frontmatter is all body
ok 4 - CRLF input parses the same as LF
ok 5 - nested values are refused, naming the line
ok 6 - an empty list parses as an empty array
# tests 6
# pass 6
# fail 0
```

`npm test` passed with exit 0: `# tests 11`, `# pass 11`, `# fail 0`.

## Files changed

- `scripts/lib/frontmatter.mjs` (new)
- `tests/frontmatter.test.mjs` (new)

## Self-review: concerns for the controller

1. **A bare `key:` is refused, not read as `''`.** The brief says "anything else is the trimmed string",
   which would make it `''`. But the nested-value test needs the error at line 2, the `route:` line, so
   the empty value itself has to be refused. Consequence for Task 2: a draft header cannot leave a field
   blank as `approved:`. It must leave the key out or write `approved: ""`. `serialize` writes `''` as
   `""`, so anything the library writes reads back.
2. **Extras beyond the brief's letter:**
   - refusing duplicate keys;
   - refusing an unclosed header;
   - `serialize` refusing values it cannot write flat;
   - `serialize` quoting strings that would not round-trip.

   Each is a line or two. They exist so that a header can never be silently misread: a duplicate
   `status`, for example, could make a stage look approved. None of them has a committed test, because
   the brief fixes the count at 6. If you want them covered, or removed, say which.
3. **A known limit, by design: the format has no escapes.** A list item holding a `"` cannot be written,
   and `serialize` refuses it. A hand-written list with a stray quote, such as `[5" screen, b]`, is
   misread by `parse` as one item. Top-level strings with quotes are fine, because only the outer pair
   is stripped.
4. **Not handled: a UTF-8 BOM before line 1.** That file reads as all body, with no frontmatter. In
   Task 2 that would show up as a visible `bad-header`, not a silent error. I left it alone because it
   was not asked for.

---

# Fix report: the controller's rulings on the four concerns

**Status:** DONE
**Commit:** `2d74a12 fix: frontmatter accepts blank values and a byte-order mark; tests for every refusal`
on `v2-pipeline` (parent `ee467c4`). Staged by explicit path. Not pushed.

## What changed in `scripts/lib/frontmatter.mjs`

1. **Empty value.** `key:` with nothing after the colon now parses as `''`. The one exception is when the
   next line is indented (a space or a tab). Then `parse` throws a `FrontmatterError` naming the key's
   line and the key: `line N: "route" has a nested value below it; frontmatter is flat, so write the
   value on this line (lists inline as [a, b])`.
   - `serialize` still writes `''` as `key: ""`. I kept that because it is unambiguous to any YAML
     reader, where a bare `key:` means null. Test 16 proves it round-trips.
   - A YAML block list (`carry:` and then `- frame@1` at column 0) now reads `carry` as `''` and is
     refused at the `- frame@1` line, line 3. The generic message now says "lists inline as [a, b]",
     so that refusal tells the writer what to do.
2. **Byte-order mark.** `parse` strips one leading U+FEFF before anything else. A file with no header
   also loses the mark from its body. The source uses the ASCII escape `﻿` (see the note below).
3. **Extras kept.** Each one now has a committed test, and every refusal names the line or the key.
4. **Double quote in a list item.** It is still refused. The comment at the top of the module now
   states the format's limits: flat keys matching `^[a-z][a-z0-9-]*$`; a string, a whole number or an
   inline list of strings; nothing nested; no escapes, so a list item cannot hold a `"`.

The module is now 106 lines (it was 103).

## Tests added to `tests/frontmatter.test.mjs`

The brief's six tests are unchanged. Fourteen new ones (numbers 7 to 20), which share a
`refused(fn, ...patterns)` helper. It asserts `instanceof FrontmatterError` and that every pattern
matches the message.

| # | Test | What it pins |
|---|------|--------------|
| 7 | a key with nothing after the colon is the empty string | `approved:` and `words:` both read as `''` |
| 8 | a blank value with an indented line below it is refused, naming the key and its line | line 3 and `"route"`, so the line number is not a constant 2 |
| 9 | a byte-order mark is ignored and never reaches the body | the mark plus a header, and the mark with no header |
| 10 | a byte-order mark with CRLF parses the same as plain LF | both together |
| 11 | a duplicate key is refused, naming the key and its line | line 3 and `"status"` |
| 12 | a header that is never closed is refused, naming its opening line | line 1 and the words "never closed" |
| 13 | a line that is not key: value is refused, naming the line | a bad key, a line with no colon, an indented line under a value, and a block list item |
| 14 | blank lines inside the header are skipped | |
| 15 | a quoted list item may hold a comma | both the parse and the round-trip |
| 16 | strings that need quoting come back as themselves | see below |
| 17 | serialize writes LF and always writes both fences | a CRLF body comes out as LF; `{}` with a body opening `---` round-trips |
| 18 | serialize refuses a value containing a newline, naming the key | |
| 19 | serialize refuses what flat frontmatter cannot hold, naming the key | a bad key, a nested object, `1.5`, `-1`, a non-string list item |
| 20 | serialize refuses a list item holding a double quote, naming the key | |

Test 16 round-trips each of these and checks that `'42'` comes back as a string, not a number:

- `a: b`
- `x # y`
- `[not a list`
- `1,2`
- `42`
- `''` (the empty string)
- `' padded '`
- `'"quoted'`

## RED

Command: `node --test tests/frontmatter.test.mjs`, run against the old module (`ee467c4`). Result:
exit 1, 16 pass, 4 fail. All four failures were expected:

```
not ok 7 - a key with nothing after the colon is the empty string
  error: 'line 3: "approved" has no value; nested values are refused (write approved: "" for an empty string)'
not ok 9 - a byte-order mark is ignored and never reaches the body
not ok 10 - a byte-order mark with CRLF parses the same as plain LF
not ok 13 - a line that is not key: value is refused, naming the line
    FrontmatterError: line 2: "carry" has no value; nested values are refused (write carry: "" for an empty string)
```

Tests 8, 11, 12 and 14 to 20 already passed. They cover behaviour that `ee467c4` already had, and before
this commit none of it had a test.

## GREEN

`node --test tests/frontmatter.test.mjs` exits 0:

```
# tests 20
# pass 20
# fail 0
```

`npm test` exits 0:

```
# tests 25
# pass 25
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

The output is clean: no warnings, nothing deprecated, no `not ok`. Both files contain 0 CR bytes.

## A self-caught slip, fixed before the final commit

My editing tools wrote the U+FEFF character itself wherever I had typed the escape `﻿`. That
happened once in the module's regex and three times in the tests. The behaviour was correct, but an
invisible character in source is a trap: an editor that strips it would silently delete both the BOM
handling and what the tests check.

- I replaced every one with the ASCII escape `﻿` at byte level (`perl`), then folded the change
  into this same commit with `--amend`. The commit was mine and unpushed.
- Neither file now holds any non-ASCII except the brief's verbatim `sí, continúa`.
- Mutation check: a scratch copy of the module without the BOM strip fails exactly tests 9 and 10
  (18 pass, 2 fail). So those two tests do catch a missing strip.

---

# Fix report, review round 1: one Important, six Minor

**Status:** DONE
**Commit:** `fa24eb1 fix: frontmatter pins its quoting rule in tests and refuses what it would misread`
on `v2-pipeline` (parent `2d74a12`). This is a new commit; nothing earlier was amended. Staged by
explicit path. Not pushed.

## What changed, and the test that covers each change

**IMPORTANT 1: the tests now pin the quoting rule.**
- Test 16 adds `wrapped: '"x"'` and `listlike: '[]'` to its round-trip data, and adds
  `assert.deepEqual(parse(serialize({ tags: [''] }, '')).data, { tags: [''] })`.
- New test 17, "serialize quotes a string holding a colon, a hash, a bracket or a comma", checks the
  reviewer's exact text, character for character.
- The module did not change for this item.

**MINOR 1: U+2028 and U+2029.**
- `writeString` now refuses `/[\r\n  ]/`.
- Test 19, now named "serialize refuses a value containing a line break, naming the key", loops over
  `\n`, `\r`, ` ` and ` `.
- Every `\u` in the source is the ASCII escape. I wrote placeholders and turned them into escapes at
  byte level with `perl`, because last round my tools wrote typed escapes as the literal characters.
- Neither file now holds any non-ASCII except the brief's verbatim `sí, continúa`.

**MINOR 2: whitespace-only line under a blank value.**
- A blank value counts as nested only if the next line is indented **and** not blank once trimmed.
- New test 22: `approved:` followed by a line of spaces, then `stage: intent`, gives
  `{ approved: '', stage: 'intent' }`.

**MINOR 3: `readList` refuses what it would misread.**
- `readList(inner, at)` now receives the line label. A new `readItem(item, at)` does the per-item checks.
- Each refusal names the line:
  - **A quote never closed:** "a double quote in the list is never closed". New test 23 uses
    `["a, b]` on line 3.
  - **A quote that does not wrap the whole item:** the message quotes the item. New test 24 uses
    `[a"b", c]` and `["a" "b"]`.
  - **An empty unquoted item.** New test 25 refuses `[a, b,]` and `[a,,b]`, and keeps `[]` as `[]`
    and `[""]` as `['']`.

**MINOR 4: digits-only values that change value.**
- `readValue(value, at, key)` refuses any value where `String(Number(value)) !== value`. The message
  names the line and the key, and says how to fix it: ``line 2: "id" would not read back as 007 (a
  leading zero or too many digits); quote it to keep it as text: id: "007"``.
- **Addition beyond the ruling:** it also refuses when `!Number.isSafeInteger(number)`. That keeps
  `parse` consistent with `serialize`, which already refuses unsafe integers. Without it, a value
  such as 2^60, whose decimal form happens to be exact, would read but could never be written back.
- New test 26: `007` is refused (line 2, `"id"`, "quote"); a 20-digit value is refused (line 3,
  "quote"); `"007"` reads as the string `'007'`.

**MINOR 5: fences with trailing whitespace.**
- A new `isFence(line)` compares `line.trimEnd()` with `---`, and both fences use it. The closing
  fence is found with `findIndex`.
- New test 27: `--- ` and `---\t` give `{ data: { stage: 'intent' }, body: 'Body\n' }`.

**MINOR 6: the key grammar is written once.**
- `KEY_GRAMMAR = '[a-z][a-z0-9-]*'`, and `KEY` and `ENTRY` are both built from it with `new RegExp`.
- `serialize`'s bad-key message now prints `KEY.source`, so the grammar is not written a third time.
- Tests 13 (parse) and 20 (serialize) still cover the bad-key refusals.

The module is now 124 lines (it was 106). The test file has 27 tests: the brief's six, unchanged and
verbatim, plus 21 more.

## RED

Command: `node --test tests/frontmatter.test.mjs`, with the new tests run against the module at
`2d74a12`. Result: exit 1, 20 pass, 7 fail.

- Tests 16 and 17 (the IMPORTANT additions) **passed**, as the ruling requires: they hold today.
- Each of the seven failures belongs to one minor:

```
not ok 19 - serialize refuses a value containing a line break, naming the key
  error: 'Missing expected exception.'
not ok 22 - a blank value over a whitespace-only line is the empty string
  error: 'line 2: "approved" has a nested value below it; frontmatter is flat, so write the value on this line (lists inline as [a, b])'
not ok 23 - a list with a double quote that is never closed is refused, naming the line
  error: 'Missing expected exception.'
not ok 24 - a list item with a double quote that does not wrap it is refused, naming the line
  error: 'Missing expected exception.'
not ok 25 - a list with an empty item is refused, naming the line; [] and [""] stay valid
  error: 'Missing expected exception.'
not ok 26 - a number that would not read back as itself is refused, naming the line
  error: 'Missing expected exception.'
not ok 27 - a fence may carry trailing whitespace
  error: Expected values to be strictly deep-equal
```

## GREEN

`node --test tests/frontmatter.test.mjs` exits 0:

```
# tests 27
# pass 27
# fail 0
```

`npm test` exits 0:

```
# tests 32
# pass 32
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

The output is clean: no warnings, nothing deprecated, no `not ok`. Both files contain 0 CR bytes.

## The four mutation results

Method: copy the module into a scratch tree, delete one clause of `needsQuotes` from the copy with
`perl`, and run the committed test file against it with
`node --test <scratch>/tests/frontmatter.test.mjs`. Each run first checked that the copy really differed
from the original.

| Clause deleted | Result | What catches it |
|---|---|---|
| `\|\| s.startsWith('"')` | 26 pass, **1 fail**: test 16 | `wrapped` comes back as `'x'` instead of `'"x"'` |
| `\[` in the character class | 25 pass, **2 fail**: tests 16 and 17 | `listlike` comes back as `[]` instead of `'[]'`; the exact text has `c: [x` instead of `c: "[x"` |
| `\|\| s === ''` | 26 pass, **1 fail**: test 16 | the `tags: ['']` assertion: it comes back as `[]` |
| `:` in the character class | 26 pass, **1 fail**: test 17 | the exact-text assertion |
| `#` in the character class | 26 pass, **1 fail**: test 17 | the exact-text assertion |

Every clause the reviewer named now has a test that fails without it.

---

# Fix report, review round 2: one Important, two Minor

**Status:** DONE
**Commit:** `bcd7b44 fix: frontmatter pins the safe-integer refusal and refuses brackets inside an unquoted list item`
on `v2-pipeline` (parent `fa24eb1`). This is a new commit; nothing was amended. Staged by explicit
path. Not pushed.

## What changed, and the test that covers each change

**IMPORTANT: the safe-integer refusal is now pinned.**
- Test 26, renamed "a digits-only value with a leading zero or beyond the safe range is refused,
  naming the line", gains the reviewer's assertion:
  `refused(() => parse('---\nid: 9007199254740992\n---\n'), /line 2/, /"id"/, /quote/)`.
- That value is 2^53. Its decimal form reads back exactly, so only `!Number.isSafeInteger(number)`
  refuses it. The mutation result below shows this.

**MINOR: the message is now true in both cases.**
- It now reads:
  ``line N: "<key>" cannot be a number as written (a leading zero, or above 9007199254740991); quote it to keep it as text: <key>: "<value>"``.
- For a value made only of digits, that parenthesis is exactly the refusal condition:
  - a safe integer whose `String()` differs from its text must have a leading zero;
  - a value that is not a safe integer is above `Number.MAX_SAFE_INTEGER`.
- The bound is printed from `Number.MAX_SAFE_INTEGER`, not typed in by hand.
- What it prints for each refused value:

```
line 2: "id" cannot be a number as written (a leading zero, or above 9007199254740991); quote it to keep it as text: id: "9007199254740992"
line 2: "id" cannot be a number as written (a leading zero, or above 9007199254740991); quote it to keep it as text: id: "007"
```

**MINOR: a bracket inside an unquoted list item.**
- `readItem` now refuses an unquoted item that holds `[` or `]`, naming the line:
  ``line 2: list item a] and [b holds a bracket; quote the item, or quote the whole value if it is not a list``.
- A quoted item may hold brackets.
- New test 27: `title: [a] and [b]` is refused (`line 3`, `bracket`), and `tags: ["[a]", b]` reads
  as `['[a]', 'b']`.

**A consequence I had to handle (not in the ruling).**
- Before this commit, `serialize` wrote the list item `a]` bare, as `[a]]`. The `[` was already in the
  quoting rule, but `]` was not. The new refusal would then reject what `serialize` had just written.
- Fix: a list item is now written with `itemNeedsQuotes = s => needsQuotes(s) || s.includes(']')`.
  `writeString` takes the quoting rule as a third parameter (default `needsQuotes`), and `writeItem`
  passes `itemNeedsQuotes`.
- Top-level strings are unchanged: a `]` there still goes unquoted, so test 17's exact text holds.
- New test 28: `serialize({ tags: ['a]', 'b'] })` writes exactly `---\ntags: ["a]", b]\n---\n` and
  round-trips.

The module is now 130 lines (it was 124). The test file has 29 tests, with the brief's six unchanged.

## RED

Command: `node --test tests/frontmatter.test.mjs`, with the new tests run against the module at
`fa24eb1`. Result: exit 1, 27 pass, 2 fail.

```
not ok 27 - an unquoted list item holding a bracket is refused, naming the line; a quoted one may
  error: 'Missing expected exception.'
not ok 28 - serialize quotes a list item holding a closing bracket
    + '---\ntags: [a], b]\n---\n'
    - '---\ntags: ["a]", b]\n---\n'
```

Test 26's new 2^53 assertion passed at RED, as expected: the clause it pins was already in the code.
The mutation run below is what shows it pins that clause.

## GREEN

`node --test tests/frontmatter.test.mjs` exits 0:

```
# tests 29
# pass 29
# fail 0
```

`npm test` exits 0:

```
# tests 34
# pass 34
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

The output is clean: no warnings, nothing deprecated, no `not ok`.

- Both files contain 0 CR bytes.
- The module holds no non-ASCII bytes.
- The `﻿`, ` ` and ` ` escapes are still ASCII. I left those lines out of every edit.

## Mutation results

Method: copy the module into `<scratchpad>/mut3/scripts/lib/`, outside the worktree, change it there
with `perl`, and run the committed test file with `node --test <scratchpad>/mut3/tests/frontmatter.test.mjs`.
Each run first printed the line that differs from the original. After the runs, `git status` showed
the worktree with only the two intended files modified.

| Mutant | Changed line | Result |
|---|---|---|
| **safe-integer clause deleted** (the one required) | `if (String(number) !== value) {` | 28 pass, **1 fail**: test 26 |
| bracket refusal disabled | `if (false) {` | 28 pass, **1 fail**: test 27 |
| item `]` quoting removed | `const itemNeedsQuotes = needsQuotes;` | 28 pass, **1 fail**: test 28 |

---

# Fix report, review round 3: one Important, one Minor

**Status:** DONE
**Commit:** `03958df test: pin each half of the bracket refusal in list items` on `v2-pipeline` (parent
`bcd7b44`). This is a new commit; nothing was amended. Staged by explicit path. Not pushed. Only the
two items below changed.

## What changed

- **IMPORTANT.** Test 27 in `tests/frontmatter.test.mjs` ("an unquoted list item holding a bracket is
  refused, naming the line; a quoted one may") gains exactly the two given assertions, as lines 146
  and 147:
  - `refused(() => parse('---\ntags: [a[b, c]\n---\n'), /line 2/, /bracket/)`
  - `refused(() => parse('---\ntags: [a]b, c]\n---\n'), /line 2/, /bracket/)`
- **MINOR.** The limits comment at the top of `scripts/lib/frontmatter.mjs` now ends: "...so a list
  item cannot hold a `"`); an unquoted list item cannot hold `[` or `]` (quote it)."
- No code changed. The module is still 130 lines; only line 4 (the comment) was edited.

## Tests: command and output

Both new assertions passed against the code at `bcd7b44`, because the full `[[\]]` class already
refuses both inputs. What they add is shown by the mutation results below.

`node --test tests/frontmatter.test.mjs` exits 0:

```
# tests 29
# pass 29
# fail 0
```

`npm test` exits 0:

```
# tests 34
# pass 34
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

The output is clean: no warnings, nothing deprecated, no `not ok`. Both files contain 0 CR bytes, and
the module holds no non-ASCII bytes.

## The two mutation results

Method: copy the module into `<scratchpad>/mut4/scripts/lib/`, outside the worktree. Narrow the
character class in `readItem` there with `perl`, and run the committed test file with
`node --test <scratchpad>/mut4/tests/frontmatter.test.mjs`. After the runs, `git status` showed only
the two intended files modified in the worktree.

Each run printed the mutated line, and the failure stack named the assertion that tripped:

| Mutant | Mutated line | Result | Failing assertion |
|---|---|---|---|
| class narrowed to `]` alone | `if (!isQuoted(item) && /\]/.test(item)) {` | 28 pass, **1 fail** (test 27) | line 146, `tags: [a[b, c]` |
| class narrowed to `[` alone | `if (!isQuoted(item) && /\[/.test(item)) {` | 28 pass, **1 fail** (test 27) | line 147, `tags: [a]b, c]` |

So each half of the bracket class is now pinned by an assertion of its own.
