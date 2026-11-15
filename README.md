# ux · an interface design pipeline

A Claude Code plugin that takes one interface, from a request to a build checked against what was
approved, through nine stages. At each stage makers propose, judges report and an audience tries the
task: each a fresh sub-agent that knows only what its brief hands it. You decide at every gate, from
pictures, and nothing counts until your words are written into the design's folder. It ends in one
folder that a session which was never there can build from without asking.

## Install

The scripts that drive a browser need the kit's one dependency, installed in the folder the kit runs
from. That folder is not the same in the two ways of using it.

**From a clone.** Install the dependency in the folder you cloned this repository into, then start
Claude Code with the plugin loaded from that folder:

```
npm install
claude --plugin-dir <the folder you cloned>
```

**Installed from a marketplace.** In Claude Code, add this repository as a marketplace, then install
the plugin from it:

```
/plugin marketplace add <path or repo>
/plugin install ux@ux-runbook
```

`<path or repo>` is the folder you cloned this repository into, or its address. An installed plugin
runs from Claude Code's own copy, not from your clone, so `npm install` is run once in that copy: the
kit's root as installed, which is the folder two above any of its skills' own. When a skill loads,
Claude Code names that skill's folder. Until it is run there, each script that drives a browser
refuses in one line that names the folder to run it in.

They drive the Chrome already on the machine, headless, and need Node 20.10 or later. Nothing else is
installed, and no browser is downloaded.

## Start

In the project the interface belongs to:

```
/ux:design
```

Say what you want designed, redesigned, adjusted or corrected. The first time in a project it sets the
project up: it writes the project's profile, with you. After that every design starts at Frame, and any
session can pick a design up again from its folder alone, on any day.

**Keep formatters off the designs.** A formatter, a hook that formats on commit or an editor that trims
white space on save, run over the folder that holds them (`design/` unless the project's profile says
otherwise), changes files you approved, and the state script's `validate` then reports each one as
changed since you approved it.

## The nine stages

| # | Stage | The question it answers | What it leaves | You |
|---|---|---|---|---|
| 1 | Frame | What kind of interface, starting from what, how big: so which stages run? | `00-frame.md` | confirm; for a correction, one nod at Detail |
| 2 | Context | What is true before anyone has an idea? | `01-context.md` | correct |
| 3 | Intent | Who, in what moment, to get what done, and how will we know? | `02-intent.md` | approve |
| 4 | Cast | Who makes, who judges with which checks, who plays the user? | `03-cast.md` | edit by exception |
| 5 | Structure | Which way of solving it? | `04-structure/CHOSEN.md` | pick, from pictures |
| 6 | Detail | Does the chosen structure hold in every state and every language? | `05-detail/DETAIL.md` | approve |
| 7 | Look | What does it look like, finished? | `06-look/LOOK.md` | pick or approve, from pictures |
| 8 | Handoff | Can a session that was not here build it without asking? | `07-handoff/HANDOFF.md` | give one go |
| 9 | Acceptance | Did what was built match what was approved? | `08-acceptance/REPORT.md` | accept |

The size of a request decides which stages run. A new screen runs all nine. Moving an element runs a
short form of most and skips Structure. A wrong label is a correction: one line, a picture of before
and after, and one nod.

At Structure, several ways of solving the problem are written down by makers who do not see each
other, drawn by one script in one plain grey kit, and shown to you under letters, with nothing that
says who made which. You choose a structure before anything looks finished.

## What it does not do by itself

- **Its scripts send nothing off the machine by themselves.** An outside model or a screen generator
  receives a brief only when the project's profile lists it under `engines-on`, and that line is
  yours: no session adds to it. With that list empty, every seat is a Claude sub-agent of your own
  session, which talks to its model as any session does.
- **It never handles a key.** No session asks for one, opens a keys file, or prints the environment.
  The one script that calls an outside model finds its key by name, where you put it, and never takes
  one on a command line.
- **It keeps nothing of yours here.** A design package is a folder in your project, `design/<name>/`
  unless the project's profile says otherwise, beside the project's profile, its own kit, its own pool
  and its lessons. Nothing of a design is written into this repository. Only a run of the evaluations
  writes here, into `evals/results/`, which git ignores.
- **It does not build.** Handoff ends in a folder for the session that implements, and Acceptance
  checks what that session built. Neither writes your product's code, but for a correction, after
  your nod.

## What is in the repository

| Path | What it is |
|---|---|
| `.claude-plugin/` | The plugin, `ux`, and the marketplace it is installed from, `ux-runbook`. |
| `skills/` | Eleven skills. `design` conducts: the order, the routes, the loop every stage runs, the state, resuming. `setup` runs once in a project. The other nine are the stages. |
| `pool/` | The seats, one card each: eight makers, eight judges, one audience, and five people with no profession. `INDEX.md` has them on one page, `CARD-FORMAT.md` is the contract of a card, `MODELS.md` says which model each is suggested on and why. |
| `templates/` | Every file of a package, the project's profile and lessons, a profession's profile, a person's card, the three briefs, the ledger, the task read, the decision page's data. |
| `kit/` | The plain grey kit every Structure proposal is drawn in, and its contract. A project with a design system gets a copy restyled on its own tokens. |
| `scripts/` | The state of a package; the blind merge and its sealed map; the renderer; the pictures; the decision page; the acceptance checks; the proof that a handoff folder stands alone; the card checker; the call to an outside model. Each prints its usage with `--help`. |
| `reference/` | The guide a builder is handed with every handoff, and the anti-patterns: of a design, of the session that runs the process, and those this pipeline was built against. |
| `evals/` | Nine cases that hold the plugin to its own rules: each is a prompt, a small fixture and what must be seen for it to pass. Run with `claude plugin eval . --no-publish --ablation none --runs 1 --allow-tools Bash Write Edit`: a run costs model calls, and `--no-publish` keeps its report on the machine. |
| `tests/` | The tests of the scripts, the cards, the templates, the skills and the evaluation fixtures: `npm test`. |
| `LESSONS.md` | What the process has taught that is true on any project. Appended, never rewritten. |
| `docs/` | The design this kit was built from, the plan, and the record of the build. |

## When not to use it

- **Changing a colour or a string.** Just change it. Asked anyway, the pipeline sizes it a correction
  and keeps it to one line and one nod.
- **You already have a designer and a finished design.** The stages that decide what a design is have
  nothing to add. What still earns its keep is the end: a folder a builder can work from without
  asking, and a check of the build against it.
- **Backend or infrastructure work.** This kit is about screens.

## Version 1

Version 1 of this kit was a runbook of eight phases and six gates, read by any coding AI. It is the
`master` branch until this one lands, and after that it lives at the tag `version-1`.

## Licence

MIT. Passages adapted from other people's work keep their attribution in the card that carries them,
under "Borrowed".
