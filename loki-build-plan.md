# Loki MVP — Sequential Build Plan

## Overview

**Team:** Abdul (full-stack lead), Areta (backend), Eric (mobile UI), Vishal (database)
**Stack:** Express + PostgreSQL (server) · Expo React Native (mobile) · TypeScript (shared)
**Already done:** Express scaffold, in-memory auth, DB pool config, Expo Router setup, login screen, tab navigator, splash screen

### Legend

- **Depends on:** task IDs that must be complete before this task starts
- **~LOC:** rough line-count estimate per task
- Tasks within the same sprint that share no dependencies run in parallel
- `[BLOCKS]` marks tasks that gate the next sprint for one or more developers

---

## Sprint 1 — Database Schema & Shared Types

_All four developers work fully in parallel. Nothing gates anything yet._

| ID  | Developer | Task                                                                                | Key Files                                                                                        | ~LOC | Depends on |
| --- | --------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---- | ---------- |
| 1.1 | Vishal    | DB migration: accounts, sessions, devices tables                                    | `apps/server/db/migrations/001_accounts.sql`, `db/migrate.js`                                    | 180  | —          |
| 1.2 | Areta      | DB migration: public_ids, contact_requests tables                                   | `apps/server/db/migrations/002_contacts.sql`                                                     | 160  | —          |
| 1.3 | Areta      | DB migration: mailboxes, message_envelopes                                          | `apps/server/db/migrations/003_messages.sql`                                                     | 150  | —          |
| 1.4 | Vishal    | DB migration: groups, group_members, group_events, call_sessions, call_participants | `apps/server/db/migrations/004_groups_calls.sql`                                                 | 180  | —          |
| 1.5 | Vishal    | Shared types: auth, account, public-id contracts                                    | `packages/shared/src/types/auth.ts`, `types/publicId.ts`                                         | 200  | —          |
| 1.6 | Abdul     | Shared types: messages, groups, calls, devices                                      | `packages/shared/src/types/messages.ts`, `types/groups.ts`, `types/calls.ts`, `types/devices.ts` | 220  | —          |
| 1.7 | Vishal    | Public-ID validation utilities (format, reserved names, confusable mapping)         | `packages/shared/src/utils/publicId.ts`                                                          | 210  | —          |
| 1.8 | Abdul     | Retention policy enums & settings models                                            | `packages/shared/src/types/settings.ts`, `types/retention.ts`, `src/index.ts`                    | 160  | —          |

**Sprint 1 output:** complete DB schema, full shared type layer, Public-ID validator usable by both server and mobile.

---

## Sprint 2 — Account Registration & Core Auth

_Server and mobile tracks parallel. Mobile 2.4–2.6 can start as soon as 1.5 ships._

| ID  | Developer | Task                                                                               | Key Files                                                                     | ~LOC | Depends on |
| --- | --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---- | ---------- |
| 2.1 | Areta      | Account DB model (queries: create, find by username, exists)                       | `apps/server/db/models/accountModel.js`                                       | 180  | 1.1        |
| 2.2 | Abdul     | `POST /api/v1/auth/register` endpoint + timing-safe validation [BLOCKS 3.x server] | `apps/server/controllers/authController.js` (extend), `routes/authRoutes.js`  | 200  | 2.1, 1.5   |
| 2.3 | Vishal    | Migrate session store from in-memory to PostgreSQL DB-backed                       | `apps/server/services/sessionStore.js` (rewrite), `db/models/sessionModel.js` | 190  | 1.1        |
| 2.4 | Eric     | Onboarding entry screen + identity model explainer screen                          | `apps/mobile/app/onboarding/index.tsx`, `onboarding/explainer.tsx`            | 200  | 1.5        |
| 2.5 | Eric     | Registration form: username + password + lockout warning [BLOCKS 3.x mobile]       | `apps/mobile/app/onboarding/register.tsx`, `components/PasswordInput.tsx`     | 210  | 2.4        |
| 2.6 | Abdul     | Recovery setup screen (optional, skippable) + no-recovery warning                  | `apps/mobile/app/onboarding/recovery.tsx`                                     | 190  | 2.5        |

