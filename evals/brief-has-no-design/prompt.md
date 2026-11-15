---
max_turns: 90
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

A project is kept inside the `ux` plugin's own folder, for this exercise. That folder is the kit: its root is two directories above the folder any of its skills reports when it loads. The project's root is `evals/brief-has-no-design/fixture/`, under the kit's root. It is read-only there.

Copy what is in it into your working directory with one command, `cp -r "<kit root>/evals/brief-has-no-design/fixture/." .`, so that `design/today/state.json` and `docs/product-facts.md` are in your working directory. Your working directory is then the project's root: work only in that copy.

The design `today` is ready for Structure. Take it as far as the brief its describers will be sent, and stop where I have to read it.
