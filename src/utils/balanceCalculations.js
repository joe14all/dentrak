import { calculateSinglePeriod } from "./calculations";

// Configurable threshold
const W2_DISCREPANCY_THRESHOLD_PERCENT = 0.3;

// Helper to format date for logging
const logDate = (date) => (date ? date.toISOString().split("T")[0] : "N/A");

/**
 * Estimates the due date for a completed period.
 */
const estimateDueDateForCompletedPeriod = (
  periodEndDate,
  payCycle,
  paymentDetail
) => {
  // ... (Keep the previous version - seems correct based on logs) ...
  if (!(periodEndDate instanceof Date) || isNaN(periodEndDate.getTime()))
    return null;
  const details = paymentDetail?.toLowerCase() || "";
  const year = periodEndDate.getUTCFullYear();
  const month = periodEndDate.getUTCMonth();
  let dueDate = null;
  let specificDetailMatched = false;
  // --- Specific Detail Parsing ---
  if (details.includes("following month")) {
    specificDetailMatched = true;
    const dayMatch = details.match(/(\d+)(?:st|nd|rd|th)?/);
    const day = dayMatch && dayMatch[1] ? parseInt(dayMatch[1], 10) : 15;
    const targetYear = month === 11 ? year + 1 : year;
    const targetMonth = month === 11 ? 0 : month + 1;
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
    dueDate = new Date(Date.UTC(year, month + 1, 0));
  } else if (
    details.includes("every second friday") ||
    details.includes("bi-weekly")
  ) {
    specificDetailMatched = true;
    dueDate = new Date(periodEndDate); // Due ON period end
  }
  // --- Cycle Defaults ---
  if (!specificDetailMatched) {
    if (payCycle === "bi-weekly") {
      dueDate = new Date(periodEndDate);
    } // Due ON period end
    else if (payCycle === "monthly") {
      const targetYear = month === 11 ? year + 1 : year;
      const targetMonth = month === 11 ? 0 : month + 1;
      const lastDayOfTargetMonth = new Date(
        Date.UTC(targetYear, targetMonth + 1, 0)
      ).getUTCDate();
      const validDay = Math.min(15, lastDayOfTargetMonth);
      dueDate = new Date(Date.UTC(targetYear, targetMonth, validDay));
    } // 15th of following
    else if (payCycle === "weekly") {
      dueDate = new Date(periodEndDate);
      dueDate.setUTCDate(periodEndDate.getUTCDate() + 7);
    } else {
      dueDate = new Date(periodEndDate);
      dueDate.setUTCDate(periodEndDate.getUTCDate() + 15);
    } // Fallback
  }
  // --- Validation ---
  if (dueDate && !isNaN(dueDate.getTime())) return dueDate;
  console.warn(
    `[estimateDueDate] Failed final check. PeriodEnd: ${logDate(
      periodEndDate
    )}, Cycle: ${payCycle}, Details: "${details}"`
  );
  return null;
};

/**
 * Generates ALL historical pay periods for a practice.
 */
