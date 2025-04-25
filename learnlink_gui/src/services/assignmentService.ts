import axios from 'axios';
import api from '../api/axiosConfig';

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
  points?: number;
  grading_criteria?: string;
}

export interface Submission {
  submission_id: string;
  assignment_id: string;
  user_id: string;
  user_name: string;
  content: string;
  file_url?: string;
  submitted_at: string;
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
      const response = await api.get('/api/assignments');
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
        api.get(`/api/assignments/course/${courseId}`)
      );
      
      // Wait for all promises to resolve
      const responses = await Promise.all(promises);
      
      // Combine the results
      let assignments: Assignment[] = [];
      responses.forEach(response => {
        assignments = [...assignments, ...response.data];
      });
      
      // Log the raw response
      if (process.env.NODE_ENV === "development") {
        console.log("Raw assignments from API:", assignments);
        
        // Check type of data on each assignment
        assignments.forEach(assignment => {
          console.log(`Assignment ${assignment.assignment_id} raw data types:`, {
            submitted: `${assignment.submitted} (${typeof assignment.submitted})`,
            graded: `${assignment.graded} (${typeof assignment.graded})`
          });
        });
      }
      
      // Get user information
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userStr);
      const userId = userData.user_id || userData.id;
      const isAdmin = userData.is_admin || false;
      
      console.log("Current user:", { userId, isAdmin });
      
      // For each assignment, process submission status
      const processedAssignments = await Promise.all(assignments.map(async (assignment) => {
        try {
          // Set default values
          let assignmentWithDefaults: Assignment = {
            ...assignment,
            submitted: false,
            graded: false,
            grade: undefined,
            submission_count: 0
          };
          
          // If user is admin for this assignment's course, fetch all submissions
          if (isAdmin) {
            try {
              const submissions = await assignmentService.getSubmissions(assignment.assignment_id);
              console.log(`Found ${submissions.length} submissions for assignment ${assignment.assignment_id}`);
              
              // Update assignment with submission count
              assignmentWithDefaults = {
                ...assignmentWithDefaults,
                submission_count: submissions.length,
                // Check if any submission belongs to current user
                submitted: submissions.some(s => s.user_id.toString() === userId.toString()),
                // Check if user's submission is graded
                graded: submissions.some(s => s.user_id.toString() === userId.toString() && !!s.grade)
              };
              
              // If user has a submission, find their grade
              const userSubmission = submissions.find(s => s.user_id.toString() === userId.toString());
              if (userSubmission) {
                assignmentWithDefaults.grade = userSubmission.grade;
              }
            } catch (error) {
              console.error(`Error fetching submissions for assignment ${assignment.assignment_id}:`, error);
            }
          } else {
            // For regular users, just check their own submission
            try {
              const submission = await assignmentService.getUserSubmission(assignment.assignment_id);
              if (submission) {
                assignmentWithDefaults = {
                  ...assignmentWithDefaults,
                  submitted: true,
                  graded: !!submission.grade,
                  grade: submission.grade
                };
              }
            } catch (error) {
              console.error(`Error checking submission for assignment ${assignment.assignment_id}:`, error);
            }
          }
          
          // Ensure submitted and graded are boolean values
          assignmentWithDefaults.submitted = Boolean(assignmentWithDefaults.submitted);
          assignmentWithDefaults.graded = Boolean(assignmentWithDefaults.graded);
          
          if (process.env.NODE_ENV === "development") {
            console.log(`Processed assignment ${assignment.assignment_id}:`, {
              submitted: assignmentWithDefaults.submitted,
              graded: assignmentWithDefaults.graded,
              type: `${typeof assignmentWithDefaults.submitted}/${typeof assignmentWithDefaults.graded}`
            });
          }
          
          return assignmentWithDefaults;
        } catch (error) {
          console.error(`Error processing assignment ${assignment.assignment_id}:`, error);
          return {
            ...assignment,
            submitted: false,
            graded: false
          };
        }
      }));
      
      console.log("Enhanced assignments with submission data:", processedAssignments);
      return processedAssignments;
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
      const response = await api.get(`/api/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching assignment ${assignmentId}:`, error);
      throw error;
    }
  },
  
  // Create a new assignment
  createAssignment: async (assignmentData: Partial<Assignment>): Promise<Assignment> => {
    const token = localStorage.getItem('token');
    console.log("createAssignment called with data:", assignmentData);
    console.log("Authentication token present:", !!token);
    
    if (!token) throw new Error('No authentication token found');
    
    try {
      console.log("Making POST request to /api/assignments");
      console.log("API base URL:", api.defaults.baseURL);
      console.log("Full request data:", {
        url: '/api/assignments',
        method: 'POST',
        data: assignmentData,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure the data is properly formatted
      const formattedData = {
        ...assignmentData,
        // Set default points value if not provided
        points: 100
      };
      
      // Convert points to number if it's a string
      if (typeof assignmentData.points === 'string') {
        formattedData.points = parseInt(assignmentData.points);
      } else if (typeof assignmentData.points === 'number') {
        formattedData.points = assignmentData.points;
      }
      
      // Ensure course_id is properly set
      if (assignmentData.course_id) {
        formattedData.course_id = assignmentData.course_id.toString();
      }
      
      const response = await api.post('/api/assignments', formattedData);
      console.log("Assignment creation API response:", response);
      return response.data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      if (axios.isAxiosError(error)) {
        console.log('API error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      throw error;
    }
  },
  
  // Update an existing assignment
  updateAssignment: async (assignmentId: string, assignmentData: Partial<Assignment>): Promise<Assignment> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await api.put(`/api/assignments/${assignmentId}`, assignmentData);
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
      await api.delete(`/api/assignments/${assignmentId}`);
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
      const response = await api.post(`/api/assignments/${assignmentId}/submit`, submissionData, {
        headers: { 
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
      console.log(`Fetching all submissions for assignment ${assignmentId}`);
      const response = await api.get(`/api/assignments/${assignmentId}/submissions`);
      console.log(`Retrieved ${response.data.length} submissions for assignment ${assignmentId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`No submissions found for assignment ${assignmentId}`);
        return [];
      }
      console.error(`Error fetching submissions for assignment ${assignmentId}:`, error);
      throw error;
    }
  },
  
  // Get user's submission for an assignment
  getUserSubmission: async (assignmentId: string): Promise<Submission | null> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      // Get user information from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userStr);
      const userId = userData.user_id || userData.id;
      
      if (!userId) {
        console.error('User ID missing in stored user data:', userData);
        throw new Error('User ID not found in user data');
      }
      
      console.log(`Fetching submission for assignment ${assignmentId} for user ${userId}`);
      
      try {
        const response = await api.get(`/api/assignments/${assignmentId}/submissions/user`);
        console.log(`Submission data for assignment ${assignmentId}:`, response.data);
        return response.data || null;
      } catch (requestError) {
        // If 404, user hasn't submitted yet
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
          console.log(`No submission found for assignment ${assignmentId}`);
          return null;
        }
        // Rethrow other errors
        throw requestError;
      }
    } catch (error) {
      console.error(`Error fetching user's submission for assignment ${assignmentId}:`, error);
      // Return null instead of throwing to prevent breaking the application flow
      return null;
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
      const response = await api.post(
        `/api/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        gradeData
      );
      return response.data;
    } catch (error) {
      console.error(`Error grading submission ${submissionId}:`, error);
      throw error;
    }
  }
}; 