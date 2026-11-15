# Task 5 report: the blind merge

Status: DONE_WITH_CONCERNS (the concerns are two readings beyond the rulings, listed at the end for a ruling)
Commit: 0f80524 `feat: blind merge with a sealed author map` (branch v2-pipeline, not pushed)

## What I implemented

- `scripts/lib/proposal-file.mjs` is the one shared reader. `readProposalFile(path)` does a fatal UTF-8 decode that drops one byte-order mark, then a JSON parse. Each failure throws `ProposalFileError` with the message `cannot read <path>: <why>`. The module also exports `REASONS` and `reason(e)`: these are the plain-words error reasons that used to live in render.mjs, moved here so they exist only once.
- `scripts/render.mjs` now reads the proposal through the shared reader, and its `main` treats a `ProposalFileError` as an expected failure (exit 1). It keeps its own `readInput` for the kit's stylesheets. The wording of every error is unchanged, so `tests/render.test.mjs` passes untouched: no line changed, no assertion weakened.
- `scripts/lib/walkthrough.mjs` now exports its `PROVENANCE` list, frozen. The merge therefore strips exactly the five keys that `validate` allows. This is a one-line change.
- `scripts/lib/merge.mjs` holds the logic:
  - **Exports.** `mergeProposals(srcDir, outDir, { seed }) → { letters }` and `openMap(outDir)`. Two error classes: `MergeError`, the refusal class, and `SealedError extends MergeError`. Three constants: `MAP`, `PICK` and `MAX_SEED`.
  - **Order of checks.** Everything is checked before anything is written:
    1. the seed: a whole number from 0 to 2^32−1, otherwise a TypeError;
    2. the board folder;
    3. the listing of the proposals folder;
    4. the count of proposals, 1 to 26;
    5. reading every file;
    6. validating every proposal. All invalid files are named, each followed by its `validate` errors.
  - **Shuffle.** The file names are sorted first, so the input order is the same on every OS. With a seed, a Fisher–Yates shuffle draws from **mulberry32**, a small generator I wrote. Without a seed it draws from `crypto.randomInt`.
  - **Letter copies.** `<letter>.json` is the proposal minus the five keys, in its own key order, pretty-printed with 2 spaces, LF line endings and a final newline.
  - **The map.** `MAP.sealed.json` holds `{ file, track, engine }` for each letter, in that field order. `track` and `engine` hold the string, or null when the key is absent or not a string.
  - **Write order.** The letters are written in letter order and the map last, so a half-written board is never sealed.
  - **`openMap`.** It refuses with a `SealedError` unless `PICK.md` can be read and is non-empty after trimming. Only then does it read the map, through the shared reader.
- `scripts/merge.mjs` is the CLI only:
  - `node scripts/merge.mjs <proposals dir> --out <board dir> [--seed <n>]` and `node scripts/merge.mjs open <board dir>`.
  - It also accepts `--flag=value` and `--help`/`-h`.
  - Exit codes: 0 success, 1 a refusal, 2 bad usage. A flag never takes a value that starts with `--`, nor `-h`.
  - On success it prints `merged N proposals into <board>: A, B, C` and one line saying where the sealed map is and that it opens only once PICK.md holds the pick.
  - `open` prints `A  <file>  <track>  <engine>`, with `-` where the proposal named none.

## What I tested, and the results

`tests/merge.test.mjs` has 20 tests. I ran `node --test tests/merge.test.mjs tests/render.test.mjs`: 55/55 pass. I ran `npm test` once before committing: 223/223 pass, 0 skipped. In short, the tests cover:

- **The brief's seven tests:**
  - three fixtures merge to A, B, C;
  - no `author`/`engine`/`track`/`model`/`source` in any copy, neither the key nor its value;
  - a fixed seed gives the same board twice, byte for byte, and at least one of three seeds differs from the file order;
  - the CLI's stdout has the count and the letters and no source file name or signature;
  - `openMap` throws `SealedError` without PICK.md and returns the map once PICK.md exists;
  - one invalid proposal makes the whole merge throw before any letter is written;
  - 27 proposals are refused.
- **Every ruling:**
  - the shared reader: BOM dropped once, a double BOM refused, not UTF-8, not JSON, not found, a folder, part of the path is a file;
  - the merge reads through the shared reader: a file with a BOM merges and its letter has no BOM; broken files are refused by the CLI with exit 1;
  - a sealed board is refused, its bytes unchanged, before and after a pick;
  - `open` refuses (exit 1, nothing printed) when PICK.md is absent, empty, blank (spaces, tabs, CRLF, a lone BOM) or a folder, and prints the exact lines once it is written;
  - non-`.json` files, `x.json.bak`, sub-folders and a folder named `folder.json` are ignored, and `Shouty.JSON` is read;
  - an empty folder, or one with no `.json` file, is refused;
  - 26 proposals merge to A to Z with every source once;
  - exit-code-2 usage cases (18 of them), each writing nothing;
  - `--help`;
  - paths with spaces everywhere;
  - no product name in the new files.
- **The shuffle is a real permutation.** The map's files are exactly the inputs, each once. Each letter's bytes equal the source the map names, with the provenance keys removed. This is checked for 3, 5 and 26 proposals, and for an unseeded run.
- **Golden orders.** The seeded orders for seeds 1, 2 and 3 are pinned. I checked them against an independent, as-published mulberry32 run as a separate script.
- **crypto.randomInt is the unseeded source.** A preload replaces `crypto.randomInt` with a function that returns 0 and makes `Math.random` throw. The unseeded board then comes out as exactly the permutation that Fisher–Yates gives with j=0. With `--seed`, `crypto.randomInt` throws if it is called, and the board equals the library's board for that seed.
- **Listing order does not matter.** A preload reverses `readdirSync`; with a seed, the board is the same, byte for byte.
- **Write failures** use an EACCES preload. The board folder: `cannot write <board>: no permission`, nothing made. A letter: `cannot write <board>/B.json: no permission`, only A.json exists and no map. Under seed 1, A holds unified-list, which pins letter-order writing.

## TDD evidence

- **RED.** Command: `node --test tests/merge.test.mjs`.
  - Before any module existed: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../scripts/lib/merge.mjs'`, `# tests 1 # pass 0 # fail 1`. This was expected, because nothing had been written yet.
  - Then against empty stubs that export the names and throw `stub`: `# tests 20 # pass 1 # fail 19`. The one that passed is the product-name test, which is expected on stubs. All other 19 failed on their own assertions.
- **GREEN.** Same command plus `tests/render.test.mjs`: `# tests 55 # pass 55 # fail 0`. Then `npm test`: `# tests 223 # pass 223 # fail 0`.
- **What failed on the first green attempt.** All five were test-side or wording issues:
  - The golden seed orders were placeholders written before the generator existed. I replaced them with the implementation's output, after an independent reference script gave the same orders.
  - A `mkdirSync` in a test was missing `recursive`.
  - `snapshot` could not read a sub-folder.
  - My regex used `.+`, but V8 quotes the start of the JSON text, newlines included, in a double-BOM error.
  - The usage text broke "new or empty" across a line.

