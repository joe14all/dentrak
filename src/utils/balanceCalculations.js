/* eslint-disable no-unused-vars */
import { calculateSinglePeriod } from "./calculations";

// Configurable threshold for W2 discrepancy check
const W2_DISCREPANCY_THRESHOLD_PERCENT = 0.3;

/**
 * Estimates the payment due date based on a completed period's end date,
 * the practice's pay cycle, and specific payment details.
 *
 * @param {Date} periodEndDate - The end date of the completed pay period (UTC).
 * @param {'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom'} payCycle - The payment frequency.
 * @param {string} [paymentDetail] - Free text describing payment specifics (e.g., "15th of following month").
 * @returns {Date | null} The estimated due date (UTC) or null if unable to determine.
 */
const estimateDueDateForCompletedPeriod = (
  periodEndDate,
  payCycle,
  paymentDetail
) => {
  if (!(periodEndDate instanceof Date) || isNaN(periodEndDate.getTime())) {
    return null;
  }

  const details = paymentDetail?.toLowerCase() || "";
  const year = periodEndDate.getUTCFullYear();
  const month = periodEndDate.getUTCMonth();
  let dueDate = null;
  let specificDetailMatched = false;

  // --- Parse Specific Payment Details ---
  if (details.includes("following month")) {
    specificDetailMatched = true;
    const dayMatch = details.match(/(\d+)(?:st|nd|rd|th)?/);
    const day = dayMatch?.[1] ? parseInt(dayMatch[1], 10) : 15; // Default to 15th if no day found
    const targetYear = month === 11 ? year + 1 : year;
    const targetMonth = month === 11 ? 0 : month + 1;
    // Ensure day is valid for the target month
    const lastDayOfTargetMonth = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0)
    ).getUTCDate();
    const validDay = Math.min(day, lastDayOfTargetMonth);
    dueDate = new Date(Date.UTC(targetYear, targetMonth, validDay));
  } else if (
    details.includes("end of month") ||
    details.includes("last business day")
  ) {
    specificDetailMatched = true;
    dueDate = new Date(Date.UTC(year, month + 1, 0)); // Last day of the current month
  } else if (
    details.includes("every second friday") ||
    (details.includes("bi-weekly") && !details)
  ) {
    // Treat generic "bi-weekly" detail or specific phrase as due on period end
    specificDetailMatched = true;
    dueDate = new Date(periodEndDate); // Due ON period end date
  }

  // --- Apply Defaults Based on Pay Cycle if No Specific Detail Matched ---
  if (!specificDetailMatched) {
    switch (payCycle) {
      case "bi-weekly":
        dueDate = new Date(periodEndDate); // Due ON period end date
        break;
      case "monthly": {
        const targetYear = month === 11 ? year + 1 : year;
        const targetMonth = month === 11 ? 0 : month + 1;
        const lastDayOfTargetMonth = new Date(
          Date.UTC(targetYear, targetMonth + 1, 0)
        ).getUTCDate();
        const validDay = Math.min(15, lastDayOfTargetMonth); // Default to 15th of following month
        dueDate = new Date(Date.UTC(targetYear, targetMonth, validDay));
        break;
      }
      case "weekly":
        dueDate = new Date(periodEndDate);
        dueDate.setUTCDate(periodEndDate.getUTCDate() + 7); // Due 7 days after period end
        break;
      default: // daily, custom, or unspecified fallback
        dueDate = new Date(periodEndDate);
        dueDate.setUTCDate(periodEndDate.getUTCDate() + 15); // Fallback to 15 days after period end
        break;
    }
  }

  // --- Final Validation ---
  if (dueDate && !isNaN(dueDate.getTime())) {
    return dueDate;
  }

  // Log a warning if date couldn't be determined (removed console.warn)
  return null;
};

/**
 * Generates all potential historical pay periods for a practice based on their entries
 * up to (but not including) the 'today' date.
 *
 * @param {Practice} practice - The practice object containing payCycle.
 * @param {Array<Entry>} practiceEntries - All entries associated with this practice.
 * @param {Date} today - The current date (UTC, start of day).
 * @returns {Array<{start: Date, end: Date}>} An array of historical pay periods, sorted chronologically.
 */
