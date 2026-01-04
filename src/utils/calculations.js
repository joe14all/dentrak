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
  // We need to group by date and take the maximum value per date (in case of overlaps)
  const attendanceByDate = {};

  entriesInPeriod
    .filter(
      (e) =>
        (e.entryType === "attendanceRecord" ||
          e.entryType === "dailySummary") &&
        e.date // Ensure date exists
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

  const attendedDates = Object.keys(attendanceByDate).sort();
  const attendanceDays = Object.values(attendanceByDate).reduce(
    (sum, val) => sum + val,
    0
  );

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
    attendanceByDate, // Include full/half day info: { 'YYYY-MM-DD': 1 or 0.5 }
  };
  return result;
};

/**
 * Generates an array of pay period start/end dates for a given month and cycle.
 */
const getPayPeriods = (year, month, payCycle) => {
  console.log("📅 getPayPeriods called:", { year, month, payCycle });

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
  console.log("💰 calculatePay called:", {
    practiceId: practice?.id,
    practiceName: practice?.name,
    payCycle: practice?.payCycle,
    year,
    month,
    entriesCount: allEntriesForPractice?.length,
  });

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

  console.log("📋 Entry analysis:", {
    practiceId: practice.id,
    totalEntries: entriesInMonth.length,
    periodSummaries: periodSummaries.length,
    periodSummaryDetails: periodSummaries.map((ps) => ({
      id: ps.id,
      start: ps.periodStartDate,
      end: ps.periodEndDate,
      production: ps.production,
    })),
  });

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

  // ALWAYS generate periods based on practice payCycle, regardless of entry types
  // This ensures bi-weekly practices always show 2 periods, monthly shows 1, etc.
  console.log("🟢 Generating periods based on payCycle:", practice.payCycle);
  const payPeriods = getPayPeriods(year, month, practice.payCycle);
  console.log("📊 Generated pay periods:", {
    practiceId: practice.id,
    payCycle: practice.payCycle,
    periodsCount: payPeriods.length,
    periods: payPeriods.map((p) => ({
      start: p.start.toISOString(),
      end: p.end.toISOString(),
    })),
  });

  periodDetails = payPeriods.map((period) => {
    // Find ALL entries (period summaries + daily) that fall within this period
    const entriesInPeriod = entriesInMonth.filter((e) => {
      let entryDate;

      if (e.entryType === "periodSummary") {
        // For period summaries, check if they overlap with this period
        const summaryStart = new Date(`${e.periodStartDate}T00:00:00Z`);
        const summaryEnd = new Date(`${e.periodEndDate}T00:00:00Z`);
        // Include if there's any overlap
        return summaryStart <= period.end && summaryEnd >= period.start;
      } else {
        // For daily entries, check if the date falls within the period
        if (!e.date) return false;
        entryDate = new Date(`${e.date}T00:00:00Z`);
        return entryDate >= period.start && entryDate <= period.end;
      }
    });

    console.log("📝 Entries in period:", {
      periodStart: period.start.toISOString(),
      periodEnd: period.end.toISOString(),
      entriesCount: entriesInPeriod.length,
      entryTypes: entriesInPeriod.map((e) => e.entryType),
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

  payStructure = `(${practice.payCycle} - ${payPeriods.length} periods)`;

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
