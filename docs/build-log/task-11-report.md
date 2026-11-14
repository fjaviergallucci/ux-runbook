# Task 11 — The audience card, the generic persons, the index: report

**Status: DONE_WITH_CONCERNS.** The concerns are calls the brief and the rulings leave open; they are listed last, the ones that most need a ruling first. One commit on `v2-pipeline`, nothing pushed:

- `eb015d2 feat: the audience seat, the generic persons and the pool index`

BASE `70890f9`. Eleven files: seven new, four changed. The working tree is clean.

## What I wrote, file by file

| File | Lines | What it is |
|---|---|---|
| `pool/audiences/task-reader.md` | 100 (new) | The one audience card, `audience.task-reader`. |
| `pool/persons/first-timer.md` | 43 (new) | Noor, her first morning at the desk, nobody to ask. |
| `pool/persons/daily-expert.md` | 44 (new) | Marta, three years on this screen, which changed overnight. |
| `pool/persons/hurried-on-a-phone.md` | 46 (new) | Jo, walking a corridor, one thumb, about to be interrupted. |
| `pool/persons/keyboard-user.md` | 44 (new) | Ana, both hands on the keyboard, the mouse in a drawer. |
| `pool/persons/second-language-reader.md` | 45 (new) | Linh, reading the screen's language as her second, at a message she must act on. |
| `pool/INDEX.md` | 41 (new) | The seats' table (17 rows) and `## People` (5 rows). |
| `pool/CARD-FORMAT.md` | 176 → 217 | `## The person card`; the persons folder in "Where a card lives"; one new name, `person`. |
| `pool/MODELS.md` | 54 → 55 | The audience seat's row. |
| `scripts/lib/card.mjs` | 279 → 377 | `validatePerson`, its lists, and three helpers now shared with `validateCard`. |
| `tests/pool.test.mjs` | 855 → 1216 | 58 → 86 tests. |

### `scripts/lib/card.mjs`

