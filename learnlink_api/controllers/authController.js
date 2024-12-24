import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { createResponse } from '../utils/responseHelper.js'
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthController {
  constructor() {
    // Bind the methods to ensure 'this' context
    this.login = this.login.bind(this)
    this.signup = this.signup.bind(this)
    this.googleAuth = this.googleAuth.bind(this)
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
      console.log('Login attempt with:', { email, passwordLength: password?.length });

      // Find user by email
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('No user found with email:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if the stored password is already hashed (starts with $2a$ or $2b$)
      let isValidPassword = false;
      if (user.password.startsWith('$2')) {
        // Password is hashed, use bcrypt compare
        isValidPassword = await bcrypt.compare(password, user.password);
      } else {
        // Password is in plain text, do direct comparison and update to hashed if correct
        isValidPassword = password === user.password;
        if (isValidPassword) {
          // Update the plain text password to hashed version
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          await pool.query(
            'UPDATE users SET password = $1 WHERE user_id = $2',
            [hashedPassword, user.user_id]
          );
          console.log('Updated plain text password to hashed version');
        }
      }

      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      console.log('Login successful for user:', email);

      // Send successful response
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
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async googleAuth(req, res) {
    const { credential } = req.body;

    try {
      console.log('Received Google auth request with credential');

      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID is not set in environment variables');
        return res.status(500).json({
          success: false,
          message: 'Google authentication is not properly configured'
        });
      }

      // Verify the Google token
      console.log('Verifying Google token...');
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      console.log('Token verified, payload received');
      
      if (!payload) {
        console.error('No payload received from Google');
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token'
        });
      }

      const { email, name, sub: googleId } = payload;
      console.log('Processing sign-in for:', email);

      // Check if user exists
      let result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      let user = result.rows[0];

      if (!user) {
        console.log('Creating new user for:', email);
        // Create new user if doesn't exist
        result = await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, email, googleId, 'student'] // Using googleId as password for Google users
        );
        user = result.rows[0];
        console.log('New user created');
      } else {
        console.log('Existing user found');
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'learnlink',
        { expiresIn: '24h' }
      );

      console.log('Authentication successful for:', email);

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
      
      // More specific error messages based on the error type
      if (error.message.includes('Token used too late')) {
        return res.status(401).json({
          success: false,
          message: 'Authentication token expired. Please try again.'
        });
      }
      
      if (error.message.includes('invalid_token')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token. Please try again.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error processing Google sign-in'
      });
    }
  }
} 