# Task 10 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

1. **The card format and its checker exist** (Task 9): `pool/CARD-FORMAT.md` is the contract,
   `scripts/lib/card.mjs` exports `validateCard`, and `tests/pool.test.mjs` already runs it on every file
   under `pool/judges`. Read `CARD-FORMAT.md`, one maker card for the voice, and `card.mjs` before
   writing. A judge has **two to six** core checks (the brief of Task 9 said five; ruling R4): the profile
   judge has the six criteria of design § 10, in its order.
2. **`## Output` names `templates/outputs/LEDGER.md`**, as the brief says, though that file arrives in
   Task 12. `tests/pool.test.mjs` already holds two tests for the paths a card names (Task 9): a live one
   for paths under `scripts/`, `kit/` and `pool/`, and one marked `todo` for paths under `templates/`,
   which Task 12 makes live — add no third. Each judge's Output also says, in three or four lines, what a
   ledger holds (the verdict and the first fix; a findings table; the checks not run, each with its
   reason; what was not looked at), so the card can be followed before the template exists.
3. **`never-reads`** of every judge includes `maker-notes`, `author-map`, `other-ledgers` — a test in
   `tests/pool.test.mjs` asserts it for every file under `pool/judges`. Write the three exactly so.
4. **The optional checks are a pool, not a routine** (design § 9): the card's Method says that a judge
   runs its core checks always; that it runs an optional check only when its trigger is seen **in the
   artefact it was handed** (the trigger is re-tested there, not taken from the cast sheet); and that its
   ledger lists every optional check it did not run, with the reason. Each trigger in the table is
   something observable, written so two readers would agree whether it holds.
5. **`judge.cold-implementer`**'s optional-checks table has the header row and no rows, with the brief's
   line under it — if `validateCard` refuses text beside an empty table, say so in your report and do not
   change `card.mjs` (that is the controller's to rule).
6. **Engines.** `judge.visual-craft` wraps the installed design-audit skill: write `engine` with the
   skill's installed name, plugin prefix included if it has one (the visual designer's card, from Task 9,
   shows the spelling used for a plugin's skill). Its typography check names the typography skill as the
   method "when installed", and gives the method in the card's own words for when it is not. Every card
   must stand without its engine. Every other judge is `own`.
7. **Suggested model and effort** as the brief gives them (`opus` / `high`; system fidelity `opus` /
   `medium`); `verified` is today, 2026-11-14. **Add each judge's row to `pool/MODELS.md`** — the test
   that compares that table with the cards must stay green.
8. **Generic**, as in Task 9: no product, person, profession or project rule; examples use the kit's
   fictional product (a room-booking tool for a small clinic's front desk); "she" is the person the design
   is for, as in the design. `judge.profile` is loaded with a profile it is handed — it names no
   profession. Sources listed in design § 23 are read-only and are rewritten generic; a source with a
   third-party licence keeps its attribution in `## Borrowed`.
9. **Read of the design:** § 9 (judges and the ledger), § 10 (the professional profile judge), § 8 (profile
   and person, for what the profile judge is handed), § 7 (the pool), § 13 (the handoff folder, for the
   cold implementer), § 23, and the `judge` rows of § 24. Nothing else of that document; never the whole
   plan.
10. A judge never fixes, never proposes a redesign, and never approves: it reports. Each card's `## Never`
    says so in its own words, with the two or three temptations particular to that seat.
11. No card longer than it needs to be: past about 130 lines, cut.
12. **The names used in `reads` and `never-reads` are a vocabulary** (added in Task 9): `CARD-FORMAT.md`
    holds a table of them and a test compares it with the cards. Reuse the names that are there; add a
    row for each new name your cards need (`maker-notes`, `author-map`, `other-ledgers` among them), with
    one line saying what it is.
