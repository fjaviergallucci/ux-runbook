# Task 8 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

## A. This machine holds real keys — binding, before anything else

1. **No real provider and no real key, ever.** Every test and every probe talks only to an HTTP server the
   test itself starts on `127.0.0.1` (port 0). Nothing you run may contact `api.openai.com` or
   `generativelanguage.googleapis.com`.
2. **Never print the environment.** No `env`, `printenv`, `set`, `export -p`, `echo $OPENAI_API_KEY`,
   `node -e 'console.log(process.env…)'`, nor any command whose output could carry a variable's value. This
   machine's environment may hold real keys. If you need to know whether a variable is set, you do not
   need to know: the tests below never depend on it.
3. **Never open a real keys file.** No real dotenv, `.env`, `keys.env` or credentials file on this machine
   is read, listed by content, or named on a command line. A guard on this machine denies such calls; a
   denied call means stop and think, never find another way to run it.
4. **Every key in a test is made up by the test** (for example `test-key-0000-not-real`), and a fake
   dotenv is written by the test at run time under `tests/.tmp/<fresh folder>/`. No file that looks like a
   credentials file is committed: no fixture named `.env`, `*.env`, `keys*`, `secrets*`.
5. **No test inherits a key.** `describe()` takes an optional `env` (default `process.env`); every
   in-process test passes its own object. Every child process a test starts gets an environment the test
   builds: the inherited one with `OPENAI_API_KEY` and `GEMINI_API_KEY` **deleted**, then the fake set on
   purpose where the test wants one. So no assertion can ever print a real value: the header the fake
   server receives is always the made-up one.

## B. What the script must do

