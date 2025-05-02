import nodemailer from 'nodemailer'
import config from '../config/env.js'

export class EmailService {
  constructor() {
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  async sendVerificationCode(to, code) {
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Missing email configuration:', {
        host: !!process.env.SMTP_HOST,
        port: !!process.env.SMTP_PORT,
        user: !!process.env.SMTP_USER,
        pass: !!process.env.SMTP_PASS
      });
      throw new Error('Email service not configured properly');
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: 'Password Reset Code - LearnLink',
      html: this.getEmailTemplate('verification', { code })
    };

    try {
      await this.transporter.verify();
      
      
      
      const result = await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', {
        error: error.message,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode
      });
      
      if (error.code === 'EAUTH') {
        throw new Error('Email authentication failed - check SMTP credentials');
      } else if (error.code === 'ESOCKET') {
        throw new Error('Network error while sending email - check SMTP host and port');
      } else if (error.code === 'EENVELOPE') {
        throw new Error('Invalid email address format');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('Failed to connect to email server - check network and SMTP settings');
      } else {
        throw new Error(`Failed to send verification code: ${error.message}`);
      }
    }
  }

  getEmailTemplate(type, data) {
    switch(type) {
      case 'verification':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6B4EE6;">LearnLink Password Reset</h2>
            <p>You requested to reset your password. Here is your 6-digit verification code:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #6B4EE6; font-size: 32px; letter-spacing: 8px;">${data.code}</h1>
            </div>
            <p style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
            <p style="color: #666; margin-top: 20px;">This is an automated message, please do not reply.</p>
          </div>
        `;
      
      case 'welcome':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6B4EE6;">Welcome to LearnLink!</h2>
            <p>Hi ${data.name},</p>
            <p>Thank you for joining LearnLink. We're excited to have you as part of our learning community.</p>
            <div style="margin: 20px 0;">
              <a href="http://localhost:3000/home" 
                 style="background-color: #6B4EE6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Go to Home
              </a>
            </div>
            <p>Best regards,<br>The LearnLink Team</p>
          </div>
        `;
    }
  }

  async sendWelcomeEmail(to, name) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: 'Welcome to LearnLink!',
      html: this.getEmailTemplate('welcome', { name })
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }
} 