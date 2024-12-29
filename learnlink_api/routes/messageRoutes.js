import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { 
  createMessage,
  getMessage,
  updateMessage,
  deleteMessage,
  getAllMessages
} from '../controllers/messageController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.route('/')
  .get(getAllMessages)
  .post(createMessage);

router.route('/:id')
  .get(getMessage)
  .put(updateMessage)
  .delete(deleteMessage);

export default router;