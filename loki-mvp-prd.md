# Loki MVP PRD

## Document Status
- Product: Loki
- Document Type: Product Requirements Document (PRD)
- Scope: MVP
- Platforms: Expo React Native mobile app, Node.js + Express backend, shared package(s) in monorepo
- Repository context:
  - `apps/mobile` — Expo React Native mobile app
  - `apps/server` — Node.js + Express backend API
  - `packages/shared` — shared types, constants, and utilities

---

## 1. Product Summary

Loki is a privacy-first mobile messenger built around private onboarding, end-to-end encrypted messaging, minimal server-side data retention, and reduced social-graph exposure.

The MVP is intentionally focused. It should prove that Loki can deliver:
1. private account creation without phone number or email,
2. private messaging using a Public-ID request flow with invite fallback,
3. short-retention encrypted delivery,
4. high-value local privacy controls such as hidden chats,
5. a practical but bounded multi-device model,
6. group chats,
7. 1:1 and group audio/video calling.

The MVP should **not** try to solve every hard privacy problem at once. It should avoid taking on the full complexity of onion routing, mixnets, decentralized swarms, private contact discovery infrastructure, and integrated crypto wallet operations in version 1.

---

## 2. Problem Statement

Most messengers protect message content but still expose too much metadata:
- who is connected to whom,
- whether an account exists,
- timing and behavioral patterns,
- device/platform side-channel exposure,
- long-lived identifiers and contact discovery surfaces.

Loki’s MVP exists to give privacy-sensitive users a messenger that starts from a different baseline:
- no phone-number identity,
- no public directory,
- no typeahead/global lookup,
- no easy server-side social graph,
- limited server retention,
- stronger local privacy on the device.

---

## 3. Product Vision for MVP

### Vision
Create a credible first release of a privacy-first messenger that feels usable on a phone today while preserving a clean path to stronger anonymity later.

### MVP Thesis
The MVP wins if users can:
- create an account anonymously,
- connect through exact-match Public-ID requests with explicit recipient acceptance,
- exchange encrypted 1:1 and group messages reliably enough for real use,
- place 1:1 and group audio/video calls,
- keep chats short-lived by default,
- protect especially sensitive chats behind a second layer,
- link a second device without turning the backend into a permanent archive.

---

## 4. Goals

### Primary goals
- Anonymous onboarding with no email or phone number.
- End-to-end encrypted 1:1 and group messaging.
- Public-ID request based contact establishment with invite fallback.
- 1:1 and group audio/video calls.
- Minimal metadata and limited delivery retention.
- Strong local privacy controls for sensitive conversations.
- Feasible implementation with current stack.

### Secondary goals
- Bounded multi-device support.
- User-visible privacy settings that trade convenience for anonymity.
- Clean architectural foundation for stronger transport/privacy features later.

---

## 5. Non-Goals for MVP

The following are explicitly **out of scope** for the MVP:

- Full decentralized or swarm-based delivery
- Onion-routed transport by default
- Mixnet / cover-traffic privacy
- Private contact discovery using secure enclaves / advanced discovery systems
- Desktop app
- Full integrated crypto wallet
- Public profile directory or lookup system
- Remote deletion guarantees across recipient devices

These are not rejected permanently. They are deferred because they materially increase complexity, operational burden, or security risk for a first release.

---

## 6. Target Users

### Primary users
- Privacy-conscious individuals who do not want to register with phone number or email.
- Users who want deliberate, approval-based communication instead of discoverability.
- Users who value local privacy protections on a shared or at-risk device.

### Secondary users
- Journalists, activists, researchers, and operators with moderate privacy needs.
- Users who want a “private inner circle” messenger rather than a general social app.

---

## 7. Product Principles

1. **No discoverability by default**  
   Loki should not expose public directory lookup, typeahead search, or account-existence confirmation before acceptance.

2. **Minimal data at rest**  
   The server should retain only what is required for short-lived encrypted delivery.

3. **Private account credentials stay separate from shareable identity**  
   Authentication uses private username + password, while Public-ID remains the shareable contact surface.

