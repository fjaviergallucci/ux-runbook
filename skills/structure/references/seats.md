# The seats at Structure: what each is handed, and what it does not open

One section for each seat of the kit whose card sits at Structure. A brief hands a seat what its
card's `reads` allows and this page lists, each file by its absolute path, and lists under "Do not
open" what its card's `never-reads` names, as this package holds it. Nothing is pasted into a brief,
and no brief says who made a letter. How a seat is started, on which model, and the rules of a shared
machine are in `skills/design/references/loop.md`, under "Starting a seat". Every brief is written
into `<package>/work/`, named as the loop says. You fill a brief from this page and never from the
seat's card, which you do not open: where a template asks what the card gives, this page says it.

"Today's screen" is the surface being redesigned, as it is, as a picture or as source. "A sibling
surface" is another surface of the product. "Project sources" of the context says which a file is.
The blind on today's screen ends at his pick: the carry list hands it on, and Detail may open it.

A card of the project's own that the cast sheet seats here is handed what its header's `reads`
allows, by the same rule, and of `<package>/04-structure/` no more than the kit's seats of its shelf.

The intent's "What the readers found", which the cast sheet carries on, is for the handoff's coverage
page: it is never put into a maker's brief, nor into a reader's.

## The makers

The makers are started in one message, after his yes to the brief and never before. Those that drive
a browser, the screen generators, are started three at a time at most. A proposal the merge refuses
goes back once: to a fresh sub-agent in the same seat, with the same brief, its own file and the
fault as the merge printed it.

`<name>`, in `<package>/04-structure/proposals/<name>.json`, is the seat's line on the cast sheet,
made unique: `describer-fewest-steps`, `describer-guided`, `outside-openai`, `fresh-generator`. No
two files share one. The name is what the map prints for a letter once it is opened, so it must tell
two describers on the same engine apart; until then it is read by nobody but you.

### `maker.structure-describer`

- **Its brief,** from `templates/briefs/maker.md`, gives its lens, as its line of the cast sheet names
  it: fewest steps, guided, defaults first or in place. No two describers share a lens.
- **Handed:** `<package>/04-structure/BRIEF.md`, the brief he approved, and `kit/KIT-CONTRACT.md`, the
  format. Neither the person nor her profession's profile: what bears on the design is in the brief.
- **Do not open:** `<package>/04-structure/proposals/`, but its own file; `<package>/work/`; today's
  screen, as a picture or as source; everything else in the package. Its brief holds no idea of yours.
- **Writes:** one proposal, `<package>/04-structure/proposals/<name>.json`.
- **A continuity maker** is the one describer the cast sheet's "Blind rules" may name. Its brief says
  so, and hands it today's screen besides, by a path the carry list names. No other maker sees it.

### `maker.outside-describer`

No sub-agent sits here. You run the command of step 5, once for each line of the cast sheet that
names this seat, with the provider and the model id of that line. Its card,
`pool/makers/outside-describer.md`, speaks to you: read it before the first run.

- **Handed:** the brief he approved, whole and unchanged: `<package>/04-structure/BRIEF.md`, or
  `<package>/04-structure/BRIEF-fresh.md` for a line that belongs to a fresh pass. That file is the
  `<brief>` of the command. The script sends that one file. Add nothing to it: no opening line, no
  example.
- **Do not open:** nothing else can reach it, since nothing else is sent: no other proposal, no idea
  of yours, nothing of today's screen, of the design system, of the project's kit or of the sibling
  surfaces. Keep all of it out of the brief.
- **Writes:** `<package>/04-structure/proposals/<name>.json`, when the answer is one valid proposal.
  The script has written `engine` and `model` into it, so of the two keys of step 6 you add `track`
  alone.
- **An answer that is not in the format** leaves `<name>.json.raw.txt` in the proposals folder, and
  the script exits 1 and says why. Start one `maker.transcriber` on that file. You never write it
  into the format yourself.
- **A refusal leaves nothing.** Tell the founder what the script printed, as it printed it. Try once
  more only after a timeout. Never look for the reason in a file of keys or in the environment. Then
  go on with the seats you have: the decision page says this seat did not answer.
- **Whether its proposal was picked** is known once the map is open. "Not chosen" in `CHOSEN.md`
  keeps it, for the lessons.

### `maker.screen-generator`

It sits in a fresh pass, or as one more kind of proposal when the cast sheet says so. Either way it
answers the fresh brief, the one brief that asks for screens as they came, and never the describers'.

- **Handed:** `<package>/04-structure/BRIEF-fresh.md`, alone. Its brief names the folder it writes
  into.
- **Do not open:** the design system and its tokens; the project's kit, `<kit dir>`, and the
  kit's own; today's screens and the sibling surfaces, as pictures or as source;
  `<package>/04-structure/proposals/`; `<package>/work/`; everything else in the package. Its brief
  holds no idea of yours. If any of this reaches the seat, its work is no longer fresh: say so, and
  start the seat again, clean.
- **Writes:** in `<package>/04-structure/fresh/`, for each of its one or two screens: the screen as it
  came, its picture, and the prompt that made it.
- **It drives a browser** for its pictures, and counts among the three.
- **It never transcribes its own screen.** A `maker.transcriber` does.

### `maker.transcriber`

One for each concept that did not come in the format: a fresh concept, its one or two screens
together, or an outside answer left as `.raw.txt`. It is started once its source is there.

- **Handed:** its source, the one concept: its screens as they came in `<package>/04-structure/fresh/`,
  each file and each picture by its path, or the one `.raw.txt` file; and `kit/KIT-CONTRACT.md`, the
  format.
