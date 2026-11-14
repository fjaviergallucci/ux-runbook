# Task 15 — Frame, Context, Intent, Cast: report

Status: **DONE_WITH_CONCERNS** (the concerns are readings the controller may want to rule on, listed in
§ 7; nothing is unfinished). Branch `v2-pipeline`, two commits, nothing pushed, nothing amended.

| Commit | Subject |
|---|---|
| `aa6fc81` | feat: a command that checks a project's own cards and people |
| `0198e25` | feat: the four opening stages |

## 1. What I wrote, file by file

| File | Lines | What |
|---|---|---|
| `scripts/card.mjs` | 97 (new) | `node scripts/card.mjs check <file>...`, a thin command over `validateCard` / `validatePerson`, built on `lib/cli.mjs` (ruling 3). |
| `tests/pool.test.mjs` | 1273 → 1491 | 12 new tests of the command, 87 → 99. No existing test changed. |
| `skills/frame/SKILL.md` | 143 (new) | Frame. |
| `skills/context/SKILL.md` | 174 (new) | Context. |
| `skills/intent/SKILL.md` | 163 (new) | Intent. |
| `skills/cast/SKILL.md` | 178 (new) | Cast. |
| `skills/cast/references/presets.md` | 104 (new) | The default cast by size (the brief's table, word for word), what is added by rule, each seat as its card has it, and what a seat does without its engine. |
| `tests/skills.test.mjs` | 1619 → 2334 | The four `waits` taken out of the table (their rule tests are live); 20 new tests of what the four stages and `presets.md` were written to say, 77 → 97 (92 pass, 5 `todo`: structure, detail, look, handoff, acceptance). No existing test changed. |

Nothing under `skills/design/`, `skills/setup/`, `templates/`, `pool/` or any other script was touched.

## 2. `scripts/card.mjs check` (rulings 3 and 13)

- **Usage:** `node scripts/card.mjs check <file>...`. One form, so the skills' command rule reads it
  (`check <file>...`, the last slot repeating).
- **By the file's folder:** the name of the folder the file is in, taken from the resolved path, says
  what it is held to: `makers/`, `judges/`, `audiences/` → `validateCard`; `persons/` →
  `validatePerson`. The checker is told `<folder>/<name>`, so the shelf must be the folder's and the id
  the file's name, as in the kit's own pool.
- **What it prints, all on standard output, one line each, under the path as given:**
  `<file>: ok` · `<file>: <fault>` for each fault · `<file>: passed over: a README.md is never a card` ·
  `<file>: file: a card is in a folder named makers, judges or audiences, and a person in one named
  persons; this file is in "<folder>"` · `<file>: file: cannot be read: <why>`.
- **Exit codes:** 0 every card sound (READMEs passed over count as nothing) · 1 any fault, a file in no
  folder of cards, or an unreadable file · 2 bad usage (no verb, another verb, `check` with no file, any
  flag), which prints the message, a blank line and the usage on standard error, and checks nothing.
- A file in another folder is judged by its folder **before it is opened**, so a file the command has
  no business with is never read. It writes nothing.

## 3. The thirteen rulings

| # | Ruling | Where it is carried out | Test that holds it (`tests/skills.test.mjs` unless said) |
|---|---|---|---|
| 1 | Un-`todo` the four; header, kit-root sentence, six sections, 200 lines, paths that exist; the conductor's and setup's words | The four `SKILL.md`; each opens with "The conductor (`ux:design`) sent you, and its words are yours" and points to `skills/design/references/loop.md` | `the frame/context/intent/cast skill keeps every rule of a skill` (four, live) · `each opening stage has the six sections and no other, asks the question the conductor gives it…` · `in the four opening stages the word profile is…` |
| 2 | Every command as the script takes it; output from its template; `built-from`; `## Carry`; his words under `## Reviewed by the founder` before the stamp | Each skill's Writes, Steps and Gate | `every command an opening stage gives is one its script takes…` · `each opening stage writes its output from its template…` · `at each gate there is one question, and his answer is written under "Reviewed by the founder" before the carry list and the stamp` · `the four opening stages run as written…` (the commands are run, and the outputs stamped by the real script) |
| 3 | R125: `card.mjs check`; Cast runs it before it reads a card; a faulty card reported and left out | `scripts/card.mjs`; Cast step 3; Intent step 3 | `tests/pool.test.mjs`: the 12 `card.mjs…` tests · `cast: a project's own cards are checked before one is read…` |
| 4 | Two pools; a project card with a kit card's id replaces it, and the sheet says so | Cast Reads and step 4 | `cast: a project's own cards are checked before one is read, a faulty one is reported and left out, and the two pools are laid side by side` |
| 5 | Engines at Cast: shown when off, never turned on; outside describer only with a provider on, provider and model id on its line; transcriber; the three makers in `presets.md` "added by rule" | Cast step 8 and Never; `presets.md` § Added by rule and § A seat without its engine | `cast: an engine that is off is shown and never turned on…` · `presets.md: what is added by rule…` |
| 6 | Model and effort are suggestions; a dash for `none`; the proposal sentence; nothing refuses or rewrites his choice | Cast step 9, Gate and Never | `cast: an engine that is off is shown and never turned on, an outside describer is cast only with a provider on, and model and effort are suggestions` |
| 7 | Frame runs `init` with the size agreed, records one profession, several or everyone, lists the preset seats whose engine the check shows missing or off | Frame steps 4 to 6 and Gate | `frame: one exchange, the three values and the route, who it is for, and the preset seats whose engine the check shows missing or off` · `frame: the package is made on his yes…` |
| 8 | Context reads the world, careful what it copies; pictures by `shots.mjs` or from the founder; the as-is read by the judges that sit at `context`, from `templates/briefs/judge.md`; the shared machine | Context Reads, steps 3 and 4, Never | `context: the one stage that reads the world, every fact with its source, and careful what it copies` · `context: a surface that exists is read as it is first…` (the two judges are held to the cards' `sits-at`) |
| 9 | Intent: the person card from its template on top of the profession's profile, checked; the criteria test; a task is a start and a goal; ten states filled or "cannot occur because …" | Intent steps 3 and 4 | `intent: written from the corrected context and nothing else, with her card…checked before it is used` · `intent: the success-criteria test, tasks as a starting situation and a goal, the ten states…` |
| 10 | One question at a time; a gate is one message, written before the stamp; nothing shortlisted, detailed or drawn early; each Never names the stage's temptation | Each Gate and Never | `at each gate there is one question…` · `each opening stage says in Never what that stage is tempted to do, first…` |
| 11 | Reading: the listed sections of the design only; the skills fill exactly what the templates hold | Read: § 4.0–4.3, 5, 7, 8, 9, 10 "in the pipeline", 12, 24, and nothing else of that document; the plan file was not opened | `each opening stage writes its output from its template: built from the stage before it, every section of the template named, and none the template lacks` |
| 12 | Plain, short, second person; generic; examples from the room-booking tool | All five files | `no product name appears in any file under skills/` (existing) · the `\brooms?\b` line of `each opening stage says in Never…` |
| 13 | A `README.md` is passed over by the command and by Cast; Frame reads `## Engine check` | `card.mjs`; Cast step 3; Frame Reads and step 6 | `tests/pool.test.mjs`: `card.mjs check: a file named README.md is never a card…` · `cast: a project's own cards are checked…` · `each opening stage reads the output of the stage before it…` (Frame and Cast read `## Engine check`) |

## 4. Every command the four skills give

Each was checked by hand against the script's `--help`, is held by the command rule (which reads the
same `--help`), and all but `shots.mjs` are **run** in `the four opening stages run as written`.

