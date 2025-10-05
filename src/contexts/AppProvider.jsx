import React from 'react';

// Import all your individual providers
import { AuthProvider } from './AuthContext/AuthContext';
import { PracticeProvider } from './PracticeContext/PracticeContext';
import { EntryProvider } from './EntryContext/EntryContext';
import { TransactionProvider } from './TransactionContext/TransactionContext';
import { ThemeProvider } from './ThemeContext/ThemeContext';
import { PaymentProvider } from './PaymentContext/PaymentContext';
import { NavigationProvider } from './NavigationContext/NavigationContext'; // Import the provider

export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NavigationProvider> 
        <PracticeProvider>
          <EntryProvider>
            <PaymentProvider>
              <TransactionProvider>
                <ThemeProvider> 
                  {children}
                </ThemeProvider>
              </TransactionProvider>
            </PaymentProvider>
          </EntryProvider>
        </PracticeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
};

