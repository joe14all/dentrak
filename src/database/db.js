/* eslint-disable no-unused-vars */
import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version history must be in sequential order from oldest to newest
// Define all versions in order

db.version(11)
  .stores({
    practices: "++id, name, status, taxStatus",
    entries: "++id, practiceId, date, entryType",
    payments:
      "++id, practiceId, paymentDate, linkedChequeId, linkedDirectDepositId, linkedETransferId",
    cheques: "++id, practiceId, status, dateReceived",
    directDeposits: "++id, practiceId, paymentDate",
    eTransfers: "++id, practiceId, status, paymentDate",
    scheduleBlocks: "++id, startDate, endDate",
    reports: "++id, name, type, createdAt",
    goals: "++id, type, timePeriod, year, month, practiceId, [year+month]",
    entryTemplates: "++id, name, practiceId, createdAt",
    expenses: "++id, date, category, practiceId, year, [year+category]",
  })
  .upgrade((tx) => {
    console.log(
      "Upgrading database to version 11, adding expenses table for tax tracking."
    );
  });

// Don't call db.open() here - let Dexie open it lazily when first accessed
// This prevents conflicts with multiple contexts trying to open simultaneously
