# Task 20, step 5b · fix round 2 · report

The last small round: ruling R191, and the eight Minor findings of the two re-reviews (`W-N1`–`W-N4` in
`task-20-fix-review-words.md`, `S-N1`–`S-N4` in `task-20-fix-review-scripts.md`), as
`task-20-fix-round-2.md` rules them. Branch `v2-pipeline`, on top of `723992f`. Nothing was pushed. The
design document is not touched.

**All nine are done.** Paths are from the kit's root. The script changes were made test-first: each new
test was written and seen to fail for the reason given, then the change was made. A *mutation* is a hand
change to new code or new words, one at a time, each put back; it is *caught* when a test fails on it.
20 mutations this round, all caught (4 of the scripts, 16 of the words).

## The nine

| Item | Files changed | What changed, in a line | The test, or the pin |
|---|---|---|---|
| **R191** | `skills/look/SKILL.md`, `skills/look/references/seats.md`, `templates/briefs/maker.md`, `pool/makers/visual-designer.md`, `skills/design/references/loop.md`, `skills/detail/references/seats.md`, `docs/design/DRY-RUN.md`, `tests/skills.test.mjs` | The visual designer writes the `in-viewport` check of each criterion that says "without scrolling", in its own `checks.json` and a variant's (Look step 4, the seats page, its card). Its brief carries each such criterion word for word, and now gives four things (seats page, maker brief template). Step 5 has the conductor see that one is there "in the same way" it holds the table to its run, and choose no element. A missing check, or one that failed, goes back with the step-5 send-back. One that still fails is handed to the judges, as the readers' line already says, and listed as an open finding with its seat `check: <id>`. Only the designer changes a screen for it. The loop and Detail's seats page now say the designer writes it at Look. DRY-RUN: the R190 row says what now holds, and an R191 row is added. | **Pins changed** with the rule: the loop's R190 sentence, Detail's and Look's seats-page sentences, Look's step 5 (the R190 sentence and the send-back, in two tests), and Look's step 4 `checks.json` bullet. **Pins added:** the step-5 sentence; the send-back naming a criterion with no check; step 4's clause; the designer's four-thing brief and its fourth item; the started-again hand-over; the bullet on a check that fails, with its seat; the template's clause; the card's line; that the designer's card does not read `intent`; and that Look's skill no longer says "add to `checks.json`" or "Look adds". 10 mutations, all caught. |
| **W-N1** | `skills/detail/references/seats.md`, `tests/skills.test.mjs` | Under the builder: a page that waits for its example rows goes to the founder first, as one question (step 4), and his answer is written under "Reviewed by the founder". A fresh builder is then handed the data in a brief, in his words or by the path of the file he names. Only what it still cannot build goes on the decision page. | **Pin added**, beside the card's (M1) pin. 1 mutation, caught. |
| **W-N2** | `skills/handoff/references/seats.md`, `skills/handoff/SKILL.md`, `tests/skills.test.mjs` | "Take the reference out" now applies to a file you wrote. For an approved file the seats page points to `folder.md`'s "When it may exit 1". The Never line gains one sentence: "A file approved at an earlier stage and copied in, unchanged or changed only by the rewrites of step 3, is not rewritten: step 7 says what is done with it." | The old Never pin still holds. **Pins added:** the Never sentence; the seats-page bullet; and that the exception's words, "copied in, unchanged or changed only by the rewrites of step 3", appear in all four places (step 7, Never, seats page, folder page) and "copied in unchanged" in none. 3 mutations, all caught. |
| **S-N1** | `skills/handoff/references/folder.md`, `skills/handoff/SKILL.md`, `tests/skills.test.mjs` | The allowed exit 1 covers a file "approved at an earlier stage and copied in, unchanged or changed only by the rewrites of step 3" (step 7 says "approved earlier", as before). The bullet's example is now the comment that opens a stylesheet of the screens. A row of the states that reads "as answered" sits in `SPEC.md`, a file you wrote: it is written out there in full, as any file you wrote is mended. | **Pins changed** with the rule: step 7's sentence, and "When it may exit 1". **Pins added:** the `SPEC.md` sentence, the new bullet's opening, and a check that the old example ("a row of the states") is gone. The run-as-written test (a pointer in an approved stylesheet) still passes. 2 mutations, all caught. |
| **W-N3 / S-N4** | `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md`, `tests/skills.test.mjs` | Step 10 puts "each pointer step 7 left open, its seat `check: alone.mjs --package`" under `findings`. `folder.md` says the same, in Acceptance's form for a finding a check found. No second form is made. | **Pins changed:** step 10's sentence. **Pins added:** the folder page's sentence, and Acceptance's `check: <id>` form, so the two stay one. 2 mutations, all caught. |
| **W-N4** | `skills/acceptance/SKILL.md`, `tests/skills.test.mjs` | The Writes table gains two rows, "the driver, at the path of his answer" and "its line in `<packages>/PROFILE.md`", each "only on his yes". The sentence above the table says the last two rows are the project's. | **Pin changed:** the table's list of rows. **Pins added:** what the two rows hold, and the sentence. 1 mutation, caught. |
| **S-N2** | `scripts/lib/card.mjs`, `scripts/card.mjs`, `tests/pool.test.mjs` | `checkFields` refuses a code fence inside a characteristic, and inside a `####` of a specialty: "a field is prose, a list or both, from its label to the next blank line". The fault names the line by its number, never its words. A fence that opens a block of its own is reported once, as a fence. `traits` is refused through `check`. The usage says so. | **Written first, failing:** `a characteristic holds no code fence: …`. It covers the reviewer's form; `traits` refused; a fence with no blank inside, of either character, indented or with a language; one that opens a block; one under a trait's label; a specialty; a fence allowed in the closing sections and in a specialty's own words; CRLF; no fault that quotes the profile. Also the command's `check` and `traits` on the reviewer's form (nothing written, "LEAK" never printed), and the usage's new sentence. 2 mutations, caught. Every fixture profile still prints `ok`. |
| **S-N3** | `scripts/card.mjs`, `scripts/alone.mjs`, `tests/pool.test.mjs`, `tests/alone.test.mjs` | `card.mjs --help`: its 139-character line is wrapped, and no line is now over 102. `alone.mjs --help`: the success line with `--package` is printed when there is "no place that points back and no link that leads out of the folder or nowhere". Step 7's command stays a code span: Handoff has no three lines to spare. | **Written first, failing:** no usage line of `card.mjs` is over 105 characters; the new phrase of `alone.mjs`. 2 mutations, caught. |

