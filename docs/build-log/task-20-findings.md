# Task 20 · what the dry run found, sorted

Every entry of the eleven notes files in `dryrun-notes/` (274) is sorted into one class. Each named kit
file and line was opened and checked against the kit as it is today: the branch stands at `75c7e03`
with a clean tree, so the kit is the one the run used and the notes' line numbers hold. Paths are from
the kit's root unless they start `design/` (the run's project). A note is cited as `stage n`
(`detail 12`); `_controller` is the controller's own file of added answers, not counted in the 274.

Items `F1`… are numbered in the order of the pipeline's stages, by the first note that reports each.
Only `mechanical`, `wording` and `decision` items carry an id; the notes sorted `rig`, `cannot-show`,
`works` and `not-so` are listed one line each at the end.

## Counts

Entries (notes), by class and by the stage whose notes file holds them:

| Class | setup | frame | context | intent | cast | structure | detail | look | handoff | acceptance | builder | All |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mechanical | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 2 | 1 | 0 | **5** |
| wording | 8 | 8 | 8 | 14 | 14 | 15 | 21 | 20 | 13 | 15 | 2 | **138** |
| decision | 5 | 2 | 4 | 7 | 0 | 7 | 10 | 4 | 7 | 8 | 4 | **58** |
| rig | 1 | 1 | 1 | 2 | 0 | 2 | 5 | 4 | 3 | 1 | 3 | **23** |
| cannot-show | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | **1** |
| works | 4 | 1 | 0 | 0 | 2 | 5 | 8 | 9 | 2 | 3 | 5 | **39** |
| not-so | 0 | 0 | 0 | 0 | 2 | 0 | 1 | 0 | 2 | 0 | 5 | **10** |
| **All** | 18 | 12 | 13 | 23 | 18 | 30 | 45 | 38 | 29 | 28 | 20 | **274** |

Items: 4 mechanical, 80 wording, 27 decision (111 in all, `F1`–`F111`).

## Things to know before reading the items

- **Two of the ledger's totals do not match the notes.** The notes' own closing lines count 39 seats
  (Intent 1 · Structure 7 · Detail 12 · Look 11 · Handoff 2 · Acceptance 6), and with the stand-in
  builder 40 sessions; the ledger's step 2–3 totals line says 46. The closing lines count 21 stops for
  the controller (setup 1 · intent 1 · structure 2 · detail 8 · look 6 · handoff 2 · acceptance 1); the
  ledger says 20. The draft of `DRY-RUN.md` uses the notes' numbers and says so.
- **Two notes contradict each other, and one is wrong about the cause.** `intent 23` says `await`
  rewrote the header; `structure 29` says `await` left it at `draft`. `await` writes `status: awaiting`
  (`scripts/lib/state.mjs:131`); at Structure the conductor rewrote `CHOSEN.md` whole after `await` and
  put `draft` back. What is true in `structure 29` is that `validate` then said `ok` (F62).
- **The ledger labels `intent 22` MECHANICAL.** It is sorted `decision` (F36): the header grammar is
  the kit's own and says so ("no escapes", `scripts/lib/frontmatter.mjs:1-4`), and the kit reads its own
  header back rightly; whether headers must also be YAML is a choice.

---

## Mechanical

