import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { usePayments } from '../PaymentContext/PaymentContext';

// Import all necessary database functions
import { getAllCheques, addCheque, updateCheque, deleteCheque, populateCheques } from '../../database/cheques';
import { getAllDirectDeposits, addDirectDeposit, updateDirectDeposit, deleteDirectDeposit, populateDirectDeposits } from '../../database/directDeposits';
import { getAllETransfers, addETransfer, updateETransfer, deleteETransfer, populateETransfers } from '../../database/eTransfers';
import { db } from '../../database/db'; // Import db instance for direct payment deletion

const TransactionContext = createContext();

// This flag ensures the initialization runs only once per application session.
let hasInitialized = false;

export const TransactionProvider = ({ children }) => {
  const [cheques, setCheques] = useState([]);
  const [directDeposits, setDirectDeposits] = useState([]);
  const [eTransfers, setETransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get Payments context functions
  const { refreshPayments, addNewPayment, removePayment } = usePayments();

  const refreshTransactions = useCallback(async () => {
    console.log("[TransactionContext] Refreshing transactions..."); // Log refresh start
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
      console.log("[TransactionContext] Transactions refreshed successfully."); // Log refresh end
    } catch (error) {
      console.error("[TransactionContext] Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDB = async () => {
      console.log("[TransactionContext] Checking DB initialization..."); // Log init check
      if (!hasInitialized) {
        hasInitialized = true;
        console.log("[TransactionContext] Initializing DB and populating data..."); // Log init start
        await Promise.all([populateCheques(), populateDirectDeposits(), populateETransfers()]);
        await refreshTransactions();
        console.log("[TransactionContext] DB initialized."); // Log init end
      } else if (cheques.length === 0 && directDeposits.length === 0 && eTransfers.length === 0 && !isLoading) {
        console.log("[TransactionContext] State is empty, refreshing transactions..."); // Log refresh trigger
        await refreshTransactions();
      } else {
         console.log("[TransactionContext] DB already initialized or loading."); // Log skip init
      }
    };
    initializeDB();
  }, [refreshTransactions, cheques.length, directDeposits.length, eTransfers.length, isLoading]); // Added isLoading dependency

  // Function to refresh both transactions and payments state
  const autoRefreshAll = useCallback(async () => {
    console.log("[TransactionContext] autoRefreshAll triggered."); // Log auto refresh
    await refreshTransactions();
    await refreshPayments();
  }, [refreshTransactions, refreshPayments]); // Added dependencies

  // --- Add Functions ---
  const addNewCheque = async (data) => {
    console.log("[TransactionContext] Adding new cheque:", data); // Log add cheque
    const newId = await addCheque(data);
    await addNewPayment({
      practiceId: data.practiceId, paymentDate: data.dateReceived,
      amount: data.amount, paymentMethod: 'cheque', referenceNumber: data.chequeNumber,
      linkedChequeId: newId, notes: data.notes,
    });
    await autoRefreshAll();
  };

  const addNewDirectDeposit = async (data) => {
     console.log("[TransactionContext] Adding new direct deposit:", data); // Log add deposit
    await addDirectDeposit(data);
    await addNewPayment({
      practiceId: data.practiceId, paymentDate: data.paymentDate,
      amount: data.amount, paymentMethod: 'directDeposit', referenceNumber: data.transactionId,
      notes: `Direct Deposit. Source: ${data.sourceBank || 'N/A'}`, // Added fallback
    });
    await autoRefreshAll();
  };

  const addNewETransfer = async (data) => {
    console.log("[TransactionContext] Adding new e-transfer:", data); // Log add e-transfer
    await addETransfer(data);
    await addNewPayment({
      practiceId: data.practiceId, paymentDate: data.paymentDate,
      amount: data.amount, paymentMethod: 'e-transfer', referenceNumber: data.confirmationNumber,
      notes: `E-Transfer from ${data.senderEmail || 'N/A'}`, // Added fallback
    });
    await autoRefreshAll();
  };

  // --- Edit Functions ---
  const editCheque = async (id, data) => {
    console.log(`[TransactionContext] Editing cheque ID ${id}:`, data); // Log edit cheque
    await updateCheque(id, data);
    // Potentially update the linked payment record if relevant details changed (e.g., amount, date, reference)
    const linkedPayment = await db.payments.where({ linkedChequeId: id }).first();
    if (linkedPayment) {
       console.log(`[TransactionContext] Found linked payment ID ${linkedPayment.id} for cheque ${id}. Updating...`);
       await db.payments.update(linkedPayment.id, {
          practiceId: data.practiceId,
          paymentDate: data.dateReceived,
          amount: data.amount,
          referenceNumber: data.chequeNumber,
          notes: data.notes
       });
    }
    await autoRefreshAll(); // Refresh both after update
  };

  const editDirectDeposit = async (id, data) => {
    console.log(`[TransactionContext] Editing direct deposit ID ${id}:`, data); // Log edit deposit
    await updateDirectDeposit(id, data);
    // Find and update the corresponding payment record (assuming referenceNumber matches transactionId)
     const linkedPayment = await db.payments.where({ practiceId: data.practiceId, paymentDate: data.paymentDate, amount: data.amount, paymentMethod: 'directDeposit', referenceNumber: data.transactionId }).first();
     if(linkedPayment) {
        console.log(`[TransactionContext] Found linked payment ID ${linkedPayment.id} for deposit ${id}. Updating...`);
         await db.payments.update(linkedPayment.id, {
            practiceId: data.practiceId,
            paymentDate: data.paymentDate,
            amount: data.amount,
            referenceNumber: data.transactionId,
            notes: `Direct Deposit. Source: ${data.sourceBank || 'N/A'}`
         });
     } else {
        console.warn(`[TransactionContext] Could not find matching payment to update for deposit ID ${id}`);
     }
    await autoRefreshAll();
  };

  const editETransfer = async (id, data) => {
    console.log(`[TransactionContext] Editing e-transfer ID ${id}:`, data); // Log edit e-transfer
    await updateETransfer(id, data);
    // Find and update the corresponding payment record (assuming referenceNumber matches confirmationNumber)
    const linkedPayment = await db.payments.where({ practiceId: data.practiceId, paymentDate: data.paymentDate, amount: data.amount, paymentMethod: 'e-transfer', referenceNumber: data.confirmationNumber }).first();
     if(linkedPayment) {
        console.log(`[TransactionContext] Found linked payment ID ${linkedPayment.id} for e-transfer ${id}. Updating...`);
         await db.payments.update(linkedPayment.id, {
            practiceId: data.practiceId,
            paymentDate: data.paymentDate,
            amount: data.amount,
            referenceNumber: data.confirmationNumber,
            notes: `E-Transfer from ${data.senderEmail || 'N/A'}`
         });
     } else {
        console.warn(`[TransactionContext] Could not find matching payment to update for e-transfer ID ${id}`);
     }
    await autoRefreshAll();
  };

  // --- Remove Functions ---
  // ** FIX: Modified remove functions to also delete linked payments **
  const removeCheque = async (id) => {
    console.log(`[TransactionContext] Removing cheque ID ${id}...`); // Log remove cheque
    // Find the linked payment first
    const linkedPayment = await db.payments.where({ linkedChequeId: id }).first();
    await deleteCheque(id); // Delete the cheque record
    if (linkedPayment) {
      console.log(`[TransactionContext] Removing linked payment ID ${linkedPayment.id} for cheque ${id}...`);
      await removePayment(linkedPayment.id); // Use the removePayment function from PaymentContext
    } else {
       console.warn(`[TransactionContext] No linked payment found for cheque ID ${id} during deletion.`);
    }
    await autoRefreshAll(); // Refresh both contexts
  };

  const removeDirectDeposit = async (id) => {
    console.log(`[TransactionContext] Removing direct deposit ID ${id}...`); // Log remove deposit
    // Find the corresponding payment to delete it. Need to query based on details.
    const depositToDelete = await db.directDeposits.get(id); // Get details before deleting
    if (depositToDelete) {
       const linkedPayment = await db.payments.where({
           practiceId: depositToDelete.practiceId,
           paymentDate: depositToDelete.paymentDate,
           amount: depositToDelete.amount,
           paymentMethod: 'directDeposit',
           referenceNumber: depositToDelete.transactionId
       }).first();

       await deleteDirectDeposit(id); // Delete the deposit record

       if (linkedPayment) {
           console.log(`[TransactionContext] Removing linked payment ID ${linkedPayment.id} for deposit ${id}...`);
           await removePayment(linkedPayment.id); // Use removePayment from context
       } else {
           console.warn(`[TransactionContext] Could not find matching payment to delete for deposit ID ${id}`);
       }
    } else {
         console.warn(`[TransactionContext] Direct deposit ID ${id} not found for deletion.`);
         await deleteDirectDeposit(id); // Still attempt delete in case it exists but wasn't fetched
    }
    await autoRefreshAll();
  };

  const removeETransfer = async (id) => {
    console.log(`[TransactionContext] Removing e-transfer ID ${id}...`); // Log remove e-transfer
    // Find the corresponding payment to delete it.
     const transferToDelete = await db.eTransfers.get(id); // Get details before deleting
     if(transferToDelete) {
        const linkedPayment = await db.payments.where({
            practiceId: transferToDelete.practiceId,
            paymentDate: transferToDelete.paymentDate,
            amount: transferToDelete.amount,
            paymentMethod: 'e-transfer',
            referenceNumber: transferToDelete.confirmationNumber
        }).first();

        await deleteETransfer(id); // Delete the e-transfer record

        if (linkedPayment) {
            console.log(`[TransactionContext] Removing linked payment ID ${linkedPayment.id} for e-transfer ${id}...`);
            await removePayment(linkedPayment.id); // Use removePayment from context
        } else {
            console.warn(`[TransactionContext] Could not find matching payment to delete for e-transfer ID ${id}`);
        }
     } else {
        console.warn(`[TransactionContext] E-transfer ID ${id} not found for deletion.`);
        await deleteETransfer(id); // Attempt delete anyway
     }
    await autoRefreshAll();
  };

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