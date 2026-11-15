---
type: regex
target: last_message
match: contains
flags: i
---

\bshort\b[\s\S]*\bskipped\b|\bskipped\b[\s\S]*\bshort\b
