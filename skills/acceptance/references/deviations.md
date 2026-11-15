# What becomes of a deviation

Every item of the report that *deviates* is the founder's to decide, one at a time: accepted as
built, or fixed. This page says what you do with each answer. `<kit root>` and `<package>` are as
the skill gives them.

## He accepts it

The build stays as it is, and the design on disk is brought to it: after this, the handoff folder
describes what shipped, and no file of it contradicts another.

1. **Write it in the report,** under "Deviations accepted": what was approved, what was built in its
   place, where, and his words, as he said them.
2. **Log it, twice.** Append it to the package's `DECISIONS.md`, in the shape of
   `templates/package/DECISIONS.md`, numbered after the last entry, which is the one entry of that
   file you read. And append it to the folder's own, `<package>/07-handoff/DECISIONS.md`, in that
   file's shape, written out in full: the folder is what a later builder is given, and it must say
   why the build differs from its pictures. Where the deviation changes the product and not only
   this design, it is also logged where `decisions-log` of the project profile says: the test is at
   the top of `templates/package/DECISIONS.md`, and it is applied to every deviation, not weighed.
3. **Bring the folder's files up to date,** each to what was built:
   - the row of `SPEC.md`: the state, the rule or the line of the data map;
   - the string, in `strings.json` and in the copy in the project's own format, where there is one;
   - the row of `PARTS.md`;
   - the check, in `acceptance.json`: rewritten to hold the build as accepted, never deleted. A
     check of 44 by 44 on a booking action he accepted at 40 by 40 becomes one of 40 by 40;
   - the item in `ACCEPTANCE.md`: its new value, and beside it the line "the build as accepted
     differs from the page this names", with what differs and the day he accepted it.
4. **Run the changed check again,** as steps 4 and 5 of the skill say. The file of that state is
   written again, whole, and the table is built again: the check now passes, on its own terms.
5. **A page of `prototype/` is never redrawn here.** It stays as approved. The report names the page
   that no longer shows what shipped, and the build's picture of that state beside it.

### When `HANDOFF.md` names what changed

"Must not change" of `HANDOFF.md` may name the very thing he has just accepted as changed. It then
says so, beside that item: "the build as accepted differs from the page this names", with what
differs. `HANDOFF.md` is stamped, so it is reopened first, changed, and stamped again. His accepting
the deviation is the yes a reopening needs, and its reason:

```
node <kit root>/scripts/state.mjs reopen <package> handoff --reason "<why>"
```

Write the line beside the item, and his words on the deviation under `## Reviewed by the founder` of
`HANDOFF.md`, below his go. Then stamp it in those words:

```
node <kit root>/scripts/state.mjs stamp <package> handoff --words "<the founder's words>"
```

Handoff now stands at a new version. Write that version into `built-from` of `REPORT.md`, as `status`
prints it: a report built from the old one is refused at its own stamp. Nothing else of `HANDOFF.md`
changes, and no earlier stage is touched: an accepted deviation that makes an earlier stage's output
false is said in the report, and reopening that stage is his to ask for.

## He wants it fixed

1. **Write it in the report,** under "Fixes sent out", by its number in `FIXES.md`.
2. **Write the fix,** in `<package>/08-acceptance/FIXES.md`, from
   `templates/package/08-acceptance/FIXES.md`, like a slice of the handoff: *Context*, what was
   approved and what was built in its place, with the picture of each; *Task*, what to change and
   what to leave alone; *Done when*, a condition someone can see; *Verify*, the check that must
   hold, by its id. Any session can take it knowing nothing else: it is handed `FIXES.md` and the
   handoff folder, and nothing of the package besides.
3. **Do not build it.** Tell him the fix is written, and stop. The stage is not stamped while a fix
   is out. `references/forms.md`, under "A fix that comes back", says how it is checked again.

## A fix the size of a correction

A wrong label, a wrong token or a wrong spacing value in the build, and nothing more, may be put
right by you. It is the one thing Acceptance builds.

1. **Show him a picture of before and after,** and ask, by the `await` of the skill's gate: may this
   be put right so?
2. **After his nod, and never before, make the change:** that one thing, in the file `BUILD.md`
   names, and nothing beside it.
3. **Drive its state again,** as steps 4 and 5 of the skill say, and bring the item's row of the
   report up to date: "corrected here, after his nod", with his words.

If it turns out to touch more than a label, a token or a spacing value, stop: it is a fix, and goes
out in `FIXES.md`.
