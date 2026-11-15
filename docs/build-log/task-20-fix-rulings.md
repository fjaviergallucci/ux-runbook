# Task 20, step 5b — the controller's rulings on what the dry run found

The findings are in `task-20-findings.md` (items `F1`–`F111`, each with its owning file, what happens,
the notes that report it and, for a wording item, the change). These rulings bind with it. Where an item's
"Recommendation" and a ruling differ, the ruling wins.

## How the fixes are split

| Wave | Who | What |
|---|---|---|
| **A1** | one implementer | Every `wording` item `F1`–`F46`, and the words of the rulings below marked **A1** |
| **A2** | a second implementer, after A1 | Every `wording` item `F47`–`F111`, and the words of the rulings marked **A2**; then `docs/design/DRY-RUN.md` |
| **B** | a third implementer, after A2 | The scripts: the `mechanical` items and the rulings marked **B**, test-first |
| **final wave** | after the whole-branch review | The rulings marked **final wave**, with what was already parked (R39, R84, R108, R109, R132) and the deferred minors |
| **not built** | — | The rulings marked **follow-up**: written into `DRY-RUN.md` as what the proving run should decide |

A wording item is fixed in the file that owns it, in the kit's own words for the same thing, and stays
inside each file's limits (a skill at most 200 lines; a card about 130): where a fix adds lines, cut
elsewhere in that file. `tests/skills.test.mjs` and `tests/pool.test.mjs` pin many sentences: read what
they pin before changing a sentence, and change the pin with it only where the ruling changes the rule.

## The rulings

**R159 (F3) — a build with no driver. A2.** When the project profile's "How a browser check is run here"
names no script, Acceptance says so to the founder and, on his yes, writes the project's driver in the
project (one script), on the kit's `scripts/lib/browser.mjs` (which starts and stops its own browser), and
writes its command into the profile. `skills/acceptance/references/driving.md` gains what such a driver
must do for each state (open it as `STATES.md` says, evaluate the in-page file, call `window.__uxAccept`,
write what comes back as it came, take the picture), and its "neither signs in" sentence is reworded: the
kit's file-opening commands are not for a build that needs a session or a server; for a build that opens
as files they are not forbidden. Handoff copies `scripts/inpage/accept-inpage.js` into the folder (as
`accept-inpage.js`), `HANDOFF.md`/the implementer's guide say what it is for, and the sentence "the
builder has no kit" stays true. Setup's question about the browser check says that "no script" is an
answer and what follows from it. — if wrong: a driver written on a library that changes breaks; the
library's header is its contract.

**R160 (F6) — where the conductor selects. A1 for setup; A2 for the rest.** At Structure ("the hardest
states") and Detail ("the worst plausible rows") the selection is by a written rule, not by weighing:
every state the intent says she must be told about, and every row that states a limit, a delay or a
failure. At setup (tokens for a part the system lacks) and at Handoff (a default for an item nobody
decided) the conductor may write what it would take, marked "the conductor's proposal", and he decides
each; an undecided item that changes what she sees or can do is put with its options, never with a
blanket default. — if wrong: a rule hands a maker more rows than it needs.

**R161 (F8) — the grey kit's words. B.** The specimen page of `kit/grey/` holds neutral words that name
each part ("Row title", "Status", "Primary action"), and times, where a part shows one, in 24-hour
zero-padded form. No product's nouns. The tests that read the specimen change with it (Task 3's deferred
minor about its room name closes here). `skills/context/SKILL.md` says the kit is never a source of
facts about the product (F24, A1).

**R162 (F9, F57) — a profession's profile is checked, and its traits copy is made by a command. B, with
the words in A2.** `scripts/card.mjs check` takes a file in `profiles/`: its id is `profile.<file name>`,
it has the template's headings, and the "So the interface must" labels stand at the start of their
lines. A new verb, `node scripts/card.mjs traits <profile> --out <file>`, writes the audience's copy: each
"So the interface must" field removed, and the template paragraph that explains that field removed with
it; it refuses a profile that fails `check`, and refuses when a label is left in what it wrote. `loop.md`
and the four skills that make the copy by hand use the command (A2 writes the sentence; if B lands the
command under another spelling, B corrects the sentence). — if wrong: one more verb to keep.

