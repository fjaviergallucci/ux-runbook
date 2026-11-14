### Task 18: Handoff, Acceptance and the implementer's guide

Implements § 4.7, § 4.8, § 13, § 14.

**Files:**
- Create: `skills/handoff/SKILL.md`, `skills/acceptance/SKILL.md`, `reference/IMPLEMENTER-GUIDE.md`,
  `reference/ANTI-PATTERNS.md`

**Interfaces:**
- Consumes: `templates/package/07-handoff/*`, `build/*`, `08-acceptance/*`, `scripts/accept.mjs`,
  `judge.cold-implementer`.
- Produces in the package: the eight files of § 13 with `prototype/` and the token file copied in;
  `08-acceptance/REPORT.md`, `FIXES.md`, `checks.json`.

- [ ] **Step 1: Un-`todo` the two skills' tests and run them.** → FAIL.
- [ ] **Step 2: Write `handoff`:** assembles the folder from what is approved; copies the prototype, the
  final screens and the token file in, with the token file's source path and commit; writes `PARTS.md`
  from the component source the profile names, never from memory; writes the checks and **runs them on
  the prototype first** (`accept.mjs prototype`) — a check that fails there is wrong and is fixed before
  the handoff; converts `strings.json` to the profile's `strings-format` when one is named; launches the
  cold implementer with the folder only; every item it lists is answered in the folder or given a written
  default; the gate — one go.
- [ ] **Step 3: Write `acceptance`:** a separate session; reads the handoff folder and `build/`; drives
  each state from `STATES.md` the way the profile's "how a browser check is run here" says; evaluates the
  in-page checks through that driver (`accept.mjs inpage` gives the file); screenshots for the judges;
  one audience read; `REPORT.md` — each item *matches* or *deviates*; an accepted deviation is logged and
  the package brought up to date; a fix goes out in `FIXES.md` as a slice; a fix the size of a correction
  may be applied after the founder's nod; appends the lessons.
- [ ] **Step 4: Write `reference/IMPLEMENTER-GUIDE.md`** for the session that builds: port the four rules
  of `master:phases/6-IMPLEMENT.md` (never guess a component's interface; tokens, never raw values; build
  every state; translate the prototype, never paste it) and the loop of `master:phases/7-QA-LOOP.md`
  (measure, do not trade adjectives); add the three rules of § 13 and the three files to write back.
  `templates/package/07-handoff/HANDOFF.md` already points here; the handoff skill copies this guide into
  the folder so it stands alone.
- [ ] **Step 5: Write `reference/ANTI-PATTERNS.md`:** port `master:reference/ANTI-PATTERNS.md`, keep its
  two lists, and add the process failures this design guards against: a brief that prescribes the design;
  a shortlist before the founder marks; a judge that redraws; a simulated read quoted as evidence; a fresh
  screen handed off as it came; a check skipped without a line saying so.
- [ ] **Step 6: Run the tests.** → PASS for both; `npm test` all green.
- [ ] **Step 7: Commit.** `git commit -m "feat: the Handoff and Acceptance stages and the implementer's guide"`.

