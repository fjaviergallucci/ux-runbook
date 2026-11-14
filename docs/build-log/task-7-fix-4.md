# Task 7 — fix round 4 of 5

The re-review of round 3 (head `e18f572`) found N10, N11, N13, N14, N17 and the header lines addressed
with committed tests, N12 addressed in the code, no escaping throw, no write to the page, and the
hit-test right on twenty ordinary painted shapes. Two things remain for this round. Nothing else.

File: `scripts/inpage/accept-inpage.js` (line numbers at `e18f572`). Tests: `tests/accept.test.mjs`.

## N18 — a rounded clipping box cuts what lies inside its box, and step 3 passes it without asking (`:512`)

The reviewer's probe: a 10 px status dot at the top-right of a 40 px avatar with
`border-radius: 50%; overflow: hidden`. The browser does not list the dot at its centre (it is cut away),
and `in-viewport` passes. `border-radius` with `overflow: hidden` is the commonest clipping pair in a
product. An image filling the avatar, and the head of a card with a 12 px radius, are both listed at
their centres by the browser, so asking is safe for ordinary shapes.

**Ruling R106.** Step 3 of ruling R104 ("clearly not clipped": the element's box lies inside the box of
every ancestor that might clip) gains one more condition, beside the `clip-path` one. For each ancestor
that might clip and has a corner radius: if the element's box overlaps that corner's region — the
rectangle at the corner that is as wide as the corner's horizontal radius and as high as its vertical
radius — the element is **not** clearly inside, and the browser is asked (step 4), exactly as for a
`clip-path`. An element that touches no corner region of any rounded ancestor is still clearly not
clipped: rounding removes nothing outside those rectangles.
- The four radii are read from the computed `border-top-left-radius`, `border-top-right-radius`,
  `border-bottom-right-radius`, `border-bottom-left-radius`. A computed value is one or two lengths, each
  in `px` or `%` (horizontal then vertical; one value means both); a percentage is of the box's width
  (horizontal) or height (vertical). Each radius is capped at the box's own width or height. An
  over-estimate is harmless — it only asks the browser more often; an under-estimate is the wrong pass.
  A value that cannot be read counts as the whole box.
- The regions are in the same coordinates as the edges already compared in step 3 (the scaled box the
  code already computes).
- When step 4 then misses a point, the message names that rounded ancestor, as it does for `clip-path`.

Tests (through the in-page function, on a page the test writes; assert what the page paints with the
test's own `elementFromPoint` beside the function's answer):
- the dot at the top-right of the round avatar → failed, `it is clipped by …` naming the avatar;
- an image that fills the same avatar → pass;
- a heading at the top of a card with `border-radius: 12px; overflow: hidden` → pass;
- a paragraph in the middle of that card, with `pointer-events: none` → pass (it touches no corner
  region, so step 3 never asks; without the region test it would be `cannot be told:`);
- a small badge wholly inside the 12 px corner of that card, far enough into the corner to be cut →
  failed;
- a radius given in percent (`50% / 20%`) on a wide box: an element in the corner region → asked (it
  fails or passes as the page paints it — assert agreement with `elementFromPoint` at its five points).

## N23 — N12's committed case does not pin the inline svg (`tests/accept.test.mjs:1755`)

The case sets `display: block` on the svg, a shape round 2's code already cut, so it does not fail
without the fix. Drop `display: block` from the case (or add a second case with the svg left inline) so
that a label outside an **inline** `<svg>` is pinned as clipped.

## Deferred — do not fix

N19 (a wrapped inline target is asked only at the centres of its first eight lines), N20 (two modal
dialogs open at once), N21 (a stroke-only svg ring, a `tbody` with `border-spacing`, a rotated target —
each missed at a point), N22 (`content-visibility` on a table row), and everything deferred in earlier
rounds.

## Proof

- Each new condition has a committed test that fails without it. Hand-mutate: drop the region test
  (the `pointer-events: none` paragraph must then fail), drop each corner in turn, swap horizontal and
  vertical radius, drop the percentage branch, drop the cap.
- Run `node --test tests/accept.test.mjs` while iterating and `npm test` once at the end (about three
  minutes; one file at a time). All of it stays green: 412 tests before this round, 411 pass, 1 skipped.
- The function still only reads, and still never throws.
