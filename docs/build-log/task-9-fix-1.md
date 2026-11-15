# Task 9 — fix round 1 of 5

The review (head `7df0857`) found the checker and its tests solid, the blinds intact, the hand-offs
between cards lined up, and seven of the eight cards holding against their row and their design section.
One finding is Important; seventeen are Minor, and all but none are fixed now, because a card is followed
literally and the next two tasks copy these patterns. Every change to `scripts/lib/card.mjs` or to a test
needs a test that fails without it.

## Important

**I1 — at Look, the screen generator does what it does at Structure**
(`pool/makers/screen-generator.md:28-38`, `:66-71`; more mildly `pool/makers/outside-describer.md:50-53`).
Design § 4.6 says the fresh makers draw "from the approved detail"; § 12 says the fresh screen is shown "on
the same screen with the same content" as the system version. The card's step 1 describes only
Structure's fresh brief, step 2 has the seat choose its own screens, step 3 takes "real content" from the
brief without saying it must be the approved strings. A seat following it at Look picks its own screen
and its own words, and the side-by-side then compares different content.
- **Ruling R121.** At Look a fresh-pass maker chooses only the paint. Its brief names the one screen the
  visual designer is drawing and carries that screen's approved structure, states and strings; the maker
  draws that screen, in the state the brief names, with those words exactly as written — it adds no
  element, drops none, rewrites no string and chooses no other screen. Both cards get a short Look
  paragraph that says so; the screen generator's fallback (the Claude maker with a taste skill as its
  lens) is held to the same. The Structure behaviour stays as it is.

## Minor — fixed now

Cards:
- **M1** `structure-describer.md:10` vs `:90-91`: the header blinds `current-screens` with no exception,
  while Never lets "the continuity maker" open today's screen and never defines the term. Keep the header
  as it is. In Never, say that the blind is lifted only by the brief: the cast may name **one** describer
  the continuity maker, and that one's brief hands it today's screen (design § 5, § 12); a describer whose
  brief does not say so never sees it.
- **M2** `outside-describer.md:10`, `:69-70`: add `kit` and `sibling-surfaces` to its `never-reads` and
  Never, as the screen generator has them.
- **M3** `screen-generator.md`: `:60-61` records that the faster model answers in time but never tells
  the seat to use it — say which to ask for and when; `:66-71` the fallback makes "one free HTML screen"
  while step 2 allows one or two — make them agree; step 6 asks for a screenshot and a prompt the fallback
  does not have — say what the fallback returns and that the screenshot is taken with `scripts/shots.mjs`
  (give the command; check its flags in the script).
- **M4** the transcriber and the generator:
  - the generator keeps its prompt beside the screen; the transcriber's Never (`transcriber.md:83`, `:86`)
    and its `never-reads` name the prompt (add the name to the vocabulary table);
  - the generator makes up to two screens of one concept; both cards say that they are **one** proposal
    with two entries in `screens`, and `CARD-FORMAT.md:103` stops saying "the one screen";
  - `transcriber.md:45`: when the screens show no hard state, `hardest` names the state these screens
    answer least, in the register of any other proposal (ruling R118 extended) — never "not shown".
- **M5** `prototype-builder.md:51-52`: the page count is screens × states × languages, less the rows
  marked "cannot occur" **times the number of languages**.
- **M6** `prototype-builder.md:34` hard-codes `strings.json` while `interface-writer.md:66` writes "the
  file your brief names (`strings.json` when it names none)": make the builder read the same; `:71`
  forbids typing any word into the script, but `:40` (a page title) and `:49-50` (the index page's link
  text) have no source — say where each comes from (the screen's title in the description; the screen,
  state and language names for the index), and that those are names, not interface words.
- **M7** `interaction-designer.md:52-54` vs `kit/KIT-CONTRACT.md:129-130`: a container never carries
  `data-ux`. The interaction designer gives an id only to what the format lets carry one (an item). A rule
  that refers to a dialog names it by its screen id; a rule that refers to an expansion names the item
  that heads or opens it. Say so, and take the two examples at `:47-48` through it.
