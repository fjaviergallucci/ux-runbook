# Phase 4 · Mockup

**No gate of its own. Output feeds G3.**
**Produces:** two to four variants per surface, saved to `design/mockups/`

---

## The one principle

> **Describe the user, their workflow, and their frustration. Never describe the UI.**

When you write *"a dashboard with a welcome header, usage stats, a list table, and a download button
per row,"* you have designed the screen. The tool is now a renderer. What comes back is your own
assumption with better spacing — competent, and containing zero design thinking you did not already
have.

When you write *"Sarah produces three to five podcast episodes a week. She opens this first thing in
the morning to find out what finished overnight, downloads the subtitle files, and starts today's
uploads. Her actual daily frustration is that nothing tells her when something is ready, so she
refreshes,"* the tool has a problem to solve. It may put finished work at the top in its own region.
It may add a countdown to the things about to expire. It may collapse upload into a floating action
because it is the second thing she does, not the first. Those are design decisions, and none of them
were yours.

This principle costs you control, which is the point. If you already knew the right layout, you did
not need a mockup phase.

---

## Prompt structure

Four blocks, in this order.

```
PERSONA
  Who they are — name, role, context.
  Their daily workflow, in order, two or three sentences.
  Their specific frustration, one or two lines. Concrete, not "it's slow."
  What they need most — the single primary goal.

CONSTRAINTS
  Environment: where they are, what device, how much attention they have.
  Technical comfort: basic / moderate / expert.
  Frequency: constantly / a few times a day / weekly / once.
  Language and locale, if it affects text length.

AVAILABLE DATA
  The data types this screen can show — never the components that would show them.
  "Booking status, room name, time range, occupant, recurring flag, cleaning state."

SCOPE
  What the app shell already provides — navigation, header, footer — and therefore
  what NOT to design.
  Which viewport to design for first.
```

### The scope block matters more than it looks

Almost every application screen lives inside a shell that already exists: sidebar, top bar, footer,
account menu. If you do not exclude them, the tool will invent its own — and you will get a beautiful
mockup with a navigation pattern the product does not have, which then quietly contaminates the
implementation.

State it plainly: *"Design only the main content region. Navigation, header, and footer are provided
by the application shell and are not part of this design. Assume roughly 240px of sidebar to the
left and a 56px bar above."*

For marketing pages there is no shell, so design the whole page.

---

## What to leave out of the prompt

| Do not include | Because |
|---|---|
| Component names — "stat cards", "data table", "sidebar" | Pre-decides the design. This is the whole failure mode. |
| Layout instructions — "grid", "bento", "split view", "two columns" | Same, one level up. Layout is the tool's job. |
| Named visual styles — "glassmorphism", "neumorphic", "brutalist" | The direction from G2 governs style. Restating it as a style keyword produces a caricature of it. |
| Specific colours and fonts | If the tool supports a persistent design system, encode the direction there once. Otherwise describe the *feeling* the direction targets, not the values. |
| Shell chrome, for app screens | See above. |

**Encode the direction as a design system, not as adjectives in every prompt.** Most mockup tools
support defining tokens once — colour mode, primary colour, heading and body families, radius, scale
— and applying them to every generated screen. Do that at the start of the project. It is the
difference between four variants of one product and four variants of four products.

---

## Prompt templates

### Template A · Persona-driven screen

Use for any surface where a single person has a recurring job to do.

```
Design the main content area of a screen for {NAME}, a {ROLE} who {ONE-LINE CONTEXT}.

Daily workflow:
{TWO OR THREE SENTENCES, IN THE ORDER THEY HAPPEN}

Their biggest frustration:
{ONE OR TWO SENTENCES — SPECIFIC AND CONCRETE}

What they need to accomplish, in priority order:
1. {PRIMARY GOAL}
2. {SECOND}
3. {THIRD}

Context:
- Environment: {WHERE, WHAT DEVICE, HOW MUCH ATTENTION}
- Technical level: {BASIC / MODERATE / EXPERT}
- They open this {FREQUENCY}

Available information: {DATA TYPES, COMMA SEPARATED — NOT COMPONENTS}

Scope: design only the main content region. Navigation, header and footer are provided
by the application shell. Design for desktop first.
```

### Template B · Workflow-driven screen

Use when the screen is a process rather than a place — a wizard, a submission flow, a review queue.

```
Design a screen that supports this workflow, in this order:

1. {WHAT THEY DO FIRST}
2. {THEN}
3. {THEN}
4. {WHAT THEY WAIT FOR OR MONITOR}
5. {THE FINAL ACTION}

The person doing this is a {ROLE} who {BRIEF CONTEXT}. They are {TECHNICAL LEVEL} and
they do this {FREQUENCY}.

Where it goes wrong today: {THE FAILURE OR ABANDONMENT POINT}

The screen has access to: {DATA TYPES}

Scope: {SHELL EXCLUSION}. Design for desktop first.
```

### Template C · Problem-driven redesign

Use in Mode C, when a screen exists and is wrong. Describe the *problem*, never the fix.

```
The current screen for {ROLE} has this problem: {THE UX PROBLEM — NOT THE UI CHANGE
YOU HAVE IN MIND}.

What people actually say about it: "{QUOTE OR CLOSE PARAPHRASE}"

Their underlying need, reframed: {THE NEED, NOT THE FEATURE REQUEST}

Data available that could help: {DATA TYPES, INCLUDING ANYTHING CURRENTLY UNUSED}

Constraints that cannot change: {WHAT IS FIXED}

Redesign this screen to solve the underlying problem.
```

If you catch yourself writing "move the button to the top" into Template C, stop. That is the fix,
not the problem. The problem is "the action they take ninety percent of the time is below the fold."

---

## Generating variants

**One mockup is a proposal. Three is a choice.** Generate two to four, and push the exploration
range wide — the value is in seeing an approach you would not have proposed, and a narrow range just
gives you the same screen with different padding.

Then generate the mobile treatment of the leading candidates. Not "check it's responsive" — the
mobile version of a dense screen is frequently a different design, and finding that out at G3 costs
minutes, while finding it out in Phase 7 costs a rebuild.

Save everything to `design/mockups/` as `<surface>-<variant>.<ext>` and keep the prompt alongside
it. In three weeks nobody will remember which prompt produced which screen, and the prompt is the
more valuable half.

---

## Working without a generation tool

Write the mockup by hand: one HTML file, inline styles, real content, no framework, no build step.
Serve it locally and look at it.

It is slower and cruder, and it still works, because the job of this phase is not to produce art —
it is to put something concrete in front of the human before G3 so that the conversation is about a
thing rather than about a description. A rough hand-built page does that. A paragraph describing a
layout does not.

**Do not skip the mockup because the tool is missing.** Skipping it moves the entire design
conversation into Phase 6, where every change costs real code.

---

## Practical notes

- **Generation is slow** — a minute to five per screen. Do not retry on timeout; poll for the
  result. Retrying orphans the first generation and burns quota.
- **The output is a picture, not code.** However clean the markup looks, it is static HTML with
  invented content and a styling system that is not yours. Phase 6 translates it. Pasting it is how
  a codebase acquires a second, undocumented set of styles.
- **Real content, always.** Mockups with "Lorem ipsum" and "John Doe" hide every layout problem that
  matters — the 90-character name, the empty description, the nine-digit number. Use plausible worst
  cases from the real domain.
