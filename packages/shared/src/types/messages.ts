// DB row shapes and API wire types for mailboxes and message envelopes

export interface MailboxRow {
  id: string;
  device_id: string;
}

export interface MessageEnvelopeRow {
  id: string;
  mailbox_id: string;
  ciphertext: Uint8Array;
  queued_at: Date;
  expires_at: Date;
  acked_at: Date | null;
  idempotency_key: string;
}

// POST /api/v1/messages/send
export interface SendMessageRequest {
  recipient_public_id: string;
  ciphertext: string;       // base64-encoded encrypted envelope
  idempotency_key: string;  // client-generated UUID, prevents duplicates on retry
  expires_in_seconds: number; // 86400–259200 (24h–72h)
}

export interface SendMessageResponse {
  status: 'queued';
}

// GET /api/v1/messages/fetch
export interface EnvelopeSummary {
  id: string;
  ciphertext: string;  // base64-encoded
  queued_at: string;   // ISO-8601
  expires_at: string;  // ISO-8601
}

export interface FetchMessagesResponse {
  envelopes: EnvelopeSummary[];
}

// POST /api/v1/messages/ack
export interface AckMessagesRequest {
  ids: string[];
}

export interface AckMessagesResponse {
  acked: number;
}