const generateHistoricalPayPeriods = (practice, practiceEntries, today) => {
  if (!practiceEntries?.length) return [];

  const allPeriods = new Map(); // Use Map to avoid duplicate periods

  // Find the earliest entry date to determine the starting year/month
  const firstEntryDate = practiceEntries.reduce((earliest, entry) => {
    const dateStr = entry.date || entry.periodStartDate;
    if (!dateStr) return earliest;
    try {
      const entryDate = new Date(`${dateStr}T00:00:00Z`);
      return !isNaN(entryDate.getTime()) && entryDate < earliest
        ? entryDate
        : earliest;
    } catch (e) {
      return earliest; // Ignore invalid dates
    }
  }, today);

  const startYear = firstEntryDate.getUTCFullYear();
  const endYear = today.getUTCFullYear();

  // Iterate through years and months from the first entry up to today
  for (let year = startYear; year <= endYear; year++) {
    const startMonth = year === startYear ? firstEntryDate.getUTCMonth() : 0;
    const endMonth = year === endYear ? today.getUTCMonth() : 11;

    for (let month = startMonth; month <= endMonth; month++) {
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month, daysInMonth));
      let monthGeneratedPeriods = [];

      // Generate periods based on the practice's pay cycle
      switch (practice.payCycle) {
        case "monthly":
          monthGeneratedPeriods.push({
            start: firstDayOfMonth,
            end: lastDayOfMonth,
          });
          break;
        case "bi-weekly": {
          const midMonth = new Date(Date.UTC(year, month, 15));
          const dayAfterMid = new Date(Date.UTC(year, month, 16));
          monthGeneratedPeriods.push({ start: firstDayOfMonth, end: midMonth });
          if (daysInMonth > 15) {
            // Avoid creating a second period if month ends on 15th
            monthGeneratedPeriods.push({
              start: dayAfterMid,
              end: lastDayOfMonth,
            });
          }
          break;
        }
        case "weekly": {
          let weekStart = new Date(firstDayOfMonth);
          while (
            weekStart.getUTCMonth() === month &&
            weekStart <= lastDayOfMonth
          ) {
            let weekEnd = new Date(weekStart);
            weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
            // Adjust week end if it crosses into the next month or exceeds month days
            if (weekEnd.getUTCMonth() !== month || weekEnd > lastDayOfMonth) {
              weekEnd = new Date(lastDayOfMonth);
            }
            monthGeneratedPeriods.push({
              start: new Date(weekStart),
              end: new Date(weekEnd),
            });
            if (weekEnd.getTime() >= lastDayOfMonth.getTime()) break; // Exit if we've reached month end
            weekStart.setUTCDate(weekStart.getUTCDate() + 7); // Move to next week start
          }
          break;
        }
        default: // Fallback behaves like monthly
          monthGeneratedPeriods.push({
            start: firstDayOfMonth,
            end: lastDayOfMonth,
          });
          break;
      }

      // Add generated periods to the map if they ended before today
      monthGeneratedPeriods.forEach((p) => {
        if (p.end < today) {
          const key = `${p.start.toISOString()}-${p.end.toISOString()}`;
          if (!allPeriods.has(key)) {
            allPeriods.set(key, p);
          }
        }
      });
    }
  }

  // Convert map values to array and sort chronologically
  const sortedPeriods = Array.from(allPeriods.values()).sort(
    (a, b) => a.start - b.start
  );
  return sortedPeriods;
};

/**
 * Determines the start and end dates of the pay period that includes 'today'.
 *
 * @param {Practice} practice - The practice object containing payCycle.
 * @param {Date} today - The current date (UTC, start of day).
 * @returns {{start: Date, end: Date}} The start and end dates of the current pay period.
 */
const getCurrentPayPeriod = (practice, today) => {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDayOfMonth = new Date(Date.UTC(year, month, daysInMonth));

  switch (practice.payCycle) {
    case "monthly":
      return { start: firstDayOfMonth, end: lastDayOfMonth };
    case "bi-weekly":
      if (day <= 15) {
        return {
          start: firstDayOfMonth,
          end: new Date(Date.UTC(year, month, 15)),
        };
      } else {
        return {
          start: new Date(Date.UTC(year, month, 16)),
          end: lastDayOfMonth,
        };
      }
    case "weekly": {
      const currentDayOfWeek = today.getUTCDay(); // 0 = Sunday, 6 = Saturday
      const startOfWeek = new Date(today);
      startOfWeek.setUTCDate(day - currentDayOfWeek); // Go back to Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6); // Go forward to Saturday

      // Adjust if start/end fall outside the current month
      if (startOfWeek.getUTCMonth() !== month) startOfWeek.setUTCDate(1);
      if (endOfWeek.getUTCMonth() !== month || endOfWeek > lastDayOfMonth)
        endOfWeek.setUTCDate(daysInMonth);

      return { start: startOfWeek, end: endOfWeek };
    }
    default: // Fallback behaves like monthly
      return { start: firstDayOfMonth, end: lastDayOfMonth };
  }
};

