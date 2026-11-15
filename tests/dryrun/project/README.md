# Roomtally

Roomtally is a room-booking tool for the front desk of a small clinic. The front desk books the
clinic's consulting rooms for its clinicians through the day: who has which room, from when, for how
long.

This file is the product's facts: what Roomtally shows and does today, and what may be said of it.

## Who uses it

The front-desk coordinator. One or two are at the desk on a weekday, booking rooms for clinicians
between phone calls and the people at the counter. Each coordinator signs in with her own account;
there are no other roles. Clinicians do not use Roomtally: they ask the desk.

## Where it is used

On the desk computer at the counter, in a browser window 1280 pixels wide. A coordinator sometimes
checks it on her phone, 390 pixels wide, when she is away from the desk.

## What it shows today

- **The rooms.** The clinic has five consulting rooms, Room 1 to Room 5.
- **Each room's state now.** A room is always in exactly one of three states: free, busy (in use: a
  booking is running in it), or being cleaned. After a booking ends, the room is being cleaned for fifteen
  minutes, then it is free. The state is worked out from the bookings (`docs/decisions.md`, D-1):
  nothing in the room reports it, so a clinician who leaves early still shows as busy until the desk
  ends the booking.
- **The day's bookings.** Each has a room, a start time, a length (15, 30, 45 or 60 minutes) and a
  clinician. A booking holds no patient's details.
- **Who is on shift today.** Each clinician, with the time the shift starts and ends.
- **The time now,** from the desk computer's clock.

## What it does today

- **Book a room:** a room, a start, a length and a clinician who is on shift at that time. Bookings
  start on the quarter hour (D-2). Two bookings never overlap in one room: Roomtally refuses one that
  would, and says which booking is in the way.
- **Cancel a booking** that has not started, from its row on the day list.
- **End a running booking now,** from its row: the room goes to being cleaned.

## What is slow or sometimes missing

- The day loads from the clinic's booking service when a screen opens, and refreshes every minute. The
  first load takes up to a few seconds on the desk's connection.
- When the service cannot be reached, the screen says so, keeps the last list it had with the time it
  was loaded, and offers to try again.
- Nothing is pushed: a booking made on the other desk computer appears at the next refresh, up to a
  minute later.

## Limits

- Up to 12 rooms and 80 bookings a day. A clinician's name is up to 40 characters.
- Opening hours: 07:30 to 19:00, Monday to Friday; 08:00 to 13:00 on Saturday.

## Who may see what

Every coordinator signed in sees every room, every booking and the shift list. Nothing is hidden from
one coordinator and shown to another.

## Screens

- `src/screens/day.html`, **Today:** the day's bookings as a plain list, in order of start, with the
  running and just-ended bookings tagged with their room's state, and who is on shift. It is drawn on
  the seeded day of `src/data/sample-day.json`, at 10:20. The booking form it opens is not part of
  this folder.

## Languages

English and Spanish ship together (D-3). Every string is in `src/strings/en.json` and
`src/strings/es.json`: flat JSON, one file for each language, the same keys in both. A screen names
each string by its key, in `data-string`. The product shows the language of the browser.

## Analytics

None. Roomtally records no usage events yet.

## Looking at a screen

Open its file in a browser: there is no build and no server, and nothing signs in. A check by script
opens the same file headless (Playwright, with Chromium) at 1280 and 390 pixels wide, in light and
dark, with reduced motion set.

## Design system

Linden, in `docs/design-system.md`: the tokens in `src/styles/tokens.css`, the components in
`src/components/`.

## Decisions

`docs/decisions.md`, one entry for each decision, appended.

---

A fictional product, written for the dry run of an interface design pipeline. No real clinic, person,
product or address is in it; the names are made-up first names.
