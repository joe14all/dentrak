import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const EntryContext = createContext();

// 2. Create the provider component
export const EntryProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);

  // Functions to interact with the database for daily entries
  const addEntry = (newEntry) => {
    // Logic to add a daily entry to the database and update state
    setEntries(prevEntries => [...prevEntries, { ...newEntry, id: Date.now() }]);
  };

  const getEntriesByDateRange = (startDate, endDate) => {
    // Logic to filter entries from state or query the database
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  const value = {
    entries,
    addEntry,
    getEntriesByDateRange,
  };

  return (
    <EntryContext.Provider value={value}>
      {children}
    </EntryContext.Provider>
  );
};

// 3. Create a custom hook for easy consumption
// The ESLint warning is suppressed here because exporting a custom hook
// alongside its provider is a common and accepted pattern in React.
// eslint-disable-next-line react-refresh/only-export-components
export const useEntries = () => {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntries must be used within an EntryProvider');
  }
  return context;
};

