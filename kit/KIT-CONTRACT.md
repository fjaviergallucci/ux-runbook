# The kit contract

The kit is the set of parts every structure proposal is drawn in: one stylesheet, and one plain part for
each role and container of the walkthrough format (`scripts/lib/walkthrough.mjs`). The `render` script
draws with it at Structure; the prototype builder uses the same parts at Detail. Because every proposal
wears the same kit, the founder compares structures, not paint.

Two kits keep this contract:

- **The grey kit** (`grey/`), shipped here, for a project with no design system. `grey/kit.css` is the
  stylesheet; `grey/parts.html` shows one specimen of every class, labelled, in the markup below.
- **A project kit**, written once at setup and kept in the project (`design/kit/`), for a project with a
  design system: the same parts, restyled to look like the project's default components.

This file is enough to write the drawing script or a project kit: the classes, what each must convey,
and the exact markup each sits on.

## The classes

Each class, and what it must convey to someone looking at the drawing:

- `ux-frame`: one screen of the walkthrough on the board, captioned with its title and kept apart from the next.
- `ux-screen`: the screen itself, the whole surface she is looking at.
- `ux-dialog`: a dialog, plainly in front of the screen it opens over.
- `ux-over`: on a dialog's frame, the screen the dialog opens over, named by that screen's title: the
  board says it, not the maker.
- `ux-region`: a major area of a screen, set apart from the areas around it.
- `ux-group`: parts that belong together, held as one cluster.
- `ux-expansion`: something that opens in place: its label, which it always has, always shows; what it
  holds shows only when it is open.
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

## The document

The drawing script writes one HTML document for a proposal, with the kit's stylesheets beside it:

- it opens with `<!doctype html>`, so that the browser draws it in standards mode;
- its head declares `<meta charset="utf-8">` and
  `<meta name="viewport" content="width=device-width, initial-scale=1">`;
- its head links the stylesheet from beside the document: `<link rel="stylesheet" href="kit.css">`;
- each screen is drawn as a frame, `<section class="ux-frame" data-screen="`the screen's id`">`.
  Frames normally sit directly in `body`, after whatever the script puts before them, but no selector
  of the kit depends on a frame's parent.

