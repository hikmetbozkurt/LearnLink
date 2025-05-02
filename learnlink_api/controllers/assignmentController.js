import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/database.js";
import { createNewAssignmentNotification, createAssignmentSubmissionNotification } from '../utils/notificationUtils.js';

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
  const { title, description, due_date, course_id, points, grading_criteria } =
    req.body;

  // Parse the date to ensure it's in the correct format for PostgreSQL TIMESTAMP
  let formattedDueDate = due_date;
  try {
    // If date doesn't have timezone information, keep it as is
    // This will respect the user's local timezone when displayed
    if (due_date && !due_date.endsWith('Z')) {
    } else {
    }
  } catch (error) {
    console.error("Error processing due date:", error);
  }

  try {
    // First check if the assignments table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignments')"
    );

    if (!tableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS assignments (
          assignment_id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          due_date TIMESTAMP NOT NULL,
          course_id INTEGER REFERENCES courses(course_id),
          points INTEGER DEFAULT 100,
          grading_criteria TEXT,
          type VARCHAR(20) DEFAULT 'assignment'
        )
      `);
    } else {
      // Check for missing columns and add them if needed

      // Check and upgrade due_date column from DATE to TIMESTAMP if needed
      const dueDateTypeCheck = await pool.query(
        "SELECT data_type FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'due_date'"
      );
      
      if (dueDateTypeCheck.rows.length > 0 && dueDateTypeCheck.rows[0].data_type === 'date') {
        await pool.query(
          "ALTER TABLE assignments ALTER COLUMN due_date TYPE TIMESTAMP USING due_date::timestamp"
        );
      }

      // Check for title column
      const titleCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'title')"
      );
      if (!titleCheck.rows[0].exists) {
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Assignment'"
        );
      }

      // Check for points column
      const pointsCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'points')"
      );
      if (!pointsCheck.rows[0].exists) {
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN points INTEGER DEFAULT 100"
        );
      }

      // Check for grading_criteria column
      const gradingCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'grading_criteria')"
      );
      if (!gradingCheck.rows[0].exists) {
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN grading_criteria TEXT"
        );
      }

      // Check for type column
      const typeCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'type')"
      );
      if (!typeCheck.rows[0].exists) {
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN type VARCHAR(20) DEFAULT 'assignment'"
        );
      }
    }

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

    // Ensure notifications table has required columns
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS assignment_id INTEGER");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS submission_id INTEGER");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS course_id INTEGER");
    
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
      } else {
      }
    } else {
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
    // If date doesn't have timezone information, keep it as is
    // This will respect the user's local timezone when displayed
    if (due_date && !due_date.endsWith('Z')) {
    } else {
    }
  } catch (error) {
    console.error("Error processing due date during update:", error);
  }

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
    // If error is about missing columns, try to add them
    if (
      error.message.includes("column") &&
      error.message.includes("does not exist")
    ) {
      try {
        // Add necessary columns if they don't exist
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Assignment'"
        );
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100"
        );
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS grading_criteria TEXT"
        );

        // Try update again
        const result = await pool.query(
          "UPDATE assignments SET title = $1, description = $2, due_date = $3, points = $4, grading_criteria = $5 WHERE assignment_id = $6 RETURNING *",
          [
            title,
            description,
            formattedDueDate,
            points || 100,
            grading_criteria || "",
            id,
          ]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Assignment not found" });
        }

        res.json(result.rows[0]);
      } catch (secondError) {
        console.error(
          "Error updating assignment after schema update:",
          secondError
        );
        res.status(500).json({
          message: "Failed to update assignment",
          error: secondError.message,
        });
      }
    } else {
      console.error("Error updating assignment:", error);
      res
        .status(500)
        .json({ message: "Failed to update assignment", error: error.message });
    }
  }
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // First, delete all submissions for this assignment
    await pool.query("DELETE FROM submissions WHERE assignment_id = $1", [id]);

    // Then delete the assignment
    const result = await pool.query(
      "DELETE FROM assignments WHERE assignment_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error(`Error deleting assignment ${id}:`, error);
    res.status(500).json({
      message: "Failed to delete assignment",
      error: error.message,
    });
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
    } else {
      // Check if the required columns exist

      // Check if content column exists
      const contentColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'content')"
      );

      if (!contentColumnCheck.rows[0].exists) {
        await pool.query("ALTER TABLE submissions ADD COLUMN content TEXT");
      }

      // Check for submitted_at column
      const submittedAtColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'submitted_at')"
      );

      if (!submittedAtColumnCheck.rows[0].exists) {
        await pool.query(
          "ALTER TABLE submissions ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        );
      }

      // Check for file_url column
      const fileUrlColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'file_url')"
      );

      if (!fileUrlColumnCheck.rows[0].exists) {
        await pool.query("ALTER TABLE submissions ADD COLUMN file_url TEXT");
      }

      // Check for grade column
      const gradeColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'grade')"
      );

      if (!gradeColumnCheck.rows[0].exists) {
        await pool.query(
          "ALTER TABLE submissions ADD COLUMN grade VARCHAR(10)"
        );
      }

      // Check for feedback column
      const feedbackColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'feedback')"
      );

      if (!feedbackColumnCheck.rows[0].exists) {
        await pool.query("ALTER TABLE submissions ADD COLUMN feedback TEXT");
      }
    }

    let submissionResult;
    
    // Try to insert without specifying submitted_at to use DEFAULT value
    try {
      // Insert the submission
      submissionResult = await pool.query(
        "INSERT INTO submissions (assignment_id, user_id, content, file_url) VALUES ($1, $2, $3, $4) RETURNING *",
        [id, userId, content || "", fileUrl]
      );

    } catch (insertError) {
      console.error("Error inserting with DEFAULT timestamp:", insertError);

      // If that fails, use explicit CURRENT_TIMESTAMP
      submissionResult = await pool.query(
        "INSERT INTO submissions (assignment_id, user_id, content, file_url, submitted_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *",
        [id, userId, content || "", fileUrl]
      );

    }
    
    // Get assignment and course details for notification
    const assignmentResult = await pool.query(
      `SELECT a.*, c.title as course_name, c.course_id, c.instructor_id 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.course_id 
       WHERE a.assignment_id = $1`,
      [id]
    );
    
    if (assignmentResult.rows.length > 0) {
      // Get user details
      const userResult = await pool.query(
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
        
        // Create notification for the instructor
        await createAssignmentSubmissionNotification(
          submissionResult.rows[0],
          user,
          assignment,
          course
        );
      }
    }
    
    res.status(201).json(submissionResult.rows[0]);
  } catch (error) {
    console.error("Error submitting assignment:", error);
    res.status(500).json({
      message: "Failed to submit assignment",
      error: error.message,
    });
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
    // Önce tüm gerekli sütunların varlığını kontrol et
    const columnsToCheck = ['content', 'file_url', 'grade', 'feedback', 'submitted_at'];
    
    for (const column of columnsToCheck) {
      const columnCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'submissions' AND column_name = $1
        )`, [column]
      );
      
      if (!columnCheck.rows[0].exists) {
        
        if (column === 'submitted_at') {
          await pool.query(`ALTER TABLE submissions ADD COLUMN ${column} TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        } else if (column === 'grade') {
          await pool.query(`ALTER TABLE submissions ADD COLUMN ${column} VARCHAR(10)`);
        } else {
          await pool.query(`ALTER TABLE submissions ADD COLUMN ${column} TEXT`);
        }
      }
    }

    // Sorguyu doğru sütun adlarıyla çalıştır
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
        COALESCE(s.submitted_at, s.submissiondate, NOW()) as submitted_at
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
