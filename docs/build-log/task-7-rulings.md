# Task 7 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins.

## Given with the task

1. **One browser handling, shared.** The session handling moved out of `scripts/shots.mjs` into
   `scripts/lib/browser.mjs`, and both `shots` and the acceptance runner are built on it: launching Chrome,
   one context per (width, theme) with `viewport: { width, height: 900 }`, `deviceScaleFactor: 1`,
   `reducedMotion: 'reduce'`, `colorScheme`; opening a page and waiting for it to settle; the document
   mark and its two checks (a page that sends itself elsewhere is an error, never read as the page asked
   for); guarded, time-limited steps; bounded closes; counted restarts; the error list. `shots` keeps its
   exports and its CLI exactly as they were; all 57 tests of `tests/shots.test.mjs` stay green with
   assertions no weaker. The refactor is its own first commit.
2. **Shape checking before any browser.** `validateAcceptance(data): string[]` (empty when valid; each
   error names the path): `design` a non-empty string; `checks` a non-empty list; each check has `id`
   (unique in the file), `criterion`, `state`, `page` (a relative path, no `#`, `?`, `%` or backslash),
   `width` (a positive integer), `type`, `target` — and `targets` (a list of at least two ids) in place of
   `target` for `order`; `theme` is `light` or `dark` when present (default `light`); the parameters each
   type needs are present and well-formed (`equals` or `matches` for `text`, exactly one; `minWidth` +
   `minHeight` for `min-size`; `min` for `contrast`; `equals` for `count`); unknown keys refused. An
   invalid file is a refusal (exit 1) before Chrome starts. **An unknown `type` is not a shape error**: the
   validator accepts it and the in-page function returns a failed result with `/unknown check type/` — the
   in-page file may be older than the checks it is handed.
3. **Scoping by screen.** A check may carry an optional `screen`: when present the element is looked for
   inside `[data-screen="<screen>"]`, and "exactly one" is counted there.
4. **The in-page function** `window.__uxAccept(checks)` returns one result per check, in order:
   `{ id, pass, actual, message }`. It never throws: a malformed check, a missing element, a duplicated id
   (`/found 2/`), an unknown type each give `pass: false` with a message; one failure cannot stop the rest.
   It reads only; it changes nothing on the page. One self-contained file with no `import`, `export` or
   `require`, safe to pass as a string to any driver's evaluate.
5. `visible`: exactly one element, connected, rendered, with a box of non-zero width and height (see
   R90 below for what "rendered" reads). `in-viewport`: the whole box lies inside the first viewport (no
   scrolling). `contrast`: the element's computed `color` against the nearest ancestor background that is
   not fully transparent (the page's canvas when none is), composing a translucent colour over what is
   behind it, the WCAG relative-luminance ratio, reported to two decimals in `actual`.
6. **The runner** (`accept prototype`): groups the checks by (page, width, theme), opens each group once
   through the shared browser library, evaluates the in-page file, and writes `--out` as a list of
   `{ id, pass, actual, message, criterion, state, page, width, theme }` in the file's order. A page that
   fails to open, or leaves, gives `pass: false` for every check of that group with the page's error as
   the message — the run goes on. Exit 1 when any check failed, 0 when all passed. `--timeout <ms>` as in
   `shots`.
7. `accept report <results.json…> --out <file.md>`: one Markdown table row per check, failed checks first,
   the criterion beside each; a first line with the counts. It refuses (exit 1) a results file that is not
   a list of results. `accept inpage` prints the absolute path of the in-page file and exits 0.
8. CLI exit codes: 0 success; 1 a refusal or a failed check; 2 bad usage. Paths with a space work
   (`--root`, `--out`, the acceptance file).
9. Every refusal and rule needs a committed test that fails without it.
10. The plan's review focus this task owns: (4) a path with a space in it must still be opened; (5) a
    check that names an id which is missing, or present twice, is reported as failed with the reason, and
    the run continues.

## Given after the implementer's first report

- **R90.** `visible` reads the computed `visibility` of the element itself; `display: none` and
  `opacity: 0` are looked for up the ancestors. Visibility is inherited, so a hidden ancestor already
  reaches the element, and a child that sets itself visible inside a hidden parent is painted. (This
  replaces the first dispatch's wording "on itself or an ancestor" for visibility.)
- **R91.** In `accept prototype`, a page that reports a script error or a resource that did not load fails
  every check of its group with that report, unless `--allow-errors` — the same flag and meaning as
  `shots`. A page that would not close stays a warning.
- **R92.** `accept report` takes `--checks <acceptance.json>`: results that carry only
  `id, pass, actual, message` are joined to their checks by id (the checks file's values win); the checks
  file is validated first; a check with no result is listed as **not run**, after the failed and before
  the passed, and the first line counts passed, failed and not run; an id the file does not know, or an id
  with two results across the files given, is a refusal (exit 1) that names it; without `--checks` the
  full shape is required as before; `report` exits 0 when the report was written.
- **R93.** `package.json`'s test script is `node --test --test-concurrency=1 tests/*.test.mjs`. The dark
  canvas (`#121212` when the root's colour scheme is dark) stands; other engines' dark canvas is a
  deferred minor, not a finding.

## This machine — binding on the reviewer too

Other Claude sessions run headless Chrome here. **Never kill a process by name, binary path or
command-line pattern**; stop only a browser your own probe started, through its own handle. No more than
three browsers at once. Chrome is `/usr/bin/google-chrome`; it fails to start when `TMPDIR` is a very long
path. Probes go in a scratch folder outside the checkout; the checkout is read-only for a reviewer.