| Skill | Command, as written | The form of the usage it fits |
|---|---|---|
| frame | `node <kit root>/scripts/state.mjs init <package> --design <name> --kind <kind> --foundation <foundation> --size <size>` | `init <package> --design <name> --kind <kind> --foundation <foundation> --size <size> [--date <day>]` |
| frame | `node <kit root>/scripts/state.mjs begin <package> frame` | `begin <package> <stage> [--date <day>]` |
| frame | `node <kit root>/scripts/state.mjs route <package> <stage> <full\|short\|skipped> --reason "<why>"` | `route <package> <stage> <full\|short\|skipped> --reason "<why>" [--date <day>]` |
| frame | `node <kit root>/scripts/state.mjs status <package>` | `status <package>` |
| frame | `node <kit root>/scripts/state.mjs stamp <package> frame --words "<the founder's words>"` | `stamp <package> <stage> --words "<the founder's words>" [--date <day>]` |
| context | `node <kit root>/scripts/state.mjs begin <package> context` | `begin <package> <stage> [--date <day>]` |
| context | `node <kit root>/scripts/shots.mjs <file or folder> --out <package>/work/as-is --widths <w,w...>` | `<file or folder>... --out <folder> --widths <w,w...> [--themes light,dark] [--chrome <path>] [--timeout <ms>] [--allow-errors]` |
| context | `node <kit root>/scripts/state.mjs await <package> context --question "<the one question>"` | `await <package> <stage> --question "<the one question>" [--date <day>]` |
| context | `node <kit root>/scripts/state.mjs slug "<heading text>"` | `slug "<heading text>"` |
| context | `node <kit root>/scripts/state.mjs stamp <package> context --words "<the founder's words>"` | `stamp …` as above |
| intent | `node <kit root>/scripts/state.mjs status <package>` | `status <package>` |
| intent | `node <kit root>/scripts/state.mjs begin <package> intent` | `begin …` |
| intent | `node <kit root>/scripts/card.mjs check <packages>/pool/persons/<name>.md` | `check <file>...` |
| intent | `node <kit root>/scripts/state.mjs await <package> intent --question "<the one question>"` | `await …` |
| intent | `node <kit root>/scripts/state.mjs slug "<heading text>"` | `slug "<heading text>"` |
| intent | `node <kit root>/scripts/state.mjs stamp <package> intent --words "<the founder's words>"` | `stamp …` |
| cast | `node <kit root>/scripts/state.mjs status <package>` | `status <package>` |
| cast | `node <kit root>/scripts/state.mjs begin <package> cast` | `begin …` |
| cast | `node <kit root>/scripts/card.mjs check <file>...` | `check <file>...` |
| cast | `node <kit root>/scripts/state.mjs await <package> cast --question "<the one question>"` | `await …` |
| cast | `node <kit root>/scripts/state.mjs slug "<heading text>"` | `slug "<heading text>"` |
| cast | `node <kit root>/scripts/state.mjs stamp <package> cast --words "<the founder's words>"` | `stamp …` |

