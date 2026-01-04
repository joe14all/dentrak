/**
 * JBook API Client for Dentrak
 *
 * Enables Dentrak to communicate with JBook for data synchronization.
 * Uses HTTP fetch to communicate with JBook's local API server.
 *
 * Development Port Configuration:
 * ┌─────────────────────────────────────────┐
 * │  JBook API Server:  127.0.0.1:47832     │
 * │  JBook Vite:        localhost:5173      │
 * │  Dentrak Vite:      localhost:5174      │
 * └─────────────────────────────────────────┘
 */

const API_PORT = 47832;
const API_BASE = `http://127.0.0.1:${API_PORT}`;
const API_TIMEOUT = 5000; // 5 seconds

/**
 * Check if JBook is running and accessible
 */
export async function checkJBookConnection() {
  try {
    const response = await sendRequest("GET", "/health");
    return {
      connected: true,
      ...response,
    };
  } catch {
    return {
      connected: false,
      error: `JBook is not running on port ${API_PORT}. Please start JBook first.`,
    };
  }
}

/**
 * Get JBook server info
 */
export async function getJBookInfo() {
  return sendRequest("GET", "/info");
}

/**
 * Sync payments to JBook
 * @param {Array} payments - Array of payment objects from Dentrak
 */
export async function syncPaymentsToJBook(payments) {
  if (!payments || payments.length === 0) {
    return { synced: 0, skipped: 0, errors: [] };
  }
  return sendRequest("POST", "/sync/payments", payments);
}

/**
 * Sync practices to JBook
 * @param {Array} practices - Array of practice objects from Dentrak
 */
export async function syncPracticesToJBook(practices) {
  if (!practices || practices.length === 0) {
    return { synced: 0, skipped: 0, errors: [] };
  }
  return sendRequest("POST", "/sync/practices", practices);
}

/**
 * Sync expenses to JBook
 * @param {Array} expenses - Array of expense objects from Dentrak
 */
export async function syncExpensesToJBook(expenses) {
  if (!expenses || expenses.length === 0) {
    return { synced: 0, skipped: 0, errors: [] };
  }
  return sendRequest("POST", "/sync/expenses", expenses);
}

/**
 * Get financial summary from JBook
 */
export async function getFinancialSummary() {
  return sendRequest("GET", "/summary");
}

/**
 * Get practices from JBook
 */
export async function getJBookPractices() {
  return sendRequest("GET", "/practices");
}

/**
 * Query transactions from JBook
 * @param {Object} filters - Filter options (startDate, endDate, practiceId, type)
 */
export async function queryJBookTransactions(filters = {}) {
  return sendRequest("POST", "/transactions/query", filters);
}

/**
 * Sync a single period summary to JBook (creates a draft invoice)
 * @param {Object} periodSummary - Period summary data from Dentrak calculations
 * @returns {Promise<{created: boolean, skipped: boolean, invoiceId?: number, error?: string}>}
 */
export async function syncPeriodSummaryToJBook(periodSummary) {
  return sendRequest("POST", "/sync/period-summary", periodSummary);
}

/**
 * Sync multiple period summaries to JBook at once
 * @param {Array} periodSummaries - Array of period summary objects
 * @returns {Promise<{created: number, skipped: number, errors: string[]}>}
 */
export async function syncPeriodSummariesToJBook(periodSummaries) {
  if (!periodSummaries || periodSummaries.length === 0) {
    return { created: 0, skipped: 0, errors: [] };
  }
  return sendRequest("POST", "/sync/period-summaries", periodSummaries);
}

/**
 * Get JBook's invoice sync settings
 * Returns whether JBook wants Dentrak to auto-sync period summaries as invoices
 * @returns {Promise<{autoSyncInvoices: boolean, lastInvoiceSyncDate?: string}>}
 */
export async function getJBookInvoiceSyncSettings() {
  return sendRequest("GET", "/sync/invoice-settings");
}

/**
 * Notify JBook that invoice sync is complete
 * @param {Object} result - The sync result
 */
export async function notifyInvoiceSyncComplete(result) {
  return sendRequest("POST", "/sync/invoice-complete", result);
}

/**
 * Sync all data to JBook at once
 * @param {Object} data - Object containing payments, practices, and expenses arrays
 */
export async function syncAllToJBook({
  payments = [],
  practices = [],
  expenses = [],
}) {
  const results = {
    practices: null,
    payments: null,
    expenses: null,
    success: true,
    errors: [],
  };

  try {
    // Sync in order: practices first, then payments, then expenses
    if (practices.length > 0) {
      results.practices = await syncPracticesToJBook(practices);
      if (results.practices.errors?.length > 0) {
        results.errors.push(...results.practices.errors);
      }
    }

    if (payments.length > 0) {
      results.payments = await syncPaymentsToJBook(payments);
      if (results.payments.errors?.length > 0) {
        results.errors.push(...results.payments.errors);
      }
    }

    if (expenses.length > 0) {
      results.expenses = await syncExpensesToJBook(expenses);
      if (results.expenses.errors?.length > 0) {
        results.errors.push(...results.expenses.errors);
      }
    }

    // Finalize the sync session in JBook to update lastSyncDate
    try {
      await sendRequest("POST", "/sync/complete");
    } catch {
      // Non-fatal: JBook may not have this endpoint in older versions
      console.warn("Could not finalize sync session (JBook may need update)");
    }
  } catch (error) {
    results.success = false;
    results.errors.push(error.message || "Unknown error during sync");
  }

  return results;
}

// ============================================================
// Internal HTTP communication
// ============================================================

/**
 * Send an HTTP request to JBook's API server
 */
async function sendRequest(method, endpoint, body = undefined) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Unknown error");
    }

    return json.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Request timeout. Make sure JBook is running.");
    }

    throw error;
  }
}

/**
 * No cleanup needed for HTTP-based communication
 */
export function closeSyncConnection() {
  // No-op for HTTP-based communication
}

export default {
  checkJBookConnection,
  getJBookInfo,
  syncPaymentsToJBook,
  syncPracticesToJBook,
  syncExpensesToJBook,
  getFinancialSummary,
  getJBookPractices,
  queryJBookTransactions,
  syncPeriodSummaryToJBook,
  syncPeriodSummariesToJBook,
  getJBookInvoiceSyncSettings,
  notifyInvoiceSyncComplete,
  syncAllToJBook,
  closeSyncConnection,
};
