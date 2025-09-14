import React from 'react';

// Import all your individual providers
import { AuthProvider } from './AuthContext/AuthContext';
import { PracticeProvider } from './PracticeContext/PracticeContext';
import { EntryProvider } from './EntryContext/EntryContext';
import { ChequeProvider } from './ChequeContext/ChequeContext';
import { ThemeProvider } from './ThemeContext/ThemeContext'; // <-- IMPORT THEME PROVIDER

export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <PracticeProvider>
        <EntryProvider>
          <ChequeProvider>
            <ThemeProvider> 
              {children}
            </ThemeProvider>
          </ChequeProvider>
        </EntryProvider>
      </PracticeProvider>
    </AuthProvider>
  );
};