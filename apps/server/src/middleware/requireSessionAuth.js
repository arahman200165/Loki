import { getSession } from '../services/sessionStore.js';

const extractBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
};

export const requireSessionAuth = (req, res, next) => {
  const token = extractBearerToken(req.header('authorization'));

  if (!token) {
    return res.status(401).json({
      message: 'Missing auth token. Login first and send Authorization: Bearer <token>.'
    });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({
      message: 'Invalid or expired auth token. Login again.'
    });
  }

  req.auth = {
    token,
    username: session.username
  };

  return next();
};
