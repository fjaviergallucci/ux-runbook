# Task 12 — the templates: report

**Status:** DONE_WITH_CONCERNS (the concerns are choices a reviewer should confirm, listed at the end;
nothing is unfinished).

**Commit:** `75e4dd8` `feat: templates for every package file, the profile, the person, the briefs and the reports`
(BASE c7a7e2a, branch `v2-pipeline`, one commit, not pushed).

## What I wrote

Thirty-four templates (1,797 lines), two test files, and four small edits to existing files.

### `templates/package/` — the package, copied whole at the start of a design (24 files)

| File | Lines | What it is |
|---|---|---|
| `00-frame.md` | 68 | stage output: the request, kind · foundation · size, the route, who it is for, the provisional cast, engines missing |
| `01-context.md` | 86 | stage output: the ten things of § 4.1, one heading each, and `## Project sources` |
| `02-intent.md` | 88 | stage output: the person, the job, criteria, tasks, the ten states, the feeling, siblings, the measure, constraints |
| `03-cast.md` | 82 | stage output: one table per stage from Structure to Acceptance, left out, blind rules, fresh pass, cost |
| `DECISIONS.md` | 24 | the package's decision log, version 1's entry shape |
| `04-structure/BRIEF.md` | 123 | the describers' brief, with the walkthrough format whole |
| `04-structure/BRIEF-fresh.md` | 131 | the fresh brief: the same, plus `## What you are not given` |
| `04-structure/CHOSEN.md` | 58 | stage output: the pick, the structure, its cost, the reads, the gallery marks, what was not chosen |
| `05-detail/DETAIL.md` | 109 | stage output: rules (five headings), edge cases, data map, dependencies, the makers' lists, strings, reads |
| `05-detail/states.md` | 14 | the states table |
| `05-detail/strings.json` | 8 | the strings table: one entry, its fields as instructions |
| `06-look/LOOK.md` | 72 | stage output: mode, measured values, variants, fresh pass, named extensions, reads |
| `07-handoff/HANDOFF.md` | 97 | stage output and the builder's entry: the folder, Context · Task · Done when · Verify · Constraints, slices, what is fixed, what is written back |
| `07-handoff/SPEC.md` | 44 | per surface: job, regions, states, rules, data map, dependencies |
| `07-handoff/PARTS.md` | 25 | existing parts, and changes to the system |
| `07-handoff/ACCEPTANCE.md` | 63 | criteria as checks, states to drive, measured values, accessibility, a check's keys, the eight types |
| `07-handoff/acceptance.json` | 14 | one sample check, `visible`, of the fictional product |
| `07-handoff/DECISIONS.md` | 17 | decisions written out for a builder, with "Forces on the build" |
| `07-handoff/COVERAGE.md` | 26 | seats, checks not run, findings and what became of each |
| `build/BUILD.md` | 17 | what was built, where it lives, how to run it |
| `build/STATES.md` | 12 | the state map |
| `build/DEVIATIONS.md` | 11 | what could not be built as drawn |
| `08-acceptance/REPORT.md` | 53 | stage output: what was read, the checks, item by item, reads, deviations accepted, fixes, lessons |
| `08-acceptance/FIXES.md` | 19 | a fix as a slice: Context · Task · Done when · Verify |

### `templates/project/` (2)

| File | Lines | |
|---|---|---|
| `PROFILE.md` | 72 | the sixteen header keys with their defaults; `## How to fill the header`; the four body sections |
| `LESSONS.md` | 26 | one dated entry: tried · happened · next · his words · cost · seats that changed a decision |

### `templates/people/` (2)

| File | Lines | |
|---|---|---|
| `PROFILE-CARD.md` | 127 | `id: profile.<name>`; seven characteristics × four labelled fields; specialties with one example; the eight optional characteristics |
| `PERSON-CARD.md` | 32 | the four header keys and four sections `validatePerson` holds |

### `templates/briefs/` (3)

