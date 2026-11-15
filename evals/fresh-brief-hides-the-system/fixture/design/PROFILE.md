---
product: A room-booking tool for the front desk of a small clinic.
packages: design
kit: design/kit
tokens: design/kit/tokens.css
components: src/components/linen
facts: docs/product-facts.md
languages: [en]
strings-format:
browser-check:
decisions-log:
pinned: []
banned: []
engines-on: []
openai-model:
gemini-model:
keys-file:
---

# Profile · Clinic rooms

**The project's own rules outrank the kit.** Where the two conflict, the session says so out loud.

## How to fill the header

The header is flat: one `key: value` to a line, a list written inline as `[a, b]`, nothing nested, and
no note beside a value. A path is written from the project's root. A key with nothing to say keeps its
empty value: no key is removed.

| Key | What it holds |
|---|---|
| `product` | The product in one sentence, as the founder would say it to a friend. |
| `packages` | The folder that holds the design packages, one folder for each design. |
| `kit` | The folder of the project kit: the shared parts, restyled on the project's tokens. |
| `tokens` | The project's token file, as plain CSS. Where the tokens are not CSS, the file that setup exported, with where it came from said under "Design system". Empty while there is no design system. |
| `components` | The folder of the component source, as installed. |
| `facts` | The document that says what the product does and what may be said of it: what the truth judge checks against. |
| `languages` | The languages the product ships, by code, the main one first, as `[es, en]`. |
| `strings-format` | The format the project's translation layer takes, in a few words, as: JSON, one file for each language. |
| `browser-check` | How a browser check is run here, in one line. The section of that name has the detail. |
| `decisions-log` | The project's own decision log, when it has one. |
| `pinned` | The seats that always sit, by id, as `[judge.truth]`. |
| `banned` | The seats that never sit, by id. |
| `engines-on` | The outside engines the founder has turned on, each in its card's own spelling of an engine: `model:openai`, `model:gemini`, `tool:stitch`. An outside engine receives the brief, so each stays off until the founder turns it on: nobody else adds one. |
| `openai-model` | The model id sent to that provider, once `model:openai` is on. |
| `gemini-model` | The model id sent to that provider, once `model:gemini` is on. |
| `keys-file` | The path of a dotenv file **outside the repository**, absolute or from the home folder. Only the path is written. No key is ever written in this profile, or in any file of a package. |

## Kinds this project adds

None: the five serve.

## Standing rules

- Plain words, and the front desk's own: a room, a walk-in, a booking.
- English, in a plain register. She is addressed as "you".
- Never a patient's full name where someone standing at the counter can read it.

## How a browser check is run here

Not known yet: no page of this product has been looked at from a session.

The account it would use: not known yet.

No password, token or key is ever written here.

## Design system

Linen, version 2.3. Its document is `docs/linen.md`. Its token file is `src/styles/linen-tokens.css`, copied to `design/kit/tokens.css`. Its component source is `src/components/linen/`. The project kit is drawn on five of its components: LinenButton, LinenField, LinenTable, LinenBadge and LinenDialog.

## Engine check

Checked on 2026-11-10.

| Seat | Engine | What the check found |
|---|---|---|
| `maker.structure-describer` | `own` | nothing to check |
| `maker.outside-describer` | `model:any` | off |
| `maker.screen-generator` | `tool:stitch` | off |
| `maker.transcriber` | `own` | nothing to check |
| `maker.interaction-designer` | `own` | nothing to check |
| `maker.interface-writer` | `own` | nothing to check |
| `maker.prototype-builder` | `own` | nothing to check |
| `maker.visual-designer` | `skill:frontend-design:frontend-design` | missing |
| `judge.usability` | `own` | nothing to check |
| `judge.truth` | `own` | nothing to check |
| `judge.words` | `own` | nothing to check |
| `judge.accessibility` | `own` | nothing to check |
| `judge.visual-craft` | `skill:design-audit:design-audit` | missing |
| `judge.system-fidelity` | `own` | nothing to check |
| `judge.profile` | `own` | nothing to check |
| `judge.cold-implementer` | `own` | nothing to check |
| `audience.task-reader` | `own` | nothing to check |

The browser the kit's scripts drive: answers, with one picture of the kit's specimen page at 1280 px.

## Reviewed by the founder

2026-11-10. Corrected: the third standing rule, which he added in his words. Approved with: "Yes, that is us."
