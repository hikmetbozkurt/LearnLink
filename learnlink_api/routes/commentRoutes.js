import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import pool from '../config/database.js';

const router = express.Router();

router.use(authenticateToken);

// Yorum ekle
router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.user_id;

    // Yorumu ekle
    const result = await pool.query(
      'INSERT INTO comments (post_id, author_id, content) VALUES ($1, $2, $3) RETURNING *',
      [postId, userId, content]
    );

    // Yazar bilgilerini al
    const userResult = await pool.query(
      'SELECT name as author_name FROM users WHERE user_id = $1',
      [userId]
    );

    // Yorum ve yazar bilgilerini birleştir
    const comment = {
      ...result.rows[0],
      author_name: userResult.rows[0].name
    };

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      message: 'Failed to create comment',
      error: error.message
    });
  }
});

// Post'un yorumlarını getir
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const comments = await pool.query(`
      SELECT 
        c.*,
        u.name as author_name
      FROM comments c
      JOIN users u ON c.author_id = u.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId]);

    res.json(comments.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
});

// Comment silme endpoint'i
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.user_id;

    // Önce comment'in sahibini kontrol et
    const checkResult = await pool.query(`
      SELECT 
        c.author_id,
        p.course_id,
        co.instructor_id
      FROM comments c
      JOIN posts p ON c.post_id = p.post_id
      JOIN courses co ON p.course_id = co.course_id
      WHERE c.comment_id = $1
    `, [commentId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const { author_id, instructor_id } = checkResult.rows[0];

    // Kullanıcı comment'in sahibi veya course instructor'ı değilse izin verme
    if (userId !== author_id && userId !== instructor_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment'
      });
    }

    // Comment'i sil
    await pool.query('DELETE FROM comments WHERE comment_id = $1', [commentId]);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
});

export default router; 