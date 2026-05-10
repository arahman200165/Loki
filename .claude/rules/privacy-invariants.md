---
title: Privacy invariants
applies-to: all
---

**Rule:** Never weaken Loki's core privacy promises without an explicit ADR and product review.

**Why:** Loki's MVP is differentiated by private identity, encrypted delivery, minimal retention, and local privacy controls. These are product requirements, not optional implementation details.

**How to apply:**
- Do not add phone number or email identity requirements.
- Keep message, attachment, vault, and call-sensitive content off the server in plaintext.
- Treat push notifications as wake-up only; payloads must not contain sender, recipient, message, chat, group, or preview content.
- Do not log message content, vault data, credentials, API keys, bearer tokens, or sender-to-recipient edges.
- Keep vault keys and duress wipe material device-local.
- If a request conflicts with these constraints, stop and propose an ADR path instead of implementing the shortcut.
