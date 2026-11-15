# Brief · today

You are asked to propose one way to solve this, as a walkthrough: screen by screen, what she sees, in
order of importance, and what she can do. Others are working from this same brief. You will not see
their work, and they will not see yours. This page is the whole brief. A describer started from a
card is also given its card and a lens.

## The person

She covers the front desk of a small clinic alone over lunch. She is at the desk with the phone at her ear, on hold, and one free hand. A man she does not know has just walked in without a booking and is standing in front of her, and the door is opening again behind him. She never scrolls to find out whether anything is free, never reads a sentence while someone is talking to her, types a name only once a room is chosen, and does not trust a status she cannot date.

Of her profession: she is interrupted every few minutes, and gives the product a glance many times an hour. A patient sent to a room that is not free walks in on someone else's treatment, so before she sends anyone she checks that the room is free now, and until when. She says a room is "free", "busy", "being cleaned" or "closed", and calls it by the name on its door.

## The job

Put a walk-in in a room that is free right now, without leaving the desk. She arrives with a person in front of her, one free hand, and no idea which rooms are free. She leaves with a room booked under his name, knowing until when it is his.

## The tasks

1. Start: A man has walked in with no booking and is waiting at the desk. Goal: Find him a room he can go into now.
2. Start: A practitioner phones the desk between two patients. Goal: Tell her whether Sala Jardín is free until eleven.

## The hardest state

No room is free now. And: the clinic has twelve rooms, one of them with a name of forty characters.

## What the product can show and do

- Each room is free, busy, being cleaned or closed. Today: Room 1, Room 2, Room 3, Sala Jardín, the Gym. A clinic may have twelve, and a name may be forty characters long.
- For a busy room: when its booking ends, the practitioner's first name, and the patient's first name with the initial of the surname, as "Dan with Maria K., until 10:00". For a room being cleaned: when it is ready. For a free room: when its next booking starts, as "free until 10:30".
- The time the statuses were last fetched. They are fetched every 30 seconds; after a failed fetch the last ones stay, with their time.
- She can book a free room from now, for 15, 30 or 45 minutes, under a patient's name of up to 80 characters, and a room that is not free from the time it frees up.
- She can undo a booking for two minutes after making it.
- A booking that could not be saved is reported as not saved, and nothing of it is kept.
- There is no waiting list, and no message is sent.

## Language and device

English. The desk's computer, 1280 px wide, is the primary width; a phone, 390 px, is the second.

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
