# Task 8 — Calling an outside model: report

**Status: DONE_WITH_CONCERNS.** The concerns are small and listed last. Commit `6a61119 feat: describe sends a brief to an outside model without exposing its key` on `v2-pipeline`.

## What I implemented

`scripts/describe.mjs`, one file: it exports `describe(...)` and is the CLI, built on `scripts/lib/cli.mjs`. I did not add `scripts/lib/key.mjs`. The key reading is about 40 lines, and keeping it in the same file keeps the one redaction function next to every place that writes.

- **Interface.** `describe({ provider, model, briefPath, outPath, profilePath, endpoint, timeoutMs, env = process.env })` returns `{ ok, chars, seconds, errors }`. `errors` is an addition to the brief's interface: the reasons the answer is not one valid proposal (empty when it is one), redacted, so the CLI can print the first ten. Also exported: `baseOf(endpoint)`, the pure address check, which lets the `https:`-to-a-real-host branch be tested without any network; `DescribeError`; and `DEFAULT_TIMEOUT = 300000`.
- **CLI.** `--provider --model --brief --out --profile [--endpoint] [--timeout]`. Any other flag is bad usage, including `--key`, `--keys-file` and `--api-key`, and so is a positional argument.
- **Order inside `describe()`.** Provider name, then **profile**, then **usage** (model, endpoint, timeout, `--out`), then **brief**, then **key**, then **request**. The brief sits between usage and key, so the key is looked up last, just before it is used. The rulings' order "profile, usage, key, request" holds.
- **Providers.** The request and answer shapes are exactly the brief's. `content-type: application/json`, `redirect: 'error'`, built-in `fetch` under an `AbortController`. The timeout covers the whole exchange, including a body that stops halfway. `dns.setDefaultResultOrder('ipv4first')` is at the top.
- **The key.** It comes from `env[NAME]`, trimmed, with empty meaning unset. Otherwise it comes from the keys file the profile's `keys-file` names: absolute, `~/` (home), or relative to the profile's folder. From that file only a line exactly `NAME=value` or `export NAME=value` is taken; the last such line wins, as when the file is sourced. One pair of matching quotes is stripped, an empty value is unset, and every other line is passed over without being kept.
- **Redaction.** `redact(text)` is the one function that takes a key out of text. It replaces every key this process has found, longest first, with `[key]`. A key is noted the moment it is found, before it is used. Everything goes through it: standard output, standard error, both files, and every `DescribeError` message (in its constructor). The answer text is also redacted *before* it is parsed. That matters: `validate` truncates long values, so a long echoed key would otherwise appear as a prefix that an exact match cannot find.
- **One addition the rulings did not name: a key must be one word of visible ASCII with no `"` and no `\`.** Otherwise it is refused, by variable and source, never by value. Without this, ruling 8 cannot hold: `fetch` trims header whitespace, so a key with a trailing space or newline would be sent and echoed in a form exact-value redaction misses. A key with an invalid header character makes `fetch` throw a `TypeError` whose message contains the value.
- **Errors and statuses.** A provider's error body is never read: the status gets the fixed sentence of its class. A redirect gets its own fixed sentence. A network failure gets a fixed sentence and its code, with no message and no stack. A 2xx without text gets a fixed sentence, plus the provider's reason only when it matches `^[A-Za-z_]{1,40}$`.
- **Files.** A valid answer is written whole (staged beside the target, then renamed) and removes an earlier `<out>.raw.txt`. Anything else writes the redacted raw answer to `<out>.raw.txt` and removes an earlier `--out`. Folders above `--out` are made when missing, as `merge` does.
- **Output.** `printResult` is the only writer to standard output, one line: `openai test-model: 1234 characters in 3.2 s`. It is printed after any answer, valid or not, and never on a refusal. Everything else goes to standard error, **help included** (rulings 15 and 18).

## What I tested, and the results

`tests/describe.test.mjs`: **43 tests**. The brief's seven, plus at least one for every ruling in section B, plus the static test of ruling 18.

- **Fake providers only.** Every provider is a `node:http` server the test starts on `127.0.0.1:0`. Each is closed with its sockets destroyed in `t.after`.
- **Made-up keys only.** Every key is made up (`test-key-0000-not-real`). Every in-process call goes through `call()`, which refuses `process.env`. Every child gets the inherited environment with `OPENAI_API_KEY` and `GEMINI_API_KEY` deleted, plus the made-up key where wanted. Every CLI run asserts the key reached neither standard output nor standard error.
- **No key file names.** Fake dotenv files are written at run time as `made-up/fake-dotenv.txt`. None is committed.
- **Watched environment.** A recording `Proxy` stands in for the environment, to prove that a refusal looked no key up.
- **Bounded timeout tests.** The two timeout tests carry their own 15 s limit, so a regression fails the test instead of hanging the suite.
- **Assertions print nothing secret.** Every assertion about a key or header compares and prints only `true`/`false`.

Results:
- `env -u OPENAI_API_KEY -u GEMINI_API_KEY node --test tests/describe.test.mjs`: 43 pass, 0 fail, about 3.6 s. The output holds no stray line, and nothing is left in `tests/.tmp`.
- `env -u OPENAI_API_KEY -u GEMINI_API_KEY npm test`: **457 tests, 456 pass, 0 fail, 1 skipped**. The skip is the known NTFS folder-mode test. 191 s.

## TDD evidence

**RED, first form.** `node --test tests/describe.test.mjs` with no script:
`ERR_MODULE_NOT_FOUND ... scripts/describe.mjs` (`# tests 1`, `# fail 1`). Expected: the script does not exist.

