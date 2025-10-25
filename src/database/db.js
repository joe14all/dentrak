/* eslint-disable no-unused-vars */
import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version 8: Adds goals table with compound index.
db.version(8)
  .stores({
    practices: "++id, name, status, taxStatus",
    entries: "++id, practiceId, date, entryType",
    payments: "++id, practiceId, paymentDate",
    cheques: "++id, practiceId, status, dateReceived",
    directDeposits: "++id, practiceId, paymentDate",
    eTransfers: "++id, practiceId, status, paymentDate",
    scheduleBlocks: "++id, startDate, endDate",
    reports: "++id, name, type, createdAt",
    // Corrected goals table definition with the compound index
    goals: "++id, type, timePeriod, year, month, practiceId, [year+month]",
  })
  .upgrade((tx) => {
    console.log(
      "Upgrading database to version 8, adding goals table with [year+month] index if it doesn't exist."
    );
  });

// Apply previous versions migrations if necessary
db.version(7).stores({
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date, entryType",
  payments: "++id, practiceId, paymentDate",
  cheques: "++id, practiceId, status, dateReceived",
  directDeposits: "++id, practiceId, paymentDate",
  eTransfers: "++id, practiceId, status, paymentDate",
  scheduleBlocks: "++id, startDate, endDate",
  reports: "++id, name, type, createdAt", // Ensure reports is defined in previous versions too
});

db.version(6).stores({
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date, entryType",
  payments: "++id, practiceId, paymentDate",
  cheques: "++id, practiceId, status, dateReceived",
  directDeposits: "++id, practiceId, paymentDate",
  eTransfers: "++id, practiceId, status, paymentDate",
  // Removed 'preferences' table from previous schemas if upgrading from < v6
});

// Ensure DB is open
db.open().catch((err) => {
  console.error(`Failed to open db: ${err.stack || err}`);
});
