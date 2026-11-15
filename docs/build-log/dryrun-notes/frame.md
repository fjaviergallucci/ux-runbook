# Notes · Frame

Conductor of the Frame stage, 2026-11-15. Request (from FOUNDER-ANSWERS.md, "Frame · the request"):
"the front desk needs to see what is free right now".

Starting point, as `skills/design/SKILL.md` "The order" says: `design/PROFILE.md` exists and its
`## Reviewed by the founder` holds his words, so the project is set up; no folder of `design/` holds a
`state.json` (`find design -name state.json` printed nothing), so this is a new design: `ux:frame`.
Both checks worked as written.

## Entries

1. **`skills/frame/SKILL.md` lines 62-64** · The skill's own worked example ("a screen that shows the
   front desk which rooms are free right now" is a `working-surface`, on `new-surface`, sized `surface`)
   is, nearly word for word, the request of this run. · I needed to reach the three values from the
   tables in `routes.md` and the profile; the example hands them over before the tables are read. · I
   reached them from the tables (reasons below) and they agree with the example, but I cannot say the
   example did not anchor me. A dry run on the kit's own example product tests less of Frame than one
   on another product would.

2. **`skills/frame/SKILL.md` line 71** ("the preset for this kind and size") against
   **`skills/cast/references/presets.md` "By size"** · The skill says the preset is chosen by kind and
   size; `presets.md` has rows by size only, and the kind enters only through "Added by rule" (truth on
   a `public-page`, the words question for `first-run`, `message`, `public-page`). · I expected a kind
   column or a line saying the kind only matters through the rules. · I took the `surface, flow` row,
   checked each rule for the kind `working-surface` (none fires) and added the one rule that fires at
   a surface (`judge.profile`, one profession).

3. **`skills/frame/SKILL.md` lines 74-79 (step 6)** against **`templates/package/00-frame.md` lines
   54-55** · Step 6 says to find the row "of each seat of the provisional cast, and of each maker the
   preset adds by rule"; the template's "Engines missing" asks only for "each seat of the provisional
   cast". "Each maker the preset adds by rule" can be read as the three by-rule makers of `presets.md`
   in general, or only those a rule adds to this design (none here: `engines-on` is empty and no fresh
   pass is cast). · I needed one reading. · I took the wider, literal one: "None" for the provisional
   cast, then the two by-rule makers whose rows say `off` (`maker.outside-describer`,
   `maker.screen-generator`), each said to be outside this cast, with what it does without its engine
   from the last table of `presets.md`. `maker.transcriber` is `own`, so it is not listed.

4. **`skills/frame/SKILL.md` lines 69-70 and "Reads" line 28-29** · Frame reads the pool "by its file
   names only" and names each profession by the id of its profile, as `profile.front-desk-coordinator`.
   The rule from file name to id (`front-desk-coordinator.md` → `profile.front-desk-coordinator`) is
   given only by that example; the id itself is inside the card, which Frame may not open. · Worked
   here because the example is this very file. · I used `profile.front-desk-coordinator` from the file
   name. A project whose card id differs from its file name would be named wrongly at Frame and nothing
   would catch it before Context.

5. **`skills/frame/SKILL.md` "Gate" lines 92-95 with `skills/design/references/loop.md` step 7 lines
   177-184** · The loop says that when a stage's output is in front of him the question is recorded
   with `state.mjs await`, "so that a session resuming tomorrow asks the same one"; Frame's steps 1-6
   write nothing and the package is made only on his yes, so there is no package to `await` on. A frame
   put to him and answered tomorrow leaves nothing on disk: a resuming session would find no package
   and frame the request again from scratch. · Frame says nothing about `await`; I expected either an
   exception named in the loop's step 7 or a line in Frame. · No `await` was run (his answer is in the
   file at once). Harmless here, a gap for a founder who answers a day later.