4. **Privacy settings must be understandable**  
   Stronger privacy should be available through simple, explicit choices.

5. **Protect the user locally too**  
   Local vaulting, second-factor chat protection, and cryptographic wipe matter.

6. **Do not overpromise**  
   Loki can reduce risk; it cannot guarantee deletion from a recipient’s device.

---

## 8. MVP Feature Set

### In MVP
1. Private account creation (username + password, no phone/email)
2. Public-ID request and one-time invite fallback connection flow
3. 1:1 and group end-to-end encrypted chat
4. Short-retention encrypted delivery
5. Disappearing messages
6. Hidden chats vault with second PIN
7. Basic duress action tied to local cryptographic wipe
8. Multi-device linking with ephemeral transfer
9. Device-specific chats
10. 1:1 and group audio/video calling
11. Notification privacy modes
12. Privacy-centric settings and safety education

### Deferred post-MVP
1. Onion-routed transport
2. Mixnet mode / cover traffic
3. Decentralized delivery network
4. Secure private contact discovery
5. Integrated crypto wallet
6. Key-only recovery model without server-side credentials

---

## 9. Detailed Feature Requirements and User Flows

## 9.1 Private Account Creation

### Description
A user can create a Loki account without phone number or email by choosing a private username and password. The private username is never used as a public contact surface.

The user receives:
- a private login credential set (username + password),
- a user-chosen, shareable Public-ID connection surface,
- device registration for the first device.

### Why it is in MVP
This is the foundation of the product. Without private onboarding that avoids phone/email identity, Loki collapses back into a conventional messenger model.

### Functional requirements
- User can create a new account from the mobile app without entering phone number or email.
- User must create a private username and strong password during onboarding.
- Backend stores only minimum account/auth metadata and account/device routing metadata.
- User can type and claim their preferred Public-ID during onboarding, subject to safety constraints.
- Public-ID must be unique, normalized (lowercase, restricted charset), and validated against reserved/blocked terms.
- App displays the user’s chosen Public-ID and rotation controls.
- App can generate a one-time invite / connect token tied to this identity.
- App must keep private username separate from Public-ID and never expose it to other users.

### UX requirements
- The onboarding copy must explain:
  - Loki has no public directory or global lookup.
  - Private username is for login only and cannot be searched by others.
  - People can only request contact through exact Public-ID entry or an invite.
  - Request senders are not told whether a Public-ID exists until recipient acceptance.
  - Losing password without configured recovery options may mean account lockout.

### Success criteria
- Account can be created in under 2 minutes.
- No phone/email dependency exists anywhere in onboarding.

### User flow
1. User opens Loki and taps **Create Private Account**.
2. App explains the identity model: no phone, no email, no search.
3. User enters private username and password.
4. User types desired Public-ID; app validates format and availability with anti-abuse protections.
5. App registers account and first device with the backend delivery service.
6. App shows:
   - Public-ID,
   - copy/share actions,
   - rotate Public-ID action,
   - generate one-time invite action.
7. App shows optional recovery setup.
8. User confirms account setup.
9. User lands in empty inbox.

### Edge cases
- App terminated during credential setup.
- Registration succeeds but secure local session save fails.
- Chosen private username is already in use.
- Chosen Public-ID is already in use.
- Chosen Public-ID contains blocked/reserved/confusable terms.

---

## 9.2 Public-ID Request Contact Establishment (with Invite Fallback)

### Description
Loki does not provide a public directory, typeahead search, or global lookup. First contact should happen through an out-of-band exchange where a recipient shares their exact Public-ID (for example, `dancing-panda927`). One-time invites remain available as a fallback path.

### Why it is in MVP
This is one of the clearest product differentiators and directly reduces social-graph discoverability.

