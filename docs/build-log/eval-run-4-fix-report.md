# After evaluation run 4 — the fix, report

**Status: DONE_WITH_CONCERNS.** There is one concern: the template wording differs from the diagnosis's
text, because a kit rule refuses that text (row 1). `claude plugin eval` was not run, nothing was
installed, no sub-agent was started and nothing was pushed.

## The three items

| Item | Files changed | What changed | Test added / pin changed |
|---|---|---|---|
| 1. `brief-has-no-design`: the kit's fault (R193, keeping R160) | `templates/package/04-structure/BRIEF.md`, `templates/package/04-structure/BRIEF-fresh.md`, `tests/skills.test.mjs` | "The hardest state" now says each state is named by what has happened, never by what she is told in it. The selection by a written rule stands as R160 wrote it. | **Pin changed** at `tests/skills.test.mjs:6202`. It now holds "Every state the intent says she must be told about, one line each, named by what has happened, never by what she is told in it:". The old R160 phrase is the start of that sentence, so it is still held. "The rule selects them: none is weighed, and none is left out." is unchanged. The comment names R193. |
| 2. `resume-from-disk`: the case's fault | `evals/resume-from-disk/graders/validate-run.md`, `evals/resume-from-disk/graders/next-run.md`, `tests/evals.test.mjs` | Both `input_match` patterns are now exactly as the diagnosis gives them: the verb may come before or after `state.mjs`, inside the one JSON string. | **Test added:** the loop `for c in validate next status; do node /kit/scripts/state.mjs $c design/today; done` joins both graders' samples. One more line asserts that `{"command":"node …/state.mjs status design/today","description":"validate it, then next"}` matches neither pattern. That line keeps the closing of Task 19's N1 from being undone silently. |
| 3. `fresh-brief-hides-the-system` and `brief-has-no-design`: the cases' fault | In both cases: `graders/gives-the-tasks.md`, `graders/names-the-person.md`, `graders/says-what-the-product-can-do.md`. Also `tests/evals.test.mjs`. | Each pattern is now exactly as the diagnosis gives it: `walked\s+in`, `Sala\s+Jard[ií]n`, `front\s+desk`, `being\s+cleaned`. | **Test added** in `atTheBrief`: each of the four section graders must match the sound sample with every line broken between every two words (headings left whole). |

### Row 1: why the wording differs from the diagnosis

The diagnosis's text is 235 characters over three lines. `tests/templates.test.mjs:149` ("an instruction
in braces is at most two lines … and no lesson", with at most 210 characters) failed on it, in both files. I
did not move that pin, because R193 does not change that rule. The text as committed:

```
{Every state the intent says she must be told about, one line each, named by what has happened, never by
what she is told in it: the list is empty. The rule selects them: none is weighed, and none is left out.}
```

- **Kept word for word:** the ruling's clause, both R160 phrases, and one example, "the list is empty". R193
  and the diagnosis share that example.
- **Dropped:** the example "it has two hundred rows". The intent's own "Overflow" row still carries that case.
- **Size:** exactly 210 characters, on two lines of 105 and 104 columns. Prose lines of 105 columns already
  exist in both files.
- **Choice open to the controller:** to keep both examples, the 210-character rule has to change, or the
  examples have to move elsewhere.

### Row 1: where else the instruction might be given

- **The Structure skill and its seats page:** they do not give it. `skills/structure/SKILL.md` step 3 says only
  "from the intent". `skills/structure/references/seats.md` names no states for a maker's brief. Nothing was
  changed there.
- **`skills/design/references/blind.md:33-36` and `skills/design/references/fresh-pass.md:24`:** they name "the
  hardest state" and nothing more.
- **A kit-wide search** for "what it must tell her", "must be told" and "let her do" found these, and none is a
  Structure brief:
  - `templates/package/02-intent.md:51` and `skills/intent/SKILL.md:98`: the intent's States table, where that
    column belongs.
  - Detail (`skills/detail/references/seats.md`, `templates/package/05-detail/states.md`) and Look
    (`skills/look/references/fresh.md`, and the Look form of `BRIEF-fresh.md`, "Its state: … and what she is
    shown in it"). Both hand states to makers once the structure is picked and approved, so writing what she
    is shown there is right.

None of these was changed.

### Rows 2 and 3: patterns checked on the evidence

I checked the patterns with a script in the scratchpad that prints only true/false, never a brief's or a
trace's text.

- **The five briefs the runs kept as `criteria` evidence** (run 2 ×2, run 4 ×2, the `brief-has-no-design`
  re-run ×1): the new patterns match all five.
- **The old patterns:** they fail exactly where the runs reported a failure, on run 4's fresh brief and on the
  re-run's brief. Those are the two briefs the diagnosis quotes. The new patterns pass both.
- **The two bare templates:** no match, under old and new patterns.
- **The sound sample** (`evals/no-pick-without-the-founder/.../04-structure/BRIEF.md`): it matches.
- **The re-run trace** (`/tmp/claude-1000/claude-eval-QSM93E/out/trace.jsonl`): its one Bash call does not
  match the old patterns and does match the new ones.
- **The form of run 2's chained call, and the loop with its escaped `echo \"== $c\"`:** both match.
- **The four existing sample commands at `tests/evals.test.mjs:468`:** they match.

### Hand-mutations

I changed each new condition once, saw its test fail, and put it back:

- Dropping the verb-first alternative made the loop fail (`validate-run`).
- Letting the step run past the end of the JSON string (`.*?`) made the description sample fail (`next-run`).
- Putting the literal space back in `being cleaned` made the wrapped brief fail.

**One limit:** `names-the-person` matches the wrapped sample even under its old pattern, because the sample's
person section has "clinic" in it. So the wrapped-brief test checks `gives-the-tasks` and
`says-what-the-product-can-do`, but does not check `names-the-person`'s `\s+`.

## Not done

- **`nothing-reopened`:** I did not widen it to the verb-first order. The diagnosis calls that optional (a
  blind spot that lets a run through, not one that fails it), and the controller's requirements do not ask
  for it.
- **The proof run:** the next run of `brief-has-no-design` should show `criteria` PASS on a hardest state
  written as conditions. It is still owed: it is paid, and the founder holds the cap.

## Found, not mine to fix

- **`asks-one-question`** (the re-run's two-sentence either/or question): the diagnosis counts it as noise. I
  did not touch it.
- **Commit trailers:** the dispatch gives `Co-Authored-By: Claude Fable 5.2`. This session is Claude Opus 5.5,
  and the session's own attribution says so, so both commits carry `Co-Authored-By: Claude Opus 5.5
  <noreply@anthropic.com>` and the dispatch's `Claude-Session` line. Commit 6baebc7 on this branch did the
  same.

## Verification

- `node --test tests/skills.test.mjs`: 147 pass. `tests/templates.test.mjs`: 49 pass.
  `tests/evals.test.mjs`: 17 pass. Before the graders changed, the new evals samples failed 3 tests, as
  intended.
- `NODE_OPTIONS=--dns-result-order=ipv4first npm test`: exit 0. 912 tests: 911 pass, 0 fail, 1 skipped
  (the skip this mount always has).
- `claude plugin validate . --strict`: exit 0. The one warning is the icon warning that was already there.
- `git status --short`: clean.

## Commits

- `54d0933` fix: a Structure brief names a state by what has happened, never by what she is told
- `c3ca029` test: three evaluation graders take a wrapped line and a looped command
