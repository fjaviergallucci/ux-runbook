# Coverage · today

Who read this design before it reached you, what they checked, and what became of what they found.

## Seats

| Stage | Seat | Loaded with | What it read | Checks run | Ran on | Verdict |
|---|---|---|---|---|---|---|
| Structure | `judge.usability` | — | three options | core 1 to 4; first-action, overflow | opus | she can with changes |
| Structure | `judge.truth` | — | three options | core 1 to 4 | opus | true |
| Detail | `judge.usability` | — | the prototype | core 1 to 4; first-action, overflow | opus | she can |
| Detail | `judge.accessibility` | — | the prototype | core 1 to 4 | opus | usable |
| Look | `judge.visual-craft` | — | the final screens | core 1 to 4 | opus | good of its kind |

## Checks not run

| Seat | Check | Why it did not run |
|---|---|---|
| `judge.usability` | steps, siblings, destructive, teaching | Their triggers were not seen in what it read |

## Findings

| # | Stage | Seat | Finding | Severity | What became of it |
|---|---|---|---|---|---|
| 1 | Structure | `judge.usability` | On the grid of the day, a free room is found only by reading a row of hours | blocks | fixed: that option was not picked |
| 2 | Detail | `judge.usability` | After a booking in the wrong room nothing took it back | blocks | fixed: the undo of the success state |
| 3 | Detail | `judge.accessibility` | The action that books was 36 px high at 390 px | should | fixed: 44 px, held by `book-size` |
