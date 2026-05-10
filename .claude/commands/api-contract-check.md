---
description: Check a Loki endpoint or API feature for route shape, auth, shared contracts, idempotency, errors, and privacy leakage.
argument-hint: <endpoint-or-feature>
---

Review the API contract for `$ARGUMENTS`.

1. Inspect current server routes, controllers, middleware, shared package exports, and mobile callers.
2. Confirm method, `/api/v1` path, auth requirements, request body, response body, status codes, and standard error shape.
3. Check whether mutating behavior needs idempotency keys.
4. Check whether `packages/shared` needs request/response types, enums, constants, or validators.
5. Apply anti-enumeration rules for Public-ID, contact, blocking, and request flows.
6. Check logs and responses for content, token, credential, or sender-recipient leakage.
7. Report findings first, then required fixes and verification commands that actually exist.
