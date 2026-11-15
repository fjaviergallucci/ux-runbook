# The seats at Look: what each is handed, and what it does not open

One section for each seat of the kit whose card sits at Look. A brief hands a seat what its card's
`reads` allows and this page lists, each file by its absolute path, and lists under "Do not open" what
its card's `never-reads` names, as this package holds it. Nothing is pasted into a brief but the
founder's own words, where a brief template asks for them as he said them. How a seat is started, on
which model, and the rules of a shared machine are in `skills/design/references/loop.md`, under
"Starting a seat". Every brief is written into `<package>/work/`, and keeps the template's last line:
a seat that starts a browser stops only the one it started.

A card of the project's own that the cast sheet seats here is handed what its header's `reads`
allows, by the same rule.

Four names are used below, besides `<tokens>`, the project's token file as the skill gives it:

- `<chosen>` is the chosen proposal's file, as the carry list names it.
- "The states and the rules" are `<package>/05-detail/states.md`, and `<package>/05-detail/DETAIL.md`
  for the rules, the edge cases, the data map and the dependencies.
- "The final screens" are `<package>/06-look/screens/`, the pages, and `<package>/06-look/measures.md`,
  the table of measured values and the named extensions; with variants, `<package>/06-look/variants/`
  too.
- "What the project says of its design system" is the documents that "Design system" of the project
  profile names, each by its path. A seat is handed those files, and never the project profile.

## The makers

### `maker.visual-designer`

- **Its brief,** from `templates/briefs/maker.md`, gives three things. Its lens: the skill its line
  of the cast sheet names as its engine, to load if it is installed; inside a design system it
  shapes hierarchy and emphasis, not the palette. Whether motion is cast, as the sheet's "Look"
  table says. And what the founder marked in a fresh gallery at Structure: his marks as he said
  them, copied word for word from the package's `DECISIONS.md`, each with what on the screen it was
  about, or "Nothing marked".
- **Handed:** `<chosen>`. The states and the rules. `<package>/05-detail/strings.json`, the strings.
  `<package>/05-detail/prototype/`, the pages and the stable ids on them. `<tokens>`. What the
  project says of its design system. For each of his marks, its picture, where the carry list names
  one. And the two lines the maker's brief template keeps for them: her card, by the path the carry
  list names, and her profession's profile, whole. A fresh maker is handed neither.
- **Do not open:** its card closes nothing, and four things are kept from it all the same.
  `<package>/work/`, but its own brief. `<package>/06-look/reads/`, but the ledgers a fix round
  hands it. `<package>/04-structure/earlier/`. And, until he has said what he borrows,
  `<package>/06-look/fresh/` and `<package>/06-look/BRIEF-fresh.md`: the system version is drawn
  without sight of the fresh one.
- **Writes:** in `<package>/06-look/`: `screens/`, the final screens; `variants/`, when there are
  any; `checks.json`; and `measures.md`, under the two headings "Measured values" and "Named
  extensions", each in the shape `templates/package/06-look/LOOK.md` gives it. The pictures and the
  results of its own check go in `<package>/work/look-check/`: those of record are yours to take,
  in step 5 of the skill.
- **Variants are photographed, measured and read like the screens.** A variant's page is named for
  its screen and its variant, as `today-default-en-compact.html`, so that no picture of one takes a
  screen's name; `variants/` holds a `checks.json` of its own; and each variant has its rows in
  `measures.md`, which name it. In step 5 of the skill, with variants, two more commands follow the
  two, one after the other:

  ```
  node <kit root>/scripts/shots.mjs <package>/06-look/variants --out <package>/06-look/shots --widths <primary>,<phone> --themes <themes>
  node <kit root>/scripts/accept.mjs prototype <package>/06-look/variants/checks.json --root <package>/06-look/variants --out <package>/06-look/variants/results.json
  ```
- **It drives a browser,** and counts among the three.
- **What it could not draw as approved** is in its reply: a string that does not fit, a state with
  no room. It goes to the founder with the gate, open: a string is the interface writer's, and
  Detail's to reopen. You change none.
- **When it is started again,** for a fix round, a variant he picked, a correction of his or a
  thing he borrows, it is a fresh sub-agent with the same hand-over, the screens as they stand, and
  what it is started for: the ledgers that hold its findings, each by its path with the findings'
  numbers, or his words as he said them. For a thing he borrows it is also handed the fresh screen
  he marked it on, to understand what he liked: it copies none of its code or its values.
