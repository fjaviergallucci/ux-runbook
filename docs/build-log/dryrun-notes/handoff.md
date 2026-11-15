# Notes: Handoff (dry run, 2026-11-15)

Conductor of stage 8 of 9, `design/free-now`. Entries: skill file and line · what it said or did · what I
expected or needed · what I did instead.

## Entries

1. **design/references/loop.md:127-129 vs the controller's limit.** loop.md says "never more than three
   browser-driving seats or scripts running at once"; handoff/SKILL.md:199 says the same ("three ... at
   most"). The controller's message says browser-driving seats run at most two at a time, and
   CONDUCTOR.md says never more than one browser-driving *command of mine* at once. Not a kit fault in
   itself, but the kit's number is a fixed 3 with no slot for a machine's own limit (e.g. a PROFILE
   line). I followed the stricter: one browser command of mine at a time; the cold implementer drives no
   browser (handoff/references/seats.md:39), so no seat of mine is bound by it.

2. **handoff/SKILL.md:17-18, folder.md:52-59 · which file is `<tokens>`.** The skill says `<tokens>` is
   "the project's token file, as Look's carry list names it". Look's carry list names two:
   `source:src/styles/tokens.css` (the profile's `tokens:`) and `source:design/kit/tokens.css` (the
   kit's copy, one comment line added). I needed one. I took `design/kit/tokens.css`, because folder.md:56
   says "Each page links `<tokens>`" and every page links that file; its commit is "none": `design/` is
   untracked in the project's history, so folder.md:54-55 ("a file with changes not yet committed ... is
   said so in place of a commit") applies, and PARTS.md says so, naming `src/styles/tokens.css` at
   `a9b9bec` as its source.
3. **handoff/SKILL.md:79-83 and folder.md:77-81 · the pages load more than the token file.** Every page
   links three Linden stylesheets from the project (`../../../../src/components/{button,list-row,status-tag}.css`),
   plus `look.css` and `go.js` from its own folder. The skill's step 3 names only the token link; folder.md
   names "a picture or a script a page loads from the project" as the second allowed change. A stylesheet
   is neither. I took the stylesheets as "an asset copied in" (folder.md:80-81) and copied them beside the
   pages, rewriting those three addresses by script (and checked by script that nothing else changed).
   `look.css` and `go.js` are not "pages of screens/" either; copied as they are, under their names.
4. **handoff/SKILL.md:90 vs `alone.mjs`.** The skill: "It must print nothing." The script prints, on
   success, one line to stdout: "design/free-now/07-handoff stands alone: 338 references in 54 files, each to
   a file inside it" (exit 0), which its own `--help` documents. I read exit 0 and no stderr as the pass.
5. **folder.md:60-62 · the index's words "as `states.md` has them".** `states.md` names the screens and
   the states by id, and names no language (only "the browser's language (P20)"). I used the screen ids,
   the state ids and the profile's codes `en`, `es`. A guess.
6. **handoff/SKILL.md:95 and folder.md:127-128 ("strings.json is the detail's, copied ... whole") vs
   folder.md:10-12 and SKILL.md:190-192 ("Nothing points back into the package").** The detail's
   `strings.json` carries a `_meta` key with the writers' notes, among them "(deviation 28)", "(answer
   33)", "DETAIL.md still says 32 strings ... and was not touched", "states.md still reads 'no item'", and
   a "for-the-conductor-dry-run" list. Copied whole, the folder points back into the package; cleaned, it
   is not "copied whole". I copied it whole (byte-identical, checked by script) and left `_meta` out of
   the two flat files the build loads. Expect the cold implementer to flag it.
