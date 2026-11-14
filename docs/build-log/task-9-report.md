# Task 9 — The card format, its tests, and the eight maker cards: report

**Status: DONE_WITH_CONCERNS.** The concerns are judgement calls the brief leaves open; they are listed last, the ones that need a ruling first. Two commits on `v2-pipeline`:

- `01a7d2f feat: the card format and the maker cards`
- `89144e9 fix: three maker cards say what they mean` (prose only, found on the self-review read after the first commit; never amended)

## What I implemented

| File | Lines | What it is |
|---|---|---|
| `scripts/lib/card.mjs` | 223 | `validateCard(text, { file }) → string[]`, and the lists it checks against |
| `tests/pool.test.mjs` | 521 | 42 tests: every rule on inline samples, then the kit's own pool |
| `pool/CARD-FORMAT.md` | 119 | The contract a person writing a card reads |
| `pool/MODELS.md` | 46 | `Reviewed: 2026-11-14`, the four reasons, one row for each of the eight seats |
| `pool/makers/structure-describer.md` | 108 | |
| `pool/makers/outside-describer.md` | 83 | |
| `pool/makers/screen-generator.md` | 94 | |
| `pool/makers/transcriber.md` | 87 | |
| `pool/makers/interaction-designer.md` | 85 | |
| `pool/makers/interface-writer.md` | 92 | |
| `pool/makers/prototype-builder.md` | 83 | |
| `pool/makers/visual-designer.md` | 119 | Longest, because `## Borrowed` carries step 5's list of skills |

### `scripts/lib/card.mjs`

- **Exports:** `CARD_KEYS`, `SHELVES`, `MODELS`, `EFFORTS`, `LOADED_WITH` (ruling R113), and five more that the document is compared against: `FOLDERS` (`makers → maker` …), `ENGINE_FORMS` (`own`, `skill:<name>`, `model:any`, `tool:<name>`), `SECTIONS`, `JUDGE_SECTIONS`, `CHECK_COLUMNS`. All frozen. `STAGES` and `SIZES` are imported from `scripts/lib/state.mjs`.
- **Errors** start with where: `file:`, `header:` or `body:`. Order: the file, the header's keys in the format's order, unknown keys, then the body. Every fault is reported, not the first.
- **Header rules:** every key present and no other; `shelf` one of three and equal to the folder's; `id` is `<shelf>.<name>` (grammar), its shelf the header's, its name the file's — three separate checks, so one fault gives one error; `sits-at` a non-empty list of stages; `presets` a list of sizes, may be empty; `loaded-with`, `suggested-model`, `suggested-effort` by enumeration; `engine` by pattern, `model:any` the only `model:` value; `verified` a real date written `YYYY-MM-DD` (the calendar is asked, so 30 February is refused); `job` and `cast-when` non-empty text; `reads` a non-empty list, `never-reads` a list that may be empty; no list holds an empty item.
- **Body rules:** the `##` sections by exact name, in order, none missing, none twice, no other, each with text under it; a `##` line inside a code fence is not a section; a judge has `## Core checks` (two to six top-level list items, numbered or bulleted) and `## Optional checks` (one table: header exactly `id | trigger | method`, a dashes row, then rows of three non-empty cells, or none) before `## Method`; a maker or an audience has neither.
- **`file`** is optional. With it, the path must be `makers|judges|audiences/<kebab-name>.md` (backslashes read as slashes). Without it, the id is still held to its grammar and to the header's shelf.
- **Three choices worth knowing:** (1) a card with no header returns one error and the body waits; (2) when `shelf` cannot be read, the folder says whether the card is a judge, so a typo in `shelf` is one error, not three; (3) a non-string `text` throws — it is the caller's mistake, never reported as a fault of a card.
- CRLF and a byte-order mark are handled by `frontmatter.parse`, which the checker uses.

### `pool/CARD-FORMAT.md`

Where a card lives; the header as one table (a row for each key, its allowed values in code spans, what it says); the body's six sections in order; the four engine spellings and the three engine rules of § 7; that `engines-on` entries are written in the card's own spelling (`model:openai`, `model:gemini`, `tool:stitch`, ruling R86) and that `model:any` is on when any `model:` entry is; that model and effort are suggestions, never instructions; and a table of the names used in `reads` and `never-reads` (see concern 5).

### `pool/MODELS.md`

The `Reviewed:` line, the sentence that these are suggestions and nothing in the kit enforces them, the four reasons in the kit's own words, the order of capability the table assumes (see concern 8), and one row per maker with a short why.

### The cards

Header values, as the brief's table and ruling 9 give them:

| Card | sits-at | presets | engine | model / effort | never-reads |
|---|---|---|---|---|---|
| structure-describer | structure | surface, flow, system | own | fable / high | other-proposals, session-idea, current-screens |
| outside-describer | structure, look | — | model:any | none / none | other-proposals, session-idea, current-screens, design-system |
| screen-generator | structure, look | — | tool:stitch | none / none | design-system, kit, current-screens, sibling-surfaces, other-proposals, session-idea |
| transcriber | structure | — | own | sonnet / medium | describers-brief, intent, other-proposals, session-idea |
| interaction-designer | detail | adjustment, surface, flow, system | own | fable / high | other-proposals |
| interface-writer | detail | adjustment, surface, flow, system | own | fable / high | other-proposals |
| prototype-builder | detail | surface, flow, system | own | opus / medium | other-proposals, component-source |
| visual-designer | look | adjustment, surface, flow, system | skill:frontend-design:frontend-design | fable / high | (empty) |

All `loaded-with: none`, all `verified: 2026-11-14`. `presets` follow the default cast table of the plan's Cast task (surface and flow: three describers, the three Detail makers, the visual designer; adjustment: the interaction designer or the interface writer, the visual designer if visual).

