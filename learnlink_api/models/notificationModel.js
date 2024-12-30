import db from '../config/database.js'

class Notification {
  static async create(data) {
    const { user_id, type, content } = data
    const result = await db.query(
      `INSERT INTO notifications 
       (user_id, type, content, timestamp, status) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'unread') RETURNING *`,
      [user_id, type, content]
    )
    return result.rows[0]
  }

  static async findByUser(userId) {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    )
    return result.rows
  }

  static async markAsRead(notificationId) {
    const result = await db.query(
      `UPDATE notifications 
       SET status = 'read', read_at = CURRENT_TIMESTAMP 
       WHERE notification_id = $1 RETURNING *`,
      [notificationId]
    )
    return result.rows[0]
  }

  static async markAllAsRead(userId) {
    const result = await db.query(
      `UPDATE notifications 
       SET status = 'read', read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND status = 'unread' RETURNING *`,
      [userId]
    )
    return result.rows
  }

  static async clearAll(userId) {
    const result = await db.query(
      'DELETE FROM notifications WHERE user_id = $1 RETURNING *',
      [userId]
    )
    return result.rows
  }

  static async getUnreadCount(userId) {
    const result = await db.query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND status = 'unread'",
      [userId]
    )
    return parseInt(result.rows[0].count)
  }
}

export default Notification 