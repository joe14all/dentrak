import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const ChequeContext = createContext();

// 2. Create the provider component
export const ChequeProvider = ({ children }) => {
  const [cheques, setCheques] = useState([]);

  // Functions to interact with the database will go here
  const addCheque = (newCheque) => {
    // Logic to add cheque to database and update state
    setCheques(prevCheques => [...prevCheques, { ...newCheque, id: Date.now() }]);
  };

  const updateChequeStatus = (chequeId, newStatus) => {
    // Logic to update a cheque's status in the database
    setCheques(prevCheques =>
      prevCheques.map(cheque =>
        cheque.id === chequeId ? { ...cheque, status: newStatus } : cheque
      )
    );
  };

  const value = {
    cheques,
    addCheque,
    updateChequeStatus,
  };

  return (
    <ChequeContext.Provider value={value}>
      {children}
    </ChequeContext.Provider>
  );
};

// 3. Create a custom hook for easy consumption
// The ESLint warning is suppressed here because exporting a custom hook
// alongside its provider is a common and accepted pattern in React.
// eslint-disable-next-line react-refresh/only-export-components
export const useCheques = () => {
  const context = useContext(ChequeContext);
  if (context === undefined) {
    throw new Error('useCheques must be used within a ChequeProvider');
  }
  return context;
};
