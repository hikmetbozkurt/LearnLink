import express from 'express'
import { login, register, getProfile, requestPasswordReset, resetPassword } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/login', login)
router.post('/register', register)
router.post('/forgot-password', requestPasswordReset)
router.post('/reset-password', resetPassword)

// Protected routes
router.get('/profile', authenticateToken, getProfile)

export default router 