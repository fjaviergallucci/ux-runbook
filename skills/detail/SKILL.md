---
name: detail
description: "Use when the interface design pipeline reaches Detail: the chosen structure is completed in every state, rule and string, as a clickable prototype."
---
# Detail: does the chosen structure hold

You have the chosen structure completed: every state, every rule and every string, as a clickable
plain prototype in the shared kit. Three makers do it, one after another; judges and an audience read
it; what blocks is fixed once; and the founder approves on the prototype. You write no rule, no string
and no page, and you mend no finding: the stage is its order and its one fix round. The conductor
(`ux:design`) sent you, and its words are yours. Its loop is in `skills/design/references/loop.md`:
this page says only what is Detail's own.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`. `<kit dir>` is the
project's kit folder, the one the project profile names under `kit`.

## Question

Does the chosen structure hold in every state and every language?

## Reads

- **The chosen structure,** `<package>/04-structure/CHOSEN.md`, approved, and exactly what its carry
  list names: the chosen proposal's file and its pictures, and the sections of the cast sheet, the
  intent and the context it carries on. Of the cast sheet: its "Detail" table, a line for each seat
  with what it is loaded with, its checks and its model and effort. Of the context: "What
  the product can show and do", "Constraints", for the two widths, and "The founder's own words".
- **The state:** `node <kit root>/scripts/state.mjs status <package>` prints the kind, the version
  each stage stands at, and whether Detail is routed full or short.
- **The project profile,** `<packages>/PROFILE.md`: `kit`, `languages`, `facts` and `components`.
- **Of the kit:** the templates named under "Writes", and the three of `templates/briefs/`. Every card
  is read by its seat.
- **Never** a letter that was not chosen, `<package>/04-structure/earlier/`, the package's `work/`
  folder, or the chat.

## Writes

Everything below is in `<package>/05-detail/`, and the seats' briefs in `<package>/work/`. `<version>`
is the version a stage stands at, as `status` prints it: after a reopening it is not 1.

| File or folder | What it holds | From |
|---|---|---|
| `DETAIL.md` | the stage's output, with `built-from: [structure@<version>, cast@<version>, intent@<version>, context@<version>]`: the rules, the edge cases, the data map, the dependencies | `templates/package/05-detail/DETAIL.md` |
| `states.md` | one row for each screen in each state | `templates/package/05-detail/states.md` |
| `strings.json` | every string by its key, in each language, with its why-line | `templates/package/05-detail/strings.json` |
| `prototype/` | one page for each screen, state and language, and the index | the prototype builder |
| `shots/` | a picture of every page, at the two widths | the picture script |
| `reads/` | one ledger or one task read for each reader, and each re-read | `templates/outputs/LEDGER.md`, `templates/outputs/TASK-READ.md` |
| `words.json`, `words.html` | the words as a question of their own, where the kind asks for one | `templates/outputs/decision-approve.json` |
| `decision.json`, `decision.html` | the decision page, and its data | `templates/outputs/decision-approve.json` |

## Steps

1. **Begin.** Check the state as step 1 of the loop says. A stage that is awaiting the founder is not
   begun again: take his answer to "Gate", or to the step that asked for it. Otherwise mark it in work:
   ```
   node <kit root>/scripts/state.mjs begin <package> detail
   ```
2. **Read the chosen structure, and what its carry list names.** Copy the template to
   `<package>/05-detail/DETAIL.md`, and write `built-from` and the title, unless the file is already
   there: then go on from what the folder holds, at the first step whose file is missing. The
   template's comment stays until step 9.
3. **Start the three makers, one after another.** Each is a fresh sub-agent, started as "Starting a
   seat" in the loop says, on the model and the effort its line of the approved cast sheet names: a
   dash means the session's model, and you enforce none. Its brief is written from
   `templates/briefs/maker.md`, and hands it what `references/seats.md` gives its seat, and no more.
   Each waits for the one before it, since it reads what that one wrote:
   - **`maker.interaction-designer`** writes `states.md` and, in `DETAIL.md`, the rules, the edge cases,
     the data map and the dependencies. Its reply counts three lists: read them first, and settle each
     entry with the founder, as step 4 says, before the next maker starts. It answers in a line each
     finding Structure's readers left open, which its brief hands it.
   - **`maker.interface-writer`** writes `strings.json`: every string, each language written for
     itself, each with its why-line. Its brief carries the founder's own lines, copied word for word
     from "The founder's own words" of the context: they are the bar its lines must meet.
   - **`maker.prototype-builder`** generates `prototype/` in the shared kit, `<kit dir>`: one page
     for each screen, state and language, and the index.
