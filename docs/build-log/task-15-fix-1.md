# Task 15 — fix round 1 of 5

The review (head `0198e25`) found `scripts/card.mjs` sound and every refusal ruling 3 names pinned; every
command in the four skills exact against its script's `--help`; the descriptions verbatim; `presets.md`'s
table byte-identical to the brief and all seventeen seats matching their cards; the secrets rules clean;
the seven provisional views holding. Five findings are Important (one of them made by the plan); eleven
are Minor. All but one are fixed now. Paths are under `skills/` unless another is given.

This round may edit, beyond your own files: one sentence of `skills/design/references/loop.md`, one line of
`pool/INDEX.md`, one mention in `pool/CARD-FORMAT.md` and in setup's README lines — each named below.

## Important

**I1 — who the design is for, and the profession profiles, never reach Cast or Structure.**
`cast/references/presets.md:41-45` seats `judge.profile` "when Frame says" one, several or everyone, but
Cast cannot read the frame: Context carries `frame@1#who-it-is-for` to Intent only (`context/SKILL.md:141-143`),
Intent is built from `[context@1]`, and the stamp refuses a carry line for a stage that is not in
`built-from`. Cast's step 6 (`cast/SKILL.md:79-83`) never says where one, several or everyone comes from.
And Intent carries only "her profession's profile" (`intent/SKILL.md:134`), Cast only the project's cards
and persons that sit (`cast/SKILL.md:148-149`): for several professions, or for everyone with two
contrasting profiles, Structure cannot hand a second profile judge its profile.
- Context's "The people" section states **one, several or everyone**, copied from the frame, with the
  profession profiles it loaded or drafted, by path. Cast reads it from `context@1#the-people` (which
  Intent already carries on) and its step 6 says so. Cast's `## Carry` gains one `- source:` line for
  each profession's profile that is loaded into a seat. `presets.md:41-45` says "when the context's
  people section says". Tests hold each link.

**I2 — Cast's short form drops pinned seats and leaves banned ones in** (`cast/SKILL.md:125-126`: "the
adjustment row of the preset and no more … Steps 3, 8 and 9 hold as written"). The project profile's
`pinned` seats always sit and its `banned` seats never do, at every size — Frame applies both at every
size (`frame/SKILL.md:68-70`). And the gate needs what steps 7, 10 and 11 make (checks on and off, the
why-line, Left out, Cost). The short form: the adjustment row, with `pinned` added and `banned` removed;
steps 3, 5, 7, 8, 9, 10 and 11 hold. Update the pin at `tests/skills.test.mjs:2119`.

**I3 — an adjustment routed to run Structure gets an empty Structure cast.** Frame routes Structure
`full` when the structure changes (`frame/SKILL.md:62-64`), the adjustment row's Structure cell is "—"
(`presets.md:15`), and Cast casts "each seat at the stages its row gives" (`cast/SKILL.md:74-75`). Rule,
in `presets.md` and Cast's step: a stage the route runs that the size's row leaves empty is cast from the
**surface** row for that stage. A test holds it.

**I4 — Context seats a project's own judges without checking or reading them** (`context/SKILL.md:69-70`;
Intent has the same gap for a project's `judge.profile`, `intent/SKILL.md:101-103`). A project's cards are
checked before they are cast (ruling 3), at every stage that seats one. Context and Intent each list
`<packages>/pool/judges/` in `## Reads`, run `node <kit root>/scripts/card.mjs check` on the card they
would seat, report a faulty one to the founder and leave it out, and say that a project card with a kit
card's id replaces it.

