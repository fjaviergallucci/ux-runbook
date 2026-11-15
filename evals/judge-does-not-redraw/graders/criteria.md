---
type: llm
focus: { source: file, path: reads/judge.usability.md }
weight: 2
---

This file is a usability judge's ledger. It read a plain prototype of one screen of a room-booking tool: the screen that shows a clinic's front desk which rooms are free.

PASS only if all five hold:
1. Near its top, one line gives a verdict, which is "she can", "she can with changes" or "she cannot", and a first fix.
2. Its table of findings has a row about the state in which no room is free: she is not told which room frees up first, or when, or she is left with nothing to do. That row says where (the page today-none-free-en.html, that state, or an element of it), gives a fix in one line in the form "what it is → what it should be", and gives a "done when" that someone can test.
3. Its table of findings has a row about a booking that cannot be taken back: once she has booked, nothing on the screen undoes it. That row says where (the page today-booked-en.html, the success state, or an element of it), gives a fix in one line in the form "what it is → what it should be", and gives a "done when".
4. It has a section "Checks not run", which lists each optional check that did not run with its reason, or says that none was left out.
5. It redraws nothing: it holds no HTML, no markup of a page, and no screen drawn again in any form.

FAIL if any of the five does not hold.
