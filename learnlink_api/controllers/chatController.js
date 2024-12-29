import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

export const getAllChats = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const result = await pool.query(
    'SELECT * FROM chats WHERE user_id = $1 OR recipient_id = $1',
    [userId]
  );
  res.json(result.rows);
});

export const getChat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  
  const result = await pool.query(
    'SELECT * FROM chats WHERE chat_id = $1 AND (user_id = $2 OR recipient_id = $2)',
    [id, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  
  res.json(result.rows[0]);
});

export const createChat = asyncHandler(async (req, res) => {
  const { recipient_id } = req.body;
  const userId = req.user.user_id;
  
  const result = await pool.query(
    'INSERT INTO chats (user_id, recipient_id) VALUES ($1, $2) RETURNING *',
    [userId, recipient_id]
  );
  
  res.status(201).json(result.rows[0]);
});

export const updateChat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  const { last_message } = req.body;
  
  const result = await pool.query(
    'UPDATE chats SET last_message = $1 WHERE chat_id = $2 AND (user_id = $3 OR recipient_id = $3) RETURNING *',
    [last_message, id, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  
  res.json(result.rows[0]);
});

export const deleteChat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  
  const result = await pool.query(
    'DELETE FROM chats WHERE chat_id = $1 AND (user_id = $2 OR recipient_id = $2) RETURNING *',
    [id, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  
  res.json({ message: 'Chat deleted successfully' });
}); 