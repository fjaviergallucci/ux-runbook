# Task 19 — report: the lessons, the README, the evaluation suite

Status: **DONE_WITH_CONCERNS**. Steps 1 to 4, 6 and 7 are done. Step 5, the run, is the controller's
and was not started: no `claude plugin eval .` was run, in any form.

The concerns are at the end. Two of them need a ruling before the run is read:
`correction-is-one-nod` covers only the first of the correction's turns, and `resume-from-disk` asks
for something no skill says outright.

## What I wrote, file by file

| File | What it is |
|---|---|
| `LESSONS.md` | The kit's own lessons. Header: appended, never rewritten; one dated entry for each lesson; only what is true on any project. Eleven entries dated 2026-11-15, one for each lesson the brief lists, each in three parts: what was tried, what happened, what the next design does differently. That is the shape `skills/design/references/lessons.md` gives a project's entry, less what belongs to one design (its name, the founder's words, the cost, the seats table). No product, person or profession is named. |
| `README.md` | Rewritten: what it is, in one paragraph; install, with the two lines as the brief has them and `npm install`; start, `/ux:design`; the nine stages in one table; what it does not do by itself (ruling 6); what is in the repository; when not to use it, carried over from version 1's three cases; version 1; licence. |
| `evals/<case>/` × 9 | `prompt.md`, `graders/*.md`, `case.yaml` and `fixture/`. 228 files, 2.4 MB, of which 18 pictures are 1.6 MB. |
| `tests/evals.test.mjs` | 17 tests, ruling 4: the layout; every path a prompt or a seat's brief names; what `state.mjs validate`, `next` and `status` say of each fixture package; every fixture proposal through `validate`; the two planted faults and the two planted gaps; each grader's pattern tried on what it must catch and what it must let pass; no key, keys file or web address in a fixture. |
| `tests/pool.test.mjs` | The product-name scan now reads `evals/` too (ruling 7), with `.yaml` and `.yml` among the text files, and passes over `evals/results/`, which a run leaves and git ignores. `LESSONS.md` and `README.md` were already on its list; `LESSONS.md` is now among the files it is known to read. |
| `tests/skeleton.test.mjs` | Four tests added: the README's install and start lines against the two manifests; its nine stages against the conductor's own table; every path of its repository table, and its counts, counted; `LESSONS.md`'s header, its eleven entries and their three parts. |

The fixtures were built by a throwaway script that wrote each file from the kit's templates and ran the
kit's own scripts: `state.mjs init`, `begin`, `stamp`, `await`; `merge.mjs`; `render.mjs`; `shots.mjs`;
`page.mjs`; `card.mjs check`; `alone.mjs`; `accept.mjs prototype`. The script is not committed: what
the tests hold is the result.

## What the evaluation tooling showed

Sources: `claude plugin eval --help` and `init --help`; the scaffold; the page "Test plugins with
evals" of the Claude Code documentation; and the authoring guide the CLI carries for `eval init`.
Version 2.1.325.

**The scaffold.** `claude plugin eval init --bare brief-has-no-design` wrote two files and ran nothing:

```
evals/brief-has-no-design/prompt.md             frontmatter: max_turns: 10, allowed_tools: [Read, Glob, Grep, Skill]; body: a TODO line
evals/brief-has-no-design/graders/criteria.md   frontmatter: type: llm, weight: 1; body: a TODO line
```

**The layout.** A case is a folder with `prompt.md` and one grader or more under `graders/`. A
`case.yaml` beside them is optional and is the only place for `context.*`. `prompt.md` frontmatter
takes `max_turns` (default 10), `timeout_seconds` (default 300), `allowed_tools`, `model`, `runs`,
`tags` and a few more; an unknown key is an error.

**What a run is.** Each run is a fresh `claude -p` session with only this plugin loaded, in an
**empty working directory**, and it is sandboxed. Four facts shaped every case:

1. **A run cannot read `evals/`.** The case definitions are hidden from the session, the fixtures
   with them. The one way in is `context.add_dirs` in `case.yaml`: folders inside the case, granted
   read-only. So every case has a `case.yaml`, whose only work is `add_dirs: [fixture]`. This is an
   addition to the layout the scaffold showed, and the tool's own. The other way, a
   `scaffold_script`, runs only with `--scaffold`, which the controller's command does not pass.
2. **No absolute path in a prompt.** The session has to find the fixture itself. Each prompt says
   what every skill of the kit says: the kit's root is two directories above the folder a skill
   reports when it loads. The fixture is then `evals/<case>/fixture/` under it.
3. **Only read-only tools by default.** `Bash`, `Write` and `Edit` need `--allow-tools`, which the
   controller's command gives, and must be in the case's `allowed_tools` too. A granted Bash runs
   in an OS sandbox that can write only in the run's folder. `bwrap` and `socat` are both on this
   machine.
4. **A grader looks at one thing.** `regex` and `llm` take `last_message` (the default), `trace`,
   `files` (the paths the session created, not their contents, and not a file that was there
   before) or `{ source: file, path }`, one file in the run's folder. An `llm` judge on `trace`
   sees only the first twelve and the last twelve messages. `tool_used` counts calls to a tool
   whose JSON input matches a regex; `file_exists` sees created files only. There are no
   custom-code graders.

**What follows for the brief's "one grader".** One `llm` grader cannot see both a file and the
transcript. So each case keeps `graders/criteria.md` as the grader that is judged, looking at the one
thing its sentences are about, and beside it has the free graders that hold what a machine can hold:
a tool not called, a file not created, a pattern in a file. The whole pass condition, as plain
sentences, is in `case.yaml` under `expected_outcome`, a field the tool keeps for people.

**What a run needs.**

- A trust prompt the first time: "Trust this plugin directory?". Without a terminal it needs
  `--trust-plugin`.
- By default each case runs twice, with the plugin and without. Without it a session cannot find
  the kit, so that arm adds cost and tells nothing. `--ablation none` runs one arm.
- The judge is a small model by default. The tool's own guide says to use a larger one:
  `--judge-model sonnet`.
- A score is the weighted share of graders that passed. `criteria.md` has weight 2 wherever a case
  has more than two graders.

## The nine cases

Where a case **copies**, the prompt has the session copy the fixture into its own folder with one
`cp -r`, because the stage writes into the package. Where it works **in place**, the fixture is read
where it lies, and the sandbox makes it read-only.

| Case | Fixture | The prompt asks | Each grader sentence, and what it rests on | Dry read |
|---|---|---|---|---|
| `brief-has-no-design` (copy) | A project set up with no design system; package `design/today` with Frame, Context, Intent and Cast approved. `validate` ok, `next` structure. | Take the design as far as the brief its describers will be sent, and stop where he reads it. | `criteria` (llm, on `design/today/04-structure/BRIEF.md`, above "How to work"): names the person and her moment, the job, the tasks, what the product can show and do; names no component, layout, style, colour or font; proposes nothing. **Rests on** `blind.md`, "Context, never the design": "the person and her moment, the job, the tasks as where she starts and what she wants … what the product can show and do", and its list "A brief may not contain". The path is `structure/SKILL.md` step 3. `no-component-or-layout-named` (regex, not in the file): the words of that list a regex can hold. The test proves it lets the template and a sound brief pass. | The session loads `ux:design`, copies, runs `validate` and `next`, loads `ux:structure`, begins, writes `CHOSEN.md` from its template, then `BRIEF.md`, and stops at step 4. True if the brief keeps the rule. Holds. |
| `fresh-brief-hides-the-system` (copy) | The same intent, in a project whose profile describes a design system, Linen: token file, components, document, a kit drawn on it; a Day sheet that exists today; a sibling convention in the intent. The cast sheet says a fresh pass runs at Structure. | Take it as far as the two briefs he reads, and stop. | `criteria` (llm, on `…/BRIEF-fresh.md`, outside the fixed section "What you are not given" and the format): nothing of the design system, of a kit, of today's screens, of the siblings' conventions; it still says who, the job, the tasks, what the product does. **Rests on** `fresh-pass.md`: "Not given, in either form: the design system, the shared kit, today's screens and navigation, the conventions of the sibling surfaces", and `structure/SKILL.md` step 3. `nothing-planted-is-in-it` (regex, not in the file): `linen`, `day sheet`, `sidebar`, `search field`, `atkinson`, `tokens.css`, `kit.css`. The test proves each is planted and the template passes. | As above, and step 3 writes `BRIEF-fresh.md` too. Holds. |
| `no-pick-without-the-founder` (in place) | The same package at Structure's gate: three proposals, the board merged, drawn and photographed, five reads, `decision.json` and `decision.html`, the map sealed, the state `awaiting` with "Which structure goes on to Detail: A, B or C?". No `PICK.md`. | "Continue the design `today`." | `criteria` (llm, last message): one question, which structure goes on, and nothing else; it does not choose; it says of no letter who made it. **Rests on** the conductor's "Resuming" 3: "If `status` shows an open question, a stage is awaiting the founder. Put that question to him"; its Never: "Never decide for the founder", "Never ask more than one question"; and Structure's gate: "Stop: you do not pick". `no-pick-written`, `no-chosen-written`, `no-detail-begun` (file_exists, false). `no-write-into-the-round`, `no-edit-into-the-round` (no Write or Edit whose `file_path` is `PICK.md`, `CHOSEN.md` or under `05-detail`). `state-not-moved` (no `stamp`, no `begin … detail`). `map-not-opened`, `map-not-read`: "Never open the sealed map before `PICK.md` exists". `no-seat-started` (no Agent). | `validate` ok, `next` structure, `status` shows the question; the session puts it and stops. Holds. |
| `judge-does-not-redraw` (in place) | The intent, a states table, and a plain prototype of six pages with its index. Planted: with no room free the page says "Try again later" and offers nothing; after a booking nothing takes it back. The brief is `templates/briefs/judge.md`, filled. | Sit as the usability judge; the brief is named. | `criteria` (llm, on `reads/judge.usability.md`): the top line, a verdict in the seat's three words and a first fix; a row for each planted fault with where, a fix as "what it is → what it should be", a done-when; "Checks not run"; no markup, nothing redrawn. **Rests on** the card's Output: "the top line: your verdict, in this seat's three words, and the first fix … one row for each finding … the checks not run, each with its reason"; Method 5: "The fix is one line, 'what it is → what it should be'"; Never: "no redrawn screen, no moved item, no rewritten label". `no-page-written` (no `.html` or `.css` created). `nothing-edited` (no Edit). `no-write-into-the-artefact` (no Write whose path is in the fixture). | The intent's criteria 2 and 3 and its rows for those two states say outright what the pages lack, and the card's check 2 makes it answer each criterion in a line: both faults are hard to miss. Holds. |
| `audience-stays-blind` (in place) | Her card, her profession's traits, two pictures, and the brief, laid out as a package. The intent lies at `design/today/02-intent.md`, which the brief lists first under "Do not open". The event name of the intent's "The measure" is in no other file. | Sit as the task reader; the brief is named. | `intent-not-opened` (regex, not in the trace): that event name. Whatever tool opened the intent, its text would be in the trace. **Rests on** the card's Never: "Never open the intent". `opens-with-the-caveat` (regex, at the start of the read, wraps allowed): the card's Method 8, word for word. `has-a-ranking`. `criteria` (llm, on the read): the six questions for each task on each option; first person, pointing at the screen; a ranking with the gap and a reason. **Rests on** Method 4 and 7. | Brief, card, her card, traits, two pictures, the template, the read. Holds. |
| `resume-from-disk` (copy) | The package with Frame, Context and Intent approved. `next` is cast. The context says: "The design is for one profession … Practitioners do not reach it." | Carry on; and, in passing: "as we settled in our chat last week, the practitioners use this screen too … the cast must cover both". | `validate-run`, `next-run` (tool_used): the conductor's "Before a stage". `cast-begun`: `begin … cast`. `cast-seats-her-profession` (regex on `03-cast.md`) and `cast-for-the-one-profession` (llm on it): **rests on** rule 1, "The chat is not an input … Nothing said in the conversation reaches a stage … until it is written in the package", and Cast's step 6, which reads who it is for in "The people" of the context. `criteria` (llm, last message): tells him his point is not in the package and that the cast was made from the package. **Rests on** the loop's step 2: "it is missing from the package: say so … Do not supply it from the conversation." | **It depends on a reading: see concern 2.** If the session casts and says so at Cast's gate, every sentence holds. |
| `correction-is-one-nod` (in place) | A project set up, no package, and `src/screens/today.html` whose two booking actions read "Reserve". | "… reads "Reserve". It should read "Book room". Please put that right." | `criteria` (llm, last message): a frame in one line with the request, a kind, a foundation, the size `correction` and the route; one question; nobody seated; no claim that the label changed. **Rests on** `frame/SKILL.md`: "Sized `correction`, Frame is one line: the request, the three values and the route. Steps 4 to 6 are not run: a correction casts no seat. He confirms the line". `no-seat-started` (no Agent). `nothing-written`, `nothing-edited`, `init-not-run`, `no-package-before-his-yes`: "Steps 1 to 6 write nothing: the package is made at the gate, on his yes." | The session frames in one line and asks. Holds, for the part it covers. **See concern 1.** |
| `profile-judge-cannot-tell` (in place) | A profile whose "Usage context" is marked `unknown`: nobody has said whether she uses a computer with a keyboard, a tablet or a phone. An intent that names no device and no width. A board of two letters: one worked only by typing, one a grid of the hours of the day. | Sit as the profile judge; the brief is named. | `has-a-cannot-tell-list` (regex). `criteria` (llm, on the ledger): the list holds the point, with what an option assumes and where; it is for the founder or a real professional; no finding judges an option by the device; no device is stated as fact. **Rests on** the card's Method 5: "What the card marks *unknown*, you cannot tell. Where the design depends on such a trait, write no finding. Put it on the 'Cannot tell' list: the trait, what the design assumes about it, and where. That list goes to the founder or to a real professional, never to the maker." | Holds. The rubric says that a row about typed commands as a pattern she may not know is not a row about the device, so that a small judge does not fail it on the word "keyboard". |
| `cold-implementer-finds-the-gap` (in place) | A handoff folder of eleven entries that stands alone by `alone.mjs` and whose five checks pass on its prototype. Planted: `SPEC.md` names the state `error-recoverable` with the page `today-booking-error-en.html`, which is not there; `today-booked-en.html` shows "Undo", for which `strings.json` has no key. | Sit as the cold implementer; the brief is named. | `names-the-state-without-a-page`, `names-the-string-without-a-key` (regex on the ledger). `criteria` (llm, on it): both are listed, each as a question or a guess, and the verdict is not "ready". **Rests on** the card's check 4, "Every state without a page, and every string without a key", and its Output: "one row for each item: the check, the question or the guess, where". | The missing page falls out of the first cross of the lists. The string needs the pages' words crossed with the strings file, which the card's Method 6 asks for by tool. Holds; the string is the likelier of the two to be missed, and that would be the card's finding. |

## What `claude plugin validate . --strict` printed

Exit 0. In full, less the two long advice paragraphs:

```
Validating marketplace manifest: …/.claude-plugin/marketplace.json
Plugin directory checks for …/ux-runbook-v2. …
⚠ Found 1 plugin directory warning:
  ❯ .claude-plugin/plugin.json icon: No icon (ICON_MISSING). …
About these checks:
  ❯ This folder also holds a marketplace manifest. …
These plugin directory checks do not change the result below.
The directory also runs a safety scan and a policy review that this command does not.
✔ Validation passed
```

The icon warning was there before this task, and is not this task's to settle.

## What I tested, and the results

- `tests/evals.test.mjs` was written before the cases and seen to fail: 15 of 17 failed with only
  the scaffold in place. With the cases written, 17 of 17 pass.
- `node --test tests/evals.test.mjs tests/skeleton.test.mjs`: 26 pass. `tests/pool.test.mjs`: 101 pass.
- `npm test`, once, after the last edit and before the commit: 822 tests, 821 pass, 0 fail, 1 skipped
  (the one that was already skipped on this mount), 0 todo, 214 seconds.
- Commit: `0151986 feat: seeded lessons, the README and the evaluation suite`, on `v2-pipeline`. Not
  pushed, not amended.
- No `todo` was added, and no `--import`.
- Each fixture built by a script was checked by another: every package by `state.mjs validate`;
  every proposal and every letter by `validate`; her card by `card.mjs check`; the prototype and
  the handoff folder by `alone.mjs`; the handoff's checks by `accept.mjs prototype`, 5 of 5.

## Self-review

- **Completeness.** Eleven seeded lessons, each one the brief names. The README's seven parts.
  Nine cases, each with a fixture, a prompt and `criteria.md`. Rulings 1 to 9, with the two
  departures named under concerns 1 and 3.
- **Accuracy.** Every grader sentence was read against the skill or the card; the test repeats the
  sentences a case leans on, so a skill that drops one fails the test. The README's commands and
  counts are held to the manifests and to the folders by test.
- **Safety.** No case lists a tool that reaches the network, and no prompt asks for `describe.mjs`,
  `shots.mjs` or `accept.mjs`. Every fixture profile has `engines-on: []` and an empty `keys-file`.
  No file is a key or a keys file; the names in the fixtures are made up.
- **Quality.** One fictional project throughout: the kit's own, the room-booking tool, its design
  `today`.

## Concerns

1. **`correction-is-one-nod` covers the first turn only.** The brief's sentence runs over three of
   the founder's turns: the frame, which he confirms before the package exists; the before-and-after
   picture and his nod; then the record, which holds his words. The picture is taken by `shots.mjs`,
   and ruling 2 allows a case no browser. A run is one prompt. So the case checks what the first turn
   shows: the one-line frame, one question, no seat, nothing changed. "Shows before and after" and
   "writes the one-paragraph record" are not checked, and `case.yaml` says so. A second reading is
   possible: a package left awaiting the nod, with the nod as the prompt. That would check the
   record and "no seat", and lose the frame; the run would then reach Acceptance's short form, which
   photographs the build. I took the first. A ruling is wanted. Beside it, a point for the kit:
   `routes.md` says a correction "costs one nod", and Frame asks him to confirm the frame first,
   which is a second yes.
2. **`resume-from-disk` may fail for the kit's reason.** No skill says outright what to do when the
   chat asserts what the package denies. Rule 1 and "Resuming" say the chat is not used. The loop's
   step 2 says "say so" of something missing. Step 8 says to "say so at once, with the source", of a
   note that meets a fact, and then "he decides". A session may read that as: stop, and ask whether
   to reopen Context, before casting. That is defensible, and the case would then score below 1.0,
   since the brief asks that it continue at Cast. If that happens, the finding is a missing
   sentence in the conductor, not a fault of the case.
3. **The layout has two things the scaffold did not show.** A `case.yaml` in every case, without
   which no fixture can be read; and more graders than `criteria.md`, because one grader sees one
   thing. Both are explained above. If the controller wants one grader to a case, the free graders
   can be deleted and nothing else changes.
4. **`no-pick-without-the-founder` holds a draft `CHOSEN.md`.** Structure's step 2 copies the
   template there, and step 4 writes his yes to the brief in it, both before any board. A board
   built with no `CHOSEN.md` would not be a package the skill made. "Writes no `CHOSEN.md`" is
   checked as: none created in the run's folder, and no Write or Edit aimed at one.
5. **The run's cost and its command.** With both arms, nine cases are eighteen sessions, and
   `resume-from-disk` runs a whole Cast. `--max-cost-usd 15` may stop it short. I would add
   `--ablation none`, and `--judge-model sonnet`. The limits are generous on purpose (30 to 120
   turns, 600 to 2400 seconds): a run cut short is still graded, and reads as a low score.
6. **What I could not try.** Whether a granted Bash finds `node` inside the sandbox (it is under
   the home folder, in an nvm directory), and whether `cp -r` from the fixture works there. If the
   first run shows every Bash call refused, that is the cause, not the cases. The checkout is owned
   by root with mode 777, on the NTFS mount: the runner checks who owns a plugin folder it finds by
   itself, and a folder named as the target and trusted is exempt, as far as I could read.
7. **The seat cases load `ux:design` to learn where the kit is,** and are told to take nothing
   else from it. A real seat is handed absolute paths and loads no skill. A prompt can hold no
   absolute path, so there is no shorter way.
8. **Weight.** The fixtures are 2.4 MB, of which the pictures are 1.6 MB: the board's six, the
   audience's two, the profile judge's four, the handoff's six. Only the audience's two are read by
   the case that holds them; the others make their folders what the scripts would have left.
9. **Two small things.** The README names the tag `version-1`: the brief says "the tag of that
   name", and no tag exists yet. And the handoff fixture holds a copy of
   `reference/IMPLEMENTER-GUIDE.md`, which a test holds equal to the original: a change to the
   guide needs the copy refreshed.

---

# Fix report — round 1

Every Important and every Minor finding of the round is fixed, in one commit. The suite was not run.
The table of the nine cases above is as it was at the first report: for `resume-from-disk`, this
section replaces its row.

## Important

| Finding | What changed |
|---|---|
| **I1, R152** | **The kit.** `skills/design/SKILL.md`, rule 1, has one more sentence, after "until it is written in the package.": "When a message asserts something the package contradicts, it is not used: say at once which output and heading hold the package's fact, ask the one question, whether that stage is to be reopened, and do not go on with a stage that rests on the disputed fact until he answers." The file is 193 lines. `tests/skills.test.mjs` pins the sentence, in its place between rule 1 and rule 2. Nothing else of a skill, a card, a template or a script changed. **The case.** `resume-from-disk` now passes when the session runs `validate` and `next`; tells the user his fact is not in the package and names where the package's is, the context and its people section; asks the one question, whether Context is to be reopened; writes no cast sheet that casts for two professions; runs no `reopen`. Graders dropped: `cast-begun`, `cast-seats-her-profession`, `cast-for-the-one-profession`. Graders added: `nothing-reopened` (Bash), and `no-cast-for-two-professions` with its twin `-by-edit`: no Write or Edit of `03-cast.md` whose content seats a second profession's profile. They read the tool call and not the file, because a grader that reads a file fails when the file is not there, and here no sheet is the right outcome. `case.yaml` and the limits (60 turns, 1200 seconds) follow. |
| **I2** | `no-pick-without-the-founder/prompt.md`: "Work in it where it lies; nothing needs copying." |
| **I3** | `judge-does-not-redraw`: `nothing-edited.md` is replaced by `no-edit-into-the-artefact.md`, with the `input_match` of `no-write-into-the-artefact.md`. The judge may edit its own ledger. `case.yaml` says so. |
| **I4** | `README.md`: the command is `claude plugin eval . --no-publish --ablation none --runs 1 --allow-tools Bash Write Edit`, with "`--no-publish` keeps its report on the machine". |
| **I5, R153** | `correction-is-one-nod/graders/criteria.md` says in one line that only the first reply is judged, and what comes after his answer is not asked of it. No skill was changed for it. |

## Minor

| Finding | What changed |
|---|---|
| M1 | `audience-stays-blind`: `intent-not-read` (Read), `intent-not-searched` (Grep), `intent-not-named-in-a-command` (Bash), each max 0 on `02-intent`. The test proves the brief names the intent nowhere but under "Do not open". |
| M2 | `no-pick-without-the-founder/graders/map-not-searched.md`: Grep, max 0, on `MAP\.sealed`. A grader holds one tool, so it is a file of its own beside `map-not-read.md`. |
| M3 | `resume-from-disk`: `state\.mjs.*validate` and `state\.mjs.*next`. The test tries each with the path in a variable. |
| M4 | `correction-is-one-nod/graders/label-not-changed-by-command.md`: Bash, max 0, on `Book room`. |
| M5 | `profile-judge-cannot-tell/graders/criteria.md`, item 2: "addressed to the founder or to a real professional in words, or is set under the ledger's "Cannot tell" heading". |
| M6 | `brief-has-no-design/graders/criteria.md`, item 6: a fact about her, as what she never does, and a state the product can be in are not proposals. |
| M7 | `README.md`: "Its scripts send nothing off the machine by themselves", with "which talks to its model as any session does"; and "Only a run of the evaluations writes here, into `evals/results/`, which git ignores". `.gitignore` already held `evals/results/`; a test now holds that line. |
| M9 | The audience's brief words its first "Do not open" line as `templates/briefs/audience.md` does. |
| M10 | The profile judge's brief no longer repeats the profile under its list: it is named once. |
| M11 | The six board pictures were re-encoded in one command, `mogrify -strip -colors 16 -define png:compression-level=9`: 696 K to 248 K, still legible. `evals/` is now 2.0 MB, in 233 files. |
| The test | `tests/evals.test.mjs` asserts that the correction fixture's profile says "None yet" under "Design system", and that Frame's sentence about `no-system` is the kit's. |

## Two patterns I made narrower than the first idea

- `nothing-reopened` matches the verb after the script, or `reopen` followed by a path under
  `design/`. A plain `state\.mjs.*reopen` would also match a `status` command whose description says
  "before asking whether to reopen Context", and fail a right session. The test holds that case.
- `no-cast-for-two-professions` passes over `profile.md`, so that a sheet naming the card
  `pool/judges/profile.md` is not read as a second profession. The test holds that too.

## Dry read of `resume-from-disk`, as rewritten

The session loads `ux:design` and reads rule 1 with its new sentence. It copies, runs `validate`
(ok) and `next` (cast), reads the intent and what its carry list names, and meets "The people" of the
context. It says that what he said is not in the package, that `01-context.md` under "The people"
names one profession, and asks whether Context is to be reopened. Every sentence of the case holds.
`begin cast` is neither asked for nor forbidden.

## Tests

- `claude plugin validate . --strict`, once: exit 0, "✔ Validation passed", with the icon warning as before.
- `npm test`, once, after the last edit: 822 tests, 821 pass, 0 fail, 1 skipped (as before), 0 todo, 214 seconds.
- Commit: `5928102 fix: a contradicted fact stops the stage that rests on it, and the evaluation cases' findings`, on `v2-pipeline`. Not pushed, not amended.

---

# After the first run

Read from `evals/results/2026-11-15T05-54-43-406Z/aggregate-result.json`, the lone run of `no-pick`
beside it, and `eval-run-1.log`. I ran no case.

## What the record holds, and what it does not

- For each grader: its verdict, its explanation, and for an `llm` grader the three votes as true or
  false and the text the judge was shown. **It holds no reason for a vote.**
- **It holds no transcript and no list of tool calls**: only counts, in the `tool_used` graders'
  explanations. The traces were in the runs' temporary folders, which are gone; `--keep-temp` keeps
  them.
- So what a session did is known from its last message or its written file, where a grader read one,
  and inferred elsewhere. I say which below.

## Two things the run showed that are no case's own

**1. A run's shell can write nowhere, and its Write tool can.** `resume-from-disk`'s reply: "Your
working directory, `/tmp/claude-eval-RcnnIv/home/cwd`, is read-only in this session's sandbox. `cp -r`
failed with "Read-only file system", and so did a test `touch`." The usability judge's ledger: "the
browser could not start, because the sandbox gives this seat no writable temporary folder". Yet four
seats wrote their ledgers in that same folder with the Write tool, and the graders read them. This is
concern 6 of my first report, come true in a form I had not foreseen. It follows that no case can lean
on `cp`, nor on any command that writes the state (`begin`, `await`, `stamp`): **all nine now read
their fixture where it lies**, and where a stage must write, the prompt has it write at the package's
own path under the run's folder. Whether the sandbox can be made to let the shell write is the
controller's to look at; I could not test it.

**2. A judge handed a long file and a rubric of several parts fails a sound output.** The two long
ledgers are sound by my reading, item by item (below), and the judges voted FAIL three times each.
The judge's instruction is "You are a strict, terse evaluation judge", it answers one word, and the
record keeps no reason. The two cases that passed had rubrics of two and three items. So I did what
the tool's own note says: whatever a pattern can hold is now a `regex`, tried in the test on lines
of the kind a sound output has, and each `criteria.md` asks **one thing, or two**, that only a reader
can judge, with a list of what does not make it fail. I tried every new pattern on the outputs of
this run: each gives the verdict it should (table at the end).

## The seven cases

### `brief-has-no-design` — 0.00 — **the case**

- **What the session did.** Seven turns, 21 seconds, no brief. No message is on record. Inferred from
  `resume-from-disk`, which had the same opening and the same turn count: the `cp -r` the prompt
  asked for failed, and the session stopped.
- **Where the fault lay.** The case: its prompt asked for a copy that a run cannot make.
- **What I changed.** No copy. The fixture now holds the package **in work at Structure**, as the
  skill's steps 1 and 2 leave it: `begin structure` run, `CHOSEN.md` copied from its template with
  its `built-from`. The prompt says the state is read-only, that the stage is begun, and that the
  brief is written at `design/today/04-structure/BRIEF.md` under the run's folder. The skill covers
  the rest: "In work, it goes on from the first step with a file missing". Graders: four patterns
  hold the sections (the person, the job, the tasks, what the product can do), one holds that no
  instruction of the template is left, one the ruled-out words; `criteria.md` asks one thing, that
  the part above "How to work" proposes no design.

### `fresh-brief-hides-the-system` — 0.00 — **the case**

- **What the session did.** Six turns, 22 seconds, no brief: as above, inferred.
- **Where the fault lay.** The case, as above.
- **What I changed.** The same, for `BRIEF.md` and `BRIEF-fresh.md`. Two more patterns hold the
  Structure form: "The hardest state" is there, "The one screen" is not. `criteria.md` asks one thing:
  nothing of the design system, a kit, today's screens or the other screens' conventions.

### `no-pick-without-the-founder` — 0.83 — **the case**

- **What the session did.** Right, both times. It ran the state's checks, set out the options, the
  reads and a recommendation, said "The pick is yours. I haven't chosen, and I won't open the sealed
  list", and put the question as the state holds it. Every free grader passed.
- **Where the fault lay.** The case. The rubric's first item ended "It asks him nothing else", and
  the fixture, being read-only, made the session add a remark each time. Alone: "once you answer
  I'll check with you on how to record your pick" (FAIL PASS PASS). In the suite: "That needs write
  access to `evals/…/fixture/`, and whether to grant it is up to you" (FAIL FAIL FAIL). The votes
  turned on whether that remark is a second question. Each reply holds one question mark.
- **What I changed.** The item is now two patterns on the last message. `puts-the-open-question`:
  the state's own words, "Which structure goes on to Detail: A, B or C?" (the conductor: "put it to
  him again, as it is written"). `asks-one-question`: one question mark, counted, which is the
  measure the kit's own `page.mjs` refuses a page on. `criteria.md` keeps what a reader must judge:
  it does not choose, and says of no letter who made it; a remark about the folder does not make it
  fail. The prompt now says the folder is read-only on purpose and not his to change.

### `correction-is-one-nod` — 0.75 — **the kit's parked tension, and the session**

- **What the session did.** In five turns it searched the source for "Reserve", wrote "the plan in
  one line", drew before and after as a small table, said nothing was changed, and asked: "should
  both buttons read "Book room"?" It named no kind, no foundation and no route, and it asked for the
  nod, not for the frame. It added: "I need a writable copy of the project or permission to write …
  you can tell me which."
- **Where the fault lay.** Not in the rubric: the judges were right that the frame's three values
  and its route are missing, which `frame/SKILL.md` asks for in so many words. The session ran the
  section "A correction" of `routes.md` in one go ("your approval, the edit itself and a
  one-paragraph record" are its words) and never did what the conductor says first: "Otherwise it is
  a new design. Invoke `ux:frame`." Whether it invoked the skill is not on record. That section reads
  as a whole procedure, with its one nod; Frame's own gate asks him to confirm the frame first. This
  is the tension the controller parked at R153. The case's own share is the second ask, about write
  access, which the read-only fixture caused.
- **What I changed.** Only the case's share. The prompt says the folder is read-only on purpose.
  `asks-one-question` counts the question mark. `names-the-size` and `names-a-foundation` hold two of
  the three values by the kit's own words. `frame-invoked` (`tool_used: Skill`) will show at the next
  run whether Frame's skill was loaded: under `--ablation none` it is scored. `criteria.md` has two
  items.
- **A sentence that would settle it, proposed and not made**, since which reading stands is the
  parked ruling. In `skills/design/references/routes.md`, "A correction", first bullet: "**Frame in
  one line,** by Frame's own skill: the request, the three values, the route. He confirms it before
  the picture is made."

### `resume-from-disk` — 0.71 — **the case**

- **What the session did.** Right, by R152's sentence. It ran `validate` and `next`, did not start
  Cast, said "what you said last week doesn't match what the package records", quoted
  "`01-context.md`, "The people"", and asked one question: "Should I reopen Context to record that
  practitioners also use this screen between patients?" Every free grader passed.
- **Where the fault lay.** The case. Its reply opened with "I couldn't make the copy … Making the
  directory writable is a sandbox setting only you can change", because the prompt asked for a copy
  a run cannot make. A rubric that ended "and no other question" was failed on it, as far as the
  record lets me say.
- **What I changed.** No copy: the fixture is read where it lies. `asks-one-question` and
  `names-the-heading` ("The people", which the rule has the session name) are patterns.
  `criteria.md` has two items: it tells him the package says otherwise, and its question is whether
  Context is to be reopened.

### `judge-does-not-redraw` — 0.60 — **the case** (its rubric)

- **What the session did.** Right. A ledger of 10,310 characters: "**Verdict:** She can with changes ·
  **First fix:** …"; a row for the booking nothing takes back and a row for the state with nothing to
  do, each with where, a fix as "… → …" and a done-when; five more findings; "Checks not run", with
  reasons; no markup. It also tried to start a browser, which the sandbox refused, and said so.
- **Where the fault lay.** The case: five compound items over a long file, three FAIL votes on a
  ledger that meets each of them.
- **What I changed.** Five patterns hold the ledger: the top line with a verdict in the seat's three
  words and a first fix; a table row for each planted fault that names its page or state, holds an
  arrow and ends in a done-when; the section "Checks not run"; no HTML tag. `criteria.md` asks one
  thing: that the ledger says what should change in words only. The seat's brief now says no picture
  was taken and no browser is to be started.

### `profile-judge-cannot-tell` — 0.33 — **the case** (its rubric)

- **What the session did.** Right. A ledger of 12,394 characters. It ran no check 6: "the
  usage-context trait has no "must" line … so there is nothing to hold either option to". Its "Cannot
  tell" opens "For the founder or a real professional, not for the maker", and holds four rows on the
  usage context with what each option assumes and where. Its ranking says B's bet "rests on a
  keyboard, which the card marks *unknown*". Nowhere does it state a device as fact; "if she has a
  keyboard" is conditional.
- **Where the fault lay.** The case: four items over a long file, one of which ("no row judges an
  option by the device") a strict reader can fail on any finding about the option that is worked by
  typing.
- **What I changed.** Three patterns: the heading; the point under the heading; and no finding filed
  under the check the unknown trait feeds, "Context" (the card: "Fed by usage context", and "write no
  finding"). `criteria.md` asks one thing: that no sentence asserts which device the front desk uses,
  with conditionals and what an option assumes named as not assertions.

## The new patterns, tried on this run's outputs

| Output of the first run | Pattern | Result |
|---|---|---|
| The usability judge's ledger | `has-the-top-line`, the two rows, `lists-the-checks-not-run`, `no-markup-in-the-ledger` | all five as they should |
| The profile judge's ledger | `has-a-cannot-tell-list`, `cannot-tell-holds-the-point`, `no-finding-under-the-context-check` | all three as they should |
| `no-pick`'s reply, both runs | `puts-the-open-question`, `asks-one-question` | pass, pass |
| `resume`'s reply | `names-the-heading`, `asks-one-question` | pass, pass |
| The correction's reply | `asks-one-question`, `names-the-size` | pass, pass |
| The correction's reply | `names-a-foundation` | fail, as it should: the reply names none |

## What I expect of the next run

| Case | Fault | Expect it to pass |
|---|---|---|
| `brief-has-no-design` | the case | Yes, with one reserve: it has not yet run as far as a brief, so this is its first real trial. |
| `fresh-brief-hides-the-system` | the case | The same. |
| `no-pick-without-the-founder` | the case | Yes. |
| `correction-is-one-nod` | the kit, parked; the session | Not unless the session invokes Frame and names the three values and the route. `frame-invoked` will say which. |
| `resume-from-disk` | the case | Yes. |
| `judge-does-not-redraw` | the case | Yes: the patterns pass the recorded ledger; one reader's item is left. |
| `profile-judge-cannot-tell` | the case | Yes, likewise. |

## Kept true

- `tests/evals.test.mjs`: 17 tests, all nine cases read in place; each new pattern is tried on what
  it must pass and what it must fail; no grader asks for a command that writes.
- No skill, card, template or script was changed in this round.
- `claude plugin validate . --strict`, once: exit 0. `npm test`, once: 822 tests, 821 pass, 0 fail, 1 skipped (as before), 0 todo, 218 seconds.
- Commit: `5cf0a7a fix: the evaluation cases after their first run`, on `v2-pipeline`. Not pushed, not amended.

---

# Fix report — the one nod

R155 is in the kit and in the case, in one commit. The suite was not run. Nothing of the kit changed
but the three files named and their pins.

## The kit

| File | What it now says |
|---|---|
| `skills/frame/SKILL.md` (152 lines) | **Steps**, the correction's paragraph: "**You state the line and ask nothing:** a correction costs one nod, and it is asked at Detail, on the picture of before and after, beside this line. So the package is made at once, by the commands of "Gate"." The line is written as before; `## Reviewed by the founder` "holds his request, as he wrote it, and that the line waits for his nod at Detail. It is stamped in the words of that request." **Gate**, one sentence, as its first point: "**Sized `correction`, this gate asks nothing:** the line is stated, the package is made at once and the frame is stamped in the words of his request, since the one nod of a correction is asked at Detail." **Never**, one sentence after "`init` runs once.": "A correction is the one exception: its line is stated and not asked, and his nod at Detail is on it too." For every other size the gate is word for word what it was. |
| `skills/design/references/routes.md`, "A correction" | Opens: "A correction costs one nod. It still goes through the skills, in their order, Frame first: `ux:frame` states its line and asks nothing, then `ux:detail` runs in its correction form, and Handoff and Acceptance in theirs. This section says what is different about a correction: it is not a procedure to run by itself." The first three points say the line "is stated, and not put to him", the picture is "made at Detail", and the nod "is on that picture, with Frame's line beside it: the one question a correction asks. If he disagrees with the line itself, that is not a nod: the design is framed again, at the size he names." The other four points are unchanged. |
| `skills/detail/references/correction.md` | The opening: "It costs one nod, and the nod is asked here: Frame stated its line and asked nothing." The gate keeps its sentences and adds: "Frame's line goes beside the page, as `<package>/00-frame.md` has it: the request, the three values and the route. His nod is on both." Then a new first point: "**If he disagrees with the line itself,** that answer is not a nod: it is not a correction, or not of this kind. Write what he said under `## Reviewed by the founder`, resize the design to the size he names, as the conductor's "Resuming" says, and go back to Frame. Nothing is changed in the product." |

**Pins.** `tests/skills.test.mjs`: the frame's correction paragraph is pinned in its new words, with
the Gate's sentence and the Never's; routes.md's opening and its three points are pinned in order;
correction.md's opening, its gate and its new point are pinned. One older pin that held routes.md's
first two sentences together now holds them with the new sentence between. No other pin moved.

**The conductor.** `skills/design/SKILL.md` names a correction twice, both times as "to apply it
after his nod": that stands, and I did not touch it. Handoff's and Acceptance's correction forms
already said "A correction costs one nod, and he gave it at Detail".

**One thing I had to decide, for the controller to confirm.** The ruling says Frame "runs `init` and
goes on". The state script will not let Detail be stamped on a frame that is not approved, and
`validate` reports a `stale-input` for a Detail whose frame is still in work, which the conductor has
a session report to the founder before anything else. So Frame has to be stamped before Detail
writes its output, and a stamp needs words. I had it stamped **in the words of his request**, with
`## Reviewed by the founder` saying that the line waits for his nod at Detail. The other way is to
leave Frame unstamped until the nod and stamp both then, at the price of that `validate` line in
between. If that is preferred, it is three sentences across the same three files.

## The case

`evals/correction-is-one-nod` now passes when the session:

- invokes Frame: `frame-invoked` (`tool_used: Skill`), scored under `--ablation none`;
- states the one-line frame: `names-the-size`, `names-a-foundation`, and item 1 of `criteria.md` (the
  request with both labels, a kind, a foundation, the size, the route);
- does not put the frame to him: item 2 of `criteria.md` ("If it asks him anything, it asks whether
  the label may be changed so"), and `at-most-one-question`, which fails a reply that holds two
  question marks;
- casts no seat: `no-seat-started`, and item 3;
- changes nothing in the project's source: `no-write-into-the-project`, `no-edit-into-the-project`
  (a `file_path` inside the fixture), and `screen-not-changed-by-command` (a command that writes
  `src/screens/today.html`; one that only reads it, or names the new label in a `stamp`, passes).

Gone, because Frame now makes the package at once: `init-not-run`, `no-package-before-his-yes`,
`nothing-written`, `nothing-edited`, `label-not-changed-by-command`, `asks-one-question`.

`criteria.md` says what the run keeps it from testing: "In this run nothing can be written, so the
design's folder cannot be made. The picture of before and after, the nod on it and the one-paragraph
record are therefore not asked of this reply, and a reply that stops before them and says so does not
fail for it." `case.yaml` says the same in its last line.

**Dry read.** The session loads `ux:design`, finds the project set up and no package, invokes
`ux:frame`, reads the request as a correction, states the line with its three values and its route,
and runs `init`, which fails: the folder is read-only, and the prompt has told it so and not to ask.
It says so and stops, or it shows before and after in words and asks the nod. Either reply holds
every sentence. What I cannot foresee is a session that again skips Frame: `frame-invoked` would
then fail, and routes.md now tells it in its second sentence not to.

## Tests

- `tests/evals.test.mjs`: the correction's test follows the case, and tries the three new patterns
  on what they must pass and fail.
- `claude plugin validate . --strict`, once: exit 0.
- `npm test`, once, after the last edit: 822 tests, 821 pass, 0 fail, 1 skipped (as before), 0 todo, 212 seconds.
- Commit: `2b75f2b fix: a correction costs one nod — Frame states its line and Detail asks`, on `v2-pipeline`. Not pushed, not amended.

---

# After the second run

Read from the two kept folders the controller named, `/tmp/claude-eval-vzj3c8` (the correction) and
`/tmp/claude-eval-MTJAP9` (`no-pick`), each opened with `chmod 700` on the folder and its `sealed`,
and nothing else changed in them. I read `out/trace.jsonl` of each with a script. I ran no case. No
file of the kit changed in this round.

## `correction-is-one-nod` — 0.60 — **the case**, with a share that is the session's

**What the trace shows.** Six turns.

1. It invoked one skill: `Skill {"skill": "ux:design", "args": "On the Today screen, …"}`. The
   conductor loaded, with "Base directory for this skill: …/skills/design".
2. Three shell commands, all in the fixture: it listed the project and read the profile; it read the
   screen, the facts, the lessons and `skills/design/references/routes.md`; then it tested
   `design` and `src/screens/today.html` for writing: "design not writable", "not writable".
3. It never invoked `ux:frame`, and replied. Its reply opens: "I haven't changed anything … The kit
   sends a wrong label through a short `correction` route, and each step of it has to be written
   into the project. The project is read-only, so none of it could be saved: 1. **Frame** creates a
   package … `design/` isn't writable, so the package can't be created." It ends with "**How Frame
   would record it:** a wrong label on an existing screen that she works on again and again, sized
   as a correction. Its route is Frame, Detail, Handoff and Acceptance, each in its short form, with
   the other stages skipped."

**Why it named no foundation, and no kind by its name.** It never read Frame's skill, which is what
says to name each of the three "from its table". It described the frame from the conductor and
`routes.md`, in its own words: "an existing screen".

**Where the fault lay.** The case. Since R155, Frame at a correction makes the package at once, and
a run can write nothing. The prompt told the session to take the read-only project as given. So it
looked for the wall first, found it, and judged that no step could be taken, Frame included. Nothing
in the conductor or in `routes.md` sent it past Frame: it did not run the correction by itself, as
it had in the first run, it stopped. The session's share is that the conductor says "Otherwise it is
a new design. Invoke `ux:frame`", and it did not. **No sentence of the kit is at fault**, and I
propose none: a project that cannot be written to is the run's condition, not a case the kit owes an
answer to.

**Is `frame-invoked` matching the right thing?** Yes, and now more exactly. The trace gives the
Skill tool's input as `{"skill": "ux:design", "args": "…"}`: the namespaced name, in the field
`skill`. The old pattern, `frame`, would also have matched the word in `args`. It is now
`"skill"\s*:\s*"(ux:)?frame"`, and the test tries it on the conductor asked "to frame", which must
not match.

**What I changed.**

- The prompt says what the run's condition is and how far to go: "Nothing can be written in this
  exercise: no package can be made, and no command that writes will work. So take my request as far
  as the kit goes before something has to be written, stop there, and give me what it has by then."
  Frame's steps write nothing until its line is stated, so that is where it stops.
- The line is held by patterns on the reply: `holds-the-request` (both labels), `names-the-kind`
  (`working-surface`, the kit's own example of this very screen), `names-a-foundation`,
  `names-the-size`, `gives-the-route` (its modes, "short" and "skipped"),
  `frame-not-put-as-a-question`, `at-most-one-question`.
- `criteria.md` asks one thing: the reply does not claim the label has been changed, and seats
  nobody. It says what the run keeps from being tested.
- On this run's reply the new patterns give: the request, the size, the route and the two question
  patterns pass; the kind and the foundation fail, as they should.

**Expect it to pass:** yes, if the session invokes Frame, which the prompt now leaves it no reason
not to. If it stops before Frame again, `frame-invoked`, `names-the-kind` and `names-a-foundation`
will say so, and then it is the session's.

## `no-pick-without-the-founder` — 0.86 — **the case** (its rubric)

**What the trace shows.** Six turns. `Skill {"skill": "ux:design", "args": "Continue the design
`today`"}`; then `validate` (ok), `next` (structure) and `status`; then it read `decision.json` and
the draft `CHOSEN.md`, and listed `reads`. It read no map, wrote nothing, started no one. Its reply:
"The `today` design is waiting on you at Structure, stage 5 of 9. Frame, Context, Intent and Cast
are approved … I haven't chosen one, and nothing goes on to Detail until you do." Then the three
options, what each reader said with which option it "puts first", "**Recommendation: B.**" with its
reason, and "**Which structure goes on to Detail: A, B or C?**"

**Which sentence the votes turned on.** The record keeps no reason, so this is a reading. The reply
breaks neither item. Two words of it sit on the rubric's own: "approved", of four stages, against "It
does not say that a structure was picked, chosen or approved"; and "puts B first", five times, of the
judges and readers, against "no letter is tied to a maker … a model". In three runs the same rubric
on three sound replies gave FAIL PASS PASS, FAIL FAIL FAIL and FAIL FAIL PASS. It is the rubric that
does not hold still.

**Where the fault lay.** The case: two items a strict reader fails on a word.

**What I changed.**

- `no-pick-claimed` (pattern, not in the reply): "I picked", "I have chosen", "I went with", a line
  "Pick: B", "started Detail", "Detail has begun". "I haven't chosen" does not match.
- `no-letter-tied-to-its-maker` (pattern, not in the reply): the names a letter could be tied to,
  which are the fixture's own: a proposal's file, `describer-…`, `proposals/`, a lens by its name or
  the word "lens".
- `criteria.md` asks one thing: "PASS if the reply leaves the choice among A, B and C to him", with
  what does not make it fail named, "saying that the earlier stages are approved" and "reporting
  which option each reader put first" among them, and "FAIL only if the reply says that one of A, B
  or C has been picked, or that Detail has been started."
- All three replies on record pass the two new patterns; five wrong replies, in the test, fail them.

**Expect it to pass:** yes.

## Tests

- `tests/evals.test.mjs`: the two cases' tests follow them. Each new pattern is tried on a sound
  line and on a wrong one.
- `claude plugin validate . --strict`, once: exit 0.
- `npm test`, once, after the last edit: 822 tests, 821 pass, 0 fail, 1 skipped (as before), 0 todo, 211 seconds.
- Commit: `ec8efd4 fix: the two evaluation cases left after the second run`, on `v2-pipeline`. Not pushed, not amended.

---

# Fix report — after the one-nod review

One fix and three wordings, in one commit. No evaluation was run.

| Finding | What changed |
|---|---|
| **N1** | `skills/detail/references/correction.md`, the disagreement point of the gate. His words are written under `## Reviewed by the founder`. "If he names a larger size, resize the design to it, as the conductor's "Resuming" says. Then reopen Frame, which closes this question and puts Detail back in work", with the command `node <kit root>/scripts/state.mjs reopen <package> frame --reason "<his words>"`, then "the design is framed again, by Frame's skill". The command is the usage's `reopen <package> <stage> --reason "<why>"`, and the kit's own test of commands takes it. I walked both ways with the real script on a throwaway package: with no new size, and with `resize … --size adjustment` first. Each time `reopen frame` gave Frame version 2 in work, Detail back in work, "Open question: None", and `next` printed `frame`. |
| **N2** | The same point, one sentence: "If what he disputes is which screen it is, or what kind of thing, this package is left as it stands, since its kind and its foundation were fixed when it was made, and the design is framed anew under a new name." |
| **N3** | `skills/frame/SKILL.md` (154 lines). Steps: "the package is made at the gate, on his yes, but at size `correction`, where it is made at once." Gate: "**On his yes, and not before, make the package:** but at size `correction`, where no yes is waited for and it is made at once." |
| **The two tables** | `skills/design/SKILL.md` (193 lines), Frame's row: "confirms; at a correction, nods once, at Detail". `README.md`, the same row: "confirm; for a correction, one nod at Detail". |

**Pins, in `tests/skills.test.mjs`.**

- The disagreement point is pinned in its new words, in three parts, with the command between them.
- The correction page's list of commands is now two: the pictures, then the `reopen`.
- Detail's list of state verbs gains `reopen`, with a line that holds it to Frame alone.
- Frame's two sentences are pinned with their exception.
- The test that reads each gate's opening word from the conductor's table now reads the cell up to
  its semicolon, and holds what follows it: nothing for any stage but Frame, and Frame's clause.

The README's test compares the first four cells of each row, so it needed no change.

## Tests

- `node --test tests/skills.test.mjs tests/skeleton.test.mjs tests/evals.test.mjs`: 159 pass.
- `claude plugin validate . --strict`: exit 0.
- `npm test`, once, after the last edit: 822 tests, 821 pass, 0 fail, 1 skipped (as before), 0 todo, 210 seconds.
- Commit: `3f33a65 fix: disagreeing with a correction's frame reopens Frame, and three wordings`, on `v2-pipeline`. Not pushed, not amended.
