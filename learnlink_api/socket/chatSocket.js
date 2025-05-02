import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import config from '../config/env.js'
import { ChatService } from '../services/chatService.js'

export class ChatSocket {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    })
    
    this.chatService = new ChatService()
    this.setupSocketAuth()
    this.setupEventHandlers()
  }

  setupSocketAuth() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          throw new Error('Authentication error')
        }

        const decoded = jwt.verify(token, config.JWT_SECRET)
        socket.user = decoded
        next()
      } catch (error) {
        next(new Error('Authentication error'))
      }
    })
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {

      // Join user's rooms
      this.handleJoinRooms(socket)

      // Handle new message
      socket.on('send_message', (data) => this.handleNewMessage(socket, data))

      // Handle typing status
      socket.on('typing_start', (data) => this.handleTyping(socket, data, true))
      socket.on('typing_end', (data) => this.handleTyping(socket, data, false))

      // Handle read status
      socket.on('mark_read', (data) => this.handleMarkRead(socket, data))

      // Handle disconnect
      socket.on('disconnect', () => this.handleDisconnect(socket))
    })
  }

  async handleJoinRooms(socket) {
    try {
      const rooms = await this.chatService.getUserRooms(socket.user.id)
      rooms.forEach(room => {
        socket.join(`room:${room.id}`)
      })
    } catch (error) {
      console.error('Error joining rooms:', error)
    }
  }

  async handleNewMessage(socket, data) {
    try {
      const { roomId, message, messageType, fileId } = data
      
      const savedMessage = await this.chatService.saveMessage(
        roomId,
        socket.user.id,
        message,
        messageType,
        fileId
      )

      this.io.to(`room:${roomId}`).emit('new_message', {
        ...savedMessage,
        sender_name: socket.user.name
      })
    } catch (error) {
      socket.emit('error', { message: 'Error sending message' })
    }
  }

  handleTyping(socket, data, isTyping) {
    const { roomId } = data
    socket.to(`room:${roomId}`).emit('typing_status', {
      userId: socket.user.id,
      userName: socket.user.name,
      isTyping
    })
  }

  async handleMarkRead(socket, data) {
    try {
      const { roomId } = data
      await this.chatService.updateLastRead(roomId, socket.user.id)
      socket.to(`room:${roomId}`).emit('message_read', {
        userId: socket.user.id,
        roomId
      })
    } catch (error) {
      socket.emit('error', { message: 'Error updating read status' })
    }
  }

} 