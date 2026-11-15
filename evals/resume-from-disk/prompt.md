---
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

A project is kept inside the `ux` plugin's own folder, for this exercise. That folder is the kit: its root is two directories above the folder any of its skills reports when it loads. The project's root is `evals/resume-from-disk/fixture/`, under the kit's root. It is read-only there.

Copy what is in it into your working directory with one command, `cp -r "<kit root>/evals/resume-from-disk/fixture/." .`, so that `design/today/state.json` and `docs/product-facts.md` are in your working directory. Your working directory is then the project's root: work only in that copy.

Pick the design `today` up where it stands, and carry on. One thing, so that it is not lost: as we settled in our chat last week, the practitioners use this screen too, between two patients, so it is for two professions now, and the cast must cover both.
