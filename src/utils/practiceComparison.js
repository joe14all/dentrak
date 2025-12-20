/**
 * Practice Performance Comparison Utilities
 *
 * Functions to compare performance metrics across multiple practices
 * Helps identify most profitable practices and optimization opportunities
 */

import { calculatePay } from "./calculations";

/**
 * Calculate total days worked accounting for half-day attendance
 * @param {Array} entries - Entries to count days from
 * @returns {number} - Total days worked (can include decimals for half-days)
 */
function calculateDaysWorked(entries) {
  const attendanceByDate = {};

  entries
    .filter(
      (e) =>
        (e.entryType === "attendanceRecord" ||
          e.entryType === "dailySummary") &&
        e.date
    )
    .forEach((entry) => {
      const date = entry.date;
      let dayValue = 1; // Default: full day

      // If it's an attendance record with half-day type, count as 0.5
      if (
        entry.entryType === "attendanceRecord" &&
        entry.attendanceType === "half-day"
      ) {
        dayValue = 0.5;
      }

      // Take the maximum value for each date (dailySummary or full-day attendance takes precedence)
      attendanceByDate[date] = Math.max(attendanceByDate[date] || 0, dayValue);
    });

  return Object.values(attendanceByDate).reduce((sum, val) => sum + val, 0);
}

/**
 * Calculate comprehensive metrics for a single practice over a time period
 * @param {Object} practice - Practice object
 * @param {Array} entries - All entries for this practice in the period
 * @param {Array} payments - All payments for this practice in the period
 * @returns {Object} - Comprehensive metrics
 */
export function calculatePracticeMetrics(practice, entries, payments) {
  // Financial entries only (exclude attendance records)
  const financialEntries = entries.filter(
    (e) => e.entryType !== "attendanceRecord"
  );

  // Calculate days worked accounting for half-days
  const daysWorked = calculateDaysWorked(entries);

  // Calculate totals
  const totalProduction = financialEntries.reduce(
    (sum, e) => sum + (e.production || 0),
    0
  );
  const totalCollection = financialEntries.reduce(
    (sum, e) => sum + (e.collection || 0),
    0
  );

  // Calculate pay across all months
  const monthlyPays = [];
  const entryMonths = [
    ...new Set(
      entries.map((e) => {
        const date = new Date(
          e.entryType === "periodSummary" ? e.periodStartDate : e.date
        );
        return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      })
    ),
  ];

  let totalCalculatedPay = 0;
  entryMonths.forEach((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    const monthEntries = entries.filter((e) => {
      const dateStr =
        e.entryType === "periodSummary" ? e.periodStartDate : e.date;
      const date = new Date(`${dateStr}T00:00:00Z`);
      return date.getUTCFullYear() === year && date.getUTCMonth() === month;
    });

    const payResult = calculatePay(practice, monthEntries, year, month);
    totalCalculatedPay += payResult.calculatedPay;
    monthlyPays.push(payResult.calculatedPay);
  });

  // Calculate payments received
  const totalPaymentsReceived = payments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  // Averages
  const avgProductionPerDay = daysWorked > 0 ? totalProduction / daysWorked : 0;
  const avgCollectionPerDay = daysWorked > 0 ? totalCollection / daysWorked : 0;
  const avgPayPerDay = daysWorked > 0 ? totalCalculatedPay / daysWorked : 0;

  // Collection rate (what percentage of production was collected)
  const collectionRate =
    totalProduction > 0 ? (totalCollection / totalProduction) * 100 : 0;

  // Effective rate (calculated pay as percentage of production)
  const effectiveRate =
    totalProduction > 0 ? (totalCalculatedPay / totalProduction) * 100 : 0;

  // Payment status (how much has been paid vs owed)
  const outstandingBalance = totalCalculatedPay - totalPaymentsReceived;

  return {
    practiceId: practice.id,
    practiceName: practice.name,
    paymentType: practice.paymentType,
    percentage: practice.percentage || 0,
    basePay: practice.basePay || 0,
    daysWorked,
    totalProduction,
    totalCollection,
    totalCalculatedPay,
    totalPaymentsReceived,
    outstandingBalance,
    avgProductionPerDay,
    avgCollectionPerDay,
    avgPayPerDay,
    collectionRate,
    effectiveRate,
    monthlyPays,
  };
}

/**
 * Compare multiple practices and rank them by various metrics
 * @param {Array} practices - Array of practice objects
 * @param {Array} allEntries - All entries across all practices
 * @param {Array} allPayments - All payments across all practices
 * @param {Object} options - Filtering options
 * @returns {Object} - Comparison data with rankings
 */
