# Task 20, step 5b · wave B · report

Wave B: the scripts. The two mechanical items (`F62`, `F96`), the rulings marked B (R161, R162, R170,
R171 with R154, R173, R180), the two added after wave A2 (R186, R187), the command lines A2's three
sentences waited for, and the "wave B" cells of `docs/design/DRY-RUN.md`. Branch `v2-pipeline`, on top
of `c83039d`. Not the design document.

**All ten are done. Six things are for the controller to know before the review: they are under
"Concerns".**

Paths are from the kit's root. Each change was made test-first: the test named was written, seen to
fail for the reason given, and then the change was made. "Mutations" are hand changes to the new code,
one at a time, each put back: a mutation is *caught* when a test fails on it.

## Items and rulings

| Item | Files changed | What changed, in a line | The failing test, written first | Mutations |
|---|---|---|---|---|
| **F62** | `scripts/lib/state.mjs`, `tests/state.test.mjs` | `validate` holds the header's status to the state's for every status: `draft` while the stage is in work, else the same word. A status the header cannot have is still said once, as that. | `validate: a header whose status disagrees with the state is bad-header, whichever status the state has` — failed with no problem reported for a `draft` header on an awaiting stage. | 2, both caught: the map's `awaiting` made `draft`; the comparison put back to "approved only". |
| **F96** | `scripts/inpage/accept-inpage.js`, `tests/accept.test.mjs` | The `text` check reads a space between two texts whose nearest block differs (a paragraph, a list item, a table cell, an item of a flex or grid row) and at a `<br>` that is shown; texts on one line of one block read as written. The file's header says the rule, in place of "Two blocks … read as joined". | `text: what the element shows, so two blocks, two lines, two cells and two items read with a space between them, and one line reads as written` — failed reading `Room 5free`. **Two pins changed**, which held the joined reading (`Room2`, `Room 1free`): the item changes that rule. | 7. Four caught at once. Three survived: for two the test was tightened (a text beside a `display: contents` element; a third text after a `<br>`), and they were then caught; the third was a condition nothing could see (`text !== ''`: its only caller trims), and it was removed. |
| **R161** (F8) | `kit/grey/parts.html`, `tests/walkthrough.test.mjs` | Every part of the specimen holds words that name it ("Row title", "Status", "Primary action", "Field label"); its opening line says so; the two ids that named the product are neutral (`data-screen="screen"`, `"dialog"`; `data-ux="status-line"`); each time is `HH:MM` on the 24-hour clock. **The markup is unchanged** (checked tag by tag) **and `kit/grey/kit.css` is untouched**, so A1's pin on its opening comment and dark block holds. | `the specimen holds neutral words that name each part, no product's nouns, and its times in 24-hour zero-padded form` — failed on "room-booking tool for a small clinic's front desk". Task 3's deferred minor (its room name) closes: no room is named. | 4 on the specimen, all caught: a time written `9:05`; a row named `Room 2`; a screen id `book`; a time `6:00 pm`. |
| **R162** (F9, F57) | `scripts/lib/card.mjs`, `scripts/card.mjs`, `tests/pool.test.mjs`, `tests/templates.test.mjs`, `tests/skills.test.mjs`, `skills/design/references/loop.md`, `skills/cast/SKILL.md` | `card.mjs check` takes a file in `profiles/`. The new verb `card.mjs traits <profile> --out <file>` writes the audience's copy. Detail below. | Nine library tests and five command tests in `tests/pool.test.mjs` (the file failed to load: `validateProfile` and `traitsOf` did not exist), one in `tests/templates.test.mjs` holding the checker to the template. **Pins changed:** the usage's first lines (two forms), "takes check" → "takes check or traits", the "no folder of cards" line (it names `profiles` too), and the two tests that used a file in `profiles/` as "no card". | 35 (23 library, 12 command). 32 caught at once. Three survived: a test was added for two (a fault under the first of two specialties; a field written in the opening), and they were then caught; for the third the pattern was made simpler (it allowed a run of spaces between "four" and "fields", which nothing could see). One condition was removed before it was mutated, as unobservable (skipping the header when reading the opening: an id holds no space). The first run of the library's mutations was thrown away: one of my own tests was red under it, and it was run again on a green file. |
| **R170** (F36) | `scripts/lib/frontmatter.mjs`, `tests/frontmatter.test.mjs`, `tests/state.test.mjs`, `tests/skills.test.mjs` | A value that holds a double quote, or a backslash and needs quotes, is written in single quotes, each single quote inside it doubled; the reader takes that form; his words are never changed. The library's header says the grammar is a subset of YAML and names the two quoted forms. Detail below. | Five tests in `tests/frontmatter.test.mjs` and two in `tests/state.test.mjs` (`stamp writes words that hold a double quote in single quotes, his words unchanged…`). **One pin changed** in `tests/skills.test.mjs`: a skill's description in single quotes was held to read with its quotes; it now reads whole, and the one fault left is that a skill's is written in double quotes. | 27, all caught: 14 on the conditions, one for each of the 12 marks a value may not open with, one on the reader through `stamp`. |
| **R171, R154** (F52) | `scripts/render.mjs`, `scripts/shots.mjs`, `tests/render.test.mjs`, `tests/shots.test.mjs`, `tests/skills.test.mjs`, `skills/structure/SKILL.md`, `skills/structure/references/seats.md` | `render.mjs --without-notes` draws the page headed by its letter alone, with no name, bet, cost, absence, hardest state or note. `shots.mjs --first-screen` pictures the window as each page opens, its width by 900 px, as `<name>-<width>-<theme>-first.png` beside the whole page. Detail below. | `without the makers' notes the page keeps its letter and its screens…` and the command's test in `tests/render.test.mjs`; `with firstScreen, each page is pictured twice…`, `without firstScreen no first screen is pictured, and one an earlier run left is not touched…` and the command's test in `tests/shots.test.mjs`. The shots tests follow that file's header: one browser at a time, through the script's own handles. | 15, all caught: 8 in render, 7 in shots. |
| **R173** (F60) | `scripts/page.mjs`, `tests/page.test.mjs`, `skills/design/references/loop.md`, `tests/skills.test.mjs` | Question marks are counted in the question and in the reason of the recommendation, together, and nowhere else; `--help` says where, in place of "in all". **See concern 1.** | `question marks are counted in the question and in the reason only: a seat, a finding, an option and the gallery may quote a question` — failed: a reason holding a second mark built. | 4, all caught. |
| **R180** (F93) | `scripts/alone.mjs`, `tests/alone.test.mjs`, `tests/skills.test.mjs`, `skills/handoff/SKILL.md`, `skills/handoff/references/folder.md` | `alone.mjs <folder> --package <package>` also reads every text file of the folder for the name of a file or a folder of the package that the folder does not hold, and prints each place with its file and line. Detail below. | Eleven tests in `tests/alone.test.mjs` (the file failed to load: `pointers` did not exist), among them `--package: what the run's cold reader found is found: a stylesheet's comment, a coverage row, the writers' notes, a page's comment`. **Pins changed:** the usage line; Handoff's command in three places of `tests/skills.test.mjs`. | 22. 18 caught at once; four survived and a test was added for each (the folder's own name; the order of two paths that share a name; what a file browser leaves in the package; the order files are printed in), then caught. |
| **R186** | `scripts/page.mjs`, `templates/outputs/decision-approve.json`, `tests/page.test.mjs`, `skills/design/references/loop.md`, `tests/skills.test.mjs` | A finding may carry `accepted`, one of the nine stages. Such findings are drawn under "Accepted deviations", after "Open findings", each with "accepted at <stage>", and are counted apart in the line the command prints. The approve sample's last finding shows the field; `--help` says it. The loop's sentence names the field in place of "its `seat` reading". | `a finding may carry "accepted"…`, `accepted deviations are drawn under a heading of their own, after the open findings…`, and the command's test. **Pins changed:** the sample now holds three findings; two run-as-written tests that build a page from it print "2 open findings, 1 accepted deviation". | 5, all caught. |
| **R187** | `evals/cold-implementer-finds-the-gap/fixture/design/today/07-handoff/accept-inpage.js` (new), `…/07-handoff/HANDOFF.md`, `tests/evals.test.mjs` | The in-page file is copied into the fixture's handoff folder, where the guide says it is; the folder's own table has its row, word for word the template's; the test holds the copy equal to the kit's file, as it holds the guide's. Made after F96, so the copy is the file as it now is. | The folder's list of files in `cold-implementer-finds-the-gap: a handoff folder that stands alone…` — failed: no `accept-inpage.js`. | 2, both caught: one byte of the copy; a word of the row. |

