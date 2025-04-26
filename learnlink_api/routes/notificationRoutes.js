import express from 'express';
import { 
  createNotification,
  getNotifications, 
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
  getUserNotifications
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a notification
router.post('/', createNotification);

// Get user's notifications (current user)
router.get('/', getNotifications);

// Specific path routes
router.put('/read-all', markAllAsRead);
router.delete('/clear', clearAllNotifications);

// User-specific routes
router.get('/user/:userId', getUserNotifications);

// Routes with parameter IDs
router.put('/:notificationId/read', markAsRead);
router.delete('/:notificationId', deleteNotification);

export default router; 