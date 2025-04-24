import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

export const getAllMessages = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const result = await pool.query(
    'SELECT * FROM messages WHERE sender_id = $1 OR recipient_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  res.json(result.rows);
});

export const getMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  
  const result = await pool.query(
    'SELECT * FROM messages WHERE message_id = $1 AND (sender_id = $2 OR recipient_id = $2)',
    [id, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  res.json(result.rows[0]);
});

export const createMessage = asyncHandler(async (req, res) => {
  const { recipient_id, content } = req.body;
  const userId = req.user.user_id;
  
  const result = await pool.query(
    'INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *',
    [userId, recipient_id, content]
  );
  
  res.status(201).json(result.rows[0]);
});

export const updateMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  const { content } = req.body;
  
  const result = await pool.query(
    'UPDATE messages SET content = $1 WHERE message_id = $2 AND sender_id = $3 RETURNING *',
    [content, id, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Message not found or not authorized to update' });
  }
  
  res.json(result.rows[0]);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  
  const result = await pool.query(
    'DELETE FROM messages WHERE message_id = $1 AND sender_id = $2 RETURNING *',
    [id, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Message not found or not authorized to delete' });
  }
  
  res.json({ message: 'Message deleted successfully' });
});

export const getUserMessageStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get counts of messages sent by the current user, categorized by type
    const result = await pool.query(`
      SELECT 
        COUNT(CASE WHEN dm_id IS NOT NULL THEN 1 ELSE NULL END) as direct_messages,
        COUNT(CASE WHEN chatroom_id IS NOT NULL THEN 1 ELSE NULL END) as group_messages
      FROM messages
      WHERE sender_id = $1
    `, [userId]);
    
    res.json(result.rows[0] || { direct_messages: 0, group_messages: 0 });
  } catch (error) {
    console.error('Error fetching user message statistics:', error);
    res.status(500).json({ message: 'Failed to fetch user message statistics' });
  }
});