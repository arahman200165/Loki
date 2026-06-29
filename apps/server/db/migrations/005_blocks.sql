-- Migration 005: blocks
-- Depends on: 001_accounts (accounts table)

CREATE TABLE IF NOT EXISTS blocks (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_account_id  UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blocked_account_id  UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_account_id, blocked_account_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_account_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_account_id);
