# Phase 1 · Discovery — inputs locked

**Gate: G1 · closed by the human.**
**Produces:** `design/PROJECT-CONTEXT.md`, `design/personas/*.md`, `design/surfaces/*.md`

---

## Why this phase exists

Every downstream phase reads from what you write here. The mockup prompt is built from a persona.
The evaluation rubric is built from success criteria. The QA assertions in Phase 7 are those same
success criteria, checked in a browser. If this phase is thin, everything after it is decoration.

It is also the phase that separates a design from a template. An AI given "build a dashboard"
produces the dashboard it has seen ten thousand times. An AI given "Priya has ninety seconds between
a phone call and the next walk-in, and she needs to know which rooms are free *right now*" produces
something else entirely.

**Run this as an interview, one question at a time.** Twelve questions in one message gets four
answered and three misread. Ask, listen, follow the interesting thread, then ask the next one.

**If `design/PROJECT-CONTEXT.md` already exists, read it and skip to Block 5.** Mode B (a new
surface in an existing product) needs a persona and a surface brief, not a re-interview.

---

## Block 1 · Product frame

Three questions. Do not accept a marketing sentence for the first one.

1. **"In one sentence, what does this do — the way you'd say it to a friend, not to an investor?"**
   If the answer contains the word "platform" or "solution," ask again.
2. **"Who pays for it, and what were they doing before?"** The prior workaround is the real
   competitor, and it is usually a spreadsheet, a WhatsApp group, or a paper notebook. Design
   against that, not against a funded competitor's website.
3. **"What does 'this is working' look like six months in?"** You are listening for the metric they
   actually care about. It is rarely the one on the pitch deck.

Write the answers verbatim-ish. Their phrasing is more useful than your summary of it.

---

## Block 2 · Roles versus personas

Enforce this distinction, because conflating the two is how screens end up serving nobody.

> A **role** is a permission set. A **persona** is a human being having a specific day.

Roles scope the application: who can see this, who can edit it, who gets billed. Personas scope a
screen: whose problem does *this* layout solve.

They are not the same axis. One role can hold three personas — an admin setting the system up for
the first time, an admin doing the weekly routine, and an admin at 6pm on the day something broke —
and those three want visibly different screens. Conversely, one persona may span two roles.

Ask:
- **"List every kind of person who logs in, and what each is allowed to do."** → roles
- **"Which of those has the hardest time, and why?"** → your first persona, and usually the one
  worth designing for first

---

## Block 3 · Persona construction

Build one persona per primary surface. Two or three total for a small product; do not build eight.

Use `templates/PERSONA.md`. Every field is load-bearing:

| Field | What you are actually extracting |
|---|---|
| **Name and role** | Something to say out loud in later phases. "What would Priya do here?" is a working design tool; "what would the user do" is not. |
| **Context** | Where they are, on what device, with how much attention. A clinic front desk with a queue is a different design problem from a home office. |
| **Daily workflow** | Two or three sentences, in order. This becomes visual hierarchy — the screen should follow the order of their day. |
| **Frustration** | One or two specific, concrete pains. Not "it's slow." Something like: "she refreshes the page eleven times because nothing tells her when it's ready." |
| **Primary goal** | The one thing. If they could do only one thing on this screen, this is it, and it gets the most visual weight. |
| **Tech comfort** | Sets complexity, density, and how much you may assume. |
| **Frequency** | Constantly / a few times a day / weekly / once. Once-a-month screens need labels; constant screens need speed and can drop them. |
| **What they never do** | Underused and valuable. Everything they never do is a candidate for the overflow menu. |

### The quality bar

> **If the persona cannot produce a surprising design decision, it is not finished.**

Test it before you move on. Take the persona and ask: *what does this tell me to do that I would not
have done anyway?* If the answer is "nothing," you have written a demographic, not a persona. Go
back and get more specific about the bad day.

A finished persona sounds like: *"She is scanning for the two rooms that just freed up, in the
ninety seconds before the next walk-in, on a screen she is looking at sideways because she is also
on the phone."* That sentence has design decisions in it — size, contrast, what is on top, what can
be dropped.

An unfinished one sounds like: *"A busy office manager who values efficiency."*

### Where to get the material

- **Ask the human.** They usually know a real person and will describe them accurately once you ask
  about a specific bad day rather than about "users."
