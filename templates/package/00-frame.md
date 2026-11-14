---
stage: frame
version: 1
status: draft
built-from: []
---
<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this
     comment. The header is the state script's: `scripts/state.mjs` writes the version, the status and
     the approval. Frame is built from nothing, so `built-from` stays an empty list. -->

# Frame · {the design's name, as `state init` was given it}

{A correction needs only the request, the three values and its route in one line.}

## The request

{What he asked for, in his own words, as he wrote it. Never a summary.}

## Kind, foundation, size

| | Value | Why |
|---|---|---|
| Kind | {working-surface · first-run · form · message · public-page, or a kind the project's profile adds} | {what the interface is for, in one line} |
| Foundation | {no-system · new-surface · redesign · small-change} | {what it starts from} |
| Size | {correction · adjustment · surface · flow · system} | {why this size, and not the one below it} |

## Route

{The size sets each stage's mode, and `state init` records it. Change a stage only with `state route`,
and give the reason here. The size only moves up.}

| Stage | Mode | Reason |
|---|---|---|
| context | {full · short · skipped} | {why, in one line} |
| intent | {…} | {…} |
| cast | {…} | {…} |
| structure | {…} | {…} |
| detail | {…} | {…} |
| look | {…} | {…} |
| handoff | {…} | {…} |
| acceptance | {…} | {…} |

## Who it is for

{One profile, several, or everyone. Name each profile by its id, as `profile.<name>`, and say which are
in the project's pool and which Context will have to draft.}

## Provisional cast

{The preset for this kind and size, from `pool/INDEX.md` and the project's own pool: one line for each
seat. A starting point only: Cast decides.}

## Engines missing

{Each seat of the provisional cast whose engine is not installed on this machine, or is not in the
profile's `engines-on`, and what the seat does without it. "None" when every engine answers.}

## Reviewed by the founder

{What he corrected, and the words he confirmed it with, as he said them.}

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry
