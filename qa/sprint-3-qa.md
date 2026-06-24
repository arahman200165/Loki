# Sprint 3 — Public-ID System: Manual QA Checklist

**Sprint scope:** Public-ID DB model, claim/rotate/status endpoints, onboarding choose-id screen, id-reveal screen, manage-id screen, profile tab integration.

---

## Setup

1. Copy `apps/server/.env.example` to `apps/server/.env` and fill in `DATABASE_URL` (Neon Postgres).
2. Run migrations if not already done:
   ```
   cd apps/server && npm run migrate
   ```
3. Start the backend:
   ```
   npm run server:dev
   ```
4. Start the mobile dev server in a separate terminal:
   ```
   npm run mobile:start
   ```
5. Open the app on a simulator or device via Expo Go.
6. For API tests use `curl` with the base URL `http://localhost:4000/api/v1` and header `x-api-key: dev-mobile-api-key`.

> **Helper:** register a fresh test account before each section that needs an authenticated user:
> ```
> curl -s -X POST http://localhost:4000/api/v1/auth/register \
>   -H "x-api-key: dev-mobile-api-key" \
>   -H "Content-Type: application/json" \
>   -d '{"username":"testqa1","password":"password-twelve"}' | jq .
> ```
> Save the `token` value as `$TOKEN` for subsequent curl calls.

---

## Section 1 — API: Auth Guards

- [ ] **No API key** — `POST /api/v1/public-id/claim` without `x-api-key` header returns 401 or 403.
- [ ] **Wrong API key** — `POST /api/v1/public-id/claim` with `x-api-key: wrong` returns 401 or 403.
- [ ] **No bearer token** — `POST /api/v1/public-id/claim` with correct API key but no `Authorization` header returns 401 with a clear message.
- [ ] **Invalid bearer token** — `GET /api/v1/public-id/status` with `Authorization: Bearer bogustoken` returns 401.
- [ ] **Valid token required for rotate** — `POST /api/v1/public-id/rotate` without auth returns 401.

---

## Section 2 — API: `POST /api/v1/public-id/claim` (Happy Path)

- [ ] Claim a valid, available ID:
  ```
  curl -s -X POST http://localhost:4000/api/v1/public-id/claim \
    -H "x-api-key: dev-mobile-api-key" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"public_id":"testqa-user1"}' | jq .
  ```
  Expected: `HTTP 202`, body `{"status":"submitted"}`.
- [ ] Immediately call `GET /api/v1/public-id/status` with the same token — the `id` field equals `testqa-user1`.
- [ ] `eligible_for_free_rotation_at` is approximately 7 days in the future (ISO-8601 string).

---

## Section 3 — API: `POST /api/v1/public-id/claim` (Anti-Enumeration)

All cases below must return exactly `HTTP 202 {"status":"submitted"}` — no error shape, no different status code.

- [ ] **Already-taken ID** — register a second account, attempt to claim `testqa-user1` → still `202 submitted`.
- [ ] **Reserved name** — claim `admin` → `202 submitted`.
- [ ] **Too short** — claim `ab` → `202 submitted`.
- [ ] **Too long** — claim `aaaaaaaaaaaaaaaaaaaaaaaaaaa` (27 chars) → `202 submitted`.
- [ ] **Invalid format — leading digit** — claim `1badstart` → `202 submitted`.
- [ ] **Invalid format — trailing hyphen** — claim `bad-end-` → `202 submitted`.
- [ ] **Invalid format — consecutive hyphens** — claim `bad--id` → `202 submitted`.
- [ ] **Confusable Unicode** — claim `testоuser` (with Cyrillic `о`) → `202 submitted`.
- [ ] **Account already has an ID** — call claim again on the same account with a different ID → `202 submitted`, status endpoint still shows the original ID unchanged.
- [ ] **Empty body** — `POST /claim` with `{}` → `202 submitted`.

> **Privacy check:** Responses for taken vs. format-invalid vs. reserved IDs must be indistinguishable (same HTTP status, same body, same response time order of magnitude).

