# Notes · context (design/free-now)

Conducted 2026-11-15. Started from the package's state: `validate` printed `ok`, `next` printed
`context`, `status` showed frame approved at version 1 and no open question. `begin` printed "context is
in work".

## Entries

1. **The project judge at `context` and a new surface.** `skills/context/SKILL.md` lines 31-32 ("Reads")
   say a project judge that sits at `context` is "checked first, as step 3 says", with no condition;
   step 3 (line 60) runs only "When the surface exists" (foundation `redesign` or `small-change`).
   Expected: one rule for whether a project's own `context` judge sits on a `new-surface` design.
   Did: read step 3 as the condition for both, so on `new-surface` no card is checked and no judge sits.
   No harm this time: `design/pool/judges/` holds only `README.md`, which `card.mjs --help` says is
   passed over. But on a new surface a project judge that sits at `context` has no place to sit, and
   the skill does not say so.

2. **The answers file foresees questions the skill does not have me ask.** `FOUNDER-ANSWERS.md` has
   step-6 entries for the state words, "is a room ever closed?", "can the desk end cleaning early?", the
   devices and widths, the accessibility target, the analytics, and a step-5 entry for "one profession,
   several, or everyone". `skills/context/SKILL.md` line 89-90 says only a fact with no source becomes
   one of the "Questions for the founder"; and line 102-103 says the people question is answered "as
   the frame says it". Every one of these is sourced on disk: `README.md` ("What it shows today": "always
   in exactly one of three states"; "What it does today": three actions, none ends cleaning; "Where it
   is used": 1280 and 390; "Analytics": none), `docs/design-system.md` (WCAG 2.2 AA), `src/strings/*.json`
   (the state words), `00-frame.md` "Who it is for" (one profession). Did: asked none of them; wrote
   each fact with its source. A conductor who asked them would have got his words ("Never 'occupied',
   never 'available'"), which the skill gives no step to elicit: the founder's vocabulary for states
   reaches the package only if a fact goes unsourced.

3. **"The founder's own words": does a working surface's "she must read in order to act" hold?**
   `skills/context/SKILL.md` lines 124-127: ask when the kind is `first-run`, `message` or
   `public-page`, "or she must read in order to act". The kind is `working-surface`. Expected: a test I
   could apply without judging the design. Did: took it to hold, literally: the standing rule "A state
   is said in words, never by colour alone" (`design/PROFILE.md`, "Standing rules") means she reads a
   room's state word before she gives the room away. A guess: another conductor would write "Not asked"
   here, and the writer's brief would lose his sentence.

4. **A recommendation for a question of fact.** `skills/context/SKILL.md` line 128: "Questions for the
   founder": "each with a recommendation". My three questions are facts only he holds (why now, what
   was tried, what it must not become). A recommendation on their content would be my opinion
   (conductor: "no taste is yours to add"). Did: wrote, as the recommendation, how the answer will be
   written and what the package already holds that bears on it. The template does not say what a
   recommendation is for a factual question.

