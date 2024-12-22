import express from 'express'
import { UserController } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()
const userController = new UserController()

// User API Endpoints
router.get('/api/users/profile', protect, userController.getProfile)    // Profil bilgisi alma
router.put('/api/users/profile', protect, userController.updateProfile) // Profil güncelleme

export default router 