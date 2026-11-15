# Decisions · today

What was chosen on the way to this design, and why, so that a build does not undo it and nobody has to
argue it again. Each entry is written out in full: none needs another file to be understood.

## 1 · Free rooms come first, in a region of their own

**Decision.** The rooms that are free now are shown first, each with its own action to book it. The rooms that are not free follow, soonest free first.

**Why.** She does not scroll or search to learn whether anything is free: the answer has to be where she looks first.

**Rejected.** One list of every room in a fixed order: a free room can sit at the bottom of twelve rows. The day as a grid of hours: it answers a question about the day, and hers is about now.

**Forces on the build.** A room moves between the two regions as its status changes. Nothing moves while she is typing a name.

## 2 · A booking can be taken back for two minutes, on the screen she is on

**Decision.** After a booking, the screen says which room is booked and until when, with an action that takes it back for two minutes.

**Why.** The likeliest mistake is the room beside the one she meant, made with the phone at her ear.

**Rejected.** A question before every booking: it costs her a press each time, to guard against a mistake she seldom makes.

**Forces on the build.** The undo is on the `today` screen itself, never behind another one, and is gone after two minutes.
