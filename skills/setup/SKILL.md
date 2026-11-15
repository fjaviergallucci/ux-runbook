---
name: setup
description: "Use when an interface design is about to start in a project that has no design profile, or when the user asks to set a project up for the interface design pipeline."
---
# Setup: once for each project

Every stage reads the project profile, so something has to write it first. You set one project up,
once, before its first design: you write the project profile, build the project kit, make the project's
pool, and check which engines answer. The conductor (`ux:design`) sends you here when a project has no
project profile, or one whose `## Reviewed by the founder` section is missing or holds none of his
words. Its words are yours: the founder, the project profile, a profession's profile, a package, a
seat, a card. You design nothing here and decide nothing for him: you read, you ask, you write down.

The kit's root is two directories above this skill's own folder; run a script as
`node <kit root>/scripts/<name>.mjs`. Run it from the project's root. `<packages>` is the folder that
holds the project's packages: `design` at the project's root, unless the founder names another.
`<scratch>` is a folder you make outside the project, in the system's temporary folder, and remove last.

## Question

What must be true of this project before its first design?

## Reads

- **The project, as it is.** Its design system, where it has one: the token files, the component
  source, its documents. And the product's own documents: what the product does and what may be said
  of it, its languages and how their strings are kept, how a browser check is run, the decision log.
- **Of the kit:** `templates/project/PROFILE.md` and `templates/project/LESSONS.md`, which you fill;
  `templates/people/PROFILE-CARD.md`, for a profession's profile; `kit/KIT-CONTRACT.md` and `kit/grey/`,
  for the project kit; `pool/INDEX.md` and each card's `engine` line, for the engine check, with
  `pool/CARD-FORMAT.md` for how an engine is spelled.
- **Never** a keys file, and never the environment. A dotenv file, or any file of credentials, that
  you meet while reading the project is passed over, unopened.

## Writes

All of it in the project, under `<packages>`, and nothing else:

| What | Where | From |
|---|---|---|
| The project profile | `<packages>/PROFILE.md` | `templates/project/PROFILE.md` |
| The project kit | `<packages>/kit/`: `kit.css`, `parts.html`, the token file | `kit/grey/`, as `references/project-kit.md` says |
| The project's pool, empty | `<packages>/pool/`: `profiles/`, `persons/`, `makers/`, `judges/`, `audiences/` | step 6 |
| A stub of each profession's profile | `<packages>/pool/profiles/<name>.md` | `templates/people/PROFILE-CARD.md` |
| The project's lessons, with no entry yet | `<packages>/LESSONS.md` | `templates/project/LESSONS.md` |
| The engine check, and his review | the last two sections of the project profile | step 7, and the gate |

A file you write while working that is none of these goes in `<scratch>`: never in the project.

## Steps

1. **See whether setup is due.** It is due when `<packages>/PROFILE.md` is missing, and when its
   `## Reviewed by the founder` section is missing or holds none of his words: no such heading, or
   under it nothing, the template's instruction, or a line that is not his. With his words there, the
   project is set up: say so, and stop. Without them, a setup was left unfinished: go on from the
   first step whose output is missing, and ask nothing the project profile already answers.
2. **Read the project.** Find its design system: the token files, the folder of the component source,
   its documents. Find the document that says what the product does (`facts`), the languages and the
   format of their strings (`languages`, `strings-format`), how a browser check is run here
   (`browser-check`), the decision log (`decisions-log`). Note each by its path from the project's
   root. What you cannot find stays empty: you never guess a path or a fact.
   A project with no script for a browser check reads "no script": Acceptance then writes one, on his yes.
   **When the project has no design system, say so.** `tokens` and `components` stay empty, "Design
   system" says "None yet", the project kit is the grey kit as it is, and Look will run once as a
   direction. You do not start one here.
3. **Start the project profile.** First, where it goes: if `design` at the project's root already
   holds something else, ask him where the packages go before you write anything, and write his answer
   as `packages`, with `kit` under it. Then copy `templates/project/PROFILE.md` to
   `<packages>/PROFILE.md` and fill what you read, each path from the project's root. Keep every key
   of the header and every heading; a key with nothing to say keeps its empty value, and an
   instruction in braces you cannot answer becomes "Not known yet." Three things wait for him:
   `engines-on` stays `[]` until his yes; `keys-file` stays empty until he gives a path, and a
   credentials file you came across while reading the project is never opened and never written here;
   and the last section, `## Reviewed by the founder`, stays empty until the gate: the rule for an
   instruction you cannot answer does not apply to it, and nothing is written there before his words.
