---
description: Review Loki schema, DB model, migration, retention, indexes, and shared domain type implications.
argument-hint: <entity-or-migration>
---

Review the data model for `$ARGUMENTS`.

1. Inspect existing server DB code, migrations if present, models, services, and shared types.
2. Map the entity to the domain model and schema guidance in `loki-architecture.md`.
3. Check lifecycle states, ownership boundaries, foreign keys, uniqueness, indexes, and cleanup paths.
4. Verify MVP limits: 3 devices, 25 group members, 24-72h envelope TTL, 7-day Public-ID rotation cooldown, and 180-day deprecated-ID lockout.
5. Check whether any plaintext content or unnecessary metadata is stored.
6. Treat destructive migrations and storage backend changes as ADR-triggering.
7. Report required fixes, shared contract updates, and verification or manual migration checks.
