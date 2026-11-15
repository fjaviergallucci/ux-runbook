# Notes: Look stage (dry run)

Conducted 2026-11-15. Package `design/free-now`; `validate` ok, `next` look, `status` no open question,
Look routed full, not-started, at the start.

## Entries

1. **Which file is `<tokens>`.** `skills/look/SKILL.md:19-20` defines `<tokens>` as "the project's token
   file in it, `<kit dir>/tokens.css`", i.e. `design/kit/tokens.css`; step 4 (`:89-90`) repeats it. But
   `SKILL.md:38` reads the profile's `tokens`, which is `src/styles/tokens.css`, and the detail's carry
   list names `source:src/styles/tokens.css` and not `design/kit/tokens.css`. `sha256sum` differs;
   `diff` shows the kit copy has one added comment line and the same values. Expected one file. Did:
   the literal one, `design/kit/tokens.css`, for the screens to link (the skill names it twice); handed
   `src/styles/tokens.css` too, as part of "what the project says of its design system".

2. **The skill reads one card, the brief templates need the seat's card.** `SKILL.md:41-42`: "one card:
   `pool/makers/outside-describer.md` ... Every other card is read by its seat." But
   `templates/briefs/maker.md:25,37,51` fill "Read" from the card's `reads`, "Do not open" from its
   `never-reads`, and "Reply" from "what the card's Output says". Did: read
   `pool/makers/visual-designer.md` (header and Output) to fill its brief; did not read the
   outside-describer card, since no fresh pass runs and `seats.md:92` says read it "before the first
   run", of which there is none.

3. **The mode question in the answers file is never asked by the skill.** The answers file has
   "Look · does this surface leave the design system?", *asked at* step 2 "only when the conductor asks
   which mode to run". `SKILL.md:74-79` decides the mode from four conditions (foundation, size, empty
   `tokens`, "the founder has said"), with no step that asks him. None held. Did: did not ask; wrote
   "Inside the design system" with the four conditions under "Mode".

4. **The template's direction paragraph, inside the system.** `templates/package/06-look/LOOK.md:17-18`
   is an instruction "For a direction: ...", and the comment says replace each instruction. Inside the
   system there is nothing to replace it with. Did: deleted it, wrote one paragraph under "Mode". The
   template comment (`:7-9`) is left until step 9 (as at Detail, `notes/detail.md` 2).

5. **"What the project says of its design system" is a selection.** `seats.md:22-23`: "the documents
   that 'Design system' of the project profile names, each by its path". That section names
   `docs/decisions.md` (D-4, as the source of the version date), `docs/design-system.md`,
   `src/styles/tokens.css`, the three component files, and the project kit's three files. Did: handed
   `docs/design-system.md`, `src/styles/tokens.css` and the three component files; left out
   `docs/decisions.md` (cited for a date, not a document of the system) and the project kit (next entry).

6. **The card reads `kit`; `seats.md` does not hand it.** `pool/makers/visual-designer.md:9` has `kit` in
   `reads`; `seats.md:35-39` ("Handed") lists no kit, only `<tokens>`, which is in the kit folder. Did:
   handed `design/kit/tokens.css` and not `kit.css` or `parts.html` (the prototype, which is handed,
   carries its own copy of `kit.css` anyway).

7. **The skill's carry reads vs. the loop's.** `loop.md:39-43` says read the detail and *exactly* what its
   carry list names (54 lines: the prototype's 48 pages, 98 pictures, eight readers' files...).
   `SKILL.md:28-32` narrows it to what Look needs, and `SKILL.md:135` / the conductor say the conductor
   keeps a thin context. Did: read DETAIL.md whole, the cast sheet's "Look", "Blind rules" and "Fresh
   pass", the context's "Constraints", DECISIONS.md's headings (for gallery marks: none), and left the
   rest to the seats that are handed them.

8. **No fresh gallery marks exist to copy.** `SKILL.md:31-32` and `seats.md:32-34`: copy his marks word
   for word from `DECISIONS.md`, or "Nothing marked". No fresh pass ran at Structure (D-04, D-05;
   `03-cast.md`, "Fresh pass"). Did: "Nothing marked" in the brief. Clear as written.

