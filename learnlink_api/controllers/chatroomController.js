import ChatRoom from "../models/chatroomModel.js";
import { io } from "../server.js";
import pool from "../config/database.js";
import { encrypt, decrypt } from "../utils/encryption.js";

export const chatroomController = {
  // Tüm chat odalarını getir
  getAllChatrooms: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT c.*, 
          COALESCE(json_agg(DISTINCT cm.user_id) FILTER (WHERE cm.user_id IS NOT NULL)) as members
        FROM chatrooms c
        LEFT JOIN chatroom_members cm ON c.id = cm.chatroom_id
        GROUP BY c.id
        ORDER BY c.last_message_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error getting chatrooms:", error);
      res.status(500).json({ message: "Failed to get chatrooms" });
    }
  },

  // Kullanıcının katıldığı chat odalarını getir
  getUserChatrooms: async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log(`Getting chatrooms for user ${userId}`);

      const result = await pool.query(`
        SELECT c.*, 
          (SELECT COUNT(*) FROM chatroom_members WHERE chatroom_id = c.id) as member_count,
          (
            SELECT json_build_object(
              'id', m.id,
              'content', m.content,
              'created_at', m.created_at,
              'sender_id', m.sender_id,
              'sender_name', u.name
            )
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            WHERE m.chatroom_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message
        FROM chatrooms c
        JOIN chatroom_members cm ON c.id = cm.chatroom_id
        WHERE cm.user_id = $1
        GROUP BY c.id
        ORDER BY c.last_message_at DESC
      `, [userId]);
      
      // Eğer hiç chatroom yoksa boş array döndür
      if (result.rows.length === 0) {
        return res.json([]);
      }
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error getting user chatrooms:", error);
      res.status(500).json({ message: "Failed to get user chatrooms" });
    }
  },

  // Yeni chat odası oluştur
  createChatroom: async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    try {
      const result = await pool.query(
        "INSERT INTO chatrooms (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
        [name, description, userId]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating chatroom:", error);
      res.status(500).json({ message: "Failed to create chatroom" });
    }
  },

  // Chat odasına katıl
  joinChatroom: async (req, res) => {
    try {
      const { chatroomId } = req.params;
      const userId = req.user.user_id;

      await ChatRoom.addMember(chatroomId, userId);

      // Emit socket event for real-time update
      io.to(chatroomId).emit("chatroom:joined", { userId, chatroomId });

      res.json({
        success: true,
        message: "Successfully joined chatroom",
      });
    } catch (error) {
      console.error("Error in joinChatroom:", error);
      res.status(500).json({
        success: false,
        error: "Failed to join chatroom",
        message: error.message,
      });
    }
  },

  // Chat odasının mesajlarını getir
  getChatroomMessages: async (req, res) => {
    try {
      const { chatroomId } = req.params;

      const query = `
        SELECT 
          m.id,
          m.content,
          m.sender_id,
          m.created_at,
          u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE m.chatroom_id = $1
        ORDER BY m.created_at ASC
      `;

      const result = await pool.query(query, [chatroomId]);

      // Decrypt all message contents
      const messagesArray = result.rows.map((msg) => ({
        ...msg,
        content: decrypt(msg.content),
      }));

      res.json({
        success: true,
        data: messagesArray,
        message: messagesArray.length
          ? "Messages fetched successfully"
          : "No messages found",
      });
    } catch (error) {
      console.error("Error in getChatroomMessages:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch messages",
        message: error.message,
        data: [], // Return empty array on error
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
          error: "VALIDATION_ERROR",
          message: "Message content is required",
        });
      }

      // Encrypt the message content
      const encryptedContent = encrypt(content.trim());

      // Insert the encrypted message
      const query = `
        INSERT INTO messages (content, sender_id, chatroom_id)
        VALUES ($1, $2, $3)
        RETURNING id, content, sender_id, created_at
      `;

      const result = await pool.query(query, [
        encryptedContent,
        userId,
        chatroomId,
      ]);

      // Get sender's name
      const userQuery = "SELECT name FROM users WHERE user_id = $1";
      const userResult = await pool.query(userQuery, [userId]);

      // Decrypt the message for the response
      const message = {
        ...result.rows[0],
        content: decrypt(result.rows[0].content),
        sender_name: userResult.rows[0].name,
      };

      // Emit socket event for real-time update
      io.to(chatroomId).emit("chatroom:message", message);

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error("Error in sendMessage:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send message",
        message: error.message,
      });
    }
  },

  // Chat odasını sil
  deleteChatroom: async (req, res) => {
    try {
      const { chatroomId } = req.params;
      console.log("Deleting chatroom:", chatroomId);

      const deletedChatroom = await ChatRoom.delete(chatroomId);

      if (!deletedChatroom) {
        return res.status(404).json({
          success: false,
          error: "CHATROOM_NOT_FOUND",
          message: "Chatroom not found",
        });
      }

      // Emit socket event for real-time update
      io.emit("chatroom:deleted", { chatroomId });

      res.json({
        success: true,
        message: "Chatroom deleted successfully",
        data: deletedChatroom,
      });
    } catch (error) {
      console.error("Error in deleteChatroom:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete chatroom",
        message: error.message,
      });
    }
  },
};
