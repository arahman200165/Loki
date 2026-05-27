-- Migration 004: groups, group_members, group_events, call_sessions, call_participants
-- Depends on: 001_accounts (accounts table)

CREATE TABLE IF NOT EXISTS groups (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_account_id UUID        NOT NULL REFERENCES accounts(id),
  name             TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite PK enforces one row per (group, member)
CREATE TABLE IF NOT EXISTS group_members (
  group_id   UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  account_id UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, account_id)
);

CREATE TABLE IF NOT EXISTS group_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  event_type        TEXT        NOT NULL
                      CHECK (event_type IN ('member_joined', 'member_left', 'member_removed', 'admin_transferred')),
  actor_account_id  UUID        NOT NULL REFERENCES accounts(id),
  target_account_id UUID        REFERENCES accounts(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- group_id is nullable for 1:1 calls
CREATE TABLE IF NOT EXISTS call_sessions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_account_id UUID        NOT NULL REFERENCES accounts(id),
  group_id             UUID        REFERENCES groups(id),
  state                TEXT        NOT NULL DEFAULT 'ringing'
                          CHECK (state IN ('ringing', 'active', 'ended', 'declined', 'missed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at             TIMESTAMPTZ
);

-- joined_at/left_at nullable to track ringing → answered → left lifecycle
CREATE TABLE IF NOT EXISTS call_participants (
  call_session_id UUID        NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  account_id      UUID        NOT NULL REFERENCES accounts(id),
  joined_at       TIMESTAMPTZ,
  left_at         TIMESTAMPTZ,
  PRIMARY KEY (call_session_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_account_id     ON group_members(account_id);
CREATE INDEX IF NOT EXISTS idx_group_events_group_id        ON group_events(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_call_sessions_initiator      ON call_sessions(initiator_account_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_state          ON call_sessions(state) WHERE state IN ('ringing', 'active');
CREATE INDEX IF NOT EXISTS idx_call_participants_account_id ON call_participants(account_id);
