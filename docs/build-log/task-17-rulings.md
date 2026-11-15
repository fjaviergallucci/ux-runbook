# Task 17 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

1. **The tests of `tests/skills.test.mjs` already exist** (Task 13): un-`todo` the two. Each header writes
   `description: "…"` in double quotes with the text of Task 13's table verbatim; the kit-root sentence
   exactly as fixed; the six sections in order; at most 200 lines; only paths that exist today. Read
   `skills/design/SKILL.md` with `references/loop.md` and `fresh-pass.md`, and `skills/structure/SKILL.md`
   first, and use their words for the same things.
2. **Every command is given as the script takes it.** Read the header and `--help` of `scripts/shots.mjs`,
   `scripts/accept.mjs`, `scripts/page.mjs`, `scripts/render.mjs` and `scripts/describe.mjs` before
   writing a step that runs one.
3. **Detail hands each seat what its card says it reads, and nothing its card forbids.**
   - The interaction designer writes the states, the rules, the **data map** and the **dependencies**
     into `05-detail/` as its card and the template say (`DETAIL.md` holds `## Rules`, `## Data map`,
     `## Dependencies`; `states.md` the states table).
   - The interface writer is briefed with the founder's own lines from the context; `strings.json`
     carries each string's why-line, and the words judge is handed the strings with them (ruling R126).
   - A truth finding that needs something the product lacks becomes a line under `## Dependencies` and a
     question to the founder — never a silent removal.
   - Blocking findings are fixed in **one** round by the maker whose artefact it is, and re-read by a
     **fresh** instance of the same judge, handed its seat's earlier ledger: it reads cold first, then
     marks each earlier finding *fixed · partly · still present* (ruling R127). Anything still open after
     that goes to the founder with the gate; there is no second round.
4. **Look, inside a system:** one visual designer; static pages that link the project's token file in
   the project kit folder; variants only on one named axis; the measured-values table (`measures.md`) is
   written from what `scripts/accept.mjs` and `scripts/shots.mjs` return, never by eye.
5. **The fresh pass at Look** (ruling R121): the fresh brief names the **one screen** the visual designer
   is drawing and carries that screen's approved structure, states and strings; a fresh maker draws that
   screen with those words exactly and chooses only the paint. The fresh screens are kept in
   `06-look/fresh/` as they came and shown beside the system version on one decision page; the three
   outcomes are those of `references/fresh-pass.md`; a borrowed thing is rebuilt on the tokens by the
   visual designer and flagged in `LOOK.md` as a named extension of the system. Nothing a fresh maker
   made is handed off.
   - An outside text model at Look is run with `scripts/describe.mjs … --text` (added in Task 14): the
     answer is not a proposal, so `--text` writes it whole to `--out` and exits 0. The founder's yes to
     the fresh brief comes before anything is sent; the skill never passes `--endpoint` and never names
     a key or a keys file.
6. **Direction mode** (`references/direction.md`) as the brief describes; the pick becomes the tokens and
   the profile is updated — by a change the founder sees and approves, written under the profile's
   `## Design system`, never silently.
7. **A shared machine:** `shots` and `accept` are run one after another, never more than three
   browser-driving commands or seats at once; a seat that starts a browser stops only its own; no process
   is stopped by name or by pattern.
8. **Model and effort:** each seat is started on what its line of the approved cast sheet names; a dash
   means the session's model. The skills enforce none.
9. **The gates:** Detail's is on the prototype (he clicks it); the words are a separate question when the
   kind is first-run, message or public-page; Look's is on the finished screens beside their measures.
   Each is one page built with `scripts/page.mjs`, one question.
10. **Read of the design:** § 4.5, § 4.6, § 12, and the Detail and Look rows of § 24. Never the whole
    plan. Read the Detail and Look maker cards, the judges that sit at those stages, the task reader, and
    the templates under `templates/package/05-detail/` and `06-look/`.
11. Plain, short, second person; generic; examples from the fictional room-booking product.
12. **Gallery marks from Structure reach Look through `DECISIONS.md`** (Task 16's ruling 15): what the
    founder marked in a fresh pass's gallery at Structure — in the round he picked from, or in one he
    rejected — is read from the package's `DECISIONS.md`, never from `04-structure/earlier/`.
