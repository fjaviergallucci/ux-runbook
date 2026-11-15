# The handoff folder: what fills each file

One section for each thing in `<package>/07-handoff/`, in the order the skill writes them: what it is
written from, by the line of Look's carry list that hands it to you, and what it must hold.
`<package>`, `<packages>` and `<tokens>` are as the skill gives them, and `<version>` is the version
a stage stands at, as `status` prints it.

Two rules hold for every file:

- **Nothing points back into the package.** No path of a stage's folder, no letter of the board, no
  name of a seat's ledger file, no "as decided at Detail". What a builder needs from an earlier stage
  is written out here, in full.
- **What she reads is copied, never retold.** A string, a state's name, an id and a measured value
  are written exactly as approved. Only the sentences around them are yours.

## What the carry list hands you

| Line of Look's carry list | What it is | Where it goes |
|---|---|---|
| `- intent@<version>#<slug>` for "The person in the moment", "The one job", "Success criteria", "States" | who it is for, her job, how done is known, the states | `HANDOFF.md`, `SPEC.md`, `ACCEPTANCE.md` |
| `- intent@<version>#<slug>` for "What the readers found" | what the profile judge found reading the intent, where one read it | `COVERAGE.md` |
| `- context@<version>#<slug>` for "What the product can show and do", "Constraints" | the inventory, and the two widths | `SPEC.md`, `ACCEPTANCE.md` |
| `- context@<version>#<slug>` for "The problem, and why now", "What exists today", "What it must not become" | why it is built now, with what the judges found reading the surface as it is; what it replaces; what is out of scope | `HANDOFF.md`, `COVERAGE.md` |
| `- cast@<version>#<slug>` for the table of each stage | each seat, what it was loaded with, its checks on and off, its model and effort | `COVERAGE.md`; the "Handoff" table seats the cold implementer |
| `- structure@<version>#<slug>` for "The structure", "What it is deliberately bad at", "What the readers found" | the regions and their order; what is out of scope; the findings | `SPEC.md`, `HANDOFF.md`, `COVERAGE.md` |
| `- detail@<version>#<slug>` for "Rules", "Edge cases", "Data map", "Dependencies", "Strings", "What the readers found", "Accepted deviations" | the rules and the rest, as approved; what he accepted as a cost | `SPEC.md`, `COVERAGE.md`, `HANDOFF.md` |
| `- source:` the reads folders of Structure, Detail and Look | every ledger and every task read | `COVERAGE.md` |
| `- source:` `states.md` and `strings.json` of the detail | the states table; the strings, with their why-lines | `SPEC.md`, `ACCEPTANCE.md`; `strings.json` |
| `- source:` the detail's prototype folder | the plain prototype: where each action leads | `SPEC.md`, and nothing is copied from it |
| `- source:` the look's screens and pictures | the final screens, and their reference pictures | `prototype/` |
| `- source:` `measures.md`, `checks.json`, `results.json` of the look | the measured values, the named extensions, and the checks they rest on | `ACCEPTANCE.md`, `acceptance.json`, `PARTS.md` |
| `- source:` `<tokens>` | the project's token file | `tokens.css`, `PARTS.md` |
| `- source:` the package's `DECISIONS.md` | every decision, as it was appended | `DECISIONS.md`, `HANDOFF.md` |
| `- source:` each project source of the context | today's source: where the surface lives, and what it replaces | `HANDOFF.md` |

`LOOK.md` itself is yours whole: "What the look decides", "Variants", "Named extensions" and "What
the readers found" among it. A section or a file that is on no line, and is not in `LOOK.md`, is not
handed to you: you do not open it, and where a file of the folder cannot be written without it, that
is the stop of step 2 of the skill. A package stamped before the carry list named a section the
table gives is such a case: say which line is missing, and never write the section from memory.

## `prototype/`, and `tokens.css`

The folder's `prototype/` is the final screens. The plain prototype of Detail is not copied: it wears
the shared kit, and a builder would take its grey for the look.

- **The pages.** Every page of `<package>/06-look/screens/`, under its own name. A variant he did not
  pick is not a screen, and nothing of `<package>/06-look/variants/` is copied.