9. **No name for the brief's file, and the page names.** `SKILL.md:47` and `seats.md:8` put briefs in
   `<package>/work/`, with no file name. Did: `work/look-maker-visual-designer-brief.md`, by the pattern
   of the names already in `work/` (listed, not read). The skill gives no page naming for `screens/`
   either; step 9 (`SKILL.md:134`) implies `<screen>-<state>-<language>.html` by its picture example
   `shots/today-default-en-390-light.png`. Did: told the maker to name each page as the prototype's.

10. **Where the visual designer's own measuring script goes.** `SKILL.md:107-108`: "any other value was
    read in the browser by a script of the visual designer's own, kept beside the table". `seats.md:48-49`
    puts "the pictures and the results of its own check" in `<package>/work/look-check/`, and the
    conductor never reads `work/` (`design/SKILL.md:186`), yet step 5 has the conductor hold each row to
    that script. Did: told the maker to keep its own pictures and check in `work/look-check/`, and the
    script for values `accept.mjs` does not measure, with its output, beside `measures.md` in `06-look/`.

11. **Browser limit: three, or two.** `loop.md:127-129`, `SKILL.md:119` and `:199`, `seats.md:60,104`
    say three at once; the controller says two. Followed two (as at Detail, `notes/detail.md` 1).

12. **`begin` before the template is copied.** `SKILL.md:65-73` begins (step 1) before LOOK.md exists
    (step 2); `begin` printed "look is in work" and `validate` stayed `ok` after the copy. Worked.

13. **The maker's own results are not the conductor's run.** The visual designer wrote `measures.md` from
    its own `accept.mjs` run, results in `work/look-check/results.json` (as `seats.md:48-49` has it), and
    its table cites that file. `SKILL.md:96-111` has the conductor run `accept.mjs` again into
    `06-look/results.json` and hold the table to *that* run, never reading `work/`. Did: ran both
    commands of step 5 myself and compared the table to `06-look/results.json` only.

14. **Step 5 found the table not true to the runs, and sent it back.** `SKILL.md:105-111`: each contrast
    and size is "the `actual` of a result in `results.json`"; anything else from the maker's own script
    beside the table; "a value that differs ... goes back to the visual designer, once, before the
    readers start". `shots.mjs`: 192 pictures, exit 0, no `error:`/`overflow:`. `accept.mjs`: 844
    checks, 0 failed. Compared by script (no browser), the table against `06-look/results.json` and
    `06-look/measured.json`: (a) the `try-again`/`end-now` contrast row says 6.84 light / 7.74 dark as the
    worst case, but `try-again` on `first-load-failed-loading-first-paint-*` measures 5.78 / 6.82; (b)
    every row marked theme "both" rests on `measure.mjs`, which runs `theme: 'light'` only
    (`measure.mjs:44`); (c) "stacked, 16 px (390)" has no reading behind it; (d) the answer-to-region
    row names no screen while stale measures 76 px; (e) "every line of text on the 48 pages" rests on
    ten pages and on `answer` alone; (f) the table cites `../work/look-check/results.json`. Did: wrote a
    fresh visual designer's brief, `work/look-maker-visual-designer-measures-brief.md`, the first
    brief's hand-over plus the screens as they stand, the table, the checks, the session's results and
    its own script, with the six rows by fact and no value of mine.

15. **The send-back of step 5 has no form.** `SKILL.md:109-111` says "goes back to the visual designer,
    once"; `seats.md:64-68` ("When it is started again") lists a fix round, a variant he picked, a
    correction and a borrowing, not this; and `loop.md:113-114` forbids continuing an earlier agent.
    Unclear whether this "once" is the same as step 8's one fix round, and what hands the maker the
    mismatches (no ledger holds them; a brief is not to carry an artefact). Did: a fresh sub-agent, the
    mismatches written in its brief as facts with the result ids, and counted it apart from step 8.

16. **"Each size" in step 5 covers font sizes `accept.mjs` cannot measure.** `SKILL.md:105-107` says
    each contrast and each size is a result's `actual`; `accept.mjs --help` measures a box
    (`min-size`), not a font size. Read "size" as a target's size; font sizes, gaps and line lengths as
    "any other value", from the maker's own script.

17. **The maker's reply, relayed by the controller, is not in the package.** The visual designer's
    reply (hidden English frame captions, states drawn as `default`, `ln-tag--held`, the three
    component CSS files linked, `role="dialog"` with `aria-labelledby` on a new html `id`
    `look-room-name`) reached me through the controller's message, and `design/SKILL.md:34-39` says
    the chat is not an input. `seats.md:61-63` sends "what it could not draw as approved" to the founder
    with the gate. Did: will write the reply's items into LOOK.md "What the readers found" at step 9, as
    Detail did with the prototype builder's reply.

