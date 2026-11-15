### Task 10: The eight judge cards

Implements § 9 and § 10.

**Files:**
- Create: `pool/judges/usability.md`, `truth.md`, `words.md`, `accessibility.md`, `visual-craft.md`,
  `system-fidelity.md`, `profile.md`, `cold-implementer.md`

**Interfaces:**
- Consumes: the card format (Task 9). Every judge's `never-reads` includes `maker-notes`, `author-map`,
  `other-ledgers`. Every judge's `## Output` points at `templates/outputs/LEDGER.md` (Task 12).
- Each card's `## Method` opens with the rule of § 9: the job before the craft.

- [ ] **Step 1: Write the cards** to these decisions (core checks are fixed; optional checks are the
  minimum set, each with the trigger given):

| Card | sits-at | loaded-with | Core checks | Optional checks — trigger |
|---|---|---|---|---|
| `judge.usability` | context, structure, detail, acceptance | none | Each task in the intent: can she finish it without help · each success criterion: met or not · every state in the intent has an answer · after the likeliest mistake there is a way back | first action — more than one action on the first screen · steps — three or more screens · siblings — the intent names sibling surfaces · destructive — any irreversible action · teaching — an empty first-ever state exists · overflow — any list or free text |
| `judge.truth` | structure, detail, look, acceptance | none | Every element that shows data or offers an action traces to a row of the context's inventory · nothing implies a state or capability the product lacks · every dependency is listed | public claims — the kind is a public page, or a string asserts something about the product · numbers — any digit in a string · data and privacy — a string mentions data, privacy or security |
| `judge.words` | detail, acceptance | none | Each line sounds like a person talking to this person · each language says the same thing and was written for itself · one word for one thing throughout | length — a string has a limit · errors — an error state exists · register — more than one language · machine tells — any sentence longer than a label |
| `judge.accessibility` | detail, look, acceptance | none | Every control has a name · reading and focus order follow the visual order · nothing depends on colour alone | contrast, measured — final colours exist · target size — final sizes exist · reflow — more than one width · focus in overlays — a dialog or overlay · reduced motion — any motion · announcements — content that changes without navigation |
| `judge.visual-craft` | context, look, acceptance | none | The eye lands first on the primary thing · spacing follows the scale and groups related things · elements share edges | typography — a new text style or running text · colour — a colour pair introduced or changed · components — a part used in a new way · icons — any icon · motion — any motion · empty, loading, error — that state is in the artefact · second theme — one exists · density — a list, a table or a working surface · widths — more than one |
| `judge.system-fidelity` | look, acceptance | none | Every value is a token · every part is the system's or is flagged as new · patterns match the sibling surfaces | new parts — anything flagged new · second theme — one exists · borrow list — a fresh pass ran: what the system lacks to make each thing marked |
| `judge.profile` | intent, structure, detail, look, acceptance | profile | The six criteria of § 10, in its order | one per optional characteristic present in the profile |
| `judge.cold-implementer` | handoff | none | Every question it would have to ask · every guess it would have to make · every reference that points outside the folder · every state without a page and every string without a key | — (an empty table with the line "none: this seat always reads the whole folder") |

  `judge.profile` also carries, from § 10: its verdict words (*works · works with changes · does not
  work*); "why it matters" names the trait and labels it fact or guess; the "cannot tell" list; the ranking
  at Structure; disagreements between profiles stated, never averaged; never invents a trait.
  Suggested model and effort for the judges (suggestions): `opus` / `high` for every judge, so that a
  judge reads work made on another model; `judge.system-fidelity` is `opus` / `medium`.
  `engine`: `judge.visual-craft` is `skill:design-audit`, and its typography check names the
  `typography` skill as its method when that skill is installed; every other judge is `own`.

- [ ] **Step 2: Run the tests.** `node --test tests/pool.test.mjs` → PASS (index test still `todo`).
- [ ] **Step 3: Commit.** `git commit -m "feat: the judge cards, the profile judge among them"`.

