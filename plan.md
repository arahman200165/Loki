# Sprint 2 Auth + Onboarding Implementation Plan

## Summary
Implement Sprint 2 as a DB-backed auth foundation with three coordinated changes:

- Server auth moves from in-memory sessions to PostgreSQL-backed account/device/session records.
- API auth becomes account-based for `/api/v1/auth/register` and `/api/v1/auth/login`; web admin login stays env-credential-gated but mints normal DB sessions through a reserved synthetic admin account/device.
- Mobile first-launch flow moves to onboarding, adds registration and recovery-stub screens, and persists the new auth session the same way login does today.

## Key Changes

### 1. Server auth and persistence
- Create `apps/server/src/db/models/accountModel.js`, `deviceModel.js`, and `sessionModel.js` under `src/db/models` so they live beside the existing runtime DB layer.
- Model functions should accept an optional `pg` client so `register` can run all inserts in one transaction:
  - `createAccount({ username, passwordHash }, client?)`
  - `findAccountByUsername(username, client?)`
  - `accountExists(username, client?)`
  - `createDeviceForAccount({ accountId, label = '' }, client?)`
  - `findLatestActiveDeviceForAccount(accountId, client?)`
  - `createSessionRow({ token, accountId, deviceId }, client?)`
  - `findSessionWithAccountAndDevice(token, client?)`
  - `deleteSessionRow(token, client?)`
- Username policy for Sprint 2:
  - trim, lowercase before storage/query/response
  - allowed chars: `[a-z0-9._-]`
  - length: `3-32`
  - reject the lowercased admin env username so the synthetic web-admin account cannot collide with user registration
- Password policy for Sprint 2:
  - require string
  - minimum length `12`
  - no composition rules beyond that
- Add `passwordService.js` using the `argon2` package with explicit Argon2id settings:
  - `type: argon2id`
  - `memoryCost: 65536`
  - `timeCost: 3`
  - `parallelism: 1`
  - `hashLength: 32`
- `passwordService` should expose `hashPassword` and `verifyPassword`, plus a fixed dummy hash path so login pays an Argon2 verify cost even when the username is missing, keeping the current “invalid username or password” behavior timing-resistant.

### 2. Session store rewrite and auth controllers
- Rewrite `sessionStore.js` into an async DB-backed service:
  - `createSession({ accountId, deviceId }, client?)`
  - `getSession(token)`
  - `deleteSession(token)`
- `createSession` generates the random token and inserts it through `sessionModel`.
- `getSession` returns one normalized object for both API and browser auth:
  - `token`, `issuedAt`
  - `account: { id, username }`
  - `device: { id, label }`
- `getSession` should join `sessions`, `accounts`, and `devices`, and treat soft-deleted accounts or revoked devices as invalid sessions.
- Convert these call sites to async and update the request state they set:
  - `requireSessionAuth.js` -> `req.auth = { token, accountId, deviceId, username }`
  - `requireBrowserSession.js` -> async cookie lookup and `req.webSession` using the same normalized shape
  - `authController.js`
  - `webAuthController.js`
- API auth behavior:
  - `POST /auth/register` creates account, first device, and session in one DB transaction and returns `{ token, user: { id, username } }`
  - `POST /auth/login` becomes DB-backed, verifies the password, reuses the account’s latest active device, and returns the same success shape
  - if login finds no active device, return an error telling the client the account has no registered device/session context yet
  - keep error payloads in the current `{ message }` style for Sprint 2 to avoid widening mobile churn
- Web admin behavior:
  - keep env credential validation in `webAuthController`
  - on successful browser login, create or reuse a reserved internal account plus a `web-admin` device row, then issue a normal DB session
  - browser routes continue to use the same cookie name and redirects

### 3. Register endpoint transaction flow
- Extend `authController.js` with `register` and add `POST /register` in `authRoutes.js`.
- Registration flow order:
  1. normalize + validate username/password
  2. hash password with Argon2id
  3. begin transaction
  4. insert account
  5. insert first device with `public_key = null` and `label = ''`
  6. insert session for that account/device
  7. commit
  8. return `201` with `{ token, user: { id, username } }`
