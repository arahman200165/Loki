import { getClient } from '../db/pool.js';
import { createAccount, findAccountByUsername, accountExists } from '../db/models/accountModel.js';
import { createDeviceForAccount, findLatestActiveDeviceForAccount } from '../db/models/deviceModel.js';
import { createSession, deleteSession } from '../services/sessionStore.js';
import { hashPassword, verifyPassword, verifyDummy } from '../services/passwordService.js';
import { env } from '../config/env.js';

const USERNAME_RE = /^[a-z0-9._-]+$/;
const RESERVED_USERNAME = (env.authUsername ?? '').trim().toLowerCase();

const normalizeUsername = (raw) =>
  typeof raw === 'string' ? raw.trim().toLowerCase() : '';

const validateUsername = (username) => {
  if (!username) return 'Username is required.';
  if (username.length < 3 || username.length > 32) return 'Username must be 3–32 characters.';
  if (!USERNAME_RE.test(username)) return 'Username may only contain letters, digits, dots, underscores, and hyphens.';
  if (username === RESERVED_USERNAME) return 'That username is not available.';
  return null;
};

const validatePassword = (password) => {
  if (typeof password !== 'string' || !password) return 'Password is required.';
  if (password.length < 12) return 'Password must be at least 12 characters.';
  return null;
};

export const register = async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const { password } = req.body ?? {};

  const usernameError = validateUsername(username);
  if (usernameError) return res.status(400).json({ message: usernameError });

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ message: passwordError });

  const passwordHash = await hashPassword(password);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    if (await accountExists(username, client)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const account = await createAccount({ username, passwordHash }, client);
    const device = await createDeviceForAccount({ accountId: account.id, label: '' }, client);
    const token = await createSession({ accountId: account.id, deviceId: device.id }, client);

    await client.query('COMMIT');

    return res.status(201).json({
      token,
      user: { id: account.id, username: account.username }
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const { password } = req.body ?? {};

  if (!username || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const account = await findAccountByUsername(username);

  if (!account || account.deleted_at) {
    // Pay Argon2 cost anyway to prevent timing-based username enumeration
    await verifyDummy(password);
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const valid = await verifyPassword(account.password_hash, password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const device = await findLatestActiveDeviceForAccount(account.id);
  if (!device) {
    return res.status(401).json({ message: 'Account has no active device. Please re-register.' });
  }

  const token = await createSession({ accountId: account.id, deviceId: device.id });

  return res.status(200).json({
    token,
    user: { id: account.id, username: account.username }
  });
};

export const logout = async (req, res) => {
  const wasDeleted = await deleteSession(req.auth?.token);
  return res.status(200).json({
    message: wasDeleted ? 'Logout successful.' : 'Session already cleared.'
  });
};

export const getSessionContext = async (req, res) =>
  res.status(200).json({
    session: req.auth
  });
