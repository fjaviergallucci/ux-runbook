# Task 17 — fix round 1 of 5

The review (head `0495666`) found the form, the twelve rulings, every command and the carry from Structure
to Look holding under a real walk; the hand-overs close to card-exact; nothing of a fresh maker's surviving
past Look. Eight findings are Important; twelve are Minor. One Minor is deferred; the rest are fixed now.
Paths are under `skills/` unless another is given.

This round may edit, beyond your own files, exactly what is named below in: `pool/makers/` (four cards'
`reads`), `pool/audiences/task-reader.md` (`sits-at`), `skills/cast/references/presets.md` (rule lines),
`templates/outputs/LEDGER.md` (one line), `skills/design/SKILL.md` (one clause) — each with its tests and
pins kept exact.

## Important

**I1 — the beside comparison is not blind** (`look/references/fresh.md:88-90`, `:102-104`). Readers are
told the pictures come "each under a letter", but no step gives them letters: they are handed
`06-look/shots/today-default-en-1280-light.png` and `06-look/fresh/outside-openai-1280-light.png`, which
say which is fresh and which engine made it.
- **Ruling R142.** For the beside comparison the session copies the pictures — the system version's and
  each fresh one's — into `06-look/beside/`, under letters dealt at random (`A-1280-light.png` …), and
  writes which letter is which into `06-look/BESIDE.sealed.json`, beside that folder. Readers are handed
  `06-look/beside/` only; the sealed file, `06-look/fresh/`, `06-look/shots/` and `06-look/screens/` are
  on their "Do not open" for this read. The decision page shows the letters; the sealed file is opened
  only after his answer is written. Give the shuffle as a one-line `node -e` the session runs, or say
  plainly how the letters are dealt so that they do not follow the order of making.

**I2 — the fresh-pass ledgers have no path** (`fresh.md:79-92`; the main reads write
`06-look/reads/<seat>.md`). The beside read writes `06-look/reads/<seat>-beside.md` (as
`direction.md:67-68` does with `-directions.md`), and that file is on the main read's "Do not open".

**I3 — a resumed session can send the fresh brief without his yes** (`look/SKILL.md:72-74` resumes "at the
first step whose file is missing"; a present `BRIEF-fresh.md` reads as done). Add Structure's guard: a
fresh brief is not sent until `LOOK.md`'s `## Reviewed by the founder` holds his yes to it; on resume,
with the brief present and no yes, the session is at the brief's stop.

**I4 — variants are never photographed, measured or read** (`look/SKILL.md:100-101` runs `shots` and
`accept` on `screens/` only; step 9 makes each variant an option with its pictures, and `page.mjs` refuses
a picture that is not there). Variants are photographed into `06-look/shots/`, measured, and handed to the
readers with the final screens.

**I5 — makers at Detail and Look are not handed her card or her profession's profile**
(`detail/references/seats.md:22-24`, `look/references/seats.md:26-37`).
- **Ruling R143.** The conductor is right (`design/references/loop.md:94-97`,
  `templates/briefs/maker.md:30-33`): the interaction designer, the interface writer, the prototype
  builder and the visual designer are each handed her person card and her profession's profile, whole.
  The four cards' `reads` gain `person` and `profile` (`pool/makers/*.md`; the vocabulary has both
  names), so that cards, templates, conductor and skills say one thing. A describer and a fresh maker
  still get neither.

**I6 — there is no short form for a correction** (`detail/SKILL.md:135` points at `routes.md`, whose `:61`
points back). Add `detail/references/correction.md`: what `DETAIL.md` holds (the one thing changed, as
"is → becomes"; the one-paragraph record; where the before-and-after picture is kept —
`05-detail/correction/`), that the conducting session may make the change itself after his nod
(`routes.md:89-94`; `detail/SKILL.md:183` says so with the exception), that no seat is cast, the one nod
as the gate, and `built-from` as the route gives it. The run-through covers it.

**I7 — the carry leaves behind what Handoff's coverage page needs** (`look/SKILL.md:164-170`,
`detail/SKILL.md:166-171`). Detail's carry adds `- structure@<version>#what-the-readers-found` and
`- source:<package>/04-structure/reads`; Look's adds `- detail@<version>#what-the-readers-found`; both
keep the cast sheet's tables for every stage (so each seat's model reaches the coverage page).

