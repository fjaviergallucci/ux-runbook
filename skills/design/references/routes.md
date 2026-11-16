# Routes: what Frame decides

Three properties of a request decide which stages run and who sits by default: its kind, its foundation
and its size. Frame names the three with the founder, and makes the package with them:

```
node <kit root>/scripts/state.mjs init <package> --design <name> --kind <kind> --foundation <foundation> --size <size>
```

## Kind

What the interface is for. It sets what the design is judged on first, how the audience reads it, and
the preset cast. The kit has five kinds. A project may add its own in the project profile, under a name
in lower-case words joined by hyphens.

| Kind | What it is | Judged first on | Note |
|---|---|---|---|
| `working-surface` | a screen she works on, again and again | finishing the task, repeatedly | density and speed matter |
| `first-run` | the first time she meets the product | understanding and starting without reading | the words get their own review |
| `form` | a form or a transaction | completing without error | recovery matters most |
| `message` | an email, a notification, an error | understanding and the next step | the words get their own review |
| `public-page` | a page anyone can arrive on | stop, understand, click | the truth judge always sits |

## Foundation

What the design starts from.

| Foundation | What it is | Effect |
|---|---|---|
| `no-system` | there is no design system | Look runs once as a direction first: with no system to draw on, a visual direction is chosen. |
| `new-surface` | a system exists, and the surface is new | The standard route. |
| `redesign` | the surface exists, and is wrong | Context opens with a read of the surface as it is. Structure's describers do not see the current layout, unless the cast names one continuity maker who does. |
| `small-change` | the surface exists, and the change is small | See the size. |

## Size

| Size | What it is | What runs |
|---|---|---|
| `correction` | a wrong label, token or spacing value | Frame in one line, a before-and-after picture, the founder's nod, a one-paragraph record. See "A correction". |
| `adjustment` | moving an element, changing the words of a state | Frame; a short Context (what exists, what changes); Intent in two sentences, with its criteria; a preset cast of one or two judges; Detail and Look as what changes, and no more; a short Handoff. Structure is skipped unless the structure changes. |
| `surface` | a new screen, or a redesign | Everything. |
| `flow` | several surfaces that form one task | Everything. Structure treats the flow as one thing; Detail and Look go surface by surface. |
| `system` | a rebrand, or the first design of a product with no design system | Everything, and Look runs as a direction first. Still one surface at a time. |

A new product is no size of its own: it is a sequence of designs, as is any request that spans several
places of a product (see "Several places", below). `system` is never the whole of a product at once.

## The route of each size

The size sets the mode of each stage, and the state keeps it:

| Stage | `correction` | `adjustment` | `surface` | `flow` | `system` |
|---|---|---|---|---|---|
| `frame` | short | full | full | full | full |
| `context` | skipped | short | full | full | full |
| `intent` | skipped | short | full | full | full |
| `cast` | skipped | short | full | full | full |
| `structure` | skipped | skipped | full | full | full |
| `detail` | short | short | full | full | full |
| `look` | skipped | short | full | full | full |
| `handoff` | short | short | full | full | full |
| `acceptance` | short | short | full | full | full |

- **full** is the stage as its skill gives it. **short** is its short form, which its skill gives too.
  **skipped** is not run, and the state keeps the reason.
- A stage is run, or the route says why it is not. Nobody skips a stage by leaving it out.
- Frame may change the mode of one stage, with the founder and always with a reason. An adjustment that
  changes the structure, for one, runs Structure:

  ```
  node <kit root>/scripts/state.mjs route <package> <stage> <full|short|skipped> --reason "<why>"
  ```

  Frame itself is never skipped. A stage that is approved, or awaiting the founder, cannot be skipped.
  An approved stage whose mode changes turns stale: it is redone or re-confirmed, then stamped again.

## The size only moves up

The size only moves up. A design that turns out to be more than its size stops, says so, and re-enters at
the larger size, with the founder's yes:

```
node <kit root>/scripts/state.mjs resize <package> --size <size>
```

Nothing moves down mid-run. A resize never lowers the mode of a stage. A stage the larger size adds to
the route is run. An approved stage whose mode changes, or that was built without a stage now added
before it, turns stale: it is redone or re-confirmed at the larger size, then stamped again.

## Several places: a sequence of designs