- **M8** `structure-describer.md:64-70`, `transcriber.md:65-71`: the walkthrough summary is a copy no test
  holds, and it reads as if `label` were required on every container (`scripts/lib/walkthrough.mjs:177`
  requires it only on an expansion). Correct the sentence, and add a test that every role, every
  container and every proposal key the format exports (`ROLES`, `CONTAINERS`, `KEYS` in
  `scripts/lib/walkthrough.mjs`) is named in each card that summarises the format, and that the card
  names none the format lacks.
- **M9** `structure-describer.md:51` and the transcriber's step 8: "the folder that holds `pool/`" is
  ambiguous, since a project has a `pool/` of its own. Say "the kit's root — two folders above this card"
  and pass the proposal file by its absolute path.
- **M15** `visual-designer.md:97-119`: one line per skill read, as ruling 12 asks.
- **M16** `interface-writer.md:56`: count what the reader sees — `Intl.Segmenter` with
  `granularity: 'grapheme'`, so a decomposed "Café" counts 4; give the one-liner. `:49-51`: say what the
  why-line is when the product ships one language (what the line is for and what it must not be mistaken
  for).

`pool/CARD-FORMAT.md`:
- **M10** `:6` says the seat reads the card first, `:101` says every seat reads its brief first, and every
  card's step 1 reads the brief first. One order, stated once: the brief names the card by absolute path
  and says to read it first; the card's step 1 then goes back to the brief. `:9-10` claims "neither can
  say more than the other": the document says things the checker does not check (the title, the Method's
  duty to say what happens without the engine, that a trigger is observable). Say which rules a machine
  checks and which a reader must.
- State the exact written forms the checker requires (next item): a section heading is `## Name` and
  nothing else on the line; a table row begins and ends with a pipe.

`scripts/lib/card.mjs` and `tests/pool.test.mjs`:
- **M11** (reviewer's probe, `/tmp/claude-1000/r13/probe.mjs`):
  - `:37`, `:189` toggle on any fence line, whatever its character or length: a `~~~` fence holding a
    single ```` ``` ```` line makes a valid card report three sections missing. Record the opening fence's
    character and length; close only on the same character with at least that length.
  - `:39` counts no top-level item indented one to three spaces: accept up to three, as Markdown does.
  - `:212` refuses backticked header cells, though `CARD-FORMAT.md:50` writes the column names in code
    spans: accept a header cell with or without backticks.
  - `:36` (`## Never ##`, a tab after `##`) and `:210` (rows without leading pipes) stay refused — the
    format is stricter than Markdown there — but the error says what form is wanted, and `CARD-FORMAT.md`
    states it.
- **M12** `:31`: `skill:[a-z0-9:_-]+` accepts `skill:a:`. A skill is one name or `plugin:name`, each
  `[a-z0-9][a-z0-9_-]*`.
- **M13** `tests/pool.test.mjs:410`: the check that named kit paths exist reads only maker cards. Run it
  over **every** card, for paths under `scripts/`, `kit/` and `pool/`. Paths under `templates/` get a
  second test of the same kind marked `todo` (with `node:test`'s own option), named so that it says
  Task 12 makes it live: judges and the audience will name templates that arrive then.
- **M14** `tests/pool.test.mjs:506`: the product-name scan also covers `.claude-plugin/`, `package.json`
  and `tests/fixtures/`.
- **M17** an inline sample pins a duplicated header key (one clear error).

## Rules unchanged

Generic; the fictional room-booking product in examples; stage by explicit path; commit on `v2-pipeline`;
never push, never amend; no card past about 120 lines — where a fix adds lines, cut elsewhere.
`node --test tests/pool.test.mjs` while iterating; `npm test` once at the end.

Commits: `fix: at Look a fresh maker chooses only the paint, and the cards' smaller findings` (the cards
and `CARD-FORMAT.md`) and `fix: the card checker reads fences, lists and skill names as written`
(`card.mjs` and the tests) — same two trailer lines. Hand-mutate the changed conditions of `card.mjs`.
Append "Fix report — round 1" to `task-9-report.md` and reply with the short status contract.
