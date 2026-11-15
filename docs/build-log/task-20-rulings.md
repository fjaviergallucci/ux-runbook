# Task 20 — how the dry run is conducted (the controller's rulings)

The brief says the dry run is run by the main session. It is — but through hands, for two reasons the brief
did not foresee: a session that has conducted twenty tasks has no room left to hold eleven skills and a
package, and a sub-agent cannot start other agents.

**Ruling R156.**
1. **One conductor per stage.** Each stage (setup, then the nine stages) is conducted by a fresh sub-agent
   that reads the conductor's skill and that stage's skill by path from the kit, and the package — nothing
   else. It knows nothing of the stage before but what is on disk. This is closer to the proving run's test
   (a true change of session between stages) than one long session would be.
2. **The controller starts the seats.** A stage conductor cannot start agents. When its skill says to
   start a seat, it writes the seat's brief as the skill says, stops, and returns the list of seats (brief
   path, card, model, effort, whether it drives a browser). The controller starts each seat with nothing
   but a pointer to its brief, then resumes the conductor with what came back. The controller reads no
   artefact and decides nothing.
3. **Where.** The fictional project is committed under `tests/dryrun/project/`. The run happens in a copy
   outside the repository — `/tmp/claude-1000/dryrun/project` — so the branch stays clean; what the run
   teaches is written to `docs/design/DRY-RUN.md`.
4. **The founder is a file.** `tests/dryrun/FOUNDER-ANSWERS.md` holds one answer per gate and per question
   a stage asks, written before the run. A conductor that reaches a gate reads the answer for that gate
   and writes it into the artefact as his words. A question the file has no answer for is a finding: the
   conductor stops and reports it; the controller adds the answer and records that it was missing.
5. **Models.** The dry run tests the mechanics and nothing else, so every seat runs on `sonnet` at
   `medium` — the answers file says so at Cast, as the founder's change to the suggestions. Stage
   conductors run on `opus`.
6. **Scope, as the brief has it:** size `surface`, kind `working-surface`, no fresh pass, no outside
   engine, three describers on three lenses, one seat removed at Cast.
7. **Findings.** Every conductor keeps a notes file, `/tmp/claude-1000/dryrun/notes/<stage>.md`: each
   place a skill's wording was unclear or wrong, each command a script refused, each thing it had to
   guess, each thing a seat returned that its card or template did not fit. It does not fix the kit. The
   controller gathers the notes; defects are fixed by a sub-agent in the file that owns them, with a
   test where the defect was mechanical, and written into `docs/design/DRY-RUN.md`.
8. **The machine's rules bind every conductor and seat:** never stop a process by name, binary path or
   command-line pattern; a browser only through the kit's scripts; never more than three browser-driving
   commands or seats at once (the controller starts browser-driving seats at most two at a time); never
   print the environment; no key, no keys file, no outside model.
