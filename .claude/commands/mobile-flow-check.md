---
description: Review a Loki Expo mobile screen or flow for navigation, storage, API usage, privacy copy, and UX constraints.
argument-hint: <screen-or-flow>
---

Review the mobile flow for `$ARGUMENTS`.

1. Inspect relevant files under `apps/mobile/app/` and any shared utilities.
2. Confirm Expo Router placement, navigation behavior, auth state handling, API headers, and error states.
3. Check for exact Public-ID entry where applicable; reject search, typeahead, directory, or "not found" leakage.
4. Check storage behavior for tokens, user profile, device data, messages, vault data, and settings.
5. Ensure privacy copy is direct and does not promise remote deletion guarantees or forward secrecy in MVP.
6. Verify against existing mobile scripts only, such as package-local `npm run lint` when appropriate.
7. Provide manual QA steps for onboarding, login/restore, background/foreground, and navigation paths touched by the flow.
