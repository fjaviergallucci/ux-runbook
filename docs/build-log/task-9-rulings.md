# Task 9 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

## Corrections to the brief's text

1. **The product-name test matches whole words** (ruling R3): `\bVerbato\b` case-insensitive and
   `\bVersa\b` case-sensitive. The brief's "case-insensitive" for both would fail on "conversation",
   "universal" and "vice versa". The test scans text files only (`.md`, `.mjs`, `.js`, `.cjs`, `.json`,
   `.css`, `.html`, `.txt`) and passes over a folder or file of its list that does not exist yet
   (`templates/` partly, `skills/`, `reference/`, `LESSONS.md` arrive in later tasks).
2. **A judge has two to six core checks** (ruling R4), not two to five: the design fixes six criteria for
   the professional profile judge, and the design is the authority.

## The card checker is a module, proven before the cards it will judge exist

3. **Ruling R113.** The rules of a card live in `scripts/lib/card.mjs`, not inside the test:
   `validateCard(text, { file }) → string[]` (empty when valid; each error says what and where), with the
   key list and the allowed values exported (`CARD_KEYS`, `SHELVES`, `MODELS`, `EFFORTS`,
   `LOADED_WITH`). `file` is the card's path relative to `pool/`, used to check that `id` matches the
   shelf folder and the file name. A project keeps cards of its own beside the kit's (design § 7), and
   they must be judged by the same rules. No CLI in this task.
   - `tests/pool.test.mjs` runs `validateCard` on every card under `pool/makers`, `pool/judges`,
     `pool/audiences`, and **also proves every rule on inline samples**: a good maker card, a good judge
     card, and one bad sample per rule (a missing key, an unknown key, a value outside each enumeration, an
     `id` that does not match its file, a stage not in `STAGES`, a size not in `SIZES`, a section missing,
     sections out of order, a judge with one core check, with seven, an optional-check row with an empty
     trigger, an optional-check table with the wrong columns, a `verified` that is not a date). No judge
     and no audience card exists until Tasks 10 and 11; the inline samples are how those rules are seen to
     bite now.
4. What `validateCard` checks, beyond the brief's list:
   - every header key is present, and no other key is;
   - `shelf` is one of `maker | judge | audience` and equals the folder (`makers/` → `maker`);
     `id` is `<shelf>.<file name without .md>`;
   - `sits-at` is a non-empty list, a subset of `STAGES` (import it from `scripts/lib/state.mjs`);
     `presets` is a list, a subset of `SIZES` (same module), and may be empty (a seat that sits nowhere by
     default);
   - `loaded-with` is `profile | person | none`;
   - `engine` is `own`, or `skill:<name>` (`[a-z0-9:_-]+`, a plugin's skill is `plugin:skill`), or
     `model:any`, or `tool:<name>` (`[a-z0-9-]+`). **`model:any` is the outside describer's value**: the
     card serves whichever provider the project's profile turns on (`engines-on` holds `model:openai` or
     `model:gemini`), and the provider is chosen at Cast. The brief's `model:<provider>` is a pattern, not
     a value;
   - `suggested-model` and `suggested-effort` hold one of the brief's values;
   - `verified` is a date written `YYYY-MM-DD` (today is 2026-11-14);
   - `job` and `cast-when` are non-empty, one line each; `reads` is a non-empty list; `never-reads` is a
     list and may be empty for any card (an empty list says nothing is hidden from the seat; the key is
     still required);
   - the body has the required `##` sections in order, each with text under it (`## Borrowed` may say
     "nothing"), and no other `##` section: a card that needs another section needs a change to the
     format first. A judge has `## Core checks` (a numbered or bulleted list of two to six items) and
     `## Optional checks` (a table whose header row is exactly `id`, `trigger`, `method`; every row has
     all three cells non-empty; the table may have no rows) before `## Method`; a maker or an audience
     has neither.
5. CRLF: `validateCard` accepts a card with CRLF line endings (a test proves it on one inline sample).

## The cards

6. Voice: plain, in the second person where it instructs, short sentences, no jargon the brief does not
   use. Read the two version-1 files the brief names for the register. A card is read by a fresh
   sub-agent that knows nothing else: it must be able to do the seat's job from the card and its brief
   alone.
