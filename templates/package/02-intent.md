---
stage: intent
version: 1
status: draft
built-from: []
---
<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this
     comment. The header is the state script's: `scripts/state.mjs` writes the version, the status and
     the approval. You write only `built-from`: each stage this output is built from, as `[context@1]`. -->

# Intent · {the design's name}

{One page for a surface: then delete this paragraph. A flow gets this page for the whole, then a short
`### <surface>` under each heading that differs from one surface to the next.}

## The person in the moment

{Her card, by id and path, as `person.<name>`, with the profile and the specialty it names. Then the
moment, in two or three sentences from the card: where she is, on what, what has just happened.}

## The one job

{One sentence. If it needs two, it may be two surfaces.}

## Arrives with, leaves with

{What she has in her hands and in her head when she gets here, and what she has when she goes.}

## Success criteria

{Two or three testable sentences, each one checkable by looking at a screen. The test: could two people
disagree about whether it was met? Then sharpen it.}

1. {as: "She can say which rooms are free now without scrolling, at phone width."}
2. {…}
3. {…}

## Tasks for the audience

{What an audience seat will be given, and all it will be given: where she starts and what she wants, in
her words. Never the path, and never a criterion.}

1. **Start:** {where she is, and what she has, in the third person} **Goal:** {what she wants, as she would say it, quoted}

## States

{Every row is filled, or reads "cannot occur because …". A row left out cannot be told from one forgotten.}

{What rests on a fact nobody has yet says so: "not on record: …; written again when …".}

| State | What it must tell her, or let her do |
|---|---|
| Empty — first ever | {nothing is here yet: what teaches her the next step} |
| Empty — filtered to nothing | {she has data and this view has none: never the first-run message} |
| Loading — first paint | {what she sees before anything has arrived} |
| Loading — refresh | {what is on screen stays while it updates: nothing is blanked} |
| Partial | {some arrived, some failed, some is still on its way} |
| Error — recoverable | {what broke, and how she tries again} |
| Error — terminal | {what broke, and what she can do instead} |
| No permission | {she reached it and may not see it: hidden, or explained} |
| Success | {what tells her it worked, and for how long} |
| Overflow | {two hundred rows, a name of ninety characters, a number of nine digits} |

## The feeling

{In her word, not a designer's. With no word of hers on record: "not on record: …; written again when …".}

## Like its siblings, and where it may differ

{Where it must behave as the product's other surfaces do, and where it may part from them, with the reason.}

## The measure

{The event that will say it worked, by the name the project's analytics gives it, or the one to add.}

## Constraints that will bite

{Only those of the context that will shape this design, one line each.}

## What the readers found

{Only when the profile judge was cast to read the intent: its verdict, and each finding, fixed or open
with the reason. "Not read" otherwise.}

## Reviewed by the founder

{What he corrected, and the words he approved it with, as he said them.}

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry
