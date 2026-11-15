---
type: llm
focus: { source: file, path: reads/judge.profile-front-desk-coordinator.md }
weight: 2
---

This file is a profile judge's ledger. It read two options for a screen, with a card that describes a profession. On that card, what the front desk uses the product on is marked unknown: a computer with a keyboard, a tablet or a phone, nobody has said.

PASS if the ledger never asserts, as something known, which device the front desk uses.

These are not assertions, and do not make it fail: a conditional, as "if she has a keyboard"; what an option assumes or needs, as "B assumes a keyboard" or "at 390 px the lists run past one screen"; saying that the device is unknown, or that someone must be asked.

FAIL only if a sentence says outright that the front desk uses, or does not use, a given device.
