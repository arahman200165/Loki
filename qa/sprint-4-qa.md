# Sprint 4 — Contact Establishment: Manual QA Checklist

**Sprint scope:** New Chat screen (exact Public-ID entry), Pending Requests screen, BlockAction component, server-side blocking endpoint (`POST /contact-request/block`), `blocks` DB table, `findAccountIdByPublicId` model helper, shared contact request types.

> **Note on task 4.1–4.3:** The server-side contact request model (`contactRequestModel.js`), send endpoint, and respond/pending endpoints are not yet implemented. Sections that test those endpoints are marked **[PENDING 4.1–4.3]** and should be re-run when those tasks land. All other sections are testable now.

---

## Setup

1. Ensure `apps/server/.env` is present and `DATABASE_URL` points to a Neon Postgres instance.
2. Run migrations to create the `blocks` table:
   ```
   cd apps/server && npm run migrate
   ```
3. Confirm the migration ran:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'blocks';
   ```
   Expected: one row returned.
4. Start the backend:
   ```
   npm run server:dev
   ```
5. Start the mobile dev server in a separate terminal:
   ```
   npm run mobile:start
   ```
6. Open the app on a simulator or device via Expo Go.
7. For API tests use `curl` with base URL `http://localhost:4000/api/v1` and header `x-api-key: dev-mobile-api-key`.

> **Helper:** register two fresh test accounts before sections that need authenticated users:
> ```
> curl -s -X POST http://localhost:4000/api/v1/auth/register \
>   -H "x-api-key: dev-mobile-api-key" \
>   -H "Content-Type: application/json" \
>   -d '{"username":"tester-a","password":"password-twelve"}' | jq .
>
> curl -s -X POST http://localhost:4000/api/v1/auth/register \
>   -H "x-api-key: dev-mobile-api-key" \
>   -H "Content-Type: application/json" \
>   -d '{"username":"tester-b","password":"password-twelve"}' | jq .
> ```
> Claim a Public-ID for each account so they have active IDs to block:
> ```
> curl -s -X POST http://localhost:4000/api/v1/public-id/claim \
>   -H "x-api-key: dev-mobile-api-key" \
>   -H "Authorization: Bearer $TOKEN_A" \
>   -H "Content-Type: application/json" \
>   -d '{"public_id":"tester-alpha88"}' | jq .
>
> curl -s -X POST http://localhost:4000/api/v1/public-id/claim \
>   -H "x-api-key: dev-mobile-api-key" \
>   -H "Authorization: Bearer $TOKEN_B" \
>   -H "Content-Type: application/json" \
>   -d '{"public_id":"tester-bravo99"}' | jq .
> ```
> Save the tokens as `$TOKEN_A` and `$TOKEN_B`.

---

## Section 1 — API: Auth Guards for Contact Endpoints

- [ ] **No API key** — `POST /api/v1/contact-request/block` without `x-api-key` header returns 401 or 403.
- [ ] **Wrong API key** — same request with `x-api-key: wrong` returns 401 or 403.
- [ ] **No bearer token** — `POST /api/v1/contact-request/block` with correct API key but no `Authorization` header returns 401 with a clear message.
- [ ] **Invalid bearer token** — `POST /api/v1/contact-request/block` with `Authorization: Bearer bogustoken` returns 401.
- [ ] **Route exists** — `POST /api/v1/contact-request/block` with valid credentials (no body yet) returns 400 (not 404), confirming the route is mounted.

---

## Section 2 — API: `POST /api/v1/contact-request/block` (Happy Path)

- [ ] Block an account that has an active Public-ID:
  ```
  curl -s -X POST http://localhost:4000/api/v1/contact-request/block \
    -H "x-api-key: dev-mobile-api-key" \
    -H "Authorization: Bearer $TOKEN_A" \
    -H "Content-Type: application/json" \
    -d '{"target_public_id":"tester-bravo99"}' | jq .
  ```
  Expected: `HTTP 200`, body `{"status":"ok"}`.
- [ ] Verify the `blocks` table has a new row:
  ```sql
  SELECT * FROM blocks;
  ```
  Expected: one row with `blocker_account_id` = tester-a's UUID and `blocked_account_id` = tester-b's UUID.
- [ ] **Idempotency** — repeat the same block request. Expected: `200 {"status":"ok"}`, no duplicate row in `blocks` (ON CONFLICT DO NOTHING).
- [ ] **Block with `request_id`** — supply a known pending `contact_requests.id` along with the block:
  ```
  -d '{"target_public_id":"tester-bravo99","request_id":"<uuid>"}'
  ```
  Expected: `200 {"status":"ok"}`; verify the contact request row status changed to `denied` in the DB.

---

## Section 3 — API: `POST /api/v1/contact-request/block` (Anti-Enumeration & Edge Cases)

