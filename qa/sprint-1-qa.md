# Sprint 1 — Manual QA Checklist

DB migrations (001–004), migrate.js runner, shared TypeScript types, and Public-ID validator.

---

## Setup

1. Copy `.env.example` to `.env` in `apps/server/` and fill in `DATABASE_URL` with your Neon connection string.
2. Confirm `DATABASE_SSL=true` and `DATABASE_SSL_REJECT_UNAUTHORIZED=true` are set.
3. Verify the server can reach the DB: `npm run server:dev` from repo root, then:
   ```bash
   curl http://localhost:4000/api/v1/health
   ```
   Confirm `"database": { "status": "ok" }` in the response. If it shows `"degraded"`, your `DATABASE_URL` is wrong or unreachable — stop here.

---

## A — Migration Runner (migrate.js)

**A1 — First run applies all 4 migrations**
```bash
cd apps/server && npm run migrate
```
Expected output:
```
  apply 001_accounts.sql
  apply 002_contacts.sql
  apply 003_messages.sql
  apply 004_groups_calls.sql

Done. 4 migration(s) applied.
```
No errors, no rollback message.

**A2 — `schema_migrations` table was created and populated**

Connect to your Neon DB (Neon console SQL editor or `psql`) and run:
```sql
SELECT filename, applied_at FROM schema_migrations ORDER BY filename;
```
Expected: 4 rows, one per migration file, `applied_at` timestamps within the last few minutes.

