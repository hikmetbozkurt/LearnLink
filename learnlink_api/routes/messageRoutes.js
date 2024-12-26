import express from 'express';
import { MessageController } from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const messageController = new MessageController();

// Apply auth middleware
router.use(authMiddleware);

// Message routes
router.post('/', messageController.sendMessage);
router.get('/:user_id/:other_user_id', messageController.getMessages);

export default router;