# UX Runbook

A portable, AI-executable method for designing and building product screens — from "I have an idea"
to "the screen is built, verified, and audited."

It is written to be **read by an AI and run with a human.** You point your AI at it; the AI
interviews you, proposes directions, generates mockups, stops for your approval at every gate that
matters, then builds and verifies the result.

Works with any capable coding AI — Claude Code, Cursor, Codex, Gemini CLI. Works with any stack.

---

## Start in 60 seconds

1. Put this folder anywhere your AI can read it — inside your project, or beside it.
2. Paste the kickoff prompt from [`templates/PROMPTS.md`](templates/PROMPTS.md) at your AI.
3. Answer its questions. It will stop and ask for your approval four times. Those stops are the
   point of the whole thing.

That's it. The AI reads [`RUNBOOK.md`](RUNBOOK.md) and drives from there.

---

## What it actually does

Eight phases separated by **six gates**. Four gates are yours to close — the AI presents and then
stops. It cannot approve its own design and it cannot write UI code before you have seen one.

```
Setup ▸ G0   Discovery ▸ G1   Foundation   Direction ▸ G2   Mockup
Evaluation ▸ G3  ── no code before this line ──
Implementation   Browser QA ▸ G4   Audit ▸ G5
```

The two ideas doing most of the work:

**Discovery before pixels.** Most AI-generated interfaces look interchangeable because nobody told
the AI who is looking at the screen. Phase 1 is an interview that produces personas specific enough
to make design decisions *for* you — not "a busy professional," but a named person with a real
workflow and a real frustration.

**Describe the user, never the UI.** If you tell a design tool "a dashboard with four stat cards and
a table," you designed it and the tool rendered it. You get your own assumptions back with nicer
spacing. Describe the person and their bad day instead, and you get design decisions you would not
have thought of.

---

## What's in here

| Path | What it is |
|---|---|
| [`RUNBOOK.md`](RUNBOOK.md) | **The entry point.** The whole method, all six gates. The AI reads this first. |
| `setup/` | The seven capabilities, what each buys you, and how to install and verify them on your AI. |
| `phases/` | One file per phase, loaded on demand. |
| `templates/` | Blank artifacts the AI fills in, plus the prompts you paste. |
| `reference/` | Anti-patterns, the fidelity ladder, and a complete worked example. |

Your filled-in artifacts land in a `design/` folder in **your project** — never in this kit. The kit
stays read-only so you can drop the same copy into every project you own.

---

## When not to use it

- **Changing a colour or a string.** Just change it. The ladder in
  [`reference/FIDELITY-LADDER.md`](reference/FIDELITY-LADDER.md) says which rung a task is on.
- **You already have a designer and a Figma file.** Skip to Phase 6 — the implementation, QA, and
  audit phases still earn their keep.
- **Backend or infrastructure work.** This kit is about screens.

---

## Origin

Distilled from a real production method — two internal documents that drove a full product redesign
across roughly forty screens — with everything project-specific stripped out and the parts that were
assumed (personas, brand, decision history) turned into phases you actually run.

The one file that goes stale is [`setup/TOOL-ADAPTERS.md`](setup/TOOL-ADAPTERS.md). Tools churn
every few months; the method underneath them doesn't. When a tool dies, edit that file and nothing
else.
