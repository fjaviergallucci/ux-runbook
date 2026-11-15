# Notes: Structure (conducted 2026-11-15)

Resumed from the package alone: `validate` printed `ok`, `next` printed `structure`, `status` showed
frame, context, intent and cast approved at version 1, no open question. `begin design/free-now
structure` printed `structure is in work`.

## Entries

1. **`skills/design/references/loop.md` l.39-43 and `skills/structure/SKILL.md` l.25 (read "exactly what
   its carry list names").** The carry list names sections (`intent@1#states`, `context@1#the-people`...)
   but the Read tool reads files, so the whole of `02-intent.md` and `01-context.md` came in, including
   sections not carried ("Tried and rejected", "The angles considered", the founder's question log,
   the intent's "Reviewed by the founder"). No script prints one section by its carry entry. Did: read
   both files whole, and drew the brief only from carried sections. Expected: a
   `state.mjs section <entry>` or similar, or the rule worded as "use only".
2. **`skills/structure/SKILL.md` l.33 ("Never today's screen") against the cast sheet's carry list,
   `03-cast.md` l.211 (`source:src/screens/day.html`).** Structure is told to read exactly what the
   carry names, and the carry names today's screen, which the same skill forbids. The cast sheet's
   "Blind rules" settles it for the describers only. Did: did not open `src/screens/day.html`; Never
   wins. Same tension as Cast's carry carrying it on unused.
3. **`skills/structure/SKILL.md` l.31 (read only one card, `outside-describer.md`) against
   `templates/briefs/maker.md` l.13, 25, 37, 51 and `templates/briefs/judge.md` l.13, 29, 46, 58** ("what
   its card says its brief gives", "only what the card's `reads` allows", "each thing the card's
   `never-reads` names", "what the card's Output says the reply is"). The templates need the card's
   header and Output section to be filled; the stage forbids opening any card but one. `references/seats.md`
   stands in for `reads` / `never-reads`, but nothing stands in for the Output. Did: filled reads and
   do-not-open from `seats.md`, and wrote the reply line as "What your card's Output says the reply is,
   and no more", leaving the seat to read its own card.
4. **`skills/structure/SKILL.md` l.31 (read `outside-describer.md`, "which speaks to you").** Read it as
   told, though the cast sheet casts no outside describer (`03-cast.md`, "Left out") and `engines-on`
   is `[]`. A read that the cast had already made moot; the skill could say "when the cast names it".
5. **`templates/outputs/decision.json` l.11-27 (the template's example options).** The conductor must
   read this template, and its three example options are designs of this very problem ("Free rooms
   first", "One list, every room", "The day as a grid", "a walk-in two clicks from the screen"). The
   conductor writes the brief after reading it, with "the session's own idea" banned from the brief
   (`blind.md` l.43). Did: kept every example out of the brief; noted as a contamination risk: the
   template's example is the kit's own rooms-free-now case.
6. **`templates/package/04-structure/BRIEF.md` l.28 ("The hardest state": "the one or two states").**
   The intent gives two candidates of equal weight, "Empty — filtered to nothing" and "Error —
   recoverable", and a third, "Overflow". Choosing which ones every proposal is played through is a
   design-weighting choice left to the conductor. Did: took the two the intent writes as "she must be
   told", and put the overflow rows under "the worst rows she would meet". The founder read it at
   step 4.
7. **`skills/design/references/blind.md` l.46-51 (cut what a describer could draw from).** My first
   draft gave the seeded day as a table, Room | Now | Its bookings, and the four states as a table:
   a table of rooms with their state now is itself a screen. Did: rewrote both as prose and a plain
   list. Worth a line in the template: "give the data as sentences, never as a table of rows".
8. **`templates/package/04-structure/BRIEF.md` l.32 ("the real labels") with `src/strings/en.json`
   `day.loadError`.** The real error string is "Couldn't reach the booking service. This is the list
   from {time}." Its second sentence names today's screen ("the list"), which no describer may see.
   Did: gave the first sentence only, and the facts of the second in plain words. A real-label rule
   and a no-today rule meet here; the template says nothing.
9. **`skills/structure/SKILL.md` l.77-79 (step 4: his yes "under `## Reviewed by the founder` of
   `CHOSEN.md`").** `CHOSEN.md`'s template has one instruction under that heading, "{What he asked to
   be changed on the way to Detail. "Nothing".}", and nothing for the brief's yes. Did: wrote the
   brief's yes above that instruction, as its own paragraph, and left the instruction for the gate.
   Answer used: "Structure · may this brief go out as it is?" — "Yes, it goes out as it is. No seat
   sends it off this machine."
10. **`templates/briefs/maker.md` l.37 / `skills/structure/references/seats.md` l.34-35 (the describer's
    "Do not open").** `seats.md` lists today's screen "as a picture or as source" and "everything else
    in the package", but not the project's design system, its tokens or the kit's parts, which a
    describer has no use for and which would bias it (the fresh maker's list has them, l.72-75). Did:
    wrote the seats.md list and "whatever is not listed above", which covers them.
11. **Makers, first SEATS stop.** Three `maker.structure-describer` seats (fewest steps, defaults first,
    in place) on `sonnet` at `medium`. The controller reported each wrote its proposal and its card's
    `validate` returned `[]`, with nothing unfit.
12. **`skills/structure/SKILL.md` l.98-100 (step 6: "Each file gets two keys, and nothing else is
    touched").** No command is given for tagging, and a JSON rewrite (parse, add, stringify) would touch
    every line's whitespace. Did: inserted `"track": "system", "engine": "own",` as text after the
    opening brace of each file, leaving every other byte as the maker wrote it; checked with a JSON
    parse. A `merge.mjs tag <file> --track --engine` would remove the guess.
13. **Step 7 ran first time, as written.** `merge.mjs` printed "merged 3 proposals into ...: A, B, C"
    and wrote `MAP.sealed.json` beside the board (not opened). `render.mjs` once per letter with
    `--kit design/kit`, each "with kit.css, tokens.css beside it". `shots.mjs ... --widths 1280,390`:
    "shot 6 pictures at 1280, 390 px, light". Pictures are full-page (390x4149 to 390x5074): a reader
    sees the whole page at once, not what is in view without scrolling, while criterion 1 of the
    intent is "without scrolling". Nothing in the skill says to take a viewport-only shot; noted for
    the readers' findings.
14. **`skills/structure/references/seats.md` l.124, 134, 146, 164 (the read's file name, `<seat>.md` /
    `<seat>-<name>.md`).** Whether `<seat>` is the full id (`judge.usability`) or the card's name
    (`usability`) is not said. Did: the full id, `reads/judge.usability.md`,
    `reads/judge.profile-front-desk-coordinator.md`, `reads/audience.task-reader-coordinator-between-calls.md`.
15. **`templates/briefs/audience.md` l.13 ("She reads: {her language}, at {the width}") against the
    intent's tasks.** Tasks 1 and 2 are at the desk computer (1280), task 3 on her phone (390); the
    template has one width, and `seats.md` l.159-160 says "the pictures of every letter at her width".
    Did: gave her both widths, each picture labelled with the tasks it is for.
16. **`skills/structure/references/seats.md` l.130-132 (truth judge handed: board, context, intent,
    facts doc).** Its on-check `numbers` is "until when a room stays free"; the seeded day,
    `src/data/sample-day.json`, is not handed, and the context holds the rules (P3 to P7) but not the
    bookings. It can check Room 1 until 10:30 and Room 5 until 12:00 (the intent's criterion 2) and no
    other time on the board. Did: handed what seats.md lists, nothing more.
17. **`skills/structure/SKILL.md` l.118-119 / `seats.md` l.99-101 ("the judges in one message, then the
    audiences").** Whether the audience waits for the judges to finish, or only starts after them, is
    not said; nothing she reads depends on a ledger, and a profile judge's "Do not open" names the
    audiences' reads as if they could exist while it reads. Did: one SEATS reply with the three judges
    marked to run together and the audience marked not to run beside them, so it starts after.
18. **The profile judge's brief, `templates/briefs/judge.md` l.34-35 ("its base and then the section of
    {the specialty}").** The person's specialty is `none` and the profile has no specialty section.
    Did: wrote "the section of no specialty" with the reason; a template line for `none` is missing.
19. **Traits copy for the audience (loop.md l.105-109).** Written with a small script removing each
    block from `So the interface must:` to the next blank line: 7 removed, 0 left, everything else
    identical (`diff`). At `work/structure-audience-task-reader-traits.md`. The profile's own preamble
    (l.12-15) still tells the reader that a fourth field exists and was taken out; harmless, noted.
20. **Readers, second SEATS stop.** Three judges in one message, then the audience (`sonnet`,
    `medium`). The controller reported the judges found nothing unfit. The audience reported two
    things, in its read's "For the conductor (dry run)":
    - **(a) The board's pictures carry the makers' notes.** `render.mjs` draws each proposal's `bet`,
      `cost`, `absent`, `hardest` and every screen and item `note` onto the page, so `shots.mjs`
      photographs them. `templates/briefs/audience.md` l.4-5 says she is given "nothing that says what
      the design means to do", and `seats.md` l.159-163 hands her "the pictures, and pictures only",
      which are these. The judges are meant to read the notes (they are handed the letters' files
      anyway); the audience is not. The usability and the profile judges also said the full-page,
      every-state-stacked pictures kept them from judging "without scrolling" by height. Expected: an
      audience picture without the notes, one per screen or state, at the viewport's height (a
      `render.mjs --bare` or a `shots.mjs --viewport`). Did: nothing to the kit; kept her read as it is,
      and put both limits on the decision page as open findings by seat, and in `CHOSEN.md`, "What the
      readers found". Why: no command of the kit makes a bare picture, and a picture I made by hand
      would be a render of mine.
    - **(b) "The traits file is the whole profile stub, not a traits-only extract."** The file is what
      `loop.md` l.105-109 says to write: the profile with each `So the interface must:` block removed
      (7 removed, nothing else changed, entry 19). What the audience took for "the whole profile" is
      the three trait fields of each characteristic plus the profile's preamble (l.11-19 of the
      profile), which explains the fourth field and that it was taken out, and `Evidence: guess` on
      every one. So the loop's rule and the audience card's idea of "traits" disagree, or the preamble
      makes the copy look whole. Her card's own header names `profile: profile.front-desk-coordinator`,
      so the id reaches her through her card either way. Did: nothing; the file is as the loop says.
      Expected: the loop to say whether the preamble and the `Evidence:` lines stay in the copy.
21. **The truth judge marked one finding `blocks`, on C** ("Nothing has changed since 10:19."). At
    Structure the gate is a pick, and `loop.md` l.143-146 says no option is mended first; the fix round
    (l.148-155) is for an approval only. Did: no fix round; the finding went on the decision page under
    `findings`, by seat. `SKILL.md` l.131-133 names only "a proposal left out, and a seat that did not
    answer or was held back" as `findings` lines; nothing says where a `blocks` on an option goes at a
    pick gate. Guessed: it is an open finding.
22. **`skills/design/references/loop.md` l.135-138 and `SKILL.md` l.130-133 (lay disagreements side by
    side; one line per seat; one sentence of reason).** The profile judge ranked B, C, A; the audience
    A, C, B: a direct split. `page.mjs` allows one line per seat and has no place for a disagreement as
    such; the reason is one sentence. Did: each seat's line gives its own ranking, so they stand side
    by side, and the reason sentence names the split. In `CHOSEN.md` the disagreement has its own
    paragraph.
23. **The recommendation.** `SKILL.md` l.130-132: it "rests on the reads, by letter". The reads split
    on ranking, so choosing B meant weighing a profile judge's read of a stub against an audience's
    read: a judgement of mine, though on the reads. Recommended B; one sentence naming the profile, the
    usability and the truth judges and the audience. Did not affect the pick: the answers file picks
    "the second", which is B on this page by coincidence of order (A, B, C).
24. **`page.mjs` and `await` ran first time.** "built ...decision.html: 3 options, 4 seats, 3 open
    findings, one question"; "structure awaits the founder". The page's one-question rule made me keep
    every "?" out of the seats' lines (the bets and the audience's task words carry none here).
25. **The gate.** Answer used: "Structure · gate: which structure goes on to Detail?" — "The second.
    It's a dry run: I'm testing that a pick carries through, not which way wins. Nothing to change on
    the way to Detail." Written to `PICK.md` as `Pick: B`, with a line that the second on the page is B.
    `merge.mjs open` then printed A `describer-defaults-first.json`, B `describer-fewest-steps.json`, C
    `describer-in-place.json`, each `system own`. Not used: "a board made again" (no late proposal)
    and "a fresh pass before the pick" (none was offered: Cast's "Fresh pass" says none, and
    `fresh-pass.md` l.13 says "You never add one yourself").
26. **`templates/package/04-structure/CHOSEN.md` l.43-46 ("Not chosen": "why it lost").** His words
    say no option lost on its merits: "not which way wins". Did: wrote "not picked" with his words, and
    beside it what the reads said of each, without saying it lost for that.
27. **`templates/package/04-structure/CHOSEN.md` l.35-36 ("each finding on the chosen structure that is
    still open").** The usability judge's findings are mostly written for "A, B and C" together or for
    "A, B"; I took every one that names B, including the shared ones. Fifteen open findings carried to
    Detail. A judge's own findings list per letter would remove the sorting by the conductor.
28. **Carry list (`SKILL.md` l.170-174).** Cast's 33 lines as they are (they include
    `source:src/screens/day.html` again, which Detail may now open: the blind ends at the pick, but no
    line says so); `cast@1#detail`, `#look`, `#handoff`, `#acceptance`, `#blind-rules`, `#fresh-pass`;
    and `source:` lines for `board/B.json`, its two pictures and `PICK.md`. No gallery marks. The stamp
    took it first time: "stamped structure approved at version 1 on 2026-11-15". The reads themselves
    are not carried (the skill lists no line for them), so Detail sees the findings only as
    `CHOSEN.md` restates them.
29. **`state.mjs await` leaves the artefact's header at `status: draft`.** I rewrote `CHOSEN.md` whole
    after `await`; `validate` printed `ok` before the stamp, and the stamp wrote `approved`. Nothing
    lost, but the header said `draft` while the state said `awaiting`.
30. **`DECISIONS.md`.** Appended D-05 in the template's shape. `pool/makers/outside-describer.md` l.47-48
    (after the pick, write in the lessons file whether its proposal was picked) does not apply: no
    outside describer sat.

---

Seats started: 7 (three makers; three judges; one audience).
Stops for the controller: 2 (makers; readers).
A session with no memory could pick the package up from here: `state.mjs validate` prints `ok`,
`next` prints `detail`, `status` shows no open question. It would read `04-structure/CHOSEN.md`
first, then what its carry list names (the cast sheet's Detail table, `board/B.json` and its
pictures, `PICK.md`, the intent's and the context's carried sections).
