import pool from '../config/database.js';

export class MessageController {
  async sendMessage(req, res) {
    try {
      const { sender_id, receiver_id, content, sender_name } = req.body;
      console.log('Sending message:', { sender_id, receiver_id, content, sender_name });

      // Verify the sender is the authenticated user
      if (sender_id !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to send message as this user'
        });
      }

      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, content, read) 
         VALUES ($1, $2, $3, $4) 
         RETURNING message_id, sender_id, receiver_id, content, created_at, read`,
        [sender_id, receiver_id, content, false]
      );

      // Add sender name to the response
      const messageData = {
        ...result.rows[0],
        sender_name: req.user.name
      };

      console.log('Message saved:', messageData);

      res.json({
        success: true,
        data: messageData
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }

  async getMessages(req, res) {
    try {
      const { user_id, other_user_id } = req.params;
      console.log('Fetching messages between:', { user_id, other_user_id });

      const result = await pool.query(
        `SELECT 
          m.message_id,
          m.sender_id,
          m.receiver_id,
          m.content,
          m.created_at as timestamp,
          m.read,
          u.name as sender_name
         FROM messages m 
         JOIN users u ON m.sender_id = u.user_id 
         WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
         OR (m.sender_id = $2 AND m.receiver_id = $1) 
         ORDER BY m.created_at ASC`,
        [user_id, other_user_id]
      );

      // Format the timestamps
      const formattedMessages = result.rows.map(message => ({
        ...message,
        timestamp: new Date(message.timestamp).toISOString()
      }));

      console.log('Found messages:', formattedMessages);

      res.json({
        success: true,
        data: formattedMessages
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        error: error.message
      });
    }
  }
}