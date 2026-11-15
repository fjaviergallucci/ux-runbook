---
type: regex
target: { source: file, path: design/today/04-structure/BRIEF.md }
match: not_contains
flags: i
---

\b(sidebars?|modals?|wizards?|dropdowns?|dashboards?|tabs?|carousels?|two columns|side by side|above the fold|on the (left|right))\b
