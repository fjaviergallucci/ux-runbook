# The final review — the whole branch, once

Branch `v2-pipeline`, head `94f0066`, base `e01d00c`. Read-only: no file of the kit was changed, and
`git status` is clean after the review. Paths are from the kit's root. Probes were run in
`/tmp/claude-1000/fr/`, never in the kit. The whole suite was run once: **881 tests, 880 pass, 1 skipped,
0 fail, 238 s**.

## 1. Verdict

**Ready for a proving run once the fix wave is done, on one condition: G1 is in the wave.** The kit agrees
with itself far more than a build of 21 separately reviewed tasks usually does: the state script, the
blind merge, the outside-model script and its tests, the formats the scripts pass each other and the carry
chain from Frame to Acceptance all held under probing, and the three rules are kept almost everywhere by
construction and not only by a sentence. What the whole shows that no task could: one path by which a
brief can leave the machine with no yes in the profile (G1), three places where something one stage
promises never reaches the seat that would have to act on it (G2, G6, G10), and a kit that has only ever
met a build that opens as files (G3, G4). **The single biggest risk in the proving run is stage 9.** A real
product runs on a server and signs in, so Acceptance stops unless the project already keeps a browser
script of its own; the kit never says what that script must do, and says nothing about it until the
build is finished. With that, the checks see only what a page draws (R183), and the guide's build loop
has never been followed by anyone. Everything before Handoff has been run once; everything after it has
been run only on a copy of the prototype.

## 2. Findings

One Critical, eight Important, twelve Minor. Every one rests on text I read or a probe I ran.

### G1 · Critical · the screen generator's seat is never told whether its outside tool is turned on

- **Where:** `pool/makers/screen-generator.md:23-24` and `:84-91`; `skills/structure/references/seats.md:70-85`;
  `skills/look/references/seats.md:102-116`; `skills/look/references/fresh.md:47-49` and `:64`;
  `templates/briefs/maker.md:16-25`; `skills/design/SKILL.md:17`; `skills/design/references/loop.md:139`.
