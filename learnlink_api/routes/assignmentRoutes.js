import express from 'express'
import { AssignmentController } from '../controllers/assignmentController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()
const assignmentController = new AssignmentController()

router.post('/', protect, assignmentController.createAssignment)
router.get('/course/:course_id', protect, assignmentController.getAssignments)
router.get('/:id', protect, assignmentController.getAssignment)
router.post('/:id/submit', protect, assignmentController.submitAssignment)
router.post('/:id/submissions/:submission_id/grade', protect, assignmentController.gradeSubmission)
router.get('/:id/submissions', protect, assignmentController.getSubmissions)

export default router 