- **The pictures.** For each page copied, its pictures in `<package>/06-look/shots/`, every width and
  theme, into `<package>/07-handoff/prototype/shots/`, under their own names. A picture of a variant,
  or of anything else, stays where it is.
- **The token file.** `<tokens>`, the project kit's copy, is copied to
  `<package>/07-handoff/tokens.css`. Note two things for `PARTS.md`, both of the project's own token
  file, `tokens` of the project profile, which the kit's copy was made from: its path, from the
  project's root, and the commit that last changed it, as the project's history gives it for that
  file. A file with changes not yet committed, or a project with no history, is said so in place of
  a commit.
- **The one line that changes.** Each page links `<tokens>` by its path in the project. In the copy,
  that one link names the copy, `../tokens.css`. Change it by a script, in every page alike, and
  nothing else. A link left as it was still loads the project's file from here, since the copy sits
  as deep as the page it was copied from: no check on the pages would notice.
- **The index.** `<package>/07-handoff/prototype/index.html`: every page as a link, grouped by
  screen, then state, then language. Its words are the screens' names and the names of the states,
  as `states.md` has them, and the languages by the codes `languages` of the project profile gives.
  Count the pages by tool: screens times states times languages, less the rows that cannot occur.

## The folder stands alone, proved

Once the pages, the token file and the index are in, and again after any of them changes:

```
node <kit root>/scripts/alone.mjs <package>/07-handoff
```

It reads every page and stylesheet of the folder and prints one line for each address that does not
lead to a file inside it: the file, the address, and why. It leaves the folder, it is remote, or the
file is not there. It exits 0 when there is none, and step 6 of the skill is not run before it does.
On success it prints one line, that the folder stands alone, with its counts: that line is not a fault.

- **A page's link that leaves the folder** is the one line above, missed in that page: point it at
  the copy, by the same script. A stylesheet, a picture or a script a page loads from the project is
  an asset: it is copied in beside the pages, and its address in the page made to lead to the copy.
  Those are the two changes a copied page takes, and the only two: its link to the token file, and
  the address of an asset copied in.
- **What a page loads that cannot be copied in,** as a script or a picture from another host: the
  page is not edited to pass. It is a fault in what was approved, and it goes to the founder, open,
  as a question, recorded with the `await` of the skill's gate. Nothing goes on until he answers.
- **What the token file loads,** a font or a picture, by `url()` or `@import`: copy the file into
  the folder, beside `tokens.css`, and make the address in the copy of the token file lead to it:
  kept where the file sits at the same path from the copy, rewritten where it does not. `PARTS.md`
  says, under its token file line, what was copied and from where.
- **What the token file loads that cannot be copied,** as a font served from another host or one
  the project may not hand on: take the line that loads it out of the folder's copy of the token
  file, which is a copy of the project's own file and no approved page, and list it in
  `HANDOFF.md`, under "Left to the builder", as a file the builder must supply: its name, what
  loads it, and where the project gets it. That address is written without its query: a key may
  ride there. The reference pictures were taken with it: say so beside it.
- **Never leave one unsaid.** Every address the command printed is copied in; or, in the copy of the
  token file, taken out and listed; or, in a page, put to the founder. None is left to load from
  outside, none is dropped in silence, and no page is edited to make the command pass.

**Nothing points back, proved too.** An address is not the only way out, so the same command, by its
`--package`, also reads every text file of the folder, its Markdown, its JSON, its stylesheets and
the comments of its pages among them, for the name of any file or folder of the package that the
folder does not itself hold: a stage's folder, a ledger, `measures.md`, a maker's notes. It prints
each place, by file and line, and exits 1. A folder's name is found where it is written as a path,
with its slash; `../build/`, the builder's place, may be named. A pointer that names no file, as
"answer 28" or "as decided at Detail", it does not see: the first rule of this page still holds for
what you write, and the cold implementer reads for the rest.

It is run once the folder's last file is written: after step 7 of the skill, before the cold
implementer is started, and again when a file of the folder changes at step 9.

```
node <kit root>/scripts/alone.mjs <package>/07-handoff --package <package>
```

