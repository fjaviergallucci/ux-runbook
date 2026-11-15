# Task 11 — fix round 1 of 5

The review (head `eb015d2`) found the checker's refactor exact (263 comparisons of old against new, none
differ), the index equal to every card, the caveat verbatim, the five persons real scenes that each force
a design decision, and the audience card fighting easy agreement by method. Two findings are Important,
both about the audience's blind; five are Minor. All are fixed now.

## Important

**I1 — the audience is handed the profile's success criteria**
(`pool/audiences/task-reader.md:9`, `:29-30`; `pool/CARD-FORMAT.md:173`). Design § 8: a person "inherits
the profile", so the audience may know what is true of her profession — but the "So the interface must …"
lines are "what the judge evaluates", and § 11 forbids handing the audience the success criteria. The
card's `reads` holds `profile` whole, and step 2 only remarks that those lines "are a judge's". An agent
primed with "the interface must show X before she acts" will look for X.
- **Ruling R131.** The audience reads `profile-traits`, never `profile`. Add the vocabulary row:
  `profile-traits` — a profile with every "So the interface must" line taken out (what is true, who it
  does not hold for, the evidence): what an audience is handed. In the card: `reads` holds
  `profile-traits` in place of `profile`; `never-reads` gains `profile`; step 2 is rewritten — she is
  loaded with her person and, where the person has a profile, with its traits; what an interface should
  do about them is not hers to know. The test pins both lists.

**I2 — `never-reads` leaves out what holds the intent and the makers' reasoning**
(`pool/audiences/task-reader.md:10`). Ruling 3 requires "whatever would tell it what the design means to
do". `package` (every stage's folder, the intent included), `handoff-folder` and `build` ("what
deviates") all do; none is in the list, and `pictures` already covers screenshots of a build, so blinding
`build` costs the seat nothing. Add the three to `never-reads` and to the `blind` list of
`tests/pool.test.mjs:857`.

## Minor — fixed now

- **M1** (`task-reader.md:42`, `:44`): nothing covers an answer that comes back empty — she hesitates
  nowhere and finishes at once, the moment a simulated reader agrees too easily. Add one line: with no
  hesitation, name the nearest thing she could have pressed instead, and what on the screen told the two
  apart.
- **M2** (`task-reader.md:25-32`): her own job and the brief's tasks can differ (`daily-expert.md:24`
  moves a booking; a task may be to book a room). One clause: the tasks are the brief's; her job says
  what "done" means to her.
- **M3**: the two names that read as non-European sit on the two unfamiliarity roles (`first-timer.md:16`,
  `second-language-reader.md:16`) while the fluent roles have the others. The text ties no trait to an
  origin, but the pattern is there. Redistribute the names so that it is not (for example, give the daily
  expert or the keyboard user one of those two names), and keep each file's `id` as it is.
- **M4** (`keyboard-user.md:35`): "the paper chart" reads as a patient's record at a clinic;
  `first-timer.md:19` says "paper diary". Use one term.
- **M5**: four of the five moments share one pressure — someone waiting at the desk or a caller on the
  line (`first-timer.md:20`, `daily-expert.md:18`, `keyboard-user.md:19`,
  `second-language-reader.md:20`) — and two share the "won't press what may not be undone" line
  (`first-timer.md:33`, `second-language-reader.md:38`). Keep the waiting man for the first-timer and the
  call for the daily expert; give the keyboard user and the second-language reader moments with a
  different pressure of their own (for example: alone at the end of the day, moving tomorrow's bookings
  by keyboard as fast as she types; reading a message she must act on before she replies, nobody
  watching), and let only one card keep the undo line. `pool/INDEX.md`'s `## People` row for each changed
  moment is rewritten to match, and its test stays green.

## Rules unchanged

Generic; the fictional room-booking product; the audience card within about 100 lines, a person a page at
most; stage by explicit path; commit on `v2-pipeline`; never push, never amend.
`node --test tests/pool.test.mjs` while iterating; `npm test` once at the end.

One commit: `fix: the audience reads a profile's traits, never its criteria, and smaller findings` (same
two trailer lines). Append "Fix report — round 1" to `task-11-report.md` and reply with the short status
contract.