/**
 * Calculates the balance information for each active practice.
 * This includes historical balance, current period estimate, and status.
 *
 * @param {Array<Practice>} practices - List of all practices.
 * @param {Array<Entry>} entries - List of all entries.
 * @param {Array<Payment>} genericPayments - List of generic payments (potentially deprecated).
 * @param {Array<Cheque>} cheques - List of all cheque transactions.
 * @param {Array<DirectDeposit>} directDeposits - List of all direct deposit transactions.
 * @param {Array<ETransfer>} eTransfers - List of all e-transfer transactions.
 * @returns {Array<BalanceInfo>} An array of balance info objects for active practices, sorted by status/amount.
 */
export const calculatePracticeBalances = (
  practices,
  entries,
  genericPayments,
  cheques,
  directDeposits,
  eTransfers
) => {
  if (!practices || !entries || !cheques || !directDeposits || !eTransfers) {
    return [];
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normalize to start of day UTC

  const balanceInfo = practices
    .filter((p) => p.status === "active")
    .map((practice) => {
      const practiceEntries = entries.filter(
        (e) => e.practiceId === practice.id
      );
      const practiceCheques = cheques.filter(
        (t) => t.practiceId === practice.id
      );
      const practiceDirectDeposits = directDeposits.filter(
        (t) => t.practiceId === practice.id
      );
      const practiceETransfers = eTransfers.filter(
        (t) => t.practiceId === practice.id
      );

      // --- 1. Calculate Total Pay for Completed Historical Periods ---
      let totalCalculatedPayForCompletedPeriods = 0;
      let lastCompletedPeriodEnd = null;
      const historicalPeriods = generateHistoricalPayPeriods(
        practice,
        practiceEntries,
        today
      );

      historicalPeriods.forEach((period) => {
        const entriesInPeriod = practiceEntries.filter((e) => {
          const dateStr = e.date || e.periodStartDate;
          if (!dateStr) return false;
          try {
            const entryDate = new Date(`${dateStr}T00:00:00Z`);
            if (e.entryType === "periodSummary") {
              // Period summaries span dates, check for overlap
              const entryEndDate = new Date(`${e.periodEndDate}T00:00:00Z`);
              return entryDate <= period.end && entryEndDate >= period.start;
            }
            // Other entries are point-in-time
            return entryDate >= period.start && entryDate <= period.end;
          } catch (err) {
            return false; // Ignore invalid dates
          }
        });

        if (entriesInPeriod.length > 0) {
          const { calculatedPay } = calculateSinglePeriod(
            practice,
            entriesInPeriod
          );
          totalCalculatedPayForCompletedPeriods += calculatedPay;
          // Track the end date of the latest period with entries
          if (!lastCompletedPeriodEnd || period.end > lastCompletedPeriodEnd) {
            lastCompletedPeriodEnd = period.end;
          }
        }
      });

      // --- 2. Calculate Total *Confirmed* Payments Received To Date ---
      let totalConfirmedPaymentsToDate = 0;
      practiceCheques
        .filter((c) => c.status === "Cleared")
        .forEach(
          (c) => (totalConfirmedPaymentsToDate += Number(c.amount) || 0)
        );
      practiceDirectDeposits // Assumed confirmed
        .forEach(
          (d) => (totalConfirmedPaymentsToDate += Number(d.amount) || 0)
        );
      practiceETransfers
        .filter((t) => t.status === "Accepted")
        .forEach(
          (t) => (totalConfirmedPaymentsToDate += Number(t.amount) || 0)
        );
      // Consider adding generic 'cash' payments if needed:
      // genericPayments.filter(p => p.practiceId === practice.id && p.paymentMethod === 'cash').forEach(p => totalConfirmedPaymentsToDate += (Number(p.amount) || 0));

      // --- 3. Calculate Overall Balance ---
      // Balance = Total Earned (Completed Periods) - Total Confirmed Payments
      const overallBalance =
        Math.round(
          (totalCalculatedPayForCompletedPeriods -
            totalConfirmedPaymentsToDate) *
            100
        ) / 100;

      // --- 4. Estimate Pay for the *Current* In-Progress Period ---
      const currentPeriod = getCurrentPayPeriod(practice, today);
      let estimatedCurrentPeriodPay = 0;
      if (currentPeriod) {
        const entriesInCurrentPeriod = practiceEntries.filter((e) => {
          const dateStr = e.date || e.periodStartDate;
          if (!dateStr) return false;
          try {
            const entryDate = new Date(`${dateStr}T00:00:00Z`);
            // Only include entries *within* the current period boundaries AND *up to today*
            return (
              entryDate >= currentPeriod.start &&
              entryDate <= currentPeriod.end &&
              entryDate <= today
            );
          } catch (err) {
            return false;
          }
        });
        if (entriesInCurrentPeriod.length > 0) {
          estimatedCurrentPeriodPay = calculateSinglePeriod(
            practice,
            entriesInCurrentPeriod
          ).calculatedPay;
        }
      }

      // --- 5. Determine Status and Due Date ---
      let status = "Paid Up";
      let displayDueDate = null;
      let isOverdue = false;

      // Check if the last completed period is overdue
      if (lastCompletedPeriodEnd) {
        const dueDateForLastPeriod = estimateDueDateForCompletedPeriod(
          lastCompletedPeriodEnd,
          practice.payCycle,
          practice.paymentDetail
        );
        if (dueDateForLastPeriod) {
          displayDueDate = dueDateForLastPeriod; // Store the potential due date
          if (dueDateForLastPeriod < today) {
            isOverdue = true; // Mark as overdue if due date is in the past
          }
        }
      }

      // Determine final status based on balance, overdue status, and tax status
      if (overallBalance > 0.01) {
        // If there's a positive balance
        if (practice.taxStatus === "employee") {
          // Check for potential W2 discrepancy (balance is positive but within tax threshold)
          const maxExpectedTaxWithholding =
            totalCalculatedPayForCompletedPeriods *
            W2_DISCREPANCY_THRESHOLD_PERCENT;
          if (
            totalCalculatedPayForCompletedPeriods > 0 &&
            overallBalance <= maxExpectedTaxWithholding
          ) {
            status = "W2 Discrepancy";
            // Keep `isOverdue` and `displayDueDate` for context, even if status is W2
          } else {
            // Balance exceeds threshold or not a W2 context
            status = isOverdue
              ? "Overdue"
              : displayDueDate
              ? "Due Soon"
              : "Owed";
          }
        } else {
          // Contractor status - directly use overdue/due/owed status
          status = isOverdue ? "Overdue" : displayDueDate ? "Due Soon" : "Owed";
        }
      } else {
        // Balance is zero or negative (paid or overpaid)
        status = "Paid Up";
        isOverdue = false; // Reset overdue flag
        displayDueDate = null; // No relevant due date if paid up
      }

      // Construct the result object for this practice
      return {
        practiceId: practice.id,
        practiceName: practice.name,
        balance: overallBalance > 0.01 ? overallBalance : 0, // Show 0 if paid/overpaid
        estimatedCurrentPeriodPay: estimatedCurrentPeriodPay,
        status: status,
        isOverdue: isOverdue, // Reflects timing, separate from W2 status
        displayDueDate:
          status === "Overdue" || status === "Due Soon" ? displayDueDate : null, // Only relevant if due/overdue
        taxStatus: practice.taxStatus,
        currentPeriod: currentPeriod,
      };
    })
    // Filter out practices with zero balance AND zero current estimate unless they have W2 status
    .filter(
      (b) =>
        b.balance > 0.01 ||
        b.estimatedCurrentPeriodPay > 0.01 ||
        b.status === "W2 Discrepancy"
    )
    // Sort practices: Overdue > W2 > Due Soon > Owed > Paid Up, then by balance/estimate
    .sort((a, b) => {
      const statusOrder = {
        Overdue: 1,
        "W2 Discrepancy": 2,
        "Due Soon": 3,
        Owed: 4,
        "Paid Up": 5,
      };
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;

      if (orderA !== orderB) return orderA - orderB; // Sort by status first
      if (a.isOverdue && !b.isOverdue) return -1; // Prioritize overdue within W2
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.balance !== b.balance) return b.balance - a.balance; // Then by descending balance
      return b.estimatedCurrentPeriodPay - a.estimatedCurrentPeriodPay; // Finally by descending estimate
    });

  return balanceInfo;
};
