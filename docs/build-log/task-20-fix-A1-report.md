# Task 20, step 5b · wave A1 · report

Wave A1: every `wording` item `F1`–`F46` (34 items) and the words of the rulings marked A1 (R160 for
setup, R163, R164, R165 for Context, R166, R167, R168, R169, and the F24 line under R161). Branch
`v2-pipeline`. No script changed, and no file under `docs/`.

**All 34 items and all 9 rulings are done. None is left.**

## Items

Paths are from the kit's root. "Pin" is a sentence held by `tests/skills.test.mjs` (S) or
`tests/templates.test.mjs` (T).

| Item | Files changed | What changed | Test added · pin changed |
|---|---|---|---|
| F1 | `skills/design/SKILL.md` | "read it before the first of the nine stages you conduct; setup has its own steps." | S: new pin (the loop test of the dry run) |
| F2 | `skills/setup/SKILL.md`, `templates/project/PROFILE.md` | A skipped question's answer is written from the project's document, and that document is named by its path when the profile is put to him. A stub for each profession he **or the project's documents** name. Step 8 takes the name from "the sentence under `product`", no longer "his sentence". The `product` row of the template says it may be the project's own sentence. | S: pins changed (skip rule, the stubs, step 8), the items change the rule |
| F4 | `skills/setup/SKILL.md`, `templates/project/PROFILE.md` | "Engine check" opens with the day and his answers to 5 and 6; a no is written there too. A tool listed by name counts, loaded or not; one he refused is `off`. | S: pin changed ("the day, his answers to 5 and 6 of step 4, then a table"), three pins added. T: pin changed (the template's Engine check instruction) |
| F5 | `skills/setup/SKILL.md`, `templates/project/PROFILE.md`, `skills/frame/SKILL.md` | Step 4's last paragraph is a closed list: the account and the decision log, "No more." The template's Kinds instruction says what setup writes ("None while the five serve") and that Frame asks. Frame's step 2 asks when a request fits none of the five, and writes what he adds under "Kinds this project adds" (named in Frame's Writes). | S: two pins added |
| F7 | `skills/setup/references/project-kit.md` | § 3: take out of the grey kit's dark block each property that now reads a token whose file switches itself, and the block with the last one; rewrite `kit.css`'s opening comment. | S: pin added, with the grey kit's block and comment it speaks of |
| F10 | `skills/cast/references/presets.md` | "By size": the rows are by size alone; the kind enters only through "Added by rule". | S: pin added |
| F11 | `skills/frame/SKILL.md`, `templates/package/00-frame.md`, `skills/cast/SKILL.md`, `templates/package/03-cast.md` | Frame's step 6 and the template's "Engines missing" both say: each seat of the provisional cast, and each maker that sits by rule. Cast shows a by-rule maker whose engine is off under "Left out" (step 8, step 11, and the template). | S: pin changed (Frame step 6), pins added |
| F13 | `skills/frame/SKILL.md` | A new name is no value: taken as he gives it, the frame is not put again. A fact in his answer is written under Reviewed and, where it bears on a value, quoted in its why. | S: pins added |
| F14 | `templates/package/00-frame.md`, `templates/package/02-intent.md`, `templates/package/06-look/LOOK.md` | Each instruction that holds at one size or in one mode says what to do elsewhere ("At any other size, delete this line" · "then delete this paragraph" · "Inside a design system, delete this paragraph"). | S: pins added |
| F15 | `templates/package/00-frame.md`, `skills/frame/SKILL.md` | A `frame` row in the Route table (full, short at a correction, never skipped). Reason: "the size sets it", or why it was changed. The cast line names the preset's page and the two pools. | S: pins added |
| F16 | `templates/package/DECISIONS.md`, `skills/acceptance/references/deviations.md` | The template gives the test (a token, a part or a string the product already keeps is added or changed, or a fact the facts document states changes). The deviations page points to it: applied to every deviation, not weighed. `skills/look/SKILL.md` not touched: it stands at 200 lines and the template it names now holds the test. | S: pin added |
| F17 | `skills/context/SKILL.md`, `templates/package/01-context.md` | Reads: "…as step 3 says, and so only when the surface exists". Template: "the judges that read it as it is (step 3)". | S: two pins changed with the sentences |
| F19 | `skills/context/SKILL.md` | A recommendation on a fact only he holds says where his answer will be written and what the package holds on it. An answer is written where it belongs, "and under its question say where". | S: pin changed, pin added |
| F20 | `skills/context/SKILL.md` | "After his correction, each fact it meets and each gap it opens is put to him, one at a time, with its source, before the stamp, as step 8 of the loop says: he decides each." | S: pin changed. **The pin `doesNotMatch(gate, /one at a time/)` is replaced** by "the gate says it once": the item changes that rule (what his correction raises is asked; the questions of step 6 are still not put again) |
| F23 | `skills/context/SKILL.md`, `templates/package/01-context.md` | Under the inventory: what the product does not have that this design might reach for, one line each with its source (the form is in the template). | S: two pins added |
| F24 | `skills/context/SKILL.md`, `skills/intent/SKILL.md` | Context carries the one section of the frame Intent needs, "Who it is for". Intent's carry list says the frame's section stops there. With R161: the project kit is no project source and never a source of facts about the product. | S: pin changed (the carry line), pins added |
| F25 | `skills/design/references/loop.md`, `skills/design/SKILL.md` | "The carry list is a ceiling, not a reading list": open what the stage uses, a section under its heading only; "exactly what its carry list names", in a stage's skill, means this. The stage skills keep their sentence (four are pinned word for word, and three stand at 200 lines). | S: pins added |
| F26 | `skills/intent/SKILL.md` | She is named for her moment, as the kit's five are (`first-timer`), never by a first name. | S: pin added |
| F27 | `skills/intent/SKILL.md`, `templates/package/02-intent.md` | "not on record: <what is missing>; written again when <it is known>" for a state row or a part of one, for a "cannot occur" that rests on an unknown, and for "The feeling". | S: pins added |
| F28 | `skills/intent/SKILL.md` | The test for "needs": a criterion, a task or a row of "States" cannot be written without it; a fact only Detail needs goes under "Constraints that will bite". | S: pin added |
| F29 | `skills/intent/SKILL.md`, `templates/package/02-intent.md` | The start in the third person, the goal hers, quoted: in the example and in the template. | S: pins added |
| F30 | `templates/briefs/judge.md`, `templates/briefs/maker.md` | A profile judge's profile line becomes item 1 of the list; "or with no specialty its base alone". | S: pins added |
| F32 | `skills/intent/SKILL.md` | His yes to the read is written under Reviewed before the seat starts. A remark that changes the page is a correction; one that explains it is written under Reviewed and nowhere else. | S: pin changed (step 5's opening), pin added |
| F33 | `templates/outputs/LEDGER.md`, `pool/judges/cold-implementer.md` | A "Job first" line above the sections. A "Kind" column (question · guess) that only the cold implementer keeps; its card's Output names it and counts from it, in a sentence added after the one `tests/evals.test.mjs` pins, which stands as it was. | T: **pin changed**: the Findings header is nine columns, eight for every other judge; the two cells read by index moved one to the right |
| F37 | `skills/design/references/loop.md` | "`await` writes that header, as `begin` and the stamp do: read the file again before you edit it, and of the header write `built-from` only." | S: pin added |
| F38 | `skills/cast/references/presets.md` | "At every size, an adjustment's short cast among them:" | S: pin changed (two places) |
| F39 | `skills/cast/references/presets.md`, `templates/package/03-cast.md`, `skills/cast/SKILL.md` | One line of what each lens favours, in the describer card's own words. "Loaded with" takes a lens. | S: pins added (the four lenses are read off the card and looked for on the page). T: pin added |
| F40 | `skills/cast/SKILL.md`, `skills/cast/references/presets.md` | The contrast person is the one whose moment the intent's tasks do not already cover, with the reason on its line. | S: pins added |
| F41 | `skills/cast/SKILL.md` | The profile judge's checks are cut on the profession's profile it is loaded with; each row is cut for its own stage. | S: pin added |
| F42 | `skills/cast/references/presets.md`, `skills/look/references/seats.md` | "…when one of its optional checks about legibility (`physical`) is on, or the profession's profile has a 'So the interface must' line under its usage context". | S: three pins changed with the sentence |
| F43 | `templates/package/03-cast.md`, `skills/cast/SKILL.md`, `skills/design/references/loop.md` | Columns "Model" and "Effort"; "the cards' suggestions until he changes one"; a line for the proposal at the top of the sheet; the loop names the new columns. | T: **pin changed** (the header). S: pins added |
| F44 | `skills/cast/SKILL.md` | "say so in one sentence here, as a statement: the gate keeps its one question." | S: pin added |
| F45 | `skills/cast/SKILL.md` | Beside the count: it counts first reads; a stage whose judges block adds one maker and one judge for each. | S: pin added |
| F46 | `skills/cast/SKILL.md` | "every section of the intent but 'Reviewed by the founder' and 'Carry'". | S: two pins changed with the sentence |

## Rulings

| Ruling | Files changed | What changed | Test added · pin changed |
|---|---|---|---|
| R160, setup (F6) | `skills/setup/references/project-kit.md` | Where the system has no part for a class's job, or its part cannot be styled once, the conductor gives the class the tokens it would take and writes each choice into "Design system", marked "the conductor's proposal", with the grey kit's value beside it. At the gate each is named with its picture; he decides each, and the mark comes off on his word alone. | S: two pins added |
| R163 (F12) | `skills/design/references/loop.md`, `skills/frame/SKILL.md` | The loop (§ 7) names Frame as the one stage with no `await`; Frame's step 1 says a frame he has not answered is nowhere on disk and is framed again. | S: pins added; and that Frame gives no `await` command |
| R164 (F18) | `skills/context/SKILL.md`, `templates/package/01-context.md` | "The founder's own words" is asked here, once, at every design, as the last question of step 6: what she calls these things, and any word she must never see. "None" is an answer. The test "she must read in order to act" and "Not asked" are gone, in the short form too. | S: pins changed (the bullet, the short form), pin added that neither old phrase is left |
| R165, Context (F21) | `skills/context/SKILL.md`, `templates/package/01-context.md` | A source he has corrected is still carried; its line of "Project sources" says which point and that the context holds; the decision appended at the stamp names the stale fact and its file. | S: pins added |
| R166 (F22) | `skills/context/SKILL.md`, `skills/intent/SKILL.md` | What he says of the profession goes into its profile at Context's gate, under the characteristic it bears on, marked `guess (the founder, <date>)`. On her card (Intent), what only the founder said of her profession is a guess too, marked as his. | S: pin changed (the gate's bullet), pins added |
| R167 (F31) | `skills/intent/SKILL.md`, `templates/briefs/judge.md`, `pool/judges/profile.md` | The skill and the brief's "Do not open" say her card is not this read's; the card's step 6 at Intent is the skill's one question; the gate says her card was read by no seat. | S: pins added, with a check that `person` is not among the card's reads |
| R168 (F34) | `skills/intent/SKILL.md` | The offer says how many "So the interface must" lines each profession's profile holds. | S: pin changed (step 5's opening) |
| R169 (F35) | `skills/design/references/loop.md` | § 6: only `blocks` is mended; a `should` or a `note` is never mended before the gate, by a maker or by the conductor, even on a page that is the conductor's to write. Said once, there. | S: pin added |
| R161, the F24 line | `skills/context/SKILL.md` | "The project kit is not one, and never a source of facts about the product: the stages that draw reach it by `kit` of the project profile." | S: pin added |

