# Spec · today

## today

### Its job

Put a walk-in in a room that is free right now, without leaving the desk: for the coordinator who covers the front desk alone, the phone at her ear.

### Regions, in priority order

1. The count of free rooms, `free-count`: the answer to "is anything free", before anything else.
2. The rooms free now, `free-now`: each with until when it is free, `free-until-<room>`, and its own action, `book-<room>`.
3. The rooms that are not free, `not-free-list`: soonest free first.
4. When the statuses were last updated, `last-updated`.

### States

| State | What she sees | What she can do | Its page |
|---|---|---|---|
| default | The count of free rooms; each free room with until when; the rooms that are not free, soonest free first; when the statuses were last updated | Book a free room | `today-default-en.html` |
| empty-filtered | That no room is free now; which room frees up first, and when; the rooms that are not free | Book the room that frees up first, from then | `today-none-free-en.html` |
| success | Which room she booked, and until when; that she can take it back for two minutes | Take the booking back; book another room | `today-booked-en.html` |
| error-recoverable | That the booking was not saved; the name she typed, kept | Try again | `today-booking-error-en.html` |

The six other states of the intent cannot occur on this screen: the rooms are entered before the front desk is given it, the screen arrives whole, the statuses arrive together or not at all, every failure can be tried again, and everyone who signs in at the desk may book any room. Twelve rooms and a name of forty characters are held by the default state as it is drawn: the free rooms come first.

### Rules

- **Booking.** Pressing `book-<room>` asks for the patient's name, up to 80 characters, and for how long: 15, 30 or 45 minutes. The room is booked from now.
- **Undo.** For two minutes after a booking, `undo-booking` takes it back. After two minutes the element is gone.
- **What changes without her asking.** The statuses are fetched every 30 seconds. Nothing on screen moves while she is typing a name. After a failed fetch the last statuses stay, and `last-updated` keeps their time.
- **Focus order.** `book-<room>` of the first free room, then of each other free room, then the list.
- **Keyboard.** Every action is reached with Tab and used with Enter.
- **At 390 px.** One column, in the same order.
- **Motion.** None.

### Data map

| Element id | What it shows or offers | Where it comes from |
|---|---|---|
| `free-count` | How many rooms are free now | The rooms whose status is free, counted |
| `free-until-<room>` | When a free room's next booking starts | The room's next booking |
| `book-<room>` | Books that room from now | The booking action |
| `not-free-list` | Each room that is busy, being cleaned or closed, with when it frees up | The room's status and its current booking |
| `frees-first` | The room that frees up first, and when | The earliest end among the rooms that are not free |
| `undo-booking` | Takes back the booking she just made | The undo action, for two minutes |
| `last-updated` | When the statuses were last fetched | The time of the last fetch |

### Dependencies

None.