5. **"Where it belongs and beside its question."** `skills/context/SKILL.md` lines 134-135: "Write each
   answer into the context as it comes, in his words, where it belongs and beside its question". Read
   two ways: in one place, with the question next to it, or in two places. Did: wrote each answer in two
   places, verbatim, under its heading ("The problem, and why now", "Tried and rejected", "What it must
   not become") and under its question in "Questions for the founder".

6. **His gate correction meets more files than his words name.** `skills/context/SKILL.md` lines
   158-159: "Where a correction meets a fact you read, say so at once, with the source: he decides."
   The correction on held meets `README.md` ("always in exactly one of three states"; three actions),
   `docs/decisions.md` D-1 ("free otherwise") and `src/components/status-tag.css` ("a tag for each room
   state the product knows: free, busy, cleaning"). His answer settles only the README by name ("Where
   the README says otherwise, it's out of date: my word stands on both"). Expected: an answer covering
   every file the correction meets, or a step to put the others to him. Did: took "my word stands on
   both" (both corrections) as unconditional, covering D-1 and Linden's tag comment too, and wrote each
   file it meets into "Reviewed by the founder". A guess: a stricter conductor stops here and asks
   whether D-1 gives way too, and the answers file has no heading for that.

7. **A correction leaves a carried project source wrong, and nothing can mend it.** `skills/context/SKILL.md`
   line 48 and line 194: nothing outside `<packages>` is written. `templates/package/DECISIONS.md` line
   8-9: "A decision that changes the product ... is also logged ... in `decisions-log`"
   (`docs/decisions.md`). His correction does not change the product, it says the product's facts
   document is out of date. So `README.md`, the project profile's `facts` and the truth judge's
   reference, still says fifteen minutes and three states, and it is on the carry list as
   `source:README.md`. Expected: a way to carry a source as superseded on named points, or to log the
   stale fact for the project. Did: wrote under "Reviewed by the founder" and in D-02 that where
   `README.md` and the context disagree on these two points the context holds; left `docs/decisions.md`
   alone. A later truth judge handed both gets two answers, and only prose to say which wins.

8. **The gate opens a gap that no step lets me ask about.** The held correction leaves one thing on
   record nowhere: whether a held room is also busy while its booking runs (D-1: "busy while a booking
   runs"; his words: a hold "lets itself go" fifteen minutes "after the booking's start"). The gate is
   "that one message from him" (line 154-155), and the questions of step 6 come before it. Did: wrote it
   as "Not on record" under the inventory and in D-02's cost, and asked nothing. It will come back at
   Intent or Detail as a state nobody defined.

9. **What he says of the profession does not reach its profile.** Lines 160-161: only "what he corrects
   of a profession's profile" is written into its file. His step-6 answers describe her ("between two
   calls", "scrolls the day and does sums in her head", "several times before ten"), and his gate
   answer gives the desk's own words ("held", "apartada"). None is a correction of the profile, and he
   said "The profile stays a guess". Did: left `design/pool/profiles/front-desk-coordinator.md`
   unchanged; the words sit only in `01-context.md`. A profile judge at a later stage, handed the
   profile and not the context, will not have them.

10. **The template's first heading speaks of a cast that does not exist yet.**
    `templates/package/01-context.md` lines 18-19: "what the cast's judges found reading it as it is".
    At Context no cast sheet exists (`skills/context/SKILL.md` line 84: "No cast sheet exists yet").
    Not reached here (new surface), but a redesign's conductor would look for a cast that is not there.

11. **No place for what the product does not have.** The template's inventory (lines 30-37) holds what
    the product "can show and do"; the skill's "Never" (line 191-192) says never list what it cannot do
    as if it could. The truth judge needs the absences too (no room sensor, D-1; no action that ends
    cleaning; no analytics). Did: added a short list under the table, "What the product does not
    have". Not a template section.

12. **The carry list: what Intent needs, without reading Intent.** Lines 162-165 ask for "a section of
    the frame that Intent needs", with the example `frame@1#who-it-is-for`; the conductor forbids
    reading any other stage's skill. Did: carried `who-it-is-for` (the example) and
    `kind-foundation-size` (a guess: the kind looks like something Intent would weigh). Also guessed
    that the project kit is a project source: line 130-131 says "A file you leave out is closed to
    every later stage", and nothing says whether `design/kit/` counts. Carried `design/kit/kit.css` and
    `design/kit/parts.html`. The stamp accepted all 16 entries.

13. **The project profile says "Three." over four rules.** `design/PROFILE.md` line 55: "His standing
    rules ... in his words ("Three.")", then four, the fourth "Added at the setup gate". Not the kit's
    doing at this stage; a later conductor counting rules may stumble. Did: listed all four under
    "Constraints".

What went without a hitch: `begin`, `await` and `stamp` each did what `--help` says, on the first try;
`validate` printed `ok` before and after; `slug` gave `who-it-is-for` and `kind-foundation-size`.

Seats this stage started: 0 (the foundation is `new-surface`, so step 3, the read of the surface as it
is, did not run).
Stops for the controller: 0.
Could a session with no memory pick the package up: yes. It runs `state.mjs validate`, `next` (prints
`intent`) and `status`, then reads `design/free-now/01-context.md` and what its `## Carry` names; the
last entry of `DECISIONS.md` (D-02) gives the two corrections that override `README.md`.
