import { Router } from 'express';
import { claimId, getStatus, rotateId } from '../controllers/publicIdController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/claim', asyncHandler(requireSessionAuth), asyncHandler(claimId));
router.get('/status', asyncHandler(requireSessionAuth), asyncHandler(getStatus));
router.post('/rotate', asyncHandler(requireSessionAuth), asyncHandler(rotateId));

export default router;
