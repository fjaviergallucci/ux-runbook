# Task 3 report: the walkthrough format and the grey kit

**Status:** DONE_WITH_CONCERNS (several readings where the brief is silent are listed under "Readings"
below. None of them conflicts with the brief or with § 4.4.)
**Commit:** `461ed39 feat: the walkthrough format and the grey kit` on `v2-pipeline` (parent `1ebc94b`).
The eight files were staged by explicit path. Nothing was pushed or amended.

## What I implemented

### `scripts/lib/walkthrough.mjs` (155 lines): the vocabulary and `validate` only

- `ROLES` and `CONTAINERS` are exactly the brief's lists. Both arrays are frozen.
- `validate(proposal): string[]` returns every error, in the order of the proposal, and `[]` when the
  proposal is valid. It never throws, whatever JSON it is given.
- Each error starts with the path of the object at fault, followed by the message. Examples:
  - `screens[1].items[0]: unknown role "card"` (the brief's form, verbatim)
  - `proposal: "bet" is missing`
  - `screens[1]: "container" must be "screen" or "dialog"; it is "sheet"`
  - `absent[1]: must be a line of text`
  - `screens[1].items[0].options[1]: must be a line of text`

  The proposal itself is named `proposal`. When a message quotes a bad value, it cuts it to 40 characters.

What it refuses:

- **The proposal**
  - Anything that is not an object.
  - An unknown key. `author`, `engine`, `track`, `model` and `source` are allowed here and only here;
    their values are not checked.
  - A missing or blank `name`, `bet`, `cost`, `hardest` or `firstIdea`.
  - An `absent` that is not a list of at least one line of text.
  - A `screens` that is not a list of at least one screen.
- **A screen**
  - Not an object, or an unknown key.
  - An `id` that is missing, not kebab-case, or used by another screen.
  - A missing or blank `title`.
  - A `container` other than `screen` or `dialog`.
  - A `note` that is present but blank.
  - An `items` that is not a list of at least one item.
- **`over`**
  - A dialog must have it.
  - A `screen` must not have it.
  - It must name an entry of `screens` whose container is `screen`. Naming nothing, a dialog, or the
    dialog itself is refused. The screen it names may come before or after the dialog.
- **An item**
  - Not an object.
  - Having both `role` and `container`, or neither.
- **A role item**
  - An unknown key.
  - An unknown role.
  - A missing or blank `text`.
  - An `id` that is not kebab-case, or that is already used on the same screen.
  - A blank `note`.
  - `primary` (with any value) on a role other than `action`.
  - A `primary` that is not a boolean.
  - An `options` that is not a list of at least one line of text.
- **A container item**
  - An unknown key.
  - An unknown container. This includes `screen` and `dialog`, which are screen containers.
  - A blank `label`.
  - `open` (with any value) on anything but an `expansion`.
  - An `open` that is not a boolean.
  - An `items` that is not a list of at least one item. Containers nest to any depth.

Kebab-case means `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`: it starts with a letter and uses single hyphens.

### The grey kit

**`kit/grey/kit.css` (285 lines)**

- **Colours.** Greys only, written as `#rrggbb` hex.
- **Font.** One system font stack, declared once as `--ux-font` and used once on `body`. Parts use
  `font: inherit`.
- **The primary action's grey.** The one mid-grey is `--ux-primary: #767676`, with white text on it
  (4.54:1). It is the same in both sets and used only by `.ux-action.is-primary`.
- **Light and dark.** The light set is on `:root`. The dark set under `prefers-color-scheme: dark`
  redefines every other grey.
- **No motion.** There are no transitions, animations or keyframes.
- **Nothing loaded.** There is no `@import` and no `url()`.
- **Classes.** It styles only the contract's classes, plus base rules for `body` and `*` box-sizing.

**`kit/grey/parts.html`**

- One specimen of every class of the contract. Each specimen sits in a `ux-frame` whose caption names
  the class.
- It links `kit.css` only and has no `style`, `script` or monospace elements, so it is drawn by the kit
  alone.
- The `ux-status` specimen carries `data-ux="free-count"`.
- It contains non-ASCII text ("Sala Jardín") and declares `charset="utf-8"`.

**`kit/KIT-CONTRACT.md`** contains:

- The brief's class list, with one line each on what the class must convey.
- The rule, in bold: a project kit restyles these classes on the project's token file and adds none.
- A short paragraph naming `parts.html` as the reference markup, and saying that `data-ux` is for the
  checks, never for styling.

### The fixtures (`tests/fixtures/proposals/`)

All three are the clinic's "today" surface: two screens each, `"track": "system"`, real words.

- **`unified-list.json`, "One list, every room":**
  - one list of every room in wall-chart order, and a primary "Book a walk-in";
  - screen 2 is a dialog over `today`, with a choice of the free rooms, an input, and two actions.
- **`free-first.json`, "Free rooms first":**
  - a leading region "Free now" holds `free-count` (the id Task 4's test uses) and one group per free
    room, each with its own Book action;
  - a "Not free" region follows;
  - screen 2 is a dialog over `today`, with an input, a choice and a link.
- **`calendar.json`, "The day as a grid":**
  - a region "Rooms by hour" holds one group per room, each listing its slots;
  - screen 2 is a `screen`, not a dialog: the slot opens in place as an `expansion` with `open: true`,
    nested region → group → expansion → items.

Between them the fixtures use every container and eight of the ten roles; `media` and `nav` are not
natural on this surface. "Sala Jardín" and "Tomás" are the non-ASCII text. No fixture repeats an item
id across its screens.

## Tests and results

`tests/walkthrough.test.mjs` has 27 tests.

- **Tests 2–8 are the brief's seven:**
  - each fixture validates to `[]`;
  - `card` gives exactly `['screens[1].items[0]: unknown role "card"']`;
  - `sheet` is refused;
  - an `over` that names no screen is refused;
  - a proposal with no `bet` is refused;
  - group → expansion → item validates;
  - `primary: true` on a `status` is refused.

  The fixture test also asserts two screens, `track: "system"` and non-ASCII text in at least one
  fixture.
- **Test 1** pins `ROLES` and `CONTAINERS` exactly.
- **Tests 9–24** pin each refusal listed above. Each uses a helper that asserts exactly one error, at the
  expected path, matching the expected words. Test 24 checks that all errors arrive together, in order.
- **Test 25 (the contract).** Every class is named in `KIT-CONTRACT.md` and styled in `kit.css`.
  `kit.css` and `parts.html` add no class beyond the contract. Every class is used in `parts.html`.
  `is-primary` appears only on an action. Every class, `ux-action.is-primary` included, is labelled in
  the visible text. Some element carries a `data-ux` attribute.
- **Test 26 (the grey kit).** It checks:
  - every hex is a grey, and there are no colour functions;
  - one `font-family`, and every `font:` shorthand is `inherit`;
  - no monospace element in `parts.html`;
  - the dark set redefines exactly the light set's greys, except the primary pair;
  - the primary is a mid-grey (`0x55`–`0xaa`), defined once, and used only by `.ux-action.is-primary`;
  - no motion;
  - nothing loaded, and `parts.html` links `kit.css` and nothing else.
- **Test 27.** There is no `\bVerbato\b` (case-insensitive) and no `\bVersa\b` (case-sensitive, ruling
  R3) in the format, the kit or the fixtures.

**Results**

- Focused, `node --test tests/walkthrough.test.mjs`: 27 tests, 27 pass, 0 fail.
- Full, `npm test`: 160 tests, 160 pass, 0 fail. The run prints nothing besides the test report.
- **Visual check.** `parts.html` was shot headless with playwright-core and the installed Chrome, with
  `reducedMotion: 'reduce'` set, in light and dark at 1280 and 390 px wide. All four pages render as
  intended and have 0 px of horizontal overflow. The screenshots are in the session scratchpad and are
  not committed.

## TDD evidence

**RED 1**

- Command: `node --test tests/walkthrough.test.mjs`, with the fixtures and tests written and no module.
- Result: `ERR_MODULE_NOT_FOUND ... scripts/lib/walkthrough.mjs`, so the file fails (1 test, 0 pass,
  1 fail).
- Why expected: `validate` did not exist yet.

**RED 2**

- Same command, against a stub that exports the two lists and a `validate` returning `[]`.
- Result: 27 tests, 3 pass, 24 fail.
- The three that pass are expected to: the vocabulary, the fixtures (an accept-everything validator
  accepts them) and the nesting test (it expects `[]`).
- Every refusal test fails on its assertion, not on loading.
- The three kit tests fail because the kit did not exist yet.

**GREEN**

- After `validate`: 24 of 27 passed.
- Two of those 24 had first failed on a message bug, "at least one a line of text", which I fixed.
- The three kit tests waited for the kit.
- After the kit: `node --test tests/walkthrough.test.mjs` gives 27/27, and `npm test` gives 160/160.

## The hand-mutation result

I wrote each mutation by hand and applied it to the real file, one at a time. After each one I ran the
focused suite, then restored the file; its sha256 matches before and after.

### `walkthrough.mjs`: 88 mutations, 0 survived

Each was killed by the test written to pin it. The full log is in the session scratchpad
(`mutation-validate.txt`). In summary:

| Mutated | Killed by |
|---|---|
| Each half of `isObject` (`!== null`, `typeof`, `!Array.isArray`) | "anything but an object", plus the screen and item not-an-object tests |
| Each half of `isText` (`typeof`, not-blank), and `!== ''` instead of `trim()` | the text-field, note/label, absent and options tests |
| Each half of `isKebab` (`typeof`, the regex) | "ids are kebab-case". The `typeof` half is killed only by the `['book']` case (see the issue below) |
| The `KEBAB` regex: drop `^`, drop `$`, digit first, empty word, underscore, `/i` | "ids are kebab-case" |
| Each half of `isList`, and `isBoolean` forced true | the list tests; the `primary`/`open` tests |
| Each vocabulary list: drop a role, drop a container, drop or add a screen container | the vocabulary, fixtures and sheet tests |
| Each of the five provenance keys dropped; provenance allowed on a screen | the provenance assertions |
| An extra allowed key at each of the four levels | the unknown-key test |
| Every call site deleted: unknown keys, required text, `absent` and its lines, `screens`, screen not-object, screen id, duplicate screen id, never recording an id, `title`, `container`, the `over` check, `note`, `items`, item not-object, both/neither, the both/neither messages swapped, `role`, `text`, item id, duplicate item id, never recording an item id, `primary` (the presence guard, the action-only half, the boolean half, and refusing only `true`), `options` and its lines, `container`, `label`, `open` (each half), nested `items` | the specific test for that refusal |
| `checkOver`: screens checked as dialogs; a screen with `over` allowed; a dialog without `over` allowed; `over` naming nothing allowed; `over` naming a dialog allowed | the `over` tests |
| The kinds map: last id wins, or the `isObject` guard dropped | "screen ids are unique", "screens is a list" |
| `need`: the missing branch dropped, the invalid branch dropped, always true. `maybe`: the presence guard dropped | many tests at once |

### The kit: 33 mutations, 0 survived

| File | Mutations | What was mutated |
|---|---|---|
| `kit.css` | 18 | a colour hex; `rgb()`; a short hex; a second `font-family`; a `font:` shorthand with a face; a primary that is not mid-grey; the primary redefined in the dark set; the mid-grey used by `.ux-status`; a grey missing from the dark set; `dark` renamed to `light`; `transition`; `animation-name`; `@keyframes`; `@import`; `url()`; an extra `.ux-card` class; `.ux-text` unstyled; `.is-primary` unstyled |
| `parts.html` | 12 | a class removed; an extra class; `is-primary` moved off an action; a class unlabelled; the `data-ux` attribute removed; `<code>`; a `style=` attribute; `<style>`; `<script>`; a second `<link>`; a product name |
| `KIT-CONTRACT.md` | 3 | a class unnamed; `is-primary` unnamed; a product name |

**An issue the kit mutations found, now fixed.** The "parts.html shows a stable id" assertion was first
`/data-ux="…"/` over the whole file. The `ux-status` specimen's caption note also has the text
`data-ux="free-count"` in it, so removing the attribute left the test green. The assertion now requires
the attribute inside a tag, `/<[a-z][^>]*\sdata-ux="…"[^>]*>/`, and the mutation is killed.

**Found while planning the mutations, fixed before the run.** `isKebab`'s `typeof` half was unpinned.
`RegExp.test` turns a non-string into a string, so `5` fails the regex anyway, while `['book']` reads as
`"book"` and passes. `['book']` is now in the bad-id table, for screen ids and for item ids.

**Not pinned, and not refusals:** the 40-character cut in `show()` and the exact wording after the
`must be …` part of each message.

## Files changed

- `scripts/lib/walkthrough.mjs` (new)
- `tests/walkthrough.test.mjs` (new)
- `tests/fixtures/proposals/unified-list.json`, `free-first.json`, `calendar.json` (new)
- `kit/KIT-CONTRACT.md` (new)
- `kit/grey/kit.css`, `kit/grey/parts.html` (new)

All of these use LF line endings and end with a newline. None contains `Verbato` or `Versa`.

## Self-review: readings, notes for later tasks, concerns

The brief and § 4.4 agree. § 4.4's "primary action" role is the brief's `action` with `primary: true`,
which is the same thing. I made the following readings where the brief is silent; each has a test.

1. **`over` must name a `screen`.** It names an entry of `screens` whose container is `screen`, so a
   dialog over a dialog, or over itself, is refused. A dialog must have `over`, and a screen must not.
   I read the brief's "a dialog whose over names no screen" literally: a dialog is not a screen.
2. **Blank text counts as missing.** A required text that is blank or whitespace-only is refused like a
   missing one. A present `note` or `label` must be text too.
3. **Lists cannot be empty.** `absent`, `screens`, `items` and `options` need at least one entry. An
   empty "absent on purpose" states nothing, and an empty screen or container draws an empty box.
4. **Unknown keys are refused at every level.** The brief allows five extra keys on the proposal, which
   implies that no others are allowed. § 4.4 says arrangement is never free layout: a key such as
   `width`, `columns` or `component` is exactly what the format exists to keep out.
5. **`primary` and `open` belong to one kind each.** `primary` with any value, `false` included, belongs
   to an action. `open` belongs to an expansion, mirroring `primary`. The brief tested only
   `primary: true`; refusing `open` on a region or group is my addition, so that `open: false` cannot
   be used to draw a group collapsed.
6. **Ids.**
   - Kebab-case starts with a letter.
   - Screen ids are unique within the proposal.
   - Item ids are unique within one screen, across all its nesting, but may repeat across screens: a
     stable id names the same part in a later state.
   - **Note for Task 4:** the board document holds every screen, so an item id repeated across screens
     appears twice as `data-ux` in one document. The fixtures avoid this. If the render or Task 6/7
     need ids unique per document, this rule must become proposal-wide.
7. **Test count.** There are 27 tests where the brief says "PASS (7 tests)". The brief's seven are all
   there; the other 20 pin each refusal and the kit, as the controller required. Earlier tasks treated
   the brief's count as a floor (R16).
8. **Markup.** `parts.html` fixes markup that Task 4 should mirror, since `kit.css` is written against
   it:
   - a frame is `<section class="ux-frame" data-screen="…">`, holding a `<header>` with an `<h2>` title
     and an optional `ux-note`, then a `<div class="ux-screen">` or a `<div class="ux-dialog">`;
   - a region's or a group's label is its first child, a `<header>`;
   - an expansion is `<details class="ux-expansion" [open]>` with a `<summary>` for its label;
   - a role's words are the element's own text, and its options are a `<ul><li>` inside it;
   - the input's field is drawn by `::after`, so the render writes no `<input>`;
   - a note is a `<p class="ux-note">` after its item.

   The dialog's backdrop uses `.ux-frame:has(> .ux-dialog)`, which the Chrome the board is shot in
   supports. `KIT-CONTRACT.md` names `parts.html` as the reference.
9. **A minor concern.** `label` is optional on an expansion, as the brief says. An unlabelled expansion
   drawn as `<details>` would show the browser's "Details" text. Task 4 must handle that, or a later
   ruling could require labels on expansions.
10. **The grey test reads hex and colour functions only.** It does not catch a named colour keyword
    such as `red`. `kit.css` uses none.

---

# Fix round 1: the controller's rulings on the seven readings

**Commit:** `fbc555c fix: an expansion must be labelled; the kit contract states the markup` on
`v2-pipeline` (parent `461ed39`). The five files were staged by explicit path. Nothing was pushed or
amended.

## Decisions (ruled by the controller, accepted as built)

The reviewer should read these as decisions, not as open readings.

- **D1. `over` names a screen.** A dialog's `over` must name an entry of `screens` whose container is
  `screen`. Naming nothing, a dialog, or the dialog itself is refused. A dialog must have `over`, and a
  screen must not.
- **D2. No empty lists.** `absent`, `screens`, `items` and `options` each need at least one entry.
- **D3. Unknown keys are refused at every level.** That covers the proposal, a screen, a role item and a
  container item. `author`, `engine`, `track`, `model` and `source` are allowed at the top, and only
  there.
- **D4. `primary` and `open` belong to one kind each.** `primary`, with any value, only on an `action`.
  `open`, with any value, only on an `expansion`.
- **D5. Item ids are unique per screen, not per proposal.** The same id may appear on two screens.

## Change 1: an expansion must carry a label (ruling on reading 7)

- **Code.** In `scripts/lib/walkthrough.mjs`, `checkContainer` now reads the `label` as required for an
  `expansion` and optional for a `region` or `group`:
  `(item.container === 'expansion' ? need : maybe)(item, 'label', …)`.
- **Errors.** An expansion without a label gives `<path>: "label" is missing`. A blank label gives
  `<path>: "label" must be a line of text; it is " "`.
- **New test.** "an expansion carries a label; a region or a group may go without one":
  - an expansion with no label is refused at `screens[0].items[2]`;
  - an expansion with a blank label is refused at the same path;
  - a region with no label validates to `[]`, and so does a group with no label.
- **Existing tests.** The two expansions in the `open` test gained a label (`'Later today'`).
- **Fixtures.** No change was needed: the only expansion, in `calendar.json`, already has
  `"label": "Free 9:40 to 11:15"`.
- **`parts.html`.** Both expansions already open with a labelled `<summary>`. The new test now checks
  this.
- **`KIT-CONTRACT.md`.** The `ux-expansion` line now says the label "which it always has". The markup
  section says every expansion has a `<summary>`, and that the format refuses one without a label.

## Change 2: the contract states the markup (ruling on reading 6)

The contract did **not** already say this. It had one general paragraph on markup. It gave no element
for each class, said nothing about how a dialog sits over its screen, and said nothing about a `<p>`
part that has options. So I rewrote it.

The class list and "The rule" are unchanged. "The markup" is new and holds:

- **A table, one row per class:** the exact element and where it sits and what it holds.

  | Class | Element |
  |---|---|
  | `ux-frame` | `<section data-screen="…">`: a child of `body`, holding its caption `<header>` and then one `ux-screen` or `ux-dialog` |
  | `ux-screen`, `ux-dialog` | `<div>`, the frame's last child |
  | `ux-region` | `<section>` |
  | `ux-group` | `<div>` |
  | `ux-expansion` | `<details>`, with `open` when it is open, and a `<summary>` first |
  | `ux-heading` | `<h3>` |
  | `ux-text`, `ux-input`, `ux-status` | `<p>` |
  | `ux-choice`, `ux-list`, `ux-media` | `<div>` |
  | `ux-action`, `ux-action.is-primary` | `<button type="button">` |
  | `ux-link` | `<a href="#">` |
  | `ux-nav` | `<nav>` |
  | `ux-note` | `<p>`: an item's note is the next sibling of its part; a screen's note sits in the caption `<header>`, after the `<h2>` |

- **Captions and labels.** A frame's caption is `<header><h2>`. A region's or a group's label is a
  first-child `<header>`, and there is none without a label. An expansion's label is a first-child
  `<summary>`, always present.
- **Options.**
  - Options are a `<ul>` as the part's last child, after the item's text, with one `<li>` per option.
  - A `<p>`, `<h3>`, `<button>` or `<a>` part becomes a `<div>`, keeping its class, when its item has
    options, because those elements cannot hold a list.
- **A dialog over its screen.**
  - The dialog has its own frame, and its `ux-dialog` replaces the `ux-screen`.
  - `.ux-frame:has(> .ux-dialog)` paints the frame below the caption as a backdrop standing for the
    `over` screen, and centres the dialog on it.
  - That screen is not redrawn inside the dialog's frame.
- **Stable ids.**
  - `data-ux` goes on the role part of an item that has an `id`. Containers never carry it.
  - A frame carries `data-screen`.
  - No kit styles by either attribute.
- **What the stylesheet styles by name:** only `body`, `header`, `h2`, `summary`, `ul` and `li`.
  Everything else is styled by class.

`parts.html` now agrees with this. Every specimen frame carries a kebab `data-screen`; before, only the
first two did. Nothing else in the specimen needed to change. The header comment in `kit.css` now points
to the contract for the markup.

## The tests added or changed

- **New: "every class the contract names is in kit.css and parts.html, and parts.html follows the markup
  the contract states".** This is the test the controller asked for, extended to hold the specimen to
  the table:
  - every `ux-…` class the contract names, anywhere in it, is styled in `kit.css` and used in
    `parts.html`;
  - the table has exactly one row per contract class;
  - every element in `parts.html` that carries a class is the table's element for that class;
  - every frame has a kebab `data-screen` and opens with its caption `<header>`;
  - every expansion opens with a non-empty `<summary>`;
  - `kit.css` styles by name only `body`, `h2`, `header`, `li`, `summary` and `ul`.
- **Changed: test 25 ("the contract names every class…").** It now requires exactly one
  "`- \`class\`: what it must convey`" line per class.
  - Before, it only checked that each class appeared somewhere in backticks. Once the markup table also
    named every class, deleting a class's convey line passed silently.
  - The round-one contract mutations caught this when I re-ran them: two survived. They are killed now.
- **New:** the expansion-label test described under Change 1.

## Commands and output

**RED**

- `node --test tests/walkthrough.test.mjs`, after the expansion-label test was added:
  `not ok 22 - an expansion carries a label…`, failing with `expected one error, got []`. Expected,
  because the label was still optional. 28 tests, 27 pass, 1 fail.
- The same command, after the markup test was added and before the contract was rewritten:
  `not ok 27 - every class the contract names…`, failing with
  `'the contract gives each class one row'`. Expected, because the contract had no table yet. 29 tests,
  28 pass, 1 fail.

**GREEN**

- `node --test tests/walkthrough.test.mjs`: 29 tests, 29 pass, 0 fail.
- `npm test`: 162 tests, 162 pass, 0 fail. The only output besides the test report is npm's own
  `> test` header.
- All five changed files use LF line endings, and none contains `Verbato` or `Versa`.

**Hand mutations.** I applied each one to the real file, ran the focused suite, and restored the file.

| File | Mutations | Survived | What was mutated |
|---|---|---|---|
| `walkthrough.mjs` | 4 | 0 | label optional on an expansion; label required on every container; the condition inverted; the label check deleted |
| `KIT-CONTRACT.md` | 10 | 0 | a markup row deleted; a row giving `<h2>` for `ux-heading`; a row giving `<a>` for the primary action; a prose mention of `ux-card`; a table row for `ux-card`; a class's backticks dropped; `is-primary` unnamed; a convey line deleted; a convey line duplicated; a product name |
| `parts.html` | 9 | 0 | a frame without `data-screen`; a non-kebab `data-screen`; a frame not opening with its caption; an empty `<summary>`; no `<summary>`; a heading on `<h4>`; a group as `<section>`; an input as `<input>`; a primary action as `<a>` |
| `kit.css` | 3 | 0 | `p {}` styled by name; a role styled as `.ux-screen p`; `summary` no longer styled |

**Round one, re-run.** All 121 round-one mutations were re-run against the new files. Every one is
killed, except two that no longer apply:

- `checkContainer: drop label` targets a line this round rewrote. Its replacement, "label never
  checked", is killed.
- The malformed round-one `data-ux` mutation, whose replacement is killed.

## Files changed in this round

- `scripts/lib/walkthrough.mjs`
- `tests/walkthrough.test.mjs`
- `kit/KIT-CONTRACT.md`
- `kit/grey/kit.css` (the header comment only)
- `kit/grey/parts.html` (`data-screen` on 15 frames)

## Concerns

None new. The table fixes elements that Task 4's render must write, notably `<p>` for text, input and
status, and `<div>` for any part with options. The contract is now the one place that says so.

---

# Fix round 1 (review findings): one Important, ten Minor

This is the first round after the task review. The section above titled "Fix round 1: the controller's
rulings" was the round before review.

**Commit:** `23c3af1 fix: validate reports one true error per fault; one primary per screen; options only
where they mean something` on `v2-pipeline` (parent `fbc555c`). The seven files were staged by explicit
path. Nothing was pushed or amended.

## What changed, item by item

### IMPORTANT 1: one true error when the screen a dialog opens over is refused

- **Bug.** `checkOver` said "is a dialog" whenever the screen it named was not a `screen`.
- **Fix.** It now says "is a dialog" only when that screen's container is `dialog`. When that screen's
  own container is refused, it stays silent.
- **Test.** "a dialog over a screen whose container is refused adds nothing: one error, at that screen".
  With `screens[0].container = "sheet"`, the result is exactly one error, at `screens[0]`. With the
  container missing, the same.

### MINOR 2: one error for a mistyped role or container

- **Role.** `checkRole` reports `unknown role`, still checks `text`, `id` and `note`, then stops. It does
  not read `primary` or `options` against an unknown role. The role error still comes first among that
  item's errors.
- **Container.** `checkContainer` reads `open` only when the container is known.
- **Test.** "a mistyped role or container is reported once…". Each of these gives exactly one error,
  ending at the `unknown …` message:
  - `acton` with `primary: true`;
  - `chioce` with options;
  - `expanson` with `open: true`.

### MINOR 3 (ruling): at most one primary per screen entry

- **Rule.** Each screen or dialog entry has its own context, `{ ids, primary: null, fail }`. A second
  `primary: true` on the same entry gives
  `<path>: a second primary action on this screen; the first is <path of the first>`.
- **What counts.** `primary: false` counts neither as the first nor as a second.
- **Fixtures.** No change was needed: each screen already had one primary at most.
- **Contract.** `KIT-CONTRACT.md` keeps "the one action the screen is for".
- **Test.** "a screen has at most one primary action; a dialog is a screen of its own":
  - a second primary inside a group is refused, and both paths are named;
  - a primary on the screen and one on its dialog validate;
  - a `primary: false` action after the primary validates, and so does one before it.

### MINOR 4 (ruling): options only on a choice, a list or a nav

- **Rule.** `OPTIONS` maps `choice` to at least two, and `list` and `nav` to at least one.
- **Required.** On those three roles `options` is required: missing gives `"options" is missing`, and
  too few gives `"options" must be a list of at least two lines of text` (one line of text for a list or
  a nav).
- **Refused elsewhere.** On any other role, `options` gives
  `"options" belong to a choice, a list or a nav, not to a "<role>"`.
- **Test.** The old options test, which used an input, was replaced by "options belong to a choice, a
  list or a nav, and those three need them". It covers:
  - options refused on each of the seven other roles;
  - missing options on each of the three;
  - a choice with a string, one option, `[]` or `{}`;
  - a list or a nav with `[]`, and a list or a nav with one option, which validates;
  - a choice with two options, which validates;
  - a blank option and a non-string option, each named by its path.
- **`kit.css`.** The rule that styled `> ul` under all ten roles now names only
  `:is(.ux-choice, .ux-list, .ux-nav) > ul`. Its comment changed to match.
- **`KIT-CONTRACT.md`.**
  - The rule that a `<p>`, `<h3>`, `<button>` or `<a>` part becomes a `<div>` when it has options is
    gone.
  - The Options section now says that only a choice, a list and a nav have options, how many each
    needs, and that the format refuses options elsewhere.
  - The table rows for those three state their counts.
- **`parts.html`.** No change was needed: it already shows a choice, two lists and a nav, each with its
  options, on the table's elements.
- **Fixtures.** No change was needed: none was refused by the new rule.

### MINOR 5: a dialog written before its screen

- **New accepting test:** "a dialog may be written before the screen it opens over". It reverses the
  minimal proposal's two entries and expects `[]`.
- **Pinned by:** a two-edit mutation that builds `kinds` only from earlier screens. It is killed.

### MINOR 6: the contract's table and the specimen agree on options

The markup test now checks four things:

- a table row speaks of options if and only if its class is `ux-choice`, `ux-list` or `ux-nav`;
- every `<ul>` in `parts.html` is the options of one of those three parts, with at least the least
  number of `<li>` for its role;
- every `ux-choice`, `ux-list` and `ux-nav` in `parts.html` shows its options;
- every `kit.css` selector that styles `ul` or `li` names only those three classes.

No input has an options case any more, in the tests or anywhere else.

### MINOR 7: the document shell

- **Contract.** `KIT-CONTRACT.md` gains a section, "The document":
  - `<!doctype html>`, for standards mode;
  - `<meta charset="utf-8">`;
  - `<meta name="viewport" content="width=device-width, initial-scale=1">`;
  - `<link rel="stylesheet" href="kit.css">` from beside the document;
  - a frame is `<section class="ux-frame" data-screen="`the screen's id`">`.
- **Where frames sit.** Frames normally sit directly in `body`, but no selector of the kit depends on a
  frame's parent. That is true of `kit.css`: every selector naming `.ux-frame` starts with it. The
  frame's table row now says "normally a child of `body`".
- **Tests.** The new test "the document shell: the contract states it and parts.html follows it" checks
  each of the four lines in both files, and that `parts.html` opens with its doctype. The markup test
  checks that every selector naming `.ux-frame` starts with it.
- `data-screen` was already part of the contract, under "Stable ids".

### MINOR 8: an emoji in the fixtures

- **Change.** The room is now named "Sala Jardín 🌿", with its accent kept. A clinic names its own rooms,
  so a person would plausibly type this.
- **Why in all three fixtures:** they are three proposals for the same clinic, so the room keeps one
  name. The ruling asked for one fixture at least.
- **Test.** The fixture test now checks two things separately: one fixture holds an accented letter
  (`[À-ɏ]`), and one holds an emoji (`\p{Extended_Pictographic}`).

### MINOR 9

Nothing to do, as ruled.

### MINOR 10: every colour in kit.css is a grey of the kit

The grey test now also checks every declaration of a colour-bearing property. That covers `color`,
`background`, `border`, `border-<side>`, each of their `-color` forms, `outline`, `box-shadow`,
`text-decoration`, `fill`, `stroke` and a few more.

- **Allowed tokens:**
  - `var(--ux-…)`, when every value the token takes, light and dark, is a grey hex;
  - a grey hex;
  - `transparent`, `inherit` or `currentColor`;
  - a non-colour token: a length, `0`, `none`, `solid`, `dashed`, `dotted`, `double` or `underline`.
- **Caught:** `crimson` in a rule or in a token, `red` in a border, and a token the kit lacks. The
  system colour `CanvasText` is caught too.
- **Unchanged:** the two near-equal greys, as ruled.

### MINOR 11: a note keeps no browser margin

- **Change.** `.ux-note` now has `margin: 0`. A note after an item keeps its 0.25rem top margin from the
  more specific `> * + .ux-note` rule (measured: 4 px).
- **Test.** The grey test asserts that the `.ux-note` rule declares `margin: 0`.
- **Measured headless,** at 1280 px wide with `reducedMotion` set:

  | Frame | Caption note | Caption to screen, before | After | Caption height, before | After |
  |---|---|---|---|---|---|
  | `today` | yes | 13 px | 8 px | 43 | 43 |
  | `region` | no | 8 px | 8 px | 20 | 20 |
  | `book` (dialog) | yes | 32 px | 32 px | 64 | 51 |
  | `status` | yes | 13 px | 8 px | 43 | 43 |

  A captioned frame with a note now sits like one without. In the dialog frame, the stray 13 px is gone
  from the caption, and the 2rem backdrop band is unchanged.

## Commands and output

**RED**

- `node --test tests/walkthrough.test.mjs`, after the validate-side tests and before the code: 33
  tests, 28 pass, 5 fail. Each failure was expected:
  - 2, the fixtures: there was no emoji yet;
  - 6, the dialog over a refused screen: there were two errors;
  - 24, the mistyped role or container: there were double reports;
  - 25, one primary: there was no rule yet;
  - 27, options: they were allowed anywhere.

  Test 7, MINOR 5's accepting test, passed already. A mutation pins it.
- The same command, after the kit-side tests and before the kit changes: 34 tests, 31 pass, 3 fail.
  - the markup test: `:is(.ux-heading, … .ux-nav) > ul: options are styled on a choice, a list or a nav only`;
  - the shell: `the contract states <!doctype html>`;
  - the grey kit: `a note keeps no browser margin…`.

  The new colour check already passed on today's kit. Mutations pin it.

**GREEN**

- `node --test tests/walkthrough.test.mjs`: 34 tests, 34 pass, 0 fail. The `primary: false`-first
  case is an extra assertion inside the one-primary test, not a new test.
- `npm test`: 167 tests, 167 pass, 0 fail. The only output besides the test report is npm's own
  `> test` header.
- All seven changed files use LF line endings, and none contains `Verbato` or `Versa`.

## Hand mutations

I wrote each mutation by hand, applied it to the real files (several edits at once where needed), ran
the focused suite, and restored every file. The working tree was clean of them before the commit.

**This round: 47 mutations, 0 survived.**

| Item | Mutations | What was mutated |
|---|---|---|
| IMPORTANT 1 | 2 | "is a dialog" for any non-screen (the reported bug); a dialog target never named |
| MINOR 2 | 5 | role-dependent keys read again; unknown role never reported; every role known; `open` read again on an unknown container; unknown container never reported |
| MINOR 3 | 5 | a second primary allowed; `primary: false` counted as a second; `primary: false` counted as the first; the first never recorded; one primary per proposal instead of per screen |
| MINOR 4 | 9 | a choice needing one; a list needing two; a nav needing two; a nav without options; options allowed on any role; options optional on the three; no list check; any count; option lines unchecked |
| MINOR 5 | 1 | `kinds` built only from earlier screens |
| MINOR 6 | 7 | options styled on every role again; options styled on an input; the input row speaking of options; the nav row dropping them; an input with options; a choice with one option; a nav without options |
| MINOR 7 | 7 | each of doctype, charset, viewport and link dropped from the contract; viewport and doctype dropped from `parts.html`; a `body > .ux-frame` selector |
| MINOR 8 | 2 | no emoji in any fixture; no accented letter in any fixture |
| MINOR 10 | 6 | `crimson` in a rule; `crimson` in a light token; `crimson` in a dark token; `red` in a border; `CanvasText`; `var(--ux-accent)` |
| MINOR 11 | 1 | `.ux-note` without `margin: 0` |
| Rewritten round-one mutations | 5 | items dropped from a screen; ids shared across screens; item note dropped; `open` check always running; the options block deleted whole |

**Earlier rounds re-run against the new files.** Every mutation still applies and is killed, except
nine round-one validate mutations whose target text this round rewrote:

- three are replaced one-for-one by this round's: over naming a dialog, unknown role, unknown container;
- the label check is replaced by round two's "label never checked", still killed;
- four are rewritten above and killed;
- "options check" is replaced by MINOR 4's set;
- the round-one `data-ux` mutation is the known malformed one, replaced by its round-one fix.

The full logs are in the session scratchpad: `mutation-round3.txt`, plus the earlier files.

## Files changed in this round

- `scripts/lib/walkthrough.mjs`
- `tests/walkthrough.test.mjs`
- `tests/fixtures/proposals/unified-list.json`, `free-first.json`, `calendar.json` (the room name only)
- `kit/KIT-CONTRACT.md`
- `kit/grey/kit.css`

## Concerns

None new.

- The emoji is in all three fixtures, not one, so that the same clinic's room keeps one name.
- A choice's "at least two" message reads "a list of at least two lines of text".
