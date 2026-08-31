import {
  getById,
  updateState,
  recordJoin,
  recordLeave,
  endAllParticipants,
  getParticipantCounts,
  deleteSignalsForCall,
} from '../db/models/callSessionModel.js';

// Ringing -> Failed/timeout per architecture §6.3. In practice this settles as
// "missed" (nobody answered) — a technical "failed" is reserved for the
// client-reported reason on POST /calls/:id/leave (see handleLeave).
const RING_TIMEOUT_MS = 45_000;

// Call before any state-dependent read/write on a session. If it's been
// ringing longer than the timeout with no resolution, lazily flips it to
// 'missed' in this same request — there's no background job for this yet.
export const applyRingingTimeout = async (callSessionId) => {
  const session = await getById(callSessionId);
  if (!session) return null;
  if (session.state !== 'ringing') return session;

  const ageMs = Date.now() - new Date(session.created_at).getTime();
  if (ageMs < RING_TIMEOUT_MS) return session;

  await updateState(callSessionId, 'missed', { ended: true });
  await deleteSignalsForCall(callSessionId);
  return { ...session, state: 'missed', ended_at: new Date() };
};

// Returns the session's new state after a participant accepts or declines.
export const handleRespond = async (callSessionId, accountId, accept) => {
  const session = await applyRingingTimeout(callSessionId);
  if (!session) return null;
  if (!['ringing', 'active'].includes(session.state)) return session;

  if (accept) {
    const newlyJoined = await recordJoin(callSessionId, accountId);
    if (newlyJoined && session.state === 'ringing') {
      await updateState(callSessionId, 'active');
      return { ...session, state: 'active' };
    }
    return session;
  }

  await recordLeave(callSessionId, accountId);

  if (session.state === 'ringing') {
    const counts = await getParticipantCounts(callSessionId);
    // everJoinedCount includes the initiator (always joined-at-creation), so
    // <= 1 means no invitee has ever joined — if none are still ringing
    // either, every invitee has now explicitly declined.
    if (counts.stillRingingCount === 0 && counts.everJoinedCount <= 1) {
      await updateState(callSessionId, 'declined', { ended: true });
      await deleteSignalsForCall(callSessionId);
      return { ...session, state: 'declined' };
    }
  }

  return session;
};

// Returns the session's new state after a participant leaves.
export const handleLeave = async (callSessionId, accountId, reason) => {
  const session = await getById(callSessionId);
  if (!session) return null;
  if (['ended', 'declined', 'missed', 'failed'].includes(session.state)) return session;

  await recordLeave(callSessionId, accountId);
  const counts = await getParticipantCounts(callSessionId);

  if (counts.activeCount > 0) return session; // others remain (group call)

  const neverConnected = counts.everJoinedCount <= 1; // only the initiator ever joined
  const finalState = reason === 'failed' && neverConnected ? 'failed' : 'ended';
  await updateState(callSessionId, finalState, { ended: true });
  await deleteSignalsForCall(callSessionId);
  return { ...session, state: finalState };
};

// Initiator-only: ends the call for every participant immediately.
export const handleTerminate = async (callSessionId) => {
  await endAllParticipants(callSessionId);
  await updateState(callSessionId, 'ended', { ended: true });
  await deleteSignalsForCall(callSessionId);
};
