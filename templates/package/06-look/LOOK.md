---
stage: look
version: 1
status: draft
built-from: []
---
<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this
     comment. The header is the state script's: `scripts/state.mjs` writes the version, the status and
     the approval. You write only `built-from`: each stage this output is built from, as `[detail@1]`. -->

# Look · {the design's name}

## Mode

{Inside the design system, or a direction, and why.}

{For a direction: each one's name, thesis and stated cost; the one he picked; the token file the pick
became; that the project's profile now points at it.}

## What is in this folder

{The final screens: static pages on the project's token file, one for each screen, state and language,
each serving every theme and width. Their number, as a sum.}

{The reference pictures, at each width and theme. The token file, by its path and version.}

## What the look decides

{One line for each that this design settles: hierarchy · spacing · emphasis · density · what each width
does · themes · motion, only when it was cast.}

## Measured values

{What a builder must hit and a judge can check, measured on the rendered page with a tool, never by eye.}

| Element | What was measured | Value | Token | Width | Theme |
|---|---|---|---|---|---|
| {its `data-ux`} | {as: the size of its text · its contrast on its ground · its target · the gap below it} | {as measured} | {the token it comes from} | {px} | {light · dark} |

## Variants

{Only where the system leaves a real choice, and then on one named axis: the axis, each variant with
what it buys and what it costs, and the one he picked. "None: the system left no real choice".}

## Fresh pass

{When one ran: the fresh screens as they came, shown beside the system version, and what he marked on
them. "No fresh pass" otherwise.}

{Then its outcome, one of three: nothing to borrow · borrow named things · the fresh concept wins as a
whole, which is a change of direction for this surface. A fresh screen is never handed off as it came.}

## Named extensions

{What the system lacked, each as: its name; what it is, a token, a part or a pattern; its values beside
the system's own; where it is used; what it costs. "None".}

## What the readers found

{One line for each seat that read the final screens, with its verdict. Then each finding: fixed, or
open with the reason.}

## Reviewed by the founder

{What he picked or corrected, and the words he approved it with, as he said them.}

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry
