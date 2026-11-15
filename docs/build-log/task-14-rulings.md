# Task 14 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

1. **The tests of `tests/skills.test.mjs` already exist** (Task 13): un-`todo` the `setup` ones. The
   skill's header writes `description: "…"` in double quotes with the text of Task 13's table verbatim;
   it carries the kit-root sentence exactly as Task 13 fixed it; at most 200 lines; it names only paths
   that exist today. Read `skills/design/SKILL.md` and its `references/` first: setup is called by the
   conductor and must use its words for the same things.
2. **The project's token file goes inside the project kit folder.** `scripts/render.mjs` copies every
   `.css` it finds in the kit folder next to the pages it draws, and nothing else: a `kit.css` that
   imports tokens from elsewhere in the project draws unstyled pages. So `references/project-kit.md` says:
   the tokens are copied (or exported) into `<packages>/kit/` as one CSS file beside `kit.css`, with a
   first-line comment recording the source path and the commit it was taken from, and the kit is rebuilt
   when the tokens change. Read `scripts/render.mjs`'s header and `kit/KIT-CONTRACT.md` and give the
   commands as the scripts take them (`render`, then `shots` for the founder's look at `parts.html`).
3. **Outside engines are the founder's to turn on, and setup never touches a key.**
   - Setup asks, as one of its questions, whether a brief may be sent to an outside model. Only on his
     yes does it write the provider into the profile's `engines-on` (in the card's own spelling:
     `model:openai`, `model:gemini`; `tool:stitch` for the screen generator), with the model's id in
     `openai-model` / `gemini-model` as he gives it.
   - The profile's `keys-file` is a path **he** gives, to a dotenv file outside the repository. Setup
     writes the path into the profile and does nothing else with it: it never opens that file, never
     lists it, never puts its path on a command line, and never asks for, prints or writes a key. The
     skill's `## Never` says each of these.
   - **Ruling R129 — `describe` gains `--text`, and this task adds it.** An answer that is not meant to
     be a proposal (an engine check here; a fresh pass at Look later) must not be reported as a failure.
     With `--text`, `scripts/describe.mjs` writes the answer whole to `--out` — which must then end in
     `.txt`, `.md` or `.html` — makes no proposal check, and exits 0. Everything else is unchanged and
     tested as before: the profile's leave first, the key found inside the script, the address rule, the
     timeout, no redirect, the held-key rule (an answer that holds the key is never saved), an earlier
     run's files removed just before the request, the one result line, no error body. Without `--text`
     nothing changes. Tests go in `tests/describe.test.mjs` under the rules of that file's header (a
     local server on 127.0.0.1, a made-up key, no test inherits a key, nothing contacts a real
     provider; **never print the environment and never open a real keys file on this machine**). The
     outside describer's card (`pool/makers/outside-describer.md`) is updated in its Look paragraph to
     use `--text`; the usage text of the script says what the flag is for.
   - The engine check for an outside model is then one call of `scripts/describe.mjs --text` with a
     one-line brief and `--profile`; the script finds the key itself. Exit 0 and its result line
     (provider, model, characters, seconds) are the proof that the engine answers; the file of the check
     is removed afterwards. A refusal is recorded in the profile as the script words it (it never shows
     a key). Setup never passes `--endpoint`.
   - The engine check for a skill is whether it is installed (read the folders, as the cards'
     `## Borrowed` did); for `tool:stitch`, whether the tool is listed — not a generated screen. For a
     browser, one run of `scripts/shots.mjs` on the kit's own `parts.html`.
4. **A shared machine:** any step that starts a browser goes through the kit's scripts, which start and
   stop their own; setup never stops a process by name or by pattern.
5. **The project's pool folders** are created empty, each with a one-line `README.md` saying what goes
   there and that a card is written to `pool/CARD-FORMAT.md` of the kit. The profession stubs are written
   from `templates/people/PROFILE-CARD.md` with every trait marked *guess*, as the brief says, and setup
   says in its gate that they are guesses until someone of that profession has been heard.
6. **Never invent a design system.** When the project has none, setup says so in the profile (the
   `tokens` and `components` keys stay empty) and the project kit is the grey kit as it is; Look will
   run in Direction mode (design § 4.6). When it has one, setup reads it — token files, component source,
   its documents — and never copies a component into the kit.
7. **One question at a time**, each about one thing, as the conductor's rules say; what he answers is
   written into the profile before it counts.
8. **Read of the design:** § 4.9, § 12 (the kit), § 15 (the profile), § 7's engine rules, § 24. Never
   the whole plan. Read `templates/project/PROFILE.md` and `templates/project/LESSONS.md` so the skill
   fills exactly the keys the template has.
9. Plain, short, second person; generic; examples from the fictional room-booking product.
10. **`setup` has the six sections its brief gives it** (`## Question` · `## Reads` · `## Writes` ·
    `## Steps` · `## Gate` · `## Never`). Task 13's test table does not hold `setup` to them (a ruling of
    the controller's said it had sections of its own; the plan's brief for this task is the authority).
    Change the table in `tests/skills.test.mjs` so `setup` is held to the six, with the inline sample that
    proves it, when you un-`todo` its tests.
11. **A seat's brief is written into the package's `work/` folder** (scratch: prompts and raw outputs,
    never an input), as the conductor's `references/loop.md` says. Setup starts no seat, but any file it
    writes while working that is not one of its outputs goes there too, or outside the project.
