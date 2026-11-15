---
name: acceptance
description: "Use when a design handed off by the interface design pipeline has been built and must be checked against what was approved."
---
# Acceptance: did the build match the design

You check a build against the design that was handed off. You are a session of your own, after the
build: you did not design it and you did not build it, and you read the handoff folder as the builder
did. You put each state on screen in the real build, run the folder's checks there, have the cast's
judges and one audience read pictures of it, and report each item as *matches* or *deviates*. You
implement nothing, redesign nothing and settle no deviation: the founder decides each. The conductor
(`ux:design`) sent you, and its words are yours. Its loop is in `skills/design/references/loop.md`:
this page says only what is Acceptance's own.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`. "The driver" is
the project's own way of driving a browser, as the project profile gives it under "How a browser check
is run here". Where that names no script, there is none yet, and step 3 says what follows.

## Question

Did what was built match what was approved?

## Reads

- **The handoff folder,** `<package>/07-handoff/`, approved, whole: `HANDOFF.md` first, then in the
  order its guide gives.
- **What the builder wrote back,** in `<package>/build/`: `BUILD.md`, what was built, where it lives
  and how to run it; `STATES.md`, the state map; `DEVIATIONS.md`, what could not be built as drawn.
- **The running build,** through the driver, and the files `BUILD.md` lists as built or changed,
  but a settings file and anything else that holds a sign-in: those are never opened.
- **The state:** `node <kit root>/scripts/state.mjs status <package>` prints the kind, the size, the
  version Handoff stands at, and whether Acceptance is routed full or short.
- **Of the cast sheet,** `<package>/03-cast.md`: its "Acceptance" table, and the lines of its carry
  list that name a person's card, a profession's profile and "Tasks for the audience" of the intent,
  with that one section. They seat the readers, and you open nothing else of either. And of the
  package's `DECISIONS.md`, its last entry alone, for the number of the one you append.
- **The project profile,** `<packages>/PROFILE.md`: `browser-check`, `languages`, `components`,
  `facts` and `decisions-log`, with "How a browser check is run here" and "Design system".
- **Of the kit:** the templates named under "Writes", `templates/briefs/judge.md`,
  `templates/briefs/audience.md`, `skills/design/references/lessons.md`, and
  `scripts/lib/browser.mjs`, where step 3 has you write a driver.
- **Never** anything else of the package's history: no earlier stage's folder, no reads folder of
  another stage, `<package>/07-handoff-gate/`, the package's `work/` folder, or the chat. A file of
  those that a seat is handed is named by its path, and you do not open it.

## Writes

Everything below is in `<package>/08-acceptance/`, and the seats' briefs in `<package>/work/`, but the
last two rows: they are the project's, and each is written only on his yes. `<version>` is the version
Handoff stands at, as `status` prints it: after a reopening it is not 1.

| File or folder | What it holds | From |
|---|---|---|
| `REPORT.md` | the stage's output, with `built-from: [handoff@<version>]`: each item, *matches* or *deviates* | `templates/package/08-acceptance/REPORT.md` |
| `results/<state>.json` | what the checks of one state returned in the build, as they came; `<screen>-<state>.json` where two screens share a state's name | the in-page file, through the driver |
| `checks.md` | the table of every check: failed, not run, passed | the acceptance script |
| `by-hand.md` | each check made by hand: what was done, and what was seen | you, through the driver |
| `shots/` | a picture of each state of the build, at each width and theme its checks name | the driver |
| `reads/` | one ledger for each judge, and the audience's task read | `templates/outputs/LEDGER.md`, `templates/outputs/TASK-READ.md` |
| `FIXES.md` | each deviation to fix, as a slice any session can take | `templates/package/08-acceptance/FIXES.md` |
| `decision.json`, `decision.html` | the decision page, and its data | `templates/outputs/decision-approve.json` |
| the driver, at the path of his answer | for a build that opens as files, where the project profile names no script: one script in the project, only on his yes | `scripts/lib/browser.mjs`, `references/driving.md` |
| its line in `<packages>/PROFILE.md` | the driver's command, under "How a browser check is run here", only on his yes | step 3 |

You also append to the package's `DECISIONS.md` and to the project's `LESSONS.md`, and you bring the
handoff folder up to date with each deviation he accepts: "Gate" says how.

