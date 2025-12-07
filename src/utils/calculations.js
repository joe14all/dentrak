/**
 * A collection of financial calculation helpers for the application.
 */

/**
 * Calculates pay for a single, given period of time.
 */
export const calculateSinglePeriod = (practice, entriesInPeriod) => {
  // Check for period summary entries which take precedence for financial calculations
  const periodSummaries = entriesInPeriod.filter(
    (e) => e.entryType === "periodSummary"
  );

  let performanceEntries;
  // If period summaries exist, they are the source of truth for financials.
  // This prevents double-counting if daily entries also exist for the same period.
  if (periodSummaries.length > 0) {
    performanceEntries = periodSummaries;
  } else {
    // Otherwise, use daily and individual procedure entries for financials.
    performanceEntries = entriesInPeriod.filter(
      (e) =>
        e.entryType === "dailySummary" || e.entryType === "individualProcedure"
    );
  }

  // Attendance is always calculated from all relevant entries in the given period.
  const attendedDates = [
    ...new Set(
      entriesInPeriod
        .filter(
          (e) =>
            (e.entryType === "attendanceRecord" ||
              e.entryType === "dailySummary") &&
            e.date // Ensure date exists
        )
        .map((e) => e.date)
    ),
  ].sort(); // Sort the dates chronologically

  const attendanceDays = attendedDates.length; // The count is now the length

  const basePayOwed =
    (practice.basePay || practice.dailyGuarantee || 0) * attendanceDays;

  const grossProduction = performanceEntries.reduce(
    (sum, e) => sum + (e.production || 0),
    0
  );
  const grossCollection = performanceEntries.reduce(
    (sum, e) => sum + (e.collection || 0),
    0
  );
  const totalAdjustments = performanceEntries
    .flatMap((e) => e.adjustments || [])
    .reduce((sum, adj) => sum + adj.amount, 0);

  const calculationBaseValue =
    practice.calculationBase === "collection"
      ? grossCollection
      : grossProduction;
  const netBase = calculationBaseValue - totalAdjustments;
  const productionPayComponent = netBase * ((practice.percentage || 0) / 100);

  const calculatedPay = Math.max(basePayOwed, productionPayComponent);

  const result = {
    calculatedPay,
    basePayOwed,
    productionPayComponent,
    productionTotal: grossProduction,
    collectionTotal: grossCollection,
    totalAdjustments,
    netBase,
    attendanceDays,
    attendedDates,
  };
  return result;
};

/**
 * Generates an array of pay period start/end dates for a given month and cycle.
 */
const getPayPeriods = (year, month, payCycle) => {
  const periods = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDate = new Date(Date.UTC(year, month, 1));
  const endDate = new Date(Date.UTC(year, month, daysInMonth));

  switch (payCycle) {
    case "weekly": {
      // Generate weekly periods (7-day chunks) for the month
      let currentStart = new Date(startDate);
      while (currentStart <= endDate) {
        const weekEnd = new Date(currentStart);
        weekEnd.setUTCDate(currentStart.getUTCDate() + 6);

        // Cap the week end at the month's end
        const periodEnd = weekEnd > endDate ? endDate : weekEnd;

        periods.push({
          start: new Date(currentStart),
          end: periodEnd,
        });

        // Move to next week
        currentStart = new Date(periodEnd);
        currentStart.setUTCDate(currentStart.getUTCDate() + 1);
      }
      return periods;
    }
    case "bi-weekly":
      return [
        {
          start: new Date(Date.UTC(year, month, 1)),
          end: new Date(Date.UTC(year, month, 15)),
        },
        { start: new Date(Date.UTC(year, month, 16)), end: endDate },
      ];
    case "monthly":
    default:
      return [{ start: startDate, end: endDate }];
  }
};

/**
 * The main exported function. Calculates pay for a practice over an entire month.
 */
