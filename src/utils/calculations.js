/**
 * A collection of financial calculation helpers for the application.
 */

/**
 * Calculates the estimated pay for a given practice and set of entries.
 * @param {object} practice The practice object.
 * @param {Array<object>} entriesInPeriod The entries to calculate pay for.
 * @returns {object} An object containing all necessary pay components.
 */
export const calculatePay = (practice, entriesInPeriod) => {
  if (!practice)
    return {
      calculatedPay: 0,
      basePayOwed: 0,
      productionPayComponent: 0,
      productionTotal: 0,
      collectionTotal: 0,
    };

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

  // The final pay is the greater of the base guarantee or the production-based pay.
  const calculatedPay = Math.max(basePayOwed, productionPayComponent);

  return {
    calculatedPay,
    basePayOwed,
    productionPayComponent, // THE FIX: This value is now correctly exposed for the chart
    productionTotal: grossProduction,
    collectionTotal: grossCollection,
  };
};
