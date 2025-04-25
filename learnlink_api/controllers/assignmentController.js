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
  const { title, description, due_date, course_id, points, grading_criteria } = req.body;
  
  // First check if the title column exists in the assignments table
  try {
    // Attempt to create assignment with title
    const result = await pool.query(
      'INSERT INTO assignments (title, description, due_date, course_id, points, grading_criteria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, due_date, course_id, points || 100, grading_criteria || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // If error contains 'column "title" does not exist', we need to alter the table
    if (error.message.includes('column "title" does not exist')) {
      try {
        // Add necessary columns to assignments table
        await pool.query('ALTER TABLE assignments ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT \'Assignment\'');
        await pool.query('ALTER TABLE assignments ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100');
        await pool.query('ALTER TABLE assignments ADD COLUMN IF NOT EXISTS grading_criteria TEXT');
        
        // Now try the insert operation again
        const result = await pool.query(
          'INSERT INTO assignments (title, description, due_date, course_id, points, grading_criteria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [title, description, due_date, course_id, points || 100, grading_criteria || '']
        );
        res.status(201).json(result.rows[0]);
      } catch (secondError) {
        console.error('Error creating assignment after schema update:', secondError);
        res.status(500).json({ message: 'Failed to create assignment', error: secondError.message });
      }
    } else {
      console.error('Error creating assignment:', error);
      res.status(500).json({ message: 'Failed to create assignment', error: error.message });
    }
  }
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, points, grading_criteria } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE assignments SET title = $1, description = $2, due_date = $3, points = $4, grading_criteria = $5 WHERE assignment_id = $6 RETURNING *',
      [title, description, due_date, points || 100, grading_criteria || '', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    // If error is about missing columns, try to add them
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      try {
        // Add necessary columns if they don't exist
        await pool.query('ALTER TABLE assignments ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT \'Assignment\'');
        await pool.query('ALTER TABLE assignments ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100');
        await pool.query('ALTER TABLE assignments ADD COLUMN IF NOT EXISTS grading_criteria TEXT');
        
        // Try update again
        const result = await pool.query(
          'UPDATE assignments SET title = $1, description = $2, due_date = $3, points = $4, grading_criteria = $5 WHERE assignment_id = $6 RETURNING *',
          [title, description, due_date, points || 100, grading_criteria || '', id]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Assignment not found' });
        }
        
        res.json(result.rows[0]);
      } catch (secondError) {
        console.error('Error updating assignment after schema update:', secondError);
        res.status(500).json({ message: 'Failed to update assignment', error: secondError.message });
      }
    } else {
      console.error('Error updating assignment:', error);
      res.status(500).json({ message: 'Failed to update assignment', error: error.message });
    }
  }
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
  
  try {
    const result = await pool.query('SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date ASC', [course_id]);
    console.log(`Found ${result.rows.length} assignments for course ${course_id}`);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching assignments for course ${course_id}:`, error);
    res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
  }
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  const { content } = req.body;
  let fileUrl = null;
  
  // Handle file upload if present
  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
  }
  
  try {
    // First check if the submissions table exists
    const checkTable = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'submissions')"
    );
    
    if (!checkTable.rows[0].exists) {
      // Create the submissions table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS submissions (
          submission_id SERIAL PRIMARY KEY,
          assignment_id INTEGER REFERENCES assignments(assignment_id),
          user_id INTEGER REFERENCES users(user_id),
          content TEXT,
          file_url TEXT,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          grade VARCHAR(10),
          feedback TEXT
        )
      `);
    }
    
    // Insert the submission
    const result = await pool.query(
      'INSERT INTO submissions (assignment_id, user_id, content, file_url, submitted_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
      [id, userId, content || '', fileUrl]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const { id, submission_id } = req.params;
  const { grade, feedback } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE submissions SET grade = $1, feedback = $2 WHERE submission_id = $3 AND assignment_id = $4 RETURNING *',
      [grade, feedback, submission_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Failed to grade submission', error: error.message });
  }
});

export const getSubmissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as user_name 
       FROM submissions s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
});

export const getUserSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as user_name 
       FROM submissions s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.assignment_id = $1 AND s.user_id = $2
       ORDER BY s.submitted_at DESC
       LIMIT 1`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No submission found for this user' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user submission:', error);
    res.status(500).json({ message: 'Failed to fetch user submission', error: error.message });
  }
}); 