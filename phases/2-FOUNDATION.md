# Phase 2 · Foundation — the design system

**No gate of its own. Output feeds G2.**
**Produces:** a token set in the project, plus a summary in `design/PROJECT-CONTEXT.md`

---

## First: does one already exist?

**If the project has a design system, read it and stop.** Tokens, a component library, a brand
guide, a themed stylesheet — any of these means your job in this phase is to *summarize what binds
you*, not to invent alongside it.

Two parallel systems is the worst outcome available in this phase. It is worse than an ugly system,
because it is invisible until the day someone tries to change a colour and finds it defined in three
places.

Look for: a tokens or theme file, CSS custom properties at `:root`, a Tailwind or equivalent config,
a `components/ui` directory, a Figma library, a brand PDF. Write down what you found and what it
constrains. Then go to Phase 3.

**If a brand exists but no system does** — a logo, two colours, a font — treat the brand as fixed
input and build the system around it. You are extending, not choosing.

---

## Building one from nothing

Only when there is genuinely nothing. Keep it small: a system that covers 80% of cases consistently
beats one that covers 100% and drifts.

### Start with three questions

Ask the human, in this order:

1. **"What should it feel like to use?"** Three adjectives, and push past the first three, which are
   always *clean, modern, simple*. Those are not adjectives, they are the absence of adjectives.
   Ask "compared to what?" until you get something with an opinion in it.
2. **"What must it never look like?"** Often more productive than the first question. People know
   what they hate.
3. **"Name something you admire that isn't a competitor."** A reference outside the category
   prevents the design from converging on the category average — which is the failure mode this
   whole method exists to avoid.

### The minimum token set

| Group | What to define | Notes |
|---|---|---|
| **Colour — semantic** | background, surface, surface-raised, border, text, text-muted, primary, primary-foreground, success, warning, danger, and each one's foreground | Name by role, never by hue. `--color-danger`, not `--color-red`. Renaming a hue later is a refactor; changing a role is an edit. |
| **Colour — both themes** | Every semantic token, in light and dark | Define both now. Retrofitting dark mode after the fact means re-auditing every screen. Dark is not "invert the light one." |
| **Type — families** | One or two. Never three. | If two: one for headings, one for everything else. Check the pairing actually renders together, not just that it sounds good. |
| **Type — scale** | Six or seven steps, a consistent ratio | A modular scale (1.2 or 1.25) beats hand-picked sizes, because it stays consistent when someone adds a size next month. |
| **Type — weights and line heights** | Which weights ship, line height per step | Tighter for display, looser for body. Body between 1.5 and 1.7. |
| **Spacing** | One scale, everything uses it | A 4px base with a 4-8-12-16-24-32-48-64 ramp handles nearly everything. The point is not the numbers, it is that nobody ever writes `13px`. |
| **Radius** | Two or three values, plus full | Radius is quietly one of the strongest personality signals you have. Sharp reads technical; generous reads friendly. Pick deliberately. |
| **Elevation** | Three levels at most, or none | If the design is flat, say so explicitly, so nobody adds a shadow later "to make it pop." |
| **Motion** | Two durations, one or two easings | Fast (~150ms) for state changes, slower (~250ms) for entrances. And a `prefers-reduced-motion` path — see below. |

### Accessibility, decided here rather than audited later

- **Contrast.** Body text at 4.5:1, large text and UI boundaries at 3:1. Check the *token pairs* now,
  once, rather than checking every screen forever. A palette that passes at the token level cannot
  fail at the component level.
- **Never colour alone.** Every status that is communicated by colour also carries a shape, an icon,
  or a word. Roughly one in twelve men cannot distinguish your red from your green.
- **Focus.** Define one visible focus style as a token and use it everywhere. Removing outlines
  without replacing them makes the product unusable by keyboard, and it is done by accident
  constantly.
- **Reduced motion.** Decide what each animation degrades to. "Nothing" is a fine answer; "unhandled"
  is not.
- **Target size.** 24px minimum for pointer targets, 44px for anything primarily used on touch.

### Write it down where the code reads it

Tokens belong in the project's real theming mechanism — CSS custom properties, a theme file, a
config — not in a document that describes them. A design system that lives only in prose is a
suggestion, and it will be ignored within two weeks.

Then summarize in `design/PROJECT-CONTEXT.md`: what the tokens are called, where they live, and the
rules for using them. That summary is what future sessions read.

---

## What not to do here

**Do not design components yet.** This phase produces the vocabulary, not the sentences. Buttons and
cards come in Phase 6, built from these tokens.

**Do not pick the aesthetic direction here.** That is Phase 3 and it is a human decision at G2. This
phase produces the *material* a direction is expressed in. It is possible to build a restrained
system and a bold one from the same palette.

**Do not define a token you cannot name a use for.** Every unused token is a future inconsistency,
because the next person will use it for something it was not meant for.

**Do not skip dark mode "for now"** unless the human explicitly says the product is single-theme.
Retrofitting it is several times the cost of defining it alongside.
