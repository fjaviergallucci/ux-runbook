# The last touch: the six minors of the last re-review

Branch `v2-pipeline`, on `8b3f93d`. One commit, `6baebc7 fix: the six minors of the last re-review`;
nothing pushed. This report is not in it: its folder is ignored by git.

Test line, whole suite, once: **912 tests, 911 pass, 1 skipped, 0 fail, 211 s** (the same count as
before: only assertions were added, and no test). `claude plugin validate . --strict` → exit 0, with the
icon warning that predates this. `git status --short` → clean.

Every new or moved pin was mutated by hand once (the mutation written in, the test file run, the file
put back): 15 mutations, all caught (list at the end).

## Each item

| Item | Files | What changed | Pins |
|---|---|---|---|
| **N1** | `skills/design/SKILL.md` | "Before a stage" has a new paragraph: a line with `carry-unresolved` that holds `"- source:<path>": <path> is not there` says a file of the project that a stage's carry list names has moved or gone since its stamp, as a build may move a screen it replaces. Tell him which source and which stage. That stage is reopened, or the source put back: he chooses which, never you. It runs straight into the "Any other line" sentences. **`loop.md` is not changed:** it lists none of `validate`'s lines (its step 1 sends the reader to "Before a stage"). To stay at 200 lines, three cuts that drop nothing: the status paragraph takes the line "Then invoke the skill…", Resuming step 3 says "Put it to him" for "Put that question to him", and a Never line says "Name its absolute path" for "Name the file by its absolute path". | Added: the paragraph, whole, in "the final review's wording" test, and a check that the state script still says "is not there, looked for from" of a source, under `carry-unresolved`. |
| **N2** | `skills/acceptance/SKILL.md` | Step 4: ", where a list of rooms begins" is gone. Step 7: "A failed check deviates, as a booking action that reads "Reserve" where "Book room" was approved.", word for word as it stood before `0de0f73`. 200 lines: the Writes section's closing sentence moved into its opening paragraph, which saves the blank line between them (see N4). | **Moved:** in "handoff and acceptance: the six sections…", Acceptance's example pin is now the step 7 sentence, not the bare word "room" (Handoff keeps the word). Added: step 7 holds the example between its two neighbours, and "where a list of rooms begins" is nowhere in the skill. |
| **N3** | `scripts/render.mjs`, `kit/KIT-CONTRACT.md` | `--help`, in the reviewer's words: "draw the page without the proposal's own account (its name, its bet, its cost, what is absent, its hardest state, and the note on a screen or an item), for a reader who must not see it, as an audience: its heading is the option's letter alone; the screens, their captions and every part are drawn as they are with it". The printed line: "drew option B to <out>, without the proposal's own account, with kit.css beside it". The comments at the head, on `renderProposal` and on `drawLetter`, in the same words. The contract: "Drawn without the proposal's own account, for a reader who must not see it, the page's header is that `<h1>` alone, …". The flag stays `--without-notes`; `notes` stays the option's name in the module. | **Moved** in `tests/render.test.mjs`: the help (one pin on the whole sentence, plus "the makers' notes" not in it), the printed line, the contract's sentence (plus "the makers' notes" not in its section). **Moved** in `tests/skills.test.mjs`: the two pins on the printed line in the walks of Structure (the board, and the graft). Test names and comments that named the page by the old word, in the three test files, now say the new one. Test first: render's three tests were seen to fail before the script changed. |
| **N4** | `skills/acceptance/SKILL.md` | The gate's bullet: "is written under "Deviations accepted", in his words, and, once Handoff is reopened, as `references/deviations.md` says, appended to the package's `DECISIONS.md` and to the folder's own. Then the handoff folder is brought up to date … That page has every file it touches, and how a stamped `HANDOFF.md` is changed." The Writes sentence that said the same without the reopening now says "with each deviation he accepts, once Handoff is reopened: "Gate" says how." | **Moved** in the gate's `inOrder`: the bullet's first sentence, and "That page has…" for "`references/deviations.md` has…". Added: the Writes sentence. |
| **N5** | `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md`, `skills/setup/references/project-kit.md` | Step 3 opens: "First, see that `<tokens>` is still the project's: while the two differ, nothing is copied." `folder.md`: a first bullet, "First, the tokens, before any page is copied", with the pointer to "When the tokens move": while the two differ nothing is copied, `PARTS.md` is not written, and he is told; the way on is his reopening of Look, and the pages are copied once Look is stamped again. The old "And first, see…" sentence left the token-file bullet. `project-kit.md`: Handoff looks "at the start of its step 3, before any page is copied, and again before it writes `PARTS.md`", and its bullet reads "At Handoff, nothing is copied and `PARTS.md` is not written while the copy and the file differ", ending "Handoff copies the pages once Look is stamped again." **Step 5's guard is kept as it was:** a session that resumes Handoff at step 5 on another day looks again there. 200 lines: **the blank line between the Question's sentence and `## Reads` is gone**. The section above it already had none, the page renders the same, and every sentence of the skill is pinned. | **Moved:** "When the tokens move"'s list of who looks, and its Handoff bullet (now with its way on), in the G9 test; the `folder.md` pin moved to the new bullet, with its place first among the section's bullets. Added: step 3's opening. Kept: step 5's pin. |
| **N6** | `skills/setup/SKILL.md`, `README.md` | Setup's gate: "**Tell him to keep formatters off `<packages>`:** a formatter, a hook that formats on commit or an editor that trims on save changes the files he approved there, and `state.mjs validate` says so." It names the command as `state.mjs validate` because setup's test reads a bare lower-case code span as a key of the project profile. README, under "Start": "**Keep formatters off the designs.** A formatter, a hook that formats on commit or an editor that trims white space on save, run over the folder that holds them (`design/` unless the project's profile says otherwise), changes files you approved, and the state script's `validate` then reports each one as changed since you approved it." 200 lines: step 2's "You do not start one here." is gone, since Never's "Never invent a design system" says it, and the paragraph was wrapped again; a Never line says "a path he gives" for "a path the founder gives". | Added: both sentences, in setup's gate test. |
| **The controller's** | `docs/design/DRY-RUN.md` | In the last section, before "What is left for the proving run": "**The re-review of the final wave** found nothing above Minor, and its six minors were fixed before the proving run." | None: the document is not pinned. |

