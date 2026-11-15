# Task 18 — Handoff, Acceptance and the implementer's guide · report

Status: **DONE_WITH_CONCERNS** (the concerns are at the end; the first two are the ones to read).

Commit: `0e55e73` — `feat: the Handoff and Acceptance stages and the implementer's guide`

## What I wrote

| File | Lines | What it is |
|---|---|---|
| `skills/handoff/SKILL.md` | 198 | The stage: reads Look's carry, assembles `07-handoff/`, runs the checks on the folder's own prototype, starts the cold implementer on the folder alone, closes its items in the folder, one go. |
| `skills/handoff/references/folder.md` | 206 | File by file: which line of Look's carry list fills which file, the copy of the screens and the one link that changes, the strings format, `PARTS.md`, the checks and how each printed line is read, `DECISIONS.md`, `COVERAGE.md`, `HANDOFF.md`. |
| `skills/handoff/references/seats.md` | 71 | The cold implementer against its card; how each kind of item is closed; the one re-read. |
| `skills/handoff/references/forms.md` | 65 | An adjustment, a flow, a correction. |
| `skills/acceptance/SKILL.md` | 191 | The stage: a session of its own; reads the handoff folder and `build/`; drives each state; in-page checks; the table with `--checks`; the readers; the report; each deviation his; fixes; lessons; stamp. |
| `skills/acceptance/references/driving.md` | 110 | The long form of steps 3 to 5: before the first state, accounts and secrets, the nine steps of one state, the table, the checks made by hand. |
| `skills/acceptance/references/seats.md` | 183 | The seven judges and the task reader that sit at Acceptance, each against its card. |
| `skills/acceptance/references/forms.md` | 79 | An adjustment, a flow, a correction, a fix that comes back. |
| `reference/IMPLEMENTER-GUIDE.md` | 201 | For the session that builds: what the folder is, the order, three rules, four rules of building, the loop, the three files to write back, accounts and secrets, a shared machine. Names nothing outside the folder. |
| `reference/ANTI-PATTERNS.md` | 57 | Version 1's two lists (15 and 14 rows), reworded to this pipeline's stages, and a third table: the six process failures, one row each, with the rule that guards against it. |
| `tests/skills.test.mjs` | +960 | The two `waits` taken out (both rule tests live); eleven content tests and one run-through. |
| `tests/pool.test.mjs` | +8 −5 | See ruling 1 below. |

Two folders of the package are Handoff's: `07-handoff/`, which is all a builder is given, and
`07-handoff-gate/`, beside it, for the prototype run's results, the cold implementer's ledger and the
decision page. The name of the second is mine (concern 4).

## The fifteen rulings

