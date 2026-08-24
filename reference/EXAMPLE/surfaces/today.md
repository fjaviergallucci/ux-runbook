# Surface · today

**Its one job.** Show Priya what is free right now, and let her put someone in it.

**Persona.** Priya — front desk. Not Dan; he has `my-day`.

**Roles that reach it.** Front desk (full). Owner (full, rarely). Practitioners do not reach it —
they see `my-day`, which omits other practitioners' patient names.

**Entry points.** It is already open. She arrives at 8:15, opens it, and does not close it. She
arrives at this screen from another window, not from another page.

**Exit points.** Almost none. She books someone and stays here. The only real exit is `settings`,
twice ever.

---

## Available data

Room name · room status (free, occupied, cleaning, out of service) · current booking end time ·
next booking start time · practitioner name · patient first name and last initial · booking
duration · cleaning-required flag · walk-in flag · clinic opening hours

**Slow, expensive, or sometimes missing:** Room status is polled every 30 seconds. Practitioner
names come from a separate service that occasionally times out — the room must remain fully usable
with the practitioner name missing, which drives the partial state below.

---

## States

| State | What it shows |
|---|---|
| Empty — first ever | No rooms configured. A single instruction and one action: add your first room. This is the one place the direction's coldness is deliberately softened (D-004). |
| Empty — filtered to nothing | Nothing free right now. Shows the *soonest* room to free up and when — never a "no results" message. Emptiness here is information, not an absence. |
| Loading — first paint | Room-shaped skeletons in the real grid positions, so nothing moves when data lands. |
| Loading — refreshing | Nothing visible. The 30-second poll must never blank or flicker a screen she may be reading at that moment. |
| Partial | Rooms and statuses shown; practitioner name replaced by a neutral placeholder. Never blocks the primary answer on the flaky service. |
| Error — recoverable | Poll failed. A quiet banner with the last-updated time and a retry — the stale data stays on screen, because stale is more useful than absent here. |
| Error — terminal | Service down. States plainly that the board is not live and to use the wall chart. Naming the fallback is more useful than an apology. |
| No permission | N/A — cannot occur. Practitioners are routed to `my-day` before this screen renders. |
| Success / confirmation | Booking made: the room moves to occupied with a 200ms transition, and the new booking is briefly outlined. No toast — she is not looking at the corner. |
| Dense / overflow | 12 rooms (contract maximum, clinic has 4). A 90-character room name. A patient name that is one character. Names truncate; **status never truncates** — D-006 consequence. |

---

## Success criteria

1. Priya identifies every free room in under two seconds, without scrolling and without
   interacting.
2. Room status is legible from four metres — the laminated wall chart's bar.
3. Booking a walk-in into a free room takes at most two clicks from arrival at the screen.

---

## Shell

Persistent left rail, 72px, icon-only — four destinations, no labels, because she has used them all
a thousand times. No top bar; the clinic name and clock live in the rail's footer. Design the
content region only.