- **Do not open:** `<package>/04-structure/BRIEF.md` and `<package>/04-structure/BRIEF-fresh.md`; the
  prompt kept beside a generated screen; `<package>/02-intent.md`; every other file of
  `<package>/04-structure/proposals/` and of `<package>/04-structure/fresh/`; `<package>/work/`. Its
  brief says nothing of what the design is for, and holds no idea of yours.
- **Writes:** one proposal, `<package>/04-structure/proposals/<name>.json`. You tag it with the track
  and the engine of the concept it wrote down, never with its own.

## The readers

The readers are started once the board is drawn and photographed: the judges in one message, so that
no ledger exists while another judge reads, then the audiences. They read by letter. An audience is
started once every judge has written its ledger, and not before.

`<seat>`, in the name of a reader's file, is the seat's id, as `judge.usability`, and a seat that is
loaded adds what it is loaded with, so that no two readers share a file: `judge.profile-<name>` for
each profession's profile, `audience.task-reader-<name>` for each person.

Each letter is on the board twice, and each page is pictured twice:

- **Drawn with the makers' notes, and without them.** `<letter>.html` carries them, and
  `<letter>-screens.html` does not. The judges read the pages with the notes: the bet, the cost,
  what a letter is deliberately bad at, and the notes on its screens and items. The audiences are
  handed the pictures of the pages drawn without them, and no other.
- **The whole page, and its first screen alone.** A picture of the first screen is the window's
  height, with no scrolling, and its name ends `-first.png`. A brief says which is which, and that
  "without scrolling" is answered on the first.

A judge's brief asks that the "Where" of each finding open with the letters it holds for, so that
what is open on his pick can be read off the ledger. A brief names first the pictures the seat's
checks, or her tasks, need. Every reader's brief lists these under "Do not open":

- `<package>/work/`, where the makers' briefs and replies are;
- `<package>/04-structure/MAP.sealed.json`, the author map;
- `<package>/04-structure/PICK.md`, the pick;
- `<package>/04-structure/proposals/`, the makers' own files;
- `<package>/04-structure/fresh/`, `<package>/04-structure/BRIEF.md` and
  `<package>/04-structure/BRIEF-fresh.md`: the makers' too, and a screen as it came would tell a
  reader where a letter came from;
- `<package>/03-cast.md`, the cast sheet: it holds each maker's lens and engine;
- `<package>/04-structure/CHOSEN.md`: from step 4 it names the seats that send the brief out;
- every file of `<package>/04-structure/reads/` but its own, and `<package>/04-structure/earlier/`;
- when a continuity maker is cast, today's screen, as a picture or as source: whoever has seen it can
  tell which letter kept its layout. It is listed for every reader. The usability judge's card reads
  `current-screens`, but at Context: at Structure it is handed the options and nothing of today.

### `judge.usability`

- **Its brief,** from `templates/briefs/judge.md`: the options by letter, with their two widths, and
  the cut of its optional checks, on and off, as its line of the cast sheet has it.
- **Handed:** `<package>/04-structure/board/`, the board folder, whole: the letters' files, the drawn
  pages and the pictures. And `<package>/02-intent.md`, the intent.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/04-structure/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.truth`

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's. It carries one line:
  where the context and a source it is handed disagree, the context holds.
- **Handed:** `<package>/04-structure/board/`, the board folder, whole. `<package>/01-context.md`,
  the context, for the inventory it traces every element to. `<package>/02-intent.md`, the intent.
  And the project's facts document, where the project profile names one under `facts`, with the
  data the brief's example rows came from, where "Project sources" of the context names such a
  file, by the path the carry list gives it.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/04-structure/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.profile`

One for each profession's profile the cast sheet loads into this seat, as `profile.<name>`.

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's.
- **Handed:** `<package>/04-structure/board/`, the board folder, whole. Its profession's profile,
  whole, by the path the carry list names. `<package>/02-intent.md`, the intent.
- **Do not open:** the list above: the audiences' reads are in it, and so is the ledger of another
  profile judge.
- **Writes:** its ledger, `<package>/04-structure/reads/<seat>-<name>.md`, in the shape of
  `templates/outputs/LEDGER.md`, with its ranking of the options by letter.

### `audience.task-reader`

One for each person the cast sheet seats it as, `person.<name>`: the primary person, and a contrast
person the makers were not briefed on.

- **Its brief,** from `templates/briefs/audience.md`: who she is, her language, the width each task
  puts her at, in the light theme, and her tasks, copied word for word from "Tasks for the audience"
  of the intent: where she starts and what she wants. Never the path, a criterion, or the job as the
  intent states it. Where the tasks are not written in her language, the brief says so.
- **Handed:** her card. Her profession's traits: a copy of her profession's profile with every
  `So the interface must:` field removed, written beside the brief as the loop says, and the one
  file of `<package>/work/` she opens. And the pictures of every letter drawn without the makers'
  notes, at the width each task puts her at, each by its path in `<package>/04-structure/board/`:
  the whole page, as `A-screens-390-light.png`, and its first screen alone, as
  `A-screens-390-light-first.png`. The pictures, and pictures only.
- **Do not open:** the list above, and with it: `<package>/02-intent.md`, and every other file of the
  package; her profession's profile itself; the pages and the letters' files of the board, with the
  pictures of the pages that carry the makers' notes. A person cannot find a control by reading
  markup, and must not be told what a letter means to do.
- **Writes:** one task read, `<package>/04-structure/reads/<seat>-<name>.md`, in the shape of
  `templates/outputs/TASK-READ.md`.
