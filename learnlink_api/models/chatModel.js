import db from '../config/database.js'

class Chat {
  static async createChatroom(courseId, chatType) {
    const result = await db.query(
      `INSERT INTO chatrooms (course_id, chat_type) 
       VALUES ($1, $2) RETURNING *`,
      [courseId, chatType]
    )
    return result.rows[0]
  }

  static async getChatrooms(courseId) {
    const result = await db.query(
      `SELECT c.*, 
       (SELECT COUNT(*) FROM user_chatrooms uc WHERE uc.chatroom_id = c.chatroom_id) as member_count,
       (SELECT COUNT(*) FROM messages m WHERE m.chatroom_id = c.chatroom_id) as message_count
       FROM chatrooms c 
       WHERE c.course_id = $1 
       ORDER BY c.created_at DESC`,
      [courseId]
    )
    return result.rows
  }

  static async addUserToChatroom(userId, chatroomId) {
    const result = await db.query(
      `INSERT INTO user_chatrooms (user_id, chatroom_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, chatroom_id) DO NOTHING 
       RETURNING *`,
      [userId, chatroomId]
    )
    return result.rows[0]
  }

  static async getMessages(chatroomId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT m.*, u.name as sender_name 
       FROM messages m 
       JOIN users u ON m.sender_id = u.user_id 
       WHERE m.chatroom_id = $1 
       ORDER BY m.timestamp DESC 
       LIMIT $2 OFFSET $3`,
      [chatroomId, limit, offset]
    )
    return result.rows
  }

  static async sendMessage(chatroomId, senderId, content) {
    const result = await db.query(
      `INSERT INTO messages (chatroom_id, sender_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [chatroomId, senderId, content]
    )
    return result.rows[0]
  }

  static async updateLastRead(userId, chatroomId) {
    await db.query(
      `UPDATE user_chatrooms 
       SET last_read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND chatroom_id = $2`,
      [userId, chatroomId]
    )
  }

  static async getUnreadCount(userId, chatroomId) {
    const result = await db.query(
      `SELECT COUNT(*) FROM messages m 
       WHERE m.chatroom_id = $1 
       AND m.timestamp > (
         SELECT last_read_at 
         FROM user_chatrooms 
         WHERE user_id = $2 AND chatroom_id = $1
       )`,
      [chatroomId, userId]
    )
    return parseInt(result.rows[0].count)
  }
}

export default Chat 