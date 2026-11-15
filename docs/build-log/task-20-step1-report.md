# Task 20, step 1: the fictional project and the founder's answers

Commit `75c7e03` on `v2-pipeline`: `test: a fictional project and the founder's answers for the dry run`.
Twelve files, all under `tests/dryrun/`. `node --test tests/pool.test.mjs tests/skeleton.test.mjs`: 110
pass, 0 fail. `tests/dryrun/` is not in the product-name test's list, so I grepped it by hand: neither
name appears. Every file uses LF line endings, and the two strings files have the same keys.

## Files written

| Path | What it is |
|---|---|
| `tests/dryrun/FOUNDER-ANSWERS.md` | 62 headed answers in the order the pipeline asks them (13 of them gate entries, covering the 10 gates), plus "If a question is not here" |
| `tests/dryrun/project/README.md` | Roomtally's facts: who uses it, where, what it shows (5 rooms, 3 states, bookings, shifts), what it does (book, cancel, end now), what is slow or missing, limits, who may see what, screens, languages, analytics (none), how a screen is looked at |
| `tests/dryrun/project/docs/design-system.md` | Linden 1.2: files, five rules, the WCAG 2.2 AA target, three components by class, what is not in Linden yet |
| `tests/dryrun/project/docs/decisions.md` | The product's decision log, D-1 to D-4 |
| `tests/dryrun/project/src/styles/tokens.css` | Linden's tokens: type, space, shape, colours with a light set and a dark set under `prefers-color-scheme`. Every text pair is AA, checked by script |
| `tests/dryrun/project/src/components/button.css` | `ln-button`, `ln-button--primary`, with its markup and its tokens in the opening comment |
| `tests/dryrun/project/src/components/list-row.css` | `ln-list`, `ln-row` and its four parts |
| `tests/dryrun/project/src/components/status-tag.css` | `ln-tag` for free, busy and cleaning. There is no `held` tag on purpose |
| `tests/dryrun/project/src/screens/day.html` | Today, the existing screen: the day's bookings as a plain list, drawn on the seeded day at 10:20 |
| `tests/dryrun/project/src/strings/en.json`, `es.json` | Flat JSON, one file for each language, the same 18 keys |
| `tests/dryrun/project/src/data/sample-day.json` | Seeded test data for one weekday: 5 rooms, 5 shifts, 12 bookings, first names only |

There is no profile and no `design/` folder. Nothing in any file is a key, a password or a token in the
secret sense; "token" appears only as a design token.

**Facts planted for the Context gate to correct.** The README says (a) a room is "always in exactly one
of three states" and (b) cleaning lasts "fifteen minutes". The founder corrects (b) to ten minutes and
adds a fourth state, *held*. His answer also says "my word stands on both" before he is asked, so the
skill's "where a correction meets a fact you read … he decides" (context L159) needs no further
question. Room 3 is cleaning at 10:20 whichever length applies, so the seeded day stays true.

## Every question and gate, stage by stage

"L" is the line in the skill file named. The heading is the answers file's `###` heading, without its
stage prefix.

### The conductor (`skills/design/SKILL.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| A stale or changed artefact, reported before anything else; he says redo, re-confirm or reopen | design L92–97 | No standing answer: "If a question is not here" (stop and report) |
| An open question in `status`, put to him again | design L102–104 | The stage's own heading |
| `reopen` / `resize` / `route`, each needing his yes | design L155–161 | "If a question is not here" |
| A lesson for the kit's own `LESSONS.md`, proposed to him | `references/lessons.md` L38–40 | Acceptance · a lesson for the kit |

### Setup (`skills/setup/SKILL.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| Where the packages go (only if `design/` already holds something else) | L65–67 | where the packages go |
| 4.1 The product in one sentence | L78–79 | the product in one sentence |
| 4.2 The languages, main first; the `languages` line shown to him; the register and form of address for each language | L80–82 | the languages it ships · the `languages` line, shown to him · English: … · Spanish: … |
| 4.3 Standing rules for interfaces | L83 | his standing rules for interfaces |
| 4.4 The professions it serves | L84–86 | the professions it serves |
| 4.5 May a brief go to an outside text model (the provider, model and key questions come only after a yes) | L87–96 | may a brief be sent to an outside text model? |
| 4.6 May a brief go to a screen generator (only if the session lists one; this machine lists the Stitch tools) | L97–98 | may a brief be sent to a screen generator? |
| Anything else the template asks: the account a browser check uses, where decisions are logged; also how a browser check is run, if not read | L99–100 | how a browser check is run here · the account a browser check uses · where decisions are logged |
| Step 8: the product's name, if the sentence names none | L157–159 | the product's name |
| **Gate:** what is wrong or missing in the profile, with the kit's pictures ("does a button here look like his product's button") | L161–171; `references/project-kit.md` L169–172 | gate: what is wrong or missing in the project profile? |
| (Not a question) a token the project lacks: "tell the founder which"; an engine refusal: "run again only on his word" | project-kit L107–109; setup L139–140 | Statements. A refusal falls under "If a question is not here" |