---

## Sprint 3 — Public-ID System

_Server 3.1–3.3 and mobile 3.4–3.6 run in parallel across all four._

| ID  | Developer | Task                                                                                                                         | Key Files                                                                   | ~LOC | Depends on |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---- | ---------- |
| 3.1 | Areta      | Public-ID DB model (claim, exists, rotate, status queries)                                                                   | `apps/server/db/models/publicIdModel.js`                                    | 180  | 1.2, 2.1   |
| 3.2 | Areta      | `POST /api/v1/public-id/claim` — format + uniqueness + reserved names + confusables [BLOCKS 4.x server]                      | `apps/server/controllers/publicIdController.js`, `routes/publicIdRoutes.js` | 210  | 3.1, 1.7   |
| 3.3 | Vishal    | `POST /api/v1/public-id/rotate` + `GET /api/v1/public-id/status` — cooldown enforcement, paid-token stub, deprecated-ID lock | `apps/server/controllers/publicIdController.js` (extend)                    | 200  | 3.1        |
| 3.4 | Eric     | Public-ID selection screen during onboarding (inline format validation via 1.7) [BLOCKS 4.x mobile]                          | `apps/mobile/app/onboarding/choose-id.tsx`                                  | 200  | 2.5, 1.7   |
| 3.5 | Abdul     | Public-ID reveal screen (post-registration: copy, share, rotation info)                                                      | `apps/mobile/app/onboarding/id-reveal.tsx`, `hooks/usePublicId.ts`          | 190  | 3.4, 2.2   |
| 3.6 | Eric     | Public-ID management screen (rotate, free-change countdown, paid-change flow)                                                | `apps/mobile/app/(tabs)/profile/manage-id.tsx`                              | 200  | 3.5, 3.3   |

---

## Sprint 4 — Contact Establishment

_Server and mobile parallel. 4.6 (blocking) can be done any time after 4.5._

| ID  | Developer | Task                                                                                                                     | Key Files                                                                                             | ~LOC | Depends on |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---- | ---------- |
| 4.1 | Areta      | Contact request DB model (create, list pending, respond, expire)                                                         | `apps/server/db/models/contactRequestModel.js`                                                        | 180  | 1.2        |
| 4.2 | Abdul     | `POST /api/v1/contact-request/send` — anti-enumeration: uniform response for all invalid/unknown IDs [BLOCKS 5.x server] | `apps/server/controllers/contactController.js`, `routes/contactRoutes.js`                             | 210  | 4.1, 3.2   |
| 4.3 | Vishal    | `POST /api/v1/contact-request/respond` (accept/deny) + `GET /api/v1/contact-request/pending`                             | `apps/server/controllers/contactController.js` (extend)                                               | 190  | 4.1        |
| 4.4 | Eric     | New Chat screen: exact Public-ID entry (no typeahead, no suggestions) [BLOCKS 5.x mobile]                                | `apps/mobile/app/chat/new-chat.tsx` (rewrite from placeholder)                                        | 200  | 3.4        |
| 4.5 | Eric     | Pending requests screen: list, accept/deny actions, sender Public-ID + first message                                     | `apps/mobile/app/requests/index.tsx`, `components/RequestCard.tsx`                                    | 210  | 4.4, 4.3   |
| 4.6 | Abdul     | Blocking flow: block from request screen, block from chat, server-side enforcement                                       | `apps/mobile/app/components/BlockAction.tsx`, `apps/server/controllers/contactController.js` (extend) | 190  | 4.5        |

---

## Sprint 5 — Core Messaging

_Server 5.1–5.4 and mobile 5.5–5.8 run in parallel. Encryption layer (5.7, 5.8) is the hardest part of the sprint — Abdul owns both._

