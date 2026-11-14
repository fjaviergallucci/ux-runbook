# Task 10 — The eight judge cards: report

**Status: DONE_WITH_CONCERNS.** The concerns are judgement calls the brief and the rulings leave open; they are listed last, the ones that most need a ruling first. One commit on `v2-pipeline`:

- `7a078a0 feat: the judge cards, the profile judge among them`

Files: `pool/judges/` (eight new cards), `pool/CARD-FORMAT.md` (thirteen new rows in the names table, one row extended), `pool/MODELS.md` (eight rows), `tests/pool.test.mjs` (two new tests, one widened). `scripts/lib/card.mjs` is untouched.

## What I wrote, card by card

Every card: `shelf: judge`, `verified: 2026-11-14`, `never-reads` holding `maker-notes`, `author-map`, `other-ledgers`. Every `## Method` opens with one line, "**The job before the craft:** first … ; only then …", in the seat's own terms, and step 1 then sends the seat to its brief. Every `## Output` names `templates/outputs/LEDGER.md` and says what a ledger holds. Every `## Never` says, in the seat's words, that it does not fix, does not propose another design and does not approve.

| Card | Lines | sits-at | presets | loaded-with | engine | model / effort | core / optional |
|---|---|---|---|---|---|---|---|
| `usability.md` | 120 | context, structure, detail, acceptance | adjustment, surface, flow, system | none | own | opus / high | 4 / 6 |
| `truth.md` | 129 | structure, detail, look, acceptance | surface, flow, system | none | own | opus / high | 3 / 3 |
| `words.md` | 128 | detail, acceptance | surface, flow, system | none | own | opus / high | 3 / 4 |
| `accessibility.md` | 129 | detail, look, acceptance | surface, flow, system | none | own | opus / high | 3 / 6 |
| `visual-craft.md` | 128 | context, look, acceptance | surface, flow, system | none | `skill:design-audit:design-audit` | opus / high | 3 / 9 |
| `system-fidelity.md` | 118 | look, acceptance | adjustment, surface, flow, system | none | own | opus / medium | 3 / 3 |
| `profile.md` | 130 | intent, structure, detail, look, acceptance | (empty) | profile | own | opus / high | 6 / 8 |
| `cold-implementer.md` | 115 | handoff | adjustment, surface, flow, system | none | own | opus / high | 4 / 0 |

`job` is the question of design § 7's table, word for word. `reads` and extra `never-reads`:

| Card | reads | never-reads, beyond the three |
|---|---|---|
| usability | brief, intent, current-screens, options, chosen-structure, states-and-rules, strings, prototype, pictures, build, earlier-ledger | — |
| truth | brief, context, intent, product-facts, options, chosen-structure, states-and-rules, strings, prototype, final-screens, pictures, build, earlier-ledger | — |
| words | brief, intent, strings, states-and-rules, prototype, pictures, build, earlier-ledger | — |
| accessibility | brief, intent, states-and-rules, prototype, final-screens, pictures, build, earlier-ledger | — |
| visual-craft | brief, intent, current-screens, final-screens, pictures, tokens, design-system, build, earlier-ledger | — |
| system-fidelity | brief, intent, final-screens, tokens, design-system, component-source, sibling-surfaces, fresh-marks, build, earlier-ledger | — |
| profile | brief, profile, intent, options, pictures, strings, earlier-ledger | task-reads (§ 10: it does not receive the audience's read) |
| cold-implementer | brief, handoff-folder, earlier-ledger | package, component-source (it is given only the folder) |

What each card decides, beyond the brief's table (the core checks and the optional checks with their triggers are the brief's, each core check with what to look at and what counts as a finding):

