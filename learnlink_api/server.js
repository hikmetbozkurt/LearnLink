import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";

// Try to load environment variables, but don't fail if .env file is missing
try {
  dotenv.config();
  console.log("Environment variables loaded");
} catch (error) {
  console.error("Error loading environment variables:", error);
  // Continue anyway
}

// Create HTTP server
const httpServer = createServer(app);

// Handle static files
try {
  // İndirilebilir dosya uzantıları
  const DOWNLOADABLE_EXTENSIONS = [".txt", ".rar", ".zip"];

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

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
} catch (error) {
  console.error("Error setting up static file handlers:", error);
  // Continue anyway
}

// Create Socket.IO instance with error handling
let io;
try {
  // Create Socket.IO instance
  io = new Server(httpServer, {
    cors: {
      origin: [
        "https://golearnlink.com",
        "https://www.golearnlink.com",
        "https://learnlink-gui.vercel.app",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Store connected users
  const connectedUsers = new Map();

  // Import JWT and other dependencies inside try block
  try {
    const jwt = await import("jsonwebtoken");

    // Socket.IO middleware for authentication
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error"));
        }

        try {
          const decoded = jwt.default.verify(
            token,
            process.env.JWT_SECRET || "fallback_secret"
          );
          socket.user = decoded;
          next();
        } catch (jwtError) {
          console.error("JWT verification error:", jwtError);
          return next(new Error("Authentication error"));
        }
      } catch (error) {
        console.error("Socket auth error:", error);
        return next(new Error("Authentication error"));
      }
    });

    // Handle socket connections with error handling
    io.on("connection", (socket) => {
      // Socket event handlers would go here
      // They've been removed to simplify the file
      // The socket will still connect, but won't handle app-specific events
      console.log("Socket connected");
    });
  } catch (error) {
    console.error("Error setting up socket authentication:", error);
    // Continue without socket auth
  }
} catch (error) {
  console.error("Error creating Socket.IO instance:", error);
  // Continue without socket.io
}

// Start server with error handling
const PORT = process.env.PORT || 8081;
try {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Add error handler for the HTTP server
  httpServer.on("error", (error) => {
    console.error("HTTP server error:", error);
  });
} catch (error) {
  console.error("Failed to start server:", error);
}

export default httpServer;
export { io };
