---
name: structure
description: "Use when the interface design pipeline reaches Structure: several ways of solving the problem are proposed blind, drawn in one shared kit and put in front of the founder to pick."
---
# Structure: which way of solving it

You have several ways of solving the problem proposed blind, drawn in one shared kit, read by letter
and put in front of the founder, who picks. You propose none, mend none, drop none and choose none:
the stage is its blinds and its two stops. The conductor (`ux:design`) sent you, and its words are
yours. Its loop is in `skills/design/references/loop.md`: this page says only what is Structure's own.
Read `skills/design/references/blind.md` and `skills/design/references/fresh-pass.md` before step 3.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`. `<kit dir>` is the
project's kit folder, the one the project profile names under `kit`.

## Question

Which way of solving it?

## Reads

- **The cast sheet,** `<package>/03-cast.md`, approved, and exactly what its carry list names. Of the
  sheet itself: its "Structure" table, a line for each seat with what it is loaded with, its checks,
  its engine and its suggested model and effort; "Blind rules", for a continuity maker; and "Fresh
  pass", for whether one runs at Structure, and with which makers.
- **The project profile,** `<packages>/PROFILE.md`: `kit`, `facts`, `engines-on`, `openai-model` and
  `gemini-model`, and nothing about a key.
- **Of the kit:** the templates named under "Writes", the three of `templates/briefs/`, and one card:
  `pool/makers/outside-describer.md`, which speaks to you. Every other card is read by its seat.
- **Never** today's screen, the package's `work/` folder, `<package>/04-structure/earlier/`, or the chat.

## Writes

Everything below is in `<package>/04-structure/`, and the seats' briefs in `<package>/work/`. The output
is built from the cast, the intent and the context, each at the version it was approved at.

| File or folder | What it holds | From |
|---|---|---|
| `BRIEF.md`, `BRIEF-fresh.md` | the brief, as he approved it; with a fresh pass, its brief | `templates/package/04-structure/BRIEF.md`, `templates/package/04-structure/BRIEF-fresh.md` |
| `proposals/`, `fresh/` | one file for each proposal; with a fresh pass, each screen as it came | the makers |
| `board/` | the letters' files, the drawn pages, the pictures | the scripts of step 7 |
| `MAP.sealed.json`, `PICK.md` | beside the board: who made which letter, sealed; his pick, in his words | the merge; `templates/outputs/PICK.md` |
| `reads/` | one ledger or one task read for each reader | `templates/outputs/LEDGER.md`, `templates/outputs/TASK-READ.md` |
| `decision.json`, `decision.html` | the decision page, and its data | `templates/outputs/decision.json` |
| `chosen/`, `earlier/` | a pick redrawn after a graft; what was set aside | `references/rounds.md` |
| `CHOSEN.md` | the stage's output, with `built-from: [cast@1, intent@1, context@1]` | `templates/package/04-structure/CHOSEN.md` |

## Steps

1. **Begin.** Check the state as step 1 of the loop says. A stage that is awaiting the founder is not
   begun again: go to "Gate", with his answer. Otherwise mark it in work:

   ```
   node <kit root>/scripts/state.mjs begin <package> structure
   ```

   One awaiting stage is begun again: one whose `<package>/04-structure/` holds nothing but `earlier/`,
   a round he rejected (`references/rounds.md`). A stage already in work goes on from the first step
   whose files are missing: step 4, until `CHOSEN.md` holds his yes. A board is never merged twice.
2. **Read the cast sheet, and what its carry list names.** Copy the template to
   `<package>/04-structure/CHOSEN.md` and write `built-from`, unless the file is already there: then go
   on from what it holds.
3. **Write the brief,** from the intent, at `<package>/04-structure/BRIEF.md`: context, and nothing of
   a design. Read it sentence by sentence, as "Context, never the design" in
   `skills/design/references/blind.md` says, and cut whatever a describer could draw a screen from.
   "How to work" and "What to return" stay as the template has them: the brief carries the format.
   With a fresh pass, or a `maker.screen-generator` cast, write `<package>/04-structure/BRIEF-fresh.md`
   too, in its Structure form.
4. **Stop: the founder reads the brief.** Put it in front of him whole, and the fresh brief with it.
   Say in the same message which seats would send it off this machine, each with its provider: every
   `maker.outside-describer` line, `model:openai` or `model:gemini`, and a `maker.screen-generator` on
   `tool:stitch`. One question, about one thing: may this brief go out as it is? **Nothing is sent
   before his yes: not to a sub-agent, and not off the machine.** Write what he changes into the
   brief, then his yes under `## Reviewed by the founder` of `CHOSEN.md`, as he said it, with the
   seats that send it out. A seat he holds back does not run.
