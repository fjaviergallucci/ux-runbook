# Task 0 report: the branch, the worktree, the skeleton

**Status:** DONE_WITH_CONCERNS (the concerns are minor; nothing is broken)
**Commit:** `a272de3 chore: start version 2 on a clean tree with the plugin skeleton` on `v2-pipeline`
(parent `e01d00c`). Not pushed, not merged, not tagged.

## What I implemented

Steps 1 and 2 had already been done by the controller; I started at Step 3.

- **Step 3:** `git rm -r RUNBOOK.md phases setup templates reference` (24 files removed). `LICENSE`,
  `.gitattributes`, `README.md` kept.
- **Step 4:** `tests/skeleton.test.mjs`, copied verbatim from the brief.
- **Step 6:** the four files:
  - `.claude-plugin/plugin.json`: `name` `ux`, `version` `2.0.0-dev`, the brief's description verbatim,
    `author.name` `Francisco Gallucci` (from `git config user.name` in the worktree, no email), `license` `MIT`.
  - `.claude-plugin/marketplace.json`: `name` `ux-runbook`, `owner.name` the same, one plugin
    `{name: "ux", source: "./", version: "2.0.0-dev", description: <same>}`.
  - `package.json`: `private: true`, `type: "module"`, `engines.node: ">=20"`,
    `scripts.test: "node --test tests/"`, `dependencies: {"playwright-core": "^1.48.0"}`.
  - `.gitignore`: `node_modules/`, `evals/results/`, `tests/.tmp/`, plus `.superpowers/` (controller's addition).
- **Step 7:** `NODE_OPTIONS=--dns-result-order=ipv4first npm install` exited 0 in under 1 s
  ("added 1 package, and audited 2 packages in 889ms, found 0 vulnerabilities");
  `node_modules/playwright-core` exists, resolved to 1.65.0.
- **Steps 8 and 9:** see below.
- **Step 10:** staged by explicit path (not `git add -A`), then committed. The index held exactly the
  24 deletions, the four new files, `tests/skeleton.test.mjs`, `package-lock.json` and the two `docs/` files
  (32 files, +2142 / -2744). After the commit, `git status --short` is empty; `node_modules/` and
  `.superpowers/` are the only ignored entries.

## Tests

Environment: Node v20.17.0, npm 10.8.2.

### RED (Step 5)

Command: `node --test tests/`

```
not ok 3 - package runs on node 20 with one dependency
  error: "ENOENT: no such file or directory, open '/mnt/data/Downloads/Proyectos/ux-runbook-v2/package.json'"
...
1..3
# tests 3
# pass 0
# fail 3
exit 1
```

All three tests failed with ENOENT on `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and
`package.json`. That was expected: none of the three files existed yet.

### GREEN (Step 8)

Command: `npm test` (that is, `node --test tests/`)

```
ok 1 - plugin manifest names the plugin ux
ok 2 - marketplace lists ux from the repository root
ok 3 - package runs on node 20 with one dependency
1..3
# tests 3
# pass 3
# fail 0
exit 0
```

I re-ran it after the commit: 3 pass, 0 fail.

## `claude plugin validate .` (Step 9): exit 0

```
Validating marketplace manifest: /mnt/data/Downloads/Proyectos/ux-runbook-v2/.claude-plugin/marketplace.json

⚠ Found 1 warning:

  ❯ description: No marketplace description provided. Adding a description helps users understand what this marketplace offers

Plugin directory checks for /mnt/data/Downloads/Proyectos/ux-runbook-v2. The plugin directory is the catalog that plugins are submitted to; this is a subset of what it runs.

⚠ Found 1 plugin directory warning:

  ❯ .claude-plugin/plugin.json icon: No icon (ICON_MISSING). No icon found in the plugin. The validator looked for `icon` in plugin.json and for a file at .claude-plugin/icon.png or .svg, assets/icon.png or .svg, or a similar path.
    Fix: Add a square PNG to the plugin folder at .claude-plugin/icon.png, or set `icon` in plugin.json to the path of a square PNG or JPEG in the plugin: 512 to 2048 px on each side, under 2 MB. SVG and WebP are not accepted. That file may become the listing icon only once: the first time the plugin is saved or submitted in the developer portal. Adding or changing it later does not change the icon.

About these checks:

  ❯ This folder also holds a marketplace manifest. The plugin directory treats such a folder as a plugin, so these checks cover only the plugin in this folder. To check another plugin that the marketplace lists, run validate on that plugin's folder.

These plugin directory checks do not change the result below.

The directory also runs a safety scan and a policy review that this command does not.

ℹ Advice (does not change the verdict):

  ❯ /mnt/data/Downloads/Proyectos/ux-runbook-v2/README.md: This README has no line that installs "ux" from a marketplace. Add the install line, which works in one step on Claude Code 2.1.275 or later. In it, replace <owner>/<repo> with the repository that holds the marketplace.
      /plugin install ux --marketplace <owner>/<repo>

✔ Validation passed with warnings
exit 0
```

## Files changed

- Added: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json`,
  `package-lock.json`, `.gitignore`, `tests/skeleton.test.mjs`,
  `docs/design/2026-11-13-pipeline-design.md`, `docs/plans/2026-11-13-PIPELINE-KIT-PLAN.md`
- Deleted: `RUNBOOK.md`, `phases/` (8 files), `setup/` (2), `templates/` (6), `reference/` (7)

Every written file is LF (0 CR bytes, checked with grep). There is no email in any manifest.
The main checkout `/mnt/data/Downloads/Proyectos/ux-runbook` was not touched.

## Self-review and concerns

1. **`package-lock.json` has the name `"ux-runbook-v2"`.** `package.json` has no `name` field (the brief
   does not list one), so npm used the worktree folder's name. After the branch lands and someone runs
   `npm install` in `ux-runbook`, npm will rewrite that field: a one-line churn in the lockfile. Adding
   `"name": "ux-runbook"` (or another name) to `package.json` would stop it. I left the brief's fields
   unchanged; it is your call.
2. **The validator gave two warnings:** the marketplace has no top-level `description`, and the plugin has
   no icon. Neither is an error, and the brief does not ask for either. I did not add them.
3. **The validator's advice says the README has no `/plugin install` line.** Also, `README.md` still links
   to files this commit removes (`RUNBOOK.md`, `templates/PROMPTS.md`, `setup/TOOL-ADAPTERS.md`,
   `reference/FIDELITY-LADDER.md`). That is expected: the brief keeps `README.md` as it is, and the plan's
   Task 19 rewrites it, install line included.
4. **`.superpowers/` was already excluded** by the main checkout's `.git/info/exclude`, which worktrees
   share. Listing it in `.gitignore` as well, as you asked, makes the exclusion travel with the repository.
5. Discipline: I made no changes beyond Steps 3 to 10 and the controller's `.gitignore` addition.

---

# Fix round 1

**Status:** DONE
**Commit:** `59f2c81 fix: test command that runs on Node 20 and later, strict-valid manifests` on `v2-pipeline`
(parent `a272de3`). I staged the five files by explicit path. Nothing pushed.

## What changed

1. **Test command (Important).** In `package.json`, `scripts.test` is now `node --test tests/*.test.mjs`.
   The assertion in `tests/skeleton.test.mjs` matches it. In the plan
   (`docs/plans/2026-11-13-PIPELINE-KIT-PLAN.md`) I changed the Task 0 test assertion (line 143),
   Step 5 (line 147) and Step 6 (line 153). Step 6 had only `scripts.test` with no value; it now reads
   `scripts.test: "node --test tests/*.test.mjs"`. The per-file commands are untouched. After the edit, a
   grep for a bare `node --test tests/` in the plan finds nothing.
2. **Strict validation (Important).** I added a top-level `"description": "The marketplace for the ux interface
   design pipeline plugin."` to `.claude-plugin/marketplace.json`. Plan Task 0 Step 9 now reads
   `claude plugin validate . --strict` → exit 0.
3. **Lockfile name (Minor).** `package.json` now has `"name": "ux-runbook"`. I regenerated the lockfile with
   `NODE_OPTIONS=--dns-result-order=ipv4first npm install` ("up to date, audited 2 packages in 528ms,
   found 0 vulnerabilities", exit 0). The `package-lock.json` diff touches only the name: the top-level
   `"name"` changes from `ux-runbook-v2` to `ux-runbook`, and `"name": "ux-runbook"` is added under `packages[""]`.
4. **Manifest agreement (Minor).** New test, "marketplace entry carries the plugin manifest version and
   description". It asserts that `marketplace.plugins[0].version` and `.description` equal `plugin.json`'s.
5. **The third test now asserts what its title claims (Minor).** It now also asserts
   `engines.node === '>=20'` and that `package.json` has no `devDependencies` key. A new test,
   "neither manifest carries an email", asserts that neither manifest's raw text contains `@`.

## Covering tests and evidence

### RED, finding 1 on Node 24 (before the fix)

Command: `PATH=~/.nvm/versions/node/v24.22.1/bin:$PATH npm test`

```
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v24.22.1
✖ tests (22.565737ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
exit 1
```

### RED, the new assertions on Node 20 (tests written, files not yet changed)

Command: `node --test tests/skeleton.test.mjs` (v20.17.0)

```
ok 1 - plugin manifest names the plugin ux
ok 2 - marketplace lists ux from the repository root
not ok 3 - package runs on node 20 with one dependency
  expected: 'node --test tests/*.test.mjs'
  actual: 'node --test tests/'
ok 4 - marketplace entry carries the plugin manifest version and description
ok 5 - neither manifest carries an email
# tests 5
# pass 4
# fail 1
exit 1
```

Tests 4 and 5, and the `engines` and `devDependencies` checks, passed at once because the files already
conformed; they guard against regressions. To show they can fail, I ran a mutation check on a scratch copy
of `tests/`, `.claude-plugin/` and `package.json` (deleted afterwards). In that copy the marketplace version
was set to `2.0.1`, an owner email was added, `devDependencies: {}` was added and `engines.node` was set to
`>=18`. Result: `not ok 3`, `not ok 4`, and `not ok 5` with the error ".claude-plugin/marketplace.json
contains an @". Adding only `devDependencies` gave `not ok 3` with the error "package.json has no
devDependencies".

### GREEN on Node 20

Command: `npm test` (v20.17.0)

```
> test
> node --test tests/*.test.mjs

TAP version 13
ok 1 - plugin manifest names the plugin ux
ok 2 - marketplace lists ux from the repository root
ok 3 - package runs on node 20 with one dependency
ok 4 - marketplace entry carries the plugin manifest version and description
ok 5 - neither manifest carries an email
1..5
# tests 5
# suites 0
# pass 5
# fail 0
# cancelled 0
# skipped 0
# todo 0
exit 0
```

### GREEN on Node 24

Command: `PATH=~/.nvm/versions/node/v24.22.1/bin:$PATH npm test`

```
> test
> node --test tests/*.test.mjs

✔ plugin manifest names the plugin ux (1.399745ms)
✔ marketplace lists ux from the repository root (0.563465ms)
✔ package runs on node 20 with one dependency (0.670587ms)
✔ marketplace entry carries the plugin manifest version and description (0.193238ms)
✔ neither manifest carries an email (0.182198ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
```

### `claude plugin validate . --strict`: exit 0

```
Validating marketplace manifest: /mnt/data/Downloads/Proyectos/ux-runbook-v2/.claude-plugin/marketplace.json

Plugin directory checks for /mnt/data/Downloads/Proyectos/ux-runbook-v2. The plugin directory is the catalog that plugins are submitted to; this is a subset of what it runs.

⚠ Found 1 plugin directory warning:

  ❯ .claude-plugin/plugin.json icon: No icon (ICON_MISSING). No icon found in the plugin. [...]

About these checks:

  ❯ This folder also holds a marketplace manifest. [...]

These plugin directory checks do not change the result below.

The directory also runs a safety scan and a policy review that this command does not.

ℹ Advice (does not change the verdict):

  ❯ /mnt/data/Downloads/Proyectos/ux-runbook-v2/README.md: This README has no line that installs "ux" from a marketplace. [...]

✔ Validation passed
exit 0
```

The marketplace description warning is gone. Only the icon notice (a plugin directory check that "does
not change the result") and the README advice remain.

## Files changed

`.claude-plugin/marketplace.json`, `package.json`, `package-lock.json`, `tests/skeleton.test.mjs`,
`docs/plans/2026-11-13-PIPELINE-KIT-PLAN.md`. Every file is LF (0 CR bytes).

## Notes for the controller (not changed, outside the ruling)

- The plan's Task 0 Step 4 code block has only the assertion edit; it does not include the two new tests
  or the new `engines` and `devDependencies` assertions. Step 8 still says "PASS (3 tests)", which matches
  the plan's own code block; the real suite has 5.
- The plan's Step 6 does not list the new `package.json` `name` or the marketplace `description`, and its
  `.gitignore` list does not include `.superpowers/`.
