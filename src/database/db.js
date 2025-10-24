/* eslint-disable no-unused-vars */
import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version 7: Adds scheduleBlocks table.
db.version(7)
  .stores({
    practices: "++id, name, status, taxStatus",
    entries: "++id, practiceId, date, entryType",
    payments: "++id, practiceId, paymentDate",
    cheques: "++id, practiceId, status, dateReceived",
    directDeposits: "++id, practiceId, paymentDate",
    eTransfers: "++id, practiceId, status, paymentDate",
    scheduleBlocks: "++id, startDate, endDate", // New table for schedule blocks
  })
  .upgrade((tx) => {
    // Migration logic for future versions can go here if needed.
    // For adding a table, Dexie handles it automatically if the table doesn't exist.
    console.log(
      "Upgrading database to version 7, adding scheduleBlocks table if it doesn't exist."
    );
  });

// Apply previous versions migrations if necessary (e.g., coming from v6 or lower)
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
