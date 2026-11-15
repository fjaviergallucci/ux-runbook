# Task 20, step 5b — fix round 1 of 5

Two reviews of the three fix waves (head `557e6e1`): the words (`task-20-fix-review-words.md`, findings
`W1`–`W4`, `M1`–`M11`) and the scripts (`task-20-fix-review-scripts.md`, findings `S1`–`S16`). Both found
every item in the file that owns it; both ask for changes. Read each finding whole in its review file —
this page gives the controller's ruling on each, and wins where it differs from a review's "Fix".

Rules as in `task-20-fix-dispatch.md` (read it first if you have not: the kit's rules, the machine's
rules about browsers and keys, git). Scripts test-first, each new condition hand-mutated once.

## Critical

- **S1 — Handoff's pointer check.** The plain `alone.mjs <package>/07-handoff` stays at step 3. The
  `--package` run moves to after the folder's last file is written (after step 7), before the cold
  implementer is started; both the skill and `folder.md` say so. The run-as-written test uses a package
  that has a root `DECISIONS.md` and runs the check where the skill now runs it; it also holds
  `accept-inpage.js` in its folder (S16). Probe it as the reviewer did.
- **S2 / W2 / S7 — the graft path and the blind protocol.** `skills/structure/references/rounds.md`: the
  redrawn pick is drawn a second time with `--without-notes` and pictured with `--first-screen`; an
  audience re-reading a graft is handed the pictures drawn without the makers' notes, whole and first
  screen, and no other. `skills/design/references/blind.md` steps 5–7: point to Structure's step 7 for
  the commands rather than keep a second copy of them, and say who is handed which. A pin on each.

## Important

- **W1 → Ruling R189 (corrects R159): the kit writes a driver only for a build that opens as files.**
  The kit's browser library opens local files and nothing else. `driving.md`'s section says so in its
  first sentence and is for that case alone. A build that needs a server or a sign-in, in a project
  whose profile names no script for a browser check, has no driver the kit can write: Acceptance says
  so to the founder, open, and stops, as step 2 stops on a credential. The bullet about taking a
  sign-in "from where it is kept" goes: no step of the kit has a session write code that fetches a
  credential. With M8: his yes to writing the driver is written under "Reviewed by the founder" of
  `REPORT.md` before the driver is written; the question asks one thing; `scripts/lib/browser.mjs` is
  in the skill's Reads.
- **W3 — Handoff never fills in an answer he did not give.** An item he leaves unanswered stays open:
  listed under `findings` as open, and named in the gate's question. A default is written, marked
  "Default:", only where his answer for that entry says to take it. Both files; the pins with them.
- **S3 — a pointer left in an approved file.** The `--package` run may exit 1 only so: every place it
  prints is in a file that was approved at an earlier stage and copied in unchanged, and each is listed
  in `PARTS.md`, which says where the pointer is and what it stood for **without writing the name it
  points to**. Then the stage goes on, and those places are put to the founder with the gate, as open
  findings. Any other place is mended before the cold implementer starts. Say it in the skill's step
  and in `folder.md`, so that "must exit 0" and "is not rewritten" no longer meet.
- **S4 — a criterion over two blocks.** `card.mjs check` refuses, in a profile, a block inside a
  characteristic (and inside a specialty's `####`) that opens with none of the labels; the test has the
  list-after-a-blank-line form, and `traits` on it is refused through `check`. With S12 (the two
  sentences of `templates/people/PROFILE-CARD.md` that count "four fields" are worded without the
  count) and S13 (a refusal prints the line's number and the label, never the line).
- **W4 / S14 — `docs/design/DRY-RUN.md` is made true:** the rulings run R157 to R190 and each of
  R186–R190 has a row; the sentence about "wave B" cells goes; R175's row says the page draws the
  heading (R186); F46's and F48's rows say what was changed; R161's row counts three ids; R180's row
  says where the check now runs; R159's row is brought to R189. Add this round's changes where a row's
  "fixed in the kit" cell is now different.

## Minor — fixed now

- **S5** — an empty block between two texts: as the review's fix.
- **S6 / M5 → Ruling R190: a first-screen picture is taken at Structure only.** From Detail on,
  "without scrolling" is answered by a check, not by reading a picture: the `in-viewport` type of
  `accept.mjs`. `loop.md` and `templates/briefs/audience.md` say "at Structure"; the audience's brief
  from Detail on drops the line, and where a criterion of the intent says "without scrolling", the
  judges' briefs at Detail and Look point to the measured check. If no sentence of Detail's or Look's
  skill has the conductor write an `in-viewport` check for such a criterion, add it where the checks
  file is written.
- **S8** — `oneLine` maps `\x0b`, `\x0c` and `\x85` to a space; `writeString` refuses any other C0
  character but the tab; `writeItem` refuses the backslash item, as it refuses a `"`. The header's
  claim about YAML stays true as worded, or is worded to what holds.
- **S9** — entries listed with `lstat`; what a link is, said in `--help` and refused or passed over as
  it says; a `--package` that lies inside the folder is bad usage.
- **S10** — one sentence in `kit/KIT-CONTRACT.md` for the page without notes.
- **S11** — setup's `README.md` line for `profiles/` names the check; Context runs `card.mjs check` on
  a profile it drafted or changed, before its gate (mind the limits: setup is at 200 lines, Context
  at 199).
- **S15** — `loop.md` § 7 names the "Accepted deviations" heading among the page's parts.
- **M1** — Context's "Project sources", and its template, mark the example data as they mark today's
  screen; the prototype builder's card says what it does when none is handed (it asks, through the
  conductor; it makes none up).
- **M2** — "its model and effort". **M4** — the judge brief's reply line stops after "says the reply
  is". **M6** — the judges' "Never" line reads "write it once, as 'accepted at <stage>', with no fix
  and no severity of its own". **M9** — Detail says where an unanswered entry is listed: under
  `findings` on the decision page, and named in the gate's question.
- **M3** — `LESSONS.md` is appended to, never rewritten: a later entry answers the seeded one (his
  words are asked once, at every design).
- **M7** — the conductor's line under the designer's list carries the outcome in full, the answer's
  number only beside it.
- **M10** — rewrap the lines named, where no pin holds the line break.

## Not changed, and why

- **R173 stands as built** (the scripts review, on the implementer's first concern): the page counts
  the question's and the recommendation's marks together, and nothing a seat or a finding says.
- **M11** (three evaluation fixtures keep the cast sheet's old column names): left; a fixture is a
  package stamped by an earlier kit. Minor (deferred).
- The implementer's concerns 2, 3 and 7 of wave B: accepted as they are.

## When you have finished

`NODE_OPTIONS=--dns-result-order=ipv4first npm test` → no failure; `claude plugin validate . --strict`
→ exit 0; `git status --short` → clean. Commits: `fix: …` by subject, as few as read well, each with
the two trailer lines. Write `task-20-fix-round-1-report.md` here: a row for each finding above — what
changed, the test or pin — or not done and why. Reply with the short status contract.
