import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version 7: Adds the new 'reports' table for storing generated reports.
db.version(7).stores({
  // Tables from previous versions, carried forward:
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date, entryType",
  payments: "++id, practiceId, paymentDate",
  cheques: "++id, practiceId, status, dateReceived",
  directDeposits: "++id, practiceId, paymentDate",
  eTransfers: "++id, practiceId, status, paymentDate",
  preferences: "++key",

  // New table for this version:
  reports: "++id, name, type, createdAt", // Indexed for efficient querying and sorting
});
