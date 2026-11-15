# Task 13 — fix round 2 of 5

The re-review (head `13b4440`) found all sixteen findings of round 1 addressed, every command still exact
against its script's `--help`, the description and the kit-root sentence unchanged, the two profile terms
right everywhere, and no blind opened. The fix itself left one Important contradiction and two Minor
points; three things already known go in the same commit. Paths are under `skills/design/`; "test:" is
`tests/skills.test.mjs`.

## Important

**N1 — the board rule now keeps a fresh concept off the board** (`references/blind.md:125-126`, pinned at
test:1060). The new line says "Three things never go in the board: … anything of a fresh pass, its gallery
above all". `references/fresh-pass.md:43-45` says the opposite, and rightly: a fresh concept's structure,
written into the walkthrough format, "joins the blind board as one more letter". Followed literally, the
new line holds the transcribed fresh proposal out of the merge and breaks "every valid proposal reaches
the board" (`blind.md` rule 7, `SKILL.md:167`). Say: anything of a fresh pass **as it came** — its
screens, its gallery — never goes in the board; a fresh concept reaches the board only as its structure
written into the walkthrough format, through the merge, like any other letter. Update test:1060.

## Already ruled — in the same commit

- **R135 extended.** `blind.md:129-135` moves the board, the map and the pick, but not the proposals, so
  the next merge would put an earlier round's proposals on the new board. When a round is rejected and
  Intent or Context is reopened, **everything in `04-structure/` other than `earlier/`** — the briefs, the
  proposals folder, the board, the map, the pick, the pictures, the reads, the decision page — is moved
  together into `04-structure/earlier/<n>/` before the new round starts. Nothing in `earlier/` is ever an
  input. A test holds the sentence.
- **Rule 6 of `blind.md` (`:20`)** still says judges and audiences are both "handed the board folder
  only". Step 7 (`:95-97`), the sentence at `:123` and `templates/briefs/audience.md` give an audience the
  **pictures alone** — and an audience handed the folder could open `A.json`, which holds an option's bet,
  cost and hardest state. Rule 6: a judge is handed the board folder and nothing above it; an audience is
  handed the pictures only.
- **`references/loop.md:98-99`** — "Makers and judges are handed her profession's profile whole" is
  broader than the templates: `templates/briefs/maker.md` gives a describer and a fresh maker neither the
  person nor the profile, and `judge.md` keeps the profile line only where it applies. Say what is true: a
  seat is handed what its brief template gives it; where that is a profession's profile, a maker or a
  judge is handed it whole and an audience only its traits; a describer and a fresh maker are handed
  neither the person nor the profile unless the template says so.

## Minor — fixed now

- **N2** `SKILL.md:24-25`, `:169-170`: "except to apply a correction after his nod" can be read wider than
  the size, because the same file uses "corrects" for what the founder does at a gate (`:56`,
  `:164-165`). Write: except, in a design sized `correction`, to apply it after his nod
  (`references/routes.md`) — in both places — and update test:854-860.
- **N3** the wider command reader (test:135-138) refuses lines that are not commands — a prose line in a
  fence ("Every node in the tree is a screen; see scripts/ for how."), a comment in a js fence
  (`// node scripts/ are the kit's`) — counts any path holding the substring `scripts/` (so
  `tests/scripts/x.mjs` too), and takes a redirection for "a word too many"
  (`… status <package> > <package>/status.txt`, `… next <package> 2>/dev/null`). Start a command only
  where `node` begins a shell command (the start of the line, after a prompt, after a separator or an
  environment assignment); match `scripts/` only at the start of a path segment; add `>`, `>>`, `2>` and
  `<` to the separators that end a command. One inline sample per case.

## Rules unchanged

Generic; `SKILL.md` within 200 lines; nothing under `templates/`, `pool/` or `scripts/`; stage by explicit
path; commit on `v2-pipeline`; never push, never amend. `node --test tests/skills.test.mjs` while
iterating; `npm test` once at the end, **after the last edit**.

One commit: `fix: a fresh concept reaches the board as a letter, and a rejected round moves whole` (same
two trailer lines). Hand-mutate the changed rule functions. Append "Fix report — round 2" to
`task-13-report.md` and reply with the short status contract.
