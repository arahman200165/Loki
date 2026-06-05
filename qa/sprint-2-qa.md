# Sprint 2 Manual QA Checklist — Account Registration & Core Auth

**Sprint:** 2  
**Date:** 2026-06-04  
**Covers:** DB-backed register/login/logout, Argon2id passwords, PostgreSQL sessions, mobile onboarding flow, shared API client, PasswordInput component

---

## Setup

```bash
# 1. Ensure DATABASE_URL is set in apps/server/.env with valid Neon credentials
# 2. Run migrations (Sprint 1 schema must already be applied)
npm run migrate --workspace=server

# 3. Start the backend
npm run server:dev

# 4. Start the mobile app
npm run mobile:start
```

Environment variables required in `apps/server/.env`:
- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_USERNAME` — reserved admin username (default: `loki-admin`)
- `AUTH_PASSWORD` — admin password (default: `loki-pass-123`)
- `API_KEY` — must match `EXPO_PUBLIC_API_KEY` in mobile env

---

## 1. Server — Registration (`POST /api/v1/auth/register`)

### 1.1 Happy path
- [ ] Send `{ username: "testuser1", password: "securepass1234" }` with valid `x-api-key` header
- [ ] Response is `201` with `{ token, user: { id, username } }`
- [ ] `username` in response is lowercased/trimmed
- [ ] Verify DB: exactly 1 row in `accounts`, 1 in `devices` (label = `''`, public_key = NULL), 1 in `sessions`

### 1.2 Duplicate username
- [ ] Register the same username a second time
- [ ] Response is `409 { message: "Username already taken." }`
- [ ] Verify DB: no extra `devices` or `sessions` rows created (transaction rolled back)

### 1.3 Username validation
- [ ] Send username `"ab"` (too short) → `400`
- [ ] Send username with 33 chars → `400`
- [ ] Send username `"Test User!"` (invalid chars) → `400`
- [ ] Send username matching `AUTH_USERNAME` value → `400` (reserved)
- [ ] Send username `"  TestUser  "` (mixed case, spaces) → normalised to `"testuser"`, registers if not taken

### 1.4 Password validation
- [ ] Send password `"short"` (< 12 chars) → `400`
- [ ] Send missing password → `400`
- [ ] Send non-string password (e.g., `123`) → `400`

### 1.5 Missing API key
- [ ] Register without `x-api-key` header → `401` (rejected by `requireApiKey`)

---

## 2. Server — Login (`POST /api/v1/auth/login`)

### 2.1 Happy path
- [ ] Login with registered credentials
- [ ] Response is `200 { token, user: { id, username } }`
- [ ] Verify DB: new row in `sessions` with matching `account_id` and `device_id`

### 2.2 Wrong password
- [ ] Send correct username + wrong password → `401 { message: "Invalid username or password." }`

### 2.3 Unknown username
- [ ] Send non-existent username + any password → `401 { message: "Invalid username or password." }`
- [ ] Response message is identical to wrong-password case (anti-enumeration)

### 2.4 Timing resistance
- [ ] Time a request with a known username + wrong password vs. unknown username + any password
- [ ] Both should take roughly the same time (Argon2 verify path runs in both cases)

### 2.5 Soft-deleted account
- [ ] Manually set `deleted_at = now()` on an account row in the DB
- [ ] Login attempt returns `401` (treated as unknown)

### 2.6 Account with no active device
- [ ] Manually revoke all devices for an account (`UPDATE devices SET revoked_at = now() WHERE account_id = '...'`)
- [ ] Login returns `401` with a message about no active device

---

## 3. Server — Logout (`POST /api/v1/auth/logout`)

### 3.1 Happy path
- [ ] Login, capture token; POST `/logout` with `Authorization: Bearer <token>`
- [ ] Response `200 { message: "Logout successful." }`
- [ ] Verify DB: session row deleted

### 3.2 Already logged out
- [ ] Call logout with the same token again → `200 { message: "Session already cleared." }`

### 3.3 Invalid token
- [ ] POST `/logout` with a fabricated bearer token → `401` (rejected by `requireSessionAuth`)

---

## 4. Server — Session middleware (`requireSessionAuth`)

### 4.1 Valid session
- [ ] Use a live token on any protected endpoint → passes through, `req.auth` contains `{ token, accountId, deviceId, username }`

### 4.2 Invalid/expired token
- [ ] Use a deleted or fabricated token → `401`

### 4.3 Revoked device
- [ ] Set `revoked_at` on the device for a live session → subsequent protected request returns `401`

### 4.4 Soft-deleted account
- [ ] Set `deleted_at` on the account for a live session → subsequent protected request returns `401`

---

## 5. Server — Web Admin Browser Login

### 5.1 Happy path
- [ ] `GET /login` renders login form
- [ ] POST valid env credentials → cookie `loki_session` set, redirected to `/`
- [ ] Verify DB: an account row exists for the admin username, one device with label `web-admin`, one session

### 5.2 Second login (reuse admin account/device)
- [ ] Log out, log in again
- [ ] Verify DB: account and device rows unchanged (reused), only a new session token created

### 5.3 Wrong credentials
- [ ] POST wrong password → redirected to `/login?error=1`
- [ ] No DB rows created

### 5.4 Session survives server restart
- [ ] Log in via browser, note cookie value
- [ ] Restart server (`npm run server:dev`)
- [ ] Make a request to `/` with the same cookie → `200` (session is in DB, survives restart)

---

## 6. Mobile — Splash Screen Routing

### 6.1 No stored token (fresh install)
- [ ] Clear AsyncStorage (or fresh device/simulator)
- [ ] Launch app → splash animation plays for ~2.4s → navigates to `/onboarding`

### 6.2 Stored token present
- [ ] Log in once, token saved to AsyncStorage
- [ ] Close and reopen app → splash → navigates to `/(tabs)/chat` (bypasses onboarding)

---

## 7. Mobile — Onboarding Flow

### 7.1 Entry screen
- [ ] "Create account" button navigates to `/onboarding/explainer`
- [ ] "Already have an account? Log in" link navigates to `/login`

### 7.2 Explainer screen
- [ ] All 4 privacy points are visible and readable
- [ ] "I understand — continue" navigates to `/onboarding/register`
- [ ] Back button navigates back to entry

### 7.3 Register screen — happy path
- [ ] Enter valid username and password (≥12 chars)
- [ ] Lockout warning is visible before submitting
- [ ] Tap "Create account" → spinner shows → success → navigates to `/onboarding/recovery`
- [ ] `authToken` and `authUser` written to AsyncStorage after success

### 7.4 Register screen — validation errors
- [ ] Submit with empty username → alert "Missing fields"
- [ ] Submit with empty password → alert "Missing fields"
- [ ] Submit with username already taken → alert shows `409` message
- [ ] Submit with password < 12 chars → alert shows server validation message

### 7.5 Register screen — network error
- [ ] Kill the server, submit registration → alert "Connection error"
- [ ] No AsyncStorage values written

### 7.6 Recovery screen — no-recovery warning
- [ ] Warning block visible: "No recovery = permanent loss"
- [ ] Body text clearly states the account cannot be restored
- [ ] "Continue to Loki" navigates to `/(tabs)/chat`

---

## 8. Mobile — Login Screen

### 8.1 Happy path
- [ ] Enter registered credentials → success → navigates to `/(tabs)/chat`
- [ ] `authToken` and `authUser` updated in AsyncStorage

### 8.2 Wrong credentials
- [ ] Enter wrong password → alert with `401` message

### 8.3 Network error
- [ ] Kill the server, attempt login → alert "Connection error"

### 8.4 "New here?" link
- [ ] Tapping "New here? Create an account" navigates to `/onboarding`

### 8.5 PasswordInput component
- [ ] Password field shows masked text by default
- [ ] Tapping "Show" reveals password in plain text
- [ ] Tapping "Hide" masks it again
- [ ] Used on both login and register screens

---

## 9. Privacy Checks

### 9.1 No plaintext passwords in logs
- [ ] Run server with `NODE_ENV=development`, attempt login and register
- [ ] Check server stdout: no password values appear in any morgan log lines or console output

### 9.2 No session token in logs
- [ ] Verify token values are not logged in server stdout

### 9.3 Anti-enumeration — identical error messages
- [ ] Login with unknown username returns exactly `"Invalid username or password."`
- [ ] Login with known username + wrong password returns exactly `"Invalid username or password."`
- [ ] No difference in response body, status code, or timing that could distinguish the two

### 9.4 Reserved admin username protected
- [ ] Attempt to register with the value of `AUTH_USERNAME` (e.g., `loki-admin`) → `400` (not available)

### 9.5 Password hash never returned
- [ ] Inspect all API responses: `password_hash` is never present in any response body

### 9.6 AsyncStorage contents
- [ ] After login, inspect AsyncStorage keys: only `authToken` (opaque hex) and `authUser` (`{ id, username }`) — no password stored

### 9.7 PasswordInput — no autocomplete leak
- [ ] Confirm `autoCorrect={false}` and `secureTextEntry` are present on the password field in both register and login

---

## 10. Retention / Session Cleanup

### 10.1 Logout removes session from DB
- [ ] Login, inspect `sessions` table, confirm row exists
- [ ] Logout, re-inspect — row is gone

### 10.2 Server restart does not wipe sessions
- [ ] Log in, note token
- [ ] Restart server
- [ ] Use token on a protected endpoint → still valid (session is in DB)

### 10.3 Duplicate sessions accumulate (expected for now)
- [ ] Log in twice with the same account → two session rows exist in DB
- [ ] Both tokens are independently valid (multi-session is acceptable for Sprint 2)

---

## 11. Static Checks

```bash
# Server syntax check
npm run check --workspace=server

# Mobile lint
npm run lint --workspace=mobile
```

- [ ] `npm run check --workspace=server` exits 0
- [ ] `npm run lint --workspace=mobile` exits 0 with no errors
