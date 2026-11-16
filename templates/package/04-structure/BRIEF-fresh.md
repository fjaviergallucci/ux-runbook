<!-- Template. Keep the headings and all of "What you are not given", replace each {instruction in
     braces}, and delete this comment: the brief is sent whole, and the founder reads it first. It holds
     two forms, each opened by a comment, and one of them is deleted, with both comments. At Structure,
     keep "The hardest state", "How to work" and "What to return" with the format, and delete "The one
     screen" and what follows it. At Look, keep "The one screen" and the "What to return" after it, and
     delete "The hardest state", "How to work" and the first "What to return". -->

# Fresh brief · {the design's name}

You know what the product does, and nothing of how it looks. This page is the whole brief, and what
you are asked for is at its end. A maker started from a card is also given its card.

## The person

{Her and her moment, from her card: where she is, on what, what is in her hands, what has just happened,
what she never does. Then what is true of her profession, where it bears on this.}

## The job

{The one job, in one sentence. Then what she arrives with, and what she leaves with.}

## The tasks

{The tasks of the intent, each as where she starts and what she wants, in her words. Never the path.}

## What the product can show and do

{The context's inventory, in the words she would read: the real labels, names and values, with every row
that states a limit, a delay or a failure. Nothing outside this list exists: more is a dependency.}

{A real label that names a screen of today is given as the facts it states, never in its own words.}

## Language and device

{The language the words are written in; the device, with its primary width and its phone width.}

## What you are not given

The design system, the shared kit, today's screens and navigation, and the conventions of the product's
sibling surfaces. They are held back on purpose: what exists is a bias, and this brief asks for work
made without it. If any of them has reached you, stop and say so. What is held back is how things look
and how they are arranged, never what the product does: invent nothing that is not under "What the
product can show and do".

<!-- Structure form: from here to the next comment. At Look, delete all of it. -->

## The hardest state

{Every state the intent says she must be told about, one line each, named by what has happened, never by
what she is told in it: the list is empty. The rule selects them: none is weighed, and none is left out.}

## How to work

You are asked for a concept of your own: the one or two screens that carry the idea, never the whole
flow.

- Ask first whether no interface at all would do the job: could the product simply do it, and say
  afterwards what it did?
- Write your first idea down and set it aside. It is the habit of the category: the screen every
  product of this kind already has. Then look for an answer of another kind.
- Propose one way, whole: not two, and not a blend.
- Use the real words she would read, and the worst rows she would meet, as this page gives them.
- Play the hardest state through it. If it breaks, change it, not the sentence that describes it.
- If you answer in words, in the format below: where a screen is a page she works from, say in `place`
  which area each of its regions is. A screen with nothing around what it is for places none, and a
  dialog never does. You choose the area, never its size or its side: every proposal's areas are
  drawn the same way at each width.

## What to return

If you make screens, return each screen as it came. If you answer in words, return one JSON object in
the format below, and nothing else: no sentence before it and none after.

### The walkthrough format

A proposal says what she sees and what she can do, screen by screen, and nothing of how it is drawn.

- **The proposal** has `name` (a few plain words for the kind of answer it is), `bet` (what the structure
  wagers, in one sentence), `cost` (what it is deliberately bad at), `absent` (a list: what is left out
  on purpose), `hardest` (what it shows in the hardest state), `firstIdea` (your first idea, and why you
  set it aside) and `screens` (a list, in the order she meets them). All seven are required.
- **Who made it** is not yours to write: leave out `author`, `engine`, `track`, `model` and `source`.
- **A screen** has `id` (a short name of its own), `title` (what it is called when shown to others),
  `container` (it is a `screen`, or a `dialog`), `over` (a `dialog` only, and always: the short name of
  the screen it opens over), `note` (if it helps: one line said about the screen, never shown on it)
  and `items` (what she sees, the most important first).
- **An item** is a role or a container, never both.
- **A role** is something she sees or does. It has `role` and `text`, and may have an `id` and a `note`.

| `role` | What it is | What it needs |
|---|---|---|
| `heading` | What a screen, a region or a group is about. | Its words. |
| `text` | Words she reads, with nothing to do. | The words. |
| `choice` | A choice among answers she can all see. | The question, and two options or more. |
| `input` | A place she types. | Its label. |
| `action` | Something she does. | Its label; marked primary when it is the one action the screen is for. |
| `list` | Like things, one row each. | A caption, and one row or more as its options. |
| `status` | The state of something, as the product reports it. | What it says. |
| `media` | A picture, a video or a map. | What it shows, in words: nothing is drawn. |
| `link` | A way to go somewhere else. | Its words. |
| `nav` | The places she can move between. | A caption, and one place or more as its options. |

