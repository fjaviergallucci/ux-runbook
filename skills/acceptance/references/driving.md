# Driving the build: the states, the checks, the pictures

The long form of steps 3, 4 and 5 of the skill. In the prototype every state is a page. In a build a
state sits behind a sign-in, data and network conditions that only the builder knows: so the checks
say nothing of how to get there, and the builder's state map does. `<kit root>` and `<package>` are
as the skill gives them, and "the driver" is the project's own way of driving a browser, as "How a
browser check is run here" of the project profile gives it.

## Before the first state

- **The build runs the way `BUILD.md` says.** Start it by its commands, and see that it answers
  before you judge anything: a blank page is usually a server that is not running. What you start,
  you stop yourself, through your own handle, when the stage ends.
- **The driver is the project's.** Headless, with reduced motion set. The kit's picture script and
  its `prototype` command open files: they are not for a build that needs a session or a server. For
  a build that opens as files they are not forbidden.
- **One browser, one state at a time.** Never more than three browsers at once on the machine, the
  kit's scripts and the seats counted, and no process is ever stopped by its name or by a pattern.

## When the project keeps no driver

The kit can write a driver only for a build that opens as files: its browser library,
`scripts/lib/browser.mjs`, opens local files and nothing else. This section is for that case alone.
"How a browser check is run here" of the project profile may name a way of looking and no script:
"no script" is an answer at setup. Then nothing drives the build yet.

**A build that needs a server or a sign-in has no driver the kit can write.** Say so to the founder,
open: this build cannot be driven until the project has a script of its own for a browser check,
named in the project profile. Then stop, as step 2 of the skill stops on a credential. You write no
script that starts a server, opens an address or signs in, and none that takes a sign-in from where
it is kept.

**For a build that opens as files,** say so to the founder, and ask one thing: may you write the
project's driver, at the path you name? Name the path in the question: where the project keeps its
scripts, as its own documents show. Record the question with the `await` of the skill's gate, and
put the stage back in work with the `begin` of step 1 once he has answered. His answer is written
under "Reviewed by the founder" of `REPORT.md`, as he said it, before the driver is written. On his
yes, and never before:

- **One script, in the project,** at the path of his answer. It is the project's from then on: it is
  no file of the package, and you write nothing else of the build.
- **On the kit's browser library,** `scripts/lib/browser.mjs`, with `scripts/lib/chrome.mjs`, which
  finds the machine's own Chrome. The library starts and stops its own browser, one at a time,
  headless, with reduced motion set. Its header is its contract: read it, and use only what it gives.
- **For each state, the driver does five things:** it opens the state's file, as its row of
  `STATES.md` names it, at the group's width and in its theme; it evaluates the in-page file; it
  calls `window.__uxAccept` with the group's checks; it writes what comes back, as it came; and it
  takes the picture. Steps 2 to 9 of "A state", below, are what it runs.
- **It holds no sign-in, and makes none.** A build that opens as files asks for none: no password,
  token or key is written in it, read by it, printed by it, or passed to it on a command line.
- **Its command goes into the project profile,** under "How a browser check is run here", once he
  has seen the line: the next acceptance finds a driver there.

The library keeps what a visit returned only while the document that was loaded is still in the tab.
A key that sends the page elsewhere loses its value by design: read where it went from what the
visit says of the page, and write that.

## Accounts, data and secrets

- **An account is named by its role,** as "the front-desk account of the test clinic", and
  `STATES.md` or the project profile says where its sign-in is kept. The project's own driver takes
  the sign-in from there: a driver you wrote opens files, and signs in nowhere. You never read it
  out, type it on a command line, print it, or write it anywhere.
- **Nothing that signs in is written down.** Not in a results file, a picture's name, a brief, the
  report or `by-hand.md`. Where a sign-in rides in an address, as a ticket or a token in its query,
  the address is written as its route, without the query, and the driver is not asked to print the
  address it opened.
- **A credential found in a file** (in `STATES.md`, in `BUILD.md`, in a results file) is not copied
  and not repeated: tell the founder which file and which line, say that it is exposed and should be
  changed, and stop until the file no longer holds it.
- **Seeded or test data only.** A state is driven on the data `STATES.md` seeds. If a picture or a
  result would show a real person's data, it is not taken: the row of the report says "not pictured:
  real data", and the state's checks show as not run, with that reason.
- **Never open a keys file,** and never print the environment, to find out why a sign-in failed.
  Tell him what the driver said, as it said it.

## A state: reach it, check it, photograph it

`ACCEPTANCE.md` lists the states to drive, each with its page of `prototype/`. `acceptance.json`
holds the checks: each names its `state`, its `width`, its `theme` when it is not light, and may
name a `language` and a `screen`. For one state:

1. **Group its checks by width and theme.** The state is put on screen once for each group.
2. **Set the screen as the check was written:** the group's width, 900 px high, as on the prototype;
   its theme, by the browser's colour scheme; reduced motion; and the language its checks name, set
   the way `BUILD.md` says the build takes a language.
