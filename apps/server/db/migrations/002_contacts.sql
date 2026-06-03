-- Migration 002: public_ids_active, public_ids_history, contact_requests
-- Depends on: 001_accounts (accounts table)

-- One active Public-ID per account (enforced by UNIQUE on account_id)
CREATE TABLE IF NOT EXISTS public_ids_active (
  id                           TEXT        PRIMARY KEY,
  account_id                   UUID        UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  eligible_for_free_rotation_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days'
);

-- Deprecated IDs stay locked for 180 days before anyone else can claim them
CREATE TABLE IF NOT EXISTS public_ids_history (
  id           TEXT        PRIMARY KEY,
  account_id   UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deprecated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  release_at   TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '180 days'
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_account_id     UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  recipient_account_id  UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  first_message_envelope BYTEA,
  status                TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'accepted', 'denied', 'expired')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_public_ids_history_account_id ON public_ids_history(account_id);
CREATE INDEX IF NOT EXISTS idx_public_ids_history_release_at ON public_ids_history(release_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_recipient    ON contact_requests(recipient_account_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_sender       ON contact_requests(sender_account_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_expires_at   ON contact_requests(expires_at) WHERE status = 'pending';
