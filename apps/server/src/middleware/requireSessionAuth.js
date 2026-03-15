import { getApiSession } from '../services/sessionStore.js';

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

export const requireSessionAuth = async (req, res, next) => {
  const token = extractBearerToken(req.header('authorization'));

  if (!token) {
    return res.status(401).json({
      message: 'Missing auth token. Login first and send Authorization: Bearer <token>.'
    });
  }

  const session = await getApiSession(token);
  if (!session) {
    return res.status(401).json({
      message: 'Invalid or expired auth token. Login again.'
    });
  }

  req.auth = {
    token,
    userId: session.userId ?? null,
    deviceId: session.deviceId ?? null
  };

  return next();
};
