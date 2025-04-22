import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

export const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.user_id;

  try {
    // Create the comment
    const result = await pool.query(
      `INSERT INTO comments (post_id, author_id, content, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING comment_id, content, created_at`,
      [postId, userId, content]
    );

    // Get the author info
    const userResult = await pool.query(
      'SELECT username FROM users WHERE user_id = $1',
      [userId]
    );

    const comment = {
      ...result.rows[0],
      author_name: userResult.rows[0]?.username
    };

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

export const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  try {
    // Get comments for the post
    const result = await pool.query(
      `SELECT 
        c.comment_id, c.content, c.created_at,
        u.username as author_name, u.user_id as author_id
       FROM comments c
       JOIN users u ON c.author_id = u.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

export const getUserCommentStats = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  try {
    // Get comment statistics for the logged-in user
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_comments,
        COUNT(DISTINCT post_id) as commented_posts_count,
        MAX(created_at) as last_comment_date
       FROM comments
       WHERE author_id = $1`,
      [userId]
    );

    // Get received comments on user's posts
    const receivedResult = await pool.query(
      `SELECT 
        COUNT(*) as received_comments_count
       FROM comments c
       JOIN posts p ON c.post_id = p.post_id
       WHERE p.author_id = $1 AND c.author_id != $1`,
      [userId]
    );

    const stats = {
      ...result.rows[0],
      received_comments_count: receivedResult.rows[0]?.received_comments_count || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user comment statistics:', error);
    res.status(500).json({ message: 'Failed to fetch comment statistics' });
  }
});

export const getCommentActivityOverTime = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  try {
    // Get comment activity over time (last 6 months)
    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as comment_count
       FROM comments
       WHERE author_id = $1
         AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comment activity over time:', error);
    res.status(500).json({ message: 'Failed to fetch comment activity' });
  }
}); 