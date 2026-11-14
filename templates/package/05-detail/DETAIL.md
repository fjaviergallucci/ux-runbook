---
stage: detail
version: 1
status: draft
built-from: []
---
<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this
     comment. The header is the state script's: `scripts/state.mjs` writes the version, the status and
     the approval. You write only `built-from`: each stage this output is built from, as
     `[structure@1]`. -->

# Detail · {the design's name}

{The chosen structure, completed. The interaction designer writes `states.md` and the six sections from
"Rules" to "What the structure cannot hold"; the interface writer writes `strings.json` and the two
lists under "Strings"; the session writes the rest.}

## What is in this folder

{The prototype's folder and its index page, with the number of pages as a sum: screens × states ×
languages, less the states that cannot occur. Then `states.md`, `strings.json` and where the reads are.}

## Rules

{Each rule says what sets it off, what the product does and what she sees, plainly enough that one
person could build it and another could check it. Every element is named by its stable id.}

### Validation

{For every input: what is accepted, when it is checked, what she is told and where, and that what she
typed is kept.}

### Focus order

{For every screen and state: the order focus moves in; where it lands when a screen, a dialog or an
expansion opens; where it returns when that closes; where it goes after an error.}

### Keyboard

{Every action reached and used without a pointer; what Enter and Escape do on each screen.}

### What changes without her asking

{What updates by itself, and how she comes to know.}

### What cannot be undone

{What asks first, and what can be taken back afterwards.}

## Edge cases

{Screen by screen, what the structure shows at: the longest plausible name, the empty list, the list of
two hundred, the missing value, the slow answer, the failed answer, the second press, the screen left
open while things changed, the return halfway through, the narrowest width.}

## Data map

{One row for every element that shows data or offers an action. Trace it: never assume it.}

| Element id | What it shows or offers | Row of the context's inventory |
|---|---|---|
| {as: `free-count`} | {as: how many rooms are free now} | {the row's id in the context, as P1} |

## Dependencies

{What an element needs that the product cannot supply today: the element, and what is missing. Never
invented, and never dropped quietly to hide the gap. "None".}

## States the intent does not name

{Each state met while detailing that the intent's table lacks: where it was met, and what the structure
does today if nothing is decided. Whether it exists is the founder's call. "None".}

## What the structure cannot hold

{A state or a rule the chosen structure has no place for, and the screen that breaks. "None".}

## Strings

{`strings.json` holds every string by its key: one line for each language, written for that language;
`max`, its limit in characters as she sees them, or null when the surface sets none; `where`, its
screen, element and state; and `note`, its why-line, which is part of the table and travels with it.}

### Waiting for a fact

{A string that needs something nobody gave: a limit, a name, what an error means. With what is missing.
"None".}

### Nothing to say

{A state or an element for which no honest line exists. "None".}

## What the readers found

{One line for each seat that read the prototype, with its verdict. Then each finding: fixed, or open
with the reason. An open finding is on the decision page.}

## Reviewed by the founder

{What he corrected, and the words he approved the prototype with, as he said them. Where the words are
the product, his answer on the words is written apart.}

<!-- The carry list is the last section: what the next stage may open besides this output. It holds
     entries only, one to a line: `- source:<path>` for a file of the project, and
     `- <stage>@<version>#<heading-slug>` for a section of an earlier output this one is built from
     (`state slug "<heading>"` prints the slug). The stamp refuses any other line under the heading, so
     this comment stays above it. -->

## Carry