| # | Ruling | Where it is carried out | The test that holds it |
|---|---|---|---|
| 1 | Un-`todo` the two; header, kit-root sentence, six sections, 200 lines, existing paths; pool `todo`; path rule covers `reference/` | `waits` removed from the table for `handoff` and `acceptance`. `KIT_FOLDERS` already held `reference`, and the pool's path test was already live (no `todo` was left in `tests/pool.test.mjs`): I made it assert that the three folders and the four new files exist, and corrected its comment. | `the handoff skill keeps every rule of a skill`, `the acceptance skill keeps every rule of a skill`; pool: `a template, a skill or a reference file named in the pool exists` |
| 2 | Every command as the script takes it | Table below. Each is in a code fence or a code span, so the command rule reads it. | the two rule tests; `handoff: the checks are written by stable id…`; `acceptance: a separate session…`; the run-through runs each one |
| 3 | Handoff: checks by stable id, `validateAcceptance`, `prototype` first, a failing check is a wrong check, `--allow-errors` only with its reason in `COVERAGE.md`, `cannot be told:` / `cannot be measured:`; token file with source path and commit; `PARTS.md` from the source read now; the guide copied in; the cold implementer with the folder only; every item answered or defaulted; one go | `SKILL.md` steps 3, 5, 6, 8, 9, Gate; `folder.md` "`prototype/`, and `tokens.css`", "`PARTS.md`", "`ACCEPTANCE.md` and `acceptance.json`"; `seats.md` | `handoff: the folder holds the eight files…`, `handoff: the checks are written by stable id…`, `handoff: the cold implementer is handed the folder only…`, the run-through |
| 4 | Acceptance: a separate session; folder + `build/`; `STATES.md` + the profile's section, the project's driver; `inpage`; `window.__uxAccept`; top of the page; `results/<state>.json`; `report --checks`; never a check not run and unexplained; accounts and secrets; judges and one audience; matches / deviates; accepted deviation logged and the package brought up to date; `FIXES.md` as a slice; a correction-sized fix after his nod; lessons | `SKILL.md` Reads, steps 2 to 8, Gate, Never; `driving.md`; `seats.md`; `forms.md` | `acceptance: a separate session…`, `acceptance: an account is named by its role…`, `acceptance: the seats are the cast sheet's…`, `acceptance: each item matches or deviates…`, the run-through |
| 5 | A shared machine | Handoff Never (last but one); Acceptance Never; `driving.md` "Before the first state"; the guide "On a shared machine" | `acceptance: an account is named by its role…` (its last block), the guide's test |
| 6 | The guide, for a session that never saw the pipeline | `reference/IMPLEMENTER-GUIDE.md` | `the implementer's guide stands alone…` (order against `HANDOFF.md`'s own table; the three rules against its Constraints; no kit path, no stage folder, no pipeline word but "founder", which it explains; every file it names is in the folder) |
| 7 | The anti-patterns, six process failures each one line with its rule | `reference/ANTI-PATTERNS.md` | `the anti-patterns keep version 1's two lists…` (each rule is matched against the conductor's or a template's own words) |
| 8 | What I read of the design | § 4.7, § 4.8, § 13, § 14, the three rows of § 24 that name Handoff or Acceptance. Not the plan. | — |
| 9 | Plain, short, second person, generic | Examples: `design/today`, `today-default-en-390-light.png`, "the list of free rooms", "Reserve" → "Book room", "the front-desk account of the test clinic" | the six-sections test (a room in each skill; no product name; "profile" never alone) |
| 10 | The form of Structure, Detail, Look | `references/seats.md` in both; versions as `@<version>`, read from `status`; "unless the file is already there"; a mid-stage question recorded with `await` and the stage put back with `begin`; `references/forms.md` in both | the six-sections test (no `stage@digit`); the two "is already there" assertions; the gate assertions; the forms assertions |
| 11 | Only what Look's carry names; stop on a gap | Handoff Reads, step 2, Never; `folder.md` "What the carry list hands you" (13 rows, one per line of the carry) | `handoff: it opens what Look's carry list names…` (every section it names is a heading of that stage's template and is in that stage's own carry rule); the run-through builds Look's carry as the three skills give it and asserts each line the folder needs is on it |
| 12 | Nothing a fresh maker made | Handoff Reads "Never", Never; `folder.md` (variants and pictures) | the same test; the run-through puts `fresh/`, `beside/` and the sealed file in the package and asserts the folder holds and names none of it |
| 13 | Acceptance's seats | Step 6; `seats.md` | `acceptance: the seats are the cast sheet's…` |
| 14 | Scripts that may be named | I name neither `card.mjs` nor `deal.mjs`: neither stage runs them. `reopen` is reached through the conductor's "Resuming", never copied. | the command-order assertions |
| 15 | A run-through | `Handoff and Acceptance run as written…` | itself |

## Every command, against its script

| Where | Command | Checked against |
|---|---|---|
| handoff Reads | `node <kit root>/scripts/state.mjs status <package>` | `state.mjs --help`: `status <package>` |
| handoff step 1 | `node <kit root>/scripts/state.mjs begin <package> handoff` | `begin <package> <stage> [--date <day>]` |
| handoff step 6 | `node <kit root>/scripts/accept.mjs prototype <package>/07-handoff/acceptance.json --root <package>/07-handoff/prototype --out <package>/07-handoff-gate/results.json` | `accept.mjs prototype <acceptance.json> --root <folder> --out <results.json> [...]`. Run for real in the run-through: `8 checks: 0 failed, 8 passed; results in design/today/07-handoff-gate/results.json` |
| handoff step 10 | `node <kit root>/scripts/page.mjs <package>/07-handoff-gate/decision.json --out <package>/07-handoff-gate/decision.html` | `page.mjs <decision.json> --out <decision.html>`. Run: its pictures are named `../07-handoff/prototype/shots/…`, which the script takes (a relative path, found from the page's folder) |
| handoff Gate | `node <kit root>/scripts/state.mjs await <package> handoff --question "<the one question>"` | `await <package> <stage> --question "…"` |
| handoff Gate | `node <kit root>/scripts/state.mjs stamp <package> handoff --words "<the founder's words>"` | `stamp <package> <stage> --words "…"`. Run: refused when built from nothing ("it must be built from look"), stamped when built as the skill says |
| acceptance Reads | `node <kit root>/scripts/state.mjs status <package>` | as above |
| acceptance step 1 | `node <kit root>/scripts/state.mjs begin <package> acceptance` | as above |
| acceptance step 4, `driving.md` | `node <kit root>/scripts/accept.mjs inpage` | `accept.mjs inpage` ("inpage takes nothing more"). Run: prints the path of `scripts/inpage/accept-inpage.js` |
| acceptance step 5, `driving.md` | `node <kit root>/scripts/accept.mjs report <package>/08-acceptance/results/<state>.json --checks <package>/07-handoff/acceptance.json --out <package>/08-acceptance/checks.md` | `accept.mjs report <results.json>... --out <file.md> [--checks <acceptance.json>]`. Run three times and once refused (below) |
| acceptance step 8 | `node <kit root>/scripts/page.mjs <package>/08-acceptance/decision.json --out <package>/08-acceptance/decision.html` | as above |
| acceptance Gate | `node <kit root>/scripts/state.mjs await <package> acceptance --question "<the one question>"` | as above |
| acceptance Gate | `node <kit root>/scripts/state.mjs stamp <package> acceptance --words "<the founder's words>"` | as above |
| the guide | none of the kit's: the builder has no kit. One JavaScript snippet that reads computed values by `data-ux`. | — |

What the skills say of the scripts' behaviour, each checked against the script's own text: the `failed: <id>: <why>` line (`accept.mjs`); "900 px high" and "reduced motion set" (`--help`); `cannot be told:` and `cannot be measured:` (the in-page file); "Measure at the top of the page" (its header); `[{ id, pass, actual, message }]`, never throws, changes nothing (its header); a check with no result is "not run", listed after the failed and before the passed, and does not change the exit code; a result no check has, or two for one check, is a refusal (`--help`).

## What Handoff opens, and the line of Look's carry that hands it over

| What Handoff opens | The line of Look's carry list (as Look's Gate, and the gates before it, write it) |
|---|---|
| `06-look/LOOK.md` | the output of the stage before: not a carry line |
| The cast sheet's tables for Structure, Detail, Look, Handoff, Acceptance | `- cast@<v>#<slug>` for each stage still to run (Structure's gate), and `- cast@<v>#structure` (Detail's gate), carried on "as they are" |
| The intent: "The person in the moment", "The one job", "Success criteria", "States" | `- intent@<v>#<slug>`: Cast's gate carries every section of the intent but "What the readers found" and the two last |
| The context: "What the product can show and do", "Constraints" | `- context@<v>#<slug>` (Intent's gate) |
| The structure: "The structure", "What it is deliberately bad at", "What the readers found" | `- structure@<v>#<slug>` (Detail's gate) |
| The detail: "Rules", "Edge cases", "Data map", "Dependencies", "Strings", "What the readers found" | `- detail@<v>#<slug>` (Look's gate) |
| `04-structure/reads/` | `- source:` (Detail's gate) |
| `05-detail/states.md`, `strings.json`, `prototype/`, `shots/`, `reads/` | `- source:` (Detail's gate) |
| `06-look/screens/`, `shots/`, `reads/`, `measures.md`, `checks.json`, `results.json` | `- source:` (Look's gate) |
| `<tokens>` | `- source:<tokens>` (Look's gate) |
| The package's `DECISIONS.md` | `- source:` (Detail's gate) |
| The project sources of the context (today's source) | `- source:` (Context's gate, carried on by Intent and Cast) |
| **Not from the carry, and said so:** the project profile (`product`, `components`, `strings-format`, `languages`, "Standing rules"), the component source, the kit's templates and the guide | project facts and kit files, which the session reads at every stage |

## Every seat: what it is handed, and what it does not open

| Stage | Seat | Card `reads` | Handed | Card `never-reads` | "Do not open" |
|---|---|---|---|---|---|
| Handoff | `judge.cold-implementer` | brief, handoff-folder, earlier-ledger | `<package>/07-handoff/`, whole, and nothing else; on a re-read its earlier ledger, after reading cold | maker-notes, author-map, other-ledgers, package, component-source | `work/`; `04-structure/MAP.sealed.json` and `CHOSEN.md`; every reads folder and `07-handoff-gate/`; `03-cast.md`; every stage's folder from `00-frame.md` to `06-look/`; `DECISIONS.md`; `build/`; the component source and the rest of the project's source |
| Acceptance | `judge.usability` | intent, states-and-rules, strings, pictures, build (+ earlier-ledger) | intent; `SPEC.md`, `strings.json`; pictures of the build and the approved pictures; the results; the builder's three files | maker-notes, author-map, other-ledgers | the common list: `work/`; both sealed files, `CHOSEN.md`, `DECISIONS.md`; `03-cast.md`; every other read of `08-acceptance/reads/`, every earlier reads folder but its own seat's ledger once it has read cold, `07-handoff-gate/`; `COVERAGE.md`, `REPORT.md`, `FIXES.md`, the decision page; the board, the proposals, `earlier/`, `fresh/`, `beside/` |
| Acceptance | `judge.truth` | context, intent, product-facts, states-and-rules, strings, final-screens, pictures, build | context, intent; the facts document; `SPEC.md`, `strings.json`, `prototype/`; both sets of pictures; the results; the builder's files | as above | the common list |
| Acceptance | `judge.words` | intent, strings, states-and-rules, pictures, build | intent; `strings.json` with why-lines, `SPEC.md`; pictures of the build in every language; the results; the builder's files | as above | the common list |
| Acceptance | `judge.accessibility` | intent, states-and-rules, final-screens, pictures, build | intent; `SPEC.md`, `prototype/`; pictures of the build; the results with `by-hand.md`; the builder's files. It does not drive the build (its card). | as above | the common list |
| Acceptance | `judge.visual-craft` | intent, final-screens, pictures, tokens, design-system, build | intent; `prototype/` with the measured values, `tokens.css`; the design system's documents; both sets of pictures; the results; the builder's files | as above | the common list |
| Acceptance | `judge.system-fidelity` | intent, final-screens, tokens, design-system, component-source, build | intent; `prototype/`, `PARTS.md` for the changes to the system, `tokens.css`; the design system's documents; the component source; the files `BUILD.md` lists as built or changed; the results; the builder's files. No pictures: its card reads none. | as above | the common list |
| Acceptance | `judge.profile` | profile, intent, pictures, strings | its profession's profile, whole; intent; pictures of the build; `strings.json`. Not the results, not the builder's files: its card does not read the build. | + task-reads | the common list, and the build, its files, the results and what the builder wrote back |
| Acceptance | `audience.task-reader` | person, profile-traits, pictures | her card; her profession's traits (the copy with every `So the interface must:` field removed); the pictures of the build in her language at her width. Pictures only. | intent, package, handoff-folder, build, profile, states-and-rules, strings, prototype, … | the common list, and the intent, every other file of the package, `07-handoff/` whole, `build/` and the build itself, her profession's profile itself, the results and every other file of `08-acceptance/` |

The test holds each row both ways: what the card reads and Acceptance has is in "Handed", and nothing
the card does not read is.

## What I ported from version 1, and what I left behind

- **`master:phases/6-IMPLEMENT.md`** → the guide. Ported: the four rules, each with its reason and its
  symptoms; "Working the way the project already works"; the accessibility list, the strings rule and
  "reserve space for anything that loads", folded into three bullets. Changed: each rule now points at
  the file of the folder that answers it (`PARTS.md` for the interface and the tokens, `SPEC.md` for
  the states). Left behind: "No gate of its own · Requires G3", the typographic details, font
  loading, virtualised lists and debounce (the design decides what applies, and says it in `SPEC.md`),
  and every reference to a phase.
- **`master:phases/7-QA-LOOP.md`** → the guide's loop, and Acceptance's `driving.md`. Ported: the loop
  (start it, one state, the accessibility tree first, a picture, the console, the phone width, the
  other theme, fix one thing and look again); "drive the states, don't assume them"; the numeric diff
  with its snippet, now by `data-ux`; the keyboard, 200% and reduced-motion checks. Left behind: "you
  close this gate" (in this pipeline the builder does not accept its own work), the fixed 375/768/1440
  widths (the checks name the widths), `design/shots/`.
- **`master:reference/ANTI-PATTERNS.md`** → both lists, row for row (15 and 14). Reworded: gates
  G0–G4 and phases became this pipeline's stages and rules; `DESIGN-DECISIONS.md` became "the decisions
  log"; "mockup" became "prototype" or "picture". Nothing dropped. Added: the third table.

## What I tested

**RED.** With `waits` taken out and nothing written:
`not ok 36 - the handoff skill keeps every rule of a skill` (`skills/handoff/SKILL.md is not written`)
and `not ok 37 - the acceptance skill keeps every rule of a skill` (the same); 119 of 121 passed.

The content tests were written against the skills as I wrote them, and each failed at least once
before it passed: the tenth step of Handoff could not be read by the `stepOf` helper (it reads one
digit), the hand-over of the system fidelity judge (its card reads no pictures: the test had assumed
every reader does), the reading order of the guide (I had `SPEC.md` before `prototype/`; the folder's
own table has the picture first, and the guide now follows it), a file name in the folder
(`DECISIONS.md` against a pattern meant for the decision page).

**GREEN.** `node --test --test-concurrency=1 tests/skills.test.mjs tests/pool.test.mjs`: 234 tests, 234
pass, 0 todo. `npm test`, run once after the last edit and before the commit: 778 tests, 777 pass, 0 fail, 1
skipped (the folder-mode test this file system always skips), 0 todo, 219 s.

**The run-through** (`Handoff and Acceptance run as written…`), with the real `state.mjs`,
`accept.mjs` and `page.mjs`, each command taken from the skill's own text and filled:

1. A package stamped through Look, each carry list as its stage's skill gives it.
2. Handoff begun; built from nothing it is refused, built as the skill says it stands.
3. The folder assembled: the screens copied with exactly one line changed in each (the link to the
   token file), the pictures of those pages and not the variant's, the token file, the index, the
   guide byte for byte, the three build pages.
4. `accept.mjs prototype` run once, through the kit's script, on the folder's own prototype: 8 of 8
   pass, results beside the folder. The dark contrast comes back as a number, so the copy of the token
   file was the stylesheet that loaded.
5. The folder is the eleven entries the Writes table lists; no text file in it names a stage's
   folder, the gate's folder, `work/` or the package; nothing of `fresh/`, `beside/` or the sealed
   file is in it or named in it.
6. The cold implementer's brief names the folder and nothing else; its ledger lands in
   `07-handoff-gate/`; the folder still has eleven entries.
7. The decision page built beside the folder with the folder's own pictures; the question recorded;
   the stamp; `validate` ok; `next` is `acceptance`.
8. The build's state map names the account by its role; no credential pattern in it.
9. Acceptance begun, built from `handoff@1`; `accept.mjs inpage` prints the in-page file.
10. `report --checks` with one state driven and one failing: `8 checks: 1 failed, 2 not run, 5 passed`,
    the table's first rows FAIL then not run. With both states: `1 failed, 0 not run, 7 passed`, exit
    0. A file named twice: refused, "has two results".
11. The deviation put to him (`await`), the stage back in work, a fix out, nothing stamped; the fix
    back, the state's file written again, `0 failed, 0 not run, 8 passed`; the last question; the
    lessons appended; the stamp; `next` is `none`.
12. A correction: Frame, Detail, Handoff built from `[detail@1, frame@1]`, Acceptance from
    `[handoff@1]`, each stamped; no folder filled; `next` is `none`.

The browser is driven once in my tests, by `accept.mjs prototype`. No test of mine starts or stops
any other process.

## Self-review

- **Completeness.** Brief steps 2 to 5 and the fifteen rulings are in the table above.
- **Accuracy.** Every command is run by the run-through or held by the command rule; every template
  section I name is asserted to be a heading of that template; every hand-over is asserted against
  its card.
- **Standing alone.** The guide names twelve things, all in the folder or the three write-back
  pages; the one path of the folder that leaves it is `../build/`, which the template itself gives.
- **Secrets.** No step writes or prints a credential. Acceptance stops when it finds one in a file,
  says where and never what. An address is written without a query that signs in. Pictures on seeded
  data only. Neither skill names a keys file.
- **Quality.** Both skills are under 200 lines, six sections in order, second person, the room-booking
  clinic for every example. "Profile" is never used alone.
- **Testing.** Output pristine; no `todo` left in the suite.

## Concerns

1. **Look's carry list lacks three things `HANDOFF.md`'s template asks for (ruling 11).** The carry
   that reaches Handoff has no line for the context's "The problem, and why now" (the template's
   "why now"), "What exists today" (its "what they replace") or "What it must not become". Intent's
   gate carries only "The people", "What the product can show and do", "Constraints" and "The
   founder's own words". I changed no other skill and did not reach into the context. What the stage
   does today: "why now" is written only from a line that hands it over, otherwise the folder says
   "Why now: not carried into this folder" and the decision page lists it for him; where the surface
   lives and what it replaces are read in the project sources the carry does name (today's source).
   **The fix is one line in Intent's gate** (carry "The problem, and why now" and "What exists
   today"): my skill then needs no change. I finished the task rather than stop on it because nothing
   I wrote depends on which way you rule; say so if you would rather I had stopped.
2. **The reads of Context and Intent are not carried either** (Cast's gate leaves out the intent's
   "What the readers found", and the as-is read lives in the context's "What exists today").
   `COVERAGE.md` therefore covers the seats of the cast sheet's tables, Structure onwards, and says
   in one line that the earlier reads were not carried. Ruling 11's list reads that way too, so I
   took it as intended.
3. **Rulings 4 and 13 pull against each other, and I reconciled them narrowly.** "The handoff folder
   and `build/` and nothing else of the package's history", yet the seats are the cast sheet's, the
   task reader needs her card, her traits and her tasks, and a judge its earlier ledger. Acceptance
   therefore reads three things outside the folder: the "Acceptance" table of `03-cast.md`, the lines
   of its carry list that name a person's card and a profession's profile, and "Tasks for the
   audience" of the intent. The intent, the context and the earlier ledgers are handed to seats by
   path and never opened by the session; which stage a seat last read at comes from the folder's own
   `COVERAGE.md`.
4. **`07-handoff-gate/` is a folder I named.** The cold implementer's ledger, the prototype run's
   results and the decision page had to live somewhere a builder is not given, and a fresh re-read
   must not find the first ledger inside the folder it reads cold.
5. **The folder's `prototype/` is the final screens, not Detail's plain prototype.** The template's
   own row says "static pages on the project's real tokens". The plain prototype is read for where an
   action leads (written into `SPEC.md`) and is not copied: a builder would take its grey for the
   look. The visual designer writes no index, so Handoff writes one.
6. **Handoff changes one line of each approved page.** The final screens link the project's token
   file by its path; a folder that stands alone has to link its own copy. The skill says to change
   that one link by script, and the prototype run proves it.
7. **A correction is stamped at Handoff and at Acceptance in the words of its one nod.** "A
   correction costs one nod" and "the four stages of its route are stamped" left no other reading
   that asks him once. At Acceptance that holds only when the build matches the picture he nodded at;
   a deviation is put to him.
8. **"The package brought up to date"** is, in my reading, the handoff folder (the row of `SPEC.md`,
   the string, the row of `PARTS.md`, the check) and `DECISIONS.md`. A page of `prototype/` is not
   redrawn by Acceptance, and a stamped output (`HANDOFF.md`, an earlier stage's) is changed only by
   reopening it, as the conductor gives it.
9. **Ruling 1's pool `todo` was already live.** Nothing in `tests/pool.test.mjs` was a `todo`; the
   test's comment said the pool names no skill or reference file yet, which is still true. I added
   existence assertions so that it checks something of `reference/`.
10. **The `stepOf` helper reads a one-digit step number.** Handoff has ten steps; my test cuts the
    tenth out by its words. I did not change the helper, since four earlier tasks' tests use it.
11. **A hook of this machine refused one shell command of mine**, because the test text in it held a
    pattern that named an environment dotfile. Nothing was read or printed. I took the pattern out of
    the test rather than run the command another way; the test still looks for credential-shaped text.
12. **`README.md` still describes version 1's `reference/`** (a fidelity ladder and a worked example
    that this branch does not have). Not mine to edit in this task.

---

# Fix report — round 1

Status: **DONE**. Worked from `task-18-fix-1.md` alone. Two commits, as it names them:

- `b5a80ad` — `feat: a command that proves a folder stands alone`
- `e6aeab1` — `fix: the handoff folder names nothing outside itself, and Handoff and Acceptance's smaller findings`

`npm test`, once, after the last edit: 798 tests, 797 pass, 0 fail, 1 skipped (the folder-mode test this file system always skips), 0 todo, 215 s.

## The new script (R148)

`scripts/alone.mjs` (252 lines), built on `scripts/lib/cli.mjs`, and `tests/alone.test.mjs` (20 tests),
written first: the test file failed on the missing module before the script existed.

`node scripts/alone.mjs <folder>` reads every `.html` and `.css` file under the folder and judges every
`href` (an svg's `xlink:href` too), `src`, `srcset`, `url()` and `@import`. It prints
`<file>: <reference>: <why>` on standard error for each that does not lead to a file inside the
folder, then a count, and exits 1; exits 0 with one line when there is none; 2 on bad usage.

| It says | When |
|---|---|
| `it leaves the folder: ".." climbs above it` | the path, normalised from the file's own folder, goes above the root, however it comes back |
| `it leaves the folder: an absolute path` | `/x`, `\x`, or a drive (`C:\x`) |
| `it leaves the folder: a file: address` | `file:` |
| `it leaves the folder: a link that leads out of it` | the file is a link whose real path is outside the folder |
| `it is remote` | `http:`, `https:`, `//` |
| `the file is not there` (`: it is a folder`) | nothing at the path, or a folder |
| `a base address moves every link of the page: take it out` | any `<base href>` |
| `an address of a kind this check does not know (x:)` | any other scheme: printed, never guessed at |

Passed over, and not counted: an empty address, a fragment, `data:`, `mailto:`. What follows `?` or `#`
is not part of a path; `%20` and a raw space both work; a backslash is a slash. A comment is not read.
A folder with no `.html` and no `.css` file is a refusal, so that a wrong folder never passes.

Beyond the ruling's list, and why: `xlink:href` (it loads a file as an `href` does); `<base href>`
(one tag would make every relative link mean something else); the link check (a copied folder would
carry a link that leads out); the refusal of an empty folder. A page is read as text: an address a
script builds while the page runs is not seen, and the usage says so.

**Hand mutations.** Fifty-five changes to the script, one at a time, each run against its tests: 53
were caught at once. Two survived and each got a test: the order of files (a file `c.css` now comes
before the folder `c/`, which the directory's own order would not give) and the check of `kind` (the
message is now asserted). Three more were added before the run for lines nothing reached: `..` alone,
a `>` inside a quoted attribute, a candidate of a `srcset` that ends at its comma.

**The reviewer's case, as a test:** a page copied to `design/today/07-handoff/prototype/` that keeps
`../../../kit/tokens.css`, with the project's file really there, is printed as leaving the folder.

## The findings

| # | What was wrong | What it is now | Held by |
|---|---|---|---|
| I1 | The folder was told to write the printed count line and the command into `ACCEPTANCE.md` and `COVERAGE.md` | Only the day and the counts ("8 checks: 0 failed, 8 passed"); no command, no path; the reason for `--allow-errors` is a sentence (which page, which error, why harmless). Handoff's Never names the gate's folder and "a command that names them". | The checks test and the folder test; the run-through fills both files by the rule and asserts, three times as the folder changes, that no text file in it names a stage's folder, the gate's folder, `work/`, the package, a kit script or `results.json` |
| I2 | "The prototype run proves it" was false | Handoff step 3 ends with `node <kit root>/scripts/alone.mjs <package>/07-handoff`, before the checks; `folder.md` has a section for it. What the token file loads is copied in beside it, or taken out of the copy and listed under "Left to the builder" as a file the builder must supply. "Never leave one unsaid." The false sentence is gone, and the page now says why no check on the pages would notice. | The folder test; the run-through copies the pages as they came, with a token file that loads a font, and gets exit 1 with four lines (three pages, one font) while the old link still resolves on disk; then one line of each page is changed, the font copied in, and the folder stands alone |
| I3 | The cold implementer's row went into `COVERAGE.md` before its re-read | Its row and items go in only after its last read: said in step 9, in `folder.md` and in `seats.md` | The cold implementer test; the run-through asserts `COVERAGE.md` does not name the seat while it reads |
| I4 / R149 | A correction was told to "write the one check" that could not be run | No script checks a correction: no `acceptance.json`; its record is the picture and Detail's paragraph. Acceptance compares the build with the "becomes" side by eye, takes the picture as built, writes one item. Both forms say the conducting session, which applied it, also accepts it, and Acceptance's steps line says so too (M1). | Both forms tests; a test that `validateAcceptance` refuses a check with no page |
| I5 / R150 | Acceptance opened what no carry list handed it | One sentence at the end of step 2 of `skills/design/references/loop.md`. The skill's reading is unchanged. | The Acceptance reads test pins the sentence |
| R151 | "Why now" and the earlier reads did not reach the handoff | Intent's gate also carries "The problem, and why now", "What exists today", "What it must not become" (appended after the four it had, so the pin on "its "The people"," holds). Cast's gate carries every section of the intent but the two last, "What the readers found" among them, and says the as-is read travels in "The problem, and why now". `folder.md`'s table has the two rows (15 in all); `HANDOFF.md`'s Context, Task and Out of scope are filled from them; `COVERAGE.md` has a row for each seat of Context and of Intent. "Not carried" is gone. | The Intent and Cast pins, updated in place (seven sections; eleven intent lines); the opening stages' run-through stamps on them; my run-through builds Look's carry from the rules and asserts the four new lines reach it |
| M2 | After an accepted deviation the folder contradicted itself | New `acceptance/references/deviations.md`: logged in the package's `DECISIONS.md` and in the folder's own; each file of the folder brought to the build; the check rewritten to hold the build as accepted, never deleted; the item in `ACCEPTANCE.md` says the build differs from the page it names. Where "Must not change" names the thing, `HANDOFF.md` is reopened, changed and stamped again, and `REPORT.md`'s `built-from` takes the new version. | The gate test; the run-through walks it with the real state script: `reopened handoff at version 2`, stamped at version 2, the report built from `handoff@1` refused, built from `handoff@2` stamped |
| M3 | "or with a state not driven" | "not driven and unexplained" | pinned |
| M4 | Nothing supplied the project's gate commands | Read now in "Standing rules" of the project profile and the project's own documents; one not found is asked of the founder, never guessed | pinned |
| M5 | No check type measures a gap | Such a row is listed in `ACCEPTANCE.md` with its value and "measured by a person" | pinned |
| M6 | A seat's earlier ledger may be in `04-structure/reads/` | Said | pinned; every card at Acceptance sits at one of the three stages |
| M7 | A kit person has no carry line | Her card is in the kit's `pool/persons/`, by the id her line gives | pinned |
| M8 | "Three ways" against five rows | Three, in the skill and in the table of `seats.md`; what comes up on every folder is listed apart, each closed the first way | counted in both |
| M9 | Reads of a fresh pass in the coverage page | Entered under their seat; a version named by what it was, never by letter, maker, engine or model | pinned |
| M10 | Files `BUILD.md` lists | Read or handed except a settings file and anything that holds a sign-in | pinned in Reads and in the system fidelity judge's brief |
| M11 | Appending to `DECISIONS.md` | Acceptance reads its last entry alone, for the number | pinned |
| M12 | No row for `tokens.css` | The Writes row and `folder.md` say the row is added to the table of `HANDOFF.md` | pinned; the run-through adds it |
| M13 | `../build/` raised on every run | `seats.md`: the one way out, meant; closed by seeing that `HANDOFF.md` says so; never taken out | pinned |

## What I edited outside my own files, and only that

- `skills/intent/SKILL.md`, the carry rule (169 → 170 lines).
- `skills/cast/SKILL.md`, the carry rule (188 → 189 lines).
- `skills/design/references/loop.md`, one sentence closing step 2.
- Their pins in `tests/skills.test.mjs`, changed in place and kept exact: the list of sections Intent
  carries (4 → 7), Cast's carry sentence, and the two counts of the opening stages' run-through
  (context lines 4 → 7, intent lines 10 → 11).

## Line counts now

`skills/handoff/SKILL.md` 199 · `skills/acceptance/SKILL.md` 193 · `skills/handoff/references/folder.md`
grew by the standing-alone section · `skills/acceptance/references/deviations.md` is new (81 lines).

## Concerns

1. **The proof reads text.** `alone.mjs` sees what is written in `.html` and `.css` files. A page that
   builds an address in a script is not seen; the usage says so. The handoff's pages load one script
   at most, the prototype builder's few lines, and the final screens none.
2. **An accepted deviation that touches "Must not change" reopens Handoff.** It is what the state
   script requires of a stamped output, and the walk proves it works, but it costs a second stamp of
   Handoff in the middle of Acceptance. `deviations.md` treats his accepting the deviation as the yes
   a reopening needs.
3. **The seats of Context and Intent have rows with gaps.** Their ledgers are not carried, only what
   the two sections record, so a row may read "not recorded" for the model or the checks.

---

# Fix report — after the re-review

Status: **DONE**. Two commits, as named:

- `b7445c4` — `fix: alone passes what stays inside a folder and never prints a query`
- `b03011a` — `fix: a failing reference goes to the founder, and five wordings`

`npm test`, once, after the last edit: 801 tests, 800 pass, 0 fail, 1 skipped (the folder-mode test this file system always skips), 0 todo, 205 s.

## The script

Each case was written as a test first: nine of the twenty-three tests failed before the script changed.

| Point | What it does now | Its test |
|---|---|---|
| N1 · `tel:`, `sms:` | Passed over, as `mailto:` is, whatever their case | "a fragment, a query alone, an empty address…" |
| N1 · a link to a folder | An `href` may lead to a folder inside the folder (`./`, `shots/`, `../fonts`, the folder itself). One that climbs out still leaves, one that is not there is still missing, and a `src` or a `url()` to a folder is still "a folder", since nothing loads one. | "a reference to a file that is not there is printed; a link to a folder of the folder is fine…" |
| N1 · a query alone | `?lang=es` is the page itself: passed over | the same test as `tel:` |
| N1 · a `style` attribute with character references | The attribute's value is decoded, then read as a stylesheet | "what does not leave the folder is not refused…" |
| N1 · `src=` as text in another value | Attributes are read one after another, each with its whole value, so what a value holds is never an attribute of its own | the same |
| N1 · a comment in a `<style>` | A style element is read as a stylesheet, its comments passed over | the same |
| beside N1 | What a script element holds is its text: a tag written in a string is no tag. Its own `src` is still read. And a `url()` in the words of a page, outside any style, is no longer read. | the same; `references()` |
| N2 | `poster`, the `data` of an `object` (not of another tag), `imagesrcset`, and the strings of an `image-set()`, with or without a prefix, but not the string of its `type()` | "a poster, the data of an object…" |
| N3 | A reference is printed by its path: never its query, its fragment, or a sign-in written before its host. What was taken off is said: "(with a query)", "(a sign-in taken out)". `alone()` hands back the same, so no caller can print it either. Two addresses of one file that print alike are one line. | "a query, a fragment and a sign-in written into an address are never printed…": a made-up value in eight addresses is in neither stream, nor in what the module returns |

The usage lists everything that is read, in a tag and in a stylesheet, and says what is never printed.

I went one step past N3: a sign-in written into an address (`//name:word@host`) is taken out too, and
said so. It is the same door as a query.

**Hand mutations.** Forty-four changes to the new and the changed lines, each run against the tests:
41 caught at once. Three survived and each got a test: a `?` inside a fragment is no query; a
`<base href>` is refused even when it names only a fragment; an attribute with no value does not end
the reading of its tag. One fault the tests found in my own first version: the closing quote of a
`type("…")` string was read as the opening of the next, so each string of an `image-set()` is now
taken whole.

## The skills

| Point | Change | Pin |
|---|---|---|
| 4 | `handoff/references/folder.md`: a copied page takes two changes and only two (its link to the token file, the address of an asset copied in). What a page loads that cannot be copied in is a fault in what was approved: it goes to the founder, open, as a question, and the page is not edited to pass. What the token file loads that cannot be copied is still taken out of the folder's copy and listed, and the source's address is written without its query. "Never leave one unsaid" has the three ways. | the folder test |
| 4, 5 | `handoff/SKILL.md`: step 3 says the same in three lines; Never: "…or a page, but its link to the token file and the address of an asset copied in"; "no address on the web but a source the builder must fetch, named without its query". Still 200 lines. | the folder test, the cold implementer test |
| 6 | `design/references/loop.md`: two sentences. The first adds the last entry of the package's `DECISIONS.md`; the second says it may reopen and stamp Handoff for a deviation he accepts, and that a correction is the one case where the conducting session accepts its own change. | pinned whole, and counted: two sentences |
| 7 | `intent/SKILL.md` and `cast/SKILL.md`: the carry lines are `@<version>`, the version read from `status`. | Cast's pin updated in place; a new assertion that neither carry rule holds `@` and a digit, and that both skills give the `status` command |
| 8 | `structure/references/seats.md`: one sentence. | pinned |

One thing I left as it was: Cast's step 3 gives an example line, `- context@1#the-people`, with a
literal version. It is outside the carry rule the point names, and it is pinned by an earlier task's
test; say so if you want it changed too.
