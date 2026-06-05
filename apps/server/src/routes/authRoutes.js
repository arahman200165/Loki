import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireSessionAuth, logout);

export default router;
