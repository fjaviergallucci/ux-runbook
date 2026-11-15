# Task 14 — Setup: report

Status: **DONE_WITH_CONCERNS** (the concerns are choices the controller may want to rule on; nothing is
unfinished). Branch `v2-pipeline`, two commits, nothing pushed, nothing amended.

| Commit | Subject |
|---|---|
| `b8dd5f6` | feat: describe writes a plain answer when asked for text |
| `47caac0` | feat: setup writes a project's profile and its kit |

## 1. What I wrote, file by file

| File | Lines | What |
|---|---|---|
| `scripts/describe.mjs` | 516 → 562 | The `--text` switch (R129), and the guard it makes necessary (§ 2). |
| `tests/describe.test.mjs` | 1191 → 1583 | 12 new tests, 48 → 60. No existing test was changed. |
| `pool/makers/outside-describer.md` | 87 → 93 | The Look paragraph runs the script with `--text`; nothing else of the card moved. |
| `tests/pool.test.mjs` | 1249 → 1273 | 1 new test: the card's two commands, flag for flag against the script's own usage. |
| `skills/setup/SKILL.md` | 190 (new) | The skill: six sections, 200 at most. |
| `skills/setup/references/project-kit.md` | 174 (new) | The long form of building the project kit. |
| `tests/skills.test.mjs` | 1239 → 1567 | The table holds `setup` to the six sections (ruling 10) with its inline sample; `setup`'s rule test is live; 15 tests of what setup was written to say; one more row in the usage table (the `--text` form). |

## 2. `--text` (ruling 3, R129)

### What changed in `scripts/describe.mjs`

