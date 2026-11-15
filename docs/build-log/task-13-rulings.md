# Task 13 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

## The tests every skill must pass (`tests/skills.test.mjs`)

1. **The product-name test matches whole words** (ruling R3): `\bVerbato\b` case-insensitive and
   `\bVersa\b` case-sensitive, over every file under `skills/`.
2. **A description is written in double quotes.** Every description in the brief's table holds a colon
   followed by a space, which a YAML reader takes for a nested mapping unless the value is quoted — and
   Claude Code reads a skill's header as YAML. So each `SKILL.md` writes `description: "…"`, the test
   asserts the raw line is quoted, and the parsed value (the kit's own `scripts/lib/frontmatter.mjs`
   strips the quotes) equals the brief's text verbatim. No description may hold a double quote.
3. **A skill names only paths that exist when its task lands** (ruling R9). The path test covers every
   path a `SKILL.md` or a file under its `references/` mentions that starts with `scripts/`, `pool/`,
   `templates/`, `kit/`, `reference/` or `skills/`. Nothing under `reference/` exists until Task 18, so the
   conductor does not name `reference/…` yet.
4. **Per-skill `todo`.** The tests for the ten skills that later tasks write are marked with
   `node:test`'s own `todo` option, each named with its task, so the suite stays green and says what
   waits. The rules themselves are functions proven now on inline samples (a good stage skill and one bad
   sample per rule: a wrong name, a description that differs by one character, an unquoted description,
   201 lines, a section missing, sections out of order, a path that does not exist, the kit-root sentence
   missing), as Task 9 did for cards — a rule written only as a loop over folders that do not exist yet
   proves nothing today.
5. A stage skill's six sections are `## Question` · `## Reads` · `## Writes` · `## Steps` · `## Gate` ·
   `## Never`, in that order; other `##` sections are allowed after `## Never` only when the skill's own
   task asks for one. The conductor (`design`) and `setup` are not stage skills and have their own
   sections (the brief gives the conductor's).
6. The "kit root" sentence, fixed here so every later skill carries the same words and the test can
   look for them: **"The kit's root is two directories above this skill's own folder; run a script as
   `node <kit root>/scripts/<name>.mjs`."**

## The conductor

7. **Paths the conductor and its references must get right** (they changed while the scripts were built):
   - the sealed map is `04-structure/MAP.sealed.json` and the pick is `04-structure/PICK.md` — both
     **beside** the board folder `04-structure/board/`, never inside it; `scripts/merge.mjs` writes the
     map there and `open` reads the line `Pick: <letter | none>` from the pick;
   - judges and audiences are handed the **board folder only**, never its parent;
   - nothing but the letters' files, the drawn pages and the pictures lives in the board: a graft or a
     variant is never saved there as a one-letter `.json`.
   Read `scripts/merge.mjs` (`--help` and the header) and `kit/KIT-CONTRACT.md` before writing
   `blind.md`, and give the commands as the scripts take them.
8. **Model and effort are suggestions** (design § 7). `loop.md` says: a seat is started on the model and
   the effort its line of the approved cast sheet names; the cast sheet is the founder's (he may have
   changed any of them at Cast); a seat whose line shows a dash runs on the session's model. Nothing in
   the conductor enforces a model, and it says so.
9. **A shared machine.** `loop.md` carries two standing rules for every seat that may start a browser:
   the seat stops only a browser it started itself, through its own handle, and never stops a process by
   name or by pattern; and the conductor never has more than three browser-driving seats or scripts
   running at once. (A sub-agent's probe once stopped another session's browsers. The brief templates
   carry the first rule too — `templates/briefs/`.)
10. **Sub-agents** are started with the Agent tool, type `general-purpose`, from the project's root
    directory, each from a brief built from `templates/briefs/maker.md`, `judge.md` or `audience.md`,
    which names the seat's card by absolute path. The conductor never pastes a card or an artefact into
    a brief: it names files.
11. **Keys.** The Never list's line stands as the brief gives it: never put a key or a key file's path on
    a command line. `scripts/describe.mjs` finds the key itself; the conductor passes `--profile` and
    nothing about keys, and never passes `--endpoint` (the script accepts only a local stand-in there).
12. **The founder's questions.** One question about one thing at a time; a decision is put on one page
    built with `scripts/page.mjs` from a `decision.json` (`templates/outputs/decision.json`), and the
    page's question is the only question on it. `loop.md` gives the command as the script takes it.
13. **Resuming** rests on the package's state alone: `node <kit root>/scripts/state.mjs validate <package>`
    and `next <package>`; the chat is never an input. Read `scripts/state.mjs`'s header and `--help` for
    the verbs (`init`, `begin`, `await`, `stamp`, `reopen`, `resize`, `route`, `validate`, `next`,
    `status`, `slug`) and give each command as the script takes it.

## Writing

14. Plain, short, in the second person; a skill is read by the session that will conduct a design, at the
    moment it must act. `SKILL.md` at most 200 lines; the long form lives in `references/`. Generic: no
    product, person, profession or project rule; examples use the fictional room-booking product.
15. **Read of the design:** § 2, § 3, § 5, § 6, § 12, § 14, and § 4's opening paragraph and stage list
    (not every stage's detail). Never the whole plan. Read `pool/CARD-FORMAT.md`,
    `templates/briefs/*.md`, `templates/package/03-cast.md` and `templates/package/04-structure/BRIEF.md`
    so that what the conductor says matches what the cards and templates say.
16. **Several ledgers, one stage.** Each judge is blind to the others' ledgers (and, where two profile
    judges sit, to each other's). `loop.md` says what the conductor does with them: it lays the findings
    side by side for the founder, states where two seats disagree in their own words, and never averages
    or settles a disagreement itself.
17. **An audience is handed a profile's traits, never the profile** (ruling R131). `loop.md` says how the
    conductor builds an audience's brief: the person, and where she has a profile a copy of it with every
    `So the interface must:` field removed, written beside the brief; the profile itself is listed under
    "Do not open". Makers and judges are handed the profile whole.