4. **Put what a maker could not decide to the founder, one list at a time,** as soon as its reply
   names it, and before the next maker starts: a list is one question, its entries answered by
   number, as step 7 of the loop says. You supply none of it, and you drop nothing:
   - **A dependency:** an element needs something the product cannot supply today, as a waiting
     list when no room is free. It stays on its screen, and on its line under `## Dependencies`. Ask
     him: is it to be built with the design, or does the element go? If it goes, the interaction
     designer takes it out, never you.
   - **A state the intent does not name, a fact a string waits for, a state the structure cannot
     hold:** `references/seats.md` says what each asks of him, and which stage it may reopen.

   Record the question with the `await` of the gate, write his answers under
   `## Reviewed by the founder`, numbered, as he said them, and put the stage back in work with the
   `begin` of step 1. An entry he leaves unanswered stays open: it is listed under `findings` on the
   decision page, and named in the gate's question. A breach of a standing rule or of the intent that
   he accepts as a cost goes under `## Accepted deviations`: `references/seats.md`.
5. **Photograph every page.** Light only: the themes are Look's. Once the prototype is generated, and
   again after every change to it:
   ```
   node <kit root>/scripts/shots.mjs <package>/05-detail/prototype --out <package>/05-detail/shots --widths <primary>,<phone>
   ```

   The two widths are those of "Constraints". A line `error:` is the prototype builder's to fix: the
   page goes back to it, once. A line `overflow:` goes to the readers as it is.
6. **Start the readers.** The judges and the audiences of the cast sheet's "Detail" table, each a
   fresh sub-agent on what its line names: the judges in one message, then the audiences, and those
   that drive a browser three at a time at most. A judge is handed the prototype, the states, the
   rules and the strings as its card reads them. The words judge is handed the strings with their
   why-lines, which are part of the strings, and its brief carries the founder's own lines. An
   audience is handed pictures only, in one language. What each is handed, and what its brief lists
   under "Do not open", is in `references/seats.md`. Each writes one file in `reads/`. Make that
   folder first: a seat never lists it. Every judge is handed the accepted deviations, as approved.
7. **One fix round.** Send each finding marked `blocks` to the maker whose artefact it is on: a
   state, a rule or the data map to the interaction designer, a string to the interface writer, a
   page to the prototype builder. Each is a fresh sub-agent in that seat, handed the findings and the
   artefact, in the makers' order. Then the pages are generated again, and step 5 is run again. **A
   truth finding that needs something the product lacks is never fixed by taking the element out:**
   it becomes a line under `## Dependencies` and a question to the founder, as step 4 says.
8. **One re-read.** For each judge that marked a finding `blocks`, a fresh sub-agent in the same
   seat reads the prototype again. Its brief says it is a re-read, and names that seat's earlier
   ledger, to be opened only after it has read cold: it then marks each earlier finding *fixed*,
   *partly* or *still present*, in `<package>/05-detail/reads/<seat>-reread.md`. **There is no
   second round:** what is still open goes to the founder with the gate.
9. **Build the decision page.** Fill the rest of `DETAIL.md` as its template says: "What is in this
   folder", "Strings" with the writer's two lists, and "What the readers found", each finding fixed or
   open with the reason, and each Structure carried on the chosen structure with the line a maker gave
   it. Delete the template's comment. Then write `<package>/05-detail/decision.json` in the shape of
   `templates/outputs/decision-approve.json`: the prototype as its one option, its pictures named from
   the page, the phone width first, as `shots/today-default-en-390-light.png`; one line for each seat
   that read it; each finding that stayed open under `findings`, by seat; one recommendation, resting on
   the reads; one question. Its identity is as `status` prints it, its stage as the loop counts it.
   ```
   node <kit root>/scripts/page.mjs <package>/05-detail/decision.json --out <package>/05-detail/decision.html
   ```

