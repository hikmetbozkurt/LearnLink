import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { 
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  getAllCourses
} from '../controllers/courseController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.route('/')
  .get(getAllCourses)
  .post(createCourse);

router.route('/:id')
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

export default router;