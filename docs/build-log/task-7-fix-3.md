# Task 7 — fix round 3 of 5

The re-review (head `8eca085`) found N1–N9 all addressed with committed tests, no escaping throw and no
write to the page. What remains open is one thing seen four ways: **the function re-implements which
ancestor clips an element, and CSS has more rules for that than a list can hold.**

What the reviewer measured in Chrome 157 (`scripts/inpage/accept-inpage.js` at `8eca085`):
- **N10** (`:223`) `container-type` is taken to hold absolute and fixed elements; it does not. A "Saved"
  toast fixed to the screen, written in a query container inside a scrolling `main`, is reported clipped
  while painted. The committed test pins the wrong answer (`tests/accept.test.mjs:1593`).
- **N11** (`:216-226`, `:253`) boxes that do hold all are missing: the `translate`, `rotate` and `scale`
  properties, `transform-style: preserve-3d`, `will-change: translate | scale | rotate`,
  `content-visibility: auto` (which also clips ordinary overflow). A drawer with
  `position: fixed; translate: 0px 0px; overflow: hidden` holding a fixed flyout outside it: pass, not
  painted.
- **N12** (`:252`) an `<svg>` is skipped as an inline box, though it clips its content: a chart label
  `<text x="-50">` in a 100 × 50 `<svg>` passes while not painted.
- **N14** (`:231`) the top layer is not known: a `<dialog>` opened with `showModal()`, written in a
  transformed clipping box, is painted in full and reported clipped.
- **N17** `clip-path: inset(0)` on a static clipper cuts the absolute and the fixed element written in it;
  both pass.

The list in ruling R99 was mine, and it was wrong both ways. It is withdrawn.

## Ruling R104 — the browser decides what it clipped (replaces R99)

`in-viewport` no longer works out containing blocks. `blockOf` and `holdsAll` are deleted. It does this:

1. **The viewport**, as now: the box, put back where it was before any scroll, lies inside the first
   viewport.
2. **Ancestors that might clip** are found by walking plain parents up to and including `body`. One
   might clip when any of these is true of it: `overflow-x` or `overflow-y` other than `visible`;
   `contain` holding `paint`, `strict` or `content`; `content-visibility` of `auto` or `hidden`;
   `clip-path` other than `none`; it is an `svg` element. No test of `display`, of position, or of what
   holds what.
3. **Clearly not clipped:** no ancestor might clip, or the element's box lies inside the box of every
   one that might (the edges as now, with the pixel of tolerance), and none of them has a `clip-path`.
   Nothing can cut what lies inside every box that could cut it. The check passes without asking further.
4. **Otherwise the browser is asked**, because only it knows: the element is hit-tested with
   `document.elementsFromPoint` at five points of its box — the centre, and the middle of each edge moved
   one pixel inwards (half the side when the side is under two pixels). A point is hit when the list holds
   the element or one of its descendants. `elementsFromPoint` lists what lies under a point however it is
   covered, and never lists what was clipped away.
   - every point hit → not clipped: pass.
   - a point not hit → failed, `it is clipped by <the first ancestor of step 2 whose box it lies outside,
     or the one with the clip-path>`.
5. **When the browser cannot be asked,** the result is a failed check whose message begins
   `cannot be told:` and says why — never a guess:
   - the element's computed `pointer-events` is `none`, or it sits in an `inert` subtree, or a modal
     dialog is open and the element is not inside it (hit-testing passes over all three);
   - the page is scrolled and the element's box as it stands now is not inside the window (the points
     would lie outside it). The message says to measure at the top of the page.
   Step 5 is reached only from step 4; an element that is clearly not clipped never gets there.
6. An element whose box is several boxes (an inline element wrapped over lines): the centre of each of
   its first eight client boxes is hit-tested instead of the five points.

The header says, in a few lines, what `in-viewport` measures and that it asks the browser when a box
might be cut.

**Tests** (each through the in-page function on a page the test writes; "painted" may be asserted by the
test with its own `elementFromPoint` call so the page and the function are seen to agree):
- stay as they are: N1's fractional cases and the inline `overflow: hidden` ancestor (pass); N2's fixed
  and absolute elements in a static clipper (pass) and in a clipper with `position: relative` /
  `transform` (fail); N6 both ways; N8; round 1's scroller cases.
- new: N10's two pages (the toast, the menu in a query-container card) pass; replace the pinned wrong
  answer at `tests/accept.test.mjs:1593` — `container-type` no longer cuts.
- new: N11's drawer with `translate` and the card with `scale: 0.95` fail; an element 300 px down a 100 px
  `content-visibility: auto` box fails.
- new: N12's chart label fails; a label inside the svg's box passes.
- new: N14's modal dialog passes.
- new: N17's two elements fail.
- new: step 5 — `pointer-events: none` on an element that lies outside a clipper's box gives
  `cannot be told:`; the same element lying inside every box passes (step 3 never asks); an element behind
  an open modal dialog and outside a clipper's box gives `cannot be told:`.
- new: step 6 — a link wrapped over three lines inside a scroller, all of it showing, passes.

## Ruling R105 — N13: `content-visibility` does nothing on an inline box (`:149`)

`<span hidden="until-found">` and `<span style="content-visibility: hidden">` are painted, yet `absent`
passes on both, `visible` fails on both, and their container's text drops them. R102's test of an
element's **own** `content-visibility` applies only when its computed `display` is not `inline`. Tests:
the two spans read as shown by `visible`, `absent`, `text` and by their container's text; R102's block
cases stay.

## The header states what the checks do not ask (ruling R103)

One line each: `visible` means painted with a box — it does not ask whether a clipping box cuts the
element away or whether something covers it (pair it with `in-viewport`); `text` reads the whole string of
a line the browser shows cut with an ellipsis; measure at the top of the page — an element that sticks may
be misjudged after a scroll.

## Deferred — do not fix now

N15 (a rotated clipping box is measured by its bounding box), N16 (`absent` on a `display: contents`
element that shows nothing), `opacity: 0` on a `display: contents` element.

## Rules unchanged

Never kill a process by name, binary path or command-line pattern; no more than three browsers at once;
no `--import` in a test; stage by explicit path; commit on `v2-pipeline`, never push, never amend. The
function still only reads, and still never throws.

Re-run your table of ten product layouts on the new code and report it again, with the function's answer
beside what `elementFromPoint` says at the element's centre.

Commit: `fix: in-viewport asks the browser what it clipped`. Hand-mutate the new conditions. Append
"Fix report — round 3" to `task-7-report.md` and reply with the short status contract.
