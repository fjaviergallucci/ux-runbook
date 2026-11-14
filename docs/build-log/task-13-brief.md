### Task 13: The skill tests and the conductor

Implements § 3, § 5, § 6, § 12 (blind rules, fresh pass), § 14.

**Files:**
- Create: `skills/design/SKILL.md`, `skills/design/references/loop.md`, `routes.md`, `blind.md`,
  `fresh-pass.md`, `lessons.md`
- Test: `tests/skills.test.mjs`

**Interfaces:**
- Produces — skill names and descriptions, exact:

| Skill | `description` |
|---|---|
| `design` | Use when the user wants an interface designed, redesigned, adjusted or corrected (a screen, a flow, a page, a component), wants to resume or check a design package, or names a stage of the interface design pipeline. Start here: it holds the order of the stages, the state and the gates. |
| `setup` | Use when an interface design is about to start in a project that has no design profile, or when the user asks to set a project up for the interface design pipeline. |
| `frame` | Use when the interface design pipeline reaches Frame: a new design request must be classified by kind, foundation and size, and its route chosen. |
| `context` | Use when the interface design pipeline reaches Context: the facts a design must be true to are gathered and corrected by the founder before anyone has an idea. |
| `intent` | Use when the interface design pipeline reaches Intent: the person, the job, the success criteria, the tasks and the states of a surface are written from the corrected context. |
| `cast` | Use when the interface design pipeline reaches Cast: the makers, the judges with their checks, the audiences and any fresh pass are chosen for one design. |
| `structure` | Use when the interface design pipeline reaches Structure: several ways of solving the problem are proposed blind, drawn in one shared kit and put in front of the founder to pick. |
| `detail` | Use when the interface design pipeline reaches Detail: the chosen structure is completed in every state, rule and string, as a clickable prototype. |
| `look` | Use when the interface design pipeline reaches Look: the finished appearance is designed on the project's tokens, or a visual direction is chosen where no design system exists. |
| `handoff` | Use when the interface design pipeline reaches Handoff: an approved design is packed into one folder another session can build from without asking. |
| `acceptance` | Use when a design handed off by the interface design pipeline has been built and must be checked against what was approved. |

- [ ] **Step 1: Write the failing tests** for all eleven skills (later tasks make them pass one by one;
  mark a skill's tests `todo` until its task): `SKILL.md` exists; its header has `name` equal to the
  folder name and the `description` in the table above, verbatim; it is at most 200 lines; a stage skill
  has the six sections in order; every path it mentions that starts with `scripts/`, `pool/`,
  `templates/`, `kit/` or `reference/` exists; it contains the sentence about the kit's root; none
  contains `Verbato` or `Versa`.
- [ ] **Step 2: Run them.** → FAIL for `design`, `todo` for the rest.
- [ ] **Step 3: Write `skills/design/SKILL.md`**, sections `## The order` · `## Before a stage` ·
  `## The loop` · `## Resuming` · `## Never`:
  - the nine stages in order with the skill to invoke for each (`ux:frame` … `ux:acceptance`), and
    `ux:setup` first when the project has no profile;
  - before any stage: `node scripts/state.mjs validate <package>` and `next`; a stale or changed artefact
    is reported to the founder before anything else;
  - the nine steps of the loop (§ 6), pointing to `references/loop.md` for the long form;
  - the three rules of § 3, stated as rules for the session: the chat is not an input; what the founder
    says is written into the artefact before it counts; a stage is run or the route says why it is not;
  - the Never list: decide for the founder · shortlist, detail or draw finished before the gate that
    precedes it · let one agent make and judge · ask more than one question on a page · open the sealed
    map before `PICK.md` exists · put a key or a key file's path on a command line · read `work/` as an
    input.
- [ ] **Step 4: Write the five references.** `loop.md`: the loop in full, with the one fix round and one
  re-read rule and the identity line; and that each seat is launched on the model and effort the cast
  sheet names when it names one — suggestions the founder may change at Cast; a seat with none runs on
  the session's model. `routes.md`: the kind, foundation and size tables of § 5, the route
  per size, "the size only moves up", and the correction rule (the same session may apply it after the
  nod, leaving a one-paragraph record and a before-and-after picture). `blind.md`: the table of § 12 as
  rules, the brief's "context, never the design" with the list of what a brief may not contain (component
  names, layout words, named visual styles, colours and fonts, the session's own idea), and the order
  brief → founder reads it → makers → merge → render → shots → readers → decision page → pick → `PICK.md`
  → the map may be opened. `fresh-pass.md`: § 12's fresh pass in full, with the three outcomes.
  `lessons.md`: § 14 — the two files, the entry's shape, the line recording which seats' findings changed
  a decision and the model each ran on.
- [ ] **Step 5: Run the tests.** → PASS for `design`.
- [ ] **Step 6: Commit.** `git commit -m "feat: the conductor skill and the tests every skill must pass"`.

