-- Migration 001: accounts, devices, sessions
-- Order matters: accounts → devices → sessions (sessions FKs both)

CREATE TABLE IF NOT EXISTS accounts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- public_key is nullable until Sprint 5.7 adds client-side key generation
CREATE TABLE IF NOT EXISTS devices (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  public_key    BYTEA,
  label         TEXT        NOT NULL DEFAULT '',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT        PRIMARY KEY,
  account_id UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  device_id  UUID        NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_account_id    ON devices(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_account_id   ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id    ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_accounts_deleted_at   ON accounts(deleted_at) WHERE deleted_at IS NOT NULL;
