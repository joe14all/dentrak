import React, { createContext, useState, useContext } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [activePage, setActivePage] = useState('Dashboard');
  const [navigationState, setNavigationState] = useState(null);

  const navigateToPage = (page, state = null) => {
    setActivePage(page);
    setNavigationState(state);
  };

  const clearNavigationState = () => {
    setNavigationState(null);
  };

  const value = {
    activePage,
    setActivePage,
    navigationState,
    navigateToPage,
    clearNavigationState,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
