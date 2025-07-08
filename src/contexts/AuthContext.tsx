import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';

// Types for our context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<{error: AuthError | null}>;
  error: AuthError | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Initial auth state check
    const initAuth = async () => {
      // First check local storage for cached auth state
      const savedAuthState = localStorage.getItem('schnicken-auth-state');
      if (savedAuthState) {
        try {
          const authData = JSON.parse(savedAuthState);
          if (authData.session && authData.user) {
            // Verify if token is still valid before using cached session
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            if (currentSession) {
              console.log('Using valid cached auth session');
              setSession(currentSession);
              setUser(currentSession.user);
              setLoading(false);
              return;
            } else {
              console.log('Cached session invalid, clearing');
              localStorage.removeItem('schnicken-auth-state');
            }
          }
        } catch (error) {
          console.error('Error parsing cached auth state:', error);
          localStorage.removeItem('schnicken-auth-state');
        }
      }

      // Fallback to Supabase session check
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
        
        localStorage.setItem('schnicken-auth-state', JSON.stringify({
          session,
          user: session.user,
          playerId: localStorage.getItem('currentPlayerId')
        }));
      }
      
      setLoading(false);
    };

    initAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Update localStorage with new auth state
      if (session && session.user) {
        const currentPlayerId = localStorage.getItem('currentPlayerId');
        localStorage.setItem('schnicken-auth-state', JSON.stringify({
          session,
          user: session.user,
          playerId: currentPlayerId // Include current player ID if available
        }));
      } else if (event === 'SIGNED_OUT') {
        // Clear local client session as well
        await supabase.auth.signOut();
        localStorage.removeItem('schnicken-auth-state'); // Clear saved auth state
        localStorage.removeItem('currentPlayerId'); // Clear player ID
      }
    });

    // Clean up auth listener
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('Signing in with direct Supabase client');
      setError(null);
      
      // Use the Supabase client directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Error signing in:', error);
        setError(error);
        return { error };
      }
      
      if (data.session && data.user) {
        console.log('Sign in successful');
        // Session is already managed by the onAuthStateChange listener
        // but we update the state here for immediate feedback
        setSession(data.session);
        setUser(data.user);
      }
      
      return { error: null };
    } catch (unexpectedError) {
      console.error('Unexpected error during signin:', unexpectedError);
      const authError = { message: 'Unexpected error during signin' } as AuthError;
      setError(authError);
      return { error: authError };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentPlayerId');
  };
  
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        setUser,
        signInWithEmail,
        error,
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

export default AuthContext;