18. **The maker's tools sit beside the screens, where the readers look.** The visual designer wrote
    `build-look.mjs`, `build-checks.mjs`, `measure.mjs`, `measured.json` into `06-look/` (the brief
    asked for the measuring script there, entry 10). `seats.md:114-128` has no line for them. Did: listed
    the four under "Do not open" in every reader's brief, with the makers' notes.

19. **Today's screen is nobody's at Look, and is the sibling surface.** `seats.md:144` (visual craft):
    "Today's screens are Context's read, and nobody's here." `seats.md:152-153` hands the system
    fidelity judge "the sibling surfaces, by the paths the carry list names for them"; the only one the
    carry names is `source:src/screens/day.html`, today's day list, which free-now sits beside. Did:
    handed `day.html` to the system fidelity judge as the sibling surface; listed `src/screens/` under
    "Do not open" for the visual craft judge.

20. **DETAIL.md carries the Detail readers' findings.** Readers are not to open `05-detail/reads/`
    (`seats.md:120-121`), but the accessibility judge and the maker are handed DETAIL.md for its rules,
    and its "What the readers found" quotes every Detail ledger. Did: named the sections to read
    (Rules, Edge cases, Data map, Dependencies) in each brief; the file is still whole.

21. **Briefs written early.** The four readers' briefs (`work/look-judge-*-brief.md`) were written
    while waiting, before step 5 holds; they start only after it does.

22. **Step 5 held on the second look, without a rerun.** The fresh visual designer changed only
    `measures.md`, `measure.mjs` and `measured.json`. Checked against the files, not the message: no file
    of `screens/` or `checks.json` is newer than the shots log (`find -newer`), so neither command was
    run again (`SKILL.md:110-111`: "after every change to the screens"). Compared by script: every
    contrast and target row is a result's `actual` in `06-look/results.json`, at its width and theme;
    every size, gap, row height, line length and page width is in `measured.json`, now 192 readings
    (48 pages × 2 widths × 2 themes, none faulted). One soft spot, not a value: "both on stale-overflow"
    names one of several pages that share the longest line (56 also on `first-load-failed-*-en`); left
    as it is, since the value is behind it.

23. **What a reader is handed: the skill and `seats.md` disagree.** `SKILL.md:119-120`: "Each is handed
    the final screens with `measures.md`, the pictures, and what else its card reads." But
    `seats.md:151-155` hands the system fidelity judge no pictures (its card's `reads` has no
    `pictures`), and `seats.md:196-197` keeps the profile judge out of "the pages themselves: it reads
    the screens as pictures", so it gets no `measures.md` either. Did: followed `seats.md` and the cards,
    the narrower of the two.

24. **Three `blocks`, and two of them meet costs he accepted at Detail.** Read from the four ledgers in
    `06-look/reads/`. Blocks: `judge.visual-craft` 1 (success says nothing in words of what changed),
    `judge.accessibility` 1 (the dialog's only way out is Escape; add a "Close"/"Cerrar" control and
    `aria-modal`), `judge.system-fidelity` 1 (`.look-list .ln-row { display: block }` remakes the list
    row). What the kit and the package gave me for the first two:
    - `skills/look/SKILL.md:127-128`: "A finding on a string, a state or a rule is not Look's to fix: it
      goes to the founder, open." Both need a new string (a "what changed" line; a "Close" label, in
      neither language in `05-detail/strings.json`) and visual-craft's a state the structure cannot hold;
      accessibility's meets the rule in `DETAIL.md` "Keyboard": "Escape is the only way to close it:
      there is no close item, on any width." So neither goes to the fix round.
    - The package: `DECISIONS.md` D-07 (accepted deviation, no words for what changed): "A judge at Look
      or Acceptance that finds it is pointed here"; D-06 "Cost, accepted": "the dialog has no visible way
      out"; `DETAIL.md` "What the structure cannot hold" 1 and 6, answers 18, 23 and 28.
    - What neither gave: a way for a judge to *see* it. His words at Detail were "Record it so the judges
      and the builder can see I said so", and D-07 says the judge "is pointed here", but `seats.md:136-200`
      hands no Look judge `DECISIONS.md` or DETAIL's lists (and a judge "is told what to read, never what
      to find", `loop.md:94`). So the visual craft judge, holding only the intent, marked the accepted
      deviation `blocks` against the intent's "States". Nor does the skill say how an open `blocks` on an
      accepted cost stands at the gate. Did: no fix for either; both go to the founder open on the
      decision page, each with its source in the package (D-07; D-06 and "What the structure cannot
      hold" 6), and no question now (the skill asks none before the gate).
    - Accessibility's fix has a part with no string or rule in it (`aria-modal="true"`). The skill gives
      no way to split a finding; splitting it would be the conductor mending. Did: the finding went whole
      to the founder.
    The profile judge's first fix (the dialog's four states the same picture; say what changed or
    failed) is a `should`, and meets the same D-07 and "What the structure cannot hold" 8 (answer 25).

