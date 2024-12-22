import { AssignmentService } from '../services/assignmentService.js'
import { createResponse } from '../utils/responseHelper.js'

export class AssignmentController {
  constructor() {
    this.assignmentService = new AssignmentService()
  }

  createAssignment = async (req, res) => {
    try {
      const result = await this.assignmentService.create(req.body)
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getAssignments = async (req, res) => {
    try {
      const { course_id } = req.params
      const result = await this.assignmentService.findByCourse(course_id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getAssignment = async (req, res) => {
    try {
      const result = await this.assignmentService.findById(req.params.id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  submitAssignment = async (req, res) => {
    try {
      const result = await this.assignmentService.submit({
        assignment_id: req.params.id,
        user_id: req.user.user_id,
        submission_content: req.body.content
      })
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  gradeSubmission = async (req, res) => {
    try {
      const { grade, feedback } = req.body
      const result = await this.assignmentService.grade(req.params.submission_id, grade, feedback)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }

  getSubmissions = async (req, res) => {
    try {
      const result = await this.assignmentService.getSubmissions(req.params.id)
      res.json(result)
    } catch (error) {
      res.status(400).json(createResponse(false, null, error))
    }
  }
} 