What each decides, beyond its header:

- **structure-describer:** the four lenses in a line each; the first idea into `firstIdea` and set aside; "no interface" considered; real words and the worst plausible rows; the hardest state played through; `bet`, `cost`, `absent`; a one-line `validate` command; the format summarised in the card with one small screen as an example; never a component or layout name, never another proposal, the session's idea or today's screen (the continuity maker is the one exception, as § 12 says).
- **outside-describer:** written to the conductor, as ruling 10 asks. The `describe.mjs` command with its five flags; exit 0 is a proposal like any other; an answer not in the format leaves `<out>.raw.txt` and goes to a transcriber; a refusal leaves nothing, one retry after a timeout; the record of whose proposals are picked (§ 24). At Look only in a fresh pass. Without the engine: not cast. The card never says "key" (a test holds that).
- **screen-generator:** the fresh brief only; one or two screens; the prompt describes the person, never the interface; a new empty project, no design system created or applied; six known behaviours as dated observations; what is kept (HTML, screenshot, prompt) and where; a transcriber, not this seat, writes it for the board. Without the tool: a Claude maker writes one free HTML screen with a taste skill as lens.
- **transcriber:** reading order; roles by what a thing does; containers only where the source groups; words copied exactly; paint dropped; `[unreadable]` and a `note` for what could not be read; see concern 2 for the proposal's own lines.
- **interaction-designer:** the states table from every state of the intent's table; an omitted state reported under "States the intent does not name", never invented; rules under five heads (validation, focus order, keyboard, what changes unasked, what cannot be undone); ten edges to work per screen; a stable id for every element a rule names; asks nothing.
- **interface-writer:** the founder's lines read first and described; every string listed before any is written; each language from the intent, never from another; written for the surface; one word for one thing; a why-line on every key (`same`, or what parted and why); characters counted by tool, with the one-line command; read aloud.
- **prototype-builder:** one description per screen holding roles and string keys, no words; a small dependency-free script generates every screen × state × language page in the contract's markup; `data-ux` and `data-screen`; clickable; a generated index; the count as a sum; one `shots.mjs` run to look at what was made.
- **visual-designer:** static pages that link the real token file; what is the designer's inside a system (hierarchy, spacing, emphasis, density, responsive, themes, motion only when cast); variants on one named axis; each language set by itself; the table of measured values, measured by tool; reference pictures with `shots.mjs`; after a fresh pass, what the founder marked rebuilt on the tokens as named extensions; a short paragraph for when it is cast for a direction.

## What I tested, and the results

`node --test tests/pool.test.mjs`: **42 tests, 41 pass, 0 fail, 1 todo.** `npm test` (once, on the tree of `01a7d2f`): **503 tests, 501 pass, 0 fail, 1 skipped (the existing NTFS skip), 1 todo; exit 0; 181 s.** The second commit changes three cards only, and `tests/pool.test.mjs` is the only test that reads `pool/`, so I re-ran that file alone after it (41 pass, 1 todo).

- **Tests 1–32, the rules on inline samples** (ruling 3): a good maker, judge and audience card; CRLF; no file given; a non-string text; then one test or more for each rule — a missing key (each of the thirteen), an unknown key, no header, a header that cannot be read, each enumeration, the engine forms (seven accepted, eighteen refused), the id (nine ways to be wrong), shelf against folder, a file outside the shelf folders (eight paths), a stage not in `STAGES`, a size not in `SIZES`, a `verified` that is not a date (ten values), empty `job` / `cast-when`, `reads` and `never-reads`, a section missing (each), out of order, unknown, twice, empty, a `##` in a fence, checks on a maker, a judge with one core check and with seven, the optional table missing, with the wrong columns, without its dashes row, a row with an empty id, trigger or method, a row with two or four cells; and that every fault of one card is reported, in order.
- **Tests 33–41, the kit's pool:** every card under `pool/makers|judges|audiences` is valid (a folder not there yet holds none); the eight makers hold the plan's stages, engine, model and effort; the outside describer never mentions a key; every path of the kit named in `CARD-FORMAT.md`, `MODELS.md` or a maker card exists, fences included (ruling R9, made mechanical); `MODELS.md` is dated, says suggestion, and has exactly one row per card with the card's own model and effort; `CARD-FORMAT.md` lists the checker's keys in order, each enumeration's values, the folders, the sections and the three columns, and the `engines-on` spellings; every name in a card's `reads` or `never-reads` has a row in `CARD-FORMAT.md`; the product-name pattern is proven on words (`conversation`, `universal`, `vice versa`, `Versailles` pass; `Verbato`, `verbato`, `Versa` are caught, ruling R3), then run over the text files of `pool/`, `templates/`, `skills/`, `kit/`, `reference/`, `scripts/`, `README.md`, `LESSONS.md`, passing over what does not exist yet and asserting that seven known files were in fact read.
- **Test 42, the index,** carries `{ todo: 'pool/INDEX.md is written with the audience card' }` and its full body: exactly one row per card, `id`, `job` and `cast-when` equal to the header. Task 11 removes the option. Until then Node prints it as `not ok … # TODO` with the missing-file error, and the run exits 0; that one block is the only thing in the output that is not `ok`.

## TDD evidence