const generateHistoricalPayPeriods = (practice, practiceEntries, today) => {
  // ... (Keep the previous version - seems correct) ...
  if (!practiceEntries || practiceEntries.length === 0) return [];
  const allPeriods = new Map();
  const firstEntryDate = practiceEntries.reduce((earliest, entry) => {
    const dateStr = entry.date || entry.periodStartDate;
    if (!dateStr) return earliest;
    try {
      const entryDate = new Date(`${dateStr}T00:00:00Z`);
      if (!isNaN(entryDate.getTime()) && entryDate < earliest) return entryDate;
    } catch (e) {
      /* ignore */
    }
    return earliest;
  }, today);
  const startYear = firstEntryDate.getUTCFullYear();
  const endYear = today.getUTCFullYear();
  for (let year = startYear; year <= endYear; year++) {
    const startMonth = year === startYear ? firstEntryDate.getUTCMonth() : 0;
    const endMonth = year === endYear ? today.getUTCMonth() : 11;
    for (let month = startMonth; month <= endMonth; month++) {
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month, daysInMonth));
      let monthGeneratedPeriods = [];
      switch (practice.payCycle) {
        case "monthly":
          monthGeneratedPeriods.push({
            start: firstDayOfMonth,
            end: lastDayOfMonth,
          });
          break;
        case "bi-weekly":
          const midMonth = new Date(Date.UTC(year, month, 15));
          const dayAfterMid = new Date(Date.UTC(year, month, 16));
          monthGeneratedPeriods.push({ start: firstDayOfMonth, end: midMonth });
          if (daysInMonth > 15)
            monthGeneratedPeriods.push({
              start: dayAfterMid,
              end: lastDayOfMonth,
            });
          break;
        case "weekly":
          let weekStart = new Date(firstDayOfMonth);
          while (
            weekStart.getUTCMonth() === month &&
            weekStart <= lastDayOfMonth
          ) {
            let weekEnd = new Date(weekStart);
            weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
            if (weekEnd.getUTCMonth() !== month || weekEnd > lastDayOfMonth)
              weekEnd = new Date(lastDayOfMonth);
            monthGeneratedPeriods.push({
              start: new Date(weekStart),
              end: new Date(weekEnd),
            });
            if (weekEnd.getTime() >= lastDayOfMonth.getTime()) break;
            weekStart.setUTCDate(weekStart.getUTCDate() + 7);
          }
          break;
        default:
          monthGeneratedPeriods.push({
            start: firstDayOfMonth,
            end: lastDayOfMonth,
          });
          break;
      }
      monthGeneratedPeriods.forEach((p) => {
        if (p.end < today) {
          const key = `${p.start.toISOString()}-${p.end.toISOString()}`;
          if (!allPeriods.has(key)) allPeriods.set(key, p);
        }
      });
    }
  }
  const sortedPeriods = Array.from(allPeriods.values()).sort(
    (a, b) => a.start - b.start
  );
  return sortedPeriods;
};

/**
 * Gets the start and end dates of the current pay period.
 */
const getCurrentPayPeriod = (practice, today) => {
  // ... (Keep previous version) ...
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  switch (practice.payCycle) {
    case "monthly":
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month, daysInMonth)),
      };
    case "bi-weekly":
      if (day <= 15)
        return {
          start: new Date(Date.UTC(year, month, 1)),
          end: new Date(Date.UTC(year, month, 15)),
        };
      else
        return {
          start: new Date(Date.UTC(year, month, 16)),
          end: new Date(Date.UTC(year, month, daysInMonth)),
        };
    case "weekly":
      const currentDayOfWeek = today.getUTCDay();
      const startOfWeek = new Date(today);
      startOfWeek.setUTCDate(day - currentDayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
      if (startOfWeek.getUTCMonth() !== month) startOfWeek.setUTCDate(1);
      if (
        endOfWeek.getUTCMonth() !== month ||
        endOfWeek.getUTCDate() > daysInMonth
      )
        endOfWeek.setUTCDate(daysInMonth);
      return { start: startOfWeek, end: endOfWeek };
    default:
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month, daysInMonth)),
      };
  }
};

/**
 * Calculates the total historical balance and current period estimate.
 * **MODIFIED to accept detailed transactions.**
 * @param {Array<Practice>} practices
 * @param {Array<Entry>} entries
 * @param {Array<Payment>} genericPayments - The generic payments list (might be less useful now)
 * @param {Array<Cheque>} cheques
 * @param {Array<DirectDeposit>} directDeposits
 * @param {Array<ETransfer>} eTransfers
 * @returns {Array<BalanceInfo>}
 */
