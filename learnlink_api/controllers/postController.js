import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

export const createPost = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { content, type } = req.body;
  const userId = req.user.user_id || req.user.id;

  try {
    // Kullanıcının kursa erişimi var mı kontrol et
    const courseAccess = await pool.query(
      `SELECT * FROM course_enrollments 
       WHERE course_id = $1 AND user_id = $2`,
      [courseId, userId]
    );

    if (courseAccess.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this course' });
    }

    let fileUrl = null;
    if (req.file) {
      // Simply use the file path directly instead of calling uploadFile
      fileUrl = req.file.path;
    }

    // Post oluştur
    const result = await pool.query(
      `INSERT INTO posts (course_id, author_id, content, type, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING post_id`,
      [courseId, userId, content, type, fileUrl]
    );

    // Yeni oluşturulan postu getir
    const post = await pool.query(
      `SELECT 
        p.*,
        u.username as author_name,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'comment_id', c.comment_id,
              'content', c.content,
              'author_name', cu.username,
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
       WHERE p.post_id = $1`,
      [result.rows[0].post_id]
    );

    res.status(201).json(post.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

export const getCoursePosts = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.user_id || req.user.id;

  try {
    // Kullanıcının kursa erişimi var mı kontrol et
    const courseAccess = await pool.query(
      `SELECT * FROM course_enrollments 
       WHERE course_id = $1 AND user_id = $2`,
      [courseId, userId]
    );

    if (courseAccess.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this course' });
    }

    // Postları ve yorumları getir
    const posts = await pool.query(
      `SELECT 
        p.*,
        u.username as author_name,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'comment_id', c.comment_id,
              'content', c.content,
              'author_name', cu.username,
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
       ORDER BY p.created_at DESC`,
      [courseId]
    );

    res.json(posts.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

export const getUserPostStats = asyncHandler(async (req, res) => {
  // Use either user_id or id, depending on what's available
  const userId = req.user.user_id || req.user.id;

  try {
    // Get post statistics for the logged-in user
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_posts,
        COUNT(DISTINCT course_id) as courses_posted_in,
        MAX(created_at) as last_post_date
       FROM posts
       WHERE author_id = $1`,
      [userId]
    );

    // Get average comments per post
    const commentsResult = await pool.query(
      `SELECT 
        COALESCE(AVG(comment_count), 0) as avg_comments_per_post
       FROM (
         SELECT 
           p.post_id,
           COUNT(c.comment_id) as comment_count
         FROM posts p
         LEFT JOIN comments c ON p.post_id = c.post_id
         WHERE p.author_id = $1
         GROUP BY p.post_id
       ) AS post_comments`,
      [userId]
    );

    const stats = {
      ...result.rows[0],
      avg_comments_per_post: commentsResult.rows[0]?.avg_comments_per_post || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user post statistics:', error);
    res.status(500).json({ message: 'Failed to fetch post statistics' });
  }
});

export const getPostActivityOverTime = asyncHandler(async (req, res) => {
  const userId = req.user.user_id || req.user.id;

  try {
    // Get post activity over time (last 6 months)
    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as post_count
       FROM posts
       WHERE author_id = $1
         AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching post activity over time:', error);
    res.status(500).json({ message: 'Failed to fetch post activity' });
  }
}); 