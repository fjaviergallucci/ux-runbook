# Design decisions — {PRODUCT NAME}

**Append-only.** Never edit a logged decision — supersede it with a new one that says what it
replaces. Never re-decide something in here; cite it instead.

A decision belongs here if it would otherwise be re-argued later. That includes every gate closure
(G2, G3, G5), every exception to the direction, and every deferral.

---

## D-001 · {SHORT TITLE — THE DECISION, NOT THE TOPIC}
{DATE} · Gate {G?} · Surface: {NAME OR "all"}

**Decision.** {WHAT WAS DECIDED, SPECIFICALLY ENOUGH TO IMPLEMENT FROM}

**Why.** {THE REASONING — TIED TO A PERSONA WHERE POSSIBLE. This is the field that stops the
decision being reopened in three weeks.}

**Rejected.** {THE ALTERNATIVES, AND WHAT WAS WRONG WITH EACH}

**Cost, accepted.** {IF A DIRECTION OR TRADE-OFF — THE WEAKNESS TAKEN ON PURPOSE}

**Consequence.** {ANY IMPLEMENTATION REQUIREMENT THIS CREATES. The field that otherwise gets lost
between the gate and the build, and rediscovered as a bug.}

---

## D-002 · {NEXT}
