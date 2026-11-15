# The fresh pass at Look

What a fresh pass is, what a fresh maker is and is not given, and its three outcomes are the
conductor's: `skills/design/references/fresh-pass.md`. This page says how one is run at Look. It runs
when "Fresh pass" of the cast sheet says so for Look, or when the founder asks for one at Look's
decision page. You never add one yourself.

`<kit root>`, `<packages>`, `<package>` and `<tokens>` are as the skill gives them, and every command
is run from the project's root.

## 1. The one screen

At Look a fresh pass is one screen, in one state, and it is a screen the visual designer is drawing
too: the two are compared on the same content.

- **Which one:** the screen that carries the idea. That is the screen of the chosen structure where
  the one job gets done, the one that holds its primary action, in its `default` state, in the
  product's main language. The brief names it, and he may name another when he reads it.
- **Nothing else is drawn fresh:** no second state, no other screen, never the flow.

## 2. The fresh brief

Write `<package>/06-look/BRIEF-fresh.md` from `templates/package/04-structure/BRIEF-fresh.md`, in its
Look form: keep "The one screen" and the "What to return" after it, and delete the Structure form, as
the template's first lines say.

- **"The person", "The job", "The tasks":** from the intent. **"What the product can show and do":**
  the context's inventory. **"Language and device":** the main language, and the two widths.
- **"The one screen":** its title, and what it is for; its state, as its row of
  `<package>/05-detail/states.md` has it; and its items in order, from the chosen proposal's file,
  each with its string exactly as `<package>/05-detail/strings.json` has it in that language. Copy
  the words: retype none, shorten none, add none.
- **Nothing of how the product looks.** Not the design system, `<tokens>`, the shared kit, today's
  screens or the sibling surfaces; no colour, no typeface, no component and no layout word. Read it
  sentence by sentence, as "Context, never the design" in `skills/design/references/blind.md` says.

So a fresh maker draws that screen, with those words exactly, and chooses only the paint.

## 3. Stop: the founder reads it

Put the brief in front of him whole. Say in the same message which seats would send it off this
machine, each with its provider: every `maker.outside-describer` line, `model:openai` or
`model:gemini`, and a `maker.screen-generator` on `tool:stitch`. One question, about one thing: may
this brief go out as it is? Record it with the `await` of the skill's gate. **Nothing is sent before
his yes: not to a sub-agent, and not off the machine.** Write what he changes into the brief, then
his yes under `## Reviewed by the founder` of `LOOK.md`, as he said it, with the seats that send it
out, and put the stage back in work with the `begin` of step 1 of the skill. A seat he holds back
does not run. A provider that `engines-on` of the project profile does not list gets nothing, and
you turn no engine on: without its tool, the screen generator's seat is taken by a Claude maker, as
its card says, and its brief says the tool is off.

- **Until `LOOK.md` holds his yes to this brief, no fresh maker is started.** A session that resumes
  and finds `BRIEF-fresh.md` with no yes to it written there is at this stop: it puts the brief to
  him again, whole, and sends nothing.
- **A fresh pass he asked for at the gate has no line on the cast sheet.** Then each of its seats,
  the makers of step 4 and the readers of step 6, runs on the model and the effort its card
  suggests. Say so to him at this stop, seat by seat: he may name another.

## 4. The fresh makers

After his yes, and never before. They may run while the visual designer of step 4 of the skill
draws: neither sees the other's work. What each is handed is in `references/seats.md`.

- **`maker.screen-generator`** is a fresh sub-agent, handed the fresh brief alone, and its own brief
  says whether its tool is on, as `references/seats.md` gives it. It keeps its screen as it came in
  `<package>/06-look/fresh/`, with its picture and the prompt that made it.
