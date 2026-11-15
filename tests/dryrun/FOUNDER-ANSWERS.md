# The founder's answers, for the dry run

The founder is not present for the dry run. This file stands in for him: one answer for each gate and
each question a stage puts to him, written on 2026-11-15, before the run, in the order the pipeline
asks them. The project is the fictional one in `tests/dryrun/project/`: Roomtally, a room-booking tool
for a small clinic's front desk.

**How a conductor reads it.**

- Find the heading for your stage and your question: `<Stage> · <the question>`. Each stage's
  headings are in the order its skill asks them.
- **The quoted text is his answer, word for word.** Write it into the artefact as his words, under
  `## Reviewed by the founder` or where the stage says, and stamp with it where the stage stamps. Do
  not shorten it, improve it or add to it.
- A line in italics is not his words. *When:* says when the entry applies; *Asked at:* names the
  stage's step that asks it. An entry whose *When* does not hold is not used.
- A position ("the second") is the position in the order the page shows its options.
- A question with no heading here is not answered by you: see the last section.

---

## Setup

### Setup · where the packages go

*Asked at:* setup, step 3, only when `design` at the project's root already holds something else.

> The default: `design`, at the project's root.

### Setup · the product in one sentence

*Asked at:* setup, step 4.1.

> Roomtally is a room-booking tool for the front desk of a small clinic.

### Setup · the product's name

*Asked at:* setup, step 8, only when the sentence above is taken to name no product.

> Roomtally.

### Setup · the languages it ships

*Asked at:* setup, step 4.2.

> English first, then Spanish.

### Setup · the `languages` line, shown to him

*Asked at:* setup, step 4.2, when the line `languages: [en, es]` is shown to him.

> That's right.

### Setup · English: the register, and how she is addressed

*Asked at:* setup, step 4.2.

> Plain and short. She is "you". No "please", no exclamation marks.

### Setup · Spanish: the register, and how she is addressed

*Asked at:* setup, step 4.2.

> Neutral Latin American Spanish. She is "tú", never "usted", never "vos". A room is "la sala".

### Setup · his standing rules for interfaces

*Asked at:* setup, step 4.3.

> Three. A state is said in words, never by colour alone. Nothing moves unless she moved it. What can't
> be undone asks first.

### Setup · the professions it serves

*Asked at:* setup, step 4.4.

> One: the front-desk coordinator.

### Setup · may a brief be sent to an outside text model?

*Asked at:* setup, step 4.5.

> No. No brief leaves this machine.

### Setup · may a brief be sent to a screen generator?

*Asked at:* setup, step 4.6, only when the session lists a screen generator among its tools.

> No.

### Setup · how a browser check is run here

*Asked at:* setup, step 4, "anything else the template asks", only when the project's documents were
not taken to say it.

> Open the file in a browser, headless, by script: 1280 and 390 wide, light and dark, reduced motion
> on. No build, no server.

### Setup · the account a browser check uses

*Asked at:* setup, step 4, "anything else the template asks".

> None. The screens open from files, and nobody signs in.

### Setup · where decisions are logged

*Asked at:* setup, step 4, "anything else the template asks", only when `docs/decisions.md` was not
found.

> `docs/decisions.md`.

### Setup · gate: what is wrong or missing in the project profile?

*Asked at:* setup, "Gate": the project profile whole, with the pictures of the project kit's parts.

> One thing missing. Under Standing rules, add: times are on the 24-hour clock, as 14:30, in both
> languages. The kit's parts are fine as you drew them. Nothing else: approved.

---

## Frame

### Frame · the request

*Asked at:* frame, "Reads": the request, as he wrote it. Word for word, as it stands here.

> the front desk needs to see what is free right now

### Frame · the request, asked again

*Asked at:* frame, step 1, only for a package left half framed whose `00-frame.md` does not hold the
request.

> the front desk needs to see what is free right now

### Frame · gate: is this the right frame for it?

*Asked at:* frame, "Gate". *When:* the frame put to him names the kind `working-surface`, the
foundation `new-surface` and the size `surface`.

> Yes, that's the frame: a working-surface, on new-surface, sized surface. The day list stays as it
> is; this is a new screen beside it. Call it free-now.

### Frame · gate: is this the right frame for it? (another value)

*Asked at:* frame, "Gate". *When:* the frame put to him names any other kind, foundation or size.

> Not quite. It's a working-surface, on new-surface, sized surface: the day list stays as it is, and
> this is a new screen beside it. Call it free-now.

### Frame · gate, put to him again after a change

*Asked at:* frame, "Gate", after he corrected a value and the whole frame was put to him again.

> Yes, that's it.

---

## Context

The questions of step 6 come in the order the conductor writes them under "Questions for the
founder", one at a time. Each that has a heading below is answered by it.

### Context · what he calls each state of a room

*Asked at:* context, step 6: his own words for a room that is free, one in use, one being cleaned.

> Free, busy, cleaning. In Spanish: libre, ocupada, en limpieza. Never "occupied", never "available".

