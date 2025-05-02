import jwt from 'jsonwebtoken'
import User from '../models/userModel.js'
import config from '../config/env.js'

export class AuthService {
  generateToken(userId, email, role) {
    return jwt.sign(
      { 
        id: userId,
        user_id: userId,
        email,
        role
      }, 
      config.JWT_SECRET, 
      { expiresIn: '24h' }
    );
  }

  async login(email, password) {
    const user = await User.findByEmail(email)
    if (!user || !(await User.verifyPassword(user.password, password))) {
      throw new Error('Invalid email or password')
    }

    return {
      token: this.generateToken(user.user_id, user.email, user.role),
      user: {
        id: user.user_id,
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_pic: user.profile_pic
      }
    }
  }

  async register(userData) {
    const userExists = await User.findByEmail(userData.email)
    if (userExists) {
      throw new Error('User already exists')
    }

    const user = await User.create(userData)

    return {
      token: this.generateToken(user.user_id, user.email, user.role),
      user: {
        id: user.user_id,
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  }

  async createResetToken(email) {
    const user = await User.findByEmail(email)
    if (!user) {
      throw new Error('User not found')
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    await User.updateResetToken(email, code, expiry)

    return code
  }

  async resetPassword(email, code, newPassword) {
    const user = await User.findByEmail(email)

    if (!user || user.reset_token !== code || new Date() > user.reset_token_expiry) {
      throw new Error('Invalid or expired reset code')
    }

    await User.updatePassword(email, newPassword)
    
    await User.updateResetToken(email, null, null)
  }
} 