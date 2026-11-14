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
its sections (their names, their order, text under each) and to a judge's checks (two to six of them,
and the table). A test holds the lists in this file to the checker's, so the two cannot drift apart.

The checker reads these written forms, and no other:

- A section's heading is `## Name`: two hashes, a space, the name, and nothing else on the line.
- A core check is a list item that is not nested: `-`, `*`, `+`, `1.` or `1)`, a space, and the check.
  It may be indented by up to three spaces.
- A table row begins and ends with a pipe, as `| id | trigger | method |`. A cell of the header row may
  be written with or without backticks. A row of dashes comes under the header row.
- A `##` line inside a code fence is not a heading. A fence opens with three or more backticks or
  tildes, and closes with at least as many of the same.

Only a reader can check the rest: that the title and the opening lines say what the seat is; that the
Method, with a brief, is enough for an agent that knows nothing else, and says what happens without the
engine; that a trigger is something that can be seen in the artefact; that each Never is a real
temptation; that Output names no file of the kit that is missing.

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
| `states-and-rules` | What the interaction designer wrote: the states table, the rules, the edge cases. |
| `strings` | The strings table: every string, in every language. |
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
