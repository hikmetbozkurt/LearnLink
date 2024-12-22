import express from 'express';
import { CourseController } from '../controllers/courseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const courseController = new CourseController();

router.post('/', protect, courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.put('/:id', protect, courseController.updateCourse);
router.delete('/:id', protect, courseController.deleteCourse);
router.post('/:id/enroll', protect, courseController.enrollStudent);
router.get('/:id/students', protect, courseController.getEnrolledStudents);

export default router; 