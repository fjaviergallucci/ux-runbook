# Evaluation run 4: why three cases scored below 1.00

Run 4: log `eval-run-4.log`, results `evals/results/2026-11-15T18-35-30-194Z/`. The aggregate keeps,
for each run, the graders' verdicts, the judges' votes (no reasons) and the judged text as `evidence`.
It does not keep the trace: run 4 used no `--keep-temp`, and its three trace paths under `/tmp` are
gone. I re-ran two cases once each, with traces kept:

| Re-run | Results | Kept trace | Score |
|---|---|---|---|
| `resume-from-disk` | `evals/results/2026-11-15T18-53-25-020Z/` | `/tmp/claude-1000/claude-eval-QSM93E/out/trace.jsonl` | 0.67 |
| `brief-has-no-design` | `evals/results/2026-11-15T18-57-03-854Z/` | `/tmp/claude-1000/claude-eval-VoYC3z/out/trace.jsonl` | 0.63 |

None of these three cases' files changed after 3f33a65 (`git diff --stat 3f33a65..HEAD -- evals`
touches only the cold-implementer fixture). Every difference therefore comes from the kit, or from
chance in the session.

| Case | Verdict | Fix |
|---|---|---|
| `resume-from-disk` | **case** | `validate-run` and `next-run` accept the verb before or after `state.mjs`, inside the one command string |
| `fresh-brief-hides-the-system` | **case** | `gives-the-tasks` matches across a line break (`walked\s+in`, `Sala\s+Jard[ií]n`); the same fix goes into `brief-has-no-design` |
| `brief-has-no-design` (`criteria`) | **kit** | the hardest-state instruction of both Structure briefs names each state by what happened, never by what she is told (c0d6bd4, R160) |

---

## 1. `resume-from-disk`, 0.78: the case's fault

**What failed.** `validate-run` and `next-run` reported "Bash called 0x (expected 1..∞)".

**What the graders expect.** `evals/resume-from-disk/graders/validate-run.md`, `input_match:
'state\.mjs.*validate'`, and `next-run.md`, `'state\.mjs.*next'` (both from 5928102). "Bash called
0x" counts the Bash calls that *match* the pattern, not all Bash calls. In run 2, `nothing-reopened`
said "Bash called 0x" in a run whose trace (`/tmp/claude-eval-eCvojW`) holds one Bash call. Each
pattern needs the verb to come *after* the script's name.