3. **Reach the state by its row of `STATES.md`,** step by step, in order: the address, the seed
   step, the network condition, the account. Do what the row says, and no more. A row that does not
   lead to the state is the builder's to correct: say which, and leave its checks not run. A row
   that says the build only draws the state, and cannot do what the state does, is not sent back:
   its checks are run on what is drawn, and what is missing is a deviation, written as one.
4. **Stay at the top of the page.** Do not scroll before the checks: `in-viewport` asks about the
   first screen, and an element that sticks is misjudged after a scroll.
5. **Evaluate the in-page file.** `node <kit root>/scripts/accept.mjs inpage` prints its absolute
   path. Read its text, and evaluate it in the page through the driver, as a script. It defines
   `window.__uxAccept`, changes nothing on the page, and may be evaluated as often as you like.
6. **Call `window.__uxAccept(checks)`** with the checks of this group, each whole, as
   `acceptance.json` has it. It returns one result for each, in order: `id`, `pass`, `actual`,
   `message`. It never throws: a check that cannot be made is a failed result that says why.
7. **Have the driver write what came back,** as JSON, exactly as it came. One file for each state:
   `<package>/08-acceptance/results/<state>.json`, one list, the results of each of its groups one
   after another. Where two screens have a state of the same name, the file is
   `<screen>-<state>.json`. Nothing is retyped, and no result is corrected.
8. **Read the console,** and write any error or failed request of that state beside its row of the
   report. It is a finding, whatever the checks say.
9. **Photograph the state,** whole, once for each group:
   `<package>/08-acceptance/shots/<page>-<width>-<theme>.png`, `<page>` being the name of the state's
   page in `prototype/` without its extension. The build's picture and the reference picture of the
   same state then carry the same name, in two folders.

A check is run once. When a state is driven again, after a fix or an accepted deviation, its file is
written again, whole: two results for one check are a refusal of the report.

## The table of the checks

```
node <kit root>/scripts/accept.mjs report <package>/08-acceptance/results/<state>.json --checks <package>/07-handoff/acceptance.json --out <package>/08-acceptance/checks.md
```

Name every file of `results/` where the command has one, each as a word of its own. With `--checks`
each result is joined to its check by id, and the table has one row for every check of
`acceptance.json`: the failed first, then those **not run**, then the passed. It prints the count
line, which goes into "The checks" of `REPORT.md` with the table, or with its path when it is long.

- **A result no check has, or two results for one check,** is refused: a file is stale, or a state
  was written twice. Put the files right. Never edit a result.
- **A check not run does not change the exit code,** so read the count, not the code.
- **Every check not run is explained, or run.** Its state could not be reached; its picture would
  show real data; the builder wrote the state down as not built. The reason is written beside its
  id under "The checks". A check not run for no reason you can give goes back to step 4.
- **`cannot be told:` and `cannot be measured:`** in a result's message are not a pass and not a
  deviation: the build left the check unable to answer, as by a picture behind the text. The item
  reads *deviates*, with that message, and he decides it.

## The checks made by hand

`ACCEPTANCE.md` leaves four kinds of thing to a hand: under "Accessibility checks", those no script
makes, each with what holding looks like; under "Measured values", the rows that read "measured by a
person"; under "Success criteria, as checks", the measure: whether its event is sent once, when and
with what the detail's rule says; and what `SPEC.md` holds with no page of its own. You make them through the driver where a
driver can, and you write down what you did and what you saw, never an opinion:
`<package>/08-acceptance/by-hand.md`, one entry for each check and state. A judge may quote that file
as its evidence: an entry says what the driver read on every page it names, never what one picture
suggests of the rest.

- **The keyboard alone.** From the top of the state, press Tab until focus leaves the last stop,
  and write the stable id focus lands on at each press. Then the keys `SPEC.md` gives a meaning:
  Enter, Escape. What holding looks like is the focus order of `SPEC.md`.
- **Text at 200%.** Set the root font size to 200%, and say in the entry what was set: where the
  build sizes its text in pixels that changes nothing, and the page is zoomed in its place, which
  is said too. Photograph the state, and write whether anything is cut off, needs a sideways
  scroll, or breaks a word across lines.
- **A value measured by a person.** Read it through the driver, and write how: what was counted,
  and on which element. A value that differs from the table's on a page that is the approved one
  is said so, with both ways of counting.
- **Reduced motion.** It is set for every state: write what moved all the same.
- **The measure.** Do what sets it off, once, and write whether the event went, how many times, and
  what it carried, as the project's analytics or its log show it: never a person's data.
- **A screen reader,** and anything else no driver can make, is listed as not run, with that reason.
  It is his to make, or to waive in his words.

A criterion `ACCEPTANCE.md` marks as judged by eye is looked at by the one it names, at the picture
it names: a seat of the cast, the task reader where it names a person trying her task, or the
founder. Where it names a language, a reader of that language looks. You do not judge it.
