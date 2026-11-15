# After the pick: a graft, a round he rejected, a board made again, a fresh pass he asks for

Four things can follow a board besides a plain pick. In each, what is set aside is moved and never
deleted, into `<package>/04-structure/earlier/<n>/`: `1` the first time, `2` the next. Nothing in
`earlier/` is ever an input to a stage or a seat: not its brief, not a proposal, not a read. The
conductor says the same, in `skills/design/references/blind.md`.

## A pick with a graft

He picked one letter and named what to take from another, as "B, with A's status treatment".
`<package>/04-structure/PICK.md` holds his words exactly, and its line names the one letter.

1. **It is redrawn once, by a maker, never by you.** Start one fresh `maker.structure-describer`, as
   step 5 of the skill says. The blind between makers ended with the pick, so this one is handed the
   picked letter's file and the file of each letter he named, from the board, by letter, and his
   words, exactly. It is not told who made them. It writes the picked structure with what he named
   grafted in, and nothing else of its own, in the form the letters' files have, to
   `<package>/04-structure/chosen/chosen.json`. Never to the board: a graft or a redrawn pick saved
   there as a one-letter `.json` would no longer match the map, and the map would not open.
2. **Draw it and photograph it,** one command after the other, under the picked letter, as step 7 of the
   skill does for the board: drawn twice, the second time without the proposal's own account, for the
   audiences, and each page pictured whole and as its first screen alone.

   ```
   node <kit root>/scripts/render.mjs <package>/04-structure/chosen/chosen.json --kit <kit dir> --out <package>/04-structure/chosen/chosen.html --letter <letter>
   node <kit root>/scripts/render.mjs <package>/04-structure/chosen/chosen.json --kit <kit dir> --out <package>/04-structure/chosen/chosen-screens.html --letter <letter> --without-notes
   node <kit root>/scripts/shots.mjs <package>/04-structure/chosen --out <package>/04-structure/chosen --widths <primary>,<phone> --first-screen
   ```

   The render refuses a file that is not a valid proposal, and prints the fault: the file goes back
   to that maker once. You do not mend it.
3. **It is read again once.** Each seat that read the board reads the redrawn pick, as a fresh
   sub-agent. A judge is handed `<package>/04-structure/chosen/` in place of the board folder, and its
   seat's earlier ledger to open only after it has read cold, as step 6 of the loop says. An audience is
   handed the new pictures drawn without the proposal's own account, whole and first screen, and no
   other: those of `chosen-screens.html`, as `chosen-screens-390-light.png` and
   `chosen-screens-390-light-first.png`. A picture of `chosen.html`, which carries the bet, the cost and
   the notes, is never an audience's. Each writes a file of its own, beside its seat's first read and
   never over it: that file's name with `-reread` before `.md`, as
   `<package>/04-structure/reads/<seat>-reread.md`. What they do not open is what the board's readers
   did not (`references/seats.md`), and with it `<package>/04-structure/decision.html` and
   `<package>/04-structure/decision.json`, which by now sum up what the other seats said. The map is
   still sealed while they read.
4. **Once means once.** What the re-read finds is written under "What the readers found" in
   `CHOSEN.md`, open, for Detail to close, and he hears it before the stamp. Nothing is redrawn a
   second time. If he then wants another letter, that is a new pick: `PICK.md` is written again, in
   his words.
5. **Then the map is opened,** and `CHOSEN.md` is filled as "Gate" says. "The structure" names
   `<package>/04-structure/chosen/chosen.json` and its pictures, and the carry list carries those.

## A round he rejected

He picked none. Then the input is wrong, not the proposals: no further proposals are asked for
against the same brief. Intent or Context is reopened, and the round moves whole.

1. **Write `<package>/04-structure/PICK.md`:** the line `Pick: none`, and under it what he said was
   wrong with all of them, as he said it, and which stage is reopened. Intent, when what was wrong
   is who she is, the job, the tasks or the criteria. Context, when it is a fact about the product
   or about its people. Recommend one, in one sentence. He says which.
2. **Write the rejection into the package's `DECISIONS.md`,** as a new entry, in his words. What he
   marked in a fresh gallery is his words too, and survives the round: write each mark there with
   the rejection, as he said it, and say what on the screen it was about, so that it stands without
   its picture. Look's fresh pass reads his marks from `DECISIONS.md`, never from `earlier/`.
