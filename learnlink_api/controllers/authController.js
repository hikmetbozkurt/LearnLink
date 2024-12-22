import { AuthService } from '../services/authService.js'
import { EmailService } from '../services/emailService.js'
import { createResponse } from '../utils/responseHelper.js'

export class AuthController {
  constructor() {
    this.authService = new AuthService()
    this.emailService = new EmailService()
  }

  login = async (req, res) => {
    try {
      const { email, password } = req.body
      const result = await this.authService.login(email, password)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  register = async (req, res) => {
    try {
      const { name, email, password, role = 'student' } = req.body
      const result = await this.authService.register({ name, email, password, role })
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  requestPasswordReset = async (req, res) => {
    try {
      const { email } = req.body
      const { data: { code } } = await this.authService.createResetToken(email)
      await this.emailService.sendVerificationCode(email, code)
      res.json(createResponse(true, { message: 'Verification code sent' }))
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  resetPassword = async (req, res) => {
    try {
      const { email, code, newPassword } = req.body
      const result = await this.authService.resetPassword(email, code, newPassword)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }
} 