**F62 · confusing** · `scripts/lib/state.mjs:305`
- **What happens.** `validate` compares the header's status with the state's only for approved: a
  header that says `draft` while the state says `awaiting` passes. (`await` itself writes `awaiting`;
  the conductor's whole-file rewrite put `draft` back.)
- **Notes:** structure 29.
- **Failing test:** `await` a stage, write `status: draft` into its header, run `validate`: expected a
  `bad-header` line ("the header says draft while the state says awaiting"), today `ok`.

**F85 · wrong result** · `scripts/accept.mjs` (types), `skills/look/SKILL.md:105-108`,
`skills/handoff/references/folder.md:168-170`, `templates/package/07-handoff/ACCEPTANCE.md`
- **What happens.** No check type measures a font size, a gap or the length of a line, so those rows
  rest on the visual designer's own script at Look and become "measured by a person", with no method,
  in the handoff; at Acceptance a person counted the longest line as 31 where the table says 33, on
  byte-identical pages.
- **Repeats Task 17's minor (deferred) M2** ("the measured rows `accept` cannot check rest on the
  visual designer's own script (wants a computed-style check type)"): not a new item.
- **Notes:** look 16, acceptance 10.
- **Failing test:** an `acceptance.json` check of a computed-style type (a `font-size`, a gap) is
  refused today as a type the in-page file does not know.

**F94 · costs time** · `templates/package/07-handoff/SPEC.md:23` against
`templates/package/05-detail/states.md:14`
- **What happens.** `SPEC.md`'s States table is State · What she sees · What she can do · Its page;
  `states.md`, whose rows it copies (`folder.md:115`), adds Screen and Where the focus is, which a
  builder needs. The conductor extended the table by hand.
- **Notes:** handoff 8.
- **Failing test:** the SPEC template's States header holds every column of the states template's
  header plus "Its page".

**F96 · wrong result** · `scripts/inpage/accept-inpage.js:213-222`; `templates/package/07-handoff/ACCEPTANCE.md:60`
- **What happens.** The `text` check joins the element's text nodes with nothing between blocks
  ("Longest free firstRoom 5, free until 12:00Room 1"), while the template and `--help` say it reads
  "what the element shows, its white space made single spaces". A check written to what she sees fails
  on the approved prototype.
- **Notes:** handoff 11.
- **Failing test:** `<div data-ux="t"><p>Room 5</p><p>free</p></div>` with `text` equals `"Room 5 free"`
  fails today (it reads `Room 5free`).

---

## Wording

Each: id · severity · owning file and line · what happens · notes · the change in one line. Where two
files disagree, both are named, and which one the design document backs.

**F1 · confusing** · `skills/design/SKILL.md:110-111`
- "Read it before the first stage you conduct": setup is not one of the nine stages and never names the
  loop. Notes: setup 1.
- Change: "…before the first of the nine stages you conduct; setup has its own steps."

**F2 · confusing** · `skills/setup/SKILL.md:76-77, 84-86, 158-159`; `templates/project/PROFILE.md:35`
- A question the project answers is skipped, but `product` is "as the founder would say it" and step 8
  calls it "his sentence"; stubs are written "for each one he names", so none when the question is
  skipped. Notes: setup 3.
- Change: say that a skipped answer is written from the project's document, with its path, and that a
  stub is written for each profession the documents or he name.

**F4 · confusing** · `skills/setup/SKILL.md:75-77, 97-98, 141-142, 151-155`; `templates/project/PROFILE.md:78-81`
- His "No" to 4.5 and 4.6 has no place in the profile; a tool the session lists by name but has not
  loaded may or may not count as listed; a tool listed and refused is both `listed` and `off`. Notes:
  setup 6, 7, 14.
- Change: "Engine check" opens with his answers to 4.5 and 4.6 in his words; a tool listed by name
  counts as listed; `off` wins over `listed` when he said no.

**F5 · costs time** · `skills/setup/SKILL.md:69-70` against `:99-100`; `:23-33`; `templates/project/PROFILE.md:52-55`
- Step 3 sends an instruction he cannot answer to "Not known yet."; step 4 makes the same thing a
  question; "the kit's five" kinds are in `skills/design/references/routes.md`, which setup does not
  read. It stopped this run only because the answers file had no entry. Notes: setup 8, 9;
  `_controller` line 1. The design (§ 4.9) backs asking only "the few things it cannot read: the
  product in one sentence, the languages, his standing rules".
- Change: step 4's last paragraph names only the account and the decision log; "Kinds this project
  adds" is written "None while the five serve"; Frame, which reads `routes.md`, asks when a request
  fits none of the five.

**F7 · wrong result** · `skills/setup/references/project-kit.md:71-84, 116-117`; `kit/grey/kit.css:1-7, 26`
- It says to give each `--ux-*` property the project's token, and nothing of the grey kit's own
  `@media (prefers-color-scheme: dark)` block, which sets the same properties to greys and overrides
  the mapping in dark; nor of `kit.css`'s opening comment ("for a project with no design system").
  Notes: setup 11.
- Change: "Delete the grey kit's dark block once each property reads a token whose file switches
  itself; rewrite `kit.css`'s opening comment to name the project kit."

**F10 · confusing** · `skills/frame/SKILL.md:71`; `skills/cast/SKILL.md:76`; `skills/cast/references/presets.md:9-19`
- "The preset for this kind and size", but the preset has rows by size only. Notes: frame 2, cast 2.
  The design (§ 4.3) says "kind and size".
- Change: `presets.md` "By size" says that the kind enters only through "Added by rule".

**F11 · confusing** · `skills/frame/SKILL.md:74-79` against `templates/package/00-frame.md:54-55`; `skills/cast/SKILL.md:96-98` against `:114-116`
- Frame's step 6 covers "each maker the preset adds by rule", the template only the provisional cast;
  Cast's "shown all the same" has no section for a seat with its engine off that is not in the preset.
  Notes: frame 3, cast 10.
- Change: both say "the seats of the provisional cast, and the makers that sit by rule"; Cast lists the
  by-rule makers whose engine is off under "Left out".

**F13 · confusing** · `skills/frame/SKILL.md:99-100, 123-124`
- Whether a design name he changes puts the whole frame to him again; whether a fact in his gate answer
  ("the day list stays as it is") may be used in the frame's sections. Notes: frame 6, 10.
- Change: "A new name is taken as he gives it; a fact in his answer is written under Reviewed by the
  founder and, where it bears on a value, in its why."

**F14 · confusing** · `templates/package/00-frame.md:13`; `templates/package/02-intent.md:13-14`; `templates/package/06-look/LOOK.md:17-18`
- An instruction in braces that applies only at one size or mode, under "replace each instruction",
  with nothing to replace it with elsewhere. Notes: frame 7, intent 5, look 4.
- Change: each says "delete this line at any other size" / "inside a design system, delete this
  paragraph".

**F15 · confusing** · `templates/package/00-frame.md:29-40, 49-50` against `skills/frame/SKILL.md:71, 119-121`
- The Route table has no `frame` row though `status` prints one; its Reason column asks a reason on
  every row while the skill asks one only for a stage that is short, skipped or changed; the template
  draws the cast "from `pool/INDEX.md` and the project's own pool", the skill from `presets.md`. Notes:
  frame 8, 9. The design (§ 4.3) backs both sources: "from `pool/INDEX.md` and the project's pool,
  starting from the preset".
- Change: a `frame` row ("full, never skipped"); Reason "the size sets it" when unchanged; the cast line
  "the preset of `presets.md`, with the seats of `pool/INDEX.md` and the project's pool".

**F16 · confusing** · `templates/package/DECISIONS.md:8-9`; `skills/look/SKILL.md:179-180`; `skills/acceptance/references/deviations.md`
- "A decision that changes the product … is also logged … in `decisions-log`": no stage says when that
  holds; Frame wrote nothing there, Look's five new tokens and held tag went unlogged, Acceptance logged
  three deviations of thirteen by judgement. Notes: frame 11, look 37, acceptance 23.
- Change: the template gives the test: a new or changed token, part or string the product already
  keeps, or a fact of the facts document.

**F17 · confusing** · `skills/context/SKILL.md:31-32` against `:60`; `templates/package/01-context.md:18-19`
- A project judge that sits at `context` is "checked first, as step 3 says" with no condition, while
  step 3 runs only when the surface exists; the template's first heading speaks of "the cast's judges"
  before any cast exists. Notes: context 1, 10.
- Change: Reads "…when the surface exists"; template "the judges that read it as it is (step 3)".

**F19 · confusing** · `skills/context/SKILL.md:128, 133-135`
- "Each with a recommendation" for a fact only he holds would be an opinion; "where it belongs and
  beside its question" reads as one place or two. Notes: context 4, 5.
- Change: "for a fact only he holds, the recommendation says where his answer will be written and what
  the package already holds on it"; "write it where it belongs, and under its question say where".

**F20 · wrong result** · `skills/context/SKILL.md:154-159`
- "The gate is that one message from him" against "Where a correction meets a fact you read, say so at
  once, with the source: he decides." His correction met two files he did not name and opened a gap
  (is a held room busy while its booking runs?) that nobody asked; the gap went on through Intent (a
  state written on an unknown), Detail (an action hidden for it) and the build ("hold has no home").
  Notes: context 6, 8.
- Change: "After his correction, each fact it meets and each gap it opens is put to him, one at a time,
  with its source, before the stamp, as step 8 of the loop says."

**F23 · confusing** · `templates/package/01-context.md:30-37`; `skills/context/SKILL.md:191-192`
- The inventory holds what the product can show and do; nothing holds what it cannot, which the truth
  judge needs (no sensor, no action that ends cleaning, no analytics). Notes: context 11.
- Change: one line under the inventory: "What the product does not have, that this design might reach
  for: one line each, with its source."

**F24 · costs time** · `skills/context/SKILL.md:129-131, 162-165`; `skills/intent/SKILL.md:139-146`
- Context carries "a section of the frame that Intent needs" with no list, and Intent's carry list then
  drops the frame's sections; nothing says whether the project kit is a project source, so its two files
  were carried to every stage. Notes: context 12, intent 21.
- Change: Context names the section (`who-it-is-for`) and Intent says whether it goes on; "The project
  kit is no project source: the stages that draw reach it by the profile's `kit`."

**F25 · costs time** · `skills/design/references/loop.md:39-43`; `skills/intent/SKILL.md:24-25`; `skills/cast/SKILL.md:25`; `skills/structure/SKILL.md:25`; `skills/look/SKILL.md:28-32`
- "Read … exactly what that output's carry list names" reads as a floor: stages read stylesheets and
  specimen pages they cannot use, and a carried section can only be read by opening its whole file; Look
  narrows the rule on its own. Notes: intent 1, cast 1, structure 1, look 7. The design (§ 6,
  "each stage uses only…") backs a ceiling.
- Change: "Of what the carry list names, open what this stage uses: nothing else is open to it. A
  section entry is read under its heading only."

**F26 · confusing** · `skills/intent/SKILL.md:59-60`
- "The name in lower-case words joined by hyphens" does not say which name; a first name would be a
  trait nobody gave. Notes: intent 3.
- Change: "named for her moment, as the kit's five are (`first-timer`)".

**F27 · confusing** · `skills/intent/SKILL.md:92-95`; `templates/package/02-intent.md:59, 64`
- Three rows have no form for what is not on record: "the feeling, in her word" with no word of hers;
  Success "for how long" on a surface whose job is to know; a "cannot occur because" that rests on an
  unknown. Notes: intent 6, 8, 9.
- Change: allow "not on record: {what is missing}; written again when {it is known}".

**F28 · confusing** · `skills/intent/SKILL.md:36-38`
- "What the intent needs and the context lacks … ask to go back": no test for "needs". Notes: intent 10.
- Change: "The intent needs a fact when a criterion, a task or a state row cannot be written without it;
  a fact only Detail needs goes under 'Constraints that will bite' as not on record."

**F29 · confusing** · `skills/intent/SKILL.md:87-90`; `templates/package/02-intent.md:40-43`
- The example task is third person with an imperative goal; the template says the goal is "as she would
  say it". Notes: intent 11.
- Change: make the example and the template agree: the start in third person, the goal in her words,
  quoted.

**F30 · confusing** · `templates/briefs/judge.md:27-35`; `templates/briefs/maker.md:30-33`
- The profile line stands under the numbered list while the profile judge's card reads the profile
  first; "the section of {the specialty}" has no form for `specialty: none`. Notes: intent 12,
  structure 18, detail 5.
- Change: for a profile judge the profile is item 1 of the list; "with no specialty: its base, whole".

**F32 · confusing** · `skills/intent/SKILL.md:103-116, 136-138`
- Where his yes to the profile judge's read is written; whether a "remark" at the gate is a correction
  that is made in the page. Notes: intent 15, 20.
- Change: "his yes to the read goes under Reviewed by the founder"; "a remark that changes what the page
  says is a correction; one that explains it is written under Reviewed and nowhere else".

**F33 · confusing** · `templates/outputs/LEDGER.md`; `pool/judges/profile.md:67-69`; `pool/judges/cold-implementer.md:87-95`
- The ledger has no place for the profile judge's "answer the job first" lines (the seat added a
  heading of its own), nor for the kind of each of the cold implementer's items (the seat put Q/G tags
  in the Check column, and its count did not match its tags). Notes: intent 16, handoff 18.
- Change: a "Job first" block for the seats whose cards ask for one, and a Kind column (question ·
  guess) for the cold implementer.

**F37 · confusing** · `skills/design/references/loop.md:28-30, 177-184`
- `await` rewrites the output's header (status, approval, words); the loop says so only of `begin`. A
  conductor that then writes the file whole puts the old header back (see F62). Notes: intent 23.
- Change: "`await` writes the header: read the file again before you edit it, and never write the
  header yourself."

**F38 · confusing** · `skills/cast/references/presets.md:44`
- "At every size, an adjustment's short cast included:" does not parse. Notes: cast 3.
- Change: "At every size, an adjustment's short cast among them:".

**F39 · confusing** · `skills/cast/references/presets.md:23-25`; `skills/cast/SKILL.md:187-188`; `templates/package/03-cast.md:21-23`
- Cast must choose three lenses "for this design" and name each on its line; only their names are open
  to it (their meaning is on a card Cast may not open), and "Loaded with" takes a profile or a person
  only. Notes: cast 4.
- Change: `presets.md` gives each lens one line of what it favours; the template's cell reads
  `{a lens · profile.<name> · person.<name> · —}`.

**F40 · confusing** · `skills/cast/SKILL.md:87-89`; `skills/cast/references/presets.md:26-28`
- Which contrast person, contrasting with what, is not said. Notes: cast 5.
- Change: "the person whose moment the intent's tasks do not already cover, with the reason on its line".

