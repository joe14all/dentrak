/**
 * useJBookSync Hook
 *
 * React hook for managing synchronization with JBook.
 * Provides connection status, sync functions, and financial data from JBook.
 */

import { useState, useEffect, useCallback } from "react";
import {
  checkJBookConnection,
  syncAllToJBook,
  getFinancialSummary,
  closeSyncConnection,
} from "../database/jbookClient";
import { getAllPayments } from "../database/payments";
import { getAllPractices } from "../database/practices";
import { getAllExpenses } from "../database/expenses";

export function useJBookSync() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [error, setError] = useState(null);

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
      setError(err.message || "Failed to connect to JBook");
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Sync all data to JBook
  const syncToJBook = useCallback(async () => {
    if (isSyncing) return null;

    setIsSyncing(true);
    setError(null);

    try {
      // First check if connected
      const connected = await checkConnection();
      if (!connected) {
        throw new Error("JBook is not running. Please start JBook first.");
      }

      // Gather all data to sync
      const [payments, practices, expenses] = await Promise.all([
        getAllPayments(),
        getAllPractices(),
        getAllExpenses(),
      ]);

      // JBook only handles contractor practices (not employment-based)
      // Filter for active contractor practices only
      const contractorPractices = practices.filter(
        (p) => p.status === "active" && p.taxStatus === "contractor"
      );

      // Get IDs of contractor practices for filtering related data
      const contractorPracticeIds = new Set(
        contractorPractices.map((p) => p.id)
      );

      // Create a map of practice IDs to names for enriching payments
      const practiceIdToName = new Map(practices.map((p) => [p.id, p.name]));

      // Filter payments to only include those from contractor practices
      // and enrich with practice name for proper mapping in JBook
      const contractorPayments = payments
        .filter((p) => contractorPracticeIds.has(p.practiceId))
        .map((p) => ({
          ...p,
          practiceName:
            practiceIdToName.get(p.practiceId) || `Practice ${p.practiceId}`,
        }));

      // Filter expenses - include practice-linked expenses for contractors
      // and general expenses (no practiceId) which are business expenses
      // Also enrich with practice name
      const contractorExpenses = expenses
        .filter((e) => !e.practiceId || contractorPracticeIds.has(e.practiceId))
        .map((e) => ({
          ...e,
          practiceName: e.practiceId
            ? practiceIdToName.get(e.practiceId)
            : undefined,
        }));

      // Sync everything (contractor data only)
      const result = await syncAllToJBook({
        payments: contractorPayments,
        practices: contractorPractices,
        expenses: contractorExpenses,
      });

      setLastSyncResult({
        ...result,
        timestamp: new Date().toISOString(),
        counts: {
          payments: contractorPayments.length,
          practices: contractorPractices.length,
          expenses: contractorExpenses.length,
        },
        // Also track what was excluded
        excluded: {
          employeePractices: practices.filter((p) => p.taxStatus === "employee")
            .length,
          employeePayments: payments.length - contractorPayments.length,
        },
      });

      return result;
    } catch (err) {
      setError(err.message || "Sync failed");
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkConnection]);

  // Get financial summary from JBook
  const refreshFinancialSummary = useCallback(async () => {
    try {
      const summary = await getFinancialSummary();
      setFinancialSummary(summary);
      return summary;
    } catch (err) {
      console.warn("Could not fetch financial summary:", err.message);
      return null;
    }
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkConnection();

    // Cleanup on unmount
    return () => {
      closeSyncConnection();
    };
  }, [checkConnection]);

  // Poll for connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSyncing) {
        checkConnection();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkConnection, isSyncing]);

  return {
    // Connection state
    isConnected,
    isChecking,

    // Sync state
    isSyncing,
    lastSyncResult,

    // Data from JBook
    financialSummary,

    // Error state
    error,

    // Actions
    checkConnection,
    syncToJBook,
    refreshFinancialSummary,
  };
}

export default useJBookSync;