5. **Start the makers, in one message.** Each is a fresh sub-agent, started as "Starting a seat" in the
   loop says, on the model and the effort its line of the approved cast sheet names: a dash means the
   session's model, and you enforce none. Its brief is written from `templates/briefs/maker.md`, and
   hands it what `references/seats.md` gives its seat, and no more. Each `maker.structure-describer`
   has the lens its line names, a different one each, and writes one proposal,
   `<package>/04-structure/proposals/<name>.json`. With a fresh pass, its makers answer the fresh
   brief, and a `maker.transcriber` writes each fresh concept into the format. An outside describer is
   no sub-agent: you run it, once for each of its lines, with these five flags and nothing else, since
   the script finds its key itself:

   ```
   node <kit root>/scripts/describe.mjs --provider <openai|gemini> --model <id> --brief <package>/04-structure/BRIEF.md --out <package>/04-structure/proposals/<name>.json --profile <packages>/PROFILE.md
   ```

   A valid answer is a proposal like any other. One that is not in the format leaves
   `<name>.json.raw.txt` where the proposal would be, for a `maker.transcriber`. A refusal is reported
   to the founder as the script words it, and you go on with the seats you have.
6. **Tag each proposal, and mend none.** Add two keys to each file, and touch nothing else: `track`,
   `system` or, for a fresh concept, `fresh`; and `engine`, as its seat's line of the cast sheet has it.
   Each maker checks its file with the command its card gives, and the merge holds every file to
   `validate` again: while one fails it writes nothing, and prints the file and the fault. That
   proposal goes back to its maker once, a fresh sub-agent in the same seat. One that fails again is
   moved to `<package>/04-structure/proposals/left-out/`, and the decision page says so. You repair
   none: that would make you a maker.
7. **Merge, draw, photograph, one command after another.** Once every proposal is in:

   ```
   node <kit root>/scripts/merge.mjs <package>/04-structure/proposals --out <package>/04-structure/board
   node <kit root>/scripts/render.mjs <package>/04-structure/board/<letter>.json --kit <kit dir> --out <package>/04-structure/board/<letter>.html --letter <letter>
   node <kit root>/scripts/shots.mjs <package>/04-structure/board --out <package>/04-structure/board --widths <primary>,<phone>
   ```

   The merge prints the letters, and writes the map to `<package>/04-structure/MAP.sealed.json`: beside
   the board, never in it. Run the render once for each letter, then the shots once, at the two widths
   of the brief. The board holds the letters' files, the drawn pages with the kit's stylesheets, and
   the pictures: nothing else is ever put in it. From here on an option is its letter, to you as to
   everyone. Never more than three browser-driving commands or seats at once.
8. **Start the readers, by letter.** The judges and the audiences of the cast sheet's "Structure"
   table, each a fresh sub-agent: the judges in one message, then the audiences. Of
   `<package>/04-structure/`, a judge is handed the board folder and nothing else; an audience is handed
   the pictures only, each by its path. What else each is handed, from the approved stages, is in
   `references/seats.md`. Every reader's brief lists under "Do not open": `<package>/work/`, where the
   makers' briefs are, `<package>/04-structure/MAP.sealed.json`, `<package>/04-structure/PICK.md` and
   `<package>/04-structure/proposals/`; then `<package>/04-structure/fresh/`, the two briefs and every
   other reader's file. Each writes one file in `<package>/04-structure/reads/`.
