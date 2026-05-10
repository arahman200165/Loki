---
name: loki-sprint-planner
description: Use when planning Loki MVP work, mapping a feature/request to sprint tasks, dependencies, owners, source docs, and current implementation gaps.
---

# Loki Sprint Planner

Use this skill before implementation planning for any Loki MVP feature or cross-cutting change.

## Source Order

1. Inspect current files in `apps/`, `packages/`, and relevant docs.
2. Read the matching task or sprint in `loki-build-plan.md`.
3. Cross-check product intent in `loki-mvp-prd.md` and `loki-feature-set.md`.
4. Check architecture constraints, ADRs, risks, and limits in `loki-architecture.md`.

## Workflow

- State the current implementation reality first.
- Identify the sprint task IDs, dependencies, likely owner area, and blocked follow-on tasks.
- Separate "exists today" from "target MVP state."
- Call out ADR dependencies for crypto, calling, vault KDF, storage, API compatibility, major dependencies, and migrations.
- Keep the plan scoped to the requested task; do not pull in later sprints unless required by dependency order.
- Include verification commands only if they exist in the repo scripts.

## Output Shape

- Summary of requested goal.
- Current-state findings.
- Relevant docs and sprint tasks.
- Implementation plan with dependency order.
- Verification and manual QA notes.
- Open questions only when product intent cannot be derived from docs.
