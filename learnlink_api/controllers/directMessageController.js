import pool from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';

// Get all direct messages for the current user
export const getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.user_id;

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
      return res.json(existing.rows[0]);
    }

    // Create new conversation
    const query = `
      INSERT INTO direct_messages (user1_id, user2_id)
      VALUES ($1, $2)
      RETURNING id, user1_id, user2_id, created_at, updated_at
    `;
    const result = await pool.query(query, [userId, recipientId]);

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
    
    // First verify user has access to this conversation
    const accessQuery = `
      SELECT * FROM direct_messages
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `;
    const accessResult = await pool.query(accessQuery, [id, userId]);
    
    if (accessResult.rows.length === 0) {
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
      WHERE m.dm_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await pool.query(query, [id]);
    
    // Ensure we're sending an array and decrypt all messages
    const messagesArray = Array.isArray(result.rows) ? result.rows.map(msg => ({
      ...msg,
      content: decrypt(msg.content)
    })) : [];
    
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

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Message content is required'
      });
    }

    // Verify user is part of the conversation
    const conversationQuery = `
      SELECT * FROM direct_messages 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `;
    const conversationResult = await pool.query(conversationQuery, [id, userId]);
    
    if (conversationResult.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to send message in this conversation' });
    }

    // Get the recipient ID (the other user in the conversation)
    const recipientId = conversationResult.rows[0].user1_id === userId 
      ? conversationResult.rows[0].user2_id 
      : conversationResult.rows[0].user1_id;

    // Encrypt the message content
    const encryptedContent = encrypt(content.trim());

    // Insert the message
    const query = `
      INSERT INTO messages (content, sender_id, dm_id)
      VALUES ($1, $2, $3)
      RETURNING id, content, sender_id, created_at
    `;
    
    const result = await pool.query(query, [encryptedContent, userId, id]);
    
    // Get sender's name
    const userQuery = 'SELECT name FROM users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    // Decrypt the message for the response
    const message = {
      ...result.rows[0],
      content: decrypt(result.rows[0].content),
      sender_name: userResult.rows[0].name,
      dm_id: parseInt(id)
    };

    // Update the direct_messages updated_at timestamp
    await pool.query(
      'UPDATE direct_messages SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Create notification for the recipient
    const notificationQuery = `
      INSERT INTO notifications (
        sender_id,
        recipient_id,
        content,
        type,
        reference_id
      )
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(notificationQuery, [
      userId,
      recipientId,
      `${userResult.rows[0].name}: ${content.length > 30 ? content.substring(0, 30) + '...' : content}`,
      'private_message',
      message.id
    ]);
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending direct message:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send message',
      message: error.message 
    });
  }
};

// Delete a direct message conversation
export const deleteDirectMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // First verify user is part of the conversation
    const conversationQuery = `
      SELECT * FROM direct_messages 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `;
    const conversationResult = await pool.query(conversationQuery, [id, userId]);
    
    if (conversationResult.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to delete this conversation' });
    }

    // Delete all messages in the conversation
    await pool.query('DELETE FROM messages WHERE dm_id = $1', [id]);

    // Delete the conversation
    await pool.query('DELETE FROM direct_messages WHERE id = $1', [id]);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting direct message conversation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete conversation',
      message: error.message 
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { dmId } = req.params;
    const { content } = req.body;
    const userId = req.user.user_id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Message content is required'
      });
    }

    // Encrypt the message content
    const encryptedContent = encrypt(content.trim());

    const query = `
      INSERT INTO messages (content, sender_id, dm_id)
      VALUES ($1, $2, $3)
      RETURNING id, content, sender_id, created_at, dm_id
    `;

    const result = await pool.query(query, [encryptedContent, userId, dmId]);

    // Get sender's name
    const userQuery = 'SELECT name FROM users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    // Decrypt the message for the response
    const message = {
      ...result.rows[0],
      content: decrypt(result.rows[0].content),
      sender_name: userResult.rows[0].name
    };

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { dmId } = req.params;
    const userId = req.user.user_id;

    const query = `
      SELECT 
        m.id,
        m.content,
        m.sender_id,
        m.created_at,
        u.name as sender_name,
        m.dm_id
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.dm_id = $1
      ORDER BY m.created_at ASC
    `;

    const result = await pool.query(query, [dmId]);

    // Decrypt all message contents
    const messages = result.rows.map(msg => ({
      ...msg,
      content: decrypt(msg.content)
    }));

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch messages',
      data: []
    });
  }
}; 