---
name: cast
description: "Use when the interface design pipeline reaches Cast: the makers, the judges with their checks, the audiences and any fresh pass are chosen for one design."
---
# Cast: who makes, who judges, who plays the user

You choose the seats of this one design, stage by stage, from two pools: who makes, who judges and
with which checks, who reads as an audience, on which suggested model, and whether a fresh pass runs.
You start from a preset, and the founder edits it by exception. A seat costs an agent that reads its
inputs, so which seats sit is the real lever on cost: every seat earns its line. The conductor
(`ux:design`) sent you, and its words are yours. Its loop is in `skills/design/references/loop.md`:
this page says only what is Cast's own.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`.

## Question

Who makes, who judges with which checks, who plays the user?

## Reads

- **The intent,** `<package>/02-intent.md`, approved, and exactly what its carry list names.
- **The state:** `node <kit root>/scripts/state.mjs status <package>` prints the kind, the
  foundation, the size and the route. You cast the stages still to run, and no other.
- **The project profile,** `<packages>/PROFILE.md`: `packages`, `pinned`, `banned`, `engines-on`,
  `openai-model`, `gemini-model`, and the `## Engine check` section.
- **The kit's pool, on one page:** `pool/INDEX.md`, every seat and every person in a row. You choose
  from the index, not from the cards. With it: `pool/MODELS.md`, the model and the effort each seat is
  suggested on, and `references/presets.md`, the default cast.
- **The project's pool,** `<packages>/pool/`: its own cards in `makers/`, `judges/` and `audiences/`,
  its people in `persons/`, each profession's profile in `profiles/`. Checked first: step 3.
- **Of the card of each judge that sits, one section:** `## Optional checks`.
- **Of the kit:** `templates/package/03-cast.md`, which you fill; `skills/design/references/blind.md`
  and `skills/design/references/fresh-pass.md`, for the two sections of the sheet they govern.

## Writes

`<package>/03-cast.md`, the cast sheet, from `templates/package/03-cast.md`, with
`built-from: [intent@1, context@1]`: the intent at the version it was approved at, and the context,
whose sections you carry on. One table for each stage still to run, with the template's columns:
"Seat", "Loaded with", "Checks on · off", "Engine", "Suggested model", "Suggested effort", "Why it is
here". The table of a stage the route skips is deleted.

## Steps

1. **Begin.** Check the state as step 1 of the loop says. A stage that is awaiting the founder is not
   begun again: go to "Gate", with his answer. Otherwise mark it in work:

   ```
   node <kit root>/scripts/state.mjs begin <package> cast
   ```
2. **Read the intent, and what its carry list names.** Copy the template to `<package>/03-cast.md` and
   write `built-from`, unless the file is already there: then go on from what it holds.
3. **Check the project's own cards before you read one.** Name every `.md` file of the project's
   `makers/`, `judges/`, `audiences/` and `persons/` folders in one run, each by its path, as
   `<packages>/pool/judges/booking-truth.md`:

   ```
   node <kit root>/scripts/card.mjs check <file>...
   ```

   It prints one line for each file. `ok`: the card is sound, and you may read it. A file named
   `README.md` is passed over: it is never a card. Any other line is a fault, and **a faulty card is
   reported to the founder, with its lines, and left out**: it is not cast and not mended by you, and
   it is never skipped in silence: it has its line under "Left out". Where it carries the id of a kit
   card, the kit's card sits in its place, and the cast sheet says so: the line under "Left out" then
   names the project's replacement, not the seat. A profession's profile has no checker, and is read
   as it is written.
4. **Lay the two pools side by side.** The kit's seats and people are the rows of `pool/INDEX.md`. The
   project's are its sound cards: read each one's header. **A project card with the same id as a kit
   card replaces it for this project, and the cast sheet says so** on that seat's line. The same holds
   for a person.
5. **Start from the preset** for this kind and size, in `references/presets.md`: each seat at the
   stages its row gives, then what the page adds by rule. A stage the route runs that the row leaves
   empty is cast from the surface row for that stage. Add each seat the project profile lists under
   `pinned`. Take out each one under `banned`, and name it under "Left out": only the truth judge on
   a public page is not the project's to ban, and you tell the founder when the two meet. A seat sits
   only at a stage its card sits at (the page's table of the seats has the kit's), and only at a
   stage the route runs.
6. **Load each seat that is loaded.** Whether the design is for one profession, for several or for
   everyone is in "The people" of the context, with each profession's profile by its path: the
   intent carries it on, as `- context@1#the-people`. `judge.profile` sits once for each profession's
   profile the preset seats, loaded with it: `profile.<name>`. `audience.task-reader` sits once for
   each person it is seated as, `person.<name>`: the primary person, the one the intent names, and,
   where the preset seats a second, a contrast person the makers are not briefed on, from the
   project's people or the kit's five.
7. **Make the first cut of each judge's optional checks,** from the `## Optional checks` table of its
   card. A check is on when the intent says its trigger will be there, and off otherwise, with the
   reason. The core checks always run, and are not listed. The judge tests every trigger again on the
   artefact itself, and a check whose trigger it sees runs even where you left it off.
