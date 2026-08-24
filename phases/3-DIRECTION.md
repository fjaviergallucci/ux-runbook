# Phase 3 · Direction

**Gate: G2 · closed by the human.**
**Produces:** a chosen, named direction, logged as a `D-NNN`

---

## What a direction is

A direction is a **committed visual point of view**, named, with a thesis and a cost. It is not a
mood board and it is not a colour scheme. It is the answer to: *what is this interface willing to be
bad at in order to be good at something else?*

Every real design makes that trade. A dense, information-first console is bad at feeling calm. A
generous editorial layout is bad at fitting 400 rows on a screen. A playful direction is bad at
reading authoritative. Choosing means accepting a weakness on purpose.

**The default direction — the one that arrives when nobody chooses — is the average of everything a
model has seen.** Card grid, muted greys, a sans at 1.6 line height, subtle shadow, 8px radius,
indigo accent. It is competent. It is also completely interchangeable, and it is the reason
AI-designed products are recognizable as AI-designed products.

Refusing to choose is itself a choice, and it is the worst available one.

---

## Skip this phase when

- **Mode B, and the direction is already set.** A new surface inherits the product's direction. Cite
  the existing `D-NNN` and go to Phase 4. Only re-open G2 if this surface deliberately breaks the
  established look — a marketing page inside an application, say.
- **The brand is fully prescribed** and the human has no latitude. Then the direction is "the brand,"
  and you say so rather than pretending to offer a choice.

---

## Proposing directions

Offer **two or three**, and they must be genuinely different.

> **Three shades of the same safe idea is not a choice. It is the illusion of one.**

The test: could someone look at all three rendered and immediately tell them apart from across the
room? If not, you have proposed one direction three times, and the human will pick the middle one
because there is nothing else to do.

### The shape of each proposal

Give each direction:

| Element | What it says |
|---|---|
| **Name** | Two or three words that stick. "Clinical Instrument." "Warm Ledger." "Field Notebook." A named direction can be referred to for months; "option B" cannot. |
| **Thesis** | One sentence on what it optimizes for and for whom. Tie it to the persona explicitly. |
| **Colour move** | What the palette does — not the hex values, the *behaviour*. "Near-monochrome, with a single accent reserved for the one action that matters." |
| **Type move** | Family character, scale contrast, density. "One grotesk, heavy contrast between display and body, tight headings." |
| **Layout and density** | Generous or packed. Grid or list. Where the eye lands first. |
| **Motion** | Present and expressive, or minimal and functional, or absent. |
| **What it costs** | **Required.** The weakness accepted on purpose. A direction with no stated cost has not been thought through, and you should not present it. |

### Bias by surface type

- **Application screens** — bias restrained and systematic. People are here to work, repeatedly,
  often under time pressure. Accessibility and legibility outrank expression. Restrained is not the
  same as generic: a restrained direction still commits — to density, to a specific type character,
  to one accent used sparingly.
- **Marketing and landing surfaces** — commit harder. Distinctiveness is the job. This is where a
  strong direction pays for itself, and where the average-of-everything default costs the most.
- **Onboarding and empty states** — sit between the two. More warmth than the working screens, less
  spectacle than the landing page.

---

## Presenting for G2

Show the directions in a form the human can actually judge. In order of preference:

1. **Rendered** — one representative screen per direction, real content, side by side. Best by a
   wide margin. If you have mockup generation, use it here rather than waiting for Phase 4.
2. **A specimen** — palette swatches, the type scale set in real text, a button and an input, per
   direction.
3. **Written only** — the table above. Workable, but people are unreliable at imagining directions
   from prose, and you will get a decision they revise the moment they see it built.

Then **state your recommendation and why.** You have read the persona; you have an opinion; withhold-
ing it is not neutrality, it is abdication. Say which one you would build and what would change your
mind.

Then **stop.**

---

## Closing G2

The human picks one, or asks for a hybrid. A hybrid is fine — write down exactly what it inherits
from each, or it will drift back to the average within three screens.

Log it:

```
## D-004 · Direction: "Clinical Instrument"
2026-08-24 · Gate G2

**Decision.** Near-monochrome surface, single amber accent reserved for state changes
requiring action, dense 4px-base rhythm, one grotesk with heavy display/body contrast,
motion limited to 150ms state transitions.

**Why.** Priya reads this screen sideways while on the phone. Everything that isn't
status is noise; the accent has to mean exactly one thing or it means nothing.

**Cost, accepted.** Cold. Unwelcoming on first run — mitigated in the empty state only.

**Rejected.** "Warm Ledger" (warmth costs contrast she needs at a glance); "Field
Notebook" (texture reads as decoration at this density).
```

Everything downstream inherits this. When a Phase 4 mockup or a Phase 6 component drifts off the
direction, the fix is to name the drift and correct it — not to quietly let the direction erode one
reasonable-looking exception at a time. That erosion is exactly how products end up back at the
average.
