# The build's rulings

## What this page is

The kit was built in 21 tasks by sub-agents. Sometimes the plan, the design or a reviewer left a point
open. The controller then decided it and wrote a numbered **ruling** in the build's ledger. You approved
the design and the plan, but you were not asked about each of these. This page lists all of them, so that
you can overturn any you disagree with.

- There are **192 numbered rulings, R1 to R192**. Every number is in the ledger. None is missing. Eight
  have no line of their own and sit inside another line: R39, R84, R98, R102, R108, R109, R146, R154.
- The ledger is `.superpowers/sdd/2026-11-13-PIPELINE-KIT-PLAN/progress.md` (a committed copy is in
  `docs/build-log/`). In the same folder: the full text of R159–R188 is in `task-20-fix-rulings.md`,
  R189–R191 in `task-20-fix-round-1.md` and `task-20-fix-round-2.md`, R192 in `final-fix-wave.md`.
- Only the numbered rulings are here. Each task's rulings file (`task-<n>-rulings.md`) and each fix-round
  file hold more instructions with their own local numbers, and the ledger records many smaller calls as
  "accepted" with no number. Those are not listed.
- **To overturn a ruling, tell the controller its number** and what you want instead, for example
  "Overturn R174". Where a later ruling corrected an earlier one, the later one holds now: overturn that
  one.
- Where things stood at the ledger's last line: the final fix wave's scripts part was done; its words part
  had been sent out and had not reported back. The evaluation re-run that R187 orders after the final wave
  had not happened yet.

In the tables: **built** means the ledger shows it was carried out. **stands** means it holds, but the
ledger does not clearly show it carried out, or it is a standing rule. **corrected by R<n>** means a later
ruling changed it. **dropped** means it was dropped. "She" is the person a design is for.

## The ones worth your eye

Twenty entries, most recent first. A few join two rulings that belong together.

### R192 — the final fix wave

- **Decided:** every finding of the whole-branch review (G1–G21) is fixed as the review's own fix says,
  and R84 and 37 small deferred points are dropped. The controller's own calls in it: the plugin is not
  installed on this machine to try the installed copy; an earlier-stamped fixture is never rewritten to
  pass the new stamp rule (the rule is narrowed instead); the R184 guard is written only after listing
  what later stages may write into earlier folders; R108 becomes one sentence, not code.
- **Among the fixes:** G1, the one Critical finding. The screen generator's seat is to be told whether
  its outside tool is on. If its brief does not say, the tool is off.
- **Why:** G1 was the one path by which a brief could leave the machine without your yes. "A guard that
  trips on the kit's own steps is worse than none." Each dropped point is "an error worded oddly, a cost
  in time, another operating system's case, or a path no step reaches".
- **If wrong:** the ledger names no cost.
- **Now:** the scripts part is done (17 of 17). The words part, which includes G1, had not reported back.

### R190 and R191 — "without scrolling"

- **Decided:** a first-screen picture is taken at Structure only. From Detail on, "without scrolling" is
  answered by a measured `in-viewport` check. The visual designer writes that check, from the criterion
  its brief carries word for word. The conductor only checks that the check is there.
- **Why:** first-screen pictures at Detail and Look would double the pictures Handoff copies. Choosing
  which element proves the criterion is a maker's judgement.
- **If wrong:** an audience at Detail reads a whole page for a criterion a check already measures; one
  more line in a brief.
- **Note:** a check of that kind that still fails after the send-back goes to the judges and to you as an
  open finding. This amended the design (§ 25, item 6).

### R189 — a build that needs a server (corrects R159)

- **Decided:** the kit writes a project's browser driver only for a build that opens as files, and only
  on your yes, written down first. A build that needs a server or a sign-in, in a project with no browser
  script of its own, goes to you open, and Acceptance stops. No step has a session write code that fetches
  a credential.
- **Why:** R159 was written from the dry run's file-only build "and overreached". The kit's browser
  library opens local files and nothing else.
- **If wrong:** a real project with a served build and no script stops at Acceptance until you name one.
  The whole-branch review calls this the largest risk of the proving run. R192 (G3) rules that setup
  tells you so at the start.
- **Note:** this amended the design (§ 25, item 5).

### R175 and R186 — a breach you accept

- **Decided:** when you accept, as a cost, something that breaks a standing rule or a line of the intent,
  it goes into its own section, "Accepted deviations": what it breaks, your words, the date. It is carried
  on, handed to every later judge (never to the audience), and copied into the handoff's "Must not
  change". A judge that still finds it writes it once, as "accepted at `<stage>`": no fix round, not
  blocking. The decision page shows it under its own heading and does not count it as open.
