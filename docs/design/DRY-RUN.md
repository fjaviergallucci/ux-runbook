# The dry run

The whole pipeline, run once on a fictional project before any real one, to find what in the kit does
not work as written. This page says what was run, what each stage met, what a builder who had never seen
the design was left to ask, what was ruled, every place the kit's wording changed, what held, and what a
run like this cannot show.

Every note the run produced was sorted into one class. A script that does the wrong thing is
`mechanical`. Words that are unclear, wrong or at odds with another file are `wording`. Where the kit
behaves as written and the run shows that the behaviour needs choosing, it is a `decision`, and each one
was ruled on. Notes caused by the run's own set-up, notes on what the kit got right, and notes that were
mistaken about the kit change nothing, and are counted further down. The items are numbered `F1` to
`F111` in the order of the pipeline's stages, and the rulings `R157` to `R191`.

The fixes were made in three waves: the words in two, then the scripts. Two reviews of the three waves
followed, one of the words and one of the scripts, and what they found was fixed in a round of its own,
with five more rulings (`R186` to `R190`), and what their re-read found in a second, with one more
(`R191`): where a round changed what a row says, the row says so. A cell that reads **final wave** waits
for the review of the whole kit, and one that reads **follow-up** is left for the first real project to
decide.

Paths are from the kit's root. The run's project is written `<run>/project`.

## What was run

