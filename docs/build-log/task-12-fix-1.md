# Task 12 — fix round 1 of 5

The review (head `75e4dd8`) found the file list exact, every row of the brief's test table asserted on the
real templates, twenty-four of twenty-five rulings holding, the package walk real (the true CLI, every
stage stamped, no shortcut), the tests two-directional and reaching the real code, and no secret-like
string anywhere. Two findings are Important — one of them made by a ruling of mine — and eight are Minor.
All are fixed now. Paths are under `templates/` unless another is given; "T:" is
`tests/templates.test.mjs`.

## Important

**I1 — `package/07-handoff/COVERAGE.md:10-18` has no place for which checks ran.** Design § 13, row 8:
COVERAGE holds "which checks ran and which did not, and why". The template has a "Checks not run" table,
but its Seats table (Stage · Seat · Loaded with · What it read · Ran on · Verdict) records no check that
ran, and the builder cannot open `03-cast.md` to find out. Add a "Checks run" column to the Seats table
and assert it in the test.

**I2 — the example in `package/04-structure/BRIEF.md:97-123` and `BRIEF-fresh.md:105-131` is a whole
design.** It was written to my ruling 19, which asked for "one small example"; the result is a complete
proposal — a bet ("free rooms first"), a set-aside first idea, a status count, a region, an expansion, a
booking dialog — that every describer and every outside model reads. Design § 14's first lesson is that a
brief which prescribes the design comes back in several voices, and a line saying "not a suggestion" does
not undo anchoring.
- **Ruling R133 (corrects ruling 19).** The briefs carry a **specimen of the syntax, not a solution**. It
  shows every proposal key, every role and every container once, in the format's own order, with words
  that name the part rather than fill it — "(the proposal's name)", "(a heading)", "(the main action)",
  "(an option)" — so that it reads as a catalogue of parts and cannot be mistaken for a way of solving
  anything. It still passes `validate` (one primary action per screen, a label on the expansion, options
  on the choice, the list and the nav, unique screen titles), and the test still runs it through
  `validate` and shows a broken copy fails. One sentence above it says what it is: every part once, in no
  meaningful arrangement; a proposal that resembles it has copied it. Nothing in it comes from the
  fictional product or from any product. The test (`T:356`) asserts that every role and every container
  appears in the specimen and that no word of the fictional product does.

## Minor — fixed now

- **M1** `package/07-handoff/HANDOFF.md:24` says one page "for each screen, state, language and theme";
  `package/06-look/LOOK.md:21` says one page for each screen, state and language, "each serving every
  theme" — which is what `scripts/accept.mjs` means (a check names a `page` and a `theme` separately).
  Align HANDOFF with LOOK.
- **M2** the ledger's order on a re-read: all eight judge cards say "each earlier finding's mark before
  any new finding" and design § 9 says marks, "then any new defect"; `outputs/LEDGER.md` puts
  `## Findings` (`:11`) before `## On a re-read` (`:33`) and `T:749` fixes that order. Put
  `## On a re-read` before `## Findings` (on a first read it holds the one line "first read"), and
  update the test's order.
- **M3** `package/07-handoff/acceptance.json:7` uses `"state": "empty"`, which is neither a name in the
  convention `package/05-detail/states.md:14` shows nor a row of the intent's ten-state table; a filler
  will copy it — use a name the two templates agree on. `ACCEPTANCE.md:44-50` describes each check's keys
  but not the file's required top-level `design` key: add it.
- **M4** `package/04-structure/CHOSEN.md:16` ("the pick in his words, exactly") and `:50` ("the words he
  picked with") ask for the same thing, and `outputs/PICK.md:9` holds it a third time. `:16` points at
  `PICK.md`; `:50` keeps what he asked to change.
- **M5** `briefs/audience.md:34` says do not open "the package", while `:29` hands pictures by absolute
  path that live inside it. Say: open nothing in the package but the pictures listed above. Its title
  (`:7`) carries the design's name, which can hint at what the design means to do: an audience brief's
  title names the seat and nothing of the design.
- **M6** an outside model is sent `BRIEF.md` and nothing else, so it gets none of the describer's method.
  Add a short `## How to work` to both briefs, before `## What to return`: consider whether no interface
  at all would do the job; write your first idea down and set it aside — it is the habit of the category
  — and look for another kind; propose one way, whole; use the real words she would read and the worst
  rows she would meet; play the hardest state through. No lens there (a describer started from a card is
  given its lens by its own brief). And `BRIEF.md:9` ("Everything you are given is on this page") is
  reworded to be true of both readers: this page is the whole brief; a describer started from a card is
  also given its card and a lens.
- **M7** `package/02-intent.md` has no `## What the readers found`. Design § 4.2 offers an optional read
  of the intent by the profile judge, and CHOSEN, DETAIL, LOOK and REPORT each have such a section. Add
  it, marked as filled only when that read was cast, before `## Reviewed by the founder`.
- **M8** many brace instructions run two to four sentences (for example `package/01-context.md:33-35`,
  `package/05-detail/DETAIL.md:52-54`). An instruction in braces is at most two lines; what does not fit
  is an instruction that tries to teach the stage — the stage's skill will do that — so cut it to what
  the filler must put there.

## Rules unchanged

Generic; no key-like string; do not change anything under `scripts/`, nor `pool/audiences/task-reader.md`,
`pool/persons/*.md`, `pool/INDEX.md`; stage by explicit path; commit on `v2-pipeline`; never push, never
amend. Two commits landed after yours (`68f1444`, `f81dab7`: wording in two pool files, and one test
file): work on the tree as it is. Run the three covering test files while iterating and `npm test` once
at the end.

One commit: `fix: the brief shows a specimen, not a design, and the templates' smaller findings` (same two
trailer lines). Append "Fix report — round 1" to `task-12-report.md` and reply with the short status
contract.
