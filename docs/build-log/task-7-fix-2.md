# Task 7 — fix round 2 of 5

The re-review (head `7fea4e6`) found all twelve findings of round 1 addressed with committed tests, no
throw that escapes and no write to the page. But the fix itself gives wrong answers on ordinary pages.
Six are to be fixed, with the rulings below; each needs a committed test that fails without it.

Line numbers are in `scripts/inpage/accept-inpage.js` at `7fea4e6`.

## N1 + N2 + N6 + N8 — `in-viewport`'s clipping is computed the wrong way (`:190-199`, `:391-398`)

What the reviewer measured:
- **N1.** `clientWidth`/`clientHeight` are whole numbers, compared with fractional
  `getBoundingClientRect` edges. A card with `overflow: hidden; font: 16px/1.4 sans-serif` holding one
  paragraph (both boxes bottom 22.390625, `clientHeight` 22) → `it is clipped by <div class="card-n">`. The
  same for a paragraph in a 200.3 px wide card and for a cell of a three-column `1fr` grid at 390 (123.33
  wide). An inline ancestor with `overflow: hidden` (which clips nothing) has client sizes of 0, so
  everything inside it reads as clipped. All of these passed before round 1.
- **N2.** The walk follows `parentElement`. A `position: fixed` and a `position: absolute` element inside a
  static 100 × 100 `overflow: hidden` box, both fully painted, fail with `it is clipped by …`. (With
  `transform` or `position: relative` on the clipper they are truly cut, and fail correctly.)
- **N6.** `body` is always skipped, but it does clip when `html`'s own overflow is not `visible`:
  `html { overflow: hidden } body { overflow: hidden; height: 100px }`, element at y 500 → pass.
- **N8.** `contain: paint` clips with `overflow: visible`: an element 300 px down a 100 px
  `contain: paint` box → pass.

**Ruling R99 — how R97 is computed.** The ancestors that can clip an element are found along its
**containing-block chain**, not its parents:
- an element that is `static`, `relative` or `sticky` → its parent element;
- `absolute` → the nearest ancestor that is positioned (`position` other than `static`) **or** that
  holds all its descendants: `transform`, `perspective`, `filter` or `backdrop-filter` other than `none`;
  `contain` holding `layout`, `paint`, `strict` or `content`; `container-type` other than `normal`;
  `will-change` naming `transform`, `perspective` or `filter`;
- `fixed` → the nearest ancestor of that second kind only; when there is none its block is the viewport
  and no ancestor clips it;
- the walk goes on from the block it found, by that block's own position; ancestors in between are
  passed over.

A box on that chain clips when it has a box that can clip (computed `display` neither `inline` nor
`contents`) and, on an axis, `overflow` other than `visible`, or `contain` holding `paint`, `strict` or
`content` (both axes). `html` never clips (its overflow is the viewport's). `body` clips only when
`html`'s own computed overflow is not `visible`.

Edges are compared with a **tolerance of one CSS pixel**: client sizes are whole numbers and boxes are
not. An element cut by less than a pixel passes; say so in the header in one line.

Tests, each through the in-page function on a page the test writes: the three fractional cases of N1 (the
22.39 card, the 200.3 card, the `1fr` grid cell at 390) pass; an inline `overflow: hidden` ancestor
passes; N2's fixed and absolute elements in a static clipper pass, and fail once the clipper has
`position: relative` (absolute) or `transform` (fixed); N6's page fails, and `body` alone hiding still
passes; N8's page fails; round 1's cases (clipped out of a scroller, inside its visible part before and
after scrolling) stay as they are.

## N3 — `display: contents` reads as not rendered (`:130`, `:136`; reached from `:182`, `:432`)

`checkVisibility()` is false for an element with no box of its own, though its content is painted. Two
`display: contents` grid rows with painted cells: `count … equals: 0` → pass, `equals: 2` → fail.
`<p><span style="display: contents">Hello</span> world</p>` reads `"world"`. Both were right before
round 1.

**Ruling R100.** An element with computed `display: contents` is painted when the nearest ancestor that
has a box of its own is (ask that one); this is what `text` and `count` use. `visible`, `min-size` and
`in-viewport` on a `display: contents` element are failed results that say the element has no box of its
own — a true statement that tells the designer to name a child. Tests: the two cases above; a
`display: contents` row inside a `display: none` parent counts 0; `visible` on such an element gives that
message.

## N4 — `text` passes on a control that is not shown (`:167-176`)

`<input value="Room 2" style="display:none">` with `equals: "Room 2"` → pass; an input, a select and a
textarea inside a closed `<details>` → pass. The same text in a hidden `<p>` reads `""`.

**Ruling R101.** A control that is not painted reads `""`, like any other element's hidden text. Tests:
the four cases.

## N5 — an element that hides its own content reads as shown (`:130`)

`checkVisibility()` is false only for what is *inside* such an element.
`<p data-ux hidden="until-found">Secret too</p>` with `equals: "Secret too"` → pass, on a box 0 high.
`<p style="content-visibility: hidden; padding: 4px">Secret</p>`: `text` → pass, and `visible` → pass on
its 8 px box. A row with `content-visibility: hidden` on itself is counted.

**Ruling R102.** An element whose own computed `content-visibility` is `hidden` is not painted, for
`visible`, `absent`, `text` and `count` alike: what a check is about is its content. Tests: the three
cases, and `absent` on such an element passes.

## Smaller, fixed now

- **N7.** Header, one line each: a container's text does not include the values of fields inside it; a
  submit input with no `value`, and a date input, read their `value`, not what the browser draws.
- **N9.** `:437` says "1 rendered elements have": make the number agree.

## Not to be fixed

Nothing else. The deferred list of round 1 stands.

## Rules unchanged

Never kill a process by name, binary path or command-line pattern; no more than three browsers at once;
no `--import` in a test; stage by explicit path; commit on `v2-pipeline`, never push, never amend. The
function still only reads, and still never throws.

Before you report, write the awkward page yourself and look: for each of `visible`, `text`, `count` and
`in-viewport`, take ten ordinary layouts you would expect in a real product (a card grid, a table in a
scrolling panel, a sticky bottom bar, a modal, a dropdown that is absolutely positioned, a tab panel whose
other panels are hidden, a list with a `display: contents` wrapper, a form in a `fieldset`, a truncated
line with `overflow: hidden; text-overflow: ellipsis`, a page scaled by `zoom` or a parent `transform`)
and check that what the function says is what the page shows. Report the table. A wrong answer you find
there and fix is part of this round; one you find and cannot settle goes in your concerns.

Commit: `fix: acceptance checks follow the containing block and what the browser paints`. Hand-mutate the
new conditions. Append "Fix report — round 2" to `task-7-report.md` and reply with the short status
contract.