- `--text` is a **switch** (`parseArgs`' `switches`): no value, given once. To the module it is
  `text: true | false` (default `false`); anything else is bad usage.
- With it, `--out` must end in `.txt`, `.md` or `.html` (any case), checked where the `.json` check
  is, in the usage step: after the profile, before the brief and the key.
- After the request, and **after** the held-key check, the answer is written whole through the same
  `writeWhole` (staged, renamed, through `redact`) and the run returns `ok: true`; no proposal is
  looked for, nothing is unfenced, no engine or model is set, no final newline is added.
- Before the request, `--out` is removed as before. `<out>.raw.txt` is **not** removed with `--text`:
  no text run writes one, so a file of that name is not an earlier run's.
- The usage has a second form (`node scripts/describe.mjs --text … --out <file.txt> …`), a paragraph
  that says what the switch is for, its line among the flags, and the exit codes say "0 a proposal is
  written, or with --text the answer". The header comment says the same.
- Without `--text` nothing changes: the 48 tests that were there pass untouched, and the text test
  of ruling 18 (two places write standard output, one `writeFileSync`, four `https://`, one `[key]`,
  no `key=`) passes untouched.

### One thing beyond the ruling's letter — the controller should rule on it

Before, `--out` was always `.json`, so it could never be the brief (`BRIEF.md`) or the profile
(`PROFILE.md`). With `--text` it may be `.md`, and the script removes `--out` just before the request.
A slip on one line (`--profile design/PROFILE.md --out design/PROFILE.md`) would have deleted the
project profile and written the answer in its place. So with `--text`, and only with it, `--out` is
refused (bad usage, exit 2, before the brief is read and before any key is looked up) when it is the
same file — by device and inode, as `render.mjs` and `page.mjs` already do — as the brief, the
profile, or the keys file the profile names. The messages name no path. It is pinned by a test, and a
test also pins that without `--text` this check is not made (the ruling says nothing changes there).
If the controller would rather not have it, it is one block and one test to take out.

### The existing guarantees, re-proved for the new mode

| Guarantee (Task 8 ruling) | Test that holds it with `--text` |
|---|---|
| 6 · the profile's leave first; no key looked up, nothing sent | `with --text the profile is still read first, then the usage, then the brief, then the key, and only then is anything sent` |
| 7 · the key found inside the script: environment first, else the one exact line of the keys file; no key → the fixed message; an unreadable keys file → path and code | `with --text the key is still found inside the script…` and the "no key" / `ENOENT` runs of the order test |
| 7 · the command line takes no key | `--text is a switch…` (`--text=<value>` is bad usage; the existing `--key` test is mode-free: the flag parser runs first) |
| 8 / R110 · an answer that holds the key, as written or in JSON's escapes, is saved nowhere; earlier file removed; result line still printed | `with --text an answer that holds the key, as written or in JSON escapes, is saved nowhere, and an earlier answer goes too` |
| 9 · no error body shown or saved; the status and its sentence; a 2xx without text | `with --text a provider's refusal is still its status and one sentence, nothing of its body, and no file` |
| 10 · no redirect followed | `with --text a redirect is still never followed, and a request that never answers still ends at the timeout` |
| 11 · the address rule, the model id, the timeout, each before the brief and the key | the order test: a bad model, three bad addresses, a timeout of 0, a `.json` out, a `text` that is not a boolean — each after the profile and before the brief |
| 12 · the timeout really stops it | the redirect-and-timeout test (CLI, 500 ms, ends within 2.5 s) |
| 13 · the request unchanged | `with --text the answer is written whole…` (method, address, headers, body, for each of four runs) and the gemini test |
| 14 · an earlier run's files removed just before the request, whatever comes back; left alone when nothing is sent | `with --text an earlier run's answer is gone once a request is sent and stays when none is; a file beside it is never this run's to remove` |
| 15 · standard output is the one result line | every CLI run above pins `stdout` whole (`resultLine`, or `''` on a refusal) |
| 16 · exit codes | 0 (the answer written), 1 (refusal, held key), 2 (usage) — each asserted |
| 18 · the script's text | the existing text test, unchanged and green |

New conditions, each with its own test: the three extensions and their case (`with --text, --out names
a .txt, .md or .html file; without it, a .json file as before`), the switch, the guard, the usage
(`the usage gives --text a form of its own, and says what the switch is for`).

### Hand mutation

34 mutations of the new code, each run against `tests/describe.test.mjs`. First pass: 31 killed, 3
survived — the type check on `--out` (an object whose text ends in `.txt`), the guard applied without
`--text`, and the guard moved after the brief is read. I added an assertion for each and ran them
again: **34 of 34 killed.** The list: the type check of `text` dropped · each of `.txt`, `.md`, `.html`
dropped · case-sensitive · no dot · not anchored · `.json` also taken · the out check always the
proposal's, always the text's, either in both modes, swapped · the type check of `--out` dropped · the
guard dropped whole, and each of its three inputs dropped · the guard in both modes · the guard as a
string comparison · the guard after the brief · the raw file removed with `--text` too, never removed
· `--out` not removed before the request · the answer written before the held-key check · the text
branch returning not ok, writing nothing, writing trimmed, adding a newline, dropped, taken in both
modes · the switch not read from the command line, always on, taking a value · the text out check
before the profile.

Not pinned, and why: a write that fails with `--text` (`cannot write …`) is `writeWhole`'s, which the
existing fault-injection test covers; it has no branch of its own in the new mode.

## 3. The eleven rulings

| # | Ruling | Where it is carried out | Test that holds it |
|---|---|---|---|
| 1 | The `setup` tests un-`todo`; description verbatim in double quotes; kit-root sentence; ≤ 200 lines; only paths that exist; the conductor's words | `tests/skills.test.mjs` table; `skills/setup/SKILL.md` header and opening | `the setup skill keeps every rule of a skill` · `in setup the word profile is the project profile, a profession's profile, an id, a path or a flag, as in the conductor` |
| 2 | The token file inside the kit folder, one CSS file beside `kit.css`, first-line comment with source path and commit, rebuilt when tokens change; commands as the scripts take them (`render`, then `shots`) | `references/project-kit.md` §§ 2, 3, 5, 6 | `project-kit.md: the tokens are one CSS file in the kit's own folder…` · `project-kit.md: its specimen proposal is valid, and its drawing command draws it with a kit that imports its tokens, the tokens beside the page` (runs `render.mjs` for real) |
| 3a | Asks whether a brief may be sent out; only on his yes writes the provider, in the card's spelling, with the model id he gives | Steps 4.5 and 4.6 | `an outside engine is the founder's to turn on…` |
| 3b | `keys-file` is a path he gives; never opened, listed, on a command line; never asks for, prints or writes a key — each said in `## Never` | Step 4.5; `## Never`, items 1–3; `## Reads`, last item | `setup never touches a key: each thing it must never do with a key or a keys file is said in Never` |
| 3c | R129, `describe --text` | § 2 above | § 2 above |
| 3d | The engine check for a model: one call of `describe --text` with a one-line brief and `--profile`; exit 0 and the result line are the proof; the file removed; a refusal recorded as the script words it; never `--endpoint` | Step 7, `model:any` | `the engine check covers every engine a card of the kit names…` (the command pinned whole) · the skill rule refuses `--endpoint` |
| 3e | A skill: installed or not; `tool:stitch`: listed or not; a browser: one run of `shots.mjs` on the kit's own `parts.html` | Step 7, the other three items | the same test (it also reads every card's `engine` and fails when the kit gains a kind setup does not check) |
| 4 | A shared machine: a browser only through the kit's scripts; never stop a process by name or pattern | Step 7 (browser); `## Never`; reference § 6 and its Never | `setup never touches a key…` (the rest of Never) · `project-kit.md: each class…` |
| 5 | Five pool folders, each with a one-line `README.md`; stubs from the template, every trait `guess`; the gate says they are guesses | Step 6; `## Gate` | `the project's pool is five folders…` · `the gate: …` |
| 6 | Never invent a design system; with none, `tokens` and `components` empty, the grey kit as it is, Look as a direction; never copy a component | Step 2; `## Never`; reference "What it is" and § 4 | `setup's steps come in the order of its brief…` · `project-kit.md: each class…` |
| 7 | One question at a time; an answer counts once written | Step 4 | `setup asks only what it could not read…` |
| 8 | The design sections read (§ 4.9, § 12 the kit, § 15, § 7's engine rules, § 24), nothing else; exactly the template's keys | — | `a key of the project profile that setup names is a key of the template…` (every code span of lower-case words in both files is a template key, a class, or one of nine listed words) |
| 9 | Plain, short, second person; generic; examples from the room-booking product | both files | the product-name rule; examples: the product sentence, `front-desk-coordinator`, the specimen proposal |
| 10 | `setup` held to the six sections, with the inline sample | `sections: true` in the table; `skillFaults` | `a skill is held to the six sections when it is a stage skill, or when the table gives it them` · `the table holds the eleven skills…` |
| 11 | What is not an output goes to `work/` or outside the project | `<scratch>`, a folder outside the project, removed at the end | `setup reads the project… and writes…` |

## 4. Every command the skill and its reference give

| Where | Command | Checked against |
|---|---|---|
| `SKILL.md`, opening | `node <kit root>/scripts/<name>.mjs` | the kit-root sentence, word for word |
| `SKILL.md`, step 7 | `node <kit root>/scripts/describe.mjs --text --provider <openai\|gemini> --model <id> --brief <scratch>/engine-check.md --out <scratch>/engine-check.txt --profile <packages>/PROFILE.md --timeout 60000` | `describe.mjs --help`, second form: `--text --provider <openai\|gemini> --model <id> --brief <file> --out <file.txt> --profile <PROFILE.md> [--endpoint <url>] [--timeout <ms>]` |
| `SKILL.md`, step 7 | `node <kit root>/scripts/shots.mjs <kit root>/kit/grey/parts.html --out <scratch>/browser --widths 1280` | `shots.mjs --help`: `<file or folder>... --out <folder> --widths <w,w...> [--themes light,dark] …` |
| `project-kit.md`, § 5 | `node <kit root>/scripts/render.mjs <scratch>/kit-check.json --kit <packages>/kit --out <scratch>/drawn/kit-check.html` | `render.mjs --help`: `<proposal.json> --kit <kit dir> --out <file.html> [--letter A]`; and run for real by a test |
| `project-kit.md`, § 6 | `node <kit root>/scripts/shots.mjs <packages>/kit/parts.html <scratch>/drawn/kit-check.html --out <scratch>/pictures --widths 1280,390 --themes light,dark` | `shots.mjs --help`, as above |

All five pass the rule of Task 13 (`commandFaults`, against each script's live `--help`). Beyond the
tests, I ran the two commands of the reference and the browser check by hand, on a made-up project kit
in my scratch folder outside the repository: the page was drawn with `kit.css` and `tokens.css` beside
it, eight pictures were taken, and the primary action wore the token's colour. I also ran the failing
case the reference describes: a `kit.css` that imports tokens from elsewhere in the project. Its
`parts.html` pictures fine and the drawn page fails with `error: …/kit-check.html: ../../src/tokens.css
did not load: net::ERR_FILE_NOT_FOUND`, exit 1 — which is why the reference pictures the drawn page too.
The `describe --text` command was not run by hand: it has no `--endpoint`, so it would reach a real
provider. Its form is held by the rule, and its behaviour by the describe tests.

## 5. Tests: RED, then GREEN

| Step | Result |
|---|---|
| `--text` tests added, before the flag | `tests/describe.test.mjs`: 60 tests, 48 pass, **12 fail** (the 12 new ones) |
| the flag written | 60 pass, 0 fail |
| the pool test for the card, before the paragraph | `tests/pool.test.mjs`: 87 tests, **1 fail** |
| the paragraph written | 87 pass |
| `npm test` before commit 1 | 675 tests · 664 pass · 0 fail · 1 skipped · 10 todo |
| setup's tests live, before the skill | `tests/skills.test.mjs`: 77 tests, **16 fail** (the rule test and 15 of setup's own), 9 todo |
| the skill and its reference written | 77 tests · 68 pass · 0 fail · 9 todo |
| `npm test` before commit 2, run again after the last edit | 690 tests · 680 pass · 0 fail · 1 skipped · 9 todo |

The nine other skills are still `todo`, each naming its task. The one skip is the existing
permissions test on this mount. The output is pristine: no warning, nothing left under `tests/.tmp/`.

Hand mutation of the skill, its reference and the section rule: 30 mutations, **30 killed** — the
engine-check command without `--text`, with `--endpoint`, without `--profile`, with a `.json` out; a
mistyped key of the profile; a script run without `<kit root>`; `shots` without `--widths`; a path of
the kit that is not there; Gate before Steps; 201 lines; the description, the kit-root sentence and a
product name; three of the key rules of Never dropped, one at a time; a README row dropped; the guess
mark dropped; the gate calling the stubs something else; a bare "profile"; in the reference, `render`
without `--kit`, a class dropped, a class invented, a specimen with an unknown role, tokens linked from
outside the kit, a first line without its commit, a flag `shots` does not have; and in the test file,
the rule not holding setup to the six, holding every skill to them, and the table without the flag.

## 6. Self-review

**Read as a session in a project never set up.** It knows what to read (the project; seven named
files of the kit), what to ask and in what order (six numbered questions, each naming the key or the
section its answer goes to), what to write where (the Writes table), what it must never do with a key
(Reads, step 4.5, three items of Never), and when it is done (`## Reviewed by the founder` written,
`<scratch>` removed, back to the conductor).

**Keys, the skill.** I looked for any step where a session would open, list or name a keys file, or
see a key. Two were not covered by my first draft, and now are: reading the project could meet a
dotenv file (Reads: passed over, unopened), and writing `keys-file` into the profile through a shell
command would put the path on a command line (Never: with a file tool, never with a command). A
refusal of the script may name the keys file's path; that path is already in the profile, and the
script never shows a value.

**Keys, the tests.** Every assertion about a key compares and prints true or false; a failed
`assert.equal(r.stderr, …)` is reached only after `run()` has asserted, as a boolean, that the made-up
key is in neither stream. Every `describe()` call goes through `call()` with a made environment, every
run of the command through `childEnv`. No test names a real file; the dotenv files are the made-up
ones the existing helper writes under `tests/.tmp/`. One thing to know: the new pool test asks
`describe.mjs` for `--help` with the environment it inherits, exactly as `tests/skills.test.mjs` has
done for every script since Task 13. `--help` returns before the profile, the brief or a key is
looked at, and nothing of the environment is read on that path.

**One call of mine was denied by this machine's guard**, and I stopped there. It was a shell heredoc
appending test code; the text of one assertion spelled a credentials-file name as a pattern the skill
must never mention. Nothing ran and no file was touched. I did not look for another way to run it: I
took that pattern out of the test (the two patterns the conductor's own test uses carry the point) and
wrote the block with the file tool.

## 7. Concerns, for the controller

1. **The `--out` guard with `--text`** (§ 2) goes beyond R129's letter. I think the change needs it;
   it is easy to remove.
2. **Two sections setup adds to the project profile** that the template does not have: `## Engine
   check` (Task 15's ruling 7 has Frame read "the profile's engine check (written by setup)", and the
   template has no place for it) and `## Reviewed by the founder` (the conductor's rule 2: an approval
   only in the chat is not one; it also tells a finished setup from one left halfway). The template
   itself is untouched, as its test pins its headings. If the template should carry them, that is a
   small change to `templates/project/PROFILE.md` and its test.
3. **A `README.md` in each folder of the project's pool** (ruling 5) sits where Task 15's
   `scripts/card.mjs check` will look for cards: it must pass over `README.md`, or it reports five
   faults in every project.
4. **The `profiles/` README points to `templates/people/PROFILE-CARD.md`**, not to
   `pool/CARD-FORMAT.md` as ruling 5 words it: the card format describes seats and persons, and a
   profession's profile has its template. The other four say what the ruling says.
5. **The browser check runs on the kit's own `kit/grey/parts.html`**, as ruling 3 words it, not on the
   project kit's page: so a broken project kit is not mistaken for a missing browser. The project
   kit's pictures are a separate run, in the reference.
6. **Setup's scratch is outside the project** (a folder in the system's temporary folder), since no
   package exists yet to hold a `work/`. The pictures for the founder's look are there too; they are
   not an output of setup.
7. **`--timeout 60000`** on the engine check: a one-word answer should not hold a session for the
   script's default five minutes.
8. **The stubs:** the brief says every trait is marked *guess*; the template's evidence field also
   allows *unknown*. The skill marks every characteristic `guess` and writes "Not known yet." in a
   field nobody spoke to, so nothing is invented.


---

# Fix report — round 1

Worked from `task-14-fix-1.md`, whole. Two commits on `v2-pipeline`, nothing pushed, nothing amended.

| Commit | Subject |
|---|---|
| `b6649b4` | fix: an unfinished setup is still setup's, and the profile template owns its sections |
| `e52d47f` | fix: describe never writes over what it reads |

## What changed, finding by finding

| Finding | What changed | Test that holds it |
|---|---|---|
| **I1** an interrupted setup skips the gate | `skills/design/SKILL.md`, question 1: "When the project has no project profile, or one whose `## Reviewed by the founder` section is empty, invoke `ux:setup` first." `skills/setup/SKILL.md` says the same in its opening, and step 1 says what empty is: nothing under the heading, or only the template's instruction. With his words there, setup stops; without them it goes on from the first step whose output is missing. | `the conductor gives the nine stages in order… and setup first when the project has no project profile or one the founder never reviewed` · `setup has the six sections…` (the opening) · `setup's steps come in the order of its brief…` (step 1) |
| **I2** the template owns both sections | `templates/project/PROFILE.md` ends with `## Engine check` (one instruction of two lines: the day, then a table Seat · Engine · What the check found, a row for each seat) and, last, `## Reviewed by the founder` (his corrections in his words; empty until the gate). Setup's step 7 now says "Fill the `## Engine check` section", in those three columns, a row for each seat; the gate says "write under `## Reviewed by the founder`, the last section"; step 3 holds that section empty until the gate; the Writes table says "the last two sections of the project profile". | `project/PROFILE.md parses, has every header key, and turns nothing on` (the seven headings, both instructions) · `a key of the project profile that setup names…` (turned around: both are sections of the template, the last two, and setup's text no longer says "after the template's sections" or "as the last section") · `the engine check covers…` · `the gate: …` |
| **M1** the professions' answer has nowhere to go | Question 4: each profession he names gets its stub at once, written from the template as step 6 says; the stubs are where this answer lives; when he names none, no stub is written. Step 6 now says the folders hold a README "and nothing else, but for the stubs in `profiles/`", and describes a stub rather than writing them there. | `setup asks only what it could not read…` · `the project's pool is five folders…` |
| **M2** `keys-file` | Step 3: "`keys-file` stays empty until he gives a path, and a credentials file you came across while reading the project is never opened and never written here." Question 5: "A path inside the repository is not taken: say so, and ask him for one outside it. Comparing two paths opens nothing." | `an outside engine is the founder's to turn on…` |
| **M3** no design system, one wording | Skill, step 5: "With no design system: the copy, then the drawing and the pictures." Reference: "…gets the grey kit as it is: the copy, then the drawing and the pictures, which are step 1 and steps 5 and 6." | `setup's steps come in the order of its brief…` (both sentences) · `project-kit.md: each class…` |
| **M4** the packages question first | Step 3 opens with it: "First, where it goes: … ask him where the packages go before you write anything", then the copy. | `setup's steps come in the order of its brief…` (the two, in order) |
| **M5** language codes | Question 2: "He names them; you write their codes as `languages`, as `[es, en]`, and show him the line." | `setup asks only what it could not read…` |
| **M6** a dark theme switched by a class or an attribute | Reference § 2, a bullet of its own: a plain copy never applies under `prefers-color-scheme: dark`, the dark pictures come out light; the file is then an export, the dark set placed under the media query, and the first line says it was exported, from what, and how. | `project-kit.md: the tokens are one CSS file…` |
| **M7** uncommitted token changes | Reference § 2: check first (`git status --short <the file>` prints a line when it has changes); the first line then says "with uncommitted changes" after the commit. | the same test |
| **M8** the contract | `kit/KIT-CONTRACT.md`, "The rule": "It is one stylesheet that imports the project's tokens from a file of the kit's own folder: setup copies the project's token file there, or exports it when the tokens are not plain CSS, and records on its first line where it came from." | the same test (the sentence, and that "links the project's real token file" is gone) |
| **M9** four wordings | Where a skill is looked for: "the skills and the plugins the session lists, then in the project's `.claude/skills/` and the user's `~/.claude/skills/`". `HELD_KEY`: "the answer held the key, so nothing of it was saved: no file was written" (true with `--text` and without). The `persons/` README: "The people this product is designed for, each of a profession that has its file in `profiles/`: a card is written to…". Step 8: both titles take the product's name from his sentence under `product`; when that sentence names none, ask him. | `the engine check covers…` · the five held-key tests of `tests/describe.test.mjs`, through their one constant · `the project's pool is five folders…` · `setup asks only what it could not read…` |
| **The `--out` guard in both modes** | `scripts/describe.mjs`: the check that `--out` is not the brief, the profile or the keys file is made with `--text` and without, as bad usage, after the profile and before the brief is read or any key looked up. The usage and the header comment say so. | `--out is never the brief, the profile or the keys file, with --text or without: the answer would take its place` — each of the three inputs, in each mode (inputs named `.md` with `--text`, `.json` without), with and without a key in the environment, no key looked up, the file as it was, the command exit 2, said before a missing brief, and a file beside them written normally. The assertion of round 0 that pinned the old behaviour without `--text` is gone. |

Line counts: `skills/setup/SKILL.md` 199 (two lines of `## Never` were shortened by a clause each to stay
within 200; no rule was dropped, and the tests of Never are unchanged), `skills/design/SKILL.md` 187,
`skills/setup/references/project-kit.md` 182.