In a `nav` on a `screen`, the place whose words open that screen's `title` is drawn as the place she is
at, as "Today" opens "Today, at 9:40".

- **A container** arranges items, and nothing else does. It has `container` and `items`, and may have a
  `label`. A `region` may also say in `place` which area of the page it is.

| `container` | What it is | What it needs |
|---|---|---|
| `region` | A major area of a screen. | One item or more. |
| `group` | Things that belong together. | One item or more. |
| `expansion` | Something that opens in place. | One item or more, and always a label. |

| `place` | Which area of the page the region is |
|---|---|
| `navigation` | The places she moves between, present from screen to screen. |
| `bar` | A strip across the top: what is always at hand. |
| `main` | What the screen is for. |
| `beside` | What sits next to the main part and supports it. |

The rules a proposal is checked by. One that breaks any of them is refused:

- An `id` is lower-case words joined by hyphens. No two screens share a `title` or an `id`, and no two
  items of one screen share an `id`.
- A `dialog` names in `over` the `id` of a `screen` of the same proposal, never of another `dialog`. A
  `screen` has no `over`.
- One primary action on a screen at most: `primary`, true or false, is true on one `action` or on none,
  and no other role has it.
- A `choice` has two `options` or more; a `list` and a `nav` have one or more; no other role has any.
- An `expansion` always has a `label`, and may say with `open`, true or false, whether it starts open.
  A `region` or a `group` may have a `label`, and has no `open`.
- `place` is written only on a `region` that is a direct item of a `screen`: never inside another
  container, and never in a `dialog`. Each of the four areas is on a screen once at most. A screen that
  places any region has a `main`, and every direct item of that screen is then a placed `region`:
  nothing floats outside the areas. A screen with no placed `region` is drawn as one column.
- Every `text`, `title` and `label` is a line of words, never empty, and every list (`absent`, `screens`,
  `items`, `options`) holds at least one entry.
- `screens` holds five entries at most, dialogs counted: a structure that needs more is more than one
  design.
- These are all the keys. There is no key for size, colour or exact position: `place` says only which of
  four areas a `region` is, and how an area is drawn at each width is the same for every proposal. An
  unknown key is refused: proposals differ in order, in grouping, in what is present, in which container
  holds it and in which area that is.

A specimen of the syntax, not a proposal: it shows every part once, in no meaningful arrangement, and
a proposal that resembles it has copied it.

```json
{
  "name": "(the proposal's name)",
  "bet": "(the bet, in one sentence)",
  "cost": "(what it is deliberately bad at)",
  "absent": ["(a thing left out on purpose)"],
  "hardest": "(what it shows in the hardest state)",
  "firstIdea": "(your first idea, and why you set it aside)",
  "screens": [
    { "id": "a-screen", "title": "(a screen's title)", "container": "screen", "note": "(a note about this screen)", "items": [
      { "container": "region", "place": "main", "label": "(a region's label)", "items": [
        { "role": "heading", "text": "(a heading)" },
        { "role": "text", "text": "(some words she reads)" },
        { "role": "choice", "text": "(a question)", "options": ["(an option)", "(another option)"] },
        { "role": "input", "text": "(a field's label)" },
        { "role": "action", "text": "(the main action)", "id": "an-item", "note": "(a note about this item)", "primary": true } ] } ] },
    { "id": "a-dialog", "title": "(a dialog's title)", "container": "dialog", "over": "a-screen", "items": [
      { "role": "list", "text": "(a list's caption)", "options": ["(a row)"] },
      { "role": "status", "text": "(a status)" },
      { "container": "group", "label": "(a group's label)", "items": [
        { "role": "media", "text": "(what a picture shows)" },
        { "role": "link", "text": "(a link)" } ] },
      { "container": "expansion", "label": "(an expansion's label)", "open": false, "items": [
        { "role": "nav", "text": "(a nav's caption)", "options": ["(a place)"] } ] } ] }
  ]
}
```

<!-- Look form: from here to the end. At Structure, delete all of it. -->

## The one screen

You are asked to draw one screen, in one state. Its structure and its words are decided. Draw it with
these items, in this order, and these words exactly as written: add no element, drop none, rewrite no
string, and draw no other screen. Choose only how it looks.

- **The screen:** {its title, and what it is for, in one line}
- **Its state:** {the state it is drawn in, and what she is shown in it}
- **Its items, in order, with their words:** {the screen's approved structure, item by item, each with
  its string exactly as approved}

## What to return

The screen as one self-contained page, and nothing else: no sentence before it and none after.
