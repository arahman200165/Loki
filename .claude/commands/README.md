# Commands

Project slash commands for Loki. One `.md` per command; `foo.md` becomes `/foo`.

## Available Commands

| Command | Use when |
| --- | --- |
| `/plan-sprint-task <task-id-or-feature>` | Planning MVP work against sprint order, dependencies, docs, and current code. |
| `/implement-feature <feature>` | Implementing a scoped feature after inspecting docs and current files. |
| `/api-contract-check <endpoint-or-feature>` | Reviewing route shape, auth, shared contracts, idempotency, errors, and leakage. |
| `/privacy-review <files-or-feature>` | Running Loki's privacy/security checklist on code or a feature area. |
| `/mobile-flow-check <screen-or-flow>` | Reviewing Expo navigation, storage, API usage, privacy copy, and mobile UX constraints. |
| `/data-model-check <entity-or-migration>` | Reviewing schema, models, migrations, retention, indexes, and shared domain types. |
| `/manual-qa <feature>` | Creating manual QA steps because formal test infrastructure is out of MVP scope. |
| `/pr-ready <summary>` | Preparing a PR readiness checklist with scope, docs, privacy review, and real commands. |

## Command Format

```markdown
---
description: One-line summary
argument-hint: <optional>
---

Instructions for Claude. Use $ARGUMENTS for args.
```

Keep each command focused on one job. Prefer existing root or package `npm run` scripts; do not invent commands.
