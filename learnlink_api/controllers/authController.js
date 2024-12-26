import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { createResponse } from '../utils/responseHelper.js'
import { OAuth2Client } from 'google-auth-library'
import { EmailService } from '../services/emailService.js'
import crypto from 'crypto';
import config from '../config/env.js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Store verification codes in memory (will be cleared on server restart)
const verificationCodes = new Map();

// Replace bcrypt password hashing with crypto
const hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
};

const verifyPassword = async (password, hash) => {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
};

export class AuthController {
  constructor() {
    // Bind existing methods
    this.login = this.login.bind(this)
    this.signup = this.signup.bind(this)
    this.googleAuth = this.googleAuth.bind(this)
    
    // Bind new methods
    this.forgotPassword = this.forgotPassword.bind(this)
    this.verifyResetCode = this.verifyResetCode.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
    
    this.emailService = new EmailService()
  }

  async signup(req, res) {
    const { username, email, password } = req.body;

    try {
      // Check if user already exists
      const userExists = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, email, name, role',
        [username, email, hashedPassword, 'student']
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'learnlink',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.user_id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'EMAIL_NOT_FOUND',
          message: 'Email is not registered'
        });
      }

      // Always use bcrypt.compare for password verification
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password verification result:', isValidPassword);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        });
      }

      // Use process.env.JWT_SECRET directly or config.JWT_SECRET consistently
      const token = jwt.sign(
        { 
          id: user.user_id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'learnlink',
        { 
          expiresIn: '24h' 
        }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Server error occurred'
      });
    }
  }

  async googleAuth(req, res) {
    const { credential } = req.body;

    try {
      // Verify the Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token'
        });
      }

      const { email, name, sub: googleId } = payload;

      // Check if user exists
      let result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      let user = result.rows[0];

      if (!user) {
        // Create new user if doesn't exist
        result = await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, email, googleId, 'student'] // Using googleId as password for Google users
        );
        user = result.rows[0];
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'learnlink',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.user_id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing Google sign-in'
      });
    }
  }

  async forgotPassword(req, res) {
    const { email } = req.body;
    
    console.log('Received forgot password request for email:', email);

    try {
      // Check if user exists
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      console.log('Database query result:', result.rows);

      if (!result.rows.length) {
        console.log('No user found with email:', email);
        return res.status(404).json({
          success: false,
          error: 'EMAIL_NOT_FOUND',
          message: 'Email is not registered'
        });
      }

      // Generate a random 6-digit code (instead of 4-digit)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated verification code:', verificationCode);
      
      // Store the code with expiration (10 minutes)
      verificationCodes.set(email, {
        code: verificationCode,
        expires: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // Send email with verification code
      await this.emailService.sendVerificationCode(email, verificationCode);

      console.log('Verification code sent successfully');

      res.json({
        success: true,
        message: 'Password reset code sent to email'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to process password reset request'
      });
    }
  }

  async verifyResetCode(req, res) {
    const { email, code } = req.body;

    try {
      const storedData = verificationCodes.get(email);
      
      if (!storedData || 
          storedData.code !== code || 
          Date.now() > storedData.expires) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CODE',
          message: 'Invalid or expired verification code'
        });
      }

      res.json({
        success: true,
        message: 'Code verified successfully'
      });

    } catch (error) {
      console.error('Code verification error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to verify code'
      });
    }
  }

  async resetPassword(req, res) {
    const { email, code, newPassword } = req.body;
    console.log('Reset password request received:', { email, code, passwordLength: newPassword?.length });

    try {
      const storedData = verificationCodes.get(email);
      
      if (!storedData || 
          storedData.code !== code || 
          Date.now() > storedData.expires) {
        console.log('Invalid or expired code for email:', email);
        return res.status(400).json({
          success: false,
          error: 'INVALID_CODE',
          message: 'Invalid or expired verification code'
        });
      }

      // Hash new password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      console.log('Password hashed successfully');

      // Update password with explicit WHERE clause and RETURNING
      const updateQuery = `
        UPDATE users 
        SET password = $1 
        WHERE email = $2 
        RETURNING user_id, email`;
      
      console.log('Executing update query for email:', email);
      const result = await pool.query(updateQuery, [hashedPassword, email]);

      if (!result.rows.length) {
        console.error('No user found to update password for email:', email);
        throw new Error('Failed to update password - user not found');
      }

      console.log('Password updated in database for user:', result.rows[0]);

      // Clear the verification code
      verificationCodes.delete(email);
      console.log('Verification code cleared from memory');

      // Verify the update worked by checking the new password
      const verifyQuery = 'SELECT password FROM users WHERE email = $1';
      const verifyResult = await pool.query(verifyQuery, [email]);
      
      if (verifyResult.rows.length) {
        const isPasswordUpdated = await bcrypt.compare(newPassword, verifyResult.rows[0].password);
      }

      res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to reset password: ' + error.message
      });
    }
  }
} 