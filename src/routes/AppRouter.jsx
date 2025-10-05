import React from 'react';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import { useNavigation } from '../contexts/NavigationContext/NavigationContext';

// Import all the page components
import DashboardPage from '../pages/Dashboard/DashboardPage';
import PracticesPage from '../pages/Practices/PracticesPage';
import EntriesPage from '../pages/Entries/EntriesPage';
import PaymentsPage from '../pages/Payments/PaymentsPage';
import TransactionsPage from '../pages/Transactions/TransactionsPage'; // Import new page
import ReportsPage from '../pages/Reports/ReportsPage';
import SettingsPage from '../pages/Settings/SettingsPage';

const pageComponents = {
  'Dashboard': <DashboardPage />,
  'Practices': <PracticesPage />,
  'Entries': <EntriesPage />,
  'Payments': <PaymentsPage />,
  'Transactions': <TransactionsPage />, // Updated from 'Cheques'
  'Reports': <ReportsPage />,
  'Settings': <SettingsPage />,
};

const AppRouter = () => {
  const { activePage } = useNavigation();

  return (
    <MainLayout pageTitle={activePage}>
      {pageComponents[activePage] || <DashboardPage />}
    </MainLayout>
  );
};

export default AppRouter;