4. **Ask the founder what you could not read.** One question at a time, each about one thing. Write
   each answer into the project profile, in his words, before the next question: until it is written
   there, it does not count. Skip a question the project has already answered: write its answer from
   the project's document, and name that document by its path when you put the project profile to him.
   1. The product in one sentence, as he would say it to a friend: `product`. As: "A room-booking tool
      for the front desk of a small clinic."
   2. The languages it ships, the main one first. He names them; you write their codes as
      `languages`, as `[es, en]`, and show him the line. Then, for each, the register it is written in
      and how she is addressed: "Standing rules".
   3. His standing rules for interfaces: "Standing rules", one line each.
   4. The professions it serves, as "front-desk coordinators". Each one he or the project's documents
      name gets its stub at once, written from the template as step 6 says: the stubs are where this
      answer lives. When neither names one, no stub is written.
   5. Whether a brief may be sent to an outside text model. Say what a yes means: the brief leaves this
      machine, and setup itself will send one line that holds nothing of the project, to see that the
      engine answers. **Only on his yes**, ask which provider, and add it to `engines-on` in its
      card's spelling: `model:openai`, `model:gemini`. Then ask the model's id, and write it as he
      gives it: `openai-model`, `gemini-model`. Then ask whether the key is in the environment his
      sessions run in, or in a dotenv file outside the repository; if in a file, he gives its path,
      and you write the path as `keys-file` and do nothing else with it. A path inside the
      repository is not taken: say so, and ask him for one outside it. Comparing two paths opens
      nothing. The script's `--help` says by which name it looks for the key: point him to it. He
      puts the key in place himself.
   6. Only when the session lists a screen generator among its tools (a tool it lists by name counts,
      loaded or not): whether a brief may be sent to it. On his yes, add `tool:stitch` to `engines-on`.
   A no to 5 or to 6 is written too, under "Engine check". Two more are asked when the project did not
   say them: the account a browser check uses, by its role, and where decisions are logged. No more.
5. **Build the project kit**, as `references/project-kit.md` says: the grey kit copied into
   `<packages>/kit/`, the project's tokens copied or exported into one CSS file beside `kit.css`, each
   class of the contract restyled on those tokens alone, then `parts.html` pictured for the founder.
   With no design system: the copy, then the drawing and the pictures.
6. **Make the project's pool.** Five folders under `<packages>/pool/`, each with a one-line
   `README.md` and nothing else, but for the stubs in `profiles/`:

   | Folder | Its `README.md` says |
   |---|---|
   | `profiles/` | One file for each profession this product serves, written from `templates/people/PROFILE-CARD.md` of the kit. |
   | `persons/` | The people this product is designed for, each of a profession that has its file in `profiles/`, or of none: a card is written to "The person card" in `pool/CARD-FORMAT.md` of the kit, and checked with the kit's `scripts/card.mjs`. |
   | `makers/` | This project's own makers: a card is written to `pool/CARD-FORMAT.md` of the kit, and checked with the kit's `scripts/card.mjs`. |
   | `judges/` | This project's own judges: a card is written to `pool/CARD-FORMAT.md` of the kit, and checked with the kit's `scripts/card.mjs`. |
   | `audiences/` | This project's own audiences: a card is written to `pool/CARD-FORMAT.md` of the kit, and checked with the kit's `scripts/card.mjs`. |

   The check those lines name is `node <kit root>/scripts/card.mjs check <file>`. A stub is one file
   for one profession, as `<packages>/pool/profiles/front-desk-coordinator.md`, written from
   `templates/people/PROFILE-CARD.md`: its id `profile.<name>`, every heading and all four labels
   kept, the example specialty deleted. Fill a field only from what the project's documents and the
   founder said of that profession, and write "Not known yet." where they said nothing. **Mark the
   evidence of every characteristic `guess`**: nobody of that profession has been heard.
