import { query } from '../pool.js';

// Returns { response_status, response_body } for a non-expired key, or null.
export const findByKey = async (key) => {
  const result = await query(
    `SELECT response_status, response_body FROM idempotency_keys
     WHERE key = $1 AND expires_at > now()`,
    [key]
  );
  return result.rows[0] ?? null;
};

export const save = async (key, status, bodyBuffer) => {
  await query(
    `INSERT INTO idempotency_keys (key, response_status, response_body)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO NOTHING`,
    [key, status, bodyBuffer]
  );
};
