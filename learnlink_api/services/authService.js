import jwt from 'jsonwebtoken'
import User from '../models/userModel.js'
import config from '../config/env.js'

export class AuthService {
  generateToken(userId) {
    return jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: '24h' })
  }

  async login(email, password) {
    const user = await User.findByEmail(email)
    if (!user || !(await User.verifyPassword(user.password_hash, password))) {
      throw new Error('Invalid email or password')
    }

    return {
      token: this.generateToken(user.user_id),
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_pic: user.profile_pic,
        notification_pref: user.notification_pref,
        created_at: user.created_at,
        updated_at: user.updated_at
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
      token: this.generateToken(user.user_id),
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  }

  async createResetToken(email) {
    const user = await User.findByEmail(email)
    if (!user) {
      throw new Error('User not found')
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString()
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
  }
} 