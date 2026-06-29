import type { ContactRequestStatus } from './settings.js';

export interface ContactRequestSummary {
  id: string;
  sender_public_id: string;
  first_message: string | null; // plaintext for MVP; E2E encrypted in Sprint 6
  created_at: string;           // ISO-8601
  expires_at: string;           // ISO-8601
  status: ContactRequestStatus;
}

export interface SendContactRequestRequest {
  recipient_public_id: string;
  first_message?: string;       // plaintext, optional
  device_specific?: boolean;
}

// Always 202 { status: 'submitted' } per anti-enumeration rule
export interface SendContactRequestResponse {
  status: 'submitted';
}

export interface PendingContactRequestsResponse {
  requests: ContactRequestSummary[];
}

export interface RespondContactRequestRequest {
  request_id: string;
  action: 'accept' | 'deny';
}

export interface RespondContactRequestResponse {
  status: 'ok';
}

export interface BlockContactRequest {
  target_public_id: string;
  request_id?: string; // if present, also denies the pending request
}

export interface BlockContactResponse {
  status: 'ok';
}
