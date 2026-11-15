# Task 4 report: Drawing a proposal

**Status:** DONE_WITH_CONCERNS (the concerns are readings where the brief and rulings were silent; none blocks)
**Commit:** `2e9401d feat: render draws a proposal in the shared kit` on `v2-pipeline`

## What I implemented

`scripts/render.mjs`, one file:

- **`renderProposal(proposal, { letter })`** is pure: a proposal goes in and a whole HTML document comes out as a string. It
  draws in exactly the markup of `kit/KIT-CONTRACT.md`:
  - the shell: `<!doctype html>`, `<meta charset="utf-8">`, the viewport meta, `<title>Option B</title>`,
    `<link rel="stylesheet" href="kit.css">`;
  - one header before the frames: `<h1>Option B: <name></h1>`, then a `<dl>` holding the bet, the cost
    ("Deliberately bad at"), `absent` as a `<ul>` ("Absent on purpose") and `hardest` ("In the hardest
    state"). It never draws `firstIdea` or any of `author`/`engine`/`track`/`model`/`source`;
  - one `<section class="ux-frame" data-screen="<id>">` per screen, in order: a caption `<header><h2>`,
    with the screen's note after the `<h2>`, then `<div class="ux-screen">` or `<div class="ux-dialog">`;
  - each role on the element the contract names, with `data-ux` exactly as the maker wrote it (repeats across
    frames are kept). A primary action is drawn as `class="ux-action is-primary"`. Options are a last-child `<ul>`. A note on an item is
    its next sibling `<p class="ux-note">`;
  - a region is a `<section>` and a group a `<div>`, each with a `<header>` label only when it has one. An
    expansion is a `<details>` that always has a `<summary>`, and carries `open` only when `open` is true.
- **One escape.** Every interpolation goes through a tagged template, `` html`…` ``. It escapes every value that
  is not markup the script itself made. So there is exactly one call site of `escape` (in `put`), and it covers
  text and attributes alike (`data-screen`, `data-ux` and the role-derived class names included).
  `escape` maps `& < > " '`. Non-ASCII text is written as is.
- **The CLI:** `node scripts/render.mjs <proposal.json> --kit <kit dir> --out <file.html> [--letter A]`.
  - It reads and checks everything before it writes anything. It makes the output folder (recursively), writes the page
    and copies `<kit dir>/kit.css` beside it byte for byte. On success it prints one line,
    `drew option B to <out>, with kit.css beside it`, which names the output and never the input.
  - Exit 0 on success.
  - Exit 1 on an invalid proposal: it prints `cannot draw <path>: it is not a valid proposal`, then each `validate` error on a line of its
    own, all to stderr. Exit 1 also on an unreadable input (`cannot read <path>: ENOENT`, `… it is not JSON (…)`, a kit
    without `kit.css`) and on an unwritable output (`cannot write <path>: EISDIR` / `ENOTDIR`). An unexpected error is
    rethrown with its stack, which also exits 1.
  - Exit 2 on bad usage, with the usage text. `--help`/`-h` prints the usage and exits 0.
    `--flag=value` works, and paths with spaces work.
  - It runs only when the file is executed (by comparing realpaths), never on import.

`tests/fixtures/render/every-part.json` covers every role and every container. It has:
- a labelled region and an unlabelled one, and a labelled group and an unlabelled one;
- one expansion with no `open`, one with `open: false` and one with `open: true`;
- notes on a screen and on items, a dialog, and `primary: false`;
- `free-count` on both screens, all five provenance keys and `firstIdea`;
- `Reunión — sala 3 🙂` and `<script>alert(1)</script>`.

`tests/fixtures/proposals/` is untouched.

## What I tested, and the results

`tests/render.test.mjs` has 26 tests: the brief's 8, each ruling's, and the CLI's.

| # | Test |
|---|---|
| 1 | the fixture is valid and holds every role, every container, and each way a container is written |
| 2 | the document shell: doctype, charset, viewport, kit.css link, title by letter |
| 3 | *(brief)* each screen's title is the caption of a `ux-frame` with `data-screen`, one per screen, in order, for all 4 fixtures |
| 4 | *(brief + R46)* the header, compared exactly: letter, name, bet, cost, absent, hardest; each once in the whole page |
| 5 | *(R46)* the first idea is never drawn: not its words, its start or its key, for all 4 fixtures |
| 6–10 | *(brief + R46)* one test per key `author`, `engine`, `track`, `model`, `source`: never its name, never its value |
| 11 | determinism: frozen input, the same bytes twice, the same bytes without provenance, with other makers or with keys reordered; no date |
| 12 | *(brief + ruling)* `data-ux="free-count"` on its part on both screens; every id in order, as written; never on a container |
| 13 | *(brief)* `ux-action is-primary` on primaries only; `primary: false` is a plain `ux-action` |
| 14 | the `today` frame compared exactly with markup written by hand from the contract: roles, nesting, labels, notes, expansions |
| 15 | *(brief)* the dialog frame compared exactly; `ux-dialog` replaces `ux-screen`; the screen it opens over is not drawn again |
| 16 | *(brief)* `<script>alert(1)</script>` is escaped and there is no `<script` anywhere |
| 17 | every one of the 44 strings in the fixture is replaced with hostile markup (`< > & ' "`); each appears escaped exactly once, except `firstIdea`, which appears 0 times |
| 18 | *(brief)* `Reunión — sala 3 🙂` is intact and `charset="utf-8"` is declared; no numeric character references except `&#39;` |
| 19 | `renderProposal` refuses an invalid proposal (message = every error) and any letter that is not `A`–`Z` |
| 20 | no `Verbato` or `Versa` in the script or the fixture |
| 21 | CLI success: paths with spaces, a folder that did not exist, the page byte-identical to `renderProposal`, kit.css byte-identical to *the given* kit, `--flag=value`, default letter A |
| 22 | CLI exit 1 on an invalid proposal: exact stderr (path line plus every error on its own line); nothing written |
| 23 | CLI exit 1 on a missing file, non-JSON, a kit without kit.css, an output that is a folder, and an output folder under a file; nothing written |
| 24 | CLI: an unexpected error prints with its stack and exits 1 |
| 25 | CLI exit 2 on 10 kinds of bad usage, with the usage text; nothing written |
| 26 | CLI `--help` / `-h`: usage, every flag, the exit codes |

**Results:** `node --test tests/render.test.mjs` passes 26/26. `npm test` passes 193/193 (0 fail). `tests/.tmp/` is empty
after a test run.

## TDD evidence

**RED 1:** `node --test tests/render.test.mjs` with no `scripts/render.mjs`. The file failed as a whole:
`ERR_MODULE_NOT_FOUND … scripts/render.mjs`, `# tests 1 # fail 1`. This was expected: the module did not exist yet.

**RED 2:** the same command, with a stub `export function renderProposal() { return ''; }`. It showed
`# tests 26 # pass 8 # fail 18`. The 8 that passed were the fixture check, the product-name guard, and the 6
"never drawn" tests, which pass trivially on an empty page. I then added "the page is drawn" assertions (a frame
per screen) to those 6, after which it showed `# tests 26 # pass 2 # fail 24`. Only the two checks that read files
rather than the drawing passed, as expected.

**GREEN:** `node --test tests/render.test.mjs` printed `# tests 26 # pass 26 # fail 0`. On the first green run one test
failed for a reason in the test, not the code: it dropped `firstIdea`, which the format requires. It now keeps the
key and changes its words.

## The hand mutations

I wrote a harness (`mutate.py` in my scratch folder, not committed). It applies one exact text replacement at a time
to a scratch copy of `scripts/render.mjs`, runs `tests/render.test.mjs`, and restores the file. Before the run, the
baseline failed 0 of 26. **118 mutations were run and all 118 were caught.** They covered:

- **The escape:** removing each of the 5 characters from the pattern, returning the string unchanged, not escaping
  in `put`, and an array escaped as text.
- **The letter and validation:** no `typeof` check, no check at all, an unanchored pattern, no validation in
  `renderProposal`.
- **The shell:** removing the doctype, the charset, the viewport, the link, or the letter in the title.
- **The header:** removing the letter, the name, the bet, the cost, the absent lines, the hardest state, or the
  whole header. Also adding `firstIdea`, or adding each provenance value and each provenance key name (5 + 5), or a
  "First idea" label.
- **Frames:** renaming `ux-frame`; dropping `data-screen`, the title, the screen note or the items; drawing a dialog
  as `ux-screen`; reversing the screens; drawing a screen twice.
- **Roles:** moving each of the 10 roles to another element. Dropping `type="button"`, `href="#"` or `is-primary`.
  Drawing `primary: false` as primary. Dropping the `ux-` prefix. Dropping `data-ux`, renaming it, or rewriting the id.
  Dropping, reversing or unwrapping the options. Dropping the text or the note. Renaming the note's class, or putting
  the note before its part.
- **Containers:** moving region, group and expansion to other elements. Never drawing `open`, or drawing it for
  `open: false`. A summary drawn as a header. Labels dropped, or added to unlabelled containers. Dropping the `ux-`
  prefix. Items dropped, reversed or not indented.
- **The CLI:**
  - kit.css: not copied, or copied from the grey kit instead of `--kit`;
  - the output folder: not made, made without `recursive`, or its mkdir failure not explained;
  - an invalid proposal: no validation, a message without the path, errors joined on one line;
  - reading: not-JSON passed through raw, every read error called "not JSON", a read failure not explained or
    without its path;
  - writing: a write failure not explained, the kit read after the page is written, the output folder made before
    validation;
  - exit codes: 1 and 2 swapped either way, a Failure printed to stdout, usage without the usage text, an
    unexpected error swallowed;
  - arguments: `--help` not printed or only honoured first, the default letter changed, no letter check, an empty or
    missing value accepted, a repeated flag, an unknown flag, the positional count, missing `--kit`/`--out`, no
    `--flag=value`;
  - the rest: no success line, the CLI running on import or never running, the page written as latin1, the usage
    text losing the default letter.

**Not pinned:**
- The `?? e.message` fallback in the read and write failure messages. Every fs error carries a `code`, so no input
  can reach the fallback.
- The attribute-escape path has no separate test of its own. It needs none, because it is the same single call site
  that the text tests pin. Validation also guarantees that ids are kebab-case before they reach an attribute.

## What the drawn document looks like

I screenshotted `every-part.json` drawn as option D, and `free-first.json` as B, headless at 1280×2000 and
390×2000.

- **1280 wide:**
  - The page opens with "Option D: Floors, free first" as a large heading. Under it, a plain definition list gives
    the bet, what it is deliberately bad at, the bulleted "absent on purpose" lines and the hardest state, all in
    browser defaults. Then the frames follow, each with its small grey caption and dashed-border italic note.
  - Inside the screen: the nav row, then the heading, then the status with its dot. The grey regions hold white
    groups; only "Book Room 2" is filled grey. Then the list rows with rules, a dashed media placeholder, two
    collapsed expansions showing only their labels, and `<script>alert(1)</script>` printed as literal text.
    "Reunión — sala 3 🙂" renders with its accent and its emoji.
  - The dialog sits centred on a darker grey backdrop under its own caption, with its expansion open.
- **390 wide:**
  - Nothing overflows sideways: the heading wraps to two lines, and the definition list's 40px default indent
    narrows the header text but keeps it readable.
  - The frames fill the width. Groups nest inside regions with their padding intact. The choice options sit side
    by side, and the dialog keeps a visible band of backdrop on either side.

## Smoke check (brief Step 5)

```
$ node scripts/render.mjs tests/fixtures/proposals/unified-list.json --kit kit/grey --out tests/.tmp/board/A.html --letter A   # exit 0
$ node scripts/render.mjs tests/fixtures/proposals/free-first.json   --kit kit/grey --out tests/.tmp/board/B.html --letter B   # exit 0
$ node scripts/render.mjs tests/fixtures/proposals/calendar.json     --kit kit/grey --out tests/.tmp/board/C.html --letter C   # exit 0
$ ls -l tests/.tmp/board/
-rwxrwxrwx 1 root root 2768 Nov 13 15:18 A.html
-rwxrwxrwx 1 root root 2992 Nov 13 15:18 B.html
-rwxrwxrwx 1 root root 3741 Nov 13 15:18 C.html
-rwxrwxrwx 1 root root 6153 Nov 13 15:18 kit.css
```

There are three `.html` files and one `kit.css`, and `cmp` shows the copied `kit.css` is identical to `kit/grey/kit.css`.

## Files changed

- `scripts/render.mjs` (new, 262 lines)
- `tests/render.test.mjs` (new, 26 tests)
- `tests/fixtures/render/every-part.json` (new)

All three use LF line endings.

## Self-review: findings, readings and concerns

Readings I made where the brief and rulings were silent. Each has a test:

1. **Letter.** `renderProposal` requires `letter` to be one capital `A`–`Z` and throws a `TypeError` otherwise.
   The CLI defaults to `A`: I read `[--letter A]` as showing the default, since the brief writes other
   placeholders in angle brackets. A bad `--letter` is bad usage (exit 2).
2. **`renderProposal` validates.** It throws a `TypeError` listing every error, so no caller can draw something
   outside the vocabulary. The CLI validates first, so its stderr shows the errors line by line.
3. **Exit 1 also covers an unwritable output** (`cannot write <path>: EISDIR` / `ENOTDIR`). The ruling named only
   an invalid proposal or an unreadable input; I treated a write failure as the same kind of operational failure.
   An unexpected error is rethrown with its stack, which also exits 1.
4. **`--help` / `-h`** was added for parity with `scripts/state.mjs`.
5. **The header is plain markup with no kit class:** `<header>`, `<h1>`, `<dl>`, `<ul>`. The contract allows
   "whatever the script puts before" the frames. `kit.css` styles none of it, so it renders in browser defaults,
   the same for every proposal. A project kit that styled bare `header` or `ul` would also restyle it; the
   contract's "styled by name only where this markup puts it" rules that out. The title is `Option B`, without the
   name, so the name appears once in the page.
6. **`<html>` has no `lang`.** The proposal's words may be in any language, while the header labels are English.
   I declared none rather than declare one wrongly.

Concerns for the controller:

- **A dialog's `over` is not visible on the board.** The contract gives a dialog's frame only its caption (title,
  note) and the backdrop, which stands for the screen. So the founder sees which screen a dialog opens over only
  if its title says so. I followed the contract; showing `over` (for example a line in the caption) would be a
  contract change.
- **Minor, unguarded:**
  - `--out …/kit.css` would be overwritten by the kit copy.
  - A proposal file that starts with a UTF-8 BOM is refused as "not JSON".
- **Test count:** the brief says "PASS (8 tests)". There are 26, because the rulings and the CLI each needed
  their own.

---

## Fix round 1: the controller's rulings

**Commit:** `68ffc78 fix: a dialog frame names the screen it opens over; render reads a file with a byte-order mark`

### Decisions (accepted as built)

- `renderProposal` validates its input and throws a `TypeError` that lists every error.
- `renderProposal` requires a letter `A`–`Z` and throws a `TypeError` for anything else, including a non-string.
- The CLI uses `A` when `--letter` is absent; a bad `--letter` is bad usage (exit 2).
- Exit 1 covers an invalid proposal, an unreadable input, and an output that cannot be written.
- `--help` / `-h` print the usage and exit 0.
- `<html>` carries no `lang`.

### Change 1: a dialog's frame names the screen it opens over

- **Markup:** after the dialog's `<h2>`, `<p class="ux-over">opens over <title of the screen named in over></p>`,
  then the dialog's note if it has one. The title is looked up across all screens, so a dialog written before its
  screen still names it. It goes through the same single escape as every other string.
- **Why a new class.** The existing caption markup cannot carry the line:
  - The `<h2>` holds the screen's title, and frames are found by it.
  - `ux-note` is the maker's words, styled as a designer's note, so the board's words would read as the maker's.
  - A bare `<p>` would keep browser margins unless styled by element name, which the contract forbids
    ("Everything else is styled by class") and `walkthrough.test.mjs` pins (the list of elements styled by name).

  So I named it `ux-over`, as the ruling allowed.
- **`kit/KIT-CONTRACT.md`:**
  - A line on what `ux-over` conveys.
  - A table row (`<p>`, only in a dialog frame's caption, after the `<h2>`, before the note).
  - The `ux-note` row: a screen's note now sits last in the caption.
  - "Captions and labels" now describes the dialog's caption line.
  - "A dialog over its screen" says the caption names that screen.
- **`kit/grey/kit.css`:** `.ux-over { margin: 0; color: var(--ux-muted); }`, which is plain muted text that inherits
  the caption's size.
- **`kit/grey/parts.html`:** the dialog specimen is now captioned "ux-dialog, captioned with ux-over". It carries
  `<p class="ux-over">opens over ux-frame, holding a ux-screen</p>`, which is the title of the frame it opens over in
  that page, and its note names the class.
- **`tests/walkthrough.test.mjs`:** `ux-over` was added to `CLASSES`, the fixed class list the contract tests compare
  against. No assertion was loosened.

### Change 2: a byte-order mark

The CLI strips one leading U+FEFF before parsing: `.replace(/^﻿/, '')`. It is written as an escape in both the
script and the test. `grep` finds no literal EF BB BF bytes in either file. The edit tool had first written the
test's escapes as literal characters; I caught that with `grep` and rewrote them.

### Change 3: `--out` named `kit.css`

It is refused as bad usage (exit 2) with the message
`--out cannot be named kit.css: the kit's stylesheet is copied there, beside the page`.
The check ignores case, because a file system on Windows or macOS does not tell `Kit.CSS` from `kit.css`. The
usage text now reads "the page to write, under any name but kit.css".

### The `?? e.message` fallback: removed

I did not pin it, because nothing can reach it. I ran every failure I could produce through the same calls the CLI
makes:
- `readFileSync`: ENOENT, EISDIR, ENOTDIR, ELOOP, ENAMETOOLONG, EACCES on the file and on its folder, `''`
  (ENOENT), `/proc/self/mem` (EIO);
- `writeFileSync`: EISDIR, ENOTDIR, EACCES, ENAMETOOLONG, `/dev/full` (ENOSPC), ELOOP;
- `mkdirSync` with `recursive`: EEXIST, ENOTDIR, EACCES, ENAMETOOLONG.

Result: `errors without a code: 0` (20 cases). Node's fs functions throw either a libuv `SystemError` or a coded
`ERR_*` error. The one argument-validation failure an fs path could raise, a NUL byte, cannot come from a command
line, and it carries `ERR_INVALID_ARG_VALUE` anyway. The three messages now use `${e.code}`.

### Tests

| Test | What it pins |
|---|---|
| the dialog frame (updated exact markup) | `<p class="ux-over">opens over Today, at 9:40</p>` right after `<h2>Booking Room 2</h2>` |
| a dialog's caption names the screen it opens over by that screen's title (new) | For all 4 fixtures: each dialog names the title of its `over` screen, and no screen frame carries `ux-over`; one line per dialog. A dialog written before its screen, with a note, gives title, then `ux-over`, then note. |
| a dialog over a screen whose title holds markup (new) | `Today <b>at 9:40</b> & "after"` is drawn as `opens over Today &lt;b&gt;at 9:40&lt;/b&gt; &amp; &quot;after&quot;`, and no `<b>` appears |
| every string goes through one escape (updated) | The title of the screen the dialog opens over now appears escaped exactly twice |
| the CLI reads a proposal file that starts with a byte-order mark (new) | A file written at run time with EF BB BF draws byte-identical to `renderProposal`; two marks, or a mark after `{`, are still "not JSON" (exit 1) |
| the CLI exits 2 on bad usage (2 new cases) | `--out …/kit.css` and `--out=…/Kit.CSS` exit 2 with the message, and nothing is written |
| the CLI --help (1 new word) | "any name but kit.css" |

### Commands and output

- **RED**, after the tests and before the code, `node --test tests/render.test.mjs tests/walkthrough.test.mjs` gave
  `# tests 63  # pass 54  # fail 9`. The failures were:
  - the dialog frame, the new caption test, the escaped-title test, the escape test;
  - the byte-order mark (`it is not JSON (Unexpected token '﻿'…`);
  - bad usage (`--out …/kit.css` exited 0);
  - `--help`;
  - the two contract tests ("gives each class one line", "gives each class one row").
- **GREEN**, the same command, gave `# tests 63  # pass 63  # fail 0`.
- **`npm test`** gave `# tests 196  # pass 196  # fail 0  # cancelled 0`, with no warnings.

### The hand mutations

I extended the harness to mutate any file and to run both test files. It reran all 118 earlier mutations, with
their patterns updated to the new code, plus 24 new ones. **142 mutations, 142 caught.** The new ones:

- **The over line:** dropped; class renamed; other words; names the id instead of the title; names the dialog's own
  title; after the note; before the title; on every frame; only screens written before the dialog; the title
  unescaped.
- **The byte-order mark:** not stripped; every leading mark stripped; a mark anywhere stripped.
- **`kit.css` as `--out`:** accepted; case-sensitive check; refused as exit 1; usage text silent.
- **The contract:** the `ux-over` line removed; its row removed; its row on `<span>`.
- **`kit.css`:** the `.ux-over` rule removed; a named colour.
- **`parts.html`:** the specimen removed; the specimen unlabelled.

On the first run one parts mutation "survived". It only renamed the `<h2>`, but the specimen's note also says
"ux-over", so the class was still labelled. Once the mutation removed both mentions, it was caught. One pattern
failed to match because of quote escaping in the harness, and was rewritten as wrapping the title in raw `Markup`.

### What the dialog caption reads

I redrew the three fixtures (A, B, C and `kit.css` in `tests/.tmp/board/`) and opened B headless. At 1280 wide,
the dialog frame's caption reads **"Putting a walk-in in Room 2"** in the bold caption. Under it, in plain muted
text with no extra gap, it reads **"opens over Today, at 9:40"**, and then the grey backdrop with the dialog centred
on it. At 390 wide, the same two lines each fit on one line above the backdrop. A.html reads "opens over Today,
glanced at between calls". C has no dialog.

### Files changed

`scripts/render.mjs`, `tests/render.test.mjs`, `tests/walkthrough.test.mjs` (the `CLASSES` list only),
`kit/KIT-CONTRACT.md`, `kit/grey/kit.css`, `kit/grey/parts.html`. All use LF line endings.

---

## Fix round 1 (after the task review)

The section above, also headed "Fix round 1", was the round on the controller's pre-review rulings. This is
the first round after the task review.

**Commit:** `cd3b832 fix: render carries a kit's whole stylesheet set and refuses what would lose a file`

### What changed, per item

- **GAP: the stylesheet set.**
  - The CLI lists the kit folder and copies every `.css` file directly in it, kit.css among them, beside the
    page, byte for byte. Sub-folders, folders named `*.css` and other file types are not copied.
  - The names are sorted. On Linux Node already lists a folder in name order, but on Windows it does not, so
    the success line now names every stylesheet copied, the same way on both (`with Tokens.css, kit.css beside it`).
  - A kit with no kit.css is still refused: `cannot read <kit>/kit.css: not found`, exit 1. A kit folder that
    cannot be read is refused the same way: `cannot read <kit>: not found`.
  - An `--out` named like any stylesheet in the kit is refused as bad usage, ignoring case: `--out cannot be named
    <name>: the kit's stylesheet <sheet> is copied there, beside the page`. This replaced the fixed kit.css check
    in the argument reader. Every stylesheet is read before anything is written.
  - The contract's "The document" section gained the sentence on the stylesheet set, and the usage text says
    it too.
- **MINOR 1: UTF-8.** The CLI decodes with `new TextDecoder('utf-8', { fatal: true })`, which also drops one leading
  byte-order mark, so the explicit `replace` is gone. Bytes that are not UTF-8 are refused with
  `cannot read <path>: it is not UTF-8`, exit 1. The byte-order-mark test stays green: one mark is dropped,
  while two marks, or a mark inside, are still "not JSON".
- **MINOR 2: the board's words.** "The markup" now reads "Every string in it is the proposal's own words but
  one: `opens over `, which the board writes before a title in a dialog's `ux-over`."
- **MINOR 3: ids per frame.** "Stable ids" gained the sentence: an item's id is unique within its screen only, so
  the same `data-ux` may appear in two frames of one document, and a part is found by its frame's `data-screen`
  and its own `data-ux` together.
- **MINOR 4: the page header.** "The document" gained a paragraph naming the header's markup: a `<header>` holding
  an `<h1>`, then a `<dl>` of `<dt>`/`<dd>`, with a `<ul>` of `<li>` inside the absent `<dd>`. None of it carries
  a class, and no kit styles it by name, since a kit styles `header`, `ul` and `li` by name only inside a frame.
- **MINOR 5: a flag is not a value.** A value that starts with `--`, or is `-h`, is refused:
  `--out needs a value; "--help" is a flag`, exit 2. This applies to every flag and to both the `--flag value`
  and `--flag=value` forms.
- **MINOR 6: never over the proposal.** If `--out` is the proposal's own file, the CLI refuses it as bad usage:
  `--out is the proposal itself: drawing would overwrite it`. "The same file" means the same device and inode,
  read as bigint `stat`s, so another spelling of the path, a relative path from another folder, or a hard link
  are all caught. A missing output is never the proposal.
- **MINOR 7: words a person can act on.** File failures now read:
  - ENOENT: `not found`
  - EISDIR: `it is a folder, not a file`
  - ENOTDIR: `part of the path is a file, not a folder`
  - EACCES and EPERM: `no permission`
  - any other code: the error's own message, for example `ENAMETOOLONG: name too long, open '<path>'`.

  The path stays in every message.
- **MINOR 8: provenance words.** The key-word and value checks now apply only to where the script writes: the
  `<head>`, the page's header, and every tag (element names and attributes). I applied the same scope to the
  first idea's key word (`first idea`). The first idea's own words are still checked over the whole page.
  Each provenance test also draws a heading reading `<key> changes` and shows it passes. The with-and-without-
  provenance byte comparison stays as the guarantee.
- **MINOR 9: no `--import`.** Every preload is now a `.cjs` file passed with `--require`, through one helper
  (`runWith({ cwd, preload, env })`). `engines` is unchanged.
- **MINOR 10: a golden page.** `tests/fixtures/render/every-part.D.html` is the whole page, compared byte for byte.
  I generated it with the command in the test's comment and read it through: the header and both frames match
  the markup the other tests write out by hand. The comment gives the one-line command, and says to read the
  diff before committing.
- **MINOR 11: one title per screen entry.** `validate` refuses a screen title already used by an earlier screen or
  dialog, naming both paths: `screens[1]: title "Today, at 9:40" is already the title of screens[0]`. The
  comparison collapses spaces, as the page does, but keeps letter case. A third entry with the same title also
  names the first. The three proposal fixtures still validate.

### The tests

- **`tests/render.test.mjs`**, 39 tests. New this round:
  - the golden page;
  - the contract states what the drawing relies on: every element of the page header named in "The document"
    with "no kit styles it", the stylesheet-set sentences, the quoted `opens over `, and ids per frame;
  - the stylesheet set: the copies; no `.txt`, sub-folder or `folder.css`; the sorted line, also with a preload
    that reverses the folder listing; `--out` named `Tokens.css`, `tokens.CSS` or `kit.css` refused; a kit with
    only `Tokens.css` refused;
  - a non-UTF-8 proposal: the Windows-1252 byte F3 is refused and nothing is written;
  - "no permission": a `.cjs` preload refuses `kit.css` with EACCES, then EPERM, then EIO (the fallback);
  - drawing over the proposal: the same path, a relative path from its folder, `./…`, and a hard link; the
    proposal is unchanged and no `kit.css` is copied beside it.

  Updated this round:
  - the unreadable-input test gained a folder, a path under a file, a 300-character name and a missing kit folder,
    and every message is in words;
  - the bad-usage test gained four flag-as-value cases, and now also checks no page lands beside the proposal;
  - the provenance and first-idea tests are scoped to the scaffolding;
  - the unexpected-error test uses `--require`;
  - `--help` is checked for the new usage words.
- **`tests/walkthrough.test.mjs`**, 35 tests. New: "no two screen entries share a title". It covers a dialog
  against a screen, a screen against a dialog, three entries with one title, collapsed spaces, and a
  different case being allowed.

### Commands and output

- **RED**, after the tests and before the code, `node --test tests/render.test.mjs tests/walkthrough.test.mjs` gave
  `# tests 70  # pass 59  # fail 11`.
  - The failures were: the golden page, the contract, the no-product-name test (its new file was not there yet),
    the stylesheet set (`with kit.css beside it`, where `with Tokens.css, kit.css` was expected), UTF-8 (it drew
    and exited 0), unreadable input (the bare codes), no permission, bad usage, drawing over the proposal,
    `--help`, and duplicate titles (`expected one error, got []`).
  - The `--require` test passed before the code changed, as expected: Minor 9 changes how the test runs, not what
    the script does.
- **GREEN**, the same command, gave `# tests 70  # pass 70  # fail 0`.
- **`npm test`** gave `# tests 203  # pass 203  # fail 0  # cancelled 0`, with no warnings.
- **Smoke run**, with a kit holding `kit.css` (which starts `@import "tokens.css";`), `tokens.css` and `README.txt`:
  - it printed `drew option B to …/B.html, with kit.css, tokens.css beside it`, and the board held
    `B.html kit.css tokens.css`;
  - `--out …/tokens.css` exited 2 with the message;
  - `--out --help` exited 2 with `--out needs a value; "--help" is a flag`.

### The hand mutations

The harness reran every earlier mutation on a fresh scratch copy, against both test files. Mutations whose code
was rewritten got updated patterns; obsolete ones got equivalents. **179 mutations; all 179 caught**: 172 in the
first run and 7 in a second. The new ones:

- **The stylesheet set:**
  - only kit.css copied; any file type; folders named `.css`; sub-folders (`recursive: true`);
  - not sorted; kit.css not required; a kit folder failure not explained;
  - the clash not refused; refused only when the case matches; refused as exit 1; checked against kit.css only;
  - the success line naming kit.css only; the stylesheets read after the page is written.
- **UTF-8:** not fatal; the byte-order mark kept (`ignoreBOM`); other words. The byte-order-mark mutations whose
  code is gone were replaced by: every leading mark stripped, a mark anywhere stripped, and decoding by hand.
- **A flag as a value:** accepted; `-h` accepted; the message not naming the flag.
- **Drawing over the proposal:** not refused; compared by path string; a missing output counted as the proposal;
  refused as exit 1.
- **Words:** the words for each of the 5 codes removed; other failures shown as a bare code; a missing kit.css
  shown as a bare code.
- **Duplicate titles:** not checked; spaces telling titles apart; inner spaces telling titles apart; case folded;
  the earlier path not named; the later entry recorded instead of the first.
- **The contract:** each new sentence or paragraph removed or altered (6 mutations).

In the first run two mutations survived, and both were gaps in the tests, not the code:

1. **"Not sorted":** libuv already sorts a folder listing on Linux, so the order could not show. A preload that
   reverses the listing now pins it, as Windows would.
2. **"The later entry recorded":** this mattered only with three entries sharing a title. A three-entry case now
   pins that each later one names the first.

One contract mutation was skipped in the first run because the sentence wraps across lines. Its pattern was
fixed and it was caught in the second run.

**Not pinned:** the `x.dev === y.dev` half of the same-file test. Two files on different devices with the same
inode number cannot be made under `tests/.tmp/`, and removing that half would only matter there.

### Decisions in this round

- The copy set is the files whose names end in `.css`, matched case-sensitively, while the name clash ignores
  case. A file called `Theme.CSS` would not travel; a page called `KIT.CSS` is refused.
- A flag's value is refused if it starts with `--` or is `-h`, in both the `--flag value` and `--flag=value`
  forms.
- A title clash collapses whitespace (the page does) but not case (the page shows case).

### Files changed

- `scripts/render.mjs`
- `scripts/lib/walkthrough.mjs`
- `tests/render.test.mjs`
- `tests/walkthrough.test.mjs`
- `kit/KIT-CONTRACT.md`
- `tests/fixtures/render/every-part.D.html` (new)

All use LF line endings. No literal U+FEFF in any of them.