**What the session did** (the re-run's trace, line 9). It ran both commands, in one loop that puts the
verbs *before* the script:

```
cd …/evals/resume-from-disk/fixture && ls -R | head -50 && for c in validate next status; do echo "== $c"; node ../../../scripts/state.mjs $c design/today; done
```

Their output is in the result (line 10): `== validate` / `ok` / `== next` / `cast` / `== status` …
After `state.mjs` the call's JSON holds only `$c design/today; done` and the description "List the
project and ask the package state". So neither pattern matches, although both checks ran.

**Run 4 was the same.** Its trace is gone, but its reply is the reply of a session that ran the
checks: "All the checks on the design's files pass. Frame, Context and Intent are approved, and the
next stage is **Cast**. No question is open." The re-run reproduced the 0x with the trace kept. In
run 2 the session chained `state.mjs validate …; node $K/scripts/state.mjs next …`, and both matched.

**The kit is behaving rightly.** `skills/design/SKILL.md:86-89` and `:152` ("Run `validate`, `next`
and `status`, as in 'Before a stage'") are unchanged since 3f33a65, and the session ran exactly those
three. The rest of the re-run held too: one heading named, no cast written, nothing reopened, and
`criteria` PASS ×3.

**The change to the case.** Accept the verb on either side of the script, inside one JSON string:
`(?:[^"\\]|\\.)*?` steps over the command's escaped quotes but stops at the end of the `command`
value. A description therefore cannot meet the pattern, which also closes Task 19's deferred minor N1.

`evals/resume-from-disk/graders/validate-run.md`:
```
input_match: 'state\.mjs(?:[^"\\]|\\.)*?\bvalidate\b|\bvalidate\b(?:[^"\\]|\\.)*?state\.mjs'
```
`evals/resume-from-disk/graders/next-run.md`:
```
input_match: 'state\.mjs(?:[^"\\]|\\.)*?\bnext\b|\bnext\b(?:[^"\\]|\\.)*?state\.mjs'
```

I checked both in Node:

| Input | Old patterns | New patterns |
|---|---|---|
| The re-run's loop call | no match | match |
| Run 2's chained call | match | match |
| `tests/evals.test.mjs:468`'s four sample commands | match | match |
| `{"command":"node …/state.mjs status design/today","description":"validate it, then next"}` | match (wrongly) | no match |

In `tests/evals.test.mjs:468`, add the loop form to the samples:
`for c in validate next status; do node /kit/scripts/state.mjs $c design/today; done`.
`nothing-reopened` has the same order blind spot, but in the forgiving direction (a loop over
`reopen` would slip past it), so it is optional to widen it the same way.

**Seen in the re-run, apart from the three failures.** `asks-one-question` failed: "found 2 matches
(expected 1)". The session asked "should Context be reopened so that practitioners are added as a
second profession? … Or does Context stand as approved, with the desk only?", which is one either/or
question written as two sentences. The same grader passed in runs 2 and 4, so I count it as noise and
propose no change. If it comes back, the place to tighten is the conductor's rule 1
(`skills/design/SKILL.md:37`, "ask the one question"): ask it in one sentence.

---

## 2. `fresh-brief-hides-the-system`, 0.90: the case's fault (it surfaced by chance)

**What failed.** `gives-the-tasks`: "pattern not found in file design/today/04-structure/BRIEF-fresh.md".

**What the grader expects.** `evals/fresh-brief-hides-the-system/graders/gives-the-tasks.md` (from
5cf0a7a): `^## The tasks\n[^#]*?walked in[^#]*?Sala Jard[ií]n`, with a literal space inside each
phrase.

**What the kit wrote.** This is the brief kept as the judge's evidence (the `criteria` judges voted
PASS ×3 on it):

```
## The tasks

1. **Start:** A man has walked in with no booking and is waiting at the desk. **Goal:** Find him a room
   he can go into now.
2. **Start:** A practitioner phones the desk between two patients. **Goal:** Tell her whether Sala
   Jardín is free until eleven.
```

These are the intent's two tasks word for word (fixture `02-intent.md:31-32`), as the template asks
(`templates/package/04-structure/BRIEF-fresh.md:24`). The session wraps prose at about 104 columns,
as the templates are wrapped. Keeping the intent's `**Start:**`/`**Goal:**` labels moved the line
break, which fell between "Sala" and "Jardín": the text holds `"Sala\n   Jard"`. In Node the old
pattern fails on it and `…walked\s+in[^#]*?Sala\s+Jard[ií]n` passes.

**Why "case" and not "noise".** Where the line breaks is chance. The same pattern passed in the same
run on `brief-has-no-design`, where the break fell after "is", and on both briefs of run 2. But a
right brief fails a pattern that cannot cross a line break. My re-run of `brief-has-no-design` proved
it: its `gives-the-tasks` failed in exactly this way (`Sala\n   Jardín`). No kit file is involved;
`BRIEF-fresh.md`'s "The tasks" instruction is unchanged since 3f33a65.

**The change to the case.** Change both `gives-the-tasks.md` graders, in
`evals/fresh-brief-hides-the-system/graders/` and `evals/brief-has-no-design/graders/`:

```
^## The tasks\n[^#]*?walked\s+in[^#]*?Sala\s+Jard[ií]n
```

The other multi-word literals of the two cases' section graders can break across lines in the same
way. In both cases, `names-the-person` becomes `\b(front\s+desk|clinic)\b` and
`says-what-the-product-can-do` becomes `being\s+cleaned`. I checked in Node that the four hardened
patterns still match the sound sample that `tests/evals.test.mjs:309-314` uses
(`evals/no-pick-without-the-founder/fixture/design/today/04-structure/BRIEF.md`), still miss both
bare templates, and match all five briefs of runs 2 and 4 and of the re-run.

---

## 3. `brief-has-no-design`, 0.75: the kit's fault

**What failed.** `criteria`: FAIL FAIL FAIL in run 4, and **FAIL FAIL FAIL again in the re-run**, on a
second brief written separately. A third vote set on the same kind of output is not noise.

**What the rubric expects** (`evals/brief-has-no-design/graders/criteria.md`): "PASS if that part
proposes no design: no sentence in it says what the screen should hold, show first or look like". Its
list of what is allowed includes "a state the product can be in, as no room being free".

**What the kit now has the session write.** The judges' reasons are not kept, so the cause is
inferred by comparing the three briefs above "How to work": the one that passed (run 2,
`evals/results/2026-11-15T06-22-54-824Z/`) and the two that failed (run 4 and the re-run). They share
the intro, the person's "what she never does", the job and the product list. The re-run and run 2
even share the success criteria under "It works when". What separates them is "The hardest state":

- **Run 2, PASS:** two lines, "No room is free now … She must still learn which room frees up
  first", and the twelve rooms.
- **Run 4, FAIL:** five lines, each pairing a state with what the screen does in it. For example:
  "The statuses are being fetched again: what she has stays while they update, with the time of the
  last update." and "The booking was saved: the room she booked shows as booked at once, with until
  when, and she can undo it for two minutes."
- **Re-run, FAIL:** six such lines. Among them: "The statuses are being refreshed: she loses nothing
  she was reading, and she can tell when they were last updated." and "The booking was saved: the
  room shows as booked at once, with until when, and she can undo it for two minutes."

Each of these lines is the right-hand column of the intent's States table, "What it must tell her, or
let her do" (fixture `02-intent.md`, `## States`), copied across. Each says what the screen should
hold in a state, which is the thing the rubric fails. Run 2 had the same facts under "What the
product can show and do" ("A booking made shows the room as booked at once, until when"), where the
rubric allows them, and passed.

**The line, and the commit.** `templates/package/04-structure/BRIEF.md:28-29`, the same in
`templates/package/04-structure/BRIEF-fresh.md:49-50`, changed by **c0d6bd4** (the A2 wave, ruling
**R160** on F6):

```
-{The one or two states every proposal must be played through, as: the list is empty; it has two hundred rows.}
+{Every state the intent says she must be told about, one line each, as: the list is empty; it has two
+hundred rows. The rule selects them: none is weighed, and none is left out.}
```

The new wording selects by "she must be told about". That points the session at the intent's
"What it must tell her" column, and the rule now takes every such state, not one or two. The result is
a line saying what the screen does for each of five or six states. That is the maker's part of the
work. The describer's card says so: "**Play the hardest state** the brief names through your
structure: nothing free, two hundred rows, the thing failed. Write what it shows then in `hardest`"
(`pool/makers/structure-describer.md:44-45`). The kit's own sample of a sound brief names its states
bare: "No room is free now. And: the clinic has twelve rooms, one of them with a name of forty
characters." (`evals/no-pick-without-the-founder/fixture/design/today/04-structure/BRIEF.md`). A brief
that says for every state what the screen tells her gives every describer the same `hardest` answer.
That is what `skills/design/references/blind.md:33` warns of: "returns your own idea, in as many
voices as there are makers".

**Why not the case.** Rewriting the rubric to allow "what the intent says she must be told in a state"
would make the grader pass the leak. The rubric matches the kit's own split: the brief names the
state, and the maker says what it shows.

**The smallest change, keeping R160.** R160 is about *which* states (every must-be-told state, none
weighed, none left out). The fix is about *how each is named*. In both templates, at the lines above:

```
{Every state the intent says she must be told about, one line each, named by what has happened, never
by what she is told in it: the list is empty; it has two hundred rows. The rule selects them: none is
weighed, and none is left out.}
```

Both phrases that `tests/skills.test.mjs:6202` pins survive ("Every state the intent says she must be
told about, one line each" and "The rule selects them: none is weighed, and none is left out."; the
pin flattens whitespace). Add the new clause to that pin. Under this wording the five lines of run 4
become "No room is free now. The statuses are being fetched again. The booking was not saved. The
booking was saved. Twelve rooms, one with a name of forty characters." The facts each state rests on
stay in "What the product can show and do", and the intent's requirements reach the judges, who hold
the proposals to them.

The fresh case's `criteria` passed with the same leak in its brief ("she can take it back for two
minutes, without going anywhere to do it") only because that rubric asks about the design system and
today's screens, not about a proposed screen. The fix belongs in both templates, which the pin
already treats as one.

To prove the fix, the next run of `brief-has-no-design` should score `criteria` PASS on a hardest
state written as conditions. Re-runs are not mine to spend, so that run is still owed.

---

## What I spent

| Run | Tool's total |
|---|---|
| `resume-from-disk` re-run | $0.215 (judges $0.006) |
| `brief-has-no-design` re-run | $0.724 (judges $0.029) |
| **Total** | **$0.94** |

That leaves about $0.46 of the plan's cap. If the judges' share is billed on top of the totals, the
total is $0.97. `fresh-brief-hides-the-system` was not re-run. No kit or case file was changed and
nothing was committed. The tool wrote the two results folders under `evals/results/` named above, and
their sealed kept folders under `/tmp/claude-1000/`.
