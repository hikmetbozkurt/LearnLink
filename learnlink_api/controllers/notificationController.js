import pool from '../config/database.js';

export const getUserNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT n.*, 
             u.name as sender_name,
             c.name as chatroom_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.user_id
      LEFT JOIN chatrooms c ON n.chatroom_id = c.id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query, [userId]);
    
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const query = `
      UPDATE notifications
      SET read = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE notifications_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [notificationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      UPDATE notifications
      SET read = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE recipient_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId]);
    
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

export const clearAllNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      DELETE FROM notifications
      WHERE recipient_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId]);
    
    return res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
};

export const createNotification = async (req, res) => {
  const { sender_id, recipient_id, content, chatroom_id } = req.body;

  try {
    const query = `
      INSERT INTO notifications (
        sender_id,
        recipient_id,
        content,
        chatroom_id,
        read,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [sender_id, recipient_id, content, chatroom_id];
    const result = await pool.query(query, values);
    
    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
}; 