All cases below must return `HTTP 200 {"status":"ok"}` — the caller learns nothing about whether the target exists.

- [ ] **Unknown Public-ID** — block a Public-ID that belongs to no account (`-d '{"target_public_id":"no-such-user99"}'`) → `200 {"status":"ok"}`, no row in `blocks`.
- [ ] **Deprecated / rotated Public-ID** — rotate tester-b's ID (using a payment token stub), then block the old ID → `200 {"status":"ok"}`, no row in `blocks`.
- [ ] **Reserved name** — block `admin` → `200 {"status":"ok"}`, no row in `blocks`.
- [ ] **Format-invalid ID** — block `BAD` → `200 {"status":"ok"}`.
- [ ] **Blocking yourself** — block your own Public-ID → `200 {"status":"ok"}` (behaviour is undefined/benign; should not crash).
- [ ] **Missing `target_public_id`** — send `{}` as body → `HTTP 400` with a `message` field.
- [ ] **Empty string** — send `{"target_public_id":""}` → `HTTP 400`.

> **Privacy check:** Response body, HTTP status, and response time for an unknown ID must be indistinguishable from a successful block of a real account.

---

## Section 4 — DB: Blocks Table

Using a Postgres client connected to `DATABASE_URL`:

- [ ] `blocks` table exists with columns: `id (uuid)`, `blocker_account_id (uuid)`, `blocked_account_id (uuid)`, `created_at (timestamptz)`.
- [ ] `UNIQUE (blocker_account_id, blocked_account_id)` constraint present — attempting a direct SQL duplicate `INSERT` raises a unique-violation error.
- [ ] Index `idx_blocks_blocker` exists on `blocker_account_id`.
- [ ] Index `idx_blocks_blocked` exists on `blocked_account_id`.
- [ ] `ON DELETE CASCADE` is in effect: delete the blocker account from `accounts` and confirm the block row is removed automatically.

---

## Section 5 — Mobile: New Chat Screen (Task 4.4)

### Navigation
- [ ] Tap the **+** FAB in the Chats tab → opens the "New Chat" modal (full-screen modal, dark background).
- [ ] Tap **Cancel** → modal closes, returns to Chats tab with no changes.

### Public-ID Field
- [ ] The screen shows a **single** Public-ID text field — no search results list, no contact suggestions, no typeahead.
- [ ] Field has `autoCapitalize="none"` — typing letters does not auto-capitalise.
- [ ] **Send Request** button is disabled (opacity reduced) when the field is empty.

### Format Validation (client-side)
- [ ] Enter `hi` (too short), then tap outside the field → inline error "Must be 8–24 characters." appears below input; border turns red; button stays disabled.
- [ ] Enter `ALLCAPS99` → same short error or format error (letters only, no uppercase validation visible — this is expected since validation normalises to lowercase).
- [ ] Enter `bad--id99` (consecutive hyphens) → inline error about format appears on blur.
- [ ] Enter `bad-end-` (trailing hyphen) → inline format error.
- [ ] Enter `1startnum` (starts with digit) → inline format error.
- [ ] Enter `admin-loki12` (reserved name) → inline error "That ID is reserved." appears.
- [ ] Enter a valid ID like `dancing-panda927` → no error, border returns to normal, button enables.
- [ ] Clear the field after a valid entry → button disables again.

### First Message (optional)
- [ ] A "First message (optional)" multiline input is present below the Public-ID field.
- [ ] Type more than 200 characters → input stops accepting input at 200 (maxLength enforced); character counter shows `200/200`.
- [ ] Leave the field empty — this is valid; Send should not be blocked by an empty first message.

### Device-Specific Toggle
- [ ] A "Device-specific chat" toggle with a `Switch` is visible below the first message field.
- [ ] Toggle defaults to **off**.
- [ ] Toggle **on** → a blue info box appears explaining the chat is only accessible on this device and cannot be changed.
- [ ] Toggle back **off** → info box disappears.

### Submit Behaviour (Anti-Enumeration)
- [ ] Enter a valid Public-ID (whether it exists or not), tap **Send Request** — **modal closes silently**. No toast, no "request sent" message, no "user not found" alert.
- [ ] Enter a nonexistent ID → modal still closes silently with no error message.
- [ ] With the backend stopped, enter a valid-format ID, tap Send → modal still closes silently (network error swallowed).
- [ ] Modal closes via `router.back()` — the Chats tab is shown and nothing in the UI confirms or denies whether the ID existed.

---

## Section 6 — Mobile: Pending Requests Screen (Task 4.5)

> **Note:** Tasks 4.1–4.3 (server endpoints) are not yet done. The requests screen falls back to **mock data** when the API is unavailable. All items below test with mock data unless marked **[PENDING 4.1–4.3]**.

