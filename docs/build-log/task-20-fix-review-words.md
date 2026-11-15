# Task 20, step 5b · review of the words (waves A1 and A2)

Part reviewed: every `wording` item F1–F111, mechanical item F94, the rulings of A1 and A2 (R159, R160,
R163–R169, R172, R174–R179, and the words of R162, R165, R171, R180, R181, R183), in the skills, their
references, the cards, the templates and the tests' pins; `docs/design/DRY-RUN.md` and
`tests/dryrun/FOUNDER-ANSWERS.md`. Diff `75c7e03..c83039d`, read by file; every file read **as it is at
HEAD** (`c089a33`: wave B's commits, and the controller's amendment of the design document, which
touches no file of this part).

## Verdicts

- **Spec: not met.** Every item F1–F111 of the two waves and F94 has its change, in the file that owns
  it, saying what was asked. Two rulings fall short in one place each: R174's "an entry he leaves
  unanswered stays open" is contradicted at Handoff (W3), and R171's rule that an audience sees no
  maker's note does not reach the graft's re-read (W2).
- **Quality: changes needed.** Four Important findings, eleven Minor. No Critical.

## Findings, most important first

**W1 · Important** · `skills/acceptance/references/driving.md:20-42`, `skills/acceptance/SKILL.md:84-87`
(against `scripts/lib/browser.mjs:54, 188`)
- **What is wrong.** R159's driver is to be written "on the kit's browser library". That library opens
  local files only: `visitPage` turns every target into `pathToFileURL(resolve(file))`, and
  `visitPages` takes `runs: [{ width, theme, files }]`. A build that runs at an address, or that needs a
  sign-in, cannot be opened through it, and "use only what it gives" (driving.md:30) rules out going
  round it. Yet the section is written for any build. It reads states "as its row of `STATES.md`
  says" (the address, the seed step, the account), and its bullet "**It holds no sign-in.** It takes
  one from where it is kept" leads a session to write code that fetches a credential from its store.
  Two lines above, driving.md:14-16 says the kit's file-opening commands "are not for a build that
  needs a session or a server". `DRY-RUN.md:352-353` admits the driver was only tried on a build that
  opens as files. In the walk below this is where it stops.
- **Fix.** Limit the section to a build that opens as files: one sentence that the library opens
  files, and that a build needing a server or a sign-in has no driver the kit can write. That case
  goes to the founder, open, and stops, the way step 2 stops on a credential. Then take out the
  sign-in bullet, or make it say that such a build is not this section's.

**W2 · Important** · `skills/structure/references/rounds.md:20-35`; `skills/design/references/blind.md:85-100`
- **What is wrong.** R171/R154: "The audiences are handed the pictures of the pages drawn without
  them, and no other" (`structure/references/seats.md:116-117`), and "without scrolling" is answered on
  a first-screen picture (seats.md:118-120). The graft path breaks both rules. `rounds.md` step 2
  draws `chosen.html` with the notes only and pictures it with no `--first-screen`. Its step 3 says
  "An audience is handed the new pictures only", so an audience re-reading a graft is handed the bet,
  the cost and "deliberately bad at", and no first screen. `blind.md` steps 5–7, which Structure
  sends the conductor to read before step 3, still give one render for each letter, shots with no
  first screen, and "an audience is handed the pictures only". A2's report lists both files as not
  touched, and B's says a command without the switches "does what it always did": that is the fault.
- **Fix.** In `rounds.md` step 2, the second render with `--without-notes` (to `chosen/chosen-screens.html`)
  and `--first-screen` on the shots; in step 3, "an audience is handed the new pictures drawn without
  the makers' notes, whole and first screen". In `blind.md` steps 5–7, either the same two commands or
  a pointer to Structure's step 7 in place of its own commands. Add a pin on `rounds.md`.

**W3 · Important** · `skills/handoff/SKILL.md:133-138`; `skills/handoff/references/seats.md:52, 72-76`
- **What is wrong.** R174: "An entry he leaves unanswered stays open and is listed so" (loop.md:221
  says so). Handoff says otherwise in both files: "Where he leaves one open, the default is written,
  marked as one" (SKILL.md:138), and "write a default there, marked 'Default:' … build it so"
  (seats.md:52). Following R160, an item that changes what she sees or can do is put with its options
  and no default. When he leaves one of those unanswered, the conductor has to pick one of its
  options and write it into the folder as what to build. The conductor is then deciding a visible
  design choice, which is the edge R160 was drawn to keep. The decision page lists every default for
  his go, which softens the fault but does not remove it.
