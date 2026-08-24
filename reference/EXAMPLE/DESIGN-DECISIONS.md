# Design decisions — RoomBoard

**Append-only.** Never edit an entry — supersede it. Never re-decide something in here; cite it.

---

## D-001 · The product is a room board, not a calendar
2026-08-24 · Gate G1 · Surface: all

**Decision.** The primary surface answers "what is free right now," not "what is the shape of the
week." A week view exists for the owner and is never Priya's landing screen.

**Why.** Priya asks the "right now" question roughly forty times a day and the "shape of the week"
question never. The previous product they bought was a calendar; it was abandoned after three weeks
with the words "it showed me the whole week when I only ever care about the next twenty minutes."

**Rejected.** A calendar with a "now" indicator — still requires her to find the indicator and read
around it, which is the interaction she already rejected once.

**Consequence.** The `week` surface is owner-only and reachable but not prominent. Reversing this
would invalidate D-006 and most of the `today` design.

---

## D-002 · Semantic colour tokens only, both themes defined up front
2026-08-24 · Gate — · Surface: all

**Decision.** Tokens named by role (`--color-surface-free`), never by hue. Light and dark defined
together in Phase 2, before any screen exists.

**Why.** Room status is the entire product. Statuses will be renamed and recoloured over the
product's life; hue-named tokens make that a refactor instead of an edit.

**Consequence.** Every status must exist in both themes with contrast checked at the token pair
level — which caught the dark-mode failure in D-005 before it reached more than one screen.

---

## D-003 · WCAG 2.2 AA, and never colour alone
2026-08-24 · Gate G1 · Surface: all

**Decision.** AA across the product. Every status carries shape or text in addition to colour.

**Why.** One of the six practitioners is red-green colour blind. This came up in the Phase 1
interview as an aside and is the single highest-value thing the interview produced.

**Rejected.** "Colour plus a tooltip" — a tooltip needs a hover, and the whole screen is designed
for a glance from four metres.

---

## D-004 · Direction: "Clinical Instrument"
2026-08-24 · Gate G2 · Surface: all

**Decision.** Near-monochrome surfaces. A single amber accent, reserved for one meaning: this needs
attention now. Dense 4px-base rhythm. One grotesk with heavy contrast between display and body.
Motion limited to 150ms state transitions.

**Why.** Priya reads this screen sideways while on the phone, with someone waiting in front of her.
Anything that is not status is noise. An accent that appears in three places means nothing; an
accent that appears in one means something at a glance.

**Cost, accepted.** Cold. Unwelcoming on first run. Mitigated in the first-run empty state only, and
deliberately not softened anywhere else.

**Rejected.** "Warm Ledger" — warmth costs the contrast she needs at four metres. "Field Notebook" —
texture reads as decoration at this density and competes with status.

---

## D-005 · Free and cleaning surfaces must differ by shape, not only value
2026-08-24 · Gate G4 · Surface: today

**Decision.** In dark mode, free and cleaning rooms are separated by border treatment as well as by
surface value.

**Why.** Phase 7 measured them at 1.2:1 apart in dark mode — invisible, and it is exactly the
distinction the screen exists to communicate. Caught by measuring, not by looking; both looked fine
in the screenshot.

**Consequence.** Supersedes nothing, but tightens D-002: any new status must be checked as a *pair*
against every adjacent status, not only against its own background.

---

## D-006 · Room board layout — variant B, with A's status treatment
2026-08-24 · Gate G3 · Surface: today

**Decision.** Free rooms grouped into a leading region; occupied rooms in a secondary list below.
Status chips from variant A — shape plus colour.

**Why.** B is the only variant that answers "which rooms are free right now" without scanning: it
does the filtering for her rather than offering her a filter. Priya has never used a filter in any
product the clinic has bought.

**Rejected.** Variant A's single unified list — free rooms scatter through it, so she scans.
Variant C's calendar grid — accurate, handsome, and unreadable in under two seconds. C failing its
own success criterion so visibly is what ended the calendar conversation.

**Consequence.** The room list needs a stable sort within each group, or rooms will jump between
regions as bookings end and she will lose her place mid-glance.

---

## D-007 · Status lives on the row, never in a filter bar
2026-08-24 · Gate G3 · Surface: today

**Decision.** Each room carries its own status chip. There is no global status filter anywhere in
the product.

**Why.** A filter costs a click and hides the count she actually wants. The screen should answer the
question, not offer her the tools to answer it herself.

**Rejected.** A filter bar (adds a step to the only path that matters); grouping by status alone
without chips (breaks down entirely at the 12-room contract maximum).

**Consequence.** Room name truncates before status, never after — status is the one thing that must
survive every width. Verified at 375px in Phase 7, where the first implementation had it backwards.

---

## D-008 · Polish-tier audit findings deferred
2026-08-24 · Gate G5 · Surface: today

**Decision.** Three Polish findings deferred: chip corner radius consistency, the 20ms difference
between two transition durations, and optical centring of the room-number glyph.

**Why.** Owner's call — the remaining three surfaces come first. Deferred, not dropped.

**Consequence.** Revisit after `my-day` and `week` reach G5, when the same findings will likely
recur across all three and can be fixed once.
