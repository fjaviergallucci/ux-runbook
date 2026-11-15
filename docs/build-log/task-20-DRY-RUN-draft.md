# The dry run

The whole pipeline, run once on a fictional project before any real one, to find what in the kit does
not work as written. This page says what was run, what each stage met, what a builder who had never seen
the design was left to ask, every wording the kit must change, what held, and what a run like this cannot
show. Item ids (`F1`…) are those of the sorted findings; the column "fixed in the kit" is completed when
the fixes land.

Paths are from the kit's root, or, where they start `design/`, from the run's project.

## What was run

- **The project.** A fictional booking tool for the front desk of a small clinic: a git repository of its
  own with a small design system (a token file, three components, a document of its rules), one existing
  screen (the day's list of rooms), its strings in two languages, a seeded day of bookings, and a decision
  log. Nothing in it signs in, and it has no build: its screens are static files.
- **The design.** One request: "the front desk needs to see what is free right now". Framed as kind
  `working-surface`, foundation `new-surface`, size `surface`: every stage run full. One profession, with a
  profile stub written at setup.
- **The scope.** No fresh pass. No outside engine (none turned on). Three structure describers, each on a
  lens. One seat removed at Cast in the founder's words (the contrast task reader at Structure). Every seat
  on one smaller model at medium effort, the founder's change at Cast; each conductor on a larger one.
- **How it was conducted.** Setup and each of the nine stages by a fresh session that read only the
  kit's skills (by path, followed literally) and the package on disk, and wrote down everything that did
  not work as written. A conductor could not start seats: it wrote each seat's brief where the skill says
  and stopped; a controller started each seat with nothing but a pointer to its brief, and told the
  conductor when it had finished. The founder was a file of answers written in advance; where it had no
  answer, the conductor stopped and the controller added one. After Handoff, a stand-in builder, given
  only the handoff folder, copied the prototype into the project as the "build" and wrote the three
  write-back pages for real.
- **The result.** All nine stages approved in the founder's words (Handoff at version 2, after
  Acceptance reopened it for the deviations he accepted). 39 seats plus the stand-in builder (the
  ledger's total line says 46; the per-stage counts below give 39). 21 stops for the controller (the
  ledger says 20). 274 notes. 48 final pages, 192 pictures of record, 66 states of which 24 can occur,
  34 strings in each language. 1302 scripted checks on the build, 0 failed, 0 not run; 13 deviations,
  each accepted. `state.mjs validate` ok at the end; `alone.mjs` "stands alone: 338 references in 54
  files".

## Stage by stage

