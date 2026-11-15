# Notes: Detail stage (dry run)

Conducted 2026-11-15. Package `design/free-now`; `validate` ok, `next` detail at the start.

## Entries

1. **Browser limit: three or two.** `skills/design/references/loop.md:127-129`, `skills/detail/SKILL.md:100`
   and `:199`, and `skills/detail/references/seats.md:87` and `:113` all say three browser-driving seats or
   commands at once. The controller's message for this stage says two at most. Expected one number;
   followed the controller's two, as this machine's rule.

2. **Who fills the rest of DETAIL.md's template at step 2.** `skills/detail/SKILL.md:63-65` says "Copy the
   template ... and write `built-from`". The template (`templates/package/05-detail/DETAIL.md:7-12`) also
   has a title `# Detail · {the design's name}` and a comment saying "replace each {instruction in braces},
   and delete this comment". `seats.md:44-45` forbids the interaction designer to touch "its header, and
   not another heading", and step 9 (`SKILL.md:117-119`) gives the conductor only three sections. Needed:
   who writes the title and deletes the comment. Did: wrote the design's name into the title at step 2
   (a fact, not design), and left the comment in place, to delete at step 9.

3. **"The worst plausible rows of the context's inventory" is a selection left to the conductor.**
   `seats.md:36-37`. The context's table (`01-context.md`, P1-P24) marks no row as a worst case, so
   choosing which rows are "worst plausible" is a judgement the conductor makes. Did the most literal
   thing: quoted word for word the rows that state a limit, a delay or a failure (P1, P3's "Sometimes
   wrong", P5, P8, P16, P17, P18, P19) and the note under the inventory about held (no file holds it).

4. **No name for a seat's brief file.** `SKILL.md:41` puts the briefs "in `<package>/work/`" and
   `loop.md:115` says "as a file in the package's `work/` folder", with no file name. Did:
   `work/detail-maker-interaction-designer-brief.md`, by the pattern of the file names already in `work/`
   (listed, not read).

5. **The maker brief's profile line assumes a specialty.** `templates/briefs/maker.md:31` "Her profile,
   whole, its base and then the section of {her specialty}". Her card says `specialty: none`, and the
   profile's "Specialties" section names none. Did: kept the line, saying there is no section of one to
   read.

6. **`earlier/` and B's own page in the makers' "Do not open".** `seats.md:28-29` lists
   `<package>/04-structure/earlier/`, which this package does not have (no reopening); left it out of the
   brief. The same rule ("everything in `04-structure/` but `<chosen>` and its pictures") withholds
   `board/B.html`, the chosen option's own drawn page, which `CHOSEN.md` names beside `B.json`; the carry
   list names only `B.json` and its two pictures, so the maker gets those three. Not a refusal; worth
   knowing that the maker never sees the chosen option's page.

7. **The maker brief's "Read" list holds two files the card's `reads` does not name.** The card
   (`pool/makers/interaction-designer.md:9`) reads `[brief, chosen-structure, intent, context, person,
   profile]`, and `templates/briefs/maker.md:25` says "Only what the card's `reads` allows". Its Output
   (`:66-68`) writes into the shape of `templates/package/05-detail/states.md` and under the headings of
   `DETAIL.md`, so the seat must open both. Did: listed the states template and the package's `DETAIL.md`
   (the file it writes into) in the Read list.

8. **The audience count grows by one, by rule.** The cast sheet's "Detail" table
   (`03-cast.md`, row `audience.task-reader`) seats one agent "in both languages"; `seats.md:203-205` and
   `templates/briefs/audience.md:13` ("the one language she reads in") make one task read for each
   language. So two instances run, and `seats.md:205` says to "tell the founder that the sheet's count
   grows by them". It is a telling, not a question, and the answers file has nothing for it: will be
   written into `DETAIL.md` under "Reviewed by the founder" with the gate.

9. **Twenty-seven questions, one at a time, each with its own `await` and `begin`.** `SKILL.md:79-90`
   and `seats.md:46-55`. The interaction designer returned 7 dependencies, 10 states the intent does not
   name and 10 things the structure cannot hold. Each is a question "one at a time", recorded with
   `await` and followed by `begin`: 27 cycles, which the script took without a refusal (done by a small
   loop in the scratchpad; each question and his words are numbered 1-27 under "Reviewed by the
   founder"). Nothing in the skill lets entries of one kind go as one question, and a founder present
   would have been asked 27 times before the interface writer starts. Worth knowing for the kit: the
   lists are not capped and a careful designer fills them.

10. **The answers file's "what the structure cannot hold" answer has no "one at a time; the same answer
   for each".** `FOUNDER-ANSWERS.md`, "Detail · what the structure cannot hold", against its two
   siblings, which both say so. Did: used it for each of the ten, as the nearest literal reading, since
   the answer names no one entry.

11. **"Stays on the list, with his words": where are his words written?** `seats.md:52-53` ("One he says
   does not exist stays on the list, with his words") and `:55` ("accepts it as a cost, in his words").
   The lists are under the interaction designer's headings, which `seats.md:44-45` gives only to it, and
   `SKILL.md:183` forbids the conductor to write a state or a rule. Did: his words under "Reviewed by the
   founder", numbered, and one italic line under each of the three lists quoting his answer and pointing
   to the numbers. No entry of the maker's was changed.

12. **A generic answer meets a standing rule and the approved intent: STOPPED.** `loop.md:191-193` (step 8:
   "Where a note meets a rule or a fact of the product (a standing rule of the project profile, ... an
   output he approved earlier), say so at once, with the source, and offer the true version. Then he
   decides."). Three of the ten things the structure cannot hold, once "Accept it as a cost" is applied
   to them, have the design break what is binding: #1 (no place to say what changed in words) against
   `02-intent.md`, "States" ("what changed is the new state, said in words"); #2 (a room moves list by
   itself; the maker wrote "The rule cannot be kept to the letter ... His call.") against the standing
   rule "Nothing moves unless she moved it." and the intent's "both hold"; #4 (no step for the asking
   first) against the standing rule "What can't be undone asks first." The answers file has no heading
   for this (its "If a question is not here" section names "anything the pipeline says to put to him
   before going on"). Did: wrote the three questions under "Reviewed by the founder" (28-30, unanswered),
   recorded the first with `await`, and stopped before the interface writer, since `SKILL.md:73` and
   `seats.md:46-47` settle every entry before the next maker starts.

13. **The answers file could not have foreseen questions 28-30.** They exist only because a generic
   answer ("Accept it as a cost") was applied to entries the maker wrote at this stage, and step 8 of the
   loop (`loop.md:191-193`) then makes each meeting with a standing rule or the approved intent a
   question of its own. The controller added the answer under "Added during the run", heading "Detail ·
   a cost I accepted meets one of my own rules or the intent I approved". Recorded as the skill says:
   for each of the three, his words under its question (28-30 under "Reviewed by the founder"), with
   `await` before and `begin` after; `validate` stayed `ok`.

14. **The kit has no place for a breach of a standing rule that the founder accepted.** He asked: "Record
   it so the judges and the builder can see I said so." What the kit gives, and where it falls short:
   - At Detail, the only founder-owned heading is "Reviewed by the founder"
     (`templates/package/05-detail/DETAIL.md:94-97`), which asks for "what he corrected" and the
     approval words: not an accepted deviation. "What the structure cannot hold" (`:68-70`) is the
     interaction designer's heading, and `seats.md:55` says only that he "accepts it as a cost, in his
     words", with no place named for them. Did: his words under "Reviewed by the founder" (28-30), and
     one italic line under "What the structure cannot hold" naming the three deviations, the rule or
     intent line each breaks, and his words.
   - **Judges:** usability, truth, words and accessibility are handed `DETAIL.md` as "the states and the
     rules" (`seats.md:142`, `:155`, `:166-167`, `:179-180`), so they will see it. The profile judge is
     handed the shots, the strings, the intent and the profile only (`seats.md:192-194`), and the
     audience pictures only: neither will see that he said so. A judge "is told what to read, never what
     to find" (`loop.md:94`), so its brief cannot say it either; nothing tells a judge not to mark an
     accepted deviation `blocks`. `seats.md:97-99` sends a finding "on what the structure is" to the
     founder open rather than to a maker, which keeps the fix round off it, if the conductor reads the
     finding that way.
   - **The builder:** Detail's carry list (`SKILL.md:164-171`) carries `DECISIONS.md` and the reads, and
     the `DECISIONS.md` template (`templates/package/DECISIONS.md:21-24`) has "Cost, accepted" and
     "Consequence" ("what it forces on the build"), and its intro names "each exception". But Detail's
     stamp step (`SKILL.md:178-179`) appends "the decision ... each dependency he settled with it": not
     each cost he accepted. Will do at the stamp: one entry for the stage, and one entry for each of the
     three accepted deviations, as exceptions, with the rule each breaks under "Cost, accepted" and what
     the build must not "fix" under "Consequence". `templates/package/build/DEVIATIONS.md` exists, but is
     the build's own record of where it departed from the handoff, not a place the founder's accepted
     design deviations travel.
   - Nothing in the kit lets a standing rule of `PROFILE.md` carry a per-design exception, so Look's and
     Acceptance's judges, reading the standing rules, may flag the same breach again.

15. **The interface writer's brief: no project writing skill, and the product's vocabulary.** The card
   (`pool/makers/interface-writer.md:27-29`) reads "the product's own vocabulary where the project keeps
   one". The project keeps strings (`src/strings/en.json`, `es.json`, in `CHOSEN.md`'s carry list), but
   `seats.md:64-65` hands the writer only `<chosen>`, the states and the rules, the intent, the context,
   the card and the profile. Did: handed what `seats.md` lists; the context quotes the product's state
   words (P2). Also `<chosen>` for the writer is `B.json` without its pictures (`seats.md:64`, unlike the
   interaction designer's "with its pictures", `:38`): followed that, and listed the pictures under "Do
   not open".

16. **The writer's lists have no place in `strings.json`'s shape.** `pool/makers/interface-writer.md:72-75`
   says the two lists come "with" the table and in the reply; `templates/package/05-detail/strings.json`
   has keys only. The seat put both lists, its reading of the founder's bar (card `:30-32`, "write down,
   at the top of your work"), and its notes in a `_meta` key of `strings.json`, which the template does
   not have. The reply the controller relayed gave 4 facts and 6 "nothing to say"; the file holds 5 and
   8. Did: read the lists from the file, copied them as they came under "Strings" of `DETAIL.md`
   (`seats.md:69`), and left `_meta` in the file (not mine to mend). A key the template lacks may trip
   the prototype builder or a later script that walks every key as a string.

17. **Seat-instruction clash (the rig's, not the kit's).** The brief, from the card's Output, asks for
   "the path, the number of strings in each language, and both lists"; the dry run's `SEAT.md` asks a
   seat to reply in one or two lines. The seat wrote the lists into the file instead. A rig finding.

18. **The structure's note says hold has no words; the context gives the state's words.** The writer's
   `_meta` note: B's `hold-room` note says "Words for hold do not exist yet", while the context's P21
   gives "held" and "apartada". Only the verb is missing. Not a kit fault; the two artefacts disagree,
   and the gap reached the founder as a fact question (32).

19. **Facts the answers file does not hold: STOPPED.** `seats.md:69-71` ("*Waiting for a fact:* ask the
   founder for the fact, one at a time"). Of the writer's five, the answers file's "Detail · a fact a
   string waits for" answers 1 (how a room is named on screen: "Room 1 to Room 5. In Spanish, Sala 1 to
   Sala 5.") and 5 (whether a Spanish name already carries "Sala", by the same entry). It has no entry
   for 2 (the verb for holding a room), 3 (whether the screen has a heading, and its name), or 4 (how
   long a room's name can be; "Room 1 to Room 5" names rooms but sets no limit, and the file says "A
   fact not listed here is a question not here"). Did: recorded 1 with `await`, his words and `begin`
   (31 under "Reviewed by the founder"); recorded 2 with `await`, now the open question; wrote 3 to 5 as
   still to be asked (33-35); stopped.

20. **Fact 3 is not a fact.** Whether the screen shows a heading is a question about the structure
   (B draws none), which the writer met because it wrote `now.title` for one anyway. `seats.md:69-72`
   has only two routes for a writer's list (a fact to the founder, or "nothing to say" to the interaction
   designer); a line written for an element the structure lacks fits neither, and the card's Never
   (`:85`, "Never change ... the structure to suit a line") suggests it should not have been written.
   Did: put it to the founder as the writer framed it, since the kit gives no third route.

21. **Facts 2-5 recorded.** From "Detail · a fact a string waits for — three more" (added during the run)
   for 2, 3 and 4, and the original "How a room is named on screen" entry for 5. Each with `await`, his
   words (32-35 under "Reviewed by the founder") and `begin`; `validate` `ok`. Two answers reach past
   the strings: 33 ("No heading") means `now.title` has no element to sit on, and 34 ("never more than
   ten characters") answers what dependency 6 says is not on record. The kit has no route for a fact
   answer that settles a dependency: `seats.md:69-71` sends a fact only to a fresh writer. Did: named
   answers 1-35 in the designer's brief as context, without saying what to change.

22. **"Nothing to say" and "Waiting for a fact" go to two fresh seats in a given order, but the skill does
   not say whether one fresh writer takes both.** `seats.md:69-72`: a fact goes "to a fresh interface
   writer, who writes the line"; a nothing-to-say entry "goes to a fresh interaction designer, who
   settles the state, and then to the writer again". Did: one fresh interaction designer for the eight
   entries now, then one fresh writer for the five facts and the eight settled entries together, so the
   writer seat runs once more rather than twice. A guess at the cheaper literal reading.

23. **A settling designer's brief has no template line of its own.** `templates/briefs/maker.md` has a
   line for the interaction designer ("this product's worst cases") and nothing for a designer sent back
   with a writer's list; the card's Output (`interaction-designer.md:79-80`, "the paths and the count of
   each list") does not ask how each entry was settled. Did: kept the worst-cases line, named the eight
   entries by where they sit in `DETAIL.md`, and asked in "Reply" for one line per entry and for what is
   new on each of its three lists (a new entry would be the founder's again, `seats.md:46-47`).

24. **The settling designer hid an element for want of data before he was asked.** Its new dependency 8
   ends "Until it is, `hold-room` is not shown for such a room" (a free room with no booking), and its
   `room-actions` row also hides `end-now` for a held room "since whether a held room's booking runs is
   not on record". `SKILL.md:83-84` says an element that needs what the product lacks "stays on its
   screen ... Ask him: is it to be built with the design, or does the element go?", and `:185` "Never
   take an element out because the product cannot supply it" (the conductor's Never; the card,
   `interaction-designer.md:61-62`, only forbids dropping one "quietly"). Asked dependency 8 (36 under
   "Reviewed by the founder"; his words: "Keep it, and leave it listed as a dependency. The build answers
   it."). Did not send a further designer: `hold-room` stays on `room-actions` for every room with a
   booking, and the rule for a room with none is written into dependency 8 itself, so "the build answers
   it" has what it needs. A reading, not a certainty: `seats.md:49-50` sends back only an element he
   takes out, and has nothing for an element a maker narrowed before he answered.

25. **Entries he had answered were rewritten after his answer.** The settling designer rewrote the
   "Today" text of states-not-named 3, 4 and 7, and added "no line is owed" to six things the structure
   cannot hold, after he had answered each ("Leave it on the list, with these words"; "Accept it as a
   cost"). His italic lines stayed. The kit routes a writer's "Nothing to say" to a designer
   (`seats.md:71-72`) even where the entry is a state he said is "Not in this design" (state 4, and the
   writer's "nothing to say" 6) or a cost he accepted (18-30): the two routes meet with no rule for
   which wins. It also rewrote "What cannot be undone", "Validation" and "Keyboard" to "should ask
   first; as drawn, does not": the deviation he accepted (30) now stated as a rule, which is what he
   asked for ("so the judges and the builder can see I said so").

26. **A brief that hands the founder's fact answers.** `seats.md:69-71` "hand his answer to a fresh
   interface writer"; `seats.md:5-6` "Nothing is pasted into a brief but the founder's own lines". Did:
   quoted his five answers in the fresh writer's brief, as his own lines, and named where they stand
   (31-35). The template (`templates/briefs/maker.md:17-18`) has no line for them.

27. **A "Nothing to say" list that is all settled.** `seats.md:71-72` sends each "Nothing to say" entry to
   a fresh interaction designer "and then to the writer again", with no end: the second writer listed
   eight entries again, each marked "settled, no line is owed" (or owed only once the build draws the
   ask-first step), one of them new in wording ("a dialog where no action shows", which the states table
   already settles). Read literally the loop does not close, since a writer lists what has no line even
   when the designer has ruled that none is owed. Did: took "settled" entries as closed, sent none back,
   and copied both writings' lists under "Strings" (second first, then first, which answers 31-35
   refer to by number).

28. **The tab title and stale counts.** The second writer reported that a page's browser tab title has
   no string; the prototype builder's card (`prototype-builder.md:33-34`, `:43-44`) makes the title the
   screen's name from the board, a name and not an interface word, so it needs none. Also reported:
   `states.md` still says "no item" in some rows and `DETAIL.md` gave 32 strings; the count is the
   conductor's and is now 34 (by script). Nothing in the kit says who brings `states.md` up to date
   after the writer's new keys: not needed, since the writer's keys follow the settled table.

29. **The prototype builder's card runs `node scripts/shots.mjs` from the kit's root.**
   `prototype-builder.md:59-61`, while every seat runs from the project's root (`loop.md:113`) and
   `seats.md:85-86` puts its pictures in `<package>/work/prototype-check/`. Did: gave the kit script's
   absolute path, the project folder to run from, and that out folder, in the brief. The brief also
   allows `work/prototype-check/` against the makers' "Do not open" `work/` (`seats.md:31-32`), since
   the seat must look at its own pictures (card `:63-64`).

30. **Pictures of record.** `SKILL.md:91-95`: `node <kit root>/scripts/shots.mjs
   design/free-now/05-detail/prototype --out design/free-now/05-detail/shots --widths 1280,390` printed
   "shot 98 pictures at 1280, 390 px, light", exit 0, no `error:` and no `overflow:` line. 98 = 48 pages
   and `index.html`, at two widths: a folder means every `.html` in it, so the index is photographed too.
   Light only: the skill's command passes no `--themes`, while the project's browser check
   (`design/PROFILE.md`, `browser-check`) is "light and dark"; followed the skill.

31. **The builder's count.** 48 = (4 + 5 + 5 + 3 + 2 + 5) × 2. Its brief's "less the rows the states table
   marks 'cannot occur'" (from `prototype-builder.md:55-56`) met rows that only begin "Cannot occur as
   ..." and it left out every row so beginning; several pages are identical to their `default` page by
   the table's own words (`loading-refresh`, `stale`/`error-recoverable`, `room-actions`/`success`). It
   also made up rooms, times and clinicians' names where the board gives no data (the context's sample
   day, `src/data/sample-day.json`, is not in its `reads`: `prototype-builder.md:9`), and the dialog's
   "opens over" caption is English on Spanish pages because `kit/KIT-CONTRACT.md` fixes the wording. Each
   goes on the decision page under `findings`, by seat (`seats.md:88-89`).

32. **The judges' brief has no line for the writers' `_meta`.** `strings.json` now carries the writers'
   notes in `_meta` (entry 16), and every judge is handed `strings.json`, while every judge card
   `never-reads: [maker-notes, ...]`. Did: listed "the `_meta` key of `strings.json`" under each judge's
   "Do not open", beside `work/`. A seat may still see it while reading the file.

33. **Which judges are handed `<chosen>`.** `seats.md` hands `<chosen>` to usability and truth only, not to
   words, accessibility or profile; the shared reader "Do not open" (`seats.md:130`, "the rest of
   `04-structure/`: the board ...") does not say "but `<chosen>`". Did: "the board" whole for those three,
   and "the board but the one file listed above" for the two that read `B.json`.

34. **The accessibility judge: "nothing is measured" against "Measure. Never estimate".** `seats.md:177-178`
   has its brief say "nothing is measured at Detail"; the card (`judges/accessibility.md:60-80`) measures
   with `accept.mjs` and `shots.mjs`, and the cast sheet turns `reflow` on. Did: "nothing is measured at
   Detail for colour or size", which keeps both, and named `work/accessibility-check/` for its checks
   file, results and pictures (no place is named for them; the readers' "Do not open" holds `work/`, so
   the folder is carved out in its brief). It is the one reader that drives a browser.

35. **The audience at "her width", with tasks at two widths, and tasks only in English.**
   `seats.md:207-213` and `templates/briefs/audience.md:13` give her one language and one width; the
   intent's tasks put her at the desk computer (tasks 1 and 2) and away from the desk on her phone (task
   3). Did: one width per task as the task says where she is, so each instance is handed 48 pictures (24
   pages in her language at both widths, the index left out). The tasks are copied word for word from
   the intent, which holds them in English only, so the Spanish reader gets English tasks over Spanish
   pictures; nothing in the kit has the tasks written in each language.

36. **The audience count grows by one** (entry 8): two instances, `-en` and `-es`, where the cast sheet's
   Detail line seats one. To be told to the founder with the gate (`seats.md:205`).

37. **The traits copy.** Written once for both instances at `work/detail-audience-task-reader-traits.md`,
   by removing each `So the interface must:` line to the next blank line (`loop.md:106-108`): 7 removed,
   0 left. The audience brief template's line 2 names it "beside the brief"; one file serves both briefs.

38. **No `blocks`, so no fix round and no re-read.** Five ledgers (9 + 8 + 8 + 10 + 3 findings), all
   `should` or `note`. `SKILL.md:106-116` runs steps 7 and 8 only for a `blocks`, so 38 judge findings
   (with 20 audience stuck points and 7 builder items) went to the gate open. Several are the costs and
   deviations he accepted at step 4 (no close control, no "what changed" line, no asking first): the
   judges, reading `DETAIL.md`, mostly said so themselves, as `should`, not `blocks`.

39. **The readers' cuts did not hold, and the kit expects that.** Usability ran `first-action` and
   `destructive`, and accessibility `focus-in-overlays`, though the cast sheet had them off (the reason
   given there, "the intent names nothing that opens over the screen", is untrue of B, whose
   `room-actions` is a dialog). Both brief templates say "you test every trigger again"
   (`templates/briefs/judge.md:21-22`), so this is the kit working, and the cast sheet's reasons for
   Detail were written before the structure existed.

40. **`reads/` did not exist when the readers started.** Usability made it. Nothing in `SKILL.md` makes
   the folder before step 6, and the profile judge listed it to find its own file and saw the other
   seats' file names (it opened none). A folder made by the conductor before the readers start, or a
   rule that a seat writes its file without listing the folder, would close that.

41. **The audience card ranks lettered options; Detail has one prototype.** The Spanish reader took the
   prototype as option "A", both wrote "no ranking: one option" (`templates/briefs/audience.md` and the
   card's Output speak of options by letter). Each opened about 20 of its 48 pictures and judged the rest
   by file name: 48 pictures is more than a seat reads, and the brief template has no way to point her at
   the pages her tasks need first.

42. **The decision page holds 65 open findings.** `SKILL.md:121-123` asks for "each finding that stayed
   open under `findings`, by seat", and `page.mjs` took them ("1 option, 7 seats, 65 open findings, one
   question"). The template's sample (`templates/outputs/decision-approve.json:12`) titles the option "The
   prototype, after one fix round"; with no round, retitled "with no fix round". The skill's sample
   picture name (`SKILL.md:121`, `shots/today-default-en-390-light.png`) carries the language; the
   template's (`decision-approve.json:14`, `shots/today-default-390-light.png`) does not. Followed the
   skill's form, which is what `shots.mjs` writes. Every finding line had its "?" turned to "." because
   the script refuses more than one question mark in all the data (`page.mjs --help`); no line had one,
   but a stuck point quoting her question would have been changed by it.

43. **Structure's promise to Detail has no step.** `CHOSEN.md`, "What the readers found" ("Detail closes
   each, or says why not") and `DECISIONS.md` D-05's Consequence promise that Detail closes the fifteen
   open findings on B. No step of `skills/detail/SKILL.md` does that: they reach the makers only through
   what their briefs hand them, and `DETAIL.md`'s template has no place to answer them one by one. Did:
   nothing; the line `structure@1#what-the-readers-found` in Detail's carry list carries them on, as
   `SKILL.md:166-167` says. Look inherits them unanswered.

44. **Gate, stamp and decisions.** `await` with "Do you approve this prototype of free-now for Look?",
   his words from the answers file ("Approved for Look. Anything still open stays open, written down as
   it is.") under "Reviewed by the founder", with what he was told (the audience count grew by one); the
   carry list (`CHOSEN.md`'s 43 lines as they are, plus 11, as `SKILL.md:164-171` lists them, folders
   given as `source:` paths); `stamp` from awaiting, without `begin` (`loop.md:28-30`): "stamped detail
   approved at version 1 on 2026-11-15". The words question was not asked: the kind is
   `working-surface`. `DECISIONS.md` got D-06 (the stage, each dependency he kept) and, for "Record it so
   the judges and the builder can see I said so", D-07 to D-09, one for each accepted deviation, under
   the template's intro ("each exception"), though `SKILL.md:178-179` asks only for the decision and its
   dependencies. `validate` `ok`, `next` `look`.

45. **The founder's "Reviewed by the founder" in `DETAIL.md` holds 36 questions and the gate.** The
   template (`DETAIL.md:94-97`) sizes it for "what he corrected, and the words he approved the prototype
   with". At this design's size it is the longest section of the file: a session reading Detail's output
   cold meets 36 numbered questions before the carry list.

---

Seats this stage started: 12 (interaction designer, interface writer, a fresh interaction designer to
settle "Nothing to say", a fresh interface writer for the facts, prototype builder, five judges, two task
readers; no fix round and no re-read).
Times stopped for the controller: 8 (6 for seats, 2 for questions the answers file lacked: the three
deviations against a standing rule or the intent, and three facts).
A session with no memory could pick the package up: `state.mjs status` shows Detail approved and `next`
prints `look`; it would read `design/free-now/05-detail/DETAIL.md` first, then exactly what its `## Carry`
names (the cast sheet's Look table, `DECISIONS.md` with D-06 to D-09, the reads, the shots and the
prototype).
