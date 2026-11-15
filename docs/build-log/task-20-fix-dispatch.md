# Task 20, step 5b — fixing what the dry run found (read this first)

You are one of three implementers who fix, one after another, what a dry run of this kit found. The kit
is a Claude Code plugin, `ux`, an interface design pipeline: eleven skills, a pool of cards, templates and
scripts. The dry run conducted the whole pipeline once on a fictional project, and every place the kit did
not work as written was noted and sorted.

Work in `/mnt/data/Downloads/Proyectos/ux-runbook-v2`, branch `v2-pipeline`. All paths below are from
there; `W` is `.superpowers/sdd/2026-11-13-PIPELINE-KIT-PLAN/`.

## Your requirements — read these, in this order

1. `W/task-20-fix-rulings.md` — the controller's rulings (R159–R185) and **which wave fixes what**. Your
   wave is named in your dispatch message. A ruling wins over an item's "Recommendation".
2. `W/task-20-findings.md` — the items. Read "Things to know before reading the items", then every item of
   your wave whole: its owning files and lines, what happens, the change. For a `decision` item, the
   ruling is the change. Items of other waves are not yours: do not fix them, even where you see how.
3. For each item, the owning file as it is today (an earlier wave may have changed it: read it, do not
   trust the line numbers), and the notes that report it when the item is not enough
   (`W/dryrun-notes/<stage>.md`, by entry number).
4. `skills/design/SKILL.md` and its `references/` before you change any skill: use the kit's words for
   the same things. `pool/CARD-FORMAT.md` before you change a card. The design document only for a
   section a ruling names: `docs/design/2026-11-13-pipeline-design.md` — you do not edit it (the
   controller does).

## Rules of the kit

- **Generic.** No product's name, people, profession or rules anywhere outside `docs/`. Examples use the
  kit's fictional product: a room-booking tool for a small clinic's front desk.
- Plain, short, second person, in the voice the file already has. No new jargon.
- **Limits:** a `SKILL.md` at most 200 lines; a card about 130; where a fix adds lines, cut elsewhere in
  the same file, or move detail to that skill's `references/`. Every path a skill names must exist.
- **The tests pin words.** `tests/skills.test.mjs`, `tests/pool.test.mjs` and `tests/templates.test.mjs`
  hold many sentences and section names. Before changing a sentence, search the tests for it. Change a pin
  only where a ruling or an item changes the rule it pins, and say so in your report.
- **No step may let the conducting session make, judge or decide**, lead a session to a key, or turn an
  outside engine on without the founder's yes. A fix that would is wrong, whatever the item says: report
  it instead.
- Every command a skill gives is given as its script takes it: check against `node scripts/<x>.mjs --help`.
- A wave that changes a script works test-first: the failing test, then the change; hand-mutate each new
  condition once to see its test fail. No `--import` in a test. Tests of anything that opens a browser
  follow the header of the existing test file for that script.

## Rules of this machine — binding

- Other sessions run headless Chrome here. **Never stop a process by name, binary path or command-line
  pattern** — only one your run started, through its own handle. Never more than one browser-driving
  command of yours at once. Chrome is `/usr/bin/google-chrome`; it fails to start when `TMPDIR` is a very
  long path.
- **Keys.** This machine holds real provider keys. Never print the environment; never open, list or name
  a real keys file; nothing may contact a real provider. `scripts/describe.mjs` is run only with `--help`,
  or by its own tests against the server they start on `127.0.0.1` with a made-up key.
- No IPv6 route: run npm as `NODE_OPTIONS=--dns-result-order=ipv4first npm …`. Install nothing.
- The checkout is on NTFS through FUSE: warnings about permissions are harmless; a file removed while
  open can linger a moment as `.fuse_hidden…`.
- Do not start sub-agents.

## Git

Commit on `v2-pipeline` only. Stage by explicit path, never `git add -A` or `git add .`; never amend;
**never push, merge or tag**; LF line endings. One or a few commits, each message ending with exactly
these two lines:

```
Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Gm93KmHfnMMPdvmourtGbY
```

## Verify before you report

- While you work: the test file of what you changed (`node --test tests/<file>.test.mjs`).
- Once, at the end: `NODE_OPTIONS=--dns-result-order=ipv4first npm test` (about four minutes; one file at
  a time) → no failure (one test is skipped on this mount), and `claude plugin validate . --strict` →
  exit 0 (a warning about an icon predates you).
- `git status --short` → clean but for nothing of yours.

## Report

Write `W/task-20-fix-<your wave>-report.md`: one row for each item and ruling of your wave — the item ·
the files changed · what changed, in a line · a test added or a pin changed, if any · or **not done, and
why**. Then: anything you found wrong that is not yours to fix; the test counts; the commits. Reply to
the controller with a short status only: DONE, DONE_WITH_CONCERNS (which), or BLOCKED (why); the commits;
the test line; how many items were done and how many not.