- **usability.** Walks each task with only what is on screen; step 3 makes "you got through it by knowing something the screen does not say" a finding. Stages: at Context it reads today's interface before any intent exists, takes her and her tasks from the brief, offers no fix, and lists a core check with nothing to read (the success criteria) under "not looked at". Names `ui-ux-pro-max` as a lookup when installed, "data, never a verdict" (§ 24's row).
- **truth.** Reads the standards (the context's inventory, the project's facts document when handed one) before the artefact. "Honesty first": three lines — what she is led to expect, what the inventory says, the gap — before any trace. A trace is a row that can be quoted; "no row" is "not shown to exist", never passed by inference; the maker's data map is a claim to test. At Structure, check 3 looks at each option's own cost line, since no list of dependencies exists yet. Names the project's claims skill as a lens when the brief names one.
- **words.** Each language read whole and by itself, never through another; the why-line read last, as the writer's claim. Counts by tool, with the interface writer's one-line command (a test runs it). The fix may offer one line, marked as an offer. Names the project's writing skill as a lens when the brief names one.
- **accessibility.** "Answer the job first": the main task tried three ways (keyboard alone, in source order with the picture covered, at the narrowest width) before any ratio. Checks 1 and 2 are read in the pages' source, not on pictures. Measured checks give the two commands (`scripts/accept.mjs prototype … --root … --out …`, `scripts/shots.mjs … --out … --widths … --themes light,dark`), checked against both scripts' usage; `--help` gives the form of a checks file. Without Chrome the measured checks go under "Checks not run" and nothing is estimated. At Acceptance it does not drive the build.
- **visual-craft.** Step 2 loads the `design-audit` skill as a lens and says what to take (its dimensions, its reduction filter) and what to leave (it asks for project documents, writes a phased plan, offers to carry it out). The typography row names the `typography` skill "when it is installed" and points to step 5, which gives the method in the card's own words. A fix carries its reason in the hierarchy and is said in the system's tokens.
- **system-fidelity.** The system is read from its source, never remembered; what cannot be opened is not judged against. "A second system has begun" is what blocks. At Acceptance it reads the files the build changed. With `borrow-list` the ledger carries that list.
- **profile.** The six criteria of § 10 in its order, each with what feeds it; eight optional checks, one per optional characteristic of § 8, each triggered by the characteristic being in the profile handed over. From § 10: the verdict words *works · works with changes · does not work*; "why it matters" names the trait and its label, *fact* or *guess*; the "Cannot tell" list for traits marked *unknown*, sent to the founder or a real professional and never to the maker; the ranking at Structure with the size of each gap (*clear · slight · tie*) and one reason; "you speak for one profile", disagreements stated and never averaged; never invents a trait; a real professional's read outranks it. It names no profession.
- **cold-implementer.** The optional-checks table has its header row, its dashes row and no rows, with "None: this seat always reads the whole folder." under it. **`validateCard` accepts this as written** (ruling 5): no change to `card.mjs` was needed. It reads only the folder, starting at `HANDOFF.md`; its fix says what the folder has to state and where, never the answer; on a re-read it reads the folder cold before it opens the earlier ledger.

### `pool/CARD-FORMAT.md`

Thirteen rows added to "The names in `reads` and `never-reads`": `options`, `final-screens`, `pictures`, `handoff-folder`, `build`, `package`, `profile`, `product-facts`, `earlier-ledger`, `maker-notes`, `author-map`, `other-ledgers`, `task-reads`. One existing row extended: `states-and-rules` now ends "the data map and the dependencies", which the interaction designer has written since Task 9's fix and the truth judge reads.

### `pool/MODELS.md`

