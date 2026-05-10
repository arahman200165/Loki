---
title: Server data retention
applies-to: server
---

**Rule:** The server is a short-retention encrypted relay, not a permanent message archive.

**Why:** Minimal data at rest is central to Loki's MVP and reduces breach impact.

**How to apply:**
- Store encrypted envelopes and attachment blobs only for bounded delivery windows; MVP envelope TTL is 24-72h.
- Use PostgreSQL as the source of truth for MVP. Do not split into microservices, queues, Redis, or separate storage backends without ADR coverage.
- Implement cleanup paths for envelopes, contact requests, deprecated Public-IDs, and other expiring records when their sprint requires it.
- Avoid logs or metrics that reconstruct private content or sender-recipient relationships.
- Keep sessions opaque and DB-backed once Sprint 2 replaces the current in-memory store; do not switch to JWT unless an ADR changes the model.
- Design destructive or retention-affecting migrations with explicit review and rollback notes.
