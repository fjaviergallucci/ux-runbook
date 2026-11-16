# The default cast

Cast starts from this page, and Frame reads it for the provisional cast. It says who sits by default,
by size; who is added by rule; and what each seat's card says of it. It is a starting point, never the
cast: the founder edits by exception. On top of it, at every size, the project's `pinned` seats always
sit and its `banned` seats never do, with one exception: a project cannot ban the truth judge on a
public page, and Cast tells the founder when the two meet.

## By size

A design sized `correction` casts no seat. For the other sizes, a cell names its makers, then its
judges, then its audience, parted by a middle dot. A seat is named here as its job is said; "The
seats", below, gives each one's id. The rows are by size alone: the kind of the design enters only
through "Added by rule".

| Size | Structure | Detail | Look | Handoff | Acceptance |
|---|---|---|---|---|---|
| adjustment | — | interaction designer or interface writer (whichever the change touches) · usability | visual designer · system fidelity (only if visual) | cold implementer | the judges that read it before |
| surface, flow | 3 structure describers (3 lenses) · usability, truth · task reader with the primary person and one contrast person | interaction designer, interface writer, prototype builder · usability, truth, words, accessibility · task reader | visual designer · visual craft, system fidelity, accessibility | cold implementer | usability, accessibility, system fidelity, visual craft · task reader |
| system | as surface, plus a fourth describer | as surface | Direction: 3 directions; then as surface | as surface | as surface |

How to read it:

- **The lenses** are the four the structure describer's card gives: fewest steps, guided, defaults
  first, in place. Three describers take three of them, chosen for this design, and a fourth describer
  takes the fourth. Each describer's line of the cast sheet names its lens, under "Loaded with". What
  each favours, so that you can choose without opening the card:
  - *fewest steps*: the shortest path from arriving to done, with whatever can be decided for her
    already decided;
  - *guided*: one decision at a time, in the order she would make them;
  - *defaults first*: the likeliest answer already there, for her to confirm or change;
  - *in place*: nothing opens somewhere else, and she acts where the thing already is.
- **The task reader** is one instance for each person it is seated as. At Structure it sits twice:
  as the primary person, the one the intent names, and as one contrast person the makers are not
  briefed on. Where the table says only "task reader", it sits once, as the primary person. The
  contrast person is the one whose moment the intent's tasks do not already cover: her line of the
  cast sheet says which moment that is.
- **Only if visual:** an adjustment seats the visual designer and the system fidelity judge at Look
  when the change can be seen. When it touches nothing she can see, Frame routes Look `skipped`, with
  the reason, and nobody is cast there.
- **The judges that read it before:** at Acceptance, an adjustment is read by the judges that read it
  at any earlier stage of its route.
- **Direction:** three directions, each drawn by one `maker.visual-designer` cast for a direction, each
  with a lens of its own. He picks one, and then Look is cast as for a surface. Where the foundation
  is `no-system`, Look opens the same way whatever the size, from a surface up
  (`skills/design/references/routes.md`).
- **A stage the route runs that the size's row leaves empty is cast from the surface row for that
  stage:** an adjustment routed to run Structure gets the Structure cell of the surface row. A stage
  the route skips has no cast, and its cell is not used.

## Added by rule

At every size, an adjustment's short cast among them:

- `judge.truth` always sits on a public page, at each stage of the route its card sits at. It is
  never left out there.
- With a fresh pass at Look, three seats read the beside comparison, the same screen in each version,
  by letter: `judge.truth`; `judge.profile`, once for each profession's profile, when the context's
  people section names one; and `audience.task-reader`, once, as the primary person. Each has its line
  in the "Look" table of the cast sheet, which says that it reads the beside comparison. The rule
  holds at every size at which a fresh pass runs at Look, an adjustment's among them.

At any size from a surface up:

- `judge.profile`, once for each profession's profile, when the context's people section says the
  experience is for one profession or for several: at Frame, where no context exists yet, by Frame's
  own "Who it is for". When it says everyone, the project's own sit: with one profession's profile in
  the project's pool, its judge; with two or more, two contrasting ones, the least comfortable with
  technology and the one with the highest stakes. Never all of them. It reads at Structure, at Detail,
  which is its main read, and at Acceptance; at Look only when one of its optional checks about
  legibility (`physical`) is on, or the profession's profile has a "So the interface must" line under
  its usage context.
- `judge.words` gets its own question to the founder when the kind is `first-run`, `message` or
  `public-page`. For those kinds the words get their own review: its line of the cast sheet says that
  its read is put to him as a question of its own, apart from the rest of the stage.

Three makers sit by rule too, and none of them by default:

- `maker.outside-describer`, only when the project profile lists a provider under `engines-on`:
  `model:openai` or `model:gemini`. It is one more describer at Structure, and at Look it sits only
  inside a fresh pass. Its line of the cast sheet names the provider and the model id.
- `maker.screen-generator`, when a fresh pass is cast, or when the founder wants one more kind of
  proposal at Structure.
