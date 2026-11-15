---
type: regex
target: { source: file, path: reads/judge.usability.md }
match: contains
flags: im
---

^\|[^\n]*(today-none-free-en\.html|empty-filtered|no room is free)[^\n]*(→|->)[^\n]*\|[ \t]*[^|\n\s—–-][^|\n]*\|[ \t]*$
