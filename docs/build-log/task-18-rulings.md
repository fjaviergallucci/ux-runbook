# Task 18 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

1. **The tests of `tests/skills.test.mjs` already exist** (Task 13): un-`todo` the two. Each header writes
   `description: "…"` in double quotes with the text of Task 13's table verbatim; the kit-root sentence
   exactly as fixed; the six sections in order; at most 200 lines; only paths that exist today. With
   `reference/` now existing, **make the last `todo` of `tests/pool.test.mjs` live** (every path a card
   names under `templates/`, `skills/` or `reference/` exists) and the path rule of
   `tests/skills.test.mjs` cover `reference/`.
2. **Every command is given as the script takes it.** Read the header and `--help` of
   `scripts/accept.mjs` (`prototype`, `inpage`, `report` with `--checks`), and the header of
   `scripts/inpage/accept-inpage.js` (what each check type measures and what it does not ask).
3. **Handoff.**
   - The checks (`ACCEPTANCE.md` and `acceptance.json`) are written from the intent's success criteria,
     the states and the measured values, by stable id (`data-ux`, with `screen` where an id repeats);
     `acceptance.json` must pass `validateAcceptance` — the skill runs
     `node <kit root>/scripts/accept.mjs prototype <acceptance.json> --root <prototype> --out <results>`
     **first**, and a check that fails on the approved prototype is a wrong check, fixed before the
     handoff. `--allow-errors` is used only with the reason written beside the command in `COVERAGE.md`.
     A check the in-page file answers `cannot be told:` or `cannot be measured:` is rewritten or listed in
     `ACCEPTANCE.md` as one a person must look at.
   - The token file is copied in with its source path and commit; `PARTS.md` is written from the component
     source the profile names, read now, never from memory; `reference/IMPLEMENTER-GUIDE.md` is copied
     into the folder so the folder stands alone.
   - The cold implementer is launched with the handoff folder **only** (its card), on what the cast sheet
     names. Every question and guess it lists is answered in the folder or given a written default; then
     the gate — one go.
4. **Acceptance.**
   - A separate session. It reads the handoff folder and `build/` (`BUILD.md`, `STATES.md`,
     `DEVIATIONS.md`) and nothing else of the package's history.
   - It reaches each state the way `STATES.md` and the profile's "How a browser check is run here" say,
     with the project's own driver; then evaluates the in-page file through that driver
     (`node <kit root>/scripts/accept.mjs inpage` prints its path) and calls `window.__uxAccept(checks)`
     with that state's checks. It measures at the top of the page. What comes back is saved as
     `08-acceptance/results/<state>.json` (the brief's `checks.json`, renamed: `acceptance.json` is already
     "the checks").
   - The report is built with
     `node <kit root>/scripts/accept.mjs report <results…> --checks <acceptance.json> --out …` (ruling
     R92): a check that never ran shows as **not run**, and the skill never reports an acceptance with a
     check not run and unexplained.
   - **Accounts and secrets.** `STATES.md` names an account by its role and says where its sign-in is
     kept; Acceptance never writes a password, a token or a key into the package, a results file or a
     picture's name, and never prints one. Pictures of a build are taken on seeded or test data; if a
     picture would show a real person's data, it is not taken and the report says so.
   - The cast's judges re-read pictures of the build and the results (the vocabulary's `build`), cold
     first; one audience read. Each item of `REPORT.md` *matches* or *deviates*; an accepted deviation is
     logged in `DECISIONS.md` and the package brought up to date; a fix goes out in `FIXES.md` as a slice;
     Acceptance implements nothing itself except a fix the size of a correction, after the founder's nod.
   - It appends the lessons to the project's `LESSONS.md` as `skills/design/references/lessons.md`
     describes, with the line recording which seats' findings changed a decision and the model each ran
     on.
5. **A shared machine:** a browser is started only through the kit's scripts or the project's own driver;
   never more than three at once; no process is stopped by name or by pattern.
6. **`reference/IMPLEMENTER-GUIDE.md`** is read by a session that has never seen the pipeline: it says
   what the folder is, the order to read it in, the four rules ported from version 1, the measuring loop,
   the three rules of design § 13 (keep the stable ids; build every state; do not redesign), the three
   files to write back and what each holds — and that `STATES.md` names accounts by role, never their
   credentials. It names no file outside the handoff folder.
7. **`reference/ANTI-PATTERNS.md`** as the brief describes; the process failures are each one line with
   the rule of the pipeline that guards against it.
8. **Read of the design:** § 4.7, § 4.8, § 13, § 14, and the Handoff and Acceptance rows of § 24. Never
   the whole plan. Read `pool/judges/cold-implementer.md`, the judges that sit at `acceptance`, the task
   reader, and the templates under `templates/package/07-handoff/`, `build/` and `08-acceptance/`.
9. Plain, short, second person; generic; examples from the fictional room-booking product.

## Added after Tasks 15–17 (what the stages before now do)

10. **Follow the form of the three stage skills before yours** (`skills/structure/`, `skills/detail/`,
    `skills/look/`): a `references/seats.md` beside the skill says, seat by seat, what it is handed and
    what its brief lists under "Do not open", against its card; versions in `built-from` and in carry
    lines are read from `state.mjs status`, never written as literals; a stage whose output file is
    already there does not copy its template over it; a question asked mid-stage is recorded with
    `state.mjs await` and his answer written before the next step; a short form (an adjustment, a
    correction, a flow) has its own reference when it does not fit.
11. **What reaches Handoff, and only that.** Look's carry list is what Handoff may open: the cast sheet's
    tables for every stage (each seat's model and effort), each stage's "What the readers found", the
    reads folders of Structure, Detail and Look, the states, the strings with their why-lines, the data
    map and the dependencies, the measured values, the named extensions, the screens, the prototype, the
    token file, `DECISIONS.md`. `COVERAGE.md` is filled from those — every seat with what it read, the
    model it ran on and its checks run and not run; every finding with what became of it. If something
    `COVERAGE.md` or `SPEC.md` needs is not on Look's carry, stop and report it rather than opening the
    package's history.
12. **Nothing a fresh maker made is handed off.** `06-look/fresh/`, `06-look/beside/` and the sealed file
    are never copied into the handoff folder nor named in it. A named extension of the design system is
    written in `PARTS.md` as a change to the system, with its definition.
13. **Acceptance's seats** are those of the cast sheet's "Acceptance" table, started as `loop.md` says:
    a judge is handed pictures of the build and the check results (the vocabulary's `build`), reads cold
    first, then opens its seat's earlier ledger; the task reader is handed pictures only, her person and
    her profession's traits. Their ledgers go to `08-acceptance/reads/`, named as Detail and Look name
    theirs.
14. **Scripts that exist now and may be named:** `scripts/card.mjs check`, `scripts/deal.mjs`, and
    `state.mjs reopen` now closes the open question of every later awaiting stage. Check each command
    against its script's `--help`.
15. **The review will walk one whole design through your two skills** with the real `scripts/state.mjs`
    and `scripts/accept.mjs`: write a run-through test that does the same (the handoff folder assembled
    from a fixture package, `accept.mjs prototype` run on its prototype, the cold implementer's hand-over
    checked, the build stand-in, `accept.mjs report --checks`), as the previous tasks did.
