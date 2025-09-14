import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout/MainLayout';

// Import all the page components
import DashboardPage from '../pages/Dashboard/DashboardPage';
import PracticesPage from '../pages/Practices/PracticesPage';
import DailyEntryPage from '../pages/DailyEntry/DailyEntryPage';
import ChequeTrackerPage from '../pages/ChequeTracker/ChequeTrackerPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import SettingsPage from '../pages/Settings/SettingsPage';

const pageComponents = {
  'Dashboard': <DashboardPage />,
  'Practices': <PracticesPage />,
  'Daily Entry': <DailyEntryPage />,
  'Cheques': <ChequeTrackerPage />,
  'Reports': <ReportsPage />,
  'Settings': <SettingsPage />,
};

const AppRouter = () => {
  const [activePage, setActivePage] = useState('Dashboard');

  return (
    <MainLayout 
      pageTitle={activePage} 
      activePage={activePage} 
      setActivePage={setActivePage}
    >
      {pageComponents[activePage] || <DashboardPage />}
    </MainLayout>
  );
};

export default AppRouter;

