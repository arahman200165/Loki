import { Router } from 'express';
import { register, login, logout, getSessionContext } from '../controllers/authController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireSessionAuth, logout);
router.get('/session', requireSessionAuth, getSessionContext);

export default router;
