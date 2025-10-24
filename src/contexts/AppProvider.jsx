import React from 'react';

// Import all your individual providers
import { AuthProvider } from './AuthContext/AuthContext';
import { PracticeProvider } from './PracticeContext/PracticeContext';
import { EntryProvider } from './EntryContext/EntryContext';
import { PaymentProvider } from './PaymentContext/PaymentContext';
import { TransactionProvider } from './TransactionContext/TransactionContext';
import { ReportProvider } from './ReportContext/ReportContext';
import { ThemeProvider } from './ThemeContext/ThemeContext';
import { NavigationProvider } from './NavigationContext/NavigationContext';
import { ScheduleBlockProvider } from './ScheduleBlockContext/ScheduleBlockContext'; // 1. Import the new provider


export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NavigationProvider>
        <PracticeProvider>
          <ScheduleBlockProvider>
            <EntryProvider>
              <PaymentProvider>
                <TransactionProvider>
                    <ReportProvider>
                      <ThemeProvider>
                        {children}
                      </ThemeProvider>
                    </ReportProvider>
                </TransactionProvider>
              </PaymentProvider>
            </EntryProvider>
          </ScheduleBlockProvider> 
        </PracticeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
};