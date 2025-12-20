/**
 * Cash Flow Forecasting Utilities
 *
 * Provides forecasting capabilities for upcoming income based on:
 * - Historical payment patterns
 * - Scheduled work days
 * - Average production/collection rates
 * - Practice payment cycles
 */

/**
 * Calculates average daily production and collection for a practice
 * based on historical entries.
 *
 * @param {Array<Entry>} entries - All entries for a practice
 * @param {number} lookbackDays - Number of days to look back (default 90)
 * @returns {{avgProduction: number, avgCollection: number, daysWorked: number}}
 */
export const calculateAveragePerformance = (entries, lookbackDays = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  cutoffDate.setHours(0, 0, 0, 0);

  const recentEntries = entries.filter((e) => {
    const dateStr = e.date || e.periodStartDate;
    if (!dateStr) return false;
    const entryDate = new Date(`${dateStr}T00:00:00Z`);
    return entryDate >= cutoffDate;
  });

  const financialEntries = recentEntries.filter(
    (e) =>
      e.entryType === "dailySummary" ||
      e.entryType === "periodSummary" ||
      e.entryType === "individualProcedure"
  );

  // Count unique dates with actual work (financial entries or attendance)
  const workDates = new Set();
  recentEntries.forEach((e) => {
    const dateStr = e.date || e.periodStartDate;
    if (
      dateStr &&
      (e.entryType === "dailySummary" ||
        e.entryType === "periodSummary" ||
        e.entryType === "individualProcedure" ||
        e.entryType === "attendanceRecord")
    ) {
      workDates.add(dateStr);
    }
  });

  const totalProduction = financialEntries.reduce(
    (sum, e) => sum + (e.production || 0),
    0
  );
  const totalCollection = financialEntries.reduce(
    (sum, e) => sum + (e.collection || 0),
    0
  );
  const daysWorked = workDates.size;

  // Calculate days per week actually worked
  const weeksInPeriod = Math.max(1, lookbackDays / 7);
  const avgDaysPerWeek = daysWorked > 0 ? daysWorked / weeksInPeriod : 0;

  return {
    avgProduction: daysWorked > 0 ? totalProduction / daysWorked : 0,
    avgCollection: daysWorked > 0 ? totalCollection / daysWorked : 0,
    daysWorked,
    avgDaysPerWeek: Math.round(avgDaysPerWeek * 10) / 10,
    totalProduction,
    totalCollection,
  };
};

/**
 * Generates future pay periods for forecasting.
 *
 * @param {Object} practice - Practice object with payCycle
 * @param {Date} startDate - Start date for forecasting
 * @param {number} monthsAhead - Number of months to forecast
 * @returns {Array<{start: Date, end: Date, dueDate: Date}>}
 */
