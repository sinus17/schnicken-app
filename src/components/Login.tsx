import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const { signInWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Bitte E-Mail und Passwort eingeben');
      return;
    }
    
    setIsLoggingIn(true);
    setErrorMessage('');
    
    try {
      const { error } = await signInWithEmail(email, password);
      
      if (error) {
        setErrorMessage(error.message || 'Anmeldung fehlgeschlagen');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };
  


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-schnicken-darkest">
      <div className="flex flex-col items-center p-8 bg-schnicken-dark rounded-lg shadow-md w-full max-w-md border border-schnicken-medium">
        <img 
          src="/schnicken.png" 
          alt="Schnicken Logo" 
          className="w-48 h-auto mb-6"
        />
        <h1 className="text-2xl font-bold text-center mb-6 text-schnicken-light">Wie viel Bock hast Du, ...?</h1>
        
        {errorMessage && (
          <div className="w-full p-3 mb-4 bg-red-900/30 border border-red-500 rounded text-red-200 text-sm">
            {errorMessage}
          </div>
        )}
        
        <div className="w-full space-y-4">
          
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoggingIn}
            className="w-full p-3 border border-schnicken-medium bg-schnicken-darkest text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-schnicken-light"
          />
          
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoggingIn}
            className="w-full p-3 border border-schnicken-medium bg-schnicken-darkest text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-schnicken-light"
          />
          
          <button
            onClick={handleLogin}
            disabled={loading || isLoggingIn}
            className="w-full p-3 bg-schnicken-medium border border-schnicken-light text-white rounded-lg hover:bg-schnicken-light hover:text-schnicken-darkest transition-colors focus:outline-none focus:ring-2 focus:ring-schnicken-light"
          >
            {isLoggingIn ? 'Anmeldung...' : 'Anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
};
