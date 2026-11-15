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
| `- context@<version>#<slug>` for "What the product can show and do", "Constraints" | the inventory, and the two widths | `SPEC.md`, `ACCEPTANCE.md` |
| `- cast@<version>#<slug>` for the table of each stage | each seat, what it was loaded with, its checks on and off, its model and effort | `COVERAGE.md`; the "Handoff" table seats the cold implementer |
| `- structure@<version>#<slug>` for "The structure", "What it is deliberately bad at", "What the readers found" | the regions and their order; what is out of scope; the findings | `SPEC.md`, `HANDOFF.md`, `COVERAGE.md` |
| `- detail@<version>#<slug>` for "Rules", "Edge cases", "Data map", "Dependencies", "Strings", "What the readers found" | the rules and the rest, as approved | `SPEC.md`, `COVERAGE.md` |
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
is the stop of step 2 of the skill. Two things are known to come without a line, and each is said
where it is missed, never passed over in silence:

- **The reads of Context and of Intent** came before the cast. `COVERAGE.md` says so in one line.
- **Why the design is built now** is the context's own, under "The problem, and why now".
  `HANDOFF.md` gives it only from a line that hands it to you, as "What it must not become" too.

## `prototype/`, and `tokens.css`

The folder's `prototype/` is the final screens. The plain prototype of Detail is not copied: it wears
the shared kit, and a builder would take its grey for the look.

- **The pages.** Every page of `<package>/06-look/screens/`, under its own name. A variant he did not
  pick is not a screen, and nothing of `<package>/06-look/variants/` is copied.
- **The pictures.** For each page copied, its pictures in `<package>/06-look/shots/`, every width and
  theme, into `<package>/07-handoff/prototype/shots/`, under their own names. A picture of a variant,
  or of anything else, stays where it is.
- **The token file.** `<tokens>` is copied to `<package>/07-handoff/tokens.css`. Note two things for
  `PARTS.md`: the path it was copied from, from the project's root, and the commit that last changed
  it, as the project's history gives it for that file. A file with changes not yet committed, or a
  project with no history, is said so in place of a commit.
- **The one line that changes.** Each page links `<tokens>` by its path in the project. In the copy,
  that one link names the copy, `../tokens.css`. Change it by a script, in every page alike, and
  nothing else: step 6 of the skill then proves it, since a page whose stylesheet does not load fails
  its checks.
- **The index.** `<package>/07-handoff/prototype/index.html`: every page as a link, grouped by
  screen, then state, then language. Its words are the screens' names and the names of the states
  and the languages, as `states.md` has them. Count the pages by tool: screens times states times
  languages, less the rows that cannot occur.

## `IMPLEMENTER-GUIDE.md`, and `build/`

`reference/IMPLEMENTER-GUIDE.md` of the kit is copied whole, as it is, to
`<package>/07-handoff/IMPLEMENTER-GUIDE.md`: the builder has no kit, and the folder stands alone.

The three pages of `templates/package/build/` are copied to `<package>/build/`, as they are, unless
they are already there. They are the builder's to fill. `HANDOFF.md` names them as `../build/`, and
that is the one path in the folder that leaves it.

## `SPEC.md`

One block for each surface, from `templates/package/07-handoff/SPEC.md`.

- **Its job:** "The one job" and "The person in the moment" of the intent, in a sentence.
- **Regions, in priority order:** "The structure" of the chosen structure, each region with its
  elements by their stable ids, as the final screens carry them.
- **States:** the rows of `states.md`, each with its page in `prototype/`. A row that cannot occur
  keeps its line and its reason, and has no page.
- **Rules:** the detail's "Rules" and "Edge cases", whole. Where an action leads is read in the plain
  prototype's pages, by tool, and written as a rule. What changes at each width, and motion with its
  reduced form, are "What the look decides" of `LOOK.md`.
- **Data map:** the detail's rows, with the row of the context's inventory each names written out:
  the field, the call or the state in the product, and where that is defined.
- **Dependencies:** the detail's, each with what the founder settled for it, from `DECISIONS.md`, and
  what the build does until it exists.

## The strings

`<package>/05-detail/strings.json` is copied to `<package>/07-handoff/strings.json`, whole: every key,
every language, `max`, `where` and `note`, the why-line, which travels with the string.

When the project profile names a `strings-format`, the same keys and the same strings are also
written in that format, as the project's translation layer takes them: one file, or one for each
language, named `strings.<language>` with the format's extension. A script writes them from
`strings.json`, and a second run of it counts: every key, in every language, in both. Nothing is
retyped. `HANDOFF.md` names both, and says which the build loads. With no format named, `strings.json`
is the strings file, and `HANDOFF.md` says the project named none.

## `PARTS.md`

Written from the component source, read in this session: the folder the project profile names under
`components`. The tokens are read in `<tokens>`.

- **The token file line:** its path in the folder, `tokens.css`; the path it was copied from; its
  commit.
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
  at which picture.
- **Every state is driven.** "States to drive" lists every row of `states.md` with its page, and
  each state has at least one check: what must be `visible` in it, and what must be `absent`.
- **Every measured value is held.** Each row of `measures.md` has its check: a `contrast` with its
  `min`, a `min-size` with its `minWidth` and `minHeight`, at the row's width and theme.
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
  and harmless, and write the reason beside the command in `COVERAGE.md`.

Write the last run into `ACCEPTANCE.md`: the day, and the count line the command printed.

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
- **Checks not run:** from each ledger's own list, with its reason. Under the table, the checks of
  `acceptance.json`: the command, the day it last ran, its count line, and each check taken out as
  one a person must look at.
- **Findings:** every finding of every ledger and every stuck point of every task read, one row each,
  with what became of it: fixed, accepted by the founder in his words, carried as a dependency, or
  open with why. "What the readers found" of each stage says which. A finding with no fate written
  anywhere is open, and is said to be.

No row names a ledger's file: the builder cannot open it. The cold implementer's own row and its
items are added after it has read, at step 9.

## `HANDOFF.md`

Written last, from `templates/package/07-handoff/HANDOFF.md`, since it sums up the rest.

- **Context:** the product in one sentence, `product` of the project profile; who it is for and her
  moment; her one job. Why now, when a line of the carry list hands it to you. With none, write
  "Why now: not carried into this folder", and list it on the decision page under `findings`: he may
  say it in a line with his go, and his line is then written in.
- **Task:** the surfaces, from "The structure". Where they live in the product, and what they
  replace, are read now in the project sources the carry list names, never written from memory.
- **Done when, and Verify:** the success criteria as `ACCEPTANCE.md` checks them; the project's own
  gates, by the commands the project uses.
- **Constraints:** the three the template gives, and each standing rule of the project profile that
  binds a build, one line each.
- **Slices:** in build order. Each is small enough to build, verify and commit alone, and names the
  screens and states it covers, a done-when someone can see, and the checks of `acceptance.json` it
  must hold, by id. Every check belongs to a slice, and every state to one.
- **Out of scope:** "What it is deliberately bad at" of the structure, and each element a decision
  took out.
- **Must not change, and Left to the builder:** what is decided, and what is his. What is in
  neither is asked, never guessed.
- **Reviewed by the founder:** empty until the gate.