### Frame (`skills/frame/SKILL.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| The request, as he wrote it | L24–25 | the request |
| The request asked again, for a half-framed package | L51–53 | the request, asked again |
| **Gate:** one message, "is this the right frame for it?", including the design's name | L92–95 | gate: is this the right frame for it? (and its "another value" twin) |
| The frame put again after he corrects a value | L99–100 | gate, put to him again after a change |
| A name already taken: agree another name | L111 | Not answered: it cannot happen in a fresh copy. "If a question is not here" |

### Context (`skills/context/SKILL.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| Pictures of a surface that needs the running product (redesign only) | L69–70 | Does not arise: foundation `new-surface` |
| A fact with no source becomes a question | L89–91, L128, L133–135 | Likely ones: what he calls each state · is a room ever closed? · can the desk end cleaning early? · why now · what was tried before · what it must not become · the devices and their widths · the accessibility target · the product's analytics · one profession, several, or everyone |
| "The founder's own words", asked when she must read in order to act | L124–127 | the founder's own words |
| **Gate:** what is wrong or missing in this context, with the profile and its guesses | L146–165 (question at L154) | gate: what is wrong or missing in this context? |

### Intent (`skills/intent/SKILL.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| A job that needs two sentences may be two surfaces: say so to him | L81 | one job, or two surfaces? |
| The measure: the event to add, when there are no analytics | L98–99 | the measure |
| Offering the profile judge's read (optional) | L103–117 | may the profile judge read the intent? |
| **Gate:** do you approve this intent? | L125–138 (question at L134) | gate: do you approve this intent? |

### Cast (`skills/cast/SKILL.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| A faulty project card, reported | L66–69 | Does not arise: the project has no cards. Otherwise "If a question is not here" |
| The model proposal: "suggestions he may change" | L105–109 | Folded into the gate: every seat on sonnet at medium |
| A fresh pass, offered in one sentence at the gate | L121–126 | a fresh pass |
| **Gate:** which seat, check, model or effort would you change? | L139–153 (question at L148) | gate: which seat, check, model or effort would you change? |

### Structure (`skills/structure/SKILL.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| Step 4: may this brief go out as it is, with the seats that would send it off the machine | L73–79 | may this brief go out as it is? |
| A board made again within the round: tell him first, and wait for his yes | `references/rounds.md` L91–93 | a board made again within the round |
| A fresh pass he asks for before he picks | L158–159 | a fresh pass before the pick |
| **Gate:** which structure goes on to Detail? Also "a bit of each" asks for one letter; a graft; `Pick: none`; and "what he asked to be changed on the way to Detail" | L142–155, L169 | gate: which structure goes on to Detail? ("The second", no graft, nothing to change) |

### Detail (`skills/detail/SKILL.md`, `references/seats.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| A dependency: is it built with the design, or does the element go? | L79–90 (question at L83); seats L48–50 | a dependency: … |
| A state the intent does not name: does it exist? | seats L51–53 | a state the intent does not name: does it exist? |
| What the structure cannot hold: reopen Structure, or accept it as a cost? | seats L54–55 | what the structure cannot hold: … |
| A fact a string waits for | seats L69–72 | a fact a string waits for: cleaning length, hold length, opening hours, clinician name, room name |
| The words as a question of their own (only for `first-run`, `message` and `public-page`) | L150–159 | the words, as a question of their own (should not be asked) |
| **Gate:** do you approve this prototype for Look? | L137–148 (question at L147) | gate: do you approve this prototype for Look? |

### Look (`skills/look/SKILL.md`, `references/seats.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| Direction mode, if he has said the surface leaves the system | L74–76 | does this surface leave the design system? |
| A fresh pass he asks for at the gate | L162–163 | a fresh pass |
| A change to the project profile: "he sees and approves each line first" | L195 | a line for the project profile |
| What the visual designer could not draw: to him at the gate, open | seats L61–63 | Folded into both gate answers ("Anything still open stays open") |
| **Gate:** with variants, which variant goes on to Handoff; with one proposal, do you approve these screens | L148–158 (question at L156) | gate, with variants: … · gate, with one proposal: … |

