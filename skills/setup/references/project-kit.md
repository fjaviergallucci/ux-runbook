# The project kit

Every structure proposal of a project is drawn in one kit, so that the founder compares structures and
not paint. The project kit is that kit for one project: the kit's plain parts, restyled on the
project's own tokens, so that an option on the board looks like his product and no option looks better
made than another. You write it once, at setup, in `<packages>/kit/`, and it is rebuilt when the
tokens change.

`<kit root>`, `<packages>` and `<scratch>` are as the skill gives them. Every command is run from the
project's root. The contract the kit keeps is `kit/KIT-CONTRACT.md`: read it whole before you change a
line of the stylesheet.

## What it is

Three files in `<packages>/kit/`, and nothing else:

- `kit.css`: the stylesheet. The same classes as the grey kit, each restyled.
- `tokens.css`: the project's tokens, as one CSS file. `kit.css` imports it.
- `parts.html`: one specimen of every class, in the contract's markup, for a person to look at.

It is static HTML and CSS. It holds no component of the project, no script and no build step, and it
is never drawn through the project's own toolchain: that would tie a design to the build.

**A project with no design system gets the grey kit as it is:** the copy, then the drawing and the
pictures, which are step 1 and steps 5 and 6. There is no token file, and `kit.css` is not touched:
Look will choose a direction, and the kit is rebuilt on the tokens that direction brings.

## 1. Copy the grey kit

Copy `<kit root>/kit/grey/kit.css` and `<kit root>/kit/grey/parts.html` into `<packages>/kit/`.

## 2. Bring the tokens into the kit's folder

`scripts/render.mjs` copies every `.css` file that is directly in the kit's folder next to each page
it draws, and nothing else. So a `kit.css` that imports tokens from elsewhere in the project draws
pages with no style. The tokens are therefore a file of the kit's own folder:

- **Tokens in plain CSS**, custom properties in one file: copy that file to `<packages>/kit/tokens.css`.
- **Tokens that are not plain CSS** (a theme object, a JSON file of tokens, a preprocessor's variables,
  a framework's configuration), or plain CSS spread over several files: export them into one file of
  custom properties, `<packages>/kit/tokens.css`. Take every value from the source as it is written
  there. Type none from memory, round none, and leave out none that a default part uses.
- **A dark theme the product switches by a class or an attribute** does not survive a plain copy:
  the dark set never applies under `prefers-color-scheme: dark`, which is what the picture script
  sets, and the dark pictures come out light. The file is then an export: the dark set is placed
  under `@media (prefers-color-scheme: dark)`, and the first line says it was exported, from what,
  and how.
- **Its first line says where it came from**: the source, by its path from the project's root, and
  the commit the source was read at, as `git rev-parse --short HEAD` prints it. Check first whether
  the source has changes that are not committed (`git status --short <the file>` prints a line when
  it has): the first line then says "with uncommitted changes" after the commit. Where the project
  keeps no history, the day stands for the commit.

  ```
  /* Copied from src/styles/tokens.css at 4f2a9c1. Do not edit here: change the source, then copy again. */
  ```

  An export says `Exported from`, names each source file, and says what was done to it, as "the set
  under the dark class placed under the media query".
- **In the project profile:** `tokens` is the project's own token file when it is plain CSS, and
  `<packages>/kit/tokens.css` when you exported it; either way "Design system" says where the kit's
  copy came from, with the commit.

What the token file itself asks for by a relative address, a font file or another stylesheet, does
not travel either: leave it out of the kit's copy, and let the font's fallback stand in.

**The copy goes stale when the tokens change.** Then it is copied or exported again, with the new
commit on its first line, and steps 5 and 6 are run again. A design that changes a token does this as
part of its own work.

## 3. Point the kit at the tokens

`kit.css` opens with the import, before any other rule:

```
@import "tokens.css";
```

The grey kit keeps its own values in a few custom properties at its top (`--ux-font`, `--ux-primary`,
`--ux-surface`, `--ux-ink`, `--ux-line`, `--ux-radius` and the rest). Give each the project's token
for the same thing, as `--ux-primary: var(--color-action);` where the project's token is
`--color-action`. Where the project has a dark theme, the kit answers `prefers-color-scheme: dark` with
it, as the grey kit does, whatever switch the product itself uses: that is what the picture script
sets.

The grey kit's own `@media (prefers-color-scheme: dark)` block sets the same properties to greys, and
in dark it would win over what you just gave them. Take out of it each property that now reads a token
whose file switches itself, and the block with the last one. A property that keeps the grey kit's own
value keeps its dark one there too. Then rewrite the opening comment of `kit.css` to say what the file
is now: the project kit, and on whose tokens.

## 4. Restyle each class to look like the project's default part

Go through the classes of the contract one by one: every class it lists is styled, and the markup
each sits on is the contract's, under "The markup", which you read there and never restate. For each,
read the source of the project's default part for the same job, to see which tokens it wears, and give
the class those:

| Class | Looks like the project's default |
|---|---|
| `ux-action`, `ux-action.is-primary` | button, and its primary button |
| `ux-input` | text field, with its label |
| `ux-choice` | set of options: radio buttons, a segmented control, chips |
| `ux-list` | list or table rows |
| `ux-status` | status line or badge |
| `ux-link`, `ux-nav` | link, and navigation |
| `ux-heading`, `ux-text` | heading and body type |
| `ux-screen`, `ux-dialog`, `ux-region`, `ux-group`, `ux-expansion` | page surface, dialog, section, card and disclosure |
| `ux-navigation`, `ux-bar`, `ux-main`, `ux-beside` | the areas of a page: its navigation, its top bar, its content area and its side panel; where each sits at each width is the contract's, and stays as the grey kit lays it out |
| `ux-media` | nothing of the project: a placeholder that says what it shows |
| `ux-frame`, `ux-window`, `ux-over`, `ux-note`, `ux-option`, `ux-overview`, `ux-account` | nothing of the project: they are the board's, and stay as the grey kit draws them |

The rules, which are the contract's:

- **Only the project's tokens.** Every colour, size, radius, font and space you change in `kit.css`
  becomes a token, or one of the kit's own properties set from a token. Where the tokens hold nothing
  for a value, the grey kit's own value stays, and you tell the founder which: no value is made up to
  look like the product.
- **No class renamed, dropped or added, and no markup changed.**
- **Each class is styled once,** the same wherever the part appears. `ux-action.is-primary` stays the
  only part that stands out.
- **You read the components, and copy none.** No component's source, markup or stylesheet goes into
  the kit: only the tokens a default part wears.

**Where the system has no part for a class's job,** or its part cannot be styled once (a status tag
with a colour for each state), which tokens the class wears is not yours to settle. Give it the tokens
you would take, and write each such choice into the project profile's "Design system", marked "the
conductor's proposal", with the grey kit's own value beside it. He decides each one at the gate, from
the pictures.