8. **Write each seat's engine, and turn none on.** A kit seat's engine is in the `## Engine check`
   table of the project profile, with what the check found. A project seat's is in its card's header.
   - A seat whose engine is `missing` or `off` is shown all the same: what the engine would add, that
     it is off, and what the seat does without it (the last table of `references/presets.md`).
     `engines-on` is the founder's line: you never add to it.
   - `maker.outside-describer` is cast only when `engines-on` lists a provider. Its line of the cast
     sheet names the provider as it is listed, `model:openai` or `model:gemini`, and the model id the
     project profile holds for it, under `openai-model` or `gemini-model`. Where both are listed, it
     has a line for each one that runs.
   - `maker.transcriber` is cast whenever `maker.screen-generator` is, and stands by whenever an
     outside describer is, for an answer that does not come in the format.
9. **Show each seat's suggested model and effort, as its card has them.** `pool/MODELS.md` has the
   kit's, and a project card's header has its own. A card that says `none` shows a dash, —. Then
   propose, in a sentence that says these are suggestions he may change: a judge or an audience on a
   different model from the maker it reads, and the describers spread across models. Whatever he
   chooses is written as he chose it.
10. **Say why each seat is here, in one line: what it catches, and what it costs.** As: "Catches a
    room shown as free that the product cannot know is free. One agent, reading four options and the
    inventory."
11. **Fill the rest of the sheet.**
    - "Left out": each seat of the preset that does not sit, and what is lost without it. Banned,
      faulty, its engine off, or not called for by this design: say which. "None" when the preset
      sits whole.
    - "Blind rules": who does not see what in this design, as `skills/design/references/blind.md`
      has it. The describers do not see each other, your own idea or today's screen. The judges do
      not see the author map. The audience does not see the intent. Then any continuity maker cast
      to see the current layout, and why: only where the surface exists. Or "None".
    - "Fresh pass": for Structure and for Look, whether one runs, with which makers, on which
      engines, and why (`references/presets.md` says who can make one). It never runs at Detail.
      **It is offered, never added:** write "does not run" unless he has asked for one, and where
      you think one would earn its cost, say so in one sentence at the gate. An engine the project
      has not turned on is never used: with none, the screen generator's seat is taken by a Claude
      maker, as its row of the last table says.
    - "Cost": the number of agents each stage starts, with makers, judges and audiences counted
      apart, and the total. Count the rows, one for each instance. An outside describer is a call the
      session makes, not an agent, and a transcriber that stands by counts only when it runs: say so
      beside the count.

**Routed `short`** (an adjustment), only the row you start from differs: the adjustment row of the
preset. Every step holds as written. A stage the route runs that the row leaves empty takes the cell
of the surface row, the project's `pinned` seats are added and its `banned` ones taken out, and the
truth judge sits on a public page.

## Gate

**He edits by exception.** Put `03-cast.md` in front of him: each seat with its one line, what it
catches and what it costs, and the cost of the whole. There is nothing to pick from, so no decision
page is built: the cast sheet is the page. Record the one question, so that a session resuming
tomorrow asks the same:

```
node <kit root>/scripts/state.mjs await <package> cast --question "<the one question>"
```

One question, about one thing: which seat, check, model or effort would you change?

- **Write what he changes into the tables, and under `## Reviewed by the founder`:** the seats, the
  checks, the models and the efforts he changed, and the words he approved it with, as he said them.
  A seat he takes out moves to "Left out", in his words. A model he names is written as he named it:
  nothing here refuses it, and nothing puts the suggestion back.
- **Write the carry list,** `## Carry`: what Structure and the stages after it may open besides the
  cast sheet. A `- intent@1#<slug>` line for each section of the intent but "What the readers found"
  and the two last. The `- context@1#<slug>` and `- source:<path>` lines of the intent's own carry
  list, as they are. And a `- source:<path>` line for each profession's profile that is loaded into
  a seat, and for each card and each person of the project's own that sits: a card of the kit is
  found in the kit, by its id. A heading's slug is printed by
  `node <kit root>/scripts/state.mjs slug "<heading text>"`.
- **Stamp it,** in the words he approved it with:

  ```
  node <kit root>/scripts/state.mjs stamp <package> cast --words "<the founder's words>"
  ```

  Then append the decision to the package's `DECISIONS.md`, and ask the state what is next, as step 9
  of the loop says.

**After the gate the sheet is his.** A later stage may add a seat or a check when the artefact calls
for it, and says so. Nothing is removed silently: a seat on the approved sheet sits, or he is told why
it cannot, and the sheet changes with his yes.

## Never

- **Never remove a seat silently, here or later.** A seat that does not sit is under "Left out", with
  what is lost without it, before he approves. After that, it leaves the sheet only through him.
- **Never turn an engine on.** Show what is off, and what it would add. Never open or list a keys
  file, and never print the environment: no engine needs it from you.
- **Never cast a faulty card, and never skip one in silence.** Report it, with what the checker said.
- **Never cast a seat at a stage its card does not sit at,** and never one agent in two seats.
- **Never write a suggestion as a rule.** A model and an effort are the card's suggestions and the
  founder's to change. Never refuse a model he chooses, and never rewrite it.
- **Never add a fresh pass yourself.** It costs agents, and it is his to ask for.
- **Never choose from the cards.** The index is the page to choose from. Of a judge that sits you open
  its optional checks, and of a project's own card its header.
- **Never start a seat, write a brief or sketch a structure here.** Cast chooses. Structure starts.
- **Never ask two things at once.**
