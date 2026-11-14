# Task 13 — the skill tests and the conductor: report

Status: **DONE_WITH_CONCERNS** (the concerns are decisions for the controller, none is a known defect).
Commit: `1c347fd feat: the conductor skill and the tests every skill must pass`, on `v2-pipeline`, on top of
`a2d3ff8` (see concern 1: two commits by another agent landed while I worked).

## 1. What I wrote

| File | Lines | What it is |
|---|---|---|
| `tests/skills.test.mjs` | 935 | The rules every skill keeps, as functions; 21 tests proving each rule on inline samples; 2 tests on the kit as it is; 11 per-skill tests (`design` live, ten `todo`); 2 guards; 18 tests of what the conductor says. |
| `skills/design/SKILL.md` | 168 | The conductor. Opening (what a package, a stage, a seat and the founder are; the kit-root sentence; the three rules), then `## The order` · `## Before a stage` · `## The loop` · `## Resuming` · `## Never`. |
| `skills/design/references/loop.md` | 189 | The nine steps in full, with `### Starting a seat` and `### Several ledgers, one stage` under step 5. |
| `skills/design/references/routes.md` | 99 | Kind, foundation, size; the route of each size as the state script sets it; the size only moves up; a correction. |
| `skills/design/references/blind.md` | 135 | § 12's table as seven rules; context, never the design, with the five things a brief may not contain; the order in eleven steps with each command; what stays sealed and what stays out of the board. |
| `skills/design/references/fresh-pass.md` | 62 | § 12's fresh pass in full, with the three outcomes. |
| `skills/design/references/lessons.md` | 43 | § 14: the two files, the entry's shape (the template's own labels and table), the line on seats and models. |

Nothing under `templates/`, `pool/` or `scripts/` was touched. No dependency added. LF endings.

## 2. The seventeen rulings

Test line numbers are in `tests/skills.test.mjs`.

