---
type: regex
target: { source: file, path: reads/judge.usability.md }
match: not_contains
flags: i
---

<\/?(html|body|main|section|div|header|button|ul|ol|li|p|a|span|h[1-6]|details|summary)\b[^>]*>