- **Why:** in the dry run the same accepted cost came back marked blocking at Look, twice, and again at
  Acceptance.
- **If wrong:** one more field in the decision data (R186). R175 names no cost.
- **Note:** this amended the design (§ 25, item 4).

### R184 — what a stamp guards

- **Decided:** a stamp guards every file of the stage's folder, not only its output. `validate` reports a
  file changed, added or removed after the stamp. `reopen` names the stages it recalled. Text files are
  compared with line endings made one; files a mount or the system leaves behind are passed over; a stage
  stamped before this is held to its output alone.
- **Why:** the dry run found that only the output was hashed, so files like `SPEC.md`, `PARTS.md` and
  `ACCEPTANCE.md` could change unseen.
- **If wrong:** the ruling names no cost. R192 warns that a guard that trips on the kit's own steps is
  worse than none.
- **Now:** built in the final wave's scripts part. `07-handoff-gate/` is not guarded (it lies beside the
  folder). Until the words part lands, an accepted deviation trips the guard: `deviations.md` must first
  be changed to reopen Handoff.

### R182 and R183 — left for the proving run

- **Decided:** no script yet for Handoff's mechanical part (R182). At Acceptance the decision page says
  what the scripted checks cannot see — nothing is pressed, loaded, sent or focused — and points to the
  keyboard pass and the builder's deviations. Check types that test behaviour are left for later (R183).
- **Why:** what a Handoff script should hold depends on a real project's strings format and build; in the
  dry run the hand work took 21 minutes. A build that was only the prototype copied passed every check.
- **If wrong:** the ledger names no cost.

### R174 — one question per list

- **Decided:** a list that a maker or a reader returns (dependencies, states the intent does not name,
  facts a string waits for, items nobody decided, deviations, and so on) is put to you as one question.
  The entries are numbered, each says what follows from each answer, and you answer by number in one
  message. An entry you leave unanswered stays open. An answer that meets a standing rule, a fact of the
  product or an output you approved is still asked on its own, at once.
- **Why:** in the dry run Detail alone put 36 questions to you one at a time.
- **If wrong:** the ledger names no cost.
- **Note:** this amended the design ("one question about one thing": a list is one thing; § 25, item 3).

### R171 with R154 — what the audience is shown

- **Decided:** the board is drawn a second time without the bet, the cost, what it is deliberately bad at,
  and the notes. The audience's pictures come from those pages; the judges' pictures stay as they are.
  `shots.mjs` also takes a picture of the first screen alone.
- **Why:** the audience's pictures carried the makers' reasons, which her card says she is never given.
  The dry run confirmed it, and found that whole pages with every state stacked let no reader test
  "without scrolling".
- **If wrong:** twice the pictures at Structure.
- **Note:** this amended the design (§ 25, item 6).

### R164 — your words, asked once

- **Decided:** Context always asks you one question about words: what she calls these things, and any
  word she must never see. "None" is an answer.
- **Why:** the old test ("when the words will matter") left it to the session to judge, and in the dry run
  the question was never asked.
- **If wrong:** the ledger names no cost.
- **Note:** this amended the design (§ 4.1; § 25, item 2).

### R160 — where the conductor chooses

- **Decided:** at Structure and Detail the conductor picks states and rows by a written rule, not by
  weighing. At setup and Handoff it may write what it would take, marked "the conductor's proposal", and
  you decide each one. An undecided item that changes what she sees or can do is put to you with its
  options, never with a blanket default.
- **Why:** in the dry run the conductor made small design calls at setup and proposed defaults at Handoff
  that were design decisions, though "the conductor proposes no design".
- **If wrong:** a rule hands a maker more rows than it needs.
- **Note:** the dry run's first fix round held Handoff to it: a default is written only where your answer
  says to take it.

### R155 — a correction costs one nod (resolves R153)

- **Decided:** at size `correction`, Frame states its one line and asks nothing. You nod once, on Detail's
  before-and-after picture. A correction still goes through the skills in order. If you disagree with the
  frame at the nod, Frame is reopened.
- **Why:** the design's row (one nod) and the kit's two yeses disagreed, and the kit's text read as a
  procedure to run without Frame.
- **If wrong:** a wrong frame is caught at the one nod, not before.

### R152 — the chat against the package

