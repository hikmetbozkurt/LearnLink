import pool from '../config/database.js';

// Get all direct messages for the current user
export const getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.user_id;
    console.log('Fetching direct messages for user:', userId);

    const query = `
      SELECT 
        dm.id,
        dm.created_at,
        dm.updated_at,
        CASE 
          WHEN dm.user1_id = $1 THEN u2.name
          ELSE u1.name
        END as name,
        CASE 
          WHEN dm.user1_id = $1 THEN u2.user_id
          ELSE u1.user_id
        END as other_user_id
      FROM direct_messages dm
      JOIN users u1 ON dm.user1_id = u1.user_id
      JOIN users u2 ON dm.user2_id = u2.user_id
      WHERE dm.user1_id = $1 OR dm.user2_id = $1
      ORDER BY dm.updated_at DESC
    `;
    const result = await pool.query(query, [userId]);
    console.log('Found direct messages:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting direct messages:', error);
    res.status(500).json({ message: 'Error getting direct messages', error: error.message });
  }
};

// Create a new direct message conversation
export const createDirectMessage = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.user_id;
    console.log('Creating direct message:', { userId, recipientId });

    // Check if conversation already exists
    const checkQuery = `
      SELECT dm.*, 
        CASE 
          WHEN dm.user1_id = $1 THEN u2.name
          ELSE u1.name
        END as name
      FROM direct_messages dm
      JOIN users u1 ON dm.user1_id = u1.user_id
      JOIN users u2 ON dm.user2_id = u2.user_id
      WHERE (dm.user1_id = $1 AND dm.user2_id = $2) 
      OR (dm.user1_id = $2 AND dm.user2_id = $1)
    `;
    const existing = await pool.query(checkQuery, [userId, recipientId]);
    
    if (existing.rows.length > 0) {
      console.log('Found existing conversation:', existing.rows[0].id);
      return res.json(existing.rows[0]);
    }

    // Create new conversation
    const query = `
      INSERT INTO direct_messages (user1_id, user2_id)
      VALUES ($1, $2)
      RETURNING id, user1_id, user2_id, created_at, updated_at
    `;
    const result = await pool.query(query, [userId, recipientId]);
    console.log('Created new conversation:', result.rows[0].id);

    // Get recipient's name for the response
    const userQuery = 'SELECT name FROM users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [recipientId]);
    
    const response = {
      ...result.rows[0],
      name: userResult.rows[0].name
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating direct message:', error);
    res.status(500).json({ message: 'Error creating direct message', error: error.message });
  }
};

// Get a specific direct message conversation
export const getDirectMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    const query = `
      SELECT dm.*, 
        CASE 
          WHEN dm.user1_id = $1 THEN u2.username
          ELSE u1.username
        END as name
      FROM direct_messages dm
      JOIN users u1 ON dm.user1_id = u1.user_id
      JOIN users u2 ON dm.user2_id = u2.user_id
      WHERE dm.id = $2 AND (dm.user1_id = $1 OR dm.user2_id = $1)
    `;
    const result = await pool.query(query, [userId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Direct message not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting direct message:', error);
    res.status(500).json({ message: 'Error getting direct message' });
  }
};

// Get messages for a specific direct message conversation
export const getDirectMessageMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    console.log('Fetching messages for conversation:', id);
    
    // First verify user has access to this conversation
    const accessQuery = `
      SELECT * FROM direct_messages
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `;
    const accessResult = await pool.query(accessQuery, [id, userId]);
    
    if (accessResult.rows.length === 0) {
      console.log('Access denied for user:', userId);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
      SELECT 
        m.id,
        m.content,
        m.sender_id,
        m.created_at,
        u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.direct_message_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await pool.query(query, [id]);
    console.log('Found messages:', result.rows.length);
    
    // Ensure we're sending an array
    const messagesArray = Array.isArray(result.rows) ? result.rows : [];
    
    res.json({
      success: true,
      data: messagesArray,
      message: messagesArray.length ? 'Messages fetched successfully' : 'No messages found'
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch messages',
      message: error.message,
      data: [] // Return empty array on error
    });
  }
};

// Send a message in a direct message conversation
export const sendDirectMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.user_id;

    // Verify user is part of the conversation
    const conversationQuery = `
      SELECT * FROM direct_messages 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `;
    const conversationResult = await pool.query(conversationQuery, [id, userId]);
    
    if (conversationResult.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to send message in this conversation' });
    }

    // Insert the message
    const query = `
      INSERT INTO direct_message_messages (direct_message_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        content,
        sender_id,
        created_at,
        (SELECT name FROM users WHERE user_id = $2) as sender_name
    `;
    
    const result = await pool.query(query, [id, userId, content]);
    const message = result.rows[0];
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending direct message:', error);
    res.status(500).json({ message: 'Error sending direct message', error: error.message });
  }
}; 