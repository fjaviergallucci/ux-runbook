---
id: maker.outside-describer
shelf: maker
job: Propose one way to solve it, from a mind outside the session's own.
sits-at: [structure, look]
cast-when: The project has turned an outside model on, and the design is worth one more kind of mind.
presets: []
loaded-with: none
reads: [brief]
never-reads: [other-proposals, session-idea, current-screens, design-system, kit, sibling-surfaces]
engine: model:any
suggested-model: none
suggested-effort: none
verified: 2026-11-14
---
# Outside describer

An outside text model, sitting as one more describer. It is given exactly the brief the structure
describers get, and nothing else, so what comes back is one more proposal from a mind that shares none
of the session's habits. No sub-agent sits in this seat: the conducting session runs it with a script.
This card speaks to that session.

## Method

1. **Check that it is on.** The project's profile must list the provider in `engines-on`, as
   `model:openai` or `model:gemini`, and Cast must have named this seat. If the profile does not list
   it, the seat is not cast, and that is the end of it: the brief leaves the machine, and whether it
   may is the founder's decision, made once for the project. The script refuses too.
2. **Send the same brief.** It is the file the structure describers were given, as the founder approved
   it, whole and unchanged; in a fresh pass, the fresh pass's brief. Add nothing to it: no opening line,
   no example, no other proposal. `<kit root>` is the kit, two folders above this card.

   ```
   node <kit root>/scripts/describe.mjs --provider <openai|gemini> --model <id> --brief <the brief> --out <proposals folder>/<name>.json --profile <PROFILE.md>
   ```

   `--model` is the profile's `openai-model` or `gemini-model`. One call, one proposal.
3. **A valid answer is a proposal like any other.** The script exits 0 and writes it at `--out`, marked
   with the engine and the model it ran on. From here it is merged blind with the rest, drawn in the
   same kit, and read by its letter.
4. **An answer that is not in the format** leaves `<out>.raw.txt` beside where the proposal would have
   been, and the script exits 1 and says why. Cast a transcriber on that file. It writes what the answer
   says into the format, and adds nothing.
5. **A refusal leaves nothing.** The profile, the provider or the wait was at fault. Try once more only
   after a timeout. Then go on without this seat, and say on the decision page which describers
   answered.
6. **After the pick,** once the author map is open, write in the lessons file whether its proposal was
   picked. The seat is kept or dropped on that record, not on anyone's opinion of the model.

**At Look** this seat sits only inside a fresh pass, and it chooses only the paint. The brief it is sent
names the one screen the visual designer is drawing, and its state, and carries that screen's approved
structure and strings. It asks for that screen, in that state, with those words exactly as written: no
element added, none dropped, no string rewritten, no other screen. What comes back is a concept as it
came, not a proposal for the board, so the script is run with `--text`: it looks for no proposal, and
writes the answer whole at `--out`, which then names a `.txt`, `.md` or `.html` file.

```
node <kit root>/scripts/describe.mjs --text --provider <openai|gemini> --model <id> --brief <the fresh brief> --out <fresh pass folder>/<name>.md --profile <PROFILE.md>
```

The concept is shown beside the system version, with anything it changed said beside it. It is never
mended, and never handed off.

**Without the engine** the seat is not cast. The Claude describers already do the job, and a stage never
waits for this one.

## Output

At Structure: one proposal as JSON in the walkthrough format, with the other proposals in
`04-structure/`. The format is in `kit/KIT-CONTRACT.md`, and the script checks the answer with `validate`
(`scripts/lib/walkthrough.mjs`) before it writes anything. When the check fails, the answer as it came
is in `<out>.raw.txt`, and the proposal is the transcriber's.

At Look: the concept as it came, kept with the fresh pass in `06-look/`.

## Never

- Never send anything but the approved brief: no other proposal, no idea of the session's, no picture
  of today's screen, nothing of the design system, of the shared kit, or of how the product's other
  surfaces look.
- Never turn the engine on yourself. `engines-on` is the founder's line in the profile.
- Never mend, complete or improve an answer by hand. A valid one goes to the board as it is. An invalid
  one goes to a transcriber.
- Never tell a judge, an audience or the founder which letter is the outside model's before the pick.
- Never call it again and again until it says something you like. One call, and one more after a
  timeout.
- Never use it at Detail, and at Look never outside a fresh pass.

## Borrowed

Three describers, two of them outside models, sent one brief by a script and merged blind: from the
picture-making process this pipeline was adapted from. So is the habit of keeping a record of whose
proposals are picked. Nothing under a third-party licence.
