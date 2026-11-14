<!-- Template. Keep the headings and all of "How to work" and "What to return", replace each
     {instruction in braces}, and delete this comment: the brief is sent whole, the same to every
     describer, and the founder reads it first. It gives context and never the design: no component, no
     layout, no idea of the session's. -->

# Brief · {the design's name}

You are asked to propose one way to solve this, as a walkthrough: screen by screen, what she sees, in
order of importance, and what she can do. Others are working from this same brief. You will not see
their work, and they will not see yours. This page is the whole brief. A describer started from a
card is also given its card and a lens.

## The person

{Her and her moment, from her card: where she is, on what, what is in her hands, what has just happened,
what she never does. Then what is true of her profession, where it bears on this.}

## The job

{The one job, in one sentence. Then what she arrives with, and what she leaves with.}

## The tasks

{The tasks of the intent, each as where she starts and what she wants, in her words. Never the path.}

## The hardest state

{The one or two states every proposal must be played through, as: the list is empty; it has two hundred rows.}

## What the product can show and do

{The context's inventory, in the words she would read: the real labels, names and values, and the worst
plausible rows. Nothing outside this list exists: a proposal that needs more is asking for a dependency.}

## Language and device

{The language the walkthrough's words are written in; the device, with its primary width and its phone
width.}

## How to work

- Ask first whether no interface at all would do the job: could the product simply do it, and say
  afterwards what it did?
- Write your first idea down and set it aside. It is the habit of the category: the screen every
  product of this kind already has. Then look for an answer of another kind.
- Propose one way, whole: not two, and not a blend.
- Use the real words she would read, and the worst rows she would meet, as this page gives them.
- Play the hardest state through it. If it breaks, change it, not the sentence that describes it.

## What to return

One JSON object in the format below, and nothing else: no sentence before it and none after. If you
were given a path to write to, the object is the whole of that file.

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

- **A container** arranges items, and nothing else does. It has `container` and `items`, and may have a
  `label`.

| `container` | What it is | What it needs |
|---|---|---|
| `region` | A major area of a screen. | One item or more. |
| `group` | Things that belong together. | One item or more. |
| `expansion` | Something that opens in place. | One item or more, and always a label. |

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
- Every `text`, `title` and `label` is a line of words, never empty, and every list (`absent`, `screens`,
  `items`, `options`) holds at least one entry.
- These are all the keys. There is no key for layout, size, colour or position, and an unknown key is
  refused: proposals differ in order, in grouping, in what is present and in which container holds it.

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
      { "role": "heading", "text": "(a heading)" },
      { "role": "text", "text": "(some words she reads)" },
      { "role": "choice", "text": "(a question)", "options": ["(an option)", "(another option)"] },
      { "role": "input", "text": "(a field's label)" },
      { "role": "action", "text": "(the main action)", "id": "an-item", "note": "(a note about this item)", "primary": true } ] },
    { "id": "a-dialog", "title": "(a dialog's title)", "container": "dialog", "over": "a-screen", "items": [
      { "container": "region", "label": "(a region's label)", "items": [
        { "role": "list", "text": "(a list's caption)", "options": ["(a row)"] },
        { "role": "status", "text": "(a status)" } ] },
      { "container": "group", "label": "(a group's label)", "items": [
        { "role": "media", "text": "(what a picture shows)" },
        { "role": "link", "text": "(a link)" } ] },
      { "container": "expansion", "label": "(an expansion's label)", "open": false, "items": [
        { "role": "nav", "text": "(a nav's caption)", "options": ["(a place)"] } ] } ] }
  ]
}
```
