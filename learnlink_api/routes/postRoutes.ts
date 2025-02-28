import express from 'express';
import multer from 'multer';
import { createPost, getCoursePosts } from '../controllers/postController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer konfigürasyonu
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and video files are allowed.'));
    }
  }
});

// Post routes
router.post('/courses/:courseId/posts', authenticateToken, upload.single('file'), createPost);
router.get('/courses/:courseId/posts', authenticateToken, getCoursePosts);

export default router; 