import Course from '../models/courseModel.js'
import { createResponse } from '../utils/responseHelper.js'

export class CourseService {
  async createCourse(courseData) {
    const course = await Course.create(courseData)
    return createResponse(true, {
      course: {
        id: course.course_id,
        name: course.course_name,
        description: course.description,
        teacher_id: course.teacher_id,
        created_at: course.created_at,
        updated_at: course.updated_at
      }
    })
  }

  async getAllCourses() {
    const courses = await Course.findAll()
    return createResponse(true, { courses })
  }

  async getCourseById(courseId) {
    const course = await Course.findById(courseId)
    if (!course) {
      throw new Error('Course not found')
    }
    return createResponse(true, { course })
  }

  async updateCourse(courseId, courseData) {
    const course = await Course.findById(courseId)
    if (!course) {
      throw new Error('Course not found')
    }
    const updatedCourse = await Course.update(courseId, courseData)
    return createResponse(true, { course: updatedCourse })
  }

  async deleteCourse(courseId) {
    const course = await Course.findById(courseId)
    if (!course) {
      throw new Error('Course not found')
    }
    await Course.delete(courseId)
    return createResponse(true, { message: 'Course deleted successfully' })
  }

  async enrollStudent(courseId, userId) {
    const enrollment = await Course.enrollStudent(courseId, userId)
    return createResponse(true, { enrollment })
  }

  async getEnrolledStudents(courseId) {
    const students = await Course.getEnrolledStudents(courseId)
    return createResponse(true, { students })
  }
} 