## The hand mutation

I ran a scripted pass of **100 mutants**, each applied, run against `tests/merge.test.mjs` and `tests/render.test.mjs`, then restored. **100/100 caught.** I tried two more by hand, and both were caught:

- `PROVENANCE` in walkthrough.mjs with `model` dropped (7 failures);
- the `isFolder` fallback changed so that a broken link is skipped instead of read (caught by the dangling-link case).

The mutants cover every check and both halves of every compound condition:

- **The reader:** `fatal`, `ignoreBOM`, BOMs dropped repeatedly, each `REASONS` entry, `reason`, the path in the message, the UTF-8 and JSON wording, the error class.
- **render.mjs:** render's catch of `ProposalFileError`.
- **The board:** the board check as a whole; the ENOENT branch both ways; the sealed check and its class; the not-empty check and `>1`; raw errors.
- **The sources:** `/i`, the `$` anchor, `isFolder`, the `.json` filter, the sort, zero proposals, `>=26` and `>27`.
- **Validation:** validation as a whole, only the first fault, the fault filter, the errors listed, the file named.
- **The map:** track and engine as `?? null` and dropped, the map holding the path, field order, an extra field.
- **The letters:** **each of the five stripped keys on its own**; sorted keys; no final newline; 4-space indent; CRLF.
- **Write order:** the map first, letters in source order.
- **Writing:** raw mkdir and write errors; no `recursive`.
- **The shuffle:**
  - `Math.random` when unseeded, crypto when seeded;
  - each of the four seed bounds, and `>=` at the top;
  - Fisher–Yates `i>1`, and Sattolo;
  - two generator constants.
- **`open`:** blank, whitespace, absent-raw and absent-opens picks; SealedError as a MergeError, both ways.
- **The CLI:**
  - parsing: `open` positional, open-with-flags, unknown flag, a flag given twice, `''` and missing values, `--x` and `-h` as values, both count checks, `--out` missing;
  - the seed: digits, the bound, `>=`, the seed passed as text, the seed not passed;
  - output: plural and singular, printing the proposals folder, `null` for `-`, single spaces;
  - exits: both catch halves, both exit codes, help on stderr, no help.

I know of nothing left unpinned. One choice was made on purpose and is noted rather than pinned. `openMap` checks PICK.md before it reads the map, but the two orders are indistinguishable from outside unless both files are missing, so there is no test for that order.

## What I checked about leaks

The question: reading only what the script printed and the letter files, could a judge tell which maker, engine or track wrote which letter? I ran a real board in which three makers each had their own habits:

- a BOM, CRLF line endings, a 4-space indent and `author` first;
- one-line JSON with `\uXXXX` escapes and `track: fresh`;
- tab indentation.

The source file names were `zeta-fresh-engine.json`, `alpha-system.json` and `mid.json`.

- **Standard output and error:** stdout is exactly the count, the letters, the board path and the map and PICK paths, and stderr is empty. No source file name, folder, stem or signature appears. A test pins the exact bytes and looks for each name and value one by one.
- **File names:** `A.json`… and `MAP.sealed.json` only. A board folder that holds anything else is refused, so the makers' files cannot sit beside the letters even when `--out` is the proposals folder.
- **Whitespace, line endings and escapes:** every letter is re-serialized, so BOM, CRLF, indentation and escape style are all gone. Every letter began `{\n  "name": `, with 0 CRs, 0 `\u00` escapes and 0 provenance keys.
- **Key order:** the proposal's own order, minus the stripped keys, as the ruling says. This is a residual signal, see the concerns.
- **Timestamps:** nothing time-related is written into any file. On this tmpfs all four files had the same mtime to the nanosecond.
- **Modification and creation order:** letters are written A, B, C, then the map, so inode numbers rise in letter order (13445080…83). The unsorted listing (`ls -U`) was `MAP, C, B, A`. Neither follows the sources' order, because the letters are a shuffle of them.
- **Seed:** the seed is never printed or stored. The usage text says a board people will read is merged without one, because anyone who knows the seed and the file names can rebuild the map.

## Files changed

- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/lib/proposal-file.mjs (new)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/lib/merge.mjs (new)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/merge.mjs (new)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/tests/merge.test.mjs (new)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/render.mjs (reads through the shared reader; −26 lines)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/lib/walkthrough.mjs (`PROVENANCE` exported, frozen)

## Self-review findings and concerns

1. **Beyond the rulings, for a ruling: the board folder must be new or empty.** The ruling refuses only when `MAP.sealed.json` exists; that case keeps its own `SealedError` message. I also refuse any board folder that holds anything at all (exit 1, `MergeError`). Without this rule:
   - `--out` equal to the proposals folder would put the source file names beside the letters, which is a blind leak, and a source named `A.json` would be overwritten;
   - a leftover `PICK.md` from an earlier board would open the new board's map at once;
   - leftover letters, for example a stale `D.json`, would sit on a smaller board.

   This matches R53's "a board is rebuilt only by deleting it on purpose". The cost: a board folder that someone or some tool pre-filled (a `.DS_Store`, a README) is refused. The plan's Structure flow has merge create the board before render writes into it, so nothing in the plan is blocked. If the ruling is to keep only the MAP check, that means deleting `checkBoard`'s last `if` and changing one test.
2. **Beyond the rulings, small:** `.json` matches in any case, so a proposal saved as `.JSON` is not silently dropped. A dangling symbolic link named `.json` is read and refused rather than skipped. `track`/`engine` values that are not strings go into the map as null, since `validate` does not type the provenance keys.
3. **Residual fingerprint: key order.** The ruling fixes "keys in the proposal's own order". An engine that always writes its keys in a habitual order, at the top level or inside items such as `{"text","role"}` against `{"role","text"}`, keeps that order in its letter, and a careful judge reading the JSON could group letters by it. Writing every object in the walkthrough format's own key order would remove that signal. I did not do it because the ruling says otherwise.
4. **Not mine to fix, noted:** a letter copy still carries `firstIdea` and every word the maker wrote. If a maker writes "as the fresh pass…", that is content, and the merge does not touch it. render never draws `firstIdea` (R46), but a judge who opens `<letter>.json` would see it.
5. `open` shows a missing track or engine as `-`. The ruling gave the line shape but not how to show a null.
6. `node scripts/merge.mjs open …` treats a first argument `open` as the subcommand, so a proposals folder literally named `open` has to be written `./open`.

---

# Fix report: a letter copy carries no maker's fingerprint (controller's rulings on concerns 1–3)

Status: DONE
Commit: 9619f02 `fix: a letter copy carries no maker's fingerprint — the format's key order, no first idea, a sealed form to check it` (branch v2-pipeline, not pushed, nothing amended)

## What changed