- **`maker.outside-describer`** is no sub-agent: you run it, once for each of its lines, on the
  brief he approved. These six flags and nothing else, since the script finds its key itself:

  ```
  node <kit root>/scripts/describe.mjs --text --provider <openai|gemini> --model <id> --brief <package>/06-look/BRIEF-fresh.md --out <package>/06-look/fresh/<name>.html --profile <packages>/PROFILE.md
  ```

  `<id>` is `openai-model` or `gemini-model` of the project profile, and `<name>` the seat's line of
  the cast sheet, made unique, as `outside-openai`. With `--text` the answer is not a proposal: the
  script looks for none, writes the answer whole, as it came, to `--out`, and exits 0. A refusal
  leaves nothing: tell the founder what the script printed, as it printed it, and try once more
  only after a timeout. Never look for the reason in a file of keys or in the environment.
- **An outside answer is photographed as it came,** at the primary width. The screen generator
  takes its own picture:

  ```
  node <kit root>/scripts/shots.mjs <package>/06-look/fresh/<name>.html --out <package>/06-look/fresh --widths <primary> --allow-errors
  ```
- **Everything in `<package>/06-look/fresh/` stays as it came.** You mend nothing: not a label, not
  a mark left around the page. An answer that is no page is kept too: it gets no letter, and the
  page of step 8 says that its seat returned no screen.

## 5. The letters

Once step 5 of the skill has photographed the system version. The versions of the one screen are
compared blind: the system's picture, from `<package>/06-look/shots/`, and each fresh screen's, from
`<package>/06-look/fresh/`, at the primary width. Their names say which is which, and which engine
made it, so nobody reads them there. The kit deals them letters:

```
node <kit root>/scripts/deal.mjs <package>/06-look/shots/<page>-<primary>-light.png <package>/06-look/fresh/<name>-<primary>-light.png --out <package>/06-look/beside
```

Name every version's picture, in any order. The script shuffles them itself and copies each into
`<package>/06-look/beside/` under its letter, as `<package>/06-look/beside/A.png`, all with one
time on them, so that neither a name, a time nor the order of the files says which is which. It
writes that into `<package>/06-look/BESIDE.sealed.json`, beside the folder, and prints how many it
dealt and the letters, nothing else. It checks everything before it writes, and refuses a `beside/`
that is already there: letters are dealt once. **Until his first answer is written, the sealed file
is not opened, printed, searched or copied,** with any tool, and you do not work out a letter by
setting two pictures side by side.

## 6. The readers of the two

The seats the cast sheet's "Look" table says read the beside comparison: the truth judge, the profile
judge for each profession's profile, and one task reader. Each is a fresh sub-agent on what its line
names, started in one message, from a brief of its shelf's template.

- **Of `<package>/06-look/`, each is handed `<package>/06-look/beside/` and nothing else:** the
  pictures, by letter. Its brief says the letters are versions of one screen, and never which is
  the system's. What its section of `references/seats.md` hands it from outside
  `<package>/06-look/` still holds. What that section hands it of `<package>/06-look/` does not:
  that is its main read's.
- **Do not open, for this read:** `<package>/06-look/BESIDE.sealed.json`, `<package>/06-look/fresh/`,
  `<package>/06-look/shots/` and `<package>/06-look/screens/`, with the list `references/seats.md`
  gives every reader.
- **The truth judge** flags, by letter, anything the product cannot do: an element, a label or a
  promise that neither the context's inventory nor the approved strings hold. It is handed
  `<package>/01-context.md` and `<package>/05-detail/strings.json` to hold the pictures to.
- **The profile judge and the task reader rank the letters,** best first, with the size of each gap.
- **Each writes `<package>/06-look/reads/<seat>-beside.md`,** a ledger or a task read. That file is
  closed to the main read of step 7 of the skill.

## 7. The first question: what he would keep

Write `<package>/06-look/beside.json` in the shape of `templates/outputs/decision.json`, and build it:

```
node <kit root>/scripts/page.mjs <package>/06-look/beside.json --out <package>/06-look/beside.html
```

- **The options are the letters,** in their order, each with its picture named from the page, as
  `beside/A.png`. No title and no line says which is the system's: he is as blind as the readers
  were.
- **One line for each seat,** by letter; **one recommendation,** resting on the reads; and **one
  question:** what would you keep from each of these?