### Public-ID policy (MVP)
- Allowed characters: `a-z`, `0-9`, and single hyphen (`-`) between characters.
- Normalization: lowercase only; trim leading/trailing spaces before validation.
- Length: minimum 8 characters, maximum 24 characters.
- Must start with a letter (`a-z`) and must not end with a hyphen.
- Disallow consecutive hyphens (`--`).
- Confusable safety: reject IDs that are visually confusable with existing active IDs after normalization/confusable mapping.
- Reserved-name categories:
  - system and staff terms (`admin`, `support`, `security`, `moderator`, `system`, `loki`, `official`)
  - infrastructure and protocol terms (`api`, `web`, `mail`, `root`, `null`, `undefined`)
  - emergency and trust terms (`help`, `safety`, `verify`, `verified`, `trust`)
  - protected brands and high-risk impersonation targets (maintained server-side blocklist)
- Public-ID change policy:
  - one free Public-ID change every 7 days
  - additional changes requested before 7 days require an in-app paid change token
  - when the 7-day window expires, the next change is free again
- On successful change, previous Public-ID moves to deprecated state and cannot be reclaimed for 180 days.

### Functional requirements
- User can share:
  - exact Public-ID, or
  - one-time invite link / token.
- Public-ID is user-chosen and can be updated later through rotate/deprecate controls with platform policy constraints.
- Sender can submit an exact Public-ID in **New Chat** and send a first message/request.
- Sender must not receive confirmation that a Public-ID is valid or tied to a real account before acceptance.
- Recipient receives pending request with sender Public-ID and can accept or deny.
- Recipient must explicitly accept before chat becomes active.
- Invite tokens can expire and become unusable after first successful acceptance.
- User can rotate/deprecate current Public-ID, making prior Public-ID values unusable for new inbound requests.
- Public-ID change UI must clearly show:
  - next free-change time (countdown to 7-day reset),
  - paid change option when inside cooldown,
  - confirmation that old ID becomes deprecated.
- App must preserve anti-enumeration behavior for invalid/unknown/deprecated Public-ID entries.
- App must not provide typeahead search, global lookup, or “people you may know.”

### UX requirements
- The product should make the non-discoverable, acceptance-gated model feel intentional, not broken.
- Copy should clearly explain that Loki is private by design, so contact discovery is limited on purpose.
- Sender-facing UX should avoid account-existence leaks before acceptance.

### Success criteria
- A user can establish first contact in under 60 seconds if they have the other person’s Public-ID or invite.

### User flow A: connect by Public-ID
1. Alice obtains Bob’s Public-ID outside Loki.
2. Alice taps **New Chat**.
3. Alice enters Bob’s exact Public-ID (example: `dancing-panda927`) and sends first message/request.
4. Loki creates a pending contact request without confirming account existence to Alice.
5. Bob (the owner of `dancing-panda927`) receives request with Alice’s Public-ID.
6. Bob accepts or denies.
7. If accepted, a chat thread is created and Alice is now confirmed connected.
8. Bob may rotate Public-ID after acceptance to stop future contact attempts through the old value.

### User flow B: connect by one-time invite
1. Bob taps **Create Invite**.
2. Loki creates a one-time connect token.
3. Bob sends the invite through another channel.
4. Alice opens the invite.
5. Loki validates it and creates a pending request.
6. Bob accepts, or the invite auto-binds based on flow design.
7. Chat becomes active.
8. Invite is marked used or expired.

### Edge cases
- Invalid ID format.
- Unknown Public-ID.
- Deprecated/rotated Public-ID.
- Public-ID blocked by reserved-name policy.
- Public-ID rejected as confusable with an existing active ID.
- User attempts second change within 7 days without paid token.
- Paid change purchase fails or is cancelled.
- Expired invite.
- Invite already used.
- Recipient declines request.
- Sender blocked by recipient.

---

## 9.3 1:1 and Group End-to-End Encrypted Messaging

### Description
Users can exchange end-to-end encrypted 1:1 and group messages. Encryption is between device/account endpoints, while the server only stores encrypted envelopes temporarily for delivery.

### Why it is in MVP
This is the core product value.