| Stage | What ran | Seats | Stops, and why | What broke | Fixed in the kit |
|---|---|---|---|---|---|
| Setup | profile, project kit restyled on the project's tokens (8 pictures), pool with one profile stub, engine check (outside engines off), lessons file | 0 | 1: the answers lacked "Kinds this project adds", a question the skill both asks and sends to "Not known yet." | F1, F2, F3, F4, F5, F6, F7, F8, F9 | — |
| Frame | the frame and the route, the package made on his yes | 0 | 0 | F9, F10, F11, F12, F13, F14, F15, F16 | — |
| Context | the facts with their sources, his corrections (the two that override the project's facts document) | 0 (a new surface has no read as it is) | 0 | F17, F18, F19, F20, F21, F22, F23, F24 | — |
| Intent | the intent, her person card; the profile judge's optional read | 1: the profile judge | 1: for the seat | F8, F14, F22, F24, F25–F37 | — |
| Cast | the cast sheet: the surface preset, the profile judge at four stages, one seat removed, every seat on one model | 0 | 0 | F10, F11, F25, F38–F46 | — |
| Structure | brief read by him; three describers; merge, draw, pictures; three judges and one task reader; pick B | 7: three describers, usability, truth, profile judges, one task reader | 2: makers; readers | F6, F25, F30, F47–F62 | — |
| Detail | interaction designer, 27 questions to him, interface writer, a fresh designer and a fresh writer, prototype builder (48 pages); five judges and two task readers; no `blocks`, so no fix round | 12: five makers, usability, truth, words, accessibility, profile judges, two task readers | 8: six for seats; two for questions the answers lacked (three costs he had waved through that met his own rules, which the kit caught; three facts a string waited for) | F6, F30, F53, F54, F55, F63–F80 | — |
| Look | inside the design system; the visual designer; its table of measures sent back twice; four judges; one fix round; three re-reads; 844 checks passing; one named extension | 11: the visual designer four times, four first reads, three re-reads | 6: all for seats | F14, F16, F25, F47, F48, F53, F66, F81–F91 | — |
| Handoff | the folder (36 items closed: answered in it, left to the builder, or a marked default), 13 questions to him, the cold implementer and its one re-read | 2: the cold implementer, first read and re-read | 2: for seats | F3, F6, F33, F64, F68, F80, F81, F92–F101 | — |
| Acceptance | the conductor wrote the project's driver on the kit's browser library (first try); 1302 checks in 47 s, keyboard and text at 200 % by hand; five judges and one task reader; 13 deviations, each accepted one at a time; Handoff reopened and stamped again; lessons appended | 6: usability, accessibility, system fidelity, visual craft, profile judges, one task reader | 1: for seats | F3, F16, F54, F57, F64, F85, F102–F110 | — |
| Stand-in build | the prototype copied to `src/free-now/`; `BUILD.md`, `STATES.md` (66 rows for 66 states), `DEVIATIONS.md` (10 rows); two commits | the builder | — | F3, F21, F81, F93, F103, F111 | — |

## The cold implementer's list

### The handoff's cold reader: 21 items at the first read

Four blocked (1, 2, 4, 5). At the re-read: 17 fixed, 3 partly, 1 still present.

| # | What it would have had to ask or guess | What answered it |
|---|---|---|
| 1 | Which room the one "room actions" button opens | a marked default |
| 2 | Whether the retry button is shown disabled while it loads, or the screen becomes the loading one | a marked default |
| 3 | After a hold, the success page shows the room as being cleaned; the dialog's success page is its default | the folder: what each page stands for |
| 4 | Each page's hidden caption and title are in the first language only, with no key | the folder (they are the prototype's frame, not built) and a marked default for the title |
| 5 | References back into the design's history (the writers' notes in the strings; stage names read as documents) | the folder: the notes taken out, their facts written into the spec — partly; the rest became the re-read's first item |
| 6 | Paths into the project's source, which the reader may not open, and `../build/` | the folder: each path opened and there; `../build/` is meant — still present, since the reader cannot open them |
| 7 | Three elements with no part in the system | a marked default |
| 8 | Three kinds of room in the dialog have words and rules but no page | the folder: held by the spec and looked at by a person |
| 9 | How the build reaches the seeded day and its clock | left to the builder |
| 10 | What "book a room" does in the build, and where focus returns | a marked default |
| 11 | Where the measure's event is sent, and what its two fields count | left to the builder (where) and a marked default (what) — partly |
| 12 | Ties and cases nobody named (equal times, opening hours, a booking inside cleaning) | a marked default |
| 13 | How a row's sentence becomes a list row with its tag | the folder |
| 14 | The placeholders' syntax, and a time under ten hours | the folder |
| 15 | Focus when its element is gone after a reload | a marked default |
| 16 | Which element the dialog is, and whether a press on its backdrop closes it | the folder |
| 17 | When the minute reload runs, what counts as a failed load, how long a load is given | left to the builder |
| 18 | The days the made-up pages need exist only as their markup | left to the builder |
| 19 | Nine pages draw the same as another, so their pictures cannot tell the states apart | the folder |
| 20 | How she reaches the screen | left to the builder |
| 21 | An empty "Reviewed by the founder", the draft status, no command for the gates, the guide's example id | the folder — partly: the stamp is written at his go |

### At the re-read: 15 new items

One blocked (1).