## Concerns

1. **Where the room came from.** Seven skills stay at exactly 200 lines.
   - **Handoff** needed three lines: step 10, the Never line, and none net for step 7. They came from two
     moves:
     - Step 6's two sentences on `cannot be told:` / `cannot be measured:` and on `--allow-errors` became
       one pointer: "A check it cannot make, and `--allow-errors`, are as `references/folder.md` says."
       `folder.md` already says both in full, under "Run them on the prototype". The two step-6 pins
       became one pin on the pointer, and a pin was added on `folder.md`'s "Neither is a guess to keep…",
       so each rule is still held.
     - Step 7's last sentence, "Those go to him with the gate, as open findings.", was dropped. Step 10
       (now with the seat) and the gate's question ("names each item and each pointer still open") say it.
   - **Acceptance and Look:** the room came from rewrapping paragraphs that took a line more than they
     need. No words changed: Acceptance's steps 3, 4 and 8; Look's step 6.
2. **The designer's card gained two lines** (now 127). R191 names the seats page and the brief template,
   but the card is the maker's method. Without those lines nothing it reads says what to do with the
   criterion its brief carries.
3. **The loop's sentence was changed too.** It read "Look adds one to its checks", and R191 does not name
   it, but left as it was it would contradict the ruling.
4. **A criterion still with no check after its send-back.** R191 does not say what happens then. It is
   treated like a table that still does not hold: it goes to the founder, open. No seat is named for it,
   since there is no check to name.
5. **Look uses Acceptance's seat form too.** An `in-viewport` check that still fails is listed with the
   seat `check: <id>`, the form W-N3/S-N4 rules for Handoff. `page.mjs` requires a seat, and this keeps
   one form across the kit.
6. **`DRY-RUN.md` beyond the two rows ruled:**
   - The opening now says the rulings run to R191, and that a second round followed the re-read.
   - The opening says "where a round changed what a row says, the row says so", so three rows this round
     made incomplete were brought up to date: R180 (the exception's words, the seat, a pointer in the
     spec), R188 (Detail's seats page now hands the builder his answer) and R189 (the Writes table).
7. **The brief template's line is shorter than the seats page's.** A test holds each brace instruction to
   two lines, so the template's visual-designer line reads only "each "without scrolling" criterion,
   word for word". The seats page, which a brief is filled from, says the rest. This was caught by the
   first full run, which then failed once (`templates`); the second full run is the one counted below.
8. **The trailer lines.** The commits carry the two lines the dispatch file gives, word for word. They
   name a different model from the one this session ran on.

## Found, and not mine to fix

- Help texts with lines over 105 characters, other than `card.mjs`'s, which this round wrapped. Most are
  usage or option lines: `accept.mjs` (147, 109, 107, 106), `shots.mjs` (173), `state.mjs` (112, 108),
  `render.mjs` (111, 107), `describe.mjs` (111).
- `skills/handoff/SKILL.md:19` is still 116 characters, as round 1 noted. Rewrapping it would take a line
  the skill does not have.

## Tests

- `NODE_OPTIONS=--dns-result-order=ipv4first npm test`, after the last change: **881 tests · 880 pass ·
  0 fail · 1 skipped** (the folder-mode test this mount skips) · exit 0, in 227 s. It was 880 before this
  round; the one new test is S-N2's. An earlier full run, before concern 7's fix, had 1 failure
  (`templates`), fixed and run again.
- By file: `tests/pool.test.mjs` 117 (was 116), `tests/alone.test.mjs` 35, `tests/skills.test.mjs` 139,
  `tests/templates.test.mjs` 49, all passing.
- `claude plugin validate . --strict` → "Validation passed", exit 0. The icon warning predates this round.
- Line counts: seven skills at 200, none over. Cards: 133 at most; the visual designer's is 127.
- `git status --short` → clean.
- No sub-agent was started and nothing was installed. No keys file was opened or named, and no provider
  was contacted. No browser was started by hand, and no process was stopped by name.

## Commits

On `v2-pipeline`, not pushed, each with the dispatch file's two trailer lines:

```
24b5f0c fix: the visual designer writes the "without scrolling" check, and the minors of the re-review (R191, W-N1 to W-N4, S-N1, S-N4)
b1a375d fix: a profile's characteristic holds no code fence, and the help of two commands says what it does (S-N2, S-N3)
```

Done: 9 of 9 (R191, W-N1, W-N2, W-N3/S-N4, W-N4, S-N1, S-N2, S-N3). Not done: none.
