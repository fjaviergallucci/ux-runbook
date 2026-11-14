---
name: frame
description: "Use when the interface design pipeline reaches Frame: a new design request must be classified by kind, foundation and size, and its route chosen."
---
# Frame: what kind, from what, how big

You open a design. In one exchange with the founder you name three things about his request (its kind,
its foundation and its size) and with them its route: which stages run full, short or not at all. Then
you make the package. No maker sits here, and no judge. The conductor (`ux:design`) sent you, and its
words are yours: the founder, the project profile, a profession's profile, a package, a stage, a seat,
a card. Its loop is in `skills/design/references/loop.md`: this page says only what is Frame's own.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`.

## Question

What kind of interface, starting from what, how big: so which stages run?

## Reads

- **The request, as he wrote it.** Frame is the one stage that takes anything from the conversation:
  his request, and nothing else of it.
- **The project profile,** `<packages>/PROFILE.md`: "Kinds this project adds", "Design system",
  `pinned`, `banned`, and the `## Engine check` section, which setup wrote.
- **The project's pool, by its file names only:** which professions have a file in
  `<packages>/pool/profiles/`. You open no card here.
- **Of the kit:** `skills/design/references/routes.md`, for the kinds, the foundations, the sizes and
  the route of each size; `skills/cast/references/presets.md`, for the default cast, and
  `pool/INDEX.md`, for each seat's job in a line; `templates/package/00-frame.md`, which you fill.
- **Not the project's code, its screens or its data.** Reading the world is Context's.

## Writes

- The package: the folder `<package>`, which `init` makes, with its state.
- `<package>/00-frame.md`, from `templates/package/00-frame.md`: every heading and table kept, each
  instruction in braces replaced, its first comment deleted. Frame is built from nothing, so
  `built-from` stays `[]`, and the rest of the header is the state script's.
- The package's `DECISIONS.md`, started from `templates/package/DECISIONS.md` with the frame as its
  first entry.

## Steps

Steps 1 to 6 write nothing: the package is made at the gate, on his yes.

1. **See whether the design is new.** It is, unless the conductor sent you to a package that exists:
   a folder with a `state.json`, whose next stage is `frame`. That design was left half framed. Its
   three values are in the state already: do not run `init` again. Go through steps 3 to 6, put the
   frame to him again with the three values as they stand, and write the request from his answer,
   never from the chat. Then go on from "Write `00-frame.md`", under "Gate".
2. **Name the kind, the foundation and the size,** each from its table in
   `skills/design/references/routes.md`, each with one line of why.
   - *Kind:* what the interface is for. One of the kit's five, or a kind the project profile adds.
   - *Foundation:* what it starts from. It is `no-system` while the project profile says "None yet"
     under "Design system".
   - *Size:* why this size, and not the one below it. When two sizes fit, name both and what tips it.

   Where the request and the project profile do not settle a value, say that it is your reading: he
   corrects it in his answer. As: "a screen that shows the front desk which rooms are free right now"
   is a `working-surface`, on `new-surface`, sized `surface`.
3. **Read the route off the size:** the mode of each stage, from "The route of each size". Change the
   mode of one stage only with a reason he can read: an adjustment that changes the structure runs
   Structure, and one that changes nothing she can see skips Look.
4. **Say who it is for:** one profession, several, or everyone. Name each profession by the id of its
   profession's profile, as `profile.front-desk-coordinator`. Say which have a file in the project's
   pool, and which Context will have to draft.
5. **Draw the provisional cast:** the preset for this kind and size, from
   `skills/cast/references/presets.md`, with what it adds by rule, the project's `pinned` seats added
   and its `banned` ones taken out. One line for each seat. It is a starting point: Cast decides.
6. **List the engines missing.** In the `## Engine check` table of the project profile, find the row
   of each seat of the provisional cast, and of each maker the preset adds by rule. A row that says
   `missing` or `off`, or that holds a script's refusal, is a seat with no engine today. List the
   seat, its engine, what the check found, and what the seat does without it, which the last table of
   `skills/cast/references/presets.md` gives. Say the day of the check. "None" when every engine
   answers. You check nothing again here, and you turn nothing on.

**Sized `correction`, Frame is one line:** the request, the three values and the route. Steps 4 to 6
are not run: a correction casts no seat. He confirms the line, and it is written where the template's
first instruction stands; each heading under it then says "See the line above", or "None: a correction
casts no seat". What follows a correction's frame is in `skills/design/references/routes.md`, under "A
correction".

## Gate

**He confirms in one message.** Put the frame to him in one message: the request as he wrote it, a
name for the design (a word or two in lower case, as `today`: it names the package's folder), the three
values each with its why, the route, who it is for, the provisional cast and the engines missing. Then
one question, about one thing: is this the right frame for it?

- **If he corrects a value,** change it, say what moves with it (a size moves the route and the cast),
  and put the whole frame to him again, with the same one question.
- **On his yes, and not before, make the package:**

  ```
  node <kit root>/scripts/state.mjs init <package> --design <name> --kind <kind> --foundation <foundation> --size <size>
  node <kit root>/scripts/state.mjs begin <package> frame
  ```

  `init` takes the three values as he agreed them, and it runs once: a package's kind and foundation
  are not changed afterwards, and its size only moves up. If it refuses because a package of that
  name exists, that one is another design's: agree another name with him. A stage whose mode you and
  he changed is routed now, with the reason the state will keep:

  ```
  node <kit root>/scripts/state.mjs route <package> <stage> <full|short|skipped> --reason "<why>"
  ```

- **Write `00-frame.md`.** "The request", word for word. "Kind, foundation, size", each value with its
  why. "Route": the mode of each stage as `node <kit root>/scripts/state.mjs status <package>` prints
  it, with the reason of each stage that is short, skipped or changed. "Who it is for". "Provisional
  cast". "Engines missing".
- **Write his answer under `## Reviewed by the founder`:** what he corrected, and the words he
  confirmed it with, as he said them. Until it is there, it does not count.
- **Write the carry list,** `## Carry`: one `- source:<path>` line for each profession's profile the
  frame names that is in the project's pool, by its path from the project's root, as
  `- source:design/pool/profiles/front-desk-coordinator.md`. Nothing else goes under that heading.
- **Stamp it,** in the words he confirmed it with:

  ```
  node <kit root>/scripts/state.mjs stamp <package> frame --words "<the founder's words>"
  ```

  Then append the decision to the package's `DECISIONS.md`, and ask the state what is next, as step 9
  of the loop says.

## Never

- **Never start designing.** A frame says what the request is, never what the answer is: no layout, no
  component, no "it could be a list of rooms". An idea you have is written nowhere, in the frame or in
  the chat: it would reach the makers through you.
- **Never make the package before he has agreed the three values.** `init` runs once.
- **Never take the smaller size to save stages,** and never move a size down. A design that turns out
  bigger stops, says so, and is resized with his yes.
- **Never skip a stage by leaving it out.** Only `route` changes a mode, with its reason, and Frame
  itself is never skipped.
- **Never summarise the request.** His words, as he wrote them.
- **Never read the project's code or its screens to frame it.** That is Context's, and what you saw
  there would come back as an idea.
- **Never turn an engine on.** `engines-on` is the founder's line in the project profile. You say what
  is missing and what the cast loses by it, and no more.
- **Never ask two things at once.** One question, about the frame.
- **Never edit `state.json` or `STATE.md` by hand.** The state script writes both.