- **The project.** The kit's fictional product, a room-booking tool for the front desk of a small
  clinic: a git repository of its own with a small design system (a token file, three components, a
  document of its rules), one existing screen (the day's list of rooms), its strings in two languages, a
  seeded day of bookings, and a decision log. Nothing in it signs in, and it has no build: its screens
  are static files. It is kept in `tests/dryrun/project/`, and the run worked on a copy of it.
- **The design.** One request: "the front desk needs to see what is free right now". Framed as kind
  `working-surface`, foundation `new-surface`, size `surface`: every stage run full. One profession, with
  a profile stub written at setup.
- **The scope.** No fresh pass. No outside engine (none turned on). Three structure describers, each on
  a lens. One seat removed at Cast in the founder's words (the contrast task reader at Structure). Every
  seat on one smaller model at medium effort, the founder's change at Cast; each conductor on a larger
  one.
- **How it was conducted.** Setup and each of the nine stages by a fresh session that read only the
  kit's skills, by path and followed literally, and the package on disk, and that wrote down everything
  that did not work as written. A conductor could not start seats: it wrote each seat's brief where the
  skill says and stopped, a controller started each seat with nothing but a pointer to its brief, and
  told the conductor when the seat had finished. After Handoff, a stand-in builder, given only the
  handoff folder, copied the prototype into the project as the "build" and wrote the three write-back
  pages for real.
- **The founder was a file of answers,** written before the run: `tests/dryrun/FOUNDER-ANSWERS.md`.
  Where it had no answer, the conductor stopped and the controller added one. The file lacked answers
  in three places, and they are now in it, under "Added during the run":
  - at setup, whether the product needs a kind of interface beyond the kit's five, and what to do with
    any other question of the profile template that the project did not answer;
  - at Detail, what he says when a cost he has just accepted meets one of his own standing rules or the
    intent he approved: keep it as a cost, or reopen Structure (asked three times, R157);
  - at Detail, three facts a string waited for: the verb for holding a room, whether the screen has a
    heading, and how long a room's name can be.
- **The result.** All nine stages approved in the founder's words, Handoff at version 2 after
  Acceptance reopened it for the deviations he accepted. 39 seats and the stand-in builder: the counts
  stage by stage below give 39, and one total line of the run's own log says 46. 21 stops for the
  controller, where that log says 20. 274 notes. 48 final pages, 192 pictures of record, 66 states of
  which 24 can occur, 34 strings in each language. 1302 scripted checks on the build, 0 failed, 0 not
  run; 13 deviations, each accepted. The state script's `validate` printed `ok` at the end, and the
  proof that the handoff folder stands alone found 338 references in 54 files, each inside it.

## Stage by stage

| Stage | What ran | Seats | Stops, and why | What broke | Fixed in the kit |
|---|---|---|---|---|---|
| Setup | the profile, the project kit restyled on the project's tokens (8 pictures), the pool with one profile stub, the engine check (outside engines off), the lessons file | 0 | 1: the answers lacked "Kinds this project adds", which the skill both asked and sent to "Not known yet." | F1, F2, F3, F4, F5, F6, F7, F8, F9 | F1, F2, F4, F5, F7 in the words · F3 by R159, as R189 corrects it · F6 by R160 · F8 by R161: the specimen, `kit/grey/parts.html`, holds words that name each part and 24-hour times · F9 by R162: `scripts/card.mjs check` takes a profession's profile |
| Frame | the frame and the route, the package made on his yes | 0 | 0 | F9, F10, F11, F12, F13, F14, F15, F16 | F10, F11, F13, F14, F15, F16 in the words · F12 by R163 · F9 by R162: `scripts/card.mjs check` holds a profession's profile to its file's name and to the template's sections and labels, and Context runs it on a profile it drafted or changed |
| Context | the facts with their sources, his corrections, two of which override the project's facts document | 0: a new surface has no read as it is | 0 | F17, F18, F19, F20, F21, F22, F23, F24 | F17, F19, F20, F23, F24 in the words · F18 by R164 · F21 by R165 · F22 by R166 |
| Intent | the intent, her person card, the profile judge's optional read | 1: the profile judge | 1: for the seat | F8, F14, F22, F24, F25 to F37 | F25 to F30, F32, F33, F37 in the words · F31 by R167 · F34 by R168 · F35 by R169 · F36 by R170: `scripts/lib/frontmatter.mjs` writes a value that holds a double quote in single quotes, and reads that form |
| Cast | the cast sheet: the surface preset, the profile judge at four stages, one seat removed, every seat on one model | 0 | 0 | F10, F11, F25, F38 to F46 | F38 to F46 in the words |
| Structure | the brief read by him; three describers; merge, draw, pictures; three judges and one task reader; the second option picked | 7: three describers; the usability, truth and profile judges; one task reader | 2: the makers; the readers | F6, F25, F30, F47 to F62 | F47 to F51, F53 to F56, F58, F61 in the words · F59 by R172 · F52 by R171: `scripts/render.mjs --without-notes` and `scripts/shots.mjs --first-screen`, both in Structure's commands, for the board and for the redrawn pick of a graft · F57 by R162: `scripts/card.mjs traits`, its command line in the loop · F60 by R173: `scripts/page.mjs` counts question marks in the question and the reason only, and its help says so · F62: `scripts/lib/state.mjs`, where `validate` reports a header whose status disagrees with the state's, whichever it is |
| Detail | the interaction designer, 27 questions to him, the interface writer, a fresh designer and a fresh writer, the prototype builder (48 pages); five judges and two task readers; nothing blocked, so no fix round | 12: five makers; the usability, truth, words, accessibility and profile judges; two task readers | 8: six for seats; two for questions the answers lacked | F6, F30, F53, F54, F55, F63 to F80 | F63, F65, F67 to F69, F71 to F77, F79, F80 in the words · F64 by R174 · F66 by R175 · F70 by R176 · F78 by R177 |
| Look | inside the design system; the visual designer; its table of measures sent back twice; four judges; one fix round; three re-reads; 844 checks passing; one named extension | 11: the visual designer four times, four first reads, three re-reads | 6: all for seats | F14, F16, F25, F47, F48, F53, F66, F81 to F91 | F81 to F83, F86 to F88, F90, F91 in the words · F84 by R178 · F89 by R179 · F85: final wave (R185) |
| Handoff | the folder (36 items closed: answered in it, left to the builder, or a marked default), 13 questions to him, the cold implementer and its one re-read | 2: the cold implementer, first read and re-read | 2: for seats | F3, F6, F33, F64, F68, F80, F81, F92 to F101 | F92, F95, F97, F98, F100 in the words · F94 in the template, with a test · F99 by R181 · F93 by R180: `scripts/alone.mjs --package` reads every text file of the folder for a name of the package that it does not hold, and Handoff runs it once the folder's last file is written · F96: `scripts/inpage/accept-inpage.js`, whose `text` check reads two blocks with a space between them, and two texts with an empty block between them · F101: follow-up (R182) |
| Acceptance | the conductor wrote the project's driver on the kit's browser library, and it worked first time; 1302 checks in 47 s; the keyboard and text at 200% by hand; five judges and one task reader; 13 deviations, each accepted one at a time; Handoff reopened and stamped again; the lessons appended | 6: the usability, accessibility, system fidelity, visual craft and profile judges; one task reader | 1: for seats | F3, F16, F54, F57, F64, F85, F102 to F110 | F102, F104 to F108, F110 in the words · F103 by R183, its check types a follow-up · F109: final wave (R184) |
| Stand-in build | the prototype copied into the project's source; the three write-back pages, with 66 rows for 66 states and 10 deviations; two commits | the builder | none | F3, F21, F81, F93, F103, F111 | F111 in the words · the rest under the stages above |

## The cold implementer's list

### The handoff's cold reader: 21 items at the first read

Four blocked (1, 2, 4, 5). At the re-read: 17 fixed, 3 partly, 1 still present.

| # | What it would have had to ask or guess | What answered it |
|---|---|---|
| 1 | Which room the one "room actions" button opens | a marked default |
| 2 | Whether the retry button is shown disabled while it loads, or the screen becomes the loading one | a marked default |
| 3 | After a hold, the success page shows the room as being cleaned; the dialog's success page is its default | the folder: what each page stands for |
| 4 | Each page's hidden caption and title are in the first language only, with no key | the folder (they are the prototype's frame, not built) and a marked default for the title |
| 5 | References back into the design's history (the writers' notes in the strings; stage names read as documents) | the folder: the notes taken out, their facts written into the spec. Partly: the rest became the re-read's first item |
| 6 | Paths into the project's source, which the reader may not open, and the one path that leads to the write-back pages | the folder: each path opened and there, and the path out is meant. Still present, since the reader cannot open them |
| 7 | Three elements with no part in the system | a marked default |
| 8 | Three kinds of room in the dialog have words and rules but no page | the folder: held by the spec and looked at by a person |
| 9 | How the build reaches the seeded day and its clock | left to the builder |
| 10 | What "book a room" does in the build, and where focus returns | a marked default |
| 11 | Where the measure's event is sent, and what its two fields count | left to the builder (where) and a marked default (what). Partly |
| 12 | Ties and cases nobody named (equal times, opening hours, a booking inside cleaning) | a marked default |
| 13 | How a row's sentence becomes a list row with its tag | the folder |
| 14 | The placeholders' syntax, and a time under ten hours | the folder |
| 15 | Focus when its element is gone after a reload | a marked default |
| 16 | Which element the dialog is, and whether a press on its backdrop closes it | the folder |
| 17 | When the minute reload runs, what counts as a failed load, how long a load is given | left to the builder |
| 18 | The days the made-up pages need exist only as their markup | left to the builder |
| 19 | Nine pages draw the same as another, so their pictures cannot tell the states apart | the folder |
| 20 | How she reaches the screen | left to the builder |
| 21 | An empty "Reviewed by the founder", the draft status, no command for the gates, the guide's example id | the folder. Partly: the stamp is written at his go |

