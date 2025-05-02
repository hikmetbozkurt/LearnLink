import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

/**
 * AuthRedirect component to handle authentication redirection logic
 * If user is logged in, redirects to /home, otherwise shows LoginPage
 */
const AuthRedirect: React.FC = () => {
  // Check if user is authenticated
  const isAuthenticated = () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) return false;
      
      const user = JSON.parse(userStr);
      return !!(user && (user.id || user.user_id) && user.email);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  };
  // If authenticated redirect to home, otherwise show login page
  return isAuthenticated() ? <Navigate to="/home" replace /> : <LoginPage />;
};

export default AuthRedirect; 