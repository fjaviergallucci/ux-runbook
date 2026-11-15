---
type: regex
target: { source: file, path: design/today/04-structure/BRIEF.md }
match: contains
flags: im
---

^## The person\n[^#]*?\b(front desk|clinic)\b
