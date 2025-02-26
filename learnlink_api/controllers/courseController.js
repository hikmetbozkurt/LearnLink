import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

export const getAllCourses = asyncHandler(async (req, res) => {
  try {
    // Tüm kursları getir, ama admin durumunu da kontrol et
    const result = await pool.query(`
      SELECT 
        c.*,
        u.name as instructor_name,
        CASE WHEN c.instructor_id = $1 THEN true ELSE false END as is_admin,
        CASE WHEN e.user_id IS NOT NULL THEN true ELSE false END as is_enrolled
      FROM courses c
      JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.user_id = $1
    `, [req.user.user_id]);

    console.log('All courses:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

export const getCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM courses WHERE course_id = $1', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Course not found' });
  }
  
  res.json(result.rows[0]);
});

export const createCourse = asyncHandler(async (req, res) => {
  try {
    // Debug için request body'i logla
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    const { title, description } = req.body;

    // Validation
    if (!title || !description) {
      console.log('Validation failed:', { title, description });
      return res.status(400).json({ 
        message: 'Title and description are required' 
      });
    }

    // Course oluştur
    const result = await pool.query(
      'INSERT INTO courses (title, description, instructor_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, req.user.user_id]
    );

    res.status(201).json({
      success: true,
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create course',
      error: error.message 
    });
  }
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const result = await pool.query(
    'UPDATE courses SET name = $1, description = $2 WHERE course_id = $3 RETURNING *',
    [name, description, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Course not found' });
  }
  
  res.json(result.rows[0]);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM courses WHERE course_id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Course not found' });
  }
  
  res.json({ message: 'Course deleted successfully' });
});

export const getMyCourses = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Sadece admin olduğum veya üye olduğum kursları getir
    const result = await pool.query(`
      SELECT DISTINCT 
        c.*,
        u.name as instructor_name,
        CASE WHEN c.instructor_id = $1 THEN true ELSE false END as is_admin
      FROM courses c
      JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      WHERE c.instructor_id = $1 OR e.user_id = $1
    `, [userId]);

    console.log('My courses:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching my courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

export const joinCourse = asyncHandler(async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.user_id;

    // Önce kursu kontrol et
    const courseCheck = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.course_id) as current_students
       FROM courses c 
       WHERE course_id = $1`,
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const course = courseCheck.rows[0];

    // Zaten kayıtlı mı kontrol et
    const enrollmentCheck = await pool.query(
      'SELECT * FROM enrollments WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Kurs dolu mu kontrol et
    if (course.current_students >= course.max_students) {
      return res.status(400).json({ message: 'Course is full' });
    }

    // Enrollment'ı ekle
    await pool.query(
      'INSERT INTO enrollments (course_id, user_id) VALUES ($1, $2)',
      [courseId, userId]
    );

    // Student count'u güncelle
    await pool.query(
      'UPDATE courses SET student_count = student_count + 1 WHERE course_id = $1',
      [courseId]
    );

    res.json({ message: 'Successfully joined the course' });
  } catch (error) {
    console.error('Error joining course:', error);
    res.status(500).json({ message: 'Failed to join course' });
  }
});