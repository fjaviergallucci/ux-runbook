# Task 16 — Structure: report

Status: **DONE_WITH_CONCERNS** · commit `f5fce0c` on `v2-pipeline` · nothing pushed, nothing amended.

## What I wrote

| File | Lines | What it is |
|---|---|---|
| `skills/structure/SKILL.md` | 200 (the limit, exactly) | The stage: header, the six sections, nine steps with the stop at the brief, the gate with the stop at the pick, 13 Never lines. Nine fenced commands. |
| `skills/structure/references/seats.md` | 151 | The long form of who is handed what: one `###` section for each of the eight kit cards that sit at Structure, each with "Handed", "Do not open", "Writes"; the list every reader's brief carries, said once. |
| `skills/structure/references/rounds.md` | 90 | The long form of what follows a board besides a plain pick: a graft, a round he rejected, a board made again within a round, each with its commands. |
| `tests/skills.test.mjs` | +613 −2 (3038) | `structure` un-`todo`ed (`waits` removed), `renameSync` imported, ten Structure tests appended. |

The stops and the fresh pass did not fit in 200 lines, so two `references/` files carry the long form,
as the task allowed. SKILL.md points to both; the generic rule holds them to the path, command and
name rules too. Nothing under `skills/design/`, another skill, `templates/`, `pool/` or `scripts/` was
touched.

## The fifteen rulings

