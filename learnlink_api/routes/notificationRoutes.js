import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  getUnreadCount, 
  markAllAsRead, 
  clearAllNotifications 
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread', getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Clear all notifications
router.delete('/clear', clearAllNotifications);

export default router; 