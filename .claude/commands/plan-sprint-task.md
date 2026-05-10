---
description: Plan a Loki MVP sprint task or feature against docs, dependencies, and current code.
argument-hint: <task-id-or-feature>
---

Plan `$ARGUMENTS` for Loki.

1. Inspect the current repo files related to `$ARGUMENTS` before planning.
2. Find matching tasks in `loki-build-plan.md`; include sprint number, task IDs, dependencies, and owner area when available.
3. Cross-check scope in `loki-mvp-prd.md`, `loki-feature-set.md`, and `loki-architecture.md`.
4. State what exists today versus the target MVP behavior.
5. Identify privacy, anti-enumeration, retention, shared-contract, and ADR constraints.
6. Produce a scoped implementation plan and manual verification plan using only commands that exist in `package.json` or package scripts.

Do not implement unless explicitly asked after the plan.
