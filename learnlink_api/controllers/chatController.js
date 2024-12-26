import pool from '../config/database.js';

export class ChatController {
  constructor() {
    // Bind methods
    this.getMessages = this.getMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.getChatRooms = this.getChatRooms.bind(this);
    this.createChatRoom = this.createChatRoom.bind(this);
  }

  // Get messages for a specific chat room
  async getMessages(req, res) {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    try {
      const result = await pool.query(
        `SELECT m.*, u.name as sender_name 
         FROM messages m 
         JOIN users u ON m.sender_id = u.user_id 
         WHERE m.room_id = $1 
         ORDER BY m.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [roomId, limit, offset]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages'
      });
    }
  }

  // Send a new message
  async sendMessage(req, res) {
    const { room_id, sender_id, content } = req.body;

    try {
      const result = await pool.query(
        'INSERT INTO messages (room_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
        [room_id, sender_id, content]
      );

      // Get sender information
      const userResult = await pool.query(
        'SELECT name FROM users WHERE user_id = $1',
        [sender_id]
      );

      const message = {
        ...result.rows[0],
        sender_name: userResult.rows[0].name
      };

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  }

  // Get all chat rooms for a user
  async getChatRooms(req, res) {
    const { userId } = req.params;

    try {
      const result = await pool.query(
        `SELECT cr.*, 
         (SELECT COUNT(*) FROM chat_room_participants WHERE room_id = cr.room_id) as participant_count
         FROM chat_rooms cr
         JOIN chat_room_participants crp ON cr.room_id = crp.room_id
         WHERE crp.user_id = $1`,
        [userId]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get chat rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat rooms'
      });
    }
  }

  // Create a new chat room
  async createChatRoom(req, res) {
    const { name, creator_id, participant_ids } = req.body;

    try {
      // Start transaction
      await pool.query('BEGIN');

      // Create chat room
      const roomResult = await pool.query(
        'INSERT INTO chat_rooms (name, creator_id) VALUES ($1, $2) RETURNING *',
        [name, creator_id]
      );

      const roomId = roomResult.rows[0].room_id;

      // Add participants
      const participantValues = [creator_id, ...participant_ids]
        .map((id) => `(${roomId}, ${id})`).join(',');

      await pool.query(
        `INSERT INTO chat_room_participants (room_id, user_id) VALUES ${participantValues}`
      );

      await pool.query('COMMIT');

      res.status(201).json({
        success: true,
        data: roomResult.rows[0]
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Create chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat room'
      });
    }
  }
} 