export const generateFuturePayPeriods = (
  practice,
  startDate,
  monthsAhead = 6
) => {
  const periods = [];
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  let currentDate = new Date(today);

  while (currentDate < endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let monthPeriods = [];

    switch (practice.payCycle) {
      case "monthly": {
        const start = new Date(year, month, 1);
        const end = new Date(year, month, daysInMonth);
        const dueDate = estimateFutureDueDate(end, practice);
        monthPeriods.push({ start, end, dueDate });
        break;
      }
      case "bi-weekly": {
        const firstHalf = new Date(year, month, 15);
        const secondHalf = new Date(year, month, daysInMonth);
        const start1 = new Date(year, month, 1);
        const start2 = new Date(year, month, 16);

        monthPeriods.push({
          start: start1,
          end: firstHalf,
          dueDate: estimateFutureDueDate(firstHalf, practice),
        });
        monthPeriods.push({
          start: start2,
          end: secondHalf,
          dueDate: estimateFutureDueDate(secondHalf, practice),
        });
        break;
      }
      case "weekly": {
        let weekStart = new Date(year, month, 1);
        while (weekStart.getMonth() === month) {
          let weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          if (weekEnd.getMonth() !== month) {
            weekEnd = new Date(year, month, daysInMonth);
          }
          monthPeriods.push({
            start: new Date(weekStart),
            end: new Date(weekEnd),
            dueDate: estimateFutureDueDate(weekEnd, practice),
          });
          weekStart.setDate(weekStart.getDate() + 7);
        }
        break;
      }
      default: {
        const start = new Date(year, month, 1);
        const end = new Date(year, month, daysInMonth);
        monthPeriods.push({
          start,
          end,
          dueDate: estimateFutureDueDate(end, practice),
        });
      }
    }

    periods.push(...monthPeriods);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return periods.filter((p) => p.end >= today);
};

/**
 * Estimates the due date for a future pay period.
 */
const estimateFutureDueDate = (periodEndDate, practice) => {
  const details = (practice.paymentDetail || "").toLowerCase();
  const year = periodEndDate.getFullYear();
  const month = periodEndDate.getMonth();

  if (details.includes("following month")) {
    const dayMatch = details.match(/(\d+)(?:st|nd|rd|th)?/);
    const day = dayMatch?.[1] ? parseInt(dayMatch[1], 10) : 15;
    const targetMonth = month === 11 ? 0 : month + 1;
    const targetYear = month === 11 ? year + 1 : year;
    return new Date(
      targetYear,
      targetMonth,
      Math.min(day, new Date(targetYear, targetMonth + 1, 0).getDate())
    );
  }

  if (details.includes("end of month")) {
    return new Date(year, month + 1, 0);
  }

  switch (practice.payCycle) {
    case "bi-weekly":
      return new Date(periodEndDate);
    case "monthly": {
      const targetMonth = month === 11 ? 0 : month + 1;
      const targetYear = month === 11 ? year + 1 : year;
      return new Date(targetYear, targetMonth, 15);
    }
    case "weekly": {
      const dueDate = new Date(periodEndDate);
      dueDate.setDate(dueDate.getDate() + 7);
      return dueDate;
    }
    default: {
      const dueDate = new Date(periodEndDate);
      dueDate.setDate(dueDate.getDate() + 15);
      return dueDate;
    }
  }
};

/**
 * Projects future income based on scheduled work and historical performance.
 *
 * @param {Object} practice - Practice object
 * @param {Array<Entry>} historicalEntries - Past entries for calculating averages
 * @param {Array<Object>} futureSchedule - Array of {date, isScheduled} objects
 * @param {Date} startDate - Projection start date
 * @param {number} monthsAhead - Months to project
 * @returns {Array<{period, estimatedPay, scheduledDays, confidence}>}
 */
export const projectFutureIncome = (
  practice,
  historicalEntries,
  futureSchedule = [],
  startDate = new Date(),
  monthsAhead = 3
) => {
  const { avgProduction, avgCollection, daysWorked, avgDaysPerWeek } =
    calculateAveragePerformance(historicalEntries);

  // If no historical data, return empty projections
  if (daysWorked === 0 || (avgProduction === 0 && avgCollection === 0)) {
    return [];
  }

  const futurePayPeriods = generateFuturePayPeriods(
    practice,
    startDate,
    monthsAhead
  );

  return futurePayPeriods.map((period) => {
    // Count scheduled days in this period
    const scheduledDaysInPeriod = futureSchedule.filter((s) => {
      const scheduleDate = new Date(s.date);
      return (
        s.isScheduled &&
        scheduleDate >= period.start &&
        scheduleDate <= period.end
      );
    }).length;

    // If no schedule provided, estimate based on historical patterns
    const estimatedDays =
      scheduledDaysInPeriod > 0
        ? scheduledDaysInPeriod
        : estimateWorkDaysInPeriod(period, avgDaysPerWeek);

    // Calculate estimated production/collection
    const estimatedProduction = avgProduction * estimatedDays;
    const estimatedCollection = avgCollection * estimatedDays;

    // Use calculation base to determine pay
    const baseValue =
      practice.calculationBase === "collection"
        ? estimatedCollection
        : estimatedProduction;

    const estimatedProductionPay =
      baseValue * ((practice.percentage || 0) / 100);
    const estimatedBasePay =
      (practice.basePay || practice.dailyGuarantee || 0) * estimatedDays;
    const estimatedPay = Math.max(estimatedBasePay, estimatedProductionPay);

    // Confidence level based on whether we have actual schedule data
    const confidence = scheduledDaysInPeriod > 0 ? "high" : "medium";

    return {
      period,
      estimatedPay: Math.round(estimatedPay * 100) / 100,
      scheduledDays: estimatedDays,
      dueDate: period.dueDate,
      confidence,
      breakdown: {
        production: Math.round(estimatedProduction * 100) / 100,
        collection: Math.round(estimatedCollection * 100) / 100,
        basePay: Math.round(estimatedBasePay * 100) / 100,
        productionPay: Math.round(estimatedProductionPay * 100) / 100,
      },
    };
  });
};

/**
 * Estimates work days in a period based on historical patterns.
 * @param {Object} period - Pay period with start and end dates
 * @param {number} avgDaysPerWeek - Average days worked per week from historical data
 */
const estimateWorkDaysInPeriod = (period, avgDaysPerWeek) => {
  const days =
    Math.ceil((period.end - period.start) / (1000 * 60 * 60 * 24)) + 1;
  const weeks = days / 7;
  // Use actual historical pattern, or default to 2.5 days/week if no data
  const workDaysPerWeek = avgDaysPerWeek > 0 ? avgDaysPerWeek : 2.5;
  return Math.round(weeks * workDaysPerWeek);
};

/**
 * Simulates "what-if" scenarios for income forecasting.
 *
 * @param {Object} practice - Practice object
 * @param {Array<Entry>} historicalEntries - Historical entries
 * @param {Object} scenario - {daysOff: number, startDate: Date, endDate: Date}
 * @param {number} monthsAhead - Projection period
 * @returns {Object} Comparison of baseline vs scenario projections
 */
export const simulateScenario = (
  practice,
  historicalEntries,
  scenario,
  monthsAhead = 3
) => {
  const baselineProjection = projectFutureIncome(
    practice,
    historicalEntries,
    [],
    new Date(),
    monthsAhead
  );

  // Calculate which periods are affected by the time off
  const affectedPeriods = baselineProjection.map((proj) => {
    // Check if scenario overlaps with this period
    const scenarioStart = scenario.startDate;
    const scenarioEnd = scenario.endDate;
    const overlaps =
      scenarioStart <= proj.period.end && scenarioEnd >= proj.period.start;

    if (overlaps) {
      // Calculate overlap days
      const overlapStart =
        scenarioStart > proj.period.start ? scenarioStart : proj.period.start;
      const overlapEnd =
        scenarioEnd < proj.period.end ? scenarioEnd : proj.period.end;
      const daysOff =
        Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;

      // Reduce scheduled days
      const adjustedDays = Math.max(0, proj.scheduledDays - daysOff);
      const adjustedPay =
        (proj.estimatedPay / proj.scheduledDays) * adjustedDays;

      return {
        ...proj,
        scheduledDays: adjustedDays,
        estimatedPay: Math.round(adjustedPay * 100) / 100,
        impacted: true,
        daysLost: daysOff,
      };
    }

    return { ...proj, impacted: false };
  });

  const baselineTotal = baselineProjection.reduce(
    (sum, p) => sum + p.estimatedPay,
    0
  );
  const scenarioTotal = affectedPeriods.reduce(
    (sum, p) => sum + p.estimatedPay,
    0
  );
  const difference = baselineTotal - scenarioTotal;

  return {
    baseline: baselineProjection,
    scenario: affectedPeriods,
    summary: {
      baselineTotal: Math.round(baselineTotal * 100) / 100,
      scenarioTotal: Math.round(scenarioTotal * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      percentageImpact:
        baselineTotal > 0
          ? Math.round((difference / baselineTotal) * 10000) / 100
          : 0,
    },
  };
};

/**
 * Aggregates monthly income projections across all practices.
 *
 * @param {Array<Object>} practices - All active practices
 * @param {Object} entriesByPractice - Map of practiceId to entries array
 * @param {number} monthsAhead - Projection period
 * @returns {Array<{month, year, totalProjected, byPractice}>}
 */
export const aggregateMonthlyProjections = (
  practices,
  entriesByPractice,
  monthsAhead = 6
) => {
  const monthlyData = new Map();

  practices
    .filter((p) => p.status === "active")
    .forEach((practice) => {
      const entries = entriesByPractice[practice.id] || [];
      const projections = projectFutureIncome(
        practice,
        entries,
        [],
        new Date(),
        monthsAhead
      );

      projections.forEach((proj) => {
        const month = proj.period.end.getMonth();
        const year = proj.period.end.getFullYear();
        const key = `${year}-${month}`;

        if (!monthlyData.has(key)) {
          monthlyData.set(key, {
            month,
            year,
            totalProjected: 0,
            byPractice: {},
          });
        }

        const monthData = monthlyData.get(key);
        monthData.totalProjected += proj.estimatedPay;

        if (!monthData.byPractice[practice.id]) {
          monthData.byPractice[practice.id] = {
            practiceName: practice.name,
            total: 0,
            periods: [],
          };
        }

        monthData.byPractice[practice.id].total += proj.estimatedPay;
        monthData.byPractice[practice.id].periods.push(proj);
      });
    });

  return Array.from(monthlyData.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
};
