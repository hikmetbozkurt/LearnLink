import express from 'express'
import { login, register, getProfile, requestPasswordReset, resetPassword, googleLogin, checkAuthProvider, changeEmail, changePassword } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/login', login)
router.post('/register', register)
router.post('/google', googleLogin)
router.post('/forgot-password', requestPasswordReset)
router.post('/reset-password', resetPassword)

// Protected routes
router.get('/profile', authenticateToken, getProfile)
router.get('/check-auth-provider', authenticateToken, checkAuthProvider)
router.post('/change-email', authenticateToken, changeEmail)
router.post('/change-password', authenticateToken, changePassword)

export default router 