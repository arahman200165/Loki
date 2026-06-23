import { getClient } from '../db/pool.js';
import {
  publicIdExists,
  claimPublicId,
  findActiveByAccountId,
  rotatePublicId,
} from '../db/models/publicIdModel.js';

// Inline validation — mirrors packages/shared/src/utils/publicId.ts
const PUBLIC_ID_MIN = 8;
const PUBLIC_ID_MAX = 24;
const PUBLIC_ID_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const RESERVED = new Set([
  'admin', 'support', 'security', 'moderator', 'system', 'loki', 'official',
  'api', 'web', 'mail', 'root', 'null', 'undefined', 'help', 'safety',
  'verify', 'verified', 'trust',
]);

const CONFUSABLE = new Set([
  'а', 'е', 'о', 'р', 'с', 'х', 'і', 'й',
  'ο', 'α', 'ε', 'ν',
  'ó', 'é', 'à', 'ä', 'ü', 'ö',
]);

const isValidPublicId = (id) => {
  if (typeof id !== 'string') return false;
  if (RESERVED.has(id)) return false;
  if (id.length < PUBLIC_ID_MIN || id.length > PUBLIC_ID_MAX) return false;
  for (const ch of id) if (CONFUSABLE.has(ch)) return false;
  return PUBLIC_ID_RE.test(id);
};

const SUBMITTED = Object.freeze({ status: 'submitted' });

// POST /api/v1/public-id/claim
// Anti-enumeration: always 202 { status: 'submitted' } regardless of outcome.
// Mobile must call GET /status afterwards to confirm the claim succeeded.
export const claimId = async (req, res) => {
  const raw = req.body?.public_id;
  const id = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  const accountId = req.auth.accountId;

  if (!isValidPublicId(id)) return res.status(202).json(SUBMITTED);

  try {
    const [alreadyClaimed, taken] = await Promise.all([
      findActiveByAccountId(accountId),
      publicIdExists(id),
    ]);
    if (!alreadyClaimed && !taken) {
      await claimPublicId(accountId, id);
    }
  } catch {
    // Swallow — uniform response required
  }

  return res.status(202).json(SUBMITTED);
};

// GET /api/v1/public-id/status
export const getStatus = async (req, res) => {
  const active = await findActiveByAccountId(req.auth.accountId);
  if (!active) return res.status(404).json({ message: 'No Public-ID claimed yet.' });

  return res.status(200).json({
    id: active.id,
    eligible_for_free_rotation_at: active.eligible_for_free_rotation_at.toISOString(),
  });
};

// POST /api/v1/public-id/rotate
// Anti-enumeration: always 202 { status: 'submitted' } regardless of outcome.
// Enforces 7-day free-rotation cooldown; accepts payment_token stub for paid rotation.
export const rotateId = async (req, res) => {
  const raw = req.body?.new_public_id;
  const newId = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  const paymentToken = req.body?.payment_token ?? null;
  const accountId = req.auth.accountId;

  if (!isValidPublicId(newId)) return res.status(202).json(SUBMITTED);

  try {
    const current = await findActiveByAccountId(accountId);
    if (!current) return res.status(202).json(SUBMITTED);

    const canRotateFree = new Date() >= new Date(current.eligible_for_free_rotation_at);
    // payment_token is a stub — any non-empty string counts as paid for MVP
    const hasPaidToken = typeof paymentToken === 'string' && paymentToken.length > 0;
    if (!canRotateFree && !hasPaidToken) return res.status(202).json(SUBMITTED);

    const taken = await publicIdExists(newId);
    if (taken) return res.status(202).json(SUBMITTED);

    const client = await getClient();
    try {
      await client.query('BEGIN');
      await rotatePublicId(accountId, newId, client);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch {
    // Swallow — uniform response required
  }

  return res.status(202).json(SUBMITTED);
};
