import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import * as courseController from "../controllers/courseController.js";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Özel route'ları önce tanımla
router.get("/my-courses", courseController.getMyCourses);
router.post("/:courseId/join", courseController.joinCourse);
router.delete("/:courseId/leave", courseController.leaveCourse);

// Genel route'lar
router
  .route("/")
  .get(courseController.getAllCourses)
  .post(courseController.createCourse);

router
  .route("/:id")
  .get(courseController.getCourse)
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

export default router;