---

## Section 4 — API: `GET /api/v1/public-id/status`

- [ ] Account with no claimed ID → `404` with `{"message":"No Public-ID claimed yet."}`.
- [ ] Account with a claimed ID → `200` with `{"id":"...","eligible_for_free_rotation_at":"<ISO-8601>"}`.
- [ ] `eligible_for_free_rotation_at` is a valid ISO-8601 date string (parseable by `new Date()`).

---

## Section 5 — API: `POST /api/v1/public-id/rotate` (Cooldown Enforcement)

- [ ] Attempt rotate immediately after claim (within 7-day window, no payment token):
  ```
  curl -s -X POST http://localhost:4000/api/v1/public-id/rotate \
    -H "x-api-key: dev-mobile-api-key" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"new_public_id":"testqa-rotated1"}' | jq .
  ```
  Expected: `202 {"status":"submitted"}` — status endpoint should still show original ID (rotation silently rejected).
- [ ] Same request with a non-empty `payment_token`:
  ```
  -d '{"new_public_id":"testqa-rotated1","payment_token":"stub-paid-token"}'
  ```
  Expected: `202 submitted` — status endpoint now shows `testqa-rotated1`.
- [ ] **Old ID in history** — directly query the DB: `SELECT * FROM public_ids_history;` — `testqa-user1` should appear with `release_at` ~180 days from now.
- [ ] **Old ID is locked** — attempt to claim `testqa-user1` on a fresh account → `202 submitted`, but status on that new account remains empty (ID is locked in history).
- [ ] Rotate to an **already-taken** ID (one claimed by another account) → `202 submitted`, status shows old ID unchanged.
- [ ] Rotate to an **invalid-format** ID → `202 submitted`, status unchanged.
- [ ] Rotate on account with **no active ID** → `202 submitted`, no crash.

> **Anti-enumeration check:** All rotate outcomes return identical `202 {"status":"submitted"}` — taken, locked, invalid, and cooldown-blocked are indistinguishable externally.

---

## Section 6 — Retention: DB State

Using a Postgres client connected to `DATABASE_URL`:

- [ ] After claim: `SELECT * FROM public_ids_active WHERE account_id='<uuid>';` returns exactly one row.
- [ ] After rotation: `public_ids_active` shows new ID; `public_ids_history` shows old ID with `release_at = deprecated_at + 180 days`.
- [ ] `UNIQUE` constraint on `public_ids_active.account_id` — attempting a direct SQL `INSERT` of a second row for the same `account_id` raises a constraint error.
- [ ] `public_ids_active.eligible_for_free_rotation_at` defaults to `created_at + 7 days`.

---

## Section 7 — Mobile: Onboarding Flow (Happy Path)

1. Clear app storage / fresh install state (or clear AsyncStorage via dev menu).
2. Launch app → lands on splash, redirects to `/onboarding`.
3. Tap through entry → explainer → register with new credentials → tap "Create account".
4. **Expected:** navigates to **Choose your ID** screen (not recovery).
5. On choose-id screen:
   - [ ] Enter a short ID (e.g. `hi`) → inline error "Too short" appears immediately, button stays disabled.
   - [ ] Enter a valid ID (e.g. `mytest-id`) → green "Looks good" message appears, button enables.
   - [ ] Enter a reserved name (`admin`) → inline error "reserved" appears.
   - [ ] Enter an ID with Cyrillic characters → inline error "confusable" appears.
   - [ ] Enter a valid ID → tap "Claim ID" → navigates to **Your Public ID** screen.
6. On id-reveal screen:
   - [ ] Shows a loading spinner briefly, then the claimed ID in large text.
   - [ ] "Share / Copy" button opens the OS share sheet with `"Add me on Loki: <id>"`.
   - [ ] Rotation hint shows days until free rotation (should be ~7 days).
   - [ ] Both info boxes visible: "No search, no directory" and "Changing your ID".
   - [ ] Tap "Continue" → navigates to Recovery setup screen.

---

## Section 8 — Mobile: Onboarding Skip Flow

