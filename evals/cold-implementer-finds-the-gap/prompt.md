---
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

You sit in one seat of the `ux` plugin's pool yourself, as the fresh sub-agent a conductor would start. You are not the conductor, and you start no one.

To learn where the kit is, load the skill `ux:design` once, and take nothing else from it. The plugin's own folder is the kit: its root is two directories above the folder that skill reports when it loads.

Your brief is `evals/cold-implementer-finds-the-gap/fixture/design/today/work/judge.cold-implementer.md`, under the kit's root. The project's root, for the paths the brief gives from it, is `evals/cold-implementer-finds-the-gap/fixture/`: it is read-only. What you write, you write in your working directory. Read the brief, and do what it says.
