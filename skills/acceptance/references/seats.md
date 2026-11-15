# The seats at Acceptance: what each is handed, and what it does not open

One section for each seat of the kit whose card sits at Acceptance. A brief hands a seat what its
card's `reads` allows and this page lists, each file by its absolute path, and lists under "Do not
open" what its card's `never-reads` names, as this package holds it. Nothing is pasted into a brief
but an audience's tasks, which its template asks for word for word. How a seat is started, on which
model, and the rules of a shared machine are in `skills/design/references/loop.md`, under "Starting
a seat". Every brief is written into `<package>/work/`, and keeps the template's last line: a seat
that starts a browser stops only the one it started.

The seats are those of the cast sheet's "Acceptance" table, each on the model and the effort its line
names: a dash means the session's model, and you enforce none. A card of the project's own that the
table seats is handed what its header's `reads` allows, by the same rule. No maker sits here.

**You name a file you may not open.** The intent, the context and a seat's earlier ledger are handed
over by their paths, as the package's layout gives them. You do not read them to write a brief.

Six names are used below:

- "The pictures of the build" are `<package>/08-acceptance/shots/`: each state, at each width and in
  each theme its checks name.
- "The approved pictures" are `<package>/07-handoff/prototype/shots/`: the reference picture of the
  same state carries the same name.
- "The results" are `<package>/08-acceptance/checks.md`, the table of every check, failed, not run
  and passed, and `<package>/08-acceptance/by-hand.md`, the checks made by hand.
- "What the builder wrote back" is `<package>/build/BUILD.md`, `<package>/build/STATES.md` and
  `<package>/build/DEVIATIONS.md`.
- "The approved design" is, in `<package>/07-handoff/`: `SPEC.md`, the states and the rules;
  `strings.json`, the strings with their why-lines; `prototype/`, the final screens, with the
  measured values in `ACCEPTANCE.md` and the changes to the system in `PARTS.md`; and `tokens.css`.
- "What the project says of its design system" is the documents that "Design system" of the project
  profile names, each by its path. A seat is handed those files, and never the project profile.

## The judges

The judges are started in one message, once the table of the checks is built and every state is
photographed, so that no ledger exists while another judge reads. None drives the build: what nobody
measured was not looked at, and a judge says so. What each reads is named by what it is.

`<seat>`, in the name of a reader's file, is the seat's id, and a seat that is loaded adds what it is
loaded with, so that no two readers share a file: `judge.usability`, `judge.profile-<name>` for each
profession's profile, `audience.task-reader-<name>-<language>` for the person and her language.

**Each judge reads cold first, then opens its seat's earlier ledger.** Its brief says this is the
seat's first read of the build, and names one file more: the ledger its seat wrote at the last stage
it read at, in that stage's reads folder. The "Seats" table of `<package>/07-handoff/COVERAGE.md`
shows which stage that is: `<package>/06-look/reads/<seat>.md`,
`<package>/05-detail/reads/<seat>.md` or, for a seat that last read the options,
`<package>/04-structure/reads/<seat>.md`, with its re-read beside it, `<seat>-reread.md`, where there
is one. It opens them only after it has read the build
and written its findings, and then marks each earlier finding *fixed*, *partly* or *still present*
in the build, in the table its ledger has for a re-read. A seat that never read before has no
earlier ledger, and its brief names none.

Every judge's brief lists these under "Do not open":

- `<package>/work/`, where the briefs and every maker's notes and replies are;
- `<package>/04-structure/MAP.sealed.json` and `<package>/06-look/BESIDE.sealed.json`, the author
  maps, with `<package>/04-structure/CHOSEN.md` and `<package>/DECISIONS.md`, which name who made
  what;
- `<package>/03-cast.md`, the cast sheet;
- every file of `<package>/08-acceptance/reads/` but its own; every reads folder of an earlier
  stage, but its own seat's earlier ledger, once it has read cold; and
  `<package>/07-handoff-gate/`;
- `<package>/07-handoff/COVERAGE.md`, `<package>/08-acceptance/REPORT.md`,
  `<package>/08-acceptance/FIXES.md`, `<package>/08-acceptance/decision.json` and
  `<package>/08-acceptance/decision.html`, which sum up what the other seats said;
- the board and the proposals of `<package>/04-structure/`, `<package>/04-structure/earlier/`,
  `<package>/06-look/fresh/` and `<package>/06-look/beside/`.

### `judge.usability`

- **Its brief,** from `templates/briefs/judge.md`: the build, with its widths, its themes and its
  languages, and the cut of its optional checks, on and off, as its line of the cast sheet has it.
