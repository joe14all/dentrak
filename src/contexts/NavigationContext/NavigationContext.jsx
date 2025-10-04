import React, { createContext, useState, useContext } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [activePage, setActivePage] = useState('Dashboard');

  const value = {
    activePage,
    setActivePage,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
