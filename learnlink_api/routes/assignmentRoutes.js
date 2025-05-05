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
  getSubmissions,
  getUserSubmission
} from '../controllers/assignmentController.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()

// Configure multer for temporary file storage before S3 upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a temp directory for files that will be uploaded to S3
    const tempDir = 'uploads/temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'temp-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept common document and media file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|rtf|zip|rar|ppt|pptx|xls|xlsx/
    const ext = path.extname(file.originalname).toLowerCase()
    const mimetype = file.mimetype
    
    if (allowedTypes.test(ext) || allowedTypes.test(mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only document, image, and archive files are allowed.'))
    }
  }
})

// All routes require authentication
router.use(authenticateToken)

router.route('/')
  .get(getAllAssignments)
  .post(createAssignment)

// Specific routes must come before generic parameter routes
router.get('/course/:course_id', getAssignments)
router.post('/:id/submit', upload.single('file'), submitAssignment)
router.post('/:id/submissions/:submission_id/grade', gradeSubmission)
router.get('/:id/submissions', getSubmissions)
router.get('/:id/submissions/user', getUserSubmission)

// Generic parameter routes should come last
router.route('/:id')
  .get(getAssignment)
  .put(updateAssignment)
  .delete(deleteAssignment)

export default router 