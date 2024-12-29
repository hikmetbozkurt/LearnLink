import db from '../config/database.js'

class Course {
  static async getAll() {
    const result = await db.query(`
      SELECT c.*, u.name as instructor_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.course_id) as student_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.user_id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  static async create({ title, description, category, instructorId }) {
    const result = await db.query(
      `INSERT INTO courses (title, description, category, instructor_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [title, description, category, instructorId]
    );
    return result.rows[0];
  }

  static async getById(courseId) {
    const result = await db.query(
      `SELECT c.*, u.name as instructor_name
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.user_id
       WHERE c.course_id = $1`,
      [courseId]
    );
    return result.rows[0];
  }

  static async update(courseId, updates, instructorId) {
    const result = await db.query(
      `UPDATE courses 
       SET title = $1, description = $2, category = $3
       WHERE course_id = $4 AND instructor_id = $5
       RETURNING *`,
      [updates.title, updates.description, updates.category, courseId, instructorId]
    );
    return result.rows[0];
  }

  static async delete(courseId, instructorId) {
    const result = await db.query(
      `DELETE FROM courses 
       WHERE course_id = $1 AND instructor_id = $2
       RETURNING *`,
      [courseId, instructorId]
    );
    return result.rows[0];
  }

  static async enroll(courseId, userId) {
    await db.query(
      `INSERT INTO enrollments (course_id, user_id) 
       VALUES ($1, $2) 
       ON CONFLICT (course_id, user_id) DO NOTHING`,
      [courseId, userId]
    );
  }
}

export default Course; 