| # | What it would have had to ask or guess | What answered it |
|---|---|---|
| 1 | Three mentions of the design's history: an approved stylesheet's comment names a file not in the folder; two coverage rows name a maker's file | the folder, after the re-read (the rows rewritten; the comment explained in the parts page) — not read again, open at the gate |
| 2 | The measure cannot be seen with no form to book from; two wordings of one field | the folder, and left to the builder |
| 3 | The hold action on a booking already past its hold | a marked default, given twice: the first contradicted the approved page and was replaced |
| 4 | Where focus goes when loading fails | the folder |
| 5 | What is behind the dialog, and which element carries the dialog's screen id | the folder (the builder then found it contradicting the pages) |
| 6 | Where the room's name in the second language comes from | a marked default |
| 7 | A run of bookings with no gap, and the minute a time is reached | a marked default |
| 8 | The window's height for "without scrolling" and the pictures | the folder |
| 9 | Whether the region labels and the room's name are headings | the folder |
| 10 | Slice 1's done-when leaves out the dialog | the folder |
| 11 | Three kinds of room have no picture | the folder: none is owed |
| 12 | 24 of 34 strings have no length limit | the folder |
| 13 | The stamp above the handoff's title is not filled | nothing needed: written at his go |
| 14 | Paths into the project's source, to confirm | the folder |
| 15 | The clock behind the load time | a marked default |

### The stand-in builder's 20 notes

What would have stopped a real builder first, in its words: no runner for the checks and no browser
script; the held state, its storage and the measure's event have no home in a project of static screens;
the strings have no key on the pages, the token file has no place, and the dialog's screen id contradicts
itself. Its estimate: about a day of questions before the first slice.

| # | What it needed | What answered it |
|---|---|---|
| 1 | Which item was still blocking when the handoff was approved | the folder (the coverage page names it), missed |
| 2 | Where the token file goes; the copied pages' link broke | nothing (the break is the stand-in's copy) |
| 3 | Five width tokens the token file must gain | the folder (the parts page and slice 1) |
| 4 | How a string's key maps to an element | the folder (each key's `where`), not said plainly |
| 5 | Whether the state map needs rows for states that cannot occur | nothing |
| 6 | A spec row whose text and page cell disagree | nothing |
| 7 | Nine states that draw like another page | the folder (named; written as a deviation) |
| 8 | Where the dialog's screen id sits: spec and pages disagree | nothing: the folder's answer was wrong |
| 9 | A stylesheet comment that points out of the folder | the folder (the parts page explains it) |
| 10 | The project's facts document is out of date; should the build mend it? | nothing |
| 11 | Whom to ask | nothing (nobody, by the run's set-up) |
| 12 | Running the guide's loop and the rows measured by a person | nothing (no browser in a stand-in) |
| 13 | Where to write each slice's commit | the folder (the build page's template asks it), missed |
| 14 | A timeout with no number | left to the builder |
| 15 | A default that replaced another | the folder |
| 16 | Whether the slices' checks sum to the whole | the folder (they do: 1302) |
| 17 | The prototype's files against its index | the folder |
| 18 | How many rows the state map needs | the folder: 66 |
| 19 | Two token files described as one | the folder (one sentence that does not match) |
| 20 | A runner for the 1302 checks | nothing: "left to the builder" |

## Every place a skill's wording must change

