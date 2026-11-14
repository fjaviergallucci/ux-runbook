---
stage: acceptance
version: 1
status: draft
built-from: []
---
<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this
     comment. The header is the state script's: `scripts/state.mjs` writes the version, the status and
     the approval. You write only `built-from`: each stage this output is built from, as `[handoff@1]`. -->

# Acceptance · {the design's name}

## What was read

{The handoff, by its version; what the builder wrote back; the build, and how each state was put on
screen: from the state map, in the browser, the way the project's profile says a check is run here.}

## The checks

{The count line and the table that `scripts/accept.mjs report --checks` writes from the results kept in
`results/`, where a check that never ran shows as not run. Or the path of that table, when it is long.}

## Item by item

{Each success criterion, each state, and each entry of the builder's deviations: matches · deviates,
with what shows it.}

| Item | Result | What shows it | What becomes of it |
|---|---|---|---|
| {the criterion, the state or the deviation} | {matches · deviates} | {the check's id, or the picture} | {— · accepted · to fix, as fix n} |

## What the readers found

{One line for each judge that read pictures of the build, with its verdict. Then the audience's task
read: its ranking, and the stuck point that cost her most. Pictures of a build are taken on test data.}

## Deviations accepted

{Each deviation he accepts, in his words, and what in the package was brought up to date so that the
design on disk is what shipped. "None".}

## Fixes sent out

{Each deviation to fix, by its number in `FIXES.md`. "None".}

## Lessons

{The entry appended to the project's lessons file, by its date, and the line proposed for the kit's
own, when there is one.}

## Reviewed by the founder

{The words he accepted it with, as he said them.}
