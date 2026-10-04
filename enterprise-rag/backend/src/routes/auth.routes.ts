import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/register', rateLimiter(5, 60), AuthController.register);
router.post('/login', rateLimiter(10, 60), AuthController.login);
router.get('/me', requireAuth, AuthController.getProfile);

export default router;
