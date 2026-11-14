# Blind: who does not see what, and in which order

At Structure the founder chooses a way of solving the problem before anything looks finished. He chooses
well only if the options differ in structure and in nothing else, and if nobody can push one of them: not
a maker, not a judge, not you. So the work is kept cheap, and blind.

## The rules

1. **Structures are described, not drawn.** Several describers each write one proposal as a walkthrough:
   screen by screen, what she sees and what she can do.
2. **One script draws them all, in one shared kit:** the project's kit folder, the one the project
   profile names. Setup writes it in every project, and where the project has no design system it holds
   the grey kit (`kit/grey/`) unchanged. Every proposal wears the same parts (`kit/KIT-CONTRACT.md`),
   so he compares structures, and is still looking at pictures.
3. **The brief gives context, never the design, and the founder reads it first.**
4. **Describers do not see each other,** nor your own idea, nor today's screen. The one exception is a
   continuity maker the cast names, who sees the current layout.
5. **Letters by shuffle.** The merge gives each proposal a letter. The map of who made which stays
   sealed until he has picked.
6. **Judges and audiences read by letter.** A judge is handed the board folder and nothing above it; an
   audience is handed the pictures only.
7. **Nothing is shortlisted before he picks, and nothing is detailed.** Every valid proposal reaches the
   board. You drop none, mend none and rank none ahead of him.

**Where it does not apply:** the look inside a binding design system, where there is little latitude
(one maker, variants on one named axis), unless a fresh pass is cast (`references/fresh-pass.md`); and
corrections.

## Context, never the design

A brief that prescribes the design returns your own idea, in as many voices as there are makers. So the
brief every describer gets, written from `templates/package/04-structure/BRIEF.md`, gives context, never
the design: the person and her moment, the job, the tasks as where she starts and what she wants, the
hardest state, what the product can show and do, the language and the device.

A brief may not contain:

- **Component names.** A table, a card, a tab, a sidebar, a modal, a wizard.
- **Layout words.** On the left, at the top, two columns, above the fold, side by side.
- **Named visual styles.** Minimal, playful, glassy, brutalist, "like" any product or site.
- **Colours and fonts.** None, by name or by value.
- **The session's own idea.** Whatever you think the answer is: as a hint, as an example, as a "for
  instance".

Before he reads it, read it yourself, sentence by sentence: could a describer draw a screen from this
sentence alone? Then it is design. Cut it, or turn it into a fact about her or about the product.

- Design: "A list of rooms with a Book button on each row."
- Context: "A patient is standing at the desk, and she needs a room that is free now. The product knows
  each room's status, when its booking ends and when the next one starts."

The words of the walkthrough format (a list, an action, a region) are the format's, not a design: the
part of the brief that gives the format stays as the template has it. The same rule holds for the brief
of any maker, at any stage, and for a fresh brief.

## The order

Each step waits for the one before it. `<board dir>` is the board folder, `04-structure/board/` in the
package; `<proposals dir>` is the folder the makers write into, `04-structure/proposals/`.

1. **The brief.** Written from the approved intent, in the package as `04-structure/BRIEF.md`.
2. **The founder reads it.** Nothing goes out before his yes: not to a sub-agent, and not off the
   machine.
3. **The makers.** Started in one message, each a fresh sub-agent, each writing one proposal into the
   proposals folder. An outside model is one more describer, when the project profile turns one on and
   the cast names it:

   ```
   node <kit root>/scripts/describe.mjs --provider <openai|gemini> --model <id> --brief <file> --out <file.json> --profile <PROFILE.md>
   ```

   The script sends the brief whole, and finds its key itself: give it the project profile, and nothing
   about a key.
4. **The merge.** Once every proposal is in, and is valid:

   ```
   node <kit root>/scripts/merge.mjs <proposals dir> --out <board dir>
   ```

   The script shuffles the proposals into letters and writes each as `A.json`, `B.json` and so on, with
   nothing left in it that says who made it. It writes the map to `04-structure/MAP.sealed.json`:
   beside the board folder, never inside it, and never printed. If one proposal is not valid, it
   writes nothing.
