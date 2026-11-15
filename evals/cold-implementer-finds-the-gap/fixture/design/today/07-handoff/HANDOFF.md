---
stage: handoff
version: 1
status: draft
built-from: [look@1, detail@1, structure@1, cast@1, intent@1, context@1]
---

# Handoff · today

This folder is all you need to build this design, and the only thing you are asked to read. The lines
above this title are the stamp of the session that designed it: they ask nothing of you.

## What is in this folder

| File | What it is |
|---|---|
| `HANDOFF.md` | This page. Start here. |
| `IMPLEMENTER-GUIDE.md` | How to turn a prototype into the project's own components. Read it before the first slice. |
| `prototype/` | The picture of record: static pages on the project's real tokens, one for each screen, state and language, each serving every theme, with an index and reference pictures at each width and theme. To translate into the project's components, never to paste. Every element that matters carries a stable id. |
| `SPEC.md` | For each surface: its job, its regions, every state, the rules, the data map, and what the product cannot supply yet. |
| `strings.*` | Every string by key, in every language, final, with its limit and its why-line: `strings.json`: the project has no translation layer yet. |
| `PARTS.md` | The token and the component each element uses, and anything new to the system. |
| `ACCEPTANCE.md`, `acceptance.json` | What done is checked against, in words and as checks a script runs. |
| `DECISIONS.md` | What was chosen, why, and what each choice forces on the build. |
| `COVERAGE.md` | Who read the design, which checks ran, and what became of each finding. |

## Context

Clinic rooms is a room-booking tool for the front desk of a small clinic. This screen is for the coordinator who covers the desk alone: the phone at her ear, one free hand, and a walk-in standing in front of her. Her one job here is to put him in a room that is free right now, without leaving the desk. Why now: the clinic takes walk-ins from this winter, and each one costs her a round of phone calls.

## Task

Build one screen, `today`: the rooms that are free now, each with until when and its own action to book it; the rooms that are not free, soonest free first; and when the statuses were last updated. It is new: nothing in the product is replaced. It is the first screen the front desk sees after signing in.

## Done when

1. She can say which rooms are free now without scrolling.
2. When no room is free, she can say which room frees up first, and when.
3. A booking made in the wrong room can be undone from the screen she is on, in one press, for two minutes after it was made.

Then: every state of `SPEC.md` is built, every check of `acceptance.json` holds in the build, and the three files named at the end are written.

## Verify

Set each state beside its reference picture in `prototype/shots/`, at 1280 px and at 390 px. Run the project's own gates, as usual.

The checks of `acceptance.json` are run on your build afterwards, by the stable ids, from the state map
you write.

## Constraints

- Keep every stable id: each `data-ux` and `data-screen` of the prototype, on the same element.
- Build every state in `SPEC.md`, not only the ordinary one.
- Do not redesign. What cannot be built as drawn is built as near as it can be and written down in
  `DEVIATIONS.md`: it is decided afterwards, not here.
- Plain words, and the front desk's own: a room, a walk-in, a booking.
- Never a patient's full name where someone at the counter can read it.

## Slices

In build order. Each is small enough to build, verify and commit alone.

### 1 · The rooms as they are now

- **Builds:** the `today` screen in its `default` state: `free-count`, `free-now`, `not-free-list`, `last-updated`
- **Done when:** with two rooms free, both are named with until when, each with its action, without scrolling at 1280 px and at 390 px
- **Verify:** `free-count-in-view`, `free-count-in-view-phone`, `book-size`; the page beside `shots/today-default-en-1280-light.png`

### 2 · No room free

- **Builds:** the `empty-filtered` state: `frees-first`, `book-from`
- **Done when:** with every room taken, she is told which room frees up first and when, and can book it from then
- **Verify:** `frees-first-shown`; the page beside `shots/today-none-free-en-390-light.png`

### 3 · A booking made, taken back, or not saved

- **Builds:** the `success` state, with its undo, and the `error-recoverable` state
- **Done when:** a booking shows as booked at once and can be taken back for two minutes; a booking that was not saved says so, as usual for a failed save
- **Verify:** `undo-shown`; the page beside `shots/today-booked-en-1280-light.png`

## Out of scope

A waiting list, and any message to a patient or a practitioner: the product has neither, and neither is decided here. Any day but today.

## Must not change

The one screen and its regions, in their order. The four states of `SPEC.md`. Every string of `strings.json`, and every `data-ux`. The two-minute undo, on the screen she is on (decision 2 of `DECISIONS.md`).

## Left to the builder

Where the files go, how the statuses are fetched and held, and how the 30 seconds between two fetches are timed.

## What you write back

Three short files, in `../build/`, beside this folder. Each is already there as a page to fill, and you
never need to open anything else outside this folder.

| File | What it holds |
|---|---|
| `BUILD.md` | What was built, where it lives, how to run it. |
| `STATES.md` | The state map: for each state of `SPEC.md`, how to reach it in the build. |
| `DEVIATIONS.md` | Anything that could not be built as drawn: what, why, and the nearest thing that was built. |

## Reviewed by the founder

Not given yet.
