# Task 2 report: the state of a package

**Status:** DONE_WITH_CONCERNS. The concerns are about later tasks and the brief's scope, not defects;
see the end of this report.
**Commit:** `1a1117f feat: package state — routes, stamping, reopening, validation` on `v2-pipeline`
(parent `36d8dda`). Three files, staged by explicit path. Not pushed, not amended.

## What I implemented

### `scripts/lib/state.mjs` (409 lines): all the logic

Exports exactly as the brief names them:
- the constants: `STAGES`, `ARTEFACT`, `SIZES`, `FOUNDATIONS`, `KINDS`;
- the functions: `routeFor`, `init`, `stamp`, `reopen`, `resize`, `validate`, `next`;
- the error class: `StateError`.

It adds **one** export, `status(pkgDir)`, which returns STATE.md as generated from `state.json`. The CLI's
`status` verb needs it, and the CLI may hold no logic.

**Routes (§ 5)**
- `routeFor(size)` gives one entry per stage, in stage order.
- `correction`: frame, detail, handoff and acceptance are `short`; every other stage is `skipped`.
- `adjustment`: frame is `full`, structure is `skipped`, every other stage is `short`.
- `surface`, `flow` and `system`: every stage is `full`.
- An unknown size is refused.

**init**
- Refuses when the folder already has a `state.json`. Creates the folder if it is missing.
- Refuses a blank design, a kind that is not kebab-case, an unknown foundation or size, and a date that
  is not a real day written `YYYY-MM-DD`.
- Every stage starts with `{ status: not-started | skipped, version: 1, approved: null, words: null, hash: null }`.
- Each skipped stage gets a reason: `reasons[stage] = "skipped by the <size> route"`.
- `question` starts as `null`.
- It writes `state.json` and `STATE.md`.

**stamp**
- Refuses:
  - empty words (also after line breaks are collapsed);
  - an unknown stage;
  - a stage the route skips;
  - a stage that is already approved (the message says to reopen it);
  - a missing output;
  - a header that cannot be parsed;
  - a header that does not match: the stage, the version in the state, a status of
    `draft|awaiting|approved`, and a `built-from` list whose entries are `stage@version` naming earlier
    stages;
  - an input that is not the current, approved version of its stage. A version mismatch reads
    "… a stale input …", so it matches `/stale/`;
  - a carry list that breaks the rules (below).
- When there are several problems, the error lists them all, one per line.
- On success, it rewrites the header with `status: approved`, `approved: <date>` and `words`. Key order
  is stage, version, status, approved, words, built-from, then any other keys. The body is untouched,
  and the file is written with LF.
- It records `{ approved, version, date, words, hash }`. The hash is the SHA-256 of the body exactly as
  `parse` returns it (Ruling R19).
- It returns `{ version }`.

**Carry lists**
- The list is everything after the last `## Carry` heading.
- It is required for frame through look, and optional for handoff and acceptance.
- Every non-blank line under the heading must be an entry. A heading after `## Carry` gets "must be the
  last section"; any other line gets "is not a carry entry".
- `- source:<path>` is accepted without resolving. A space after the colon is allowed.
- `- <stage>@<version>#<slug>` must name this stage or an earlier one:
  - **This stage:** only at the version being stamped.
  - **An earlier stage:** that stage must be approved at that version. If not, the code is
    `stale-input`.
  - In both cases its output must have a heading with that slug. If not, the code is
    `carry-unresolved`.
- **Slug:** lower-cased, NFC-normalised, every run of characters that are not Unicode letters or digits
  replaced by `-`, then trimmed. So `## Qué puede mostrar, hoy` becomes `qué-puede-mostrar-hoy`, and
  `## The founder's own words` becomes `the-founder-s-own-words`. The entry's slug is NFC-normalised
  too, so an entry typed in NFD (macOS) still resolves.

**reopen**
- Refuses a blank reason and a bad date. Only an `approved` or `stale` stage can be reopened.
- The stage moves to version + 1 and `in-work`, with `approved`, `words` and `hash` set to `null`.
- Its header is rewritten to the new version, `status: draft`, `approved: ""`, `words: ""`.
- It records `reasons[stage] = "reopened on <date>: <reason>"`.
- Later stages are marked `stale`, **transitively**: any begun later stage (not `not-started` and not
  `skipped`) whose `built-from` names an old version of the reopened stage, or names a stage this
  reopen has just marked stale.
- It returns `{ version, stale }`, with `stale` in stage order.

**resize**
- Refuses a move down with `/only moves up/`.
- Moving up only un-skips stages: they become `not-started` and lose their skip reason.
- Stages already run are left as they are.

**next**
- Returns the first stage that is neither approved nor skipped, or `null`.

**validate**
- Looks only at stages that have begun (in-work, awaiting, approved, stale), plus the reasons of skipped
  stages. The file of a stage that has not started (for example a template copied in) is not looked at.
- Every problem code exists:
  - `missing-artefact`
  - `bad-header`: the header cannot be parsed; it does not match the stage or the state; the header
    says approved but the stage was never stamped, or the reverse; an approved stage has no approval
    date
  - `stale-input`: a stage marked stale (reported once); an input or carry entry at another version or
    not approved
  - `carry-unresolved`
  - `changed-since-approval`: the body hash differs from the stamped hash
  - `skip-without-reason`
  - `approved-without-words`: the header or the state has no words

**Files and line endings**
- `state.json` is read with or without a byte-order mark and with CRLF. It is refused when it is not
  valid JSON or is damaged (a missing stage, an unknown size).
- Artefacts are read with CRLF and a byte-order mark accepted, via `parse`.
- Every file the library writes is LF.

**STATE.md**
- A line saying it is generated and never edited by hand.
- The design, kind, foundation, size and start date.
- One row per stage: stage, route, status, version, approved, the artefact's path in backticks, and a
  note (the reason). Cells escape `|`.
