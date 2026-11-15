# After evaluation run 4 — one fault of the kit, two of the cases

Read `eval-run-4-diagnosis.md` (same folder) whole: it has the evidence and the exact changes. The
controller rules: **all three as the diagnosis proposes.** Rules as in `task-20-fix-dispatch.md` (read it
first: the kit's rules, this machine's rules, git, how to verify).

1. **`brief-has-no-design` — the kit's fault (the controller's ruling R160 caused it).** The two brief
   templates of Structure (`templates/package/04-structure/BRIEF.md` and `BRIEF-fresh.md`) had the
   conductor list "every state the intent says she must be told about", and sessions copied what the
   intent says the screen must tell her — a piece of design in a brief that must hold none. **Ruling
   R193:** the states are listed one line each, **named by what has happened, never by what she is told
   in it** (as: "the list is empty", "the reload failed"); what the screen shows then is the maker's to
   write. R160's rule stands (the selection is by a written rule, not by weighing). Both templates; the
   Structure skill or its seats page wherever the same instruction is given; the pin at
   `tests/skills.test.mjs` (near line 6202) gains the new clause. Search the kit for any other place
   that tells a conductor to copy "what it must tell her" into a brief.
2. **`resume-from-disk` — the case's fault.** The two graders' patterns, as the diagnosis gives them, in
   `validate-run.md` and `next-run.md`; the loop form added to the sample commands in
   `tests/evals.test.mjs`.
3. **`fresh-brief-hides-the-system` and `brief-has-no-design` — the cases' fault.** `gives-the-tasks.md`
   in both, and the `\s+` forms in the other section graders, as the diagnosis gives them: a line that
   wraps between two words must not fail a grader.

Do not run `claude plugin eval`: the runs are paid and the cap is the founder's. Verify with `npm test`,
`claude plugin validate . --strict`, a clean status. Two commits: `fix: a Structure brief names a state by
what has happened, never by what she is told` and `test: three evaluation graders take a wrapped line and
a looped command`, each with the two trailer lines. Report in `eval-run-4-fix-report.md` here. Reply:
DONE / DONE_WITH_CONCERNS / BLOCKED; the commits; the test line.
