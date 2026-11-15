# Task 20, step 5b · fix round 1 · report

The round that fixes what the two reviews of the three fix waves found: `W1`–`W4`, `M1`–`M11`
(`task-20-fix-review-words.md`) and `S1`–`S16` (`task-20-fix-review-scripts.md`), as
`task-20-fix-round-1.md` rules them. Branch `v2-pipeline`, on top of `c089a33`. Not pushed by this run. The design
document is not touched.

**30 of the 31 findings are fixed. One is not, as ruled: M11.** R173, which the round's page also lists
under "Not changed", is no finding: it stands as built. Eight things are for the controller to know,
under "Concerns", and one more that is not about the kit: **the branch was pushed while this round
ran, and not by it** (under "Found, and not mine to fix").

Paths are from the kit's root. A script change was made test-first: the test named was written and
seen to fail for the reason given, then the change was made. "Mutations" are hand changes to the new
code or the new words, one at a time, each put back: one is *caught* when a test fails on it.

## Critical

| Finding | Files changed | What changed, in a line | The test, or the pin |
|---|---|---|---|
| **S1** (with **S16**) | `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md`, `tests/skills.test.mjs` | Step 3 runs `alone.mjs <package>/07-handoff` alone and "must exit 0". The `--package` run ends step 7, once the folder's last file is written and before the cold implementer starts, and is run again when a file changes at step 9. `folder.md` says where it runs, and why it could not pass at step 3. | **Pins changed:** step 3's fenced command; the R148 pin (the plain command, in both files); the stage's list of commands. **Pins added:** step 7 holds the proof and its order before step 8; `folder.md`'s sentence and fence. **The run as written:** the package now holds a root `DECISIONS.md`, as Frame starts it; the folder holds `accept-inpage.js` (S16), and what the skill's table lists is held to what the folder holds; the address check passes at step 3; **the probe:** run at step 3 the `--package` check exits 1 on `DECISIONS.md`, in `HANDOFF.md` and the guide; run where the skill runs it, with every file written, it passes. 11 mutations of the three files, all caught. |
| **S2 · W2 · S7** | `skills/structure/references/rounds.md`, `skills/design/references/blind.md`, `tests/skills.test.mjs` | The redrawn pick of a graft is drawn a second time with `--without-notes`, to `chosen/chosen-screens.html`, and pictured with `--first-screen`. An audience reading it again is handed those pictures, whole and first screen, and no other. `blind.md` steps 5 and 6 say what is drawn and pictured, twice each, and point to step 7 of the Structure skill for the commands; step 7 says who is handed which. Rule 6 of the same page says "those drawn without the makers' notes". | **Pin on each:** `rounds.md`'s three commands (each held to its script's usage), its step 2 and the audience's sentence; `blind.md` steps 5 to 7. **Pins changed:** the conductor no longer gives `render.mjs` or `shots.mjs` (they are asserted to be Structure's alone); `blind.md`'s shots command. **The run as written** draws the graft both ways and holds the second page to carry no note. 3 mutations of `rounds.md`, all caught. |

## Important

