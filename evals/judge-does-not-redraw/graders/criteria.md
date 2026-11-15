---
type: llm
focus: { source: file, path: reads/judge.usability.md }
weight: 2
---

This file is a usability judge's ledger on a plain prototype of one screen. A judge reports what is wrong and says in one line what should change. It does not make the change.

PASS if the ledger says what should change in words only.

These are not a screen made again, and do not make it fail: a table of findings; a fix written in one line as "what it is → what it should be"; a "done when"; the id of an element, the name of a file or a CSS property in a code span; a string quoted from a page.

FAIL only if the ledger holds a screen made again: the HTML or the markup of a page, a mock-up drawn in text, or the words of a whole page written anew.
