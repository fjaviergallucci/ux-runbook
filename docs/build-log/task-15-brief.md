### Task 15: Frame, Context, Intent, Cast

Implements § 4.0–4.3, § 5, § 8, § 10 ("in the pipeline").

**Files:**
- Create: `skills/frame/SKILL.md`, `skills/context/SKILL.md`, `skills/intent/SKILL.md`,
  `skills/cast/SKILL.md`, `skills/cast/references/presets.md`

**Interfaces:**
- Consumes: the package templates `00`–`03`, `people/`, `scripts/state.mjs`, `pool/INDEX.md`, the cards.
- Produces — `presets.md`, the default cast per kind and size:

| Size | Structure | Detail | Look | Handoff | Acceptance |
|---|---|---|---|---|---|
| adjustment | — | interaction designer or interface writer (whichever the change touches) · usability | visual designer · system fidelity (only if visual) | cold implementer | the judges that read it before |
| surface, flow | 3 structure describers (3 lenses) · usability, truth · task reader with the primary person and one contrast person | interaction designer, interface writer, prototype builder · usability, truth, words, accessibility · task reader | visual designer · visual craft, system fidelity, accessibility | cold implementer | usability, accessibility, system fidelity, visual craft · task reader |
| system | as surface, plus a fourth describer | as surface | Direction: 3 directions; then as surface | as surface | as surface |

  Added by rule, at any size from surface up: `judge.profile`, once per profile, when Frame says the
  experience is for one or several profiles; two contrasting profiles when it is for everyone and the
  project has profiles; `judge.truth` always on a public page; `judge.words` gets its own question to the
  founder when the kind is first-run, message or public-page.

- [ ] **Step 1: Un-`todo` the four skills' tests and run them.** → FAIL.
- [ ] **Step 2: Write `frame`** to § 4.0 and `references/routes.md` of the conductor: one exchange; runs
  `state.mjs init`; records for one profile, several or everyone; lists preset seats whose engine is
  missing; gate — he confirms in one message.
- [ ] **Step 3: Write `context`** to § 4.1: the one stage that reads the world; every fact carries its
  source; the inventory of what the product can show and do; at least three angles; asks for the
  founder's own words when words will matter; lists the project sources later stages may open; when a
  surface exists, has the cast's judges read screenshots of it first; loads the profile or drafts it with
  every trait a *guess*; gate — he corrects, and his corrections are written under *Reviewed by the
  founder*.
- [ ] **Step 4: Write `intent`** to § 4.2 and § 8: writes the person card on top of the profile; the
  success-criteria test; the tasks as a starting situation and a goal, never the path; the ten states,
  each filled or "cannot occur because"; the optional read by the profile judge.
- [ ] **Step 5: Write `cast` and `presets.md`** to § 4.3, § 7, § 9, § 10, § 12: starts from the preset;
  explains each seat in one line (what it catches, what it costs); states the checks on and off per judge;
  shows each seat's suggested model and effort and proposes — as suggestions he may change, never as
  rules — a judge or audience on a different model from the maker it reads, and describers spread across
  models;
  states whether a fresh pass runs at Structure, at Look or both, and which engines it uses; gives the
  count of agents per stage; nothing is removed silently later.
- [ ] **Step 6: Run the tests.** → PASS for the four.
- [ ] **Step 7: Commit.** `git commit -m "feat: the four opening stages"`.

