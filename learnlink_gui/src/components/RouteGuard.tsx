import { Navigate } from 'react-router-dom';

const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  try {
    
    // Verify we have both token and valid user object
    if (!token || !userStr) {
      return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);
    
    // Verify user object has required fields
    if (!user.id || !user.email) {
      console.error('RouteGuard - Invalid user data:', user);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('RouteGuard - Error:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

export default RouteGuard; 