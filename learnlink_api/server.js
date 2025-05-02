import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import config from "./config/env.js";
import ChatRoom from "./models/chatroomModel.js";
import pool from "./config/database.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { setIoInstance } from "./utils/notificationUtils.js";

dotenv.config();

const httpServer = createServer(app);

// İndirilebilir dosya uzantıları
const DOWNLOADABLE_EXTENSIONS = [".txt", ".rar", ".zip"];

// Önce indirilebilir dosyalar için özel middleware
app.get("/uploads/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), "uploads/files", filename);
  const fileExtension = path.extname(filename).toLowerCase();

  // Dosya varlığını kontrol et
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Dosya bulunamadı");
  }

  // İndirilebilir uzantılara sahip dosyaları indirme olarak işaretle
  if (DOWNLOADABLE_EXTENSIONS.includes(fileExtension)) {
    // Timestampi kaldırıp orijinal dosya adını elde et
    const originalNameWithTimestamp = decodeURIComponent(filename);
    const dashIndex = originalNameWithTimestamp.indexOf("-");
    const originalName =
      dashIndex !== -1
        ? originalNameWithTimestamp.substring(dashIndex + 1)
        : originalNameWithTimestamp;

    console.log(`Downloading file: ${filename} as ${originalName}`);

    // İndirme başlıklarını ayarla
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalName}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");
  }

  // Dosyayı gönder
  res.sendFile(filePath);
});

// Geriye kalan tüm statik dosyalar için
app.use("/uploads", express.static("uploads"));

// Create Socket.IO instance
export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
  upgrade: false,
});

// Set the io instance in notificationUtils
setIoInstance(io);

// Store connected users
const connectedUsers = new Map();

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user_connected", (userId) => {
    if (
      socket.user &&
      (socket.user.user_id === parseInt(userId) ||
        socket.user.id === parseInt(userId))
    ) {
      connectedUsers.set(userId, socket.id);
      console.log("User registered:", userId);
    }
  });

  socket.on("join_room", (roomId) => {
    console.log("User joining room:", roomId);
    socket.join(roomId.toString());
    console.log(
      "Room members after join:",
      io.sockets.adapter.rooms.get(roomId.toString())?.size
    );
  });

  socket.on("leave_room", (roomId) => {
    console.log("User leaving room:", roomId);
    socket.leave(roomId.toString());
    console.log(
      "Room members after leave:",
      io.sockets.adapter.rooms.get(roomId.toString())?.size
    );
  });

  socket.on("send_message", async (data) => {
    const { roomId, message } = data;
    const userId = socket.user.user_id || socket.user.id;

    try {
      console.log("Received message:", { roomId, message, userId });

      // Save message to database
      const messageQuery = `
        INSERT INTO messages (chatroom_id, sender_id, content, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id, content, sender_id, chatroom_id, created_at
      `;
      const messageResult = await pool.query(messageQuery, [
        roomId,
        userId,
        message,
      ]);
      const savedMessage = messageResult.rows[0];

      // Get sender's name
      const userQuery = "SELECT name FROM users WHERE user_id = $1";
      const userResult = await pool.query(userQuery, [userId]);
      const senderName = userResult.rows[0].name;

      // Prepare complete message object
      const completeMessage = {
        ...savedMessage,
        sender_name: senderName,
      };

      const roomIdStr = roomId.toString();
      console.log("Broadcasting message to room:", roomIdStr);
      console.log(
        "Room members:",
        io.sockets.adapter.rooms.get(roomIdStr)?.size
      );
      console.log("Message data:", completeMessage);

      // Broadcast to everyone in the room
      io.to(roomIdStr).emit("receive_message", completeMessage);

      // Get chatroom members for notifications
      const membersQuery = `
        SELECT user_id 
        FROM chatroom_members 
        WHERE chatroom_id = $1 AND user_id != $2
      `;
      const membersResult = await pool.query(membersQuery, [roomId, userId]);

      // Get chatroom name
      const chatroomQuery = "SELECT name FROM chatrooms WHERE id = $1";
      const chatroomResult = await pool.query(chatroomQuery, [roomId]);
      const chatroomName = chatroomResult.rows[0]?.name;

      // Create notifications for all members except sender
      for (const member of membersResult.rows) {
        const notificationQuery = `
          INSERT INTO notifications (
            sender_id,
            recipient_id,
            content,
            type,
            reference_id,
            read,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `;

        const notificationValues = [
          userId,
          member.user_id,
          message,
          "chat_message",
          savedMessage.id,
        ];

        await pool.query(notificationQuery, notificationValues);

        // Send real-time notification if recipient is online
        const recipientSocketId = connectedUsers.get(member.user_id.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("new_notification", {
            sender_name: senderName,
            chatroom_name: chatroomName,
            content: message,
            chatroom_id: roomId,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("chatroom:message", async (data) => {
    try {
      console.log("Received chatroom message:", data);

      // Broadcast message to room
      io.to(data.chatroom_id.toString()).emit("receive_message", {
        ...data,
        chatroom_id: data.chatroom_id, // Ensure chatroom_id is included
      });

      // Get chatroom members for notifications
      const membersQuery = `
        SELECT user_id 
        FROM chatroom_members 
        WHERE chatroom_id = $1 AND user_id != $2
      `;
      const membersResult = await pool.query(membersQuery, [
        data.chatroom_id,
        data.sender_id,
      ]);

      // Get chatroom name
      const chatroomQuery = "SELECT name FROM chatrooms WHERE id = $1";
      const chatroomResult = await pool.query(chatroomQuery, [
        data.chatroom_id,
      ]);
      const chatroomName = chatroomResult.rows[0]?.name;

      // Create notifications for all members except sender
      for (const member of membersResult.rows) {
        const notificationQuery = `
          INSERT INTO notifications (
            sender_id,
            recipient_id,
            content,
            type,
            reference_id,
            read,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `;

        const notificationValues = [
          data.sender_id,
          member.user_id,
          data.content,
          "chat_message",
          data.id,
        ];

        await pool.query(notificationQuery, notificationValues);

        // Send real-time notification if recipient is online
        const recipientSocketId = connectedUsers.get(member.user_id.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("new_notification", {
            sender_name: data.sender_name,
            chatroom_name: chatroomName,
            content: data.content,
            chatroom_id: data.chatroom_id,
          });
        }
      }
    } catch (error) {
      console.error("Error handling chatroom message:", error);
      socket.emit("error", { message: "Error handling message" });
    }
  });

  socket.on("disconnect", () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default httpServer;