5. **The render.** Each letter is drawn in the same kit, under its own letter:

   ```
   node <kit root>/scripts/render.mjs <board dir>/A.json --kit <kit dir> --out <board dir>/A.html --letter A
   ```

   `<kit dir>` is always the project's kit folder, the one the project profile names.
6. **The shots.** Every drawn page is photographed, at the primary width and at the phone width:

   ```
   node <kit root>/scripts/shots.mjs <board dir> --out <board dir> --widths <w,w...>
   ```
7. **The readers.** The judges and the audiences the cast names, each a fresh sub-agent. They read by
   letter. A judge is handed the board folder and nothing above it: its letters, pages and pictures. An
   audience is handed the pictures only, each by its path. Their briefs list four things under "Do not
   open": the package's `work/` folder, where the makers' briefs are, the map, the pick and the
   proposals folder.
8. **The decision page.** The options by letter, one line for each seat that read them, one
   recommendation, one question:

   ```
   node <kit root>/scripts/page.mjs <decision.json> --out <decision.html>
   ```
9. **The pick.** The founder picks, on the board.
10. **`PICK.md`.** Write `04-structure/PICK.md` in the shape of `templates/outputs/PICK.md`: the line
    `Pick: <letter | none>`, on a line of its own, and under it what he said, as he said it.
11. **The map may be opened.** Now, and not before:

    ```
    node <kit root>/scripts/merge.mjs open <board dir>
    ```

## What stays sealed, and what stays out of the board

- **The map** is `04-structure/MAP.sealed.json`. Until `04-structure/PICK.md` holds his pick, do not open
  it, print it, search it or copy it, with any tool. The command of step 11 is the only way in, and it
  refuses until the pick is written.
- **You are not blind, so act as if you were.** You started the makers. Do not work out whose a letter is
  by setting it beside a proposal, and never say who made a letter: not in a brief, not on the decision
  page, not in the chat. Your recommendation rests on the reads, by letter.
- **The board holds four things:** the letters' files, the drawn pages, the kit's stylesheets that the
  render copies beside them, and the pictures. A judge is handed the whole folder, so whatever lies in
  it is read.
- **Three things never go in the board:** the decision page and its `decision.json`; anything of a fresh
  pass as it came, its screens and its gallery; anything from `work/`. A fresh concept reaches the board
  only as its structure written into the walkthrough format, through the merge, like any other letter.
  And a graft or a variant is never saved there as a one-letter `.json`: the map would no longer match
  the board, and would not open. A pick that is redrawn goes in `04-structure/chosen/`.
- **One folder, one board, and a board is never deleted.** A sealed board is never merged again, and the
  merge refuses while a map or a pick lies beside the board folder. What is set aside is moved, into
  `04-structure/earlier/<n>/`: `1` the first time, `2` the next. The pick is the record of his words,
  and the board is what he saw. Where the script's refusal says to delete, move. Nothing in `earlier/`
  is ever an input.
  - **A round he rejected moves whole.** When he picks none and Intent or Context is reopened,
    everything in `04-structure/` other than `earlier/` is moved together, before the new round starts:
    the briefs, the proposals folder, the board, the map, the pick, the pictures, the reads, the
    decision page. The new round starts in a clean `04-structure/`.
  - **A board made again within a round** (a proposal arrived late) moves with its map and its pick,
    and with what was written about its letters, the reads and the decision page: the next merge deals
    the letters anew. Tell the founder first, and move them with his yes.
- **A pick is one letter, or none.** "A bit of each" is not a pick. A graft is written in his words,
  exactly ("B, with A's status treatment"), and the line still names one letter. With `none`, no more
  proposals are asked for against the same brief: Intent or Context is reopened, and the round moves
  whole.

## At the other stages

The blindness does not end at Structure. At every stage a judge is never told who made what it reads,
and never opens a maker's notes or another judge's ledger. An audience never opens the intent, nor
anything in the package but the pictures it is handed. And no maker judges.