### R162 in detail: what `check` holds a profile to, and what `traits` takes out

- **`check`.** The file is `profiles/<name>.md`; its header holds `id: profile.<name>`, the name its
  file's, and nothing else. Its `##` sections are the template's, once each and in order: the seven
  characteristics, then **any characteristic the project added** (the template says one is added above
  "Specialties"), then "Specialties" and "Optional characteristics". Each characteristic, and each
  `####` characteristic of a `###` specialty, has its four fields once each, the label at the start of
  a line and after a blank line, so that one field can be taken out and the others left. And
  `So the interface must:` stands nowhere but at the start of a line.
- **`traits`.** The profile as it is, without each `So the interface must:` field, from its label to
  the next blank line (or the next heading, or the end), and without each paragraph **of the opening**,
  before the first section, that says "fourth field" or "four fields". The blank line above what is
  taken out goes with it; nothing else changes. It refuses a profile that fails `check`, a file that is
  not in `profiles/`, and a copy in which the words "so the interface must" are still written in any
  case (a trait that says "…so the interface must be read standing" passes `check` and would reach
  her): then nothing is written, and what was at `--out` is left.
- **A2's sentence, changed.** It read "with the paragraph that explains the field, and refuses a card
  that fails its check". The command takes out *each* such paragraph of the opening (the template has
  two), and has a second refusal, so the loop now reads: "It takes out each field, from its label to
  the next blank line, with each paragraph of the opening that speaks of the fields. It refuses a
  profession's profile that fails its check, and a copy in which the words "so the interface must" are
  still written: then nothing is written, and what it printed goes to the founder." Its pin changed
  with it. The command line stands under the bullet, as A2 gave it:
  `node <kit root>/scripts/card.mjs traits <profile> --out <file>`. The test that keeps the word
  "profile" from standing alone in the conductor's pages now lets that slot through.