**F41 · confusing** · `skills/cast/SKILL.md:90-93`; `pool/judges/profile.md:46-47`
- The first cut is "on when the intent says its trigger will be there", but the profile judge's
  triggers are in the profile; and whether a judge is cut once or once for each stage it sits at is not
  said. Notes: cast 6, 7.
- Change: "the profile judge's checks are cut on its profile; each row of the sheet is cut for its stage".

**F42 · confusing** · `skills/cast/references/presets.md:61-62`; `skills/look/references/seats.md:189`
- "At Look only when a criterion that fires is about legibility or about where she uses it": "a
  criterion that fires" is defined nowhere Cast reads. Notes: cast 9. The design (§ 4.6, "one of its
  triggered criteria concerns legibility or context") is no clearer.
- Change: "when one of its optional checks about legibility (`physical`) is on, or the profile has a
  'So the interface must' line under its usage context".

**F43 · confusing** · `templates/package/03-cast.md:13-14, 21`; `skills/design/references/loop.md:120-123`; `skills/cast/SKILL.md:105-109`
- After his change the columns "Suggested model" and "Suggested effort" hold his choice while the
  sheet's standing line still calls them the cards' suggestions; the proposal sentence of step 9 has no
  place. Notes: cast 11, 12.
- Change: columns "Model" and "Effort"; the line "the cards' suggestions until he changes one"; a line
  for the proposal; `loop.md` names the new columns.

**F44 · confusing** · `skills/cast/SKILL.md:121-126, 148`
- "Where you think one would earn its cost, say so in one sentence at the gate" reads as a second
  question on the page. Notes: cast 14.
- Change: "say so in one sentence under 'Fresh pass', as a statement".

**F45 · confusing** · `skills/cast/SKILL.md:127-130`
- The cost counts first reads only; each `blocks` adds a fix-round maker and a re-read judge, so he
  approves a floor. Notes: cast 15.
- Change: "say beside the count that a stage whose judges block adds one maker and one judge for each".

**F46 · confusing** · `skills/cast/SKILL.md:154-157`
- "Each section of the intent but the two last … 'What the readers found' goes on too": which two?
  Notes: cast 17.
- Change: "every section but 'Reviewed by the founder' and 'Carry'".

**F47 · confusing** · `skills/structure/SKILL.md:33`; `skills/look/references/seats.md:144, 152-153`; the carry lists of Cast and Structure
- "Today's screen" is not defined for a new surface: the carried day list was taken as today's screen
  at Structure (never opened) and as the sibling surface at Look; no line says the blind on it ends at
  the pick. Notes: structure 2, 28, look 19.
- Change: define "today's screen" as the surface being redesigned, as it is, and "a sibling surface" as
  another surface of the product; Context's "Project sources" says which a file is; Structure says the
  blind ends at the pick.

**F48 · costs time** · `templates/briefs/maker.md:13, 25, 37, 51`; `templates/briefs/judge.md:13, 29, 46, 58`; `skills/structure/SKILL.md:31-32`; `skills/structure/references/seats.md:44`; `skills/look/SKILL.md:41-42`
- The brief templates are filled from the seat's card (`reads`, `never-reads`, Output), while Structure
  and Look forbid the conductor every card but the outside describer's, which they have it read even when
  none is cast; `seats.md` stands in for the reads, not for the reply. Notes: structure 3, 4, look 2.
  The skills ("Every other card is read by its seat") back not opening the cards.
- Change: templates "Read: what `references/seats.md` hands this seat"; "Reply: what your card's Output
  says the reply is"; the outside describer's card is read "when the cast sheet names it".

**F49 · confusing** · `templates/package/04-structure/BRIEF.md:30-33`
- "The real labels" meets the rule that no describer sees today's screen: the real error string names
  "the list". Notes: structure 8.
- Change: "a real label that names a screen of today is given as the facts it states".

**F50 · confusing** · `templates/package/04-structure/CHOSEN.md:48-50`; `skills/structure/SKILL.md:77-79`
- His yes to the brief goes under Reviewed of `CHOSEN.md`, whose template holds only "what he asked to
  be changed". Notes: structure 9.
- Change: "{His yes to the brief, as he said it, with the seats that send it out. Then what he asked to
  be changed on the way to Detail, or 'Nothing'.}"

**F51 · confusing** · `skills/structure/SKILL.md:98-100`
- "Each file gets two keys, and nothing else is touched" gives no command, and a JSON rewrite moves
  every line's spacing. Notes: structure 12.
- Change: "a rewrite that keeps every value as the maker wrote it touches nothing" (or give a command).

**F53 · confusing** · `skills/structure/references/seats.md:124, 134, 146, 164`; `skills/design/references/loop.md:115`; `skills/detail/SKILL.md:41`; `skills/look/SKILL.md:47, 134`
- `<seat>` in a read's file name is undefined at Structure (Detail's `seats.md:116-118` defines it); a
  brief's file has no name anywhere; Look's `screens/` pages have no naming rule. Notes: structure 14,
  detail 4, look 9.
- Change: Structure's seats page takes Detail's sentence on `<seat>`; the loop names a brief
  `work/<stage>-<seat>[-<what it is loaded with>]-brief.md`; Look's pages are named as the prototype's.

**F54 · wrong result** · `templates/briefs/audience.md:13`; `skills/structure/references/seats.md:154-160`; `skills/detail/references/seats.md:207-213`
- One language and one width, while her tasks put her at two widths, the tasks exist in the main
  language only (the second-language reader got them in the first over pictures in hers), and the theme
  is not said. Notes: structure 15, detail 35, acceptance 17.
- Change: "at the width each task puts her at, light; the tasks as the intent holds them, and the brief
  says when that is not her language".

**F55 · wrong result** · `skills/structure/references/seats.md:130-132`; `skills/detail/references/seats.md:78-80`; `pool/makers/prototype-builder.md:9`
- The example day the board and the prototype show comes from the brief or is made up: the truth judge
  at Structure is not handed it (it could check two times of the board), and the prototype builder has
  none (it made up rooms, times and names). The same note finds the board's English caption "opens
  over" (`kit/KIT-CONTRACT.md:72`) on second-language pages. Notes: structure 16, detail 31.
- Change: hand the truth judge and the prototype builder the context's data source the brief's rows
  came from, by its path.

**F56 · confusing** · `skills/structure/SKILL.md:118-119`; `skills/structure/references/seats.md:99-101`
- "The judges in one message, then the audiences": after the judges finish, or only later? Notes:
  structure 17.
- Change: "the audiences once every judge has written its ledger".

**F58 · confusing** · `skills/structure/SKILL.md:131-133`; `skills/design/references/loop.md:143-146`
- A `blocks` on an option that was not picked has no place at a pick gate. Notes: structure 21.
- Change: "at a pick, a blocking finding stays in its seat's line beside its option; nothing is mended".

**F61 · costs time** · `templates/outputs/LEDGER.md:28-30`; `skills/structure/references/seats.md:117-148`
- Findings written for "A, B and C" together leave the conductor to sort which are open on the pick
  (fifteen carried on). Notes: structure 27.
- Change: at Structure each finding's "Where" names the letters it holds for.

**F63 · confusing** · `skills/detail/SKILL.md:63-65`; `templates/package/05-detail/DETAIL.md:7-12`; `skills/detail/references/seats.md:44-45`
- Who writes the title and deletes the template's comment: the designer may touch only its headings,
  and step 9 gives the conductor three sections. Notes: detail 2.
- Change: "copy the template, write `built-from` and the title; delete the comment at step 9".

**F65 · confusing** · `skills/detail/references/seats.md:52-55`; `skills/detail/SKILL.md:183`
- "Stays on the list, with his words" / "accepts it as a cost, in his words": the lists are the
  designer's headings and the conductor writes no state. Notes: detail 11.
- Change: "his words go under Reviewed by the founder, numbered, and one line under the list names the
  number".

**F67 · wrong result** · `skills/detail/references/seats.md:64-65`; `pool/makers/interface-writer.md:27-29`
- The writer's card reads "the product's own vocabulary where the project keeps one"; its hand-over
  holds no file of the project's strings. Notes: detail 15.
- Change: hand the writer the project's string files that Context lists as project sources.

**F68 · wrong result** · `pool/makers/interface-writer.md:30-32, 72-75`; `templates/package/05-detail/strings.json`; `skills/handoff/references/folder.md:127-128` against `skills/handoff/references/seats.md:55-57`
- "Write down, at the top of your work" and "With it, two short lists" sent the writer's bar, lists and
  notes into a `_meta` key of `strings.json`; every judge was then handed maker notes with the strings,
  and at Handoff "copied whole" and "take the reference out" could not both hold. The rig's short reply
  (detail 17) pushed the lists into the file. Notes: detail 16, 32, handoff 6, 22.
- Change: the card says "in your reply, never in `strings.json`"; `folder.md` says the file holds the
  template's keys only.

