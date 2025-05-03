// Assignment notification endpoints
function createAssignmentNotification(courseId, assignmentId, title) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  
  try {
    // Try the new endpoint (singular)
    return api.post('/api/notifications/assignment', {
      course_id: courseId,
      assignment_id: assignmentId,
      title: title
    });
  } catch (error) {
    console.error('Error creating assignment notification with new endpoint:', error);
    
    // Fallback to the old endpoint (plural)
    try {
      return api.post('/api/notifications/assignments', {
        course_id: courseId,
        assignment_id: assignmentId,
        title: title
      });
    } catch (fallbackError) {
      console.error('Error creating assignment notification with fallback endpoint:', fallbackError);
      throw fallbackError;
    }
  }
}

// Submission notification
function createSubmissionNotification(assignmentId, submissionId) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  
  try {
    // Try the new endpoint (singular)
    return api.post('/api/notifications/assignment-submission', {
      assignment_id: assignmentId,
      submission_id: submissionId
    });
  } catch (error) {
    console.error('Error creating submission notification with new endpoint:', error);
    
    // Fallback to the old endpoint (plural)
    try {
      return api.post('/api/notifications/assignments-submission', {
        assignment_id: assignmentId,
        submission_id: submissionId
      });
    } catch (fallbackError) {
      console.error('Error creating submission notification with fallback endpoint:', fallbackError);
      throw fallbackError;
    }
  }
} 