| # | Ruling | Where it is carried out | Test that holds it |
|---|---|---|---|
| 1 | Un-`todo`; header in double quotes; kit-root sentence; six sections; ≤ 200 lines; existing paths; the conductor's words | SKILL.md header and opening; `waits` removed from the table | "the structure skill keeps every rule of a skill"; "structure: the six sections and no other…" (also: no long form of the loop, of blind.md or of fresh-pass.md is copied) |
| 2 | Map and pick beside the board; `Pick: <letter \| none>`; board holds letters, pages, pictures; no one-letter `.json` for a graft; readers handed the board folder only | Step 7, step 8, Gate (PICK bullet, graft bullet), Never; `rounds.md` § graft; `seats.md` § readers | "structure: the map and the pick sit beside the board…"; "structure: a judge is handed the board folder…"; the run-through (map beside the board; a `D.json` saved in the board shuts `open`) |
| 3 | Every command as its script takes it; the map opened only with `merge.mjs open`, after `PICK.md` | All fences; Gate "Only now may the map be opened" | "structure: every command is one its script takes…" (each command against `--help`; the nine fences of SKILL.md in order; `open` only in Gate, after the PICK bullet); the run-through (`open` refused before a pick, and on "a bit of each") |
| 4 | Nothing leaves before his yes; the stop names the seats that send it out and the provider; `describe.mjs` with five flags; no `--endpoint`, no key; valid / raw / refusal | Step 4; step 5; `seats.md` § outside describer; Never 1 and 2 | "structure: two stops…"; "structure: makers start in one message…"; "every command…" (exactly one describe command, its five flags; no file holds `--endpoint`, `--seed`, `--text`, `--timeout`, `API_KEY`, `keys-file`, `.env`, a URL) |
| 5 | The brief carries the format; "What to return" left as the template has it | Step 3 | "structure: two stops…" (and both templates hold the three headings) |
| 6 | A proposal is checked before the merge; sent back once; left out and said so; never repaired | Step 6; step 9 (`findings`); `seats.md` § makers | "structure: makers start in one message…"; the run-through (an invalid proposal: the merge writes nothing and prints file and fault; moved to `proposals/left-out/`, the merge then reads no sub-folder) |
| 7 | Describers in one message; render and shots one after another; three browser-driving at most; no process stopped by name | Step 5, step 7, Never; `seats.md` § makers | "structure: makers start in one message…" |
| 8 | One page from `decision.json`: options by letter, one line per seat, one recommendation, one question; fresh gallery beneath, labelled, never mixed | Step 9, Gate | "structure: the decision is one page…"; the run-through (page built beside the board, gallery after the options, nothing added to the board) |
| 9 | Graft redrawn once and re-read once, in `chosen/`; all rejected → `state.mjs reopen`, no more proposals against the same brief; `CHOSEN.md` from its template, carry list, stamped | Gate; `rounds.md` §§ graft, rejected | "rounds.md: a graft is redrawn once…"; "structure: it reads the cast sheet…" (every heading of `CHOSEN.md` named, the carry list, the stamp); the run-through (graft drawn in `chosen/`, board unchanged, stamp on the carry list the skill gives) |
| 10 | Each seat on what its cast line names; a dash is the session's model; nothing enforced | Step 5 | "structure: makers start in one message…" |
| 11 | Read § 4.4, § 12, § 24 rows only; each seat handed exactly what its card reads | `seats.md` | "structure: a judge is handed the board folder…": one section per card whose `sits-at` holds `structure`, and no other; each `reads` token found in "Handed"; the intent, the context and the format handed only where a card's `reads` allows them; each `never-reads` token found in the seat's lists |
| 12 | Plain, short, second person, generic, room-booking examples | All three files | The generic rule (no product name); "the six sections…" (a room example; the word "profile" always qualified) |
| 13 | A rejected round is moved whole into `earlier/<n>/` | `rounds.md` § rejected, step 4; Gate; Never | "rounds.md…" (the list, word for word against blind.md's); the run-through (everything but `earlier/` moved; a merge in the clean folder finds no proposal) |
| 14 | After the move Structure starts clean: `begin`, fresh `CHOSEN.md` and brief templates; `validate` reports the artefact missing meanwhile; a board made again within a round | SKILL.md step 1 (the one awaiting stage that is begun again); `rounds.md` § rejected steps 5–6, § board made again | "rounds.md…"; the run-through (`validate` prints `structure: missing-artefact`, `next` prints `intent`; after Intent and Cast are stamped again, `begin` → "structure is in work", `validate` → `ok`) |
| 15 | His marks in a fresh gallery go into `DECISIONS.md` with the rejection, before the move; Look reads them there, never in `earlier/` | `rounds.md` § rejected, step 2 (before step 4) | "rounds.md…" (order held by `inOrder`) |

## Every command the skill gives

All were checked by the generic rule against each script's `--help`, and again in "every command is one
its script takes". The usage column is the form matched.

| Command, as written | Where | Usage it was checked against |
|---|---|---|
| `node <kit root>/scripts/state.mjs begin <package> structure` | SKILL step 1; rounds § rejected 6 | `begin <package> <stage> [--date <day>]` |
| `node <kit root>/scripts/describe.mjs --provider <openai\|gemini> --model <id> --brief <package>/04-structure/BRIEF.md --out <package>/04-structure/proposals/<name>.json --profile <packages>/PROFILE.md` | SKILL step 5 | `--provider <openai\|gemini> --model <id> --brief <file> --out <file.json> --profile <PROFILE.md> [--endpoint <url>] [--timeout <ms>]` — neither optional flag passed |
| `node <kit root>/scripts/merge.mjs <package>/04-structure/proposals --out <package>/04-structure/board` | SKILL step 7 | `<proposals dir> --out <board dir> [--seed <n>]` — no seed |
| `node <kit root>/scripts/render.mjs <package>/04-structure/board/<letter>.json --kit <kit dir> --out <package>/04-structure/board/<letter>.html --letter <letter>` | SKILL step 7 | `<proposal.json> --kit <kit dir> --out <file.html> [--letter A]` |
| `node <kit root>/scripts/shots.mjs <package>/04-structure/board --out <package>/04-structure/board --widths <primary>,<phone>` | SKILL step 7 | `<file or folder>... --out <folder> --widths <w,w...> […]` |
| `node <kit root>/scripts/state.mjs status <package>` | SKILL step 9 (span) | `status <package>` |
| `node <kit root>/scripts/page.mjs <package>/04-structure/decision.json --out <package>/04-structure/decision.html` | SKILL step 9 | `<decision.json> --out <decision.html>` |
| `node <kit root>/scripts/state.mjs await <package> structure --question "<the one question>"` | SKILL Gate | `await <package> <stage> --question "<the one question>" [--date <day>]` |
| `node <kit root>/scripts/merge.mjs open <package>/04-structure/board` | SKILL Gate | `open <board dir>` |
| `node <kit root>/scripts/state.mjs slug "<heading text>"` | SKILL Gate (span) | `slug "<heading text>"` |
| `node <kit root>/scripts/state.mjs stamp <package> structure --words "<the founder's words>"` | SKILL Gate | `stamp <package> <stage> --words "<the founder's words>" [--date <day>]` |
| `node <kit root>/scripts/render.mjs <package>/04-structure/chosen/chosen.json --kit <kit dir> --out <package>/04-structure/chosen/chosen.html --letter <letter>` | rounds § graft | as render above |
| `node <kit root>/scripts/shots.mjs <package>/04-structure/chosen --out <package>/04-structure/chosen --widths <primary>,<phone>` | rounds § graft | as shots above |
| `node <kit root>/scripts/state.mjs reopen <package> <stage> --reason "<why>"` | rounds § rejected 3 | `reopen <package> <stage> --reason "<why>" [--date <day>]` |
| `node <kit root>/scripts/state.mjs validate <package>` | rounds § rejected 5 (span) | `validate <package>` |
| `node <kit root>/scripts/state.mjs next <package>` | rounds § rejected 5 (span) | `next <package>` |

Run for real in the run-through, placeholders filled: begin, merge, render (board and chosen), page,
await, merge open, slug, stamp, reopen, validate, status, next. **Not run:** `shots.mjs` (it drives a
browser; its own tests do; the run-through writes stand-in pictures under the names the script gives)
and `describe.mjs` (`--help` only, as instructed).

## Every seat: what it is handed, what its brief lists under "Do not open"

Paths are in `<package>/`; "04/" stands for `04-structure/`. The last column is the card's header.

| Seat | Handed | "Do not open" | Card: `reads` · `never-reads` |
|---|---|---|---|
| `maker.structure-describer` | `04/BRIEF.md`; `kit/KIT-CONTRACT.md`; its lens, in its brief. Neither the person nor her profession's profile. (A continuity maker the cast's "Blind rules" names: today's screen besides.) | `04/proposals/` but its own file; `work/`; today's screen; everything else in the package; no idea of the session's in the brief | brief, walkthrough-format · other-proposals, session-idea, current-screens |
| `maker.outside-describer` (a script, no sub-agent) | The approved brief, whole and unchanged: `04/BRIEF.md`, or `04/BRIEF-fresh.md` for a fresh-pass line. Nothing else is sent. | Nothing else can reach it: no other proposal, no idea of the session's, nothing of today's screen, the design system, the project's kit or the sibling surfaces | brief · other-proposals, session-idea, current-screens, design-system, kit, sibling-surfaces |
| `maker.screen-generator` | `04/BRIEF-fresh.md`, alone | The design system and its tokens; `<packages>/kit` and the kit's own; today's screens and sibling surfaces; `04/proposals/`; `work/`; everything else; no idea of the session's | brief · design-system, kit, current-screens, sibling-surfaces, other-proposals, session-idea |
| `maker.transcriber` | Its one source: the concept's screens in `04/fresh/` (files and pictures, by path) or the one `.raw.txt`; `kit/KIT-CONTRACT.md` | `04/BRIEF.md`, `04/BRIEF-fresh.md`; the prompt kept beside a generated screen; `02-intent.md`; every other file of `04/proposals/` and `04/fresh/`; `work/`; no idea of the session's | brief, source-screen, walkthrough-format · describers-brief, generator-prompt, intent, other-proposals, session-idea |
| `judge.usability` | `04/board/`, whole; `02-intent.md` | The readers' list (below) | brief, intent, options, pictures (+ later stages') · maker-notes, author-map, other-ledgers |
| `judge.truth` | `04/board/`, whole; `01-context.md`; `02-intent.md`; the project's facts document where the project profile names one | The readers' list | brief, context, intent, product-facts, options, pictures (+ later) · maker-notes, author-map, other-ledgers |
| `judge.profile` | `04/board/`, whole; its profession's profile, whole; `02-intent.md` | The readers' list (the audiences' reads and another profile judge's ledger are in it) | brief, profile, intent, options, pictures (+ later) · maker-notes, author-map, other-ledgers, task-reads |
| `audience.task-reader` | Her card; her profession's traits (the copy without the `So the interface must:` fields); the pictures of every letter at her width, each by its path. Pictures only. | The readers' list, and: `02-intent.md` and every other file of the package; her profession's profile itself; the pages and the letters' files of the board | brief, person, profile-traits, pictures · intent, package, profile, describers-brief, maker-notes, author-map, other-ledgers, task-reads (+ what no package holds yet) |

