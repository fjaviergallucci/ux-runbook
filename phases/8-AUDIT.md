# Phase 8 · Design audit

**Gate: G5 · closed by the human.**
**Produces:** a phased plan, approved, then executed

---

## Why a checklist you did not write

Iteration goes blind. After the fifth pass on a screen you have stopped seeing it — you see what you
intended, and your attention slides over everything you have already looked at. This is not a
discipline problem; it is how attention works.

A fixed list of dimensions, applied mechanically, is the cheapest way to recover fresh eyes. The
list below is worth more than any tool that runs it.

**Also usable as an entry point.** In Mode C — redesigning something that already exists — run this
phase *first*, before Phase 1. The findings become the problem statement, and you arrive at
discovery already knowing what is broken.

---

## Scope

**Visual only.** This phase never touches logic, state, data fetching, or API contracts. If the
audit surfaces a functional bug, note it and hand it over as a separate item — do not fix it here,
where it will be reviewed as a design change and slip through unexamined.

---

## The fourteen dimensions

Walk them in order, with real screenshots from Phase 7 in front of you — not from reading the code.
Code review and visual audit catch different things.

| # | Dimension | What you are looking for |
|---|---|---|
| 1 | **Visual hierarchy** | Does the eye land on the primary action or information first? Squint at the screenshot until it blurs: what still stands out is the actual hierarchy, whatever you intended. |
| 2 | **Spacing and rhythm** | Every gap on the scale from Phase 2? Related things closer than unrelated things? Is the vertical rhythm consistent between sections, or does each one have its own margin? |
| 3 | **Typography** | Scale steps used as defined, or arbitrary sizes creeping in? Body measure between 45 and 90 characters? Line height appropriate per step? Curly quotes, proper dashes, real ellipses? |
| 4 | **Colour** | Semantic tokens only, no raw values? Contrast measured, not assumed? Is the accent still rare enough to mean something, or has it spread until it means nothing? |
| 5 | **Alignment and grid** | Do elements share edges? Is anything off by a pixel or two — nudged into place rather than placed by the system? |
| 6 | **Components** | Same thing looking the same everywhere? Or three button variants that differ by accident, two card treatments, two different empty-state layouts? |
| 7 | **Iconography** | One family, one weight, one optical size? Every icon carrying meaning rather than decoration? Icon-only controls labelled? |
| 8 | **Motion** | Purposeful — communicating a state change or a spatial relationship — or decorative? Consistent durations from the token set? Reduced-motion path honoured? |
| 9 | **Empty states** | Both kinds present and different? Does the first-run state teach the next action, rather than just announcing emptiness? |
| 10 | **Loading states** | Reserved space so nothing jumps? Skeletons matching the real content's shape? Refreshing not blanking existing content? |
| 11 | **Error states** | Says what happened, in the user's terms, and what to do next? Recoverable errors offer the recovery? No stack traces, no error codes without an explanation. |
| 12 | **Dark mode** | Every surface, border, shadow, image, and muted text checked in both themes. Not an inversion — a designed second theme. |
| 13 | **Density** | Right for this persona and frequency? A screen used constantly can be denser than one used monthly. Is it consistent within the screen? |
| 14 | **Responsiveness** | Real breakpoints, real content, real worst cases. No horizontal scroll. Targets at least 24px, 44px where touch is primary. Nothing important truncated. |

---

## The phased plan

Group findings by severity. This ordering is the deliverable — an unordered list of forty findings
is not actionable and reads as criticism rather than as work.

**Critical** — actively harms use or excludes people.
Contrast failures. Unreachable or unlabelled controls. Broken layout at a real breakpoint. A
missing state that leaves someone stuck. An error message that does not say what to do.

**Refinement** — visible inconsistency, no harm to function.
Spacing off the scale. Three button variants that should be one. Inconsistent icon weights. Dark
mode surfaces that do not separate.

**Polish** — the last ten percent.
Micro-alignment. Motion timing. Optical adjustments. Typographic detail.

For each finding, write: **where it is, what is wrong, and the specific fix** — referencing tokens,
never hardcoded values. "The card gap is 12px; it should be `--space-4` (16px), matching every other
list on this screen."

---

## Closing G5

**Present the plan and stop.** The human approves phases, not individual findings — usually
"critical and refinement now, polish later," which is a perfectly good answer.

Fixing before approval is not helpfulness. It is scope you added to someone else's work, and it
makes the diff harder to review.

Then execute only what was approved. Findings the human deferred get logged in
`design/DESIGN-DECISIONS.md` as deferred — with the reason if they gave one. They are not dropped,
and they are not silently fixed later either.

After executing, **re-run the Phase 7 loop** on what you changed. An audit fix is a change like any
other, and "it was a small spacing fix" is exactly the class of change that breaks a layout at
375px.
