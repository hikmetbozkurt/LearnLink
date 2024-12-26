import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { createServer } from 'http'
import config from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import userRoutes from './routes/userRoutes.js'
import messageRoutes from './routes/messageRoutes.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Store online users
const onlineUsers = new Map();

// Middleware
app.use(cors())
app.use(express.json())

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/users', userRoutes)
app.use('/api/messages', messageRoutes)

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('user_connected', (userId) => {
    console.log('User registered with socket:', { userId, socketId: socket.id });
    onlineUsers.set(userId, socket.id);
    socket.userId = userId; // Store userId in socket object
  });

  // Handle private messages
  socket.on('private_message', (data) => {
    console.log('Private message received:', data);
    const receiverSocketId = onlineUsers.get(data.receiver_id);
    console.log('Receiver socket ID:', receiverSocketId);
    
    if (receiverSocketId) {
      console.log('Sending message to receiver:', receiverSocketId);
      io.to(receiverSocketId).emit('receive_message', {
        ...data,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('Receiver not online:', data.receiver_id);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      console.log('Removing user from online users:', socket.userId);
      onlineUsers.delete(socket.userId);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  })
})

const PORT = config.PORT || 5001

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})