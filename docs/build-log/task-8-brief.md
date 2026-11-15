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

