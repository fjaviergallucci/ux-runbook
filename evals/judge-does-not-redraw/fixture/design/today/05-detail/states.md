# States · today

One row for each screen in each state, the ordinary one first, then every state of the intent's table.

A state that cannot happen keeps its row, and reads "cannot occur", with why.

A state's name here is the one its pages and its acceptance checks use.

| Screen | State | What she sees | What she can do | Where the focus is |
|---|---|---|---|---|
| today | default | The count of free rooms; each free room with until when; the rooms that are not free, soonest free first; when the statuses were last updated | Book a free room: `book-room-2`, `book-sala-jardin` | `book-room-2` |
| today | empty-first-ever | cannot occur: the clinic's rooms are entered before the front desk is given this screen | — | — |
| today | empty-filtered | The status says that no room is free, and a line asks her to try again later | Nothing | — |
| today | loading-first-paint | cannot occur: the screen arrives whole, with the statuses in it | — | — |
| today | loading-refresh | As default: nothing is blanked, and `last-updated` shows the time of the last update | As default | Where it was |
| today | partial | cannot occur: the statuses of all the rooms arrive together, or not at all | — | — |
| book-room | default | The room and until when it is free; the patient's name to type; how long | Type the name `patient-name`; choose `how-long`; `book`; `cancel` | `patient-name` |
| book-room | error-recoverable | The status says the booking was not saved; the name she typed and the length she chose are kept | `try-again`; `cancel` | `try-again` |
| today | error-terminal | cannot occur: every failure here can be tried again | — | — |
| today | no-permission | cannot occur: everyone who signs in at the desk may book any room | — | — |
| today | success | The status says which room is booked, and until when; the room has moved to the rooms that are not free | Book another free room: `book-sala-jardin` | `booked-message` |
| today | overflow | Twelve rooms, one with a name of forty characters: the free rooms come first, whole | Book a free room | `book-room-2` |
