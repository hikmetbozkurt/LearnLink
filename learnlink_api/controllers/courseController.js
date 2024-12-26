import pool from '../config/database.js';

export class CourseController {
  constructor() {
    // Bind methods
    this.createCourse = this.createCourse.bind(this);
    this.getCourses = this.getCourses.bind(this);
    this.getCourseById = this.getCourseById.bind(this);
    this.updateCourse = this.updateCourse.bind(this);
    this.deleteCourse = this.deleteCourse.bind(this);
    this.enrollInCourse = this.enrollInCourse.bind(this);
  }

  // Create a new course
  async createCourse(req, res) {
    const { title, description, instructor_id, category } = req.body;

    try {
      const result = await pool.query(
        'INSERT INTO courses (title, description, instructor_id, category) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, description, instructor_id, category]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create course'
      });
    }
  }

  // Get all courses
  async getCourses(req, res) {
    try {
      const result = await pool.query(
        'SELECT c.*, u.name as instructor_name FROM courses c JOIN users u ON c.instructor_id = u.user_id'
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch courses'
      });
    }
  }

  // Get course by ID
  async getCourseById(req, res) {
    const { id } = req.params;

    try {
      const result = await pool.query(
        'SELECT c.*, u.name as instructor_name FROM courses c JOIN users u ON c.instructor_id = u.user_id WHERE c.course_id = $1',
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course'
      });
    }
  }

  // Update course
  async updateCourse(req, res) {
    const { id } = req.params;
    const { title, description, category } = req.body;

    try {
      const result = await pool.query(
        'UPDATE courses SET title = $1, description = $2, category = $3 WHERE course_id = $4 RETURNING *',
        [title, description, category, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update course'
      });
    }
  }

  // Delete course
  async deleteCourse(req, res) {
    const { id } = req.params;

    try {
      const result = await pool.query(
        'DELETE FROM courses WHERE course_id = $1 RETURNING *',
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete course'
      });
    }
  }

  // Enroll in course
  async enrollInCourse(req, res) {
    const { course_id } = req.params;
    const { user_id } = req.body;

    try {
      // Check if already enrolled
      const enrolled = await pool.query(
        'SELECT * FROM enrollments WHERE course_id = $1 AND user_id = $2',
        [course_id, user_id]
      );

      if (enrolled.rows.length) {
        return res.status(400).json({
          success: false,
          message: 'Already enrolled in this course'
        });
      }

      // Create enrollment
      await pool.query(
        'INSERT INTO enrollments (course_id, user_id) VALUES ($1, $2)',
        [course_id, user_id]
      );

      res.json({
        success: true,
        message: 'Successfully enrolled in course'
      });
    } catch (error) {
      console.error('Enrollment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enroll in course'
      });
    }
  }
} 