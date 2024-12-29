import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

export const getAllCourses = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM courses');
  res.json(result.rows);
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
  const { name, description } = req.body;
  const result = await pool.query(
    'INSERT INTO courses (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  res.status(201).json(result.rows[0]);
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