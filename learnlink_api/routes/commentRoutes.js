import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  createComment,
  getPostComments,
  getUserCommentStats,
  getCommentActivityOverTime,
  deleteComment
} from '../controllers/commentController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Comment routes
router.post('/posts/:postId/comments', createComment);
router.get('/posts/:postId/comments', getPostComments);
router.delete('/comments/:commentId', deleteComment);

// Stats routes
router.get('/stats/comments', getUserCommentStats);
router.get('/stats/comments/activity', getCommentActivityOverTime);

export default router; 