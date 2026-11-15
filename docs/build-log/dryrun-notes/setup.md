# Notes · setup

Conducted 2026-11-15. Kit: `/mnt/data/Downloads/Proyectos/ux-runbook-v2`. Project: `/tmp/claude-1000/dryrun/project`.

1. **`skills/design/SKILL.md:111`**, "The long form of all nine, with every command, is in
   `references/loop.md`: read it before the first stage you conduct." Setup is not one of the nine stages
   in the table (`:57-67`), has no package and no state, and `skills/setup/SKILL.md` never names the loop.
   Unclear whether "the first stage you conduct" covers setup. **Did:** did not read `loop.md`; setup
   names its own steps end to end.

2. **`skills/setup/SKILL.md:17`**, "`<scratch>` is a folder you make outside the project, in the system's
   temporary folder." The machine's rule is to write only inside `/tmp/claude-1000/dryrun/`. **Did:** used
   `/tmp/claude-1000/dryrun/scratch-setup/` (outside the project, inside the run's folder). Not a kit
   fault, only a placement.

3. **`skills/setup/SKILL.md:76-77` and `:195`**, "Skip a question the project has already answered" /
   "never ask what the project already says". Applied as written: **4.1 (`product`) skipped**, since
   `README.md:3` holds the sentence word for word; **4.4 (professions) skipped**, since `README.md:9-13`
   ("Who uses it": the front-desk coordinator, no other roles). The answers file had entries for both,
   identical to what the README says, so nothing differs in the result. Two frictions:
   - `:158-159` (step 8) calls the `product` value "his sentence". Taken from the README, it is the
     project's sentence, not his: the template's key (`templates/project/PROFILE.md:35`) says "as the
     founder would say it to a friend", which a document cannot say for him. The skip rule and the key's
     meaning pull apart.
   - `:84-86` ties the stubs to his answer ("Each one he names gets its stub at once ... When he names
     none, no stub is written. The stubs are where this answer lives"). With 4.4 skipped because the
     README answers it, he names none, and read literally no stub is written. `:119-120` ("from what the
     project's documents and the founder said") and the Writes table (`:44`) imply a stub anyway.
     **Did:** wrote the stub for the profession the README names.

4. **`skills/setup/SKILL.md:80-82`** (4.2), "The languages it ships, the main one first. He names them."
   The project says which languages ship (`README.md:69`, D-3) but not which is the main one. **Did:**
   asked only the part the project does not say (which comes first); the answers file's "English first,
   then Spanish." answers that.

5. **`skills/setup/SKILL.md:99-100`**, "Anything else the template asks that the project did not say (the
   account a browser check uses, by its role; where decisions are logged)". Read against the project:
   - the browser check is said by `README.md:77-81` ("Looking at a screen": file opened headless by
     script, Playwright with Chromium, 1280 and 390, light and dark, reduced motion). It names no command
     or script, and the project keeps none; the template (`PROFILE.md:64`) asks for "the command or the
     script". Taken as said; not asked.
   - the account is said by `README.md:79` ("nothing signs in"). Taken as said; not asked.
   - the decision log is `docs/decisions.md` (`README.md:88-90`). Not asked.

6. **`skills/setup/SKILL.md:75-77`**, "Write each answer into the project profile, in his words, before
   the next question." For 4.5 and 4.6 a "No" leaves `engines-on: []`. The header is flat with "no note
   beside a value" (`PROFILE.md:29-31`), and the template has no section for his engine answers. **Did:**
   wrote both answers, in his words, under `## Engine check`, below the "Not known yet." that step 7
   replaces. A guess: step 7's shape for that section (`:151-155`) has no place for them either.

7. **`skills/setup/SKILL.md:97-98`** (4.6), "Only when the session lists a screen generator among its
   tools." The session lists the Stitch tools (`mcp__stitch__generate_screen_from_text` and others) as
   deferred tools, whose schemas are not loaded. **Did:** took a deferred tool as listed, and asked. He
   said "No."

8. **STOPPED: a question the answers file does not hold.** `skills/setup/SKILL.md:99-100`, "Anything
   else the template asks that the project did not say ... is one more question each." The template's
   `## Kinds this project adds` (`templates/project/PROFILE.md:52-55`) asks: "{Each kind beyond the
   kit's five, by a name in lower-case words joined by hyphens: what it is judged first on, and its own
   rules. "None" while the five serve.}" The project's documents say nothing of kinds. The answers file
   has no `Setup ·` heading for it. The question, as I would have put it to him:

   > Does Roomtally need a kind of interface that the kit's five kinds do not cover? If so, give each
   > one a name, say what it is judged on first, and give its own rules. If not, the answer is "None"
   > for as long as the five serve.

   Two faults sit behind it:
   - Step 3 (`:69-70`) sends an unanswerable braced instruction to "Not known yet.", but step 4
     (`:99-100`) makes the same thing a question. The parenthetical in `:99` names only the account and
     the decision log, so the writer seems not to have counted "Kinds" among the questions. The two
     steps disagree on what happens to it.
   - Setup's Reads (`:23-33`) never name where "the kit's five" kinds are listed (the conductor puts the
     kinds in `skills/design/references/routes.md`, `skills/design/SKILL.md:69-71`). So the conductor
     cannot tell him what the five are, and he cannot tell whether they serve.
   **Where it stands:** `design/PROFILE.md` holds steps 3, 4.2, 4.3, 4.5 and 4.6. `## Kinds this project
   adds` reads "Not known yet." Steps 5 to 8 and the gate are not begun: the kit, the pool, the stub, the
   engine check and the lessons file are not yet written.

