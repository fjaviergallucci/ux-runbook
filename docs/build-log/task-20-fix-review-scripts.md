# Task 20, step 5b · review of wave B, the scripts

Diff `c83039d..557e6e1` (eleven commits, 32 files). Read-only: nothing of the kit was changed or committed.
Probes ran in a scratch folder under `/tmp/claude-1000/`; mutations were made on a copy of the kit there.

**Spec: not met.** Eight of the ten are done as asked: F62, F96, R161, R162, R170, R173, R186, R187.
Two are only half done:
- **R180.** "Handoff runs it so" holds on paper. But at the step where Handoff runs it, the check cannot pass on a real package (S1).
- **R171.** On Structure's graft path an audience is still handed pictures drawn with the makers' notes (S2).

**Quality: changes needed.** 2 Critical · 2 Important · 12 Minor.

## Findings

### S1 · Critical · `skills/handoff/SKILL.md:88-91`, `skills/handoff/references/folder.md:70-78` — the pointer check runs at a step where it cannot pass, and never runs where the pointers are

Handoff runs `alone.mjs <package>/07-handoff --package <package>` at step 3, and says it "must exit 0". At that step it cannot.

- **Why it fails.** Frame starts the package's own `DECISIONS.md` (`skills/frame/SKILL.md:41`), so a real package always holds one at its root. At step 3 the folder holds `HANDOFF.md`, copied from its template at step 2 (rows at lines 30 and 80 name `DECISIONS.md`), and the guide, copied whole (`IMPLEMENTER-GUIDE.md:26` names it). The folder's own `DECISIONS.md` is not written until step 4.
- **The probe.** I built a package from `templates/package/` with the folder as step 3 leaves it. The check printed 3 places, all `DECISIONS.md`, and exited 1.
- **After steps 4 to 7.** With every file of the folder written from its template, the same package passes: "none of its 13 text files names…".
- **The other half.** Step 3 is also the only time the check runs. folder.md repeats it only "after any of them changes": the pages, the token file, the index. So `SPEC.md`, `PARTS.md`, `DECISIONS.md`, `ACCEPTANCE.md` and `COVERAGE.md` are never read for pointers before the cold implementer starts. Those are where the run's cold reader found them (the coverage rows, the writers' notes). F93 would happen again exactly as it did.
- **Why the tests pass.** In the run-as-written test (`tests/skills.test.mjs` ≈5401–5446) the package has no root `DECISIONS.md`, and the check runs before the guide is copied. The cold-implementer fixture's package holds only `07-handoff/` and `work/`. The implementer's report says "the whole of Handoff, run as written, passes with the flag", and it rests on that ordering.
- **Fix.**
  - Step 3 keeps the address check alone, `alone.mjs <package>/07-handoff`.
  - The `--package` run moves to after step 7 (every file written) and before step 8. It is run again after any change in step 9. folder.md's "Once the pages…" paragraph says the same.
  - The run-as-written test writes a root `DECISIONS.md` as Frame does, and runs the check at the step the skill names.

### S2 · Critical · `skills/structure/references/rounds.md:20-32` — the graft re-read hands an audience the makers' notes

A pick with a graft:
- The structure is redrawn to `chosen/chosen.json` "in the form the letters' files have", so it carries the bet, the cost, the absences, the hardest state and the notes.
- It is drawn once, with them (`render.mjs … chosen.html --letter <letter>`), and shot without `--first-screen`.
- Step 3 then says "an audience is handed the new pictures only".

So the audience gets exactly what `structure/references/seats.md` puts under its "Do not open": "the pictures of the pages that carry the makers' notes". It also gets no first screen for "without scrolling". The report treats `rounds.md` as unchanged on purpose ("a command without them does what it always did"), but here the old command is what breaks R154.

**Fix:**
- Step 2 gains the second render (`--out <package>/04-structure/chosen/chosen-screens.html --letter <letter> --without-notes`), and its shots take `--first-screen`.
- Step 3 hands the audience `chosen-screens-<width>-light.png` and its `-first.png`.