### Context · is a room ever closed?

*Asked at:* context, step 6.

> No. A room isn't closed during the day. If one is out, we just don't book it.

### Context · can the desk end cleaning early?

*Asked at:* context, step 6.

> No. Cleaning runs its time, then the room is free.

### Context · the founder's own words

*Asked at:* context, step 5, "The founder's own words".

> She looks up between two calls and knows which room she can give away this minute. If she has to
> work it out, we've failed.

### Context · why now

*Asked at:* context, step 6, for "The problem, and why now".

> Every morning a clinician leans over the counter and asks for a room, and she scrolls the day and
> does sums in her head. It happens several times before ten.

### Context · what was tried before

*Asked at:* context, step 6, for "Tried and rejected".

> Nothing in the product. Before it, a whiteboard behind the desk. Nobody kept it up, so nobody believed
> it.

### Context · what it must not become

*Asked at:* context, step 6, for "What it must not become".

> Another day list. If she has to read the whole day to find now, we've built the day list again.

### Context · the devices and their widths

*Asked at:* context, step 6, for "Constraints".

> The desk screen, 1280 wide. Her phone, 390, when she's away from the desk.

### Context · the accessibility target

*Asked at:* context, step 6, for "Constraints".

> WCAG 2.2 AA, as Linden says.

### Context · the product's analytics

*Asked at:* context, step 6.

> There are none. Roomtally records nothing yet.

### Context · one profession, several, or everyone

*Asked at:* context, step 5, for "The people".

> One: the front-desk coordinator. Nobody else uses it.

### Context · gate: what is wrong or missing in this context?

*Asked at:* context, "Gate": the context whole, with the profession's profile and which of its traits
are guesses.

> Two corrections. One: cleaning takes ten minutes, not fifteen. Two: a room can be held for a
> clinician who's running late. We call it held; in Spanish, apartada. The desk holds it and can let it
> go, and fifteen minutes after the booking's start it lets itself go. A held room is not free. Where
> the README says otherwise, it's out of date: my word stands on both. The profile stays a guess until
> someone from a desk is heard. With those two, approved.

---

## Intent

### Intent · one job, or two surfaces?

*Asked at:* intent, step 4, "The one job", only when the job needed two sentences.

> One surface: what's free now.

### Intent · the measure

*Asked at:* intent, step 4, "The measure", only when the conductor asks for the event's name.

> We have no analytics. Name the event to add; I'll take the name you write.

### Intent · may the profile judge read the intent?

*Asked at:* intent, step 5, the offer of one `judge.profile` for the profession.

> Yes, have it read. One judge, on sonnet at medium.

### Intent · gate: do you approve this intent?

*Asked at:* intent, "Gate": the intent, with her card and any finding of the profile judge left open.

> Approved. One remark: "right now" means this minute. A room that's free in ten minutes is not free
> now. Anything still open stays open, written down as it is.

---

## Cast

### Cast · gate: which seat, check, model or effort would you change?

*Asked at:* cast, "Gate": the cast sheet, with each seat's line and the cost. *Applies to whatever the
preset gave:* the seat taken out is the `audience.task-reader` seated as the contrast person at
Structure; the primary person stays. The model and the effort apply to every line of every table.

> Two changes; the rest as you have it. Take out the task reader seated as the contrast person at
> Structure: one person trying the board is enough for this run, and the primary person stays. And
> every seat runs on sonnet at medium effort, whatever its card suggests, and so does any seat started
> later that has no line on the sheet: this run tests the mechanics, not the judgement. No fresh pass.
> Approved.

### Cast · a fresh pass

*Asked at:* cast, step 11, "Fresh pass", when the conductor says at the gate that one would earn its
cost.

> No fresh pass.

---

## Structure

### Structure · may this brief go out as it is?

*Asked at:* structure, step 4: the brief whole, with the seats that would send it off this machine.

> Yes, it goes out as it is. No seat sends it off this machine.

### Structure · a board made again within the round

*Asked at:* structure, `references/rounds.md`, "A board made again within a round", only when a
proposal arrived late or was withdrawn after the merge.

> Yes, make the board again.

### Structure · a fresh pass before the pick

*Asked at:* structure, "Gate", only when the conductor offers one at the decision page.

> No fresh pass. I pick from this board.

### Structure · gate: which structure goes on to Detail?

*Asked at:* structure, "Gate": the decision page. *Applies to:* the second option in the order the
decision page shows them, whatever its letter: write that letter on the `Pick:` line of `PICK.md`, and
these words under it. No graft. For "what he asked to be changed on the way to Detail": nothing.

> The second. It's a dry run: I'm testing that a pick carries through, not which way wins. Nothing to
> change on the way to Detail.

---

## Detail

### Detail · a dependency: is it built with the design, or does the element go?

*Asked at:* detail, step 4, and `references/seats.md`, "Its three lists", *Dependencies*. One at a
time; the same answer for each.

> Keep it, and leave it listed as a dependency. The build answers it.

