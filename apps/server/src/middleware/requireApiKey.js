import crypto from 'crypto';
import { env } from '../config/env.js';

const safeEquals = (value, expected) => {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
};

export const requireApiKey = (req, res, next) => {
  const providedApiKey = req.header(env.apiKeyHeader);

  if (!providedApiKey) {
    return res.status(401).json({
      message: `Missing API key. Provide it in the "${env.apiKeyHeader}" header.`
    });
  }

  if (!safeEquals(providedApiKey, env.apiKey)) {
    return res.status(403).json({
      message: 'Invalid API key.'
    });
  }

  return next();
};
