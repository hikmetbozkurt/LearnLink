import { Navigate } from 'react-router-dom';

const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard; 