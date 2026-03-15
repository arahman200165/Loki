import { Router } from 'express';
import { getContactCode, updateProfile } from '../controllers/profileController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.put('/', asyncHandler(requireSessionAuth), asyncHandler(updateProfile));
router.get('/contact-code', asyncHandler(requireSessionAuth), asyncHandler(getContactCode));

export default router;