**F69 · confusing** · `skills/detail/references/seats.md:69-72`; `pool/makers/interface-writer.md:85`; `templates/briefs/maker.md:17-18`
- The writer's two routes cover neither a line for an element the structure lacks (a heading B does not
  draw) nor a fact whose answer settles a dependency; the brief has no line for his fact answers.
  Notes: detail 20, 21, 26.
- Change: a third route ("a line for an element the structure lacks is not written: it is a finding for
  the founder"); a fact that bears on a state goes to the interaction designer too; `maker.md` gets
  "the founder's answers this seat waits for, as he said them".

**F71 · confusing** · `templates/briefs/maker.md:15-21`; `pool/makers/interaction-designer.md:79-80`
- No line for a designer sent back with a writer's list, and its reply does not say how each entry was
  settled. Notes: detail 23.
- Change: "A designer sent back: the entries, by where they sit; reply one line for each".

**F72 · wrong result** · `pool/makers/interaction-designer.md:61-62` against `skills/detail/SKILL.md:83-84, 185`; `skills/detail/references/seats.md:49-50`
- The card forbids dropping an element "quietly"; the skill, taking one out for want of data at all.
  The settling designer hid two actions before he was asked. Notes: detail 24. The skill backs the
  stricter rule ("It is a dependency, and his").
- Change: the card says "an element that needs what the product lacks stays, shown, with its
  dependency: never hidden, never narrowed".

**F73 · costs time** · `pool/makers/prototype-builder.md:59-61` (and `pool/judges/accessibility.md:65-66, 77`, `pool/judges/visual-craft.md:71`, `pool/makers/screen-generator.md:56`, `pool/makers/outside-describer.md:34, 58`); `skills/detail/references/seats.md:31-32` against `:85-86`
- Cards give `node scripts/…` while seats and the conductor run from the project's root (only the
  accessibility card says to run them from the kit); the builder's own pictures go in
  `work/prototype-check/`, which its "Do not open" closes. Notes: detail 29.
- Change: every card says `node <kit root>/scripts/…`, the kit two folders above the card; the makers'
  "Do not open" excepts the builder's own check folder.

**F74 · confusing** · `skills/detail/SKILL.md:91-95`
- Detail's pictures are light only while the profile's browser check says light and dark. Notes:
  detail 30.
- Change: "light only: the themes are Look's".

**F75 · confusing** · `skills/detail/references/seats.md:130, 142, 155`
- "The rest of `04-structure/`: the board" does not except `<chosen>`, which two judges are handed.
  Notes: detail 33.
- Change: "…the board, but `<chosen>` where a seat is handed it" (as Look's `seats.md:127-128` has it).

**F76 · confusing** · `skills/detail/references/seats.md:177-178`; `pool/judges/accessibility.md:60-80`
- "Nothing is measured at Detail" against the card's "Measure. Never estimate" and a reflow check on;
  no place is named for its checks and pictures. Notes: detail 34.
- Change: "colour and size are not measured at Detail; reflow and focus are; its checks and pictures go
  in `work/<seat>-check/`".

**F77 · confusing** · `skills/detail/SKILL.md:99-105`; `skills/look/SKILL.md:118-121`
- `reads/` does not exist when the readers start; the first seat makes it, and a seat that lists the
  folder sees the others' file names. Notes: detail 40 (look 27 met it again).
- Change: "make `reads/` before you start the readers; a seat writes its file and never lists the
  folder".

**F79 · confusing** · `templates/outputs/decision-approve.json:12-14` against `skills/detail/SKILL.md:121`
- The sample's picture names lack the language that the skill's and the picture script's carry, and
  its title assumes a fix round. Notes: detail 42.
- Change: the sample names `shots/today-default-en-390-light.png` and is titled "The prototype".

**F80 · wrong result** · `templates/package/04-structure/CHOSEN.md:35-36`; `skills/detail/SKILL.md:117-119`; `skills/handoff/references/folder.md:207-221`
- Structure promises "Detail closes it, or says why not"; no step of Detail does, so Look inherits the
  findings unanswered and Handoff's coverage must infer each fate; "every finding of every ledger"
  also meets "a letter not chosen must not reach the folder". Notes: detail 43, handoff 14.
- Change: Detail's step 9 answers each carried finding under "What the readers found"; `folder.md`
  takes, of Structure, the findings on the chosen letter and a count of the others.

**F81 · confusing** · `skills/look/SKILL.md:19-20, 38, 89-90`; `skills/handoff/SKILL.md:17-18`; `skills/handoff/references/folder.md:52-56`
- `<tokens>` is the kit's copy at Look while the profile's `tokens` and the carried `source:` line name
  the project's file; Handoff's "as Look's carry list names it" finds two. Notes: look 1, handoff 2,
  builder 19.
- Change: one sentence in both skills: "`<tokens>` is the project kit's copy; the file it was copied
  from is the profile's `tokens`, named with its commit in `PARTS.md`".

**F82 · confusing** · `skills/look/references/seats.md:22-23, 35-39`; `pool/makers/visual-designer.md:9`
- "What the project says of its design system" is a selection; the card reads `kit`, the hand-over
  holds no kit. Notes: look 5, 6.
- Change: "the system's documents, its token file and its component files, never the decision log";
  hand `<kit dir>`, or take `kit` off the card's reads.

**F83 · wrong result** · `skills/look/SKILL.md:105-111`; `skills/look/references/seats.md:48-49`; `skills/design/SKILL.md:186`
- The designer's own measuring script is "kept beside the table" (in `06-look/`) or in
  `work/look-check/` (which the conductor never reads, yet holds rows to); its tools sat beside the
  screens where readers look; the fix maker wrote over the session's `results.json`. Notes: look 10,
  18, 28.
- Change: one place, `06-look/measure/`, for its script and readings, on every reader's "Do not open";
  "never write `06-look/results.json`: it is the session's run".

**F86 · wrong result** · `skills/look/references/seats.md:120-121, 164`
- Readers may not open Detail's reads, but are handed `DETAIL.md` whole, whose "What the readers found"
  quotes every Detail ledger; the accessibility re-read met its own Detail findings before its cold read
  (against R127). Notes: look 20, 31.
- Change: hand `DETAIL.md` "for its Rules, Edge cases, Data map and Dependencies, never its 'What the
  readers found'".

**F87 · confusing** · `skills/look/SKILL.md:119-120` against `skills/look/references/seats.md:151-155, 196-197`
- The skill hands each reader the screens with `measures.md` and the pictures; the seats page gives the
  system fidelity judge no pictures and the profile judge no pages. Notes: look 23. The seats page
  follows the cards.
- Change: "each is handed what `references/seats.md` gives its seat".

**F88 · costs time** · `skills/look/SKILL.md:124-126`
- "For each judge that marked one, a fresh sub-agent … reads again" includes a judge whose `blocks` went
  to the founder and to no maker; such a re-read can only say "still present" (two agents spent). Notes:
  look 26 (and look 31's visual craft part).
- Change: "for each judge whose blocking finding went to the fix round".

**F90 · confusing** · `templates/package/06-look/LOOK.md:27-30`; `pool/makers/visual-designer.md:68-74`; `skills/look/SKILL.md:128-130`
- "What the look decides" is the maker's, but its Output carries no such lines, so the conductor wrote
  them from the stylesheet: a near miss of "proposes no design". Notes: look 32.
- Change: the card's Output gives one line each on hierarchy, spacing, emphasis, density, widths and
  themes; the conductor copies them.

**F91 · confusing** · `skills/look/SKILL.md:128-136`; `skills/look/references/seats.md:61-63`
- Step 9 names no number or screen for the pictures; the maker's "could not draw" items have no line (the
  page's seat lines are readers'); `measures.md`'s prose is not "row for row". Notes: look 33, 34, 35.
- Change: "the default state of each screen, the phone width first"; "the visual designer's items go
  under `findings`, by seat"; "copy the section whole".

**F92 · costs time** · `skills/handoff/SKILL.md:79-92`; `skills/handoff/references/folder.md:60-62, 73-81`
- The pages link the project's component stylesheets, which are neither the token link nor "a picture or
  a script"; "It must print nothing", while `alone.mjs` prints one line on success (its `--help` says
  so); the index's words "as `states.md` has them" find no language names there. Notes: handoff 3, 4, 5.
- Change: "a stylesheet a page loads from the project is an asset, copied in"; "exit 0 and its one line,
  'stands alone'"; "the languages by the profile's codes".

**F95 · confusing** · `skills/handoff/references/folder.md:166-170`
- "A `contrast` with its `min`": the measured value or the standard? Notes: handoff 10.
- Change: "its `min` is the standard the row is held to; the measured value stands beside it in
  `ACCEPTANCE.md`".

**F97 · confusing** · `skills/handoff/references/seats.md:27-33, 80-81`
- "The rest of the project's own source" covers `design/`, which holds the folder itself; the gate folder
  is closed whole while the re-read is handed the ledger in it. Notes: handoff 16, 23.
