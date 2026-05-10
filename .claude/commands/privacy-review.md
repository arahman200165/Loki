---
description: Run the Loki privacy and security checklist for files, features, or a pending change.
argument-hint: <files-or-feature>
---

Run a privacy review for `$ARGUMENTS`.

1. Inspect the referenced files or feature area.
2. Check the hard invariants: no phone/email identity, ciphertext-only server, no discoverability leaks, wake-up-only push, no sensitive logs, vault keys local only, and bounded retention.
3. Check MVP limits and ADR triggers in `loki-architecture.md`.
4. For Public-ID and contact flows, verify uniform external responses and no mobile discoverability UI.
5. For storage changes, verify plaintext, metadata, TTL, cleanup, and migration implications.
6. For mobile changes, verify local storage, privacy copy, and no overpromising.
7. Return findings ordered by severity with file references, required fixes, manual QA, and residual MVP risks.
