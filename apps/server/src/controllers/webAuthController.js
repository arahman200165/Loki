import crypto from 'crypto';
import { env } from '../config/env.js';
import { createSession, deleteSession } from '../services/sessionStore.js';
import { runHealthCheck } from '../services/healthCheckService.js';
import { SESSION_COOKIE_NAME, getBrowserSessionFromRequest } from '../middleware/requireBrowserSession.js';
import { renderLoginPageHtml } from '../views/web/loginPage.js';
import { renderHomePageHtml } from '../views/web/homePage.js';

const safeStringEquals = (value, expected) => {
  const valueBuffer = Buffer.from(value ?? '', 'utf8');
  const expectedBuffer = Buffer.from(expected ?? '', 'utf8');

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
};

export const renderLoginPage = async (req, res) => {
  const existingSession = await getBrowserSessionFromRequest(req);
  if (existingSession) {
    return res.redirect('/');
  }

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

  const session = await createSession({ username: normalizedUsername });

  res.cookie(SESSION_COOKIE_NAME, session.token, {
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
