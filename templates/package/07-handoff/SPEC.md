<!-- Template. Keep the headings and the tables, replace each {instruction in braces}, and delete this
     comment. One block is given, for one surface: a flow repeats it for each. Nothing here points back
     into the package: whatever a builder needs from an earlier stage is written out in full. -->

# Spec · {the design's name}

## {The surface's name}

### Its job

{One sentence, and the person it is for, in her moment.}

### Regions, in priority order

{What the screen holds, the most important first: each region, what it is for, and the elements in it,
by their stable ids.}

### States

{Every state and what it shows, one row each, the ordinary one first. Its page in `prototype/` is the
picture. A case inside a row that has no page of its own is written out here, and a person looks at it.}

| Screen | State | What she sees | What she can do | Where the focus is | Its page |
|---|---|---|---|---|---|
| {the screen's id} | {its name} | {…} | {…} | {the element's id} | {the file in `prototype/`, or "cannot occur"} |

### Rules

{Each as what sets it off, what the product does and what she sees.}

{Validation · focus order · keyboard · what changes without her asking · what cannot be undone · the
measure, by its event · what changes at each width · motion, and its reduced form.}

### Data map

{Where each element's content comes from in the product, traced and never assumed.}

| Element id | What it shows or offers | Where it comes from |
|---|---|---|
| {its id} | {…} | {the field, the call or the state in the product, with where that is defined} |

### Dependencies

{What the design shows that the product cannot supply today: the element, what is missing, and what the
build does until it exists. "None".}
