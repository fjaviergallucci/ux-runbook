# The final fix wave — the scripts' part

Branch `v2-pipeline`, on `94f0066`. Five commits, `e15a017..ed3ba83`; nothing pushed. This report is
not in one of them: its folder is ignored by git, as the others here are. Every item marked **S** in
`final-fix-wave.md` is done: 17 rows below, none left. One row more (G20) was the words' and is done
here, since it was one line in a test file this part was rewriting.

Test line, whole suite, once: **903 tests, 902 pass, 1 skipped, 0 fail, 214 s** (881 before: 22 more). `claude plugin validate . --strict` → exit 0.
`git status --short` → clean.

Each change was made test-first: the test written and seen to fail, then the change. Each new condition
was then mutated by hand once (the mutation written into the script, the test file run, the script put
back): 95 mutations, every one caught in the end. One survived its first run, "an instruction in
braces may cross a blank line" (G7): a case was written for it, and it survived that too until the case
stood before the one that hid it. The mutations are listed by item below.

## 1. Read this first: four readings of a ruling, and one window

1. **R39, which stages the stale chain passes through unchanged.** The ruling says "stages that are not
   approved (skipped included)". Taken to the letter that would also leave alone a stage that is *in
   work* or *awaiting* and holds a record from an earlier stamp. A test from Task 2's own fix rounds
   pins the opposite for an awaiting stage ("a stamp that raises a version closes the open question of
   a stage its cascade marks stale"), and `reopen` says why: a question put on an input that has since
   moved cannot be answered as asked. So the chain passes unchanged through a stage that is **skipped,
   or not started since it was put back on the route** (the two that hold no approval and no question),
   and marks every other stage on record as before. The ledger's own case is a test and fails without
   the change. If the letter of the ruling was meant, it is one line of `cascade` and one test.
2. **R184, what makes a new version.** Unchanged: a stale stage stamped again gets a new version when
   its *output's body* differs (`--help` has always said so). A changed file of the folder with the
   same output does not raise the version; the list of files is simply recorded anew at every stamp.
   Raising it would turn every re-confirmation that rebuilds a decision page into a new version and a
   cascade. In practice the output changes whenever anything did, since his words go into it first.
3. **R184, a file added to the folder is reported too,** beside one changed and one removed. The ruling
   says "a change to any of them"; a page added to `07-handoff/prototype/` after his go is a change to
   what he approved. No step of any skill adds a file to an approved folder (the list is in § 3).
4. **G14, the column is 27rem, not the 20rem of the review's example.** The page's own rule, pinned by
   a test since Task 6, is that a column holds a phone-width picture at its own width. At 20rem three
   options at 1280 would each shrink that picture to 371 px. The row wraps, which is the finding.
5. **The window.** Until the words' part changes `skills/acceptance/references/deviations.md` (R184's
   third condition), the kit's own step for an accepted deviation changes six files of a stamped
   `07-handoff/` with no reopening, and `validate` now says so, one line a file. That is the guard
   doing what it was ruled to do; the sentence that must change is in § 5, first.

## 2. Item by item

