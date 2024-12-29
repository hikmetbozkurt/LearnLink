import { AuthService } from '../services/authService.js';
import { EmailService } from '../services/emailService.js';
import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

const authService = new AuthService();
const emailService = new EmailService();

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { token, user } = await authService.login(email, password);
    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

export const register = asyncHandler(async (req, res) => {
  const { email, password, username, first_name, last_name } = req.body;

  if (!email || !password || !username || !first_name || !last_name) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const { token, user } = await authService.register({
      email,
      password,
      username,
      first_name,
      last_name,
      role: 'user'
    });

    res.status(201).json({ token, user });
  } catch (error) {
    if (error.message === 'User already exists') {
      res.status(409).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error creating user' });
    }
  }
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT user_id, email, username, first_name, last_name, role, profile_picture
       FROM users 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.user_id,
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      profile_picture: user.profile_picture
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const code = await authService.createResetToken(email);
    await emailService.sendVerificationCode(email, code);
    res.json({ message: 'Reset code sent successfully' });
  } catch (error) {
    if (error.message === 'User not found') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error sending reset code' });
    }
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await authService.resetPassword(email, code, newPassword);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error.message === 'Invalid or expired reset code') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error resetting password' });
    }
  }
}); 