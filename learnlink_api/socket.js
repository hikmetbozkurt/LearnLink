import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './config/env.js';
import pool from './config/database.js';

// Function to ensure notifications table has all required columns
const ensureNotificationsTableColumns = async () => {
  try {
    
    // Check if assignment_id column exists
    const assignmentIdCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'assignment_id')"
    );
    
    if (!assignmentIdCheck.rows[0].exists) {
      await pool.query("ALTER TABLE notifications ADD COLUMN assignment_id INTEGER");
    }
    
    // Check if submission_id column exists
    const submissionIdCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'submission_id')"
    );
    
    if (!submissionIdCheck.rows[0].exists) {
      await pool.query("ALTER TABLE notifications ADD COLUMN submission_id INTEGER");
    }
    
    // Check if course_id column exists
    const courseIdCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'course_id')"
    );
    
    if (!courseIdCheck.rows[0].exists) {
      await pool.query("ALTER TABLE notifications ADD COLUMN course_id INTEGER");
    }
    
  } catch (error) {
    console.error('Error ensuring notifications table columns:', error);
  }
};

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Ensure notifications table has necessary columns
  ensureNotificationsTableColumns();

  // Store user socket mappings
  const userSockets = new Map();

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Function to send assignment notifications to users
  const sendAssignmentNotification = async (notification) => {
    try {
      const { recipient_id, content, type, assignment_id, submission_id, course_id } = notification;
      
      // Insert notification into database
      const notificationQuery = `
        INSERT INTO notifications 
          (recipient_id, content, type, assignment_id, submission_id, course_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const result = await pool.query(notificationQuery, [
        recipient_id,
        content,
        type,
        assignment_id,
        submission_id,
        course_id
      ]);
      
      if (result.rows.length > 0) {
        const newNotification = result.rows[0];
        const recipientSocketId = userSockets.get(recipient_id.toString());
        
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new_notification', newNotification);
        }
      }
    } catch (error) {
      console.error('Error sending assignment notification:', error);
    }
  };

  // Expose function to other modules
  io.sendAssignmentNotification = sendAssignmentNotification;

  io.on('connection', (socket) => {

    socket.on('user_connected', (userId) => {
      userSockets.set(userId, socket.id);
    });

    // Handle joining direct message conversations
    socket.on('join_dm', (dmId) => {
      socket.join(`dm_${dmId}`);
    });

    // Handle leaving direct message conversations
    socket.on('leave_dm', (dmId) => {
      socket.leave(`dm_${dmId}`);
    });

    // Handle direct messages
    socket.on('direct_message', async (message) => {
      
      try {
        // Get the other user's ID from the direct message conversation
        const query = `
          SELECT 
            CASE 
              WHEN user1_id = $1 THEN user2_id
              ELSE user1_id
            END as other_user_id,
            CASE 
              WHEN user1_id = $1 THEN u2.name
              ELSE u1.name
            END as sender_name
          FROM direct_messages dm
          JOIN users u1 ON dm.user1_id = u1.user_id
          JOIN users u2 ON dm.user2_id = u2.user_id
          WHERE dm.id = $2
        `;
        
        const result = await pool.query(query, [socket.user.user_id, message.dm_id]);
        
        if (result.rows.length > 0) {
          const otherUserId = result.rows[0].other_user_id;
          const otherUserSocketId = userSockets.get(otherUserId.toString());
          
          // Broadcast to the DM room (both users will receive it)
          io.to(`dm_${message.dm_id}`).emit('new_direct_message', message);
          
          // Also send specifically to the other user's socket if they're not in the room
          if (otherUserSocketId) {
            io.to(otherUserSocketId).emit('new_direct_message', message);
            
            // Send notification event
            io.to(otherUserSocketId).emit('new_notification', {
              type: 'private_message',
              content: `${result.rows[0].sender_name}: ${message.content.length > 30 ? message.content.substring(0, 30) + '...' : message.content}`,
              sender_id: socket.user.user_id,
              reference_id: message.id,
              created_at: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error handling direct message:', error);
      }
    });

    // Handle assignment notifications
    socket.on('assignment_notification', (notification) => {
      sendAssignmentNotification(notification);
    });

    socket.on('disconnect', () => {
      // Remove user socket mapping
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};

export default setupSocket; 