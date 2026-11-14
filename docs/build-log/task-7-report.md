# Task 7 report: acceptance checks

Status: DONE_WITH_CONCERNS. The concerns are readings beyond the letter of the rulings, listed at the end for a ruling.
Commits on `v2-pipeline` (not pushed, nothing amended):
- `3b7b412` refactor: the browser handling moves to a shared library
- `454b223` feat: acceptance checks that run on the prototype and inside a build

## What I implemented

### 1. The refactor (its own commit, done first)

**`scripts/lib/browser.mjs`** (417 lines) now holds every part of the browser handling that `shots` arrived at in Task 6:
- `Browsers`: started through `launchServer`, so each browser is stopped by its own process handle; bounded closes (`CLOSE_MS`); restarts counted (`STARTS`, `OPENINGS`).
- `contextOptions(width, theme)`: `{ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme }`.
- `visitPage`: everything that was `shootPage` up to the picture. That is the listeners, the document mark planted as the document is made, settling, and the read before and after the work. The work itself is a parameter, `act`: `{ run, failed, during, unread }`. Its three phrases keep shots' wording word for word.
  - `visitPage` returns `{ next, fault, read, value, reports, closing }`.
  - It writes nothing and decides nothing.
- `visitPages(chrome, runs, { timeout, act, Refusal }, done)`: one context for each run, each width and theme. A page is opened again when its browser dies before it can be opened, a dead browser is replaced, and every browser is stopped in a `finally`. `done(file, visit, run)` hears of every page, or `{ lost: true }`.
- `Refusal` is the caller's own error class. `shots` passes `ShotsError`, so its refusals stay the same type with the same words.
- Also here: `answer`, `closed`, `nameOf`, `pathOf`, `firstLine`, `TIMEOUT`, and `readTimeout(flags)`, which is the `--timeout` parsing both CLIs share.

**`scripts/shots.mjs`** (305 lines, was 662) keeps:
- the input checks, `pagesOf`, `Found` and the writing of pictures;
- its CLI, byte for byte except that it now calls `readTimeout`.

It still exports the same six names: `THEMES`, `TIMEOUT`, `ShotsError`, `shoot`, `CLOSE_MS` and `nameOf`. The last three are re-exported.

One ordering changed and cannot be observed: a picture is now written after its page is closed, not before. Who records what, and in what order, is unchanged.

`tests/shots.test.mjs` is untouched. 57/57 before and after; see the timings below.

In the feature commit, `act.run` also receives the page's `file` and `run`, so a runner can act per page. Shots ignores them.

### 2. The checks

