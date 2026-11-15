# Task 20, step 5b — fix round 2 of 5 (small; the last of this task)

Both reviewers re-read fix round 1 and approve: every finding fixed, nothing Critical or Important left.
Each appended `## Re-review of fix round 1` to its file (`task-20-fix-review-words.md`,
`task-20-fix-review-scripts.md`) with four new Minor findings; read those eight whole there (they are
named `N1`–`N4` in each file: below, `W-N1` is the words review's, `S-N1` the scripts review's). This page
is the controller's ruling on each, plus one ruling of its own. Rules as in `task-20-fix-dispatch.md`
(read it first: the kit's rules, this machine's rules about browsers and keys, git). Many sentences are
pinned by the tests; seven skills stand at exactly 200 lines, their limit.

## Ruling R191 — who writes the "without scrolling" check (settles how R190 is built)

Round 1 had the conductor add an `in-viewport` check to the visual designer's `checks.json`. Choosing the
element that proves the criterion is a maker's judgement. So:

1. At Look, the **visual designer** writes the `in-viewport` check, in its own `checks.json`, for each
   criterion of the intent that says "without scrolling" — and in a variant's own `checks.json` too.
2. The designer is not handed the intent at Look: its **brief carries each such criterion**, word for
   word. The seats page and the brief template say so.
3. The conductor only **checks that such a check is there** for each such criterion, as it holds the
   measures to its runs. Where one is missing, that goes back with the step-5 send-back.
4. **A check of that kind that fails** is treated as any failed check of step 5: sent back to the visual
   designer in that send-back; one that still fails afterwards is handed to the judges in their briefs
   and listed for the founder as an open finding. Nobody but the designer changes a screen for it.
5. Detail's seats page and the R190 row of `docs/design/DRY-RUN.md` say what is now so (the designer
   writes it at Look; at Detail the brief only says which check will answer). Add a row for R191.

## The eight minors

- **W-N1** — when the prototype builder has no example data: the builder's card (M1) is right. Detail's
  seats page says the same: the conductor asks the founder for it, one question, and hands it to the
  builder in a brief; only what the builder then still could not build goes to the decision page.
- **W-N2** — Handoff's "take the reference out" (`seats.md`) and "never let the folder point outside
  itself" (`SKILL.md`) get the one exception round 1 made, in the same words as `folder.md`.
- **S-N1** — the one exit 1 that may stand is worded to what can happen: a pointer in a file **approved
  at an earlier stage and copied in — unchanged, or changed only by the rewrites step 3 makes** (the
  token link). A row of the states is in `SPEC.md`, which the conductor writes: there the pointer is
  written out in full, as any file the conductor wrote is mended; `folder.md`'s example is changed to
  one that is true (a stylesheet's comment).
- **W-N3 / S-N4** — a pointer left open goes to the decision page as a finding whose `seat` names the
  check that found it, in the form Acceptance already uses for a finding a check found (use that form;
  do not invent a second one). Say it where Handoff builds the page.
- **W-N4** — Acceptance's Writes table lists the driver it may write and the line it adds to the
  project profile, each "only on his yes".
- **S-N2** — `card.mjs check` refuses, in a profile, a fenced block inside a characteristic: a field is
  prose, a list or both, with no blank line inside it. Test first, with the reviewer's form; `traits` on
  it is refused through `check`.
- **S-N3** — the help texts: wrap the long line of `card.mjs --help`; `alone.mjs --help`'s sentence for
  success names links too. Step 7's command stays a code span (the skill is at its limit) unless you
  find the three lines.

## When you have finished

`NODE_OPTIONS=--dns-result-order=ipv4first npm test` → no failure (one test is skipped on this mount);
`claude plugin validate . --strict` → exit 0; `git status --short` → clean. One or two commits (`fix: …`),
each with the two trailer lines of the dispatch file. Write `task-20-fix-round-2-report.md` here: a row
for each of the nine — what changed, the test or pin — or not done and why. Reply with: DONE,
DONE_WITH_CONCERNS (which) or BLOCKED (why); the commits; the test line.
