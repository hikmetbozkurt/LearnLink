import api from '../api/axiosConfig';

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      // Store initial user data and token
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Fetch complete user data to ensure we have profile pic
      await authService.getCurrentUser();
      
      return {
        success: true,
        data: {
          token,
          user
        }
      };
    } catch (error) {
      throw error;
    }
  },

  googleLogin: async (credential: string) => {
    try {
      const response = await api.post('/api/auth/google', { credential });
      
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
      const response = await api.post('/api/auth/register', {
        name: userData.username,
        email: userData.email,
        password: userData.password,
        role: 'student'
      });
      
      // Ensure we have the expected data structure
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid response format from registration');
      }

      return {
        success: true,
        data: {
          token: response.data.token,
          user: {
            ...response.data.user,
            id: response.data.user.user_id || response.data.user.id
          }
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Fetch current user profile to ensure we have the latest data
  getCurrentUser: async () => {
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id || 
                     JSON.parse(localStorage.getItem('user') || '{}').user_id;
      
      if (!userId) {
        throw new Error('No user ID available');
      }
      
      const response = await api.get(`/api/users/${userId}`);
      const userData = response.data;
      
      // Update the stored user data with the latest info
      const currentUser = {
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        ...userData,
        profile_pic: userData.profile_pic // Ensure profile pic is updated
      };
      
      localStorage.setItem('user', JSON.stringify(currentUser));
      return currentUser;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }
}; 