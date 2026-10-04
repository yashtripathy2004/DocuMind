import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/stream', rateLimiter(20, 60), ChatController.streamChat);
router.get('/conversations', ChatController.getConversations);
router.get('/conversations/:id/messages', ChatController.getMessages);

export default router;