**RED 1** — `node --test tests/pool.test.mjs` with no module:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/scripts/lib/card.mjs' imported from …/tests/pool.test.mjs
# tests 1   # pass 0   # fail 1
```

Expected: the module did not exist. It proves nothing about each test, so:

**RED 2** — the same command against a stub `card.mjs` that exported the lists and `validateCard = () => []`:

```
ok 1 - the lists a card is checked against
ok 2 - a good maker card, a good judge card and a good audience card are valid
ok 3 - a card with CRLF line endings is valid
ok 4 - a card is valid without a file to check it against
not ok 5 - every header key is required            (ERR_ASSERTION)
…
not ok 31 - every fault of a card is reported, the header first
not ok 32 - every card in the pool keeps the card format      ('the pool holds cards')
…
not ok 40 - no product name appears in what the kit ships     ('pool/CARD-FORMAT.md is read')
# tests 41   # pass 5   # fail 35   # todo 1
```

Expected: every rule's test failed by assertion, because the stub finds no fault; the pool tests failed because no card and no document existed. The five that passed are the lists, the three "valid" tests (a checker that finds nothing agrees a good card is good) and the word test of the product-name pattern.

**GREEN** — after the real `card.mjs`: tests 1–31 passed at once and 32–40 still failed (no pool). After the documents and the cards, and the tests added during mutation:

```
# tests 42   # pass 41   # fail 0   # todo 1
```

## Hand mutation of `scripts/lib/card.mjs`

Done on a copy of the kit in the session's scratch folder, never in the checkout (another agent was reading it). **137 mutants, one change each; 137 killed, and each by at least one inline-sample test** — none is killed only by the kit's own cards. They cover every exported list, every part of each pattern (engine, name, id, file, heading, fence, list item, dashes), every guard and every branch of the header and body checks, the table reader, and the wording that tests assert (the plural, the row number).

The first pass left three survivors, and before it I found two unobservable bits of code. What I did with each:

| Found | Resolution |
|---|---|
| A dot allowed in a name survived | Pinned: `maker.room.lister` and `makers/room.lister.md` are now refused in tests |
| The id pattern unanchored at its start survived | Pinned: `the-maker.room-lister` is refused in a test |
| `typeof value !== 'string'` in the date check survived | Redundant: the calendar's answer is compared with `===` to the value, which already refuses a list or a number. Removed |
| A separate `YYYY-MM-DD` pattern before the calendar check | Redundant for the same reason (the round trip implies the form). Removed |
| Un-escaping `\|` inside a table cell, and a look-behind on the closing bar | No error ever shows a cell's text, so neither could be observed. Removed |

**No mutant is left unpinned.** One limit of the checker that is not a mutant: a list item or a table line inside a code fence, within `## Core checks` or `## Optional checks`, is counted like any other. No card has one.

## Step 5 — the visual designer's engine

**Kept: `frontend-design`.** Its installed name here carries a plugin prefix (`frontend-design@claude-plugins-official`, skill `frontend-design:frontend-design`), so the card's `engine` is `skill:frontend-design:frontend-design`, as ruling 12 asks. The card's Method stands without it: it says so, and tells the designer to let the skill shape hierarchy, emphasis and restraint and to leave aside what it says about choosing a palette or typeface.

**Where the skills are.** Listed by reading folders, nothing run: the plugins in `~/.claude/plugins/installed_plugins.json` (`frontend-design`, `ui-ux-pro-max`, `design-audit`, `typography`), and the taste and motion skills, which on this machine are installed as project skills of the other repository (its `.claude/skills/`, mirrored in `.agents/skills/`), not at user level. See concern 1.

**Read, and what each would lend** (`frontend-design` whole; the others their header and section list, and the opening sections of `design-taste-frontend`):

| Skill | Lends | Default? |
|---|---|---|
| `frontend-design` | Hierarchy, one bold thing with quiet round it, structure that carries meaning, a quality floor (responsive, focus, reduced motion); it follows a brief that fixes the look and brings no stack | **Yes** |
| `emil-design-eng` | The unseen details of parts and when a thing should move; mostly animation and component code | No: for a motion designer and a build, little for static pages. It also opens with a fixed one-line reply when called without a question |
| `design-taste-frontend`, `-v1` | Reading a brief, dials for variance, motion and density, a list of generated-page tells | No: made for landing pages and portfolios, with its own architecture |
| `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `gpt-taste` | A fixed look each: its own type, colour, layout | No: against a binding design system; a lens for a fresh pass or a direction |
| `redesign-existing-projects` | An audit of generic patterns, then an upgrade | No: it changes type and colour; a judge's list |
| `apple-design`, `mobile-native` | Gesture and physical motion; phone-feel fixes | No: a motion designer's, and a checklist at phone width |
| `stitch-design-taste` | A design-system file for the screen generator | No: the screen generator runs without one |
| `animate`, `animate-expo`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary` | Motion decisions and reviews | No: the motion designer's card, when it exists |
| `motionmaxxing`, `business-motion-film` | Films | No: not interfaces |
| `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `brandkit` | Work that starts from a generated image | No: § 24 uses no image model for an interface |
| `ui-ux-pro-max` | Palettes and pairings as data | No: § 24, not used inside a binding design system |
| `design-audit`, `typography` | Audit and typographic checks | No: § 24 gives them to the visual craft judge |

No skill fits a system-bound product better than `frontend-design`: the others either impose a look or are about motion. **Not read, because they are neither taste nor interface motion:** `ask-sonner`, `pick-ui-library`, `prototype`, `full-output-enforcement`, `write-swift`, the `remotion-*` set and `chaojifeng-video-design` (video).

## What I ported from each § 23 source, and what I left behind

| Source | Ported, made generic | Left behind |
|---|---|---|
| `playbook/README.md` (the loop) | A brief gives context, never the design, and the founder reads it first; describers blind to each other; outside models sent one brief by a script and merged blind; "say which describers answered"; the record of whose proposals are picked | Everything about pictures, engines, prices, the layer, the product and its people |
| `playbook/briefs/describers.md`, `describers-cover.md` | "Range matters more than polish"; a proposal names its risk (here: `cost`); "you know nothing of what was tried, on purpose" | The product, the posts, the honesty floor's rows, every reference |
| `playbook/briefs/maker-words.md` | The founder's own lines, verbatim, with what they do, as the bar; each language from the intent; the why-line; counted by tool; read aloud; "ask no questions, decide, record the assumption" | His actual lines, the language pair, the word rules, the links |
| `playbook/LESSONS.md` | "Count by tool before you tell him a number"; a brief that prescribes returns the session's own concept; nothing rendered before he marks (here: the generator's screens are never the record) | Every dated incident, engine and product detail |
| `visuals/LESSONS.md` (the twenty rules) | Nothing directly: they bind the process, not a maker's method | — |
| `.claude/skills/visuals-transcreation-es419/SKILL.md` | Both languages from the intent, never one from the other; plan for the language that runs longest; "same" written so that silence is never ambiguous; a string over its limit is rewritten, never squeezed | The register rules for one language, the caption numbers, the fixed vocabulary, and everything in `craft-borrowed.md` (third-party, MIT: the diagnosis, the three-question gate, the sweeps, the tells) — none of it is in a maker card, so no attribution is owed here. The words judge (Task 10) is where the tells belong |
| `.claude/skills/visuals-creative-direction/` (`SKILL.md`, `references/idea-method.md`) | "First idea, set aside", then another kind | The rest of the idea method. **Attribution kept:** the step is adapted from `motionmaxxing` by Tejas Makwana (Apache-2.0), and the structure describer's `## Borrowed` says so with the repository address |
| `.claude/skills/visuals-soft-social-templates/SKILL.md` | Each language set by itself, re-set and never shrunk; what is missing is named, not invented | Sizes, the brand, the board method, its third-party parts (not ported) |
| Version 1 of this kit (`master`: `phases/4-MOCKUP.md`, `setup/TOOL-ADAPTERS.md`, `reference/ANTI-PATTERNS.md`, `phases/5-EVALUATION.md`) | The generator is slow, is never retried on a timeout, and returns a picture and not code; describe the person, never the interface; real content with worst cases; tokens, never raw values; themes and the phone width in the same pass; the hand-written page when the tool is missing. And the voice | The phases and gates themselves |

