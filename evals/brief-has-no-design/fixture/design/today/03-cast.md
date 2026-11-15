---
stage: cast
version: 1
status: approved
approved: 2026-11-12
words: Fine. Go.
built-from: [intent@1, context@1]
---
# Cast · today

Model and effort are the cards' suggestions, and he may change any of them: a seat whose card says
`none` shows a dash, —.

## Structure

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| `maker.structure-describer`, lens: fewest steps | — | — | own | fable | high | One way of solving it, by the shortest path. One agent, reading the brief. |
| `maker.structure-describer`, lens: defaults first | — | — | own | opus | high | One way of solving it, with the likeliest answer already there. One agent, reading the brief. |
| `maker.structure-describer`, lens: in place | — | — | own | sonnet | high | One way of solving it, with nothing opening somewhere else. One agent, reading the brief. |
| `judge.usability` | — | on: first-action, overflow; off: steps, siblings, destructive, teaching (their triggers are not in the intent) | own | opus | high | Catches an option she could not finish the walk-in on without help. One agent, reading every option and the intent. |
| `judge.truth` | — | on: none; off: none | own | opus | high | Catches a room shown as free that the product cannot know is free. One agent, reading every option and the inventory. |
| `judge.profile` | `profile.front-desk-coordinator` | on: none; off: all eight (the profile has none of the optional characteristics) | own | opus | high | Catches an option that would not work at a front desk. One agent, reading every option with the profile. |
| `audience.task-reader`, primary | `person.desk-cover` | — | own | opus | medium | Tries both tasks as the person the intent names. One agent, looking at pictures. |
| `audience.task-reader`, contrast | `person.first-timer` | — | own | opus | medium | Tries both tasks as someone the makers were not briefed on. One agent, looking at pictures. |

## Detail

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| `maker.interaction-designer` | — | — | own | fable | high | Every state, rule and edge of the chosen structure. One agent. |
| `maker.interface-writer` | — | — | own | fable | high | Every string, in English. One agent. |
| `maker.prototype-builder` | — | — | own | opus | medium | The plain prototype, every state. One agent. |
| `judge.usability` | — | on: first-action, overflow; off: steps, siblings, destructive, teaching | own | opus | high | Its main read: can she finish, in every state. One agent. |
| `judge.truth` | — | on: none; off: none | own | opus | high | Every element traced to the inventory. One agent. |
| `judge.words` | — | on: none; off: none | own | opus | high | The words she acts on. One agent. |
| `judge.accessibility` | — | on: none; off: none | own | opus | high | Keyboard, names, contrast. One agent. |
| `judge.profile` | `profile.front-desk-coordinator` | on: none; off: all eight | own | opus | high | Its main read: every screen, state and string. One agent. |
| `audience.task-reader` | `person.desk-cover` | — | own | opus | medium | Tries both tasks on the prototype's pictures. One agent. |

## Look

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| `maker.visual-designer` | — | — | skill:frontend-design:frontend-design, missing: it runs on its card's own text | fable | high | The finished screens. One agent. |
| `judge.visual-craft` | — | on: none; off: none | skill:design-audit:design-audit, missing: it runs on its card's own text | opus | high | Is it good of its kind. One agent. |
| `judge.system-fidelity` | — | on: none; off: none | own | opus | medium | Is it made of this product's parts. One agent. |
| `judge.accessibility` | — | on: none; off: none | own | opus | high | Measured contrast and sizes on the final screens. One agent. |

## Handoff

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| `judge.cold-implementer` | — | — | own | opus | high | Lists what a builder would have to ask or guess. One agent, reading the handoff folder alone. |

## Acceptance

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| `judge.usability` | — | on: first-action, overflow; off: the rest | own | opus | high | The build, as built. One agent. |
| `judge.accessibility` | — | on: none; off: none | own | opus | high | The build, measured. One agent. |
| `judge.system-fidelity` | — | on: none; off: none | own | opus | medium | The build's parts. One agent. |
| `judge.visual-craft` | — | on: none; off: none | skill:design-audit:design-audit, missing | opus | high | The build beside the reference pictures. One agent. |
| `judge.profile` | `profile.front-desk-coordinator` | on: none; off: all eight | own | opus | high | The build, as pictures, with the profile. One agent. |
| `audience.task-reader` | `person.desk-cover` | — | own | opus | medium | Tries both tasks on pictures of the build. One agent. |

## Left out

`maker.outside-describer`: no provider is listed under `engines-on`, so the seat is not cast. Lost without it: one proposal from a mind that shares none of the session's habits.

## Blind rules

The describers do not see each other, the session's own idea, or today's screen. The judges do not see the author map, a maker's notes or each other's ledgers. The audience does not see the intent.

No continuity maker is cast: there is no screen today to continue.

## Fresh pass

- **Structure:** does not run — he has not asked for one
- **Look:** does not run — he has not asked for one

## Cost

An agent is counted for each line. A transcriber that stands by is counted only when it runs.

| Stage | Makers | Judges | Audiences | Agents |
|---|---|---|---|---|
| structure | 3 | 3 | 2 | 8 |
| detail | 3 | 5 | 1 | 9 |
| look | 1 | 3 | 0 | 4 |
| handoff | 0 | 1 | 0 | 1 |
| acceptance | 0 | 5 | 1 | 6 |
| total | 7 | 17 | 4 | 28 |

## Reviewed by the founder

He spread the three describers over three models. Approved with: "Fine. Go."

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry

- intent@1#the-person-in-the-moment
- intent@1#the-one-job
- intent@1#arrives-with-leaves-with
- intent@1#success-criteria
- intent@1#tasks-for-the-audience
- intent@1#states
- intent@1#the-feeling
- intent@1#like-its-siblings-and-where-it-may-differ
- intent@1#the-measure
- intent@1#constraints-that-will-bite
- intent@1#what-the-readers-found
- context@1#the-people
- context@1#what-the-product-can-show-and-do
- context@1#constraints
- context@1#the-founder-s-own-words
- context@1#the-problem-and-why-now
- context@1#what-exists-today
- context@1#what-it-must-not-become
- source:docs/product-facts.md
- source:design/pool/persons/desk-cover.md
- source:design/pool/profiles/front-desk-coordinator.md
