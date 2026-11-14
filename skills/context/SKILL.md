---
name: context
description: "Use when the interface design pipeline reaches Context: the facts a design must be true to are gathered and corrected by the founder before anyone has an idea."
---
# Context: what is true, before anyone has an idea

You gather the facts this design must be true to, each with its source, and the founder corrects them.
This is the one stage that reads the world: the project's code, its documents, its data and its
analytics. Reading is not implementing, and you change nothing there. Every later stage reads the
package and the sources you list, and nothing else: what you do not write down does not exist for
them. The conductor (`ux:design`) sent you, and its words are yours. Its loop is in
`skills/design/references/loop.md`: this page says only what is Context's own.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the project profile names another
under `packages`. `<package>` is the folder of this design in it, as `design/today`.

## Question

What is true before anyone has an idea?

## Reads

- **The frame,** `<package>/00-frame.md`, approved, and what its carry list names.
- **The project profile,** `<packages>/PROFILE.md`: `facts`, `tokens`, `components`, `languages`,
  "Standing rules", "Design system".
- **The world, to read and never to change:** the project's code, documents, data and analytics, as
  far as this design reaches.
- **Each profession's profile the frame names,** in `<packages>/pool/profiles/`.
- **Of the kit:** `templates/package/01-context.md`, which you fill; `templates/people/PROFILE-CARD.md`,
  for a profession's profile that is missing; `templates/briefs/judge.md` and `pool/MODELS.md`, for
  the read of a surface that exists.
- **Never** a keys file, and never the environment. A dotenv file, or any file of credentials, that
  you meet while reading the project is passed over, unopened.

## Writes

- `<package>/01-context.md`, from `templates/package/01-context.md`, with `built-from: [frame@1]`: the
  frame, at the version it was approved at.
- A profession's profile that was missing, at `<packages>/pool/profiles/<name>.md`, once he has
  corrected it.
- When the surface exists: its pictures, the judges' briefs and their ledgers, in
  `<package>/work/as-is/`. What they found is written into the context. The folder is never read again.

Nothing of the project outside `<packages>` is written.

## Steps

1. **Begin.** Check the state as step 1 of the loop says. A stage that is awaiting the founder is not
   begun again: go to "Gate", with his answer. Otherwise mark it in work:

   ```
   node <kit root>/scripts/state.mjs begin <package> context
   ```
2. **Read the frame, and what its carry list names.** Copy the template to `<package>/01-context.md`
   and write `built-from`.
3. **When the surface exists, have it read as it is, first.** The frame says so: its foundation is
   `redesign` or `small-change`.
   - *The pictures.* Where the surface can be opened as a page from a file, photograph it:

     ```
     node <kit root>/scripts/shots.mjs <file or folder> --out <package>/work/as-is --widths <w,w...>
     ```

     Give it a desktop width and a phone width the product serves, as `1280,390`. The script starts
     its own browser and stops it. Where the surface needs the running product or a sign-in, ask the
     founder for pictures of it, and put them in the same folder. You start no browser yourself.
   - *The readers.* The judges whose cards sit at `context`: `judge.usability` and
     `judge.visual-craft`, and any judge of the project's own that sits there. Each is a fresh
     sub-agent, started as "Starting a seat" in the loop says, from a brief written from
     `templates/briefs/judge.md`. The brief names the pictures by their paths and gives who she is and
     what she does there in a few lines. It never says what is wrong. No cast sheet exists yet: the
     brief says that no cut of the checks was made, and each judge runs on the model and the effort
     its card suggests (`pool/MODELS.md`), unless he says otherwise.
   - *Their findings open "The problem, and why now",* each with its seat. A judge offers no fix
     here, and you add none.
4. **Read the world, and write each fact with its source:** a path from the project's root, with the
   name or the line in the file; an address; or a date, with who said it. A fact with no source is not
   written: it becomes one of the "Questions for the founder".
   - A fact about configuration names the setting, never a secret value: "the address of the booking
     service is read from the setting `BOOKING_SERVICE_URL`".
   - Nothing private about a real person is copied into the package: no name, no contact detail, no
     record. "A booking holds the patient's name, up to 80 characters", never a patient's name.
   - Nothing is sent to an outside service to gather context: no outside model, no hosted tool, no
     search that carries the project's content.
