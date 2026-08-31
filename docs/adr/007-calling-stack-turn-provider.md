# ADR-007: Calling stack and TURN provider

## Status

Accepted

## Date

2026-08-31

## Owner

Abdul, Eric

## Problem

Sprint 8 needs a concrete WebRTC media stack and NAT-traversal provider for 1:1
and group audio/video calling. This was the single open blocker flagged in the
architecture doc's own risk register (R13) as required before Sprint 8 could
start.

## Context

- Principle P2 (message/attachment/vault/call content stays off the server in
  plaintext) and the domain note that "the server only signals call
  lifecycle; it does not see media frames" both apply directly.
- ADR-005 (single Express monolith) and the glossary explicitly frame an SFU as
  "out of scope for MVP" — no self-hosted SFU/TURN.
- ADR-028 (no WebSockets in MVP) means whatever signaling transport is chosen
  has to work over plain HTTP request/response, not a persistent socket.
- 4-engineer team, MVP scope — anything requiring dedicated media-server
  operations work is disproportionate to the team's bandwidth (same reasoning
  as ADR-005).

## Options considered

1. **Managed WebRTC-as-a-service (SFU-backed)** — e.g. LiveKit Cloud, Twilio
   Video, Daily.co. Pros: handles group calls natively, less custom mesh
   logic, well-trodden path. Cons: media is decrypted at the vendor's SFU for
   routing (true E2E media needs a specific insertable-streams feature, adding
   real complexity); contradicts the glossary's "SFU out of scope for MVP"
   framing; introduces a new operational dependency and cost surface for a
   4-engineer team.
2. **Pure P2P WebRTC + TURN-only fallback** (chosen) — `react-native-webrtc`
   with a TURN-only relay for NAT traversal. Pros: no third party ever
   touches decrypted media (a TURN server relays already-encrypted SRTP
   packets without decrypting them); matches "server only signals, never sees
   media" and the "no SFU" framing exactly; no new operational surface beyond
   one small TURN-credential API call. Cons: group calls become a mesh
   topology, which does not scale arbitrarily — bounded by device
   upload bandwidth/CPU, not by an architecture decision.
3. **P2P for 1:1 only, defer group calling** — smallest scope and cleanest
   privacy story, but the PRD (§9.13) and release criteria (§15, item 8)
   require group calling in MVP; rejected as under-scoped for a stated MVP
   requirement.

## Decision

Option 2. `react-native-webrtc` for the mobile media/signaling client, pure
P2P mesh topology, **Metered.ca** as the TURN-only provider (ephemeral,
REST-issued short-lived credentials; no forced SFU; generous free tier fits
MVP traffic).

**Group call cap:** 8 participants per call, independent of the 25-person
messaging group cap (ADR-014). This is a mesh-specific bound: at 8
participants each device uploads 7 simultaneous outbound streams
simultaneously, which is a real bandwidth/CPU load on mobile hardware. This
was confirmed as the team's choice knowing that risk — see Consequences.

**Signaling transport:** Because ADR-028 forbids WebSockets, SDP
offer/answer and ICE candidates travel over three new HTTP endpoints layered
onto the call-session API family (not in the original build-plan table):

- `POST /api/v1/calls/:id/signal` — `{ to_public_id?, type: 'offer'|'answer'|'ice-candidate', payload }`. The server stores this as an opaque row in a new `call_signals` table and never interprets `payload` — same posture as the rest of calling (it carries codec/network info, not media).
- `GET /api/v1/calls/:id/signal?since=<ISO-8601>` — polled by the recipient's client, ~1s while a call screen is open, to keep call setup inside the target p95 < 3s.
- `GET /api/v1/calls/pending` — lets a device that just received a content-free wake-up push (ADR-013) discover which call is ringing for it, without the push payload ever naming a call id or caller. This keeps ADR-013 intact rather than carving out an exception for calls.

**Speaker/proximity routing:** `react-native-webrtc` does not manage audio
routing UI by itself; `react-native-incall-manager` is added alongside it for
mute/speaker/proximity-sensor behavior — a common, narrowly-scoped pairing,
not a new architectural surface.

**Native build implication:** `react-native-webrtc` is a native module and
does not run in Expo Go regardless of any other decision here — the mobile
app moves to a custom EAS dev client for Sprint 8 onward. This was going to be
true under any option in this ADR.

**Reliability scope:** Incoming calls are reliable while the app process is
foreground or backgrounded-but-running (wake-up push + `/calls/pending`
poll). Force-quit-app delivery requires iOS PushKit VoIP + CallKit and
Android high-priority FCM + full-screen intent, which is a materially larger
native-config lift; this is explicitly deferred to a Phase-2 follow-up rather
than bundled into Sprint 8.

## Consequences

- Positive: no third party ever has access to decrypted call media; the
  server's "signals lifecycle, never sees media" property holds in the
  strictest sense; no new self-hosted infrastructure to operate; matches the
  architecture doc's existing framing without needing to override it.
- Negative: group calls are capped at 8 by mesh bandwidth/CPU limits, not by a
  clean product decision — this should be watched in manual testing (dropped
  frames, battery drain, connection failures at the high end) and may need to
  be lowered post-launch if real-device testing shows it's too aggressive.
- Negative: force-quit-app incoming call delivery is a known MVP gap,
  documented in user-facing copy rather than solved.
- Open follow-up: if group calling usage grows meaningfully, revisit an SFU
  (with E2E insertable streams, if the chosen vendor supports it) as a
  dedicated Phase-2 ADR rather than retrofitting mesh call code.
- Open follow-up: CallKit/PushKit for force-quit reliability, tracked as a
  Phase-2 item, not scheduled yet.