| File | Lines | |
|---|---|---|
| `maker.md` | 52 | |
| `judge.md` | 57 | |
| `audience.md` | 49 | |

### `templates/outputs/` (3 new; `decision.json` and `decision-approve.json` untouched)

| File | Lines | |
|---|---|---|
| `LEDGER.md` | 63 | |
| `TASK-READ.md` | 45 | |
| `PICK.md` | 13 | ruling 1: here, not in the package |

### Tests

| File | Lines | Tests |
|---|---|---|
| `tests/templates.test.mjs` | 859 | 43 |
| `tests/package.test.mjs` | 155 | 5 |
| `tests/pool.test.mjs` | changed | the `todo` test is live; the product-name test's `known` list names seven templates |

### Existing files changed

- `pool/makers/interaction-designer.md:66-68`, `interface-writer.md:67-68`, `visual-designer.md:72-73`: one
  sentence of each `## Output` now names its template (ruling 9). Nothing else in a card changed.
- `tests/pool.test.mjs`: as above.
- No script was changed. `pool/audiences/task-reader.md`, `pool/persons/*` and `pool/INDEX.md` were not touched.

## The twenty-five rulings

`T:n` is the test at line n of `tests/templates.test.mjs`; `P:n` of `tests/package.test.mjs`.

| # | Ruling | Carried out in | Held by |
|---|---|---|---|
| 1 | `PICK.md` is not a package file | `templates/outputs/PICK.md:7` (`Pick: {…}`), words under `## In his words` :9; nothing named `PICK.md` or `MAP.sealed.json` under `templates/package/` | T:122 (file list), T:126, T:372 (sealed as it is; opens for a letter and for `none`; a letter not on the board stays sealed — through `mergeProposals` and `openMap`) |
| 2 | `01-context.md`: ten headings and Project sources | `01-context.md:17-71` (eleven content headings) | T:214 (the exact list) |
| 3 | HANDOFF and REPORT carry the stage header; Carry optional | `07-handoff/HANDOFF.md:1-6`, `08-acceptance/REPORT.md:1-6`; neither has `## Carry` | T:159, T:166, P:64, P:83 |
| 4 | BRIEF-fresh names what it withholds only in its section | `BRIEF-fresh.md:38-44` | T:288 (every other line, the template's own comment included) |
| 5 | `built-from: []`, nothing under `## Carry` a stamp refuses, the instruction where the reader passes over it | all nine headers; the instruction is an HTML comment **above** `## Carry` (e.g. `00-frame.md:62-66`) | T:159, T:166, T:192, P:64, P:115 |
| 6 | `acceptance.json` passes `validateAcceptance`; ACCEPTANCE names the eight types | `07-handoff/acceptance.json`; `ACCEPTANCE.md:44-63` | T:495 (types against `TYPES` and the in-page header, parameters cell by cell), T:514 |
| 7 | HANDOFF names `IMPLEMENTER-GUIDE.md` inside the folder; templates name only what exists | `HANDOFF.md:23` | T:467, T:847 (every kit path a template names exists; none under `skills/`, `reference/`, `tests/`), T:526 (no handoff file points into the package) |
| 8 | Data map and dependencies have a home | `DETAIL.md:23` Rules, `:56` Data map, `:64` Dependencies; `SPEC.md:33`, `:41` | T:399, T:487 |
| 9 | Cards name their templates; the `todo` test is live | the three card sentences above; `tests/pool.test.mjs:986` | pool test :986; T:458 |
| 10 | PROFILE.md | header `PROFILE.md:1-18` (all values default or empty); `## How to fill the header` :27-50 (`engines-on` :47, `keys-file` :50) | T:578 |
| 11 | `03-cast.md` columns | `03-cast.md:13-15` (suggestions; `none` shows a dash), tables :19-45 | T:251 |
| 12 | The standing browser line | `maker.md:43`, `judge.md:47`, `audience.md:39`, each inside `## Do not open` | T:698 |
| 13 | PERSON-CARD against `validatePerson`; PROFILE-CARD per § 8 | `people/PERSON-CARD.md`, `people/PROFILE-CARD.md` | T:622 (filled twice: with a profile, and with none; the checker also refuses the template as it stands and a misspelt profile id), T:651 |
| 14 | Braces hold instructions; a template says what is what | the `<!-- Template. … -->` comment in every Markdown template | T:133 |
| 15 | No template longer than it must be | line counts above; 562 brace instructions, none over three wrapped lines | by reading |
| 16 | Generic | illustrations are the room-booking tool only, each marked ("as:", "Example, to delete", "an example, of a room-booking tool") | pool test "no product name appears in what the kit ships" (now names seven templates as read) |
| 17 | The design sections read | § 4, 5, 8, 9, 11, 12, 13, 14, 15, 23 and no other; the plan was not opened (one `grep` for the phrase "eight columns") | — |
| 18 | The package walk on the real CLI | `tests/package.test.mjs` | P:64, P:83, P:99, P:115, P:138 |
| 19 | The Structure brief carries the format | `BRIEF.md:43-123`, `BRIEF-fresh.md:51-131`, byte-identical | T:316 (all words against `KEYS`, `ROLES`, `CONTAINERS` both ways; the three lists in order), T:335 (the rules; the example through `validate`; one JSON object and nothing else) |
| 20 | LEDGER takes what the eight judge cards return | `outputs/LEDGER.md:6` top line, `:11-57` sections | T:749, T:770 (each thing a card's Output says its ledger holds has its section) |
| 21 | Strings carry their why-lines | `strings.json:6` (`note`); `DETAIL.md` § Strings; `judge.md:35` | T:430, T:730 |
| 22 | STATES.md names an account by role | `build/STATES.md:6-8`; also `BUILD.md:16-17` and `PROFILE.md` § How a browser check is run here | T:550 |
| 23 | A profile's id is `profile.<name>` | `PROFILE-CARD.md:2` | T:651; T:622 uses `profile.front-desk-coordinator` |
| 24 | TASK-READ opens with the card's caveat | `outputs/TASK-READ.md:1` | T:806 (the sentence is read out of `pool/audiences/task-reader.md`), T:817 (the nine questions too) |
| 25 | "So the interface must" can be taken out by rule | `PROFILE-CARD.md:11-15` states the rule; every field is a block that begins with its label; `audience.md:26-28` hands the traits and `:35` hides the profile; `maker.md:32`, `judge.md:33` hand it whole | T:677 (the rule applied to the template: eight fields out, none left, the other three labels and every heading kept), T:713, T:730 |

## What I tested

**RED.** Both new files were written before any template. First run: 47 of 48 failing, each for a missing
file (`templates/package/00-frame.md is not in the kit`, `ENOENT … templates/package`). The one that passed
is the decision page test, on the two files Task 6 left.

**GREEN.** `node --test tests/templates.test.mjs tests/package.test.mjs tests/pool.test.mjs`: 134 tests, 134
pass, 0 todo. `npm test` on the tree that was committed: 595 tests, 594 pass, 0 fail, 1 skipped (the NTFS one), 0 todo, in 186 s. Standard error empty; `tests/.tmp/` left empty.

**Would the tests fail if a template lost what they check?** 54 mutants, each one change to one template
(a heading renamed, a row dropped, a label moved, a header value changed, the caveat reworded, a pick left
in the package …), run against the three covering files and restored: 54 of 54 killed. The script is not
in the repository.

### What the package walk found about `state`

Nothing in `state` contradicts the brief's description of the walk. Four things worth knowing:

1. **The carry reader passes over nothing below the heading.** Ruling 5 allows "an HTML comment or
   wherever the carry reader passes over it"; an HTML comment under `## Carry` is refused like any other
   line ("is not a carry entry"). So each template keeps its carry instruction in a comment **above** the
   heading. T:192 and P:115 prove both halves: the comment where it is, accepted; the same comment moved
   under the heading, refused.
2. **A carry list may be empty.** The frame template is stamped untouched (P:115).
3. **The handoff and the report need no carry list** (`required` is false for both in `carryContext`), so
   the walk adds its `- source:README.md` only to the seven outputs that have the section, and asserts
   those are exactly frame to look.
4. `init` accepts a folder that already holds the copied templates (it refuses only an existing
   `state.json`), and `begin` on a copied template rewrites its header, adding `approved: ""` and
   `words: ""`. Both are what a skill wants.

The walk also runs a `correction` (frame → detail → handoff → acceptance, each built from the stage before
it on its route; a skipped stage's template is copied and refused) and carries sections between templates
by the slug `state slug` prints, so the headings are proven carriable.

## What I ported, and what I left

**Version 1 (`master`).**
- `templates/SURFACE-BRIEF.md`: the brace convention itself; "If it needs two, it may be two screens" (the
  intent's one job); the ten states with what each must answer; "data types, never components" (the
  context's inventory). Left: the shell section, entry and exit points (they became "Arrives with, leaves
  with"), the capitals.
- `phases/1-DISCOVERY.md`: the ten-state table, its rows renamed to design § 4.2's ("Loading — refresh",
  "Success", "Overflow"); the test of a criterion, word for word ("could two people disagree about whether
  it was met? Then sharpen it"); "cannot occur because …" for a row that cannot happen, and why a row is
  never left out. Left: the interview blocks, roles against personas, the product frame — setup's and
  Context's business, not a template's.
- `templates/DESIGN-DECISIONS.md`: the entry whole (Decision · Why · Rejected · Cost, accepted ·
  Consequence) and "appended, never edited", in `package/DECISIONS.md`. The handoff's copy keeps four of
  the five and calls the last "Forces on the build", which is § 13's wording.

**§ 23 sources (read-only, in the other repository).** Opened: three files of
`docs/marketing/visuals/playbook/briefs/` (`describers.md`, `judge-audience.md`, `judge-creative.md`);
`.claude/skills/visuals-physician-viewer/references/viewer-read-template.md` and the first forty lines of
its `persona-cards.md`; the first forty lines of `docs/marketing/visuals/playbook/LESSONS.md`. Nothing
else there was opened, and nothing under `temp/media/`.
- From the briefs: the shape of a seat's brief — a first line that sends the seat to its role text, what
  to read "in this order", a blind list, where to write, a reply of one line — and the rule that a brief
  gives context and never the design, and that the founder reads it first.
- From the viewer read: the caveat on top, who read and what she was shown, the answers per option, the
  ranking with the size of each gap, a disagreement kept as a finding. The questions themselves are the
  audience card's, not that template's.
- From the lessons file: an entry as *what was tried · what happened · what the next one does
  differently · cost*, to which § 14 adds his words and the seats that changed a decision.
- Left behind: every product, person, profession, engine and file name; the scores; the post types; the
  read's "for the founder" block and its severity words. Nothing is copied verbatim and no passage under a
  third-party licence was ported, so no attribution is owed.

## Self-review

- **Completeness.** Every file of the brief's list as the rulings correct it (PICK.md moved); every row
  of the brief's test table; every ruling, each with a test except 15 and 17, which are a reader's.
- **Read as the session that fills it.** I re-read each template knowing only it. Three briefs had words
  meant for the seat inside braces, where a filler would have replaced them with a path and lost them
  (the re-read's "only after you have read the artefact cold", the why-line's standing, the judge's
  checks). They are now outside the braces, as structure.
- **Discipline.** No script changed; no dependency; no file beyond the list. Two things are beyond the
  letter of the brief and are listed below (5 and 6).

### Concerns — choices to confirm

1. **Eight columns.** Design § 9 lists seven fields for a finding. The brief and ruling 20 say eight. The
   eighth here is `#`, the finding's number: the re-read marks and `COVERAGE.md` need a way to name a
   finding. If another eighth was meant, it is one cell in `LEDGER.md:16-18`.
2. **The ordinary state.** The intent's ten states do not include the screen as it ordinarily is, but the
   fixtures and the acceptance checks have a state `default`. `states.md` therefore asks for "the screen
   as it ordinarily is, named `default`, then every state of the intent's table, none left out and none
   added". The interaction designer's card says "add none" of the intent's states; I read `default` as
   not an addition. The card was not changed.
3. **`BRIEF-fresh.md` at Look.** The cards say that at Look the fresh brief also names the one screen and
   carries its approved items. There is no second template: the template's own comment says "At Look it
   is this brief with one section more". The Look skill's task may want more than that.
4. **`strings.json` and `acceptance.json` differ in kind.** `strings.json` holds brace instructions as its
   keys and values (it parses, and says what each field is). `acceptance.json` is a real sample, because
   ruling 6 asks that it validate; `ACCEPTANCE.md` says it is an example to replace.
5. **The Structure briefs have two sections the brief's table does not list**, `## The hardest state` and
   `## Language and device`: the describer's card plays "the hardest state the brief names", and § 12
   gives a fresh maker "the language, the device".
6. **Two folder names come from rulings written ahead for later tasks** (R128, R130, read in
   `progress.md`): `chosen/` in `CHOSEN.md:25` for a redrawn pick, and `results/` with
   `accept report --checks` in `REPORT.md:20-21`.
7. **The example in the briefs.** Ruling 19 asks for one small example in a brief that otherwise must not
   suggest a design. It is of the room-booking tool and the brief says it "is from another product and
   shows the format only: its structure is not a suggestion". On a project that is itself a booking tool
   it would still be a bias.
8. **The pool's path test is live for `templates/`, `skills/` and `reference/` at once**, not split: no
   pool text names a skill or a reference file yet, so there is nothing to leave `todo`. A later task that
   names one in a card must have written it.
9. **A profile card's header has one key, `id`.** § 8 defines no header and ruling 23 asks only for the id.
10. **One flaky test that is not this task's.** `npm test` was run three times. The first and the third
    were green. In the second, `tests/describe.test.mjs:950` ("a proposal and a raw file never both exist
    after a run", Task 8) failed once: its temp folder held a `.fuse_hidden…` file, which is how this
    NTFS mount keeps a file removed while a handle is still open. Run alone three times, that file
    passed 47 of 47 each time. I did not touch it: no script and no test of Task 8 is in this task.
11. **One blocked command, nothing read.** The machine's secrets guard refused a shell command of mine
    because its text held a made-up dotenv file name (a mutant for the profile template). No credential
    file exists in this work, none was opened, and nothing was printed. I rewrote the mutant with a
    neutral path.

---

# Fix report — round 1

**Commit:** `9234480` `fix: the brief shows a specimen, not a design, and the templates' smaller findings`
(on `f81dab7`, the tree as it stood; one commit, not pushed). 29 files: 28 templates and
`tests/templates.test.mjs`. No script, no pool file and no other test was touched.

Tests were changed first: 11 of 45 failed for the reasons below, then the templates were changed.

## The findings

"T:n" is the test at line n of `tests/templates.test.mjs`.

| # | What was done | Where | Held by |
|---|---|---|---|
| **I1** | The Seats table has a "Checks run" column: a judge's core checks and each optional check that ran, by id; a dash for a maker. | `package/07-handoff/COVERAGE.md:10-12` | the handoff test asserts the exact header row of both tables |
| **I2 / R133** | The example proposal is gone. Each brief carries a **specimen**: the seven keys a writer writes; a screen and a dialog over it, so every key of a screen is there; every role once and every container once, in the format's order; every key of a role and of a container. Its words name the part ("(a heading)", "(the main action)", "(an option)") and its ids are `a-screen`, `a-dialog`, `an-item`. One sentence above it: "A specimen of the syntax, not a proposal: it shows every part once, in no meaningful arrangement, and a proposal that resembles it has copied it." The line "not a suggestion" is gone. | `BRIEF.md:109-138`, `BRIEF-fresh.md:116-145`, byte-identical | T:390: valid as written; two broken copies fail (one title twice; the expansion without its label); keys of each level complete and in the format's order; roles equal `ROLES` and containers equal `CONTAINERS`, each once and in order; one primary action; every text is a bracketed phrase that names a part, none twice; no word of the example product, or of any, in the fence; the sentence above it |
| **M1** | HANDOFF's `prototype/` row: one page "for each screen, state and language, each serving every theme", with reference pictures "at each width and theme". | `HANDOFF.md:24`, as `LOOK.md:22-23` | T:553 asserts the same phrase in both files, and that the old one is gone |
| **M2** | `## On a re-read` comes before `## Findings`. On a first read it holds the one line "first read"; on a re-read the artefact is read cold and the findings below are written first, then the marks. | `outputs/LEDGER.md:11-21`, `:23` | T:859 (the order; the first-read line; "findings below") |
| **M3** | The sample check's state is `empty-filtered`, the name `states.md` shows, which is the intent's row "Empty — filtered to nothing"; its page is `today-empty-filtered-en.html`. ACCEPTANCE says the file is one object with two keys, `design` and `checks`. | `acceptance.json:7-8`; `ACCEPTANCE.md:46` | T:608 (the state is the one `states.md` gives; its words pick out exactly one row of the intent's table; the page is design-state-language); T:587 (`design`, `checks`) |
| **M4** | CHOSEN's pick points at `PICK.md` for what he said and repeats nothing; it keeps the letter, the name and a graft as that file has it. The gate keeps only what he asked to change. PICK.md is where his words are, with "a bit of each is not a pick". | `CHOSEN.md:16-19`, `:50`; `outputs/PICK.md:11-14` | T:441, and the pick test |
| **M5** | The audience brief: "nothing in the package but the pictures listed above, and nothing in the handoff folder". Its title is `# Brief · audience.task-reader`. | `briefs/audience.md:7`, `:35-36` | T:817 |
| **M6** | `## How to work` in both briefs, before `## What to return`: no interface at all; the first idea set aside, the habit of the category; one way, whole; the real words and the worst rows; the hardest state played through. No lens. The opening line now reads "This page is the whole brief. A describer started from a card is also given its card and a lens" (the fresh brief: "a maker … its card"). | `BRIEF.md:10-11`, `:40-48`; `BRIEF-fresh.md:10-11`, `:47-55` | T:294 |
| **M7** | `## What the readers found` in the intent, before the gate: filled "only when the profile judge was cast to read the intent", "Not read" otherwise. | `02-intent.md:78-81` | T:250 |
| **M8** | Every instruction in braces is at most two lines: 579 of them, the longest 209 characters. 28 were over; 20 more still held three sentences and were cut too. | 24 templates | T:149 (at most one line break and 210 characters, in every Markdown template) |

## What M8 moved rather than cut

Cutting an instruction to what the filler writes removed some sentences that are rules the *filled* file
must keep. Those are now plain text outside the braces, so they stay when the braces are replaced:

- `build/STATES.md:6-7`: what a row may name, and "No password, token or key is ever written in this
  file." Ruling 22 asked for this "in its instruction line"; it is now a kept line, which is stronger.
  The same for `project/PROFILE.md` § How a browser check is run here, and `build/DEVIATIONS.md:6-7`
  ("the founder decides each at Acceptance").
- `03-cast.md:13-14`: model and effort are suggestions he may change; `none` shows a dash.
- `HANDOFF.md` § Verify: the checks are run on the build afterwards, from the state map.
- `DETAIL.md` § Strings: what `max`, `where` and `note` hold.
- `PROFILE-CARD.md` § Specialties and § Optional characteristics: the rules of inheritance and of when a
  characteristic counts as defined.

What was only teaching is gone: who writes which section of DETAIL, why a state is never dropped, where an
open finding is shown, what the palette belongs to. The stage skills say those.

## Tests

- `node --test tests/templates.test.mjs tests/package.test.mjs tests/pool.test.mjs`: 136 tests, 136 pass.
- `npm test`, once, on the tree that was committed: 598 tests, 597 pass, 0 fail, 1 skipped (the NTFS one),
  0 todo, 193 s; standard error empty.
- Mutants: the first round's 54, brought up to date, and 24 new ones for this round (a role dropped from
  the specimen or written twice, a product word or a real label in it, `author` added, a second primary
  action, its sentence replaced, `How to work` renamed, a lens named, the old opening line, a page per
  theme, the ledger's order put back, the first-read line dropped, the old state name, `design` left out,
  his words asked for again, the pointer to PICK.md removed, the package shut whole, a design's name in
  either title, the intent's section renamed, an instruction of three lines, one of a single long line,
  the coverage column removed): **78 of 78 killed**. The script is not in the repository.

## Three things to confirm

1. **The specimen has the seven keys a writer writes, not all twelve.** R133 says "every proposal key".
   The five others are who made it (`author`, `engine`, `track`, `model`, `source`), which the same brief
   tells the writer to leave out and `describe` writes itself. A specimen holding them would be copied
   with them. T:390 asserts the seven, and that the five are absent.
2. **`outputs/TASK-READ.md`'s title lost the design's name too** (`# Task read · {the stage}`), though M5
   names only the brief: an audience that is not told the name cannot write it. Its stage moved from the
   brief's title to a line of `## Who you are`, because the audience card reads differently at Structure.
3. **The briefs' `## The hardest state` illustration** was "nothing is free; two hundred rows". It sits in
   braces and is replaced, but I changed it to "the list is empty; it has two hundred rows" so that no
   word of the example product is left anywhere in a brief.

Concern 7 of the first report (the example as a bias) is closed by I2. The others stand as written.

---

# Fix report — round 2

**Commit:** `619f041` `fix: the fresh brief has a Structure form and a Look form, and four smaller findings`
(on `9234480`; one commit, not pushed). Eight files: six templates, `pool/audiences/task-reader.md` (one
sentence, as this round allows) and `tests/templates.test.mjs`. Nothing under `scripts/`; nothing of the
other task (`skills/` and `tests/skills.test.mjs` were not in the checkout when I staged or ran).

Tests were changed first: 9 of 47 failed, then the templates were changed.

## The findings

"T:n" is the test at line n of `tests/templates.test.mjs`.

| # | What was done | Where | Held by |
|---|---|---|---|
| **N1 / R134** | `BRIEF-fresh.md` holds two forms, each opened by a one-line comment, and its opening comment says what is kept and what is deleted at each stage. **Structure form** (`:43-150`): `## The hardest state`, `## How to work`, `## What to return` with the format and the specimen. **Look form** (`:152-167`): `## The one screen` — "Its structure and its words are decided. Draw it with these items, in this order, and these words exactly as written: add no element, drop none, rewrite no string, and draw no other screen. Choose only how it looks." — with the screen, its state, and its items in order with their words; then a `## What to return` of its own: "The screen as one self-contained page, and nothing else". | `package/04-structure/BRIEF-fresh.md:1-6`, `:43`, `:152` | T:357: both marks, once each, in order; the opening comment names each form's sections; the Structure form ends hardest state · how to work · what to return; a copy reduced to the Look form ends the one screen · what to return, says the five things above, and holds none of "no interface", "another kind", "propose one way", "first idea", "set it aside", "concept of your own", "hardest state", nor the format's heading, a fence, `firstIdea`, `absent`, `expansion` or "JSON"; either form has no mark left and one `## What to return`. T:349: the template whole, and each form, name what is withheld only inside `## What you are not given`. |
| **N2** | The edge cases are "each of the edges your card names, and … this product's worst cases". The partial list is gone. | `package/05-detail/DETAIL.md:48-49` | T:574 |
| **N3** | "the session's own idea" is back among what the describers do not see. | `package/03-cast.md:55-56` | T:574 |
| **N4** | The project sources keep the three examples of § 4.1, within two lines. `states.md` says, as plain text that survives filling: "A state's name here is the one its pages and its acceptance checks use." | `package/01-context.md:71-72`; `package/05-detail/states.md:12` | T:574 (the sentence is looked for with comments and braces removed) |
| **N5** | The sample check has a `language` and a `screen`, and its design is "front desk", not its screen's id. The test asserts the page is screen-state-language, that the design differs from the screen, and that the page does not hold the design's name. | `package/07-handoff/acceptance.json:2`, `:8-11` | T:691 |
| **The card** | One sentence of `## Never`: "…and nothing in the package but the pictures you are handed." The header, the caveat, the lists and the method are untouched. | `pool/audiences/task-reader.md:84-86` | T:902 (the card and the audience brief say the same) |

The existing brief tests now read the fresh brief in its Structure form — the template with the Look form
and both marks removed, as a filler leaves it — so they hold what is sent, not the template's two halves.

## Tests

- `node --test tests/templates.test.mjs tests/package.test.mjs tests/pool.test.mjs`: 138 tests, 138 pass.
- `npm test`, once, on the tree that was committed: 600 tests, 599 pass, 0 fail, 1 skipped (the NTFS one),
  0 todo, 190 s; standard error empty. `tests/skills.test.mjs` did not exist yet, so it was not run.
- Mutants: the 78 of the earlier rounds and 17 new ones (the Look form invites a redesign, asks for
  another kind, loses its mark, asks for JSON, may change the words, may choose more than the look, names
  the kit; the Structure form loses its mark; the opening comment stops saying which is which; the shared
  part asks for a concept; the hardest state is shared again; a partial edge list; the blind rule dropped;
  the source examples dropped; the state-name line put back in braces; the page named after the design;
  the design named after its screen): **95 of 95 killed**. Only templates were mutated, never the card.

## Three things beyond the letter of R134, to confirm

1. **`## The hardest state` is part of the Structure form**, so it is deleted at Look with the other two.
   R134 names two sections to delete. At Look the one screen's state is given in `## The one screen`, and
   a section about states "the concept must be played through" would sit beside an order to change
   nothing. In `BRIEF.md` it is where it was.
2. **The ask moved out of the shared opening.** The opening said "You are asked for a concept of your own:
   the one or two screens that carry the idea", which is as wrong at Look as the method was. That sentence
   now opens the Structure form's `## How to work`, and the Look form opens with its own ("You are asked
   to draw one screen, in one state"). The shared opening says only what the reader knows and that the
   ask is at the end. T:357 asserts the shared part holds none of "concept", "propose", "draw".
3. **Two shared sentences lost the word "concept"** for the same reason: "whatever needs more is asking
   for a dependency", and "this brief asks for work made without it".

---

# Fix report — after the re-review

**Commit:** `a2d3ff8` `fix: two wordings after the templates' review` (on `619f041`; one commit, not pushed).
Three files, nothing else touched; `tests/skills.test.mjs`, the other task's, was left unstaged.

| # | What was done | Where | Held by |
|---|---|---|---|
| 1 | The double negative is gone. The line is now two clauses that each stand: "Never open the intent, her profile, a maker's notes, a ledger or another read, even to make sure of a task; and open nothing in the package but the pictures you are handed." | `pool/audiences/task-reader.md:84-86` | `tests/templates.test.mjs:911` — the pin holds "nothing in the package but the pictures you are handed", words that did not change, so it was left as it was |
| 2 | "the edges your card names" is now "the edges the interaction designer's card names", true whoever fills the section. | `templates/package/05-detail/DETAIL.md:48-49` | `tests/templates.test.mjs:577` — the pin held the old words, so it was updated first and seen to fail, then the template was changed |

**Tests:** `node --test tests/templates.test.mjs tests/package.test.mjs tests/pool.test.mjs`: 138 tests, 138
pass. The whole suite was not run, as asked. No concern.