export function comparePractices(
  practices,
  allEntries,
  allPayments,
  options = {}
) {
  const {
    startDate = null,
    endDate = null,
    activeOnly = true,
    practiceIds = null,
  } = options;

  // Filter practices
  let filteredPractices = practices;

  // Filter by practice IDs if specified
  // If practiceIds is an array (even empty), use it for filtering
  // If practiceIds is null/undefined, show all practices
  if (practiceIds !== null && practiceIds !== undefined) {
    if (practiceIds.length === 0) {
      // Empty array means no practices selected - return empty results
      filteredPractices = [];
    } else {
      // Filter to only selected practice IDs
      filteredPractices = filteredPractices.filter((p) =>
        practiceIds.includes(p.id)
      );
    }
  }

  // Filter by active status (only if we have practices to filter)
  if (activeOnly && filteredPractices.length > 0) {
    filteredPractices = filteredPractices.filter(
      (p) => p.status === "active" || !p.status
    );
  }

  // Calculate metrics for each practice
  const practiceMetrics = filteredPractices.map((practice) => {
    // Filter entries for this practice and date range
    let practiceEntries = allEntries.filter(
      (e) => e.practiceId === practice.id
    );
    let practicePayments = allPayments.filter(
      (p) => p.practiceId === practice.id
    );

    if (startDate) {
      practiceEntries = practiceEntries.filter((e) => {
        const entryDate = new Date(
          e.entryType === "periodSummary" ? e.periodStartDate : e.date
        );
        return entryDate >= new Date(startDate);
      });
      practicePayments = practicePayments.filter(
        (p) => new Date(p.paymentDate) >= new Date(startDate)
      );
    }

    if (endDate) {
      practiceEntries = practiceEntries.filter((e) => {
        const entryDate = new Date(
          e.entryType === "periodSummary" ? e.periodStartDate : e.date
        );
        return entryDate <= new Date(endDate);
      });
      practicePayments = practicePayments.filter(
        (p) => new Date(p.paymentDate) <= new Date(endDate)
      );
    }

    return calculatePracticeMetrics(
      practice,
      practiceEntries,
      practicePayments
    );
  });

  // Filter out practices with no activity
  const activePracticeMetrics = practiceMetrics.filter((m) => m.daysWorked > 0);

  // Calculate totals across all practices
  const totals = {
    daysWorked: activePracticeMetrics.reduce((sum, m) => sum + m.daysWorked, 0),
    totalProduction: activePracticeMetrics.reduce(
      (sum, m) => sum + m.totalProduction,
      0
    ),
    totalCollection: activePracticeMetrics.reduce(
      (sum, m) => sum + m.totalCollection,
      0
    ),
    totalCalculatedPay: activePracticeMetrics.reduce(
      (sum, m) => sum + m.totalCalculatedPay,
      0
    ),
    totalPaymentsReceived: activePracticeMetrics.reduce(
      (sum, m) => sum + m.totalPaymentsReceived,
      0
    ),
    outstandingBalance: activePracticeMetrics.reduce(
      (sum, m) => sum + m.outstandingBalance,
      0
    ),
  };

  // Rankings
  const rankings = {
    byTotalPay: [...activePracticeMetrics].sort(
      (a, b) => b.totalCalculatedPay - a.totalCalculatedPay
    ),
    byAvgPayPerDay: [...activePracticeMetrics].sort(
      (a, b) => b.avgPayPerDay - a.avgPayPerDay
    ),
    byProduction: [...activePracticeMetrics].sort(
      (a, b) => b.totalProduction - a.totalProduction
    ),
    byEffectiveRate: [...activePracticeMetrics].sort(
      (a, b) => b.effectiveRate - a.effectiveRate
    ),
    byDaysWorked: [...activePracticeMetrics].sort(
      (a, b) => b.daysWorked - a.daysWorked
    ),
  };

  // Insights
  const insights = generateInsights(activePracticeMetrics, totals);

  return {
    metrics: activePracticeMetrics,
    totals,
    rankings,
    insights,
  };
}

/**
 * Generate insights from practice comparison data
 * @param {Array} metrics - Array of practice metrics
 * @returns {Array} - Array of insight objects
 */
function generateInsights(metrics) {
  const insights = [];

  if (metrics.length === 0) return insights;

  // Best performer by total pay
  const topEarner = metrics.reduce((best, current) =>
    current.totalCalculatedPay > best.totalCalculatedPay ? current : best
  );
  insights.push({
    type: "top_earner",
    title: "Highest Total Income",
    practice: topEarner.practiceName,
    value: topEarner.totalCalculatedPay,
    metric: "Total Calculated Pay",
  });

  // Best daily rate
  const bestDailyRate = metrics.reduce((best, current) =>
    current.avgPayPerDay > best.avgPayPerDay ? current : best
  );
  insights.push({
    type: "best_daily_rate",
    title: "Highest Daily Rate",
    practice: bestDailyRate.practiceName,
    value: bestDailyRate.avgPayPerDay,
    metric: "Average Pay Per Day",
  });

  // Most efficient (best effective rate)
  const mostEfficient = metrics.reduce((best, current) =>
    current.effectiveRate > best.effectiveRate ? current : best
  );
  insights.push({
    type: "most_efficient",
    title: "Best Effective Rate",
    practice: mostEfficient.practiceName,
    value: mostEfficient.effectiveRate,
    metric: "Effective Rate",
    isPercentage: true,
  });

  // Most active (most days worked)
  const mostActive = metrics.reduce((best, current) =>
    current.daysWorked > best.daysWorked ? current : best
  );
  insights.push({
    type: "most_active",
    title: "Most Days Worked",
    practice: mostActive.practiceName,
    value: mostActive.daysWorked,
    metric: "Days Worked",
  });

  // Check for practices with outstanding balances
  const practicesOwed = metrics.filter((m) => m.outstandingBalance > 100);
  if (practicesOwed.length > 0) {
    insights.push({
      type: "outstanding_balance",
      title: "Outstanding Balances",
      count: practicesOwed.length,
      totalOwed: practicesOwed.reduce(
        (sum, m) => sum + m.outstandingBalance,
        0
      ),
    });
  }

  return insights;
}

/**
 * Calculate contribution percentage for each practice
 * @param {Array} metrics - Array of practice metrics
 * @returns {Array} - Metrics with contribution percentages added
 */
export function calculateContributions(metrics) {
  const totalPay = metrics.reduce((sum, m) => sum + m.totalCalculatedPay, 0);
  const totalProduction = metrics.reduce(
    (sum, m) => sum + m.totalProduction,
    0
  );

  return metrics.map((m) => ({
    ...m,
    payContribution: totalPay > 0 ? (m.totalCalculatedPay / totalPay) * 100 : 0,
    productionContribution:
      totalProduction > 0 ? (m.totalProduction / totalProduction) * 100 : 0,
  }));
}
