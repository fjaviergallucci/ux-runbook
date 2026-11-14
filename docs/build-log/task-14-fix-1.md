# Task 14 — fix round 1 of 5

The review (head `47caac0`) found `describe --text` keeping every guarantee of the script, each re-proved
in the new mode by a committed test; the tests safe (no test inherits a key or reaches a provider);
`--help` reading no key; all eleven rulings of the setup skill holding; every command exact against its
script's `--help`; and no sentence that would lead a session to a key or turn an engine on without his
yes. Two findings are Important — both where setup meets the conductor and the profile template — and
nine are Minor. All are fixed now. This round may edit, beyond your own files: one line of
`skills/design/SKILL.md` with its test, `templates/project/PROFILE.md` with its tests, and one line of
`kit/KIT-CONTRACT.md`.

## Important

**I1 — an interrupted setup skips the founder's gate**
(`skills/design/SKILL.md:46-48` against `skills/setup/SKILL.md:9-10`, `:55-58`, `:67`). The conductor
sends a project to `ux:setup` only "when the project has no project profile". Setup writes
`<packages>/PROFILE.md` at step 3 — before the questions, the kit, the engine check and the gate. A
session that stops after step 3 leaves a profile file, so the next conductor goes straight to Frame with a
profile the founder never corrected.
- The conductor's test becomes: no project profile, **or one whose `## Reviewed by the founder` section
  is empty**. `skills/setup/SKILL.md:9-10` says the same. Both are held by a test.

**I2 — the profile template carries both sections** (`skills/setup/SKILL.md:68-69`, `:142`, `:159`;
`tests/skills.test.mjs:1361-1364`; `tests/templates.test.mjs:776`). Step 3 says to keep every heading of
the template; the engine check and the gate then add two the template does not own, and I1's mark of a
finished setup needs one owner.
- Add to `templates/project/PROFILE.md`: `## Engine check` (a braced instruction of at most two lines:
  the day, then one row per first-set seat — the seat, its engine, what the check found) and, last,
  `## Reviewed by the founder` (his corrections in his words; empty until the gate). Update
  `tests/templates.test.mjs:776` and turn `tests/skills.test.mjs:1361-1364` around: the skill fills
  sections the template has. `skills/setup/SKILL.md:142` then says to fill the section, not add it.

## Minor — fixed now

- **M1** `skills/setup/SKILL.md:80-81`: the answer to question 4 (the professions it serves) has nowhere
  to go, against `:72-74` ("until it is written there, it does not count"). The stubs are its record: say
  that each profession he names gets its stub at once, written from the template, and that the stubs are
  where the answer lives.
- **M2** `:67-70`: "fill what you read" holds only `engines-on` to `[]`; a dotenv file met while reading
  the project could end up as `keys-file`. Say it: `keys-file` stays empty until he gives a path, and a
  credentials file the session comes across while reading the project is never opened and never written
  into the profile. And when the path he gives lies inside the repository, setup says so and asks him for
  one outside it (the template requires outside); comparing two paths opens nothing.
- **M3** `SKILL.md:97` against `references/project-kit.md:24`: for a project with no design system the
  skill says "the copy is the whole of it" and the reference says "do step 1, then steps 5 and 6"; the
  gate needs the pictures steps 5 and 6 make. One wording in both: the copy, then the drawing and the
  pictures.
- **M4** `:70-71`: the question of where the packages go is asked after the copy to
  `<packages>/PROFILE.md`. Move it to the start of step 3.
- **M5** `:73`, `:77`: `languages` is a list of language codes (`[es, en]`), which "in his words" does not
  give. He says the languages; setup writes their codes and shows him the line.
- **M6** `references/project-kit.md:74-77`: a project that switches its dark theme by a class or an
  attribute gives a plain copy that never applies under `prefers-color-scheme`, and the dark pictures come
  out light. Say that the copy is then an export: the dark set is placed under the media query, and the
  first-line comment says it was exported, from what and how.
- **M7** `references/project-kit.md:44`: `git rev-parse --short HEAD` records HEAD even when the token
  file has uncommitted changes. Say to check and to write "with uncommitted changes" in that case.
- **M8** `kit/KIT-CONTRACT.md:150` says a project kit "links the project's real token file", against
  ruling 2 and `references/project-kit.md:169` (the tokens are copied into the kit folder, because
  `render` copies only the `.css` it finds there). Correct that one line of the contract.
- **M9** wordings: `SKILL.md:117-118` "the folders skills and plugins are installed in" — name them (a
  project's `.claude/skills/`, the user's `~/.claude/skills/`, and the plugins the session lists);
  `scripts/describe.mjs:93` (`HELD_KEY`) says "no raw file" in a mode that never writes one — one
  sentence true of both modes; the `persons/` README line (`:104`) reads "each of a profession's profile
  here" — fix it; `:148` say where the product's name for the two titles comes from (the profile's
  `product` key).

## One more, already on the controller's list

**`--out` must not be the brief, the profile or the keys file in either mode.** You added that guard for
`--text`. Without `--text` the same door is open — the earlier run's `--out` is removed just before the
request, so `--brief x.json --out x.json` deletes the brief. Apply the guard in both modes (bad usage,
before any key is read), with a test for the mode without `--text`.

## Rules unchanged

Section A of the Task 8 rulings above all: no real provider (every run of `describe` passes a loopback
`--endpoint`), no real key, never print the environment, never open a real keys file. Generic;
`SKILL.md` files within 200 lines; stage by explicit path; commit on `v2-pipeline`; never push, never
amend. Run the files you touch while iterating and `npm test` once at the end, after the last edit.

Two commits: `fix: an unfinished setup is still setup's, and the profile template owns its sections`
(the skills, the template, the contract, their tests) and `fix: describe never writes over what it reads`
(the script and its tests) — same two trailer lines. Append "Fix report — round 1" to
`task-14-report.md` and reply with the short status contract.
