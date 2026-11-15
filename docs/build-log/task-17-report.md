# Task 17 — Detail and Look: report

Status: **DONE_WITH_CONCERNS**. Commit `0495666` (`feat: the Detail and Look stages`) on base `9a006b2`,
branch `v2-pipeline`; not pushed, not amended; staged by explicit path, seven files. Nothing under `skills/design/`,
any other skill, `templates/`, `pool/` or `scripts/` was edited. `scripts/describe.mjs` was run with
`--help` only. No subagent was dispatched.

## What I wrote

| File | Lines | What it is |
|---|---|---|
| `skills/detail/SKILL.md` | 199 | The Detail stage: six sections, nine steps, the short form, the gate on the prototype. |
| `skills/detail/references/seats.md` | 209 | **A further reference** (the long form would not fit): what each of the nine seats at Detail is handed and does not open; who fixes what in the one fix round; what a re-read opens. |
| `skills/look/SKILL.md` | 200 | The Look stage: six sections, nine steps, the two modes, the short form, the gate on the finished screens beside their measures. |
| `skills/look/references/direction.md` | 119 | Direction mode, as the brief asks. |
| `skills/look/references/fresh.md` | 137 | **A further reference:** the fresh pass at Look in seven numbered parts (the one screen, the brief, the stop, the makers, the readers of the two, the page, the three outcomes). |
| `skills/look/references/seats.md` | 176 | **A further reference:** what each of the eight seats at Look is handed and does not open. |
| `tests/skills.test.mjs` | +968 −2 (4072) | `detail` and `look` taken out of `waits` (the generic rule test is live for both); 13 new tests. `handoff` and `acceptance` are still `todo`. |

Names of files a stage writes that no template or ruling names, and are mine: at Detail `words.json`,
`words.html`; at Look `variants/`, `checks.json`, `results.json`, `directions/`, `directions.json`,
`directions.html`, `BRIEF-fresh.md` (in `06-look/`), `beside.json`, `beside.html`, and, for a surface that
leaves a system, `06-look/tokens.css` and `06-look/earlier/`.

## The twelve rulings

| # | Ruling | Where it is carried out | Test that holds it |
|---|---|---|---|
| 1 | Tests un-`todo`; header, kit-root sentence, six sections, ≤ 200 lines, paths that exist; the conductor's words | Both `SKILL.md` headers and openings; `<package>`, `<packages>`, `<kit dir>` as Structure has them; "the project profile", "her profession's profile" throughout | `the detail skill keeps every rule of a skill`, `the look skill keeps every rule of a skill`; `detail and look: the six sections and no other…` (also: no sentence of the conductor copied, the word "profile" never alone, no version written as a number) |
| 2 | Every command as its script takes it | See the commands table below | `detail: every command is one its script takes…`, `look: every command is one its script takes…`, and the run-through, which runs them |
| 3 | Detail hands each seat what its card reads; the interaction designer writes states, rules, data map, dependencies; the writer briefed with the founder's lines; why-lines to the words judge (R126); a truth finding becomes a dependency and a question; one fix round by the maker whose artefact it is, re-read by a fresh judge with the earlier ledger, cold first, three marks (R127); no second round | `skills/detail/SKILL.md` steps 3, 4, 6, 7, 8 and "Never"; `references/seats.md` (every seat; "The fix round"; "On a re-read") | `detail: three makers one after another…`; `detail: each seat is handed what its card reads and no more…`; `detail: blocking findings are fixed in one round…` |
| 4 | Look inside a system: one visual designer; static pages linking the token file in the project kit folder; variants on one named axis; `measures.md` from what `accept.mjs` and `shots.mjs` return | `skills/look/SKILL.md` opening (`<tokens>` = `<kit dir>/tokens.css`), steps 2, 4, 5, 9 | `look: two modes; inside a system one visual designer…`; the run-through runs the `accept` command once and builds the table's rows from `results.json` |
| 5 | The fresh pass at Look (R121): one screen, its approved structure, states and strings; only the paint; kept in `06-look/fresh/` as they came; beside the system version on one page; three outcomes; a borrowed thing rebuilt on the tokens and flagged in `LOOK.md` as a named extension; nothing handed off; `describe.mjs … --text`; his yes before anything is sent; never `--endpoint`, never a key or a keys file | `skills/look/SKILL.md` steps 3 and 6, the carry-list bullet of "Gate", five lines of "Never"; `references/fresh.md` whole; `references/seats.md` (`maker.screen-generator`, `maker.outside-describer`) | `look: a fresh pass draws the one screen with its approved words…`; `look: each seat is handed what its card reads…`; the run-through (the line of a `fresh/` folder stops at Look; `fresh/` untouched) |
| 6 | Direction mode; the pick becomes the tokens; the project profile updated by a change he sees and approves, under `## Design system`, never silently | `skills/look/SKILL.md` step 2 and "Never change the project profile silently"; `references/direction.md` whole | `direction.md: two or three directions of different kinds…` |
| 7 | A shared machine: `shots` and `accept` one after another; three browser-driving commands or seats at most; a seat stops only its own browser; no process stopped by name or pattern | Look step 5 ("one command after the other, never both at once"); Detail step 6, Look step 7 ("three at a time at most"); the last-but-one "Never" of both skills; the intro of both `seats.md` ("keeps the template's last line: a seat that starts a browser stops only the one it started"); "It drives a browser, and counts among the three" on each seat that does | `detail: every command…` (the Never line, both `seats.md`, the three brief templates); `look: two modes…` (step 5); `look: every command…` |
| 8 | Model and effort: what the cast sheet's line names; a dash means the session's model; none enforced | Detail step 3 and step 6; Look step 4 and step 7; `direction.md` ("each a fresh sub-agent on what its line of the cast sheet names") | `detail: three makers…`; `look: two modes…` |
| 9 | The gates: Detail on the prototype (he clicks it), the words a separate question for `first-run`, `message`, `public-page`; Look on the finished screens beside their measures; each one page built with `page.mjs`, one question | "Gate" of both skills; Detail's `words.json` → `words.html`; Look's `decision.html` with `measures.md` beside it | `detail: every command…` (the three kinds are read out of the gate and held to `KINDS` and to `presets.md`); `look: every command…`; the run-through builds each page and records each question |
| 10 | Read only § 4.5, § 4.6, § 12, the Detail and Look rows of § 24; the cards; the templates | Done so. The plan file was never opened. `master:phases/3-DIRECTION.md` was read with `git show`, for the rule the brief ports | — |
| 11 | Plain, short, second person; generic; the room-booking product | All six files. Examples: a waiting list when no room is free; how dense the list of rooms is; `today-default-en`; "Quiet ledger, with the type of Front desk" | `detail and look: the six sections…` (`\brooms?\b`); `no product name appears in any file under skills/` |
| 12 | Gallery marks reach Look through `DECISIONS.md`, never `04-structure/earlier/` | Detail's carry list names the package's `DECISIONS.md` ("what he marked in a fresh gallery at Structure reaches Look through that file"); Look "Reads" and "Never read his gallery marks in `<package>/04-structure/earlier/`"; the visual designer's brief copies his marks from `DECISIONS.md` | `look: it reads the detail and what its carry list names, his gallery marks from DECISIONS.md and never from earlier/…` (with Structure's `rounds.md` and gate held to the same); no seat's hand-over at Look names `earlier/` |