### Inbox Entry Point
- [ ] The Chats tab shows a **"2 pending requests"** banner row above the chat list (stubbed count).
- [ ] Banner is styled distinctly (blue-tinted background, chevron icon on the right).
- [ ] Tap the banner → navigates to the **Contact Requests** screen (title visible in header).

### Request Card Layout
- [ ] Each request card shows:
  - [ ] Avatar circle with the first two characters of the sender's Public-ID.
  - [ ] Sender's Public-ID in bold.
  - [ ] First message preview (truncated to 1 line) if present; absent for mock card 2 (no first message).
  - [ ] Relative time label ("Xh ago" or "X days ago").
  - [ ] **Accept** button (blue).
  - [ ] **Deny** button (secondary, bordered).
  - [ ] **Block** red text link.

### Accept / Deny Actions
- [ ] Tap **Accept** on a card → card is immediately removed from the list (optimistic removal); no crash.
- [ ] Tap **Deny** on a card → card immediately removed from the list.
- [ ] After removing both mock cards, the screen shows "No pending requests." empty state.

### Pull-to-Refresh
- [ ] Pull down on the requests list → refresh indicator spins briefly, list reloads (mock data reappears since API not implemented).

### [PENDING 4.1–4.3] — Real API Integration
- [ ] With the `/contact-request/pending` endpoint live, the screen shows real pending requests instead of mock data.
- [ ] Accept action calls `POST /contact-request/respond` with `action: "accept"` and the correct `request_id`.
- [ ] Deny action calls `POST /contact-request/respond` with `action: "deny"`.

---

## Section 7 — Mobile: Blocking Flow (Task 4.6)

### Block from Requests Screen
- [ ] Tap **Block** on a request card → confirmation `Alert` appears with title "Block this contact?" and message "They will not be able to send you messages or requests."
- [ ] Tap **Cancel** in the Alert → Alert dismisses, card remains in the list, no API call fired.
- [ ] Tap **Block** in the Alert → card is removed from the list.
- [ ] With the backend running and valid auth, the block call (`POST /api/v1/contact-request/block`) fires and returns `200`; verify a row appears in `SELECT * FROM blocks;`.

### Anti-Enumeration on Block
- [ ] Block a card whose sender Public-ID does not exist in the DB (mock data) → API still returns `200 {"status":"ok"}`, card still removed, no error shown to user.

### Block + Deny
- [ ] Supply a `request_id` with the block (this is wired automatically when blocking from a request card) — confirm the `contact_requests` row (if present) is updated to `denied` in the DB.

### Block from Future Chat Surface
- [ ] `BlockAction` component is exported and reusable. Confirm it can be imported in a chat thread without compile errors (manual code inspection: `app/components/BlockAction.tsx` has correct props interface).

---

## Section 8 — Privacy Checks

- [ ] **No existence leak on new-chat** — the Send button on the New Chat screen shows no indicator of whether the entered Public-ID belongs to a real account. There is no "User not found" copy anywhere in the file.
- [ ] **Uniform block response** — blocking a nonexistent ID and blocking a real ID both return `200 {"status":"ok"}`. Responses are indistinguishable in status, body, and timing order-of-magnitude.
- [ ] **No content in block payload** — `POST /contact-request/block` body contains only `target_public_id` and optionally `request_id`. It contains no message content, no device identifiers, no account metadata beyond the target Public-ID.
- [ ] **No sender-receiver edges in logs** — start server with `npm run server:dev`, perform a block, review morgan/console output. Confirm no Public-IDs or account UUIDs appear in logged lines.
- [ ] **Block does not confirm existence** — the mobile `BlockAction` component calls the API and then calls `onBlocked()` regardless of the response. If the target does not exist the UX is identical to a successful block. Inspect `BlockAction.tsx` to confirm the `finally` block fires unconditionally.
- [ ] **No requests content in notification shade** — the pending requests banner on the Chats tab shows only a generic count ("2 pending requests"), not sender names or message previews.

---

## Section 9 — Regression Checks (Sprint 3 Flows)

- [ ] `POST /api/v1/auth/register` still returns `{ token, user }`.
- [ ] `POST /api/v1/auth/login` still works.
- [ ] `POST /api/v1/auth/logout` still works.
- [ ] `POST /api/v1/public-id/claim` still returns `202 {"status":"submitted"}`.
- [ ] `GET /api/v1/public-id/status` still returns the active Public-ID.
- [ ] `POST /api/v1/public-id/rotate` (with payment token) still rotates correctly.
- [ ] Onboarding flow (entry → explainer → register → choose-id → id-reveal → recovery) still navigates end-to-end.
- [ ] Profile tab and manage-id screen still load and show Public-ID data.
- [ ] Login screen → `/(tabs)/chat` navigation still works.
- [ ] Chats tab FAB opens the **New Chat** modal (route updated from `/chat/newchat` to `/chat/new-chat`; confirm the old route is gone and no 404-style navigation errors appear).