- **Concern 1 (accepted as built).** The board folder must be empty or absent. The refusal now reads `cannot merge into <board>: the folder is not empty. A board folder must be empty or absent, so that nothing but its letters and its sealed map is read beside them.` The usage text says `<board dir> must be empty or absent`.
- **Concern 3a: the format's key order.** `scripts/lib/walkthrough.mjs` exports `ORDER`, frozen. It holds:
  - `letter`: `name, bet, cost, absent, hardest, screens`;
  - `screen`, `role` and `container`: the format's own key lists, `id, title, container, over, note, items` / `role, text, id, note, primary, options` / `container, label, open, items`.

  The merge builds each letter copy by walking `ORDER` and recursing into `screens` and `items`. An item takes the role order or the container order depending on what it is. A key that is absent stays absent, and nothing is added. The maker's key order, spacing, line endings, BOM and escapes never reach a letter.
- **Concern 3b: `firstIdea`.** It is not in `ORDER.letter`, so no letter carries it. It stays in the source file.
- **Concern 3c: the sealed form.**
  - `validate(proposal, { sealed: true })` checks the letter form. Each of `firstIdea, author, engine, track, model, source` that is present gives exactly one error: `proposal: "<key>" stays in the source file; a letter copy does not carry it`. In that form the `firstIdea` text check is skipped. Everything else is checked as before.
  - `validate(proposal)` and `{ sealed: false }` are the unchanged source form.
  - The top-level key check is now one pass over the proposal's keys, so a sealed-form error keeps the proposal's order among its unknown-key errors.
  - The merge validates each source in the source form, as before. It then checks every letter in the sealed form, **as the exact text that will be written** (`validate(JSON.parse(text), { sealed: true })`), for every letter, before the board folder is even made. A failure throws a plain `Error`, which is a bug: the CLI prints the stack, exits 1, and nothing is written.
- **Concern 3d: render.** `render.mjs` checks a proposal that carries `firstIdea` in the source form and one without it in the sealed form, through `validate(p, { sealed: !Object.hasOwn(Object(p), 'firstIdea') })`. It does this both in `renderProposal` and in the CLI. `Object()` keeps `null` and `undefined` answering "must be an object". The drawn output is unchanged.
- `PROVENANCE` in walkthrough.mjs is private again: the merge no longer filters by it.

## Concern 2: decisions, accepted as built

- A file named `.json` in any case is read, so a proposal saved as `.JSON` is never silently dropped.
- A broken symbolic link named `.json` is read and refused (`cannot read <path>: not found`), never skipped.
- A `track` or `engine` that is not a string, or is absent, goes into the map as `null`, because `validate` does not type the provenance keys.
- `open` prints `-` for a missing track or engine.

## Tests

- **`tests/merge.test.mjs`, 22 tests (was 20).**
  - The test spells out the ruling's order lists itself (`FORMAT`, `SOURCE_ONLY`). From them it builds `letterOf`, the expected letter bytes, and `assertFormatOrder`, which checks that every object in a letter, at every depth, has its keys in the format's order and nothing beyond.
  - Tests 1–4 now expect the letter form: no `firstIdea` (neither the key nor its text), the format's order, and a valid sealed form.
  - **New:** the same proposal written three times gives three byte-identical letters (B = A, C = A, byte for byte). The render fixture `every-part.json` is used, because it has every role, every container, a dialog, notes and options, and the test asserts that the reversal reaches the proposal, a screen, a role item and a container item. The three files are:
    - as is;
    - every key at every level reversed, with tab indentation;
    - reversed, with a different `firstIdea` and different provenance, a BOM, CRLF line endings and 4-space indentation.
  - **New:** a letter copy that fails the sealed form is a bug, and nothing is written.
    - A preload patches `JSON.stringify` so that a `firstIdea` slips into **letter B only** (calendar under seed 1) as it is serialized.
    - The expected result: exit 1, empty stdout, and a stack starting `Error: the letter copy B is not in the sealed form, a bug in the merge; nothing is written` followed by the sealed-form error. The board folder does not exist.
    - Aiming the fault at B rather than A is what tells "every letter checked before any is written" apart from "each checked as it is written".
  - **Added to the invalid-proposal test:** a source without `firstIdea` (a letter copy dropped among the proposals) is refused with `proposal: "firstIdea" is missing`. Its `track` is no fault in the source form.
  - The not-empty message and the help word changed.
- **`tests/walkthrough.test.mjs`, 3 new tests (38 in all).**
  - **A letter copy validates in the sealed form.** This includes the three fixtures without `firstIdea` and `track`. Under `undefined`, `{}` and `{ sealed: false }`, the source form still requires `firstIdea` and still accepts provenance.
  - **The six keys, one error each.** Each of the six is refused with exactly one error, for the values `'a line of text'`, `5` and `''`. When several appear at once, the errors come in the proposal's order, mixed with an unknown key.
  - **Everything else is checked the same.** The sealed form gives the same errors as the source form for a broken proposal, and `null` is refused. A provenance key nested in a screen is an unknown key in either form.
- **`tests/render.test.mjs`, 1 new test (36 in all).**
  - The render fixture and the three proposals are merged. For every letter, `renderProposal(copy, { letter })` is byte-identical to `renderProposal(source, { letter })`, and the render CLI drawing `<board>/<letter>.json` writes the same page.
  - A letter copy with `engine` added is refused in the sealed form, with the exact message.
  - `null`, `undefined`, a string, a number and an array are each refused as "must be an object".
  - No existing render test changed.

## Commands and output

- **RED.** The new tests were run against the previous commit's implementation: my four implementation files copied aside, `git checkout HEAD --` on them, and `node --test tests/merge.test.mjs tests/render.test.mjs tests/walkthrough.test.mjs`. Result: `# tests 96 # pass 82 # fail 14`. The 14 failures were:
  - merge 1, 2, 3 (byte-identical letters), 4, 6, 12 (the sealed-letter bug), 17 (not-empty wording), 18, 19, 21 (help);
  - render 58 (the letter copy draws);
  - walkthrough 88, 89, 90 (the sealed form).

  This is expected: the old code kept `firstIdea` and the maker's order and had no sealed form. Then my files were copied back.
- **GREEN, focused.** `node --test tests/merge.test.mjs tests/render.test.mjs tests/walkthrough.test.mjs`: `# tests 96 # pass 96 # fail 0 # cancelled 0 # skipped 0 # todo 0`.
- **GREEN, full.** `npm test`: `# tests 229 # pass 229 # fail 0 # cancelled 0 # skipped 0 # todo 0`. The output holds no "warning", "deprecat" or "not ok" line, and `tests/.tmp/` is empty afterwards.

## Hand mutations

