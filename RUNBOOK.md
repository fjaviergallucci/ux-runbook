# The UX Runbook

**An AI-executable method for taking a product idea to designed, built, and verified screens.**

You are reading the entry point. If you are an AI, read this file completely before you act.
Everything else in this kit is loaded on demand.

---

## §0 · How to use this file

**This file addresses the AI.** The human who handed it to you wants screens designed and built.
Your job is to run this method with them — not to summarize it back at them.

**Six rules, in force for the whole run:**

1. **Read this file whole; load the rest just-in-time.** Open `phases/N-*.md` when you *enter*
   phase N, not before. Loading everything upfront wastes context and blurs the phase you're in.
2. **Announce your gate before every action.** "Gate 2 — proposing three directions." The human
   should never have to ask where you are.
3. **Four gates are closed by the human, not by you: G1, G2, G3, G5.** You may present. You may
   not proceed. There is no phrasing of "this seems obviously right" that closes a human gate.
4. **Artifacts live in the target project, never in this kit.** This kit is read-only reference.
   See "Where artifacts live" below.
5. **The project's own rules outrank this runbook.** If the target project has a `CLAUDE.md`,
   `AGENTS.md`, a design system, or a house style guide, it wins. Say so out loud when they
   conflict — don't silently pick one.
6. **Log decisions as you go.** See §13. A decision that isn't written down will be re-litigated,
   usually three sessions later, usually differently.

### Where artifacts live

On your first run in a project, create this — in the **target project**, not here:

```
design/
├── PROJECT-CONTEXT.md      Filled once. Every later phase reads it.
├── DESIGN-DECISIONS.md     Append-only log. D-001, D-002, …
├── DESIGN-STATE.md         Where we are. Read first, update last.
├── personas/               One file per persona.
├── surfaces/               One brief per screen.
├── mockups/                Exported mockups, named by surface + variant.
└── shots/                  QA screenshots, named <surface>-<breakpoint>-<theme>.png
```

Copy the starting files from `templates/`. If `design/` already exists, **read it before asking
the human anything** — most of your questions may already be answered in it.

### If you are not Claude Code

The method is tool-agnostic. Concrete tool names, per-AI setup, and fallbacks live in
`setup/TOOL-ADAPTERS.md`. Read that file during Phase 0 and nowhere else.

---

## §1 · The method in one screen

```
   PHASE 0  Setup ─────────────────────────► G0  Capabilities verified       [AI]
   PHASE 1  Discovery ─────────────────────► G1  Inputs locked            [HUMAN]
   PHASE 2  Foundation ────────────────────►     (no gate — feeds G2)
   PHASE 3  Direction ─────────────────────► G2  Direction approved       [HUMAN]
   PHASE 4  Mockup ────────────────────────►     (no gate — feeds G3)
   PHASE 5  Evaluation ────────────────────► G3  Design approved          [HUMAN]
   ═══════ no code may be written above this line — this is the hard stop ═══════
   PHASE 6  Implementation ────────────────►     (no gate — feeds G4)
   PHASE 7  Browser QA loop ───────────────► G4  Build verified              [AI]
   PHASE 8  Design audit ──────────────────► G5  Audit closed            [HUMAN]
```

The two AI-closed gates (G0, G4) close on **evidence**, not on your assessment. G0 closes when a
tool call returned real output. G4 closes when you have screenshots and a clean console — not when
you believe the screen looks right.

---

## §2 · Choose your mode

Ask which situation you're in — or infer it and state your inference so it can be corrected.

| Mode | You're here when | What runs |
|---|---|---|
| **A · New product** | Greenfield. No screens exist. | Everything. Phase 1 in full. |
| **B · New surface** | Product exists, one more screen. | G0 once (skip if verified this session), Phase 1 **partial** (persona + surface brief only — `PROJECT-CONTEXT.md` is already written), Phase 2 skipped (read the existing system), Phase 3 skipped unless this surface deliberately breaks the established direction. G3–G5 in full. |
| **C · Redesign** | A screen exists and is wrong. | G0, then **run Phase 8 first as input** — audit what's there and let the findings become the problem statement. Then Phase 1 partial, Phase 3 optional, G3–G5 in full. |
| **D · Tweak** | One component, one spacing fix, one copy change. | See §3. Not an excuse to skip G3 and G4 — an instruction to make them small. |

**Mode B is the common case** after the first run. Don't re-interview someone who already has a
filled `PROJECT-CONTEXT.md`.

---

## §3 · The fidelity ladder

Running eight phases on a button-padding fix is malpractice in the other direction. The ladder in
`reference/FIDELITY-LADDER.md` tells you which rung a task sits on.