### At the re-read: 15 new items

One blocked (1).

| # | What it would have had to ask or guess | What answered it |
|---|---|---|
| 1 | Three mentions of the design's history: an approved stylesheet's comment names a file not in the folder; two coverage rows name a maker's file | the folder, after the re-read: the rows rewritten, the comment explained on the parts page. Not read again, and open at the gate |
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
| 2 | Where the token file goes; the copied pages' link broke | nothing (the break is the stand-in's own copy) |
| 3 | Five width tokens the token file must gain | the folder (the parts page and slice 1) |
| 4 | How a string's key maps to an element | the folder (where each key appears), not said plainly |
| 5 | Whether the state map needs rows for states that cannot occur | nothing. Now said: F111 |
| 6 | A spec row whose text and page cell disagree | nothing |
| 7 | Nine states that draw like another page | the folder (named, and written as a deviation) |
| 8 | Where the dialog's screen id sits: the spec and the pages disagree | nothing: the folder's answer was wrong |
| 9 | A stylesheet comment that points out of the folder | the folder (the parts page explains it). Now a rule: R180 |
| 10 | The project's facts document is out of date; should the build mend it? | nothing. Now a slice of the handoff: R165 |
| 11 | Whom to ask | nothing (nobody, by the run's set-up) |
| 12 | Running the guide's loop and the rows measured by a person | nothing (a stand-in build starts no browser) |
| 13 | Where to write each slice's commit | the folder (the build page asks for it), missed |
| 14 | A timeout with no number | left to the builder |
| 15 | A default that replaced another | the folder |
| 16 | Whether the slices' checks sum to the whole | the folder (they do: 1302) |
| 17 | The prototype's files against its index | the folder |
| 18 | How many rows the state map needs | the folder: 66 |
| 19 | Two token files described as one | the folder (one sentence that did not match). Now said: F81 |
| 20 | A runner for the 1302 checks | nothing: "left to the builder". Now the folder carries the file that makes the checks: R159 |

## What was ruled

Each decision the run raised, with the ruling in a line, and where it stands.

| Ruling | Item | What was ruled | Where it stands |
|---|---|---|---|
| R157 | a question the answers lacked | During the run: the stand-in founder keeps each cost that met his own rules, as a deviation he accepted, so that the run tests whether an accepted breach is recorded where later seats can see it. | It was not: see R175 |
| R158 | F3 | During the run: at Acceptance the conductor writes the project's driver in the project, on the kit's browser library. | It worked first time, and became R159 |
| R159 | F3 | A build with no driver: Acceptance says so and, on his yes, writes the project's driver on the kit's browser library and its command into the project profile. Handoff copies the file that makes the checks into the folder. | In the kit, for a build that opens as files only: R189 corrects it. The Acceptance skill and its driving page, the handoff's folder page and template, the implementer's guide, setup, the profile template |
| R160 | F6 | Where the conductor selected, it now follows a written rule (Structure, Detail) or marks its choice as its own proposal for him to decide (setup, Handoff). | In the kit: both Structure briefs, Detail's seats page, setup's kit page, Handoff's skill and seats page |
| R161 | F8 | The grey kit's specimen holds neutral words that name each part, and 24-hour times. The kit is never a source of facts about the product. | In the kit: the words (Context); `kit/grey/parts.html`, whose every part holds words that name it ("Row title", "Status", "Primary action"), its three ids neutral (two screens' and one element's) and each time written on the 24-hour clock, as 09:30. Its markup and `kit/grey/kit.css` are unchanged, and a test of `tests/walkthrough.test.mjs` holds the words |
| R162 | F9, F57 | A profession's profile is checked by the card script, which also writes the audience's copy of it. | In the kit: the words (the loop, Cast); `scripts/lib/card.mjs` and `scripts/card.mjs`. `check` takes a file in `profiles/`: its id, the template's sections in order, the four fields of each characteristic, and the fourth label nowhere but at the start of a line. The new verb `traits <profile> --out <file>` writes the audience's copy, and refuses a profile that fails the check or a copy that still says "so the interface must". The loop gives the command line, and Cast names five folders in its run. After the reviews: a block of a characteristic that opens with none of the four labels is refused, so that a criterion written over two blocks cannot reach the copy; a fault names a line by its number and a field by its label, and never quotes the profile; Context runs the check on a profile it drafted or changed, and the pool's page for profiles names it |
| R163 | F12 | Frame writes nothing before his yes, and a session that finds no package frames the request again. | In the kit: the loop, Frame's skill |
| R164 | F18 | Context always asks once what she calls these things, and any word she must never see. "None" is an answer. | In the kit: Context's skill and template. The design document is amended with it. After the reviews: the kit's own lessons, which are appended and never rewritten, answer the seeded entry that asked for his words only "when the words will matter" |
| R165 | F21 | A source he has corrected is still carried; the context holds. The truth judge's briefs say so, and the handoff gives a slice to mend the document. | In the kit: Context, the judge's brief template, four seats pages, the handoff's folder page |
| R166 | F22 | What he says of the profession goes into its profile, marked as a guess that is his. | In the kit: Context, Intent, the profile template, the card format |
| R167 | F31 | Intent's profile judge does not read the person card, and the gate says that no seat read it. | In the kit: Intent's skill, the judge's brief template, the profile judge's card |
| R168 | F34 | The offer of the profile judge says how many "So the interface must" lines the profile holds. | In the kit: Intent's skill |
| R169 | F35 | Only a finding that blocks is mended before a gate, even on a page the conductor writes. | In the kit: the loop |
| R170 | F36 | A stage's header is also valid YAML: his words are never changed to make it so. | In the kit: `scripts/lib/frontmatter.mjs`. A value that holds a double quote, or a backslash and needs quotes, is written in single quotes, each single quote inside it doubled, and that form is read; a value that opens with a mark YAML gives a meaning is quoted. What was stamped before still reads. The library's header says the grammar is a subset of YAML and names the two quoted forms. After the reviews: a value that holds a control character other than the tab is refused, as is a list item that must be quoted and holds a backslash, and a soft line break pasted with his words is read as a line break |
| R171 | F52 | Readers who must not see the makers' notes are shown pages drawn without them, and every page is also pictured as its first screen alone. | In the kit: the words (Structure's skill and seats page, the audience's brief and card, the loop); `scripts/render.mjs`, whose `--without-notes` draws a page headed by its letter alone, with no bet, cost, absence, hardest state or note; `scripts/shots.mjs`, whose `--first-screen` pictures the window as each page opens, its width by 900 px, as `<name>-<width>-<theme>-first.png` beside the whole page. Structure's skill gives both in its commands, and its seats page names the files an audience is handed. After the reviews: the redrawn pick of a graft is drawn and pictured the same way, so that an audience reading it again sees no maker's note; the conductor's page on the blind points to Structure's commands and keeps no copy of them; and the kit's contract describes the page drawn without notes. A first screen is pictured at Structure only: R190 |
| R172 | F59 | Where the seats rank the options differently, it is one recommendation still, and its reason says so and that he settles it. | In the kit: the loop |
| R173 | F60 | The decision page counts question marks in its question and its recommendation only. | In the kit: `scripts/page.mjs`. The marks of the question and of the recommendation's reason are counted together, and its help says where; a seat's line, a finding, a title or a line may quote a question. The loop says so |
| R174 | F64 | A list a seat returns is one question: the entries numbered, answered by number in one message. An answer that meets a standing rule is still asked on its own. | In the kit: the conductor's skill, the loop, Detail, Handoff, Acceptance. The design document is amended with it. After the reviews: an entry he leaves unanswered is listed under the findings of the stage's decision page and named in the gate's question, and Handoff writes a default only where his answer takes it: it fills in no answer he did not give |
| R175 | F66 | A breach he accepts is part of what was approved: its own section, carried on, handed to every later judge and never to an audience, copied into the handoff, and not a finding again. | In the kit: the Detail and Look templates, the loop, four seats pages, the judge's brief, the ledger, every judge's card, the handoff. The decision page lists such a finding under a heading of its own, "Accepted deviations", apart from the open ones: R186 |
| R176 | F70 | The writer's "Nothing to say" round closes: a settled entry is closed, an answered one is not sent round, and one fresh writer takes the rest. | In the kit: Detail's seats page |
| R177 | F78 | A brief names first the pictures a seat needs; what was not opened is listed. With one option no ranking is asked. | In the kit: the loop, the briefs, the task reader's card, the task read |
| R178 | F84 | Look's send-back of the table is run once for each run of the measuring step, to a fresh designer, as facts. It is not the fix round. | In the kit: Look's skill and seats page. A script that writes the measured column waits for R185 |
| R179 | F89 | Every element that shows text or takes an action has an id, a status tag included. | In the kit: the interaction designer's card |
| R180 | F93 | Nothing in the handoff folder points back into the package, in a comment or a note. Makers write no such pointer; where an approved file holds one, the parts page says where. | The words in the kit (four makers' cards, Handoff's skill and folder page); `scripts/alone.mjs`, whose `--package <package>` reads every text file of the folder, line by line, for the name of a file or a folder of the package that the folder does not hold, and prints each place. A name with no dot in it is found only where it is written as a path; the package's `build/` folder may be named; a pointer that names no file is not seen. After the reviews: Handoff runs it once the folder's last file is written, at the end of its step 7 and before the cold implementer starts, since at step 3 the folder does not yet hold the decisions page its own entry names, and the files written after it would never be read. It may exit 1 only for a pointer in a file approved earlier and copied in, unchanged or changed only by the rewrites of Handoff's step 3, which is not rewritten: the parts page says where it is and what it stood for without the name it points to, and it goes to him with the gate, as a finding whose seat is `check: alone.mjs --package`. A pointer in a file the conductor wrote, the spec among them, is written out in full. A symbolic link is never followed, and one that leads out of the folder, or nowhere, is printed |
| R181 | F99 | An item closed in the folder after the one re-read is closed, and listed as "closed after the re-read, not read again". | In the kit: Handoff's skill and seats page |
| R182 | F101 | No script for the mechanical part of Handoff yet. | follow-up |
| R183 | F103 | The decision page at Acceptance says what the scripted checks do not see, and the state map must lead to a state's behaviour. Check types for behaviour are left for later. | In the kit: the Acceptance skill, the state map's template, the guide; the check types: follow-up |
| R184 | F109 | A stamp guards every file of the stage's folder, and a reopening names the stages it recalled. | final wave |
| R185 | F85 | A check for sizes, gaps and line lengths. | final wave |
| R186 | F66 | An accepted deviation has a heading of its own on the decision page: a finding may carry the stage it was accepted at. | In the kit: `scripts/page.mjs`, which draws such findings under "Accepted deviations", after the open ones, and does not count them as open; the sample of an approval; the loop, which names the field and the heading among the page's parts |
| R187 | F3 | The evaluation case of the cold implementer holds the file its copy of the guide names. | In the kit: the in-page file copied into that case's handoff folder, with its row in the folder's own table, and a test of `tests/evals.test.mjs` that holds the copy equal to the kit's file |
| R188 | F55 | The read name `example-data` stands: the made-up rows a prototype is drawn with, handed to the truth judge and the prototype builder. | In the kit: the card format, the two cards, three seats pages. After the reviews: Context marks that file among its project sources, as it marks today's screen, and the builder's card says what it does when none is handed: it leaves the row out and says so, and the conductor asks him; Detail's seats page then hands a fresh builder his answer, before the gate |
| R189 | F3 | Corrects R159. The kit writes a driver only for a build that opens as files: its browser library opens local files and nothing else. A build that needs a server or a sign-in, in a project with no script for a browser check, has no driver the kit can write: he is told, and Acceptance stops. No step has a session write code that takes a sign-in from where it is kept. | In the kit: Acceptance's skill and its driving page, setup, the profile template. His yes to the driver is written where he reviews before the driver is, the one question names the path, and the library is among the skill's reads. The skill's table of what it writes lists the driver and its line in the profile, each on his yes |
| R190 | F52 | A first screen is pictured at Structure only. From Detail on, "without scrolling" is answered by a measured check, never by reading a picture. | In the kit: the loop, the audience's brief and card, the judge's brief, the seats pages of Detail and Look. After the reviews' re-read: the `in-viewport` check for each success criterion that says it is the visual designer's to write at Look (R191); at Detail a judge's brief only says which check will answer |
| R191 | F52 | Choosing the element that proves "without scrolling" is a maker's judgement. At Look the visual designer writes the `in-viewport` check, in its own `checks.json` and in a variant's, from a brief that carries each such criterion word for word. The conductor sees that one is there for each, as it holds the measures to its runs; one missing, or one that fails, goes back with the send-back of Look's measuring step, and one that still fails is handed to the judges in their briefs and listed for him as an open finding. Nobody but the designer changes a screen for it. | In the kit: Look's skill and seats page, the maker's brief, the visual designer's card, the loop, Detail's seats page |

## Every place a skill's wording had to change

The `wording` items, with the mechanical item that was a template. A file is named by what it is, and
by its path where two could be meant.

| Item | File | What changed |
|---|---|---|
| F1 | `skills/design/SKILL.md` | The loop's long form is read before the first of the nine stages; setup has its own steps. |
| F2 | `skills/setup/SKILL.md`, `templates/project/PROFILE.md` | A question the project already answers is written from the project's document, which is named when the profile is put to him. A stub for each profession the documents or he name. |
| F4 | `skills/setup/SKILL.md`, `templates/project/PROFILE.md` | "Engine check" opens with the day and his answers on the outside engines, a no among them. A tool listed by name counts as listed; one he refused is off. |
| F5 | `skills/setup/SKILL.md`, `templates/project/PROFILE.md`, `skills/frame/SKILL.md` | What setup asks beyond its six questions is a closed list. "Kinds this project adds" reads "None while the five serve", and Frame asks when a request fits none of the five. |
| F7 | `skills/setup/references/project-kit.md` | The grey kit's dark block is taken out, property by property, once the project's tokens switch themselves, and the kit's opening comment is rewritten. |
| F10 | `skills/cast/references/presets.md` | The rows of the default cast are by size alone; the kind enters only through what is added by rule. |
| F11 | `skills/frame/SKILL.md`, `templates/package/00-frame.md`, `skills/cast/SKILL.md`, `templates/package/03-cast.md` | The engines Frame reports are those of the provisional cast and of each maker that sits by rule. A maker whose engine is off is shown under "Left out". |
| F13 | `skills/frame/SKILL.md` | A new name for the design is taken as he gives it. A fact in his answer is written under what he reviewed and quoted in the why of the value it bears on. |
| F14 | `templates/package/00-frame.md`, `templates/package/02-intent.md`, `templates/package/06-look/LOOK.md` | An instruction that holds at one size or in one mode says what to do with it elsewhere. |
| F15 | `templates/package/00-frame.md`, `skills/frame/SKILL.md` | The route has a row for Frame itself. A stage's reason is "the size sets it", or why it was changed. The cast line names the preset's page and the two pools. |
| F16 | `templates/package/DECISIONS.md`, `skills/acceptance/references/deviations.md` | When a decision is also the project's to log is a test, applied to every decision and not weighed. |
| F17 | `skills/context/SKILL.md`, `templates/package/01-context.md` | The read of the surface as it is happens only when the surface exists, by the judges that read it so. |
| F19 | `skills/context/SKILL.md` | A recommendation on a fact only he holds says where his answer will be written. An answer is written where it belongs, and its question says where. |
| F20 | `skills/context/SKILL.md` | Each fact his correction meets, and each gap it opens, is put to him before the stamp. |
| F23 | `skills/context/SKILL.md`, `templates/package/01-context.md` | Under the inventory: what the product does not have that this design might reach for. |
| F24 | `skills/context/SKILL.md`, `skills/intent/SKILL.md` | The one section of the frame that Intent needs is named, and stops there. The project kit is no project source. |
| F25 | `skills/design/references/loop.md`, `skills/design/SKILL.md` | The carry list is a ceiling, not a reading list: a stage opens what it uses of what the list names. |
| F26 | `skills/intent/SKILL.md` | A person is named for her moment, never by a first name. |
| F27 | `skills/intent/SKILL.md`, `templates/package/02-intent.md` | What is not on record is written so, with what is missing and when it will be written again. |
| F28 | `skills/intent/SKILL.md` | What the intent "needs" has a test: a criterion, a task or a row of states cannot be written without it. |
| F29 | `skills/intent/SKILL.md`, `templates/package/02-intent.md` | A task's start is in the third person, and its goal is hers, quoted. |
| F30 | `templates/briefs/judge.md`, `templates/briefs/maker.md` | A profile judge's profile line is the first thing it reads. With no specialty, the base alone. |
| F32 | `skills/intent/SKILL.md` | His yes to the optional read is written before the seat starts. A remark that changes the page is a correction; one that explains it is written where he reviewed. |
| F33 | `templates/outputs/LEDGER.md`, `pool/judges/cold-implementer.md` | A place for the lines a card asks for before any finding. A column that says whether a cold implementer's item is a question or a guess. |
| F37 | `skills/design/references/loop.md` | Recording a question writes the output's header: the file is read again before it is edited. |
| F38 | `skills/cast/references/presets.md` | One sentence reworded: an adjustment's short cast is among the sizes, not an exception to them. |
| F39 | `skills/cast/references/presets.md`, `templates/package/03-cast.md`, `skills/cast/SKILL.md` | One line of what each lens favours. "Loaded with" takes a lens. |
| F40 | `skills/cast/SKILL.md`, `skills/cast/references/presets.md` | The contrast person is the one whose moment the intent's tasks do not cover, with the reason on its line. |
| F41 | `skills/cast/SKILL.md` | The profile judge's checks are cut on the profession's profile it is loaded with, each row for its own stage. |
| F42 | `skills/cast/references/presets.md`, `skills/look/references/seats.md` | When the profile judge sits at Look is said by what can be read off the sheet and the profile. |
| F43 | `templates/package/03-cast.md`, `skills/cast/SKILL.md`, `skills/design/references/loop.md`, `skills/structure/SKILL.md`, `skills/detail/SKILL.md` | The columns are "Model" and "Effort": the cards' suggestions until he changes one. The two skills that read the sheet say "its model and effort". |
| F44 | `skills/cast/SKILL.md` | What Cast says of a fresh pass is a statement, so that the gate keeps its one question. |
| F45 | `skills/cast/SKILL.md` | The count of agents is of first reads; a stage whose judges block adds a maker and a judge for each. |
| F46 | `skills/cast/SKILL.md` | The carry list takes every section of the intent but two, and names them: "Reviewed by the founder" and "Carry". |
| F47 | `skills/structure/SKILL.md`, the seats pages of Structure and Look, `skills/context/SKILL.md`, `templates/package/01-context.md` | "Today's screen" is the surface being redesigned, as it is; "a sibling surface" is another surface of the product. The context says which a file is, and the blind on today's screen ends at the pick. |
| F48 | `templates/briefs/maker.md`, `templates/briefs/judge.md`, the seats pages of Structure, Detail, Look and Acceptance, the skills of Structure and Look | A brief is filled from the stage's seats page, never from the seat's card, which the conductor does not open. The reply is what the seat's own card says. The outside describer's card is read when the cast sheet seats it. |
| F49 | both Structure briefs | A real label that names a screen of today is given as the facts it states. |
| F50 | `templates/package/04-structure/CHOSEN.md` | What he reviewed holds his yes to the brief first, then what he asked to be changed. |
| F51 | `skills/structure/SKILL.md` | Tagging a proposal is a rewrite that keeps every value as its maker wrote it. |
| F53 | Structure's seats page, `skills/design/references/loop.md`, Look's seats page | What stands in the name of a reader's file is defined at Structure as it is at Detail. A brief has a name. Look's pages are named as the prototype's. |
| F54 | `templates/briefs/audience.md`, the seats pages of Structure, Detail and Acceptance | She reads at the width each task puts her at, in the light theme, and the brief says when the tasks are not written in her language. |
| F55 | the seats pages of Structure, Detail and Look, `pool/judges/truth.md`, `pool/makers/prototype-builder.md`, `pool/CARD-FORMAT.md`, `skills/context/SKILL.md`, `templates/package/01-context.md` | The truth judge and the prototype builder are handed the data the example rows come from, and the builder makes up none. Context marks that file among its project sources. |
| F56 | `skills/structure/SKILL.md`, Structure's seats page | An audience is started once every judge has written its ledger. |
| F58 | `skills/structure/SKILL.md`, `skills/design/references/loop.md` | At a pick a blocking finding stays in its seat's line beside its option, and nothing is mended. |
| F61 | `templates/outputs/LEDGER.md`, Structure's seats page | At Structure a finding says which letters it holds for. |
| F63 | `skills/detail/SKILL.md`, Detail's seats page | The conductor writes the title when it copies the template, and deletes the template's comment when it fills the rest. |
| F65 | Detail's seats page | His answers go where he reviewed, numbered, and one line under a maker's list gives each outcome in full, the answer's number only beside it: the one thing the conductor writes there. |
| F67 | Detail's seats page | The interface writer is handed the project's own string files. |
| F68 | `pool/makers/interface-writer.md`, Detail's seats page, `skills/handoff/references/folder.md` | The writer's notes and lists go in its reply, never in the strings file, which holds the template's keys and nothing else. |
| F69 | `pool/makers/interface-writer.md`, Detail's seats page, `templates/briefs/maker.md` | A line for an element the structure lacks is not written: it is a finding for him. A fact that bears on a state goes to the designer too. A brief has a line for the answers a seat waits for. |
| F71 | `templates/briefs/maker.md`, `pool/makers/interaction-designer.md` | A designer sent back with a list is given the entries by where they sit, and replies one line for each. |
| F72 | `pool/makers/interaction-designer.md` | An element that needs what the product lacks stays, shown, with its dependency: never hidden, never narrowed. |
| F73 | six cards, Detail's seats page | A card gives a script of the kit from the kit's root, which is two folders above the card. A seat's own check folder is open to it. |
| F74 | `skills/detail/SKILL.md` | Detail's pictures are light only: the themes are Look's. |
| F75 | Detail's seats page | The chosen proposal's file is excepted from what is closed, where a seat is handed it. |
| F76 | Detail's seats page, `pool/judges/accessibility.md` | At Detail colour and size are not measured, reflow and focus are, and the judge's own checks have a folder. |
| F77 | `skills/design/references/loop.md`, the skills and seats pages of Detail and Look | The reads folder is made before the first reader starts, and a seat never lists it. |
| F79 | `templates/outputs/decision-approve.json` | The sample names its pictures with the language, as the picture script does, and its title assumes no fix round. |
| F80 | `skills/detail/SKILL.md`, the Structure and Detail templates, `skills/handoff/references/folder.md` | Detail answers each finding Structure carried on the chosen structure. The coverage page takes those, and counts the findings on letters not chosen. |
| F81 | `skills/look/SKILL.md`, `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md` | The token file a screen links is the project kit's copy; the file it was copied from is the project's own, named with its commit on the parts page. |
| F82 | Look's seats page | What the project says of its design system is its documents, its token files and its component files, never a decision log. The visual designer is handed no kit at Look, and the page says why. |
| F83 | `skills/look/SKILL.md`, Look's seats page, `pool/makers/visual-designer.md` | The designer's own measuring script and its readings have one folder, closed to every reader, and the designer never writes the session's results file. |
| F86 | Look's seats page | The detail's output is handed for its rules, never for what its readers found. |
| F87 | `skills/look/SKILL.md` | A reader is handed what the seats page gives its seat. |
| F88 | `skills/look/SKILL.md` | A judge reads again only when its blocking finding went to the fix round. |
| F90 | `pool/makers/visual-designer.md`, `templates/package/06-look/LOOK.md`, Look's skill and seats page | "What the look decides" is the designer's, in its reply, and the conductor copies it. |
| F91 | `skills/look/SKILL.md`, Look's seats page | The decision page shows the default state of each screen, the phone width first. What the designer could not draw is listed with the open findings. The measures are copied section by section. |
| F92 | `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md` | A stylesheet a page loads from the project is an asset, copied in. The proof that every address stays in the folder exits 0 and prints one line. The index names the languages by the project's codes. |
| F94 | `templates/package/07-handoff/SPEC.md`, `tests/templates.test.mjs` | The spec's states table holds every column of the states table, and the page that draws each state. A test holds the two headers together. |
| F95 | `skills/handoff/references/folder.md`, `templates/package/07-handoff/ACCEPTANCE.md` | A contrast check holds the standard; the measured value stands beside it. |
| F97 | Handoff's seats page | What is closed to the cold implementer is the project's code, not the packages folder. Its own earlier ledger is open to it on a re-read. |
| F98 | Handoff's seats page, `skills/handoff/references/folder.md`, `templates/package/07-handoff/SPEC.md` | A row of the states with no page is a miss. A case inside a row is no state: the spec holds it, and a person looks at it. |
| F100 | `skills/handoff/SKILL.md`, Handoff's seats page | A default is held against the pages and the checks it touches before it goes to him, and is written only where his answer takes it. |
| F102 | `skills/acceptance/SKILL.md`, Acceptance's seats page | A results file takes its screen's name where two screens share a state. For a judge, a folder of pictures is named by its path and its naming rule. |
| F104 | `skills/acceptance/references/driving.md`, `templates/package/07-handoff/ACCEPTANCE.md`, Acceptance's seats page | Three kinds of thing are left to a hand, and all three are made. Who judges by eye is a seat of the cast or the founder, and a reader for each language a criterion names. |
| F105 | `skills/acceptance/references/driving.md` | The keyboard walk ends when focus leaves the last stop. Text at 200% says how it was set. A word broken across lines is looked for with what is cut off. |
| F106 | `templates/outputs/LEDGER.md`, `templates/briefs/judge.md`, Acceptance's seats page | A first read of the build that marks an earlier stage's ledger fills the ledger's table for it. |
| F107 | Acceptance's seats page, `pool/judges/accessibility.md` | The accessibility judge is handed the build's files, and what was read by hand. |
| F108 | `skills/acceptance/SKILL.md`, `templates/package/08-acceptance/REPORT.md` | A reader's finding that the approved design already had has its place in the report, and is no deviation. A deviation is listed by what found it: a seat, a check or a hand. |
| F110 | `skills/acceptance/SKILL.md`, `skills/design/references/lessons.md` | One list of what the lessons are written from at Acceptance. The stage's own decision is appended. |
| F111 | `templates/package/build/STATES.md`, `reference/IMPLEMENTER-GUIDE.md` | The state map has a row for every row of the spec's states, those that cannot occur marked so. |

Two things the fixes cost. A file of a skill may hold 200 lines, and seven of the eleven now stand at
the limit: where a fix added words, a blank line beside a command, and in one skill the one under a
heading, was taken out, and the long form went to the skill's own pages. And the tests hold many
sentences of the kit word for word: each sentence that changed took its test with it.

## What the kit got right

- **The founder's own rules held against him.** At Detail a blanket "accept it as a cost" would have
  waved through three breaches of his standing rules and of the intent he approved. The loop had the
  conductor say so, with the source, and ask again.
- **The table of measures was held to the runs.** Look's measuring step caught six rows the scripts did
  not support (a worst-case contrast given higher than measured; sizes claimed for both themes and read
  in one), and one more after the fix round. No value reached the gate unmeasured.
- **The judges tested their triggers again.** Three optional checks the cast sheet had off ran anyway,
  on what the judges saw in the pages.
- **The blinds held.** The makers saw only the chosen structure; the describers' catch-all kept the
  design system out; the brief's sentence test caught a first draft that was a screen in disguise.
- **The state script never failed.** Every verb ran first time at every stage, through every question
  put to him and one reopening.
- **A package stood alone.** Every stage could be picked up cold from the package; the build's
  write-back pages reached every state with no guessing; the slices' checks sum to the whole.
- **A driver on the kit's browser library worked first time:** 1302 checks and 192 pictures in 47
  seconds.
- **Small rules did their work.** One more task reader for a second language, by rule; the builder's
  card answered the tab title; a fix maker's card kept a string whole; one copy of the profession's
  traits served two readers.

Of the 274 notes, 39 record the kit catching or preventing something as designed, 23 were caused by the
run's own set-up, 10 were mistaken about the kit, and one named something the run could not test.

## What the dry run cannot show

- **A real founder.** His answers were written in advance, so the run cannot show how long 36 questions
  put one at a time take a person (now one question for each list, R174), whether a blanket answer is
  what he would give to eight defaults at Handoff, or what he would say to a question the file did not
  foresee.
- **A real build.** The build was the prototype copied, so it passed every check by construction, and
  the guide's build loop never ran.
- **A real professional.** The profile stayed a stub with almost no "So the interface must" lines, so
  the profile judge had little to judge by.
- **A second model.** Every seat ran on one model at one effort: the cards' suggestions and the lessons'
  record of models were not tested, and whether a stronger seat opens every picture is unknown.
- **Outside engines, a fresh pass, a screen generator, a transcriber.** None was turned on.
- **Paths not taken:** the read of a surface as it is (a new surface has none), a graft, a pick of none,
  a rejected round, variants, a direction for a project with no design system, two professions, a
  correction, a flow, a skipped stage.
- **Two notes of the run's set-up hide a real question.** The run's request was the kit's own worked
  example, and the kit's examples all come from one product, so a project in that domain is anchored by
  them. And the kit's limit of three browser-driving seats or commands at once is fixed, with no setting
  for a machine that allows fewer.
- **Items already parked that the run did not meet:** a stray file a mount leaves in a board, a stale
  chain through a skipped stage, a page written to defeat the picture's mark, a scaled vector, a
  pill-shaped clip.

## What the proving run should decide

The first real project is the proving run. These are left for it.

- **Whether the kit ships a script for the mechanical part of Handoff (R182).** The first leg of
  Handoff took 21 minutes and five scripts of the conductor's own: the spec, the strings, the checks,
  the coverage and the defaults. What such a script should hold depends on a real project's strings
  format and its build.
- **Whether the checks see what a page does (R183, its second half).** Today a check asks what a page
  shows: nothing is pressed, loaded, sent or focused, so a build that draws the right things passes.
  New check types (a key, a load, where focus lands, a change of screen) need a driver that presses
  keys, and a real build to try them on.
- **The guide's build loop, and the rows "measured by a person".** A stand-in build starts no browser,
  so neither ran. A real builder will show whether the loop can be followed from the folder alone, and
  whether a person can reach the same number twice (R185 gives such rows a check, in the final wave).
- **The driver a conductor writes (R159, R189).** It worked on a build that opens as files, and the
  kit now writes one for such a build only. A build that runs on a server or signs in needs a script of
  the project's own: a real project will show what that script must do, and whether the kit should
  give more than the file that makes the checks.
- **One question for each list (R174).** Whether a founder answers a numbered list in one message, and
  how many entries he leaves open.
- **The profile judge on a profile that says something,** and the seats on the models their cards
  suggest.
- **The paths not taken above,** as a real project meets them.

## The evaluation suite

Run before the dry run, on the kit's nine evaluation cases, with a cap of $15.

- **Result:** all nine at 1.00 after three runs (seven in the second, two in the third), for $8.88.
- **Run 0** (one case alone, to prove the set-up): 1.00, 34 s, $0.22.
- **Run 1** (all nine): 315 s, $3.50; two cases at 1.00, seven below. Six of the seven were the cases'
  faults: a run's shell is read-only, so copying a fixture fails, though the file tool can write in the
  run's folder; and some rubrics asked a judge to weigh long files. Every case now reads its fixture in
  place, and each rubric asks one or two things, with patterns for the rest.
- **The seventh was the kit's:** a session given a correction ran the route's correction steps by
  itself and never invoked Frame. A ruling followed: a correction costs one nod. Frame states its one
  line and asks nothing, and the nod is asked at Detail, on the picture of before and after.
- **Run 2** (all nine, traces kept): 438 s, $4.70; seven at 1.00. The two below were the cases' again:
  a read-only project the prompt did not mention, and a rubric whose votes changed between sound
  replies.
- **Run 3** (the two alone): $0.46; both 1.00.
- **Kit changes that came of the suite,** from its review and its runs: when a message asserts
  something the package contradicts, it is not used, the session names the output that holds the
  package's fact, asks whether that stage is to be reopened, and does not go on until he answers; and
  the one nod of a correction, above.