25. **The fix round: system fidelity 1 only.** A part, not a string: Look's. But its fix (room name to
    `ln-row__main`, time to `__meta`) splits strings that are one fragment, as `now.free-rooms.row`
    "{room}, free until {time}", whose why-line says "A row is a fragment, not a sentence, as the
    list-row component expects". The ledger's own alternative is a named extension. Did: handed the
    finding as written, with the card's "never change a string"; the maker decides. Brief:
    `work/look-maker-visual-designer-fix-brief.md`.

26. **Who re-reads.** `SKILL.md:124-126`: "for each judge that marked one, a fresh sub-agent in the same
    seat reads again". Three judges marked one, but two of their blocks were not sent to the fix round.
    Read literally: three re-reads, visual craft and accessibility among them (the rows' change bears on
    both). Briefs: `work/look-judge-{visual-craft,system-fidelity,accessibility}-reread-brief.md`,
    written now, to start after step 5 runs again on the fixed screens.

27. **What the readers reported did not fit.** Visual craft: `06-look/reads/` did not exist, it made the
    folder (the skill's Writes table names it, no step makes it); it opened about a dozen of 192
    pictures. Accessibility: the brief put `focus-in-overlays` off with the Detail reason ("the intent
    names nothing that opens over the screen"), copied from the cast sheet, yet the dialog opens over
    `now`; it ran the check by its card's rule. The status tags carry no `data-ux`, so `accept.mjs`
    cannot measure their contrast (`accept.mjs --help`: a check targets a `data-ux`); no reader measured
    a tag. Profile: the profile is a stub, only "Usage context" has a "So the interface must" line;
    it compared most of 224 pictures by hash (there are 192 in `shots/`: its count is its own).
    System fidelity: read the source only, rendered nothing.

28. **The fix maker wrote over the session's results file.** It reports `results.json` "re-run";
    `06-look/results.json` has a newer time than my run (05:53). `SKILL.md:96-111` makes that file the
    session's run, and `seats.md:48-49` puts the maker's own results in `work/look-check/`; the fix brief
    (from the first) listed `results.json` among what it reads, not where it writes, but said nothing
    against writing it. Did: ran both commands again myself, which writes the file anew from my run.

29. **Step 5 again after the fix round: one row does not hold, and "once" is unclear.** My runs:
    `shots.mjs` 192 pictures, exit 0, no `error:`/`overflow:`; `accept.mjs` 844 checks, 0 failed. Every
    contrast and target row is a result's `actual`; every other row is in `measured.json` (192 readings,
    none faulted), but one: "every line of text on the 48 pages · longest line · 32 (en) · 34 (es) ·
    390", where `measured.json` holds 33 (en) and 38 (es), in `room-booking` on
    `room-actions-overflow-*`. `SKILL.md:108-111`: a value that differs "goes back to the visual
    designer, once, before the readers start", and "Both commands are run again after every change to
    the screens"; step 8 (`:123`) says "Then step 5 again", and `:126` "There is no second round".
    Unclear whether "once" is once per run of step 5 or once in the stage, and whether a table sent back
    after the fix round is a second round. Did: read "once" as once per run of step 5 (the re-readers
    have not started, and a table send-back is not a fix of findings), and wrote a fresh visual
    designer's brief, `work/look-maker-visual-designer-measures-2-brief.md`, with the one row as fact.
    Also told it not to write over `06-look/results.json` (entry 28).

30. **Step 5 holds after the second send-back.** Only `measures.md` changed (line 51, now 33 en · 38 es,
    as `measured.json` has it); no file of `screens/`, `checks.json`, `measured.json` or `results.json` is
    newer than my second measuring run, so neither command was run again. The 50 table rows read again
    against the comparison of entry 29: all hold. The maker did not load its lens for a table-only edit
    (its card: "Load it if it is installed"); nothing in the brief said a table-only send-back needs it.

31. **What the re-reads said did not fit.** System fidelity: its cast reason for `new-parts` ("held is in
    no tag, token or string of Linden", `03-cast.md` "Look") needs the strings, which `seats.md:151-155`
    does not hand it; it searched `src/strings/*.json` once, used in no finding. Accessibility: DETAIL.md,
    handed for its rules, printed this seat's Detail findings before its cold read (entry 20, as
    feared); and the status tags carry no `data-ux`, so it computed their ratios from `tokens.css` by
    arithmetic. Visual craft: opened 14 of 192 pictures. Its re-read keeps finding 1 at "Blocks still",
    though the session sent it nowhere (entry 24): a re-read of a `blocks` that was never sent to a
    maker can only say "still present", which is what entry 26's literal reading cost: two agents.

32. **"What the look decides" is the maker's, but the conductor writes it.** `templates/package/06-look/
    LOOK.md:27-30` asks for one line each on hierarchy, spacing, emphasis, density, widths, themes;
    `SKILL.md:128-130` (step 9) has the conductor fill LOOK.md; the maker's card Output
    (`pool/makers/visual-designer.md:68-74`) and `measures.md` carry no such lines. Did: described them
    from `look.css` and the table, values only as the table has them, and said so in the section. A
    session that "proposes no design and judges none" writing these is a near miss.

33. **Which pictures go on the page.** `SKILL.md:133-134`: "the pictures named from the page, the phone
    width first, as `shots/today-default-en-390-light.png`", with no number and no choice of screen. Did:
    six of `now-default` (en, es, en dark, at 390, then the same at 1280), as Detail chose four.

34. **The visual designer's replies on the page.** Its seat is a maker, with no line under "seats" (one
    line for each reader); its "could not draw as approved" goes to him open (`seats.md:61-63`). Did:
    put its seven reply items under `findings` as `maker.visual-designer`, and in LOOK.md, as Detail did
    with the prototype builder. They reached me only through the controller (entry 17).

35. **The measured table and its prose.** Step 9 says "Measured values" and "Named extensions" are
    copied from `measures.md`, row for row; `measures.md` also holds a paragraph above the table and one
    below. Did: copied the section whole, with a line saying where it is held.

36. **The gate.** The answer was under "Look · gate, with one proposal: do you approve these screens for
    Handoff?", its *When* held (one option). Written under `## Reviewed by the founder` and stamped with
    it; `await` recorded "Do you approve these screens of free-now for Handoff?" first. No fresh pass
    offered: `SKILL.md:162-163` runs one he asks for, `fresh-pass.md:11` says he can ask at any decision
    page, and no step has the conductor offer one at Look, so the answers file's "Look · a fresh pass"
    (*asked* "only when the conductor offers one") was not used. Nor "a line for the project profile":
    no line was put to him.

37. **The project's decisions log.** `templates/package/DECISIONS.md:7-9`: a decision that changes the
    product, not only this design, is also logged in `decisions-log` (`docs/decisions.md`). D-10 adds five
    tokens to be put into Linden's token file and a held tag: arguably the product's design system.
    `SKILL.md:179-180` says only the package's `DECISIONS.md`. Did: the package's only; nothing was
    written outside the package, and the profile was not changed.

38. **The carry list.** `SKILL.md:167-172`: the detail's own carry list as it is (54 lines, none naming
    a `fresh/` file), six `detail@1#` lines (slugs from `state.mjs slug`) and seven `source:` lines,
    `<tokens>` as `design/kit/tokens.css` (entry 1). `stamp` accepted it at the first try: "stamped look
    approved at version 1 on 2026-11-15". `validate` ok, `next` handoff, no open question.

Seats this stage started: 11 (the visual designer four times: the screens, the table sent back twice,
the fix round; four first reads; three re-reads).
Times stopped for the controller: 6, all for seats; none for a question the answers file lacked.
A session with no memory could pick the package up from here: `state.mjs status` shows Look approved and
`next` prints `handoff`; it would read `design/free-now/06-look/LOOK.md` first, then exactly what its
`## Carry` names (the screens, the pictures, the reads, `measures.md`, `checks.json`, `results.json`,
`design/kit/tokens.css`, DETAIL's six sections and the detail's own carry list).