**I8 — the fresh-pass readers at Look sit on no cast line** (`look/references/seats.md:150`, `:166-167`,
`fresh.md:86-90`).
- **Ruling R144.** Cast seats them: `cast/references/presets.md`, under "added by rule" — with a fresh
  pass at Look, the truth judge, the profile judge (when the people section names profiles) and one task
  reader read the beside comparison. `pool/audiences/task-reader.md` gains `look` in `sits-at` (its card
  says what it reads there: the lettered pictures, and it ranks them). `templates/outputs/LEDGER.md:56`
  — the Ranking section is kept at Structure and for a beside comparison at Look. And for a fresh pass
  asked for at Look's gate, when no line exists: the seat runs on its card's suggested model and effort,
  and the session says so to the founder at the fresh brief's stop (as
  `structure/references/rounds.md:107-111` does).

## Minor — fixed now

- **M1** `look/SKILL.md:126-127`, `:161-163`: after any later redraw, `measures.md` is copied into
  `LOOK.md` again before the stamp.
- **M4 → Ruling R145.** `fresh.md:91-92` has the system-fidelity borrow list read only after his choice,
  so he chooses without the cost. Two questions, one thing each: first he marks on the beside page what
  he would keep from a fresh screen; then system fidelity lists what the system lacks to make each thing
  marked (its `borrow-list` check); then he says what is borrowed, with that list beside the question.
- **M5** `design/SKILL.md:143-145`: one clause — a question a stage asked mid-way is put again by that
  stage's own skill, at the step that asked it.
- **M6** `<seat>-reread.md` collides for two profile judges: `judge.profile-<profile name>-reread.md`, and
  the same for their first ledgers.
- **M7 → Ruling R146.** `look/references/direction.md:94-95` sends the session to setup's
  `project-kit.md` steps 3-6, which has the session restyle the kit. After the direction pick: the tokens
  are written by the visual designer (a maker), never by the session; the project profile's change is
  put to the founder first and the kit is rebuilt only after his yes; he looks at the redrawn
  `parts.html` as setup's gate has him; for a rebrand of an existing system the new tokens are a new file
  the profile names, and setup's copy of the real token file is not overwritten.
- **M8** `fresh.md:86-87`: the truth judge is told to flag what "the brief did not hold", but the fresh
  brief is on its "Do not open". Point it at the context's inventory and the approved strings.
- **M9** short forms: with Structure skipped, the hand-overs do not name `<chosen>`; with no prototype
  builder cast, the carry does not name `prototype` or `shots`; and the flow size's "Detail and Look go
  surface by surface" (`design/references/routes.md:42`) is said in both skills, with what repeats per
  surface and what is stamped once.
- **M10** `look/references/seats.md:106` closes "the board" while the truth judge is handed `<chosen>`, a
  file of the board: say "but `<chosen>`".
- **M12** the questions `direction.md` asks mid-stage (`:30-34`, `:78-81`, `:96-101`, `:116`), and the
  confirmation of a hybrid, are each recorded with `await` and his answer written before the next step.
- **M13** Look's Writes table (`look/SKILL.md:50-61`) lists `06-look/tokens.css`, `06-look/earlier/`,
  `06-look/beside/` and the sealed file.

## Deferred — do not fix

M2 (rows `accept` cannot measure rest on the visual designer's own browser script; the real fix is a
check type for computed style in `scripts/`).

## Rules unchanged

Generic; each `SKILL.md` within 200 lines (move the long form into references); never a keys file,
`--endpoint` or an engine turned on; stage by explicit path; commit on `v2-pipeline`; never push, never
amend. Run the files you touch while iterating and `npm test` once at the end, after the last edit.

Two commits: `fix: makers know who they design for, and Look's readers are cast` (the cards, presets, the
ledger template, the conductor's clause, their tests) and
`fix: the beside comparison is blind, and Detail and Look's smaller findings` (the two skills, their
references, their tests) — same two trailer lines. Append "Fix report — round 1" to `task-17-report.md`
and reply with the short status contract.
