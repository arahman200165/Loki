import crypto from 'crypto';
import { query } from '../db/pool.js';

const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const DEFAULT_WEB_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token ?? '', 'utf8').digest('hex');

const toIsoAfter = (milliseconds) => new Date(Date.now() + milliseconds).toISOString();
const uuid = () => crypto.randomUUID();

// Browser/web admin session helpers (Postgres)
export const createSession = async ({ username, ttlMs = DEFAULT_WEB_SESSION_TTL_MS }) => {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(token);
  const sessionId = uuid();
  const expiresAt = toIsoAfter(ttlMs);

  await query(
    `
      insert into web_sessions (id, username, session_token_hash, expires_at)
      values ($1, $2, $3, $4)
    `,
    [sessionId, username, tokenHash, expiresAt]
  );

  return {
    id: sessionId,
    token,
    tokenHash,
    username,
    createdAt: new Date().toISOString(),
    expiresAt
  };
};

export const getSession = async (token) => {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const result = await query(
    `
      select id, username, expires_at, revoked_at, created_at
      from web_sessions
      where session_token_hash = $1
        and revoked_at is null
        and expires_at > now()
      order by created_at desc
      limit 1
    `,
    [tokenHash]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  await query('update web_sessions set last_seen_at = now() where id = $1', [row.id]);

  return {
    id: row.id,
    token,
    tokenHash,
    username: row.username,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at
  };
};

export const deleteSession = async (token) => {
  if (!token) {
    return false;
  }

  const tokenHash = hashToken(token);
  const result = await query(
    `
      update web_sessions
      set revoked_at = now()
      where session_token_hash = $1
        and revoked_at is null
      returning id
    `,
    [tokenHash]
  );

  return Boolean(result.rowCount);
};

// API auth session helpers (Postgres)
export const createApiSession = async ({ userId, deviceId, ttlMs = DEFAULT_SESSION_TTL_MS }) => {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(token);
  const sessionId = uuid();
  const expiresAt = toIsoAfter(ttlMs);

  await query(
    `
      insert into auth_sessions (id, user_id, device_id, session_token_hash, expires_at)
      values ($1, $2, $3, $4, $5)
    `,
    [sessionId, userId, deviceId, tokenHash, expiresAt]
  );

  return {
    id: sessionId,
    token,
    tokenHash,
    userId,
    deviceId,
    expiresAt
  };
};

export const getApiSession = async (token) => {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const result = await query(
    `
      select id, user_id, device_id, expires_at, revoked_at, created_at
      from auth_sessions
      where session_token_hash = $1
        and revoked_at is null
        and expires_at > now()
      order by created_at desc
      limit 1
    `,
    [tokenHash]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  await query('update auth_sessions set last_seen_at = now() where id = $1', [row.id]);

  return {
    tokenHash,
    userId: row.user_id,
    deviceId: row.device_id,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at
  };
};

export const deleteApiSession = async (token) => {
  if (!token) {
    return false;
  }

  const tokenHash = hashToken(token);
  const result = await query(
    `
      update auth_sessions
      set revoked_at = now()
      where session_token_hash = $1
        and revoked_at is null
      returning id
    `,
    [tokenHash]
  );

  return Boolean(result.rowCount);
};

export const revokeApiSessionsByDeviceId = async (deviceId) => {
  if (!deviceId) {
    return 0;
  }

  const result = await query(
    `
      update auth_sessions
      set revoked_at = now()
      where device_id = $1
        and revoked_at is null
    `,
    [deviceId]
  );

  return result.rowCount ?? 0;
};
