import express from 'express';
import { getNotifications, markAsRead, getUnreadCount } from '../controllers/notificationController.js';
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

export default router; 