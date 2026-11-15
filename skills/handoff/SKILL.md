---
name: handoff
description: "Use when the interface design pipeline reaches Handoff: an approved design is packed into one folder another session can build from without asking."
---
# Handoff: one folder a session can build from

You pack the approved design into one folder that a session which was never here can build from
without asking. You write it from what Look's carry list hands you; a cold implementer, handed that
folder and nothing else, lists what it would have to ask and to guess; and the founder gives one go.
You design nothing, and you change nothing that was approved: no string, no state, no rule, no id and
no value. The conductor (`ux:design`) sent you, and its words are yours. Its loop is in
`skills/design/references/loop.md`: this page says only what is Handoff's own.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`. `<tokens>` is the
project's token file, as Look's carry list names it. Two folders are yours: `<package>/07-handoff/`,
the handoff folder, which is all a builder is given, and `<package>/07-handoff-gate/`, beside it and
never in it, for what the gate needs and a builder does not.

## Question

Can a session that was not here build it without asking?

## Reads

- **The look,** `<package>/06-look/LOOK.md`, approved, and exactly what its carry list names: the
  cast sheet's table for every stage, with each seat's model and effort; the carried sections of the
  intent and the context; "What the readers found" of the structure, the detail and the look, with
  the reads folders of the three; the states, the strings with their why-lines, the rules, the edge
  cases, the data map and the dependencies; the measured values and the named extensions; the final
  screens, their pictures, the plain prototype and `<tokens>`; and the package's `DECISIONS.md`.
  `references/folder.md` says which of these fills which file.
- **The state:** `node <kit root>/scripts/state.mjs status <package>` prints the kind, the size, the
  version each stage stands at, and whether Handoff is routed full or short.
- **The project profile,** `<packages>/PROFILE.md`: `product`, `components`, `strings-format` and
  `languages`, with its "Standing rules", and nothing about a key.
- **The component source:** the folder the project profile names under `components`, read now.
- **Of the kit:** the templates named under "Writes", `templates/briefs/judge.md`, and
  `reference/IMPLEMENTER-GUIDE.md`, which you copy. The cold implementer's card is read by its seat.
- **Never** `<package>/06-look/fresh/`, `<package>/06-look/beside/` or the sealed file beside it;
  `<package>/04-structure/earlier/`; a letter that was not chosen; the package's `work/` folder; the
  chat. What is on no line of the carry list is not yours to open.

## Writes

Each path below is from `<package>/`. `<version>` is the version a stage stands at, as `status`
prints it: after a reopening it is not 1.

| File or folder | What it holds | From |
|---|---|---|
| `07-handoff/HANDOFF.md` | the stage's output and the builder's entry, with `built-from: [look@<version>, detail@<version>, structure@<version>, cast@<version>, intent@<version>, context@<version>]` | `templates/package/07-handoff/HANDOFF.md` |
| `07-handoff/IMPLEMENTER-GUIDE.md` | how a builder turns the prototype into the project's components | `reference/IMPLEMENTER-GUIDE.md`, copied whole |
| `07-handoff/prototype/` | the final screens, an index, and in `shots/` their reference pictures | Look's screens and pictures, copied |
| `07-handoff/tokens.css` | the token file the screens were drawn on | `<tokens>`, copied |
| `07-handoff/SPEC.md` | each surface: its job, its regions, every state, the rules, the data map, the dependencies | `templates/package/07-handoff/SPEC.md` |
| `07-handoff/strings.json`, and the strings in the project's own format | every string by key, in every language, with its limit and its why-line | the detail's strings, copied |
| `07-handoff/PARTS.md` | the component and the tokens of each element, and each change to the system | `templates/package/07-handoff/PARTS.md` |
| `07-handoff/ACCEPTANCE.md`, `07-handoff/acceptance.json` | the checks, in words and as a script runs them | `templates/package/07-handoff/ACCEPTANCE.md`, `templates/package/07-handoff/acceptance.json` |
| `07-handoff/DECISIONS.md` | what was chosen, why, and what each choice forces on the build | `templates/package/07-handoff/DECISIONS.md` |
| `07-handoff/COVERAGE.md` | every seat, its checks run and not run, every finding and what became of it | `templates/package/07-handoff/COVERAGE.md` |
| `build/BUILD.md`, `build/STATES.md`, `build/DEVIATIONS.md` | the three pages the builder writes back, each still to fill | `templates/package/build/` |
| `07-handoff-gate/` | the results of the checks on the prototype; the cold implementer's ledger, and its re-read; `decision.json` and `decision.html` | the acceptance script; `templates/outputs/LEDGER.md`; `templates/outputs/decision-approve.json` |

