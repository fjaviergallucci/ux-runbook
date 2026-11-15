# The final fix wave — one dispatch, two hands

The whole branch was reviewed once (`final-review.md`: 1 Critical, 8 Important, 12 Minor, and a line on
every parked finding and every deferred minor). This page is the controller's ruling on all of it. It is
the whole of what is left to change in the kit before its proving run. Read `task-20-fix-dispatch.md`
first for the rules that bind you (the kit's rules; this machine's rules about browsers and keys; git;
how to verify) — where it says "your wave" read "your part" below.

For each item: read the finding whole in `final-review.md` (`G1`–`G21`, § 2; the parked and the deferred,
§ 4), and for a parked ruling the ledger's entry (`progress.md`, search `R39` and so on) and
`task-20-fix-rulings.md` (R184, R185). **Where this page says "as the review's Fix", the review's own
"Fix" paragraph is your requirement.** Where this page differs, this page wins.

| Part | Who | What |
|---|---|---|
| **Scripts** | the first implementer | everything below marked **S**, test-first |
| **Words** | the second, after the first | everything below marked **W**, and `docs/` |

## The findings

- **G1 · Critical · W.** The screen generator's seat is told whether its tool is on. As the review's Fix,
  all four parts: the brief template's line; both seats pages carry it from `engines-on`; the card says
  "Your brief says whether the tool is on. If it does not say, it is off", and that when it is off it
  calls no outside tool; the pins. Check the outside describer's and the transcriber's cards for the
  same gap and say what you found.
- **G2 · W.** What Structure's readers found on the chosen structure is handed to the interaction
  designer at Detail (by file and heading, the rest of `CHOSEN.md` staying closed), and what is on a
  string to the writer; each seat's reply says how each was answered or why it stays open; the conductor
  copies those lines and writes none of its own. With **G10** (same pages), as the review's Fix.
- **G3 · W.** A build that needs a server is found at setup, not at stage 9. As the review's Fix, all
  four parts: setup's gate says that Acceptance will stop until the project keeps such a script; Frame
  lists it under "Engines missing"; the profile template's "How a browser check is run here" holds the
  contract of that script; `reference/IMPLEMENTER-GUIDE.md` says the same to the builder (keep its copy
  in the evaluation fixture equal: a test holds them so). No step has a kit session write it.
- **G4 · W.** A correction where the screen does not open as a file: as the review's Fix, in
  `correction.md` and `forms.md`.
- **G5 · S, then W.** *S:* `playwright-core` is imported where a browser is started, not at the top of
  the library; when it is missing the script refuses in one line (it is not installed in the kit's root;
  run `npm install` there), exit 1; `--help` of every script, `accept inpage` and `accept report` need
  no dependency. Test it in a copy of the scripts with no `node_modules`, in a scratch folder. **Do not
  install the plugin** into this machine's Claude Code to try it. *W:* the README says the truth both
  ways: used from a clone with `--plugin-dir`, where `npm install` was run; or installed, in which case
  `npm install` is run in the kit's root as installed, which is the folder two above any skill's own.
  Setup's browser check hands that refusal to the founder as printed.
- **G6 · W.** "The measure" is built: the interaction designer writes, under "Rules", when the event
  fires and with what; `folder.md` adds it to the intent's row, to `SPEC.md` and to the slice that holds
  its trigger; `ACCEPTANCE.md` has it as a check made by hand. "The feeling" goes to the visual
  designer's brief word for word. The test the review suggests (every `##` heading of a stage's template
  is named by something later, or is on a short list of the founder's own) is added if it can be made
  true in an hour; if not, say why in your report.
- **G7 · S.** `stamp` refuses an output whose "Reviewed by the founder" section is missing, or holds
  nothing but an instruction in braces; and one that still holds a line that is only `{…}` or the
  template's opening comment. `validate` reports the same of an approved stage. The short forms of a
  correction pass. **Every fixture under `evals/` and `tests/` that was stamped earlier still
  validates**: run them all; where one would not, the rule is narrowed, never the fixture rewritten.
- **G8 · S, then W.** With R185 below. *W:* the visual designer's card and Look's skill: what `accept`
  still cannot measure is read by a script written on `scripts/lib/browser.mjs`, as Acceptance's driver
  is; "a script of your own" goes.
- **G9 · W.** Whether the project's tokens moved since the kit copied them is looked at, at Frame and at
  Look's step 2: the first line of the kit's token copy against the last commit of the file it names
  (give the `git` command; a project with no history, or tokens that are not in it, is said so and
  asked of him). Where they differ, he is told, and setup's kit steps are run again before anything is
  drawn. Handoff does not write `PARTS.md` while they differ. Mind the limits: Frame, Look and Handoff
  are at or near 200 lines — the detail belongs in a reference.
- **G11, G18, G21 · W; G12, G15, G19, G20 · W (one line each).** As the review's Fix. (G12 is a
  script's message: **S**.)
