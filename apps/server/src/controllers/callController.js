import { getClient } from '../db/pool.js';
import { findAccountIdByPublicId } from '../db/models/publicIdModel.js';
import { isValidPublicId } from './publicIdController.js';
import { isAcceptedContact } from '../db/models/contactRequestModel.js';
import {
  createCallSession,
  addParticipants,
  getById,
  isParticipant,
  isGroupMember,
  getParticipantsWithPublicId,
  findPendingForAccount,
  insertSignal,
  listSignalsForRecipient,
} from '../db/models/callSessionModel.js';
import {
  applyRingingTimeout,
  handleRespond,
  handleLeave,
  handleTerminate,
} from '../services/callSessionService.js';
import { getIceServers } from '../services/turnCredentialsService.js';

// Independent of the 25-person messaging group cap (ADR-014) — this bounds a
// pure P2P mesh, where every device uploads N-1 simultaneous streams (ADR-007).
const MAX_CALL_PARTICIPANTS = 8;

const validationFailed = (res, fields, invalid) =>
  res.status(400).json({ error: 'validation_failed', fields, ...(invalid ? { invalid } : {}) });

// Resolves an accepted-contact recipient by Public-ID. Returns the account id,
// or null if the format is invalid, the ID is unknown, or they aren't an
// accepted contact of initiatorAccountId. Calls happen only between
// established contacts, so (unlike contact-request/send) there's no
// anti-enumeration requirement here.
const resolveAcceptedRecipient = async (publicIdRaw, initiatorAccountId) => {
  const publicId = typeof publicIdRaw === 'string' ? publicIdRaw.trim().toLowerCase() : '';
  if (!isValidPublicId(publicId)) return null;

  const accountId = await findAccountIdByPublicId(publicId);
  if (!accountId || accountId === initiatorAccountId) return null;

  const accepted = await isAcceptedContact(initiatorAccountId, accountId);
  return accepted ? accountId : null;
};