In `parts.html`, change the title and the opening lines to name the project kit, and nothing of its
markup: it is the markup the contract states, and the drawing script writes exactly that. In the
project profile, "Design system" lists which default part each class was styled after, by the path of
its source.

## 5. Draw with it, once

Prove that the kit draws a proposal, with the four areas of a page, and carries its tokens with it.
Write this proposal to `<scratch>/kit-check.json`:

```json
{
  "name": "Kit check",
  "bet": "The project kit draws a proposal on the project's tokens.",
  "cost": "None: it is a specimen, not a design.",
  "absent": ["Any design"],
  "hardest": "No room is free.",
  "screens": [
    {
      "id": "today",
      "title": "Today",
      "container": "screen",
      "items": [
        { "container": "region", "place": "navigation", "items": [
          { "role": "nav", "text": "Front desk", "options": ["Today", "Bookings", "Rooms"] }
        ] },
        { "container": "region", "place": "bar", "items": [
          { "role": "input", "text": "Find a booking" }
        ] },
        { "container": "region", "place": "main", "items": [
          { "role": "heading", "text": "Rooms right now" },
          { "role": "status", "text": "No room is free until 11:30." },
          { "role": "list", "text": "Rooms", "options": ["Room 1, busy until 11:30", "Room 2, busy until 12:00"] },
          { "role": "input", "text": "Patient name" },
          { "role": "action", "text": "Book a walk-in", "primary": true }
        ] },
        { "container": "region", "place": "beside", "items": [
          { "role": "text", "text": "Room 3 is being cleaned until 10:45." }
        ] }
      ]
    }
  ]
}
```

Then draw it in the project kit:

```
node <kit root>/scripts/render.mjs <scratch>/kit-check.json --kit <packages>/kit --out <scratch>/drawn/kit-check.html --lang en
```

`<scratch>/drawn/` must then hold the page and, beside it, every stylesheet of the kit: `kit.css`, and
`tokens.css` when the project has one.

## 6. Picture it, for the founder's look

