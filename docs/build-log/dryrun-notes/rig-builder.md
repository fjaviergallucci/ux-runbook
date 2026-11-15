# You stand in for the session that builds

A design pipeline is being tried end to end on a fictional project, with nobody present. The design is
finished and handed off. You are **the implementing session**: a session that has never seen the design
being made, and that is given one folder.

## What you are given

- The project: `/tmp/claude-1000/dryrun/project` (a throwaway git repository of its own; work there).
- The handoff folder: `design/free-now/07-handoff/`. **Start with its `IMPLEMENTER-GUIDE.md` and do what
  it says, in its order.** Read nothing else under `design/free-now/` except `design/free-now/build/`,
  which is where the guide has you write back. Never open `04-structure`, `05-detail`, `06-look`,
  `07-handoff-gate`, `work`, or the numbered pages `00`–`03`.
- You may read the project's own source (`src/`, its README) as a builder would.

## What "building" means in this run

This run tests the pipeline's mechanics, not anybody's skill at building. So the build is a stand-in:

1. Copy the handoff's `prototype/` folder, whole, to `src/free-now/` in the project. That copy **is** the
   build. Change no page of it. It is static: each surface is opened by its `file://` address — start no
   server and no long-running process.
2. Everything else is done for real, exactly as the guide says: read what it has you read, in its order;
   follow its slices as far as they apply to a build that already exists (say in `BUILD.md` that the
   build is a stand-in copy, and map each slice to the pages that hold it); write `BUILD.md`, `STATES.md`
   and `DEVIATIONS.md` in `design/free-now/build/` as the guide and those files' own headings say — every
   state of `SPEC.md` gets its row in `STATES.md` with the address that puts it on screen; commit in the
   project's repository as the guide says (stage by explicit path; never `git add -A`).
3. Where the guide, `SPEC.md`, `PARTS.md`, `ACCEPTANCE.md` or a template under `build/` leaves you to
   guess, tells you something that is not so, names a file that is not there, or asks for something a
   builder could not do from this folder alone: do the most literal thing, and write it down (below).

## Your notes — the reason for the run

Write `/tmp/claude-1000/dryrun/notes/builder.md` as you go: one entry per thing, each with the file and
line · what it said · what you needed · what you did. Kinds worth noting: a question the folder does not
answer · a guess you had to make · a default marked as one that you would have wanted decided · a state
with no page, or a page with no state · two files of the folder that disagree · anything in the guide's
order that did not work · anything that pointed you outside the folder. End with: how long a real
builder would have been stopped, in your judgement, and by which three things first.

## Rules of this machine — binding

- Never stop a process by name, binary path or command-line pattern. Start no browser and no server.
- Never print the environment. No key, no keys file, no outside model, no network.
- Touch nothing outside `/tmp/claude-1000/dryrun/`. The kit at
  `/mnt/data/Downloads/Proyectos/ux-runbook-v2` is read-only for you, and you should not need it.
- Do not start sub-agents.

## Your reply

Short: where the build is, how many rows `STATES.md` has against how many states `SPEC.md` names, the
commit(s), how many entries your notes hold, and the three that would have stopped a real builder first.
