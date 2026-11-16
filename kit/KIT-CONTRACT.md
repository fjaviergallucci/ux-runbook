# The kit contract

The kit is the set of parts every structure proposal is drawn in: one stylesheet, one plain part for
each role and container of the walkthrough format (`scripts/lib/walkthrough.mjs`), and the areas of a
page a region may say it is. The `render` script draws with it at Structure; the prototype builder uses
the same parts at Detail. Because every proposal wears the same kit, the founder compares structures,
not paint: nothing in a proposal chooses a colour, a size or a style, and how an area is drawn at each
width is the kit's.

Two kits keep this contract:

- **The grey kit** (`grey/`), shipped here, for a project with no design system. `grey/kit.css` is the
  stylesheet; `grey/parts.html` shows one specimen of every class, labelled, in the markup below.
- **A project kit**, written once at setup and kept in the project (`design/kit/`), for a project with a
  design system: the same parts, restyled to look like the project's default components.

This file is enough to write the drawing script or a project kit: the classes, what each must convey,
and the exact markup each sits on.

## The classes

Each class, and what it must convey to someone looking at the drawing:

- `ux-option`: the page's title: which option this is.
- `ux-overview`: every screen of the proposal at a glance, before any is drawn, and quieter than the screens.
- `ux-frame`: one screen of the walkthrough on the board, captioned with its title and kept apart from the next.
- `ux-window`: the window a screen is drawn in, which reads as a page of a web app at the width it is pictured at.
- `ux-screen`: the screen itself, the whole surface she is looking at: laid out as a page when it has
  areas, and one readable column when it has none.
- `ux-dialog`: a dialog, plainly in front of the screen it opens over.
- `ux-over`: on a dialog's frame, the screen the dialog opens over, named by that screen's title: the
  board says it, not the maker.
- `ux-region`: a major area of a screen, set apart from the areas around it.
- `ux-navigation`: the region that is the navigation: the places she moves between, present from screen
  to screen. A column at the side when the page is wide, a bar when it is narrow.
- `ux-bar`: the region that is the bar: a strip across the top, with what is always at hand.
- `ux-main`: the region that is the main part: what the screen is for, at a readable width.
- `ux-beside`: the region that sits beside the main part and supports it: next to it when the page is
  wide, under it when it is narrow.
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
- `ux-nav`: the places she can move between, the one she is at marked.
- `ux-note`: a designer's note, said about the interface and never part of it, and quiet.
- `ux-account`: the proposal's own account, after the drawing and quieter than it.

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

The page is drawn as a product, in this order, each part a child of `body`:

1. **The title**, `ux-option`: which option this is. `Option `, the letter, `: ` and the proposal's name.
2. **The overview**, `ux-overview`: every screen of the proposal at a glance.
3. **The screens**, one `ux-frame` each, in the walkthrough's order.
4. **The proposal's own account**, `ux-account`: its bet, what it is deliberately bad at, what is absent
   on purpose and how it meets its hardest state. Last, and never above the drawing.

Drawn without the proposal's own account, for a reader who must not see it, the page is its title and its
screens and nothing else: the title is `Option ` and the letter alone, with no name; no `ux-overview`
and no `ux-account` is drawn, and no `ux-note` in any frame. Its first screen follows its title, so a
picture of the page's first screen begins with the first window. The screens are the same either way.

### A kit made before the page's areas

Eight classes came with the page's areas: `ux-option`, `ux-overview`, `ux-window`, `ux-navigation`,
`ux-bar`, `ux-main`, `ux-beside` and `ux-account`. A kit whose stylesheets style none of them was made before them.
The drawing script still draws with it, the board then shows no areas, and the script says so in one
warning line: the kit is made again, from this contract.

## The markup

The drawing script writes exactly this markup, and a kit styles exactly this markup. Every string in it
is the proposal's own words but these, which the board writes: `Option ` and `: ` in the title;
`opens over ` before a title in a dialog's `ux-over`; in the overview, the format's own word for each area
(`navigation`, `bar`, `main`, `beside`, or `screen` or `dialog` for one that places nothing), ` · `
between the parts an area holds and `, ` between the places of a nav; and in the account its heading,
`Its own account`, and its four terms: `Its bet`, `Deliberately bad at`, `Absent on purpose` and
`In the hardest state`.