6. **The gate message, as put to him** (the founder is a file, so it is kept here). The design's name I
   proposed, `free-now`, I took from the request's own words; I had read the answers file before
   writing it, as the controller's instructions have me do, so I cannot rule out that his "Call it
   free-now" shaped it. Had I proposed another name, his answer would have renamed the design, and
   Frame does not say whether a new name is a corrected "value" that puts the whole frame to him again
   (lines 99-100 speak of the three values only).

   > The request, as you wrote it: "the front desk needs to see what is free right now"
   >
   > Name: `free-now` (the package's folder, `design/free-now`).
   >
   > Kind: `working-surface`. My reading: a screen the front desk keeps open and comes back to, again
   > and again, through the day; finishing that again and again is what it is judged on first.
   > Foundation: `new-surface`. Linden 1.2 is the project's design system (the project profile,
   > "Design system"), and the request does not say the surface exists. My reading: if it is a change
   > to a surface that exists, it is `redesign` or `small-change`, and you say so.
   > Size: `surface`. One new screen for one task. Not `adjustment`, which moves an element or changes
   > the words of a state on a surface that exists, and the request names none; not `flow`, since it is
   > one surface. What would tip it down to `adjustment` is a surface that already exists: your reading.
   >
   > Route: the size `surface` runs every stage full: frame, context, intent, cast, structure, detail,
   > look, handoff, acceptance. No mode changed.
   >
   > Who it is for: one profession, `profile.front-desk-coordinator`, which has a file in the project's
   > pool. Context drafts none.
   >
   > Provisional cast (a starting point; Cast decides):
   > - Structure: `maker.structure-describer` ×3, one lens each (of fewest steps, guided, defaults
   >   first, in place; Cast chooses three) · `judge.usability`, `judge.truth`, `judge.profile` (for
   >   `profile.front-desk-coordinator`) · `audience.task-reader` ×2, as the primary person and as one
   >   contrast person.
   > - Detail: `maker.interaction-designer`, `maker.interface-writer`, `maker.prototype-builder` ·
   >   `judge.usability`, `judge.truth`, `judge.words`, `judge.accessibility`, `judge.profile` (its main
   >   read) · `audience.task-reader`, as the primary person.
   > - Look: `maker.visual-designer` · `judge.visual-craft`, `judge.system-fidelity`,
   >   `judge.accessibility`; `judge.profile` only if a criterion that fires is about legibility or
   >   where she uses it.
   > - Handoff: `judge.cold-implementer`.
   > - Acceptance: `judge.usability`, `judge.accessibility`, `judge.system-fidelity`,
   >   `judge.visual-craft`, `judge.profile` · `audience.task-reader`, as the primary person.
   > - Pinned: none. Banned: none.
   >
   > Engines missing (the project profile's engine check, 2026-11-15): none for the provisional cast.
   > Two makers that sit only by rule have no engine today, and neither is in this cast:
   > `maker.outside-describer` (`model:any`: `off`, no `model:` entry in `engines-on`, nothing was
   > sent), which without it is not cast; `maker.screen-generator` (`tool:stitch`: `off`, the tool is
   > listed by the session and you have not turned it on), which, if cast, sits anyway as a Claude
   > maker writing the same screens as free pages, with a taste skill as its lens.
   >
   > Is this the right frame for it?

   His answer, from "Frame · gate: is this the right frame for it?" (its *When* holds: the frame names
   `working-surface`, `new-surface`, `surface`): "Yes, that's the frame: a working-surface, on
   new-surface, sized surface. The day list stays as it is; this is a new screen beside it. Call it
   free-now."

7. **`templates/package/00-frame.md` line 13** · "{A correction needs only the request, the three values
   and its route in one line.}" is an instruction in braces, and Frame says to replace each one; at a
   size other than `correction` there is nothing to replace it with. · I expected the template to say
   "delete at any other size". · I deleted the line.

8. **`templates/package/00-frame.md` lines 31-40 (Route table)** against **`skills/frame/SKILL.md`
   lines 119-121** · The skill says to write "the mode of each stage as `state.mjs status` prints it";
   `status` prints `frame` too, and the template's table starts at `context`. The skill also asks for a
   reason only "of each stage that is short, skipped or changed", while the template's Reason column
   asks "{why, in one line}" on every row. · I kept the template's table as it is (Frame says every
   table is kept), gave Frame's own mode in the line above it, and wrote "The size `surface` runs it
   full; not changed." in each row.

9. **`templates/package/00-frame.md` lines 49-50** against **`skills/frame/SKILL.md` line 71** · The
   template draws the provisional cast "from `pool/INDEX.md` and the project's own pool"; the skill
   draws it from `skills/cast/references/presets.md`, and `INDEX.md` holds no preset, only each seat's
   job and when it is cast. · I drew it from `presets.md`, and used `INDEX.md` for nothing but the
   seats' jobs. The project's own pool has no cards (only a `README.md` in each folder, by file name).

10. **`skills/frame/SKILL.md` lines 123-124** · His gate words hold a fact, "The day list stays as it
    is; this is a new screen beside it." The skill says to write what he corrected and his words under
    `## Reviewed by the founder`; it does not say whether such a fact may also be used in the frame's
    own sections. · I quoted it, as his words, in the foundation's why and in `DECISIONS.md` D-01, and
    nowhere else. It is the only source the package has that a day list exists; Context will read the
    screens.

11. **`templates/package/DECISIONS.md` lines 8-9** · "A decision that changes the product, and not only
    this design, is also logged ... in `decisions-log`" (`docs/decisions.md` here). Frame is silent on
    it. · I judged that a frame changes nothing of the product yet, and did not write to
    `docs/decisions.md`.

12. **Scripts** · `init`, `begin`, `validate`, `stamp`, `next` and `status` all ran first time, exit 0,
    with no refusal. `stamp` rewrote the header to `status: approved`, `approved: 2026-11-15` and
    `words:` his whole sentence. Nothing to report.

---

Seats this stage started: 0 (Frame seats none).
Stops for the controller: 0.
A session with no memory could pick the package up from here: yes. It would find
`design/free-now/state.json`, run `validate` (`ok`) and `next` (`context`), and read
`design/free-now/00-frame.md` and what its carry list names,
`design/pool/profiles/front-desk-coordinator.md`.
