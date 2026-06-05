import { query } from '../pool.js';

export const createDeviceForAccount = async ({ accountId, label = '' }, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `INSERT INTO devices (account_id, public_key, label)
     VALUES ($1, NULL, $2)
     RETURNING id, account_id, label, registered_at`,
    [accountId, label]
  );
  return result.rows[0];
};

export const findLatestActiveDeviceForAccount = async (accountId, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `SELECT id, account_id, label, registered_at
     FROM devices
     WHERE account_id = $1
       AND revoked_at IS NULL
     ORDER BY registered_at DESC
     LIMIT 1`,
    [accountId]
  );
  return result.rows[0] ?? null;
};
