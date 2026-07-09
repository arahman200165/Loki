import { Router } from 'express';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withIdempotency } from '../middleware/idempotency.js';
import {
  blockContact,
  sendContactRequest,
  respondContactRequest,
  listPendingRequests,
} from '../controllers/contactController.js';

const router = Router();

router.post('/block', asyncHandler(requireSessionAuth), asyncHandler(blockContact));
router.post(
  '/send',
  asyncHandler(requireSessionAuth),
  asyncHandler(withIdempotency(sendContactRequest))
);
router.post(
  '/respond',
  asyncHandler(requireSessionAuth),
  asyncHandler(withIdempotency(respondContactRequest))
);
router.get('/pending', asyncHandler(requireSessionAuth), asyncHandler(listPendingRequests));

export default router;
