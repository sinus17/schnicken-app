import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';

type PrivateRouteProps = {
  children: ReactNode;
};

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If user is not authenticated, show login page
  if (!user) {
    return <Login />;
  }
  
  // User is authenticated, render children
  return <>{children}</>;
};
