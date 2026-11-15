### Task 9: The card format, its tests, and the eight maker cards

Implements § 7.

**Files:**
- Create: `pool/CARD-FORMAT.md`, `pool/MODELS.md`, `pool/makers/structure-describer.md`, `outside-describer.md`,
  `screen-generator.md`, `transcriber.md`, `interaction-designer.md`, `interface-writer.md`,
  `prototype-builder.md`, `visual-designer.md`
- Test: `tests/pool.test.mjs`

**Interfaces:**
- Produces — the card header (flat frontmatter), every key required: `id` (`<shelf>.<name>`), `shelf`
  (`maker | judge | audience`), `job` (one question or one sentence), `sits-at` (list of stages),
  `cast-when` (one sentence), `presets` (list of sizes), `loaded-with` (`profile | person | none`),
  `reads` (list), `never-reads` (list), `engine` (`own`, `skill:<name>`, `model:<provider>` or
  `tool:<name>`), `suggested-model` (`fable | opus | sonnet | haiku | none`), `suggested-effort`
  (`low | medium | high | xhigh | max | none`), `verified` (date).
- Body sections, in this order: `## Method` · `## Output` · `## Never` · `## Borrowed` (may say "nothing").
  A judge adds, before Method: `## Core checks` (two to five) and `## Optional checks` (a table with
  columns `id`, `trigger`, `method`).

- [ ] **Step 1: Write the failing tests** (they will cover every card as the next tasks add them): every
  `.md` under `pool/makers`, `pool/judges`, `pool/audiences` parses and has every header key; `suggested-model` and `suggested-effort` hold one of
  the values the format allows; `pool/MODELS.md` exists, carries a `Reviewed:` date and the word
  `suggestion`; `id` matches
  the file's shelf and name; `sits-at` is a subset of `STAGES`; the body has the required sections in
  order; a judge has two to five core checks and every optional-check row has a non-empty trigger; no file
  under `pool/`, `templates/`, `skills/`, `kit/`, `reference/`, `scripts/` or the root `README.md` and
  `LESSONS.md` contains `Verbato` or `Versa` (case-insensitive); `pool/INDEX.md` has exactly one row per
  card and its `id`, `job` and `cast-when` cells equal the card's header (this last test is marked
  `todo` until Task 11 writes the index).
- [ ] **Step 2: Run them.** → FAIL (no cards).
- [ ] **Step 3: Write `CARD-FORMAT.md`** — the contract above, with the three engine rules of § 7: a card
  works without its engine; a missing engine is said at Frame; outside engines are off unless the profile
  lists them in `engines-on`. It states that `suggested-model` and `suggested-effort` are suggestions,
  never instructions (spec § 7, "Model and effort are suggestions"). Write `pool/MODELS.md`: a `Reviewed:`
  date, the four reasons of that section in the kit's own words, and one table of every seat with its
  suggested model and effort — the cards hold the values, this file holds the reasoning.
- [ ] **Step 4: Write the eight maker cards** to these decisions:

| Card | sits-at | engine | What the card must decide |
|---|---|---|---|
| `maker.structure-describer` | structure | own | Takes one **lens** named in its brief (fewest steps · guided · defaults first · in place). Writes the first idea down and sets it aside. Considers "no interface". Returns one proposal as JSON in the walkthrough format. Never names a component, never sees another proposal, the session's idea or the current screen. |
| `maker.outside-describer` | structure, look | `model:<provider>` | The same brief sent with `scripts/describe.mjs`. At Look only inside a fresh pass. Without the engine: not cast. |
| `maker.screen-generator` | structure, look | `tool:stitch` | Fresh pass, or one extra describer. Generates the one or two screens that carry the idea from the fresh brief, with no design system attached. Lists the tool's known behaviours with the verified date (slow: minutes per screen; never retry on a timeout, fetch the result). Without the engine: a Claude maker writes one free HTML screen with a taste skill as its lens. |
| `maker.transcriber` | structure | own | Reads a screen (HTML or a screenshot) and writes its structure as walkthrough JSON. Adds nothing, improves nothing, drops the paint. Marks what it could not read. |
| `maker.interaction-designer` | detail | own | Every state of the intent's table, every rule (validation, focus order, keyboard), every edge case. Asks nothing: a state the intent omitted is reported, not invented. |
| `maker.interface-writer` | detail | own | Every string in every language, written for the surface, never one language from the other; the founder's own lines as the bar when the brief carries them; a why-line where two languages diverge; lengths counted by tool. |
| `maker.prototype-builder` | detail | own | Static HTML on the shared kit; one description per screen plus `strings.json` generates every state × language page; `data-ux` on every element the spec names; an index page. |
| `maker.visual-designer` | look | `skill:frontend-design` | Static pages that link the project's token file. Inside a system: hierarchy, spacing, emphasis, density, responsive, themes; variants only on one named axis. Writes the table of measured values. In a fresh pass, rebuilds what the founder marked as named extensions. |

  Suggested model and effort for the makers (suggestions): structure describer `fable` / `high`; outside
  describer and screen generator `none` / `none` (they run on their engine); transcriber `sonnet` /
  `medium`; interaction designer `fable` / `high`; interface writer `fable` / `high`; prototype builder
  `opus` / `medium`; visual designer `fable` / `high`.
- [ ] **Step 5: Confirm the visual designer's engine.** § 24 leaves it to the build: read
  `frontend-design` and each taste or motion skill installed on this machine (list them with
  `claude plugin list` and the skills folders), keep `skill:frontend-design` as the default unless one
  fits a system-bound product better, and record in the card's `## Borrowed` which were read and why the
  choice. The card's Method must stand without any of them.
- [ ] **Step 6: Run the tests.** → PASS, with the index test still `todo`.
- [ ] **Step 7: Commit.** `git commit -m "feat: the card format and the maker cards"`.

