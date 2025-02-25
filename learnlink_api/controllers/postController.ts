import { Request, Response } from 'express';
import { pool } from '../config/db';
import { uploadFile } from '../utils/fileUpload';

interface AuthRequest extends Request {
  user: {
    id: number;
    username: string;
  };
}

export const createPost = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { content, type } = req.body;
  const userId = req.user.id;

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
    if (req.file && (type === 'pdf' || type === 'video')) {
      fileUrl = await uploadFile(req.file);
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
};

export const getCoursePosts = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user.id;

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
}; 