### Functional requirements
- Send and receive text messages in 1:1 and group chats.
- Message content is encrypted on sender side and decrypted only on recipient device(s).
- Messages are persisted locally in encrypted storage.
- Delivery service stores encrypted message envelopes only as long as needed for delivery retention rules.
- Read state and delivery state should be minimal and privacy-conscious.
- Basic attachments are optional for MVP; text-only is acceptable for first cut.

### Recommended MVP scope
- **Required:** text messages in 1:1 and group chats
- **Optional if schedule allows:** image/file attachment support
- **Not required:** voice notes, reactions, stickers

### UX requirements
- Chat experience must feel normal enough to be usable daily.
- Send, delivered, and failed states should be understandable.
- Privacy posture must not make everyday messaging feel confusing.

### Success criteria
- Text message delivery success rate meets acceptable reliability target.
- Median send-to-deliver latency is acceptable on direct network mode.

### User flow
1. User opens a 1:1 or group thread.
2. User types a message.
3. App encrypts message locally.
4. App sends encrypted envelope to backend delivery queue.
5. Backend stores encrypted envelope temporarily until recipient device fetches it.
6. Recipient device retrieves envelope.
7. Recipient app decrypts locally.
8. Message appears in chat.

### Edge cases
- Recipient offline.
- Message expires before recipient fetches.
- Device key mismatch.
- Decryption failure due to stale session state.
- Sender deletes local thread after sending.

---

## 9.4 Short-Retention Encrypted Delivery

### Description
The backend acts as a short-lived encrypted relay, not a long-term message archive. Messages remain on server only until fetched, expired, or acknowledged, within configurable retention limits.

### Why it is in MVP
This is central to Loki’s privacy promise and technically feasible with the current Node.js backend.

### Functional requirements
- Server stores encrypted envelopes only for temporary store-and-forward.
- Messages are deleted after:
  - successful fetch/acknowledgment, or
  - TTL expiry.
- System supports configurable TTL policies.
- Default retention should favor privacy over long offline convenience.

### Recommended MVP default
- Default delivery retention window: short duration such as 24–72 hours.
- Longer offline retention: optional account setting, clearly explained.

### UX requirements
- User should understand that Loki is not an infinite cloud archive.
- App should warn when a message may expire before a recipient fetches it.

### Success criteria
- No permanent server-side message archive exists in MVP architecture.
- Retention behavior is visible and testable.

### User flow
1. Sender sends message.
2. Backend stores encrypted envelope with expiration timestamp.
3. Recipient comes online before expiry and fetches message.
4. Backend removes message after ack.
5. If recipient does not fetch before expiry, sender sees an expiration/failure state.

### Edge cases
- Recipient reconnects just after expiry.
- Duplicate delivery request.
- Ack lost due to network issue.
- Clock drift affecting TTL handling.

---

## 9.5 Disappearing Messages

### Description
Users can set message disappearance timers at the conversation level. This controls local retention on participating devices and server delivery windows where applicable, but does not guarantee deletion from a recipient who has copied or captured content.

### Why it is in MVP
It is expected in privacy-first messaging and aligns with short-retention philosophy.

### Functional requirements
- Per-chat disappearing timer options.
- Timer applies after message read or after send, depending on product choice.
- Local message removal is automatic after timer completion.
- Server should not retain expired disappearing-message content beyond relay necessity.
- Users must be informed that disappearance is not a guarantee against screenshots, export, or copied content.

### Recommended MVP timers
- Off
- 30 seconds
- 5 minutes
- 1 hour
- 1 day
- 1 week

### User flow
1. User opens chat settings.
2. User sets disappearing messages timer.
3. System applies timer to newly sent messages.
4. Recipient sees timer state in chat UI.
5. Message is removed locally after rule is met.

### Edge cases
- Recipient device offline when timer would normally start.
- Timer changed mid-conversation.
- Multi-device state sync conflict.

---

## 9.6 Hidden Chats Vault

### Description
Sensitive chats can be moved into a separate hidden vault protected by a second PIN. This is not just a UI hide toggle; it is a separately encrypted local vault.

