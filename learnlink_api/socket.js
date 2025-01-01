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

    // Handle direct messages
    socket.on('direct_message', (message) => {
      console.log('Direct message received:', message);
      
      // Get the other user's ID from the direct message conversation
      const query = `
        SELECT 
          CASE 
            WHEN user1_id = $1 THEN user2_id
            ELSE user1_id
          END as other_user_id
        FROM direct_messages
        WHERE id = $2
      `;
      
      pool.query(query, [socket.user.user_id, message.direct_message_id])
        .then(result => {
          if (result.rows.length > 0) {
            const otherUserId = result.rows[0].other_user_id;
            const otherUserSocketId = userSockets.get(otherUserId.toString());
            
            if (otherUserSocketId) {
              io.to(otherUserSocketId).emit('new_direct_message', message);
            }
          }
        })
        .catch(error => {
          console.error('Error handling direct message:', error);
        });
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