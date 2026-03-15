import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

let pool = null;

const createPool = () => {
  const connectionString = env.databaseUrl;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const nextPool = new Pool({
    connectionString,
    max: env.databasePoolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: env.databaseSsl
      ? { rejectUnauthorized: env.databaseSslRejectUnauthorized }
      : false
  });

  nextPool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
  });

  return nextPool;
};

export const getPool = () => {
  if (!pool) {
    pool = createPool();
  }

  return pool;
};

export const query = (text, params = []) => getPool().query(text, params);

export const checkDatabaseConnection = async () => {
  const startedAt = Date.now();
  const result = await query(
    'SELECT current_database() AS database_name, now() AS server_time'
  );

  return {
    status: 'ok',
    latencyMs: Date.now() - startedAt,
    databaseName: result.rows[0]?.database_name,
    serverTime: result.rows[0]?.server_time
  };
};

export const closePool = async () => {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
};
