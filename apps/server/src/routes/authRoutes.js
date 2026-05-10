import { Router } from 'express';
import {
  completeRecoveryFlow,
  loginWithDeviceChallenge,
  logout,
  registerAccountComplete,
  registerAccountStart,
  requestDeviceChallenge,
  startRecoveryFlow
} from '../controllers/authController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/register/start', asyncHandler(registerAccountStart));
router.post('/register/complete', asyncHandler(registerAccountComplete));
router.post('/challenge', asyncHandler(requestDeviceChallenge));
router.post('/login', asyncHandler(loginWithDeviceChallenge));
router.post('/recovery/start', asyncHandler(startRecoveryFlow));
router.post('/recovery/complete', asyncHandler(completeRecoveryFlow));
router.post('/logout', asyncHandler(requireSessionAuth), asyncHandler(logout));

export default router;
