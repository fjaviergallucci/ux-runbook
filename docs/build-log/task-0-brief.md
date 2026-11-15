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
  assert.equal(p.scripts.test, 'node --test tests/');
});
```

- [ ] **Step 5: Run it.** `node --test tests/` → FAIL (files missing).
- [ ] **Step 6: Write the four files.** `plugin.json`: `name` `ux`, `version` `2.0.0-dev`, `license`
  `MIT`, `author.name` from `git config user.name` (no email), `description`: "An interface design
  pipeline for UX and UI: staged, with makers, judges and audiences chosen per design, ending in a handoff
  another session can build from." `marketplace.json`: `name` `ux-runbook`, the same owner name, one
  plugin `{name: "ux", source: "./", version, description}`. `package.json`: `private: true`,
  `type: "module"`, `engines.node: ">=20"`, `scripts.test`, `dependencies: {"playwright-core": "^1.48.0"}`.
  `.gitignore`: `node_modules/`, `evals/results/`, `tests/.tmp/`.
- [ ] **Step 7: Install.** `NODE_OPTIONS=--dns-result-order=ipv4first npm install`. Expected: exits 0,
  `node_modules/playwright-core` exists.
- [ ] **Step 8: Run the test.** `npm test` → PASS (3 tests).
- [ ] **Step 9: Validate the manifests.** `claude plugin validate .` → exit 0.
- [ ] **Step 10: Commit.** `git add -A && git commit -m "chore: start version 2 on a clean tree with the plugin skeleton"`.

