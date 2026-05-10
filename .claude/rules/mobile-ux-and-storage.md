---
title: Mobile UX and storage
applies-to: mobile
---

**Rule:** Build mobile flows as privacy-first Expo Router screens that match current storage and configuration reality.

**Why:** The app is currently an Expo Router scaffold with AsyncStorage auth and a hardcoded API URL risk; future screens must make privacy tradeoffs understandable.

**How to apply:**
- Follow the existing `apps/mobile/app/` file-based routing structure.
- Keep privacy copy direct and honest. Do not overpromise remote deletion, perfect anonymity, or forward secrecy in MVP.
- Use exact Public-ID entry for contact flows; no discoverability UX.
- Treat AsyncStorage token storage and the hardcoded API base URL as documented MVP risks unless the task explicitly addresses ADR-008 or ADR-009.
- Prefer shared constants and validators from `packages/shared` when adding forms for auth, Public-ID, contacts, messages, groups, devices, settings, or retention.
- Keep onboarding and settings screens explicit about password loss, recovery limits, push privacy, vault PIN, and duress consequences.
