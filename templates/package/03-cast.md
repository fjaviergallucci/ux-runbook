---
stage: cast
version: 1
status: draft
built-from: []
---
<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this
     comment. The header is the state script's: `scripts/state.mjs` writes the version, the status and
     the approval. You write only `built-from`: each stage this output is built from, as `[intent@1]`. -->

# Cast · {the design's name}

Model and effort are the cards' suggestions, and he may change any of them: a seat whose card says
`none` shows a dash, —.

{One table for each stage still to run, one row for each seat. Delete the table of a stage the route
skips.}

## Structure

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| {the seat's id, as `maker.structure-describer`} | {`profile.<name>` · `person.<name>` · —} | {a judge only: on …; off …} | {own · skill:… · model:… · tool:…} | {the card's, or —} | {the card's, or —} | {what it catches, and what it costs} |

## Detail

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| {…} | {…} | {…} | {…} | {…} | {…} | {…} |

## Look

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| {…} | {…} | {…} | {…} | {…} | {…} | {…} |

## Handoff

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| {…} | {…} | {…} | {…} | {…} | {…} | {…} |

## Acceptance

| Seat | Loaded with | Checks on · off | Engine | Suggested model | Suggested effort | Why it is here |
|---|---|---|---|---|---|---|
| {…} | {…} | {…} | {…} | {…} | {…} | {…} |

## Left out

{Each seat of the preset that does not sit, and what is lost without it. "None" when the preset sits whole.}

## Blind rules

{Who does not see what in this design: the describers, each other, the session's own idea and today's
screen; the judges, the author map; the audience, the intent.}

{Any continuity maker cast to see the current layout, and why. "None".}

## Fresh pass

{For each stage, whether one runs, with which makers, and why. It never runs at Detail.}

- **Structure:** {runs · does not run} — {the makers, and the reason}
- **Look:** {runs · does not run} — {the makers, and the reason}

## Cost

{The number of agents each stage starts, makers, judges and audiences counted apart, and the total.}

| Stage | Makers | Judges | Audiences | Agents |
|---|---|---|---|---|
| {stage} | {n} | {n} | {n} | {n} |

## Reviewed by the founder

{The seats, checks, models and efforts he changed, and the words he approved it with, as he said them.}

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry
