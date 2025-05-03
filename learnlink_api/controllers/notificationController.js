import pool from '../config/database.js';
import { createNewAssignmentNotification, createAssignmentSubmissionNotification } from '../utils/notificationUtils.js';

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

// Handle assignment notifications
export const createAssignmentNotification = async (req, res) => {
  try {
    console.log('Received assignment notification request:', req.body);
    const { course_id, assignment_id, title } = req.body;
    const userId = req.user.user_id;

    console.log(`Creating assignment notification for course ${course_id}, assignment ${assignment_id}, by user ${userId}`);

    // Validate required fields
    if (!course_id || !assignment_id || !title) {
      console.error('Missing required fields:', { course_id, assignment_id, title });
      return res.status(400).json({
        success: false,
        message: "Missing required fields (course_id, assignment_id, title)"
      });
    }

    // Verify the assignment exists
    const assignmentResult = await pool.query(
      "SELECT * FROM assignments WHERE assignment_id = $1",
      [assignment_id]
    );

    if (assignmentResult.rows.length === 0) {
      console.error(`Assignment with ID ${assignment_id} not found`);
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    const assignment = assignmentResult.rows[0];
    console.log('Found assignment:', assignment);

    // Get course details
    const courseResult = await pool.query(
      "SELECT title, instructor_id FROM courses WHERE course_id = $1",
      [course_id]
    );

    if (courseResult.rows.length === 0) {
      console.error(`Course with ID ${course_id} not found`);
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const course = courseResult.rows[0];
    console.log('Found course:', course);

    // Check if the user is the course instructor
    if (course.instructor_id !== userId) {
      console.error(`User ${userId} is not the instructor (${course.instructor_id}) for course ${course_id}`);
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create notifications for this course"
      });
    }

    // Get enrolled users (excluding the instructor)
    const enrolledUsersResult = await pool.query(
      `SELECT user_id FROM enrollments 
       WHERE course_id = $1 AND user_id != $2`,
      [course_id, course.instructor_id]
    );

    const enrolledUserIds = enrolledUsersResult.rows.map(row => row.user_id);
    console.log(`Found ${enrolledUserIds.length} enrolled users to notify`);

    if (enrolledUserIds.length > 0) {
      // Create notifications for enrolled users
      try {
        await createNewAssignmentNotification(
          assignment,
          course.title,
          enrolledUserIds
        );
        
        console.log('Successfully created assignment notifications');
        
        return res.status(201).json({
          success: true,
          message: `Notifications sent to ${enrolledUserIds.length} course members`
        });
      } catch (notificationError) {
        console.error('Error in createNewAssignmentNotification:', notificationError);
        
        // Try direct database insertion as a fallback
        try {
          console.log('Attempting direct database insertion as fallback');
          const notificationContent = `New assignment: "${title}" was added to ${course.title}`;
          
          for (const recipientId of enrolledUserIds) {
            await pool.query(
              `INSERT INTO notifications 
               (sender_id, recipient_id, content, type, reference_id, assignment_id, submission_id, course_id, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
              [
                userId,               // sender_id (instructor)
                recipientId,          // recipient_id (student)
                notificationContent,  // content
                'new_assignment',     // type
                assignment_id,        // reference_id
                assignment_id,        // assignment_id
                null,                 // submission_id (not applicable for new assignments)
                course_id             // course_id
              ]
            );
          }
          
          console.log('Fallback notification creation successful');
          
          return res.status(201).json({
            success: true,
            message: `Notifications sent to ${enrolledUserIds.length} course members (fallback method)`
          });
        } catch (fallbackError) {
          console.error('Fallback notification creation also failed:', fallbackError);
          return res.status(500).json({
            success: false,
            message: "Failed to create assignment notifications even with fallback method",
            error: fallbackError.message
          });
        }
      }
    } else {
      console.log('No enrolled users to notify');
      return res.status(200).json({
        success: true,
        message: "No enrolled users to notify"
      });
    }
  } catch (error) {
    console.error("Error creating assignment notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create assignment notifications",
      error: error.message
    });
  }
};

// Handle assignment submission notifications
export const createSubmissionNotification = async (req, res) => {
  try {
    const { assignment_id, submission_id } = req.body;
    const userId = req.user.user_id;

    // Validate required fields
    if (!assignment_id || !submission_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (assignment_id, submission_id)"
      });
    }

    // Get submission details
    const submissionResult = await pool.query(
      "SELECT * FROM submissions WHERE submission_id = $1 AND user_id = $2",
      [submission_id, userId]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Submission not found or you don't have access to it"
      });
    }

    const submission = submissionResult.rows[0];

    // Get assignment and course details
    const assignmentResult = await pool.query(
      `SELECT a.*, c.title as course_name, c.course_id, c.instructor_id 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.course_id 
       WHERE a.assignment_id = $1`,
      [assignment_id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment or course not found"
      });
    }

    const assignment = assignmentResult.rows[0];
    
    // Get user details
    const userResult = await pool.query(
      "SELECT user_id, name, username FROM users WHERE user_id = $1",
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const user = userResult.rows[0];
    
    // Create course object
    const course = {
      course_id: assignment.course_id,
      name: assignment.course_name,
      instructor_id: assignment.instructor_id
    };
    
    // Create notification for the instructor
    await createAssignmentSubmissionNotification(
      submission,
      user,
      assignment,
      course
    );
    
    return res.status(201).json({
      success: true,
      message: "Submission notification sent to instructor"
    });
  } catch (error) {
    console.error("Error creating submission notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create submission notification",
      error: error.message
    });
  }
};

// Get notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Log for debugging
    console.log('Fetching notifications for user:', userId);
    
    // If no user ID in request, return empty array with error message
    if (!userId) {
      console.error('Missing user_id in request');
      return res.status(200).json([]);
    }
    
    const query = `
      SELECT n.*, u.name as sender_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.user_id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    console.log(`Found ${result.rows.length} notifications for user ${userId}`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting notifications:', error);
    // Return empty array instead of error to prevent UI issues
    res.status(200).json([]);
  }
};

// Get notifications for a specific user ID (for homepage)
export const getUserNotifications = async (req, res) => {
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
    
    
    const query = `
      SELECT * FROM notifications
      WHERE recipient_id = $1
      ORDER BY created_at DESC
    `;
    
    
    const result = await pool.query(query, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting notifications by user ID:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error getting notifications',
      error: error.message,
      stack: error.stack
    });
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

// Delete a specific notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.user_id;
    
    const query = `
      DELETE FROM notifications
      WHERE notifications_id = $1 AND recipient_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [notificationId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification not found or you do not have permission to delete it' 
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting notification' 
    });
  }
};

// Test notification creation (for debugging)
export const createTestNotification = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Create a test notification for the current user
    const query = `
      INSERT INTO notifications 
      (sender_id, recipient_id, content, type, reference_id, assignment_id, submission_id, course_id, created_at, updated_at, read)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), false)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId,                      // sender is self
      userId,                      // recipient is self
      'This is a test notification for assignment submission', 
      'assignment_submission',
      1,                           // reference_id (can be any value)
      1,                           // assignment_id (can be any value)
      1,                           // submission_id (can be any value)
      1                            // course_id (can be any value)
    ]);
    
    console.log('Test notification created:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      message: 'Test notification created',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating test notification',
      error: error.message
    });
  }
}; 