import { ChatService } from '../services/chatService.js'
import { createResponse } from '../utils/responseHelper.js'

export class ChatController {
  constructor() {
    this.chatService = new ChatService()
  }

  createChatroom = async (req, res) => {
    try {
      const { course_id, chat_type } = req.body
      const result = await this.chatService.createChatroom(course_id, chat_type)
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getChatrooms = async (req, res) => {
    try {
      const { course_id } = req.params
      const result = await this.chatService.getChatrooms(course_id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  joinChatroom = async (req, res) => {
    try {
      const { chatroom_id } = req.params
      const result = await this.chatService.addUserToChatroom(req.user.user_id, chatroom_id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getMessages = async (req, res) => {
    try {
      const { chatroom_id } = req.params
      const result = await this.chatService.getMessages(chatroom_id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  sendMessage = async (req, res) => {
    try {
      const { chatroom_id } = req.params
      const { content } = req.body
      const result = await this.chatService.sendMessage(chatroom_id, req.user.user_id, content)
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }
} 