## Every command the two skills give

Each was checked against the script's own `--help` by the test (`takenBy`), and by hand.

| Command, as written | Where | Usage it was checked against |
|---|---|---|
| `node <kit root>/scripts/state.mjs status <package>` | Detail "Reads"; Look "Reads"; `direction.md` "When" | `status <package>` |
| `node <kit root>/scripts/state.mjs begin <package> detail` / `… look` | step 1 of each | `begin <package> <stage> [--date <day>]` |
| `node <kit root>/scripts/shots.mjs <package>/05-detail/prototype --out <package>/05-detail/shots --widths <primary>,<phone>` | Detail step 5 | `<file or folder>... --out <folder> --widths <w,w...> [--themes light,dark] …` |
| `node <kit root>/scripts/page.mjs <package>/05-detail/decision.json --out <package>/05-detail/decision.html` | Detail step 9 | `<decision.json> --out <decision.html>` |
| `node <kit root>/scripts/page.mjs <package>/05-detail/words.json --out <package>/05-detail/words.html` | Detail "Gate" | the same |
| `node <kit root>/scripts/state.mjs await <package> detail --question "<the one question>"` / `… look …` | "Gate" of each | `await <package> <stage> --question "<the one question>" [--date <day>]` |
| `node <kit root>/scripts/state.mjs slug "<heading text>"` | "Gate" of each | `slug "<heading text>"` |
| `node <kit root>/scripts/state.mjs stamp <package> detail --words "<the founder's words>"` / `… look …` | "Gate" of each | `stamp <package> <stage> --words "<the founder's words>" [--date <day>]` |
| `node <kit root>/scripts/shots.mjs <package>/06-look/screens --out <package>/06-look/shots --widths <primary>,<phone> --themes <themes>` | Look step 5 | shots, with `[--themes light,dark]` |
| `node <kit root>/scripts/accept.mjs prototype <package>/06-look/checks.json --root <package>/06-look/screens --out <package>/06-look/results.json` | Look step 5 | `prototype <acceptance.json> --root <folder> --out <results.json> […]` |
| `node <kit root>/scripts/page.mjs <package>/06-look/decision.json --out <package>/06-look/decision.html` | Look step 9 | page |
| `node <kit root>/scripts/describe.mjs --text --provider <openai\|gemini> --model <id> --brief <package>/06-look/BRIEF-fresh.md --out <package>/06-look/fresh/<name>.html --profile <packages>/PROFILE.md` | `fresh.md` § 4 | the `--text` form: `--text --provider <openai\|gemini> --model <id> --brief <file> --out <file.txt> --profile <PROFILE.md> [--endpoint <url>] [--timeout <ms>]`. Six flags, no `--endpoint`. **Never run**, in a test or by hand. |
| `node <kit root>/scripts/shots.mjs <package>/06-look/fresh/<name>.html --out <package>/06-look/fresh --widths <primary> --allow-errors` | `fresh.md` § 4 | shots, with `[--allow-errors]` (the screen generator's card uses the same two flags) |
| `node <kit root>/scripts/page.mjs <package>/06-look/beside.json --out <package>/06-look/beside.html` | `fresh.md` § 6 | page |
| `node <kit root>/scripts/shots.mjs <package>/06-look/directions --out <package>/06-look/directions --widths <primary>,<phone>` | `direction.md` | shots |
| `node <kit root>/scripts/page.mjs <package>/06-look/directions.json --out <package>/06-look/directions.html` | `direction.md` | page |

By hand, in the scratchpad (not in the repository): the three `shots` forms were each run once on the
fixture pages (6, 12 and 1 pictures; names as the skills give them, `today-default-en-390-light.png`,
`outside-openai-1280-light.png`); `accept prototype` once (8 checks, 0 failed); `page` on the approval
sample; `await` twice on one stage (the second question replaces the first).

## Every seat, against its card

"Common list" is what every maker's brief, or every reader's, lists under "Do not open" in that stage's
`seats.md`. `<chosen>` is the chosen proposal's file. "States and rules" is `05-detail/states.md` with
`05-detail/DETAIL.md`. "Final screens" is `06-look/screens/` with `06-look/measures.md`.

### Detail

| Seat | Card `reads` (but `brief`) | Handed | Card `never-reads` | "Do not open" |
|---|---|---|---|---|
| `maker.interaction-designer` | chosen-structure, intent, context | `<chosen>` with its pictures; `02-intent.md`; `01-context.md`. Brief: this product's worst cases | other-proposals | Makers' common list: everything in `04-structure/` but `<chosen>` and its pictures (the board, proposals, `earlier/`); `CHOSEN.md`; `03-cast.md`; `work/` but its brief; `05-detail/reads/` but a ledger the fix round hands it |
| `maker.interface-writer` | chosen-structure, states-and-rules, intent, context | `<chosen>`; states and rules; `02-intent.md`; `01-context.md`. Brief: the founder's own lines word for word, the languages, the writing skill | other-proposals | The same list |
| `maker.prototype-builder` | chosen-structure, states-and-rules, strings, kit | `<chosen>`; states and rules; `strings.json`; `<kit dir>` and `kit/KIT-CONTRACT.md`. Brief: the kit folder, the two widths | other-proposals, component-source | The same list, and the project's component source (`components`) |
| `judge.usability` | intent, chosen-structure, states-and-rules, strings, prototype, pictures (current-screens, options, build: other stages; earlier-ledger: a re-read) | `02-intent.md`; `<chosen>`; states and rules; `strings.json`; `prototype/`; `shots/` | maker-notes, author-map, other-ledgers | Readers' common list: `work/`; `MAP.sealed.json` and `CHOSEN.md`; `03-cast.md`; every file of `05-detail/reads/` but its own, and `04-structure/reads/`; `decision.*` and `words.*`; the rest of `04-structure/` |
| `judge.truth` | context, intent, product-facts, chosen-structure, states-and-rules, strings, prototype, pictures | `01-context.md`; `02-intent.md`; the facts document; `<chosen>`; states and rules; `strings.json`; `prototype/`; `shots/` | the same three | The same list |
| `judge.words` | intent, strings, states-and-rules, prototype, pictures | `02-intent.md`; `strings.json` with its why-lines; states and rules; `prototype/`; `shots/`. Brief: the founder's own lines | the same three | The same list |
| `judge.accessibility` | intent, states-and-rules, prototype, pictures (final-screens: Look) | `02-intent.md`; states and rules; `prototype/` as source; `shots/` | the same three | The same list |
| `judge.profile` | profile, intent, pictures, strings | her profession's profile, whole; `02-intent.md`; `shots/`; `strings.json` | the same three, and task-reads | The same list (the audiences' reads are in it), and the pages themselves |
| `audience.task-reader` | person, profile-traits, pictures | her card; the traits copy beside her brief; the pictures of every page in her language at her width | intent, package, profile, describers-brief, maker-notes, states-and-rules, strings, prototype, author-map, other-ledgers, task-reads (handoff-folder, build: later) | The same list, and `02-intent.md` with every other file of the package; her profession's profile itself; `prototype/`; `states.md`, `DETAIL.md`, `strings.json` |

