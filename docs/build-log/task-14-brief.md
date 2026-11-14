### Task 14: Setup

Implements § 4.9, § 12 (the project kit), § 15 (the profile).

**Files:**
- Create: `skills/setup/SKILL.md`, `skills/setup/references/project-kit.md`

**Interfaces:**
- Consumes: `templates/project/PROFILE.md`, `templates/project/LESSONS.md`, `kit/KIT-CONTRACT.md`,
  `kit/grey/`, `pool/INDEX.md`.
- Produces in the project: `<packages>/PROFILE.md`, `<packages>/LESSONS.md`, `<packages>/kit/kit.css`
  (and `parts.html`), `<packages>/pool/{profiles,persons,makers,judges,audiences}/`.

- [ ] **Step 1: Un-`todo` the `setup` tests and run them.** → FAIL.
- [ ] **Step 2: Write the skill** (sections `## Question` · `## Reads` · `## Writes` · `## Steps` · `## Gate` · `## Never`):
  the question — "what must be true of this project before its first design?"; the steps — read the design
  system that exists (token files, component source, its documents), never invent a parallel one; ask the
  founder only what cannot be read, one question at a time (the product in one sentence, the languages,
  his standing rules for interfaces, the professions it serves); write the profile; build the project kit;
  write a profile stub per profession with every trait marked *guess*; run the engine check — for each
  first-set card, is its engine installed and does it answer one trivial call — and record the result in
  the profile; the gate — he corrects the profile once.
- [ ] **Step 3: Write `references/project-kit.md`:** copy `kit/grey/` into the project; restyle each class
  of the contract to look like the project's default part, using only the project's token file; when the
  tokens are not plain CSS, export them to one CSS file and record the source path and commit; draw
  `parts.html` and screenshot it with `scripts/shots.mjs` for the founder's look; never import the real
  components.
- [ ] **Step 4: Run the tests.** → PASS for `setup`.
- [ ] **Step 5: Commit.** `git commit -m "feat: setup writes a project's profile and its kit"`.