7. **folder.md:115-117 · "States: the rows of `states.md`" vs "nothing points back".** The approved rows
   carry pointers into the package: "(answer 28)", "(answer 30)", "(listed)" (nine times: to DETAIL's
   "What the structure cannot hold", which is on no line of Look's carry list), "(Dependency 4/8)",
   "(context)", "under `room-actions` in `states.md`". The detail's Rules and Edge cases carry the same
   ("deviation 28", "deviation 30", "(listed under what the structure cannot hold)"). I copied them by
   script and rewrote only those pointers, by a fixed table (answer/deviation 28 -> `DECISIONS.md`, 6;
   30 -> 8; "(listed)" -> "(not decided in this design)"), the script failing if any were left. The
   mapping 28 -> D-07 and 30 -> D-09 I read from the matching content, since the founder's numbered
   answers (DETAIL "Reviewed by the founder") are not carried. A guess, though a safe one.
8. **folder.md:115 and templates/package/07-handoff/SPEC.md:23 · the States table's columns.** The
   template's table has State | What she sees | What she can do | Its page; `states.md` has Screen |
   State | What she sees | What she can do | Where the focus is. Copying "the rows" needs the screen and
   the focus. I kept all of `states.md`'s columns and added "Its page". The template says "Keep ... the
   tables"; I extended it.
9. **folder.md:118-122 · the data map's inventory "written out".** Each detail data-map row names P-rows
   (P1..P24) of the context's inventory. I copied the inventory table whole under "Data map" in SPEC.md,
   so that each P-number resolves inside the folder, rather than repeating each row's text in each cell.
10. **folder.md:166-170 · "Every measured value is held ... a contrast with its `min`".** It does not say
   whether `min` is the measured value or the standard (4.5). Look's 844 checks hold every text at 4.5.
   I took both: Look's checks taken over whole, plus 104 `measured.*` checks at the row's own value, on
   the page where it is lowest (from Look's `results.json`), at each width and theme of the row; and the
   target row ("44 px high; narrowest 107.84 px wide") as `min-size` 107.84 x 44 on each button's
   narrowest page. All passed at once: the reported actuals are rounded the same way the min compares.
11. **`accept.mjs` `text` type.** It reads the element's text with block boundaries joined without a
   space ("Longest free firstRoom 5, free until 12:00Room 1, ..."), not as she sees it. The template's
   "The check types" says "What the element shows, its white space made single spaces". My regex
   allowed an optional space; a check writer who expects a space between blocks writes a check that
   fails on the approved prototype.
12. **handoff/SKILL.md:98-102, folder.md:146-147 · elements with no part.** Linden has three components;
   `answer` (a toned block, `look-answer`), `updated` and `room-name` (text on type tokens) have none and
   are not among Look's named extensions. The rule: "no row made up ... a question for the founder, at
   step 9". The answers file's only step-9 answer is headed "an item of the cold implementer's that
   nobody decided". I wrote the three under "Elements with no part in the system" with the question, and
   left the asking to step 9 (if the cold implementer raises them they are its items; if not, that is a
   question the file does not answer).
13. **folder.md:243-246 · "Verify: ... A command you did not find written there is asked of the
   founder".** The project's documents say there is no build and no server, and that the browser check
   is by script with Playwright and Chromium, and the profile says "The project keeps no script for it."
   So there is no command to find and none missing. I wrote that as found, and put "the script of the
   browser check" under "Left to the builder". A judgement: whether "no command exists" is a command not
   found.
14. **folder.md:207-215 · COVERAGE "every finding of every ledger" at Structure.** The structure's
   ledgers read three options by letter; "What the readers found" carries only the 15 on the chosen
   one. A letter not chosen must not reach the folder. I entered the 15, plus two "checked and held"
   notes on all three that the stage had not listed, and a count of the findings on the two ways not
   chosen alone (10, 7, 2, 5), naming them by what they were. The fates of the 15 are mine, read from
   DECISIONS.md and the later stages' carried sections: the carried outputs give no fate for most.
15. **handoff/SKILL.md:51 vs templates/package/07-handoff/HANDOFF.md:4.** I wrote HANDOFF.md whole after
   `begin` and gave its header `status: in-work` by mistake, then put back the template's `draft`
   ("stage, version and status stay as the template has them", loop.md:64-65). `validate` said `ok` both
   before and after.
16. **handoff/references/seats.md:27-33 · "Do not open ... the rest of the project's own source".** Read
   literally, "the project" includes `design/`, which holds the handoff folder itself. I first wrote
   `design/` whole under "Do not open" and had to narrow it to `design/PROFILE.md`, `LESSONS.md`, `kit/`,
   `pool/`. A brief writer who copies the list literally hands the seat a folder it is told not to open.
17. **Stopped for the controller (1st time), at step 8:** one seat, `judge.cold-implementer`, on sonnet at
   medium (the cast sheet's "Handoff" line). Brief:
   `design/free-now/work/handoff-judge-cold-implementer-brief.md`. Drives no browser (seats.md:39).
18. **The cold implementer's ledger vs its card and the LEDGER template** (the controller relayed this,
   and I saw it in the file): to count questions and guesses, the seat put a `Q`/`G` tag in the "Check"
   column, because the template has no place for the kind of an item. Its own count line says "10
   questions (Q), 9 guesses (G)", but it tagged 11 rows `Q` (1-11), 9 `G` (12-20) and left one untagged
   (21). The template wants one column more, or a section for each kind, for this seat.
19. **handoff/references/seats.md:61-63 · "A state with no page ... When the approved design itself
   lacks it, it is not Handoff's: it goes to the founder, and the stage it belongs to is his to
   reopen."** Ledger item 8: three kinds of room in the `room-actions` · default row (free with no
   booking following, being cleaned, held) have strings and rules but no page. Each is part of one row
   that has pages, not a row of its own, so I read it as no "state with no page" and closed it the first
   way: `ACCEPTANCE.md` lists them as held by `SPEC.md` and looked at by a person. Read the other way, it
   is a question to reopen Look (or Detail), which the answers file has no answer for, and I would have
   stopped. The seat itself was unsure (it rated it "should").
20. **handoff/SKILL.md:132-135 and seats.md:51 · step 9 had me propose eight defaults that are design.**
   "Put it to the founder ... with the default you would propose." Which room `open-room` opens, what
   `try-again` shows, the page's title, what `book-room` does, what the measure counts, how ties are
   ordered, where focus goes on a reload: each default is an interaction or product decision made by
   the conductor, who "proposes no design" (design/SKILL.md:24-26), and the answers file's blanket "Use
   the written default, and mark it as one." turns all eight into the design. I kept each default as
   close to the approved pages as I could (the `open-room` rule reproduces the prototype's Room 2; the
   disabled `try-again` is what its page draws; the title reuses `app.name`; no new string anywhere).
21. **handoff/SKILL.md:132-135 · one `await` for each question.** I ran `await` -> wrote his words and
   the default -> `begin`, eight times. `await` added `approved: ""` and `words: ""` to the header of
   HANDOFF.md; `validate` says `ok`. Nothing in the skill says the eight answers may share one round, so
   a resuming session sees eight closed questions and none open.
22. **Items closed the first way that needed a judgement.** Ledger 3 and 2 (the success and
   loading-first-paint pages are stand-ins the makers drew "since the states table leaves nothing else to
   show"): I wrote in SPEC.md what each link and page stands for, from `states.md` and the makers' carried
   words, and changed no check; ledger 2's part that no carried text settles (is the disabled button seen)
   went to the founder. Ledger 5: I took `_meta` out of the folder's `strings.json` after all (the seats
   page says a reference out of the folder is written out and taken out), moved its "nothing to say" list
   and the writers' bar into SPEC.md, and recounted: 34 keys, the same strings, in all three files. This
   reverses entry 6: the skill's "copied whole" and the seats page's "take the reference out" cannot both
   hold for this file.
23. **Stopped for the controller (2nd time), at step 9:** four items were marked `blocks` (1, 2, 4, 5), so
   one re-read is owed (seats.md:77-83). Brief:
   `design/free-now/work/handoff-judge-cold-implementer-reread-brief.md`, the first brief with the re-read
   lines; its "Do not open" had to except the earlier ledger from `07-handoff-gate/`, which the first brief
   lists whole (seats.md:30 lists the gate folder under "Do not open", seats.md:80-81 hands it the ledger
   in it).
24. **`alone.mjs` against what the reader found.** `alone.mjs` passed every time I ran it (after step
   3, after step 9's closings, after the re-read's closings, before the gate): "design/free-now/07-handoff
   stands alone: 338 references in 54 files, each to a file inside it", exit 0. The re-read still found
   one `blocks`: three *mentions* of the design's history, `prototype/look.css`'s opening comment ("listed in
   measures.md under 'Named extensions'") and two rows of `COVERAGE.md` naming a maker's
   `descriptions/data.json` and "the kit's contract". Both kinds are invisible to the script by its own
   `--help`: it judges only addresses a page or stylesheet *loads* (href, src, url(), @import), never a
   comment ("What a comment holds is not [read]") and never a Markdown file. The first read's `_meta`
   finding (entry 6) was the same kind. So "the folder stands alone" (handoff/SKILL.md:87-92,
   folder.md:65-75) proves only that nothing *loads* from outside; "Nothing points back into the
   package" (folder.md:10-12, SKILL.md:190-192) has no tool, and in this run only the cold reader caught
   it, twice. A script that greps the folder's text for the package's file names (and for each name of
   a file under the package) would have caught all four before the first seat.
25. **What the skill has me do with a blocking finding after the one re-read.** handoff/SKILL.md:137-139
   and seats.md:77-87: "One re-read ... No second round"; "What is still present goes to the founder with
   the gate, as an open finding. The handoff is ready when the lists are empty, or every item left has
   its answer or its default written in the folder." It does not say whether the conductor may still
   close a re-read's items in the folder (it never says not to), nor whether a `blocks` closed after the
   re-read counts as closed or open. I closed the two `COVERAGE.md` rows (my own text) and could not close
   the `look.css` comment: that file is part of the approved screens, which "Never change what was
   approved: ... a page" forbids (SKILL.md:184-185; only the token link and a copied asset's address may
   change), so I explained the comment in `PARTS.md` instead. On the decision page I listed the item as
   open ("closed after it, not read again") rather than call it fixed, since no reader saw the fix. The
   re-read's other 14 items I closed the three ways, four of them as new founder defaults.
26. **The re-read's item 3 had me write a default that broke the approved page.** My first default for
   `hold-room` on a booking more than fifteen minutes old hid the button, but `room-actions` · default
   draws "Hold room" on Room 2, twenty minutes into its booking, and a state check holds it there. I saw
   it only after his answer was written. Rather than change an answered default quietly, I put a 13th
   question (the replacement, with its reason), wrote his answer, and took the first default out of
   `SPEC.md`; both answers stay under "Reviewed by the founder". Nothing in the skill checks a default
   against the pages or the checks before it goes to him (step 9 does say to run steps 3 and 6 "when a
   page or a check changed", but a default changes neither).
27. **folder.md:227-229 and `coverage.mjs` · regeneration lost a hand edit.** I had added a sentence to
   `COVERAGE.md` by hand at step 9; writing the cold implementer's rows meant generating the file again,
   which dropped it. The re-read had already marked it fixed. I put it in the generator and wrote the
   file again. Kit-wise: "Its own row ... only after its last read" means COVERAGE is written at least
   twice, so whatever writes it must be re-runnable.
28. **handoff/SKILL.md:143-145 · the decision page.** `page.mjs` accepted pictures named from the gate
   folder as `../07-handoff/prototype/shots/...` ("built ... 1 option, 1 seat, 14 open findings, one
   question"). It allows one line per seat per option, so the first read and the re-read share one line.
   Twelve defaults plus two open items made 14 "findings"; the page has no separate place for defaults,
   which the skill wants listed "so that his go covers it".
29. **The gate and the stamp went through as the skill gives them.** `await ... --question "May this folder
   go to the session that builds it?"`, his words from the answers file written under "Reviewed by the
   founder", `stamp ... --words "Go. It may go to the build."` ("stamped handoff approved at version 1"),
   D-11 appended to the package's `DECISIONS.md`, `validate` ok, `next` prints `acceptance`.

Seats this stage started: 2 (`judge.cold-implementer`, first read and re-read), both on sonnet at medium.
Times I stopped for the controller: 2 (both SEATS, at steps 8 and 9).
Could a session with no memory pick it up: yes. `state.mjs next` says `acceptance`, with no open question
and `validate` ok. Acceptance reads `07-handoff/HANDOFF.md` first, then `build/` once a build has written
back, plus the cast sheet's "Acceptance" table and the last entry of `DECISIONS.md` (D-11), as loop.md:49-54
says. Nothing it needs is in this stage's `work/handoff/`. That folder holds the scripts that wrote the
folder (spec, strings, acceptance, coverage, defaults), and they would be needed only to regenerate a file.