| Item | File | Line | From | To |
|---|---|---|---|---|
| F1 | `skills/design/SKILL.md` | 110-111 | "read it before the first stage you conduct" | "…the first of the nine stages; setup has its own steps" |
| F2 | `skills/setup/SKILL.md` | 76-77, 84-86, 158-159 | a skipped answer is still "his sentence"; stubs only for professions "he names" | a skipped answer is written from the project's document, with its path; a stub for each profession the documents or he name |
| F4 | `skills/setup/SKILL.md`, `templates/project/PROFILE.md` | 97-98, 141-142, 151-155; 78-81 | no place for his "No"; "listed" and "off" both fit | "Engine check" opens with his answers; a tool listed by name counts as listed; `off` wins when he said no |
| F5 | `skills/setup/SKILL.md` | 69-70, 99-100 | step 3: "Not known yet."; step 4: "one more question each" | step 4 names only the account and the decision log; "Kinds" reads "None while the five serve" |
| F7 | `skills/setup/references/project-kit.md` | 71-84, 116-117 | silent on the grey kit's dark block and its opening comment | delete the grey dark block once the tokens switch themselves; rewrite the comment |
| F10 | `skills/cast/references/presets.md` | 9-19 | rows by size only | "the kind enters only through 'Added by rule'" |
| F11 | `skills/frame/SKILL.md`, `templates/package/00-frame.md`, `skills/cast/SKILL.md` | 74-79; 54-55; 96-98, 114-116 | the provisional cast only / "shown all the same" with no section | the provisional cast and the by-rule makers; listed under "Left out" |
| F13 | `skills/frame/SKILL.md` | 99-100, 123-124 | silent on a new name and on a fact in his answer | a new name is taken as given; a fact goes under Reviewed and in the value's why |
| F14 | `templates/package/00-frame.md`, `02-intent.md`, `06-look/LOOK.md` | 13; 13-14; 17-18 | an instruction for one size or mode | "delete this line at any other size / inside a design system" |
| F15 | `templates/package/00-frame.md` | 29-40, 49-50 | no `frame` row; a reason on every row; cast "from `pool/INDEX.md`" | a `frame` row; "the size sets it"; "the preset of `presets.md`, with the pools" |
| F16 | `templates/package/DECISIONS.md` | 8-9 | "a decision that changes the product" | the test: a new or changed token, part or string the product keeps, or a fact of the facts document |
| F17 | `skills/context/SKILL.md`, `templates/package/01-context.md` | 31-32; 18-19 | a project judge "checked first" with no condition; "the cast's judges" | "…when the surface exists"; "the judges that read it as it is" |
| F19 | `skills/context/SKILL.md` | 128, 133-135 | "each with a recommendation"; "where it belongs and beside its question" | for a fact only he holds, where his answer will be written; write it where it belongs and say so under its question |
| F20 | `skills/context/SKILL.md` | 154-159 | "The gate is that one message from him" | each fact his correction meets and each gap it opens goes back to him, one at a time, before the stamp |
| F23 | `templates/package/01-context.md` | 30-37 | the inventory only | add "What the product does not have, that this design might reach for" |
| F24 | `skills/context/SKILL.md`, `skills/intent/SKILL.md` | 129-131, 162-165; 139-146 | "a section of the frame that Intent needs" | name it; say whether Intent carries it on; "the project kit is no project source" |
| F25 | `skills/design/references/loop.md` (and four stage skills) | 39-43 | "exactly what that output's carry list names" | "of what the carry list names, open what this stage uses; nothing else is open" |
| F26 | `skills/intent/SKILL.md` | 59-60 | "the name in lower-case words" | "named for her moment, as the kit's five are" |
| F27 | `skills/intent/SKILL.md`, `templates/package/02-intent.md` | 92-95; 59, 64 | no form for what is not on record | "not on record: {what}; written again when {known}" |
| F28 | `skills/intent/SKILL.md` | 36-38 | "what the intent needs" | "a fact without which a criterion, a task or a state row cannot be written" |
| F29 | `skills/intent/SKILL.md`, `templates/package/02-intent.md` | 87-90; 40-43 | third-person example against "as she would say it" | one form: the start in third person, the goal in her words |
| F30 | `templates/briefs/judge.md`, `templates/briefs/maker.md` | 27-35; 30-33 | the profile line under the list; "{the specialty}" | the profile first for a profile judge; "with no specialty: its base, whole" |
| F32 | `skills/intent/SKILL.md` | 103-116, 136-138 | silent on his yes to the read; "a correction is made in the page" | his yes under Reviewed; a remark that changes the page is a correction |
| F33 | `templates/outputs/LEDGER.md` | — | no place for "job first" lines or an item's kind | a "Job first" block; a Kind column (question · guess) |
| F37 | `skills/design/references/loop.md` | 28-30, 177-184 | only `begin` said to rewrite the header | "`await` writes the header; read the file again; never write the header yourself" |
| F38 | `skills/cast/references/presets.md` | 44 | "an adjustment's short cast included:" | "an adjustment's short cast among them:" |
| F39 | `skills/cast/references/presets.md`, `templates/package/03-cast.md` | 23-25; 21-23 | the lenses by name only; no lens in "Loaded with" | one line per lens; `{a lens · profile · person · —}` |
| F40 | `skills/cast/SKILL.md` | 87-89 | "a contrast person … from the project's people or the kit's five" | "the person whose moment the tasks do not cover, with the reason" |
| F41 | `skills/cast/SKILL.md` | 90-93 | "on when the intent says its trigger will be there" | the profile judge cut on its profile; each row cut for its stage |
| F42 | `skills/cast/references/presets.md` | 61-62 | "a criterion that fires" | an optional check about legibility on, or a "must" line on where she uses it |
| F43 | `templates/package/03-cast.md`, `skills/design/references/loop.md` | 13-14, 21; 120-123 | "Suggested model", "Suggested effort" | "Model", "Effort"; "the cards' suggestions until he changes one" |
| F44 | `skills/cast/SKILL.md` | 121-126 | "say so in one sentence at the gate" | "…under 'Fresh pass', as a statement" |
| F45 | `skills/cast/SKILL.md` | 127-130 | "Count the rows" | add: a stage whose judges block adds one maker and one judge for each |
| F46 | `skills/cast/SKILL.md` | 154-157 | "but the two last … goes on too" | "every section but 'Reviewed by the founder' and 'Carry'" |
| F47 | `skills/structure/SKILL.md`, `skills/look/references/seats.md` | 33; 144, 152-153 | "today's screen" undefined | define today's screen and a sibling surface; the blind ends at the pick |
| F48 | `templates/briefs/maker.md`, `templates/briefs/judge.md`, Structure and Look | Read, Do not open, Reply | filled from the seat's card | from `references/seats.md`; "what your card's Output says the reply is" |
| F49 | `templates/package/04-structure/BRIEF.md` | 30-33 | "the real labels" | a real label that names a screen of today is given as its facts |
| F50 | `templates/package/04-structure/CHOSEN.md` | 48-50 | "What he asked to be changed" | his yes to the brief first, then what he asked to change |
| F51 | `skills/structure/SKILL.md` | 98-100 | "nothing else is touched" | "a rewrite that keeps every value touches nothing" |
| F53 | Structure's seats page, `loop.md`, Look | 124-164; 115; 47, 134 | `<seat>` undefined; no brief or page names | Detail's definition of `<seat>`; `work/<stage>-<seat>-brief.md`; pages named as the prototype's |
| F54 | `templates/briefs/audience.md` | 13 | "{her language}, at {the width}" | the width each task puts her at, light; the brief says when the tasks are not in her language |
| F55 | Structure's and Detail's seats pages | 130-132; 78-80 | no data source for the truth judge or the builder | the context's data source, by path |
| F56 | `skills/structure/SKILL.md` | 118-119 | "then the audiences" | "once every judge has written its ledger" |
| F58 | `skills/structure/SKILL.md` | 131-133 | silent on a `blocks` at a pick | it stays in its seat's line beside its option |
| F61 | `templates/outputs/LEDGER.md` | 28-30 | "Where" | at Structure, the letters a finding holds for |
| F63 | `skills/detail/SKILL.md` | 63-65 | "Copy the template … and write `built-from`" | "…and the title; delete the comment at step 9" |
| F65 | `skills/detail/references/seats.md` | 52-55 | "with his words" | under Reviewed, numbered, and one line under the list |
| F67 | `skills/detail/references/seats.md` | 64-65 | the writer's hand-over | add the project's string files |
| F68 | `pool/makers/interface-writer.md`, `skills/handoff/references/folder.md` | 30-32, 72-75; 127-128 | "at the top of your work"; "With it, two short lists" | "in your reply, never in `strings.json`"; the file holds the template's keys only |
| F69 | `skills/detail/references/seats.md`, `templates/briefs/maker.md` | 69-72; 17-18 | two routes for the writer's lists | a third route; a fact that bears on a state goes to the designer; a line for his answers |
| F71 | `templates/briefs/maker.md` | 15-21 | no line for a designer sent back | "the entries, by where they sit; reply one line for each" |
| F72 | `pool/makers/interaction-designer.md` | 61-62 | "never dropped quietly" | "stays, shown, with its dependency: never hidden, never narrowed" |
| F73 | six cards; Detail's seats page | `node scripts/…`; 31-32 | a command from the kit's root | `node <kit root>/scripts/…`; except the builder's own check folder |
| F74 | `skills/detail/SKILL.md` | 91-95 | no `--themes` | "light only: the themes are Look's" |
| F75 | `skills/detail/references/seats.md` | 130 | "the board" | "the board, but `<chosen>` where a seat is handed it" |
| F76 | `skills/detail/references/seats.md` | 177-178 | "nothing is measured at Detail" | colour and size are not; reflow and focus are; where its checks go |
| F77 | `skills/detail/SKILL.md`, `skills/look/SKILL.md` | 99-105; 118-121 | silent | make `reads/` first; a seat never lists the folder |
| F79 | `templates/outputs/decision-approve.json` | 12-14 | `today-default-390-light.png`; "after one fix round" | `today-default-en-390-light.png`; "The prototype" |
| F80 | `skills/detail/SKILL.md`, `skills/handoff/references/folder.md` | 117-119; 207-221 | no step answers Structure's open findings | Detail answers each; the coverage takes the chosen letter's findings and counts the others |
| F81 | `skills/look/SKILL.md`, `skills/handoff/SKILL.md` | 19-20; 17-18 | two token files under one name | the kit's copy, and the file it came from named in the parts page |
| F82 | `skills/look/references/seats.md` | 22-23, 35-39 | a selection; no kit handed | the system's documents, tokens and components; the kit handed or taken off the card |
| F83 | `skills/look/SKILL.md`, `skills/look/references/seats.md` | 107-108; 48-49 | two places for the designer's script | one folder, on every reader's "Do not open"; never write the session's results |
| F86 | `skills/look/references/seats.md` | 164 | `DETAIL.md` handed whole | "for its Rules, Edge cases, Data map and Dependencies, never its findings" |
| F87 | `skills/look/SKILL.md` | 119-120 | "the final screens with `measures.md`, the pictures" | "what `references/seats.md` gives its seat" |
| F88 | `skills/look/SKILL.md` | 124-126 | "for each judge that marked one" | "for each judge whose blocking finding went to the fix round" |
| F90 | `pool/makers/visual-designer.md` | 68-74 | no lines on what the look decides | one line each on hierarchy, spacing, emphasis, density, widths, themes |
| F91 | `skills/look/SKILL.md` | 128-136 | no number of pictures; no line for the maker; "row for row" | the default state of each screen; the maker's items under findings; the section copied whole |
| F92 | `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md` | 90; 60-62, 77-81 | "It must print nothing"; "a picture or a script"; "as `states.md` has them" | "exit 0 and its one line"; a stylesheet is an asset; the profile's language codes |
| F95 | `skills/handoff/references/folder.md` | 167-168 | "a `contrast` with its `min`" | the standard as `min`, the measured value beside it |
| F97 | `skills/handoff/references/seats.md` | 32-33, 30 | "the rest of the project's own source"; the gate folder whole | "the project's code, not the packages"; "but the earlier ledger on a re-read" |
| F98 | `skills/handoff/references/seats.md` | 61-63 | "A state with no page" | a row with no page; a case inside a row is held by the spec |
| F100 | `skills/handoff/SKILL.md` | 132-137 | "with the default you would propose" | "…held first against the pages and checks it touches" |
| F102 | `skills/acceptance/SKILL.md`, `skills/acceptance/references/seats.md` | Writes; 3-5 | `results/<state>.json`; each file by path | `<screen>-<state>.json` where screens share a state; a folder of pictures by its path and rule |
| F104 | `skills/acceptance/references/driving.md`, `templates/package/07-handoff/ACCEPTANCE.md` | 95-98, 109-110; 14-20 | "under 'Accessibility checks'"; "a judge of the cast, or the founder" | the three kinds of hand check; "a seat of the cast, or the founder"; a reader per language named |
| F105 | `skills/acceptance/references/driving.md` | 100-104 | "until focus returns"; "Set it"; "cut off" | "until focus leaves the last stop"; how it was set; cut off, sideways scroll or a word broken |
| F106 | `templates/outputs/LEDGER.md`, `templates/briefs/judge.md` | 13-14; 38 | the table on a re-read only | also at Acceptance with an earlier stage's ledger |
| F107 | `skills/acceptance/references/seats.md` | 104-112 | the approved prototype only | the build's files as `BUILD.md` lists them, and the by-hand readings |
| F108 | `skills/acceptance/SKILL.md`, `templates/package/08-acceptance/REPORT.md` | 121-133 | a row per difference; a seat per finding | a place for findings the approval already had; `seat` may read `check: <id>` or `by hand` |
| F110 | `skills/acceptance/SKILL.md`, `skills/design/references/lessons.md` | 162-172; 30 | two lists of sources; no stage entry | one list for Acceptance; "append the decision to `DECISIONS.md`" |
| F111 | `templates/package/build/STATES.md` | 6 | "One row for each state" | "every row of the spec's States, those that cannot occur marked so" |

