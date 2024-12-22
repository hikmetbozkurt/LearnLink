import { UserService } from '../services/userService.js'

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
} 