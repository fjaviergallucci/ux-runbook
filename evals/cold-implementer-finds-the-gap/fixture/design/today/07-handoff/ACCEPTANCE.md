# Acceptance · today

What done is checked against. Every check a script can make is also in `acceptance.json`, the copy a
script runs: it names a state, and finds its elements by their stable ids. The checks are run against
the prototype first, before anyone builds, and then against the build.

The five checks last ran on the prototype on 2026-11-14: 0 failed, 5 passed.

## Success criteria, as checks

| Criterion | Checks | Judged by eye |
|---|---|---|
| She can say which rooms are free now without scrolling. | `free-count-in-view`, `free-count-in-view-phone` | — |
| When no room is free, she can say which room frees up first, and when. | `frees-first-shown` | — |
| A booking made in the wrong room can be undone from the screen she is on, in one press, for two minutes after it was made. | `undo-shown` | That one press takes the booking back: whoever accepts the build, in the build |

## States to drive

| Screen | State | Its page |
|---|---|---|
| today | default | `today-default-en.html` |
| today | empty-filtered | `today-none-free-en.html` |
| today | success | `today-booked-en.html` |
| today | error-recoverable | `today-booking-error-en.html` |

## Measured values

| Element | What is measured | Value | Width | Theme | Check |
|---|---|---|---|---|---|
| `book-room-2` | its box | at least 44 by 44 px | 390 | light | `book-size` |

## Accessibility checks

By script: `book-size`. By hand, in the build: every action reached with Tab and used with Enter; the page read at 200% without a line cut off.

## A check

`acceptance.json` is one object with two keys: `design`, the design's name, and `checks`, the list.

Each check has an `id` of its own, the `criterion` it holds, in words, the `state` it is about, the
`page` of `prototype/` that draws that state, a `width` in CSS pixels, and a `type` with that type's
parameters. It may have a `theme`, light or dark (light when it has none), a `language` and a `screen`.
An element is named by its `data-ux`. With `screen`, it is looked for only inside the one element whose
`data-screen` is that screen.

## The check types

| Type | Parameters | Passes when | Does not ask |
|---|---|---|---|
| `visible` | `target` | Exactly one element has the id, and it is rendered: painted, with a box of some width and height. | Whether a box that clips cuts it away, or something covers it. Pair it with `in-viewport`. |
| `absent` | `target` | No element has the id, or none that has it is rendered. | Whether the id was ever on the page: an id that is misspelt is absent too. |
| `text` | `target`, and one of `equals` and `matches` | What the element shows, its white space made single spaces, is the string `equals`, or is matched by the regular expression `matches`. A field reads as its value. | What a placeholder says, what capitals the stylesheet draws, or whether a line is cut with an ellipsis: it reads the whole string, as written. |
| `order` | `targets` | The elements named, two or more, come in that order in the document. | Where each is painted: an order the stylesheet alone changes is not seen. |
| `in-viewport` | `target` | It is rendered, its whole box lies inside the first viewport before any scrolling, and nothing cuts it away. | Anything after a scroll. Where it cannot tell, it fails and says so: it never guesses. |
| `min-size` | `target`, `minWidth`, `minHeight` | Its box is at least that wide and that high, in CSS pixels. | Whether that box is in view, or how near the next one is. |
| `contrast` | `target`, `min` | Its text colour, against the nearest ground behind it that is not transparent, has a WCAG ratio of at least the number given, from 1 to 21. | Anything but declared colours: over a picture, an opacity below 1, a filter or a blend mode, it refuses to measure. Nor the contrast of a border or an icon. |
| `count` | `target`, `equals` | The number of rendered elements whose id starts with the one given is the number given. | Their order, or what they say. A longer id that starts the same way is counted too. |
| `style` | `target`, `property`, `equals` | The value the browser computes for that one CSS property of the element, as the browser gives it (`16px`, `600`, `rgb(26, 26, 26)`), is the string given. | Whether the element is rendered: pair it with `visible`. Nor how the value came about: a token and a raw number that compute alike read alike. |
| `gap` | `targets`, `axis`, `equals` | Both elements named are rendered, and the distance from the first to the second along the axis given (`x`: from its right edge to the other's left; `y`: from its bottom edge to the other's top) is the number given, in CSS pixels, half a pixel of play given. | The other axis, or what lies between the two. Below zero, the two overlap or the second comes first. Nor the length of a line of text: no type measures that, and it is measured by a person. |
