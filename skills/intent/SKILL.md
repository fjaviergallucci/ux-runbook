---
name: intent
description: "Use when the interface design pipeline reaches Intent: the person, the job, the success criteria, the tasks and the states of a surface are written from the corrected context."
---
# Intent: who, in what moment, to get what done

You write the page every later stage answers to: the person in her moment, the one job, how anyone
will know it worked, the tasks an audience will try, and the states that exist. You write it from the
corrected context, and from nothing else. It describes no interface: it says what she needs, never
what a screen holds. The conductor (`ux:design`) sent you, and its words are yours. Its loop is in
`skills/design/references/loop.md`: this page says only what is Intent's own.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`.

## Question

Who, in what moment, to get what done, and how will we know?

## Reads

- **The context,** `<package>/01-context.md`, approved, and exactly what its carry list names: the
  project sources, each profession's profile, a section of the frame.
- **The state:** `node <kit root>/scripts/state.mjs status <package>` prints the kind, and whether
  Intent is routed full or short.
- **The project's people,** in `<packages>/pool/persons/`: a person already written for this surface
  and this moment is used, not written again, once her card is checked again, as step 3 says.
- **A profile judge of the project's own,** in `<packages>/pool/judges/`, if it is to read the
  intent: checked first, as step 5 says.
- **Of the kit:** `templates/package/02-intent.md`, which you fill; `templates/people/PERSON-CARD.md`
  and "The person card" in `pool/CARD-FORMAT.md`, for her card; the "People" table of
  `pool/INDEX.md`, the kit's five people with no profession; `templates/briefs/judge.md` and
  `pool/MODELS.md`, if the profile judge reads the intent.
- **Not the world.** Context read it. What the intent needs and the context lacks is missing from the
  package: say so, and ask to go back, as the conductor's "Resuming" says. You do not supply it from
  the code, or from the chat.

## Writes

- `<package>/02-intent.md`, from `templates/package/02-intent.md`, with `built-from: [context@1]`: the
  context, at the version it was approved at.
- Her card, at `<packages>/pool/persons/<name>.md`, from `templates/people/PERSON-CARD.md`.

One page for a surface. A flow gets the page for the whole, then a short `### <surface>` under each
heading that differs from one surface to the next.

## Steps

1. **Begin.** Check the state as step 1 of the loop says. A stage that is awaiting the founder is not
   begun again: go to "Gate", with his answer. Otherwise mark it in work:

   ```
   node <kit root>/scripts/state.mjs begin <package> intent
   ```
2. **Read the context, and what its carry list names.** Copy the template to `<package>/02-intent.md`
   and write `built-from`.
3. **Write her card, on top of her profession's profile.** Copy `templates/people/PERSON-CARD.md` to
   `<packages>/pool/persons/<name>.md`, the name in lower-case words joined by hyphens.
   - Its header names the profession's profile she inherits, by its id, as
     `profile.front-desk-coordinator`, and her specialty as that card names it. Both are `none` when
     the design is for everyone: then one of the kit's five people may serve as she is, by her id.
   - The card holds only what her profession's profile does not: one person, in one moment, for this
     surface. "Comfortable with software" is the profession's. "The phone is at her ear and the
     screen is turned away from the people waiting" is the moment.
   - `evidence` says what the card rests on: `fact`, `guess` or `mixed`. A card that is a guess says
     so in its first lines. No line is invented to make her vivid.
   - Its test: if the card does not force a design decision you would not have made anyway, it is not
     finished.

   Then check it, as you check a card of hers that you reuse, and mend each fault the command prints
   until it prints `ok`:

   ```
   node <kit root>/scripts/card.mjs check <packages>/pool/persons/<name>.md
   ```
