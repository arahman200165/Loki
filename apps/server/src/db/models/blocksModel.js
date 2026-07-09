import { query } from '../pool.js';

const run = (client) =>
  client ? (t, p) => client.query(t, p) : query;

// True if blockerAccountId has blocked blockedAccountId.
export const isBlocked = async (blockerAccountId, blockedAccountId, client) => {
  const result = await run(client)(
    `SELECT 1 FROM blocks WHERE blocker_account_id = $1 AND blocked_account_id = $2 LIMIT 1`,
    [blockerAccountId, blockedAccountId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const createBlock = async (blockerAccountId, blockedAccountId, client) => {
  await run(client)(
    `INSERT INTO blocks (blocker_account_id, blocked_account_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [blockerAccountId, blockedAccountId]
  );
};