A frame is drawn for each screen, in the walkthrough's order. Inside a screen, a dialog or a container,
the items are drawn in the order the walkthrough lists them: each role item as one part that holds the
item's text as its own text, each container as one element holding its own items the same way. The
areas of a screen are drawn in the order written too: where each sits on the page is the kit's.

| Class | Element | Where it sits, and what it holds |
|---|---|---|
| `ux-option` | `<header>` | The first child of `body`. Holds one `<h1>`: the page's title. |
| `ux-overview` | `<section>` | The second child of `body`, before the frames, on the page that carries the proposal's own account only. Holds one `<ol>`: see "The overview" below. |
| `ux-frame` | `<section data-screen="…">` | One per screen, normally a child of `body`. `data-screen` is the screen's `id`. It holds two children: its caption `<header>`, then its `ux-window`. |
| `ux-window` | `<div>` | The frame's second and last child. Holds one child: the screen's `ux-screen` or `ux-dialog`. |
| `ux-screen` | `<div>` | The window's only child, when the screen's container is `screen`. Holds the screen's items. |
| `ux-dialog` | `<div>` | The window's only child, in place of `ux-screen`, when the screen's container is `dialog`. Holds the dialog's items. |
| `ux-over` | `<p>` | Only in the caption `<header>` of a dialog's frame, right after the `<h2>` and before the dialog's note. Holds `opens over ` followed by the title of the screen named in `over`. |
| `ux-region` | `<section>` | Among the items of a screen, a dialog or a container. If it has a label, its first child is a `<header>` holding the label; then its items. |
| `ux-navigation` | `<section>` | A region whose `place` is `navigation` carries both classes: `class="ux-region ux-navigation"`. Always a child of a `ux-screen`, once in it at most. |
| `ux-bar` | `<section>` | A region whose `place` is `bar`: `class="ux-region ux-bar"`, placed as `ux-navigation`. |
| `ux-main` | `<section>` | A region whose `place` is `main`: `class="ux-region ux-main"`, placed as `ux-navigation`. A screen that has any area has this one. |
| `ux-beside` | `<section>` | A region whose `place` is `beside`: `class="ux-region ux-beside"`, placed as `ux-navigation`. |
| `ux-group` | `<div>` | Placed and labelled as a region. |
| `ux-expansion` | `<details>` | Placed as a region. It has the `open` attribute when its `open` is true. Its first child is always a `<summary>` holding its label; then its items. |
| `ux-heading` | `<h3>` | A role part: holds the item's text. |
| `ux-text` | `<p>` | A role part. |
| `ux-choice` | `<div>` | A role part: its text is the question, and its options, two or more, are the answers. |
| `ux-input` | `<p>` | A role part: its text is the field's label. The stylesheet draws the field; no `<input>` is written. |
| `ux-action` | `<button type="button">` | A role part. |
| `ux-action.is-primary` | `<button type="button">` | An action whose `primary` is true carries both classes: `class="ux-action is-primary"`. |
| `ux-list` | `<div>` | A role part: its text is a caption above the rows, and its options, one or more, are the rows. |
| `ux-status` | `<p>` | A role part. |
| `ux-media` | `<div>` | A role part: its text says what the picture shows. Nothing is loaded. |
| `ux-link` | `<a href="#">` | A role part. |
| `ux-nav` | `<nav>` | A role part: its text is a caption, and its options, one or more, are the places. |
| `ux-note` | `<p>` | A note on an item is the next sibling of that item's part. A note on a screen sits last in the frame's caption `<header>`, after the `<h2>` (and after a dialog's `ux-over`). Holds the note's text. |
| `ux-account` | `<section>` | The last child of `body`, after the frames. Holds an `<h2>`, then one `<dl>`: see "The account" below. |

### The areas of a screen

A region that is a direct item of a screen may say which of four areas of the page it is, and then every
direct item of that screen is such a region, one of them the main (the format refuses anything else).
Each is drawn as its region, with the area's class after `ux-region`, and holds what a region holds.
A screen may place any of the four but always the main; an area it does not place takes no room.

The stylesheet lays a screen that has a main out as a page (`.ux-screen:has(> .ux-main)`), at each
width: the navigation as a column at the side when the page is wide and as a bar when it is narrow; the
bar across the top; the main part at a readable width; and what is beside it next to it when wide and
under it when narrow. A screen with no area is one column in the same window. A dialog has no areas.

### The overview

`<section class="ux-overview">` holds one `<ol>` with one `<li>` for each screen whose container is `screen`,
in the walkthrough's order. An entry holds, in this order:

- `<b>`, the screen's title;
- a `<dl>` with one `<dt>` and `<dd>` pair for each area the screen places, in the format's order
  (`navigation`, `bar`, `main`, `beside`) whatever order they are written in: the `<dt>` holds the
  format's word for the area, the `<dd>` what the area holds, in one string. A screen that places no
  region has one pair, whose `<dt>` holds `screen`;
- an `<ol>`, only when a dialog opens over the screen: one `<li>` for each such dialog, in the order
  written, built the same way, its one `<dt>` holding `dialog`.

What an area holds is said from the proposal alone: the region's label, when it has one, then the words
of each item directly in it, joined by ` · `. An item's words are its text; a nav's are its places,
joined by `, `; a container's are its label, and those of what it holds when it has none.

The overview carries no class but its own, no `data-screen` and no `data-ux`, so it repeats no id of
the frames, and no note. It is drawn only on the page that carries the proposal's own account. It is
never called by another name: the sealed file of who made which letter has its own.

### The account

`<section class="ux-account">` holds `<h2>Its own account</h2>`, then a `<dl>` of four `<dt>` and `<dd>`
pairs: the bet, what the proposal is deliberately bad at, what is absent on purpose (a `<ul>` with one
`<li>` per line, inside its `<dd>`) and how it meets its hardest state.

### Captions and labels

- **The page's title** is `<header class="ux-option"><h1>`the title`</h1></header>`.
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
- **The place she is at.** In a nav drawn on a screen, the `<li>` of one place at most carries
  `aria-current="page"`: the place whose words open the screen's title, whatever the case and the
  spaces (`Today` opens "Today, at 9:40"; `Room` does not open "Rooms"); the longest such place, and
  none when the title opens with no place. No key of the format says it: the board reads it from the
  title. A nav in a dialog marks none.

### A dialog over its screen

A dialog has a frame of its own, like a screen, and its `ux-dialog` takes the place of the `ux-screen`
in the window. The stylesheet paints that window as a backdrop (`.ux-window:has(> .ux-dialog)`), which
stands for the screen named in `over` and shows nothing of it, and centres the dialog on it. The
caption names that screen by its title, in `ux-over` (above). That screen is not drawn again inside the
dialog's frame: it has its own frame.

### Stable ids

- `data-ux="`the item's id`"` goes on the part of an item that has an `id`: the element that carries its
  role class. A container has no id, so it never carries `data-ux`.
- A frame carries its screen's id as `data-screen`.
- An item's id is unique within its screen only, so the same `data-ux` may appear in two frames of one
  document: a part is found by its frame's `data-screen` and its own `data-ux` together.
- Each `data-screen` is on one element of the document, and nothing outside the frames carries either
  attribute: the overview repeats none.
- Both attributes are for the scripts and checks that find a part. No kit styles by them. The one
  attribute a kit styles by is `aria-current`, on a place of a nav.

### What the stylesheet styles by name

Besides the classes, the stylesheet styles only these elements by name, each where this markup puts it:

- `body`;
- `h1`, in the page's title;
- `ol`, `li`, `b`, `dl`, `dt` and `dd`, in the overview;
- `header` and `h2`, a frame's caption, and `header` again as a region's or a group's label;
- `summary`, an expansion's label;
- `ul` and `li`, the options of a choice, a list or a nav;
- `h2`, `dl`, `dt`, `dd` and `ul`, in the account.

Everything else is styled by class.

## The rule

**A project kit restyles these classes on the project's token file, and adds none.** It is one
stylesheet that imports the project's tokens from a file of the kit's own folder: setup copies the
project's token file there, or exports it when the tokens are not plain CSS, and records on its first
line where it came from. It renames no class, drops none and adds none, and changes no markup. Like the
grey kit, it styles each class once, the same wherever the part appears, but for the way an area lays
out what it holds (a nav's places run down the navigation when it is a column, and across anywhere
else), so that no proposal looks better made than another.