## Lines

`skills/setup/SKILL.md` 199 · `skills/context/SKILL.md` 198 · `skills/cast/SKILL.md` 196 ·
`skills/design/SKILL.md` 194 · `skills/intent/SKILL.md` 185 · `skills/frame/SKILL.md` 165 ·
`pool/judges/profile.md` 131 (as before) · `pool/judges/cold-implementer.md` 119.

What was cut to make room, each said elsewhere in the same file:

- setup, step 8: "the first design appends the first entry" (the Writes table says "with no entry yet").
- context: the blank lines before "Nothing of the project outside `<packages>` is written" (now the
  last bullet of Writes) and before step 6.

## For the waves that follow

- **A2, R165.** Context logs the stale fact in the **decision it appends at its stamp** (the package's
  `DECISIONS.md`: the fact and its file), and marks the file's line under "Project sources". The truth
  judge's brief and Handoff's slice can point at both. "Project sources" is not among the sections
  Intent carries on, so a later stage reaches the mark through the decision.
- **A2, R159.** `skills/setup/SKILL.md` stands at 199 lines: the sentence about "no script" has one
  line of room. Its step 4 now ends with a closed list of what is asked beyond the six questions.
- **A2, F47.** `skills/context/SKILL.md` stands at 198 lines.
- **A2 and B, R162.** `skills/cast/SKILL.md:70-71` still says "A profession's profile has no checker,
  and is read as it is written": that sentence is R162's, and I left it.
