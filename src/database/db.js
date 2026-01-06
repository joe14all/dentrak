/* eslint-disable no-unused-vars */
import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version history must be in sequential order from oldest to newest
// Define all versions in order

db.version(12)
  .stores({
    practices: "++id, name, status, taxStatus",
    entries: "++id, practiceId, date, entryType",
    payments:
      "++id, practiceId, paymentDate, linkedChequeId, linkedDirectDepositId, linkedETransferId, externalId",
    cheques: "++id, practiceId, status, dateReceived, externalId",
    directDeposits: "++id, practiceId, paymentDate, externalId",
    eTransfers: "++id, practiceId, status, paymentDate, externalId",
    scheduleBlocks: "++id, startDate, endDate",
    reports: "++id, name, type, createdAt",
    goals: "++id, type, timePeriod, year, month, practiceId, [year+month]",
    entryTemplates: "++id, name, practiceId, createdAt",
    expenses: "++id, date, category, practiceId, year, [year+category]",
    // Bank Sync tables
    pendingBankTransactions:
      "++id, tellerTransactionId, status, date, practiceId, externalId",
    bankConnections: "++id, accountId, institutionName",
    bankSyncSettings: "++id, settingsKey",
  })
  .upgrade((tx) => {
    console.log(
      "Upgrading database to version 12, adding bank sync tables for Teller integration."
    );
  });

// Don't call db.open() here - let Dexie open it lazily when first accessed
// This prevents conflicts with multiple contexts trying to open simultaneously