## Steps

1. **Begin.** Check the state as step 1 of the loop says. A stage that is awaiting the founder is not
   begun again: take his answer to "Gate", or to the step that asked. Otherwise mark it in work:

   ```
   node <kit root>/scripts/state.mjs begin <package> handoff
   ```
2. **Read the look, and what its carry list names.** Copy the template to
   `<package>/07-handoff/HANDOFF.md` and write `built-from`, unless the file is already there: then
   go on from what the folder holds, at the first step whose file is missing. **When a file of the
   folder needs something that is on no line of the carry list, stop and tell the founder what is
   missing:** you never reach into the package's history for it.
3. **Copy in what was approved, and change one line of it.** `references/folder.md` has each:
   - every page of `<package>/06-look/screens/` into `<package>/07-handoff/prototype/`, and the
     pictures of those pages into `<package>/07-handoff/prototype/shots/`;
   - `<tokens>` to `<package>/07-handoff/tokens.css`, noting the path it came from and the commit
     that last changed it; in each copied page the one link to `<tokens>` then names that copy, as
     `../tokens.css`, and nothing else of a page changes;
   - `<package>/07-handoff/prototype/index.html`: every page as a link, by screen, state, language;
   - the guide, whole; and the three pages of `templates/package/build/` into `<package>/build/`.
4. **Write `SPEC.md`, the strings and `DECISIONS.md`.** Each heading is filled from the approved
   section `references/folder.md` names for it, and whatever a builder needs is written out in full:
   nothing in the folder points back into the package. `strings.json` is the detail's, copied.
   **When the project profile names a `strings-format`,** the same keys and strings are also written
   in that format, by a script and never by hand, and counted against `strings.json` by tool.
5. **Write `PARTS.md` from the component source, read now.** Open the folder the project profile
   names under `components`. For each element id of the spec, write the component the project has
   for it, the file it is in as installed, and the tokens it takes: each a name and a path you opened
   and saw in this session, never one from memory or from a ledger. An element the system has no
   part for is never given the nearest name. **Each named extension** of `measures.md` is written
   under "Changes to the system", with its definition: a change to the system, to be agreed as one.
6. **Write the checks, and run them on the prototype first.** `ACCEPTANCE.md` and `acceptance.json`
   are written from the intent's success criteria, the states and the measured values, each element
   by its stable id, its `data-ux`, with `screen` where an id repeats: `references/folder.md`. Then:

   ```
   node <kit root>/scripts/accept.mjs prototype <package>/07-handoff/acceptance.json --root <package>/07-handoff/prototype --out <package>/07-handoff-gate/results.json
   ```

   The script refuses a file that is not valid, and names each fault. **A check that fails on the
   approved prototype is a wrong check:** rewrite the check, never the page, and run it again until
   none fails. A check answered `cannot be told:` or `cannot be measured:` is rewritten so that it
   can be made, or taken out and listed in `ACCEPTANCE.md` as one a person must look at.
   `--allow-errors` is passed only with its reason written beside the command in `COVERAGE.md`.
7. **Write `COVERAGE.md`, and fill `HANDOFF.md`.** Coverage: every seat of the cast sheet's tables
   with what it read, the model it ran on and its checks run and not run; every finding of every
   ledger with what became of it; and the count line step 6 printed, with the day. `HANDOFF.md`:
   the slices in build order, as "the list of free rooms, default and empty", each small enough to
   build, verify and commit alone, with its own done-when and the checks it must hold, by id.
8. **Start the cold implementer.** One `judge.cold-implementer`, a fresh sub-agent, started as
   "Starting a seat" in the loop says, on the model and the effort its line of the cast sheet's
   "Handoff" table names: a dash means the session's model, and you enforce none. Its brief, from
   `templates/briefs/judge.md`, hands it `<package>/07-handoff/`, whole, and nothing else:
   `references/seats.md` has its "Do not open" list. Its ledger is written in
   `<package>/07-handoff-gate/`, never in the folder it reads.
