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