Run at step 3 it could not pass: the entry and the guide name `DECISIONS.md`, which the package holds
from Frame on and the folder only from step 4; and the files of steps 4 to 7, where a pointer is
most often written, would never be read. Each place it prints is put right before the cold
implementer starts:

- **In a file you wrote,** write out what the pointer stood for, and take the pointer out.
- **In a file that was approved,** at an earlier stage, and copied in unchanged, as a comment of a
  stylesheet or a row of the states that reads "as answered", the file is not rewritten: what was
  approved does not change here. `PARTS.md` says where the pointer is and what it stood for, under
  its token file line, so that a builder who meets it finds its answer in the folder. It never
  writes the name the pointer points to, which would be one more place for the command to print:
  "the comment that opens `prototype/today.css` points to the list of the look's extensions: they
  are under 'Changes to the system', below".
- **A link** the command prints is no file of the folder: copy in what it leads to, under the
  link's own name, or take the link out.

**When it may exit 1.** Only so: every place it prints is in a file that was approved at an earlier
stage and copied in unchanged, and each is listed in `PARTS.md`, as above. Then the stage goes on:
the cold implementer is started, and those places are put to the founder with the gate, each as an
open finding on the decision page and named in the gate's question. He may leave one as it is, or
reopen the stage whose file holds it. Any other place is mended first, and the command run again.

## `IMPLEMENTER-GUIDE.md`, and `build/`

`reference/IMPLEMENTER-GUIDE.md` of the kit is copied whole, as it is, to
`<package>/07-handoff/IMPLEMENTER-GUIDE.md`: the builder has no kit, and the folder stands alone.

`scripts/inpage/accept-inpage.js` of the kit is copied whole, as it is, to
`<package>/07-handoff/accept-inpage.js`: it is what makes the checks of `acceptance.json` in a page,
and with it a builder can run them on the build, in whatever browser it drives. The template of
`HANDOFF.md` has its row, and the guide says how it is used. The builder still has no kit: the file
is one page of script, and needs nothing else.

The three pages of `templates/package/build/` are copied to `<package>/build/`, as they are, unless
they are already there. They are the builder's to fill. `HANDOFF.md` names them as `../build/`, and
that is the one path in the folder that leaves it.

## `SPEC.md`

One block for each surface, from `templates/package/07-handoff/SPEC.md`.

- **Its job:** "The one job" and "The person in the moment" of the intent, in a sentence.
- **Regions, in priority order:** "The structure" of the chosen structure, each region with its
  elements by their stable ids, as the final screens carry them.
- **States:** the rows of `states.md`, every column, each with its page in `prototype/`. A row that
  cannot occur keeps its line and its reason, and has no page. A case inside a row that has no page
  of its own, as three kinds of room in one row of a dialog, is written out here, and listed in
  `ACCEPTANCE.md` as one a person looks at: it is no state, and no page is owed for it.
- **Rules:** the detail's "Rules" and "Edge cases", whole. Where an action leads is read in the plain
  prototype's pages, by tool, and written as a rule. What changes at each width, and motion with its
  reduced form, are "What the look decides" of `LOOK.md`.
- **Data map:** the detail's rows, with the row of the context's inventory each names written out:
  the field, the call or the state in the product, and where that is defined.
- **Dependencies:** the detail's, each with what the founder settled for it, from `DECISIONS.md`, and
  what the build does until it exists.

## The strings

`<package>/05-detail/strings.json` is copied to `<package>/07-handoff/strings.json`, whole: every key,
every language, `max`, `where` and `note`, the why-line, which travels with the string. The file
holds the template's keys and nothing else. A note or a list of a maker's in it is no string: it is
a fault in what was approved, and goes to the founder, open, before the file is copied.

When the project profile names a `strings-format`, the same keys and the same strings are also
written in that format, as the project's translation layer takes them: one file, or one for each
language, named `strings.<language>` with the format's extension. A script writes them from
`strings.json`, and a second run of it counts: every key, in every language, in both. Nothing is
retyped. `HANDOFF.md` names both, and says which the build loads. With no format named, `strings.json`
is the strings file, and `HANDOFF.md` says the project named none.