## Tests

| Step | Result |
|---|---|
| The tests of the first commit, before any other file was touched | `tests/skills.test.mjs` + `tests/templates.test.mjs`: 124 tests, **12 fail** |
| The template, the contract, the conductor's line, the skill and the reference edited | 124 tests · 115 pass · 0 fail · 9 todo |
| The tests of the second commit, before the script was touched | `tests/describe.test.mjs`: 60 tests, **6 fail** (five on the sentence, one on the guard) |
| The script edited | 60 pass |
| `npm test`, once, after the last edit | 690 tests · 680 pass · 0 fail · 1 skipped · 9 todo |

Hand mutation, this round: 24 of the skills, the template and the contract, **24 killed** (the
conductor's line and setup's opening back to "no project profile" alone; step 1 taking a file for a
finished setup; the packages question after the copy; the `keys-file` sentence, the empty review, the
codes, the stubs, the path inside the repository, each dropped; the two wordings of M3 made to differ,
either side; the folders not named; the engine check added as a section, and by engine; the gate adding
its section; the name with no source; the old `persons/` line; 201 lines; the dark-theme bullet and the
uncommitted-changes sentence dropped; the template without `## Engine check`, with the review not last,
with the review to be filled at once; the contract's old sentence). 10 of the script, **10 killed** (the
guard with `--text` only, without `--text` only, dropped, each of its three inputs dropped, as a string
comparison, after the brief is read, after the key is found; the old sentence).

