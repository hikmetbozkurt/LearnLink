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
          reference_id: assignment.assignment_id,
          assignment_id: assignment.assignment_id,
          course_id: assignment.course_id
        });
      }
    } else {
      // Fall back to direct database insertion
      const values = enrolledUserIds.map((userId) => {
        return `(${assignment.instructor_id}, ${userId}, '${content}', 'new_assignment', ${assignment.assignment_id}, ${assignment.assignment_id}, NULL, ${assignment.course_id}, NOW(), NOW())`;
      }).join(', ');

      const query = `
        INSERT INTO notifications 
          (sender_id, recipient_id, content, type, reference_id, assignment_id, submission_id, course_id, created_at, updated_at)
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
        reference_id: submission.submission_id,
        assignment_id: assignment.assignment_id,
        submission_id: submission.submission_id,
        course_id: course.course_id
      });
    } else {
      
      // Fall back to direct database insertion
      const query = `
        INSERT INTO notifications 
          (sender_id, recipient_id, content, type, reference_id, assignment_id, submission_id, course_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        user.user_id,               // sender_id
        instructorId,               // recipient_id
        content,                    // content
        'assignment_submission',    // type
        submission.submission_id,   // reference_id
        assignment.assignment_id,   // assignment_id
        submission.submission_id,   // submission_id
        course.course_id            // course_id
      ]);
      
      console.log('Notification created through utils:', result.rows[0]);
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