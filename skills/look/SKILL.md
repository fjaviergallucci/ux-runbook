---
name: look
description: "Use when the interface design pipeline reaches Look: the finished appearance is designed on the project's tokens, or a visual direction is chosen where no design system exists."
---
# Look: what it looks like, finished

You have the approved detail given its finished appearance. Inside a design system, one visual
designer draws it on the project's own tokens. Where there is none, a direction is chosen first. With
a fresh pass, one screen is also drawn by makers who know nothing of the system, and shown beside the
system's. You draw no screen, choose no variant and no direction, write no measured value and borrow
nothing yourself. The conductor (`ux:design`) sent you, and its words are yours. Its loop is in
`skills/design/references/loop.md`: this page says only what is Look's own. Read
`skills/design/references/fresh-pass.md` before step 3.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`. `<kit dir>` is the
project's kit folder, the one the project profile names under `kit`. `<tokens>` is the project kit's
copy of the token file, `<kit dir>/tokens.css`: the file it was copied from is the project profile's
`tokens`, named with its commit in `PARTS.md` at Handoff.

## Question

What does it look like, finished?

## Reads

- **The detail,** `<package>/05-detail/DETAIL.md`, approved, and exactly what its carry list names:
  the states, the strings, the prototype and its pictures, the chosen proposal's file, and the
  sections of the cast sheet, the intent and the context it carries on. Of the cast sheet: its "Look"
  table, and "Fresh pass", for whether one runs at Look, and with which makers. Of the context:
  "Constraints", for the two widths.
- **What he marked in a fresh gallery at Structure,** in the round he picked from or in one he
  rejected: in the package's `DECISIONS.md`, which the carry list names. Never in
  `<package>/04-structure/earlier/`.
- **The state:** `node <kit root>/scripts/state.mjs status <package>` prints the kind, the foundation,
  the size, the version each stage stands at, and whether Look is routed full or short.
- **The project profile,** `<packages>/PROFILE.md`: `kit`, `tokens`, `components`, `facts`, `languages`,
  `engines-on`, `openai-model` and `gemini-model`, with its "Design system", and nothing about a key.
- **Of the kit:** the templates named under "Writes", the three of `templates/briefs/`, and one card,
  when the cast sheet names its seat: `pool/makers/outside-describer.md`, which speaks to you. Every
  other card is read by its seat: a brief is filled from `references/seats.md`.
- **Never** the package's `work/` folder, a letter that was not chosen, or the chat.

## Writes

Everything below is in `<package>/06-look/`, and the seats' briefs in `<package>/work/`. `<version>` is
the version a stage stands at, as `status` prints it: after a reopening it is not 1.

| File or folder | What it holds | From |
|---|---|---|
| `LOOK.md` | the stage's output, with `built-from: [detail@<version>, structure@<version>, cast@<version>, intent@<version>, context@<version>]` | `templates/package/06-look/LOOK.md` |
| `screens/` | the final screens: one page for each screen, state and language, each linking `<tokens>` | the visual designer |
| `variants/` | where the system leaves a real choice: one screen, on one named axis, with its own `checks.json` and `results.json` | the visual designer; the acceptance script |
| `checks.json`, `results.json` | what is measured, as checks, and what the script measured | the visual designer; the acceptance script |
| `measures.md` | the table of measured values, and the named extensions | "Measured values" and "Named extensions" of the template |
| `measure/` | the visual designer's own measuring script, and what it read: closed to every reader | the visual designer |
| `shots/` | the reference pictures: every page, at each width and theme | the picture script |
| `reads/` | one ledger for each reader, and each re-read | `templates/outputs/LEDGER.md` |
| `directions/`, `tokens.css`, `earlier/` | in Direction mode: each direction, on the same detailed screen; the token file of a surface that leaves the system; screens set aside | `references/direction.md` |
| `BRIEF-fresh.md`, `fresh/`, `beside/`, `BESIDE.sealed.json`, `beside.json`, `beside.html`, `borrow.json`, `borrow.html` | with a fresh pass: its brief; each fresh screen as it came; the versions' pictures under letters, and beside that folder the sealed file that says which is which; the two pages put to him | `templates/package/04-structure/BRIEF-fresh.md`, `references/fresh.md` |
| `decision.json`, `decision.html` | the decision page, and its data | `templates/outputs/decision.json`, `templates/outputs/decision-approve.json` |

## Steps

1. **Begin.** Check the state as step 1 of the loop says. A stage that is awaiting the founder is not
   begun again: take his answer to "Gate", or to the reference that asked. Otherwise mark it in work:
   ```
   node <kit root>/scripts/state.mjs begin <package> look
   ```
2. **Read the detail, and what its carry list names. Then name the mode.** Copy the template to
   `<package>/06-look/LOOK.md` and write `built-from`, unless the file is already there: then go on
   from what it holds, at the first step whose file is missing. Under "Mode", one of two:
   - **Direction,** when `status` gives the foundation as `no-system` or the size as `system`, when
     `tokens` of the project profile is empty, or when the founder has said this surface leaves the
     design system. Two or three directions are drawn, he picks one, and his pick becomes the
     tokens: `references/direction.md`. Then go on from step 3, on those tokens.
   - **Inside the design system,** otherwise. The palette, the typefaces and the shapes of the parts
     are the system's: one visual designer, and variants only on one named axis.
3. **With a fresh pass, write its brief and stop.** "Fresh pass" of the cast sheet says whether one
   runs at Look. Write `<package>/06-look/BRIEF-fresh.md` in its Look form: the one screen that
   carries the idea, its state, and its approved items in order, their words exactly as approved.
   He reads it whole. **Nothing is sent before his yes,** to a sub-agent or off the machine: until
   `LOOK.md` holds it, written, you are at this stop, on any day. `references/fresh.md` has the rest.
4. **Start the visual designer.** One `maker.visual-designer`, a fresh sub-agent, started as
   "Starting a seat" in the loop says, on the model and the effort its line of the approved cast
   sheet names: a dash means the session's model, and you enforce none. Its brief is written from
   `templates/briefs/maker.md`, and hands it what `references/seats.md` gives its seat. It writes:
   - `screens/`: static pages that link `<tokens>`, the project's token file in the project kit
     folder, by its path, and paste no value of it. Every string and every id is the detail's.
   - `variants/`, only where the system leaves a real choice, and then on one named axis, as how
     dense the list of rooms is: one screen, the same content, two or three times, each with what it
     buys and what it costs. Its reply names the axis, and the variant the screens are drawn in.
   - `checks.json`, one check for each contrast and each size its table states, in the shape
     `scripts/accept.mjs` takes, and `measures.md`, the table and the named extensions.
5. **Photograph and measure, one command after the other,** never both at once:
   ```
   node <kit root>/scripts/shots.mjs <package>/06-look/screens --out <package>/06-look/shots --widths <primary>,<phone> --themes <themes>
   node <kit root>/scripts/accept.mjs prototype <package>/06-look/checks.json --root <package>/06-look/screens --out <package>/06-look/results.json
   ```
   The widths are those of "Constraints"; `<themes>` is `light`, or `light,dark` when `<tokens>` defines
   a dark theme. With variants, both are run on `variants/` too: `references/seats.md`. **Before the
   first run, add to `checks.json` an `in-viewport` check for each success criterion that says "without
   scrolling":** the criterion in its words, its element by its `data-ux`, the width it names. From
   Detail on that check answers it, and no picture does. **The table of `measures.md` is written from
   what these two scripts return, never by eye,** and this run is what you hold it to. Each contrast and
   each size is the `actual` of a result in `results.json`, at its width and theme; any other value was
   read in the browser by a script of the visual designer's own, kept with its readings in `measure/`. A
   row with neither behind it, a value that differs, a line `error:` or `overflow:`, or a check that
   failed goes back to a fresh visual designer, once for each run of this step, before the readers
   start, as facts: each row by its result id and its measured value. You write no value, and correct
   none. Both commands are run again after every change to the screens.
6. **With a fresh pass, show the versions side by side, blind, and stop twice.** The system's
   picture of the one screen and each fresh one are copied under letters dealt at random into
   `beside/`, read by letter, and put to him: what would he keep? Then, with what each thing would
   cost the system on the page: which of the three outcomes? What he borrows is rebuilt on the tokens
   by the visual designer and flagged in `LOOK.md` as a named extension of the system:
   `references/fresh.md`. Then step 5 again.
7. **Start the readers.** The judges of the cast sheet's "Look" table, each a fresh sub-agent on what
   its line names, in one message, and those that drive a browser three at a time at most. Each is
   handed what `references/seats.md` gives its seat, the accepted deviations with it, and its "Do
   not open" list. Each writes one ledger in `reads/`: make that folder first.
8. **One fix round, and one re-read.** The findings marked `blocks` go to a fresh visual designer,
   handed the ledgers that hold them. Then step 5 again. Then, for each judge whose blocking finding
   went to the fix round, a fresh sub-agent in the same seat reads again: its brief names that
   seat's earlier ledger, to be opened only after it has read cold, and it marks each earlier
   finding *fixed*, *partly* or *still present*, in `<package>/06-look/reads/<seat>-reread.md`.
   **There is no second round** of fixes; the send-back of step 5 is not one. A finding on a string,
   a state or a rule is not Look's to fix: it goes to the founder, open.
9. **Build the decision page.** Fill `LOOK.md` as its template says: "Measured values" and "Named
   extensions" are copied from `measures.md`, each section whole, and copied again after any later
   redraw, before the stamp; "What the look decides" is copied from the visual designer's reply,
   never written by you. Then write `decision.json`. With variants, in the shape of
   `templates/outputs/decision.json`: each variant an option, by letter, its line what it buys and
   what it costs. With one proposal, in the shape of `templates/outputs/decision-approve.json`: the
   final screens as its one option. Either way: the pictures of each screen's default state, named
   from the page, the phone width first, as `shots/today-default-en-390-light.png`; one line for
   each seat; each open finding under `findings`, by seat, with what the visual designer could not
   draw; one recommendation, resting on the reads; one question. Its identity is as `status` prints
   it, at stage 7 of 9.
   ```
   node <kit root>/scripts/page.mjs <package>/06-look/decision.json --out <package>/06-look/decision.html
   ```
**Routed `short`** (an adjustment), Look is what changes, and no more. **Sized `flow`,** it goes
surface by surface, steps 4, 5, 7 and 8 once for each, and is picked or approved and stamped once.
`references/forms.md` has both.

## Gate

**He picks, or approves, from pictures.** Put `<package>/06-look/decision.html` in front of him, and
`<package>/06-look/measures.md` with it: the finished screens beside their measures. Record the one
question, so that a session resuming tomorrow asks the same:
```
node <kit root>/scripts/state.mjs await <package> look --question "<the one question>"
```
One question, about one thing. With variants: which variant goes on to Handoff? With one proposal: do
you approve these screens for Handoff? **Stop: you neither pick nor approve, and you go no further
without his words.**

- **A variant he picks that the screens are not drawn in** is drawn by a fresh visual designer,
  handed his pick. Step 5 is run again, and he sees the pictures and the table before the stamp.
- **A fresh pass he asks for here** is run before he is asked again: write his asking under
  `## Reviewed by the founder`, put the stage back in work with the `begin` of step 1, go to step 3.
