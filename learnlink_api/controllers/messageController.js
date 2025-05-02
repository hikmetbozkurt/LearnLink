import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

export const getAllMessages = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const result = await pool.query(
    `SELECT m.* FROM messages m
     LEFT JOIN direct_messages dm ON m.dm_id = dm.id
     WHERE m.sender_id = $1 
     OR (m.dm_id IS NOT NULL AND (dm.user1_id = $1 OR dm.user2_id = $1))
     OR m.chatroom_id IN (
        SELECT chatroom_id FROM chatroom_members WHERE user_id = $1
     )
     ORDER BY m.created_at DESC`,
    [userId]
  );
  res.json(result.rows);
});

export const getMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  
  const result = await pool.query(
    `SELECT m.* FROM messages m
     LEFT JOIN direct_messages dm ON m.dm_id = dm.id
     WHERE m.id = $1 AND (
        m.sender_id = $2 
        OR (m.dm_id IS NOT NULL AND (dm.user1_id = $2 OR dm.user2_id = $2))
        OR m.chatroom_id IN (
           SELECT chatroom_id FROM chatroom_members WHERE user_id = $2
        )
     )`,
    [id, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  res.json(result.rows[0]);
});

export const createMessage = asyncHandler(async (req, res) => {
  const { chatroom_id, dm_id, content } = req.body;
  const userId = req.user.user_id;
  
  // Validate that either chatroom_id or dm_id is provided
  if (!chatroom_id && !dm_id) {
    return res.status(400).json({ message: 'Either chatroom_id or dm_id must be provided' });
  }
  
  const result = await pool.query(
    'INSERT INTO messages (sender_id, chatroom_id, dm_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, chatroom_id || null, dm_id || null, content]
  );
  
  res.status(201).json(result.rows[0]);
});

export const updateMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  const { content } = req.body;
  
  const result = await pool.query(
    'UPDATE messages SET content = $1 WHERE id = $2 AND sender_id = $3 RETURNING *',
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
    'DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING *',
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

export const getUserMessageStatsByUserId = asyncHandler(async (req, res) => {
  try {
    let { userId } = req.params;
    
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Convert userId to number if it's a string
    if (typeof userId === 'string') {
      userId = parseInt(userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
    }

    // Get total message count for the user (sent messages and received messages in DMs)
    const query = `
      SELECT 
        COUNT(*) as total
      FROM messages m
      LEFT JOIN direct_messages dm ON m.dm_id = dm.id
      WHERE m.sender_id = $1 
      OR (m.dm_id IS NOT NULL AND (dm.user1_id = $1 OR dm.user2_id = $1))
      OR m.chatroom_id IN (
         SELECT chatroom_id FROM chatroom_members WHERE user_id = $1
      )
    `;
    
    
    const result = await pool.query(query, [userId]);
    
    const total = parseInt(result.rows[0]?.total || 0);
    
    res.json({ 
      total: total
    });
  } catch (error) {
    console.error('Error fetching user message statistics by userId:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch user message statistics',
      error: error.message,
      stack: error.stack
    });
  }
});