Eight rows, each with its reason. All rest on reason 2 (a different model from the maker's); system fidelity is `medium` because it is a comparison against a source with little to decide.

## What I tested, and the results

**RED** — the three tests, before any card existed (`node --test tests/pool.test.mjs`):

```
not ok 42 - the eight judge cards hold the decisions they were written to
    + []   - [ 'judge.accessibility', 'judge.cold-implementer', 'judge.profile', … ]
not ok 43 - every judge is blind to the makers' notes, the author map and the other judges' ledgers
    error: 'the pool holds judges'
not ok 50 - the interface writer and the words judge count what a reader sees, not how it is stored
    error: 'judge.words is in the pool'
# tests 56   # pass 51   # fail 3   # todo 2
```

Each failed for the reason it should: no judge card existed.

**GREEN** — `node --test tests/pool.test.mjs`: **56 tests, 54 pass, 0 fail, 2 todo.** `npm test` on the tree that was committed: **517 tests, 514 pass, 0 fail, 1 skipped (the existing NTFS one), 2 todo; exit 0; 192 s.** (I ran the whole suite three times: twice before last one-line prose edits to the cards, each with the same counts, and once more on the final tree, which is the run reported here.)

- **New: `the eight judge cards hold the decisions they were written to`** pins each judge's `sits-at`, `loaded-with`, `engine`, model and effort to the brief's table, with ruling 6's engine name for visual craft.
- **New: `every judge is blind to the makers' notes, the author map and the other judges' ledgers`** asserts the three names in `never-reads` of every file under `pool/judges`, and that there is at least one such file.
- **Widened: the count command.** The words judge repeats the interface writer's one-line count, so the test that runs that command now runs it from both cards (a composed and a decomposed "Café" both give 4).
- Already there and now covering the judges: every card keeps the format (`validateCard`), every card has its row in `MODELS.md` with the same model and effort, every name in `reads` / `never-reads` has its row in `CARD-FORMAT.md`, every path named under `scripts/`, `kit/`, `pool/` or `tests/` exists, no product name.
- **The two `todo` tests are still `todo`.** The `templates/` twin now prints `not ok … # TODO` where it printed `ok … # TODO` before: eight cards name `templates/outputs/LEDGER.md`, which Task 12 writes. That is the state ruling 2 describes. The index test is unchanged.

## Ruling 6 — the engine

- **Engine value: `skill:design-audit:design-audit`.** On this machine the skill comes from a plugin (`design-audit@bencium-marketplace`, version 1.0.0), so its installed name carries the prefix, as the visual designer's card does. The test pins that value.
- **Read:** `design-audit` whole (`SKILL.md`, its design principles, its output template), and `typography` whole (`SKILL.md`; not its CSS templates or its entity table, which are for a maker). The `typography` plugin's skill folder is `typography` and its frontmatter name is `ui-typography`; the card writes `typography:typography`, the name this session lists it under.
- **What the card takes and leaves.** From `design-audit`: its dimensions, which the three core checks and the nine optional checks follow (its accessibility dimension is the accessibility judge's), and its reduction filter (in the `density` check). Left: its list of project documents to read first, its phased plan, its "wait for approval, then implement". The card says so in Method step 2 and again in Never.
- **Typography.** The row names the skill "when it is installed"; step 5 gives the method without it: line length, line spacing, steps of the scale, one means of emphasis, capitals, real punctuation characters. The numbers are Butterick's, as the skill gives them, and `## Borrowed` says so.
- Also read, for one sentence in the usability card: the head of `ui-ux-pro-max`'s `SKILL.md`.

## What I ported from each § 23 source, and what I left behind

| Source | Ported, made generic | Left behind |
|---|---|---|
| `playbook/briefs/` (`judge-creative`, `judge-brand`, `judge-audience`, `judges-words`, `claims-finalists`) | The question of the job before the question of craft; a judge that did not make what it reads and never opens the makers' record; "nobody rewrites — a fix is the line it should be, offered"; only one seat rules on a claim, the others name it; the ranking with the size of each gap; two reads that disagree are a finding, never an average | Every post, product, person, score scale, engine and path |
| `playbook/README.md` | Nothing beyond the briefs: I read its opening only | The rest |
| `visuals-claims-pass` (`SKILL.md`, `references/method.md`, `report-template.md`, `THIRD-PARTY.md`) | Standards before the artefact; every statement traced to a row on file; "no row" never passed by inference; an implication written out and checked as if said; an absolute or a comparison held to a row that says exactly that; "honesty first" in three lines; the reviewer does not substantiate and does not rewrite. **Attribution kept** in `truth.md`: `marketing-claims-review` in `claude-for-legal` by Anthropic, Apache License 2.0 | The rule ids, the pixel pass, the Spanish forms, the lint, the five-kind taxonomy as a table, the emoji calls, "ready to ship" |
| `visuals-transcreation-es419` (`SKILL.md` § JUDGE, `references/craft-borrowed.md`, `THIRD-PARTY.md`) | Does the line do its job before is it well written; each language for itself, never through another; the maker's count redone by tool; the shapes a generated line takes, as six plain descriptions; a plain exact sentence is not flattened. **Attribution kept** in `words.md`: `copywriting` and `copy-editing` of `marketingskills` by Corey Haines, MIT | The tells table itself and its two-language examples, the register of one language, the caption numbers, the fixed vocabulary, the sweeps, the three-question gate |
| `visuals-physician-viewer` (`SKILL.md`, `references/borrowed.md`, `viewer-read-template.md`) | A trait labelled fact or guess, what nobody said left blank and never invented, never speaking past the people the card covers; the ranking by gap; disagreement never averaged. **Attribution kept** in `profile.md`: `customer-research` of `marketingskills` by Corey Haines, MIT | The viewers, the professions, the blind three-second read and the bias caveat (the audience's, Task 11). **`references/persona-cards.md` was not read** (a line count touched it; its text was never shown) |
| `visuals-creative-direction` (`SKILL.md` § Mode J, `references/rubric.md`) | The order: the job, then the craft; evidence, severity, fix, "fix first" | The weighted rubric, the pre-mortem, and the calibration rule "first reaction before the analysis" (CC BY 4.0, Serge Shima): I wrote it into the visual craft card, then cut it for length, so no attribution is owed |
| `visuals-soft-social-templates` (§ JUDGE only) | The fix as "what it is → what it should be", with its reason | Sizes, the brand, the boards |
| `visuals-clean-capture` (`references/judge-protocol.md`, head of `THIRD-PARTY.md`) | Confirmation that the audit dimensions and the reduction filter come from `design-audit` by bencium.io (MIT), which the visual craft card credits directly | The five capture checks |
| `visuals-motion-brief-and-judge` (`references/gauntlet.md` §§ 1–2, `THIRD-PARTY.md`) | A fresh judge for every review, never handed the maker's reasoning; measurements over intentions; the largest gap first, never averaged away; the re-read's three marks; a ledger that never certifies. **Attribution kept** in every card that uses them: `business-motion-film` and the Gauntlet Loop (see concern 5) | Everything about film: frames, holds, loudness, the critic prompt |
| Version 1 of this kit (`master`: `phases/5-EVALUATION.md`, `phases/7-QA-LOOP.md`, `phases/8-AUDIT.md`, `reference/ANTI-PATTERNS.md`) | Success criteria before any general check; the states a design owes an answer to; the destructive action apart from the primary one; the accessibility tree before the pixels, the keyboard walk, focus into and out of what opens, measured contrast, 200%, reduced motion, colour never alone, 24 and 44 px; the squint; tokens and never raw values; one system, never a second; "confidence is not evidence"; scaffolding is building | The phases and gates |

Not opened: `temp/media/`. Not read: `persona-cards.md`, `scripts/visuals/engines/`, `posts/4/`, both `LESSONS.md` files, `PROCESS.md`, `SKILLS.md`, the two interface runs.

## Self-review

- **Completeness.** Every card of the brief; every core check, in the brief's words as its bold lead; every optional check with its trigger (counts in the table above match the brief's row by row); every ruling. Ruling 4's three statements are in each Method and each optional-checks opening. Ruling 10's three "nevers" are in each `## Never`.
- **Each card read as the agent that will receive it.** That read changed: the profile judge's Method had lost "the six run every time" (restored); the cold implementer named "the entry file" without saying which (now `HANDOFF.md`, `SPEC.md`, `prototype/`); the visual craft judge's lens sat above the Method, where the format asks the Method to say what happens without the engine (now step 2); the words judge's check 2 did not say what is asked when there is one language (now it does); the visual craft `second-theme` trigger was "is drawn in a second theme" where the brief says "one exists" (now the token file defines one, and a screen never drawn in it is a finding); the accessibility card called 44 px a WCAG AA number (it is the kit's own bar, from version 1, and the card says so).
- **Triggers.** Each is something a reader can point at in what the seat is handed: a count of screens or actions, a state that is drawn, a digit in a string, a characteristic present in the profile. Three rest on a word more than a count: `components` ("used in a new way"), `colour` ("introduces or changes") and `density` ("a surface she works in and does not just pass through"); each says how to tell. Two triggers are read in what the seat is handed beside the artefact, as the brief's table gives them: usability's `siblings` (in the intent) and every one of the profile judge's (in the profile).
- **Length.** No card past 130 lines; the profile judge is at 130.
- **Generic.** No product, person or profession; the profile judge names no profession and uses "they" for the people its card describes. Examples are the room-booking tool.
- **Discipline.** What is more than the brief's list is named in the concerns: the verdict words (1), `presets` (2), the thirteen names (3), the widened test, the `ui-ux-pro-max` sentence.
- **Testing.** Output is clean: the only lines that are not `ok` are the two `todo` tests.

## Concerns

**Most need a ruling**

1. **The verdict words of seven judges are mine.** § 9 says the top line is "the verdict in the seat's three words (for example *approve · rework · stop*)", and § 10 gives only the profile judge's. A card cannot fill the top line without its words, and "approve" as a verdict sits badly beside "a judge never approves" (ruling 10). So each card answers its own `job` question in the profile judge's pattern: *she can · she can with changes · she cannot* (usability); *true · true with changes · not true* (truth); *reads right · reads right with changes · does not read right* (words); *they can · they can with changes · they cannot* (accessibility); *good · good with changes · not good* (visual craft); *faithful · faithful with changes · not faithful* (system fidelity); *ready · ready with defaults · not ready* (cold implementer). Each card says when each applies: the first when nothing blocks and nothing is a *should*; the second when the fixes listed would make it so; the third when no fix to this artefact would. One line per card changes them. Task 12's `LEDGER.md` and the stage skills read these words.
2. **`presets` are not in the brief.** I took them from the plan's default cast table and read only that table (lines 827–846 of the plan; the search that found it also printed the plan's copy of this task's own table, cut short, and two lines of the acceptance task). Usability and system fidelity include `adjustment`; the cold implementer sits at every size from an adjustment up; **the profile judge has `presets: []`**, because the plan adds it "by rule" when Frame says the experience is for one or several profiles, which is "sits only when Cast names it" in the format's words. If you would rather it list `surface, flow, system`, it is one line.
3. **Thirteen new names in the vocabulary.** Three were asked for. The others name what a judge is handed that no maker was: `options` (the proposals as merged for the board, by letter), `pictures`, `final-screens`, `build`, `handoff-folder`, `package`, `profile`, `product-facts`, `earlier-ledger`, `task-reads`. **`build` and `earlier-ledger` say something later tasks must make true**: at Acceptance a judge is handed pictures of the build, the results of the checks run in it and what the builder wrote back (system fidelity also the files it changed), and no judge drives the build; on a re-read a judge is handed its own seat's earlier ledger, which is not one of the `other-ledgers`.
4. **Two profiles.** § 10 says "where two profiles sit, their disagreements are stated, never averaged", and also that a profile judge never receives another ledger. One instance cannot do both. The card has each judge speak for one profile at full strength and never write a middle position; setting the two ledgers side by side falls to whoever merges them (the stage skill).
5. **The licence of `business-motion-film`.** The re-read's three marks and "the largest gap first" reach this kit through the marketing motion skill, whose own attribution file records `business-motion-film` as "MIT per the README of its origin" and notes that the local copy carries no licence file. My cards say "(recorded there as MIT)" and no more than that. I did not verify the origin.

**Smaller**

6. **The profile judge at Look.** The six "always run", and § 10 says it reads at Look "only when a triggered criterion concerns legibility or context". The card gives criterion 6, the "nothing competing" of criterion 4 and any `physical` check a full read there, and of the rest asks only that the look changed nothing.
7. **Context, before an intent exists.** Usability and visual craft sit at Context (§ 24: the as-is read). The cards take her and her tasks from the brief, offer no fix (what is found is the problem the design starts from), and put a core check with nothing to read under "not looked at".
8. **The cold implementer and the project's source.** "Every reference that points outside the folder" is a finding when it points into the package, at a person or at the web. A reference into the project's own source (a component named in `PARTS.md`) is expected, and the seat cannot open it, so the card lists each one "to be confirmed". `component-source` is in its `never-reads`.
9. **A maker's account inside an artefact.** The why-line of the strings table and the interaction designer's data map are parts of what was made, not `maker-notes`, and two judges need them. The cards tell the judge to read them as claims to test: the words judge reads each language before its why-line, and the truth judge lists the elements from the artefact before it opens the map.
10. **The typography skill's name.** Written `typography:typography`. Its own frontmatter says `ui-typography`. Frame's check for a missing engine should match either.

---

## Fix report — round 1

One commit on `v2-pipeline`: `db38efe fix: the judges' borders, the everyone case, and smaller findings`. Eleven files: the eight cards, `pool/CARD-FORMAT.md`, `scripts/lib/card.mjs` (the one rule this round allowed), `tests/pool.test.mjs`.

**Tests.** `node --test tests/pool.test.mjs`: **58 tests, 56 pass, 0 fail, 2 todo.** `npm test`, once, on the tree that was committed: **519 tests, 516 pass, 0 fail, 1 skipped (the existing NTFS one), 2 todo; exit 0; 182 s**.

Card lengths now: usability 123 · truth 130 · words 129 · accessibility 130 · visual-craft 130 · system-fidelity 124 · profile 130 · cold-implementer 117. Where a fix added lines I cut elsewhere in the same card; what was cut is listed under "Cut to make room".

### I1 — the profile judge on a surface everyone sees

`profile.md`, `cast-when`, one flat line: "The experience is for one profession or several, one instance for each profile it serves; or for everyone, when two contrasting profiles sit, the least comfortable with technology and the one with the highest stakes." `presets` stays empty. The line has no pipe, so Task 11's index can carry it as a cell.

### The two rulings

- **R126 — the why-line is part of the strings.** `CARD-FORMAT.md`: the `strings` row now reads "every string in every language, each with its why-line. The why-line is part of the table and goes with it to the handoff: it is not a maker's note", and the `maker-notes` row ends "A string's why-line is not one: it is part of the strings." `words.md`, core check 2: "The why-line is part of the strings table, not a maker's note: it is yours to read, after the lines." Step 3 already read each language first and the why-line last.
- **R127 — every judge reads cold first on a re-read.** The last step of seven cards is now "**On a re-read, read cold first.**": read (or trace, or measure, or run the six) as if for the first time and write the findings; only then open the seat's earlier ledger and mark each of its findings. The cold implementer already had that order. The `earlier-ledger` row of `CARD-FORMAT.md` says it is "opened only after the artefact has been read again, cold". **The three marks are still design § 9's, *fixed · partly · still present*.** The fix file's sentence says "fixed, still there or changed"; I read that as the same three in other words and kept the design's, because the ledger's shape is § 9's and Task 12's template is written to it. Say so if the words themselves were meant to change.

### Minor findings

| | What changed |
|---|---|
| **M1** | R126, above. |
| **M2** | All eight `## Borrowed` sections: "(recorded there as MIT)" is gone, and with it every "there". The credit is the method by its name and where it is published, as the source's own third-party record gives them: "the Gauntlet Loop (somethingbig.ai/gauntlet-loop), as the `business-motion-film` skill adapts it, by way of the picture-making process this pipeline was adapted from … Ideas only, in this kit's words." No licence is claimed for it. I read that record again; it gives no place of publication for `business-motion-film` itself, so the card names it and the published method it adapts. Two things followed from re-reading it: **(a)** "the job asked about before the craft" sat inside the loop's credit and is the process's own: it is out of that list in every card, and the usability and system fidelity cards say whose it is; **(b)** "a ledger that never certifies" (the accessibility card) comes from `motionmaxxing`, not from the loop, and is now credited to it. **The licences the cards still state, I checked this round** on each project's public repository: `claude-for-legal` Apache-2.0, `marketingskills` MIT, `motionmaxxing` Apache-2.0; `design-audit` and `typography` MIT, from the licence file of the installed marketplace. |
| **M3** | One owner for each finding, said in both cards of each pair. **Siblings:** `usability.md` `siblings` finds "something she learned there that no longer holds here", and ends "Whether the pattern is the system's own is the system fidelity judge's"; `system-fidelity.md` check 3 finds "the same job done here in a pattern that is not the system's", and ends "Whether what she learned there still holds for her here is the usability judge's". Its job-first step no longer claims what she learned elsewhere, and what blocks is "a pattern of its own where the system has one". **Spacing:** `visual-craft.md` check 2 now rules on grouping and rhythm (related things closer, one kind of gap one size, a few regular steps) and ends "Whether a gap's value is a token is the system fidelity judge's"; "a gap off the scale" is gone from its finding, from its severities and from its example fix, which is now "these rows sit closer than in every other list → the same gap as theirs, so the lists read as one kind". `system-fidelity.md` check 1 ends "How the spacing groups things, and the rhythm it keeps, is the visual craft judge's". The `motion` row of visual craft no longer asks for durations "from the tokens". **First action:** `usability.md` `first-action` asks whether she would know which action to take first, and ends "Whether the eye lands on it is the visual craft judge's"; `visual-craft.md` check 1 ends "Whether she knows what to do first is the usability judge's". **Components:** `visual-craft.md` `components` asks whether the part is well used for its job, and ends "Whether it is the system's own part is the system fidelity judge's"; `system-fidelity.md` check 2 ends "Whether a part is well used for its job is the visual craft judge's". The "leave the other seats" step of each of the three cards names the seats it borders. |
| **M4** | `profile.md`, the stage step: "At *Look* all six run on the final screens: criterion 6, the "nothing competing" of criterion 4 and any `physical` check are read in full, and the other four are confirmed unchanged by the look." Whether it sits there is no longer said: that is Cast's. |
| **M5** | The five cards named, and visual craft and system fidelity with them: a job failure "is your first finding and your first fix, and your verdict cannot be" the first of the seat's three words (*she can*, *true*, *they can*, *ready*, *works*, *good*, *faithful*). |
| **M6** | `cold-implementer.md`: "*Ready*: no question and no guess is left, though a *note* may be: an answer that is there and hard to find does not stop it." "*Should*: a question that stops no slice, or a guess with an obvious default that nobody wrote down." *Ready with defaults* closes "once its answer or its default is written". |
| **M7** | `visual-craft.md` `components`: "… where neither what the project says of its design system nor today's screens show it used" (both names were already in its `reads`). `truth.md` `public-claims`: "a string makes a claim about the product beyond naming a control: what it does, how well, how fast, how safely". `visual-craft.md` `density`: "A list or a table of more than seven rows, or a screen the intent says she keeps open while she works" (the fix file says "a handful"; I wrote a number so that two readers count the same). |
| **M8** | `accessibility.md` `reflow`: "at each width the design names and at 320 px, the width reflow is tried at". "Half the widest" and "200%" are gone, from the row and from `## Borrowed`. The measuring step names what is not measured: "Non-text contrast (a border, an icon) and text over a picture". |
| **M9** | `accessibility.md`, step 3: a checks file, five lines in a `json` fence, with the `{ design, checks }` wrapper and two checks (`contrast`, `min-size`), each with `id`, `criterion`, `state`, `page`, `width`; the sentence above says each finds its element by its `data-ux` id and is in the light theme unless it says dark. A new test parses it from the card and runs it through `validateAcceptance`. `--help` is now said to give "every type and its keys", which is what it gives. `visual-craft.md`, step 4: the `shots.mjs` command whole, in a fence, with where to run it from. |
| **M10** | R127, above. |
| **M11** | Below. |
| **M12** | `profile.md`, step 4: "if it is true of anyone, name it for the usability judge in one line under what was not looked at, and if not, drop it". |

### M11 — what every judge keeps

- **`pool/CARD-FORMAT.md`** gains "### What every judge keeps" under "The body": the five rules, numbered, for "a judge, the kit's or a project's own", and the sentence "The checker holds a judge to the first of these. The other four are a reader's to check." The section "What a machine checks, and what a reader must" says the same from both sides: the checker holds "a judge … to the three names it is blind to", and a reader checks "of a judge, the last four of the rules every judge keeps".
- **`scripts/lib/card.mjs`**, the one rule: `JUDGE_BLIND` is exported (`maker-notes`, `author-map`, `other-ledgers`), and a judge whose `never-reads` lacks one of them gets one error for each missing name, where that key's other faults come: `header: "never-reads" of a judge must hold "maker-notes": every judge is blind to maker-notes, author-map, other-ledgers`. A card is a judge by its header's shelf, or by its folder when the shelf cannot be read, as for a judge's sections. A `never-reads` that is not a list, or is not there, stays one fault. Nothing else in the checker changed.
- **Tests.** One new test of twenty inline samples: none of the three (three errors, in order, each saying the rule); an empty list; each one missing; all three in any order with others beside them; names that are nearly right (shorter, another case, inside a longer item); a maker and an audience left alone; a value that is not a list; a missing key; an empty item said before what the list lacks; where the errors come among the header's; a card in `judges/` with a mistyped shelf; a judge with no file; a card whose shelf cannot be read and has no file. The inline judge sample now carries the three names. The lists test holds `JUDGE_BLIND`; the document test holds rule 1's code spans to it, the count of rules to five, and the sentence that says which rule is the machine's; the kit's own judges are asserted against the exported list.

**RED.** With no export: `SyntaxError: The requested module '../scripts/lib/card.mjs' does not provide an export named 'JUDGE_BLIND'` (1 test, 1 fail). That proves nothing about the samples, so with the list exported and no rule:

```
not ok 22 - a judge's never-reads holds the three things every judge is blind to
    expected: 3   actual: 0
# tests 57   # pass 54   # fail 1   # todo 2
```

**GREEN:** `# tests 58   # pass 56   # fail 0   # todo 2` (the fifty-eighth is the checks-file test).

**Hand mutation of the new condition**, on a scratch copy: **26 mutants, 26 killed, each by an inline sample.** The guard (the rule on every shelf; on every shelf but a judge's; no test for a list; the test inverted; `and` for `or`; the rule never run), the match (inverted; by what holds the name; by its start; whatever its case), the loop (first name skipped; last name skipped; stop at the first one missing), who is a judge (header only; folder only; folder before header; every card; no card), the list (a name misspelt, left out, reordered, one more), the message (without "of a judge"; without the rule; naming the wrong thing), and the order (what the list lacks said before the list's own faults). No survivor.

**The two tests on files**, proven on the same copy by breaking what they guard: the checks-file example fails its test when a check loses its `state`, when `min-size` loses `minHeight`, when the contrast floor is out of range, when the wrapper loses `design`, when it is not JSON, and when the fence loses its language; the document test fails when a blind name leaves rule 1, when a sixth rule is added, when the sentence about the machine's rule goes, when the machine section forgets the blind names, and when the subsection is renamed.

### Cut to make room

- **accessibility** (the checks file and its lead-in are the lines added): the step "Read the source, not only the picture" (core checks 1 and 2 already send the judge to the source, and the Never line stays); the sentence on the kit's own 44 px folded into the line above the table; the examples of what blocks cut to one; "nothing is estimated in their place" (the Never line says it); "The maker fixes, and the founder decides" from the opening.
- **visual-craft** (the whole command and the border lines are the lines added): "Emphasis uses one means at a time" from the typography step; the token file from step 1's reading order (it stays in `reads`); the sentence on reading the table of measured values folded into the evidence step; one Never line shortened; "The maker fixes, and the founder decides" from the opening.
- **profile**: the examples in criteria 1 and 3 shortened; the weight and the fix folded into the step on tracing.

### Concerns

- **The three marks of a re-read** — kept as § 9's, as said under R127.
- **`density` at "more than seven rows"** is my number for the fix file's "a handful".
- **The profile judge at Look** now says what to read and not whether it sits, as M4 asks. Nothing in the card says any more that it sits there only when legibility or context is in play (design § 10): that is left to Cast.
- **A sixth rule?** R127 binds every judge, and M11 lists five rules for the format. I kept the five and put "read cold first" in the `earlier-ledger` row. If a project's own judge should be held to it by the format, it is one more numbered line.

---

## Fix report — after the re-review

One commit on `v2-pipeline`: `70890f9 fix: five wordings in the judge cards`. Eight files, the cards only. No header line, no test and nothing in `scripts/` changed.

**Tests.** `node --test tests/pool.test.mjs`, as ruled: **58 tests, 56 pass, 0 fail, 2 todo.**

Card lengths now: usability 124 · truth 130 · words 130 · accessibility 130 · visual-craft 130 · system-fidelity 125 · profile 130 · cold-implementer 118.

| | What changed |
|---|---|
| **N1** | `accessibility.md`, step 5: "*Blocks*: someone cannot finish a task, or a bar is missed: a control with no name, a control the keyboard cannot reach, a trap, a ratio or a size under its bar." A measured failure blocks again. |
| **N2** | All eight re-read steps end with the same clause: "A cold finding that matches an earlier one becomes that finding's mark, and is not written twice." The cold implementer's says it of its items, and adds "The rest is new." Each Output still lists the marks before the new findings, and the two now agree: a cold finding is either the mark of an earlier one or a new row, never both. |
| **N3** | `visual-craft.md`, check 2, under the lead as it was: "Judge its steps by eye, as rhythm: the gaps come in a few sizes, related things sit closer than unrelated ones, and one kind of gap is one size. … Whether a gap's value is the scale's is the system fidelity judge's." |
| **N4** | `system-fidelity.md`, check 3: "A finding: the same job done here in a pattern that is not the one the sibling surfaces use, with no extension saying why." What blocks is worded to match: "a pattern unlike the one the sibling surfaces use". |
| **N5** | `visual-craft.md`, step 1: "… and the token file when your brief hands it, for its themes and its type scale." |

### Cut to make room

Four cards were at 130 lines, and N1, N2 and N5 each add one.

- **truth**: "Leave the other seats their jobs" is two lines for three, with the same content.
- **accessibility**: step 1 is two lines for three ("the moment she is in" is gone from its list of what the intent gives; the intent is still read first); the first `## Borrowed` line is three lines for four, and names the guidelines as "WCAG 2.2 (W3C)", as the line above the table already does.
- **visual-craft**: the typography step is three lines for four, with every rule kept and two of them now said as fragments ("Capitals only on short labels, spaced apart. Real quotation marks, dashes and ellipses."), and its lead reads "without the skill"; the first Never line is one line for two ("Never redraw or propose a direction: no mock-up, no styles, no palette or typeface, no phased plan").
- **profile**: the `## Borrowed` paragraph is seven lines for eight ("the disagreement never averaged").

### Concerns

- Two of the cuts are in text nobody asked me to touch: the visual craft judge's typography step and its first Never line. Nothing was dropped from either, but they read more tersely than they did.
- The re-read marks are still design § 9's three words, as in round 1.
