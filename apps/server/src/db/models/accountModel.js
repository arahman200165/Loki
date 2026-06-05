import { query } from '../pool.js';

export const createAccount = async ({ username, passwordHash }, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `INSERT INTO accounts (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username, created_at`,
    [username, passwordHash]
  );
  return result.rows[0];
};

export const findAccountByUsername = async (username, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `SELECT id, username, password_hash, created_at, deleted_at
     FROM accounts
     WHERE username = $1`,
    [username]
  );
  return result.rows[0] ?? null;
};

export const accountExists = async (username, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    'SELECT 1 FROM accounts WHERE username = $1',
    [username]
  );
  return result.rowCount > 0;
};