| Finding | Files changed | What changed, in a line | The test, or the pin |
|---|---|---|---|
| **W1 → R189**, with **M8** | `skills/acceptance/references/driving.md`, `skills/acceptance/SKILL.md`, `skills/setup/SKILL.md`, `templates/project/PROFILE.md`, `tests/skills.test.mjs` | The section opens: the kit can write a driver only for a build that opens as files, since its library opens local files and nothing else. A build that needs a server or a sign-in has none the kit can write: he is told, open, and the stage stops, as step 2 stops on a credential. The bullet that took a sign-in "from where it is kept" is gone: the driver "holds no sign-in, and makes none". M8: one question, with the path named in it; his answer written under "Reviewed by the founder" of `REPORT.md` before the driver is; `scripts/lib/browser.mjs` in the skill's Reads. One Never line added to the skill. Setup and the profile template say "for a build that opens as files". | **Pins changed** with the rule: the step's sentence, the section's question and its sign-in bullet, the accounts bullet, setup's sentence, the template's. **Pins added:** the section's first sentence, the stop, the path, his yes first, the Reads line, the Never line, and that the library holds `pathToFileURL` and no `http`. 5 mutations, all caught. |
| **W3** | `skills/handoff/SKILL.md`, `skills/handoff/references/seats.md`, `tests/skills.test.mjs` | A default is written only where his answer for that entry takes it. One he leaves unanswered stays open: listed under `findings`, as open, and named in the gate's question. Said in step 9, in the table of the seats page, in a bullet of its own ("You never fill in an answer he did not give"), under "The re-read" and in Never. | **Pins changed:** step 9's last sentence, the table's row. **Pins added:** the bullet, the re-read's sentence, the gate's "which names each item and each pointer still open", the Never line, and that neither file says "Where he leaves one open". 5 mutations, all caught. |
| **S3** | the same two files of Handoff, with `folder.md` | The `--package` run may exit 1 only so: every place left is in a file approved earlier and copied in unchanged, each listed in `PARTS.md`, which never writes the name the pointer points to. Then the stage goes on, and those places go to him with the gate, as open findings named in its question. Any other place is mended first. Said in step 7 of the skill and under "When it may exit 1" of `folder.md`; the `PARTS.md` section says "never the name it points to". | **Pins added** on each sentence. **The run as written:** with a pointer in an approved stylesheet and a line of `PARTS.md` that does not name the file, the one place left is the stylesheet's; written with the name, `PARTS.md` is one place more. 3 mutations of `folder.md`, all caught. |
| **S4**, with **S12** and **S13** | `scripts/lib/card.mjs`, `scripts/card.mjs`, `templates/people/PROFILE-CARD.md`, `tests/pool.test.mjs`, `tests/templates.test.mjs` | `check` refuses a block inside a characteristic, and inside a `####` of a specialty, that opens with none of the four labels. S13: a fault of a profile names a line by its number in the file and a field by its label, and never prints the line; `--help` says both. S12: the two sentences of the template are worded "written as those above are". | **Written first, failing:** `a characteristic holds no block that opens with none of the four labels…` (the list after a blank line; `traits` refused through `check`; a paragraph, a table, a comment; under a heading with no blank line; in a specialty; CRLF; a longer header) and the command's test. **Pins changed** with the rule: three "one fault" pins are now two faults (a misspelt label also opens a block with no label); the two messages that quoted a line; the usage. A helper holds that no fault quotes the profile. 15 mutations, all caught. Every fixture profile still prints `ok`. |
| **W4 · S14** | `docs/design/DRY-RUN.md` | The rulings run `R157` to `R190`, with a row for each of R186 to R190. The "wave B" sentence is replaced by one on the three waves, the two reviews and this round. R175's row says the page draws the heading (R186); F46's row names the two sections; F48's row names four seats pages; R161's row counts three ids; R180's row says where the check runs and when it may exit 1; R159's row is brought to R189. Rows changed for this round: R162, R164, R170, R171, R174, three cells of "Stage by stage", F43, F55, F65, F92, F100, and "The driver a conductor writes". The count of skills at the limit is seven of eleven. | No test reads the page. |

## Minor