This overlaps the words reviewer's part: it is a command line for this wave's flags.

### S3 · Important · `skills/handoff/references/folder.md:110-118` against `SKILL.md:91` and `folder.md:78` — a pointer in an approved file is a dead end

folder.md says:
- A pointer in an approved file (a stylesheet's comment, a state's row) is not rewritten. `PARTS.md` says where it is and what it stood for.
- The check prints that place and exits 1.
- The skill says the check must exit 0, and step 6 is not run before it does.

This is the dry run's own case (Look's stylesheet comment naming `measures.md`), and the conductor would have to guess whether this exit 1 may stand. And if `PARTS.md` writes the name it explains, that is one more place the check reports.

**Fix:** say that the remaining places, each in an approved file and each listed in `PARTS.md`, let the stage go on, and are put to the founder with the gate. Say too that `PARTS.md` describes the pointer without writing the file's name. A `--allow` list for the script is the other way.

### S4 · Important · `scripts/lib/card.mjs:381` (`checkFields`), `:139` (`traitsOf`) — a criterion written over two blocks reaches the audience

I wrote one field as `So the interface must:`, a blank line, then `- Say what is free now…` and `- Call a room by the name on its door.`
- `check` prints `ok`.
- `traits` exits 0, and both list items are in the copy.

The copy is refused only when the words "so the interface must" are left in it, and the list holds no label. The template says a field "is a block of its own: it begins with its label and ends at the next blank line". Nothing enforces it: a characteristic may hold any other block. A blank line before a list is common Markdown, so this is how a profile written by hand defeats R162 without anyone seeing it.

**Fix:** `checkFields` refuses a block inside a characteristic (and inside a `####` of a specialty) that opens with none of the four labels. Add a test with the list form.

### S5 · Minor · `scripts/inpage/accept-inpage.js:31`, `shownText` (≈208–245) — an empty block between two texts reads them joined

- `<div>Room 5<hr>free</div>` reads "Room 5free". She sees two lines, and `innerText` gives "Room 5 free".
- `<div>Ro<div></div>om</div>` reads "Room". She sees "Ro" over "om".

The header states this ("an empty block … adds nothing"), but it is the one case where F96's rule, "as she sees them", is not kept.

**Fix:** when the walker passes a shown element that is not laid out in a line, set `broken`, as for a `<br>`.

Everything else I tried reads as she sees it, and as `innerText` does:
- `<b>Ro</b>om` → "Room" (no space gained).
- A `<br>`, two `<br>`s, a `<br>` with `visibility: hidden` (it still breaks the line), and a hidden `<br>`.
- `hidden`, `display: none`, `visibility` and `opacity: 0` text, which is left out.
- Floats and absolutely positioned elements, `inline-flex` items, table cells and ruby.

What does not read as she sees it was so before this wave:
- **Visually hidden text.** The clip and 1 px pattern still reads ("Room screen reader 5").
- **Inline-block chips with no white space between them.** `<button>Book</button><button>Undo</button>` reads "BookUndo", as `innerText` does. A JSX build writes no white space between elements on separate lines, so a check written from the prototype fails there. It fails loudly, not silently.

### S6 · Minor · `skills/design/references/loop.md:125-127`, `templates/briefs/audience.md:36-37` — first screens are asked for at every stage, and taken at one (concern 3)

The audience brief's slot ("which show the first screen only … 'without scrolling' is answered on the first") is general. Only Structure takes such pictures. At Detail and Look the conductor has nothing to name, and "without scrolling" is read off whole pages again: F52, two stages later.

The implementer's reading of the ruling's scope is right (its "if wrong" line says "twice the pictures at Structure"). Taking first screens at Look would change what Handoff copies into `prototype/shots/`, so it is a decision for the controller. Until it is made, the two sentences should say "at Structure".

### S7 · Minor · `skills/design/references/blind.md:85-100` — the blind protocol still renders once

Its steps 5 to 7 render each letter once, photograph once with no first screen, and hand an audience "the pictures". That disagrees with Structure's step 7 and its seats page.

