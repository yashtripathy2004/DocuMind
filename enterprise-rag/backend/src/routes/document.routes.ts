import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import { rateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/upload',
  rateLimiter(10, 60),
  uploadMiddleware.single('file'),
  DocumentController.uploadDocument
);
router.get('/', DocumentController.listDocuments);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