- On unique username collision, roll back and return `409`.
- API login and register success responses should match the existing shared `LoginResponse` / `RegisterResponse` types in `packages/shared/src/types/auth.ts`; no shared type change is required.

### 4. Mobile onboarding and registration flow
- Add a nested onboarding stack:
  - `app/onboarding/_layout.tsx`
  - `app/onboarding/index.tsx`
  - `app/onboarding/explainer.tsx`
  - `app/onboarding/register.tsx`
  - `app/onboarding/recovery.tsx`
- Register onboarding in `app/_layout.tsx` as a hidden stack entry; keep screen-specific titles/headers in the onboarding layout.
- Update splash `app/index.tsx`:
  - keep the current animation timing
  - after the splash delay, read `authToken` from `AsyncStorage`
  - route to `/(tabs)/chat` when present, otherwise to `/onboarding`
- Onboarding screen behavior:
  - `onboarding/index.tsx`: first-launch entry screen with primary “Create account” path and secondary path to `/login` for existing users
  - `onboarding/explainer.tsx`: identity/privacy explainer before collecting credentials
  - `onboarding/register.tsx`: username + password form, visible lockout warning before submit, submit to `/api/v1/auth/register`, store `authToken` and `authUser`, then route to `/onboarding/recovery`
  - `onboarding/recovery.tsx`: stub only, no backend call, offers continue/skip actions and a clear no-recovery warning; both paths land in `/(tabs)/chat` for now
- Add `apps/mobile/components/PasswordInput.tsx` as the shared secure-entry field used by registration and then login.
- Move shared mobile auth API helpers out of `login.tsx` into `apps/mobile/lib/apiClient.ts`:
  - base URL
  - API key header constants
  - auth/header builders
  - small JSON POST helper if useful
- Update `login.tsx` to use the shared API helper and the new DB-backed `/auth/login` success payload.

### 5. Small documentation alignment
- Update the repo auth description where needed so it no longer claims:
  - API auth is only env-backed
  - sessions are in-memory
  - bcrypt is the active implementation choice for Sprint 2
- Keep the note that browser admin login remains env-credential-gated.

## Public Interfaces
- New API route: `POST /api/v1/auth/register`
- API success contracts:
  - `POST /api/v1/auth/register` -> `{ token, user: { id, username } }`
  - `POST /api/v1/auth/login` -> `{ token, user: { id, username } }`
- Internal session-store contract becomes async and DB-based:
  - `createSession({ accountId, deviceId }, client?)`
  - `getSession(token)`
  - `deleteSession(token)`

## Test Plan
- Server smoke checks:
  - `npm run migrate --workspace=server`
  - `npm run check --workspace=server`
- Mobile static check:
  - `npm run lint --workspace=mobile`
- Manual server scenarios:
  - register success creates exactly one account, one device, one session
  - duplicate username returns `409` and leaves no extra device/session rows
  - login success returns `{ token, user: { id, username } }`
  - bad username and bad password both return the same `401` message
  - logout deletes the DB session
  - `requireSessionAuth` accepts valid bearer tokens and rejects deleted/unknown ones
  - browser admin login sets cookie, survives process restart, and loads `/`
- Manual mobile scenarios:
  - fresh launch without token goes to onboarding
  - launch with stored token goes to chat
  - onboarding path works: entry -> explainer -> register -> recovery -> chat
  - registration warning is visible before account creation
  - recovery skip path shows the no-recovery warning and still lands in chat

## Assumptions
- Server models belong under `apps/server/src/db/models`, not `apps/server/db/models`, because the runtime DB layer already lives in `src`.
- First-device registration in Sprint 2 is server-created only; the mobile register request remains `username + password` and does not send device metadata yet.
- Login reuses the latest active device for the account; device-linking and multi-device enforcement remain later-sprint work.
- Recovery remains a UI stub only in Sprint 2; no recovery endpoint wiring is added yet.
- Error payloads stay on the current `{ message }` shape for now, even though shared success types already exist.
