# Task 19 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

1. **You do steps 1 to 4, then step 6 and step 7. Step 5 — running the evaluation suite — is the
   controller's, not yours.** Do not run `claude plugin eval .` on the suite: it starts paid model runs.
   You may run `claude plugin eval init --bare brief-has-no-design` (step 3: it only writes files) and
   `claude plugin validate . --strict`. If either asks for a sign-in, the network or anything it does not
   have, stop and report what it said; do not work around it.
2. **Every case is self-contained and safe to run unattended.** Its fixture lives under its own folder;
   its prompt names only paths inside that folder and the kit; it needs no network, no browser, no key and
   no outside model; nothing in a fixture is a key, a password or real data about a real person. The
   fixtures are the kit's fictional product (a room-booking tool for a small clinic's front desk). A
   case that plants a file the session must **not** open (the intent, for `audience-stays-blind`) plants
   it where the seat's brief says "Do not open".
3. **A grader states what would be seen, not what is hoped.** Each pass condition is a list of plain
   sentences a reader can check against the transcript and the files left behind: which file exists or
   does not, which command was or was not run, which words open a read, which file was not modified.
   Where the brief's condition says "stops", the grader says what stopping looks like (one question to
   the user, no `CHOSEN.md`, no file under `05-detail/`).
4. **The fixtures are built from the templates and checked by the kit's own scripts.** A fixture package
   is made by copying `templates/package/`, filling it, and running the real `scripts/state.mjs` verbs,
   so that `validate` says what the case needs it to say (three stages approved for `resume-from-disk`;
   a board built and no `PICK.md` for `no-pick-without-the-founder`). Add `tests/evals.test.mjs`: every
   case folder has the layout step 3 showed; every path a prompt names exists; each fixture package gives
   the `state.mjs validate` and `next` answers its case depends on; each fixture proposal passes
   `validate`; the two planted faults of `judge-does-not-redraw` and the two gaps of
   `cold-implementer-finds-the-gap` are really there.
5. **`LESSONS.md`** (the kit's own, at its root): the header and the seeded lessons as the brief lists
   them, each one dated entry, each true on any project, none naming a product, a person or a profession.
   It follows the entry shape `skills/design/references/lessons.md` gives.
6. **`README.md`** as the brief describes. It says plainly what the kit does not do by itself: it sends
   nothing outside the machine unless the project's profile turns an outside engine on; it never handles
   a key; a design package is a folder in the project. The install lines are given as the brief has them.
7. **The product-name scan** of `tests/pool.test.mjs` now also covers `evals/`, `LESSONS.md` and
   `README.md` (whole words, as ruling R3 fixed them).
8. `npm test` once before committing (about three minutes; one file at a time); the suite stays green
   with no `todo` left. Never kill a process by name or pattern; stage by explicit path; commit on
   `v2-pipeline`; never push, never amend.
9. **Read of the design:** § 14, § 15, § 20, § 23's first three rows. Never the whole plan. Read every
   `skills/*/SKILL.md` and the cards the cases exercise (`pool/judges/usability.md`, `profile.md`,
   `cold-implementer.md`, `pool/audiences/task-reader.md`) so each case asks for exactly what the kit
   says that seat or stage does.