// POST /api/v1/calls/initiate
export const initiateCall = async (req, res) => {
  const { type, recipient_public_id: recipientPublicId, recipient_public_ids: recipientPublicIds, group_id: groupId } =
    req.body ?? {};
  const initiatorAccountId = req.auth.accountId;

  if (type !== 'audio' && type !== 'video') {
    return validationFailed(res, ['type']);
  }

  let recipientAccountIds = [];

  if (groupId) {
    if (typeof groupId !== 'string' || !(await isGroupMember(groupId, initiatorAccountId))) {
      return validationFailed(res, ['group_id']);
    }
    return res.status(400).json({
      error: 'validation_failed',
      fields: ['group_id'],
      message: 'Calling by group_id requires Sprint 7 group membership data and is not yet supported.',
    });
  } else if (Array.isArray(recipientPublicIds)) {
    if (recipientPublicIds.length < 1 || recipientPublicIds.length > MAX_CALL_PARTICIPANTS - 1) {
      return validationFailed(res, ['recipient_public_ids']);
    }
    const resolved = await Promise.all(
      recipientPublicIds.map((id) => resolveAcceptedRecipient(id, initiatorAccountId))
    );
    const invalidIndexes = resolved
      .map((accountId, index) => (accountId ? null : index))
      .filter((index) => index !== null);
    if (invalidIndexes.length > 0) {
      return validationFailed(
        res,
        ['recipient_public_ids'],
        invalidIndexes.map((index) => recipientPublicIds[index])
      );
    }
    recipientAccountIds = [...new Set(resolved)];
  } else if (typeof recipientPublicId === 'string') {
    const accountId = await resolveAcceptedRecipient(recipientPublicId, initiatorAccountId);
    if (!accountId) return validationFailed(res, ['recipient_public_id']);
    recipientAccountIds = [accountId];
  } else {
    return validationFailed(res, ['recipient_public_id']);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const session = await createCallSession({ initiatorAccountId, type, groupId: null }, client);
    await addParticipants(
      session.id,
      [
        { accountId: initiatorAccountId, joinedImmediately: true },
        ...recipientAccountIds.map((accountId) => ({ accountId, joinedImmediately: false })),
      ],
      client
    );
    await client.query('COMMIT');
    return res.status(201).json({ call_id: session.id, type: session.type, state: session.state });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// POST /api/v1/calls/:id/respond
export const respondToCall = async (req, res) => {
  const callId = req.params.id;
  const accountId = req.auth.accountId;
  const { accept } = req.body ?? {};

  if (typeof accept !== 'boolean') return validationFailed(res, ['accept']);
  if (!(await isParticipant(callId, accountId))) return res.status(404).json({ error: 'not_found' });

  const session = await handleRespond(callId, accountId, accept);
  if (!session) return res.status(404).json({ error: 'not_found' });

  return res.status(200).json({ call_id: callId, state: session.state });
};

// POST /api/v1/calls/:id/leave
export const leaveCall = async (req, res) => {
  const callId = req.params.id;
  const accountId = req.auth.accountId;
  const { reason } = req.body ?? {};

  if (!(await isParticipant(callId, accountId))) return res.status(404).json({ error: 'not_found' });

  await handleLeave(callId, accountId, reason === 'failed' ? 'failed' : undefined);
  return res.status(200).json({ status: 'ok' });
};

// POST /api/v1/calls/:id/terminate — initiator only, ends the call for everyone.
export const terminateCall = async (req, res) => {
  const callId = req.params.id;
  const session = await getById(callId);
  if (!session) return res.status(404).json({ error: 'not_found' });
  if (session.initiator_account_id !== req.auth.accountId) {
    return res.status(403).json({ error: 'forbidden' });
  }

  await handleTerminate(callId);
  return res.status(200).json({ status: 'ok' });
};

// GET /api/v1/calls/:id/state
export const getCallState = async (req, res) => {
  const callId = req.params.id;
  const accountId = req.auth.accountId;

  if (!(await isParticipant(callId, accountId))) return res.status(404).json({ error: 'not_found' });

  const session = await applyRingingTimeout(callId);
  if (!session) return res.status(404).json({ error: 'not_found' });

  const participants = await getParticipantsWithPublicId(callId);
  const initiator = participants.find((p) => p.account_id === session.initiator_account_id);

  return res.status(200).json({
    call_id: callId,
    type: session.type,
    state: session.state,
    initiator_public_id: initiator?.public_id ?? null,
    created_at: new Date(session.created_at).toISOString(),
    ended_at: session.ended_at ? new Date(session.ended_at).toISOString() : null,
    participants: participants.map((p) => ({
      public_id: p.public_id,
      status: p.left_at ? 'left' : p.joined_at ? 'joined' : 'invited',
    })),
  });
};

// GET /api/v1/calls/turn-credentials
// Proxies Metered.ca (ADR-007) so the mobile client never holds the TURN
// provider's API key — only the short-lived ICE server list it returns.
export const getTurnCredentials = async (req, res) => {
  const iceServers = await getIceServers();
  return res.status(200).json({ ice_servers: iceServers });
};

// GET /api/v1/calls/pending
// Lets a device that just received a content-free wake-up push (ADR-013)
// discover which call is ringing for it, without the push payload ever
// naming a call id or caller.
export const listPendingCalls = async (req, res) => {
  const accountId = req.auth.accountId;
  const pending = await findPendingForAccount(accountId);

  // findPendingForAccount is a raw read — apply the lazy ringing-timeout to
  // each candidate so a call nobody ever polled /state for doesn't show up
  // as "pending" forever.
  const stillPending = [];
  for (const row of pending) {
    const session = await applyRingingTimeout(row.call_id);
    if (session?.state === 'ringing') stillPending.push(row);
  }

  return res.status(200).json({
    calls: stillPending.map((row) => ({
      call_id: row.call_id,
      type: row.type,
      initiator_public_id: row.initiator_public_id,
      created_at: new Date(row.created_at).toISOString(),
    })),
  });
};

// POST /api/v1/calls/:id/signal
// Opaque SDP/ICE relay — ADR-028 forbids WebSockets, so offer/answer/ICE
// exchange rides over polled HTTP instead. The server never interprets
// `payload`; it only routes it to the right participant.
export const postCallSignal = async (req, res) => {
  const callId = req.params.id;
  const fromAccountId = req.auth.accountId;
  const { type, payload, to_public_id: toPublicId } = req.body ?? {};

  if (!['offer', 'answer', 'ice-candidate'].includes(type) || typeof payload !== 'string') {
    return validationFailed(res, ['type', 'payload']);
  }
  if (!(await isParticipant(callId, fromAccountId))) return res.status(404).json({ error: 'not_found' });

  const session = await getById(callId);
  if (!session || !['ringing', 'active'].includes(session.state)) {
    return res.status(409).json({ error: 'call_not_active' });
  }

  const participants = await getParticipantsWithPublicId(callId);
  let toAccountId;

  if (toPublicId) {
    const target = participants.find((p) => p.public_id === toPublicId);
    if (!target) return validationFailed(res, ['to_public_id']);
    toAccountId = target.account_id;
  } else {
    const others = participants.filter((p) => p.account_id !== fromAccountId);
    if (others.length !== 1) return validationFailed(res, ['to_public_id']);
    toAccountId = others[0].account_id;
  }

  await insertSignal({ callSessionId: callId, fromAccountId, toAccountId, type, payload });
  return res.status(202).json({ status: 'ok' });
};

// GET /api/v1/calls/:id/signal?since=<ISO-8601>
export const getCallSignal = async (req, res) => {
  const callId = req.params.id;
  const accountId = req.auth.accountId;
  const since = typeof req.query.since === 'string' ? req.query.since : null;

  if (!(await isParticipant(callId, accountId))) return res.status(404).json({ error: 'not_found' });

  const signals = await listSignalsForRecipient({ callSessionId: callId, toAccountId: accountId, since });
  return res.status(200).json({
    signals: signals.map((row) => ({
      id: row.id,
      from_public_id: row.from_public_id,
      type: row.type,
      payload: row.payload,
      created_at: new Date(row.created_at).toISOString(),
    })),
  });
};
