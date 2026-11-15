# Task 7 — fix round 5 of 5

Round 4 (`ab01b10`) built R106 as written, and your two concerns are right: R106's corner **rectangle**
is too coarse. It sends to the browser — and so to `cannot be told:` when the element cannot be pointed
at — elements the rounding does not touch:
1. a card whose padding equals its radius, at fractional sizes: the corner comes out 12.03 × 12.10 and a
   child "overlaps" by hundredths;
2. a pill (`border-radius: 999px`), where the capped rectangle is the whole box.

Your `edgesOf` move and the extra cases are accepted.

## Ruling R107 — within a corner region, the curve decides (refines R106)

The rounding removes only what lies outside the corner's **ellipse**, never the whole rectangle. So, for
each rounded corner of an ancestor that might clip, when the element's box overlaps that corner's region:

- Take **P**, the point of the element's box nearest to the ancestor's corner. For the top-left corner:
  `P = (max(element.left, box.left), max(element.top, box.top))`; mirrored for the other three.
- Give it the pixel of tolerance: move P one pixel towards the inside of the box on both axes.
- The ellipse of that corner is centred on the region's inner corner (top-left:
  `cx = box.left + rx`, `cy = box.top + ry`) with radii `rx`, `ry`.
- If P has reached or passed the centre on either axis, or
  `((P.x − cx) / rx)² + ((P.y − cy) / ry)² ≤ 1`, the rounding does not cut the element at this corner:
  as far as this corner goes it is still **clearly not clipped**.
- Otherwise the element intrudes into what the corner cuts away, and the browser is asked (step 4), as in
  round 4.

This is exact for the outer radius: if the nearest point is not cut, no point of the box farther from the
corner is. The clip really follows the padding edge, whose radius is the outer one less the border, so
using the outer radius on the edges already compared can only over-estimate what is cut — it asks the
browser a little more often, never less. Keep that direction in anything you are unsure of: **when in
doubt, ask**.

Tests (through the in-page function, on pages the test writes; assert the page's own `elementFromPoint`
beside the function's answer where an element is asked):
- your concern 1: the 123.33 × 46.39 card, padding 12, radius 12, a child with `pointer-events: none` →
  pass (never asked); the same child `inert` → pass;
- your concern 2: a label with `pointer-events: none` centred in a clipping pill → pass (never asked);
- a child with `pointer-events: none` flush at 8 px in a card with `border-radius: 12px; overflow: hidden`
  and 8 px padding → pass (inside the curve);
- stay as they are from round 4: the dot at the top-right of the round avatar fails as clipped; the image
  filling the avatar passes (it is asked and hit at its five points); the heading at the top of the 12 px
  card passes; the badge deep in the corner fails; the percent radius case agrees with the page;
- an element with `pointer-events: none` deep in the corner of the 12 px card, where it is cut →
  `cannot be told:` (it is asked, and cannot be);
- one case per corner where the nearest point is just outside the curve (asked) and just inside (not
  asked) — the unaskable-child trick tells the two apart: inside passes, outside is `cannot be told:`.

Hand-mutate: the `≤`, the tolerance, each corner's mirroring, `rx` and `ry` swapped, the "reached the
centre" shortcut, and dropping the curve test altogether (concern 1's case must then fail).

## Nothing else

The deferred lists of rounds 1–4 stand. Change only this. The function still only reads and never
throws; the machine's rules are unchanged (never kill by name or pattern; at most three browsers; stage
by explicit path; never push or amend).

Commit: `fix: a rounded corner cuts only what lies outside its curve`, with the same two trailer lines.
Append "Fix report — round 5" to `task-7-report.md` and reply with the short status contract.