4. **Fill the template, heading by heading.**
   - "The person in the moment": her card, by its id and its path, with the profession's profile and
     the specialty it names. Then the moment, in two or three sentences from the card.
   - "The one job": one sentence. If it needs two, it may be two surfaces: say so to the founder.
   - "Arrives with, leaves with": what she has in her hands and in her head when she gets here, and
     what she has when she goes.
   - "Success criteria": two or three testable sentences, each one checkable by looking at a screen.
     **The test: could two people disagree about whether it was met? Then sharpen it.** "Booking is
     quick" fails it. "She can say which rooms are free now without scrolling, at phone width" passes.
   - "Tasks for the audience": each task is **a starting situation and a goal, in her words. Never
     the path, and never a criterion.** It is all an audience will be given. As: "A man has walked in
     with no booking and is waiting at the desk. Find him a room he can go into now." Never: "Open
     Today and book the first free room." On a public page, in place of the tasks: that it is a public
     page, and where she arrives from.
   - "States": the ten rows of the template, **each one filled, or reading "cannot occur because …"**
     with the reason. A row says what the state must tell her or let her do, never how it looks. Take
     the states from the inventory of the context. A row left out cannot be told from one forgotten.
   - "The feeling": in her word, not a designer's.
   - "Like its siblings, and where it may differ": where it must behave as the product's other
     surfaces do, and where it may part from them, with the reason.
   - "The measure": the event that will say it worked, by the name the project's analytics gives it,
     or the one to add.
   - "Constraints that will bite": only those of the context that will shape this design, one line
     each.
   - "What the readers found": "Not read", unless step 5 ran.
5. **Optional, and cheap: the profile judge reads the intent.** Offer it when the design is for one
   profession or several: it costs one agent for each. On his yes, start one `judge.profile` for each
   profession's profile, each a fresh sub-agent, started as "Starting a seat" in the loop says, from
   a brief written from `templates/briefs/judge.md`. It is handed that profession's profile, whole,
   and the intent, and it answers one thing: is the job stated as this profession would state it? A
   card of the project's own with that id replaces the kit's, and is checked before it is seated,
   with `node <kit root>/scripts/card.mjs check <packages>/pool/judges/<name>.md`: a faulty one is
   reported to the founder, with what the command printed, and left out. No cast sheet exists yet:
   the brief says that no cut of the checks was made, and the judge runs on the model and the effort
   its card suggests (`pool/MODELS.md`), unless he says otherwise. What it marks `blocks` you mend,
   since the intent is yours to write, and a fresh judge reads it once more: one fix round, one
   re-read. Then write its verdict under "What the readers found", and each finding, fixed or open
   with the reason. Its brief and its ledger stay in the package's `work/` folder.

**Routed `short`** (an adjustment), Intent is two sentences and its criteria. Under "The person in the
moment" and "The one job": who she is, by her card's id, and what changes for her. Then "Success
criteria", one task, and the rows of "States" that the change touches. Every other heading, and every
other row, says "Unchanged by this adjustment". A card is written only when she has none.

## Gate

**He approves.** Put `02-intent.md` in front of him, with her card. There is nothing to pick from, so
no decision page is built: the intent is the page. Findings of the profile judge that stayed open go
with it, each with your recommendation. Record the one question, so that a session resuming tomorrow
asks the same:

```
node <kit root>/scripts/state.mjs await <package> intent --question "<the one question>"
```

One question, about one thing: do you approve this intent?

- **Write what he says under `## Reviewed by the founder`:** what he corrected, and the words he
  approved it with, as he said them. A correction is made in the page too, and in her card when it is
  hers: check the card again.
- **Write the carry list,** `## Carry`: what Cast and the stages after it may open besides this page.
  A `- source:<path>` line, from the project's root, for her card, for her profession's profile and
  for each project source of the context. And a `- context@1#<slug>` line for each section of the
  context a later stage is written from: its "The people", "What the product can show and do",
  "Constraints" and "The founder's own words". A heading's slug is printed by
  `node <kit root>/scripts/state.mjs slug "<heading text>"`.
- **Stamp it,** in the words he approved it with:

  ```
  node <kit root>/scripts/state.mjs stamp <package> intent --words "<the founder's words>"
  ```

  Then append the decision to the package's `DECISIONS.md`, and ask the state what is next, as step 9
  of the loop says.

## Never

- **Never describe the interface.** No screen, no component, no layout, no label. "She can say which
  rooms are free now", never "a list of free rooms at the top". A criterion, a task or a state that
  names a part of a screen is a design: turn it back into what she needs.
- **Never give the path in a task,** and never a success criterion. An audience that is told the way
  has nothing left to find.
- **Never leave a state out.** Each is filled, or says why it cannot occur.
- **Never write a criterion two people could disagree about.**
- **Never put in her card what is true of her whole profession,** and never a trait nobody said.
- **Never go on with a card the checker refuses.**
- **Never read the world again, and never take from the chat.** What is not in the context is missing.
- **Never sit in the profile judge's seat yourself.** It is a fresh sub-agent, or the intent goes
  unread.
- **Never start Cast, a brief or a sketch before he has approved.**
- **Never ask two things at once.**