- **What is wrong.** The card says "The brief leaves the machine, so the seat is off unless the project's
  profile lists `tool:stitch` in `engines-on`", and, under "Without the tool", "The seat still sits. A
  Claude maker writes the same one or two screens as free HTML". So with a fresh pass cast and the tool
  **not** turned on, a sub-agent is still started in this seat. It is "handed the fresh brief alone"
  (both seats pages). No seat is ever handed the project profile (`skills/design/SKILL.md:17`), the
  maker's brief template has a line for six kinds of maker and none for this one, and no skill or seats
  page tells the conductor to write into the brief whether the tool is on. The seat is started as a
  `general-purpose` agent (`loop.md:139`), which has every tool the session lists, a hosted screen
  generator among them where one is installed (it is on this machine). The card it reads first opens "You
  drive a tool that makes a whole screen from words". Nothing it may read says which of its card's two
  cases it is in. The conductor knows (`fresh.md:47-49`: "without its tool, the screen generator's seat
  is taken by a Claude maker, as its card says") and is never asked to say so.
- **Why it is Critical.** It is the one path in the kit by which a brief can go to an outside provider
  without the founder's yes in the profile. `scripts/describe.mjs` refuses by itself when `engines-on`
  does not list its provider; this path has no script and, as written, no sentence. The founder was told
  at the brief's stop that no seat sends it out. The dry run cast no fresh pass, so it was never met.
- **Fix.** (1) `templates/briefs/maker.md`: a line for the screen generator — "its engine, as the project
  profile has it: on, or off; when off: the tool is not turned on in this project, work as your card's
  'Without the tool' says and call no outside tool". (2) Both seats pages: the brief carries that line,
  from `engines-on`. (3) The card: "Your brief says whether the tool is on. If it does not say, it is
  off." (4) A pin in `tests/pool.test.mjs` and `tests/skills.test.mjs` for the three sentences.

### G2 · Important · what Structure's readers found on the chosen structure never reaches a maker at Detail

- **Where:** `templates/package/04-structure/CHOSEN.md:35-36`; `skills/structure/references/rounds.md:44-45`;
  `skills/detail/references/seats.md:29-31`; `skills/detail/SKILL.md:121-124`;
  `templates/package/05-detail/DETAIL.md:94`.
- **What is wrong.** Structure promises: "each finding on the chosen structure that is still open, with
  its seat: Detail answers each" and, after a graft, "open, for Detail to close". At a pick nothing is
  mended, so a finding marked `blocks` on the picked letter is open by design. But every maker's brief at
  Detail lists under "Do not open" "`<package>/04-structure/CHOSEN.md`, which says who made which letter"
  and "everything in `<package>/04-structure/` but `<chosen>` and its pictures", which takes in
  `04-structure/reads/`. No hand-over at Detail names those findings. Then step 9 has the conductor write
  "each finding fixed or open with the reason, those Structure carried on the chosen structure among
  them, answered one by one". The session that may not judge is the only one that has read them, and it
  must say whether the detail answered each.
- **Evidence beyond the text.** The dry run met it (`dryrun-notes/detail.md`, note 43: "Structure's promise
  to Detail has no step ... Look inherits them unanswered", fifteen findings). The fix for F80 gave the
  answers a place in the template and in step 9; it did not give the findings to a maker.
- **Fix.** The interaction designer's brief hands it "What the readers found" of `CHOSEN.md` by the file
  and the heading, as "Accepted deviations" is handed to a judge, and its reply says in one line how each
  was answered or why it stays open; one on a string goes to the writer the same way. The conductor
  copies those lines. `skills/detail/references/seats.md` and step 3 and step 9 of the skill change; the
  "Do not open" line keeps the rest of `CHOSEN.md` closed.

### G3 · Important · a build that runs on a server: the stop is found at stage 9, and the project's script has no contract

- **Where:** `skills/setup/SKILL.md:61-62`; `skills/acceptance/SKILL.md:88-92`;
  `skills/acceptance/references/driving.md:22-31` and `:77-109`; `templates/project/PROFILE.md` ("How a
  browser check is run here").
- **What is wrong.** Setup says of a project with no browser script: it "reads 'no script': Acceptance
  then writes one, on his yes, for a build that opens as files." For any other build, Acceptance says
  "the kit can write none: say so to him, open, and stop" (R189, and rightly so: no session writes code
  that signs in). So in a project whose product runs on a server, the design goes through eight stages
  and a build before anyone learns that stage 9 cannot start. And what the project's own script must do
  is written nowhere as the project's to read: it is steps 2 to 9 of "A state" in `driving.md`, addressed
  to the conductor, in a file no builder is handed.
- **Fix.** (1) Setup, at its gate, when `browser-check` is "no script" and the product does not open as
  files: say that Acceptance will stop until the project keeps such a script, and ask nothing more. (2)
  Frame lists it under "Engines missing", with the day. (3) The profile template's "How a browser check
  is run here" gets the contract in six lines: reach a state as its row of the state map says; set the
  width, the theme, reduced motion; evaluate `accept-inpage.js`; call `window.__uxAccept(checks)`; write
  what comes back as it came; take the picture under the page's name; print no address and no sign-in.
  (4) `reference/IMPLEMENTER-GUIDE.md` says the same to the builder, who is the one best placed to write
  it. No step has a kit session write it.

### G4 · Important · a correction assumes a screen that opens as a file

- **Where:** `skills/detail/references/correction.md:27-37`; `skills/acceptance/references/forms.md:52-53`.
- **What is wrong.** The picture he nods at is made so: "The plain way is two static copies of that
  screen, `before.html` and `after.html`". In a product drawn by components on a server there is no file
  to copy, and the page gives no other way: Context's read of a surface as it is has one ("ask the
  founder for pictures of it"), a correction has none. A session will hand-write a page that looks like
  the screen, and he nods at a picture of something that is not his product. At the other end the build
  is photographed "through the driver", which G3 says may not exist. The cheapest route is the one most
  likely to be improvised or skipped in a real project, which is the first anti-goal of § 2.
- **Fix.** `correction.md`: where the screen does not open as a file, the picture before is taken by the
  project's own browser script, or asked of him; the picture after is the same picture with the one
  thing changed, taken after the change is made on a branch and before it is kept, or the change is
  shown as "is → becomes" in words beside the picture before, and he is told which. `forms.md`: the
  same two ways for the picture as built.

### G5 · Important · installed as the README says, the browser scripts die with a raw stack

- **Where:** `README.md:11-25`; `scripts/lib/browser.mjs:13`; `scripts/accept.mjs:18`.
- **What is wrong.** The README says to install the plugin from the marketplace and then run `npm install`
  "in that folder", the folder cloned. But an installed plugin runs from Claude Code's own copy
  (`~/.claude/plugins/installed_plugins.json` on this machine gives every plugin an `installPath` under
  `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>`), and each skill finds the scripts "two
  directories above this skill's own folder": in that copy, which has no `node_modules` (git ignores it).
- **Probe.** A copy of `scripts/`, `kit/` and `package.json` with no `node_modules`:
  `node scripts/shots.mjs --help` → `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright-core'
  imported from .../scripts/lib/browser.mjs`, exit 1. The same for `shots` on a page and for
  `accept.mjs inpage`, which needs no browser. `state`, `merge`, `render`, `page`, `card`, `alone` and
  `describe` run. So setup's browser check, every picture and every check fail on a stranger's machine,
  with a stack and no word of what to do.
- **Fix.** (1) Import `playwright-core` where a browser is started, not at the top of the library, and
  refuse in one line: it is not installed in `<kit root>`, run `npm install` there. `--help`, `accept
  inpage` and `accept report` then need nothing (this also closes the deferred minor of Task 7, M14).
  (2) README: `npm install` is run in the kit's root as installed, and say how to find it; or say that
  the kit is used with `--plugin-dir` until it is published with its dependency. (3) Setup's browser
  check: that refusal goes to the founder as it is printed. I did not install the plugin to see the
  copy made: check that once in the wave.

### G6 · Important · "The measure" of the intent is approved, carried, and never built

- **Where:** `skills/intent/SKILL.md:107-108`; `templates/package/02-intent.md:72-74`;
  `skills/cast/SKILL.md:162-163`; `skills/handoff/references/folder.md:20-21`.
- **What is wrong.** Intent writes "the event that will say it worked, by the name the project's analytics
  gives it, or the one to add", and he approves it. Cast carries "every section of the intent". Handoff's
  table of what the carry list hands it names four sections of the intent ("The person in the moment",
  "The one job", "Success criteria", "States") and the readers' findings. No skill, seats page, card or
  template after Intent names "The measure" (searched: `skills/`, `templates/`, `pool/`, `reference/`).
  The interaction designer is not asked when the event fires, `SPEC.md` has no row for it, no slice
  builds it, no check or hand looks for it. A builder who asks nothing and guesses nothing ships a design
  whose success cannot be told. "The feeling" has the same fate in a smaller way: no card's method names
  it, and the one seat it would steer, the visual designer, is not handed the intent.
- **Fix.** The interaction designer writes, under "Rules", when the event fires and with what; `folder.md`
  adds "The measure" to the intent's row, into `SPEC.md` and the slice that holds its trigger;
  `ACCEPTANCE.md` gets it as a check made by hand ("the event is sent once, on …"). "The feeling" goes to
  the visual designer's brief word for word, as each "without scrolling" criterion already does. A test
  worth adding: every `##` heading of a stage's template is named by a later skill, seats page or
  template, or is on a short list of headings that are the founder's alone.

### G7 · Important · the stamp passes an output that holds none of his words, and the template's own instructions

- **Where:** `scripts/lib/state.mjs:140-167` (`stamp`); `skills/design/SKILL.md:40-41`.
- **What is wrong.** Rule 2 of the conductor: "In his words, under `## Reviewed by the founder`, before the
  stamp. An approval that is only in the chat is not one." The stamp takes `--words` and reads the
  header, `built-from` and the carry list. It does not look at the body.
- **Probe.** A package sized `correction`: each of the four templates copied as it is, every
  `{instruction in braces}` and the template's comment still in it, nothing under "Reviewed by the
  founder", only `built-from` written. `begin`, `await`, `stamp` for frame, detail, handoff and
  acceptance all succeeded; `next` printed `none` and `validate` printed `ok`. A design is "done" on disk
  with four empty pages.
- **Fix.** `stamp` (and `validate` for an approved stage) refuses an output whose "Reviewed by the
  founder" section is missing or holds nothing but an instruction in braces — the rule R138 already wrote
  for setup — and one that still holds a line that is only `{…}` or the template's opening comment. The
  short forms pass: they write "Unchanged by this correction" under each heading. Fixtures of the evals
  that were stamped earlier must still validate: check them in the same change.

### G8 · Important · one seat is told to drive a browser with a script of its own

- **Where:** `pool/makers/visual-designer.md:53-57`; `skills/look/SKILL.md:58` and `:108-110`.
- **What is wrong.** "For the rest, read the computed value in the browser with a script of your own, kept
  with its readings in the folder your brief names for them." Nothing says how that browser is started:
  not through `scripts/lib/browser.mjs`, not headless, not with reduced motion set. § 18 and the plan's
  constraint ("headless, launched and closed by the script, `reducedMotion: 'reduce'` set explicitly on
  every context") hold for every script of the kit and for Acceptance's driver, which is written on the
  library by rule; this is the one browser the kit asks for and does not govern. On a shared machine it
  is also the one most likely to be started with whatever the sub-agent has at hand.
- **Fix.** With R185 (below): give `accept` the two check types that cover most of "the rest", then the
  card says that anything still unmeasured is read by a script written on `scripts/lib/browser.mjs`, as
  Acceptance's driver is, and Look's skill says the same of `measure/`.

### G9 · Important · nobody looks whether the project's tokens moved since the kit copied them

- **Where:** `skills/setup/references/project-kit.md:6-7` and `:67-69`; design § 25, amendment 1;
  `skills/handoff/references/folder.md:52-57`.
- **What is wrong.** "The copy goes stale when the tokens change. Then it is copied or exported again".
  Setup runs once. No step of Frame, Context, Structure, Look or Handoff compares the commit on the
  first line of `<kit dir>/tokens.css` with the project's token file as it stands; that first line is
  written and never read. At Handoff the folder gets the kit's copy as `tokens.css` while `PARTS.md`
  records "the commit that last changed" the project's own file: two facts about two different files,
  side by side, with nothing to say they differ. The final screens, their measured contrasts and the
  builder's reference pictures then rest on tokens the product no longer has.
- **Fix.** One step, at Frame (it already reads the project profile) and again at step 2 of Look: read
  the first line of the kit's token copy, ask the project's history for the last commit of the file it
  names, and where they differ tell the founder and run setup's steps 5 and 6 again before anything is
  drawn. Handoff refuses to write `PARTS.md` while the two differ.

### G10 · Minor · a judge blocks on the sibling surfaces, and no maker is handed them

`pool/judges/system-fidelity.md:37-40` and `:71-72` ("*Blocks*: ... a pattern unlike the one the sibling
surfaces use"); `skills/look/references/seats.md:47-51` (the visual designer's hand-over: no sibling
surface) and `:189-193` (the judge's: "The sibling surfaces, by the paths the carry list names for them");
`skills/detail/references/seats.md` hands them to no maker either, though "the blind on today's screen ends
at his pick ... Detail may open it" (`skills/structure/references/seats.md:13`). Where the primary action
sits and how a dialog closes are decided at Detail and drawn at Look by seats that never saw a sibling,
then blocked at Look, where "a finding on a string, a state or a rule is not Look's to fix". The one fix
round is spent on something the kit could have handed over. Fix: hand the sibling surfaces to the
interaction designer and the visual designer (add `sibling-surfaces` to both cards' `reads`).

### G11 · Minor · "the makers' notes" means two things, and the two sentences disagree

`skills/design/references/loop.md:102`: "Each judge is blind to the others' ledgers, to the makers' notes
and to the author map." `skills/structure/references/seats.md:115-116`: "The judges read the pages with
the notes: the bet, the cost, what a letter is deliberately bad at, and the notes on its screens and
items." Every judge's card ends "Never open a maker's notes". A judge at Structure is handed a page that
shows them. The rule is sound (R171: what is in the proposal is the proposal); the word is used for the
proposal's own account and for what a maker left in `work/`. Fix: at Structure call the first "the
proposal's own account"; keep "a maker's notes" for the second.

### G12 · Minor · the merge's refusals say "delete" where the kit says never delete

`scripts/lib/merge.mjs:141` ("delete it on purpose first") and `:166` ("To rebuild it, delete the map and
the board on purpose first"), `scripts/merge.mjs:21`; against `skills/design/references/blind.md:126-132`:
"a board is never deleted ... Where the script's refusal says to delete, move." The skill apologises for
the script. Fix the three sentences: "move it into `earlier/<n>/` first".

### G13 · Minor · a file named like a letter, in any folder above the project, refuses every merge

Deferred at Task 5; promoted because it can stop a real project for a file the kit has nothing to do with.
Probe: `/tmp/claude-1000/fr/above/Q.json`, and a merge into
`above/proj/design/today/04-structure/board` → "cannot merge ...: /tmp/claude-1000/fr/above above it holds
letter files, so it is a board; a board is never made inside another", exit 1. The climb goes to the top
of the file system (`scripts/lib/merge.mjs:147-152`). No such file lies above the likely proving project
today. Fix: a folder counts as a board only when a `MAP.sealed.json` lies beside it, or climb no higher
than the folder that holds `state.json`.

### G14 · Minor · on the decision page, the third option is cut and the fourth is off the screen

Deferred at Task 6; promoted because the page is where he picks. `scripts/page.mjs:280-281`: one row,
`overflow-x: auto`, each option `width: min(27rem, 100%)`. Three options need 1328 px before the page's
own margins; four (a system-sized design, or one more letter from a fresh pass) put the last one out of
sight on most laptops, found only by scrolling that row sideways. An option he does not see is not
picked, and it is always the last letter. Fix: let the row wrap (`display: grid; grid-template-columns:
repeat(auto-fit, minmax(20rem, 1fr))`), the gallery's row too.

### G15 · Minor · "stage n of m" is counted two ways

`skills/detail/SKILL.md:129` ("at stage 6 of 9"), Look 7, Handoff 8, Acceptance 9, whatever the route;
`skills/detail/references/correction.md:44`: "at the stage its route has it at: 2 of 4". An adjustment
skips Structure: 6 of 9 by one rule, 5 of 8 by the other. Structure's skill gives no number at all. Fix:
one sentence in `loop.md`, step 7: n and m count the stages the route runs; each skill says "as the loop
counts it".

### G16 · Minor · a stage can be begun and put to him before the gates before it, and `validate` says `ok`

Probe, a package sized `surface`: frame stamped; `begin detail` → "detail is in work"; `DETAIL.md` with
`built-from: [frame@1]`; `await detail --question "Do you approve this prototype for Look?"` → "detail
awaits the founder"; `validate` → `ok`; `next` → `context`. Only the stamp refuses.
`skills/structure/references/rounds.md:79` already warns "The script would let you begin it now. Do not".
§ 18: "Nothing is shortlisted, detailed or drawn finished before the gate that precedes it." Fix: `begin`
and `await` refuse a stage while a stage before it on the route is not approved; the warning in
`rounds.md` goes. The flows of `rounds.md` and `deviations.md` still pass: both reopen before they begin.

### G17 · Minor · a `source:` line of a carry list is never looked for

`skills/design/references/loop.md:265-267`: the stamp "refuses ... a carry list that names what is not
there". `scripts/lib/carry.mjs:36`: `if (SOURCE_ENTRY.test(line)) continue;`, and its header says a source
"is accepted without resolving". A stage is handed its pictures, its ledgers and its prototype by such
lines. Fix: resolve each from the folder the command is run in, which every skill says is the project's
root, and refuse one that is not there; or make the sentence true.

### G18 · Minor · a packages folder other than `design/` cannot be found from disk

`skills/design/SKILL.md:49-51`: "The project profile is in the folder that holds its packages: `design/`
at the project's root, unless the project chose another." Which other is written in `packages:` of the
profile, which lies in that folder. A cold session that finds no `design/PROFILE.md` runs setup again and
asks him what he already answered. Fix: the conductor looks for a `PROFILE.md` whose header holds
`packages:` and `engines-on:` before it calls a project not set up.

### G19 · Minor · the outside describer's file at Look has two names

`pool/makers/outside-describer.md:58`: `--out <fresh pass folder>/<name>.md`;
`skills/look/references/fresh.md:70` and `:82`, `skills/look/references/seats.md:129`: `fresh/<name>.html`,
which the picture script then opens. The card "speaks to" the conductor and is read "before the first
run". Fix the card (its pin in `tests/pool.test.mjs:961` moves with it).

### G20 · Minor · a profession's name outside `docs/`

`tests/state.test.mjs:146`, `:147`, `:1477`: the kind `radiology-shell`. The name test reads
`tests/fixtures/` only, so it does not see it. Rename it (`booking-shell`).

### G21 · Minor · what a seat's line on the decision page holds is not said

`skills/design/references/loop.md:211-217` and `skills/structure/SKILL.md:127-135`: "one line for each
seat". `scripts/page.mjs` takes one line for each seat and option. A ledger's top line is one verdict for
the whole artefact; at Structure there are three or four options. The conductor writes the line, so it
chooses what of a ledger he reads at the pick. Fix: say it once in `loop.md`: the line is quoted from the
ledger — its verdict and first fix; at Structure, for each letter, its ranking place where the seat ranks
and its most severe finding on that letter, in the seat's words.

## 3. The two walks

Read as a session with no memory of the build: the conductor, the loop, then each stage's skill and its
references, with every script's `--help` beside it. The state script was driven through both routes in
scratch.

**A design sized `surface`, on the full route** (a new surface, a design system, one profession).

- *Setup, Frame, Context, Intent, Cast:* no stop that the skills do not name. Two things are asked of him
  with no `await`: the offer of the profile judge at Intent, and (rightly, since nothing is on disk yet)
  Frame's one question. A session that resumes at Intent cannot tell "offered, and he said no" from "not
  yet offered": only a yes is written. One guess: G18.
- *Structure:* runs as written. The commands of step 7 produce exactly the names the seats page hands out
  (probed: `A.html`, `A-screens.html`, `A-390-light.png`, `A-screens-390-light-first.png`); the page for
  the audience holds no name, bet, cost or note (probed against a letter's own file); the map does not
  open before `PICK.md`, nor for a `Pick:` line that names more than a letter. Guesses: the number in the
  identity line (G15), each seat's line (G21). A fork of words: G11.
- *Detail:* the first real hole, G2. The lists a maker returns go to him as one question each, with an
  `await` and a `begin`; a session that resumes on an open question has to tell from its wording whether
  the gate asked it or step 4 did, since `await` keeps no step. Workable; not checked by anything.
- *Look:* runs as written inside a design system. One browser outside the library (G8). The task reader's
  card sits at `look`, and step 7 starts "the judges" only: an audience he added to the Look table at
  Cast, with no fresh pass, would be on the sheet and never started.
- *Handoff:* runs as written. "The measure" stops here (G6); the kit's token copy is taken on trust (G9).
- *Acceptance:* stops at step 3 in a project that runs on a server and keeps no script (G3). Where there
  is a script, the walk is sound: one state at a time, results as they came, the table by the script.
  An accepted deviation changes files of a stamped folder without a reopening, unless `HANDOFF.md`
  itself names the thing: that is where R184 will bite (section 4).

**A design sized `correction`.**

- *The state:* the route works end to end (probed: frame, detail, handoff, acceptance stamped in order,
  `built-from` as each page gives it, `next` → `none`). It also works with every page empty (G7).
- *Frame:* states its line, asks nothing, makes the package at once. Sound, and what the evaluation asks.
- *Detail:* the session must read the project's source to find the screen, which Frame forbade it a
  moment earlier and Context, skipped, never did; nothing says so, though it is plainly meant. Then G4:
  no way to the picture where the screen is not a file.
- *Handoff:* one paragraph, no question, stamped in the words of the nod. Sound.
- *Acceptance:* the session that made the change compares two pictures "by eye" and stamps in the words
  of a nod given before the change existed. That is the design's own exception and is said three times;
  it stands or falls with the picture, so G4 matters twice.
- *What it costs:* one nod for him, as promised. For the session: four outputs from four templates, four
  entries in `DECISIONS.md`, a decision page, a lessons line, about a dozen state commands. Not a finding,
  since he is asked once; worth watching in the proving run against the first anti-goal.

## 4. The fix wave

**The findings above:** G1 to G9 in the wave. Of the Minor: G10 with G2 (same pages); G12, G15, G19, G20
are one line each; G13, G14, G16, G17 are small code changes with a test each; G11, G18, G21 are wording.

**The parked findings.**

| Ruling | What | Verdict |
|---|---|---|
| R39 | the stale chain stops at a skipped stage | **Fix as decided:** a skip keeps `builtFrom`; the cascade passes through stages that are not approved without changing them. |
| R84 | a page written to defeat the picture's mark | **Drop:** every page the kit pictures is drawn by its own scripts or makers, and a fresh screen is shown "as it came" whatever it shows. |
| R108 | `in-viewport` on a shape inside a scaled `svg` | **Fix differently:** no code in this wave. One sentence in `accept --help` under `in-viewport`, and in the visual designer's card: the element that answers "without scrolling" is never a shape inside an `svg`. |
| R109 | a label inside a pill-shaped clip gets `cannot be told:` | **Fix as decided** (the radii as CSS computes them). Pills are in most real design systems, and since R190 this check is the only answer to "without scrolling". Copy the in-page file again into the eval fixture that holds it. |
| R132 | a mount's leftover file in a board | **Fix as decided,** in `merge` and in the tests that list a folder after a removal. Probed: `.fuse_hidden0002` in an empty board folder → "the folder is not empty", exit 1. The kit and the likely proving project both lie on such a mount; `deal` already passes them over. |
| R184 | a stamp guards every file of the stage's folder | **Fix as decided, with three things it needs:** (1) text files hashed with line endings made one, as the output's body is, pictures by their bytes; (2) a stage stamped before this, with no list of files on record, is held to its output alone, so that the evals' fixtures still validate; (3) `skills/acceptance/references/deviations.md`: an accepted deviation always reopens Handoff before any file of `07-handoff/` is changed, once for the batch — today it does so only "when `HANDOFF.md` names what changed" (`:35`), and step 3 (`:22-30`) would turn every acceptance into `changed-since-approval`. With it: `reopen` names the stages it recalled; the leftovers of R132 are passed over. |
| R185 | a check for sizes, gaps and line lengths | **Fix differently, smaller:** two types only — `style` (one computed property of one id, as `font-size`) and `gap` (the distance between two ids on one axis). Line length stays "measured by a person". Then G8: the card and Look's skill drop "a script of your own", or name the library. |

**The deferred minors, by file.** 46 places in the ledger hold one or more. Fix 8, one goes into R185,
drop 37.

| File | Fix | Drop |
|---|---|---|
| `scripts/lib/state.mjs`, its tests | the one note slot: a cascade's reason overwrites a route's, and stays after the stage is approved again (with R39 and R184, same code); a test that `route` leaves an open question open | its length; the `since: null` test |
| `scripts/lib/frontmatter.mjs` | the header comment omits two refusals (one line) | — |
| `scripts/lib/merge.mjs` | the every-folder-above rule (G13) | the rename on Windows; the staging folder after a kill; the two-merges race; the unlistable folder and the case-blind path |
| `scripts/page.mjs` | the options' row (G14) | the one-sentence rule's three misses; `plural` twice |
| `scripts/accept.mjs`, `scripts/inpage/accept-inpage.js` | `inpage` and `report` load the browser library for nothing (with G5) | M1, M5, M6, M13, M14's split, what `visible` passes; N15, N16; the double report; N19 to N22 |
| `scripts/shots.mjs`, `scripts/lib/browser.mjs` | — | everything listed: each is an error worded oddly, a cost in time, or a case on Windows; two are already said in `--help` |
| `scripts/render.mjs`, `scripts/lib/walkthrough.mjs`, `kit/` | — | all: a symlinked `--out` and a proposal named like a stylesheet are reached by no step of any skill; the specimen's words were replaced by R161 |
| `scripts/describe.mjs` | — | all: the answer's size, the dotenv comment, N1 to N4; "`--brief` and `--out` the same file" is already refused |
| `pool/audiences/task-reader.md` | pin the three restored sentences of its method: a cut for length removed them once, and this card is the blind | — |
| `skills/cast/references/presets.md` | "the judges that read it before" names Detail and Look only: say "at any earlier stage" | Cast's example line `- context@1#the-people`: the stamp refuses a wrong version |
| `scripts/card.mjs`, the command reader of `tests/skills.test.mjs` | — | the unpinned "is not opened"; the single-quoted parenthesis; the device-and-inode comparison (see "Not checked") |
| `evals/` | — | the four grader patterns and the three fixtures with old column names, until the suite is next run and paid for |
| `.claude-plugin/`, `README.md`, `package.json`, the plan | — | the icon; the README's old links (rewritten at Task 19); the test glob on Windows; the plan's stale Task 0; Node 20.6 (the package now says 20.10) |
| Task 17, M2 | goes into R185 | — |

**The two follow-ups.** Both can wait for the proving run. R182 (a script for Handoff's mechanical part):
what it should hold depends on a real project's strings and build, and its absence costs time, not truth.
R183 (checks of behaviour): the decision page already says what the checks do not see, and the keyboard
pass by hand stands beside them; new check types need a driver that presses keys, which G3 must settle
first.

## 5. Sound, and not checked

**Sound.**

- **Keys and providers.** `scripts/describe.mjs` reads the profile first and refuses an engine that is
  off; finds the key by name; sends it in a header only; follows no redirect; shows no error body; passes
  everything it prints through a filter of the keys it found. Its tests never reach a provider: every run
  is handed a server on this machine, the one run without an endpoint is given an empty environment and a
  missing brief, and every child process gets the environment without the two names. No skill puts a key
  or a keys file on a command line; setup, Context, Handoff and Acceptance each pass over a credentials
  file unopened and stop on a credential found.
- **Browsers.** Only `scripts/lib/browser.mjs` imports the browser library among the scripts; it starts
  headless, sets reduced motion on every context, and stops only its own server handle. No script and no
  page of the kit stops a process by name. The one exception to "through the library" is G8.
- **The scripts as one program.** Exit codes are 0, 1, 2 with one meaning throughout. Board → pages →
  pictures → decision page agree on names; the acceptance file's keys are those the skills write; the
  results of `prototype` and of a build's driver join in `report`. Each `--help` I compared with its
  behaviour was true, but for G12.
- **The blind.** Letters carry no author, engine, track or model; the audience's page carries no bet, cost
  or note; the map opens only on a written pick.
- **The carry chain.** `built-from` and the carry lists the skills ask for are accepted by the stamp at
  every stage of the surface, adjustment and correction routes as written.
- **The README's counts:** eleven skills, eight makers, eight judges, one audience, five people, nine
  evaluation cases. Nothing of version 1 is left in the tree outside `docs/`.
- **Generic:** no product, person or profession named outside `docs/`, but for G20.
- **The suite:** 880 of 881 pass, one skipped.

**Not checked.**

- `skills/look/references/direction.md`, the second half of `fresh.md` and of
  `skills/handoff/references/folder.md`, `skills/handoff/references/seats.md`,
  `skills/setup/references/project-kit.md` beyond the tokens.
- The cards of the words, truth, profile and cold-implementer judges, the transcriber, the interface
  writer, the structure describer and the five people, beyond what a finding quotes; `pool/CARD-FORMAT.md`,
  `pool/INDEX.md`, `pool/MODELS.md`, `kit/KIT-CONTRACT.md`; most templates beyond their headings.
- The insides of `accept-inpage.js`, `shots.mjs`, `alone.mjs`, `deal.mjs`, `card.mjs`, `render.mjs`:
  run, not read line by line.
- The tests, beyond the head of `describe.test.mjs`, the name test and the pins a finding touches. They
  pin sentences, so no test can see a hole that two true sentences leave between them: G1, G2 and G6 are
  all of that kind. The test proposed under G6 is the one I would add.
- The adjustment and flow routes were read, not walked. No fresh pass, direction, graft or rejected round
  was walked.
- `claude plugin validate` and the evaluations were not run; the plugin was not installed (G5 rests on the
  probe and on this machine's own record of installed plugins).
- Windows and macOS. One deferred minor could matter there and I could not test it: `render`, `page` and
  `describe` compare files by device and inode, and a file system that reports the same pair for every
  file would refuse every `--out` that exists.
- `scripts/describe.mjs` was run with `--help` only, as the brief requires.