### Detail · a state the intent does not name: does it exist?

*Asked at:* detail, `references/seats.md`, "Its three lists", *States the intent does not name*. One
at a time; the same answer for each.

> Not in this design. Leave it on the list, with these words.

### Detail · what the structure cannot hold: reopen Structure, or accept it as a cost?

*Asked at:* detail, `references/seats.md`, "Its three lists", *What the structure cannot hold*.

> Accept it as a cost. Don't reopen Structure.

### Detail · a fact a string waits for

*Asked at:* detail, `references/seats.md`, the interface writer's *Waiting for a fact*. One fact at a
time: use the entry that answers it. A fact not listed here is a question not here.

- *How long cleaning takes:*

  > Ten minutes.

- *How long a hold lasts:*

  > Until fifteen minutes after the booking's start, unless the desk lets it go first.

- *The opening hours:*

  > 07:30 to 19:00, Monday to Friday. 08:00 to 13:00 on Saturday.

- *How a clinician is named on screen:*

  > By first name, as on the shift list.

- *How a room is named on screen:*

  > Room 1 to Room 5. In Spanish, Sala 1 to Sala 5.

### Detail · the words, as a question of their own

*Asked at:* detail, "Gate", only for the kinds `first-run`, `message` and `public-page`. This design is
a `working-surface`: it should not be asked.

> Approved.

### Detail · gate: do you approve this prototype for Look?

*Asked at:* detail, "Gate": the decision page and the prototype.

> Approved for Look. Anything still open stays open, written down as it is.

---

## Look

### Look · does this surface leave the design system?

*Asked at:* look, step 2, only when the conductor asks which mode to run.

> No. It stays inside Linden.

### Look · a fresh pass

*Asked at:* look, "Gate", only when the conductor offers one.

> No fresh pass.

### Look · a line for the project profile

*Asked at:* look, "Never change the project profile silently": only when a line of the profile is put
to him.

> No change to the profile from this design.

### Look · gate, with variants: which variant goes on to Handoff?

*Asked at:* look, "Gate". *When:* the decision page holds variants. *Applies to:* the variant the
screens are already drawn in, as the visual designer's reply names it.

> The one the screens are already drawn in. No redraw for this run. Approved for Handoff; anything
> still open stays open, written down as it is.

### Look · gate, with one proposal: do you approve these screens for Handoff?

*Asked at:* look, "Gate". *When:* the decision page holds the final screens as one option.

> Approved for Handoff. Anything still open stays open, written down as it is.

---

## Handoff

### Handoff · something a page loads that cannot be copied in

*Asked at:* handoff, step 3, only when `alone.mjs` names a load that cannot be copied into the folder.

> List it for the builder to supply, and leave it open.

### Handoff · an item of the cold implementer's that nobody decided

*Asked at:* handoff, step 9, one item at a time, each with the default the conductor proposes. The
same answer for each.

> Use the written default, and mark it as one.

### Handoff · gate: may this folder go to the session that builds it?

*Asked at:* handoff, "Gate": the decision page and `HANDOFF.md`.

> Go. It may go to the build.

---

## Acceptance

### Acceptance · a check only he can make or waive

*Asked at:* acceptance, `references/driving.md`: a screen reader, or anything else no driver can make.

> Waived for this run: there is no screen reader on this machine. Write that I waived it.

### Acceptance · a criterion he must judge by eye

*Asked at:* acceptance, `references/driving.md`: a criterion `ACCEPTANCE.md` marks as judged by eye by
the founder.

> Not judged in this run: I'm not at the screen. Write it as not judged, with that reason.

### Acceptance · a deviation: is it accepted as built, or fixed?

*Asked at:* acceptance, "Gate", one deviation at a time. The same answer for each.

> Accept it as built, and log it.

### Acceptance · a fix the size of a correction: may this be put right so?

*Asked at:* acceptance, `references/deviations.md`, "A fix the size of a correction", only when one is
put to him.

> No. Accept it as built, and log it.

### Acceptance · gate: do you accept this build?

*Asked at:* acceptance, "Gate", the last question, once no deviation is undecided and no fix is out.

> Accepted.

### Acceptance · a lesson for the kit

*Asked at:* `skills/design/references/lessons.md`, "The kit's lessons", when an entry for the kit's own
lessons is proposed to him.

> Not from a dry run. Put it in your notes; it goes into the dry-run write-up.

---

## If a question is not here

**The conductor stops and reports the question; it never answers for him.** It writes the question as
it would have put it to him, with its stage and the step of the skill that asks it, into its notes
file, and returns it to the controller. It does not take the nearest answer of this file, does not
take its own recommendation as his yes, and does not go on past the question. The controller adds the
answer here and records that it was missing.

The same holds for anything the pipeline says to put to him before going on, for which this file has
no heading: a stale or changed artefact that `state.mjs validate` reports, a reopening, a resize or a
change of route, a faulty card, a script's refusal, or a fact Context could not source. Stop, and
report it.
