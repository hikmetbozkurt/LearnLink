import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../config/database.js"; // Pool'u ekleyelim

const router = express.Router();

// PDF dosyaları için multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/pdf";
    // uploads/pdf klasörünü oluştur (yoksa)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Orijinal dosya adını koru
    const timestamp = Date.now();
    const originalName = encodeURIComponent(file.originalname);
    cb(null, `${timestamp}-${originalName}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"));
    }
  },
});

router.use(authenticateToken);

// Course içindeki postları getir
router.get("/courses/:courseId/posts", async (req, res) => {
  try {
    const { courseId } = req.params;
    const posts = await pool.query(
      `
      SELECT 
        p.*,
        u.name as author_name,
        u.username as author_username,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'comment_id', c.comment_id,
              'content', c.content,
              'author_name', cu.name,
              'created_at', c.created_at
            )
          )
          FROM comments c
          JOIN users cu ON c.author_id = cu.user_id
          WHERE c.post_id = p.post_id),
          '[]'
        ) as comments
      FROM posts p
      JOIN users u ON p.author_id = u.user_id
      WHERE p.course_id = $1 
      ORDER BY p.created_at DESC
    `,
      [courseId]
    );

    // Her zaman bir array dön
    res.json({
      success: true,
      data: posts.rows || [], // Boş array varsayılan
      message: posts.rows.length
        ? "Posts fetched successfully"
        : "No posts found",
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      data: [], // Frontend için boş array
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
});

// Yeni post oluştur
router.post(
  "/courses/:courseId/posts",
  upload.single("file"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { content, type } = req.body;
      const userId = req.user.user_id;

      // SQL sorgusunu post tipine göre ayarla
      let query;
      let params;

      if (type === "pdf" && req.file) {
        // PDF post için
        const fileUrl = `/uploads/pdf/${req.file.filename}`;
        query = `
          INSERT INTO posts (course_id, author_id, content, type, file_url) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *
        `;
        params = [courseId, userId, content, type, fileUrl];
      } else if (type === "video") {
        // Video post için
        const { videoUrl } = req.body;
        query = `
          INSERT INTO posts (course_id, author_id, content, type, video_url) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *
        `;
        params = [courseId, userId, content, type, videoUrl];
      } else {
        // Text post için
        query = `
          INSERT INTO posts (course_id, author_id, content, type) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *
        `;
        params = [courseId, userId, content, type];
      }

      // Post'u oluştur
      const result = await pool.query(query, params);

      // Author bilgilerini al
      const userResult = await pool.query(
        "SELECT name as author_name, username as author_username FROM users WHERE user_id = $1",
        [userId]
      );

      // Post ve author bilgilerini birleştir
      const post = {
        ...result.rows[0],
        ...userResult.rows[0],
        comments: [],
      };

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        message: "Failed to create post",
        error: error.message,
      });
    }
  }
);

// Post silme endpoint'i
router.delete("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id;

    // Önce post'un sahibini ve course instructor'ını kontrol et
    const checkResult = await pool.query(
      `
      SELECT 
        p.author_id,
        c.instructor_id
      FROM posts p
      JOIN courses c ON p.course_id = c.course_id
      WHERE p.post_id = $1
    `,
      [postId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const { author_id, instructor_id } = checkResult.rows[0];

    // Kullanıcı post'un sahibi veya course instructor'ı değilse izin verme
    if (userId !== author_id && userId !== instructor_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this post",
      });
    }

    // Post'u sil
    await pool.query("DELETE FROM posts WHERE post_id = $1", [postId]);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error.message,
    });
  }
});

export default router;