| ID  | Developer | Task                                                                                                                            | Key Files                                                                                     | ~LOC | Depends on |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---- | ---------- |
| 5.1 | Areta      | Mailbox DB model + message envelope model (create, queue, fetch, ack, expire)                                                   | `apps/server/db/models/mailboxModel.js`, `models/envelopeModel.js`                            | 200  | 1.3        |
| 5.2 | Areta      | `POST /api/v1/messages/send` — queue encrypted envelope to recipient's per-device mailbox [BLOCKS 6.x, 7.x server]              | `apps/server/controllers/messageController.js`, `routes/messageRoutes.js`                     | 200  | 5.1, 4.2   |
| 5.3 | Vishal    | `GET /api/v1/messages/fetch` + `POST /api/v1/messages/ack` — TTL enforcement, ack-loss recovery, duplicate delivery guard       | `apps/server/controllers/messageController.js` (extend)                                       | 210  | 5.1        |
| 5.4 | Vishal    | Message TTL cleanup background job                                                                                              | `apps/server/jobs/messageTtlJob.js`, `services/jobScheduler.js`                               | 180  | 5.1        |
| 5.5 | Eric     | Chat list (inbox): chat rows, last message preview, unread badges, empty state, pending requests badge [BLOCKS 6.x, 7.x mobile] | `apps/mobile/app/(tabs)/chat.tsx` (rewrite), `components/ChatRow.tsx`                         | 220  | 4.4        |
| 5.6 | Eric     | Chat thread view: message list, text composition, send button, keyboard handling                                                | `apps/mobile/app/chat/[id].tsx`, `components/MessageBubble.tsx`, `components/ComposerBar.tsx` | 220  | 5.5        |
| 5.7 | Abdul     | Client-side key generation (device identity keypair, libsodium/tweetnacl) + key storage in encrypted local store                | `apps/mobile/src/crypto/keyManager.ts`, `crypto/deviceKeys.ts`                                | 200  | 1.6        |
| 5.8 | Abdul     | Local encrypted message database (SQLite + encryption-at-rest) + message CRUD                                                   | `apps/mobile/src/db/messageStore.ts`, `db/schema.ts`                                          | 210  | 5.7        |

---

## Sprint 6 — Message Encryption + Message Types + Disappearing Messages

_6.1–6.2 (encryption) must ship before 6.3 (send flow wires it up). Message types (6.4–6.6) and disappearing messages (6.7–6.8) run in parallel with encryption work._

