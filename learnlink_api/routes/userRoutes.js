import express from 'express'
import { authenticateToken } from '../middleware/authMiddleware.js'
import { 
  getUser, 
  searchUsers, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  getFriendRequests, 
  getFriends,
  getSentFriendRequests,
  removeFriend
} from '../controllers/userController.js'

const router = express.Router()

// Protected routes - require authentication
router.use(authenticateToken)

router.get('/search/:query', searchUsers)
router.get('/friends/:userId', getFriends)
router.get('/friend-requests/:userId', getFriendRequests)
router.get('/friend-requests/sent/:userId', getSentFriendRequests)
router.get('/:id', getUser)
router.post('/friend-request/:userId', sendFriendRequest)
router.put('/friend-request/:requestId/accept', acceptFriendRequest)
router.delete('/friend-request/:requestId', rejectFriendRequest)
router.delete('/friends/:friendId', removeFriend)

export default router 