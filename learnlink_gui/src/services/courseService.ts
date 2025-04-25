import api from '../api/axiosConfig';
import { Course } from '../types/course';
import { Post } from '../types/post';

// Cache for admin courses to prevent frequent API calls
let adminCoursesCache: any[] = [];
let adminCoursesCacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute in milliseconds

interface CreateCourseResponse {
  success: boolean;
  course?: Course;
  error?: string;
}

interface CreatePostData {
  content: string;
  type: string;
  file?: File;
  videoUrl?: string;
}

export const courseService = {
  getAllCourses: async (): Promise<Course[]> => {
    try {
      const response = await api.get('/api/courses');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch courses');
    }
  },

  getMyCourses: async (): Promise<Course[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await api.get('/api/courses/my-courses');
      console.log("getMyCourses response:", response.data);
      
      // Debug which courses have is_admin set
      if (Array.isArray(response.data)) {
        const adminCourses = response.data.filter(course => course.is_admin);
        console.log("Admin courses:", adminCourses);
        console.log("Non-admin courses:", response.data.filter(course => !course.is_admin));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user courses:', error);
      throw error;
    }
  },

  getAdminCourses: async (): Promise<Course[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    const now = Date.now();
    // Return cached data if it's still fresh
    if (adminCoursesCache.length > 0 && now - adminCoursesCacheTimestamp < CACHE_DURATION) {
      console.log("Using cached admin courses", adminCoursesCache);
      return adminCoursesCache;
    }
    
    try {
      console.log("Fetching courses where user is admin");
      const response = await api.get('/api/courses/my-courses');
      
      // Filter courses where user is admin
      const adminCourses = response.data.filter((course: Course) => course.is_admin);
      console.log("Admin courses found:", adminCourses);
      
      // Update the cache
      adminCoursesCache = adminCourses;
      adminCoursesCacheTimestamp = now;
      
      return adminCourses;
    } catch (error) {
      console.error('Error fetching admin courses:', error);
      throw error;
    }
  },

  createCourse: async (courseData: {
    title: string;
    description: string;
    category?: string;
  }): Promise<CreateCourseResponse> => {
    try {
      // Debug için request detaylarını logla
      console.log('Creating course with data:', courseData);

      const formData = new FormData();
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      if (courseData.category) {
        formData.append('category', courseData.category);
      }

      // Request headers'ı kontrol et
      const response = await api.post('/api/courses', formData, {
        headers: {
          'Content-Type': 'application/json' // FormData yerine JSON gönderelim
        }
      });

      return {
        success: true,
        course: response.data
      };
    } catch (error: any) {
      console.error('Error in createCourse:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create course'
      };
    }
  },

  joinCourse: async (courseId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Joining course:', courseId); // Debug için
      const response = await api.post(`/api/courses/${courseId}/join`);
      console.log('Join response:', response.data); // Debug için
      return { success: true };
    } catch (error: any) {
      console.error('Join course error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to join course'
      };
    }
  },

  getCourse: async (courseId: string): Promise<Course> => {
    try {
      const response = await api.get(`/api/courses/${courseId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch course');
    }
  },

  getCoursePosts: async (courseId: string) => {
    try {
      const response = await api.get(`/api/courses/${courseId}/posts`);
      return response.data; // { success, data: Post[], message }
    } catch (error) {
      console.error('Error fetching posts:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch posts'
      };
    }
  },

  addComment: async (postId: string, content: string): Promise<void> => {
    try {
      await api.post(`/api/posts/${postId}/comments`, { content });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  },

  createPost: async (courseId: string, data: CreatePostData | FormData) => {
    try {
      let formData: FormData;

      if (data instanceof FormData) {
        formData = data;
      } else {
        formData = new FormData();
        formData.append('content', data.content);
        formData.append('type', data.type);
        if (data.file) {
          formData.append('file', data.file);
        }
        if (data.videoUrl) {
          formData.append('videoUrl', data.videoUrl);
        }
      }

      const response = await api.post(`/api/courses/${courseId}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  deletePost: async (postId: string): Promise<void> => {
    try {
      await api.delete(`/api/posts/${postId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  deleteComment: async (commentId: string): Promise<void> => {
    try {
      await api.delete(`/api/comments/${commentId}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  leaveCourse: async (courseId: string): Promise<void> => {
    const response = await api.delete(`/api/courses/${courseId}/leave`);
    if (response.status !== 200) {
      throw new Error(response.data.message || 'Failed to leave course');
    }
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    const response = await api.delete(`/api/courses/${courseId}`);
    if (response.status !== 200) {
      throw new Error(response.data.message || 'Failed to delete course');
    }
  },
}; 