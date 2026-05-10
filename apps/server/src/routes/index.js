import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import devicesRoutes from './devicesRoutes.js';
import profileRoutes from './profileRoutes.js';
import syncRoutes from './syncRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/devices', devicesRoutes);
router.use('/profile', profileRoutes);
router.use('/sync', syncRoutes);

export default router;
