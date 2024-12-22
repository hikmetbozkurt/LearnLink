import { CourseService } from '../services/courseService.js'
import { createResponse } from '../utils/responseHelper.js'

export class CourseController {
  constructor() {
    this.courseService = new CourseService()
  }

  createCourse = async (req, res) => {
    try {
      const courseData = {
        ...req.body,
        teacher_id: req.user.user_id
      }
      const result = await this.courseService.createCourse(courseData)
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getAllCourses = async (req, res) => {
    try {
      const result = await this.courseService.getAllCourses()
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getCourseById = async (req, res) => {
    try {
      const result = await this.courseService.getCourseById(req.params.id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  updateCourse = async (req, res) => {
    try {
      const result = await this.courseService.updateCourse(req.params.id, req.body)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  deleteCourse = async (req, res) => {
    try {
      const result = await this.courseService.deleteCourse(req.params.id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  enrollStudent = async (req, res) => {
    try {
      const result = await this.courseService.enrollStudent(req.params.id, req.user.user_id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getEnrolledStudents = async (req, res) => {
    try {
      const result = await this.courseService.getEnrolledStudents(req.params.id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }
} 