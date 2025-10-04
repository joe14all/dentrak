import React from 'react';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import { useNavigation } from '../contexts/NavigationContext/NavigationContext'; // Import the hook

// Import all the page components
import DashboardPage from '../pages/Dashboard/DashboardPage';
import PracticesPage from '../pages/Practices/PracticesPage';
import EntriesPage from '../pages/Entries/EntriesPage';
import PaymentsPage from '../pages/Payments/PaymentsPage';
import ChequeTrackerPage from '../pages/ChequeTracker/ChequeTrackerPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import SettingsPage from '../pages/Settings/SettingsPage';

const pageComponents = {
  'Dashboard': <DashboardPage />,
  'Practices': <PracticesPage />,
  'Entries': <EntriesPage />,
  'Payments': <PaymentsPage />,
  'Cheques': <ChequeTrackerPage />,
  'Reports': <ReportsPage />,
  'Settings': <SettingsPage />,
};

// The AppRouter no longer needs its own provider. It just consumes the context.
const AppRouter = () => {
  const { activePage } = useNavigation();

  return (
    <MainLayout pageTitle={activePage}>
      {pageComponents[activePage] || <DashboardPage />}
    </MainLayout>
  );
};

export default AppRouter;