- **The new list: 46 mutants, 45 caught.** The one survivor is a deliberate equivalent control, a mutant that takes `firstIdea` and drops it again, to show the harness does not flag equivalents. Caught:
  - each of the six keys added to the letter order (6);
  - the letter order with absent and hardest swapped;
  - the letter order without `absent`;
  - the screen, role and container orders each reversed;
  - the source form refusing the six;
  - the sealed form refusing none;
  - the sealed form requiring `firstIdea`;
  - the sealed form checking no text field;
  - the source form not requiring `firstIdea`;
  - sealed by default;
  - the sealed-form errors out of the proposal's order;
  - the sealed-form wording;
  - the sealed form allowing each of the six (6);
  - no letter check;
  - letters checked in the source form;
  - the object checked instead of the written text;
  - the bug reported as a `MergeError`;
  - the pre-check removed;
  - screens, and then items, copied in the maker's order;
  - the role and container orders swapped;
  - the letter being the source as written;
  - letters written in source order;
  - the map written first;
  - sources checked in the sealed form;
  - the old not-empty and usage wording;
  - render in the source form only, the sealed form only, the forms swapped, and without `Object()`;
  - `renderProposal` and the render CLI each falling back to the source form.
- **Found while mutating, and fixed in the test.** My first "checked while writing" mutant left the pre-check in place, so it proved nothing. The real mutant (no pre-check; each letter checked just before it is written) showed that the fault-injection test could not tell the two apart while the fault hit letter A. I aimed the fault at letter B, and the real mutant is now caught.
- **Double mutants: 6 of 6 caught.** Each of the six keys was added to the letter order **with the sealed check removed**, and each is caught by the letter tests alone (4 to 8 failures each). Every stripped key is pinned by the letter tests, not only by the bug check.
- **The original 100 mutants, re-run with all three test files: 92 caught, 8 no longer apply.** Those 8 are the five per-key `PROVENANCE` filters, the sorted maker keys, the map written first, and letters written in source order. They target code this commit replaced, and all 8 are re-expressed against the new code in the list above, all caught.
- **Equivalent mutant noted.** Removing `if (!Object.hasOwn(object, key)) continue;` in `inOrder` would set absent keys to `undefined`, which `JSON.stringify` leaves out, so the written text is the same. Since what is written is the text, nothing is added either way.

## Leak check: times and order on disk

A real board was merged with `--seed 1` on the repository's own filesystem (fuseblk, under the ignored `tests/.tmp/`) and on tmpfs. With seed 1, A = unified-list, B = calendar, C = free-first.

- **fuseblk (100 ns timestamps).**
  - `ls -lt` lists MAP.sealed.json (…22.6289565), C.json (…22.6288965), B.json (…22.6288352), A.json (…22.6287573). `ls -ltr` is the same in reverse.
  - Inodes rise A < B < C < MAP.
- **tmpfs.** All four files have one identical timestamp, so `ls -lt` falls back to name order. Inodes again rise A < B < C < MAP.
- **What a listing by time shows.** Only the letter order, then the map last. The letter order is public on the board anyway, and it is a shuffle: here unified-list, calendar, free-first, against the sources' name order calendar, free-first, unified-list. Neither times nor creation order say which source is under which letter. If letters were written in source order, or the map first, the time order would follow the sources. Both of those mutants are caught (merge test 18).
- **Contents.** The byte-identical-letters test is the leak check for contents. Three makers' habits (key order at every depth, indentation, tabs, CRLF, BOM, a different `firstIdea`, different provenance) produce the same bytes.

## Files changed in this commit

- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/lib/walkthrough.mjs (`ORDER`; the sealed form of `validate`)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/lib/merge.mjs (letters in the format's order, no `firstIdea`, each letter checked in the sealed form as written; new not-empty wording)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/merge.mjs (usage text)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/scripts/render.mjs (accepts either form)
- /mnt/data/Downloads/Proyectos/ux-runbook-v2/tests/merge.test.mjs, tests/render.test.mjs, tests/walkthrough.test.mjs

## Remaining notes

- A letter that fails the sealed form exits 1 with a stack, as an unexpected error does. That is deliberate (the ruling calls it a bug), and it is what the test pins.
- Maker *words* are still the maker's, by design: the text of `name`, `bet`, notes and the rest. A maker who writes its own name into a note is outside what a merge can strip.

---

# Fix round 1: the blind holds — one path, written whole, the map beside, only a real pick opens it

Status: DONE
Commit: 8b56796 `fix: the blind holds — the board is written whole through one path, the map sits beside it, and only a real pick opens it` (branch v2-pipeline, not pushed, nothing amended)

## Feasibility on this file system (checked first, as asked)

On the NTFS mount (fuseblk) and on tmpfs:
- `rename(dir, absent)` succeeds;
- `rename(dir, existing empty dir)` replaces it;
- `rename(dir, folder holding anything)` fails with **ENOTEMPTY**, even when the folder holds only `.DS_Store`;
- `rename(dir, a file)` fails with ENOTDIR;
- `writeFileSync(existing, …, { flag: 'wx' })` fails with **EEXIST**.

So the all-or-nothing rename can refuse a non-empty board here, and no workaround was needed.

## What changed, item by item

**C1: one path, written whole (Critical).**
- **One path per folder.** `onDisk(path)` in `scripts/lib/merge.mjs` (exported) gives the path the system would read or make. It walks the path part by part:
  - every link in the part that exists is followed with `realpathSync`;
  - `..` after a resolved part goes to that real folder's parent, as the system does;
  - the part that does not exist yet is added as written.

  `mergeProposals` resolves the board path and the proposals path **once**, at the top, and every check, read, write and message uses those two values. `openMap` resolves the board the same way.
  - Case A: `missing/../board` resolves to `board`, so the sealed board is refused and no `missing/` is made.
  - Case B: `work/stage/../board`, where `stage` is a link, resolves to the board the system reaches through the link, and that board is refused.
- **Whole or not at all.** The letters are written, in letter order, into `mkdtemp(<parent>/.<board>.merging-)`, a new folder beside the board. That folder is renamed into place. A rename fails onto a folder that holds anything (ENOTEMPTY), so a board is never written over.
  - An empty board folder is removed just before the rename, because Windows renames onto no folder at all, and it is put back if the rename then fails.
  - On any failure: the staging folder is removed; every folder the merge made above the board is removed while empty (from the nearest up, never above the first one it made); and if the board was taken by another merge in the meantime, the refusal names what is there.
- **The map is created, never written over.** It is written with `{ flag: 'wx' }`.
  - If the map cannot be written, the board just put in place is taken back.
  - If the map appeared meanwhile (EEXIST, which is another board sealed beside this one), the refusal is the sealed one and the other merge's map is left alone.
  - Any other failure also removes the part of the map this merge began.
- m1 and m7 are closed by this.

**I1: the seal (Important, ruled).**
- (a) **The map and the pick sit beside the board.** They are `MAP.sealed.json` and `PICK.md` in the board folder's parent, and the board folder holds the letters only. The merge refuses, in this order:
  - when a map already sits there (SealedError, "one folder holds one board"; also for a fresh board name beside it);
  - when a pick is left there from another board (my addition, see the concerns);
  - when the board folder holds anything.

  `open <board dir>` reads both files from the parent.
- (b) **A real pick.** `open` requires a line matching `/^\s*Pick:\s*([A-Z]|none)\s*$/`, tested line by line, so it can stand anywhere among the founder's words. Leading and trailing white space is allowed (a BOM and a CR count as white space).
  - Refused: no such line (an empty file, `TBD`, a zero-width space, a soft hyphen, `pick:`, `Pick: b`, `Pick: BC`, `Pick: None`, `Pick: B, with…`); a letter that is not on the board (the message lists the board's letters); and **two different picks**, which is my addition (see the concerns).
  - The same pick written twice is one pick.
  - Every refusal says the form expected: `a line "Pick: <letter>" naming a letter on the board, or "Pick: none"`.
- (c) **The success line** is `merged N proposals into <board folder>: A, B, C`, with the board as resolved. It gives neither the map's path nor how to open it.
- (d) **Constants and help.** `MAP` and `PICK` keep their names; their comment now says they sit beside the board. `--help` says where the map and the pick sit, that the board folder holds the letters and nothing else and is written whole or not at all, that one folder holds one board, and the exact pick line.

**The minors.**
- **m2:** `openMap` checks the map's shape before returning it. It must be an object of one-capital-letter keys, at least one, each an object with a non-empty string `file` and a `track` and `engine` that are each a string or null. Otherwise it throws `MergeError` with `cannot open <map>: it is not an author map; <what>`.
- **m4:** every byte-order mark and invisible character in `tests/merge.test.mjs` is now an escape. This needed a second pass, described below.
- **m5:** the not-empty refusal names one entry, the first by name: `the folder is not empty (it holds ".DS_Store")`.
- **m6:** `render` uses the sealed form only when none of `firstIdea, author, engine, track, model, source` is present (`SOURCE_ONLY`, now exported from walkthrough.mjs); otherwise the source form. A source that forgot `firstIdea` and carries `track` is told `"firstIdea" is missing`. The output is unchanged.
- **m8:** `scripts/lib/cli.mjs` holds the parser and the main-file check, and `render` and `merge` both use it.
  - `parseArgs(argv, { flags })` reads positionals, `--flag value` and `--flag=value`, and `--help`/`-h`. It refuses an unknown flag, a repeated flag, a missing or empty value, and a value that starts with `--` or is `-h`.
  - It also exports `UsageError`, `HELP`, and `isMain(import.meta.url)`, which follows links and is false with no file.
  - `scripts/state.mjs` is untouched.
  - The one wording change: `open <board> --out x` now says `unknown flag --out` (it said `open takes no flag; --out is given`). The test asserts the new words exactly.
- **m9:** `KEYS` (now exported) lists the proposal's keys in the format's order. `ORDER.letter` is **derived** from it (`KEYS.proposal` less `SOURCE_ONLY`), and the invariant test pins both the sets and the ruled order.
- **m3:** no action, as ruled.

## Tests

- **`tests/merge.test.mjs`, 32 tests (was 22).** Every board now gets a folder of its own, since its map sits in the parent. New or rewritten:
  - **C1:**
    - Case A, exactly as given: `--out board --seed 1`, then `--out missing/../board --seed 2`, run from the board's folder. Result: exit 1 with the sealed message, the first board and its pick byte-identical, and no `missing/`. The library refuses the same way, and a new board reached that way is made where the path leads, with nothing else made.
    - Case B, exactly as given: `stage` is a link to a folder elsewhere and a pick is present. Both `work/stage/../board` (absolute) and `stage/../board` run from `work` are refused, twice each with different seeds. Everything is byte-identical and no `work/board` is made. `open` through the link path opens the same map, and a new board through another link is made where the system puts it.
    - The proposals folder through a link and `..`: the proposals the system reaches are the ones merged (two folders hold the same file names with different proposals), and a refusal names the folder the system reached.
    - **Two merges at once into one new board, 20 rounds.** A preload holds every rename back 150 ms so both pass their checks first; I confirmed by tracing that the two renames land within 0 to 3 ms of each other. In every round exactly one exits 0 and the other exits 1, the board holds A, B, C matching the map, and the parent holds the map and the board and nothing else.
    - **Two merges at once into two boards beside each other, 10 rounds.** This pins `wx` and the take-back: both renames succeed and both try the map. In every round exactly one wins; the loser gets the sealed message and its board is gone.
    - **Writes that fail half-way, injected by preload.** Each leaves no letter, no map and no stray folder:
      - a letter in the staging folder; an empty folder above that the merge did not make is kept;
      - the parent that cannot be made;
      - a rename that is refused; a board folder that existed empty is there again, empty;
      - a map that cannot be written; the board is taken back, and so is the folder made for it;
      - a map that is begun and fails; the part written is removed;
      - a refused rename where no board folder was there; none is made.
    - **The write order.** A preload logs every `writeFileSync`. Under seed 1 (A unified-list, B calendar, C free-first, which is not the files' order) the log is exactly `A.json, B.json, C.json, MAP.sealed.json`.
    - **Rename edge cases.** With Windows-like renames, an existing empty board folder is still used. When another merge fills the board just before the rename (with and without Windows-like renames), the refusal names `"A.json"`, and the other merge's file is untouched.
  - **I1:**
    - the board folder holds the letters only and the map sits beside it;
    - a fresh board name beside an existing map is refused (SealedError);
    - a sealed board is still refused after a pick, and after its folder is deleted;
    - a stale pick beside is refused;
    - `openMap`: no pick; an empty pick; blank; a BOM alone; `TBD`; a zero-width space alone or after the letter; a soft hyphen; `pick:`; `PICK:`; `Pick: b`; `Pick: BC`; `Pick: None`; `Pick:` alone on its line with the letter on the next; `Pick: B, with…`; `I pick B. Pick: B`; `Pick: Z` and `Pick: D` on an A–C board; two different picks, including `none` and C; a pick that is a folder. Accepted: `Pick: B` with no newline, `Pick: none`, `Pick:C`, a BOM and CRLF, the line among the founder's words with a tab and spaces, and the same pick twice;
    - the CLI `open`: TBD, Z and the real pick, with exact output;
    - the success line holds no map name, no pick name and no "open".
  - **m2:** 17 malformed maps, each refused with its exact message, by the library and the CLI.
  - **m5:** `.DS_Store`, a leftover `D.json`, the proposals themselves and a nested proposals folder, each named in the refusal.
  - **m4:** the file holds no invisible character. The only characters above ASCII are `–`, `—` and `…`.
- **`tests/cli.test.mjs` (new), 4 tests:**
  - positionals and both flag forms;
  - `--help`/`-h` wherever it stands unless a fault comes first;
  - every refusal, with its exact message;
  - `isMain` true in the main file (also through a link), false in an imported file, and false with no file.
- **`tests/walkthrough.test.mjs`, 1 new test:** the invariant. `ORDER.letter` is `KEYS.proposal` less the six, and each item order equals its `KEYS` list, compared both as sets and in the ruled order.
- **`tests/render.test.mjs`, 1 new test, and the letter-copy test updated** (the map is read from beside the board; the board holds only letters):
  - none of the six present: sealed form, the same page;
  - any one of the five provenance keys alone: source form, `"firstIdea" is missing`;
  - `firstIdea` alone: a source, the same page;
  - the CLI on a source that forgot `firstIdea`: exact stderr.

## Commands and output

- **RED.** The new tests, run against the round's starting code: `node --test tests/merge.test.mjs tests/render.test.mjs tests/walkthrough.test.mjs tests/cli.test.mjs`. Result: `# tests 68 # pass 42 # fail 26`.
  - 24 merge and render tests failed on their own assertions: the map was inside the board, no `Pick:` line rule, no shape check, cases A and B reshuffled, the races, the half-way writes, the new messages.
  - `tests/cli.test.mjs` failed to load: `ERR_MODULE_NOT_FOUND ... scripts/lib/cli.mjs`.
  - `tests/walkthrough.test.mjs` failed to load: `does not provide an export named 'KEYS'`.
- **GREEN, focused.** The same command after the changes: `# tests 111 # pass 111 # fail 0 # cancelled 0 # skipped 0 # todo 0`.
- **GREEN, full.** `npm test`: `# tests 244 # pass 244 # fail 0 # cancelled 0 # skipped 0 # todo 0`. The output has no warning, deprecation or `not ok` line, and `tests/.tmp/` is empty afterwards.
- **On the first green attempt,** one test failed for a test reason: `refuses(..., undefined)` fell back to its default flags. I fixed the test, not the code.

## The judge, played again

I merged three makers with different habits into `structure/board`:
- `zeta-fresh-engine.json`: a BOM, CRLF, 4-space indentation, `author` first, `track: fresh`, `engine: zeta-engine`;
- `alpha-system.json`: one line, `\uXXXX` escapes, `track: system`, `engine: alpha`;
- `mid.json`: tab indentation, keys reversed, no engine.

- **What the merge printed:** `merged 3 proposals into <work>/structure/board: A, B, C`, and nothing else.
- **Everything in the board folder:** `A.json` (2637 bytes), `B.json` (3369), `C.json` (4670). Nothing else: no map, no pick, no staging folder, no hidden file.
- **Times:** A …757962, B …758029, C …758100, rising in letter order.
- **Inodes:** 1309748 A < 1309750 B < 1309751 C.
- **In every letter:** the keys are `name,bet,cost,absent,hardest,screens`; 0 CRs, 0 `\u` escapes, 0 of the six keys.
- **The parent:** holds `board`, `MAP.sealed.json` and `proposals`. Readers are told not to open the latter two. After `Pick: B` beside it, `open` printed `A  mid.json  system  -`, `B  alpha-system.json  system  alpha`, `C  zeta-fresh-engine.json  fresh  zeta-engine`.

**What a reader of the board folder alone can learn:**
- how many proposals there are;
- what each structure says, in the maker's own words (m3, by design);
- each letter's size in bytes, which follows from its words.

**What it cannot learn:**
- any source file name, author, engine, track, model or source;
- any first idea;
- any maker's habit of format: BOM, CRLF, indentation, escapes, key order at any depth;
- the order the sources were in, since the letters are shuffled and file times and creation order follow the letters, not the sources;
- where the map is, since it is not in the folder and the success line does not say.

## Additions beyond the rulings, for a ruling

1. **A pick left beside the board is refused at merge time.** Under the old rule, the board folder holding anything, a stale `PICK.md` was refused because it sat inside the board. Now it sits in the parent, which is not required to be empty, so without this check a pick from an earlier board would open the new board's map at once whenever its letter exists on the new board. The refusal is `cannot merge into <board>: <pick> already exists, a pick made on another board; delete it on purpose first.` It is pinned by a test. If ruled out, delete one line in `checkBoard` and one test.
2. **Two different picks in one `PICK.md` are refused** (`that file names more than one pick (A, B)`), so the map never opens on an ambiguous pick. The same pick written twice counts as one.
3. **The board folder's emptiness is now checked by the rename alone, not also up front.** The first mutation pass showed the up-front `readdir` check was redundant with the rename: every refusal it gave, the rename gives with the same words. I removed it, so there is one guard and no window between a check and a write. The cost: a non-empty board with invalid proposals now reports the invalid proposals first, and a staging folder is briefly made and removed before the refusal.

## Remaining notes

- `onDisk` follows links with `realpathSync` part by part. A link that dangles is treated as a part that does not exist, and the write that follows fails with a worded reason.
- On Windows a rename onto an existing folder always fails. That is why an empty board folder is removed just before the rename (and put back on failure), and why a failed rename is classified by what the board then holds rather than by the error code. Both behaviours are pinned with a Windows-like preload here, but not run on Windows.
- Merges into two boards beside each other: the loser's board exists for a moment between its rename and its failed `wx`, before it is taken back. A reader listing that parent in that instant could see two board folders. Neither has a map, and one disappears.

## Hand mutations

- **The round's own list: 80 mutants, 75 caught.**
  - **Parser:** `lib/cli.mjs` throughout: help, unknown flag, flag given twice, the empty and missing value halves, the `--` and `-h` value halves, split at the last `=`, single dash, no default options, `isMain` without try, without links, always true.
  - **Paths:** `onDisk` with `..` ignored, links not followed, `..` taken lexically.
  - **Checks:** no map check; no stale-pick check; a different entry or no entry named.
  - **Whole-board writes:** staging outside the parent; copy instead of rename; no take-away of the empty board; no put-back; staging left behind; made folders left behind; a lost race reported as a write error.
  - **The map:** written over; the board kept when the map fails; someone else's map removed; a half-written map left; made folders left; a map that appeared reported as a write error; the map inside the board; the map and pick looked for inside the board.
  - **The pick line:** unanchored at the start and at the end; case-blind; lower-case; `None`; only space and tab; `\s+`; invisible characters taken as white space; no de-duplication; no line opens; two picks open; a letter not on the board opens; `none` refused; the pick file read raw.
  - **The map's shape:** unchecked; not an object; array; null; empty; `AB`; `a`; entry not an object; file of any type; empty file; track unchecked; engine unchecked; missing taken as null.
  - **CLI and render:** `open` read as a positional; an extra flag known; render's firstIdea-alone, `every` and no-`Object()` variants; render without `--letter`; render run on import.
  - **Walkthrough:** the six kept in the letter order; the format order changed; a hand-written letter order; `model` not stripped.

  The 5 not caught:
  - **#16** is equivalent: `.` kept in `onDisk`, which `join` drops anyway.
  - **#17** matched twice (`mergeProposals` and `openMap`). Re-targeted as two mutants; **both caught**.
  - **#22 and #33** survived because the up-front emptiness check and the rethrow in `removeIfEmpty` were redundant with the rename, which gives the same refusals. **I removed both code paths** (see the additions), and the rename is the one guard.
  - **#31** survived because `unmake` had two stop conditions, each hiding the other. I kept the bound `startsWith(made)` and removed `if (folder === made) return`.
- **Targeted run after those changes: 12 mutants, 11 caught.**
  - Caught: board not resolved in `mergeProposals`; board not resolved in `openMap`; `unmake` climbing past what it made (the "empty above" folder pins it); an absent board counted as emptied (pinned by the new "refused rename where no board folder was there" case); the empty board not taken away; not put back; no map check; no stale-pick check; a lost race reported as a write error; nothing found in a full board; entries never listed.
  - The 1 survivor is **equivalent**: `if (!made) return` removed. With nothing made, `startsWith(undefined)` compares with the text "undefined", which no absolute path starts with. I kept the guard for clarity.
- **Regression: the two earlier lists, re-run against the rewritten tests.**
  - Round-0 list: 64 caught, 0 survived, 36 no longer apply (their code was replaced: the old board checks, the old parser, the old pick check, the old write loop).
  - Round-1 list: 21 caught, 1 equivalent control, 24 no longer apply (the hand-written `ORDER` and `SOURCE_ONLY`, render's old check, the old write loop, the old usage line).
  - **Every one of those lost mutants was re-expressed against the current code: 33, all caught.** That covers each of the six keys added to the derived letter order; `absent` dropped; the screen, role and container orders reversed; the sealed form allowing each of the six; letters written in source order and in reverse letter order (each caught by the write-order test only, which this comparison showed was missing and which I added); the map written first; the old usage line; render in the source form only, the sealed form only and with the forms swapped; the invalid file not named; the proposals folder printed; the `open` count unchecked; `open` taking flags; the open refusal not a SealedError; an absent pick opening; `-h` not help.
- **Two mutants were caught for the wrong reason, and I redid them.** In the first source-order mutant `order` was out of scope (a ReferenceError failed everything). Two others lost their `\n` escapes when generated. The corrected versions are counted above.
- **Side effect, cleaned.** During the round's list, the "-h as value" mutant let the render CLI tests, which then ran from the repo root, write an `-h` page and a `kit.css` there. Both were untracked; I checked them (a rendered page, and a byte copy of the grey kit) and removed them. The render tests' `run` and `runWith` now run from their temp folder, as the merge tests do, so a mutant can no longer write into the repository.

## m4, one more note

The first time I wrote the new test file with my file-writing tool, it turned my `\uFEFF`, `\u200B` and `\u00AD` escapes into the literal characters: 12 of them. A scan of every file I touched caught it before any run counted. I rewrote them as escapes and re-scanned. The final scan shows no invisible character in any file of this commit.

---

# Fix round 2: a board cannot be made inside a board or among the proposals; the map names its board

Status: DONE_WITH_CONCERNS (one reading wider than the ruling, listed at the end)
Commit: 521b1b5 `fix: a board cannot be made inside a board or among the proposals; the map names its board` (branch v2-pipeline, not pushed, nothing amended)

## A correction first

The round-1 section says `tests/merge.test.mjs` had 32 tests. It had **31**; I miscounted. After this round it has **35** (counted with `grep -c '^test(' tests/merge.test.mjs`).

## What changed, item by item

**N1 (Important): never inside a board, never among the proposals.** `checkBoard` now takes the resolved proposals folder too. After the map and pick checks, it refuses with nothing written:
- **Among the proposals.** Paths are compared part by part with `path.relative`, never by string prefix. `within(inner, outer)` is true unless the relative path is `..`, starts with `..` and a separator, or is absolute, so a folder named `..board` is inside and `/x/proposals-2` is not.
  - The board *is* the proposals folder: `it is the proposals folder.`
  - It *lies inside* it: `it lies inside the proposals folder <src>.`
  - It *holds* it: `it holds the proposals folder <src>.`
  - Each message ends `A board is made apart from the proposals, never among them.` and names no source file.
- **Inside a board.** The ruling names the parent; I check every folder above the board (see the concerns). The first one that holds a letter file (`/^[A-Z]\.json$/`, a capital letter then `.json`, case-sensitive) is named: `cannot merge into <board>: <folder> above it holds letter files, so it is a board; a board is never made inside another.`
- The two older test cases that put the proposals in or under the board now meet these rules first, with the new messages, and no longer name a source file. So does one older test that had put a board inside its own proposals folder; that test now gives the proposal a folder of its own.

**N3 (Minor): the map names its board.**
- The map is now `{ "board": "<the board folder's name>", "letters": { "A": { "file", "track", "engine" }, … } }`, keys in that order.
- `open` checks, after the pick line and the map's shape:
  - `whole.board` must equal the resolved board folder's name: `cannot open <map>: it is the map of the board "two", not of <board>`;
  - the letter files in the board folder must be exactly the map's letters: `cannot open <map>: <board> holds the letters A, C, and the map the letters A, B, C`, or `(none)` when there is no board folder. Files that are not letter files (a drawn `A.html`, `kit.css`) change nothing.
- The shape check now requires an object holding a non-empty string `board` and an object `letters`; the per-letter checks are as before.
- `MAP`'s comment and `--help` describe the new shape and the new refusals.
- `openMap` still returns the letters record, and `open` still prints one line per letter.

**N2 (Minor): folders made part of the way.** `writeBoard` finds the first missing folder above the board (`firstMissing`, using lstat) **before** making anything. If `mkdirSync(parent, { recursive: true })` then stops part of the way, that folder is known. `unmake` passes over folders it never got to make (they do not exist) and removes the rest, up to that first one and never above it. The repro, `new/deeper/<300 characters>/board`, now leaves nothing.

**N4 (Minor): the board folder's mode.** The staging folder is now made with a plain `mkdirSync`, named `.<board>.merging-<randomUUID>`, instead of `mkdtempSync`. The board therefore has the mode any folder has under the umask (0755 under 022), not 0700. The name is set as the staging folder only after `mkdir` succeeds, so a failure never removes a folder this merge did not make.

**N5 (Minor): the test that depended on the checkout's path.** It now removes the board's path from standard output, asserts the exact remainder (`merged 3 proposals into <board>: A, B, C`), and checks the remainder for the map's name, the pick's name, "open" and every source word.

**The resolved board.** `mergeProposals` returns `{ letters, board }`, where `board` is the board folder as the library resolved it. `letters` is unchanged. `scripts/merge.mjs` prints that value and no longer resolves the path a second time. `onDisk` is no longer exported, since nothing outside the library uses it.

## Tests

**`tests/merge.test.mjs`, 35 tests (was 31).** New:
- **N1, inside a board:**
  - The repro: merge into `run/board`, then into `run/board/again`, `run/board/deeper/again` and `run/board/deeper/still/again`, by the library and by the CLI. Each gives exit 1 with the exact message naming `run/board`, and the whole tree, outer board and map included, is byte-identical afterwards.
  - A folder holding `a.json`, `AB.json`, `A.json.bak` and `A.JSON` is no board, and a board is made under it.
- **N1, among the proposals:**
  - `--out <proposals>`, `<proposals>/board`, `<proposals>/deeper/board`, `<proposals>/..board`, and the two folders that hold the proposals. Each is refused with its exact message, names no source file, and leaves nothing written.
  - `<proposals>/../proposals/board` resolves to `<proposals>/board` and is refused.
  - The sibling `x/proposals-2` beside `x/proposals` **succeeds**, with its map in `x/`.
- **N3:**
  - The orphan, exactly as described. A preload kills the merge (SIGKILL) as it is about to write the map, which leaves `run/one` whole with no map. A sibling merge into `run/two` then succeeds and a pick is written. `open run/one` is refused (exit 1, nothing printed) with `it is the map of the board "two"`, and `open run/two` opens.
  - A letter file deleted (A, C against A, B, C) and an extra one (A, B, C, D) are each refused.
  - `A.html` and `kit.css` in the board folder change nothing.
  - No board folder: `(none)`.
  - The listing-order test now also opens the map under a reversed folder listing.
- **N2:** `new/deeper/<300 n>/board` gives exit 1, `cannot write <board>: ENAMETOOLONG…`, and no `new/` afterwards.
- **N4:** the board folder's mode equals that of a sibling made by `mkdirSync`, and is 0755 under umask 022 (the test sets it and puts it back). It skips on Windows and on a file system that keeps no modes.
  - **This NTFS mount keeps none** (every folder reads `rwxrwxrwx`), so the test skips here. I ran it on a tmpfs copy of the checkout: it passed with the fix, and failed with `mkdtempSync` put back (`expected: 493` (0755), `actual: 448` (0700)).

**Updated:**
- The return value `{ letters, board }` is asserted in full once, and `.letters` elsewhere.
- `readMap` reads `.letters`, and `readWholeMap` checks that the map's keys are `board, letters`, that `board` is the folder's name, and the exact bytes.
- The map-shape test now has 24 malformed maps (the 7 new ones are top-level), refused by the library and by the CLI.
- The not-empty test keeps `D.json` and `.DS_Store`; the two cases with the proposals inside the board moved to the N1 test with the new messages.
- The help test checks the new words.
- `tests/render.test.mjs` reads the map's `.letters`.

## Commands and output

- **RED.** The new tests, run against the round's starting code: `node --test tests/merge.test.mjs tests/render.test.mjs tests/walkthrough.test.mjs tests/cli.test.mjs`. Result: `# tests 115 # pass 96 # fail 18 # skipped 1`.
  - The failures: the two N1 tests, the orphan, letter-set and new-shape tests, the return value, every test that reads the map's new shape, the partial-folder repro, and render's letter-copy test.
  - The skip is the mode test, on this file system.
- **GREEN, focused.** The same command: `# tests 115 # pass 114 # fail 0 # cancelled 0 # skipped 1 # todo 0`. The one skip: `the board folder gets the mode … # SKIP this file system keeps no folder modes`.
- **GREEN, full.** `npm test`: `# tests 248 # pass 247 # fail 0 # cancelled 0 # skipped 1 # todo 0`. There is no warning, deprecation or `not ok` line, and `tests/.tmp/` is empty afterwards.
- **Two failures on the first green run were test-side.**
  - One test compared map bytes between two boards with different folder names, and maps now name their boards. It compares letters now, and asserts each map's own name.
  - One older test had put a board inside its own proposals folder, which the new rule refuses as it should. Its proposal now has a folder of its own.
- **The repro, by hand against the finished code.** `merge … --out run/board`, then `--out run/board/again`, gives exit 1 with `<w>/run/board above it holds letter files, so it is a board; a board is never made inside another.`, and `run/board` still holds exactly `A.json B.json C.json`. `--out tests/fixtures/proposals/board` is refused with `it lies inside the proposals folder`, and the fixtures folder still holds exactly its three proposals.

## Hand mutations

- **The round's own list: 30 mutants, 26 caught.**
  - **Inside a board:** no letters-above check; only the parent checked; the letter-file pattern unanchored, case-blind, or allowing `AB.json`.
  - **Among the proposals:** no is, inside or around check; `within` by string prefix; a name starting with `..` taken as a step out; the parent itself taken as inside.
  - **The map's board:** the map written without its board; the board named by its whole path; no board-name check; no letter-set check; every file counted as a letter; no `(none)`; the board name unchecked, empty, or of any type; letters unchecked; the board not returned; the CLI printing the path as given.
  - **Folders made part of the way:** nothing known as made; `unmake` stopping at a folder never made; `unmake` climbing past what it made.

  Not caught:
  - **Three equivalents**, labelled before the run:
    - dropping the absolute-path half of `within` (on POSIX, `relative` never returns an absolute path; it only can between Windows drives);
    - comparing the resolved paths as text instead of with `relative` (both are resolved and normalised);
    - the root guard in `firstMissing` (the root always exists).
  - **#18, real.** The letters on the board were compared unsorted, and this filesystem lists folders in name order, so the sort was never exercised. I added `open` under a reversed listing to the listing-order test, and #18 is **caught** now.
- **N4, verified on tmpfs, since it cannot be here.** `mkdtempSync` put back: caught (0700 against 0755). The fix: passes.
- **Regression: the previous round's lists, re-run against this round's code.**
  - Its own list: 70 caught, 1 known equivalent, 9 no longer apply.
  - Its targeted list: 11 caught, 1 no longer applies.
  - The ones that no longer apply target code this round changed or earlier rounds removed. The live ones are re-expressed: "board not resolved", "the success line as given" and "unmake climbs" in the lists above, plus four more run on their own: staging outside the board's parent, the map inside the board, the shape unchecked, the map not an object. **All caught.**
- **Side effect, cleaned.** One regression mutant crashed the render test process before its cleanup hook, which left `tests/.tmp/render-Mq7bvQ` (made at 18:17, during that run). I removed it. A clean `npm test` leaves `tests/.tmp/` empty.

## A reading wider than the ruling, for a ruling

**Every folder above the board is checked for letter files, not only its parent.** A merge into `run/board/x/again` has parent `run/board/x`, which holds no letters, but it would still make `x/` inside the outer board and put its own map there. With the same proposals, that map would match the outer letters to their sources by content. So the nearest folder above that holds a letter file is named and refused.

The cost: a folder anywhere above a board that happens to hold a file named exactly like `A.json` blocks it. File names that are one capital letter and `.json` are rare outside boards, and the message says which folder it is. If ruled to the parent only, the loop becomes one check and the deeper cases leave the test.

## Remaining notes

- The mode test skips on this NTFS mount (every folder reads `rwxrwxrwx`) and on Windows. It runs and passes wherever modes are kept, as shown on tmpfs.
- The board's name in the map is the resolved folder's name, so `open` through a link to the board still matches.