`presets.md` gives no command. None of the five files names `describe.mjs`, `--endpoint`, a key or
`keys-file`: a test refuses each.

## 5. `presets.md`: every seat it names, and its card

The three rows of the brief's table are in the file word for word (a test compares them to the rows
written out in the test). Every name in a cell was checked against its card: it sits at that stage,
and it is preset for that size. Conversely, every card preset for a size is named in that size's row,
and the four cards preset for no size are exactly the four "by rule". A test holds all of it.

| Named in the table as | Seat | Card | Sits at | Preset for | Engine | Model · effort |
|---|---|---|---|---|---|---|
| structure describer | `maker.structure-describer` | `pool/makers/structure-describer.md` | structure | surface, flow, system | `own` | fable · high |
| interaction designer | `maker.interaction-designer` | `pool/makers/interaction-designer.md` | detail | adjustment, surface, flow, system | `own` | fable · high |
| interface writer | `maker.interface-writer` | `pool/makers/interface-writer.md` | detail | adjustment, surface, flow, system | `own` | fable · high |
| prototype builder | `maker.prototype-builder` | `pool/makers/prototype-builder.md` | detail | surface, flow, system | `own` | opus · medium |
| visual designer (and the three directions) | `maker.visual-designer` | `pool/makers/visual-designer.md` | look | adjustment, surface, flow, system | `skill:frontend-design:frontend-design` | fable · high |
| usability | `judge.usability` | `pool/judges/usability.md` | context, structure, detail, acceptance | adjustment, surface, flow, system | `own` | opus · high |
| truth | `judge.truth` | `pool/judges/truth.md` | structure, detail, look, acceptance | surface, flow, system | `own` | opus · high |
| words | `judge.words` | `pool/judges/words.md` | detail, acceptance | surface, flow, system | `own` | opus · high |
| accessibility | `judge.accessibility` | `pool/judges/accessibility.md` | detail, look, acceptance | surface, flow, system | `own` | opus · high |
| visual craft | `judge.visual-craft` | `pool/judges/visual-craft.md` | context, look, acceptance | surface, flow, system | `skill:design-audit:design-audit` | opus · high |
| system fidelity | `judge.system-fidelity` | `pool/judges/system-fidelity.md` | look, acceptance | adjustment, surface, flow, system | `own` | opus · medium |
| cold implementer | `judge.cold-implementer` | `pool/judges/cold-implementer.md` | handoff | adjustment, surface, flow, system | `own` | opus · high |
| task reader | `audience.task-reader` | `pool/audiences/task-reader.md` | structure, detail, acceptance | surface, flow, system | `own` | opus · medium |
| by rule | `judge.profile` | `pool/judges/profile.md` | intent, structure, detail, look, acceptance | — | `own` | opus · high |
| by rule | `maker.outside-describer` | `pool/makers/outside-describer.md` | structure, look | — | `model:any` | — · — |
| by rule | `maker.screen-generator` | `pool/makers/screen-generator.md` | structure, look | — | `tool:stitch` | — · — |
| by rule | `maker.transcriber` | `pool/makers/transcriber.md` | structure | — | `own` | sonnet · medium |

