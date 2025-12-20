import React from 'react';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import { useNavigation } from '../contexts/NavigationContext/NavigationContext';

// Import all the page components
import DashboardPage from '../pages/Dashboard/DashboardPage';
import PracticesPage from '../pages/Practices/PracticesPage';
import EntriesPage from '../pages/Entries/EntriesPage';
import PaymentsPage from '../pages/Payments/PaymentsPage'; // Keep for testing
import TransactionsPage from '../pages/Transactions/TransactionsPage'; // Keep for testing
import FinancialsPage from '../pages/Financials/FinancialsPage'; // Import the new page
import ExpensesPage from '../pages/Expenses/ExpensesPage';
import PracticeComparisonPage from '../pages/PracticeComparison/PracticeComparisonPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import SettingsPage from '../pages/Settings/SettingsPage';

const pageComponents = {
  'Dashboard': <DashboardPage />,
  'Practices': <PracticesPage />,
  'Entries': <EntriesPage />,
  'Payments': <PaymentsPage />, // Keep for testing
  'Transactions': <TransactionsPage />, // Keep for testing
  'Financials': <FinancialsPage />, // Add the new unified page
  'Expenses': <ExpensesPage />,
  'Practice Comparison': <PracticeComparisonPage />,
  'Reports': <ReportsPage />,
  'Settings': <SettingsPage />,
};

const AppRouter = () => {
  const { activePage } = useNavigation();

  return (
    <MainLayout pageTitle={activePage}>
      {/* Render the component based on activePage, default to Dashboard */}
      {pageComponents[activePage] || <DashboardPage />}
    </MainLayout>
  );
};

export default AppRouter;