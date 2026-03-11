import crypto from 'crypto';
import { env } from '../config/env.js';
import { createSession, deleteSession } from '../services/sessionStore.js';

const safeStringEquals = (value, expected) => {
  const valueBuffer = Buffer.from(value ?? '', 'utf8');
  const expectedBuffer = Buffer.from(expected ?? '', 'utf8');

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
};

export const login = (req, res) => {
  const { username, password } = req.body ?? {};
  const normalizedUsername = typeof username === 'string' ? username.trim() : '';

  if (!normalizedUsername || typeof password !== 'string' || !password) {
    return res.status(400).json({
      message: 'Username and password are required.'
    });
  }

  const validUsername = safeStringEquals(normalizedUsername, env.authUsername);
  const validPassword = safeStringEquals(password, env.authPassword);

  if (!validUsername || !validPassword) {
    return res.status(401).json({
      message: 'Invalid username or password.'
    });
  }

  const session = createSession({ username: normalizedUsername });

  return res.status(200).json({
    message: 'Login successful.',
    token: session.token,
    user: {
      username: normalizedUsername
    }
  });
};

export const logout = (req, res) => {
  const wasDeleted = deleteSession(req.auth?.token);

  return res.status(200).json({
    message: wasDeleted ? 'Logout successful.' : 'Session already cleared.'
  });
};
