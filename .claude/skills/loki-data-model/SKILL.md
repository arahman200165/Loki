---
name: loki-data-model
description: Use when designing, implementing, or reviewing Loki PostgreSQL schema, DB models, migrations, retention jobs, indexes, lifecycle states, and shared domain types.
---

# Loki Data Model

Use this skill for database, domain model, migration, and retention work.

## Constraints

- PostgreSQL is the MVP source of truth.
- No microservices, external queues, Redis dependency, or alternate storage backend without ADR coverage.
- Server stores ciphertext and routing metadata only, with minimal retention.
- `packages/shared` should hold shared domain types, lifecycle enums, retention constants, and validators.

## Model Checks

- Map the entity to `loki-architecture.md` domain and schema sections before creating tables.
- Respect MVP limits: 3 devices, 25 group members, 24-72h envelope TTL, 7-day free Public-ID rotation cooldown, 180-day deprecated-ID lockout.
- Use lifecycle states explicitly for accounts, devices, contact requests, messages, groups, calls, and Public-IDs.
- Add indexes for lookup paths and cleanup jobs described by the architecture.
- Treat destructive migrations as ADR-level changes.
- Include cleanup behavior for expiring data when the sprint calls for it.

## Review Questions

- Does this table store plaintext content or unnecessary metadata?
- Is retention enforceable by schema, queries, or jobs?
- Are sender-recipient relationships exposed beyond what the feature requires?
- Are shared contracts updated for server and mobile consumers?