- Change: "the project's code, not `<packages>`"; "`07-handoff-gate/`, but the earlier ledger on a
  re-read".

**F98 · confusing** · `skills/handoff/references/seats.md:61-63`
- "A state with no page": is a case inside one row of `states.md` (three kinds of room in one dialog
  row) a state? Read the other way it reopens Look. Notes: handoff 19.
- Change: "a row of `states.md` with no page; a case inside a row is held by `SPEC.md` and listed in
  `ACCEPTANCE.md` as one a person looks at".

**F100 · wrong result** · `skills/handoff/SKILL.md:132-137`
- A default is put to him without being held against the approved pages and checks; the first default
  for an action hid a button the approved page draws, seen only after his answer. Notes: handoff 26.
- Change: "before a default goes to him, hold it against the pages and the checks it touches".

**F102 · confusing** · `skills/acceptance/SKILL.md:47-53` (Writes, `results/<state>.json`) against `skills/acceptance/references/driving.md:59-61`; `skills/acceptance/references/seats.md:3-5`
- The skill's file name is the form a design with several screens never uses; "each file by its
  absolute path" for some five hundred pictures. Notes: acceptance 6, 15.
- Change: the Writes table says `results/<screen>-<state>.json` where two screens share a state; "a
  folder of pictures is named by its path and its naming rule".

**F104 · wrong result** · `skills/acceptance/SKILL.md:108-109` against `skills/acceptance/references/driving.md:95-98, 109-110`; `templates/package/07-handoff/ACCEPTANCE.md:14-20`
- The skill makes "the checks `ACCEPTANCE.md` leaves to a hand"; `driving.md` only those under
  "Accessibility checks", not the rows "measured by a person" nor what `SPEC.md` holds with no page;
  "judged by eye" may name "a person trying her task", which is neither a judge nor the founder, and no
  reader read the second-language pictures a criterion names. Notes: acceptance 9, 13.
- Change: `driving.md` lists the three kinds; "who looks: a seat of the cast (the task reader for 'a
  person trying her task'), or the founder"; a reader for each language a criterion names.

**F105 · wrong result** · `skills/acceptance/references/driving.md:100-104`
- "Press Tab until focus returns" (headless, focus leaves the page); "Text at 200%. Set it" names no way
  (the root font size and page zoom are not the same test); "write whether anything is cut off" names
  no test for a word broken across lines; the conductor's first line, "nothing clipped", went into a
  judge's ledger as evidence. Notes: acceptance 11, 12, 19.
- Change: "until focus leaves the last stop"; "set the root font size to 200%, and say what was set";
  "whether anything is cut off, needs a sideways scroll, or breaks a word across lines".

**F106 · confusing** · `skills/acceptance/references/seats.md:44-53` against `templates/briefs/judge.md:38`; `templates/outputs/LEDGER.md:13-14`
- A first read of the build that marks the seat's earlier ledger fills a table the ledger keeps for
  re-reads only, and the brief's line is labelled "On a re-read". Notes: acceptance 14.
- Change: LEDGER "On a re-read, or at Acceptance with an earlier stage's ledger: the table"; the brief's
  line "Your seat's earlier ledger".

**F107 · wrong result** · `skills/acceptance/references/seats.md:104-112`; `pool/judges/accessibility.md`
- The accessibility judge is handed the approved prototype but not the build's files, may not drive the
  build, and its card says never judge on pictures alone: its reflow check could not run, and it quoted
  the conductor's line instead. Notes: acceptance 20.
- Change: hand it the build's files as `BUILD.md` lists them (as the system fidelity judge is), and the
  by-hand readings.

**F108 · confusing** · `skills/acceptance/SKILL.md:121-133`; `templates/package/08-acceptance/REPORT.md`; `templates/outputs/decision-approve.json`
- A reader's finding that the approved design already had has no row (step 7 wants one per difference);
  a deviation found by a check or by hand has no seat to put under `findings`. Notes: acceptance 21, 26.
- Change: REPORT "What the readers found that was approved as it is"; the page's `seat` may read
  `check: <id>` or `by hand`.

**F110 · confusing** · `skills/acceptance/SKILL.md:162-172`; `skills/design/references/lessons.md:30`; `skills/design/references/loop.md:207-209`
- Lessons are written "from COVERAGE.md and DECISIONS.md, this stage's reads and the state" in the skill
  and "from the package (its decisions, its ledgers, its cast sheet, its state)" in `lessons.md`; the
  loop appends the stage's own decision, the Acceptance skill names only the deviations'. (The tokens
  the lesson asks for were not counted because the rig started the seats.) Notes: acceptance 27, 28.
- Change: `lessons.md` "at Acceptance, from the sources the Acceptance skill names"; Acceptance "then
  append the decision to the package's `DECISIONS.md`".

**F111 · confusing** · `templates/package/build/STATES.md:6`
- "One row for each state of the handoff's spec": the rows that cannot occur too? Notes: builder 5.
- Change: "every row of `SPEC.md`'s States, those that cannot occur marked so".

---

## Decision

Each: the choice in one line · options · what the design document says · a recommendation with its
cost. Nothing here is decided.

**F3 · stops a run** · `skills/acceptance/SKILL.md:17-19`; `skills/acceptance/references/driving.md:6-7, 11-15`; `templates/project/PROFILE.md:62-67`; `skills/handoff/references/folder.md:243-246`
- **Choice:** what drives a build when the project names a way of looking but keeps no script.
- **Seen:** setup wrote "the project keeps no script"; Handoff could find no command; Acceptance had no
  driver ("a real project like this one would stall here"); `driving.md:14-15` rules out the kit's
  file-opening commands for a build "because neither signs in", which this build never needed; the
  kit's library keeps a visit only while the page stays, so a key that navigates is read from the
  fault text; the builder had no runner for the 1302 checks, and the folder carries no in-page file
  (the builder "has no kit", `folder.md:102`). Notes: setup 5, handoff 13, acceptance 2, 3, 4,
  builder 20.
- **Options:** (a) as written: setup asks for a command, Acceptance stops without one; (b) the
  conductor writes the project's driver at Acceptance on the kit's browser library and, with his yes,
  names it in the profile (R158: worked first try, 1302 checks in 47 s); (c) the kit ships a small
  driver for a build that opens as files or at an address; with any of them, (d) the handoff folder
  carries the in-page file so a builder can run the checks.
- **Design:** § 4.8, "the way the project profile says a check is run" — it assumes the project has one.
- **Recommendation:** (b) and (d). Cost: a section of `driving.md`, a profile line written at
  Acceptance, the "neither signs in" rule reworded, one file copied in at Handoff; a driver differs from
  project to project.

**F6 · wrong result** · `skills/setup/references/project-kit.md:86-114`; `templates/package/04-structure/BRIEF.md:26-28`; `skills/detail/references/seats.md:36-37`; `skills/handoff/SKILL.md:132-135`
- **Choice:** where a step has the conductor select or weigh, is that its proposal for the founder or a
  seat's job?
- **Seen:** which tokens a part wears when the project has none for its job (setup); which one or two
  states are "the hardest" (Structure); which rows are "the worst plausible" (Detail); which default to
  propose for an item nobody decided (Handoff, eight design defaults, made the design by a blanket
  "use the written default"). Notes: setup 10, structure 6, detail 3, handoff 20.
- **Options:** (a) as now, each choice marked as the conductor's on the page he approves; (b) the seat
  chooses: the interaction designer reads the whole inventory, the describers get every state the
  intent says she must be told, the gaps go to him with no default; (c) the conductor selects by a
  written rule (every row that states a limit, a delay or a failure; every "must be told" state).
- **Design:** "You propose no design" (`skills/design/SKILL.md:24-26`).
- **Recommendation:** (c) at Structure and Detail, (a) at setup and Handoff with each choice marked as
  a proposal. Cost: a rule sentence in three files; a rule may hand a maker more rows than it needs.

**F8 · confusing** · `kit/grey/parts.html` (lines 33, 44-75, 134-137, 184-187); `skills/setup/references/project-kit.md:116-117`
- **Choice:** what words the grey kit's specimen holds, since it is copied unchanged into every project
  kit, shown to the founder and, when carried, read by makers.
- **Seen:** room names, "occupied", "closed", "out of service" and 12-hour times, which this project's
  facts and its 24-hour rule contradict; carried by Context to every later maker. Notes: setup 12, 17,
  intent 2.
- **Options:** (a) keep the room-booking example; (b) neutral words that name each part, 24-hour
  zero-padded times; (c) setup rewrites the words from the project's facts (against "nothing of its
  markup").
