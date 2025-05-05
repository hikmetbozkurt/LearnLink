import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import path from 'path';
import fs from 'fs';
import { memoryUpload } from '../middleware/uploadMiddleware.js';

export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT user_id as id, name, email, role, profile_pic FROM users WHERE user_id = $1',
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

export const uploadProfilePicture = asyncHandler(async (req, res) => {
  const uploadSingle = memoryUpload.single('profilePic');
  
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: err.message || 'Error uploading file' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const userId = req.user.user_id;
      const imageData = req.file.buffer;
      const mimeType = req.file.mimetype;
      
      
      // Check if user already has a profile picture
      const existingPic = await client.query(
        'SELECT id FROM user_profile_pictures WHERE user_id = $1',
        [userId]
      );
      
      let profilePicId;
      
      if (existingPic.rows.length > 0) {
        // Update existing profile picture
        const updateResult = await client.query(
          'UPDATE user_profile_pictures SET image_data = $1, mime_type = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 RETURNING id',
          [imageData, mimeType, userId]
        );
        profilePicId = updateResult.rows[0].id;
      } else {
        // Insert new profile picture
        const insertResult = await client.query(
          'INSERT INTO user_profile_pictures (user_id, image_data, mime_type) VALUES ($1, $2, $3) RETURNING id',
          [userId, imageData, mimeType]
        );
        profilePicId = insertResult.rows[0].id;
      }
      
      // IMPORTANT: Use a special URL format that won't be captured by the static middleware
      // Create URL reference for the profile picture with unique format and use relative URL
      // that works in both local and cloud environments
      const profilePicUrl = `/api/users/profile-picture/${userId}`;
      
      // Update the user record with the URL reference
      await client.query(
        'UPDATE users SET profile_pic = $1 WHERE user_id = $2',
        [profilePicUrl, userId]
      );
      
      await client.query('COMMIT');
      
      // Return the same format URL as what's in the database
      res.status(200).json({
        message: 'Profile picture updated successfully',
        profilePic: profilePicUrl
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating profile picture in database:', error);
      res.status(500).json({ message: 'Server error while updating profile picture' });
    } finally {
      client.release();
    }
  });
});

export const getProfilePicture = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Get the profile picture from the database
    const result = await pool.query(
      'SELECT image_data, mime_type FROM user_profile_pictures WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }
    
    const { image_data, mime_type } = result.rows[0];
    
    // Set content type and send the image data
    res.set('Content-Type', mime_type);
    return res.send(image_data);
  } catch (error) {
    console.error('Error retrieving profile picture:', error);
    res.status(500).json({ message: 'Server error while retrieving profile picture' });
  }
});

export const removeProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user has a profile picture
    const checkResult = await client.query(
      'SELECT id FROM user_profile_pictures WHERE user_id = $1',
      [userId]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'No profile picture found' });
    }
    
    // Remove profile picture from database
    await client.query(
      'DELETE FROM user_profile_pictures WHERE user_id = $1',
      [userId]
    );
    
    // Update user record to remove profile picture reference
    await client.query(
      'UPDATE users SET profile_pic = NULL WHERE user_id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({ message: 'Profile picture removed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing profile picture:', error);
    res.status(500).json({ message: 'Server error while removing profile picture' });
  } finally {
    client.release();
  }
}); 