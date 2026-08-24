# Surface · {NAME}

*Filled in Phase 1. One file per screen.*

**Its one job.** {A SINGLE SENTENCE. If it needs two, it may be two screens.}

**Persona.** {WHO THIS IS DESIGNED FOR — one persona per surface, not all of them}

**Roles that reach it.** {WHICH ROLES · AND WHAT EACH SEES DIFFERENTLY}

**Entry points.** {HOW THEY GET HERE, AND WHAT THEY WERE DOING IMMEDIATELY BEFORE}

**Exit points.** {WHERE THEY GO NEXT, AND WHAT THEY CARRY WITH THEM}

---

## Available data

*Data types, never components. "Booking status, room name, time range, occupant" — not "a status
badge, a room column, a time chip."*

{LIST}

**Slow, expensive, or sometimes missing:** {WHAT — this shapes loading and partial states more than
anything else}

---

## States

*The part everyone skips. Write "N/A — cannot occur because …" rather than omitting a row.*

| State | What it shows |
|---|---|
| Empty — first ever | {WHAT TEACHES THEM THE NEXT ACTION} |
| Empty — filtered to nothing | {DIFFERENT FROM ABOVE. Never the first-run illustration.} |
| Loading — first paint | {SKELETON / SPINNER / OPTIMISTIC} |
| Loading — refreshing | {DON'T BLANK EXISTING CONTENT} |
| Partial | {SOME LOADED, SOME FAILED, SOME PROCESSING} |
| Error — recoverable | {WHAT BROKE + THE RETRY} |
| Error — terminal | {WHAT BROKE + WHAT THEY CAN DO INSTEAD} |
| No permission | {HIDDEN OR EXPLAINED?} |
| Success / confirmation | {WHAT CONFIRMS IT WORKED, AND FOR HOW LONG} |
| Dense / overflow | {500 ROWS · A 90-CHARACTER NAME · A NINE-DIGIT NUMBER} |

---

## Success criteria

*Two or three testable sentences. These become the G3 rubric and the G4 assertions, so they must be
checkable by looking at a screen.*

*The test: could two people disagree about whether it was met? Then sharpen it.*

1. {e.g. "Priya identifies every free room in under two seconds without scrolling."}
2. {}
3. {}

---

## Shell

*What the application shell already provides, and therefore what NOT to design.*

{e.g. "Sidebar ~240px left, top bar 56px, account menu top-right. Design the content region only."}