**The rule that does not bend:**

> **What scales with simplicity is the artifact, never the approval.**

A tweak's G3 is one sentence in chat — "I'll move the download button above the fold and drop the
secondary action into the overflow menu, ok?" — followed by a stop. It is still G3. A tweak's G4 is
one screenshot at one breakpoint. It is still G4.

You may compress a gate. You may never skip one.

---

## §4 · Phase 0 → G0 · Setup and capability check

**Read now:** `setup/CAPABILITIES.md`, then `setup/TOOL-ADAPTERS.md`.

You need seven capabilities. Exactly one is mandatory: **the browser feedback loop.** Without it
you are designing blind — you will produce plausible code you have never seen render, and the human
will spend their evening finding out what you got wrong. If it cannot be made to work, say so
plainly and let the human decide whether to proceed anyway.

For each capability: identify the tool, help the human install it, then **verify it with a live
call**. Not "I have configured it" — an actual invocation that returned actual output.

**G0 closes when** every capability is either verified-working or explicitly marked absent with its
fallback chosen. Write the result into `design/DESIGN-STATE.md`. You close this gate yourself, on
evidence.

---

## §5 · Phase 1 → G1 · Discovery — inputs locked

**Read now:** `phases/1-DISCOVERY.md`.

This is the phase most design efforts skip, and skipping it is why AI-generated UI looks
interchangeable. You cannot design for a person you have not met. Everything downstream — the
mockup prompt, the evaluation rubric, the QA assertions — is derived from what you write here.

You will produce, by interviewing the human:

- `PROJECT-CONTEXT.md` — the product frame, roles, constraints, success criteria
- `personas/*.md` — one file per persona, each specific enough to make a design decision *for* you
- `surfaces/*.md` — every screen, its one job, its data, and **all of its states**

Interview **one question at a time**. A wall of twelve questions gets four answered.

**G1 closes when** the human reads the filled context back and confirms it. Present it; then stop.

---

## §6 · Phase 2 · Foundation

**Read now:** `phases/2-FOUNDATION.md`.

If a design system already exists — tokens, a component library, a brand — **read it and stop.**
Do not invent a parallel one. Your output for this phase is a summary of what already binds you.

If nothing exists, establish the minimum: color (light and dark), type scale and pairing, spacing
scale, radius, elevation, motion, and an accessibility target. Small and consistent beats
comprehensive and drifting.

No gate of its own. Its output feeds G2.

---

## §7 · Phase 3 → G2 · Direction

**Read now:** `phases/3-DIRECTION.md`.

Propose **two or three genuinely different aesthetic directions**, each named, each with a thesis
and a stated cost. Three shades of the same safe idea is not a choice — it's the illusion of one.

Bias restrained and systematic for application screens; commit bolder for marketing surfaces. The
*choice of extreme* is the design decision. Refusing to choose produces the generic default that
this entire method exists to avoid.

**G2 closes when** the human picks one. Log it as a `D-NNN`. Everything after this inherits it.

---

## §8 · Phase 4 · Mockup

**Read now:** `phases/4-MOCKUP.md`.

The core prompting principle, which you will be tempted to abandon roughly every time:

> **Describe the user, their workflow, and their frustration. Never describe the UI.**

The moment you write "a table with four stat cards above it," you have designed the screen yourself
and reduced the tool to a renderer. You get your own preconceptions back, rendered nicely. Describe
who is looking at the screen and what they are trying to get done, and let the design tool make
design decisions.

Generate variants. One mockup is a proposal; three is a choice.

---

## §9 · Phase 5 → G3 · Evaluation and selection — THE HARD STOP

**Read now:** `phases/5-EVALUATION.md`.

Score the variants against the surface's own success criteria — the testable sentences from
Phase 1 — plus the five general criteria in the phase file. Present the comparison honestly,
including the one you would not pick and why.

**This is the hard stop.** No implementation code — not a component, not a scaffold, not "just the
types to get started" — before the human has selected a design.

**G3 closes when** the human names a variant or approves modifications to one. Log it.

---

## §10 · Phase 6 · Implementation

**Read now:** `phases/6-IMPLEMENT.md`.

Four rules that catch most of what goes wrong:

1. **Never guess a component API.** Fetch the real interface, or read the installed source. Most
   model training data is a year behind the library in the project.
2. **Tokens, never hardcoded values.** Every color, space, and radius comes from the system
   established in Phase 2.
3. **Build every state in the surface brief** — empty, loading, error, partial, no-permission,
   success. The happy path is the easy quarter of the work.
4. **Translate mockups; never paste them.** Generated HTML is a picture of an idea, not code to
   ship.

---

