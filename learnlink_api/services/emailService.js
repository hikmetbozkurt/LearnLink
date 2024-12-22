import nodemailer from 'nodemailer'
import config from '../config/env.js'

export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL,
        pass: config.EMAIL_PASSWORD
      }
    })
  }

  async sendVerificationCode(to, code) {
    const mailOptions = {
      from: config.EMAIL,
      to: to,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>LearnLink Password Reset</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4040ff; font-size: 32px;">${code}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    }

    try {
      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Email sending failed:', error)
      throw new Error('Failed to send verification code')
    }
  }
} 