Not opened: `scripts/visuals/engines/`, `posts/4/`, `PROCESS.md`, `SKILLS.md`, the judges' briefs and skills (Tasks 10–11 need them, not this one), and `temp/media/`.

## Self-review

- **Completeness:** every file of the brief; every ruling. R3 and R4 are in the tests and the checker; R113 is the module and its inline samples; R9 is a test; R86 is in `CARD-FORMAT.md` and a test; ruling 10's "never mentions a key" is a test; ruling 12's prefixed engine name is in the card, the test and above.
- **Each card read as its sub-agent.** This found five things after the first commit, fixed in the second: the interface writer told to "set" a limit that the surface sets; the prototype builder's description said to hold markup when it holds roles; the outside describer's brief in a fresh pass; and two wordings. Earlier reads added the missing-lens case and the assumptions line to the structure describer, and the two kinds of brief to the screen generator.
- **Length:** no card past 119 lines.
- **Generic:** no product, person or profession; examples are the room-booking tool. The product-name test covers `pool/`.
- **Discipline:** three things are more than the brief's list, each named in the concerns below (5, 6, 7).

## Concerns

**Need a ruling**

1. **I opened files in the other repository that § 23 does not name.** Step 5 and ruling 12 say to read each installed taste or motion skill; on this machine they are installed only as that repository's project skills. I read their `SKILL.md` headers and section lists (and two opening sections), read-only, copied nothing, and went nowhere near `temp/media/`. If that was outside what you meant, the list in the visual designer's `## Borrowed` is the only thing that depends on it.
2. **The transcriber and the proposal's own lines.** The format requires `name`, `bet`, `cost`, `absent`, `hardest` and `firstIdea`; a generated screen states none of them. "Adds nothing" and "the founder does not know which came from where" pull against each other: "not stated" on the board would mark the option as the transcribed one. The card has the transcriber copy these where the source states them and otherwise describe, in one plain sentence each, what the screens show, never arguing for it; `firstIdea` (never drawn, stripped at the merge) says it is a transcription; the reply lists which lines are its description. That keeps the blind at the price of a copyist writing five sentences. The other way is honest markers and a weaker blind.
3. **`verified: 2026-11-14` on the screen generator is the day the card was written, not a day the tool was called.** I did not call it: a generation sends a prompt off the machine and spends quota, and this task had no reason to. Its behaviours come from version 1 of the kit (slow; never retry; a picture, not code) and from this machine's notes of earlier runs (the twenty-screen listing; the faster model answering in time; what it invents). The card says "observations on record as of", and its `## Borrowed` says where each came from. If `verified` must mean a live check, the date should wait for Task 11's or Frame's check.
4. **The outside describer at Look.** The brief says only "at Look only inside a fresh pass". `describe.mjs` writes a proposal or `<out>.raw.txt`; a concept for Look is not a walkthrough, so the card says the raw file is the answer there. That follows from the script, not from the plan; the conductor's fresh-pass reference (a later task) may want it said differently.

**Additions beyond the brief's list — keep or cut**

5. **The names table in `CARD-FORMAT.md`, and its test.** `reads` and `never-reads` hold short names (`brief`, `chosen-structure`, `other-proposals` …), as Tasks 10 and 11 already assume (`maker-notes`, `author-map`, `other-ledgers`, `intent`). Without a list, a person writing a card cannot know what to put there, so the format explains the nineteen names the makers use. The test requires a row for every name a kit card uses: **Task 10 must add rows for its new names**, and the failure message says exactly that. `validateCard` does not check names, so a project's card is free.
6. **A test pins the makers' decisions** (stages, engine, model, effort) from the plan's table. If the plan changes a value, that test changes with it.
7. **The visual designer's direction paragraph.** Three lines for when it is cast once per direction, which the plan's Look task does "until a direction-maker card exists". Without them, a designer briefed for a direction would hold a card that says "never choose a palette".