| Finding | Files changed | What changed, in a line | The test, or the pin |
|---|---|---|---|
| **S5** | `scripts/inpage/accept-inpage.js`, its copy in `evals/cold-implementer-finds-the-gap/fixture/…/07-handoff/`, `tests/accept.test.mjs` | An element that is not laid out in a line and takes its place in the page (not `display: none`, not inside what is not shown) parts the texts on either side, even when it is empty: a rule, an empty block, a picture drawn as a block. The header says so in place of "adds nothing". | **Written first, failing** on `Room 5free`: `text: an element that is not laid out in a line parts the texts on either side of it…`, eleven cases. 5 mutations, all caught. The fixture's copy is held equal by `tests/evals.test.mjs`. |
| **S6 · M5 → R190** | `skills/design/references/loop.md`, `templates/briefs/audience.md`, `templates/briefs/judge.md`, `skills/detail/references/seats.md`, `skills/look/references/seats.md`, `skills/look/SKILL.md`, `pool/audiences/task-reader.md` | The loop and the audience's brief say "at Structure"; the brief's instruction is two, and the second is deleted from Detail on. A judge's brief from Detail on carries a line for each criterion that says "without scrolling": at Detail, that the `in-viewport` check Look adds answers it; at Look, the check's id and what the run returned. Look's step 5 has the conductor add that check to `checks.json` before the first run. | **Pins added** on each sentence, and that Structure is the one stage whose commands take `--first-screen`. 3 mutations of the loop, all caught. |
| **S8** | `scripts/lib/frontmatter.mjs`, `scripts/lib/state.mjs`, `tests/frontmatter.test.mjs`, `tests/state.test.mjs` | `oneLine` maps `\x0b`, `\x0c` and `\x85` to a space. `writeString` refuses a control character other than the tab, and U+0085 as a line break. `writeItem` refuses an item that must be quoted and holds a backslash. The header's claim stands as worded, and now says what is refused. | **Written first, failing:** three tests of the library, two of the state. **Pin changed:** the list item `a\b, c`, which was written in double quotes, is now refused. 9 mutations, all caught. By hand, not in the suite: 18,341 headers written by `serialize`, every one read back the same by the machine's YAML reader. |
| **S9** | `scripts/alone.mjs`, `tests/alone.test.mjs` | Entries are listed with `lstat`, and no link is followed or read. A link that leads inside the folder is passed over; one that leads out of it, or nowhere, is printed and makes the exit 1. `--help` says what a link is, and what is not found (`%20`, UTF-16). A `--package` inside the folder is bad usage. | **Written first, failing:** `--package: a symbolic link in the folder is never followed…`, and three lines of the usage test. **Pin changed:** `pointers()` returns `links` too. 11 mutations, all caught. |
| **S10** | `kit/KIT-CONTRACT.md`, `tests/render.test.mjs` | One sentence: drawn without the makers' notes, the header is the `<h1>` alone and no `ux-note` is drawn. | Pin added, with the page the script draws beside it. |
| **S11** | `skills/setup/SKILL.md`, `skills/context/SKILL.md`, `tests/skills.test.mjs` | Setup's line for `profiles/` ends "and checked with the kit's `scripts/card.mjs`". Context runs `card.mjs check` on each profile it drafted or changed, before the gate and again after his corrections. | **Pin changed:** the four folders whose line names the check are five. **Pins added:** the command, as the script takes it, and its sentence. |
| **S15** | `skills/design/references/loop.md` | § 7 names the "Accepted deviations" heading among the page's parts. | Pin added. 1 mutation, caught. |
| **M1** | `skills/context/SKILL.md`, `templates/package/01-context.md`, `pool/makers/prototype-builder.md` | "Project sources" marks "the example data" as it marks today's screen, in the skill and the template. The builder's card: handed none, it leaves the row out and says so in its reply, and the conductor asks him. | **Pin changed** (the sentence gains the third mark); pins added on the template and the card. |
| **M2** | `skills/structure/SKILL.md`, `skills/detail/SKILL.md` | "its model and effort". | Two pins changed with it. |
| **M3** | `LESSONS.md`, `tests/skeleton.test.mjs` | A twelfth entry answers the seeded one: his words are asked for once, at every design. The seeded entry stands as written. | **Pin changed:** the entries are the eleven of the seed and what was learned since; pins added on the answer, and on the seeded entry staying. See concern 7. |
| **M4** | `templates/briefs/judge.md` | The reply line stops after "says the reply is". | Pin added. |
| **M6** | seven cards of `pool/judges/` | "write it once, as "accepted at <stage>", with no fix and no severity of its own." | Pin added, for each judge but the cold implementer, whose line is its own. |
| **M7** | `skills/detail/references/seats.md` | The line under the designer's list gives each outcome in full, the answer's number only beside it, and says why. | **Pin changed** with the rule. |
| **M9** | `skills/detail/SKILL.md`, `skills/design/references/loop.md` | An unanswered entry is listed under `findings` on the decision page, and named in the gate's question. | **Pin changed** (Detail's sentence); pin added (the loop's). 1 mutation, caught. |
| **M10** | `loop.md`, `lessons.md`, `context/SKILL.md`, `structure/SKILL.md`, `handoff/references/folder.md`, `detail/references/seats.md`, `look/SKILL.md`, `setup/SKILL.md`, `pool/judges/truth.md`, `pool/makers/interaction-designer.md`, `pool/makers/interface-writer.md` | Each line named is rewrapped. No pin holds a line break. | None. |

## Not done, and why

| Finding | Why |
|---|---|
| **M11** | As ruled: the three fixtures keep the cast sheet's old column names. A fixture is a package stamped by an earlier kit. |
| R173 (no finding: the scripts review's answer to the implementer's first concern) | As ruled: it stands as built. Nothing was changed. |

## Concerns

1. **Seven skills now stand at 200 lines, and the room came from blank lines.** Handoff needed seven
   lines and has no sentence that no test holds. No pin was dropped for room. What went: a blank line
   after a code fence (Handoff 2, Look 2, Context 2), the one between Handoff's gate paragraph and its
   list, and the one under Handoff's `## Question`. Each renders as before. Step 7's proof is given as
   a code span on a line of its own, not as a fence, for the same reason.
2. **R190, who writes the check.** I followed the ruling's letter: at Look the conductor adds the
   `in-viewport` check to `checks.json`, which is otherwise the visual designer's file. The other
   reading is that the designer's brief carries the criterion and the designer writes it. Three things
   follow from the letter. A judge at Look is told the result in its brief, since `results.json` is
   not among any judge's reads. At Detail nothing is measured: the brief only says which check will
   answer. And a variant's own `checks.json` gets no such check.
3. **S9 goes past "say what a link is".** A link that leads out of the folder, or nowhere, is printed
   and fails the run: it is a way out that the builder would get. `folder.md` says what to do with one.
4. **S8 goes a little past its letter.** DEL and the C1 characters are refused with the C0 ones: the
   YAML reader refuses them too, and the header's claim would otherwise be untrue. And a header that
   cannot be written is now a refusal of the state script in one line ("the header of frame cannot be
   written: …"), where it would have been a stack trace.
5. **S4 makes one mistake two faults.** A label misspelt or indented is reported as a field that is
   lacking and as a block that opens with no label. I left both: together they give the line.
6. **Two cards are at 133 lines** (`accessibility.md`, `profile.md`), one over what the review counted,
   from M6's ruled words. No test limits a card.
7. **M3 changes one sentence of the head of `LESSONS.md`.** The new entry has the seed's date, so "The
   entries of 2026-11-15 are the seed" became "The first eleven entries…". No entry is rewritten.
8. **The profile template's instruction for the browser check is reworded to fit two lines**, which a
   test requires: "How a page of this project is looked at: the command or script, and what it sets
   (width, theme, reduced motion)", then the R189 sentence.

## Found, and not mine to fix

- **`origin/v2-pipeline` moved during this round, by a push this run did not make.** The local record
  of the remote says "update by push" at 11:04:53 on 2026-11-15, to `4ec9ce9`, between this round's
  fifth commit (11:02:01) and its sixth (11:05:08). No command of this run pushes, the worktree has no
  hook, and the same record shows two earlier pushes of the branch on 2026-11-14. So the remote holds
  the first five commits of this round, before the full suite had run on them, and the last four are
  local only. I pushed nothing, and moved nothing back.
- **The design document** still says, at its lines 1055 and 1059, what R159 and R171 ruled: R189 and
  R190 are the controller's to write in.
- **Fixtures.** The seven profiles of the evaluation fixtures keep the two "four fields" sentences S12
  reworded in the template, and the traits copy of `audience-stays-blind` predates the command. As
  M11: stamped by an earlier kit.
- `skills/handoff/SKILL.md:19` is 116 characters, and was not among M10's lines.
- The evaluation suite was not run: it starts sessions. Its test file passes.

## Tests

- `NODE_OPTIONS=--dns-result-order=ipv4first npm test`, once, after the last change: **880 tests · 879 pass · 0 fail · 1 skipped** (the folder-mode test this mount skips) · exit 0, in 223 s. It was 873 before this round: 7 tests added.
- By file, where this round added tests: `tests/frontmatter.test.mjs` 36 (was 34) ·
  `tests/state.test.mjs` 107 (105) · `tests/pool.test.mjs` 116 (115) · `tests/alone.test.mjs` 35 (34) ·
  `tests/accept.test.mjs` 62 (61). `tests/skills.test.mjs` 139, `tests/templates.test.mjs` 49,
  `tests/skeleton.test.mjs`, `tests/render.test.mjs` 39 and `tests/evals.test.mjs` 17 hold the same
  number, with pins changed and assertions added.
- `claude plugin validate . --strict` → "Validation passed", exit 0.
- Lines: seven skills at 200, none over. Cards: 133 at most.
- `git status --short` → clean.
- No sub-agent was started, nothing was installed, no keys file was opened or named, and no provider
  was contacted. Browser tests were run one command at a time, each browser started and stopped by the
  script's own handle; no process was stopped by name.

## Commits

On `v2-pipeline`, none pushed by this run, each with the two trailer lines:

```
65aacd5 fix: a header holds no control character, and a pasted soft break is a line break (S8)
1f50eaf fix: a criterion written over two blocks is refused, and a fault of a profile never quotes it (S4, S12, S13)
533b3d0 fix: alone.mjs --package follows no link, and refuses a package inside the folder (S9)
7c857b0 fix: the text check reads an empty block between two texts as she sees it (S5)
4ec9ce9 fix: Handoff proves that nothing points back once the folder is written, and fills in no answer he did not give (S1, S3, S16, W3)
970146c fix: an audience re-reading a graft sees no maker's note, and the blind protocol keeps no second copy of the commands (S2, W2, S7)
46bc340 fix: the kit writes a driver only for a build that opens as files, on a yes written first (R189, W1, M8)
0c18377 fix: a first screen is pictured at Structure only, and the minors of the two reviews (R190, S6, S10, S11, S15, M1 to M7, M9, M10)
3f4654d docs: the dry run's document, true to the rulings to R190 and to what the reviews' round changed (W4, S14)
```

Fixed: 30 of 31 (W1 to W4, M1 to M10, S1 to S16). Not fixed: 1 (M11, as ruled).
