import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  getAllPayments,
  addPayment as dbAddPayment,
  updatePayment as dbUpdatePayment,
  deletePayment as dbDeletePayment,
  populatePayments
} from '../../database/payments';

const PaymentContext = createContext();

// This flag ensures the initialization runs only once per application session.
let hasInitialized = false;

export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const allPaymentsFromDB = await getAllPayments();
      setPayments(allPaymentsFromDB);
    } catch (error) {
      console.error(`Failed to fetch all payments:`, error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDB = async () => {
      if (!hasInitialized) {
        hasInitialized = true;
        await populatePayments();
        await refreshPayments();
      } else if (payments.length === 0) { // Refresh if state is empty on re-render
        await refreshPayments();
      }
    };
    initializeDB();
  }, [refreshPayments, payments.length]);

  const addNewPayment = async (data) => { await dbAddPayment(data); await refreshPayments(); };
  const editPayment = async (id, data) => { await dbUpdatePayment(id, data); await refreshPayments(); };
  const removePayment = async (id) => { await dbDeletePayment(id); await refreshPayments(); };

  const value = { payments, isLoading, addNewPayment, editPayment, removePayment, refreshPayments };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};

