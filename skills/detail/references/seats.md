# The seats at Detail: what each is handed, and what it does not open

One section for each seat of the kit whose card sits at Detail. A brief hands a seat what its card's
`reads` allows and this page lists, each file by its absolute path, and lists under "Do not open" what
its card's `never-reads` names, as this package holds it. Nothing is pasted into a brief but the
founder's own lines, which the brief templates ask for as he said them. How a seat is started, on
which model, and the rules of a shared machine are in `skills/design/references/loop.md`, under
"Starting a seat". Every brief is written into `<package>/work/`, named as the loop says, and keeps
the template's last line: a seat that starts a browser stops only the one it started. You fill a
brief from this page and never from the seat's card, which you do not open.

A card of the project's own that the cast sheet seats here is handed what its header's `reads`
allows, by the same rule.

Two names are used below. `<chosen>` is the chosen proposal's file, as the carry list of `CHOSEN.md`
names it: the picked letter's file on the board or, after a graft,
`<package>/04-structure/chosen/chosen.json`. "The states and the rules" are two files:
`<package>/05-detail/states.md`, and `<package>/05-detail/DETAIL.md` for the rules, the edge cases,
the data map and the dependencies.

## The makers

One after another, never together: each reads what the one before it wrote. Each is handed, besides
what its own section lists, the two lines the maker's brief template keeps for them: her card, by the
path the carry list names, and her profession's profile, whole, its base and then the section of her
specialty. Where she has no profession, the second line is deleted. Every maker's brief lists these
under "Do not open":

- everything in `<package>/04-structure/` but `<chosen>` and its pictures: the board, the proposals
  folder and `<package>/04-structure/earlier/`, and with them every proposal that was not chosen;
- `<package>/04-structure/CHOSEN.md`, which says who made which letter, and `<package>/03-cast.md`;
- `<package>/work/`, but its own brief and, for the prototype builder, the folder of its own check;
  and `<package>/05-detail/reads/`, but a ledger the fix round hands it.

### `maker.interaction-designer`

- **Its brief,** from `templates/briefs/maker.md`, gives this product's worst cases: every row of
  the context's inventory that states a limit, a delay or a failure, as the context states it. The
  rule selects them: you weigh none, and leave none out.
- **Handed:** `<chosen>`, with its pictures. `<package>/02-intent.md`, the intent, for its states
  table, its tasks and its success criteria. `<package>/01-context.md`, the context, for the
  inventory its data map traces to. Her card, and her profession's profile, whole.
- **Do not open:** the list above.
- **Writes:** `<package>/05-detail/states.md`, in the shape of its template, and in
  `<package>/05-detail/DETAIL.md` the headings its card names: "Rules", "Edge cases", "Data map",
  "Dependencies", "States the intent does not name" and "What the structure cannot hold". Nothing
  else of that file is its to touch: not its header, and not another heading. The title is yours,
  written with `built-from` at step 2 of the skill, and the template's comment goes at step 9.
- **Its three lists** are the first thing you read in its reply. A list that is not empty is the
  founder's, as one question, its entries numbered, before the interface writer starts:
  - *Dependencies.* The question of step 4 of the skill. An element he keeps stays a dependency,
    and the handoff carries it. One he takes out goes back to a fresh interaction designer, with
    his words.
  - *States the intent does not name.* Whether a state exists is his call: ask. One he says exists
    is the intent's to name: ask to reopen Intent, as the conductor's "Resuming" says. One he says
    does not exist stays on the list.
  - *What the structure cannot hold.* Detail completes the structure, and does not mend it: tell
    him which screen breaks. He reopens Structure, or accepts it as a cost, in his words.
- **His answers are written once.** His words go under "Reviewed by the founder" of `DETAIL.md`,
  numbered, and under the list one line gives each outcome in full, the answer's number only beside
  it, as "A waiting list when no room is free: it does not exist, and the element goes (answer 12)".
  The heading is read without the section his words are in, by Look's judges and at Handoff, so the
  line must stand alone: a number, by itself, is a pointer. That line is the one thing you write
  under a heading of the designer's: you change no entry.
- **A cost he accepts that breaks a standing rule or a line of the intent** is an accepted
  deviation. Write it under "Accepted deviations" of `DETAIL.md`: what it is, what it breaks, his
  words, the day. Where an answer of his would accept one without naming it, as a blanket yes to a
  whole list, say so first, with the rule and its source, as step 8 of the loop says: he decides
  each. The section is handed to every judge from here on, and never to an audience.

### `maker.interface-writer`

- **Its brief,** from `templates/briefs/maker.md`, carries three things. The founder's own lines,
  copied word for word from "The founder's own words" of the context: where that section holds
  none, the brief says so. The languages, as `languages` of the project profile lists them, the
  main one first, each with the register and the form of address the context's "Constraints" gives
  it. And the project's writing skill, where its line of the cast sheet names one.
- **Handed:** `<chosen>`. The states and the rules. `<package>/02-intent.md`, the intent.
  `<package>/01-context.md`, the context, with the project's string files that its "Project
  sources" lists, each by the path the carry list gives: the product's own vocabulary. Her card,
  and her profession's profile, whole.
