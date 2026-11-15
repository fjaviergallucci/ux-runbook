### Task 5: The blind merge

Implements § 12 and § 16 (`merge`).

**Files:**
- Create: `scripts/lib/merge.mjs`, `scripts/merge.mjs`
- Test: `tests/merge.test.mjs`

**Interfaces:**
- Consumes: `validate` from Task 3.
- Produces: `mergeProposals(srcDir, outDir, { seed }): { letters: string[] }` ·
  `openMap(outDir): Record<string, { file: string, track: string | null, engine: string | null }>` ·
  `class SealedError extends Error`. Files written: `<outDir>/<letter>.json`, `<outDir>/MAP.sealed.json`.
  CLI: `node scripts/merge.mjs <proposals dir> --out <board dir>` and `node scripts/merge.mjs open <board dir>`.

- [ ] **Step 1: Write the failing tests:** three fixtures merge to letters `A`, `B`, `C`; the letter
  copies contain none of `author`, `engine`, `track`, `model`, `source`; with a fixed `seed` the order is
  the same twice and differs from file order for at least one of three seeds; the CLI's standard output
  contains the count and the letters and **no source file name**; `openMap` throws `SealedError` when
  `<outDir>/PICK.md` is absent and returns the map once it exists; one invalid proposal makes the whole
  merge throw before any letter file is written; 27 proposals throw.
- [ ] **Step 2: Run them.** → FAIL.
- [ ] **Step 3: Implement.** Without `seed`, shuffle with `crypto.randomInt`.
- [ ] **Step 4: Run them.** → PASS (7 tests).
- [ ] **Step 5: Commit.** `git commit -m "feat: blind merge with a sealed author map"`.

