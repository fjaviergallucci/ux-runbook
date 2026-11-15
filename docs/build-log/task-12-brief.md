### Task 12: The templates

Implements the outputs of § 4, § 8 (profile and person), § 9 (ledger), § 11, § 13, § 14, § 15.

**Files:**
- Create under `templates/`:
  - `package/00-frame.md`, `01-context.md`, `02-intent.md`, `03-cast.md`, `DECISIONS.md`
  - `package/04-structure/BRIEF.md`, `BRIEF-fresh.md`, `CHOSEN.md`, `PICK.md`
  - `package/05-detail/DETAIL.md`, `states.md`, `strings.json`
  - `package/06-look/LOOK.md`
  - `package/07-handoff/HANDOFF.md`, `SPEC.md`, `PARTS.md`, `ACCEPTANCE.md`, `acceptance.json`,
    `DECISIONS.md`, `COVERAGE.md`
  - `package/build/BUILD.md`, `STATES.md`, `DEVIATIONS.md`
  - `package/08-acceptance/REPORT.md`, `FIXES.md`
  - `project/PROFILE.md`, `project/LESSONS.md`
  - `people/PROFILE-CARD.md`, `people/PERSON-CARD.md`
  - `briefs/maker.md`, `briefs/judge.md`, `briefs/audience.md`
  - `outputs/LEDGER.md`, `outputs/TASK-READ.md` (`outputs/decision.json` exists from Task 6)
- Test: `tests/templates.test.mjs`, `tests/package.test.mjs`

**Interfaces:**
- Consumes: the state header and carry grammar (Task 2); `validateDecision` (Task 6).
- Produces — the project profile's header keys, read by skills and by `describe`: `product`, `packages`
  (default `design`), `kit` (default `design/kit`), `tokens`, `components`, `facts`, `languages` (list),
  `strings-format`, `browser-check`, `decisions-log`, `pinned` (list), `banned` (list), `engines-on`
  (list), `openai-model`, `gemini-model`, `keys-file`. Body sections: `## Kinds this project adds` ·
  `## Standing rules` · `## How a browser check is run here` · `## Design system`.
- `strings.json`: `{ "<key>": { "<language>": string, …, "max": number | null, "where": string, "note": string } }`.

- [ ] **Step 1: Write the failing tests.**

| Test | Assertion |
|---|---|
| the seven stage-output templates (`00`–`03`, `CHOSEN`, `DETAIL`, `LOOK`) | header has `stage`, `version: 1`, `status: draft`, `built-from`; the body's last section is `## Carry`; a `## Reviewed by the founder` section precedes it |
| `01-context.md` | has the nine headings of § 4.1, among them `## What the product can show and do`, `## The angles considered`, `## The founder's own words`, `## Project sources` |
| `02-intent.md` | has `## The person in the moment`, `## The one job`, `## Success criteria`, `## Tasks for the audience`, `## States` with the ten rows, `## The measure` |
| `03-cast.md` | has one table per stage from structure to acceptance, each with `model` and `effort` columns headed as suggestions, a `## Fresh pass` section with a line for Structure and a line for Look, and `## Cost` |
| `BRIEF.md` and `BRIEF-fresh.md` | both have `## The person`, `## The job`, `## The tasks`, `## What the product can show and do`, `## What to return`; `BRIEF-fresh.md` has no heading or line naming the design system, the kit, sibling surfaces or today's screens, and says so in a `## What you are not given` section |
| `HANDOFF.md` | has `## Context`, `## Task`, `## Done when`, `## Verify`, `## Constraints`, `## Slices`, `## Out of scope`, `## Must not change`, `## Left to the builder`, `## What you write back`, and names `BUILD.md`, `STATES.md`, `DEVIATIONS.md` |
| `PROFILE-CARD.md` | has the seven always-defined characteristics of § 8 as headings, each followed by the four fields; a `## Specialties` section with one example subsection; an `## Optional characteristics` list |
| `PERSON-CARD.md` | has the person header and sections fixed in Task 11 |
| `LEDGER.md` | has the top line (verdict, first fix), the findings table with the eight columns of § 9, `## Checks not run`, `## Not looked at`, `## On a re-read` |
| `TASK-READ.md` | opens with the caveat; has the six answers per task and `## Ranking` |
| `briefs/judge.md`, `audience.md`, `maker.md` | each opens with a line telling the agent to read its card first by absolute path; each has `## Read, in this order` and `## Do not open`; `audience.md` lists the intent under "Do not open" |
| `project/PROFILE.md` | parses; has every header key above |
| `outputs/decision.json` | `validateDecision` returns `[]` |
| `acceptance.json` template | parses and its one sample check has `id`, `criterion`, `state`, `page`, `width`, `type`, `target` |
| package walk (`tests/package.test.mjs`) | copy `templates/package` to a temp dir and `init` it as a `surface`; for each stage from `frame` to `handoff`, in order, the test sets `built-from` to the previous stage at version 1 (empty for `frame`), puts one entry `- source:README.md` under `## Carry`, and stamps with words; every stamp succeeds and `validate` returns `ok: true` |

- [ ] **Step 2: Run them.** → FAIL.
- [ ] **Step 3: Write the templates.** Each field carries a one-line instruction in braces, as version 1's
  templates did (`git show master:templates/SURFACE-BRIEF.md`). Port the ten-state table and the success
  criteria test from `master:phases/1-DISCOVERY.md`; the decision entry shape from
  `master:templates/DESIGN-DECISIONS.md`. Illustrations use the fictional room-booking product only.
- [ ] **Step 4: Run the tests.** → PASS. Then `npm test` → all green. **Phase B ends here.**
- [ ] **Step 5: Commit.** `git commit -m "feat: templates for every package file, the profile, the person, the briefs and the reports"`.

---

## Phase C — the skills

Every skill is `skills/<name>/SKILL.md`, at most 200 lines, with longer material in `references/` beside
it. A stage skill has these sections in this order: `## Question` · `## Reads` · `## Writes` · `## Steps` ·
`## Gate` · `## Never`. Every skill says, in its first lines, that the kit's root is two directories above
its own base directory, and that scripts are run as `node <kit root>/scripts/<name>.mjs`.

Sub-agents are launched with the Agent tool, type `general-purpose`, from the project's root directory
(a sub-agent launched from a subfolder cannot load the project's skills), with a brief built from
`templates/briefs/`.

