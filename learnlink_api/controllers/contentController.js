import { ContentService } from '../services/contentService.js'
import { createResponse } from '../utils/responseHelper.js'

export class ContentController {
  constructor() {
    this.contentService = new ContentService()
  }

  createContent = async (req, res) => {
    try {
      const contentData = {
        ...req.body,
        content_url: req.file ? req.file.path : req.body.content_url
      }
      const result = await this.contentService.create(contentData)
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getCourseContent = async (req, res) => {
    try {
      const { course_id } = req.params
      const result = await this.contentService.findByCourse(course_id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getContent = async (req, res) => {
    try {
      const result = await this.contentService.findById(req.params.id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  updateContent = async (req, res) => {
    try {
      const contentData = {
        ...req.body,
        content_url: req.file ? req.file.path : req.body.content_url
      }
      const result = await this.contentService.update(req.params.id, contentData)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  deleteContent = async (req, res) => {
    try {
      const result = await this.contentService.delete(req.params.id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }
} 