### Why it is in MVP
This is one of Loki’s most compelling local privacy features and a visible differentiator.

### Functional requirements
- User can mark a chat as hidden.
- Hidden chats move out of default chat list.
- Hidden chats are protected by a second PIN.
- Hidden chat data is encrypted under separate local vault keys.
- Hidden vault can be locked independently of the main app.
- Hidden chats should not appear in normal notifications or previews.

### UX requirements
- Setup for hidden vault must be simple.
- App must explain clearly that hidden chats protect local exposure, not the recipient’s copy of data.

### Success criteria
- Hidden chats are not visible from standard inbox view.
- Hidden vault remains inaccessible without second PIN.

### User flow
1. User opens a chat menu.
2. User taps **Move to Hidden Vault**.
3. If first time, app prompts for hidden-vault PIN setup.
4. App derives/seals vault key and re-encrypts local chat data into hidden vault storage.
5. Chat disappears from main inbox.
6. User later taps **Hidden Vault** entry point.
7. User enters second PIN.
8. Hidden chats are revealed.

### Edge cases
- User forgets hidden-vault PIN.
- Re-encryption interrupted.
- Notifications arrive for hidden thread while vault locked.

---

## 9.7 Basic Duress Action

### Description
Loki includes a narrow, honest duress mechanism focused on local cryptographic wipe rather than unrealistic promises of universal erasure.

### Why it is in MVP
For a privacy-first app, a limited but well-designed duress feature has more value than a large number of cosmetic features.

### MVP scope decision
The MVP should implement **one** duress-capable behavior, not a large matrix of emergency modes.

### Recommended MVP behavior
**Duress unlock / panic action for hidden vault**
- entering a designated duress PIN, or
- triggering a panic action from lock screen
causes hidden-vault keys to be destroyed locally.

This provides a credible first step without claiming to erase recipient-side data.

### Functional requirements
- User can configure a duress PIN or panic action.
- Duress action destroys hidden-vault local encryption keys.
- App confirms locally that hidden vault has been reset.
- Main account may remain intact, or product may log the user out depending on security design.
- Duress action is irreversible.

### UX requirements
- Copy must state:
  - this wipes local protected data only,
  - it does not remove messages from recipient devices,
  - it is irreversible.

### Success criteria
- Hidden vault data becomes inaccessible after duress action.
- Action is fast and reliable.

### User flow
1. User configures hidden-vault PIN.
2. User optionally configures duress PIN.
3. Under coercion, user enters duress PIN instead of normal vault PIN.
4. App destroys hidden-vault keys.
5. Vault appears empty or reset.
6. No claim is made that recipient-side data is removed.

### Edge cases
- Accidental duress trigger.
- App crash during wipe.
- Device backup restores stale encrypted blobs without keys.

---

## 9.8 Multi-Device Linking

### Description
A user can link a second mobile device using an ephemeral transfer flow rather than a permanent cloud history model.

### Why it is in MVP
Multi-device is a stated goal and important for serious users, but it must be bounded to fit the privacy model.

### Functional requirements
- Primary device can initiate **Link New Device**.
- Secondary device scans QR or enters one-time pairing code.
- Primary device encrypts a short-lived bootstrap package for the new device.
- Backend may hold the encrypted transfer blob briefly.
- Transfer key is one-time and short-lived.
- Each device has its own device identity and mailbox.
- Message sync is forward-looking after link.
- Limited recent-history sync may be allowed, but full perpetual cloud history is out of scope.

### UX requirements
- Linking should feel simple and explicit.
- Product must not imply that Loki stores complete cloud history forever.

### Success criteria
- Second device can join account successfully and receive new messages.
- Device list is visible and manageable.

### User flow
1. User on Device A opens **Linked Devices**.
2. User taps **Add Device**.
3. Device A shows QR code / pairing token.
4. User opens Loki on Device B and chooses **Link Existing Account**.
5. Device B scans token.
6. Device A encrypts bootstrap archive/session package.
7. Package is transferred via short-lived channel.
8. Device B decrypts and registers its own mailbox.
9. Device B begins receiving messages.