## §11 · Phase 7 → G4 · Browser QA loop

**Read now:** `phases/7-QA-LOOP.md`.

Open the thing. Look at it. Fix it. Look again.

Structure check, visual check, console check, three breakpoints, both themes, and every interactive
state driven for real. When fidelity to a mockup matters, stop trading adjectives ("a bit tighter")
and measure: read the computed values, compare to the spec, fix against numbers. Numeric loops
converge in three to five passes; adjective loops don't converge.

**G4 closes when** you can show the evidence: screenshots at each breakpoint in each theme, a clean
console, and every success criterion from the surface brief demonstrably met. You close this gate —
on artifacts, not on confidence.

---

## §12 · Phase 8 → G5 · Design audit

**Read now:** `phases/8-AUDIT.md`.

A systematic pass across fourteen dimensions, producing a phased plan: Critical → Refinement →
Polish. The audit is visual scope only — it never touches logic, state, or data.

**G5 closes when** the human approves the plan and the approved phases are executed. Findings you
were told to skip get logged, not silently dropped.

---

## §13 · Decision logging

**Log before you build.** Anything that would otherwise be re-argued later goes in
`design/DESIGN-DECISIONS.md` as an append-only entry:

```
## D-007 · Status lives on the row, not in a filter bar
2026-08-24 · Gate G3 · Surface: library

**Decision.** Each row carries its own status chip; there is no global status filter.

**Why.** Priya scans for "ready to hand over" in under two seconds; a filter costs a click
and hides the count she actually wants.

**Rejected.** A filter bar (adds a step to the primary path); grouping by status (breaks
chronological scanning, which she relies on).
```

Rules: append only — never edit a logged decision, supersede it with a new one that says so.
Never re-decide something already in the log; cite it instead. When the human overrules a logged
decision, that's a new entry, not a quiet edit.

---

## §14 · Resuming a session

**Read `design/DESIGN-STATE.md` first. Update it last.** Every session, without exception.

It answers three questions in under a screen: which gate closed most recently, what is in flight,
and what is blocked. If it's missing, reconstruct it from `DESIGN-DECISIONS.md` and say that you
did — a reconstructed state is a guess until the human confirms it.

Keep it under 40 lines. It is a status line, not a history.

---

## §15 · Red flags

These thoughts mean stop. You are rationalizing.

| The thought | The reality |
|---|---|
| "This screen is simple enough to skip the design gate" | Simple means a two-sentence design, then approval. The gate never scales down to nothing. |
| "I'll scaffold the types while they review the mockup" | Scaffolding is code. G3 has not closed. Wait. |
| "They approved the last screen, so this one's direction is approved" | G2 is per-direction, not per-session. A new surface inherits the direction; it does not inherit G3. |
| "I know what a dashboard looks like" | That is precisely the generic default the method exists to prevent. Read the persona. |
| "The persona is obvious — a busy professional" | If the persona cannot produce a surprising design decision, it is not finished. Go back to Phase 1. |
| "I'll list the components in the mockup prompt to save a round trip" | Then you designed it and the tool only rendered it. Describe the human. |
| "It renders fine, I don't need to screenshot it" | You have not seen it. G4 closes on evidence. |
| "Mobile can come later" | Mobile is where the layout actually fails. It is not a follow-up ticket. |
| "The audit found fourteen things, I'll just fix them" | The plan is approved before it is executed. Fixing is not a favor. |
| "This tool probably works, I configured it correctly" | G0 closes on a live call that returned output. Probably is not verified. |

---

## §16 · File map

| Question | File |
|---|---|
| What tools do I need, and what if I lack one? | `setup/CAPABILITIES.md` |
| How do I install and verify them, on my AI? | `setup/TOOL-ADAPTERS.md` |
| How do I interview for personas and surfaces? | `phases/1-DISCOVERY.md` |
| There is no design system — how do I make one? | `phases/2-FOUNDATION.md` |
| How do I propose an aesthetic direction? | `phases/3-DIRECTION.md` |
| How do I prompt for a mockup? | `phases/4-MOCKUP.md` |
| How do I choose between variants? | `phases/5-EVALUATION.md` |
| How do I build it correctly? | `phases/6-IMPLEMENT.md` |
| How do I verify what I built? | `phases/7-QA-LOOP.md` |
| How do I audit and polish it? | `phases/8-AUDIT.md` |
| What do I paste at my AI to start? | `templates/PROMPTS.md` |
| What does a filled-in run look like? | `reference/EXAMPLE/` |
| When is the full loop overkill? | `reference/FIDELITY-LADDER.md` |
| What should I not do? | `reference/ANTI-PATTERNS.md` |
