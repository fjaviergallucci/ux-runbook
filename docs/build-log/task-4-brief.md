### Task 4: Drawing a proposal

Implements § 4.4 (`render`) and § 16.

**Files:**
- Create: `scripts/render.mjs`
- Test: `tests/render.test.mjs`

**Interfaces:**
- Consumes: `validate` from Task 3.
- Produces: `renderProposal(proposal, { letter }): string` (a complete HTML document that links `kit.css`
  beside it) · CLI `node scripts/render.mjs <proposal.json> --kit <kit dir> --out <file.html> [--letter A]`,
  which copies `<kit dir>/kit.css` next to the output. Exit 1, naming the path, when the proposal is
  invalid.

- [ ] **Step 1: Write the failing tests** on `renderProposal(fixture, { letter: 'B' })`:
  the document contains each screen's title inside an element with class `ux-frame` and
  `data-screen="<id>"`; the letter `B` and the proposal's name, bet and cost appear once in a header; an
  item with `id: "free-count"` carries `data-ux="free-count"`; a primary action has class
  `ux-action is-primary`; a `dialog` screen is drawn inside its own frame with class `ux-dialog`; an item
  whose text is `<script>alert(1)</script>` appears escaped and no `<script` tag exists in the output; the
  text `Reunión — sala 3 🙂` appears intact and the document declares `charset="utf-8"`; the keys
  `author`, `engine`, `track` never appear in the output.
- [ ] **Step 2: Run them.** → FAIL.
- [ ] **Step 3: Implement.** One `<section class="ux-frame">` per screen, in order; containers nest; a
  `note` renders as `ux-note`; every string goes through one escape function.
- [ ] **Step 4: Run them.** → PASS (8 tests).
- [ ] **Step 5: Draw the three fixtures by CLI** into `tests/.tmp/board/`. Expected: three `.html` files
  and one `kit.css`.
- [ ] **Step 6: Commit.** `git commit -m "feat: render draws a proposal in the shared kit"`.

