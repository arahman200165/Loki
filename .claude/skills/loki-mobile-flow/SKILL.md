---
name: loki-mobile-flow
description: Use when building or reviewing Loki Expo React Native screens, navigation, onboarding, Public-ID flows, chat, vault, calls, settings, privacy education, and local storage behavior.
---

# Loki Mobile Flow

Use this skill for work under `apps/mobile`.

## Current Reality

- Expo Router drives routes from `apps/mobile/app/`.
- Login persists `authToken` and `authUser` in AsyncStorage.
- API key comes from `EXPO_PUBLIC_API_KEY`.
- API base URL is currently hardcoded in `app/login.tsx` and tracked as a risk until ADR-008 work lands.
- The app has splash, login, tabs, calls/profile placeholders, and a new-chat placeholder.

## UX Rules

- Explain privacy tradeoffs honestly and briefly.
- Do not promise remote deletion guarantees or forward secrecy in MVP.
- Use exact Public-ID entry; no search suggestions, directory, typeahead, or "not found" copy.
- Keep high-risk actions such as vault setup, duress wipe, password loss, and device revocation explicit.
- Use shared validators/constants from `packages/shared` as they are introduced.

## Implementation Checks

- Confirm route placement under Expo Router.
- Confirm auth headers and API base URL behavior.
- Confirm local storage implications for tokens, account data, vault state, and cached messages.
- Confirm manual QA steps across onboarding, auth restore, foreground refresh, and navigation.
- Run only existing mobile commands such as `npm run lint --workspace=mobile` or package-local equivalents when appropriate.
