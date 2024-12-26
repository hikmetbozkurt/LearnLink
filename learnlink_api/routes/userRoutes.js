import express from 'express'
import { UserController } from '../controllers/userController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()
const userController = new UserController()

// Apply auth middleware to all routes
router.use(authMiddleware)

// User API Endpoints
router.get('/profile', userController.getProfile)    // Get profile info
router.put('/profile', userController.updateProfile) // Update profile

// Get all students
router.get('/students', userController.getStudents)

export default router 