- **Write what he says under `## Reviewed by the founder`:** what he picked or corrected, and the
  words he approved it with, as he said them. A correction goes to a fresh visual designer, handed
  his words, and step 5 is run again. You redraw nothing yourself.
- **Write the carry list,** `## Carry`: the lines of the detail's own carry list, as they are, the
  cast sheet's tables among them, but any that names a file of a `fresh/` folder; a
  `- detail@<version>#<slug>` line for "Rules", "Edge cases", "Data map", "Dependencies", "Strings",
  "What the readers found" and "Accepted deviations"; and a `- source:<path>` line for the screens'
  folder, the pictures' folder, the reads' folder, `measures.md`, `checks.json`, `results.json` and
  `<tokens>`. **No line names `<package>/06-look/fresh/`, or anything else a fresh maker made: none
  of it is handed off.**
- **Stamp it,** in the words he picked or approved with:
  ```
  node <kit root>/scripts/state.mjs stamp <package> look --words "<the founder's words>"
  ```
  Then append the decision to the package's `DECISIONS.md`, each named extension and each accepted
  deviation with it, and ask the state what is next, as step 9 of the loop says.

## Never

- **Never draw, redraw or restyle a screen yourself,** and never write or correct a measured value.
- **Never choose a variant or a direction.** Your one recommendation rests on the reads.
- **Never ask for variants where the system leaves no real choice,** or on more than one named axis.
- **Never let a palette, a typeface or a raw value into a screen inside a design system.**
- **Never send the fresh brief before he has read it,** to a sub-agent or off the machine. A
  provider that `engines-on` does not list gets nothing: you turn no engine on.
- **Never pass the outside script anything about a key,** or any flag but the six of
  `references/fresh.md`. Never open, list or name a file of keys, and never print the environment.
- **Never give a fresh maker the design system, the kit, today's screens or the prototype.** The
  screen, its state and its words are approved: it chooses only the paint.
- **Never hand off a fresh screen, mend one, or copy its code or its values.**
- **Never change the project profile silently.** He sees and approves each line first.
- **Never change a string, a state, a rule or an id,** and never run a second fix round.
- **Never read his gallery marks in `<package>/04-structure/earlier/`.** They are in `DECISIONS.md`.
- **Never stop a process by name or by pattern,** or start a browser other than through the kit's
  scripts and seats: three browser-driving commands or seats at once, at most.
- **Never ask two things at once.**
