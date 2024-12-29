import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT user_id as id, username, email, first_name, last_name, profile_picture FROM users WHERE user_id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json(result.rows[0]);
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.params;
  const searchQuery = `%${query}%`;
  const currentUserId = req.user.user_id;
  
  const result = await pool.query(
    `SELECT user_id as id, username, email, first_name, last_name, profile_picture 
     FROM users 
     WHERE (LOWER(first_name || ' ' || last_name) LIKE LOWER($1) 
     OR LOWER(username) LIKE LOWER($1))
     AND user_id != $2
     LIMIT 10`,
    [searchQuery, currentUserId]
  );
  
  res.json(result.rows);
});

export const sendFriendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const senderId = req.user.user_id;

  // Don't allow sending request to self
  if (senderId === parseInt(userId)) {
    return res.status(400).json({ message: 'Cannot send friend request to yourself' });
  }
  
  // Check if request already exists
  const existingRequest = await pool.query(
    'SELECT * FROM friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
    [senderId, userId]
  );
  
  if (existingRequest.rows.length > 0) {
    return res.status(400).json({ message: 'Friend request already exists' });
  }
  
  // Check if they are already friends
  const existingFriendship = await pool.query(
    'SELECT * FROM friendships WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
    [senderId, userId]
  );
  
  if (existingFriendship.rows.length > 0) {
    return res.status(400).json({ message: 'Users are already friends' });
  }
  
  await pool.query(
    'INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2)',
    [senderId, userId]
  );
  
  res.status(201).json({ message: 'Friend request sent successfully' });
});

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.user_id;
  
  const request = await pool.query(
    'SELECT * FROM friend_requests WHERE id = $1 AND receiver_id = $2',
    [requestId, userId]
  );
  
  if (request.rows.length === 0) {
    return res.status(404).json({ message: 'Friend request not found' });
  }
  
  const { sender_id, receiver_id } = request.rows[0];
  
  // Create friendship
  await pool.query(
    'INSERT INTO friendships (user1_id, user2_id) VALUES ($1, $2)',
    [sender_id, receiver_id]
  );
  
  // Delete the request
  await pool.query('DELETE FROM friend_requests WHERE id = $1', [requestId]);
  
  res.json({ message: 'Friend request accepted' });
});

export const getFriendRequests = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const result = await pool.query(
    `SELECT fr.id, fr.sender_id, fr.created_at,
            u.username, u.first_name, u.last_name, u.profile_picture
     FROM friend_requests fr
     JOIN users u ON fr.sender_id = u.user_id
     WHERE fr.receiver_id = $1
     ORDER BY fr.created_at DESC`,
    [userId]
  );
  
  res.json(result.rows);
});

export const getFriends = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const result = await pool.query(
    `SELECT u.user_id as id, u.username, u.first_name, u.last_name, u.profile_picture
     FROM friendships f
     JOIN users u ON (f.user1_id = u.user_id OR f.user2_id = u.user_id)
     WHERE (f.user1_id = $1 OR f.user2_id = $1)
     AND u.user_id != $1
     ORDER BY u.first_name, u.last_name`,
    [userId]
  );
  
  res.json(result.rows);
}); 