9. **Build the decision page.** Write `<package>/04-structure/decision.json` in the shape of
   `templates/outputs/decision.json`: the options by letter, one line for each seat that read them, one
   recommendation, one question. Its identity is the design's name, kind and size, as
   `node <kit root>/scripts/state.mjs status <package>` prints them. Every letter of the board is an
   option: the `name` in its file is the title, its `bet` the line, and its pictures are named from the
   page, the phone width first, as `board/A-390-light.png`. A proposal left out, and a seat that did
   not answer or was held back, is one line under `findings`, by seat, never by letter. With a fresh
   pass, its `gallery` sits beneath the options, labelled as fresh and never mixed into them: each
   screen as it came, by its picture in `fresh/`, never saying which letter holds its structure.

   ```
   node <kit root>/scripts/page.mjs <package>/04-structure/decision.json --out <package>/04-structure/decision.html
   ```

## Gate

**He picks, from pictures.** Put `<package>/04-structure/decision.html` in front of him. Record the one
question, so that a session resuming tomorrow asks the same:

```
node <kit root>/scripts/state.mjs await <package> structure --question "<the one question>"
```

One question, about one thing: which structure goes on to Detail? **Stop: you do not pick, and you go
no further without his words.**

- **Write `<package>/04-structure/PICK.md`,** from `templates/outputs/PICK.md`: the line
  `Pick: <letter | none>`, on a line of its own, and the founder's words under it, as he said them. A
  graft is written exactly, as "B, with A's status treatment", and the line still names one letter. "A
  bit of each" is not a pick: say so, and ask him for one letter.
- **A pick with a graft is redrawn once and read again once,** in `<package>/04-structure/chosen/`,
  never in the board. **`Pick: none` reopens Intent or Context:** no further proposals are asked for
  against the same brief, and the round moves whole. Both are in `references/rounds.md`.
- **Only now may the map be opened,** after a graft's re-read, and only this way. The command prints
  each letter with its source file, its track and its engine, and refuses until `PICK.md` holds his pick:

  ```
  node <kit root>/scripts/merge.mjs open <package>/04-structure/board
  ```
- **Fill `CHOSEN.md`,** heading by heading. "The pick", "The structure" and "What it is deliberately
  bad at": from `PICK.md` and the picked letter's file. "What the readers found": one line for each
  seat, then each finding on the picked letter that is still open. "Marked in the fresh gallery": his
  marks, each with its picture. "Not chosen": each other letter, with who made it, from the map.
  Under `## Reviewed by the founder`, after his yes to the brief: what he asked to be changed on the
  way to Detail, as he said it, or "Nothing".
- **Write the carry list,** `## Carry`: the lines of the cast sheet's own carry list, as they are; a
  `- cast@1#<slug>` line for the table of each stage still to run, for "Blind rules" and for "Fresh
  pass"; and a `- source:<path>` line, from the project's root, for the chosen proposal's file, for
  each of its pictures and for `PICK.md`. A heading's slug is printed by
  `node <kit root>/scripts/state.mjs slug "<heading text>"`.
- **Stamp it,** in the words he picked with:

  ```
  node <kit root>/scripts/state.mjs stamp <package> structure --words "<the founder's words>"
  ```

  Then append the decision to the package's `DECISIONS.md`, and ask the state what is next, as step 9
  of the loop says.

## Never

- **Never send the brief before he has read it,** to a sub-agent or off the machine, and never send
  anything else off it. A provider that `engines-on` does not list gets nothing: you turn no engine on.
- **Never pass the outside script anything about a key,** or any flag but the five of step 5. Never
  open, list or name a file of keys, and never print the environment.
- **Never mend, complete or improve a proposal.** Not a label, not a missing key.
- **Never shortlist, rank or drop.** Every valid proposal reaches the board, and every letter him.
- **Never pick, and never go on without his words.** You recommend one letter, in one sentence.
- **Never say who made a letter,** in a brief, on the decision page or in the chat, and never work it
  out by setting a letter beside a proposal. "Not chosen", after the pick, is the one place.
- **Never open, print, search or copy the map before `PICK.md` holds his pick,** with any tool.
- **Never hand a reader the folder above the board,** or any file that says who made what.
- **Never put a decision page, a fresh screen or a graft in the board.**
- **Never delete a board or a round, and never merge a sealed board again.** What is set aside is moved.
- **Never put a design in a brief.** Not "a list of rooms, a Book button on each row": a fact about her.
- **Never stop a process by name or by pattern,** and never start a browser yourself.
- **Never ask two things at once.**