### Handoff (`skills/handoff/SKILL.md`)

| Question or gate | Source | Answered by |
|---|---|---|
| Something missing from Look's carry list: stop and tell him | L74–76 | No standing answer: "If a question is not here" |
| A load that cannot be copied in: to him, open | L90–92 | something a page loads that cannot be copied in |
| The cold implementer's items that nobody decided: to him one at a time, each with a default | L128–136 | an item of the cold implementer's that nobody decided |
| **Gate:** may this folder go to the session that builds it? | L157–166 (question at L165) | gate: may this folder go to the session that builds it? |

### Acceptance (`skills/acceptance/SKILL.md`, `references/`)

| Question or gate | Source | Answered by |
|---|---|---|
| A build page still to fill, a state with no row, a credential in a file: tell him, and stop | L77–80; driving L29–30 | The controller's to prevent. Otherwise "If a question is not here" |
| A screen reader, or any check no driver can make: his to make or to waive | driving L106–107 | a check only he can make or waive |
| A criterion judged by eye by the founder | driving L109–110 | a criterion he must judge by eye |
| Each deviation: accepted as built, or fixed? | L139–145 (question at L140) | a deviation: is it accepted as built, or fixed? |
| A fix the size of a correction: may this be put right so? | L157–158; deviations L73–74 | a fix the size of a correction: … |
| **Gate:** do you accept this build? | L159–161 | gate: do you accept this build? |
| A lesson for the kit, proposed | lessons L38–40 | a lesson for the kit |

## What could not be answered ahead of time, and how each is written

Each of these is written so that it works whatever the run produces. Each is a stand-in, not a judgement.

1. **Structure's pick:** "The second", by its position on the decision page, whatever its letter.
   His one sentence of why says plainly that this is a dry run: "I'm testing that a pick carries
   through, not which way wins."
2. **Look's variant, if there are variants:** "the one the screens are already drawn in", so that no
   redraw follows. That is a stand-in for a pick from pictures.
3. **Setup gate:** "The kit's parts are fine as you drew them" stands in for a look at pictures nobody
   saw. His one correction (a 24-hour-clock standing rule) is an addition, so it holds whatever the
   profile says.
4. **Context:** the questions of step 6 depend on what the conductor fails to source. I wrote answers
   for the eleven likely ones. Any other question goes to "If a question is not here".
5. **Intent's remark** ("'right now' means this minute") holds whatever the intent says: it sharpens a
   criterion, or it confirms one.
6. **Open findings at Intent, Detail and Look:** "Anything still open stays open, written down as it
   is." That is one answer for findings nobody can see yet.
7. **Detail's facts:** five facts a string may wait for. Any other fact is a question not here.
8. **Handoff's open items:** "Use the written default, and mark it as one." **Acceptance:** each
   deviation is "Accept it as built, and log it". A criterion he must judge by eye is "not judged in
   this run", not a false "it holds".

## Concerns for the controller

- **I chose yes at Intent's optional profile judge** ("Yes, have it read. One judge, on sonnet at
  medium"). Neither the brief nor the rulings settle that question, and a dry run should use each
  mechanic once. It costs one agent, plus one more for a re-read if something blocks. If you want the
  run leaner, change that one answer to "No".
- **Acceptance's driver may not exist.** The project's browser check, as the README gives it, is
  "Playwright, with Chromium". The fictional project has no dependency of its own. `driving.md` says
  the kit's picture script and its `prototype` command open files and are not used on a build. So the
  Acceptance conductor will have to drive Playwright from the kit's `node_modules`, or report that the
  project has no driver. That is a likely dry-run finding, about where a project's driver comes from.
- **The held state is a deliberate pressure point.** Linden has no `held` tag and no `held` colour. So
  the design will likely meet a dependency or a truth question at Detail, and a named extension at
  Look, with "Changes to the system" at Handoff. The answers cover the dependency and the
  unnamed-state questions. A question about the extension itself ("may Linden gain a held tag?") is
  not in the file: no skill asks one, but a conductor might.
- **Setup will skip some answers.** It skips what the project already says (the languages, the
  browser check, the decisions log), so those entries may go unused. That is expected, not a gap.
- **The screen generator question will likely be asked.** This machine lists the Stitch tools, so
  setup step 4.6 should come up. It is answered "No".
