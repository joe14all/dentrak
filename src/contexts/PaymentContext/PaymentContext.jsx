import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  getAllPayments,
  addPayment as dbAddPayment,
  updatePayment as dbUpdatePayment,
  deletePayment as dbDeletePayment,
  populatePayments
} from '../../database/payments';

// 1. Create the context
const PaymentContext = createContext();

// 2. Create the provider component
export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh the payments state from the database
  const refreshPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const allPaymentsFromDB = await getAllPayments();
      setPayments(allPaymentsFromDB);
    } catch (error) {
      console.error(`Failed to fetch all payments:`, error);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to initialize the database on first load
  useEffect(() => {
    const initializeDB = async () => {
      await populatePayments();
      await refreshPayments(); // Perform the initial data load
    };
    initializeDB();
  }, [refreshPayments]);

  // --- CRUD Functions ---

  const addNewPayment = async (paymentData) => {
    try {
      await dbAddPayment(paymentData);
      await refreshPayments(); // Refresh state after any change
    } catch (error) {
      console.error("Failed to add new payment:", error);
    }
  };

  const editPayment = async (id, updatedData) => {
    try {
      await dbUpdatePayment(id, updatedData);
      await refreshPayments();
    } catch (error) {
      console.error(`Failed to edit payment ${id}:`, error);
    }
  };

  const removePayment = async (id) => {
    try {
      await dbDeletePayment(id);
      await refreshPayments();
    } catch (error) {
      console.error(`Failed to remove payment ${id}:`, error);
    }
  };

  const value = {
    payments,
    isLoading,
    refreshPayments,
    addNewPayment,
    editPayment,
    removePayment,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// 3. Create a custom hook for easy consumption
// eslint-disable-next-line react-refresh/only-export-components
export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};
