---
type: regex
target: { source: file, path: reads/judge.usability.md }
match: contains
flags: im
---

^\|[^\n]*(today-booked-en\.html|\bundo\b|undone|taken? back)[^\n]*(→|->)[^\n]*\|[ \t]*[^|\n\s—–-][^|\n]*\|[ \t]*$
