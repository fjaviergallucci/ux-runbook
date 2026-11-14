---
stage: handoff
version: 1
status: draft
built-from: []
---
<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this
     comment. The header is the state script's: `scripts/state.mjs` writes the version, the status and
     the approval. You write only `built-from`: each stage this output is built from, as `[look@1]`.
     Below the header nothing points back into the package: the builder is given this folder and no
     other. -->

# Handoff · {the design's name}

This folder is all you need to build this design, and the only thing you are asked to read. The lines
above this title are the stamp of the session that designed it: they ask nothing of you.

## What is in this folder

| File | What it is |
|---|---|
| `HANDOFF.md` | This page. Start here. |
| `IMPLEMENTER-GUIDE.md` | How to turn a prototype into the project's own components. Read it before the first slice. |
| `prototype/` | The picture of record: static pages on the project's real tokens, one for each screen, state, language and theme, with an index and reference pictures at each width. To translate into the project's components, never to paste. Every element that matters carries a stable id. |
| `SPEC.md` | For each surface: its job, its regions, every state, the rules, the data map, and what the product cannot supply yet. |
| `strings.*` | Every string by key, in every language, final, with its limit and its why-line: {the file's name, in the format the project's translation layer takes}. |
| `PARTS.md` | The token and the component each element uses, and anything new to the system. |
| `ACCEPTANCE.md`, `acceptance.json` | What done is checked against, in words and as checks a script runs. |
| `DECISIONS.md` | What was chosen, why, and what each choice forces on the build. |
| `COVERAGE.md` | Who read the design, which checks ran, and what became of each finding. |

## Context

{The product in one sentence. Who this is for, and the moment she is in. Her one job here. Why now.
Enough for someone who was not there, and no more.}

## Task

{What to build, in one paragraph: the surfaces, where they live in the product, what they replace.}

## Done when

{The success criteria, as `ACCEPTANCE.md` checks them. Then: every state of `SPEC.md` is built, every
check of `acceptance.json` holds in the build, and the three files named at the end are written.}

## Verify

{How the builder checks its own work before writing back: each state beside its reference picture, and
the project's own gates, by the commands the project uses. The checks of `acceptance.json` are run on
the build afterwards, by the stable ids, from the state map the builder writes.}

## Constraints

- Keep every stable id: each `data-ux` and `data-screen` of the prototype, on the same element.
- Build every state in `SPEC.md`, not only the ordinary one.
- Do not redesign. What cannot be built as drawn is built as near as it can be and written down in
  `DEVIATIONS.md`: it is decided afterwards, not here.
- {The project's standing rules that bind a build, one line each.}

## Slices

{In build order. Each is small enough to build, verify and commit alone.}

### 1 · {the slice, named by what will be true when it is done}

- **Builds:** {the screens, the states and the parts it covers}
- **Done when:** {a condition someone can see}
- **Verify:** {the checks of `acceptance.json` it must hold, by id, and what to look at}

## Out of scope

{What this design does not cover, so that it is not built by mistake, each with where it will be decided.}

## Must not change

{What is decided: the structure, the states, the rules, the strings, the ids, and each decision of
`DECISIONS.md` that a build could undo without noticing.}

## Left to the builder

{What is the builder's to decide: where files go, how state is held, how a rule is implemented. What is
neither here nor under "Must not change" is asked, never guessed.}

## What you write back

Three short files, in `../build/`, beside this folder. Each is already there as a page to fill, and you
never need to open anything else outside this folder.

| File | What it holds |
|---|---|
| `BUILD.md` | What was built, where it lives, how to run it. |
| `STATES.md` | The state map: for each state of `SPEC.md`, how to reach it in the build. |
| `DEVIATIONS.md` | Anything that could not be built as drawn: what, why, and the nearest thing that was built. |

## Reviewed by the founder

{His one go, in his words.}