## Steps

1. **Begin.** Check the state as step 1 of the loop says. A stage that is awaiting the founder is not
   begun again: take his answer to "Gate", or to the step that asked. Otherwise mark it in work:
   ```
   node <kit root>/scripts/state.mjs begin <package> acceptance
   ```
2. **Read the handoff folder, and what the builder wrote back.** Copy the template to
   `<package>/08-acceptance/REPORT.md` and write `built-from`, unless the file is already there:
   then go on from what the folder holds, at the first step whose file is missing. **A page of
   `<package>/build/` that is still to fill, or a state of `SPEC.md` with no row in `STATES.md`,
   goes back to the builder:** tell the founder which, and stop. You never work a state's way out
   yourself. **If a file holds a password, a token or a key, say where, never what, and stop.**
3. **Start the build and sign in, the way the project says.** `BUILD.md` says how it is run, and "How a
   browser check is run here" how it is looked at: headless, reduced motion set. `STATES.md` names an
   account by its role, and says where its sign-in is kept: the driver takes it from there. Use seeded or
   test data, and nothing else. `references/driving.md` has the whole of this step and the next. **Where
   the project profile names no script, there is no driver.** For a build that opens as files, say so to
   the founder and, on his yes, written under `## Reviewed by the founder` first, write the project's
   driver, one script in the project, on the kit's `scripts/lib/browser.mjs`, and write its command into
   the project profile. For a build that needs a server or a sign-in the kit can write none: say so to
   him, open, and stop, as step 2 stops on a credential. That page has both.
4. **Put each state on screen, check it there, and photograph it.** For each row of "States to drive" in
   `ACCEPTANCE.md`, reach the state as its row of `STATES.md` says, at the width and in the theme its
   checks name, and stay at the top of the page, where a list of rooms begins. The kit's in-page file
   makes the checks, and this prints its path:
   ```
   node <kit root>/scripts/accept.mjs inpage
   ```

   Evaluate that file's text in the page through the driver, call `window.__uxAccept(checks)` with that
   state's checks of `acceptance.json`, and have the driver write what comes back, as it came, to
   `<package>/08-acceptance/results/<state>.json`. Then take the state's picture. One state at a time. A
   state that cannot be reached gets no file: its checks show as not run, and step 5 asks why.
5. **Build the table of the checks.** Name every file of `results/`, one after another:
   ```
   node <kit root>/scripts/accept.mjs report <package>/08-acceptance/results/<state>.json --checks <package>/07-handoff/acceptance.json --out <package>/08-acceptance/checks.md
   ```

   It prints the count: failed, not run, passed. A check with no result shows as **not run**. **Every
   check not run has its reason written in `REPORT.md`,** under "The checks", or it is run: you never
   report an acceptance with a check not run and unexplained. Then make the checks `ACCEPTANCE.md`
   leaves to a hand, and write each down in `by-hand.md`: `references/driving.md`.
6. **Start the readers.** The judges of the cast sheet's "Acceptance" table, each a fresh sub-agent
   on what its line names, in one message; then one audience, the task reader that table seats. A
   judge is handed pictures of the build and the results, reads them cold, and only then opens its
   seat's earlier ledger. The task reader is handed pictures only, her card and her profession's
   traits. `references/seats.md` has each hand-over and each "Do not open" list. Each writes one
   file in `<package>/08-acceptance/reads/`. No reader drives the build.
7. **Write the report, item by item.** One row for each success criterion, each state, each entry of
   `DEVIATIONS.md`, and each difference a reader found: *matches* or *deviates*, with the check's id or
   the picture that shows it. A failed check deviates. So does a deviation the builder wrote down,
   however reasonable. Where two seats disagree, both are written, each in its words. What a reader
   found that the approved design already had is no deviation: the report has a place of its own for it.
8. **Build the decision page.** Write `<package>/08-acceptance/decision.json` in the shape of
   `templates/outputs/decision-approve.json`: the build as its one option, with two of its pictures
   named from the page, the phone width first, as `shots/today-default-en-390-light.png`; one line for
   each seat that read; each deviation under `findings`, by what found it, a seat, `check: <id>` or `by
   hand`; one recommendation, resting on the reads; one question: the list of the deviations, or, with
   none, whether he accepts the build. The option's line gives the count of the checks, and says what
   they do not see: nothing is pressed, loaded, sent or focused, so the keyboard pass and the builder's
   deviations stand beside the count. Its identity is as `status` prints it, its stage as the loop
   counts it.
   ```
   node <kit root>/scripts/page.mjs <package>/08-acceptance/decision.json --out <package>/08-acceptance/decision.html
   ```