7. **Check the engines, and record what each said.** Read the `engine` line of every card in the kit's
   `pool/makers/`, `pool/judges/` and `pool/audiences/`. An engine that is `own` needs no check. Each
   other engine is checked once:
   - **`skill:<name>`.** Is that skill installed on this machine, under that name? Look at the skills
     and the plugins the session lists, then in the project's `.claude/skills/` and the user's
     `~/.claude/skills/`. Do not run it.
   - **`model:any`.** One call for each `model:` entry of `engines-on`, with the model id the project
     profile holds for it; with no entry, the engine is off and nothing is sent. Write the line
     `Answer with the one word: ready.` to `<scratch>/engine-check.md`, then:

     ```
     node <kit root>/scripts/describe.mjs --text --provider <openai|gemini> --model <id> --brief <scratch>/engine-check.md --out <scratch>/engine-check.txt --profile <packages>/PROFILE.md --timeout 60000
     ```

     The script reads the project profile and finds the key itself. Exit 0 and its one line (the
     provider, the model, the characters, the seconds) are the proof that the engine answers: record
     that line, then remove `<scratch>/engine-check.txt`. On a refusal, record what the script said,
     as it said it: it never shows a key. Do not look for the cause in a keys file or in the
     environment: tell the founder what it said, and run it again only on his word that it is mended.
   - **`tool:stitch`.** Is the tool among those the session lists? That is the whole check: nothing is
     generated. A tool listed by name counts, loaded or not; one he refused at step 4 is `off`.
   - **A browser,** which the kit's scripts drive: one run on the kit's own specimen page.

     ```
     node <kit root>/scripts/shots.mjs <kit root>/kit/grey/parts.html --out <scratch>/browser --widths 1280
     ```

     Exit 0 and one picture: it answers. The script starts its own browser and stops it.

   Fill the `## Engine check` section of the project profile: the day, his answers to 5 and 6 of step
   4, then a table `| Seat | Engine | What the check found |` with one row for each seat of the kit's
   pool, and under it one line for the browser. What the check found is "nothing to check", for an
   engine that is `own`; `answers`, with the script's line; `installed`; `listed`; `missing`; `off`,
   for an outside engine he has not turned on; or the script's refusal. Frame reads this section.
8. **Write the lessons file.** Copy `templates/project/LESSONS.md` to `<packages>/LESSONS.md`, without
   its comment and without the entry it gives as a shape. Its title and the project profile's take
   the product's name from the sentence under `product`; when that sentence names none, ask him.

## Gate

**The founder corrects the project profile, once.** Put it in front of him whole, with the pictures of
the project kit's parts, and ask one question: what is wrong or missing in it?

- Write each correction into the project profile as he gives it, a rule in his words.
- Tell him that each stub of a profession's profile is a guess, and stays one until someone of that
  profession has been heard.
- When he has nothing more, write under `## Reviewed by the founder`, the last section: the day, what
  he corrected, and the words he approved it with. An approval that is only in the chat is not one,
  and until his words are there the project is not set up.

After the gate the project profile is changed by the designs that change it (a new direction, a new
standing rule), never rewritten from memory. Remove `<scratch>`, and go back to the conductor: the
first design starts at Frame.

## Never

- **Never open a keys file, and never list it.** `keys-file` is a path the founder gives. You write the
  path into the project profile and do nothing else with it: not to see that it exists, not to see what
  it holds.
- **Never put a keys file's path, or a key, on a command line.** `scripts/describe.mjs` finds its key
  itself: pass it `--profile` and nothing about a key, and never pass `--endpoint`. The shell is a
  command line too: write the path into the project profile with a file tool, never with a command.
- **Never ask for a key, never print one, and never write one.** Not in the chat, not in the project
  profile, not in any file. Never print the environment. If he pastes a key into the chat, write it
  nowhere and tell him it has been shown, so it should be replaced.
- **Never turn an engine on yourself.** `engines-on` holds what the founder said yes to, in his own
  answer, and nothing else.
- **Never invent a design system.** A project that has none says so in its project profile, and gets
  the grey kit as it is.
- **Never copy a real component into the project kit,** and never run the project's own build or its
  components to draw the kit.
- **Never invent a trait of a profession.** A stub says what was read or said, and is marked a guess.
- **Never ask two things at once,** and never ask what the project already says.
- **Never stop a process by name or by pattern.** The machine is shared. A browser is started only
  through the kit's scripts, which stop the one they started.
- **Never write a package, or anything outside `<packages>` and `<scratch>`.** Frame makes the first.
- **Never rewrite a project profile that the founder has reviewed.**
