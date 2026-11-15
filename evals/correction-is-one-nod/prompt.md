---
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit, Agent]
---

A project is kept inside the `ux` plugin's own folder, for this exercise. That folder is the kit: its root is two directories above the folder any of its skills reports when it loads. The project's root is `evals/correction-is-one-nod/fixture/`, under the kit's root. It is read-only there, on purpose: take that as given, and do not ask me to change it. Work in it where it lies; nothing needs copying.

On the Today screen, the action that books a room reads "Reserve". It should read "Book room". Please put that right.