**`scripts/inpage/accept-inpage.js`** (347 lines) is plain browser JavaScript.
- **Shape.** One IIFE, `'use strict'`, with nothing declared at the top level. Comments come first and the file ends in `}());`. It has no `import`, `export` or `require`. So it can be evaluated again and again, as a script, or as the body of a function (Selenium's way). A test does all three in one page and finds that the only global added is `__uxAccept`.
- **`window.__uxAccept(checks)`** returns one `{ id, pass, actual, message }` per check, in order.
  - Each check is made inside its own `try`, and the whole call is inside another. A list that is not a list, or that cannot even be counted, gives one failed result.
  - A failure is a `Miss` (the reason is the message) or any other throw (`the check could not be made: …`). It never throws.
- **Lookup.**
  - An element is found by comparing `getAttribute('data-ux')` as written, never through a selector, so quotes in an id cannot break the lookup.
  - With `screen`, it looks only inside the one `[data-screen]` that matches. A screen found 0 or 2 times fails the check.
  - Messages: `data-ux="x" not found` (plus ` in data-screen="s"`) and `data-ux="x" found 2 times; it must be on exactly one element`.
- **Each type, as the ruling defines it.**
  - `visible`
  - `absent`: not rendered by the same test as `visible`.
  - `text`: runs of HTML white space are made one and trimmed; NBSP is kept; `textContent`, so a CSS `text-transform` does not change the text.
  - `order`: uses `compareDocumentPosition`, and `actual` is the ids in document order.
  - `in-viewport`: requires the element to be rendered. Its box is put back where it was before any scroll; a fixed element, or one inside a fixed element, stays where it is. The viewport is `min(innerWidth, clientWidth)` by `min(innerHeight, clientHeight)`, so a scroll bar that shows is not part of it.
  - `min-size`: `minWidth`/`minHeight`.
  - `contrast`: every background from the canvas up to the element's own, laid one over the other, which equals "the nearest that is not transparent, translucent ones laid over what is behind them"; text alpha is laid over that; the WCAG ratio.
  - `count`: a prefix, through `startsWith`.
- **Unknown types.** An unknown `type`, including `toString`, `constructor` or an object that stringifies as `visible`, gives `unknown check type "…"`.
- **Parameters.** Each type checks its own parameters in the page, so a malformed check handed in by a build session fails with a reason.
- **Measures** are given to two decimals by flooring, never rounded up past what was measured: 7.0052 is shown as 7, 4.5423 as 4.54.
- **Colours.** Computed `rgb()`/`rgba()` are read as written. Any other colour (oklch from a Tailwind 4 build, lab, color()) is drawn on a one-pixel canvas that is never attached, and read back in sRGB.
- **The canvas** (when no background is set) is `#121212` when the root's `color-scheme`, or the `color-scheme` meta when that is `normal`, names dark and either names no light or the theme is dark. Otherwise it is white.

**`scripts/accept.mjs`** (446 lines) is the module and the CLI.
- **`validateAcceptance(data) → string[]`.** Every fault, each as `$.checks[i].key: what`, in file order.
  - Every rule of the ruling is there, and unknown keys are refused for the eight known types (`unknown key for type visible`).
  - An unknown type gets its common fields checked and is otherwise let be.
  - A `page` must also stay inside the prototype folder (`..` is refused after normalising) and must not be absolute or carry a scheme.
  - An `order`'s `targets` may not name an id twice.
- **`acceptPrototype(data, { root, chrome, timeout }) → { results, errors }`.**
  - The order of checks: options (TypeError), then the data (AcceptError), then the folder (AcceptError), then `findChrome`.
  - Checks are grouped by (width, theme) into runs, in the order they first appear, and within a run by page file. That gives one context per width and theme, and one page opening per (page, width, theme).
  - Each page has the in-page file evaluated, then `__uxAccept(group's checks)`.
  - A fault, or a lost page, fails every check of its group with that message. A result that is missing, carries another id, or has no boolean `pass` is `the page gave no result for this check`.
  - `errors` lists what a page reported as it ran, and the close it refused, once per page.
- **`validateResults`, `reportOf`.**
- **The CLI**:
  - `prototype <acceptance.json> --root --out [--chrome] [--timeout]`. The file is read and validated, the root checked, and the output's folder made, all before Chrome starts.
    - It writes the results list.
    - stdout: `N checks: F failed, P passed; results in <out>`.
    - stderr: `failed: <id>: <message>` for each failed check, and `warning: <page>: <message>` for each page report.
    - It exits 1 when any check failed.
  - `report <results…> --out <file.md>`
  - `inpage`
  - Exit codes 0 / 1 / 2.

**Fixtures.** They show the kit's clinic front desk, surface "today":
- `tests/fixtures/prototype/today-default-en.html`, `today-empty-en.html` and `today-default-es.html` (Spanish strings). They are on the grey kit, in frame markup per KIT-CONTRACT, with ids `free-count`, `room-list`, `book-action`, `empty-message` and `free-room-*`.
- `kit.css`, a byte copy of `kit/grey/kit.css`.
- `tests/fixtures/acceptance.json`: eight checks, one of each type, all passing.
  - They use all three pages, two widths and both themes.
  - Two checks are scoped by `screen`.
  - One check carries `language: "es"`.

## Tests and results

| Run | Result | Time |
|---|---|---|
| `tests/shots.test.mjs`, HEAD before any change (clean scratch worktree) | 57/57 | 114 s |
| `tests/shots.test.mjs` after the refactor (commit 1) | 57/57 | 111 s |
| `tests/shots.test.mjs` at the end (commit 2) | 57/57 | 117 s |
| `tests/accept.test.mjs`, every Chrome recorded through a `UX_CHROME` stand-in | 38/38 | 33 s |
| whole suite before commit 1 (`accept.test.mjs` set aside) | 353: 352 pass, 1 skipped | 128 s |
| whole suite before commit 2 | 391: 390 pass, 1 skipped | 161 s |

I ran the whole suite as `node --test --test-concurrency=1 tests/*.test.mjs`, which is `npm test` made serial, never `npm test` itself. Plain `npm test` runs the files side by side: `shots`' concurrent block (3 browsers) next to `page` and `accept` would pass three browsers at once.

**`tests/accept.test.mjs` has 38 tests.** The brief's seven come first, by name. The other 31 are what the rulings ask to pin:
- **Validator.** Every ruling's refusal is an exact error string, in about 90 cases.
- **Refusals before Chrome starts.**
  - An invalid file, an unreadable file, a non-JSON file.
  - A root that is missing or is a file.
  - An output under a file, or that is itself a folder.
  - For each, a counting stand-in Chrome records no start, and the output's folder is not made.
- **Exit codes.** Exit 1 with each failure printed and the results still written; no process left in the run's browser group.
- **One opening per page, width and theme.** A `--require` preload logs every context and page Playwright is asked for, and the test checks that log exactly. It also checks that the context options reach the page: width × 900 at scale 1, reduced motion, the theme default.
- **Page faults.**
  - A page that does not open, or leaves: its whole group fails and the run goes on.
  - An in-page function that cannot be installed, returns `[]`, lies about ids, gives a non-boolean `pass`, or gives `pass` alone.
  - Page reports printed as warnings, once per page, leaving the exit code to the checks.
  - `--timeout`.
  - A browser lost twice while opening a page, and a page whose close never returns. Both use fault preloads in the style of `shots`; each test checks that the browser was replaced and that none is left.
- **The CLI.** Usage (exit 2, 13 cases), `--help` three ways, `inpage`.
- **The report.** Several files, and its refusals (11 shapes, plus not-JSON).
- **No product name** in the new files.
- **In the page.** 13 tests in one browser, evaluated through plain `playwright-core` the way a build would:
  - evaluating the file more than once, and as a function body;
  - read only (a MutationObserver sees 0 mutations and `outerHTML` is unchanged);
  - never throws;
  - lookup and scoping;
  - each type's every condition with exact expected `[id, pass, actual, message]`;
  - contrast canvas in six scheme/theme combinations.

  This browser starts with scroll bars shown (`ignoreDefaultArgs: ['--hide-scrollbars']`), as a build's session may have them. Playwright hides them by default, and then the scroll-bar rule of `in-viewport` would never be seen.

**No browser of mine is left, checked without a machine-wide count.**
- The tests that start Chrome through a counting stand-in wait for each recorded process group to empty, and assert 0.
- For the rest, I ran the whole file with `UX_CHROME` set to a stand-in that records its pid. 18 browsers were started, and each recorded process group held 0 live processes afterwards.
- Never more than one browser of this file runs at a time: its tests run in sequence, and the in-page block's one browser is closed in its `after`.

## TDD evidence

- **RED.** `node --test tests/accept.test.mjs` before `scripts/accept.mjs` existed fails with `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/scripts/accept.mjs' imported from …/tests/accept.test.mjs` and `# tests 1 / # pass 0`. That is expected: the tests and fixtures were written first, and nothing they import existed.
- **First GREEN attempt.** 36/37. The scroll-bar case of `in-viewport` failed because Playwright starts headless Chrome with `--hide-scrollbars`. A probe without the flag showed `innerWidth 390, clientWidth 375`. The in-page block's browser now shows scroll bars, and the assertion was widened to the 885 px height the horizontal bar leaves.
- **GREEN.** `node --test tests/accept.test.mjs` gives `# tests 38 / # pass 38 / # fail 0`.
- **Expectations I corrected before the first GREEN, not code.** Contrast values I had worked out by hand wrongly (3.97, 5.28, 4.12). A count prefix `room-` that also matched `room-list`. Absolute boxes that shrink to fit their content.

## Hand mutation

**The harness.** A scripted harness applied 157 hand mutants, one at a time, and ran the tests that should catch each by name pattern. It restored each file in a `finally`; afterwards both files were checked byte-identical with backups.

**The mutants cover:**
- each check type's condition, and each half of each compound condition (box width/height, both size halves, each edge, `<`/`<=` at each edge, scroll x/y, fixed and its ancestor walk, clientWidth/clientHeight, each validator branch, each luminance coefficient, the max/min of the ratio);
- each guard (screen, target, duplicate, malformed parameters, `Array.isArray`, `null`, `hasOwn` for `toString`, `instanceof Miss`, the unreadable error, the no-result guard's three parts);
- the runner's grouping, dedupe, lost/fault/closing paths and exit code;
- the report's ordering and escaping;
- every results-validator field;
- the usage cases.

**First run: 151 of 157 killed.** Of the six survivors:
- **Pinned with new tests, then killed in a rerun.** In-page `isFinite` on `minWidth`/`minHeight` (a driver can hand `Infinity`/`NaN`); in-page `typeof min` (`'4.5'`); `ratio >= min` versus `>` (a ratio of exactly 1 at `min: 1`). The rerun of mutants 51–55: 5 of 5 killed.
- **Removed as needless.** The `+ 1e-9` in rounding. Every measured size is a multiple of 1/64 px, and no ratio lands just under two decimals. The `Math.round` mutant of the new rounding is killed.
- **Could not pin; unreachable.**
  - `if (!element.isConnected)` in `unrendered`. The ruling lists "connected", but every element is found by `querySelectorAll` on the live document, so it is always connected. I kept it as the ruling's words.
  - The guard that refuses a colour the canvas cannot parse. Every colour comes from `getComputedStyle`, which the canvas always parses.

**Also not pinned for `accept` (shared code, pinned only through `shots`).**
- The phrases `accept` passes for a page that leaves *while it is being checked* (` while it was being checked`) and for one that cannot be read once checked. The mechanism is the one `shots` tests with its leave-while-pictured faults; only the words differ.
- A write of `--out` that fails after the run (the folder is checked before; it would have to vanish during the run).

## What the in-page file returned outside the runner

I opened `tests/fixtures/prototype/today-default-en.html` at 390 × 900 with plain `playwright-core` (`chromium.launch`, `browser.newPage`, `page.goto`). I evaluated the file's text with `page.evaluate(source)` and called `window.__uxAccept(checks)`, with no code of the runner. The checks were the fixture's two 390 checks on that page, plus a missing id and a contrast at 21:

```json
[
 { "id": "book-in-first-screen", "pass": true, "actual": { "x": 33, "y": 341.53, "width": 151.17, "height": 44 }, "message": "" },
 { "id": "book-target-size", "pass": true, "actual": { "width": 151.17, "height": 44 }, "message": "" },
 { "id": "missing", "pass": false, "actual": null, "message": "data-ux=\"next-free-time\" not found" },
 { "id": "grey", "pass": false, "actual": 7, "message": "the contrast is 7, less than 21" }
]
```

## Files changed

- `scripts/lib/browser.mjs` (new, commit 1; `act.run` gets `file, run` in commit 2)
- `scripts/shots.mjs` (commit 1)
- `scripts/accept.mjs`, `scripts/inpage/accept-inpage.js` (new)
- `tests/accept.test.mjs` (new)
- `tests/fixtures/acceptance.json`, `tests/fixtures/prototype/{today-default-en,today-empty-en,today-default-es}.html`, `tests/fixtures/prototype/kit.css` (new)

## Self-review: concerns for a ruling

1. **`visibility` is read on the element itself, not looked for on its ancestors.** The ruling says "not … `visibility: hidden` on itself or an ancestor". Visibility is passed down, so an element inside a hidden one is reported `visibility: hidden` (tested). But CSS shows a child that sets `visibility: visible` inside a hidden parent, and I count it rendered (tested as `shown-again`). Walking ancestors would call a painted element hidden. If the letter is wanted, it is a one-line change, and that test flips.
2. **Page reports are warnings, not failures.** A script error, a resource that did not load, or a page that would not close is printed `warning: <page>: …` and returned as `errors`. It does not change a check's result or the exit code: the ruling fails a group only for a page that "fails to open, or leaves". A prototype whose `kit.css` failed to load can still pass size and contrast checks measured unstyled; the warning is the only signal. Ruling wanted if these should fail the group.
3. **The dark canvas.** The ruling's parenthesis "white in light, per the computed style of the root" is read as: the root's `color-scheme` (or the meta when that is `normal`) decides whether the canvas is dark. Dark means Chrome's `#121212`; other browsers paint their own dark canvas. This matters only when no element on the way up sets a background; the kit always sets one on `body`.
4. **Guards beyond the ruling's list**, each tested:
   - `..` out of the prototype folder, absolute and scheme pages refused;
   - `targets` naming an id twice refused;
   - text compared with `textContent` and HTML white space collapsed (NBSP kept);
   - `in-viewport` requires a rendered element (a `display: none` box at 0,0 would otherwise be "in the viewport") and un-scrolls non-fixed boxes;
   - non-sRGB colours read through a detached canvas;
   - a results file may carry extra keys.
5. **`report` asks the full runner shape** (`id, pass, actual, message, criterion, state, page, width, theme`). A build session's raw `__uxAccept` output (`id, pass, actual, message`) has to be joined with its checks before `report` takes it. Nothing in the brief says who joins them.
6. **The brief says "PASS (7 tests)"; the file has 38.** The seven are there by name; the other 31 are the rulings' "every refusal and rule needs a test".
7. **Size.** `browser.mjs` is 417 lines, under 450. `accept.mjs` is 446. If either needs splitting:
   - `browser.mjs` splits at `visitPage` (the page and its mark, ~230 lines) versus `Browsers` plus `visitPages` and the timers.
   - `accept.mjs` splits at `validateAcceptance`/`validateResults` versus the runner and CLI.
8. **`npm test` concurrency.** Plain `npm test` can run `shots`' three concurrent browsers beside `page`'s and `accept`'s, which is more than three at once. That was already true of `shots` beside `page`. I did not change `package.json`.

## Fix report — the controller's rulings

Commits (on `v2-pipeline`, not pushed, nothing amended):
- `fcecefe` fix: a page's own errors fail its checks, and a report can join a build's raw results
- `ef13413` chore: the suite runs one test file at a time

**Standing as built.**
- Concern 1, `visibility`: the comment on the visibility read is now one line, "Not walked up: visibility is inherited, and a child set visible inside a hidden parent is painted." The function's header says that `display` and `opacity` are looked for on the element and on every element it is in, and `visibility` on the element alone. Both tests (`in-hidden`, `shown-again`) are kept.
- Concerns 3, 4, 6 and 7 are unchanged.

### Change 1: a page's own errors fail its group

`acceptPrototype` takes `allowErrors` (default `false`; anything else that is not a boolean is a TypeError). The CLI takes `--allow-errors`, a switch as in `shots`.

**Without the flag**, a page that reports a script error, a console error, a resource that did not load, or a report that could not be read fails every check of its group. That is the same list `shots` counts as errors.
- The message is what the page reported; several reports are joined with `; `.
- A fault of the page itself (it did not open, it left, it kept moving) is said instead. A page that throws and then leaves fails "for leaving", and that is tested.
- These reports are no longer warnings. `errors` holds only warnings.

**With the flag**, the checks give their own results, and the reports are warnings (`warning: <page>: …`), once a page.

**A page that would not close** is a warning in both cases. The fault test runs the stuck page with and without the flag.

**Tests.** A run over the fixture plus four pages: one with a missing stylesheet (three checks, two widths), one whose script throws, one with both, and one that throws and leaves.
- Without the flag it exits 1. Each of those groups fails with the page's words, the fixture's eight checks still pass, and the results file is written.
- With the flag, the same file gives the checks' own results and the warnings, and exits 1 only for the page that left. Without that page, it exits 0.
- At the module level, `allowErrors: true` and the default each give their result and their `errors`.

### Change 2: `report --checks <acceptance.json>`

- **Order of work.** The checks file is read and validated with `validateAcceptance` first. An invalid one is refused as `<file> is not a valid acceptance file:` with each fault, exit 1.
- **What a result needs.** `validateResults(data, { joined: true })` asks only what `__uxAccept` gives: `id`, `pass`, `actual`, `message`. Without `--checks`, nothing changed: the whole shape is required (tested on bare results).
- **The join.** `joinResults(data, sources, name)` joins by id. The check's criterion, state, page, width and theme (light when not given) win over the same keys in a result (tested with a whole-shape result that carries other values).
  - An id the checks file does not know: `<file> holds a result for "x", and <checks> has no check with that id`.
  - An id with two results: `"x" has two results: in <a> and in <b>`, whether across files or within one.
  - Both are exit 1, and nothing is written.
- **Not run.**
  - A check with no result is a row with `not run`. Rows come failed, then not run, then passed, each part in the order of the checks file.
  - The first line counts three things: `8 checks: 2 failed, 2 not run, 4 passed.`
  - A check not run leaves the exit code at 0.
- **Usage.** `--checks` belongs to `report` alone; on `prototype` it is an unknown flag. `--checks` with no value is bad usage.

### Change 3: one file at a time

- `package.json`'s test script is now `node --test --test-concurrency=1 tests/*.test.mjs`.
- `tests/skeleton.test.mjs` pinned the old string and now pins the new one. No README or other doc names the command.
- Not edited, as ruled: `docs/plans/2026-11-13-PIPELINE-KIT-PLAN.md` names the old command at line 143 (the skeleton test's assertion), line 147 (`node --test tests/*.test.mjs` → FAIL), and line 153 (`scripts.test: "node --test tests/*.test.mjs"`). Its other lines say `npm test` and stay true.

### Tests, RED and GREEN

| Run | Result | Time |
|---|---|---|
| `tests/accept.test.mjs` | 41/41 | about 40 s |
| whole suite before `fcecefe`, serial | 394: 393 pass, 1 skipped | 178 s |
| **`npm test`, plain, after `ef13413`** | **394: 393 pass, 1 skipped** | **172 s** |

- **RED.** The new and changed tests were run against the committed `accept.mjs` of `454b223`.
  - Unchanged, the file fails to import: `does not provide an export named 'joinResults'`.
  - With only a stub `joinResults` export added, all 7 selected tests fail, for the expected reasons:
    - warnings where failures were expected;
    - `unknown flag --allow-errors`;
    - no `--checks`;
    - no `allowErrors` TypeError.
- **GREEN.** 41/41.

### Hand mutation of the new conditions

All 34 of 34 mutants were caught, and the file was restored byte for byte. The mutants covered:
- the `allowErrors` and `lost` halves of the reported condition;
- the join separator, and first-report-only;
- a fault outranking the reports, both ways;
- reports reported always and never;
- closing under the flag, both ways;
- the TypeError, the CLI switch, and both commands' flag lists;
- `joined` (removed, and moved before `message`);
- the join's validation, its unknown-id and duplicate refusals, and check-wins against result-wins;
- the theme default, and not run counted as failed;
- the three-count line, absent and always present;
- both swaps of the row order, and the not-run label;
- `validateResults` joined always and never;
- `reportOf` and the counts without `notRun`;
- the checks file read without validation.

I simplified one condition before mutating: `|| visit.reports.length === 0` was redundant, because an empty join is already no fault.

### Concerns

- `scripts/accept.mjs` is now 503 lines (it was 446). If it needs splitting, the seam is the same as before: `validateAcceptance`/`validateResults`/`joinResults`/`reportOf` in one module, the runner and the CLI in another.
- With `--checks`, a results file may also carry whole-shape results. Their extra keys are read and then overwritten by the check's, never validated. That follows the ruling ("win over the same keys").

## Fix report — round 1

Commits (on `v2-pipeline`, not pushed, nothing amended), in this order:
- `8ab058b` fix: the runner refuses a folder as a page, and smaller findings (M3, M4, M9, M10, M11, M12)
- `7fea4e6` fix: acceptance checks measure what is painted (I1, I2, I3, R97, R98, M7)

The runner commit goes first because its tests pass with the old in-page file. Both commits touch `tests/accept.test.mjs`, so its intermediate version was built by replaying only the runner commit's edits onto the committed file. With the old in-page file, the acceptance, CLI and skeleton tests at that commit are 55/55, and the shots file is 57/57 (112 s).

### What changed, and the test that pins each item

**I1 / R94 — rendered means painted.**
- `unshown(element)` holds everything but the box: display and opacity up the tree, the element's own visibility, then `unpainted`. `unrendered` is `unshown` plus the box.
- `unpainted` takes `checkVisibility()` when it exists. When it says false, the message names the reason: `inside the closed <details …>`, `hidden="until-found" on …`, `content-visibility: hidden on …`, or `the browser does not paint it`.
- Without `checkVisibility`, it uses `closedDetails`: inside a closed `<details>`, other than in its first `summary`, counted from the child on the path.
- Tests:
  - In the page: a closed and an open `ux-expansion` (the summary, an element inside the summary, the item, a second `summary`), `hidden="until-found"` and `content-visibility: hidden`, each with `visible` and `absent`.
  - The same page with `Element.prototype.checkVisibility` deleted. There the closed expansion is still read, and the two cases only the browser knows pass, as documented.
  - Once through `accept prototype`, on a kit-drawn page with a closed and an open expansion.

**I2 / R95 — contrast refuses to guess.**
- `unmeasurable(element)` walks from the element up. It refuses on the first of these it finds:
  - `background-image` other than `none`, on every layer up to and with the nearest opaque background colour;
  - `opacity` below 1;
  - `filter`;
  - `backdrop-filter`;
  - `mix-blend-mode`.

  The last four count on the element or on any element above it.
- The result is a failed check with `actual: null` and the message `cannot be measured: <property> on <tag data-ux="…">` (the tag alone when there is no `data-ux`).
- The header carries the two lines: what it measures, and what it refuses to guess.
- Tests:
  - every property, once on the element and once on an element it is in;
  - an image on the nearest opaque background (refused);
  - an image behind an opaque background (measured, 21);
  - an opacity further up than the opaque background (refused);
  - the reviewer's measured pairs unchanged: black on white 21, `#767676` on white 4.54, translucent over translucent 2.61.

**I3 / R96 — `text` is what is shown.**
- `input` and `textarea`: the current `value`. A placeholder is not text.
- `checkbox`, `radio`, `file`, `hidden`, `range`, `color`, `image` and `password` fail with `an <input type="…"> shows no text`.
- `select`: the chosen options' text, joined with `, `.
- Anything else: the text nodes whose own element is shown (`unshown`, box aside), so text under `display: none`, `visibility: hidden` (with a child shown again), or a closed `details` is left out. Text in a box of no height still counts.
- The header has one line each for "a placeholder is not text" and "two blocks with no white space between them read as joined".
- Tests cover every bullet:
  - a field's value set by a script (the attribute unchanged), a placeholder, a textarea typed over, single and multiple selects;
  - all eight non-text types;
  - hidden spans, visibility, a closed expansion, a text that hangs out of a no-height box, and blocks reading as joined.

**R97 — `in-viewport` respects clipping.**
- Each element the target is in, other than `body` and `html`, clips the axes whose `overflow` is not `visible`. The page's own overflow is the viewport's, and the first-viewport check covers it.
- The clip is the element's padding box, scroll bars aside: `getBoundingClientRect` + `clientLeft`/`clientTop`, `clientWidth`/`clientHeight`, as scrolled now.
- A cut adds `it is clipped by <named>`. A viewport fault and a clip are joined with `; `.
- Tests:
  - an element below the visible part of a scroller, and again with the scroller scrolled;
  - `overflow-x: hidden`, `overflow-x: clip` only, `overflow-y: clip` only;
  - a cut on the left edge;
  - under a border on the left, top and bottom;
  - under a scroll bar;
  - a `body { overflow: hidden }` that clips nothing in the first viewport.

**R98 — `count` counts rendered elements** (`unshown`, box aside). When it fails and some are there but not rendered, the message ends `; N more is/are there and not rendered`. Tests:
- two rows present and hidden give `actual: 0` with that message;
- an item in a closed expansion beside its label;
- a box of no size still counted;
- the old cases, with a hidden row no longer counted.

**M7.** The header says a shadow root is not searched, and a screen element's own `data-ux` is not inside that screen. Tests pin both behaviours: an element in an open shadow root is not found; `own-id` with `screen: own` is not found, and without `screen` it is.

**M3.** Before any browser starts, each page of each group must be a file.
- Messages: `cannot read the page states: it is a folder, not a file`, `cannot read the page missing.html: not found`, `cannot read the page null.html: it is not a file` (a link to `/dev/null`).
- Every check of that group fails, and the run goes on.
- Tests:
  - With a preload that logs every page Playwright is asked to open, none of these three is ever opened; only the good page and the page that leaves are.
  - When no page of a run is a file, a counting stand-in Chrome records no start.

**M4.** Without `--allow-errors`, when a page's own fault is the message, its reports are printed as warnings. Test: the page that throws and then leaves now also gives `warning: leaves.html: script error: on its way`.

**M9.** `engines.node` is now `>=20.10`; the skeleton test pins it.

**M10.** `readTimeout` moved to `scripts/lib/cli.mjs`. It returns `undefined` when `--timeout` is not given, so each script's own default holds. `browser.mjs` no longer imports `cli.mjs`. `tests/cli.test.mjs` tests the given, absent and refused values, and that the browser library has no `readTimeout`.

**M11.** In both test files, a process group is signalled only while `inGroup(pgid) > 0`. No assertion of the shots file changed. This is test code itself, so no test can pin it.

**M12.**
- The read-only test asserts all eight results exactly. The button has an explicit size, so nothing depends on fonts.
- The spaced-root run also opens `by state/today default.html`.
- `kit.css` is pinned byte for byte to `kit/grey/kit.css`.
- Two fault preloads pin the `during` and `unread` phrases: the page leaves as the in-page file is evaluated, or cannot be read after it is checked. Each run asserts the browser group is empty afterwards.

### Tests, RED and GREEN

- **RED.** The scripts as committed at `ef13413` (`accept.mjs`, the in-page file, `browser.mjs`, `cli.mjs`, `shots.mjs`, `package.json`) were swapped back in and then restored, byte-checked. Against them the round's tests show 11 failures:
  - the folder and missing-page test, and the no-browser test;
  - the expansion run;
  - the errors test (the M4 warning);
  - the in-page count, painted, contrast, text and clipping tests;
  - `cli.test.mjs`, which cannot import `readTimeout`;
  - the skeleton's `engines`.
- **What passed on the old scripts, as it should.** Those tests pin wording or behaviour that was already true: the `during`/`unread` phrases, the shadow root, a screen's own id, the read-only results, the spaced page name, and the kit copy.
- **GREEN.**
  - `tests/accept.test.mjs`: 49/49.
  - `npm test` once at the end: 403 tests, 402 pass, 1 skipped, 178 s.
  - Shots: 57/57 (112 s, at the intermediate commit).

### Hand mutation

59 mutants were run against this round's conditions, each against the tests that should catch it, with both files restored and byte-checked.
- **First run: 56 killed.** The three survivors showed weak cases, not weak code:
  - Including `body`/`html` among the clippers survived, because the test paragraph's margin collapsed through `body`.
  - Dropping `clientTop` survived, because the top-border case was also cut by its bottom edge.
  - Using the border box's height survived, because nothing sat between the padding box and the bottom border.
- **After strengthening those cases:** the rerun killed all four clipping mutants (including the `clientWidth` one), so 59/59.

### Concerns and readings for a ruling

1. **`password` is in the "shows no text" list.** It is beyond R96's list: what it shows is bullets, and reading its `value` would put a typed password into a results file.
2. **Clipping is decided per axis.** `overflow-x: clip` with `overflow-y: visible` clips across only, which CSS does, and that is tested. R97 says "either axis". For every other value CSS turns the visible axis to `auto`, so the two readings agree.
3. **`body` and `html` are not clippers;** their overflow is the viewport's.
4. **The first-viewport check un-scrolls the page only.** An element scrolled up out of an inner scroller is reported both outside the first viewport and clipped (tested).
5. **Without `checkVisibility`,** `hidden="until-found"` and `content-visibility: hidden` are not detected, as R94's fallback specifies (tested).
6. **Sizes.** `scripts/accept.mjs` is 529 lines, the in-page file 468, `browser.mjs` 406.

## Fix report — round 2

Commit (on `v2-pipeline`, not pushed, nothing amended):
- `8eca085` fix: acceptance checks follow the containing block and what the browser paints

### What changed, and the test that pins each item

**R99 (N1, N2, N6, N8) — the clipping chain.**
- `blockOf(element)` gives the containing block: the parent, unless the element is `absolute` (the nearest ancestor that is positioned or holds all) or `fixed` (the nearest that holds all; none means the viewport). An ancestor holds all through any of `transform`, `perspective`, `filter`, `backdrop-filter`, `contain` with `layout`/`paint`/`strict`/`content`, `container-type`, or `will-change` naming `transform`/`perspective`/`filter`.
- `clippers` walks from block to block, skipping what lies between.
- A box can clip unless its display is `inline` or `contents`. It clips per axis on `overflow` other than `visible`, and on both axes for `contain` holding `paint`/`strict`/`content`.
- `html` never clips. `body` clips only when `html`'s own overflow is not `visible`.
- Edges are compared with `TOLERANCE = 1`: an edge that passes the clip by more than one pixel is cut. The header says "no more than one pixel passes"; I read the ruling's "less than a pixel passes" with the boundary on the passing side, because client sizes are rounded.
- Tests:
  - the 22.39 card, the 200.3 card, the `1fr` cell at 390, and an inline `overflow: hidden` ancestor all pass;
  - half a pixel over passes, a pixel and a half fails;
  - `contain: paint` clips; a `display: contents` box with `overflow: hidden` clips nothing;
  - an absolute and a fixed element in a static clipper pass;
  - `position: relative` on the clipper holds the absolute element only;
  - each of the twelve "holds all" properties holds both;
  - a box between an element and its block is passed over, while the block's own block is not;
  - a block that itself escapes;
  - N6's page fails with `it is clipped by <body>`, and `body` alone hiding still passes;
  - with `html { overflow: hidden }`, an element below the fold is said once, as outside the first viewport;
  - round 1's scroller cases are unchanged.

**Beyond the ruling, found by the survey (layout 10).** A clipping box drawn through a `transform` was compared in layout pixels against drawn boxes. A clip scaled to one half let through an element it cuts. The clip's client sizes are now scaled by the box's drawn size over its `offsetWidth`/`offsetHeight`. Tests: a half-scale clip (in, cut sideways, cut below), and a `zoom: 2` clip (in, cut).

**R100 (N3) — `display: contents`.**
- `unpainted` asks the nearest ancestor that has a box. `unrendered` counts a `display: contents` element as rendered when its content is shown, so `absent` on it fails while its content shows. `absent` is not named in R100; this follows R100's reading.
- `visible`, `min-size` and `in-viewport` on such an element fail with `data-ux="…" has no box of its own (display: contents): name an element inside it`.
- Tests:
  - two `display: contents` grid rows count 2;
  - `<p><span style="display: contents">Hello</span> world</p>` reads `Hello world`;
  - a row inside `display: none` counts 0;
  - a row inside a `content-visibility: hidden` box counts 0;
  - the three box checks give the message;
  - `absent` fails on the painted row and passes on the hidden one.

**R101 (N4).** A field (`input`, `textarea`, `select`) that is not shown reads `""`. The type test of R96 comes first, so `type="hidden"` still says it shows no text. Tests: a `display: none` input, and an input, a select and a textarea inside a closed `<details>`.

**R102 (N5).** An element whose own computed `content-visibility` is `hidden` is not painted, or the nearest boxed ancestor of a `display: contents` element. The message is `content-visibility: hidden on …`, or `hidden="until-found" on …`. Tests:
- `text` on a `hidden="until-found"` paragraph and on a `content-visibility: hidden` paragraph reads `""`;
- `visible` fails on both, each with its own message;
- `absent` passes on both;
- a row hiding its own content is not counted.

**N7.** The header carries the two lines. Tests:
- a fieldset's text leaves out a textarea typed over;
- a submit input with no `value` reads `""`;
- a date input reads its `value`.

**Beyond N7, found by the survey (layout 8).** A container's text included a `<textarea>`'s own text, its first value, stale once typed over. A textarea's text nodes are now left out of a container's text.

**N9.** `1 rendered element has …`. Pinned in the R102 test's count.

### Tests, RED and GREEN

- **RED.** The in-page file of `7fea4e6`, swapped in and then restored, byte-checked, fails all five new tests (17 others pass).
- **GREEN.**
  - In-page block: 22/22.
  - `tests/accept.test.mjs`: 54/54.
  - `npm test`, once: 408 tests, 407 pass, 1 skipped, 173 s.

### Hand mutation

43 mutants were run against the round's conditions:
- the `display: contents` walk;
- the element's own `content-visibility`, and its two messages;
- the box-less test in `unrendered`, `visible`, `in-viewport` and `min-size`;
- the unpainted field, and the field set;
- the textarea text;
- each "holds all" property and each word of the two regular expressions;
- the absolute/fixed branches of `blockOf`;
- the chain walk, both from the element and from block to block;
- `html`, and `body` both ways;
- inline and contents;
- `contain: paint`;
- the tolerance at 0 and at 2;
- both scale factors;
- the singular;
- the order of the type test before the painted test.

The file was restored and byte-checked.
- **First run: 41 killed.** Walking on by parent from the first block survived for want of a block that itself escapes. Letting `html` clip survived for want of `html { overflow: hidden }` with an element below the fold.
- **After adding both cases:** 43/43.

### The ten layouts

Each layout is a page the survey wrote at 390 × 900, checked through the in-page function, then pictured and looked at. The script is in the scratch folder, not committed.

| Layout | Check | The function says | The page shows | Agrees |
|---|---|---|---|---|
| Card grid (auto-fill 160 px cards, `overflow: hidden`) | visible card-2-title | rendered, 151 × 26.2 | the title | yes |
| | text card-2-title | "Room 2" | Room 2 | yes |
| | count card- | 18 (6 cards, 6 titles, 6 buttons) | 6 cards with their parts | yes |
| | in-viewport card-1-book / card-6-book | inside (y 90.6 / 340.6) | both buttons on the first screen | yes |
| Table in a 200 px scrolling panel | visible row-15 | rendered | in the panel, scrolled out of sight | yes, by definition (see concern 1) |
| | text row-2 | "Room 2free until 10:01" | the two cells | yes (cells joined, as the header says) |
| | count row- | 20 | 20 rows | yes |
| | in-viewport row-1 / row-15 | inside / clipped by the panel | row 1 shown, row 15 out of the panel's view | yes |
| Sticky bottom bar | visible, text bar-book | rendered, "Book a walk-in" | the button | yes |
| | in-viewport bar-book | inside, y 866.6 | stuck at the bottom of the screen | yes (at scroll 0; concern 3) |
| Modal (fixed overlay) | visible dialog-title, in-viewport dialog-book | rendered, inside | the dialog | yes |
| | text dialog-name | "Ana" | Ana in the field | yes |
| | visible behind (the heading under the overlay) | rendered | dimmed behind a half-dark overlay | yes, by definition (concern 4) |
| Absolute dropdown in an `overflow: hidden` card | in-viewport menu-3 | clipped by the card | the menu cut by the card: only "Room 1" shows | yes |
| | visible menu-3 | rendered | cut away, not on screen | **no**, by definition (concern 1) |
| | visible floor-1 / count floor- (a hidden menu) | display: none / 0 | nothing | yes |
| Tab panel (one shown, one `hidden`, one `display: none`) | visible panel-2-text | display: none on panel-2 | not shown | yes |
| | text panel-1 / count panel- | "Two rooms free." / 2, 3 more not rendered | panel 1 only | yes |
| List with a `display: contents` wrapper | visible group-a | no box of its own | (a wrapper) | yes, as R100 rules |
| | text group-a / count item- / in-viewport item-3 | "Room 1Room 2" / 3 / inside | the three items | yes |
| Form in a fieldset | text name / room / when | "Ana López" / "Sala Jardín" / "2026-11-14" | the same, the date drawn as 11/14/2026 | yes (the date as the header says) |
| | text send (submit, no value) | "" | "Submit" | as the header says |
| | text patient (the fieldset) | "PatientName Room" (fixed: it read "PatientName Room Walk-in") | legend, labels, fields | yes, fields left out |
| Truncated line (`text-overflow: ellipsis`) | visible line, in-viewport line | rendered, inside | the line | yes |
| | text line | "Sala Jardín is free until 11:15 today" | "Sala Jardín is free …" | **no** (concern 2) |
| | in-viewport tail (the cut-off span) | clipped by the line | cut off | yes |
| Scaled page (`transform: scale(.5)`, `zoom: 2`) | in-viewport scaled-right / scaled-out / zoomed-right | inside / clipped / inside | shown / cut / shown | yes (fixed: scaled-out passed before) |
| | min-size scaled-book (88 px at half scale) | 44 × 44 | a 44 px button | yes |

### Concerns: what the survey found that a ruling must settle

1. **`visible` passes for an element that a non-scrolling box clips away entirely.** An example is the dropdown's last item cut by its `overflow: hidden` card. R94 defines rendered as painted, not as on screen, and clipping is `in-viewport`'s work. A row scrolled out of a scroll panel is rightly rendered, since one can scroll to it. An item cut by `overflow: hidden` can never be seen. Settling this changes the meaning of `visible`.
2. **`text` reads the whole text of a line that the browser truncates with an ellipsis.** The words are in the document and read aloud; the eye sees "…". Detecting it is possible (`text-overflow: ellipsis` with a scroll width wider than the client width), but what to answer then is a ruling.
3. **A `position: sticky` element on a page already scrolled is put back by the page's scroll.** That is wrong for a stuck element. The runner always measures at scroll 0, where it is right. A build session that scrolls first may get a wrong `in-viewport`.
4. **`visible` does not know what covers an element** (a modal's overlay, a toast over a button).
5. **Sizes.** The in-page file is 541 lines; `scripts/accept.mjs` is unchanged at 529.

## Fix report — round 3

Commit (on `v2-pipeline`, not pushed, nothing amended):
- `e18f572` fix: in-viewport asks the browser what it clipped

### What changed

**R104 replaces R99.** `blockOf` and `holdsAll` are deleted.

**Step 1.** The first-viewport test is unchanged.

**Step 2.** `mightClip(element)` walks plain parents up to and including `body`. An ancestor might clip when it has any of:
- `overflow-x` or `overflow-y` other than `visible`;
- `contain` holding `paint`/`strict`/`content`;
- `content-visibility` other than `visible`;
- `clip-path` other than `none`;
- it is an `svg`.

No test of display or position is made.

**Step 3.** `inside(box, ancestor)` measures the padding box as before: client sizes, scaled by the drawn size over `offsetWidth`/`offsetHeight`, with `TOLERANCE = 1`. An element inside every box that might clip, and with no `clip-path` among them, passes without asking.

**Step 4.** `pointsOf` gives the centre and the middle of each edge, one pixel in. A side under two pixels gets half the side. `found()` asks `document.elementsFromPoint` and looks for the element or one in it.
- A miss fails with `it is clipped by <named>`.
- The name is the first might-clip ancestor whose box the element lies outside, else the nearest with a `clip-path`.

**Step 5.** `untellable` is reached only from step 4. The message begins `cannot be told: …`, followed by any first-viewport fault. The four causes:
- `pointer-events: none`: `cannot be told: it has pointer-events: none, and the browser is asked by pointing at it`;
- an `[inert]` ancestor or self;
- an open `:modal` that does not contain it;
- a page scrolled on either axis with the box now outside the window: `… measure at the top of the page`.

**Step 6.** An element with more than one line box is pointed at the centre of each of its first eight. Empty line boxes are left out first: a `<br><br>` makes one, and its centre falls on a blank line. This is beyond R104's letter, and is pinned.

**R105.** An element's own `content-visibility` counts only when its display is not `inline`.

**R103 and R104's header lines are in:**
- `visible` means painted with a box, and does not ask about clipping or covering;
- an ellipsis line reads its whole string;
- what `in-viewport` measures, and when it asks the browser;
- measure at the top of the page.

### Tests

**Kept as they were:**
- N1's fractional cases and the inline `overflow: hidden` ancestor;
- N2 both ways;
- N6 both ways;
- N8;
- round 1's scroller cases;
- the drawn and zoomed clips.

**Corrected.** The 22.39 card's paragraph took the test page's `line-height: 18px`, so it was never fractional. The font is now on the paragraph (22.390625 against a client height of 22). The `container-type` assertion now expects both elements to escape (N10). The "holds all" list gained `translate`, `scale` and `rotate`.

**New — "in-viewport asks the browser what it clipped".** Each case on a page of its own; for each, the test's own `elementFromPoint` at the centre agrees with the function. Two cases expect a different centre answer, each said in the test: an inset clip-path cuts the edges not the centre, and a wrapped link's box centre falls on its blank line.
- N10: the toast passes, and the menu in a query-container card passes.
- N11: the `translate` drawer fails, the `scale: 0.95` card fails, and 300 px down a `content-visibility: auto` box fails.
- N12: the chart label at x −50 fails; a label inside passes.
- N17: the absolute and fixed elements in a `clip-path: inset(0)` box fail; an `inset(10px)` clip cuts an element that lies inside the box; a clip-path that cuts nothing passes after asking.
- Rules of one pixel, high and wide.
- A link with an empty line.
- An element outside an `overflow: hidden` box inside a clip-path box: the first is named.
- Clipping on x only and on y only.
- `contain: strict` and `contain: content`.
- N14: a button in a `showModal()` dialog written in a transformed clipping box passes, painted.

**New — "cannot be told".**
- `pointer-events: none` outside a clipper's box gives `cannot be told:`; inside every box it passes. So does a fractional box with `pointer-events: none`, and a bordered fractional box (the case that pins the tolerance).
- An inert element.
- Behind an open modal: outside a box it cannot be told, and inside every box it passes.
- Scrolled down and out of the window: cannot be told. Scrolled sideways: the same. At the top of the page: passes.
- Scrolled, in the window, outside a box: the browser is asked.

**New — step 6.** A link wrapped over three lines in a column with a clip-path, all of it showing, passes. The test asserts the link has three line boxes and that its last stops short of the box's middle, where the five points would miss. In a column two lines high that hides the rest, the same link is clipped.

**New — R105.** The two spans pass `visible`, fail `absent`, read their text, and their container reads `Room 2 and Sala`.

### RED, GREEN, mutation

- **RED.** The in-page file of `8eca085`, swapped in and restored, fails four tests: the corrected `container-type` assertion, the browser test, the cannot-be-told test and R105. The step-6 test passes there, because the old code never pointed at anything. Step 6 is pinned by its mutant: five points in place of line centres fails it.
- **GREEN.**
  - In-page block: 26/26.
  - `tests/accept.test.mjs`: 58/58.
  - `npm test`, once: 412 tests, 411 pass, 1 skipped, 185 s.
- **Mutation.** 40 mutants were run against the round's conditions:
  - each might-clip predicate and each `contain` word;
  - the walk's end;
  - each edge of `inside`, the tolerance at 0 and 2, and each scale factor;
  - the two halves of step 3's condition, the cannot-be-told return, the clipped verdict, and the order of naming;
  - each step-5 cause, the modal's containment, both halves of `scrolled && out`, the x axis of each;
  - the line-box branch, the eight, the empty-box filter, and each half-side;
  - each of the five points;
  - R105's inline test.

  The file was restored and byte-checked.
  - **First run: 33 killed.** Six of the seven survivors lacked a case:
    - pointer-events on a fractional box;
    - the naming order;
    - a sideways scroll, twice;
    - a one-pixel-wide element;
    - the empty-line filter.
  - **After adding them: 39 of 40.** Pinning the tolerance needed a bordered fractional box, because the scale factor alone absorbs an unbordered box's rounding.
  - **The one survivor cannot be pinned.** It is the `svg` predicate. Chrome's own stylesheet gives an `svg` `overflow: hidden`, so the `overflow` test already finds it; an `svg` with `overflow: visible` cuts nothing, and asking gives the same answer.

### The ten layouts, again, with the page's own answer at each centre

Each layout is a page at 390 × 900. "Centre" is `document.elementFromPoint` at the centre of the element's box: "it" when it finds the element or one in it.

| Layout | Check | The function says | Centre | Agrees |
|---|---|---|---|---|
| Card grid | in-viewport card-1-book / card-6-book | inside / inside | it / it | yes |
| | visible, text card-2-title | rendered, "Room 2" | it | yes |
| Table in a scrolling panel | in-viewport row-1 | inside | it | yes |
| | in-viewport row-15 | clipped by the panel | `<html>` | yes |
| | visible row-15 | rendered | `<html>` | by R103: `visible` does not ask about clipping |
| Sticky bottom bar | in-viewport bar-book | inside (y 866.6) | it | yes |
| Modal (fixed overlay) | in-viewport dialog-book | inside | it | yes |
| | visible behind (the heading under the overlay) | rendered | the overlay | by R103: `visible` does not ask about covering |
| Absolute dropdown in an `overflow: hidden` card | in-viewport menu-3 | clipped by the card | the next element under it | yes |
| | visible menu-3 | rendered | the next element under it | by R103 |
| Tab panel | in-viewport panel-1-text / visible panel-1 | inside / rendered | it / it | yes |
| | visible panel-2-text | display: none on panel-2 | no box | yes |
| `display: contents` list | in-viewport item-3, visible item-2 | inside, rendered | it | yes |
| | visible group-a | no box of its own | no box | yes |
| Form in a fieldset | in-viewport send, text name/room/patient | inside, the values, "PatientName Room" | it | yes |
| Truncated line | in-viewport line / tail | inside / clipped by the line | it / `<body>` | yes |
| | text line | the whole string | it | by R103: the ellipsis is not read |
| Scaled page | in-viewport scaled-right / scaled-out / zoomed-right | inside / clipped / inside | it / the clip / it | yes |
| | min-size scaled-book | 44 × 44 drawn | it | yes |

Every `in-viewport` answer agrees with the centre. The `visible` and `text` answers that differ from the centre are the three things R103's lines now say these checks do not ask.

### Concerns

1. **Pointing at an element below the first viewport on an unscrolled page.** It answers from points outside the window, where `elementsFromPoint` lists nothing. The check has already failed for being outside the first viewport, but it then also says `it is clipped by …`. R104 keeps step 5's window test to scrolled pages, and round 1's scroller case relies on that message. Only a box outside a might-clip box and below the fold meets this: there, an absolute element that escapes its box is wrongly said to be clipped as well.
2. **The empty-line-box filter** (step 6) is beyond R104's letter, as above.
3. **Sizes.** The in-page file is 591 lines.

## Fix report — round 4

Head before the round: `e18f572`. One commit: `ab01b10 fix: in-viewport asks the browser near a rounded corner`. Two files: `scripts/inpage/accept-inpage.js` (591 → 629 lines) and `tests/accept.test.mjs`. Nothing deferred was touched.

### What changed

**R106 — `scripts/inpage/accept-inpage.js`**
- `:548` — step 3's second list (`clipped`) now holds an ancestor that might clip when it has a `clip-path` **or the element's box reaches one of its rounded corners** (`atCorner(box, at)`). Everything after is as it was: the browser is asked, `cannot be told:` when it cannot be, and a missed point names the first ancestor whose box the element lies outside, else the first of `clipped` — so the rounded ancestor is named exactly as a `clip-path` one is. Comment at `:541-542`.
- `:277-294` `atCorner(box, at)` — the four corners, each read from its computed longhand (`border-top-left-radius`, `-top-right-`, `-bottom-right-`, `-bottom-left-`) and placed at its corner of the ancestor's box; true when the element's box overlaps the rectangle at a corner, as wide as the radius across and as high as the radius down. A corner whose radius is 0 either way is square (as CSS has it) and has no rectangle.
- `:263-275` `RADIUS`, `radiiOf(value, edge)` — one or two lengths in `px` or `%`, across then down, one meaning both; a percentage is of the box's width across and of its height down; `px` is multiplied by the scale step 3 already computes; each is capped at the box; a value that does not read as that (Chrome computes `calc(25% + 10px)` for a sum) counts as the whole box.
- `:246-261` `edgesOf(at)` — the six lines that computed the padding-box edges inside `inside` are moved into a helper of their own so that the corners are placed on **the same edges** ("the same coordinates as the edges already compared in step 3"); `inside` compares against what it returns. `inside` answers as before (its 40 mutants of round 3 were not re-run; every earlier in-viewport test passes).
- `:37-42` header — in-viewport's lines now say that an element reaching a rounded corner of a box that might cut it is asked about.

How two words of the ruling were read, both to the safe side:
- **"the box"** for a percentage and for the cap is the ancestor's whole box as drawn (its `getBoundingClientRect`, the border box, which is what CSS takes a percentage of). The rectangles are placed at the corners of the padding box, the edges of step 3. So a rectangle is larger than the real inner corner by the border's width, never smaller (measured: a 10 px border with a 30 px radius, a badge in the corner fails as the page paints it).
- **Chrome's computed forms** (157.0.8103.38, probed): `12px`; `50% 20%` for `50% / 20%`; `10px 1px`; `24px` for `1.5em`; `calc(25% + 10px)`; `3.35544e+07px` for a huge length (not read → the whole box, which is what the cap would give). Under `zoom: 2` the computed radius stays `12px` and the scale is 2, so the corner is 24 px as drawn (measured: the avatar's dot under `zoom: 2` fails as painted).

**N23 — `tests/accept.test.mjs:1754-1755`** — `display: block` is dropped from the chart-label case; the `<svg>` is inline, as written.

**The new test — `tests/accept.test.mjs:1845-1926`**, "in-viewport asks the browser where a box reaches a rounded corner of an element that might cut it, and nowhere else".

### Tests: RED and GREEN

**RED, the committed test on `e18f572`'s in-page file:** it fails at its first case — `expected ['dot', false, 'it is clipped by <div class="avatar">']`, `actual ['dot', true, '']` — the wrong pass N18 describes.

Since one test stops at its first failure, every case was also run through a probe against `e18f572` and against the new file, with the page's own `elementFromPoint` at the five points (T found, f not; centre, top, bottom, left, right):

| Case | The page's five points | `e18f572` | Now |
|---|---|---|---|
| Dot 10 px at the top right of the round avatar (40 px, `50%`) | ffTTf | pass (**wrong**) | failed, `it is clipped by <div class="avatar">` |
| Photo filling the avatar | TTTTT | pass | pass (asked, found) |
| Heading flush with the top of the card (`12px`) | TTTTT | pass | pass (asked, found) |
| Line in the middle of the card | TTTTT | pass | pass (not asked) |
| The same with `pointer-events: none` | — | pass | pass (not asked) |
| Badge 4 px in the top right corner of the card | fffff | pass (**wrong**) | failed, `it is clipped by <div class="card">` |
| Badge in the one rounded corner, each of the four in turn (`border-top-left-radius: 12px` alone, …) | fffff ×4 | pass ×4 (**wrong**) | failed ×4 |
| Dot in an avatar with `border-radius: calc(10px + 25%)` | ffTTf | pass (**wrong**) | failed (a value not read is the whole box) |
| Between the two top corners, touching both (`left: 12px; right: 12px`), and down the left side between two (`top: 12px; bottom: 12px`), `pointer-events: none` | — | pass | pass (not asked) |
| Box with square corners, a line half a pixel over its corner, `pointer-events: none`; and the same with `border-radius: 0 / 5px` | — | pass | pass (not asked) |
| `50% / 20%` on 300 × 100: a 20 px square in the top band, 62 px along | TfTTT | pass (**wrong**) | failed, `it is clipped by <div class="wide">` — agrees with the five points |
| The same box: an element in the middle band 10 px from the side, `pointer-events: none` | — | pass | pass (not asked) |
| Box of `40px` corners drawn at `scale(2)`: 4 px elements 44 px down the side and 44 px along the top as drawn | ffffT, ffTff | pass ×2 (**wrong**) | failed ×2, `it is clipped by <div class="twice">` |
| The avatar's dot with `pointer-events: none` | — | pass (**wrong**) | failed, `cannot be told: it has pointer-events: none, …` |

Eleven of these answers were wrong before the change; the rest are the passes that must stay passes, and each is pinned by a mutant below. The test asserts the page's own answer beside the function's: at the centre for every askable case (the shared `evaluateAndPoint`), and at all five points for the percentage case (`:1899-1910`, `assert.equal(results[0].pass, points.every(Boolean))`).

**N23, RED.** On round 2's in-page file (`8eca085`): the old case (`display: block`) is reported `it is clipped by <svg class="chart">` — it did not need the fix; the new case (inline) is reported **pass** while the page finds the label at one point of five (ffffT) — it does. On the current file with an inline ancestor passed over again (one line added to `mightClip`, then removed), the committed test fails: `expected ['label-out', false, 'it is clipped by <svg class="chart">']`, `actual ['label-out', true, '']`; the same mutant leaves the old `display: block` shape reported clipped.

**GREEN.**
- `node --test tests/accept.test.mjs`: 59 tests, 59 pass (58 before), 57 s.
- `npm test`, once: **413 tests, 412 pass, 0 fail, 1 skipped, 186.5 s** (before the round: 412 / 411 / 1). The skipped one is the folder-mode test this file system cannot run.

### Hand mutation

29 mutants of the new code, each written over the in-page file, the in-viewport tests run, the file put back and checked byte for byte (sha256 `aa72e0ba…` before and after). **28 killed, each by the new test; 1 survives.**

| Mutant | Killed by |
|---|---|
| The whole condition dropped (`\|\| atCorner(…)`) | the dot: pass |
| **The region test dropped** (any rounded corner asks) | the card's middle line with `pointer-events: none`: `cannot be told` |
| **Each corner dropped in turn** (4) | top-left, bottom-right, bottom-left: the badge on the card rounded there alone passes; top-right: the avatar's dot passes |
| **Across and down swapped** — the two radii of a corner; and the order they are read in | the five-point agreement of the `50% / 20%` case (`:1910`): the function passes, the page misses a point |
| **The percentage branch dropped** — read as `px` | the same agreement (`:1910`) |
| **The percentage branch dropped** — not read at all | the middle-band element: `cannot be told` |
| A percentage across taken of the height, and down of the width | the agreement (`:1910`) |
| The second length ignored | the middle-band element: `cannot be told` |
| A value that cannot be read counts as no corner | the `calc()` avatar's dot: pass |
| No-radius test dropped; and `\|\|` for `&&` in it | the square box; the `0 / 5px` box: `cannot be told` |
| The scale across dropped; the scale down dropped | the two elements of the `scale(2)` box |
| The corners turned by one; the right-hand corners placed at the left; the bottom corners placed at the top | the single-corner badges; the dot |
| Each of the four comparisons of the overlap dropped (4) | along the top (2), the middle line (2): `cannot be told` |
| Each of the four made to count a touch (`<` → `<=`, `>` → `>=`) (4) | along the top (2), down the side (2): `cannot be told` |
| **The cap dropped** | **survives — cannot be pinned** |

**The cap cannot be pinned, and I believe no test can pin it.** Without it a rectangle only grows past the far side of the ancestor's box. An element that lies inside that box overlaps the capped rectangle whenever it overlaps the uncapped one, and an element that lies outside the box is asked about anyway by step 3's first condition, and named by it first. The cap is in the code because the ruling says it; it changes no answer. (The same expression is what turns a number that does not parse into the whole box, which no computed value reaches.)

### Ordinary rounded shapes, for the wrong fail

Eighteen shapes run on `e18f572` and on the new file, the page's five points beside each. Fifteen answer as before, all agreeing with the page: a cover image flush with a card's top, a line in a card (padding 16 or 12, radius 12; also with `pointer-events: none`, also at 200.3 px and 123.33 px wide), the first row of a list rounded 8 px, a close button 8 px from the corner of a dialog rounded 16 px, an icon button 4 px from it, an input filling a search pill, a pill button's label, initials in an avatar, a menu that escapes a rounded card and lies over its corner, a badge at the top right of a rounded scroller with a scroll bar. Two that passed wrongly now fail as painted (the avatar's dot under `zoom: 2`; a badge in the corner of a box with a 10 px border and a 30 px radius). One changed for the worse: concern 2.

### Concerns

1. **A box whose padding equals its radius, sized in fractions of a pixel both ways, asks about a child that only touches the corner's rectangle — a wrong `cannot be told` on an ordinary page.** Measured: a card in a three-column grid with gaps (123.328125 wide), `padding: 12px; border-radius: 12px; overflow: hidden`, holding one line of `font: 16px/1.4` (so 46.390625 high), the line with `pointer-events: none` or `inert`: `e18f572` passes; now `cannot be told: …`. The line starts exactly 12 px in and 12 px down, where no rounding can reach it. The cause is the scale of step 3: it is `rect.width / offsetWidth`, and `offsetWidth` is a whole number, so the 12 px corner comes out 12.032 × 12.102 as drawn and the line "overlaps" it by a few hundredths. It needs the fraction on both axes (with a whole height the same card passes), padding equal to the radius (16 against 12 passes), and an element that cannot be asked (taking pointer events it is asked, found, and passes). R106 says the regions are in the scaled coordinates the code already computes and that an over-estimate is harmless, so I did it as written and added no tolerance of my own. A ruling could give the corner's rectangle a hair of play, or take a `px` radius unscaled when the scale is within rounding of 1; I did neither.
2. **A pill is all corner.** `border-radius: 999px` capped at the box makes each rectangle the whole box, so anything inside a pill that hides its overflow is asked about. Askable content passes (measured: a search pill's input, a pill button's label). Content that cannot be asked no longer passes: the label of a pill button with `overflow: hidden` and `pointer-events: none` (some kits turn a disabled button off that way) was `pass` and is now `cannot be told: it has pointer-events: none, …`. This is the cap as R106 words it; CSS itself shrinks such a radius to half the box's shorter side, which the ruling does not ask for.
3. **By the ruling's own geometry, a rectangle is more than the corner.** A child whose box enters the rectangle without being cut (padding 8 in a box rounded 12) is asked about; it passes when it can be asked and is `cannot be told` when it cannot. Stated in R106 ("it only asks the browser more often"); noted here because with concerns 1 and 2 it is the same wrong fail: only for an element that takes no pointer events, is inert, or lies behind an open modal dialog.
4. **`edgesOf` is a move, not a new rule** — six lines taken out of `inside` so that the corners sit on the same edges. Named here because the round says to refactor nothing else.
5. **Cases beyond R106's list of six**, each because a condition of the ruling had no case that fails without it: the `calc()` radius (a value that cannot be read), the `scale(2)` box (the scaled coordinates), the square and `0 / 5px` boxes (an ancestor with no corner radius is never asked on that account), the two elements between corners (the rectangle's sides), and the four single-corner cards (each corner's own radius at its own place — the ruling's "drop each corner in turn").
6. **The `svg` predicate still cannot be pinned** (round 3's one survivor): Chrome's own stylesheet gives an `svg` `overflow: hidden`, so the overflow test finds it. N23's case is pinned against an inline ancestor being passed over, which is the fault N12 was, not against that predicate.

## Fix report — round 5

Head before the round: `ab01b10`. One commit: `0170479 fix: a rounded corner cuts only what lies outside its curve`. Two files: `scripts/inpage/accept-inpage.js` (629 → 635 lines) and `tests/accept.test.mjs`. Nothing deferred was touched.

**One listed test is not done, and is not committed: concern 2, the label of an ordinary pill.** R107 as written cannot make it pass. It is the first concern below, with the measurement and what would close it.

### What changed

**R107 — `scripts/inpage/accept-inpage.js:277-300`, `atCorner(box, at)`.** For each corner of an ancestor that might clip:
- the corner's radii `rx`, `ry` are read as in round 4 (`radiiOf`, unchanged: `px` or `%`, scaled, capped at the box, a value that cannot be read being the whole box);
- how far in from the corner the element's box begins, across and down, is taken from the corner's own two edges (`:287-290` — top-left: `box.left − edge.left`, `box.top − edge.top`; the other three mirrored), never less than 0: that is **P**, the point of the box nearest to the corner, kept on the ancestor's own edges;
- `TOLERANCE` (one pixel, the constant step 3 already uses) is added across and down (`:295-296`);
- when that point has reached the centre across or down (`x >= rx || y >= ry`, `:297`), the corner cuts nothing of the box;
- else the corner may cut it when the point lies outside the ellipse (`:298`), and the browser is asked as in round 4.

The header (`:37-38`) and step 3's comment (`:547-548`) say "inside the curve of each rounded corner" where they said "reaches no rounded corner".

Two things about how it is written:
- **Round 4's rectangle is no longer a comparison of its own.** "P has reached or passed the centre on either axis" *is* that rectangle seen from the corner, with the pixel of play. Kept beside it, the four comparisons of round 4 could not be failed by any test: each is either implied by the centre test or true of every element that lies inside the ancestor's box. The test for a corner with no radius went the same way (a point a pixel in has always reached a centre no pixels in; the square-corner cases of round 4 still pass, and now pin the centre test). One answer differs from "overlap, then curve": an element thinner than the pixel of play that lies wholly beyond the ancestor's edge beside a rounded corner is now asked about, where round 4 did not ask. It is toward asking, and such an element is cut.
- **The curve is compared as products, not quotients** (`(rx−x)²·ry² + (ry−y)²·rx² > rx²·ry²`), so that a point exactly on the curve compares exactly: with quotients `0.6² + 0.8²` comes out a hair over 1.

### Tests

**New — `tests/accept.test.mjs:1928-1961`, "in-viewport: at a rounded corner the curve decides: what lies inside it, a pixel of play given, is never asked about".** No element in it can be pointed at (`pointer-events: none`, or `inert`), so one that passes was never asked about, and one that is asked is `cannot be told:`.

| Case | `ab01b10` | Now |
|---|---|---|
| **Concern 1**: card 123.33 × 46.39, padding 12, radius 12, its line with `pointer-events: none` (`:1936`) | `cannot be told` | pass |
| The same line, `inert` (`:1937`) | `cannot be told` | pass |
| A line 8 px in and 8 px down in a card rounded 12 px, padding 8 (`:1939`) | `cannot be told` | pass |
| Along the top of a card rounded 12 px, 100 px from either corner (`:1942`) | pass | pass |
| 4 px element deep in the corner of that card, where it is cut (`:1943`) | `cannot be told` | `cannot be told` |
| Each corner of a box rounded `40px / 20px`: an element 4 px along and 10 px down — a pixel in, inside the curve (35² + 4 × 9² = 1549, to 1600) (`:1949-1952`, ×4) | `cannot be told` ×4 | pass ×4 |
| The same corners: 4 px along and 9 px down — outside it (35² + 4 × 10² = 1625) (×4) | `cannot be told` ×4 | `cannot be told` ×4 |
| On the curve: 15 px along and 3 px down (24² + 4 × 16² = 1600) (`:1954`) | `cannot be told` | pass |
| A line half a pixel over the corner of a box rounded 3 px (`:1957`) | `cannot be told` | pass |
| In the middle of a box 200 × 100 rounded 999 px (`:1960`) | `cannot be told` | pass |

**RED.** The committed test on `ab01b10`'s in-page file fails at its first case: `expected ['line', true, '']`, `actual ['line', false, 'cannot be told: it has pointer-events: none, …']` — concern 1 as reported. The other rows were read through a probe against both files, since one test stops at its first failure.

**Stay as they are from round 4** — round 4's test (`:1845-1926`) is unchanged and passes: the avatar's dot fails as clipped; the photo filling the avatar passes, asked and found at its five points; the heading at the top of the 12 px card passes; the badge deep in the corner fails; the `50% / 20%` case agrees with the page's five points (`:1910`); the between-corners, square-corner, `calc()` and `scale(2)` cases as before.

**GREEN.**
- `node --test tests/accept.test.mjs`: 60 tests, 60 pass, 58 s.
- `npm test`, once: **414 tests, 413 pass, 0 fail, 1 skipped, 191.4 s** (before the round: 413 / 412 / 1).

### Hand mutation

41 mutants, each written over the in-page file, the in-viewport tests run, the file put back and checked byte for byte (sha256 `1e7c1588…` before and after). **41 killed, none survives.**

| Mutant (R107) | Killed by |
|---|---|
| **The `≤`**: on the curve counts as outside | the element on the curve (`:1954`) |
| The comparison turned round | round 4's dot; the 8 px line |
| **The tolerance** dropped across; dropped down; doubled | the per-corner pairs (`:1951`): "inside" becomes `cannot be told`; doubled, "outside" passes |
| **Each corner's mirroring**: its distance across taken from the other side, its distance down from the other side (8) | round 4's dot and single-corner badges pass; the per-corner pairs; the deep element |
| **`rx` and `ry` swapped**: both; in the centre test only; in the curve only | the `50% / 20%` agreement (`:1910`); the per-corner pairs on the `40px / 20px` box |
| Across and down exchanged for the point | the same two |
| **The reached-the-centre shortcut** dropped; its across half; its down half | round 4's middle line and square boxes; along the top (`:1942`); the per-corner pairs |
| **The curve dropped**, the rectangle kept with its pixel of play | the 8 px line (`:1939`) |
| **The curve test dropped altogether** — round 4's rectangle; and "any rounded corner asks" | **concern 1's case (`:1936`)**, with round 4's square and middle-line cases |
| The nearest point not kept on the ancestor's edge, across; down | the line half a pixel over a 3 px corner (`:1957`) |

Round 4's conditions that R107 left standing were mutated again on the new code, 16 mutants: the whole condition, each corner dropped (4), the radii turned by one corner, a percentage read as `px` / not read / of the wrong side, a value that cannot be read as no corner, the second length ignored, the scale across and down, and the cap (both, across only, down only). All killed. **The cap, round 4's one survivor, is now pinned** (`:1960`): under R107 a radius changes the curve, so capped and uncapped answer differently.

### Ordinary rounded shapes, again

28 shapes on `ab01b10` and on the new file, the page's five points beside each.
- **Every element that can be pointed at answers as in round 4**, agreeing with the page (14 shapes: cover image, lines in cards, list row, close and icon buttons, search pill's input, a pill's label, avatar initials, the escaping menu, the scroller's badge; the dots and the bordered box's badge still fail as painted, also with `border-radius: 9999px` and under `zoom: 2`).
- **Elements that cannot be pointed at** (14 shapes with `pointer-events: none`): round 4 passed 2 and said `cannot be told` of 12. Now 8 of those 12 pass, never asked: concern 1's card; padding 8, and 4, in a card rounded 12; padding 16 in a card rounded 24; the close button 8 px from a 16 px corner; a pill whose radius is written as it is drawn; initials in an avatar rounded `50%`, and `9999px`. One is rightly still `cannot be told`: a line flush in the corner of a 12 px card, whose corner the rounding does cut. **Three are still `cannot be told` and should not be: the pills** — concern 1 below.

### Concerns

1. **Concern 2's test cannot be made to pass as R107 is written, so it is not in the commit: the label of an ordinary pill is still `cannot be told`.** I did not invent a rule to pass it, and I did not commit a pill sized to pass.
   - *Measured.* A button `border-radius: 999px; overflow: hidden; padding: 8px 16px; pointer-events: none`, 80.92 × 40, its label 16 px in and 11 px down: `cannot be told`, in round 4 and now. The same with `9999px`; a chip (`padding: 2px 10px`, 44.69 × 20): the same.
   - *Why.* R107 takes `rx`, `ry` as R106 gives them, and R106 caps a radius at the box, so a pill's corner has radii 80.92 × 40: a quarter of an ellipse **as large as the whole box**, centred on the opposite corner. The label's nearest point, a pixel in, is at (17, 12): (63.92 / 80.92)² + (28 / 40)² = 1.11, outside that curve, so it is asked. Roughly, only what lies in the middle two fifths of a pill each way is inside all four such curves (a label with `padding: 20px 60px` passes; `:1960` pins that much). The pill's real corner is a circle of 20 px, and (17, 12) is well inside it.
   - *What would close it — a ruling, not mine to make.* The radii as the browser uses them: CSS shrinks all four corners together until those along no side add up to more than the side (CSS Backgrounds 3, "corner overlap": every radius × `min(side ÷ the sum of its two radii)` when that is under 1). That is exact for the outer radius, so it keeps R107's guarantee; it replaces R106's cap for a box whose four values can all be read, and the cap stays for one that holds a value that cannot. **Tried on a copy, not committed:** the three pills pass, never asked; the other 25 shapes, every case of this round and all ten in-viewport tests answer as they do in the commit. It is about a dozen lines in `atCorner`.
2. **R106's rectangle and its no-radius test are folded into the centre test** (above). I read "when the element's box overlaps that corner's region" and "has reached or passed the centre on either axis" as one condition said twice; written twice, half of it is code no test can fail. The one answer it changes is toward asking.
3. **What R107 still sends to `cannot be told`, rightly:** an element that cannot be pointed at whose nearest point lies more than a pixel outside a corner's curve — a full-width heading flush with the top of a rounded card (its two corners are cut), a badge in the corner. When it can be pointed at it is asked and answered as painted.
4. **The pixel of play is diagonal as well as straight.** A point that the corner cuts by less than a pixel across and down (the element 4 px along and 10 px down a `40px / 20px` corner: its very corner lies just outside the curve: 36² + 4 × 10² = 1696, to 1600) is taken as inside. That is R107's tolerance, the same pixel step 3 gives an edge.
