import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT user_id as id, name, email, role FROM users WHERE user_id = $1',
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
    `SELECT user_id as id, name, email, role 
     FROM users 
     WHERE LOWER(name) LIKE LOWER($1)
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

  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create friend request
    const requestResult = await client.query(
      'INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2) RETURNING id',
      [senderId, userId]
    );
    
    const requestId = requestResult.rows[0].id;

    // Get sender's name for the notification
    const senderResult = await client.query(
      'SELECT name FROM users WHERE user_id = $1',
      [senderId]
    );
    
    const senderName = senderResult.rows[0].name;

    // Create notification
    await client.query(
      `INSERT INTO notifications 
        (sender_id, recipient_id, content, type, reference_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        senderId,
        userId,
        `${senderName} sent you a friend request`,
        'friend_request',
        requestId
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.user_id;
  
  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the request details
    const request = await client.query(
      'SELECT * FROM friend_requests WHERE id = $1 AND receiver_id = $2',
      [requestId, userId]
    );
    
    if (request.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    const { sender_id, receiver_id } = request.rows[0];
    
    // Create friendship
    const friendshipResult = await client.query(
      'INSERT INTO friendships (user1_id, user2_id) VALUES ($1, $2) RETURNING id',
      [sender_id, receiver_id]
    );

    const friendshipId = friendshipResult.rows[0].id;

    // Get names for notifications
    const namesResult = await client.query(
      'SELECT user_id, name FROM users WHERE user_id IN ($1, $2)',
      [sender_id, receiver_id]
    );
    
    const names = namesResult.rows.reduce((acc, curr) => {
      acc[curr.user_id] = curr.name;
      return acc;
    }, {});

    // Create notification for the request sender
    await client.query(
      `INSERT INTO notifications 
        (sender_id, recipient_id, content, type, reference_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        receiver_id,
        sender_id,
        `${names[receiver_id]} accepted your friend request`,
        'friend_accept',
        friendshipId
      ]
    );
    
    // Delete the request
    await client.query('DELETE FROM friend_requests WHERE id = $1', [requestId]);
    
    // Delete the original friend request notification
    await client.query(
      'DELETE FROM notifications WHERE type = $1 AND reference_id = $2',
      ['friend_request', requestId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const getFriendRequests = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const result = await pool.query(
    `SELECT fr.id, fr.sender_id, fr.created_at,
            u.name, u.email, u.role
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
    `SELECT u.user_id as id, u.name, u.email, u.role
     FROM friendships f
     JOIN users u ON (f.user1_id = u.user_id OR f.user2_id = u.user_id)
     WHERE (f.user1_id = $1 OR f.user2_id = $1)
     AND u.user_id != $1
     ORDER BY u.name`,
    [userId]
  );
  
  res.json(result.rows);
});

export const rejectFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.user_id;
  
  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the request details
    const request = await client.query(
      'SELECT * FROM friend_requests WHERE id = $1 AND receiver_id = $2',
      [requestId, userId]
    );
    
    if (request.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    const { sender_id } = request.rows[0];

    // Delete the request
    await client.query('DELETE FROM friend_requests WHERE id = $1', [requestId]);
    
    // Delete the notification
    await client.query(
      'DELETE FROM notifications WHERE type = $1 AND reference_id = $2',
      ['friend_request', requestId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const getSentFriendRequests = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const result = await pool.query(
    `SELECT fr.id, fr.receiver_id, fr.created_at,
            u.name, u.email, u.role
     FROM friend_requests fr
     JOIN users u ON fr.receiver_id = u.user_id
     WHERE fr.sender_id = $1
     ORDER BY fr.created_at DESC`,
    [userId]
  );
  
  res.json(result.rows);
});

export const removeFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.user_id;
  
  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if they are actually friends
    const existingFriendship = await client.query(
      'SELECT id FROM friendships WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
      [userId, friendId]
    );
    
    if (existingFriendship.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Friendship not found' });
    }

    // Delete the friendship
    await client.query(
      'DELETE FROM friendships WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
      [userId, friendId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}); 