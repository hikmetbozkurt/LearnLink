import Chat from '../models/chatModel.js'
import { createResponse } from '../utils/responseHelper.js'

export class ChatService {
  async createChatroom(courseId, chatType) {
    const chatroom = await Chat.createChatroom(courseId, chatType)
    return createResponse(true, {
      chatroom: {
        id: chatroom.chatroom_id,
        course_id: chatroom.course_id,
        chat_type: chatroom.chat_type,
        created_at: chatroom.created_at,
        updated_at: chatroom.updated_at
      }
    })
  }

  async getChatrooms(courseId) {
    const chatrooms = await Chat.getChatrooms(courseId)
    return createResponse(true, { chatrooms })
  }

  async addUserToChatroom(userId, chatroomId) {
    const membership = await Chat.addUserToChatroom(userId, chatroomId)
    return createResponse(true, { membership })
  }

  async getMessages(chatroomId) {
    const messages = await Chat.getMessages(chatroomId)
    return createResponse(true, { messages })
  }

  async sendMessage(chatroomId, senderId, content) {
    const message = await Chat.sendMessage(chatroomId, senderId, content)
    return createResponse(true, {
      message: {
        id: message.message_id,
        chatroom_id: message.chatroom_id,
        sender_id: message.sender_id,
        content: message.content,
        timestamp: message.timestamp,
        created_at: message.created_at,
        updated_at: message.updated_at
      }
    })
  }
} 