### Edge cases
- QR expires.
- Transfer interrupted midway.
- Device B added but cannot decrypt archive.
- User wants to revoke a linked device.

---

## 9.9 Device-Specific Chats

### Description
A user can create chats whose root keys remain only on the originating device and are not replicated to linked devices.

### Why it is in MVP
This is a strong privacy differentiator and pairs naturally with the research direction.

### Functional requirements
- When starting a new chat, user may choose:
  - standard chat, or
  - device-specific chat.
- Device-specific chat keys are never exported in multi-device sync.
- Device-specific chats are visually labeled.
- If user opens account on another linked device, that chat does not appear there.

### UX requirements
- Product must explain the tradeoff clearly:
  - more privacy,
  - less convenience,
  - no recovery from another linked device.

### Success criteria
- Device-specific thread does not sync to linked devices.
- User understands the limitation before enabling it.

### User flow
1. User taps **New Chat**.
2. User selects contact.
3. User chooses **Device-Specific Chat**.
4. App creates non-exportable conversation keys locally.
5. Chat proceeds normally on that device.
6. Linked device never receives the thread.

### Edge cases
- User later wants to convert chat to normal multi-device chat.
- Device lost.
- Recipient is multi-device while sender chat is device-specific.

---

## 9.10 Notification Privacy Modes

### Description
Loki offers privacy modes for notifications so users can trade convenience for stronger anonymity.

### Why it is in MVP
The research identifies push infrastructure as a metadata risk. MVP should surface that tradeoff instead of hiding it.

### Functional requirements
- User can choose notification mode:
  1. Standard push
  2. Privacy push (wake-up only, no content preview)
  3. High anonymity mode (reduced or no push; polling/manual refresh)
- Hidden vault chats should suppress content previews regardless of notification mode.
- App explains delivery-delay tradeoff in high anonymity mode.

### UX requirements
- Settings language must be plain:
  - faster delivery,
  - less metadata protection,
  - slower delivery,
  - more privacy.

### Success criteria
- Users can understand and switch notification modes without confusion.

### User flow
1. User opens **Privacy Settings**.
2. User selects notification mode.
3. App explains expected behavior.
4. Messaging behavior changes accordingly.
5. User can revise choice later.

### Edge cases
- OS restrictions on background fetch.
- User expects instant delivery while in high anonymity mode.
- Device battery optimization blocks polling.

---

## 9.11 Privacy Settings and Safety Education

### Description
Loki should expose its privacy model clearly. A privacy-first product fails if users misunderstand what it protects and what it does not.

### Why it is in MVP
Trust depends on honest communication.

### Functional requirements
- Dedicated Privacy & Safety screen.
- Explain:
  - no discoverability model,
  - message retention policy,
  - disappearing-message limitations,
  - hidden-vault limits,
  - duress limits,
  - linked-device behavior,
  - device-specific chat behavior,
  - notification privacy tradeoffs.
- Show current privacy mode states at a glance.

### Success criteria
- Users can answer basic “what does Loki protect?” questions from the app itself.

### User flow
1. User opens settings.
2. User opens **Privacy & Safety**.
3. User reviews current settings and explanatory copy.
4. User updates preferences.

---

## 9.12 Group Chats

### Description
Users can create and participate in small group chats with end-to-end encrypted messaging and explicit membership controls.

### Why it is in MVP
Group messaging is a core daily-use expectation and is now part of MVP scope.

### Functional requirements
- User can create a group chat and set a group name.
- Creator becomes initial group admin.
- Admin can add/remove participants.
- Participants can leave group at any time.
- Group membership changes generate visible system events.
- Group keys rotate on membership changes.
- Group metadata exposure should remain minimal and consistent with Loki privacy model.

### UX requirements
- Group creation should take under 30 seconds.
- Membership and admin actions should be clear and reversible where safe.
- Copy should explain that group privacy depends on all participants.

### Success criteria
- Group chat can be created and used for reliable encrypted messaging.
- Membership changes propagate correctly across active devices.

