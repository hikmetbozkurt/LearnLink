import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import pool from "../config/database.js"; // Pool'u ekleyelim

const router = express.Router();
const upload = multer(); // Dosya yüklemeleri için

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

      console.log("Creating post with data:", {
        courseId,
        userId,
        content,
        type,
        file: req.file,
      });

      // Post'u oluştur
      const result = await pool.query(
        "INSERT INTO posts (course_id, author_id, content, type) VALUES ($1, $2, $3, $4) RETURNING *",
        [courseId, userId, content, type]
      );

      // Author bilgilerini al
      const userResult = await pool.query(
        "SELECT name as author_name, username as author_username FROM users WHERE user_id = $1",
        [userId]
      );

      // Post ve author bilgilerini birleştir
      const post = {
        ...result.rows[0],
        ...userResult.rows[0],
        comments: [], // Boş comments array'i ekle
      };

      console.log("Post created:", post);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        message: "Failed to create post",
        error: error.message,
        details: {
          courseId: req.params.courseId,
          userId: req.user?.user_id,
          content: req.body?.content,
          type: req.body?.type,
        },
      });
    }
  }
);

// Post silme endpoint'i
router.delete('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id;

    // Önce post'un sahibini ve course instructor'ını kontrol et
    const checkResult = await pool.query(`
      SELECT 
        p.author_id,
        c.instructor_id
      FROM posts p
      JOIN courses c ON p.course_id = c.course_id
      WHERE p.post_id = $1
    `, [postId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { author_id, instructor_id } = checkResult.rows[0];

    // Kullanıcı post'un sahibi veya course instructor'ı değilse izin verme
    if (userId !== author_id && userId !== instructor_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this post'
      });
    }

    // Post'u sil
    await pool.query('DELETE FROM posts WHERE post_id = $1', [postId]);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
});

export default router;
