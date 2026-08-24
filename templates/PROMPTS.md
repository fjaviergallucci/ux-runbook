# Prompts — what you paste at your AI

**These are human → AI prompts.** Copy a block, fill the `{BRACES}`, paste.

Not to be confused with the prompt templates in `phases/4-MOCKUP.md`, which are AI → design-tool
prompts. The AI builds those itself from your personas; you never write them by hand.

> **Add your own.** This file is meant to be edited. If you find a phrasing that works better, or a
> correction you keep having to make, put it here — it will be worth more to you than anything
> pre-written, because it will be about your projects.

---

## Starting

### Kickoff · a brand-new product

```
Read {PATH}/ux-runbook/RUNBOOK.md and run it with me.

Project: {ONE SENTENCE — WHAT IT DOES}
Stack: {FRAMEWORK, COMPONENT LIBRARY, STYLING — OR "not decided yet"}
Mode: A (new product)

Start at Phase 0. Interview me one question at a time — don't send me a
questionnaire.
```

### Kickoff · a new screen in a product that exists

```
Read {PATH}/ux-runbook/RUNBOOK.md. We're in Mode B — the product exists and I want
one more screen: {SCREEN NAME AND WHAT IT'S FOR}.

design/PROJECT-CONTEXT.md is already filled in. Read it, plus the existing design
system, before you ask me anything. Skip to Phase 1 Block 5 — I need a persona and
a surface brief for this screen, not another product interview.
```

### Kickoff · redesigning a screen that's wrong

```
Read {PATH}/ux-runbook/RUNBOOK.md. Mode C — {SCREEN} exists and it isn't working.

What's wrong, in my words: {THE PROBLEM — NOT THE FIX YOU HAVE IN MIND}

Run Phase 8 first as input: audit what's there against the fourteen dimensions and
show me the findings. Those become the problem statement. Then we go to Phase 1.
```

### Resume · a later session

```
Read {PATH}/ux-runbook/RUNBOOK.md, then design/DESIGN-STATE.md.

Tell me which gate closed last, what's in flight, and what's blocked — before you
do anything else.
```

---

## Moving through the gates

### Push for a real choice at G2

```
Those three directions are variations of the same idea. Give me one that's
genuinely different — different density, different type character, willing to be
bad at something the others are good at. And tell me what each one costs.
```

### Ask for a recommendation instead of a menu

```
Don't just lay out the options. Which one would you build, and what would change
your mind?
```

### Approve a design (closes G3)

```
Go with {VARIANT}, but {MODIFICATIONS}.

Log the decision, then implement.
```

### Reject everything without generating more noise

```
None of these work. The closest is {VARIANT}, and what's wrong with it is
{WHAT}.

Don't generate more variants against the same brief — go back to the persona and
tell me what we got wrong about {PERSONA NAME}.
```

### Approve an audit plan (closes G5)

```
Do Critical and Refinement now. Log Polish as deferred — I'll decide on it after
we've built the rest of the screens.
```

---

## Corrections — when the AI drifts

Keep these near. The same four or five drifts recur across every project.

### It described the UI instead of the user

```
You listed components in that mockup prompt. Rewrite it describing only
{PERSONA}, their workflow, their frustration, and the data available — no
component names, no layout instructions, no style keywords.
```

### It skipped a gate

```
Stop. You're writing code and G3 hasn't closed — I haven't picked a design.
Back up, show me the variants, and wait.
```

### It claimed done without looking

```
You haven't shown me a screenshot. G4 closes on evidence, not on your read of the
code. Run the Phase 7 loop: three breakpoints, both themes, console, and every
state in the surface brief.
```

### The persona is generic

```
That persona is a demographic. It doesn't tell you anything you wouldn't have
assumed. What's their bad day? What are they doing in the ninety seconds before
they open this screen? Rewrite it until it makes a design decision for you.
```

### It hardcoded values

```
There are raw values in that component — {EXAMPLES}. Every colour, space, and
radius comes from the token set. If the system is missing a step, add it to the
system first, then use it.
```

### It guessed a component's API

```
Don't guess that interface. Fetch the real one from the registry, or read the
installed source in node_modules. The version here isn't the version you're
remembering.
```

### It only built the happy path

```
The surface brief lists {N} states and you built one. Build empty (both kinds),
loading (both kinds), partial, both error variants, no-permission, and overflow.
Then screenshot each.
```

### It skipped mobile

```
375px isn't a follow-up ticket, it's where the layout actually breaks. Re-run the
loop at 375 and show me what you get before we go further.
```

### It's drifting off the approved direction

```
That's drifting off {DIRECTION NAME} — {WHAT DRIFTED}. Either bring it back to the
direction, or tell me why this surface should break it and we'll log the
exception.
```

---

## Small tasks

### A tweak, without the full ceremony

```
Small one, fidelity rung {1 or 2}: {WHAT}.

Tell me what you're going to change and wait for my ok — then make it and show me
one screenshot. Skip the rest.
```

### Audit an existing screen, no changes

```
Run Phase 8 on {SCREEN}. Findings and a phased plan only. Don't fix anything —
I want to see the list first.
```

---

## Handing the kit to someone else

```
This folder is a design method an AI can run. Point your AI at
ux-runbook/RUNBOOK.md and tell it what you're building — it'll interview you,
propose directions, mock them up, and stop for your approval before it writes any
code.

The stops are the point. Don't wave them through.
```
