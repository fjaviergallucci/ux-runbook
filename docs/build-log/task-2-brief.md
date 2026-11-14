### Task 2: The state of a package

Implements § 5 (sizes and routes) and § 6 (state, carry lists, resuming, reopening).

**Files:**
- Create: `scripts/lib/state.mjs`, `scripts/state.mjs`
- Test: `tests/state.test.mjs`, fixtures built in the test under `tests/.tmp/`

**Interfaces:**
- Consumes: `parse`, `serialize` from Task 1.
- Produces (from `scripts/lib/state.mjs`):
  - `STAGES = ['frame','context','intent','cast','structure','detail','look','handoff','acceptance']`
  - `ARTEFACT = { frame:'00-frame.md', context:'01-context.md', intent:'02-intent.md', cast:'03-cast.md', structure:'04-structure/CHOSEN.md', detail:'05-detail/DETAIL.md', look:'06-look/LOOK.md', handoff:'07-handoff/HANDOFF.md', acceptance:'08-acceptance/REPORT.md' }`
  - `SIZES = ['correction','adjustment','surface','flow','system']` ·
    `FOUNDATIONS = ['no-system','new-surface','redesign','small-change']` ·
    `KINDS = ['working-surface','first-run','form','message','public-page']`
  - `routeFor(size): Record<stage, 'full'|'short'|'skipped'>`
  - `init(pkgDir, { design, kind, foundation, size, date }): void`
  - `stamp(pkgDir, stage, { words, date }): { version: number }`
  - `reopen(pkgDir, stage, { reason, date }): { version: number, stale: string[] }`
  - `resize(pkgDir, size): void`
  - `validate(pkgDir): { ok: boolean, problems: { stage: string, code: string, message: string }[] }`
  - `next(pkgDir): string | null`
  - `class StateError extends Error`
- The stage output header (flat frontmatter): `stage`, `version` (integer, starts at 1), `status`
  (`draft | awaiting | approved`), `approved` (date), `words` (the founder's words), `built-from`
  (`[stage@version, …]`).
- The carry list: the last section of a stage output, headed `## Carry`; each entry
  `- <stage>@<version>#<heading-slug>` or `- source:<path relative to the project>`. A heading's slug is
  its text lower-cased with every run of non-alphanumerics replaced by `-` and trimmed of `-`.
- `state.json`: `{ design, kind, foundation, size, route, reasons, stages: { <stage>: { status, version, approved, words, hash } }, question }`.
  Stage `status` is one of `not-started | in-work | awaiting | approved | skipped | stale`. `hash` is the
  SHA-256 of the artefact's body at the moment it was stamped.
- `STATE.md` is generated from `state.json` on every write and is never edited by hand.
- CLI: `node scripts/state.mjs <init|stamp|reopen|resize|validate|next|status> <package> [flags]`. Exit 0
  on success, 1 on a refusal or a problem found, 2 on bad usage.

- [ ] **Step 1: Write the failing tests.** Use a helper `pkg()` that creates a temp package and writes
  artefacts with given headers and bodies. The tests and their assertions:

| Test | Assertion |
|---|---|
| `routeFor('correction')` | `frame` and `detail` and `handoff` and `acceptance` are `'short'`; `context`, `intent`, `cast`, `structure`, `look` are `'skipped'` |
| `routeFor('adjustment')` | `structure` is `'skipped'`; `frame` is `'full'`; every other stage is `'short'` |
| `routeFor('surface')`, `'flow'`, `'system'` | every stage is `'full'` |
| `init` | writes `state.json` and `STATE.md`; skipped stages have status `skipped`; a second `init` throws `StateError` |
| `init` with kind `radiology-shell` | accepted (a project kind: any kebab-case string); kind `Radiology Shell` throws |
| `stamp` on a draft artefact with words | header becomes `status: approved`, `approved` is the date given; `state.json` stage is `approved` with a 64-character `hash` |
| `stamp` with empty words | throws `StateError` matching `/words/` |
| `stamp` when the artefact has no `## Carry` | throws for `frame`…`look`; does not throw for `handoff` and `acceptance` |
| `stamp` of `intent` built from `context@1` while context is at version 2 | throws `StateError` matching `/stale/` |
| `reopen('context')` after frame, context, intent are approved | context version is 2 and status `in-work`; `stale` equals `['intent']`; intent's status is `stale` |
| `resize` from `surface` to `adjustment` | throws `StateError` matching `/only moves up/`; `adjustment` → `flow` succeeds and un-skips `structure` |
| `validate` on a clean package | `{ ok: true, problems: [] }` |
| `validate`, carry entry `context@1#no-such-heading` | a problem with code `carry-unresolved` |
| `validate`, an approved artefact's body changed on disk | a problem with code `changed-since-approval` |
| `validate`, artefacts written with CRLF | same result as with LF (`ok: true`) |
| `validate`, a `source:` carry entry | accepted without resolving |
| `next` with frame and context approved | `'intent'`; with every routed stage approved, `null` |

- [ ] **Step 2: Run them.** `node --test tests/state.test.mjs` → FAIL.
- [ ] **Step 3: Implement `scripts/lib/state.mjs`.** `validate` problem codes, all of them:
  `missing-artefact`, `bad-header`, `stale-input`, `carry-unresolved`, `changed-since-approval`,
  `skip-without-reason`, `approved-without-words`. `STATE.md` shows: design, kind, foundation, size; one
  row per stage (status, version, approved, the artefact's path); the open question.
- [ ] **Step 4: Implement the CLI** in `scripts/state.mjs` over those functions; flags `--design`,
  `--kind`, `--foundation`, `--size`, `--words`, `--reason`, `--date` (defaults to today).
- [ ] **Step 5: Run them.** → PASS (17 tests).
- [ ] **Step 6: Commit.** `git commit -m "feat: package state — routes, stamping, reopening, validation"`.