- **Fix.** In both files: an item he leaves unanswered stays open. It is listed under `findings` as
  open, and the gate's question names it. A default is written only where he has said to take it. Or,
  if the old rule is meant to stay for items that change nothing she sees, say so, and say that an
  item put with its options stays open.

**W4 · Important** · `docs/design/DRY-RUN.md:13, 15-16, 182, 234, 236`
- **What is wrong.** The page is to be public and true, and it is not true in five places:
  - :13, "the rulings `R157` to `R185`": R186, R187 and R188 exist, each changed the kit, and none has
    a row.
  - :15-16, "a cell that reads **wave B** is filled in when that wave lands": that wave has landed,
    and no cell reads "wave B" any more.
  - :182, R175's row, "a heading of its own needs the page script": R186 (`20541b7`) gave it one. The
    loop and `page.mjs --help` now say "Accepted deviations" is a heading of its own.
  - :234, F46's row, "every section of the intent but the two last": that is the wording F46
    replaced. The fix names the two sections, "Reviewed by the founder" and "Carry".
  - :236, F48's row names the seats pages of Structure and Look only. The seats pages of Detail and
    Acceptance changed too ("never from the seat's card, which you do not open").

  B's report flagged the first three and was told not to touch them. They are still this part's.
- **Fix.** The five sentences. Add rows for R186–R188. The rest checked out: the counts (39 seats, 21
  stops, 274 notes, 21 + 15 cold-reader items, 17 / 3 / 1 at the re-read, 844, 1302, 338 in 54) match
  the notes. Every "Fixed in the kit" cell matches a commit. No person, model, agent id or path outside
  the kit appears.

**M1 · Minor** · `skills/context/SKILL.md:128-132`; `templates/package/01-context.md:71-79`
- `example-data` (F55, R188) is handed "where 'Project sources' of the context names such a file". But
  Context is never told to list the data file its inventory's examples come from, or to mark it, as
  it now marks "today's screen", "a sibling surface" and a corrected file. At Structure, Detail and
  Look the conductor has to work out which source is the example data. Nothing says what the
  prototype builder does when no file is handed and its card says "you make none up". **Fix:** a line
  in Context's "Project sources", and in the template, that marks the example data, as it marks
  today's screen.

**M2 · Minor** · `skills/structure/SKILL.md:27`; `skills/detail/SKILL.md:29`
- After F43, both Reads still describe the sheet's line as "its suggested model and effort". The
  columns are "Model" and "Effort", and they hold his choice once he makes one (loop.md:142-146).
  **Fix:** "its model and effort".

**M3 · Minor** · `LESSONS.md:48-50`
- The seeded lesson still says "When the words will matter, he is asked for one or two sentences",
  the rule R164 replaced. The file is appended to and never rewritten. **Fix:** a later entry that
  answers it: asked once, at every design.

**M4 · Minor** · `templates/briefs/judge.md:65`
- F48 turned the reply into a literal line: "What your card's Output says the reply is: the ledger's
  path, the verdict and the first fix." The cold implementer's reply is "its path, your verdict, and
  the count of questions and of guesses" (`pool/judges/cold-implementer.md:86-87`). Its brief now tells
  it something else. **Fix:** stop after "says the reply is", or keep the example in braces.