Put the page in front of him, and record the question with the `await` of the skill's gate. **Stop.**
Write what he marks, letter by letter, as he said it, under "Fresh pass" of `LOOK.md`, and put the
stage back in work with the `begin` of step 1 of the skill. **Only now is the sealed file opened,**
and only this way:

```
node <kit root>/scripts/deal.mjs open <package>/06-look/beside
```

It prints each letter with its source. Write beside each mark which version it is on. If nothing he
marked is on a fresh screen, the outcome is the first of step 9, and no second question is asked.

## 8. The second question: what is borrowed

He chooses with the cost in front of him.

- **The system fidelity judge writes the borrow list first.** A fresh sub-agent on what its line of
  the cast sheet names, handed what `references/seats.md` gives its seat, his marks as he said
  them, and the fresh screen each mark is on. Its brief says this read is the borrow list alone:
  for each thing he marked, what the system has for it, and what it lacks, a token, a part, a
  pattern or nothing. It writes `<package>/06-look/reads/judge.system-fidelity-borrow.md`.
- **Then the page,** `<package>/06-look/borrow.json`, in the shape of
  `templates/outputs/decision.json`, built once the sealed file is opened and by what each version
  is: "The system version" first, then each fresh screen as it came, titled "Fresh" with its maker's
  line on the cast sheet, as "Fresh: outside-openai". The pictures are named from the page, as
  `shots/today-default-en-1280-light.png` and `fresh/outside-openai-1280-light.png`.
- **This page's letters are not the beside letters.** The page letters its options in its own
  order, so the system version may be A here and have been B there. Every line carried onto it that
  was written by letter, his marks, the readers' lines and the truth judge's flags, is rewritten
  through the sealed file to name the version, with its beside letter after it, as "the system
  version (was B)". No line of this page names a beside letter alone.

  ```
  node <kit root>/scripts/page.mjs <package>/06-look/borrow.json --out <package>/06-look/borrow.html
  ```
- **The cost of each thing is on the page:** under `findings`, by seat, one line of the borrow list
  for each thing he marked; what the truth judge flagged; each difference a fresh maker's reply
  lists between its screen and the brief; and a seat that did not answer or was held back.
- **The cost of the third outcome is on the page before he chooses:** the line of each fresh option
  says that taking it whole is a change of direction for this surface: Look runs again as a
  direction, and the screens drawn on the system are set aside.
- **One recommendation,** resting on the reads, and **one question:** which is it: nothing to
  borrow, named things to borrow, or the fresh concept as a whole?

Put the page in front of him, and record the question with the `await` of the skill's gate. **Stop:
you borrow nothing, and you go no further without his words.**

## 9. The three outcomes

Write his answer under "Fresh pass" of `LOOK.md` and under `## Reviewed by the founder`, as he said
it, and put the stage back in work with the `begin` of step 1 of the skill. There are three
outcomes, and no fourth: "a bit of both" names nothing. Ask him for the things, by name.

1. **Nothing to borrow.** The system version stands, and `<package>/06-look/fresh/` stays in the
   record. Go on to step 7 of the skill.
2. **Borrow named things.** Each thing he names goes to a fresh visual designer, handed his words,
   the fresh screen each is on, and the screens as they stand. It rebuilds each on `<tokens>`, and
   copies none of the fresh screen's code or its values. **What the system lacks enters as a named
   extension of the system:** its name; what it is, a token, a part or a pattern; its values beside
   the system's own; where it is used; what it costs. It is written in `measures.md` and flagged in
   `LOOK.md`, under "Named extensions" in both, and the handoff lists it as a change to the system.
   Then step 5 of the skill is run again. In its main read the system fidelity judge is handed his
   marks once more, and checks that what was rebuilt holds nothing taken from a fresh screen.
3. **The fresh concept wins as a whole.** That is a change of direction for this surface:
   `references/direction.md`, under "When a fresh concept won as a whole". Even then the fresh
   screen is not handed off.

**Never is a fresh screen handed off as it came.** Nothing of `<package>/06-look/fresh/` is copied
into `<package>/06-look/screens/`, and no line of the carry list names it, or
`<package>/06-look/beside/`.
