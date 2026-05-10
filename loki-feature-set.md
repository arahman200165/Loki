# Loki Feature Set

## Document Status

- Product: Loki
- Document Type: Comprehensive Feature Set
- Scope: MVP (with post-MVP callouts)
- Based on: `loki-mvp-prd.md`
- Last Updated: 2026-05-10

---

## Index

1. [Account & Identity](#1-account--identity)
   - 1.1 [Account Creation](#11-account-creation)
   - 1.2 [Private Credentials](#12-private-credentials)
   - 1.3 [Public-ID System](#13-public-id-system)
   - 1.4 [Account Recovery](#14-account-recovery)
   - 1.5 [Account Login](#15-account-login)

2. [Contact Establishment](#2-contact-establishment)
   - 2.1 [Public-ID Request Flow](#21-public-id-request-flow)
   - 2.2 [Incoming Request Handling](#22-incoming-request-handling)
   - 2.3 [Anti-Enumeration Behavior](#23-anti-enumeration-behavior)
   - 2.4 [Blocking](#24-blocking)

3. [1:1 Messaging](#3-11-messaging)
   - 3.1 [Core Chat](#31-core-chat)
   - 3.2 [Message Types](#32-message-types)
   - 3.3 [Message States](#33-message-states)
   - 3.4 [Disappearing Messages](#34-disappearing-messages)
   - 3.5 [Chat Actions](#35-chat-actions)

4. [Group Messaging](#4-group-messaging)
   - 4.1 [Group Creation](#41-group-creation)
   - 4.2 [Group Membership](#42-group-membership)
   - 4.3 [Group Admin Controls](#43-group-admin-controls)
   - 4.4 [Group Message Features](#44-group-message-features)

5. [Audio & Video Calling](#5-audio--video-calling)
   - 5.1 [1:1 Calling](#51-11-calling)
   - 5.2 [Group Calling](#52-group-calling)
   - 5.3 [In-Call Controls](#53-in-call-controls)
   - 5.4 [Call State Management](#54-call-state-management)

6. [Encryption & Delivery](#6-encryption--delivery)
   - 6.1 [End-to-End Encryption](#61-end-to-end-encryption)
   - 6.2 [Short-Retention Delivery](#62-short-retention-delivery)
   - 6.3 [Local Encrypted Storage](#63-local-encrypted-storage)

7. [Hidden Chats Vault](#7-hidden-chats-vault)
   - 7.1 [Vault Setup](#71-vault-setup)
   - 7.2 [Vault Access](#72-vault-access)
   - 7.3 [Moving Chats](#73-moving-chats)
   - 7.4 [Vault Notifications](#74-vault-notifications)

8. [Duress & Wipe](#8-duress--wipe)
   - 8.1 [Duress PIN Configuration](#81-duress-pin-configuration)
   - 8.2 [Duress Trigger Behavior](#82-duress-trigger-behavior)
   - 8.3 [Post-Wipe State](#83-post-wipe-state)

9. [Multi-Device Support](#9-multi-device-support)
   - 9.1 [Device Linking](#91-device-linking)
   - 9.2 [Transferable Data Sync](#92-transferable-data-sync)
   - 9.3 [Device-Specific Chats](#93-device-specific-chats)
   - 9.4 [Device Management](#94-device-management)

10. [Notifications](#10-notifications)
    - 10.1 [Push Notification Modes](#101-push-notification-modes)
    - 10.2 [Notification Content Privacy](#102-notification-content-privacy)
    - 10.3 [Per-Chat Notification Settings](#103-per-chat-notification-settings)

11. [Privacy Settings & Safety Education](#11-privacy-settings--safety-education)
    - 11.1 [Privacy Settings Screen](#111-privacy-settings-screen)
    - 11.2 [Safety Education Content](#112-safety-education-content)

12. [App Navigation & Shell](#12-app-navigation--shell)
    - 12.1 [Onboarding Flow](#121-onboarding-flow)
    - 12.2 [Inbox / Chat List](#122-inbox--chat-list)
    - 12.3 [Calls Tab](#123-calls-tab)
    - 12.4 [Profile & Settings](#124-profile--settings)
    - 12.5 [Splash Screen](#125-splash-screen)

13. [Backend API](#13-backend-api)
    - 13.1 [Account & Auth Endpoints](#131-account--auth-endpoints)
    - 13.2 [Public-ID Endpoints](#132-public-id-endpoints)
    - 13.3 [Message Delivery Endpoints](#133-message-delivery-endpoints)
    - 13.4 [Group Endpoints](#134-group-endpoints)
    - 13.5 [Call Signaling Endpoints](#135-call-signaling-endpoints)
    - 13.6 [Device Endpoints](#136-device-endpoints)
    - 13.7 [Retention Jobs](#137-retention-jobs)

14. [Shared Package](#14-shared-package)

15. [Post-MVP Feature Backlog](#15-post-mvp-feature-backlog)

---

## 1. Account & Identity

### 1.1 Account Creation

| #     | Feature                         | Description                                                                                                                                                                                                                                                            | Platform        |
| ----- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1.1.1 | Anonymous account creation      | User creates an account without entering a phone number or email address at any point in the flow                                                                                                                                                                      | Mobile + Server |
| 1.1.2 | Account creation entry point    | "Create Private Account" button shown on first launch and on the login screen                                                                                                                                                                                          | Mobile          |
| 1.1.3 | Identity model explainer        | Before credentials are collected, a screen explains: no public directory, no global search, private username is for login only, contact happens through exact Public-ID entry only, request senders are not told whether a Public-ID exists until recipient acceptance | Mobile          |
| 1.1.4 | Under-2-minute creation target  | End-to-end account creation must be completable in under 2 minutes                                                                                                                                                                                                     | Mobile + Server |
| 1.1.5 | Account creation error handling | App handles: app terminated mid-creation, registration success but local session save failure, username already in use, Public-ID already in use, Public-ID format violation, Public-ID matches reserved/blocked terms                                                 | Mobile + Server |
| 1.1.6 | First-device auto-registration  | Account creation automatically registers the first device mailbox on the server                                                                                                                                                                                        | Mobile + Server |
| 1.1.7 | Post-creation landing           | User lands in empty inbox immediately after completing account setup                                                                                                                                                                                                   | Mobile          |

### 1.2 Private Credentials

| #     | Feature                         | Description                                                                                                                                             | Platform        |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1.2.1 | Private username                | User chooses a private username used only for login; never shown to other users, never searchable                                                       | Mobile + Server |
| 1.2.2 | Password                        | User sets a strong password during onboarding                                                                                                           | Mobile + Server |
| 1.2.3 | Credential separation           | Private username is strictly separated from Public-ID at all layers; server never exposes private username to any other user or through any API surface | Server          |
| 1.2.4 | Username uniqueness enforcement | Backend enforces unique private usernames and returns a clear error on collision                                                                        | Server          |
| 1.2.5 | Password lockout warning        | Onboarding explicitly warns that losing a password without configured recovery options may cause account lockout                                        | Mobile          |

### 1.3 Public-ID System

| #      | Feature                        | Description                                                                                                                                                                                                                                                                                                          | Platform        |
| ------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1.3.1  | User-chosen Public-ID          | User selects their own Public-ID during onboarding rather than receiving a system-assigned one                                                                                                                                                                                                                       | Mobile + Server |
| 1.3.2  | Public-ID format validation    | Allowed characters: `a–z`, `0–9`, single hyphen (`-`) between characters only; minimum 8 characters, maximum 24 characters; must start with a letter; must not end with a hyphen; no consecutive hyphens (`--`)                                                                                                      | Mobile + Server |
| 1.3.3  | Public-ID normalization        | Lowercase-only, leading/trailing whitespace trimmed before any validation                                                                                                                                                                                                                                            | Mobile + Server |
| 1.3.4  | Public-ID uniqueness check     | Backend verifies uniqueness before accepting; returns format-safe error if already taken                                                                                                                                                                                                                             | Server          |
| 1.3.5  | Reserved-name blocklist        | Rejects IDs matching system/staff terms (`admin`, `support`, `security`, `moderator`, `system`, `loki`, `official`), infrastructure terms (`api`, `web`, `mail`, `root`, `null`, `undefined`), emergency/trust terms (`help`, `safety`, `verify`, `verified`, `trust`), and a server-maintained protected-brand list | Server          |
| 1.3.6  | Confusable-ID rejection        | IDs that are visually confusable with any existing active ID (after normalization and confusable mapping) are rejected                                                                                                                                                                                               | Server          |
| 1.3.7  | Public-ID display              | App displays the user's own Public-ID with copy and share actions                                                                                                                                                                                                                                                    | Mobile          |
| 1.3.8  | Public-ID rotation             | User can replace their current Public-ID with a new one; the old value enters a deprecated state                                                                                                                                                                                                                     | Mobile + Server |
| 1.3.9  | Rotation cooldown              | One free Public-ID change permitted every 7 days; subsequent changes within the 7-day window require a paid change token                                                                                                                                                                                             | Mobile + Server |
| 1.3.10 | Free-change countdown UI       | Public-ID management screen shows time remaining until next free change is available                                                                                                                                                                                                                                 | Mobile          |
| 1.3.11 | Paid change option             | When inside the cooldown window, UI surfaces a paid change token purchase flow                                                                                                                                                                                                                                       | Mobile          |
| 1.3.12 | Paid change failure handling   | If token purchase fails or is cancelled, no rotation is triggered; user is returned to current Public-ID screen                                                                                                                                                                                                      | Mobile          |
| 1.3.13 | Deprecated-ID lockout period   | A rotated/deprecated Public-ID cannot be reclaimed by anyone for 180 days                                                                                                                                                                                                                                            | Server          |
| 1.3.14 | Deprecated-ID for new requests | A deprecated Public-ID cannot receive new inbound contact requests; existing active conversations are unaffected                                                                                                                                                                                                     | Server          |
| 1.3.15 | Rotation confirmation UI       | Before completing rotation, app clearly shows: the new Public-ID, that the old ID will be deprecated, and that the old ID cannot be used for new inbound requests                                                                                                                                                    | Mobile          |

### 1.4 Account Recovery

| #     | Feature                                | Description                                                                                                                                 | Platform        |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1.4.1 | Optional recovery setup                | During onboarding, user is offered an optional recovery configuration step                                                                  | Mobile          |
| 1.4.2 | Recovery required for new-device login | Credential-based login on a brand-new device requires a configured recovery/auth verification control before transferable data is restored  | Mobile + Server |
| 1.4.3 | Recovery setup skip                    | User may skip recovery setup; skipping means they cannot restore transferable data on a new device via credential flow                      | Mobile          |
| 1.4.4 | No-recovery warning                    | If recovery is skipped or not configured, app surfaces a clear warning that account access may be permanently lost if password is forgotten | Mobile          |

### 1.5 Account Login

| #     | Feature                | Description                                                                                   | Platform        |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------- | --------------- |
| 1.5.1 | Login screen           | Dedicated login screen with clear "Sign in to existing account on this device" path           | Mobile          |
| 1.5.2 | Credential-based login | User enters private username and password to authenticate                                     | Mobile + Server |
| 1.5.3 | Session token issuance | Server issues a session token on successful authentication; stored in encrypted local storage | Mobile + Server |
| 1.5.4 | Login error states     | Clear error messaging for: wrong credentials, account not found, network failure              | Mobile          |
| 1.5.5 | Logout                 | User can log out from profile/settings; session token is invalidated server-side              | Mobile + Server |

---

## 2. Contact Establishment

### 2.1 Public-ID Request Flow

| #     | Feature                           | Description                                                                                                                                          | Platform        |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2.1.1 | New Chat entry point              | "New Chat" button in inbox; tapping opens the Public-ID entry screen                                                                                 | Mobile          |
| 2.1.2 | Exact-match Public-ID entry       | User types the recipient's full, exact Public-ID; no typeahead, no suggestions, no partial matching                                                  | Mobile          |
| 2.1.3 | First message/request submission  | Along with the Public-ID entry, sender can attach a first message or request note before submission                                                  | Mobile          |
| 2.1.4 | Pending state creation            | Backend creates a pending contact request without disclosing to the sender whether the Public-ID belongs to a real account                           | Server          |
| 2.1.5 | Anti-enumeration on invalid IDs   | Invalid, unknown, reserved, confusable, and deprecated Public-ID inputs all receive the same neutral response; sender cannot distinguish these cases | Server          |
| 2.1.6 | Under-60-second connection target | A user who has the other person's Public-ID must be able to initiate a contact request in under 60 seconds                                           | Mobile          |
| 2.1.7 | No "people you may know"          | App never surfaces contact suggestions, recommended users, or social-graph-derived lists                                                             | Mobile          |
| 2.1.8 | No typeahead search               | No global user search, no partial-ID typeahead, no lookup-by-name surface anywhere in the app                                                        | Mobile + Server |

### 2.2 Incoming Request Handling

| #     | Feature                  | Description                                                                                      | Platform        |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------ | --------------- |
| 2.2.1 | Pending requests inbox   | Dedicated section or screen listing all incoming pending contact requests                        | Mobile          |
| 2.2.2 | Sender Public-ID display | Incoming request shows sender's Public-ID and optional first message                             | Mobile          |
| 2.2.3 | Accept request           | Recipient taps Accept; a chat thread is created and the sender is now confirmed connected        | Mobile + Server |
| 2.2.4 | Deny request             | Recipient taps Deny; request is dismissed; sender receives no account-existence confirmation     | Mobile + Server |
| 2.2.5 | Request expiry           | Pending requests that are neither accepted nor denied within the system TTL expire automatically | Server          |

### 2.3 Anti-Enumeration Behavior

| #     | Feature                                     | Description                                                                                                                                                   | Platform        |
| ----- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2.3.1 | Uniform response for all unknown IDs        | Server returns the same response shape for: non-existent IDs, deprecated IDs, reserved IDs, and format-invalid IDs — no information distinguishes these cases | Server          |
| 2.3.2 | No existence confirmation before acceptance | Sender receives zero indication that a Public-ID is tied to a real account until the recipient explicitly accepts                                             | Server          |
| 2.3.3 | No account-existence leaks in error states  | All error paths (network errors, validation errors, server errors) are designed to not reveal account existence as a side channel                             | Mobile + Server |

### 2.4 Blocking

| #     | Feature                          | Description                                                                                                                        | Platform        |
| ----- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2.4.1 | Block contact                    | User can block a contact; blocked contacts cannot send new requests or messages                                                    | Mobile + Server |
| 2.4.2 | Block from request screen        | User can block from an incoming request without accepting                                                                          | Mobile          |
| 2.4.3 | Block does not confirm existence | Blocking a user does not send a notification to the blocked party and does not confirm the account's existence to the blocked user | Server          |

---

## 3. 1:1 Messaging

### 3.1 Core Chat

| #     | Feature                            | Description                                                                                              | Platform |
| ----- | ---------------------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| 3.1.1 | Open chat thread                   | Tap a conversation in inbox to open the full chat thread view                                            | Mobile   |
| 3.1.2 | Text message composition           | Text input field with send button in every chat thread                                                   | Mobile   |
| 3.1.3 | Client-side encryption before send | App encrypts message content locally before transmitting to the backend                                  | Mobile   |
| 3.1.4 | Encrypted envelope relay           | Backend receives, stores, and delivers encrypted envelopes without access to plaintext                   | Server   |
| 3.1.5 | Client-side decryption on receive  | Recipient app decrypts message locally after fetching envelope from server                               | Mobile   |
| 3.1.6 | Local encrypted persistence        | All messages are stored locally in encrypted storage on the device                                       | Mobile   |
| 3.1.7 | Offline message queuing            | Outbound messages sent while recipient is offline are held in the server delivery queue until TTL expiry | Server   |

### 3.2 Message Types

| #     | Feature           | Description                                                            | Platform        |
| ----- | ----------------- | ---------------------------------------------------------------------- | --------------- |
| 3.2.1 | Text messages     | Plain text messages in 1:1 chats                                       | Mobile + Server |
| 3.2.2 | Image attachments | User can attach and send images; attachment is encrypted before upload | Mobile + Server |
| 3.2.3 | File attachments  | User can attach and send files; attachment is encrypted before upload  | Mobile + Server |
| 3.2.4 | Voice notes       | User can record and send audio clips inline in chat                    | Mobile + Server |
| 3.2.5 | Reactions         | User can react to any message with an emoji reaction                   | Mobile + Server |
| 3.2.6 | Stickers          | User can send stickers from a sticker picker                           | Mobile + Server |

### 3.3 Message States

| #     | Feature         | Description                                                                               | Platform |
| ----- | --------------- | ----------------------------------------------------------------------------------------- | -------- |
| 3.3.1 | Sending state   | Visual indicator that the message is being encrypted and transmitted                      | Mobile   |
| 3.3.2 | Delivered state | Visual indicator that the server has acknowledged receipt of the encrypted envelope       | Mobile   |
| 3.3.3 | Read state      | Minimal read receipt indicator consistent with privacy posture                            | Mobile   |
| 3.3.4 | Failed state    | Visual indicator and retry option when a message fails to send                            | Mobile   |
| 3.3.5 | Expired state   | Indicator shown to sender when a message envelope expired before the recipient fetched it | Mobile   |

### 3.4 Disappearing Messages

| #      | Feature                                    | Description                                                                                                   | Platform        |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------- |
| 3.4.1  | Per-chat disappearing timer                | User can set a disappearing message timer at the conversation level from chat settings                        | Mobile + Server |
| 3.4.2  | Timer options                              | Available presets: Off, 15 seconds, 30 seconds, 5 minutes, 1 hour                                             | Mobile          |
| 3.4.3  | Timer starts after read                    | Timer begins counting down after the message has been read by the recipient                                   | Mobile          |
| 3.4.4  | Chat-wide application                      | When one participant sets a timer, it applies to all new messages in that chat                                | Mobile + Server |
| 3.4.5  | Participant override                       | The other participant can change the timer; the override applies only to messages sent after the change       | Mobile + Server |
| 3.4.6  | Per-message timer preservation             | Messages keep the timer policy that was active when they were sent; retroactive re-timing does not occur      | Mobile          |
| 3.4.7  | Automatic local removal                    | Messages are automatically deleted from local storage when their timer completes                              | Mobile          |
| 3.4.8  | Timer state visible in chat UI             | Chat header or settings icon shows the currently active timer setting                                         | Mobile          |
| 3.4.9  | Timer change notification                  | A visible system event appears in the chat thread when the timer is changed by either participant             | Mobile          |
| 3.4.10 | Disappearing-message limitation disclosure | App communicates clearly that disappearing messages do not prevent screenshots, forwarding, or copied content | Mobile          |
| 3.4.11 | Server-side expiry alignment               | Server should not retain disappearing-message envelope content beyond relay necessity                         | Server          |

### 3.5 Chat Actions

| #     | Feature                   | Description                                                                                                     | Platform |
| ----- | ------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| 3.5.1 | Move chat to Hidden Vault | Long-press or chat menu action to move a 1:1 chat into the hidden vault                                         | Mobile   |
| 3.5.2 | Delete local chat thread  | User can delete a chat thread from their device; does not delete from recipient                                 | Mobile   |
| 3.5.3 | Copy message text         | Long-press on a message to copy its text content                                                                | Mobile   |
| 3.5.4 | Delete local message      | User can delete an individual message from their own local storage                                              | Mobile   |
| 3.5.5 | Chat details screen       | Accessible from chat header; shows contact's Public-ID, disappearing timer, device-specific label if applicable | Mobile   |

---

## 4. Group Messaging

### 4.1 Group Creation

| #     | Feature                         | Description                                                                                | Platform        |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------ | --------------- |
| 4.1.1 | New Group entry point           | "New Group" button accessible from the inbox                                               | Mobile          |
| 4.1.2 | Participant selection           | Creator selects initial participants from existing contacts (accepted connections)         | Mobile          |
| 4.1.3 | Group name                      | Creator sets a group name before creation                                                  | Mobile          |
| 4.1.4 | Group size limits               | Minimum 3 participants; maximum 25 participants                                            | Mobile + Server |
| 4.1.5 | Under-30-second creation target | Group creation from tap to first message capability must be achievable in under 30 seconds | Mobile          |
| 4.1.6 | Group key establishment         | App establishes group session and encryption keys on creation                              | Mobile + Server |
| 4.1.7 | Join event                      | All participants receive a visible system event confirming they joined the group           | Mobile          |

### 4.2 Group Membership

| #     | Feature                           | Description                                                                                              | Platform        |
| ----- | --------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------- |
| 4.2.1 | Membership visible to all members | All current participants can see the group member list                                                   | Mobile          |
| 4.2.2 | Leave group                       | Any participant can leave the group at any time                                                          | Mobile + Server |
| 4.2.3 | Leave event                       | A visible system event appears in the chat thread when a participant leaves                              | Mobile          |
| 4.2.4 | Invitee decline                   | If an invited user declines to join, a system event reflects this                                        | Mobile + Server |
| 4.2.5 | Removed member event              | A visible system event appears when a member is removed by an admin                                      | Mobile          |
| 4.2.6 | Stale-session protection          | A removed member's messages sent with a stale session key after removal are rejected                     | Server          |
| 4.2.7 | Group metadata minimization       | Server-side group metadata is limited to what is operationally necessary; no rich social graph is stored | Server          |

### 4.3 Group Admin Controls

| #     | Feature               | Description                                                                         | Platform        |
| ----- | --------------------- | ----------------------------------------------------------------------------------- | --------------- |
| 4.3.1 | Creator becomes admin | The group creator is automatically the first admin                                  | Mobile + Server |
| 4.3.2 | Add participants      | Admin can add new participants to the group                                         | Mobile + Server |
| 4.3.3 | Remove participants   | Admin can remove existing participants from the group                               | Mobile + Server |
| 4.3.4 | Admin leave handling  | If the admin leaves the group, admin role transfers or group enters a defined state | Mobile + Server |

### 4.4 Group Message Features

| #     | Feature                         | Description                                                                                              | Platform        |
| ----- | ------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------- |
| 4.4.1 | All 1:1 message types in groups | Text, images, files, voice notes, reactions, and stickers all work in group chats                        | Mobile + Server |
| 4.4.2 | Group disappearing messages     | Disappearing message timers apply to group chats with the same logic as 1:1 chats                        | Mobile + Server |
| 4.4.3 | Move group to Hidden Vault      | Group chats can be moved to the hidden vault in the same way as 1:1 chats                                | Mobile          |
| 4.4.4 | Group privacy disclosure        | App copy notes that group privacy depends on all participants keeping their devices and practices secure | Mobile          |

---

## 5. Audio & Video Calling

### 5.1 1:1 Calling

| #     | Feature                          | Description                                                                                    | Platform        |
| ----- | -------------------------------- | ---------------------------------------------------------------------------------------------- | --------------- |
| 5.1.1 | Start audio call from 1:1 chat   | Audio call button accessible from a 1:1 chat thread header                                     | Mobile          |
| 5.1.2 | Start video call from 1:1 chat   | Video call button accessible from a 1:1 chat thread header                                     | Mobile          |
| 5.1.3 | Incoming call screen             | Full-screen incoming call UI with caller's Public-ID, accept button, and decline button        | Mobile          |
| 5.1.4 | Incoming call while backgrounded | App surfaces call UI even when the app is in the background via notification or system call UI | Mobile          |
| 5.1.5 | Call signaling via backend       | Call session creation and invite delivery handled through backend call endpoints               | Mobile + Server |

### 5.2 Group Calling

| #     | Feature                   | Description                                                                     | Platform        |
| ----- | ------------------------- | ------------------------------------------------------------------------------- | --------------- |
| 5.2.1 | Start group audio call    | Audio call button accessible from a group chat thread                           | Mobile          |
| 5.2.2 | Start group video call    | Video call button accessible from a group chat thread                           | Mobile          |
| 5.2.3 | Group call invites        | All group participants receive a call invite when a group call is started       | Mobile + Server |
| 5.2.4 | Late join                 | A participant can join a group call after it has already started                | Mobile + Server |
| 5.2.5 | Participant state display | In-call screen shows which participants are connected, muted, or have video off | Mobile          |

### 5.3 In-Call Controls

| #     | Feature              | Description                                                            | Platform |
| ----- | -------------------- | ---------------------------------------------------------------------- | -------- |
| 5.3.1 | Mute/unmute audio    | User can toggle their microphone during a call                         | Mobile   |
| 5.3.2 | Enable/disable video | User can toggle their camera during a call                             | Mobile   |
| 5.3.3 | Switch camera        | User can switch between front and rear camera during a video call      | Mobile   |
| 5.3.4 | Speaker toggle       | User can toggle between earpiece and speakerphone during an audio call | Mobile   |
| 5.3.5 | Leave call           | User can leave/end the call at any time                                | Mobile   |

### 5.4 Call State Management

| #     | Feature                      | Description                                                                                                    | Platform |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| 5.4.1 | Ringing state                | Visual and audio indication that the call is waiting for recipient to answer                                   | Mobile   |
| 5.4.2 | Connected state              | Clear visual state change when the call is established                                                         | Mobile   |
| 5.4.3 | Ended state                  | App returns user to chat thread after call ends; call duration displayed                                       | Mobile   |
| 5.4.4 | Declined state               | Explicit UI when a call is declined by recipient                                                               | Mobile   |
| 5.4.5 | Failed/dropped state         | Clear error state with retry option when a call fails to connect or drops                                      | Mobile   |
| 5.4.6 | Network degradation handling | App handles poor network gracefully and shows degraded-quality indicators                                      | Mobile   |
| 5.4.7 | Hidden vault call behavior   | Calls from hidden-vault contacts respect vault privacy; caller identity is not shown outside the vault context | Mobile   |
| 5.4.8 | Call session lifecycle       | Backend manages call session create, join, leave, and terminate lifecycle                                      | Server   |

---

## 6. Encryption & Delivery

### 6.1 End-to-End Encryption

| #     | Feature                      | Description                                                                                                          | Platform        |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------- |
| 6.1.1 | Client-side key generation   | Each device generates its own cryptographic key material locally                                                     | Mobile          |
| 6.1.2 | Device-level encryption      | Encryption keys are tied to device identity, not just account                                                        | Mobile          |
| 6.1.3 | Server never holds plaintext | Backend receives, stores, and forwards only encrypted envelopes; no server-side plaintext at any point               | Server          |
| 6.1.4 | Group session key management | Group encryption session keys are established and rotated on membership changes                                      | Mobile + Server |
| 6.1.5 | Device key mismatch handling | App handles decryption failure from key mismatch gracefully with a visible error; does not silently discard or crash | Mobile          |
| 6.1.6 | Stale session state recovery | App can recover or re-establish a session when decryption fails due to stale session state                           | Mobile          |

### 6.2 Short-Retention Delivery

| #      | Feature                              | Description                                                                                                           | Platform |
| ------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------- |
| 6.2.1  | Per-device mailbox                   | Each registered device has its own delivery mailbox on the server                                                     | Server   |
| 6.2.2  | Encrypted envelope store-and-forward | Server stores encrypted envelopes temporarily until fetched by the recipient device                                   | Server   |
| 6.2.3  | Default TTL                          | Default delivery retention window of 24–72 hours; favors privacy over long offline convenience                        | Server   |
| 6.2.4  | Configurable TTL                     | TTL policies are configurable; account-level settings can adjust retention window (clearly explained to user)         | Server   |
| 6.2.5  | Post-fetch deletion                  | Encrypted envelopes are deleted from the server after the recipient device acknowledges receipt                       | Server   |
| 6.2.6  | TTL-based expiry deletion            | Envelopes not fetched within TTL are deleted automatically by the retention cleanup job                               | Server   |
| 6.2.7  | Duplicate delivery prevention        | Server handles duplicate fetch requests gracefully to avoid double-delivery                                           | Server   |
| 6.2.8  | Ack loss recovery                    | If an ack is lost due to network failure, the delivery system handles safe re-delivery without duplicate side effects | Server   |
| 6.2.9  | Clock-drift tolerance                | TTL handling accounts for reasonable clock drift between server and client                                            | Server   |
| 6.2.10 | Expiry warning to sender             | App shows a warning when a message may expire before the recipient comes online to fetch it                           | Mobile   |
| 6.2.11 | No permanent server archive          | No code path results in messages being written to a permanent server-side archive                                     | Server   |

### 6.3 Local Encrypted Storage

| #     | Feature                       | Description                                                                                   | Platform |
| ----- | ----------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| 6.3.1 | Encrypted local message store | All local message data is stored in an encrypted local database                               | Mobile   |
| 6.3.2 | Encrypted credentials storage | Session tokens and authentication credentials are stored in encrypted local storage           | Mobile   |
| 6.3.3 | Separate vault storage        | Hidden vault chat data is encrypted under separate local vault keys, not the main storage key | Mobile   |

---

## 7. Hidden Chats Vault

### 7.1 Vault Setup

| #     | Feature                    | Description                                                                                | Platform |
| ----- | -------------------------- | ------------------------------------------------------------------------------------------ | -------- |
| 7.1.1 | First-time vault PIN setup | When a user first moves a chat to the hidden vault, app prompts them to create a vault PIN | Mobile   |
| 7.1.2 | Vault PIN requirements     | Vault PIN must be distinct from the main app PIN/lock (if applicable)                      | Mobile   |
| 7.1.3 | Vault key derivation       | App derives hidden vault encryption keys from the vault PIN                                | Mobile   |
| 7.1.4 | Vault key storage          | Vault keys are sealed locally; they are never transmitted to the server                    | Mobile   |

### 7.2 Vault Access

| #     | Feature                  | Description                                                                                                                                     | Platform |
| ----- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.2.1 | Hidden Vault entry point | A dedicated, non-obvious entry point in the chat list or settings that opens the vault PIN screen                                               | Mobile   |
| 7.2.2 | PIN entry screen         | User enters the vault PIN to unlock and reveal hidden chats                                                                                     | Mobile   |
| 7.2.3 | Vault auto-lock          | Vault locks automatically when the app is backgrounded or after a configurable idle timeout                                                     | Mobile   |
| 7.2.4 | Manual vault lock        | User can manually lock the vault from within the vault view                                                                                     | Mobile   |
| 7.2.5 | Wrong PIN handling       | App limits wrong PIN attempts and shows appropriate error feedback                                                                              | Mobile   |
| 7.2.6 | Forgotten vault PIN      | If vault PIN is forgotten, vault contents are inaccessible; app explains this and optionally offers vault reset (which destroys vault contents) | Mobile   |

### 7.3 Moving Chats

| #     | Feature                            | Description                                                                                                                  | Platform |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.3.1 | Move to Hidden Vault action        | Available from 1:1 and group chat long-press menu or chat details screen                                                     | Mobile   |
| 7.3.2 | Re-encryption on move              | Chat data is re-encrypted under vault keys when moved into the vault                                                         | Mobile   |
| 7.3.3 | Chat disappears from main inbox    | After moving, the chat is no longer visible in the standard chat list                                                        | Mobile   |
| 7.3.4 | Interrupted re-encryption handling | If the re-encryption process is interrupted (e.g., app killed), the chat remains in a safe state and the move can be retried | Mobile   |
| 7.3.5 | Move out of vault                  | User can move a chat back out of the vault from within the vault view                                                        | Mobile   |
| 7.3.6 | Vault limitation disclosure        | App clearly states that the hidden vault protects local exposure only, not the recipient's copy of data                      | Mobile   |

### 7.4 Vault Notifications

| #     | Feature                                | Description                                                                                                     | Platform |
| ----- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| 7.4.1 | No content in vault notifications      | Incoming messages to hidden-vault chats do not show content, sender, or thread name in any notification         | Mobile   |
| 7.4.2 | Generic vault notification             | Notification for a hidden-vault message shows only a generic indicator (e.g., "You have a new message in Loki") | Mobile   |
| 7.4.3 | No vault threads in notification shade | Vault chat names and message previews do not appear in the notification shade or system notification center     | Mobile   |

---

## 8. Duress & Wipe

### 8.1 Duress PIN Configuration

| #     | Feature                            | Description                                                                                                      | Platform |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| 8.1.1 | Duress PIN setup                   | User can optionally configure a separate duress PIN in settings                                                  | Mobile   |
| 8.1.2 | Duress PIN distinct from vault PIN | Duress PIN must be different from the normal vault PIN                                                           | Mobile   |
| 8.1.3 | Duress PIN skip                    | Duress PIN is optional; user can skip it                                                                         | Mobile   |
| 8.1.4 | Panic action configuration         | User can optionally configure a panic action (e.g., a gesture or lock screen shortcut) as an alternative trigger | Mobile   |

### 8.2 Duress Trigger Behavior

| #     | Feature                        | Description                                                                                                                        | Platform |
| ----- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 8.2.1 | Duress PIN entry trigger       | Entering the duress PIN at the vault unlock screen silently triggers the duress action instead of opening the vault                | Mobile   |
| 8.2.2 | Panic action trigger           | Triggering the configured panic action activates the duress sequence                                                               | Mobile   |
| 8.2.3 | Vault key destruction          | Duress action irreversibly destroys the local hidden vault encryption keys                                                         | Mobile   |
| 8.2.4 | Duress action speed            | Duress action must complete quickly and reliably; it must not be slow or fail silently                                             | Mobile   |
| 8.2.5 | App crash during wipe recovery | If the app crashes mid-wipe, the vault remains in an inaccessible state after restart; partial wipe is treated as a completed wipe | Mobile   |

### 8.3 Post-Wipe State

| #     | Feature                      | Description                                                                                                                                                       | Platform |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 8.3.1 | Vault appears empty or reset | After duress wipe, vault entry shows an empty or reset state                                                                                                      | Mobile   |
| 8.3.2 | Main account preserved       | The main account and non-vault chats remain intact unless the product security design specifies a full logout                                                     | Mobile   |
| 8.3.3 | Wipe irreversibility         | There is no undo for the duress wipe; local vault data cannot be recovered after key destruction                                                                  | Mobile   |
| 8.3.4 | Wipe limitation disclosure   | App copy and onboarding clearly state: this wipes local protected data only, it does not remove messages from recipient devices, and it is irreversible           | Mobile   |
| 8.3.5 | Stale backup blobs           | Device backups that are restored after a duress wipe will contain encrypted blobs without keys; the vault data will remain inaccessible even after backup restore | Mobile   |

---

## 9. Multi-Device Support

### 9.1 Device Linking

| #     | Feature                             | Description                                                                                                                     | Platform        |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 9.1.1 | Sign in on new device               | User installs Loki on a second device and uses "Sign In" to link it to an existing account                                      | Mobile + Server |
| 9.1.2 | Credential-based link               | User enters existing private username and password on the new device                                                            | Mobile          |
| 9.1.3 | Recovery/auth verification required | New-device login requires the user to pass a configured recovery or auth verification step before transferable data is restored | Mobile + Server |
| 9.1.4 | Backend authorizes new device       | Server validates credentials and recovery/auth step, then registers the new device mailbox                                      | Server          |
| 9.1.5 | Maximum 3 active devices            | An account can have at most 3 simultaneously linked devices; a 4th device is blocked until one is removed                       | Mobile + Server |
| 9.1.6 | Independent device mailboxes        | Each linked device has its own independent delivery mailbox; messages are delivered to each device separately                   | Server          |

### 9.2 Transferable Data Sync

| #     | Feature                                  | Description                                                                                                     | Platform        |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------- |
| 9.2.1 | Encrypted cloud-hosted transferable data | Transferable account data is stored as an encrypted cloud package on the backend; server cannot read it         | Server          |
| 9.2.2 | Transfer of non-device-specific chats    | After linking, the new device downloads and decrypts all non-device-specific chats                              | Mobile + Server |
| 9.2.3 | Transfer of vault contents               | Transferable hidden vault contents are included in the encrypted cloud package                                  | Mobile + Server |
| 9.2.4 | Transfer of core account state           | Core account settings and state are transferred to the new device                                               | Mobile + Server |
| 9.2.5 | Forward-looking message sync             | After linking, new messages arrive on all linked devices going forward                                          | Mobile + Server |
| 9.2.6 | Interrupted transfer recovery            | If the cloud transfer is interrupted midway, the device can retry the download                                  | Mobile          |
| 9.2.7 | Transfer failure handling                | If the new device cannot decrypt the cloud package, a clear error is shown with instructions                    | Mobile          |
| 9.2.8 | Transfer transparency                    | App clearly communicates what is included in the transfer and what is not (specifically, device-specific chats) | Mobile          |

### 9.3 Device-Specific Chats

| #     | Feature                                 | Description                                                                                                                                                                                  | Platform        |
| ----- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 9.3.1 | Device-specific chat option at creation | When starting a new chat, user can choose between a standard chat and a device-specific chat                                                                                                 | Mobile          |
| 9.3.2 | Non-exportable local keys               | Device-specific chat keys are generated and stored locally and are never included in multi-device sync or cloud transfer                                                                     | Mobile          |
| 9.3.3 | Device-specific label                   | Device-specific chats are visually marked with a clear label in the chat list and chat thread                                                                                                | Mobile          |
| 9.3.4 | No sync to linked devices               | A device-specific chat never appears on any other linked device                                                                                                                              | Mobile + Server |
| 9.3.5 | Creator decides at creation             | The chat creator selects standard or device-specific at the moment of chat creation; this cannot be changed afterward                                                                        | Mobile          |
| 9.3.6 | No conversion to standard chat          | Once a chat is created as device-specific, it cannot be converted to a standard multi-device chat; user must create a new chat and manually continue the conversation if they want to switch | Mobile          |
| 9.3.7 | Either/or design                        | A chat is either standard (multi-device) or device-specific; it cannot be both                                                                                                               | Mobile + Server |
| 9.3.8 | Device-specific tradeoff disclosure     | Before creation, app clearly explains: more privacy, less convenience, no recovery from another linked device, and that the choice is permanent                                              | Mobile          |
| 9.3.9 | Device lost handling                    | If the device holding a device-specific chat is lost, those chats are permanently inaccessible; app discloses this at creation time                                                          | Mobile          |

### 9.4 Device Management

| #     | Feature                              | Description                                                                                                         | Platform        |
| ----- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------- |
| 9.4.1 | Linked devices list                  | Settings screen lists all currently linked devices with device identifiers and link dates                           | Mobile          |
| 9.4.2 | Revoke a linked device               | User can remove/revoke a specific linked device from their account                                                  | Mobile + Server |
| 9.4.3 | Rapid session invalidation on revoke | When a device is revoked, its session is invalidated promptly and it can no longer receive messages or authenticate | Server          |
| 9.4.4 | Device count enforcement             | Server enforces the 3-device maximum and returns a clear error with instruction to revoke a device first            | Server          |

---

## 10. Notifications

### 10.1 Push Notification Modes

| #      | Feature                           | Description                                                                                                                                            | Platform        |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| 10.1.1 | Privacy push mode (MVP only mode) | Server sends push notifications to the device OS push service as wake-up signals when new messages arrive                                              | Mobile + Server |
| 10.1.2 | High anonymity mode (polling)     | User can configure the app to not use push notifications and instead poll the server manually or on a schedule — **this mode is deferred to post-MVP** | Mobile + Server |
| 10.1.3 | Notification mode selector        | Settings screen allows users to view and understand available notification modes and their trade-offs                                                  | Mobile          |
| 10.1.4 | Mode tradeoff explanation         | Settings copy explains: faster delivery vs. more metadata protection, and what the push service provider can see in each mode                          | Mobile          |
| 10.1.5 | Mode change persistence           | User's chosen notification mode persists across app restarts                                                                                           | Mobile          |

### 10.2 Notification Content Privacy

| #      | Feature                             | Description                                                                                                          | Platform        |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------- |
| 10.2.1 | No message content in notifications | Push notifications never contain the message text, sender name, or conversation name                                 | Mobile + Server |
| 10.2.2 | Generic notification text           | All notifications display only a generic wake-up message (e.g., "You have a notification in Loki") with no specifics | Mobile          |
| 10.2.3 | No preview on lock screen           | Message content, sender Public-ID, and chat name are never shown on the device lock screen or notification shade     | Mobile          |
| 10.2.4 | Push metadata minimization          | Push payloads sent to the OS notification service are as minimal as possible                                         | Server          |

### 10.3 Per-Chat Notification Settings

| #      | Feature                    | Description                                                                                                      | Platform |
| ------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| 10.3.1 | Mute chat notifications    | User can mute notifications for a specific chat for a set duration or indefinitely                               | Mobile   |
| 10.3.2 | Hidden vault notifications | As defined in section 7.4; vault chat notifications are always generic regardless of app-level notification mode | Mobile   |

---

## 11. Privacy Settings & Safety Education

### 11.1 Privacy Settings Screen

| #      | Feature                              | Description                                                                                                                                  | Platform |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 11.1.1 | Dedicated Privacy & Safety screen    | Accessible from main settings; shows all privacy-relevant settings at a glance                                                               | Mobile   |
| 11.1.2 | Current mode status display          | Shows active states for: notification mode, default disappearing timer, hidden vault status, linked device count, device-specific chat count | Mobile   |
| 11.1.3 | Disappearing messages global default | User can set a global default disappearing timer that applies to all new chats                                                               | Mobile   |
| 11.1.4 | Notification mode setting            | Quick-access link to notification mode selector from Privacy & Safety screen                                                                 | Mobile   |
| 11.1.5 | Hidden vault management link         | Quick-access link to vault settings (PIN change, vault reset) from Privacy & Safety screen                                                   | Mobile   |
| 11.1.6 | Linked devices link                  | Quick-access link to linked devices management from Privacy & Safety screen                                                                  | Mobile   |

### 11.2 Safety Education Content

| #      | Feature                           | Description                                                                                                                  | Platform |
| ------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| 11.2.1 | No discoverability explanation    | Explains that Loki has no public directory, no typeahead, and no account-existence confirmation                              | Mobile   |
| 11.2.2 | Message retention explanation     | Explains the server retention policy, TTL windows, and what happens when a message expires                                   | Mobile   |
| 11.2.3 | Disappearing messages limitation  | Explains that disappearing messages do not prevent screenshots or copies on recipient devices                                | Mobile   |
| 11.2.4 | Hidden vault scope                | Explains that the hidden vault protects local device exposure only, not the recipient's copy of messages                     | Mobile   |
| 11.2.5 | Duress wipe scope                 | Explains that duress wipe destroys local keys only and does not remove data from recipient devices                           | Mobile   |
| 11.2.6 | Multi-device behavior             | Explains what is and is not synced to linked devices, and how device-specific chats work                                     | Mobile   |
| 11.2.7 | Notification privacy tradeoffs    | Explains what metadata the OS push service can see and what each notification mode changes                                   | Mobile   |
| 11.2.8 | "What does Loki protect?" summary | A plain-language summary screen answering the most common trust questions about Loki's protections and limits                | Mobile   |
| 11.2.9 | No overpromising                  | All copy distinguishes between what Loki reduces (risk) and what it cannot guarantee (e.g., deletion from recipient devices) | Mobile   |

---

## 12. App Navigation & Shell

### 12.1 Onboarding Flow

| #      | Feature                               | Description                                                                                             | Platform |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| 12.1.1 | First launch detection                | App detects first launch and shows the onboarding flow rather than the login screen                     | Mobile   |
| 12.1.2 | Create account path                   | Full account creation flow as described in section 1                                                    | Mobile   |
| 12.1.3 | Sign in path                          | Existing account sign-in flow as described in section 1.5                                               | Mobile   |
| 12.1.4 | Identity model explainer screen       | Dedicated screen during onboarding explaining Loki's privacy model before any credentials are collected | Mobile   |
| 12.1.5 | Recovery material confirmation screen | Screen during onboarding where user acknowledges and optionally configures recovery options             | Mobile   |
| 12.1.6 | Public-ID reveal screen               | Post-registration screen showing the user their new Public-ID with copy/share actions and rotation info | Mobile   |

### 12.2 Inbox / Chat List

| #      | Feature                    | Description                                                                               | Platform |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| 12.2.1 | Chat list (inbox)          | Main tab showing all active 1:1 and group conversations                                   | Mobile   |
| 12.2.2 | Empty inbox state          | When no chats exist, a friendly empty state with call-to-action to start a new chat       | Mobile   |
| 12.2.3 | Pending requests indicator | Visual badge or section in the inbox showing count of pending incoming contact requests   | Mobile   |
| 12.2.4 | Pending requests screen    | Full screen listing all pending incoming contact requests with accept/deny actions        | Mobile   |
| 12.2.5 | Hidden vault entry point   | A subtle, always-accessible entry point in the chat list to open the vault PIN screen     | Mobile   |
| 12.2.6 | New Chat button            | Persistent action to open the Public-ID entry / new chat flow                             | Mobile   |
| 12.2.7 | New Group button           | Accessible from the inbox or new chat flow to start group creation                        | Mobile   |
| 12.2.8 | Last message preview       | Each chat row shows the last message preview (generic text for vault chats) and timestamp | Mobile   |
| 12.2.9 | Unread badge               | Unread message count badge on each chat row and on the tab icon                           | Mobile   |

### 12.3 Calls Tab

| #      | Feature               | Description                                                                                              | Platform |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| 12.3.1 | Recent calls list     | Tab showing a chronological list of recent calls with contact, type (audio/video), duration, and outcome | Mobile   |
| 12.3.2 | Missed call indicator | Missed calls are visually distinguished in the call list                                                 | Mobile   |
| 12.3.3 | Call back action      | From the call list, user can initiate a callback to a recent contact                                     | Mobile   |

### 12.4 Profile & Settings

| #      | Feature                           | Description                                                                                                     | Platform |
| ------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| 12.4.1 | Profile tab                       | Tab showing the user's own Public-ID, copy/share actions, and links to settings                                 | Mobile   |
| 12.4.2 | Public-ID management screen       | Dedicated screen showing current Public-ID, rotation action, next-free-change countdown, and paid-change option | Mobile   |
| 12.4.3 | Account settings                  | Username display (read-only), password change, logout                                                           | Mobile   |
| 12.4.4 | Privacy & Safety settings         | As described in section 11                                                                                      | Mobile   |
| 12.4.5 | Linked devices screen             | As described in section 9.4                                                                                     | Mobile   |
| 12.4.6 | Notification mode settings screen | As described in section 10.1                                                                                    | Mobile   |
| 12.4.7 | Hidden vault settings             | PIN change, vault lock, vault reset (with duress PIN configuration)                                             | Mobile   |
| 12.4.8 | Disappearing messages default     | Global default disappearing timer setting                                                                       | Mobile   |

### 12.5 Splash Screen

| #      | Feature                | Description                                                                                               | Platform |
| ------ | ---------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| 12.5.1 | Animated splash screen | Shown on every app launch before navigation to login or inbox                                             | Mobile   |
| 12.5.2 | Auto-redirect          | After splash animation completes, app redirects to login (if unauthenticated) or inbox (if authenticated) | Mobile   |

---

## 13. Backend API

### 13.1 Account & Auth Endpoints

| #      | Feature                           | Description                                                                                            |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 13.1.1 | `POST /api/v1/auth/register`      | Creates a new account with private username, hashed password, and device registration                  |
| 13.1.2 | `POST /api/v1/auth/login`         | Authenticates username + password; returns session token                                               |
| 13.1.3 | `POST /api/v1/auth/logout`        | Invalidates the active session token                                                                   |
| 13.1.4 | Timing-safe credential comparison | All credential checks use timing-safe comparison to prevent timing side-channel attacks                |
| 13.1.5 | Minimal account metadata          | Account record stores only what is operationally necessary; no email, no phone, no social-graph fields |

### 13.2 Public-ID Endpoints

| #      | Feature                                | Description                                                                                               |
| ------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 13.2.1 | `POST /api/v1/public-id/claim`         | Claims a new Public-ID during registration; validates format, uniqueness, reserved names, and confusables |
| 13.2.2 | `POST /api/v1/public-id/rotate`        | Rotates the user's current Public-ID; enforces cooldown and paid-token policy                             |
| 13.2.3 | `GET /api/v1/public-id/status`         | Returns the user's current Public-ID, rotation cooldown status, and next-free-change time                 |
| 13.2.4 | `POST /api/v1/contact-request/send`    | Submits a contact request to a Public-ID; returns uniform response regardless of ID validity              |
| 13.2.5 | `POST /api/v1/contact-request/respond` | Accepts or denies a pending contact request                                                               |
| 13.2.6 | `GET /api/v1/contact-request/pending`  | Lists all pending incoming contact requests for the authenticated account                                 |

### 13.3 Message Delivery Endpoints

| #      | Feature                      | Description                                                                                        |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 13.3.1 | `POST /api/v1/messages/send` | Receives encrypted envelope and queues it in recipient's per-device mailbox with TTL               |
| 13.3.2 | `GET /api/v1/messages/fetch` | Returns pending encrypted envelopes from the calling device's mailbox                              |
| 13.3.3 | `POST /api/v1/messages/ack`  | Acknowledges receipt of one or more envelopes; server deletes them after ack                       |
| 13.3.4 | TTL enforcement              | All envelopes are stored with an expiration timestamp; expired envelopes are not returned on fetch |

### 13.4 Group Endpoints

| #      | Feature                                  | Description                                                                                          |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 13.4.1 | `POST /api/v1/groups/create`             | Creates a new group with initial participants and group name                                         |
| 13.4.2 | `POST /api/v1/groups/:id/members/add`    | Adds a participant to a group (admin only)                                                           |
| 13.4.3 | `POST /api/v1/groups/:id/members/remove` | Removes a participant from a group (admin only)                                                      |
| 13.4.4 | `POST /api/v1/groups/:id/leave`          | Removes the calling user from the group                                                              |
| 13.4.5 | `GET /api/v1/groups/:id/members`         | Returns the current member list for a group                                                          |
| 13.4.6 | Group membership events                  | Backend emits system events for join, leave, and removal that are delivered as special message types |

### 13.5 Call Signaling Endpoints

| #      | Feature                            | Description                                                                     |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------- |
| 13.5.1 | `POST /api/v1/calls/initiate`      | Creates a call session and sends invites to participants                        |
| 13.5.2 | `POST /api/v1/calls/:id/respond`   | Accepts or declines a call invite                                               |
| 13.5.3 | `POST /api/v1/calls/:id/leave`     | Removes the calling user from a call session                                    |
| 13.5.4 | `POST /api/v1/calls/:id/terminate` | Ends a call session (for last participant or admin action)                      |
| 13.5.5 | `GET /api/v1/calls/:id/state`      | Returns current call session state and participant list                         |
| 13.5.6 | Call session lifecycle management  | Server manages session state transitions: created → ringing → connected → ended |

### 13.6 Device Endpoints

| #      | Feature                         | Description                                                                |
| ------ | ------------------------------- | -------------------------------------------------------------------------- |
| 13.6.1 | `POST /api/v1/devices/register` | Registers a new device; enforces 3-device maximum                          |
| 13.6.2 | `DELETE /api/v1/devices/:id`    | Revokes a linked device and invalidates its session                        |
| 13.6.3 | `GET /api/v1/devices`           | Lists all linked devices for the authenticated account                     |
| 13.6.4 | `GET /api/v1/devices/transfer`  | Downloads the encrypted transferable account data package for a new device |
| 13.6.5 | `POST /api/v1/devices/transfer` | Uploads an updated encrypted transferable account data package             |

### 13.7 Retention Jobs

| #      | Feature                      | Description                                                                                                       |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 13.7.1 | Message TTL cleanup job      | Background job that deletes all message envelopes past their TTL                                                  |
| 13.7.2 | Contact request expiry job   | Background job that expires pending contact requests past their TTL                                               |
| 13.7.3 | Deprecated Public-ID cleanup | Background job that permanently releases deprecated Public-IDs after the 180-day lockout period                   |
| 13.7.4 | Minimal operational logging  | Server logs only the minimum necessary for operations; no message content, no sender-receiver relationship graphs |

---

## 14. Shared Package

| #    | Feature                              | Description                                                                                                                |
| ---- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 14.1 | Typed API contracts                  | TypeScript types for all request/response bodies across all API endpoints                                                  |
| 14.2 | Public-ID request/rotation contracts | Shared types for contact request payloads and Public-ID rotation payloads                                                  |
| 14.3 | Message envelope schemas             | Shared types for encrypted message envelope structure and metadata                                                         |
| 14.4 | Group membership contracts           | Shared types for group creation, membership list, and membership event payloads                                            |
| 14.5 | Call session contracts               | Shared types for call session creation, invite, state, and participant payloads                                            |
| 14.6 | Device metadata contracts            | Shared types for device registration, device list, and transfer payloads                                                   |
| 14.7 | Retention policy enums               | Shared enums for TTL presets, disappearing message timer options, and retention window identifiers                         |
| 14.8 | Settings models                      | Shared types for account settings and privacy settings structures                                                          |
| 14.9 | Public-ID validation utilities       | Shared validation logic for Public-ID format, normalization, and reserved-name checking (usable by both mobile and server) |

---

## 15. Post-MVP Feature Backlog

The following features are explicitly deferred. They are not rejected; they are scoped out of MVP to control complexity.

| #     | Feature                                                  | Reason Deferred                                                                                  |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 15.1  | High anonymity / polling notification mode               | Significant infrastructure change; push-only is acceptable for MVP                               |
| 15.2  | Onion-routed transport                                   | Materially increases operational complexity and security attack surface                          |
| 15.3  | Mixnet / cover traffic                                   | Requires dedicated infrastructure beyond MVP scope                                               |
| 15.4  | Decentralized / swarm-based delivery                     | Major architectural departure; deferred until MVP is stable                                      |
| 15.5  | Private contact discovery (secure enclave)               | Requires specialized infrastructure not available in current stack                               |
| 15.6  | One-time invite connection workflow                      | Deferred; Public-ID request model covers MVP contact establishment                               |
| 15.7  | Key-only recovery (no server credentials)                | Increases onboarding complexity significantly                                                    |
| 15.8  | Desktop app                                              | Out of scope for mobile-first MVP                                                                |
| 15.9  | Integrated crypto wallet                                 | Separate product track; must not be bundled into messaging MVP                                   |
| 15.10 | Public profile directory or lookup system                | Directly contradicts Loki's privacy model; permanently deferred unless product direction changes |
| 15.11 | Remote deletion guarantees across recipient devices      | Cannot be technically guaranteed; would be dishonest to promise                                  |
| 15.12 | Attachment support beyond text (if not shipped in MVP)   | Phase 2 candidate if not completed in MVP                                                        |
| 15.13 | Richer session management                                | Phase 2 candidate                                                                                |
| 15.14 | Onion-routed transport option                            | Phase 3 candidate                                                                                |
| 15.15 | Private relay / proxy mode                               | Phase 3 candidate                                                                                |
| 15.16 | Advanced sender-metadata protections                     | Phase 3 candidate                                                                                |
| 15.17 | Advanced abuse/spam resistance for contact-request flows | Phase 3 candidate                                                                                |
| 15.18 | Decentralized delivery experimentation                   | Phase 4 candidate                                                                                |
| 15.19 | Optional mixnet mode                                     | Phase 4 candidate                                                                                |
| 15.20 | Advanced private contact discovery                       | Phase 4 candidate                                                                                |
