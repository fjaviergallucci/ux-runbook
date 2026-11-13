# The kit contract

The kit is the set of parts every structure proposal is drawn in: one stylesheet, and one plain part for
each role and container of the walkthrough format (`scripts/lib/walkthrough.mjs`). The `render` script
draws with it at Structure; the prototype builder uses the same parts at Detail. Because every proposal
wears the same kit, the founder compares structures, not paint.

Two kits keep this contract:

- **The grey kit** (`grey/`), shipped here, for a project with no design system. `grey/kit.css` is the
  stylesheet; `grey/parts.html` shows one specimen of every class, labelled.
- **A project kit**, written once at setup and kept in the project (`design/kit/`), for a project with a
  design system: the same parts, restyled to look like the project's default components.

## The classes

Each class, and what it must convey to someone looking at the drawing:

- `ux-frame`: one screen of the walkthrough on the board, captioned with its title and kept apart from the next.
- `ux-screen`: the screen itself, the whole surface she is looking at.
- `ux-dialog`: a dialog, plainly in front of the screen it opens over.
- `ux-region`: a major area of a screen, set apart from the areas around it.
- `ux-group`: parts that belong together, held as one cluster.
- `ux-expansion`: something that opens in place: its label always shows, what it holds only when open.
- `ux-heading`: what a screen, region or group is about.
- `ux-text`: words she reads, with nothing to do.
- `ux-choice`: a choice she makes among options, all of them visible.
- `ux-input`: a place she types, with its label.
- `ux-action`: something she does.
- `ux-action.is-primary`: the one action the screen is for, and the only part that stands out.
- `ux-list`: like things, one row each.
- `ux-status`: the state of something, as the product reports it.
- `ux-media`: a picture, a video or a map, drawn as a placeholder that says what it shows.
- `ux-link`: a way to go somewhere else.
- `ux-nav`: the places she can move between.
- `ux-note`: a designer's note, said about the interface and never part of it.

## The rule

**A project kit restyles these classes on the project's token file, and adds none.** It is one
stylesheet that links the project's real token file; when the project's tokens are not plain CSS, setup
exports them to a CSS file and records where they came from. It renames no class, drops none and adds
none, and changes no markup. Like the grey kit, it styles each class once, the same wherever the part
appears, so that no proposal looks better made than another.

## The markup the classes sit on

`grey/parts.html` is the reference: a frame's caption is a `header` holding an `h2`; a region's or a
group's label is a `header`, its first child; an expansion is a `details` with a `summary` for its label,
and `open` when it is drawn open; a role's options are a `ul` inside its part; the input's field is drawn
by the stylesheet. A part may carry `data-ux`, its stable id: it is for the checks that find the part,
never for styling.
