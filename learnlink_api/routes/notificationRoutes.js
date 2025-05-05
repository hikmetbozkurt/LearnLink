import express from 'express';
import { 
  createNotification,
  getNotifications, 
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
  getUserNotifications,
  createAssignmentNotification,
  createSubmissionNotification,
  createTestNotification
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a notification
router.post('/', createNotification);

// Assignment notification endpoints
router.post('/assignment', createAssignmentNotification);
router.post('/assignment-submission', createSubmissionNotification);

// Keep the new paths for backward compatibility
router.post('/assignments', createAssignmentNotification);
router.post('/assignments-submission', createSubmissionNotification);

// Test notification endpoint (for debugging)
router.post('/test', createTestNotification);

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