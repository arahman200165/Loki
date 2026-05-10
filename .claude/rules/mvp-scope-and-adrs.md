---
title: MVP scope and ADRs
applies-to: all
---

**Rule:** Stay inside the MVP roadmap and require ADR coverage for major scope, stack, or privacy changes.

**Why:** The Loki MVP is intentionally bounded so a small team can ship the privacy-first core without taking on post-MVP systems too early.

**How to apply:**
- Use `loki-build-plan.md` to respect sprint order and dependencies.
- Keep deferred work deferred: onion routing, mixnets, decentralized delivery, private contact discovery, desktop app, full crypto wallet, behavioral analytics, WebSockets, GraphQL, and runtime feature flags.
- Do not raise MVP limits without an ADR: 3 devices per account, 25 group members, 24-72h envelope TTL, 7-day free Public-ID rotation cooldown, and 180-day deprecated-ID lockout.
- New runtimes, major dependencies, destructive migrations, API removals, auth model changes, crypto choices, calling stack choices, and vault KDF choices need ADR review.
- If docs disagree, prefer accepted ADRs and current implementation reality, then call out the mismatch.
