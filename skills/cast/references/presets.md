# The default cast

Cast starts from this page, and Frame reads it for the provisional cast. It says who sits by default,
by size; who is added by rule; and what each seat's card says of it. It is a starting point, never the
cast: the project's `pinned` and `banned` seats come on top, and the founder edits by exception.

## By size

A design sized `correction` casts no seat. For the other sizes, a cell names its makers, then its
judges, then its audience, parted by a middle dot. A seat is named here as its job is said; "The
seats", below, gives each one's id.

| Size | Structure | Detail | Look | Handoff | Acceptance |
|---|---|---|---|---|---|
| adjustment | — | interaction designer or interface writer (whichever the change touches) · usability | visual designer · system fidelity (only if visual) | cold implementer | the judges that read it before |
| surface, flow | 3 structure describers (3 lenses) · usability, truth · task reader with the primary person and one contrast person | interaction designer, interface writer, prototype builder · usability, truth, words, accessibility · task reader | visual designer · visual craft, system fidelity, accessibility | cold implementer | usability, accessibility, system fidelity, visual craft · task reader |
| system | as surface, plus a fourth describer | as surface | Direction: 3 directions; then as surface | as surface | as surface |

How to read it:

- **The lenses** are the four the structure describer's card gives: fewest steps, guided, defaults
  first, in place. Three describers take three of them, chosen for this design, and a fourth describer
  takes the fourth. Each describer's line of the cast sheet names its lens.
- **The task reader** is one instance for each person it is seated as. At Structure it sits twice:
  as the primary person, the one the intent names, and as one contrast person the makers are not
  briefed on. Where the table says only "task reader", it sits once, as the primary person.
- **Only if visual:** an adjustment seats the visual designer and the system fidelity judge at Look
  when the change can be seen, and nobody there when it cannot.
- **The judges that read it before:** at Acceptance, an adjustment is read by the judges that read it
  at Detail and at Look.
- **Direction:** three directions, each drawn by one `maker.visual-designer` cast for a direction, each
  with a lens of its own. He picks one, and then Look is cast as for a surface. Where the foundation
  is `no-system`, Look opens the same way whatever the size, from a surface up
  (`skills/design/references/routes.md`).
- A stage the route skips has no cast, and its cell is not used.

## Added by rule

At any size from a surface up:

- `judge.profile`, once for each profession's profile, when Frame says the experience is for one
  profession or for several. When it is for everyone, and the project keeps more than one profession's
  profile, two contrasting ones sit: the least comfortable with technology, and the one with the
  highest stakes. Never all of them. It reads at Structure, at Detail, which is its main read, and at
  Acceptance; at Look only when a criterion that fires is about legibility or about where she uses it.
- `judge.truth` always sits on a public page: it is never left out there.
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
describer when a provider is on. It is the founder's to ask for, never part of a preset.

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
| task reader | `audience.task-reader` | structure, detail, acceptance | surface, flow, system | `own` | `opus` | `medium` |
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