---
So far (stopped at step 4): seats started 0 · stops for the controller 1 · a session with no memory could
pick this up: yes, by the setup skill's step 1 (`PROFILE.md` exists, `## Reviewed by the founder` is
empty, so a setup was left unfinished). It would read `design/PROFILE.md` first and go on from the first
step whose output is missing, which is the kit (`design/kit/`, step 5). It would not know that the Kinds
question was put and is waiting: the profile only says "Not known yet."

## Resumed after the controller's answer

9. The controller added the Kinds answer ("None. The five are enough.") and one answer for any other
   question the template asks that the project did not say ("Not known yet. Leave it so and move on.").
   The note at 8 on the skill disagreeing with itself stands. **Did:** wrote `None.` plus his words under
   `## Kinds this project adds`. No other template question was left open: the browser check and the
   account had been taken as said by the README (entry 5), so the second answer was not used.

10. **`skills/setup/references/project-kit.md:86-114`** (step 4, restyle each class). The table pairs
    every class with "the project's default part for the same job", but Linden has no text field, set
    of options, dialog, link or navigation (`docs/design-system.md`, "Not in Linden yet"). And its
    status tag is coloured per state, while the kit's one `ux-status` is styled once whatever it
    reports. In each of these I had to choose which tokens to give the part: the status tag's shape on
    the neutral `--color-fill`/`--color-ink`, the dot of the grey `ux-status::before` dropped (Linden's
    tag has none); `--ux-radius` set to `--radius-m` (what the button and the list wear), which also
    rounds the field, the choice options and the group; the field kept at the grey kit's 2.25rem,
    although Linden's rule 4 asks 44px of "anything she presses". Those are small visual decisions the
    skill puts on the conductor, who "proposes no design" (`skills/design/SKILL.md:24-26`). The
    founder sees them in the pictures at the gate, which is the skill's only check on them. **Did:**
    chose as said, and listed each in the profile's "Design system" with the grey values kept.

11. **`skills/setup/references/project-kit.md:71-84`** (step 3, point the kit at the tokens) says to
    give each `--ux-*` property the project's token. It does not say what becomes of the grey kit's own
    `@media (prefers-color-scheme: dark)` block, which sets the same `--ux-*` properties to greys and
    would override the mapping in dark. **Did:** deleted that block. The properties read Linden's
    tokens, and Linden's own dark set does the switching. Also left unsaid: whether `kit.css`'s opening
    comment, which says "The grey kit ... for a project with no design system", is rewritten. `:116-117`
    names only `parts.html`'s title and opening lines. **Did:** rewrote the comment so that it says what
    the file is, and put `@import "tokens.css";` on the first line, before the comment.

