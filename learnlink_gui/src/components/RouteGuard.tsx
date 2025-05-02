import { Navigate } from 'react-router-dom';

const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  try {
    console.log('RouteGuard - Current Path:', window.location.pathname);
    console.log('RouteGuard - Auth State:', { 
      hasToken: !!token, 
      hasUser: !!userStr,
      token: token,
      userStr: userStr
    });

    // Verify we have both token and valid user object
    if (!token || !userStr) {
      console.log('RouteGuard - Missing auth data:', { token, userStr });
      return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);
    console.log('RouteGuard - Parsed user:', user);
    
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