- `maker.transcriber`, whenever a screen generator is cast: it writes that concept into the format the
  board takes. And it stands by whenever an outside describer is cast, for an answer that does not
  come in the format.

A fresh pass is made by makers that return a whole concept: the screen generator, and the outside
describer when a provider is on. It is the founder's to ask for, never part of a preset. When the
project has a screen generator on, Cast offers him one, as the next section says.

## The fresh pass, offered

When the project profile's `engines-on` lists a screen generator, as `tool:stitch`, Cast offers a
fresh pass at Structure. The line for Structure under "Fresh pass" of the cast sheet says "offered",
with the seats it would add, and the offer is put to the founder in the same message as the sheet,
in four plain things:

- **What it is:** the same brief, made a second time by makers who know nothing of the design system,
  and shown as they came, beside the board. The structure of each concept joins the board too, as one
  more letter, so that he still compares structures like with like.
- **What it adds:** something that looks like a product, this early.
- **What it costs:** the seats it adds: the screen generator, a transcriber for each concept it
  returns, and the outside describer on the fresh brief where a provider is on; each reader then has
  one more letter to read, and he has one more brief to read before anything goes out.
- **What comes of it:** nothing of it is handed off. What he marks in it is carried to Look, where
  anything borrowed is rebuilt on the project's own parts.

It is one of the changes the gate's one question asks about, not a second question. It runs only on
his yes, written under `## Reviewed by the founder`: an offer is not a yes, and with no yes it does not
run. Where `engines-on` lists an outside model and no screen generator, nothing is offered: Cast may
say in one sentence that a fresh pass would earn its cost, as a statement.

## The seats

Every seat the kit ships, as its card has it. A dash is a card that says `none`, or that is preset for
no size. A project's own card says the same things in its header.

| Named above as | Seat | Sits at | Preset for | Engine | Suggested model | Suggested effort |
|---|---|---|---|---|---|---|
| structure describer | `maker.structure-describer` | structure | surface, flow, system | `own` | `fable` | `high` |
| interaction designer | `maker.interaction-designer` | detail | adjustment, surface, flow, system | `own` | `fable` | `high` |
| interface writer | `maker.interface-writer` | detail | adjustment, surface, flow, system | `own` | `fable` | `high` |
| prototype builder | `maker.prototype-builder` | detail | surface, flow, system | `own` | `opus` | `medium` |
| visual designer | `maker.visual-designer` | look | adjustment, surface, flow, system | `skill:frontend-design:frontend-design` | `fable` | `high` |
| usability | `judge.usability` | context, structure, detail, acceptance | adjustment, surface, flow, system | `own` | `opus` | `high` |
| truth | `judge.truth` | structure, detail, look, acceptance | surface, flow, system | `own` | `opus` | `high` |
| words | `judge.words` | detail, acceptance | surface, flow, system | `own` | `opus` | `high` |
| accessibility | `judge.accessibility` | detail, look, acceptance | surface, flow, system | `own` | `opus` | `high` |
| visual craft | `judge.visual-craft` | context, look, acceptance | surface, flow, system | `skill:design-audit:design-audit` | `opus` | `high` |
| system fidelity | `judge.system-fidelity` | look, acceptance | adjustment, surface, flow, system | `own` | `opus` | `medium` |
| cold implementer | `judge.cold-implementer` | handoff | adjustment, surface, flow, system | `own` | `opus` | `high` |
| task reader | `audience.task-reader` | structure, detail, look, acceptance | surface, flow, system | `own` | `opus` | `medium` |
| by rule | `judge.profile` | intent, structure, detail, look, acceptance | — | `own` | `opus` | `high` |
| by rule | `maker.outside-describer` | structure, look | — | `model:any` | — | — |
| by rule | `maker.screen-generator` | structure, look | — | `tool:stitch` | — | — |
| by rule | `maker.transcriber` | structure | — | `own` | `sonnet` | `medium` |

The two judges that sit at `context` read a surface that exists, as it is, before anything else: that
read is Context's, not part of a cast.

## A seat without its engine

Every card works without its engine. The project profile's `## Engine check` says what each engine
answered on this machine: Frame lists the ones that are missing or off, and Cast shows them on the
cast sheet. Neither turns one on.

| Seat | Engine | What the engine adds | Without it |
|---|---|---|---|
| `maker.visual-designer` | `skill:frontend-design:frontend-design` | A lens for hierarchy and emphasis. | The seat runs on its card's own text. |
| `judge.visual-craft` | `skill:design-audit:design-audit` | A lens: the dimensions a visual audit looks at. | The seat runs on its card's own text. |
| `maker.outside-describer` | `model:any` | One more proposal, from a mind that shares none of the session's habits. | The seat is not cast. |
| `maker.screen-generator` | `tool:stitch` | Whole screens, made knowing nothing of the design system. | The seat still sits when it is cast: a Claude maker writes the same screens as free pages, with a taste skill as its lens. |