**Smaller**

8. **`MODELS.md` states the order of capability its table assumes** (`fable`, `opus`, `sonnet`, `haiku`, most capable first). I inferred it from the brief's assignments and reason 1; it is written as an assumption to review, not as a fact about the models.
9. **The data map of § 4.5** (each element → where its content comes from) is among what Detail writes, and no maker's row in the brief's table owns it. No card claims it. The Detail skill should say who writes it; the interaction designer is the natural seat.
10. **`skill:frontend-design:frontend-design` is this machine's installed name.** Where the skill is installed without a plugin, the name is `frontend-design`. Frame's check for a missing engine should match on the skill's own name, or the card will be reported as missing its engine on such a machine.
11. **The visual designer's `## Borrowed` groups skills that share one answer on one line** (ruling 12 says a line each). A line each put the card at 129 lines; grouped, it is 119. The table above has them all.
12. **`strings.json` is named in two cards** (the brief's own table names it). Every other package file is said in words with its folder, as ruling 8 asks; no template file is named anywhere.
13. **Two mechanics are mine:** the prototype's buttons navigate through one shared script of a few lines (static pages cannot make a `<button>` a link without changing the kit's markup), and the visual designer measures with `scripts/accept.mjs prototype`, whose results carry a measured `actual` for a contrast or a size. Both use only what exists.
14. **Themes.** `shots.mjs` and `accept.mjs` set a theme through the browser's colour scheme. A project whose token file switches themes by a class or an attribute will not change theme in the pictures. The visual designer's card tells the designer to say so in the reply; nothing in the kit solves it yet.

---

## Fix report — the controller's rulings

Commit `7df0857 fix: the interaction designer owns the data map` on `v2-pipeline`. Three files, prose only: `pool/makers/interaction-designer.md` (85 → 93 lines), `pool/makers/transcriber.md` (87 → 90 lines), `pool/CARD-FORMAT.md` (one row reworded). `scripts/lib/card.mjs` and `tests/pool.test.mjs` are untouched.

**Ruling R119 — the interaction designer owns the data map.** Done as asked.

- *Method*, a new step 7, "Write the data map": for every element that shows data or offers an action, it records where the content comes from, by the row of the context's inventory it traces to ("Trace it; do not assume it"). What the product cannot supply today is listed as a dependency, with the element that needs it and what is missing; it is never invented, and the element is never dropped quietly to hide the gap.
- *Output*: the data map is one of the things returned (each element by its id, what it shows or offers, the inventory row its content comes from), and "Dependencies" is a third list beside the two it already returned. The reply still gives the count of each list.
- *Never*: "a source for one" joins the things it must not invent. The opening paragraph now says the designer also settles where everything shown comes from.
- *The vocabulary.* `reads` already held `context`, so no name was added. I reworded that row of the names table in `CARD-FORMAT.md` to say the context holds the inventory ("who she is, and its inventory of what the product can show and do"), so the word the card uses is the word the format explains.
- The header is unchanged, `job` included, so `MODELS.md` and the test that pins the makers' values needed nothing.

**Ruling R118 — the transcriber.** The ruling said to change nothing if the card already recorded, in the source-only `source` key, that the lines were read off a screen. **It did not: the card told the transcriber not to write `source` at all** ("the conductor tags the file"). So I changed it, in the same commit, since one commit was asked for; the commit's body names both rulings.

- Step 7 now ends: the lines are written "as any proposal's are written, so that nothing on the board marks this one out"; then `source` is one line saying what was transcribed and which of those lines were read off the screens because no maker stated them; and it says why that is safe (the merge strips `source` and nothing draws it).
- *Output* now says to write `source` and to leave `author`, `engine`, `track` and `model` to the conductor. The reply's third line is what the `source` line says.
- Checked against the format before writing it: a proposal with a one-line `source` is valid (`validate` → `[]`), and the sealed form refuses it (`"source" stays in the source file; a letter copy does not carry it`), which is what keeps it off the board.

**Tests.** `node --test tests/pool.test.mjs` only, as ruled: **42 tests, 41 pass, 0 fail, 1 todo** (the index, for Task 11). Every card still keeps the format, the names test still passes with the reworded row, and no kit path named in a card is missing.

**What stands unchanged**, per the rulings: concerns 1, 3 and 4; the names table and its test; the test pinning the eight makers; the Direction paragraph; `skill:frontend-design:frontend-design`. Concern 9 of the first report (the data map had no owner) is closed by R119.

**One thing for whoever writes the Detail skill (Task 17):** the card returns the data map and the three lists "in the files your brief names". The plan's Detail task lists `DETAIL.md`, `states.md`, `strings.json` and `prototype/` under `05-detail/`, and no file for the data map, so the skill or its template decides where the map and the dependencies land.

---

## Fix report — round 1

Two commits on `v2-pipeline`, as the fix file names them:

- `3be58e5 fix: at Look a fresh maker chooses only the paint, and the cards' smaller findings` — the eight cards' fixes and `pool/CARD-FORMAT.md`.
- `d1f4e87 fix: the card checker reads fences, lists and skill names as written` — `scripts/lib/card.mjs`, `tests/pool.test.mjs`, and one sentence of `pool/CARD-FORMAT.md` (see "Beyond the fix file", 1).

**Tests.** `node --test tests/pool.test.mjs`: **52 tests, 50 pass, 0 fail, 2 todo** (the index for Task 11; the `templates/` twin for Task 12). `npm test`, once, on the final tree: **513 tests, 510 pass, 0 fail, 1 skipped (the existing NTFS one), 2 todo; exit 0; 181 s.**

