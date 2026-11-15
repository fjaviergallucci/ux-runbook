---
stage: intent
version: 1
status: approved
approved: 2026-11-11
words: "Yes, that is the job."
built-from: [context@1]
---
# Intent · today

## The person in the moment

`person.desk-cover`, at `design/pool/persons/desk-cover.md`: of `profile.front-desk-coordinator`, with no specialty. She is covering the front desk alone over lunch, the phone at her ear. A man has just walked in with no booking and is standing in front of her.

## The one job

Put a walk-in in a room that is free right now, without leaving the desk.

## Arrives with, leaves with

She arrives with a person in front of her, one free hand, and no idea which rooms are free. She leaves with a room booked under his name, knowing until when it is his.

## Success criteria

1. She can say which rooms are free now without scrolling, at 1280 px and at 390 px.
2. When no room is free, she can say which room frees up first, and when.
3. A booking made in the wrong room can be undone from the screen she is on, in one press, for two minutes after it was made.

## Tasks for the audience

1. **Start:** A man has walked in with no booking and is waiting at the desk. **Goal:** Find him a room he can go into now.
2. **Start:** A practitioner phones the desk between two patients. **Goal:** Tell her whether Sala Jardín is free until eleven.

## States

| State | What it must tell her, or let her do |
|---|---|
| Empty — first ever | cannot occur because the clinic's rooms are entered before the front desk is given this screen |
| Empty — filtered to nothing | No room is free now: she is told which room frees up first, and when, and she can book it from then |
| Loading — first paint | cannot occur because the screen arrives whole, with the statuses in it |
| Loading — refresh | What is on screen stays while it updates, with the time of the last update: nothing is blanked |
| Partial | cannot occur because the statuses of all the rooms arrive together, or not at all |
| Error — recoverable | The booking was not saved: she is told so, the name she typed is kept, and she can try again |
| Error — terminal | cannot occur because every failure here can be tried again |
| No permission | cannot occur because everyone who signs in at the desk may book any room |
| Success | The room she booked shows as booked at once, with until when, and she can undo it for two minutes |
| Overflow | Twelve rooms, and a room's name of forty characters: she still finds a free room without scrolling |

## The feeling

"I know." Not "let me check."

## Like its siblings, and where it may differ

Like the Day sheet and Patients, the product's two other screens, a room is called by the name on its door and a time is written as 9:40. Those two are LinenTable lists with a search field above them. This one may part from that: she does not search here.

## The measure

The event `walkin_roomed_from_today`, to add: a walk-in put in a room from this screen.

## Constraints that will bite

- 1280 px at the desk, and 390 px on a phone.
- The statuses can be half a minute old, and older after a failed fetch.
- Never a patient's full name where someone at the counter can read it.
- There is no waiting list, and no message is sent.

## What the readers found

Not read.

## Reviewed by the founder

Nothing corrected. Approved with: "Yes, that is the job."

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry

- source:design/pool/persons/desk-cover.md
- source:design/pool/profiles/front-desk-coordinator.md
- source:docs/product-facts.md
- source:docs/linen.md
- source:src/styles/linen-tokens.css
- source:src/components/linen
- context@1#the-people
- context@1#what-the-product-can-show-and-do
- context@1#constraints
- context@1#the-founder-s-own-words
- context@1#the-problem-and-why-now
- context@1#what-exists-today
- context@1#what-it-must-not-become
