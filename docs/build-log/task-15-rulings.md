# Task 15 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

1. **The tests of `tests/skills.test.mjs` already exist** (Task 13): un-`todo` the four. Each skill's
   header writes `description: "…"` in double quotes with the text of Task 13's table verbatim; each
   carries the kit-root sentence exactly as fixed; the six sections in order; at most 200 lines; only
   paths that exist today. Read `skills/design/SKILL.md` with its `references/` and `skills/setup/SKILL.md`
   first, and use their words for the same things.
2. **Every command is given as the script takes it.** Read the header and `--help` of
   `scripts/state.mjs` (`init`, `begin`, `await`, `stamp`, `resize`, `route`, `validate`, `next`,
   `status`, `slug`) before writing a step that runs it. A stage's output is written from its template
   (`templates/package/00-frame.md` … `03-cast.md`): its `built-from` names the previous stage's
   artefact and version, its `## Carry` lists by path and version what the next stage inherits, and what
   the founder said at the gate is written under `## Reviewed by the founder` **before** the stamp.
3. **Ruling R125 — a project's own cards are checked before they are cast.** Add a thin command,
   `scripts/card.mjs`: `node scripts/card.mjs check <file…>` runs `validateCard` or `validatePerson`
   (by the file's folder: `makers|judges|audiences` or `persons`) on each file, prints each fault with
   its file, and exits 1 when any card has one, 0 when all are sound, 2 on bad usage — built on
   `scripts/lib/cli.mjs`, with tests in `tests/pool.test.mjs` (a sound card, a faulty one, a person, a
   file outside those folders, a path with a space). Cast runs it on the project's `pool/` before it
   reads the cards; a faulty card is reported to the founder and left out, never cast and never skipped
   in silence.
4. **Cast reads two pools:** the kit's `pool/INDEX.md` and the project's `<packages>/pool/` (its cards,
   its people, its profiles). A project card with the same id as a kit card replaces it for this
   project, and the cast sheet says so.
5. **Engines at Cast.** A seat whose engine is off or missing is shown with what it would add and that
   it is off — Cast never turns an engine on. An outside describer is cast only when the profile's
   `engines-on` lists a provider; the provider (`model:openai` or `model:gemini`) and the model id from
   the profile are written on its line of the cast sheet. A transcriber is cast whenever a screen
   generator is, and stands by whenever an outside describer is (for an answer that is not in the
   format). `presets.md` adds these three makers under the brief's table, as "added by rule".
6. **Model and effort are suggestions.** The cast sheet shows each seat's suggested model and effort
   from its card (a dash when the card says `none`), and proposes — in a sentence that says they are
   suggestions he may change — a judge or an audience on a different model from the maker it reads, and
   describers spread across models. Nothing in the skill refuses or rewrites a model he chooses.
7. **Frame** runs `state.mjs init` with the size it and the founder agreed, records whether the
   experience is for one profile, several or everyone, and lists the preset seats whose engine the
   profile's engine check (written by setup) shows as missing or off.
8. **Context is the one stage that reads the world, and it is careful what it copies.** Every fact
   carries its source (a path, an address, a date). A fact about configuration names a setting, never a
   secret value; nothing private about a real person is copied into the package; nothing is sent to an
   outside service to gather context. When the surface exists, its pictures are taken with
   `scripts/shots.mjs` where it can be opened as a page (give the command), or supplied by the founder;
   the as-is read is done by the judges whose cards sit at `context`, each started from
   `templates/briefs/judge.md`. The shared-machine rule applies: a browser is started only through the
   kit's scripts, and no process is stopped by name or by pattern.
9. **Intent** writes the person card from `templates/people/PERSON-CARD.md` on top of the profile and
   checks it with `scripts/card.mjs check`; the success criteria pass the test ported from version 1;
   each task is a starting situation and a goal, never the path; each of the ten states is filled or
   says "cannot occur because …".
10. **One question at a time**, about one thing; a gate is one message from him, written into the
    artefact before the stamp; nothing is shortlisted, detailed or drawn before the gate that precedes
    it. Each skill's `## Never` says what that stage is tempted to do (Frame: start designing; Context:
    have an idea; Intent: describe the interface; Cast: remove a seat silently later).
11. **Read of the design:** § 4.0–4.3, § 5, § 7, § 8, § 9, § 10 ("in the pipeline"), § 12 (the fresh
    pass), § 24. Never the whole plan. Read `pool/INDEX.md`, `pool/CARD-FORMAT.md`, `pool/MODELS.md` and
    the four templates so the skills fill exactly what the templates hold.
12. Plain, short, second person; generic; examples from the fictional room-booking product.
13. **What setup left for this task.** Each of the project's pool folders holds a one-line `README.md`:
    `scripts/card.mjs check` and Cast pass over a file named `README.md` (it is never a card). The project
    profile has an `## Engine check` section that setup writes: Frame reads it to list the preset seats
    whose engine is missing or off.

## After the implementer's first report — the controller's PROVISIONAL views (not yet rulings)

The session that conducted the build stopped here for usage limits, before Task 15 was reviewed. The
implementer raised eight readings. These are the controller's views, to be confirmed or overturned when
the review runs — give them to the reviewer as "accepted unless they produce a wrong result":

1. The four opening gates build no decision page: the stage's output is what the founder reads. A
   decision page (`scripts/page.mjs`) is for a choice between options (the pick at Structure, Look).
   If confirmed, one sentence of `skills/design/references/loop.md` (§ 7) should say so.
2. Frame runs `state.mjs init` only on his yes, and so has no `await`: no verb changes a kind or a
   foundation afterwards. Accept.
3. Context keeps the as-is pictures and the judges' as-is ledgers in `<package>/work/as-is/`. `work/` is
   scratch and never an input to a later stage; Context copies what the ledgers found, with its source,
   into `01-context.md`. Accept, but ask the reviewer whether an as-is ledger is a record that deserves a
   place of its own.
4. Cast's output is `built-from: [intent@1, context@1]` because the stamp refuses a carried context
   section otherwise. Accept.
5. Cast opens the `## Optional checks` table of each judge it seats, though `pool/INDEX.md` says Cast
   reads the index, not the cards. It must, to state the checks on and off. Accept; the index's sentence
   should then say "to choose seats".
6. `presets.md`'s readings under the verbatim table ("3 directions" is three visual designers until a
   direction-maker card exists; "task reader" alone is one instance; "(only if visual)" governs the whole
   Look cell; the words judge's own question is asked at its stage, not at Cast). Accept.
7. `scripts/card.mjs check` prints faults on standard output, as `state validate` does, and keeps
   standard error for bad usage. Accept.
