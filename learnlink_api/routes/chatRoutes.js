import express from 'express'
import { ChatController } from '../controllers/chatController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()
const chatController = new ChatController()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Chat room operations
router.post('/rooms', chatController.createChatRoom)
router.get('/rooms/user/:userId', chatController.getChatRooms)

// Message operations
router.get('/rooms/:roomId/messages', chatController.getMessages)
router.post('/messages', chatController.sendMessage)

export default router 