| # | Ruling | Where it is carried out | The test that holds it |
|---|---|---|---|
| 1 | Product names, whole words, every file under `skills/` | `NAMES` (l. 78), `named` (l. 105), the rule in `skillFaults` (l. 296) | l. 574 (whole words, on samples; SKILL.md and a reference), l. 662 (every file under `skills/`), and each skill's own test |
| 2 | Description in double quotes; parsed value verbatim; no description holds a `"` | `headerFaults` (l. 201–218); `skills/design/SKILL.md:3` | l. 377 (one character off, three ways), l. 383 (unquoted; single quotes; an inner double quote), l. 618 (no description in the table holds a `"`) |
| 3 | Only paths that exist; six prefixes; no `reference/…` in the conductor | `KIT_FOLDERS` (l. 75), `KIT_PATH`/`kitPaths` (l. 111–112), `pathFaults` (l. 237) | l. 454 (what is found, and what is the project's), l. 471 (SKILL.md, a reference, a folder, a script in a command), l. 485 (a `references/…` of the skill's own). `reference/` is covered from today: any mention fails until Task 18 writes it |
| 4 | Per-skill `todo`, named with the task; every rule proven on inline samples | The table `SKILLS` (l. 22–67, `waits: 'Task 14'` …), the loop at l. 647 | l. 361–582 (the samples: a good stage skill, and a bad one per rule, each through `only`, which asserts exactly one fault); l. 653 (a waiting skill that gets written fails until its `waits` is removed) |
| 5 | The six sections in order; others only after `## Never`; `design` and `setup` are not stage skills | `STAGE_SECTIONS` (l. 70), `sectionFaults` (l. 221–234), `stage: true` on the nine | l. 413 (each missing; `###` and a fenced `##` are not sections), l. 426 (order; twice), l. 433 (own section after, never among), l. 439 (only a stage skill) |
| 6 | The kit-root sentence, fixed | `KIT_ROOT` (l. 72); `skills/design/SKILL.md:14–15` | l. 446 (missing; one word changed; only in a reference), l. 361 (wrapped is fine), l. 692 (the root really is two folders above `skills/design/`) |
| 7 | Map and pick beside the board; readers handed the board folder only; no one-letter `.json` graft | `blind.md:19` (rule 6), `:79` (where merge writes the map), `:95–97` (step 7), `:105–106` (`PICK.md`, `Pick: <letter \| none>`), `:115–123` (sealed; what the board holds; `04-structure/chosen/`) | l. 861 (paths built from the script's own `MAP` and `PICK` constants; `board/MAP…` and `board/PICK…` appear nowhere), l. 883 (step 7 and rule 6 both say "the board folder only, never its parent") |
| 8 | Model and effort are suggestions; a dash is the session's model; nothing enforced | `loop.md:98–103` | l. 793 |
| 9 | A shared machine: own browser through own handle; never by name or pattern; never more than three | `loop.md:104–107`; `SKILL.md:166–167` | l. 810; l. 743 (the Never list) |
| 10 | Agent tool, `general-purpose`, project's root; brief from the three templates; names files, never pastes | `loop.md:60–62, 76–77, 92–97`; `SKILL.md:162–163` | l. 793; l. 743 |
| 11 | Keys: the Never line as given; `--profile` and nothing about keys; never `--endpoint` | `SKILL.md:158–160`; `blind.md:67–71` | l. 743 (the line, word for word); l. 764 (every `describe` command has `--profile`; no key name in any file); l. 561 (a command that passes `--endpoint` is a fault, for every skill) |
| 12 | One question at a time; one page from `decision.json`; the page's question the only one | `loop.md:135–160`; `SKILL.md:154–155` | l. 776 (the command as `page.mjs` takes it, the template, "the only question on it") |
| 13 | Resuming on the state alone; every verb as the script takes it | `SKILL.md:62–88` (validate, next, status), `:119–143` (resuming; reopen, resize, route); `loop.md:21, 57, 157, 177` (begin, slug, await, stamp); `routes.md:7` (init) | l. 715; l. 764 (the eleven verbs are all given, each matched against a form of the script's `--help`) |
| 14 | Plain, short, second person; ≤ 200 lines; generic | `SKILL.md` is 168 lines; examples are the room-booking tool (`design/today`, the rooms example in `blind.md:46–48`, the lessons row) | l. 401 (200 passes, 201 fails), each skill's own test |
| 15 | Read of the design | Read: § 2, § 3, § 4's opening table and paragraph, § 5, § 6, § 12, § 14. Not the plan. See concern 2 for one line outside those sections | — |
| 16 | Several ledgers: side by side, disagreements in the seats' own words, never averaged or settled | `loop.md:109–116`; `SKILL.md:164–165` | l. 817; l. 743 |
| 17 | An audience is handed a profile's traits, never the profile | `loop.md:83–88` | l. 817 (also checks the label is the profile template's own and that `templates/briefs/audience.md` asks for that copy) |

## 3. Every command the conductor gives

Each was checked against the script's `--help` (line numbers are lines of that output), and the test at
l. 764 plus the command rule (l. 245) re-check them on every run. The four marked *ran* I also ran for
real in the scratchpad, on a package made with `init` and the kit's fixture proposals.

| Command | Where | Usage line it was checked against | Ran |
|---|---|---|---|
| `state.mjs validate <package>` | `SKILL.md:67`, `loop.md:13` | state l. 22 | yes: `ok`; after an edit, `frame: changed-since-approval: …` |
| `state.mjs next <package>` | `SKILL.md:68`, `loop.md:14` | state l. 23 | yes: `frame`, `context`, `none` |
| `state.mjs status <package>` | `SKILL.md:84`, `loop.md:25` | state l. 24 | yes |
| `state.mjs reopen <package> <stage> --reason "<why>"` | `SKILL.md:135` | state l. 15 | yes: `reopened frame at version 2; stale: context` |
| `state.mjs resize <package> --size <size>` | `SKILL.md:136`, `routes.md:80` | state l. 20 | yes; down is refused: "the size only moves up" |
| `state.mjs route <package> <stage> <full\|short\|skipped> --reason "<why>"` | `SKILL.md:137`, `routes.md:68` | state l. 17 | yes |
| `state.mjs init <package> --design <name> --kind <kind> --foundation <foundation> --size <size>` | `routes.md:7` | state l. 6 | yes |
| `state.mjs begin <package> <stage>` | `loop.md:21` | state l. 7 | yes |
| `state.mjs slug "<heading text>"` | `loop.md:57` | state l. 25 | yes |
| `state.mjs await <package> <stage> --question "<the one question>"` | `loop.md:157` | state l. 9 | yes; it shows under "Open question" in `status` |
| `state.mjs stamp <package> <stage> --words "<the founder's words>"` | `loop.md:177` | state l. 11 | yes; refused without the stage before it in `built-from` |
| `page.mjs <decision.json> --out <decision.html>` | `loop.md:140`, `blind.md:102` | page l. 1 | yes, on the template's sample |
| `describe.mjs --provider <openai\|gemini> --model <id> --brief <file> --out <file.json> --profile <PROFILE.md>` | `blind.md:67` | describe l. 1–2 | no (it would send a brief outside) |
| `merge.mjs <proposals dir> --out <board dir>` | `blind.md:75` | merge l. 1 | yes: letters in the board, the map in its parent |
| `render.mjs <board dir>/A.json --kit <kit dir> --out <board dir>/A.html --letter A` | `blind.md:85` | render l. 1 | yes; `merge.mjs open` still opens with pages and `kit.css` in the board |
| `shots.mjs <board dir> --out <board dir> --widths <w,w...>` | `blind.md:92` | shots l. 1 | no (this task starts no browser) |
| `merge.mjs open <board dir>` | `blind.md:110` | merge l. 2 | yes: refused before `PICK.md`, opens after `Pick: A` |

No command passes `--date` (it defaults to today), `--seed` or `--endpoint`.

## 4. What I tested

**RED** (tests written first, no `skills/` folder): 54 tests, 23 pass, 21 fail, 10 todo. The `design` test
failed with `skills/design/SKILL.md is not written`, the conductor's 18 with `ENOENT` (one with an empty list of commands), and the two guards
because `skills/` did not exist. All 23 sample and kit tests passed before any skill existed.

**GREEN** `node --test tests/skills.test.mjs`: 54 tests, 44 pass, 0 fail, 10 todo. Output pristine: the
ten waiting skills print one `ok … # TODO Task N writes skills/<name>/SKILL.md` line each and no stack.

**`npm test`**, once, before the commit: 654 tests, 643 pass, 0 fail, 1 skipped (the existing NTFS one),
10 todo, 194 s, exit 0.

**Hand mutation of the rule functions**: 82 mutants, each one change to a rule (a check switched off, a
boundary moved, a branch of a regular expression removed), run against a copy of the test file in the
scratchpad. 81 were killed at once. One survived (`/^node /` loosened to `/node /` in `commandsOf`); I
added a sample (a code span with `node` in its middle) and it is killed. While preparing the list I found
five places no sample reached and pinned each before the run: a flag whose value is a choice
(`--wing <east|west>`), a required flag that takes no value (`lock <desk> --now`), a `description:`
line outside the header, a help text with no `Usage:` line, and which forms a refusal cites. I also
removed one branch instead of pinning it (a repeating slot followed by another slot: no script has
one). **No mutant is left that I could not pin.**

**Mutation of the conductor's text** (a copy of `skills/` beside symlinks to the kit, never the checkout):
35 changes (rows of the order swapped, `ux:setup` misnamed, a Never line dropped, a flag renamed, a verb
misspelt, a route cell changed, the map moved inside the board, `--endpoint` or `--seed` added, a ban
dropped, a fourth outcome, a label of the lessons entry dropped …). 34 killed at once; one survived
(step 7 of `blind.md` handing readers the parent folder, because the sentence stands twice) and is now
asserted in both places.

## 5. Self-review

Read once more as a session asked "design the screen where the front desk sees what is free now": it
could not tell at first whether to resume or to start, so `## The order` now opens with three numbered
questions (set up? a package already? else `ux:frame`). After that it knows what to run first, which
skill to invoke, what it may not do, and how to pick the design up tomorrow from the folder.

### Concerns, for the controller

1. **The checkout moved while I worked.** Commits `619f041` and `a2d3ff8` (not mine) changed
   `templates/` and `pool/`: `BRIEF-fresh.md` now holds a Structure form and a Look form. I read the
   diff and `fresh-pass.md` says so (l. 17–19). Nothing else I wrote depended on what changed.
2. **`work/`.** That it is the package's scratch ("prompts and raw outputs, never an input") comes from
   one line of design § 15 that a `grep` for the word surfaced; I did not read that section. That it
   sits inside the package is my reading of that line's indentation. Please confirm.
3. **Where a seat's brief is written is my call**: "a file in the package's `work/` folder unless the
   stage's skill names another place" (`loop.md:94–95`). Ruling 17 says "beside the brief" and nothing
   says where a brief is. Tasks 14–18 will copy this.
4. **Rules beyond the brief's list**, each because a ruling asks for the thing: (a) a command that runs
   a kit script is checked against that script's `--help`, must be written `node <kit root>/scripts/…`,
   and never passes `--endpoint` or `--seed`; (b) a folder is a path too; (c) a `references/…` a skill
   names must be in its folder; (d) `skills/` holds only the eleven. For later tasks this means: Task
   14's `--text` and Task 15's `scripts/card.mjs` are read from their `--help` with no change to the
   test, provided the usage keeps the shape `Usage: node scripts/<name>.mjs …`; and a project path such
   as `<packages>/kit/kit.css` is not looked for in the kit.
5. **`todo` without a function.** A `todo` test whose body runs and fails prints a stack and a "failing
   tests" block, ten times. So a waiting skill is registered with `{ todo }` and no body, and the guard
   at l. 653 fails the moment a waiting skill is written while its `waits` is still in the table.
   Un-`todo` = delete `waits: 'Task N'`; the test then fails with "is not written", as steps 1 of
   tasks 14–18 expect.
6. **Setup's sections.** Ruling 5 says setup is not a stage skill, so the table does not hold it to
   the six. Task 14's brief gives setup those same six: adding `stage: true` to its row would hold it.
7. **Ruling 2's premise** is not true of two descriptions (`setup`, `acceptance` hold no ": "). All
   eleven are quoted regardless, as the ruling orders.
8. **The kit's own `LESSONS.md`** (`lessons.md:35`) does not exist until Task 19. It is not under a
   prefix the path rule covers, and the session is told never to write to it.
9. **A correction and its four stamps.** `routes.md:96` says the four stages of a correction's route are
   stamped, each in its short form, and leaves how his one nod serves four stamps to those skills.
10. **The test file holds both product names**, in the pattern and in the samples that prove it, as
    `tests/pool.test.mjs` does. No file under `skills/` holds either.
11. **Small additions of mine in the text**: four Never lines from the rulings (paste, average, stop a
    process, edit the state files) after the brief's seven; "never open a key file, never print a key
    or the environment" on the key line; "start the judges of a stage in one message"; the fix round
    going to "a fresh sub-agent in the seat whose work the findings are on".

---

# Fix report — round 1

Commit: `13b4440 fix: a correction is the conductor's to apply, and the skill tests read nested references`,
on `v2-pipeline`, on top of `1c347fd`. Seven files, staged by path: the conductor, its five references,
`tests/skills.test.mjs`. Nothing under `templates/`, `pool/` or `scripts/` touched. `SKILL.md` is 185 lines.

## What was fixed, finding by finding

Test lines are in `tests/skills.test.mjs` as committed.

| Finding | What changed | Where | The test that holds it |
|---|---|---|---|
| **I1** a correction | Both lines carry the exception: "…except to apply a correction after his nod (`references/routes.md`)" | `SKILL.md:24–25` (opening), `:169–170` (Never) | l. 854, which also checks `routes.md` still says the conducting session may do the work |
| **I2** nested references | `ownReferences` reads a path of any depth; a named path is good when it is a file of the folder, or a folder that holds one | l. 116, `pathFaults` l. 257–265 | l. 526: a nested file, its folder, a nested file that is missing, and the start of a name that is not a folder (`references/floor`, `references/fre`) |
| **M1** "the makers' files" | A reader's "Do not open" lists four things: the package's `work/` folder, where the makers' briefs are, the map, the pick and the proposals folder | `blind.md:97–98` | l. 1038 |
| **M2** what the board holds | Four things it holds (letters' files, drawn pages, the kit's stylesheets the render copies, pictures); three that never go in it (the decision page and its `decision.json`, anything of a fresh pass, anything from `work/`) | `blind.md:122–128` | l. 1057 |
| **M3 / R135** a board made again | Never deleted: the board folder, the map and the pick are moved together into `04-structure/earlier/<n>/`, `1` first; then merge into a clean `04-structure/`; nothing in `earlier/` is ever an input | `blind.md:129–135` | l. 1057 |
| **M4** `<kit dir>` | Rule 2 and step 5 say the same: always the project's kit folder, the one the project profile names; with no design system it holds the grey kit unchanged | `blind.md:11–14`, `:89` | l. 1038 |
| **M5 / R136** two profiles | The opening defines package, stages, seat, card, the founder, **the project profile**, **a profession's profile**, carry list and board, and says once "No seat is ever handed the project profile". Every other mention in the six files is now one of the two terms, "profile judge", "profile card" or the `--profile` flag | `SKILL.md:10–22`; `loop.md:91–99, 180`; `blind.md:11–12, 64, 71, 89`; `fresh-pass.md:52`; `routes.md:13`; `lessons.md:9` | l. 840: each word is defined, and in every file of the conductor the word "profile" never stands alone |
| **M6** an awaiting stage; Frame's `init` | Loop step 1 names the two stages that are not begun: Frame on a new design (it runs `init` first) and a stage that is awaiting (put the question again; on his answer go on from step 8, without `begin`). `SKILL.md` says the same in the loop and in Resuming | `loop.md:24–30`; `SKILL.md:109–110, 141–143` | l. 862 |
| **M7** one fix round | "One fix round and one re-read, and no more"; what is still open goes to the founder with the gate | `loop.md:138–145` | l. 919 (and "by default" and "second round" appear nowhere) |
| **M8** the "Given" list | By form: in both forms; at Structure besides (the hardest state); at Look besides (the one screen, its state, its approved items in order with their words); not given in either | `fresh-pass.md:22–28` | l. 1071, which also checks the template still has the two sections and the three labels the list speaks of |
| **M9** who reads which brief | One rule in three places: the Structure brief always, every fresh brief at Structure or at Look, since either may leave the machine; at the other stages he reads a seat's brief when he asks | `loop.md:75–78`; `SKILL.md:114–115`; `fresh-pass.md:19–20` | l. 938 (and "like any brief" and "At Structure, always" appear nowhere) |
| **M10** which rule wins | The limit: seats that drive a browser are started three at a time, the others in one message | `loop.md:118–119` | l. 961 |
| **M11** commands that passed silently | A command is now found wherever `node` runs something under `scripts/`: after a prompt, after `cd … &&`, before `&&`, `;`, a pipe or `\|\|`, with its script in quotes. It must be written `node <kit root>/scripts/<name>.mjs …`, for every skill | `commandsOf` l. 128–143, `commandFaults` l. 268–306 | l. 542, 592, 647 |
| **M12** valid Markdown | In a table row `\|` is read as the bar it stands for. A command carried on by a backslash is still refused, once, saying "a command stays on one line"; the rule's comment says so too | l. 122–127, 279–282 | l. 542, 592 (table, and the same span outside a table), l. 647 (wrapped) |
| **M13** project paths | No change of behaviour. The comment and the fault now say how a path of the project is written: `<packages>/…` or `<package>/…` | l. 107–112, 260–261 | l. 513: the two paths bare (refused, with the hint) and written from `<packages>/` (passed), and an indented tree |
| **M14** kit-shape pins | Replaced by: each form the conductor uses is taken by the script's usage, and one wrong variant of it is not. Nothing counts a script's forms or lists its optional flags | — | l. 732 |

## Checked against the scripts

- **R135**, in the scratchpad: with a pick left beside it, `merge` refuses ("PICK.md already exists, a
  pick made on another board"); with the board folder, the map and the pick moved into
  `04-structure/earlier/1/`, `merge` makes a new board, and `merge.mjs open` still opens the earlier one
  where it now lies.
- **M6**: `next` names an awaiting stage; `begin` on it sets the state to in-work and the header to
  `status: draft`; `stamp` works straight from awaiting.

## Tests

- `node --test tests/skills.test.mjs`: 60 tests, 50 pass, 0 fail, 10 todo (was 54: six tests added).
- `npm test`, once: 660 tests, 649 pass, 0 fail, 1 skipped (the existing NTFS one), 10 todo, 192 s.
  After that run I changed one sentence of `blind.md` ("A reader is handed the whole board" became "A
  judge is handed the whole folder", since an audience gets the pictures alone) and re-ran only the two
  test files that read `skills/`, `skills.test.mjs` and `pool.test.mjs`: 146 tests, 0 fail. The full
  suite was not run again on that sentence.
- **Hand mutation of the changed rule functions** (`ownReferences`, `pathFaults`, `commandsOf`,
  `commandFaults`): 38 mutants, all killed. One branch turned out to be redundant and was removed
  instead of pinned (an explicit skip for a script name left to fill in: the "script not in the kit"
  line below it already passes over it).
- **Mutation of the conductor's text** (a copy, never the checkout): 35 changes, one or more for each
  finding (the exception dropped from either line, "No seat is ever handed…" dropped, a bare "profile"
  put back in each file, "by default" restored, the pick left out of the move, the fresh pass let into
  the board, a quoted wrong command, a wrapped command, a bare project path …). All 35 killed.

## What the new rules mean for tasks 14 to 18

- A `node` command that mentions anything under `scripts/` is the kit's and must be written
  `node <kit root>/scripts/<name>.mjs …` on one line. So a skill cannot quote the one-line check a card
  gives (`node --input-type=module -e "… './scripts/lib/walkthrough.mjs' …"`), which only runs from the
  kit's root: it names the card instead. `node --version` and the like are not checked.
- A reference may sit in a sub-folder (`references/presets/working-surface.md`).
- A project path is written `<packages>/…` or `<package>/…`. A bare `kit/kit.css` or
  `pool/profiles/x.md` is read as the kit's, also inside a code fence, and must exist there.

## Concerns

1. **R135 moves the board, the map and the pick, not the proposals.** After `Pick: none` and a reopened
   Intent or Context, the proposals of the earlier round are still in `04-structure/proposals/` and the
   next `merge` would put them on the new board beside the new ones. I wrote the ruling as given and did
   not add a rule for the proposals: it needs a decision (move them with the board when the brief
   changed; keep them when a proposal only arrived late), here or in Task 16.
2. **The word "profile" is now policed in the conductor's files only** (l. 840). Later skills are not
   held to the two terms by a test; they will read them in `SKILL.md`'s opening.
3. Concerns 2, 3, 6, 8 and 9 of the first report (where `work/` is and that briefs are written there;
   setup's sections; the kit's own `LESSONS.md`; a correction's four stamps) are unchanged and were not
   part of this round.

---

# Fix report — round 2

Commit: `181e2fc fix: a fresh concept reaches the board as a letter, and a rejected round moves whole`, on
`v2-pipeline`, on top of `13b4440`. Four files, staged by path: `skills/design/SKILL.md` (186 lines),
`references/blind.md`, `references/loop.md`, `tests/skills.test.mjs`. Nothing under `templates/`, `pool/`
or `scripts/` touched.

## What was fixed

Test lines are in `tests/skills.test.mjs` as committed.

| Finding | What changed | Where | The test that holds it |
|---|---|---|---|
| **N1** a fresh concept and the board | What never goes in the board is "anything of a fresh pass as it came, its screens and its gallery". Then: "A fresh concept reaches the board only as its structure written into the walkthrough format, through the merge, like any other letter." | `blind.md:127–131` | l. 1126, which also checks that `fresh-pass.md` still puts the structure on the board as one more letter and that rule 7 still says every valid proposal reaches it |
| **R135 extended** a rejected round | Nothing is deleted; what is set aside goes to `04-structure/earlier/<n>/`. A round he rejected moves whole: everything in `04-structure/` other than `earlier/`, before the new round starts (the briefs, the proposals folder, the board, the map, the pick, the pictures, the reads, the decision page). The pick's own bullet says the round moves whole too | `blind.md:132–143`, `:146–147` | l. 1138 holds the sentence, with its list |
| **Rule 6** who is handed what | "A judge is handed the board folder and nothing above it; an audience is handed the pictures only." Step 7 says the same, and that the pictures are named each by its path | `blind.md:20–21`, `:96–100` | l. 1082 (the rule, and that `templates/briefs/audience.md` gives pictures only), l. 1107 (step 7 and the rule); "board folder only" appears nowhere |
| **`loop.md`** what a seat is handed | A new line: a seat is handed what its brief template gives it, and no more; where that is a profession's profile, a maker or a judge is handed it whole and an audience only its traits; a describer and a fresh maker are handed neither the person nor her profession's profile, unless the template says so. "Makers and judges are handed … whole" is gone | `loop.md:94–97` | l. 1031, which also reads the maker template's own sentence on describers and fresh makers |
| **N2** the size, not the verb | Both places: "except, in a design sized `correction`, to apply it after his nod (`references/routes.md`)" | `SKILL.md:24–25`, `:169–171` | l. 911: both sentences, that `correction` is a size of the state script, and that "except to apply" is said nowhere |
| **N3** the command reader | A command starts only where a shell would start one: at the start of the line, after a prompt (`$`, `%`, `>`), after `&&`, `\|\|`, `\|` or `;`, or after settings of the environment (`NAME=value`). It ends at those separators and at a redirection (`>`, `>>`, `2>`, alone or with the target against it, and `<` alone). It is the kit's only when a word names `scripts/` where a path starts, or after nothing but `./`, `../` or a placeholder | l. 118–159 | l. 597, one sample for each case: prose in a fence, a `//` comment, a `#` comment, `echo node …`, a word after another; each prompt, each separator, one and two settings; each redirection; `tests/scripts/…`, `myscripts/…`, `my-scripts/…`, `my.scripts/…`, an absolute path. Through the whole rule: l. 638 and l. 701 |

## Checked against the scripts

In the scratchpad, on a package with Structure in work, a board, reads, a decision page and `Pick: none`:
after `reopen intent`, everything in `04-structure/` other than `earlier/` was moved into `earlier/1/`.
`validate` then reports only the stale cast, `next` names `intent`, a new `merge` into `04-structure/board`
works, and `merge.mjs open` still opens the earlier board where it lies.

## Tests

- `node --test tests/skills.test.mjs`: 62 tests, 52 pass, 0 fail, 10 todo (two tests added).
- `npm test`, once, **after the last edit**: 662 tests, 651 pass, 0 fail, 1 skipped (the existing NTFS
  one), 10 todo, 189 s, exit 0. The seven files were hashed before the run and checked after it: none
  changed, and the commit is that state.
- **Hand mutation of the changed rule functions** (`words`, the separators, the prompts, the two
  predicates, `KIT_SCRIPTS`, `commandsOf`): 39 mutants. 37 were killed at once. Two survived, both in the
  pattern for the kit's scripts folder (`../` no longer accepted; only one leading segment): I had taken
  the dot out of the pattern's look-behind, which let a match start in the middle of `../`. The dot is
  back, a sample pins it (`my.scripts/desk.mjs`), and both are killed. No mutant is left unpinned.
- **Mutation of the conductor's text** (a copy, never the checkout): 19 changes, one or more for each
  finding, all killed; and two that must stay green do (prose and a comment in a fence; a right command
  with `2>/dev/null`).

## Concerns

1. **One clause is mine, not ruled.** R135 as extended speaks of a rejected round. For a board made
   again within a round (a proposal arrived late), round 1 moved the board, the map and the pick. I
   added "and with what was written about its letters, the reads and the decision page: the next merge
   deals the letters anew" (`blind.md:141–143`), because reads and a decision page left in place would
   speak of letters that now name other proposals. Strike the clause if it is not wanted; l. 1138 pins it.
2. **"Everything" includes `CHOSEN.md`, and the state does not know.** Checked in the scratchpad: if
   Structure was marked awaiting on a `CHOSEN.md` when its round is moved, `validate` reports
   `structure: missing-artefact` until Structure is begun again, and the old open question stays in
   `status` even after `begin` (the script closes a question on stamp, reopen, skip or stale, not on
   begin). With Structure only in work, nothing is reported. This is the Structure skill's to say
   (Task 16): begin Structure again when the new round starts. I did not write it into the conductor.
3. **How I read "the start of a path segment" in N3.** Read literally, `tests/scripts/x.mjs` has
   `scripts/` at the start of a segment, yet the finding names it as wrongly counted. So the rule is:
   `scripts/` where a path starts, or after only `./`, `../` or a `<placeholder>`. `tests/scripts/…` and
   an absolute path are then not the kit's; `<package>/scripts/x.mjs` would be taken for it.
4. **Three prompts** are passed over at the start of a line: `$`, `%` and `>`. A `#` is read as a
   comment, so `# node scripts/…` is not a command.
5. The open concerns of the first report (where `work/` is and that briefs are written there; setup's
   sections; the kit's own `LESSONS.md`; a correction's four stamps) are unchanged.

---

# Fix report — after the re-review

Commit: `67f23ff fix: the command reader sees through wrappers, and two sentences on the board and the
lessons`, on `v2-pipeline`, on top of `181e2fc`. Three files, staged by path: `references/blind.md`,
`references/lessons.md`, `tests/skills.test.mjs`. `SKILL.md` is untouched (186 lines). Nothing under
`templates/`, `pool/` or `scripts/`.

## The four points

Test lines are in `tests/skills.test.mjs` as committed.

| # | What changed | Where | The test that holds it |
|---|---|---|---|
| 1 | A command also starts after a program that runs it: `env` (with or without settings), `time`, `exec` (so `pnpm exec node …`), `npx`, `timeout <n>`, and inside `(…)` or `$(…)`. A parenthesis outside double quotes is read as a word of its own, and a closing one ends the command | `WRAPPERS` l. 129, `apart` l. 131, `commandsOf` l. 149–170 | l. 616: one line for each form reads the command. l. 660: for each of eight forms (`WRAPPED`, l. 409) the right command passes and the wrong one is refused as "not as `scripts/desk.mjs` takes it". Not a start: `sleep 60 node …`, `timeout node …` |
| 2 | The redirection pattern is `/^(?:[0-9]\|&)?>/` | l. 134 | l. 616 (`&>/dev/null`, `&> all.txt`, `1><package>/closed.txt` end the command), l. 660 (right passes, wrong refused, for `&>/dev/null` and `1><file>`) |
| 3 | Rule 6 and step 7: "Of `04-structure/`, a judge is handed the board folder and nothing else", then "What else a seat's brief template lists comes from the approved stages" (rule 6 adds "as `references/loop.md` says") | `blind.md:20–22`, `:97–102` | l. 1111 and l. 1136: both sentences in both places, and "nothing above it" appears nowhere |
| 4 | Both references, in the same words: "Nothing in `earlier/` is ever an input to a stage or a seat", and that a lessons entry may read it, since what was set aside and why is part of what a design taught | `blind.md:137–140`, `lessons.md:31–33` | l. 1171: the sentence in both files, and "is ever an input" is never said without "to a stage or a seat" in any file of the conductor |

Pins were changed only where their words changed: the two "handed the board folder" pins, and the
`earlier/` pin. Every other pin is as it was.

## Tests

- `node --test tests/skills.test.mjs`: 62 tests, 52 pass, 0 fail, 10 todo. With `tests/pool.test.mjs`,
  which also reads `skills/`: 148 tests, 0 fail. The full suite was not run, as the message allowed.
- **Hand mutation of what changed in the command reader**: 25 mutants (each wrapper removed, `timeout`
  removed or loosened, the closing parenthesis not ending a command, parentheses not set apart or set
  apart inside quotes, the digit or the `&` taken out of the redirection pattern, and the earlier start
  rules again). All 25 killed.
- **Mutation of the two references' text** (a copy): 10 changes, all killed; and two that must stay green
  do (a right command inside `$(…)`; a right command under `timeout 60 … &>/dev/null`).

## Concerns

1. **Prose that looks like a wrapped command is now read as one.** In a code fence or a code span,
   `node` right after `time`, `env`, `exec`, `npx`, `(` or after `timeout` and one word starts a command.
   A line such as "(node scripts/ are the kit's)" in a fence would be refused as a command written
   wrongly. I judged that rarer than the wrong commands the wrappers hid; it is the cost of point 1.
2. A parenthesis inside **single** quotes is still set apart (only double quotes are protected), so
   `--words 'yes (go on)'` would be read as ending at the parenthesis. The kit's usage texts quote with
   double quotes.
3. The earlier open concerns stand as reported: the clause of mine on a board made again within a round;
   `CHOSEN.md` and the open question when a rejected round moves (for Task 16); where `work/` is and
   that briefs are written there; setup's sections; the kit's own `LESSONS.md`; a correction's four
   stamps.
