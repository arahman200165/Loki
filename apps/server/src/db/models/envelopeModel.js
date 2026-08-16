import { query } from '../pool.js';

// Inserts one encrypted envelope into a mailbox.
// ciphertext is an opaque binary blob — the server never reads its contents.
// expiresAt enforces the 24–72h retention window: the TTL job and the fetch
// query both respect it so undelivered messages don't linger on the server.
// idempotencyKey prevents a network retry from inserting a duplicate message.
export const queueEnvelope = async (
  { mailboxId, ciphertext, expiresAt, idempotencyKey },
  client
) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  await run(
    `INSERT INTO message_envelopes
       (mailbox_id, ciphertext, expires_at, idempotency_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [mailboxId, ciphertext, expiresAt, idempotencyKey]
  );
};

// Returns up to `limit` unacknowledged, non-expired envelopes for a mailbox.
// Oldest first so the device processes messages in the order they were sent.
// The device calls this on launch and after receiving a push wake-up signal.
export const fetchUnacked = async (mailboxId, limit = 100, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `SELECT id, ciphertext, queued_at, expires_at
     FROM message_envelopes
     WHERE mailbox_id = $1
       AND acked_at IS NULL
       AND expires_at > now()
     ORDER BY queued_at ASC
     LIMIT $2`,
    [mailboxId, limit]
  );
  return result.rows;
};

// Marks a batch of envelopes as acknowledged — the device has received and
// decrypted them. Scoped to mailboxId so a caller can only ack their own
// envelopes, never someone else's. Returns the count of rows actually updated.
export const ackEnvelopes = async (ids, mailboxId, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `UPDATE message_envelopes
     SET acked_at = now()
     WHERE id = ANY($1::uuid[])
       AND mailbox_id = $2
       AND acked_at IS NULL`,
    [ids, mailboxId]
  );
  return result.rowCount ?? 0;
};

// Deletes all envelopes past their expires_at, whether acked or not.
// Called by the TTL cleanup job (task 5.4) on a recurring schedule.
// This is what enforces Loki's short-retention guarantee — messages do not
// persist on the server beyond their delivery window.
export const deleteExpired = async (client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `DELETE FROM message_envelopes WHERE expires_at < now()`
  );
  return result.rowCount ?? 0;
};
