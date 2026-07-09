import { query } from '../pool.js';

const run = (client) =>
  client ? (t, p) => client.query(t, p) : query;

// Insert a pending contact request. firstMessage (plaintext string or null/undefined)
// is stored as first_message_envelope via a UTF-8 byte buffer — plaintext for MVP,
// E2E encrypted once Sprint 6 lands (see packages/shared/src/types/contacts.ts).
export const createContactRequest = async (
  { senderAccountId, recipientAccountId, firstMessage },
  client
) => {
  const envelope =
    typeof firstMessage === 'string' && firstMessage.length > 0
      ? Buffer.from(firstMessage, 'utf8')
      : null;

  await run(client)(
    `INSERT INTO contact_requests (sender_account_id, recipient_account_id, first_message_envelope)
     VALUES ($1, $2, $3)`,
    [senderAccountId, recipientAccountId, envelope]
  );
};

// Pending requests addressed to recipientAccountId, with sender's active Public-ID joined in.
// Excludes anything past its TTL even if the expiry job hasn't flipped its status yet.
export const listPendingForRecipient = async (recipientAccountId, client) => {
  const result = await run(client)(
    `SELECT cr.id, cr.first_message_envelope, cr.created_at, cr.expires_at, cr.status,
            pia.id AS sender_public_id
     FROM contact_requests cr
     JOIN public_ids_active pia ON pia.account_id = cr.sender_account_id
     WHERE cr.recipient_account_id = $1
       AND cr.status = 'pending'
       AND cr.expires_at > now()
     ORDER BY cr.created_at DESC`,
    [recipientAccountId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    sender_public_id: row.sender_public_id,
    first_message: row.first_message_envelope
      ? row.first_message_envelope.toString('utf8')
      : null,
    created_at: row.created_at.toISOString(),
    expires_at: row.expires_at.toISOString(),
    status: row.status,
  }));
};

// Flips a pending request to accepted/denied. Only affects a row owned by recipientAccountId
// that is still pending. Returns whether a row was actually updated — callers are not required
// to branch on this (respond always returns a uniform success response either way).
export const respondToRequest = async (
  { requestId, recipientAccountId, action },
  client
) => {
  const newStatus = action === 'accept' ? 'accepted' : 'denied';

  const result = await run(client)(
    `UPDATE contact_requests
     SET status = $1
     WHERE id = $2 AND recipient_account_id = $3 AND status = 'pending'`,
    [newStatus, requestId, recipientAccountId]
  );

  return (result.rowCount ?? 0) > 0;
};

// Marks stale pending requests as expired. Exported now per task 4.1; scheduling this
// on a recurring job is task 14.1.
export const expireStalePending = async (client) => {
  const result = await run(client)(
    `UPDATE contact_requests SET status = 'expired'
     WHERE expires_at < now() AND status = 'pending'`
  );
  return result.rowCount ?? 0;
};
