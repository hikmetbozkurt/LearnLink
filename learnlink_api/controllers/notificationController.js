import pool from '../config/database.js';

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { recipient_id, content, type } = req.body;
    
    const query = `
      INSERT INTO notifications (recipient_id, content, type)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [recipient_id, content, type]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification' });
  }
};

// Get notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const query = `
      SELECT * FROM notifications
      WHERE recipient_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Error getting notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.user_id;
    
    const query = `
      UPDATE notifications
      SET read = true, updated_at = CURRENT_TIMESTAMP
      WHERE notifications_id = $1 AND recipient_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [notificationId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const query = `
      UPDATE notifications
      SET read = true
      WHERE recipient_id = $1 AND read = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId]);
    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: result.rows
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error marking all notifications as read' 
    });
  }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const query = `
      DELETE FROM notifications
      WHERE recipient_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId]);
    res.json({
      success: true,
      message: 'All notifications cleared',
      data: result.rows
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error clearing notifications' 
    });
  }
}; 