## `PARTS.md`

Written from the component source, read in this session: the folder the project profile names under
`components`. The tokens are read in `<tokens>`.

- **The token file line:** its path in the folder, `tokens.css`; the path of the project's own token
  file, which it was copied from by way of the project kit; that file's commit; and each file
  copied in with it, because the token file loads it, with where it came from. Under it, each
  pointer an approved file still holds: where it is and what it stood for, never the name it
  points to.
- **Existing parts:** one row for each element id of `SPEC.md`. The component's name is the source's
  own. The file is the one you opened. The tokens are the ones the final screens use for it.
- **An element with no part in the system** has no row made up for it. It is a question for the
  founder, at step 9 of the skill: is it a change to the system, or is the element built another way?
- **Changes to the system:** each named extension of `measures.md`, with its definition: its name,
  what it is (a token, a part or a pattern), its values beside the system's own, the element ids that
  use it, and what it costs. "None" when the look named none.

A project with no component source, where `components` is empty, has no "Existing parts" to read:
the section says so, and every part a builder needs is then a change to the system, or his to ask.

## `ACCEPTANCE.md` and `acceptance.json`

`acceptance.json` is one object: `design`, the design's name, and `checks`. Keep "A check" and "The
check types" of the template whole: they tell a builder what each check measures, and what it does
not ask. `<package>/06-look/checks.json` is already in this shape: its checks are taken over, each
with the criterion it holds.

- **A check for each success criterion a script can check,** in the intent's words, as its
  `criterion`. A criterion no script can check is judged by eye: `ACCEPTANCE.md` says who looks, and
  at which picture. Who looks is a seat of the cast, the task reader for "a person trying her
  task", or the founder; where a criterion names a language, a reader of that language.
- **Every state is driven.** "States to drive" lists every row of `states.md` with its page, and
  each state has at least one check: what must be `visible` in it, and what must be `absent`.
- **Every measured value is held.** Each row of `measures.md` has its check: a `contrast` with its
  `min`, a `min-size` with its `minWidth` and `minHeight`, at the row's width and theme. The `min`
  of a `contrast` is the standard the row is held to: the measured value stands beside it, under
  "Measured values" of `ACCEPTANCE.md`. No check measures a gap, a size of text or the length of a
  line: such a row is listed in `ACCEPTANCE.md`, under "Measured values", with its value and
  "measured by a person" where its check would be.
- **An element is named by its `data-ux`.** Where two screens carry the same id, the check names its
  `screen`, and the element is looked for inside the one element whose `data-screen` is that screen.
- **A check names its `state`, its `page`, its `width`,** and its `theme` when it is not light. The
  widths are the two of "Constraints". A check needed at both widths is two checks, each with its
  own `id`.
- **Accessibility:** the checks a script makes are named by id. Those made by hand in the build are
  listed with what holding looks like: the keyboard alone, a screen reader, text at 200%, reduced
  motion.

Run them on the prototype, by the command of step 6 of the skill, and read what it prints:

- **`failed: <id>: <why>`:** the check is wrong, or the id is. Fix the check. A page is never changed
  to make a check pass. Where the check says what the criterion says and the approved screen still
  does not meet it, neither is yours to change: it goes to the founder, open.
- **`cannot be told:`** an `in-viewport` check where pointing cannot say. **`cannot be measured:`** a
  `contrast` over a picture, an opacity, a filter or a blend. Neither is a guess to keep: rewrite the
  check on an element where it can be made, or take it out and list it as one a person must look at.
- **A page's own error** (a script error, a console error, a resource that did not load) fails every
  check of that page. `--allow-errors` turns it into a warning: pass it only when the error is known
  and harmless, and write the reason in `COVERAGE.md`, as a sentence: which page, which error, and
  why it is harmless.

Write the last run into `ACCEPTANCE.md`: the day and the counts, as "8 checks: 0 failed, 8 passed".
The line the command prints goes on to say where its results are, in a folder the builder is never
given: that part is left out, and so is the command.

## `DECISIONS.md`

