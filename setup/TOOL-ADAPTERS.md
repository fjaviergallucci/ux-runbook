# Tool adapters

**Last audited: 2026-08-24.**

> **This is the only file in the kit that goes stale.** Everything else describes a method; this
> describes a market. If a tool here is dead, renamed, or repriced, edit this file and change
> nothing else. If you are reading this more than six months after the audit date, verify before
> you trust — and re-date it when you do.

---

## Capability → tool

| Capability | Default | Alternatives | Notes |
|---|---|---|---|
| 1 · Aesthetic direction | `frontend-design` skill (Anthropic, official plugin marketplace) | A hand-written direction brief | Framework-agnostic. Pure visual judgment — pair with #4 for component correctness. |
| 2 · Design data | `ui-ux-pro-max` skill | Public palette and pairing references | Supplies the *data*; #1 supplies the *judgment*. Output is framework-agnostic — translate to your own tokens. |
| 3 · Mockup generation | Google Stitch (MCP) | Claude Design, hand-written HTML | Free tier is generous. Output is static HTML — always translate, never paste. |
| 4 · Component truth | The registry MCP for your library (e.g. `shadcn` MCP) | Reading installed source | The single highest-value capability for correctness. |
| 5 · **Browser loop** | Playwright MCP (official plugin) | Puppeteer MCP, human screenshots | **Mandatory.** Requires a running dev server — the tool does not start one. |
| 6 · Systematic audit | `design-audit` skill | The 14-dimension list, by hand | Visual scope only. Never let it touch logic. |
| 7 · Typography | `typography` skill | The rules card in `CAPABILITIES.md` §7 | Auto-applies to generated code once enabled. |
| — · Theme editing | tweakcn (`tweakcn.com/editor/theme`) | Editing CSS variables directly | No account needed for the editor and the code export. Exports a whole file — **merge selectively**, don't clobber existing custom utilities. |
| — · Image generation | Any current image model | Stock, or commissioned art | For hero images, OG cards, illustration, placeholder content. Never for component code. |

---

## Setup by AI

### Claude Code

Skills and MCP servers, mostly one command each.

```bash
# Skills: install from the plugin marketplace
/plugin            # browse and enable: frontend-design, ui-ux-pro-max, design-audit, typography

# Browser loop
/plugin            # enable the playwright plugin (user scope)

# Component truth — project-scoped MCP, in <project>/.mcp.json
{
  "mcpServers": {
    "shadcn": { "command": "npx", "args": ["shadcn@latest", "mcp"] }
  }
}
```

Invoke a skill explicitly with the `Skill` tool rather than relying on auto-activation. Auto-
activation is description matching and it is best-effort; for a design-critical step, invoke by
name.

### Cursor

MCP servers go in `.cursor/mcp.json`, same JSON shape as above. Skills have no direct equivalent —
put the equivalent instructions in `.cursor/rules/` as always-on rules, or paste the relevant phase
file into context when you reach that phase.

### Codex / Gemini CLI / other MCP clients

Any client that speaks MCP can use capabilities 3, 4, and 5 — the config file location differs, the
server definitions don't. Capabilities 1, 2, 6, and 7 are skill-shaped rather than tool-shaped: use
the fallbacks in `CAPABILITIES.md`, which are written to be followed by hand and lose little.

### No MCP at all

The method still runs. You lose mockup generation and the browser loop; you gain a human in the
screenshot path. Say this out loud at G0 so the human knows what they are trading, and expect
implementation to take longer and land less accurately.

---

## Verification calls for G0

G0 does not close on "installed." It closes on output. One call each:

| Capability | The call | Passes when |
|---|---|---|
| 1 | Invoke the direction skill on "a settings page for a hospital scheduling tool" | You get a named direction with a rationale, not a component list |
| 2 | Ask for three font pairings for "calm, clinical, trustworthy" | Specific named families, with reasons |
| 3 | Generate one throwaway screen, then retrieve it | The screen comes back with markup |
| 4 | Fetch the interface of one component the project already uses | Props match the installed version |
| 5 | Navigate to the dev server and screenshot | You get an image |
| 6 | Audit any existing screen | Findings, grouped by severity |
| 7 | Generate a line of UI copy with a quote and a dash in it | Curly quote, em dash |

Record the results in `design/DESIGN-STATE.md` in the shape shown at the end of `CAPABILITIES.md`.

---

## Known gotchas

**Mockup generation is slow.** Expect one to five minutes per screen. Do not retry on timeout —
retrying orphans the first generation and burns quota. Poll for the result instead.

**Mockup output is a picture, not code.** It is static HTML with inline styles and invented content.
Translate it into the project's components. Pasting it is how a codebase acquires a second,
undocumented styling system.

**The browser tool does not start your dev server.** Start it first, confirm it is listening, then
navigate. A blank screenshot is usually a dead server, not a broken layout.

**Prefer the accessibility tree over screenshots for structure.** It is cheaper, deterministic, and
tells you what a screen reader sees. Screenshots are for visual judgment — spacing, colour, weight —
and nothing else.

**Registry components may target a different primitive set.** Component code from public galleries
and older generators frequently targets whichever primitive library was dominant when it was
written. Check before adapting, and convert deliberately rather than by find-and-replace.

**Theme exports overwrite.** Visual theme editors export a complete stylesheet. Merge the token
blocks; do not replace the file, or the project's custom utilities disappear silently.

---

## Evaluated and not adopted

Kept so the same evaluation isn't repeated every six months. Re-open any of these only with a
concrete reason.

| Tool | Status | Why |
|---|---|---|
| Figma Dev Mode MCP | Skipped | Genuinely powerful — real design data and token variables. Free tier is a handful of tool calls per month; useful access needs a paid seat. Worth it *only* if the team already works Figma-first. |
| Third-party UI generators (v0, Lovable, Bolt, and similar) | Not adopted | Capable, but pricing and output conventions move constantly, and generated code usually targets a different primitive set than the project. Nothing beat the free integrated option for mockups. |
| Community component galleries | Browse-only | Excellent for inspiration — layouts, hero sections, pricing tables, motion patterns. Treat imported code as a starting sketch, and convert it deliberately to the project's primitives. |
| Aesthetic-extreme designer plugin suites | Superseded | Same "commit to a direction" idea as capability #1, but unofficial and unmaintained. Running two of them races on auto-activation and produces incoherent directions. Pick one. |
