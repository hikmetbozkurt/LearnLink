import db from '../config/database.js'

class Course {
  static async create(courseData) {
    const { 
      course_name, description, teacher_id, 
      start_date, end_date, max_students 
    } = courseData

    const result = await db.query(
      `INSERT INTO courses 
       (course_name, description, teacher_id, start_date, end_date, max_students) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [course_name, description, teacher_id, start_date, end_date, max_students]
    )
    return result.rows[0]
  }

  static async findById(courseId) {
    const result = await db.query(
      `SELECT c.*, u.name as teacher_name 
       FROM courses c 
       LEFT JOIN users u ON c.teacher_id = u.user_id 
       WHERE c.course_id = $1 AND c.status != 'archived'`,
      [courseId]
    )
    return result.rows[0]
  }

  static async findAll(filters = {}) {
    const conditions = ['status != $1']
    const values = ['archived']
    let paramCount = 2

    if (filters.teacher_id) {
      conditions.push(`teacher_id = $${paramCount}`)
      values.push(filters.teacher_id)
      paramCount++
    }

    const result = await db.query(
      `SELECT c.*, u.name as teacher_name, 
       (SELECT COUNT(*) FROM user_courses uc WHERE uc.course_id = c.course_id) as student_count 
       FROM courses c 
       LEFT JOIN users u ON c.teacher_id = u.user_id 
       WHERE ${conditions.join(' AND ')} 
       ORDER BY c.created_at DESC`,
      values
    )
    return result.rows
  }

  static async update(courseId, courseData) {
    const allowedUpdates = [
      'course_name', 'description', 'status', 
      'start_date', 'end_date', 'max_students'
    ]
    const updates = []
    const values = []
    let paramCount = 1

    for (const [key, value] of Object.entries(courseData)) {
      if (allowedUpdates.includes(key)) {
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (updates.length === 0) return null

    values.push(courseId)
    const result = await db.query(
      `UPDATE courses 
       SET ${updates.join(', ')} 
       WHERE course_id = $${paramCount} 
       RETURNING *`,
      values
    )
    return result.rows[0]
  }

  static async archive(courseId) {
    const result = await db.query(
      `UPDATE courses 
       SET status = 'archived' 
       WHERE course_id = $1 
       RETURNING *`,
      [courseId]
    )
    return result.rows[0]
  }

  static async enrollStudent(courseId, userId) {
    // Önce kurs kapasitesini kontrol et
    const course = await this.findById(courseId)
    const currentEnrollments = await db.query(
      'SELECT COUNT(*) FROM user_courses WHERE course_id = $1',
      [courseId]
    )

    if (parseInt(currentEnrollments.rows[0].count) >= course.max_students) {
      throw new Error('Course has reached maximum capacity')
    }

    const result = await db.query(
      `INSERT INTO user_courses (user_id, course_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [userId, courseId]
    )
    return result.rows[0]
  }

  static async getEnrolledStudents(courseId) {
    const result = await db.query(
      `SELECT u.user_id, u.name, u.email, uc.enrollment_date, uc.status 
       FROM users u 
       JOIN user_courses uc ON u.user_id = uc.user_id 
       WHERE uc.course_id = $1 
       ORDER BY u.name`,
      [courseId]
    )
    return result.rows
  }
}

export default Course 