### Look

| Seat | Card `reads` (but `brief`) | Handed | Card `never-reads` | "Do not open" |
|---|---|---|---|---|
| `maker.visual-designer` | chosen-structure, states-and-rules, strings, prototype, tokens, design-system, fresh-marks | `<chosen>`; states and rules; `strings.json`; `05-detail/prototype/`; `<tokens>`; the documents "Design system" of the project profile names; the picture of each mark. Brief: its lens, whether motion is cast, his marks word for word from `DECISIONS.md` | (none) | Kept from it all the same: `work/` but its brief; `06-look/reads/` but the ledgers a fix round hands it; `04-structure/earlier/`; and, until he has said what he borrows, `06-look/fresh/` and `06-look/BRIEF-fresh.md` |
| `maker.screen-generator` | (brief only) | `06-look/BRIEF-fresh.md`, alone | design-system, kit, current-screens, sibling-surfaces, other-proposals, session-idea | The design system and `<tokens>`; `<kit dir>` and the kit's own; today's screens and the sibling surfaces; `06-look/screens/`, `variants/`, `shots/`; `05-detail/prototype/` and `05-detail/shots/`; another fresh maker's files; `work/`; everything else in the package; no idea of the session's |
| `maker.outside-describer` | (brief only) | `06-look/BRIEF-fresh.md`, whole and unchanged: the one file the script sends | other-proposals, session-idea, current-screens, design-system, kit, sibling-surfaces | Nothing else is sent; all of it is kept out of the brief |
| `judge.visual-craft` | intent, final-screens, pictures, tokens, design-system (current-screens: Context) | `02-intent.md`; final screens; `06-look/shots/`; `<tokens>`; the design system's documents. Brief: its lens | maker-notes, author-map, other-ledgers | Readers' common list: `work/`; `MAP.sealed.json`, `CHOSEN.md`; `03-cast.md`; every file of `06-look/reads/` but its own, with `05-detail/reads/` and `04-structure/reads/`; `LOOK.md`, `decision.*`, `beside.*`; `BRIEF-fresh.md` and the prompt beside a fresh screen; `04-structure/earlier/`, the board, the proposals |
| `judge.system-fidelity` | intent, final-screens, tokens, design-system, component-source, sibling-surfaces, fresh-marks | `02-intent.md`; final screens; `<tokens>`; the design system's documents; the component source (`components`); the sibling surfaces by the carry list's paths; after a fresh pass, his marks with the fresh screen each is on | the same three | The same list |
| `judge.accessibility` | intent, states-and-rules, final-screens, pictures (prototype: its read at Detail) | `02-intent.md`; states and rules; final screens as source; `06-look/shots/` | the same three | The same list |
| `judge.truth` | context, intent, product-facts, chosen-structure, states-and-rules, strings, prototype, final-screens, pictures | `01-context.md`; `02-intent.md`; the facts document; `<chosen>`; states and rules; `strings.json`; `05-detail/prototype/`; final screens; `06-look/shots/` | the same three | The same list |
| `judge.profile` | profile, intent, pictures, strings | her profession's profile, whole; `02-intent.md`; `06-look/shots/`; `strings.json` | the same three, and task-reads | The same list (an audience's read is in it), and the pages themselves |

## The walk, from the end of Structure to the end of Look

Run in the scratchpad with the real `state.mjs`, the real templates and the slugs `state.mjs slug` prints;
the same walk, shorter, is the run-through test.

- **End of Structure.** `CHOSEN.md`, `built-from: [cast@1, intent@1, context@1]`, stamped. Its carry
  list: the cast sheet's own lines (`- intent@1#…`, `- context@1#the-people`,
  `#what-the-product-can-show-and-do`, `#constraints`, `#the-founder-s-own-words`, her card, her
  profession's profile), `- cast@1#detail`, `#look`, `#handoff`, `#acceptance`, `#blind-rules`,
  `#fresh-pass`, and `source:` lines for the chosen file, its pictures, `PICK.md` and the picture of one
  gallery mark. `next` → `detail`.