A kit may hold more than one stylesheet. `kit.css` is the one the document links, and it may import the
others by relative name (`@import "tokens.css";`, say, for the project's token file); the drawing script
copies every stylesheet found directly in the kit's folder beside the document, so they all travel
together.

Before the frames, the drawing script writes the page's own header: which option this is, and what the
founder judges it by. It is a `<header>` holding an `<h1>` (`Option `, the letter, `: ` and the
proposal's name), then a `<dl>` whose `<dt>` and `<dd>` pairs give the proposal's bet, what it is
deliberately bad at, what is absent on purpose (a `<ul>` with one `<li>` per line, inside its `<dd>`)
and how it meets its hardest state. None of it carries a class, and no kit styles it: a kit styles
`header`, `ul` and `li` by name only where the markup below puts them, inside a frame, so the page's
header shows in the browser's defaults, the same for every proposal. Drawn without the makers' notes,
for a reader who must not see them, the page's header is that `<h1>` alone, `Option ` and the letter,
with no name and no `<dl>`, and no `ux-note` is drawn in any frame: nothing else of the markup differs.

## The markup

The drawing script writes exactly this markup, and a kit styles exactly this markup. Every string in it
is the proposal's own words but one: `opens over `, which the board writes before a title in a dialog's
`ux-over`.

A frame is drawn for each screen, in the walkthrough's order. Inside a screen, a dialog or a container,
the items are drawn in the order the walkthrough lists them: each role item as one part that holds the
item's text as its own text, each container as one element holding its own items the same way.

| Class | Element | Where it sits, and what it holds |
|---|---|---|
| `ux-frame` | `<section data-screen="…">` | One per screen, normally a child of `body`. `data-screen` is the screen's `id`. It holds two children: its caption `<header>`, then the screen's `ux-screen` or `ux-dialog`. |
| `ux-screen` | `<div>` | The frame's second and last child, when the screen's container is `screen`. Holds the screen's items. |
| `ux-dialog` | `<div>` | The frame's second and last child, in place of `ux-screen`, when the screen's container is `dialog`. Holds the dialog's items. |
| `ux-over` | `<p>` | Only in the caption `<header>` of a dialog's frame, right after the `<h2>` and before the dialog's note. Holds `opens over ` followed by the title of the screen named in `over`. |
| `ux-region` | `<section>` | Among the items of a screen, a dialog or a container. If it has a label, its first child is a `<header>` holding the label; then its items. |
| `ux-group` | `<div>` | Placed and labelled as a region. |
| `ux-expansion` | `<details>` | Placed as a region. It has the `open` attribute when its `open` is true. Its first child is always a `<summary>` holding its label; then its items. |
| `ux-heading` | `<h3>` | A role part: holds the item's text. |
| `ux-text` | `<p>` | A role part. |
| `ux-choice` | `<div>` | A role part: its text is the question, and its options, two or more, are the answers. |
| `ux-input` | `<p>` | A role part: its text is the field's label. The stylesheet draws the empty field below it; no `<input>` is written. |
| `ux-action` | `<button type="button">` | A role part. |
| `ux-action.is-primary` | `<button type="button">` | An action whose `primary` is true carries both classes: `class="ux-action is-primary"`. |
| `ux-list` | `<div>` | A role part: its text is a caption above the rows, and its options, one or more, are the rows. |
| `ux-status` | `<p>` | A role part. |
| `ux-media` | `<div>` | A role part: its text says what the picture shows. Nothing is loaded. |
| `ux-link` | `<a href="#">` | A role part. |
| `ux-nav` | `<nav>` | A role part: its text is a caption, and its options, one or more, are the places. |
| `ux-note` | `<p>` | A note on an item is the next sibling of that item's part. A note on a screen sits last in the frame's caption `<header>`, after the `<h2>` (and after a dialog's `ux-over`). Holds the note's text. |

### Captions and labels

- **A frame's caption** is the frame's first child: `<header><h2>`the screen's title`</h2></header>`.
  A dialog's caption then says which screen it opens over, by that screen's title:
  `<p class="ux-over">opens over `the title`</p>`. The screen's note, if any, comes last inside that
  `<header>`, as a `<p class="ux-note">`.
- **A region's or a group's label** is its first child, `<header>`the label`</header>`, holding text
  only. A region or a group without a label has no `<header>`.
- **An expansion's label** is its first child, `<summary>`the label`</summary>`. Every expansion has
  one: the format refuses an expansion without a label.

### Options

- Only a choice, a list and a nav have options, and each always has them: a choice at least two, a list
  and a nav at least one. The format refuses options on any other role.
- The options are a `<ul>`, the last child of the part, with one `<li>` per option, in order, each
  holding text only. The item's own text comes first, before the `<ul>`.

### A dialog over its screen

A dialog has a frame of its own, like a screen, and its `ux-dialog` takes the place of the `ux-screen`.
The stylesheet paints the frame below its caption as a backdrop (`.ux-frame:has(> .ux-dialog)`), which
stands for the screen named in `over`, and centres the dialog on it. The caption names that screen by
its title, in `ux-over` (above). That screen is not drawn again
inside the dialog's frame: it has its own frame.

### Stable ids

- `data-ux="`the item's id`"` goes on the part of an item that has an `id`: the element that carries its
  role class. A container has no id, so it never carries `data-ux`.
- A frame carries its screen's id as `data-screen`.
- An item's id is unique within its screen only, so the same `data-ux` may appear in two frames of one
  document: a part is found by its frame's `data-screen` and its own `data-ux` together.
- Both attributes are for the scripts and checks that find a part. No kit styles by them.

### What the stylesheet styles by name

Besides the classes, the stylesheet styles only these elements by name, each where this markup puts it:

- `body`;
- `header` and `h2`, a frame's caption, and `header` again as a region's or a group's label;
- `summary`, an expansion's label;
- `ul` and `li`, the options of a choice, a list or a nav.

Everything else is styled by class.

## The rule

**A project kit restyles these classes on the project's token file, and adds none.** It is one
stylesheet that imports the project's tokens from a file of the kit's own folder: setup copies the
project's token file there, or exports it when the tokens are not plain CSS, and records on its first
line where it came from. It renames no class, drops none and adds none, and changes no markup. Like the
grey kit, it styles each class once, the same wherever the part appears, so that no proposal looks
better made than another.
