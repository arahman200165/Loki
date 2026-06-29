import { query } from '../db/pool.js';
import { findAccountIdByPublicId } from '../db/models/publicIdModel.js';

// TODO 4.2: export const sendContactRequest = async (req, res) => { ... };
// TODO 4.3: export const listPendingRequests  = async (req, res) => { ... };
// TODO 4.3: export const respondContactRequest = async (req, res) => { ... };

export const blockContact = async (req, res) => {
  const { accountId } = req.auth;
  const { target_public_id, request_id } = req.body;

  if (typeof target_public_id !== 'string' || !target_public_id.trim()) {
    return res.status(400).json({ message: 'target_public_id is required.' });
  }

  const normalized = target_public_id.trim().toLowerCase();
  const targetAccountId = await findAccountIdByPublicId(normalized);

  if (targetAccountId) {
    await query(
      `INSERT INTO blocks (blocker_account_id, blocked_account_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [accountId, targetAccountId]
    );

    if (typeof request_id === 'string' && request_id.trim()) {
      await query(
        `UPDATE contact_requests SET status = 'denied'
         WHERE id = $1 AND recipient_account_id = $2 AND status = 'pending'`,
        [request_id.trim(), accountId]
      );
    }
  }

  // Always 200 regardless of whether target exists — no existence leak
  return res.status(200).json({ status: 'ok' });
};
