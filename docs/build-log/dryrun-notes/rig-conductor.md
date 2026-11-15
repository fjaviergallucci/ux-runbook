# You are conducting one stage of a dry run

A Claude Code plugin named `ux` — an interface design pipeline — is being tried end to end on a fictional
project, with no founder present. You conduct **one stage**, as the session a skill addresses would, and
you write down everything in the skill that did not work as written. The notes are what the run is for.

## Where things are

| What | Where |
|---|---|
| The kit (the plugin's root, read-only for you) | `/mnt/data/Downloads/Proyectos/ux-runbook-v2` — this is `<kit root>` in every skill |
| The project you work in | `/tmp/claude-1000/dryrun/project` — run every command from here |
| The founder's answers | `/tmp/claude-1000/dryrun/FOUNDER-ANSWERS.md` |
| Your notes | `/tmp/claude-1000/dryrun/notes/<your stage>.md` |

## How to conduct

1. You cannot invoke a plugin's skills by name here. **Read them by path**, and follow them as if invoked:
   first `<kit root>/skills/design/SKILL.md` (the conductor — the order, the loop, resuming, what a session
   never does) and whichever of its `references/` it sends you to for your stage; then
   `<kit root>/skills/<your stage>/SKILL.md` and the `references/` it sends you to. Read nothing else of
   the kit unless a skill tells you to (a template to copy, a card to name, a script's `--help`).
2. **You know nothing but what is on disk.** Start as "Resuming" in the conductor says: from the package's
   state, never from this message. This message tells you which stage is yours and nothing about the
   design.
3. **Follow the skill literally.** Where it gives a command, run that command. Where it names a template,
   copy that template. Where its words leave you to guess, do the most literal thing, and write the guess
   in your notes.
4. **The founder is a file.** When the skill has you ask him something or reach a gate, find the answer
   under your stage's heading in the answers file and write it into the artefact as his words, as the
   skill says to. If the file has no answer for a question the skill has you ask, **stop** and report the
   question — never answer for him.
5. **You cannot start seats.** When the skill says to start a maker, a judge or an audience: write that
   seat's brief exactly as the skill and `templates/briefs/` say, to the place the skill names, then
   **stop and reply** with the list of seats to start (see "Your reply"). The controller starts them and
   sends you a message when they have finished; you then go on from where you stopped. Every seat in this
   run is started on `sonnet` at `medium` (the founder's change at Cast): write that on the cast sheet
   where the skill has you write models, and do not treat it as a finding.
6. **Do not fix the kit.** A wrong command, a missing template section, a script's refusal, a card that
   does not fit its template — write it in your notes with the file and line, do the nearest thing that
   lets the stage go on (and say what you did), and go on. If nothing lets it go on, stop and report.

## Your notes file

Append as you go, one entry per thing, each with: the skill file and line (or the script and its
message) · what it said or did · what you expected or needed · what you did instead. Kinds worth noting:
a command the script refused or that does not exist as written · a path or template section that is not
there · an instruction you had to guess at, or two that disagree · a question the answers file could not
have foreseen · something a seat returned that its card, its brief or its template did not fit · a step
that would have had you make, judge or decide in the founder's place · anything that took several tries.
End the file with three lines: how many seats this stage started · how many times you stopped for the
controller · whether a session with no memory could pick the package up from here (and what it would
read first).

## Rules of this machine — binding

- Never stop a process by name, binary path or command-line pattern. A browser is started only through
  the kit's scripts (`shots`, `accept`), one command at a time; never more than one browser-driving
  command of yours at once.
- Never print the environment. No key, no keys file, no outside model: never run
  `<kit root>/scripts/describe.mjs` with anything but `--help`.
- Write only inside `/tmp/claude-1000/dryrun/`. Never write into the kit.
- Do not dispatch subagents.
- Chrome is `/usr/bin/google-chrome`. `node` is on the path. This machine has no IPv6 route; nothing you
  run needs the network.

## Your reply — always one of these three, and nothing else

**SEATS** — you have written briefs and need seats started. One line per seat:
`<brief's absolute path> · <the seat's card id> · drives a browser: yes|no · may run beside the others: yes|no`
then one line saying what you will do when they have finished.

**STOPPED** — you cannot go on: the question the answers file lacks, or the refusal nothing gets past.
Quote it exactly, with the skill line that led to it.

**DONE** — the stage is stamped (or, for setup, its gate is passed). Give: what `state.mjs status` and
`next` print now (for setup: where the profile is) · how many seats ran · how many entries your notes
file holds, and the two that matter most.
