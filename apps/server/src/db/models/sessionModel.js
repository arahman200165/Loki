import { query } from '../pool.js';

export const createSessionRow = async ({ token, accountId, deviceId }, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `INSERT INTO sessions (token, account_id, device_id)
     VALUES ($1, $2, $3)
     RETURNING token, account_id, device_id, issued_at`,
    [token, accountId, deviceId]
  );
  return result.rows[0];
};

export const findSessionWithAccountAndDevice = async (token, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `SELECT
       s.token,
       s.issued_at,
       a.id        AS account_id,
       a.username,
       a.deleted_at AS account_deleted_at,
       d.id        AS device_id,
       d.label     AS device_label,
       d.revoked_at AS device_revoked_at
     FROM sessions s
     JOIN accounts a ON a.id = s.account_id
     JOIN devices  d ON d.id = s.device_id
     WHERE s.token = $1`,
    [token]
  );
  return result.rows[0] ?? null;
};

export const deleteSessionRow = async (token, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    'DELETE FROM sessions WHERE token = $1',
    [token]
  );
  return result.rowCount > 0;
};
