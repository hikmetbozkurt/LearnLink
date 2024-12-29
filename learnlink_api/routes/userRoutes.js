import express from 'express'
import { authenticateToken } from '../middleware/authMiddleware.js'
import { getUser, searchUsers, sendFriendRequest, acceptFriendRequest, getFriendRequests, getFriends } from '../controllers/userController.js'

const router = express.Router()

// Protected routes - require authentication
router.use(authenticateToken)

router.get('/search/:query', searchUsers)
router.get('/friends/:userId', getFriends)
router.get('/friend-requests/:userId', getFriendRequests)
router.get('/:id', getUser)
router.post('/friend-request/:userId', sendFriendRequest)
router.put('/friend-request/:requestId/accept', acceptFriendRequest)

export default router 