# The fidelity ladder

Running eight phases on a padding fix is malpractice in the other direction. This tells you which
rung a task sits on.

**The rule that does not bend:**

> **What scales with simplicity is the artifact, never the approval.**

You may compress a gate until it is one sentence and a pause. You may never remove it. The reason is
narrow and specific: the gates exist because an AI's confidence is uncorrelated with its correctness,
and the smaller the task, the more confident it is.

---

## The rungs

### Rung 1 · Correction

*A typo. A wrong colour token. A missing label. A value that is obviously wrong.*

- **Design:** none needed — say what you're changing, in one line
- **G3:** "Changing X to Y" → wait for a nod
- **Build:** make the change
- **G4:** one screenshot, one breakpoint, the theme it affects
- **G5:** skipped

*Elapsed: minutes. The nod is still real.*

### Rung 2 · Adjustment

*Moving an element. Changing a state's copy. Adjusting spacing across a section. Swapping a
component for a better-fitting one.*

- **Design:** two or three sentences in chat — what changes, what it affects, what it costs
- **G3:** explicit yes before touching code
- **Build:** normal implementation rules — tokens, states, no guessed APIs
- **G4:** the affected breakpoints and both themes
- **G5:** skipped unless the change was visual-system-wide

*Elapsed: under an hour.*

### Rung 3 · Surface

*A new screen. A redesign of an existing one. A flow that spans two or three screens.*

- **Everything.** Phase 1 partial if `PROJECT-CONTEXT.md` exists (persona + surface brief only),
  Phase 2 read-only if a system exists, Phase 3 skipped if the direction is set.
- All four human gates, in full.

*Elapsed: a session or several.*

### Rung 4 · System

*A new product. A rebrand. A direction change. Anything that touches every screen.*

- **Everything, nothing skipped**, including Phase 2 and Phase 3.
- Expect Phase 1 to take a whole session on its own. That is correct, not slow.

*Elapsed: multiple sessions. Do not compress this one — the cost of a wrong direction is every
screen built on it.*

---

## Choosing the rung

Ask three questions:

1. **Can it be described in one sentence without an "and"?** → Rung 1 or 2.
2. **Does it change what someone can accomplish, or only how it looks?** → Changing capability is at
   least Rung 3.
3. **Would getting it wrong be visible on other screens?** → Rung 4.

**When in doubt, take the heavier rung.** The ratchet is one-way: discovering hidden complexity
mid-task moves you *up*, and you say so when it happens. Nothing moves down mid-task. "It turned out
simpler than I thought" is not a reason to retroactively skip a gate you already passed.

---

## Two failure modes, in both directions

**Over-ceremony.** Eight phases, three variants, and a fourteen-dimension audit for a button colour.
This wastes the human's attention, which is the scarcest resource in the whole method — and it
teaches them that your gates are noise, which is how the ones that matter get waved through.

**Under-ceremony.** "It's just a small change" applied to something that turns out to touch six
screens. This is the more expensive error, and it is nearly always discovered after the code is
written.

The asymmetry is why the ratchet only turns one way.
