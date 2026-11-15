# Task 16 — the controller's rulings

These bind with the brief. Where the brief and a ruling differ, the ruling wins and says so.

1. **The tests of `tests/skills.test.mjs` already exist** (Task 13): un-`todo` the `structure` ones. The
   header writes `description: "…"` in double quotes with the text of Task 13's table verbatim; the
   kit-root sentence exactly as fixed; the six sections in order; at most 200 lines; only paths that exist
   today. Read `skills/design/SKILL.md`, its `references/blind.md` and `fresh-pass.md`, and
   `skills/cast/SKILL.md` first, and use their words for the same things.
2. **The map and the pick sit beside the board, not in it** (rulings R57, R67). The brief's
   `board/MAP.sealed.json` is wrong: `scripts/merge.mjs` writes `04-structure/MAP.sealed.json`, and
   `PICK.md` is written to `04-structure/PICK.md` from `templates/outputs/PICK.md`, with the line
   `Pick: <letter | none>` and the founder's words under it. The board folder `04-structure/board/` holds
   the letters' files, the drawn pages and the pictures, and nothing else: a graft or a redrawn pick is
   never saved there as a one-letter `.json`. Readers are handed **the board folder only**, never its
   parent; their briefs list the map, the proposals folder and the makers' files under "Do not open".
3. **Every command is given as the script takes it.** Read the header and `--help` of `scripts/merge.mjs`
   (its verbs, where it refuses a board, what `open` needs), `scripts/render.mjs` (`--letter`, the kit
   folder), `scripts/shots.mjs` (`--widths`, `--themes`, `--out`), `scripts/page.mjs` and
   `scripts/describe.mjs` before writing a step that runs one. The map is opened only with
   `merge.mjs open`, and only after `PICK.md` exists.
4. **Nothing leaves the machine before his yes.** The stop after the brief covers the outside send too:
   the founder reads the brief that an outside model would receive, and the skill says in that stop
   which seats would send it outside and to which provider. An outside describer is run with
   `scripts/describe.mjs --provider … --model … --brief … --out … --profile …` and nothing else: the
   script finds the key itself, the skill never passes `--endpoint`, and never names a key or a keys
   file. A valid answer lands in `proposals/` as a proposal like any other; an answer that is not in the
   format leaves `<out>.raw.txt` and a transcriber turns it into the format; a refusal is reported to
   the founder as the script words it, and Structure goes on with the seats it has.
5. **The brief carries the format** (ruling R122): `BRIEF.md` and `BRIEF-fresh.md` hold the walkthrough
   format under `## What to return`; the skill leaves that section as the template has it.
6. **A proposal is checked before it is merged.** Each file in `proposals/` passes `validate` (the cards
   give the command) before `merge`; one that does not is sent back to its maker once, then left out and
   said so on the decision page — never repaired by the conductor, which would make the conductor a maker.
7. **A shared machine.** Describers are launched in one message; `render` and `shots` are run one after
   another, never more than three browser-driving commands or seats at once; no process is stopped by
   name or by pattern.
8. **The decision** is one page built with `scripts/page.mjs` from a `decision.json`
   (`templates/outputs/decision.json`): the options by letter, one line per seat that read them, one
   recommendation, **one question**; with a fresh pass, its gallery beneath, labelled as fresh and never
   mixed into the lettered options. Give the command as the script takes it.
9. **After the pick:** a pick with named grafts is redrawn once and re-read once (the redrawn pick is
   written to `04-structure/chosen/`, not into the board); a rejection of everything reopens Intent or
   Context with `state.mjs reopen` — no further proposals are asked for against the same brief.
   `CHOSEN.md` is written from its template with its carry list and stamped.
10. **Model and effort:** each seat is started on what its line of the approved cast sheet names; a dash
    means the session's model. The skill enforces none.
11. **Read of the design:** § 4.4, § 12, and the Structure rows of § 24. Never the whole plan. Read the
    four Structure-stage maker cards, `pool/judges/usability.md`, `pool/audiences/task-reader.md` and the
    templates under `templates/package/04-structure/` so the skill hands each seat exactly what its card
    says it reads.
12. Plain, short, second person; generic; examples from the fictional room-booking product.
13. **A rejected round is moved whole** (ruling R135, extended): when the founder rejects everything and
    Intent or Context is reopened, everything in `04-structure/` other than `earlier/` — the briefs, the
    proposals folder, the board, the map, the pick, the pictures, the reads, the decision page — is moved
    together into `04-structure/earlier/<n>/` before the new round starts, so that no proposal of the
    earlier round can reach the new board. Nothing in `earlier/` is ever an input. The conductor's
    `references/blind.md` says the same.
14. **After a rejected round is moved, Structure starts clean.** `CHOSEN.md` moves with the round, so
    `state.mjs validate` reports Structure's artefact missing until Structure is begun again: after
    `reopen` of Intent or Context and their new approval, Structure runs `begin`, copies a fresh
    `CHOSEN.md` and the brief templates from `templates/package/04-structure/`, and goes on from step 1.
    The skill says so, with the commands as `state.mjs` takes them. A board made again **within** a round
    (a proposal was added or withdrawn before the pick) moves the board, the map, the pick, the reads and
    the decision page together, because the next merge deals the letters anew.
15. **What he marked in a fresh gallery is his words, and survives a rejected round.** When a round is
    rejected, the marks he made on a fresh pass's gallery are written into the package's `DECISIONS.md`
    with the rejection, in his words, before the round is moved; Look's fresh pass reads them from there,
    never from `earlier/`.
