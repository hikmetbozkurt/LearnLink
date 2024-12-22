import User from '../models/userModel.js'

export class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId).select('-password')
    if (!user) {
      throw new Error('User not found')
    }
    return user
  }

  async updateProfile(userId, updateData) {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await User.findOne({ email: updateData.email })
      if (emailExists) {
        throw new Error('Email already in use')
      }
    }

    Object.assign(user, updateData)
    await user.save()

    return user.toObject({ versionKey: false, transform: (doc, ret) => {
      delete ret.password
      return ret
    }})
  }
} 