**A3 — Second run is fully idempotent (skip, don't re-apply)**
```bash
npm run migrate
```
Expected output:
```
  skip  001_accounts.sql
  skip  002_contacts.sql
  skip  003_messages.sql
  skip  004_groups_calls.sql

Done. 0 migration(s) applied.
```
No errors. No duplicate rows in `schema_migrations`.

**A4 — Failed migration rolls back cleanly**

Temporarily corrupt a migration file (e.g., add `INVALID SQL;` to the top of `003_messages.sql`), then run `npm run migrate`. Expected: prints `Migration failed, rolled back:` with an error message, exits with code 1. Restore the file. Confirm `schema_migrations` still only has the rows from before.

---

## B — Table & Index Existence

Run these in the Neon SQL editor or `psql`.

**B1 — All 13 tables exist**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
Expected tables: `accounts`, `call_participants`, `call_sessions`, `contact_requests`, `devices`, `group_events`, `group_members`, `groups`, `mailboxes`, `message_envelopes`, `public_ids_active`, `public_ids_history`, `schema_migrations`, `sessions`.

**B2 — All indexes exist**
```sql
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```
Confirm at minimum these are present:
- `idx_devices_account_id`
- `idx_sessions_account_id`, `idx_sessions_device_id`
- `idx_contact_requests_recipient`, `idx_contact_requests_sender`, `idx_contact_requests_expires_at`
- `idx_public_ids_history_account_id`, `idx_public_ids_history_release_at`
- `idx_envelopes_mailbox_unacked`, `idx_envelopes_expires_at`
- `idx_group_members_account_id`, `idx_group_events_group_id`
- `idx_call_sessions_initiator`, `idx_call_sessions_state`, `idx_call_participants_account_id`

**B3 — FK constraints are wired correctly**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('test-fk', 'x');
INSERT INTO sessions (token, account_id, device_id)
VALUES ('tok', (SELECT id FROM accounts WHERE username='test-fk'), gen_random_uuid());
```
Expected: FK violation error (`violates foreign key constraint`). Clean up:
```sql
DELETE FROM accounts WHERE username = 'test-fk';
```

**B4 — `contact_requests.status` CHECK constraint fires**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-sender', 'x'), ('qa-recip', 'x');
INSERT INTO contact_requests (sender_account_id, recipient_account_id, status)
VALUES (
  (SELECT id FROM accounts WHERE username='qa-sender'),
  (SELECT id FROM accounts WHERE username='qa-recip'),
  'bogus-status'
);
```
Expected: CHECK constraint violation. Clean up:
```sql
DELETE FROM accounts WHERE username IN ('qa-sender', 'qa-recip');
```

**B5 — `call_sessions.state` CHECK constraint fires**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-caller', 'x');
INSERT INTO call_sessions (initiator_account_id, state)
VALUES ((SELECT id FROM accounts WHERE username='qa-caller'), 'on-hold');
```
Expected: CHECK constraint violation. Clean up:
```sql
DELETE FROM accounts WHERE username = 'qa-caller';
```

**B6 — One mailbox per device (UNIQUE enforced)**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-mb', 'x');
INSERT INTO devices (account_id) VALUES ((SELECT id FROM accounts WHERE username='qa-mb'));
WITH d AS (SELECT id FROM devices WHERE account_id=(SELECT id FROM accounts WHERE username='qa-mb'))
INSERT INTO mailboxes (device_id) SELECT id FROM d;
WITH d AS (SELECT id FROM devices WHERE account_id=(SELECT id FROM accounts WHERE username='qa-mb'))
INSERT INTO mailboxes (device_id) SELECT id FROM d;
```
Expected: second insert fails with unique constraint violation. Clean up:
```sql
DELETE FROM accounts WHERE username = 'qa-mb';
```

**B7 — One Public-ID per account (UNIQUE enforced on `public_ids_active.account_id`)**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-pid', 'x');
INSERT INTO public_ids_active (id, account_id) VALUES ('qatest01', (SELECT id FROM accounts WHERE username='qa-pid'));
INSERT INTO public_ids_active (id, account_id) VALUES ('qatest02', (SELECT id FROM accounts WHERE username='qa-pid'));
```
Expected: second insert fails with unique constraint. Clean up:
```sql
DELETE FROM accounts WHERE username = 'qa-pid';
```

**B8 — `message_envelopes.idempotency_key` is UNIQUE**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-env', 'x');
INSERT INTO devices (account_id) VALUES ((SELECT id FROM accounts WHERE username='qa-env'));
INSERT INTO mailboxes (device_id)
  SELECT id FROM devices WHERE account_id=(SELECT id FROM accounts WHERE username='qa-env');
INSERT INTO message_envelopes (mailbox_id, ciphertext, expires_at, idempotency_key)
  SELECT id, '\x01', now() + interval '1 day', 'idem-key-1' FROM mailboxes
  WHERE device_id=(SELECT id FROM devices WHERE account_id=(SELECT id FROM accounts WHERE username='qa-env'));
INSERT INTO message_envelopes (mailbox_id, ciphertext, expires_at, idempotency_key)
  SELECT id, '\x02', now() + interval '1 day', 'idem-key-1' FROM mailboxes
  WHERE device_id=(SELECT id FROM devices WHERE account_id=(SELECT id FROM accounts WHERE username='qa-env'));
```
Expected: second insert fails with unique constraint. Clean up:
```sql
DELETE FROM accounts WHERE username = 'qa-env';
```

**B9 — `devices.public_key` accepts NULL (nullable until Sprint 5.7)**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-nokey', 'x');
INSERT INTO devices (account_id, public_key) VALUES ((SELECT id FROM accounts WHERE username='qa-nokey'), NULL);
```
Expected: succeeds. Clean up:
```sql
DELETE FROM accounts WHERE username = 'qa-nokey';
```

---

## C — Public-ID Validator (`packages/shared/src/utils/publicId.ts`)

No test runner exists yet. To execute the validator, use `tsx` if available:
```bash
npx tsx --eval "
import { validatePublicId, normalizePublicId } from './packages/shared/src/utils/publicId.ts';
console.log(validatePublicId('alice-2024'));
console.log(validatePublicId('admin'));
console.log(validatePublicId('abc'));
console.log(normalizePublicId('  Alice-2024  '));
"
```

For each case below, confirm `validatePublicId(input)` returns the expected result.

**C1 — Happy path**

| Input | Expected |
|---|---|
| `"alice-2024"` | `{ valid: true }` |
| `"johndoe1"` | `{ valid: true }` |
| `"x1y2z3w4"` | `{ valid: true }` |
| `"a-b-c-d-e-f"` | `{ valid: true }` (8 chars) |

**C2 — Too short / too long**

| Input | Expected reason |
|---|---|
| `"abc1234"` | `too_short` (7 chars) |
| `"a"` | `too_short` |
| `"a" + "b".repeat(24)` | `too_long` (25 chars) |

**C3 — Invalid format**

| Input | Expected reason |
|---|---|
| `"1alice-ok"` | `invalid_format` (starts with digit) |
| `"alice--ok"` | `invalid_format` (consecutive hyphens) |
| `"alice-ok-"` | `invalid_format` (trailing hyphen) |
| `"Alice-OK"` | `invalid_format` (uppercase) |
| `"alice ok"` | `invalid_format` (space) |
| `"alice_ok"` | `invalid_format` (underscore) |

**C4 — Reserved names**

| Input | Expected |
|---|---|
| `"admin"` | `{ valid: false, reason: 'reserved' }` |
| `"loki1234"` | `{ valid: true }` — only exact match is reserved |
| `"support"` | `{ valid: false, reason: 'reserved' }` |
| `"verified"` | `{ valid: false, reason: 'reserved' }` |

**C5 — Confusable Unicode chars**

| Input | Expected |
|---|---|
| `"аlice123"` (Cyrillic `а`, U+0430) | `{ valid: false, reason: 'confusable' }` |
| `"alice123"` (pure ASCII) | `{ valid: true }` |

**C6 — `normalizePublicId` strips whitespace and lowercases**

| Input | Expected |
|---|---|
| `"  Alice-2024  "` | `"alice-2024"` |
| `"JOHNDOE1"` | `"johndoe1"` |

---

## D — Retention Defaults

**D1 — `contact_requests.expires_at` defaults to 7 days out**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-exp1', 'x'), ('qa-exp2', 'x');
INSERT INTO contact_requests (sender_account_id, recipient_account_id)
VALUES (
  (SELECT id FROM accounts WHERE username='qa-exp1'),
  (SELECT id FROM accounts WHERE username='qa-exp2')
)
RETURNING expires_at, created_at, (expires_at - created_at) AS ttl;
```
Expected: `ttl` is `7 days`. Clean up:
```sql
DELETE FROM accounts WHERE username IN ('qa-exp1', 'qa-exp2');
```

**D2 — `public_ids_active.eligible_for_free_rotation_at` defaults to 7 days out**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-rot', 'x');
INSERT INTO public_ids_active (id, account_id)
VALUES ('qa-rot001', (SELECT id FROM accounts WHERE username='qa-rot'))
RETURNING created_at, eligible_for_free_rotation_at,
  (eligible_for_free_rotation_at - created_at) AS cooldown;
```
Expected: `cooldown` is `7 days`. Clean up:
```sql
DELETE FROM accounts WHERE username = 'qa-rot';
```

**D3 — `public_ids_history.release_at` defaults to 180 days out**
```sql
INSERT INTO accounts (username, password_hash) VALUES ('qa-hist', 'x');
INSERT INTO public_ids_history (id, account_id)
VALUES ('old-hist01', (SELECT id FROM accounts WHERE username='qa-hist'))
RETURNING deprecated_at, release_at, (release_at - deprecated_at) AS lockout;
```
Expected: `lockout` is `180 days`. Clean up:
```sql
DELETE FROM accounts WHERE username = 'qa-hist';
```

---

## E — Privacy Checks

**E1 — No plaintext content in `message_envelopes`**

Insert a test envelope with `ciphertext = '\xdeadbeef'`. Confirm the column type is `BYTEA` and the value is stored as opaque bytes, not a readable string:
```sql
SELECT pg_typeof(ciphertext) FROM message_envelopes LIMIT 1;
```
Expected: `bytea`.

**E2 — No literal values in migration SQL**
```bash
grep -rn "password\|email\|phone\|secret\|token" apps/server/db/migrations/
```
Expected: matches only appear as column *names* in DDL (`password_hash`, `token TEXT PRIMARY KEY`), never as literal values.

**E3 — `migrate.js` does not log SQL content**

Re-run `npm run migrate` and read terminal output. Confirm it only prints filenames (`apply 001_accounts.sql`), never the SQL body or any credential values.

---

## Done

All checks passing means Sprint 1 is verified. Next step is Sprint 2 (account registration + core auth). Note for Sprint 2: `sessions` requires a `device_id` FK — the registration flow must create an `accounts` row and a `devices` row atomically before inserting into `sessions`.