- **Cast for a direction,** it has no token file and no design system to read:
  `references/direction.md`.

### `maker.screen-generator`

At Look it sits only inside a fresh pass, and chooses only the paint.

- **Handed:** `<package>/06-look/BRIEF-fresh.md`, alone. Its brief names the folder it writes into.
- **Do not open:** the design system and `<tokens>`; the project's kit, `<kit dir>`, and the kit's
  own; today's screens and the sibling surfaces, as pictures or as source;
  `<package>/06-look/screens/`, `<package>/06-look/variants/` and `<package>/06-look/shots/`;
  `<package>/05-detail/prototype/` and `<package>/05-detail/shots/`, which wear the shared kit;
  another fresh maker's files; `<package>/work/`; everything else in the package. Its brief holds no
  idea of yours. If any of this reaches the seat, its work is no longer fresh: say so, and start the
  seat again, clean.
- **Writes:** in `<package>/06-look/fresh/`: the screen as it came, its picture, and the prompt that
  made it. Its reply lists every difference between the screen and the brief.
- **It drives a browser** for its picture, and counts among the three.

### `maker.outside-describer`

No sub-agent sits here. You run the command `references/fresh.md` gives, once for each line of the
cast sheet that names this seat for Look, with the provider and the model id of that line.
Its card, `pool/makers/outside-describer.md`, speaks to you: read it before the first run.

- **Handed:** `<package>/06-look/BRIEF-fresh.md`, the fresh brief he approved, whole and unchanged.
  The script sends that one file. Add nothing to it: no opening line, no example.
- **Do not open:** nothing else can reach it, since nothing else is sent: no other proposal, no
  idea of yours, nothing of today's screen, of the design system, of the project's kit or of the
  sibling surfaces. Keep all of it out of the brief.
- **Writes:** `<package>/06-look/fresh/<name>.html`: the answer, whole, as it came.

## The readers

The readers are started once the screens are photographed and measured: in one message, so that no
ledger exists while another judge reads, and those that drive a browser three at a time at most.
What each reads is named by what it is, never by who made it.

`<seat>`, in the name of a reader's file, is the seat's id, and a seat that is loaded adds what it is
loaded with, so that no two readers share a file: `judge.visual-craft`, `judge.profile-<name>` for
each profession's profile, `audience.task-reader-<name>`.

Three seats read twice when a fresh pass ran, each time as a fresh sub-agent: the truth judge and the
profile judge read the beside comparison first, and the system fidelity judge writes the borrow list
first, as `references/fresh.md` gives them. What this page gives is the main read, of step 7 of the
skill. Every reader's brief lists these under "Do not open":

- `<package>/work/`, where the makers' briefs and replies are;
- `<package>/04-structure/MAP.sealed.json`, the author map, and `<package>/04-structure/CHOSEN.md`,
  which names who made which letter;
- `<package>/03-cast.md`, the cast sheet: it holds each maker's lens and engine;
- every file of `<package>/06-look/reads/` but its own, with `<package>/05-detail/reads/` and
  `<package>/04-structure/reads/`. Its seat's read of the beside comparison, `<seat>-beside.md`,
  and the borrow list are not its own: a main read opens neither;
- `<package>/06-look/LOOK.md`, `<package>/06-look/decision.json`, `<package>/06-look/decision.html`,
  `<package>/06-look/beside.json`, `<package>/06-look/beside.html`, `<package>/06-look/borrow.json`
  and `<package>/06-look/borrow.html`, which sum up what the other seats said;
- `<package>/06-look/BRIEF-fresh.md`, and the prompt kept beside a fresh screen;
- `<package>/04-structure/earlier/`, and the board and the proposals folder beside it, but
  `<chosen>` where a seat is handed it.

**On a re-read** the brief is the first read's, and says so. It names one file more: that seat's
earlier ledger, the one file of `<package>/06-look/reads/` it opens besides its own, and only after
it has read cold and written its findings. It writes its first read's name with `-reread` before
`.md`, as `judge.visual-craft-reread.md` or `judge.profile-<name>-reread.md`, beside the first read
and never over it.

### `judge.visual-craft`

- **Its brief,** from `templates/briefs/judge.md`: the final screens, with their widths, their
  themes and their languages; the cut of its optional checks, on and off, as its line of the cast
  sheet has it; and its lens, the skill its line names as its engine.
