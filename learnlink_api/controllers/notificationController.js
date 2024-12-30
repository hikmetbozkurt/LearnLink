import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT n.*, u.name as sender_name
       FROM notifications n
       JOIN users u ON n.sender_id = u.user_id
       WHERE n.recipient_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET read = true, updated_at = CURRENT_TIMESTAMP 
       WHERE notifications_id = $1 AND recipient_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND read = false',
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting unread count' });
  }
}); 