Card lengths now: structure-describer 113 · outside-describer 87 · screen-generator 115 · transcriber 101 · interaction-designer 97 · interface-writer 93 · prototype-builder 88 · visual-designer 120. `CARD-FORMAT.md` 145.

### I1 — ruling R121: at Look a fresh maker chooses only the paint

- **`screen-generator.md`.** The Method is now split by stage. Step 1 says what the brief holds at Structure and that at Look it also names one screen and carries what is approved for it. Steps 2 and 3 open with "At Structure" (choose the screens; write the prompt from the brief). A new step 4, "At Look, choose only the paint": the brief names the one screen the visual designer is drawing and its state, and carries that screen's approved structure and strings; the seat asks for that screen, in that state, with those words exactly as written; "add no element, drop none, rewrite no string, and choose no other screen". Because the tool invents, the step also says what to do when it strays: ask once more, saying what strayed; if it strays again, keep it as it came and list every difference in the reply. A Never line says the same in one sentence.
- **The fallback** ("Without the tool") is held to it by name: "at Look step 4 binds it as it binds the tool: that screen, that state, those words, and only the paint its own."
- **`outside-describer.md`.** The Look paragraph now says the seat chooses only the paint, what the brief it is sent names and carries, that it asks for that screen with those words exactly ("no element added, none dropped, no string rewritten, no other screen"), and that what comes back is shown beside the system version "with anything it changed said beside it", never mended.
- Structure's behaviour is unchanged in both cards.

### Minor findings

| | What changed |
|---|---|
| **M1** | Structure describer, Never: "Only a brief lifts the blind on today's screen: the cast may name one describer the continuity maker, and that one's brief says so and hands it the screen. If yours does not say so, you never see it." The header keeps `current-screens`. |
| **M2** | Outside describer: `kit` and `sibling-surfaces` added to `never-reads`, and to the first Never line. |
| **M3** | Screen generator: step 5 says to ask for the tool's faster model, and for the most capable one only when the brief says to, expecting a timeout. The fallback writes "the same one or two screens … one file each". Step 7 gives the picture's command, checked against the script's usage: `node scripts/shots.mjs <the screen's file> --out <the same folder> --widths <the device's width> --allow-errors` (a screen as it came may ask for things that do not load; the script still takes the picture and prints what failed). The fallback keeps each file, takes its picture with the same command, and puts one line where the prompt would be, saying it was made on the card's own text and with which lens. |
| **M4** | The prompt: the vocabulary gains `generator-prompt`; the transcriber has it in `never-reads`, in step 1 and in Never. One proposal: the generator's steps 2 and 8, and the transcriber's step 1 and its last Never line, say two screens of one concept are one proposal with two entries in `screens`; the `source-screen` row of `CARD-FORMAT.md` no longer says "the one screen". `hardest`: "what they show for the hardest state they draw and, when they draw none, the state these screens answer least … never 'not shown' or 'not stated'" (R118 extended). |
| **M5** | Prototype builder, step 8: "less the rows the states table marks 'cannot occur' times the number of languages". |
| **M6** | Prototype builder: step 3 reads "the strings table (the file your brief names, `strings.json` when it names none)". A description holds the screen's id and title; the title is "the screen's name on the board, not a word of the interface, and it is the only text a description holds". Step 4: a page's `title` is the screen's title, with the state and the language. Step 7: the index's words are the screens' titles and the names of states and languages, "names, not interface words". The Never line now forbids typing "a word of the interface" and says what the names are. |
| **M7** | Interaction designer, step 6: "Only an item carries an id; a container never does", with the two cases taken through it — a dialog by its screen's id ("when `book-walk-in` opens, focus lands on `patient-name`"), an expansion by the item that heads it or opens it. I read the finding's "two examples at :47-48" as the dialog and the expansion of the focus-order rule (lines 41–42 at that head); say so if you meant others. |
| **M8** | Both summaries now sit under `### The walkthrough format, in short`, every key, role and container in a code span, and the container line corrected: "An expansion always has a `label` … A region or a group may have a `label`." A test holds each to `KEYS`, `ROLES` and `CONTAINERS` in both directions (below). |
| **M9** | Both cards: "From the kit's root — two folders above this card — and with your file by its absolute path", and the command ends `<the absolute path of your file>`. |
| **M10** | `CARD-FORMAT.md`: one reading order, stated once at the top ("The brief names the seat's card by its absolute path and says to read it first. The card's first step then sends the seat back to its brief"); the `brief` row no longer says it is read first. "Neither can say more than the other" is gone: a new section, "What a machine checks, and what a reader must", says what the checker holds a card to, lists the written forms it reads, and names what only a reader can check (the title and opening, the Method's sufficiency and what it says of a missing engine, that a trigger is observable, that each Never is a real temptation, that Output names no missing file). |
| **M11** | Below. |
| **M12** | A skill is one name, or a plugin and a name, each `[a-z0-9][a-z0-9_-]*`. `skill:a:`, `skill::a`, `skill:a:b:c`, `skill:-a`, `skill:_a`, `skill:a:-b`, `skill:a:_b`, `skill:a::b` are refused. |
| **M13** | The named-paths check runs over every card and both documents, for `scripts/`, `kit/` and `pool/`. Its twin for `templates/` is `a template named in the pool exists (Task 12 makes this live)`, with `todo: 'Task 12 writes the templates the judges and the audience name'`; today it passes and prints as `ok … # TODO`. A small test proves the path finder itself on a fixed text. |
| **M14** | The product-name scan also reads `.claude-plugin/`, `package.json` and `tests/fixtures/`, and asserts that a known file of each was read; it asserts too that no test file outside the fixtures is read (they hold the two names, in the pattern). |
| **M15** | Visual designer, `## Borrowed`: twenty-seven skills, one line each. To stay at 120 lines I cut seven elsewhere: the lens paragraph, step 2, the themes line and step 6 are tighter, one Never line that repeated step 4 is gone, and another is one line. |
| **M16** | Interface writer, step 8: "Count what she sees, by tool", with `node -e "console.log([...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(process.argv[1])].length)" "Café"` and "That prints 4". Step 7: "When the product ships one language, the note says what the line is for and what it must not be mistaken for." |
| **M17** | Two inline samples: a key written twice with different values, and twice with the same, each one error (`header: line 4: "shelf" appears twice`). |

### M11 — the checker

- **Fences.** The opening fence's marks are kept; a fence closes only on a line of the same character, at least as many of it, and nothing after them but spaces. Tests: a `~~~` fence holding a ```` ``` ```` line (the reviewer's case) and the reverse; a shorter fence of the same character; a line that opens a fence with a language; a longer closing fence; spaces after and up to three before the marks; four spaces before them (the fence stays open); two marks (not a fence).
- **Core checks.** An item may be indented by up to three spaces. Nesting is read as Markdown reads it: an item that starts where the text of the check above it starts, or further in, is inside that check. So `- One.` then `  - a` is nested, while `10. Ten.` then `   - Eleven.` is two checks. Tests cover one, two and three spaces, four (not a list), uneven siblings, nesting under `-`, `1.` and an indented `1.`, two spaces after a mark, and that each item is measured against the one above it.
- **Header cells.** `` | `id` | `trigger` | `method` | `` is accepted, cell by cell; an unbalanced backtick or a doubled pair is not.
- **Stricter than Markdown, and the error now says so.** `## Never ##` and a tab after the hashes are still refused: the "is missing" and the "is not a section" errors both end with "a section's heading is two hashes, a space, the name, and nothing else on the line". A table without its outer pipes is still refused, with "a table row begins and ends with a pipe, as | id | trigger | method |" and the line at fault quoted. `CARD-FORMAT.md` states both forms, and a test checks that it does.

