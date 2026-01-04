/* eslint-disable react-refresh/only-export-components */
/**
 * JBookSyncContext
 * 
 * Provides JBook synchronization state and auto-sync functionality
 * at the app level. This ensures auto-sync runs on app startup,
 * not just when the sync panel is opened.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  checkJBookConnection,
  syncAllToJBook,
  getFinancialSummary,
  closeSyncConnection,
  syncPeriodSummariesToJBook,
  getJBookInvoiceSyncSettings,
  notifyInvoiceSyncComplete,
} from '../../database/jbookClient';
import { getAllPayments } from '../../database/payments';
import { getAllPractices } from '../../database/practices';
import { getAllExpenses } from '../../database/expenses';
import { getAllEntries } from '../../database/entries';
import { calculatePay, calculateSinglePeriod } from '../../utils/calculations';

const JBookSyncContext = createContext(null);

export function JBookSyncProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingInvoices, setIsSyncingInvoices] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [lastInvoiceSyncResult, setLastInvoiceSyncResult] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [error, setError] = useState(null);
  
  // Selected years for invoice sync - default to current and previous year
  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState([currentYear - 1, currentYear]);
  
  // Track if we've done the auto-sync this session
  const hasAutoSyncedInvoices = useRef(false);
  const hasInitialized = useRef(false);

  // Check connection to JBook
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    try {
      const result = await checkJBookConnection();
      setIsConnected(result.connected);
      if (!result.connected) {
        setError(result.error);
      }
      return result.connected;
    } catch (err) {
      setIsConnected(false);
      setError(err.message || 'Failed to connect to JBook');
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Refresh financial summary from JBook
  const refreshFinancialSummary = useCallback(async () => {
    try {
      const summary = await getFinancialSummary();
      setFinancialSummary(summary);
      return summary;
    } catch (err) {
      console.warn('Could not fetch financial summary:', err.message);
      return null;
    }
  }, []);

  /**
   * Calculate all completed pay periods for a practice up to today
   */
  const getCompletedPeriodsForPractice = useCallback((practice, entries, year) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const completedPeriods = [];
    
    for (let month = 0; month < 12; month++) {
      const entriesForMonth = entries.filter(e => {
        if (e.practiceId !== practice.id) return false;
        const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
        if (!dateStr) return false;
        const entryDate = new Date(`${dateStr}T00:00:00Z`);
        return entryDate.getUTCFullYear() === year && entryDate.getUTCMonth() === month;
      });

      const monthCalcResult = calculatePay(practice, entriesForMonth, year, month);
      
      for (const period of monthCalcResult.payPeriods) {
        if (period.end <= today && period.hasEntries) {
          const entriesInPeriod = entriesForMonth.filter(e => {
            const dateStr = e.entryType === 'periodSummary' ? e.periodStartDate : e.date;
            if (!dateStr) return false;
            const entryDate = new Date(`${dateStr}T00:00:00Z`);
            
            if (e.entryType === 'periodSummary') {
              const entryEndDate = new Date(`${e.periodEndDate}T00:00:00Z`);
              return entryDate <= period.end && entryEndDate >= period.start;
            }
            return entryDate >= period.start && entryDate <= period.end;
          });

          const periodCalc = calculateSinglePeriod(practice, entriesInPeriod);
          
          completedPeriods.push({
            practice,
            period: { start: period.start, end: period.end },
            ...periodCalc,
          });
        }
      }
    }
    
    return completedPeriods;
  }, []);

  /**
   * Sync all data to JBook (payments, practices, expenses)
   */
  const syncToJBook = useCallback(async () => {
    if (isSyncing) return null;

    setIsSyncing(true);
    setError(null);

    try {
      const connected = await checkConnection();
      if (!connected) {
        throw new Error('JBook is not running. Please start JBook first.');
      }

      const [payments, practices, expenses] = await Promise.all([
        getAllPayments(),
        getAllPractices(),
        getAllExpenses(),
      ]);

      const contractorPractices = practices.filter(
        (p) => p.status === 'active' && p.taxStatus === 'contractor'
      );

      const contractorPayments = payments.filter((payment) =>
        contractorPractices.some((p) => p.id === payment.practiceId)
      );

      const practicesForSync = contractorPractices.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        phone: p.phone,
        email: p.email,
        taxId: p.taxId,
        status: p.status,
        taxStatus: p.taxStatus,
        paymentTerms: p.paymentTerms,
      }));

      const paymentsForSync = contractorPayments.map((payment) => {
        const practice = contractorPractices.find((p) => p.id === payment.practiceId);
        return {
          ...payment,
          practiceName: practice?.name || `Practice ${payment.practiceId}`,
        };
      });

      const expensesForSync = expenses.map((expense) => ({
        id: expense.id,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        description: expense.description,
        vendor: expense.vendor,
        notes: expense.notes,
      }));

      const result = await syncAllToJBook({
        payments: paymentsForSync,
        practices: practicesForSync,
        expenses: expensesForSync,
      });

      const syncResult = {
        ...result,
        timestamp: new Date().toISOString(),
        excluded: {
          employeePractices: practices.length - contractorPractices.length,
          employeePayments: payments.length - contractorPayments.length,
        },
      };

      setLastSyncResult(syncResult);

      if (result.success) {
        await refreshFinancialSummary();
      }

      return result;
    } catch (err) {
      setError(err.message || 'Sync failed');
      setLastSyncResult({
        success: false,
        errors: [err.message],
        timestamp: new Date().toISOString(),
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkConnection, refreshFinancialSummary]);

  /**
   * Sync all completed period invoices to JBook
   * @param {number[]} yearsToSync - Optional array of years to sync. If not provided, uses selectedYears state.
   */
  const syncAllInvoices = useCallback(async (yearsToSync = null) => {
    if (isSyncingInvoices) return null;

    setIsSyncingInvoices(true);
    setError(null);

    try {
      const connected = await checkConnection();
      if (!connected) {
        throw new Error('JBook is not running. Please start JBook first.');
      }

      const [practices, entries] = await Promise.all([
        getAllPractices(),
        getAllEntries(),
      ]);

      const contractorPractices = practices.filter(
        (p) => p.status === 'active' && p.taxStatus === 'contractor'
      );

      if (contractorPractices.length === 0) {
        const emptyResult = {
          success: true,
          message: 'No contractor practices found',
          created: 0,
          skipped: 0,
          errors: [],
          timestamp: new Date().toISOString(),
        };
        setLastInvoiceSyncResult(emptyResult);
        return emptyResult;
      }

      // Use provided years or fall back to selectedYears state
      const years = yearsToSync || selectedYears;
      if (years.length === 0) {
        const noYearsResult = {
          success: false,
          message: 'No years selected for sync',
          created: 0,
          skipped: 0,
          errors: ['Please select at least one year to sync'],
          timestamp: new Date().toISOString(),
        };
        setLastInvoiceSyncResult(noYearsResult);
        return noYearsResult;
      }
      
      const allPeriodSummaries = [];

      for (const practice of contractorPractices) {
        // Collect periods from all selected years
        const allPeriods = [];
        for (const year of years.sort((a, b) => a - b)) {
          const periodsForYear = getCompletedPeriodsForPractice(practice, entries, year);
          allPeriods.push(...periodsForYear);
        }
        
        for (const data of allPeriods) {
          if (data.calculatedPay > 0) {
            allPeriodSummaries.push({
              practiceId: data.practice.id,
              practiceName: data.practice.name,
              periodStart: data.period.start.toISOString().split('T')[0],
              periodEnd: data.period.end.toISOString().split('T')[0],
              // Financial totals
              grossProduction: data.productionTotal || 0,
              grossCollection: data.collectionTotal || 0,
              totalAdjustments: data.totalAdjustments || 0,
              netBase: data.netBase || 0,
              // Pay calculation
              basePayOwed: data.basePayOwed || 0,
              productionPayComponent: data.productionPayComponent || 0,
              calculatedPay: data.calculatedPay || 0,
              // Work details
              daysWorked: data.attendanceDays || 0,
              attendedDates: data.attendedDates || [],
              attendanceByDate: data.attendanceByDate || {}, // { 'YYYY-MM-DD': 1 or 0.5 }
              // Practice pay structure
              paymentType: data.practice.paymentType || 'percentage',
              percentage: data.practice.percentage || 0,
              basePay: data.practice.basePay || data.practice.dailyGuarantee || 0,
              payCycle: data.practice.payCycle || 'monthly',
              calculationBase: data.practice.calculationBase || 'production',
            });
          }
        }
      }

      if (allPeriodSummaries.length === 0) {
        const noDataResult = {
          success: true,
          message: 'No completed periods with data found',
          created: 0,
          skipped: 0,
          errors: [],
          timestamp: new Date().toISOString(),
        };
        setLastInvoiceSyncResult(noDataResult);
        return noDataResult;
      }

      console.log(`[JBook Sync] Syncing ${allPeriodSummaries.length} period summaries as invoices`);
      const result = await syncPeriodSummariesToJBook(allPeriodSummaries);

      const syncResult = {
        success: !result.errors?.length,
        message: result.errors?.length
          ? `Synced with ${result.errors.length} errors`
          : `Created ${result.created} invoice(s), skipped ${result.skipped} existing`,
        created: result.created || 0,
        skipped: result.skipped || 0,
        errors: result.errors || [],
        totalPeriods: allPeriodSummaries.length,
        practiceCount: contractorPractices.length,
        timestamp: new Date().toISOString(),
      };

      setLastInvoiceSyncResult(syncResult);
      
      // Notify JBook that sync is complete
      try {
        await notifyInvoiceSyncComplete({
          created: result.created || 0,
          skipped: result.skipped || 0,
          errors: result.errors || [],
        });
      } catch (notifyErr) {
        console.warn('Could not notify JBook of sync completion:', notifyErr);
      }
      
      return syncResult;
    } catch (err) {
      const errorResult = {
        success: false,
        message: err.message || 'Invoice sync failed',
        created: 0,
        skipped: 0,
        errors: [err.message],
        timestamp: new Date().toISOString(),
      };
      setLastInvoiceSyncResult(errorResult);
      setError(err.message || 'Invoice sync failed');
      return errorResult;
    } finally {
      setIsSyncingInvoices(false);
    }
  }, [isSyncingInvoices, checkConnection, getCompletedPeriodsForPractice, selectedYears]);

  /**
   * Check JBook settings and auto-sync invoices if enabled
   */
  const checkAndAutoSyncInvoices = useCallback(async () => {
    if (hasAutoSyncedInvoices.current) {
      console.log('[JBook Sync] Already auto-synced this session');
      return;
    }
    
    try {
      console.log('[JBook Sync] Checking auto-sync settings...');
      const settings = await getJBookInvoiceSyncSettings();
      console.log('[JBook Sync] Settings:', settings);
      
      if (settings.autoSyncInvoices) {
        console.log('[JBook Sync] Auto-sync invoices enabled, starting sync...');
        hasAutoSyncedInvoices.current = true;
        const result = await syncAllInvoices();
        console.log('[JBook Sync] Auto-sync complete:', result);
      } else {
        console.log('[JBook Sync] Auto-sync invoices disabled in JBook settings');
      }
    } catch (err) {
      console.warn('[JBook Sync] Could not check auto-sync settings:', err.message);
    }
  }, [syncAllInvoices]);

  // Initialize on mount - check connection and auto-sync if enabled
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initConnection = async () => {
      console.log('[JBook Sync] Initializing connection...');
      const connected = await checkConnection();
      console.log('[JBook Sync] Connected:', connected);
      
      if (connected) {
        // Fetch initial financial summary
        await refreshFinancialSummary();
        // Check if JBook wants us to auto-sync invoices
        await checkAndAutoSyncInvoices();
      }
    };
    
    initConnection();

    return () => {
      closeSyncConnection();
    };
  }, [checkConnection, refreshFinancialSummary, checkAndAutoSyncInvoices]);

  // Poll for connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSyncing && !isSyncingInvoices) {
        checkConnection();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkConnection, isSyncing, isSyncingInvoices]);

  /**
   * Get available years from entries data
   */
  const getAvailableYears = useCallback(async () => {
    try {
      const entries = await getAllEntries();
      const years = new Set();
      
      for (const entry of entries) {
        const dateStr = entry.entryType === 'periodSummary' ? entry.periodStartDate : entry.date;
        if (dateStr) {
          const year = new Date(`${dateStr}T00:00:00Z`).getUTCFullYear();
          if (year > 2000 && year <= currentYear + 1) { // Sanity check
            years.add(year);
          }
        }
      }
      
      // If no entries, at least return current and previous year
      if (years.size === 0) {
        years.add(currentYear);
        years.add(currentYear - 1);
      }
      
      return Array.from(years).sort((a, b) => b - a); // Descending order (newest first)
    } catch (err) {
      console.error('Failed to get available years:', err);
      return [currentYear, currentYear - 1];
    }
  }, [currentYear]);

  const value = {
    // Connection state
    isConnected,
    isChecking,

    // Sync state
    isSyncing,
    lastSyncResult,

    // Invoice sync state
    isSyncingInvoices,
    lastInvoiceSyncResult,

    // Year selection for invoice sync
    selectedYears,
    setSelectedYears,
    getAvailableYears,

    // Data from JBook
    financialSummary,

    // Error state
    error,

    // Actions
    checkConnection,
    syncToJBook,
    syncAllInvoices,
    refreshFinancialSummary,
  };

  return (
    <JBookSyncContext.Provider value={value}>
      {children}
    </JBookSyncContext.Provider>
  );
}

export function useJBookSync() {
  const context = useContext(JBookSyncContext);
  if (!context) {
    throw new Error('useJBookSync must be used within a JBookSyncProvider');
  }
  return context;
}

export default JBookSyncContext;
