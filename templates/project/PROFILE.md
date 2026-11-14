---
product:
packages: design
kit: design/kit
tokens:
components:
facts:
languages: []
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
<!-- Template. Keep the headings and every key of the header, replace each {instruction in braces}, and
     delete this comment. Written once, at setup, and corrected by the founder. After that it is changed
     by the designs that change it, never rewritten from memory. -->

# Profile · {the product's name}

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

{Each kind beyond the kit's five, by a name in lower-case words joined by hyphens: what it is judged
first on, and its own rules. "None" while the five serve.}

## Standing rules

{The founder's standing rules for interfaces, one line each, in his words where he gave them. With
them, for each language: the register it is written in, and how she is addressed.}

## How a browser check is run here

{What a session does to look at a page of this project: the command or the script, and what it must
set: the width, the theme, reduced motion.}

{The account it uses, named by its role, with where its sign-in is kept.}

No password, token or key is ever written here.

## Design system

{Its documents, its token files and its component source, each by path, with its version. Which
components make up the project kit.}

{"None yet" while there is none: Look then runs once as a direction, and writes this section and `tokens`.}
