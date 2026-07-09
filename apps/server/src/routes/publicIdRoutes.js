import { Router } from 'express';
import { claimId, getStatus, rotateId } from '../controllers/publicIdController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withIdempotency } from '../middleware/idempotency.js';

const router = Router();

router.post(
  '/claim',
  asyncHandler(requireSessionAuth),
  asyncHandler(withIdempotency(claimId))
);
router.get('/status', asyncHandler(requireSessionAuth), asyncHandler(getStatus));
router.post(
  '/rotate',
  asyncHandler(requireSessionAuth),
  asyncHandler(withIdempotency(rotateId))
);

export default router;
