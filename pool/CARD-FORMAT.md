# The card format

A seat in the pool is a card: one plain Markdown file that tells a fresh sub-agent its one job, what it
may read and must never read, how it works and what it returns. A card is not an installed skill, so the
pool can grow without adding to what every session loads.

The conductor starts each seat from a brief. The brief names the seat's card by its absolute path and
says to read it first. The card's first step then sends the seat back to its brief.

This file is the contract every card keeps, the kit's and a project's own. `scripts/lib/card.mjs` checks
what a machine can check of it: `validateCard(text, { file })` returns every fault as one line, and an
empty list when it finds none. The rest is left to a reader. "What a machine checks, and what a reader
must", below, says which is which.

## Where a card lives

- A maker: `pool/makers/<name>.md`
- A judge: `pool/judges/<name>.md`
- An audience: `pool/audiences/<name>.md`

The name is lower-case words joined by hyphens. A project keeps cards of its own in its own `pool/`, in
the same three folders, under the same rules. A project card with the same id as a kit card replaces it.
A project's own card or person is checked, before it is cast, with
`node <kit root>/scripts/card.mjs check <file>`.

A fourth folder holds people, not seats: a person is `pool/persons/<name>.md`, and her card has a format
of its own, in "The person card" at the end of this file.

## The header

Flat frontmatter between two `---` lines: one `key: value` per line, a list written inline as `[a, b]`,
nothing nested. Every key below is required, and no other key is allowed. A list item that holds a comma
or a bracket is wrapped in double quotes.

| Key | Allowed | What it says |
|---|---|---|
| `id` | `<shelf>.<name>` | The seat's name in the pool: its shelf, a dot, and its file's name without the extension, as `maker.structure-describer`. |
| `shelf` | `maker` · `judge` · `audience` | The shelf it is on, which is the one its folder holds. |
| `job` | one line | The one question the seat answers first, or its job in one sentence. |
| `sits-at` | a list of at least one of `frame` · `context` · `intent` · `cast` · `structure` · `detail` · `look` · `handoff` · `acceptance` | The stages it can serve. |
| `cast-when` | one line | In one sentence, what about a design calls for it. |
| `presets` | a list, which may be empty, of `correction` · `adjustment` · `surface` · `flow` · `system` | The sizes of design where it sits by default. Empty: it sits only when Cast or the founder names it. |
| `loaded-with` | `profile` · `person` · `none` | What its brief loads it with: a profession's profile, one person, or nothing. |
| `reads` | a list of at least one name | What the seat may open. Its brief says which of these this design gives it. |
| `never-reads` | a list of names, which may be empty | Its blind list: what it does not open even when it could. Empty says nothing is hidden from it. |
| `engine` | `own` · `skill:<name>` · `model:any` · `tool:<name>` | What does the work: the card's own text, an installed skill, an outside model, or a tool. See Engines. |
| `suggested-model` | `fable` · `opus` · `sonnet` · `haiku` · `none` | The model the seat is suggested to run on, by family, never by version. |
| `suggested-effort` | `low` · `medium` · `high` · `xhigh` · `max` · `none` | The reasoning effort it is suggested to run at. |
| `verified` | a date, `YYYY-MM-DD` | The day the card and its engine were last checked. |

## The body

After the header come a title and a line or two saying what the seat is. Then the sections below, under
these exact names, in this order, each with text under it. A card has no other `##` section: one that
needs another needs a change to this format first.

1. `## Core checks`: a judge only. The checks that always run, two to six, as a numbered or bulleted list.
2. `## Optional checks`: a judge only. A table with the columns `id`, `trigger`, `method`, and a row
   for each check. A trigger is something that can be seen in the artefact, and its check runs only
   when it is seen. Every row fills all three cells. The table may have no rows.
3. `## Method`: how the seat works, step by step, said to the agent that sits in it. With the brief, it
   must be enough for an agent that knows nothing else. It says what the seat does when its engine is
   missing.
4. `## Output`: what the seat returns and where it goes in the package. It names a file of the kit only
   if that file exists.
5. `## Never`: what the seat must not do. Each line is something it could really be tempted to do.
6. `## Borrowed`: what the card took from elsewhere and from whom, with the attribution a licence asks
   for, and the skills that were read before its engine was chosen. It may say "nothing".

A maker and an audience have neither of the first two.

### What every judge keeps

A judge, the kit's or a project's own, keeps five rules:

1. Its `never-reads` holds `maker-notes`, `author-map` and `other-ledgers`. A judge is blind to the
   makers' reasoning, to who made what, and to what the other judges found.