`flow` stays what it is: several surfaces that form one task. A request that spans several places of
a product, which she does not go through as one task, is not one design of any size: it is a
**sequence of designs**, and each design of it is made, judged and approved on its own.

- **What tips it is what she does there.** One job she starts and finishes by going through the
  surfaces in order is a `flow`: "booking a walk-in, from finding a free room to the confirmation she
  reads out to the patient" is one task over three surfaces. Places she goes to each for a job of its
  own, in any order, and comes back from are several places: "the front desk's tool: today's rooms,
  the week's bookings, the rooms' settings, and the navigation between them" is a navigation and the
  pages it leads to. A request whose structure would need more than five screens is a sign of the
  second: a proposal holds five at most, and a structure that needs more is more than one design.
- **The places first.** The first design of the sequence is the places themselves: which places exist,
  what each is called, what each holds, and how she moves between them. It is a design of size
  `surface`, or `system` where it is the first design of a product with no design system, with its own
  kind and foundation, and it runs the whole route.
- **Then one design for each place,** in the order the founder sets. Each starts at its own Frame,
  when he asks for it, and is sized there like any request.
- **Frame proposes the sequence, and he sets it.** The frame he is shown is the first design's. It
  names the places as his request names them, in its order, and says that the order is his to set.
  On his yes, only the first package is made. The rest are written under "What follows this design"
  of its frame, one line each, in the order he set, and in the sequence's own record, below; where his
  request names no places, the line says that they are the ones the first design settles, and that he
  sets their order once it is approved.
- **A later design starts from what the earlier ones approved.** Its Frame finds the sequence on disk,
  as below, and its frame names the sequence's first package by path. Its Context carries the
  approved outputs of the designs before it as sources: what the places settled is a fact for every
  place after them.

Nobody but the founder sets the order or starts the next design. A sequence moves one design at a
time, each on his yes at its own Frame, and no package is made for a design he has not asked for.

### Where a sequence is kept

A stamped frame is not written again, so the order lives where it can still be added to: the first
design's `DECISIONS.md`, which every stamp appends to and none guards. Its entry, in the shape of
`templates/package/DECISIONS.md`, is titled `Sequence`. Its **Decision** holds the designs in his
order, one line each: the place it designs, in his words, and its package's folder once it has one,
as `design/places`. Its **Why** holds his words, as he said them, and its date line the day.

- **Frame appends it, on his yes, and never by itself:** at the first design's gate, after the
  frame's own entry; and again whenever he sets or changes the order, and whenever a later design of
  it gets its package. Each new `Sequence` entry names the one it replaces, which is never edited.
- **The first design's frame says where it is,** under "What follows this design", as
  `design/places/DECISIONS.md`, entry `Sequence`.
- **A later design finds it from disk.** At its Frame, list `<packages>`. In each package, read its
  `00-frame.md` for "What follows this design" alone; where that heading says the package keeps a
  sequence, read the `Sequence` entries of that package's `DECISIONS.md`, and nothing else of it.
  The latest is the last `Sequence` entry by its date. A request that a latest entry lists is a later
  design of that sequence: its frame names the sequence's first package by path, and which place it
  designs. Where no entry lists it, it is a design of its own. Where his words and the entry disagree
  on the order, the frame puts the entry's order to him, and what he answers is the next entry.

## A correction

A correction costs one nod. It still goes through the skills, in their order, Frame first: `ux:frame`
states its line and asks nothing, then `ux:detail` runs in its correction form, and Handoff and
Acceptance in theirs. This section says what is different about a correction: it is not a procedure to
run by itself. It is the one size where the session that conducts may also do the work.

- **Frame in one line:** the request, the three values, the route. It is stated, and not put to him.
- **A before-and-after picture** of the change, made at Detail.
- **The founder's nod** is on that picture, with Frame's line beside it: the one question a correction
  asks. If he disagrees with the line itself, that is not a nod: the design is framed again, at the
  size he names.
- **The same session may apply it** after the nod. It leaves a one-paragraph record (what was wrong,
  what it is now, where, and his words) and the before-and-after picture.
- **No pool.** No seat is cast, no brief is written and nothing is merged.
- **It still goes through the state.** The four stages of its route are stamped, each in its short form.
- **If it turns out to touch more** than a label, a token or a spacing value (a state, the structure,
  another surface), stop, say so, and resize.
