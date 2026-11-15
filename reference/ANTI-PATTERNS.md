# Anti-patterns

Three lists. The first is about design. The second is about the session that runs the process, which
is a different and quieter kind of failure: the method is skipped while it appears to be followed.
The third is the failures this pipeline was built against, each with the rule that guards against it.

## Design anti-patterns

| Anti-pattern | Why it fails | Instead |
|---|---|---|
| **Listing components in a brief** | You designed the screen, and the maker drew it. You get your own assumptions back with better spacing. | Describe the person, her moment and what stops her. |
| **Specifying the layout** | "Grid", "split view", "cards": the same failure one level up. The layout is the decision you meant to hand over. | State the data and its order of priority, and let the layout follow. |
| **Copying a competitor's screen** | You inherit their constraints, their user and their compromises, and you can only be similar, never better. | Design for this person's job. Look outside the category for form. |
| **Designing for everyone at once** | Diluted priorities give a wall of things of equal weight. Nobody's job is easy. | One person for each surface. The others are accommodated, not centred. |
| **Starting from the look** | A beautiful screen that does not do the job, and one that is far harder to give up once the palette is agreed. | Structure first. The look expresses it. |
| **Prescribing colours and typefaces in a brief** | It narrows the range to your first instinct, and reads as generic. | Keep the direction in the design system, once. Describe the feeling, not the values. |
| **"Unlimited", "seamless", "intuitive", "simple"** | Words that describe an absence. They tell nobody anything, and excuse skipping what is specific. | Say what it does. "Three clicks" beats "seamless". |
| **Filler text and invented people** | It hides every layout problem that matters: the ninety-character name, the empty field, the nine-digit number. | Real content, with the worst plausible cases of the real domain. |
| **Designing the ordinary state only** | The empty, error and overflow states are three quarters of the work and all of the frustration. | Name the states in the intent. Design and build each. |
| **Deferring the phone width** | It is not a smaller layout: it is where the layout breaks. Deferring it means building again. | The phone width in the same pass, every pass. |
| **Deferring the dark theme** | Adding it later means reading every screen and every contrast pair again. | Both themes in the token file, before any screen exists. |
| **Colour as the only signal** | About one man in twelve cannot tell your red from your green. It also fails in bright light and in print. | Shape, an icon or text beside the colour. Always. |
| **Nudging with raw values** | A margin of seven is invisible to the theme, to a change of token, and to whoever tries to fix it later. | If the system lacks the step, add it to the system. Then use it. |
| **Two design systems** | It happens quietly: a pasted prototype, an imported part. Nobody sees it until a colour is defined in three places. | Read the system that exists first. Extend it, and never build one beside it. |
| **Fixing a finding nobody approved fixing** | Scope added to someone else's work, buried in a change that was about something else. | Report it. Wait. Do what was approved. |

## Process anti-patterns

| Anti-pattern | What it looks like | Why it is the failure |
|---|---|---|
| **The gate that was presented and passed** | Showing the options and starting the next stage in the same message. | The gate is the stop, not the presentation. |
| **Approval laundering** | Treating "looks good", said of a page of several options, as a pick. | It is not one. Ask which. Ambiguity is not approval. |
| **Gate inheritance** | "He approved the last screen, so this one is approved." | A direction carries over to a new surface. A pick never does: each design has its own gates. |
| **Scaffolding as not building** | "I will set up the files and the types while he decides." | Structure creates commitment. By the time he picks, he picks against something half built. |
| **Confidence as evidence** | "It should render correctly." "The code looks right." | A build is accepted on checks that ran and pictures that were taken. Belief is not an artefact. |
| **Assumed capability** | "The tool is configured, so it works." | An engine works when a call to it returned output. A configuration is a guess. |
| **The invented person** | A person assembled from what such people are usually like, instead of from asking. | A fabricated design that nobody notices is fabricated until it ships. Ask. A guess is marked as one. |
| **The demographic dressed as a person** | "A busy professional who values efficiency." | It makes no design decision. If nothing about her is surprising, she is not finished. |
| **More options against the same brief** | A round was rejected, so six more are made from the brief that produced it. | Six more wrong screens. A rejected round usually means the context or the intent was thin. |
| **Silent drift** | Each screen a reasonable small exception to the direction. | Ten reasonable exceptions are no direction. Name the drift out loud. |
| **The quiet re-decision** | Deciding again what the decisions log already holds, usually differently. | Cite the entry. A decision that changes is a new entry that names the one it replaces. |
| **The dropped finding** | A finding that was deferred and never written down. | Deferred and forgotten are the same thing unless one of them is on paper. |
| **Skipping the picture because a tool is missing** | Going from an idea straight to code. | Every change then costs real code. A seat works without its engine: draw it plainly. |
| **Many fixes, one look** | Fixing eight things, then taking one picture. | When something broke, nobody can tell which fix did it. Look again after each. |

## What this pipeline guards against

Each of these has happened. Each is one line, with the rule of the pipeline that stops it.

| The failure | The rule that guards against it |
|---|---|
| **A brief that prescribes the design.** It returns the session's own idea in three voices. | A brief gives context, never the design: no component, no layout, no idea of the session's. The founder reads the Structure brief before it goes out. |
| **A shortlist before the founder marks.** The session's taste picks, and he chooses among what is left. | Every valid proposal reaches the board, under a letter. Nothing is shortlisted, mended or ranked away before he has marked. |
| **A judge that redraws.** The seat that found the problem designs the answer, and nobody judges that. | A judge reports: a finding, its weight, a fix in one line. It never fixes, redraws or approves. A maker fixes, a fresh judge reads again, and he decides. |
| **A simulated read quoted as evidence.** "The users preferred B." | Every task read opens with its caveat, word for word. Only its ranking and its stuck points carry information, and a real person's read outranks it. |
| **A fresh screen handed off as it came.** Its code and its values enter the product beside the system. | What he marks on a fresh screen is made again on the project's tokens, as a named extension. Nothing a fresh maker made is copied, carried on or handed off. |
| **A check skipped without a line saying so.** Its absence reads as a pass. | Every ledger lists each check it did not run, with the reason. The coverage page carries them to the builder, and a build is never reported accepted with a check not run and unexplained. |
