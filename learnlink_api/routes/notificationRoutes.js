import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { 
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  createNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// Get user's notifications
router.get('/user/:userId', authenticateToken, getUserNotifications);

// Mark a notification as read
router.put('/:notificationId/read', authenticateToken, markNotificationAsRead);

// Mark all notifications as read for a user
router.put('/read-all/:userId', authenticateToken, markAllNotificationsAsRead);

// Clear all notifications for a user
router.delete('/clear/:userId', authenticateToken, clearAllNotifications);

// Create a new notification
router.post('/', authenticateToken, createNotification);

export default router; 