-- Migration 003: mailboxes, message_envelopes
-- Depends on: 001_accounts (devices table)

-- One mailbox per device; destroyed with the device
CREATE TABLE IF NOT EXISTS mailboxes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID UNIQUE NOT NULL REFERENCES devices(id) ON DELETE CASCADE
);

-- ciphertext is an opaque encrypted blob — server never reads its contents
-- expires_at is required; enforce 24h–72h window at the application layer
-- idempotency_key prevents duplicate delivery on retry
CREATE TABLE IF NOT EXISTS message_envelopes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id      UUID        NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
  ciphertext      BYTEA       NOT NULL,
  queued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  acked_at        TIMESTAMPTZ,
  idempotency_key TEXT        UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mailboxes_device_id                ON mailboxes(device_id);
CREATE INDEX IF NOT EXISTS idx_envelopes_mailbox_unacked          ON message_envelopes(mailbox_id, queued_at) WHERE acked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_envelopes_expires_at               ON message_envelopes(expires_at) WHERE acked_at IS NULL;