- **Handed:** `<package>/02-intent.md`, the intent. Of the approved design: `SPEC.md` and
  `strings.json`. The pictures of the build, and the approved pictures. The results. What the
  builder wrote back.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/08-acceptance/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`. It judges the build as built, and names every place it differs
  from what was approved.

### `judge.truth`

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's.
- **Handed:** `<package>/01-context.md`, the context, for the inventory. `<package>/02-intent.md`,
  the intent. The project's facts document, where the project profile names one under `facts`. Of
  the approved design: `SPEC.md`, `strings.json` and `prototype/`. The pictures of the build, and
  the approved pictures. The results. What the builder wrote back: a deviation that changes what
  she is led to expect is its finding.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/08-acceptance/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.words`

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's. It carries no line of
  the founder's: the words are approved, and the seat reads whether the build shows them.
- **Handed:** `<package>/02-intent.md`, the intent. Of the approved design: `strings.json`, with the
  why-lines, and `SPEC.md`. The pictures of the build, in every language. The results. What the
  builder wrote back.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/08-acceptance/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`: every string on screen is the approved one, in each language,
  whole, with no key showing and nothing left in another language.

### `judge.accessibility`

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's. It says the seat is
  handed the pictures and the results, and does not drive the build.
- **Handed:** `<package>/02-intent.md`, the intent. Of the approved design: `SPEC.md`, for the focus
  order and the keyboard, and `prototype/`. The pictures of the build. The results, with what the
  keyboard did in `by-hand.md`. What the builder wrote back.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/08-acceptance/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`. What no check measured and no hand made goes under what was not
  looked at.

### `judge.visual-craft`

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's, with its lens: the
  skill its line of the cast sheet names as its engine, to load if it is installed.
- **Handed:** `<package>/02-intent.md`, the intent. Of the approved design: `prototype/`, with the
  measured values, and `tokens.css`. What the project says of its design system. The pictures of
  the build, and the approved pictures, state by state. The results. What the builder wrote back.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/08-acceptance/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`: every gap, size or colour the build changed from the approved
  pictures is a finding.

### `judge.system-fidelity`

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's. It lists the files of
  the build, each by its path, as "Where it lives" of `BUILD.md` gives them: built or changed. A
  settings file, and any other file that holds a sign-in, is left off the list, and the brief
  names it under "Do not open".
- **Handed:** `<package>/02-intent.md`, the intent. Of the approved design: `prototype/`, `PARTS.md`
  for the changes to the system, and `tokens.css`. What the project says of its design system. The
  component source: the folder
  the project profile names under `components`. The files of the build its brief lists. The results.
  What the builder wrote back.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/08-acceptance/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`: each part is the system's own, used as the system uses it, and
  nothing of the prototype's markup was pasted in.

### `judge.profile`

One for each profession's profile the cast sheet's "Acceptance" table loads into this seat, as
`profile.<name>`.

- **Its brief,** from `templates/briefs/judge.md`, as the usability judge's.
- **Handed:** its profession's profile, whole, by the path the cast sheet's carry list names.
  `<package>/02-intent.md`, the intent. The pictures of the build. Of the approved design:
  `strings.json`.
- **Do not open:** the list above: the audience's read is in it, and so is the ledger of another
  profile judge. And the build itself, its files, the results and what the builder wrote back: it
  reads the build as pictures.
- **Writes:** its ledger, `<package>/08-acceptance/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`: `judge.profile-<name>.md`, so that two profile judges never share
  a file.

## The audience

One read, after the judges: the task reader the cast sheet's "Acceptance" table seats, as the person
its line is loaded with, `person.<name>`. Where the table seats none, nobody reads as her, and the
report says so.

### `audience.task-reader`

- **Its brief,** from `templates/briefs/audience.md`: who she is, her language and her width, the
  product as she would know it, and her tasks, copied word for word from "Tasks for the audience" of
  the intent. It says the pictures are of one build, in the states she would meet.
- **Handed:** her card, by the path the cast sheet's carry list names, or, for a person of the kit,
  who has no line there, in the kit's `pool/persons/`, by the id her line of the table gives. Her
  profession's traits: a copy of her profession's profile with every `So the interface must:` field
  removed, written beside the brief as the loop says, and the one file of `<package>/work/` she
  opens. And the pictures of the build in her language at her width, each by its path, as
  `<package>/08-acceptance/shots/today-default-en-390-light.png`. The pictures, and pictures only.
- **Do not open:** the list above, and with it: `<package>/02-intent.md`, and every other file of
  the package; `<package>/07-handoff/`, the handoff folder, whole; `<package>/build/`, and the build
  itself, running or as source; her profession's profile itself; the results, and every other file
  of `<package>/08-acceptance/` but the pictures it is handed. A person cannot find a control by
  reading markup.
- **Writes:** one task read, `<package>/08-acceptance/reads/<seat>.md`, in the shape of
  `templates/outputs/TASK-READ.md`: `audience.task-reader-<name>-<language>.md`. With one build to
  read, its ranking reads "no ranking: one option", and its stuck points are what the report takes.