**Routed `short`** (an adjustment), Detail is what changes, and no more. **Sized `flow`,** it goes
surface by surface, steps 3 to 8 once for each, and is approved and stamped once.
`references/forms.md` has both. **Sized `correction`,** it is one change and one nod, and casts no
seat: `references/correction.md`.

## Gate

**He approves, on the prototype.** Where the kind is `first-run`, `message` or `public-page`, the
words are a question of their own, asked first: the first point below. Then put
`<package>/05-detail/decision.html` in front of him, and the prototype itself,
`<package>/05-detail/prototype/index.html`, to open and click through. Record the one question, so
that a session resuming tomorrow asks the same:
```
node <kit root>/scripts/state.mjs await <package> detail --question "<the one question>"
```

One question, about one thing: do you approve this prototype for Look? **Stop: you do not approve,
and you go no further without his words.**

- **The words, asked first, for those three kinds.** Write `<package>/05-detail/words.json` in the shape
  of `templates/outputs/decision-approve.json`: the strings in each language as its one option, the
  words judge's line, its findings that stayed open, one question: do you approve these words? Build it,
  put it in front of him with `strings.json`, and record it with the same `await`. His answer is written
  apart under `## Reviewed by the founder`. Only then is the prototype's page put to him.
  ```
  node <kit root>/scripts/page.mjs <package>/05-detail/words.json --out <package>/05-detail/words.html
  ```
- **Write what he says under `## Reviewed by the founder`:** what he corrected, and the words he
  approved the prototype with, as he said them. A correction goes to the maker whose artefact it is
  on, a fresh sub-agent handed his words. The pages are generated and photographed again, and he
  sees them before the stamp. You change no rule, no string and no page yourself.
- **Write the carry list,** `## Carry`: the lines of `CHOSEN.md`'s own carry list, as they are; a
  `- cast@<version>#structure` line, so that the cast sheet's table for every stage travels on; a
  `- structure@<version>#<slug>` line for "The structure", for "What it is deliberately bad at" and
  for "What the readers found"; and a `- source:<path>` line, from the project's root, for
  `<package>/04-structure/reads`, for `states.md`, for `strings.json`, for the prototype's folder,
  for the pictures' folder, for the reads' folder, and for the package's `DECISIONS.md`: what he
  marked in a fresh gallery at Structure reaches Look through that file. A heading's slug is printed
  by `node <kit root>/scripts/state.mjs slug "<heading text>"`.
- **Stamp it,** in the words he approved it with:
  ```
  node <kit root>/scripts/state.mjs stamp <package> detail --words "<the founder's words>"
  ```

  Then append the decision to the package's `DECISIONS.md`, each dependency he settled and each
  accepted deviation with it, and ask the state what is next, as step 9 of the loop says.

## Never

- **Never write a state, a rule, a string or a page yourself,** and never mend one. A maker does:
  only a design sized `correction` is yours to apply, after his nod.
- **Never take an element out because the product cannot supply it.** It is a dependency, and his.
- **Never run a second fix round,** and never let a judge that read once read again: a re-read is a
  fresh sub-agent, handed its seat's earlier ledger to open after it has read cold.
- **Never start two makers together.** Each reads what the one before it wrote.
- **Never hand a maker a proposal that was not chosen,** or the prototype builder a real component.
- **Never give the interface writer one language to write another from.**
- **Never add a state the intent does not name, or a screen the structure does not have.**
- **Never run a fresh pass at Detail,** and never an outside engine or a screen generator: the work
  is to complete a chosen structure, not to explore.
- **Never hand an audience a page, its source or a ledger.** Pictures only.
- **Never tell a judge who made what it reads,** and never hand one judge another's ledger.
- **Never decide a colour, a size or a token here.** The prototype is plain on purpose: Look is next.
- **Never approve, and never go on without his words.** Your one recommendation rests on the reads.
- **Never stop a process by name or by pattern,** or start a browser other than through the kit's
  scripts and seats: three browser-driving commands or seats at once, at most.
- **Never ask two things at once.**
