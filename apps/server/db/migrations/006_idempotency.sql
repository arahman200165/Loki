-- Migration 006: idempotency_keys (ADR-018)
-- Depends on: nothing — standalone key/response cache for mutating endpoints.

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key             TEXT        PRIMARY KEY,
  response_status INTEGER     NOT NULL,
  response_body   BYTEA       NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