export const calculatePay = (practice, allEntriesForPractice, year, month) => {
  if (!practice)
    return {
      calculatedPay: 0,
      basePayOwed: 0,
      productionPayComponent: 0,
      productionTotal: 0,
      payStructure: "",
      payPeriods: [],
    };

  // Robust filtering to ensure only entries from the specified month/year are considered.
  const entriesInMonth = allEntriesForPractice.filter((e) => {
    const dateStr =
      e.entryType === "periodSummary" ? e.periodStartDate : e.date;
    if (!dateStr) return false;
    // Use UTC to prevent timezone-related date shifts
    const entryDate = new Date(`${dateStr}T00:00:00Z`);
    return (
      entryDate.getUTCFullYear() === year && entryDate.getUTCMonth() === month
    );
  });

  // --- CORRECTED PRODUCTION TOTAL LOGIC ---
  const periodSummaries = entriesInMonth.filter(
    (e) => e.entryType === "periodSummary"
  );

  // Determine which entries to use for the overall month's production total
  let financialEntriesForMonth;
  if (periodSummaries.length > 0) {
    financialEntriesForMonth = periodSummaries;
  } else {
    financialEntriesForMonth = entriesInMonth.filter(
      (e) =>
        e.entryType === "dailySummary" || e.entryType === "individualProcedure"
    );
  }

  const productionTotal = financialEntriesForMonth.reduce(
    (sum, e) => sum + (e.production || 0),
    0
  );
  // --- END CORRECTION ---

  const dailyAndAttendanceEntries = entriesInMonth.filter(
    (e) => e.entryType !== "periodSummary"
  );

  let totalCalculatedPay = 0;
  let totalBasePayOwed = 0;
  let totalProductionPayComponent = 0;
  let payStructure = "";
  let periodDetails = [];

  // This logic is now mutually exclusive and prioritizes Period Summaries for pay calculation.
  if (periodSummaries.length > 0) {
    payStructure = `(Sum of ${periodSummaries.length} Period Summaries)`;
    periodDetails = periodSummaries.map((summaryEntry) => {
      const summaryStart = new Date(
        `${summaryEntry.periodStartDate}T00:00:00Z`
      );
      const summaryEnd = new Date(`${summaryEntry.periodEndDate}T00:00:00Z`);
      const attendanceForThisSummary = entriesInMonth.filter((e) => {
        if (e.entryType !== "attendanceRecord" || !e.date) return false;
        const date = new Date(`${e.date}T00:00:00Z`);
        return date >= summaryStart && date <= summaryEnd;
      });
      const calculationEntries = [summaryEntry, ...attendanceForThisSummary];
      const { calculatedPay, basePayOwed, productionPayComponent } =
        calculateSinglePeriod(practice, calculationEntries);
      totalCalculatedPay += calculatedPay;
      totalBasePayOwed += basePayOwed;
      totalProductionPayComponent += productionPayComponent;
      return {
        start: summaryStart,
        end: summaryEnd,
        base: basePayOwed,
        prod: productionPayComponent,
        final: calculatedPay,
        hasEntries: true,
      };
    });
  } else if (dailyAndAttendanceEntries.length > 0) {
    const payPeriods = getPayPeriods(year, month, practice.payCycle);
    periodDetails = payPeriods.map((period) => {
      const entriesInPeriod = dailyAndAttendanceEntries.filter((e) => {
        if (!e.date) return false;
        const date = new Date(`${e.date}T00:00:00Z`);
        return date >= period.start && date <= period.end;
      });
      const { calculatedPay, basePayOwed, productionPayComponent } =
        calculateSinglePeriod(practice, entriesInPeriod);
      totalCalculatedPay += calculatedPay;
      totalBasePayOwed += basePayOwed;
      totalProductionPayComponent += productionPayComponent;
      return {
        start: period.start,
        end: period.end,
        base: basePayOwed,
        prod: productionPayComponent,
        final: calculatedPay,
        hasEntries: entriesInPeriod.length > 0,
      };
    });
    const relevantPeriods = periodDetails.filter((p) => p.hasEntries);
    payStructure = `(Sum of ${relevantPeriods.length} ${practice.payCycle} periods)`;
  }

  const finalReturn = {
    calculatedPay: totalCalculatedPay,
    basePayOwed: totalBasePayOwed,
    productionPayComponent: totalProductionPayComponent,
    productionTotal,
    payStructure,
    payPeriods: periodDetails.sort((a, b) => a.start - b.start),
  };

  return finalReturn;
};