5. **Fill the template, heading by heading.**
   - "The problem, and why now": what is wrong or missing today, for whom, and why it is worth doing
     now.
   - "The people": the roles that reach it, and each profession's profile involved, by its id. Load
     each from the project's pool. One that is missing is drafted from
     `templates/people/PROFILE-CARD.md`, **with the evidence of every trait marked `guess`**: fill a
     field only from what the project's documents and the founder have said of that profession, and
     invent nothing. He corrects it at the gate, and then it is saved to the pool.
   - "What exists today": the surface as it is, or what she does in its place.
   - "What the product can show and do": the inventory. Every piece of data, every action and every
     state that really exists, one row each, with an id of its own (`P1`), its kind and its source,
     and what is slow or sometimes missing. Written as data, never as components: "whether a room is
     free, busy, being cleaned or closed", never "a status badge". The truth judge holds every design
     to this table.
   - "Constraints": the design system, the accessibility target, the languages, the devices and
     their widths, and the standing rules of the project profile that apply here.
   - "Tried and rejected": what was tried before, and why it was dropped; or "Nothing on record",
     with who was asked.
   - "The angles considered": **at least three** ways of saying what the problem is, each with its
     risk. Never one. An angle frames the problem and does not solve it: "she cannot tell which room
     is free now" is an angle, and "put the free rooms first" is an idea.
   - "What it must not become".
   - "The founder's own words": ask for them when the words will matter: the kind is `first-run`,
     `message` or `public-page`, or she must read in order to act. One or two sentences, as he would
     say them, written verbatim: they go to the writer's brief later. Otherwise "Not asked", with the
     reason.
   - "Questions for the founder": each with a recommendation, or "None".
   - "Project sources": the files a later stage may open directly, as the token files, the component
     source and the product-facts document. One path to a line, from the project's root, with what it
     is. A file you leave out is closed to every later stage.

**Routed `short`** (an adjustment), Context is two things: what exists, and what changes. Fill "What
exists today", the rows of "What the product can show and do" that the change touches, the
"Constraints" that apply and "Project sources", and say under "The problem, and why now" what changes
and why. No seat reads the surface, and every other heading says "Not gathered: an adjustment". Step 4
holds as written.

## Gate

**He corrects.** Put `01-context.md` in front of him, whole, with any profession's profile you drafted,
and say which of its traits are guesses. There is nothing to pick from, so no decision page is built:
the context is the page. Record the one question, so that a session resuming tomorrow asks the same:

```
node <kit root>/scripts/state.mjs await <package> context --question "<the one question>"
```

One question, about one thing: what is wrong or missing in this context? Then each of the "Questions
for the founder", one at a time, with its recommendation.

- **Write each correction where it belongs in the context, and all of them under
  `## Reviewed by the founder`:** what he corrected, and the words he approved it with, as he said
  them. Where a correction meets a fact you read, say so at once, with the source: he decides.
- **Save a profession's profile he corrected** to `<packages>/pool/profiles/<name>.md`.
- **Write the carry list,** `## Carry`: a `- source:<path>` line for each of the "Project sources" and
  for each profession's profile, by its path from the project's root; and a section of the frame that
  Intent needs, as `- frame@1#who-it-is-for`. A heading's slug is printed by
  `node <kit root>/scripts/state.mjs slug "<heading text>"`.
- **Stamp it,** in the words he approved it with:

  ```
  node <kit root>/scripts/state.mjs stamp <package> context --words "<the founder's words>"
  ```

  Then append the decision to the package's `DECISIONS.md`, and ask the state what is next, as step 9
  of the loop says.

## Never

- **Never have an idea.** Not a solution, not a layout, not an "it should". An angle says what the
  problem is. What you think the answer is goes nowhere: not into the context, not into a brief, not
  into the chat.
- **Never write a fact without its source,** and never one you did not read. What you could not find
  is a question for him.
- **Never copy a secret value.** Name the setting. Never open a keys file or a file of credentials,
  and never print the environment.
- **Never copy anything private about a real person into the package.**
- **Never send anything to an outside service to gather context.**
- **Never start a browser yourself, and never stop a process by name or by pattern.** The machine is
  shared. A browser is started only through the kit's scripts, which stop the one they started.
- **Never tell a judge of the surface as it is what to find.**
- **Never invent a trait of a profession.** A draft is a guess, and stays one until someone of that
  profession has been heard.
- **Never write the inventory as components,** and never list what the product cannot do as if it
  could.
- **Never settle for one angle.**
- **Never change the project.** You read it. Nothing outside `<packages>` is written.
- **Never ask two things at once.**
