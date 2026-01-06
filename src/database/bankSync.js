/**
 * Bank Sync Database Operations
 *
 * Handles CRUD operations for bank connections, pending transactions,
 * and sync settings.
 */
import { db } from "./db";

// ==========================================
// BANK CONNECTIONS
// ==========================================

/**
 * Get all bank connections
 */
export const getAllBankConnections = async () => {
  return await db.bankConnections.toArray();
};

/**
 * Get bank connection by ID
 */
export const getBankConnectionById = async (id) => {
  return await db.bankConnections.get(id);
};

/**
 * Get bank connection by account ID
 */
export const getBankConnectionByAccountId = async (accountId) => {
  return await db.bankConnections.where({ accountId }).first();
};

/**
 * Add a new bank connection
 */
export const addBankConnection = async (connection) => {
  return await db.bankConnections.add({
    ...connection,
    connectedAt: connection.connectedAt || new Date().toISOString(),
    syncHistory: connection.syncHistory || [],
  });
};

/**
 * Update a bank connection
 */
export const updateBankConnection = async (id, updates) => {
  return await db.bankConnections.update(id, updates);
};

/**
 * Delete a bank connection
 */
export const deleteBankConnection = async (id) => {
  return await db.bankConnections.delete(id);
};

/**
 * Add sync history entry to a connection
 */
export const addSyncHistoryEntry = async (connectionId, historyEntry) => {
  const connection = await getBankConnectionById(connectionId);
  if (connection) {
    const syncHistory = [...(connection.syncHistory || []), historyEntry].slice(
      -20
    );
    await updateBankConnection(connectionId, {
      syncHistory,
      lastSyncAt: historyEntry.date,
    });
  }
};

// ==========================================
// PENDING BANK TRANSACTIONS
// ==========================================

/**
 * Get all pending bank transactions
 */
export const getAllPendingBankTransactions = async () => {
  return await db.pendingBankTransactions.toArray();
};

/**
 * Get pending transactions by status
 */
export const getPendingBankTransactionsByStatus = async (status) => {
  return await db.pendingBankTransactions.where({ status }).toArray();
};

/**
 * Get pending transactions that need review (status = 'pending' or 'auto-matched')
 */