**RED, second form.** A stub exporting the four names with no behaviour (`describe()` returns `{}`):
`# tests 41`, `# pass 0`, `# fail 41`. The failures are behavioural: 12 runs were not refused, 21 values were wrong (for example an exit of 0 where 1 or 2 was due, or `0 !== 1` requests), there were 9 cases of no request where one was due, and the static test found no `printResult`. That confirms each test exercises behaviour, not just loading.

**GREEN.** Same command: `# tests 41`, `# pass 41`. The tests then grew to 43 (see the next section), all passing; after that, the full suite as above.

Two failures found and fixed after the first green, each pinned by a new test:
- **A real bug.** When the folder that should hold `--out` is a file, `rmSync(staged, { force: true })` in the cleanup throws `ENOTDIR`, because `force` only forgives `ENOENT`. A raw error escaped in place of the `DescribeError`. The cleanup is now guarded.
- **Order-dependence in a new test.** Earlier in-process calls leave other made-up key variants in the module's set, for example `"…"` with its quotes. The test now asserts only that `[key]` is present and the key absent.

## The hand-mutation (ruling 17)

I ran 95 mutations with a runner in the scratchpad. Each target text had to occur exactly once; the runner applied the mutation, ran the test file with the two key variables unset, and restored the original after every mutation (checked: the same sha256 before and after). **95 of 95 are killed.**

- **First pass: 94 of 95 killed.** The survivor was `baseOf`'s `typeof endpoint !== 'string'` guard, which I had added myself. It is now pinned: a `URL` object, a number and `null` must each be refused. Killed on rerun.
- **What the mutations covered.**
  - Every guard, and each half of each compound condition: engines-on as a list *and* holding the engine; `https:` *or* (`http:` *and* loopback); user *or* password; `?` *or* `#`; 401 *or* 403.
  - The order: usage before profile, key before usage, brief before usage, and key before brief.
  - The redaction: redact as a no-op, the key never noted, the answer parsed before redaction, errors handed back unredacted, a thrown error unredacted. File, standard-error and result-line writes without redact are caught by the static test of ruling 18.
  - Status classes, the network sentence, redirect `follow` and `manual`, the trailing slash, each loopback name, the model pattern, the timeout's default and its two checks.
  - The timer, the body read outside the timer, and the signal.
  - Extra request parameters, `content-type`, a trimmed brief, a blank brief, `key=` in the Gemini address.
  - Each answer-format rule: the whole object, two blocks, another language, an unclosed block, a list.
  - The engine and model override, the sealed form, both removals of earlier files, ten versus eleven errors, the reason token and its length, `blockReason`, a blank answer, the joining of Gemini parts.
  - The staged write, the staging cleanup and its failure, a second line on standard output, help on standard output, the `.json` check, positional arguments, a missing flag.
