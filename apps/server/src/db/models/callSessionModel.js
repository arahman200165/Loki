import { query } from '../pool.js';

const run = (client) =>
  client ? (t, p) => client.query(t, p) : query;

// Sprint 8: call_sessions / call_participants / call_signals data access.
// State-transition logic (when a session flips ringing -> active/declined/etc.)
// lives in callSessionService.js — this file is pure reads/writes.

export const createCallSession = async (
  { initiatorAccountId, type, groupId },
  client
) => {
  const result = await run(client)(
    `INSERT INTO call_sessions (initiator_account_id, type, group_id)
     VALUES ($1, $2, $3)
     RETURNING id, initiator_account_id, group_id, type, state, created_at, ended_at`,
    [initiatorAccountId, type, groupId ?? null]
  );
  return result.rows[0];
};

// accountIds: array of { accountId, joinedImmediately }. The initiator is
// inserted already-joined; invitees start as invited (joined_at IS NULL).
export const addParticipants = async (callSessionId, participants, client) => {
  const db = run(client);
  for (const { accountId, joinedImmediately } of participants) {
    await db(
      `INSERT INTO call_participants (call_session_id, account_id, joined_at)
       VALUES ($1, $2, $3)`,
      [callSessionId, accountId, joinedImmediately ? new Date() : null]
    );
  }
};

export const getById = async (callSessionId, client) => {
  const result = await run(client)(
    `SELECT id, initiator_account_id, group_id, type, state, created_at, ended_at
     FROM call_sessions WHERE id = $1`,
    [callSessionId]
  );
  return result.rows[0] ?? null;
};

export const isParticipant = async (callSessionId, accountId, client) => {
  const result = await run(client)(
    `SELECT 1 FROM call_participants WHERE call_session_id = $1 AND account_id = $2 LIMIT 1`,
    [callSessionId, accountId]
  );
  return (result.rowCount ?? 0) > 0;
};

// Raw check against group_members (migration 004) — Sprint 7's groupModel.js
// doesn't exist yet, so this is a minimal read used only to gate group-id-based
// call initiation. Ad-hoc calls (recipient_public_ids) don't touch this table.
export const isGroupMember = async (groupId, accountId, client) => {
  const result = await run(client)(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND account_id = $2 LIMIT 1`,
    [groupId, accountId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const getParticipantsWithPublicId = async (callSessionId, client) => {
  const result = await run(client)(
    `SELECT cp.account_id, cp.joined_at, cp.left_at, pia.id AS public_id
     FROM call_participants cp
     JOIN public_ids_active pia ON pia.account_id = cp.account_id
     WHERE cp.call_session_id = $1
     ORDER BY cp.joined_at NULLS LAST`,
    [callSessionId]
  );
  return result.rows;
};

export const updateState = async (callSessionId, state, { ended } = {}, client) => {
  await run(client)(
    `UPDATE call_sessions
     SET state = $1, ended_at = CASE WHEN $2 THEN now() ELSE ended_at END
     WHERE id = $3`,
    [state, Boolean(ended), callSessionId]
  );
};

export const recordJoin = async (callSessionId, accountId, client) => {
  const result = await run(client)(
    `UPDATE call_participants SET joined_at = now()
     WHERE call_session_id = $1 AND account_id = $2 AND joined_at IS NULL
     RETURNING account_id`,
    [callSessionId, accountId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const endAllParticipants = async (callSessionId, client) => {
  await run(client)(
    `UPDATE call_participants SET left_at = now()
     WHERE call_session_id = $1 AND left_at IS NULL`,
    [callSessionId]
  );
};

export const recordLeave = async (callSessionId, accountId, client) => {
  const result = await run(client)(
    `UPDATE call_participants SET left_at = now()
     WHERE call_session_id = $1 AND account_id = $2 AND left_at IS NULL
     RETURNING joined_at`,
    [callSessionId, accountId]
  );
  return result.rows[0] ?? null; // null = already left / not a participant
};

// Counts for state-machine decisions in callSessionService.js.
export const getParticipantCounts = async (callSessionId, client) => {
  const result = await run(client)(
    `SELECT
       count(*) FILTER (WHERE joined_at IS NOT NULL AND left_at IS NULL) AS active_count,
       count(*) FILTER (WHERE joined_at IS NULL AND left_at IS NULL) AS still_ringing_count,
       count(*) FILTER (WHERE joined_at IS NOT NULL) AS ever_joined_count,
       count(*) AS total_count
     FROM call_participants WHERE call_session_id = $1`,
    [callSessionId]
  );
  const row = result.rows[0];
  return {
    activeCount: Number(row.active_count),
    stillRingingCount: Number(row.still_ringing_count),
    everJoinedCount: Number(row.ever_joined_count),
    totalCount: Number(row.total_count),
  };
};

// Ringing sessions (this call has timed out on its own if stale — see
// callSessionService's applyRingingTimeout) where accountId is still invited.
export const findPendingForAccount = async (accountId, client) => {
  const result = await run(client)(
    `SELECT cs.id AS call_id, cs.type, cs.created_at, pia.id AS initiator_public_id
     FROM call_sessions cs
     JOIN call_participants cp ON cp.call_session_id = cs.id
     JOIN public_ids_active pia ON pia.account_id = cs.initiator_account_id
     WHERE cp.account_id = $1
       AND cp.joined_at IS NULL
       AND cp.left_at IS NULL
       AND cs.state = 'ringing'
     ORDER BY cs.created_at DESC`,
    [accountId]
  );
  return result.rows;
};

export const listRingingSessionIds = async (client) => {
  const result = await run(client)(
    `SELECT id FROM call_sessions WHERE state = 'ringing'`
  );
  return result.rows.map((row) => row.id);
};

export const insertSignal = async (
  { callSessionId, fromAccountId, toAccountId, type, payload },
  client
) => {
  await run(client)(
    `INSERT INTO call_signals (call_session_id, from_account_id, to_account_id, type, payload)
     VALUES ($1, $2, $3, $4, $5)`,
    [callSessionId, fromAccountId, toAccountId, type, payload]
  );
};

// ICE-candidate payloads reveal both participants' network addresses — more
// sensitive than call_sessions' bare lifecycle metadata. call_sessions rows
// are kept indefinitely for now (retention cleanup job is still "TBD" per
// the architecture doc's own retention table), but signaling payloads have
// zero purpose once a call ends, so they're purged immediately on any
// terminal transition rather than waiting on that future job.
export const deleteSignalsForCall = async (callSessionId, client) => {
  await run(client)(`DELETE FROM call_signals WHERE call_session_id = $1`, [callSessionId]);
};

export const listSignalsForRecipient = async (
  { callSessionId, toAccountId, since },
  client
) => {
  const result = await run(client)(
    `SELECT s.id, s.type, s.payload, s.created_at, pia.id AS from_public_id
     FROM call_signals s
     JOIN public_ids_active pia ON pia.account_id = s.from_account_id
     WHERE s.call_session_id = $1
       AND s.to_account_id = $2
       AND ($3::timestamptz IS NULL OR s.created_at > $3)
     ORDER BY s.created_at ASC
     LIMIT 200`,
    [callSessionId, toAccountId, since ?? null]
  );
  return result.rows;
};
