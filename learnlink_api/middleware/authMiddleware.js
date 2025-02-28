import jwt from 'jsonwebtoken';
import config from '../config/env.js';

// Main authentication middleware
const authenticateTokenMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ message: 'Invalid or expired token' });
      }

      // Handle both id and user_id formats
      const userId = decoded.user_id || decoded.id;
      if (!userId) {
        console.error('No user ID found in token:', decoded);
        return res.status(403).json({ message: 'Invalid token format' });
      }

      // Set user object with consistent ID format
      req.userId = userId; // Set userId directly
      req.user = {
        user_id: userId,
        id: userId,
        email: decoded.email,
        role: decoded.role
      };

      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

// Export both names for compatibility
export const authenticateToken = authenticateTokenMiddleware;
export const authMiddleware = authenticateTokenMiddleware;

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    next();
  };
};