- **Handed:** `<package>/02-intent.md`, the intent. The final screens. `<package>/06-look/shots/`,
  the pictures at every width and in every theme. `<tokens>`. What the project says of its design
  system.
- **Do not open:** the list above. Today's screens are Context's read, and nobody's here.
- **Writes:** its ledger, `<package>/06-look/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.system-fidelity`

- **Its brief,** from `templates/briefs/judge.md`, as the visual craft judge's, without a lens.
- **Handed:** `<package>/02-intent.md`, the intent. The final screens. `<tokens>`. What the project
  says of its design system. The component source: the folder the project profile names under
  `components`. The sibling surfaces, by the paths the carry list names for them. And, after a
  fresh pass, what he marked in it, as he said it, with the fresh screen each mark is on, by its
  path: it checks what was rebuilt against them.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/06-look/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.accessibility`

- **Its brief,** from `templates/briefs/judge.md`, as the visual craft judge's, without a lens. It
  says the screens are drawn in their final colours and sizes: at Look its measured checks run.
- **Handed:** `<package>/02-intent.md`, the intent. The states and the rules, for the focus order
  and the keyboard. The final screens, as source. `<package>/06-look/shots/`, the pictures.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/06-look/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.
- **It drives a browser** for what it measures, and counts among the three.

### `judge.truth`

It reads at Look where the cast sheet seats it: always on a public page, and with a fresh pass. It
looks for what Look could have added that the approved detail did not hold.

- **Its brief,** from `templates/briefs/judge.md`, as the visual craft judge's, without a lens.
- **Handed:** `<package>/01-context.md`, the context, for the inventory. `<package>/02-intent.md`,
  the intent. The project's facts document, where the project profile names one under `facts`.
  `<chosen>`. The states and the rules. `<package>/05-detail/strings.json`, the strings.
  `<package>/05-detail/prototype/`, the approved pages. The final screens.
  `<package>/06-look/shots/`, the pictures.
- **Do not open:** the list above.
- **Writes:** its ledger, `<package>/06-look/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`.

### `judge.profile`

One for each profession's profile the cast sheet loads into this seat at Look, as `profile.<name>`.
It sits here only when a criterion that fires is about legibility or about where she uses it, and
with a fresh pass, to rank the two.

- **Its brief,** from `templates/briefs/judge.md`, as the visual craft judge's, without a lens.
- **Handed:** its profession's profile, whole, by the path the carry list names.
  `<package>/02-intent.md`, the intent. `<package>/06-look/shots/`, the pictures.
  `<package>/05-detail/strings.json`, the strings.
- **Do not open:** the list above: an audience's read is in it, and so is the ledger of another
  profile judge. And the pages themselves: it reads the screens as pictures.
- **Writes:** its ledger, `<package>/06-look/reads/<seat>.md`, in the shape of
  `templates/outputs/LEDGER.md`: `judge.profile-<name>.md`, so that two profile judges never share
  a file, in a first read or in a re-read.

### `audience.task-reader`

At Look it sits only with a fresh pass, once, as the primary person, `person.<name>`: it reads the
beside comparison, and nothing else of the stage.

- **Its brief,** from `templates/briefs/audience.md`: who she is, her language and her width, and her
  tasks, copied word for word from "Tasks for the audience" of the intent. It says that the options
  are versions of one screen, each under a letter, and asks her to rank them.
- **Handed:** her card. Her profession's traits: a copy of her profession's profile with every
  `So the interface must:` field removed, written beside the brief as the loop says, and the one
  file of `<package>/work/` she opens. And the pictures in `<package>/06-look/beside/`, each by its
  path, as `<package>/06-look/beside/A.png`. The pictures, and pictures only.
- **Do not open:** the list above, and with it: `<package>/02-intent.md`, and every other file of
  the package; her profession's profile itself; `<package>/06-look/screens/`,
  `<package>/06-look/shots/` and `<package>/06-look/fresh/`, which say which version is which;
  `<package>/06-look/BESIDE.sealed.json`; everything in `<package>/04-structure/`;
  `<package>/05-detail/prototype/`,
  `<package>/05-detail/states.md`, `<package>/05-detail/DETAIL.md` and
  `<package>/05-detail/strings.json`. A person cannot find a control by reading markup.
- **Writes:** one task read, `<package>/06-look/reads/<seat>-beside.md`, in the shape of
  `templates/outputs/TASK-READ.md`, with her ranking of the letters:
  `audience.task-reader-<name>-beside.md`.