export const getPendingTransactionsForReview = async () => {
  const all = await db.pendingBankTransactions.toArray();
  return all
    .filter((t) => t.status === "pending" || t.status === "auto-matched")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * Check if transaction already exists by external ID
 */
export const checkTransactionExists = async (externalId) => {
  // Check in pending transactions
  const pending = await db.pendingBankTransactions
    .where({ externalId })
    .first();
  if (pending) return true;

  // Check in actual transactions (cheques, directDeposits, eTransfers)
  const cheque = await db.cheques.where({ externalId }).first();
  if (cheque) return true;

  const deposit = await db.directDeposits.where({ externalId }).first();
  if (deposit) return true;

  const transfer = await db.eTransfers.where({ externalId }).first();
  if (transfer) return true;

  return false;
};

/**
 * Get all existing external IDs to prevent duplicates
 */
export const getAllExternalIds = async () => {
  const ids = new Set();

  // Get from pending transactions
  const pending = await db.pendingBankTransactions.toArray();
  pending.forEach((t) => t.externalId && ids.add(t.externalId));

  // Get from cheques
  const cheques = await db.cheques.toArray();
  cheques.forEach((t) => t.externalId && ids.add(t.externalId));

  // Get from direct deposits
  const deposits = await db.directDeposits.toArray();
  deposits.forEach((t) => t.externalId && ids.add(t.externalId));

  // Get from e-transfers
  const transfers = await db.eTransfers.toArray();
  transfers.forEach((t) => t.externalId && ids.add(t.externalId));

  return ids;
};

/**
 * Add a pending bank transaction
 */
export const addPendingBankTransaction = async (transaction) => {
  return await db.pendingBankTransactions.add({
    ...transaction,
    status: transaction.status || "pending",
    importedAt: transaction.importedAt || new Date().toISOString(),
  });
};

/**
 * Add multiple pending bank transactions
 */
export const bulkAddPendingBankTransactions = async (transactions) => {
  return await db.pendingBankTransactions.bulkAdd(transactions);
};

/**
 * Update a pending bank transaction
 */
export const updatePendingBankTransaction = async (id, updates) => {
  return await db.pendingBankTransactions.update(id, updates);
};

/**
 * Delete a pending bank transaction
 */
export const deletePendingBankTransaction = async (id) => {
  return await db.pendingBankTransactions.delete(id);
};

/**
 * Clear all pending bank transactions (for re-sync)
 */
export const clearAllPendingBankTransactions = async () => {
  return await db.pendingBankTransactions.clear();
};

/**
 * Approve a pending transaction and create the actual transaction
 * @param {number} pendingId - ID of the pending transaction
 * @param {Object} approvalData - Data for creating the actual transaction
 * @returns {Object} - The created transaction
 */
export const approvePendingTransaction = async (pendingId, approvalData) => {
  const pending = await db.pendingBankTransactions.get(pendingId);
  if (!pending) {
    throw new Error("Pending transaction not found");
  }

  const { practiceId, paymentType, notes } = approvalData;

  let newTransactionId;
  const transactionData = {
    practiceId,
    amount: pending.amount,
    externalId: pending.externalId,
    notes: notes || `Bank import: ${pending.originalDescription}`,
  };

  // Create the appropriate transaction type
  switch (paymentType) {
    case "directDeposits":
      newTransactionId = await db.directDeposits.add({
        ...transactionData,
        paymentDate: pending.date,
        transactionId: pending.tellerTransactionId,
        sourceBank: pending.institutionName,
      });
      break;

    case "eTransfers":
      newTransactionId = await db.eTransfers.add({
        ...transactionData,
        paymentDate: pending.date,
        confirmationNumber: pending.tellerTransactionId,
        senderContact: pending.description,
        status: "Received",
      });
      break;

    case "cheques":
      newTransactionId = await db.cheques.add({
        ...transactionData,
        dateReceived: pending.date,
        chequeNumber: pending.tellerTransactionId?.slice(-6) || "BANK",
        status: "Deposited",
      });
      break;

    default:
      throw new Error(`Unknown payment type: ${paymentType}`);
  }

  // Also create a payment record
  await db.payments.add({
    practiceId,
    paymentDate: pending.date,
    amount: pending.amount,
    paymentMethod:
      paymentType === "directDeposits"
        ? "directDeposit"
        : paymentType === "eTransfers"
        ? "e-transfer"
        : "cheque",
    referenceNumber: pending.tellerTransactionId,
    externalId: pending.externalId,
    linkedDirectDepositId:
      paymentType === "directDeposits" ? newTransactionId : null,
    linkedETransferId: paymentType === "eTransfers" ? newTransactionId : null,
    linkedChequeId: paymentType === "cheques" ? newTransactionId : null,
    notes: notes || `Bank import: ${pending.originalDescription}`,
  });

  // Update pending transaction status
  await updatePendingBankTransaction(pendingId, {
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvedPracticeId: practiceId,
    approvedPaymentType: paymentType,
  });

  return { transactionId: newTransactionId, type: paymentType };
};

/**
 * Reject a pending transaction
 */
export const rejectPendingTransaction = async (pendingId, reason = "") => {
  await updatePendingBankTransaction(pendingId, {
    status: "rejected",
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
  });
};

/**
 * Bulk approve pending transactions
 */
export const bulkApprovePendingTransactions = async (approvals) => {
  const results = [];
  for (const approval of approvals) {
    try {
      const result = await approvePendingTransaction(
        approval.pendingId,
        approval.data
      );
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        pendingId: approval.pendingId,
      });
    }
  }
  return results;
};

