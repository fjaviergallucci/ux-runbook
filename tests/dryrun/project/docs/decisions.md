# Decisions

One entry for each decision about the product, appended, never edited. A later entry answers an
earlier one that proved wrong.

## D-1 · 2026-08-04 · A room's state is worked out from the bookings

Nothing in the rooms can report whether someone is in them, so Roomtally works the state out: busy
while a booking runs, being cleaned for a fixed time after it ends, free otherwise. Rejected: a button
in each room, which nobody would press. Cost accepted: a clinician who leaves early shows as busy until
the desk ends the booking.

## D-2 · 2026-08-04 · Bookings start on the quarter hour

A booking starts at :00, :15, :30 or :45 and lasts 15, 30, 45 or 60 minutes. Rejected: any minute,
which made the day list hard to read and left gaps nobody could book. Cost accepted: a clinician who
needs twenty minutes books thirty.

## D-3 · 2026-09-10 · English and Spanish ship together

No screen ships in one language only: every string is written in both, each for itself. Rejected:
Spanish later, which would have left half the desk on English.

## D-4 · 2026-10-01 · Linden 1.2: a status tag carries its word

The dot-only tag is gone: every tag says its state in words, and its colour supports the word.
Rejected: keeping the dot for the narrow phone width. Cost accepted: a tag takes more room in a row.
