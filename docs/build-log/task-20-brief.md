### Task 20: The dry run

Implements § 19's first paragraph: each skill has been used once, end to end, before the proving run.
**Run by the main session.** No founder is involved: his answers are read from a file, which makes this a
test of the mechanics and of nothing else.

**Files:**
- Create: `tests/dryrun/project/` (a fictional project: the room-booking product, a `tokens.css`, no
  profile yet), `tests/dryrun/FOUNDER-ANSWERS.md` (one answer per gate, written before the run),
  `docs/design/DRY-RUN.md`

**Interfaces:**
- Consumes: the whole kit, installed from the worktree (`/plugin marketplace add /mnt/data/Downloads/Proyectos/ux-runbook-v2`,
  `/plugin install ux@ux-runbook`), or loaded by path if the session cannot install.

- [ ] **Step 1: Write the fictional project and the answers file.** The answers: the request ("the front
  desk needs to see what is free right now"); the corrections to the context; the approval of the intent;
  the cast accepted with one seat removed; a pick at Structure by letter position ("the second"), since
  letters are shuffled; approvals at Detail and Look; the go at Handoff.
- [ ] **Step 2: Run setup, then the nine stages,** size `surface`, kind `working-surface`, no fresh pass,
  no outside engine, the three describers on three lenses. At each gate, read the answer from the file
  and write it into the artefact as the founder's words. Before each stage, run `state.mjs validate`
  and `next` and read the stage's inputs from the package, never from what the session remembers. (A true
  change of session between stages is the proving run's test, § 19; here only the mechanics are tried.)
- [ ] **Step 3: Stand in for the build.** Copy the handoff's prototype to a temp folder as "the build",
  write `build/BUILD.md` and `build/STATES.md` pointing at its pages, and run Acceptance against it.
- [ ] **Step 4: Check the result by script.** `node scripts/state.mjs validate <package>` → ok;
  `node scripts/accept.mjs prototype …` → all pass; the handoff folder contains the eight files of § 13
  and no path pointing outside itself (`grep -rn '\.\./' 07-handoff` returns nothing but the token file's
  recorded source).
- [ ] **Step 5: Write `docs/design/DRY-RUN.md`:** for each stage, what ran, how many agents, what broke
  and how it was fixed in the kit; the cold implementer's list and what answered each item; every place a
  skill's wording had to change; what the dry run cannot show (anything that depends on a real founder
  or a real design system). Fix each defect found in the skill, card, template or script that owns it,
  with a test where the defect was mechanical.
- [ ] **Step 6: Final gates.** `npm test` → green. `claude plugin validate . --strict` → exit 0.
  `git status --short` → clean after the commit. `git log --oneline master..v2-pipeline` → one commit per
  task.
- [ ] **Step 7: Commit, and stop.** `git commit -m "test: a dry run of the whole pipeline on a fictional surface"`.
  **Do not push, merge or tag.** Report to the founder: the kit is on `v2-pipeline` in the worktree; the
  proving run (the radiologist's shell, § 19) is the next step and needs his go, setup in that project,
  and the profession's profile.

---

## What this plan does not do

Named so nobody does them by momentum: the proving run; setup in any real project; the doctor profile;
replacing `master`, tagging version 1, pushing; the cards the design lists as "added when first needed"
other than the three the approved fresh pass and outside engines require (`maker.outside-describer`,
`maker.screen-generator`, `maker.transcriber`); a worked example (§ 17: it waits for the proving run).
