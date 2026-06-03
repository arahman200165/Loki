// DB row shapes and API wire types for call sessions

export type CallState = 'ringing' | 'active' | 'ended' | 'declined' | 'missed';

export interface CallSessionRow {
  id: string;
  initiator_account_id: string;
  group_id: string | null; // null for 1:1 calls
  state: CallState;
  created_at: Date;
  ended_at: Date | null;
}

export interface CallParticipantRow {
  call_session_id: string;
  account_id: string;
  joined_at: Date | null;
  left_at: Date | null;
}

// POST /api/v1/calls/initiate
export interface InitiateCallRequest {
  recipient_public_id?: string; // set for 1:1 calls
  group_id?: string;            // set for group calls
}

export interface InitiateCallResponse {
  call_id: string;
  state: CallState;
}

// POST /api/v1/calls/:id/respond
export interface RespondCallRequest {
  accept: boolean;
}

export interface RespondCallResponse {
  call_id: string;
  state: CallState;
}

// GET /api/v1/calls/:id/state
export interface CallStateResponse {
  call_id: string;
  state: CallState;
  created_at: string; // ISO-8601
  ended_at: string | null;
}

// POST /api/v1/calls/:id/leave  (also terminate)
export interface LeaveCallResponse {
  status: 'ok';
}
