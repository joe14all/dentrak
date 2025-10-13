/**
 * A collection of financial calculation helpers for the application.
 */

/**
 * Calculates pay for a single, given period of time.
 */
const calculateSinglePeriod = (practice, entriesInPeriod) => {
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
    collectionTotal: grossCollection,
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
      let current = new Date(startDate);
      while (current <= endDate) {
        let periodEnd = new Date(current);
        periodEnd.setUTCDate(current.getUTCDate() + (6 - current.getUTCDay()));
        if (periodEnd > endDate) periodEnd = endDate;
        periods.push({ start: new Date(current), end: new Date(periodEnd) });
        current.setUTCDate(periodEnd.getUTCDate() + 1);
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
 * The main exported function. Calculates pay for a practice over an entire month,
 * respecting the practice's defined pay cycle and handling period summaries.
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

  const performanceEntries = entriesInMonth.filter(
    (e) => e.entryType !== "attendanceRecord"
  );
  const allArePeriodSummaries =
    performanceEntries.length > 0 &&
    performanceEntries.every((e) => e.entryType === "periodSummary");

  let totalCalculatedPay = 0;
  let totalBasePayOwed = 0;
  let totalProductionPayComponent = 0;
  let payStructure = "";
  let periodDetails = [];

  if (allArePeriodSummaries) {
    periodDetails = performanceEntries.map((summaryEntry) => {
      const { calculatedPay, basePayOwed, productionPayComponent } =
        calculateSinglePeriod(practice, [summaryEntry]);
      totalCalculatedPay += calculatedPay;
      totalBasePayOwed += basePayOwed;
      totalProductionPayComponent += productionPayComponent;
      return {
        start: new Date(`${summaryEntry.periodStartDate}T00:00:00Z`),
        end: new Date(`${summaryEntry.periodEndDate}T00:00:00Z`),
        base: basePayOwed,
        prod: productionPayComponent,
        final: calculatedPay,
      };
    });
    payStructure = `(Sum of ${periodDetails.length} Period Summaries)`;
  } else {
    const payPeriods = getPayPeriods(year, month, practice.payCycle);
    periodDetails = payPeriods.map((period) => {
      const entriesInPeriod = entriesInMonth.filter((e) => {
        if (!e.date || e.entryType === "periodSummary") return false;
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
    payStructure = `(Sum of ${relevantPeriods.length} ${
      practice.payCycle
    } period${relevantPeriods.length > 1 ? "s" : ""})`;
  }

  return {
    calculatedPay: totalCalculatedPay,
    basePayOwed: totalBasePayOwed,
    productionPayComponent: totalProductionPayComponent,
    productionTotal,
    payStructure,
    payPeriods: periodDetails.sort((a, b) => a.start - b.start),
  };
};