### User flow
1. User taps **New Group**.
2. User selects initial participants.
3. User enters group name and creates group.
4. App establishes group session and keys.
5. Participants receive join event and can send messages.
6. Admin later removes a member; system rotates keys and records event.

### Edge cases
- Invitee declines group add.
- Admin leaves group.
- Group key rotation interrupted.
- Removed member attempts to send message with stale session.

---

## 9.13 1:1 and Group Audio/Video Calling

### Description
Users can place encrypted 1:1 and group audio/video calls with bounded MVP signaling and session controls.

### Why it is in MVP
Calling is a required communication surface for MVP and complements encrypted messaging.

### Functional requirements
- Start 1:1 audio or video call from a chat.
- Start group audio or video call from a group chat.
- Recipients can accept/decline incoming calls.
- User can mute audio, disable video, and leave call.
- Call signaling and session lifecycle are handled by backend call endpoints.
- Calling should honor hidden-vault and notification privacy expectations where applicable.

### UX requirements
- Call start, ringing, connected, and ended states must be clear.
- Group call participant state should be easy to understand.
- Failed-call UX should be explicit and actionable.

### Success criteria
- 1:1 and group calls can be established and maintained at acceptable reliability.
- Call state remains consistent after participant join/leave events.

### User flow
1. User opens 1:1 or group thread.
2. User taps **Audio Call** or **Video Call**.
3. App creates call session and sends invites to participants.
4. Participants accept or decline.
5. Media session starts for accepted participants.
6. Participants can mute/unmute, toggle video, and leave.
7. App records ended state and returns users to thread.

### Edge cases
- Participant joins late.
- Network degradation causes call drop.
- User receives call while app is backgrounded.
- Group participant exceeds practical device/network limits.

---

## 10. MVP Screen / Surface List

### Mobile app screens
- Splash / first launch
- Create account
- Recovery material confirmation
- Empty inbox
- New chat / connect
- Enter Public-ID
- Create invite
- Public-ID management / rotate
- Pending requests
- Chat thread
- Group chat creation
- Group participants management
- Chat details
- Incoming call
- In-call (audio/video)
- Disappearing messages settings
- Hidden vault setup
- Hidden vault unlock
- Linked devices
- Privacy settings
- Privacy & safety education
- Notification mode settings

### Backend surfaces
- Account registration
- Device registration
- Invite issuance / validation
- Public-ID request submit / accept / deny
- Public-ID rotate
- Message send / fetch / ack
- Group create / membership management
- Call signaling / session lifecycle
- Retention cleanup jobs
- Device link bootstrap transfer
- Device revoke
- Polling / notification signaling

---

## 11. Functional Requirements by System

## 11.1 Mobile App (`apps/mobile`)
- local key generation
- encrypted local storage
- account bootstrap
- Public-ID request flow and rotation handling
- invite creation and fallback handling
- 1:1 and group chat UI
- call UI and session state handling
- hidden vault UX
- duress interaction
- linked-device QR flow
- settings and privacy education
- notification mode handling

## 11.2 Backend API (`apps/server`)
- minimal account/device registry
- Public-ID lifecycle and anti-enumeration response behavior
- per-device mailbox / delivery queue
- encrypted envelope relay
- TTL / retention enforcement
- invite fallback lifecycle
- group management endpoints
- call signaling/session endpoints
- device linking bootstrap service
- linked-device management endpoints
- minimal operational logging

## 11.3 Shared package (`packages/shared`)
- typed API contracts
- Public-ID request/rotation contracts
- message envelope schemas
- invite/token schemas
- group membership contracts
- call session contracts
- device metadata contracts
- retention policy enums
- settings models

---

## 12. Data Model (Conceptual)

### Core entities
- Account
- Device
- PublicContactId
- OneTimeInvite
- ContactRequest
- Conversation
- ConversationParticipant
- GroupRole
- EncryptedMessageEnvelope
- DeliveryAck
- CallSession
- LinkedDeviceSession
- PrivacySettings
- HiddenVaultMetadata