### TDD evidence for this round

**RED** — the new tests against the checker as it was (`7df0857`'s `card.mjs`):

```
not ok 13 - engine is own, a skill, any outside model, or a tool
not ok 27 - a code fence closes only on its own character, at least as long, with nothing after it
not ok 28 - a heading written another way is refused, and the error says how one is written
not ok 31 - a core check may be indented by up to three spaces, and a nested item is never one
not ok 32 - optional checks are a table of id, trigger and method
not ok 33 - a header cell of the optional checks may be written with or without backticks
not ok 34 - a row of the optional checks begins and ends with a pipe
# tests 47   # pass 39   # fail 7   # todo 1
```

Each failed for its rule: `skill:a:` was accepted; the `~~~` fence closed on a ```` ``` ```` line; no error named a form; an item one space in was not counted; a backticked header was refused; a row without its pipes went unreported. The duplicated-key samples (M17) passed at once: they pin behaviour the checker already had.

**GREEN** — `# tests 52   # pass 50   # fail 0   # todo 2`.

**The tests on the kit's own files** (M8, M13, M14, the stated forms, the two commands) pass against the cards as fixed, so I proved each on a scratch copy by changing what it guards: a card naming a missing script; a card naming a missing template (caught by the todo twin); a role left out of a summary; a role the format lacks added to one; every label made required; a provenance key dropped; the check command importing from the wrong place; the command taking a relative file; the count done by code point; a product name in a fixture, in the plugin manifest, in `package.json`; the backticks sentence removed from `CARD-FORMAT.md`; "reads it first" put back. **14 changes, 14 caught.**

### Hand mutation of the changed conditions

On a scratch copy, as before. **70 mutants over everything this round changed, 70 killed, each by at least one inline sample**: the engine pattern (seventeen, ten of them the skill's name), the heading and its two errors (seven), the fence (fifteen), the list item and its nesting (twelve), and the pipes, the row form, the header cells and their errors (nineteen). The first pass left two survivors:

| Found | Resolution |
|---|---|
| Nesting measured against the first check only, not the one above | Pinned: `10. One.` / `- Two.` / five items three spaces in is two checks |
| `` [^`]+ `` against `.+` inside the header cell's backticks | Unobservable (neither result is a column name). Simplified to one `replace` |

The 137 mutants of the first report were re-run against the new code: the **108** whose code is unchanged are still all killed; the other 29 touched lines this round rewrote and are replaced by the 70 above.

### Beyond the fix file

1. **A line of `## Optional checks` that holds a pipe and is not written as a row is refused, and a row must end with a pipe as well as begin with one.** The fix file asks that `CARD-FORMAT.md` state "a table row begins and ends with a pipe" as a form the checker requires, and that rows without leading pipes stay refused. Before, the checker took any line beginning with a pipe and ignored the rest, so a table whose header had its pipes and whose rows did not passed as a table with no rows, and a missing closing pipe was accepted. Now one rule covers both. Its cost: a sentence in that section cannot hold a bare `|` (it is written `\|`), and **`CARD-FORMAT.md` needed one sentence to say so, which is in the second commit, not the first.** Task 10's judges are the first cards this binds.
2. **Two tests run the commands the cards give**: the proposal check of the structure describer and the transcriber (from the kit's root, on a fixture, expecting `[]`), and the interface writer's count (a composed and a decomposed "Café", both 4). A card is followed literally, and a command no test runs is the same kind of unheld copy as M8's summary. They start `node` five times and add well under a second.
3. **Screen generator, step 4: "ask once more".** R121 says the maker draws the screen with the words exactly; the tool does not always obey. The step gives it one more attempt and then has the seat report every difference instead of mending the screen, which the card forbids elsewhere.

### Concerns

- **M7's line reference.** As said in the table: I took the two examples to be the dialog and the expansion.
- **The fences inside a judge's two sections.** A list item or a table line inside a code fence, within `## Core checks` or `## Optional checks`, is still read like any other line there (and a fenced line with a bare pipe is now refused in `## Optional checks`). No card has one; a judge that wants to show an example table should show it under `## Method`.
- **`visual-designer.md` is at 120 lines**, the bar. Any further line in it needs a cut.

---

## Fix report — after the re-review

One commit on `v2-pipeline`: `1a999e8 fix: fenced lines in a judge's checks are passed over, and three small findings`. Five files: `scripts/lib/card.mjs`, `tests/pool.test.mjs`, `pool/CARD-FORMAT.md`, `pool/makers/screen-generator.md`, `pool/makers/visual-designer.md`.

**Tests.** `node --test tests/pool.test.mjs` only, as ruled: **54 tests, 52 pass, 0 fail, 2 todo** (the index for Task 11; the twin for `templates/`, `skills/` and `reference/`).

### N1 — fenced lines in a judge's two sections, and a second list after a paragraph

- **Fences.** `sectionsOf` now keeps, for each section, only the lines outside a code fence, using the fence reader it already had. `## Core checks` and `## Optional checks` are read from those lines, so a fenced command, table or list is neither a row nor a check, and a pipe inside a fence is not at fault. The line that opens a fence is kept, so a section holding only a fence still "has text under it" and is then told what it lacks (no checks, or no table).
- **The list's own level.** `topItems` no longer measures every item against the first list. A paragraph that starts further out than the text of the check above it, after a blank line, ends the list; the next list is read at its own indentation. Three things do not end it, as in Markdown: a line that runs on from a check with no blank line before it; a paragraph that sits inside the check, where its text starts; a blank line, or two.
- **`CARD-FORMAT.md`**, in the written forms: "A line inside a code fence is never a heading, a core check or a table row", and, on the core-check line, "at its list's own level, not nested in another … A list that starts again after a paragraph is read at its own indentation." A test checks both sentences are there.
- **Inline samples, each failing before the fix.** The reviewer's four cases: a fenced `node scripts/shots.mjs … | head` under the optional checks (was refused by the bare-pipe rule); a fenced example table above the real one (was read as the header); one real check plus a fenced two-item list (passed as three); a second list after a paragraph, two spaces in (was one check). And around them: a fenced table alone is "needs a table"; six real checks and a fenced seventh are six; a fence inside a check's own text; a `~~~` fence; a line counts again once the fence closes; what is nested in the second list is still nested; the three things that do not end a list.

**RED**, the new tests against the checker of `d1f4e87`:

```
not ok 32 - a second list after a paragraph is read at its own indentation
     + 'body: "## Core checks" has 1 check; a judge has two to six, as a numbered or bulleted list'
not ok 33 - inside a judge's checks, a line in a code fence is neither a check nor a row
     expected one error, got: (none: the fenced list had been counted)
not ok 50 - pool/CARD-FORMAT.md lists what the checker allows, and nothing else
     did not match /A line inside a code fence is never a heading, a core check or a table row/
# tests 54   # pass 49   # fail 3   # todo 2
```

**GREEN:** `# tests 54   # pass 52   # fail 0   # todo 2`.

### N2 — the Look prompt

`screen-generator.md`, step 4, one sentence added: "In the prompt, give the approved items in order with their words, and name no component, layout, colour or typeface: the paint must be the tool's, not yours." The card is 116 lines.

### N3 — the path check

`tests/` is back in the live test (`a script, a kit file, a pool file or a test file named in the pool exists`). `skills/` and `reference/` join `templates/` in the twin, now named `a template, a skill or a reference file named in the pool exists (Task 12 makes templates/ live; Tasks 13 to 18, skills/ and reference/)`, with the same split in its `todo` text. The small test of the path finder covers the two lists. Proven on a scratch copy by having a card name a missing file under each folder: `tests/` and `scripts/` fail the live test; `templates/`, `skills/` and `reference/` fail the twin, which shows as `not ok … # TODO` and does not fail the run. With the format's two sentences removed in turn, that is **7 changes, 7 caught.**

### N4 — the visual designer's lens

The opening paragraph says it again: "Your lens is the `frontend-design` skill, or the one your brief names. Load it if it is installed. In a design system it shapes hierarchy and emphasis, not the palette. Without it, this card is enough." To keep the card at 120 lines the sentence lost "restraint" and "the typefaces"; the typeface is still in the card's Never ("Never choose a palette or a typeface inside a design system").

### Hand mutation of the changed conditions

On a scratch copy. **21 mutants, 21 killed, each by an inline sample**: what a section keeps (a fenced line kept; only fenced lines kept; the opening line dropped too; a heading inside a fence; a fence never entered or never left), and the list (the first item; every item counted; the edge of the text; measured from the indent or from the first item only; the paragraph that ends the list, with and without its blank line; a second blank line; a paragraph inside the check and at the edge of its text; nothing counting after a paragraph; the three ways of getting "after a blank line" wrong; the count).

The first pass left one survivor, and it was an equivalent, not a missing test: I had kept two lists for a section, every line and the unfenced ones, and "has text under it" gave the same answer on either, because the line that opens a fence is in both. So the section keeps one list now, the lines outside a fence, and the distinction is gone.

Earlier mutants, re-run against the new code: of round 1's 70, the **64** whose code is unchanged are still killed (the other six are rewritten above); of the first report's 137, the same **108** as before.

### Left as it is

- Inside a fence, in every section, nothing is read at all. A judge that wants to show an example list or table can now put it in a fence under its own checks; round 1's concern about that is closed.
- A fence that opens at the margin after a blank line ends a list, as a paragraph does, because its opening line is an ordinary line to the list reader. That is what Markdown does too. No sample pins it: the two ways of getting it wrong that I tried give the same count.