9. **Answer every question and every guess in the folder.** Each item of its ledger is closed one of
   three ways, in the file its fix names: `references/seats.md` says how.
   - **The answer is in what the carry list hands you:** write it in the folder.
   - **It is how something is built:** write it under "Left to the builder", as the builder's.
   - **Nobody decided it:** put it to the founder, one question at a time, with the default you
     would propose. Record it with the `await` of the gate, write his answer under `## Reviewed by
     the founder` and into the folder, as he said it, and put the stage back in work with the `begin`
     of step 1. Where he leaves it open, the default is written, marked as one. None is settled
     in silence.

   Then run step 6 again when a check changed. **One re-read, when an item blocked:** a fresh
   sub-agent in the same seat reads the folder cold, then opens the earlier ledger. No second round.
10. **Build the decision page.** Write `<package>/07-handoff-gate/decision.json` in the shape of
    `templates/outputs/decision-approve.json`: the folder as its one option, with two reference
    pictures named from the page, the phone width first, as
    `../07-handoff/prototype/shots/today-default-en-390-light.png`; the cold implementer's line;
    under `findings`, each item still open and each default, by seat; one recommendation; one
    question. Its identity is as `status` prints it, at stage 8 of 9.

    ```
    node <kit root>/scripts/page.mjs <package>/07-handoff-gate/decision.json --out <package>/07-handoff-gate/decision.html
    ```

**Routed `short`** (an adjustment), Handoff is what changes, and no more. **Sized `flow`,** the folder
is one, and `SPEC.md` goes surface by surface. **Sized `correction`,** it is one paragraph, and no
seat. `references/forms.md` has the three.

## Gate

**He gives one go.** Put `<package>/07-handoff-gate/decision.html` in front of him, and the folder
itself, `<package>/07-handoff/HANDOFF.md` first. Record the one question, so that a session resuming
tomorrow asks the same:

```
node <kit root>/scripts/state.mjs await <package> handoff --question "<the one question>"
```

One question, about one thing: may this folder go to the session that builds it? **Stop: nothing is
handed to a builder before his go, and you do not give it.**

- **Write what he says under `## Reviewed by the founder`,** in `HANDOFF.md`: what he corrected, and
  the words of his go, as he said them. A correction to the folder's own words is made in the folder.
  One that changes a string, a state, a rule, an id or a value is not Handoff's: ask him to reopen
  the stage it belongs to, as the conductor's "Resuming" says.
- **No carry list.** `HANDOFF.md` has none: Acceptance reads this folder, and what the builder
  writes back.
- **Stamp it,** in the words of his go:

  ```
  node <kit root>/scripts/state.mjs stamp <package> handoff --words "<the founder's words>"
  ```

  Then append the decision to the package's `DECISIONS.md`, and ask the state what is next, as step
  9 of the loop says.
- **Tell him what happens now.** The session that builds is given `<package>/07-handoff/` and nothing
  else, and writes back into `<package>/build/`. Acceptance (`ux:acceptance`) runs afterwards, in a
  session of its own: you do not build, and the session that builds does not accept its own work.

## Never

- **Never change what was approved:** a string, a state, a rule, an id, a measured value or a page,
  but the one link to the token file. A fault you find in them goes to the founder, open.
- **Never write a part, a token or a path from memory.** `PARTS.md` holds what you opened and saw.
- **Never hand off a check that was not run on the prototype,** or one that fails there.
- **Never copy into the folder, or name in it, anything a fresh maker made:**
  `<package>/06-look/fresh/`, `<package>/06-look/beside/`, the sealed file, a fresh brief.
- **Never let the folder point outside itself:** no path into the package, no "as discussed", no
  address on the web. A path into the project's own source is one a builder will find there.
- **Never give the cold implementer anything but the folder,** and never answer its question aloud
  instead of in the folder: a builder gets no answer that is not written there.
- **Never settle a default in silence,** and never run a second re-read.
- **Never open what is on no line of Look's carry list,** the package's history least of all.
- **Never write a password, a token or a key into the folder,** and never the path of a keys file:
  an account is named by its role, with where its sign-in is kept.
- **Never stop a process by name or by pattern,** or start a browser other than through the kit's
  scripts: three browser-driving commands or seats at once, at most.
- **Never ask two things at once,** and never start the build yourself.
