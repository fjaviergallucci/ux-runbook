---
max_turns: 70
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

A project is kept inside the `ux` plugin's own folder, for this exercise. That folder is the kit: its root is two directories above the folder any of its skills reports when it loads. The project's root is `evals/fresh-brief-hides-the-system/fixture/`, under the kit's root. It is read-only there, on purpose: take that as given, and do not ask me to change it. Work in it where it lies; nothing needs copying.

The state is read-only too: run no command that writes it. The stage is already begun, and its output, `CHOSEN.md`, is started. A file the stage would write into the package, write at the same path under your working directory instead: `design/today/04-structure/BRIEF.md` and `design/today/04-structure/BRIEF-fresh.md` there stand for the package's own.

The design `today` is in work at Structure, and its cast has a fresh pass there. Take it as far as the two briefs I have to read before anything is sent, the describers' and the fresh pass's, and stop there.
