import crypto from 'crypto';
import { env } from '../config/env.js';
import { createSession, deleteSession } from '../services/sessionStore.js';
import { runHealthCheck } from '../services/healthCheckService.js';
import { SESSION_COOKIE_NAME, getBrowserSessionFromRequest } from '../middleware/requireBrowserSession.js';
import { renderLoginPageHtml } from '../views/web/loginPage.js';
import { renderHomePageHtml } from '../views/web/homePage.js';
import { findAccountByUsername, createAccount } from '../db/models/accountModel.js';
import { findLatestActiveDeviceForAccount, createDeviceForAccount } from '../db/models/deviceModel.js';
import { hashPassword } from '../services/passwordService.js';

const safeStringEquals = (value, expected) => {
  const valueBuffer = Buffer.from(value ?? '', 'utf8');
  const expectedBuffer = Buffer.from(expected ?? '', 'utf8');
  if (valueBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
};

// Lazily creates or reuses a synthetic internal admin account + web-admin device
// so the browser login path can issue a real DB session.
const getOrCreateAdminSession = async (username) => {
  let account = await findAccountByUsername(username);

  if (!account) {
    // Store a random unusable hash — admin auth always goes through env-credential check above
    const unusableHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
    account = await createAccount({ username, passwordHash: unusableHash });
  }

  let device = await findLatestActiveDeviceForAccount(account.id);
  if (!device) {
    device = await createDeviceForAccount({ accountId: account.id, label: 'web-admin' });
  }

  return createSession({ accountId: account.id, deviceId: device.id });
};

export const renderLoginPage = async (req, res) => {
  const existingSession = await getBrowserSessionFromRequest(req);
  if (existingSession) return res.redirect('/');

  const hasError = req.query?.error === '1';
  return res.status(200).type('html').send(renderLoginPageHtml({ hasError }));
};

export const handleLoginPage = async (req, res) => {
  const { username, password } = req.body ?? {};
  const normalizedUsername = typeof username === 'string' ? username.trim() : '';
  const normalizedPassword = typeof password === 'string' ? password : '';

  const validUsername = safeStringEquals(normalizedUsername, env.authUsername);
  const validPassword = safeStringEquals(normalizedPassword, env.authPassword);

  if (!validUsername || !validPassword) {
    return res.redirect('/login?error=1');
  }

  const token = await getOrCreateAdminSession(normalizedUsername.toLowerCase());

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
    maxAge: 1000 * 60 * 60 * 12
  });

  return res.redirect('/');
};

export const renderProtectedHomePage = (req, res) =>
  res.status(200).type('html').send(
    renderHomePageHtml({
      username: req.webSession?.username || 'unknown',
      apiPrefix: env.apiPrefix
    })
  );

export const handleLogoutPage = async (req, res) => {
  const token = req.webSession?.token;
  if (token) {
    await deleteSession(token);
  }

  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.redirect('/login');
};

export const handleWebHealthCheck = async (req, res) => {
  const result = await runHealthCheck();
  return res.status(result.statusCode).json(result.payload);
};
