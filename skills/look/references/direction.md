# Direction: the look where no design system exists

A direction is a committed visual point of view: named, with a thesis and a cost. It answers one
question: what is this interface willing to be bad at, so as to be good at something else? Where a
project has no design system, nothing answers it yet, so Look runs as a direction first: two or
three are drawn on the same detailed screen, the founder picks one from pictures, and his pick
becomes the tokens. Then Look goes on as the skill gives it, on those tokens.

`<kit root>`, `<packages>`, `<package>`, `<kit dir>` and `<tokens>` are as the skill gives them, and
every command is run from the project's root.

**Every question this page puts to the founder is recorded before it is asked,** with the `await` of
the skill's gate, so that a session resuming tomorrow asks the same one. His answer is written under
`## Reviewed by the founder` of `LOOK.md`, as he said it, and the stage is put back in work with the
`begin` of step 1 of the skill, before the next step starts. There are five such questions: a lens,
the pick, a hybrid, the change to the project profile, and a fresh concept redrawn.

## When

- `node <kit root>/scripts/state.mjs status <package>` gives the foundation as `no-system`, whatever
  the size, or the size as `system`.
- `tokens` of the project profile is empty, and its "Design system" says there is none yet.
- The founder has said that this surface leaves the design system on purpose. The cast sheet's
  "Look" table then has a line for each direction; when he says so at Look, his words are written
  under `## Reviewed by the founder` of `LOOK.md` first.
- A fresh concept won as a whole: the last section of this page.

## Two or three, of different kinds

**Three shades of one safe idea are not a choice. They are the illusion of one.** The test: with
all of them drawn, could he tell them apart from across the room? If not, one direction was
proposed three times, and he will take the middle one because there is nothing else to do.

- **Who draws them.** Until the kit has a card for a direction maker, `maker.visual-designer` is
  cast once for each direction, each with a different lens. The cast sheet's "Look" table has a
  line for each, with its lens. Where it has none, ask the founder before anything is drawn: the
  lenses are his to name, and the sheet changes with his yes.
- **Read the lenses before you start a maker.** Two lines with one lens, or lenses that part only
  by a shade, a little warmer or a little denser, are not two kinds. Say so to the founder, and ask
  him for another: the sheet is his, and you write no lens of your own.
- **The same detailed screen for all:** the screen of the chosen structure where the one job gets
  done, in its `default` state, in the product's main language, with every string exactly as
  `<package>/05-detail/strings.json` has it. A direction changes the paint, never the detail.
- **Each brief,** from `templates/briefs/maker.md`, gives the lens and that one screen, and says
  what a direction returns with its page: a **name** of two or three words that stick; a
  **thesis**, one sentence on what it is good at and for whom; and a **stated cost**, the weakness
  it accepts on purpose. A direction with no stated cost goes back to its maker once, and is not
  shown without one. You write none of the three.
- **Palettes and pairings may be drawn from a design-data skill, when one is installed,** as
  `ui-ux-pro-max`: the brief names it as a lookup. It is data, never a verdict, and inside a design
  system it is not used.
- **Handed:** what `references/seats.md` gives the visual designer, without a token file and
  without a design system: there is none. **Do not open:** the other directions' files, and
  `<package>/work/` but its own brief.
- **Writes:** one page, `<package>/06-look/directions/<name>.html`, whole in one file. Every value
  it chooses, a colour, a size, a space, a radius, a typeface, is kept as a custom property in one
  block at the top of the page: the pick becomes the token file from that block, and no value is
  ever read off a picture.

The makers are started in one message, each a fresh sub-agent on what its line of the cast sheet
names, three at a time at most where they drive a browser. None sees another's page.

## The pictures, the readers, the page

```
node <kit root>/scripts/shots.mjs <package>/06-look/directions --out <package>/06-look/directions --widths <primary>,<phone>
node <kit root>/scripts/page.mjs <package>/06-look/directions.json --out <package>/06-look/directions.html
```

