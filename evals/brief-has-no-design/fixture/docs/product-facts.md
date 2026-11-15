# Product facts · Clinic rooms

What the product does today, and what may be said of it. A design is checked against this page.

## Rooms

- The clinic has five rooms: Room 1, Room 2, Room 3, Sala Jardín and the Gym. A clinic may have up to
  twelve, and a room's name may be up to forty characters.
- Each room is free, busy, being cleaned or closed. The product knows which, when a busy room's booking
  ends, when a room being cleaned is ready, and when a free room's next booking starts.
- For a busy room it knows the practitioner's first name, and the patient's first name with the initial
  of the surname.
- The statuses are fetched whole, every 30 seconds, with the time of the fetch. After a failed fetch the
  last statuses stay, with their time.

## Bookings

- The front desk can book a free room from now, for 15, 30 or 45 minutes, under a patient's name of up
  to 80 characters.
- A room that is not free can be booked from the time it frees up.
- A booking can be undone by whoever made it, for two minutes after it was made.
- A booking that could not be saved is reported as not saved. The product keeps nothing of it.

## What it does not do

- It holds no waiting list.
- It sends no message: no text, no email, no reminder.
- It shows nothing of a practitioner's day beyond a room's current booking and its next one.
