import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { 
  createMessage,
  getMessage,
  updateMessage,
  deleteMessage,
  getAllMessages,
  getUserMessageStats,
  getUserMessageStatsByUserId
} from '../controllers/messageController.js';
import { sendDirectMessage } from '../controllers/directMessageController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Stats routes
router.get('/stats/user-messages', getUserMessageStats);
router.get('/stats/:userId', getUserMessageStatsByUserId);

// Direct message routes
router.post('/direct/:id/messages', sendDirectMessage);

// Regular message routes
router.route('/')
  .get(getAllMessages)
  .post(createMessage);

router.route('/:id')
  .get(getMessage)
  .put(updateMessage)
  .delete(deleteMessage);

export default router;