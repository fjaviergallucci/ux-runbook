# Phase 7 · Browser QA loop

**Gate: G4 · closed by you, on evidence.**
**Produces:** screenshots in `design/shots/`, a clean console, met success criteria

---

## The point

You have written code you believe renders correctly. You have not seen it. Those are different
things, and everything in this phase exists to close that gap before a human has to.

**G4 does not close on your assessment.** It closes on artifacts: images at each breakpoint in each
theme, a console with nothing in it, and each success criterion from the surface brief demonstrably
met. "It should work" is not a gate closure. "It looked fine when I read the code" is not either.

---

## The loop

Run it after implementing any screen. Repeat until it stops finding things.

1. **Start the dev server.** The browser tool does not start it for you. Confirm it is actually
   listening — a blank screenshot is usually a dead server, not a broken layout.
2. **Navigate** to the page.
3. **Read the accessibility tree.** Cheaper than a screenshot, deterministic, and it tells you what
   a screen reader gets: is the heading structure sane, are controls labelled, is the content in a
   sensible order. Do this *before* looking at pixels.
4. **Screenshot.** Now judge the visual: spacing rhythm, weight, alignment, colour.
5. **Read the console.** Every warning. React key warnings, hydration mismatches, failed requests,
   deprecations. A console with noise in it is a screen with problems in it, and "it renders anyway"
   is not a defence.
6. **Resize to 375px and re-capture.** Mobile is not a follow-up. It is where the layout actually
   breaks — overflow, truncation, targets too small to hit, horizontal scroll.
7. **Then 768 and 1440.** Or whatever the project's real breakpoints are.
8. **Switch themes and repeat the visual pass.** Dark mode failures are invisible until you look:
   invisible borders, unreadable muted text, a shadow doing nothing, an image with a baked-in white
   background.
9. **Fix, and re-capture every iteration.** Not at the end. Each fix can break something adjacent,
   and you will not know which one did it if you batch them.

---

## Drive the states, don't assume them

The states you built in Phase 6 are the ones most likely to be wrong, because they are the ones you
never see by loading the page. Reach each one for real:

- **Empty:** clear the data, or point at an account with none.
- **Loading:** throttle the network, or intercept the request and delay it.
- **Error:** block the request, or return a 500. Then check the recoverable and terminal variants
  separately.
- **Overflow:** type a 90-character name into the field. Load the list with 500 rows. Put nine digits
  in the number.
- **Interactive:** open the modal, hover the row, focus the input, expand the menu, submit the form.
  Tab through the whole screen with the keyboard and watch where focus goes — and where it gets
  stuck.

Screenshot each one. A state you have not photographed is a state you have not verified.

---

## Numeric diffs — when fidelity matters

Screenshot-only loops stall. "A bit tighter," "closer to the mockup," "not quite right" — these do
not converge, because neither side is naming a number and each pass is a new guess.

When fidelity to a mockup or a spec matters, **measure**. Run JavaScript in the page and read the
computed values:

```js
const el = document.querySelector('h1');
const cs = getComputedStyle(el);
({
  fontSize: cs.fontSize,
  lineHeight: cs.lineHeight,
  fontWeight: cs.fontWeight,
  letterSpacing: cs.letterSpacing,
  margin: cs.margin,
  color: cs.color,
  rect: el.getBoundingClientRect(),
});
```

Then fix against the delta: *"heading renders at 28px, the spec says 24px; the card gap is 12px and
should be 16px; the muted text is #6b7280 against #111827, which is 4.1:1 and fails."*

Numeric loops converge in three to five passes. Adjective loops do not converge at all.

The same technique settles arguments about spacing rhythm — measure the actual gaps between sections
and check they are all on the scale, rather than eyeballing whether they "feel" consistent.

---

## Accessibility checks that need a browser

The ones you cannot do by reading code:

- **Tab through the entire screen.** Order sensible? Focus visible at every stop? Anything reachable
  that should not be? Anything unreachable that should be?
- **Focus after actions.** Open a modal — does focus enter it and stay trapped? Close it — does focus
  return to the trigger, or to the top of the document?
- **Measured contrast**, on the rendered result, at the real breakpoints. Token-level contrast was
  checked in Phase 2; this catches the places where an overlay, an opacity, or a gradient changed
  the actual pair.
- **Zoom to 200%.** Text should reflow, not clip. This is a common and completely invisible failure.
- **Reduced motion.** Set the preference and confirm animations degrade the way Phase 2 decided —
  rather than either continuing at full strength or vanishing along with the content they were
  animating in.

---

## Closing G4

Assemble the evidence:

```
design/shots/
├── today-1440-light.png
├── today-1440-dark.png
├── today-768-light.png
├── today-375-light.png
├── today-375-dark.png
├── today-empty-1440-light.png
├── today-error-1440-light.png
└── today-overflow-1440-light.png
```

Then state, per success criterion from the surface brief, whether it is met and how you know:

> **"Priya identifies every free room in under two seconds without scrolling."** Met — free rooms
> occupy the leading region above the fold at all three breakpoints; count is visible without
> interaction. Screenshot: `today-1440-light.png`.

Report anything you could not verify, plainly, rather than leaving it out. An unverified criterion
is not a failure; silently presenting it as verified is.

**You close this gate.** The standard is evidence, not confidence — and if the evidence is missing,
the gate is open, however good the screen looks.
