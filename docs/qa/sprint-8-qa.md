# Sprint 8 QA Checklist — Audio & Video Calling

Manual verification checklist for Sprint 8 (server: 8.1–8.3 plus the
signaling-relay and TURN-credential endpoints added to unblock them; mobile:
8.4–8.8, plus the minimal chat/group thread stand-ins built to unblock 8.4/8.7
since Sprint 5.6/7.7 haven't shipped yet). There is no automated test suite —
this is the structured verification record for the sprint.

**Prerequisites specific to this sprint:**

- `react-native-webrtc` is a native module — it does **not** run in Expo Go.
  Run `npx expo prebuild` and build a custom EAS dev client before any mobile
  check below.
- Set `METERED_APP_NAME` / `METERED_API_KEY` in `apps/server/.env` (see
  `.env.example`) for real TURN credentials. Without them,
  `GET /calls/turn-credentials` falls back to STUN-only, which will fail for
  any pair of devices behind symmetric NAT.
- Run `npm run migrate` to apply `007_calls_signaling.sql` before testing —
  it adds `call_sessions.type`, the `failed` state, and the `call_signals`
  table.
- Two seeded accounts with an **accepted** contact relationship between them
  (Sprint 4 flow), each signed in on a separate device/dev-client instance.
- ADR-007 accepted this sprint: `react-native-webrtc` + Metered.ca TURN-only,
  pure P2P mesh, 8-participant cap. Reliability is scoped to
  foreground/backgrounded-running only — **Sprint 13's push dispatch isn't
  built yet**, so today "backgrounded" wake-up only works via
  `callNotificationHandler.ts`'s 5-second foreground poll fallback, not a
  real push. Don't file this as a Sprint 8 bug — it's a known cross-sprint
  dependency, tracked below.

## Server — call lifecycle (`POST /calls/initiate`, `/:id/respond`, `/:id/leave`, `/:id/terminate`, `GET /:id/state`)

- [ ] Initiate a 1:1 audio call to an accepted contact → `201 { call_id, type: "audio", state: "ringing" }`
- [ ] Initiate to a Public-ID that is **not** an accepted contact → `400 validation_failed` on `recipient_public_id` (not a 202 — calls aren't a discovery surface since they require a pre-existing accepted relationship; confirm this doesn't regress anti-enumeration on `/contact-request/send`, which is untouched)
- [ ] Initiate a group call with `recipient_public_ids` (2–7 entries, all accepted contacts) → `201`, all invitees inserted as `invited` (`joined_at IS NULL`), initiator inserted already-joined
- [ ] `recipient_public_ids` with 8 entries (9 total participants) → `400 validation_failed` (mesh cap is 8 total, confirmed in ADR-007)
- [ ] `recipient_public_ids` containing one already-accepted and one non-contact Public-ID → `400` with `invalid` listing only the bad one; no call session created
- [ ] Recipient calls `POST /:id/respond {accept:true}` → `200 {state:"active"}`; initiator's next `GET /:id/state` also shows `active`
- [ ] Recipient declines (`accept:false`) on a 1:1 call → session flips to `declined`, `ended_at` set
- [ ] Group call: one invitee declines while others are still ringing → session stays `ringing` (not all have responded yet); once the last invitee also declines with nobody having joined → `declined`
- [ ] Group call: one invitee accepts (call → `active`), a second invitee declines afterward → session stays `active`, second invitee's participant row shows `left`
- [ ] Ringing call left untouched for 45+ seconds → next `GET /:id/state` (or `/pending`) lazily flips it to `missed`
- [ ] `POST /:id/leave` from the only other active participant → session → `ended`
- [ ] `POST /:id/leave {reason:"failed"}` before anyone ever joined → session → `failed`, not `ended`
- [ ] `POST /:id/terminate` by a non-initiator participant → `403 forbidden`
- [ ] `POST /:id/terminate` by the initiator mid-call → all participants' rows get `left_at` set, session → `ended` immediately, regardless of prior state
- [ ] `GET /:id/state` from an account that is **not** a participant → `404 not_found` (no existence leak to non-participants)
- [ ] `GET /:id/state` response never contains any `account_id` — only `public_id` fields throughout (`initiator_public_id`, `participants[].public_id`)

## Server — pending-call discovery (`GET /calls/pending`) and signaling relay (`POST`/`GET /calls/:id/signal`)

- [ ] A freshly-initiated call appears in the invitee's `GET /calls/pending` with `call_id`, `type`, `initiator_public_id` — and **only** for the invitee, not for unrelated accounts
- [ ] Once the invitee responds (accept or decline), the call no longer appears in `/pending`
- [ ] A call that times out to `missed` while never polled via `/state` also disappears from `/pending` on the next poll (confirms `listPendingCalls`'s own lazy-timeout pass, not just `/state`'s)
- [ ] `POST /:id/signal` with `type: "offer"`, opaque `payload`, from a participant to another participant → `202`; the target's `GET /:id/signal` returns it with the correct `from_public_id`
- [ ] `POST /:id/signal` omitting `to_public_id` on a call with more than 2 participants → `400 validation_failed` (ambiguous target)
- [ ] `POST /:id/signal` from a non-participant → `404 not_found`
- [ ] `POST /:id/signal` against an already-`ended`/`declined`/`missed`/`failed` call → `409 call_not_active`
- [ ] `GET /:id/signal?since=<timestamp>` only returns messages after that timestamp, not the full history each poll
- [ ] After a call reaches any terminal state, query `call_signals` directly in the DB → zero rows remain for that `call_session_id` (privacy fix: ICE candidates reveal IP addresses, so they're purged immediately on call end rather than lingering — see `callSessionService.js`)

## Server — TURN credentials (`GET /calls/turn-credentials`)

- [ ] With `METERED_APP_NAME`/`METERED_API_KEY` unset → returns the STUN-only fallback, not an error
- [ ] With real Metered.ca credentials configured → returns a populated `ice_servers` array including `turn:` entries with `username`/`credential`
- [ ] Inspect the mobile app's network traffic (or just read `webrtcClient.ts`) → confirm the Metered API key itself is never present in any request the mobile app makes; only the resolved `ice_servers` are

## Idempotency (ADR-018)

- [ ] `POST /calls/initiate` called twice with the same `Idempotency-Key` → identical response both times, only one `call_sessions` row created
- [ ] Same check for `POST /calls/:id/respond`
- [ ] `POST /calls/:id/leave` and `/terminate` are intentionally **not** idempotency-keyed (matches architecture §11.5's list) — confirm calling either twice doesn't error, just re-applies harmlessly

## Mobile — 1:1 call initiation (8.4) and the Sprint-8 chat stand-in

- [ ] Tapping a chat row in `(tabs)/chat.tsx` now navigates to `chat/[id]` (previously dead) — confirm this is clearly a placeholder screen, not mistaken for the real Sprint 5.6 thread
- [ ] Audio and video call buttons appear in the thread header for a 1:1 entry and route to `/call/outgoing` with the right `type` and `recipientPublicId`
- [ ] Outgoing screen shows "Calling…" then "Ringing…", and transitions to `/call/active` the moment the recipient accepts
- [ ] Cancelling from the outgoing screen calls `POST /:id/terminate` and returns to the chat
- [ ] Recipient declining, or the call timing out, shows "Call declined" / "No answer" briefly before auto-returning

## Mobile — incoming call (8.5)

- [ ] With the app foregrounded on the recipient's device, an incoming call surfaces within ~5 seconds (the foreground poll interval) even without a real push
- [ ] Incoming screen shows the caller's Public-ID and audio-vs-video call type
- [ ] Accept → routes to `/call/active` (1:1) or `/call/group-call` (3+ participants), correctly distinguishing the two via the participant count from `GET /:id/state`
- [ ] Decline → call ends for the caller too (`declined` state), incoming screen dismisses
- [ ] If the caller cancels while the incoming screen is still showing, it auto-dismisses (via the incoming screen's own `/:id/state` poll) rather than sitting there ringing forever
- [ ] **Known gap, not a bug:** force-quitting the app before answering means no incoming-call UI appears at all — this requires CallKit/PushKit, explicitly deferred to Phase 2 per ADR-007

## Mobile — in-call controls (8.6)

- [ ] 1:1 audio call: local and remote audio both flow once state shows "Connected"
- [ ] 1:1 video call: local PiP and remote fullscreen video both render
- [ ] Mute toggles the local audio track's `enabled` flag — confirm the remote side actually stops hearing audio, not just a UI change
- [ ] Video toggle hides local video preview and the remote side stops receiving video
- [ ] Camera switch (front/back) works mid-call without dropping the connection
- [ ] Speaker toggle audibly changes the audio route
- [ ] Leave button ends the call cleanly for both sides and returns to the chat tab
- [ ] Simulate a connection failure (e.g. airplane mode mid-call) → UI shows "Connection failed" and the call is logged to history as `failed`, not silently stuck on "Connecting…"

## Mobile — group calling (8.7)

- [ ] Group call among 3 participants: everyone ends up connected to everyone else (a true mesh, not just everyone connected to the initiator) — verify by checking that muting participant B is heard as silence by participant C too, not just by the initiator
- [ ] Late join: a 4th participant accepts after the other three are already connected → existing participants pick them up within one `remotePollRef` tick (~3s) without restarting their own connections
- [ ] `ParticipantGrid` layout remains usable at 4+ tiles; spot-check CPU/battery/dropped-frame behavior at the 8-participant ceiling on real devices — this is a known risk flagged in ADR-007 (mesh bandwidth, not an architecture bug)
- [ ] Leaving a group call removes only your own connection; the remaining participants stay connected to each other

## Mobile — calls tab history (8.8)

- [ ] Completed calls show duration (`m:ss`); missed/declined/failed calls show the right label instead of a duration
- [ ] Incoming missed calls are visually distinguished (red "Missed") from other rows
- [ ] Tapping a history row or its call-back icon re-initiates a call of the same type to the same 1:1 recipient or group member set
- [ ] Group-call history entries retain enough info (`memberPublicIds`) to actually call back the same group, not just a display label
- [ ] History persists across app restarts (AsyncStorage-backed) but is never sent to the server — confirm no `/calls/*` request ever includes call-history data, only live call-session data

## Privacy checks (loki-privacy-review pass)

- [ ] No `account_id` appears in any client-facing response across the whole `/calls/*` family
- [ ] `call_signals.payload` (SDP/ICE) is purged immediately on every terminal call state, not retained
- [ ] Metered.ca's API key never leaves the server
- [ ] Call initiation requires an accepted contact relationship — confirm you cannot call an arbitrary unaccepted Public-ID even if you know it
- [ ] No push payload sent by this sprint's code contains call id, caller identity, or call type (moot until Sprint 13 ships real push dispatch, but the client-side handler code makes no assumption about payload content either way)

## QA Sign-off

**Not yet executed against a live environment.** This checklist was written
alongside the implementation but has not been run against a live database or
a built EAS dev client in this pass — there is no `DATABASE_URL` configured
and no native prebuild has been generated in this environment. All server
code passed `node --check`, full ESM import resolution (`node -e
"import('./src/app.js')"`), and manual code review; all mobile code passed
`npx tsc --noEmit` and `npm run lint` (0 errors, 4 expected
`react-hooks/exhaustive-deps` warnings on intentional mount-once effects).
Whoever has Neon credentials and a device/simulator should run this checklist
before considering Sprint 8 done.

| Section | Result |
|---|---|
| Server — call lifecycle | ⬜ Not yet run |
| Server — pending discovery + signaling relay | ⬜ Not yet run |
| Server — TURN credentials | ⬜ Not yet run |
| Idempotency | ⬜ Not yet run |
| Mobile — 1:1 initiation (8.4) | ⬜ Not yet run |
| Mobile — incoming call (8.5) | ⬜ Not yet run |
| Mobile — in-call controls (8.6) | ⬜ Not yet run |
| Mobile — group calling (8.7) | ⬜ Not yet run |
| Mobile — calls tab history (8.8) | ⬜ Not yet run |
| Privacy checks | ⬜ Not yet run (static review passed — see below) |

---

## Known gaps / follow-ups surfaced during this pass

- **Sprint 5.6 and 7.7 don't exist yet.** `chat/[id].tsx` is an explicit,
  labeled Sprint-8-only stand-in (header + static placeholder list) — it is
  not the real chat thread. `(tabs)/chat.tsx`'s mock chat entries were given
  placeholder Public-IDs (`dancing-panda927`, etc.) so calling has something
  real to call; swap in a genuine accepted contact's Public-ID to test
  end-to-end. This regresses nothing — the mock list already existed and had
  no tap-through at all before this sprint.
- **Sprint 13 (push dispatch) isn't built.** `POST /calls/initiate` never
  triggers an actual OS push today — no `pushService.js`, no APNs/FCM
  provider config exists anywhere in `apps/server`. Incoming calls currently
  only surface via the mobile foreground poll (`callNotificationHandler.ts`,
  every 5s) or immediately on app foreground/focus. This satisfies the
  "foreground-reliable" half of ADR-007's scoped reliability target but not
  the "backgrounded-but-running" half until Sprint 13 ships real push
  dispatch — the client-side code is already written to consume a real push
  correctly once that lands, no rework needed.
- **`react-native-webrtc` requires a custom EAS dev client.** The app can no
  longer be run in plain Expo Go from this sprint onward. `npx expo
  prebuild` has not been run in this environment (no Xcode/Android SDK
  available here) — the first engineer to pick this up needs to prebuild and
  build a dev client before any mobile check above is possible.
- **`call_sessions`/`call_participants` rows are never deleted.** This
  matches the architecture doc's own retention table, which already lists
  call-session cleanup as "Job (TBD)" — not a regression introduced by this
  sprint. `call_signals` (the new, more sensitive table) *is* actively
  cleaned up on every terminal transition, specifically because it carries
  IP-revealing ICE payloads that the pre-existing session-metadata table
  doesn't.
- **Group calling via `group_id`** (attaching a call to a real Sprint 7 group
  thread) is defined in the shared types and gated with a real
  `group_members` membership check, but returns `400` with an explanatory
  message rather than working — Sprint 7's group messaging doesn't exist yet.
  MVP group calling uses the ad-hoc `recipient_public_ids` path instead,
  which needs no persistent group at all. This was a deliberate scoping
  decision (see ADR-007 discussion), not an oversight.