## What the kit got right

- **The founder's own rules held against him.** At Detail a blanket "accept it as a cost" would have
  waved through three breaches of his standing rules and of the intent he approved; step 8 of the loop
  had the conductor say so, with the source, and ask again.
- **The table of measures was held to the runs.** Step 5 at Look caught six rows the scripts did not
  support (a worst-case contrast given higher than measured; sizes claimed for both themes read in one),
  and one more after the fix round. No value reached the gate unmeasured.
- **The judges re-tested their triggers.** Three optional checks the cast sheet had off ran anyway on
  what the judges saw in the pages.
- **The blinds held.** The makers saw only the chosen structure; the describers' catch-all kept the
  design system out; the brief's sentence test caught a first draft that was a screen in disguise.
- **The state scripts never failed.** `init`, `begin`, `await`, `stamp`, `reopen`, `validate`, `next` and
  `slug` ran first time at every stage, through every question put to him and one reopening.
- **A package stood alone.** Every stage could be picked up cold from the package; the build's
  write-back pages reached every state with no guessing; the slices' checks sum to the whole.
- **A driver on the kit's browser library worked first try:** 1302 checks and 192 pictures in 47
  seconds.
- **Small rules did their work:** one more task reader for a second language, by rule; the builder's card
  answered the tab title; a fix maker's card kept a string whole; one traits copy served two readers.

