# The interface design pipeline — design

**Status:** approved by the founder, 2026-11-13 · nothing is built yet · next: the build plan.
**Replaces, once built and proven (§ 17, § 19):** the kit as it stands today — `RUNBOOK.md`, `phases/`,
`setup/`, `templates/`, `reference/`.
**Written to be planned from** without the conversation that produced it. Where a choice was the
founder's it says so; where it was the author's it is marked *(author's call)* and listed in § 22.

---

## 1. Why

The kit today is one agent running eight phases. It interviews, proposes directions, makes the mockups,
scores its own variants, recommends one, builds it and closes its own QA gate. Three real runs (a company
website; two efforts inside the product Verbato) showed where practice moved past the text: evaluations and
QA reports with no template, a visual direction that took five rounds, mockups and checks that turned into
scripts, an audit gate that was dropped once and repurposed once, a state file that became a log, and no
change to the kit since the day it was written.

In the same weeks a second process, built for marketing pictures in Verbato, got good results by other
means:

- one artefact per review, in a fixed order, the founder correcting the context before anything is made;
- **makers and judges are different, fresh sub-agents** working from written briefs;
- options start cheap, are proposed blind to each other, and are shown without their authors;
- each judge has one job, asks "does it do its job for this person" before "is it well made", and
  reports evidence and a first fix — it never rewrites and never approves;
- a simulated audience reads blind, and only its ranking counts;
- the founder picks from pictures, never from descriptions;
- a lessons file is appended after every piece.

This design brings that into interface design, for both layers, as a generic kit any project can use.

- **UX** — how the product works and how the person feels using it: the logic of the interaction, the
  steps, the states, the words. It solves her problem without friction.
- **UI** — the visual layer she touches: the graphic, tangible form of the structure UX defined.

## 2. Goals, non-goals, anti-goals

**Goals**

1. A design leaves as one folder that another session, with no part in the design, can build from
   without asking a question or guessing.
2. Makers and judges are never the same agent; which makers, judges and audiences sit is chosen per
   design, with the founder, from a pool.
3. Any stage can be resumed from disk alone, by a session that has never seen the conversation.
4. It scales down: a correction costs one nod.
5. It is generic. Stages carry procedure only; a project supplies its facts and its people.
6. It learns: lessons are appended after every design, and profiles improve with every read.

**Non-goals**

- Implementing the design. The kit ships a guide for the implementing session and a stage that checks
  the build, nothing more.
- Running on tools without sub-agents. The pipeline targets Claude Code. The handoff folder is plain
  Markdown, HTML and JSON, so any tool can implement from it. *(author's call, delegated by the founder)*
- User research. Profiles record evidence; they do not produce it.
- Marketing pictures and video. Verbato's pictures playbook stays what it is.
- Replacing a project's own design-system documentation.

**Anti-goals** — it has failed, even if it runs, when:

- small work carries so much ceremony that the process is skipped;
- the judge panel makes every design cleaner and emptier each round (the marketing lesson: safe briefs
  plus judges who reward reduction converge on the generic);
- the founder approves long documents instead of looking at pictures;
- a simulated read is quoted as evidence about real people;
- a seat silently skips a check, or a session shortlists before the founder has marked;
- the same person is described in two places that can disagree;
- a fresh concept is built as it came, and a second style grows beside the design system.

## 3. Three rules, and the words used below

1. **Stages hold procedure. Seats hold opinion. The project holds facts.** A stage skill says what
   question is answered, what is read, what is written and who decides. It carries no taste. Taste comes
   from the seats that are cast; facts come from the project's profile and sources.
2. **Structure is chosen before look.** An interface has two layers of concept. A finished-looking mockup
   wins on paint and locks in a weak structure, so the way of solving the problem is picked first, with
   every option drawn in the same plain kit.
3. **One package on disk passes from stage to stage.** The chat is never an input. What the founder says
   counts once it is written into the artefact, in his words.

| Word | Meaning |
|---|---|
| **Package** | The folder of one design, in the target project. Holds every stage's output and the state file. |
| **Stage** | One step of the pipeline with one question, one output and one gate. Each is a skill. |
| **Seat** | A role an agent plays for one stage: a **maker** proposes, a **judge** critiques, an **audience** uses. |
| **Card** | A plain file describing a seat, or a person. Cards live in the pool. |
| **Pool** | All available cards: the kit's generic ones plus the project's own. |
| **Cast** | The seats chosen for one design, and the stage that chooses them. |
| **Engine** | What a seat runs on: its own text, an installed skill it wraps, or an outside model. |
| **Profile** | A card describing a profession: what is true of the group. |
| **Person** | A card describing one individual of a profile, in one moment, for one surface. |
| **Shared kit** | The plain HTML and CSS parts every Structure proposal and Detail prototype is drawn with (§ 12). |
| **Fresh pass** | The same design made a second time by makers who know nothing of what exists, for comparison (§ 12). |
| **Carry list** | The end of every stage output: the earlier approved sections the next stage inherits. |
| **Ledger** | A judge's report: findings with evidence, severity and a fix. |
| **Decision page** | One screen for the founder: the options as pictures, one line per seat, one recommendation, one question. |

## 4. The pipeline

| # | Stage | Question | Reads | Writes | The founder |
|---|---|---|---|---|---|
| 0 | **Frame** | What kind of interface, starting from what, how big — so which stages run? | the request; the project profile | `00-frame.md` | confirms |
| 1 | **Context** | What is true before anyone has an idea? | frame; the project's sources | `01-context.md` | corrects |
| 2 | **Intent** | Who, in what moment, to get what done — and how will we know? | context | `02-intent.md` | approves |
| 3 | **Cast** | Who makes, who judges with which checks, who plays the user? | intent | `03-cast.md` | edits by exception |
| 4 | **Structure** | Which way of solving it? (UX) | intent, cast | `04-structure/` | picks, from pictures |
| 5 | **Detail** | Does the chosen structure hold in every state and every language? (UX, and the words) | the chosen structure | `05-detail/` | approves |
| 6 | **Look** | What does it look like, finished? (UI) | detail | `06-look/` | picks or approves, from pictures |
| 7 | **Handoff** | Can a session that was not here build it without asking? | everything approved | `07-handoff/` | one go |
| 8 | **Acceptance** | Did what was built match what was approved? | handoff; the running build | `08-acceptance/` | accepts |

Each stage is its own skill. Two more skills stand outside the nine: the **conductor**, which holds the
order, the state file, the routes and the loop every stage shares (§ 6), and **setup**, run once per
project before its first design (§ 4.9).

### What became of the marketing gates

| Marketing gate | Here |
|---|---|
| context | **Stays and grows**: what exists today, and what the product can really show and do. |
| intent | **Stays**: "think, feel, do" becomes the job, success criteria, tasks and states. |
| concept | **Splits in two**: Structure (UX), then Look (UI). |
| words | **Stays, moves earlier**: inside Detail, before the look. A label is structure, and a layout must be drawn for the real strings in every language. It gets a review of its own only for kinds where words are the product (first run, messages, public pages). |
| masters | **Replaced** by Handoff: another session builds. |
| — | **Added**: Frame, Cast, Acceptance; and Direction, a mode of Look, when no design system exists. |

### 4.0 Frame

- **Written by** the session with the founder, in one exchange. No makers, no judges. If the project has
  no profile yet, setup runs first (§ 4.9).
- **Writes `00-frame.md`:** the request in his words; the **kind**, the **foundation** and the **size**
  (§ 5); the route — each stage marked full, short or skipped, with the reason; whether the experience is
  for one profile, several, or everyone; the provisional cast from the preset; any preset seat whose
  engine is missing on this machine.
- **Gate:** he confirms in one message.

### 4.1 Context

- **Written by** the session. When a surface already exists, the cast's judges first read it as it is,
  from screenshots, and their findings become the problem statement.
- **This is the one stage that reads the world.** It may read the project's code, documents, data and
  analytics; reading is not implementing. Whatever it takes is written into the context with its source.
  It also lists the **project sources** later stages may open directly (the token files, the component
  source, the product-facts document). Later stages read the package and those listed sources, nothing
  else.
- **Writes `01-context.md`:**
  - the problem, and why now;
  - the people: roles, the profiles involved (loaded from the project's pool; if one is missing it is
    drafted here with every trait marked *guess*, corrected by the founder, and saved to the pool);
  - what exists today;
  - **what the product can show and do** — the data, actions and states that really exist, each with its
    source. This is the inventory the truth judge checks against;
  - constraints: the design system, the accessibility target, languages, devices, the profile's standing
    rules;
  - what was tried and rejected;
  - **the angles considered** — at least three ways of framing the problem, each with its risk; never one;
  - what the design must not become;
  - **the founder's own words**, asked for here, once (§ 25, amendment 2): what she calls these things,
    and any word she must never see. They go verbatim into the writer's brief later;
  - the questions for him, each with a recommendation.
- **Gate:** he corrects. His corrections are written under *Reviewed by the founder*.

### 4.2 Intent

- **Written by** the session from the corrected context. One page per surface; a flow gets one page for
  the whole and a short one per surface.
- **Writes `02-intent.md`:**
  - the person in the moment (a person card, § 8);
  - the one job, in one sentence;
  - what she arrives with and what she leaves with;
  - **success criteria**: two or three testable sentences. The test: could two people disagree about
    whether it was met? Then sharpen it;
  - **the tasks an audience will be given**: a starting situation and a goal in her words, never the path;
  - **the states that exist** — the ten rows (empty first-ever, empty filtered, loading first paint,
    loading refresh, partial, error recoverable, error terminal, no permission, success, overflow), each
    filled or marked "cannot occur because …";
  - the feeling, in her word;
  - where it must behave like its sibling surfaces and where it may differ;
  - the measure: which event will say it worked;
  - the constraints that will bite.
- **Optional, cheap:** the profile judge reads the intent — is the job stated as this profession would
  state it?
- **Gate:** he approves.

### 4.3 Cast

- **Reads** the intent. Proposes from the kit's `pool/INDEX.md` and the project's pool, starting from the
  preset for this kind and size.
- **Writes `03-cast.md`:** per remaining stage, a table — seat · loaded with which profile or person ·
  checks on and off · engine · the suggested model and effort, which he may change · why it is here; what
  was left out and what is lost without it; the number
  of agents per stage as the cost line; the blind rules for this design (§ 12); whether a **fresh pass**
  runs at Structure, at Look, or both (§ 12).
- **Gate:** he edits by exception. Each seat is explained in one line: what it catches, what it costs.
- Later stages may **add** a seat or a check when the artefact triggers it, and say so. Nothing is
  removed silently.

### 4.4 Structure

The adaptation of "concepts start cheap and blind" (§ 12 has the mechanics).

- **Makers:** two to four structure describers, fresh, blind to each other. Their proposals are then
  drawn by a script, not by an agent.
- **Each proposal:** a name; its bet in one sentence; what it is deliberately bad at; the walkthrough —
  screen by screen, what she sees in priority order and what she can do, in a small fixed vocabulary of
  roles (heading, text, choice, input, primary action, list, status …), never component names; what is
  absent on purpose; how it behaves in the hardest state. The describer's first idea is written down and
  set aside. **"No interface" — do it silently, confirm after — is always among the kinds considered.**
- **The walkthrough is written in a strict format a script can parse.** Arrangement is expressed only
  through a few containers (screen, region, group, dialog, in-place expansion). One proposal differs from
  another in sequence, grouping, priority, what is present and which container holds it — never in free
  layout. *(author's call)*
- **The `render` script** draws every proposal's frames in the shared kit (§ 12), at the primary width
  and at phone width, with real words. Because one script draws them all, no proposal looks better made
  than another.
- **A fresh pass, when cast (§ 12):** its concepts join the board as more letters, redrawn in the shared
  kit, and are also shown as they came, in a gallery of their own beneath it.
- **Readers:** the judges and audiences the cast names, by option letter. Typically usability, truth, the
  profile judge (a ranking and any blocker) and one audience task read.
- **Decision page:** the options side by side, one line per seat, a recommendation, one question.
- **Gate:** he picks. A pick with named grafts ("B, with A's status treatment") is allowed, is redrawn and
  re-read once, and is written down exactly. "A bit of each" is not a pick. *(author's call)*
- **If he rejects all:** the input is wrong. Reopen Intent or Context (§ 6); do not ask for more
  proposals against the same brief.
- **Writes `04-structure/`:** the brief as he approved it, the proposals, the sealed author map, the
  board, the reads, the decision page, and `CHOSEN.md` — the structure that goes forward.

### 4.5 Detail

- **Makers:** an interaction designer (every state, every rule, the focus order, the edge cases); an
  interface writer (every string, in every language, written for the surface — never one language from
  the other; briefed with the founder's own lines); a prototype builder (the clickable plain prototype:
  static HTML on the shared kit, every page generated from one description per screen plus the strings
  table, so that no state and no language is copied by hand).
- **Judges:** usability; truth (every element traced to the context's inventory); words; the profile
  judge's main read; accessibility at the level of structure. **Audience:** a task read on screenshots of
  the prototype, per language.
- **Gate:** he approves on the prototype. For a kind where words are the product, the words are a
  separate question.
- **Writes `05-detail/`:** the prototype (one page per screen × state × language, with an index), the
  strings table, the rules, the states table, the data map (each element → where its content comes
  from), the reads.

### 4.6 Look

Two modes.

- **Inside a design system (the usual case).** One visual designer applies the system: hierarchy,
  spacing, emphasis, density, responsive behaviour, themes, and motion where it is cast. Variants only
  where there is real latitude, and then on one named axis. The output is the final screens, as HTML on
  the project's real tokens, for every screen × state × language × theme at each width, with a table of
  measured values and reference screenshots.
- **Direction (no design system, or a surface that deliberately leaves it).** Two or three directions of
  different kinds, each named, with a thesis and a stated cost, rendered on the same detailed screen. He
  picks from pictures. The pick becomes the tokens, and the project profile is updated to point at them.
- **A fresh pass, when cast (§ 12):** one or two makers who know nothing of the design system draw the
  screen that carries the idea, from the approved detail. Their screens are shown beside the system
  version; what the founder marks is rebuilt on the tokens as a named extension of the system.
- **Judges:** visual craft; system fidelity; accessibility, measured; the profile judge only if one of
  its triggered criteria concerns legibility or context.
- **Gate:** he picks (variants or directions) or approves (one proposal).

### 4.7 Handoff

- **Written by** the session from everything approved. § 13 defines the folder.
- **Judge:** the cold implementer — a fresh agent given only the folder.
- **Gate:** one go.

### 4.8 Acceptance

- **Runs in a separate session, after the build.** Reads the handoff folder, what the implementing
  session wrote back (§ 13), and the running build.
- **Reaching the states.** In the prototype every state is a page. In a build, a state sits behind
  sign-in, data and network conditions that only the implementing session knows. So the checks are
  written against a state and its stable ids and say nothing about how to get there; the implementing
  session writes a **state map** — for each state, how to reach it in the build. Acceptance drives each
  state from that map, in the browser, the way the project profile says a check is run; the `accept`
  script asserts and measures once the state is on screen. The implementer is not asked to make every
  state an address. *(author's call)*
- The cast's judges re-read screenshots of the build; one audience task read.
- **Writes `08-acceptance/`:** each item *matches* or *deviates*. A deviation the founder accepts is
  logged, and the package is brought up to date so the design on disk is what shipped. A deviation to
  fix goes out as `FIXES.md`, written like a handoff slice (*Context · Task · Done when · Verify*), so
  any implementing session can take it. Acceptance does not implement, except a fix the size of a
  correction, after the founder's nod (§ 5). Appends the lessons (§ 14).

### 4.9 Setup — once per project *(author's call; the reviewer found the gap)*

Frame reads the project profile, so something has to write it first. Setup is a skill of its own, run by
the conductor whenever a project has no profile.

- **It reads the project** — the design system that exists, its tokens and component source, the
  product's own documents — and asks the founder the few things it cannot read: the product in one
  sentence, the languages, his standing rules for interfaces.
- **It writes:** `PROFILE.md` (§ 15); the **project kit** (§ 12); the empty pool folders; the list of
  professions the product serves, as profile stubs with every trait marked *guess*; and the result of an
  engine check — for each seat of the first set, whether the skill it would wrap is installed and
  answers.
- **Gate:** the founder corrects the profile once. It is then updated by the designs that change it (a
  new direction, a new standing rule), never rewritten from memory.

## 5. Routes — what Frame decides

Three properties of the request decide which stages run and who sits by default.

**Kind** — what the interface is for. It sets the audience's way of reading, the preset cast and the
kind's own rules. The kit ships five; a project may add its own in its profile. *(the list is the
author's call)*

| Kind | Judged first on | Note |
|---|---|---|
| Working surface | finishing the task, repeatedly | density and speed matter |
| First run | understanding and starting without reading | words get their own review |
| Form or transaction | completing without error | recovery matters most |
| Message (email, notification, error) | understanding and the next step | words get their own review |
| Public page | stop, understand, click | the truth judge always sits |

**Foundation** — what it starts from.

| Foundation | Effect |
|---|---|
| No design system | Look runs once as Direction first. |
| System exists, surface is new | The standard route. |
| Surface exists and is wrong | Context opens with an as-is read. Structure's describers do not see the current layout, unless the cast names one continuity maker who does. |
| Surface exists, small change | See size. |

**Size**

| Size | What it is | Route |
|---|---|---|
| **Correction** | A wrong label, token, spacing value | Frame in one line → a before-and-after picture → the founder's nod → a one-paragraph record. No pool. **The same session may apply it** *(author's call, delegated)*. |
| **Adjustment** | Moving an element, changing a state's copy | Frame, a short Context (what exists, what changes), Intent in two sentences with its criteria, a preset cast of one or two judges, Detail and Look as deltas, a short Handoff. Structure is skipped unless the structure changes. |
| **Surface** | A new screen or a redesign | Everything. |
| **Flow** | Several surfaces that form one task | Everything; Structure treats the flow as one thing; Detail and Look go surface by surface. |
| **System** | A new product, a rebrand | Everything, plus Direction. |

The size only moves up. A correction that turns out to touch more stops, says so and re-enters at the
larger size. Nothing moves down mid-run.

## 6. The conductor: the loop, the state, resuming

### The loop every stage runs

1. Read `STATE.md`. Check that this stage's inputs are approved and not stale.
2. Read the previous stage's output and exactly what its carry list names. Ignore the chat.
3. Write what the stage itself writes.
4. Where makers sit: write their brief from the template — **context only, never the design** — and, at
   Structure always, show it to the founder before it goes out. Launch the makers as fresh sub-agents.
   Merge blind where there are several.
5. Launch the judges and audiences as fresh sub-agents. Each brief names the seat's card, what it reads
   and what it must not open.
6. At a stage where he **picks**, the reads go beside the options. At a stage where he **approves**, the
   blocking findings are fixed first by a maker round and re-read by a fresh judge, who marks each one
   *fixed, partly, still present*. **One fix round and one re-read by default**; what remains goes to him
   as open findings with a recommendation. *(author's call)*
7. Write the decision page. It opens with the identity line: *design · kind · size · stage n of m*.
8. Write his answer into the artefact under *Reviewed by the founder*. His notes are calibration, not
   orders: where a note meets a rule or a fact of the product, say so at once, with the source, and offer
   the true version.
9. Stamp the artefact approved, write its carry list, update `STATE.md`, append any decision to the
   package's `DECISIONS.md` (append-only: decision, why, rejected, consequence).

The session orchestrates and keeps a thin context; the reading and the making happen in sub-agents.

### The state

Every stage output opens with a small header: its stage, version, status, when and in which words it was
approved, the versions it was built from, and at the end its carry list. `STATE.md` at the package root
lists every stage with its status — *not started, in work, awaiting the founder, approved, skipped by
route, stale* — the route, the cast, and the one open question. A script can read both.

### Requirement: "each stage uses only the output of the previous stage"

Read literally, each stage would restate everything the next one needs, and a restatement of a
restatement drifts. **The reading the founder accepted:** every output ends with a carry list naming, by
path and version, the earlier approved sections the next stage inherits unchanged. A stage reads the
previous output, what it carries, and the project sources Context listed. Never the chat, never working
files, never a rejected option.

### Resuming and reopening

- **Resume:** any session, given the package, reads `STATE.md` and continues at the first stage that is
  not approved.
- **Reopen:** any stage may ask to go back, with its reason. With the founder's yes, the earlier artefact
  is revised and gets a new version; every later artefact built from the old version is marked *stale*
  and is redone or re-confirmed.

## 7. The pool

Three shelves of seats — makers, judges, audiences — and one shelf of people (§ 8).

**A seat is a plain file, a card. It is not an installed skill**, so the pool can grow without adding to
what every session loads. A sub-agent is started fresh from a brief that names its card.

### What a card states

| Field | Content |
|---|---|
| id, shelf | e.g. `judge.accessibility` · maker, judge or audience |
| job | The one question it answers first |
| sits at | The stages it can serve |
| cast when | In one sentence, what about a design calls for it |
| presets | The kinds and sizes where it sits by default |
| loaded with | A profile, a person, or nothing |
| reads / never reads | The sections it may open, and its blind list |
| core checks | The few that always run (judges) |
| optional checks | Each with a **trigger** — something observable in the artefact — and a method |
| method | How it works, in the card's own words |
| output | The template it fills |
| engine | Its own text · an installed skill it wraps · an outside model called by a script |
| suggested model, suggested effort | The model and the reasoning effort the seat is suggested to run on. A suggestion, never an instruction (below) |
| verified | The date its engine was last checked |

**Every card works without its engine.** If the skill it wraps is not installed, the seat runs on its own
text, and Frame says so. Outside models are off unless the project's profile turns them on.
*(author's call)*

`pool/INDEX.md` lists every card in one row: id, job, cast when. Cast reads the index, not the cards.

### Model and effort are suggestions *(the founder, 2026-11-13)*

Each seat is a fresh sub-agent, and a sub-agent can be started on a chosen model at a chosen reasoning
effort. The aim is the best tool for the job, not the cheapest. So every card carries a **suggested
model** and a **suggested effort** — and they are suggestions, never instructions: nothing in the kit
enforces them, Cast shows them, and the founder may change any of them. A seat with no suggestion runs on
the session's model.

What the suggestions rest on *(author's reasoning; the models are tiers of capability, not specialists)*:

1. **Judgement or mechanics.** A seat whose output the founder picks from, or that gates a stage, is
   suggested on the most capable model. A tightly specified seat is suggested on a faster one.
2. **A different model for the judge.** Where another model is available, a judge or an audience is
   suggested on a different model from the maker it reads: two models share fewer blind spots than two
   copies of one. This too is a suggestion.
3. **Range where ideas are born.** When several describers sit at Structure, they are suggested across
   different models.
4. **Effort is the second dial:** higher for seats that make ideas or judge them, lower for mechanical
   ones.

The reasoning and the date it was last reviewed live in one file, `pool/MODELS.md`, because which model
suits what goes stale as fast as the list of tools. Cards name models by their family alias, never by a
version.

### The first set *(author's call; the first real run needs these)*

| Shelf | Card | Its one job | Could wrap |
|---|---|---|---|
| Maker | structure describer | propose one way to solve it, as a walkthrough | several instances with different lenses: fewest steps, guided, defaults first, in place |
| Maker | interaction designer | every state, rule and edge case | — |
| Maker | interface writer | every string, per language | a project's transcreation skill |
| Maker | prototype builder | build the clickable prototype on the shared kit | — |
| Maker | visual designer | the finished screens | `frontend-design`, `emil-design-eng` |
| Judge | usability | can she finish the job without help? | — |
| Judge | truth | does everything shown exist in the product? | a project's claims skill and facts document |
| Judge | words | does it sound like a person, and say the same in each language? | a project's transcreation skill, judge mode |
| Judge | accessibility | can someone who does not see, point or read as the designer does still use it? | a browser, for the measured checks |
| Judge | visual craft | is it good of its kind? (hierarchy, spacing, type, colour, alignment … as optional checks) | `design-audit`, `typography` |
| Judge | system fidelity | is it made of this product's parts? | the token and component source |
| Judge | profile | would this work for this profession? (§ 10) | — |
| Judge | cold implementer | could I build this without asking? | — |
| Audience | task reader | try the task, cold, and say where I got stuck (§ 11) | — |

**Added when first needed:** motion designer, direction maker, as-is reader, scroll reader (for public
pages: stop, understand, click), and outside-model describers.

### The project's side

A project adds cards under its own `pool/`, and in its profile may **pin** a seat (always sits), **ban**
one, and turn engines on. A project card with the same id as a kit card replaces it.

## 8. People: profiles and persons

Two cards, and only two.

- **Profile** — a profession. What is true of the group, stable across surfaces. It lives in the
  project's pool. **A profile is a base card with a section per specialty** (the founder's decision): a
  radiologist and a surgeon share a base and differ in context and documents. A specialty section
  overrides or adds characteristics; anything it does not mention is inherited.
- **Person** — one individual of a profile, and a specialty, in one moment, for one surface. It inherits
  the profile and adds the situation: where she is, on what, with what in her hands, what just happened.
  This is what the kit called a persona. The old persona card mixed the two: "tech comfort: moderate" is
  profile; "phone to her ear, monitor angled away" is the moment. The old quality bar stays, on the
  person: *if the card does not force a design decision you would not have made anyway, it is not
  finished.*

The kit also ships a few **generic persons** with no profession — a first-timer, a daily expert, someone
hurried on a phone, a keyboard user, a second-language reader — for projects with no profiles, and as
contrast seats.

### One card, three uses

| Use | Reads | Knows the intent | Produces |
|---|---|---|---|
| The makers' brief | the person, and through it the profile | yes | the design |
| The audience seat | the person and the task | **no** | a first-person task read |
| The profile judge | the profile, the intent, the artefact | yes | a verdict per criterion, with fixes |

The same instance never plays two of these.

### The profile template

Every characteristic has the same four fields:

| Field | Content |
|---|---|
| What is true | The trait, in one or two sentences |
| Who it does not hold for | The part of the group it misses |
| Evidence | *fact* (with its source), *guess*, or *unknown* |
| So the interface must … | One to three checkable sentences. **These are what the judge evaluates.** A trait without this line is trivia. |

**Always defined (seven):**

1. **Scope** — the profession, the specialties, the countries and settings the card speaks for, and
   those it does not.
2. **The work** — what they produce with the product, what "done" means to them, who receives it.
3. **Technological familiarity** — the level, and the tools they already use every day, as reference
   points.
4. **Usage context** — place, device, posture, who is around.
5. **Time and attention** — pressure, interruptions, how often they use it.
6. **Error tolerance and stakes** — what a mistake costs, and what they must see or check before acting.
7. **Domain vocabulary** — their words for the objects and the actions, in each language; words to avoid.

**Optional — added when a design touches them:** confidentiality and regulation · delegation and
hierarchy (an assistant, a resident, who pays) · physical conditions (gloves, a dim room, eyesight) ·
tools it must fit beside · what earns and what loses their trust · how they learn a tool · country
variation · the rhythm of the work (shifts, end-of-day batches).

**Rules for every profile.** No trait is invented: what nobody has said is *guess* or *unknown*, and
stays so until it has a source. The card never speaks for a country, a specialty or a setting outside its
scope. When an audience gets stuck somewhere no criterion predicted, that is a characteristic missing
from the profile, and it is added.

## 9. Judges

- **One job per seat.** A judge answers its one question and does not rule on another seat's: the visual
  craft judge names a claim and leaves it to the truth judge.
- **The job before the craft.** Every judge first answers whether the artefact does its job for the
  person in the intent, and only then whether it is good of its kind.
- **A pool of checks, selected per design** (the founder's preference, with three conditions):
  1. each seat keeps a small **core** that always runs;
  2. every optional check has a **trigger** stated as something observable in the artefact. Cast makes
     the first cut; the judge re-tests every trigger on the real artefact, and a check whose trigger
     fires runs even if Cast left it out;
  3. the ledger lists **every check not run, and why**.
- **Evidence or nothing.** Every finding points at a screen, a state, an element, a string or a
  measurement.
- **It offers a fix; it never redraws, rewrites or approves.** The maker fixes, the founder decides.
- **Blind where it matters.** A judge never reads the makers' reasoning, the author map or another
  judge's ledger.

The saving from selecting checks is mostly focus. The cost of a seat is reading its inputs, so the real
lever on tokens is which seats sit.

### The ledger, the same shape for every judge

- **Top line:** the verdict in the seat's three words (for example *approve · rework · stop*) and the
  **first fix** — the one change that moves the most.
- **One row per finding:** the check · the result · where (screen, state, element id, the string) · why
  it matters · severity (*blocks · should · note*) · the fix as "what it is → what it should be" · **done
  when** (an observable condition the maker can test).
- **Checks not run**, each with its reason.
- **What was not looked at.**
- On a re-read: each earlier finding *fixed · partly · still present*, then any new defect.

## 10. The professional profile judge

Some experiences are for one profession only — what a user sees after choosing "doctor" at sign-up. Part
of the review must ask whether the interface works **for the professional who will use it**. This is a
judge, built on the profile card (§ 8); it is not a second kind of audience and not a second persona.

**How it differs from its neighbours**

| Seat | Applies | Stance |
|---|---|---|
| Usability judge | what is true of anyone | an expert, informed |
| **Profile judge** | **what is true of this profession** | an expert, informed, every finding traced to a trait |
| Audience | nothing — it only tries the task | naive, blind to the intent |

The judge and the audience cross-check. A spot both flag is a strong signal. A spot where only the
audience got stuck means the profile is missing a characteristic.

**In the pipeline**

- **Frame** notes whether the experience is for one profile, several or everyone.
- **Context** loads the profile, or drafts it.
- **Intent** names the profile, the specialty and the person.
- **Cast selects it:** one instance per profile the surface serves. For a surface everyone sees, two
  contrasting profiles sit — the least comfortable with technology and the one with the highest stakes —
  not all of them. *(author's call)*
- **It reads at** Structure (ranks the options for this profession, flags blockers), **Detail** (its main
  read: every screen, state and string), Look (only when a triggered criterion concerns legibility or
  context), Acceptance (the build), and optionally the Intent.
- **It receives** the profile card with the specialty's section, the intent, the artefact as screenshots,
  and the strings in its language, by option letter. **It does not receive** the makers' reasoning, the
  author map, other ledgers or the audience's read.

**The six core criteria** — each is fed by the profile's "so the interface must" lines:

| # | Criterion | Asks | Fed by |
|---|---|---|---|
| 1 | Recognition | Are the objects, the document names and the words theirs? | the work, vocabulary |
| 2 | Path | Can the main job be reached and finished in the time and attention they have, without exploring? | time and attention |
| 3 | Familiarity | Does anything need a pattern or a software word they do not know? | technological familiarity |
| 4 | Enough to act | Is what they must see before acting on screen at that moment, with nothing competing? | stakes |
| 5 | Safety | Are mistakes prevented, visible and reversible in proportion to what they cost? | error tolerance |
| 6 | Context | Is it legible and operable where, and on what, they use it? | usage context |

Optional criteria switch on with the profile's optional characteristics.

**Its report** is the common ledger (§ 9), with these additions:

- the top line is per profile: **works · works with changes · does not work**;
- each row's "why it matters" names the trait and labels it *fact* or *guess*, so the founder can weigh
  it;
- a **"cannot tell" list**: where the design depends on a trait the card marks *unknown*. These go to the
  founder or to a real professional, not to the maker;
- at Structure, the ranking of the options, with the size of each gap and one reason;
- where two profiles sit, their disagreements are stated, never averaged.

It never invents a trait. A real professional's read, when there is one, outranks it.

## 11. Audiences: the task read

An audience seat is a fresh agent playing one person card. It is given the starting situation and the
task from the intent — **never the intent itself, the success criteria or the makers' reasoning**.

- It works from **screenshots only**, never the page's code: a person cannot find a control by reading
  markup.
- **Blind pass, per task, per option, in the person's language:** what do I think this is · what do I do
  first · where do I hesitate, and at what · what did I expect to happen · did I finish · what would make
  me leave. Every answer points at something on the screen.
- **Ranking** between options, with the size of each gap and one reason. Two seats that disagree are a
  finding, never an average.
- **The caveat is printed on every read:** a simulated person agrees too easily and understands what it
  was told to understand; this is a check on the makers' blind spots, never evidence about real people;
  only the ranking and the stuck points carry information.
- **Who sits:** the primary person, plus **one contrast seat the makers were not briefed on**, because a
  design made to a card is always understood by that card.
- **A real person's read takes the seat whenever one is available**, and outranks it.

For a public page the read is the marketing one instead: stop, understand, click.

## 12. Cheap and blind — the mechanics at Structure

| Marketing | Here |
|---|---|
| Pictures described in words by several describers | Structures described as walkthroughs by several describers |
| Rendered by one engine | Drawn by one script in **one shared kit**: a project kit that looks like the project's default components when a design system exists, the grey kit when none does |
| The brief gives context, never the design; the founder reads it first | The same. No component names, no layout, none of the session's own ideas |
| Describers see no earlier pictures | Describers do not see each other, the session's idea, or the current screen (unless one continuity maker is cast) |
| Letters by shuffle; the author map unopened until he marks | The same |
| Judges read by code | Judges and audiences read by letter |
| Nothing shortlisted or rendered before he marks | Nothing is detailed before he picks |

Because every proposal wears the same kit, he compares structures and is still looking at pictures.

**Where it does not apply:** the look inside a binding design system (little latitude: one maker,
variants on one named axis) unless a fresh pass is cast, and corrections.

### The fresh pass *(the founder's idea, 2026-11-13)*

What exists is itself a bias: the design system, today's screens, the product's habits. In the founder's
experience, tools given none of it returned concepts nobody inside the product would have proposed. So a
design can be made twice — once inside the system, once with no knowledge of it — and the two compared.

- **Offered, not automatic.** Cast states whether a fresh pass runs at Structure, at Look, or both, and
  the founder can ask for one at any decision page. It does not run at Detail, where the work is to
  complete a chosen structure, not to explore.
- **What a fresh maker is given:** the person and her moment, the job, the tasks, the language, the
  device, and what the product can show and do — so that nothing is invented. **What it is not given:**
  the design system, the shared kit, today's screens and navigation, the sibling surfaces' conventions.
  "No knowledge" means no knowledge of form, not of what the product does. *(author's reading)*
- **Who makes it:** engines that return a whole concept, structure and look together, as a picture — a
  screen generator, an outside model, a Claude maker with a taste skill as its lens. *(author's call)*
- **How much:** the one or two screens that carry the idea, never the whole flow. *(author's call)*
- **At Structure it is shown twice.** Each fresh concept's structure is written into the walkthrough
  format, drawn in the shared kit, and joins the blind board as one more letter: structures are compared
  like with like, and the founder does not know which came from where. The same concepts are also shown
  as they came, in a gallery beneath the board, labelled as fresh. **The pick is made on the board.** In
  the gallery he marks what he likes, and his marks are carried to Look.
- **At Look it is shown beside the system version**, on the same screen with the same content. The
  profile judge and one audience rank the two; the truth judge flags anything the product cannot do; the
  system fidelity judge lists what the system lacks to make each thing he may want.
- **Three outcomes, and only three:**
  1. *Nothing to borrow.* The system version stands; the gallery stays in the record.
  2. *Borrow named things.* Each is rebuilt on the project's tokens by the visual designer. Anything the
     system lacks enters as a **named extension of the system** — a new token, part or pattern, listed in
     the handoff's `PARTS.md` with what it costs.
  3. *The fresh concept wins as a whole.* That is a change of direction for this surface (§ 4.6), and
     its cost is on the decision page before he chooses.
- **Never** is a fresh screen handed off as it came.

### The shared kit *(author's call)*

The kit is **static HTML and CSS**: one stylesheet, and one plain part for each role and container of the
walkthrough vocabulary.

- **The grey kit** ships with this repository, for projects with no design system.
- **A project kit** is the same set of parts restyled to look like the project's default components: one
  stylesheet beside a copy of the project's real token file (§ 25, amendment 1). It is written once, at setup, kept in the
  project (`design/kit/`), and read by the system fidelity judge like any other artefact. When a
  project's tokens are not plain CSS, setup exports them to a CSS file and records where they came from.
- **Never the real components run through the project's own toolchain.** That would tie the designing
  session to the build, which the sixth requirement forbids.
- **Who draws with it.** At Structure, the `render` script, mechanically. At Detail, the prototype
  builder, an agent, using the same parts. At Look, the visual designer writes static pages that link
  the same token file, free of the kit's parts where the design needs it.
- **In the handoff** the token file is copied in beside the prototype, with its source path and version,
  so the folder stands alone.

## 13. The handoff folder

The only thing the implementing session reads. It is self-contained: nothing in it points back into the
package.

| # | File | Content |
|---|---|---|
| 1 | `HANDOFF.md` | The entry, in the shape *Context · Task · Done when · Verify · Constraints*. The slices in build order, each small enough to implement, verify and commit alone, each with its own done-when. What is out of scope. What is decided and must not change. What is left to the builder. |
| 2 | `prototype/` | Static HTML on the project's real tokens: one page per screen × state × language × theme, an index, and reference screenshots at each width. **The picture of record — to translate into the project's components, never to paste.** Every element that matters carries a stable id. |
| 3 | `SPEC.md` | Per surface: its job; the regions in priority order; every state and what it shows; the rules (validation, focus order, keyboard, what changes at each width, motion and its reduced form); the data map — where each element's content comes from. Anything the product cannot supply today is listed as a **dependency**. |
| 4 | `strings.*` | Every string by key, in every language, final, with its length limit, in the format the project's translation layer takes. |
| 5 | `PARTS.md` | For each element, the existing token and component it uses, read from the installed source, never from memory. Anything new is flagged as a change to the system, with its definition. |
| 6 | `ACCEPTANCE.md` + a machine-readable copy | The intent's success criteria as checks; the states to drive; the measured values (sizes, gaps, contrast pairs); the accessibility checks. Written so a script can run them by the stable ids, and **run against the prototype first**. |
| 7 | `DECISIONS.md` | What was chosen, why, what was rejected, what each choice forces on the build. |
| 8 | `COVERAGE.md` | Which seats read what; which checks ran and which did not, and why; each finding and what became of it. |

**The test of the folder is the cold implementer:** a fresh agent given only this folder lists every
question it would have to ask and every guess it would have to make. The handoff is ready when that list
is empty, or every item has a written default.

**Rules for the implementing session** (stated in `HANDOFF.md`): it keeps the stable ids; it builds
every state; it does not redesign.

**What it writes back** — three short files, at a path `HANDOFF.md` names (by default `build/` beside the
handoff folder), so that it never needs to open anything else in the package: *(author's call)*

| File | Content |
|---|---|
| `BUILD.md` | What was built, where it lives, how to run it. |
| `STATES.md` | The state map: for each state in the spec, how to reach it in the build — an address, a seed step, a network condition, an account. |
| `DEVIATIONS.md` | Anything that could not be built as drawn: what, why, the nearest thing that was built. The founder decides each at Acceptance. |

## 14. Lessons

Two files, both appended, never rewritten. *(author's call)*

- **The project's `LESSONS.md`** — after every design: what was tried, what happened, what the next
  design does differently, the founder's words where they mattered, the cost in agents and tokens, and
  **which seats' findings changed a decision, and the model each ran on**. That last line is what prunes
  the pool and corrects the model suggestions.
- **The kit's `LESSONS.md`** — only what is true of the process on any project. The conductor proposes
  the entry; it lands in the kit's repository by an ordinary change.

The kit's file is seeded with what the two source processes already learned, among them: a brief that
prescribes the design returns the session's own idea in three voices; nothing is shortlisted before the
founder marks; his own sentences are the calibration for words; a count named to him is counted by tool
first; a direction described by adjectives goes five rounds, one described by references and refused
tells converges.

## 15. Where everything lives

### The kit — this repository, as a Claude Code plugin *(names are the author's call)*

```
.claude-plugin/        plugin.json, marketplace.json     (plugin name: ux)
skills/
  design/              the conductor: order, routes, the loop, the state, resuming
  setup/               once per project: the profile, the project kit, the engine check
  frame/  context/  intent/  cast/  structure/  detail/  look/  handoff/  acceptance/
pool/
  INDEX.md             one row per card
  CARD-FORMAT.md       the contract of a card
  makers/  judges/  audiences/
  persons/             the generic persons
templates/             every package file; the profile card; the person card; the project profile;
                       the briefs; the ledger; the task read; the decision page
kit/                   the shared plain kit for projects with no design system
scripts/               the blind merge; render; screenshots; the decision page;
                       the state stamp; the acceptance runner
reference/             the implementer's guide; anti-patterns; a worked example
LESSONS.md
docs/design/           this document
```

Skills are namespaced by the plugin: `ux:design`, `ux:frame`, `ux:structure` and so on. A skill is told
its own directory when it loads, and finds the pool, the templates and the scripts from there.

### The project's side *(the default; the project profile may move it)*

```
design/
  PROFILE.md           the project's facts
  LESSONS.md
  kit/                 the project kit: the shared parts on the project's real tokens
  pool/                profiles/  persons/  makers/  judges/  audiences/
  <design>/            one package per design
    STATE.md  DECISIONS.md
    00-frame.md  01-context.md  02-intent.md  03-cast.md
    04-structure/  05-detail/  06-look/
    07-handoff/        the only folder the implementer reads
    build/             what the implementer writes back: BUILD, STATES, DEVIATIONS
    08-acceptance/
    work/              scratch: prompts and raw outputs, never an input
```

### The project profile, `PROFILE.md`

The product in one sentence · where packages live · the design system: token files, component source,
its documents · the kinds this project adds, with their rules · languages and register · the source of
product facts the truth judge checks against · the founder's standing rules for interfaces · how a
browser check is run here · which components make up the shared kit · seats pinned and banned · engines
turned on · where product-affecting decisions are logged, when the project has its own decision log.

**The project's own rules outrank the kit.** Where they conflict, the session says so out loud.

## 16. What the scripts do

Nothing here needs a model; each is mechanical. The language is the builder's choice.

| Script | Does |
|---|---|
| merge | Shuffles the proposals into letters; writes the author map and does not print it. |
| render | Draws a Structure proposal, written in the strict walkthrough format, as frames in the shared kit. Structure only: the Detail prototype and the Look screens are written by makers. |
| shots | Screenshots the prototype pages at each width and theme, headless, with reduced motion set explicitly. |
| decision page | Builds the one-screen page from a small data file. |
| state | Stamps an artefact, validates carry lists, marks what is stale. |
| accept | Runs the machine-readable acceptance checks. On the prototype it opens each state's page itself. On a build it asserts and measures a state that the Acceptance session has already put on screen from the state map. |

## 17. What happens to the kit as it stands

The new kit is built on a branch. The main branch stays as it is — projects that point at it keep
working — until the proving run passes (§ 19). Then the current kit is tagged as version 1 and the branch
replaces it; no second path stays in the tree. *(author's call)*

| Today | Becomes |
|---|---|
| `RUNBOOK.md` | The conductor skill and the README. |
| `phases/1-DISCOVERY.md` | Context and Intent (the interview blocks, roles against personas, the states table, success criteria); the profile and person templates. |
| `phases/2-FOUNDATION.md`, `3-DIRECTION.md` | Look's Direction mode; setup's "read the system that exists". |
| `phases/4-MOCKUP.md` | Structure: "describe the user, never the UI" becomes the makers' brief rule. |
| `phases/5-EVALUATION.md` | The judges and the decision page; its criteria become the usability judge's core. |
| `phases/6-IMPLEMENT.md`, `7-QA-LOOP.md` | `reference/` — the implementer's guide — and Acceptance. |
| `phases/8-AUDIT.md` | The visual craft judge: its fourteen dimensions as optional checks. |
| `setup/CAPABILITIES.md`, `TOOL-ADAPTERS.md` | The engine field of each card, and the project profile. The old "verify by a live call" becomes setup's engine check, repeated by Frame for the seats a design presets. |
| `templates/` | The new templates; `DESIGN-STATE.md` becomes `STATE.md`. |
| `reference/FIDELITY-LADDER.md` | § 5, the sizes. Its rule stays: *what scales with simplicity is the artefact, never the approval.* |
| `reference/ANTI-PATTERNS.md` | Kept and updated. |
| `reference/EXAMPLE/` | Removed. A worked example is written after the proving run, as fiction, so that no product's name enters the kit. Until then the templates keep short fictional illustrations taken from the current example. *(author's call)* |

## 18. Constraints

- Claude Code, with sub-agents and skills.
- Every card and every skill is generic: no product's name, people or rules in the kit.
- Secrets: a script that calls an outside model reads its key inside itself, by name, and never prints
  it.
- A browser check is headless, started and closed by the script, with reduced motion set explicitly.
- The founder is asked one question about one thing at a time — a list a seat returns is one thing
  (§ 25, amendment 3); a decision page is one screen.
- Nothing is shortlisted, detailed or drawn finished before the gate that precedes it.
- A stage is run, or the route says why it is not. Nothing is skipped silently.

## 19. Proving it

**This build ends when the kit exists on its branch and each skill has been tested.** The proving run is
the next step, with the founder's own go; it is not part of this build's plan. *(author's call)*

The pipeline is proven on one real design before the branch replaces the main branch.

**The proving run (the founder, 2026-11-13): the radiologist's shell in Verbato.** A radiologist's
feedback was that the interface is complex and not oriented to people from radiology. The design: when
someone chooses Radiologist at onboarding, the interface becomes a radiologist's experience.

- **Its size is a flow, not a surface.** A shell touches the navigation, the first screen and the words
  across the product. Structure treats the whole shell as one thing; Detail, Look and Handoff are proven
  on its first surface, and the others follow. *(author's call)*
- **Its prerequisites, in Verbato:** setup, and the profession's profile with its radiology section —
  § 21's first two follow-ups become the run's first steps. The radiologist's feedback enters that
  profile and the context as *fact*, with its source.
- **Its foundation is "surface exists and is wrong"**, so Context opens with a read of today's
  interface as she meets it.
- **A fresh pass is recommended for it**, at Structure and at Look: the complaint is about what exists,
  which is exactly the bias a fresh pass removes. Cast decides. *(author's recommendation)*

In that run:

- the session is changed deliberately between Intent and Structure, and again between Look and Handoff,
  to test resuming from disk;
- the handoff is implemented by a session that has seen nothing else;
- the questions that implementing session has to ask, and the guesses it makes, are counted. The target
  is none;
- the run's cost in agents and tokens, and the number of founder reviews, are recorded in the lessons
  file.

## 20. Left to the builder

- The exact fields and file formats: the stage header, the state file, the walkthrough vocabulary, the
  machine-readable acceptance checks, the strings format per project.
- The language of the scripts and the styles of the grey kit.
- The wording of every skill and every card, and which installed skill each card wraps, after checking
  what is installed.
- How the plugin is published and installed.
- The presets: which seats sit by default for each kind and size.
- The order of the build, and how each skill is tested before it is relied on.

## 21. Follow-ups — not part of this build

1. **A complete example profile for a doctor**, from the template: a base card with a section per
   specialty (the founder asked for it, 2026-11-13). It needs his input and, ideally, a practising
   professional's; every trait starts as *guess* until it has a source.
2. **Verbato's adoption**, in Verbato's own repository and by its own approval: running setup there (its
   `PROFILE.md`, its project kit for each of its two design systems); its pool (profiles, the persons
   its earlier runs reused, a truth judge loaded with its product facts);
   `docs/guides/process/AI-DESIGN-TOOLS.md` reduced to that profile; the older methodology document and
   the design-proposer playbook retired or rewritten to call the pipeline.
3. **A standalone way to build or refresh a profile** outside a design run, if drafting it inside
   Context proves too thin.

## 22. Who decided what

**The founder decided:** an interface process for UX and UI adapted from the marketing one · the six
firm requirements (a phased pipeline; generic stages, ideally one skill each; each stage reading only
what the previous one hands it, resumable anywhere; makers and judges chosen per design at an early
stage; a pool of makers, judges and audiences; the designing session is not the implementing one) · it
lives in this repository, usable by any project · the carry-list reading of the third requirement · the
proposal of nine stages, the pool as cards, the handoff folder, one card for persona and audience · the
professional profile judge · profile and person as two cards · the seven always-defined characteristics
· a base profile with a section per specialty.

**Delegated to the author, and decided here:** a correction may be applied by the session that designed
it · Claude Code only.

**The author's calls — check these while reading:**

1. The plugin's name (`ux`), the stage and file names, the default package path.
2. The five kinds and the five sizes.
3. The first set of fourteen cards, and what waits.
4. Two contrasting profiles sit on a surface everyone sees.
5. One fix round and one re-read per stage by default.
6. A pick with named grafts is allowed; "a bit of each" is not.
7. Outside models are off unless a project turns them on.
8. Two lessons files: the project's and the kit's.
9. The new kit is built on a branch; the current kit is tagged as version 1 and replaced only after the
   proving run, with no parallel path in the tree.
10. This build ends at "kit built and tested"; the proving run is a separate step with its own go.
11. **Setup**, an eleventh skill run once per project, writes the profile and the project kit (§ 4.9).
12. The shared kit is static HTML and CSS on the project's real tokens, never the real components
    (§ 12); the `render` script draws Structure only.
13. Structure proposals are written in a strict format, and differ in sequence, grouping, priority and
    container — not in free layout (§ 4.4).
14. The implementing session writes three files back, among them a map of how to reach each state; it is
    not asked to make every state an address (§ 4.8, § 13).
15. The worked example waits for the proving run and is written as fiction (§ 17).

**Answered by the founder, 2026-11-13:** the proving run is the radiologist's shell in Verbato (§ 19).

**Also the founder's, 2026-11-13:** the fresh pass (§ 12) — the design made a second time with no
knowledge of what exists, then both presented and compared · outside text models and Stitch are turned on
for the proving run, at Structure.

**Also the founder's, 2026-11-13, after the build began:** each seat carries a suggested model and a
suggested effort — "just as suggestion, not as instructions" (§ 7).

**Answered by the founder, 2026-11-13:** a fresh pass may use a screen generator or an outside model at
Look too, with nothing they make handed off. Outside the fresh pass, those tools stay at Structure.

**Approved by the founder, 2026-11-13:** this document as a whole, the author's calls above and § 24
included.

## 23. Source material — where the originals are

All on the founder's machine. They are **ported and made generic**, never copied with a product's names,
people or rules. Several passages in the marketing skills were themselves borrowed under MIT, Apache-2.0
and CC BY 4.0 licences; anything ported from them keeps its attribution, as their `THIRD-PARTY.md` files
record it.

| What | Where (in the Verbato repository unless said otherwise) |
|---|---|
| The marketing process: the loop, the judges' table | `docs/marketing/visuals/playbook/README.md` |
| Its lessons, appended per piece | `docs/marketing/visuals/playbook/LESSONS.md` |
| The first effort's twenty rules | `docs/marketing/visuals/LESSONS.md` |
| The brief templates for makers and judges | `docs/marketing/visuals/playbook/briefs/` |
| The stage-and-gate shape; the roles | `docs/marketing/visuals/PROCESS.md`, `SKILLS.md` |
| The role skills: judge methods, ledgers, the audience read, persona cards with fact / hypothesis / blank | `.claude/skills/visuals-*/`, above all `visuals-physician-viewer`, `visuals-creative-direction`, `visuals-claims-pass`, `visuals-clean-capture`, `visuals-soft-social-templates`, `visuals-motion-brief-and-judge` |
| The blind merge, the board, the tally, the decision page | `scripts/visuals/engines/` |
| A finished piece's record, gate by gate | `docs/marketing/visuals/posts/4/` |
| Two interface runs under the current kit | `docs/implementation/document-fit/design/`; and the company website's `design/` folder, in the Versa Studio project beside this repository |
| The current kit | this repository at the commit before the branch |

## 24. Tools — where each is used, and how *(approved by the founder, 2026-11-13)*

Four rules.

1. **A tool is never a stage.** It enters as the engine of a seat, chosen at Cast, and every seat still
   works without it (§ 7).
2. **Many minds where ideas are born, one hand where consistency matters.** Several engines propose at
   Structure. From Detail on, one maker works on the project's real tokens.
3. **On the board, everything wears the same kit.** Whatever proposed it, a structure is written into
   the walkthrough format and drawn in the shared kit, so he never compares one tool's paint with
   another's boxes. A fresh pass (§ 12) is also shown as it came, in a labelled gallery of its own, never
   mixed into the board.
4. **What is handed off is always built on the project's tokens.** A generator that cannot use them
   makes fresh concepts and directions, never the screens of record.

| Tool | Stage · seat | How |
|---|---|---|
| Claude sub-agents | Every stage · every maker, judge and audience | One fresh agent per seat, from a brief that names its card, on the model and effort the cast sheet suggests (§ 7). The base; nothing else is required. |
| Outside text models (OpenAI, Google Gemini) | Structure · extra structure describers, and the fresh pass. Look · the fresh pass only | The same context-only brief, sent by a script; the answer is in, or is transcribed into, the walkthrough format; merged blind with the others. The lessons file records whose proposals are picked, and the seat is kept or dropped on that record. Off unless the project profile turns it on, because the brief leaves the machine. |
| Google Stitch | Structure · one extra describer, and the fresh pass. Look · the fresh pass, and the direction maker in Direction mode | It generates a screen from the brief. For the board, an agent transcribes its structure into the format and its paint is set aside; in a fresh pass the screen is also shown as it came. In Direction mode its screens are shown as directions. Never used at Detail, and never the screens of record: its output is not on the project's tokens. |
| `ui-ux-pro-max` | Look · the direction maker (palettes, pairings, styles). A lookup for the usability judge and for chart choices | Data, not judgement. Inside a binding design system its palettes and pairings are not used. |
| `frontend-design` and the installed taste and motion skills | Look · the visual designer, the motion designer | The maker loads one as its lens. Inside a design system it shapes hierarchy, emphasis and motion, not the palette. Which skill each card wraps is decided at build, after reading each. |
| `design-audit`, `typography` | Context (the as-is read) · Look · Acceptance — the visual craft judge | The judge's optional checks. |
| A browser, driven by scripts | Context (screenshots of today's interface) · Detail and Look (screenshots for judges and audiences; measured contrast and sizes) · Acceptance (the build) | Headless, started and closed by the script, reduced motion set. Audiences see screenshots only. |
| Component source, or a component registry | Context (what parts exist) · Handoff (`PARTS.md`) · the system fidelity judge | Read, never guessed. |
| Product analytics | Context · Intent's measure · later reads | Only where there is data. |
| Image models | None, for interfaces | They invent interfaces and nothing can be built from their output. Used only for a picture that lives inside a design (an illustration, an empty state) or for the imagery of a direction. |

**Not planned:** design tools that round-trip through a hosted canvas, and third-party interface
generators. Either can be added later as a card, on evidence from the lessons file.

## 25. Amendments after the build and its dry run *(2026-11-15)*

The build and a dry run of the whole pipeline on a fictional project (`docs/design/DRY-RUN.md`) changed
seven things this document states. Each was ruled on by the session that conducted the build; the
ruling's number is the one in the build's log (`docs/build-log/progress.md`). Where a section above
disagrees with this one, this one holds.

1. **A project kit copies the tokens; it does not link them** (§ 12, "The shared kit"). The renderer
   copies only the stylesheets it finds in the kit's folder next to the pages it draws, so a kit that
   imported tokens from elsewhere in the project drew unstyled pages. Setup copies or exports the tokens
   into the kit's folder as one CSS file, with a first line that records the source and the commit it was
   taken from; the kit is rebuilt when the tokens change. *(Task 14.)*
2. **Context always asks once for his words** (§ 4.1): what she calls these things, and any word she
   must never see. "None" is an answer. The test "when the words will matter" asked the conducting
   session to judge, and in the dry run the question was never asked. *(R164.)*
3. **A list is one thing** (§ 18, "one question about one thing at a time"). A list a maker or a reader
   returns — dependencies, states the intent does not name, what the structure cannot hold, facts a
   string waits for, items nobody decided, deviations — is put to him as one question: the entries
   numbered, each with what follows from each answer, answered by number in one message. An entry he
   leaves unanswered stays open and is listed so. An answer that meets a standing rule, a fact of the
   product or an output he approved is still asked on its own, at once. In the dry run Detail alone put
   36 questions one at a time. *(R174.)*
4. **An accepted deviation is part of what was approved** (§ 4.5, § 4.6, § 9, § 13). When he accepts, as
   a cost, something that breaks a standing rule or a line of the approved intent, it is written in a
   section of its own in the stage's output — what it breaks, his words, the date — carried on, handed to
   every judge from that stage on as part of what was approved (never to an audience), and copied into
   the handoff's "must not change". A judge that still finds it writes it once, as accepted at that
   stage; it is not sent to a fix round and does not block. In the dry run the same accepted cost came
   back marked blocking at Look, twice, and again at Acceptance. *(R175, R186.)*
5. **A project with no browser script** (§ 4.8, "the way the project profile says a check is run"). The
   design assumed every project keeps one. Where it keeps none, Acceptance says so and, on his yes,
   writes the project's driver in the project, on the kit's own browser library, and records its command
   in the profile. The handoff folder carries the in-page check file, so a builder can run the checks
   without the kit. *(R159.)*
6. **What a reader is shown** (§ 11, § 12). The board is drawn twice: with the makers' notes, for him
   and for the judges; and without the bet, the cost, what it is deliberately bad at and the notes, for
   the audience, who must never be told what a design means to do. Each page is pictured whole and as
   its first screen alone, so that "without scrolling" can be read off a picture. *(R154, R171.)*
7. **One more name for what a seat may read** (§ 7, "What a card states"): `example-data`, the made-up
   rows a prototype is drawn with, handed to the prototype builder and to the truth judge. *(R188.)*

Three things the dry run showed and this build did not decide are left for the proving run (§ 19): a
script for the mechanical part of Handoff; checks that test what a page does, not only what it shows;
and whether every file of a stamped stage, not only its output, is guarded against change (ruled yes,
R184, and built in the last fix wave).