**Routed `short`** (an adjustment), Acceptance is what changed, and no more. **Sized `flow`,** every
surface is driven, and it is accepted once. **Sized `correction`,** it is one picture beside another,
and the session that applied it accepts it. **A fix that comes back** is checked again where it was.
`references/forms.md` has the four.

## Gate

**He accepts.** Put `<package>/08-acceptance/decision.html` in front of him, with `checks.md` and the
pictures. **Each deviation is his to decide: is it accepted as built, or fixed?** The list is one
question: the deviations numbered, each with what follows from each answer, answered by number in
one message. Record it, write his answers into `REPORT.md` as he said them, and put the stage back in
work with the `begin` of step 1. One he leaves unanswered stays open, and is asked again:
```
node <kit root>/scripts/state.mjs await <package> acceptance --question "<the one question>"
```

- **A deviation he accepts** is written under "Deviations accepted", in his words, and appended to
  the package's `DECISIONS.md` and to the folder's own. Then the handoff folder is brought up to
  date, so that the design on disk is what shipped and no file of it contradicts another: the
  check is rewritten to hold the build as accepted, and run again. `references/deviations.md` has
  every file it touches, and how a stamped `HANDOFF.md` is changed.
- **A deviation to fix** goes out in `<package>/08-acceptance/FIXES.md`, written like a slice of the
  handoff: *Context · Task · Done when · Verify*, so that any session can take it knowing nothing
  else. You do not build it. **The stage is not stamped while a fix is out:** `references/forms.md`
  says how it comes back.
- **A fix the size of a correction,** a wrong label, token or spacing value, may be applied by you,
  after his nod on a picture of before and after, and never before. Its state is then checked again.
- **When no deviation is left undecided and no fix is out,** ask the last question, with the same
  `await`: do you accept this build? **Stop: you do not accept it, and you go no further without his
  words.** Write them under `## Reviewed by the founder`.
- **Append the lessons** to `<packages>/LESSONS.md`, as `skills/design/references/lessons.md` says,
  with the row for each seat whose finding changed a decision, and the model it ran on. Write the
  entry from the handoff's `COVERAGE.md` and `DECISIONS.md`, this stage's reads and the state, never
  from memory. Name it under "Lessons" of `REPORT.md`, before the stamp.
- **Stamp it,** in the words he accepted it with:
  ```
  node <kit root>/scripts/state.mjs stamp <package> acceptance --words "<the founder's words>"
  ```

  Then append the decision to the package's `DECISIONS.md`, and ask the state what is next, as step
  9 of the loop says. It prints `none`: the design is done.

## Never

- **Never implement, mend or restyle the build,** but a fix the size of a correction, after his nod.
- **Never settle a deviation yourself,** and never call one too small to report.
- **Never report an acceptance with a check not run and unexplained,** or with a state not driven
  and unexplained.
- **Never write, print or copy a password, a token or a key:** not into the package, a results file,
  a picture's name, a brief or a command line. An account is named by its role and where its sign-in
  is kept. Never open a keys file, and never print the environment.
- **Never write a script that signs in,** or one that takes a sign-in from where it is kept.
- **Never photograph a real person's data.** A picture that would show it is not taken, and the
  report says so.
- **Never open the package's history:** an earlier stage's folder, another stage's ledgers, `work/`.
- **Never edit a stamped output as it stands:** `HANDOFF.md` or an earlier stage's, nor any file of its
  folder. Where an accepted deviation makes one false, it is reopened first: `references/deviations.md`.
- **Never change a check to make a build pass.** A check changes only with a deviation he accepted.
- **Never hand an audience a page, its source, a result or a ledger.** Pictures only.
- **Never tell a judge what to find,** and never hand one judge another's ledger.
- **Never stop a process by name or by pattern,** or start a browser other than through the kit's
  scripts or the project's own driver: three at once, at most.
- **Never ask two things at once,** and never stamp while a fix is out.