## What the dry run cannot show

- **A real founder.** His answers were written in advance, so the run cannot show how long 36 one-at-a-time
  questions take a person (F64), whether a blanket answer is what he would give (the eight design
  defaults at Handoff, F6), or what he would say to a question the file did not foresee.
- **A real build.** The build was the prototype copied, so it passed every check by construction; the
  guide's build loop never ran (F103, F3).
- **A real professional.** The profile stayed a stub with almost no "must" lines, so the profile judge
  had little to judge by (F34).
- **A second model.** Every seat ran on one model at one effort: the cards' suggestions and the lessons'
  model record were not tested, and whether a stronger seat opens every picture is unknown (F78).
- **Outside engines, a fresh pass, a screen generator, a transcriber** — none was turned on.
- **Paths not taken:** the read of a surface as it is (a new surface has none), a graft, a pick of none,
  a rejected round, variants, a direction for a project with no design system, two professions, a
  correction, a flow, a skipped stage.
- **Rig notes that hide a real question:** the run's request was the kit's own worked example, and the
  kit's examples (Frame's line, the decision page's sample options, the specimen, the kit check) all come
  from one product, so a project in that domain is anchored by them; the kit's browser limit is fixed at
  three, with no setting for a machine that allows fewer.
- **Parked items not met:** a stray file a mount leaves in a board (the run was in a temporary folder),
  a stale chain through a skipped stage, a page written to defeat the picture's mark, a scaled vector, a
  pill-shaped clip.

