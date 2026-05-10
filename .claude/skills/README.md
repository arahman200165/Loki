# Skills

Project-scoped skills for Loki. One folder per skill, each containing a `SKILL.md`.

## Available Skills

| Skill | Use when |
| --- | --- |
| `loki-sprint-planner` | Mapping work to MVP sprint tasks, dependencies, owners, source docs, and current implementation gaps. |
| `loki-api-contract` | Designing or reviewing server endpoints, mobile API usage, shared contracts, auth, idempotency, and error envelopes. |
| `loki-privacy-review` | Reviewing identity, Public-ID, contacts, messages, vault, duress, notifications, logging, retention, auth, or storage. |
| `loki-mobile-flow` | Building or reviewing Expo screens, onboarding, Public-ID flows, chat, vault, calls, settings, and local storage. |
| `loki-data-model` | Designing or reviewing PostgreSQL schema, models, migrations, retention jobs, indexes, and shared domain types. |

## Skill Format

```text
skills/
  my-skill/
    SKILL.md
```

`SKILL.md` frontmatter:

```markdown
---
name: my-skill
description: When to use this skill; be specific about triggers.
---

Instructions, references, examples.
```

Keep skill bodies short and link to the Loki docs instead of copying large sections.