Section A held throughout: no run of `describe` without a loopback `--endpoint` to a server the test
started, every key made up, no environment printed, no real file of keys opened or named. The two
files of made-up keys this round's guard test writes are under `tests/.tmp/`, named `fake-dotenv.md`
and `fake-dotenv.json`.

## Choices in this round the controller may want to see

1. **The browser has one line under the engine check's table.** The ruling gives the table as a row for
   each seat; the browser is checked too (ruling 3 of the task) and is no seat, so the template and the
   skill put it in one line under the table.
2. **What "empty" is, is said in setup, not in the conductor.** The conductor's line is the ruling's
   words. Setup's step 1 adds "nothing under the heading, or only the template's instruction", for the
   moment between the copy and the first edit; step 3 then holds the section empty until the gate.
3. **The product's name.** The `product` key holds a sentence, and the kit's own example sentence names
   no product. So: the name is the one in his sentence, and when it names none, that is one more
   question.
4. **"None" as the answer to the professions** leaves no stub, so on a setup picked up later that one
   question may be asked again. I did not add a place to record it.
5. **`docs/design/…` § 12** still says a project kit "links the project's real token file". It is the
   design, not a file of this round; the contract and the reference now agree with ruling 2.


---

# Fix report — after the re-review

The four points of the re-review, in two commits on `v2-pipeline`. Nothing pushed, nothing amended.

