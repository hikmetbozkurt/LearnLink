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
  graded_at?: string;
}

// Create a service with methods for interacting with the assignment API
export const assignmentService = {
  // Add a cache for submissions to prevent duplicate API calls
  _submissionsCache: new Map<string, Submission[]>(),
  _userSubmissionCache: new Map<string, Submission | null>(),
  
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
      
      // Get user information from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User data not found');
      
      const userData = JSON.parse(userStr);
      const userId = userData.user_id || userData.id;
      const isAdmin = userData.is_admin || false;
      
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
              // Check if we already have this assignment's submissions in cache
              const cacheKey = `assignment_${assignment.assignment_id}`;
              let submissions: Submission[] = [];
              
              if (assignmentService._submissionsCache.has(cacheKey)) {
                submissions = assignmentService._submissionsCache.get(cacheKey) || [];
              } else {
                submissions = await assignmentService.getSubmissions(assignment.assignment_id);
                
                // Cache the submissions
                assignmentService._submissionsCache.set(cacheKey, submissions);
              }
              
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
              // Check if we already have this user's submission in cache
              const cacheKey = `user_${userId}_assignment_${assignment.assignment_id}`;
              let submission: Submission | null = null;
              
              if (assignmentService._userSubmissionCache.has(cacheKey)) {
                submission = assignmentService._userSubmissionCache.get(cacheKey) || null;
              } else {
                const result = await assignmentService.getUserSubmission(assignment.assignment_id);
                submission = result;
                
                // Cache the user submission
                assignmentService._userSubmissionCache.set(cacheKey, submission);
              }
              
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
    if (!token) throw new Error('No authentication token found');
    
    try {
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
      return response.data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
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
      
      // Clear the cache for this specific assignment
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const userId = userData.user_id || userData.id;
        if (userId) {
          // Clear the specific cache entry for this user and assignment
          const cacheKey = `user_${userId}_assignment_${assignmentId}`;
          assignmentService._userSubmissionCache.delete(cacheKey);
        }
      }
      
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
      const response = await api.get(`/api/assignments/${assignmentId}/submissions`);
      
      
      // Handle different response structures
      let submissions: Submission[] = [];
      
      if (Array.isArray(response.data)) {
        submissions = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract submissions from common response patterns
        if (Array.isArray(response.data.data)) {
          submissions = response.data.data;
        } else if (Array.isArray(response.data.submissions)) {
          submissions = response.data.submissions;
        } else if (response.data.rows && Array.isArray(response.data.rows)) {
          submissions = response.data.rows;
        } else if (response.data.success && Array.isArray(response.data.result)) {
          submissions = response.data.result;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          submissions = response.data.data;
        }
      }
      
      // Update the cache with this fresh data
      const cacheKey = `assignment_${assignmentId}`;
      assignmentService._submissionsCache.set(cacheKey, submissions);
      
      return submissions;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
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
      
      try {
        const response = await api.get(`/api/assignments/${assignmentId}/submissions/user`);
        return response.data || null;
      } catch (requestError) {
        // If 404, user hasn't submitted yet
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
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
  },
  
  // Clear the cache when needed (e.g., after creating a new assignment)
  clearSubmissionsCache: () => {
    assignmentService._submissionsCache.clear();
    assignmentService._userSubmissionCache.clear();
  },
  
  // Clear all assignment caches when a course is deleted
  clearAssignmentsCache: () => {
    // Clear any future assignment caches that might be added
    // Currently relies on clearSubmissionsCache to clear the cache
    assignmentService.clearSubmissionsCache();
    
    // Force reload on next assignment page visit
    localStorage.setItem('assignments_cache_invalidated', 'true');
  }
}; 