**R163 (F12) — Frame before his yes. A1.** As built: Frame writes nothing before his yes, and a session
that resumes with no package frames the request again. `loop.md` names Frame as the one stage with no
`await`, and Frame's step 1 says so.

**R164 (F18) — his words, asked once. A1.** Context always asks one question about words: what she calls
these things, and any word she must never see. "None" is an answer. This replaces the test "or she must
read in order to act". (Design § 4.1 "asked for here when the words will matter" becomes "asked here,
once" — the controller amends the design document.)

**R165 (F21) — a source he has corrected. A1 for Context, A2 for the brief and Handoff.** The source is
still carried; the context's row says which point he corrected and that the context holds. The truth
judge's briefs carry one line: where the context and a carried source disagree, the context holds. Context
logs the stale fact, and Handoff's slices include one to mend the document.

**R166 (F22) — what he says of the profession. A1.** Written into the profile at Context's gate, marked
`guess (the founder, <date>)`: it reaches the profile judge, and it stays a guess until someone of that
profession has been heard.

**R167 (F31) — Intent's profile judge does not read the person card. A1.** As the design has it (§ 4.2).
The skill and the brief say the card is not this read's; the judge card's step 6 at Intent is narrowed to
the skill's one question; Intent's gate says the person card was read by no seat.

**R168 (F34) — a profile with few "must" lines. A1.** The offer of the profile judge says how many "So the
interface must" lines the profile holds.

**R169 (F35) — a `should` is not mended by the conductor. A1.** Only `blocks` is mended before a gate; the
rest goes to him open. Say it once in `loop.md`.

**R170 (F36) — a stage's header is also valid YAML. B.** `stamp` writes a value that holds a double quote
in single quotes, a single quote inside it doubled; `scripts/lib/frontmatter.mjs` reads that form; his
words are never changed. The header's own description says the grammar is a subset of YAML and names the
two quoted forms.

**R171 (F52, with R154) — what a reader is shown. B, with the words in A2.** Two things, one fix:
(1) R154 — a page drawn for readers who must not see the makers' notes: `render.mjs` gains a way to draw
the board without the bet, the cost, "deliberately bad at" and the screen and item notes, and the
audience's pictures are taken from those pages; the judges' pictures stay as they are. (2) `shots.mjs`
gains a picture of the first screen only (the window's height, no scrolling), beside the whole page; the
briefs say which picture answers "without scrolling". Structure's skill and its seats page hand the
audience the pictures without notes. — if wrong: twice the pictures at Structure.

**R172 (F59) — the seats split. A2.** One recommendation still, and its reason says that the seats rank
the options differently and that he settles it. One sentence in `loop.md`.

**R173 (F60) — where the one question is counted. B.** `page.mjs` counts question marks in `question`
and `recommendation` only; a seat's line or a finding may quote a question.

**R174 (F64) — one question per list. A2; the controller amends the design document.** A list a maker or
a reader returns (dependencies; states the intent does not name; what the structure cannot hold; facts a
string waits for; items nobody decided; deviations) is put to him as one question: the entries numbered,
each with what follows from each answer, answered by number in one message, one `await`. An entry he
leaves unanswered stays open and is listed so. What step 8 of the loop catches — an answer that meets a
standing rule, a fact of the product or an output he approved — is still asked on its own, at once. The
rule "one question about one thing at a time" stands for everything else: a list is one thing.

**R175 (F66) — a breach he accepts is part of what was approved. A2.** `DETAIL.md` and `LOOK.md` gain a
section "Accepted deviations": each one, the standing rule or the line of the intent it breaks, his
words, the date. It is on the carry list; every judge from that stage on is handed it as part of what was
approved (never the audience); Handoff copies it under "Must not change" and Acceptance's judges are
handed it. A judge that still finds the same thing writes it once, as "accepted at <stage>", and it is
not sent to a fix round nor counted as blocking; the decision page lists it under its own heading. The
stamp step names each accepted deviation in the package's `DECISIONS.md`. A finding of which only a part
rests on an accepted deviation is split by the conductor into its parts, each quoted in the judge's
words. The judges' cards gain one line: what the brief lists as an accepted deviation is not a finding
again.

**R176 (F70) — when the writer's "Nothing to say" round ends. A2.** An entry the designer settles as "no
line owed" is closed; an entry he has already answered is not sent round; one fresh writer takes his
facts and the settled entries together.

**R177 (F78) — more pictures than a seat opens. A2.** The brief names first the pictures the seat's
checks or her tasks need; the ledger's "Not looked at" lists what was not opened (as now). Where there is
one option, no ranking is asked: the audience's brief and card say what is asked in its place.

**R178 (F84) — Look's send-back. A2.** Once for each run of step 5: a fresh visual designer, handed the
rows that differ as facts, by result id and measured value. The conductor writes no value. "There is no
second round" is about the readers' fix round; say which is which in the skill and in "When it is
started again". A script that writes the measured column waits for the computed-style check (deferred).

**R179 (F89) — every element that shows text has an id. A2.** The interaction designer's card: every
element that shows text or takes an action carries a `data-ux`, status tags included.

**R180 (F93) — nothing points back. B, with a card line in A2.** `alone.mjs` gains `--package <folder>`:
it then also reads every text file of the folder (Markdown, JSON, CSS and HTML comments included) for the
name of any file or folder of the package that the handoff folder does not itself hold, and refuses with
each place. Handoff runs it so. The makers' cards gain a line: write no pointer to another file of the
package into a page, a stylesheet or a strings file. Where an approved file holds one, Handoff says where
in `PARTS.md` and does not rewrite the approved file (as the run did).

**R181 (F99) — closed after the re-read. A2.** Closed, and listed on the decision page as "closed after
the re-read, not read again".

**R182 (F101) — no script for Handoff's mechanical part yet. follow-up.** The run showed the cost (21
minutes, five scripts of the conductor's own). What that script should hold depends on a real project's
strings format and build; the proving run decides.

**R183 (F103) — what the checks cannot see. A2 now; check types for behaviour are a follow-up.** The
decision page's count line at Acceptance says what the scripted checks do not see (nothing is pressed,
loaded, sent or focused), and points to the keyboard pass and the builder's deviations; `STATES.md`'s
template says a row must lead to the state's behaviour, not only to its picture.

