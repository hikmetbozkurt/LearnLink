import express from 'express';
import { 
  createNotification,
  getNotifications, 
  markAsRead,
  markAllAsRead,
  clearAllNotifications
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a notification
router.post('/', createNotification);

// Get user's notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Clear all notifications
router.delete('/clear', clearAllNotifications);

export default router; 