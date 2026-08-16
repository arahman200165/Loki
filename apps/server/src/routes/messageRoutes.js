import { Router } from 'express';
import { requireApiKey } from '../middleware/requireApiKey.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { withIdempotency } from '../middleware/idempotency.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendMessage, fetchMessages, ackMessages } from '../controllers/messageController.js';

const router = Router();

router.post(
  '/send',
  requireApiKey,
  asyncHandler(requireSessionAuth),
  asyncHandler(withIdempotency(sendMessage))
);

router.get(
  '/fetch',
  requireApiKey,
  asyncHandler(requireSessionAuth),
  asyncHandler(fetchMessages)
);

router.post(
  '/ack',
  requireApiKey,
  asyncHandler(requireSessionAuth),
  asyncHandler(ackMessages)
);

export default router;