2. Its Method opens with the job before the craft: first whether the artefact does its job for the
   person in the intent, and only then whether it is good of its kind.
3. It runs its core checks every time, and an optional check only when it sees the trigger in what it
   was handed. Its ledger lists every optional check it did not run, with the reason.
4. Its Output names the ledger and says what a ledger holds.
5. It never fixes, redesigns or approves. It reports. The maker fixes, and the founder decides.

The checker holds a judge to the first of these. The other four are a reader's to check.

## Engines

An engine is what does the seat's work.

- `own`: the card's own text, read by a Claude sub-agent.
- `skill:<name>`: an installed skill the seat loads as its lens. The name is written as it is installed,
  with its plugin before it when it has one: `skill:<plugin>:<skill>`.
- `model:any`: an outside text model, called by a script. The card serves whichever provider the
  project turns on, and Cast names the one that runs.
- `tool:<name>`: a tool the session has connected, such as a screen generator.

Three rules bind every card.

1. **A card works without its engine.** Its Method says what happens when the engine is missing: the
   seat runs on the card's own text, or, when the seat is nothing but its engine, it is not cast. No
   stage waits for a tool.
2. **A missing engine is said at Frame.** Frame looks for the engines the cast may need and tells the
   founder which are missing, before anything is cast on them.
3. **Outside engines are off unless the project turns them on.** An engine that sends a brief off the
   machine runs only when the project's profile lists it in `engines-on`. An entry there is written in
   the card's own spelling of an engine: `model:openai`, `model:gemini`, `tool:stitch`. A card whose
   engine is `model:any` is on when any `model:` entry is.

## Model and effort

`suggested-model` and `suggested-effort` are suggestions, never instructions. Nothing in the kit enforces
them. Cast shows them, and the founder may change any of them. A seat that says `none` runs on the
session's model and effort, or on its engine when that is a model or a tool. The reasons behind the
suggestions, and the day they were last reviewed, are in `pool/MODELS.md`.

## What a machine checks, and what a reader must

The checker holds a card to its header (every key, every allowed value, the id against the file), to
its sections (their names, their order, text under each), a judge to its checks (two to six of them,
and the table) and to the three names it is blind to. A test holds the lists in this file to the
checker's, so the two cannot drift apart.

The checker reads these written forms, and no other:

- A section's heading is `## Name`: two hashes, a space, the name, and nothing else on the line.
- A core check is a list item at its list's own level, not nested in another: `-`, `*`, `+`, `1.` or
  `1)`, a space, and the check. It may be indented by up to three spaces. A list that starts again
  after a paragraph is read at its own indentation.
- A table row begins and ends with a pipe, as `| id | trigger | method |`. A cell of the header row may
  be written with or without backticks. A row of dashes comes under the header row. Anywhere else in
  that section, in a cell or in a sentence, a pipe is written `\|`.
- A line inside a code fence is never a heading, a core check or a table row. A fence opens with three
  or more backticks or tildes, and closes with at least as many of the same.

Only a reader can check the rest: that the title and the opening lines say what the seat is; that the
Method, with a brief, is enough for an agent that knows nothing else, and says what happens without the
engine; that a trigger is something that can be seen in the artefact; that each Never is a real
temptation; that Output names no file of the kit that is missing; and, of a judge, the last four of
the rules every judge keeps.

## The names in `reads` and `never-reads`

The two lists hold short names for what a package and a project hold. These are the names the kit's cards
use. A card that needs another adds its row here.