- `## Open question`, or `None.`

### `scripts/state.mjs` (135 lines): the CLI

- `node scripts/state.mjs <verb> <package> [stage] [flags]`. The stage is a positional argument after
  the package, for `stamp` and `reopen` only.
- The flags are the brief's seven, written `--flag value` or `--flag=value`. `--date` defaults to
  today's local date.
- `--help` or `-h` prints the usage, which says that each line break in `--words`, `--reason` or
  `--design` becomes a single space.
- Usage errors exit 2, with a message and the usage text: an unknown verb or flag, a flag that does not
  apply to the verb, a flag given twice or without a value, a missing required flag, the wrong number
  of positional arguments.
- A `StateError` exits 1, with its message on stderr.
- `validate` prints `ok`, or one line per problem: `<stage>: <code>: <message>`. A problem found exits 1.
- `next` prints the stage, or `none`.
- `status` prints STATE.md.

## Tests and results

`tests/state.test.mjs` has 44 tests. Every row of the brief's table is covered:

| Brief row | Test |
|---|---|
| `routeFor` ×3 | `routeFor('correction')…`, `routeFor('adjustment')…`, `routeFor('surface'), 'flow' and 'system'…` |
| `init` | `init writes state.json and STATE.md; skipped stages … a second init throws` |
| `init` with kind | `init accepts any kebab-case kind and refuses one that is not` |
| `stamp` on a draft | `stamp approves a draft: … 64-character hash` |
| `stamp` with empty words | `stamp refuses empty words` |
| no `## Carry` | `stamp without "## Carry" throws for frame to look, and not for handoff and acceptance` |
| stale `built-from` | `stamp of intent built from context@1 while context is at version 2 throws as stale` |
| `reopen('context')` | `reopen(context) after frame, context and intent are approved…` |
| `resize` | `resize: the size only moves up; adjustment to flow un-skips structure` |
| `validate` clean | `validate on a clean package: ok, no problems` |
| `carry-unresolved` | `validate: a carry entry naming context@1#no-such-heading is carry-unresolved` |
| `changed-since-approval` | `validate: an approved artefact's body changed on disk…` (one direction of Ruling R19) |
| CRLF | `validate: artefacts and state written with CRLF give the same result as with LF` (the other direction of R19: an approved package converted wholesale to CRLF stays `ok: true`) |
| `source:` entry | `validate accepts a source: carry entry without resolving it` |
| `next` | `next: intent once frame and context are approved; null once every routed stage is approved` |

The other tests:
- one for every refusal: unknown size, foundation, blank design, bad date, an input not approved,
  unknown, skipped or approved stage, missing output, seven bad-header variants, eight carry variants,
  blank reason, reopening a stage that is not approved, no `state.json`, invalid or damaged
  `state.json`;
- one for every remaining problem code;
- one each for:
  - words collapsed to one line;
  - a CRLF artefact stamped and written back as LF;
  - carry entries that resolve (self-reference, punctuation, accents in NFC and NFD);
  - transitive stale marking that leaves unrelated stages alone;
  - a `state.json` with a byte-order mark;
  - the content of STATE.md and its regeneration from `state.json`;
- five CLI tests that spawn the script: a full run with exit 0, `none`, exit 1, exit 2 for twelve usage
  errors each with its own message, and `--help`.

Each test builds its package in its own fresh folder under one `mkdtemp` directory in `tests/.tmp/`,
which is removed in `after()`. `tests/.tmp/` is empty after a run. The output contains only TAP.

**Mutation check.**
- **How:** a scratch script commented out each refusal, problem, `continue` and exit-code line, one at
  a time, in a copy of the code, and ran the focused suite each time.
- **First pass:** 12 survivors. I fixed them:
  - reopen's and resize's guards had no test where they mattered. The tests now put an unrelated
    approved stage and a not-started draft next to the reopened one, and approve a stage before
    `resize`.
  - The "no `## Carry`" pattern was too loose. It is now `/has no "## Carry" section/`.
  - The `continue`s after a carry problem only stop a second, misleading message, and no test counted
    messages. `stamp` now lists one problem per line, and the carry tests assert exactly one.
  - A carry entry whose earlier output cannot be read had no test. I added one.
  - The CLI usage errors were all checked only for exit code 2. Each now asserts its own message.
- **Final pass:** 74 killed, 0 survived. One site (line 198, a multi-line call) cannot be commented out
  without a syntax error. I mutated its condition by hand in both directions, and both were killed.

## TDD evidence

**RED**
- `node --test tests/state.test.mjs`, with the test file written and no library:
  `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/scripts/lib/state.mjs'`, giving `# tests 1 # pass 0 # fail 1`.
  This was expected: nothing implemented yet.
- After the library, before the CLI: `# tests 43 # pass 38 # fail 5`. The five failures were the CLI
  tests: `scripts/state.mjs` did not exist yet. Expected.
- The NFC fix: with `wanted.normalize('NFC')` removed, `not ok 19 - stamp accepts carry entries that
  resolve: … accents in either normal form`. With it, the test passes.

**GREEN**
- `node --test tests/state.test.mjs` gives `# tests 44 # pass 44 # fail 0`.
- `npm test` gives `# tests 78 # pass 78 # fail 0 # cancelled 0 # skipped 0 # todo 0`. That is 44 here,
  plus the frontmatter and skeleton suites.

**Gates.** The three files hold no CR characters. The demo run of the CLI behaved as designed:
- `init`: exit 0;
- `stamp` without `## Carry`: exit 1;
- `stamp` with a two-line `--words`: written as one line;
- `next`: printed `context`;
- `validate`: `ok`, exit 0; after a body edit, `changed-since-approval`, exit 1;
- `resize` down: exit 1; an unknown verb: exit 2;
- `status`: printed the table.

## Files changed

