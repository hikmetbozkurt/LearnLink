import express from 'express';
import { CourseController } from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const courseController = new CourseController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Course CRUD operations
router.post('/', authMiddleware, authorize('instructor'), courseController.createCourse);
router.get('/', authMiddleware, courseController.getCourses);
router.get('/:id', authMiddleware, courseController.getCourseById);
router.put('/:id', authMiddleware, authorize('instructor'), courseController.updateCourse);
router.delete('/:id', authMiddleware, authorize('instructor'), courseController.deleteCourse);

// Enrollment
router.post('/:course_id/enroll', authMiddleware, authorize('student'), courseController.enrollInCourse);

export default router; 