- **The prior workaround.** How they do it today, in the spreadsheet, reveals the real workflow
  order.
- **Support tickets, sales calls, existing analytics** if any exist.
- **Do not invent from domain stereotype.** A fabricated persona produces a fabricated design and
  nobody notices until it ships.

---

## Block 4 · Jobs and expectations

For each persona, list the jobs they come to the product to get done, **in priority order**, and
what they expect to happen for each.

This list is the source of visual hierarchy. Job #1 gets the most weight, the best position, and the
shortest path. Job #5 can live behind a menu. If everything is job #1, the screen will be a wall of
equally-weighted cards — which is the specific failure this block prevents.

Ask: **"If they could only do one thing here before being interrupted, what is it?"**

---

## Block 5 · Surface inventory

Every screen, listed. Use `templates/SURFACE-BRIEF.md`, one file per surface.

For each: its **one job** in a single sentence, which persona it serves, which roles reach it, what
data it has, and — the part everyone skips —

### All of its states

This is where designs die. List them explicitly, for every surface:

| State | The question it answers |
|---|---|
| **Empty — first ever** | A new account, nothing here yet. What teaches them what to do? This is your best onboarding surface and it is usually an afterthought. |
| **Empty — filtered to nothing** | Different from the above. They have data; this view has none. Never show the first-run illustration here. |
| **Loading — first paint** | Skeleton, spinner, or optimistic content? |
| **Loading — refreshing** | Existing content is on screen and being updated. Do not blank it out. |
| **Partial** | Some of it loaded, some failed, or some is still processing. Very common; very commonly unhandled. |
| **Error — recoverable** | What broke, and the button that retries it. |
| **Error — terminal** | What broke, and what they can do instead. |
| **No permission** | They reached it and may not see it. Is it hidden or explained? |
| **Success / confirmation** | What tells them it worked, and how long it stays. |
| **Dense / overflow** | 500 rows. A 90-character name. A number with nine digits. Layouts break at the edges, not in the middle. |

If a state genuinely cannot occur, write "N/A — cannot occur because …" rather than omitting it.
Omission is indistinguishable from oversight three weeks later.

---

## Block 6 · Available data

List the **data types** the surface can show — never the components that would show them.

> "Booking status, room name, start and end time, occupant name, recurring flag, cleaning status."

not

> "A status badge, a room column, a time range chip, and an avatar."

This distinction is the same one that governs mockup prompting in Phase 4, and it matters for the
same reason: naming components pre-decides the design. Naming data leaves the design open.

Note anything expensive, slow, or occasionally missing — that shapes loading and partial states more
than anything else.

---

## Block 7 · Success criteria

For each surface, two or three **testable sentences**. These become the evaluation rubric at G3 and
the QA assertions at G4, so they must be checkable by looking at a screen.

Good:
- "Priya identifies every free room in under two seconds without scrolling."
- "A first-time user starts their first booking without reading anything."
- "The cleaning status of a room is legible from two metres away."

Useless:
- "The screen is intuitive."
- "Users feel confident."

The test for a criterion: **could two people disagree about whether it was met?** If yes, sharpen it
until they couldn't.

---

## Block 8 · Constraints

Everything already decided, so nothing gets re-litigated in Phase 3.

- **Stack** — framework, component library, styling system, versions
- **Brand** — existing colours, type, logo, voice. If there is a brand, Phase 2 reads it rather than
  inventing one.
- **Accessibility target** — WCAG 2.2 AA is the sane default. Ask; do not assume the answer is "we
  don't care," and do not assume it is AAA either.
- **Locales and text expansion** — if the product ships in more than one language, layouts must
  survive strings 40% longer. Decide now, not after the German translation arrives.
- **Devices and breakpoints** — the real ones, from analytics if they exist.
- **Anything already tried and rejected** — the most valuable answer in the whole interview, and the
  one nobody volunteers. Ask for it directly.

---

## Closing G1

Write everything to the three artifact types. Then present a summary back — the product frame in a
sentence, each persona in two lines, the surface list, and the success criteria — and **stop**.

The human closes this gate. What you are asking is: *"Is this who we are designing for?"*

Expect corrections. Personas are usually wrong on the first pass in an interesting way, and the
correction is the most valuable thing you will get in this phase. Log any decision that emerges as a
`D-NNN`.

Do not begin Phase 2 until they confirm.
