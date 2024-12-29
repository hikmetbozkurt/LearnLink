import asyncHandler from '../utils/asyncHandler.js';
import pool from '../config/database.js';

export const getAllAssignments = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM assignments ORDER BY due_date ASC');
  res.json(result.rows);
});

export const getAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM assignments WHERE assignment_id = $1', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Assignment not found' });
  }
  
  res.json(result.rows[0]);
});

export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, due_date, course_id } = req.body;
  const result = await pool.query(
    'INSERT INTO assignments (title, description, due_date, course_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, description, due_date, course_id]
  );
  res.status(201).json(result.rows[0]);
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date } = req.body;
  const result = await pool.query(
    'UPDATE assignments SET title = $1, description = $2, due_date = $3 WHERE assignment_id = $4 RETURNING *',
    [title, description, due_date, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Assignment not found' });
  }
  
  res.json(result.rows[0]);
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM assignments WHERE assignment_id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Assignment not found' });
  }
  
  res.json({ message: 'Assignment deleted successfully' });
});

export const getAssignments = asyncHandler(async (req, res) => {
  const { course_id } = req.params;
  const result = await pool.query('SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date ASC', [course_id]);
  res.json(result.rows);
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  const { submission_content } = req.body;
  
  const result = await pool.query(
    'INSERT INTO assignment_submissions (assignment_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
    [id, userId, submission_content]
  );
  
  res.status(201).json(result.rows[0]);
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const { id, submission_id } = req.params;
  const { grade, feedback } = req.body;
  
  const result = await pool.query(
    'UPDATE assignment_submissions SET grade = $1, feedback = $2 WHERE submission_id = $3 AND assignment_id = $4 RETURNING *',
    [grade, feedback, submission_id, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Submission not found' });
  }
  
  res.json(result.rows[0]);
});

export const getSubmissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT * FROM assignment_submissions WHERE assignment_id = $1 ORDER BY submitted_at DESC',
    [id]
  );
  res.json(result.rows);
}); 