import express from 'express'
import { authenticateToken } from '../middleware/authMiddleware.js'
import { 
  createChat,
  getChat,
  updateChat,
  deleteChat,
  getAllChats
} from '../controllers/chatController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

router.route('/')
  .get(getAllChats)
  .post(createChat)

router.route('/:id')
  .get(getChat)
  .put(updateChat)
  .delete(deleteChat)

export default router 