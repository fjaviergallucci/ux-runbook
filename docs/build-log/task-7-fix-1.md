# Task 7 — fix round 1 of 5

The review (head `ef13413`) found the build faithful to the brief and the rulings, the refactor a real
seam, and no critical issue. Three findings are Important; two of them come from the rulings' own
definitions, which are corrected here. Each item below needs a committed test that fails without it.

All line numbers are in `scripts/inpage/accept-inpage.js` unless another file is named.

## Important

**I1 — `visible` passes, and `absent` fails, for content that is not painted** (`:106-119`).
`unrendered` reads `display`, `opacity`, `visibility` and the box, and nothing else. The reviewer's probe:
an item inside a closed `<details>`, inside `hidden="until-found"`, and inside `content-visibility: hidden`
each gave `visible` → pass and `absent` → fail, while `checkVisibility()` said `false` for all three. A
closed expansion is the kit's own part (`kit/KIT-CONTRACT.md:87`), so this is a wrong pass on the
pipeline's own prototypes.
- **Ruling R94.** "Rendered" also means the browser says so: when `element.checkVisibility` exists and
  returns `false`, the element is not rendered. Where it does not exist, an element inside a closed
  `<details>` (and not inside that `details`' own first `summary`) is not rendered. Tests: an item in a
  closed and in an open `<details class="ux-expansion">`, through the in-page function and once through
  `accept prototype`; `hidden="until-found"`; `content-visibility: hidden`; the fallback with
  `checkVisibility` removed from the element in the test page.

**I2 — `contrast` reports a pass where colour alone is not what is painted** (`:172-178`, `:300-306`).
`behind` reads `background-color` only, and nothing reads `opacity`. Probe: black text on
`linear-gradient(#111,#222)` over white → pass, 21; text at `opacity: .2`, and text in an ancestor at
`opacity: .3` → pass, 21; white text on a dark-gradient button → fail, 1.
- **Ruling R95.** `contrast` gives a number only when it can stand behind it; otherwise the check is a
  failed result whose message begins `cannot be measured:` and names the element (by tag and `data-ux`
  when it has one) and the property. That is the case when
  - any layer from the element up to and including the nearest fully opaque background colour has a
    `background-image` other than `none`;
  - `opacity` is below 1 on the element or any ancestor;
  - `filter` or `backdrop-filter` is other than `none`, or `mix-blend-mode` is other than `normal`, on the
    element or any ancestor.
  The file's header says so in two lines: what `contrast` measures (declared colours, composed), and what
  it refuses to guess. Tests: one per bullet, each on the element and on an ancestor; the two pairs the
  reviewer measured stay as they are (black on white 21, `#767676` on white 4.54, translucent over
  translucent 2.61).

**I3 — a `text` check reads nothing the user sees on a form control, and reads text that is not shown**
(`:234`, `textContent`). Probe: `<input value="Room 2">` with `equals: "Room 2"` → fail, with
`equals: ""` → pass; a `<textarea>` typed into reads its first content; a `<select>` reads `"OneTwo"`;
`3 <span style="display:none">of 10 </span>free` reads `"3 of 10 free"`.
- **Ruling R96.** `text` is what is shown:
  - an `input` that shows text and a `textarea`: its current `value`; an input that shows no text
    (`checkbox`, `radio`, `file`, `hidden`, `range`, `color`, `image`) is a failed result that names the
    control's type. A placeholder is not text.
  - a `select`: the text of its selected option, several joined with `, `.
  - anything else: the text nodes whose own element is rendered (the R94 test without the box), so text
    under `display: none`, `visibility: hidden` or a closed `details` is left out. `text-transform` still
    does not change it, and white space is still collapsed and trimmed, NBSP kept.
  The header states the limits in one line each: a placeholder is not text; two blocks with no white space
  between them read as joined. Tests for every bullet.

## Smaller, fixed now because each is a wrong answer or touches the machine rule

- **M2 → Ruling R97.** `in-viewport` also requires the box to lie inside every ancestor that clips
  (`overflow` other than `visible` on either axis), as that ancestor is scrolled now. Probe: an element at
  y 500 inside a 100 px `overflow: auto` scroller passed. Tests: clipped out → fail with a message naming
  the clipping ancestor; inside the visible part of a scroller → pass.
- **M8 → Ruling R98.** `count` counts the elements that are rendered (the R94 test without the box). When
  some exist but are not rendered, the message says how many. Test: two rows present and hidden →
  `actual` 0.
- **M3.** A `page` that names a folder is opened as Chrome's directory listing, where an `absent` or
  `count … equals 0` check passes (`scripts/accept.mjs:134-142`, `:192`). The runner requires each page to
  be an existing file before any browser opens it: a folder or a missing file fails every check of its
  group with a message that says which, and the run goes on. Tests for both.
- **M4.** Without `--allow-errors`, a page with a fault of its own and reports loses the reports from both
  the message and the warnings (`scripts/accept.mjs:212-225`). The reports are still printed as warnings.
- **M9.** `--test-concurrency` needs Node 20.10: `package.json`'s `engines.node` becomes `>=20.10`, and
  the skeleton test pins it.
- **M10.** `readTimeout` and its `UsageError` are command-line parsing: move them from
  `scripts/lib/browser.mjs` (`:14`, `:411-417`) to `scripts/lib/cli.mjs`; `shots` and `accept` import them
  from there.
- **M11.** `tests/accept.test.mjs:87` and `tests/shots.test.mjs:138` send the group signal even when the
  group has already emptied, so a reused group id could be hit. Guard both with the group's own count
  (`inGroup(pgid) > 0`). No assertion of the shots file is weakened.
- **M12.** Tests: the read-only test (`tests/accept.test.mjs:912`) asserts each of the eight results, not
  only their number; one committed run opens a page whose own file name holds a space (the plan's review
  focus 4); one test pins `tests/fixtures/prototype/kit.css` byte for byte to `kit/grey/kit.css`; the
  `during` and `unread` phrases (`scripts/accept.mjs:152-153`) each get a test.
- **M7.** The in-page file's header says, in one line each, that a shadow root is not searched and that a
  screen element's own `data-ux` is not inside that screen.

## Deferred — do not fix now

M1 (the union box of a wrapped inline element), M5 (`instanceof` on a thrown revoked proxy), M6, M13,
M14 (no split now; `inpage` and `report` loading the browser library).

## Rules unchanged

Never kill a process by name, binary path or command-line pattern; no more than three browsers at once;
no `--import` in a test; stage by explicit path; commit on `v2-pipeline`, never push, never amend. The 57
shots tests stay green. Run the acceptance file while iterating and `npm test` once at the end.

Commits: `fix: acceptance checks measure what is painted` (I1, I2, I3, R97, R98, M7) and
`fix: the runner refuses a folder as a page, and smaller findings` (M3, M4, M9, M10, M11, M12) — or more
if that is cleaner. Hand-mutate the new conditions. Append "Fix report — round 1" to
`task-7-report.md` and reply with the short status contract: status, commits, one-line test summary,
concerns, the report path.