| Item | Files | What changed | Failing test first, or pin changed | Mutations tried (all caught) |
|---|---|---|---|---|
| **G5** (the import and the refusal; with it the deferred minor "`inpage` and `report` load the browser library for nothing") | `scripts/lib/browser.mjs`, `tests/cli.test.mjs` | `playwright-core` is imported where the first browser of a run is started (`Browsers.#load`), never at the top. Missing, the script refuses in one line on stderr, exit 1: `playwright-core is not installed in <kit root>: run npm install there`. `--help` of all ten scripts, `accept inpage`, `accept report`, and a `prototype` run whose pages are all missing need no dependency. | New, in `tests/cli.test.mjs`: a copy of `scripts/`, `kit/` and `package.json` in a folder of the system's own (`os.tmpdir()`), no `node_modules`; it first proves that folder cannot find the package, and skips itself where a folder above could. The Chrome it names is `node` itself: nothing is ever started. A second test: `browser.mjs` is the one script that names the package, and never in a top-level import. **The plugin was not installed** to try it. | the raw error thrown · the library loaded for a run that opens no page · another folder named in the refusal |
| **G7** | `scripts/lib/state.mjs` (`unfilled`), `scripts/state.mjs` (`--help`), `tests/state.test.mjs`, `tests/package.test.mjs`, `tests/skills.test.mjs` | `stamp` refuses, and `validate` reports of an approved stage: no `## Reviewed by the founder` section, or one that holds nothing but an instruction in braces (code `approved-without-words`); the template's opening comment, the one that begins `Template.`; an instruction in braces on lines of its own (code `unfilled`, new). Let be: fenced code, a block in braces that is a JSON object, braces inside a line (a table's cell, a heading, `{name}, as in {greeting}`), and the comment every template keeps above its carry list. The short forms pass. | Three new tests in `tests/state.test.mjs`; in `tests/package.test.mjs` the review's own probe is now a test (the four templates of a correction as they came: each refused, with what is left counted; filled in, each stamped). **Pins changed:** the tests that stamped a template as it came (two in `package.test.mjs`, the four walks of `skills.test.mjs`) now fill it in first, through one helper, `filledIn`. | stamp does not look · validate does not look · missing section passes · empty section passes · an instruction counts as words · a comment counts as words · any heading level is the section · the section runs to the end of the file · opening comment passes · any comment is the template's · instructions pass · fenced code is read · JSON is an instruction · two groups are one instruction · a block may cross a blank line · an indented instruction passes |
| **G7, the fixtures** | — | **Every package under `evals/` that was stamped earlier still validates** (`resume-from-disk`, `brief-has-no-design`, `no-pick-without-the-founder`, `fresh-brief-hides-the-system`: each `ok`, run from its fixture's root, and `tests/evals.test.mjs` holds them so). No rule had to be narrowed for them, and no fixture of a stamped state was touched. Three of them hold a `CHOSEN.md` still full of instructions: Structure is not approved there, and nothing is said of a stage that is still being written. `tests/` holds no stamped package of its own. | `tests/evals.test.mjs`, unchanged, passes | — |
| **G12** | `scripts/lib/merge.mjs`, `scripts/merge.mjs`, `tests/merge.test.mjs`, `tests/skills.test.mjs` | The two refusals and `--help` say move, never delete: "…a pick made on another board; move it into earlier/<n>/ first." · "To rebuild it, move the map and the board into earlier/<n>/ first." · "A sealed board is never merged again, and never deleted: move it and its map into earlier/<n>/ to rebuild it, and a pick left from another board with them." | The three pinned messages in `tests/merge.test.mjs`; **pin changed** in `tests/skills.test.mjs` (the one that held `--help` to "delete it and its map on purpose"). | the tests compare each message whole |
| **G13** (and the deferred minor "the every-folder-above rule") | `scripts/lib/merge.mjs`, `tests/merge.test.mjs` | A folder above the board counts as a board only when it holds letter files **and** its own `MAP.sealed.json` lies beside it. A `Q.json` of the project's, anywhere above, stops no merge. The test of a real board above still refuses, three levels deep. | New test: the review's probe (`above/Q.json`, a board five folders below), by module and by command. | the map beside it not asked for |
| **G14** (and the deferred minor "the options' row") | `scripts/page.mjs`, `tests/page.test.mjs` | The options' row and the gallery's are a grid of columns that wrap: `repeat(auto-fill, minmax(min(27rem, 100%), 1fr))`. No overflow is declared anywhere on the page. | The Chrome test rewritten, with three options and with five (and four gallery items): at 1440, 1280 and 390 every option and item lies whole inside the window, three, two and one to a line, neither row scrolls, each phone picture at its own width. **Pin changed:** the static test read the column from `.option` and pinned `overflow-x: auto`; it now reads the grid and pins that no overflow is declared. | the one row that scrolls, as before · a column of 20rem · a column that does not give way on a phone |
| **G16** | `scripts/lib/state.mjs` (`requireGates`), `scripts/state.mjs`, `tests/state.test.mjs` | `begin` and `await` refuse a stage while a stage the route runs before it is not approved (in work, awaiting, stale or not started; a skipped one is passed over): `detail cannot be begun: context, before it on the route, is not-started, not approved; \`next\` names the stage to run`. Nothing is written. `stamp` and `validate` are as they were. | New test, by module and by command. **Pins changed:** thirteen tests of `tests/state.test.mjs` began or awaited a stage out of order to reach a state; each now reaches it in order, or, where no verb reaches it any more (two stages awaiting at once), writes it by hand through one helper, `force`, since a package begun before this may be in such a state and `reopen` must still recall it. | begin not held · await not held · a stale stage passes · a skipped stage holds · only the stage just before is looked at |
| **G17** | `scripts/lib/carry.mjs`, `scripts/lib/state.mjs`, `scripts/state.mjs`, `tests/state.test.mjs`, `tests/templates.test.mjs`, `tests/package.test.mjs`, `tests/skills.test.mjs` | A `- source:<path>` line is looked for from the folder the command is run in (`root`, `process.cwd()` when not given), a file or a folder; one that is not there is refused at the stamp and reported by `validate` as `carry-unresolved`, in the same words. | The test that pinned "accepted without resolving" is rewritten as its opposite. **Pins changed:** the walks of `tests/skills.test.mjs` named sources nobody had written; each is now put there by `placeSource`, with a line saying whose it stands in for. Two were real: the pictures of a redrawn pick, and of a correction, were named on a carry list and never taken. | never looked for · the root ignored · validate without the root |
| **R39** | `scripts/lib/state.mjs` (`setRoute`, `cascade`), `tests/state.test.mjs` | A skip keeps `builtFrom` beside the hash and the version. The chain passes through a stage that is skipped, or not started since it was put back, without changing it, and marks what was built on it. See § 1.1. | New test: the ledger's case (all nine approved; the context made stale and skipped; the frame redone → every stage from intent on is stale, the context still skipped), the same with the stage put back, and by `reopen`. **Pin changed:** "route skipped clears the approval record" expected `builtFrom: null`. | the skip clears `builtFrom` · no passing through · a skipped stage turned stale · a not-started stage turned stale |
| **The note slot** (deferred minor) | `scripts/lib/state.mjs`, `tests/state.test.mjs` | A stage has two notes: `reasons` (why the route has it so) and `staleBecause` (what moved under it: a cascade's reason, or "… was added to the route before it"). The second no longer overwrites the first, shows beside it in `STATE.md` ("…; …"), is what `validate` gives for a stale stage, and goes when the stage is approved again, reopened or skipped. A state written before has no `staleBecause`: it is read as it is. `reopen`'s own "reopened on …" note is as it was. | New test. **Pins changed:** eight tests read a cascade's or an added stage's reason from `reasons`; they read `staleBecause`. | the cascade writes the route's slot · the added stage does · the note stays after a stamp, a reopening, a skip · not on the page · validate reads the route's only · an older state given none |
| **The `route` test** (deferred minor) | `tests/state.test.mjs` | A test only: `route` leaves the open question where it is when only a mode changes, the stage's own or another's. | New test | `route` closes the question on any change of mode |
| **R108** (the `--help` line) | `scripts/accept.mjs`, `scripts/inpage/accept-inpage.js` | Under `in-viewport`: "The element that answers "without scrolling" is never a shape inside an <svg>: a drawing that is scaled is measured as if it were not." No code. The in-page file's header says the same. | The `--help` test holds the sentence. | the sentence reversed |
| **R109** | `scripts/inpage/accept-inpage.js` (`cornersOf`), `tests/accept.test.mjs`, the fixture's copy | Corner radii as CSS draws them: where the radii of two corners that share a side add up to more than the side, all four are scaled by one factor, the smallest any side asks for. A value that cannot be read still counts as the whole box, and takes no part in the scaling. | New test: seven pills pass that were "cannot be told:" (999 px on 200 by 40; 100 px on 120 by 40; a chip with padding; 300 px / 30 px; one end only; one large corner and three small; drawn at twice its size), two that a round end does cut are still asked about, and one the browser can be asked about is cut. The two older tests of rounded corners pass as they were, one comment aside. | no scaling · the widths only · the heights only · each corner by its own factor · capped at the box, as before · unreadable taken as square · a side paired with the wrong corners |
| **R132** | `scripts/lib/leftovers.mjs` (new), `scripts/lib/merge.mjs`, `scripts/deal.mjs`, `scripts/merge.mjs`, `tests/merge.test.mjs`, `tests/shots.test.mjs` | One list (`.fuse_hidden*`, `.DS_Store`, `Thumbs.db`, `desktop.ini`), read by `merge`, `deal` and the state. A board folder that holds nothing else is empty: each such file is moved into the new folder first, so that the same one rename still puts the board in place, and is put back if that fails. A file somebody did write is still refused, by its own name. The tests of `merge` and `shots` that list a folder pass the same names over (in `shots`, all 29 listings, through one definition). | New tests; **pin changed:** `.DS_Store` alone in a board folder was a refusal. | any file moved aside, not only a leftover · the leftover not put back · the refusal naming the leftover |
| **R184** (conditions 1 and 2, and `reopen`) | `scripts/lib/state.mjs` (`filesOf`, `fileHash`, `filesMoved`), `scripts/state.mjs`, `tests/state.test.mjs`, `tests/skills.test.mjs` | A stamp records `files` for the stage's folder: one hash a file, by its path from the folder. (1) A text file (what reads as UTF-8 and holds no NUL) with CR LF made LF; any other by its bytes; R132's leftovers passed over; a link held to where it points, never followed. `validate` gives one `changed-since-approval` line for each file that changed, was removed or was added, ten by name and the rest counted. (2) A stage with no list on record (`files` absent or `null`) is held to its output alone. `reopen` returns `recalled`, and the command prints it: `reopened handoff at version 2; stale: none; back in work: acceptance`. | Six new tests. **Pins changed:** the entry's shape (`files: null`) in five tests; `reopen`'s result or its printed line in five tests of `tests/state.test.mjs` and two of `tests/skills.test.mjs`. In the Handoff walk of `skills.test.mjs`, what Look left on disk is now written before Look is stamped. | the stamp records nothing · validate does not look · leftovers recorded · a text file by its bytes · a picture read as text · the output in its own list · a folder not walked · frame given the package's folder · changed, removed, added not reported (three) · every file named · unsorted · a link followed · the recalled stages not returned |
| **R185** (and Task 17's M2) | `scripts/inpage/accept-inpage.js`, `scripts/accept.mjs`, `templates/package/07-handoff/ACCEPTANCE.md`, the fixture's two copies, `tests/accept.test.mjs`, `tests/templates.test.mjs` | Two types. `style`: `target`, `property`, `equals` — the value the browser computes for that one property, as it gives it (`16px`, `600`, `rgb(26, 26, 26)`), is the string given; it does not ask whether the element is rendered. `gap`: `targets` (two ids), `axis` (`x` or `y`), `equals` — both rendered, and the distance from the first's far edge to the second's near edge is that number of CSS pixels, half a pixel of play given; below zero they overlap or the second comes first. Both in `validateAcceptance`, `--help`, the in-page header and the template's table. "No type measures the length of a line of text: that is measured by a person." | Two new in-page tests, cases added to the two tests of an acceptance file, the `--help` test, and "it reads only" now runs every type the script knows. **Pin changed:** `tests/templates.test.mjs` said eight types. | style: passes whatever · not trimmed · any property name · no value taken for a value · any `equals` — gap: no play · more play · axes swapped · the near edges · what is not rendered · what has no box · three ids · one id twice · any axis · any `equals` · "below zero" not said — the file: any property · no custom property · any `equals` · two or more ids · any axis · any number · none below zero · a `target` taken · no line on the length of a line |
| **`frontmatter.mjs`'s header** (deferred minor) | `scripts/lib/frontmatter.mjs` | Three lines of comment: `parse` refuses a value of digits alone that cannot be a number as written, and a list that holds an empty item. | — (a comment; both refusals already have tests) | — |
| **G20** (the words', done here) | `tests/state.test.mjs` | The kind is `booking-shell`. | — | — |

## 3. R184: who owns which folder, and who writes into another's

Walked: the "Writes" table and the steps of every stage skill, each `references/` page they send to,
and `reference/IMPLEMENTER-GUIDE.md`.

**What each stage owns, and so what its stamp guards.**

| Stage | Its folder | What its stamp records |
|---|---|---|
| frame, context, intent, cast | none: `00-frame.md` to `03-cast.md` lie in the package's own folder, beside each other and the state | the output alone, as before (`files: null`) |
| structure | `04-structure/` | `BRIEF.md`, `BRIEF-fresh.md`, `proposals/`, `fresh/`, `board/`, `MAP.sealed.json`, `PICK.md`, `reads/`, `decision.json`, `decision.html`, `chosen/`, `earlier/` |
| detail | `05-detail/` | `states.md`, `strings.json`, `prototype/`, `shots/`, `reads/`, `words.*`, `decision.*`, and `correction/` at a correction |
| look | `06-look/` | `screens/`, `variants/`, `checks.json`, `results.json`, `measures.md`, `measure/`, `shots/`, `reads/`, `directions/`, `tokens.css`, `earlier/`, and what a fresh pass leaves (`BRIEF-fresh.md`, `fresh/`, `beside/`, `BESIDE.sealed.json`, `beside.*`, `borrow.*`), `decision.*` |
| handoff | `07-handoff/` | `IMPLEMENTER-GUIDE.md`, `prototype/` with its `shots/`, `tokens.css`, `SPEC.md`, `strings.json` and the strings in the project's format, `PARTS.md`, `ACCEPTANCE.md`, `acceptance.json`, `accept-inpage.js`, `DECISIONS.md`, `COVERAGE.md` |
| acceptance | `08-acceptance/` | `results/`, `checks.md`, `by-hand.md`, `shots/`, `reads/`, `FIXES.md`, `decision.*` |

The output itself is in none of these lists: its body has the hash it always had, and its header is
the script's to write.

**What a later stage writes into an earlier stage's folder.** One thing, in the whole kit:

- **Acceptance, on a deviation he accepts** (`skills/acceptance/references/deviations.md`, "He accepts
  it"): step 2 appends to `07-handoff/DECISIONS.md`; step 3 rewrites the row of `SPEC.md`, the string
  in `strings.json` and in the copy in the project's format, the row of `PARTS.md`, the check in
  `acceptance.json` and the item in `ACCEPTANCE.md`. Today it reopens Handoff only "when `HANDOFF.md`
  names what changed". This is the third condition of the ruling, and the words' part.

Everything else that crosses a stage's line is a read, or a copy into the reader's own folder: Detail
reads `04-structure/chosen/` and its pictures; Look reads `05-detail/`; Handoff copies Look's screens
and pictures and the detail's strings into `07-handoff/`; Acceptance's judges open their seat's earlier
ledger in `04-`, `05-` or `06-…/reads/` and write only in `08-acceptance/reads/`; the builder is given
`07-handoff/` and writes back into `build/`.

**What a stage writes after its own stamp:** nothing into its folder. Each appends the decision to the
package's `DECISIONS.md`, which is no stage's; Acceptance appends to the project's lessons. Whatever is
moved inside a folder (`04-structure/earlier/<n>/` after a rejected round or a board made again,
`06-look/earlier/` in Direction mode) is moved while the stage is in work, never approved. So with the
one step above put behind a reopening, **no step of any skill trips the guard**. The four walks of
`tests/skills.test.mjs` run the stages' own commands from Frame to Acceptance and end on `validate` →
`ok`. The last of them accepts a deviation in today's order: it writes `07-handoff/DECISIONS.md` and
`acceptance.json` first and reopens Handoff after, because "Must not change" names the thing. It ends
`ok` only because that reopening and its stamp follow in the same breath; a `validate` between the two
would print two lines. It is the case § 5.1 asks the words' part to put right, and the walk's order
moves with the page.

**What is left unguarded,** and why:

- `<package>/DECISIONS.md`: appended to after every stamp, by every stage, by rule.
- `<package>/07-handoff-gate/`: the results of the checks on the prototype, the cold implementer's
  ledger and its re-read, Handoff's decision page. It is Handoff's, and written before its stamp, but
  it lies beside the folder, not in it, on purpose (the folder must stand alone). Nothing of it is
  handed to the builder. Guarding it would take a second folder for one stage; it is the one place
  where "the stage's folder" is narrower than "what the stage wrote". Say if it should be added.
- `<package>/build/`: the three pages are copied in at Handoff and are the builder's to write.
- `<package>/work/`: scratch, by rule never read back.
- `state.json`, `STATE.md`: the script's own.
- The outputs of frame, context, intent and cast have no folder: only the file is guarded, as before.
- Outside the package: the project profile, the pool, the lessons, the kit's token copy.
- An editor's own lock or swap file in a stamped folder would be reported as added. Only the four
  names of R132 are passed over; I added none.

## 4. What else changed that a reader of the scripts should know

- `state.json` has two more things: `staleBecause` (an object, beside `reasons`) and, in each stage's
  entry, `files` (`null`, or one hash a file). A folder of two hundred pictures is two hundred lines.
- `validate` looks for a carry list's sources too, so it must be run from the project's root, as every
  skill already says; from elsewhere it reports each as not there, and its message says where it looked.
- `stamp` and `validate` take `root` as an option in the library; the command line takes none.
- `reopen` always prints both lists, `none` for an empty one.
- A new file, `scripts/lib/leftovers.mjs`; `scripts/lib/state.mjs` is now 812 lines.
- The evaluation fixture `cold-implementer-finds-the-gap` holds the in-page file again, whole (a test
  holds the two equal), **and its `ACCEPTANCE.md` got the two rows of the template's table**, so that
  the folder's own list of types agrees with the file beside it. It is no stamped package, and nothing
  else of any fixture was changed. Nothing holds that table equal to the template's: if the words' part
  changes a row of the template again, the fixture's is changed by hand.
- Not checked: Windows and macOS. The corner test and the two new check types were run in this
  machine's Chrome only.

## 5. For the second implementer: the sentences my changes made untrue

Each is left as it was. Where a test pins it, the pin is named; none of them fails today, since each
pins the sentence, not the behaviour.

1. **`skills/acceptance/references/deviations.md`, "He accepts it", steps 2 and 3 (`:15-28`), and the
   section "When `HANDOFF.md` names what changed" (`:33-52`)** — R184's third condition, yours already. What
   is now true: any change to a file of a stamped `07-handoff/` makes `validate` print
   `handoff: changed-since-approval: 07-handoff/<file> changed after handoff was approved on <day>; reopen handoff, or put back what was approved`
   (or "was removed … or put it back", "was added … or take it out"), one line a file up to ten. So
   Handoff is reopened before step 2, once for the batch, and stamped after step 3. When Acceptance is
   awaiting him at that moment, `reopen` prints `…; back in work: acceptance`, and the report's
   `built-from` must be written again before its question is put again (the page already says the
   second half). Pins: `tests/skills.test.mjs`, the test "acceptance: each item matches or deviates and
   he decides each; an accepted deviation is logged and the folder brought up to date; …" (the
   sentence "`HANDOFF.md` is stamped, so it is reopened first, changed, and stamped again. His accepting
   the deviation is the yes a reopening needs, and its reason"), and the walk "Handoff and Acceptance
   run as written", which changes the two files, then runs the page's `reopen` and expects
   `reopened handoff at version 2; stale: none; back in work: none`: its order moves with the page.
2. **`skills/acceptance/SKILL.md:193`**, "Never edit a stamped output as it stands: `HANDOFF.md`, or an
   earlier stage's." Now: nor any file of a stamped stage's folder. Pinned in `tests/skills.test.mjs`.
3. **`skills/design/SKILL.md:94-95`**, "A line with `changed-since-approval` says an approved output was
   edited after its stamp." Now also: or a file of its stage's folder was changed, removed or added.
   And two lines `validate` can now print of an approved stage: code `unfilled` (the template's comment
   or an instruction in braces is still in it) and `approved-without-words` for an output with nothing
   under "Reviewed by the founder". The sentence after it, "Any other line means the package and its
   state disagree", still covers them.
4. **`skills/structure/references/rounds.md:78-80`**, "The script would let you begin it now. Do not: a
   brief written before Intent or Context is approved again is written from what he rejected." The
   script now refuses: `structure cannot be begun: intent, before it on the route, is in-work, not approved; \`next\` names the stage to run`.
   The review says the warning goes. Pinned in `tests/skills.test.mjs` (the test "rounds.md: a graft is
   redrawn once …", the pattern that ends "The script would let you begin it now\. Do not: a brief
   written before Intent or C…").
5. **`skills/design/references/blind.md:132`**, "Where the script's refusal says to delete, move.", and
   **`skills/structure/references/rounds.md:104-105`**, "The merge refuses while a map or a pick lies
   beside the board folder: where its refusal says to delete, move." No refusal says delete any more:
   both say "move it into earlier/<n>/ first" (G12). Pinned in `tests/skills.test.mjs`: "blind.md:
   nothing is deleted …" (`/Where the script's refusal says to delete, move/`) and the rounds test.
6. **G8 and R185, yours already; the facts.** `pool/makers/visual-designer.md:54-57` ("`scripts/accept.mjs
   prototype` measures a contrast or a size by id … For the rest, read the computed value in the
   browser with a script of your own"), `skills/look/SKILL.md:58` (the `measure/` row) and `:108-110`
   ("any other value was read in the browser by a script of the visual designer's own"),
   `skills/look/references/seats.md:64-65` ("Its own measuring script, and what that script read, go in `<package>/06-look/measure/`"), and
   `skills/handoff/references/folder.md:226-231` ("Each row of `measures.md` has its check: a `contrast`
   … a `min-size` … No check measures a gap, a size of text or the length of a line"). Now: a size of
   text is a `style` check (`target`, `property`, `equals`: `"property": "font-size", "equals": "24px"`,
   the value as the browser gives it), a gap is a `gap` check (`targets`: two ids, `axis`: `x` or `y`,
   `equals`: a number of CSS pixels), and only the length of a line is "measured by a person". The
   words are in `node scripts/accept.mjs --help` and in the template's table.
7. **R108, the sentence for the visual designer's card,** as `--help` has it under `in-viewport`: "The
   element that answers "without scrolling" is never a shape inside an <svg>: a drawing that is scaled
   is measured as if it were not."
8. **G5, the refusal the README and setup's browser check hand on,** as printed, one line on stderr,
   exit 1: `playwright-core is not installed in <the kit's root, as an absolute path>: run npm install there`.
   The path it prints is the folder to run it in.
9. **`skills/design/references/loop.md:265-267`** ("It refuses an output that does not name the stage
   before it in `built-from`, one built on a stale input, and a carry list that names what is not
   there.") stays true and is now incomplete: the stamp also refuses an output with none of his words
   under "Reviewed by the founder", and one that still holds its template's comment or an instruction
   in braces; and "a carry list that names what is not there" is true of a `source:` line at last. The
   same page's "The script needs the stage's output to exist, with its header", of `await`, is true
   too; `await` and `begin` now also refuse a stage before its gate.

Not a sentence, but yours to know:

- **G20 is done** (`tests/state.test.mjs`).
- **A test that stamps an output written from a template** must fill it in first, and put its sources
  on disk: `filledIn(text)` and `placeSource(project, ...lines)`, at the top of the "runs as written"
  part of `tests/skills.test.mjs`, beside `scratchRoot`.
- **A sentence of a skill that has a stage's files written after its stamp,** or into an earlier
  stage's folder, will now be contradicted by `validate`. I found one (item 1). If G2, G6 or G9 add a
  step, keep it before the stamp of the stage whose folder it writes.
- The command lines the skills give all still agree with `--help` (`tests/skills.test.mjs` passes
  whole); none had to be changed.

## 6. Found, and not mine to fix

- `skills/detail/SKILL.md`, the gate's carry list, names `<package>/04-structure/reads` and the reads'
  folder of the stage with no "where there is one". `references/forms.md` already says a skipped
  stage's lines are left out, and that with no prototype builder "the carry list then has no line for
  the prototype's folder or the pictures' folder: neither exists". With G17 that last sentence is now
  enforced, not only advised: a stage that cast no reader has no `reads/`, and its line is refused.
  Worth one clause where the lists are given; the refusal names the line in any case.
- The walks of `tests/skills.test.mjs` never ran `shots.mjs` on `04-structure/chosen/`: they asserted
  the command and carried pictures that were not there. They stand in for them now, and say so.

## Commits

```
e15a017 fix: the merge passes over what a mount leaves in a board, takes only a mapped folder for a board, and says move, never delete (R132, G13, G12)
a1cfd33 fix: a stamp holds his words, a filled template, sources that are there and every file of the stage's folder; nothing is begun before its gate (G7, G16, G17, R39, R184, G20)
20a0675 fix: the browser library is loaded where a browser is started, and a kit with no dependency installed says where to run npm install (G5)
15ebdba fix: a pill is rounded as CSS rounds it, and two check types measure a computed style and a gap (R109, R185, R108)
ed3ba83 fix: the decision page's options wrap, so the last letter is in sight like the first (G14)
```
