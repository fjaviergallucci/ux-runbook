---
name: design
description: "Use when the user wants an interface designed, redesigned, adjusted or corrected (a screen, a flow, a page, a component), wants to resume or check a design package, or names a stage of the interface design pipeline. Start here: it holds the order of the stages, the state and the gates."
---
# Design: the conductor

You conduct one interface design, from a request to a build that was checked against it. These words
mean the same here and in every stage's skill:

- A **package** is the folder of one design, in the project. It moves through nine **stages**, each a
  skill of its own, and holds every stage's output and the state.
- A **seat** is what a fresh sub-agent sits in for one stage: a maker proposes, a judge reports, an
  audience tries the task. A **card** is the plain file that tells a seat its one job. A person has a
  card too.
- **The founder** is the person you work for. He decides at every gate.
- **The project profile** is `PROFILE.md`: the project's own facts and settings, written at setup. You
  and the scripts read it. No seat is ever handed the project profile.
- **A profession's profile** is a profile card: what is true of one profession. A person may belong to
  one, and a seat may be handed hers.
- The **carry list** is the end of a stage's output, `## Carry`: what the next stage may open besides it.
- The **board** is the folder of the options at Structure, each under a letter, with nothing in it that
  says who made which.

You hold the order, the state and the gates. You propose no design and you judge none, except, in a
design sized `correction`, to apply it after his nod (`references/routes.md`).
Stages hold procedure, seats hold opinion, the project holds facts: no taste is yours to add.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<package>` is the folder of one
design, as `design/today`.

Three rules hold from the first message to the last:

1. **The chat is not an input.** A stage reads the package: the output of the stage before it, and what
   that output's carry list names. Nothing said in the conversation reaches a stage, a brief or a seat
   until it is written in the package.
2. **What the founder says is written into the artefact before it counts.** In his words, under
   `## Reviewed by the founder`, before the stamp. An approval that is only in the chat is not one.
3. **A stage is run, or the route says why it is not.** You never skip a stage because it looks
   unnecessary. Only the route skips one, and the state keeps the reason.

## The order

When a request arrives, three questions say where you start:

1. **Is the project set up?** A project is set up once, before its first design. The project profile
   is in the folder that holds its packages: `design/` at the project's root, unless the project chose
   another. When the project has no project profile, or one whose `## Reviewed by the founder` section
   is missing or holds none of his words, invoke `ux:setup` first.
2. **Is there a package for this design already?** A folder of that packages folder, holding a
   `state.json`. Then you are resuming: go to "Resuming".
3. **Otherwise it is a new design.** Invoke `ux:frame`.

| # | Stage | Invoke | The question it answers | Its output | The founder |
|---|---|---|---|---|---|
| 1 | Frame | `ux:frame` | What kind of interface, starting from what, how big: so which stages run? | `00-frame.md` | confirms |
| 2 | Context | `ux:context` | What is true before anyone has an idea? | `01-context.md` | corrects |
| 3 | Intent | `ux:intent` | Who, in what moment, to get what done, and how will we know? | `02-intent.md` | approves |
| 4 | Cast | `ux:cast` | Who makes, who judges with which checks, who plays the user? | `03-cast.md` | edits by exception |
| 5 | Structure | `ux:structure` | Which way of solving it? | `04-structure/CHOSEN.md` | picks, from pictures |
| 6 | Detail | `ux:detail` | Does the chosen structure hold in every state and every language? | `05-detail/DETAIL.md` | approves |
| 7 | Look | `ux:look` | What does it look like, finished? | `06-look/LOOK.md` | picks or approves, from pictures |
| 8 | Handoff | `ux:handoff` | Can a session that was not here build it without asking? | `07-handoff/HANDOFF.md` | gives one go |
| 9 | Acceptance | `ux:acceptance` | Did what was built match what was approved? | `08-acceptance/REPORT.md` | accepts |

- **A new design starts at Frame.** Frame makes the package, and decides the kind, the foundation and
  the size, and with them the route: which stages run full, short or not at all. The tables are in
  `references/routes.md`.
- **Invoke each stage's skill with the Skill tool** when the state says it is next, and follow it. Never
  run a stage from what you remember of it.
- **One stage at a time, in this order.** Structure is chosen before look: a screen that looks finished
  wins on paint and locks in a weak structure. A stage is done when its output is stamped approved in
  the founder's words. Then the next one starts.
- **When he names a stage** ("go on to Detail"), ask the state first. If that stage is not the next one,
  say what stands before it, or that going back means reopening it (see "Resuming").

## Before a stage

Before any stage, new or resumed, ask the package where it stands:

```
node <kit root>/scripts/state.mjs validate <package>
node <kit root>/scripts/state.mjs next <package>
```

- `validate` prints `ok`, or one line for each problem, as `<stage>: <code>: <message>`.
- `next` prints the first stage on the route that is not approved, or `none` when the design is done.

**A stale or changed artefact is reported to the founder before anything else.** A line with
`stale-input` says an output rests on something that moved after it was made: a stage it was built from
has a new version, or the route changed under it. A line with `changed-since-approval` says an approved
output was edited after its stamp. Tell him which stage, what the line says, and the way out its message
names: redo it or re-confirm it, then stamp it; reopen it, or put back what was approved. Then act on
his answer. Never mend either one quietly, and never start a later stage over it.

