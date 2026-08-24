# Phase 6 · Implementation

**No gate of its own. Output feeds G4.**
**Requires:** G3 closed. If it is not, you are in the wrong phase.

---

## Four rules that prevent most of what goes wrong

### 1 · Never guess a component API

This is the most reliable source of AI-generated bugs, by a wide margin. Component libraries rename
props, change composition patterns, and swap underlying primitives between major versions. Your
training data is a snapshot of some past version; the project is on whatever it is on.

Before writing any component usage you are not certain of, **fetch the real interface** — from the
registry tooling if you have it, or by reading the installed source. Reading `node_modules` is not
beneath you; it is authoritative.

Symptoms of having guessed: a prop that "should" exist, a composition pattern that compiles but
renders nothing, a polymorphism escape hatch under the name it had two majors ago.

### 2 · Tokens, never hardcoded values

Every colour, spacing value, radius, shadow, and duration comes from the system established in
Phase 2. No `#1a1a1a`. No `13px`. No `margin-top: 7px` to nudge something into place.

A hardcoded value is not a small sin. It is a value that will not respond to the theme, will not
respond to a token change, and will be invisible to whoever tries to fix it later. If you genuinely
need a value the system does not have, that is a signal the system is missing a step — add it to the
system, then use it.

### 3 · Build every state in the surface brief

The happy path is the easy quarter of the work. Go back to the surface brief from Phase 1 and build
each state it lists:

- Empty, first-ever — and empty, filtered-to-nothing. They are different and they need different
  content. Never show the first-run illustration to someone whose filter just excluded everything.
- Loading, first paint — and loading, refreshing. Do not blank out content that is already on screen
  to show a spinner.
- Partial: some loaded, some failed, some still processing.
- Error, recoverable — with the retry — and error, terminal, with the alternative.
- No permission.
- Success and confirmation, including how long it persists.
- Overflow: the 90-character name, the 500-row list, the nine-digit number.

If a state was marked "N/A — cannot occur" in the brief, honour that and move on. If it was simply
omitted, go back and ask; do not invent.

### 4 · Translate mockups, never paste them

A generated mockup is a picture of an idea. Its markup is static, its content is invented, and its
styling system is not yours. Read it for layout, hierarchy, spacing rhythm, and treatment — then
build the same thing from the project's components and tokens.

Pasting mockup HTML is how a codebase acquires a second, undocumented styling system that nobody
can find and everybody works around.

---

## Working the way the project already works

Before writing, read three or four existing components in the project and match what you find:
file layout, naming, how state is handled, how data is fetched, how errors surface, how strings are
declared. **Consistency with the surrounding code beats your preferences**, including when your
preferences are better. A codebase with two idioms is worse than a codebase with one mediocre idiom.

If the project has a conventions document, it outranks this file. Say so if they conflict.

---

## Accessibility, built in rather than audited in

Cheaper here by an order of magnitude than in Phase 8.

- **Semantic elements first.** A `button` is a button. A clickable `div` with a click handler is a
  bug with a stylesheet.
- **Labels on every control**, including icon-only buttons — visible text, `aria-label`, or an
  associated `label`.
- **Keyboard reachable, in a sensible order.** Every interactive element. Modals trap focus and
  return it on close.
- **Visible focus**, using the token from Phase 2. Never remove an outline without replacing it.
- **Never colour alone** for status. Shape, icon, or text alongside it.
- **Announce what changes.** Live regions for content that updates without a navigation — a
  completed job, a validation error, a toast.
- **Images:** meaningful ones get alt text, decorative ones get an empty alt.
- **Respect reduced motion**, per the decision from Phase 2.

## Text and copy

- **UI copy is design.** "No results" is not the same as "No rooms are free before 3pm — try
  extending the range." Write real sentences, in the persona's vocabulary.
- **If the product is localized**, every visible string goes through the localization layer in the
  same change that introduces it. Retrofitting strings is tedious and always incomplete.
- **Design for text expansion** if more than one language ships. Assume 40% longer, and never rely
  on a string fitting a fixed-width container.
- **Typographic details:** curly quotes and apostrophes, em dash for breaks, en dash for ranges, a
  real ellipsis character, one space after a period. In JSX and similar templating layers, HTML
  entity escapes do not render inside text nodes — use the real character.

## Performance, at the level that is visible

You are not optimizing here, only avoiding the visible failures:

- **Reserve space for anything that loads.** Images with dimensions, skeletons matching the real
  content's size. Layout that jumps as content arrives reads as broken, and it is the single most
  noticeable performance defect.
- **Do not ship a font that flashes.** Set a display strategy and a real fallback stack.
- **Long lists get virtualized** if the brief says they can be long.
- **Debounce anything that fires on keystroke.**

---

## Before handing off to Phase 7

Run whatever the project's own checks are — type checking, linting, tests, build. A screen that does
not compile cannot be QA'd, and discovering that in the browser wastes a loop.

Then go to Phase 7 and **look at what you built**. You have not verified anything yet. You have
written code you believe is correct, which is a different thing, and the gap between those two is
where the entire value of the next phase lives.
