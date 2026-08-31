-- Migration 007: call_sessions type + failed state, call_signals relay (Sprint 8)
-- Depends on: 004_groups_calls (call_sessions, call_participants, group_members)
--
-- Two additions:
-- 1. call_sessions gained a `type` column (audio/video) that the original 004
--    migration omitted, and a `failed` state for connection-setup failures
--    (ADR-007). Both are additive/widening — no data loss for the empty table.
-- 2. call_signals is a small ephemeral relay for WebRTC SDP offer/answer and
--    ICE candidates. ADR-028 (no WebSockets) means signaling has to ride over
--    plain HTTP; this table is the queue GET .../signal polls. The server
--    never interprets `payload` — it's an opaque SDP/ICE blob, same
--    "signals lifecycle, never sees media" posture as the rest of calling.

ALTER TABLE call_sessions
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'audio';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'call_sessions_type_check'
  ) THEN
    ALTER TABLE call_sessions
      ADD CONSTRAINT call_sessions_type_check CHECK (type IN ('audio', 'video'));
  END IF;
END $$;

ALTER TABLE call_sessions DROP CONSTRAINT IF EXISTS call_sessions_state_check;
ALTER TABLE call_sessions
  ADD CONSTRAINT call_sessions_state_check
  CHECK (state IN ('ringing', 'active', 'ended', 'declined', 'missed', 'failed'));

CREATE TABLE IF NOT EXISTS call_signals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID        NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  from_account_id UUID        NOT NULL REFERENCES accounts(id),
  to_account_id   UUID        NOT NULL REFERENCES accounts(id),
  type            TEXT        NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate')),
  payload         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_signals_recipient
  ON call_signals(call_session_id, to_account_id, created_at);