- **The readers** are the judges the cast sheet seats for the direction, each a fresh sub-agent: the
  visual craft judge and the accessibility judge, and the profile judge where it sits. Each is
  handed the directions' pages and pictures, by letter, and the intent. The system fidelity judge
  does not read: there is no system to be faithful to. Each writes
  `<package>/06-look/reads/<seat>-directions.md`.
- **The page** is `<package>/06-look/directions.json`, in the shape of
  `templates/outputs/decision.json`. Every direction is an option, lettered in the alphabetical
  order of the names: its name is the title, its thesis and its cost the line, its pictures named
  from the page, the phone width first. One line for each seat, one recommendation resting on the
  reads, one question: which direction does this product take?
- **If the readers could not tell them apart,** that is a finding on the page, by seat. You draw no
  further direction, and you mend none.

Put the page in front of him, and record the question with the `await` of the skill's gate. **Stop:
you do not pick.** He picks one, by its name. A hybrid is written in his words, exactly, as "Quiet
ledger, with the type of Front desk", and is drawn once more by a fresh maker of the picked
direction. He confirms it from its picture, one question, before anything becomes a token. If he
takes none, no further direction is drawn on the same lenses: he names new ones, and the cast sheet
changes with his yes.

## The pick becomes the tokens

1. **Write his pick** under "Mode" of `LOOK.md`, with each direction's name, thesis and stated
   cost, and under `## Reviewed by the founder`, as he said it. Put the stage back in work with the
   `begin` of step 1 of the skill.
2. **A maker writes the token file, never you.** A fresh `maker.visual-designer`, handed the picked
   page, writes one CSS file of custom properties: every value of the page's block, none added and
   none rounded, a dark set under `@media (prefers-color-scheme: dark)` when the direction has one.
   Its first line says where it came from: the direction's name, the package and the day. That file
   is `<tokens>` for the rest of this design, and where it is written depends on what is there:
   - **A project with no token file:** `<kit dir>/tokens.css`.
   - **A project that has a design system, and takes a new direction:** a new file beside it, named
     for the direction, as `<kit dir>/tokens-quiet-ledger.css`. **A token file that is there is
     never written over:** setup's copy of the real tokens stays as it is.
   - **A surface that leaves the design system:** `<package>/06-look/tokens.css`.
3. **The project profile is updated by a change he sees and approves, never silently, and first.**
   Show him the lines before you write one, and before the kit is touched: `tokens`, naming the
   token file; and, under `## Design system`, the direction's name, its thesis and its cost, the
   token file by its path, and the package and the day it was picked in. One question, about one
   thing: may the project profile be changed so? On his yes, write those lines into
   `<packages>/PROFILE.md`, and his words under `## Reviewed by the founder` of `LOOK.md`. Then name
   the token file and the change under "Mode". A surface that leaves the system changes one line
   only, under `## Design system`: the surface, and its token file.
4. **Only after his yes is the project kit rebuilt on the new tokens:** steps 3 to 6 of
   `skills/setup/references/project-kit.md`, the kit's stylesheet importing the new file. He looks
   at the redrawn `parts.html` as he did at setup's gate, and what he corrects is changed and
   pictured again. A surface that leaves the system keeps the kit as it is.
5. **Log it.** The direction is a decision of the product, not only of this design: append it to
   the package's `DECISIONS.md` with the directions he rejected and the cost he accepted, and where
   `decisions-log` of the project profile says.
6. **Go on from step 3 of the skill.** One visual designer now draws every screen on `<tokens>`.
   The picked direction's page is a picture he chose from, never a screen of record.

## When a fresh concept won as a whole

The third outcome of a fresh pass is a change of direction for this surface, and its direction is
already picked: no other is drawn.

- One `maker.visual-designer`, cast for that direction, is handed the fresh screen he chose, to
  understand what he liked. It draws the same detailed screen in that direction, copies none of
  the fresh screen's code or its values, names the direction and states its thesis and its cost.
- He confirms it from the picture: one page, one question, recorded as every question of this
  page is. Then the pick becomes the tokens, as above, for this surface:
  `<package>/06-look/tokens.css`, unless he says the product takes it.
- The screens already drawn on the system are set aside, not deleted: move them, with their
  pictures and their measures, into `<package>/06-look/earlier/`. Nothing there is handed off.
