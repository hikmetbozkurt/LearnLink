import db from '../config/database.js'

class Assignment {
  static async create(assignmentData) {
    const { course_id, title, description, due_date } = assignmentData
    const result = await db.query(
      `INSERT INTO assignments (course_id, title, description, due_date) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [course_id, title, description, due_date]
    )
    return result.rows[0]
  }

  static async findById(assignmentId) {
    const result = await db.query(
      'SELECT * FROM assignments WHERE assignment_id = $1',
      [assignmentId]
    )
    return result.rows[0]
  }

  static async findByCourse(courseId) {
    const result = await db.query(
      'SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date',
      [courseId]
    )
    return result.rows
  }

  static async submit(submissionData) {
    const { assignment_id, user_id, submission_content } = submissionData
    const result = await db.query(
      `INSERT INTO submissions (assignment_id, user_id, submission_content, timestamp) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
      [assignment_id, user_id, submission_content]
    )
    return result.rows[0]
  }

  static async grade(submissionId, grade, feedback) {
    const result = await db.query(
      `UPDATE submissions 
       SET grade = $1, feedback = $2 
       WHERE submission_id = $3 RETURNING *`,
      [grade, feedback, submissionId]
    )
    return result.rows[0]
  }

  static async getSubmissions(assignmentId) {
    const result = await db.query(
      `SELECT s.*, u.name as student_name 
       FROM submissions s 
       JOIN users u ON s.user_id = u.user_id 
       WHERE s.assignment_id = $1`,
      [assignmentId]
    )
    return result.rows
  }
}

export default Assignment 