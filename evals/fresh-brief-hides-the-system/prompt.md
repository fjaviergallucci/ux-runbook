---
max_turns: 100
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

A project is kept inside the `ux` plugin's own folder, for this exercise. That folder is the kit: its root is two directories above the folder any of its skills reports when it loads. The project's root is `evals/fresh-brief-hides-the-system/fixture/`, under the kit's root. It is read-only there.

Copy what is in it into your working directory with one command, `cp -r "<kit root>/evals/fresh-brief-hides-the-system/fixture/." .`, so that `design/today/state.json` and `docs/product-facts.md` are in your working directory. Your working directory is then the project's root: work only in that copy.

The design `today` is ready for Structure, and its cast has a fresh pass there. Take it as far as the two briefs I have to read before anything is sent, the describers' and the fresh pass's, and stop there.
