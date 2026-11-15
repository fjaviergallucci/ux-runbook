# The final review — the whole branch, once

A Claude Code plugin, `ux` — an interface design pipeline — was built in 21 tasks on the branch
`v2-pipeline` of `/mnt/data/Downloads/Proyectos/ux-runbook-v2` (cut from `master` at `e01d00c`). Every task
had its own implementer and its own independent review, and the last task ran the whole pipeline once on
a fictional project and fixed what that found. **You are the one review that sees the whole.** After you
comes one fix wave and nothing else; then the kit goes to its proving run in a real project.

**You are read-only.** You change no file of the kit and commit nothing. `W` below is
`.superpowers/sdd/2026-11-13-PIPELINE-KIT-PLAN/`.

## What it had to be

- The design — the authority: `docs/design/2026-11-13-pipeline-design.md`. Read § 2 (goals, non-goals,
  anti-goals), § 3 (three rules), § 6 (the loop, the state), § 18 (constraints) and § 25 (what the build
  and the dry run changed) whole; the rest by section, when a finding turns on what was intended.
- The plan: `docs/plans/2026-11-13-PIPELINE-KIT-PLAN.md` — its header, **Global Constraints** and
  **Review Focus** (lines 1–72). Not the tasks: each was reviewed against its own.
- What happened when it was run: `docs/design/DRY-RUN.md`.
- The ledger: `W/progress.md` — every ruling (R1–R191), every `minor (deferred)`, every `PARKED` finding.
  Long: search it, do not read it through.

## What to look for — what no task's review could see

Each task was reviewed for doing what its brief asked. Do **not** re-do that line by line. Spend yourself
on what only the whole shows:

1. **Does the kit agree with itself, end to end?** Walk two designs through the eleven skills as they
   read today, as a session with no memory of the build would — one of size `surface` on the full route,
   one `correction` — with the scripts' `--help` beside you. Where does a session stop, fork, guess, or
   meet two files that say different things? Where does one stage record something the next never
   reads, or need something no stage wrote? (`skills/design/SKILL.md` and its `references/` first.)
2. **The three rules of § 3 and the anti-goals of § 2.** Is there any step, in any skill, card, template
   or script, that lets the conducting session make, judge or decide; that shows a judge or an audience
   what it must not see; that lets a seat read past its card; or that lets work go on past a gate without
   the founder's word written down first?
3. **Safety.** Anything that could lead a session to a key, print one, send a brief to an outside
   provider without the founder's yes in the profile, or contact a provider from a test
   (`scripts/describe.mjs`, its tests, the outside-describer and screen-generator cards, setup). Anything
   that starts or stops a browser other than through `scripts/lib/browser.mjs` and its own handle.
   Anything in the kit outside `docs/` that names a real product, person or profession.
4. **The scripts as one program.** `state`, `render`, `merge`, `deal`, `shots`, `page`, `accept`,
   `alone`, `card`, `describe` and `scripts/lib/`: do they agree on formats they pass each other (the
   header grammar, the walkthrough format, the decision data, the acceptance file, results)? Exit codes
   and refusals of one kind throughout? Is each header comment and `--help` true? Any check that can
   pass while the thing it guards is false? You may run them, and probe in a scratch folder under
   `/tmp/claude-1000/` — never in the kit.
5. **The tests.** 881 tests, most of them pins on sentences. Is there a rule the kit depends on that no
   test would notice breaking? A test that asserts nothing, or passes for the wrong reason? You need not
   read them all: pick the rules that matter most (items 2–4) and look for their tests.
6. **As a plugin a stranger installs.** `.claude-plugin/`, `README.md`, `LESSONS.md`, `reference/`,
   `evals/`: does the README tell the truth about what is here and how to start? Is anything left over
   from version 1 that now misleads? (`claude plugin validate . --strict` passes; a warning about an
   icon is known.)

## Then: settle the fix wave

One fix wave follows you. Besides your findings it will carry what was put off during the build. For
each of these, read the ledger's entry and the code it names, and give **one line: fix as decided · fix
differently (how) · drop (why)** — so the wave can be one dispatch with nothing left to decide:

- The parked findings: **R39**, **R84**, **R108**, **R109**, **R132**, **R184**, **R185** (search
  `W/progress.md` for each; R184 and R185 are in `W/task-20-fix-rulings.md`).
- Every `minor (deferred)` in the ledger (35 lines, some holding several) — group them by file; say
  which few matter and which can be dropped without loss.
- The two follow-ups left for the proving run (R182, a script for Handoff's mechanical part; R183,
  checks of behaviour): say only if you think either cannot wait.

## How to write it

Write `W/final-review.md`:

1. **Verdict**, one paragraph: is this ready for a proving run in a real project once the fix wave is
   done, and what is the single biggest risk in that run?
2. **Findings**, most important first, each with: an id (`G1`…) · severity (**Critical** — a wrong
   result, a rule of the kit broken, or a safety fault · **Important** — must be fixed before the
   proving run · **Minor**) · file and line · what is wrong, with the evidence (the two sentences that
   disagree; the probe and what it printed) · what would fix it. No finding without evidence you saw
   yourself. Do not pad: a short list of true findings is the result wanted.
3. **The two walks**, briefly: where each stopped, forked or guessed.
4. **The fix wave**: the table asked for above.
5. **Sound**: what you checked and found right, in a few lines. **Not checked**: what you did not reach.

Reply to the controller with: the verdict in two sentences; the count of findings by severity; the five
that matter most, one line each; and how many of the parked and deferred items you would fix, change or
drop.

## Rules of this machine — binding

- Other sessions run headless Chrome here. **Never stop a process by name, binary path or command-line
  pattern** — only one your own run started, through its own handle. Never more than one browser-driving
  command of yours at once. Chrome is `/usr/bin/google-chrome`; keep `TMPDIR` short (`/tmp/claude-1000`).
- **Keys.** This machine holds real provider keys. Never print the environment; never open, list or name
  a real keys file; nothing may contact a real provider. `scripts/describe.mjs` only with `--help`.
- Tests: `node --test tests/<file>.test.mjs` for one file; the whole suite is
  `NODE_OPTIONS=--dns-result-order=ipv4first npm test` (about four minutes). Install nothing.
- The checkout is on NTFS through FUSE: warnings about permissions are harmless.
- Do not start sub-agents. Mind your budget: this is one careful read, not an audit of every line —
  when you must choose, choose items 1 to 3.
