import { Router } from 'express';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { blockContact } from '../controllers/contactController.js';

const router = Router();

router.post('/block', asyncHandler(requireSessionAuth), asyncHandler(blockContact));

// TODO 4.2: router.post('/send',    asyncHandler(requireSessionAuth), asyncHandler(sendContactRequest));
// TODO 4.3: router.post('/respond', asyncHandler(requireSessionAuth), asyncHandler(respondContactRequest));
// TODO 4.3: router.get('/pending',  asyncHandler(requireSessionAuth), asyncHandler(listPendingRequests));

export default router;
