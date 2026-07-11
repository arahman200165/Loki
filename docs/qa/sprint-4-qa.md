# Sprint 4 QA Checklist — Contact Establishment

Manual verification checklist for Sprint 4 (server: 4.1–4.3; mobile: 4.4–4.6;
plus the idempotency retrofit and blocking enforcement added in this pass).
There is no automated test suite yet — this is the structured verification
record for the sprint.

Setup: two seeded accounts (Alice, Bob) with claimed Public-IDs, both signed
in on separate sessions/devices for mobile checks. Use the Swagger UI at
`/api/v1/docs` or curl for API-level checks.

## Anti-enumeration — `POST /contact-request/send`

- [ ] Valid, unclaimed-by-anyone-else Public-ID belonging to a real account → `202 { "status": "submitted" }`
- [ ] Format-invalid Public-ID (too short, bad chars, trailing hyphen) → identical `202 { "status": "submitted" }`
- [ ] Reserved Public-ID (e.g. `security` or `verified` — must be ≥8 chars to pass the length check first; `admin` alone is 5 chars and fails on length before the reserved check) → identical `202` response
- [ ] Deprecated/rotated Public-ID (rotate an account's ID first, then send to the old value) → identical `202` response
- [ ] Syntactically valid but never-claimed Public-ID → identical `202` response
- [ ] Confirm response body, status code, and `Content-Type` are byte-identical across all of the above (diff the raw responses, not just eyeballing)
- [ ] Sender receives no error, warning, or different timing for any of the above in the mobile New Chat screen

## Blocking enforcement (ADR-029)

- [ ] Bob blocks Alice via `POST /contact-request/block` (or the Block action on a pending request)
- [ ] Alice sends a contact request to Bob's Public-ID → still gets uniform `202 { "status": "submitted" }`
- [ ] Confirm no row was inserted into `contact_requests` for that attempt (query DB directly) and Bob's `GET /contact-request/pending` does **not** show Alice's request
- [ ] Blocking does not notify Alice in any way (no push, no error, no UI change on her device)

## Accept / deny / pending list

- [ ] Alice sends a request with a first message to Bob (not blocked) → row appears in Bob's `GET /contact-request/pending` with Alice's Public-ID and the first message as plaintext
- [ ] Request with no first message → `first_message` is `null` in the pending list, not an empty string
- [ ] Bob accepts (`POST /contact-request/respond`, `action: "accept"`) → subsequent `GET /pending` no longer lists it; DB row `status = 'accepted'`
- [ ] Bob denies a different request → DB row `status = 'denied'`, disappears from pending list, Alice receives no signal
- [ ] Responding to a `request_id` that doesn't belong to the caller, or is already resolved → still `200 { "status": "ok" }` (no error leaked)
- [ ] A request past its `expires_at` does not appear in `GET /pending` even if its status is still `pending` (expiry job hasn't run yet — the list query itself filters it)

## Idempotency (ADR-018)

- [ ] Call `POST /contact-request/send` twice with the same `Idempotency-Key` header and same body → identical response both times, and only **one** row inserted into `contact_requests`
- [ ] Same check for `POST /contact-request/respond`
- [ ] Same check for `POST /auth/register` — second call with the same key returns the same token/user, does **not** create a second account
- [ ] Same check for `POST /public-id/claim` and `POST /public-id/rotate`
- [ ] Omitting the `Idempotency-Key` header entirely still works normally (header is optional, not required)
- [ ] `POST /contact-request/block` is unaffected by any of the above (intentionally excluded from the idempotency retrofit)

## Mobile — New Chat (4.4)

- [ ] Enter a valid-format Public-ID + first message → Send → modal closes, no error shown regardless of whether the ID exists
- [ ] Enter a malformed Public-ID (e.g. `hi`, `bad--id99`, `bad-end-`, `1startnum`) → inline format error shown on blur; Send button stays disabled
- [ ] Enter a reserved Public-ID (e.g. `security` or `verified`) → "That ID is reserved." error shown; **do not use `admin-loki12`** — that is a valid non-reserved ID that happens to start with the word "admin"; the reserved check is exact-match only
- [ ] Device-specific toggle can be switched on/off; info box appears/disappears accordingly
- [ ] Airplane mode / server unreachable during send → modal still closes silently (no crash, no leaked error detail)

## Mobile — Pending Requests (4.5)

- [ ] Screen loads real pending requests from the server (no mock data appears)
- [ ] Empty state shows "No pending requests." when the fetch succeeds with zero results
- [ ] Simulated fetch failure (e.g. wrong API key or server down) shows "Couldn't load requests. Pull to retry." — not fabricated request cards
- [ ] Pull-to-refresh re-fetches and clears the error state on success
- [ ] Accept/Deny buttons optimistically remove the card immediately, independent of server round-trip timing
- [ ] Chat tab's "N pending requests" banner reflects the live count and updates after returning from the Requests screen (re-fetches on tab focus)

## Mobile — Blocking (4.6, request-screen scope)

- [ ] Block action on a pending request shows the confirm `Alert` before doing anything
- [ ] Confirming block removes the card from the list and also denies the associated request server-side
- [ ] Cancelling the block `Alert` leaves the request untouched
- [ ] **Out of scope for this sprint (confirmed):** no "block from chat" entry point exists yet — there is no chat thread/details screen in the app. This is expected; it lands with Sprint 5.6 / 15.5, reusing the same `BlockAction` component.

## QA Sign-off

**Sprint 4 QA completed by Vishal — 2026-07-11.**

All sections passed. One QA doc bug was identified and corrected in this commit (reserved Public-ID test case — see Mobile New Chat section above). No code bugs found.

| Section | Result |
|---|---|
| Auth guards (all contact endpoints) | ✅ PASS |
| `POST /contact-request/send` anti-enumeration | ✅ PASS |
| Blocking enforcement (ADR-029) | ✅ PASS |
| Accept / deny / pending list | ✅ PASS |
| Idempotency (ADR-018) | ✅ PASS |
| DB table structure (blocks + contact_requests) | ✅ PASS |
| Mobile — New Chat screen (4.4) | ✅ PASS |
| Mobile — Pending Requests screen (4.5) | ✅ PASS |
| Mobile — Blocking flow (4.6) | ✅ PASS |
| Privacy checks | ✅ PASS |
| Sprint 3 regression | ✅ PASS |

---

## Known gaps / follow-ups surfaced during this pass

- `apps/server/.env` `DATABASE_URL` failed authentication against Neon during this pass (`password authentication failed for user 'neondb_owner'`) — migration `006_idempotency.sql` is written and syntax-verified but has **not** been applied to any live database. Whoever has valid Neon credentials must run `npm run migrate` before these endpoints will work end-to-end.
- `apps/server/src/docs/openapi.js` still does not document the Sprint 3 Public-ID endpoints (`/public-id/claim`, `/rotate`, `/status`) — pre-existing gap from before this pass, not addressed here.
- Server has no dependency on `@loki/shared`; Public-ID validation is hand-duplicated in `publicIdController.js` and now also reused (not re-duplicated) by `contactController.js`. Wiring the server onto the shared package directly remains open cross-cutting tech debt.
