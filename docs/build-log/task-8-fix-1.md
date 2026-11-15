# Task 8 — after the review: seven small changes

The review (head `5fdb920`) **approved** the task: no critical and no important issue; about 120 probe
runs against local servers with a made-up key found no door for the key, no error body and no other
dotenv line in any stream or file. It left eight minors. Seven are fixed now, because each is cheap and
most are about where a key or a brief can go; two of them change a ruling of mine. Each needs a committed
test that fails without it.

Line numbers are in `scripts/describe.mjs` at `5fdb920` unless another file is named.

## Two changes of rule

**M8 → Ruling R115 (replaces the endpoint part of ruling 11).** `--endpoint`, and the `endpoint` argument
of `describe()`, accept **only a loopback address** (`127.0.0.1`, `localhost`, `[::1]`; `http:` or
`https:`; still no user, password, query or fragment). Any other host is bad usage (exit 2), before any
key is read. Without `--endpoint`, the request goes to the provider's own address and nowhere else. The
profile's leave names an engine, not a host; a command line is written afresh by an agent on every run,
and it must not be able to say where a key goes. The usage text says what `--endpoint` is for (a local
stand-in, as in the tests). The test at `tests/describe.test.mjs:671-673` that pins "any https host is
accepted" now pins the refusal; add `https://api.openai.com` itself as a refused value of the flag (the
default is reached by leaving the flag out).

**M3 → Ruling R114.** Once every refusal has passed and the request is about to be made (`:132`), an
earlier run's `--out` and `<out>.raw.txt` are removed. So after a run that sent a request, whatever is on
disk is that run's: a 500, a 200 without text, a timeout or a network failure leave neither file. A run
that is refused before anything is sent (engine off, no key, bad usage, no brief) leaves the disk as it
was. Tests: stale files of both kinds before a 500, before a timeout and before a 200 without text are
gone afterwards; before an engine-off refusal they remain.

## Five smaller ones

- **M1.** The two default endpoints (`:40`, `:53`) and the `dns.setDefaultResultOrder('ipv4first')` line
  (`:34`) are read by no test: a changed default host would send a real key there with the suite green.
  Pin the two literals (`https://api.openai.com`, `https://generativelanguage.googleapis.com`) and the
  `dns` line in the text test (`tests/describe.test.mjs:1015-1035`), with no network.
- **M2.** A `--timeout` of 2^31 ms or more is accepted and then fails at once with Node's
  `TimeoutOverflowWarning`. `readTimeout` in `scripts/lib/cli.mjs:46` refuses a value above 2147483647
  as bad usage, for every script that uses it (`shots`, `accept`, `describe`); `describe()`'s own check
  of `timeoutMs` (`:123`) has the same ceiling; the usage texts that state a range say it. Tests in
  `tests/cli.test.mjs` and `tests/describe.test.mjs` (`2 ** 31` refused, `2 ** 31 - 1` accepted by the
  parser — do not wait that long).
- **M4.** A throw from `validate` (`:156`; containers nested 20,000 deep overflow its recursion) ends the
  run through the catch-all with no result line and no raw file. Treat a throw from `validate` as one
  not-valid error with a fixed sentence (the answer could not be checked), so ruling 14's not-valid path
  runs: the raw file, the result line, exit 1. Test: a fake server answering a valid-looking object nested
  deep enough to overflow. (No cap on the answer's size in this round.)
- **M5.** A BOM before the first line of the dotenv file hides that line (`valueIn`, `:250-258`). Drop
  one leading U+FEFF, as the kit's other readers do. Test with the wanted name on the first line.
- **M6 + M7.** The comment at `:425` ("Nothing a flag holds is shown back but a path") is untrue for a bad
  `--timeout`; correct it. The text test (`tests/describe.test.mjs:1026-1031`) has blind spots: count the
  occurrences of `process.stdout` and of `process.stderr` (so an alias such as
  `const out = process.stdout` fails it), and forbid `appendFileSync`, `createWriteStream`, `writeFile(`
  and `fs.promises` writers by name, beside what it checks now.

## Not fixed

The size cap of M4, and `NAME=value # comment` in a dotenv file (it is refused without showing anything,
which is safe).

## Rules unchanged

Section A of the rulings above all: no real provider, no real key, never print the environment, never
open a real keys file. Never kill a process by name or pattern. Stage by explicit path; commit on
`v2-pipeline`; never push, never amend. `scripts/lib/cli.mjs` is shared: run `npm test` once at the end
(about three minutes) and report the count.

Commit: `fix: describe sends only to the provider's own address, and smaller findings`, with the same two
trailer lines. Hand-mutate the new conditions. Append "Fix report — after the review" to
`task-8-report.md` and reply with the short status contract.
