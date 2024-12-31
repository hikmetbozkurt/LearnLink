import db from '../config/database.js'
import bcrypt from 'bcryptjs'

class User {
  static async findById(user_id) {
    const result = await db.query(
      `SELECT user_id, name, email, role, profile_pic, 
       notification_pref, security_setting, last_login, is_active,
       created_at, updated_at 
       FROM users WHERE user_id = $1`,
      [user_id]
    )
    return result.rows[0]
  }

  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    )
    return result.rows[0]
  }

  static async create(userData) {
    const { name, email, password, role = 'student' } = userData
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const result = await db.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, name, email, role, created_at`,
      [name, email, hashedPassword, role]
    )
    return result.rows[0]
  }

  static async updateProfile(userId, updateData) {
    const allowedUpdates = ['name', 'profile_pic', 'notification_pref', 'security_setting']
    const updates = []
    const values = []
    let paramCount = 1

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedUpdates.includes(key)) {
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (updates.length === 0) return null

    values.push(userId)
    const result = await db.query(
      `UPDATE users 
       SET ${updates.join(', ')} 
       WHERE user_id = $${paramCount} 
       RETURNING user_id, name, email, role, profile_pic, notification_pref, security_setting`,
      values
    )
    return result.rows[0]
  }

  static async updatePassword(email, password) {
    const hashedPassword = await bcrypt.hash(password, 10)
    await db.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    )
  }

  static async verifyPassword(stored_password, input_password) {
    return bcrypt.compare(input_password, stored_password)
  }

  static async updateLastLogin(userId) {
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    )
  }

  static async deactivateAccount(userId) {
    await db.query(
      'UPDATE users SET is_active = false WHERE user_id = $1',
      [userId]
    )
  }

  static async getUserRoles(userId) {
    const result = await db.query(
      `SELECT r.role_name, r.permissions 
       FROM roles r 
       JOIN user_roles ur ON r.role_id = ur.role_id 
       WHERE ur.user_id = $1`,
      [userId]
    )
    return result.rows
  }

  static async updateResetToken(email, code, expiry) {
    const result = await db.query(
      `UPDATE users 
       SET reset_token = $1, 
           reset_token_expiry = $2 
       WHERE email = $3 
       RETURNING user_id`,
      [code, expiry, email]
    );
    return result.rows[0];
  }
}

export default User 