import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { authService } from '../services/authService';

interface User {
  id: number;
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  profile_pic?: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Get fresh user data from the server
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        console.error('Error refreshing user data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCurrentUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      const userData = response.data;
      userData.id = userData.user_id || userData.id;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to fetch user data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the authService which now also fetches profile data
      const response = await authService.login(email, password);
      
      // Get the user from authService response
      const userData = response.data.user;
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/auth/register', userData);
      
      const { token, user: newUser } = response.data;
      
      // Store clean token
      localStorage.setItem('token', token.replace(/['"]+/g, ''));
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    setUser
  };
} 