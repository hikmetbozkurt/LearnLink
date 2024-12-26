import { UserService } from '../services/userService.js'
import pool from '../config/database.js'

export class UserController {
  constructor() {
    this.userService = new UserService()
  }

  getProfile = async (req, res) => {
    try {
      const user = await this.userService.getProfile(req.user.id)
      res.json(user)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  updateProfile = async (req, res) => {
    try {
      const updatedUser = await this.userService.updateProfile(req.user.id, req.body)
      res.json(updatedUser)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  async getStudents(req, res) {
    try {
      console.log('GetStudents endpoint hit');
      console.log('Authenticated user:', req.user);

      // Get all students except the current user
      const result = await pool.query(
        'SELECT user_id, name, email, role FROM users WHERE role = $1 AND user_id != $2',
        ['student', req.user.user_id]
      );

      console.log('Database query result:', result.rows);

      // Just return the students without unread_messages for now
      const students = result.rows.map(user => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }));

      console.log('Sending students:', students);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Error in getStudents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: error.message
      });
    }
  }
} 