| ID  | Developer | Task                                                                                                           | Key Files                                                                                                  | ~LOC | Depends on    |
| --- | --------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---- | ------------- |
| 6.1 | Abdul     | Message encryption (encrypt before send using recipient's public key) + decryption on receive                  | `apps/mobile/src/crypto/messageEncryption.ts`                                                              | 210  | 5.7, 5.6      |
| 6.2 | Abdul     | Public key exchange flow: publish device key to server, fetch contact's key                                    | `apps/server/controllers/keyController.js`, `routes/keyRoutes.js`, `apps/mobile/src/crypto/keyExchange.ts` | 200  | 5.7, 5.2      |
| 6.3 | Vishal    | Server-side attachment routing: encrypted upload endpoint + storage reference                                  | `apps/server/controllers/attachmentController.js`, `routes/attachmentRoutes.js`                            | 190  | 5.2           |
| 6.4 | Eric     | Image attachment: picker, encrypted upload, send + inline display in thread                                    | `apps/mobile/app/chat/components/ImageAttachment.tsx`, `services/attachmentService.ts`                     | 210  | 5.6, 6.1, 6.3 |
| 6.5 | Eric     | File attachments + voice note recorder: capture, encrypt, send, inline player                                  | `apps/mobile/app/chat/components/FileAttachment.tsx`, `components/VoiceNote.tsx`                           | 220  | 6.4           |
| 6.6 | Eric     | Reactions picker + sticker picker: tap to react, sticker sheet                                                 | `apps/mobile/app/chat/components/ReactionPicker.tsx`, `components/StickerPicker.tsx`                       | 200  | 5.6           |
| 6.7 | Areta      | Disappearing message TTL alignment: server enforces per-envelope expiry                                        | `apps/server/db/models/envelopeModel.js` (extend), `jobs/messageTtlJob.js` (extend)                        | 170  | 5.4           |
| 6.8 | Eric     | Disappearing messages UI: timer selector, chat-header indicator, system event in thread, limitation disclosure | `apps/mobile/app/chat/components/DisappearingTimer.tsx`, `chat/settings.tsx`                               | 210  | 5.6, 6.7      |

**Message state indicators (sending, delivered, read, failed, expired)** — add inline to 5.6/6.1. No separate task needed at this point.

---

## Sprint 7 — Group Messaging

_Server 7.1–7.4 and mobile 7.5–7.8 parallel. Group encryption (7.4, 7.8) depends on the key infrastructure from Sprint 6._

| ID  | Developer | Task                                                                                                  | Key Files                                                             | ~LOC | Depends on |
| --- | --------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---- | ---------- |
| 7.1 | Areta      | Group DB model + group member model (create, add, remove, leave, list, events)                        | `apps/server/db/models/groupModel.js`, `models/groupMemberModel.js`   | 200  | 1.4, 4.2   |
| 7.2 | Areta      | `POST /api/v1/groups/create` + `GET /api/v1/groups/:id/members` [BLOCKS 7.5]                          | `apps/server/controllers/groupController.js`, `routes/groupRoutes.js` | 200  | 7.1        |
| 7.3 | Vishal    | Group add/remove member + leave endpoints + admin leave handling                                      | `apps/server/controllers/groupController.js` (extend)                 | 190  | 7.1        |
| 7.4 | Vishal    | Group membership event delivery (join/leave/remove as special message type) + stale-session rejection | `apps/server/services/groupEventService.js`                           | 190  | 7.1, 5.2   |
| 7.5 | Eric     | Group creation flow: participant selector (from contacts), name input, 3–25 limit                     | `apps/mobile/app/chat/new-group.tsx`, `components/ContactPicker.tsx`  | 210  | 5.5, 7.2   |
| 7.6 | Abdul     | Group session key establishment + rotation on membership change                                       | `apps/mobile/src/crypto/groupKeyManager.ts`                           | 210  | 6.1, 7.5   |
| 7.7 | Eric     | Group chat thread (reuses 1:1 thread components, adds member count header, privacy disclosure)        | `apps/mobile/app/chat/[id].tsx` (extend for groups)                   | 200  | 7.5, 7.6   |
| 7.8 | Abdul     | Group member list screen + admin controls UI (add, remove, leave) + membership events display         | `apps/mobile/app/chat/group-details.tsx`, `components/MemberList.tsx` | 210  | 7.7, 7.3   |

---

## Sprint 8 — Audio & Video Calling

_Server 8.1–8.3 and mobile 8.4–8.8 parallel. Calling is independent of messaging internals — it depends only on contact establishment (Sprint 4)._

| ID  | Developer | Task                                                                                                         | Key Files                                                                              | ~LOC | Depends on |
| --- | --------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---- | ---------- |
| 8.1 | Areta      | Call session DB model (create session, participants, state transitions)                                      | `apps/server/db/models/callSessionModel.js`                                            | 180  | 1.4        |
| 8.2 | Areta      | `POST /api/v1/calls/initiate` + `POST /api/v1/calls/:id/respond` (accept/decline)                            | `apps/server/controllers/callController.js`, `routes/callRoutes.js`                    | 200  | 8.1, 4.2   |
| 8.3 | Vishal    | `POST /api/v1/calls/:id/leave` + `/terminate` + `GET /api/v1/calls/:id/state` + session lifecycle management | `apps/server/controllers/callController.js` (extend), `services/callSessionService.js` | 200  | 8.1        |
| 8.4 | Eric     | 1:1 call initiation: audio + video call buttons in chat header, ringing state                                | `apps/mobile/app/chat/components/CallButtons.tsx`, `app/call/outgoing.tsx`             | 200  | 5.6, 8.2   |
| 8.5 | Eric     | Incoming call screen: full-screen UI, caller Public-ID, accept/decline, background handling                  | `apps/mobile/app/call/incoming.tsx`, `services/callNotificationHandler.ts`             | 210  | 8.4        |
| 8.6 | Abdul     | In-call controls: mute, video toggle, camera switch, speaker toggle, leave + connected/ended/failed states   | `apps/mobile/app/call/active.tsx`, `components/CallControls.tsx`                       | 220  | 8.5        |
| 8.7 | Eric     | Group calling UI: multi-participant layout, participant state display, late join                             | `apps/mobile/app/call/group-call.tsx`, `components/ParticipantGrid.tsx`                | 210  | 8.6, 7.7   |
| 8.8 | Abdul     | Call state management + calls tab history (recent calls list, missed indicator, callback action)             | `apps/mobile/app/(tabs)/calls.tsx` (rewrite), `services/callHistoryStore.ts`           | 200  | 8.6, 8.3   |

---

## Sprint 9 — Hidden Chats Vault

_All mobile. Abdul owns key-derivation tasks; Eric owns access and notification UX. Serial within Abdul's track (9.1 → 9.3 → 9.5); parallel across Abdul and Eric._

| ID  | Developer | Task                                                                                                 | Key Files                                                                     | ~LOC | Depends on |
| --- | --------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---- | ---------- |
| 9.1 | Abdul     | Vault PIN setup: first-time prompt when moving first chat, PIN requirements, key derivation          | `apps/mobile/src/vault/vaultKeyManager.ts`, `app/vault/setup.tsx`             | 210  | 5.8        |
| 9.2 | Eric     | Vault access screen: PIN entry, wrong-PIN limits, auto-lock on background, manual lock               | `apps/mobile/app/vault/unlock.tsx`, `services/vaultLockService.ts`            | 200  | 9.1        |
| 9.3 | Abdul     | Move chat to vault: re-encrypt under vault keys, remove from main inbox, interrupted-transfer safety | `apps/mobile/src/vault/chatMover.ts`, `app/chat/components/MoveToVault.tsx`   | 210  | 9.1, 5.8   |
| 9.4 | Eric     | Vault notifications: generic push indicator only, no content/sender/thread in shade                  | `apps/mobile/services/notificationFilter.ts`, `app/vault/index.tsx`           | 180  | 9.2        |
| 9.5 | Abdul     | Move chat back out of vault + vault settings (PIN change, vault reset, forgotten PIN)                | `apps/mobile/app/vault/settings.tsx`, `src/vault/vaultKeyManager.ts` (extend) | 200  | 9.3        |
| 9.6 | Eric     | Hidden vault entry point in chat list (subtle, always-accessible) + vault chat list view             | `apps/mobile/app/(tabs)/chat.tsx` (extend), `app/vault/index.tsx`             | 180  | 9.2, 5.5   |

---

## Sprint 10 — Duress & Wipe

_All mobile. 10.1–10.2 parallel; 10.3 depends on 10.1; 10.4 depends on 10.3._

| ID   | Developer | Task                                                                                                   | Key Files                                                                            | ~LOC | Depends on |
| ---- | --------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---- | ---------- |
| 10.1 | Eric     | Duress PIN configuration screen (distinct from vault PIN) + panic action setup                         | `apps/mobile/app/settings/duress.tsx`, `services/duressConfigStore.ts`               | 190  | 9.1        |
| 10.2 | Abdul     | Duress trigger logic: vault key destruction on duress PIN entry or panic action, crash-mid-wipe safety | `apps/mobile/src/vault/duressWipe.ts`                                                | 210  | 9.1, 10.1  |
| 10.3 | Eric     | Post-wipe UI state: vault appears empty/reset, main account preserved                                  | `apps/mobile/app/vault/unlock.tsx` (extend), `app/vault/index.tsx` (extend)          | 170  | 10.2       |
| 10.4 | Abdul     | Wipe irreversibility disclosure + stale backup blob explanation (onboarding + settings copy)           | `apps/mobile/app/onboarding/wipe-disclosure.tsx`, `app/settings/duress.tsx` (extend) | 160  | 10.3       |

---

## Sprint 11 — Multi-Device Support

_Server 11.1–11.2 and mobile 11.3–11.6 parallel. 11.3–11.4 (linking flow) depend on server work landing first._

| ID   | Developer | Task                                                                                                                       | Key Files                                                                                           | ~LOC | Depends on |
| ---- | --------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---- | ---------- |
| 11.1 | Areta      | Device registration enforcement (3-device max), device revoke + rapid session invalidation                                 | `apps/server/controllers/deviceController.js`, `routes/deviceRoutes.js`, `db/models/deviceModel.js` | 210  | 1.1, 2.3   |
| 11.2 | Vishal    | Encrypted transfer package: `GET /api/v1/devices/transfer` + `POST /api/v1/devices/transfer` (server never reads it)       | `apps/server/controllers/deviceController.js` (extend)                                              | 200  | 11.1       |
| 11.3 | Eric     | Device linking flow: install on new device → sign in → recovery verification step                                          | `apps/mobile/app/onboarding/link-device.tsx`, `app/onboarding/verify-recovery.tsx`                  | 210  | 11.2, 2.6  |
| 11.4 | Eric     | Transfer sync UI: download encrypted package, progress screen, what's included/excluded disclosure                         | `apps/mobile/app/onboarding/sync-transfer.tsx`, `services/transferService.ts`                       | 200  | 11.3       |
| 11.5 | Eric     | Device management screen: linked devices list, revoke action                                                               | `apps/mobile/app/settings/devices.tsx`                                                              | 180  | 11.3, 11.1 |
| 11.6 | Abdul     | Device-specific chat creation: option at creation, non-exportable keys, label, no-sync guarantee, creation-time disclosure | `apps/mobile/app/chat/new-chat.tsx` (extend), `src/crypto/deviceSpecificKeys.ts`                    | 210  | 5.6, 11.3  |

---

## Sprint 12 — Account Recovery

_Can start after Sprint 2; it just requires the auth + session foundation. Run in parallel with later sprints._

| ID   | Developer | Task                                                                                               | Key Files                                                                                                 | ~LOC | Depends on |
| ---- | --------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- | ---------- |
| 12.1 | Areta      | Recovery option storage + `POST /api/v1/auth/recovery/setup` + `POST /api/v1/auth/recovery/verify` | `apps/server/controllers/recoveryController.js`, `routes/recoveryRoutes.js`, `db/models/recoveryModel.js` | 200  | 2.2        |
| 12.2 | Eric     | Recovery setup screen (onboarding, skippable) — wires up to 12.1                                   | `apps/mobile/app/onboarding/recovery.tsx` (complete 2.6 stub)                                             | 190  | 12.1, 2.6  |
| 12.3 | Abdul     | Recovery verification flow on new-device login (before transferable data restored)                 | `apps/mobile/app/onboarding/link-device.tsx` (extend), `services/recoveryService.ts`                      | 190  | 12.1, 11.3 |

---

## Sprint 13 — Push Notifications

_Server 13.1–13.2 and mobile 13.3–13.4 parallel. Requires Sprint 5 messaging foundation._

| ID   | Developer | Task                                                                                                  | Key Files                                                                               | ~LOC | Depends on |
| ---- | --------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---- | ---------- |
| 13.1 | Areta      | Server-side push notification dispatch: wake-up signal on new envelope, no message content in payload | `apps/server/services/pushService.js`, `config/pushProviders.js`                        | 200  | 5.2        |
| 13.2 | Vishal    | Push metadata minimization: minimal APNs/FCM payload structure + generic notification text            | `apps/server/services/pushService.js` (extend), `config/pushPayload.js`                 | 170  | 13.1       |
| 13.3 | Eric     | Notification mode selector screen (privacy push vs. polling explainer, tradeoff copy)                 | `apps/mobile/app/settings/notifications.tsx`, `services/notificationModeStore.ts`       | 190  | 13.2       |
| 13.4 | Eric     | Per-chat mute settings (mute duration, indefinite) + hidden vault notification filter                 | `apps/mobile/app/chat/settings.tsx` (extend), `services/notificationFilter.ts` (extend) | 180  | 13.3, 9.4  |

---

## Sprint 14 — Retention Jobs & Server Polish

_Server-only. Can run in parallel with Sprint 13 or 12._

| ID   | Developer | Task                                                                                             | Key Files                                                    | ~LOC | Depends on    |
| ---- | --------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ---- | ------------- |
| 14.1 | Areta      | Contact request expiry background job                                                            | `apps/server/jobs/contactExpiryJob.js`                       | 150  | 4.1           |
| 14.2 | Vishal    | Deprecated Public-ID cleanup job (180-day lockout release)                                       | `apps/server/jobs/publicIdCleanupJob.js`                     | 150  | 3.1           |
| 14.3 | Vishal    | Minimal operational logging policy: strip message content + sender-receiver graphs from all logs | `apps/server/middleware/auditLogger.js`, `config/logging.js` | 170  | 5.2, 4.2      |
| 14.4 | Areta      | Rate limiting + anti-abuse on registration, contact-send, and Public-ID endpoints                | `apps/server/middleware/rateLimiter.js`                      | 180  | 2.2, 4.2, 3.2 |

---

## Sprint 15 — Settings, Privacy UI & Profile Tab

_All mobile. Most tasks are parallel; 15.3 depends on 15.1 being scaffolded._

| ID   | Developer | Task                                                                                                                                  | Key Files                                                                          | ~LOC | Depends on      |
| ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---- | --------------- |
| 15.1 | Eric     | Privacy & Safety screen: all privacy settings at a glance (notification mode, disappearing timer default, vault status, device count) | `apps/mobile/app/settings/privacy.tsx`                                             | 200  | 11.5, 13.3, 9.6 |
| 15.2 | Eric     | Account settings screen: username (read-only), password change, logout                                                                | `apps/mobile/app/settings/account.tsx`                                             | 180  | 2.5             |
| 15.3 | Abdul     | Profile tab rewrite: user's own Public-ID display, copy/share, link to manage-id and settings                                         | `apps/mobile/app/(tabs)/profile.tsx` (rewrite)                                     | 190  | 3.5, 15.1, 15.2 |
| 15.4 | Eric     | Hidden vault settings screen: PIN change, vault reset (destroys contents), duress PIN link                                            | `apps/mobile/app/vault/settings.tsx` (extend)                                      | 180  | 9.5, 10.1       |
| 15.5 | Eric     | Chat details screen: contact's Public-ID, disappearing timer, device-specific label, block action                                     | `apps/mobile/app/chat/details.tsx`                                                 | 190  | 5.6, 6.8, 11.6  |
| 15.6 | Abdul     | Chat actions: long-press menu (copy text, delete local message, delete thread, move to vault)                                         | `apps/mobile/app/chat/components/MessageContextMenu.tsx`, `chat/[id].tsx` (extend) | 190  | 5.6, 9.3        |

---

## Sprint 16 — Safety Education & Final Polish

_All mobile. Mostly parallel; 16.1 is a prerequisite for 16.2._

| ID   | Developer | Task                                                                                                                                                                               | Key Files                                                       | ~LOC | Depends on     |
| ---- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---- | -------------- |
| 16.1 | Eric     | Safety education content screens: no discoverability, retention policy, disappearing message limits, vault scope, duress wipe scope, multi-device behavior, notification tradeoffs | `apps/mobile/app/education/index.tsx`, `education/topics/*.tsx` | 210  | 15.1           |
| 16.2 | Abdul     | "What does Loki protect?" summary screen (plain-language; distinguishes risk-reduction from guarantees)                                                                            | `apps/mobile/app/education/summary.tsx`                         | 180  | 16.1           |
| 16.3 | Eric     | Onboarding end-to-end wiring: connect all onboarding screens (2.4 → 2.5 → 3.4 → 3.5 → 2.6 → post-creation landing)                                                                 | `apps/mobile/app/onboarding/_layout.tsx`                        | 180  | 3.5, 2.6, 12.2 |
| 16.4 | Vishal    | Shared package finalization: re-export all types and utilities from `packages/shared/src/index.ts`, add README                                                                     | `packages/shared/src/index.ts`, `packages/shared/README.md`     | 150  | all 1.x        |

---

## Dependency Graph (Sprint-Level)

```
Sprint 1  ──────────────────────────────────────────────────────────► All
Sprint 2  ◄── Sprint 1
Sprint 3  ◄── Sprint 2
Sprint 4  ◄── Sprint 3
Sprint 5  ◄── Sprint 4
Sprint 6  ◄── Sprint 5
Sprint 7  ◄── Sprint 5 (groups run in parallel with Sprint 6)
Sprint 8  ◄── Sprint 4 (calling is independent of messaging internals)
Sprint 9  ◄── Sprint 5, Sprint 6 (vault needs local encrypted store + key layer)
Sprint 10 ◄── Sprint 9
Sprint 11 ◄── Sprint 5 (multi-device), Sprint 2 (auth foundation)
Sprint 12 ◄── Sprint 2 (can start early, run in parallel with Sprints 6–8)
Sprint 13 ◄── Sprint 5 (push hooks into message delivery)
Sprint 14 ◄── Sprint 4, Sprint 3, Sprint 5
Sprint 15 ◄── Sprints 3, 9, 11, 13
Sprint 16 ◄── Sprint 15
```

**Overlap opportunities:**

- Sprint 8 (calling) can start as soon as Sprint 4 closes — it does not wait for Sprint 5 or 6.
- Sprint 12 (account recovery) can start immediately after Sprint 2 and run alongside Sprints 6–8.
- Sprint 14 (server retention jobs) can run in parallel with Sprints 11–13.

---

## Task Count Summary

| Sprint    | Tasks  | Primary Developer(s)       | Parallel with      |
| --------- | ------ | -------------------------- | ------------------ |
| 1         | 8      | All 4                      | —                  |
| 2         | 6      | Areta, Abdul, Eric, Vishal | —                  |
| 3         | 6      | Areta, Eric, Abdul, Vishal | —                  |
| 4         | 6      | Areta, Abdul, Eric, Vishal | —                  |
| 5         | 8      | Areta, Vishal, Eric, Abdul | —                  |
| 6         | 8      | Abdul, Areta, Eric, Vishal | Sprint 7 (partial) |
| 7         | 8      | Areta, Vishal, Eric, Abdul | Sprint 6           |
| 8         | 8      | Areta, Vishal, Eric, Abdul | Sprints 6–7        |
| 9         | 6      | Abdul, Eric               | Sprint 12          |
| 10        | 4      | Abdul, Eric               | Sprint 11, 12      |
| 11        | 6      | Areta, Vishal, Eric, Abdul | Sprint 12, 14      |
| 12        | 3      | Areta, Eric, Abdul         | Sprints 6–11       |
| 13        | 4      | Areta, Vishal, Eric        | Sprint 14          |
| 14        | 4      | Areta, Vishal               | Sprint 13          |
| 15        | 6      | Eric, Abdul               | —                  |
| 16        | 4      | Eric, Abdul, Vishal       | —                  |
| **Total** | **95** |                            |                    |

**~95 tasks × ~200 LOC = ~19,000 LOC for the full MVP**
