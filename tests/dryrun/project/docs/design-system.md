# Linden, the design system of Roomtally

Version 1.2, since 2026-10-01 (`docs/decisions.md`, D-4).

Linden is three things: its tokens, its components, and the few rules below. A screen is made of
Linden's components on Linden's tokens, and of nothing else.

## Files

| What | Where |
|---|---|
| Tokens: colours (a light and a dark set), spacing, type, radii, sizes | `src/styles/tokens.css` |
| Button | `src/components/button.css` |
| List and list row | `src/components/list-row.css` |
| Status tag | `src/components/status-tag.css` |

Each component is one plain CSS file. Its opening comment gives its markup and the tokens it takes.
There is no build and no framework: a screen links the token file, then the components it uses.

## Rules

1. **Only tokens.** No colour, size, space, radius or font is written as a raw value in a screen or a
   component: each is a token of `tokens.css`. A value Linden lacks is added to Linden first.
2. **A state is a word.** A room's state is always said in words. Colour supports the word and never
   stands in for it.
3. **One primary button on a screen.** Everything else is a plain button.
4. **Big enough to hit.** Anything she presses is at least `--size-target` high (44 px).
5. **Light and dark.** Every screen works in both. Dark follows the device's setting, through
   `prefers-color-scheme`.

The accessibility target is WCAG 2.2 AA: text at least 4.5:1 against what it sits on, large text and
the edges of controls at least 3:1, a visible focus on everything she can reach by keyboard.

## Components

| Component | Classes | What it is for |
|---|---|---|
| Button | `ln-button`, `ln-button--primary` | An action. The primary one is the screen's main action, and there is one. |
| List and list row | `ln-list`, `ln-row`, `ln-row__lead`, `ln-row__main`, `ln-row__meta`, `ln-row__end` | Rows of the same kind of thing: bookings, rooms, people on shift. |
| Status tag | `ln-tag`, `ln-tag--free`, `ln-tag--busy`, `ln-tag--cleaning` | The state of a room, in its word, on its colour. |

## Not in Linden yet

A text field, a set of options, a dialog and navigation. A screen that needs one uses the browser's
own control, on Linden's type and colour tokens, until it is added.
