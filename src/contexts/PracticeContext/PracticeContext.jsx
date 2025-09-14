import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const PracticeContext = createContext();

// 2. Create the provider component
export const PracticeProvider = ({ children }) => {
  const [practices, setPractices] = useState([]); // Will hold all practice objects
  const [selectedPractice, setSelectedPractice] = useState(null); // The currently active practice

  // You will add functions here to interact with the database
  // e.g., addPractice, loadPractices, etc.

  const value = {
    practices,
    setPractices,
    selectedPractice,
    setSelectedPractice,
  };

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
};

// 3. Create a custom hook for easy consumption
// The ESLint warning is suppressed here because exporting a custom hook
// alongside its provider is a common and accepted pattern in React.
// eslint-disable-next-line react-refresh/only-export-components
export const usePractices = () => {
  const context = useContext(PracticeContext);
  if (context === undefined) {
    throw new Error('usePractices must be used within a PracticeProvider');
  }
  return context;
};
