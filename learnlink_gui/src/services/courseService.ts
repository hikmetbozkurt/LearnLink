import api from '../api/axiosConfig';
import { Course } from '../types/course';
import { Post } from '../types/post';

interface CreateCourseResponse {
  success: boolean;
  course?: Course;
  error?: string;
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
    try {
      // Hem admin olduğum hem de üye olduğum kursları getir
      const response = await api.get('/api/courses/my-courses');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my courses:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch my courses');
    }
  },

  createCourse: async (courseData: {
    title: string;
    description: string;
    category?: string;
    image?: File;
  }): Promise<CreateCourseResponse> => {
    try {
      // Debug için request detaylarını logla
      console.log('Request Data:', {
        title: courseData.title,
        description: courseData.description
      });

      const formData = new FormData();
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      if (courseData.category) {
        formData.append('category', courseData.category);
      }
      if (courseData.image) {
        formData.append('image', courseData.image);
      }

      // Request headers'ı kontrol et
      const response = await api.post('/api/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('Response:', response.data);
      return {
        success: true,
        course: response.data
      };
    } catch (error: any) {
      console.error('Create Course Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
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

  createPost: async (courseId: string, data: {
    content: string;
    type: string;
    file?: File;
  }) => {
    try {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('type', data.type);
      if (data.file) {
        formData.append('file', data.file);
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
  }
}; 