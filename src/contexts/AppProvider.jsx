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
import { ScheduleBlockProvider } from './ScheduleBlockContext/ScheduleBlockContext';
import { GoalProvider } from './GoalContext/GoalContext';
import { EntryTemplateProvider } from './EntryTemplateContext/EntryTemplateContext';
import { ExpenseProvider } from './ExpenseContext/ExpenseContext';
import { JBookSyncProvider } from './JBookSyncContext/JBookSyncContext';
import { BankSyncProvider } from './BankSyncContext';


export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NavigationProvider>
        <PracticeProvider>
         <GoalProvider>
          <ScheduleBlockProvider>
            <EntryTemplateProvider>
              <ExpenseProvider>
                <EntryProvider>
                  <PaymentProvider>
                    <TransactionProvider>
                      <BankSyncProvider>
                        <ReportProvider>
                          <ThemeProvider>
                            <JBookSyncProvider>
                              {children}
                            </JBookSyncProvider>
                          </ThemeProvider>
                        </ReportProvider>
                      </BankSyncProvider>
                    </TransactionProvider>
                  </PaymentProvider>
                </EntryProvider>
              </ExpenseProvider>
            </EntryTemplateProvider>
          </ScheduleBlockProvider>
         </GoalProvider>
        </PracticeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
};