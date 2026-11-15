---
type: regex
target: { source: file, path: reads/judge.usability.md }
match: contains
flags: im
---

^\W*Verdict\W+she (can with changes|cannot|can)\b[^\n]*First fix\W+\S
