import express from 'express'
import { ChatController } from '../controllers/chatController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()
const chatController = new ChatController()

router.post('/', protect, chatController.createChatroom)
router.get('/course/:course_id', protect, chatController.getChatrooms)
router.post('/:chatroom_id/join', protect, chatController.joinChatroom)
router.get('/:chatroom_id/messages', protect, chatController.getMessages)
router.post('/:chatroom_id/messages', protect, chatController.sendMessage)

export default router 