# Task 20, step 5a — sort what the dry run found

A Claude Code plugin (`ux`, an interface design pipeline) is being built in
`/mnt/data/Downloads/Proyectos/ux-runbook-v2` (branch `v2-pipeline`). Its last task was a dry run: the whole
pipeline, once, on a fictional project, with the founder played by a file of answers. Each stage was
conducted by a fresh session that followed the skills literally and wrote down everything that did not
work as written. The run finished: all nine stages approved, 46 seats, 1302 checks passing.

**You sort the findings. You change nothing in the kit.** A later agent fixes; a controller rules on what
needs a decision. Your two files are what they work from.

## Read

- The notes, whole — `.superpowers/sdd/2026-11-13-PIPELINE-KIT-PLAN/dryrun-notes/`:
  `setup.md` (18 entries) · `frame.md` (12) · `context.md` (13) · `intent.md` (23) · `cast.md` (18) ·
  `structure.md` (30) · `detail.md` (45) · `look.md` (38) · `handoff.md` (29) · `acceptance.md` (28) ·
  `builder.md` (20, the stand-in builder's — the "cold implementer's list" of a real build) ·
  `_controller.md` (answers the file lacked). `CONDUCTOR.md`, `SEAT.md` and `BUILDER.md` there are the
  run's own rig: what each conductor, seat and the builder was told.
- The ledger's lines for the run: in `.superpowers/sdd/2026-11-13-PIPELINE-KIT-PLAN/progress.md`, every
  line that starts `- Task 20` and rulings R154, R156, R157, R158. Also search it for `parked` and for
  `minor (deferred)`: where a note repeats something already parked or deferred, say which, do not
  list it twice.
- The run's package, when a note needs checking: `/tmp/claude-1000/dryrun/project/design/free-now/`
  (and `design/PROFILE.md`, `design/LESSONS.md` beside it). Read-only.
- The kit file and line each note names — **open it and check the note is true of the file as it is
  today** before you sort it. A note that is wrong about the kit is sorted as "not so", with why.
- The design document only where a note turns on what was intended:
  `docs/design/2026-11-13-pipeline-design.md` (the section, never the whole).

## Sort every entry into exactly one class

| Class | What it is |
|---|---|
| `mechanical` | A script does the wrong thing, refuses what it should take, or lacks a check it claims; or a template, a card header or a file shape is wrong in a way a test can pin. Give the test that would fail today. |
| `wording` | A skill, reference, card or template says something unclear, wrong, missing, or that disagrees with another file, and the fix is words. Give both places when two disagree, and which one the design document backs. |
| `decision` | The kit behaves as written, and the run shows the behaviour may be wrong or is not decided: fixing it means choosing. State the choice in one line, the options (two or three), what the design document says if anything, and your recommendation with its cost. Do not decide. |
| `rig` | Caused by the dry run's own set-up (a conductor that cannot start seats, a founder who is a file, a build that is a copy, every seat on one model, the seat instructions' short reply) and would not happen in real use. Say why. |
| `cannot-show` | Something the dry run could not test at all (it needs a real founder, a real design system, a real build, an outside engine, a second model). |
| `works` | The kit caught or prevented something as designed, and the note records it. Keep these: they are evidence. |
| `not-so` | The note is mistaken about the kit. |

Where several stages report the same thing, make it **one** item and list every note that reports it.
Give each item an id `F1`, `F2`, … in the order of the pipeline's stages, a severity (`stops a run` ·
`wrong result` · `costs time` · `confusing`), and the owning file(s) with lines.

## Write two files, both in `.superpowers/sdd/2026-11-13-PIPELINE-KIT-PLAN/`

1. **`task-20-findings.md`** — the sorted list: a table of counts by class and stage first; then each
   item under its class: id · severity · owning file and line · what happens · the notes that report it
   (`detail 12–14`) · for `mechanical`, the failing test in one line · for `wording`, the change in one
   line · for `decision`, the choice, options, recommendation. Then a list of the notes you sorted as
   `rig`, `cannot-show`, `works` and `not-so`, one line each. Every one of the 274 entries must be
   accounted for: end with a count that adds up.
2. **`task-20-DRY-RUN-draft.md`** — the draft of the document the plan asks for
   (`docs/design/DRY-RUN.md`; the fixer completes its "how it was fixed" column later). In this order:
   - *What was run*: the fictional project, the scope (size `surface`, kind `working-surface`, no fresh
     pass, no outside engine, three describers, one seat removed at Cast), how it was conducted (one
     fresh session per stage reading only the skills and the package; a controller starting seats with
     a pointer to their brief; the founder as a file), and the result in numbers.
   - *Stage by stage* (setup, then the nine, then the stand-in build): what ran, how many seats and
     which, how many times the conductor stopped and why, what broke (by item id), and a column
     "fixed in the kit" left as `—` for now.
   - *The cold implementer's list*: the handoff's cold reader (21 items, then 15 at the re-read) and the
     stand-in builder's 20 notes — each item, and what answered it (the folder · "left to the builder" ·
     a marked default · nothing).
   - *Every place a skill's wording must change*: the `wording` items as a table (file, line, from, to).
   - *What the kit got right*: the `works` items, short.
   - *What the dry run cannot show*: the `cannot-show` items, and the `rig` ones that hide a real
     question.
   - *The evaluation suite* (Task 19 ran before this): nine cases, all 1.00 after three runs, $8.88 of a
     $15 cap; what the runs taught (a run's shell is read-only, so cases read fixtures in place; two
     kit changes came of it, R152 and R155) — take the facts from the ledger's `Task 19` lines.
   Plain words, short sentences, no product's name: the kit is generic and this document will be public.
   Name no person. Paths are relative to the kit's root or to the run's project.

## Rules

- Change nothing under `skills/`, `pool/`, `templates/`, `scripts/`, `kit/`, `tests/`, `docs/`. Write
  only your two files. Commit nothing.
- Start no browser and no long-running process. Never stop a process by name, binary path or
  command-line pattern. Never print the environment; no key, no keys file, no outside model, no network.
  You may run `node scripts/<x>.mjs --help` and read-only `git` commands.
- Do not start sub-agents.

## Reply

Short: the counts by class; the five items you would fix first and why; the `decision` items by id with
one line each; anything in the notes you could not sort.