**Fix:** one line in each of steps 5 and 6, or a pointer to Structure's step 7 for the commands.

### S8 · Minor · `scripts/lib/frontmatter.mjs:133-141` — not every header it writes is YAML

These are written raw, and PyYAML refuses each:
- C0 control characters: `\x0b`, which Word uses for a soft line break, and `\x07`, `\x1b`, `\x00`.
- U+0085: `words: a\x85b` fails "while scanning a simple key".

`state.mjs`'s `oneLine` maps only CR, LF, U+2028 and U+2029.

Also, a list item that needs quotes and holds a backslash (`["C:\q, x"]`) is refused, or misread as an escape. The header says so, but the claim "a header that serialize writes is one a YAML reader takes too" is then not true.

**Fix:**
- `oneLine` maps `\x0b`, `\x0c` and `\x85` to a space, like the other breaks.
- `writeString` refuses any other C0 character except the tab.
- `writeItem` refuses that backslash item, as it refuses a `"`.

Everything else I tried round-trips through the kit and through PyYAML:
- A value with both kinds of quote, one that is only quotes (`"`, `'`, `''`, `""`, `"'`, `'"`), and `'a'`.
- A colon, a leading `#`, a tab, a padded value, NBSP and BOM.
- A header stamped in the earlier double-quoted form.

### S9 · Minor · `scripts/alone.mjs:273` (`entries`), `:326` — symbolic links and swapped arguments

- **A link to a folder, or a dangling link.** Either makes `--package` crash with a stack trace (`EISDIR`, `ENOENT`), not an `AloneError`. Without the flag the same folder passes.
- **A link to a package file** is read for its text, and is not reported as pointing back.
- **Spellings the check does not find:**
  - A name written `my%20notes/` (written as it is, `my notes/` is found).
  - A UTF-16 file, which is passed over as binary.
- **Swapped arguments.** `alone <package> --package <package>/07-handoff` prints "stands alone" and exits 0.

**Fix:** list entries with `lstat`, and say what a link is. Refuse a `--package` that lies inside the folder.

Everything else I tried was sound:
- A name the folder holds, a name inside a longer one (`my-measures.md`, `measures.md.bak`, `.mdx`), and a name at a sentence's end.
- `../build/` and `build/`, and a path with a space.
- A binary file, CRLF, and a folder given as its own package.
- A 20 MB one-line file against about 1,800 names: 9.6 s.

### S10 · Minor · `kit/KIT-CONTRACT.md:61-67` — the contract describes only the page with the notes

The contract describes the page's header as drawn with the notes. `render.mjs` still says it draws "exactly the markup kit/KIT-CONTRACT.md states", and the page without notes is `<header><h1>Option A</h1></header>`. Nothing styles it differently.

**Fix:** one sentence in the contract.

### S11 · Minor · `skills/setup/SKILL.md:112`, Context's gate — a profile is first checked at Cast (concern 4)

- Setup's `README.md` line for `profiles/` does not say "checked with the kit's `scripts/card.mjs`", as the other four lines do.
- Context drafts a profile and writes his guesses into it (R166), but does not run `check` on it. It does run it for a judge's card (`skills/context/SKILL.md:75`).