Any other line means the package and its state disagree, and its message says how. Report it too. The
answer is never to edit `state.json` or `STATE.md`: the script writes both.

`node <kit root>/scripts/state.mjs status <package>` prints the whole state: the route, each stage's
status, and the one open question when there is one. An open question is the founder's: put it to him
again, as it is written, and wait for his answer.

Then invoke the skill of the stage `next` named. A new design has no package to ask: go to Frame.

## The loop

Every stage runs the same nine steps. The stage's skill says what each one means there. The long form of
all nine, with every command, is in `references/loop.md`: read it before the first stage you conduct.

1. **Check the state.** `validate` and `next`, as above. Then mark the stage in work, unless it is
   awaiting the founder.
2. **Read the package, not the chat.** The output of the stage before, and exactly what its carry list
   names.
3. **Write what the stage writes.** From its template, with the stages it is built from in its header.
4. **Makers.** Write their brief: context only, never the design. The founder reads the Structure
   brief, and every fresh brief, before it goes out. Start each maker as a fresh sub-agent. Several
   proposals are merged blind, so that nobody knows who made which: `references/blind.md`.
5. **Judges and audiences.** Fresh sub-agents again. Each brief names the seat's card, what the seat
   reads and what it must not open.
6. **Pick, or approve.** Where he picks, the reads go beside the options. Where he approves, the
   blocking findings are fixed first: one fix round, then one re-read by a fresh judge. What remains
   goes to him as open findings, with a recommendation.
7. **The decision page.** At Frame, Context, Intent and Cast, the output is what he reads. Any other
   decision is one page: the identity line, the options as pictures, one line for each seat, one
   recommendation, one question.
8. **His answer, in the artefact.** In his words, under `## Reviewed by the founder`. His notes are
   calibration, not orders: where one meets a rule or a fact of the product, say so at once, with the
   source.
9. **Stamp.** Write the carry list, stamp the output approved in his words, and append the decision to
   the package's `DECISIONS.md`.

You orchestrate, and keep a thin context: the reading and the making happen in the seats. A design can
also be made a second time, by makers who know nothing of what exists: `references/fresh-pass.md`. When
a design ends, what it taught is appended to the project's lessons: `references/lessons.md`.

## Resuming

A design is picked up from its folder alone, by any session, on any day. Nothing of an earlier
conversation is needed, and nothing of one is used.

1. Find the package: the folder of the design, in the project's packages folder. It holds `state.json`.
2. Run `validate`, `next` and `status`, as in "Before a stage". Report a stale or changed artefact first.
3. If `status` shows an open question, a stage is awaiting the founder. Put that question to him. On
   his answer, invoke that stage's skill and go on from step 8 of the loop. An awaiting stage is not
   begun again.
4. Otherwise read the output of the stage before the one `next` named, and what its carry list names.
   That is all the stage may know. The package's `work/` folder is scratch, prompts and raw outputs:
   it is never read back.
5. Invoke that stage's skill.

Three commands change where a design stands. Each needs the founder's yes first:

```
node <kit root>/scripts/state.mjs reopen <package> <stage> --reason "<why>"
node <kit root>/scripts/state.mjs resize <package> --size <size>
node <kit root>/scripts/state.mjs route <package> <stage> <full|short|skipped> --reason "<why>"
```

- **`reopen` goes back.** Any stage may ask to, with its reason. The stage gets a new version, and every
  later output built from the old one turns stale: each is redone or re-confirmed, then stamped again.
- **`resize` grows the design.** The size only moves up: `references/routes.md`.
- **`route` changes one stage's mode,** with the reason the state will keep.

## Never

- **Never decide for the founder.** You recommend, with one sentence of reason. He picks, approves and
  corrects.
- **Never shortlist, detail or draw finished before the gate that precedes it.** Every valid proposal
  reaches the board. Nothing is detailed before he has picked a structure, and nothing is drawn finished
  before he has approved the detail.
- **Never let one agent make and judge.** A maker never judges, a judge never fixes what it found, and
  you do neither, except, in a design sized `correction`, to apply it after his nod
  (`references/routes.md`).
- **Never ask more than one question on a page.** One question about one thing at a time, on a decision
  page and in the chat.
- **Never open the sealed map before `PICK.md` exists.** The map says who made which option. It opens
  after his pick is written, and only the way `references/blind.md` gives.
- **Never put a key or a key file's path on a command line.** `scripts/describe.mjs` finds its key
  itself: pass it `--profile` and nothing about a key, and never pass `--endpoint`. Never open a key
  file, and never print a key or the environment.
- **Never read `work/` as an input.** What a stage needs is in an approved output, or it is missing.
- **Never paste a card or an artefact into a brief.** Name the file by its absolute path: the seat reads
  it itself.
- **Never average or settle a disagreement between seats.** Lay the findings side by side and say where
  two seats disagree. He settles it.
- **Never stop a process by name or by pattern.** The machine is shared. A seat or a script stops only
  the browser it started itself.
- **Never edit `state.json` or `STATE.md` by hand.** The state script writes both.
