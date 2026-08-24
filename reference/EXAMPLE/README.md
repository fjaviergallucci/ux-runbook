# Worked example · RoomBoard

A complete run of the method on a deliberately small, deliberately boring product — so the shape is
visible without the domain getting in the way.

**The product.** RoomBoard: treatment-room booking for a small physiotherapy clinic. Four rooms,
six practitioners, one person at the front desk who actually uses it.

**What's here.**

```
PROJECT-CONTEXT.md      filled at G1
personas/priya.md       the persona that drove every decision
surfaces/today.md       the main screen's brief, including all ten states
DESIGN-DECISIONS.md     the log, D-001 through D-007
```

There's no `DESIGN-STATE.md` in the example — it's a status line for a live effort, and a frozen one
would just be a snapshot of a moment.

---

## How the run went

**Phase 0 · G0.** Six of seven capabilities verified. Mockup generation was unavailable, so mockups
were hand-built as single HTML files and served locally. Noted at G0 so the trade was explicit.

**Phase 1 · G1.** The interview took about forty minutes. Two things came out of it that changed
everything downstream, and neither was in the original brief:

- The prior workaround was a **laminated wall chart with a whiteboard marker.** That's the real
  competitor, and it's genuinely good at one thing — you can read it from across the room while
  holding a phone. Any screen that's worse at that loses, regardless of features.
- Priya doesn't browse the schedule. She answers **one question, forty times a day: "is anything
  free right now?"** The product had been specified as a calendar. A calendar answers a different
  question.

That second finding is the whole reason the example exists. It came from Block 1's "what were they
doing before" and Block 3's "what's the bad day," and it would not have come from a feature list.

**Phase 2.** Nothing existed. A minimal token set: two families, a 4px spacing base, both themes,
WCAG 2.2 AA, one accent.

**Phase 3 · G2.** Three directions, deliberately far apart — *Clinical Instrument* (dense,
near-monochrome, one accent), *Warm Ledger* (paper-like, generous, warm greys), *Field Notebook*
(textured, hand-drawn rules, playful). Priya's clinic manager picked Clinical Instrument. The cost
accepted — it's cold, and unwelcoming on first run — was mitigated in the empty state only. Logged
as D-004.

**Phase 4.** Three hand-built variants of the `today` surface. The prompt described Priya and her
ninety seconds; it never named a component. Variant C came back as a calendar grid — accurate,
handsome, and unreadable in under two seconds. Useful precisely because it failed the criterion so
clearly.

**Phase 5 · G3.** Variant B won on the surface's own success criterion: it groups free rooms into a
leading region instead of offering a filter, so the screen does the scanning for her. Variant A's
status chips were grafted on because they carry shape as well as colour. Logged as D-006.

**Phase 6.** Ten states built, not one. The two empty states are different: first-run teaches the
booking action; filtered-to-nothing suggests widening the time range.

**Phase 7 · G4.** Eleven screenshots. Two real findings the code review had missed: at 375px the
room name truncated before the status chip, hiding the one piece of information the screen exists
to show; and in dark mode the "free" and "cleaning" surfaces were within 1.2:1 of each other —
invisible, and precisely the distinction that matters.

**Phase 8 · G5.** Nine findings: two Critical, four Refinement, three Polish. Critical and
Refinement executed; Polish deferred and logged as deferred rather than dropped.

---

## The three things worth stealing

1. **The prior workaround is the real competitor.** A laminated wall chart set the bar: legible at
   four metres, zero interaction. Most of the design followed from taking that seriously instead of
   from looking at what other booking products do.

2. **The persona has to make a decision you wouldn't have made.** "Priya reads this sideways while
   on the phone" produced the density, the type contrast, and the decision to have exactly one
   accent colour meaning exactly one thing. "A busy practice manager" would have produced a card
   grid.

3. **A variant that fails is worth generating.** The calendar grid was the specified design at the
   start of the project. Seeing it fail its own success criterion, next to something that passed,
   ended that conversation in about a minute — and it would have taken a sprint to learn the same
   thing after building it.