- **The three timeout mutations.** "Never fires", "body read outside it" and "no signal" were first killed only by the file timing out under `--test-timeout`. That exposed that the suite itself could hang on such a regression, so the two timeout tests got their own 15 s limit. Rerun, each is killed by name: test 7 and/or the stops-halfway test. The suite ends and no child process is left behind.
- **Not pinned, on purpose:**
  - The last-line-wins choice in the dotenv file. No ruling asks for it; it is documented in a comment.
  - The `CODE` filter on error codes. Every code a real failure gives already matches it, so it is defence only.

## Files changed

- `scripts/describe.mjs` (new, 474 lines)
- `tests/describe.test.mjs` (new, 996 lines)

## Self-review: findings and concerns

1. **Help goes to standard error**, with exit 0, unlike `merge`/`accept`. Ruling 15 says "everything else goes to standard error", and ruling 18 allows no `process.stdout.write` outside `printResult`.
2. **The order outside `describe()`.**
   - The CLI must read its flags before it can call `describe()`. Unknown flags, a missing flag, an unknown `--provider`, and the *syntax* of `--timeout` (through the kit's `readTimeout`) are therefore refused before the profile is read.
   - Inside `describe()`, the provider name is checked first, because the profile check names `model:<provider>`. Everything else follows the order above.
   - So, on the command line, a malformed `--timeout` is reported before an engine-off profile, while a bad `--model`, `--endpoint` or `--out` is reported after it. Both are pinned.
3. **The found-keys set is module state.** It only grows, which is safe even for concurrent calls. The cost: in a long-lived process that calls `describe()` more than once, every key found so far is redacted from later output, so an unrelated longer variant can swallow surrounding quotes. That is cosmetic only, and the CLI is one run per process.
4. **The limit of exact-value redaction.** If a provider echoes the key back in JSON escapes (`test-…`):
   - `--out`, the errors handed back and the errors printed are covered, because they are made from the parsed value. This is pinned by a test.
   - `<out>.raw.txt` is not covered. It keeps the answer as it came, and the escaped text is not the exact value.
   - Only a provider that echoes keys in escaped form reaches this case.
5. **Choices that go slightly beyond the rulings:**
   - the key-character rule (explained above, needed for ruling 8);
   - `.json` accepted in any case, as `merge` reads proposals;
   - folders above `--out` made when missing, as `merge` does;
   - neither the endpoint nor the model is shown back in its usage error, since either could hold a pasted secret before the key is known.
6. **No documentation was changed.** The brief names only the two files, and the README lists no scripts.
7. **Four leftover folders in `tests/.tmp`** came from the mutation runs that `--test-timeout` stopped before their `after` hook. I removed them. Normal runs, including `npm test`, leave none.

---

## Fix report — the controller's rulings

**Status: DONE.** Commit `5fdb920 fix: an answer that holds the key is never saved, and --help goes to standard output` on `v2-pipeline`. Same two files, staged by path, no push and no amend.

Stand, unchanged: a malformed `--timeout` refused before the profile is read; `describe()` returning `errors`; the module-level set of keys seen; the one-word key rule (R111); the two earlier fixes.

### Change 1: an answer that holds the key is not saved at all (R110)

- **The check.** Once the answer's text is known, `describe()` checks whether it holds the key of this run, either as written or after JSON's escapes are undone. The undoing is one `replace` over the whole text: `\uXXXX`, `\"`, `\\`, `\/`, `\b`, `\f`, `\n`, `\r`, `\t`.
- **If it does,** nothing of the answer is written: no `--out`, no `<out>.raw.txt`, and both are removed if an earlier run left them. `describe()` returns `{ ok: false, heldKey: true, chars, seconds, errors: [] }`.
  - The CLI still prints the result line.
  - On standard error it prints one fixed sentence (exported as `HELD_KEY`): `the answer held the key, so nothing of it was saved: no proposal and no raw file`.
  - It exits 1.
- **Every other return** now carries `heldKey: false`.
- **`redact` is unchanged** and still guards every printed or written string. Two uses of it became dead and are removed: the pre-parse redaction of the answer, and redacting the errors handed back. Past the check, the parsed answer cannot hold this run's key. That holds because the check undoes exactly the escapes `JSON.parse` decodes, scanning left to right the same way, and a fenced block begins after a newline, which no escape can span.
- **Tests replaced and added.** The four "[key] in the raw file / proposal / errors" tests are replaced by three:
  1. **The key as written:** in an otherwise valid Gemini proposal, and in OpenAI prose where a backslash before the key would read as `\t` once escapes were undone, so only the as-written check catches it. Both runs start with an earlier `--out` and `.raw.txt`, and both are removed. Each run: no file, the sentence, exit 1, the result line printed. An in-process call returns `heldKey: true`.
  2. **The key in `\u` escapes** (`t…`, with an upper-case `-`) inside a JSON string of an otherwise valid proposal, and **a key with a slash written `\/`**. Same outcome. The test also checks that the same answer without the key is valid.
  3. **The key `\u`-escaped inside prose** (the not-valid path): no `.raw.txt`.

  In each, neither the key nor its escaped form is in any file under the test's folder, and neither appears in either stream. The keys-file test (its echo now holds the key) asserts the sentence and no raw file. The first test asserts `heldKey: false` on a valid run.

### Change 2: `--help` on standard output (R112)

- `printUsage()` writes the usage to standard output, through `redact`, and the run exits 0. It is the second named place that writes to standard output, beside `printResult`.
- Usage errors still go to standard error, with the usage after them.
- The help test checks `--help` and `-h`, each given before a full set of flags: exit 0, the whole usage on standard output (start and end checked), nothing on standard error, no request made.
- The static test now finds both functions, checks each writes standard output once and through `redact`, and checks nothing else writes standard output.

### TDD evidence

- **RED:** `env -u OPENAI_API_KEY -u GEMINI_API_KEY node --test tests/describe.test.mjs` gave `# tests 42`, `# pass 35`, `# fail 7`, all for the right reason:
  - `heldKey` undefined (test 1);
  - the not-valid message where the held-key sentence was due (13, 20);
  - the proposal saved, exit 0 (18, 19);
  - help not on standard output (41);
  - no `printUsage` (42).
- **One failure was the test's own fault and was fixed in the test:** test 19 first failed because the proposal's `hardest` holds quotes, which I had spliced into the JSON unescaped.
- **GREEN:** same command, `# tests 42`, `# pass 42`.
- **Whole suite:** `npm test` gave 456 tests, 455 pass, 0 fail, 1 skipped (the known NTFS test). The count is one lower than before because four tests became three.
- After two comment-only edits made once the suite had finished, the file was rerun: 42 of 42.

### Hand-mutation

I reran the whole earlier set on the new code, plus 19 new mutations: 111 in all, with two re-targeted. **108 killed.**

- **Killed, among the new ones:**
  - the held-key check dropped, and each of its halves (as written; escapes undone);
  - `\u` not undone; upper-case hex not undone; `\/` not undone;
  - an earlier proposal or raw file kept in the held-key path;
  - `heldKey` not set, or `ok: true`; `heldKey` missing on a valid run;
  - exit 0; no result line; a different sentence;
  - help back on standard error; the usage not through `redact`.
- **Re-targeted:** two earlier mutations (an earlier raw file kept after a valid answer, an earlier proposal kept after an invalid one) no longer applied, because `remove(raw)` and `remove(outPath)` now also occur in the held-key path. Re-targeted at the valid and not-valid paths, both are killed.
- **Dropped as obsolete:** the mutations of the removed pre-parse redaction, of redacting the returned errors, and of the old help-on-stderr behaviour.
- **Not pinned, deliberately (3):** leaving `\\`, `\"` or `\b \f \n \r \t` out of the escape set. Each such mutation can only make the check refuse *more*, never save more:
  - none of these characters can be part of a key (R111);
  - only `\\` changes how the text is split into escapes, and leaving it out decodes more, not less.

  Pinning them would mean a test that asserts an answer holding `\\u0074est-key-…` (the key, one decode away) *is* saved. I would rather not codify that.
- Two `describe-*` folders left by the two timeout mutations, which fail at file level, were removed. No child process outlived them, normal runs leave none, and the script's hash was the same before and after every run.

### Files changed

- `scripts/describe.mjs`
- `tests/describe.test.mjs`

---

## Fix report — after the review

**Status: DONE.** Commit `e6a213d fix: describe sends only to the provider's own address, and smaller findings` on `v2-pipeline`. Four files, staged by path, no push and no amend.

### The seven changes

- **R115, loopback only.** `--endpoint`, and `describe()`'s `endpoint`, accept only `http:` or `https:` to `127.0.0.1`, `localhost` or `[::1]`. There is still no user, password, query or fragment, and any other host is bad usage (exit 2) before any key is read.
  - Without the flag, the provider's own address is used as it is, without going through `baseOf`.
  - The usage text says `--endpoint` is a local stand-in for the provider, as in the kit's tests.
  - The old "any https host is accepted" cases now pin the refusal. `https://api.openai.com` and `https://generativelanguage.googleapis.com` are refused both in `baseOf` and on the command line.
  - A new test leaves `--endpoint` out and shows the run passing the usage check and stopping at the (missing) brief.
  - Every test that names a host other than this machine either runs with no key and no keys file, or also lacks a brief. Even under mutation, such a run stops before any request.
- **R114, earlier files go just before the request.** Once every refusal has passed, `--out` and `<out>.raw.txt` are removed just before `ask()`. The later removals on the valid, not-valid and held-key paths are therefore gone.
  - Test: stale files of both kinds are gone after a 500, a 200 without text, a timeout and a network failure.
  - The same files remain after an engine-off profile, bad usage, a missing brief and no key.
  - **Two tests changed meaning:**
    - The staged-write test: the earlier `--out` is now gone before the write, so it asserts no part of `--out` and nothing staged.
    - The "path that holds the key" test: an `--out` under a file can no longer be cleared, so the run now refuses with `cannot remove …` *before sending*, and the test asserts no request.
  - **One test added:** the guarded staging cleanup accepted earlier can now be reached only by a race. A preload turns the folder into a file just as it is made, and the failure must be the write's, on one line.
- **M1.** The text test pins `endpoint: 'https://api.openai.com',` and `endpoint: 'https://generativelanguage.googleapis.com',`, each exactly once. It also requires exactly four `https://` in the script: those two, plus the usage naming them. Finally it requires `import dns from 'node:dns';` and one top-level `dns.setDefaultResultOrder('ipv4first');`.
- **M2, the timeout ceiling.**
  - `scripts/lib/cli.mjs` exports `MAX_TIMEOUT = 2147483647`. `readTimeout` refuses anything above it with its own message: `--timeout must be at most 2147483647 milliseconds, the longest a timer can wait; it is "…"`.
  - The existing whole-number message is unchanged, because the `shots` and `accept` tests pin it word for word.
  - `describe()`'s own check has the same ceiling: `--timeout must be a whole number of milliseconds from 1 to 2147483647, as 30000`. Its usage text states the range. The `shots` and `accept` usage texts state no range, so they are unchanged.
  - Tests: `tests/cli.test.mjs` takes `2147483647` and refuses `2147483648` and `9007199254740991`. `tests/describe.test.mjs` refuses `2 ** 31`, both in process and on the command line, and takes `2 ** 31 - 1`, both ways. The answer comes at once, so nothing waits for it.
  - *Not changed:* the module-level timeout checks of `shots` and `accept`, which this round did not name.
- **M4, a throw from `validate`.** It becomes one not-valid error, `the answer could not be checked against the walkthrough format (it may be nested too deeply)`, so ruling 14's not-valid path runs: the raw file, the result line, exit 1.
  - Test: an answer nested 20,000 containers deep. `JSON.parse` reads it and `validate` overflows (both checked first).
- **M5.** One leading U+FEFF is dropped from the dotenv text before its lines are read. Tested with the wanted name on the first line.
- **M6 + M7.**
  - The `readArgs` comment now says what is shown back: a path, or a `--timeout` that is not a number of milliseconds.
  - The text test now counts names: `process.stdout` exactly 2, `process.stderr` exactly 1, `writeFileSync(` exactly 1.
  - It forbids, by name, `appendFileSync`, `appendFile(`, `createWriteStream`, `writeFile(`, `writeSync(`, `fs/promises`, `fs.promises` and `promises.`.

### TDD evidence

- **RED:** `node --test tests/describe.test.mjs tests/cli.test.mjs` gave `# tests 52`, `# pass 42`, `# fail 10`, each for the right reason:
  - no ceiling in `readTimeout`;
  - the BOM hides the line;
  - other hosts are accepted. Note that the provider's own address, accepted at that point, stopped at "no key" with exit 1, so nothing was sent;
  - the old timeout message;
  - the order test's named provider address getting past the usage check;
  - stale files left after a 500;
  - no result line for the deep answer;
  - the earlier `--out` still there after the failed write;
  - five `https://` in the source.
- **GREEN:** the same command, after one test was adjusted to the new early refusal and the race test was added: `# tests 53`, `# pass 53`.
- **Whole suite:** `npm test` gave **461 tests, 460 pass, 0 fail, 1 skipped** (the known NTFS one). No folder is left in `tests/.tmp`.

### Hand-mutation

- **`scripts/describe.mjs`: 132 mutations, 129 killed.**
  - The earlier set was carried over. Mutations of removed code were dropped, and those whose target text changed were re-targeted.
  - **New, all killed:**
    - the loopback-only rule, and each of its parts: any host, any scheme, `http:` not taken, `https:` not taken;
    - the default not taken when none is given; each default address changed; the `dns` line dropped, or `verbatim`;
    - R114: each half dropped, and the clearing moved before the profile, the usage, the brief or the key, or after the answer;
    - the `validate` throw not caught, and its reason changed;
    - the BOM kept;
    - an alias of standard output, an alias of standard error, an `appendFileSync`, a `createWriteStream`, an `fs/promises` writer, a second file write, a third `https` address;
    - the timeout's ceiling dropped, the ceiling itself refused, and 0 allowed.
  - **The three survivors** are the known cautious-only equivalents (leaving `\\`, `\"` or the control escapes out of the escape set), unchanged since the last round.
  - **One runner quirk:** the BOM mutation first failed to apply, because the tool turned the six characters `﻿` in my commands into a real U+FEFF. Rebuilt with `chr(92)`, it is killed.
- **`scripts/lib/cli.mjs`: 3 of 3 killed** (`tests/cli.test.mjs` with `tests/describe.test.mjs`): the ceiling check dropped, the ceiling itself refused, and the ceiling one higher.
- **Not run, on purpose:** making `describe()` ignore `--endpoint` in favour of the default. Every test would then send the made-up key to the real providers, which section A forbids. Every test that serves the answer from its local server would fail under it, because no request would reach that server.
- After every run, each script's sha256 was the same as before. Two `describe-*` folders were left by the two ceiling mutations; a normal run of both files leaves none, and I removed them.

### Files changed

- `scripts/describe.mjs`
- `scripts/lib/cli.mjs`
- `tests/cli.test.mjs`
- `tests/describe.test.mjs`

---

## Fix report — the flaky test

**Status: DONE.** Commit `f81dab7 fix: the describe tests pass over a mount's hidden leftovers` on `v2-pipeline`. One file, `tests/describe.test.mjs`, staged by path, no push and no amend.

### The fix

- **One helper for the exact listings.** Every assertion in `tests/describe.test.mjs` that lists a folder to say "nothing is left" or "exactly these names" already went through `filesIn`; there are 16. `filesIn` now passes over names that begin with `.fuse_hidden`. The new constant `MOUNT_LEFTOVER` carries a comment saying why: the FUSE mount keeps, for a moment, a file removed while some process holds it open. Nothing else is loosened. A name that only *holds* the word (`a.fuse_hidden0002`) is still listed.
- **The key check is not loosened.** `anyFileHolds`, the check that the key is in no file, still lists and reads every file under the folder, the `.fuse_hidden…` ones included.
  - One change there: a leftover that is *already gone* by the time it is read (`ENOENT`) is passed over, where it would otherwise throw a second flake.
  - That applies only to an `ENOENT` *and* a leftover name. Any other error, or the same error on any other name, still fails the check.
- **A new test proves the helper:**
  - a folder holding `.fuse_hidden0001` and nothing else counts as empty;
  - with `model openai.json` and `a.fuse_hidden0002` beside it, both are listed;
  - a leftover holding the made-up key is found by `anyFileHolds`.

  I hand-mutated it three ways; each is killed with its own message:
  - the filter dropped ("a folder holding only a leftover is empty");
  - the filter matching anywhere in the name ("a folder holding more is not");
  - `anyFileHolds` skipping leftovers ("a leftover holding the key is found").

  Not pinned: the `ENOENT` pass-over, which only a race can reach.

### Does `scripts/describe.mjs` leave a handle open?

No. It touches files only through `readFileSync`, `writeFileSync`, `renameSync`, `mkdirSync` and `rmSync`, and each opens, acts and closes before it returns. It has no `open`, stream or file handle.

At each removal (R114's two `rmSync` calls before the request, and the staging cleanup), the script holds nothing open on that file. The tests do not either: every CLI child has exited before a listing, and in-process calls are synchronous at that point.

So the open handle belongs to some other process on the machine. That could be the read-only review running in this checkout, an editor or indexer watching the tree, or the mount's own delay. There is nothing to close in the script, and it is unchanged.

### Runs

`env -u OPENAI_API_KEY -u GEMINI_API_KEY node --test tests/describe.test.mjs`, ten times: 48 of 48 every time. Nothing was left in `tests/.tmp`. As asked, I did not run the whole suite.

### The same shape elsewhere (listed only, not fixed)

The shape is a folder listed right after a removal, with an exact expectation.

**`tests/shots.test.mjs`** has nine. In each, a test seeds "an older picture" (with `writeFileSync`, which closes it). `shots` then removes it (`removeOlder` → `unlinkSync`), and the test asserts `readdirSync(out)` exactly. The pairs are seeding line → listing line:
- 322 → 337;
- 357 → 363;
- 376 → 382;
- 465 → 470;
- 482 → 485;
- 593 → 596;
- 1166 → 1173;
- 1244 → 1251;
- 1281 → 1288.

The check at 424 (`existsSync` of the removed name) is not exposed: a leftover takes another name.

**`tests/merge.test.mjs`:**
- **891–893** (two merges into one board): the losing merge's staging folder is removed (`rmSync`, recursive). Then `readdirSync(dirname(board))` must equal `[MAP, 'board']`, and `lettersOn(board)` must equal the three letters.
- **909** (two merges into two boards side by side): the other board is removed in `seal`. Then `readdirSync(folder)` must equal `[MAP, <winner>]`.
- **942 and 960** (a board that cannot be written whole): the staging folder is removed and the folders made above it are unmade. Then `readdirSync` must equal `[]` and `snapshot` must equal `{ board: {} }`.
- **699–703**: the test's own `rmSync(board, { recursive: true })`, then a `snapshot(dir)` taken right after it, compared exactly with one taken after a refused merge.
- **Lower exposure:** 199, 743 and 986 follow only the removal of an *empty folder* (`removeIfEmpty`, then the rename). No file is removed there, so no leftover is expected.
- **An observation on the script, not a test:** `merge` refuses a board folder that is not empty. A `.fuse_hidden…` leftover inside one would therefore read as "not empty" on this mount.

**`tests/accept.test.mjs`:** none. It lists no folder.

**`tests/package.test.mjs`:** none. Its one `readdirSync` (line 25) is inside a copy helper, not an assertion.