## N3: what is left of "the makers' notes", and why

Outside `docs/`, the words are left only where they mean what G11 kept them for: what a maker said
outside its work, which no reader opens.

- `templates/briefs/judge.md:51`, "The makers' notes and replies: {where they are}", in the judge's
  "Do not open" list, and its three filled copies in the evaluation fixtures
  (`evals/cold-implementer-finds-the-gap/…/judge.cold-implementer.md:25`,
  `evals/judge-does-not-redraw/…/judge.usability.md:27`,
  `evals/profile-judge-cannot-tell/…/judge.profile-front-desk-coordinator.md:27`).
- `tests/pool.test.mjs:827`, a test's name: every judge's `never-reads` holds `maker-notes`.
- Pins that assert the words are **not** there (`tests/skills.test.mjs:2975`, three in
  `tests/render.test.mjs`).

In `docs/`, the build log, `DRY-RUN.md` (the R171 row and the G11 line) and the design document
(`2026-11-13-pipeline-design.md:1059`, "drawn twice: with the makers' notes, for him…") record what was
said at the time. I left them: they are history, and the design document is the controller's to edit.
The last of these is the only one that describes the kit's present behaviour in the old word.

## Found, and not mine to fix

- **N1's second branch.** The reviewer's sentence told two cases apart: a source moved before Handoff
  (reopen, or put it back) and one the build moved after Handoff (reported, nothing reopened). The
  ruling leaves both ways out to him, and that is what the page says. In a real build, reopening a
  stage over a source the build replaced would turn every later stage stale. A recommendation on the
  page could steer him there, but "Never decide for the founder" already asks the session to recommend
  with one sentence of reason. The proving run will meet this case.
- **A resumed, stale Handoff.** When Look is reopened over moved tokens and stamped again, Handoff's
  step 2 says to go on "at the first step whose file is missing". Since N5, step 3 has copied nothing
  in that case, so the run starts at step 3, as it should. A Handoff that copied its pages on one day
  and meets moved tokens at step 5 on another still holds the old pages. The conductor's "redo it"
  for a stale stage covers it, and `folder.md` and `project-kit.md` now say the pages are copied once
  Look is stamped again. No step says to delete the old copies first.
- **The commit's trailer.** The dispatch file gives `Co-Authored-By: Claude Fable 5.2`. This session
  runs on Opus 5.5, and the harness's attribution for it says `Co-Authored-By: Claude Opus 5.5
  <noreply@anthropic.com>`, so the commit carries that line. The `Claude-Session` line is the one given.

## The mutations

All caught, each by the test named:

| Mutation | Caught by |
|---|---|
| Acceptance step 4: ", where a list of rooms begins" put back | handoff and acceptance: the six sections… |
| Acceptance step 7: the example taken out | the same |
| Acceptance gate: "once Handoff is reopened, as … says" taken out | acceptance: each item matches or deviates… |
| Acceptance Writes: ", once Handoff is reopened" taken out | the same |
| Conductor: "he chooses which, never you" → "you choose which" | the final review's wording… |
| Conductor: "Tell him which source and which stage." taken out | the same |
| Handoff step 3: the look taken out | the kit's copy of the tokens is held to the project's file… |
| `folder.md`: the first bullet's lead changed | the same |
| `project-kit.md`: Handoff's look back to "before it writes `PARTS.md`" | the same |
| Setup's gate: the two kinds of tools taken out | the gate: the founder corrects the project profile once… |
| README: the paragraph's lead changed | the same |
| `render.mjs`: the printed line back to "the makers' notes" | the CLI draws the page without the proposal's own account… |
| `render.mjs`: the help's "must not see it" → "must not see the notes" | the CLI --help prints the usage… |
| `KIT-CONTRACT.md`: the sentence put back as it was | the kit contract states what the drawing relies on… |
| `render.mjs`: the printed line changed, run by the skills' walk | Structure runs as written… |

## Commit

```
6baebc7 fix: the six minors of the last re-review
```