3. **Reopen the stage,** with his yes. `<stage>` is `intent` or `context`:

   ```
   node <kit root>/scripts/state.mjs reopen <package> <stage> --reason "<why>"
   ```

   The reopening takes Structure out of awaiting and closes the pick's question: it was asked of a
   board that no longer stands. Structure is in work again, and nothing is left to put to him.
4. **Move the round whole.** Everything in `<package>/04-structure/` other than `earlier/` goes
   together into `<package>/04-structure/earlier/<n>/`: the briefs, the proposals folder, the board,
   the map, the pick, the pictures, the reads, the decision page and its data, `fresh/`, `chosen/`
   and `CHOSEN.md`. So no proposal of this round can reach the next board.
5. **Go to the stage the state names, and leave Structure alone until it names Structure.**
   `node <kit root>/scripts/state.mjs next <package>` prints the reopened stage, and
   `node <kit root>/scripts/state.mjs validate <package>` has nothing to say of Structure, which is
   in work and owes no output yet. The script refuses to begin it while Intent or Context is not
   approved again: a brief written before then is written from what he rejected.
6. **When `next` prints `structure`,** the reopened stage approved anew and each stale stage after
   it stamped again, Structure starts clean, from step 1 of the skill:

   ```
   node <kit root>/scripts/state.mjs begin <package> structure
   ```

   Copy a fresh `CHOSEN.md` and the brief templates from `templates/package/04-structure/`, with
   `built-from` at the versions the cast, the intent and the context now stand at. Write a new brief
   from the new intent: he reads it before anything is sent, as he read the first.

## A board made again within a round

A proposal arrived late, or one was withdrawn, after the merge and before the pick. The next merge
deals the letters anew, so whatever speaks of the old letters goes with them.

1. **Tell the founder first,** and move nothing without his yes. If the decision page was already in
   front of him, put the stage back in work with the `begin` of step 1 of the skill: that closes its
   question, which is asked again on the new board.
2. **Move together** into `<package>/04-structure/earlier/<n>/`: the board, the map, the pick if one
   was begun, the reads, and the decision page with its data. The briefs, the proposals folder and
   `fresh/` stay: it is the same round, and the same brief.
3. **Go on from step 6 of the skill:** tag, merge, draw, photograph, then readers who have read no
   earlier board. The merge refuses while a map or a pick lies beside the board folder, and its refusal
   says to move them into `earlier/<n>/` first.

## A fresh pass he asks for at the decision page

The cast sheet says whether a fresh pass runs at Structure, and he may still ask for one at the
decision page, before he picks (`skills/design/references/fresh-pass.md`). You never add one
yourself. When he asks, the board he is looking at is not the one he will pick from.

1. **Record his asking.** Write what he said, as he said it, under `## Reviewed by the founder` of
   `CHOSEN.md`, with the makers it will run with: a `maker.screen-generator`, and an outside
   describer only where `engines-on` of the project profile lists its provider. No engine is turned
   on for it. A seat the cast sheet has no line for runs on the model and the effort its card
   suggests, unless he says otherwise. Then put the stage back in work, with the `begin` of step 1
   of the skill: the pick's question is closed, and is asked again on the new board.
2. **Write the fresh brief, and stop,** as steps 3 and 4 of the skill say, for
   `<package>/04-structure/BRIEF-fresh.md`: he reads it whole, hears which seats would send it off
   this machine, and nothing is sent before his yes is written beside his asking.
3. **The fresh makers run, and their concepts are transcribed and tagged,** as steps 5 and 6 say:
   each screen as it came in `<package>/04-structure/fresh/`, one `maker.transcriber` for each
   concept, its proposal tagged `fresh`.
4. **The board is made again within the round,** as the section above says. His asking is his yes
   to it: the board, the map, the pick if one was begun, the reads and the decision page with its
   data move together into `<package>/04-structure/earlier/<n>/`. Then steps 7 to 9 of the skill:
   every proposal merged anew, readers who have read no earlier board, and the gallery beneath the
   options.
5. **Only then is he asked to pick,** at the gate, on the new board.
