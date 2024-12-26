import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      })
    }

    // Get token from Bearer token
    const token = authHeader.split(' ')[1]

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'learnlink')

      // Get user from database
      const result = await pool.query(
        'SELECT user_id, email, name, role FROM users WHERE user_id = $1',
        [decoded.id]
      )

      if (!result.rows.length) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        })
      }

      // Add user to request object
      req.user = result.rows[0]
      next()

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Optional: Role-based middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      })
    }
    next()
  }
} 