| Commit | Subject |
|---|---|
| `88ec305` | fix: a profile he never reviewed is setup's, however the section is written |
| `b799d2f` | fix: describe guards the raw file too |

## What changed, point by point

| Point | What changed | Test that holds it |
|---|---|---|
| **1** the conductor's "empty" | `skills/design/SKILL.md`, question 1, one line: "…no project profile, or one whose `## Reviewed by the founder` section is missing or holds none of his words, invoke `ux:setup` first." No other line of the conductor moved; its description and its kit-root sentence are untouched. `skills/setup/SKILL.md`: the opening says it in the same words; step 1 names the cases ("no such heading, or under it nothing, the template's instruction, or a line that is not his"); step 3 says the last section "stays empty until the gate: the rule for an instruction you cannot answer does not apply to it, and nothing is written there before his words"; the gate says "until his words are there the project is not set up". | One constant in `tests/skills.test.mjs`, `UNREVIEWED`, holds the words, and both skills are held to it: `the conductor gives the nine stages in order…` (and that "section is empty" is gone from the conductor) · `setup has the six sections…` (the opening, and the same words in the conductor) · `setup's steps come in the order of its brief…` (step 1) · `an outside engine is the founder's to turn on…` (step 3: the rule, then its exception, in that order) · `the gate: …` |
| **4** two lines of `## Never` | "…and never run the project's own build or its components to draw the kit." and "`engines-on` holds what the founder said yes to, in his own answer, and nothing else." | `setup never touches a key…` · `an outside engine is the founder's to turn on…` |
| **2** the raw file | `scripts/describe.mjs`: without `--text`, the check also holds `rawOf(outPath)` against the brief, the profile and the keys file. It is bad usage (exit 2), said in the same place as the check of `--out`: after the profile, before the brief is read and before any key is looked up. The message: "the raw file beside --out, <out>.raw.txt, is the brief itself: it would be removed, or an answer written over it". With `--text` no raw file is cleared or written, so nothing is checked there. | `without --text the raw file beside --out is none of them either: it too is cleared just before the request` — each of the three inputs named as the raw file of an `--out`, with and without a key in the environment, no key looked up, the file as it was, nothing at `--out`; the command exits 2; the brief written another way is still the same file; said before a missing brief; with `--text` the same naming goes ahead and the brief is as it was; without `--text` an `--out` with a raw file of its own goes ahead. |
| **3** the usage | The lines under `--out`: "With --text, where the answer is written: a .txt, .md or .html file. In either mode --out is never the brief, the profile or the keys file, and without --text neither is the raw file beside it: each would be written over". The header comment says the same. | `the usage gives --text a form of its own, and says what the switch is for` (the sentence, and that "Never" no longer follows the `--text` sentence) |

