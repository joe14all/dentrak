import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { usePayments } from '../PaymentContext/PaymentContext'; 

// Import all necessary database functions
import { getAllCheques, addCheque, updateCheque, deleteCheque, populateCheques } from '../../database/cheques';
import { getAllDirectDeposits, addDirectDeposit, updateDirectDeposit, deleteDirectDeposit, populateDirectDeposits } from '../../database/directDeposits';
import { getAllETransfers, addETransfer, updateETransfer, deleteETransfer, populateETransfers } from '../../database/eTransfers';

const TransactionContext = createContext();

// This flag ensures the initialization runs only once per application session.
let hasInitialized = false;

export const TransactionProvider = ({ children }) => {
  const [cheques, setCheques] = useState([]);
  const [directDeposits, setDirectDeposits] = useState([]);
  const [eTransfers, setETransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { refreshPayments, addNewPayment } = usePayments();

  const refreshTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [chequesData, depositsData, transfersData] = await Promise.all([
        getAllCheques(),
        getAllDirectDeposits(),
        getAllETransfers(),
      ]);
      setCheques(chequesData);
      setDirectDeposits(depositsData);
      setETransfers(transfersData);
    } catch (error) {
      console.error(`Failed to fetch transactions:`, error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDB = async () => {
      // Check the module-level flag to prevent re-running.
      if (!hasInitialized) {
        hasInitialized = true; // Set the flag immediately
        // Populate all transaction tables.
        await Promise.all([populateCheques(), populateDirectDeposits(), populateETransfers()]);
        await refreshTransactions();
      } else if (cheques.length === 0 && directDeposits.length === 0 && eTransfers.length === 0) {
        // On subsequent renders, refresh only if state is empty
        await refreshTransactions();
      }
    };
    initializeDB();
  }, [refreshTransactions, cheques.length, directDeposits.length, eTransfers.length]);

  const autoRefreshAll = async () => {
    await refreshTransactions();
    await refreshPayments();
  };
  
  const addNewCheque = async (data) => {
    const newId = await addCheque(data);
    await addNewPayment({
      practiceId: data.practiceId, paymentDate: data.dateReceived,
      amount: data.amount, paymentMethod: 'cheque', referenceNumber: data.chequeNumber,
      linkedChequeId: newId, notes: data.notes,
    });
    await autoRefreshAll();
  };
  
  const addNewDirectDeposit = async (data) => {
    await addDirectDeposit(data);
    await addNewPayment({
      practiceId: data.practiceId, paymentDate: data.paymentDate,
      amount: data.amount, paymentMethod: 'directDeposit', referenceNumber: data.transactionId,
      notes: `Direct Deposit. Source: ${data.sourceBank}`,
    });
    await autoRefreshAll();
  };
  
  const addNewETransfer = async (data) => {
    await addETransfer(data);
    await addNewPayment({
      practiceId: data.practiceId, paymentDate: data.paymentDate,
      amount: data.amount, paymentMethod: 'e-transfer', referenceNumber: data.confirmationNumber,
      notes: `E-Transfer from ${data.senderEmail}`,
    });
    await autoRefreshAll();
  };

  const editCheque = async (id, data) => { await updateCheque(id, data); await refreshTransactions(); };
  const removeCheque = async (id) => { await deleteCheque(id); await refreshTransactions(); };
  const editDirectDeposit = async (id, data) => { await updateDirectDeposit(id, data); await refreshTransactions(); };
  const removeDirectDeposit = async (id) => { await deleteDirectDeposit(id); await refreshTransactions(); };
  const editETransfer = async (id, data) => { await updateETransfer(id, data); await refreshTransactions(); };
  const removeETransfer = async (id) => { await deleteETransfer(id); await refreshTransactions(); };

  const value = {
    cheques, directDeposits, eTransfers, isLoading,
    addNewCheque, editCheque, removeCheque,
    addNewDirectDeposit, editDirectDeposit, removeDirectDeposit,
    addNewETransfer, editETransfer, removeETransfer,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

