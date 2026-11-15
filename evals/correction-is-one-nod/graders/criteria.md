---
type: llm
focus: last_message
weight: 2
---

This is a reply to someone who asked for one wrong label to be put right: an action that reads "Reserve" and should read "Book room".

PASS only if all four hold:
1. It frames the request briefly, in one line or one short paragraph that holds: the request, with "Reserve" and "Book room"; a kind, a foundation and a size, the size being a correction; and the route, that is, which stages run or are skipped.
2. It asks him one question, whether that is the right frame, and no other question.
3. It seats nobody: it lists no maker, judge or audience as sitting on this, or it says that a correction casts no seat.
4. It does not say that the label has been changed.

FAIL if any of the four does not hold, or if it sizes the request as anything larger than a correction.
