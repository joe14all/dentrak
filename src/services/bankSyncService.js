/**
 * Bank Sync Service for Dentrak
 *
 * Handles bank account connection via Teller API and transaction syncing
 * with automatic practice linking and approval workflow.
 */

// Teller Application Configuration
export const TELLER_APPLICATION_ID = "app_pn0ih9340bom9ppvn0000";
export const TELLER_ENVIRONMENT = "development";

/**
 * Default category mappings from Teller to Dentrak payment categories
 */
export const DEFAULT_CATEGORY_MAPPINGS = {
  income: "directDeposits",
  transfer: "directDeposits",
  payment: "directDeposits",
  deposit: "directDeposits",
  ach: "directDeposits",
  wire: "directDeposits",
};

/**
 * Practice auto-link patterns - match income descriptions to practices
 * These patterns will be matched against transaction descriptions (case-insensitive)
 */
export const DEFAULT_PRACTICE_PATTERNS = [
  // Pattern format: { pattern: string | RegExp, practiceNameMatch: string }
  // User will configure these in settings
];

/**
 * Get default bank sync options
 */
export function getDefaultBankSyncOptions() {
  return {
    transactionTypes: {
      income: true,
      expense: false, // For dentrak, we only care about income
    },
    dateRange: "last-30-days",
    amountFilter: {
      enabled: false,
      minAmount: null,
      maxAmount: null,
    },
    statusFilter: "posted",
    destination: "pending-review", // Default to pending review for manual approval
  };
}

/**
 * Get default Teller settings
 */
export function getDefaultTellerSettings() {
  return {
    enabled: false,
    connections: [],
    autoSync: false,
    syncFrequency: "manual",
    categoryMappings: { ...DEFAULT_CATEGORY_MAPPINGS },
    defaultSyncOptions: getDefaultBankSyncOptions(),
    practicePatterns: [...DEFAULT_PRACTICE_PATTERNS],
    globalAutoSync: {
      enabled: false,
      frequency: "daily",
    },
  };
}

/**
 * Calculate date range based on option
 */