- **Decided:** when a message says something the package contradicts, it is not used. The session says
  where the package holds the fact, asks one question (reopen that stage?), and does not go on with a stage
  that rests on the fact until you answer.
- **Why:** going on would decide for you; taking the chat's word would make the chat an input. This
  departs from the plan's pass condition ("continues at Cast").
- **If wrong:** a resumed session waits for one answer.

### R149 — no script checks a correction

- **Decided:** a correction's record is its before-and-after picture and Detail's one paragraph. Handoff
  writes no checks file for it. Acceptance compares by eye and reports one item. The session that applied
  the correction also accepts it.
- **Why:** a correction has no prototype page for a check to name.
- **If wrong:** a wrong label fixed wrongly is caught only by the picture and your nod.

### R145 and R146 — choosing a direction at Look

- **Decided:** the side-by-side page asks you two questions: what you would keep, then — with system
  fidelity's list of what each costs — what is borrowed. After you pick a direction, the visual designer
  writes the tokens, the profile change is put to you first, the kit is rebuilt after your yes, and an
  existing system's token copy is never overwritten.
- **Why:** you must not choose without the cost.
- **If wrong:** the ledger names no cost.

### R142 and R147 — the side-by-side is blind

- **Decided:** for the side-by-side at Look, the pictures are copied under random letters into
  `06-look/beside/`. A sealed file beside that folder is opened only after your answer. A kit script,
  `scripts/deal.mjs`, deals the letters.
- **Why:** a reader must not learn from a file path which picture is the fresh one or which engine made it.
  A one-line command could not be made safe against copy order and a half-finished run.
- **If wrong:** one more folder and a sealed file at Look; one script and one test file beyond the plan.

### R136 — no seat sees the project profile

- **Decided:** "the project profile" (`PROFILE.md`) and "a profession's profile" (a profile card) are two
  terms, defined at the top of the conductor. No seat is ever handed the project profile.
- **Why:** read as one word, "makers and judges are handed the profile whole" would hand every seat the
  file whose header holds `keys-file`.
- **If wrong:** none.

### R131 — the audience never sees the criteria

- **Decided:** an audience reads `profile-traits`: a profession's profile with every "So the interface
  must" line taken out. Never the profile itself.
- **Why:** the design gives those lines to the judge (§ 8) and forbids handing an audience the success
  criteria (§ 11). A reader told what the interface must do will find it.
- **If wrong:** the conductor must build the extract for every audience brief. (R162 later made it a
  command, `card.mjs traits`.)

### R128 — you read what would leave the machine

- **Decided:** your stop after the brief covers the outside send. You read the brief an outside model
  would receive, and you are told which seats would send it and to which provider, before anything leaves
  the machine. A proposal that fails the check goes back to its maker once, then is left out and said so,
  never repaired by the conductor.
