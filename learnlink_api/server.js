import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config/env.js';
import ChatRoom from './models/chatroomModel.js';
import pool from './config/database.js';

const httpServer = createServer(app);

// Create Socket.IO instance
export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_connected', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log('User registered:', userId);
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log('User joined room:', roomId);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log('User left room:', roomId);
  });

  socket.on('send_message', async (data) => {
    const { roomId, message, userId } = data;
    try {
      // Save message to database
      const savedMessage = await ChatRoom.createMessage({
        chatroomId: roomId,
        senderId: userId,
        content: message
      });
      
      // Get chatroom members to create notifications
      const membersQuery = `
        SELECT user_id 
        FROM chatroom_members 
        WHERE chatroom_id = $1 AND user_id != $2
      `;
      const membersResult = await pool.query(membersQuery, [roomId, userId]);
      
      // Get chatroom name and sender name for the notification
      const chatroomQuery = `
        SELECT c.name as chatroom_name, u.name as sender_name
        FROM chatrooms c
        JOIN users u ON u.user_id = $1
        WHERE c.id = $2
      `;
      const chatroomResult = await pool.query(chatroomQuery, [userId, roomId]);
      const { chatroom_name, sender_name } = chatroomResult.rows[0];

      // Create notifications for all members except the sender
      for (const member of membersResult.rows) {
        const notificationQuery = `
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
        
        const notificationValues = [
          userId,
          member.user_id,
          message,
          roomId
        ];
        
        await pool.query(notificationQuery, notificationValues);
        
        // If the recipient is online, send them a real-time notification
        const recipientSocketId = connectedUsers.get(member.user_id.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new_notification', {
            sender_name,
            chatroom_name,
            content: message,
            chatroom_id: roomId
          });
        }
      }
      
      // Broadcast to room
      io.to(roomId).emit('receive_message', savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = config.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default httpServer;