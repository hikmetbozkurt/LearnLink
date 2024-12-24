import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { createResponse } from '../utils/responseHelper.js'

export class AuthController {
  constructor() {
    // Bind the methods to ensure 'this' context
    this.login = this.login.bind(this)
    this.signup = this.signup.bind(this)
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
} 