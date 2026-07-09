import { findAccountIdByPublicId } from '../db/models/publicIdModel.js';
import { isValidPublicId } from './publicIdController.js';
import {
  createContactRequest,
  listPendingForRecipient,
  respondToRequest,
} from '../db/models/contactRequestModel.js';
import { isBlocked, createBlock } from '../db/models/blocksModel.js';

const SUBMITTED = Object.freeze({ status: 'submitted' });
const OK = Object.freeze({ status: 'ok' });

// POST /api/v1/contact-request/send
// Anti-enumeration: always 202 { status: 'submitted' } regardless of outcome —
// invalid format, unknown ID, deprecated ID, reserved ID, and blocked-sender all
// produce the identical response. Block check per ADR-029 — silent drop, no
// signal to the sender.
export const sendContactRequest = async (req, res) => {
  const raw = req.body?.recipient_public_id;
  const recipientPublicId = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  const firstMessage = req.body?.first_message;
  const senderAccountId = req.auth.accountId;

  if (!isValidPublicId(recipientPublicId)) return res.status(202).json(SUBMITTED);

  try {
    const recipientAccountId = await findAccountIdByPublicId(recipientPublicId);

    if (recipientAccountId && recipientAccountId !== senderAccountId) {
      const blocked = await isBlocked(recipientAccountId, senderAccountId);
      if (!blocked) {
        await createContactRequest({
          senderAccountId,
          recipientAccountId,
          firstMessage: typeof firstMessage === 'string' ? firstMessage : null,
        });
      }
    }
  } catch {
    // Swallow — uniform response required
  }

  return res.status(202).json(SUBMITTED);
};

// GET /api/v1/contact-request/pending
export const listPendingRequests = async (req, res) => {
  const requests = await listPendingForRecipient(req.auth.accountId);
  return res.status(200).json({ requests });
};

// POST /api/v1/contact-request/respond
// Always 200 { status: 'ok' } whether or not a matching pending request existed —
// mirrors the mobile screen's optimistic-removal UX, which ignores the response body.
export const respondContactRequest = async (req, res) => {
  const { request_id, action } = req.body ?? {};

  if (
    typeof request_id === 'string' &&
    request_id.trim() &&
    (action === 'accept' || action === 'deny')
  ) {
    try {
      await respondToRequest({
        requestId: request_id.trim(),
        recipientAccountId: req.auth.accountId,
        action,
      });
    } catch {
      // Swallow — uniform response required
    }
  }

  return res.status(200).json(OK);
};

// POST /api/v1/contact-request/block
export const blockContact = async (req, res) => {
  const { accountId } = req.auth;
  const { target_public_id, request_id } = req.body;

  if (typeof target_public_id !== 'string' || !target_public_id.trim()) {
    return res.status(400).json({ message: 'target_public_id is required.' });
  }

  const normalized = target_public_id.trim().toLowerCase();
  const targetAccountId = await findAccountIdByPublicId(normalized);

  if (targetAccountId) {
    await createBlock(accountId, targetAccountId);

    if (typeof request_id === 'string' && request_id.trim()) {
      await respondToRequest({
        requestId: request_id.trim(),
        recipientAccountId: accountId,
        action: 'deny',
      });
    }
  }

  // Always 200 regardless of whether target exists — no existence leak
  return res.status(200).json(OK);
};