12. **`parts.html`** (the grey kit's specimen, whose markup the project kit may not change,
    `project-kit.md:116-117`) carries words that this project's facts contradict: "occupied", "Sala
    Jardín", "Gym — out of service today", "closed", and times with no leading zero ("9:50", "9:40").
    Roomtally has Room 1 to Room 5, and no closed state. The README says nothing on the clock, but the
    founder's gate correction makes it 24-hour, as 14:30. The founder sees these words in the pictures
    of his kit. Not a fault of setup, but the specimen reads as made for this very product, so a reader
    may take its words as the product's. **Did:** nothing; the markup stays.

    `render.mjs` and `shots.mjs` ran as `project-kit.md:153` and `:162` give them, first time, exit 0:
    the page drawn with `kit.css` and `tokens.css` beside it, 8 pictures, no overflow. Every part is
    styled, in light and in dark.

13. **`skills/setup/SKILL.md:105-121`** (step 6). The stub has no check: `card.mjs --help` says "a file
    in makers/, judges/ or audiences/ is a seat's card, and a file in persons/ is a person's ... A file
    in any other folder is no card to check". Step 6 does not ask for one, so nothing was run. But the
    profile card's four labels must stay "at the start of its line" for the rule that hides the fourth
    field from an audience (`templates/people/PROFILE-CARD.md:11-15`), and nothing checks that they do.
    Also: the template asks for "the specialties, the countries and the settings" under Scope, and
    "Mark the evidence of every characteristic `guess`" (`:121`) holds even where the README states a
    fact (the 1280 desk and the 390 phone). **Did:** every Evidence is `guess`, as told. Every field the
    README does not speak to says "Not known yet.", and a "So the interface must" line was written only
    where the README says it outright (the two widths). Six of the seven characteristics' fourth fields
    are "Not known yet."

14. **`skills/setup/SKILL.md:141-142, 151-155`** (step 7, `tool:stitch`). "Is the tool among those the
    session lists? That is the whole check", and the words for the result include both `listed` and
    `off`, "for an outside engine he has not turned on". Stitch is both: listed, and refused at 4.6.
    **Did:** wrote `off`, with "the tool is listed by the session". The skill does not say which word
    wins. For `model:any` it does say (`:128-129`: "with no entry, the engine is off and nothing is
    sent"). No `describe.mjs` call was made: `engines-on` is `[]`.

15. **`skills/setup/SKILL.md:143-149`** (step 7, browser). Ran exactly as given, first time, exit 0, one
    picture. **`:151-153`** asks for "one row for each seat of the kit's pool". Taken as the 17 cards in
    `pool/makers/`, `pool/judges/` and `pool/audiences/`; the five persons have no engine and got no row.

16. **`skills/setup/SKILL.md:156-159`** (step 8). Ran as written: the template's comment and its example
    entry were dropped, and the title took "Roomtally" from the `product` sentence, so step 8's question
    about the product's name was not needed.

17. **`skills/setup/SKILL.md:161-171`** (gate). The answers file's one reply covers the correction, "the
    kit's parts are fine" and "approved", all at once. I wrote the correction as a fifth line under
    "Standing rules", in his words. The "Three." already quoted there is left as his count of the rules
    he gave at 4.3. The gate's second bullet ("Tell him that each stub ... is a guess") asks for no reply,
    and I wrote under `## Reviewed by the founder` that he was told. One consequence for later stages:
    his new 24-hour rule ("as 14:30") makes the specimen's own times in `design/kit/parts.html` ("9:50",
    "9:40"; see 12) break a standing rule. He said "The kit's parts are fine as you drew them", so they
    stay, but a seat that reads `parts.html` will see times written the other way.

18. **`skills/setup/SKILL.md:173-175`**, "Remove `<scratch>`". Done after the gate, so the pictures he
    was shown, and the engine check's picture, are gone. If a design later needs them, the
    `render`/`shots` commands of `project-kit.md` §5–6 make them again. `git status` shows only
    `design/` added in the project.

---
Seats started by this stage: 0 (setup starts none).
Stops for the controller: 1 (the "Kinds this project adds" question, entry 8).
Could a session with no memory pick it up: yes. The conductor's test (`skills/design/SKILL.md:49-52`)
now finds `design/PROFILE.md` with his words under `## Reviewed by the founder`, so the project is set
up and the first design starts at Frame (no package exists yet). It would read `design/PROFILE.md`
first. (The provisional "So far" lines after entry 8 were written at the stop and are superseded by
these three.)
