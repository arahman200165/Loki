---
description: Prepare a Loki PR readiness checklist with scope, docs, privacy review, and real verification commands.
argument-hint: <summary>
---

Prepare PR readiness notes for `$ARGUMENTS`.

1. Inspect the current diff and touched files.
2. Summarize the change in terms of current implementation and MVP docs.
3. Check that scope matches the relevant sprint/task and does not silently include unrelated work.
4. Run or recommend only existing verification commands from root or package `package.json` files.
5. Include privacy, anti-enumeration, retention, shared-contract, and ADR checks when relevant.
6. Identify manual QA required because formal automated test infrastructure is not yet present.
7. Produce a concise PR checklist and mention any known residual risk.
