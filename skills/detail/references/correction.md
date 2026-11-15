# A correction at Detail

A design sized `correction` is one wrong thing put right: a label, a token or a spacing value. Its
route runs four stages, each in its short form, and this page is Detail's. It costs one nod, and the
nod is asked here: Frame stated its line and asked nothing. What a correction is, and when it stops
being one, is the conductor's: `skills/design/references/routes.md`, under "A correction".

`<kit root>` and `<package>` are as the skill gives them, and every command is run from the project's
root.

## What does not happen

- **No seat is cast.** No maker, no judge, no audience and no brief: none of the skill's steps 3 to 8
  is run.
- **Nothing is designed.** One thing changes, and everything else on the screen stays where it is.
- **If it turns out to touch more** than a label, a token or a spacing value (a state, the structure,
  another surface), stop, say so to the founder, and resize, as the conductor's "Resuming" says.

## Steps

1. **Begin,** as step 1 of the skill says, with the same command.
2. **Copy the template** to `<package>/05-detail/DETAIL.md`, and write `built-from` as the route gives
   it: the frame alone, `[frame@<version>]`, since no other stage ran before this one.
3. **Write the one thing changed, as "is → becomes",** under "What is in this folder": what it is
   today, what it becomes, and where, by its screen, its element and the file that holds it. As: the
   booking action reads "Reserve" → "Book room", on today, in the free rooms list. Every other heading
   says "Unchanged by this correction".
4. **Keep the before-and-after picture in `<package>/05-detail/correction/`.** Two pictures of the
   same place: the screen as it is, and the same screen with the one thing changed and nothing else.
   The plain way is two static copies of that screen, `before.html` and `after.html`, photographed
   by the kit's script at the width she uses:

   ```
   node <kit root>/scripts/shots.mjs <package>/05-detail/correction/before.html <package>/05-detail/correction/after.html --out <package>/05-detail/correction --widths <primary>
   ```

   You make these two yourself: a correction is the one size where the session that conducts may
   also do the work.
5. **Build the page.** Write `<package>/05-detail/decision.json` in the shape of
   `templates/outputs/decision-approve.json`: one option, its two pictures named from the page, the
   one before first, as `correction/before-1280-light.png`, and its line the "is → becomes" of step
   3; `"seats": []`, since no seat read it; one recommendation, with its one sentence of reason; one
   question.
   Its identity is as `status` prints it, its stage as the loop counts it: 2 of 4. Build it with
   the `page.mjs` command of step 9 of the skill.

## The gate

**One nod.** Put the page in front of him, and record the question with the `await` of the skill's
gate. One question, about one thing: may this be changed so? **Stop: nothing is changed in the
product before his nod.** Frame's line goes beside the page, as `<package>/00-frame.md` has it: the
request, the three values and the route. His nod is on both.

- **If he disagrees with the line itself,** that answer is not a nod: it is not a correction, or not
  of this kind. Write what he said under `## Reviewed by the founder`. If he names a larger size,
  resize the design to it, as the conductor's "Resuming" says. Then reopen Frame, which closes this
  question and puts Detail back in work:

  ```
  node <kit root>/scripts/state.mjs reopen <package> frame --reason "<his words>"
  ```

  Then the design is framed again, by Frame's skill. If what he disputes is which screen it is, or
  what kind of thing, this package is left as it stands, since its kind and its foundation were
  fixed when it was made, and the design is framed anew under a new name. Nothing is changed in the
  product.
- **Write the one-paragraph record** under `## Reviewed by the founder`: what was wrong, what it is
  now, where, and his words, as he said them.
- **Write the carry list:** the lines of the frame's own carry list, as they are, and a
  `- source:<path>` line, from the project's root, for each of the two pictures.
- **Stamp it,** with the `stamp` of the skill's gate, in the words of his nod, and append the decision
  to the package's `DECISIONS.md`.
- **After his nod, the session that conducts may make the change itself.** That is the build: Handoff
  and Acceptance, each in its short form, say how it is handed over and checked.
