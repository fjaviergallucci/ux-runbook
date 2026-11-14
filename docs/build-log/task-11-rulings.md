# Task 11 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

1. **A person card is checked by the same module as a seat's card.** Add
   `validatePerson(text, { file }) → string[]` to `scripts/lib/card.mjs`, beside `validateCard`, and
   prove every rule of it on inline samples in `tests/pool.test.mjs` (a good person, and one bad sample
   per rule), as Task 9 did for cards. A project keeps people of its own beside the kit's, and they must
   be judged by the same rules. The rules:
   - header keys, all required and no other: `id` (`person.<file name without .md>`), `profile` (a
     profile id or `none`), `specialty` (a name or `none`; it must be `none` when `profile` is `none`),
     `evidence` (`fact | guess | mixed`);
   - body sections, in this order and no other `##` section, each with text under it: `## The moment` ·
     `## The job` · `## What she never does` · `## The check`;
   - CRLF accepted.
   The five generic persons have `profile: none`, `specialty: none`, `evidence: guess` — they are
   archetypes, and each card says so in one line.
2. **`pool/CARD-FORMAT.md` gains a short section on the person card** (the keys, the sections, what
   `evidence` means), kept in step with `card.mjs` by the same kind of test Task 9 wrote for cards.
3. **`audience.task-reader`:** `loaded-with: person`; `never-reads` includes `intent` (it is handed the
   tasks, never the intent they came from) and whatever would tell it what the design means to do. Its
   `## Output` names `templates/outputs/TASK-READ.md` (Task 12) and says in a few lines what a task read
   holds; the `todo` test Task 10 added for named paths covers it. The caveat sentence of design § 11
   beginning "A simulated person agrees too easily" is in the card **verbatim**, and the card says it is
   written at the top of every read. Suggested model and effort `opus` / `medium`; `verified` 2026-11-14;
   **add its row to `pool/MODELS.md`**.
4. **The persons are people in a moment**, as the brief says: each `## The moment` is a scene (where she
   is, what just happened, what she has in her hands, what she is about to do) in the kit's fictional
   product — a room-booking tool for a small clinic's front desk — and never a list of traits or a
   demographic. `## The check` is the one question a maker or an audience asks of a screen on her behalf.
   No name of a real product, person or profession; a made-up first name is fine.
5. **Ruling R116 — the index lists the people too.** `pool/INDEX.md` has the table the brief describes
   (every maker, judge and audience card: `id`, `job`, `cast-when`, in shelf order, cells equal to the
   card's header) **and** a second table under `## People`: one row per file in `pool/persons`, columns
   `id` and `the moment`, the second being one line written for the index. Cast reads the index, not the
   folder, and must be able to see who can be seated. Tests: exactly one row per card and per person; no
   row without a file.
6. **The index test goes live** (remove its `todo`). The named-paths test added in Task 10 stays `todo`
   until Task 12.
7. **Read of the design:** § 8 (profile and person), § 11 (audiences), § 7 (the pool and the index), § 23.
   Nothing else of that document; never the whole plan. Read `pool/CARD-FORMAT.md`, `scripts/lib/card.mjs`
   and one judge card before writing.
8. Generic, plain, short: no card past about 100 lines; a person card is a page at most.
9. **The names used in `reads` and `never-reads` are a vocabulary** (added in Task 9, extended in Task
   10): reuse the names in `CARD-FORMAT.md`'s table and add a row for any new one the audience card
   needs.
