/* eslint-disable react-refresh/only-export-components */
/**
 * Bank Sync Context
 * 
 * Manages bank connection state, pending transactions, and sync operations
 * for the Dentrak application.
 */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { usePractices } from '../PracticeContext/PracticeContext';
import {
  getAllBankConnections,
  addBankConnection,
  updateBankConnection,
  deleteBankConnection,
  addSyncHistoryEntry,
  getPendingTransactionsForReview,
  bulkAddPendingBankTransactions,
  updatePendingBankTransaction,
  deletePendingBankTransaction,
  approvePendingTransaction,
  rejectPendingTransaction,
  bulkApprovePendingTransactions,
  bulkRejectPendingTransactions,
  getAllExternalIds,
  getBankSyncSettings,
  saveBankSyncSettings,
  clearAllPendingBankTransactions,
} from '../../database/bankSync';
import {
  getDefaultTellerSettings,
  getDefaultBankSyncOptions,
  filterTransactionsByOptions,
  mapTellerToPendingTransaction,
  createSyncHistoryEntry,
  TELLER_APPLICATION_ID,
  TELLER_ENVIRONMENT,
} from '../../services/bankSyncService';

const BankSyncContext = createContext();

export const BankSyncProvider = ({ children }) => {
  const { practices } = usePractices();
  
  // State
  const [connections, setConnections] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [settings, setSettings] = useState(getDefaultTellerSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [error, setError] = useState(null);

  // ==========================================
  // INITIALIZATION
  // ==========================================

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [connectionsData, pendingData, settingsData] = await Promise.all([
        getAllBankConnections(),
        getPendingTransactionsForReview(),
        getBankSyncSettings(),
      ]);
      
      setConnections(connectionsData);
      setPendingTransactions(pendingData);
      if (settingsData) {
        setSettings({ ...getDefaultTellerSettings(), ...settingsData });
      }
    } catch (err) {
      console.error('[BankSyncContext] Failed to load data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // REFRESH FUNCTIONS
  // ==========================================

  const refreshConnections = useCallback(async () => {
    const data = await getAllBankConnections();
    setConnections(data);
  }, []);

  const refreshPendingTransactions = useCallback(async () => {
    const data = await getPendingTransactionsForReview();
    setPendingTransactions(data);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshConnections(),
      refreshPendingTransactions(),
    ]);
  }, [refreshConnections, refreshPendingTransactions]);

  // ==========================================
  // TELLER CONNECT
  // ==========================================

  const openTellerConnect = useCallback((onSuccess, onFailure) => {
    setError(null);

    const initTellerConnect = () => {
      if (window.TellerConnect) {
        const tellerConnect = window.TellerConnect.setup({
          applicationId: TELLER_APPLICATION_ID,
          environment: TELLER_ENVIRONMENT,
          products: ['transactions'],
          onSuccess: async (enrollment) => {
            try {
              // Get accounts from the enrollment
              const accounts = await window.tellerApi?.getAccounts(enrollment.accessToken);
              if (accounts && accounts.length > 0) {
                onSuccess?.({
                  accounts,
                  enrollment,
                  accessToken: enrollment.accessToken,
                });
              } else {
                setError('No accounts found for this institution.');
                onFailure?.({ message: 'No accounts found' });
              }
            } catch (err) {
              setError(err.message || 'Failed to get account details');
              onFailure?.(err);
            }
          },
          onFailure: (error) => {
            setError(error.message || 'Connection failed');
            onFailure?.(error);
          },
          onExit: () => {
            // User closed the modal
          },
        });
        tellerConnect.open();
      } else {
        setError('Teller Connect failed to load. Please try again.');
        onFailure?.({ message: 'Teller Connect not loaded' });
      }
    };

    // Load Teller script if not already loaded
    if (!document.getElementById('teller-connect-script')) {
      const script = document.createElement('script');
      script.id = 'teller-connect-script';
      script.src = 'https://cdn.teller.io/connect/connect.js';
      script.async = true;
      script.onload = initTellerConnect;
      script.onerror = () => {
        setError('Failed to load Teller Connect script');
        onFailure?.({ message: 'Script load failed' });
      };
      document.body.appendChild(script);
    } else {
      initTellerConnect();
    }
  }, []);

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  const connectAccount = useCallback(async (account, enrollment) => {
    // Check if already connected
    const existing = connections.find(c => c.accountId === account.id);
    if (existing) {
      setError(`Account ${account.name} (****${account.last_four}) is already connected.`);
      return null;
    }

    const connection = {
      accessToken: enrollment.accessToken,
      institutionName: enrollment.enrollment?.institution?.name || 'Bank',
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      lastFour: account.last_four,
      autoSyncEnabled: false,
      syncFrequency: 'manual',
      defaultSyncOptions: getDefaultBankSyncOptions(),
      syncHistory: [],
    };

    try {
      const id = await addBankConnection(connection);
      await refreshConnections();
      setSyncStatus(`✅ Connected ${account.name} (****${account.last_four})!`);
      return id;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [connections, refreshConnections]);

  const disconnectAccount = useCallback(async (connectionId) => {
    try {
      await deleteBankConnection(connectionId);
      await refreshConnections();
      setSyncStatus('Account disconnected successfully.');
    } catch (err) {
      setError(err.message);
    }
  }, [refreshConnections]);

  const updateConnectionSettings = useCallback(async (connectionId, updates) => {
    try {
      await updateBankConnection(connectionId, updates);
      await refreshConnections();
    } catch (err) {
      setError(err.message);
    }
  }, [refreshConnections]);

  // ==========================================
  // SYNC OPERATIONS
  // ==========================================

  const syncAccount = useCallback(async (connection, options = null) => {
    if (!connection) return;

    setIsSyncing(true);
    setSyncingAccountId(connection.accountId);
    setSyncStatus('Fetching transactions...');
    setError(null);

    const startTime = Date.now();
    const syncOptions = options || connection.defaultSyncOptions || getDefaultBankSyncOptions();

    try {
      // Get transactions from Teller
      const tellerTransactions = await window.tellerApi?.getTransactions(
        connection.accessToken,
        connection.accountId,
        500
      );

      if (!tellerTransactions || tellerTransactions.length === 0) {
        setSyncStatus('No new transactions found.');
        setIsSyncing(false);
        setSyncingAccountId(null);
        return;
      }

      // Get existing external IDs to avoid duplicates
      const existingExternalIds = await getAllExternalIds();

      // Filter transactions based on options
      const filteredTransactions = filterTransactionsByOptions(
        tellerTransactions,
        syncOptions,
        existingExternalIds
      );

      if (filteredTransactions.length === 0) {
        setSyncStatus('All transactions have already been imported.');
        setIsSyncing(false);
        setSyncingAccountId(null);
        return;
      }

      // Map to pending transactions with practice matching
      const pendingTxs = filteredTransactions.map(tx =>
        mapTellerToPendingTransaction(
          tx,
          connection,
          practices,
          settings.practicePatterns || []
        )
      );

      // Add to pending transactions
      await bulkAddPendingBankTransactions(pendingTxs);
      await refreshPendingTransactions();

      const duration = Date.now() - startTime;
      const counts = {
        income: pendingTxs.filter(t => t.type === 'income').length,
        expense: pendingTxs.filter(t => t.type === 'expense').length,
        pending: pendingTxs.length,
      };

      // Record sync history
      const historyEntry = createSyncHistoryEntry('success', syncOptions, counts, duration);
      await addSyncHistoryEntry(connection.id, historyEntry);
      await refreshConnections();

      setSyncStatus(`✅ Imported ${pendingTxs.length} transactions for review!`);
    } catch (err) {
      console.error('[BankSyncContext] Sync failed:', err);
      setError(err.message || 'Sync failed');
      setSyncStatus(null);

      // Record failure in history
      const duration = Date.now() - startTime;
      const historyEntry = createSyncHistoryEntry('error', syncOptions, {}, duration);
      historyEntry.errorMessage = err.message;
      await addSyncHistoryEntry(connection.id, historyEntry);
      await refreshConnections();
    } finally {
      setIsSyncing(false);
      setSyncingAccountId(null);
    }
  }, [practices, settings.practicePatterns, refreshConnections, refreshPendingTransactions]);

  // ==========================================
  // PENDING TRANSACTION MANAGEMENT
  // ==========================================

  const approveTransaction = useCallback(async (pendingId, approvalData) => {
    try {
      const result = await approvePendingTransaction(pendingId, approvalData);
      await refreshPendingTransactions();
      setSyncStatus(`✅ Transaction approved and saved as ${approvalData.paymentType}.`);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [refreshPendingTransactions]);

  const rejectTransaction = useCallback(async (pendingId, reason = '') => {
    try {
      await rejectPendingTransaction(pendingId, reason);
      await refreshPendingTransactions();
      setSyncStatus('Transaction rejected.');
    } catch (err) {
      setError(err.message);
    }
  }, [refreshPendingTransactions]);

  const bulkApprove = useCallback(async (approvals) => {
    try {
      const results = await bulkApprovePendingTransactions(approvals);
      await refreshPendingTransactions();
      const successful = results.filter(r => r.success).length;
      setSyncStatus(`✅ Approved ${successful} of ${approvals.length} transactions.`);
      return results;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [refreshPendingTransactions]);

  const bulkReject = useCallback(async (pendingIds, reason = '') => {
    try {
      await bulkRejectPendingTransactions(pendingIds, reason);
      await refreshPendingTransactions();
      setSyncStatus(`Rejected ${pendingIds.length} transactions.`);
    } catch (err) {
      setError(err.message);
    }
  }, [refreshPendingTransactions]);

  const updatePendingTransaction = useCallback(async (pendingId, updates) => {
    try {
      await updatePendingBankTransaction(pendingId, updates);
      await refreshPendingTransactions();
    } catch (err) {
      setError(err.message);
    }
  }, [refreshPendingTransactions]);

  const deletePending = useCallback(async (pendingId) => {
    try {
      await deletePendingBankTransaction(pendingId);
      await refreshPendingTransactions();
    } catch (err) {
      setError(err.message);
    }
  }, [refreshPendingTransactions]);

  // ==========================================
  // SETTINGS MANAGEMENT
  // ==========================================

  const updateSettings = useCallback(async (newSettings) => {
    try {
      await saveBankSyncSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const updatePracticePatterns = useCallback(async (patterns) => {
    const newSettings = { ...settings, practicePatterns: patterns };
    await updateSettings(newSettings);
  }, [settings, updateSettings]);

  // ==========================================
  // HELPERS
  // ==========================================

  const clearStatus = useCallback(() => {
    setSyncStatus(null);
    setError(null);
  }, []);

  const getPendingCount = useCallback(() => {
    return pendingTransactions.filter(t => t.status === 'pending').length;
  }, [pendingTransactions]);

  const getAutoMatchedCount = useCallback(() => {
    return pendingTransactions.filter(t => t.status === 'auto-matched').length;
  }, [pendingTransactions]);

  const getNeedReviewCount = useCallback(() => {
    return pendingTransactions.filter(t => t.status === 'pending' || t.status === 'auto-matched').length;
  }, [pendingTransactions]);

  const clearAllPending = useCallback(async () => {
    try {
      await clearAllPendingBankTransactions();
      await refreshPendingTransactions();
      setSyncStatus('All pending transactions cleared.');
    } catch (err) {
      setError(err.message);
    }
  }, [refreshPendingTransactions]);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value = {
    // State
    connections,
    pendingTransactions,
    settings,
    isLoading,
    isSyncing,
    syncingAccountId,
    syncStatus,
    error,

    // Connection operations
    openTellerConnect,
    connectAccount,
    disconnectAccount,
    updateConnectionSettings,

    // Sync operations
    syncAccount,

    // Pending transaction operations
    approveTransaction,
    rejectTransaction,
    bulkApprove,
    bulkReject,
    updatePendingTransaction,
    deletePending,

    // Settings
    updateSettings,
    updatePracticePatterns,

    // Helpers
    refreshAll,
    clearStatus,
    getPendingCount,
    getAutoMatchedCount,
    getNeedReviewCount,
    clearAllPending,
  };

  return (
    <BankSyncContext.Provider value={value}>
      {children}
    </BankSyncContext.Provider>
  );
};

export const useBankSync = () => {
  const context = useContext(BankSyncContext);
  if (context === undefined) {
    throw new Error('useBankSync must be used within a BankSyncProvider');
  }
  return context;
};

export default BankSyncContext;
