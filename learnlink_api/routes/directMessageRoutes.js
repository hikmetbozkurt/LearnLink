import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { 
  createDirectMessage,
  getDirectMessages,
  getDirectMessageById,
  getDirectMessageMessages,
  sendDirectMessage
} from '../controllers/directMessageController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all direct messages for the current user
router.get('/', getDirectMessages);

// Create a new direct message conversation
router.post('/', createDirectMessage);

// Get a specific direct message conversation
router.get('/:id', getDirectMessageById);

// Get messages for a specific direct message conversation
router.get('/:id/messages', getDirectMessageMessages);

// Send a message in a direct message conversation
router.post('/:id/messages', sendDirectMessage);

export default router; 