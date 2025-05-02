import pool from '../config/database.js';

// Socket.io instance will be set by server.js
let io = null;

// Set the io instance from outside
export const setIoInstance = (ioInstance) => {
  io = ioInstance;
};

/**
 * Create a notification for a new assignment
 * @param {Object} assignment - The assignment object
 * @param {string} courseName - The name of the course
 * @param {Array} enrolledUserIds - Array of enrolled user IDs to notify (excluding course instructor)
 */
export const createNewAssignmentNotification = async (assignment, courseName, enrolledUserIds) => {
  try {
    if (!enrolledUserIds || enrolledUserIds.length === 0) {
      return;
    }

    const content = `New assignment "${assignment.title}" has been added to ${courseName}. Due date: ${new Date(assignment.due_date).toLocaleDateString()}`;

    // If we have socket.io available, use it to send real-time notifications
    if (io && io.sendAssignmentNotification) {      
      // Send notifications to each user
      for (const userId of enrolledUserIds) {
        await io.sendAssignmentNotification({
          recipient_id: userId,
          content,
          type: 'new_assignment',
          assignment_id: assignment.assignment_id,
          course_id: assignment.course_id
        });
      }
    } else {
      // Fall back to direct database insertion
      const values = enrolledUserIds.map((userId) => {
        return `(${userId}, '${content}', 'new_assignment', ${assignment.assignment_id}, ${assignment.course_id}, NOW())`;
      }).join(', ');

      const query = `
        INSERT INTO notifications 
          (recipient_id, content, type, assignment_id, course_id, created_at)
        VALUES ${values}
      `;

      await pool.query(query);
    }

  } catch (error) {
    console.error('Error creating new assignment notifications:', error);
  }
};

/**
 * Create a notification for an assignment submission
 * @param {Object} submission - The submission object
 * @param {Object} user - The user who submitted
 * @param {Object} assignment - The assignment object
 * @param {Object} course - The course object
 */
export const createAssignmentSubmissionNotification = async (submission, user, assignment, course) => {
  try {
    // Only notify the course instructor
    const instructorId = course.instructor_id;

    const content = `${user.name} has submitted the assignment "${assignment.title}" for ${course.name}`;

    // If we have socket.io available, use it for real-time notification
    if (io && io.sendAssignmentNotification) {
      
      await io.sendAssignmentNotification({
        recipient_id: instructorId,
        content,
        type: 'assignment_submission',
        assignment_id: assignment.assignment_id,
        submission_id: submission.submission_id,
        course_id: course.course_id
      });
    } else {
      
      // Fall back to direct database insertion
      const query = `
        INSERT INTO notifications 
          (recipient_id, content, type, assignment_id, submission_id, course_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      await pool.query(query, [
        instructorId, 
        content, 
        'assignment_submission', 
        assignment.assignment_id,
        submission.submission_id,
        course.course_id
      ]);
    }

  } catch (error) {
    console.error('Error creating assignment submission notification:', error);
  }
};

export default {
  setIoInstance,
  createNewAssignmentNotification,
  createAssignmentSubmissionNotification
}; 