- New exports: `validatePerson(text, { file })`, `PERSON_KEYS`, `EVIDENCE`, `PERSON_SECTIONS` (all frozen), `PERSON_FOLDER` (`'persons'`, for Task 15's `card check`, which picks the checker by folder).
- `file` is the path under `pool/`, as `persons/first-timer.md` (backslashes accepted). Errors are reported as `validateCard` reports them: `file:`, then `header:`, then `body:`, every fault, `[]` when there is none.
- The rules, as ruling 1 gives them:
  - all four keys required, no other key;
  - `id` is `person.<name>`, kebab-case, and with a file the name is the file's;
  - `profile` is `none` or `profile.<name>` (kebab-case);
  - `specialty` is one line of text or `none`; it must be `none` when `profile` is `none`. A profile that is missing or cannot be read is its own single fault: the specialty is not held to it;
  - `evidence` is `fact`, `guess` or `mixed`;
  - the four sections under their exact names, in order, each with text, no other `##` section, none twice; fenced lines are never headings (the same `sectionsOf` a seat's card is read with);
  - CRLF accepted; a text that is not a string throws `TypeError`, as `validateCard` does.
- To avoid a second copy of the same logic, three pieces of `validateCard` moved into helpers both checkers call: `open` (parse the header, one fault when there is none), `rulesOf` + `checkKeys` (the header's value rules, and "every key, no other"), `checkSections` (present, once, in order, text under each). `validateCard`'s behaviour and every error message of it are unchanged; all 58 earlier tests pass with two assertions strengthened (see Testing).

### `pool/CARD-FORMAT.md`

- `## The person card`, at the end: what a person is (not a seat; one card for the makers' brief and the audience seat, never the same instance for both), where she lives, the header table (key, allowed, what it says, with the meaning of each `evidence` value), the four sections with what each holds, what the checker holds and what is a reader's (the design's bar: "if the card does not force a design decision you would not have made anyway, it is not finished"; profile versus moment, with § 8's own example).
- "Where a card lives" gains one paragraph: a fourth folder holds people.
- One new row in the names table: `person`. Every other name the audience card uses was already there.

### `pool/audiences/task-reader.md`

Header: `sits-at: [structure, detail, acceptance]` · `presets: [surface, flow, system]` · `loaded-with: person` · `reads: [brief, person, profile, pictures]` · `never-reads: [intent, describers-brief, maker-notes, states-and-rules, strings, prototype, author-map, other-ledgers, task-reads]` · `engine: own` · `opus` / `medium` · `verified: 2026-11-14`. `validateCard` returns `[]`.

Body, to design § 11: the intro says it is the cheapest stand-in, that it agrees too easily, and that a real person's read takes the seat and outranks it. Method, eight steps: (1) the brief and nothing else, never the intent, its success criteria or a maker's reasons; (2) become her from the card, and from her profile's "what is true" when she has one, inventing nothing; a kit person is transposed to the brief's product; (3) pictures only, never a page or its source — "a person cannot find a control by reading markup" — and what no picture shows is said, never settled in the design's favour; (4) the blind pass, each task on each option in her language, the six answers of § 11 in its order and wording, every answer pointing at something on the screen or taken out; (5) hold to what she never does; (6) list the stuck points; (7) rank with *clear · slight · tie* and one reason, never a score, "no ranking: one option", two seats' disagreement a finding and never an average; (8) the caveat at the top of every read, word for word, on one line in a blockquote so it is copied and not retold. `### On a public page` (inside Method, because a card has no fifth `##` section): stop, understand, click. Output names `templates/outputs/TASK-READ.md` and lists what a read holds in five lines. Six Never lines. Borrowed credits the audience role and, through it, the two MIT skills, as `pool/judges/profile.md` does.

### The five persons

Each: `profile: none`, `specialty: none`, `evidence: guess`; a title; one line saying she is an archetype and a guess; a line saying whom she stands for and that her scene is in the kit's example product ("in another product, keep her and change the setting"); then the four sections. Each `## The moment` is a scene at the small clinic's front desk (where she is, what just happened, what is in her hands, what she is about to do); each `## What she never does` has six lines, each a thing a design cannot count on; each `## The check` is one question. Made-up first names only; no product, no profession.

Step 3 of the job (read each as a maker, then as an agent who must be her) changed seven things: a sign-in on a sticky note was removed from the first-timer's scene; "Someone" became "A colleague" and the glare was made plain in the phone scene; two clumsy "never" lines of the keyboard user and one of the daily expert were rewritten; "change the desk" became "change the setting" (one of the five is not at a desk).

### `pool/INDEX.md`

One table, `id | job | cast-when`, seventeen rows in shelf order (makers, judges, the audience; within a shelf, the order `pool/MODELS.md` uses), each cell the card's header word for word. Then `## People`: `id | the moment`, five rows, one line each written for the index, with two sentences on what the kit's five are for (no profiles yet; contrast seats, and why a contrast seat exists).

### `pool/MODELS.md`

`audience.task-reader` · `opus` · `medium` — reason 2, and medium because a reader that thinks harder understands more than she would.

## What I tested, and the results

**RED, first look** — the tests written, `validatePerson` not yet existing: the file does not load.

```
SyntaxError: The requested module '../scripts/lib/card.mjs' does not provide an export named 'EVIDENCE'
# tests 1  # pass 0  # fail 1
```

**RED, second look** — with a stub (the lists, and a `validatePerson` that returns `[]`) so that each test fails on its own: `# tests 86 # pass 57 # fail 28 # todo 1`. The sixteen rule tests failed with "expected one error, got:" (or "Missing expected exception (TypeError)"); the four audience tests with no card found; the three person-file tests with an empty folder; the format test with `'## The person card'` not found; the index tests, the path test and the product-name test with `ENOENT … pool/INDEX.md` / "pool/INDEX.md is read". The stub was then replaced by the real code.

**GREEN** — `node --test tests/pool.test.mjs`: `# tests 86 # pass 85 # fail 0 # todo 1`. `npm test`: **547 tests, 545 pass, 0 fail, 1 skipped (the NTFS folder-mode test), 1 todo**, 190.8 s, exit 0, output with no warning. (Before this task: 519, 516 pass, 1 skipped, 2 todo.) One comment in `card.mjs` was reworded after the full run; the pool test was run again after it.

The new tests (28 net: 29 new, one `todo` replaced):

- **19 on inline samples of a person** (`person()` built by the same `sample` helper, which now takes the checker; `only()` asserts exactly one error): the lists; a good person with a profession and with none; CRLF; no file; not a string; each key required; no other key (a seat's key included); no header / unreadable header / a key twice; the id's form (17 refused) and the file's name; the file rule (15 refused paths, backslashes, file fault first and the card still read); `profile` (4 accepted, 16 refused); `specialty` (a name or none, none without a profile, one fault when it cannot be read, a bad profile is the one fault); `evidence`; each section required; order (three swaps); no other section (a seat's and a judge's included, `## What he never does` refused, none twice); text under each; fences; every fault reported, the header first.
- **4 on the audience card**: its header decisions; what it reads and is blind to, with nothing in both lists; the six answers in order, the gap sizes, the public-page section with stop/understand/click after the six; the caveat verbatim on a line of its own exactly once, "at the top of every read, word for word", the real person's read, and `templates/outputs/TASK-READ.md` as the only template path its Output names.
- **3 on the person files**: exactly the five, each passing `validatePerson`; each `none / none / guess` and saying once, in one line before its sections, that she is an archetype and a guess; each moment without a list or a table, set at the clinic, and each check exactly one question.
- **1 on `pool/CARD-FORMAT.md`'s person section**, of the kind Task 9 wrote: its key rows equal `PERSON_KEYS` in order, the allowed values equal the checker's (`EVIDENCE` included), each `evidence` value is explained, the section names in code spans equal `PERSON_SECTIONS`, the folder and `validatePerson(text, { file })` are named.
- **2 on the index**, live (the `todo` is gone): the seats' header row, one row per card and no row without a card, cells equal to the header, shelf order; under `## People`, one row per person and no row without a file, two cells, a line for her moment.
- Existing tests widened: `pool/INDEX.md` and the persons are now among the texts whose named paths must exist and that must name no product; the names-table test and the format test use a shared `sectionOf`.
- The remaining `todo` ("a template, a skill or a reference file named in the pool exists") is untouched and still fails for its own reason: `pool/judges/accessibility.md names templates/outputs/LEDGER.md, which is not in the kit`. The audience card's `templates/outputs/TASK-READ.md` is among the paths it reads.

**Hand mutation** — 75 mutants written by hand against `scripts/lib/card.mjs`, each applied alone, the pool test run, the file restored: 66 of the person path (the lists, the three patterns anchored and unanchored, the folder, each branch of each key's rule, the cross rule of `specialty` four ways, the order of header and body, the file fault, `open`, `checkKeys`, `checkSections`) and 9 of `validateCard` where this task moved its code into the shared helpers. **75 of 75 killed.** Three survived the first run and were pinned with samples:

1. the dot of `person.<name>` read as any character → `person-desk-cover`, `person/desk-cover` refused;
2. the dot of `.md` in the file read as any character → `persons/desk-cover-md`, `persons/desk-coverxmd` refused (and the same for `profile.<name>`: `profile-front-desk`, `profile/front-desk`);
3. in `validateCard`, a file fault dropped when the header cannot be read — a gap that was there before this task; pinned in "a card lives in makers/…" because the line is now shared. The seat's "opens with its header" message is now pinned by its words too, since the kind of card became a parameter.

No mutant I could think of is left unpinned.

## What I ported from each § 23 source, and what I left behind

Opened, read-only, in the other repository: the four files of `.claude/skills/visuals-physician-viewer/` and nothing else. Nothing there was changed; `temp/media/` was never opened.

| Source | Ported, made generic | Left behind |
|---|---|---|
| `visuals-physician-viewer/SKILL.md` | The read made blind; every answer citing the thing that caused it, or no answer; the ranking with *clear · slight · tie* and one reason; one variant → no ranking; two viewers' disagreement a finding, never an average; the caveat verbatim at the top; only the card, nothing invented, nobody spoken for; "says what it would need to see, the makers decide the fix"; never an absolute score; stop / understand / click, kept for a public page, with the one-sentence retell written before reading on. | The product and its two professions; the feed placement; the informed pass (there the viewer reads the intent after the blind pass — here the seat never does); the craft question; the ledger and its severities (an audience has no ledger); the objection kinds; the refresh of cards from interviews; the measures read; the language pair. |
| `references/viewer-read-template.md` | The order of a read: caveat, who read and what, the answers per variant, the ranking, the one-variant line. Said in five lines of Output; the template itself is Task 12's. | Its wording of the caveat (the design's sentence is used, verbatim); the "for the founder" lines; every name. |
| `references/persona-cards.md` | The idea behind the `evidence` key: what a card rests on is said on the card, a guess stays a guess, and a read names what it was read from (the read gives the person's `evidence`). | Every trait, both cards, the tags' own words, the refresh procedure, every document it cites. |
| `references/borrowed.md` | How to credit: the two skills of `marketingskills` by their names, author, address and licence, as that record gives them; and that the caveat's source is a warning recorded and not verified — the card calls it a stance, not a quotation, and asserts nothing more. | The licence text; the refused parts. |
| The kit before the branch (`templates/PERSONA.md`, `reference/EXAMPLE/personas/priya.md` at `e01d00c`, this repository) | "Never does" as a section; the quality check, which is the design's bar; context told as a scene; the clinic's front desk as the setting. | Tech comfort and frequency (the design moves them to the profile); the surfaces list; the example's name and the product's. |

Not opened, because this task did not need them: the playbook, its lessons and briefs, `PROCESS.md`, `SKILLS.md`, the other role skills, the engines, the finished piece's record, the two interface runs.

## Self-review

- **Completeness.** Every file of the brief; rulings 1 to 9. The index test is live; the named-paths test is still a real `todo`.
- **Prose.** The audience card is 100 lines, a person 43 to 46. No product name (the test reads the new files). Lines wrap at 105 except table rows, header lines and the caveat, which is one line on purpose.
- **Discipline.** Nothing beyond the task, with three things a reviewer should know were touched: the shared helpers in `card.mjs`; two assertions of existing tests made stricter; `poolTexts` and the product-name list widened to the new files.
- **Design against brief and rulings.** I found no contradiction with § 7, § 8, § 11 or § 23. Two places where they are read together rather than alike are concerns 4 and 5.

## Concerns, the ones that most need a ruling first

1. **A profile's id is `profile.<name>`.** The brief says "a profile id"; nothing I was given fixes its form. I took the form of every other id in the pool. Task 12's `PROFILE-CARD.md` and Task 14's `pool/profiles/` need to agree, or the rule in `card.mjs` and the row in `CARD-FORMAT.md` change.
2. **`specialty` is free text on one line**, "named as the profile names it", not kebab-case, because a profile's specialty sections are headings. Nothing checks it against the profile: that would need both files.
3. **`sits-at` and `presets` come from Task 15's default-cast table** (Structure, Detail, Acceptance; surface, flow, system), since the design sections I was told to read give the seat no stages. Look is not in `sits-at`. A public page's "stop" is most telling on the finished look: if it should be castable there, add `look`.
4. **The seat may read the profile** (`reads` holds `profile`). § 8 says a person inherits her profile, and its table gives the audience "the person and the task". The card tells the seat to read what is true of her profession and that the "so the interface must" lines are a judge's. If the audience should never see a profile, drop it from `reads` and from step 2.
5. **The five persons are scenes in the clinic (ruling 4) and are meant for any project (§ 8).** Each card's second line and the task reader's step 2 say to keep her and change the setting. Whether a maker's brief does the same is for the brief templates and Cast (Tasks 12 and 15).
6. **The blind list is my choice beyond `intent`:** what says what the design means to do (`describers-brief`, `maker-notes`, `states-and-rules`, `strings` with their why-lines), the pages' code (`prototype`), and who made what and what others found (`author-map`, `other-ledgers`, `task-reads`). `build` is not in it, because that name includes its pictures; the Method forbids any page or source. With `task-reads` there, the seat has no re-read with marks as a judge has: every read is cold.
7. **The caveat lives in the card and in a constant of the test**, capitalised as a sentence as the brief quotes it (the design has it lower-case after a colon). Task 12's `TASK-READ.md` must open with the same sentence; the constant is not exported from a library.
8. **The heading is `## What she never does` whoever the person is**, as the brief fixes it; the format says so and a test refuses `## What he never does`. All five of the kit's people are women, so the heading is true of each.
9. **The index is written by hand** and held to the cards by the test; nothing generates it. The audience test pins that the pool has exactly one audience card, as the maker and judge tests pin their eight.

---

# Fix report — round 1

**Status: DONE.** Both Important findings and the five Minor ones are fixed as `task-11-fix-1.md` asks, in one commit on `v2-pipeline`, nothing pushed, nothing amended:

- `c7a7e2a fix: the audience reads a profile's traits, never its criteria, and smaller findings`

Eight files changed. `scripts/lib/card.mjs` is untouched, so the checker and its 75 mutants stand as reported above.

## What changed, finding by finding

**I1 / ruling R131 — the audience reads a profile's traits, never the profile.**
- `pool/CARD-FORMAT.md`: one new row in the names table, under `profile`: `profile-traits`, "a profile with every "So the interface must" line taken out: what is true, who it does not hold for, and the evidence. It is what an audience is handed, since those lines are what a judge holds a design to."
- `pool/audiences/task-reader.md`: `reads` is `[brief, person, profile-traits, pictures]`; `never-reads` gains `profile`. Step 2 is rewritten: "You are loaded with her card … Where she has a profile, you are handed its traits and no more: what is true of her profession, whom it does not hold for, and on what evidence. What an interface should do about them is not hers to know, nor yours." The first Never line now names her profile among what is never opened.
- The test pins both lists whole: `reads` by `deepEqual`, `never-reads` as an exact set, and nothing in both. It also holds the new row to its two claims (the lines are taken out; it is what an audience is handed).

**I2 — the blind list holds every folder that holds the intent.** `never-reads` gains `package`, `handoff-folder` and `build`, and so does the test's list. Step 1 says the brief never gives the seat the intent, its success criteria or a maker's reasons, "nor a folder that holds them". The list is now thirteen names: `intent, package, handoff-folder, build, profile, describers-brief, maker-notes, states-and-rules, strings, prototype, author-map, other-ledgers, task-reads`.

**M1 — an answer that comes back empty.** The "Where do I hesitate" answer ends: "If none, name the nearest thing she could have pressed instead, and what on the screen told the two apart." Pinned by the test.

**M2 — the brief's tasks against her own job.** Step 2: "The tasks are the brief's; her job says what "done" means to her." Pinned by the test.

**M3 — the names.** Redistributed, every `id` and file name as it was: the first-timer is Marta, the daily expert is Noor, the keyboard user is Linh, the second-language reader is Ana; Jo stays on the phone. The two names the review pointed at now sit on the two roles that know the product best.

**M4 — one term.** "Paper diary" in both cards that mention it; no card says "chart".

**M5 — a pressure of its own for each moment.**
- The first-timer keeps the man waiting at the desk, and the daily expert the caller on the line.
- `keyboard-user.md`: a new moment — ten past six, the clinic closed, alone at the desk, fourteen bookings to move out of the gym before she can go home, by keyboard as fast as she types. The job is now the run of fourteen ("land on the next booking, not back at the top of the list … none moved twice and none skipped"), and one Never line follows it ("thirty presses of Tab for each booking").
- `second-language-reader.md`: a new moment — the quiet half hour after lunch, nobody watching; a patient has written, she has tried to move the booking, and the tool has answered with a message she must be sure of before she writes back. The job, three of the six Never lines and the check follow it: the undo line and "Ask, with a patient standing there" are gone; a clipped line ("Booking moved": done, or to do?) and the word-by-word translation app take their place. A first rewrite had a colleague asking about the garden room, which the phone card already has; I changed it to a patient and Room 1 so the two moments share nothing.
- Only `first-timer.md` keeps the line about not pressing what may not be undone. The daily expert's "keep undoing a choice" became "keep changing back a choice", so the word is not in a second card.
- `pool/INDEX.md`: the two `## People` rows are rewritten to the new moments. Its tests are green.

The audience card is still 100 lines. To make room for the three additions I shortened step 1's last sentence, step 5 (now one line) and the public-page "Stop" answer, whose note about a plain grey drawing moved into step 3 ("go by its words and order, and say so"). The persons are 43 to 48 lines.

## What I tested, and the results

**RED** — the tests changed first (`node --test tests/pool.test.mjs`): 86 tests, 83 pass, 2 fail, 1 todo.

- "the task reader is handed a person, her profile's traits and pictures …" failed on `reads` (`'profile'` where `'profile-traits'` was expected). Fixing one thing at a time, it then failed on the blind list, then on `pool/CARD-FORMAT.md has a row for "profile-traits"` (and "every name a card reads … is explained" failed with it, asking for the row), then on the wording of step 2.
- "the task reader answers six things …" failed on the two new sentences (M2, M1).

**GREEN** — pool test: 86 tests, 85 pass, 0 fail, 1 todo. `npm test`, once, at the end: **547 tests, 545 pass, 0 fail, 1 skipped (the NTFS folder-mode test), 1 todo, 187.0 s, exit 0**. The remaining `todo` is the named-paths test, failing for its own reason as before.

**Hand mutation of what this round pinned** — 15 mutants of the card's two lists, of its new sentences and of the new row (the whole profile read again, or beside its traits; each of `profile`, `package`, `handoff-folder`, `build` and `intent` dropped from the blind list; `pictures` added to it; the M1 line, the M2 clause and each half of step 2 removed; the row without "taken out", without "what an audience is handed", or misnamed): **15 of 15 killed.**

## Concerns

None new. Of the nine above, concern 4 (the seat may read the profile) is settled by ruling R131 and concern 6 (the blind list) by I2; the other seven stand as written. One thing for Task 12 to know: the brief template for an audience has to hand over `profile-traits`, which means someone — the conductor, or the template — takes the "So the interface must" lines out of a profile before the seat sees it. Nothing in the kit does that yet.

---

# Fix report — after the re-review

**Status: DONE.** The four wording repairs, in one commit on `v2-pipeline` (on top of `75e4dd8`), nothing pushed, nothing amended:

- `68f1444 fix: four wordings in the audience card and one person`

Two files: `pool/audiences/task-reader.md` (100 → 103 lines) and `pool/persons/second-language-reader.md` (48 → 49). The header and the caveat sentence of the card are untouched, and no other part of the method was cut to pay for these. `tests/pool.test.mjs` is not changed: no pin held any of the sentences that changed.

- **N1 — step 5:** "A task that needs any of it is not finished. Where she would stop, you stop: never work a step out with patience she lacks."
- **N2 — step 2:** "A person of the kit's own is set in an example product. When your brief's product is another, keep her hands, her hurry, what she knows and what she refuses, and change only the setting."
- **N3 — step 1:** "The less you know of what the design means to do, the better."
- **N4 — the second-language reader's moment:** "Her hands are on the keyboard, and her phone, with its translation app, lies beside it." It sits between the message appearing and "She has all the time she needs".

**Tested:** `node --test tests/pool.test.mjs` before the change and after it: 86 tests, 86 pass, 0 fail, 0 todo (the named-paths test went live with the templates of `75e4dd8`). The whole suite was not run, as asked, while the other task's review reads the checkout.

**One thing to know:** the three sentences restored to the method are not pinned by a test, which is how a cut for length took them out once. I left the tests alone, as this round's scope asks; a pin for each is three lines if the controller wants them.
