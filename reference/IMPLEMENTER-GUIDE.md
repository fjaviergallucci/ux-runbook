# The implementer's guide

You have been handed one folder, and this page is in it. The folder is a finished design. Someone
worked out who the interface is for, how it is structured, every state, every word and how it looks,
and the person who approved it gave a go to build it. You were not there, and you do not need to have
been: what you need is in this folder. Your job is to build what it shows, in the project's own
components, and to say plainly where you could not.

Besides this folder you open the project's own source, which you build in, and nothing else: no other
folder of the design, and no conversation about it.

## Read it in this order

1. `HANDOFF.md`: the entry. What to build, in which slices, what done means, what must not change,
   what is left to you, and where you write back.
2. This page.
3. `prototype/`: open its index. One page for each screen, state and language, on the project's real
   tokens, with a reference picture of each at every width and theme. It is the picture of record.
4. `SPEC.md`: for each surface, its job, its regions, every state, the rules, where each element's
   content comes from, and what the product cannot supply yet.
5. The strings file `HANDOFF.md` names: every string by its key, in every language, with its limit.
6. `PARTS.md`: the component and the tokens each element uses, as they were read in the project's
   source, and anything new to the system.
7. `ACCEPTANCE.md` and `acceptance.json`: what your build will be checked against, in words and as
   checks a script runs.
8. `DECISIONS.md`: what was chosen, why, and what each choice forces on the build.
9. `COVERAGE.md`: who read the design, and what became of what they found. Open it when you wonder
   whether something was considered.

Where two files disagree, or the folder is silent about something that is neither decided nor left to
you, ask whoever handed you the folder. Do not pick one, and do not carry on by assuming. If nobody
can be asked, build the nearest thing the folder supports and write it down as a deviation.

## Three rules you keep

1. **Keep the stable ids.** Every `data-ux` and `data-screen` of the prototype is on the same element
   of your build, with the same value. Your build is checked by them: an id that was renamed, moved or
   dropped is a check that fails or cannot be made.
2. **Build every state.** Every row of every "States" table in `SPEC.md`, not only the ordinary one.
3. **Do not redesign.** Not the structure, not a word, not a gap, even where you see a better one.
   What cannot be built as drawn is built as near as it can be, and written down in `DEVIATIONS.md`.
   It is decided afterwards, by the person who approved the design, and not by you.

## Four rules of building

### 1 · Never guess a component's interface

Component libraries rename properties, change how parts compose and swap what they are built on
between versions. What you remember is some past version, and the project is on the one it is on.

`PARTS.md` names the component for each element and the file it was read in. Before you write any use
of a component you are not certain of, open that file, or the project's registry if it has one, and
read the real interface. Reading the installed source is authoritative, and never beneath you.

You have guessed when: a property "should" exist; a composition compiles and draws nothing; an escape
hatch goes by the name it had two versions ago.

### 2 · Tokens, never raw values

Every colour, space, radius, shadow, type size and duration is a token of the project. `PARTS.md` says
which token each element takes, and `tokens.css` in this folder is the file the prototype was drawn
on. No colour written as a number, no size in pixels, no margin of seven to nudge something into place.

A raw value does not follow the theme, does not follow a change of token, and is invisible to whoever
tries to fix it later. If the design needs a value the system lacks, `PARTS.md` lists it under
"Changes to the system", with its definition: add it to the system as written there, then use it. If
you find another one, that is a deviation: write it down, and do not invent the token.

### 3 · Build every state the spec lists

The ordinary state is the easy quarter of the work. Build each row of the "States" tables:

- Empty for the first time, and empty because a filter left nothing: two states, with different words.
- Loading for the first time, and loading again: never blank what is already on screen to show a
  spinner.
- Part of it loaded, part failed, part still working.
- An error she can recover from, with the way to retry, and one she cannot, with what to do instead.
- No permission.
- Success, and how long it stays.
- Overflow: the ninety-character name, the list of five hundred rows, the nine-digit number.

A row that reads "cannot occur" is honoured: build nothing for it. A state you meet that the spec does
not list is not yours to invent: ask, or write it down as a deviation.

### 4 · Translate the prototype, never paste it

The prototype is a picture of the design. Its markup is static, its data is example data, and its
classes are not the project's. Read it for layout, order, spacing, emphasis and words. Then build the
same thing from the project's components and tokens. Only the ids travel as they are.

Pasted markup is how a codebase gets a second styling system that nobody can find and everybody works
around.

## Work the way the project works

Before you write, read three or four components the project already has, and match what you find:
where files go, how they are named, how state is held, how data is fetched, how an error surfaces, how
a string is declared. Consistency with the code around you outranks your preferences. If the project
has a conventions document, it outranks this page: say so where the two conflict.

Three things are cheaper built in than added afterwards:

- **Accessibility.** A button is a `button`. Every control has a name. Everything is reached and used
  with the keyboard, in the order `SPEC.md` gives, with focus always visible. Status never rests on
  colour alone. What changes without a navigation is announced. Reduced motion is respected in the
  form `SPEC.md` gives.
- **Strings.** Every string she reads goes through the project's translation layer in the change that
  introduces it, under the key the strings file gives it, in every language. Never type a string of
  the interface into a component.
- **Room for what loads.** Reserve the space of anything that arrives late, so that nothing jumps.

## The loop: look, measure, fix one thing

Code you believe is right has not been seen. Run this loop for each slice, until it finds nothing.

1. **Start the project the way it is started,** and check it answers: a blank picture is usually a
   server that is not running. Drive a browser the way the project already does, headless, with
   reduced motion set.
2. **Put one state on screen,** for real: clear the data for an empty state, hold a request back for a
   loading one, fail it for an error, type the ninety-character name for overflow. Write down how you
   got there: you will need it for the state map.
3. **Read what a screen reader gets** before you look at pixels: the headings, the names of the
   controls, the order.
4. **Take a picture, and put it beside the reference picture** of that state in `prototype/`, at the
   same width and in the same theme.
5. **Read the console.** Every warning and every failed request. Noise there is a problem on screen.
6. **Do it again at the phone width, then in the other theme.** The phone width is where a layout
   breaks, and a dark theme fails where nobody looked.
7. **Measure. Do not trade adjectives.** "A bit tighter" and "closer to the picture" do not converge,
   because nobody named a number. Read the computed values in the page, as below, and compare them
   with "Measured values" in `ACCEPTANCE.md`. Then fix against the difference: the heading renders at
   28 px and the table says 24; the gap is 12 and should be 16; the muted text is 4.1 to 1 on its
   ground and needs 4.5.
8. **Fix one thing, then look again.** Never fix eight things and take one picture: when something
   breaks you cannot tell which fix did it.
9. **Run the project's own gates** before you commit the slice: its type check, its lint, its tests,
   its build, by the commands `HANDOFF.md` gives under "Verify".

Reading the values in the page, for one element by its stable id:

```js
const el = document.querySelector('[data-ux="book-action"]');
const cs = getComputedStyle(el);
({
  fontSize: cs.fontSize,
  lineHeight: cs.lineHeight,
  fontWeight: cs.fontWeight,
  color: cs.color,
  background: cs.backgroundColor,
  margin: cs.margin,
  box: el.getBoundingClientRect(),
});
```

`ACCEPTANCE.md` says what each check of `acceptance.json` measures, and what it does not ask. Hold
your build to each one yourself, by its id, before you write back. A check you could not make hold is
a deviation, written down. It is never a check quietly left alone.

Two things by hand, in every state: go through the screen with the keyboard alone and watch where
focus goes and where it sticks, and set the text to 200% and see that it reflows.

## What you write back

Three short files, where `HANDOFF.md` says, under "What you write back". Each is already there as a
page to fill. They are how your build is checked afterwards, by a session that was not here either.

| File | What it holds |
|---|---|
| `BUILD.md` | What was built, slice by slice, with the commit that holds each. Where it lives: the files added or changed, and the address or the route of each surface. How to run it. |
| `STATES.md` | The state map. One row for each state of `SPEC.md`: the steps that put it on screen in your build, in order. An address, a seed step, a network condition, an account. |
| `DEVIATIONS.md` | Everything that could not be built as drawn: where, as drawn, as built, and what stood in the way. "None" when the build is what was drawn. |

The checks of `acceptance.json` are then run on your build, state by state, from your state map. A
state with no row cannot be reached, and its checks cannot be run: a build with a state missing from
the map is not finished.

A deviation written down is ordinary, and is decided by the person who approved the design: the
pages you fill call him the founder. A deviation found later that nobody wrote down is a defect.

## Accounts, data and secrets

- **An account is named by its role,** as "the front-desk account of the test clinic", with where its
  sign-in is kept. No password, token or key is ever written: not in `STATES.md` or `BUILD.md`, not in
  a commit message, not in a picture's name, not on a command line you write down.
- **An address is written without anything that signs in.** If a sign-in rides in an address, write
  the route and say how the sign-in is obtained.
- **Pictures are taken on seeded or test data.** If a state can only be shown with a real person's
  data, take no picture of it, and say so in the state map.
- **Never print the environment,** and never open a file of keys to look for a reason.

## On a shared machine

Other sessions may be working on the same machine. Stop only the server and the browser you started
yourself, through your own handle. Never stop a process by its name or by a pattern.

## When you are done

Every slice of `HANDOFF.md` is built and committed, every state is in the state map, every deviation
is written down, and the three files are filled. Say so to whoever handed you the folder. The build is
then checked against this folder, item by item, and each deviation is decided: accepted, or sent back
to be fixed as a slice like the ones you just built.
