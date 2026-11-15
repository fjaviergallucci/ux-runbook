# Build state — the pipeline kit (version 2)

**Read this first if you are resuming the build.** It says where the work is, what is done, what is next,
and how each step is run. It is written so that a session with no memory of the build — a person, or any
coding agent — can carry on.

Last updated: 2026-11-14.

## Where everything is

| What | Where |
|---|---|
| The work | git worktree `/mnt/data/Downloads/Proyectos/ux-runbook-v2`, branch `v2-pipeline`, cut from `master` at `e01d00c` |
| Version 1 | branch `master`, checkout `/mnt/data/Downloads/Proyectos/ux-runbook` — **never modified** |
| The design (the authority) | `docs/design/2026-11-13-pipeline-design.md` |
| The plan (21 tasks) | `docs/plans/2026-11-13-PIPELINE-KIT-PLAN.md` |
| The build log (this build's record) | `docs/build-log/` — see "The build log" below |
| The live working folder of the build | `.superpowers/sdd/2026-11-13-PIPELINE-KIT-PLAN/` (git-ignored; `docs/build-log/` is its committed copy) |

**The branch has never been pushed.** The plan forbids pushing, merging and tagging until the proving run
has passed and the founder says so. Everything is local to this machine.

## What is done

Tasks 0–17 are complete: implemented, reviewed by an independent reviewer, fixed, re-reviewed.

| Task | What | Commits |
|---|---|---|
| 0 | Plugin skeleton | `e01d00c..59f2c81` |
| 1 | Flat header parser (`scripts/lib/frontmatter.mjs`) | `59f2c81..03958df` |
| 2 | Package state, stages, carry (`scripts/state.mjs`) | `36d8dda..1ebc94b` |
| 3 | Walkthrough format, the kit contract, the grey kit | `1ebc94b..23c3af1` |
| 4 | Renderer (`scripts/render.mjs`) | `23c3af1..cd3b832` |
| 5 | Blind merge and sealed map (`scripts/merge.mjs`) | `cd3b832..521b1b5` |
| 6 | Screenshots and the decision page (`scripts/shots.mjs`, `page.mjs`) | `521b1b5..472b5d0` |
| 7 | Acceptance checks (`scripts/accept.mjs`, `scripts/inpage/accept-inpage.js`) | `3b7b412..0170479` |
| 8 | Outside-model script (`scripts/describe.mjs`) | `6a61119..e6a213d` |
| 9 | Card format, checker (`scripts/lib/card.mjs`), eight maker cards | `01a7d2f..1a999e8` |
| 10 | Eight judge cards | `7a078a0..70890f9` |
| 11 | Audience card, five persons, the pool index | `eb015d2..c7a7e2a`, `68f1444` |
| 12 | Every template | `75e4dd8..a2d3ff8` |
| 13 | The conductor skill, and the tests every skill must pass | `1c347fd..67f23ff` |
| 14 | Setup skill; `describe --text` | `b8dd5f6..b799d2f` |
| 15 | Frame, Context, Intent, Cast skills; `scripts/card.mjs check` | `aa6fc81..189f58c` |
| 16 | Structure skill; `state.mjs reopen` closes later questions | `f5fce0c..b578460` |
| 17 | Detail and Look skills; `scripts/deal.mjs` (letters for a blind comparison) | `0495666..2509c3a` |

Last full test run (at `f59678e`): 764 tests — 761 pass, 1 skipped, 2 `todo`. The skipped test cannot run
on this machine's NTFS mount. Each `todo` is a stage skill not yet written; a skill's tests go live in the
task that writes it. Run the suite with `npm test` (about three minutes; it runs one test file at a time).

## What is next, in order

| Step | What | State |
|---|---|---|
| Task 18 | Handoff and Acceptance skills; `reference/IMPLEMENTER-GUIDE.md`, `ANTI-PATTERNS.md` | **next** — see the last lines of `docs/build-log/progress.md` for whether it has started; rulings written |
| Task 19 | `LESSONS.md`, `README.md`, nine evaluation cases | not started; rulings written. **Step 5 (running the paid evaluation suite) is the controller's own**, not a sub-agent's |
| Task 20 | The dry run of the whole pipeline on a fictional project | not started. **Run by the controller** |
| Final review | One review of the whole branch, on the most capable model | after Task 20 |
| One fix wave | Everything parked and deferred, in one dispatch, then one scoped re-review | after the final review |
| Report | The full list of rulings goes to the founder; then the branch is finished (no push without his word) | last |

Not part of this build (the plan names them so nobody does them by momentum): the proving run in a real
project, setup in any real project, a worked example, replacing `master`, tagging version 1, pushing.

## How each task is run

The build runs one task at a time, each through the same loop. The session that conducts it (the
controller) never writes the code itself.

1. **The brief.** The task's text is its section of the plan (`### Task N: …` up to the next `### Task`).
   The implementer is given only that section, never the whole plan.
2. **The rulings.** Before a task is handed out, the controller writes `task-N-rulings.md`: corrections to
   the brief, what earlier tasks left for this one, and decisions the plan did not make. A ruling binds
   with the brief and wins where they differ. Rulings for Tasks 15–19 are already written
   (`docs/build-log/`).
3. **The implementer** — a fresh sub-agent — works test-first, commits on `v2-pipeline`, writes a report
   (`task-N-report.md`) and returns a short status. Its concerns are ruled on before any review.
4. **The review** — a different fresh sub-agent, read-only — is given the brief, the rulings, the report
   and the diff of the task (`git diff <commit before the task>..<head>`), and returns a verdict on
   whether the task matches its requirements and whether it is well built.
5. **Fix rounds**, at most five: the findings go back to the implementer as a file (`task-N-fix-R.md`)
   with the controller's ruling on each; the same reviewer re-reads only the fix. Cheap minors are fixed
   at once in prose tasks, because later tasks copy them; the rest are logged as deferred.
6. **The ledger** (`progress.md`) gets a line for every step, every ruling (numbered R1…), every deferred
   minor and every parked finding. A task with a line `Task N: complete` is done and is never handed out
   again.

Models used so far: Tasks 0–8 implemented on Opus and reviewed on the most capable model; Tasks 9 onward
implemented on the most capable model and reviewed on Opus. The reviewer is never the implementer.

## Rules that bind anyone working here

- **Never push, merge or tag.** Commit on `v2-pipeline` only; stage by explicit path, never `git add -A`;
  never amend. LF line endings.
- **Generic.** No product's name, people, profession or rules anywhere in the kit outside `docs/`.
  Examples use the kit's fictional product: a room-booking tool for a small clinic's front desk.
- **Keys.** This machine holds real provider keys. Never print the environment; never open, list or name
  a real keys file; nothing may contact a real provider. Every test of `scripts/describe.mjs` talks to a
  server it starts on `127.0.0.1`, with a made-up key, in an environment it builds itself. The rules are
  in `docs/build-log/task-8-rulings.md`, section A.
- **Browsers.** Other sessions run headless Chrome on this machine. Never stop a process by name, binary
  path or command-line pattern — only one a run started itself, through its own handle. Never more than
  three browsers at once. Chrome is `/usr/bin/google-chrome`; it fails to start when `TMPDIR` is a very
  long path.
- **Tests.** `npm test` is `node --test --test-concurrency=1 tests/*.test.mjs`. No `--import` in a test.
  This machine has no IPv6 route: run `npm` as `NODE_OPTIONS=--dns-result-order=ipv4first npm …`.
- **The mount.** The checkout is on NTFS through FUSE: warnings about preserving permissions are
  harmless, and a file removed while open can linger for a moment as `.fuse_hidden…`.

## The build log

`docs/build-log/` is a committed copy of the build's working folder, taken at the date above:

- `progress.md` — **the ledger**: every step, every ruling (R1–R147), every deferred minor, every parked
  finding, in order. Search it for `Ruling R`, `minor (deferred)`, `parked`, `NOTE for Task`.
- `task-N-brief.md` — the plan's section for that task, as extracted.
- `task-N-rulings.md` — the controller's rulings for that task. **Those for Tasks 15–19 are ready to hand
  out as they are.**
- `task-N-fix-R.md` — each fix round's findings and rulings.
- `task-N-report.md` — each implementer's report, with its fix reports appended.

The review diffs are not copied (they are large and can be rebuilt with `git diff`).

## Parked for the one fix wave after the final review

Each has its fix decided; the ledger has the detail.

| Ruling | Where | What |
|---|---|---|
| R39 | `scripts/lib/state.mjs` | The stale chain breaks through a skipped stage. A skip should keep `builtFrom`, and the cascade should pass through stages that are not approved. |
| R84 | `scripts/shots.mjs` | A page written to defeat the document mark can be pictured as another page. Hostile pages are out of scope; hardening noted (make the mark non-writable). |
| R108 | `scripts/inpage/accept-inpage.js` | An `<svg>` has no `offsetWidth`, so its scale is taken as 1. Take an svg's scale from its client size. |
| R109 | `scripts/inpage/accept-inpage.js` | A label that cannot be pointed at inside a clipping pill gets `cannot be told:`. Compute corner radii as CSS does (all four scaled by one factor). |
| R132 | `scripts/merge.mjs` and the tests of `shots` and `merge` | A check that a folder is empty must pass over what a mount or an operating system leaves behind (`.fuse_hidden*`, `.DS_Store`, `Thumbs.db`, `desktop.ini`). |

About forty deferred minors are in the ledger (`minor (deferred)`), for the same wave.

One amendment to the design document is owed, by the controller, at the end: § 12 still says a project kit
"links the project's real token file"; what was built copies the tokens into the kit folder (the renderer
copies only the stylesheets it finds there). `kit/KIT-CONTRACT.md` already says so.

## For the two steps the controller runs itself

- **Task 19, step 5 — the evaluation suite:**
  `claude plugin eval . --no-publish --runs 1 --max-cost-usd 15 --allow-tools Bash Write Edit`.
  It starts paid model runs, capped at 15 US dollars in the approved plan; `--no-publish` is required
  (evaluations never leave the machine). A case below 1.0 is a finding against the skill or card it
  exercises: that file is fixed by a sub-agent and the one case re-run (`--case <name>`).
- **Task 20 — the dry run:** the whole pipeline once, on a fictional project, with the founder's answers
  read from a file written beforehand. It tests the mechanics only. Expect about twenty sub-agents. The
  skills are read by path from this worktree if the plugin cannot be installed in the session.

## Waiting on the founder

- Whether to push `v2-pipeline` (needed to resume on another machine).
- The go for the proving run, once the build is finished: it needs setup in that project and the
  profession's profile (design § 19).
- Later tasks he asked to keep: a complete example profile for a doctor; the adoption of the kit in his
  product's repository.

## Since the founder's word of 2026-11-14

"Every time a task is finished, document, commit, push, and continue with next." When a task closes, the
controller brings this file up to date, refreshes `docs/build-log/` from the working folder, commits
(`docs: build state after Task N`) and pushes; then the next task starts.

**The push itself is blocked on this machine** for the controller: a release guard refuses a push of a
branch whose name begins with `v`, reading it as a release tag, and says not to look for another way.
Until the founder settles it (he pushes; or the branch is renamed; or the guard is taught), the commits
are local. To push by hand, from the worktree: `git push -u origin` followed by the branch's name.

## What a review of a skill must check above all

It caught real faults in Tasks 13 to 17: every command against its script's `--help`; every path;
every template section a skill names; that what one stage records reaches the stage that needs it (the
stamp refuses a carry line for a stage that is not in `built-from`); that no step lets the conducting
session make, judge or decide; that nothing leads a session to a key or turns an outside engine on without
the founder's yes. Ask the reviewer to walk one whole design through the skills under review.
