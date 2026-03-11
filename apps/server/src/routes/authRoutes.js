import { Router } from 'express';
import { login, logout } from '../controllers/authController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', requireSessionAuth, logout);

export default router;
