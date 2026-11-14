# Task 12 — fix round 2 of 5

The re-review (head `9234480`) found I1, I2 and M1–M8 all addressed: the specimen holds no word of any
product and passes `validate`; no stage header or carry section changed; no blind opened; no test asserts
less. The fix itself left one Important finding and four Minor ones. Paths are under `templates/` unless
another is given.

## Important

**N1 — the fresh brief's new `## How to work` contradicts what a fresh maker is asked for at Look**
(`package/04-structure/BRIEF-fresh.md:1-5`, `:47-55`). The comment says to keep all of "How to work" and
that at Look the brief is "this brief with one section more", "The one screen". But at Look a fresh maker
draws one approved screen "with those words exactly as written: no element added, none dropped"
(`pool/makers/outside-describer.md:50-56`, `pool/makers/screen-generator.md:40-47`), while the new
section tells it to ask whether no interface at all would do the job, to set its first idea aside and
look for an answer of another kind, and to propose one way, whole. An outside model is sent the brief and
nothing else: at Look it would be invited to redesign an approved structure.
- **Ruling R134.** The fresh brief has two forms and the template says so in its opening comment: at
  **Structure**, as it stands (`## How to work`, then `## What to return` with the format); at **Look**,
  `## How to work` and `## What to return` are both **deleted** and replaced by `## The one screen` —
  the screen the visual designer is drawing, its state, its approved structure and its strings, with the
  one instruction to draw that screen with those words exactly and choose only how it looks — and a
  short `## What to return` of its own (the screen as one self-contained page; nothing else). The
  template holds the Look sections ready, marked as the Look form, so the filler deletes one form and
  keeps the other. Tests: the template says which sections belong to which form; a copy reduced to the
  Look form holds none of "no interface", "another kind", "propose one way" nor the walkthrough format,
  and still names what it withholds only inside `## What you are not given`.

## Minor — fixed now

- **N2** `package/05-detail/DETAIL.md:48` lists six edges as if that were all; the interaction designer's
  card (step 5) lists ten, and three dropped out (the missing value; the screen left open while things
  changed; the return halfway through). Say "the edges your card names" and drop the partial list, or list
  all ten — one or the other.
- **N3** `package/03-cast.md:55` no longer lists "the session's own idea" among what the describers do not
  see; design § 12 names it. Restore it.
- **N4** two useful sentences were cut rather than moved: `package/01-context.md:71` lost the examples
  design § 4.1 gives for project sources (the token files, the component source, the product-facts
  document) — restore them in the two lines the braces allow; `package/05-detail/states.md:9-10` lost "a
  state's name here is the one its pages and its checks use", the only line linking state names across
  `states.md`, the prototype's pages and `acceptance.json` — restore it as plain text that survives
  filling.
- **N5** `tests/templates.test.mjs:621` asserts the sample check's page is
  `${data.design}-${check.state}-en.html`; its own comment and `pool/makers/prototype-builder.md:41` say a
  page is `<screen>-<state>-<language>.html`. It passes only because the sample's design and screen are
  both `today`. Give the sample a design name that differs from its screen's id, and assert against the
  screen.
- **One line in a card, now allowed:** `pool/audiences/task-reader.md` lists `package` under
  `never-reads` while the pictures it is handed live inside the package. Leave the header as it is; in the
  card's text, where it speaks of the package, say what the audience brief now says: it opens nothing in
  the package but the pictures it is handed. Touch nothing else in that card (its caveat, its lists and
  its method are pinned by tests).

## Rules unchanged

Generic; no key-like string; nothing under `scripts/`; stage by explicit path; commit on `v2-pipeline`;
never push, never amend. **Another task is being built in the same checkout** (new files under `skills/`
and `tests/skills.test.mjs`): do not touch them, and stage only your own files. Run the three covering
test files while iterating and `npm test` once at the end — if `tests/skills.test.mjs` fails or is
half-written when you run it, that is the other task's; say so and do not fix it.

One commit: `fix: the fresh brief has a Structure form and a Look form, and four smaller findings` (same
two trailer lines). Append "Fix report — round 2" to `task-12-report.md` and reply with the short status
contract.
