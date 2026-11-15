### Task 11: The audience card, the generic persons, the index

Implements § 8 (generic persons), § 11, § 7 (`INDEX.md`).

**Files:**
- Create: `pool/audiences/task-reader.md`, `pool/persons/first-timer.md`, `daily-expert.md`,
  `hurried-on-a-phone.md`, `keyboard-user.md`, `second-language-reader.md`, `pool/INDEX.md`
- Modify: `tests/pool.test.mjs` (un-`todo` the index test; add the person tests)

**Interfaces:**
- Consumes: the card format; the person card's shape, fixed here and templated in Task 12 — header keys
  `id`, `profile` (a profile id or `none`), `specialty` (or `none`), `evidence` (`fact | guess | mixed`);
  body sections `## The moment` · `## The job` · `## What she never does` · `## The check`.

- [ ] **Step 1: Add the failing tests:** every file in `pool/persons` has the person header and sections;
  generic persons have `profile: none`; `audience.task-reader` has `loaded-with: person` and its
  `never-reads` includes `intent`; its body contains the caveat sentence of § 11 beginning "A simulated
  person agrees too easily"; the index test is live.
- [ ] **Step 2: Run them.** → FAIL.
- [ ] **Step 3: Write `audience.task-reader`** to § 11: screenshots only; the six answers per task; the
  ranking with gap sizes; the caveat verbatim on every read; a real person's read outranks it; its output
  is `templates/outputs/TASK-READ.md`. Suggested model and effort: `opus` / `medium`. One section, "On a public page", gives the other reading: stop,
  understand, click.
- [ ] **Step 4: Write the five persons**, each as someone in a moment, not a demographic: the first-timer
  who has never seen the product; the daily expert who resents an added step; the one hurried on a phone,
  one hand, interrupted; the keyboard user who never touches the pointer; the reader working in her
  second language.
- [ ] **Step 5: Write `INDEX.md`:** one table, columns `id`, `job`, `cast-when`, in shelf order.
- [ ] **Step 6: Run the tests.** → PASS.
- [ ] **Step 7: Commit.** `git commit -m "feat: the audience seat, the generic persons and the pool index"`.

