import axios from 'axios';

// Define types
export interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  course_name: string;
  type?: 'assignment' | 'quiz' | 'file';
  submitted?: boolean;
  graded?: boolean;
  grade?: string | number;
  submission_count?: number;
}

export interface Submission {
  submission_id: string;
  assignment_id: string;
  user_id: string;
  user_name: string;
  content: string;
  file_url?: string;
  timestamp: string;
  grade?: string | number;
  feedback?: string;
}

// Create a service with methods for interacting with the assignment API
export const assignmentService = {
  // Get all assignments for the current user
  getAllAssignments: async (): Promise<Assignment[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await axios.get('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      throw error;
    }
  },
  
  // Get assignments for specific courses
  getAssignmentsByCourses: async (courseIds: string[]): Promise<Assignment[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      // If no course IDs are provided, get all assignments
      if (courseIds.length === 0) {
        return await assignmentService.getAllAssignments();
      }
      
      // Create an array of promises for each course
      const promises = courseIds.map(courseId => 
        axios.get(`/api/assignments/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      // Wait for all promises to resolve
      const responses = await Promise.all(promises);
      
      // Combine the results
      let assignments: Assignment[] = [];
      responses.forEach(response => {
        assignments = [...assignments, ...response.data];
      });
      
      return assignments;
    } catch (error) {
      console.error('Error fetching assignments by courses:', error);
      throw error;
    }
  },
  
  // Get a specific assignment by ID
  getAssignment: async (assignmentId: string): Promise<Assignment> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await axios.get(`/api/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching assignment ${assignmentId}:`, error);
      throw error;
    }
  },
  
  // Create a new assignment
  createAssignment: async (assignmentData: Partial<Assignment>): Promise<Assignment> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await axios.post('/api/assignments', assignmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },
  
  // Update an existing assignment
  updateAssignment: async (assignmentId: string, assignmentData: Partial<Assignment>): Promise<Assignment> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await axios.put(`/api/assignments/${assignmentId}`, assignmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating assignment ${assignmentId}:`, error);
      throw error;
    }
  },
  
  // Delete an assignment
  deleteAssignment: async (assignmentId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      await axios.delete(`/api/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(`Error deleting assignment ${assignmentId}:`, error);
      throw error;
    }
  },
  
  // Submit an assignment
  submitAssignment: async (assignmentId: string, submissionData: FormData): Promise<Submission> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await axios.post(`/api/assignments/${assignmentId}/submit`, submissionData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error submitting assignment ${assignmentId}:`, error);
      throw error;
    }
  },
  
  // Get submissions for an assignment (for teachers)
  getSubmissions: async (assignmentId: string): Promise<Submission[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await axios.get(`/api/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching submissions for assignment ${assignmentId}:`, error);
      throw error;
    }
  },
  
  // Get user's submission for an assignment
  getUserSubmission: async (assignmentId: string): Promise<Submission | null> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      
      const response = await axios.get(`/api/assignments/${assignmentId}/submissions/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data || null;
    } catch (error) {
      // If 404, user hasn't submitted yet
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      
      console.error(`Error fetching user's submission for assignment ${assignmentId}:`, error);
      throw error;
    }
  },
  
  // Grade a submission
  gradeSubmission: async (
    assignmentId: string,
    submissionId: string,
    gradeData: { grade: string | number, feedback?: string }
  ): Promise<Submission> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await axios.post(
        `/api/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        gradeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error grading submission ${submissionId}:`, error);
      throw error;
    }
  }
}; 