**The blinds, as files.** Handed to a reader, of `04-structure/`: the board folder (a judge), the
pictures in it (an audience). After a graft only: `04/chosen/` and the seat's own earlier ledger (a
judge), the new pictures (an audience). Listed under every reader's "Do not open":
`<package>/work/`, `04/MAP.sealed.json`, `04/PICK.md`, `04/proposals/` (the conductor's four), then
`04/fresh/`, `04/BRIEF.md`, `04/BRIEF-fresh.md`, every file of `04/reads/` but its own, `04/earlier/`.
Never handed to anyone: the map, the pick, the decision page and its data, the project profile.

## Testing

**RED** — after un-`todo`ing `structure` and appending the tests, before any file of the skill
existed: `node --test tests/skills.test.mjs` → 107 tests, 92 pass, **11 fail**, 4 todo. The eleven:
the rule test ("skills/structure/SKILL.md is not written") and the ten new ones (ENOENT).

**GREEN** — `node --test tests/skills.test.mjs` → 107 tests, 103 pass, 0 fail, 4 todo. The four
`todo` are detail, look, handoff, acceptance, untouched.

**Whole suite, once, after the last edit:** `npm test` → 735 tests, 730 pass, 0 fail, 1 skipped (the
existing folder-mode test this file system skips), 4 todo, 200 s. Output pristine: no line outside
the reporter's.

**That the tests can fail:** four mutations, each restored from a copy afterwards — `--endpoint`
added to the describe command (rule test and command test fail); the audience handed
`02-intent.md` (seat test fails); a judge handed `04-structure/` itself (seat test fails); the map
written into `board/` (map test fails).

**The run-through** ("Structure runs as written…", 1.4 s, about 50 runs of the kit's scripts, one at
a time, no browser): a package stamped through Cast; `begin`; the three fixture proposals tagged with
`track` and `engine`; an invalid fourth refused by the merge with nothing written, then moved to
`proposals/left-out/`; the merge (no seed) printing letters and no source; the map beside the board;
each letter rendered in the project's kit; a second merge refused; `open` refused with no pick and
with "a bit of each"; the page built beside the board with the gallery beneath; `await`. Then
`Pick: none` → `reopen intent` → the round moved into `earlier/1` → `validate` prints
`structure: missing-artefact`, `status` still shows the pick's question, `next` prints `intent` →
Intent and Cast stamped again → `begin` → `validate` ok → a merge in the clean folder finds no
proposal. Then a second round to a pick with a graft: redrawn in `chosen/`, board unchanged, `open`
prints the three letters with file, track and engine; the same graft saved as `board/D.json` shuts
`open`; the stamp refuses a `CHOSEN.md` built from the cast alone, and takes the built-from and the
carry list the skill gives; `validate` ok, `next` → `detail`, the rejected round whole in `earlier/1`.

## Self-review

Completeness: the brief's nine steps map to steps 3–9 and the Gate (1→3, 2→4, 3→5, 4→6+7, 5→8, 6→9,
7→Gate, 8→Gate + `rounds.md`, 9→Gate); both stops are in bold and each ends on one question. Read as
the session that arrives with only the package: at step 4 it cannot go on (no seat is started in a
step before it, and a resuming session is sent back to step 4 until `CHOSEN.md` holds his yes); at the
Gate it writes nothing until he has spoken. It never mends (step 6, the graft, the render's refusal),
never shortlists (every letter is an option), never names a maker before "Not chosen".

### Concerns — things the controller should rule on

1. **After a rejected round, `status` keeps showing the pick's question.** `state.mjs` has no verb
   that closes a stage's open question short of stamping it: `reopen` of Intent closes only the
   questions of the reopened stage and of stages it turns stale, and Structure, never stamped, is
   neither; `begin` leaves the question too (I checked both by hand, and the run-through holds the
   first). The conductor's "Resuming" step 3 says an open question is put to the founder again. So a
   session that resumes while Intent is being redone would ask "which structure…" with no board to
   show. `rounds.md` step 5 tells the session to say so and not to put it again, and SKILL.md step 1
   begins such a stage again instead of going to the Gate, but the real mend is in `state.mjs` or in
   the conductor, which I may not edit. The stale question goes when the reopened stage awaits.
2. **Where the pictures are.** The task brief and the sample `templates/outputs/decision.json` (and
   `page.mjs`'s hint) say `shots/A-390-light.png`. The conductor's blind.md and ruling 2 put the
   pictures in the board, so the skill writes `board/A-390-light.png`. The template's sample now reads
   differently from the skill; I changed neither.
3. **`built-from` of `CHOSEN.md`.** The template's comment gives `[cast@1, intent@1]` as its example.
   The skill says `[cast@1, intent@1, context@1]`: Cast's carry list holds `context@…` lines, Detail
   needs them (the inventory), and the stamp refuses to carry a section of a stage the output is not
   built from. The run-through holds that refusal.
4. **The traits copy sits in `work/`,** because the loop puts it beside the brief, while blind.md has
   every reader's brief list `work/` under "Do not open". `seats.md` names it as the one file of
   `work/` the audience opens. A tension between two conductor references, not mended here.

### Readings of mine that no brief or ruling spells out

- **His yes to the brief is written under `## Reviewed by the founder` of `CHOSEN.md`,** and no
  `await` is run at the first stop: `await` followed by `begin` would leave the brief's question open
  for the rest of the stage. Resuming at the first stop therefore rests on that section.
- **A screen generator always answers the fresh brief,** fresh pass or not: it is the only brief that
  asks for screens as they came. The gallery is shown only with a fresh pass (§ 24).
- **A graft is redrawn by one fresh `maker.structure-describer`** handed the picked letter's file and
  the named letters' files, by letter. That lifts its card's `never-reads: other-proposals` for
  sealed letter copies after the pick; the kit names no seat for a graft.
- **The re-read after a graft:** a judge is handed `chosen/` and its seat's earlier ledger, as the
  loop's re-read has it. The map is opened only after that re-read, so the session briefs those
  readers while it still does not know who made what.
- **On `Pick: none` the skill does not open the map:** it moves sealed with its round.
- **Names I chose:** `04-structure/proposals/left-out/`, `04-structure/chosen/chosen.json` (not
  `<letter>.json`, so that no one-letter `.json` exists outside the board),
  `04-structure/reads/<seat>.md`, the seats' briefs in `<package>/work/`.
- **The readers' "Do not open" list** is the conductor's four plus `fresh/`, the two briefs, the other
  reads and `earlier/`: a fresh screen as it came would tell a reader where a letter came from.
- **`validate` before the merge:** a skill cannot write the cards' check command (the command rule
  refuses `node --input-type=module -e …`), so step 6 leans on the makers' own check and on the
  merge, which validates every file and writes nothing while one fails.

### Smaller notes

- SKILL.md is at 200 lines exactly: any addition needs a line taken out, or moved to a reference.
- The tests are 611 lines for a 200-line skill, in the style of the file's earlier sections.
- Not read: the plan file, and nothing of the design beyond § 4.4, § 12 and § 24.

---

# Fix report — round 1

Status: **DONE** · two commits on `v2-pipeline`, nothing pushed, nothing amended.

- `f82a4b0` fix: a reopened stage closes the questions that rested on it
- `371e3fd` fix: Structure's recommendation rests on the reads, and smaller findings

Files after the round: `skills/structure/SKILL.md` 200 lines (still the limit, exactly),
`references/seats.md` 162, `references/rounds.md` 124.

## I1 — ruling R141, in the script (`f82a4b0`)

`scripts/lib/state.mjs`:

- `reopen <stage>` now takes **every later stage whose status is `awaiting`** back in work — status
  `in-work`, `since` the day of the reopening, its header back to `draft` when its output can be read
  (exactly what `begin` does, through one shared function, `backInWork`) — and closes the open question
  when it belongs to one of them. A later stage the cascade marks stale is stale, as before, and its
  question is closed, as before. An earlier stage that is awaiting, and a later one in work or not
  started, are left alone.
- `begin <stage>` closes the open question of its own stage, and no other.
- `reopen`'s return value and the CLI's line (`reopened … at version n; stale: …`) are unchanged.
- `scripts/state.mjs`: the two usage lines for `begin` and `reopen` say so. No other script touched.

Test-first, in `tests/state.test.mjs` — RED 5 failing, then GREEN 102 of 102:

| Test | What it holds |
|---|---|
| "reopen closes the open question of the reopened stage, of a stage it marks stale, and of a later stage that was awaiting" | The old test, its first block reversed as R141 asks: an awaiting cast never stamped loses its question. Its two other blocks are unchanged. |
| "reopen takes a later stage out of awaiting…" (new) | Structure awaiting, Intent reopened: in work since the day, header draft, body untouched, no question in `status`; `next`, the stale cast and the reopened stage as before; with its output moved away `validate` reports only the stale cast. |
| "reopen takes out of awaiting every later stage that was, and only those…" (new) | Two later stages awaiting both go back; an earlier awaiting stage keeps its status and its question; a later stage in work keeps its `since`; one whose output cannot be read or is gone goes back with the file left as it is. |
| "begin closes the open question of its own stage and leaves another stage's" (new) | And asked again, the question is the new one. |
| "the CLI begin and await…" | One more step: `begin` after `await` leaves no question. |

One existing test needed its steps reordered, not weakened: "validate: a stage awaiting, approved or
stale without its output is missing-artefact…" built its awaiting stage by reopening an earlier one
after the `await`, which is exactly what R141 changes. The reopening now comes first; its assertions
are the same four statuses and the same three codes.

**Hand mutations of the changed conditions** — each applied to `scripts/lib/state.mjs`, the state
tests run, the file restored (`cmp` against the copy):

| Mutation | Failing tests |
|---|---|
| every later stage not approved, not only the awaiting | 8 |
| not-started stages too | 2 |
| earlier stages too (`STAGES` in place of the slice) | 1 |
| the next stage skipped (`+ 2`) | 1 |
| the recalled stage's question not closed | 3 |
| the recalled stage not put back in work | 2 |
| `begin` does not close its question | 2 |
| `begin` closes any stage's question | 1 |
| the header not put back to draft | 3 |
| `since` not set | 7 |

So that this commit is green by itself, it also carries the three assertions of the Structure
run-through that depend on the script: after the reopening `validate` prints only the stale cast,
`status` shows "None." and Structure `in-work`.

## I1 in the skill, and M1–M10 (`371e3fd`)

| Finding | What changed | Test |
|---|---|---|
| I1 | SKILL step 1: after a rejected round Structure "starts clean from step 2, and only once `next` prints `structure`"; no awaiting stage is begun again any more, because none is left awaiting. `rounds.md` § rejected: step 3 says the reopening closes the pick's question; step 5 is now "go to the stage the state names, and leave Structure alone until it names Structure" (the script would let you begin it; a brief written then is written from what he rejected); step 6 opens "When `next` prints `structure`". | "rounds.md…"; the run-through |
| M1 | Step 9: "The recommendation rests on the reads, by letter, and its one sentence of reason names the seats it rests on: never what you think of a letter, or know of its maker." Never: "Your one recommendation rests on the reads alone." | "the decision is one page…" (with the conductor's two sentences it rests on) |
| M2 | `rounds.md` § graft, step 3: each re-read writes `reads/<seat>-reread.md`, beside the first read and never over it; its "Do not open" adds `decision.html` and `decision.json`. | "rounds.md…" |
| M3 | `<name>` is the seat's line on the cast sheet, made unique (`describer-fewest-steps`, `describer-guided`, `outside-openai`, `fresh-generator`): SKILL step 5 and `seats.md` § makers, which says why (it is what the opened map prints). | "makers start in one message…"; "a judge is handed…" |
| M4 | `built-from: [cast@<version>, intent@<version>, context@<version>]` and `- cast@<version>#<slug>`; "Writes" says `<version>` is what `state.mjs status` prints, and that after a rejected round it is not 1. | "it reads the cast sheet…" (no file holds `stage@digit`); the run-through reads the versions from `status`: `[cast@1, intent@1, context@1]` in the first round, `[cast@2, intent@2, context@1]` in the second |
| M5 | One truth in both: step 6 gives each file two keys "unless the outside script has written it already", and `seats.md` says "of the two keys of step 6 you add `track` alone"; the one describe fence takes `--brief <package>/04-structure/<brief>`, and both files say `<brief>` is `BRIEF.md` or, for a fresh-pass line, `BRIEF-fresh.md`. | "makers start in one message…"; "every command…" |
| M6 | Never: "…or start a browser other than through the kit's scripts." | "makers start in one message…" |
| M7 | `seats.md`: the project's kit is `<kit dir>`; no file writes `<packages>/kit`. | "a judge is handed…" |
| M8 | The carry list has a `- source:` line "for the picture of each mark he made in the fresh gallery"; the `DECISIONS.md` entry appended at the stamp holds his marks as he said them. | "it reads the cast sheet…"; the run-through stamps with that line |
| M9 | `rounds.md`, new section "A fresh pass he asks for at the decision page": his asking recorded under `## Reviewed by the founder` with the makers it runs with and no engine turned on; the stage put back in work with `begin`, which closes the pick's question; the fresh brief written and shown at its stop; the fresh makers, the transcribers, the tags; the board made again within the round; only then the pick. The Gate points to it. "A board made again" also says to `begin` again when the page was already in front of him. | "rounds.md…"; the run-through (`begin` closes the question, the merge refuses while the old map lies beside the board, board, map and decision page move into `earlier/2`, the board is made and shown again) |
| M10 | The readers' list in `seats.md` adds `<package>/03-cast.md`, `<package>/04-structure/CHOSEN.md` and, when a continuity maker is cast, today's screen, for every reader but a judge whose card reads `current-screens`; SKILL step 8 names all three and points to the whole list. | "a judge is handed…" (and that `judge.usability` is the one such card) |

To stay at 200 lines, SKILL.md gave up to the references: the full "Do not open" list with its paths
(now in `seats.md` only; step 8 names its entries in short), what follows each kind of outside answer
(`seats.md`, which already had the long form), and the heading-by-heading fill of `CHOSEN.md` (now
"as its template says", with the two sections the template cannot know about spelled out). Two
sentences went: "From here on an option is its letter…" (M1's sentence and the Never line say it) and
"A board is never merged twice" in step 1 (the Never line says it).

## Testing

- **RED:** state tests 5 failing before the script changed; skills tests 8 failing with the new
  assertions against the old skill text.
- **GREEN:** `node --test tests/state.test.mjs` 102 pass; `node --test tests/skills.test.mjs` 103
  pass, 4 todo.
- **Whole suite, once, after the last edit:** `npm test` → 738 tests, 733 pass, 0 fail, 1 skipped (the
  existing file-system one), 4 todo, 204 s. Output pristine.

## Left to say

- **My reading of M10's last clause:** today's screen is listed only when a continuity maker is cast,
  and then for every reader except a judge whose card reads `current-screens`. If the other reading
  was meant (listed always, the exemption only with a continuity maker), it is one sentence of
  `seats.md` and one of step 8.
- **Ruling 14 is overtaken by R141 in one detail:** `validate` no longer reports Structure's artefact
  missing after a rejected round, because Structure is in work, not awaiting. `rounds.md` and the
  run-through say what the state now shows.
- **The conductor still describes `reopen`** only as turning later stamped outputs stale
  (`skills/design/SKILL.md`, "Resuming"). That stays true; it does not yet say that a later awaiting
  stage goes back in work. Not mine to edit.
- **Concern 1 of the first report is closed** by the script. Concerns 2–4 stand as reported.

---

# Fix report — after the re-review

Status: **DONE** · one commit on `v2-pipeline`, nothing pushed, nothing amended.

- `b578460` fix: three wordings in Structure, and reopen in the conductor's words

| # | Point | What changed | Test |
|---|---|---|---|
| 1 | Resuming in work could pass over a fresh brief's stop | `skills/structure/SKILL.md` step 1: "In work, it goes on from the first step with a file missing: step 4, until `CHOSEN.md` holds his yes to every brief in the folder." | "structure: two stops…" |
| 2 | Today's screen: the reason argued against its own exception | `references/seats.md`: the exception is dropped. "It is listed for every reader. The usability judge's card reads `current-screens`, but at Context: at Structure it is handed the options and nothing of today." SKILL step 8 already named no exception. | "a judge is handed the board folder…": no "every reader but" in the list; the card's own lines for Context and for Structure; the usability judge's hand-over holds nothing of today |
| 3 | The clean start said two ways | Both now say "Structure starts clean, from step 1": SKILL step 1 (it is the step that begins), `rounds.md` § rejected step 6 ("from step 1 of the skill", unchanged). SKILL's "from step 2" is gone. | "rounds.md…": the phrase is in both |
| 4 | The conductor's `reopen` bullet | `skills/design/SKILL.md`, "Resuming": one sentence added, "A later stage that was awaiting him goes back in work, its question closed." 189 lines. No existing pin held those words, so none changed; one pin added on the whole bullet, beside the script's own usage line. | "rounds.md…" |

`skills/structure/SKILL.md` is still 200 lines: point 1 fitted by saying "holds only `earlier/`" and
"with a file missing" in the same three lines.

**Testing:** `node --test tests/skills.test.mjs` → 107 tests, 103 pass, 0 fail, 4 todo, as asked
(the whole suite was not run again: no script changed).

**Choice made in point 2:** of the two the review offered, I dropped the exception rather than
defending it. The usability card reads today's interface at Context only; at Structure its own text
has it read "each option your brief hands you, by its letter", so nothing it needs is closed to it,
and the blind has one rule with no carve-out.
