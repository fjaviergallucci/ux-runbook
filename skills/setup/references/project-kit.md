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

**A project with no design system gets the grey kit as it is.** Do step 1, then steps 5 and 6. There
is no token file, and `kit.css` is not touched: Look will choose a direction, and the kit is rebuilt
on the tokens that direction brings.

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
- **Its first line says where it came from**: the source, by its path from the project's root, and
  the commit the source was read at, as `git rev-parse --short HEAD` prints it. Where the project
  keeps no history, the day stands for the commit.

  ```
  /* Copied from src/styles/tokens.css at 4f2a9c1. Do not edit here: change the source, then copy again. */
  ```

  An export says `Exported from`, and names each source file.
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

## 4. Restyle each class to look like the project's default part

Go through the classes of the contract one by one. For each, read the source of the project's
default part for the same job, to see which tokens it wears, and give the class those:

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
| `ux-media` | nothing of the project: a placeholder that says what it shows |
| `ux-frame`, `ux-over`, `ux-note` | nothing of the project: they are the board's, and stay plain |

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

In `parts.html`, change the title and the opening lines to name the project kit, and nothing of its
markup: it is the markup the contract states, and the drawing script writes exactly that. In the
project profile, "Design system" lists which default part each class was styled after, by the path of
its source.

## 5. Draw with it, once

Prove that the kit draws a proposal and carries its tokens with it. Write this proposal to
`<scratch>/kit-check.json`:

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
      "title": "Rooms right now",
      "container": "screen",
      "items": [
        { "role": "heading", "text": "Rooms right now" },
        { "role": "status", "text": "No room is free until 11:30." },
        { "role": "list", "text": "Rooms", "options": ["Room 1, busy until 11:30", "Room 2, busy until 12:00"] },
        { "role": "input", "text": "Patient name" },
        { "role": "action", "text": "Book a walk-in", "primary": true }
      ]
    }
  ]
}
```

Then draw it in the project kit:

```
node <kit root>/scripts/render.mjs <scratch>/kit-check.json --kit <packages>/kit --out <scratch>/drawn/kit-check.html
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
not hold, is yours to mend first. Then the pictures go to the founder with the project profile, at the
gate: does a button here look like his product's button, a field like its field? What he corrects, you
change in `kit.css`, and picture again.

## Never

- Never import, copy or run a real component: the kit is plain parts wearing the project's tokens.
- Never link a token file outside `<packages>/kit/`: the drawing script would leave it behind.
- Never make up a value to look like the product: a value is a token's, or the grey kit's own, left
  as it was.
- Never add a class, rename one, or change the markup of `parts.html`.
- Never invent tokens for a project that has none: it gets the grey kit, as it is.
- Never start or stop a browser yourself: the picture script does both, for its own.
