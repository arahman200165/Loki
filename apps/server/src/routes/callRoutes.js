import { Router } from 'express';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withIdempotency } from '../middleware/idempotency.js';
import {
  initiateCall,
  respondToCall,
  leaveCall,
  terminateCall,
  getCallState,
  listPendingCalls,
  postCallSignal,
  getCallSignal,
  getTurnCredentials,
} from '../controllers/callController.js';

const router = Router();

// Idempotency-Key support matches architecture §11.5 exactly: only
// initiate/respond are listed there. leave/terminate/signal are naturally
// safe to retry via their own state checks; GETs don't need it.
router.post('/initiate', asyncHandler(requireSessionAuth), asyncHandler(withIdempotency(initiateCall)));
router.get('/pending', asyncHandler(requireSessionAuth), asyncHandler(listPendingCalls));
router.get('/turn-credentials', asyncHandler(requireSessionAuth), asyncHandler(getTurnCredentials));
router.post(
  '/:id/respond',
  asyncHandler(requireSessionAuth),
  asyncHandler(withIdempotency(respondToCall))
);
router.post('/:id/leave', asyncHandler(requireSessionAuth), asyncHandler(leaveCall));
router.post('/:id/terminate', asyncHandler(requireSessionAuth), asyncHandler(terminateCall));
router.get('/:id/state', asyncHandler(requireSessionAuth), asyncHandler(getCallState));
router.post('/:id/signal', asyncHandler(requireSessionAuth), asyncHandler(postCallSignal));
router.get('/:id/signal', asyncHandler(requireSessionAuth), asyncHandler(getCallSignal));

export default router;
