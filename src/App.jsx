import React from 'react';
import { useTheme } from './contexts/ThemeContext/ThemeContext';
import { useAuth } from './contexts/AuthContext/AuthContext';
import AppRouter from './routes/AppRouter';
import UnlockScreen from './features/auth/UnlockScreen';
import './App.css';

const AppLayout = () => {
  // Use `effectiveTheme` to get the currently active theme ('light' or 'dark')
  const { effectiveTheme } = useTheme(); 
  const { isAuthenticated } = useAuth();

  // Apply the effectiveTheme as a class to the main container
  return (
    <div className={`app-container ${effectiveTheme}`}>
      {isAuthenticated ? <AppRouter /> : <UnlockScreen />}
    </div>
  );
};

// The main App component now just renders the layout.
function App() {
  return <AppLayout />;
}

export default App;

