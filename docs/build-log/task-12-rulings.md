# Task 12 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so. Stop reading
the brief at the line `## Phase C — the skills`: what follows it is not this task.

## Corrections to the brief's file list and tests

1. **`PICK.md` is not a package file** (ruling R67). Do not create
   `templates/package/04-structure/PICK.md`: a package copied whole would carry a pick beside its board,
   and `merge` refuses a board that has one. Create `templates/outputs/PICK.md` instead; the Structure
   skill writes it at the pick. It carries the line `Pick: <letter | none>` exactly as `scripts/merge.mjs`
   reads it (read the `open` verb before writing the template) and the founder's words under it.
2. **`01-context.md` has one heading per bullet of design § 4.1 (ten) plus `## Project sources`** (ruling
   R8). The brief says nine; the test asserts the four headings the brief names and at least ten in all.
3. **`07-handoff/HANDOFF.md` and `08-acceptance/REPORT.md` carry the stage header** (`stage`, `version: 1`,
   `status: draft`, `built-from`) like the seven stage outputs, because `stamp` cannot work without it;
   `## Carry` is optional for those two (ruling R5). The package walk stamps `handoff` on `HANDOFF.md`.
4. **`BRIEF-fresh.md`** names the things it withholds (the design system, the kit, sibling surfaces,
   today's screens) only inside `## What you are not given`; the test checks every other line (ruling R7).
5. **Every stage-output template writes `built-from: []`**, and under `## Carry` nothing that `stamp`
   would refuse: read `scripts/lib/carry.mjs` and `scripts/lib/state.mjs` for the grammar. If an
   instruction is needed there, the template puts it in an HTML comment or wherever the carry reader
   passes over it — prove with a test that a template stamped as it is, with one real entry added,
   is accepted, and that the instruction cannot be mistaken for an entry.
6. **`acceptance.json` passes `validateAcceptance`** (`scripts/accept.mjs`), not only the key list the
   brief gives: one sample check of type `visible`, against the fictional product, and the test asserts
   `validateAcceptance(template)` returns `[]`. `ACCEPTANCE.md` names the eight check types and their
   parameters as `scripts/inpage/accept-inpage.js` defines them (read its header), and says what each
   does not ask.
7. **`HANDOFF.md` names `IMPLEMENTER-GUIDE.md` as a file inside the handoff folder** (ruling R9): the
   Handoff skill copies it there in a later task. A template names only paths that exist when this task
   lands, or paths inside the package it belongs to.

## Things earlier tasks left for this one

8. **The data map and the dependencies have a home** (ruling R119): `05-detail/DETAIL.md` has, among its
   sections, `## Rules`, `## Data map` (a table: element id · what it shows · the row of the context's
   inventory it comes from) and `## Dependencies` (what the product cannot supply today), before
   `## Reviewed by the founder` and `## Carry`. `07-handoff/SPEC.md` carries the data map and the
   dependencies forward, as design § 13 says.
9. **The cards may now name their templates.** `tests/pool.test.mjs` has a test marked `todo` — every path
   a card names under `templates/`, `scripts/`, `kit/` or `pool/` exists. Make it live (remove the
   `todo`). Where a maker card's `## Output` describes in words a file that now has a template
   (`05-detail/states.md`, `strings.json`, `DETAIL.md`, `06-look/LOOK.md`), add the template's path to
   that sentence; change nothing else in a card.
10. **`project/PROFILE.md`:** every header key of the brief; `engines-on: []` by default, with a one-line
    instruction that entries are written in a card's own `engine` spelling (`model:openai`,
    `model:gemini`, `tool:stitch`) and that an outside model receives the brief, so it is off until the
    founder turns it on; `keys-file` empty by default, with the instruction that it is the path of a
    dotenv file **outside the repository** and that no key is ever written in the profile. The template
    must parse with `scripts/lib/frontmatter.mjs` as it stands — instructions that would break a flat
    header go in the body under a `## How to fill the header` section, not in the header.
11. **`03-cast.md`:** each stage's table has the columns the brief asks for, with `model` and `effort`
    headed as suggestions the founder may change; a seat whose card says `none` shows a dash.
