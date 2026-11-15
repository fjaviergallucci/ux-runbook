# Task 20, step 5b — reviewing the fixes of what the dry run found (read this first)

A Claude Code plugin (`ux`, an interface design pipeline: eleven skills, a pool of cards, templates,
scripts) was tried end to end on a fictional project. What did not work as written was noted (274 notes),
sorted into 111 items, ruled on, and fixed by three implementers in turn. You review part of that work.
**You are read-only: you change no file of the kit, and you commit nothing.**

Work in `/mnt/data/Downloads/Proyectos/ux-runbook-v2` (branch `v2-pipeline`). `W` is
`.superpowers/sdd/2026-11-13-PIPELINE-KIT-PLAN/`.

## What the work had to do

- `W/task-20-fix-rulings.md` — the controller's rulings R159–R188 and which wave fixes what. A ruling
  wins over an item's "Recommendation".
- `W/task-20-findings.md` — the items `F1`–`F111`: owning files, what happens, the change asked.
- `W/task-20-fix-dispatch.md` — the rules every implementer was bound by (generic; the limits; the pins;
  no step lets the conducting session make, judge or decide; every command as its script takes it).
- The implementers' reports: `W/task-20-fix-A1-report.md`, `W/task-20-fix-A2-report.md`,
  `W/task-20-fix-B-report.md` — a row for each item, the pins changed, and their concerns.
- The notes behind an item, when you need them: `W/dryrun-notes/<stage>.md`, by entry number.
- The design document, only for a section a ruling or an item names:
  `docs/design/2026-11-13-pipeline-design.md`. Rulings R164, R174, R175, R159, R171 and R188 change rules
  it states; the controller amends it afterwards, so a difference from it on those points is not a
  finding.

Your part and its diff are named in your dispatch message. A diff file holds the commit list, the stat
and the whole diff with context; it is large — read it in pieces, by file.

## What to return, for your part

**1. Does it do what was asked?** For every item and ruling of your part: is the change there, in the
file that owns it, and does it say what the ruling or the item asks — no less, and nothing that was not
asked? Sample nothing: every item. An item reported done that is not, or half, is a finding.

**2. Is it well made?** What matters most here, in this order:

- **Nothing lets the conducting session make, judge or decide**, leads a session to a key, or turns an
  outside engine on without the founder's yes. Several rulings moved lines near that edge (R159 has a
  session write a driver; R160 lets it write a marked proposal; R174 batches questions; R175 has it
  split a finding). Check each lands on the right side.
- **The kit agrees with itself.** A rule changed in one file and still stated the old way in another is
  the commonest fault of a wave like this: for each ruling that changes a rule, search the whole kit
  (`skills/`, `pool/`, `templates/`, `reference/`, `kit/`, `README.md`, `LESSONS.md`, `evals/`) for
  the old rule. What one stage records must reach the stage that needs it (a carry line; a section a
  template holds; a brief that hands it over).
- **Every command** a skill or card gives runs as written: check each new or changed one against
  `node scripts/<x>.mjs --help`. Every path named exists. Every template section a skill names is in
  the template.
- **The pins.** About fifty test pins were changed with the rules they hold. For each, is the rule it
  now pins the ruled one — or was a test loosened to let a sentence through? A pin removed with nothing
  in its place is a finding unless the rule is gone.
- **The limits** (a `SKILL.md` at most 200 lines; a card about 130) were met in places by removing blank
  lines around code fences. Say whether any file is the worse to read for it, or renders wrongly.
- **Generic**: no product's name, person or profession outside `docs/`; examples from the fictional
  room-booking tool. `docs/design/DRY-RUN.md` is to be public: no person's name, no path outside the kit
  or `<run>/project`, no agent ids; and it must be true — check its numbers and its "fixed in the kit"
  cells against the commits.
- For scripts: read the code, then try to break it — by a probe in a scratch folder under
  `/tmp/claude-1000/` (never in the kit), and by mutating a copy, not the checkout. Does each new test
  fail without its change? Does anything that worked before the flag or field now behave differently
  without it? Are the header comment and `--help` of each script still true?

**3. Walk one design through it.** Take a design of size `surface` from Frame to Acceptance through the
skills of your part as they now read, with a founder who accepts one breach of a standing rule at
Detail, a list of five dependencies, and a project that keeps no browser script. Say where the walk
stops, forks, or asks the session to guess.

## How to write it

Write `W/task-20-fix-review-<your part>.md`: a verdict on each of the two questions (**spec: met /
not met** · **quality: approved / changes needed**), then the findings, most important first, each
with: an id · severity (**Critical** — a wrong result or a rule of the kit broken · **Important** —
must be fixed before this is called done · **Minor**) · file and line · what is wrong · what would fix
it. Then what you checked and found sound, briefly, and what you did not check. Do not pad: if a part is
sound, say so in a line.

Reply to the controller with the two verdicts, the count of findings by severity, and the three that
matter most. Nothing else.

## Rules of this machine — binding

- Other sessions run headless Chrome here. **Never stop a process by name, binary path or command-line
  pattern.** Never more than one browser-driving command of yours at once. Chrome is
  `/usr/bin/google-chrome`; keep `TMPDIR` short (`/tmp/claude-1000`).
- **Keys.** Never print the environment; never open, list or name a real keys file; nothing may contact
  a real provider. `scripts/describe.mjs` only with `--help`.
- You may run the tests (`node --test tests/<file>.test.mjs`; the whole suite is
  `NODE_OPTIONS=--dns-result-order=ipv4first npm test`, about four minutes — another reviewer may be
  running it too: run single files unless you need the whole).
- The checkout is on NTFS through FUSE: warnings about permissions are harmless.
- Do not start sub-agents.
