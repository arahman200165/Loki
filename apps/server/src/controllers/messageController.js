import { findAccountIdByPublicId } from '../db/models/publicIdModel.js';
import { findByAccountId, findByDeviceId } from '../db/models/mailboxModel.js';
import { queueEnvelope, fetchUnacked, ackEnvelopes } from '../db/models/envelopeModel.js';

// 24 hours in seconds — minimum allowed TTL
const MIN_EXPIRES_IN = 86_400;
// 72 hours in seconds — maximum allowed TTL
const MAX_EXPIRES_IN = 259_200;

// Always the same response regardless of outcome — the sender learns nothing
// about whether the recipient exists, has devices, or is blocked.
const QUEUED = Object.freeze({ status: 'queued' });

// POST /api/v1/messages/send
// Queues an encrypted envelope into every mailbox belonging to the recipient.
// Anti-enumeration: returns 202 { status: 'queued' } for every valid request —
// unknown recipient, no devices, and successful delivery are all indistinguishable.
export const sendMessage = async (req, res) => {
  const { recipient_public_id, ciphertext, idempotency_key, expires_in_seconds } = req.body ?? {};

  // Validate all required fields are present and the right type
  if (
    typeof recipient_public_id !== 'string' || !recipient_public_id.trim() ||
    typeof ciphertext !== 'string'          || !ciphertext.trim()          ||
    typeof idempotency_key !== 'string'     || !idempotency_key.trim()     ||
    typeof expires_in_seconds !== 'number'
  ) {
    return res.status(400).json({ message: 'recipient_public_id, ciphertext, idempotency_key, and expires_in_seconds are required.' });
  }

  // Enforce the 24h–72h retention window
  if (expires_in_seconds < MIN_EXPIRES_IN || expires_in_seconds > MAX_EXPIRES_IN) {
    return res.status(400).json({ message: `expires_in_seconds must be between ${MIN_EXPIRES_IN} and ${MAX_EXPIRES_IN}.` });
  }

  try {
    const recipientAccountId = await findAccountIdByPublicId(
      recipient_public_id.trim().toLowerCase()
    );

    if (recipientAccountId) {
      // Get every mailbox belonging to this account (one per registered device)
      const mailboxes = await findByAccountId(recipientAccountId);

      // Calculate the exact expiry timestamp from the requested TTL
      const expiresAt = new Date(Date.now() + expires_in_seconds * 1000);

      // ciphertext arrives as a base64 string — convert to binary before storing
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

      // Drop a copy into each device mailbox
      for (const mailbox of mailboxes) {
        await queueEnvelope({
          mailboxId: mailbox.id,
          ciphertext: ciphertextBuffer,
          expiresAt,
          // Append mailbox ID to the key so the same message queued to
          // multiple devices each gets its own unique idempotency key
          idempotencyKey: `${idempotency_key}:${mailbox.id}`,
        });
      }
    }
  } catch {
    // Swallow — uniform response required (anti-enumeration)
  }

  return res.status(202).json(QUEUED);
};

// GET /api/v1/messages/fetch
// Returns all unacknowledged, non-expired envelopes waiting in this device's mailbox.
// The device calls this on launch and whenever a push wake-up signal arrives.
export const fetchMessages = async (req, res) => {
  const { deviceId } = req.session;

  // Find the mailbox that belongs to this specific device
  const mailbox = await findByDeviceId(deviceId);

  // No mailbox means this device was registered before 5.1 ran migrations —
  // return an empty list rather than a 404 so the app doesn't crash.
  if (!mailbox) {
    return res.status(200).json({ envelopes: [] });
  }

  const rows = await fetchUnacked(mailbox.id);

  // ciphertext is stored as binary (BYTEA) in Postgres — Node receives it as a Buffer.
  // JSON cannot carry raw binary, so we encode each one back to base64 for the wire.
  const envelopes = rows.map((row) => ({
    id: row.id,
    ciphertext: row.ciphertext.toString('base64'),
    queued_at: row.queued_at.toISOString(),
    expires_at: row.expires_at.toISOString(),
  }));

  return res.status(200).json({ envelopes });
};

// POST /api/v1/messages/ack
// Marks a batch of envelopes as acknowledged — the device has received and
// decrypted them. Scoped to the calling device's mailbox so a device can only
// ack its own messages, never someone else's.
export const ackMessages = async (req, res) => {
  const { ids } = req.body ?? {};
  const { deviceId } = req.session;

  // ids must be a non-empty array
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids must be a non-empty array of envelope UUIDs.' });
  }

  // Find this device's mailbox
  const mailbox = await findByDeviceId(deviceId);

  if (!mailbox) {
    return res.status(200).json({ acked: 0 });
  }

  // ackEnvelopes sets acked_at on each matched row, scoped to this mailbox.
  // It returns the count of rows actually updated.
  const acked = await ackEnvelopes(ids, mailbox.id);

  return res.status(200).json({ acked });
};
