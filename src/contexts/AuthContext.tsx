import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, SUPABASE_AUTH_URL } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for hash parameters from OAuth redirect
    const handleAuthCallback = async () => {
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('Auth redirect detected, processing tokens...');
        
        try {
          // Extract the hash parameters without the # character
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            // Clean up the URL by removing the hash parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Set the session with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error('Error setting session from redirect:', error);
            } else {
              console.log('Session set successfully from redirect');
              setSession(data.session);
              setUser(data.session?.user ?? null);
            }
          }
        } catch (error) {
          console.error('Error handling auth callback:', error);
        }
      }
    };
    
    // Get initial session
    const getSession = async () => {
      setLoading(true);
      
      try {
        // Handle redirect first if present
        await handleAuthCallback();
        
        // Then get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        console.log('Auth state changed:', _event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google using direct URL to Supabase Auth
  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth flow via direct URL...');
      
      // Redirect directly to Supabase Auth URL for Google login
      // This bypasses any localhost:3000 issues
      const redirectUrl = encodeURIComponent(window.location.origin);
      const authUrl = `${SUPABASE_AUTH_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectUrl}`;
      
      console.log('Redirecting to:', authUrl);
      window.location.href = authUrl;
      
      // No need to wait as we're redirecting the browser
      return;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error signing in with Google. Please try again.');
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signInWithGoogle,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
