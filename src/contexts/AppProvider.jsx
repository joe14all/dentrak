import React from 'react';

// Import all your individual providers
import { AuthProvider } from './AuthContext/AuthContext';
import { PracticeProvider } from './PracticeContext/PracticeContext';
import { EntryProvider } from './EntryContext/EntryContext';
import { PaymentProvider } from './PaymentContext/PaymentContext';
import { TransactionProvider } from './TransactionContext/TransactionContext';
import { ReportProvider } from './ReportContext/ReportContext'; // 1. Import the new provider
import { ThemeProvider } from './ThemeContext/ThemeContext';
import { NavigationProvider } from './NavigationContext/NavigationContext';
import { DashboardProvider } from './DashboardContext/DashboardContext';


export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NavigationProvider> 
        <PracticeProvider>
          <EntryProvider>
            <PaymentProvider>
              <TransactionProvider>
                <DashboardProvider>
                  <ReportProvider>
                    <ThemeProvider> 
                      {children}
                    </ThemeProvider>
                  </ReportProvider>
                </DashboardProvider>
              </TransactionProvider>
            </PaymentProvider>
          </EntryProvider>
        </PracticeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
};