## The evaluation suite

Run before the dry run, on the kit's nine evaluation cases, with a cap of $15.

- **Result:** all nine at 1.00 after three runs (seven in the second, two in the third), for $8.88.
- **Run 0** (one case alone, to prove the set-up): 1.00, 34 s, $0.22.
- **Run 1** (all nine): 315 s, $3.50; two cases at 1.00, seven below. Six of the seven were the cases'
  faults: **a run's shell is read-only** ("Read-only file system": copying a fixture fails, though the
  file tool can write in the run's folder), and some rubrics asked a judge to weigh long files. Every case
  now reads its fixture in place, and each rubric asks one or two things, with patterns for the rest.
- **The seventh was the kit's:** a session given a correction ran the route's correction steps by itself
  and never invoked Frame. Ruling R155 followed: a correction costs one nod — Frame states its one line
  and asks nothing, and the nod is asked at Detail, on the picture of before and after.
- **Run 2** (all nine, traces kept): 438 s, $4.70; seven at 1.00. The two below were the cases' again (a
  read-only project the prompt did not mention; a rubric whose votes changed between sound replies).
- **Run 3** (the two alone): $0.46; both 1.00.
- **Kit changes that came of the suite** (its review and its runs): R152 (when a message asserts something the package contradicts, it
  is not used: the session names the output that holds the package's fact, asks whether that stage is to
  be reopened, and does not go on until he answers) and R155 (above).