```
node <kit root>/scripts/shots.mjs <packages>/kit/parts.html <scratch>/drawn/kit-check.html --out <scratch>/pictures --widths 1280,390 --themes light,dark
```

The script starts its own browser, headless, and stops it. It exits 1 and prints
`error: <page>: <what>` when a stylesheet a page asks for does not load: that is a `kit.css` whose
import does not reach a file of the kit's folder. Mend the kit, never the command.

Open the pictures before he does. A part that came out with no style, or in a colour the tokens do
not hold, is yours to mend first, and so are areas that are not where the contract puts them: at 1280
the navigation a column at the side and what is beside the main part next to it, at 390 the navigation
a bar and what is beside under the main part. Then the pictures go to the founder with the project profile, at the
gate: does a button here look like his product's button, a field like its field? Name each line marked
"the conductor's proposal" with its picture: he decides each, and the mark comes off a line on his word
alone. What he corrects, you change in `kit.css`, and picture again.

## A kit made before the page's areas

Eight classes of the contract came with the page's areas: `ux-option`, `ux-overview`, `ux-window`,
`ux-navigation`, `ux-bar`, `ux-main`, `ux-beside` and `ux-account`. A kit whose stylesheets style none
of them was made before them, and is made again. The drawing script still draws with it, but the board
then has no areas: no window, no navigation at the side, every screen one column. So it says so on the
error stream, in one line, and its exit code and its page do not change:

```
warning: no stylesheet of <kit dir> styles any of the page's areas (ux-option, ux-overview, ux-window, ux-navigation, ux-bar, ux-main, ux-beside, ux-account), so the board is drawn without them: this kit was made before them, run setup's kit steps again
```

Wherever that line is printed, at step 5 or at Structure's render, nothing drawn with that kit goes to
a reader or to the founder. Tell him what it printed, and make the kit again: copy the grey kit as
step 1 says, keep `tokens.css` where "When the tokens move" finds it still the project's (else copy it
again, as step 2), and run steps 3 to 6. "Design system" of the project profile already says which
default part each class was styled after: restyle each the same way, and the new ones as step 4's table
says. He sees the pictures, as at setup, and what he corrects goes in. A project with no design system
copies the grey kit again, and runs steps 5 and 6.

## When the tokens move

The copy is the project's tokens as they stood the day it was made, and the product goes on changing.
So it is looked at again: by Frame, before it puts the frame to him, and the copy made again once the
frame is stamped, before any later stage draws; by Look, at its step 2, before the visual designer
starts; and by Handoff, at the start of its step 3, before any page is copied, and again before it
writes `PARTS.md`. A correction draws on no kit, and looks at nothing here.

Read the first line of `<packages>/kit/tokens.css`: the file it names, or each file an export names,
and the commit it was read at. Then ask the project's history whether that file changed since:

```
git log --oneline <the commit>..HEAD -- <the file>
git status --short -- <the file>
```

Name every file the first line names, each as a word of its own.

- **Both print nothing:** the copy is the project's. Nothing is said, and the stage goes on.
- **Either prints a line:** the file changed after the copy was made. Tell the founder which file, the
  commit on the copy's first line, and what the commands printed. Then, before anything is drawn,
  make the copy again as step 2 above says, with the new commit on its first line, and run steps 5
  and 6 again. The line of "Design system" in the project profile that names the copy's commit
  changes with it: he sees the pictures and that line, as at setup, and what he corrects goes in.
- **It cannot be told:** the project keeps no history, as a first line that holds a day says; the
  history knows no such commit or no such file; or the first line says "with uncommitted changes". Say
  which, and ask him whether the tokens changed since the day or the commit it gives. His answer is
  written where the stage that asked writes his words. A yes, or "I don't know", is taken as a change.
- **At Handoff, nothing is copied and `PARTS.md` is not written while the copy and the file differ.**
  Look's screens, their measured values and their pictures were drawn on tokens the product no longer
  has. Stop, and tell him so: the way on is to reopen Look, which is his to ask for, and at its step 2
  the copy is made again before anything is drawn. Handoff copies the pages once Look is stamped again.

## Never

- Never import, copy or run a real component: the kit is plain parts wearing the project's tokens.
- Never link a token file outside `<packages>/kit/`: the drawing script would leave it behind.
- Never make up a value to look like the product: a value is a token's, or the grey kit's own, left
  as it was.
- Never add a class, rename one, or change the markup of `parts.html`.
- Never invent tokens for a project that has none: it gets the grey kit, as it is.
- Never start or stop a browser yourself: the picture script does both, for its own.
