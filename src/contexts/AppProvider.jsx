import React from 'react';

// Import all your individual providers
import { AuthProvider } from './AuthContext/AuthContext';
import { PracticeProvider } from './PracticeContext/PracticeContext';
import { EntryProvider } from './EntryContext/EntryContext';
import { ChequeProvider } from './ChequeContext/ChequeContext';
import { ThemeProvider } from './ThemeContext/ThemeContext';
import { PaymentProvider } from './PaymentContext/PaymentContext';
import { NavigationProvider } from './NavigationContext/NavigationContext'; // Import the provider

export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NavigationProvider> {/* 1. Wrap all other providers */}
        <PracticeProvider>
          <EntryProvider>
            <PaymentProvider>
              <ChequeProvider>
                <ThemeProvider> 
                  {children}
                </ThemeProvider>
              </ChequeProvider>
            </PaymentProvider>
          </EntryProvider>
        </PracticeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
};

