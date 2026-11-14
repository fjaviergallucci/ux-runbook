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

