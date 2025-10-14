/**
 * A collection of financial calculation helpers for the application.
 */

/**
 * Calculates pay for a single, given period of time.
 */
export const calculateSinglePeriod = (practice, entriesInPeriod) => {
  const performanceEntries = entriesInPeriod.filter(
    (e) => e.entryType !== "attendanceRecord"
  );
  const attendanceDays = new Set(
    entriesInPeriod
      .filter(
        (e) =>
          e.entryType === "attendanceRecord" || e.entryType === "dailySummary"
      )
      .map((e) => e.date)
  ).size;

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

  return {
    calculatedPay,
    basePayOwed,
    productionPayComponent,
    productionTotal: grossProduction,
  };
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
      /* Logic for weekly can be added here */ return periods;
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
export const calculatePay = (practice, entriesInMonth, year, month) => {
  if (!practice)
    return {
      calculatedPay: 0,
      basePayOwed: 0,
      productionPayComponent: 0,
      productionTotal: 0,
      payStructure: "",
      payPeriods: [],
    };

  const productionTotal = entriesInMonth
    .filter((e) => e.entryType !== "attendanceRecord")
    .reduce((sum, e) => sum + (e.production || 0), 0);

  const periodSummaries = entriesInMonth.filter(
    (e) => e.entryType === "periodSummary"
  );
  const dailyAndAttendanceEntries = entriesInMonth.filter(
    (e) => e.entryType !== "periodSummary"
  );

  let totalCalculatedPay = 0;
  let totalBasePayOwed = 0;
  let totalProductionPayComponent = 0;
  let payStructure = "";
  let periodDetails = [];

  // THE FIX: The logic is now mutually exclusive. It prioritizes Period Summaries.
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

  return {
    calculatedPay: totalCalculatedPay,
    basePayOwed: totalBasePayOwed,
    productionPayComponent: totalProductionPayComponent,
    productionTotal,
    payStructure,
    // THE FIX: The payPeriods array is now correctly included in the return statement.
    payPeriods: periodDetails.sort((a, b) => a.start - b.start),
  };
};
