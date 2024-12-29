import ChatRoom from '../models/chatroomModel.js';
import { io } from '../server.js';

export const chatroomController = {
  // Tüm chat odalarını getir
  getAllChatrooms: async (req, res) => {
    try {
      console.log('Getting all chatrooms');
      const chatrooms = await ChatRoom.getAll();
      console.log('Chatrooms before sending:', chatrooms);

      // Ensure we're sending an array
      const chatroomsArray = Array.isArray(chatrooms) ? chatrooms : [];
      
      res.json({
        success: true,
        data: chatroomsArray,
        message: chatroomsArray.length ? 'Chatrooms fetched successfully' : 'No chatrooms found'
      });
    } catch (error) {
      console.error('Error in getAllChatrooms:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch chatrooms',
        message: error.message,
        data: [] // Return empty array on error
      });
    }
  },

  // Yeni chat odası oluştur
  createChatroom: async (req, res) => {
    console.log('=== Create Chatroom Request Started ===');
    try {
      const { name, description } = req.body;
      console.log('Request Body:', { name, description });
      console.log('Auth User:', req.user);

      // Validate required fields
      if (!req.user?.user_id) {
        console.error('No user_id found in token');
        return res.status(401).json({ 
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User ID not found in token' 
        });
      }

      if (!name || name.trim().length === 0) {
        console.error('No room name provided');
        return res.status(400).json({ 
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Room name is required' 
        });
      }

      const chatroomData = {
        name: name.trim(),
        description: description?.trim() || '',
        createdBy: req.user.user_id
      };

      console.log('Creating chatroom with params:', chatroomData);

      const newChatroom = await ChatRoom.create(chatroomData);

      if (!newChatroom) {
        throw new Error('Failed to create chatroom in database');
      }

      console.log('Chatroom created:', newChatroom);
      console.log('=== Create Chatroom Request Completed ===');

      // Emit socket event for real-time update
      io.emit('chatroom:created', newChatroom);

      res.status(201).json({
        success: true,
        data: newChatroom
      });
    } catch (error) {
      console.error('=== Create Chatroom Error ===');
      console.error('Error details:', error);
      console.error('Stack trace:', error.stack);
      
      res.status(500).json({ 
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to create chatroom: ' + error.message
      });
    }
  },

  // Chat odasına katıl
  joinChatroom: async (req, res) => {
    try {
      const { chatroomId } = req.params;
      const userId = req.user.user_id;

      await ChatRoom.addMember(chatroomId, userId);
      
      // Emit socket event for real-time update
      io.to(chatroomId).emit('chatroom:joined', { userId, chatroomId });
      
      res.json({ 
        success: true,
        message: 'Successfully joined chatroom'
      });
    } catch (error) {
      console.error('Error in joinChatroom:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to join chatroom',
        message: error.message 
      });
    }
  },

  // Chat odasının mesajlarını getir
  getChatroomMessages: async (req, res) => {
    try {
      const { chatroomId } = req.params;
      console.log('Getting messages for chatroom:', chatroomId);
      
      const messages = await ChatRoom.getMessages(chatroomId);
      console.log('Retrieved messages:', messages);

      // Ensure we're sending an array
      const messagesArray = Array.isArray(messages) ? messages : [];
      
      res.json({
        success: true,
        data: messagesArray,
        message: messagesArray.length ? 'Messages fetched successfully' : 'No messages found'
      });
    } catch (error) {
      console.error('Error in getChatroomMessages:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch messages',
        message: error.message,
        data: [] // Return empty array on error
      });
    }
  },

  // Mesaj gönder
  sendMessage: async (req, res) => {
    try {
      const { chatroomId } = req.params;
      const { content } = req.body;
      const userId = req.user.user_id;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Message content is required'
        });
      }

      const message = await ChatRoom.createMessage({
        chatroomId,
        senderId: userId,
        content: content.trim()
      });

      // Emit socket event for real-time update
      io.to(chatroomId).emit('chatroom:message', message);

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send message',
        message: error.message 
      });
    }
  },

  // Chat odasını sil
  deleteChatroom: async (req, res) => {
    try {
      const { chatroomId } = req.params;
      console.log('Deleting chatroom:', chatroomId);

      const deletedChatroom = await ChatRoom.delete(chatroomId);

      if (!deletedChatroom) {
        return res.status(404).json({
          success: false,
          error: 'CHATROOM_NOT_FOUND',
          message: 'Chatroom not found'
        });
      }

      // Emit socket event for real-time update
      io.emit('chatroom:deleted', { chatroomId });

      res.json({
        success: true,
        message: 'Chatroom deleted successfully',
        data: deletedChatroom
      });
    } catch (error) {
      console.error('Error in deleteChatroom:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete chatroom',
        message: error.message
      });
    }
  }
}; 