### Important principle
Server-side data model should avoid becoming a rich social graph. Store only what is operationally necessary.

### State requirements
- `PublicContactId` supports active and rotated/deprecated states.
- `ContactRequest` supports pending, accepted, denied, and expired states.

---

## 13. Security and Privacy Requirements

### Required
- End-to-end encryption for message content
- Local encrypted storage on device
- Secure handling of hidden-vault keys
- Minimal server-side retention
- Minimal structured logs
- No public directory
- No typeahead/global lookup
- Exact-match Public-ID entry with acceptance-gated reveal
- Per-device delivery design
- Honest disclosure of privacy limitations

### Nice to have in MVP if feasible
- Basic sender metadata minimization at relay layer
- Device revoke with rapid session invalidation
- Exportable recovery package for advanced users

---

## 14. Success Metrics

### Product metrics
- account creation completion rate
- successful connection-request completion rate
- inbound request acceptance rate
- Public-ID rotation usage rate
- successful message delivery rate
- group chat activation/adoption rate
- call setup success rate
- call drop/failure rate
- linked-device completion rate
- hidden-vault setup adoption
- notification mode distribution

### Privacy/product trust metrics
- percentage of users who complete optional recovery setup
- percentage of users enabling disappearing messages
- percentage of users enabling hidden vault
- support volume caused by misunderstood privacy expectations

---

## 15. Release Criteria

Loki MVP is ready when:

1. A new user can create an anonymous account without phone or email.
2. Two users can establish contact via exact Public-ID request or one-time invite fallback.
3. Sender receives no account-existence confirmation before recipient acceptance.
4. Public-ID requests support accept/deny outcomes and anti-enumeration behavior.
5. Public-ID rotation invalidates old Public-ID values for new inbound requests.
6. Two users can exchange end-to-end encrypted 1:1 text messages.
7. Users can create and use encrypted group chats with membership changes.
8. 1:1 and group audio/video calls meet baseline setup and continuity reliability.
9. Backend retention is short-lived and verifiably not a permanent archive.
10. Disappearing messages work for normal chat flows.
11. Hidden vault works with separate PIN and separate local encryption boundary.
12. Duress action destroys hidden-vault keys reliably.
13. A second device can be linked via ephemeral transfer.
14. Device-specific chats do not sync to linked devices.
15. Notification privacy modes are available and understandable.
16. Privacy limitations are explained clearly in-product.

---

## 16. Post-MVP Roadmap Candidates

### Phase 2
- attachment support if not in MVP
- richer session management
- desktop client

### Phase 3
- onion-routed transport option
- private relay/proxy mode
- stronger sender-metadata protections
- advanced abuse/spam resistance for invite flows

### Phase 4
- decentralized delivery experimentation
- optional mixnet mode
- advanced private contact discovery

### Separate product track
- crypto wallet as standalone security track, not bundled casually into messaging MVP

---

## 17. Product Decisions Summary

### We will do in MVP
- anonymous key-based onboarding
- Public-ID request model with invite fallback
- 1:1 and group encrypted messaging
- short-retention delivery
- disappearing messages
- hidden vault
- basic duress wipe for local vault
- multi-device linking
- device-specific chats
- 1:1 and group audio/video calls
- notification privacy modes

### We will not do in MVP
- decentralized network
- onion routing
- mixnets
- private contact discovery
- integrated wallet

---

## 18. Final Recommendation

The strongest Loki MVP is **not** “Signal plus everything.”

It is a focused private messenger with:
- anonymous account creation,
- non-discoverable contact model with acceptance-gated Public-ID requests,
- encrypted 1:1 and group chat,
- 1:1 and group audio/video calling,
- short-lived delivery,
- strong local privacy controls,
- bounded multi-device support.

That is differentiated, achievable, and credible with the current monorepo and stack.

Trying to also ship decentralized routing, advanced anonymity transports, private contact discovery, and wallet features in version 1 would increase risk faster than it would increase real user value.