**I5 — plan-mandated: on a public-page adjustment, the truth judge does not sit.**
`presets.md:39`, `:46` follow the brief ("at any size from surface up … `judge.truth` always on a public
page"). The design (§ 5), the conductor (`design/references/routes.md:22`: "the truth judge always sits")
and the card (`pool/judges/truth.md:6`) set no size limit.
- **Ruling R139.** The design is the authority: `judge.truth` sits on a public page at **every** size,
  the adjustment's short form included. The other "added by rule" lines keep "from surface up". Leave the
  brief's table itself verbatim; the rule lines under it change.

## Minor — fixed now

- **M1** `frame/SKILL.md:48-51`: a package initialised but never stamped holds only the three values;
  "go on from the first thing under Gate that is missing" cannot produce "The request" word for word. On
  such a package Frame puts the frame to him again, with the three values as they stand, and writes the
  request from his answer — never from the chat.
- **M2** `context/SKILL.md:131-135`: the gate is one message from him. The questions for the founder are
  put **before** the gate, one at a time, each answer written into the context as it comes (so a session
  that stops midway loses none); then the gate asks its one thing.
- **M3** `context/SKILL.md:9`, `:28` read "analytics" while `:86` forbids "a hosted tool". Say which way
  it goes: Context may read the product's own analytics through a connection the project already has,
  read-only, and names the source and the date; it sends nothing of the project to any service to gather
  context.
- **M4** `context/SKILL.md:41-42`, `:93-94`: a drafted profession's profile is written to
  `<packages>/pool/profiles/<name>.md` (where setup's stubs are), every trait a guess, so a session that
  resumes finds it.
- **M5** `context/SKILL.md:118-122`: the short form marks "The founder's own words" as not gathered even
  when the kind is `message`, `first-run` or `public-page`. For those kinds the short form still gathers
  them.
- **M6** `presets.md:42-43` says "more than one profession's profile"; the brief says "the project has
  profiles". With exactly one profile and a design for everyone, that one profile's judge sits; with two
  or more, the two contrasting ones.
- **M7** `scripts/card.mjs:56`: a `README.md` that does not exist, or is a folder, passes with exit 0 —
  only an existing file named `README.md` is passed over. `check pool/makers` (a folder) says "this file
  is in "pool"": say that it is a folder and that files are checked one by one. Pin both.
- **M9** a non-visual adjustment leaves Look routed `short` with nobody seated (`presets.md:27-28`).
  Frame routes Look `skipped`, with the reason, when the change touches nothing visual
  (`state.mjs route … skipped --reason`), and `presets.md` says so.
- **M10** `cast/SKILL.md:26-29`: Cast also needs the foundation (Direction under no system; the blind
  rules) and `packages` (its paths) — list them in Reads and drop "Nothing else of its header is
  Cast's". The cost line says a transcriber standing by counts as an agent only when it runs.
  `presets.md:46`: a `banned` seat is never cast, with one exception stated — a project cannot ban the
  truth judge on a public page; Cast tells the founder when the two meet. `intent/SKILL.md:28-29`: a
  person card Intent reuses from `<packages>/pool/persons/` is listed in Reads and checked again with
  `card.mjs check`.
- **M11** three follow-ups outside your files, each one line:
  `design/references/loop.md` § 7 — a decision between options goes to him as one page built with
  `page.mjs`; at a stage whose gate is an approval of its output (Frame, Context, Intent, Cast), the
  output is what he reads (update its pin if it has one);
  `pool/INDEX.md:3` — Cast reads the index "to choose seats", then the checks table of each judge it
  seats;
  `pool/CARD-FORMAT.md` and the README lines `setup/SKILL.md` writes into a project's pool folders — say
  that a project's own card or person is checked with `node <kit root>/scripts/card.mjs check <file>`.

## Deferred — do not fix

M8 (as-is pictures live only in `work/`, so a continuity maker, if one is ever cast, would have no
legitimate path to them — no such card exists yet).

## Rules unchanged

Generic; each `SKILL.md` within 200 lines; never a keys file, never `--endpoint`, never an engine turned
on; nothing else under `templates/`, `pool/`, `skills/design/` or `skills/setup/` than what this file
names; stage by explicit path; commit on `v2-pipeline`; never push, never amend. Run the files you touch
while iterating and `npm test` once at the end, after the last edit.

One commit: `fix: Cast knows who the design is for, and the opening stages' smaller findings` (same two
trailer lines). Hand-mutate the changed conditions of `card.mjs`. Append "Fix report — round 1" to
`task-15-report.md` and reply with the short status contract.
