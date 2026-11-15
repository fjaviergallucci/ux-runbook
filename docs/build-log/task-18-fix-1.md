# Task 18 — fix round 1 of 5

The review (head `0e55e73`) found both skills' form, every command, all fifteen rulings, the guide (it
names no file outside the folder) and the anti-patterns (version 1's lists row for row) holding; the
hand-overs following each card; no step that writes or prints a credential; the gate's material kept out
of the folder. Four findings are Important, a fifth is made by two of my rulings pulling against each
other, and thirteen are Minor. All are fixed now. Paths are under `skills/` unless another is given.

This round may edit, beyond your own files, exactly: the carry rule of `intent/SKILL.md` and of
`cast/SKILL.md`, one sentence of `design/references/loop.md` — each with its tests and pins kept exact —
and it adds one script with its tests.

## Important

**I1 — the folder is told to write paths into the package and the gate folder.** `handoff/SKILL.md:113`,
`handoff/references/folder.md:158` and `:174-175` have the count line `accept` printed
(`…; results in design/today/07-handoff-gate/results.json`) and the full command written into
`ACCEPTANCE.md` and `COVERAGE.md`; `SKILL.md:110` puts the reason "beside the command". Followed
literally the folder names the package and the gate folder the cold implementer must not open. Write only
the counts and the day; give a command, where one is given, relative to the folder; the reason for an
`--allow-errors` is a sentence, not a command line. The run-through must fill these two files by the
skill's rule, not copy templates, and assert no path leaves the folder.

**I2 — nothing proves the folder's pages load only what is inside the folder.** `folder.md:59-61` says the
prototype run "proves it, since a page whose stylesheet does not load fails". It does not: `06-look/screens/`
and `07-handoff/prototype/` sit at the same depth, so an unchanged relative link still loads the project's
file — the reviewer left the link at `../../../kit/tokens.css` and got 8 of 8 passing. Any other link a
Look page carries survives silently, and `tokens.css`, moved to another depth, breaks or leaks its own
`url()` and `@import`.
- **Ruling R148 — a kit script proves it, and this round adds it:** `scripts/alone.mjs`, built on
  `scripts/lib/cli.mjs`, test-first in `tests/alone.test.mjs`. `node scripts/alone.mjs <folder>` reads
  every `.html` and `.css` file under the folder and lists every `href`, `src`, `srcset`, `url()` and
  `@import` it finds; each must resolve to a file **inside the folder**. It prints one line for each that
  does not — the file, the reference, and why: it leaves the folder (`..` past its root, an absolute
  path, a `file:` address), it is remote (`http:`, `https:`, `//`), or the file is not there — and exits
  1 when there is any, 0 when there is none, 2 on bad usage. A fragment (`#x`), a `data:` address and a
  `mailto:` are passed over; a link between two pages of the folder is fine. Paths with a space work.
  Handoff runs it after the copy and before the prototype checks; what the token file loads (fonts,
  images) is copied into the folder beside it with the reference rewritten, or the reference is listed in
  `HANDOFF.md` under what the builder must supply — the skill says which, and never leaves one unsaid.
  `folder.md:59-61`'s false sentence goes.

**I3 — the cold implementer's re-read is not cold.** `folder.md:182-183` and `handoff/references/seats.md:57-59`
write its row and its items, with what became of each, into `COVERAGE.md` inside the folder at step 9;
the one re-read (`SKILL.md:132-133`) then reads them. Its row and items are added to `COVERAGE.md` only
after its last read.

**I4 — the correction's check cannot be run and is never proved.** `handoff/references/forms.md:58-61`
says "write the one check" but names no file, in a form whose steps 3–9 do not run;
`validateAcceptance` requires a `page`, and a correction has no prototype page; Acceptance's
`forms.md:48-49` runs it "as steps 4 and 5", and the reviewer's walk got the command refused.
- **Ruling R149.** No script checks a correction. Its record is the before-and-after picture and the
  one-paragraph record Detail wrote; Handoff's correction form writes no `acceptance.json` and says so;
  Acceptance's correction form compares the build with the "becomes" side by eye, takes the after
  picture, and writes the result into `REPORT.md` as one item that *matches* or *deviates*. Both forms
  say that the conducting session, which applied the change after his nod, also accepts it — the one
  case where "you did not build it" (`acceptance/SKILL.md:7-8`) does not hold (M1).

**I5 — Acceptance opens what no carry list hands it** (`acceptance/SKILL.md:35-37`: the cast sheet's
"Acceptance" table with its person and profile lines, and the intent's "Tasks for the audience"), against
`design/references/loop.md:39-47`. My rulings 4 and 13 could not both hold.
- **Ruling R150.** The conductor's loop step 2 gains one sentence: Acceptance runs in a session of its
  own, after the build, and reads the handoff folder, what the build wrote back, and — of the package —
  only the cast sheet's "Acceptance" table with the person and profile lines it names, and the intent's
  tasks for the audience. The skill's narrow reading stays as it is.

## Rulings on the open points

- **R151 — the context reaches the handoff.** `intent/SKILL.md:141-143`: Intent's carry also names
  `context@<version>#the-problem-and-why-now`, `#what-exists-today` and `#what-it-must-not-become` (the
  stamp accepts them; the later stages carry Intent's lines on as they are). `folder.md`'s table of what
  Handoff opens gains the row, and `HANDOFF.md` is filled from them — "not carried" goes.
- **Every seat is covered.** `cast/SKILL.md:155`: Cast's carry also names the intent's "What the readers
  found" and the section of the context that holds the as-is read, so `COVERAGE.md` covers the seats of
  Context and Intent too; `folder.md:40` no longer says they are left out.
- Accepted as built: the sibling folder `07-handoff-gate/`; the folder's `prototype/` being the final
  screens; a correction stamped at both stages in the words of its one nod.

## Minor — fixed now

- **M2** `acceptance/SKILL.md:145-151`: after an accepted deviation the folder contradicts itself. The
  deviation is appended to the folder's own `07-handoff/DECISIONS.md` as well as the package's;
  `HANDOFF.md`'s "Must not change" and `ACCEPTANCE.md` say, beside the item, that the build as accepted
  differs from the page that item names, and the changed check is rewritten to hold the build as accepted.
- **M3** Never `acceptance/SKILL.md:177` ("or with a state not driven") against `references/driving.md:31-33`,
  `:48-49`, `:86-88`: "not driven and unexplained".
- **M4** `folder.md:195-196`: `HANDOFF.md`'s "Verify" needs the project's gate commands and nothing
  carried supplies them. Name the source to read now (the project profile's standing rules and the
  project's own documents), and say that a command not found there is asked of the founder, never
  guessed.
- **M5** `folder.md:135-136` says every row of `measures.md` has its check, but no check type measures a
  gap. Say how a gap row is held: listed in `ACCEPTANCE.md` as one a person measures, with the value.
- **M6** `acceptance/references/seats.md:46-49`: a seat's earlier ledger may be in `04-structure/reads/`
  too.
- **M7** `acceptance/references/seats.md:171`: a kit person has no carry line; her card is at the kit's
  `pool/persons/` path the cast sheet names.
- **M8** `handoff/SKILL.md:122-123` says "one of three ways" where `seats.md:46-52` gives five: one count.
- **M9** `06-look/reads/*-beside.md` and `*-borrow.md` feed `COVERAGE.md`'s findings, where fresh versions
  would be described by letter. Say how they are entered: under their seat, the version named by what it
  was ("a fresh version, not handed off"), never by letter or maker.
- **M10** `acceptance/references/seats.md:132-137`, `SKILL.md:32`: files `BUILD.md` lists are handed or
  read except settings files and anything that holds a sign-in.
- **M11** `acceptance/SKILL.md:42-44`: Acceptance appends to the package's `DECISIONS.md`; allow it to
  read that file's last entry for its number.
- **M12** `HANDOFF.md`'s "What is in this folder" table has no row for `tokens.css`; the skill adds it
  (`handoff/SKILL.md:56`).
- **M13** `handoff/references/seats.md`: the cold implementer will raise `../build/` on every run; say how
  it is closed (the one way out of the folder, named in `HANDOFF.md` as where the build writes back).

## Rules unchanged

Generic; each `SKILL.md` within 200 lines; no credential ever written or printed; never a keys file,
`--endpoint` or an engine turned on; stage by explicit path; commit on `v2-pipeline`; never push, never
amend. Run the files you touch while iterating and `npm test` once at the end, after the last edit.

Two commits: `feat: a command that proves a folder stands alone` (the script and its tests) and
`fix: the handoff folder names nothing outside itself, and Handoff and Acceptance's smaller findings`
(everything else) — same two trailer lines. Hand-mutate the script. Append "Fix report — round 1" to
`task-18-report.md` and reply with the short status contract.