`skills/setup/SKILL.md` is 198 lines. To restore the two lines of Never and add the sentence of step 3
within 200, three lines were taken back without dropping anything said: "You design nothing here and
decide nothing for him: you read, you ask, you write down." joined the opening paragraph; the first
item of Reads lost a line of wrapping; and "Frame makes the first package." became "Frame makes the
first." `skills/design/SKILL.md` is 187 lines, as before.

## Tests

| Step | Result |
|---|---|
| The pins of the first commit, before either skill was touched | `tests/skills.test.mjs`: 77 tests, **6 fail** |
| The two skills edited | 77 tests · 68 pass · 0 fail · 9 todo; with `tests/templates.test.mjs`: 124 tests · 115 pass · 0 fail · 9 todo |
| The test of the raw file and the pin of the usage, before the script was touched | `tests/describe.test.mjs`: 61 tests, **2 fail** — the first with "the run was not refused": the door was open |
| The script edited | 61 pass |
| The three files that read the script, at the end | `describe`, `skills`, `pool`: 225 tests · 216 pass · 0 fail · 9 todo |

`npm test` was not run, as the round says.

Hand mutation: 10 of the two skills, **10 killed** (the conductor's line back to "is empty", without
"is missing", without "none of his words"; setup's opening in other words; step 1 without the missing
heading, and without the line that is not his; step 3 without its exception; each of the two lines of
Never shortened again; the gate back to "empty"). 8 of the script: 7 killed at first, and one survived —
the raw check as a comparison of the two paths' text. I added the case of a brief written another way
and ran it again: **8 of 8 killed** (the raw check dropped, made with `--text` too, made with `--text`
only, looking at `--out` again, as a comparison of text, moved after the brief is read, moved after the
key is found; the usage as it was).

Section A held: every run of `describe` in the tests passed a loopback `--endpoint` to a server the
test started, with a made-up key in an environment the test built; nothing printed the environment;
the one file of made-up keys the new test writes is `fake-dotenv.json.raw.txt`, under `tests/.tmp/`.

One slip of mine, with no effect: my first commit command of this round ended on a count that printed
zero, which stopped the chain before anything was staged. I saw it in the log, staged the same three
files by path and committed. Nothing was amended.
