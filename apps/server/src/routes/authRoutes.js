import { Router } from 'express';
import { register, login, logout, getSessionContext } from '../controllers/authController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(requireSessionAuth), asyncHandler(logout));
router.get('/session', asyncHandler(requireSessionAuth), asyncHandler(getSessionContext));

export default router;
