import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Create the context
const AuthContext = createContext();

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // This function calls the Touch ID prompt exposed from Electron
  const unlockApp = async () => {
    setAuthError(''); // Clear previous errors
    
    // Check if the electronAPI from the preload script is available
    if (window.electronAPI?.promptTouchID) {
      try {
        const result = await window.electronAPI.promptTouchID();
        if (result.success) {
          setIsAuthenticated(true);
        } else {
          setAuthError(result.error || 'Authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during Touch ID prompt:', error);
        setAuthError('An unexpected error occurred during authentication.');
      }
    } else {
      // This is a fallback for development in a browser or if the preload script fails
      console.warn('Fingerprint API not available. App will be unlocked for development.');
      setIsAuthenticated(true); // Auto-unlock for browser-based dev
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Attempt to unlock when the component first mounts
  useEffect(() => {
    if (!isAuthenticated) {
      unlockApp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    isAuthenticated,
    authError,
    unlockApp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create a custom hook for easy consumption
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

