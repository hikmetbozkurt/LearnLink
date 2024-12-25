import express from 'express'
import { AuthController } from '../controllers/authController.js'

const router = express.Router()
const authController = new AuthController()

router.post('/login', authController.login)

// Signup route
router.post('/signup', authController.signup)

router.post('/google', authController.googleAuth)

// Add these new routes for password reset
router.post('/forgot-password', authController.forgotPassword)
router.post('/verify-reset-code', authController.verifyResetCode)
router.post('/reset-password', authController.resetPassword)

export default router 