- `scripts/lib/state.mjs` (new)
- `scripts/state.mjs` (new)
- `tests/state.test.mjs` (new)

## Self-review: the judgment calls the brief left open

1. **The added export `status(pkgDir)`.** The CLI verb `status` needs it, and the CLI must not hold logic.
2. **The added `state.json` key `started`.** `init` takes a `date`, but the schema has no field for it.
   I store it as `started` and show it in STATE.md. Readers of the brief's schema are unaffected.
3. **What `reasons` means.** It is `{ <stage>: string }`, saying why a stage is skipped or why it was
   reopened. `skip-without-reason` checks it, and STATE.md's Note column shows it. A reopen reason stays
   after the stage is approved again, as history.
4. **The CLI's stage argument.** The brief's flags have no `--stage`, so the stage is a positional
   argument: `stamp <package> <stage> --words …` and `reopen <package> <stage> --reason …`. `resize`
   uses `--size`, as the flag list implies. The usage text documents this.
5. **Line breaks are collapsed in the library**, not only in the CLI. This covers `words`, `reason` and
   `design`, so a library caller cannot make `serialize` throw.
6. **Re-confirming a stale stage.** `stamp` allows a stage whose status is `stale`, once its
   `built-from` names current versions. The version stays the same. Redoing it with a new version means
   `reopen`, which is allowed on stale stages and marks its own dependants stale.
7. **Stale marking follows `built-from` only**, transitively. Carry entries pointing at an old version
   are still caught by `validate` as `stale-input`.
8. **Carry is strict.** Every non-blank line under `## Carry` must be an entry.
9. **Unicode slugs.** "Non-alphanumerics" is read as anything that is not a Unicode letter or digit, so
   Spanish headings keep their accents. An ASCII reading would turn `Qué` into `qu`.

## Concerns, for the controller

- **No verb moves a stage to `in-work` or `awaiting`** (only `reopen` sets `in-work`), and **none sets
  `question`.**
  - STATE.md will show `not-started` until a stage is stamped, and `None.` for the open question.
  - § 6 lists "awaiting the founder" and "the one open question" as things STATE.md shows. If the
    conductor (Task 13) needs them, the brief needs a verb for them. I did not add one.
- **For Task 12's templates and package walk:**
  - A template must write `built-from: []`. A blank `built-from:` reads as `""` and is a bad header.
  - The `## Carry` section may hold only entries when it is stamped. A `{instruction in braces}` line
    left under the heading is refused, so the instruction belongs above the heading, or the walk must
    replace the section's content rather than append to it.
  - `validate` ignores not-started stages, so templates copied in for later stages do not break
    `ok: true`.
- **44 tests, not the plan's 17.** All 17 rows are present. The rest pin refusals and the CLI.
- **The library is 409 lines.** It still reads as one file, with sections for routes, verbs, shared
  checks, files and arguments. I did not split it.

---

# Fix report: the controller's ruling on concern 1 (`begin` and `await`)

**Commit:** `0e9ead6 feat: state can mark a stage in work or awaiting the founder, with the open question`
on `v2-pipeline` (parent `1a1117f`). Three files, staged by explicit path. One new commit; not pushed,
not amended.

## What changed

### Library (`scripts/lib/state.mjs`)