**No row of the brief's table names a seat that no card provides**, with one thing to say: "Direction:
3 directions" names no seat, and the pool has no direction maker. The visual designer's card has the
mode ("When you are cast for a direction…"), so `presets.md` seats three `maker.visual-designer`, each
with a lens of its own (§ 7, concern 6).

## 6. What I tested, and the results

**`card.mjs` — RED:** the 12 tests written first, `node --test tests/pool.test.mjs` → 87 pass, 12 fail
(`Cannot find module …/scripts/card.mjs`). **GREEN:** 99 pass, 0 fail. `npm test` before the commit: 703
tests, 693 pass, 0 fail, 1 skipped (the folder-mode test, on this NTFS mount), 9 `todo`.

What the 12 pin: the usage for `--help` / `-h` wherever it stands; a sound card of each shelf and a
sound person, one by one and in one run, with CRLF too; each fault on its own line with its file, exit
1, equal to the checker's own list, the file left as it was; a faulty person; the folder deciding (a
judge in `makers/`, a renamed file, a person among the audiences, a seat among the persons); a file in
another folder (`profiles/`, the pool's root, a folder too deep, a look-alike folder, a file that is not
there) refused unopened; relative paths from three working directories; `README.md` passed over in
every folder, alone, beside a sound card and beside a faulty one, and `readme.md` not passed over;
several files in order with one fault among them; an unreadable file (missing, a folder) with the
others still checked; six kinds of bad usage with exit 2; and the kit's own 22 cards and people in one
run. Every run asserts all three of exit code, standard output and standard error, so the output is
pristine: nothing on standard error but bad usage. Every path is under a folder with a space in it.

