---
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

A project is kept inside the `ux` plugin's own folder, for this exercise. That folder is the kit: its root is two directories above the folder any of its skills reports when it loads. The project's root is `evals/brief-has-no-design/fixture/`, under the kit's root. It is read-only there, on purpose: take that as given, and do not ask me to change it. Work in it where it lies; nothing needs copying.

The state is read-only too: run no command that writes it. The stage is already begun, and its output, `CHOSEN.md`, is started. A file the stage would write into the package, write at the same path under your working directory instead: `design/today/04-structure/BRIEF.md` there stands for the package's own.

The design `today` is in work at Structure. Take it as far as the brief its describers will be sent, and stop where I have to read it.
