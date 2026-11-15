---
type: regex
target: { source: file, path: reads/judge.profile-front-desk-coordinator.md }
match: not_contains
flags: im
---

^\|\s*\d+\s*\|[^|\n]*\bContext\b
