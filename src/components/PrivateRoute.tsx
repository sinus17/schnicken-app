import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';
import type { User } from '@supabase/supabase-js';

type PrivateRouteProps = {
  children: ReactNode;
};

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading, setUser } = useAuth();
  const [isCheckingLocalStorage, setIsCheckingLocalStorage] = useState(true);
  
  // Check localStorage for custom auth token on component mount
  useEffect(() => {
    const checkLocalStorageAuth = () => {
      try {
        const localStorageSession = localStorage.getItem('supabase.auth.token');
        
        if (localStorageSession && !user) {
          try {
            const parsedSession = JSON.parse(localStorageSession);
            console.log('PrivateRoute found localStorage session');
            
            if (parsedSession.user) {
              console.log('PrivateRoute using localStorage user:', parsedSession.user.email);
              // Update auth context with the localStorage user
              setUser(parsedSession.user as User);
            }
          } catch (e) {
            console.error('Error parsing localStorage auth token:', e);
            localStorage.removeItem('supabase.auth.token');
          }
        }
      } finally {
        setIsCheckingLocalStorage(false);
      }
    };
    
    checkLocalStorageAuth();
  }, [user, setUser]);
  
  // When authenticated, automatic player association happens in player context
  useEffect(() => {
    // If user is authenticated and we're done checking localStorage
    if (user && !loading && !isCheckingLocalStorage) {
      console.log('Authenticated user detected in PrivateRoute');
      
      // For authenticated users, player context handles finding the player by email
      // We don't need to redirect to menu anymore as the player will be found by email
      // automatically in the PlayerContext
    }
  }, [user, loading, isCheckingLocalStorage]);
  
  // Show loading spinner while checking auth status
  if (loading || isCheckingLocalStorage) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-schnicken-darkest">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-schnicken-light"></div>
      </div>
    );
  }
  
  // Get user from either context or localStorage
  const authenticatedUser = user;
  
  // If no user is found in either place, show login page
  if (!authenticatedUser) {
    return <Login />;
  }
  
  // User is authenticated, render children
  return <>{children}</>;
};
