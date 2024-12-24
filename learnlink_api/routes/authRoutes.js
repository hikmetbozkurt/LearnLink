import express from 'express'
import { AuthController } from '../controllers/authController.js'

const router = express.Router()
const authController = new AuthController()

router.post('/login', authController.login)

// Signup route
router.post('/signup', authController.signup)

router.post('/google', authController.googleAuth)

export default router 