- **B, R161.** `skills/setup/references/project-kit.md` § 3 and its new pin read the grey kit's opening
  comment ("for a project with no design system") and its dark block: if the specimen's wave touches
  `kit/grey/kit.css`, that pin goes with it.

## Found, and not mine to fix

1. **Three evaluation fixtures keep the old column names.** `evals/brief-has-no-design/`,
   `evals/fresh-brief-hides-the-system/` and `evals/no-pick-without-the-founder/` each hold an approved
   `fixture/design/today/03-cast.md` whose tables are headed "Suggested model" and "Suggested effort",
   while `loop.md` now sends a conductor to the columns "Model" and "Effort" (F43). The sheets are
   stamped, so changing them means stamping them again. No test fails on it.
2. **Five evaluation fixtures say "None: the five serve."** under "Kinds this project adds", where
   setup now writes "None while the five serve" (F5). Harmless: Frame reads the section either way.
3. **A seat with no line on the cast sheet has no model** (`dryrun-notes/cast.md` 13): the founder's
   default for a fix round's maker or a re-read's judge lives in prose only. It is in no item of my
   wave (F43 covers cast 11 and 12), and I did not add a place for it.
4. **`templates/people/PROFILE-CARD.md` gives the evidence as "fact, with its source · guess ·
   unknown".** R166's `guess (the founder, <date>)` is a guess with who said it; the template does not
   show that form. I left the template: R162 gives the profile a checker in wave B, and the form
   should be settled with it.
