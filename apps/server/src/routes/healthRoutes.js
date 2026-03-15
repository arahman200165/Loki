import { Router } from 'express';
import { runHealthCheck } from '../services/healthCheckService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const result = await runHealthCheck();
  return res.status(result.statusCode).json(result.payload);
}));

export default router;