| Name | What it is |
|---|---|
| `brief` | The brief the seat was started from. Every seat has one. |
| `walkthrough-format` | How a structure is written down: the roles and containers of `kit/KIT-CONTRACT.md`, and the rules `scripts/lib/walkthrough.mjs` checks. |
| `source-screen` | What a transcriber is handed: the screens of one concept, one or two, or one answer in prose. |
| `context` | The approved context: who she is, and its inventory of what the product can show and do. |
| `intent` | The approved intent: the person in her moment, the job, the tasks, the states, the success criteria. |
| `chosen-structure` | The structure the founder picked. |
| `states-and-rules` | What the interaction designer wrote: the states table, the rules, the edge cases, the data map and the dependencies. |
| `strings` | The strings table: every string in every language, each with its why-line. The why-line is part of the table and goes with it to the handoff: it is not a maker's note. |
| `prototype` | The plain prototype: its pages, and the stable ids on them. |
| `kit` | The shared kit, the project's or the grey one: its stylesheets, its parts and its contract. |
| `tokens` | The project's token file. |
| `design-system` | The project's design system: its tokens, parts, patterns and conventions. |
| `fresh-marks` | What the founder marked in a fresh pass, with the fresh screens he marked it on. |
| `other-proposals` | What the other makers at the same stage proposed, chosen or not. |
| `session-idea` | Anything the conducting session thinks the answer is. |
| `current-screens` | Today's interface: its screens, its source, its navigation. |
| `sibling-surfaces` | The conventions of the product's other surfaces. |
| `describers-brief` | The context brief the structure describers were given. |
| `generator-prompt` | The prompt a screen generator kept beside its screen. |
| `component-source` | The source of the project's real components. |
| `options` | The structure proposals as merged for the board: each drawn in the same kit and named by a letter, with nothing saying who made which. |
| `final-screens` | What Look made: the finished screens as static pages on the project's tokens, with the table of measured values and the list of named extensions. |
| `pictures` | Screenshots of an artefact (today's interface, the options, the prototype, the final screens or the build) at each width and in each theme. |
| `handoff-folder` | The handoff folder, whole: the only thing the implementing session is given. |
| `build` | The built interface at Acceptance: what the builder wrote back (what was built and where, how to reach each state, what deviates), the files it built or changed, pictures of each state, and the results of the acceptance checks run in it. |
| `package` | The design's package apart from the handoff folder: every stage's folder, with all the stages wrote. |
| `profile` | A profession's profile card: its base, and the section for the specialty the design serves. |
| `profile-traits` | A profile with every "So the interface must" line taken out: what is true, who it does not hold for, and the evidence. It is what an audience is handed, since those lines are what a judge holds a design to. |
| `person` | One person's card: someone in a moment, with her job, what she never does and the one check. An audience is handed the one it is seated as. |
| `product-facts` | The project's own record of what the product does and what may be said of it, where it keeps one. |
| `earlier-ledger` | The same seat's ledger from an earlier read of the same artefact. On a re-read it is opened only after the artefact has been read again, cold. |
| `maker-notes` | What a maker said about its work and not as part of it: its reasons, its reply, what it assumed, what it set aside. A string's why-line is not one: it is part of the strings. |
| `author-map` | The record of which maker, engine or model made which option or artefact. |
| `other-ledgers` | Another judge's ledger on the same artefact. |
| `task-reads` | What an audience wrote after trying a task: where it got stuck. |

## The person card

A person is not a seat. She is someone in a moment: the one a design is made for, and the one an audience
is asked to be. One card serves both. A maker's brief hands it over to design for her, and an audience's
brief seats a fresh agent as her. No instance is ever given both.

She lives in `pool/persons/<name>.md`, the name in lower-case words joined by hyphens. The kit ships five
with no profession. A project keeps its own in its own `pool/persons/`, under the same rules, and one with
the same id as a kit person replaces her. `validatePerson(text, { file })`, in the same module as
`validateCard`, checks what a machine can and reports it the same way.

The header is flat frontmatter, as a seat's is. Every key is required, and no other is allowed.

| Key | Allowed | What it says |
|---|---|---|
| `id` | `person.<name>` | The word person, a dot, and her file's name without the extension, as `person.first-timer`. |
| `profile` | `profile.<name>` · `none` | The profile of her profession, by its id: what is true of the whole group, which she inherits. With `none` she has no profession, as the kit's five have none. |
| `specialty` | a name · `none` | Her specialty within that profile, named as the profile names it. With `none` she is of the profile's base alone. It is `none` always when `profile` is `none`. |
| `evidence` | `fact` · `guess` · `mixed` | What the card rests on. `fact`: every line has a source, someone who said it or saw it, and the card names it. `guess`: no line has one yet. `mixed`: some lines have, and the card marks which. |

After the header come a title and a line or two saying who she is. A card that is a guess says so there.
Then four sections, under these exact names, in this order, each with text under it. A person card has
no other `##` section.

1. `## The moment`: a scene, never a list of traits. Where she is and on what, what she has in her
   hands, what just happened, what she is about to do.
2. `## The job`: what she is trying to get done in that moment, and what "done" is to her.
3. `## What she never does`: what no design may count on her doing. The heading is written this way
   whoever the person is.
4. `## The check`: the one question a maker or an audience asks of a screen on her behalf.

The checker holds a person to her header and to her sections, whose headings it reads in the written
form given above. The rest is a reader's, and one test comes before any other: if the card does not
force a design decision you would not have made anyway, it is not finished. What is true of everyone in
her profession belongs in the profile, not here: "comfortable with software" is the profile's, and "the
phone is at her ear and the screen is angled away" is the moment.