/**
 * Bulk reject pending transactions
 */
export const bulkRejectPendingTransactions = async (
  pendingIds,
  reason = ""
) => {
  for (const id of pendingIds) {
    await rejectPendingTransaction(id, reason);
  }
};

// ==========================================
// BANK SYNC SETTINGS
// ==========================================

const SETTINGS_KEY = "bankSyncSettings";

/**
 * Get bank sync settings
 */
export const getBankSyncSettings = async () => {
  const settings = await db.bankSyncSettings
    .where({ settingsKey: SETTINGS_KEY })
    .first();
  return settings?.data || null;
};

/**
 * Save bank sync settings
 */
export const saveBankSyncSettings = async (settings) => {
  const existing = await db.bankSyncSettings
    .where({ settingsKey: SETTINGS_KEY })
    .first();

  if (existing) {
    return await db.bankSyncSettings.update(existing.id, {
      data: settings,
      updatedAt: new Date().toISOString(),
    });
  } else {
    return await db.bankSyncSettings.add({
      settingsKey: SETTINGS_KEY,
      data: settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
};

/**
 * Get practice patterns for auto-linking
 */
export const getPracticePatterns = async () => {
  const settings = await getBankSyncSettings();
  return settings?.practicePatterns || [];
};

/**
 * Save practice patterns for auto-linking
 */
export const savePracticePatterns = async (patterns) => {
  const settings = (await getBankSyncSettings()) || {};
  return await saveBankSyncSettings({
    ...settings,
    practicePatterns: patterns,
  });
};

/**
 * Get unique senders/descriptions from all bank transactions
 * This aggregates from pending transactions and approved transactions
 * Returns array of { sender, count, lastSeen, sampleAmount }
 */
export const getUniqueBankSenders = async () => {
  const senderMap = new Map();

  // Helper to add sender to map
  const addSender = (description, amount, date) => {
    if (!description) return;
    const key = description.trim().toUpperCase();
    if (senderMap.has(key)) {
      const existing = senderMap.get(key);
      existing.count++;
      existing.totalAmount += Math.abs(amount || 0);
      if (new Date(date) > new Date(existing.lastSeen)) {
        existing.lastSeen = date;
      }
    } else {
      senderMap.set(key, {
        sender: description.trim(),
        count: 1,
        totalAmount: Math.abs(amount || 0),
        lastSeen: date || new Date().toISOString(),
      });
    }
  };

  // Get from pending transactions
  const pending = await db.pendingBankTransactions.toArray();
  pending.forEach((t) => addSender(t.description, t.amount, t.date));

  // Get from approved transactions (directDeposits, cheques, eTransfers)
  // Check if they have originalDescription or externalId from bank import
  const deposits = await db.directDeposits.toArray();
  deposits.forEach((t) => {
    if (t.externalId?.startsWith("teller_")) {
      addSender(t.notes?.replace("Bank import: ", ""), t.amount, t.paymentDate);
    }
  });

  // For cheques, get the practice name as the "sender"
  // Cheques are physical payments - the sender is the practice
  const cheques = await db.cheques.toArray();
  const practices = await db.practices.toArray();
  const practiceMap = new Map(practices.map((p) => [p.id, p.name]));

  cheques.forEach((t) => {
    // Use the practice name as the sender for cheques
    const practiceName = practiceMap.get(t.practiceId);
    if (practiceName) {
      addSender(practiceName, t.amount, t.dateReceived);
    }
  });

  const transfers = await db.eTransfers.toArray();
  transfers.forEach((t) => {
    if (t.externalId?.startsWith("teller_")) {
      addSender(t.notes?.replace("Bank import: ", ""), t.amount, t.paymentDate);
    }
  });

  // Convert to array and sort by count (most frequent first)
  return Array.from(senderMap.values()).sort((a, b) => b.count - a.count);
};
