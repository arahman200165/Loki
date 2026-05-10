---
description: Implement a Loki feature narrowly after mapping it to current code and MVP docs.
argument-hint: <feature>
---

Implement `$ARGUMENTS` for Loki.

1. Inspect current files and read the relevant `README.md`, `loki-build-plan.md`, `loki-mvp-prd.md`, `loki-feature-set.md`, and `loki-architecture.md` sections.
2. Identify the sprint task, dependency prerequisites, and any ADR blockers.
3. Keep the change scoped to the requested feature and current sprint dependency order.
4. Preserve privacy invariants, anti-enumeration behavior, retention limits, and MVP boundaries.
5. Put shared contracts, constants, and validators in `packages/shared` when both server and mobile need them.
6. Update docs only when they describe current reality or the feature contract.
7. Verify with existing scripts only. If no automated test command exists for the touched area, provide manual QA steps instead of inventing one.
