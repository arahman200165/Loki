// DB row shapes and API wire types for call sessions (Sprint 8)

export type CallType = 'audio' | 'video';

// 'created' from the architecture doc's illustrative state diagram is not a
// real DB state — a session is created directly into 'ringing'. 'connecting'
// is derived client-side from RTCPeerConnection state and never persisted.
export type CallState = 'ringing' | 'active' | 'ended' | 'declined' | 'missed' | 'failed';

export type CallParticipantStatus = 'invited' | 'joined' | 'left';

export interface CallSessionRow {
  id: string;
  initiator_account_id: string;
  group_id: string | null; // null for 1:1 and MVP ad-hoc group calls
  type: CallType;
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

export interface CallParticipantSummary {
  public_id: string;
  status: CallParticipantStatus;
}

// POST /api/v1/calls/initiate
export interface InitiateCallRequest {
  type: CallType;
  recipient_public_id?: string; // 1:1 call
  recipient_public_ids?: string[]; // MVP ad-hoc group call — no persistent group required
  group_id?: string; // call attached to an existing group thread (usable once Sprint 7 ships)
}

export interface InitiateCallResponse {
  call_id: string;
  type: CallType;
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

// POST /api/v1/calls/:id/leave
export interface LeaveCallRequest {
  reason?: 'failed'; // client-detected setup failure (e.g. ICE failure) before the call connected
}

// POST /api/v1/calls/:id/leave, POST /api/v1/calls/:id/terminate
export interface LeaveCallResponse {
  status: 'ok';
}

// GET /api/v1/calls/:id/state
export interface CallStateResponse {
  call_id: string;
  type: CallType;
  state: CallState;
  initiator_public_id: string;
  created_at: string; // ISO-8601
  ended_at: string | null;
  participants: CallParticipantSummary[];
}

// GET /api/v1/calls/pending
export interface PendingCallSummary {
  call_id: string;
  type: CallType;
  initiator_public_id: string;
  created_at: string;
}

export interface PendingCallsResponse {
  calls: PendingCallSummary[];
}

// GET /api/v1/calls/turn-credentials
export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface TurnCredentialsResponse {
  ice_servers: IceServer[];
}

// Signaling relay (ADR-028 workaround — HTTP-polled SDP/ICE exchange, not WebSockets)
export type CallSignalType = 'offer' | 'answer' | 'ice-candidate';

// POST /api/v1/calls/:id/signal
export interface PostCallSignalRequest {
  type: CallSignalType;
  payload: string; // opaque SDP or ICE-candidate JSON string; server never parses it
  to_public_id?: string; // required when the call has more than 2 participants
}

export interface PostCallSignalResponse {
  status: 'ok';
}

// GET /api/v1/calls/:id/signal?since=<ISO-8601>
export interface CallSignalMessage {
  id: string;
  from_public_id: string;
  type: CallSignalType;
  payload: string;
  created_at: string;
}

export interface GetCallSignalResponse {
  signals: CallSignalMessage[];
}