**`begin(pkgDir, stage, { date })`**
- Sets the stage's status to `in-work` and regenerates STATE.md.
- Refuses an unknown stage, a bad date, a `skipped` stage ("…skipped by the <size> route; resize to run
  it") and an `approved` stage ("…already approved at version N; reopen it to change it").
- `stale`, `awaiting`, `in-work` and `not-started` may begin.
- Never touches the artefact, which may not exist yet.
- `date` is validated like every other verb's, but not stored: the schema has no field for it.

**`awaitFounder(pkgDir, stage, { question, date })`**
- Refuses, in this order:
  1. an unknown stage;
  2. an empty question (also after line breaks are collapsed);
  3. a bad date;
  4. a `skipped` or `approved` stage;
  5. a missing artefact or one whose header cannot be parsed;
  6. a header that fails the same `headerProblems` check `stamp` uses: the stage matches, the version
     matches the state, the status is valid, the `built-from` list is well formed.
- On success:
  - the header's `status` becomes `awaiting`; the body is untouched;
  - the stage becomes `awaiting` in `state.json`;
  - `question` is stored on one line, the same collapse as `--words`;
  - `questionStage` records which stage the question belongs to;
  - STATE.md is regenerated.
- There is one open question, so a later `await` replaces it.

**Changes to existing behaviour**
- **The skipped/approved refusals** are now one helper, `requireOpen`, called by `begin`,
  `awaitFounder` and `stamp`. The messages are unchanged.
- **`stamp`** clears `question` and `questionStage` (to `null`) only when `questionStage` is the stage
  being stamped.
- **`reopen`** clears them only when `questionStage` is the reopened stage or one of the stages it
  marked stale. Otherwise it leaves them alone.
- **`init`** now writes `questionStage: null` beside `question: null`.
- **STATE.md's open question** reads `## Open question` → `<stage>: <question>`, or `None.`. A question
  without a stage (a hand edit) is shown alone.
- **Unchanged:** `validate` and `next`. A stage that is in work or awaiting is still the next stage.
- **Housekeeping:** the regex that strips a byte-order mark from `state.json` held a raw U+FEFF
  character, left over from the first commit. It is now the `﻿` escape. The test file had the same
  raw character, now escaped too. Behaviour is unchanged, and the byte-order-mark test still passes.

### CLI (`scripts/state.mjs`)

- New verbs:
  - `begin <package> <stage> [--date]`, printing `<stage> is in work`;
  - `await <package> <stage> --question "<the one question>" [--date]`, printing `<stage> awaits the founder`.
- New flag: `--question`.
- The usage text lists both verbs. Its one-line rule now reads "--words, --question, --reason and
  --design are kept on one line: each line break in them becomes a single space".
- `stamp`'s help line says it closes its stage's open question.

## Tests (`tests/state.test.mjs`): 54, up from 44

New tests:

| Ruling's test | Test |
|---|---|
| begin sets in-work, STATE.md shows it | `begin sets a stage in work and STATE.md shows it; its output need not exist yet` |
| (stale/awaiting/in-work may begin) | `begin takes a stage that is awaiting, in work or stale, and leaves its output alone` |
| begin refuses skipped and approved | `begin refuses a stage the route skips and a stage already approved` (plus an unknown stage) |
| await sets header + state, stores the question | `await sets the header and state.json to awaiting and stores the question with its stage` |
| multi-line question on one line | `await stores a multi-line question on one line` |
| await refusals | `await refuses an empty question, an unknown, skipped or approved stage, a missing output and a bad header` (bad header: a wrong stage, and an unparseable header) |
| STATE.md shows question and stage | `STATE.md shows the open question and the stage it belongs to` |
| stamp clears only its own stage's question | `stamp clears the open question of its own stage and leaves another stage's` |
| (reopen's rule) | `reopen clears the open question only when it belongs to the reopened stage or one it marks stale`: three cases. The last writes the state by hand, because no verb can leave a question on an approved stage. |
| CLI 0 / 1 / 2 | `the CLI begin and await: 0 on success, 1 on a refusal, 2 on missing arguments` |

Changed tests:
- The date test now also covers `begin` and `await`.
- The `--help` test checks `begin`, `await`, `--question` and the new one-line sentence.
- The old STATE.md test no longer sets a question by hand; the question has its own test now.

**Mutation check.**
- The pattern was widened to the new call sites: the `requireOpen`, `requireDate` and `requireStage`
  calls, `closeQuestion`, the `Object.assign` question writes, and the status assignments.
- **First pass:** 96 killed, 1 survived. The survivor was `requireStage` in `awaitFounder`, which had no
  unknown-stage case. I added one, and that mutant is now killed.
- **Syntax sites:** five. Four are the helper *declarations* the wider pattern now matches, which are
  not refusals. The fifth is the multi-line `add('bad-header', …)` call, unchanged since its condition
  was hand-mutated in both directions in the first round.

## Commands and output

```
$ node --test tests/state.test.mjs          (RED, tests written first)
# SyntaxError: The requested module '../scripts/lib/state.mjs' does not provide an export named 'awaitFounder'
# tests 1  # pass 0  # fail 1

$ node --test tests/state.test.mjs          (library done, CLI not yet)
not ok 50 - the CLI begin and await: 0 on success, 1 on a refusal, 2 on missing arguments
not ok 54 - the CLI --help names every verb and flag, …
# tests 54  # pass 52  # fail 2

$ node --test tests/state.test.mjs          (GREEN)
# tests 54  # pass 54  # fail 0

$ npm test
# tests 88  # pass 88  # fail 0  # cancelled 0  # skipped 0  # todo 0
```

The output holds only TAP, and `tests/.tmp/` is empty afterwards. The three files hold no CR, no
U+FEFF and no U+2028/2029.

A demo of the CLI on a scratch package:
- `begin frame` printed `frame is in work`, exit 0.
- `await frame` with a two-line `--question` printed `frame awaits the founder`, exit 0. STATE.md showed
  `| frame | full | awaiting | 1 | — | \`00-frame.md\` | — |` and, under the open question,
  `frame: Is the job right, or is it two jobs?`.
- `begin structure` was refused, exit 1.
- `await frame` without `--question` printed `await needs --question` and the usage, exit 2.
- `stamp frame` brought the open question back to `None.`

## Size

- The library is **455 lines**, under the ruling's mark of about 500. The CLI is 151 lines.
- If it is split later, the seam is between the verbs and the carry list. `carryProblems`, `slug` and
  the heading regexes (about 60 lines, with no state of their own beyond `staleness`) would become
  `scripts/lib/carry.mjs`. The verbs, the files and STATE.md would stay in `state.mjs`.

## Notes, no action taken

- `begin` does not clear an open question. When the founder sends an awaiting stage back to work, its
  question stays in STATE.md until a new `await` replaces it, or a `stamp` or `reopen` of that stage
  clears it. The ruling names only `stamp` and `reopen` as the verbs that clear it.

---

# Fix round 1: the review's I1–I3, the controller's G1–G5, M1–M8

**Commit:** `c96e1dd fix: state records what was stamped, enforces the previous stage, and can re-route a stage`
on `v2-pipeline` (parent `0e9ead6`). One new commit; four files staged by explicit path; not pushed, not
amended.

**Files**
- `scripts/lib/state.mjs`: 530 lines.
- `scripts/lib/carry.mjs`: 59 lines, new.
- `scripts/state.mjs`: 169 lines.
- `tests/state.test.mjs`: 82 tests.

**The split (as ruled).** With the carry-list checks inline the library would have been about 570 lines,
so they moved to `scripts/lib/carry.mjs`:
- `carry.mjs` holds `slug` and `carryProblems(body, context)`, and reads text only.
- `state.mjs` passes a `context`: the stage, its file, whether a carry list is required, `earlier(stage)`,
  the stages in `built-from`, and `earlierBody(stage, version)`. The last checks staleness and reads the
  earlier output.
- `carry.mjs` does not import `state.mjs`, so there is no import cycle.
- Tests still import from `scripts/lib/state.mjs`, which re-exports `slug`.

## What changed, per item

**I1: a header edited by hand.**
- **`stamp` records more.** It now stores `builtFrom` (the header's `built-from` list) in the stage
  entry, beside `approved`, `words`, `version` and `hash`.
- **`validate` compares the header with the record.** For an approved stage it reports one
  `changed-since-approval` naming each differing field: "the header's words, version changed after
  intent was stamped on …". The fields are `words`, `approved`, `version` and `built-from`. The body
  hash check is unchanged.
- **Version is reported twice.** A version edit is also still `bad-header` (header against state); both
  are reported.
- **`reopen` reads the record.** It decides what turns stale from the recorded `builtFrom` of each later
  stage, never from the files. A later stage whose file is missing or unreadable is therefore still
  marked stale. A stage that was never stamped has nothing on record and is not marked; its draft is
  still caught by `stamp`'s and `validate`'s input checks.
- **Covering tests:**
  - one per edited field, each asserting the field is named;
  - the reviewer's sequence: `built-from` emptied by hand is reported as changed, then reopening context
    still marks intent stale, along with cast (file deleted) and structure (header unreadable);
  - a later stage not on record is left alone;
  - a stage on record that is skipped or not started is not marked.

**I2: missing output for a stage in work.** `validate` no longer reports `missing-artefact` for an
`in-work` stage. It still does for `awaiting`, `approved` and `stale`. One test puts a stage in each of
the four states, deletes their files, and asserts exactly three problems.

**I3: five untested refusals.** Each now has a test:
- `reopen` of an output that is missing, and of one that cannot be parsed;
- `load` with an unknown size;
- `load` with a non-integer version (1.5);
- a `built-from` entry naming an unknown stage (`review@1`), in both the stamp and the validate tables;
- a month-13 date, which used to escape as a `RangeError`.

**G1: the cast in STATE.md.** STATE.md has a cast line that points at `03-cast.md`; it does not copy it:
- `- Cast: \`03-cast.md\` — approved, version 1` (likewise `in-work` and the others);
- `- Cast: not chosen yet`;
- `- Cast: skipped by the route — <reason>`, or `— no reason given`.

Covered by `STATE.md points at the cast…`.

**G2: a stage must name its real inputs.**
- **The stage before it.** `stamp` refuses an output whose `built-from` omits the nearest earlier
  stage that the route does not skip: "it must be built from context, the stage before it on the route:
  add context@1 to built-from". The first routed stage needs none.
- **Carry entries.** A `## Carry` entry that names a stage not in `built-from` is `carry-unresolved` (a
  refusal at stamp).
- **The existing input rule stays:** every entry must be the approved, current version.
- **Consequence: a stage can no longer carry its own sections.** A stage is never in its own
  `built-from`. This also suits § 6, since the next stage reads that whole output anyway. The
  self-reference branch is gone.
- **Tests:**
  - the refusal;
  - adjustment `detail` built from `cast` (structure passed over);
  - intent built from frame once `context` is routed skipped.
- **Existing tests updated:**
  - the helpers build each output from the stage before it on the route;
  - the "no `## Carry`" test approves frame to look in order, then stamps handoff and acceptance
    without a carry list.

**G3: resize re-enters at the larger size.**
- An `approved` stage whose mode changes becomes `stale`, with the reason "resized from <old> to <new>".
- `in-work` and `awaiting` keep their status.
- A stage that was skipped and is now routed becomes `not-started`.
- A stage that stays skipped gets "the <new size> route skips it".
- The question is closed if it belonged to a stage that turned stale.
- Tests: four.

Two edges the ruling does not cover, decided and tested:
- **A resize to the same size is a no-op.** Otherwise it would undo `route` choices.
- **A resize never skips a stage the current route runs.** This is reachable: route `structure` full at
  correction size, then resize to adjustment, which skips structure. The stage keeps its mode, since
  "nothing moves down mid-run".

**G4: re-routing one stage.**
- **Verb:** `setRoute(pkgDir, stage, mode, { reason, date })`, and the CLI verb
  `route <package> <stage> <full|short|skipped> --reason … [--date]`.
- **The reason** is required and kept on one line. It is stored as `<reason> (set <mode> on <date>)`
  and shown in STATE.md.
- **Transitions:**
  - to `skipped`: refused for an approved stage ("reopen it before skipping it") or an awaiting one;
    otherwise the status becomes `skipped`;
  - from skipped to `short` or `full`: `not-started`;
  - between `short` and `full`: an approved stage turns `stale`; routing it to the mode it already has
    is no change.
- `skip-without-reason` still works (tested after a `route`).
- **Not in the ruling:** skipping a stage closes its open question. That can happen for an in-work stage
  that was awaited and then begun again; I applied the rule `stale` already follows.
- **Tests:**
  - each branch;
  - each refusal: unknown mode, blank reason, unknown stage, approved, awaiting, bad date;
  - the CLI's exit codes 0, 1 and 2.

**G5: a redone stale stage gets a new version.**
- When the stage being stamped holds a hash from an earlier approval and the body hash differs, the
  version goes up by one, in the header and the state. An unchanged body keeps the version.
- **The trigger is "has a recorded hash", not "status is `stale`".** The ruled flow for a stale stage is
  begin, then await, then stamp, so at stamp time the status is `awaiting`, and a literal check would
  never fire. M2 keeps the hash, and only stale stages carry one: `reopen` resets it and `begin` refuses
  an approved stage. So the record identifies a stage that went stale since its approval. **Please
  confirm this reading.**
- **Tests:**
  - re-confirmed: version 1 stays;
  - redone: version 2, and the later `cast` built from `intent@1` is refused as stale;
  - stale, then begin, await and stamp with a changed body: version 2.

**M1.** Every file is written to `<file>.<pid>.tmp` in the same folder and renamed over the target. The
temporary file is removed if the rename fails. That covers `state.json`, `STATE.md` and artefacts. Tests
check that no `.tmp` file is left behind, including after a failed write.

**M2.** `awaitFounder` blanks the approval date and the words, in the header (`""`) and in the state
(`null`), as `reopen` does. It keeps the hash and `builtFrom`, which G5 and `reopen` need. Tested.

**M3.** The mismatch message now says what is true: "the header says approved while the state says
in-work", or "… says draft while the state says approved".

**M4.** A not-started stage whose header says `approved` is `bad-header`, with the same wording. A
not-started stage is otherwise still not looked at; tested with an unparseable template.

**M5: unexpected errors and damaged files.**
- **`load` checks the shape of `state.json`:** it is an object; its size is known; `route`, `reasons`
  and `stages` are objects; every stage has a route mode, an entry, a known status, and an integer
  version of at least 1. Each check has its own case.
- **File-system errors** (`EEXIST`, `EISDIR`, …) on the package become `StateError`s naming the path:
  "cannot create the folder …", "cannot read …", "cannot write …".
- **Any other error is rethrown untouched.** The mutation pass showed that the first version wrapped
  everything, turning a bug into "cannot read …: undefined".
- **In the CLI,** a `StateError` prints its message with no stack, and exits 1. A refused `stamp` still
  lists its problems one per line, by design from the first round. An unexpected error prints its stack
  and exits 1. That is tested by a preload that makes `readFileSync` throw a plain `Error`.

**M6: `slug`.** It is exported. `node scripts/state.mjs slug "<heading text>"` prints the slug and exits
0. Tested in the library and the CLI.

**M7: `since`.** `begin` and `awaitFounder` store `since: <date>`. STATE.md has a Since column, filled
only while a stage is in work or awaiting. `stamp` and `reopen` reset `since` to `null`. Tested,
including a stage that went stale while awaiting: its row shows `—` while the state still holds the day.

**M8.** The `—` shown as the version of a stage not begun is now asserted. `state.reasons ??= {}` is
gone: `load` now refuses a `state.json` without a `reasons` object.

**`--help`** describes `route` and `slug`, and adds the new rules to `stamp`, `reopen` and `resize`.

## Tests and commands

```
$ node --test tests/state.test.mjs          (RED: the new tests against 0e9ead6's library, given stub
                                             exports for MODES, setRoute and slug so the file loads)
# tests 79  # pass 34  # fail 45
  (failing: every I1–I3, G1–G5, M1–M8 test, plus the existing tests whose expectations changed)

$ node --test tests/state.test.mjs          (GREEN, final)
# tests 82  # pass 82  # fail 0

$ npm test
# tests 116  # pass 116  # fail 0  # cancelled 0  # skipped 0  # todo 0
```

The output holds only TAP, and `tests/.tmp/` is empty afterwards. The four files hold no CR, no U+FEFF
and no U+2028/2029. The write tool kept turning ` ` and `﻿` escapes into raw characters; each
was converted back by script and checked.

## Mutation pass

**How it works.**
- A new scratch tool (`mutate2.py`) runs six parallel copies of the code and runs the focused suite on
  each mutant. Its operators:
  - statement deletion;
  - every `if` condition forced to true and to false;
  - each top-level operand of `&&`/`||` dropped;
  - the flips `===`↔`!==`, `&&`↔`||`, `??`→`&&`, `<`↔`<=` and `>`↔`>=`;
  - each `!` removed;
  - each element dropped from a `[…].includes` list.
- It skips text inside strings, templates, regexes and comments.

**First pass: 755 mutants.** 692 killed, 42 syntax, 21 survived. Every survivor was resolved:
- **Pinned by a new test** (13 survivors):
  - `StateError`'s `name`;
  - `init` with no kind (the `typeof` half);
  - `built-from` naming the stage itself (`>=`), plus a stage in work whose `built-from` names itself
    (`<` in `inputsOf`);
  - a carry entry whose earlier output is unparseable (the `art.error` half);
  - a header key `stamp` does not know is kept (the `!` in `writeArtefact`);
  - the not-built-from carry case now names a missing heading, so the `continue` is pinned;
  - the CLI's stdout for `init`, `begin`, `await` and `resize`, which also pins the `resize` `break`;
  - `validate` with a problem does not print `ok`;
  - an unexpected error keeps its stack (the CLI's `instanceof` and rethrow).
- **Removed as equivalent code** (5 survivors): two trailing `return null`, the `instanceof
  FrontmatterError` check in `readArtefact` (`parse` refuses only with a `FrontmatterError`), and the
  final `break` of the CLI switch.
- **A real bug the pass exposed:** `io()` wrapped non-file-system errors. It now rethrows them, and the
  preload test pins this.

**Final pass: 752 mutants.** 709 killed, 42 syntax, **1 survived**:
- **The survivor is equivalent.** It is `scripts/state.mjs:44`, the line that closes the `USAGE`
  template literal. "Deleting" it puts `// ` inside the help text, which is otherwise unchanged.
- **The 42 syntax mutants** are all deletions of a block opener or closer (`if (…) {`, `for (…) {`, `};`,
  `]);`), plus the shebang. Every one of those `if`s was also forced true and false and had its operands
  dropped, and all such mutants were killed.

## Interpretations to confirm

1. **G5's trigger** is a hash recorded from an earlier approval, not a literal `stale` status. The
   reason is above.
2. **G2 forbids a stage carrying its own sections**, as a consequence of the carry-in-`built-from` rule.
3. **Resize** treats the same size as a no-op, and never skips a stage the current route runs.
4. **`route … skipped` closes that stage's open question.**
5. **M5 "one line":** a `StateError` prints its message alone, with no stack. A refused `stamp` still
   lists one problem per line.

---

# Fix round 2: B1, B2, m3–m6, and the resize-note ruling

**Commit:** `3b5d385 fix: a new version or a re-routed stage marks what was built on the old route stale`
on `v2-pipeline` (parent `c96e1dd`). One commit; `scripts/lib/state.mjs` and `tests/state.test.mjs`
staged by explicit path; not pushed, not amended. The CLI and `carry.mjs` are unchanged.

**Size.** The library is 569 lines and stays one file for this task, as ruled.

**The conflict, stopped and ruled.** G3 (round 1) said a stage that stays skipped through a resize gets
the new size's note. m5 (this round) said a note changes only when the mode changes. I stopped before
committing, and the controller adopted my recommendation, implemented below under m5.

## What changed, per item

**B1: a new version marks stale what was built on the old one.**
- **One shared function, `cascade(state, stage, reason)`.** Every later stage whose recorded `builtFrom`
  names the stage, directly or through a stage it has just marked, turns stale. Each gets the reason
  "<stage> went to version <n> on <date>".
- **Both verbs use it:** `reopen` always, and `stamp` when it raises a version (G5).
- **An unchanged re-stamp** keeps its version and cascades nothing.
- The open question is closed for every stage the cascade marks.
- **Tests:**
  - the repro: surface; approve frame, context and intent; route frame short; redo frame, stamped at
    version 2. Context and intent end stale with that reason, and `next` returns context;
  - the resize variant: correction to adjustment, frame redone. Detail ends stale with the reason
    "frame went to version 2";
  - re-confirming an unchanged stale frame leaves context and intent approved, and `next` returns cast;
  - `reopen`'s existing test now also asserts the reason on intent.

**B2: the previous-stage rule holds when a stage is added to the route.**
- **When `route` or `resize` adds a stage**, the next stage the route runs after it turns stale if it was
  approved, with the reason "<stage> was added to the route before it".
- **`validate`** reports `stale-input` for an approved stage whose recorded `builtFrom` omits its nearest
  earlier routed stage: "<stage> was stamped without <before>, the stage before it on the route; redo it
  on <before>".
- **Tests:**
  - the repro: adjustment; approve frame through cast, then detail; route structure short. Detail is
    stale, `next` returns structure, then detail once structure is approved;
  - the last stage on the route added again: nothing after it, no error;
  - a stage after the added one that was not approved is left as it is;
  - the resize variant: correction to adjustment with frame, detail and handoff approved. Detail is stale
    ("cast was added…") and handoff is stale ("look was added…");
  - `validate`'s report on a `state.json` changed by hand to put structure on the route without what
    `route` does.
- **The old test changed, as ruled.** "Reopen leaves a later stage that was not stamped as built from
  it" now expects cast to turn stale when intent is put back on the route. It still pins the cascade's
  "not on record" branch: reopening intent leaves cast's reason "intent was added to the route before
  it" untouched.

**m3.** For a stale stage, `validate` now gives the recorded reason: "<stage> is stale: <reason>; redo it
or re-confirm it, then stamp it", or "no reason recorded". Every path that makes a stage stale now
records a reason: the cascade, `route`'s mode change, `resize`, and an added stage. Tested, including the
fallback.

**m4.**
- **`begin`** on a stage whose output exists and can be read sets the header back to `draft` and blanks
  `approved` and `words`. The body is untouched. It still succeeds without an output, and leaves alone an
  output it cannot read.
- **`route … skipped`** resets the stage's record to a blank entry (approved, words, hash, builtFrom and
  since set to null). It keeps the version and leaves the file alone.
- **Tests:**
  - begin on a stale stage, then `validate` is clean;
  - its STATE.md row shows no approval date;
  - begin with an unreadable output leaves it untouched;
  - skip, then route again: a clean `not-started` entry, the file unchanged, and no date in the row.

**m5: resize never lowers a mode, and its notes (as ruled).**
- **The mode** after a resize is the larger of the current mode and the new size's default, in the order
  full, short, skipped.
- **A stage whose mode changes** gets the note "resized from <old> to <new>", whatever its status. This
  replaces a reason given earlier with `route`. If it was approved it also turns stale.
- **A skipped stage now routed** loses its skip note.
- **A stage that stays skipped** has its note rewritten only when the note is the old size's own default.
  A reason given with `route` is kept.
- **Tests:**
  - `route handoff full` at correction, resized to adjustment, stays full with its note;
  - correction to adjustment: structure's default note becomes "the adjustment route skips it";
  - context routed short by hand at correction, resized to surface: full, not-started, "resized from
    correction to surface";
  - a skip reason given by hand survives a resize;
  - stages in work and awaiting whose mode changes get the resize note;
  - a resize to the same size leaves alone a mode set above, and one set below, the size's default.

**m6.** `route <pkg> frame skipped` is refused: "frame cannot be skipped: it is the stage that decides
the route". Tested in the refusal test, which now uses context and intent for the approved and awaiting
refusals.

## Decisions recorded for the reviewer (accepted by the controller)

1. **`begin` also blanks the approval fields in `state.json`** (`approved` and `words`), as `await` does
   (M2). The hash and `builtFrom` stay, for G5 and the cascade.
2. **A stage skipped and then put back keeps a file whose header still says approved**, because `route`
   leaves the file alone. `validate` reports it as `bad-header` (M4) until the stage is begun, which sets
   the header back to draft.
3. **Skipping a stage in front of an approved one does not mark the approved one stale.** `validate`'s new
   check reports it ("stamped without <the new stage before it>"), and `reopen` repairs it.

## Tests and commands

```
$ node --test tests/state.test.mjs          (RED: the round-2 test file against c96e1dd's code)
# tests 94  # pass 79  # fail 15
  (failing: every B1, B2, m3–m6 test and the tests whose expectations the rulings changed; one new
   test, the unchanged re-stamp that cascades nothing, passes on the old code, which never cascaded on
   stamp; the mutation pass pins it below)

$ node --test tests/state.test.mjs          (GREEN)
# tests 94  # pass 94  # fail 0

$ npm test
# tests 128  # pass 128  # fail 0  # cancelled 0  # skipped 0  # todo 0
```

The output holds only TAP, and `tests/.tmp/` is empty afterwards. The files hold no CR, no U+FEFF and no
U+2028/2029.

## Mutation pass (`mutate2.py`, the same operators as round 1, every line of the three files)

**First pass: 800 mutants.** 748 killed, 44 syntax, 8 survived:
- **`resize`'s same-size early return** (deleted, or forced false). It matters only when a mode was set
  below the size's default by hand: without it, a same-size resize would raise that mode back. The test
  now also routes `detail` skipped at correction size and asserts a same-size resize leaves it skipped.
- **`>` to `>=` in picking the larger mode.** Equivalent, because equal ranks mean the same mode. I
  rewrote the pick as `MODES[Math.min(indexOf(a), indexOf(b))]`, which has no comparison to mutate.
- **The cascade's guard against not-started and skipped stages** (4 mutants). Dead code since m4: a skip
  clears the record, and a not-started stage comes only from `init` or an un-skip. So neither status ever
  holds a `builtFrom`. Removed, with a comment, and the test "reopen does not mark a stage that is
  skipped or not started" still holds.
- **CLI line 44.** The help-text template literal artifact from round 1, equivalent.

**Final pass: 794 mutants.** 749 killed, 44 syntax, **1 survived**, the equivalent CLI line 44. The 44
syntax mutants are deletions of block openers or closers, plus the shebang. Every one of those `if`s was
also forced true and false, and all such mutants were killed.

---

# Fix round 3: a skipped stage keeps the memory of its last approval

**Commit:** `1ebc94b fix: a skipped stage keeps the memory of its last approval` on `v2-pipeline` (parent `3b5d385`). One commit;
`scripts/lib/state.mjs` and `tests/state.test.mjs` staged by explicit path; not pushed, not amended.

## What changed

**Important: a skip no longer forgets the last approval.**
- **The change.** `route … skipped` now clears the approved date, the words, `builtFrom` and `since`,
  and **keeps** `hash` and `version`. This amends round 2's m4, which cleared the hash too.
- **Why it matters.** The hash is what makes `stamp` raise a version (G5).
  - With it kept, a stage that is skipped, put back, and stamped with a changed body goes to the next
    version. The shared cascade (B1) then marks everything built on it, directly or through other
    stages.
  - Stamped with the same body, it keeps its version and nothing cascades.
  - The comment over `stamp`'s version rule now names both ways back: gone stale, or skipped and put
    back.
- **Skipped stages still hold no `builtFrom`**, so the cascade still never marks one.
- **Tests** (a shared fixture replays the reviewer's sequence: surface, all nine approved, cast built from
  `intent@1` and `context@1`, then `route context short`, `route context skipped`, `route context full`;
  only intent is stale):
  - **Changed body:** context stamped with a new body goes to version 2. intent, cast, structure,
    detail, look, handoff and acceptance are all stale, with "context went to version 2 on 2026-11-13",
    and `next` returns intent.
  - **Same body:** context stays at version 1, and nothing beyond intent is stale.
  - **The resize entry:**
    1. at correction size, context is routed short by hand, and frame, context, detail and handoff are
       approved (detail built from `context@1`);
    2. context is made stale and skipped;
    3. a resize to adjustment puts it back;
    4. frame is re-confirmed and context is stamped with a new body: version 2, and detail and handoff
       are stale with "context went to version 2".
  - **Updated:** the round-2 test that expected `hash: null` after a skip now expects the kept hash.

**Minor 1.** `stamp` closing the open question of a stage its cascade marks stale is now tested with the
reviewer's sequence: approve frame, context and intent; `route frame short`; `route intent short`; await
intent with a question; redo frame and stamp it. Intent ends stale and the question is closed.

**Minor 2.** A skip keeping the version is now tested at version 2: reopen context (version 2), skip it
and read 2; put it back and read 2.

**Minor 3.** The two unreachable `closeQuestion` arguments are gone:
- **The change.** `route` and `resize` call `builtWithout` for its marking only, and it now returns
  nothing. `route` still closes the question of the stage it skips or makes stale; `resize` still closes
  that of a stage whose mode change makes it stale.
- **Why it changes no reachable behaviour.** `builtWithout` marks only an approved stage, and an approved
  stage holds no question:
  - only `await` sets one, and it refuses an approved stage;
  - `stamp` closes the question of the stage it approves.

Nothing else changed. The library is 571 lines.

## Commands and output

```
$ node --test tests/state.test.mjs          (RED: this round's test file against 3b5d385)
# tests 99  # pass 96  # fail 3
  not ok — route skipped clears the approval record but keeps its hash …
  not ok — a stage skipped and put back, stamped with a new body, gets the next version …
  not ok — a stage skipped by hand and put back by a resize, stamped with a new body, gets the next version
  (Minor 1 and Minor 2 pin behaviour that already held, so they pass on the old code; their hand mutants
   below show they pin it)

$ node --test tests/state.test.mjs          (GREEN)
# tests 99  # pass 99  # fail 0

$ npm test
# tests 133  # pass 133  # fail 0  # cancelled 0  # skipped 0  # todo 0
```

The output holds only TAP, and `tests/.tmp/` is empty afterwards. The files hold no CR, no U+FEFF and no
U+2028/2029.

## Mutation result

**Hand mutants of the three behaviours, each killed:**
- **A skip clears the hash again.** Killed by the kept-hash test, the changed-body test and the resize
  test.
- **`stamp` closes only its own question** (`[stage, ...stale]` → `[stage]`). Killed by the Minor 1 test.
- **A skip resets the version to 1.** Killed by the Minor 2 test.

**The full pass (`mutate2.py`, every line of the three files):** 795 mutants. 750 killed, 44 syntax,
1 survived: the equivalent help-text line `scripts/state.mjs:44`, as in rounds 1 and 2. The syntax
mutants are deletions of block openers or closers, plus the shebang; each of those `if`s was also forced
true and false, and all such mutants were killed.
