# Task 20, step 5b · wave A2 · report

Wave A2: every `wording` item `F47`–`F111` (46 items), the mechanical item `F94`, the words of the
rulings marked A2 (R159, R160, R162, R165, R171, R172, R174, R175, R176, R177, R178, R179, R180, R181,
R183), the four things A1 left for this wave, then `docs/design/DRY-RUN.md` and the answers file.
Branch `v2-pipeline`. No script changed, and not the design document.

**All 46 items, F94 and the 15 rulings are done in the words. Three sentences wait for a command of
wave B: they are listed under "For wave B", each with the exact sentence.**

Paths are from the kit's root. "Pin" is a sentence held by `tests/skills.test.mjs` (S),
`tests/templates.test.mjs` (T) or `tests/pool.test.mjs` (P). Each pin that changed is named with the
item that changes its rule.

## Items

| Item | Files changed | What changed | Test added · pin changed |
|---|---|---|---|
| F47 | `skills/structure/SKILL.md`, `skills/structure/references/seats.md`, `skills/look/references/seats.md`, `skills/context/SKILL.md`, `templates/package/01-context.md` | "Today's screen" is the surface being redesigned, as it is; "a sibling surface" is another surface of the product; Context's "Project sources" says which a file is; the blind on today's screen ends at his pick. | S: pin changed (Context's "Project sources" sentence); pins added |
| F48 | `templates/briefs/maker.md`, `templates/briefs/judge.md`, `skills/structure/SKILL.md`, `skills/look/SKILL.md`, the seats pages of Structure, Detail, Look and Acceptance | The brief templates are filled from the stage's `references/seats.md`, never from the card; "Reply" is a line to the seat, "What your card's Output says the reply is"; the outside describer's card is read "when the cast sheet names its seat"; each seats page says the conductor does not open the card. | S: two pins changed (the "one card" sentence of Structure and of Look); the run-as-written test's `replace` on the judge brief follows the new instruction; pins added |
| F49 | both Structure briefs | "A real label that names a screen of today is given as the facts it states, never in its own words." | S: pin added |
| F50 | `templates/package/04-structure/CHOSEN.md` | "Reviewed by the founder" holds his yes to the brief, verbatim, with the seats that send it out, then what he asked to be changed. Worded with "verbatim" so that T's pin (the gate repeats no words of the pick) stands unchanged. | — |
| F51 | `skills/structure/SKILL.md` | "Each file gets two keys, and a rewrite that keeps every value as its maker wrote it touches nothing else". | S: pin changed |
| F53 | `skills/structure/references/seats.md`, `skills/design/references/loop.md`, `skills/look/references/seats.md`, the seats pages of Detail, Handoff and Acceptance | Structure's seats page defines `<seat>` as Detail's does; the loop names a brief `<stage>-<seat>-brief.md`, with `-reread` or `-fix`; a page of Look's `screens/` is named as the prototype's. | S: pin changed ("Every brief is written into `<package>/work/`, named as the loop says, …", Detail and Look); pins added |
| F54 | `templates/briefs/audience.md`, the seats pages of Structure, Detail and Acceptance | She reads at the width each task puts her at, in the light theme; the brief says when the tasks are not written in her language. | S: two pins changed (the audience's "Handed" at Structure and at Detail); pins added |
| F55 | `skills/structure/references/seats.md`, `skills/detail/references/seats.md`, `skills/look/references/seats.md`, `pool/judges/truth.md`, `pool/makers/prototype-builder.md`, `pool/CARD-FORMAT.md` | A new read name, `example-data` (the project source the context names for its example rows), in the reads of the truth judge and the prototype builder and in the card format's table; both are handed it by the path the carry list gives; the builder "makes none up". Not handed at Acceptance, where the build's data is what `STATES.md` seeds. | S: `example-data` added to the three hand-over tables of the tests and to what is not handed at Acceptance; pins added |
| F56 | `skills/structure/SKILL.md`, `skills/structure/references/seats.md` | "then the audiences, once every judge has written its ledger". | S: pins added (the old pins still hold) |
| F58 | `skills/structure/SKILL.md`, `skills/design/references/loop.md` | At a pick a finding marked `blocks` stays in its seat's line beside its option; nothing is mended. | S: pins added |
| F61 | `templates/outputs/LEDGER.md`, `skills/structure/references/seats.md` | At Structure "Where" opens with the letters a finding holds for. | S: pins added |
| F63 | `skills/detail/SKILL.md`, `skills/detail/references/seats.md` | Step 2 writes `built-from` and the title; the template's comment stays until step 9, which deletes it. | S: pin changed (step 2) |
| F65 | `skills/detail/references/seats.md` | His words go under "Reviewed by the founder", numbered, and one line under the list names the number: the one thing the conductor writes under a heading of the designer's. | S: pin added |
| F67 | `skills/detail/references/seats.md` | The interface writer is handed the project's string files that the context's "Project sources" lists. | — |
| F68 | `pool/makers/interface-writer.md`, `skills/detail/references/seats.md`, `skills/handoff/references/folder.md` | The writer's notes and lists go "in your reply and never in the strings file"; the file holds the template's keys and nothing else; at Handoff a maker's note in it is a fault that goes to him. | S: pins added |
| F69 | `pool/makers/interface-writer.md`, `skills/detail/references/seats.md`, `templates/briefs/maker.md` | A line for an element the structure lacks is not written: a finding for the founder. A fact that bears on a state goes to a fresh interaction designer too. The brief has a line for the answers a seat waits for. | S: pin added |
| F71 | `templates/briefs/maker.md`, `pool/makers/interaction-designer.md` | A maker started again is given "the entries it is sent back with, by where they sit"; the designer's reply adds one line for each. | — |
| F72 | `pool/makers/interaction-designer.md` | "An element that needs what the product lacks stays, shown, with its dependency: never hidden, never narrowed." | S: pin changed |
| F73 | `pool/makers/prototype-builder.md`, `pool/judges/accessibility.md`, `pool/judges/visual-craft.md`, `pool/makers/screen-generator.md`, `pool/makers/outside-describer.md`, `pool/makers/visual-designer.md`, `skills/detail/references/seats.md` | Every command a card gives is `node <kit root>/scripts/…`, with "`<kit root>` is the kit, two folders above this card"; the makers' "Do not open" excepts the builder's own check folder. | P: pin changed (the outside describer's two commands); S: pin added (no card gives `node scripts/…`) |
| F74 | `skills/detail/SKILL.md` | "Light only: the themes are Look's." | S: pin added |
| F75 | `skills/detail/references/seats.md` | "…`earlier/`, but `<chosen>` where a seat is handed it." | S: pin added |
| F76 | `skills/detail/references/seats.md`, `pool/judges/accessibility.md` | At Detail colour and size are not measured; reflow and focus are; the judge's checks and pictures go in `<package>/work/<seat>-check/`. | S: two pins changed (the seats page and the card) |
| F77 | `skills/design/references/loop.md`, `skills/detail/SKILL.md`, `skills/look/SKILL.md`, the seats pages of Detail and Look | The `reads/` folder is made before the first reader starts; a seat writes its file and never lists the folder. | S: pin changed (Look's "Start the readers"); pins added |
| F79 | `templates/outputs/decision-approve.json` | The sample's pictures carry the language; its title is "The prototype". | S: pin added |
| F80 | `skills/detail/SKILL.md`, `templates/package/04-structure/CHOSEN.md`, `templates/package/05-detail/DETAIL.md`, `skills/handoff/references/folder.md` | Detail's step 9 answers each finding Structure carried on the chosen structure; the coverage page takes those and counts the findings on letters not chosen. | S: pins added |
| F81 | `skills/look/SKILL.md`, `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md` | "`<tokens>` is the project kit's copy of the token file …: the file it was copied from is the project profile's `tokens`, named with its commit in `PARTS.md`." Handoff reads `tokens` of the project profile. | S: five pins changed (the opening of each skill, Handoff's profile keys, step 3's token line, folder.md's token file) |
| F82 | `skills/look/references/seats.md` | What the project says of its design system is its documents, token files and component files, never a decision log. "No kit is handed here": the card reads `kit` for the rebuild after a direction (the test already held the card and `direction.md` to that). | S: pins added |
| F83 | `skills/look/SKILL.md`, `skills/look/references/seats.md`, `pool/makers/visual-designer.md` | One place, `<package>/06-look/measure/`, for the designer's script and readings, on every reader's "Do not open"; it never writes `06-look/results.json`. | S: two pins changed (the Writes rows; step 5's sentence); pins added |
| F86 | `skills/look/references/seats.md` | `DETAIL.md` is handed for its four headings, never for its "What the readers found". | S: pin added |
| F87 | `skills/look/SKILL.md` | "Each is handed what `references/seats.md` gives its seat". | S: pin changed |
| F88 | `skills/look/SKILL.md` | "for each judge whose blocking finding went to the fix round". | S: pin changed |
| F90 | `pool/makers/visual-designer.md`, `templates/package/06-look/LOOK.md`, `skills/look/SKILL.md`, `skills/look/references/seats.md` | The card's reply gives one line each on what the look decides; the conductor copies them. | S: pin changed (step 9); pins added |
| F91 | `skills/look/SKILL.md`, `skills/look/references/seats.md` | The page shows each screen's default state, the phone width first; what the designer could not draw is under `findings`, by seat; the measures are copied "each section whole". | S: two pins changed (step 9) |
| F92 | `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md` | A stylesheet a page loads from the project is an asset; "It must exit 0, with its one line"; the index names the languages by the project profile's codes. | S: pin changed ("It must print nothing"); pins added |
| F95 | `skills/handoff/references/folder.md`, `templates/package/07-handoff/ACCEPTANCE.md` | A `contrast` check's `min` is the standard; the measured value stands beside it. | S: pin added |
| F97 | `skills/handoff/references/seats.md` | "the project's code and not `<packages>`"; "`07-handoff-gate/`, but its own earlier ledger there on a re-read". | S: pins added |
| F98 | `skills/handoff/references/seats.md`, `skills/handoff/references/folder.md`, `templates/package/07-handoff/SPEC.md` | A row of `states.md` with no page is a miss; a case inside a row is held by `SPEC.md` and looked at by a person. | S: pin added |
| F100 | `skills/handoff/SKILL.md`, `skills/handoff/references/seats.md` | A default is held against the pages and the checks it touches before it goes to him. | S: pin changed (step 9, with R160 and R174) |
| F102 | `skills/acceptance/SKILL.md`, `skills/acceptance/references/seats.md` | The Writes row says `<screen>-<state>.json` where two screens share a state; for a judge a folder of pictures is named by its path and its naming rule. | S: pin added (the Writes cells' first column is unchanged) |
| F104 | `skills/acceptance/references/driving.md`, `templates/package/07-handoff/ACCEPTANCE.md`, `skills/acceptance/references/seats.md`, `skills/handoff/references/folder.md` | Three kinds of thing are left to a hand; who looks is a seat of the cast (the task reader for a person trying her task) or the founder; one more reader for each language a criterion names. | S: pins added |
| F105 | `skills/acceptance/references/driving.md` | "until focus leaves the last stop"; "Set the root font size to 200%, and say in the entry what was set"; "cut off, needs a sideways scroll, or breaks a word across lines"; an entry says what the driver read, never what one picture suggests. | S: pins added |
| F106 | `templates/outputs/LEDGER.md`, `templates/briefs/judge.md`, `skills/acceptance/references/seats.md` | "On a re-read, or at Acceptance with an earlier stage's ledger"; the brief's line is "Your seat's earlier ledger". | S: pins added (T's pins hold) |
| F107 | `skills/acceptance/references/seats.md`, `pool/judges/accessibility.md` | The accessibility judge is handed the build's files, as the system fidelity judge is, and what was read by hand. | S: pin changed (the card's sentence on Acceptance); pin added |
| F108 | `skills/acceptance/SKILL.md`, `templates/package/08-acceptance/REPORT.md` | A `###` section "What the readers found that was approved as it is" (the `##` headings the test holds are unchanged); a deviation is listed by what found it, "a seat, `check: <id>` or `by hand`". | S: pin changed (step 8); pins added |
| F110 | `skills/acceptance/SKILL.md`, `skills/design/references/lessons.md` | `lessons.md` points at the sources the Acceptance skill names; the stamp step appends the stage's decision. | S: pin changed (the gate's last line); pin added |
| F111 | `templates/package/build/STATES.md`, `reference/IMPLEMENTER-GUIDE.md` | "One row for every row of `SPEC.md`'s States, those that cannot occur marked so". | S: pins added |
| F94 | `templates/package/07-handoff/SPEC.md`, `tests/templates.test.mjs` | The States table is Screen · State · What she sees · What she can do · Where the focus is · Its page. | T: **test added**, "SPEC.md's States table holds every column of the states table, and the page that draws each state". Mutated by hand (the old header put back): it fails. |

## Rulings

| Ruling | Files changed | What changed | Test added · pin changed |
|---|---|---|---|
| R159 | `skills/acceptance/SKILL.md`, `skills/acceptance/references/driving.md`, `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md`, `templates/package/07-handoff/HANDOFF.md`, `reference/IMPLEMENTER-GUIDE.md`, `skills/setup/SKILL.md`, `templates/project/PROFILE.md` | Acceptance, step 3: where the profile names no script, say so and, on his yes, write the project's driver on `scripts/lib/browser.mjs`, and its command into the profile. `driving.md` has a section "When the project keeps no driver" (what the driver does for each state; it holds no sign-in), and its "neither signs in" sentence is reworded. Handoff copies `scripts/inpage/accept-inpage.js` in as `accept-inpage.js`; the handoff's table and the guide say what it is for; "the builder has no kit" stands. Setup: "no script" is an answer. | S: pins changed (driving.md's headings, its driver sentence, Handoff's Writes rows, the handoff template's rows, step 3's copy line); pins added |
| R160 | both Structure briefs, `skills/detail/references/seats.md`, `templates/briefs/maker.md`, `skills/handoff/SKILL.md`, `skills/handoff/references/seats.md` | Structure: "every state the intent says she must be told about", and the inventory "with every row that states a limit, a delay or a failure". Detail: the same rule for the worst rows. Handoff: a default is "the conductor's proposal"; an item that changes what she sees or can do goes with its options, never under a blanket default. | S: pin changed (Handoff, step 9); pins added |
| R162 | `skills/design/references/loop.md`, `skills/cast/SKILL.md`, `skills/acceptance/references/seats.md` | The loop: the copy is made by the card script's `traits` verb, from the profile, at the path after `--out`; never by hand. Cast: a profession's profile is checked in the same run. | S: pin changed (Cast's "has no checker"); pin added. **See "For wave B"** |
| R165 | `templates/briefs/judge.md`, the four seats pages where the truth judge sits, `skills/handoff/references/folder.md` | The truth judge's brief carries one line: where the context and a source it is handed disagree, the context holds. One slice of the handoff mends the document. | S: pins added |
| R171 | `skills/structure/SKILL.md`, `skills/structure/references/seats.md`, `templates/briefs/audience.md`, `pool/audiences/task-reader.md`, `skills/design/references/loop.md` | Each letter is drawn with the makers' notes and without; each page is pictured whole and as its first screen; the audience is handed the pictures without notes; a brief says which picture answers "without scrolling". No flag is named. | S: pin changed (the audience's "Handed" at Structure); pins added. **See "For wave B"** |
| R172 | `skills/design/references/loop.md` | One recommendation still; its reason says the seats rank the options differently and that he settles it. | S: pin added |
| R174 | `skills/design/references/loop.md`, `skills/design/SKILL.md`, `skills/detail/SKILL.md`, `skills/detail/references/seats.md`, `skills/handoff/SKILL.md`, `skills/handoff/references/seats.md`, `skills/acceptance/SKILL.md`, `skills/acceptance/references/deviations.md` | "A list is one thing": numbered entries, answered by number in one message, one `await`; an unanswered entry stays open; what step 8 catches is still asked on its own. | S: pins changed (Detail's step 4 title and sentences, the designer's lists, the writer's facts, Handoff's step 9, Acceptance's gate and step 8); pins added |
| R175 | `templates/package/05-detail/DETAIL.md`, `templates/package/06-look/LOOK.md`, `templates/package/07-handoff/HANDOFF.md`, `templates/briefs/judge.md`, `templates/outputs/LEDGER.md`, the loop, the skills and seats pages of Detail, Look and Acceptance, `skills/handoff/references/folder.md`, the eight judges' cards | A section "Accepted deviations" in both outputs; handed to every judge from that stage on, never to an audience; a judge writes one once, as "accepted at <stage>"; no fix round, not blocking; a finding partly on one is split; the stamp names each; Look's carry list and the handoff's table carry it; "Must not change" copies it. | S: pins changed (Detail's and Look's stamp lines, Look's carry line, what Handoff reads of Look's carry); pins added, one for each judge's card |
| R176 | `skills/detail/references/seats.md` | An entry settled as "no line owed" is closed; an answered one is not sent round; one fresh writer takes his facts and the settled entries; the round is run once. | S: pin changed (with R174); pins added |
| R177 | the loop, the three brief templates, `pool/audiences/task-reader.md`, `templates/outputs/TASK-READ.md`, the seats pages | A brief names first the pictures a seat needs; a task read has "Not opened"; with one option no ranking is asked, and the stuck points are. | S: pins added |
| R178 | `skills/look/SKILL.md`, `skills/look/references/seats.md` | The send-back is once for each run of step 5, to a fresh designer, as facts by result id and measured value; "There is no second round" is said of the fix round, in the skill and under "When it is started again". | S: two pins changed (step 5; step 8) |
| R179 | `pool/makers/interaction-designer.md` | "Every item that shows text or takes an action carries one, a status tag included". | S: pin added |
| R180 | the four makers' cards of Detail and Look, `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md` | "Never point from … to another file of the package". Handoff: nothing points back, in a comment or a note; where an approved file holds a pointer, `PARTS.md` says where, and the file is not rewritten. | S: pins added. **See "For wave B"** |
| R181 | `skills/handoff/SKILL.md`, `skills/handoff/references/seats.md` | Closed, and listed as "closed after the re-read, not read again". | S: pin changed (step 9); pin added |
| R183 | `skills/acceptance/SKILL.md`, `skills/acceptance/references/driving.md`, `templates/package/build/STATES.md`, `reference/IMPLEMENTER-GUIDE.md` | The option's line gives the count and says what the checks do not see, with the keyboard pass and the deviations beside it; a row leads to the state's behaviour, not only to its picture; a row that only draws a state is not sent back, and what is missing is a deviation. | S: pin changed (step 8); pins added |

## From A1's report

- `templates/people/PROFILE-CARD.md`: its opening says that what only the founder said is a guess,
  written `guess (the founder, <date>)` under "Evidence". `pool/CARD-FORMAT.md`, "The person card":
  the same, in a paragraph under the header's table (the table's rows are held to the checker, and are
  unchanged).
- `skills/cast/SKILL.md`: "A profession's profile, in the project's `profiles/` folder, is checked in
  the same run: a faulty one is reported the same way, and no seat is loaded with it."

## Lines

`skills/structure/SKILL.md` 200 · `skills/detail/SKILL.md` 200 · `skills/look/SKILL.md` 200 ·
`skills/handoff/SKILL.md` 200 · `skills/setup/SKILL.md` 200 · `skills/context/SKILL.md` 199 ·
`skills/cast/SKILL.md` 197 · `skills/acceptance/SKILL.md` 196 · `skills/design/SKILL.md` 194.
Cards: the longest are `pool/judges/accessibility.md` and `pool/judges/profile.md`, 132.

What was cut to make room. Four skills stood at 200 lines, and nearly every sentence of them is
pinned, so no sentence was cut: **the blank line before a code fence was taken out** (six in Structure,
six in Detail, five in Look, six in Handoff, six in Acceptance) and, in Look and Handoff, the blank
line after two or three fences. Detail's skill already wrote a fence so. The long form of each fix is
in the skill's own references.

## For wave B: the sentences that wait for a command

1. **R162, `skills/design/references/loop.md`, § 5, the bullet "An audience is handed the traits…".**
   The sentence reads: "The kit's card script, `scripts/card.mjs`, makes the copy, by its `traits`
   verb, from her profession's profile, at the path given after `--out`: it takes out each field, from
   its label to the next blank line, with the paragraph that explains the field, and refuses a card
   that fails its check." It names the verb in prose and gives **no command line**:
   `tests/skills.test.mjs` holds every command line of a skill to its script's `--help`, and
   `card.mjs` has no `traits` yet. Once it has, the line to add under that bullet is
   `node <kit root>/scripts/card.mjs traits <profile> --out <file>`. The sentence is pinned in the
   test "the dry run, the loop again". Also: `skills/cast/SKILL.md`, step 3, now says a profile "in
   the project's `profiles/` folder, is checked in the same run", while the sentence before it and
   its pin still name four folders, as the usage does.
2. **R171, `skills/structure/SKILL.md`, step 7.** The sentence reads: "Each letter is then drawn once
   more for the audiences, without the makers' notes, and every page is pictured twice, whole and as
   its first screen alone: `references/seats.md` says who is handed which." It needs the `render.mjs`
   flag and the `shots.mjs` flag, in the step's commands. In `skills/structure/references/seats.md`:
   the block "Each letter is on the board twice, and each page is pictured twice", and the audience's
   "Handed", which ends "each by its path in `<package>/04-structure/board/`: the whole page, and its
   first screen alone" and needs an example of each name (it had `…/board/A-390-light.png`). The words
   put the pages without notes and their pictures **in the board**: if they land elsewhere, those two
   sentences and the test's rule (a reader is handed nothing of `04-structure/` outside the board)
   change with it. Not touched, and they give the same commands: `skills/design/references/blind.md`
   and `skills/structure/references/rounds.md`. `skills/detail/SKILL.md` step 5 and
   `skills/look/SKILL.md` step 5 give `shots.mjs` with no first-screen flag: whether those stages take
   the picture is the flag's to settle; the loop already has an audience's brief say which is which.
3. **R180, `skills/handoff/SKILL.md`, step 3.** The sentence reads: "**Nothing may point back
   either,** in a comment or a note: no text file of the folder names a file of the package that the
   folder does not hold." It needs `--package <folder>` on the step's `alone.mjs` command. In
   `skills/handoff/references/folder.md`, "The folder stands alone, proved", the paragraph "**Nothing
   points back, proved too.**" says what is read and gives no command. The tests pin the command
   `node <kit root>/scripts/alone.mjs <package>/07-handoff` in both files.

## Found, and not mine to fix

1. **The decision page has no heading of its own for an accepted deviation (R175).** `page.mjs` draws
   every entry of `findings` under "Open findings", and counts them as open. The loop therefore says
   such a finding is "listed apart from the open findings, its `seat` reading 'accepted at' and the
   stage". A real heading needs a key in the page script.
2. **`evals/cold-implementer-finds-the-gap/fixture/…/07-handoff/IMPLEMENTER-GUIDE.md` was copied
   again** from `reference/IMPLEMENTER-GUIDE.md`: `tests/evals.test.mjs` holds the two equal, and R159
   changed the guide. The fixture's folder holds no `accept-inpage.js`, and its `HANDOFF.md` has no
   row for it, while the guide now names the file: the case's cold implementer may list that. The
   evaluation suite was not run.
3. **`reference/IMPLEMENTER-GUIDE.md` is outside the files the dispatch lists,** and was changed
   because R159 names it and a test holds its reading order to the handoff template's table.
4. **The design document** states rules this wave changed and I did not touch it: R164 and R174 (the
   controller's), and with them R175 (accepted deviations), R159 (a driver written at Acceptance),
   R171 (what an audience is shown) and the new read name `example-data` (F55).
5. **A1's fixtures (its findings 1 and 2) still stand.** No fixture was restamped.
6. **`skills/context/SKILL.md`, step 6,** still puts Context's own questions "one at a time". R174's
   list is of lists a maker or a reader returns, so I left it.
7. **`skills/look/references/seats.md`, the audience of a fresh pass,** still reads "her language and
   her width": she reads one screen, at one width. Left.
8. **The cards' `verified` dates** are unchanged: no engine was checked again.

## Tests

- `node --test tests/skills.test.mjs` → 139 pass (136 before: three tests added, "the dry run, …").
- `node --test tests/pool.test.mjs` → 101 pass. `node --test tests/templates.test.mjs` → 48 pass (47
  before: F94's test).
- Four of the new pins were mutated by hand (the loop's "A list is one thing"; the audience's pictures
  without notes; "On his yes, and never before" of the driver; a judge card's line on accepted
  deviations): each made its test fail. F94's test was seen to fail on the old header.

## The document, and the answers file

- `docs/design/DRY-RUN.md` is written from the draft: what was run (with the answers the file lacked,
  and which), stage by stage with "Fixed in the kit" filled, the cold implementer's list, "What was
  ruled" (R157 to R185, one row each, with where each stands), every place the wording changed (file
  and what changed, no line numbers), what the kit got right, what the dry run cannot show, "What the
  proving run should decide", and the evaluation suite. A cell that waits for the scripts reads
  "wave B": the stage rows of setup, Frame, Intent, Structure and Handoff, and the rows of R161,
  R162, R170, R171, R173 and R180. R184 and R185 read "final wave"; R182 and the check types of R183
  read "follow-up". It names no product, no person, no model and no path outside the kit; the run's
  project is `<run>/project`.
- `tests/dryrun/FOUNDER-ANSWERS.md` is the run's copy, read first: it gained "Added during the run"
  (two answers at setup, one at Detail on a cost that meets his own rules, three facts a string waited
  for), and holds nothing but the fictional founder's answers.

## The whole battery, and the commits

- `NODE_OPTIONS=--dns-result-order=ipv4first npm test`, once, after the last edit to the kit:
  **829 tests · 828 pass · 0 fail · 1 skipped** (the folder-mode test this mount skips) · exit 0.
- `claude plugin validate . --strict` → "Validation passed", exit 0.
- `git status --short` → clean.
- Two commits on `v2-pipeline`, not pushed:
  `c0d6bd4 fix: what the dry run found in structure, detail, look, handoff and acceptance`
  (59 files: 15 cards and the card format, 19 files of skills and their references, 19 templates, the
  implementer's guide and its copy in one evaluation fixture, 3 test files) and
  `c83039d docs: what the dry run found, stage by stage` (the document and the answers file).

Done: 46 wording items of 46, F94, 15 rulings of 15, A1's two notes. Not done: none. Three sentences
wait for a command of wave B, as listed.
