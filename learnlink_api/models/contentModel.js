import db from '../config/database.js'

class Content {
  static async create(contentData) {
    const { 
      course_id, title, description, content_type, 
      content_url, order_index = 0 
    } = contentData

    const result = await db.query(
      `INSERT INTO content 
       (course_id, title, description, content_type, content_url, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [course_id, title, description, content_type, content_url, order_index]
    )
    return result.rows[0]
  }

  static async findById(contentId) {
    const result = await db.query(
      `SELECT c.*, co.course_name 
       FROM content c 
       JOIN courses co ON c.course_id = co.course_id 
       WHERE c.content_id = $1`,
      [contentId]
    )
    return result.rows[0]
  }

  static async findByCourse(courseId) {
    const result = await db.query(
      `SELECT * FROM content 
       WHERE course_id = $1 
       ORDER BY order_index ASC, created_at ASC`,
      [courseId]
    )
    return result.rows
  }

  static async update(contentId, contentData) {
    const allowedUpdates = [
      'title', 'description', 'content_url', 
      'order_index', 'is_published'
    ]
    const updates = []
    const values = []
    let paramCount = 1

    for (const [key, value] of Object.entries(contentData)) {
      if (allowedUpdates.includes(key)) {
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (updates.length === 0) return null

    values.push(contentId)
    const result = await db.query(
      `UPDATE content 
       SET ${updates.join(', ')} 
       WHERE content_id = $${paramCount} 
       RETURNING *`,
      values
    )
    return result.rows[0]
  }

  static async delete(contentId) {
    await db.query(
      'DELETE FROM content WHERE content_id = $1',
      [contentId]
    )
  }

  static async reorder(courseId, contentOrders) {
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      
      for (const { content_id, order_index } of contentOrders) {
        await client.query(
          'UPDATE content SET order_index = $1 WHERE content_id = $2 AND course_id = $3',
          [order_index, content_id, courseId]
        )
      }
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

export default Content 