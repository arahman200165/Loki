import nacl from 'tweetnacl';
import { getDb } from './schema';
import { toBase64, fromBase64 } from '../crypto/deviceKeys';
import { getOrCreateStorageKey } from '../crypto/keyManager';

// The shape of a message as the rest of the app sees it — plaintext, readable.
export interface Message {
  id: string;
  contactPublicId: string;
  envelopeId: string | null;
  text: string;
  sentByMe: boolean;
  timestamp: string;
  expiresAt: string | null;
}

// ─── Encryption helpers ───────────────────────────────────────────────────────

// Encrypts a plaintext string using the local storage key.
// Returns a single Uint8Array that is: [ nonce (24 bytes) | ciphertext ]
// The nonce is random per message and stored alongside the ciphertext so
// we can decrypt later without storing it separately.
const encrypt = async (plaintext: string): Promise<Uint8Array> => {
  const key = await getOrCreateStorageKey();
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength); // 24 random bytes
  const messageBytes = new TextEncoder().encode(plaintext);
  const box = nacl.secretbox(messageBytes, nonce, key);

  // Concatenate: nonce first, then the encrypted content
  const combined = new Uint8Array(nonce.length + box.length);
  combined.set(nonce, 0);
  combined.set(box, nonce.length);
  return combined;
};

// Decrypts a stored Uint8Array back to a plaintext string.
// Splits off the first 24 bytes as the nonce, the rest as the box.
const decrypt = async (combined: Uint8Array): Promise<string | null> => {
  const key = await getOrCreateStorageKey();
  const nonce = combined.slice(0, nacl.secretbox.nonceLength);
  const box   = combined.slice(nacl.secretbox.nonceLength);
  const decrypted = nacl.secretbox.open(box, nonce, key);
  if (!decrypted) return null; // key mismatch or corrupted data
  return new TextDecoder().decode(decrypted);
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// Saves a message to the local database, encrypting the text first.
// If a message with the same envelopeId already exists, it is silently ignored
// (the UNIQUE constraint on envelope_id handles this automatically).
export const saveMessage = async (message: Message): Promise<void> => {
  const db = await getDb();
  const ciphertext = await encrypt(message.text);

  await db.runAsync(
    `INSERT OR IGNORE INTO messages
       (id, contact_public_id, envelope_id, ciphertext, sent_by_me, timestamp, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.contactPublicId,
      message.envelopeId,
      // Store as base64 string — expo-sqlite BLOB support varies by platform
      toBase64(ciphertext),
      message.sentByMe ? 1 : 0,
      message.timestamp,
      message.expiresAt ?? null,
    ]
  );
};

// Loads all messages for a given conversation, decrypted, oldest first.
// Returns up to `limit` messages (defaults to 100 — enough for a full screen).
export const getMessagesForContact = async (
  contactPublicId: string,
  limit = 100
): Promise<Message[]> => {
  const db = await getDb();

  const rows = await db.getAllAsync<{
    id: string;
    contact_public_id: string;
    envelope_id: string | null;
    ciphertext: string;
    sent_by_me: number;
    timestamp: string;
    expires_at: string | null;
  }>(
    `SELECT * FROM messages
     WHERE contact_public_id = ?
     ORDER BY timestamp ASC
     LIMIT ?`,
    [contactPublicId, limit]
  );

  const messages: Message[] = [];

  for (const row of rows) {
    const text = await decrypt(fromBase64(row.ciphertext));
    if (text === null) continue; // skip any row that fails to decrypt

    messages.push({
      id: row.id,
      contactPublicId: row.contact_public_id,
      envelopeId: row.envelope_id,
      text,
      sentByMe: row.sent_by_me === 1,
      timestamp: row.timestamp,
      expiresAt: row.expires_at,
    });
  }

  return messages;
};

// Returns true if an envelope has already been saved — used to skip duplicates
// when processing a fresh fetch from the server.
export const envelopeAlreadyReceived = async (envelopeId: string): Promise<boolean> => {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM messages WHERE envelope_id = ? LIMIT 1`,
    [envelopeId]
  );
  return row !== null;
};

// Deletes all messages whose expires_at has passed.
// Called on app launch and periodically to enforce Loki's short-retention promise.
export const deleteExpiredMessages = async (): Promise<number> => {
  const db = await getDb();
  const result = await db.runAsync(
    `DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at < ?`,
    [new Date().toISOString()]
  );
  return result.changes;
};
