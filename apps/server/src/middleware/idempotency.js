import { findByKey, save } from '../db/models/idempotencyModel.js';

// Wraps a handler with Idempotency-Key support (ADR-018). The header is accepted, not
// required — requests without it just skip the cache and run normally. On a cache hit,
// replays the stored response without re-running the handler. On a miss, persists the
// handler's JSON response under the key so retries return the identical response.
export const withIdempotency = (handler) => async (req, res, next) => {
  const key = req.header('idempotency-key');
  if (!key) return handler(req, res, next);

  const cached = await findByKey(key);
  if (cached) {
    const body = JSON.parse(cached.response_body.toString('utf8'));
    return res.status(cached.response_status).json(body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    save(key, res.statusCode, Buffer.from(JSON.stringify(body), 'utf8')).catch(() => {});
    return originalJson(body);
  };

  return handler(req, res, next);
};
