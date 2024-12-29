import db from '../config/database.js';

class ChatRoom {
  static async getAll() {
    try {
      const result = await db.query(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.created_at,
          c.updated_at,
          u.name as creator_name,
          u.user_id as creator_id,
          COUNT(DISTINCT cm.user_id) as member_count,
          (
            SELECT json_build_object(
              'id', m.id,
              'content', m.content,
              'created_at', m.created_at,
              'sender_name', us.name
            )
            FROM messages m
            JOIN users us ON m.sender_id = us.user_id
            WHERE m.chatroom_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message
        FROM chatrooms c
        LEFT JOIN users u ON c.created_by = u.user_id
        LEFT JOIN chatroom_members cm ON c.id = cm.chatroom_id
        GROUP BY c.id, u.user_id, u.name
        ORDER BY c.created_at DESC
      `);
      
      console.log('Raw database result:', result);
      console.log('Fetched chatrooms:', result.rows);

      // Ensure we return an array
      return result.rows || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async create({ name, description, createdBy }) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('Creating chatroom with params:', { name, description, createdBy });

      // Create the chatroom
      const result = await client.query(
        `INSERT INTO chatrooms (name, description, created_by) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, description, created_by, created_at, updated_at`,
        [name, description, createdBy]
      );

      const chatroom = result.rows[0];
      
      if (!chatroom) {
        throw new Error('Failed to create chatroom record');
      }
      
      console.log('Created chatroom:', chatroom);

      // Add creator as a member
      await client.query(
        `INSERT INTO chatroom_members (chatroom_id, user_id) 
         VALUES ($1, $2)`,
        [chatroom.id, createdBy]
      );

      // Get creator's information
      const userResult = await client.query(
        'SELECT name FROM users WHERE user_id = $1',
        [createdBy]
      );

      await client.query('COMMIT');

      // Return chatroom with additional info
      return {
        ...chatroom,
        creator_name: userResult.rows[0]?.name,
        member_count: 1,
        last_message: null
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in create chatroom:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async addMember(chatroomId, userId) {
    try {
      // First check if chatroom exists
      const chatroomExists = await db.query(
        'SELECT id FROM chatrooms WHERE id = $1',
        [chatroomId]
      );

      if (chatroomExists.rows.length === 0) {
        throw new Error('Chatroom not found');
      }

      // Then add member
      await db.query(
        `INSERT INTO chatroom_members (chatroom_id, user_id) 
         VALUES ($1, $2) 
         ON CONFLICT (chatroom_id, user_id) DO NOTHING`,
        [chatroomId, userId]
      );
    } catch (error) {
      console.error('Error in addMember:', error);
      throw error;
    }
  }

  static async getMessages(chatroomId) {
    try {
      const result = await db.query(
        `SELECT 
          m.id,
          m.content,
          m.created_at,
          m.sender_id,
          u.name as sender_name,
          u.email as sender_email
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE m.chatroom_id = $1
        ORDER BY m.created_at ASC`,
        [chatroomId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  }

  static async createMessage({ chatroomId, senderId, content }) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      // First verify the sender is a member of the chatroom
      const memberCheck = await client.query(
        'SELECT 1 FROM chatroom_members WHERE chatroom_id = $1 AND user_id = $2',
        [chatroomId, senderId]
      );

      if (memberCheck.rows.length === 0) {
        throw new Error('User is not a member of this chatroom');
      }

      // Create the message
      const result = await client.query(
        `INSERT INTO messages (chatroom_id, sender_id, content) 
         VALUES ($1, $2, $3) 
         RETURNING id, chatroom_id, sender_id, content, created_at`,
        [chatroomId, senderId, content]
      );

      // Get sender information
      const userResult = await client.query(
        'SELECT name, email FROM users WHERE user_id = $1',
        [senderId]
      );

      await client.query('COMMIT');

      // Return message with sender info
      return {
        ...result.rows[0],
        sender_name: userResult.rows[0]?.name,
        sender_email: userResult.rows[0]?.email
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in createMessage:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(chatroomId) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      // Delete messages first (due to foreign key constraints)
      await client.query(
        'DELETE FROM messages WHERE chatroom_id = $1',
        [chatroomId]
      );

      // Delete chatroom members
      await client.query(
        'DELETE FROM chatroom_members WHERE chatroom_id = $1',
        [chatroomId]
      );

      // Finally delete the chatroom
      const result = await client.query(
        'DELETE FROM chatrooms WHERE id = $1 RETURNING *',
        [chatroomId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in delete chatroom:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default ChatRoom; 