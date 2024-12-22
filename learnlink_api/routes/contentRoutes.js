import express from 'express'
import { ContentController } from '../controllers/contentController.js'
import { protect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()
const contentController = new ContentController()

router.post('/', protect, upload.single('file'), contentController.createContent)
router.get('/course/:course_id', protect, contentController.getCourseContent)
router.get('/:id', protect, contentController.getContent)
router.put('/:id', protect, upload.single('file'), contentController.updateContent)
router.delete('/:id', protect, contentController.deleteContent)

export default router 