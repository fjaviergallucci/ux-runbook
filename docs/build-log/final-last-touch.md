# The last touch — six minors from the re-review of the final wave

The final reviewer re-read the fix wave: **ready for the proving run, nothing must change first**;
0 Critical, 0 Important, 6 Minor (`N1`–`N6`), in `final-review.md` under `## Re-review of the fix wave`.
Read each whole there: its own fix is your requirement, with these rulings of the controller's. Rules as
in `task-20-fix-dispatch.md` (read it first: the kit's rules, this machine's rules, git, how to verify).

- **N1** — a project source that moved after its stage was stamped: the sentence goes in the conductor's
  "Before a stage" (and in `loop.md` where `validate`'s reports are listed, if that is where the others
  are): what `validate` prints, that the founder is told which source and which stage, and that the
  stage is reopened or the source put back — his choice, never the session's.
- **N2** — `skills/acceptance/SKILL.md`: the real example back in step 7, the clause that only keeps a
  pin green gone, the pin moved to the example. The skill stays at 200 lines or fewer.
- **N3** — "the proposal's own account" in `scripts/render.mjs` (`--help`, the printed line, the three
  comments) and `kit/KIT-CONTRACT.md`, in the reviewer's words; the flag stays `--without-notes`; the
  pins of `tests/render.test.mjs` move with them. Search the kit once more for "the makers' notes" and
  say what is left and why.
- **N4** — `skills/acceptance/SKILL.md`, the gate: "once Handoff is reopened".
- **N5** — Handoff checks the tokens at the start of step 3, before any page is copied.
- **N6** — one line at setup's gate and one in the README: a formatter or a trim-on-save editor run over
  the packages folder changes approved files, and `validate` will say so; keep such tools off it.

One more, the controller's: `docs/design/DRY-RUN.md`, last section — one sentence that the re-review of
the final wave found nothing above Minor and that its six minors were fixed.

Verify as the dispatch file says (`npm test`, `claude plugin validate . --strict`, clean status). One
commit: `fix: the six minors of the last re-review`, with the two trailer lines. Report:
`final-last-touch-report.md` here, a row for each. Reply: DONE / DONE_WITH_CONCERNS / BLOCKED; the commit;
the test line.
