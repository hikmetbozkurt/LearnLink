import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/database.js";

export const getAllCourses = asyncHandler(async (req, res) => {
  try {
    // Tüm kursları getir, ama admin durumunu da kontrol et
    const result = await pool.query(
      `
      SELECT 
        c.*,
        u.name as instructor_name,
        CASE WHEN c.instructor_id = $1 THEN true ELSE false END as is_admin,
        CASE WHEN e.user_id IS NOT NULL THEN true ELSE false END as is_enrolled
      FROM courses c
      JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.user_id = $1
    `,
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching all courses:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

export const getCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const result = await pool.query(
    `SELECT c.*, 
      u.name as instructor_name,
      CASE WHEN c.instructor_id = $2 THEN true ELSE false END as is_admin,
      CASE WHEN e.user_id IS NOT NULL THEN true ELSE false END as is_enrolled 
    FROM courses c
    LEFT JOIN users u ON c.instructor_id = u.user_id
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.user_id = $2
    WHERE c.course_id = $1`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Course not found" });
  }

  res.json(result.rows[0]);
});

export const createCourse = asyncHandler(async (req, res) => {
  try {
    // Debug için request body'i logla

    const { title, description } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    // Transaction başlat
    await pool.query("BEGIN");
    
    try {
      // Course oluştur (student_count=1 ile başlat)
      const courseResult = await pool.query(
        "INSERT INTO courses (title, description, instructor_id, student_count) VALUES ($1, $2, $3, 1) RETURNING *",
        [title, description, req.user.user_id]
      );
      
      const newCourse = courseResult.rows[0];
      
      // Instructor/admin için enrollment kaydı ekle
      await pool.query(
        "INSERT INTO enrollments (course_id, user_id) VALUES ($1, $2)",
        [newCourse.course_id, req.user.user_id]
      );
      
      await pool.query("COMMIT");
      
      res.status(201).json({
        success: true,
        course: newCourse,
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const result = await pool.query(
    "UPDATE courses SET name = $1, description = $2 WHERE course_id = $3 RETURNING *",
    [name, description, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Course not found" });
  }

  res.json(result.rows[0]);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.user_id;

    // Önce kursu kontrol et
    const courseCheck = await pool.query(
      "SELECT * FROM courses WHERE course_id = $1 AND instructor_id = $2",
      [courseId, userId]
    );

    if (courseCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Course not found or you are not authorized" });
    }

    // İlgili kayıtları sil (transaction kullanarak)
    await pool.query("BEGIN");
    try {
      // Delete submissions related to course assignments first
      await pool.query(
        `DELETE FROM submissions 
         WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id = $1)`,
        [courseId]
      );

      // Delete assignments related to the course
      await pool.query("DELETE FROM assignments WHERE course_id = $1", [
        courseId,
      ]);

      // Önce enrollments'ları sil
      await pool.query("DELETE FROM enrollments WHERE course_id = $1", [
        courseId,
      ]);

      // Sonra posts'ları sil
      await pool.query("DELETE FROM posts WHERE course_id = $1", [courseId]);

      // En son kursu sil
      await pool.query("DELETE FROM courses WHERE course_id = $1", [courseId]);

      await pool.query("COMMIT");
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteCourse:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const getMyCourses = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Sadece admin olduğum veya üye olduğum kursları getir
    const result = await pool.query(
      `
      SELECT DISTINCT 
        c.*,
        u.name as instructor_name,
        CASE WHEN c.instructor_id = $1 THEN true ELSE false END as is_admin,
        CASE WHEN e.user_id IS NOT NULL THEN true ELSE false END as is_enrolled
      FROM courses c
      JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.user_id = $1
      WHERE c.instructor_id = $1 OR e.user_id = $1
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching my courses:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

export const joinCourse = asyncHandler(async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.user_id;

    // Önce kursu kontrol et
    const courseCheck = await pool.query(
      `SELECT c.*
       FROM courses c 
       WHERE course_id = $1`,
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const course = courseCheck.rows[0];

    // Kullanıcı kursun instructor'ı mı kontrol et (admin)
    if (course.instructor_id === userId) {
      return res.status(400).json({ 
        message: "You are already an admin of this course" 
      });
    }

    // Zaten kayıtlı mı kontrol et
    const enrollmentCheck = await pool.query(
      "SELECT * FROM enrollments WHERE course_id = $1 AND user_id = $2",
      [courseId, userId]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this course" });
    }

    // Kurs dolu mu kontrol et
    if (course.student_count >= course.max_students) {
      return res.status(400).json({ message: "Course is full" });
    }

    // Transaction başlat
    await pool.query("BEGIN");
    
    try {
      // Enrollment'ı ekle
      await pool.query(
        "INSERT INTO enrollments (course_id, user_id) VALUES ($1, $2)",
        [courseId, userId]
      );

      // Student count'u güncelle
      await pool.query(
        "UPDATE courses SET student_count = student_count + 1 WHERE course_id = $1",
        [courseId]
      );

      await pool.query("COMMIT");
      res.json({ message: "Successfully joined the course" });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error joining course:", error);
    res.status(500).json({ message: "Failed to join course" });
  }
});

export const leaveCourse = asyncHandler(async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.user_id;

    // Önce kursu kontrol et
    const courseCheck = await pool.query(
      `SELECT c.*
       FROM courses c 
       WHERE course_id = $1`,
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const course = courseCheck.rows[0];

    // Kullanıcı kursun instructor'ı mı kontrol et (admin)
    if (course.instructor_id === userId) {
      return res.status(400).json({ 
        message: "As an admin, you cannot leave your own course. You can delete it instead." 
      });
    }
    
    // Enrollment'ı kontrol et
    const enrollmentCheck = await pool.query(
      "SELECT * FROM enrollments WHERE course_id = $1 AND user_id = $2",
      [courseId, userId]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "You are not enrolled in this course" });
    }

    // Transaction başlat
    await pool.query("BEGIN");
    try {
      // Enrollment'ı sil
      await pool.query(
        "DELETE FROM enrollments WHERE course_id = $1 AND user_id = $2",
        [courseId, userId]
      );

      // Student count'u güncelle
      await pool.query(
        "UPDATE courses SET student_count = student_count - 1 WHERE course_id = $1",
        [courseId]
      );

      await pool.query("COMMIT");
      res.json({ message: "Successfully left the course" });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error in leaveCourse:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const getCourseCompletionStats = asyncHandler(async (req, res) => {
  try {
    // Get the number of courses each user owns
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        COUNT(c.course_id) as course_count
      FROM 
        users u
      LEFT JOIN 
        courses c ON u.user_id = c.instructor_id
      GROUP BY 
        u.user_id, u.name
      ORDER BY 
        course_count DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user course statistics:', error);
    res.status(500).json({ message: 'Failed to fetch user course statistics' });
  }
});

export const getUserCourses = asyncHandler(async (req, res) => {
  try {
    let { userId } = req.params;
    
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Convert userId to number if it's a string
    if (typeof userId === 'string') {
      userId = parseInt(userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
    }

    // Get courses where the user is enrolled or is the instructor
    const query = `
      SELECT DISTINCT 
        c.*,
        u.name as instructor_name,
        CASE WHEN c.instructor_id = $1 THEN true ELSE false END as is_admin,
        CASE WHEN e.user_id IS NOT NULL THEN true ELSE false END as is_enrolled
      FROM courses c
      JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.user_id = $1
      WHERE c.instructor_id = $1 OR e.user_id = $1
    `;
    
    
    const result = await pool.query(query, [userId]);
    
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching user courses:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Failed to fetch courses",
      error: error.message,
      stack: error.stack
    });
  }
});
