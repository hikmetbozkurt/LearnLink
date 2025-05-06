import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      //console.warn('Authentication failed: No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.name, err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
    
      const userId = decoded.user_id || decoded.id;
      if (!userId) {
        console.error('No user ID found in token:', decoded);
        return res.status(403).json({ message: 'Invalid token format' });
      }
    
      req.user = {
        user_id: userId,
        id: userId,
        email: decoded.email,
        role: decoded.role || 'student'
      };
    
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

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