### Task 17: Detail and Look

Implements § 4.5, § 4.6, § 12 (fresh pass at Look).

**Files:**
- Create: `skills/detail/SKILL.md`, `skills/look/SKILL.md`, `skills/look/references/direction.md`

**Interfaces:**
- Consumes: `templates/package/05-detail/*`, `06-look/*`, `scripts/shots.mjs`, `accept.mjs`, `page.mjs`,
  the cards, the conductor's `loop.md` and `fresh-pass.md`.
- Produces in the package: `05-detail/DETAIL.md`, `states.md`, `strings.json`, `prototype/`, `shots/`,
  `reads/`; `06-look/LOOK.md`, `screens/`, `shots/`, `measures.md`, `reads/`, and with a fresh pass
  `fresh/`.

- [ ] **Step 1: Un-`todo` the two skills' tests and run them.** → FAIL.
- [ ] **Step 2: Write `detail`:** makers in this order — the interaction designer, then the interface
  writer (briefed with the founder's own lines from the context), then the prototype builder; screenshots
  of every page; the readers the cast names; blocking findings fixed in one round and re-read by a fresh
  judge; the gate on the prototype; the words as a separate question when the kind is first-run, message
  or public-page; a truth finding that needs a capability the product lacks becomes a dependency, never a
  silent removal.
- [ ] **Step 3: Write `look`:** the two modes of § 4.6; inside a system, one visual designer and variants
  only on one named axis; the measured-values table; the fresh pass at Look (the screen that carries the
  idea, shown beside the system version; the three outcomes; a borrowed thing rebuilt on the tokens and
  flagged as an extension). `references/direction.md`: two or three directions of different kinds, each
  named with a thesis and a stated cost, rendered on the same detailed screen, and the rule ported from
  `master:phases/3-DIRECTION.md` that three shades of one safe idea are not a choice; the pick becomes
  the tokens and the profile is updated. Until a direction-maker card exists, the visual designer is cast
  once per direction, each with a different lens; palettes and pairings may be drawn from a design-data
  skill when one is installed.
- [ ] **Step 4: Run the tests.** → PASS for both.
- [ ] **Step 5: Commit.** `git commit -m "feat: the Detail and Look stages"`.

