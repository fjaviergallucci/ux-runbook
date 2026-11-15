---
stage: frame
version: 1
status: approved
approved: 2026-11-10
words: "Yes, that is the frame."
built-from: []
---
# Frame · today

## The request

"I want a screen that shows the front desk which rooms are free right now, so that a walk-in can be put in a room without phoning round the clinic."

## Kind, foundation, size

| | Value | Why |
|---|---|---|
| Kind | working-surface | She works on it all day, again and again. |
| Foundation | new-surface | The project has a design system, Linen, and this screen does not exist yet. |
| Size | surface | A new screen: more than moving an element on one that exists, and less than several screens that form one task. |

## Route

Every stage runs full: the route of a surface.

| Stage | Mode | Reason |
|---|---|---|
| context | full | the route of a surface |
| intent | full | the route of a surface |
| cast | full | the route of a surface |
| structure | full | the route of a surface |
| detail | full | the route of a surface |
| look | full | the route of a surface |
| handoff | full | the route of a surface |
| acceptance | full | the route of a surface |

## Who it is for

One profession: front-desk coordinators, `profile.front-desk-coordinator`. Its profile is in the project's pool, at `design/pool/profiles/front-desk-coordinator.md`: Context has none to draft.

## Provisional cast

The preset of a surface, with what it adds by rule. A starting point: Cast decides.

- Structure: three `maker.structure-describer`, each with a lens of its own; `judge.usability`, `judge.truth`, and `judge.profile` for the one profession; `audience.task-reader` twice, as the primary person and as one contrast person.
- Detail: `maker.interaction-designer`, `maker.interface-writer`, `maker.prototype-builder`; `judge.usability`, `judge.truth`, `judge.words`, `judge.accessibility`, `judge.profile`; `audience.task-reader`.
- Look: `maker.visual-designer`; `judge.visual-craft`, `judge.system-fidelity`, `judge.accessibility`.
- Handoff: `judge.cold-implementer`.
- Acceptance: `judge.usability`, `judge.accessibility`, `judge.system-fidelity`, `judge.visual-craft`, `judge.profile`; `audience.task-reader`.

## Engines missing

As the engine check of 2026-11-10 found them:

- `maker.visual-designer`, engine `skill:frontend-design:frontend-design`: missing. The seat runs on its card's own text.
- `judge.visual-craft`, engine `skill:design-audit:design-audit`: missing. The seat runs on its card's own text.

## Reviewed by the founder

Nothing corrected. Confirmed with: "Yes, that is the frame."

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry

- source:design/pool/profiles/front-desk-coordinator.md