export function getDateRangeForOption(option, customStart, customEnd) {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (option) {
    case "last-7-days":
      start.setDate(start.getDate() - 7);
      break;
    case "last-30-days":
      start.setDate(start.getDate() - 30);
      break;
    case "last-90-days":
      start.setDate(start.getDate() - 90);
      break;
    case "last-6-months":
      start.setMonth(start.getMonth() - 6);
      break;
    case "this-month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last-month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end.setDate(0);
      break;
    case "this-quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    }
    case "this-year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
      start = new Date(2000, 0, 1);
      break;
    case "custom":
      if (customStart) start = new Date(customStart);
      if (customEnd) end.setTime(new Date(customEnd).getTime());
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

/**
 * Filter transactions based on sync options
 */
export function filterTransactionsByOptions(
  transactions,
  options,
  existingExternalIds
) {
  // Merge with defaults to ensure all properties exist
  const safeOptions = {
    ...getDefaultBankSyncOptions(),
    ...options,
    transactionTypes: {
      ...getDefaultBankSyncOptions().transactionTypes,
      ...options?.transactionTypes,
    },
    amountFilter: {
      ...getDefaultBankSyncOptions().amountFilter,
      ...options?.amountFilter,
    },
  };

  const { start, end } = getDateRangeForOption(
    safeOptions.dateRange,
    safeOptions.customStartDate,
    safeOptions.customEndDate
  );

  return transactions.filter((tx) => {
    // Skip already imported
    if (existingExternalIds.has(`teller_${tx.id}`)) return false;

    // In Teller API:
    // - Positive amounts = money OUT (expenses/debits)
    // - Negative amounts = money IN (income/credits)
    const amount = parseFloat(tx.amount);
    const isExpense = amount > 0; // Positive = money going out
    const isIncome = amount < 0; // Negative = money coming in

    // Type filter
    if (isExpense && !safeOptions.transactionTypes.expense) return false;
    if (isIncome && !safeOptions.transactionTypes.income) return false;

    // Status filter
    if (
      safeOptions.statusFilter !== "all" &&
      tx.status !== safeOptions.statusFilter
    )
      return false;

    // Date filter
    const txDate = new Date(tx.date);
    if (txDate < start || txDate > end) return false;

    // Amount filter
    if (safeOptions.amountFilter?.enabled) {
      const absAmount = Math.abs(amount);
      if (
        safeOptions.amountFilter.minAmount &&
        absAmount < safeOptions.amountFilter.minAmount
      )
        return false;
      if (
        safeOptions.amountFilter.maxAmount &&
        absAmount > safeOptions.amountFilter.maxAmount
      )
        return false;
    }

    return true;
  });
}

/**
 * Map Teller transaction to a pending transaction for review
 */
export function mapTellerToPendingTransaction(
  tellerTx,
  connection,
  practices,
  practicePatterns = []
) {
  const amount = parseFloat(tellerTx.amount);
  // In Teller API: Positive = expense (money out), Negative = income (money in)
  const isIncome = amount < 0;

  // Get merchant name
  const merchantName =
    tellerTx.details?.counterparty?.name || tellerTx.description;

  // Try to auto-match practice based on patterns
  // Pass both the original description AND the merchant name for better matching
  const suggestedPractice = matchPracticeFromDescription(
    tellerTx.description, // Raw bank description
    merchantName, // Merchant/counterparty name
    practices,
    practicePatterns
  );

  // Determine suggested payment type based on amount and description
  const suggestedPaymentType = determineSuggestedPaymentType(
    tellerTx.description,
    amount
  );

  // Set status based on auto-match confidence
  const autoMatched = suggestedPractice && suggestedPractice.confidence >= 90;

  return {
    id: `pending_${tellerTx.id}`,
    tellerTransactionId: tellerTx.id,
    accountId: connection.accountId,
    accountName: `${connection.accountName} (****${connection.lastFour})`,
    institutionName: connection.institutionName,
    amount: Math.abs(amount),
    date: tellerTx.date,
    description: merchantName,
    originalDescription: tellerTx.description,
    type: isIncome ? "income" : "expense",
    status: autoMatched ? "auto-matched" : "pending", // Mark as auto-matched if confidence high
    suggestedPracticeId: suggestedPractice?.id || null,
    suggestedPracticeName: suggestedPractice?.name || null,
    suggestedPaymentType: suggestedPaymentType,
    matchConfidence: suggestedPractice ? suggestedPractice.confidence : 0,
    importedAt: new Date().toISOString(),
    externalId: `teller_${tellerTx.id}`,
  };
}

/**
 * Match practice from transaction description
 */
export function matchPracticeFromDescription(
  description,
  merchantName,
  practices,
  customPatterns = []
) {
  const searchText = `${description || ""} ${merchantName || ""}`
    .toLowerCase()
    .trim();

  if (!searchText) return null;

  // First try custom patterns from settings (sender → practice links)
  for (const pattern of customPatterns) {
    if (!pattern.pattern || !pattern.practiceName) continue;

    const patternText = pattern.pattern.toLowerCase().trim();

    // Check if pattern matches (case-insensitive, partial match)
    let isMatch = false;

    if (pattern.isRegex) {
      try {
        const regex = new RegExp(pattern.pattern, "i");
        isMatch = regex.test(searchText);
      } catch (e) {
        // Invalid regex, fall back to includes
        isMatch = searchText.includes(patternText);
      }
    } else {
      // For non-regex, check if pattern appears in search text OR search text appears in pattern
      // This handles cases where bank description might be shorter/longer than saved sender
      isMatch =
        searchText.includes(patternText) ||
        patternText.includes(searchText.substring(0, 20));
    }

    if (isMatch) {
      const matchedPractice = practices.find(
        (p) =>
          p.name.toLowerCase() === pattern.practiceName.toLowerCase() ||
          p.name.toLowerCase().includes(pattern.practiceName.toLowerCase())
      );
      if (matchedPractice) {
        return { ...matchedPractice, confidence: 95 };
      }
    }
  }

  // Then try direct practice name matching
  for (const practice of practices) {
    const practiceName = practice.name.toLowerCase();
    const practiceWords = practiceName.split(/\s+/).filter((w) => w.length > 3);

    // Check if practice name appears in description
    if (searchText.includes(practiceName)) {
      return { ...practice, confidence: 95 };
    }

    // Check if significant words from practice name appear
    const matchedWords = practiceWords.filter((word) =>
      searchText.includes(word)
    );
    if (
      matchedWords.length >= 2 ||
      (matchedWords.length === 1 && practiceWords.length === 1)
    ) {
      const confidence = Math.round(
        (matchedWords.length / practiceWords.length) * 80
      );
      return { ...practice, confidence };
    }

    // Check city/address match combined with "dental" or "clinic" keywords
    if (practice.city && searchText.includes(practice.city.toLowerCase())) {
      if (
        searchText.includes("dental") ||
        searchText.includes("clinic") ||
        searchText.includes("practice")
      ) {
        return { ...practice, confidence: 60 };
      }
    }
  }

  return null;
}

/**
 * Determine suggested payment type based on description
 */
export function determineSuggestedPaymentType(description, amount) {
  const descLower = description.toLowerCase();

  if (
    descLower.includes("e-transfer") ||
    descLower.includes("etransfer") ||
    descLower.includes("interac")
  ) {
    return "eTransfers";
  }

  if (
    descLower.includes("direct deposit") ||
    descLower.includes("payroll") ||
    descLower.includes("ach")
  ) {
    return "directDeposits";
  }

  if (
    descLower.includes("cheque") ||
    descLower.includes("check") ||
    descLower.includes("chq")
  ) {
    return "cheques";
  }

  // Default based on amount patterns (larger amounts typically direct deposits)
  if (Math.abs(amount) > 1000) {
    return "directDeposits";
  }

  return "directDeposits"; // Default
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Format account display name
 */
export function formatAccountName(account) {
  return `${account.institution?.name || "Bank"} - ${account.name} (****${
    account.last_four
  })`;
}

/**
 * Get date range label for display
 */
export function getDateRangeLabel(range) {
  const labels = {
    "last-7-days": "Last 7 Days",
    "last-30-days": "Last 30 Days",
    "last-90-days": "Last 90 Days",
    "this-month": "This Month",
    "last-month": "Last Month",
    "this-quarter": "This Quarter",
    "this-year": "This Year",
    all: "All Time",
    custom: "Custom Range",
  };
  return labels[range] || range;
}

/**
 * Create sync history entry
 */
export function createSyncHistoryEntry(result, options, counts, duration) {
  return {
    date: new Date().toISOString(),
    result: result, // 'success' | 'error' | 'partial'
    counts: {
      income: counts.income || 0,
      expense: counts.expense || 0,
      skipped: counts.skipped || 0,
      pending: counts.pending || 0,
    },
    duration,
    syncOptions: { ...options },
  };
}