export const calculatePracticeBalances = (
  practices,
  entries,
  genericPayments, // Keep for now, might remove later
  cheques,
  directDeposits,
  eTransfers
) => {
  console.log(`[calculatePracticeBalances] Starting calculation...`);
  if (!practices || !entries || !cheques || !directDeposits || !eTransfers)
    return [];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const balanceInfo = practices
    .filter((p) => p.status === "active")
    .map((practice) => {
      // console.log(`\n--- Processing ${practice.name} ---`);
      const practiceEntries = entries.filter(
        (e) => e.practiceId === practice.id
      );
      // Filter specific transaction types for this practice
      const practiceCheques = cheques.filter(
        (t) => t.practiceId === practice.id
      );
      const practiceDirectDeposits = directDeposits.filter(
        (t) => t.practiceId === practice.id
      );
      const practiceETransfers = eTransfers.filter(
        (t) => t.practiceId === practice.id
      );

      // 1. Total Calculated Pay for Completed Periods
      let totalCalculatedPayForCompletedPeriods = 0;
      let lastCompletedPeriodEnd = null;
      const historicalPeriods = generateHistoricalPayPeriods(
        practice,
        practiceEntries,
        today
      );

      historicalPeriods.forEach((period) => {
        const entriesInPeriod = practiceEntries.filter((e) => {
          /* ... Filter logic ... */
          const dateStr = e.date || e.periodStartDate;
          if (!dateStr) return false;
          try {
            const entryDate = new Date(`${dateStr}T00:00:00Z`);
            if (e.entryType === "periodSummary") {
              const entryEndDate = new Date(`${e.periodEndDate}T00:00:00Z`);
              return entryDate <= period.end && entryEndDate >= period.start;
            }
            return entryDate >= period.start && entryDate <= period.end;
          } catch (err) {
            return false;
          }
        });
        if (entriesInPeriod.length > 0) {
          const { calculatedPay } = calculateSinglePeriod(
            practice,
            entriesInPeriod
          );
          totalCalculatedPayForCompletedPeriods += calculatedPay;
          if (!lastCompletedPeriodEnd || period.end > lastCompletedPeriodEnd)
            lastCompletedPeriodEnd = period.end;
        }
      });
      // console.log(`Total Calculated Pay (Completed): ${totalCalculatedPayForCompletedPeriods}`);

      // 2. Calculate TOTAL *Confirmed* Payments Received
      // ***** MODIFIED to check status *****
      let totalConfirmedPaymentsToDate = 0;

      // Add cleared cheques
      practiceCheques.forEach((cheque) => {
        if (cheque.status === "Cleared") {
          totalConfirmedPaymentsToDate += Number(cheque.amount) || 0;
        }
      });
      // Add all direct deposits (assumed confirmed once recorded)
      practiceDirectDeposits.forEach((deposit) => {
        totalConfirmedPaymentsToDate += Number(deposit.amount) || 0;
      });
      // Add accepted e-transfers
      practiceETransfers.forEach((transfer) => {
        if (transfer.status === "Accepted") {
          totalConfirmedPaymentsToDate += Number(transfer.amount) || 0;
        }
      });
      // Optionally add 'cash' from genericPayments if relevant
      // genericPayments.filter(p => p.practiceId === practice.id && p.paymentMethod === 'cash').forEach(p => totalConfirmedPaymentsToDate += (Number(p.amount) || 0));

      console.log(
        `[calculatePracticeBalances] ${practice.name}: Total *Confirmed* Payments Received: ${totalConfirmedPaymentsToDate}`
      );

      // 3. Overall Balance (using confirmed payments)
      const overallBalance =
        Math.round(
          (totalCalculatedPayForCompletedPeriods -
            totalConfirmedPaymentsToDate) *
            100
        ) / 100;
      console.log(
        `[calculatePracticeBalances] ${practice.name}: Overall Balance (Pay - Confirmed Payments): ${overallBalance}`
      );

      // 4. Estimate for CURRENT Period
      const currentPeriod = getCurrentPayPeriod(practice, today);
      let estimatedCurrentPeriodPay = 0;
      if (currentPeriod) {
        const entriesInCurrentPeriod = practiceEntries.filter((e) => {
          /* ... Keep filter logic with <= today ... */
          const dateStr = e.date || e.periodStartDate;
          if (!dateStr) return false;
          try {
            const entryDate = new Date(`${dateStr}T00:00:00Z`);
            if (e.entryType === "periodSummary")
              return (
                entryDate >= currentPeriod.start &&
                entryDate <= currentPeriod.end &&
                entryDate <= today
              );
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
          // console.log(`Est. Pay Current Period: ${estimatedCurrentPeriodPay}`);
        }
      }

      // 5. Determine Status and Due Date (Using logic from previous step)
      let status = "Paid Up";
      let displayDueDate = null;
      let isOverdue = false;
      // A: Calculate potential overdue status *independently*
      if (lastCompletedPeriodEnd) {
        const dueDateForLastPeriod = estimateDueDateForCompletedPeriod(
          lastCompletedPeriodEnd,
          practice.payCycle,
          practice.paymentDetail
        );
        if (dueDateForLastPeriod && dueDateForLastPeriod < today) {
          isOverdue = true;
          displayDueDate = dueDateForLastPeriod;
        } else if (dueDateForLastPeriod) {
          displayDueDate = dueDateForLastPeriod;
        }
      }
      // B: Determine the FINAL status based on balance and W2 check
      if (overallBalance > 0.01) {
        if (practice.taxStatus === "employee") {
          const maxExpectedTaxWithholding =
            totalCalculatedPayForCompletedPeriods *
            W2_DISCREPANCY_THRESHOLD_PERCENT;
          if (
            totalCalculatedPayForCompletedPeriods > 0 &&
            overallBalance <= maxExpectedTaxWithholding
          ) {
            status = "W2 Discrepancy";
            // Keep isOverdue/displayDueDate calculated in step A for context
          } else {
            status = isOverdue
              ? "Overdue"
              : displayDueDate
              ? "Due Soon"
              : "Owed";
          } // Balance exceeds threshold
        } else {
          status = isOverdue ? "Overdue" : displayDueDate ? "Due Soon" : "Owed";
        } // Not employee
      } else {
        status = "Paid Up";
        isOverdue = false;
        displayDueDate = null;
      } // Paid or overpaid
      // console.log(`[calculatePracticeBalances] ${practice.name}: Final Status -> ${status}, isOverdue: ${isOverdue}, Due: ${logDate(displayDueDate)}`);

      const result = {
        practiceId: practice.id,
        practiceName: practice.name,
        balance: overallBalance > 0.01 ? overallBalance : 0,
        estimatedCurrentPeriodPay: estimatedCurrentPeriodPay,
        status: status,
        isOverdue: isOverdue,
        displayDueDate:
          status === "Overdue" || status === "Due Soon" ? displayDueDate : null, // Only show date if relevant to status
        taxStatus: practice.taxStatus,
        currentPeriod: currentPeriod,
        _debug: {
          totalCalcPayCompleted: totalCalculatedPayForCompletedPeriods,
          totalPayments: totalConfirmedPaymentsToDate,
          /* Changed */ lastPeriodEnd: logDate(lastCompletedPeriodEnd),
          numHistoricalPeriods: historicalPeriods.length,
        },
      };
      return result;
    })
    // Keep filter and sort logic
    .filter(
      (b) =>
        b.balance > 0.01 ||
        b.estimatedCurrentPeriodPay > 0.01 ||
        b.status === "W2 Discrepancy"
    )
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
      if (orderA !== orderB) return orderA - orderB;
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.balance !== b.balance) return b.balance - a.balance;
      return b.estimatedCurrentPeriodPay - a.estimatedCurrentPeriodPay;
    });

  // console.log(`[calculatePracticeBalances] Final Sorted Balances Returned:`, JSON.stringify(balanceInfo, null, 2));
  return balanceInfo;
};
