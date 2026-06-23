import { query } from '../pool.js';

const run = (client) =>
  client ? (t, p) => client.query(t, p) : query;

// True if id is claimed (active) or locked in history (within 180-day window)
export const publicIdExists = async (id, client) => {
  const result = await run(client)(
    `SELECT 1 FROM public_ids_active WHERE id = $1
     UNION ALL
     SELECT 1 FROM public_ids_history WHERE id = $1 AND release_at > now()
     LIMIT 1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
};

// Insert a new active Public-ID for an account.
// Throws on duplicate account_id (unique constraint) — caller must check first.
export const claimPublicId = async (accountId, id, client) => {
  await run(client)(
    `INSERT INTO public_ids_active (id, account_id) VALUES ($1, $2)`,
    [id, accountId]
  );
};

export const findActiveByAccountId = async (accountId, client) => {
  const result = await run(client)(
    `SELECT id, account_id, created_at, eligible_for_free_rotation_at
     FROM public_ids_active WHERE account_id = $1`,
    [accountId]
  );
  return result.rows[0] ?? null;
};

// Atomically move old ID to history and insert new active ID.
// Must be called inside a transaction (pass client).
// Returns false if account has no active ID.
export const rotatePublicId = async (accountId, newId, client) => {
  const db = run(client);

  const deleted = await db(
    `DELETE FROM public_ids_active WHERE account_id = $1 RETURNING id`,
    [accountId]
  );
  if ((deleted.rowCount ?? 0) === 0) return false;

  const oldId = deleted.rows[0].id;

  await db(
    `INSERT INTO public_ids_history (id, account_id) VALUES ($1, $2)`,
    [oldId, accountId]
  );

  await db(
    `INSERT INTO public_ids_active (id, account_id) VALUES ($1, $2)`,
    [newId, accountId]
  );

  return true;
};
