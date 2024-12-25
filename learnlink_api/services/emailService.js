import nodemailer from 'nodemailer'
import config from '../config/env.js'

export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  async sendVerificationCode(to, code) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: 'Password Reset Code - LearnLink',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007acc;">LearnLink Password Reset</h2>
          <p>You requested to reset your password. Here is your verification code:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007acc; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    }

    try {
      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error('Failed to send verification code')
    }
  }
} 