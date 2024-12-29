import api from '../api/axiosConfig';

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return {
        success: true,
        data: {
          token: response.data.token,
          user: response.data.user
        }
      };
    } catch (error) {
      throw error;
    }
  },

  googleLogin: async (credential: string) => {
    try {
      const response = await api.post('/api/auth/google', { credential });
      console.log('Google login service - Raw response:', response.data);
      
      // Ensure we have the expected data structure
      if (!response.data?.success || !response.data?.data?.token || !response.data?.data?.user) {
        console.error('Google login service - Invalid response format:', response.data);
        throw new Error('Invalid response format from Google login');
      }

      // Validate required user fields
      const { user, token } = response.data.data;
      if (!user.email || !(user.user_id || user.id) || !user.name) {
        console.error('Google login service - Missing required user fields:', user);
        throw new Error('Missing required user information');
      }

      return {
        success: true,
        data: {
          token,
          user: {
            user_id: user.user_id || user.id,
            id: user.user_id || user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'student'
          }
        }
      };
    } catch (error) {
      console.error('Google login service error:', error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyResetCode: async (email: string, code: string) => {
    try {
      const response = await api.post('/api/auth/verify-reset-code', { email, code });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    try {
      const response = await api.post('/api/auth/reset-password', {
        email,
        code,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  signup: async (userData: { username: string; email: string; password: string }) => {
    try {
      const response = await api.post('/api/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 