- **G13, G14, G16, G17 · S.** As the review's Fix, each with its test.

## The parked findings

- **R39 · S.** Fix as decided: a skip keeps `builtFrom`; the stale cascade passes through stages that are
  not approved without changing them. With the deferred note-slot fault in the same code (a cascade's
  reason overwrites a route's and stays after the stage is approved again), and a test that `route`
  leaves an open question open.
- **R84.** Dropped: every page the kit pictures is drawn by its own scripts or makers. Nothing to do.
- **R108 · W.** No code: one sentence under `in-viewport` in `accept --help` (**S** writes that line) and
  in the visual designer's card — the element that answers "without scrolling" is never a shape inside
  an `svg`.
- **R109 · S.** Fix as decided: corner radii as CSS computes them. Then copy the in-page file again into
  the evaluation fixture that holds it (a test holds the two equal).
- **R132 · S.** Fix as decided, in `merge` and in the tests that list a folder after a removal:
  `.fuse_hidden*`, `.DS_Store`, `Thumbs.db`, `desktop.ini` are passed over, as `deal` passes them over.
- **R184 · S, then W.** A stamp guards every file of the stage's folder, with the review's three
  conditions: (1) text files are hashed with line endings made one, as the output's body is; other
  files by their bytes; R132's leftovers are passed over; (2) a stage stamped before this, with no list
  of files on record, is held to its output alone — every fixture still validates; (3) *W:*
  `skills/acceptance/references/deviations.md` — an accepted deviation always reopens Handoff before any
  file of `07-handoff/` is changed, once for the batch. And `reopen` names the stages it recalled.
  Before you write it, list which folders each stage owns and which files a later stage legitimately
  writes into an earlier stage's folder (walk the skills' "Writes" tables): a guard that trips on the
  kit's own steps is worse than none — report that list, and anything you had to leave unguarded.
- **R185 · S.** Two check types only: `style` (one computed property of one id) and `gap` (the distance
  between two ids on one axis). In the in-page file, `accept --help`, the acceptance template's list of
  types, and the fixture's copy. Line length stays "measured by a person".

## The deferred minors

Fix these eight, as § 4 of the review lists them: the state script's note slot and the `route` test
(with R39) · `frontmatter.mjs`'s header comment names its two missing refusals · `merge`'s
every-folder-above rule (G13) · `page.mjs`'s options row (G14) · `accept inpage` and `report` load no
browser library (with G5) · the three restored sentences of `pool/audiences/task-reader.md` are pinned
(**W**) · `skills/cast/references/presets.md`: "at any earlier stage" (**W**) · Task 17's M2 (it is R185).

**Dropped, all the rest** (37 places): the review found each to be an error worded oddly, a cost in
time, a case on another operating system, or a path no step of any skill reaches. Do not fix them.

## The document — W, last

`docs/design/DRY-RUN.md` gains a short last section, "After the dry run: the review of the whole branch":
what it found (G1 to G21 in a line each), what was fixed, what was dropped and why, and what is left for
the proving run (R182, R183's check types, and the largest risk the review names). `README.md` and
`docs/plans/BUILD-STATE.md` are the controller's, except the README lines G5 names.

## When you have finished your part

`NODE_OPTIONS=--dns-result-order=ipv4first npm test` → no failure (one test is skipped on this mount);
`claude plugin validate . --strict` → exit 0; `git status --short` → clean. Commits by subject
(`fix: …`), each with the two trailer lines of the dispatch file. Report: `final-fix-scripts-report.md`
or `final-fix-words-report.md` here — a row for each item of your part: what changed, the failing test
written first or the pin, the mutation tried; or **not done, and why**. Then anything the other part
must know. Reply with: DONE, DONE_WITH_CONCERNS (which) or BLOCKED (why); the commits; the test line;
how many items done and how many not.

## After the scripts' part (for the words' part)

The scripts' part is done (commits `e15a017`..`ed3ba83`; its report is `final-fix-scripts-report.md`).
Its last section lists **nine sentences that are now untrue**, each with its file, line and pin: they are
yours, with the **W** items above. And:

- **R184 is live.** A stamped stage's whole folder is guarded: a file changed, added or removed after the
  stamp is reported by `validate`. `skills/acceptance/references/deviations.md` must reopen Handoff
  **before** any file of `07-handoff/` is changed, once for the batch; the Handoff-and-Acceptance walk in
  `tests/skills.test.mjs` follows the old order and must move with the page. Then read every other step
  of every skill that writes into an earlier stage's folder after its stamp (the scripts' report has the
  list of folders and writers) and make sure none trips the guard as written.
- `07-handoff-gate/` is not guarded (it lies beside the folder): leave it so, and do not say it is.
- G20 is already done (it was a line in a test file).
- R39 was built so that a skipped stage, or one not started since it was put back, lets the stale chain
  through unchanged; a stage in work or awaiting is still marked stale. Where a skill describes the
  cascade, it says that.
