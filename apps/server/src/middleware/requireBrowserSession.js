import { getSession } from '../services/sessionStore.js';

export const SESSION_COOKIE_NAME = 'loki_session';

const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return {};
  }

  return cookieHeader.split(';').reduce((accumulator, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) {
      return accumulator;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key) {
      accumulator[key] = decodeURIComponent(value);
    }

    return accumulator;
  }, {});
};

export const getBrowserSessionFromRequest = async (req) => {
  const cookies = parseCookies(req.header('cookie'));
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  return await getSession(token);
};

export const requireBrowserSession = async (req, res, next) => {
  try {
    const session = await getBrowserSessionFromRequest(req);
    if (!session) {
      return res.redirect('/login');
    }

    req.webSession = session;
    return next();
  } catch (error) {
    return next(error);
  }
};
