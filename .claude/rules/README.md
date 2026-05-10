# Rules

Project conventions Claude should follow for Loki. These complement `.claude/CLAUDE.md` and the root product docs; keep them short, actionable, and tied to repeated review concerns.

## Available Rules

| Rule | Applies to | Use when |
| --- | --- | --- |
| `privacy-invariants.md` | all | Any change touches identity, content, push, logging, vault, duress, or security-sensitive behavior. |
| `mvp-scope-and-adrs.md` | all | Work may exceed MVP scope, alter limits, add major dependencies, or need an ADR. |
| `anti-enumeration.md` | server, mobile, all | Public-ID, contact requests, blocking, onboarding, or any discoverability surface changes. |
| `api-and-shared-contracts.md` | server, mobile, all | API routes, mobile API calls, shared types, validators, or wire contracts change. |
| `mobile-ux-and-storage.md` | mobile | Expo screens, navigation, privacy copy, auth persistence, or local storage changes. |
| `server-data-retention.md` | server | Database, retention, cleanup jobs, message envelopes, sessions, logs, or server storage changes. |

## Rule Format

One `.md` per rule:

```markdown
---
title: Short name
applies-to: server | mobile | docs | all
---

**Rule:** the imperative.
**Why:** the reason.
**How to apply:** when it kicks in.
```

Add a rule only when a recurring mistake or review comment justifies it.
