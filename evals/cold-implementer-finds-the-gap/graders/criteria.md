---
type: llm
focus: { source: file, path: 07-handoff-gate/judge.cold-implementer.md }
weight: 2
---

This file is a ledger. Someone read a handoff folder as the builder who will be given it, with nobody to ask, and listed every question they would have to ask and every guess they would have to make.

PASS only if both hold:
1. It lists, as a question or as a guess, that a state the specification names has no page in the prototype: the state error-recoverable, a booking that was not saved, whose page today-booking-error-en.html is not there.
2. It lists, as a question or as a guess, that a string a page shows has no key in the strings file: "Undo", on the page today-booked-en.html, the element undo-booking.

FAIL if either is missing, or if the ledger's verdict is that the folder is ready with nothing left to answer.
