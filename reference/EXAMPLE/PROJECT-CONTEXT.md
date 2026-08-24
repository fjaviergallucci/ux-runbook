# Project context — RoomBoard

**Last updated:** 2026-08-24 · **Filled during:** Phase 1, gate G1

---

## Product frame

**What it does:** "It tells the front desk which treatment rooms are free, and lets them put someone
in one."

**Who pays:** The clinic owner, on behalf of one front-desk user. Before this, they used a laminated
wall chart and a whiteboard marker — which is legible from four metres and needs no interaction.
That chart is the real competitor.

**Working, six months in, looks like:** Nobody has printed a replacement chart.

---

## Roles

| Role | Can do | Cannot do |
|---|---|---|
| Front desk | See all rooms, book, move, cancel, mark cleaned | Change practitioner hours, see billing |
| Practitioner | See own bookings, mark a room needing cleaning | See other practitioners' patient names |
| Owner | Everything, plus hours and reporting | — |

---

## Personas

| Persona | Role | Primary surface | Their one job |
|---|---|---|---|
| Priya | Front desk | `today` | Answer "is anything free right now?" in under two seconds |
| Dan | Practitioner | `my-day` | Know which room he's in next, without asking Priya |

---

## Surfaces

| Surface | Persona | Its one job |
|---|---|---|
| `today` | Priya | Show what's free right now, and let her fill it |
| `my-day` | Dan | Show one practitioner their next three appointments and rooms |
| `week` | Owner | Show utilisation across the week |
| `settings` | Owner | Rooms, practitioners, opening hours |

---

## Constraints

**Stack:** React 19 · Vite · a headless component library · CSS custom properties. No SSR.

**Design system:** None at project start. Built in Phase 2 — tokens in `src/styles/tokens.css`,
semantic names only (`--color-surface-free`, not `--color-green`).

**Brand:** None. The clinic has a logo on the door and no digital brand. Treated as open latitude,
confirmed with the owner.

**Accessibility target:** WCAG 2.2 AA. Non-negotiable — one practitioner is red-green colour blind,
which surfaced in the interview and drove D-007.

**Locales:** English only, with Spanish likely within a year. Layouts must survive 40% longer
strings; no fixed-width text containers.

**Devices and breakpoints:** One 24-inch desk monitor at 1440, and Priya's phone at 375 when she is
away from the desk. 768 exists but nobody uses it. No tablets.

**Already tried and rejected:** A generic calendar product, abandoned after three weeks — "it showed
me the whole week when I only ever care about the next twenty minutes." This is the single most
useful sentence in the interview and it shaped the entire `today` surface.

---

## Direction

**Chosen:** Clinical Instrument — see `DESIGN-DECISIONS.md` D-004

**In one line:** A near-monochrome instrument panel where a single amber accent means exactly one
thing — this needs your attention now.

**Cost accepted:** Cold. Unwelcoming on first run. Mitigated in the empty state only, deliberately
not softened elsewhere.
