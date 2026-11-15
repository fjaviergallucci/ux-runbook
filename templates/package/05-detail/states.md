<!-- Template. Keep the headings and the table, replace each {instruction in braces}, and delete this
     comment. -->

# States · {the design's name}

{One row for each screen in each state: the screen as it ordinarily is, named `default`, then every
state of the intent's table, none left out and none added.}

{A state that cannot happen on a screen keeps its row, and reads "cannot occur", with why. Say what must
be said, never the final words.}

A state's name here is the one its pages and its acceptance checks use.

| Screen | State | What she sees | What she can do | Where the focus is |
|---|---|---|---|---|
| {the screen's id} | {its name, in lower-case words joined by hyphens, as `empty-filtered`} | {which items show, which are gone, which cannot be used and why, what the status has to tell her} | {each thing, by its element's id} | {the element's id} |
