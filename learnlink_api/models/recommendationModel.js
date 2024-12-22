import db from '../config/database.js'

class Recommendation {
  static async create(data) {
    const { user_id, content_type, recommended_content, interaction_score } = data
    const result = await db.query(
      `INSERT INTO ai_recommendations 
       (user_id, content_type, recommended_content, interaction_score, timestamp) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`,
      [user_id, content_type, recommended_content, interaction_score]
    )
    return result.rows[0]
  }

  static async findByUser(userId) {
    const result = await db.query(
      'SELECT * FROM ai_recommendations WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    )
    return result.rows
  }

  static async updateInteractionScore(recommendationId, score) {
    const result = await db.query(
      'UPDATE ai_recommendations SET interaction_score = $1 WHERE recommendation_id = $2 RETURNING *',
      [score, recommendationId]
    )
    return result.rows[0]
  }
}

export default Recommendation 