# Task 13 — fix round 1 of 5

The review (head `1c347fd`) found the description verbatim, all seven Never items present, every one of
seventeen commands exact against its script's `--help`, every named path real, sixteen rulings holding,
and the test pinning facts to their owners. Two findings are Important; fourteen are Minor and are fixed
now, because every later skill copies the conductor's words and is checked by this test. Paths are under
`skills/design/` unless another is given; "test:" is `tests/skills.test.mjs`.

## Important

**I1 — `SKILL.md:11` and `:152-153` contradict `references/routes.md:89`, `:94` on corrections.**
`SKILL.md` says "you propose no design and judge none" and, in Never, "…a judge never fixes what it found,
and you do neither." `routes.md` says, as design § 5 requires, that a correction is "the one size where the
session that conducts may also do the work" and "The same session may apply it after the nod". A session
reads the Never list literally: at a correction it would either refuse the work or cast a seat that
`routes.md:96` forbids. Add the exception to both lines of `SKILL.md`: …except to apply a correction after
his nod (`references/routes.md`).

**I2 — the test refuses a skill whose `references/` folder has a sub-folder (test:114).**
`ownReferences` matches `references\/[\w.-]*\w`, which stops at the first `/`: a stage skill that names
`references/presets/working-surface.md`, with that file present, gets
`names references/presets, which is not in the skill's folder`. `kitPaths` (test:111) already handles
nested paths. Match nested paths; accept a path that is a file of the folder, or a prefix of one followed
by `/`; add a nested sample at test:485.

## Minor — fixed now

In the skill and its references:
- **M1** `references/blind.md:97`: "the makers' files" is undefined, while `loop.md:94-95` writes every
  brief into `work/` and a maker's brief names its seat and lens. A reader's "Do not open" names `work/`
  explicitly, with the map, the pick and the proposals folder.
- **M2** `blind.md:121`: "The board holds … and nothing else" is not quite true and leaves out what must
  stay out. `render.mjs` copies the kit's stylesheets into the board. And nothing says that the decision
  page, its data and a fresh pass's gallery stay **outside** the board — a judge handed the board would
  otherwise see the fresh concepts as they came. Say what the board holds (the letters' files, the drawn
  pages, the kit's stylesheets that `render` copies, the pictures) and what never goes in it (the decision
  page and its `decision.json`, anything of a fresh pass, anything from `work/`).
- **M3 → Ruling R135** `blind.md:124-126`: rebuilding a board deletes "a board and its map", but `merge`
  also refuses while `PICK.md` is in the parent folder; after `Pick: none` and a reopen the next merge is
  refused. A board that is rebuilt is not deleted: the board folder, the map and the pick are **moved
  together** into `04-structure/earlier/<n>/` (the first rebuilt round is `1`), because the pick is the
  record of his words and the board is what he saw. Then `merge` runs on a clean `04-structure/`. Say so,
  and that nothing in `earlier/` is ever an input.
- **M4** `blind.md:88` against its own rule 2 (`:11-13`): `<kit dir>` is always the project's kit folder,
  the one its profile names — setup writes it in every project, and where the project has no design
  system that folder holds the grey kit unchanged. Make rule 2 say that, so the two agree.
- **M5** "profile" means two things and is never defined: the **project profile** (`PROFILE.md`:
  `SKILL.md:32-34`, `blind.md:63-70`, `:88`, `loop.md:168`, `routes.md:13`) and a **profession's
  profile** (a profile card: `loop.md:82-88`, `fresh-pass.md:48`). Read as the project profile,
  `loop.md:88` ("Makers and judges are handed the profile whole") would hand every seat the file whose
  header holds `keys-file`. Define both in `SKILL.md`'s opening, beside package, stage and seat — and
  define "card", "board" and "carry list" there too (used at `:97`, `:150`, `:162` before any
  definition). Use "the project profile" and "her profession's profile" throughout, and say once that
  **no seat is ever handed the project profile**.
- **M6** resuming an awaiting stage: `loop.md:16-21` and `SKILL.md:95` say "mark it in work" (`begin`)
  whenever `next` names the stage, but on an awaiting stage `begin` flips it back to in-work and resets
  its header to draft. `SKILL.md:126` does not say what follows his answer. Say it: on a stage that is
  awaiting, put the open question to him; on his answer invoke the stage's skill and go on from step 8,
  **without** `begin`. And loop step 1 says that Frame runs `init` before `begin` (today only
  `routes.md:7` does).
- **M7** `loop.md:126` "One fix round and one re-read, by default" against `:133` "There is no second
  round". One rule: one fix round, one re-read; what is still open goes to the founder with the gate.
- **M8** `references/fresh-pass.md:21-22`: the "Given" list omits what the template's two forms add (the
  hardest state in the Structure form; the one screen's approved items and words in the Look form). A
  session checking a brief against the list could cut them. Complete it, by form.
- **M9** who reads which brief is said two ways (`fresh-pass.md:19` "like any brief"; `loop.md:67` "At
  Structure, always"). One rule: he reads the Structure brief always, and every fresh brief, at Structure
  or at Look, since it may leave the machine; at the other stages a seat's brief is built from approved
  artefacts and he reads it when he asks.
- **M10** two rules of `loop.md` can collide (`:69`, `:82-83` "start the judges of a stage in one message";
  `:106-107` "never more than three browser-driving seats at once"). Say which wins: the limit — seats
  that drive a browser are started three at a time, the others in one message.

In the test:
- **M11** some wrong commands pass the command rule silently (test:122, test:249-251): a quoted script
  path (`node "<kit root>/scripts/state.mjs" valdate …`), a prompt-prefixed line (`$ node …`), and a
  command after `cd … &&`. Strip quotes before matching `scripts/<name>.mjs`, and treat any fence line
  that contains `node <…>/scripts/` as a command. The form check at test:766 (a command is written
  `node <kit root>/scripts/…`) applies to every skill, not only the conductor.
- **M12** valid Markdown refused loudly: a fenced command wrapped with a trailing backslash, and a choice
  written `<full\|short\|skipped>` in a table cell. Unescape `\|` before reading a command in a table
  cell; for a wrapped command, say in the rule's comment and in its error that a command stays on one
  line (and keep refusing it).
- **M13** `kitPaths` (test:111): a project path at the start of a fence line (`kit/kit.css`,
  `pool/profiles/front-desk.md`) is refused as a kit path, and indented trees pass for the wrong reason.
  The rule: a path of the **project** is written `<packages>/…` (or `<package>/…`), which the path rule
  passes over; a bare `kit/`, `pool/`, `templates/`, `scripts/`, `reference/`, `skills/` path is the
  kit's and must exist. Say so in the rule's comment and in its error message; add the two samples.
- **M14** the kit-shape pins (test:631-645) check `formsOf(...).length === 1` for `render`, `shots`,
  `page` and `describe`, and the exact spec of `page.mjs`. A later task adds a flag to `describe`
  (`--text`). Pin that each form the conductor **uses** exists and takes the flags it gives, not how many
  forms a script has.

## Rules unchanged

Generic; `SKILL.md` within 200 lines; do not edit anything under `templates/`, `pool/` or `scripts/`;
stage by explicit path; commit on `v2-pipeline`; never push, never amend. `node --test
tests/skills.test.mjs` while iterating; `npm test` once at the end.

One commit: `fix: a correction is the conductor's to apply, and the skill tests read nested references`
(same two trailer lines). Hand-mutate the changed rule functions. Append "Fix report — round 1" to
`task-13-report.md` and reply with the short status contract.
