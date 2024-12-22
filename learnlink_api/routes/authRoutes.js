import express from 'express'
import { AuthController } from '../controllers/authController.js'

const router = express.Router()
const authController = new AuthController()

router.post('/login', authController.login)
router.post('/register', authController.register)
router.post('/request-reset', authController.requestPasswordReset)
router.post('/reset-password', authController.resetPassword)

export default router 