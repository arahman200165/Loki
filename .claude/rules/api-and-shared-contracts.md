---
title: API and shared contracts
applies-to: server | mobile | all
---

**Rule:** Keep API behavior REST-ish, versioned, additive, and backed by shared contracts.

**Why:** Server and mobile must evolve together while preserving a simple MVP architecture.

**How to apply:**
- Use JSON endpoints under `/api/v1`; do not introduce GraphQL or WebSockets for MVP.
- Protected mobile API calls use the API key header plus bearer session auth unless an accepted ADR changes that.
- Mutating endpoints should account for idempotency keys where the architecture requires them.
- Standardize request/response shapes, enums, domain constants, and validation helpers in `packages/shared`.
- Prefer additive API changes. Removing fields, changing wire semantics, or breaking mobile compatibility requires a deprecation path and likely an ADR.
- Use real existing scripts when verifying API changes; do not invent a test runner.