- **Cast, step 3,** names five folders in its run (`profiles/` with the four), as A2 asked; its pin
  changed.
- **A1's question on `guess (the founder, <date>)`:** the checker does not judge what an "Evidence"
  field says, so that form is sound.

### R170 in detail

- A value is quoted, as before, when it holds `:`, `#`, `[` or `,`, is empty, all digits or padded; and
  now also when it holds a `"` or a tab, is `=` or `<<`, or opens with a mark YAML gives a meaning
  (`'`, `&`, `*`, `!`, `|`, `>`, `%`, `@`, `` ` ``, `{`, `}`, `]`, or `-` or `?` on its own). A list
  item is quoted for a brace or a `?` too.
- Double quotes when the value holds neither `"` nor `\`: so every header written before reads and is
  written as it was. Single quotes otherwise.
- The reader still takes what an earlier stamp wrote (`words: "… "right now" …"`), and `validate` does
  not take such a header for changed: a test holds it.
- **Checked against a real YAML reader, by hand, not in the suite** (the kit has none, and nothing was
  installed): 60,000 headers with values drawn from every awkward character were written by
  `serialize` and read by the machine's Python YAML library. Every string came back the same, and none
  was refused. That check is what found the tab, `=`, `<<` and `?` cases.

### R171 in detail, and what changed in A2's sentences

- The pages without notes land **in the board**, as A2's sentences assumed: `<letter>-screens.html`
  beside `<letter>.html`. One run of the shots, with `--first-screen`, pictures both. So the rule that
  a reader is handed nothing of `04-structure/` outside the board stands unchanged.
