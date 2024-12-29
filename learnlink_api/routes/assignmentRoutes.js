import express from 'express'
import { authenticateToken } from '../middleware/authMiddleware.js'
import { 
  getAllAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignments,
  submitAssignment,
  gradeSubmission,
  getSubmissions
} from '../controllers/assignmentController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

router.route('/')
  .get(getAllAssignments)
  .post(createAssignment)

router.route('/:id')
  .get(getAssignment)
  .put(updateAssignment)
  .delete(deleteAssignment)

router.get('/course/:course_id', getAssignments)
router.post('/:id/submit', submitAssignment)
router.post('/:id/submissions/:submission_id/grade', gradeSubmission)
router.get('/:id/submissions', getSubmissions)

export default router 