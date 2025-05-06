import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './config/env.js';
import pool from './config/database.js';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

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

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.user_id);

    socket.on('user_connected', (userId) => {
      userSockets.set(userId, socket.id);
      console.log('User socket mapped:', userId, socket.id);
    });

    // Handle joining direct message conversations
    socket.on('join_dm', (dmId) => {
      socket.join(`dm_${dmId}`);
      console.log(`User ${socket.user.user_id} joined DM conversation: ${dmId}`);
    });

    // Handle leaving direct message conversations
    socket.on('leave_dm', (dmId) => {
      socket.leave(`dm_${dmId}`);
      console.log(`User ${socket.user.user_id} left DM conversation: ${dmId}`);
    });

    // Handle direct messages
    socket.on('direct_message', async (message) => {
      console.log('Direct message received:', message);
      
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

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.user_id);
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