7. **Generic.** No product, person, profession or rule of any project. Examples inside a card use the
   kit's fictional product (a room-booking tool for a small clinic's front desk). Where you port from a
   source the design's § 23 lists, the source is read-only — never edit anything outside this worktree —
   and what you take is rewritten generic; a source that carries a third-party licence keeps its
   attribution in `## Borrowed`. Read only the files § 23 names (read § 7, § 23 and § 24 of
   `docs/design/2026-11-13-pipeline-design.md`, and § 4.4–4.6 for what Structure, Detail and Look ask of
   their makers; nothing else of that document).
8. **`## Output` names a file only if it exists today** (ruling R9). The walkthrough format is in
   `kit/KIT-CONTRACT.md` and `scripts/lib/walkthrough.mjs`, with three examples in
   `tests/fixtures/proposals/` — the structure describer, the outside describer and the transcriber name
   `kit/KIT-CONTRACT.md` and say the proposal is checked with `validate`. The templates of the other
   makers arrive in Task 12: for those, `## Output` says in words what the maker returns and where it
   goes in the package (the folder: `05-detail/`, `06-look/`), and does not name a template file.
9. **Suggested model and effort** as the brief's last paragraph gives them. Every card's `verified` is
   today. The outside describer and the screen generator carry `none` / `none`.
10. `maker.outside-describer`: its Method is what the conductor does, not what a sub-agent thinks — the
    same context-only brief the structure describers get is sent with `scripts/describe.mjs`
    (`--provider`, `--model` from the profile's `openai-model` / `gemini-model`, `--brief`, `--out`,
    `--profile`); a valid answer is a proposal like any other; an answer that is not in the format leaves
    `<out>.raw.txt`, which a transcriber turns into the format; the script refuses unless the profile's
    `engines-on` lists the provider. The card never mentions a key.
11. `maker.screen-generator`: the tool's known behaviours are stated as dated observations (today), not as
    guarantees. The card works without the tool, as the brief says.
12. **Step 5** (the visual designer's engine): list the installed skills by reading folders, not by
    running anything that needs the network. Read `frontend-design` and each installed taste or motion
    skill far enough to say, in `## Borrowed`, in one line each, what it would lend and why it is or is
    not the default. Keep `skill:frontend-design` unless one clearly fits a product bound to a design
    system better. If the skill's installed name carries a plugin prefix, the `engine` value carries it
    too (`skill:<plugin>:<skill>`); say which you found.

## `pool/CARD-FORMAT.md` and `pool/MODELS.md`

13. `CARD-FORMAT.md` is the contract a person writing a project's own card reads: every key with its
    allowed values (the same lists `scripts/lib/card.mjs` exports — a test compares the two, so the
    document cannot drift from the checker), the body sections in order, the three engine rules, and
    that `engines-on` entries in a project's profile are written in the card's own `engine` spelling
    (`model:openai`, `model:gemini`, `tool:stitch`) (ruling R86).
14. `MODELS.md`: a line `Reviewed: 2026-11-14`, the four reasons in the kit's own words, the sentence that
    these are suggestions and nothing in the kit enforces them, and one table with a row per seat that
    exists today (the eight makers). Tasks 10 and 11 add their rows. A test checks that every card under
    `pool/` has a row and that the row's model and effort equal the card's header.

## Tests

15. `tests/pool.test.mjs`: the brief's list, the rulings above, and the index test as `todo` until
    Task 11. Use `node:test`'s own `todo` option so the suite stays green and says what waits.
16. Every rule has a test that fails without it. Hand-mutate `scripts/lib/card.mjs` before reporting and
    list any mutant you could not pin.

## Given after the implementer's first report

- **R118.** The transcriber writes a generated screen's `name`, `bet`, `cost`, `absent` and `hardest`
  from what the screens show, in the register of any other proposal, so the board stays blind; it
  records in the source-only `source` key which of them it read off the screens.
- **R119.** The interaction designer owns the data map (each element → where its content comes from, by
  the row of the context's inventory; what the product cannot supply is a dependency, never invented).
- Accepted as built: `skill:frontend-design:frontend-design` (this machine's plugin-prefixed name); the
  screen generator's `verified` is the day the card was written and the card says its behaviours come
  from earlier use; at Look the outside describer's answer is `<out>.raw.txt` (what the script does
  today); the table of names used in `reads` / `never-reads` with its test; the test pinning the eight
  makers' header values; the Direction paragraph in the visual designer card; files outside § 23 opened
  read-only for step 5.
