# The loop every stage runs

Nine steps, the same at every stage. The stage's own skill says what is read, written and decided there.
This page says how each step is done.

`<kit root>` is the kit's folder, two directories above the conductor's own. `<package>` is the folder of
the design. `<stage>` is one of `frame`, `context`, `intent`, `cast`, `structure`, `detail`, `look`,
`handoff`, `acceptance`. Every command is run from the project's root.

## 1. Check the state

```
node <kit root>/scripts/state.mjs validate <package>
node <kit root>/scripts/state.mjs next <package>
```

A stale or changed artefact goes to the founder before anything else, as the conductor's "Before a
stage" says. When `next` names this stage, mark it in work:

```
node <kit root>/scripts/state.mjs begin <package> <stage>
```

Two stages are not begun this way:

- **Frame, on a new design.** There is no package yet. Frame makes it first, with `init`
  (`references/routes.md`), and only then begins.
- **A stage that is awaiting the founder.** Its output is already in front of him, and `begin` would
  put it back in work and its header back to draft. Put its open question to him again. On his answer,
  go on from step 8, without `begin`.

The script refuses a stage the route skips, and one that is already approved. It keeps `STATE.md`, in the
package, as the page `node <kit root>/scripts/state.mjs status <package>` prints: every stage with its
mode on the route (full, short, skipped) and its status (not-started, in-work, awaiting, approved,
skipped, stale), and the one open question.

## 2. Read the package, not the chat

Read two things, and nothing else:

- the output of the stage before this one on the route: the file the state names for it;
- what that output's `## Carry` list names. An entry is `- <stage>@<version>#<heading-slug>`, a
  section of an earlier approved output, or `- source:<path>`, a file of the project.

**The carry list is a ceiling, not a reading list.** Of what it names, open what this stage uses:
nothing else is open to it, and an entry this stage has no use for stays closed. A section entry is read
under its heading only. Where a stage's skill says "exactly what its carry list names", it means this.