- Structure's step 7 gains one command (the second `render`) and the two switches. The skill stays at
  200 lines: the blank line after that fence went. A2's sentence there is reworded to the commands,
  and its pin with it: "Render twice for each letter, the second time without the makers' notes, for
  the audiences; then the shots once, at the brief's two widths, every page pictured twice, whole and
  as its first screen alone".
- The seats page names the files: `<letter>.html` carries the notes and `<letter>-screens.html` does
  not; a first screen's name ends `-first.png`; the audience is handed `A-screens-390-light.png` and
  `A-screens-390-light-first.png`. Its pin changed.
- `blind.md` and `rounds.md` give the same two commands without the switches, and are unchanged: a
  command without them does what it always did.
- The first screen is the window as the page opens, not the top of the whole-page picture: what is
  pinned to the window (as the decision page's question is) is in it, where she meets it.
- Without `--first-screen`, no first-screen picture is taken, and one an earlier run left is not
  touched. With it, a page that gets no picture loses both.

### R180 in detail: what counts as a name of the package the folder does not hold

- **A name of the package** is the name of a file or a folder anywhere under `--package`, except in the
  folder itself and in the package's `build/` folder, the builder's place: `../build/` and its three
  pages may be named.
- **A name the folder holds too,** anywhere in it, is none: it may name its own `strings.json` though
  Detail keeps another. The folder's own name is none.
- **A name with a dot** (`measures.md`, `data.json`, `DETAIL.md`) is found wherever it is written
  whole, as written, capitals and all, and not inside a longer name (`my-measures.md`,
  `measures.md.bak`).
- **A name with no dot** (`work`, `screens`, `06-look`) could be a word, so it is found only where it
  is written as a path: a slash before it or after it (`descriptions/`, `06-look/screens`).
- **Read:** every file of the folder that holds no NUL byte, line by line, comments included.
- **What the run's cold reader found is found:** the stylesheet's comment naming `measures.md`; the
  coverage row naming `descriptions/data.json` (two places on its line); the writers' notes naming
  `DETAIL.md` and `states.md`. **Not seen, and `--help` says so:** a pointer that names no file
  ("answer 28", "(listed)", "as decided at Detail", "the kit's contract"). The folder page tells the
  conductor that its first rule still holds for those, and that the cold implementer reads for the
  rest.
- The whole of Handoff, run as written in `tests/skills.test.mjs` from the kit's own templates and
  guide, passes with the flag; so does the cold-implementer fixture. So the templates name nothing the
  check would refuse.
- A2's sentence in the skill stands as written; the command above it takes `--package <package>`. In
  the folder page, "Nothing points back, proved too" now says that the same command does it, by file
  and line, and what it does not see.

## Concerns

1. **R173: F60's premise was mistaken, and the ruling as written makes the page stricter, not
   looser.** `page.mjs` never counted every mark in the data: it counted the question's alone. What
   made the conductor keep "?" out of the seats' lines was `--help`, which said "more than one question
   mark in all". I did what the ruling says: the count is the question's and the reason's together.
   So a seat's line or a finding may quote a question, as before, and now `--help` says so; **and a
   reason that holds a question mark beside the question's is refused, where it built before.** If
   that is not wanted, the count goes back to the question alone in one line, and `--help` keeps the
   new sentence.
2. **R170: a header value wholly wrapped in single quotes now reads without them.** That is what
   reading the form means. A stage stamped before this wave with words such as `'yes'` (no colon, no
   comma) would read as `yes`, and `validate` would report its header changed since approval. No
   fixture of the kit is so. One list item is not YAML's: an item that needs quotes and holds a
   backslash, since a list item has the double-quoted form only. The header of the library says both.
3. **R171: Detail and Look take no first-screen picture.** Their commands are unchanged. Their shots
   folders are carried into Handoff as the reference pictures, so the switch there would change what
   Handoff copies and counts: a choice, not a flag. An audience's brief at those stages names no
   first-screen picture, and "without scrolling" is still answered on a whole page. Also:
   `kit/KIT-CONTRACT.md` describes the page's header as it is drawn with the notes; it is outside what
   this wave may change, and says nothing of the page without them (`render.mjs` and its `--help` do).
4. **R162: setup and Context do not run the check on a profile they write.** The ruling names the loop
   and Cast. A stub written as setup says passes; one drafted at Context is first checked at Cast.
5. **`docs/design/DRY-RUN.md` is out of date in three places I was told not to touch:** the row of
   R175 still says that a heading of its own "needs the page script" (R186 gave it one); R186, R187
   and R188 have no row, and the page says the rulings run to R185; and its opening still says that a
   cell reading "wave B" is filled in later, where none now does.
6. **R187: I added the row to the fixture's `HANDOFF.md`,** beyond the ruling's letter: without it the
   folder would hold a file its own table does not list, which that case's reader could report too.

## Found, and not mine to fix

- `evals/…` was not run: the evaluation suite starts sessions. Its test file passes.
- A1's and A2's notes on the fixtures stand: none was restamped.
- `scripts/accept.mjs` and the handoff template say of the `text` check "its white space made single
  spaces"; both are true as they stand, and neither says that two blocks read apart. The in-page
  file's header does.

## Tests

- `NODE_OPTIONS=--dns-result-order=ipv4first npm test`, once, after the last change to the kit (the
  commit of R171): **873 tests · 872 pass · 0 fail · 1 skipped** (the folder-mode test this mount
  skips) · exit 0, in 225 s. It was 829 before this wave: 44 tests added. The one change made after
  it is to `docs/design/DRY-RUN.md`, which no test reads.
- By file, where this wave added tests: `tests/state.test.mjs` 105 (was 102) · `tests/accept.test.mjs`
  61 (60) · `tests/page.test.mjs` 50 (47) · `tests/frontmatter.test.mjs` 34 (29) ·
  `tests/pool.test.mjs` 115 (101) · `tests/templates.test.mjs` 49 (48) ·
  `tests/walkthrough.test.mjs` 40 (39) · `tests/alone.test.mjs` 34 (23) · `tests/render.test.mjs` 39
  (37) · `tests/shots.test.mjs` 60 (57). `tests/skills.test.mjs` 139 and `tests/evals.test.mjs` 17
  hold the same number, with pins changed and assertions added.
- `claude plugin validate . --strict` → "Validation passed", exit 0.
- Lines: `skills/structure/SKILL.md` 200 · `skills/handoff/SKILL.md` 200 · `skills/cast/SKILL.md`
  197. No card changed.
- `git status --short` → clean.
- No sub-agent was started, nothing was installed, no keys file was opened or named, and no provider
  was contacted. Browser tests were run one command at a time, each browser started and stopped by the
  script's own handle.

## Commits

On `v2-pipeline`, not pushed, each with the two trailer lines:

```
ff34e71 fix: validate reports a header whose status disagrees with the state's (F62)
9c4161b fix: the text check reads two blocks apart, as she sees them (F96)
9513c93 fix: the cold-implementer fixture holds the in-page file its guide names (R187)
20541b7 fix: the decision page says where it counts question marks, and lists accepted deviations apart (R173, R186)
69ec2cf fix: a header the kit writes is also valid YAML (R170)
acc3208 test: a skill's description in single quotes reads as it is (R170)
794065f fix: a profession's profile is checked, and its copy for an audience is made by a command (R162)
8229aab fix: the grey kit's specimen holds neutral words and 24-hour times (R161)
9861024 fix: alone.mjs --package proves that nothing in the folder points back (R180)
878d3e7 fix: a board drawn without the makers' notes, and a picture of the first screen alone (R171, with R154)
557e6e1 docs: what the scripts' wave changed, in the dry run's document
```

`acc3208` follows `69ec2cf` because I committed R170 before reading the skills test's line: one pin
there was red for one commit. Nothing was amended.

Done: 10 of 10 (F62, F96, R161, R162, R170, R171 with R154, R173, R180, R186, R187), the three command
lines, and the "wave B" cells of the document. Not done: none.