12. **The three briefs** (`briefs/maker.md`, `judge.md`, `audience.md`) each carry, under
    `## Do not open` or just after it, one standing line: a seat that starts a browser stops only the one
    it started, through its own handle, and never stops a process by name or by pattern. (A sub-agent's
    probe once stopped another session's browsers; the rule travels with every brief.)
13. **`templates/people/PERSON-CARD.md`** has the header keys and sections Task 11 fixed
    (`scripts/lib/card.mjs`, `validatePerson`); the test fills the template's braces with sample values
    and asserts `validatePerson` returns `[]`, so the template cannot drift from the checker.
    `PROFILE-CARD.md` follows design § 8: the seven always-defined characteristics, each with its four
    fields; `## Specialties` with one example subsection; `## Optional characteristics`. Its example is a
    made-up profession of the fictional product's world (a front-desk coordinator), never a real
    project's.

## How the templates are written

14. **Braces hold instructions**, one line each, as version 1's templates did; an illustration is marked
    as one and uses only the fictional room-booking product. A template is a file a stage skill copies
    and fills, so everything in it is either structure to keep, an instruction in braces to replace, or
    an example to delete — and it says which.
15. **No template is longer than what it must hold.** A stage output is one to two screens when filled.
16. **Generic:** no product, person, profession or project rule. The product-name test now covers
    `templates/`.
17. **Read of the design:** § 4 (all of it — each stage's "Writes"), § 5 (sizes and routes), § 8, § 9
    (the ledger's shape), § 11, § 12 (the brief and the fresh brief), § 13, § 14, § 15, § 23. Never the
    whole plan.
18. **The package walk** (`tests/package.test.mjs`) uses the real CLI of `scripts/state.mjs` in a fresh
    folder under `tests/.tmp/`. If a template cannot be stamped as the brief describes because of a rule
    of `state` (a route that skips a stage for a `surface`, a stage whose artefact name differs), say so
    in your report and follow `state` — do not change `scripts/lib/state.mjs`.

## Added after Task 9's review

19. **The Structure brief carries the walkthrough format itself.** `scripts/describe.mjs` sends an outside
    model the brief and nothing else, and such a model cannot open `kit/KIT-CONTRACT.md`. So
    `04-structure/BRIEF.md` and `BRIEF-fresh.md` hold, under `## What to return`, the format whole enough
    for a reader with no file access: every proposal key, every role, every container and what each
    needs, the rules `validate` enforces that a writer can break (one primary action per screen, a label
    on an expansion, options on a choice, a list and a nav, unique screen titles), one small example, and
    the instruction to answer with one JSON object and nothing else. A test holds the three lists against
    `KEYS`, `ROLES` and `CONTAINERS` of `scripts/lib/walkthrough.mjs` in both directions, as
    `tests/pool.test.mjs` does for the two cards that summarise the format, and runs the example through
    `validate`.

## Added after Task 10's review

20. **`templates/outputs/LEDGER.md` must take what the eight judge cards return.** Read the `## Output`
    section of every card under `pool/judges/` before writing it. The template holds: the verdict as one
    of the seat's own three words (each card gives its own; the template does not fix the words) and the
    first fix; the findings table with the eight columns of design § 9, its severities *blocks · should ·
    note*, and no column or word that would have a judge "approve" or "pass" a design; `## Checks not
    run` (each with what was looked for and why it did not run); `## Not looked at`; `## On a re-read`
    (the judge reads cold first, then marks each earlier finding with one of the design's three marks: *fixed · partly · still present*); and the
    sections only some seats fill, each marked as such: `## Cannot tell` and `## Ranking` (the profile
    judge; the ranking with the size of each gap), `## Borrow list` (system fidelity, after a fresh pass).
    A test checks that every section name a judge card's Output mentions is in the template.
21. **The strings carry their why-lines** (ruling R126): `05-detail/strings.json` keeps the why-line in
    the `note` field of the brief's shape, and the judge brief template hands the strings with them.
22. **`build/STATES.md` names an account by its role, never its sign-in.** The template says, in its
    instruction line, that a state's "how to reach it" may name an address, a seed step, a network
    condition and an account by role with where its credentials are kept — and that no password, token
    or key is ever written in it.
23. **A profile's id is `profile.<name>`** (Task 11's person checker takes `profile` to be such an id or
    `none`): `templates/people/PROFILE-CARD.md` carries `id: profile.<name>` in its header, and the test
    that fills the person template uses a `profile` value of that form.
24. **`templates/outputs/TASK-READ.md` opens with the caveat exactly as the audience card has it.** A test
    reads the sentence beginning "A simulated person agrees too easily" out of
    `pool/audiences/task-reader.md` and asserts the template holds the same sentence, so the two cannot
    drift.
25. **A profile's "So the interface must" lines can be taken out by rule** (ruling R131: an audience is
    handed a profile's traits, never its criteria). In `templates/people/PROFILE-CARD.md` each
    characteristic's four fields are each one line or one block that begins with its fixed label —
    `What is true:`, `Who it does not hold for:`, `Evidence:`, `So the interface must:` — so the fourth
    can be removed mechanically. `templates/briefs/audience.md` hands the person and, where she has a
    profile, its **traits** (the profile copied with every `So the interface must:` field removed), and
    lists the profile itself under "Do not open". `templates/briefs/maker.md` and `judge.md` hand the
    profile whole. A test removes the fields from the template's example by that rule and asserts none
    is left.
