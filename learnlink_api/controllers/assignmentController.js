import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/database.js";
import { createNewAssignmentNotification, createAssignmentSubmissionNotification } from '../utils/notificationUtils.js';
import * as s3Service from '../services/s3Service.js';
import fs from 'fs';

export const getAllAssignments = asyncHandler(async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM assignments ORDER BY due_date ASC"
  );
  res.json(result.rows);
});

export const getAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM assignments WHERE assignment_id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  res.json(result.rows[0]);
});

export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, due_date, course_id, points, grading_criteria } = req.body;

  // Parse the date to ensure it's in the correct format for PostgreSQL TIMESTAMP
  let formattedDueDate = due_date;
  
  try {
    // Now insert the assignment
    const result = await pool.query(
      "INSERT INTO assignments (title, description, due_date, course_id, points, grading_criteria, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        title,
        description,
        formattedDueDate,
        course_id,
        points || 100,
        grading_criteria || "",
        "assignment",
      ]
    );

    const newAssignment = result.rows[0];
    
    // Get course title and enrolled students
    const courseResult = await pool.query(
      "SELECT title, instructor_id FROM courses WHERE course_id = $1",
      [course_id]
    );

    if (courseResult.rows.length > 0) {
      const course = courseResult.rows[0];
      
      // Get enrolled users (excluding the instructor)
      const enrolledUsersResult = await pool.query(
        `SELECT user_id FROM enrollments 
         WHERE course_id = $1 AND user_id != $2`,
        [course_id, course.instructor_id]
      );

      const enrolledUserIds = enrolledUsersResult.rows.map(row => row.user_id);
      
      if (enrolledUserIds.length > 0) {
        // Create notifications for enrolled users
        await createNewAssignmentNotification(
          newAssignment, 
          course.title, // Using title field from course table
          enrolledUserIds
        );
      }
    }

    res.status(201).json(newAssignment);
  } catch (error) {
    console.error("Error in createAssignment:", error);
    res
      .status(500)
      .json({ message: "Failed to create assignment", error: error.message });
  }
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, points, grading_criteria } = req.body;

  // Parse the date to ensure it's in the correct format for PostgreSQL TIMESTAMP
  let formattedDueDate = due_date;

  try {
    const result = await pool.query(
      "UPDATE assignments SET title = $1, description = $2, due_date = $3, points = $4, grading_criteria = $5 WHERE assignment_id = $6 RETURNING *",
      [title, description, formattedDueDate, points || 100, grading_criteria || "", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res
      .status(500)
      .json({ message: "Failed to update assignment", error: error.message });
  }
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Use a transaction to ensure data consistency
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, delete all submissions for this assignment
    await client.query("DELETE FROM submissions WHERE assignment_id = $1", [id]);

    // Then delete the assignment
    const result = await client.query(
      "DELETE FROM assignments WHERE assignment_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Assignment not found" });
    }

    await client.query('COMMIT');
    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error deleting assignment ${id}:`, error);
    res.status(500).json({
      message: "Failed to delete assignment",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

export const getAssignments = asyncHandler(async (req, res) => {
  const { course_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date ASC",
      [course_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching assignments for course ${course_id}:`, error);
    res
      .status(500)
      .json({ message: "Failed to fetch assignments", error: error.message });
  }
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  const { content } = req.body;
  let fileUrl = null;
  let fileName = null;
  let mimeType = null;

  // Handle file upload if present
  if (req.file) {
    try {
      // Upload to S3
      const folderPath = 'assignments/';
      fileUrl = await s3Service.uploadFile(req.file, folderPath);
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
      
      // Remove the temp file after successful S3 upload
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
    } catch (error) {
      console.error('Error uploading assignment file to S3:', error);
      return res.status(500).json({ 
        message: "Failed to upload assignment file to S3", 
        error: error.message 
      });
    }
  }

  // Use a transaction for data consistency
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert the submission
    const submissionResult = await client.query(
      "INSERT INTO submissions (assignment_id, user_id, content, file_url, file_name, mime_type, submitted_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *",
      [id, userId, content || "", fileUrl, fileName, mimeType]
    );
    
    
    // Get assignment and course details for notification
    const assignmentResult = await client.query(
      `SELECT a.*, c.title as course_name, c.course_id, c.instructor_id 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.course_id 
       WHERE a.assignment_id = $1`,
      [id]
    );
    
    if (assignmentResult.rows.length > 0) {
      // Get user details
      const userResult = await client.query(
        "SELECT user_id, name, username FROM users WHERE user_id = $1",
        [userId]
      );
      
      if (userResult.rows.length > 0) {
        const assignment = assignmentResult.rows[0];
        const user = userResult.rows[0];
        const course = {
          course_id: assignment.course_id,
          name: assignment.course_name,
          instructor_id: assignment.instructor_id
        };
        
        
        try {
          // Create notification for the instructor using direct database insertion
          // Using the most reliable method directly
          const submissionDate = new Date().toLocaleString();
          const notificationContent = `[SUBMISSION] ${user.name} has submitted assignment "${assignment.title}" for course "${course.name}" on ${submissionDate}. Click to view details.`;
          const instructorId = course.instructor_id;
          
          // Use the client from the transaction to ensure consistency
          const notificationResult = await client.query(
            `INSERT INTO notifications 
             (sender_id, recipient_id, content, type, reference_id, assignment_id, submission_id, course_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
             RETURNING *`,
            [
              userId,                               // sender_id
              instructorId,                         // recipient_id
              notificationContent,                  // content
              'assignment_submission',              // type
              submissionResult.rows[0].submission_id, // reference_id (aynı zamanda submission_id)
              id,                                   // assignment_id
              submissionResult.rows[0].submission_id, // submission_id
              course.course_id                      // course_id
            ]
          );
          
          
        } catch (notificationError) {
          console.error('Error creating assignment submission notification:', notificationError);
          // Continue with the transaction even if notification fails
          // The submission is more important than the notification
        }
      } else {
        console.error(`User not found for ID ${userId}`);
      }
    } else {
      console.error(`Assignment not found for ID ${id}`);
    }
    
    await client.query('COMMIT');
    res.status(201).json(submissionResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error submitting assignment:", error);
    res.status(500).json({
      message: "Failed to submit assignment",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const { id, submission_id } = req.params;
  const { grade, feedback } = req.body;

  try {
    const result = await pool.query(
      "UPDATE submissions SET grade = $1, feedback = $2 WHERE submission_id = $3 AND assignment_id = $4 RETURNING *",
      [grade, feedback, submission_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error grading submission:", error);
    res
      .status(500)
      .json({ message: "Failed to grade submission", error: error.message });
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
    console.error("Error fetching submissions:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch submissions", error: error.message });
  }
});

export const getUserSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT 
        s.submission_id, 
        s.assignment_id, 
        s.user_id, 
        u.name as user_name,
        s.content, 
        s.file_url, 
        s.grade, 
        s.feedback,
        s.submitted_at
      FROM submissions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.assignment_id = $1 AND s.user_id = $2
      LIMIT 1`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      // Return 200 with null data instead of 404
      return res.status(200).json(null);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user submission:", error);
    res.status(500).json({
      message: "Failed to fetch user submission",
      error: error.message,
    });
  }
});
