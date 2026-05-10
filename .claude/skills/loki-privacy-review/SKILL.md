---
name: loki-privacy-review
description: Use for privacy, security, or product-safety review of Loki changes, especially identity, Public-ID, contacts, messages, vault, duress, notifications, logging, retention, auth, and storage.
---

# Loki Privacy Review

Use this skill before approving or finalizing changes that touch privacy-sensitive surfaces.

## Hard Checks

- No phone or email identity requirement.
- Server never stores message, attachment, vault, or call-sensitive content in plaintext.
- Contact and Public-ID flows do not reveal account existence.
- Push payloads are wake-up only and contain no sender, recipient, chat, group, or message content.
- Logs strip content, credentials, API keys, bearer tokens, and sender-recipient edges.
- Vault keys and duress wipe secrets never leave the device.
- Retention windows match MVP policy.

## ADR Triggers

Require ADR review for:

- Crypto library choice or protocol changes.
- Calling stack or TURN/SFU/provider decisions.
- Vault PIN key-derivation parameters.
- Auth model changes, token storage model changes, or session expiration changes.
- New runtime, major dependency, storage backend, event bus, queue, GraphQL, WebSocket, or analytics SDK.
- Raising device, group, TTL, Public-ID rotation, or deprecated-ID limits.

## Output Shape

- Findings first, ordered by severity.
- File or behavior references.
- Explicit pass/fail for privacy invariants.
- Required ADRs or manual QA.
- Residual risks if the current MVP intentionally accepts them.