**R184 (F109) — what a stamp guards. final wave.** The stamp hashes every file of the stage's folder
(passing over what a mount or an operating system leaves behind, as R132 lists), and `validate` reports a
change to any of them; `reopen` names the stages it recalled. With R39, in `scripts/lib/state.mjs`.

**R185 (F85) — a check for sizes, gaps and line lengths.** Already deferred (Task 17, M2): final wave.

## Mechanical items

`F62` (validate passes a header that says `draft` while the state says `awaiting`) — **B**.
`F94` (the SPEC template's States table lacks two columns of the states template) — **A2**, with a test
in `tests/` that the header holds every column of the other plus "Its page".
`F96` (the `text` check joins blocks with nothing between) — **B**.

## What is not fixed, and why

Items sorted `rig`, `cannot-show`, `works` and `not-so` change nothing in the kit. They are written into
`DRY-RUN.md`.

## Added after wave A2 (for wave B)

**R186 — an accepted deviation has its own heading on the decision page. B.** A finding in a decision's
data may carry `accepted` (the stage it was accepted at, as `"detail"`). `page.mjs` draws such findings
under a heading of their own, "Accepted deviations", after "Open findings", and does not count them as
open. The template JSON files and their `--help` say so; the skills' sentence (A2 wrote that such a
finding's `seat` reads "accepted at <stage>") is brought to the field.

**R187 — the cold-implementer evaluation's fixture gets the in-page file. B.** A2's R159 has the guide
name `accept-inpage.js`; the copy of the guide in `evals/cold-implementer-finds-the-gap/fixture/` now
names a file its folder does not hold, which that case's reader would report as a gap that is not the
case's. Copy `scripts/inpage/accept-inpage.js` into that fixture's handoff folder, where the guide says
it is, and hold the two equal in `tests/evals.test.mjs` as the guide's copy is held.

**R188 — the read name `example-data` stands** (A2 added it for F55: the made-up rows a prototype is
drawn with, handed to the truth judge and the prototype builder). The controller adds it to the design
document.
