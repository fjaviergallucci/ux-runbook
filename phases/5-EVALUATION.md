# Phase 5 · Evaluation and selection

**Gate: G3 · closed by the human. THE HARD STOP.**
**Produces:** one selected design, logged as a `D-NNN`

---

## The hard stop

No implementation code before this gate closes. Not a component. Not a scaffold. Not the types
"just to get started." Not a branch with the file structure in it.

The reason is not procedural tidiness. It is that written code creates commitment: once a structure
exists, every subsequent design conversation is quietly negotiating against it, and the human ends
up approving the thing that is already half-built rather than the thing they wanted. The gate exists
to keep the design conversation free.

This gate never scales down to nothing. On the smallest task it becomes one sentence and a pause —
but the pause is real. See `reference/FIDELITY-LADDER.md`.

---

## Score against the surface's own criteria first

The success criteria written in Phase 1 are the primary rubric. They are testable sentences about
*this* screen, so start there:

> "Priya identifies every free room in under two seconds without scrolling."
> → Does variant A do this? Variant B? Which one does it worse, and why?

If a variant fails a success criterion, that is close to disqualifying, regardless of how good it
looks. A beautiful screen that fails its own stated job is a failed screen.

---

## Then the five general criteria

| Criterion | The question | The failure it catches |
|---|---|---|
| **Primary goal visibility** | Can the persona find their number-one need within two seconds, without scrolling? | The "everything is equally important" wall of cards |
| **Action clarity** | Is the main action obvious, reachable, and unambiguous? Is the destructive one *not* adjacent to it? | Primary and destructive actions sharing a visual weight |
| **Information hierarchy** | Does the most important information carry the most visual weight — and is the ranking the persona's, not the database's? | Screens laid out in the order the API returns fields |
| **Cognitive load** | Would someone at this persona's technical level feel oriented or overwhelmed on first sight? | Expert-density screens shipped to occasional users |
| **Workflow order** | Does the layout follow the order of their actual day, top to bottom or left to right? | Step 4 above step 1 because it had more data |

Two more that are worth checking explicitly, because they are the ones that get discovered late:

- **State coverage.** Does the design have an answer for the empty, loading, error, and overflow
  states in the surface brief — or does it only work when the data is exactly as pretty as the
  mockup?
- **Degradation.** What does this become at 375px? If the answer is "a different design," that is
  fine — but it needs to be decided now, not improvised in Phase 7.

---

## Presenting for G3

Show the variants side by side, at the same scale, with the same content.

Then, for each one, in plain language:

- **What it optimizes for** — one sentence
- **Where it wins** — against the success criteria, specifically
- **Where it loses** — specifically, and never omit this
- **What it would cost to build** — if one variant is three times the work, that is decision-
  relevant information and withholding it is not neutrality

Then **state your recommendation and your reasoning**, including the one you would not build and
why. You have read the persona and looked at the variants; you have an opinion. A flat "here are
three options, what do you think?" pushes the work back onto the person who asked you to do it.

Then **stop.** Do not present the comparison and begin implementing in the same message. Presenting
and proceeding in one breath is the most common way this gate gets skipped while appearing to have
been honoured.

---

## What "closed" looks like

The human does one of:

- **Names a variant.** Log it, go to Phase 6.
- **Names a variant with modifications.** Now you may be specific — this is the one phase where
  prescribing UI is correct, because a human is directing it: *"take B, move the download action
  above the fold, and use A's status treatment."* Apply, re-render if the change is structural,
  confirm, then log.
- **Rejects all of them.** Valuable. Ask what is wrong with the *closest* one — the answer almost
  always reveals a persona detail that was missing in Phase 1. Go back and fix the input rather than
  generating more variants against the same brief. Four more variants from a wrong brief produce
  four more wrong screens.

**Ambiguity is not approval.** "Looks good" on a message containing three variants is not a
selection. "Nice" is not a selection. Ask which one.

---

## Logging the decision

```
## D-006 · Room board layout — variant B, with A's status treatment
2026-08-24 · Gate G3 · Surface: today

**Decision.** Variant B: free rooms grouped into a leading region, occupied rooms in a
secondary list below. Status chips from variant A (shape plus colour, not colour alone).

**Why.** B is the only variant that answers "which rooms are free right now" without
scanning — it does the filtering for her instead of giving her a filter. A's chips carry
shape as well as colour, which survives both her glance distance and colour blindness.

**Rejected.** Variant A's single unified list (free rooms scatter through it, so she
scans). Variant C's calendar grid (accurate, and unreadable in under two seconds).

**Consequence.** The room list needs a stable sort within each group, or rooms will jump
between regions as bookings end. Carried into Phase 6.
```

That last field — **consequence** — is worth writing whenever a design decision creates an
implementation requirement. It is the detail that gets lost between the gate and the build, and
rediscovered as a bug.