**Hand-mutation of `card.mjs`:** 18 mutants, one at a time, each run against `tests/pool.test.mjs`
and restored (byte-compared afterwards). **18 of 18 killed.**

| Mutant | Failing tests |
|---|---|
| a README is held to the format | 3 |
| a fault never changes the exit code | 8 |
| the folder taken from the path as given, not resolved | 1 |
| a person held to the seat format | 6 |
| the file read before its folder is judged | 1 |
| faults printed on standard error | 8 |
| the checker not told the file | 1 |
| stops at the first faulty file | 2 |
| bad usage exits 1 | 1 |
| a sound card prints nothing | 6 |
| `check` with no file allowed | 1 |
| README matched whatever its case | 1 |
| only the first fault printed | 3 |
| any verb taken as `check` | 1 |
| an unreadable file passed as sound | 1 |
| a file in no card folder passed as sound | 3 |
| the usage error printed without the usage | 1 |
| the passed-over line not printed | 3 |

**The four skills — RED:** the four `waits` taken out and the 20 tests written before any skill file
existed: `node --test tests/skills.test.mjs` → 97 tests, 69 pass, 23 fail, 5 `todo` (the four rule
tests said "skills/<name>/SKILL.md is not written"; 19 of the 20 new ones failed; the profile-word test
passed on nothing, and bit once the files were there). **GREEN:** 97 tests, 92 pass, 0 fail, 5 `todo`.