- **Do not open:** the list above.
- **Writes:** `<package>/05-detail/strings.json`, in the shape of its template: each key with its
  line in every language, its limit, where it appears, and its why-line, never blank. The file
  holds the template's keys and nothing else: a note or a list of the writer's in it goes back to
  the writer, since every judge is handed that file.
- **Its two lists** come in its reply, and you copy them under "Strings" of `DETAIL.md` as they
  came. *Waiting for a fact:* ask the founder for the facts, as one question, its entries numbered.
  A fact that bears on a state goes to a fresh interaction designer too. *Nothing to say:* the
  entries go to a fresh interaction designer, sent back with them by where they sit: it settles
  each state, and its reply says in one line how. An entry it settles as "no line owed" is closed.
- **One fresh interface writer then writes the lines,** handed his facts and the settled entries
  together, as he said them and as the designer left them. You write none. An entry he has
  already answered is not sent round again, and this round is run once: what is still open after
  it goes to him with the gate.
- **A line for an element the structure lacks,** which the writer names in its reply, is not
  written, by it or by you: it is a finding for the founder, with the gate.

### `maker.prototype-builder`

- **Its brief,** from `templates/briefs/maker.md`, gives the folder of the kit, `<kit dir>`, and the
  two widths of the context's "Constraints".
- **Handed:** `<chosen>`. The states and the rules. `<package>/05-detail/strings.json`, the strings.
  `<kit dir>`, the shared kit, and `kit/KIT-CONTRACT.md`, its contract. The data the example rows
  come from, where "Project sources" of the context names such a file, by the path the carry list
  gives it: the builder makes up no room, time or name. Her card, and her profession's profile,
  whole.
- **Do not open:** the list above, and the project's component source, the folder the project
  profile names under `components`: the prototype is files that open from a folder.
- **Writes:** `<package>/05-detail/prototype/`: one page for each screen, state and language, named
  `<screen>-<state>-<language>.html`, the index, the kit's stylesheets, and the descriptions and
  the script that made them. The pictures of its own check go in `<package>/work/prototype-check/`:
  the pictures of record are yours to take, in step 5 of the skill.
- **It drives a browser,** and counts among the three.
- **What it could not build as specified** is in its reply: it goes on the decision page under
  `findings`, by seat. A string missing in one language goes back to the interface writer.

## The fix round

One round, in the makers' order, and each seat at most once.

- **Who fixes what.** A finding on a state, a rule, an edge case or the data map is the interaction
  designer's. One on a string, in any language, is the interface writer's. One on a page, its
  markup, a name or an order, is the prototype builder's. A finding on what the structure is, a
  screen too many or an item on the wrong screen, is nobody's to fix here: it goes to the founder
  with the gate, open.
- **Each is a fresh sub-agent in that seat,** with a brief from `templates/briefs/maker.md` that
  hands it what its section above lists, the artefact as it stands, and the findings that are its
  own: the ledger that holds each, by its path, and the finding's number in it.
- **The prototype builder runs last, whenever a state or a string changed:** no page is mended by
  hand, so every page is generated again. Then step 5 of the skill is run again.
- **A truth finding that needs something the product lacks** is the interaction designer's, and its
  one fix is a line under "Dependencies", with the element that needs it and what is missing. The
  element stays until the founder has answered.
- **What he accepted is not fixed.** A finding its ledger marks "accepted at" a stage goes to no
  maker and is not counted as blocking. Where only a part of a finding rests on an accepted
  deviation, split it as the loop says, and send the rest.

## The readers

The readers are started once the pages are photographed: the judges in one message, so that no
ledger exists while another judge reads, then the audiences. A reader that drives a browser, the
accessibility judge among them, counts among the three. What each reads is named by what it is,
never by who made it.

`<seat>`, in the name of a reader's file, is the seat's id, and a seat that is loaded adds what it is
loaded with, so that no two readers share a file: `judge.usability`, `judge.profile-<name>` for each
profession's profile, `audience.task-reader-<name>-<language>` for each person and language.

Make `<package>/05-detail/reads/` before you start the first reader: a seat writes its own file
there, and never lists the folder. Every judge's brief hands it "Accepted deviations" of
`DETAIL.md`, by the file and the heading, as part of what was approved, when that section holds
any: an audience's never does. A brief names first the pictures the seat's checks, or her tasks,
need. **No first screen is pictured here:** that is Structure's, and every picture of Detail is of
a whole page. So where a success criterion of the intent says "without scrolling", a judge's brief
says that a measured check answers it, the `in-viewport` check Look adds to its checks, and that
no picture of this stage does; an audience's brief says nothing of first screens. Every reader's
brief lists these under "Do not open":

- `<package>/work/`, where the makers' briefs and replies are;
- `<package>/04-structure/MAP.sealed.json`, the author map, and `<package>/04-structure/CHOSEN.md`,
  which names who made which letter;
- `<package>/03-cast.md`, the cast sheet: it holds each maker's engine;
- every file of `<package>/05-detail/reads/` but its own, and `<package>/04-structure/reads/`;
- `<package>/05-detail/decision.json`, `<package>/05-detail/decision.html`,
  `<package>/05-detail/words.json` and `<package>/05-detail/words.html`, which sum up what the
  other seats said;
