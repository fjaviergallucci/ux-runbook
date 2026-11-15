### Task 16: Structure

Implements § 4.4, § 12.

**Files:**
- Create: `skills/structure/SKILL.md`

**Interfaces:**
- Consumes: `templates/package/04-structure/*`, `scripts/describe.mjs`, `merge.mjs`, `render.mjs`,
  `shots.mjs`, `page.mjs`, the conductor's `blind.md` and `fresh-pass.md`, the maker cards, the brief
  templates.
- Produces in the package: `04-structure/BRIEF.md` (as the founder approved it), `proposals/*.json`,
  `board/<letter>.json|.html`, `board/MAP.sealed.json`, `shots/`, `reads/`, `decision.html`, `PICK.md`,
  `CHOSEN.md`; with a fresh pass also `BRIEF-fresh.md`, `fresh/` (the screens as they came).

- [ ] **Step 1: Un-`todo` the `structure` tests and run them.** → FAIL.
- [ ] **Step 2: Write the skill.** Its steps, in this order and with these stops:
  1. Write the brief from the intent. It holds context and nothing of the design.
  2. **Stop: show the brief to the founder.** Nothing is sent before his yes.
  3. Launch the describers in one message (each with a different lens), and any outside describer through
     `describe.mjs`. With a fresh pass: launch its makers from `BRIEF-fresh.md`, then a transcriber per
     fresh screen.
  4. Put every proposal in `proposals/`, tagged `track` and `engine`. Run `merge`, then `render` for each
     letter with the project's kit, then `shots` at the primary and the phone width.
  5. Launch the readers the cast names, by letter. Their briefs list the map, the proposals folder and the
     makers' files under "Do not open".
  6. Write `decision.json` and build the page: the options, one line per seat, one recommendation, one
     question; with a fresh pass, the gallery beneath.
  7. **Stop: the founder picks.** Write `PICK.md` in his words. Only then may the map be opened.
  8. A pick with named grafts is redrawn and re-read once. A rejection of everything reopens Intent or
     Context; no further proposals are asked for against the same brief.
  9. Write `CHOSEN.md` with its carry list; stamp it.
- [ ] **Step 3: Run the tests.** → PASS for `structure`.
- [ ] **Step 4: Commit.** `git commit -m "feat: the Structure stage — blind proposals, one kit, the founder's pick"`.

