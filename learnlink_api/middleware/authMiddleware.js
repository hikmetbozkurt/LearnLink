import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

export const authMiddleware = async (req, res, next) => {
  try {
    console.log('1. Auth middleware - Headers:', req.headers);
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('2. No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('3. Token extracted:', token);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'learnlink');
      console.log('4. Decoded token:', decoded);

      const result = await pool.query(
        'SELECT user_id, email, name, role FROM users WHERE user_id = $1',
        [decoded.id]
      );
      console.log('5. User query result:', result.rows);

      if (!result.rows.length) {
        console.log('6. No user found');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = result.rows[0];
      console.log('7. User attached to request:', req.user);
      next();

    } catch (error) {
      console.error('8. Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('9. Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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