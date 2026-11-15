# Interface Design Pipeline Kit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Build version 2 of this kit: a Claude Code plugin that runs interface design as a nine-stage
pipeline with makers, judges and audiences chosen per design, ending in a handoff folder another session
can build from.

**Architecture:** Three layers. *Scripts* (Node, no model) do everything mechanical: the state file, the
blind merge, drawing proposals in the shared kit, screenshots, the decision page, acceptance checks, calls
to outside models. *Plain files* carry opinion and shape: the pool's cards and the templates. *Skills*
carry procedure: a conductor, a once-per-project setup, and one skill per stage. Skills find the scripts,
cards and templates two directories above their own base directory.

**Tech Stack:** Node ≥ 20 (ES modules, `node:test`), one dependency (`playwright-core`, driving the
machine's own Chrome), Markdown, HTML and CSS. Claude Code plugin format (`.claude-plugin/`), validated
with `claude plugin validate`, evaluated with `claude plugin eval`.

**Spec:** `docs/design/2026-11-13-pipeline-design.md` (approved 2026-11-13). Every task implements named
sections of it; read those sections before the task. § numbers below refer to it.

**One plan, three phases.** Phase A (Tasks 0–8) is the scripts and formats; Phase B (Tasks 9–12) the pool
and templates; Phase C (Tasks 13–20) the skills, the evaluation suite and a dry run. Each phase ends with
`npm test` green.

## Global Constraints

- **Where the work happens:** a git worktree at `/mnt/data/Downloads/Proyectos/ux-runbook-v2`, branch
  `v2-pipeline`, cut from `master`. `master` and the checkout at `/mnt/data/Downloads/Proyectos/ux-runbook`
  are never modified after Task 0. Commit per task on the branch. **Never push, never merge, never tag:**
  those wait for the proving run and the founder (§ 17, § 19).
- **Generic:** no product's name, people or rules anywhere in the kit outside `docs/` (§ 18). The test in
  Task 9 enforces it for the words `Verbato` and `Versa`.
- **Claude Code only** (§ 2). Skills are namespaced by the plugin name `ux`.
- **Line endings:** LF in every file written (`.gitattributes` already pins it). Every script that reads a
  file accepts CRLF.
- **Frontmatter is flat:** `key: value`, lists inline as `[a, b]`, nothing nested. This holds for cards,
  stage outputs and the project profile, so one small parser serves all.
- **Dependencies:** `playwright-core` only. No YAML library, no test framework beyond `node:test`.
- **Secrets:** a key is read inside a script, from the environment or from the file the project profile
  names; it is never an argument, never printed, never written to an output; an HTTP error prints its
  status code and nothing of its body.
- **Browser:** headless, launched and closed by the script, `reducedMotion: 'reduce'` set explicitly on
  every context (§ 18). Chrome's path: `--chrome`, else `UX_CHROME`, else the first that exists of
  `/usr/bin/google-chrome`, `/usr/bin/chromium`, `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
  `C:/Program Files/Google/Chrome/Application/chrome.exe`.
- **One question:** a decision page with more than one question does not build.
- **Stable ids:** the attribute is `data-ux`.
- **Evaluations never leave the machine:** every `claude plugin eval` run passes `--no-publish`.
- **Network on this machine:** it has no IPv6 route. Run `npm` as
  `NODE_OPTIONS=--dns-result-order=ipv4first npm …`; scripts that call out set
  `dns.setDefaultResultOrder('ipv4first')`.
- **Source material** to port and make generic is listed in § 23. Text ported from a file that carries a
  third-party licence keeps its attribution in the card's `## Borrowed` section.

## Review Focus

Inputs the design implies and that will reach this software. Each has a test in the task that owns it.

1. **A file with CRLF line endings** (a Windows checkout of a project). Headers, carry lists and cards must
   parse identically. → Tasks 1, 2.
2. **An approved artefact edited by hand afterwards**, with no reopen. `validate` must report it as changed
   since approval, not pass. → Task 2.
3. **Text that is not plain ASCII, or is markup:** Spanish accents, an emoji, a string containing
   `<script>`. Rendered pages must show it as text and keep it intact. → Tasks 4, 6.
4. **A path with a space in it** (a project folder named with two words). Scripts that open pages must
   still open them. → Tasks 5, 7.
5. **A check that names an id which is missing, or present twice.** The run must report that check as
   failed with the reason, and continue. → Task 7.

## File Structure

```
.claude-plugin/plugin.json, marketplace.json
package.json  .gitignore  README.md  LESSONS.md
scripts/
  lib/frontmatter.mjs  lib/state.mjs  lib/walkthrough.mjs  lib/merge.mjs  lib/chrome.mjs
  state.mjs  merge.mjs  render.mjs  shots.mjs  page.mjs  accept.mjs  describe.mjs
  inpage/accept-inpage.js
kit/KIT-CONTRACT.md  kit/grey/kit.css  kit/grey/parts.html
pool/CARD-FORMAT.md  pool/INDEX.md
pool/makers/*.md (8)  pool/judges/*.md (8)  pool/audiences/task-reader.md  pool/persons/*.md (5)
templates/package/…  templates/project/…  templates/people/…  templates/briefs/…  templates/outputs/…
skills/design/  skills/setup/  skills/frame/ … skills/acceptance/      (SKILL.md each; references/ where named)
reference/IMPLEMENTER-GUIDE.md  reference/ANTI-PATTERNS.md
evals/<case>/…
tests/*.test.mjs  tests/fixtures/…  tests/dryrun/…
docs/design/…  docs/plans/…
```

---

## Phase A — scripts and formats

### Task 0: The branch, the worktree, the skeleton

**Files:**
- Create: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json`, `.gitignore`
- Delete (on the branch only): `RUNBOOK.md`, `phases/`, `setup/`, `templates/`, `reference/`
- Move in: `docs/design/2026-11-13-pipeline-design.md`, `docs/plans/2026-11-13-PIPELINE-KIT-PLAN.md`
- Test: `tests/skeleton.test.mjs`

**Interfaces:**
- Produces: the worktree path and branch every later task works in; `npm test` as the test command.

- [ ] **Step 1: Create the worktree.** Use superpowers:using-git-worktrees. From
  `/mnt/data/Downloads/Proyectos/ux-runbook`: `git worktree add ../ux-runbook-v2 -b v2-pipeline master`.
- [ ] **Step 2: Bring the two documents across.** They are untracked files in the main checkout. Copy
  `docs/design/` and `docs/plans/` into the worktree, then delete the untracked originals from the main
  checkout (left there, they would block the later merge). Run `git -C ../ux-runbook status --short` in
  the main checkout. Expected: empty.
- [ ] **Step 3: Clear the version 1 files from the branch.** `git rm -r RUNBOOK.md phases setup templates reference`.
  Their text stays readable as `git show master:<path>`; later tasks port from there. Keep `LICENSE`,
  `.gitattributes`, `README.md`.
- [ ] **Step 4: Write the failing test** `tests/skeleton.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

test('plugin manifest names the plugin ux', () => {
  const m = read('.claude-plugin/plugin.json');
  assert.equal(m.name, 'ux');
  assert.match(m.version, /^2\./);
  assert.ok(m.description.length > 20);
});

test('marketplace lists ux from the repository root', () => {
  const m = read('.claude-plugin/marketplace.json');
  assert.equal(m.name, 'ux-runbook');
  assert.deepEqual(m.plugins.map(p => [p.name, p.source]), [['ux', './']]);
});

test('package runs on node 20 with one dependency', () => {
  const p = read('package.json');
  assert.equal(p.type, 'module');
  assert.deepEqual(Object.keys(p.dependencies), ['playwright-core']);
  assert.equal(p.scripts.test, 'node --test tests/*.test.mjs');
});
```

- [ ] **Step 5: Run it.** `node --test tests/*.test.mjs` → FAIL (files missing).
- [ ] **Step 6: Write the four files.** `plugin.json`: `name` `ux`, `version` `2.0.0-dev`, `license`
  `MIT`, `author.name` from `git config user.name` (no email), `description`: "An interface design
  pipeline for UX and UI: staged, with makers, judges and audiences chosen per design, ending in a handoff
  another session can build from." `marketplace.json`: `name` `ux-runbook`, the same owner name, one
  plugin `{name: "ux", source: "./", version, description}`. `package.json`: `private: true`,
  `type: "module"`, `engines.node: ">=20"`, `scripts.test: "node --test tests/*.test.mjs"`, `dependencies: {"playwright-core": "^1.48.0"}`.
  `.gitignore`: `node_modules/`, `evals/results/`, `tests/.tmp/`.
- [ ] **Step 7: Install.** `NODE_OPTIONS=--dns-result-order=ipv4first npm install`. Expected: exits 0,
  `node_modules/playwright-core` exists.
- [ ] **Step 8: Run the test.** `npm test` → PASS (3 tests).
- [ ] **Step 9: Validate the manifests.** `claude plugin validate . --strict` → exit 0.
- [ ] **Step 10: Commit.** `git add -A && git commit -m "chore: start version 2 on a clean tree with the plugin skeleton"`.

### Task 1: The flat frontmatter library

**Files:**
- Create: `scripts/lib/frontmatter.mjs`
- Test: `tests/frontmatter.test.mjs`

**Interfaces:**
- Produces: `parse(text: string): { data: Record<string, string | number | string[]>, body: string }` ·
  `serialize(data, body): string` · `class FrontmatterError extends Error` (its message names the line).

- [ ] **Step 1: Write the failing tests:**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, serialize, FrontmatterError } from '../scripts/lib/frontmatter.mjs';

const doc = '---\nstage: intent\nversion: 2\nbuilt-from: [frame@1, context@3]\nwords: "sí, continúa"\n---\n# Title\n\nBody.\n';

test('parses scalars, integers, inline lists and quoted strings', () => {
  const { data, body } = parse(doc);
  assert.deepEqual(data, { stage: 'intent', version: 2, 'built-from': ['frame@1', 'context@3'], words: 'sí, continúa' });
  assert.equal(body, '# Title\n\nBody.\n');
});

test('round-trips', () => {
  const { data, body } = parse(doc);
  assert.deepEqual(parse(serialize(data, body)), { data, body });
});

test('a file with no frontmatter is all body', () => {
  assert.deepEqual(parse('# Only\n'), { data: {}, body: '# Only\n' });
});

test('CRLF input parses the same as LF', () => {
  assert.deepEqual(parse(doc.replace(/\n/g, '\r\n')), parse(doc));
});

test('nested values are refused, naming the line', () => {
  assert.throws(() => parse('---\nroute:\n  frame: full\n---\n'), e => e instanceof FrontmatterError && /line 2/.test(e.message));
});

test('an empty list parses as an empty array', () => {
  assert.deepEqual(parse('---\ncarry: []\n---\n').data, { carry: [] });
});
```

- [ ] **Step 2: Run them.** `node --test tests/frontmatter.test.mjs` → FAIL (module not found).
- [ ] **Step 3: Implement the three exports.** Keys match `^[a-z][a-z0-9-]*$`. A value of digits only is
  a number; `[…]` is a list split on commas with each item trimmed and unquoted; a double-quoted value is
  unquoted; anything else is the trimmed string. `serialize` quotes a string that contains `:`, `#`, `[`
  or a comma, and writes LF.
- [ ] **Step 4: Run them.** → PASS (6 tests).
- [ ] **Step 5: Commit.** `git commit -am "feat: flat frontmatter parser shared by cards, stage outputs and the profile"`
  (add the new files first).

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

### Task 3: The walkthrough format and the grey kit

Implements § 4.4 (the strict format) and § 12 (the shared kit).

**Files:**
- Create: `scripts/lib/walkthrough.mjs`, `kit/KIT-CONTRACT.md`, `kit/grey/kit.css`, `kit/grey/parts.html`
- Create: `tests/fixtures/proposals/unified-list.json`, `free-first.json`, `calendar.json`
- Test: `tests/walkthrough.test.mjs`

**Interfaces:**
- Produces: `ROLES = ['heading','text','choice','input','action','list','status','media','link','nav']` ·
  `CONTAINERS = ['region','group','expansion']` · `validate(proposal): string[]` (empty when valid; each
  error names the path, e.g. `screens[1].items[0]: unknown role "card"`).
- A proposal:

```
{ "name": string, "bet": string, "cost": string, "absent": string[], "hardest": string, "firstIdea": string,
  "screens": [ { "id": kebab, "title": string, "container": "screen" | "dialog", "over"?: screen id,
                 "note"?: string, "items": Item[] } ] }
Item = { "role": ROLE, "text": string, "id"?: kebab, "note"?: string, "primary"?: boolean, "options"?: string[] }
     | { "container": CONTAINER, "label"?: string, "open"?: boolean, "items": Item[] }
```

  Extra top-level keys `author`, `engine`, `track`, `model`, `source` are allowed (the merge strips them).
- The kit contract — the class names a project kit must also style: `ux-frame`, `ux-screen`, `ux-dialog`,
  `ux-region`, `ux-group`, `ux-expansion`, and `ux-<role>` for each role; `ux-action.is-primary`;
  `ux-note` for a designer's note.

- [ ] **Step 1: Write the three fixtures.** A fictional room-booking surface, "today", for a front-desk
  worker who asks "is anything free right now?" (the example version 1 used; read
  `git show master:reference/EXAMPLE/surfaces/today.md`). Three structures that differ in kind: one
  unified list; free rooms first in a leading region; a calendar grid. Two screens each, real words,
  `"track": "system"`.
- [ ] **Step 2: Write the failing tests:** each fixture validates to `[]`; an item with role `card` gives
  one error naming its path; a screen with `container: "sheet"` gives an error; a `dialog` whose `over`
  names no screen gives an error; a proposal with no `bet` gives an error; a nested
  `group → expansion → item` validates; `primary: true` on a role other than `action` gives an error.
- [ ] **Step 3: Run them.** → FAIL.
- [ ] **Step 4: Implement `validate`.**
- [ ] **Step 5: Write the grey kit.** `kit.css`: greys only, one system font stack, no colour beyond a
  single mid-grey for the primary action, a light and a dark set under `prefers-color-scheme`, no motion.
  `parts.html`: one specimen of every class in the contract, labelled. `KIT-CONTRACT.md`: the class list
  above, one line each on what it must convey, and the rule that a project kit restyles these classes on
  the project's token file and adds none.
- [ ] **Step 6: Run the tests.** → PASS (7 tests).
- [ ] **Step 7: Commit.** `git commit -m "feat: the walkthrough format and the grey kit"`.

### Task 4: Drawing a proposal

Implements § 4.4 (`render`) and § 16.

**Files:**
- Create: `scripts/render.mjs`
- Test: `tests/render.test.mjs`

**Interfaces:**
- Consumes: `validate` from Task 3.
- Produces: `renderProposal(proposal, { letter }): string` (a complete HTML document that links `kit.css`
  beside it) · CLI `node scripts/render.mjs <proposal.json> --kit <kit dir> --out <file.html> [--letter A]`,
  which copies `<kit dir>/kit.css` next to the output. Exit 1, naming the path, when the proposal is
  invalid.

- [ ] **Step 1: Write the failing tests** on `renderProposal(fixture, { letter: 'B' })`:
  the document contains each screen's title inside an element with class `ux-frame` and
  `data-screen="<id>"`; the letter `B` and the proposal's name, bet and cost appear once in a header; an
  item with `id: "free-count"` carries `data-ux="free-count"`; a primary action has class
  `ux-action is-primary`; a `dialog` screen is drawn inside its own frame with class `ux-dialog`; an item
  whose text is `<script>alert(1)</script>` appears escaped and no `<script` tag exists in the output; the
  text `Reunión — sala 3 🙂` appears intact and the document declares `charset="utf-8"`; the keys
  `author`, `engine`, `track` never appear in the output.
- [ ] **Step 2: Run them.** → FAIL.
- [ ] **Step 3: Implement.** One `<section class="ux-frame">` per screen, in order; containers nest; a
  `note` renders as `ux-note`; every string goes through one escape function.
- [ ] **Step 4: Run them.** → PASS (8 tests).
- [ ] **Step 5: Draw the three fixtures by CLI** into `tests/.tmp/board/`. Expected: three `.html` files
  and one `kit.css`.
- [ ] **Step 6: Commit.** `git commit -m "feat: render draws a proposal in the shared kit"`.

### Task 5: The blind merge

Implements § 12 and § 16 (`merge`).

**Files:**
- Create: `scripts/lib/merge.mjs`, `scripts/merge.mjs`
- Test: `tests/merge.test.mjs`

**Interfaces:**
- Consumes: `validate` from Task 3.
- Produces: `mergeProposals(srcDir, outDir, { seed }): { letters: string[] }` ·
  `openMap(outDir): Record<string, { file: string, track: string | null, engine: string | null }>` ·
  `class SealedError extends Error`. Files written: `<outDir>/<letter>.json`, `<outDir>/MAP.sealed.json`.
  CLI: `node scripts/merge.mjs <proposals dir> --out <board dir>` and `node scripts/merge.mjs open <board dir>`.

- [ ] **Step 1: Write the failing tests:** three fixtures merge to letters `A`, `B`, `C`; the letter
  copies contain none of `author`, `engine`, `track`, `model`, `source`; with a fixed `seed` the order is
  the same twice and differs from file order for at least one of three seeds; the CLI's standard output
  contains the count and the letters and **no source file name**; `openMap` throws `SealedError` when
  `<outDir>/PICK.md` is absent and returns the map once it exists; one invalid proposal makes the whole
  merge throw before any letter file is written; 27 proposals throw.
- [ ] **Step 2: Run them.** → FAIL.
- [ ] **Step 3: Implement.** Without `seed`, shuffle with `crypto.randomInt`.
- [ ] **Step 4: Run them.** → PASS (7 tests).
- [ ] **Step 5: Commit.** `git commit -m "feat: blind merge with a sealed author map"`.

### Task 6: Screenshots and the decision page

Implements § 16 (`shots`, the decision page) and the decision page's rules in § 3, § 6.

**Files:**
- Create: `scripts/lib/chrome.mjs`, `scripts/shots.mjs`, `scripts/page.mjs`
- Create: `templates/outputs/decision.json` (a filled sample; Task 12 lints it)
- Test: `tests/shots.test.mjs`, `tests/page.test.mjs`

**Interfaces:**
- Produces:
  - `findChrome(explicit?: string): string` (throws when none exists).
  - `shoot(inputs: string[], { out, widths, themes, chrome }): Promise<{ files: string[], overflow: { file, width }[], errors: { file, message }[], titles: Record<string, string> }>`
    (`titles` maps each input file to its document title after load).
    A directory input means every `.html` in it. Output name: `<basename>-<width>-<theme>.png`, full page.
    CLI: `node scripts/shots.mjs <file or dir…> --out <dir> --widths 1280,390 [--themes light,dark] [--chrome <path>]`;
    exit 1 when a page raised an error, unless `--allow-errors`.
  - `validateDecision(data): string[]` · `renderDecision(data): string` ·
    CLI `node scripts/page.mjs <decision.json> --out <decision.html>`.
  - `decision.json`: `{ identity: { design, kind, size, stage, of }, question, recommendation: { option, reason }, options: [{ letter, title, line, images: string[] }], seats: [{ seat, line, option? }], gallery?: { title, items: [{ title, line, images }] } }`.

- [ ] **Step 1: Write the failing tests for the page:** the sample validates to `[]`; a `question` with
  two question marks gives an error matching `/one question/`; a missing `identity.stage` gives an error;
  a `recommendation.reason` of two sentences gives an error matching `/one sentence/`; an option with no
  image and no `line` gives an error; the rendered page starts its body with the identity line
  `design · kind · size · stage n of m`; each option's letter and images appear; the gallery, when
  present, is rendered after the options under its own title; a `line` containing `<b>` is escaped.
- [ ] **Step 2: Write the failing tests for the shots:** shooting `tests/.tmp/board/` at widths
  `1280,390`, theme `light`, writes six PNG files whose width, read from the PNG header, is 1280 or 390;
  a page that throws in a script appears in `errors`; a page 900 px wide by CSS appears in `overflow` at
  390; an input directory whose name contains a space is shot without error; the browser context was
  created with reduced motion (assert through a page that writes
  `matchMedia('(prefers-reduced-motion: reduce)').matches` into its title, which `shoot` returns in a
  `titles` map).
- [ ] **Step 3: Run them.** → FAIL.
- [ ] **Step 4: Implement** `chrome.mjs`, `shots.mjs`, `page.mjs`. The decision page is one self-contained
  HTML file with a light and a dark set and no script.
- [ ] **Step 5: Run them.** → PASS (14 tests).
- [ ] **Step 6: Commit.** `git commit -m "feat: screenshots and the one-question decision page"`.

### Task 7: Acceptance checks

Implements § 13 row 6, § 4.8 and § 16 (`accept`).

**Files:**
- Create: `scripts/inpage/accept-inpage.js`, `scripts/accept.mjs`
- Create: `tests/fixtures/prototype/today-default-en.html`, `today-empty-en.html`, `today-default-es.html`,
  `kit.css` (copy of the grey kit), `tests/fixtures/acceptance.json`
- Test: `tests/accept.test.mjs`

**Interfaces:**
- Consumes: `findChrome` from Task 6.
- Produces:
  - `acceptance.json`: `{ design, checks: [{ id, criterion, state, page, width, theme?, language?, type, target, …params }] }`.
  - Check types and their parameters:

| type | passes when | parameters |
|---|---|---|
| `visible` | exactly one element has the id and is rendered with a non-zero box | — |
| `absent` | no element has the id, or it is not rendered | — |
| `text` | the element's trimmed text equals `equals`, or matches `matches` | `equals` or `matches` |
| `order` | the elements named in `targets` appear in that order in the document | `targets: string[]` |
| `in-viewport` | the element's box lies inside the first viewport at this width | — |
| `min-size` | its box is at least `width` × `height` CSS pixels | `width`, `height` |
| `contrast` | text colour against the nearest non-transparent background is at least `min` (WCAG ratio) | `min` |
| `count` | the number of elements whose id starts with `target` is `equals` | `equals` |

  - In the page: `window.__uxAccept(checks): { id, pass, actual, message }[]` — plain browser JavaScript,
    no imports, safe to evaluate through any driver.
  - `node scripts/accept.mjs prototype <acceptance.json> --root <prototype dir> --out <results.json>`
    (opens each check's `page` at its `width` and `theme` and evaluates) ·
    `node scripts/accept.mjs inpage` (prints the absolute path of the in-page file) ·
    `node scripts/accept.mjs report <results.json…> --out <file.md>` (one row per check; failed first).
    `prototype` exits 1 when any check failed.

- [ ] **Step 1: Write the fixtures.** Three small pages on the grey kit with ids `free-count`,
  `room-list`, `book-action`, `empty-message`; the Spanish page with Spanish strings. `acceptance.json`
  with one check of each type that passes, on the pages above.
- [ ] **Step 2: Write the failing tests:** the fixture run returns eight results, all `pass: true`; a
  check whose `target` does not exist returns `pass: false` with a message matching `/not found/` and the
  run continues; a page holding the same `data-ux` twice makes `visible` fail with `/found 2/`; an unknown
  `type` returns `pass: false` with `/unknown check type/`; `contrast` with `min: 21` on grey text fails
  and reports the measured ratio in `actual`; `--root` given a directory with a space in its name works;
  `report` lists failed checks first and prints the criterion beside each.
- [ ] **Step 3: Run them.** → FAIL.
- [ ] **Step 4: Implement** the in-page file, then the runner over `playwright-core`, then the report.
- [ ] **Step 5: Run them.** → PASS (7 tests).
- [ ] **Step 6: Commit.** `git commit -m "feat: acceptance checks that run on the prototype and inside a build"`.

### Task 8: Calling an outside model

Implements § 24 (outside text models) under the secrets rule of § 18.

**Files:**
- Create: `scripts/describe.mjs`
- Test: `tests/describe.test.mjs` (against a local HTTP server started by the test)

**Interfaces:**
- Consumes: `parse` (Task 1), `validate` (Task 3).
- Produces: `describe({ provider, model, briefPath, outPath, profilePath, endpoint, timeoutMs }): Promise<{ ok: boolean, chars: number, seconds: number }>` ·
  CLI `node scripts/describe.mjs --provider <openai|gemini> --model <id> --brief <file> --out <file.json> --profile <PROFILE.md>`.
  - `openai`: `POST {endpoint}/v1/chat/completions`, header `Authorization: Bearer <key>`, body
    `{ model, messages: [{ role: 'user', content: <brief> }] }`, answer at `choices[0].message.content`.
    Default endpoint `https://api.openai.com`.
  - `gemini`: `POST {endpoint}/v1beta/models/{model}:generateContent`, header `x-goog-api-key: <key>`
    (never in the URL), body `{ contents: [{ parts: [{ text: <brief> }] }] }`, answer the joined
    `candidates[0].content.parts[].text`. Default endpoint `https://generativelanguage.googleapis.com`.
  - The key: environment variable `OPENAI_API_KEY` or `GEMINI_API_KEY`; if unset, the same name in the
    dotenv file whose path is the profile's `keys-file` value. The path is read from the profile by the
    script and is never a command-line argument.
  - The answer must hold one JSON object that passes `validate`. It is written to `--out` with
    `"engine": "model:<provider>"` added. Otherwise the raw answer goes to `<out>.raw.txt` and the exit
    code is 1.
  - Standard output: provider, model, characters, seconds. Nothing else.

- [ ] **Step 1: Write the failing tests** with a fake server: a valid fenced JSON answer is unfenced,
  validated and written with `engine` set; a prose answer writes `.raw.txt` and returns `ok: false`; a
  401 whose body contains the string `sk-secret` produces output containing `401` and **not** `sk-secret`;
  the key value never appears in standard output or error in any test; the Gemini request carries the key
  in the header and the URL has no `key=`; with no key anywhere the script exits 1 naming the variable,
  not a value; a request that never answers stops at `timeoutMs`.
- [ ] **Step 2: Run them.** → FAIL.
- [ ] **Step 3: Implement**, with `dns.setDefaultResultOrder('ipv4first')` at the top and the built-in
  `fetch` under an `AbortController`.
- [ ] **Step 4: Run them.** → PASS (7 tests).
- [ ] **Step 5: Run the whole suite.** `npm test` → all green. **Phase A ends here.**
- [ ] **Step 6: Commit.** `git commit -m "feat: describe sends a brief to an outside model without exposing its key"`.

---

## Phase B — the pool and the templates

Prose tasks. The plan fixes what each file must decide; the wording is the implementer's, in the kit's
plain register (read two files of version 1 with `git show master:phases/5-EVALUATION.md` and
`master:reference/ANTI-PATTERNS.md` for the voice). Port from the sources in § 23 where a card has a
proven original, and make it generic.

### Task 9: The card format, its tests, and the eight maker cards

Implements § 7.

**Files:**
- Create: `pool/CARD-FORMAT.md`, `pool/MODELS.md`, `pool/makers/structure-describer.md`, `outside-describer.md`,
  `screen-generator.md`, `transcriber.md`, `interaction-designer.md`, `interface-writer.md`,
  `prototype-builder.md`, `visual-designer.md`
- Test: `tests/pool.test.mjs`

**Interfaces:**
- Produces — the card header (flat frontmatter), every key required: `id` (`<shelf>.<name>`), `shelf`
  (`maker | judge | audience`), `job` (one question or one sentence), `sits-at` (list of stages),
  `cast-when` (one sentence), `presets` (list of sizes), `loaded-with` (`profile | person | none`),
  `reads` (list), `never-reads` (list), `engine` (`own`, `skill:<name>`, `model:<provider>` or
  `tool:<name>`), `suggested-model` (`fable | opus | sonnet | haiku | none`), `suggested-effort`
  (`low | medium | high | xhigh | max | none`), `verified` (date).
- Body sections, in this order: `## Method` · `## Output` · `## Never` · `## Borrowed` (may say "nothing").
  A judge adds, before Method: `## Core checks` (two to five) and `## Optional checks` (a table with
  columns `id`, `trigger`, `method`).

- [ ] **Step 1: Write the failing tests** (they will cover every card as the next tasks add them): every
  `.md` under `pool/makers`, `pool/judges`, `pool/audiences` parses and has every header key; `suggested-model` and `suggested-effort` hold one of
  the values the format allows; `pool/MODELS.md` exists, carries a `Reviewed:` date and the word
  `suggestion`; `id` matches
  the file's shelf and name; `sits-at` is a subset of `STAGES`; the body has the required sections in
  order; a judge has two to five core checks and every optional-check row has a non-empty trigger; no file
  under `pool/`, `templates/`, `skills/`, `kit/`, `reference/`, `scripts/` or the root `README.md` and
  `LESSONS.md` contains `Verbato` or `Versa` (case-insensitive); `pool/INDEX.md` has exactly one row per
  card and its `id`, `job` and `cast-when` cells equal the card's header (this last test is marked
  `todo` until Task 11 writes the index).
- [ ] **Step 2: Run them.** → FAIL (no cards).
- [ ] **Step 3: Write `CARD-FORMAT.md`** — the contract above, with the three engine rules of § 7: a card
  works without its engine; a missing engine is said at Frame; outside engines are off unless the profile
  lists them in `engines-on`. It states that `suggested-model` and `suggested-effort` are suggestions,
  never instructions (spec § 7, "Model and effort are suggestions"). Write `pool/MODELS.md`: a `Reviewed:`
  date, the four reasons of that section in the kit's own words, and one table of every seat with its
  suggested model and effort — the cards hold the values, this file holds the reasoning.
- [ ] **Step 4: Write the eight maker cards** to these decisions:

| Card | sits-at | engine | What the card must decide |
|---|---|---|---|
| `maker.structure-describer` | structure | own | Takes one **lens** named in its brief (fewest steps · guided · defaults first · in place). Writes the first idea down and sets it aside. Considers "no interface". Returns one proposal as JSON in the walkthrough format. Never names a component, never sees another proposal, the session's idea or the current screen. |
| `maker.outside-describer` | structure, look | `model:<provider>` | The same brief sent with `scripts/describe.mjs`. At Look only inside a fresh pass. Without the engine: not cast. |
| `maker.screen-generator` | structure, look | `tool:stitch` | Fresh pass, or one extra describer. Generates the one or two screens that carry the idea from the fresh brief, with no design system attached. Lists the tool's known behaviours with the verified date (slow: minutes per screen; never retry on a timeout, fetch the result). Without the engine: a Claude maker writes one free HTML screen with a taste skill as its lens. |
| `maker.transcriber` | structure | own | Reads a screen (HTML or a screenshot) and writes its structure as walkthrough JSON. Adds nothing, improves nothing, drops the paint. Marks what it could not read. |
| `maker.interaction-designer` | detail | own | Every state of the intent's table, every rule (validation, focus order, keyboard), every edge case. Asks nothing: a state the intent omitted is reported, not invented. |
| `maker.interface-writer` | detail | own | Every string in every language, written for the surface, never one language from the other; the founder's own lines as the bar when the brief carries them; a why-line where two languages diverge; lengths counted by tool. |
| `maker.prototype-builder` | detail | own | Static HTML on the shared kit; one description per screen plus `strings.json` generates every state × language page; `data-ux` on every element the spec names; an index page. |
| `maker.visual-designer` | look | `skill:frontend-design` | Static pages that link the project's token file. Inside a system: hierarchy, spacing, emphasis, density, responsive, themes; variants only on one named axis. Writes the table of measured values. In a fresh pass, rebuilds what the founder marked as named extensions. |

  Suggested model and effort for the makers (suggestions): structure describer `fable` / `high`; outside
  describer and screen generator `none` / `none` (they run on their engine); transcriber `sonnet` /
  `medium`; interaction designer `fable` / `high`; interface writer `fable` / `high`; prototype builder
  `opus` / `medium`; visual designer `fable` / `high`.
- [ ] **Step 5: Confirm the visual designer's engine.** § 24 leaves it to the build: read
  `frontend-design` and each taste or motion skill installed on this machine (list them with
  `claude plugin list` and the skills folders), keep `skill:frontend-design` as the default unless one
  fits a system-bound product better, and record in the card's `## Borrowed` which were read and why the
  choice. The card's Method must stand without any of them.
- [ ] **Step 6: Run the tests.** → PASS, with the index test still `todo`.
- [ ] **Step 7: Commit.** `git commit -m "feat: the card format and the maker cards"`.

### Task 10: The eight judge cards

Implements § 9 and § 10.

**Files:**
- Create: `pool/judges/usability.md`, `truth.md`, `words.md`, `accessibility.md`, `visual-craft.md`,
  `system-fidelity.md`, `profile.md`, `cold-implementer.md`

**Interfaces:**
- Consumes: the card format (Task 9). Every judge's `never-reads` includes `maker-notes`, `author-map`,
  `other-ledgers`. Every judge's `## Output` points at `templates/outputs/LEDGER.md` (Task 12).
- Each card's `## Method` opens with the rule of § 9: the job before the craft.

- [ ] **Step 1: Write the cards** to these decisions (core checks are fixed; optional checks are the
  minimum set, each with the trigger given):

| Card | sits-at | loaded-with | Core checks | Optional checks — trigger |
|---|---|---|---|---|
| `judge.usability` | context, structure, detail, acceptance | none | Each task in the intent: can she finish it without help · each success criterion: met or not · every state in the intent has an answer · after the likeliest mistake there is a way back | first action — more than one action on the first screen · steps — three or more screens · siblings — the intent names sibling surfaces · destructive — any irreversible action · teaching — an empty first-ever state exists · overflow — any list or free text |
| `judge.truth` | structure, detail, look, acceptance | none | Every element that shows data or offers an action traces to a row of the context's inventory · nothing implies a state or capability the product lacks · every dependency is listed | public claims — the kind is a public page, or a string asserts something about the product · numbers — any digit in a string · data and privacy — a string mentions data, privacy or security |
| `judge.words` | detail, acceptance | none | Each line sounds like a person talking to this person · each language says the same thing and was written for itself · one word for one thing throughout | length — a string has a limit · errors — an error state exists · register — more than one language · machine tells — any sentence longer than a label |
| `judge.accessibility` | detail, look, acceptance | none | Every control has a name · reading and focus order follow the visual order · nothing depends on colour alone | contrast, measured — final colours exist · target size — final sizes exist · reflow — more than one width · focus in overlays — a dialog or overlay · reduced motion — any motion · announcements — content that changes without navigation |
| `judge.visual-craft` | context, look, acceptance | none | The eye lands first on the primary thing · spacing follows the scale and groups related things · elements share edges | typography — a new text style or running text · colour — a colour pair introduced or changed · components — a part used in a new way · icons — any icon · motion — any motion · empty, loading, error — that state is in the artefact · second theme — one exists · density — a list, a table or a working surface · widths — more than one |
| `judge.system-fidelity` | look, acceptance | none | Every value is a token · every part is the system's or is flagged as new · patterns match the sibling surfaces | new parts — anything flagged new · second theme — one exists · borrow list — a fresh pass ran: what the system lacks to make each thing marked |
| `judge.profile` | intent, structure, detail, look, acceptance | profile | The six criteria of § 10, in its order | one per optional characteristic present in the profile |
| `judge.cold-implementer` | handoff | none | Every question it would have to ask · every guess it would have to make · every reference that points outside the folder · every state without a page and every string without a key | — (an empty table with the line "none: this seat always reads the whole folder") |

  `judge.profile` also carries, from § 10: its verdict words (*works · works with changes · does not
  work*); "why it matters" names the trait and labels it fact or guess; the "cannot tell" list; the ranking
  at Structure; disagreements between profiles stated, never averaged; never invents a trait.
  Suggested model and effort for the judges (suggestions): `opus` / `high` for every judge, so that a
  judge reads work made on another model; `judge.system-fidelity` is `opus` / `medium`.
  `engine`: `judge.visual-craft` is `skill:design-audit`, and its typography check names the
  `typography` skill as its method when that skill is installed; every other judge is `own`.

- [ ] **Step 2: Run the tests.** `node --test tests/pool.test.mjs` → PASS (index test still `todo`).
- [ ] **Step 3: Commit.** `git commit -m "feat: the judge cards, the profile judge among them"`.

### Task 11: The audience card, the generic persons, the index

Implements § 8 (generic persons), § 11, § 7 (`INDEX.md`).

**Files:**
- Create: `pool/audiences/task-reader.md`, `pool/persons/first-timer.md`, `daily-expert.md`,
  `hurried-on-a-phone.md`, `keyboard-user.md`, `second-language-reader.md`, `pool/INDEX.md`
- Modify: `tests/pool.test.mjs` (un-`todo` the index test; add the person tests)

**Interfaces:**
- Consumes: the card format; the person card's shape, fixed here and templated in Task 12 — header keys
  `id`, `profile` (a profile id or `none`), `specialty` (or `none`), `evidence` (`fact | guess | mixed`);
  body sections `## The moment` · `## The job` · `## What she never does` · `## The check`.

- [ ] **Step 1: Add the failing tests:** every file in `pool/persons` has the person header and sections;
  generic persons have `profile: none`; `audience.task-reader` has `loaded-with: person` and its
  `never-reads` includes `intent`; its body contains the caveat sentence of § 11 beginning "A simulated
  person agrees too easily"; the index test is live.
- [ ] **Step 2: Run them.** → FAIL.
- [ ] **Step 3: Write `audience.task-reader`** to § 11: screenshots only; the six answers per task; the
  ranking with gap sizes; the caveat verbatim on every read; a real person's read outranks it; its output
  is `templates/outputs/TASK-READ.md`. Suggested model and effort: `opus` / `medium`. One section, "On a public page", gives the other reading: stop,
  understand, click.
- [ ] **Step 4: Write the five persons**, each as someone in a moment, not a demographic: the first-timer
  who has never seen the product; the daily expert who resents an added step; the one hurried on a phone,
  one hand, interrupted; the keyboard user who never touches the pointer; the reader working in her
  second language.
- [ ] **Step 5: Write `INDEX.md`:** one table, columns `id`, `job`, `cast-when`, in shelf order.
- [ ] **Step 6: Run the tests.** → PASS.
- [ ] **Step 7: Commit.** `git commit -m "feat: the audience seat, the generic persons and the pool index"`.

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

### Task 14: Setup

Implements § 4.9, § 12 (the project kit), § 15 (the profile).

**Files:**
- Create: `skills/setup/SKILL.md`, `skills/setup/references/project-kit.md`

**Interfaces:**
- Consumes: `templates/project/PROFILE.md`, `templates/project/LESSONS.md`, `kit/KIT-CONTRACT.md`,
  `kit/grey/`, `pool/INDEX.md`.
- Produces in the project: `<packages>/PROFILE.md`, `<packages>/LESSONS.md`, `<packages>/kit/kit.css`
  (and `parts.html`), `<packages>/pool/{profiles,persons,makers,judges,audiences}/`.

- [ ] **Step 1: Un-`todo` the `setup` tests and run them.** → FAIL.
- [ ] **Step 2: Write the skill** (sections `## Question` · `## Reads` · `## Writes` · `## Steps` · `## Gate` · `## Never`):
  the question — "what must be true of this project before its first design?"; the steps — read the design
  system that exists (token files, component source, its documents), never invent a parallel one; ask the
  founder only what cannot be read, one question at a time (the product in one sentence, the languages,
  his standing rules for interfaces, the professions it serves); write the profile; build the project kit;
  write a profile stub per profession with every trait marked *guess*; run the engine check — for each
  first-set card, is its engine installed and does it answer one trivial call — and record the result in
  the profile; the gate — he corrects the profile once.
- [ ] **Step 3: Write `references/project-kit.md`:** copy `kit/grey/` into the project; restyle each class
  of the contract to look like the project's default part, using only the project's token file; when the
  tokens are not plain CSS, export them to one CSS file and record the source path and commit; draw
  `parts.html` and screenshot it with `scripts/shots.mjs` for the founder's look; never import the real
  components.
- [ ] **Step 4: Run the tests.** → PASS for `setup`.
- [ ] **Step 5: Commit.** `git commit -m "feat: setup writes a project's profile and its kit"`.

### Task 15: Frame, Context, Intent, Cast

Implements § 4.0–4.3, § 5, § 8, § 10 ("in the pipeline").

**Files:**
- Create: `skills/frame/SKILL.md`, `skills/context/SKILL.md`, `skills/intent/SKILL.md`,
  `skills/cast/SKILL.md`, `skills/cast/references/presets.md`

**Interfaces:**
- Consumes: the package templates `00`–`03`, `people/`, `scripts/state.mjs`, `pool/INDEX.md`, the cards.
- Produces — `presets.md`, the default cast per kind and size:

| Size | Structure | Detail | Look | Handoff | Acceptance |
|---|---|---|---|---|---|
| adjustment | — | interaction designer or interface writer (whichever the change touches) · usability | visual designer · system fidelity (only if visual) | cold implementer | the judges that read it before |
| surface, flow | 3 structure describers (3 lenses) · usability, truth · task reader with the primary person and one contrast person | interaction designer, interface writer, prototype builder · usability, truth, words, accessibility · task reader | visual designer · visual craft, system fidelity, accessibility | cold implementer | usability, accessibility, system fidelity, visual craft · task reader |
| system | as surface, plus a fourth describer | as surface | Direction: 3 directions; then as surface | as surface | as surface |

  Added by rule, at any size from surface up: `judge.profile`, once per profile, when Frame says the
  experience is for one or several profiles; two contrasting profiles when it is for everyone and the
  project has profiles; `judge.truth` always on a public page; `judge.words` gets its own question to the
  founder when the kind is first-run, message or public-page.

- [ ] **Step 1: Un-`todo` the four skills' tests and run them.** → FAIL.
- [ ] **Step 2: Write `frame`** to § 4.0 and `references/routes.md` of the conductor: one exchange; runs
  `state.mjs init`; records for one profile, several or everyone; lists preset seats whose engine is
  missing; gate — he confirms in one message.
- [ ] **Step 3: Write `context`** to § 4.1: the one stage that reads the world; every fact carries its
  source; the inventory of what the product can show and do; at least three angles; asks for the
  founder's own words when words will matter; lists the project sources later stages may open; when a
  surface exists, has the cast's judges read screenshots of it first; loads the profile or drafts it with
  every trait a *guess*; gate — he corrects, and his corrections are written under *Reviewed by the
  founder*.
- [ ] **Step 4: Write `intent`** to § 4.2 and § 8: writes the person card on top of the profile; the
  success-criteria test; the tasks as a starting situation and a goal, never the path; the ten states,
  each filled or "cannot occur because"; the optional read by the profile judge.
- [ ] **Step 5: Write `cast` and `presets.md`** to § 4.3, § 7, § 9, § 10, § 12: starts from the preset;
  explains each seat in one line (what it catches, what it costs); states the checks on and off per judge;
  shows each seat's suggested model and effort and proposes — as suggestions he may change, never as
  rules — a judge or audience on a different model from the maker it reads, and describers spread across
  models;
  states whether a fresh pass runs at Structure, at Look or both, and which engines it uses; gives the
  count of agents per stage; nothing is removed silently later.
- [ ] **Step 6: Run the tests.** → PASS for the four.
- [ ] **Step 7: Commit.** `git commit -m "feat: the four opening stages"`.

### Task 16: Structure

Implements § 4.4, § 12.

**Files:**
- Create: `skills/structure/SKILL.md`

**Interfaces:**
- Consumes: `templates/package/04-structure/*`, `scripts/describe.mjs`, `merge.mjs`, `render.mjs`,
  `shots.mjs`, `page.mjs`, the conductor's `blind.md` and `fresh-pass.md`, the maker cards, the brief
  templates.
- Produces in the package: `04-structure/BRIEF.md` (as the founder approved it), `proposals/*.json`,
  `board/<letter>.json|.html`, `board/MAP.sealed.json`, `shots/`, `reads/`, `decision.html`, `PICK.md`,
  `CHOSEN.md`; with a fresh pass also `BRIEF-fresh.md`, `fresh/` (the screens as they came).

- [ ] **Step 1: Un-`todo` the `structure` tests and run them.** → FAIL.
- [ ] **Step 2: Write the skill.** Its steps, in this order and with these stops:
  1. Write the brief from the intent. It holds context and nothing of the design.
  2. **Stop: show the brief to the founder.** Nothing is sent before his yes.
  3. Launch the describers in one message (each with a different lens), and any outside describer through
     `describe.mjs`. With a fresh pass: launch its makers from `BRIEF-fresh.md`, then a transcriber per
     fresh screen.
  4. Put every proposal in `proposals/`, tagged `track` and `engine`. Run `merge`, then `render` for each
     letter with the project's kit, then `shots` at the primary and the phone width.
  5. Launch the readers the cast names, by letter. Their briefs list the map, the proposals folder and the
     makers' files under "Do not open".
  6. Write `decision.json` and build the page: the options, one line per seat, one recommendation, one
     question; with a fresh pass, the gallery beneath.
  7. **Stop: the founder picks.** Write `PICK.md` in his words. Only then may the map be opened.
  8. A pick with named grafts is redrawn and re-read once. A rejection of everything reopens Intent or
     Context; no further proposals are asked for against the same brief.
  9. Write `CHOSEN.md` with its carry list; stamp it.
- [ ] **Step 3: Run the tests.** → PASS for `structure`.
- [ ] **Step 4: Commit.** `git commit -m "feat: the Structure stage — blind proposals, one kit, the founder's pick"`.

### Task 17: Detail and Look

Implements § 4.5, § 4.6, § 12 (fresh pass at Look).

**Files:**
- Create: `skills/detail/SKILL.md`, `skills/look/SKILL.md`, `skills/look/references/direction.md`

**Interfaces:**
- Consumes: `templates/package/05-detail/*`, `06-look/*`, `scripts/shots.mjs`, `accept.mjs`, `page.mjs`,
  the cards, the conductor's `loop.md` and `fresh-pass.md`.
- Produces in the package: `05-detail/DETAIL.md`, `states.md`, `strings.json`, `prototype/`, `shots/`,
  `reads/`; `06-look/LOOK.md`, `screens/`, `shots/`, `measures.md`, `reads/`, and with a fresh pass
  `fresh/`.

- [ ] **Step 1: Un-`todo` the two skills' tests and run them.** → FAIL.
- [ ] **Step 2: Write `detail`:** makers in this order — the interaction designer, then the interface
  writer (briefed with the founder's own lines from the context), then the prototype builder; screenshots
  of every page; the readers the cast names; blocking findings fixed in one round and re-read by a fresh
  judge; the gate on the prototype; the words as a separate question when the kind is first-run, message
  or public-page; a truth finding that needs a capability the product lacks becomes a dependency, never a
  silent removal.
- [ ] **Step 3: Write `look`:** the two modes of § 4.6; inside a system, one visual designer and variants
  only on one named axis; the measured-values table; the fresh pass at Look (the screen that carries the
  idea, shown beside the system version; the three outcomes; a borrowed thing rebuilt on the tokens and
  flagged as an extension). `references/direction.md`: two or three directions of different kinds, each
  named with a thesis and a stated cost, rendered on the same detailed screen, and the rule ported from
  `master:phases/3-DIRECTION.md` that three shades of one safe idea are not a choice; the pick becomes
  the tokens and the profile is updated. Until a direction-maker card exists, the visual designer is cast
  once per direction, each with a different lens; palettes and pairings may be drawn from a design-data
  skill when one is installed.
- [ ] **Step 4: Run the tests.** → PASS for both.
- [ ] **Step 5: Commit.** `git commit -m "feat: the Detail and Look stages"`.

### Task 18: Handoff, Acceptance and the implementer's guide

Implements § 4.7, § 4.8, § 13, § 14.

**Files:**
- Create: `skills/handoff/SKILL.md`, `skills/acceptance/SKILL.md`, `reference/IMPLEMENTER-GUIDE.md`,
  `reference/ANTI-PATTERNS.md`

**Interfaces:**
- Consumes: `templates/package/07-handoff/*`, `build/*`, `08-acceptance/*`, `scripts/accept.mjs`,
  `judge.cold-implementer`.
- Produces in the package: the eight files of § 13 with `prototype/` and the token file copied in;
  `08-acceptance/REPORT.md`, `FIXES.md`, `checks.json`.

- [ ] **Step 1: Un-`todo` the two skills' tests and run them.** → FAIL.
- [ ] **Step 2: Write `handoff`:** assembles the folder from what is approved; copies the prototype, the
  final screens and the token file in, with the token file's source path and commit; writes `PARTS.md`
  from the component source the profile names, never from memory; writes the checks and **runs them on
  the prototype first** (`accept.mjs prototype`) — a check that fails there is wrong and is fixed before
  the handoff; converts `strings.json` to the profile's `strings-format` when one is named; launches the
  cold implementer with the folder only; every item it lists is answered in the folder or given a written
  default; the gate — one go.
- [ ] **Step 3: Write `acceptance`:** a separate session; reads the handoff folder and `build/`; drives
  each state from `STATES.md` the way the profile's "how a browser check is run here" says; evaluates the
  in-page checks through that driver (`accept.mjs inpage` gives the file); screenshots for the judges;
  one audience read; `REPORT.md` — each item *matches* or *deviates*; an accepted deviation is logged and
  the package brought up to date; a fix goes out in `FIXES.md` as a slice; a fix the size of a correction
  may be applied after the founder's nod; appends the lessons.
- [ ] **Step 4: Write `reference/IMPLEMENTER-GUIDE.md`** for the session that builds: port the four rules
  of `master:phases/6-IMPLEMENT.md` (never guess a component's interface; tokens, never raw values; build
  every state; translate the prototype, never paste it) and the loop of `master:phases/7-QA-LOOP.md`
  (measure, do not trade adjectives); add the three rules of § 13 and the three files to write back.
  `templates/package/07-handoff/HANDOFF.md` already points here; the handoff skill copies this guide into
  the folder so it stands alone.
- [ ] **Step 5: Write `reference/ANTI-PATTERNS.md`:** port `master:reference/ANTI-PATTERNS.md`, keep its
  two lists, and add the process failures this design guards against: a brief that prescribes the design;
  a shortlist before the founder marks; a judge that redraws; a simulated read quoted as evidence; a fresh
  screen handed off as it came; a check skipped without a line saying so.
- [ ] **Step 6: Run the tests.** → PASS for both; `npm test` all green.
- [ ] **Step 7: Commit.** `git commit -m "feat: the Handoff and Acceptance stages and the implementer's guide"`.

### Task 19: The lessons, the README, the evaluation suite

Implements § 14 (the seeded lessons), § 15, and § 20 ("how each skill is tested").

**Files:**
- Create: `LESSONS.md`, `evals/<case>/…` (nine cases)
- Modify: `README.md` (rewritten)

**Interfaces:**
- Consumes: every skill and card.

- [ ] **Step 1: Write `LESSONS.md`.** The header says: appended, never rewritten; one dated entry per
  lesson; only what is true on any project. Seed it with generic statements of what the two source
  processes learned (read § 23's first three rows and the two interface runs): a brief that prescribes
  the design returns the session's own idea in several voices · nothing is shortlisted, detailed or drawn
  before the founder marks · his own sentences are the calibration for words · a number named to him is
  counted by tool first · options that are one idea in three palettes are not a choice · a direction
  described by adjectives goes many rounds, one described by references and refused tells converges ·
  a simulated reader agrees too easily: only the ranking carries information · safe briefs plus judges
  who reward reduction make work cleaner and emptier · one artefact per review, one question · a stage
  skipped is the founder's decision, logged · record whose proposals are picked and let that decide which
  seats stay. No product's name.
- [ ] **Step 2: Rewrite `README.md`:** what it is in four lines; install (`/plugin marketplace add <path or repo>`,
  then `/plugin install ux@ux-runbook`, then `npm install` in the kit for the browser scripts); start
  (`/ux:design`); the nine stages in one table; what is in the repository; when not to use it (carried
  over from version 1's README); that version 1 lives at the tag of that name once the branch lands.
- [ ] **Step 3: Scaffold one case to learn the layout.** `claude plugin eval init --bare brief-has-no-design`.
  Read what it wrote; every case below follows that layout exactly.
- [ ] **Step 4: Write the nine cases.** Each has a prompt that points at a small fixture under the case's
  own folder, and one grader stating the pass condition in plain sentences.

| Case | The prompt asks the session to | Passes when |
|---|---|---|
| `brief-has-no-design` | write the Structure brief for the fixture intent | the brief names the person, the job, the tasks and what the product can do, and names no component, layout, style, colour or font, and none of the session's own ideas |
| `fresh-brief-hides-the-system` | write the fresh-pass brief for the same intent, in a project whose profile describes a design system | nothing of the design system, the kit, sibling surfaces or today's screens is in the brief |
| `no-pick-without-the-founder` | continue a package whose Structure board is built and has no `PICK.md` | it stops at the decision page with one question; it writes no `CHOSEN.md`, opens no map, starts no Detail |
| `judge-does-not-redraw` | act as the usability judge on a fixture prototype with two planted faults | the ledger has the top line, a row per fault with where and a fix as "is → should be" and a done-when, a list of checks not run; no artefact file is modified |
| `audience-stays-blind` | act as the task reader in a folder that also holds the intent | it does not open the intent; the read opens with the caveat, answers the six points per task citing the screen, and ends with a ranking |
| `resume-from-disk` | continue a package with three stages approved, in a chat that asserts a fact contradicting the context | it runs `validate` and `next`, continues at Cast from the package's facts, and tells the user the chat's fact is not in the package |
| `correction-is-one-nod` | change one wrong label | it frames in one line, shows before and after, asks for one nod, casts no seat, writes the one-paragraph record |
| `profile-judge-cannot-tell` | act as the profile judge with a profile whose device trait is *unknown*, on a design that depends on it | the report puts that point in "cannot tell", addressed to the founder; it states no device as fact |
| `cold-implementer-finds-the-gap` | act as the cold implementer on a handoff folder with one state lacking a page and one string lacking a key | both are listed, each as a question or a guess |

- [ ] **Step 5: Run the suite.** `claude plugin eval . --no-publish --runs 1 --max-cost-usd 15 --allow-tools Bash Write Edit`.
  This step is run by the main session, not a sub-agent. Expected: nine cases scored. A case below 1.0 is
  a finding against the skill or the card it exercises: fix that file, re-run that case
  (`--case <name>`), repeat until it passes or the finding is recorded with its reason in
  `docs/design/DRY-RUN.md`.
- [ ] **Step 6: Run everything.** `npm test` → green. `claude plugin validate . --strict` → exit 0.
- [ ] **Step 7: Commit.** `git commit -m "feat: seeded lessons, the README and the evaluation suite"`.

### Task 20: The dry run

Implements § 19's first paragraph: each skill has been used once, end to end, before the proving run.
**Run by the main session.** No founder is involved: his answers are read from a file, which makes this a
test of the mechanics and of nothing else.

**Files:**
- Create: `tests/dryrun/project/` (a fictional project: the room-booking product, a `tokens.css`, no
  profile yet), `tests/dryrun/FOUNDER-ANSWERS.md` (one answer per gate, written before the run),
  `docs/design/DRY-RUN.md`

**Interfaces:**
- Consumes: the whole kit, installed from the worktree (`/plugin marketplace add /mnt/data/Downloads/Proyectos/ux-runbook-v2`,
  `/plugin install ux@ux-runbook`), or loaded by path if the session cannot install.

- [ ] **Step 1: Write the fictional project and the answers file.** The answers: the request ("the front
  desk needs to see what is free right now"); the corrections to the context; the approval of the intent;
  the cast accepted with one seat removed; a pick at Structure by letter position ("the second"), since
  letters are shuffled; approvals at Detail and Look; the go at Handoff.
- [ ] **Step 2: Run setup, then the nine stages,** size `surface`, kind `working-surface`, no fresh pass,
  no outside engine, the three describers on three lenses. At each gate, read the answer from the file
  and write it into the artefact as the founder's words. Before each stage, run `state.mjs validate`
  and `next` and read the stage's inputs from the package, never from what the session remembers. (A true
  change of session between stages is the proving run's test, § 19; here only the mechanics are tried.)
- [ ] **Step 3: Stand in for the build.** Copy the handoff's prototype to a temp folder as "the build",
  write `build/BUILD.md` and `build/STATES.md` pointing at its pages, and run Acceptance against it.
- [ ] **Step 4: Check the result by script.** `node scripts/state.mjs validate <package>` → ok;
  `node scripts/accept.mjs prototype …` → all pass; the handoff folder contains the eight files of § 13
  and no path pointing outside itself (`grep -rn '\.\./' 07-handoff` returns nothing but the token file's
  recorded source).
- [ ] **Step 5: Write `docs/design/DRY-RUN.md`:** for each stage, what ran, how many agents, what broke
  and how it was fixed in the kit; the cold implementer's list and what answered each item; every place a
  skill's wording had to change; what the dry run cannot show (anything that depends on a real founder
  or a real design system). Fix each defect found in the skill, card, template or script that owns it,
  with a test where the defect was mechanical.
- [ ] **Step 6: Final gates.** `npm test` → green. `claude plugin validate . --strict` → exit 0.
  `git status --short` → clean after the commit. `git log --oneline master..v2-pipeline` → one commit per
  task.
- [ ] **Step 7: Commit, and stop.** `git commit -m "test: a dry run of the whole pipeline on a fictional surface"`.
  **Do not push, merge or tag.** Report to the founder: the kit is on `v2-pipeline` in the worktree; the
  proving run (the radiologist's shell, § 19) is the next step and needs his go, setup in that project,
  and the profession's profile.

---

## What this plan does not do

Named so nobody does them by momentum: the proving run; setup in any real project; the doctor profile;
replacing `master`, tagging version 1, pushing; the cards the design lists as "added when first needed"
other than the three the approved fresh pass and outside engines require (`maker.outside-describer`,
`maker.screen-generator`, `maker.transcriber`); a worked example (§ 17: it waits for the proving run).
