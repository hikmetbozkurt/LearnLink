import db from '../config/database.js'

class Role {
  static async create(data) {
    const { role_name, permissions } = data
    const result = await db.query(
      'INSERT INTO roles (role_name, permissions) VALUES ($1, $2) RETURNING *',
      [role_name, permissions]
    )
    return result.rows[0]
  }

  static async findById(roleId) {
    const result = await db.query(
      'SELECT * FROM roles WHERE role_id = $1',
      [roleId]
    )
    return result.rows[0]
  }

  static async findByName(roleName) {
    const result = await db.query(
      'SELECT * FROM roles WHERE role_name = $1',
      [roleName]
    )
    return result.rows[0]
  }

  static async assignToUser(userId, roleId) {
    const result = await db.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) RETURNING *',
      [userId, roleId]
    )
    return result.rows[0]
  }

  static async getUserRoles(userId) {
    const result = await db.query(
      `SELECT r.* FROM roles r 
       JOIN user_roles ur ON r.role_id = ur.role_id 
       WHERE ur.user_id = $1`,
      [userId]
    )
    return result.rows
  }

  static async removeFromUser(userId, roleId) {
    await db.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    )
  }
}

export default Role 