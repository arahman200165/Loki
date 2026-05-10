---
name: loki-api-contract
description: Use when designing, implementing, or reviewing Loki server endpoints, shared API types, request/response bodies, auth behavior, idempotency, and error envelopes.
---

# Loki API Contract

Use this skill for API work under `apps/server`, mobile API calls in `apps/mobile`, or shared contracts in `packages/shared`.

## Constraints

- API style is REST-ish JSON under `/api/v1`.
- No GraphQL and no WebSockets in MVP.
- Protected mobile API routes use the configured API key header and bearer session auth unless an accepted ADR changes the model.
- Mutating endpoints should follow the idempotency-key requirement where applicable.
- Shared request/response types, enums, constants, and Public-ID validators belong in `packages/shared`.

## Checklist

- Confirm the endpoint belongs in the current sprint order.
- Define method, path, auth requirements, request body, response body, status codes, and error shape.
- Preserve anti-enumeration behavior for Public-ID, contact, blocking, and request flows.
- Avoid leaking plaintext content, tokens, credentials, or sender-recipient edges through responses or logs.
- Keep changes additive within `/api/v1`; breaking changes require deprecation and likely an ADR.
- Verify against actual package scripts, such as `npm run check --workspace=server` if used from the repo root.

## Review Questions

- Does mobile need a shared contract update?
- Does the route need idempotency, rate limiting, or uniform response handling?
- Does the response reveal more than the product docs allow?
- Does the implementation match accepted ADRs and MVP limits?
