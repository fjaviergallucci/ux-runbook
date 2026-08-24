# Anti-patterns

Two lists. The first is about design; the second is about the AI running the method, which is a
different and sneakier failure mode.

---

## Design anti-patterns

| Anti-pattern | Why it fails | Instead |
|---|---|---|
| **Listing UI components in a mockup prompt** | You designed the screen; the tool rendered it. You get your own assumptions back with better spacing and zero design thinking you didn't already have. | Describe the person, their workflow, and their frustration. |
| **Specifying the layout** | "Grid," "split view," "bento" — same failure one level up. The layout is the design decision you were trying to outsource. | State the data and the priority order; let layout follow. |
| **Copying a competitor's screen** | You inherit their constraints, their user, and their compromises — none of which are yours. It also guarantees you can't be better, only similar. | Design for *your* persona's workflow. Look outside the category for form. |
| **Designing for everyone at once** | Diluted priorities produce a wall of equally-weighted cards. Nobody's job is easy. | One persona per surface. Others are accommodated, not centred. |
| **Starting from visual style** | Aesthetics before function produces a beautiful screen that doesn't do the job — and it's much harder to admit that after the palette is agreed. | Workflow first. Style expresses it. |
| **Prescribing colours and fonts in prompts** | Collapses the creative range to your first instinct and reads as generic. | Encode the direction as a design system once; describe feeling, not values. |
| **"Unlimited," "seamless," "intuitive," "simple"** | Words that describe an absence. They tell nobody anything and quietly excuse skipping the hard specificity. | Say what it does. "Three clicks" beats "seamless." |
| **Lorem ipsum and John Doe** | Hides every layout problem that matters — the 90-character name, the empty field, the nine-digit number. Everything looks fine because the data was chosen to make it look fine. | Real content, including plausible worst cases from the real domain. |
| **Happy-path-only design** | The empty, error, and overflow states are three quarters of the work and all of the frustration. | Enumerate states in the surface brief; design and build each. |
| **Deferring mobile** | It isn't a smaller version of the layout — it's where the layout breaks. Deferring it means rebuilding, not adjusting. | 375px in the same pass, every pass. |
| **Deferring dark mode** | Retrofitting means re-auditing every screen and re-checking every contrast pair. | Define both themes in Phase 2, before any screen exists. |
| **Colour as the only signal** | Roughly one man in twelve can't distinguish your red from your green. Also fails in bright light, on cheap screens, and in print. | Shape, icon, or text alongside colour. Always. |
| **Nudging with hardcoded values** | `margin-top: 7px` is invisible to the theme, invisible to a token change, and invisible to whoever tries to fix it later. | If the system lacks the step, add it to the system. Then use it. |
| **Two design systems** | Happens quietly — a pasted mockup, an imported component — and is invisible until someone tries to change a colour and finds it defined in three places. | Read the existing system first. Extend it; never parallel it. |
| **Fixing an audit finding before the plan is approved** | Scope you added to someone else's work, buried in a diff that was supposed to be about something else. | Present the phased plan. Wait. Execute what was approved. |

---

## AI process anti-patterns

The design list above is about screens. This one is about how the method gets skipped while
appearing to have been followed — which is more dangerous, because it looks like progress.

| Anti-pattern | What it looks like | Why it's the failure |
|---|---|---|
| **The presented-and-proceeded gate** | Showing three variants and starting to implement in the same message. | The gate is the *stop*, not the presentation. This is the single most common way G3 gets skipped. |
| **Approval laundering** | Treating "looks good" on a three-variant message as a selection. | It isn't one. Ask which. Ambiguity is not approval. |
| **Gate inheritance** | "They approved the last screen, so the direction and design are approved for this one." | G2 is inherited by a new surface. G3 never is. Each screen gets its own. |
| **Scaffolding as not-code** | "I'll set up the types and the file structure while they review." | Structure creates commitment. By the time they choose, they're choosing against something half-built. |
| **Confidence as evidence** | "It should render correctly" · "the code looks right" · "this pattern always works." | G4 closes on screenshots and a clean console. Belief is not an artifact. |
| **Assumed capability** | "I configured the tool, so it works." | G0 closes on a call that returned output. Configuration is a hypothesis. |
| **The invented persona** | A persona assembled from domain stereotype rather than from asking. | Produces a fabricated design nobody notices is fabricated until it ships. Ask; don't extrapolate. |
| **The demographic in persona clothing** | "A busy professional who values efficiency." | Makes no design decisions for you. If it isn't surprising, it isn't finished. |
| **Variant flooding** | Rejected at G3, so generating six more against the same brief. | Six more wrong screens. Rejection at G3 usually means Phase 1 was thin — fix the input. |
| **Silent drift** | Each screen a reasonable small exception to the direction. | Ten reasonable exceptions is no direction, and it converges back to the generic average one sensible decision at a time. Name the drift out loud. |
| **The quiet re-decision** | Re-litigating something already in `DESIGN-DECISIONS.md`, usually differently. | Cite the entry. If it genuinely should change, that's a new entry that says it supersedes — not an edit. |
| **The dropped finding** | Audit findings the human deferred, never logged. | "Deferred" and "forgotten" are the same thing unless one is written down. |
| **Skipping the mockup because the tool is missing** | Going straight from direction to implementation. | Moves the whole design conversation into Phase 6, where every change costs real code. Hand-build the mockup. |
| **Batched fixes, single verification** | Fixing eight things, then screenshotting once. | When something broke, you can't tell which fix did it. Re-capture every iteration. |
