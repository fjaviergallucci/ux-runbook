### Task 3: The walkthrough format and the grey kit

Implements § 4.4 (the strict format) and § 12 (the shared kit).

**Files:**
- Create: `scripts/lib/walkthrough.mjs`, `kit/KIT-CONTRACT.md`, `kit/grey/kit.css`, `kit/grey/parts.html`
- Create: `tests/fixtures/proposals/unified-list.json`, `free-first.json`, `calendar.json`
- Test: `tests/walkthrough.test.mjs`

**Interfaces:**
- Produces: `ROLES = ['heading','text','choice','input','action','list','status','media','link','nav']` ·
  `CONTAINERS = ['region','group','expansion']` · `validate(proposal): string[]` (empty when valid; each
  error names the path, e.g. `screens[1].items[0]: unknown role "card"`).
- A proposal:

```
{ "name": string, "bet": string, "cost": string, "absent": string[], "hardest": string, "firstIdea": string,
  "screens": [ { "id": kebab, "title": string, "container": "screen" | "dialog", "over"?: screen id,
                 "note"?: string, "items": Item[] } ] }
Item = { "role": ROLE, "text": string, "id"?: kebab, "note"?: string, "primary"?: boolean, "options"?: string[] }
     | { "container": CONTAINER, "label"?: string, "open"?: boolean, "items": Item[] }
```

  Extra top-level keys `author`, `engine`, `track`, `model`, `source` are allowed (the merge strips them).
- The kit contract — the class names a project kit must also style: `ux-frame`, `ux-screen`, `ux-dialog`,
  `ux-region`, `ux-group`, `ux-expansion`, and `ux-<role>` for each role; `ux-action.is-primary`;
  `ux-note` for a designer's note.

- [ ] **Step 1: Write the three fixtures.** A fictional room-booking surface, "today", for a front-desk
  worker who asks "is anything free right now?" (the example version 1 used; read
  `git show master:reference/EXAMPLE/surfaces/today.md`). Three structures that differ in kind: one
  unified list; free rooms first in a leading region; a calendar grid. Two screens each, real words,
  `"track": "system"`.
- [ ] **Step 2: Write the failing tests:** each fixture validates to `[]`; an item with role `card` gives
  one error naming its path; a screen with `container: "sheet"` gives an error; a `dialog` whose `over`
  names no screen gives an error; a proposal with no `bet` gives an error; a nested
  `group → expansion → item` validates; `primary: true` on a role other than `action` gives an error.
- [ ] **Step 3: Run them.** → FAIL.
- [ ] **Step 4: Implement `validate`.**
- [ ] **Step 5: Write the grey kit.** `kit.css`: greys only, one system font stack, no colour beyond a
  single mid-grey for the primary action, a light and a dark set under `prefers-color-scheme`, no motion.
  `parts.html`: one specimen of every class in the contract, labelled. `KIT-CONTRACT.md`: the class list
  above, one line each on what it must convey, and the rule that a project kit restyles these classes on
  the project's token file and adds none.
- [ ] **Step 6: Run the tests.** → PASS (7 tests).
- [ ] **Step 7: Commit.** `git commit -m "feat: the walkthrough format and the grey kit"`.

