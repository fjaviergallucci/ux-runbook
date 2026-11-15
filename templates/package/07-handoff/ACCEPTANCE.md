<!-- Template. Keep the headings, the tables and the whole of "A check" and "The check types", replace
     each {instruction in braces}, and delete this comment. -->

# Acceptance · {the design's name}

What done is checked against. Every check a script can make is also in `acceptance.json`, the copy a
script runs: it names a state, and finds its elements by their stable ids. The checks are run against
the prototype first, before anyone builds, and then against the build.

{The one check in `acceptance.json` is an example, of a room-booking tool: replace it with this
design's own. Then say here when the checks last ran on the prototype, and the count: failed, passed.}

## Success criteria, as checks

{Each success criterion, word for word, and the checks that hold it, by id. A criterion no script can
check is judged by eye: say who looks, a seat of the cast or the founder, and at which picture.}

| Criterion | Checks | Judged by eye |
|---|---|---|
| {the sentence} | {their ids} | {— · who looks, and at what} |

{The measure, a check made by hand in the build: "the event is sent once, on …, with …", by its name,
and who looks. "None named" when the intent names none.}

## States to drive

{Every state of `SPEC.md`, and the page of `prototype/` that draws it. In the build, the builder's state
map says how to reach each.}

| Screen | State | Its page |
|---|---|---|
| {its id} | {its name} | {the file} |

## Measured values

{The sizes, the gaps and the contrast pairs a build must hit, each held by a check. "Value" is what was
measured; a `contrast` check's `min` is the standard the row is held to, never the measured value.}

| Element | What is measured | Value | Width | Theme | Check |
|---|---|---|---|---|---|
| {its id} | {…} | {…} | {px} | {light · dark} | {its id} |

## Accessibility checks

{Those a script makes, by id: contrast, target size, order. Then those made by hand in the build, each
with what holding looks like: keyboard alone, a screen reader, text at 200%, reduced motion.}

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
