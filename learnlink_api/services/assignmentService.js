import Assignment from '../models/assignmentModel.js'
import { createResponse } from '../utils/responseHelper.js'

export class AssignmentService {
  async create(assignmentData) {
    const assignment = await Assignment.create(assignmentData)
    return createResponse(true, {
      assignment: {
        id: assignment.assignment_id,
        course_id: assignment.course_id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at
      }
    })
  }

  async findById(assignmentId) {
    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      throw new Error('Assignment not found')
    }
    return createResponse(true, { assignment })
  }

  async findByCourse(courseId) {
    const assignments = await Assignment.findByCourse(courseId)
    return createResponse(true, { assignments })
  }

  async submit(submissionData) {
    const submission = await Assignment.submit(submissionData)
    return createResponse(true, {
      submission: {
        id: submission.submission_id,
        assignment_id: submission.assignment_id,
        user_id: submission.user_id,
        content: submission.submission_content,
        timestamp: submission.timestamp,
        grade: submission.grade,
        feedback: submission.feedback,
        created_at: submission.created_at,
        updated_at: submission.updated_at
      }
    })
  }

  async grade(submissionId, grade, feedback) {
    const submission = await Assignment.grade(submissionId, grade, feedback)
    return createResponse(true, { submission })
  }

  async getSubmissions(assignmentId) {
    const submissions = await Assignment.getSubmissions(assignmentId)
    return createResponse(true, { submissions })
  }
} 