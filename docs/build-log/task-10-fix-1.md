# Task 10 — fix round 1 of 5

The review (head `7a078a0`) found all eight cards matching the brief's table, the rulings and design
§ 9–10: core checks verbatim, triggers as given, blinds intact, every script flag real, each Never a real
temptation, the tests biting. One finding is Important; twelve are Minor and are fixed now, because the
cards are followed literally. All paths are under `pool/judges/` unless another is given.

## Important

**I1 — `profile.md:6`: `cast-when` drops the "everyone" case.** Design § 10: "For a surface everyone sees,
two contrasting profiles sit — the least comfortable with technology and the one with the highest
stakes." The card's sentence covers only "one profession or several". Cast reads the index's `cast-when`,
not the cards, and with `presets: []` nothing else seats the profile judge on a surface everyone sees.
Add the clause (one line; the header is flat).

## Minor — fixed now

- **M1 → Ruling R126: the why-line is part of the strings, not a maker's note.** It travels with the
  strings table to the handoff (the builder and the translator need it), so a judge may read it — and the
  words judge reads each language's lines first and the why-lines last, as `words.md:62-64` already
  orders. Say which side it is on in the `strings` and `maker-notes` rows of `pool/CARD-FORMAT.md:156`
  and in `words.md:31-32`, so a conductor building a brief knows to hand the strings with their
  why-lines.
- **M2 — the attribution in all eight `## Borrowed` sections** (e.g. `accessibility.md:128`,
  `profile.md:129`): drop "(recorded there as MIT)". A card asserts no licence it has not verified, and
  "there" points at a source a generic kit cannot name. What was taken is ideas, in the kit's own words:
  credit them findably, as the other credits are — the name of the method and where it is published, as
  the source's own third-party record gives them (read that record; copy no licence claim from it) — and
  say "ideas only, in this kit's words".
- **M3 — four overlapping territories, two with different severities.** One finding has one owner. Add
  one line to each card of a pair, naming the other seat:
  - `usability.md:47` (siblings) / `system-fidelity.md:35-37`: usability owns whether what she learned on
    a sibling surface still holds here; system fidelity owns whether the pattern is the system's.
  - `visual-craft.md:29-32` and its example fix `:81-82` / `system-fidelity.md:29`: visual craft owns
    grouping and rhythm; system fidelity owns whether a value is a token. Take the "gap off the scale"
    wording and the example through it, so `visual-craft.md` no longer contradicts its own step 9
    (`:87-89`).
  - `usability.md:45` (first action) / `visual-craft.md:25-28`: usability owns whether she knows what to
    do first; visual craft owns whether the eye lands there.
  - `visual-craft.md:45` (components) / `system-fidelity.md:30-34`: visual craft owns whether the part is
    well used for its job; system fidelity owns whether it is the system's part.
  The "leave the other seats" step of each card names the seats it borders (`usability.md:80-81`,
  `system-fidelity.md:77-79`).
- **M4 — `profile.md:70` "Run the six, every time" against `:86-88`** (at Look it sits "only when
  legibility or context is in play"). Whether it sits is Cast's call. Rewrite `:86-88` as what to read
  when the brief seats it at Look: all six, with legibility and context read on the finished screens and
  the other four confirmed unchanged by the look.
- **M5 — "It sets your verdict" never says which** (`usability.md:59`, `truth.md:60`,
  `accessibility.md:62`, `cold-implementer.md:61`, `profile.md:69`). Say it: a job failure is the first
  fix, and the verdict cannot be the first of the three words.
- **M6 — `cold-implementer.md:88`, `:62-64`, `:73-78`:** "*Ready*: no question and no guess is left" —
  say that an answered-but-hidden note does not stop *ready*; and give an unanswered question that blocks
  no slice a severity (*should*).
- **M7 — three triggers two readers could judge differently:**
  - `visual-craft.md:45`: "where the product's other screens do not use it" — tell the judge what to read
    to decide (`current-screens` or `design-system`, as its `reads` allows; add the name if missing).
  - `truth.md:44`: "a string says what the product … does" — nearly every label does. Narrow it: a string
    makes a claim about the product (what it does, how well, how fast, how safely), beyond naming a
    control.
  - `visual-craft.md:50` density: "a surface she works in" — make it observable (a list or table of more
    than a handful of rows, or a screen the intent says she keeps open while working).
- **M8 — `accessibility.md:40`, `:47`:** the card claims WCAG 2.2 AA numbers but its reflow check uses
  "half the widest … 200%". Reflow is tried at 320 CSS px wide; say so and add it as a width. Name
  non-text contrast under what the measured check does not look at, beside borders (`:75-76`).
- **M9 — two incomplete script instructions:**
  - `accessibility.md:73` says `--help` "gives the form of a checks file". It gives the types and their
    keys, not the `{ design, checks }` wrapper nor that each check needs `id`, `criterion`, `state`,
    `page`, `width`. Give a six-line example of a checks file in the card (inside a code fence), checked
    by a test that runs it through `validateAcceptance` of `scripts/accept.mjs`.
  - `visual-craft.md:66-68` gives `shots.mjs` without its folder argument or `--out`. Give the command
    whole, as `accessibility.md` does.
- **M10 → Ruling R127: on a re-read, every judge reads cold first.** Seven cards open the earlier ledger
  before re-reading (e.g. `usability.md:82-84`); only `cold-implementer.md:79-80` reads cold first, which
  is the right order for all: read the artefact as if for the first time and write the findings, then
  open the seat's own earlier ledger and mark each earlier finding fixed, still there or changed.
- **M11 — the judge rules live only in the tests and the kit's cards.** `pool/CARD-FORMAT.md:52-59` gains
  the rules a project's own judge must keep: its `never-reads` holds `maker-notes`, `author-map` and
  `other-ledgers`; its Method opens with the job before the craft; it runs an optional check only on a
  trigger seen in what it was handed and lists the ones not run; its Output names the ledger; it never
  fixes, redesigns or approves. **The first of these is machine-checked:** `validateCard` in
  `scripts/lib/card.mjs` refuses a judge whose `never-reads` lacks any of the three names (one error per
  missing name) — this round may change `card.mjs` for that one rule, with inline samples that fail
  without it; the document-against-checker test must stay true, and `CARD-FORMAT.md` says which of the
  judge rules a machine checks and which a reader must.
- **M12 — `profile.md:75`:** "name it for the usability judge" — say where: in one line under what was not
  looked at, as the other cards do.

## Rules unchanged

Generic; the fictional room-booking product; no card past about 130 lines — where a fix adds lines, cut
elsewhere; stage by explicit path; commit on `v2-pipeline`; never push, never amend.
`node --test tests/pool.test.mjs` while iterating; `npm test` once at the end.

One commit: `fix: the judges' borders, the everyone case, and smaller findings` (same two trailer lines).
Hand-mutate the new condition of `card.mjs`. Append "Fix report — round 1" to `task-10-report.md` and reply
with the short status contract.
