import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/database.js";

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

  console.log("Creating assignment with data:", {
    title,
    description,
    due_date,
    course_id,
    points,
    grading_criteria,
  });

  try {
    // First check if the assignments table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignments')"
    );

    if (!tableCheck.rows[0].exists) {
      console.log("Assignments table does not exist, creating it");
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
      console.log("Checking for missing columns in assignments table");

      // Check for title column
      const titleCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'title')"
      );
      if (!titleCheck.rows[0].exists) {
        console.log("Adding title column to assignments table");
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Assignment'"
        );
      }

      // Check for points column
      const pointsCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'points')"
      );
      if (!pointsCheck.rows[0].exists) {
        console.log("Adding points column to assignments table");
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN points INTEGER DEFAULT 100"
        );
      }

      // Check for grading_criteria column
      const gradingCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'grading_criteria')"
      );
      if (!gradingCheck.rows[0].exists) {
        console.log("Adding grading_criteria column to assignments table");
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN grading_criteria TEXT"
        );
      }

      // Check for type column
      const typeCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'type')"
      );
      if (!typeCheck.rows[0].exists) {
        console.log("Adding type column to assignments table");
        await pool.query(
          "ALTER TABLE assignments ADD COLUMN type VARCHAR(20) DEFAULT 'assignment'"
        );
      }
    }

    // Now insert the assignment
    console.log("Inserting new assignment");
    const result = await pool.query(
      "INSERT INTO assignments (title, description, due_date, course_id, points, grading_criteria, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        title,
        description,
        due_date,
        course_id,
        points || 100,
        grading_criteria || "",
        "assignment",
      ]
    );

    console.log("Assignment created successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
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

  try {
    const result = await pool.query(
      "UPDATE assignments SET title = $1, description = $2, due_date = $3, points = $4, grading_criteria = $5 WHERE assignment_id = $6 RETURNING *",
      [title, description, due_date, points || 100, grading_criteria || "", id]
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
            due_date,
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
  const result = await pool.query(
    "DELETE FROM assignments WHERE assignment_id = $1 RETURNING *",
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  res.json({ message: "Assignment deleted successfully" });
});

export const getAssignments = asyncHandler(async (req, res) => {
  const { course_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date ASC",
      [course_id]
    );
    console.log(
      `Found ${result.rows.length} assignments for course ${course_id}`
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

  console.log("Submitting assignment:", { id, userId, content, fileUrl });

  try {
    // First check if the submissions table exists
    const checkTable = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'submissions')"
    );

    if (!checkTable.rows[0].exists) {
      console.log("Submissions table does not exist, creating it...");
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
      console.log("Submissions table created successfully");
    } else {
      // Check if the required columns exist
      console.log("Checking if required columns exist in submissions table");

      // Check if content column exists
      const contentColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'content')"
      );

      if (!contentColumnCheck.rows[0].exists) {
        console.log(
          "Content column doesn't exist, adding it to submissions table"
        );
        await pool.query("ALTER TABLE submissions ADD COLUMN content TEXT");
      }

      // Check for submitted_at column
      const submittedAtColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'submitted_at')"
      );

      if (!submittedAtColumnCheck.rows[0].exists) {
        console.log(
          "submitted_at column doesn't exist, adding it to submissions table"
        );
        await pool.query(
          "ALTER TABLE submissions ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        );
      }

      // Check for file_url column
      const fileUrlColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'file_url')"
      );

      if (!fileUrlColumnCheck.rows[0].exists) {
        console.log(
          "file_url column doesn't exist, adding it to submissions table"
        );
        await pool.query("ALTER TABLE submissions ADD COLUMN file_url TEXT");
      }

      // Check for grade column
      const gradeColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'grade')"
      );

      if (!gradeColumnCheck.rows[0].exists) {
        console.log(
          "grade column doesn't exist, adding it to submissions table"
        );
        await pool.query(
          "ALTER TABLE submissions ADD COLUMN grade VARCHAR(10)"
        );
      }

      // Check for feedback column
      const feedbackColumnCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'feedback')"
      );

      if (!feedbackColumnCheck.rows[0].exists) {
        console.log(
          "feedback column doesn't exist, adding it to submissions table"
        );
        await pool.query("ALTER TABLE submissions ADD COLUMN feedback TEXT");
      }
    }

    console.log("Inserting submission");

    // Try to insert without specifying submitted_at to use DEFAULT value
    try {
      // Insert the submission
      const result = await pool.query(
        "INSERT INTO submissions (assignment_id, user_id, content, file_url) VALUES ($1, $2, $3, $4) RETURNING *",
        [id, userId, content || "", fileUrl]
      );

      console.log("Submission successful:", result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (insertError) {
      console.error("Error inserting with DEFAULT timestamp:", insertError);

      // If that fails, use explicit CURRENT_TIMESTAMP
      const result = await pool.query(
        "INSERT INTO submissions (assignment_id, user_id, content, file_url, submitted_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *",
        [id, userId, content || "", fileUrl]
      );

      console.log(
        "Submission successful with explicit timestamp:",
        result.rows[0]
      );
      res.status(201).json(result.rows[0]);
    }
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
    // First check if the submissions table has the submitted_at column
    const submittedAtColumnCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'submitted_at')"
    );

    if (!submittedAtColumnCheck.rows[0].exists) {
      console.log(
        "submitted_at column doesn't exist, adding it to submissions table"
      );
      await pool.query(
        "ALTER TABLE submissions ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      );
    }

    // Use timestamp or created_at if available, otherwise modify the query
    const result = await pool.query(
      `SELECT s.submission_id, s.assignment_id, s.user_id, u.name as user_name,
       s.content, s.file_url, s.grade, s.feedback,
       COALESCE(s.submitted_at, NOW()) as submitted_at
       FROM submissions s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.assignment_id = $1 AND s.user_id = $2
       LIMIT 1`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No submission found for this user" });
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