6. **Outside engines are off unless the profile turns them on** (design § 24: "Off unless the project
   profile turns it on, because the brief leaves the machine"). `describe` reads the profile first and
   refuses — exit 1, before any key is looked up and before any request — unless the profile's
   `engines-on` list holds `model:<provider>` (`model:openai`, `model:gemini`). The message names the key
   and the value to add. A profile that cannot be read or parsed is a refusal that names the file.
7. **The key is found by name, inside the script.** First `env[NAME]`; if that is unset or empty, the
   dotenv file at the profile's `keys-file` (absolute; a leading `~/` is the home folder; a relative path is
   resolved against the profile's folder). From that file the script takes **only** a line that is exactly
   `NAME=value` or `export NAME=value` for the one wanted name, strips one pair of matching single or
   double quotes around the value, and keeps nothing else: no other line's text is stored, logged or put
   in an error, and a line it does not understand is passed over in silence. An empty value is unset.
   - No key anywhere → exit 1: the message names the variable and says it may be set in the environment
     or in the file the profile's `keys-file` names. It never shows a value or any text of the file.
   - `keys-file` named but unreadable → exit 1 with the path and the error's code (`ENOENT`), nothing more.
   - The CLI has no way to take a key or a keys-file path: `--key`, `--keys-file` and any other unknown
     flag are bad usage (exit 2), pinned by a test.
8. **The key never leaves by any other door.** It is not in the URL (either provider), not in standard
   output or error, not in `--out`, not in `<out>.raw.txt`, not in a thrown error's message or
   properties, and never handed to a child process. Every string the script prints or writes passes
   through **one** function that replaces the exact key value with `[key]`. Tests: a fake server that
   echoes the request's key header back inside a 200 answer (the raw file must not hold it), and one that
   echoes it in an error body.
9. **A provider's error body is never shown or saved.** On any status outside 2xx the script prints the
   status and one fixed sentence by class — 401/403 the key was refused · 404 the model or the address was
   not found · 429 the provider is limiting requests or the quota is spent · 5xx the provider failed ·
   anything else the request was refused — and exits 1. No part of the body reaches the screen or a file
   (providers echo fragments of keys in error bodies; the brief's `sk-secret` test is this rule).
   A network failure prints a fixed sentence and the error's `code`, never a stack.
10. **No redirect is followed** (`redirect: 'error'`): a custom key header is resent to wherever a
    redirect points. Test: the fake server answers 302 to a second local server, the run fails, and the
    second server received no request.
11. **The address.** The CLI gains `--endpoint <url>` and `--timeout <ms>` (the brief's CLI line lacks
    them; the tests need them). The endpoint must be `https:` unless its host is loopback (`127.0.0.1`,
    `localhost`, `[::1]`), and may carry no user, password, query or fragment; a trailing slash is
    tolerated. `--model` must match `^[A-Za-z0-9._-]+$` — it is placed in a URL path. `--timeout` is a
    positive whole number of milliseconds, default 300000. Each refusal here is bad usage (exit 2) and
    happens before any key is read.
12. **The timeout really stops it.** A request that never answers ends at `timeoutMs` with "no answer
    within N s", exit 1, and the process is gone promptly — the test asserts the run ends within
    `timeoutMs` + 2 s, and closes its own server with its sockets destroyed so the suite cannot hang.
13. **The request** is exactly the brief's: the body shapes given, `content-type: application/json`, no
    other parameter. The brief file's text is sent whole and unchanged; an empty or missing brief is a
    refusal (exit 1) before any request.
14. **The answer.** It holds one JSON object when (a) the whole trimmed text parses as an object, or (b)
    it has exactly one fenced block (```` ```json ```` or bare ```` ``` ````) whose content parses as an
    object — prose around that one block is allowed. Two blocks, or none and no bare object, is not an
    answer in the format. The script then sets `"engine": "model:<provider>"` **and** `"model": "<id>"`
    (the lessons file records the model each seat ran on), overriding whatever the answer said for those
    two keys, and runs `validate(proposal)` (unsealed).
    - Valid → written to `--out` as two-space JSON with a final newline, whole (staged, then renamed, as
      `merge` does); a `<out>.raw.txt` left by an earlier run is removed. Returns `ok: true`.
    - Not valid, or not in the format → the raw answer (through the function of ruling 8) goes to
      `<out>.raw.txt`; an `--out` left by an earlier run is removed, so the two never both exist after a
      run; the first ten validation errors go to standard error; exit 1; `ok: false`.
    - A 2xx with no text in the expected place (an empty answer, a blocked prompt, a body that is not JSON)
      → exit 1 with a fixed sentence; nothing of the body is printed or saved. It may add the provider's
      reason only when that is a short token matching `^[A-Za-z_]{1,40}$` (`finish_reason`,
      `finishReason`, `blockReason`).
15. **Standard output** is exactly one line holding the provider, the model, the characters of the answer
    and the seconds — on success and on a not-valid answer alike — and nothing else; a test pins the whole
    of standard output with one pattern. Everything else goes to standard error.
16. `--out` must end in `.json`. Exit codes as in the other scripts: 0 done · 1 a refusal or an answer not
    in the format · 2 bad usage. The CLI is built on `scripts/lib/cli.mjs`. Paths with a space work.

## C. Proof

17. Every rule above has a committed test that fails without it. Hand-mutate before reporting — each
    guard, each half of each compound condition, the redaction, the order "profile, then usage, then key,
    then request" — and list any you could not pin.
18. Add one test that reads `scripts/describe.mjs` as text and asserts it has no `console.log` or
    `process.stdout.write` outside the one function that prints the result line, and no `key=` in any URL
    it builds.

## D. Given after the implementer's first report

- **R110.** When the provider's answer text holds the key value — as written, or after JSON escapes are
  undone over the whole text — nothing of the answer is saved anywhere: no `--out`, no `<out>.raw.txt`,
  and files left by an earlier run are removed. One fixed sentence on standard error, exit 1; the result
  line on standard output is still printed. This replaces ruling 8's "the raw file must not hold it" test
  with a stronger one: the raw file does not exist. The function that removes the key from printed
  strings stays.
- **R111.** A key must be one word of visible ASCII, else it is refused without being shown (a key with a
  line break makes `fetch` throw with the header's value in its message).
- **R112.** `--help` prints the usage to standard output and exits 0, like the other scripts; the text
  check of ruling 18 allows that one more named place that writes to standard output.
- Accepted as built: a malformed `--timeout` is refused before the profile is read (the CLI parses its
  flags first); `describe()` also returns `errors` and `heldKey`; the set of keys seen lives at module
  level.
