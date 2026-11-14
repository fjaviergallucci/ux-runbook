# After the pick: a graft, a round he rejected, a board made again

Three things can follow a board besides a plain pick. In each, what is set aside is moved and never
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
2. **Draw it and photograph it,** one command after the other, under the picked letter:

   ```
   node <kit root>/scripts/render.mjs <package>/04-structure/chosen/chosen.json --kit <kit dir> --out <package>/04-structure/chosen/chosen.html --letter <letter>
   node <kit root>/scripts/shots.mjs <package>/04-structure/chosen --out <package>/04-structure/chosen --widths <primary>,<phone>
   ```

   The render refuses a file that is not a valid proposal, and prints the fault: the file goes back
   to that maker once. You do not mend it.
3. **It is read again once.** Each seat that read the board reads the redrawn pick, as a fresh
   sub-agent. A judge is handed `<package>/04-structure/chosen/` in place of the board folder, and
   its seat's earlier ledger to open only after it has read cold, as step 6 of the loop says. An
   audience is handed the new pictures only. What they do not open is what the board's readers did
   not (`references/seats.md`), and the map is still sealed while they read.
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
4. **Move the round whole.** Everything in `<package>/04-structure/` other than `earlier/` goes
   together into `<package>/04-structure/earlier/<n>/`: the briefs, the proposals folder, the board,
   the map, the pick, the pictures, the reads, the decision page and its data, `fresh/`, `chosen/`
   and `CHOSEN.md`. So no proposal of this round can reach the next board.
5. **Say what the state shows meanwhile.** Structure stays awaiting, and its output has moved. Until
   Structure is begun again, `node <kit root>/scripts/state.mjs validate <package>` prints a
   `structure: missing-artefact` line, and `status` still shows the pick's question. Both belong to
   the rejected round: tell the founder so, and do not put that question again. Then go to the stage
   that `node <kit root>/scripts/state.mjs next <package>` names.
6. **When Structure comes round again,** the reopened stage approved anew and each stale stage after
   it stamped again, it starts clean, from step 1 of the skill:

   ```
   node <kit root>/scripts/state.mjs begin <package> structure
   ```

   Copy a fresh `CHOSEN.md` and the brief templates from `templates/package/04-structure/`, with
   `built-from` at the versions the cast, the intent and the context now stand at. Write a new brief
   from the new intent: he reads it before anything is sent, as he read the first.

## A board made again within a round

A proposal arrived late, or one was withdrawn, after the merge and before the pick. The next merge
deals the letters anew, so whatever speaks of the old letters goes with them.

1. **Tell the founder first,** and move nothing without his yes.
2. **Move together** into `<package>/04-structure/earlier/<n>/`: the board, the map, the pick if one
   was begun, the reads, and the decision page with its data. The briefs, the proposals folder and
   `fresh/` stay: it is the same round, and the same brief.
3. **Go on from step 6 of the skill:** tag, merge, draw, photograph, then readers who have read no
   earlier board. The merge refuses while a map or a pick lies beside the board folder: where its
   refusal says to delete, move.
