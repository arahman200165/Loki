---
title: Anti-enumeration
applies-to: server | mobile | all
---

**Rule:** Do not expose account existence, Public-ID existence, or contact graph hints before an accepted connection.

**Why:** Non-discoverability is a core Loki product principle and a hard architecture constraint.

**How to apply:**
- Public-ID contact submission must return the same visible result for success, unknown ID, invalid format, reserved ID, confusable ID, deprecated ID, blocked sender, and rate-limited cases.
- The architecture mantra for `/contact-request/send` is `202 { "status": "submitted" }` for every input.
- Mobile UI must require exact Public-ID entry. Do not add search suggestions, typeahead, public directories, "user not found" messages, or validation that reveals account existence.
- Server internals may record actual outcomes, but external response shape, timing, and client-visible copy must remain uniform.
- Reviews for contact, Public-ID, blocking, and onboarding work must include an anti-enumeration check.
