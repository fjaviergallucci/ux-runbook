### Task 19: The lessons, the README, the evaluation suite

Implements § 14 (the seeded lessons), § 15, and § 20 ("how each skill is tested").

**Files:**
- Create: `LESSONS.md`, `evals/<case>/…` (nine cases)
- Modify: `README.md` (rewritten)

**Interfaces:**
- Consumes: every skill and card.

- [ ] **Step 1: Write `LESSONS.md`.** The header says: appended, never rewritten; one dated entry per
  lesson; only what is true on any project. Seed it with generic statements of what the two source
  processes learned (read § 23's first three rows and the two interface runs): a brief that prescribes
  the design returns the session's own idea in several voices · nothing is shortlisted, detailed or drawn
  before the founder marks · his own sentences are the calibration for words · a number named to him is
  counted by tool first · options that are one idea in three palettes are not a choice · a direction
  described by adjectives goes many rounds, one described by references and refused tells converges ·
  a simulated reader agrees too easily: only the ranking carries information · safe briefs plus judges
  who reward reduction make work cleaner and emptier · one artefact per review, one question · a stage
  skipped is the founder's decision, logged · record whose proposals are picked and let that decide which
  seats stay. No product's name.
- [ ] **Step 2: Rewrite `README.md`:** what it is in four lines; install (`/plugin marketplace add <path or repo>`,
  then `/plugin install ux@ux-runbook`, then `npm install` in the kit for the browser scripts); start
  (`/ux:design`); the nine stages in one table; what is in the repository; when not to use it (carried
  over from version 1's README); that version 1 lives at the tag of that name once the branch lands.
- [ ] **Step 3: Scaffold one case to learn the layout.** `claude plugin eval init --bare brief-has-no-design`.
  Read what it wrote; every case below follows that layout exactly.
- [ ] **Step 4: Write the nine cases.** Each has a prompt that points at a small fixture under the case's
  own folder, and one grader stating the pass condition in plain sentences.

| Case | The prompt asks the session to | Passes when |
|---|---|---|
| `brief-has-no-design` | write the Structure brief for the fixture intent | the brief names the person, the job, the tasks and what the product can do, and names no component, layout, style, colour or font, and none of the session's own ideas |
| `fresh-brief-hides-the-system` | write the fresh-pass brief for the same intent, in a project whose profile describes a design system | nothing of the design system, the kit, sibling surfaces or today's screens is in the brief |
| `no-pick-without-the-founder` | continue a package whose Structure board is built and has no `PICK.md` | it stops at the decision page with one question; it writes no `CHOSEN.md`, opens no map, starts no Detail |
| `judge-does-not-redraw` | act as the usability judge on a fixture prototype with two planted faults | the ledger has the top line, a row per fault with where and a fix as "is → should be" and a done-when, a list of checks not run; no artefact file is modified |
| `audience-stays-blind` | act as the task reader in a folder that also holds the intent | it does not open the intent; the read opens with the caveat, answers the six points per task citing the screen, and ends with a ranking |
| `resume-from-disk` | continue a package with three stages approved, in a chat that asserts a fact contradicting the context | it runs `validate` and `next`, continues at Cast from the package's facts, and tells the user the chat's fact is not in the package |
| `correction-is-one-nod` | change one wrong label | it frames in one line, shows before and after, asks for one nod, casts no seat, writes the one-paragraph record |
| `profile-judge-cannot-tell` | act as the profile judge with a profile whose device trait is *unknown*, on a design that depends on it | the report puts that point in "cannot tell", addressed to the founder; it states no device as fact |
| `cold-implementer-finds-the-gap` | act as the cold implementer on a handoff folder with one state lacking a page and one string lacking a key | both are listed, each as a question or a guess |

- [ ] **Step 5: Run the suite.** `claude plugin eval . --no-publish --runs 1 --max-cost-usd 15 --allow-tools Bash Write Edit`.
  This step is run by the main session, not a sub-agent. Expected: nine cases scored. A case below 1.0 is
  a finding against the skill or the card it exercises: fix that file, re-run that case
  (`--case <name>`), repeat until it passes or the finding is recorded with its reason in
  `docs/design/DRY-RUN.md`.
- [ ] **Step 6: Run everything.** `npm test` → green. `claude plugin validate . --strict` → exit 0.
- [ ] **Step 7: Commit.** `git commit -m "feat: seeded lessons, the README and the evaluation suite"`.