- **Why:** "Nothing leaves the machine before his yes" (Task 16's rulings).
- **If wrong:** nothing beyond one more folder name.

### R124 — setup and keys

- **Decided:** setup never touches a key. It asks you whether a brief may be sent to an outside model, and
  only on your yes writes the provider into `engines-on`. `keys-file` is a path you give; it is written
  into the profile and never opened, listed or put on a command line. Also: the project's token file is
  copied into the kit folder.
- **Why:** the kit must not be the reason a key reaches a transcript.
- **If wrong:** a project's first setup needs one more answer from you.
- **Note:** the token copy amended the design (§ 12; § 25, item 1).

### R86 and R115 — outside models and the describe script

- **Decided:** `describe` refuses unless the project profile's `engines-on` holds `model:<provider>`.
  `--endpoint` accepts only a local address; otherwise the request goes to the provider's own address.
- **Why:** the design says outside models are off unless the profile turns them on, "because the brief
  leaves the machine", and prose alone does not keep a brief on the machine. A command line is written
  afresh by an agent on every run and must not be able to say where a key goes.
- **If wrong:** a project that set a key but forgot `engines-on` gets a refusal that names the line to
  add. A project behind a proxy, or on another host for the same provider, cannot use the script without
  a change to the kit.

## Every ruling, in number order

Each group holds the rulings made while that phase was built. A few were written ahead for a later task;
the Task column says which. One line each: the ledger holds the rest.

### The scripts (Tasks 0–8): R1–R117

| # | Task | What was decided | Status |
|---|---|---|---|
| R1 | pre-flight · 0 | The controller made the worktree and moved the two documents; the implementer started at step 3. | built |
| R2 | pre-flight · 0 | `.gitignore` lists `.superpowers/`; implementers stage files by name, never all at once. | stands |
| R3 | pre-flight · 9, 13 | The test that keeps the product's name out of the kit matches whole words only, so "conversation" passes. | stands |
| R4 | pre-flight · 9, 10 | A judge has two to six core checks (the design gives the profile judge six). | stands |
| R5 | pre-flight · 2, 12 | The handoff and acceptance templates carry the stage header; `## Carry` stays optional for them. | stands |
| R6 | pre-flight · 6 | The pictures test makes its own fixtures; it does not rely on files another task left. | stands |
| R7 | pre-flight · 12 | In the fresh brief, what a maker is not given may be named only under `## What you are not given`. | stands |
| R8 | pre-flight · 12 | `01-context.md` has one heading per point of design § 4.1 (ten) plus `## Project sources`. | stands |
| R9 | pre-flight · 12, 13 | A skill or template names only paths that exist when its task lands. | stands |
| R10 | pre-flight · all | The build uses the best model for each job, not the cheapest, as you said. | stands |
| R11 | 0 | The test command is `node --test tests/*.test.mjs` (the folder form fails on newer runtimes). | built |
| R12 | 0 | `marketplace.json` gets a description; the plugin is validated in strict mode. | built |
| R13 | 0 | Three small points of the Task 0 review are fixed in the same round. | built |
| R14 | 1 | A header key with nothing after the colon reads as empty, unless the next line is indented (then refused). | built |
| R15 | 1 | The header reader drops one leading byte-order mark. | built |
| R16 | 1 | The header reader's extra refusals stay, each with a test; the format has no escapes. | built |
| R17 | 1 | The six small points of the Task 1 review are fixed with its important one. | built |
| R18 | 1 | A value like `[a] and [b]`, which read silently as a list, is refused. | built |
| R19 | 2 | A package's hash is taken over the body with line endings made one. | stands |
| R20 | 2 | Two verbs the plan lacked: `begin` (in work) and `await` (awaiting you, with the one open question). | corrected by R33 |
| R21 | 2 | Accepted as built: a `status` export, a start date, the reasons for a skip or a reopen, the stage as an argument. | built |
| R22 | 2 | `stamp` records each stage's inputs; `validate` reports a header edited since approval; `reopen` works from the record. | built |
| R23 | 2 | A stage in work is not reported as missing its output. | built |
| R24 | 2 | `STATE.md` shows a "Cast" line that points at `03-cast.md`. | built |
| R25 | 2 | `stamp` refuses a stage that does not name the stage before it among its inputs (your third requirement, made mechanical). | built |
| R26 | 2 | On a resize, an approved stage whose mode changes turns stale (its note rule settled by R37). | corrected by R37 |
| R27 | 2 | A verb `route` sets one stage's mode, always with a reason; an approved or awaiting stage cannot be skipped. | built |
| R28 | 2 | Stamping a stale stage raises its version only when its body changed. | built |
| R29 | 2 | The review's other small points are fixed in the same round (atomic save and more). | built |
| R30 | 2 | The implementer's five readings of the state rules stand. | built |
| R31 | 2 | When a stage's version goes up, every later stage built on it, directly or not, turns stale. | built |
| R32 | 2 | Putting a skipped stage back makes the next approved stage stale; `validate` reports a missing previous-stage input. | built |
| R33 | 2 | `begin` on an existing output sets it back to draft; a skip clears the approval record. | corrected by R38 |
| R34 | 2 | A resize never lowers a stage's mode (its note rule settled by R37). | corrected by R37 |
| R35 | 2 | Frame can never be skipped. | built |
| R36 | 2 | A stale stage's message gives its recorded reason. | built |
| R37 | 2 | Which notes a resize rewrites; a reason you gave by hand is kept (settles R26 against R34). | built |
| R38 | 2 | A skip clears the approval but keeps the hash and version, so a later change still raises the version. | built |
| R39 | 2 | The stale chain passes through a skipped stage (parked; built in the final wave, narrower than worded). | built |
| R40 | 3 | A collapsed part (`expansion`) must carry a label. | built |
| R41 | 3 | Accepted as built: where the brief was silent, the structure format is strict (unknown keys refused and more). | built |
| R42 | 3 | At most one primary action per screen. | built |
| R43 | 3 | Options only on a choice, a list or a navigation; a choice needs at least two. | built |
| R44 | 3 | The review's other small points are fixed in the same round. | built |
| R45 | 3 | Each drawn frame carries `data-screen`. | built |
| R46 | 4 | The board shows what a structure leaves out and its hardest state beside its name, bet and cost; never the first idea or who made it. | stands |
| R47 | 4 | A dialog's caption names the screen it opens over. | built |
| R48 | 4 | `render` reads a file with a byte-order mark and refuses to write over `kit.css`. | built |
| R49 | 4 | Accepted as built: a capital letter A–Z is required, A by default; `--help`. | built |
| R50 | 4 | `render` copies every stylesheet of the kit folder, so a project kit can bring its token file (setup puts it there). | built |
| R51 | 4 | The cheap small points of the Task 4 review are fixed in the same round. | built |
| R52 | 5 | One shared reader for proposal files, used by `render` and `merge`. | stands |
| R53 | 5 | `merge` refuses a board folder that already holds a sealed map. | stands |
| R54 | 5 | `merge` refuses any board folder that is not empty. | built |
| R55 | 5 | A letter is written in a fixed key order and without the first idea, so it does not show who made it. | built |
| R56 | 5 | Accepted as built: small file-reading cases of `merge`. | built |
| R57 | 5 | The map and the pick sit beside the board folder, not in it; judges are handed the board folder only. | built |
| R58 | 5 | `open` needs `PICK.md` to say `Pick: <letter>` or `Pick: none`. | built |
| R59 | 5 | The board is written all or nothing. | built |
| R60 | 5 | One shared argument parser for the scripts, `scripts/lib/cli.mjs`. | built |
| R61 | 5 | `render` reads a file as a sealed letter only when none of the six source keys is present. | built |
| R62 | 5 | Accepted as built: an old `PICK.md` beside the board stops a merge; a pick naming two letters is refused. | built |
| R63 | 5 | No board inside a board, and none in or around the proposals folder. | built |
| R64 | 5 | The map records its board's name; `open` refuses a map that does not match. | built |
| R65 | 5 | Small points of the round (clean-up on failure, folder mode, a test's path). | built |
| R66 | 5 | Accepted as built: `merge` looks for letters in every folder above the board. | built |
| R67 | 5 (for 12) | The `PICK.md` template lives in `templates/outputs/` and is written at the pick. | stands |
| R68 | 6 | One shared HTML escape for `render` and the decision page. | stands |
| R69 | 6 | The one-question rule also counts full-width and Arabic question marks; a missing picture stops the page. | built |
| R70 | 6 | Accepted as built: strict decision data, relative picture paths, failed requests counted. | built |
| R71 | 6 | On the decision page each picture is shown whole, readable, linked to its full size. | corrected by R76 |
| R72 | 6 | The decision data may carry open findings, shown under "Open findings". | built |
| R73 | 6 | One bad page costs one error line, never the whole picture run; `--timeout` sets the limit. | built |
| R74 | 6 | Small points of the round. | built |
| R75 | 6 | No script, test or probe stops a process by name, only processes its own run started (a probe had stopped another session's browsers). | stands |
| R76 | 6 | The decision page shows each option's first picture inline, the rest as links, options side by side, the question always in view. | built |
| R77 | 6 | Nothing in `shots` waits without a time limit; a stuck browser is stopped by its own handle and replaced. | built |
| R78 | 6 | "The page moved away" is judged on its settled address. | corrected by R80 |
| R79 | 6 | Three options side by side when the window is wide enough; a backslash in a picture path is refused. | built |
| R80 | 6 | A page counts as the one asked for while its loaded document is still in the tab (a mark is planted and checked). | corrected by R83 |
| R81 | 6 | Browser restarts are counted, and a run always ends. | corrected by R83 |
| R82 | 6 | Naming an address never throws; tests start at most three browsers at once. | built |
| R83 | 6 | Accepted as built, as a sounder reading of R80 and R81: the mark is planted early; a picture is written only after both checks. | built |
| R84 | 6 | A page written on purpose to defeat that mark is out of scope (parked, then dropped in the final wave). | dropped |
| R85 | 7 | The browser handling becomes one shared library, used by `shots` and `accept`. | built |
| R86 | 8 (ahead) | `describe` refuses unless the project profile's `engines-on` turns that provider on. | built |
| R87 | 8 (ahead) | A provider's error body is never shown or saved; no redirect; the key is wiped from all output (its endpoint part replaced by R115). | corrected by R115 |
| R88 | 8 (ahead) | The proposal records engine and model; the script gains `--endpoint` and `--timeout`. | built |
| R89 | 8 (ahead) | Tests never inherit a key and never contact a real provider. | built |
| R90 | 7 | `visible` reads the element's own `visibility`; `display: none` and `opacity: 0` are looked for up the ancestors. | built |
| R91 | 7 | In a prototype run, a script error or a missing file fails that page's checks, unless `--allow-errors`. | built |
| R92 | 7 | `accept report --checks` joins raw results to their checks; a check never run shows as "not run". | built |
| R93 | 7 | Test files run one at a time, so no more than three browsers start at once. | built |
| R94 | 7 | "Rendered" also asks the browser (a closed `details` counts as not shown). | built |
| R95 | 7 | `contrast` says "cannot be measured" behind a gradient, opacity, a filter or a blend, instead of giving a number. | built |
| R96 | 7 | `text` is what is shown: a control's value; elsewhere only rendered text. | built |
| R97 | 7 | `in-viewport` also fails an element scrolled out of a clipping panel. | built |
| R98 | 7 | `count` counts only rendered elements. | built |
| R99 | 7 | R97's clipping follows the CSS containing-block chain (withdrawn: the list was wrong both ways). | corrected by R104 |
| R100 | 7 | A `display: contents` element counts as painted when its boxed parent is; size and position checks need a child. | built |
| R101 | 7 | A control that is not painted reads as empty text. | built |
| R102 | 7 | An element whose own `content-visibility` is hidden counts as not painted. | corrected by R105 |
| R103 | 7 | `visible` means painted with a box, nothing more; position and clipping belong to `in-viewport`. | built |
| R104 | 7 | `in-viewport` stops computing containing blocks: clearly inside passes; otherwise the browser is asked, or the check says "cannot be told". | built |
| R105 | 7 | R102 applies only when the element is not `inline`. | built |
| R106 | 7 | An element near a corner of a rounded ancestor that might clip is not "clearly inside": the browser is asked. | corrected by R107 |
| R107 | 7 | Inside a corner region the curve itself decides; only a point outside it goes to the browser. | built |
| R108 | 7 | An `svg` drawn through a scale or zoom is measured unscaled; parked (then fixed as one sentence, no code). | corrected by R192 |
| R109 | 7 | A label inside a pill shape: corner radii as CSS computes them (parked; built in the final wave). | built |
| R110 | 8 | If a provider's answer holds the key, nothing of the answer is saved, and the run fails. | built |
| R111 | 8 | A key must be one word of visible characters, else it is refused without being shown. | built |
| R112 | 8 | `--help` prints the usage and exits 0, as in the other scripts. | built |
| R113 | 9 (ahead) | The card rules live in `scripts/lib/card.mjs`, proven on samples, so a project's own cards meet the same rules. | built |
| R114 | 8 | An earlier run's outputs are removed just before a new request, so what is on disk is this run's. | built |
| R115 | 8 | `--endpoint` accepts only a local address; otherwise the request goes to the provider's own address. | built |
| R116 | 11 (ahead) | `pool/INDEX.md` also lists the people; a person card is checked by `validatePerson`. | built |
| R117 | 10, 11 (ahead) | Judge and audience cards name their output template by its later path; a waiting test keeps that honest. | built |

### The pool and the templates (Tasks 9–12): R118–R134

| # | Task | What was decided | Status |
|---|---|---|---|
| R118 | 9 | The transcriber writes a generated screen's name, bet, cost and the rest from the screens, so no letter shows it came from a generator. | built |
| R119 | 9 | The interaction designer owns the data map (where each element's content comes from). | built |
| R120 | 12 (ahead) | `05-detail/DETAIL.md` holds rules, data map and dependencies; other template points left by Tasks 7–11. | built |
| R121 | 9 | At Look a fresh pass chooses only the paint: the same screen, structure and words, drawn another way. | built |
| R122 | 12 (ahead) | The Structure and fresh briefs carry the whole walkthrough format, with an example, so an outside model can answer in it. | corrected by R133 |
| R123 | 13 (ahead) | Every skill's description is in double quotes (else the skills would not load), and a test checks it. | built |
| R124 | 14 (ahead) | Setup never touches a key; an outside model is turned on only on your yes; the token file is copied into the kit folder. | built |
| R125 | 15 (ahead) | A command, `scripts/card.mjs check`, checks a project's own cards and people; a faulty one is reported and left out. | built |
| R126 | 10 | The why-line is part of the strings and travels to the handoff; the words judge reads it last. | built |
| R127 | 10 | On a re-read a judge reads cold first, then opens its own earlier ledger. | built |
| R128 | 16 (ahead) | Your stop after the brief covers the outside send; a failing proposal goes back once, then is left out. | built |
| R129 | 14, 17 (ahead) | `describe --text`: an answer that is not a proposal is saved whole, exit 0. | built |
| R130 | 12, 18 (ahead) | A build's accounts are named by role, never by a password; build pictures use test data; raw results are one file per state. | built |
| R131 | 11 | An audience reads the profile's traits only, never its "So the interface must" lines. | built |
| R132 | 8, 12 | Checks that a folder is empty pass over files a mount or the system leaves behind (parked; built in the final wave). | built |
| R133 | 12 | The Structure briefs carry a specimen of the syntax (every key once, no product), not a whole design. | built |
| R134 | 12 | The fresh brief has a Structure form and a Look form; at Look it does not invite a redesign. | built |

### The skills and the evaluations (Tasks 13–19): R135–R155

| # | Task | What was decided | Status |
|---|---|---|---|
| R135 | 13 | A rejected board is not deleted: the whole round moves to `04-structure/earlier/<n>/` and is never an input. | built |
| R136 | 13 | "The project profile" and "a profession's profile" are two terms; no seat is ever handed the project profile. | built |
| R137 | 16, 17 (ahead) | What you mark in a fresh gallery goes into the package's `DECISIONS.md` in your words; Look reads it there. | built |
| R138 | 14 | A project needs setup while its profile is missing, or its "Reviewed by the founder" holds none of your words. | built |
| R139 | 15 | The truth judge sits on every public page, at every size (one more seat for a copy change). | built |
| R140 | 15 | A faulty project card that replaces a kit card is left out and the kit's card is used, and the sheet says so. | built |
| R141 | 16 | `reopen` closes the open questions of later stages; `begin` closes its own. | built |
| R142 | 17 | At Look's side-by-side, pictures are copied under random letters, with a sealed file opened after your answer. | built |
| R143 | 17 | The four Detail and Look makers are handed her person card and her profession's profile. | built |
| R144 | 17 | When a fresh pass runs at Look, Cast seats the side-by-side readers (truth, profile, one task reader). | built |
| R145 | 17 | Two questions at the side-by-side: what you keep, then what is borrowed, with its cost. | built |
| R146 | 17 | After a direction pick: the designer writes the tokens, the profile change is put to you first, the kit is rebuilt after your yes. | built |
| R147 | 17 | Dealing the letters becomes a kit script, `scripts/deal.mjs`. | built |
| R148 | 18 | A kit script, `scripts/alone.mjs`, proves the handoff folder loads nothing from outside itself. | built |
| R149 | 18 | No script checks a correction; its before-and-after picture is compared by eye. | built |
| R150 | 18 | The conductor's loop says exactly what Acceptance reads. | built |
| R151 | 18 | Intent's and Cast's carry lists also name what the handoff needs. | built |
| R152 | 19 | When the chat contradicts the package, the session stops and asks one question (reopen that stage?). | built |
| R153 | 19 | The correction evaluation case is accepted as partial; the one-nod question is parked. | corrected by R155 |
| R154 | 19 | The audience's pictures must not carry the makers' notes (parked; built with R171). | built |
| R155 | 19 | A correction costs one nod: Frame asks nothing; you nod once on Detail's before-and-after. | built |

### The dry run (Task 20): R156–R191

| # | Task | What was decided | Status |
|---|---|---|---|
| R156 | 20 | The dry run: one fresh session per stage, reading only the skills and the package, in a copy outside the repository; an answers file stands in for you. | built |
| R157 | 20 | In the dry run your stand-in accepted three breaches as costs, to test how an accepted breach is recorded. | built |
| R158 | 20 | At the dry run's Acceptance, the conductor wrote the project's driver on the kit's browser library. | built |
| R159 | 20 | A build with no driver: Acceptance writes one on your yes; Handoff copies the in-page check file into the folder. | corrected by R189 |
| R160 | 20 | The conductor selects by a written rule; where it proposes, it says so and you decide; no blanket default. | built |
| R161 | 20 | The grey kit's specimen page uses neutral words that name each part; no product's nouns. | built |
| R162 | 20 | `card.mjs` checks a profession's profile and makes the audience's traits copy (`traits`). | built |
| R163 | 20 | As built: Frame writes nothing before your yes, and the kit now says so. | built |
| R164 | 20 | Context always asks you once about words. | built |
| R165 | 20 | A source you corrected stays carried; the context holds over it, the truth judge is told, Handoff adds a slice to mend it. | built |
| R166 | 20 | What you say of a profession goes into the profile, marked `guess (the founder, <date>)`. | built |
| R167 | 20 | Intent's profile judge does not read the person card, as the design has it. | built |
| R168 | 20 | The profile judge's offer says how many "So the interface must" lines the profile holds. | built |
| R169 | 20 | Only a `blocks` finding is mended before a gate; the conductor never mends a `should`. | built |
| R170 | 20 | A stage header is also valid YAML: your words go in single quotes when they hold a double quote, never changed. | built |
| R171 | 20 | The board is drawn a second time without the makers' notes, for the audience; `shots` also takes a first-screen picture. | built |
| R172 | 20 | When the seats rank the options differently, the one recommendation says so, and that you settle it. | built |
| R173 | 20 | The decision page counts question marks in the question and the recommendation only (kept as built after review). | built |
| R174 | 20 | A list is put to you as one question: entries numbered, answered by number. | built |
| R175 | 20 | A breach you accept is part of what was approved: its own section, carried on, never a finding again. | built |
| R176 | 20 | The writer's "Nothing to say" round closes; an entry you already answered is not sent round again. | built |
| R177 | 20 | A brief names first the pictures a seat needs; with one option, no ranking is asked. | built |
| R178 | 20 | Look's send-back on measured values happens once per run of step 5; the conductor writes no value. | built |
| R179 | 20 | Every element that shows text or takes an action has an id (`data-ux`). | built |
| R180 | 20 | `alone.mjs --package` also reads every text file for pointers back into the package; makers write none. | built |
| R181 | 20 | An item closed after the one re-read is listed as "closed after the re-read, not read again". | built |
| R182 | 20 | No script yet for Handoff's mechanical part; the proving run decides what it holds. | stands |
| R183 | 20 | Acceptance's decision page says what scripted checks cannot see; check types for behaviour are left for the proving run. | built (first half) |
| R184 | 20 | A stamp guards every file of the stage's folder, not only its output (built in the final wave). | built |
| R185 | 20 | Check types for sizes and gaps (built in the final wave as `style` and `gap`; line length stays a person's). | built |
| R186 | 20 | The decision page shows accepted deviations under their own heading, not counted as open. | built |
| R187 | 20 | The cold-implementer case's fixture gets the in-page check file; the evaluations run once more after the final wave (about $5). | built (fixture part) |
| R188 | 20 | The read name `example-data` stands, and was added to the design document. | built |
| R189 | 20 | Corrects R159: the kit writes a driver only for a build that opens as files; otherwise Acceptance stops and goes to you. | built |
| R190 | 20 | A first-screen picture is taken at Structure only; from Detail on, a measured check answers "without scrolling". | built |
| R191 | 20 | The visual designer writes that `in-viewport` check from the criterion in its brief; the conductor only checks it is there. | built |

### The final wave: R192

| # | Task | What was decided | Status |
|---|---|---|---|
| R192 | final wave | Fix every finding of the whole-branch review as it says, with the controller's own calls; drop R84 and 37 small points (scripts part done, words part not yet reported). | stands |

## What changed the design, and what is left

### Rulings that amended the design document

`docs/design/2026-11-13-pipeline-design.md` § 25 lists seven amendments, written by the controller after
the dry run:

1. **A project kit copies the tokens; it does not link them** (§ 12). From Task 14 (R124; first raised in
   R50).
2. **Context always asks once for your words** (§ 4.1). R164.
3. **A list is one thing** (§ 18, "one question about one thing at a time"). R174.
4. **An accepted deviation is part of what was approved** (§ 4.5, § 4.6, § 9, § 13). R175, R186.
5. **A project with no browser script** (§ 4.8). R159, corrected by R189.
6. **What a reader is shown** (§ 11, § 12). R154, R171, R190.
7. **One more name for what a seat may read: `example-data`** (§ 7). R188.

§ 25 also says that R184 was ruled and left for the last fix wave. The ledger shows it built in that
wave's scripts part.

### Ruled "not built, for the proving run to decide"

- **R182:** a script for the mechanical part of Handoff.
- **R183, second half:** check types that test what a page does (something pressed, loaded, sent or
  focused), not only what it shows.

The whole-branch review also names one risk as the largest for the proving run. It is not an item to
build: a real product runs on a server and signs in, so Acceptance stops unless the project keeps a browser
script of its own (R189).