From the package's `DECISIONS.md`, in the shape of `templates/package/07-handoff/DECISIONS.md`: each
decision that bears on what is built, numbered, written out so that it needs no other file. A letter
of the board becomes what that option was. "Cost, accepted" and "Consequence" become "Forces on the
build". A decision about the process alone, as a round set aside or a model changed, is left out: its
trace is in `COVERAGE.md`.

## `COVERAGE.md`

- **Seats:** one row for each line of the cast sheet's tables for Structure, Detail, Look and
  Handoff. What it read, its checks run and its verdict are taken from its ledger or its task read.
  "Ran on" is the model its line names, or the session's where the line shows a dash; an outside
  engine is named with its model id. A maker has a row too, with a dash for its checks.
- **The seats of Context and of Intent** read before there was a cast sheet, and have a row each
  all the same: the judges that read the surface as it is, from "The problem, and why now" of the
  context, and the profile judge that read the intent, from its "What the readers found". Their
  ledgers are not carried: what such a section does not record of a seat reads "not recorded".
- **Checks not run:** from each ledger's own list, with its reason. Under the table, the checks of
  `acceptance.json`: the day they last ran on the prototype, the counts, failed and passed, and
  each check taken out as one a person must look at. No command and no path: neither is the folder's.
- **Findings:** every finding of every ledger and every stuck point of every task read, one row each,
  with what became of it: fixed, accepted by the founder in his words, carried as a dependency, or
  open with why. "What the readers found" of each stage says which. A finding with no fate written
  anywhere is open, and is said to be. Of Structure's ledgers, the findings on the chosen structure
  have a row each, with what Detail answered; those that hold only for a letter not chosen are
  counted in one line, and none is written out: a letter not chosen does not reach the folder.
- **A read of a fresh pass,** a file of Look's reads whose name ends `-beside.md` or `-borrow.md`,
  is entered under its seat like any other. A version it names by a letter is written as what it
  was: "the version on the project's tokens", or "a fresh version, not handed off". Never the
  letter, never the maker, the engine or the model, and never where the fresh screen is.

No row names a ledger's file: the builder cannot open it. **The cold implementer's own row and its
items are added only after its last read:** after the re-read when there is one, never between the
two, since a re-read reads the folder cold.

## `HANDOFF.md`

Written last, from `templates/package/07-handoff/HANDOFF.md`, since it sums up the rest.

- **What is in this folder:** the template's table, with one row more, for `tokens.css`: the token
  file the prototype is drawn on, copied in, with what it loads.
- **Context:** the product in one sentence, `product` of the project profile; who it is for and her
  moment; her one job; and why now, from "The problem, and why now" of the context.
- **Task:** the surfaces, from "The structure". What they replace is "What exists today" of the
  context. Where they live in the product is read now in the project sources the carry list names,
  never written from memory.
- **Done when:** the success criteria as `ACCEPTANCE.md` checks them.
- **Verify:** the project's own gates, by the commands the project uses. No carried section holds
  them: read them now, in "Standing rules" of the project profile and in the project's own
  documents, as its contributor's guide or its package file. A command you did not find written
  there is asked of the founder, at step 9 of the skill. It is never guessed.
- **Constraints:** the three the template gives, and each standing rule of the project profile that
  binds a build, one line each.
- **Slices:** in build order. Each is small enough to build, verify and commit alone, and names the
  screens and states it covers, a done-when someone can see, and the checks of `acceptance.json` it
  must hold, by id. Every check belongs to a slice, and every state to one. Where the context
  corrected a fact of a project document, one slice mends that document: the decision Context
  appended names the fact and the file, and the slice says what the document must read.
- **Out of scope:** "What it must not become" of the context, "What it is deliberately bad at" of
  the structure, and each element a decision took out.
- **Must not change, and Left to the builder:** what is decided, and what is his: with it, each
  file the builder must supply, as the proof that the folder stands alone left it. What is in
  neither is asked, never guessed. Under "Must not change" go the accepted deviations of `LOOK.md`,
  each as approved: what it is, what it breaks, his words, the date. A build that mends one has
  changed the design.
- **Reviewed by the founder:** empty until the gate.