1. Register a new account → reach Choose your ID screen.
2. Tap "Skip for now" (bottom link).
3. **Expected:** navigates to id-reveal screen.
4. On id-reveal:
   - [ ] No loading spinner (or brief spinner then settles).
   - [ ] Shows "No Public ID yet" text and explanation copy (not a crash or blank screen).
   - [ ] "Continue" button is visible and navigates to Recovery.

---

## Section 9 — Mobile: Profile Tab

1. Log in with an account that has a claimed Public ID.
2. Tap the Profile tab.
   - [ ] Shows the user's Public ID in blue text below the avatar.
   - [ ] "Manage Public ID" button is visible.
3. Tap "Manage Public ID" → navigates to the Manage Public ID screen (full-screen, not inside tab bar).
4. Log in with an account that has **no** Public ID.
   - [ ] Profile tab shows "Not set — tap below to choose".
   - [ ] Button reads "Choose a Public ID".
   - [ ] Tapping it navigates to manage-id screen.

---

## Section 10 — Mobile: manage-id Screen

1. Navigate to Profile → Manage Public ID on an account with a claimed ID.
   - [ ] Current ID is displayed in blue text.
   - [ ] "Share / Copy" button opens the OS share sheet.
   - [ ] Cooldown box shows "Free change in N days" (N ≈ 7).
2. Enter a short new ID → inline error appears, "Submit ID Change" button stays disabled.
3. Enter a valid new ID without a payment token:
   - [ ] Button enables.
   - [ ] Tap "Submit ID Change" → confirmation alert appears with destructive warning copy.
   - [ ] Dismiss alert → nothing changes.
   - [ ] Accept alert → request submitted, alert says "Check your ID below" (ID unchanged due to cooldown, which is expected).
4. Verify the confirmation alert copy explicitly mentions the 180-day lock and that contacts are not notified.
5. Navigate back to Profile tab → ID remains the same (cooldown rejected silently).

---

## Section 11 — Mobile: Error & Network Handling

- [ ] Kill the backend server. On choose-id: enter valid ID, tap Claim → "Connection error" alert appears, screen does not crash, loading spinner clears.
- [ ] Kill the backend server. On id-reveal: shows error state with "Retry" button. Tap Retry → tries again (fails again gracefully).
- [ ] Kill the backend server. On manage-id: tap Submit → "Connection error" alert.
- [ ] Kill the backend server. On profile tab: loading spinner resolves to "Not set" placeholder without crashing.

---

## Section 12 — Privacy Checks

- [ ] **No ID in push payload** — Public-ID system has no push integration in Sprint 3; verify no push-related code was added to publicIdController.js.
- [ ] **No ID in logs** — start the server with `npm run server:dev`, perform a claim and rotate, review morgan/console output. Confirm no `public_id` values appear in log lines.
- [ ] **AsyncStorage** — after onboarding, inspect AsyncStorage keys via Expo dev tools or React Native Debugger. Confirm only `authToken` and `authUser` are stored — no Public-ID cached in local storage (it's always fetched from server).
- [ ] **Anti-enumeration UI** — on choose-id, there is no "ID already taken" message. The client cannot tell the server rejected a claim for uniqueness vs. any other reason.
- [ ] **No typeahead or suggestions** — the choose-id TextInput has no autocomplete, no server-side lookup while typing, and no visible "available" indicator while the user types.
- [ ] **Confirmation modal copy** — manage-id rotation warning does not mention who else might try to claim the old ID, or reveal any internal system state.

---

## Section 13 — Regression Checks (Sprint 2 flows)

- [ ] `/api/v1/auth/register` still works and returns `{ token, user }`.
- [ ] `/api/v1/auth/login` still works.
- [ ] `/api/v1/auth/logout` still works.
- [ ] Login screen (existing accounts) navigates to `/(tabs)/chat` as before.
- [ ] Onboarding entry and explainer screens still render.
- [ ] Recovery screen still reachable at end of onboarding.
- [ ] Profile tab logout button clears storage and redirects to `/login`.
