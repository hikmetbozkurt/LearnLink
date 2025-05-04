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
  removeFriend,
  uploadProfilePicture,
  getProfilePicture
} from '../controllers/userController.js'
import path from 'path'
import fs from 'fs'

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

// Profile picture routes
router.post('/profile-picture', uploadProfilePicture)
router.get('/profile-picture/:userId', getProfilePicture)

// Proxy to handle old-style profile picture URLs
router.get('/profile-pic-proxy/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'profile-pics', filename);
  
  console.log('Profile picture proxy requested:', filename);
  console.log('Checking path:', filePath);
  
  // Check if file exists in local filesystem
  if (fs.existsSync(filePath)) {
    console.log('Serving profile picture from filesystem:', filePath);
    return res.sendFile(filePath);
  }
  
  // If not found, get user ID from filename (e.g., 9-1746364684643.png -> 9)
  const userId = filename.split('-')[0];
  if (userId && !isNaN(parseInt(userId))) {
    // Redirect to the database-backed endpoint
    console.log('Redirecting to database profile picture for user:', userId);
    return res.redirect(`/api/users/profile-picture/${userId}`);
  }
  
  console.log('Profile picture not found:', filename);
  return res.status(404).send('Profile picture not found');
});

export default router 