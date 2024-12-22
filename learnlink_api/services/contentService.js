import Content from '../models/contentModel.js'

export class ContentService {
  async create(contentData) {
    return await Content.create(contentData)
  }

  async findById(contentId) {
    const content = await Content.findById(contentId)
    if (!content) {
      throw new Error('Content not found')
    }
    return content
  }

  async findByCourse(courseId) {
    return await Content.findByCourse(courseId)
  }

  async update(contentId, contentData) {
    const content = await Content.findById(contentId)
    if (!content) {
      throw new Error('Content not found')
    }
    return await Content.update(contentId, contentData)
  }

  async delete(contentId) {
    const content = await Content.findById(contentId)
    if (!content) {
      throw new Error('Content not found')
    }
    await Content.delete(contentId)
  }
} 