- **Detail reads** that output and those lines: the "Detail" table (who sits, on which model), the
  inventory, "Constraints" (the two widths), "The founder's own words" (the writer's bar), the chosen
  file. Everything Detail's steps name is on the list.
- **Detail stamps.** `built-from: [structure@1, cast@1, intent@1, context@1]`. Carry: every line above
  as it is, plus `- structure@1#the-structure`, `- structure@1#what-it-is-deliberately-bad-at`,
  `- source:design/today/05-detail/states.md`, `…/strings.json`, `…/prototype`, `…/shots`, `…/reads`,
  `- source:design/today/DECISIONS.md`. **Accepted:** `stamped detail approved at version 1`.
  - Built from the structure alone: **refused**, one line for each of the 15 `intent@`, `context@` and
    `cast@` lines ("names cast, which detail is not built from; add it to built-from").
  - Built without the structure: **refused** ("it must be built from structure, the stage before it on
    the route"), and both `structure@` lines.
- **Look reads** `DETAIL.md` and those lines: the "Look" table and "Fresh pass" of the cast sheet,
  "Constraints", the states, the strings, the prototype, the chosen file, and `DECISIONS.md` for his
  gallery marks. `next` → `look`.
- **Look stamps.** `built-from: [detail@1, structure@1, cast@1, intent@1, context@1]`. Carry: the
  detail's lines but `- source:design/today/04-structure/fresh/today-1.png`, which stops here; plus
  `- detail@1#rules`, `#edge-cases`, `#data-map`, `#dependencies`, `#strings`;
  `- source:design/today/06-look/screens`, `…/shots`, `…/reads`, `…/measures.md`, `…/checks.json`,
  `…/results.json`; `- source:design/kit/tokens.css`. **Accepted:** `stamped look approved at version 1`.
  `validate` → `ok`; `next` → `handoff`.
  - Built from the detail alone: **refused**, 17 lines (`intent@`, `context@`, `cast@`, `structure@`).
  - With a slug the detail lacks (`- detail@1#named-extensions`): **refused** ("05-detail/DETAIL.md has
    no heading whose slug is…"). The five headings the skill names exist.
- **Where it stops.** Detail: each entry a maker could not decide (a dependency, a state the intent does
  not name, a fact a string waits for, a state the structure cannot hold), one question at a time; the
  words, on their own page, for three kinds; the prototype's page. Look: the fresh brief, before anything
  is sent; the page that shows the two side by side; in Direction mode, the directions' page and the
  change to the project profile; the gate.
- **Does the session ever write a string, draw a screen, mend a finding or choose a variant?** No step
  has it do so. What it writes itself: briefs (the founder's lines and his marks copied word for word;
  the fresh brief's items and strings copied from the approved files), the decision pages' data, the
  headings of the two outputs that record what seats said (the writer's two lists copied as they came;
  the measured values copied row for row from `measures.md`), his words, the carry lists. In Direction
  mode it rebuilds the project kit on the new tokens, by setup's own reference, and writes the lines of
  the project profile only after he has approved them.

## Tests

- **RED** (tests appended, skills not written): `node --test tests/skills.test.mjs` → 120 tests, 103
  pass, 15 fail, 2 todo. The 15: the two generic rule tests (`skills/detail/SKILL.md is not written`,
  the same for `look`) and the 13 new ones.
- **GREEN**: `node --test tests/skills.test.mjs` → 120 tests, 118 pass, 0 fail, 2 todo (`handoff`,
  `acceptance`).
- **Whole suite**, once, after the last edit: `npm test` → 751 tests, 748 pass, 0 fail, 1 skipped (the
  NTFS one), 2 todo; 205 s.
- **Mutants**, by hand, 12 of 12 killed: "never by eye" removed; `--endpoint` added to the outside
  command; `--text` dropped from it; the interaction designer handed the strings; `DECISIONS.md` taken
  out of Detail's carry list; the makers' order broken; the `fresh/` line kept in Look's carry list;
  "never silently" weakened; a second fix round allowed; a fresh maker handed `<tokens>`; `--widths`
  dropped from Look's `shots`; the words asked last.
- The run-through runs one browser-driving command, `accept.mjs prototype`, once, through the kit's own
  script, on the fixture pages (1.3 s). The pictures are stand-ins under the names `shots.mjs` gives,
  as in Structure's run-through. `describe.mjs` is never run.

## Self-review: readings, and concerns

Readings I made where the sources left room. Each is a place the controller may rule otherwise.

1. **`measures.md` and `LOOK.md` both hold the table.** The brief and ruling 4 name `measures.md`; the
   template and the visual designer's card put the table "under the headings of `LOOK.md`". The skill has
   the visual designer write `measures.md` under the two headings "Measured values" and "Named
   extensions", in the template's shape, so that the judges can be handed it without `LOOK.md` (which
   holds what the other seats found); the session copies both into `LOOK.md` row for row at step 9.
2. **Who runs `shots` and `accept`.** The prototype builder's and the visual designer's cards each run
   them for their own check; the skills send those to `work/` and have the session take the pictures and
   the results of record, one command after the other. The browser work is done twice, on purpose: the
   record does not rest on a maker's reply. Rows `accept` has no check type for (a gap, the size of a
   text) rest on a script of the visual designer's own, "kept beside the table": the session cannot hold
   those to `results.json`.
3. **No maker at Detail or Look is handed her card or her profession's profile.** No maker's card there
   lists `person` or `profile` in `reads`, and the task says to hand exactly what the card reads.
   `templates/briefs/maker.md` offers both lines to every maker but a describer and a fresh maker, and
   `loop.md` says a maker is handed a profession's profile "where that is" what its template gives. I
   followed the cards.
4. **Mid-stage pages record their question with `await`** (the words; the two side by side; the
   directions), and the stage is put back in work with `begin` on his answer. Look's step 1 therefore
   sends a resuming session to "Gate" *or to the reference whose page he was asked on*. The conductor's
   "Resuming" says to "go on from step 8 of the loop", which fits a gate's question only.
5. **Step 2 of Detail copies only `DETAIL.md`.** `states.md` and `strings.json` are written by their
   makers from the templates, so that a file that is there means its maker ran, and a resumed stage goes
   on from the first step whose file is missing.
6. **A task read for each language** (§ 4.5): where the product ships more languages than the sheet
   seats readers for, the skill starts one instance for each and tells the founder the count grows, as
   Cast's "a later stage may add a seat … and says so" allows.
7. **The system fidelity judge writes its borrow list after he has said what he borrows**, in the main
   read, because its card's `borrow-list` check is triggered by his marks and also checks the rebuild.
   `fresh-pass.md` ("lists what the system lacks to make each thing he may want") can be read as before
   he chooses. He sees each extension with its cost at the gate.
8. **A variant he picks that the screens are not drawn in** is drawn once by a fresh visual designer and
   shown to him before the stamp; no judge reads it again.
9. **Direction mode casts only visual designers.** § 24 lets the screen generator be a direction maker;
   its card speaks of Look only inside a fresh pass, and the brief says "until a direction-maker card
   exists", so `direction.md` does not seat it. For a surface that leaves a system the direction's tokens
   stay in the package (`06-look/tokens.css`), and the project kit is left as it is.
10. **The one screen of a fresh pass, and the one detailed screen of a direction,** is fixed by a rule
    (the screen of the chosen structure that holds its primary action, `default` state, main language),
    so that the session does not choose it; the founder may name another when he reads the brief.

Concerns that are not mine to mend (I edited none of these files):

- **C1. The kit's only audience card does not sit at Look.** `fresh-pass.md` and § 12 have "one audience"
  rank the two at Look; `pool/audiences/task-reader.md` has `sits-at: [structure, detail, acceptance]`,
  Cast seats a seat only where its card sits, and `templates/briefs/audience.md` lists no Look. The skill
  says "one audience when the cast sheet seats one at Look", which with the kit as it is means none.
  Likewise `templates/outputs/LEDGER.md` says the profile judge's "Ranking" is "at Structure only", while
  the fresh pass asks it to rank the two at Look: `fresh.md` asks for the ranking in its ledger.
- **C2. A correction's Detail.** `routes.md` says a correction's four stages are stamped "each in its
  short form" but not what `05-detail/DETAIL.md` holds, nor where the before-and-after picture is kept.
  Detail's short form points to `routes.md` and adds nothing.
- **C3. For Task 18:** Structure's carry list does not carry `04-structure/reads/`; Detail and Look carry
  their own reads folders, for the handoff's `COVERAGE.md`. Look's carry list also keeps the lines of
  the cast sheet for stages already run (`- cast@<version>#detail`, `#look`): harmless, passed on "as
  they are".
- **C4. Line budgets.** `detail/SKILL.md` is 199 lines and `look/SKILL.md` exactly 200: a fix that adds a
  sentence to either must take one out, or move it to a reference.
- **C5. § 24's last row** (an image model only for a picture inside a design, or a direction's imagery)
  is said in neither skill: no card or ruling asks for it.


---

# Fix report — round 1

Worked from `task-17-fix-1.md`. Two commits on `0495666`, as the file names them; not pushed, not amended;
staged by explicit path. Every Important finding and every Minor one but M2 (deferred) is fixed.

| Commit | Subject | Files |
|---|---|---|
| `70692f2` | fix: makers know who they design for, and Look's readers are cast | the four maker cards, `pool/audiences/task-reader.md`, `skills/cast/references/presets.md`, `templates/outputs/LEDGER.md`, `skills/design/SKILL.md`, the two `seats.md`, `tests/pool.test.mjs`, `tests/skills.test.mjs` |
| `3881a55` | fix: the beside comparison is blind, and Detail and Look's smaller findings | the two `SKILL.md`, `detail/references/seats.md`, `correction.md` (new), `forms.md` (new); `look/references/seats.md`, `fresh.md`, `direction.md`, `forms.md` (new); `tests/skills.test.mjs` |

**One thing about the split.** The first commit also holds the lines of the two `seats.md` that R143 and
R144 force (each maker handed her card and her profession's profile; a section for the task reader at
Look), because the tests hold every seats page to its cards: with the cards changed and the pages not,
the commit would have been red. Each commit was green on the test files it touches when it was made.

## What changed, finding by finding

| Finding | What was done | Where | Test |
|---|---|---|---|
| **I1 / R142** blind beside comparison | A one-line `node -e` deals the letters with `crypto.randomInt`, copies the system's picture and each fresh one into `06-look/beside/` as `A-1280-light.png` …, writes which is which into `06-look/BESIDE.sealed.json` beside the folder, prints `dealt A, B` and nothing else, and refuses a `beside/` that is already there. Readers are handed `06-look/beside/` only; the sealed file, `fresh/`, `shots/` and `screens/` are on their "Do not open" for that read. The first page shows letters only (`Version A`); the sealed file is opened only after his first answer is written | `look/references/fresh.md` § 5, § 6, § 7; `look/references/seats.md` (the task reader); `look/SKILL.md` step 6 and "Writes" | `look: a fresh pass…` ; the run-through **runs the command**: two pictures land under two letters with the sealed file beside the folder, a second deal is refused, the page built from it names no `fresh`, `system` or `shots/`, and over repeated deals the system's picture is seen under both letters |
| **I2** the beside read's file | `06-look/reads/<seat>-beside.md`; closed to the main read, its own seat's included | `fresh.md` § 6; `look/references/seats.md` (readers' list) | the same test; `look: each seat is handed…` |
| **I3** a resumed session and the fresh brief | Step 3: "until `LOOK.md` holds it, written, you are at this stop, on any day"; `fresh.md` § 3: a session that finds `BRIEF-fresh.md` with no yes written puts the brief to him again and sends nothing. The question is also recorded with `await` | `look/SKILL.md` step 3; `fresh.md` § 3 | `look: a fresh pass…` |
| **I4** variants photographed, measured, read | A variant's page is named for its screen and its variant (`today-default-en-compact.html`); `variants/` has a `checks.json` of its own; two more commands in step 5 photograph it into `06-look/shots/` and measure it; "the final screens" a reader is handed include `variants/` | `look/references/seats.md` (visual designer; the definition of "the final screens"); `look/SKILL.md` step 5 and "Writes" | `look: two modes…` (both commands checked against `--help`) |
| **I5 / R143** makers know who they design for | `reads` of the four cards gain `person` and `profile`; both seats pages hand each maker her card and her profession's profile, whole; a fresh maker still neither | the four cards; both `seats.md` | `detail: each seat…`, `look: each seat…` (the same reads-against-hand-over loop, now with `person` and `profile`) |
| **I6** a correction's short form | `detail/references/correction.md`: no seat; the one thing changed as "is → becomes"; the two pictures in `05-detail/correction/`; one page with no seat line; one nod; `built-from: [frame@<version>]`; the conducting session may apply it after his nod. The skill's first "Never" keeps the exception | `detail/references/correction.md`; `detail/SKILL.md` | `detail and look: the other forms…`; the run-through walks a correction: `next` → `detail`, built from nothing refused, built from the frame stamped, `next` → `handoff` |
| **I7** the carry for the coverage page | Detail adds `- structure@<version>#what-the-readers-found` and `- source:<package>/04-structure/reads`; Look adds `- detail@<version>#what-the-readers-found`; both say the cast sheet's tables travel on | "Gate" of both skills | the two gate tests; the run-through stamps both lists |
| **I8 / R144** the beside readers are cast | `presets.md` "Added by rule": with a fresh pass at Look, `judge.truth`, `judge.profile` and one `audience.task-reader` read the beside comparison. The task reader's card sits at `look` and says what it reads there. The ledger keeps its Ranking for a beside comparison. A fresh pass asked for at the gate: its seats run on their cards' suggested model and effort, said to him at the brief's stop | `presets.md`; `task-reader.md`; `LEDGER.md`; `fresh.md` § 3; `look/references/seats.md` | `presets.md: what is added by rule…`; `look: each seat…`; `look: a fresh pass…` |
| **M1** | `measures.md` is copied into `LOOK.md` again after any later redraw, before the stamp | `look/SKILL.md` step 9 | `look: every command…` |
| **M4 / R145** two questions | First: what would he keep, by letter. Then the system fidelity judge writes the borrow list (`judge.system-fidelity-borrow.md`). Then the second page (`borrow.html`), by what each version is, with one line of that list for each thing he marked: which of the three outcomes | `fresh.md` § 7, § 8 | `look: a fresh pass…`; the run-through builds both pages |
| **M5** | "A question a stage asked mid-way is put again by that stage's own skill, at the step that asked it." The pinned sentence before it is untouched | `skills/design/SKILL.md`, "Resuming" 3 | `an awaiting stage is not begun again…` |
| **M6** | `<seat>`, in a reader's file, is the seat's id plus what it is loaded with: `judge.profile-<name>.md`, `judge.profile-<name>-reread.md` | both `seats.md` | `detail: blocking findings…`; `look: each seat…` |
| **M7 / R146** | A maker writes the tokens; the change to the project profile is put to him first, "before the kit is touched"; only after his yes is the kit rebuilt, and he looks at the redrawn `parts.html`; a token file that is there is never written over (a rebrand writes `<kit dir>/tokens-quiet-ledger.css`) | `direction.md`, "The pick becomes the tokens" | `direction.md: …` |
| **M8** | The truth judge at the beside read flags against the context's inventory and the approved strings, which it is handed | `fresh.md` § 6 | `look: a fresh pass…` (and `the brief did not hold` is gone) |
| **M9** | `references/forms.md` in both skills: an adjustment (no `<chosen>` with Structure skipped; no prototype and no pictures' line with no builder cast) and a flow (what repeats for each surface, what every surface writes into, what is done and stamped once). The skills' short paragraph points to it | both `forms.md`; both `SKILL.md` | `detail and look: the other forms…` |
| **M10** | "…and the board and the proposals folder beside it, but `<chosen>` where a seat is handed it" | `look/references/seats.md` | `look: each seat…` |
| **M12** | Every question `direction.md` asks is recorded with `await`, his answer written and the stage put back in work before the next step: a lens, the pick, a hybrid, the project profile, a fresh concept redrawn. Detail's mid-way questions (step 4) and the fresh brief's stop are recorded the same way | `direction.md`; `detail/SKILL.md` steps 1 and 4; `fresh.md` § 3 | `direction.md: …`; `detail: three makers…` |
| **M13** | Look's "Writes" lists `tokens.css`, `earlier/`, `beside/`, `BESIDE.sealed.json`, `borrow.json`, `borrow.html` | `look/SKILL.md` | `look: it reads the detail…` |
| M2 | Deferred, as ruled | — | — |

## Files, after the round

| File | Lines |
|---|---|
| `skills/detail/SKILL.md` | 200 |
| `skills/detail/references/seats.md` | 220 |
| `skills/detail/references/correction.md` | 59 (new) |
| `skills/detail/references/forms.md` | 43 (new) |
| `skills/look/SKILL.md` | 200 |
| `skills/look/references/seats.md` | 223 |
| `skills/look/references/fresh.md` | 198 |
| `skills/look/references/direction.md` | 135 |
| `skills/look/references/forms.md` | 40 (new) |
| `skills/design/SKILL.md` | 190 |

New commands, each checked against its script's `--help` by the test: `shots.mjs <package>/06-look/variants
--out <package>/06-look/shots --widths <primary>,<phone> --themes <themes>`; `accept.mjs prototype
<package>/06-look/variants/checks.json --root <package>/06-look/variants --out
<package>/06-look/variants/results.json`; `page.mjs <package>/06-look/borrow.json --out
<package>/06-look/borrow.html`; `shots.mjs <package>/05-detail/correction/before.html
<package>/05-detail/correction/after.html --out <package>/05-detail/correction --widths <primary>`. The
dealing command is `node -e`, no script of the kit: the command rule passes over it, and the run-through
runs it. Look no longer gives the `slug` command (the line went to make room; `loop.md` has it).

## Tests

- `node --test tests/skills.test.mjs`: 121 tests, 119 pass, 0 fail, 2 todo (`handoff`, `acceptance`).
  One test is new (`detail and look: the other forms…`), one was rewritten (the fresh pass), the
  run-through grew by the dealing command, the two pages, the longer carry lists and a correction.
- Whole suite, once, after the last edit: `npm test` → 752 tests, 749 pass, 0 fail, 1 skipped, 2 todo; 197 s.
- Mutants, by hand, 12 of 12 killed: the shuffle made constant; the command printing which picture is
  which; the beside readers handed `fresh/` and `shots/`; the sealed file opened first; "a brief that is
  there has been approved"; a token file written over; the kit rebuilt at once; a correction built from
  nothing; "What the readers found" dropped from Detail's carry; `--root` dropped from the variants'
  measure; a maker not handed her card; two profile judges sharing a re-read file.
- `scripts/describe.mjs` was run with `--help` only. The one browser-driving command a test runs is
  still `accept.mjs prototype`, once.

## Readings made in this round, and what is left

1. **The task reader's card gained one sentence besides `sits-at`** (I8 says "its card says what it
   reads there"): "At Look you sit only in a fresh pass: the options are versions of one finished
   screen, each under a letter. Rank them as any options, and never guess which was made how." The pool
   test's pin on `sits-at` was updated to the ruled value.
2. **`LEDGER.md`'s instruction had to stay within two lines** (a template rule), so "with the size of each
   gap" became "with each gap": "…at Structure and for a beside comparison at Look: delete it otherwise.
   The options by letter, the best first for this profession, with each gap, clear · slight · tie, and
   one reason."
3. **`presets.md`'s test** pinned the seats added by rule that are also preset for a size to the two
   judges; `audience.task-reader` is now a third, by R144, and the pin says so.
4. **The first page is blind to the founder too** (R142: "the decision page shows the letters; the sealed
   file is opened only after his answer is written"). So his marks are by letter, and what he marked on
   the system's own letter is set aside when the file is opened. If nothing he marked is on a fresh
   screen, the outcome is "nothing to borrow" and no second question is asked.
5. **The system fidelity judge reads twice with a fresh pass:** the borrow list alone, before the second
   question, and its main read afterwards, where it checks what was rebuilt. Its card's `borrow-list`
   check covers both halves; the brief of the first read says it is the list alone.
6. **A correction's gate is a page** built with `page.mjs` (one option, no seat line, the session's own
   one-sentence reason, one question), not the two pictures alone: `loop.md` § 7 has every decision after
   Cast go to him as one page. The stage is `2 of 4`, as its route has it.
7. **The dealing command is long** (one line of about 560 characters): it must deal, copy, seal and print
   in one run that the session cannot bias. A script of the kit would be the better home for it; this
   round could not add one.

Not mine to change in this round, and still open:

- `templates/briefs/audience.md` lists the stage as "Structure · Detail · Acceptance": Look is missing,
  now that the task reader sits there.
- `pool/judges/profile.md` says it ranks "at Structure" (its Method 6 and its Output); the ledger
  template and `fresh.md` now ask it to rank the letters of a beside comparison too.
- `pool/judges/system-fidelity.md`'s `borrow-list` method runs listing and checking as one read; R145
  splits them in two.
- Both `SKILL.md` are at exactly 200 lines.


---

# Fix report — round 2

Worked from the coordinator's message. Two commits on `3881a55`, as it names them; not pushed, not
amended; staged by explicit path.

| Commit | Subject | Files |
|---|---|---|
| `63a1e80` | feat: a command that deals letters to pictures for a blind comparison | `scripts/deal.mjs`, `tests/deal.test.mjs` (12 tests) |
| `f59678e` | fix: the beside letters stay sealed until his answer, and smaller findings | `skills/detail/SKILL.md`, `detail/references/correction.md`, `forms.md`; `skills/look/references/fresh.md`, `seats.md`, `direction.md`; `skills/cast/references/presets.md`; `pool/judges/profile.md`, `system-fidelity.md`; `templates/briefs/audience.md`, `maker.md`; `tests/skills.test.mjs` |

## `scripts/deal.mjs` (R147)

Test-first: `tests/deal.test.mjs` was written and seen to fail (the module was not there) before the script.

`node scripts/deal.mjs <picture>... --out <folder> [--group <name>=<picture>,<picture>]` ·
`node scripts/deal.mjs open <folder>`

- **Checks before any write:** every picture is there and is a file (every one at fault is named, not the
  first alone); none is named twice (by its real path); every version has as many pictures as the others;
  no two groups share a name; at most 26 versions; `--out` is not there, even empty; no sealed file lies
  beside it. A refusal copies nothing and makes no folder: a test counts the copies.
- **The deal:** the list is shuffled with `crypto.randomInt` (Fisher–Yates), letters go in the shuffled
  order, the copies are made in letter order into a staging folder beside `--out`, every copy is given one
  and the same time, the folder is renamed into place, and the sealed file is created with `wx`, never
  written over. A copy that fails part of the way, a folder that appears meanwhile, or another deal that
  seals the same name first each leave nothing of this deal, and nothing of the other's is touched.
- **Names:** a lone picture is `<letter><its extension>` (`A.png`); a group's pictures are
  `<letter>-<n><its extension>` in the order given (`A-1.png`, `A-2.png`): the simpler form, documented in
  the usage with "give every group its pictures in the same order". No name carries a width, a theme or a
  source.
- **The sealed file:** `<parent>/<FOLDER NAME IN CAPITALS>.sealed.json`, `{ "folder", "letters" }`, each
  letter with its source as written on the command line, or `{ "group", "pictures" }` for a group.
- **Prints** `dealt 2 versions into <folder>: A, B` and nothing else. `open <folder>` prints each letter
  with its source, and refuses a folder that does not hold exactly what its sealed file dealt (passing
  over `.fuse_hidden*`), a sealed file of another folder, and one that is not a sealed file.
- Exit codes 0 / 1 / 2; `--flag=value`; a path with a space works; the folders above `--out` are made.

Two readings: `--group` may repeat, which `lib/cli.mjs` refuses of any flag, so the script takes the
groups out of the command line itself and hands the rest to `parseArgs` (the library is untouched). And
fewer than two versions is bad usage (exit 2), since nothing can be compared.

**Hand mutants: 37. 33 were killed at once; 4 survived, and four added tests now kill them** (the
second check that the folder is not there, just before the rename; the folder taken back when the sealed
file cannot be created; `wx` against `w`; help found before a faulty `--group`). Among them: the shuffle
made constant, and made a Sattolo shuffle (a picture is then never under its own first letter); copies in
reverse order; no time set, and a different time on each copy; the sealed file put in the folder, and not
in capitals; the sources printed; each refusal removed in turn; staging and made folders left behind; the
`.fuse_hidden` pass removed; `open`'s three checks removed in turn.

## The skill findings

| Finding | What was done | Where | Test |
|---|---|---|---|
| **I7** Structure's table | Detail's carry adds `- cast@<version>#structure`, "so that the cast sheet's table for every stage travels on"; Look keeps it. With Structure skipped the line is left out, since the sheet has no such table | `detail/SKILL.md` gate; `detail/references/forms.md` | the gate test; the run-through stamps Detail and Look with the line, and asserts the chosen structure's own list does not hold it |
| **N1 / N4 / R147** | `fresh.md` § 5 gives the kit's command in place of the `node -e` line, says "name every version's picture, in any order", and no longer says which to name first. The pictures land as `beside/A.png` | `look/references/fresh.md`; `look/references/seats.md` | the fresh-pass test (the command is held to `--help` by the command rule; no file of Look holds `node -e`); the run-through runs it: two copies with one time, the sealed file beside the folder, a second deal refused |
| **N2** the second page's letters | `borrow.json` is built once the sealed file is opened, by what each version is ("The system version", "Fresh: outside-openai"); "this page's letters are not the beside letters"; every line that was written by letter is rewritten through the sealed file, as "the system version (was B)" | `fresh.md` § 8 | the fresh-pass test; the run-through opens the sealed file with `deal.mjs open` and builds the second page from it, each line carrying "(was A)" or "(was B)" |
| The sealed file's one way in | `node <kit root>/scripts/deal.mjs open <package>/06-look/beside`, in § 7, after his first answer is written; no step before it holds the command | `fresh.md` § 7 | the fresh-pass test |
| **N3** | `"seats": []`, since no seat read it | `detail/references/correction.md` | the forms test (and `page.mjs`'s own message) |
| **N5** | For the beside read: of `06-look/`, the lettered folder and nothing else; what a seat's section hands it from outside `06-look/` still holds, and what it hands of `06-look/` is its main read's | `fresh.md` § 6 | the fresh-pass test |
| **N6** | The main read's "Do not open" lists `borrow.json` and `borrow.html` | `look/references/seats.md` | the seats test |
| **N7** | The beside readers' rule stands with the rules of every size, and says so: "at every size at which a fresh pass runs at Look, an adjustment's among them" | `cast/references/presets.md` | the presets test (its place, before "from a surface up") |
| **N8** | After his yes, a fresh visual designer, handed the token file, `<kit dir>` and the contract, restyles the kit's classes from the direction's tokens; the session then draws with the kit and pictures `parts.html` by setup's steps 5 and 6; what he corrects goes back to the maker | `look/references/direction.md` step 4 | the direction test (and "steps 3 to 6" is gone) |
| `templates/briefs/audience.md:12` | `{Structure · Detail · Look · Acceptance}` | | the presets test |
| `pool/judges/profile.md` | Ranks the options at Structure "as you do the letters of a beside comparison at *Look*"; its output: "at Structure or in a `-beside` ledger, the ranking". Still 130 lines; lines 84–85 and 107 only | | the fresh-pass test |
| `pool/judges/system-fidelity.md` | `borrow-list` is "Two reads": between his two answers the list alone, in a ledger of its own; in the main read, the check of what was rebuilt. Still 125 lines; line 50 and lines 104–105 only | | the fresh-pass test |
| `templates/briefs/maker.md:33` | "…get neither of these two, and nor does a transcriber: delete both lines." The pinned words before the comma are untouched | | `loop.md: a seat is a fresh sub-agent…` |

## Tests

- `node --test tests/deal.test.mjs`: 12 tests, 12 pass.
- `node --test tests/skills.test.mjs`: 121 tests, 119 pass, 0 fail, 2 todo (`handoff`, `acceptance`).
- Whole suite, once, after the last edit: `npm test` → 764 tests, 761 pass, 0 fail, 1 skipped, 2 todo; 201 s.
- Mutants on the round's skill edits, by hand, 11 of 11 killed: `--out` dropped from the dealing command;
  "name the system's picture first" put back; Structure's table dropped from Detail's carry; "this page
  keeps the beside letters"; `borrow.*` taken off the main read's list; the size rule dropped from
  presets; the transcriber dropped from the maker template; "no seat" put back in the correction; the
  kit's rebuild left to nobody; "Two reads" dropped from the card; the sealed file opened with `cat`.

## Readings, and what stays open

1. **`--group` is not used by the skill.** At Look each version has one picture, at the primary width,
   so `fresh.md` names lone pictures. The flag is there for a comparison at several widths or themes.
2. **N8 hands the visual designer the kit folder and its contract**, which its card's `reads` does not
   list (`kit`). The ruling names the seat; the card was not in this round's scope.
3. **`profile.md` lost four words to stay at 130 lines:** "for this profession" and "and one reason" in
   Method 6 (the Output line keeps "each gap with a reason", and the ledger template "and one reason").
4. Both `SKILL.md` are still at exactly 200 lines; `look/SKILL.md` did not change in this round.

---

# Fix report — after the re-review

One commit on `f59678e`: `2509c3a` — fix: deal refuses mixed picture types and passes over a file browser's
leftovers, and two card lines. Not pushed, not amended; staged by explicit path (`pool/judges/profile.md`,
`pool/makers/visual-designer.md`, `scripts/deal.mjs`, `tests/deal.test.mjs`, `tests/skills.test.mjs`).

| # | Follow-up | What was done | Test |
|---|---|---|---|
| 1 | `pool/judges/profile.md`, Method 6 | The original sentence is back, word for word: "…then rank the options for this profession, with the size of each gap (*clear*, *slight* or *tie*) and one reason." A sentence follows it: "You rank the letters of a beside comparison at *Look* the same way, in a `-beside` ledger." The card is 131 lines | `look: a fresh pass…` (the regex holds both sentences) |
| 2 | `pool/makers/visual-designer.md`, `reads` | Gains `kit`, last. No test held the makers' `reads` as a list, so the Look seats test now holds the visual designer's in full, says where the kit is handed (`direction.md`, the rebuild after a direction pick) and that its main hand-over does not hand it. The vocabulary table already has `kit` | `look: each seat is handed…` |
| 3 | `scripts/deal.mjs`: mixed picture types | Refused, exit 1, before anything is written, when the pictures at the same place across versions do not share one extension: "cannot deal: the pictures at the same place in every version must share one extension, so that no letter stands out; they have .jpg, .png". The case of an extension counts, and so does having none. In a group each place is checked by itself. Said in the usage | `versions whose pictures are of different types are refused…` (lone pictures, case, no extension, each place of a group, nothing copied, the usage) |
| 4 | `scripts/deal.mjs`: a file browser's leftovers | `open` passes over `.DS_Store`, `Thumbs.db` and `desktop.ini` as it does `.fuse_hidden*`, by one pattern anchored at both ends. `open` is the only place the script looks at what a folder holds: `--out` must not be there at all, which is not a question of what it holds. Said in the usage | `open passes over what a mount or a file browser leaves in a folder, and nothing else…` (each of the four names; five stray names that only look alike are still refused) |

An earlier deal test dealt a `.png` beside a `.jpg` to show that a copy keeps its extension; it now deals
two `.jpg`.

**Tests:** `node --test tests/deal.test.mjs tests/pool.test.mjs tests/skills.test.mjs` → 236 tests, 234
pass, 0 fail, 2 todo (`handoff`, `acceptance`); `deal.test.mjs` alone 14 of 14. The whole suite was not
run again, as the message allows.

**Mutants, by hand, 6 of 6 killed** (one survived first and has its test now: only the first place of a
group checked): the type check removed; types compared without their case; the three names taken out of
the pattern; one of them alone; the pattern left open at its end.