**One test runs the stages.** `the four opening stages run as written` takes each `state.mjs` and
`card.mjs` command out of the skills as written, fills its placeholders, and runs it from a project's
root in a folder with a space: `init`, `begin`, `route`, `status`, `stamp` for Frame; `begin`, `slug`,
`await`, `stamp` for Context; `card.mjs check` on a person, `begin`, `slug`, `await`, `stamp` for
Intent; `card.mjs check` on the whole pool (four READMEs passed over, one person sound), `begin`,
`status`, `slug`, `await`, `stamp` for Cast. Each output is the template with the `built-from` its
skill gives and a carry list built from the skill's own words, and the real script stamps it. Then
`validate` prints `ok` and `next` prints `structure`. It also proves the one place the skills go past
the template's example: a cast sheet built from `[intent@1]` alone is **refused** by the stamp when it
carries a section of the context ("names context, which cast is not built from; add it to
built-from"). `shots.mjs` is not run: this task starts no browser.

**Spot mutation of the skills:** 21 edits to the five files, one at a time (init before his yes, a
command for the wrong stage, a flag dropped, a judge dropped from the as-is read, a secret value
allowed, two angles, the card not checked, the path allowed in a task, a wrong `built-from`, the
README sentence cut, a model enforced, a seat named where its card does not sit, a suggested model
other than the card's, a maker dropped from "added by rule", the word profile alone, and so on).
**21 of 21 failed a test.**

**`npm test`, after the last edit, before the commit:** 723 tests, 717 pass, 0 fail, 1 skipped (the
folder-mode test, on this NTFS mount), 5 `todo`. About three and a quarter minutes. The same totals
in a run just before the last wording edits; the run counted here is the one after them.

The five other stage skills are still `todo`, each naming its task.

## 7. Self-review: findings and concerns

Read once more as the session that reaches each stage with only the package and the skill. Three
things were found and mended that way: Cast had no step that reads the intent and starts the sheet
from its template (now step 2); a stage resumed while awaiting the founder was told only "unless it
is awaiting" (now: "is not begun again: go to Gate, with his answer"); and Intent had no way to learn
its kind or whether it is routed short (it now asks `state.mjs status`).

Concerns, each a reading the controller may want to rule on:

1. **No decision page at these four gates.** `loop.md` § 7 says "a decision goes to the founder as one
   page". Frame, Context, Intent and Cast have no options and no pictures, and what he must read is the
   output itself, so each skill says "there is nothing to pick from, so no decision page is built: the
   context / the intent / the cast sheet is the page". If the approval page
   (`templates/outputs/decision-approve.json`) is wanted at Intent or Cast, it is a few lines in each.
2. **Frame makes the package on his yes, not before.** `init` fixes the kind and the foundation and no
   verb changes them, so the frame is put to him in one message first, and `init`, `begin`, the file,
   his words and the stamp follow his yes. Frame therefore gives no `await`: before his answer there is
   no package to keep a question in.
3. **Where the as-is read is kept.** No template or folder names a place for the pictures of today's
   surface and the two ledgers. The skill puts them in `<package>/work/as-is/`: the findings are
   written into the context with their seat, and `work/` is the folder every later seat is told not to
   open, which keeps today's screen away from the describers.
4. **Cast is built from `[intent@1, context@1]`.** The template's comment gives `[intent@1]` as its
   example. Structure reads only the cast sheet and what its carry list names, so Cast must carry the
   context's inventory and constraints on, and the state script refuses a carry entry of a stage that
   is not in `built-from`. Proven by the refused stamp in the run-through test.
5. **Cast opens one section of a card.** `pool/INDEX.md` says Cast reads the index, not the cards. The
   cast sheet's "Checks on · off" needs each judge's optional checks, which only its card holds, so
   Cast chooses from the index and then opens `## Optional checks` of each judge that sits, and the
   header of a project's own card.
6. **Readings in `presets.md`, under the table that is word for word:**
   - "Direction: 3 directions" → three `maker.visual-designer`, each cast for a direction; and, from
     `routes.md`, the same opening of Look where the foundation is `no-system`.
   - "(only if visual)" is read as governing the whole Look cell of an adjustment.
   - "task reader" alone (Detail, Acceptance) is read as one instance, the primary person; two sit only
     where the table says so, at Structure.
   - "`judge.truth` always on a public page" → never left out there.
   - "`judge.words` gets its own question to the founder" → its line of the cast sheet says its read is
     put to him as a question of its own, apart from the rest of the stage (the kinds table: "the
     words get their own review"). If the question was meant to be asked at Cast, this line is wrong.
   - `judge.profile`'s stages (Structure, Detail as its main read, Acceptance; Look only on a
     criterion about legibility or context) are § 10's.
7. **The short forms** (an adjustment) of Context, Intent and Cast are my rendering of the one line
   `routes.md` gives each; a heading that has nothing says "Not gathered: an adjustment" or "Unchanged
   by this adjustment" rather than being deleted. Frame's one line for a correction is the template's.
8. **`card.mjs` prints faults on standard output,** as `state.mjs validate` prints its problems, and
   keeps standard error for bad usage. `merge.mjs` prints a refusal on standard error; here the faults
   are the report the session reads, file by file. A profession's profile has no checker: passed to
   the command it is "in no folder of cards" (exit 1), and Cast is told to name only the four folders.
9. **Nobody can turn an engine on after setup.** Frame and Cast say `engines-on` is the founder's line
   and stop there, as ruled; setup stops when the project is already reviewed. How he turns one on
   later is outside this task.
10. **The two reads before a cast sheet exists** (Context's as-is judges, Intent's optional profile
    judge) run on the model and effort the card suggests, "unless he says otherwise", and their briefs
    say that no cut of the checks was made.
11. `pool/CARD-FORMAT.md` and the READMEs setup writes do not mention the new command; `pool/` and
    `skills/setup/` were not mine to edit.
12. **Not mine:** `docs/plans/BUILD-STATE.md` appeared untracked in the checkout at 13:30 while I was
    working. I did not create, open or stage it.

Not done, on purpose: no skill tells a session to open, list or name a keys file, to pass
`--endpoint`, or to run `describe.mjs`; `scripts/describe.mjs` was never run; no browser was started;
no process was stopped; no dependency was added.
