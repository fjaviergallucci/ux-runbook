<!-- Template. Keep the headings, "What you are not given" and all of "What to return", replace each
     {instruction in braces}, and delete this comment: the brief is sent whole, and the founder reads it
     first. At Look it is this brief with one section more, "The one screen": the screen being drawn, its
     state, and its approved items in order with their words exactly as written. -->

# Fresh brief · {the design's name}

You are asked for a concept of your own: the one or two screens that carry the idea, never the whole
flow. You know what the product does, and nothing of how it looks. Everything you are given is on this
page.

## The person

{Her and her moment, from her card: where she is, on what, what is in her hands, what has just happened,
what she never does. Then what is true of her profession, where it bears on this.}

## The job

{The one job, in one sentence. Then what she arrives with, and what she leaves with.}

## The tasks

{The tasks of the intent, each as where she starts and what she wants, in her words. Never the path.}

## The hardest state

{The one or two states the concept must be played through, as: nothing is free; two hundred rows.}

## What the product can show and do

{The context's inventory, in the words she would read: the real labels, names and values, and the worst
plausible rows. Nothing outside this list exists: a concept that needs more is asking for a dependency.}

## Language and device

{The language the words are written in; the device, with its primary width and its phone width.}

## What you are not given

The design system, the shared kit, today's screens and navigation, and the conventions of the product's
sibling surfaces. They are held back on purpose: what exists is a bias, and this brief asks for a
concept made without it. If any of them has reached you, stop and say so. What is held back is how
things look and how they are arranged, never what the product does: invent nothing that is not under
"What the product can show and do".

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

One proposal, to show the shape. The example is from another product and shows the format only: its
structure is not a suggestion.

```json
{
  "name": "Free rooms first",
  "bet": "She asks what is free right now, so the free rooms come before everything else.",
  "cost": "A busy room is harder to find: it is not where it was a minute ago.",
  "absent": ["A filter for free rooms: the screen does the filtering"],
  "hardest": "When nothing is free, the first region names the room that frees up soonest, and when.",
  "firstIdea": "A calendar of the day; set aside because it answers when, and she asked which.",
  "screens": [
    { "id": "rooms", "title": "Rooms, right now", "container": "screen", "items": [
      { "role": "status", "id": "free-count", "text": "2 rooms free now" },
      { "container": "region", "label": "Free now", "items": [
        { "role": "list", "text": "Free rooms", "options": ["Room 2, until 10:30", "Garden room, until 11:15"] },
        { "role": "action", "id": "book", "text": "Book a walk-in", "primary": true } ] },
      { "container": "expansion", "label": "Not free (3)", "items": [
        { "role": "list", "text": "Busy or closed", "options": ["Room 1, until 10:00", "Room 3, being cleaned", "Gym, closed today"] } ] } ] },
    { "id": "book-walk-in", "title": "Booking a walk-in", "container": "dialog", "over": "rooms", "items": [
      { "role": "input", "text": "Patient name", "note": "The cursor starts here." },
      { "role": "choice", "text": "How long?", "options": ["15 min", "30 min"] },
      { "role": "action", "text": "Book", "primary": true },
      { "role": "link", "text": "Cancel" } ] }
  ]
}
```
