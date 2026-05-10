---
description: Generate manual QA steps for a Loki feature because formal test infrastructure is out of MVP scope.
argument-hint: <feature>
---

Create a manual QA checklist for `$ARGUMENTS`.

1. Inspect the relevant feature files and docs before writing steps.
2. Cover the happy path, auth/session behavior, network or server errors, invalid input, empty states, and retry behavior.
3. Add privacy checks for content exposure, logging, push payloads, local storage, and anti-enumeration where relevant.
4. Add retention or cleanup checks for message, contact request, Public-ID, session, vault, or device data when relevant.
5. Include setup steps using only existing commands and documented environment variables.
6. Keep the checklist executable by a developer on this repo today.