Never the chat, never the package's `work/` folder, never an option that was not chosen. If what the
stage needs is in none of these, it is missing from the package: say so, and ask to go back (the
conductor's "Resuming"). Do not supply it from the conversation.

Acceptance alone reads otherwise: it runs in a session of its own, after the build, and reads the
handoff folder, what the build wrote back, and, of the package, only the cast sheet's "Acceptance"
table with the lines for the person and her profession's profile that it names, the intent's tasks for
the audience, and the last entry of the package's `DECISIONS.md`, to number its own. It may reopen and
stamp Handoff for a deviation he accepts, and a correction is the one case where the session that
conducts accepts its own change.

## 3. Write what the stage writes

Each stage's output starts from its template under `templates/package/`, as
`templates/package/02-intent.md`. Its header is the state script's. You write one line of it:

- `built-from`: each stage this output is built from, with its version, as `[intent@1]`. It always names
  the stage before this one on the route, and the script refuses a stamp without it. Frame alone is built
  from nothing, and keeps `[]`.
- `stage`, `version` and `status` stay as the template has them. The script writes the version, the
  status and the approval.

From Frame to Look, the output ends with its carry list, `## Carry`: what the next stage may open
besides this output, in the two forms of entry given above, and nothing else under that heading. The
slug of a heading is printed by:

```
node <kit root>/scripts/state.mjs slug "<heading text>"
```

## 4. Makers

Where makers sit, each gets a brief built from `templates/briefs/maker.md`. A brief gives **context,
never the design**: who she is and her moment, the job, the tasks, what the product can show and do. It
holds no component, no layout and no idea of yours. What a brief may not contain is listed in
`references/blind.md`.

- **The founder reads the Structure brief before it goes out, always, and every fresh brief, at
  Structure or at Look:** either may leave the machine. Nothing is sent before his yes, to a sub-agent
  or off the machine. At the other stages a seat's brief is built from approved artefacts, and he reads
  it when he asks.
- Start the makers of a stage in one message, each as a fresh sub-agent ("Starting a seat", below). No
  maker sees another's work.
- Where several makers answer one brief, their proposals are merged blind before anyone reads them:
  `references/blind.md`.

## 5. Judges and audiences

Each is a fresh sub-agent with a brief of its own, built from `templates/briefs/judge.md` for a judge and
from `templates/briefs/audience.md` for an audience. A judge is told what to read, never what to find.
What it reads is named by its letter or by what it is, never by who made it.

- **A judge never makes, and a maker never judges.** A judge reports. It does not fix, redraw or approve.
- **Each judge is blind to the others' ledgers,** to the makers' notes and to the author map. Where two
  profile judges sit, each with a profession's profile of its own, each is blind to the other's ledger
  too. Start the judges of a stage in one message, so that no ledger exists while another judge reads.
- **A seat is handed what its brief template gives it, and no more.** Where that is a profession's
  profile, a maker or a judge is handed it whole, and an audience only its traits. A describer and a
  fresh maker are handed neither the person nor her profession's profile, unless the template says so:
  what bears on the design is already written into the brief they answer.
- **An audience is handed the traits of her profession's profile, never the whole of it.** Its brief
  gives the person (her card), where she starts and what she wants, and pictures. Where she has a
  profession's profile, write a copy of it beside the brief with every `So the interface must:` field
  removed, and hand her that copy. The kit's card script, `scripts/card.mjs`, makes the copy, by its
  `traits` verb, from her profession's profile, at the path given after `--out`:

  ```
  node <kit root>/scripts/card.mjs traits <profile> --out <file>
  ```

  It takes out each field, from its label to the next blank line, with each paragraph of the
  opening that speaks of the fields. It refuses a profession's profile that fails its check, and a
  copy in which the words "so the interface must" are still written: then nothing is written, and
  what it printed goes to the founder. The copy is never made by hand. List her profession's profile
  itself under "Do not open", with the intent.
- **A seat handed more pictures than one read opens is told which come first:** those its checks, or
  her tasks, need, by name. What it did not open, it lists. At Structure, an audience's brief also says
  which pictures show the first screen only, as she meets it before any scrolling, and which the whole
  page.
- **A first screen is pictured at Structure only.** From Detail on, "without scrolling" is answered by
  a check, and never by reading a picture: the `in-viewport` type of the acceptance script,
  `scripts/accept.mjs`. Look adds one to its checks for each success criterion that says it, and
  Handoff takes it over. From Detail on a judge's brief points to that check, and an audience's brief
  says nothing of first screens.
- **Make the stage's `reads/` folder before you start its readers.** A seat writes its own file there,
  and never lists the folder: the names in it say who else read.

### Starting a seat

- **A fresh sub-agent.** Start it with the Agent tool, type `general-purpose`, from the project's root
  directory. A seat never continues an earlier agent, and never sits in your own context.
- **From a brief that names files.** Write the brief from its template, as a file in the package's
  `work/` folder unless the stage's skill names another place, and start the seat with it, whole. Its
  name is `<stage>-<seat>-brief.md`: `<seat>` is the seat's id, with what it is loaded with where two
  instances share an id, as `detail-audience.task-reader-<name>-<language>-brief.md`, and `-reread`
  or `-fix` after it for a seat started again. The brief names the seat's card by its absolute path
  and says to read it first. It names each file the seat may read, by its absolute path, and what the
  seat must not open. Never paste a card or an artefact into a brief: name the file.
- **Model and effort.** Start the seat on the model and the effort its line of the approved cast sheet
  names: `03-cast.md` in the package, the columns "Model" and "Effort". They hold the cards' suggestions
  until he changes one, the cast sheet is the founder's, and he may have changed any of them at Cast:
  follow the sheet, not the card. A seat whose line shows a dash runs on the session's model. Nothing in
  the conductor enforces a model: when one the sheet names cannot be had, say so and ask him.
- **A shared machine.** Other sessions work on this machine. A seat that may start a browser stops only
  a browser it started itself, through its own handle, and never stops a process by name or by pattern.
  The brief templates carry this line: leave it in. And you never have more than three browser-driving
  seats or scripts running at once. That limit wins over "in one message": seats that drive a browser
  are started three at a time, the others in one message.

### Several ledgers, one stage

Each judge writes a ledger, and each audience a task read. You do three things with them, and no more:

1. Lay the findings side by side for the founder, each under its seat.
2. Where two seats disagree, say so, each in their own words.
3. Stop there. You never average them nor settle a disagreement yourself: a split between two seats is
   a finding, and he settles it.

## 6. Pick, or approve

A gate is one of two kinds, and the stage's skill says which.

- **He picks.** Every option goes in front of him, with the reads beside the options. Nothing is
  shortlisted and no option is mended first: he picks from what the makers made. At a pick, a finding
  marked `blocks` stays in its seat's line beside its option: nothing is mended, and nothing read again.
- **He approves.** The findings a judge marked `blocks` are fixed first, then read again. Only those:
  a `should` or a `note` is never mended before the gate, by a maker or by you, however small the fix
  and even on a page that is yours to write. It goes to him open.

**One fix round and one re-read,** and no more:

1. Send the blocking findings to a maker: a fresh sub-agent in the seat whose work they are on, handed
   the findings and the artefact.
2. A fresh judge in the same seat reads the artefact again. Its brief says it is a re-read, and names
   that seat's earlier ledger, to be opened only after it has read the artefact cold. It marks each
   earlier finding *fixed*, *partly* or *still present*.
3. What is still open goes to the founder with the gate, as open findings, with a recommendation.

**What he has accepted is part of what was approved.** A breach of a standing rule or of the intent
that he accepts as a cost is written under "Accepted deviations" of the stage's output: what it is,
what it breaks, his words, the day. That section is carried on, and handed to every judge from that
stage on as part of what was approved, never to an audience. A judge that still finds it writes it
once, as "accepted at" and the stage: it goes to no fix round and does not count as blocking. In the
decision's data it goes under `findings` with that stage in `accepted`, as `"accepted": "detail"`,
and the page lists it under a heading of its own, "Accepted deviations", apart from the open
findings. Where only a part of a finding rests on an accepted deviation, split it into its parts,
each quoted in the judge's words: the rest stands as it was marked. At the stamp, the decision you
append names each accepted deviation.

## 7. The decision page

At Frame, Context, Intent and Cast the gate is an approval of the stage's own output: that output is
what he reads, and no page is built. Any other decision goes to the founder as one page, built from a
small data file:

```
node <kit root>/scripts/page.mjs <decision.json> --out <decision.html>
```

- Write the data in the shape of `templates/outputs/decision.json`, a pick among options, or of
  `templates/outputs/decision-approve.json`, an approval with the findings that stayed open.
- The page opens with the identity line: *design · kind · size · stage n of m*. Then the options as
  pictures, one line for each seat, the open findings when there are any, the accepted deviations
  under a heading of their own, "Accepted deviations", when there are any, one recommendation with
  one sentence of reason, and last the question.
- **The page's question is the only question on it.** The script refuses data that asks two: it
  counts the question marks of the question and of the recommendation's reason, and no others. A
  seat's line or a finding may quote a question she asks, as it was written.
- Each picture is named by its path from the page's folder, and must be there: the script refuses a
  picture it does not find.
- You recommend, and never decide: one option, one sentence, resting on the reads. Where the seats
  rank the options differently it is one recommendation still, and its reason says that they rank
  them differently and that he settles it.

One question about one thing at a time, on a page and in the chat. **A list is one thing.** A list a
maker or a reader returns (dependencies; states the intent does not name; what the structure cannot
hold; facts a string waits for; items nobody decided; deviations) is put to him as one question: the
entries numbered, each with what follows from each answer, answered by number in one message, with
one `await`. An entry he leaves unanswered stays open, and is listed so. It goes under `findings`
on the stage's decision page, as open, and the gate's question names it. What step 8 catches, an
answer that meets a standing rule, a fact of the product or an output he approved, is still asked on
its own, at once.

When the stage's output is in front of him, record the question, so that a session resuming tomorrow
asks the same one:

```
node <kit root>/scripts/state.mjs await <package> <stage> --question "<the one question>"
```

The script needs the stage's output to exist, with its header. **`await` writes that header,** as
`begin` and the stamp do: read the file again before you edit it, and of the header write `built-from`
only. A file written whole from what you held before `await` puts the old header back.

Frame is the one stage with no `await`. It writes nothing before his yes, so there is no output to
record a question on: a session that resumes and finds no package frames the request again.

## 8. His answer, in the artefact

Write what he said into the stage's output, under `## Reviewed by the founder`, in his words, before the
stamp. Until it is there, it does not count.

His notes are calibration, not orders. Where a note meets a rule or a fact of the product (a standing
rule of the project profile, something the product cannot do, an output he approved earlier), say so at
once, with the source, and offer the true version. Then he decides.

## 9. Stamp

1. Write the carry list.
2. Stamp the output, in the words he approved it with, as he said them:

   ```
   node <kit root>/scripts/state.mjs stamp <package> <stage> --words "<the founder's words>"
   ```

   The script marks it approved, closes the open question and writes `STATE.md` again. It refuses an
   output that does not name the stage before it in `built-from`, one built on a stale input, and a
   carry list that names what is not there. Mend what it names. Never work around a refusal.
3. Append the decision to the package's `DECISIONS.md`, in the shape of `templates/package/DECISIONS.md`:
   the decision, why, what was rejected, the cost accepted, what it forces on the build. An entry is
   appended, never edited.
4. Ask `next` again, and go to the stage it names.

An output he has not approved in words is not stamped. "Looks fine, go on" is an approval, and those are
the words. Silence is not.
