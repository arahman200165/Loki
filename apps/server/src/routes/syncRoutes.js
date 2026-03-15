import { Router } from 'express';
import { getSyncBootstrap, requestSharedKeys } from '../controllers/syncController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/bootstrap', asyncHandler(requireSessionAuth), asyncHandler(getSyncBootstrap));
router.post('/shared-keys/request', asyncHandler(requireSessionAuth), asyncHandler(requestSharedKeys));

export default router;