- the rest of `<package>/04-structure/`: the board, the proposals folder, `earlier/`, but `<chosen>`
  where a seat is handed it.

**On a re-read** the brief is the first read's, and says so. It names one file more: that seat's
earlier ledger, the one file of `<package>/05-detail/reads/` it opens besides its own, and only
after it has read cold and written its findings. It writes its first read's name with `-reread`
before `.md`, as `judge.usability-reread.md` or `judge.profile-<name>-reread.md`, beside the first
read and never over it.

### `judge.usability`

- **Its brief,** from `templates/briefs/judge.md`: the prototype, with its two widths and its
  languages, and the cut of its optional checks, on and off, as its line of the cast sheet has it.
- **Handed:** `<package>/02-intent.md`, the intent. `<chosen>`. The states and the rules.
  `<package>/05-detail/strings.json`, the strings. `<package>/05-detail/prototype/`, the pages.
  `<package>/05-detail/shots/`, the pictures.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/05-detail/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.truth`

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's. It carries one line:
  where the context and a source it is handed disagree, the context holds.
- **Handed:** `<package>/01-context.md`, the context, for the inventory it traces every element to.
  `<package>/02-intent.md`, the intent. The project's facts document, where the project profile
  names one under `facts`. The data the example rows come from, where "Project sources" of the
  context names such a file, by the path the carry list gives it. `<chosen>`. The states and the
  rules, with the data map and the dependencies: a claim to test, never its trace.
  `<package>/05-detail/strings.json`, the strings. `<package>/05-detail/prototype/`, the pages.
  `<package>/05-detail/shots/`, the pictures.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/05-detail/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.words`

- **Its brief,** from `templates/briefs/judge.md`, carries the founder's own lines, as he said
  them: the lines the interface writer was given, word for word.
- **Handed:** `<package>/02-intent.md`, the intent. `<package>/05-detail/strings.json`, the strings
  with their why-lines, which are part of the strings and not a maker's note. The states and the
  rules, for where each string appears. `<package>/05-detail/prototype/`, the pages.
  `<package>/05-detail/shots/`, the pictures, for each line in its place.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/05-detail/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.
- **Where the kind is `first-run`, `message` or `public-page`,** its read is put to the founder as a
  question of its own, before the prototype's page: the gate of the skill says how.

### `judge.accessibility`

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's. It says the prototype
  is plain: its colours and its sizes are the kit's, so neither is measured at Detail, while reflow
  and focus are. And it names the folder for the seat's own checks and pictures,
  `<package>/work/<seat>-check/`.
- **Handed:** `<package>/02-intent.md`, the intent. The states and the rules, for the focus order
  and the keyboard. `<package>/05-detail/prototype/`, the pages, as source.
  `<package>/05-detail/shots/`, the pictures.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/05-detail/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.profile`

One for each profession's profile the cast sheet loads into this seat, as `profile.<name>`. Detail
is its main read.

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's.
- **Handed:** its profession's profile, whole, by the path the carry list names.
  `<package>/02-intent.md`, the intent. `<package>/05-detail/shots/`, the pictures of every screen
  and state. `<package>/05-detail/strings.json`, the strings.
- **Do not open:** the list above: the audiences' reads are in it, and so is the ledger of another
  profile judge. And the pages themselves: it reads the prototype as pictures.
- **Writes:** its ledger, `<package>/05-detail/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`: `judge.profile-<name>.md`, so that two profile judges never share
  a file, in a first read or in a re-read.

### `audience.task-reader`

One for each person the cast sheet seats it as, `person.<name>`, and one task read for each language
the product ships. Where `languages` holds more than the sheet seats readers for, start one instance
for each language, the same person, and tell the founder that the sheet's count grows by them.

- **Its brief,** from `templates/briefs/audience.md`: who she is, the one language she reads in, the
  width each task puts her at, in the light theme, and her tasks, copied word for word from "Tasks
  for the audience" of the intent: where she starts and what she wants. Never the path, a
  criterion, or the job as the intent states it. Where the tasks are not written in her language,
  the brief says so. There is one option: the brief asks no ranking, and asks for the stuck points.
- **Handed:** her card. Her profession's traits: a copy of her profession's profile with every
  `So the interface must:` field removed, written beside the brief as the loop says, and the one
  file of `<package>/work/` she opens. And the pictures of every page in her language at the width
  each task puts her at, each by its path, as
  `<package>/05-detail/shots/today-default-en-390-light.png`. The pictures, and pictures only.
- **Do not open:** the list above, and with it: `<package>/02-intent.md`, and every other file of
  the package; her profession's profile itself; `<package>/05-detail/prototype/`, the pages and
  their source; `<package>/05-detail/states.md`, `<package>/05-detail/DETAIL.md` and
  `<package>/05-detail/strings.json`. A person cannot find a control by reading markup.
- **Writes:** one task read, `<package>/05-detail/reads/<seat>.md`, in the shape of
  `templates/outputs/TASK-READ.md`: `audience.task-reader-<name>-<language>.md`.