- **Design:** § 12, "The shared kit", says nothing of its words.
- **Recommendation:** (b), with F24's line that the kit is no project source. Cost: the specimen and the
  tests that read it (Task 3's deferred minor on its room name goes with it).

**F9 · wrong result** · `scripts/card.mjs`; `skills/cast/SKILL.md:70-71`; `templates/people/PROFILE-CARD.md:2, 11-15`
- **Choice:** should `card.mjs check` check a profession's profile?
- **Seen:** the traits copy removes each "So the interface must" field by its label at the start of a
  line, and nothing checks that the labels are there; Frame names a profession from its file name, and
  nothing checks that the id matches. Notes: setup 13, frame 4.
- **Options:** (a) no checker, as now ("read as it is written"); (b) `card.mjs` checks a file in
  `profiles/`: id `profile.<file name>`, the template's headings, the four labels at the start of their
  lines.
- **Recommendation:** (b). Cost: one checker and its tests; setup and Context run it. Test that fails
  today: a sound profile given to `card.mjs check` is reported as in no folder of cards.

**F12 · costs time** · `skills/frame/SKILL.md:46-54, 92-101`; `skills/design/references/loop.md:177-184`
- **Choice:** what a session finds when he answers the frame a day later.
- **Seen:** Frame writes nothing before his yes, so there is nothing to `await` on; a resuming session
  frames the request again. Notes: frame 5.
- **Options:** (a) accept it: the frame is redrafted from the request, and the loop names Frame as the
  one stage with no `await`; (b) `init` before the yes (against "init runs once"); (c) a draft frame
  under `<packages>/`, outside any package, read at step 1.
- **Design:** § 4.0, "He confirms in one message".
- **Recommendation:** (a). Cost: a sentence in `loop.md` and in Frame's step 1; a second frame may differ
  from the one he read.

**F18 · wrong result** · `skills/context/SKILL.md:89-91, 124-127`
- **Choice:** when Context asks for his words: the words she reads, and those she must never see.
- **Seen:** only an unsourced fact becomes a question, so his vocabulary for states ("never 'occupied'")
  was never asked; "or she must read in order to act" is a test the conductor could not apply without
  judging. Notes: context 2, 3.
- **Options:** (a) as now, with a test for "must read to act"; (b) always one question at Context: the
  words she uses for these things and any she must never see; (c) never at Context: vocabulary is a
  standing rule asked at setup.
- **Design:** § 4.1, "asked for here when the words will matter".
- **Recommendation:** (b). Cost: one question at every Context; a founder with none answers "none".

**F21 · wrong result** · `skills/context/SKILL.md:48, 162-163, 194`; `templates/package/DECISIONS.md:8-9`
- **Choice:** how a project source he has corrected is carried, so that the truth judge and the builder
  are not handed two answers.
- **Seen:** the facts document is still carried as `source:README.md` and is what the truth judge
  checks; only prose and a decision say the context wins; the builder meets the contradiction and no
  slice mends the document. Notes: context 7, builder 10.
- **Options:** (a) as now; (b) a carry form for a source overridden on named points, which the truth
  judge's brief names; (c) Context logs the stale fact for the project and Handoff gives a slice to mend
  the document.
- **Recommendation:** (a) plus one line in the truth judge's briefs ("where the context and the facts
  document disagree, the context holds") and (c). Cost: two sentences and a slice; the document stays
  wrong until the build.

**F22 · wrong result** · `skills/context/SKILL.md:160-161`; `skills/intent/SKILL.md:67-68`; `pool/CARD-FORMAT.md` ("The person card")
- **Choice:** does what he says of the profession count as a source, and does it reach the profile?
- **Seen:** his account of her day stayed in the context, so a profile judge handed the profile and not
  the context never had it; the person card had to guess whether his lines are `fact`. Notes: context 9,
  intent 4.
- **Options:** (a) as now: only his corrections reach the profile; (b) written into the profile marked
  `guess (the founder, <date>)`; (c) written as `fact, the founder`.
- **Recommendation:** (b). Cost: profile edits at Context's gate; marking it a guess keeps it honest.

**F31 · wrong result** · `skills/intent/SKILL.md:103-116`; `pool/judges/profile.md:8-9, 83-84`
- **Choice:** should Intent's profile judge read her person card (and the context rows the intent cites)?
- **Seen:** its `reads` holds neither, so the one artefact Intent writes besides the page went unchecked;
  its card's step 6 at Intent asks more ("does it name the profile, the specialty and the person")
  than the skill's one question. Notes: intent 13, 17.
- **Options:** (a) no: say in the skill and the brief that the card is not this read's, and narrow the
  card's step 6 at Intent; (b) yes: add `person` to its reads at Intent.
- **Design:** § 4.2, "is the job stated as this profession would state it?" — backs (a).
- **Recommendation:** (a). Cost: two sentences; the person card is then read by no seat, and the gate
  says so.

**F34 · costs time** · `skills/intent/SKILL.md:103-104`; `skills/setup/SKILL.md:119-121`
- **Choice:** what is offered when the profile the judge reads holds almost no "So the interface must"
  lines (setup writes stubs that way).
- **Seen:** five of six core checks had no line to judge by; one agent for three small findings. Notes:
  intent 18.
- **Options:** (a) as now ("cheap"); (b) the offer says how many "must" lines the profile holds; (c) the
  judge is not seated until it has some.
- **Recommendation:** (b). Cost: one sentence.

**F35 · confusing** · `skills/intent/SKILL.md:113-116`; `skills/design/references/loop.md:144-155`
- **Choice:** may a cheap `should` be mended on a page that is the conductor's own to write (Intent)?
- **Seen:** a one-sentence fix went to the founder open. Notes: intent 19.
- **Options:** (a) no: only `blocks` is mended; (b) yes, at Intent only.
- **Recommendation:** (a). Cost: none; he reads one more line.

**F36 · confusing** · `scripts/lib/frontmatter.mjs:1-4`; `scripts/lib/state.mjs:158`
- **Choice:** must a stage output's header also be valid YAML?
- **Seen:** `stamp` wrote `words: "Approved. One remark: "right now" means …"`; the kit reads it back
  rightly, a YAML reader (an editor, a code host's preview) would reject it. Notes: intent 22.
- **Options:** (a) keep the kit's grammar and say it is not YAML; (b) write a value holding `"` in YAML's
  single quotes (`'` doubled) and teach the reader that form; (c) replace `"` with typographic quotes
  (changes his words).
- **Recommendation:** (b). Cost: the writer, the reader and their tests. Test that fails today: stamp
  with words holding `"`, parse the header as YAML.

**F52 · wrong result** · `scripts/shots.mjs`; `scripts/render.mjs`; `skills/structure/SKILL.md:106-117`
- **Choice:** how a reader sees what is on the first screen, without scrolling.
- **Seen:** the board's pictures are whole pages with every state stacked (up to 5074 px high), so no
  reader could test the intent's "without scrolling". The same notes report that the pictures carry the
  makers' bet, cost and notes: **that part repeats R154 (parked)** and is not listed again. Notes:
  structure 13, 20.
- **Options:** (a) `shots.mjs` also takes a picture of the first screen only; (b) `render.mjs` draws one
  page per screen and state; (c) a fold line on the whole-page picture.
- **Recommendation:** (a), with R154's fix in the same wave. Cost: one flag and its tests; briefs name
  which picture is the first screen.

**F57 · confusing** · `skills/design/references/loop.md:105-109`; `templates/people/PROFILE-CARD.md:11-15`
- **Choice:** who makes the audience's traits copy, and what it keeps.
- **Seen:** four stages made it by an ad hoc script; the profile's opening paragraph still explains the
  field that was taken out, so the audience took the copy for the whole profile; at Acceptance the
  conductor may not read the profile and made the copy blind. Notes: structure 19, acceptance 16 (and
  structure 20's second half).
- **Options:** (a) by hand, as now, with the loop saying whether the opening paragraph and the
  "Evidence" lines stay; (b) a kit command writes the copy (removes each field and the paragraph about
  it, checks that none is left).
- **Recommendation:** (b), with F9. Cost: a small command and tests, used at four stages.

**F59 · confusing** · `skills/design/references/loop.md:135-138, 175`; `skills/structure/SKILL.md:130-132`
- **Choice:** what the one recommendation says when the reads rank the options in opposite orders.
- **Seen:** the profile judge ranked B, C, A and the audience A, C, B; "one recommendation, resting on the
  reads" meets "never settle a disagreement". Notes: structure 22, 23.
- **Options:** (a) recommend, and the reason says the seats split and that he settles it (as done);
  (b) recommend nothing at a split; (c) recommend by a rule (whose ranking counts at which stage).
- **Recommendation:** (a). Cost: one sentence in the loop.

**F60 · confusing** · `scripts/page.mjs` (refusal rule in `--help`)
- **Choice:** where the decision page's "one question" rule counts question marks.
- **Seen:** every "?" in all the data counts, so a seat line or a finding that quotes her question must be
  reworded (the conductor kept every "?" out of seat lines, and at Detail turned each to "."). Notes:
  structure 24.
- **Options:** (a) keep; (b) count only `question` and `recommendation`; (c) allow a "?" inside quotation
  marks.
- **Recommendation:** (b). Cost: small; a seat line may read as a question. Test that fails today: data
  whose finding quotes "is Room 3 free?" is refused.

**F64 · costs time** · `skills/detail/SKILL.md:79-90`; `skills/handoff/SKILL.md:132-135`; `skills/acceptance/SKILL.md:140-145`
- **Choice:** must every entry be its own question, with its own `await` and `begin`?
- **Seen:** Detail asked 36 (27 for one maker's lists), Handoff 13, Acceptance 13; with a real founder
  that is 36 one-question turns before the writer starts, and Detail's "Reviewed by the founder" became
  its longest section. Notes: detail 9, 45, handoff 21, acceptance 22.
- **Options:** (a) as now; (b) one question per list, each entry answered by its number in one message;
  (c) a cap, the rest going to the gate open.
- **Design:** the rule "one question about one thing at a time" (`skills/design/SKILL.md:179-180`).
- **Recommendation:** (b). Cost: wording in four skills; an entry he leaves unanswered stays open.

**F66 · wrong result** · `templates/package/05-detail/DETAIL.md:94-97`; `skills/detail/SKILL.md:178-179`; `skills/look/references/seats.md:136-200`; `skills/acceptance/references/seats.md:57-60`
- **Choice:** where a breach of a standing rule or of the intent that he accepts as a cost is written, so
  that later judges and the builder see it.
- **Seen:** he said "Record it so the judges and the builder can see I said so"; only Detail's Reviewed
  section held it, and the conductor reached for `DECISIONS.md` (D-07 to D-09) on the template's word
  "exception"; Detail's judges, handed `DETAIL.md`, marked the three `should`; Look's judges are handed
  neither file, and visual craft marked D-07 `blocks` twice; Acceptance's judges have `DECISIONS.md`
  under "Do not open"; the skill does not say how an open `blocks` on an accepted cost stands at the gate,
  nor how to split a finding one part of which needs no string or rule. Notes: detail 14, 38, 44,
  look 24.
- **Options:** (a) an "exception" entry in `DECISIONS.md` for each, and the exceptions handed to every
  judge from Detail on; (b) a section "Accepted deviations" in `DETAIL.md` (and `LOOK.md`), carried on,
  handed to judges as part of what was approved, copied to the handoff's "Must not change"; (c) as now,
  and the conductor marks such a finding "accepted at Detail" on the decision page.
- **Recommendation:** (b): a judge is told what was approved, never what to find (`loop.md:94`). Cost: a
  template section, a line in three seats pages, and Detail's stamp step naming each accepted cost.

**F70 · costs time** · `skills/detail/references/seats.md:69-72`
- **Choice:** when the writer → designer → writer round for "Nothing to say" ends, and whether an entry he
  already answered goes round.
- **Seen:** the second writer listed again eight entries the designer had settled; the designer rewrote
  entries he had answered. Notes: detail 22, 25, 27.
- **Options:** (a) as now; (b) an entry the designer settles as "no line owed" is closed, one he answered
  is not sent, one fresh writer takes the facts and the settled entries together; (c) he rules on
  "Nothing to say" entries himself.
- **Recommendation:** (b). Cost: wording.

**F78 · wrong result** · `skills/detail/references/seats.md:212-214`; `templates/briefs/audience.md:30-31, 51`; `templates/outputs/LEDGER.md:40-43`
- **Choice:** what a reader is handed when the pictures outnumber what a seat opens.
- **Seen:** the task readers opened about 20 of 48 pictures, visual craft a dozen and then 14 of 192;
  the audience card and brief ask a ranking where Detail has one option. Notes: detail 41 (look 27 and
  31 report the sampling too).
- **Options:** (a) as now, with the ledger's "Not looked at" listing what was not opened; (b) the brief
  names the pictures her tasks or the seat's checks need first; (c) a contact sheet beside the full set.
- **Recommendation:** (a) and (b) for the audience; whatever is chosen, no ranking is asked where there
  is one option. Cost: brief wording.

**F84 · costs time** · `skills/look/SKILL.md:105-111, 122-126`; `skills/look/references/seats.md:64-68`
- **Choice:** step 5's send-back: how many times, in what form, and who may correct a number.
- **Seen:** the send-back caught six rows the runs did not support, and one more after the fix round;
  "once, before the readers start" against "there is no second round" does not say whether once is per
  run of step 5 or per stage; no form hands the maker the mismatches; one wrong number costs a fresh seat
  because the conductor writes no value. Notes: look 15, 29.
- **Options:** (a) once per run of step 5, a fresh designer with the mismatches as facts by result id
  (as done); (b) once per stage, then open to the founder; (c) a script writes the table's measured
  column from the results.
- **Recommendation:** (a) now, in the skill and in "When it is started again"; (c) with F85. Cost:
  wording.

**F89 · wrong result** · `scripts/accept.mjs` (targets by `data-ux`); `skills/look/SKILL.md:89-90`; `pool/makers/interaction-designer.md:55-58`
- **Choice:** how a check reaches an element that carries no `data-ux`.
- **Seen:** the status tags carry none, so no check measured their contrast (a judge worked it out from
  the token file by arithmetic), and the visual designer may add no id. Notes: look 27.
- **Options:** (a) the interaction designer gives every element that shows text an id, tags included;
  (b) `accept.mjs` takes a target inside an element; (c) the visual designer may add an id for a measured
  part, listed in `measures.md`.
- **Recommendation:** (a). Cost: a card line; more ids.

**F93 · wrong result** · `scripts/alone.mjs`; `skills/handoff/references/folder.md:10-12, 65-75, 115`; `skills/handoff/SKILL.md:184-185`
- **Choice:** what proves that nothing in the folder points back into the package.
- **Seen:** `alone.mjs` passed four times ("338 references in 54 files") while the cold reader twice found
  pointers back (the writers' notes; an approved stylesheet's comment naming `measures.md`; two coverage
  rows), all of a kind the script does not read by its own `--help`; the approved state rows carry
  pointers ("answer 28", "(listed)") which "never change what was approved" forbids rewriting; the
  builder met the stylesheet's comment. Notes: handoff 7, 24, builder 9.
- **Options:** (a) `alone.mjs` also scans every text file for the package's own file and folder names;
  (b) a written checklist, the cold reader staying the test; (c) makers never write a pointer into an
  approved artefact (a card rule), so there is nothing to rewrite.
- **Recommendation:** (a) and (c). Cost: a scan on exact names with its tests; one line in three cards.

**F99 · confusing** · `skills/handoff/SKILL.md:137-139`; `skills/handoff/references/seats.md:85-87`
- **Choice:** whether an item the conductor closes in the folder after the one re-read counts as closed.
- **Seen:** the last blocking item was closed after the re-read, unread; it sat in an approved
  stylesheet's comment the conductor may not edit, so `PARTS.md` explains it; the conductor listed it
  open. Notes: handoff 25.
- **Options:** (a) closed, listed as "closed after the re-read, not read again"; (b) open, for the founder.
- **Recommendation:** (a). Cost: one sentence.

**F101 · costs time** · `skills/handoff/SKILL.md:77-97`; `skills/handoff/references/folder.md`
- **Choice:** should the kit ship a script for the mechanical part of Handoff?
- **Seen:** the conductor wrote five scripts of its own (the spec, the strings, the checks, the coverage,
  the defaults) and rewrote addresses by script; regenerating the coverage page lost a hand edit; the
  first leg took 21 minutes and 95 tool calls (the conductor's reply, in the ledger). Notes: handoff 27.
- **Options:** (a) no: the conductor writes what it needs; (b) one script copies the pages and pictures,
  rewrites the token link and loaded assets, writes the index and the strings in the project's format and
  counts them; the spec and the coverage stay the conductor's.
- **Recommendation:** (b). Cost: a script and its tests.

**F103 · wrong result** · `scripts/accept.mjs` (types); `skills/acceptance/SKILL.md:121-133`; `skills/acceptance/references/driving.md:47-49`
- **Choice:** should the checks see what a page does, not only what it shows?
- **Seen:** a build that is the prototype copied passed 1302 of 1302: no check presses, loads, reloads,
  sends or moves focus, and the page's "0 failed" reads as a clean pass; only the builder's deviations
  and the keyboard pass showed the gap; nine rows draw their state but cannot reach its behaviour, and
  "a row that does not lead to the state" can be read either way. The copy is the rig's, but a real
  build that draws the right things would pass the same way. Notes: acceptance 7, 8, builder 7.
- **Options:** (a) new check types (a key, a load, where focus lands, a change of screen); (b) keep page
  checks, and the decision page's count line says what they cannot see and points to the keyboard pass
  and the deviations; (c) both.
- **Recommendation:** (b) now, (a) later. Cost: (b) a line in step 8; (a) new in-page types and a driver
  that presses keys.

**F109 · wrong result** · `scripts/lib/state.mjs:271-330` (the hash of the output only); `scripts/state.mjs:127`
- **Choice:** what of a stamped stage is guarded against change.
- **Seen:** only the stage's output file is hashed, so `SPEC.md`, `PARTS.md`, `ACCEPTANCE.md` and the
  folder's `DECISIONS.md` (and Detail's `states.md` and `strings.json`, Look's screens) change unseen.
  The same note found that `reopen` printed "stale: none" while Acceptance, awaiting on the old version,
  was recalled and then failed `validate`. Notes: acceptance 24.
- **Options:** (a) as now; (b) the stamp hashes every file of the stage's folder; (c) it hashes the files
  the output's carry list names inside the package.
- **Recommendation:** (b). Cost: the stamp and `validate`, with tests; an accepted deviation then reopens
  the stage, as `deviations.md` already does for `HANDOFF.md`. Also, mechanical: `reopen` names the stages
  it recalled (test that fails today: reopen Handoff while Acceptance awaits, built from `handoff@1` — it
  prints "stale: none").

---

## The other notes, one line each

### rig (23) — caused by the run's set-up; would not happen in real use

- setup 2 — `<scratch>` went inside the run's folder because the machine's rule kept every write there.
- frame 1 — the run's request is Frame's own worked example, so Frame was tested less. **Hides a real
  question:** the kit's examples (Frame's line, `decision.json`'s options, the specimen, the kit check's
  proposal) are all one product, and a project in that domain is anchored by them.
- context 13 — the profile quotes the answers file's "Three." over four rules.
- intent 7 — the answers file foresaw a question about the event's name that the skill never asks (he
  approves the measure with the intent).
- intent 14 — the model went into the controller's reply because the controller started the seats.
- structure 5 — `decision.json`'s example options are this very problem (see frame 1).
- structure 26 — "why it lost" had no answer because the stand-in founder picked "the second" to test the
  mechanics.
- detail 1 — the controller's limit of two browser-driving seats against the kit's three. **Hides a real
  question:** the kit's limit is fixed, with no setting for a machine's own.
- detail 10 — the answers file's entry lacked "one at a time, the same answer for each".
- detail 13 — questions 28–30 existed only because a blanket answer was applied (the kit's catch is
  detail 12, a `works`).
- detail 17 — the seat instructions' one-or-two-line reply pushed the writer's lists into the file (the
  kit's part is F68).
- detail 19 — three facts the answers file lacked; the controller added them.
- look 3 — the answers file's mode question, which the skill never asks.
- look 11 — the browser limit again (detail 1).
- look 17 — the maker's reply came through the controller, not to the conductor.
- look 36 — two answers file entries the skill never reached.
- handoff 1 — the browser limit again (detail 1).
- handoff 12 — the answers file keyed its one Handoff answer on the cold reader's items, so the conductor
  left three part questions to step 9.
- handoff 17 — a stop for seats: the conductor cannot start them.
- acceptance 25 — the answers file's "No" to a fix the size of a correction was never needed.
- builder 2 — copying `prototype/` alone to `src/free-now/` broke its `../tokens.css` link.
- builder 3 — a stand-in build cannot add the five tokens slice 1 asks for.
- builder 11 — nobody could be asked.

### cannot-show (1)

- builder 12 — the guide's build loop (headless browser, pictures, computed values) and the rows
  "measured by a person" could not run: the stand-in build starts no browser.

### works (39) — the kit caught or prevented something as designed

- setup 4 — the skip rule asked only the part the project did not say (which language comes first).
- setup 15 — the browser engine check ran first time, exit 0, one picture.
- setup 16 — step 8 ran as written: the title took the product's name from its sentence.
- setup 18 — `<scratch>` removed; the pictures can be made again by the kit's two commands.
- frame 12 — `init`, `begin`, `validate`, `stamp`, `next`, `status` all first time.
- cast 8 — a trigger the intent leaves open was cut off with its reason; the judges then re-test it.
- cast 18 — no refusal; "Never start a seat … here" held.
- structure 7 — the blind rule's sentence test caught a table of rooms in the brief's first draft.
- structure 10 — the describers' "whatever is not listed above" covered the design system.
- structure 11 — every proposal passed its card's `validate`.
- structure 25 — `PICK.md` and `merge.mjs open` worked; no fresh pass was added unasked.
- structure 30 — the decisions entry; the outside describer's lesson line correctly did not apply.
- detail 6 — the makers' blind held: no other letter, no board page.
- detail 8 — one more task reader for the second language, by rule, and he was told.
- detail 12 — **step 8 of the loop caught a blanket answer waving through a breach of his own rules**;
  the conductor stopped and asked.
- detail 18 — the writer's "waiting for a fact" put the missing verb to him.
- detail 28 — the builder's card answered the tab title (a name, not an interface word).
- detail 36 — the audience count grew by one, by rule (detail 8).
- detail 37 — one traits copy served both readers.
- detail 39 — judges re-ran three optional checks the cast sheet had off, on triggers they saw.
- look 8 — "Nothing marked": clear as written.
- look 12 — `begin` before the copy, `validate` stayed `ok`.
- look 13 — the conductor held the table to its own run, not the maker's.
- look 14 — **step 5 caught six unsupported rows** (a contrast given as 6.84 where the run measures 5.78;
  sizes claimed for both themes read in light only).
- look 21 — readers' briefs written early, started after step 5 held.
- look 22 — step 5 held on the second look, checked against the files, not the message.
- look 25 — the fix maker's card ("never change a string") held over a fix that would split a string.
- look 30 — step 5 held after the second send-back.
- look 38 — the carry list and the stamp first time.
- handoff 9 — the inventory copied in, so each row number resolves inside the folder.
- handoff 29 — the gate and the stamp as the skill gives them.
- acceptance 1 — resuming from the package alone.
- acceptance 5 — the driver on the kit's browser library worked first try: 1302 checks, 192 pictures in
  47 s (R158).
- acceptance 18 — the builder's three pages reached every state with no guessing.
- builder 14 — "Left to the builder" handed the timeout to the builder, as meant.
- builder 15 — the replaced default carried through to `SPEC.md`.
- builder 16 — the six slices' check counts (166 + 128 + 200 + 264 + 270 + 274) sum to the 1302 of
  `acceptance.json` (checked while sorting).
- builder 17 — the index's 48 pages and the folder's files agree.
- builder 18 — 66 rows in `STATES.md` for 66 states of `SPEC.md`.

### not-so (10) — the note is mistaken about the kit

- cast 13 — a fix-round maker and a re-read judge sit "in the seat whose work they are on" / "in the same
  seat" (`loop.md:150-152`), whose line names the model; a seat added later gets a line with his yes
  (`skills/cast/SKILL.md:172-174`). The blanket rule for "seats with no line" was the answers file's.
- cast 16 — Acceptance reads the cast sheet's carry-list lines that name her card and her profile by path
  (`skills/acceptance/SKILL.md:36-39`, `skills/cast/SKILL.md:159-161`); the ids need no path in the table.
- detail 7 — the brief's "Write" names "the template whose shape it takes" (`templates/briefs/maker.md:47`),
  so the seat may open it; the states template and `DETAIL.md` did not need to be added to its reads.
- handoff 15 — the conductor's own slip (`status: in-work`); the template's `draft` is right and
  `validate` refuses `in-work` as a header status (`scripts/lib/state.mjs:361-365`).
- handoff 28 — the skill puts the defaults under `findings`, by seat (`skills/handoff/SKILL.md:144`),
  which is what was done; one line per seat is the page's rule.
- builder 1 — the folder names the open blocking item: `COVERAGE.md`, Findings row 150 ("Open, to the
  founder, with the gate").
- builder 4 — `strings.json` gives each key's screen, element id and states (`where`), and the pages carry
  those ids: the map from key to element is there (the guide could say so).
- builder 6 — an inconsistency inside one row of the run's `SPEC.md`, not a kit rule.
- builder 8 — the kit's contract puts `data-screen` on a dialog's frame (`kit/KIT-CONTRACT.md:52, 81`);
  the run's `SPEC.md` misstated it, the pages follow the contract.
- builder 13 — `templates/package/build/BUILD.md` asks for "the commit that holds it" for each slice.

## Repeats of something already parked or deferred

- **R154 (parked):** the board's pictures carry the makers' bet, cost and notes — structure 13 and 20
  confirm it; only the new part (no first-screen picture) is item F52.
- **Task 17 minor (deferred) M2:** no computed-style check type — look 16 and acceptance 10 are item F85,
  marked as that repeat.
- **R132 (parked):** a stray file left by a mount in a board folder — not met: the run's project was in a
  temporary folder, not on the mount.
- R39, R84, R108, R109 (parked): not met; the run skipped no stage, drew no hostile page, no scaled
  vector and no pill-shaped clip.

## The count

| Class | Entries | Items |
|---|---|---|
| mechanical | 5 | 4 (F62, F85, F94, F96) |
| wording | 138 | 80 |
| decision | 58 | 27 |
| rig | 23 | — |
| cannot-show | 1 | — |
| works | 39 | — |
| not-so | 10 | — |
| **All** | **274** | 111 |

By file: setup 18 + frame 12 + context 13 + intent 23 + cast 18 + structure 30 + detail 45 + look 38 +
handoff 29 + acceptance 28 + builder 20 = 274. Each entry is listed under exactly one item or one line
above.