5. **`pool/CARD-FORMAT.md`, "The person card":** `fact` is "every line has a source, someone who said
   it or saw it", which the founder's account of a profession would meet. The Intent skill now says
   such a line is a guess, marked as his (R166); the format's row is unchanged, since the checker's
   lists are held to that file by a test.
6. **`kit/grey/kit.css` and the look skill:** nothing changed there. `skills/look/SKILL.md:179-180`
   (F16's second owning file) is at 200 lines and got no sentence; the test is in the template the
   skill already names.

## Tests

- `node --test tests/skills.test.mjs` → 136 pass (133 before: three tests added, "the dry run, …").
- `node --test tests/pool.test.mjs` → 101 pass. `node --test tests/templates.test.mjs` → 47 pass.
- Four of the new pins were mutated by hand (the loop's sentence on Frame and `await`, "the conductor's
  proposal", a lens line of `presets.md`, the test in `DECISIONS.md`): each made its test fail.

## The whole battery, and the commit

- `NODE_OPTIONS=--dns-result-order=ipv4first npm test`, once more after the last edit:
  **825 tests · 824 pass · 0 fail · 1 skipped** (the folder-mode test this mount skips) · exit 0.
  The first whole run had one failure, mine: `tests/evals.test.mjs` pins a sentence of the cold
  implementer's Output that my first wording of F33 had split. The card was reworded to keep that
  sentence; the eval test is untouched.
- `claude plugin validate . --strict` → "Validation passed", exit 0 (the icon warning only).
- `git status --short` → clean.
- One commit on `v2-pipeline`, not pushed:
  `36aa794 fix: what the dry run found in setup, frame, context, intent and cast`
  (25 files: 2 cards, 11 files of skills and their references, 10 templates, 2 test files).

Done: 34 items of 34, 9 rulings of 9. Not done: none.