**M5 · Minor** · `templates/briefs/audience.md:36-37`; `skills/design/references/loop.md:124-126`
- An audience's brief always says which pictures are the first screen. Only Structure takes one.
  Detail and Acceptance hand whole pages only (B's concern 3), and neither the template nor the loop
  says what that line becomes at those stages. A criterion like the template's own ("without
  scrolling, at phone width") is then answered on a whole page. **Fix:** "where the stage took none,
  delete this line", or say that "without scrolling" is not answered at that stage.

**M6 · Minor** · `pool/judges/*.md`, the line in "Never" (e.g. `truth.md:119`)
- "Never make a finding of what your brief lists as an accepted deviation: once, as 'accepted at
  <stage>'" contradicts itself at first reading: no finding, then one row. The ledger template
  explains it. **Fix:** "write it once, as 'accepted at <stage>', with no fix and no severity of its
  own".

**M7 · Minor** · `skills/detail/references/seats.md:59-61`
- F65 has the conductor write "Answer 12: does not exist" under the designer's list in `DETAIL.md`.
  That is exactly the pointer R180 forbids a maker ("or to an answer by its number",
  `interaction-designer.md`), and that `alone.mjs --package` cannot see. Handoff writes out "a file you
  wrote", so `SPEC.md` is mended there. But the pointer is seeded by the kit itself, and Look's judges
  read the "Dependencies" heading without the "Reviewed" section it points to. **Fix:** have the line
  carry the outcome in full and the number only beside it, or accept it and say so in `folder.md`.

**M8 · Minor** · `skills/acceptance/references/driving.md:23-27, 37-38`; `skills/acceptance/SKILL.md:42-43`
- His yes to writing the driver is written nowhere: rule 2 of the conductor wants it in the artefact,
  for instance `REPORT.md`'s "Reviewed". "Where he says the project keeps such scripts" is a second
  question that the section, which asks "one thing", does not ask. `scripts/lib/browser.mjs`, which the
  page says to read, is not among the skill's Reads.

**M9 · Minor** · `skills/detail/SKILL.md:91`; `skills/design/references/loop.md:221`
- An unanswered entry "stays open, and is listed so", but Detail does not say where: on the decision
  page under `findings`, or at the gate's question. The session has to guess.

**M10 · Minor** · hand-wrapped lines, which render correctly but read badly in the source.
`loop.md:137-138` (118 characters, then a stub of four words), `lessons.md:32` (168),
`context/SKILL.md:130-131` (141), `structure/SKILL.md:102` (144), `folder.md:65-66, 83, 203`,
`detail/references/seats.md:188` (129), `look/SKILL.md:171` (121), `truth.md:54` (134),
`interaction-designer.md:56` (125), `interface-writer.md:31` (125), `setup/SKILL.md:62` (106). **Fix:**
rewrap.

**M11 · Minor (known: A1's finding 1)** · `evals/{brief-has-no-design,fresh-brief-hides-the-system,no-pick-without-the-founder}/fixture/design/today/03-cast.md`
- These stamped fixtures keep the columns "Suggested model" and "Suggested effort" that the loop no
  longer names. Restamp them, or leave the decision to the controller.

## The walk: a `surface` design, Frame to Acceptance

A founder who accepts one breach of a standing rule at Detail, a list of five dependencies, and a
project with no browser script ("no script" written at setup, step 2).

- **Frame → Cast** run as written. Frame writes nothing before his yes, and a resumed session frames
  the request again (R163). Context asks his words last, and "None" is an answer. What he says of the
  profession goes into the profile as `guess (the founder, <date>)`. Intent's offer counts the "must"
  lines. Cast checks `profiles/` in the same run, and the columns read "Model" and "Effort". Nothing
  forks here.
- **Structure** runs as written: every "must be told" state is in the brief, each letter is rendered
  twice, the shots take `--first-screen`, the audiences are handed the pages without notes and start
  after the ledgers. **It forks on a graft:** the re-read's audience gets pictures with the notes and
  no first screen (W2).
- **Detail.** The designer returns five dependencies, and they become one question, numbered (step 4,
  seats.md:49-53), with the gate's `await` and then `begin`. Say he answers four and leaves one: it
  "stays open", and where it is listed is the session's guess (M9). The breach goes under "Accepted
  deviations" of `DETAIL.md`. A blanket yes is caught by step 8 and asked on its own. Every judge is
  handed the section. One that still finds it writes "accepted at detail"; that row goes to no fix
  round, and on the page it carries `"accepted": "detail"`. The stamp's decision names it. **This path
  holds.**
- **Look** copies Detail's deviations into `LOOK.md`, its judges are handed them, and the carry list
  passes on the detail's "Accepted deviations". It holds.
- **Handoff.** The deviation is copied under "Must not change", and the dependencies reach `SPEC.md`.
  `alone.mjs --package` runs and `accept-inpage.js` is copied in. **It forks at step 9:** an item
  nobody decided that changes what she sees goes to him with its options. If he leaves it open, the
  skill says a default is written, and the conductor has to choose that default itself (W3).
- **Acceptance.** Step 3: there is no driver. The skill says to ask him, and on his yes to write one on
  `scripts/lib/browser.mjs`. Where the script goes is not something he was asked (M8). If the build
  opens as files, it goes on as the dry run did. **If the build runs at an address or signs in, the walk
  stops here:** the library cannot open it, and nothing says what follows (W1). Past that, his answers
  to the numbered deviations, the accepted breach as "accepted at detail" for the judges, the report's
  place for what was approved as it is, the lessons and the stamp all run as written.

## Checked and sound

- **Every item and ruling, one by one,** against the findings file and the rulings at HEAD: F1, F2, F4,
  F5, F7, F10, F11, F13–F17, F19, F20, F23–F30, F32, F33, F37–F51, F53–F56, F58, F61, F63, F65, F67–F69,
  F71–F77, F79–F83, F86–F88, F90–F92, F94, F95, F97, F98, F100, F102, F104–F108, F110, F111. And R159
  (but W1), R160 (but W3), R162's words, R163–R169, R171's words (but W2), R172, R174 (but W3),
  R175–R179, R180's card lines and Handoff's words, R181, R183.
- **Nothing else crosses the edge.** R160 at setup: the mark comes off on his word alone. R175: the
  conductor splits a finding into its parts, quoting the judge, and decides nothing. R174: a list put
  as one question, with step 8's carve-out kept. F90: the conductor copies the designer's lines. F65:
  the conductor writes only the number line. R178: the conductor writes no value, and a table that
  still fails goes to him.
- **The kit agrees with itself**, but for W2, W3, M2, M3 and M11. "One at a time" is left only where
  R174 does not reach (Context's own questions, and what step 8 catches). The traits copy is never
  made by hand. "Not asked" and "she must read in order to act" are gone. The accepted deviations are
  carried through Detail → Look → Handoff → Acceptance, and R165's stale fact goes from Context's
  decision, by `DECISIONS.md` in Detail's carry list, to Handoff's slice.
- **Commands.** Every new or changed command in the skills and cards matches its script's `--help`
  (`card.mjs traits`, `alone.mjs --package`, `render.mjs --without-notes`, `shots.mjs --first-screen`,
  and the cards' `node <kit root>/scripts/…`). Every backticked kit path in `skills/`, `pool/`,
  `templates/` and `reference/` exists. Every template section a skill names is in its template.
- **Pins.** The removed pins were each replaced by one that pins the ruled rule, or the rule went with
  them (R164's kinds loop, "Not asked"). Context's `doesNotMatch(/one at a time/)` became "said once".
  The three "the dry run" tests of A2 pin the new rules rather than loosen old ones. `skills`, `pool`,
  `templates` and `evals` tests pass: 303 + 17.
- **Limits.** Skills are at most 200 lines and cards at most 132. Every fence and list was parsed with a
  CommonMark parser (markdown-it): all fences are recognised, no ordered list splits, and no indented
  paragraph falls out of its list item. Taking out the blank lines around fences renders correctly.
  Handoff's and Look's gates read denser in the source, and no worse.
- **Generic.** No product, person, profession or model was added outside `docs/`. `FOUNDER-ANSWERS.md`
  gained only the fictional founder's four answers.

## Not checked

The scripts and their tests (another reviewer's). The whole suite (single files only). The evaluation
runs. The design document. The run's notes, except to check `DRY-RUN.md`'s numbers.

## Re-review of fix round 1

Scope: what `review-557e6e1..3f4654d.diff` changed in the words, read **at HEAD** (`80038c1`, which
adds the controller's amendment of § 25 for R189 and R190), against `task-20-fix-round-1.md`. I checked
my W1–W4 and M1–M10, and the sentences the round touched for S1, S2, S3, S6 (as R190), S7, S10, S11 and
S15.

**Spec: met.** Every finding is addressed as the round ruled it, and M11 is left as ruled. **Quality:
approved**, with four new Minor findings, which can be fixed or deferred. Nothing new is Important.

### My findings, one by one

| Finding | State | What I checked |
|---|---|---|
| W1 (R189) | **fixed** | `driving.md` § "When the project keeps no driver" now opens by saying the library opens local files and nothing else, and that the section is for that case alone. A build that needs a server or a sign-in goes to him open, and the stage stops. Its sign-in bullet is now "holds no sign-in, and makes none". Acceptance step 3 says both cases, and its new Never line forbids a script that signs in or takes a sign-in from where it is kept. Every "sign-in" sentence of `skills/acceptance/` was read. Those that remain concern the project's own driver, or the rule against copying a credential: none has the session write code that reaches a credential. Setup and the profile template now say "for a build that opens as files". |
| W2 (with S2, S7) | **fixed** | `rounds.md` step 2 draws the graft twice and photographs it with `--first-screen`. Step 3 hands an audience only `chosen-screens-…` pictures, whole and first screen, and says a picture of `chosen.html` is never an audience's. `blind.md` steps 5–7 say what is drawn and pictured, twice each, and step 7 says who gets which. They point to Structure's step 7 for the commands instead of keeping a second copy, and rule 6 says "those drawn without the makers' notes". The three graft commands are held to their usage by a test. |
| W3 | **fixed** | Handoff step 9: "a default is written only where his answer takes it". An entry he leaves unanswered stays open, under `findings`, and the gate's question names it. The seats page says the same in its table row, in a bullet of its own ("You never fill in an answer he did not give"), under "The re-read" and in Never. Neither file still says "Where he leaves one open". The loop (§ 7) and Detail (step 4) now say where an unanswered entry is listed. Acceptance's deviations stay in its one listed question. Nothing else in the kit writes a default for an entry he left unanswered. |
| W4 | **fixed** | `DRY-RUN.md`: the rulings now run R157–R190, R186–R190 each have a row, and the "wave B" sentence is gone. R175's row says the page draws the heading. F46 names the two sections and F48 names four seats pages. R159's row points to R189, and R180's row says where the check now runs and when it may exit 1. The page now counts seven skills at the limit, which is true. It names no person, model, agent id or path outside the kit. |
| M1 | **fixed**, with N1 below | Context's "Project sources" and its template mark "the example data", and the template says what to write when there is none. The builder's card now says what it does when no data is handed. |
| M2 | **fixed** | Structure and Detail now say "its model and effort". Cast's step 9 still says "suggested", which is right there: Cast is where the cards' suggestions are shown. |
| M3 | **fixed** | A twelfth entry answers the seeded one, which stands as it was. The head of the file says which entries are the seed. |
| M4 | **fixed** | The judge brief's reply line stops at "says the reply is". |
| M5 (R190) | **fixed** | The loop, the audience's brief and the task reader's card now confine first screens to Structure, and the brief deletes the line from Detail on. A judge's brief from Detail on points to the `in-viewport` check. |
| M6 | **fixed** | The ruled words are in seven judge cards. The cold implementer keeps its own line. |
| M7 | **fixed** | The line under a designer's list now gives the outcome in full, with "(answer 12)" only beside it, and says why. |
| M8 | **fixed** | One question, which names the path. His answer is written under "Reviewed by the founder" of `REPORT.md` before the driver is written. `scripts/lib/browser.mjs` is now among the skill's Reads. |
| M9 | **fixed** | Detail step 4, and the loop § 7. |
| M10 | **fixed** | Every line I named is rewrapped. No prose line over 105 characters is left in the files the round touched, except `handoff/SKILL.md:19`, which I did not name and the round's report notes. |
| M11 | left, as ruled | — |

### The round's other sentences

- **Handoff's steps as they now run (S1, S3).**
  - Step 3 runs the plain `alone.mjs <package>/07-handoff`, and it "must exit 0". It reads pages and
    stylesheets only, so the guide's and the entry's mention of `DECISIONS.md` cannot fail it there.
  - The `--package` run now ends step 7, after `COVERAGE.md` and `HANDOFF.md`, and before the cold
    implementer. It runs again in step 9 whenever any file changes, and `folder.md` says the same,
    with why it could not pass at step 3.
  - It may exit 1 in one case only. Every place it prints must be in a file approved at an earlier
    stage and copied in unchanged, and `PARTS.md` must list each place without the name it points to.
    The worked example does not name it. Those places go to him with the gate, named in its question.
    Any other place is mended first. So "must exit 0" and "is not rewritten" no longer meet. Sound,
    with N2 and N3 below.
- **The one command now given as a code span.** Step 7's `--package` command is now an inline code
  span on its own line, not a fence. `commandsOf` reads code spans in prose as well as fences. The
  Handoff test holds this exact string to `alone.mjs`'s usage (`takenBy`), asserts that step 7's
  commands include it and step 3's do not, and asserts the stage's command list in order. So the test
  still holds it to `--help`.
- **The skills at 200 lines.** Seven skills now stand at 200 lines. I parsed them with CommonMark
  (markdown-it):
  - every fence is recognised;
  - each Steps list is still one ordered list;
  - no indented paragraph falls out of its list item;
  - "**Routed `short`**" and each gate's "One question" sit outside the lists, and each "Then append"
    stays inside its gate bullet;
  - "## Question" followed directly by its line renders as a heading and a paragraph.

  They render correctly. In the source, Handoff's and Look's gates read denser, and no worse.
- **S6 as R190, S10, S11, S15.** The sentences are in place:
  - Detail's and Look's seats pages say no first screen is pictured there.
  - `KIT-CONTRACT.md` describes the page drawn without the notes.
  - Setup's `profiles/` line names the check.
  - Context runs `card.mjs check` on a profile it drafted or changed, and "mends its form, never a
    trait".
  - The loop § 7 names the "Accepted deviations" heading.
- **Pins.** Each removed pin has a replacement that pins the new rule. Examples: the plain and the
  `--package` commands; the pointer in a stylesheet, which the run-as-written test now runs both ways
  with `PARTS.md`; "What step 8 catches"; and the graft's audience. None was loosened. `skills`,
  `templates`, `pool`, `skeleton` and `evals` tests: 330 pass.
- **The design document, § 25.** It agrees with the rulings it cites: R164, R174, R175 with R186, R159
  with R189, R154 with R171 and R190, and R188.

### New in the round

**N1 · Minor** · `pool/makers/prototype-builder.md:52-54` against `skills/detail/references/seats.md:112-113`
- The builder's card now promises: "the conductor asks the founder for the data, and it comes to you in
  a brief". Detail's seats page still sends everything the builder could not build to the decision
  page, under `findings`, at the gate. No step of Detail asks him for the data before the gate, or
  starts a fresh builder with it. The walk forks there.
- **Fix:** one line in Detail's seats page, under the builder: a page left without its example rows
  goes to him as step 4 says, his answer is written under "Reviewed", and a fresh builder is handed it.
  Or make the card say what the seats page says.

**N2 · Minor** · `skills/handoff/references/seats.md:56-58`; `skills/handoff/SKILL.md:190-192`
- "A reference that points outside the folder. Write out what it pointed to, and take the reference
  out" and "Never let the folder point outside itself: no path into the package" are still
  unqualified. S3 now lets a pointer stay in an approved file. Both lines were there before the round,
  but they now contradict S3's exception.
- **Fix:** "in a file you wrote; in an approved file, as `references/folder.md` says, under 'When it
  may exit 1'".

**N3 · Minor** · `skills/handoff/references/folder.md` § "When it may exit 1"; `skills/handoff/SKILL.md` step 10
- A pointer left in an approved file goes on the decision page "as an open finding". But `page.mjs`
  refuses a finding with no `seat`, and nothing says what the seat of a place the script found is.
  Step 10 lists the cold implementer's items and the defaults only. The session has to invent a label.
- **Fix:** name it, as Acceptance names `check: <id>` and `by hand` (for instance
  `alone.mjs --package`), in step 10 and in `folder.md`.

**N4 · Minor** · `skills/acceptance/SKILL.md:48-65` (Writes)
- Since R159, Acceptance can write a script in the project and a line into the project profile. Its
  Writes table and the paragraph under it name neither.
- **Fix:** one sentence under the table: on his yes, the driver at the path he approved, and its
  command under "How a browser check is run here".

### R191: sound

The ruling puts the `in-viewport` check in the visual designer's own `checks.json`, and that is right.
Choosing which element answers "which rooms are free now, without scrolling" is a design judgement.
Under R190 as built, the conductor makes it, and writes into a maker's file, which is the edge the kit
keeps. Four things go with it, for the next round:

1. The visual designer is not handed the intent at Look (`look/references/seats.md:44-48`), so its
   brief must carry each such criterion. Its "Its brief gives three things" becomes four, and
   `templates/briefs/maker.md` needs that line.
2. A variant's own `checks.json` needs the check too.
3. Detail's seats page says "the `in-viewport` check Look adds", and `DRY-RUN.md`'s R190 row says
   "Look's skill, which adds". Both change with the ruling.
4. At step 5, "a check that failed" goes to the send-back. A failed `in-viewport` check is a
   criterion not met, not a row of the table that does not hold. Say whether that redesign belongs to
   the send-back before any reader, or the result is handed to the judges as it came (as
   `look/references/seats.md:139-143` already provides) and becomes a finding.

### Not checked

The scripts and their tests, beyond the command strings (another reviewer's). The whole suite. The
evaluation runs.
