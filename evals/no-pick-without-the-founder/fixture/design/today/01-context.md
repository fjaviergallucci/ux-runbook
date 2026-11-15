---
stage: context
version: 1
status: approved
approved: 2026-11-11
words: Yes. That is how it is.
built-from: [frame@1]
---
# Context · today

Every fact below has its source: a file of the project, or a day and who said it.

## The problem, and why now

The front desk cannot see which rooms are free. To place a walk-in, the coordinator phones the practitioners one after another, or walks down the corridor, with the patient waiting at the counter (the founder, 2026-11-10). The product already knows each room's status and shows it nowhere to the desk (`docs/product-facts.md`, "Rooms"). Why now: the clinic takes walk-ins from this winter, and each one costs the desk minutes on the phone.

## The people

The design is for one profession: front-desk coordinators, `profile.front-desk-coordinator`, at `design/pool/profiles/front-desk-coordinator.md`. They are the only role that reaches this screen. Practitioners do not reach it: they ask the desk (the founder, 2026-11-10).

## What exists today

No screen. She keeps a paper chart of the rooms beside the phone, and corrects it by phoning the practitioners (the founder, 2026-11-10).

## What the product can show and do

As data, never as components. What is not in this table does not exist.

| Row | The product can show or do | Kind | Source |
|---|---|---|---|
| P1 | Whether each room is free, busy, being cleaned or closed | state | `docs/product-facts.md`, "Rooms" |
| P2 | When a busy room's booking ends, when a room being cleaned is ready, and when a free room's next booking starts | data | `docs/product-facts.md`, "Rooms" |
| P3 | For a busy room: the practitioner's first name, and the patient's first name with the initial of the surname | data | `docs/product-facts.md`, "Rooms" |
| P4 | The time the statuses were last fetched. They are fetched every 30 seconds, and after a failed fetch the last ones stay, with their time | data | `docs/product-facts.md`, "Rooms" |
| P5 | Book a free room from now, for 15, 30 or 45 minutes, under a patient's name of up to 80 characters; book a room that is not free from the time it frees up | action | `docs/product-facts.md`, "Bookings" |
| P6 | Undo a booking, for two minutes after it was made | action | `docs/product-facts.md`, "Bookings" |
| P7 | A booking that could not be saved is reported as not saved, and nothing of it is kept | state | `docs/product-facts.md`, "Bookings" |
| P8 | Up to twelve rooms, each with a name of up to forty characters: today Room 1, Room 2, Room 3, Sala Jardín and the Gym | data | `docs/product-facts.md`, "Rooms" |

The product holds no waiting list, sends no message, and shows nothing of a practitioner's day beyond a room's current booking and its next one (`docs/product-facts.md`, "What it does not do").

## Constraints

- Design system: none yet (`design/PROFILE.md`, "Design system"). The project kit, at `design/kit`, is the grey kit.
- Accessibility: every action reached by keyboard, and text at a contrast of at least 4.5 to 1 (the founder, 2026-11-10).
- Language: English (`design/PROFILE.md`, `languages`).
- Devices and widths: the desk's computer, 1280 px wide, is the primary; a phone, 390 px, is the second (the founder, 2026-11-10).
- Standing rules that apply: plain words, the front desk's own; never a patient's full name where someone at the counter can read it (`design/PROFILE.md`, "Standing rules").

## Tried and rejected

Nothing on record: the founder was asked on 2026-11-10.

## The angles considered

| Angle | What it says the problem is | Its risk |
|---|---|---|
| She cannot tell which room is free now | The status exists, and she cannot see it | It answers the glance, and leaves the booking as slow as it was |
| Placing a walk-in takes a phone call | The cost is the minutes on the phone, with the patient watching | It treats every visit as a walk-in, and most are booked |
| Nobody trusts the chart | The paper chart is out of date within the hour, so she checks by phone anyway | A screen she cannot date is one more chart |

## What it must not become

A calendar of the whole day, for planning tomorrow: this is about now. And never a display that shows patients' names to the waiting room.

## The founder's own words

Not asked: on a working surface she reads a word or a time to act, and no sentence.

## Questions for the founder

None.

## Project sources

- `docs/product-facts.md`: what the product does, and what may be said of it.

## Reviewed by the founder

Corrected: practitioners do not reach this screen. Approved with: "Yes. That is how it is."

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry

- source:docs/product-facts.md
- source:design/pool/profiles/front-desk-coordinator.md
- frame@1#who-it-is-for
