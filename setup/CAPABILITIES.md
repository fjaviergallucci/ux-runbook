# Capabilities

*Read during Phase 0. This file describes **what you need to be able to do**. For the concrete tools
that provide each capability today, and how to install them, read `TOOL-ADAPTERS.md` next.*

The split is deliberate. Tools are renamed, deprecated, and replaced every few months. Capabilities
have been stable for a decade. Write the method against capabilities and you edit one file when the
landscape shifts instead of rewriting everything.

---

## The seven

| # | Capability | What it buys you | Mandatory |
|---|---|---|---|
| 1 | Aesthetic direction | A committed visual point of view instead of the safe default | No |
| 2 | Design data | Palettes, font pairings, style vocabulary, chart types | No |
| 3 | Mockup generation | Seeing the screen before building it | No |
| 4 | Component truth | The real API of the components in this project | No |
| 5 | **Browser feedback loop** | **Seeing what you actually built** | **Yes** |
| 6 | Systematic audit | Catching what iteration goes blind to | No |
| 7 | Typography enforcement | The details every model gets wrong | No |

---

## 1 · Aesthetic direction

**What it is.** A process that forces purpose, audience, and a *named* visual direction before any
code is written, and then commits to it.

**Why it matters.** Left alone, every model converges on the same interface: a card grid, a muted
palette, a sans-serif with generous line height, and a subtle shadow. It is competent and it is
forgettable. The value here is not the tool's taste — it is the refusal to average.

**Fallback without a tool.** Write a direction brief by hand. Name the direction. State its thesis
in one sentence, its palette move, its type move, its density, its motion, and what it costs. That
is 90% of what the tool does; the tool just makes you do it.

**How G0 verifies it.** Invoke it once on a throwaway prompt and confirm it returns a direction, not
a component list.

---

## 2 · Design data

**What it is.** Searchable reference for style families, colour palettes, font pairings, chart
types, and UX patterns.

**Why it matters.** Direction supplies the judgment; this supplies the raw material. Asked for "a
warm editorial pairing," a model will produce a plausible-sounding pair it has never seen rendered
together. A reference set has been rendered.

**Fallback.** Any curated public source of pairings and palettes. Established type foundries publish
pairing guides; palette tools publish accessible ramps. Slower, works fine.

**How G0 verifies it.** Ask it for three font pairings for a stated mood; confirm you get specific
named families with a rationale.

---

## 3 · Mockup generation

**What it is.** Turning a written persona-driven brief into a rendered screen you can look at,
usually as HTML or an image, with variants.

**Why it matters.** It is far cheaper to reject a layout in a mockup than in a built component. It
also breaks your own preconceptions: given a persona rather than a component list, a generation tool
will sometimes solve the problem in a shape you would not have proposed.

**Fallback.** Write a static HTML mockup by hand and serve it locally — one file, inline styles,
real content. Cruder and slower, but it still puts something in front of the human before G3, which
is the entire point. Do not skip the mockup step just because you lack the tool.

**How G0 verifies it.** Generate one throwaway screen end-to-end and retrieve its output.

---

## 4 · Component truth

**What it is.** Access to the real, current interface of the components in *this* project — props,
types, composition patterns, and the correct install command.

**Why it matters.** This is the single most reliable source of AI-generated bugs. Component
libraries rename props, change composition patterns, and swap primitives between majors. Your
training data is a snapshot; the project is not. Guessing produces code that looks right, compiles
sometimes, and behaves wrong.

**Fallback.** Read the installed source in `node_modules` or the vendored component directory. It is
always right and always current — it is just less convenient. There is no excuse for guessing.

**How G0 verifies it.** Fetch one component's interface and confirm the props match what is actually
installed.

---

## 5 · Browser feedback loop — MANDATORY

**What it is.** A real browser the AI can drive: navigate, read the accessibility tree, screenshot,
resize, read the console, run JavaScript in the page, and click and type to reach states.

**Why it is the one that matters.** Without it you are designing blind. You write plausible markup,
never see it render, and hand the human a screen that is broken in a way you could have caught in
ten seconds by looking. Every other capability here is an accelerator. This one is the difference
between designing and guessing.

It is also what makes fidelity possible at all. Adjectives ("a little tighter") do not converge.
Reading the computed values and fixing against numbers converges in three to five passes.

**Fallback.** There is no good one. Degraded options, in order:
- The human screenshots each iteration and pastes it back. Slow, but it closes the loop.
- The human reports what is wrong in words. Very slow, and fidelity work becomes impractical.

If neither is available, **say so plainly before Phase 6** and let the human decide whether to
proceed. Do not quietly build blind and present the result as verified.

**How G0 verifies it.** Navigate to any page and take one screenshot. If that works, you have it.

---

## 6 · Systematic audit

**What it is.** A structured pass across fourteen visual dimensions — hierarchy, spacing,
typography, colour, alignment, components, iconography, motion, empty states, loading states, error
states, dark mode, density, responsiveness — producing a plan ordered Critical → Refinement →
Polish.

**Why it matters.** Iteration goes blind. After the fifth pass on a screen you stop seeing it. A
checklist you did not write is the cheapest way to recover fresh eyes.

**Fallback.** The fourteen dimensions are listed in `phases/8-AUDIT.md`. Walk them by hand. The list
is most of the value.

**How G0 verifies it.** Invoke on any existing screen and confirm it returns findings grouped by
severity.

---

## 7 · Typography enforcement

**What it is.** Automatic correction of the typographic details models get wrong in generated UI
text: quote marks, dashes, ellipses, spacing after punctuation, emphasis, letterspacing on caps,
line length, font count.

**Why it matters.** These are invisible individually and unmistakable in aggregate. Straight quotes
and hyphens-as-dashes are the visual signature of generated text, and no amount of good layout
compensates.

**Fallback.** The rules are short enough to hold in your head: curly quotes and apostrophes; em dash
for breaks, en dash for ranges; a real ellipsis character; one space after a period; bold *or*
italic, never both; letterspace all-caps; keep body measure between 45 and 90 characters; at most
two families.

**How G0 verifies it.** Generate a paragraph of UI copy and check the punctuation characters.

---

## Recording the result

At the end of Phase 0, write this into `design/DESIGN-STATE.md`:

```
## Capabilities (verified 2026-08-24)
1. Aesthetic direction  ✓ <tool>
2. Design data          ✓ <tool>
3. Mockup generation    ✗ absent — fallback: hand-written HTML mockups
4. Component truth      ✓ <tool>
5. Browser loop         ✓ <tool>          ← mandatory
6. Systematic audit     ✓ <tool>
7. Typography           ✓ <tool>
```

A capability is `✓` only when a live call returned real output. "Installed" is not verified.
"Configured correctly" is not verified. A returned result is verified.