The first check of a profile is at Cast, after Frame has named the profession by its file name (F9's own case) and Intent's profile judge has read it.

**Fix:** Context runs `card.mjs check` on a profile it drafted or changed, before its gate.

### S12 · Minor · the traits copy still speaks of "four fields"

The two paragraphs of the opening go. But "each under a `####` heading with its four fields" (Specialties) and "with the four fields" (Optional characteristics) stay. The audience reads that a characteristic has four fields, and is shown three.

**Fix:** word those two sentences of `templates/people/PROFILE-CARD.md` without the count.

### S13 · Minor · `scripts/card.mjs` — a refusal of `traits` prints the profile's own lines

When the copy is refused, the command prints the offending line: "copy: … is still written in "What is true: x, so the interface must be read standing"". A `check` fault quotes a line holding a criterion the same way. At Acceptance the conductor must make the copy "without opening her profession's profile", and this prints the profile's lines into its context.

**Fix:** print the line number and the label, not the line.

### S14 · Minor · `docs/design/DRY-RUN.md` — stale in four places (concern 5, and one more)

- Line 13 says the rulings run "R157 to R185". R186–R188 have no rows.
- Line 16 says a "wave B" cell is filled in later. None is left.
- Line 182, R175's row, says "a heading of its own needs the page script". `page.mjs` draws it now (R186).
- R161's row says "its two ids neutral". Three ids changed: `data-screen` `today` and `book`, and `data-ux` `free-count`.
- R180's row is true word for word, but S1 stands behind it.

The controller's to fix, as the implementer was told not to.

### S15 · Minor · `skills/design/references/loop.md` § 7 — the page's parts leave out the new heading

Its list of the page's parts ("one line for each seat, the open findings when there are any, one recommendation…") leaves out the "Accepted deviations" heading. `page.mjs`'s header and `--help` name it.

### S16 · Minor (not this wave's) · `tests/skills.test.mjs` ≈5487 — the run-as-written test leaves out the in-page file

The test's `FOLDER` has no `accept-inpage.js`, though the skill's table and step 3 copy it. So "the folder is what the skill's table lists" is untrue there, and `--package` never runs on a folder holding the file. A probe shows it names nothing of the package.

## The implementer's concerns

1. **R173, where marks are counted.** The premise is right: at `c83039d`, `page.mjs` counted the question's marks alone (line 90), and only `--help` said "in all".
   - **The right rule** is the one built: count where the conductor speaks to him, the question and the reason together, and never inside what a seat or a finding says.
   - **Why it is not too strict.** The only new strictness falls on the conductor's own sentence. A "?" there is either a second question, which the one-sentence rule misses ("B, unless you would rather have C?" is one sentence), or a quote of her words. A quote can be written "whether anything is free", with no one's words changed.
   - **What fixed F60.** Its real cause was the help text. The new `--help` and the loop's sentence fix it, and no seat's words need rewording now.
   - **Keep it.** At most, the loop could add that the reason quotes no question, as "whether …".
2. **R170, a whole single-quoted value now reads without its quotes.** Agreed: that is what reading YAML's form means, no fixture holds such a value, and the earlier double-quoted form is held by a test. The backslash list item is S8.
3. **R171, no first screen at Detail and Look.** The scope reading is right. The general slot is S6, and the gap is for the controller to decide. `KIT-CONTRACT.md` is S10. It was in reach: `kit/` was this wave's for R161.
4. **R162, setup and Context do not run the check.** Agreed. S11 says where it belongs.
5. **DRY-RUN.md is stale.** Agreed, and one more place: S14.
6. **R187, the added row in the fixture's `HANDOFF.md`.** The right call. The test holds it word for word to the template's row.
7. **(The "not mine" list.)** `accept.mjs --help` and the handoff template's `text` row are true as they stand. They say nothing of how blocks join, and the in-page header does. No change needed.

## Checked and sound

- **F62.** Every transition writes the header the new map expects (`begin` and `reopen` → draft, `await` → awaiting, `stamp` → approved). Only a hand edit trips it. The test fails on both reversions.
- **F96.** The rule, the header and the pins `Room2` → `Room 2` and `Room 1free` → `Room 1 free` all follow the item. My mutation of `IN_LINE` (dropping `contents`) was caught.
- **R161.** The specimen's tag sequence is identical, every `data-*` value aside. Its words name the part, its times are `HH:MM` on the 24-hour clock, and `kit.css` is untouched.
- **R162, apart from S4.** These are sound:
  - The id must match the file.
  - The sections must be in order, with the project's own characteristics between Domain vocabulary and Specialties.
  - A label in the middle of a line is refused.
  - A field at the end of the file with no final newline, CRLF, `--out` naming the profile under another spelling or through a link, and a `README.md` are all handled.
  - Run on every fixture profile, `check` prints `ok`. The pool and templates pins change only the folder they use.
- **R170.** The pin change in `tests/skills.test.mjs` holds the new rule: a description in single quotes is now one fault, and one in backticks is still two.
- **R171.** With a note on every screen and every role, `--without-notes` lets none of the 21 notes, nor the name, bet, cost, absences or hardest state, reach the page, its `<title>` or a comment. `firstIdea` is drawn in neither form.
- **Shots, `--first-screen`.** The tests confirm:
  - The names are `<name>-<width>-<theme>-first.png`.
  - The picture is the window, 900 px high even for a short page, and holds what is pinned to it.
  - Without the flag, earlier first-screen pictures are left as they were (documented). The only place the board is shot again moves the old board away first.
- **R173 and R186.**
  - `accepted` must be one of the nine stages (`Detail` and `null` are refused).
  - A page whose only findings are accepted has no "Open findings" heading.
  - Seat lines, findings and titles may quote a question.
  - A question with two marks is said once, as the question's fault.
  - Mutations caught: the reason's count, the dropped heading, and accepted findings counted as open.
- **R187.** The copy is byte-equal (`cmp`), and the test holds it equal.
- **Commands.** Every new or changed command runs as its `--help` gives it: `card.mjs traits`, `alone.mjs --package`, `render.mjs --without-notes`, `shots.mjs --first-screen` and `card.mjs check` over `profiles/`.
- **Limits.**
  - `structure/SKILL.md` and `handoff/SKILL.md` are at 200 lines, `cast/SKILL.md` at 197.
  - Where the blank line after a fence was removed, the next line is still indented inside the list item, so it renders, as the file's other steps already do.
- **Generic.** No name, path or product was added anywhere in the diff.
- **Mutations, all caught:** eight more across `page.mjs`, `alone.mjs`, `lib/card.mjs` and `frontmatter.mjs`.
- **Tests run:**
  - `frontmatter` 34, `state` 105, `page` 50, `pool` 115, `alone` 34, `templates` 49, `walkthrough` 40, `evals` 17 and `render` 39, all passing.
  - The `text` tests of `accept` and the first-screen tests of `shots`, passing.

## Walking one design through it

The case: a design of size `surface`, all nine stages full. The founder accepts one breach at Detail, there are five dependencies, and the project keeps no browser script.

- **Setup to Intent.**
  - The specimen is neutral, and a profile stub is written but not checked (S11).
  - His words with a `"` stamp as single-quoted YAML, and `validate` prints `ok`.
- **Cast.** A faulty profile is reported, and no seat is loaded with it.
- **Structure.**
  - The board is drawn twice, and the audience is handed `A-screens-390-light.png` and its `-first.png`.
  - The traits copy is made by the command. A profile with a criterion over two blocks leaks it (S4).
  - The decision page counts as ruled.
  - **The walk forks on a graft:** the re-read audience gets the makers' notes (S2).
- **Detail.**
  - The five dependencies are one numbered question (A2's).
  - The accepted breach goes under "Accepted deviations".
  - The audience has no first screen to be told about (S6).
- **Look.** The judges' "accepted at detail" goes into the data as `accepted: "detail"`, and the page lists it under its own heading.
- **Handoff.**
  - **The walk stops at step 3:** `alone.mjs --package` refuses on `DECISIONS.md`, which the folder does not hold yet (S1).
  - Had it gone on, the files written at steps 4–7 would never be read for pointers.
  - A pointer in an approved stylesheet leaves the session to guess (S3).
- **Acceptance.**
  - With no browser script, the driver written on the kit's library evaluates the in-page file, whose `text` check now reads blocks apart, so checks written to what she sees pass on the prototype and the build alike.
  - The traits copy is made blind, unless it is refused (S13).
  - The accepted deviation reaches the page under its heading.

## Not checked

- The whole suite in one run (single files only, as asked), the evaluation runs, and `claude plugin validate`.
- The A1 and A2 words outside the sentences this wave changed.
- The pins of the other waves.
- Each of the implementer's own mutations: I made nine of my own on a copy of the kit, and each was caught.
